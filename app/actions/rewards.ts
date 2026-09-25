'use server';

import { createClient } from '@/lib/supabase/server';
import { getSticker } from '@/lib/kid/stickers';

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

/** Award stickers to a child. Returns the newly earned sticker ids. */
export async function awardStickers(
  childId: string,
  stickerIds: string[],
): Promise<string[]> {
  const supabase = await requireChild(childId);
  const valid = stickerIds.filter((id) => getSticker(id));
  if (valid.length === 0) return [];

  const rows = valid.map((sticker_id) => ({ child_id: childId, sticker_id }));
  const { data, error } = await supabase
    .from('sticker_awards')
    .upsert(rows, { onConflict: 'child_id,sticker_id', ignoreDuplicates: true })
    .select('sticker_id');
  if (error) throw new Error('Could not award stickers.');
  return (data ?? []).map((r) => r.sticker_id);
}

/** All sticker ids a child has earned. */
export async function getChildStickers(childId: string): Promise<string[]> {
  const supabase = await requireChild(childId);
  const { data, error } = await supabase
    .from('sticker_awards')
    .select('sticker_id, awarded_at')
    .eq('child_id', childId)
    .order('awarded_at', { ascending: true });
  if (error) throw new Error('Could not load stickers.');
  return (data ?? []).map((r) => r.sticker_id);
}

/** Current spendable star balance for a child. */
export async function getStarBalance(childId: string): Promise<{ balance: number; lifetimeEarned: number }> {
  const supabase = await requireChild(childId);
  const { data } = await supabase
    .from('star_balances')
    .select('balance, lifetime_earned')
    .eq('child_id', childId)
    .maybeSingle();
  return { balance: data?.balance ?? 0, lifetimeEarned: data?.lifetime_earned ?? 0 };
}

/** Add stars to a child's wallet (session rewards, quest bonuses). Atomic. */
export async function awardStars(childId: string, amount: number): Promise<number> {
  if (amount <= 0) return (await getStarBalance(childId)).balance;
  const supabase = await requireChild(childId);
  const { data, error } = await supabase.rpc('award_stars', {
    p_child_id: childId,
    p_amount: Math.round(amount),
  });
  if (error) throw new Error('Could not award stars.');
  return (data as number) ?? 0;
}

/** Spend stars from a child's wallet. Returns false if insufficient. Atomic. */
export async function spendStars(childId: string, amount: number): Promise<boolean> {
  if (amount <= 0) return true;
  const supabase = await requireChild(childId);
  const { data, error } = await supabase.rpc('spend_stars', {
    p_child_id: childId,
    p_amount: Math.round(amount),
  });
  if (error) throw new Error('Could not spend stars.');
  return (data as boolean) ?? false;
}
