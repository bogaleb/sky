'use server';

import { createClient } from '@/lib/supabase/server';
import { weekStartMonday, clampTarget, goalReached, type GoalProgress } from '@/lib/kid/goals';
import { awardStickers } from './rewards';
import { checkTrophies } from './trophies';

export type { GoalProgress };

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

type Db = Awaited<ReturnType<typeof requireChild>>;

async function goalProgressInternal(supabase: Db, childId: string): Promise<GoalProgress> {
  const weekStart = weekStartMonday();
  const { data: goal } = await supabase
    .from('parent_goals')
    .select('target, celebrated, week_start')
    .eq('child_id', childId)
    .maybeSingle();
  // A row from a previous week is stale: treat the week as fresh.
  const current = goal && goal.week_start === weekStart ? goal : null;

  const { count } = await supabase
    .from('learning_events')
    .select('id', { count: 'exact', head: true })
    .eq('child_id', childId)
    .eq('event_type', 'attempt')
    .gte('created_at', `${weekStart}T00:00:00.000Z`);

  return {
    target: current?.target ?? 5,
    completed: count ?? 0,
    weekStart,
    celebrated: current?.celebrated ?? false,
  };
}

/** Set (or replace) this week's activity target for a child. */
export async function setWeeklyGoal(childId: string, target: number): Promise<GoalProgress> {
  const supabase = await requireChild(childId);
  const safeTarget = clampTarget(target);
  const weekStart = weekStartMonday();
  const { error } = await supabase.from('parent_goals').upsert(
    { child_id: childId, week_start: weekStart, target: safeTarget, celebrated: false },
    { onConflict: 'child_id' }
  );
  if (error) throw new Error('Could not save the weekly goal.');
  return goalProgressInternal(supabase, childId);
}

/** This week's goal progress. Fires the completion celebration best-effort. */
export async function getGoalProgress(childId: string): Promise<GoalProgress> {
  const supabase = await requireChild(childId);
  const progress = await goalProgressInternal(supabase, childId);
  // Celebration is a nice-to-have; the progress read never blocks on it.
  void checkGoalComplete(childId).catch(() => {});
  return progress;
}

/**
 * Award the weekly-goal completion (once per week): mark celebrated, grant
 * the goal-getter sticker and fire the goal_done trophy event. Idempotent.
 */
export async function checkGoalComplete(childId: string): Promise<boolean> {
  const supabase = await requireChild(childId);
  const progress = await goalProgressInternal(supabase, childId);
  if (!goalReached(progress.completed, progress.target) || progress.celebrated) return false;

  await supabase
    .from('parent_goals')
    .update({ celebrated: true })
    .eq('child_id', childId)
    .eq('week_start', progress.weekStart);

  // The 'goal-getter' sticker is awarded on the child's weekly goal completion.
  await awardStickers(childId, ['goal-getter']).catch(() => {});
  await checkTrophies(childId, 'goal_done').catch(() => {});
  return true;
}
