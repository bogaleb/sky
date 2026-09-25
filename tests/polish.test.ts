import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SPLASH_KEY, markSplashSeen, shouldShowSplash } from '../lib/kid/splash';
import { buildMonthGrid, dayKey } from '../lib/kid/calendar';

/** In-memory storage stand-in so tests never touch real sessionStorage. */
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('splash guard', () => {
  it('shows the splash when nothing is stored', () => {
    expect(shouldShowSplash(fakeStorage())).toBe(true);
  });

  it('hides the splash after it has been seen', () => {
    const storage = fakeStorage();
    markSplashSeen(storage);
    expect(storage.getItem(SPLASH_KEY)).toBe('1');
    expect(shouldShowSplash(storage)).toBe(false);
  });

  it('shows the splash when storage is unavailable', () => {
    expect(shouldShowSplash(null)).toBe(true);
    expect(shouldShowSplash(undefined)).toBe(true);
    // markSplashSeen must not throw without storage
    expect(() => markSplashSeen(null)).not.toThrow();
  });
});

describe('calendar date math', () => {
  it('formats a local day key as YYYY-MM-DD', () => {
    expect(dayKey(2026, 8, 5)).toBe('2026-09-05');
    expect(dayKey(2026, 0, 1)).toBe('2026-01-01');
    expect(dayKey(2026, 11, 31)).toBe('2026-12-31');
  });

  it('builds a Monday-start grid for September 2026', () => {
    // 2026-09-01 is a Tuesday; 2026-09-25 is a Friday (see goals tests).
    const weeks = buildMonthGrid(2026, 8);
    expect(weeks).toHaveLength(5);
    for (const week of weeks) expect(week).toHaveLength(7);
    expect(weeks[0]).toEqual([null, 1, 2, 3, 4, 5, 6]);
    expect(weeks[4]).toEqual([28, 29, 30, null, null, null, null]);
    // every day of the month appears exactly once
    const days = weeks.flat().filter((d): d is number => d !== null);
    expect(days).toHaveLength(30);
    expect(new Set(days).size).toBe(30);
  });

  it('starts a month on Monday with no leading padding', () => {
    // 2026-09-21 is a Monday, so the month starting on a Monday grid works;
    // use June 2026: 2026-06-01 is a Monday.
    const weeks = buildMonthGrid(2026, 5);
    expect(weeks[0][0]).toBe(1);
  });

  it('pads a Sunday-start month with six leading blanks', () => {
    // 2026-11-01 is a Sunday.
    const weeks = buildMonthGrid(2026, 10);
    expect(weeks[0].slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(weeks[0][6]).toBe(1);
  });
});

describe('content hygiene', () => {
  it('has no emoji in the polish components or lib', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;
    for (const file of [
      join('components', 'kid', 'splash-intro.tsx'),
      join('components', 'kid', 'streak-calendar.tsx'),
      join('lib', 'kid', 'splash.ts'),
      join('lib', 'kid', 'calendar.ts'),
      join('components', 'kid', 'sky-map.tsx'),
    ]) {
      const src = readFileSync(join(process.cwd(), file), 'utf8');
      expect(src, file).not.toMatch(emoji);
    }
  });
});
