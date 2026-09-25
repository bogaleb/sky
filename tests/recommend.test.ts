import { describe, expect, it } from 'vitest';
import {
  recommendNext,
  STALE_AFTER_MS,
  type MasterySignal,
  type RecommendInput,
} from '../lib/kid/recommend';

const NOW = Date.UTC(2026, 8, 25, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

function sig(over: Partial<MasterySignal> & { skillId: string }): MasterySignal {
  return {
    islandId: 'math',
    mastery: 0.5,
    lastPracticedAt: iso(NOW - DAY),
    attempts: 4,
    ...over,
  };
}

function input(over: Partial<RecommendInput> = {}): RecommendInput {
  return {
    mastery: [],
    trail: { nextStopAvailable: false, trailDoneToday: false },
    now: NOW,
    ...over,
  };
}

describe('recommendNext — ordering', () => {
  it('suggests the lowest-mastery skill first', () => {
    const recs = recommendNext(
      input({
        mastery: [
          sig({ skillId: 's-high', mastery: 0.8, islandId: 'reading' }),
          sig({ skillId: 's-low', mastery: 0.2, islandId: 'writing' }),
          sig({ skillId: 's-mid', mastery: 0.5, islandId: 'science' }),
        ],
      })
    );
    expect(recs.length).toBe(2);
    expect(recs[0].kind).toBe('practice');
    expect(recs[0].skillId).toBe('s-low');
    expect(recs[1].skillId).toBe('s-mid');
    expect(recs[0].title).toContain('Writing');
    expect(recs[0].islandId).toBe('writing');
  });

  it('caps practice recommendations at 2', () => {
    const recs = recommendNext(
      input({
        mastery: [
          sig({ skillId: 'a', mastery: 0.1 }),
          sig({ skillId: 'b', mastery: 0.2 }),
          sig({ skillId: 'c', mastery: 0.3 }),
          sig({ skillId: 'd', mastery: 0.4 }),
        ],
      })
    );
    expect(recs.length).toBe(2);
    expect(recs.every((r) => r.kind === 'practice')).toBe(true);
  });

  it('never suggests fully mastered skills for practice', () => {
    const recs = recommendNext(
      input({
        mastery: [sig({ skillId: 'done', mastery: 1 }), sig({ skillId: 'todo', mastery: 0.6 })],
      })
    );
    expect(recs.length).toBe(1);
    expect(recs[0].skillId).toBe('todo');
  });
});

describe('recommendNext — spaced repetition', () => {
  it('boosts a stale skill above a fresh one at equal mastery', () => {
    const recs = recommendNext(
      input({
        mastery: [
          sig({ skillId: 'fresh', mastery: 0.5, lastPracticedAt: iso(NOW - DAY) }),
          sig({ skillId: 'stale', mastery: 0.5, lastPracticedAt: iso(NOW - 5 * DAY) }),
        ],
      })
    );
    expect(recs[0].skillId).toBe('stale');
  });

  it('treats a skill past its review date as stale', () => {
    const recs = recommendNext(
      input({
        mastery: [
          sig({ skillId: 'fresh', mastery: 0.4, lastPracticedAt: iso(NOW - DAY) }),
          sig({
            skillId: 'due',
            mastery: 0.6,
            lastPracticedAt: iso(NOW - DAY),
            nextReviewAt: iso(NOW - DAY),
          }),
        ],
      })
    );
    // 0.6 - 0.3 boost = 0.3 < 0.4, so the due skill wins despite higher raw mastery.
    expect(recs[0].skillId).toBe('due');
  });

  it('does not boost a skill practiced 3 days minus a minute ago', () => {
    const recs = recommendNext(
      input({
        mastery: [
          sig({ skillId: 'older', mastery: 0.4, lastPracticedAt: iso(NOW - 2 * DAY) }),
          sig({ skillId: 'edge', mastery: 0.5, lastPracticedAt: iso(NOW - STALE_AFTER_MS + 60_000) }),
        ],
      })
    );
    expect(recs[0].skillId).toBe('older');
  });
});

describe('recommendNext — trail priority', () => {
  it('recommends the Adventure Trail first when a quest is available', () => {
    const recs = recommendNext(
      input({
        mastery: [sig({ skillId: 's', mastery: 0.1 })],
        trail: { nextStopAvailable: true, trailDoneToday: false, stopIslandId: 'reading' },
      })
    );
    expect(recs.length).toBe(2);
    expect(recs[0].kind).toBe('trail');
    expect(recs[0].title).toBe('Continue the Adventure Trail');
    expect(recs[0].detail).toContain('Floating Library');
    expect(recs[1].kind).toBe('practice');
  });

  it('skips the trail recommendation when today\'s quest is done', () => {
    const recs = recommendNext(
      input({
        mastery: [sig({ skillId: 's', mastery: 0.1 })],
        trail: { nextStopAvailable: true, trailDoneToday: true },
      })
    );
    expect(recs.every((r) => r.kind !== 'trail')).toBe(true);
  });

  it('skips the trail recommendation when no stop is available', () => {
    const recs = recommendNext(
      input({
        mastery: [sig({ skillId: 's', mastery: 0.1 })],
        trail: { nextStopAvailable: false, trailDoneToday: false },
      })
    );
    expect(recs.every((r) => r.kind !== 'trail')).toBe(true);
  });
});

describe('recommendNext — no-spoil rule', () => {
  it('never recommends a skill with 0 attempts', () => {
    const recs = recommendNext(
      input({
        mastery: [
          sig({ skillId: 'new', mastery: 0, attempts: 0, lastPracticedAt: null }),
          sig({ skillId: 'seen', mastery: 0.3, attempts: 2 }),
        ],
      })
    );
    expect(recs.length).toBe(1);
    expect(recs[0].skillId).toBe('seen');
  });

  it('ignores un-attempted skills even when nothing else qualifies', () => {
    const recs = recommendNext(input({ mastery: [sig({ skillId: 'new', mastery: 0, attempts: 0 })] }));
    expect(recs).toEqual([]);
  });
});

describe('recommendNext — replay', () => {
  it('suggests replaying a favorite game when everything is mastered', () => {
    const recs = recommendNext(
      input({
        mastery: [sig({ skillId: 'a', mastery: 1 }), sig({ skillId: 'b', mastery: 1 })],
      })
    );
    expect(recs.length).toBe(1);
    expect(recs[0].kind).toBe('replay');
    expect(recs[0].gameId).toBe('memory');
  });

  it('does not suggest replay when practice is still needed', () => {
    const recs = recommendNext(
      input({ mastery: [sig({ skillId: 'a', mastery: 1 }), sig({ skillId: 'b', mastery: 0.5 })] })
    );
    expect(recs.every((r) => r.kind !== 'replay')).toBe(true);
  });
});

describe('recommendNext — determinism & edges', () => {
  it('is deterministic for identical input', () => {
    const base = input({
      mastery: [
        sig({ skillId: 'a', mastery: 0.4, lastPracticedAt: iso(NOW - 4 * DAY) }),
        sig({ skillId: 'b', mastery: 0.4, lastPracticedAt: iso(NOW - 4 * DAY) }),
        sig({ skillId: 'c', mastery: 0.9 }),
      ],
      trail: { nextStopAvailable: true, trailDoneToday: false },
    });
    expect(recommendNext(base)).toEqual(recommendNext(base));
  });

  it('breaks exact ties by skill id', () => {
    const recs = recommendNext(
      input({
        mastery: [
          sig({ skillId: 'zz', mastery: 0.4 }),
          sig({ skillId: 'aa', mastery: 0.4 }),
        ],
      })
    );
    expect(recs[0].skillId).toBe('aa');
  });

  it('returns [] for empty input', () => {
    expect(recommendNext(input())).toEqual([]);
  });

  it('returns [] for a brand-new child with no trail', () => {
    expect(
      recommendNext(input({ mastery: [sig({ skillId: 'x', mastery: 0, attempts: 0 })] }))
    ).toEqual([]);
  });
});
