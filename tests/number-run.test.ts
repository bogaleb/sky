import { describe, expect, it } from 'vitest';
import {
  generateRound,
  levelForRound,
  NUM_LEVELS,
  ROUNDS_PER_GAME,
  DOT_POSITIONS,
  type NumberRound,
} from '../lib/kid/numbers';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

function sampleRounds(n: number): NumberRound[] {
  const out: NumberRound[] = [];
  for (let i = 0; i < n; i++) {
    const level = NUM_LEVELS[i % NUM_LEVELS.length];
    out.push(generateRound(level, 1000 + i * 37));
  }
  return out;
}

describe('number-run generators', () => {
  it('is deterministic for the same level and seed', () => {
    for (const level of NUM_LEVELS) {
      const a = generateRound(level, 4242);
      const b = generateRound(level, 4242);
      expect(a).toEqual(b);
    }
  });

  it('varies with different seeds', () => {
    const seen = new Set<string>();
    for (let s = 0; s < 20; s++) seen.add(JSON.stringify(generateRound(3, s)));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('clamps levels into 1..5', () => {
    expect(generateRound(0, 7).level).toBe(1);
    expect(generateRound(-3, 7).level).toBe(1);
    expect(generateRound(99, 7).level).toBe(5);
  });

  it('maps each level to its round kind', () => {
    const kinds = { 1: 'count', 2: 'compare', 3: 'add', 4: 'subtract', 5: 'missing' } as const;
    for (const level of NUM_LEVELS) {
      expect(generateRound(level, 99).kind).toBe(kinds[level]);
    }
  });

  it('uses the [1,1,2,2,3,3,4,5] level ramp over 8 rounds', () => {
    expect(ROUNDS_PER_GAME).toBe(8);
    expect(Array.from({ length: 8 }, (_, i) => levelForRound(i))).toEqual([1, 1, 2, 2, 3, 3, 4, 5]);
  });

  it('DOT_POSITIONS covers counts 0..10', () => {
    expect(DOT_POSITIONS.length).toBe(11);
    for (let n = 1; n <= 10; n++) expect(DOT_POSITIONS[n].length).toBe(n);
  });
});

describe('choice invariants (300 sampled rounds)', () => {
  const rounds = sampleRounds(300);

  it('has exactly one correct choice, all distinct, all non-negative', () => {
    for (const r of rounds) {
      const correct = r.choices.filter((c) => c === r.answer);
      expect(correct.length).toBe(1);
      expect(new Set(r.choices).size).toBe(r.choices.length);
      for (const c of r.choices) {
        expect(Number.isInteger(c)).toBe(true);
        expect(c).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('uses 3 choices for levels 1-2 and 4 for levels 3-5', () => {
    for (const r of rounds) {
      expect(r.choices.length).toBe(r.level <= 2 ? 3 : 4);
    }
  });

  it('has non-empty, emoji-free prompts and questions', () => {
    for (const r of rounds) {
      expect(r.prompt.length).toBeGreaterThan(0);
      expect(r.question.length).toBeGreaterThan(0);
      expect(EMOJI_RE.test(r.prompt)).toBe(false);
      expect(EMOJI_RE.test(r.question)).toBe(false);
    }
  });
});

describe('visual/count consistency', () => {
  it('count rounds: dots equal the answer', () => {
    for (let s = 0; s < 30; s++) {
      const r = generateRound(1, s);
      expect(r.dots).toHaveLength(1);
      expect(r.dots[0].count).toBe(r.answer);
      expect(r.answer).toBeGreaterThanOrEqual(3);
      expect(r.answer).toBeLessThanOrEqual(6);
      expect(r.sequence).toEqual([]);
    }
  });

  it('compare rounds: two different groups, answer is the bigger', () => {
    for (let s = 0; s < 30; s++) {
      const r = generateRound(2, s);
      expect(r.dots).toHaveLength(2);
      const [a, b] = r.dots.map((d) => d.count);
      expect(a).not.toBe(b);
      expect(r.answer).toBe(Math.max(a, b));
      // The smaller count is offered as the classic wrong-side distractor.
      expect(r.choices).toContain(Math.min(a, b));
    }
  });

  it('add rounds: groups sum to the answer, within 10', () => {
    for (let s = 0; s < 30; s++) {
      const r = generateRound(3, s);
      expect(r.dots).toHaveLength(2);
      const sum = r.dots[0].count + r.dots[1].count;
      expect(r.answer).toBe(sum);
      expect(sum).toBeLessThanOrEqual(10);
      expect(sum).toBeGreaterThanOrEqual(2);
    }
  });

  it('subtract rounds: count minus crossed equals the answer', () => {
    for (let s = 0; s < 30; s++) {
      const r = generateRound(4, s);
      expect(r.dots).toHaveLength(1);
      const g = r.dots[0];
      expect(g.crossed).toBeGreaterThan(0);
      expect(g.crossed).toBeLessThan(g.count);
      expect(r.answer).toBe(g.count - (g.crossed ?? 0));
      expect(r.answer).toBeGreaterThanOrEqual(1);
    }
  });

  it('missing rounds: one blank tile, answer completes the step', () => {
    for (let s = 0; s < 30; s++) {
      const r = generateRound(5, s);
      expect(r.sequence).toHaveLength(4);
      const blanks = r.sequence.filter((v) => v === null);
      expect(blanks).toHaveLength(1);
      const filled = r.sequence.map((v) => v ?? r.answer) as number[];
      const step = filled[1] - filled[0];
      expect(step).toBeGreaterThanOrEqual(1);
      expect(filled[2] - filled[1]).toBe(step);
      expect(filled[3] - filled[2]).toBe(step);
      // Blank is never the first tile.
      expect(r.sequence[0]).not.toBeNull();
    }
  });
});
