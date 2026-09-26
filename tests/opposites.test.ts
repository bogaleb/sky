// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
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

vi.mock('server-only', () => ({}));
vi.mock('@/lib/kid/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/kid/audio')>();
  return {
    ...actual,
    speak: vi.fn(),
    speakAs: vi.fn(),
    playSfx: vi.fn(),
    stopSpeaking: vi.fn(),
    unlockAudio: vi.fn(),
  };
});
vi.mock('@/app/actions/rewards', () => ({
  awardStars: vi.fn(async () => 0),
  awardStickers: vi.fn(async () => {}),
}));
vi.mock('@/app/actions/trophies', () => ({ checkTrophies: vi.fn(async () => {}) }));
vi.mock('@/app/actions/learning', () => ({
  logLearningEvent: vi.fn(async () => {}),
  recordGameAttempts: vi.fn(async () => ({ recorded: 0, leveledSkills: [] })),
}));
vi.mock('@/lib/kid/reward-errors', () => ({ reportRewardError: vi.fn() }));

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
  it('wires the Wave 9 reward hooks through the game session config', async () => {
    // The old test grepped the source for these identifiers. The real
    // invariant is what useGameSession receives, so capture the config.
    const captured: Record<string, unknown>[] = [];
    vi.resetModules();
    vi.doMock('@/components/kid/game-shell', async (orig) => {
      const mod = await (orig as () => Promise<object>)();
      const React = await import('react');
      return {
        ...(mod as object),
        useGameSession: (cfg: Record<string, unknown>) => {
          captured.push(cfg);
          return { status: 'playing', complete: async () => 0, starBalance: 0 };
        },
        GameWinScreen: (props: object) =>
          React.createElement('div', { 'data-win-screen': true }),
        AnswerFeedbackPanel: () => null,
      };
    });
    const { default: OppositesAttic } = await import(
      '@/components/kid/opposites-attic'
    );
    render(
      createElement(OppositesAttic, { childId: 'c1', nickname: 'Ada', onExit: () => {} })
    );
    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({
      gameKey: 'opposites_game',
      stickerId: 'opposites-ace',
      trophyEvent: 'opposites_done',
      milestone: 'opposites_attic_win',
    });
    expect(captured[0]).toHaveProperty(['learning', 'gameId'], 'opposites-attic');
    vi.doUnmock('@/components/kid/game-shell');
  });

  it('renders the attic scene emoji-free with Luna hosting', async () => {
    const user = userEvent.setup();
    vi.resetModules();
    const { default: OppositesAttic } = await import(
      '@/components/kid/opposites-attic'
    );
    const { container } = render(
      createElement(OppositesAttic, { childId: 'c1', nickname: 'Ada', onExit: () => {} })
    );
    expect(screen.getByText('Opposites Attic')).toBeInTheDocument();
    // Start the game: the round prompt is visible to the kid.
    await user.click(screen.getByRole('button', { name: 'Start Opposites Attic' }));
    expect(
      screen.getByText(/What is the opposite of|Tap two cards that are opposites/)
    ).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(EMOJI);
  });
});
