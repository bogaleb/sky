'use server';

import { requireParentZone } from '@/lib/parent-zone';
import { createClient } from '@/lib/supabase/server';
import { tallyWeeklyEvents, weekKey, type WeeklyEventLike } from '@/lib/kid/showdown';

export interface FamilyWeeklyRow {
  childId: string;
  nickname: string;
  avatarId: string;
  weeklyStars: number;
  weeklyActivities: number;
}

async function requireChild(childId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: child } = await supabase
    .from('children')
    .select('id, parent_id')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single();
  if (!child) throw new Error('Child not found.');
  return { supabase, parentId: child.parent_id as string };
}

async function requireParent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  return { supabase, userId: user.id };
}

/**
 * Weekly totals per child — honest metric (Wave 10).
 *
 * There is no star ledger table (star_balances holds lifetime totals only),
 * so weekly stars are summed from `learning_events`: EVERY milestone event
 * carrying a positive numeric `metadata.stars` counts — Trail
 * session_complete flights, all 30 mini-game wins, and quest-completion
 * bonuses. Each of those rows is written at the moment stars are awarded, so
 * the sum equals "stars earned this week". Weekly activities count `attempt`
 * events, as before. Read-only on existing tables; no migrations needed.
 *
 * Pagination: events are fetched in 1000-row pages ordered by created_at
 * until a short page arrives, so heavy-play families are never silently
 * truncated (the old .limit(4000) is gone).
 */
async function familyWeeklyRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parentId: string,
): Promise<FamilyWeeklyRow[]> {
  const { data: children } = await supabase
    .from('children')
    .select('id, nickname, avatar_id')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });
  const kids = (children ?? []) as Array<{ id: string; nickname: string; avatar_id: string | null }>;
  if (kids.length === 0) return [];

  const childIds = kids.map((k) => k.id);
  const mondayIso = `${weekKey()}T00:00:00.000Z`; // weekKey() is pure UTC — matches this Z filter.

  const PAGE = 1000;
  const MAX_PAGES = 20; // 20k events/week is far beyond plausible play; a cap, not a truncation.
  const all: WeeklyEventLike[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data: events, error } = await supabase
      .from('learning_events')
      .select('child_id, event_type, skill_id, metadata')
      .in('child_id', childIds)
      .gte('created_at', mondayIso)
      .order('created_at', { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw new Error('Could not load weekly activity.');
    const rows = (events ?? []) as WeeklyEventLike[];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }

  const { starsByChild, activitiesByChild } = tallyWeeklyEvents(all);

  return kids.map((k) => ({
    childId: k.id,
    nickname: k.nickname,
    avatarId: k.avatar_id ?? 'curio',
    weeklyStars: starsByChild.get(k.id) ?? 0,
    weeklyActivities: activitiesByChild.get(k.id) ?? 0,
  }));
}

/** Weekly totals for every child in the requesting child's family. */
export async function getFamilyWeeklyStars(childId: string): Promise<FamilyWeeklyRow[]> {
  const { supabase, parentId } = await requireChild(childId);
  return familyWeeklyRows(supabase, parentId);
}

/** Weekly totals for every child of the signed-in parent. */
export async function getFamilyLeaderboard(): Promise<FamilyWeeklyRow[]> {
  const { supabase, userId } = await requireParent();
  await requireParentZone(supabase);
  return familyWeeklyRows(supabase, userId);
}
