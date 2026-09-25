/**
 * Atlas World Tour — geography content for Sky (ages 4-8).
 * Original, kid-safe content: 7 continents, 11 animals, 8 landmarks,
 * and 3 deterministic game modes. No emoji anywhere.
 */

export interface Continent {
  id: string;
  name: string;
  /** One-line spoken fact about the continent. */
  fact: string;
  /** Primary animal that lives here (an ANIMALS id). */
  animalId: string;
  /** Primary landmark here (a LANDMARKS id, if any). */
  landmarkId?: string;
  /** "Atlas says" fill-in-the-blank line; the answer is this continent. */
  blankFact: string;
}

export const CONTINENTS: Continent[] = [
  {
    id: 'north-america',
    name: 'North America',
    fact: 'Bison roam the wide grasslands of North America.',
    animalId: 'polar-bear',
    landmarkId: 'statue-of-liberty',
    blankFact: 'Polar bears hunt on the ice of ___.',
  },
  {
    id: 'south-america',
    name: 'South America',
    fact: 'Toucans chatter in the rainforests of South America.',
    animalId: 'toucan',
    landmarkId: 'christ-redeemer',
    blankFact: 'Llamas climb the mountains of ___.',
  },
  {
    id: 'europe',
    name: 'Europe',
    fact: 'Castles and old clocks dot the cities of Europe.',
    animalId: 'fox',
    landmarkId: 'eiffel-tower',
    blankFact: 'Big Ben chimes in London, in ___.',
  },
  {
    id: 'africa',
    name: 'Africa',
    fact: 'Elephants march across the sunny plains of Africa.',
    animalId: 'elephant',
    landmarkId: 'pyramids',
    blankFact: 'Lions roar across the plains of ___.',
  },
  {
    id: 'asia',
    name: 'Asia',
    fact: 'Giant pandas munch bamboo in the forests of Asia.',
    animalId: 'panda',
    landmarkId: 'great-wall',
    blankFact: 'Giant pandas munch bamboo in ___.',
  },
  {
    id: 'australia',
    name: 'Australia',
    fact: 'Kangaroos hop across the sunny land of Australia.',
    animalId: 'kangaroo',
    landmarkId: 'sydney-opera-house',
    blankFact: 'Koalas munch leaves in the forests of ___.',
  },
  {
    id: 'antarctica',
    name: 'Antarctica',
    fact: 'Penguins waddle on the snowy ice of Antarctica.',
    animalId: 'penguin',
    blankFact: 'Penguins waddle on the ice of ___.',
  },
];

export function getContinent(id: string): Continent | undefined {
  return CONTINENTS.find((c) => c.id === id);
}

export interface Animal {
  id: string;
  name: string;
  continentId: string;
  /** Spoken line when this animal appears. */
  line: string;
}

export const ANIMALS: Animal[] = [
  { id: 'penguin', name: 'penguin', continentId: 'antarctica', line: 'This little penguin waddles on icy snow!' },
  { id: 'kangaroo', name: 'kangaroo', continentId: 'australia', line: 'This kangaroo hops high on strong legs!' },
  { id: 'koala', name: 'koala', continentId: 'australia', line: 'This sleepy koala hugs a leafy tree!' },
  { id: 'panda', name: 'panda', continentId: 'asia', line: 'This gentle panda munches crunchy bamboo!' },
  { id: 'tiger', name: 'tiger', continentId: 'asia', line: 'This stripy tiger pads softly through the grass!' },
  { id: 'camel', name: 'camel', continentId: 'africa', line: 'This camel carries water in its bumpy humps!' },
  { id: 'elephant', name: 'elephant', continentId: 'africa', line: 'This elephant waves hello with its long trunk!' },
  { id: 'toucan', name: 'toucan', continentId: 'south-america', line: 'This toucan flashes its big rainbow beak!' },
  { id: 'llama', name: 'llama', continentId: 'south-america', line: 'This fluffy llama climbs the tall mountains!' },
  { id: 'polar-bear', name: 'polar bear', continentId: 'north-america', line: 'This polar bear pads across the snowy ice!' },
  { id: 'fox', name: 'fox', continentId: 'europe', line: 'This clever fox trots through the green woods!' },
];

export function getAnimal(id: string): Animal | undefined {
  return ANIMALS.find((a) => a.id === id);
}

export interface Landmark {
  id: string;
  name: string;
  continentId: string;
  /** Spoken line when this landmark appears. */
  line: string;
}

export const LANDMARKS: Landmark[] = [
  { id: 'eiffel-tower', name: 'the Eiffel Tower', continentId: 'europe', line: 'The tall iron tower in Paris, France!' },
  { id: 'big-ben', name: 'Big Ben', continentId: 'europe', line: 'The great clock tower in London, England!' },
  { id: 'pyramids', name: 'the Pyramids', continentId: 'africa', line: 'The giant stone pyramids in the desert of Egypt!' },
  { id: 'great-wall', name: 'the Great Wall', continentId: 'asia', line: 'The super long wall winding over the hills of China!' },
  { id: 'taj-mahal', name: 'the Taj Mahal', continentId: 'asia', line: 'The white marble palace in India!' },
  { id: 'statue-of-liberty', name: 'the Statue of Liberty', continentId: 'north-america', line: 'The torch lady greeting ships in New York!' },
  { id: 'christ-redeemer', name: 'Christ the Redeemer', continentId: 'south-america', line: 'The giant statue with open arms in Brazil!' },
  { id: 'sydney-opera-house', name: 'the Sydney Opera House', continentId: 'australia', line: 'The sail-shaped music house in Sydney!' },
];

export function getLandmark(id: string): Landmark | undefined {
  return LANDMARKS.find((l) => l.id === id);
}

export const MODES = ['animal', 'landmark', 'fact'] as const;
export type GeoMode = (typeof MODES)[number];

export const ROUNDS_PER_GAME = 8;

export interface GeoRound {
  mode: GeoMode;
  /** Shown on screen. */
  prompt: string;
  /** Read aloud by Atlas. */
  spoken: string;
  /** Continent ids the child can pick from. */
  choices: string[];
  /** Continent id of the correct answer. */
  answer: string;
  animalId?: string;
  landmarkId?: string;
}

/** Deterministic PRNG so rounds are reproducible from a seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledContinents(rng: () => number): string[] {
  const ids = CONTINENTS.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

/**
 * Generate one round for a mode. Deterministic: the same mode + seed
 * always yields the same round. The child taps the answer on a world map
 * showing all 7 continents, so every continent is a plausible pick.
 */
export function generateRound(mode: GeoMode, seed: number): GeoRound {
  const rng = mulberry32(seed);
  const choices = shuffledContinents(rng);

  if (mode === 'animal') {
    const animal = ANIMALS[Math.floor(rng() * ANIMALS.length)];
    return {
      mode,
      prompt: `Where does the ${animal.name} live?`,
      spoken: `Where does the ${animal.name} live? ${animal.line} Tap its home on the map!`,
      choices,
      answer: animal.continentId,
      animalId: animal.id,
    };
  }

  if (mode === 'landmark') {
    const landmark = LANDMARKS[Math.floor(rng() * LANDMARKS.length)];
    return {
      mode,
      prompt: `Where is ${landmark.name}?`,
      spoken: `Where is ${landmark.name}? ${landmark.line} Tap it on the map!`,
      choices,
      answer: landmark.continentId,
      landmarkId: landmark.id,
    };
  }

  // 'fact' — Atlas says a line with a missing continent name.
  const continent = CONTINENTS[Math.floor(rng() * CONTINENTS.length)];
  return {
    mode,
    prompt: continent.blankFact,
    spoken: `${continent.blankFact.replace('___.', 'which continent?')} Listen and tap the missing continent on the map!`,
    choices,
    answer: continent.id,
  };
}
