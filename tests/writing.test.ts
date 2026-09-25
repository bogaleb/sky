import { describe, expect, it } from 'vitest';
import {
  DIGITS,
  LETTERS,
  LOWERCASE,
  SESSION_LENGTH,
  TRACE_COVERAGE_REQUIRED,
  TRACE_TOLERANCE,
  UPPERCASE,
  letterPassed,
  letterStrokes,
  phonicsFor,
  pickSessionLetters,
  sampleStroke,
  strokeCoverage,
} from '../lib/kid/writing';

describe('letter stroke data', () => {
  it('covers A-Z, a-z, and 0-9 (62 characters)', () => {
    expect(LETTERS).toHaveLength(62);
    expect(new Set(LETTERS).size).toBe(62);
  });

  it('every character has at least one stroke with at least two points', () => {
    for (const ch of LETTERS) {
      const strokes = letterStrokes(ch);
      expect(strokes.length, ch).toBeGreaterThanOrEqual(1);
      for (const s of strokes) {
        expect(s.length, `${ch} stroke`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('all stroke points are within the 0-100 box', () => {
    for (const ch of LETTERS) {
      for (const s of letterStrokes(ch)) {
        for (const [x, y] of s) {
          expect(x, `${ch} x`).toBeGreaterThanOrEqual(0);
          expect(x, `${ch} x`).toBeLessThanOrEqual(100);
          expect(y, `${ch} y`).toBeGreaterThanOrEqual(0);
          expect(y, `${ch} y`).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('most letters use 2-4 strokes', () => {
    for (const ch of LETTERS) {
      const n = letterStrokes(ch).length;
      expect(n, ch).toBeGreaterThanOrEqual(1);
      expect(n, ch).toBeLessThanOrEqual(4);
    }
  });

  it('unknown characters return an empty stroke list', () => {
    expect(letterStrokes('!')).toEqual([]);
    expect(letterStrokes('')).toEqual([]);
  });
});

describe('tracing constants', () => {
  it('tolerance is generous but sane (8-20 units)', () => {
    expect(TRACE_TOLERANCE).toBeGreaterThanOrEqual(8);
    expect(TRACE_TOLERANCE).toBeLessThanOrEqual(20);
  });

  it('coverage requirement is 60%', () => {
    expect(TRACE_COVERAGE_REQUIRED).toBe(0.6);
  });
});

describe('stroke coverage', () => {
  it('a perfect retrace scores 1', () => {
    const model = letterStrokes('L')[0];
    const kid = sampleStroke(model, 60);
    expect(strokeCoverage(model, kid)).toBe(1);
  });

  it('drawing nowhere near scores 0', () => {
    const model = letterStrokes('L')[0];
    const kid: Array<[number, number]> = [[95, 95], [96, 96], [97, 97]];
    expect(strokeCoverage(model, kid)).toBe(0);
  });

  it('no kid points scores 0', () => {
    expect(strokeCoverage(letterStrokes('O')[0], [])).toBe(0);
  });

  it('a half-traced stroke scores below the pass bar', () => {
    const model = letterStrokes('L')[0]; // vertical stem then foot
    const half = sampleStroke([model[0], [model[0][0], 50]], 30);
    expect(strokeCoverage(model, half)).toBeLessThan(TRACE_COVERAGE_REQUIRED);
  });
});

describe('letterPassed', () => {
  it('passes when every stroke is well traced (order irrelevant)', () => {
    const ch = 'T';
    const strokes = letterStrokes(ch);
    // Draw strokes in REVERSE order to prove order is forgiven.
    const kid = [...strokes].reverse().flatMap((s) => sampleStroke(s, 40));
    expect(letterPassed(ch, kid)).toBe(true);
  });

  it('fails when a stroke is missing', () => {
    const ch = 'T';
    const kid = sampleStroke(letterStrokes(ch)[0], 60); // only the top bar
    expect(letterPassed(ch, kid)).toBe(false);
  });

  it('fails for unknown characters', () => {
    expect(letterPassed('!', [[50, 50]])).toBe(false);
  });
});

describe('session generator', () => {
  it('produces 8 letters: 4 uppercase, 2 lowercase, 2 digits', () => {
    const s = pickSessionLetters(42);
    expect(s).toHaveLength(SESSION_LENGTH);
    expect(s.slice(0, 4).every((c) => UPPERCASE.includes(c))).toBe(true);
    expect(s.slice(4, 6).every((c) => LOWERCASE.includes(c))).toBe(true);
    expect(s.slice(6, 8).every((c) => DIGITS.includes(c))).toBe(true);
  });

  it('is deterministic per seed', () => {
    expect(pickSessionLetters(7)).toEqual(pickSessionLetters(7));
  });

  it('varies across seeds', () => {
    expect(pickSessionLetters(1)).not.toEqual(pickSessionLetters(999));
  });

  it('has no repeats within a session', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const s = pickSessionLetters(seed);
      expect(new Set(s.map((c) => c.toLowerCase())).size).toBe(s.length);
    }
  });
});

describe('phonics', () => {
  it('every letter and digit has a name, sound, and word', () => {
    for (const ch of LETTERS) {
      const p = phonicsFor(ch);
      expect(p.name.trim().length, ch).toBeGreaterThan(0);
      expect(p.sound.trim().length, ch).toBeGreaterThan(0);
      expect(p.word.trim().length, ch).toBeGreaterThan(0);
    }
  });

  it('is case-insensitive', () => {
    expect(phonicsFor('b')).toEqual(phonicsFor('B'));
  });

  it('falls back gracefully for unknown input', () => {
    expect(phonicsFor('!').name).toBe('!');
  });

  it('has no emoji anywhere', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    for (const ch of LETTERS) {
      const p = phonicsFor(ch);
      expect(emoji.test(p.name + p.sound + p.word), ch).toBe(false);
    }
  });
});
