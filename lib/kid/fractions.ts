/**
 * Fraction Fair: halves, thirds, and quarters.
 *
 * Pure, deterministic question engine for the fractions game.
 * Levels: L1 = halves only, L2 = halves + quarters, L3 = + thirds.
 * No emoji anywhere — kids read fraction names and pictures.
 */

import { mulberry32 } from './words';

export type FractionKind = 'shade' | 'pick' | 'share';
export type FractionWhole = 'pizza' | 'pie' | 'bar';

export interface FractionQuestion {
  kind: FractionKind;
  whole: FractionWhole;
  /** Numerator: how many parts are (or should be) shaded. */
  shaded: number;
  /** Denominator: total equal parts. */
  parts: number;
  /** Three fraction labels, e.g. ["1/2","1/4","2/4"]. */
  choices: [string, string, string];
  /** The correct choice label. */
  answer: string;
}

export const ROUND_LEVELS = [1, 1, 2, 2, 3, 3, 2, 3];
export const ROUNDS_PER_GAME = 8;

const LEVEL_PARTS: Record<number, number[]> = {
  1: [2],
  2: [2, 4],
  3: [2, 3, 4],
};

const FRACTION_LABELS: Record<string, string> = {
  '1/2': 'one half',
  '2/2': 'one whole',
  '1/3': 'one third',
  '2/3': 'two thirds',
  '3/3': 'one whole',
  '1/4': 'one quarter',
  '2/4': 'two quarters',
  '3/4': 'three quarters',
  '4/4': 'one whole',
};

/** Spoken kid-friendly name, e.g. "one half", "three quarters". */
export function fractionName(numerator: number, denominator: number): string {
  const key = `${numerator}/${denominator}`;
  return FRACTION_LABELS[key] ?? `${numerator} out of ${denominator} parts`;
}

/** Compact label for choice buttons, e.g. "1/2". */
export function fractionLabel(numerator: number, denominator: number): string {
  return `${numerator}/${denominator}`;
}

/** Which denominators are allowed at a level (1..3). */
export function partsForLevel(level: number): number[] {
  return LEVEL_PARTS[Math.min(3, Math.max(1, level))] ?? [2];
}

const WHOLES: FractionWhole[] = ['pizza', 'pie', 'bar'];
const KINDS: FractionKind[] = ['shade', 'pick', 'share'];

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/**
 * Build two distractors: fractions with different values than the answer.
 * Deterministic; always returns 2 unique labels different from the answer.
 */
export function distractorFractions(
  rng: () => number,
  answerNum: number,
  answerDen: number,
): [string, string] {
  const seen = new Set<string>([fractionLabel(answerNum, answerDen)]);
  const out: string[] = [];
  const candidates: Array<[number, number]> = [];
  for (const d of [2, 3, 4]) {
    for (let n = 1; n < d; n++) {
      if (n / d !== answerNum / answerDen) candidates.push([n, d]);
    }
  }
  // Shuffle deterministically.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  for (const [n, d] of candidates) {
    const label = fractionLabel(n, d);
    if (!seen.has(label)) {
      seen.add(label);
      out.push(label);
      if (out.length === 2) break;
    }
  }
  return [out[0], out[1]];
}

/** One seeded question. `seed` may be any integer. */
export function generateQuestion(level: number, seed: number): FractionQuestion {
  const rng = mulberry32(seed);
  const parts = pick(rng, partsForLevel(level));
  const shaded = 1 + Math.floor(rng() * (parts - 1)); // 1 .. parts-1
  const whole = pick(rng, WHOLES);
  const kind = pick(rng, KINDS);
  const answer = fractionLabel(shaded, parts);
  const [d1, d2] = distractorFractions(rng, shaded, parts);
  const choices: [string, string, string] = [answer, d1, d2];
  // Seeded shuffle of the three choices.
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return { kind, whole, shaded, parts, choices, answer };
}

/** Full 8-round session, levels ramped by ROUND_LEVELS. */
export function pickSession(seed: number): FractionQuestion[] {
  return ROUND_LEVELS.map((level, i) => generateQuestion(level, seed * 31 + i * 7 + 3));
}
