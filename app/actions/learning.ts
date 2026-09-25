'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { planSession, type PlanOptions } from '@/lib/planner/session';
import type {
  ActivityCard,
  AgeBand,
  AttemptSummary,
  MasteryState,
  PlannedActivity,
  PlannerInput,
  SessionPlan,
  SkillInfo,
} from '@/lib/planner/types';

// ---------------------------------------------------------------------------
// Authorization helper: the child must belong to the signed-in parent.
// ---------------------------------------------------------------------------

async function requireChild(childId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: child } = await supabase
    .from('children')
    .select('id, age_band')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single();
  if (!child) throw new Error('Child not found.');
  return { supabase, child: child as { id: string; age_band: AgeBand } };
}

// ---------------------------------------------------------------------------
// getSessionPlan: load the learning snapshot, run the pure planner, return
// client-safe activities (answer keys never leave the server).
// ---------------------------------------------------------------------------

export interface SessionPlanResult {
  plan: Array<{
    activity: ActivityCard;
    reason: PlannedActivity['reason'];
    targetLevel: number;
    /** Client-safe card from fetch_activity_card (answer stripped). */
    card: unknown;
  }>;
  notes: string[];
  frustrated: boolean;
}

export async function getSessionPlan(
  childId: string,
  options: PlanOptions = {}
): Promise<SessionPlanResult> {
  const { supabase, child } = await requireChild(childId);
  // The activities table has no client SELECT policy (answer keys must never
  // be readable client-side), so the planner's candidate pool loads through
  // the service client. We select only client-safe columns — never `answer`.
  const service = createServiceClient();

  const [{ data: skills }, { data: masteryRows }, { data: prereqs }, { data: activities }, { data: events }] =
    await Promise.all([
      supabase.from('skills').select('id, code, subject_code, name, age_min, age_max'),
      supabase.from('skill_mastery').select('*').eq('child_id', child.id),
      supabase.from('skill_prerequisites').select('skill_id, requires_skill_id, requires_level'),
      service
        .from('activities')
        .select('id, skill_id, level, kind, prompt_text, points, min_age_band, max_age_band'),
      supabase
        .from('learning_events')
        .select('skill_id, activity_id, is_correct, created_at')
        .eq('child_id', child.id)
        .eq('event_type', 'attempt')
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

  const skillInfos: SkillInfo[] = (skills ?? []).map((s) => ({
    id: s.id,
    code: s.code,
    subjectCode: s.subject_code,
    name: s.name,
    ageMin: s.age_min,
    ageMax: s.age_max,
  }));

  const mastery = new Map<string, MasteryState>();
  for (const m of masteryRows ?? []) {
    mastery.set(m.skill_id, {
      skillId: m.skill_id,
      currentLevel: m.current_level,
      status: m.status as MasteryState['status'],
      attempts: m.attempts,
      correct: m.correct,
      streak: m.streak,
      lastPracticedAt: m.last_practiced_at,
      nextReviewAt: m.next_review_at,
    });
  }

  const activityCards: ActivityCard[] = (activities ?? []).map((a) => ({
    id: a.id,
    skillId: a.skill_id,
    level: a.level,
    kind: a.kind,
    promptText: a.prompt_text,
    points: a.points,
    minAgeBand: a.min_age_band as AgeBand,
    maxAgeBand: a.max_age_band as AgeBand,
  }));

  const recentAttempts: AttemptSummary[] = (events ?? [])
    .filter((e) => e.activity_id)
    .map((e) => ({
      skillId: e.skill_id ?? '',
      activityId: e.activity_id as string,
      isCorrect: e.is_correct ?? false,
      createdAt: e.created_at,
    }));

  const input: PlannerInput = {
    childAgeBand: child.age_band,
    skills: skillInfos,
    mastery,
    prerequisites: (prereqs ?? []).map((p) => ({
      skillId: p.skill_id,
      requiresSkillId: p.requires_skill_id,
      requiresLevel: p.requires_level,
    })),
    activities: activityCards,
    recentAttempts,
    now: new Date(),
  };

  const plan: SessionPlan = planSession(input, options);

  // Resolve each planned activity through fetch_activity_card so the client
  // only ever receives the answer-stripped card.
  const resolved = await Promise.all(
    plan.activities.map(async (p) => {
      const { data, error } = await supabase.rpc('fetch_activity_card', {
        p_child_id: child.id,
        p_activity_id: p.activity.id,
      });
      if (error || !data) throw new Error('Could not load activity.');
      return {
        activity: p.activity,
        reason: p.reason,
        targetLevel: p.targetLevel,
        card: data,
      };
    })
  );

  return { plan: resolved, notes: plan.notes, frustrated: plan.frustrated };
}

// ---------------------------------------------------------------------------
// submitActivityAttempt: grade server-side via submit_attempt (never returns
// the answer key — the RPC returns only correct/points/streak/status).
// ---------------------------------------------------------------------------

export interface AttemptResult {
  correct: boolean;
  pointsEarned: number;
  streak: number;
  status: string;
  currentLevel: number;
  leveledUp: boolean;
}

export async function submitActivityAttempt(
  childId: string,
  activityId: string,
  answer: unknown,
  latencyMs?: number,
  sessionId?: string
): Promise<AttemptResult> {
  const { supabase, child } = await requireChild(childId);
  const { data, error } = await supabase.rpc('submit_attempt', {
    p_child_id: child.id,
    p_activity_id: activityId,
    p_answer: answer as never,
    p_latency_ms: latencyMs ?? null,
    p_session_id: sessionId ?? null,
  });
  if (error || !data) throw new Error('Could not submit attempt.');
  const r = data as unknown as {
    correct: boolean;
    points_earned: number;
    streak: number;
    status: string;
    current_level: number;
    leveled_up: boolean;
  };
  return {
    correct: r.correct,
    pointsEarned: r.points_earned,
    streak: r.streak,
    status: r.status,
    currentLevel: r.current_level,
    leveledUp: r.leveled_up,
  };
}

// ---------------------------------------------------------------------------
// logLearningEvent: record non-attempt events (hint_used, show_me,
// frustration_flag, break_taken, milestone). Attempts are logged by
// submit_attempt itself.
// ---------------------------------------------------------------------------

const ALLOWED_EVENT_TYPES = new Set([
  'hint_used',
  'show_me',
  'demo_watched',
  'milestone',
  'break_taken',
  'frustration_flag',
]);

export async function logLearningEvent(
  childId: string,
  eventType: string,
  opts: { skillId?: string; activityId?: string; sessionId?: string; metadata?: Record<string, unknown> } = {}
): Promise<string> {
  if (!ALLOWED_EVENT_TYPES.has(eventType)) throw new Error('Unknown event type.');
  const { supabase, child } = await requireChild(childId);
  const { data, error } = await supabase.rpc('log_event', {
    p_child_id: child.id,
    p_event_type: eventType,
    p_skill_id: opts.skillId ?? null,
    p_activity_id: opts.activityId ?? null,
    p_session_id: opts.sessionId ?? null,
    p_metadata: (opts.metadata ?? {}) as never,
  });
  if (error || !data) throw new Error('Could not log event.');
  return data;
}
