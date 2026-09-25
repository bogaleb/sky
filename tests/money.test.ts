import { describe, expect, it } from 'vitest';
import {
  COIN_DEFS,
  LEVEL_VALUES,
  ROUND_LEVELS,
  ROUNDS_PER_GAME,
  generateQuestion,
  spokenCents,
  totalCents,
  type MoneyLevel,
} from '../lib/kid/money';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe('COIN_DEFS', () => {
  it('has the four US coins with correct values', () => {
    expect(COIN_DEFS.penny.value).toBe(1);
    expect(COIN_DEFS.nickel.value).toBe(5);
    expect(COIN_DEFS.dime.value).toBe(10);
    expect(COIN_DEFS.quarter.value).toBe(25);
  });
});

describe('totalCents', () => {
  it('sums coin values', () => {
    expect(totalCents(['penny', 'penny', 'penny'])).toBe(3);
    expect(totalCents(['nickel', 'dime'])).toBe(15);
    expect(totalCents(['quarter', 'quarter', 'dime', 'penny'])).toBe(61);
    expect(totalCents([])).toBe(0);
  });
});

describe('spokenCents', () => {
  it('says cents with singular handling', () => {
    expect(spokenCents(1)).toBe('1 cent');
    expect(spokenCents(37)).toBe('37 cents');
  });
  it('has no emoji', () => {
    expect(spokenCents(5)).not.toMatch(EMOJI_RE);
  });
});

describe('generateQuestion', () => {
  it('is deterministic for the same seed', () => {
    expect(generateQuestion(3, 777)).toEqual(generateQuestion(3, 777));
  });
  it('varies across seeds', () => {
    const seen = new Set<number>();
    for (let s = 0; s < 20; s += 1) seen.add(generateQuestion(1, s).answer);
    expect(seen.size).toBeGreaterThan(3);
  });
  it('answer equals the sum of the coins', () => {
    for (const level of [1, 2, 3] as MoneyLevel[]) {
      for (let s = 0; s < 30; s += 1) {
        const q = generateQuestion(level, s);
        expect(q.answer).toBe(totalCents(q.coins));
      }
    }
  });
  it('uses only level-appropriate coins', () => {
    for (const level of [1, 2, 3] as MoneyLevel[]) {
      const allowed = new Set(LEVEL_VALUES[level]);
      for (let s = 0; s < 30; s += 1) {
        const q = generateQuestion(level, s);
        for (const c of q.coins) {
          expect(allowed.has(COIN_DEFS[c].value)).toBe(true);
        }
      }
    }
  });
  it('L1 never uses dimes or quarters', () => {
    for (let s = 0; s < 50; s += 1) {
      const q = generateQuestion(1, s);
      expect(q.coins).not.toContain('dime');
      expect(q.coins).not.toContain('quarter');
    }
  });
  it('keeps totals at 99 cents or under', () => {
    for (const level of [1, 2, 3] as MoneyLevel[]) {
      for (let s = 0; s < 50; s += 1) {
        const q = generateQuestion(level, s);
        expect(q.answer).toBeLessThanOrEqual(99);
        expect(q.coins.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
  it('always has exactly 3 unique positive choices containing the answer', () => {
    for (const level of [1, 2, 3] as MoneyLevel[]) {
      for (let s = 0; s < 50; s += 1) {
        const q = generateQuestion(level, s);
        expect(q.choices).toHaveLength(3);
        expect(new Set(q.choices).size).toBe(3);
        expect(q.choices).toContain(q.answer);
        for (const c of q.choices) expect(c).toBeGreaterThan(0);
      }
    }
  });
  it('coin names have no emoji', () => {
    for (const id of ['penny', 'nickel', 'dime', 'quarter'] as const) {
      expect(COIN_DEFS[id].name).not.toMatch(EMOJI_RE);
    }
  });
});

describe('game structure', () => {
  it('has 8 rounds with a gentle level ramp', () => {
    expect(ROUNDS_PER_GAME).toBe(8);
    expect(ROUND_LEVELS).toHaveLength(8);
    expect(ROUND_LEVELS).toEqual([1, 1, 2, 2, 3, 3, 3, 3]);
  });
});
