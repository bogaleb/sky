/**
 * Creative Studio helpers — on-device gallery storage, daily star-bonus
 * bookkeeping, and the coloring-page + stamp catalogs.
 *
 * Everything here is DOM-free so it stays unit-testable (vitest runs in
 * node). Storage is injectable: callers may pass a `StorageLike`; the
 * default resolves to `window.localStorage` in the browser and `null`
 * during SSR.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** A saved piece of kid art. PNG data URLs (draw) or SVG data URLs (color). */
export interface StudioArtwork {
  id: string;
  kind: 'draw' | 'color';
  dataUrl: string;
  createdAt: number;
}

/** Maximum artworks kept per child; oldest are dropped first. */
export const STUDIO_MAX_ITEMS = 24;

/** Daily star bonus for saving art. */
export const STUDIO_DAILY_STAR_BONUS = 5;

export function studioKey(childId: string): string {
  return `sky-studio-${childId}`;
}

export function studioStarsKey(childId: string): string {
  return `sky-studio-stars-${childId}`;
}

/** Local date key `YYYY-MM-DD` in the device timezone. */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function newArtworkId(): string {
  return `art-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isValidArtwork(v: unknown): v is StudioArtwork {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    (o.kind === 'draw' || o.kind === 'color') &&
    typeof o.dataUrl === 'string' &&
    o.dataUrl.startsWith('data:image/') &&
    typeof o.createdAt === 'number'
  );
}

/** Load the child's gallery, newest last. Corrupt data heals to []. */
export function loadGallery(childId: string, store: StorageLike | null = defaultStorage()): StudioArtwork[] {
  if (!store) return [];
  try {
    const raw = store.getItem(studioKey(childId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidArtwork);
  } catch {
    return [];
  }
}

function persistGallery(childId: string, items: StudioArtwork[], store: StorageLike): void {
  try {
    store.setItem(studioKey(childId), JSON.stringify(items));
  } catch {
    /* storage full or unavailable — the in-memory copy still stands */
  }
}

/** Append an artwork, capping at STUDIO_MAX_ITEMS (oldest dropped). Returns the new list. */
export function saveArtwork(
  childId: string,
  artwork: StudioArtwork,
  store: StorageLike | null = defaultStorage()
): StudioArtwork[] {
  const next = [...loadGallery(childId, store), artwork].slice(-STUDIO_MAX_ITEMS);
  if (store) persistGallery(childId, next, store);
  return next;
}

/** Remove one artwork by id. Returns the new list. */
export function deleteArtwork(
  childId: string,
  id: string,
  store: StorageLike | null = defaultStorage()
): StudioArtwork[] {
  const next = loadGallery(childId, store).filter((a) => a.id !== id);
  if (store) persistGallery(childId, next, store);
  return next;
}

/** True when the daily star bonus has not been granted today yet. */
export function shouldAwardDailyStars(childId: string, store: StorageLike | null = defaultStorage()): boolean {
  if (!store) return false;
  try {
    return store.getItem(studioStarsKey(childId)) !== todayKey();
  } catch {
    return false;
  }
}

/** Record that today's star bonus was granted. */
export function markDailyStarsAwarded(childId: string, store: StorageLike | null = defaultStorage()): void {
  if (!store) return;
  try {
    store.setItem(studioStarsKey(childId), todayKey());
  } catch {
    /* best-effort */
  }
}

// ---------------------------------------------------------------------------
// Stamp catalog (metadata only — the canvas painters live in studio.tsx).
// ---------------------------------------------------------------------------

export interface StampDef {
  id: string;
  name: string;
}

export const STAMPS: StampDef[] = [
  { id: 'star', name: 'Star' },
  { id: 'heart', name: 'Heart' },
  { id: 'flower', name: 'Flower' },
  { id: 'fish', name: 'Fish' },
  { id: 'rocket', name: 'Rocket' },
  { id: 'moon', name: 'Moon' },
  { id: 'sun', name: 'Sun' },
  { id: 'cloud', name: 'Cloud' },
  { id: 'tree', name: 'Tree' },
  { id: 'balloon', name: 'Balloon' },
];

// ---------------------------------------------------------------------------
// Coloring pages — original line art, pre-segmented into fillable regions.
// viewBox is 200x200 for every page.
// ---------------------------------------------------------------------------

export interface ColoringRegion {
  id: string;
  shape: 'path' | 'circle' | 'ellipse' | 'rect';
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  rx?: number;
  ry?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ColoringPage {
  id: string;
  title: string;
  regions: ColoringRegion[];
}

export const COLORING_PAGES: ColoringPage[] = [
  {
    id: 'curio-fox',
    title: 'Curio the Fox',
    regions: [
      { id: 'ear-l', shape: 'path', d: 'M64 56 L54 14 L98 40 Z' },
      { id: 'ear-r', shape: 'path', d: 'M136 56 L146 14 L102 40 Z' },
      { id: 'head', shape: 'circle', cx: 100, cy: 86, r: 42 },
      { id: 'muzzle', shape: 'ellipse', cx: 100, cy: 102, rx: 24, ry: 16 },
      { id: 'nose', shape: 'ellipse', cx: 100, cy: 94, rx: 8, ry: 6 },
      { id: 'body', shape: 'ellipse', cx: 100, cy: 168, rx: 34, ry: 24 },
      { id: 'tail', shape: 'path', d: 'M134 168 Q176 158 170 116 Q158 148 130 150 Z' },
    ],
  },
  {
    id: 'luna-owl',
    title: 'Luna the Owl',
    regions: [
      { id: 'tuft-l', shape: 'path', d: 'M66 46 L60 18 L84 34 Z' },
      { id: 'tuft-r', shape: 'path', d: 'M134 46 L140 18 L116 34 Z' },
      { id: 'wing-l', shape: 'ellipse', cx: 62, cy: 112, rx: 14, ry: 30 },
      { id: 'wing-r', shape: 'ellipse', cx: 138, cy: 112, rx: 14, ry: 30 },
      { id: 'body', shape: 'ellipse', cx: 100, cy: 110, rx: 44, ry: 52 },
      { id: 'belly', shape: 'ellipse', cx: 100, cy: 128, rx: 26, ry: 32 },
      { id: 'eye-l', shape: 'circle', cx: 84, cy: 88, r: 13 },
      { id: 'eye-r', shape: 'circle', cx: 116, cy: 88, r: 13 },
      { id: 'beak', shape: 'path', d: 'M94 102 L106 102 L100 112 Z' },
    ],
  },
  {
    id: 'fish',
    title: 'Finley the Fish',
    regions: [
      { id: 'tail', shape: 'path', d: 'M148 100 L184 76 L184 124 Z' },
      { id: 'fin', shape: 'path', d: 'M84 68 Q100 48 118 66 Q100 62 84 68 Z' },
      { id: 'body', shape: 'ellipse', cx: 96, cy: 100, rx: 52, ry: 34 },
      { id: 'stripe-1', shape: 'path', d: 'M108 68 L122 68 L122 132 L108 132 Z' },
      { id: 'stripe-2', shape: 'path', d: 'M130 72 L140 72 L140 128 L130 128 Z' },
      { id: 'eye', shape: 'circle', cx: 66, cy: 92, r: 9 },
    ],
  },
  {
    id: 'rocket',
    title: 'Rocket Ride',
    regions: [
      { id: 'fin-l', shape: 'path', d: 'M72 96 L48 132 L72 128 Z' },
      { id: 'fin-r', shape: 'path', d: 'M128 96 L152 132 L128 128 Z' },
      { id: 'flame-outer', shape: 'path', d: 'M88 112 L100 160 L112 112 Z' },
      { id: 'flame-inner', shape: 'path', d: 'M94 112 L100 138 L106 112 Z' },
      { id: 'body', shape: 'path', d: 'M100 18 C122 50 128 80 128 112 L72 112 C72 80 78 50 100 18 Z' },
      { id: 'window', shape: 'circle', cx: 100, cy: 76, r: 13 },
    ],
  },
  {
    id: 'flower',
    title: 'Sunny Flower',
    regions: [
      { id: 'petal-t', shape: 'circle', cx: 100, cy: 48, r: 17 },
      { id: 'petal-r', shape: 'circle', cx: 132, cy: 80, r: 17 },
      { id: 'petal-b', shape: 'circle', cx: 100, cy: 112, r: 17 },
      { id: 'petal-l', shape: 'circle', cx: 68, cy: 80, r: 17 },
      { id: 'center', shape: 'circle', cx: 100, cy: 80, r: 16 },
      { id: 'stem', shape: 'rect', x: 96, y: 128, width: 8, height: 52 },
      { id: 'leaf', shape: 'ellipse', cx: 78, cy: 152, rx: 16, ry: 9 },
    ],
  },
  {
    id: 'castle',
    title: 'Cloud Castle',
    regions: [
      { id: 'tower-l', shape: 'rect', x: 40, y: 70, width: 34, height: 100 },
      { id: 'tower-r', shape: 'rect', x: 126, y: 70, width: 34, height: 100 },
      { id: 'base', shape: 'rect', x: 52, y: 110, width: 96, height: 60 },
      { id: 'roof-l', shape: 'path', d: 'M36 72 L57 44 L78 72 Z' },
      { id: 'roof-r', shape: 'path', d: 'M122 72 L143 44 L164 72 Z' },
      { id: 'door', shape: 'path', d: 'M88 170 L88 140 Q100 130 112 140 L112 170 Z' },
      { id: 'window', shape: 'circle', cx: 100, cy: 96, r: 9 },
      { id: 'flag', shape: 'path', d: 'M141 46 L141 22 L163 29 L141 36 Z' },
    ],
  },
];

/** Friendly date label for the gallery (e.g. "Sep 25"). */
export function formatArtDate(createdAt: number): string {
  const d = new Date(createdAt);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
