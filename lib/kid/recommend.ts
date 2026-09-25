/**
 * Up Next — adaptive recommendations for the Sky map.
 *
 * Pure, deterministic recommendation logic. Given per-skill mastery
 * signals and the child's trail state, it returns up to 3
 * kid-facing recommendations:
 *
 *  1. Trail first: if a trail quest is available and none was done
 *     today, continuing the Adventure Trail is the top suggestion.
 *  2. Practice: the lowest-mastery skills the child has already
 *     attempted, boosted by spaced repetition (stale skills —
 *     unpracticed for 3+ days or past their review date — rank
 *     higher). Capped at 2. Skills with 0 attempts are never
 *     suggested: the trail introduces new skills first (no spoilers).
 *  3. Replay: when every attempted skill is mastered, suggest
 *     replaying a favorite game.
 *
 * Deterministic: same input + same `now` always yields the same
 * output. `now` defaults to Date.now() and is injectable for tests.
 */

import { getIsland } from './islands';
import { getCharacter } from './characters';

/** One skill's learning state, as read from skill_mastery. */
export interface MasterySignal {
  skillId: string;
  /** Subject code (island id), e.g. 'math', 'reading'. */
  islandId: string;
  /** 0 (nothing right yet) to 1 (mastered). */
  mastery: number;
  /** ISO timestamp of the last attempt, or null if unknown. */
  lastPracticedAt: string | null;
  /** Total graded attempts on this skill. */
  attempts: number;
  /** Spaced-repetition review timestamp, when the planner set one. */
  nextReviewAt?: string | null;
}

export interface TrailSignal {
  nextStopAvailable: boolean;
  trailDoneToday: boolean;
  /** Subject code of the next trail stop, when known. */
  stopIslandId?: string;
}

export interface RecommendInput {
  mastery: MasterySignal[];
  trail: TrailSignal;
  /** Epoch ms used for recency math. Defaults to Date.now(). */
  now?: number;
}

export type RecommendationKind = 'trail' | 'practice' | 'replay';

export interface Recommendation {
  kind: RecommendationKind;
  title: string;
  detail: string;
  islandId?: string;
  skillId?: string;
  /** Favorite game to replay (replay recommendations only). */
  gameId?: 'memory' | 'pattern';
}

export const MAX_RECOMMENDATIONS = 3;
export const PRACTICE_CAP = 2;
/** A skill is "stale" (due for spaced repetition) after this long. */
export const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
/** Score boost applied to stale skills so they outrank fresh equals. */
export const STALE_BOOST = 0.3;

function isStale(signal: MasterySignal, now: number): boolean {
  if (!signal.lastPracticedAt) return true;
  const last = Date.parse(signal.lastPracticedAt);
  if (Number.isNaN(last)) return true;
  if (now - last >= STALE_AFTER_MS) return true;
  if (signal.nextReviewAt) {
    const review = Date.parse(signal.nextReviewAt);
    if (!Number.isNaN(review) && review <= now) return true;
  }
  return false;
}

/** Lower score = needs practice more. Stale skills get a boost. */
function practiceScore(signal: MasterySignal, now: number): number {
  return signal.mastery - (isStale(signal, now) ? STALE_BOOST : 0);
}

function trailRecommendation(stopIslandId: string | undefined): Recommendation {
  const island = stopIslandId ? getIsland(stopIslandId) : null;
  return {
    kind: 'trail',
    title: 'Continue the Adventure Trail',
    detail: island ? `Your next quest is on ${island.islandName}!` : 'Your next quest is ready!',
    ...(stopIslandId ? { islandId: stopIslandId } : {}),
  };
}

function practiceRecommendation(signal: MasterySignal): Recommendation {
  const island = getIsland(signal.islandId);
  const host = getCharacter(island.hostCharacter);
  return {
    kind: 'practice',
    title: `${island.subjectName} practice`,
    detail: `Keep growing with ${host.name}!`,
    islandId: signal.islandId,
    skillId: signal.skillId,
  };
}

function replayRecommendation(): Recommendation {
  return {
    kind: 'replay',
    title: 'Play Memory Cove!',
    detail: 'You are a matching superstar — play again!',
    gameId: 'memory',
  };
}

export function recommendNext(input: RecommendInput): Recommendation[] {
  const now = input.now ?? Date.now();
  const recs: Recommendation[] = [];

  // (1) Trail first.
  if (input.trail.nextStopAvailable && !input.trail.trailDoneToday) {
    recs.push(trailRecommendation(input.trail.stopIslandId));
  }

  // (2) Practice: attempted-but-not-mastered skills, lowest (boosted)
  // score first. Never suggest un-attempted skills (no spoilers).
  const practiced = input.mastery.filter((s) => s.attempts > 0 && s.mastery < 1);
  const ranked = [...practiced].sort((a, b) => {
    const byScore = practiceScore(a, now) - practiceScore(b, now);
    if (byScore !== 0) return byScore;
    const ta = a.lastPracticedAt ? Date.parse(a.lastPracticedAt) : -Infinity;
    const tb = b.lastPracticedAt ? Date.parse(b.lastPracticedAt) : -Infinity;
    if (ta !== tb) return ta - tb;
    return a.skillId < b.skillId ? -1 : a.skillId > b.skillId ? 1 : 0;
  });
  for (const signal of ranked.slice(0, PRACTICE_CAP)) {
    recs.push(practiceRecommendation(signal));
    if (recs.length >= MAX_RECOMMENDATIONS) break;
  }

  // (3) Replay: everything the child has tried is mastered.
  if (recs.length === 0) {
    const attempted = input.mastery.filter((s) => s.attempts > 0);
    if (attempted.length > 0 && attempted.every((s) => s.mastery >= 1)) {
      recs.push(replayRecommendation());
    }
  }

  return recs;
}
