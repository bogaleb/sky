// @vitest-environment jsdom
/**
 * Wave 11a session breakup: the old god-component session-player.tsx was
 * split into focused modules (session/phase-machine.tsx,
 * session/phase-router.tsx, session/map-view.tsx, session/moments.tsx) with
 * session-player.tsx left as a thin orchestrator.
 *
 * The old tests grepped each module's source for state declarations and
 * JSX. These tests drive the real modules instead: the real
 * useSessionMachine hook owns the state and transitions, the real
 * PhaseRouter renders every phase, and the real moments render.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createElement } from 'react';

vi.mock('server-only', () => ({}));
vi.mock('@/app/actions/rewards', () => ({
  awardStars: vi.fn(async () => 0),
  getStarBalance: vi.fn(async () => 7),
  awardStickers: vi.fn(async () => []),
  getChildStickers: vi.fn(async () => []),
}));
vi.mock('@/app/actions/trophies', () => ({ checkTrophies: vi.fn(async () => []) }));
vi.mock('@/app/actions/trail', () => ({
  getTrailState: vi.fn(async () => null),
  getTrailPlan: vi.fn(async () => []),
  completeTrailQuest: vi.fn(async () => ({})),
  recordDailyActivity: vi.fn(async () => {}),
  bumpQuestProgress: vi.fn(async () => {}),
}));
vi.mock('@/app/actions/learning', () => ({
  logLearningEvent: vi.fn(async () => {}),
  recordGameAttempts: vi.fn(async () => ({ recorded: 0, leveledSkills: [] })),
}));
vi.mock('@/app/actions/progress', () => ({ getIslandProgress: vi.fn(async () => []) }));
vi.mock('@/lib/kid/placement', () => ({ loadPlacement: vi.fn(() => null) }));

// jsdom has no media engine: video.play() returns undefined instead of a promise.
if (typeof HTMLMediaElement !== 'undefined') {
  const orig = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args: unknown[]) {
    try {
      const r = (orig as (...a: unknown[]) => unknown).apply(this, args);
      return (r && typeof (r as Promise<void>).catch === 'function'
        ? r
        : Promise.resolve()) as never;
    } catch {
      return Promise.resolve() as never;
    }
  };
}

const kidDir = join(process.cwd(), 'components', 'kid');
const sessionDir = join(kidDir, 'session');
const CHILD = { id: 'c1', nickname: 'Ada', avatarId: 'fox' };

describe('session modules exist', () => {
  it('has the four focused session modules', () => {
    for (const f of ['phase-machine.tsx', 'phase-router.tsx', 'map-view.tsx', 'moments.tsx']) {
      expect(existsSync(join(sessionDir, f)), f).toBe(true);
    }
  });
});

describe('thin orchestrator', () => {
  it('stays small: the god component is gone', () => {
    const lines = readFileSync(join(kidDir, 'session-player.tsx'), 'utf8').split('\n').length;
    expect(lines).toBeLessThan(120);
  });

  it('keeps the public API: SessionPlayerProps + default export', async () => {
    const mod = await import('@/components/kid/session-player');
    expect(typeof mod.default).toBe('function');
  });

  it('renders the shell, splash, and router composition', async () => {
    const SessionPlayer = (await import('@/components/kid/session-player')).default;
    render(
      createElement(SessionPlayer, {
        child: CHILD,
        steps: [],
        sessionId: 's1',
        onExit: () => {},
        onReplay: () => {},
      })
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    // The intro moment renders inside the KidShell via the PhaseRouter.
    expect(screen.getByRole('button', { name: /let's fly/i })).toBeInTheDocument();
  });

  it('keeps deck-client on the same import', () => {
    const deck = readFileSync(join(kidDir, 'deck-client.tsx'), 'utf8');
    expect(deck).toContain("import SessionPlayer from '@/components/kid/session-player'");
  });
});

describe('phase machine', () => {
  async function renderMachine() {
    const { useSessionMachine } = await import('@/components/kid/session/phase-machine');
    const ref: { current: ReturnType<typeof useSessionMachine> | null } = { current: null };
    function Harness() {
      ref.current = useSessionMachine({ child: CHILD, steps: [], sessionId: 's1', onExit: () => {} });
      return createElement('span', { 'data-testid': 'm' }, ref.current.phase);
    }
    render(createElement(Harness));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    if (!ref.current) throw new Error('machine did not render');
    const get = () => {
      if (!ref.current) throw new Error('machine lost');
      return ref.current;
    };
    return get;
  }

  it('owns every piece of former god-component state', async () => {
    const get = await renderMachine();
    const machine = get();
    expect(machine.phase).toBe('intro');
    for (const key of [
      'openGame',
      'parkTab',
      'trailState',
      'stickerIds',
      'newTrophies',
      'walletBalance',
      'stars',
      'points',
      'activeSteps',
    ]) {
      expect(machine, key).toHaveProperty(key);
    }
    for (const fn of [
      'requestOpenGame',
      'setOpenGame',
      'setParkTab',
      'handleSubmit',
      'handleComplete',
      'startIslandSession',
      'startTrailQuest',
      'backToMap',
    ]) {
      expect(typeof (machine as Record<string, unknown>)[fn], fn).toBe('function');
    }
  });

  it('runs the seven-phase lifecycle', async () => {
    const get = await renderMachine();
    for (const phase of ['map', 'islandIntro', 'trailIntro', 'playing', 'complete', 'goodbye'] as const) {
      await act(async () => {
        get().setPhase(phase);
      });
      expect(get().phase).toBe(phase);
    }
    await act(async () => {
      get().backToMap();
    });
    expect(get().phase).toBe('map');
  });

  it('opens and closes games through the single openGame state', async () => {
    const get = await renderMachine();
    await act(async () => {
      await get().requestOpenGame('words');
    });
    expect(get().openGame).toBe('words');
    await act(async () => {
      get().setOpenGame(null);
    });
    expect(get().openGame).toBeNull();
  });

  it('loads wallet, island progress, and trail state when the map shows', async () => {
    const rewards = await import('@/app/actions/rewards');
    const islands = await import('@/app/actions/progress');
    const trail = await import('@/app/actions/trail');
    const placement = await import('@/lib/kid/placement');
    const get = await renderMachine();
    await act(async () => {
      get().setPhase('map');
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(rewards.getStarBalance).toHaveBeenCalledWith('c1');
    expect(islands.getIslandProgress).toHaveBeenCalledWith('c1');
    expect(trail.getTrailState).toHaveBeenCalledWith('c1');
    expect(placement.loadPlacement).toHaveBeenCalled();
  });
});

describe('phase router', () => {
  function fakeMachine(overrides: Record<string, unknown> = {}) {
    const noop = () => {};
    return {
      child: CHILD,
      sessionId: 's1',
      onExit: noop,
      phase: 'map',
      setPhase: vi.fn(),
      points: 0,
      stars: 0,
      mood: null,
      setMood: vi.fn(),
      island: null,
      loadingIsland: false,
      novaComfort: false,
      showTryAgain: false,
      setShowTryAgain: vi.fn(),
      stickerIds: [],
      setStickerIds: vi.fn(),
      showStickers: false,
      setShowStickers: vi.fn(),
      newStickers: [],
      newTrophies: [],
      setNewTrophies: vi.fn(),
      activeSong: null,
      setActiveSong: vi.fn(),
      activeStory: null,
      setActiveStory: vi.fn(),
      pickingLibrary: null,
      setPickingLibrary: vi.fn(),
      trailStop: null,
      questOutro: null,
      showWelcome: false,
      setShowWelcome: vi.fn(),
      talkWith: null,
      setTalkWith: vi.fn(),
      activeSteps: [],
      step: null,
      handleSubmit: vi.fn(),
      handleComplete: vi.fn(),
      beginPlaying: vi.fn(),
      backToMap: vi.fn(),
      islandProgress: {},
      parkTab: 'reading',
      setParkTab: vi.fn(),
      requestOpenGame: vi.fn(),
      startIslandSession: vi.fn(),
      startTrailQuest: vi.fn(),
      startingQuest: false,
      trailState: null,
      nickname: 'Ada',
      ...overrides,
    };
  }

  it('renders the intro phase', async () => {
    const PhaseRouter = (await import('@/components/kid/session/phase-router')).default;
    const { unmount } = render(
      createElement(PhaseRouter, { machine: fakeMachine({ phase: 'intro' }) as never })
    );
    expect(screen.getByRole('button', { name: /let's fly/i })).toBeInTheDocument();
    unmount();
  });

  it('renders the map phase', async () => {
    const PhaseRouter = (await import('@/components/kid/session/phase-router')).default;
    const { unmount } = render(
      createElement(PhaseRouter, { machine: fakeMachine({ phase: 'map' }) as never })
    );
    expect(screen.getByRole('region', { name: 'Up next for you' })).toBeInTheDocument();
    unmount();
  });

  it('renders the island intro phase', async () => {
    const PhaseRouter = (await import('@/components/kid/session/phase-router')).default;
    const { getIsland } = await import('@/lib/kid/islands');
    const { unmount } = render(
      createElement(PhaseRouter, {
        machine: fakeMachine({ phase: 'islandIntro', island: getIsland('reading') }) as never,
      })
    );
    expect(screen.getByText('The Floating Library')).toBeInTheDocument();
    unmount();
  });

  it('renders the trail intro phase', async () => {
    const PhaseRouter = (await import('@/components/kid/session/phase-router')).default;
    const { getTrailStop } = await import('@/lib/kid/trail');
    const { unmount } = render(
      createElement(PhaseRouter, {
        machine: fakeMachine({ phase: 'trailIntro', trailStop: getTrailStop(0) }) as never,
      })
    );
    expect(screen.getByRole('button', { name: /start|go/i })).toBeInTheDocument();
    unmount();
  });

  it('renders the complete phase with celebration', async () => {
    const PhaseRouter = (await import('@/components/kid/session/phase-router')).default;
    const { unmount, container } = render(
      createElement(PhaseRouter, {
        machine: fakeMachine({ phase: 'complete', stars: 3, points: 10 }) as never,
      })
    );
    const confetti = container.querySelector('.kid-confetti');
    expect(confetti, 'confetti burst on the win layer').not.toBeNull();
    expect(confetti!.childElementCount).toBeGreaterThanOrEqual(90);
    unmount();
  });

  it('renders the goodbye phase', async () => {
    const PhaseRouter = (await import('@/components/kid/session/phase-router')).default;
    const { unmount } = render(
      createElement(PhaseRouter, { machine: fakeMachine({ phase: 'goodbye' }) as never })
    );
    expect(screen.getByText(/goodbye|see you/i)).toBeInTheDocument();
    unmount();
  });
});

describe('moments', () => {
  it('renders the four cinematic views', async () => {
    const { Intro, IslandIntro, Complete, Goodbye } = await import('@/components/kid/session/moments');
    const { getIsland } = await import('@/lib/kid/islands');
    const noop = () => {};

    const r1 = render(createElement(Intro, { child: CHILD, onStart: noop }));
    expect(screen.getByRole('button', { name: /let's fly/i })).toBeInTheDocument();
    r1.unmount();

    const r2 = render(
      createElement(IslandIntro, { island: getIsland('music'), child: CHILD, onStart: noop })
    );
    expect(r2.container.textContent).toContain('Riff');
    r2.unmount();

    const r3 = render(
      createElement(Complete, {
        child: CHILD,
        stars: 3,
        points: 10,
        newStickers: [],
        questOutro: null,
        onReplay: noop,
        onExit: noop,
      })
    );
    expect(r3.container.querySelector('.kid-confetti')).not.toBeNull();
    r3.unmount();

    const r4 = render(createElement(Goodbye, { child: CHILD, onDone: noop }));
    expect(r4.container.textContent?.length).toBeGreaterThan(0);
    r4.unmount();
  });
});

describe('motion budget', () => {
  it('allows at most one gentle ambient looping animation across the new views', async () => {
    // The Complete avatar bob is the single pre-existing ambient loop.
    const { Intro, IslandIntro, Complete, Goodbye } = await import('@/components/kid/session/moments');
    const { getIsland } = await import('@/lib/kid/islands');
    const noop = () => {};
    const island = getIsland('reading');
    const { container } = render(
      createElement(
        'div',
        null,
        createElement(Intro, { child: CHILD, onStart: noop }),
        createElement(IslandIntro, { island, child: CHILD, onStart: noop }),
        createElement(Complete, {
          child: CHILD,
          stars: 3,
          points: 10,
          newStickers: [],
          questOutro: null,
          onReplay: noop,
          onExit: noop,
        }),
        createElement(Goodbye, { child: CHILD, onDone: noop })
      )
    );
    const bobs = container.querySelectorAll('.animate-kid-bob').length;
    expect(bobs).toBeLessThanOrEqual(1);
    // Entrances and pop-ins are purposeful feedback, not ambient loops.
    expect(container.querySelectorAll('.animate-kid-rise').length).toBeGreaterThan(0);
  });
});
