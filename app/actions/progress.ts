'use server';

import { createClient } from '@/lib/supabase/server';
import { questDateKey } from '@/lib/kid/quests';
import { TRAIL_LENGTH, getTrailStop } from '@/lib/kid/trail';
import type { MasterySignal, TrailSignal } from '@/lib/kid/recommend';
import type { MasteryStatus, SkillMasterySnapshot } from '@/lib/kid/garden';

/** Per-subject progress for the sky map: mastered skills / total skills. */
export interface IslandProgress {
  subjectCode: string;
  mastered: number;
  total: number;
}

/** Everything the Up Next rail needs to build recommendations. */
export interface PracticeSignals {
  mastery: MasterySignal[];
  trail: TrailSignal;
}

async function requireChild(childId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single();
  if (!child) throw new Error('Child not found.');
  return supabase;
}

export async function getIslandProgress(childId: string): Promise<IslandProgress[]> {
  const supabase = await requireChild(childId);

  // Total skills per subject.
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('subject_code');
  if (skillsError) throw new Error('Could not load skills.');
  const totals = new Map<string, number>();
  for (const s of (skills ?? []) as Array<{ subject_code: string }>) {
    totals.set(s.subject_code, (totals.get(s.subject_code) ?? 0) + 1);
  }

  // Mastered (or proficient+) skills per subject for this child.
  const { data: mastery, error: masteryError } = await supabase
    .from('skill_mastery')
    .select('skill_id, status')
    .eq('child_id', childId)
    .in('status', ['proficient', 'mastered']);
  if (masteryError) throw new Error('Could not load progress.');

  const { data: skillRows } = await supabase
    .from('skills')
    .select('id, subject_code');
  const subjectBySkill = new Map<string, string>();
  for (const s of (skillRows ?? []) as Array<{ id: string; subject_code: string }>) {
    subjectBySkill.set(s.id, s.subject_code);
  }

  const mastered = new Map<string, number>();
  for (const m of (mastery ?? []) as Array<{ skill_id: string }>) {
    const code = subjectBySkill.get(m.skill_id);
    if (code) mastered.set(code, (mastered.get(code) ?? 0) + 1);
  }

  return [...totals.entries()].map(([subjectCode, total]) => ({
    subjectCode,
    mastered: mastered.get(subjectCode) ?? 0,
    total,
  }));
}

/**
 * Read-only signals for the Up Next recommendation rail: per-skill
 * mastery + recency from skill_mastery, plus the child's trail state
 * (next stop available? trail quest done today?).
 *
 * Never writes. The child must belong to the signed-in parent.
 */
export async function getPracticeSignals(childId: string): Promise<PracticeSignals> {
  const supabase = await requireChild(childId);

  const [{ data: skills }, { data: masteryRows }, { data: trailProgress }, { data: trailQuest }] =
    await Promise.all([
      supabase.from('skills').select('id, subject_code'),
      supabase
        .from('skill_mastery')
        .select('skill_id, status, attempts, correct, last_practiced_at, next_review_at')
        .eq('child_id', childId),
      supabase
        .from('trail_progress')
        .select('position, quests_completed')
        .eq('child_id', childId)
        .maybeSingle(),
      supabase
        .from('quest_progress')
        .select('completed')
        .eq('child_id', childId)
        .eq('quest_date', questDateKey())
        .eq('quest_id', 'trail_quest')
        .maybeSingle(),
    ]);

  const subjectBySkill = new Map<string, string>();
  for (const s of (skills ?? []) as Array<{ id: string; subject_code: string }>) {
    subjectBySkill.set(s.id, s.subject_code);
  }

  const mastery: MasterySignal[] = (
    (masteryRows ?? []) as Array<{
      skill_id: string;
      status: 'emerging' | 'developing' | 'proficient' | 'mastered';
      attempts: number;
      correct: number;
      last_practiced_at: string | null;
      next_review_at: string | null;
    }>
  )
    .filter((m) => subjectBySkill.has(m.skill_id))
    .map((m) => ({
      skillId: m.skill_id,
      islandId: subjectBySkill.get(m.skill_id) as string,
      mastery:
        m.status === 'mastered' ? 1 : m.attempts > 0 ? Math.min(1, m.correct / m.attempts) : 0,
      lastPracticedAt: m.last_practiced_at,
      attempts: m.attempts,
      nextReviewAt: m.next_review_at,
    }));

  const questsCompleted = trailProgress?.quests_completed ?? 0;
  const position = trailProgress?.position ?? 0;
  const stopIslandId =
    questsCompleted < TRAIL_LENGTH ? getTrailStop(position)?.subjectCode : undefined;

  return {
    mastery,
    trail: {
      nextStopAvailable: questsCompleted < TRAIL_LENGTH,
      trailDoneToday: trailQuest?.completed === true,
      ...(stopIslandId ? { stopIslandId } : {}),
    },
  };
}

/**
 * Everything the Today home needs: one row per skill (practiced or not) with
 * the child's mastery state. Drives today's path (spaced review) and the
 * growth garden. Read-only; the child must belong to the signed-in parent.
 */
export async function getHomeSnapshot(childId: string): Promise<SkillMasterySnapshot[]> {
  const supabase = await requireChild(childId);
  const [{ data: skills }, { data: masteryRows }] = await Promise.all([
    supabase.from('skills').select('id, code, subject_code'),
    supabase
      .from('skill_mastery')
      .select('skill_id, status, current_level, next_review_at, last_practiced_at')
      .eq('child_id', childId),
  ]);
  const bySkill = new Map(
    ((masteryRows ?? []) as Array<{
      skill_id: string;
      status: MasteryStatus;
      current_level: number;
      next_review_at: string | null;
      last_practiced_at: string | null;
    }>).map((m) => [m.skill_id, m])
  );
  return ((skills ?? []) as Array<{ id: string; code: string; subject_code: string }>).map((s) => {
    const m = bySkill.get(s.id);
    return {
      code: s.code,
      subject: s.subject_code,
      status: m?.status ?? null,
      currentLevel: m?.current_level ?? 1,
      nextReviewAt: m?.next_review_at ?? null,
      lastPracticedAt: m?.last_practiced_at ?? null,
    };
  });
}
