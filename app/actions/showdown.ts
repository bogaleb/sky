'use server';

import { createClient } from '@/lib/supabase/server';
import { weekKey } from '@/lib/kid/showdown';

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
 * Weekly totals per child, honest metric. There is no star ledger table —
 * star_balances holds lifetime totals only — so weekly stars are summed from
 * `session_complete` milestone metadata, the same convention the parent
 * dashboard uses for stars7d. Weekly activities count `attempt` events.
 * Read-only on existing tables; no migrations needed.
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
  const mondayIso = `${weekKey()}T00:00:00.000Z`;

  const { data: events } = await supabase
    .from('learning_events')
    .select('child_id, event_type, skill_id, metadata, created_at')
    .in('child_id', childIds)
    .gte('created_at', mondayIso)
    .limit(4000);
  const rows = (events ?? []) as Array<{
    child_id: string;
    event_type: string;
    skill_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;

  const starsByChild = new Map<string, number>();
  const activitiesByChild = new Map<string, number>();
  for (const e of rows) {
    if (e.event_type === 'milestone' && (e.metadata as { kind?: string }).kind === 'session_complete') {
      starsByChild.set(
        e.child_id,
        (starsByChild.get(e.child_id) ?? 0) + Number((e.metadata as { stars?: number }).stars ?? 0),
      );
    } else if (e.event_type === 'attempt' && e.skill_id) {
      activitiesByChild.set(e.child_id, (activitiesByChild.get(e.child_id) ?? 0) + 1);
    }
  }

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
  return familyWeeklyRows(supabase, userId);
}
