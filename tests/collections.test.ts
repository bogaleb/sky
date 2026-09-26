import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { seasonFor, SEASON_META } from '../lib/kid/seasons';
import {
  COLLECTION_ANIMALS,
  COLLECTIONS,
  getAnimal,
  getCollectionDef,
  isCollectionComplete,
} from '../lib/kid/collections';
import { CONTINENTS } from '../lib/kid/geography';
import {
  DAILY_GIFT_STARS,
  giftDateKey,
  giftStorageKey,
  canClaimGift,
  markGiftClaimed,
  giftAnimalFor,
  type StorageLike,
} from '../lib/kid/daily-gift';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

function memStore(): StorageLike & { clear(): void } {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => {
      m.set(k, v);
    },
    clear: () => m.clear(),
  };
}

describe('seasons', () => {
  it('maps sample dates to the right seasons', () => {
    expect(seasonFor(new Date(2026, 9, 15))).toBe('halloween'); // Oct
    expect(seasonFor(new Date(2026, 9, 31))).toBe('halloween'); // Oct 31
    expect(seasonFor(new Date(2026, 11, 25))).toBe('winter'); // Dec
    expect(seasonFor(new Date(2027, 0, 1))).toBe('winter'); // Jan
    expect(seasonFor(new Date(2027, 1, 28))).toBe('winter'); // Feb
    expect(seasonFor(new Date(2026, 2, 10))).toBe('spring'); // Mar
    expect(seasonFor(new Date(2026, 3, 20))).toBe('spring'); // Apr
    expect(seasonFor(new Date(2026, 4, 5))).toBe('spring'); // May
    expect(seasonFor(new Date(2026, 5, 21))).toBe('summer'); // Jun
    expect(seasonFor(new Date(2026, 6, 4))).toBe('summer'); // Jul
    expect(seasonFor(new Date(2026, 7, 30))).toBe('summer'); // Aug
    expect(seasonFor(new Date(2026, 8, 20))).toBe('autumn'); // Sep
    expect(seasonFor(new Date(2026, 10, 5))).toBe('autumn'); // Nov
  });

  it('has metadata for every season', () => {
    for (const id of ['halloween', 'winter', 'spring', 'summer', 'autumn'] as const) {
      const meta = SEASON_META[id];
      expect(meta.label.trim().length).toBeGreaterThan(2);
      expect(meta.greeting.trim().length).toBeGreaterThan(5);
      expect(EMOJI.test(meta.label + meta.greeting)).toBe(false);
    }
  });
});

describe('animal collection data', () => {
  it('has exactly 24 unique animals', () => {
    expect(COLLECTION_ANIMALS.length).toBe(24);
    const ids = COLLECTION_ANIMALS.map((a) => a.id);
    expect(new Set(ids).size).toBe(24);
  });

  it('reuses the 11 geography animal ids', () => {
    const geoIds = ['penguin', 'kangaroo', 'koala', 'panda', 'tiger', 'camel', 'elephant', 'toucan', 'llama', 'polar-bear', 'fox'];
    for (const id of geoIds) {
      expect(getAnimal(id), `missing ${id}`).toBeDefined();
    }
  });

  it('has valid, kid-safe content for every animal', () => {
    const continentIds = new Set(CONTINENTS.map((c) => c.id));
    for (const a of COLLECTION_ANIMALS) {
      expect(a.id.trim().length).toBeGreaterThan(1);
      expect(a.name.trim().length).toBeGreaterThan(2);
      expect(a.fact.trim().length).toBeGreaterThan(15);
      expect(a.habitat.trim().length).toBeGreaterThan(2);
      expect(continentIds.has(a.continentId), `${a.id} bad continent`).toBe(true);
      expect(EMOJI.test(a.name + a.fact + a.habitat)).toBe(false);
    }
  });

  it('covers every continent at least once', () => {
    const covered = new Set(COLLECTION_ANIMALS.map((a) => a.continentId));
    for (const c of CONTINENTS) {
      expect(covered.has(c.id), `no animal for ${c.id}`).toBe(true);
    }
  });

  it('exposes the animals collection def', () => {
    expect(COLLECTIONS.length).toBeGreaterThanOrEqual(1);
    const def = getCollectionDef('animals');
    expect(def).toBeDefined();
    expect(def!.itemIds).toHaveLength(24);
    expect(isCollectionComplete('animals', def!.itemIds)).toBe(true);
    expect(isCollectionComplete('animals', def!.itemIds.slice(0, 23))).toBe(false);
    expect(isCollectionComplete('animals', [])).toBe(false);
    expect(isCollectionComplete('nope', [])).toBe(false);
  });
});

describe('daily gift', () => {
  it('formats local date keys as YYYY-MM-DD', () => {
    expect(giftDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(giftDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('scopes storage keys per child', () => {
    expect(giftStorageKey('a')).not.toBe(giftStorageKey('b'));
    expect(giftStorageKey('a')).toContain('a');
  });

  it('allows one claim per day and resets the next day', () => {
    const store = memStore();
    const day1 = new Date(2026, 4, 1, 9, 0);
    const day1Later = new Date(2026, 4, 1, 20, 0);
    const day2 = new Date(2026, 4, 2, 8, 0);
    expect(canClaimGift('kid1', day1, store)).toBe(true);
    expect(markGiftClaimed('kid1', day1, store)).toBe(true);
    expect(canClaimGift('kid1', day1Later, store)).toBe(false);
    expect(canClaimGift('kid1', day2, store)).toBe(true);
    // other children are unaffected
    expect(canClaimGift('kid2', day1, store)).toBe(true);
  });

  it('picks a deterministic animal per day', () => {
    const a = giftAnimalFor(new Date(2026, 4, 1));
    const b = giftAnimalFor(new Date(2026, 4, 1, 23, 59));
    expect(a.id).toBe(b.id);
    expect(getAnimal(a.id)).toBeDefined();
    expect(DAILY_GIFT_STARS).toBe(5);
  });
});

describe('collections migration SQL', () => {
  const sql = readFileSync(
    join(root, 'supabase', 'migrations', '20260925001000_collections.sql'),
    'utf8'
  );

  it('creates collection_items with the right shape', () => {
    expect(sql).toMatch(/create table (if not exists )?public\.collection_items/);
    expect(sql).toContain('collection_id text not null');
    expect(sql).toContain('item_id text not null');
    expect(sql).toContain('primary key (child_id, collection_id, item_id)');
    expect(sql).toContain('on delete cascade');
    expect(sql).toContain('found_at timestamptz');
  });

  it('enables RLS with parent-owned policies mirroring trophies', () => {
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('for select');
    expect(sql).toContain('for insert');
    expect(sql).toContain('parent_id = auth.uid()');
  });
});
