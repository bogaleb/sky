/**
 * Pet Playground tests: deterministic game logic, all-played tracking,
 * outfit catalog growth, and content hygiene.
 */
import { describe, expect, it } from 'vitest';
import {
  PLAYGROUND_GAMES,
  allGamesPlayed,
  fetchRound,
  getPlaygroundGame,
  groomSpots,
  isTossHit,
  loadPlayedGames,
  markGamePlayed,
  playgroundKey,
  tossAim,
  TOSS_SWEET_HALF_WIDTH,
} from '../lib/kid/playground';
import { OUTFITS, getOutfit } from '../lib/kid/outfits';
import { OUTFIT_ART_IDS } from '../lib/kid/outfit-art';

function fakeStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe('playground games catalog', () => {
  it('has exactly the three expected games with names and how-tos', () => {
    expect(PLAYGROUND_GAMES.map((g) => g.id)).toEqual(['fetch', 'groom', 'treat-toss']);
    for (const g of PLAYGROUND_GAMES) {
      expect(g.name.length).toBeGreaterThan(0);
      expect(g.howTo.length).toBeGreaterThan(0);
      expect(EMOJI_RE.test(g.name + g.howTo)).toBe(false);
    }
  });

  it('resolves each game id', () => {
    for (const g of PLAYGROUND_GAMES) expect(getPlaygroundGame(g.id)).toBeDefined();
    expect(getPlaygroundGame('nope')).toBeUndefined();
  });
});

describe('fetch rounds', () => {
  it('produces 5 throws in 5 zones, deterministically', () => {
    const a = fetchRound(42);
    const b = fetchRound(42);
    expect(a).toEqual(b);
    expect(a.throws).toBe(5);
    expect(a.zones).toHaveLength(5);
    for (const z of a.zones) {
      expect(z).toBeGreaterThanOrEqual(0);
      expect(z).toBeLessThanOrEqual(4);
    }
  });

  it('varies with the seed', () => {
    expect(fetchRound(1).zones).not.toEqual(fetchRound(2).zones);
  });
});

describe('groom spots', () => {
  it('picks 5 unique spots on the 3x3 grid, deterministically', () => {
    const a = groomSpots(7);
    const b = groomSpots(7);
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
    expect(new Set(a).size).toBe(5);
    for (const s of a) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(8);
    }
  });
});

describe('treat toss', () => {
  it('produces 5 sweet zones in bounds, deterministically', () => {
    const a = tossAim(99);
    const b = tossAim(99);
    expect(a).toEqual(b);
    expect(a.tosses).toBe(5);
    expect(a.sweetZones).toHaveLength(5);
    for (const z of a.sweetZones) {
      expect(z).toBeGreaterThanOrEqual(20);
      expect(z).toBeLessThanOrEqual(80);
    }
  });

  it('hit detection respects the sweet half-width', () => {
    expect(isTossHit(50, 50)).toBe(true);
    expect(isTossHit(50 + TOSS_SWEET_HALF_WIDTH, 50)).toBe(true);
    expect(isTossHit(50 + TOSS_SWEET_HALF_WIDTH + 1, 50)).toBe(false);
    expect(isTossHit(0, 90)).toBe(false);
  });
});

describe('all-played tracking', () => {
  it('namespaces keys per child', () => {
    expect(playgroundKey('abc')).toBe('sky-playground-abc');
    expect(playgroundKey('abc')).not.toBe(playgroundKey('xyz'));
  });

  it('starts empty, accumulates, and completes at three games', () => {
    const store = fakeStorage();
    expect(loadPlayedGames('kid1', store)).toEqual([]);
    expect(allGamesPlayed('kid1', store)).toBe(false);

    markGamePlayed('kid1', 'fetch', store);
    expect(allGamesPlayed('kid1', store)).toBe(false);
    markGamePlayed('kid1', 'groom', store);
    markGamePlayed('kid1', 'treat-toss', store);
    expect(allGamesPlayed('kid1', store)).toBe(true);
    expect(loadPlayedGames('kid1', store).sort()).toEqual(['fetch', 'groom', 'treat-toss']);
  });

  it('is idempotent and heals corrupt data', () => {
    const store = fakeStorage();
    markGamePlayed('kid2', 'fetch', store);
    markGamePlayed('kid2', 'fetch', store);
    expect(loadPlayedGames('kid2', store)).toEqual(['fetch']);

    store.setItem(playgroundKey('kid3'), 'not-json{{');
    expect(loadPlayedGames('kid3', store)).toEqual([]);
    expect(allGamesPlayed('kid3', store)).toBe(false);
  });

  it('rejects unknown game ids in stored data', () => {
    const store = fakeStorage();
    store.setItem(playgroundKey('kid4'), JSON.stringify(['fetch', 'bogus']));
    expect(loadPlayedGames('kid4', store)).toEqual(['fetch']);
  });
});

describe('new outfits', () => {
  const NEW_IDS = [
    'cowboy-hat',
    'knight-helmet',
    'detective-cap',
    'snorkel-mask',
    'rain-boots',
    'rocket-jetpack',
  ];

  it('grows the catalog to 24', () => {
    expect(OUTFITS.length).toBe(24);
  });

  it('every new outfit resolves, has art, a valid slot, and a sensible price', () => {
    for (const id of NEW_IDS) {
      const outfit = getOutfit(id);
      expect(outfit).toBeDefined();
      expect(OUTFIT_ART_IDS).toContain(id);
      expect(['hat', 'glasses', 'extra']).toContain(outfit!.slot);
      expect(outfit!.cost).toBeGreaterThanOrEqual(15);
      expect(outfit!.cost).toBeLessThanOrEqual(70);
      expect(outfit!.name.length).toBeGreaterThan(0);
      expect(outfit!.blurb.length).toBeGreaterThan(0);
      expect(EMOJI_RE.test(outfit!.name + outfit!.blurb)).toBe(false);
    }
  });

  it('slot spread: 3 hats, 1 glasses, 2 extras', () => {
    const slots = NEW_IDS.map((id) => getOutfit(id)!.slot);
    expect(slots.filter((s) => s === 'hat')).toHaveLength(3);
    expect(slots.filter((s) => s === 'glasses')).toHaveLength(1);
    expect(slots.filter((s) => s === 'extra')).toHaveLength(2);
  });
});
