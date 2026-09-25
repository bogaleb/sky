import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OPPOSITE_PAIRS,
  AMBIGUOUS_PARTNERS,
  ROUNDS_PER_GAME,
  areOpposites,
  oppositeOf,
  pairFor,
  levelFor,
  levelForRound,
  generateQuestion,
  generateMatchRound,
  pickSession,
} from '@/lib/kid/opposites';

const EMOJI = /[🌀-🫿☀-➿⬀-⯿️]/u;

describe('opposite pairs', () => {
  it('has 36+ pairs with 12 per level', () => {
    expect(OPPOSITE_PAIRS.length).toBeGreaterThanOrEqual(36);
    for (const lvl of [1, 2, 3] as const) {
      expect(OPPOSITE_PAIRS.filter((p) => p.level === lvl).length).toBeGreaterThanOrEqual(12);
    }
  });

  it('pairs are valid: distinct sides, lowercase, no duplicates', () => {
    const seen = new Set<string>();
    for (const p of OPPOSITE_PAIRS) {
      expect(p.word).not.toBe(p.opposite);
      expect(p.word).toMatch(/^[a-z]+$/);
      expect(p.opposite).toMatch(/^[a-z]+$/);
      expect(EMOJI.test(p.word + p.opposite)).toBe(false);
      const key = [p.word, p.opposite].sort().join('|');
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('includes the required anchor pairs', () => {
    expect(areOpposites('big', 'little')).toBe(true);
    expect(areOpposites('hot', 'cold')).toBe(true);
    expect(areOpposites('fast', 'slow')).toBe(true);
    expect(areOpposites('happy', 'sad')).toBe(true);
    expect(areOpposites('light', 'dark')).toBe(true);
    expect(areOpposites('empty', 'full')).toBe(true);
    expect(areOpposites('brave', 'scared')).toBe(true);
    expect(areOpposites('smooth', 'rough')).toBe(true);
    expect(areOpposites('kind', 'mean')).toBe(true);
  });

  it('oppositeOf and pairFor resolve in both directions', () => {
    expect(oppositeOf('big')).toBe('little');
    expect(oppositeOf('little')).toBe('big');
    expect(pairFor('scared')?.word).toBe('brave');
    expect(oppositeOf('not-a-word')).toBeUndefined();
  });

  it('levelFor clamps to 1..3 and levelForRound ramps', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(9)).toBe(3);
    expect(levelForRound(0)).toBe(1);
    expect(levelForRound(5)).toBe(2);
    expect(levelForRound(7)).toBe(3);
  });
});

describe('generateQuestion', () => {
  it('answer is the true opposite of the word', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const level of [1, 2, 3]) {
        const q = generateQuestion(level, seed);
        expect(q.kind).toBe('ask');
        expect(areOpposites(q.word, q.answer)).toBe(true);
        expect(q.choices).toHaveLength(3);
        expect(q.choices).toContain(q.answer);
        expect(new Set(q.choices).size).toBe(3);
      }
    }
  });

  it('distractors are never the word, its partner, or ambiguous partners', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const q = generateQuestion((seed % 3) + 1, seed * 31);
      const banned = new Set([
        q.word,
        q.answer,
        ...(AMBIGUOUS_PARTNERS[q.word] ?? []),
        ...(AMBIGUOUS_PARTNERS[q.answer] ?? []),
      ]);
      for (const c of q.choices) {
        if (c !== q.answer) expect(banned.has(c)).toBe(false);
      }
      // distractors are real vocabulary words from the pair list
      for (const c of q.choices) {
        expect(pairFor(c)).toBeDefined();
      }
    }
  });

  it('is deterministic per seed and varies across seeds', () => {
    const a = generateQuestion(2, 12345);
    const b = generateQuestion(2, 12345);
    expect(a).toEqual(b);
    const others = new Set(
      Array.from({ length: 20 }, (_, i) => JSON.stringify(generateQuestion(2, 5000 + i)))
    );
    expect(others.size).toBeGreaterThan(5);
  });

  it('levels gate the pair pool', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const q = generateQuestion(1, seed);
      expect(pairFor(q.word)?.level).toBe(1);
    }
  });
});

describe('generateMatchRound', () => {
  it('produces 6 unique cards hiding 3 valid pairs', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const r = generateMatchRound(seed);
      expect(r.kind).toBe('match');
      expect(r.cards).toHaveLength(6);
      expect(new Set(r.cards).size).toBe(6);
      expect(r.pairs).toHaveLength(3);
      for (const [a, b] of r.pairs) {
        expect(areOpposites(a, b)).toBe(true);
        expect(r.cards).toContain(a);
        expect(r.cards).toContain(b);
      }
    }
  });

  it('never mixes ambiguous pairs into one round', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const r = generateMatchRound(seed);
      for (let i = 0; i < r.pairs.length; i++) {
        for (let j = i + 1; j < r.pairs.length; j++) {
          const [a1, b1] = r.pairs[i];
          const [a2, b2] = r.pairs[j];
          for (const w of [a1, b1]) {
            for (const x of [a2, b2]) {
              expect((AMBIGUOUS_PARTNERS[w] ?? []).includes(x)).toBe(false);
            }
          }
        }
      }
    }
  });

  it('is deterministic per seed', () => {
    expect(generateMatchRound(777)).toEqual(generateMatchRound(777));
  });
});

describe('pickSession', () => {
  it('builds 8 rounds with both kinds, deterministically', () => {
    const s1 = pickSession(20260925);
    const s2 = pickSession(20260925);
    expect(s1).toEqual(s2);
    expect(s1).toHaveLength(ROUNDS_PER_GAME);
    expect(s1.filter((r) => r.kind === 'ask').length).toBeGreaterThan(0);
    expect(s1.filter((r) => r.kind === 'match').length).toBeGreaterThan(0);
  });
});

describe('opposites-attic component', () => {
  const src = readFileSync(join(process.cwd(), 'components', 'kid', 'opposites-attic.tsx'), 'utf8');

  it('is emoji-free and wires the Wave 9 reward hooks', () => {
    expect(EMOJI.test(src)).toBe(false);
    expect(src).toContain("'opposites_game'");
    expect(src).toContain("'opposites-ace'");
    expect(src).toContain('opposites_done');
    expect(src).toContain('opposites_attic_win');
    expect(src).toContain('speakAs');
    expect(src).toContain('aria-label');
  });

  it('renders the attic scene and match interaction', () => {
    expect(src).toContain('AtticScene');
    expect(src).toContain('round window');
    expect(src).toContain('What is the opposite of');
    expect(src).toContain('Tap two cards that are opposites');
  });
});
