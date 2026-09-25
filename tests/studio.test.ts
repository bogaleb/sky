import { describe, expect, it } from 'vitest';
import {
  STUDIO_MAX_ITEMS,
  STUDIO_DAILY_STAR_BONUS,
  STAMPS,
  COLORING_PAGES,
  studioKey,
  studioStarsKey,
  todayKey,
  newArtworkId,
  loadGallery,
  saveArtwork,
  deleteArtwork,
  shouldAwardDailyStars,
  markDailyStarsAwarded,
  formatArtDate,
  type StorageLike,
  type StudioArtwork,
} from '../lib/kid/studio';

function makeStore(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

function art(id: string, kind: 'draw' | 'color' = 'draw'): StudioArtwork {
  return { id, kind, dataUrl: 'data:image/png;base64,AAA', createdAt: 1000 };
}

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe('studio storage keys', () => {
  it('namespaces the gallery key per child', () => {
    expect(studioKey('abc')).toBe('sky-studio-abc');
    expect(studioKey('abc')).not.toBe(studioKey('xyz'));
  });

  it('uses a separate key for the daily star bonus', () => {
    expect(studioStarsKey('abc')).toBe('sky-studio-stars-abc');
    expect(studioStarsKey('abc')).not.toBe(studioKey('abc'));
  });

  it('formats todayKey as YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 8, 25))).toBe('2026-09-25');
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('generates unique artwork ids', () => {
    const a = newArtworkId();
    const b = newArtworkId();
    expect(a).not.toBe(b);
    expect(a.startsWith('art-')).toBe(true);
  });
});

describe('gallery save/load', () => {
  it('round-trips artworks in order', () => {
    const store = makeStore();
    saveArtwork('kid1', art('a1'), store);
    saveArtwork('kid1', art('a2', 'color'), store);
    const loaded = loadGallery('kid1', store);
    expect(loaded.map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(loaded[1].kind).toBe('color');
  });

  it('keeps galleries separate per child', () => {
    const store = makeStore();
    saveArtwork('kid1', art('a1'), store);
    expect(loadGallery('kid2', store)).toEqual([]);
  });

  it(`caps at ${STUDIO_MAX_ITEMS}, dropping the oldest`, () => {
    const store = makeStore();
    for (let i = 0; i < STUDIO_MAX_ITEMS + 6; i++) saveArtwork('kid1', art(`a${i}`), store);
    const loaded = loadGallery('kid1', store);
    expect(loaded).toHaveLength(STUDIO_MAX_ITEMS);
    expect(loaded[0].id).toBe('a6');
    expect(loaded[STUDIO_MAX_ITEMS - 1].id).toBe(`a${STUDIO_MAX_ITEMS + 5}`);
  });

  it('deletes by id', () => {
    const store = makeStore();
    saveArtwork('kid1', art('a1'), store);
    saveArtwork('kid1', art('a2'), store);
    const next = deleteArtwork('kid1', 'a1', store);
    expect(next.map((a) => a.id)).toEqual(['a2']);
    expect(loadGallery('kid1', store).map((a) => a.id)).toEqual(['a2']);
  });

  it('heals corrupt or shapeless data to []', () => {
    const store = makeStore();
    store.setItem(studioKey('kid1'), 'not-json{{{');
    expect(loadGallery('kid1', store)).toEqual([]);
    store.setItem(studioKey('kid1'), JSON.stringify({ nope: true }));
    expect(loadGallery('kid1', store)).toEqual([]);
    store.setItem(
      studioKey('kid1'),
      JSON.stringify([art('ok'), { id: 'bad', kind: 'draw' }, 'junk', null])
    );
    expect(loadGallery('kid1', store).map((a) => a.id)).toEqual(['ok']);
  });

  it('works without storage (SSR) without throwing', () => {
    expect(loadGallery('kid1', null)).toEqual([]);
    const next = saveArtwork('kid1', art('a1'), null);
    expect(next).toHaveLength(1);
    expect(deleteArtwork('kid1', 'a1', null)).toEqual([]);
    expect(shouldAwardDailyStars('kid1', null)).toBe(false);
  });
});

describe('daily star bonus', () => {
  it('awards once per day', () => {
    const store = makeStore();
    expect(shouldAwardDailyStars('kid1', store)).toBe(true);
    markDailyStarsAwarded('kid1', store);
    expect(shouldAwardDailyStars('kid1', store)).toBe(false);
  });

  it('resets on a new day', () => {
    const store = makeStore();
    markDailyStarsAwarded('kid1', store);
    store.setItem(studioStarsKey('kid1'), '2000-01-01');
    expect(shouldAwardDailyStars('kid1', store)).toBe(true);
  });

  it('bonus constant is sane', () => {
    expect(STUDIO_DAILY_STAR_BONUS).toBeGreaterThan(0);
    expect(STUDIO_DAILY_STAR_BONUS).toBeLessThanOrEqual(10);
  });
});

describe('stamp catalog', () => {
  it('has 10 unique stamps with names', () => {
    expect(STAMPS).toHaveLength(10);
    const ids = STAMPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(10);
    for (const s of STAMPS) {
      expect(s.id.length).toBeGreaterThan(0);
      expect(s.name.length).toBeGreaterThan(0);
      expect(EMOJI_RE.test(s.name)).toBe(false);
    }
  });
});

describe('coloring pages', () => {
  it('has 6 unique pages', () => {
    expect(COLORING_PAGES).toHaveLength(6);
    const ids = COLORING_PAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('each page has at least 5 uniquely-id regions', () => {
    for (const page of COLORING_PAGES) {
      expect(page.title.length).toBeGreaterThan(0);
      expect(EMOJI_RE.test(page.title)).toBe(false);
      expect(page.regions.length).toBeGreaterThanOrEqual(5);
      const ids = page.regions.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('every region has valid shape geometry', () => {
    const valid = new Set(['path', 'circle', 'ellipse', 'rect']);
    for (const page of COLORING_PAGES) {
      for (const r of page.regions) {
        expect(valid.has(r.shape)).toBe(true);
        if (r.shape === 'path') expect(r.d && r.d.length).toBeGreaterThan(0);
        if (r.shape === 'circle') {
          expect(r.cx).toBeDefined();
          expect(r.cy).toBeDefined();
          expect(r.r).toBeGreaterThan(0);
        }
        if (r.shape === 'ellipse') {
          expect(r.rx).toBeGreaterThan(0);
          expect(r.ry).toBeGreaterThan(0);
        }
        if (r.shape === 'rect') {
          expect(r.width).toBeGreaterThan(0);
          expect(r.height).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('formatArtDate', () => {
  it('formats a friendly date', () => {
    expect(formatArtDate(new Date(2026, 0, 5).getTime())).toBe('Jan 5');
    expect(formatArtDate(new Date(2026, 11, 25).getTime())).toBe('Dec 25');
  });
});
