'use server';

import { createClient } from '@/lib/supabase/server';
import { getSessionPlan, logLearningEvent } from '@/app/actions/learning';
import { getTrailStop, TRAIL_LENGTH, questNumber, chapterName } from '@/lib/kid/trail';
import { dailyQuests, getQuestDef, questDateKey, type QuestDef } from '@/lib/kid/quests';
import { checkTrophies } from '@/app/actions/trophies';
import { awardStickers } from '@/app/actions/rewards';
import { nextStreak, streakGraceDays, type StreakTickStatus } from '@/lib/kid/calendar';
import type { Trophy, TrophyEvent } from '@/lib/kid/trophies';

/** Daily quest ids that mark a first-time game experience for trophies. */
const QUEST_GAME_TROPHY_EVENT: Record<string, TrophyEvent> = {
  memory_game: 'memory_done',
  story_read: 'story_done',
  song_sung: 'song_done',
  pattern_game: 'pattern_done',
  puzzle_game: 'puzzle_done',
};

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

// ---------------------------------------------------------------------------
// Trail state
// ---------------------------------------------------------------------------

export interface TrailState {
  position: number;
  questsCompleted: number;
  totalStops: number;
  questNo: number;
  chapter: string;
  stop: ReturnType<typeof getTrailStop>;
  streak: number;
  quests: Array<QuestDef & { progress: number; completed: boolean }>;
}

export async function getTrailState(childId: string): Promise<TrailState> {
  const supabase = await requireChild(childId);
  const today = questDateKey();

  const [{ data: tp }, { data: st }, { data: qp }] = await Promise.all([
    supabase.from('trail_progress').select('position, quests_completed').eq('child_id', childId).maybeSingle(),
    supabase.from('streaks').select('current_streak').eq('child_id', childId).maybeSingle(),
    supabase.from('quest_progress').select('quest_id, progress, completed').eq('child_id', childId).eq('quest_date', today),
  ]);

  const position = Math.min(tp?.position ?? 0, TRAIL_LENGTH - 1);
  const stop = getTrailStop(position);
  const defs = dailyQuests(childId, today);
  const byId = new Map((qp ?? []).map((r) => [r.quest_id, r]));
  const quests = defs.map((d) => {
    const row = byId.get(d.id);
    return { ...d, progress: Math.min(row?.progress ?? 0, d.goal), completed: row?.completed ?? false };
  });

  return {
    position,
    questsCompleted: tp?.quests_completed ?? 0,
    totalStops: TRAIL_LENGTH,
    questNo: questNumber(position),
    chapter: chapterName(stop.chapter),
    stop,
    streak: st?.current_streak ?? 0,
    quests,
  };
}

// ---------------------------------------------------------------------------
// Trail quest plan: 4 activities from the current stop's skill + level.
// (The content bank holds exactly 4 activities per skill/level — a quest
// plays the complete set for its stop.)
// ---------------------------------------------------------------------------

export async function getTrailPlan(childId: string) {
  const supabase = await requireChild(childId);
  const { data: tp } = await supabase
    .from('trail_progress')
    .select('position')
    .eq('child_id', childId)
    .maybeSingle();
  const stop = getTrailStop(tp?.position ?? 0);
  const res = await getSessionPlan(childId, {
    sessionLength: 4,
    trailStop: { skillCode: stop.skillCode, level: stop.level },
  });
  return { ...res, stop };
}

// ---------------------------------------------------------------------------
// Quest progress helper (also used by pet, memory, storybook, songbook).
// ---------------------------------------------------------------------------

export async function bumpQuestProgress(
  childId: string,
  questId: string,
  amount: number
): Promise<{ completed: boolean; stars: number }> {
  const def = getQuestDef(questId);
  if (!def) return { completed: false, stars: 0 };
  const supabase = await requireChild(childId);
  const today = questDateKey();

  // Atomic bump: the database reports whether THIS call newly completed the
  // quest, so the one-time completion bonus is awarded exactly once.
  const { data, error } = await supabase.rpc('bump_quest_progress', {
    p_child_id: childId,
    p_quest_date: today,
    p_quest_id: questId,
    p_amount: Math.max(0, Math.round(amount)),
    p_goal: def.goal,
  });
  if (error) throw new Error('Could not update quest progress.');
  const row = (Array.isArray(data) ? data[0] : data) as
    | { progress: number; completed: boolean; newly_completed: boolean }
    | undefined;
  const newlyCompleted = row?.newly_completed ?? false;

  if (newlyCompleted && def.stars > 0) {
    await supabase.rpc('award_stars', { p_child_id: childId, p_amount: def.stars });
    // Wave 10 honesty: quest bonuses are real star awards, so they join the
    // weekly tally feed (the Showdown sums every milestone with metadata.stars).
    void logLearningEvent(childId, 'milestone', {
      metadata: { kind: 'quest_complete', questId, stars: def.stars },
    }).catch(() => {});
  }

  if (newlyCompleted) {
    // Trophy checks are best-effort: a missed check is retried on the next
    // completion because awards are idempotent.
    void checkTrophies(childId, 'quest_done').catch(() => {});
    void awardStickers(childId, ['quest-hero']).catch(() => {});
    const gameEvent = QUEST_GAME_TROPHY_EVENT[questId];
    if (gameEvent) void checkTrophies(childId, gameEvent).catch(() => {});
  }

  return { completed: newlyCompleted, stars: newlyCompleted ? def.stars : 0 };
}

// ---------------------------------------------------------------------------
// Daily activity: streak maintenance. Called when a session completes.
// Forgiving by design: a missed day pauses the streak instead of resetting
// it to 1 (see nextStreak in lib/kid/calendar) — gentlest for the 3–4 band.
// ---------------------------------------------------------------------------

export async function recordDailyActivity(childId: string): Promise<{
  streak: number;
  isNewDay: boolean;
  newTrophies: Trophy[];
  streakStatus: StreakTickStatus;
}> {
  const supabase = await requireChild(childId);
  const today = questDateKey();

  const [{ data: row }, { data: childRow }] = await Promise.all([
    supabase
      .from('streaks')
      .select('current_streak, longest_streak, last_active_date')
      .eq('child_id', childId)
      .maybeSingle(),
    supabase.from('children').select('age_band').eq('id', childId).maybeSingle(),
  ]);

  const tick = nextStreak(
    row?.current_streak ?? 0,
    row?.longest_streak ?? 0,
    row?.last_active_date ?? null,
    today,
    streakGraceDays((childRow?.age_band as string | null) ?? null),
  );

  if (tick.status === 'already') {
    return { streak: tick.current, isNewDay: false, newTrophies: [], streakStatus: tick.status };
  }

  await supabase.from('streaks').upsert(
    { child_id: childId, current_streak: tick.current, longest_streak: tick.longest, last_active_date: today },
    { onConflict: 'child_id' }
  );
  const newTrophies = await checkTrophies(childId, 'streak_day').catch(() => [] as Trophy[]);
  // Streak stickers are idempotent — safe to attempt on every new day.
  const streakStickers = ['comeback-kid'];
  if (tick.current === 3) streakStickers.push('streak-3');
  if (tick.current === 7) streakStickers.push('streak-7');
  void awardStickers(childId, streakStickers).catch(() => {});
  return { streak: tick.current, isNewDay: true, newTrophies, streakStatus: tick.status };
}

// ---------------------------------------------------------------------------
// completeTrailQuest: advance the trail, keep the streak, bump the
// Trailblazer daily quest, log a milestone. Returns the next stop for the
// celebration screen.
//
// NOTE: generic daily-quest bumps (activities played, stars earned, islands
// visited) are the session player's job — it already bumps them on every
// session completion. This function only handles trail-specific progress so
// trail quests are never double-counted.
// ---------------------------------------------------------------------------

export async function completeTrailQuest(
  childId: string
): Promise<{ nextStop: ReturnType<typeof getTrailStop>; questsCompleted: number; streak: number }> {
  const supabase = await requireChild(childId);

  const { data: tp } = await supabase
    .from('trail_progress')
    .select('position, quests_completed')
    .eq('child_id', childId)
    .maybeSingle();
  const position = Math.min(tp?.position ?? 0, TRAIL_LENGTH - 1);
  const stop = getTrailStop(position);
  const nextPosition = Math.min(position + 1, TRAIL_LENGTH - 1);
  const questsCompleted = (tp?.quests_completed ?? 0) + 1;

  await supabase.from('trail_progress').upsert(
    { child_id: childId, position: nextPosition, quests_completed: questsCompleted },
    { onConflict: 'child_id' }
  );

  // Crossing into a new chapter = the finished chapter is complete.
  if (getTrailStop(nextPosition).chapter !== getTrailStop(position).chapter) {
    void checkTrophies(childId, 'trail_chapter').catch(() => {});
  }

  const { streak } = await recordDailyActivity(childId);
  await bumpQuestProgress(childId, 'trail_quest', 1);
  void awardStickers(childId, ['trail-blazer']).catch(() => {});

  await logLearningEvent(childId, 'milestone', {
    metadata: {
      kind: 'trail_quest_complete',
      quest_no: questNumber(position),
      quest_title: stop.questTitle,
      skill: stop.skillCode,
      level: stop.level,
      streak,
    },
  }).catch(() => {});

  return { nextStop: getTrailStop(nextPosition), questsCompleted, streak };
}
