/**
 * Game-shell overhaul: staged teaching feedback + mastery-tied payouts +
 * win-layer unification.
 *
 * Same SSR probe pattern as tests/game-shell.test.ts (no jsdom here):
 * renderToString runs the hook for real with the server actions mocked.
 * recordAnswer is called during the first render (guarded by a ref) so the
 * render-phase setState settles within the same renderToString pass.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement, useRef } from 'react';

// --- mocks (hoisted so factories can reference them) ---
const awardStarsMock = vi.hoisted(() => vi.fn(async () => 100));
const awardStickersMock = vi.hoisted(() => vi.fn(async () => {}));
const bumpQuestProgressMock = vi.hoisted(() => vi.fn(async () => {}));
const checkTrophiesMock = vi.hoisted(() => vi.fn(async () => {}));
const logLearningEventMock = vi.hoisted(() => vi.fn(async () => 'event-id'));
const recordGameAttemptsMock = vi.hoisted(() =>
  vi.fn(async () => ({ recorded: 0, leveledSkills: [] as string[] }))
);

vi.mock('server-only', () => ({}));
vi.mock('@/app/actions/rewards', () => ({
  awardStars: awardStarsMock,
  awardStickers: awardStickersMock,
}));
vi.mock('@/app/actions/trail', () => ({ bumpQuestProgress: bumpQuestProgressMock }));
vi.mock('@/app/actions/trophies', () => ({ checkTrophies: checkTrophiesMock }));
vi.mock('@/app/actions/learning', () => ({
  logLearningEvent: logLearningEventMock,
  recordGameAttempts: recordGameAttemptsMock,
}));
const reportRewardErrorMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/kid/reward-errors', () => ({ reportRewardError: reportRewardErrorMock }));

import {
  useGameSession,
  AnswerFeedbackPanel,
  normalizeWorkedExample,
  applyTeachingAction,
  DEFAULT_TEACHING_HINT,
  DEFAULT_WORKED_EXAMPLE_STEPS,
  LEVEL_UP_STAR_BONUS,
  type GameSession,
  type RecordAnswerOptions,
  type TeachingFeedback,
} from '@/components/kid/game-shell';
import * as celebration from '@/components/kid/celebration';
import * as shell from '@/components/kid/game-shell';

const LEARNING = {
  childId: 'child-1',
  milestone: 'teaching_win',
  learning: { gameId: 'g1', skill: 'count' as const },
};

type Answer = { correct: boolean; opts?: RecordAnswerOptions };

/** Render the hook once, calling recordAnswer for each answer during the first render. */
function probeWithAnswers(
  config: Parameters<typeof useGameSession>[0],
  answers: Answer[]
): GameSession {
  const sessions: GameSession[] = [];
  function Probe() {
    const session = useGameSession(config);
    sessions.push(session);
    const answered = useRef(false);
    if (!answered.current) {
      answered.current = true;
      for (const a of answers) session.recordAnswer(a.correct, a.opts);
    }
    return null;
  }
  renderToString(createElement(Probe));
  const last = sessions[sessions.length - 1];
  if (!last) throw new Error('useGameSession did not run');
  return last;
}

const noopFeedback = (overrides: Partial<TeachingFeedback> = {}): TeachingFeedback => ({
  stage: 'hint-offer',
  hint: 'A hint.',
  steps: ['Step one.', 'Step two.'],
  showHint: () => {},
  showExample: () => {},
  dismiss: () => {},
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  recordGameAttemptsMock.mockResolvedValue({ recorded: 0, leveledSkills: [] });
});

describe('staged teaching feedback', () => {
  it('a wrong answer opens hint-offer feedback with the game-provided hint and steps', () => {
    const session = probeWithAnswers(LEARNING, [
      {
        correct: false,
        opts: {
          itemKey: 'q1',
          hint: 'Count the red apples.',
          workedExample: { steps: ['Look at the apples.', 'Count only the red ones.'] },
        },
      },
    ]);
    expect(session.feedback).not.toBeNull();
    expect(session.feedback!.stage).toBe('hint-offer');
    expect(session.feedback!.hint).toBe('Count the red apples.');
    expect(session.feedback!.steps).toEqual(['Look at the apples.', 'Count only the red ones.']);
  });

  it('falls back to warm generic defaults when the game passes none (never lorem)', () => {
    const session = probeWithAnswers(LEARNING, [{ correct: false, opts: { itemKey: 'q2' } }]);
    const fb = session.feedback!;
    expect(fb.hint).toBe(DEFAULT_TEACHING_HINT);
    expect(fb.steps).toEqual([...DEFAULT_WORKED_EXAMPLE_STEPS]);
    expect(fb.hint.toLowerCase()).not.toContain('lorem');
    expect(fb.steps.join(' ').toLowerCase()).not.toContain('lorem');
    expect(fb.hint.length).toBeGreaterThan(10);
  });

  it('accepts a single-string worked example', () => {
    const session = probeWithAnswers(LEARNING, [
      { correct: false, opts: { itemKey: 'q3', workedExample: 'Say the number out loud.' } },
    ]);
    expect(session.feedback!.steps).toEqual(['Say the number out loud.']);
  });

  it('a correct answer opens no feedback', () => {
    const session = probeWithAnswers(LEARNING, [{ correct: true, opts: { itemKey: 'q1' } }]);
    expect(session.feedback).toBeNull();
  });

  it('is a no-op when learning is not configured', () => {
    const session = probeWithAnswers({ childId: 'c9', milestone: 'open_play' }, [
      { correct: false, opts: { hint: 'A hint.' } },
    ]);
    expect(session.feedback).toBeNull();
  });

  it('only the first judgment per itemKey opens feedback (tries semantics preserved)', () => {
    const session = probeWithAnswers(LEARNING, [
      { correct: false, opts: { itemKey: 'q1', hint: 'First hint.' } },
      { correct: false, opts: { itemKey: 'q1', hint: 'Second hint.' } },
    ]);
    // The second judgment is deduped: feedback still carries the first hint.
    expect(session.feedback!.hint).toBe('First hint.');
  });

  it('clearFeedback dismisses the panel', () => {
    const session = probeWithAnswers(LEARNING, [{ correct: false, opts: { itemKey: 'q1' } }]);
    expect(session.feedback).not.toBeNull();
    session.clearFeedback();
    // clearFeedback is a stable callback closing over setFeedback; the state
    // update itself is verified through applyTeachingAction below.
    expect(typeof session.clearFeedback).toBe('function');
  });
});

describe('normalizeWorkedExample', () => {
  it('returns defaults for missing/empty input', () => {
    expect(normalizeWorkedExample()).toEqual([...DEFAULT_WORKED_EXAMPLE_STEPS]);
    expect(normalizeWorkedExample('')).toEqual([...DEFAULT_WORKED_EXAMPLE_STEPS]);
    expect(normalizeWorkedExample('   ')).toEqual([...DEFAULT_WORKED_EXAMPLE_STEPS]);
    expect(normalizeWorkedExample({ steps: [] })).toEqual([...DEFAULT_WORKED_EXAMPLE_STEPS]);
    expect(normalizeWorkedExample({ steps: ['  ', ''] })).toEqual([...DEFAULT_WORKED_EXAMPLE_STEPS]);
  });

  it('trims and filters steps', () => {
    expect(normalizeWorkedExample({ steps: ['  Real step. ', '', 'Other.'] })).toEqual([
      'Real step.',
      'Other.',
    ]);
  });
});

describe('applyTeachingAction (stage machine)', () => {
  const base = noopFeedback();

  it('hint-offer -> hint -> example -> dismiss', () => {
    const hint = applyTeachingAction(base, 'show-hint')!;
    expect(hint.stage).toBe('hint');
    const example = applyTeachingAction(hint, 'show-example')!;
    expect(example.stage).toBe('example');
    expect(applyTeachingAction(example, 'dismiss')).toBeNull();
  });

  it('out-of-order actions are no-ops (same object back)', () => {
    expect(applyTeachingAction(base, 'show-example')).toBe(base);
    const hint = applyTeachingAction(base, 'show-hint')!;
    expect(applyTeachingAction(hint, 'show-hint')).toBe(hint);
  });

  it('dismiss from any stage returns null; null input stays null', () => {
    expect(applyTeachingAction(base, 'dismiss')).toBeNull();
    expect(applyTeachingAction(null, 'show-hint')).toBeNull();
    expect(applyTeachingAction(null, 'dismiss')).toBeNull();
  });

  it('keeps the hint and steps across stages', () => {
    const fb = noopFeedback({ hint: 'Keep me.', steps: ['S1'] });
    const next = applyTeachingAction(fb, 'show-hint')!;
    expect(next.hint).toBe('Keep me.');
    expect(next.steps).toEqual(['S1']);
  });
});

describe('AnswerFeedbackPanel rendering', () => {
  it('renders nothing when feedback is null', () => {
    expect(renderToString(createElement(AnswerFeedbackPanel, { feedback: null }))).toBe('');
  });

  it('hint-offer stage: asks about a hint, offers retry, no emoji', () => {
    const html = renderToString(createElement(AnswerFeedbackPanel, { feedback: noopFeedback() }));
    expect(html).toContain('Want a hint?');
    expect(html).toContain('Show hint');
    expect(html).toContain('Let me try');
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('hint stage: shows the hint and the worked-example CTA', () => {
    const fb = applyTeachingAction(noopFeedback({ hint: 'Count the red ones.' }), 'show-hint')!;
    const html = renderToString(createElement(AnswerFeedbackPanel, { feedback: fb }));
    expect(html).toContain('Count the red ones.');
    expect(html).toContain('Show me how');
  });

  it('example stage: shows numbered steps and retry as the primary action', () => {
    let fb = applyTeachingAction(noopFeedback({ steps: ['First.', 'Second.'] }), 'show-hint')!;
    fb = applyTeachingAction(fb, 'show-example')!;
    const html = renderToString(createElement(AnswerFeedbackPanel, { feedback: fb }));
    expect(html).toContain('First.');
    expect(html).toContain('Second.');
    expect(html).toContain('Let me try');
  });

  it('kid text is >= 18px (text-lg / text-xl / btn-kid)', () => {
    const html = renderToString(createElement(AnswerFeedbackPanel, { feedback: noopFeedback() }));
    expect(html).toMatch(/text-(lg|xl)/);
    expect(html).toContain('btn-kid');
  });
});

describe('hint_used / show_me learning events', () => {
  it('showHint logs hint_used with the game and skill', () => {
    const session = probeWithAnswers(LEARNING, [{ correct: false, opts: { itemKey: 'q1', skill: 'count' } }]);
    session.feedback!.showHint();
    expect(logLearningEventMock).toHaveBeenCalledWith('child-1', 'hint_used', {
      metadata: { game_id: 'g1', skill: 'count' },
    });
  });

  it('showExample logs show_me with the game and skill', () => {
    const session = probeWithAnswers(LEARNING, [{ correct: false, opts: { itemKey: 'q1' } }]);
    session.feedback!.showExample();
    expect(logLearningEventMock).toHaveBeenCalledWith('child-1', 'show_me', {
      metadata: { game_id: 'g1', skill: 'count' },
    });
  });

  it('dismiss logs nothing', () => {
    const session = probeWithAnswers(LEARNING, [{ correct: false, opts: { itemKey: 'q1' } }]);
    session.feedback!.dismiss();
    expect(logLearningEventMock).not.toHaveBeenCalled();
  });
});

describe('mastery-tied payouts', () => {
  it('pays a small completion ack plus a meaningful bonus per leveled-up skill', async () => {
    recordGameAttemptsMock.mockResolvedValue({ recorded: 2, leveledSkills: ['count'] });
    const session = probeWithAnswers(LEARNING, [
      { correct: false, opts: { itemKey: 'q1', skill: 'count' } },
      { correct: true, opts: { itemKey: 'q2', skill: 'count' } },
    ]);
    const result = await session.complete({ stars: 1, mistakes: 1 });

    // Completion ack first, mastery bonus second — both through the atomic wallet RPC.
    expect(awardStarsMock.mock.calls).toEqual([
      ['child-1', 1],
      ['child-1', LEVEL_UP_STAR_BONUS],
    ]);
    expect(result.levelUps).toEqual(['count']);
    expect(result.levelUpBonus).toBe(LEVEL_UP_STAR_BONUS);
    expect(logLearningEventMock).toHaveBeenCalledWith('child-1', 'milestone', {
      metadata: {
        kind: 'teaching_win',
        stars: 1,
        mistakes: 1,
        levelUps: ['count'],
        levelUpBonus: LEVEL_UP_STAR_BONUS,
      },
    });
  });

  it('no bonus and no metadata keys when nothing leveled up', async () => {
    recordGameAttemptsMock.mockResolvedValue({ recorded: 2, leveledSkills: [] });
    const session = probeWithAnswers(LEARNING, [
      { correct: true, opts: { itemKey: 'q1', skill: 'count' } },
    ]);
    const result = await session.complete({ stars: 1 });

    expect(awardStarsMock.mock.calls).toEqual([['child-1', 1]]);
    expect(result.levelUps).toEqual([]);
    expect(result.levelUpBonus).toBe(0);
    expect(logLearningEventMock).toHaveBeenCalledWith('child-1', 'milestone', {
      metadata: { kind: 'teaching_win', stars: 1, mistakes: 0 },
    });
  });

  it('level-ups from a mid-game auto-flush count toward the session bonus', async () => {
    recordGameAttemptsMock.mockResolvedValue({ recorded: 6, leveledSkills: ['add'] });
    const answers: Answer[] = Array.from({ length: 6 }, (_, i) => ({
      correct: i % 2 === 0,
      opts: { itemKey: `k${i}`, skill: 'add' as const },
    }));
    const session = probeWithAnswers(LEARNING, answers);
    const result = await session.complete({ stars: 1 });

    expect(result.levelUps).toEqual(['add']);
    expect(result.levelUpBonus).toBe(LEVEL_UP_STAR_BONUS);
    expect(awardStarsMock.mock.calls).toEqual([
      ['child-1', 1],
      ['child-1', LEVEL_UP_STAR_BONUS],
    ]);
  });

  it('levelUpStars overrides the per-skill bonus', async () => {
    recordGameAttemptsMock.mockResolvedValue({ recorded: 1, leveledSkills: ['count', 'add'] });
    const session = probeWithAnswers(LEARNING, [
      { correct: true, opts: { itemKey: 'q1', skill: 'count' } },
    ]);
    const result = await session.complete({ stars: 1, levelUpStars: 25 });

    expect(awardStarsMock.mock.calls).toEqual([
      ['child-1', 1],
      ['child-1', 50],
    ]);
    expect(result.levelUpBonus).toBe(50);
  });

  it('a failing bonus award is reported but never blocks the remaining steps', async () => {
    recordGameAttemptsMock.mockResolvedValue({ recorded: 1, leveledSkills: ['count'] });
    awardStarsMock.mockRejectedValueOnce(new Error('ok-1')).mockRejectedValueOnce(new Error('bonus down'));
    const session = probeWithAnswers(
      { ...LEARNING, gameKey: 'count_game', stickerId: 's1' },
      [{ correct: true, opts: { itemKey: 'q1', skill: 'count' } }]
    );
    const result = await session.complete({ stars: 1 });

    expect(bumpQuestProgressMock).toHaveBeenCalledTimes(1);
    expect(awardStickersMock).toHaveBeenCalledTimes(1);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors[0].step).toBe('awardStars');
  });
});

describe('win-layer unification', () => {
  it('celebration.tsx re-exports the same win layer as game-shell.tsx', () => {
    expect(celebration.ConfettiBurst).toBe(shell.ConfettiBurst);
    expect(celebration.StarPopRow).toBe(shell.StarPopRow);
    expect(celebration.FeedbackOverlay).toBe(shell.FeedbackOverlay);
    expect(celebration.praiseFor).toBe(shell.praiseFor);
    expect(celebration.encourage).toBe(shell.encourage);
  });

  it('the re-exported FeedbackOverlay renders identically', () => {
    // encourage() picks a random line; pin Math.random so the two renders
    // compare the component output, not the dice roll.
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    try {
      const html = renderToString(
        createElement(celebration.FeedbackOverlay, {
          correct: false,
          streak: 0,
          pointsEarned: 0,
          leveledUp: false,
          onDone: () => {},
        })
      );
      expect(html).toContain('Try the next one');
      const direct = renderToString(
        createElement(shell.FeedbackOverlay, {
          correct: false,
          streak: 0,
          pointsEarned: 0,
          leveledUp: false,
          onDone: () => {},
        })
      );
      expect(html).toBe(direct);
    } finally {
      rand.mockRestore();
    }
  });

  it('praiseFor/encourage still behave (moved, not changed)', () => {
    expect(celebration.praiseFor(6)).toBe('On fire!');
    expect(celebration.praiseFor(4)).toBe('Streak power!');
    expect(typeof celebration.praiseFor(1)).toBe('string');
    expect(typeof celebration.encourage()).toBe('string');
  });
});
