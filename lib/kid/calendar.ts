/**
 * Streak calendar date math. Pure functions — the component fetches the
 * active-day set separately via the read-only calendar server action.
 */

/** YYYY-MM-DD in the viewer's local timezone. */
export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Month grid as weeks of day numbers (1-based), weeks starting Monday.
 * Padding cells are null.
 */
export function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const leading = (firstWeekday + 6) % 7; // blanks before day 1 (Monday start)
  const cells: (number | null)[] = [...Array(leading).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ---------------------------------------------------------------------------
// Forgiving streaks: a missed day never resets the streak to 1. The streak
// pauses ("takes a cozy nap") and resumes when the child comes back — every
// active day still advances it. Grace windows are gentlest for the youngest
// band. Pure functions; recordDailyActivity (app/actions/trail.ts) applies
// them. `last_active_date` / questDateKey are UTC YYYY-MM-DD keys.
// ---------------------------------------------------------------------------

/**
 * Missed days that still continue the streak as rest days. The 3–4 band is
 * the gentlest: any return resumes the streak, no matter the gap.
 */
export function streakGraceDays(ageBand: string | null | undefined): number {
  if (ageBand === '3-4') return 2;
  if (ageBand === '5-6') return 1;
  return 1; // 7–8: streaks keep their classic meaning, but long gaps pause
}

export type StreakTickStatus = 'already' | 'started' | 'continued' | 'rest' | 'resumed';

export interface StreakTick {
  current: number;
  longest: number;
  status: StreakTickStatus;
}

function parseDayKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function gapDays(fromKey: string, toKey: string): number {
  const from = parseDayKey(fromKey);
  const to = parseDayKey(toKey);
  if (!from || !to) return Number.POSITIVE_INFINITY;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/**
 * Next streak state for a new active day. The count is frozen across gaps,
 * never reset to 1: within the grace window the streak continues ('rest');
 * beyond it the streak 'resumes' — paused, not broken — and still advances
 * on the return day.
 */
export function nextStreak(
  current: number,
  longest: number,
  lastActiveKey: string | null,
  todayKey: string,
  graceDays: number,
): StreakTick {
  const safe = Math.max(0, Math.floor(current));
  if (lastActiveKey === todayKey) {
    return { current: safe, longest: Math.max(longest, safe), status: 'already' };
  }
  const next = safe + 1;
  const best = Math.max(longest, next);
  if (!lastActiveKey) return { current: next, longest: best, status: 'started' };
  const gap = gapDays(lastActiveKey, todayKey);
  if (gap === 1) return { current: next, longest: best, status: 'continued' };
  if (gap <= 1 + Math.max(0, graceDays)) return { current: next, longest: best, status: 'rest' };
  return { current: next, longest: best, status: 'resumed' };
}

export type StreakMood = 'today' | 'warm' | 'paused';

/**
 * How the streak feels right now (between active days), for display.
 * 'paused' means frozen — never broken.
 */
export function streakMood(
  lastActiveKey: string | null,
  todayKey: string,
  graceDays: number,
): StreakMood {
  if (!lastActiveKey) return 'paused';
  if (lastActiveKey === todayKey) return 'today';
  return gapDays(lastActiveKey, todayKey) <= 1 + Math.max(0, graceDays) ? 'warm' : 'paused';
}


/**
 * Kid-kind streak copy — no emoji, gentlest wording for the 3–4 band.
 * Covers both the tick statuses and the display moods.
 */
export function streakCopy(
  status: StreakTickStatus | StreakMood,
  streak: number,
  ageBand: string | null | undefined,
): string {
  const little = ageBand === '3-4';
  const dayWord = streak === 1 ? 'day' : 'days';
  switch (status) {
    case 'started':
      return little
        ? 'Your very first learning day — hooray for starting!'
        : 'Day one of your learning streak — what a wonderful start!';
    case 'already':
    case 'today':
      return little
        ? `You learned today — wonderful! ${streak} ${dayWord} and counting.`
        : `${streak}-day streak, and today counts too!`;
    case 'continued':
    case 'warm':
      return little
        ? `Yay! ${streak} ${dayWord} of learning — your streak is growing!`
        : `${streak}-day streak, warm and growing!`;
    case 'rest':
      return little
        ? `Welcome back! Your streak took a cozy rest and is still ${streak} ${dayWord} strong.`
        : `Rested and ready — ${streak}-day streak kept warm!`;
    case 'resumed':
      return little
        ? `You came back! Your streak was napping right here — ${streak} ${dayWord} and growing again.`
        : `Welcome back! Your streak waited for you — ${streak} ${dayWord} strong.`;
    case 'paused':
      return little
        ? 'Your streak is taking a cozy nap — it will be right here when you come back to learn.'
        : 'Your streak is paused, not broken — come back anytime to keep growing it.';
  }
}

