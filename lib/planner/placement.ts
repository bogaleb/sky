// Playful placement: where a child starts on a skill.
//
// There is no scary test. A child who has never tried a skill starts at the
// bottom and the adaptive loop (submit_attempt levels up after 8 correct at
// >=80%) moves them quickly. A 7-8 year old starts one rung up so the first
// minutes don't feel babyish.

import type { AgeBand, MasteryState } from './types';

export function placementLevel(
  mastery: MasteryState | undefined,
  ageBand: AgeBand
): number {
  if (mastery) return clampLevel(mastery.currentLevel);
  return ageBand === '7-8' ? 2 : 1;
}

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(5, Math.max(1, Math.round(level)));
}
