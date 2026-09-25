'use server';

import { createClient } from '@/lib/supabase/server';
import { FEED_COST, isValidPetName, stageForFeeds, type Pet, type PetSpecies, type PetStage } from '@/lib/kid/pets';
import { bumpQuestProgress } from '@/app/actions/trail';
import { spendStars } from '@/app/actions/rewards';

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

type PetRow = {
  child_id: string;
  species: string;
  name: string | null;
  stage: string;
  happiness: number;
  feed_count: number;
  updated_at: string;
};

function toPet(row: PetRow): Pet {
  return {
    childId: row.child_id,
    species: row.species as PetSpecies,
    name: row.name,
    stage: row.stage as PetStage,
    happiness: row.happiness,
    feedCount: row.feed_count,
    updatedAt: row.updated_at,
  };
}

/** The child's pet, or null if they have not adopted one yet. */
export async function getPet(childId: string): Promise<Pet | null> {
  const supabase = await requireChild(childId);
  const { data, error } = await supabase
    .from('pets')
    .select('child_id, species, name, stage, happiness, feed_count, updated_at')
    .eq('child_id', childId)
    .maybeSingle();
  if (error) throw new Error('Could not load pet.');
  return data ? toPet(data as PetRow) : null;
}

/** Adopt a pet: creates a row in the 'egg' stage. One pet per child. */
export async function adoptPet(childId: string, species: PetSpecies): Promise<Pet> {
  const supabase = await requireChild(childId);
  const { data, error } = await supabase
    .from('pets')
    .upsert({ child_id: childId, species, name: null, stage: 'egg', happiness: 50, feed_count: 0 }, { onConflict: 'child_id' })
    .select('child_id, species, name, stage, happiness, feed_count, updated_at')
    .single();
  if (error || !data) throw new Error('Could not adopt pet.');
  return toPet(data as PetRow);
}

/** Hatch the egg: egg -> hatchling. */
export async function hatchPet(childId: string): Promise<Pet> {
  const supabase = await requireChild(childId);
  const { data, error } = await supabase
    .from('pets')
    .update({ stage: 'hatchling', happiness: 70 })
    .eq('child_id', childId)
    .eq('stage', 'egg')
    .select('child_id, species, name, stage, happiness, feed_count, updated_at')
    .single();
  if (error || !data) throw new Error('Could not hatch pet.');
  return toPet(data as PetRow);
}

/** Name the pet from the preset COPPA-safe list. */
export async function namePet(childId: string, name: string): Promise<Pet> {
  if (!isValidPetName(name)) throw new Error('That name is not allowed.');
  const supabase = await requireChild(childId);
  const { data, error } = await supabase
    .from('pets')
    .update({ name })
    .eq('child_id', childId)
    .neq('stage', 'egg')
    .select('child_id, species, name, stage, happiness, feed_count, updated_at')
    .single();
  if (error || !data) throw new Error('Could not name pet.');
  return toPet(data as PetRow);
}

/** Feed the pet: spends 5 stars, +1 feed, +15 happiness (capped 100), stage upgrades. */
export async function feedPet(childId: string): Promise<{ pet: Pet; leveledUp: boolean }> {
  const supabase = await requireChild(childId);
  const { data: row, error } = await supabase
    .from('pets')
    .select('child_id, species, name, stage, happiness, feed_count, updated_at')
    .eq('child_id', childId)
    .neq('stage', 'egg')
    .single();
  if (error || !row) throw new Error('Pet must be hatched first.');

  const paid = await spendStars(childId, FEED_COST);
  if (!paid) throw new Error('Not enough stars.');

  const feedCount = (row.feed_count ?? 0) + 1;
  const happiness = Math.min(100, (row.happiness ?? 50) + 15);
  const newStage = stageForFeeds(feedCount);
  const leveledUp = (row.stage as PetStage) !== newStage && newStage !== 'hatchling';

  const { data: updated, error: updateError } = await supabase
    .from('pets')
    .update({ feed_count: feedCount, happiness, stage: newStage })
    .eq('child_id', childId)
    .select('child_id, species, name, stage, happiness, feed_count, updated_at')
    .single();
  if (updateError || !updated) throw new Error('Could not feed pet.');

  await bumpQuestProgress(childId, 'pet_fed', 1).catch(() => {});
  return { pet: toPet(updated as PetRow), leveledUp };
}

/** Play with the pet: +10 happiness (capped 100), free, no cooldown. */
export async function playWithPet(childId: string): Promise<Pet> {
  const supabase = await requireChild(childId);
  const { data: row, error: readError } = await supabase
    .from('pets')
    .select('happiness')
    .eq('child_id', childId)
    .neq('stage', 'egg')
    .single();
  if (readError || !row) throw new Error('Pet must be hatched first.');

  const { data, error } = await supabase
    .from('pets')
    .update({ happiness: Math.min(100, (row.happiness ?? 50) + 10) })
    .eq('child_id', childId)
    .select('child_id, species, name, stage, happiness, feed_count, updated_at')
    .single();
  if (error || !data) throw new Error('Could not play with pet.');
  return toPet(data as PetRow);
}
