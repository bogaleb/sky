/**
 * Daily gift — Curio pops by once a day with 5 bonus stars and an animal
 * fun fact. Claim state is kept on-device (localStorage) so it is instant
 * and works offline; the star award itself is server-side and idempotent
 * per day because the localStorage gate only allows one claim per date key.
 */

import { COLLECTION_ANIMALS, type AnimalEntry } from './collections';

export const DAILY_GIFT_STARS = 5;

export function giftStorageKey(childId: string): string {
  return `sky-gift-${childId}`;
}

/** Local date key YYYY-MM-DD (not UTC, so the gift follows the kid's day). */
export function giftDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function readStore(storage: StorageLike | null | undefined): StorageLike | null {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return null;
}

/** True when today's gift is still unclaimed for this child. */
export function canClaimGift(
  childId: string,
  date: Date = new Date(),
  storage?: StorageLike | null
): boolean {
  const store = readStore(storage);
  if (!store) return false;
  return store.getItem(giftStorageKey(childId)) !== giftDateKey(date);
}

/** Record today's claim. Returns false when storage is unavailable. */
export function markGiftClaimed(
  childId: string,
  date: Date = new Date(),
  storage?: StorageLike | null
): boolean {
  const store = readStore(storage);
  if (!store) return false;
  try {
    store.setItem(giftStorageKey(childId), giftDateKey(date));
    return true;
  } catch {
    return false;
  }
}

/** Simple string hash for a deterministic daily pick. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The animal friend featured in today's gift — same for every child, all day. */
export function giftAnimalFor(date: Date = new Date()): AnimalEntry {
  const idx = hashStr(`sky-gift|${giftDateKey(date)}`) % COLLECTION_ANIMALS.length;
  return COLLECTION_ANIMALS[idx];
}
