// Gating: age filtering and prerequisite checks.
//
// A skill is available when every prerequisite is met: the required skill
// has a mastery row whose currentLevel reaches the required level. A skill
// with no prerequisites is always available.

import type {
  AgeBand,
  MasteryState,
  Prerequisite,
  SkillInfo,
} from './types';

const BAND_RANK: Record<AgeBand, number> = { '3-4': 0, '5-6': 1, '7-8': 2 };

export function bandRank(band: AgeBand): number {
  return BAND_RANK[band];
}

/** An activity fits the child when the child's band is inside its band range. */
export function activityFitsAge(
  activity: { minAgeBand: AgeBand; maxAgeBand: AgeBand },
  ageBand: AgeBand
): boolean {
  return (
    bandRank(activity.minAgeBand) <= bandRank(ageBand) &&
    bandRank(ageBand) <= bandRank(activity.maxAgeBand)
  );
}

export function prerequisitesMet(
  skillId: string,
  mastery: Map<string, MasteryState>,
  prerequisites: Prerequisite[]
): boolean {
  for (const p of prerequisites) {
    if (p.skillId !== skillId) continue;
    const m = mastery.get(p.requiresSkillId);
    if (!m || m.currentLevel < p.requiresLevel) return false;
  }
  return true;
}

export function availableSkills(
  skills: SkillInfo[],
  mastery: Map<string, MasteryState>,
  prerequisites: Prerequisite[]
): SkillInfo[] {
  return skills.filter((s) => prerequisitesMet(s.id, mastery, prerequisites));
}
