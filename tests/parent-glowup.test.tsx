// @vitest-environment jsdom
/**
 * Wave 9 parent zone glow-up: the parent side adopts the Wave 8 design-system
 * contract (font-display, glass-kid, btn-kid, card-kid, SkyBackdrop) in a
 * parent-appropriate way, while every flow stays byte-identical:
 * PIN gate logic, auth server actions, profile one-tap flow, dashboard
 * section order. No emoji on any parent surface.
 *
 * The old tests grepped component source for class names and copy. These
 * tests render the real components and assert on the DOM: the classes are
 * really applied, the backdrop really renders once, the flows really work.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';

vi.mock('server-only', () => ({}));
vi.mock('@/app/actions/showdown', () => ({
  getFamilyLeaderboard: vi.fn(async () => [
    { childId: 'c1', nickname: 'Ada', avatarId: 'fox', weeklyStars: 12, weeklyActivities: 5 },
    { childId: 'c2', nickname: 'Bo', avatarId: 'owl', weeklyStars: 8, weeklyActivities: 3 },
  ]),
}));

const EMOJI = /[🌀-🫿☀-➿⬀-⯿️]/u;

vi.mock('@/app/actions/dashboard', () => ({
  verifyParentZonePin: vi.fn(async (pin: string) => pin === '1234'),
  parentZoneUnlocked: vi.fn(async () => true),
  getDashboardData: vi.fn(async () => [
    {
      id: 'c1',
      nickname: 'Ada',
      avatarId: 'fox',
      ageBand: '5-6',
      sessions30d: 4,
      sessions7d: 2,
      stars7d: 10,
      points7d: 40,
      stickers: 3,
      subjects: [],
      recentMilestones: [],
      lastActiveAt: null,
      activities7d: 12,
      streak: 2,
      longestStreak: 5,
      questsCompleted7d: 3,
      timePlayedMinutes7d: 45,
      topSkills: [],
      skillMastery: [],
      focusSkills: [
        {
          skillName: 'Rhyming',
          subjectName: 'Reading',
          islandName: 'The Floating Library',
          currentLevel: 2,
          suggestion: 'Play rhyming games together.',
        },
      ],
    },
  ]),
  getWeeklyDigest: vi.fn(async () => ({
    weekStart: '2026-09-21',
    headline: 'Great week!',
    bullets: ['Ada practiced reading.'],
    focusAreas: [],
  })),
}));

function backdropCount(container: HTMLElement): number {
  return container.querySelectorAll(
    'div.pointer-events-none.fixed.inset-0[aria-hidden]'
  ).length;
}

function expectNoEmoji(container: HTMLElement, name: string) {
  const text = container.textContent ?? '';
  expect(text, `${name} has no emoji`).not.toMatch(EMOJI);
}

describe('parent glow-up design contract', () => {
  it('renders auth forms on the design system with no emoji', async () => {
    const AuthForm = (await import('@/components/auth-form')).default;
    for (const mode of ['login', 'signup'] as const) {
      const { container, unmount } = render(createElement(AuthForm, { mode }));
      const html = container.innerHTML;
      expect(html, `${mode} font-display`).toContain('font-display');
      expect(html, `${mode} card-kid`).toContain('card-kid');
      expect(html, `${mode} btn-kid`).toContain('btn-kid');
      expect(backdropCount(container), `${mode} backdrop once`).toBe(1);
      expectNoEmoji(container, `auth ${mode}`);
      unmount();
    }
  });

  it('renders the PIN gate on the design system with no emoji', async () => {
    const PinGate = (await import('@/components/parent/pin-gate')).default;
    const { container, unmount } = render(createElement(PinGate, { onUnlocked: () => {} }));
    const html = container.innerHTML;
    expect(html).toContain('font-display');
    expect(html).toContain('btn-kid');
    expect(backdropCount(container)).toBe(1);
    expect(container.textContent).toContain('Parent zone');
    expectNoEmoji(container, 'pin gate');
    unmount();
  });

  it('renders the dashboard on the design system with no emoji', async () => {
    const Dashboard = (await import('@/components/parent/dashboard')).default;
    const { container, unmount } = render(createElement(Dashboard, { initiallyUnlocked: true }));
    await new Promise((r) => setTimeout(r, 500));
    const html = container.innerHTML;
    expect(html).toContain('font-display');
    expect(html).toContain('card-kid');
    expect(html).toContain('btn-kid');
    expect(backdropCount(container)).toBe(1);
    expectNoEmoji(container, 'dashboard');
    unmount();
  });

  it('renders the parent widgets on the design system with no emoji', async () => {
    const WeeklyGoals = (await import('@/components/parent/weekly-goals')).default;
    const FamilyLeaderboard = (await import('@/components/parent/family-leaderboard')).default;
    const PlayCards = (await import('@/components/parent/play-cards')).default;
    const Certificate = (await import('@/components/parent/certificate')).default;

    const cases: Array<[string, React.ReactElement]> = [
      ['weekly goals', createElement(WeeklyGoals, { childId: 'c1' })],
      ['family leaderboard', createElement(FamilyLeaderboard)],
      ['play cards', createElement(PlayCards)],
      [
        'certificate',
        createElement(Certificate, { nickname: 'Ada', stats: { stars: 10, trophies: 2 } }),
      ],
    ];
    for (const [name, el] of cases) {
      const { container, unmount } = render(el);
      await new Promise((r) => setTimeout(r, 300));
      const html = container.innerHTML;
      expect(html, `${name} card-kid or btn-kid`).toMatch(/card-kid|btn-kid/);
      expectNoEmoji(container, name);
      unmount();
    }
  });
});

describe('parent flows unchanged (visual pass only)', () => {
  it('keeps the PIN gate flow, enforced server-side', async () => {
    const user = userEvent.setup();
    const onUnlocked = vi.fn();
    const { verifyParentZonePin } = await import('@/app/actions/dashboard');
    const PinGate = (await import('@/components/parent/pin-gate')).default;
    render(createElement(PinGate, { onUnlocked }));

    // Too short: the unlock button stays disabled, so no server call happens.
    await user.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByRole('button', { name: /unlock reports/i })).toBeDisabled();
    expect(verifyParentZonePin).not.toHaveBeenCalled();

    // Correct PIN: verified server-side, then unlocked.
    for (const d of ['2', '3', '4']) {
      await user.click(screen.getByRole('button', { name: d }));
    }
    await user.click(screen.getByRole('button', { name: /unlock reports/i }));
    await new Promise((r) => setTimeout(r, 200));
    expect(verifyParentZonePin).toHaveBeenCalledWith('1234');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
  });

  it('rejects a wrong PIN without unlocking', async () => {
    const user = userEvent.setup();
    const onUnlocked = vi.fn();
    const PinGate = (await import('@/components/parent/pin-gate')).default;
    render(createElement(PinGate, { onUnlocked }));
    for (const d of ['9', '9', '9', '9']) {
      await user.click(screen.getByRole('button', { name: d }));
    }
    await user.click(screen.getByRole('button', { name: /unlock reports/i }));
    await new Promise((r) => setTimeout(r, 200));
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(screen.getByText(/didn’t match/)).toBeInTheDocument();
  });

  it('keeps auth form fields and mode copy', async () => {
    const AuthForm = (await import('@/components/auth-form')).default;
    const { unmount } = render(createElement(AuthForm, { mode: 'login' }));
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(document.querySelector('input[name="password"]')).not.toBeNull();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    unmount();

    const r2 = render(createElement(AuthForm, { mode: 'signup' }));
    expect(screen.getByText('Create your parent account')).toBeInTheDocument();
    r2.unmount();
  });

  it('keeps every dashboard section in order', async () => {
    const Dashboard = (await import('@/components/parent/dashboard')).default;
    const { container, unmount } = render(createElement(Dashboard, { initiallyUnlocked: true }));
    await new Promise((r) => setTimeout(r, 1000));
    const text = container.textContent ?? '';
    const childOrder = [
      'Learning reports',
      'Weekly digest',
      'Celebrate',
      'Suggested focus',
      'Skill mastery',
      'Recent activity',
    ];
    let last = -1;
    for (const heading of childOrder) {
      const idx = text.indexOf(heading);
      expect(idx, heading).toBeGreaterThan(-1);
      expect(idx, `${heading} order`).toBeGreaterThan(last);
      last = idx;
    }
    const { getByRole } = within(container);
    expect(getByRole('link', { name: /back to profiles/i })).toBeInTheDocument();
    expect(getByRole('button', { name: /lock/i })).toBeInTheDocument();
    unmount();
  });
});
