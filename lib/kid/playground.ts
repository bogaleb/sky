/**
 * Pet Playground — minigame definitions and pure game logic for the
 * pet companion. Everything here is client-safe and deterministic:
 * each game is seeded so sessions are reproducible and testable.
 *
 * COPPA note: no free text anywhere; all strings are curated.
 */

export type PlaygroundGameId = 'fetch' | 'groom' | 'treat-toss';

export interface PlaygroundGame {
  id: PlaygroundGameId;
  name: string;
  howTo: string;
}

export const PLAYGROUND_GAMES: PlaygroundGame[] = [
  {
    id: 'fetch',
    name: 'Fetch',
    howTo: 'The ball bounces to a new spot. Tap it fast, five times!',
  },
  {
    id: 'groom',
    name: 'Groom',
    howTo: 'Your pet is a little dusty. Tap the five sparkles to brush them away.',
  },
  {
    id: 'treat-toss',
    name: 'Treat Toss',
    howTo: 'Watch the slider. Tap Toss when the marker is inside the golden zone!',
  },
];

export function getPlaygroundGame(id: string): PlaygroundGame | undefined {
  return PLAYGROUND_GAMES.find((g) => g.id === id);
}

/** Tiny deterministic PRNG so game layouts are stable per seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A single fetch session: 5 throws, each landing in one of 5 zones (0-4). */
export interface FetchSession {
  throws: number;
  zones: number[];
}

export function fetchRound(seed: number): FetchSession {
  const rand = mulberry32(seed);
  const zones: number[] = [];
  for (let i = 0; i < 5; i++) zones.push(Math.floor(rand() * 5));
  return { throws: 5, zones };
}

/** Groom session: 5 unique sparkle spots chosen from a 3x3 grid (ids 0-8). */
export function groomSpots(seed: number): number[] {
  const rand = mulberry32(seed);
  const spots = new Set<number>();
  while (spots.size < 5) spots.add(Math.floor(rand() * 9));
  return [...spots].sort((a, b) => a - b);
}

/** Treat toss: a sweet-zone center on a 0-100 slider for each of 5 tosses. */
export interface TossSession {
  tosses: number;
  sweetZones: number[];
}

export function tossAim(seed: number): TossSession {
  const rand = mulberry32(seed);
  const sweetZones: number[] = [];
  for (let i = 0; i < 5; i++) sweetZones.push(20 + Math.floor(rand() * 61)); // 20..80
  return { tosses: 5, sweetZones };
}

/** Half-width of the golden sweet zone on the 0-100 slider. */
export const TOSS_SWEET_HALF_WIDTH = 10;

export function isTossHit(marker: number, sweetCenter: number): boolean {
  return Math.abs(marker - sweetCenter) <= TOSS_SWEET_HALF_WIDTH;
}

/* ------------------------------------------------------------------ */
/* Per-child "played all three" tracking (localStorage, per device).   */
/* ------------------------------------------------------------------ */

export function playgroundKey(childId: string): string {
  return `sky-playground-${childId}`;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function readSet(childId: string, storage?: StorageLike): Set<PlaygroundGameId> {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    const raw = store?.getItem(playgroundKey(childId));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const ids = parsed.filter(
      (x): x is PlaygroundGameId => x === 'fetch' || x === 'groom' || x === 'treat-toss',
    );
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export function loadPlayedGames(childId: string, storage?: StorageLike): PlaygroundGameId[] {
  return [...readSet(childId, storage)];
}

export function markGamePlayed(
  childId: string,
  gameId: PlaygroundGameId,
  storage?: StorageLike,
): PlaygroundGameId[] {
  const set = readSet(childId, storage);
  const wasNew = !set.has(gameId);
  set.add(gameId);
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    store?.setItem(playgroundKey(childId), JSON.stringify([...set]));
  } catch {
    // storage unavailable — the in-memory set still drives this session
  }
  return wasNew ? [...set] : [...set];
}

export function allGamesPlayed(childId: string, storage?: StorageLike): boolean {
  return readSet(childId, storage).size >= 3;
}
