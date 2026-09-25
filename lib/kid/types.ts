/**
 * Kid-facing types for the session player. Everything here is client-safe:
 * answer keys never leave the server (see fetch_activity_card).
 */

/** The answer-stripped card returned by fetch_activity_card. */
export interface ResolvedCard {
  id: string;
  skill_id: string;
  level: number;
  kind: ActivityKind;
  prompt_text: string;
  prompt_audio: string | null;
  card: CardPayload;
  points: number;
}

export type ActivityKind =
  | 'multiple_choice'
  | 'tap_target'
  | 'tap_count'
  | 'sequence'
  | 'sort'
  | 'trace'
  | 'listen_repeat';

export interface CardOption {
  id: string;
  label: string;
}

export interface CountObject {
  id: string;
  shape: string;
}

export interface SortGroup {
  id: string;
  label: string;
}

export type CardPayload =
  | { options: CardOption[]; narration: string } // multiple_choice
  | { targets: CardOption[]; narration: string } // tap_target
  | { objects: CountObject[]; narration: string } // tap_count
  | { items: CardOption[]; narration: string } // sequence
  | { items: CardOption[]; groups: SortGroup[]; narration: string } // sort
  | { target: string; style: string; narration: string } // trace
  | { script: string; narration: string }; // listen_repeat

export type PlanReason =
  | 'warmup'
  | 'review'
  | 'new_learning'
  | 'confidence'
  | 'cooldown';

/** One planned activity, enriched for display. */
export interface PlannedStep {
  activityId: string;
  kind: ActivityKind;
  reason: PlanReason;
  targetLevel: number;
  points: number;
  card: ResolvedCard;
  skillName: string;
  subjectCode: string;
  subjectName: string;
  islandName: string;
  hostCharacter: string;
}

export interface AttemptResult {
  correct: boolean;
  pointsEarned: number;
  streak: number;
  status: string;
  currentLevel: number;
  leveledUp: boolean;
}

export interface SessionChild {
  id: string;
  nickname: string;
  avatarId: string;
}

/** Shape of SessionPlanResult['plan'] items from the server action. */
export interface ServerPlanItem {
  activity: { id: string; kind: string; level: number; points: number };
  reason: PlanReason;
  targetLevel: number;
  card: unknown;
  skillName: string;
  subjectCode: string;
  subjectName: string;
  islandName: string;
  hostCharacter: string;
}

export function toPlannedStep(item: ServerPlanItem): PlannedStep {
  return {
    activityId: item.activity.id,
    kind: item.activity.kind as ActivityKind,
    reason: item.reason,
    targetLevel: item.targetLevel,
    points: item.activity.points,
    card: item.card as ResolvedCard,
    skillName: item.skillName,
    subjectCode: item.subjectCode,
    subjectName: item.subjectName,
    islandName: item.islandName,
    hostCharacter: item.hostCharacter,
  };
}
