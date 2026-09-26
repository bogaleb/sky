import { describe, expect, it } from 'vitest';
import {
  HOMES,
  getHome,
  todayKey,
  loadVisited,
  markVisited,
  hasVisitedAll,
  claimHiddenStar,
  loadHomesAwarded,
  markHomesAwarded,
  type StorageLike,
} from '../lib/kid/homes';
import { CHARACTER_IDS } from '../lib/kid/characters';

function memStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (k) => (data.has(k) ? data.get(k)! : null),
    setItem: (k, v) => {
      data.set(k, v);
    },
  };
}

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

describe('character homes', () => {
  it('has exactly 8 homes, one per character', () => {
    expect(HOMES.length).toBe(8);
    const ids = HOMES.map((h) => h.characterId).sort();
    expect(ids).toEqual([...CHARACTER_IDS].sort());
  });

  it('every home has a name, tagline, greeting and clip (curio clip disabled: wrong video content)', () => {
    for (const h of HOMES) {
      expect(h.homeName.trim().length).toBeGreaterThan(0);
      expect(h.tagline.trim().length).toBeGreaterThan(0);
      expect(h.greeting.trim().length).toBeGreaterThan(0);
      if (h.characterId === 'curio') {
        expect(h.clipSrc).toBeNull();
      } else {
        expect(h.clipSrc).toBe(`/videos/${h.characterId}-home.mp4`);
      }
    }
  });

  it('content is emoji-free', () => {
    for (const h of HOMES) {
      expect(h.homeName).not.toMatch(EMOJI_RE);
      expect(h.tagline).not.toMatch(EMOJI_RE);
      expect(h.greeting).not.toMatch(EMOJI_RE);
    }
  });

  it('getHome resolves each character', () => {
    for (const id of CHARACTER_IDS) {
      expect(getHome(id)?.characterId).toBe(id);
    }
    expect(getHome('nope')).toBeUndefined();
  });

  it('todayKey formats a local date key', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(todayKey(new Date(2026, 11, 25))).toBe('2026-12-25');
  });
});

describe('visit storage', () => {
  it('starts empty and records visits idempotently', () => {
    const s = memStorage();
    expect(loadVisited('kid1', s)).toEqual([]);
    markVisited('kid1', 'curio', s);
    markVisited('kid1', 'curio', s);
    expect(loadVisited('kid1', s)).toEqual(['curio']);
  });

  it('visits are namespaced per child', () => {
    const s = memStorage();
    markVisited('kid1', 'luna', s);
    expect(loadVisited('kid2', s)).toEqual([]);
  });

  it('hasVisitedAll requires all 8 characters', () => {
    const s = memStorage();
    for (const id of CHARACTER_IDS.slice(0, 7)) markVisited('kid1', id, s);
    expect(hasVisitedAll('kid1', s)).toBe(false);
    markVisited('kid1', CHARACTER_IDS[7], s);
    expect(hasVisitedAll('kid1', s)).toBe(true);
  });

  it('corrupt data heals to empty', () => {
    const s = memStorage();
    s.setItem('sky-homes-kid1', 'not json{{{');
    expect(loadVisited('kid1', s)).toEqual([]);
    expect(hasVisitedAll('kid1', s)).toBe(false);
  });
});

describe('hidden star claims', () => {
  it('allows one claim per home per day', () => {
    const s = memStorage();
    const day = new Date(2026, 4, 1, 10);
    expect(claimHiddenStar('kid1', 'bea', s, day)).toBe(true);
    expect(claimHiddenStar('kid1', 'bea', s, day)).toBe(false);
    // A different home is still claimable the same day.
    expect(claimHiddenStar('kid1', 'milo', s, day)).toBe(true);
    // Next day the first home resets.
    expect(claimHiddenStar('kid1', 'bea', s, new Date(2026, 4, 2, 10))).toBe(true);
  });

  it('claims are namespaced per child', () => {
    const s = memStorage();
    const day = new Date(2026, 4, 1, 10);
    claimHiddenStar('kid1', 'tuno', s, day);
    expect(claimHiddenStar('kid2', 'tuno', s, day)).toBe(true);
  });
});

describe('homes award guard', () => {
  it('fires exactly once', () => {
    const s = memStorage();
    expect(loadHomesAwarded('kid1', s)).toBe(false);
    markHomesAwarded('kid1', s);
    expect(loadHomesAwarded('kid1', s)).toBe(true);
  });
});
