/**
 * Adaptive difficulty engine (ZPD — zone of proximal development).
 *
 * Real-time difficulty adjustment for Sky's practice games: the engine
 * watches the child's recent results and nudges the content difficulty
 * toward the sweet spot — challenging but achievable. Adaptation is
 * invisible to kids: only the content changes, never the UI.
 *
 * Pure logic + injectable storage, so everything here is unit-testable.
 * No emoji anywhere.
 */

import { loadPlacement } from './placement';

export type DifficultyLevel = 1 | 2 | 3;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

/** Games with adaptive difficulty wired in. */
export const ADAPTED_GAMES = ['phonics-fun', 'word-builder', 'number-run'] as const;
export type AdaptedGameId = (typeof ADAPTED_GAMES)[number];

/** How many recent results the engine remembers per game. */
const MAX_HISTORY = 10;
/** Sliding window used for level-up / level-down decisions. */
const WINDOW = 5;

interface AdaptRecord {
  level: DifficultyLevel;
  results: boolean[];
}

/**
 * Storage key for one child's adaptive record in one game. Scoped by child:
 * siblings share an iPad, and a shared key made one child's results change
 * the other's difficulty.
 */
export function adaptKey(childId: string, gameId: string): string {
  return `sky-adapt-${childId}-${gameId}`;
}

/** Pre-Wave-11 key shared by every child on the device; removed on sight. */
function legacyAdaptKey(gameId: string): string {
  return `sky-adapt-${gameId}`;
}

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
}

function readRecord(childId: string, gameId: string, storage?: StorageLike | null): AdaptRecord | null {
  const store = resolveStorage(storage);
  if (!store) return null;
  try {
    const raw = store.getItem(adaptKey(childId, gameId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdaptRecord>;
    if (parsed.level !== 1 && parsed.level !== 2 && parsed.level !== 3) return null;
    if (!Array.isArray(parsed.results)) return null;
    return {
      level: parsed.level,
      results: parsed.results.filter((r): r is boolean => typeof r === 'boolean'),
    };
  } catch {
    return null;
  }
}

function writeRecord(childId: string, gameId: string, record: AdaptRecord, storage?: StorageLike | null): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.setItem(adaptKey(childId, gameId), JSON.stringify(record));
    store.removeItem?.(legacyAdaptKey(gameId));
  } catch {
    /* storage full or unavailable — adaptation simply stays put */
  }
}

/**
 * Record one answered question. Keeps the last MAX_HISTORY results per game.
 * Fire-and-forget; safe to call from event handlers.
 */
export function recordResult(
  childId: string,
  gameId: string,
  correct: boolean,
  storage?: StorageLike | null
): void {
  const record = readRecord(childId, gameId, storage) ?? { level: 1 as DifficultyLevel, results: [] };
  record.results = [...record.results, correct].slice(-MAX_HISTORY);
  writeRecord(childId, gameId, record, storage);
}

/**
 * The difficulty level to serve for a game right now.
 *
 * - 3+ correct in the last 5 -> level up (max 3)
 * - 3+ wrong in the last 5 -> level down (min 1)
 * - otherwise the stored level stands
 *
 * New players with no history start at `seedLevel` (default 1). The adjusted
 * level is persisted so it ratchets across sessions instead of recomputing
 * from scratch.
 */
export function levelFor(
  childId: string,
  gameId: string,
  seedLevel: DifficultyLevel = 1,
  storage?: StorageLike | null
): DifficultyLevel {
  const record = readRecord(childId, gameId, storage);
  if (!record || record.results.length === 0) {
    writeRecord(childId, gameId, { level: seedLevel, results: [] }, storage);
    return seedLevel;
  }
  const recent = record.results.slice(-WINDOW);
  const correct = recent.filter(Boolean).length;
  const wrong = recent.length - correct;
  let next = record.level;
  if (correct >= 3 && next < 3) {
    next = (next + 1) as DifficultyLevel;
  } else if (wrong >= 3 && next > 1) {
    next = (next - 1) as DifficultyLevel;
  }
  if (next !== record.level) {
    writeRecord(childId, gameId, { level: next, results: record.results }, storage);
  }
  return next;
}

/**
 * Seed difficulty for a child: players who finished the Welcome Quest start
 * at level 2 (the quest already calibrated them); everyone else starts at 1.
 */
export function placementSeedLevel(childId: string): DifficultyLevel {
  try {
    return loadPlacement(childId) ? 2 : 1;
  } catch {
    return 1;
  }
}

/**
 * Bias a level ramp toward easier (level 1) or harder (level 3) content.
 * Level 2 returns the ramp unchanged. Shifts never leave the ramp's own
 * min/max, so content stays within the game's designed range.
 */
export function adaptiveRamp(baseRamp: number[], level: DifficultyLevel): number[] {
  if (level === 2) return [...baseRamp];
  if (baseRamp.length === 0) return [];
  const lo = Math.min(...baseRamp);
  const hi = Math.max(...baseRamp);
  if (level === 1) return baseRamp.map((v) => Math.max(lo, v - 1));
  return baseRamp.map((v) => Math.min(hi, v + 1));
}

/** Deterministic PRNG (same algorithm family as the rest of the codebase). */
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

/**
 * Pick one item per ramp slot from per-level pools (pools[i] holds level
 * i+1 items). Deterministic per seed, never repeats an item within the
 * returned set unless every pool is exhausted.
 */
export function pickAdaptiveItems<T>(
  pools: T[][],
  ramp: number[],
  seed: number,
  keyOf: (item: T) => string
): T[] {
  const rand = mulberry32(seed >>> 0);
  const used = new Set<string>();
  const all = pools.flat();
  return ramp.map((level) => {
    const poolIndex = Math.min(Math.max(Math.round(level), 1), pools.length) - 1;
    const pool = pools[poolIndex] ?? [];
    let candidates = pool.filter((item) => !used.has(keyOf(item)));
    if (candidates.length === 0) candidates = all.filter((item) => !used.has(keyOf(item)));
    if (candidates.length === 0) candidates = pool.length > 0 ? pool : all;
    const pick = candidates[Math.floor(rand() * candidates.length)];
    used.add(keyOf(pick));
    return pick;
  });
}
