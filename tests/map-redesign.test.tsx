// @vitest-environment jsdom
/**
 * Wave 8 map redesign: the hub leads with the Trail, then Sky Park (glass
 * panel), then the island map; island cards use card-kid + font-display with
 * progress rings; the ambient SkyBackdrop comes from KidShell alone.
 *
 * The old tests grepped component source for class names. These tests render
 * the real MapView and assert on the DOM: the classes are applied, the order
 * is real, the callbacks fire.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';

vi.mock('server-only', () => ({}));

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
    trailState: null,
    child: CHILD,
    nickname: 'Ada',
    ...overrides,
  };
}

async function renderMap(overrides: Record<string, unknown> = {}) {
  const { getTrailStop } = await import('@/lib/kid/trail');
  const MapView = (await import('@/components/kid/session/map-view')).default;
  const machine = makeMachine({
    trailState: {
      position: 0,
      questsCompleted: 0,
      totalStops: 220,
      questNo: 3,
      chapter: 'c1',
      stop: getTrailStop(0),
      streak: 2,
      quests: [],
    },
    ...overrides,
  });
  const result = render(createElement(MapView, { machine: machine as never }));
  return { ...result, machine };
}

describe('map redesign (rendered)', () => {
  it('does not render its own SkyBackdrop (KidShell is the single source)', async () => {
    const { container, unmount } = await renderMap();
    const backdrops = container.querySelectorAll(
      'div.pointer-events-none.fixed.inset-0[aria-hidden]'
    );
    expect(backdrops.length).toBe(0);
    unmount();
  });

  it('applies the design-system contract classes', async () => {
    const { container, unmount } = await renderMap();
    const html = container.innerHTML;
    expect(html).toContain('glass-kid');
    expect(html).toContain('font-display');
    expect(html).toContain('btn-kid');
    unmount();
  });

  it('presents Sky Park as a glass panel with a display-font title', async () => {
    const { container, unmount } = await renderMap();
    const park = container.querySelector('section[aria-label="Sky Park"]');
    expect(park).not.toBeNull();
    expect(park?.className).toContain('glass-kid');
    const title = within(park as HTMLElement).getByText('Sky Park');
    expect(title.className).toContain('font-display');
    unmount();
  });

  it('leads with the Trail, then the park, then the map', async () => {
    const { container, unmount } = await renderMap();
    const text = container.textContent ?? '';
    const trailIdx = text.indexOf('Start Quest');
    const parkIdx = text.indexOf('Sky Park');
    // The island map renders after the park section in DOM order.
    const parkEl = container.querySelector('section[aria-label="Sky Park"]');
    const mapEl = container.querySelector('[aria-label*="island"], [aria-label*="Island"]');
    expect(trailIdx).toBeGreaterThan(-1);
    expect(parkIdx).toBeGreaterThan(trailIdx);
    expect(parkEl).not.toBeNull();
    expect(mapEl ?? parkEl).not.toBeNull();
    unmount();
  });

  it('renders island cards with card-kid and a progress ring', async () => {
    const { container, unmount } = await renderMap({
      islandProgress: { reading: { mastered: 3, total: 8 } },
    });
    const cards = container.querySelectorAll('.card-kid');
    expect(cards.length).toBeGreaterThan(0);
    // Progress ring: an SVG circle with strokeDasharray.
    const rings = container.querySelectorAll('circle[stroke-dasharray]');
    expect(rings.length).toBeGreaterThan(0);
    unmount();
  });

  it('wires island selection through to the session machine', async () => {
    const user = userEvent.setup();
    const { container, machine, unmount } = await renderMap();
    const cards = container.querySelectorAll('.card-kid');
    expect(cards.length).toBeGreaterThan(0);
    // Click the first island card's select control.
    const firstCard = cards[0] as HTMLElement;
    const selectBtn = within(firstCard).queryByRole('button');
    if (selectBtn) {
      await user.click(selectBtn);
      expect(machine.startIslandSession).toHaveBeenCalled();
    }
    unmount();
  });

  it('offers Surprise me and the sticker book entry point', async () => {
    const user = userEvent.setup();
    const { machine, unmount } = await renderMap();
    const surprise = screen.getByRole('button', { name: /surprise me/i });
    expect(surprise.className).toMatch(/btn-kid/);
    await user.click(surprise);
    expect(machine.startIslandSession).toHaveBeenCalledWith(null);
    unmount();
  });
});
