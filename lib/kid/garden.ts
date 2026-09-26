/**
 * Growth garden: one plant per subject that grows with real mastery.
 *
 * Replaces "3/5 growing" counters on the kid side with something a
 * pre-reader can see: a seed becomes a sprout, leaves, a bud, and finally a
 * flower as the child masters skills in that subject. Driven only by
 * skill_mastery (so it reflects learning, not time spent or taps).
 * Pure: tested in tests/today-home.test.ts.
 */

export type MasteryStatus = 'emerging' | 'developing' | 'proficient' | 'mastered';

export interface SkillMasterySnapshot {
  code: string;
  subject: string;
  status: MasteryStatus | null; // null = never practiced
  currentLevel: number; // 1–5 (1 when never practiced)
  nextReviewAt: string | null;
  lastPracticedAt: string | null;
}

/** 0 seed, 1 sprout, 2 leaves, 3 bud, 4 bloom. */
export type GrowthStage = 0 | 1 | 2 | 3 | 4;

export interface GardenPlant {
  subject: string;
  stage: GrowthStage;
  /** 0–1 progress toward the next stage (for a subtle fill; 1 at bloom). */
  toNext: number;
  practiced: number;
  mastered: number;
  total: number;
}

const STATUS_POINTS: Record<MasteryStatus, number> = {
  emerging: 1,
  developing: 2,
  proficient: 3,
  mastered: 5,
};

/** Points per skill: status, plus each level climbed above 1. Max 9 (mastered at level 5). */
export function skillPoints(s: SkillMasterySnapshot): number {
  if (!s.status) return 0;
  return STATUS_POINTS[s.status] + Math.max(0, Math.min(5, s.currentLevel) - 1);
}

// Stage thresholds on the subject's average points per skill.
const THRESHOLDS = [0, 0.01, 1.2, 2.6, 4.5] as const;

export function plantFor(subject: string, skills: SkillMasterySnapshot[]): GardenPlant {
  const mine = skills.filter((s) => s.subject === subject);
  const total = mine.length;
  const practiced = mine.filter((s) => s.status !== null).length;
  const mastered = mine.filter((s) => s.status === 'mastered').length;
  if (total === 0 || practiced === 0) {
    return { subject, stage: 0, toNext: 0, practiced, mastered, total };
  }
  const avg = mine.reduce((sum, s) => sum + skillPoints(s), 0) / total;
  let stage: GrowthStage = 1;
  for (let i = THRESHOLDS.length - 1; i >= 1; i--) {
    if (avg >= THRESHOLDS[i]) {
      stage = i as GrowthStage;
      break;
    }
  }
  // Any mastered skill guarantees at least a bud: mastery should always show.
  if (mastered > 0 && stage < 3) stage = 3;
  const toNext =
    stage === 4 ? 1 : Math.max(0, Math.min(1, (avg - THRESHOLDS[stage]) / (THRESHOLDS[stage + 1] - THRESHOLDS[stage])));
  return { subject, stage, toNext, practiced, mastered, total };
}

export function buildGarden(subjects: string[], skills: SkillMasterySnapshot[]): GardenPlant[] {
  return subjects.map((s) => plantFor(s, skills));
}

const STAGE_WORDS = ['a little seed', 'a tiny sprout', 'growing leaves', 'a flower bud', 'in full bloom'];

/** What a plant says when tapped (spoken for pre-readers). */
export function plantLine(subjectName: string, plant: GardenPlant): string {
  if (plant.stage === 0) return `Your ${subjectName} plant is ${STAGE_WORDS[0]}. Play ${subjectName} games to help it grow!`;
  if (plant.stage === 4) return `Wow! Your ${subjectName} flower is ${STAGE_WORDS[4]}! You learned so much.`;
  return `Your ${subjectName} plant is ${STAGE_WORDS[plant.stage]}. Keep practicing to help it bloom!`;
}
