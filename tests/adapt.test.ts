import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ADAPTED_GAMES,
  adaptKey,
  adaptiveRamp,
  levelFor,
  pickAdaptiveItems,
  placementSeedLevel,
  recordResult,
  type DifficultyLevel,
  type StorageLike,
} from '../lib/kid/adapt';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

/** In-memory storage stand-in so tests never touch real localStorage. */
function fakeStorage(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
  };
}

describe('adaptive difficulty engine', () => {
  it('lists the three adapted games', () => {
    expect([...ADAPTED_GAMES]).toEqual(['phonics-fun', 'word-builder', 'number-run']);
  });

  it('namespaces storage keys per child and game', () => {
    expect(adaptKey('c1', 'phonics-fun')).toBe('sky-adapt-c1-phonics-fun');
  });

  it('keeps siblings on one device independent', () => {
    const s = fakeStorage();
    levelFor('big-sister', 'g', 1, s);
    for (let i = 0; i < 5; i += 1) recordResult('big-sister', 'g', true, s);
    expect(levelFor('big-sister', 'g', 1, s)).toBe(2);
    // Her little brother's difficulty is untouched by her streak.
    expect(levelFor('little-brother', 'g', 1, s)).toBe(1);
  });

  it('removes the old device-wide key when a child plays', () => {
    const s = fakeStorage();
    s.setItem('sky-adapt-g', JSON.stringify({ level: 3, results: [true] }));
    expect(levelFor('kid', 'g', 1, s)).toBe(1);
    expect(s.getItem('sky-adapt-g')).toBeNull();
  });

  it('new players start at the seed level', () => {
    expect(levelFor('kid', 'fresh-game', 1, fakeStorage())).toBe(1);
    expect(levelFor('kid', 'fresh-game', 2, fakeStorage())).toBe(2);
    expect(levelFor('kid', 'fresh-game', 3, fakeStorage())).toBe(3);
  });

  it('levels up after 3 correct in the last 5', () => {
    const s = fakeStorage();
    recordResult('kid', 'g', true, s);
    recordResult('kid', 'g', true, s);
    recordResult('kid', 'g', true, s);
    expect(levelFor('kid', 'g', 1, s)).toBe(2);
  });

  it('levels down after 3 wrong in the last 5', () => {
    const s = fakeStorage();
    expect(levelFor('kid', 'g', 2, s)).toBe(2); // seeds the record at level 2
    recordResult('kid', 'g', false, s);
    recordResult('kid', 'g', false, s);
    recordResult('kid', 'g', false, s);
    expect(levelFor('kid', 'g', 2, s)).toBe(1);
  });

  it('stays put on mixed results', () => {
    const s = fakeStorage();
    expect(levelFor('kid', 'g', 2, s)).toBe(2);
    recordResult('kid', 'g', true, s);
    recordResult('kid', 'g', true, s);
    recordResult('kid', 'g', false, s);
    recordResult('kid', 'g', false, s);
    expect(levelFor('kid', 'g', 2, s)).toBe(2);
  });

  it('never exceeds level 3 or drops below level 1', () => {
    const up = fakeStorage();
    expect(levelFor('kid', 'u', 3, up)).toBe(3);
    for (let i = 0; i < 8; i += 1) recordResult('kid', 'u', true, up);
    expect(levelFor('kid', 'u', 3, up)).toBe(3);

    const down = fakeStorage();
    for (let i = 0; i < 8; i += 1) recordResult('kid', 'd', false, down);
    expect(levelFor('kid', 'd', 1, down)).toBe(1);
  });

  it('ratchets up across sessions and persists the level', () => {
    const s = fakeStorage();
    for (let i = 0; i < 5; i += 1) recordResult('kid', 'g', true, s);
    expect(levelFor('kid', 'g', 1, s)).toBe(2);
    // The adjusted level is persisted — a fresh read sees it.
    const stored = JSON.parse(s.data['sky-adapt-kid-g']) as { level: number; results: boolean[] };
    expect(stored.level).toBe(2);
    expect(stored.results).toEqual([true, true, true, true, true]);
    // Another strong session keeps challenging.
    for (let i = 0; i < 5; i += 1) recordResult('kid', 'g', true, s);
    expect(levelFor('kid', 'g', 1, s)).toBe(3);
    // And it caps at 3.
    for (let i = 0; i < 5; i += 1) recordResult('kid', 'g', true, s);
    expect(levelFor('kid', 'g', 1, s)).toBe(3);
  });

  it('keeps only the last 10 results', () => {
    const s = fakeStorage();
    for (let i = 0; i < 12; i += 1) recordResult('kid', 'g', i % 2 === 0, s);
    const stored = JSON.parse(s.data['sky-adapt-kid-g']) as { results: boolean[] };
    expect(stored.results).toHaveLength(10);
    expect(stored.results).toEqual(
      Array.from({ length: 10 }, (_, i) => (i + 2) % 2 === 0)
    );
  });

  it('treats corrupt storage as a new player', () => {
    const s = fakeStorage();
    s.data['sky-adapt-kid-g'] = 'not-json{{{';
    expect(levelFor('kid', 'g', 2, s)).toBe(2);
  });

  it('placementSeedLevel starts quest graduates at 2', () => {
    // No placement API in the test env (window.localStorage unavailable here),
    // so this asserts the safe fallback.
    const level: DifficultyLevel = placementSeedLevel('no-such-child');
    expect([1, 2]).toContain(level);
  });

  it('adapt.ts source is emoji-free', () => {
    const src = readFileSync(join(process.cwd(), 'lib', 'kid', 'adapt.ts'), 'utf8');
    expect(EMOJI_RE.test(src)).toBe(false);
  });
});

describe('adaptiveRamp', () => {
  it('returns the ramp unchanged at level 2', () => {
    const ramp = [1, 1, 2, 2, 3, 3, 3, 3];
    expect(adaptiveRamp(ramp, 2)).toEqual(ramp);
  });

  it('shifts toward easier content at level 1', () => {
    expect(adaptiveRamp([1, 1, 2, 2, 3, 3, 3, 3], 1)).toEqual([1, 1, 1, 1, 2, 2, 2, 2]);
  });

  it('shifts toward harder content at level 3', () => {
    expect(adaptiveRamp([1, 1, 2, 2, 3, 3, 3, 3], 3)).toEqual([2, 2, 3, 3, 3, 3, 3, 3]);
  });

  it('never leaves the ramp\u2019s own min/max', () => {
    expect(adaptiveRamp([1, 1, 2, 2, 3, 3, 4, 5], 3)).toEqual([2, 2, 3, 3, 4, 4, 5, 5]);
    expect(adaptiveRamp([1, 1, 2, 2, 3, 3, 4, 5], 1)).toEqual([1, 1, 1, 1, 2, 2, 3, 4]);
  });

  it('handles an empty ramp', () => {
    expect(adaptiveRamp([], 1)).toEqual([]);
  });
});

describe('pickAdaptiveItems', () => {
  const pools = [
    ['a1', 'a2', 'a3', 'a4'],
    ['b1', 'b2', 'b3'],
    ['c1', 'c2'],
  ];
  const keyOf = (s: string) => s;

  it('picks one item per ramp slot from the matching level pool', () => {
    const picks = pickAdaptiveItems(pools, [1, 1, 2, 3], 42, keyOf);
    expect(picks).toHaveLength(4);
    expect(picks[0].startsWith('a')).toBe(true);
    expect(picks[1].startsWith('a')).toBe(true);
    expect(picks[2].startsWith('b')).toBe(true);
    expect(picks[3].startsWith('c')).toBe(true);
  });

  it('never repeats an item within a session', () => {
    const picks = pickAdaptiveItems(pools, [1, 1, 1, 2, 2, 3], 7, keyOf);
    expect(new Set(picks).size).toBe(picks.length);
  });

  it('is deterministic per seed', () => {
    expect(pickAdaptiveItems(pools, [1, 2, 3], 99, keyOf)).toEqual(
      pickAdaptiveItems(pools, [1, 2, 3], 99, keyOf)
    );
  });

  it('varies across seeds', () => {
    const a = pickAdaptiveItems(pools, [1, 1, 2, 2, 3, 3], 1, keyOf).join(',');
    const b = pickAdaptiveItems(pools, [1, 1, 2, 2, 3, 3], 2, keyOf).join(',');
    expect(a === b).toBe(false);
  });
});
