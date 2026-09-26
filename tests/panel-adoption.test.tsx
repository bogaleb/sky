// @vitest-environment jsdom
/**
 * AnswerFeedbackPanel adoption: every instrumented game (one with a
 * `learning: { gameId, skill }` config in useGameSession) renders the staged
 * teaching-feedback panel wired to the session that receives its
 * recordAnswer judgments.
 *
 * The old tests grepped each game's source for the panel import and JSX.
 * Here every game is rendered for real with a session that is currently
 * holding teaching feedback, and the test asserts the "Learning help"
 * dialog actually appears in the DOM — proving the panel is rendered and
 * wired, not just imported.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement, type ComponentType } from 'react';

vi.mock('server-only', () => ({}));
vi.mock('@/app/actions/rewards', () => ({
  awardStars: vi.fn(async () => 0),
  awardStickers: vi.fn(async () => []),
}));
vi.mock('@/app/actions/trophies', () => ({ checkTrophies: vi.fn(async () => []) }));
vi.mock('@/app/actions/learning', () => ({
  logLearningEvent: vi.fn(async () => {}),
  recordGameAttempts: vi.fn(async () => ({ recorded: 0, leveledSkills: [] })),
}));
vi.mock('@/lib/kid/reward-errors', () => ({ reportRewardError: vi.fn() }));

const FEEDBACK = {
  stage: 'hint-offer' as const,
  hint: 'Try sounding it out.',
  steps: ['Look at the word again.', 'Say each sound out loud.'],
  showHint: () => {},
  showExample: () => {},
  dismiss: () => {},
};

vi.mock('@/components/kid/game-shell', async (orig) => {
  const mod = (await (orig as () => Promise<object>)()) as Record<string, unknown>;
  return {
    ...mod,
    useGameSession: () => ({
      complete: async () => 0,
      recordAnswer: () => {},
      reset: () => {},
      loading: false,
      completed: false,
      starBalance: 0,
      feedback: FEEDBACK,
      clearFeedback: () => {},
    }),
  };
});

const CHILD_PROPS = { childId: 'c1', nickname: 'Ada', onExit: () => {} };
const MEMORY_PROPS = { child: { id: 'c1', nickname: 'Ada', avatarId: 'fox' }, onExit: () => {} };

const GAMES: Array<[string, Record<string, unknown>]> = [
  ['@/components/kid/clock-tower', CHILD_PROPS],
  ['@/components/kid/coding-cove', CHILD_PROPS],
  ['@/components/kid/coin-cove', CHILD_PROPS],
  ['@/components/kid/color-mix-lab', CHILD_PROPS],
  ['@/components/kid/feelings-theater', CHILD_PROPS],
  ['@/components/kid/fraction-fair', CHILD_PROPS],
  ['@/components/kid/letter-lab', CHILD_PROPS],
  ['@/components/kid/measure-meadow', CHILD_PROPS],
  ['@/components/kid/memory-cove', MEMORY_PROPS],
  ['@/components/kid/number-run', CHILD_PROPS],
  ['@/components/kid/opposites-attic', CHILD_PROPS],
  ['@/components/kid/pattern-parade', CHILD_PROPS],
  ['@/components/kid/phonics-fun', CHILD_PROPS],
  ['@/components/kid/puzzle-reef', CHILD_PROPS],
  ['@/components/kid/rhyme-time', CHILD_PROPS],
  ['@/components/kid/rhythm-studio', CHILD_PROPS],
  ['@/components/kid/science-lab', CHILD_PROPS],
  ['@/components/kid/sentence-studio', CHILD_PROPS],
  ['@/components/kid/word-builder', CHILD_PROPS],
  ['@/components/kid/world-tour', CHILD_PROPS],
];

describe('AnswerFeedbackPanel adoption', () => {
  it.each(GAMES)('%s renders the teaching-feedback panel when the session holds feedback', async (path, props) => {
    const m = await import(path);
    const Game = m.default as ComponentType<Record<string, unknown>>;
    const { unmount } = render(createElement(Game, props));
    // Let the game settle past any intro/count-in timers.
    await new Promise((r) => setTimeout(r, 250));
    expect(
      screen.queryByRole('dialog', { name: 'Learning help' }),
      `${path} must render <AnswerFeedbackPanel> wired to its session`
    ).not.toBeNull();
    unmount();
  }, 30000);

  it('hides the panel when the session holds no feedback', async () => {
    // Control case: the panel is driven by session.feedback, not decoration.
    vi.resetModules();
    vi.doMock('@/components/kid/game-shell', async (orig) => {
      const mod = (await (orig as () => Promise<object>)()) as Record<string, unknown>;
      return {
        ...mod,
        useGameSession: () => ({
          complete: async () => 0,
          recordAnswer: () => {},
          reset: () => {},
          loading: false,
          completed: false,
          starBalance: 0,
          feedback: null,
          clearFeedback: () => {},
        }),
      };
    });
    const m = await import('@/components/kid/word-builder');
    const { unmount } = render(createElement(m.default, CHILD_PROPS as never));
    await new Promise((r) => setTimeout(r, 250));
    expect(screen.queryByRole('dialog', { name: 'Learning help' })).toBeNull();
    unmount();
  }, 30000);
});
