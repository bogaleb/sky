import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  STAR_SPRINT_TARGET,
  challengeProgress,
  showdownStatus,
  siblingRankings,
  tallyWeeklyEvents,
  weekKey,
} from '../lib/kid/showdown';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/parent-zone', () => ({ requireParentZone: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

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

  it('is stable across process timezones (no local-time drift)', () => {
    // A local-time implementation would give different weeks for this instant
    // depending on the machine timezone. UTC getters must not.
    const instant = new Date('2026-09-27T22:59:59Z');
    const prev = process.env.TZ;
    const seen = new Set<string>();
    try {
      for (const tz of ['UTC', 'America/New_York', 'Pacific/Kiritimati', 'Australia/Sydney']) {
        process.env.TZ = tz;
        seen.add(weekKey(instant));
      }
    } finally {
      if (prev === undefined) delete process.env.TZ;
      else process.env.TZ = prev;
    }
    expect([...seen]).toEqual(['2026-09-21']);
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
});

describe('getFamilyWeeklyStars (server action, Wave 10 honest scoring)', () => {
  interface Row {
    child_id: string;
    event_type: string;
    metadata: unknown;
    skill_id: string | null;
  }

  function makeSupabase(pages: Row[][]) {
    const rangeCalls: Array<[number, number]> = [];
    const gteArgs: unknown[] = [];
    let pageIdx = 0;
    const query = () => {
      const q: Record<string, (...a: never[]) => unknown> = {
        select: () => q,
        eq: () => q,
        in: () => q,
        gte: (_col: never, v: never) => {
          gteArgs.push(v);
          return q;
        },
        order: () => q,
        single: () =>
          Promise.resolve({ data: { id: 'child-1', parent_id: 'parent-1' }, error: null }),
        range: (a: never, b: never) => {
          rangeCalls.push([a as number, b as number]);
          const rows = pages[pageIdx++] ?? [];
          return Promise.resolve({ data: rows, error: null });
        },
        // The kids list is awaited directly (no terminal .single()).
        then: (resolve: (v: unknown) => void) =>
          resolve({
            data: [{ id: 'child-1', nickname: 'Ada', avatar_id: 'curio' }],
            error: null,
          }),
      };
      return q;
    };
    const client = {
      auth: { getUser: async () => ({ data: { user: { id: 'parent-1' } }, error: null }) },
      from: () => query(),
    };
    return { client, rangeCalls, gteArgs };
  }

  async function loadAction(client: unknown) {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(client as never);
    return import('@/app/actions/showdown');
  }

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('sums stars from ALL milestone sources, not just session_complete', async () => {
    const ev = (kind: string, stars: number): Row => ({
      child_id: 'child-1',
      event_type: 'milestone',
      metadata: { kind, stars },
      skill_id: null,
    });
    const { client } = makeSupabase([
      [
        ev('session_complete', 10),
        ev('word_builder_win', 8),
        ev('fraction_fair_win', 6),
        ev('quest_complete', 12),
      ],
    ]);
    const { getFamilyWeeklyStars } = await loadAction(client);
    const rows = await getFamilyWeeklyStars('child-1');
    expect(rows).toHaveLength(1);
    expect(rows[0].weeklyStars).toBe(36);
    expect(rows[0].nickname).toBe('Ada');
  });

  it('paginates with .range() and counts events from every page', async () => {
    const page1: Row[] = Array.from({ length: 1000 }, (_, i) => ({
      child_id: 'child-1',
      event_type: 'milestone',
      metadata: { kind: 'session_complete', stars: 1 },
      skill_id: null,
    }));
    const page2: Row[] = [
      { child_id: 'child-1', event_type: 'milestone', metadata: { kind: 'quest_complete', stars: 5 }, skill_id: null },
      { child_id: 'child-1', event_type: 'attempt', metadata: {}, skill_id: 'addition' },
    ];
    const { client, rangeCalls } = makeSupabase([page1, page2]);
    const { getFamilyWeeklyStars } = await loadAction(client);
    const rows = await getFamilyWeeklyStars('child-1');
    // A full first page triggers a second fetch; a short page stops the loop.
    expect(rangeCalls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
    expect(rows[0].weeklyStars).toBe(1005);
    expect(rows[0].weeklyActivities).toBe(1);
  });

  it('filters events to the current UTC week with a Z-suffixed bound', async () => {
    const { client, gteArgs } = makeSupabase([[]]);
    const { getFamilyWeeklyStars } = await loadAction(client);
    await getFamilyWeeklyStars('child-1');
    expect(gteArgs).toHaveLength(1);
    expect(gteArgs[0]).toBe(`${weekKey()}T00:00:00.000Z`);
  });
});
