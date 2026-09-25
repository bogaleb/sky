/**
 * Avatar Studio — the customization model for kid-designed avatars.
 * Stored per-child in localStorage (`sky-avatar-{childId}`); corrupt or
 * missing data heals back to DEFAULT_AVATAR.
 */

export const SKIN_TONES = [
  '#FFE3C9',
  '#F6CFA6',
  '#E9B183',
  '#D19A63',
  '#B57A44',
  '#8F5A2E',
  '#6B411F',
  '#4A2C14',
] as const;
export type SkinTone = (typeof SKIN_TONES)[number];

export const EYE_STYLES = ['round', 'happy', 'sleepy', 'starry', 'wink', 'lashes'] as const;
export type EyeStyle = (typeof EYE_STYLES)[number];

export const MOUTH_STYLES = ['smile', 'grin', 'open', 'smirk', 'small-o', 'calm'] as const;
export type MouthStyle = (typeof MOUTH_STYLES)[number];

export const HAIR_STYLES = ['none', 'curly', 'straight', 'spiky', 'buns', 'mohawk'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const HAIR_COLORS = [
  '#2B1D12',
  '#6B411F',
  '#E8B64C',
  '#C2410C',
  '#3B82F6',
  '#8B5CF6',
] as const;
export type HairColor = (typeof HAIR_COLORS)[number];

export const ACCESSORIES = ['none', 'star-clip', 'glasses', 'bow', 'cap', 'earrings'] as const;
export type AccessoryId = (typeof ACCESSORIES)[number];

export interface AvatarHair {
  style: HairStyle;
  color: HairColor;
}

export interface AvatarDesign {
  skin: SkinTone;
  eyes: EyeStyle;
  mouth: MouthStyle;
  hair: AvatarHair;
  accessory: AccessoryId;
}

export const DEFAULT_AVATAR: AvatarDesign = {
  skin: '#F6CFA6',
  eyes: 'round',
  mouth: 'smile',
  hair: { style: 'curly', color: '#2B1D12' },
  accessory: 'none',
};

const includes = <T extends readonly string[]>(arr: T, v: unknown): v is T[number] =>
  typeof v === 'string' && (arr as readonly string[]).includes(v);

/** True when every field of a candidate design is a real option. */
export function validDesign(d: unknown): d is AvatarDesign {
  if (typeof d !== 'object' || d === null) return false;
  const c = d as Record<string, unknown>;
  if (!includes(SKIN_TONES, c.skin)) return false;
  if (!includes(EYE_STYLES, c.eyes)) return false;
  if (!includes(MOUTH_STYLES, c.mouth)) return false;
  if (!includes(ACCESSORIES, c.accessory)) return false;
  const hair = c.hair;
  if (typeof hair !== 'object' || hair === null) return false;
  const h = hair as Record<string, unknown>;
  if (!includes(HAIR_STYLES, h.style)) return false;
  if (!includes(HAIR_COLORS, h.color)) return false;
  return true;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const keyFor = (childId: string) => `sky-avatar-${childId}`;

function storage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    /* SSR or blocked storage */
  }
  return null;
}

/** The child's custom avatar design, or null when they haven't designed one. */
export function loadCustomAvatar(childId: string, store: StorageLike | null = storage()): AvatarDesign | null {
  if (!store) return null;
  try {
    const raw = store.getItem(keyFor(childId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return validDesign(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist a custom avatar design. Throws on invalid designs. */
export function saveCustomAvatar(childId: string, design: AvatarDesign, store: StorageLike | null = storage()): void {
  if (!validDesign(design)) throw new Error('invalid avatar design');
  store?.setItem(keyFor(childId), JSON.stringify(design));
}

/** Forget a custom design (the child falls back to their preset avatar). */
export function clearCustomAvatar(childId: string, store: StorageLike | null = storage()): void {
  try {
    store?.removeItem(keyFor(childId));
  } catch {
    /* best-effort */
  }
}

/** True when the child has a saved custom design. */
export function hasCustomAvatar(childId: string, store: StorageLike | null = storage()): boolean {
  return loadCustomAvatar(childId, store) !== null;
}

/** Randomize every field — the "Surprise me" button. */
export function randomDesign(rand: () => number = Math.random): AvatarDesign {
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  return {
    skin: pick(SKIN_TONES),
    eyes: pick(EYE_STYLES),
    mouth: pick(MOUTH_STYLES),
    hair: { style: pick(HAIR_STYLES), color: pick(HAIR_COLORS) },
    accessory: pick(ACCESSORIES),
  };
}
