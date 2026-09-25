import { describe, expect, it } from 'vitest';
import {
  formatTime,
  spokenTime,
  handAngles,
  generateQuestion,
  ROUND_LEVELS,
  ROUNDS_PER_GAME,
  type TimeLevel,
} from '../lib/kid/time';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe('formatTime', () => {
  it('pads minutes', () => {
    expect(formatTime(3, 0)).toBe('3:00');
    expect(formatTime(11, 30)).toBe('11:30');
    expect(formatTime(12, 15)).toBe('12:15');
    expect(formatTime(9, 45)).toBe('9:45');
  });
});

describe('spokenTime', () => {
  it('says o clock on the hour', () => {
    expect(spokenTime(3, 0)).toBe('three o\'clock');
    expect(spokenTime(12, 0)).toBe('twelve o\'clock');
  });
  it('says half past as "thirty"', () => {
    expect(spokenTime(4, 30)).toBe('four thirty');
  });
  it('says quarter past', () => {
    expect(spokenTime(2, 15)).toBe('quarter past two');
  });
  it('says quarter to the next hour', () => {
    expect(spokenTime(3, 45)).toBe('quarter to four');
    expect(spokenTime(12, 45)).toBe('quarter to one');
  });
  it('has no emoji', () => {
    for (let h = 1; h <= 12; h += 1) {
      for (const m of [0, 15, 30, 45]) {
        expect(spokenTime(h, m)).not.toMatch(EMOJI_RE);
        expect(formatTime(h, m)).not.toMatch(EMOJI_RE);
      }
    }
  });
});

describe('handAngles', () => {
  it('points both hands up at 12:00', () => {
    expect(handAngles(12, 0)).toEqual({ hourAngle: 0, minuteAngle: 0 });
  });
  it('moves the hour hand 30 degrees per hour', () => {
    expect(handAngles(3, 0).hourAngle).toBe(90);
    expect(handAngles(6, 0).hourAngle).toBe(180);
  });
  it('moves the minute hand 6 degrees per minute', () => {
    expect(handAngles(3, 15).minuteAngle).toBe(90);
    expect(handAngles(3, 30).minuteAngle).toBe(180);
  });
  it('advances the hour hand half a degree per minute', () => {
    expect(handAngles(3, 30).hourAngle).toBe(105);
  });
});

describe('generateQuestion', () => {
  it('is deterministic for the same seed', () => {
    const a = generateQuestion(2, 12345);
    const b = generateQuestion(2, 12345);
    expect(a).toEqual(b);
  });
  it('varies across seeds', () => {
    const seen = new Set<string>();
    for (let s = 0; s < 20; s += 1) seen.add(generateQuestion(1, s).answer);
    expect(seen.size).toBeGreaterThan(3);
  });
  it('L1 only asks :00', () => {
    for (let s = 0; s < 30; s += 1) {
      const q = generateQuestion(1, s);
      expect(q.minute).toBe(0);
      expect(q.hour).toBeGreaterThanOrEqual(1);
      expect(q.hour).toBeLessThanOrEqual(12);
    }
  });
  it('L2 only asks :30', () => {
    for (let s = 0; s < 30; s += 1) {
      expect(generateQuestion(2, s).minute).toBe(30);
    }
  });
  it('L3 only asks :15 or :45', () => {
    for (let s = 0; s < 30; s += 1) {
      expect([15, 45]).toContain(generateQuestion(3, s).minute);
    }
  });
  it('always has exactly 3 unique choices containing the answer', () => {
    for (const level of [1, 2, 3] as TimeLevel[]) {
      for (let s = 0; s < 30; s += 1) {
        const q = generateQuestion(level, s);
        expect(q.choices).toHaveLength(3);
        expect(new Set(q.choices).size).toBe(3);
        expect(q.choices).toContain(q.answer);
      }
    }
  });
  it('spoken matches the generated time', () => {
    for (let s = 0; s < 30; s += 1) {
      const q = generateQuestion(3, s);
      expect(q.spoken).toBe(spokenTime(q.hour, q.minute));
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
