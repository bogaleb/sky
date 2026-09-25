import { describe, it, expect } from 'vitest';
import {
  WORDS,
  wordsForLevel,
  isCVC,
  mulberry32,
  seededShuffle,
  pickGameWords,
  LEVEL_RAMP,
  WORDS_PER_GAME,
  hasPictogram,
  pictogramFor,
  WordFallbackArt,
} from '../lib/kid/words';
import { getSticker } from '../lib/kid/stickers';

describe('word bank', () => {
  it('has at least 48 words', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(48);
  });

  it('every word has a valid level and hint', () => {
    for (const w of WORDS) {
      expect([1, 2, 3, 4]).toContain(w.level);
      expect(w.word.length).toBeGreaterThan(0);
      expect(w.hint.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate words', () => {
    const words = WORDS.map((w) => w.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it('every level has at least 10 words', () => {
    for (const level of [1, 2, 3, 4] as const) {
      expect(wordsForLevel(level).length).toBeGreaterThanOrEqual(10);
    }
  });

  it('all level 1 words are CVC', () => {
    const l1 = wordsForLevel(1);
    expect(l1.length).toBeGreaterThan(0);
    for (const w of l1) {
      expect(isCVC(w.word)).toBe(true);
    }
  });

  it('isCVC rejects non-CVC shapes', () => {
    expect(isCVC('cat')).toBe(true);
    expect(isCVC('ant')).toBe(false); // vowel first
    expect(isCVC('egg')).toBe(false); // ends in double consonant
    expect(isCVC('frog')).toBe(false); // 4 letters
    expect(isCVC('red')).toBe(true);
    expect(isCVC('the')).toBe(false); // CCV, not CVC
  });

  it('has no emoji in words or hints', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (const w of WORDS) {
      expect(w.word).not.toMatch(emoji);
      expect(w.hint).not.toMatch(emoji);
    }
  });
});

describe('seeded shuffle', () => {
  it('is deterministic for the same seed', () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], 42);
    const b = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8], 42);
    expect(a).toEqual(b);
  });

  it('differs across seeds (almost surely)', () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1);
    const b = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2);
    expect(a).not.toEqual(b);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    seededShuffle(input, 7);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it('mulberry32 is deterministic', () => {
    const r1 = mulberry32(99);
    const r2 = mulberry32(99);
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);
  });
});

describe('game word picker', () => {
  it('picks 8 words following the level ramp', () => {
    const picked = pickGameWords(1234);
    expect(picked).toHaveLength(WORDS_PER_GAME);
    expect(picked.map((w) => w.level)).toEqual(LEVEL_RAMP);
  });

  it('never repeats a word within a game', () => {
    for (let seed = 0; seed < 50; seed++) {
      const picked = pickGameWords(seed);
      const words = picked.map((w) => w.word);
      expect(new Set(words).size).toBe(words.length);
    }
  });

  it('is deterministic per seed', () => {
    const a = pickGameWords(555).map((w) => w.word);
    const b = pickGameWords(555).map((w) => w.word);
    expect(a).toEqual(b);
  });
});

describe('pictograms', () => {
  it('every level-1 word has a dedicated pictogram', () => {
    for (const w of wordsForLevel(1)) {
      expect(hasPictogram(w.word)).toBe(true);
    }
  });

  it('pictogramFor falls back to the letter block for unknown words', () => {
    expect(pictogramFor('cat')).not.toBe(WordFallbackArt);
    expect(pictogramFor('xylophone')).toBe(WordFallbackArt);
  });

  it('has at least 24 dedicated pictograms', () => {
    const covered = WORDS.filter((w) => hasPictogram(w.word));
    expect(new Set(covered.map((w) => w.word)).size).toBeGreaterThanOrEqual(24);
  });
});

describe('word builder stickers', () => {
  it('all six wave-3 stickers resolve', () => {
    for (const id of ['word-wizard', 'number-ninja', 'star-gazer', 'little-artist', 'movie-star', 'sweet-dreams']) {
      expect(getSticker(id)).toBeDefined();
    }
  });

  it('word-wizard matches the required contract', () => {
    const s = getSticker('word-wizard');
    expect(s?.name).toBe('Word Wizard');
    expect(s?.description).toBe('Spelled 10 magic words!');
  });
});
