'use server';

import { createClient } from '@/lib/supabase/server';
import { COLLECTIONS } from '@/lib/kid/collections';

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

/**
 * Unlock a collection item for a child. Idempotent: unlocking an item that
 * is already unlocked returns { new: false }. `completed` is true when the
 * whole collection is now unlocked.
 */
export async function unlockItem(
  childId: string,
  collectionId: string,
  itemId: string
): Promise<{ new: boolean; completed: boolean }> {
  const def = COLLECTIONS.find((c) => c.id === collectionId);
  if (!def || !def.itemIds.includes(itemId)) throw new Error('Unknown collection item.');
  const supabase = await requireChild(childId);

  const { data, error } = await supabase
    .from('collection_items')
    .upsert(
      { child_id: childId, collection_id: collectionId, item_id: itemId },
      { onConflict: 'child_id,collection_id,item_id', ignoreDuplicates: true }
    )
    .select('item_id');
  if (error) throw new Error('Could not unlock item.');

  const unlocked = await getCollection(childId, collectionId);
  return {
    new: (data ?? []).length > 0,
    completed: def.itemIds.every((id) => unlocked.includes(id)),
  };
}

/** All item ids a child has unlocked in a collection, oldest first. */
export async function getCollection(childId: string, collectionId: string): Promise<string[]> {
  const supabase = await requireChild(childId);
  const { data, error } = await supabase
    .from('collection_items')
    .select('item_id, found_at')
    .eq('child_id', childId)
    .eq('collection_id', collectionId)
    .order('found_at', { ascending: true });
  if (error) throw new Error('Could not load collection.');
  return (data ?? []).map((r) => r.item_id);
}
