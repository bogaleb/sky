// Sky adaptive planner — shared types.
//
// The planner is pure: it takes a snapshot of the child's learning state and
// returns an ordered session plan. No I/O, no randomness, fully testable.
// The server action in app/actions/learning.ts loads the snapshot from
// Supabase and calls planSession().

export type AgeBand = '3-4' | '5-6' | '7-8';

export type MasteryStatus = 'emerging' | 'developing' | 'proficient' | 'mastered';

export interface SkillInfo {
  id: string;
  code: string;
  subjectCode: string;
  name: string;
  ageMin: number;
  ageMax: number;
}

/** One row of public.skill_mastery. Absent from the map = never attempted. */
export interface MasteryState {
  skillId: string;
  currentLevel: number; // 1..5
  status: MasteryStatus;
  attempts: number;
  correct: number;
  streak: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
}

/** One row of public.skill_prerequisites. */
export interface Prerequisite {
  skillId: string;
  requiresSkillId: string;
  requiresLevel: number; // 1..4
}

/** Client-safe activity row (answer keys never leave the server). */
export interface ActivityCard {
  id: string;
  skillId: string;
  level: number; // 1..5
  kind: string;
  promptText: string;
  points: number;
  minAgeBand: AgeBand;
  maxAgeBand: AgeBand;
}

/** A recent attempt, newest first. */
export interface AttemptSummary {
  skillId: string;
  activityId: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface PlannerInput {
  childAgeBand: AgeBand;
  skills: SkillInfo[];
  /** skillId -> mastery row. Missing key = skill never attempted. */
  mastery: Map<string, MasteryState>;
  prerequisites: Prerequisite[];
  /** Full candidate pool; the planner filters by age itself. */
  activities: ActivityCard[];
  /** Newest first; used for frustration detection and variety. */
  recentAttempts: AttemptSummary[];
  now: Date;
}

export type PlanReason =
  | 'warmup' // easy start: a skill the child already knows
  | 'review' // spaced repetition: this skill is due for review
  | 'new_learning' // at the child's current level for this skill
  | 'confidence' // frustration response: a winnable activity
  | 'cooldown'; // gentle finish

export interface PlannedActivity {
  activity: ActivityCard;
  reason: PlanReason;
  /** The level the planner targeted (may differ from activity.level if the pool is thin). */
  targetLevel: number;
}

export interface SessionPlan {
  activities: PlannedActivity[];
  /** Human-readable notes for parent dashboards and debugging. */
  notes: string[];
  frustrated: boolean;
}
