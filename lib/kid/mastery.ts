/**
 * Shared mastery helpers for parent tools (report card, dashboards).
 * Pure functions only — safe to import in tests and client components.
 */

/**
 * Star mapping for the report card: a missing mastery row is 0 stars,
 * otherwise the child's current level clamped to 1-5.
 */
export function starsFromMastery(currentLevel: number | null | undefined): number {
  if (currentLevel == null) return 0;
  return Math.max(1, Math.min(5, Math.round(currentLevel)));
}

/** Display label for a mastery status. */
export function statusLabel(
  status: 'emerging' | 'developing' | 'proficient' | 'mastered' | 'not_started',
): string {
  if (status === 'not_started') return 'Not started yet';
  return status.charAt(0).toUpperCase() + status.slice(1);
}
