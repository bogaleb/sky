// @vitest-environment jsdom
/**
 * Wave 10 — grading-failure retry (behavior tests).
 *
 * Renders the real ActivityStage in jsdom, rejects the submit promise, and
 * asserts the recovery contract through the DOM: the kid gets a spoken
 * host-character line, a non-reader-friendly alert (no emoji, one big
 * button), and "Try again" resubmits the remembered answer. Answer controls
 * stay live so a different option can be chosen instead.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';

import ActivityStage from '@/components/kid/activity-stage';
import type { AttemptResult, PlannedStep } from '@/lib/kid/types';
import { speakAs } from '@/lib/kid/audio';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/kid/audio', () => ({
  speak: vi.fn(),
  speakAs: vi.fn(),
  playSfx: vi.fn(),
  stopSpeaking: vi.fn(),
}));

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

function makeStep(overrides: Partial<PlannedStep> = {}): PlannedStep {
  return {
    activityId: 'a1',
    kind: 'multiple_choice',
    reason: 'review',
    targetLevel: 1,
    points: 5,
    card: {
      prompt_text: 'Which one is red?',
      card: {
        options: [
          { id: 'o1', label: 'Red' },
          { id: 'o2', label: 'Blue' },
        ],
      },
    } as never,
    skillName: 'colors',
    subjectCode: 'science',
    subjectName: 'Science',
    islandName: 'Isle',
    hostCharacter: 'curio',
    ...overrides,
  };
}

const okResult: AttemptResult = {
  correct: true,
  pointsEarned: 5,
  streak: 1,
  status: 'ok',
  currentLevel: 1,
  leveledUp: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('grading failure retry', () => {
  it('shows a non-reader-friendly alert when grading rejects', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {
      throw new Error('rpc down');
    });
    render(
      createElement(ActivityStage, {
        step: makeStep(),
        onSubmit,
        onComplete: () => {},
        onMood: () => {},
      })
    );

    await user.click(screen.getByRole('button', { name: 'Answer: Red' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Oops! My star-mail got tangled!');
    expect(alert).toHaveTextContent("That answer never made it to the sky. Let's send it one more time.");
    // Assertive so screen readers announce it immediately.
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    // One big chunky button — non-readers get a single obvious target.
    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(retry.className).toContain('btn-kid');
    // No emoji anywhere in the recovery UI (non-reader friendly).
    expect(EMOJI_RE.test(alert.textContent ?? '')).toBe(false);
  });

  it('announces the failure in the host character voice', async () => {
    const user = userEvent.setup();
    render(
      createElement(ActivityStage, {
        step: makeStep({ hostCharacter: 'curio' }),
        onSubmit: vi.fn(async () => {
          throw new Error('rpc down');
        }),
        onComplete: () => {},
        onMood: () => {},
      })
    );

    await user.click(screen.getByRole('button', { name: 'Answer: Blue' }));
    await screen.findByRole('alert');

    expect(speakAs).toHaveBeenCalledWith(
      'curio',
      expect.stringContaining('Tap the big button')
    );
  });

  it('retry resubmits the remembered answer', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn<(activityId: string, answer: unknown, latencyMs: number) => Promise<AttemptResult>>()
      .mockRejectedValueOnce(new Error('rpc down'))
      .mockResolvedValueOnce(okResult);
    render(
      createElement(ActivityStage, {
        step: makeStep(),
        onSubmit,
        onComplete: () => {},
        onMood: () => {},
      })
    );

    await user.click(screen.getByRole('button', { name: 'Answer: Red' }));
    await screen.findByRole('alert');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][1]).toEqual({ choice: 'o1' });

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][1]).toEqual({ choice: 'o1' });
    // The retry UI clears once the resubmission resolves.
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    );
  });

  it('keeps answer controls live in retry state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {
      throw new Error('rpc down');
    });
    render(
      createElement(ActivityStage, {
        step: makeStep(),
        onSubmit,
        onComplete: () => {},
        onMood: () => {},
      })
    );

    await user.click(screen.getByRole('button', { name: 'Answer: Red' }));
    await screen.findByRole('alert');

    const blue = screen.getByRole('button', { name: 'Answer: Blue' });
    expect(blue.hasAttribute('disabled')).toBe(false);
    expect(blue.hasAttribute('aria-disabled')).toBe(false);
    // The kid's picked answer stays visibly pressed (scale-110 feedback).
    const red = screen.getByRole('button', { name: 'Answer: Red' });
    expect(red.className).toContain('scale-110');
  });

  it('a new activity clears the retry state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {
      throw new Error('rpc down');
    });
    const { rerender } = render(
      createElement(ActivityStage, {
        step: makeStep({ activityId: 'a1' }),
        onSubmit,
        onComplete: () => {},
        onMood: () => {},
      })
    );

    await user.click(screen.getByRole('button', { name: 'Answer: Red' }));
    await screen.findByRole('alert');

    await act(async () => {
      rerender(
        createElement(ActivityStage, {
          step: makeStep({ activityId: 'a2' }),
          onSubmit,
          onComplete: () => {},
          onMood: () => {},
        })
      );
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows no retry UI on a successful submit', async () => {
    const user = userEvent.setup();
    render(
      createElement(ActivityStage, {
        step: makeStep(),
        onSubmit: vi.fn(async () => okResult),
        onComplete: () => {},
        onMood: () => {},
      })
    );

    await user.click(screen.getByRole('button', { name: 'Answer: Red' }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
