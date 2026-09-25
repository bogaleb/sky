/**
 * Collections — "gotta find them all" content for Sky (ages 4-8).
 * The ANIMALS collection powers "My Animal Book" (the encyclopedia).
 * Collection definitions live here; earned rows live in
 * public.collection_items (see migration 20260925001000_collections.sql).
 * No emoji anywhere.
 */

export interface AnimalEntry {
  id: string;
  /** Display name, e.g. "Polar Bear". */
  name: string;
  /** One spoken sentence, TTS-friendly. */
  fact: string;
  /** Kid-friendly habitat label shown as the unlock hint. */
  habitat: string;
  /** A geography.ts continent id, for cross-links with Atlas World Tour. */
  continentId: string;
}

export const COLLECTION_ANIMALS: AnimalEntry[] = [
  // Reused from the Atlas World Tour roster (same ids).
  { id: 'penguin', name: 'Penguin', fact: 'Penguins waddle on icy shores and slide on their bellies to get around.', habitat: 'Icy shores', continentId: 'antarctica' },
  { id: 'kangaroo', name: 'Kangaroo', fact: 'Kangaroos hop on strong back legs and carry their babies in a pouch.', habitat: 'Grasslands', continentId: 'australia' },
  { id: 'koala', name: 'Koala', fact: 'Koalas hug leafy trees and nap for most of the day.', habitat: 'Eucalyptus forests', continentId: 'australia' },
  { id: 'panda', name: 'Panda', fact: 'Giant pandas munch crunchy bamboo almost all day long.', habitat: 'Bamboo forests', continentId: 'asia' },
  { id: 'tiger', name: 'Tiger', fact: 'Tiger stripes work like camouflage in tall grass.', habitat: 'Forests', continentId: 'asia' },
  { id: 'camel', name: 'Camel', fact: 'Camels store fat in their humps to cross hot deserts.', habitat: 'Deserts', continentId: 'africa' },
  { id: 'elephant', name: 'Elephant', fact: 'Elephants use their trunks to drink water and say hello.', habitat: 'Savannas', continentId: 'africa' },
  { id: 'toucan', name: 'Toucan', fact: 'Toucans have big colorful beaks for reaching yummy fruit.', habitat: 'Rainforests', continentId: 'south-america' },
  { id: 'llama', name: 'Llama', fact: 'Llamas climb high mountains wearing soft fluffy wool.', habitat: 'Mountains', continentId: 'south-america' },
  { id: 'polar-bear', name: 'Polar Bear', fact: 'Polar bears pad across sea ice on big furry feet.', habitat: 'Arctic ice', continentId: 'north-america' },
  { id: 'fox', name: 'Fox', fact: 'Foxes use their bushy tails to stay warm and keep balance.', habitat: 'Woodlands', continentId: 'europe' },
  // New friends for the encyclopedia.
  { id: 'dolphin', name: 'Dolphin', fact: 'Dolphins talk to each other with clicks and whistles.', habitat: 'Warm oceans', continentId: 'south-america' },
  { id: 'owl', name: 'Owl', fact: 'Owls can turn their heads almost all the way around to see at night.', habitat: 'Forests', continentId: 'europe' },
  { id: 'bee', name: 'Bee', fact: 'Bees dance a wiggle dance to tell friends where the flowers are.', habitat: 'Meadows', continentId: 'europe' },
  { id: 'turtle', name: 'Turtle', fact: 'Turtles carry their homes on their backs wherever they go.', habitat: 'Ponds', continentId: 'north-america' },
  { id: 'rabbit', name: 'Rabbit', fact: 'Rabbits thump their back feet to warn friends of danger.', habitat: 'Meadows', continentId: 'europe' },
  { id: 'frog', name: 'Frog', fact: 'Frogs can breathe through their skin and hop with strong back legs.', habitat: 'Ponds', continentId: 'south-america' },
  { id: 'whale', name: 'Whale', fact: 'Blue whales are the biggest animals that have ever lived.', habitat: 'Cold oceans', continentId: 'antarctica' },
  { id: 'butterfly', name: 'Butterfly', fact: 'Butterflies taste with their feet. Imagine tasting with your toes!', habitat: 'Meadows', continentId: 'north-america' },
  { id: 'squirrel', name: 'Squirrel', fact: 'Squirrels hide nuts for winter and forget where half of them are.', habitat: 'Forests', continentId: 'north-america' },
  { id: 'hedgehog', name: 'Hedgehog', fact: 'Hedgehogs roll into a spiky ball when they feel scared.', habitat: 'Gardens', continentId: 'europe' },
  { id: 'octopus', name: 'Octopus', fact: 'Octopuses have three hearts and eight squishy arms.', habitat: 'Rocky ocean floors', continentId: 'north-america' },
  { id: 'lion', name: 'Lion', fact: 'A lion roar is so loud it can be heard from five miles away.', habitat: 'Savannas', continentId: 'africa' },
  { id: 'zebra', name: 'Zebra', fact: 'Every zebra has its own stripe pattern, like a fingerprint.', habitat: 'Grasslands', continentId: 'africa' },
];

export function getAnimal(id: string): AnimalEntry | undefined {
  return COLLECTION_ANIMALS.find((a) => a.id === id);
}

export interface CollectionDef {
  id: string;
  title: string;
  /** Item ids in display order. */
  itemIds: string[];
}

export const COLLECTIONS: CollectionDef[] = [
  { id: 'animals', title: 'My Animal Book', itemIds: COLLECTION_ANIMALS.map((a) => a.id) },
];

export function getCollectionDef(id: string): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

/** True when every item in the collection is unlocked. */
export function isCollectionComplete(collectionId: string, unlockedIds: string[]): boolean {
  const def = getCollectionDef(collectionId);
  if (!def) return false;
  return def.itemIds.every((id) => unlockedIds.includes(id));
}
