/**
 * Weekly learning goals — pure helpers. The server actions live in
 * app/actions/goals.ts; everything testable lives here.
 */

export interface GoalProgress {
  /** Weekly activity target set by the parent. */
  target: number;
  /** Activities attempted since the start of the current week. */
  completed: number;
  /** Monday of the current week, YYYY-MM-DD. */
  weekStart: string;
  /** Whether the goal completion has already been celebrated. */
  celebrated: boolean;
}

/** Monday (00:00 UTC) of the week containing `now`, as YYYY-MM-DD. */
export function weekStartMonday(now: Date = new Date()): string {
  const d = new Date(now);
  const diff = (d.getDay() + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** Clamp a parent-chosen target into the sane 1..20 range. */
export function clampTarget(target: number): number {
  if (!Number.isFinite(target)) return 5;
  return Math.min(20, Math.max(1, Math.round(target)));
}

/** Pure completion check. */
export function goalReached(completed: number, target: number): boolean {
  return target > 0 && completed >= target;
}
