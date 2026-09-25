/**
 * Reward-error reporting — Wave 10 honesty track.
 *
 * When a reward step (awardStars, bumpQuestProgress, awardStickers,
 * checkTrophies, logLearningEvent) throws AFTER the child has already seen
 * their celebration, the failure used to vanish into `.catch(() => {})`.
 * This module buffers those failures client-side and flushes them to the
 * `reward_error` learning-event kind (see app/actions/learning.ts), so a
 * parent or developer can see that stars were celebrated but never landed.
 *
 * CONTRACT FOR TRACK 1 (game-shell.tsx):
 *   import { reportRewardError } from '@/lib/kid/reward-errors';
 *   // inside each reward catch block:
 *   reportRewardError(childId, 'awardStars', err);
 * The `step` is a short label like 'awardStars' | 'quest' | 'stickers' |
 * 'trophies' | 'milestone'. `err` may be anything; it is stringified safely.
 *
 * Design notes:
 * - Ring buffer capped at MAX_BUFFERED_REWARD_ERRORS (oldest dropped first)
 *   so a pathological loop can't grow memory or spam the event table.
 * - Flush is scheduled once per tick (microtask-ish via setTimeout 0) and
 *   drains the whole buffer; every network call is best-effort.
 * - createRewardErrorBuffer() is exported for unit tests (DOM-free).
 */

export interface RewardErrorEntry {
  childId: string;
  step: string;
  message: string;
  at: number;
}

/** Hard cap on buffered entries — oldest entries are dropped first. */
export const MAX_BUFFERED_REWARD_ERRORS = 20;

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message || err.name;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err) ?? 'unknown error';
  } catch {
    return 'unknown error';
  }
}

export function createRewardErrorBuffer() {
  const entries: RewardErrorEntry[] = [];
  return {
    push(childId: string, step: string, err: unknown): number {
      entries.push({
        childId,
        step: String(step).slice(0, 64),
        message: messageOf(err).slice(0, 500),
        at: Date.now(),
      });
      while (entries.length > MAX_BUFFERED_REWARD_ERRORS) entries.shift();
      return entries.length;
    },
    drain(): RewardErrorEntry[] {
      return entries.splice(0, entries.length);
    },
    size(): number {
      return entries.length;
    },
  };
}

export type RewardErrorBuffer = ReturnType<typeof createRewardErrorBuffer>;

const shared = createRewardErrorBuffer();
let flushScheduled = false;

// Dynamic import on purpose: a static import of the server action would drag
// `server-only` (via lib/supabase/server) into every client bundle AND break
// unit tests. Next.js turns this into a server call from client components.
async function flushEntry(e: RewardErrorEntry): Promise<void> {
  try {
    const { logRewardError } = await import('@/app/actions/learning');
    await logRewardError(e.childId, e.step, e.message);
  } catch {
    /* observability must never break gameplay */
  }
}

function scheduleFlush(): void {
  if (flushScheduled) return;
  flushScheduled = true;
  setTimeout(() => {
    flushScheduled = false;
    const batch = shared.drain();
    // logRewardError never throws; fire-and-forget per entry.
    for (const e of batch) void flushEntry(e);
  }, 0);
}

/**
 * Report a reward-pipeline failure. Safe to call from any catch block —
 * never throws, never blocks rendering.
 */
export function reportRewardError(childId: string, step: string, err: unknown): void {
  try {
    shared.push(childId, step, err);
    scheduleFlush();
  } catch {
    /* reporting a reporting failure would be poetry, not engineering */
  }
}
