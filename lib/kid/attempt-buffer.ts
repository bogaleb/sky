import { GAME_ATTEMPT_BATCH, GAME_ATTEMPT_FLUSH_AT, type GameAttempt } from './game-skills';

/**
 * Client-side buffer for per-answer game evidence. Answers arrive every few
 * seconds; sending each one is wasteful on classroom / home Wi-Fi, so they
 * are batched and flushed when the buffer fills, when a round completes, and
 * when the page is hidden or the game unmounts.
 *
 * A failed send puts the batch back (up to one batch of backlog) so a brief
 * network blip does not lose practice data. Pure and DOM-free for tests.
 */

export interface AttemptBufferOptions {
  send: (attempts: GameAttempt[]) => Promise<unknown>;
  onError?: (err: unknown) => void;
  flushAt?: number;
  /** Clock for latency; injectable for tests. */
  now?: () => number;
}

/** Gaps longer than this are breaks, not thinking time. */
const MAX_LATENCY_MS = 120_000;

export function createAttemptBuffer({
  send,
  onError,
  flushAt = GAME_ATTEMPT_FLUSH_AT,
  now = () => Date.now(),
}: AttemptBufferOptions) {
  let pending: GameAttempt[] = [];
  let inFlight: Promise<void> | null = null;
  let lastAt = now();

  async function flush(): Promise<void> {
    if (inFlight) await inFlight;
    if (pending.length === 0) return;
    const batch = pending.slice(0, GAME_ATTEMPT_BATCH);
    pending = pending.slice(batch.length);
    inFlight = (async () => {
      try {
        await send(batch);
      } catch (err) {
        // Keep at most one batch of backlog so a dead network can't grow memory.
        pending = [...batch, ...pending].slice(-GAME_ATTEMPT_BATCH);
        onError?.(err);
      } finally {
        inFlight = null;
      }
    })();
    await inFlight;
  }

  return {
    add(attempt: Omit<GameAttempt, 'latency_ms'>): void {
      const t = now();
      const gap = t - lastAt;
      lastAt = t;
      pending.push(gap >= 0 && gap <= MAX_LATENCY_MS ? { ...attempt, latency_ms: gap } : { ...attempt });
      if (pending.length >= flushAt) void flush();
    },
    /** Restart the latency clock (e.g. when a new round begins). */
    markStart(): void {
      lastAt = now();
    },
    flush,
    get size(): number {
      return pending.length;
    },
  };
}

export type AttemptBuffer = ReturnType<typeof createAttemptBuffer>;
