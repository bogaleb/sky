'use server';

import { isParentZoneUnlocked, lockParentZone, requireParentZone, unlockParentZone } from '@/lib/parent-zone';
import { createClient } from '@/lib/supabase/server';
import { buildWeeklyDigest, buildMasteryDelta } from '@/lib/parent/digest';
import type {
  ChildDashboard,
  FocusSkill,
  MasteryAttempt,
  MasteryDelta,
  SkillMasteryDetail,
  SubjectMastery,
  TopSkill,
  WeeklyDigest,
} from '@/lib/parent/digest';

export type {
  ChildDashboard,
  FocusSkill,
  MasteryAttempt,
  MasteryDelta,
  SkillMasteryDetail,
  SubjectMastery,
  TopSkill,
  WeeklyDigest,
};

const SUBJECT_NAMES: Record<string, string> = {
  reading: 'Reading',
  math: 'Math',
  writing: 'Writing',
  science: 'Science',
  geography: 'Geography',
  coding: 'Coding',
  music: 'Music',
  drawing: 'Drawing',
  feelings: 'Feelings & Focus',
};

async function requireParent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  return { supabase, userId: user.id };
}

export async function getDashboardData(): Promise<ChildDashboard[]> {
  const { supabase, userId } = await requireParent();
  await requireParentZone(supabase);

  const { data: children, error: childError } = await supabase
    .from('children')
    .select('id, nickname, avatar_id, age_band')
    .eq('parent_id', userId)
    .order('created_at', { ascending: true });
  if (childError) throw new Error('Could not load children.');
  if (!children || children.length === 0) return [];

  const childIds = children.map((c) => c.id as string);

  // Skills catalog (for per-subject totals and names).
  const { data: skills } = await supabase.from('skills').select('id, subject_code, name');
  const skillRows = (skills ?? []) as Array<{ id: string; subject_code: string; name: string }>;
  const totalBySubject = new Map<string, number>();
  const subjectBySkill = new Map<string, string>();
  const nameBySkill = new Map<string, string>();
  for (const s of skillRows) {
    totalBySubject.set(s.subject_code, (totalBySubject.get(s.subject_code) ?? 0) + 1);
    subjectBySkill.set(s.id, s.subject_code);
    nameBySkill.set(s.id, s.name);
  }

  // Subjects catalog (island grouping + display names).
  const { data: subjectRows } = await supabase.from('subjects').select('code, name, island_name');
  const subjectNameByCode = new Map<string, string>();
  const islandBySubject = new Map<string, string>();
  for (const s of (subjectRows ?? []) as Array<{ code: string; name: string; island_name: string }>) {
    subjectNameByCode.set(s.code, s.name);
    islandBySubject.set(s.code, s.island_name);
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();

  // Mastery rows for all children.
  const { data: masteryRows } = await supabase
    .from('skill_mastery')
    .select('child_id, skill_id, status, current_level, attempts, correct, last_practiced_at, mastered_at')
    .in('child_id', childIds);
  const masteryByChild = new Map<
    string,
    Array<{
      skill_id: string;
      status: string;
      current_level: number;
      attempts: number;
      correct: number;
      last_practiced_at: string | null;
      mastered_at: string | null;
    }>
  >();
  for (
    const m of (masteryRows ?? []) as Array<{
      child_id: string;
      skill_id: string;
      status: string;
      current_level: number;
      attempts: number;
      correct: number;
      last_practiced_at: string | null;
      mastered_at: string | null;
    }>
  ) {
    const list = masteryByChild.get(m.child_id) ?? [];
    list.push(m);
    masteryByChild.set(m.child_id, list);
  }

  // Learning events in the last 30 days (sessions, attempts, milestones).
  // difficulty_level is the item/activity difficulty on each attempt — the
  // raw material for the weekly mastery-delta estimate (no history table).
  const { data: events } = await supabase
    .from('learning_events')
    .select('child_id, event_type, skill_id, difficulty_level, metadata, created_at')
    .in('child_id', childIds)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(4000);
  const eventRows = (events ?? []) as Array<{
    child_id: string;
    event_type: string;
    skill_id: string | null;
    difficulty_level: number | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;

  // Streaks for all children.
  const { data: streakRows } = await supabase
    .from('streaks')
    .select('child_id, current_streak, longest_streak')
    .in('child_id', childIds);
  const streakByChild = new Map<string, { current_streak: number; longest_streak: number }>();
  for (
    const s of (streakRows ?? []) as Array<{ child_id: string; current_streak: number; longest_streak: number }>
  ) {
    streakByChild.set(s.child_id, s);
  }

  // Daily quests completed in the last 7 days.
  const { data: questRows } = await supabase
    .from('quest_progress')
    .select('child_id')
    .in('child_id', childIds)
    .eq('completed', true)
    .gte('completed_at', sevenDaysAgo);
  const questsByChild = new Map<string, number>();
  for (const q of (questRows ?? []) as Array<{ child_id: string }>) {
    questsByChild.set(q.child_id, (questsByChild.get(q.child_id) ?? 0) + 1);
  }

  // Sticker counts.
  const { data: stickerRows } = await supabase
    .from('sticker_awards')
    .select('child_id')
    .in('child_id', childIds);
  const stickersByChild = new Map<string, number>();
  for (const s of (stickerRows ?? []) as Array<{ child_id: string }>) {
    stickersByChild.set(s.child_id, (stickersByChild.get(s.child_id) ?? 0) + 1);
  }

  return children.map((c) => {
    const childId = c.id as string;
    const childEvents = eventRows.filter((e) => e.child_id === childId);
    const events7d = childEvents.filter((e) => e.created_at >= sevenDaysAgo);
    const sessionStarts = childEvents.filter((e) => e.event_type === 'session_start');
    const sessions30d = new Set(
      sessionStarts.map((e) => (e.metadata as { sessionId?: string }).sessionId ?? e.created_at),
    ).size;
    const sessions7d = new Set(
      sessionStarts
        .filter((e) => e.created_at >= sevenDaysAgo)
        .map((e) => (e.metadata as { sessionId?: string }).sessionId ?? e.created_at),
    ).size;

    const completions = childEvents.filter(
      (e) => e.event_type === 'milestone' && (e.metadata as { kind?: string }).kind === 'session_complete',
    );
    const recent7d = completions.filter((e) => e.created_at >= sevenDaysAgo);
    const stars7d = recent7d.reduce((s, e) => s + Number((e.metadata as { stars?: number }).stars ?? 0), 0);
    const points7d = recent7d.reduce((s, e) => s + Number((e.metadata as { points?: number }).points ?? 0), 0);

    // Activities answered in the last 7 days.
    const attempts7d = events7d.filter((e) => e.event_type === 'attempt' && e.skill_id);
    const activities7d = attempts7d.length;

    // Per-skill attempt evidence for the weekly mastery delta: the week's
    // opening practice difficulty estimates the level the child started at.
    const deltaAttemptsBySkill = new Map<string, MasteryAttempt[]>();
    for (const e of attempts7d) {
      const sid = e.skill_id as string;
      const list = deltaAttemptsBySkill.get(sid) ?? [];
      list.push({ difficultyLevel: e.difficulty_level ?? null, at: e.created_at });
      deltaAttemptsBySkill.set(sid, list);
    }

    // Learning time: pair session_start with session_complete by sessionId,
    // cap each session at 90 minutes to ignore abandoned tabs.
    const MAX_SESSION_MS = 90 * 60 * 1000;
    const startBySession = new Map<string, number>();
    for (const e of childEvents) {
      if (e.event_type !== 'session_start') continue;
      const sid = (e.metadata as { sessionId?: string }).sessionId;
      if (sid && !startBySession.has(sid)) startBySession.set(sid, new Date(e.created_at).getTime());
    }
    let timePlayedMinutes7d = 0;
    for (const e of recent7d) {
      const sid = (e.metadata as { sessionId?: string }).sessionId;
      const start = sid ? startBySession.get(sid) : undefined;
      if (start === undefined) continue;
      const ms = new Date(e.created_at).getTime() - start;
      if (ms > 0) timePlayedMinutes7d += Math.round(Math.min(ms, MAX_SESSION_MS) / 60000);
    }

    // Top 3 practiced skills in the last 7 days.
    const attemptsBySkill = new Map<string, number>();
    for (const e of attempts7d) {
      const sid = e.skill_id as string;
      attemptsBySkill.set(sid, (attemptsBySkill.get(sid) ?? 0) + 1);
    }
    const topSkills: TopSkill[] = [...attemptsBySkill.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([skillId, attempts]) => {
        const subjectCode = subjectBySkill.get(skillId) ?? '';
        return {
          skillName: nameBySkill.get(skillId) ?? 'A skill',
          subjectName: subjectNameByCode.get(subjectCode) ?? SUBJECT_NAMES[subjectCode] ?? subjectCode,
          attempts,
        };
      });

    // Per-subject mastery.
    const mastery = masteryByChild.get(childId) ?? [];
    const bySubject = new Map<string, Array<{ status: string; current_level: number }>>();
    for (const m of mastery) {
      const code = subjectBySkill.get(m.skill_id);
      if (!code) continue;
      const list = bySubject.get(code) ?? [];
      list.push(m);
      bySubject.set(code, list);
    }
    const subjects: SubjectMastery[] = [...totalBySubject.entries()].map(([code, total]) => {
      const rows = bySubject.get(code) ?? [];
      const mastered = rows.filter((r) => r.status === 'proficient' || r.status === 'mastered').length;
      const avgLevel = rows.length > 0 ? rows.reduce((s, r) => s + r.current_level, 0) / rows.length : 0;
      return {
        subjectCode: code,
        subjectName: subjectNameByCode.get(code) ?? SUBJECT_NAMES[code] ?? code,
        mastered,
        total,
        avgLevel: Math.round(avgLevel * 10) / 10,
      };
    });

    // Per-skill mastery detail for attempted skills.
    const skillMastery: SkillMasteryDetail[] = mastery
      .filter((m) => subjectBySkill.has(m.skill_id))
      .map((m) => {
        const code = subjectBySkill.get(m.skill_id) as string;
        const accuracyPct = m.attempts > 0 ? Math.round((m.correct / m.attempts) * 100) : null;
        return {
          skillId: m.skill_id,
          skillName: nameBySkill.get(m.skill_id) ?? 'A skill',
          subjectCode: code,
          subjectName: subjectNameByCode.get(code) ?? SUBJECT_NAMES[code] ?? code,
          islandName: islandBySubject.get(code) ?? 'Sky Park',
          currentLevel: m.current_level,
          status: m.status as SkillMasteryDetail['status'],
          attempts: m.attempts,
          correct: m.correct,
          accuracyPct,
          lastPracticedAt: m.last_practiced_at,
          masteryDelta: buildMasteryDelta({
            currentLevel: m.current_level,
            status: m.status,
            masteredAt: m.mastered_at,
            weekStartIso: sevenDaysAgo,
            attempts: deltaAttemptsBySkill.get(m.skill_id) ?? [],
          }),
        };
      })
      .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode) || a.skillName.localeCompare(b.skillName));

    // Suggested focus: the 2 lowest-level skills practiced in the last
    // 14 days that are not yet mastered.
    const focusSkills: FocusSkill[] = skillMastery
      .filter(
        (s) =>
          s.status !== 'mastered' &&
          s.lastPracticedAt !== null &&
          s.lastPracticedAt >= fourteenDaysAgo,
      )
      .sort(
        (a, b) =>
          a.currentLevel - b.currentLevel ||
          (a.accuracyPct ?? 100) - (b.accuracyPct ?? 100),
      )
      .slice(0, 2)
      .map((s) => ({
        skillName: s.skillName,
        subjectName: s.subjectName,
        islandName: s.islandName,
        currentLevel: s.currentLevel,
        suggestion:
          `“${s.skillName}” is still growing (level ${s.currentLevel} of 5` +
          (s.accuracyPct !== null ? `, ${s.accuracyPct}% correct so far` : '') +
          `). A short practice flight on ${s.islandName} this week would help it click.`,
      }));

    const streak = streakByChild.get(childId);

    // Recent milestones for the timeline.
    const recentMilestones = childEvents
      .filter((e) => e.event_type === 'milestone')
      .slice(0, 12)
      .map((e) => {
        const md = e.metadata as { kind?: string; stars?: number; points?: number; song?: string; story?: string };
        let detail = md.kind ?? 'milestone';
        if (md.kind === 'session_complete') detail = `Finished a flight: ${md.stars ?? 0} stars, ${md.points ?? 0} points`;
        else if (md.kind === 'song_finished') detail = `Sang a song with Riff`;
        else if (md.kind === 'story_finished') detail = `Finished a story with Luna`;
        else if (md.kind === 'session_start') detail = `Started a learning flight`;
        else if (md.kind === 'time_limit_reached') detail = `Reached the daily time limit — wound down for the day`;
        return { kind: md.kind ?? 'milestone', detail, at: e.created_at };
      });

    const lastActiveAt = childEvents.length > 0 ? childEvents[0].created_at : null;

    return {
      id: childId,
      nickname: c.nickname as string,
      avatarId: c.avatar_id as string,
      ageBand: c.age_band as string,
      sessions30d,
      sessions7d,
      stars7d,
      points7d,
      stickers: stickersByChild.get(childId) ?? 0,
      subjects,
      recentMilestones,
      lastActiveAt,
      activities7d,
      streak: streak?.current_streak ?? 0,
      longestStreak: streak?.longest_streak ?? 0,
      questsCompleted7d: questsByChild.get(childId) ?? 0,
      timePlayedMinutes7d,
      topSkills,
      skillMastery,
      focusSkills,
    };
  });
}

// ---------------------------------------------------------------------------
// Parent-zone PIN gate: verify the PIN server-side (hash never leaves the DB).
// ---------------------------------------------------------------------------

/**
 * Returns true when the PIN matches, and binds a 20-minute parent-zone grant
 * to this device (httpOnly cookie). Rate-limited by pin_attempts in the DB.
 */
export async function verifyParentZonePin(pin: string): Promise<boolean> {
  if (!/^\d{4,6}$/.test(pin)) return false;
  const { supabase } = await requireParent();
  return unlockParentZone(supabase, pin);
}

/** Whether this device still holds a live parent-zone grant. */
export async function parentZoneUnlocked(): Promise<boolean> {
  const { supabase } = await requireParent();
  return isParentZoneUnlocked(supabase);
}

/** Lock the parent zone on this device (revokes the server-side grant). */
export async function lockParentZoneAction(): Promise<void> {
  const { supabase } = await requireParent();
  await lockParentZone(supabase);
}

// ---------------------------------------------------------------------------
// Weekly digest: plain-language summary, stored in digest_log.
// ---------------------------------------------------------------------------

function weekStartDate(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

export async function getWeeklyDigest(childId: string): Promise<WeeklyDigest> {
  const { supabase, userId } = await requireParent();
  await requireParentZone(supabase);

  // Child must belong to this parent.
  const { data: child } = await supabase
    .from('children')
    .select('id, nickname')
    .eq('id', childId)
    .eq('parent_id', userId)
    .single();
  if (!child) throw new Error('Child not found.');

  const weekStart = weekStartDate();

  // Return a cached digest if we already generated one this week.
  const { data: cached } = await supabase
    .from('digest_log')
    .select('summary')
    .eq('child_id', childId)
    .eq('week_start', weekStart)
    .single();
  if (cached?.summary) return cached.summary as unknown as WeeklyDigest;

  const dashboards = await getDashboardData();
  const dash = dashboards.find((d) => d.id === childId);
  if (!dash) throw new Error('No data.');

  const digest = buildWeeklyDigest(dash, weekStart);

  await supabase.from('digest_log').upsert(
    { child_id: childId, week_start: weekStart, summary: JSON.parse(JSON.stringify(digest)) },
    { onConflict: 'child_id,week_start' },
  );

  return digest;
}
