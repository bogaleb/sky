/**
 * Character Homes — every Sky character has a visitable home. Kids tap a
 * home card to visit: the character's home clip plays (with voiceover), a
 * hidden star sparkles somewhere in the room (tap it for +1 star, once per
 * home per day), and visiting all 8 homes earns a sticker + trophy.
 *
 * Clip availability is a static list: if a clip fails to generate we leave
 * it out here and the UI falls back to an animated avatar scene.
 */

import { CHARACTER_IDS } from './characters';

/** Minimal localStorage-like surface so the helpers are unit-testable. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    /* private mode etc. */
  }
  return null;
}

export interface CharacterHome {
  characterId: string;
  homeName: string;
  tagline: string;
  /** Public clip path, or null when the clip is unavailable (fallback scene). */
  clipSrc: string | null;
  /** Poster frame for the clip (shown before the video loads), or null. */
  posterSrc: string | null;
  /** Spoken line when the child visits. */
  greeting: string;
}

/** Clips that actually shipped in public/videos/. */
const AVAILABLE_CLIPS = new Set([
  // 'curio-home' disabled: video file contains a monkey, not Curio the Fox.
  // Falls back to the correct SVG fox avatar until the video is regenerated.
  'nova-home',
  'luna-home',
  'milo-home',
  'bea-home',
  'tuno-home',
  'riff-home',
  'atlas-home',
]);

function clipFor(characterId: string): string | null {
  const stem = `${characterId}-home`;
  return AVAILABLE_CLIPS.has(stem) ? `/videos/${stem}.mp4` : null;
}

function posterFor(characterId: string): string | null {
  const stem = `${characterId}-home`;
  return AVAILABLE_CLIPS.has(stem) ? `/videos/posters/${stem}.jpg` : null;
}

export const HOMES: CharacterHome[] = [
  {
    characterId: 'curio',
    homeName: "Curio's Treehouse Lookout",
    tagline: 'The coziest lookout in the whole sky',
    clipSrc: clipFor('curio'),
    posterSrc: posterFor('curio'),
    greeting: "Welcome to my treehouse lookout! This is where I watch over the whole sky. Come look with me!",
  },
  {
    characterId: 'nova',
    homeName: "Nova's Meadow Den",
    tagline: 'Sunshine, giggles, and soft grass',
    clipSrc: clipFor('nova'),
    posterSrc: posterFor('nova'),
    greeting: 'Hi hi! This is my meadow den! I play here every single day. Come play with me!',
  },
  {
    characterId: 'luna',
    homeName: "Luna's Moonlit Library",
    tagline: 'Every book is a dream waiting to open',
    clipSrc: clipFor('luna'),
    posterSrc: posterFor('luna'),
    greeting: 'Shhh... welcome to my moonlit library. Pick a book, little reader, and we will dream together.',
  },
  {
    characterId: 'milo',
    homeName: "Milo's Gadget Workshop",
    tagline: 'Beep boop! Building brilliant things',
    clipSrc: clipFor('milo'),
    posterSrc: posterFor('milo'),
    greeting: 'Beep boop! Welcome to my gadget workshop! I build and fix things here. Want to see my tools?',
  },
  {
    characterId: 'bea',
    homeName: "Bea's Honeycomb Garden",
    tagline: 'Buzzing with flowers and sweet honey',
    clipSrc: clipFor('bea'),
    posterSrc: posterFor('bea'),
    greeting: 'Buzz buzz! Welcome to my honeycomb garden! Smell the flowers. I grew them all myself!',
  },
  {
    characterId: 'tuno',
    homeName: "Tuno's Lily-Pad Pond",
    tagline: 'Slow, calm, and wonderfully cozy',
    clipSrc: clipFor('tuno'),
    posterSrc: posterFor('tuno'),
    greeting: 'Mmm... welcome to my lily-pad pond. Sit with me a while. There is no hurry here.',
  },
  {
    characterId: 'riff',
    homeName: "Riff's Burrow Studio",
    tagline: 'Every wall hums a happy tune',
    clipSrc: clipFor('riff'),
    posterSrc: posterFor('riff'),
    greeting: 'Hey hey! Welcome to my burrow studio! This is where the music lives. Let us make some noise!',
  },
  {
    characterId: 'atlas',
    homeName: "Atlas's Baobab House",
    tagline: 'Maps, stories, and faraway places',
    clipSrc: clipFor('atlas'),
    posterSrc: posterFor('atlas'),
    greeting: 'Hello, explorer! Welcome to my baobab house! My maps hold every corner of the world. Come see!',
  },
];

export function getHome(characterId: string): CharacterHome | undefined {
  return HOMES.find((h) => h.characterId === characterId);
}

/** Local date key, YYYY-MM-DD in the device's timezone. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readJson(storage: StorageLike | null, key: string): unknown {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(storage: StorageLike | null, key: string, value: unknown): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable */
  }
}

/** Homes this child has visited (character ids). */
export function loadVisited(childId: string, storage?: StorageLike | null): string[] {
  const store = storage ?? browserStorage();
  const parsed = readJson(store, `sky-homes-${childId}`);
  return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
}

/** Record a visit; returns the updated visited list. */
export function markVisited(childId: string, characterId: string, storage?: StorageLike | null): string[] {
  const store = storage ?? browserStorage();
  const visited = loadVisited(childId, store);
  if (!visited.includes(characterId)) {
    visited.push(characterId);
    writeJson(store, `sky-homes-${childId}`, visited);
  }
  return visited;
}

export function hasVisitedAll(childId: string, storage?: StorageLike | null): boolean {
  const visited = new Set(loadVisited(childId, storage));
  return CHARACTER_IDS.every((id) => visited.has(id));
}

/**
 * Hidden-star claim: once per home per day. Returns true when the star is
 * newly claimed (the caller should award it), false if already claimed today.
 */
export function claimHiddenStar(
  childId: string,
  characterId: string,
  storage?: StorageLike | null,
  date = new Date()
): boolean {
  const store = storage ?? browserStorage();
  const key = `sky-homestars-${childId}`;
  const parsed = readJson(store, key);
  const claims: Record<string, string> =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {};
  const today = todayKey(date);
  if (claims[characterId] === today) return false;
  claims[characterId] = today;
  writeJson(store, key, claims);
  return true;
}

/** Guard so the all-homes celebration fires exactly once per child. */
export function loadHomesAwarded(childId: string, storage?: StorageLike | null): boolean {
  const store = storage ?? browserStorage();
  return readJson(store, `sky-homes-award-${childId}`) === true;
}

export function markHomesAwarded(childId: string, storage?: StorageLike | null): void {
  const store = storage ?? browserStorage();
  writeJson(store, `sky-homes-award-${childId}`, true);
}
