// @vitest-environment jsdom
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import type { TrailState } from '@/app/actions/trail';
import {
  GAME_GROUPS,
  GAME_REGISTRY,
  GameOverlay,
  VISIBLE_GAMES,
  gamesForGroup,
  getGame,
  picksForDate,
  todaysPicks,
} from '@/components/kid/game-registry';

vi.mock('server-only', () => ({}));
vi.mock('@/app/actions/rewards', () => ({
  awardStars: vi.fn(async () => 0),
  getStarBalance: vi.fn(async () => 0),
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
import { GAME_ART } from '@/components/kid/game-art';

// Wave 10 hub restructure: the game registry is the single source of truth
// for every Sky Park game. Behavioral tests import the real module; the hub
// reachability test below renders the real map and proves every registered
// game is reachable — the honest replacement for diffing source text.

const kidDir = join(process.cwd(), 'components', 'kid');

const COLORS = ['coral', 'sky', 'mint', 'grape'] as const;

const CHILD = { id: 'c1', nickname: 'Ada', avatarId: 'fox' };

function makeMachine(overrides: Record<string, unknown> = {}) {
  return {
    islandProgress: {},
    parkTab: 'reading',
    setParkTab: vi.fn(),
    requestOpenGame: vi.fn(),
    setShowStickers: vi.fn(),
    setTalkWith: vi.fn(),
    startIslandSession: vi.fn(),
    startTrailQuest: vi.fn(),
    startingQuest: false,
    stickerIds: [],
    trailState: null as TrailState | null,
    child: CHILD,
    nickname: 'Ada',
    ...overrides,
  };
}

async function renderMapView(machine: ReturnType<typeof makeMachine>) {
  const { getTrailStop } = await import('@/lib/kid/trail');
  machine.trailState = {
    position: 0,
    questsCompleted: 0,
    totalStops: 220,
    questNo: 3,
    chapter: 'c1',
    stop: getTrailStop(0),
    streak: 2,
    quests: [],
  };
  const m = await import('@/components/kid/session/map-view');
  return render(createElement(m.default, { machine: machine as never }));
}

describe('registry integrity', () => {
  it('registers 30 visible games plus the hidden pet companion entry', () => {
    expect(GAME_REGISTRY).toHaveLength(31);
    expect(VISIBLE_GAMES).toHaveLength(30);
    expect(GAME_REGISTRY.filter((g) => g.hidden)).toHaveLength(1);
  });

  it('has unique ids and complete fields on every entry', () => {
    const ids = GAME_REGISTRY.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GAME_REGISTRY) {
      expect(g.id, 'id').toMatch(/^[a-z]+$/);
      expect(g.title.length, `${g.id} title`).toBeGreaterThan(0);
      expect(g.sub.length, `${g.id} sub`).toBeGreaterThan(0);
      expect(COLORS, `${g.id} color`).toContain(g.color);
      expect(typeof g.render).toBe('function');
    }
  });

  it('references only real groups, and every group has games', () => {
    const groupIds = new Set(GAME_GROUPS.map((g) => g.id));
    for (const g of GAME_REGISTRY) expect(groupIds, g.id).toContain(g.group);
    for (const group of GAME_GROUPS) {
      expect(gamesForGroup(group.id).length, group.id).toBeGreaterThan(0);
    }
    // No game leaks between groups.
    const total = GAME_GROUPS.reduce((n, g) => n + gamesForGroup(g.id).length, 0);
    expect(total).toBe(VISIBLE_GAMES.length);
  });

  it('has button art for every visible entry', () => {
    for (const g of VISIBLE_GAMES) {
      expect(GAME_ART[g.art], `${g.id} art`).toBeDefined();
    }
  });

  it('resolves entries by id and returns undefined for unknown ids', () => {
    expect(getGame('words')?.title).toBe('Word Builder');
    expect(getGame('pet')?.hidden).toBe(true);
    expect(getGame(null)).toBeUndefined();
    expect(getGame('nope')).toBeUndefined();
  });
});

describe('hub reachability: no game lost in the hub restructure', () => {
  it('renders every registered game as a button on the real map', async () => {
    // The old test diffed game labels out of a pre-refactor git blob. Here
    // the real MapView is rendered once per park tab and every visible
    // registry title must appear as a real button the kid can tap.
    const seen = new Set<string>();
    for (const group of GAME_GROUPS) {
      const { unmount } = await renderMapView(makeMachine({ parkTab: group.id }));
      for (const g of gamesForGroup(group.id)) {
        // A game can also appear in today's picks, so reachability means >= 1 button.
        const btns = screen.queryAllByRole('button', {
          name: new RegExp(g.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        });
        expect(btns.length, `${g.id} (${g.title}) reachable on the ${group.id} tab`).toBeGreaterThan(0);
        seen.add(g.id);
      }
      unmount();
    }
    expect(seen.size).toBe(VISIBLE_GAMES.length);
  });

  it('opens games through machine.requestOpenGame', async () => {
    const user = userEvent.setup();
    const machine = makeMachine();
    await renderMapView(machine);
    const target = gamesForGroup('reading')[0];
    await user.click(screen.getByRole('button', { name: new RegExp(target.title) }));
    expect(machine.requestOpenGame).toHaveBeenCalledWith(target.id);
  });
});

describe("today's picks", () => {
  it('is deterministic for a given date', () => {
    const a = picksForDate(2026, 9, 25).map((g) => g.id);
    const b = picksForDate(2026, 9, 25).map((g) => g.id);
    expect(a).toEqual(b);
  });

  it('returns 3 distinct, valid games spread across groups', () => {
    const picks = picksForDate(2026, 9, 25);
    expect(picks).toHaveLength(3);
    const ids = picks.map((g) => g.id);
    expect(new Set(ids).size).toBe(3);
    for (const p of picks) expect(getGame(p.id)).toBeDefined();
    const groups = picks.map((g) => g.group);
    expect(new Set(groups).size).toBe(3);
  });

  it('varies across dates', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 10; d++) {
      seen.add(picksForDate(2026, 9, d).map((g) => g.id).join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('todaysPicks returns 3 valid entries', () => {
    expect(todaysPicks(new Date(2026, 8, 25))).toHaveLength(3);
  });
});

describe('player restructure', () => {
  it('drives every game overlay through one openGame state', async () => {
    // The old test grepped the phase machine for `const [openGame,
    // setOpenGame]`. Here the real useSessionMachine is driven: opening a
    // game sets openGame, and the GameOverlay composition renders that
    // game's dialog; closing clears it again.
    const { useSessionMachine } = await import('@/components/kid/session/phase-machine');
    let machine: ReturnType<typeof useSessionMachine> | null = null;
    function Harness() {
      machine = useSessionMachine({ child: CHILD, steps: [], sessionId: 's1', onExit: () => {} });
      const entry = getGame(machine.openGame);
      return createElement(
        'div',
        null,
        createElement(
          'button',
          { type: 'button', onClick: () => machine!.requestOpenGame('words') },
          'open words'
        ),
        createElement('span', { 'data-testid': 'opengame' }, String(machine.openGame)),
        entry
          ? createElement(GameOverlay, {
              entry,
              child: CHILD,
              nickname: 'Ada',
              onClose: () => machine!.setOpenGame(null),
            })
          : null
      );
    }
    render(createElement(Harness));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(screen.getByTestId('opengame').textContent).toBe('null');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'open words' }));
    expect(screen.getByTestId('opengame').textContent).toBe('words');
    expect(screen.getByRole('dialog', { name: 'Word Builder' })).toBeInTheDocument();

    act(() => {
      machine!.setOpenGame(null);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('removed the dead design-fallback shim entirely', () => {
    expect(existsSync(join(kidDir, 'design-fallback.tsx'))).toBe(false);
  });

  it('renders game overlays transparent to the SkyBackdrop (no opaque covers)', async () => {
    // The overlay shell is a viewport-fixed layer with a light sky tint;
    // the animated SkyBackdrop behind it stays visible.
    const { useSessionMachine } = await import('@/components/kid/session/phase-machine');
    let machine: ReturnType<typeof useSessionMachine> | null = null;
    function Harness() {
      machine = useSessionMachine({ child: CHILD, steps: [], sessionId: 's1', onExit: () => {} });
      const entry = getGame(machine.openGame);
      return createElement(
        'div',
        null,
        entry
          ? createElement(GameOverlay, {
              entry,
              child: CHILD,
              nickname: 'Ada',
              onClose: () => machine!.setOpenGame(null),
            })
          : null
      );
    }
    render(createElement(Harness));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    await act(async () => {
      await machine!.requestOpenGame('fractions');
    });
    const dialog = screen.getByRole('dialog', { name: 'Fraction Fair' });
    expect(dialog.className).not.toMatch(/from-kid-sky-300/);
    expect(dialog.className).not.toMatch(/bg-gradient-to-b/);
  });

  it('keeps the Trail as the hero: banner before the park, park before the map', async () => {
    const { container } = await renderMapView(makeMachine());
    const html = container.innerHTML;
    const trail = html.indexOf('Start Quest');
    const park = html.indexOf('Sky Park');
    const skyMap = html.indexOf('My stickers');
    expect(trail).toBeGreaterThan(-1);
    expect(park).toBeGreaterThan(trail);
    expect(skyMap).toBeGreaterThan(park);
  });

  it('keeps the widget row, stickers, and character talk wired', async () => {
    const user = userEvent.setup();
    const machine = makeMachine();
    await renderMapView(machine);
    // Widget row: Up Next picks plus the daily gift widget. (Showdown and
    // streak widgets need live server data, so they render empty in tests.)
    expect(screen.getByRole('region', { name: 'Up next for you' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /daily gift/i })).toBeInTheDocument();
    // Stickers button reaches the machine.
    await user.click(screen.getByRole('button', { name: /my stickers/i }));
    expect(machine.setShowStickers).toHaveBeenCalledWith(true);
    // Character talk reaches the machine.
    const talk = screen.getAllByRole('button', { name: /^Talk to / })[0];
    await user.click(talk);
    expect(machine.setTalkWith).toHaveBeenCalled();
  });
});
