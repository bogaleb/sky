import { describe, expect, it } from 'vitest';
import {
  TROPHIES,
  TROPHY_CATEGORIES,
  getTrophy,
  type TrophyArt,
  type TrophyCategory,
} from '../lib/kid/trophies';

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

const VALID_CATEGORIES: TrophyCategory[] = ['explorer', 'learner', 'collector', 'friend'];
const VALID_ART: TrophyArt[] = ['star', 'medal', 'cup', 'crown', 'gem', 'ribbon'];

describe('trophy catalog', () => {
  it('has 20+ trophies with unique ids', () => {
    expect(TROPHIES.length).toBeGreaterThanOrEqual(20);
    const ids = TROPHIES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all four categories', () => {
    const cats = new Set(TROPHIES.map((t) => t.category));
    for (const c of VALID_CATEGORIES) expect(cats.has(c)).toBe(true);
    expect(Object.keys(TROPHY_CATEGORIES).sort()).toEqual([...VALID_CATEGORIES].sort());
  });

  it('has kid-readable names and descriptions, valid art and star bonuses', () => {
    for (const t of TROPHIES) {
      expect(VALID_CATEGORIES).toContain(t.category);
      expect(VALID_ART).toContain(t.art);
      expect(t.name.trim().length).toBeGreaterThan(2);
      expect(t.description.trim().length).toBeGreaterThan(10);
      expect(Number.isInteger(t.starBonus)).toBe(true);
      expect(t.starBonus).toBeGreaterThanOrEqual(5);
      expect(t.starBonus).toBeLessThanOrEqual(50);
      expect(t.name).not.toMatch(EMOJI_RE);
      expect(t.description).not.toMatch(EMOJI_RE);
    }
  });

  it('includes the headline milestone trophies', () => {
    for (const id of [
      'first-flight',
      'activities-10',
      'activities-50',
      'activities-100',
      'perfect-first',
      'perfect-trio',
      'streak-3',
      'streak-7',
      'trail-chapter-1',
      'quest-first',
      'quest-trio',
      'pet-hatched',
      'pet-grown',
      'outfit-first',
      'outfit-five',
      'memory-first',
      'stars-100',
      'stars-500',
      'stars-1000',
      'story-first',
      'song-first',
      'pattern-first',
      'puzzle-first',
    ]) {
      expect(getTrophy(id)?.id, `missing trophy ${id}`).toBe(id);
    }
  });

  it('getTrophy returns undefined for unknown ids', () => {
    expect(getTrophy('nope-not-a-trophy')).toBeUndefined();
  });
});
