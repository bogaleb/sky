import { describe, expect, it } from 'vitest';
import {
  SENTENCES,
  generateRound,
  pickRounds,
  levelForRound,
  isValidSentence,
  builtSentence,
  sentenceWords,
  sentencesForLevel,
  ROUNDS_PER_GAME,
} from '@/lib/kid/sentences';

const EMOJI = /[🌀-🫿☀-➿⬀-⯿️]/u;

describe('sentence bank', () => {
  it('has at least 24 sentences', () => {
    expect(SENTENCES.length).toBeGreaterThanOrEqual(24);
  });

  it('every sentence starts with a capital and ends with a period', () => {
    for (const s of SENTENCES) {
      expect(isValidSentence(s.text), s.text).toBe(true);
    }
  });

  it('has no duplicate sentences', () => {
    const texts = SENTENCES.map((s) => s.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('level word counts: L1 = 3 words, L2 = 4-5 words, L3 = 6+ words', () => {
    for (const s of SENTENCES) {
      const n = sentenceWords(s.text).length;
      if (s.level === 1) expect(n).toBe(3);
      if (s.level === 2) expect(n).toBeGreaterThanOrEqual(4), expect(n).toBeLessThanOrEqual(5);
      if (s.level === 3) expect(n).toBeGreaterThanOrEqual(6);
    }
  });

  it('L3 sentences use and/because', () => {
    for (const s of sentencesForLevel(3)) {
      expect(s.text).toMatch(/\b(and|because)\b/);
    }
  });

  it('contains no emoji', () => {
    for (const s of SENTENCES) {
      expect(s.text).not.toMatch(EMOJI);
    }
  });
});

describe('generateRound', () => {
  it('is deterministic for the same seed', () => {
    const a = generateRound(2, 12345);
    const b = generateRound(2, 12345);
    expect(a.sentence).toBe(b.sentence);
    expect(a.tiles.map((t) => t.id)).toEqual(b.tiles.map((t) => t.id));
  });

  it('varies with different seeds', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      seen.add(generateRound(1, seed).sentence);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('answer ids reconstruct the sentence in order', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const r = generateRound((seed % 3) + 1 as 1 | 2 | 3, seed * 977);
      const byId = new Map(r.tiles.map((t) => [t.id, t]));
      const ordered = r.answer.map((id) => byId.get(id)!);
      expect(builtSentence(ordered)).toBe(r.sentence);
    }
  });

  it('tiles are shuffled (not in answer order) at least sometimes', () => {
    let shuffled = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const r = generateRound(2, seed);
      if (r.tiles.map((t) => t.id).join() !== r.answer.join()) shuffled++;
    }
    expect(shuffled).toBeGreaterThan(0);
  });

  it('first tile is capitalized and last tile carries the period', () => {
    const r = generateRound(1, 42);
    const byId = new Map(r.tiles.map((t) => [t.id, t]));
    const first = byId.get(r.answer[0])!;
    const last = byId.get(r.answer[r.answer.length - 1])!;
    expect(first.text[0]).toBe(first.text[0].toUpperCase());
    expect(last.text.endsWith('.')).toBe(true);
  });
});

describe('pickRounds', () => {
  it('returns 8 rounds with the L1/L2/L3 ramp', () => {
    const rounds = pickRounds(7);
    expect(rounds).toHaveLength(ROUNDS_PER_GAME);
    expect(rounds.map((r) => r.level)).toEqual([1, 1, 1, 2, 2, 2, 3, 3]);
  });

  it('levelForRound ramps 1,1,1,2,2,2,3,3', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(levelForRound)).toEqual([1, 1, 1, 2, 2, 2, 3, 3]);
  });

  it('never repeats a sentence within one game', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const texts = pickRounds(seed).map((r) => r.sentence);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = pickRounds(99).map((r) => r.sentence);
    const b = pickRounds(99).map((r) => r.sentence);
    expect(a).toEqual(b);
  });
});

describe('isValidSentence', () => {
  it('accepts capital-start + period-end', () => {
    expect(isValidSentence('The cat naps.')).toBe(true);
  });
  it('rejects lowercase start, missing period, empty', () => {
    expect(isValidSentence('the cat naps.')).toBe(false);
    expect(isValidSentence('The cat naps')).toBe(false);
    expect(isValidSentence('')).toBe(false);
  });
});
