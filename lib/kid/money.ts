/**
 * Coin Cove — counting-money engine.
 * Coins: penny (1), nickel (5), dime (10), quarter (25).
 * L1 pennies + nickels, L2 adds dimes, L3 adds quarters.
 * Pure and deterministic: the same seed always produces the same question.
 */

import { mulberry32 } from './words';

export type MoneyLevel = 1 | 2 | 3;

export type CoinId = 'penny' | 'nickel' | 'dime' | 'quarter';

export interface CoinDef {
  id: CoinId;
  value: number;
  name: string;
}

export const COIN_DEFS: Record<CoinId, CoinDef> = {
  penny: { id: 'penny', value: 1, name: 'penny' },
  nickel: { id: 'nickel', value: 5, name: 'nickel' },
  dime: { id: 'dime', value: 10, name: 'dime' },
  quarter: { id: 'quarter', value: 25, name: 'quarter' },
};

export interface MoneyQuestion {
  level: MoneyLevel;
  coins: CoinId[];
  /** Choice values in cents. */
  choices: number[];
  /** Correct total in cents. */
  answer: number;
}

export const ROUNDS_PER_GAME = 8;

/** Level for each round of a game: gentle ramp 1,1,2,2,3,3,3,3. */
export const ROUND_LEVELS: MoneyLevel[] = [1, 1, 2, 2, 3, 3, 3, 3];

/** Coin values allowed at each level. */
export const LEVEL_VALUES: Record<MoneyLevel, number[]> = {
  1: [1, 5],
  2: [1, 5, 10],
  3: [1, 5, 10, 25],
};

const VALUE_TO_ID: Record<number, CoinId> = {
  1: 'penny',
  5: 'nickel',
  10: 'dime',
  25: 'quarter',
};

export function totalCents(coins: CoinId[]): number {
  return coins.reduce((sum, c) => sum + COIN_DEFS[c].value, 0);
}

/** "37 cents" — spoken total. */
export function spokenCents(cents: number): string {
  return `${cents} cent${cents === 1 ? '' : 's'}`;
}

/** Plausible wrong totals: off by a coin value, never the answer, unique. */
function distractors(answer: number, rng: () => number): number[] {
  const candidates = [answer + 1, answer - 1, answer + 5, answer - 5, answer + 10, answer - 10];
  const seen = new Set<number>();
  const out: number[] = [];
  const shuffled = [...candidates].sort(() => rng() - 0.5);
  for (const c of shuffled) {
    if (c > 0 && c !== answer && !seen.has(c)) {
      seen.add(c);
      out.push(c);
      if (out.length === 2) break;
    }
  }
  // Fallback (shouldn't happen): nudge further away.
  while (out.length < 2) {
    const c = answer + 10 * (out.length + 1);
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

/** Generate one counting-money question for a level. Deterministic in (level, seed). */
export function generateQuestion(level: MoneyLevel, seed: number): MoneyQuestion {
  const rng = mulberry32(seed);
  const values = LEVEL_VALUES[level];
  const count = level === 1 ? 2 + Math.floor(rng() * 3) : 3 + Math.floor(rng() * 3); // 2-4 or 3-5 coins
  const coins: CoinId[] = [];
  for (let i = 0; i < count; i += 1) {
    const v = values[Math.floor(rng() * values.length)];
    coins.push(VALUE_TO_ID[v]);
  }
  // Keep totals friendly: cap at 99 cents, trim from the end if needed.
  while (totalCents(coins) > 99) coins.pop();
  // Never leave fewer than 2 coins.
  while (coins.length < 2) coins.push(VALUE_TO_ID[values[Math.floor(rng() * values.length)]]);
  const answer = totalCents(coins);
  const choices = [answer, ...distractors(answer, rng)].sort(() => rng() - 0.5);
  return { level, coins, choices, answer };
}
