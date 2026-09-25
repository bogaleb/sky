/**
 * Pet companion catalog. Everything here is client-safe.
 *
 * COPPA rule: pet names are chosen from the preset PET_NAMES list only —
 * no free text is ever stored. The server re-validates the name.
 */

export type PetSpecies =
  | 'bumble-pup'
  | 'cloud-kitten'
  | 'sprout-turtle'
  | 'star-fox'
  | 'bubble-frog';

export type PetStage = 'egg' | 'hatchling' | 'junior' | 'grown';

export interface PetSpeciesInfo {
  id: PetSpecies;
  displayName: string;
  blurb: string;
  hostCharacter: string;
  eggColors: [string, string];
}

export const PET_SPECIES: PetSpeciesInfo[] = [
  {
    id: 'bumble-pup',
    displayName: 'Bumble-Pup',
    blurb: 'A bouncy puppy with stripes like a bumblebee. It loves to bounce after balls.',
    hostCharacter: 'curio',
    eggColors: ['#FFE28A', '#F5A623'],
  },
  {
    id: 'cloud-kitten',
    displayName: 'Cloud-Kitten',
    blurb: 'A fluffy kitten made of soft cloud. It naps on rainbows and purrs thunder softly.',
    hostCharacter: 'luna',
    eggColors: ['#E8F4FF', '#A9CFF2'],
  },
  {
    id: 'sprout-turtle',
    displayName: 'Sprout-Turtle',
    blurb: 'A slow, happy turtle with a little plant growing on its shell.',
    hostCharacter: 'tuno',
    eggColors: ['#D9F2C7', '#8FD18A'],
  },
  {
    id: 'star-fox',
    displayName: 'Star-Fox',
    blurb: 'A clever fox with starry fur that glows when it is happy.',
    hostCharacter: 'nova',
    eggColors: ['#FFD9E8', '#F27BB5'],
  },
  {
    id: 'bubble-frog',
    displayName: 'Bubble-Frog',
    blurb: 'A giggly frog that blows bubbles when it hops. Ribbit!',
    hostCharacter: 'riff',
    eggColors: ['#D6F5F0', '#6FD6C3'],
  },
];

export function getSpecies(id: string): PetSpeciesInfo {
  return PET_SPECIES.find((s) => s.id === id) ?? PET_SPECIES[0];
}

/** Feeding cost in stars. */
export const FEED_COST = 5;

/** Feeds required to reach each stage. Hatchling comes from hatching the egg. */
export const STAGE_THRESHOLDS: Record<PetStage, number> = {
  egg: 0,
  hatchling: 0,
  junior: 5,
  grown: 12,
};

export function stageForFeeds(feedCount: number): PetStage {
  if (feedCount >= STAGE_THRESHOLDS.grown) return 'grown';
  if (feedCount >= STAGE_THRESHOLDS.junior) return 'junior';
  return 'hatchling';
}

/** Preset COPPA-safe names. The server only accepts these. */
export const PET_NAMES = [
  'Bubbles',
  'Peppy',
  'Sunny',
  'Mochi',
  'Pip',
  'Twinkle',
  'Coco',
  'Biscuit',
] as const;

export type PetName = (typeof PET_NAMES)[number];

export function isValidPetName(name: string): name is PetName {
  return (PET_NAMES as readonly string[]).includes(name);
}

export interface Pet {
  childId: string;
  species: PetSpecies;
  name: string | null;
  stage: PetStage;
  happiness: number;
  feedCount: number;
  updatedAt: string;
}
