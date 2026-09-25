import { describe, it, expect } from 'vitest';
import {
  WORDS,
  DIGRAPHS,
  SIGHTS,
  ALL_PHONICS,
  phonicsForLevel,
  isBlendable,
  pickSession,
  pickChoices,
  PHONICS_RAMP,
  PHONICS_PER_GAME,
} from '../lib/kid/phonics';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
/** Sounds must be plain lowercase letter-sounds, TTS-friendly. */
const SOUND_RE = /^[a-z]+$/;

describe('phonics bank counts', () => {
  it('has 40 CVC words, 16 digraph words, 12 sight words', () => {
    expect(WORDS.length).toBe(40);
    expect(DIGRAPHS.length).toBe(16);
    expect(SIGHTS.length).toBe(12);
    expect(ALL_PHONICS.length).toBe(68);
  });

  it('has no duplicate words anywhere', () => {
    const words = ALL_PHONICS.map((w) => w.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it('every word is lowercase with a non-empty hint', () => {
    for (const w of ALL_PHONICS) {
      expect(w.word).toBe(w.word.toLowerCase());
      expect(w.hint.trim().length).toBeGreaterThan(0);
    }
  });

  it('levels are correct per list', () => {
    expect(WORDS.every((w) => w.level === 1)).toBe(true);
    expect(DIGRAPHS.every((w) => w.level === 2)).toBe(true);
    expect(SIGHTS.every((w) => w.level === 3)).toBe(true);
  });
});

describe('phoneme breakdowns', () => {
  it('every CVC word has 3 phonemes that join back to the word', () => {
    for (const w of WORDS) {
      expect(w.phonemes.length).toBe(3);
      expect(w.phonemes.join('')).toBe(w.word);
      expect(w.sounds.length).toBe(3);
    }
  });

  it('every digraph word phonemes join back to the word', () => {
    for (const w of DIGRAPHS) {
      expect(w.phonemes.join('')).toBe(w.word);
      expect(w.sounds.length).toBe(w.phonemes.length);
    }
  });

  it('every digraph word contains a real digraph', () => {
    const digraphs = ['sh', 'ch', 'th', 'wh', 'ck'];
    for (const w of DIGRAPHS) {
      expect(w.phonemes.some((p) => digraphs.includes(p))).toBe(true);
    }
  });

  it('sounds are non-empty and TTS-friendly', () => {
    for (const w of [...WORDS, ...DIGRAPHS]) {
      for (const s of w.sounds) {
        expect(s.length).toBeGreaterThan(0);
        expect(s).toMatch(SOUND_RE);
      }
    }
  });

  it('sight words have no breakdown (whole-word only)', () => {
    for (const w of SIGHTS) {
      expect(w.phonemes).toEqual([]);
      expect(w.sounds).toEqual([]);
      expect(isBlendable(w)).toBe(false);
    }
    expect(WORDS.every(isBlendable)).toBe(true);
    expect(DIGRAPHS.every(isBlendable)).toBe(true);
  });

  it('all CVC words are actually CVC (3 letters)', () => {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    for (const w of WORDS) {
      expect(w.word.length).toBe(3);
      expect(vowels.has(w.word[1])).toBe(true);
      expect(vowels.has(w.word[0])).toBe(false);
      expect(vowels.has(w.word[2])).toBe(false);
    }
  });

  it('no emoji in any text', () => {
    for (const w of ALL_PHONICS) {
      expect(w.word).not.toMatch(EMOJI_RE);
      expect(w.hint).not.toMatch(EMOJI_RE);
      for (const s of w.sounds) expect(s).not.toMatch(EMOJI_RE);
    }
  });
});

describe('session picking', () => {
  it('picks 8 items with ramp 1,1,2,2,3,3,3,3', () => {
    const session = pickSession(12345);
    expect(session.length).toBe(PHONICS_PER_GAME);
    expect(session.map((w) => w.level)).toEqual(PHONICS_RAMP);
  });

  it('never repeats a word within a session', () => {
    for (const seed of [1, 7, 42, 999, 123456]) {
      const session = pickSession(seed);
      const words = session.map((w) => w.word);
      expect(new Set(words).size).toBe(words.length);
    }
  });

  it('is deterministic per seed', () => {
    const a = pickSession(777).map((w) => w.word);
    const b = pickSession(777).map((w) => w.word);
    expect(a).toEqual(b);
  });

  it('different seeds give different sessions', () => {
    const a = pickSession(1).map((w) => w.word).join(',');
    const b = pickSession(2).map((w) => w.word).join(',');
    expect(a).not.toBe(b);
  });
});

describe('match choices', () => {
  it('returns 3 same-level choices with the answer exactly once', () => {
    for (const seed of [5, 50, 500]) {
      const session = pickSession(seed);
      for (const entry of session) {
        const choices = pickChoices(entry, seed);
        expect(choices.length).toBe(3);
        expect(choices.filter((c) => c.word === entry.word).length).toBe(1);
        expect(choices.every((c) => c.level === entry.level)).toBe(true);
        const words = choices.map((c) => c.word);
        expect(new Set(words).size).toBe(3);
      }
    }
  });

  it('is deterministic per seed', () => {
    const entry = WORDS[0];
    const a = pickChoices(entry, 99).map((c) => c.word);
    const b = pickChoices(entry, 99).map((c) => c.word);
    expect(a).toEqual(b);
  });

  it('phonicsForLevel returns the right pools', () => {
    expect(phonicsForLevel(1).length).toBe(40);
    expect(phonicsForLevel(2).length).toBe(16);
    expect(phonicsForLevel(3).length).toBe(12);
  });
});
