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
