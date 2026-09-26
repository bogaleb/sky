// @vitest-environment jsdom
/**
 * Wave 11a — the three kid progress systems (Adventure Trail, daily quests,
 * parent weekly goals) render through ONE shared UI primitive,
 * components/kid/progress-rail.tsx.
 *
 * These tests render the real components and assert the consolidation
 * through the DOM: accessible progressbars, the rail item contract (label /
 * meta / detail / art / badge / CTA), null-safety, and the kid-surface
 * hygiene rules (>=18px text, no emoji).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';

import ProgressRail, { type ProgressRailItem } from '@/components/kid/progress-rail';
import TrailBanner from '@/components/kid/trail-banner';
import GoalMeter from '@/components/kid/goal-meter';
import { getTrailStop } from '@/lib/kid/trail';
import type { TrailState } from '@/app/actions/trail';
import { getGoalProgress } from '@/app/actions/goals';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/kid/audio', () => ({
  speak: vi.fn(),
  speakAs: vi.fn(),
  playSfx: vi.fn(),
  stopSpeaking: vi.fn(),
}));
vi.mock('@/app/actions/goals', () => ({ getGoalProgress: vi.fn() }));

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
const SMALL_TEXT = /text-(xs|sm|base)\b/;

function stubTrail(): TrailState {
  return {
    position: 5,
    questsCompleted: 2,
    totalStops: 20,
    questNo: 3,
    chapter: 'Chapter 1',
    stop: getTrailStop(5),
    streak: 4,
    quests: [
      {
        id: 'q1',
        title: 'Read 3 stories',
        detail: 'Cozy reading time',
        goal: 3,
        unit: 'stories',
        stars: 5,
        progress: 1,
        completed: false,
      },
      {
        id: 'q2',
        title: 'Play 2 games',
        detail: 'Any game counts',
        goal: 2,
        unit: 'games',
        stars: 5,
        progress: 2,
        completed: true,
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProgressRail primitive', () => {
  it('renders accessible progressbars with the item contract', () => {
    const items: ProgressRailItem[] = [
      {
        id: 'a',
        label: 'Trail progress',
        progress: 0.25,
        meta: '25%',
        detail: 'Quest 3 of 20',
        cta: { label: 'Start Quest 3!', onClick: () => {} },
      },
      {
        id: 'b',
        label: 'Weekly star jar',
        progress: 0.6,
        meta: '3/5',
        badge: createElement('span', null, 'badge'),
      },
    ];
    const { container } = render(
      createElement(ProgressRail, { items, label: 'Progress' })
    );

    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute('aria-label', 'Trail progress');
    expect(bars[0]).toHaveAttribute('aria-valuenow', '25');
    expect(bars[1]).toHaveAttribute('aria-valuenow', '60');
    // The fill is purposeful feedback: animated, not ambient.
    expect(container.querySelector('.duration-700')).not.toBeNull();
    expect(screen.getByText('Trail progress')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Quest 3 of 20')).toBeInTheDocument();
    expect(screen.getByText('badge')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start Quest 3!' })
    ).toBeInTheDocument();
  });

  it('clamps progress fractions to 0–100', () => {
    render(
      createElement(ProgressRail, {
        label: 'x',
        items: [
          { id: 'over', label: 'Over', progress: 1.5 },
          { id: 'under', label: 'Under', progress: -0.5 },
        ],
      })
    );
    expect(screen.getByRole('progressbar', { name: 'Over' })).toHaveAttribute(
      'aria-valuenow',
      '100'
    );
    expect(screen.getByRole('progressbar', { name: 'Under' })).toHaveAttribute(
      'aria-valuenow',
      '0'
    );
  });

  it('fires the CTA and shows the busy label while disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      createElement(ProgressRail, {
        label: 'x',
        items: [{ id: 'c', label: 'Go', progress: 0.1, cta: { label: 'Go!', onClick } }],
      })
    );
    await user.click(screen.getByRole('button', { name: 'Go!' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      createElement(ProgressRail, {
        label: 'x',
        items: [
          {
            id: 'c',
            label: 'Go',
            progress: 0.1,
            cta: { label: 'Go!', busyLabel: 'Working…', disabled: true, onClick },
          },
        ],
      })
    );
    const btn = screen.getByRole('button', { name: 'Working…' });
    expect(btn).toBeDisabled();
  });

  it('renders nothing for an empty item list', () => {
    const { container } = render(createElement(ProgressRail, { label: 'x', items: [] }));
    expect(container.innerHTML).toBe('');
  });
});

describe('TrailBanner renders through the rail', () => {
  it('shows trail progress, the start-quest CTA, streak, and quests', async () => {
    const user = userEvent.setup();
    const onStartQuest = vi.fn();
    render(
      createElement(TrailBanner, {
        trail: stubTrail(),
        onStartQuest,
        starting: false,
      })
    );

    // Trail progress rides the shared rail item contract.
    expect(
      screen.getByRole('progressbar', { name: 'Trail progress' })
    ).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByText('Quest 3 of 20 · Chapter 1')).toBeInTheDocument();

    // The CTA starts the quest.
    await user.click(screen.getByRole('button', { name: 'Start Quest 3!' }));
    expect(onStartQuest).toHaveBeenCalledTimes(1);

    // Distinctive trail identity survives the consolidation.
    expect(screen.getByRole('img', { name: '4 day streak' })).toBeInTheDocument();
    expect(screen.getByText('Read 3 stories')).toBeInTheDocument();
    // Daily quests render through the rail too.
    expect(
      screen.getByRole('progressbar', { name: 'Read 3 stories' })
    ).toHaveAttribute('aria-valuenow', '33');
    expect(
      screen.getByRole('progressbar', { name: 'Play 2 games' })
    ).toHaveAttribute('aria-valuenow', '100');
  });

  it('disables the CTA with a busy label while starting', () => {
    render(
      createElement(TrailBanner, {
        trail: stubTrail(),
        onStartQuest: () => {},
        starting: true,
      })
    );
    expect(
      screen.getByRole('button', { name: 'Charting your course…' })
    ).toBeDisabled();
  });

  it('is null-safe', () => {
    const { container } = render(
      createElement(TrailBanner, { trail: null, onStartQuest: () => {}, starting: false })
    );
    expect(container.innerHTML).toBe('');
  });
});

describe('GoalMeter renders through the rail', () => {
  it('shows the weekly star jar when a goal exists', async () => {
    vi.mocked(getGoalProgress).mockResolvedValue({
      target: 5,
      completed: 3,
      weekStart: '2026-09-21',
      celebrated: false,
    });
    render(createElement(GoalMeter, { childId: 'c1' }));

    expect(
      await screen.findByRole('progressbar', { name: 'Weekly star jar' })
    ).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByText('3/5')).toBeInTheDocument();
    // Silent-but-polite live region for screen readers.
    expect(screen.getByLabelText(/star jar is full|more .* to fill the star jar/i)).toHaveAttribute(
      'aria-live',
      'polite'
    );
  });

  it('stays silent on error and when there is no goal', async () => {
    vi.mocked(getGoalProgress).mockResolvedValue(null as never);
    const { container, unmount } = render(createElement(GoalMeter, { childId: 'c1' }));
    await waitFor(() =>
      expect(vi.mocked(getGoalProgress)).toHaveBeenCalledWith('c1')
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(container.innerHTML).toBe('');
    unmount();

    vi.mocked(getGoalProgress).mockResolvedValue({
      target: 0,
      completed: 0,
      weekStart: '2026-09-21',
      celebrated: false,
    });
    const second = render(createElement(GoalMeter, { childId: 'c1' }));
    await new Promise((r) => setTimeout(r, 20));
    expect(second.container.innerHTML).toBe('');
    second.unmount();
  });
});

describe('kid-surface hygiene for the consolidated UI', () => {
  it('keeps rendered text at 18px+ with no emoji', async () => {
    vi.mocked(getGoalProgress).mockResolvedValue({
      target: 5,
      completed: 5,
      weekStart: '2026-09-21',
      celebrated: false,
    });
    const { container } = render(
      createElement('div', null, [
        createElement(TrailBanner, {
          key: 't',
          trail: stubTrail(),
          onStartQuest: () => {},
          starting: false,
        }),
        createElement(GoalMeter, { key: 'g', childId: 'c1' }),
      ])
    );
    await screen.findByRole('progressbar', { name: 'Weekly star jar' });

    const html = container.innerHTML;
    expect(EMOJI_RE.test(html)).toBe(false);
    // No text-xs/sm/base anywhere in the rendered class output.
    const classAttrs = [...html.matchAll(/class="([^"]*)"/g)].map((m) => m[1]);
    expect(classAttrs.length).toBeGreaterThan(0);
    for (const cls of classAttrs) {
      expect(cls).not.toMatch(SMALL_TEXT);
    }
  });
});
