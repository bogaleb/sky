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
    activities7d: 21,
    streak: 4,
    longestStreak: 6,
    questsCompleted7d: 2,
    timePlayedMinutes7d: 95,
    topSkills: [
      { skillName: 'Counting to 20', subjectName: 'Math', attempts: 9 },
      { skillName: 'Letter Sounds', subjectName: 'Reading', attempts: 7 },
    ],
    skillMastery: [],
    focusSkills: [],
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
    expect(digest.bullets.some((b) => b.includes('1 learning flight this week'))).toBe(true);
    expect(digest.bullets.some((b) => b.includes('1 sticker in the sticker book'))).toBe(true);
  });

  it('mentions streak, quests, learning time, and top skills for an active week', () => {
    const digest = buildWeeklyDigest(makeDash(), '2026-09-21');
    expect(digest.bullets.some((b) => b.includes('21 activities answered'))).toBe(true);
    expect(digest.bullets.some((b) => b.includes('1h 35m of learning time'))).toBe(true);
    expect(digest.bullets.some((b) => b.includes('4-day streak'))).toBe(true);
    expect(digest.bullets.some((b) => b.includes('2 daily quests'))).toBe(true);
    expect(digest.bullets.some((b) => b.includes('Counting to 20 (9 tries)'))).toBe(true);
  });

  it('skips streak and quest bullets when there is nothing to report', () => {
    const digest = buildWeeklyDigest(
      makeDash({ streak: 0, longestStreak: 0, questsCompleted7d: 0, topSkills: [], timePlayedMinutes7d: 0, activities7d: 0 }),
      '2026-09-21',
    );
    expect(digest.bullets.some((b) => b.includes('streak'))).toBe(false);
    expect(digest.bullets.some((b) => b.includes('daily quest'))).toBe(false);
    expect(digest.bullets.some((b) => b.includes('Most practiced'))).toBe(false);
  });
});
