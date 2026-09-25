/**
 * Wave 10 Track 1 — GameShell tests.
 *
 * No jsdom/testing-library in this repo, so the hook is exercised for real
 * via react-dom/server renderToString (hooks run during SSR) with the
 * server-action modules mocked. Game components get real dynamic-import
 * smoke tests (default export is a component function).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';

// --- mocks (hoisted so factories can reference them) ---
const awardStarsMock = vi.hoisted(() => vi.fn(async () => 42));
const awardStickersMock = vi.hoisted(() => vi.fn(async () => {}));
const bumpQuestProgressMock = vi.hoisted(() => vi.fn(async () => {}));
const checkTrophiesMock = vi.hoisted(() => vi.fn(async () => {}));
const logLearningEventMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock('server-only', () => ({}));
vi.mock('@/app/actions/rewards', () => ({
  awardStars: awardStarsMock,
  awardStickers: awardStickersMock,
}));
vi.mock('@/app/actions/trail', () => ({ bumpQuestProgress: bumpQuestProgressMock }));
vi.mock('@/app/actions/trophies', () => ({ checkTrophies: checkTrophiesMock }));
vi.mock('@/app/actions/learning', () => ({ logLearningEvent: logLearningEventMock }));
vi.mock('@/app/actions/showdown', () => ({ getFamilyWeeklyStars: vi.fn(async () => []) }));
vi.mock('@/app/actions/collections', () => ({ getCollection: vi.fn(async () => null) }));
const reportRewardErrorMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/kid/reward-errors', () => ({ reportRewardError: reportRewardErrorMock }));

import {
  useGameSession,
  GameWinScreen,
  reportRewardError,
  type GameSession,
} from '@/components/kid/game-shell';

function probeSession(config: Parameters<typeof useGameSession>[0]): GameSession {
  let captured: GameSession | null = null;
  function Probe() {
    captured = useGameSession(config);
    return null;
  }
  renderToString(createElement(Probe));
  if (!captured) throw new Error('useGameSession did not run');
  return captured;
}

const FULL = {
  childId: 'child-1',
  gameKey: 'word_game',
  stickerId: 'word-wizard',
  trophyEvent: 'word_done' as const,
  milestone: 'word_builder_win',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useGameSession reward sequence', () => {
  it('runs the full sequence in order: stars -> quest -> stickers -> trophies -> milestone', async () => {
    const session = probeSession(FULL);
    const result = await session.complete({ stars: 3, mistakes: 1, extraMetadata: { words: 8 } });

    expect(awardStarsMock).toHaveBeenCalledWith('child-1', 3);
    expect(bumpQuestProgressMock).toHaveBeenCalledWith('child-1', 'word_game', 1);
    expect(awardStickersMock).toHaveBeenCalledWith('child-1', ['word-wizard']);
    expect(checkTrophiesMock).toHaveBeenCalledWith('child-1', 'word_done');
    expect(logLearningEventMock).toHaveBeenCalledWith('child-1', 'milestone', {
      metadata: { kind: 'word_builder_win', stars: 3, mistakes: 1, words: 8 },
    });

    const order = [
      awardStarsMock.mock.invocationCallOrder[0],
      bumpQuestProgressMock.mock.invocationCallOrder[0],
      awardStickersMock.mock.invocationCallOrder[0],
      checkTrophiesMock.mock.invocationCallOrder[0],
      logLearningEventMock.mock.invocationCallOrder[0],
    ];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(result.starBalance).toBe(42);
    expect(result.errors).toEqual([]);
  });

  it('a failing step does not block the other steps and is reported', async () => {
    bumpQuestProgressMock.mockRejectedValueOnce(new Error('db down'));
    const session = probeSession(FULL);
    const result = await session.complete({ stars: 2 });

    expect(awardStarsMock).toHaveBeenCalledTimes(1);
    expect(awardStickersMock).toHaveBeenCalledTimes(1);
    expect(checkTrophiesMock).toHaveBeenCalledTimes(1);
    expect(logLearningEventMock).toHaveBeenCalledTimes(1);

    expect(reportRewardErrorMock).toHaveBeenCalledTimes(1);
    expect(reportRewardErrorMock).toHaveBeenCalledWith(
      'child-1',
      'bumpQuestProgress',
      expect.any(Error)
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].step).toBe('bumpQuestProgress');
    expect(result.errors[0].message).toBe('db down');
  });

  it('skips awardStars when stars is 0 (celebration-only completions)', async () => {
    const session = probeSession({ childId: 'c2', milestone: 'homes_all_visited' });
    await session.complete({ stars: 0 });
    expect(awardStarsMock).not.toHaveBeenCalled();
    expect(logLearningEventMock).toHaveBeenCalledTimes(1);
  });

  it('omits quest/sticker/trophy steps when not configured', async () => {
    const session = probeSession({ childId: 'c3', milestone: 'memory_win' });
    await session.complete({ stars: 2 });
    expect(awardStarsMock).toHaveBeenCalledTimes(1);
    expect(bumpQuestProgressMock).not.toHaveBeenCalled();
    expect(awardStickersMock).not.toHaveBeenCalled();
    expect(checkTrophiesMock).not.toHaveBeenCalled();
    expect(logLearningEventMock).toHaveBeenCalledTimes(1);
  });

  it('per-call stickerIds override the configured stickerId', async () => {
    const session = probeSession({ childId: 'c4', milestone: 'bedtime_complete' });
    await session.complete({ stars: 2, stickerIds: ['sweet-dreams', 'star-gazer'] });
    expect(awardStickersMock).toHaveBeenCalledWith('c4', ['sweet-dreams', 'star-gazer']);
  });
});

describe('reportRewardError wiring', () => {
  it('re-exports the shared Track 3 reporter', () => {
    expect(reportRewardError).toBe(reportRewardErrorMock);
  });
});

describe('GameWinScreen', () => {
  it('renders on the Wave 8 design contract (static source check)', () => {
    const src = readFileSync(join(__dirname, '..', 'components', 'kid', 'game-shell.tsx'), 'utf8');
    expect(src).toContain('glass-kid');
    expect(src).toContain('font-display');
    expect(src).toContain('btn-kid');
  });

  it('renders stars, sticker reveal, and both buttons', () => {
    const html = renderToString(
      createElement(GameWinScreen, {
        stars: 3,
        nickname: 'Ada',
        title: 'You did it, Ada!',
        message: 'You built 8 words',
        stickerId: 'word-wizard',
        onPlayAgain: () => {},
        onExit: () => {},
      })
    );
    expect(html).toContain('glass-kid');
    expect(html).toContain('font-display');
    expect(html).toContain('btn-kid');
    expect(html).toContain('You did it, Ada!');
    expect(html).toContain('You built 8 words');
    expect(html).toContain('Word Wizard');
    expect(html).toContain('Play again');
    expect(html).toContain('Map');
    expect(html).toContain('aria-label="You earned 3 stars"');
  });

  it('calm tone skips confetti', () => {
    const html = renderToString(
      createElement(GameWinScreen, { stars: 2, onPlayAgain: () => {}, onExit: () => {}, tone: 'calm' })
    );
    expect(html).not.toContain('kid-confetti');
  });

  it('renders an optional secondary action', () => {
    const html = renderToString(
      createElement(GameWinScreen, {
        stars: 2,
        onPlayAgain: () => {},
        onExit: () => {},
        secondaryAction: { label: 'Another deck', onClick: () => {} },
      })
    );
    expect(html).toContain('Another deck');
    const plain = renderToString(
      createElement(GameWinScreen, { stars: 2, onPlayAgain: () => {}, onExit: () => {} })
    );
    expect(plain).not.toContain('Another deck');
  });
});

describe('migrated games keep their default-export component API', () => {
  const games = [
    'word-builder',
    'sentence-studio',
    'letter-lab',
    'measure-meadow',
    'opposites-attic',
    'number-run',
    'science-lab',
    'memory-cove',
    'bedtime',
    'pet-playground',
    'story-cinema',
    'avatar-studio',
    'encyclopedia',
    'showdown-card',
    'welcome-quest',
  ];
  for (const g of games) {
    it(`${g} default-exports a component`, async () => {
      const m = await import(`@/components/kid/${g}`);
      expect(typeof m.default).toBe('function');
    });
  }
});
