// Canonical avatar roster (ids only — the artwork lives in
// components/avatars). A contract test asserts this matches the visual
// registry and the avatars table seed.

export const AVATAR_IDS = [
  'curio',
  'nova',
  'luna',
  'milo',
  'bea',
  'tuno',
  'riff',
  'atlas',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const AVATAR_NAMES: Record<AvatarId, string> = {
  curio: 'Curio',
  nova: 'Nova',
  luna: 'Luna',
  milo: 'Milo',
  bea: 'Bea',
  tuno: 'Tuno',
  riff: 'Riff',
  atlas: 'Atlas',
};

export const AGE_BANDS = ['3-4', '5-6', '7-8'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const AGE_BAND_DESCRIPTIONS: Record<AgeBand, string> = {
  '3-4': 'Tap-and-play. Everything is read aloud, no reading needed.',
  '5-6': 'Early phonics and counting. Simple sentences, gentle help.',
  '7-8': 'Multi-step challenges, stories, and first coding puzzles.',
};
