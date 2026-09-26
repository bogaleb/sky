// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';

vi.mock('server-only', () => ({}));
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
import { GAME_SKILL_CODES, isGameSkillCode, type GameAttempt } from '../lib/kid/game-skills';
import { createAttemptBuffer } from '../lib/kid/attempt-buffer';
import { generateRound, skillForRound, NUM_LEVELS } from '../lib/kid/numbers';
import { ALL_PHONICS, skillForPhonics } from '../lib/kid/phonics';
import { WORDS, buildWordsLevel } from '../lib/kid/words';
import { OPPOSITE_PAIRS, oppositeSkillLevel } from '../lib/kid/opposites';
import { MEMORY_DECKS, skillForDeck } from '../lib/kid/memory-decks';


describe('game skill codes', () => {
  it('lists 37 lowercase skill codes', () => {
    expect(GAME_SKILL_CODES).toHaveLength(37);
    expect(new Set(GAME_SKILL_CODES).size).toBe(37);
    for (const c of GAME_SKILL_CODES) {
      expect(c).toMatch(/^[a-z_]+$/);
      expect(isGameSkillCode(c)).toBe(true);
    }
    expect(isGameSkillCode('not_a_skill')).toBe(false);
  });

  // Every code a game can report must exist in the seeded skills taxonomy —
  // enforced behaviorally in tests/migrations.test.ts, which feeds every
  // GAME_SKILL_CODES entry through the real record_game_attempts RPC against
  // a freshly migrated Postgres (unknown codes raise and drop the batch).
});

describe('item -> skill evidence mappings', () => {
  it('number rounds map to a real skill at a sane level', () => {
    for (const lv of NUM_LEVELS) {
      for (let seed = 1; seed < 40; seed++) {
        const { skill, level } = skillForRound(generateRound(lv, seed));
        expect(isGameSkillCode(skill)).toBe(true);
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(5);
      }
    }
    expect(skillForRound(generateRound(3, 7)).skill).toBe('add');
    expect(skillForRound(generateRound(4, 7)).skill).toBe('subtract');
  });

  it('phonics: blends count toward blending, sight words toward sight_words', () => {
    for (const w of ALL_PHONICS) {
      const { skill } = skillForPhonics(w);
      expect(skill).toBe(w.level === 3 ? 'sight_words' : 'blending');
    }
  });

  it('spelling and opposites levels stay within 1–5', () => {
    for (const w of WORDS) expect([2, 3]).toContain(buildWordsLevel(w));
    for (const p of OPPOSITE_PAIRS) expect([2, 3]).toContain(oppositeSkillLevel(p.word));
  });

  it('memory-cove, puzzle-reef, and rhythm-studio record real answers', async () => {
    // The old test grepped component source for `recordAnswer(`. Here the
    // games are played for real: a recording useGameSession stands in for
    // the server, and the test drives the actual tap handlers.
    const recordAnswer = vi.fn();
    const calls: Array<[boolean, Record<string, unknown>]> = [];
    vi.resetModules();
    vi.doMock('@/components/kid/game-shell', async (orig) => {
      const mod = (await (orig as () => Promise<object>)()) as Record<string, unknown>;
      const React = await import('react');
      return {
        ...mod,
        useGameSession: () => ({
          complete: async () => 0,
          recordAnswer: (correct: boolean, info: Record<string, unknown>) => {
            recordAnswer(correct, info);
            calls.push([correct, info]);
          },
          reset: () => {},
          loading: false,
          completed: false,
          starBalance: 0,
          feedback: null,
          clearFeedback: () => {},
        }),
        GameWinScreen: () => React.createElement('div'),
        AnswerFeedbackPanel: () => null,
      };
    });
    const user = userEvent.setup();

    // Puzzle Reef: pick a puzzle, tap a piece, tap a slot.
    {
      const m = await import('@/components/kid/puzzle-reef');
      const { unmount } = render(
        createElement(m.default, { childId: 'c1', nickname: 'Ada', onExit: () => {} })
      );
      await user.click(screen.getAllByRole('button', { name: /^Build / })[0]);
      await user.click(screen.getAllByRole('listitem', { name: /piece/ })[0]);
      await user.click(screen.getAllByRole('button', { name: /^Empty spot/ })[0]);
      unmount();
    }
    expect(recordAnswer).toHaveBeenCalledTimes(1);
    {
      const [correct, info] = calls[0];
      expect(typeof correct).toBe('boolean');
      expect(info.level).toBeGreaterThanOrEqual(1);
      expect(info.level).toBeLessThanOrEqual(5);
      expect(typeof info.itemKey).toBe('string');
    }

    // Memory Cove: pick a deck, flip two cards — one answered move.
    recordAnswer.mockClear();
    calls.length = 0;
    {
      const m = await import('@/components/kid/memory-cove');
      const { unmount } = render(
        createElement(m.default, {
          child: { id: 'c1', nickname: 'Ada', avatarId: 'fox' },
          onExit: () => {},
        })
      );
      await user.click(screen.getAllByRole('button', { name: /^Play / })[0]);
      const cards = screen.getAllByRole('gridcell', { name: 'Face-down card' });
      await user.click(cards[0]);
      await user.click(cards[1]);
      unmount();
    }
    expect(recordAnswer).toHaveBeenCalledTimes(1);
    {
      const [correct, info] = calls[0];
      expect(typeof correct).toBe('boolean');
      expect(isGameSkillCode(info.skill as string)).toBe(true);
      expect(typeof info.itemKey).toBe('string');
    }

    // Rhythm Studio: pick a tune, wait out the count-in, tap a pad.
    recordAnswer.mockClear();
    calls.length = 0;
    {
      const m = await import('@/components/kid/rhythm-studio');
      const { unmount } = render(
        createElement(m.default, { childId: 'c1', nickname: 'Ada', onExit: () => {} })
      );
      await user.click(screen.getAllByRole('button', { name: /^Play / })[0]);
      await new Promise((r) => setTimeout(r, 3500));
      await user.click(screen.getAllByRole('button', { name: /^Tap the / })[0]);
      unmount();
    }
    expect(recordAnswer.mock.calls.length).toBeGreaterThan(0);
    {
      const [correct, info] = calls[0];
      expect(typeof correct).toBe('boolean');
      expect(info.level).toBeGreaterThanOrEqual(1);
      expect(typeof info.itemKey).toBe('string');
    }
    vi.doUnmock('@/components/kid/game-shell');
  }, 30000);

  it('every memory deck maps to a known skill code', () => {
    expect(MEMORY_DECKS.length).toBeGreaterThan(0);
    for (const deck of MEMORY_DECKS) {
      expect(isGameSkillCode(skillForDeck(deck.id))).toBe(true);
    }
    // Unknown ids fall back to a real code rather than crashing.
    expect(isGameSkillCode(skillForDeck('no-such-deck'))).toBe(true);
  });

  it('memory decks report the subject they teach', () => {
    expect(skillForDeck('letters')).toBe('alphabet');
    expect(skillForDeck('numbers')).toBe('count');
    expect(skillForDeck('number-words')).toBe('count');
    expect(skillForDeck('shapes')).toBe('shapes_patterns');
    expect(skillForDeck('sight-words')).toBe('sight_words');
    expect(skillForDeck('rhymes')).toBe('rhyming');
    expect(skillForDeck('animal-homes')).toBe('animals_habitats');
    // No dedicated codes exist for colors or opposites; vocabulary is closest.
    expect(skillForDeck('colors')).toBe('vocabulary');
    expect(skillForDeck('opposites')).toBe('vocabulary');
  });
});

describe('attempt buffer', () => {
  function setup(flushAt = 3) {
    const sent: GameAttempt[][] = [];
    let fail = false;
    let t = 0;
    const buffer = createAttemptBuffer({
      flushAt,
      now: () => t,
      send: async (batch) => {
        if (fail) throw new Error('offline');
        sent.push(batch);
      },
    });
    return {
      buffer,
      sent,
      tick: (ms: number) => (t += ms),
      setFail: (v: boolean) => (fail = v),
    };
  }

  it('batches answers and flushes at the threshold', async () => {
    const { buffer, sent, tick } = setup(3);
    tick(1000);
    buffer.add({ skill: 'add', correct: true });
    tick(2000);
    buffer.add({ skill: 'add', correct: false });
    expect(sent).toHaveLength(0);
    buffer.add({ skill: 'count', correct: true, level: 2 });
    await buffer.flush();
    expect(sent).toHaveLength(1);
    expect(sent[0].map((a) => a.latency_ms)).toEqual([1000, 2000, 0]);
    expect(sent[0][2]).toMatchObject({ skill: 'count', correct: true, level: 2 });
  });

  it('treats long gaps as breaks, not latency', async () => {
    const { buffer, sent, tick } = setup(1);
    tick(10 * 60 * 1000);
    buffer.add({ skill: 'add', correct: true });
    await buffer.flush();
    expect(sent[0][0].latency_ms).toBeUndefined();
  });

  it('keeps answers after a failed send and delivers them later', async () => {
    const { buffer, sent, setFail } = setup(10);
    setFail(true);
    buffer.add({ skill: 'add', correct: true });
    buffer.add({ skill: 'add', correct: false });
    await buffer.flush();
    expect(sent).toHaveLength(0);
    expect(buffer.size).toBe(2);
    setFail(false);
    await buffer.flush();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toHaveLength(2);
    expect(buffer.size).toBe(0);
  });

  it('caps backlog so a dead network cannot grow memory', async () => {
    const { buffer, sent, setFail } = setup(1000);
    setFail(true);
    for (let i = 0; i < 200; i++) buffer.add({ skill: 'add', correct: i >= 150 });
    expect(buffer.size).toBe(200);
    await buffer.flush();
    // One batch (50) of backlog is kept: the newest answers.
    expect(buffer.size).toBe(50);
    setFail(false);
    await buffer.flush();
    expect(buffer.size).toBe(0);
    expect(sent.flat().every((a) => a.correct)).toBe(true);
  });
});

describe('game components report known skill codes', () => {
  it('every adapted game session is configured with a valid game skill code', async () => {
    // The old test grepped component source for `skill: '...'`. The real
    // invariant is what each game hands to useGameSession, so capture the
    // live configs from rendered games.
    const captured = new Map<string, Record<string, unknown>>();
    vi.resetModules();
    vi.doMock('@/components/kid/game-shell', async (orig) => {
      const mod = (await (orig as () => Promise<object>)()) as Record<string, unknown>;
      const React = await import('react');
      return {
        ...mod,
        useGameSession: (cfg: Record<string, unknown>) => {
          captured.set(String((cfg.learning as Record<string, unknown>)?.gameId ?? '?'), cfg);
          return {
            complete: async () => 0,
            recordAnswer: () => {},
            reset: () => {},
            loading: false,
            completed: false,
            starBalance: 0,
            feedback: null,
            clearFeedback: () => {},
          };
        },
        GameWinScreen: (props: object) =>
          React.createElement('div', { 'data-win-screen': true }),
        AnswerFeedbackPanel: () => null,
      };
    });

    const games: Array<[string, string]> = [
      ['phonics-fun', '@/components/kid/phonics-fun'],
      ['word-builder', '@/components/kid/word-builder'],
      ['number-run', '@/components/kid/number-run'],
      ['fraction-fair', '@/components/kid/fraction-fair'],
      ['letter-lab', '@/components/kid/letter-lab'],
      ['measure-meadow', '@/components/kid/measure-meadow'],
      ['pattern-parade', '@/components/kid/pattern-parade'],
      ['puzzle-reef', '@/components/kid/puzzle-reef'],
      ['rhyme-time', '@/components/kid/rhyme-time'],
      ['rhythm-studio', '@/components/kid/rhythm-studio'],
      ['science-lab', '@/components/kid/science-lab'],
      ['sentence-studio', '@/components/kid/sentence-studio'],
      ['clock-tower', '@/components/kid/clock-tower'],
      ['coin-cove', '@/components/kid/coin-cove'],
      ['color-mix-lab', '@/components/kid/color-mix-lab'],
      ['coding-cove', '@/components/kid/coding-cove'],
      ['opposites-attic', '@/components/kid/opposites-attic'],
    ];
    for (const [id, path] of games) {
      const m = await import(path);
      const { unmount } = render(
        createElement(m.default, { childId: 'c1', nickname: 'Ada', onExit: () => {} })
      );
      unmount();
      const cfg = captured.get(id);
      expect(cfg, `${id} starts a game session`).toBeDefined();
      const learning = cfg!.learning as { gameId: string; skill: string };
      expect(learning.gameId).toBe(id);
      expect(
        isGameSkillCode(learning.skill),
        `${id} reports skill '${learning.skill}'`
      ).toBe(true);
    }
    vi.doUnmock('@/components/kid/game-shell');
  });
});
