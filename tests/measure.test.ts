import { describe, expect, it } from 'vitest';
import {
  ROUNDS_PER_GAME,
  ROUND_LEVELS,
  KIND_ASK,
  generateQuestion,
  optionSize,
  type MeasureLevel,
  type MeasureQuestion,
} from '../lib/kid/measure';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

function allQuestions(): MeasureQuestion[] {
  const out: MeasureQuestion[] = [];
  for (const level of [1, 2, 3] as MeasureLevel[]) {
    for (let seed = 0; seed < 60; seed++) out.push(generateQuestion(level, seed * 7919 + level));
  }
  return out;
}

describe('measure engine correctness', () => {
  it('always has 3 options with distinct sizes and the answer is the largest', () => {
    for (const q of allQuestions()) {
      expect(q.options).toHaveLength(3);
      const sizes = q.options.map((o) => o.size);
      expect(new Set(sizes).size).toBe(3);
      const winner = q.options.find((o) => o.id === q.answer)!;
      expect(winner.size).toBe(Math.max(...sizes));
    }
  });

  it('reports optionSize consistently with units', () => {
    for (const q of allQuestions()) {
      for (const o of q.options) {
        if (o.units) {
          expect(optionSize(o)).toBe(o.units.count * o.units.def.value);
          expect(o.size).toBe(optionSize(o));
        } else {
          expect(optionSize(o)).toBe(o.size);
        }
      }
    }
  });

  it('is deterministic for the same seed', () => {
    for (const level of [1, 2, 3] as MeasureLevel[]) {
      expect(generateQuestion(level, 12345)).toEqual(generateQuestion(level, 12345));
    }
  });

  it('varies across seeds', () => {
    const a = JSON.stringify(generateQuestion(2, 1));
    const b = JSON.stringify(generateQuestion(2, 2));
    expect(a).not.toBe(b);
  });
});

describe('level gating', () => {
  it('L1 only asks longer/taller with obvious differences', () => {
    for (let seed = 0; seed < 60; seed++) {
      const q = generateQuestion(1, seed);
      expect(['longer', 'taller']).toContain(q.kind);
      const sizes = q.options.map((o) => o.size).sort((a, b) => a - b);
      expect(sizes[2] / sizes[0]).toBe(3); // 1x / 2x / 3x
    }
  });

  it('L2 and L3 use all four kinds across seeds', () => {
    for (const level of [2, 3] as MeasureLevel[]) {
      const kinds = new Set<string>();
      for (let seed = 0; seed < 120; seed++) kinds.add(generateQuestion(level, seed).kind);
      expect(kinds).toEqual(new Set(['longer', 'taller', 'heavier', 'holds-more']));
    }
  });

  it('L2 differences are closer than L1', () => {
    for (let seed = 0; seed < 60; seed++) {
      const q = generateQuestion(2, seed * 31 + 7);
      const sizes = q.options.map((o) => o.size).sort((a, b) => a - b);
      expect(sizes[2] / sizes[0]).toBeLessThan(2.5);
    }
  });

  it('L3 sometimes uses mixed non-standard units', () => {
    let mixed = 0;
    for (let seed = 0; seed < 120; seed++) {
      const q = generateQuestion(3, seed);
      if (q.options.some((o) => o.units)) mixed++;
    }
    expect(mixed).toBeGreaterThan(0);
  });

  it('mixed units can mislead pure counting (more units is not always bigger)', () => {
    let tricky = 0;
    for (let seed = 0; seed < 300; seed++) {
      const q = generateQuestion(3, seed);
      const withUnits = q.options.filter((o) => o.units);
      if (withUnits.length < 2) continue;
      const mostUnits = withUnits.reduce((a, b) => (b.units!.count > a.units!.count ? b : a));
      if (mostUnits.id !== q.answer) tricky++;
    }
    expect(tricky).toBeGreaterThan(0);
  });

  it('mixed-unit labels name the count and unit', () => {
    let seen = 0;
    for (let seed = 0; seed < 120; seed++) {
      const q = generateQuestion(3, seed);
      for (const o of q.options) {
        if (!o.units) continue;
        seen++;
        const word = o.units.count === 1 ? o.units.def.unit : o.units.def.plural;
        expect(o.label).toBe(`${o.units.count} ${word}`);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('never mixes units at L1 or L2', () => {
    for (const level of [1, 2] as MeasureLevel[]) {
      for (let seed = 0; seed < 60; seed++) {
        expect(generateQuestion(level, seed).options.some((o) => o.units)).toBe(false);
      }
    }
  });
});

describe('round structure', () => {
  it('has 8 rounds with the gentle level ramp', () => {
    expect(ROUNDS_PER_GAME).toBe(8);
    expect(ROUND_LEVELS).toEqual([1, 1, 2, 2, 3, 3, 3, 3]);
  });

  it('every kind has a non-empty ask prompt', () => {
    for (const kind of Object.keys(KIND_ASK) as (keyof typeof KIND_ASK)[]) {
      expect(KIND_ASK[kind].length).toBeGreaterThan(10);
    }
  });
});

describe('content hygiene', () => {
  it('has no emoji in asks or labels', () => {
    for (const q of allQuestions()) {
      expect(JSON.stringify(q)).not.toMatch(EMOJI_RE);
    }
  });

  it('labels are kid-friendly and non-empty', () => {
    for (const q of allQuestions()) {
      for (const o of q.options) {
        expect(o.label.trim().length).toBeGreaterThan(2);
        expect(o.label).not.toMatch(/\d+\.\d+/); // no decimals for little kids
      }
    }
  });
});
