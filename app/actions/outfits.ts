'use server';

import { createClient } from '@/lib/supabase/server';
import { getOutfit, OUTFITS, slotMates, type OutfitState } from '@/lib/kid/outfits';
import { spendStars, getStarBalance } from './rewards';

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

export interface OutfitShopState {
  outfits: OutfitState[];
  balance: number;
}

/** All outfits with this child's unlock/equip state, plus star balance. */
export async function getOutfits(childId: string): Promise<OutfitShopState> {
  const supabase = await requireChild(childId);
  const [{ data: rows }, { balance }] = await Promise.all([
    supabase.from('child_outfits').select('outfit_id, unlocked, equipped').eq('child_id', childId),
    getStarBalance(childId),
  ]);
  if (!rows) throw new Error('Could not load outfits.');
  const byId = new Map(rows.map((r) => [r.outfit_id, r]));
  return {
    outfits: OUTFITS.map((o) => {
      const row = byId.get(o.id);
      return { ...o, unlocked: row?.unlocked ?? false, equipped: row?.equipped ?? false };
    }),
    balance,
  };
}

/** Currently equipped outfit ids for a child (one per slot, at most). */
export async function getEquippedOutfits(childId: string): Promise<string[]> {
  const supabase = await requireChild(childId);
  const { data, error } = await supabase
    .from('child_outfits')
    .select('outfit_id')
    .eq('child_id', childId)
    .eq('equipped', true);
  if (error) throw new Error('Could not load outfits.');
  return (data ?? []).map((r) => r.outfit_id);
}

/**
 * Buy an outfit with stars and wear it immediately. If already unlocked,
 * just equips it without charging again. Returns the new star balance.
 */
export async function unlockOutfit(childId: string, outfitId: string): Promise<number> {
  const outfit = getOutfit(outfitId);
  if (!outfit) throw new Error('Outfit not found.');
  const supabase = await requireChild(childId);

  const { data: existing } = await supabase
    .from('child_outfits')
    .select('unlocked')
    .eq('child_id', childId)
    .eq('outfit_id', outfitId)
    .maybeSingle();

  let balance = (await getStarBalance(childId)).balance;
  if (!existing?.unlocked) {
    const ok = await spendStars(childId, outfit.cost);
    if (!ok) throw new Error('Not enough stars.');
    balance = (await getStarBalance(childId)).balance;
  }

  const { error: upsertError } = await supabase
    .from('child_outfits')
    .upsert(
      { child_id: childId, outfit_id: outfitId, unlocked: true, equipped: true },
      { onConflict: 'child_id,outfit_id' },
    );
  if (upsertError) throw new Error('Could not unlock outfit.');

  // One outfit per slot: unequip the others in this slot.
  const mates = slotMates(outfitId);
  if (mates.length > 0) {
    await supabase
      .from('child_outfits')
      .update({ equipped: false })
      .eq('child_id', childId)
      .in('outfit_id', mates);
  }
  return balance;
}

/** Wear an unlocked outfit (unequips others in the same slot). */
export async function equipOutfit(childId: string, outfitId: string): Promise<void> {
  const outfit = getOutfit(outfitId);
  if (!outfit) throw new Error('Outfit not found.');
  const supabase = await requireChild(childId);

  const { data: existing } = await supabase
    .from('child_outfits')
    .select('unlocked')
    .eq('child_id', childId)
    .eq('outfit_id', outfitId)
    .maybeSingle();
  if (!existing?.unlocked) throw new Error('Outfit is locked.');

  const { error } = await supabase
    .from('child_outfits')
    .update({ equipped: true })
    .eq('child_id', childId)
    .eq('outfit_id', outfitId);
  if (error) throw new Error('Could not wear outfit.');

  const mates = slotMates(outfitId);
  if (mates.length > 0) {
    await supabase
      .from('child_outfits')
      .update({ equipped: false })
      .eq('child_id', childId)
      .in('outfit_id', mates);
  }
}

/** Take off an outfit without locking it. */
export async function unequipOutfit(childId: string, outfitId: string): Promise<void> {
  const supabase = await requireChild(childId);
  const { error } = await supabase
    .from('child_outfits')
    .update({ equipped: false })
    .eq('child_id', childId)
    .eq('outfit_id', outfitId);
  if (error) throw new Error('Could not remove outfit.');
}
