import { describe, expect, it } from 'vitest';
import {
  STAR_SPRINT_TARGET,
  challengeProgress,
  showdownStatus,
  siblingRankings,
  weekKey,
} from '../lib/kid/showdown';

describe('weekKey', () => {
  it('returns the Monday of the week for a Friday', () => {
    // 2026-09-25 is a Friday.
    expect(weekKey(new Date('2026-09-25T12:00:00Z'))).toBe('2026-09-21');
  });

  it('returns the same day for a Monday', () => {
    expect(weekKey(new Date('2026-09-21T12:00:00Z'))).toBe('2026-09-21');
  });

  it('rolls back to the previous Monday for a Sunday', () => {
    expect(weekKey(new Date('2026-09-27T23:59:59Z'))).toBe('2026-09-21');
  });

  it('handles a month boundary (Monday in the previous month)', () => {
    // 2026-10-01 is a Thursday; Monday is 2026-09-28.
    expect(weekKey(new Date('2026-10-01T12:00:00Z'))).toBe('2026-09-28');
  });

  it('returns a YYYY-MM-DD string', () => {
    expect(weekKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('siblingRankings', () => {
  it('sorts by weekly stars, highest first, with dense ranks', () => {
    const ranked = siblingRankings([
      { id: 'a', nickname: 'Ava', weeklyStars: 5 },
      { id: 'b', nickname: 'Ben', weeklyStars: 20 },
      { id: 'c', nickname: 'Cal', weeklyStars: 12 },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('shares a rank on ties and resumes dense numbering', () => {
    const ranked = siblingRankings([
      { id: 'a', nickname: 'Ava', weeklyStars: 10 },
      { id: 'b', nickname: 'Ben', weeklyStars: 20 },
      { id: 'c', nickname: 'Cal', weeklyStars: 20 },
      { id: 'd', nickname: 'Dee', weeklyStars: 3 },
    ]);
    expect(ranked.map((r) => [r.id, r.rank])).toEqual([
      ['b', 1],
      ['c', 1],
      ['a', 2],
      ['d', 3],
    ]);
  });

  it('computes gapToNext as stars behind the sibling one rank ahead', () => {
    const ranked = siblingRankings([
      { id: 'a', nickname: 'Ava', weeklyStars: 20 },
      { id: 'b', nickname: 'Ben', weeklyStars: 14 },
      { id: 'c', nickname: 'Cal', weeklyStars: 14 },
    ]);
    expect(ranked[0].gapToNext).toBe(0);
    expect(ranked[1].gapToNext).toBe(6);
    expect(ranked[2].gapToNext).toBe(0); // tied with the sibling ahead
  });

  it('handles an empty list', () => {
    expect(siblingRankings([])).toEqual([]);
  });
});

describe('showdownStatus', () => {
  it('reports no rival for a single child', () => {
    const s = showdownStatus(10, 0);
    expect(s.hasRival).toBe(false);
    expect(s.message).toContain('Solo flight');
  });

  it('reports a rival when siblings exist', () => {
    const s = showdownStatus(5, 2);
    expect(s.hasRival).toBe(true);
    expect(s.message).toContain(`${STAR_SPRINT_TARGET}`);
  });

  it('mentions earned stars in the solo message', () => {
    expect(showdownStatus(7, 0).message).toContain('7 stars');
  });
});

describe('challengeProgress', () => {
  it('tracks progress toward the 30-star target', () => {
    expect(challengeProgress(0)).toEqual({ target: 30, done: false, remaining: 30 });
    expect(challengeProgress(29)).toEqual({ target: 30, done: false, remaining: 1 });
  });

  it('completes at and above the target', () => {
    expect(challengeProgress(30).done).toBe(true);
    expect(challengeProgress(45)).toEqual({ target: 30, done: true, remaining: 0 });
  });
});

describe('content hygiene', () => {
  it('has no emoji anywhere in showdown messages', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
    expect(STAR_SPRINT_TARGET).toBe(30);
    expect(showdownStatus(5, 1).message).not.toMatch(emoji);
    expect(showdownStatus(5, 0).message).not.toMatch(emoji);
  });
});
