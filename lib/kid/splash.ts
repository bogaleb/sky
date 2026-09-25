/**
 * Splash intro session guard. The cinematic intro plays once per browser
 * session; storage access is injectable so tests never touch the real
 * sessionStorage.
 */

export const SPLASH_KEY = 'sky-splash-seen';

type Getter = Pick<Storage, 'getItem'>;
type Setter = Pick<Storage, 'setItem'>;

/** True when the splash should play (not yet seen this session). */
export function shouldShowSplash(storage: Getter | null | undefined): boolean {
  try {
    if (!storage) return true;
    return storage.getItem(SPLASH_KEY) === null;
  } catch {
    return true;
  }
}

/** Record that the splash has played this session. */
export function markSplashSeen(storage: Setter | null | undefined): void {
  try {
    storage?.setItem(SPLASH_KEY, '1');
  } catch {
    /* storage unavailable — the splash simply shows again next time */
  }
}
