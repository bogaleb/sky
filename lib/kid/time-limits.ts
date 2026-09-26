/**
 * Daily time limits — pure, testable core.
 *
 * The `daily_minutes` column on `parent_settings` is the parent-chosen cap
 * (DB default 30, check constraint 5–180). Today's active play minutes are
 * derived server-side from `learning_events` timestamps — no new tables:
 *
 * - Guided sessions pair `session_start` → `session_complete` milestones by
 *   `session_id` (top-level column, `metadata.sessionId` as fallback).
 * - A started-but-unfinished session counts start → now (open sessions keep
 *   counting, so the limit bites mid-session rather than only after a win).
 * - Free play (Sky Park mini-games, etc.) logs `attempt`/other events with no
 *   session id; those cluster into bursts split by a 10-minute gap, each
 *   burst counting at least 1 minute.
 * - Every block is capped at 90 minutes so an abandoned tab can't eat the
 *   whole day. Only today's local-day events count; a session that started
 *   before midnight counts from midnight.
 *
 * The single source of truth is the server action in
 * `app/actions/time-limits.ts`, which feeds this module DB rows. Clients
 * never compute or store the limit themselves.
 */

export const MIN_DAILY_MINUTES = 5;
export const MAX_DAILY_MINUTES = 180;
export const DEFAULT_DAILY_MINUTES = 30;
/** Per-session/per-burst cap (minutes) — matches the dashboard's 90-min convention. */
export const MAX_COUNTED_MINUTES_PER_BLOCK = 90;
/** Free-play events farther apart than this start a new burst. */
export const BURST_GAP_MS = 10 * 60 * 1000;

export interface TimeLimitStatus {
  limitMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  exhausted: boolean;
}

/** One learning_events row, projected to what the calculator needs. */
export interface PlayEvent {
  eventType: string;
  sessionId: string | null;
  /** metadata.kind for milestone events ('session_start' / 'session_complete' / …). */
  kind: string | null;
  createdAtMs: number;
}

/**
 * Validate a parent-supplied daily limit. Returns the integer minutes, or
 * null when the value is outside the 5–180 range (mirrors the DB check).
 */
export function validateDailyMinutes(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  if (value < MIN_DAILY_MINUTES || value > MAX_DAILY_MINUTES) return null;
  return value;
}

function tzOffsetMs(timeZone: string, at: Date): number {
  const asUtc = Date.parse(at.toLocaleString('en-US', { timeZone: 'UTC' }));
  const asZoned = Date.parse(at.toLocaleString('en-US', { timeZone }));
  return asZoned - asUtc;
}

/**
 * Local-midnight (start of "today" in the family's timezone) as an ISO
 * string. The timezone comes from the client and only chooses the day
 * boundary — it can't create or erase play events. Invalid zones fall back
 * to UTC.
 */
export function startOfLocalDayIso(timeZone: string | undefined, now: Date): string {
  let tz = 'UTC';
  if (typeof timeZone === 'string' && timeZone.length > 0) {
    try {
      // Throws a RangeError for unknown zones.
      new Intl.DateTimeFormat('en-US', { timeZone });
      tz = timeZone;
    } catch {
      tz = 'UTC';
    }
  }
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // YYYY-MM-DD
  const noonUtcMs = Date.parse(`${localDate}T12:00:00Z`);
  const midnightUtcMs = noonUtcMs - 12 * 3600_000 - tzOffsetMs(tz, new Date(noonUtcMs));
  return new Date(midnightUtcMs).toISOString();
}

/**
 * Active play minutes from today's events. `dayStartMs` is the local-day
 * boundary (from `startOfLocalDayIso`); `nowMs` caps open sessions.
 */
export function computeActivePlayMinutes(
  events: PlayEvent[],
  nowMs: number,
  dayStartMs: number,
): number {
  const starts = new Map<string, number>();
  const ends = new Map<string, number>();
  const free: number[] = [];

  for (const e of events) {
    if (e.eventType === 'reward_error') continue; // observability, not play
    const t = Math.min(e.createdAtMs, nowMs);
    if (t < dayStartMs) continue;
    if (e.eventType === 'milestone' && e.sessionId) {
      if (e.kind === 'session_start') {
        const prev = starts.get(e.sessionId);
        if (prev === undefined || t < prev) starts.set(e.sessionId, t);
      } else if (e.kind === 'session_complete') {
        const prev = ends.get(e.sessionId);
        if (prev === undefined || t > prev) ends.set(e.sessionId, t);
      } else {
        free.push(t);
      }
    } else {
      free.push(t);
    }
  }

  let total = 0;
  // Guided sessions: start → complete (or now when still open).
  for (const [sid, start] of starts) {
    const end = ends.get(sid) ?? nowMs;
    const s = Math.max(start, dayStartMs);
    if (end > s) {
      total += Math.min(MAX_COUNTED_MINUTES_PER_BLOCK, Math.round((end - s) / 60000));
    }
  }
  // Completed sessions whose start predates today: count today's portion.
  for (const [sid, end] of ends) {
    if (starts.has(sid)) continue;
    if (end > dayStartMs) {
      total += Math.min(MAX_COUNTED_MINUTES_PER_BLOCK, Math.round((end - dayStartMs) / 60000));
    }
  }
  // Free play: cluster session-less events into bursts.
  free.sort((a, b) => a - b);
  let burstStart = -1;
  let burstLast = -1;
  const closeBurst = () => {
    if (burstStart >= 0) {
      total += Math.min(
        MAX_COUNTED_MINUTES_PER_BLOCK,
        Math.max(1, Math.round((burstLast - burstStart) / 60000)),
      );
    }
  };
  for (const t of free) {
    if (burstStart < 0) {
      burstStart = t;
      burstLast = t;
    } else if (t - burstLast > BURST_GAP_MS) {
      closeBurst();
      burstStart = t;
      burstLast = t;
    } else {
      burstLast = t;
    }
  }
  closeBurst();
  return total;
}

export function buildTimeLimitStatus(limitMinutes: number, usedMinutes: number): TimeLimitStatus {
  const used = Math.max(0, Math.round(usedMinutes));
  return {
    limitMinutes,
    usedMinutes: used,
    remainingMinutes: Math.max(0, limitMinutes - used),
    exhausted: used >= limitMinutes,
  };
}

/* ------------------------------------------------------------------ */
/* Time-limit wind-down copy (kid-facing).                              */
/* Warm and encouraging, no emoji — rendered at text-xl/text-2xl in    */
/* components/kid/bedtime.tsx (TimeLimitWindDown).                      */
/* ------------------------------------------------------------------ */

export const TIME_LIMIT_WINDDOWN_COPY = {
  heading: (nickname: string) => `What a wonderful day of learning, ${nickname}!`,
  body1:
    "You've used all of today's learning time — and you should feel really proud of everything you practiced.",
  body2:
    'Now it is time to rest your bright eyes. You can pick a cozy story, listen to a gentle song, or head off on a real-world adventure. We will be right here tomorrow for more fun.',
  cozyButton: 'Wind down with Luna',
  doneButton: 'Done for now',
  spoken: (nickname: string) =>
    `What a wonderful day of learning, ${nickname}! You used all of today's learning time, and I am so proud of you. Now let's wind down together.`,
} as const;
