import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { createClient } from './supabase/server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Server-enforced parent zone.
 *
 * The child plays inside the parent's signed-in session on a shared iPad, so
 * "signed in" is not proof that a grown-up is present. Unlocking the zone
 * requires the PIN: unlock_parent_zone() verifies it and stores the SHA-256
 * of a random per-device token; the raw token lives only in an httpOnly
 * cookie. Parent-only server actions call requireParentZone(), so tapping
 * around the client (or calling actions directly) cannot reach parent data
 * or settings without the PIN. Grants expire after 20 minutes.
 */

export const PARENT_ZONE_COOKIE = 'sky_parent_zone';
const ZONE_MAX_AGE_S = 20 * 60;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function zoneTokenHash(): Promise<string | null> {
  const token = (await cookies()).get(PARENT_ZONE_COOKIE)?.value;
  return token && /^[A-Za-z0-9_-]{32,128}$/.test(token) ? hashToken(token) : null;
}

/** Verify the PIN and, on success, bind a zone grant to this device. */
export async function unlockParentZone(supabase: Supabase, pin: string): Promise<boolean> {
  const token = randomBytes(32).toString('base64url');
  const { data, error } = await supabase.rpc('unlock_parent_zone', {
    pin,
    p_token_hash: hashToken(token),
  });
  if (error || data !== true) return false;
  (await cookies()).set(PARENT_ZONE_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: ZONE_MAX_AGE_S,
    secure: process.env.NODE_ENV === 'production',
  });
  return true;
}

export async function isParentZoneUnlocked(supabase: Supabase): Promise<boolean> {
  const hash = await zoneTokenHash();
  if (!hash) return false;
  const { data, error } = await supabase.rpc('parent_zone_is_unlocked', { p_token_hash: hash });
  return !error && data === true;
}

/** Throws unless this device holds a live, PIN-verified zone grant. */
export async function requireParentZone(supabase: Supabase): Promise<void> {
  if (!(await isParentZoneUnlocked(supabase))) throw new Error('Parent zone is locked.');
}

export async function lockParentZone(supabase: Supabase): Promise<void> {
  const hash = await zoneTokenHash();
  if (hash) await supabase.rpc('lock_parent_zone', { p_token_hash: hash });
  (await cookies()).delete(PARENT_ZONE_COOKIE);
}
