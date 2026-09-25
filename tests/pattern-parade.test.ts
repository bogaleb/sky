import { describe, expect, it } from 'vitest';
import {
  generateRound,
  PATTERN_LEVELS,
  ROUNDS_PER_GAME,
  levelForRound,
  describeItem,
  itemsEqual,
  type PatternItem,
  type PatternKind,
} from '../lib/kid/patterns';

/** Repeating-unit length per pattern kind; step kinds use STEP instead. */
const UNIT: Partial<Record<PatternKind, number>> = {
  abab: 2,
  aabb: 4,
  abcabc: 3,
  'color-ab': 2,
  combo: 2,
  'color-shape': 2,
  aab: 3,
};

/** Expected per-step delta for the counting kinds. */
const STEP: Partial<Record<PatternKind, { field: 'dots' | 'value'; delta: number }>> = {
  'growing-dots': { field: 'dots', delta: 1 },
  'shrinking-dots': { field: 'dots', delta: -1 },
  'number-plus2': { field: 'value', delta: 2 },
};

function allRounds(): Array<{ level: number; seed: number }> {
  const out: Array<{ level: number; seed: number }> = [];
  for (let level = 1; level <= 5; level++) {
    for (let seed = 0; seed < 60; seed++) out.push({ level, seed });
  }
  return out;
}

/** The full sequence with the hidden slot filled by the correct answer. */
function filledSequence(level: number, seed: number): {
  kind: PatternKind;
  full: PatternItem[];
} {
  const r = generateRound(level, seed);
  const answer = r.choices[r.answerIndex];
  const full = r.sequence.map((s) => s ?? answer);
  return { kind: r.kind, full };
}

describe('generateRound determinism', () => {
  it('returns identical rounds for the same level and seed', () => {
    for (let level = 1; level <= 5; level++) {
      for (const seed of [1, 42, 999, 123456789]) {
        expect(generateRound(level, seed)).toEqual(generateRound(level, seed));
      }
    }
  });

  it('varies across seeds', () => {
    const ids = new Set(
      Array.from({ length: 10 }, (_, s) => generateRound(3, s + 1).id),
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  it('clamps out-of-range levels into 1..5', () => {
    expect(generateRound(0, 7).level).toBe(1);
    expect(generateRound(99, 7).level).toBe(5);
  });
});

describe('round structure', () => {
  it('has 5-7 items with exactly one hidden slot, never first', () => {
    for (const { level, seed } of allRounds()) {
      const r = generateRound(level, seed);
      expect(r.sequence.length).toBeGreaterThanOrEqual(5);
      expect(r.sequence.length).toBeLessThanOrEqual(7);
      expect(r.sequence.filter((s) => s === null)).toHaveLength(1);
      expect(r.missingIndex).toBeGreaterThanOrEqual(1);
      expect(r.sequence[r.missingIndex]).toBeNull();
      expect(r.sequence[0]).not.toBeNull();
    }
  });

  it('uses a kind from its level and 3-4 choices', () => {
    for (const { level, seed } of allRounds()) {
      const r = generateRound(level, seed);
      const def = PATTERN_LEVELS[level - 1];
      expect(def.kinds).toContain(r.kind);
      expect(r.choices).toHaveLength(level <= 2 ? 3 : 4);
      expect(r.answerIndex).toBeGreaterThanOrEqual(0);
      expect(r.answerIndex).toBeLessThan(r.choices.length);
    }
  });

  it('has exactly one correct choice and distractors never equal the answer', () => {
    for (const { level, seed } of allRounds()) {
      const r = generateRound(level, seed);
      const answer = r.choices[r.answerIndex];
      const matches = r.choices.filter((c) => itemsEqual(c, answer));
      expect(matches).toHaveLength(1);
      r.choices.forEach((c, i) => {
        if (i !== r.answerIndex) {
          expect(itemsEqual(c, answer)).toBe(false);
        }
      });
      // choices are pairwise distinct
      for (let i = 0; i < r.choices.length; i++) {
        for (let j = i + 1; j < r.choices.length; j++) {
          expect(itemsEqual(r.choices[i], r.choices[j])).toBe(false);
        }
      }
    }
  });
});

describe('the correct answer truly continues the pattern', () => {
  it('repeating-unit kinds cycle their unit exactly', () => {
    for (const { level, seed } of allRounds()) {
      const { kind, full } = filledSequence(level, seed);
      const unit = UNIT[kind];
      if (unit === undefined) continue;
      for (let i = 0; i < full.length; i++) {
        expect(
          itemsEqual(full[i], full[i % unit]),
          `${kind} seed=${seed} position ${i}`,
        ).toBe(true);
      }
    }
  });

  it('counting kinds step by their constant delta', () => {
    for (const { level, seed } of allRounds()) {
      const { kind, full } = filledSequence(level, seed);
      const step = STEP[kind];
      if (!step) continue;
      for (let i = 1; i < full.length; i++) {
        const prev = full[i - 1][step.field] ?? 0;
        const cur = full[i][step.field] ?? 0;
        expect(cur - prev, `${kind} seed=${seed} position ${i}`).toBe(
          step.delta,
        );
      }
    }
  });
});

describe('PATTERN_LEVELS', () => {
  it('has 5 ordered levels covering all 10 kinds', () => {
    expect(PATTERN_LEVELS).toHaveLength(5);
    expect(PATTERN_LEVELS.map((l) => l.level)).toEqual([1, 2, 3, 4, 5]);
    const kinds = new Set(PATTERN_LEVELS.flatMap((l) => l.kinds));
    expect(kinds.size).toBe(10);
    for (const l of PATTERN_LEVELS) {
      expect(l.name.length).toBeGreaterThan(0);
      expect(l.kinds.length).toBeGreaterThan(0);
    }
  });

  it('ramps levels across an 8-round game', () => {
    expect(ROUNDS_PER_GAME).toBe(8);
    expect(
      Array.from({ length: ROUNDS_PER_GAME }, (_, i) => levelForRound(i)),
    ).toEqual([1, 1, 2, 2, 3, 3, 4, 5]);
  });
});

describe('describeItem and itemsEqual', () => {
  it('describes every item shape for speech', () => {
    expect(
      describeItem({ shape: 'circle', color: 'red', size: 'large' }),
    ).toBe('big red circle');
    expect(
      describeItem({ shape: 'square', color: 'blue', size: 'small' }),
    ).toBe('little blue square');
    expect(
      describeItem({ shape: 'circle', color: 'green', size: 'medium', dots: 3 }),
    ).toBe('3 green dots');
    expect(
      describeItem({ shape: 'star', color: 'yellow', size: 'medium', value: 8 }),
    ).toBe('the number 8');
  });

  it('compares items structurally', () => {
    const a: PatternItem = { shape: 'circle', color: 'red', size: 'medium' };
    expect(itemsEqual(a, { ...a })).toBe(true);
    expect(itemsEqual(a, { ...a, size: 'large' })).toBe(false);
    expect(itemsEqual(a, { ...a, dots: 2 })).toBe(false);
  });
});
