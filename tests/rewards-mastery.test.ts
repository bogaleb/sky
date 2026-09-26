import { describe, expect, it } from 'vitest';
import { SHOWDOWN_AGE_BAND, canSeeShowdown } from '../lib/kid/showdown';
import {
  nextStreak,
  streakCopy,
  streakGraceDays,
  streakMood,
} from '../lib/kid/calendar';
import {
  TROPHIES,
  getTrophy,
  hasRealMastery,
  masteryStickerIdsForLevels,
  masteryTrophyIdsForLevels,
} from '../lib/kid/trophies';
import { STICKERS, getSticker } from '../lib/kid/stickers';
import { canClaimGift, giftDateKey, markGiftClaimed } from '../lib/kid/daily-gift';
import { gardenTotals, growthStage } from '../components/kid/growth-garden';

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe('showdown age-gating', () => {
  it('only the 7-8 band sees the competitive leaderboard', () => {
    expect(SHOWDOWN_AGE_BAND).toBe('7-8');
    expect(canSeeShowdown('7-8')).toBe(true);
  });

  it('hides the leaderboard for younger bands and unknown values', () => {
    for (const band of ['3-4', '5-6', null, undefined, '', '6-7', '8-9']) {
      expect(canSeeShowdown(band)).toBe(false);
    }
  });
});

describe('forgiving streaks', () => {
  it('gives the gentlest grace window to the 3-4 band', () => {
    expect(streakGraceDays('3-4')).toBe(2);
    expect(streakGraceDays('5-6')).toBe(1);
    expect(streakGraceDays('7-8')).toBe(1);
    expect(streakGraceDays(null)).toBe(1);
    expect(streakGraceDays('bogus')).toBe(1);
  });

  it('continues the streak on consecutive days', () => {
    const t = nextStreak(4, 6, '2026-09-25', '2026-09-26', 1);
    expect(t).toEqual({ current: 5, longest: 6, status: 'continued' });
  });

  it('does not change the streak when already active today', () => {
    const t = nextStreak(4, 6, '2026-09-26', '2026-09-26', 1);
    expect(t).toEqual({ current: 4, longest: 6, status: 'already' });
  });

  it('starts a brand-new streak at 1', () => {
    const t = nextStreak(0, 0, null, '2026-09-26', 1);
    expect(t).toEqual({ current: 1, longest: 1, status: 'started' });
  });

  it('treats a missed day inside the grace window as a rest, not a break', () => {
    // Gap of 2 days (one rest day) with grace 1 → still continues.
    const t = nextStreak(4, 6, '2026-09-24', '2026-09-26', 1);
    expect(t.status).toBe('rest');
    expect(t.current).toBe(5);
  });

  it('never resets to 1: long gaps pause and resume the streak', () => {
    // Five-day gap, well beyond any grace window.
    const t = nextStreak(10, 12, '2026-09-21', '2026-09-26', 1);
    expect(t.status).toBe('resumed');
    expect(t.current).toBe(11); // frozen, then +1 on return — never 1
    expect(t.longest).toBe(12);
  });

  it('the 3-4 band resumes after any gap (gentlest)', () => {
    const t = nextStreak(3, 5, '2026-09-10', '2026-09-26', streakGraceDays('3-4'));
    expect(t.status).toBe('resumed');
    expect(t.current).toBe(4);
  });

  it('clamps negative counts and tolerates bad keys', () => {
    const t = nextStreak(-3, 0, 'not-a-date', '2026-09-26', 1);
    expect(t.current).toBe(1);
    expect(t.status).toBe('resumed');
  });

  it('reports the current mood between active days', () => {
    expect(streakMood('2026-09-26', '2026-09-26', 1)).toBe('today');
    expect(streakMood('2026-09-25', '2026-09-26', 1)).toBe('warm');
    expect(streakMood('2026-09-24', '2026-09-26', 1)).toBe('warm'); // rest day
    expect(streakMood('2026-09-20', '2026-09-26', 1)).toBe('paused');
    expect(streakMood(null, '2026-09-26', 1)).toBe('paused');
  });

  it('streak copy is kind, emoji-free, and gentlest for 3-4', () => {
    const statuses = ['already', 'started', 'continued', 'rest', 'resumed', 'today', 'warm', 'paused'] as const;
    for (const s of statuses) {
      for (const band of ['3-4', '5-6', '7-8', null]) {
        const copy = streakCopy(s, 6, band);
        expect(copy.length).toBeGreaterThan(10);
        expect(copy).not.toMatch(EMOJI_RE);
      }
    }
    // 3-4 wording is the coziest.
    expect(streakCopy('paused', 6, '3-4')).toContain('cozy nap');
    expect(streakCopy('warm', 6, '3-4')).toContain('Yay!');
    // Older kids never hear about losing a streak — it is paused, not broken.
    expect(streakCopy('paused', 6, '7-8')).toContain('paused, not broken');
    expect(streakCopy('paused', 6, '7-8').toLowerCase()).not.toMatch(/reset|lost|over|start again/);
  });
});

describe('mastery-tier awards', () => {
  it('unlocks mastery trophies at the right levels', () => {
    expect(masteryTrophyIdsForLevels([])).toEqual([]);
    expect(masteryTrophyIdsForLevels([1, 1])).toEqual([]);
    expect(masteryTrophyIdsForLevels([2])).toEqual(['mastery-2']);
    expect(masteryTrophyIdsForLevels([3])).toEqual(['mastery-2', 'mastery-3']);
    expect(masteryTrophyIdsForLevels([3, 3, 3])).toContain('mastery-trio');
    expect(masteryTrophyIdsForLevels([3, 3])).not.toContain('mastery-trio');
    expect(masteryTrophyIdsForLevels([5])).toContain('mastery-5');
    expect(masteryTrophyIdsForLevels([4])).not.toContain('mastery-5');
  });

  it('mirrors mastery stickers at the same unlock moments', () => {
    expect(masteryStickerIdsForLevels([])).toEqual([]);
    expect(masteryStickerIdsForLevels([2])).toEqual(['skill-sprout']);
    expect(masteryStickerIdsForLevels([3])).toEqual(['skill-sprout', 'bloom-bright']);
    expect(masteryStickerIdsForLevels([5])).toContain('sky-master');
  });

  it('gates the flashiest crowns behind real mastery', () => {
    expect(hasRealMastery([])).toBe(false);
    expect(hasRealMastery([2, 2, 2])).toBe(false);
    expect(hasRealMastery([3])).toBe(true);
    expect(hasRealMastery([1, 5])).toBe(true);
  });

  it('adds the four mastery trophies to the catalog', () => {
    for (const id of ['mastery-2', 'mastery-3', 'mastery-trio', 'mastery-5']) {
      const t = getTrophy(id);
      expect(t).toBeDefined();
      expect(t!.category).toBe('learner');
      expect(t!.name).not.toMatch(EMOJI_RE);
      expect(t!.description).not.toMatch(EMOJI_RE);
    }
    expect(getTrophy('mastery-5')!.art).toBe('crown');
    const ids = TROPHIES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('adds the three mastery stickers to the catalog', () => {
    for (const id of ['skill-sprout', 'bloom-bright', 'sky-master']) {
      const s = getSticker(id);
      expect(s).toBeDefined();
      expect(s!.name).not.toMatch(EMOJI_RE);
    }
    expect(STICKERS.length).toBe(69);
    const ids = STICKERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('growth garden helpers', () => {
  it('maps mastered ratios to growth stages', () => {
    expect(growthStage(0, 5)).toBe(0);
    expect(growthStage(0, 0)).toBe(0);
    expect(growthStage(1, 5)).toBe(1); // seed -> sprout
    expect(growthStage(2, 5)).toBe(2); // bud
    expect(growthStage(4, 5)).toBe(3); // bloom
    expect(growthStage(5, 5)).toBe(4); // full bloom
  });

  it('totals mastered/total skills across subjects', () => {
    expect(
      gardenTotals({ reading: { mastered: 2, total: 5 }, math: { mastered: 5, total: 5 } }),
    ).toEqual({ mastered: 7, total: 10 });
    expect(gardenTotals({})).toEqual({ mastered: 0, total: 0 });
  });
});

describe('daily gift (kept gentle)', () => {
  function memStore() {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => {
        m.set(k, v);
      },
    };
  }

  it('still allows exactly one claim per day', () => {
    const store = memStore();
    const day = new Date('2026-09-26T12:00:00');
    expect(canClaimGift('kid-1', day, store)).toBe(true);
    expect(markGiftClaimed('kid-1', day, store)).toBe(true);
    expect(canClaimGift('kid-1', day, store)).toBe(false);
    expect(giftDateKey(day)).toBe('2026-09-26');
  });
});
