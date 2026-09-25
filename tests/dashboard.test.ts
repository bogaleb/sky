import { describe, expect, it } from 'vitest';
import { buildWeeklyDigest, type ChildDashboard } from '../lib/parent/digest';

function makeDash(overrides: Partial<ChildDashboard> = {}): ChildDashboard {
  return {
    id: 'child-1',
    nickname: 'Sam',
    avatarId: 'fox',
    ageBand: '4-5',
    sessions30d: 8,
    sessions7d: 3,
    stars7d: 12,
    points7d: 140,
    stickers: 5,
    subjects: [
      { subjectCode: 'reading', subjectName: 'Reading', mastered: 2, total: 5, avgLevel: 2.5 },
      { subjectCode: 'math', subjectName: 'Math', mastered: 0, total: 5, avgLevel: 1.5 },
      { subjectCode: 'music', subjectName: 'Music', mastered: 0, total: 5, avgLevel: 0 },
    ],
    recentMilestones: [],
    lastActiveAt: null,
    ...overrides,
  };
}

describe('buildWeeklyDigest', () => {
  it('writes an upbeat headline and bullets for an active week', () => {
    const digest = buildWeeklyDigest(makeDash(), '2026-09-21');
    expect(digest.headline).toContain('Sam');
    expect(digest.headline).toContain('flying high');
    expect(digest.bullets.some((b) => b.includes('3 learning flights'))).toBe(true);
    expect(digest.bullets.some((b) => b.includes('12 stars'))).toBe(true);
    expect(digest.bullets.some((b) => b.includes('Reading'))).toBe(true);
    expect(digest.bullets.some((b) => b.includes('5 stickers'))).toBe(true);
  });

  it('flags untouched-but-started subjects as focus areas', () => {
    const digest = buildWeeklyDigest(makeDash(), '2026-09-21');
    expect(digest.focusAreas).toContain('Math');
    expect(digest.focusAreas).not.toContain('Music'); // never attempted
    expect(digest.bullets.some((b) => b.includes('Worth a visit soon'))).toBe(true);
  });

  it('handles a quiet week gently', () => {
    const digest = buildWeeklyDigest(makeDash({ sessions7d: 0, stars7d: 0, points7d: 0 }), '2026-09-21');
    expect(digest.headline).toContain('quiet week');
    expect(digest.bullets.some((b) => b.includes("hasn't flown this week"))).toBe(true);
  });

  it('uses singular phrasing for one flight and one sticker', () => {
    const digest = buildWeeklyDigest(makeDash({ sessions7d: 1, stickers: 1 }), '2026-09-21');
    expect(digest.bullets.some((b) => b.includes('1 learning flight ') || b.includes('1 learning flight,'))).toBe(true);
    expect(digest.bullets.some((b) => b.includes('1 sticker in the sticker book'))).toBe(true);
  });
});
