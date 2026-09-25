import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  STAR_SPRINT_TARGET,
  challengeProgress,
  showdownStatus,
  siblingRankings,
  tallyWeeklyEvents,
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

describe('weekKey UTC boundaries (Wave 10 honesty fix)', () => {
  it('treats Monday 00:30 UTC as the new week', () => {
    expect(weekKey(new Date(Date.UTC(2026, 8, 28, 0, 30)))).toBe('2026-09-28');
  });

  it('treats Sunday 23:59 UTC as the old week', () => {
    expect(weekKey(new Date(Date.UTC(2026, 8, 27, 23, 59)))).toBe('2026-09-21');
  });

  it('is stable across the UTC day boundary (no local-time drift)', () => {
    // 2026-09-27T23:00 in New York (EDT) is already Monday in UTC.
    // A local-time implementation would answer 2026-09-21 here in US timezones.
    expect(weekKey(new Date('2026-09-28T03:00:00Z'))).toBe('2026-09-28');
    expect(weekKey(new Date('2026-09-27T22:59:59Z'))).toBe('2026-09-21');
  });

  it('is implemented with UTC getters (regression guard, TZ-independent)', () => {
    const src = readFileSync(join(__dirname, '..', 'lib', 'kid', 'showdown.ts'), 'utf8');
    expect(src).toContain('getUTCDay');
    expect(src).toContain('setUTCDate');
  });

  it('matches the Z-suffixed filter the server action builds', () => {
    expect(`${weekKey(new Date(Date.UTC(2026, 8, 30, 15, 0)))}T00:00:00.000Z`).toBe(
      '2026-09-28T00:00:00.000Z',
    );
  });
});

describe('tallyWeeklyEvents (Wave 10 honest scoring)', () => {
  const ev = (
    child_id: string,
    event_type: string,
    metadata: Record<string, unknown> | null = null,
    skill_id: string | null = null,
  ) => ({ child_id, event_type, metadata, skill_id });

  it('sums stars from ALL milestone sources, not just session_complete', () => {
    const { starsByChild } = tallyWeeklyEvents([
      ev('a', 'milestone', { kind: 'session_complete', stars: 10 }),
      ev('a', 'milestone', { kind: 'word_builder_win', stars: 8 }),
      ev('a', 'milestone', { kind: 'fraction_fair_win', stars: 6 }),
      ev('a', 'milestone', { kind: 'quest_complete', stars: 12 }),
    ]);
    expect(starsByChild.get('a')).toBe(36);
  });

  it('keeps per-child totals separate', () => {
    const { starsByChild } = tallyWeeklyEvents([
      ev('a', 'milestone', { kind: 'session_complete', stars: 10 }),
      ev('b', 'milestone', { kind: 'memory_cove_win', stars: 5 }),
    ]);
    expect(starsByChild.get('a')).toBe(10);
    expect(starsByChild.get('b')).toBe(5);
  });

  it('ignores milestones without a positive numeric stars value', () => {
    const { starsByChild } = tallyWeeklyEvents([
      ev('a', 'milestone', { kind: 'sticker_earned' }),
      ev('a', 'milestone', null),
      ev('a', 'milestone', { kind: 'weird', stars: 'lots' }),
      ev('a', 'milestone', { kind: 'weird', stars: 0 }),
      ev('a', 'milestone', { kind: 'weird', stars: -3 }),
    ]);
    expect(starsByChild.get('a')).toBeUndefined();
  });

  it('counts attempt activities only when a skill_id is present', () => {
    const { activitiesByChild } = tallyWeeklyEvents([
      ev('a', 'attempt', {}, 'addition-1'),
      ev('a', 'attempt', {}),
      ev('a', 'attempt', {}, null),
    ]);
    expect(activitiesByChild.get('a')).toBe(1);
  });

  it('does not count star events as activities or vice versa', () => {
    const { starsByChild, activitiesByChild } = tallyWeeklyEvents([
      ev('a', 'milestone', { kind: 'session_complete', stars: 7 }),
    ]);
    expect(starsByChild.get('a')).toBe(7);
    expect(activitiesByChild.get('a')).toBeUndefined();
  });

  it('server action documents the all-sources convention (no session_complete-only filter)', () => {
    const src = readFileSync(join(__dirname, '..', 'app', 'actions', 'showdown.ts'), 'utf8');
    expect(src).not.toContain("kind === 'session_complete'");
    expect(src).toContain('tallyWeeklyEvents');
    expect(src).toContain('.range('); // paginated, not .limit(4000)
  });
});
