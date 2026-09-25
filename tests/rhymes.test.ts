import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RHYME_SETS, ROUNDS_PER_GAME, roundFromSet, pickSession } from '../lib/kid/rhymes';

describe('rhyme sets', () => {
  it('has 36 rhyme sets', () => {
    expect(RHYME_SETS).toHaveLength(36);
  });

  it('each set has a prompt, 4 rhymes, 4 non-rhymes, all lowercase words', () => {
    for (const set of RHYME_SETS) {
      expect(set.prompt).toMatch(/^[a-z]+$/);
      expect(set.rhymes).toHaveLength(4);
      expect(set.nonRhymes).toHaveLength(4);
      expect(set.rhymes.every((w) => /^[a-z]+$/.test(w))).toBe(true);
      expect(set.nonRhymes.every((w) => /^[a-z]+$/.test(w))).toBe(true);
      // Prompt and rhymes are distinct words.
      expect(new Set([set.prompt, ...set.rhymes]).size).toBe(5);
      // Non-rhymes don't overlap the family.
      for (const w of set.nonRhymes) {
        expect(w).not.toBe(set.prompt);
        expect(set.rhymes).not.toContain(w);
      }
    }
  });

  it('families are unique', () => {
    const families = RHYME_SETS.map((s) => s.family);
    expect(new Set(families).size).toBe(families.length);
  });
});

describe('roundFromSet', () => {
  it('choices contain exactly one rhyme', () => {
    for (const set of RHYME_SETS) {
      for (let seed = 0; seed < 10; seed++) {
        const round = roundFromSet(set, seed);
        expect(round.choices).toHaveLength(3);
        expect(new Set(round.choices).size).toBe(3);
        expect(set.rhymes).toContain(round.answer);
        expect(round.choices).toContain(round.answer);
        const rhymesInChoices = round.choices.filter((c) => set.rhymes.includes(c));
        expect(rhymesInChoices).toHaveLength(1);
        const nonRhymesInChoices = round.choices.filter((c) => set.nonRhymes.includes(c));
        expect(nonRhymesInChoices).toHaveLength(2);
      }
    }
  });

  it('is deterministic for a seed and varies across seeds', () => {
    const set = RHYME_SETS[0];
    expect(roundFromSet(set, 7)).toEqual(roundFromSet(set, 7));
    const variants = new Set([1, 2, 3, 4, 5, 6].map((s) => JSON.stringify(roundFromSet(set, s))));
    expect(variants.size).toBeGreaterThan(1);
  });
});

describe('pickSession', () => {
  it('returns 8 rounds from 8 different sets', () => {
    const rounds = pickSession(123);
    expect(rounds).toHaveLength(ROUNDS_PER_GAME);
    expect(new Set(rounds.map((r) => r.prompt)).size).toBe(8);
  });

  it('is deterministic for a seed', () => {
    expect(pickSession(99)).toEqual(pickSession(99));
    expect(pickSession(99)).not.toEqual(pickSession(100));
  });

  it('every round answer is a true rhyme of its prompt', () => {
    const rounds = pickSession(555);
    for (const round of rounds) {
      const set = RHYME_SETS.find((s) => s.prompt === round.prompt);
      expect(set).toBeDefined();
      expect(set!.rhymes).toContain(round.answer);
    }
  });
});

describe('content hygiene', () => {
  it('rhyme source has no emoji', () => {
    const src = readFileSync(new URL('../lib/kid/rhymes.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u);
  });
});
