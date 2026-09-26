import { describe, it, expect } from 'vitest';
import {
  MIXES,
  mixesForLevel,
  mix,
  generateQuestion,
  ROUND_LEVELS,
  ROUNDS_PER_GAME,
  PAINT_PALETTE,
  COLOR_DEFS,
  type MixLevel,
} from '../lib/kid/colors';

describe('mixes', () => {
  it('has exactly 10 mixes', () => {
    expect(MIXES).toHaveLength(10);
  });

  it('has the 3 primary mixes at level 1', () => {
    expect(mix('red', 'blue')).toBe('purple');
    expect(mix('red', 'yellow')).toBe('orange');
    expect(mix('blue', 'yellow')).toBe('green');
  });

  it('mixes are order-independent', () => {
    for (const m of MIXES) {
      expect(mix(m.a, m.b)).toBe(m.result);
      expect(mix(m.b, m.a)).toBe(m.result);
    }
  });

  it('mixes a color with itself to itself', () => {
    expect(mix('red', 'red')).toBe('red');
    expect(mix('white', 'white')).toBe('white');
  });

  it('returns null for unknown pairs', () => {
    expect(mix('black', 'red')).toBeNull();
  });

  it('has the tint mixes at level 2', () => {
    expect(mix('red', 'white')).toBe('pink');
    expect(mix('blue', 'white')).toBe('light blue');
    expect(mix('black', 'white')).toBe('gray');
  });

  it('has the level 3 mixes', () => {
    expect(mix('red', 'green')).toBe('brown');
    expect(mix('yellow', 'purple')).toBe('brown');
    expect(mix('blue', 'green')).toBe('teal');
    expect(mix('red', 'purple')).toBe('magenta');
  });

  it('every mix input is on the paint palette and every result has a hex', () => {
    for (const m of MIXES) {
      expect(PAINT_PALETTE).toContain(m.a);
      expect(PAINT_PALETTE).toContain(m.b);
      expect(COLOR_DEFS[m.result].hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('mix definitions are unique pairs', () => {
    const keys = MIXES.map((m) => [m.a, m.b].sort().join('+'));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('level gating', () => {
  it('mixesForLevel returns only that level', () => {
    expect(mixesForLevel(1).every((m) => m.level === 1)).toBe(true);
    expect(mixesForLevel(2).every((m) => m.level === 2)).toBe(true);
    expect(mixesForLevel(3).every((m) => m.level === 3)).toBe(true);
    expect(mixesForLevel(1)).toHaveLength(3);
    expect(mixesForLevel(2)).toHaveLength(3);
    expect(mixesForLevel(3)).toHaveLength(4);
  });

  it('round ramp is 1,1,2,2,3,3,3,3 for 8 rounds', () => {
    expect(ROUNDS_PER_GAME).toBe(8);
    expect(ROUND_LEVELS).toEqual([1, 1, 2, 2, 3, 3, 3, 3]);
  });
});

describe('generateQuestion', () => {
  it('is deterministic for a seed', () => {
    const q1 = generateQuestion(1, 42);
    const q2 = generateQuestion(1, 42);
    expect(q1).toEqual(q2);
  });

  it('varies with the seed', () => {
    const q1 = generateQuestion(2, 1);
    const q2 = generateQuestion(2, 2);
    expect(q1).not.toEqual(q2);
  });

  it('answer is the true mix of a and b, choices contain it once', () => {
    for (const level of [1, 2, 3] as MixLevel[]) {
      for (let seed = 0; seed < 20; seed++) {
        const q = generateQuestion(level, seed);
        expect(q.answer).toBe(mix(q.a, q.b));
        expect(q.choices).toHaveLength(3);
        expect(q.choices.filter((c) => c === q.answer)).toHaveLength(1);
        expect(new Set(q.choices).size).toBe(3);
        // Mix comes from the requested level.
        expect(mixesForLevel(level).some((m) => m.a === q.a && m.b === q.b)).toBe(true);
      }
    }
  });

  it('user-facing color names are emoji-free', () => {
    // The lab speaks color names aloud and shows them on big buttons, so the
    // hygiene invariant belongs on the data the kid actually sees/hears.
    const names = Object.values(COLOR_DEFS).map((d) => d.name);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u);
    }
    // Mix endpoints resolve to named colors too.
    for (const m of MIXES) {
      expect(COLOR_DEFS[m.result].name).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u);
    }
  });
});
