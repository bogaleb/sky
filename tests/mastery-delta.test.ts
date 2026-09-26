import { describe, expect, it } from 'vitest';
import {
  buildMasteryDelta,
  buildWeeklyDigest,
  describeMasteryDelta,
  estimateWeekStartLevel,
  masteryDeltaShort,
  type ChildDashboard,
  type MasteryAttempt,
} from '../lib/parent/digest';

const WEEK = '2026-09-19T00:00:00.000Z'; // 7 days before "now" in these fixtures

function att(difficultyLevel: number | null, at: string): MasteryAttempt {
  return { difficultyLevel, at };
}

describe('estimateWeekStartLevel', () => {
  it('uses the earliest in-window attempt difficulty', () => {
    const attempts = [
      att(3, '2026-09-24T10:00:00.000Z'),
      att(2, '2026-09-20T10:00:00.000Z'),
      att(2, '2026-09-22T10:00:00.000Z'),
    ];
    expect(estimateWeekStartLevel(attempts, WEEK)).toBe(2);
  });

  it('ignores attempts before the week boundary', () => {
    const attempts = [
      att(1, '2026-09-10T10:00:00.000Z'), // stale: last week's level
      att(3, '2026-09-20T10:00:00.000Z'),
    ];
    // Opening difficulty this week already reflects the new level: no stale credit.
    expect(estimateWeekStartLevel(attempts, WEEK)).toBe(3);
  });

  it('skips attempts with no recorded difficulty', () => {
    const attempts = [
      att(null, '2026-09-20T10:00:00.000Z'),
      att(2, '2026-09-21T10:00:00.000Z'),
    ];
    expect(estimateWeekStartLevel(attempts, WEEK)).toBe(2);
  });

  it('returns null when there is no usable in-window evidence', () => {
    expect(estimateWeekStartLevel([], WEEK)).toBeNull();
    expect(
      estimateWeekStartLevel([att(2, '2026-09-10T10:00:00.000Z')], WEEK),
    ).toBeNull();
    expect(estimateWeekStartLevel([att(null, '2026-09-20T10:00:00.000Z')], WEEK)).toBeNull();
  });
});

describe('buildMasteryDelta', () => {
  const base = {
    currentLevel: 3,
    status: 'developing',
    masteredAt: null as string | null,
    weekStartIso: WEEK,
  };

  it('reports growth when the current level exceeds the week-start estimate', () => {
    const delta = buildMasteryDelta({
      ...base,
      attempts: [att(2, '2026-09-20T10:00:00.000Z'), att(3, '2026-09-24T10:00:00.000Z')],
    });
    expect(delta).toEqual({ fromLevel: 2, toLevel: 3, reachedMastery: false });
  });

  it('returns null when the skill was not practiced this week', () => {
    expect(
      buildMasteryDelta({ ...base, attempts: [att(1, '2026-09-10T10:00:00.000Z')] }),
    ).toBeNull();
    expect(buildMasteryDelta({ ...base, attempts: [] })).toBeNull();
  });

  it('returns null when there was no upward movement', () => {
    const attempts = [att(3, '2026-09-20T10:00:00.000Z')];
    expect(buildMasteryDelta({ ...base, attempts })).toBeNull(); // 3 -> 3
    expect(
      buildMasteryDelta({ ...base, currentLevel: 2, attempts }),
    ).toBeNull(); // estimate above current: no claim
  });

  it('returns null when the start level cannot be estimated', () => {
    expect(
      buildMasteryDelta({ ...base, attempts: [att(null, '2026-09-20T10:00:00.000Z')] }),
    ).toBeNull();
  });

  it('reports mastery reached this week (exact, from mastered_at)', () => {
    const delta = buildMasteryDelta({
      ...base,
      currentLevel: 5,
      status: 'mastered',
      masteredAt: '2026-09-23T10:00:00.000Z',
      attempts: [att(4, '2026-09-20T10:00:00.000Z')],
    });
    expect(delta).toEqual({ fromLevel: 4, toLevel: 5, reachedMastery: true });
  });

  it('returns null for a skill mastered before this week', () => {
    // Mastered long ago, review play this week must not read as growth.
    const delta = buildMasteryDelta({
      ...base,
      currentLevel: 5,
      status: 'mastered',
      masteredAt: '2026-08-01T10:00:00.000Z',
      attempts: [att(3, '2026-09-20T10:00:00.000Z')],
    });
    expect(delta).toBeNull();
  });
});

describe('describeMasteryDelta / masteryDeltaShort', () => {
  it('phrases growth, unknown start, and mastery', () => {
    expect(describeMasteryDelta({ fromLevel: 2, toLevel: 3, reachedMastery: false })).toBe(
      'grew from level 2 → 3 this week',
    );
    expect(describeMasteryDelta({ fromLevel: null, toLevel: 3, reachedMastery: false })).toBe(
      'reached level 3 this week',
    );
    expect(describeMasteryDelta({ fromLevel: 4, toLevel: 5, reachedMastery: true })).toBe(
      'reached mastery this week',
    );
  });

  it('produces compact digest forms', () => {
    expect(masteryDeltaShort({ fromLevel: 2, toLevel: 3, reachedMastery: false })).toBe(
      'level 2 → 3',
    );
    expect(masteryDeltaShort({ fromLevel: null, toLevel: 3, reachedMastery: false })).toBe(
      'reached level 3',
    );
    expect(masteryDeltaShort({ fromLevel: 4, toLevel: 5, reachedMastery: true })).toBe(
      'reached mastery',
    );
  });
});

function makeDash(overrides: Partial<ChildDashboard> = {}): ChildDashboard {
  return {
    id: 'child-1',
    nickname: 'Maya',
    avatarId: 'fox',
    ageBand: '4-5',
    sessions30d: 10,
    sessions7d: 3,
    stars7d: 12,
    points7d: 120,
    stickers: 5,
    subjects: [],
    recentMilestones: [],
    lastActiveAt: null,
    activities7d: 21,
    streak: 4,
    longestStreak: 6,
    questsCompleted7d: 2,
    timePlayedMinutes7d: 95,
    topSkills: [],
    skillMastery: [],
    focusSkills: [],
    ...overrides,
  };
}

function masterySkill(name: string, delta: ChildDashboard['skillMastery'][number]['masteryDelta']) {
  return {
    skillId: `skill-${name}`,
    skillName: name,
    subjectCode: 'math',
    subjectName: 'Math',
    islandName: 'Number Island',
    currentLevel: 3,
    status: 'developing' as const,
    attempts: 20,
    correct: 16,
    accuracyPct: 80,
    lastPracticedAt: '2026-09-24T10:00:00.000Z',
    masteryDelta: delta,
  };
}

describe('buildWeeklyDigest growth bullet', () => {
  it('adds a level-ups bullet for skills with weekly growth', () => {
    const digest = buildWeeklyDigest(
      makeDash({
        skillMastery: [
          masterySkill('Counting to 20', { fromLevel: 2, toLevel: 3, reachedMastery: false }),
          masterySkill('Rhyming', { fromLevel: 4, toLevel: 5, reachedMastery: true }),
          masterySkill('Shapes', null),
        ],
      }),
      '2026-09-21',
    );
    const bullet = digest.bullets.find((b) => b.startsWith('Level-ups this week:'));
    expect(bullet).toBe(
      'Level-ups this week: Counting to 20 (level 2 → 3); Rhyming (reached mastery).',
    );
  });

  it('omits the bullet when nothing grew', () => {
    const digest = buildWeeklyDigest(
      makeDash({ skillMastery: [masterySkill('Shapes', null)] }),
      '2026-09-21',
    );
    expect(digest.bullets.some((b) => b.startsWith('Level-ups'))).toBe(false);
  });

  it('caps the bullet at three skills and counts the rest', () => {
    const skills = ['A', 'B', 'C', 'D', 'E'].map((n) =>
      masterySkill(n, { fromLevel: 1, toLevel: 2, reachedMastery: false }),
    );
    const digest = buildWeeklyDigest(makeDash({ skillMastery: skills }), '2026-09-21');
    const bullet = digest.bullets.find((b) => b.startsWith('Level-ups this week:'));
    expect(bullet).toContain('and 2 more');
  });
});
