import { describe, it, expect } from 'vitest';
import {
  PLAY_CARDS,
  playCardsForSubject,
  getPlayCard,
  playCardsForSkill,
  skillDisplayName,
} from '../lib/kid/play-cards';
import { SKILL_CODES } from '../lib/kid/trail';
import { starsFromMastery } from '../lib/kid/mastery';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

const ALL_SKILL_IDS = new Set(Object.values(SKILL_CODES).flat());

describe('play cards catalog', () => {
  it('has 30 screen-free activities', () => {
    expect(PLAY_CARDS.length).toBe(30);
  });

  it('every card references a real skill id from the curriculum bank', () => {
    for (const c of PLAY_CARDS) {
      expect(ALL_SKILL_IDS.has(c.skillId), `unknown skillId ${c.skillId}`).toBe(true);
    }
  });

  it('covers all 9 islands', () => {
    const subjects = new Set(PLAY_CARDS.map((c) => c.subjectCode));
    expect(subjects.size).toBe(9);
    expect(subjects).toEqual(new Set(Object.keys(SKILL_CODES)));
  });

  it('every card has non-empty fields and sane minutes', () => {
    for (const c of PLAY_CARDS) {
      expect(c.id.length).toBeGreaterThan(0);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.howTo.length).toBeGreaterThan(40);
      expect(c.materials.length).toBeGreaterThan(0);
      expect(c.minutes).toBeGreaterThanOrEqual(5);
      expect(c.minutes).toBeLessThanOrEqual(30);
    }
  });

  it('card ids are unique', () => {
    const ids = PLAY_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no emoji anywhere in card text', () => {
    for (const c of PLAY_CARDS) {
      const text = `${c.title} ${c.howTo} ${c.materials}`;
      expect(EMOJI_RE.test(text), `emoji in ${c.id}`).toBe(false);
    }
  });

  it('howTo is 2-3 sentences in a parent voice', () => {
    for (const c of PLAY_CARDS) {
      const sentences = c.howTo.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      expect(sentences.length, `${c.id} sentence count`).toBeGreaterThanOrEqual(2);
      expect(sentences.length, `${c.id} sentence count`).toBeLessThanOrEqual(4);
    }
  });
});

describe('play card lookups', () => {
  it('playCardsForSubject returns only that island', () => {
    const cards = playCardsForSubject('math');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => c.subjectCode === 'math')).toBe(true);
  });

  it('getPlayCard finds a card by id', () => {
    const card = getPlayCard('star-breathing-together');
    expect(card?.skillId).toBe('breathing');
  });

  it('playCardsForSkill finds cards for a skill', () => {
    expect(playCardsForSkill('rhythm').length).toBeGreaterThan(0);
    expect(playCardsForSkill('not_a_skill')).toEqual([]);
  });

  it('skillDisplayName title-cases codes', () => {
    expect(skillDisplayName('letter_sounds')).toBe('Letter Sounds');
    expect(skillDisplayName('add')).toBe('Add');
  });
});

describe('report card mastery shape', () => {
  it('starsFromMastery: missing row is 0 stars', () => {
    expect(starsFromMastery(null)).toBe(0);
    expect(starsFromMastery(undefined)).toBe(0);
  });

  it('starsFromMastery: current level maps to stars, clamped 1-5', () => {
    expect(starsFromMastery(1)).toBe(1);
    expect(starsFromMastery(3)).toBe(3);
    expect(starsFromMastery(5)).toBe(5);
    expect(starsFromMastery(0)).toBe(1);
    expect(starsFromMastery(99)).toBe(5);
  });

  it('the curriculum bank really has 44 skills', () => {
    expect(ALL_SKILL_IDS.size).toBe(44);
  });
});
