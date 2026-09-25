import { describe, expect, it } from 'vitest';
import {
  fractionName,
  fractionLabel,
  partsForLevel,
  distractorFractions,
  generateQuestion,
  pickSession,
  ROUNDS_PER_GAME,
  ROUND_LEVELS,
} from '../lib/kid/fractions';

describe('fractionName', () => {
  it('names halves, thirds, and quarters kid-style', () => {
    expect(fractionName(1, 2)).toBe('one half');
    expect(fractionName(1, 3)).toBe('one third');
    expect(fractionName(2, 3)).toBe('two thirds');
    expect(fractionName(1, 4)).toBe('one quarter');
    expect(fractionName(2, 4)).toBe('two quarters');
    expect(fractionName(3, 4)).toBe('three quarters');
  });

  it('has no emoji in any known name', () => {
    for (const d of [2, 3, 4]) {
      for (let n = 1; n < d; n++) {
        const name = fractionName(n, d);
        expect(name).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u);
      }
    }
  });
});

describe('fractionLabel', () => {
  it('formats compact labels', () => {
    expect(fractionLabel(1, 2)).toBe('1/2');
    expect(fractionLabel(3, 4)).toBe('3/4');
  });
});

describe('partsForLevel', () => {
  it('gates denominators by level', () => {
    expect(partsForLevel(1)).toEqual([2]);
    expect(partsForLevel(2)).toEqual([2, 4]);
    expect(partsForLevel(3)).toEqual([2, 3, 4]);
  });

  it('clamps out-of-range levels', () => {
    expect(partsForLevel(0)).toEqual([2]);
    expect(partsForLevel(99)).toEqual([2, 3, 4]);
  });
});

describe('distractorFractions', () => {
  it('returns two unique labels different from the answer', () => {
    const rng = () => 0.5;
    const [d1, d2] = distractorFractions(rng, 1, 2);
    expect(d1).not.toBe('1/2');
    expect(d2).not.toBe('1/2');
    expect(d1).not.toBe(d2);
  });

  it('never duplicates the answer value (e.g. 2/4 equals 1/2)', () => {
    // 2/4 has the same value as 1/2; the candidate pool excludes equal values.
    for (let s = 0; s < 20; s++) {
      const rng = (() => {
        let n = s;
        return () => {
          n = (n * 9301 + 49297) % 233280;
          return n / 233280;
        };
      })();
      const [d1, d2] = distractorFractions(rng, 1, 2);
      for (const d of [d1, d2]) {
        const [n, den] = d.split('/').map(Number);
        expect(n / den).not.toBe(1 / 2);
      }
    }
  });
});

describe('generateQuestion', () => {
  it('is deterministic for the same seed', () => {
    expect(generateQuestion(2, 42)).toEqual(generateQuestion(2, 42));
  });

  it('varies across seeds', () => {
    const a = JSON.stringify(generateQuestion(2, 1));
    const b = JSON.stringify(generateQuestion(2, 2));
    expect(a).not.toBe(b);
  });

  it('keeps L1 to halves', () => {
    for (let s = 0; s < 30; s++) {
      const q = generateQuestion(1, s);
      expect(q.parts).toBe(2);
    }
  });

  it('keeps L2 to halves and quarters', () => {
    for (let s = 0; s < 30; s++) {
      const q = generateQuestion(2, s);
      expect([2, 4]).toContain(q.parts);
    }
  });

  it('always includes the answer among 3 unique choices', () => {
    for (let s = 0; s < 50; s++) {
      const q = generateQuestion(3, s);
      expect(q.choices).toHaveLength(3);
      expect(new Set(q.choices).size).toBe(3);
      expect(q.choices).toContain(q.answer);
    }
  });

  it('shades a proper fraction (numerator between 1 and parts-1)', () => {
    for (let s = 0; s < 50; s++) {
      const q = generateQuestion(3, s);
      expect(q.shaded).toBeGreaterThanOrEqual(1);
      expect(q.shaded).toBeLessThan(q.parts);
    }
  });

  it('uses valid kinds and wholes', () => {
    for (let s = 0; s < 30; s++) {
      const q = generateQuestion(2, s);
      expect(['shade', 'pick', 'share']).toContain(q.kind);
      expect(['pizza', 'pie', 'bar']).toContain(q.whole);
    }
  });
});

describe('pickSession', () => {
  it('builds 8 rounds following the level ramp', () => {
    const session = pickSession(7);
    expect(session).toHaveLength(ROUNDS_PER_GAME);
    expect(ROUND_LEVELS).toHaveLength(ROUNDS_PER_GAME);
    // First two rounds are level 1 (halves only).
    expect(session[0].parts).toBe(2);
    expect(session[1].parts).toBe(2);
  });

  it('is deterministic per seed and varies across seeds', () => {
    expect(JSON.stringify(pickSession(5))).toBe(JSON.stringify(pickSession(5)));
    expect(JSON.stringify(pickSession(5))).not.toBe(JSON.stringify(pickSession(6)));
  });
});

describe('content hygiene', () => {
  it('has no emoji in generated prompts', () => {
    for (let s = 0; s < 20; s++) {
      const q = generateQuestion(3, s);
      const blob = JSON.stringify(q);
      expect(blob).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u);
    }
  });
});
