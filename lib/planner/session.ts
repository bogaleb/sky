// Adaptive session planner.
//
// Session shape (default 6 activities):
//   1. warmup     — something the child can already do (confidence first)
//   2..n-1. core  — spaced reviews first, then new learning at the child's
//                   level; frustration triggers scaffolding (drop a level)
//                   plus a confidence booster
//   n. cooldown   — a gentle, winnable finish
//
// Variety is enforced three ways: skills already used in this plan score
// lower, subjects already used score slightly lower, and recently played
// activity ids are avoided until the pool is exhausted.

import { activityFitsAge, availableSkills } from './gating';
import { clampLevel, placementLevel } from './placement';
import type {
  ActivityCard,
  AttemptSummary,
  MasteryState,
  PlanReason,
  PlannedActivity,
  PlannerInput,
  SessionPlan,
  SkillInfo,
} from './types';

export const DEFAULT_SESSION_LENGTH = 6;
const FRUSTRATION_WINDOW = 4;
const FRUSTRATION_MISSES = 3;
const RECENT_PRACTICE_MS = 60 * 60 * 1000;
const RECENT_ACTIVITY_MEMORY = 30;

/** True when the last few attempts went badly — time to scaffold, not push. */
export function detectFrustration(recentAttempts: AttemptSummary[]): boolean {
  const window = recentAttempts.slice(0, FRUSTRATION_WINDOW);
  if (window.length < FRUSTRATION_WINDOW) return false;
  return window.filter((a) => !a.isCorrect).length >= FRUSTRATION_MISSES;
}

function reviewDue(m: MasteryState | undefined, now: Date): boolean {
  return !!m?.nextReviewAt && new Date(m.nextReviewAt).getTime() <= now.getTime();
}

function practicedRecently(m: MasteryState | undefined, now: Date): boolean {
  if (!m?.lastPracticedAt) return false;
  return now.getTime() - new Date(m.lastPracticedAt).getTime() < RECENT_PRACTICE_MS;
}

/**
 * Pick one activity for (skill, level): the first by id not recently played
 * and not already in this plan. Falls back to the least-recently-played when
 * the pool is exhausted so the planner never returns a short session while
 * activities exist.
 */
function pickActivity(
  pool: ActivityCard[],
  skillId: string,
  level: number,
  usedActivityIds: Set<string>,
  recentIds: string[]
): ActivityCard | null {
  const cands = pool
    .filter((a) => a.skillId === skillId && a.level === level)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (cands.length === 0) return null;
  const fresh = cands.find((a) => !usedActivityIds.has(a.id) && !recentIds.includes(a.id));
  if (fresh) return fresh;
  const rank = (id: string) => {
    const i = recentIds.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...cands].sort((a, b) => rank(b.id) - rank(a.id))[0] ?? null;
}

function masteryOf(input: PlannerInput, skillId: string): MasteryState | undefined {
  return input.mastery.get(skillId);
}

function pickWarmup(
  skills: SkillInfo[],
  input: PlannerInput,
  pool: ActivityCard[],
  usedActivityIds: Set<string>,
  recentIds: string[],
  excludeSkillIds: Set<string> = new Set()
): { skill: SkillInfo; activity: ActivityCard; targetLevel: number } | null {
  // Prefer a known skill (developing+) one level below current — an easy win.
  // Skills already used in this plan are deprioritized but not excluded.
  const known = skills
    .map((s) => ({ s, m: masteryOf(input, s.id) }))
    .filter(
      (x): x is { s: SkillInfo; m: MasteryState } =>
        !!x.m &&
        (x.m.status === 'developing' || x.m.status === 'proficient' || x.m.status === 'mastered')
    )
    .sort(
      (a, b) =>
        (excludeSkillIds.has(a.s.id) ? 1 : 0) - (excludeSkillIds.has(b.s.id) ? 1 : 0) ||
        b.m.correct - a.m.correct
    );
  for (const { s, m } of known) {
    const level = clampLevel(m.currentLevel - 1);
    const activity = pickActivity(pool, s.id, level, usedActivityIds, recentIds);
    if (activity) return { skill: s, activity, targetLevel: level };
  }
  // Fallback: easiest available skill at placement level.
  const ordered = [...skills].sort(
    (a, b) => (excludeSkillIds.has(a.id) ? 1 : 0) - (excludeSkillIds.has(b.id) ? 1 : 0)
  );
  for (const s of ordered) {
    const level = placementLevel(masteryOf(input, s.id), input.childAgeBand);
    const activity = pickActivity(pool, s.id, level, usedActivityIds, recentIds);
    if (activity) return { skill: s, activity, targetLevel: level };
  }
  return null;
}

interface CorePick {
  skill: SkillInfo;
  reason: PlanReason;
  targetLevel: number;
}

function pickCore(
  skills: SkillInfo[],
  input: PlannerInput,
  opts: {
    now: Date;
    /** skillId -> times already picked in this plan (warmup + core so far). */
    pickCounts: Map<string, number>;
    usedSubjects: Set<string>;
    frustrated: boolean;
  }
): CorePick | null {
  const scored: Array<{ skill: SkillInfo; reason: PlanReason; score: number; due: boolean }> = [];
  for (const skill of skills) {
    const m = masteryOf(input, skill.id);
    if (m?.status === 'mastered' && !reviewDue(m, opts.now)) continue;
    const due = reviewDue(m, opts.now);
    let score = 0;
    let reason: PlanReason = 'new_learning';
    if (due) {
      score += 100;
      reason = 'review';
    } else if (!m) {
      score += 50;
    } else if (m.status === 'emerging') {
      score += 30;
    } else if (m.status === 'developing') {
      score += 20;
    } else if (m.status === 'proficient') {
      score += 10;
    }
    if (practicedRecently(m, opts.now)) score -= 50;
    // Variety: repeats in this plan score lower, escalating per repeat.
    score -= 60 * (opts.pickCounts.get(skill.id) ?? 0);
    if (opts.usedSubjects.has(skill.subjectCode)) score -= 15;
    scored.push({ skill, reason, score, due });
  }
  // Spaced-review priority: due skills always sort before non-due ones.
  scored.sort(
    (a, b) =>
      (b.due ? 1 : 0) - (a.due ? 1 : 0) ||
      b.score - a.score ||
      (opts.pickCounts.get(a.skill.id) ?? 0) - (opts.pickCounts.get(b.skill.id) ?? 0) ||
      (a.skill.code < b.skill.code ? -1 : 1)
  );
  const winner = scored[0];
  if (!winner) return null;
  let targetLevel = placementLevel(masteryOf(input, winner.skill.id), input.childAgeBand);
  if (opts.frustrated && winner.reason === 'new_learning') {
    targetLevel = Math.max(1, targetLevel - 1);
  }
  return { skill: winner.skill, reason: winner.reason, targetLevel: clampLevel(targetLevel) };
}

function pickConfidence(
  skills: SkillInfo[],
  input: PlannerInput,
  pool: ActivityCard[],
  usedActivityIds: Set<string>,
  recentIds: string[]
): CorePick | null {
  // A winnable activity: best-accuracy known skill, one level down.
  const known = skills
    .map((s) => ({ s, m: masteryOf(input, s.id) }))
    .filter((x): x is { s: SkillInfo; m: MasteryState } => !!x.m && x.m.attempts > 0)
    .sort(
      (a, b) => b.m.correct / Math.max(1, b.m.attempts) - a.m.correct / Math.max(1, a.m.attempts)
    );
  for (const { s, m } of known) {
    const level = clampLevel(m.currentLevel - 1);
    if (pickActivity(pool, s.id, level, usedActivityIds, recentIds)) {
      return { skill: s, reason: 'confidence', targetLevel: level };
    }
  }
  return null;
}

export interface PlanOptions {
  sessionLength?: number;
}

export function planSession(input: PlannerInput, options: PlanOptions = {}): SessionPlan {
  const notes: string[] = [];
  const sessionLength = Math.max(1, Math.min(12, options.sessionLength ?? DEFAULT_SESSION_LENGTH));
  const { now } = input;

  const pool = input.activities.filter((a) => activityFitsAge(a, input.childAgeBand));
  const skills = availableSkills(input.skills, input.mastery, input.prerequisites);
  if (skills.length === 0 || pool.length === 0) {
    return {
      activities: [],
      notes: ['No available skills or activities for this child right now.'],
      frustrated: false,
    };
  }

  const frustrated = detectFrustration(input.recentAttempts);
  if (frustrated) notes.push('Recent misses detected — scaffolding with easier activities.');

  const recentIds = input.recentAttempts.slice(0, RECENT_ACTIVITY_MEMORY).map((a) => a.activityId);
  const planned: PlannedActivity[] = [];
  const pickCounts = new Map<string, number>();
  const usedSubjects = new Set<string>();
  const usedActivityIds = new Set<string>();

  const commit = (skill: SkillInfo, activity: ActivityCard, reason: PlanReason, targetLevel: number): void => {
    planned.push({ activity, reason, targetLevel });
    usedActivityIds.add(activity.id);
    pickCounts.set(skill.id, (pickCounts.get(skill.id) ?? 0) + 1);
    usedSubjects.add(skill.subjectCode);
  };

  const warmupSkillIds = new Set<string>();

  // ---- warmup (skip for very short sessions) ----
  if (sessionLength > 1) {
    const w = pickWarmup(skills, input, pool, usedActivityIds, recentIds);
    if (w) {
      commit(w.skill, w.activity, 'warmup', w.targetLevel);
      warmupSkillIds.add(w.skill.id);
    }
  }

  // ---- core slots: picks commit immediately so variety state stays current ----
  const coreSlots =
    sessionLength <= 1 ? 1 : sessionLength === 2 ? Math.max(0, 2 - planned.length) : sessionLength - 2;
  let confidenceAdded = false;
  for (let i = 0; i < coreSlots; i++) {
    if (frustrated && !confidenceAdded && i === Math.floor(coreSlots / 2)) {
      const booster = pickConfidence(skills, input, pool, usedActivityIds, recentIds);
      if (booster) {
        const activity = pickActivity(pool, booster.skill.id, booster.targetLevel, usedActivityIds, recentIds);
        if (activity) {
          commit(booster.skill, activity, 'confidence', booster.targetLevel);
          confidenceAdded = true;
          continue;
        }
      }
    }
    const c = pickCore(skills, input, { now, pickCounts, usedSubjects, frustrated });
    if (!c) break;
    const activity = pickActivity(pool, c.skill.id, c.targetLevel, usedActivityIds, recentIds);
    if (activity) commit(c.skill, activity, c.reason, c.targetLevel);
  }

  // ---- cooldown: gentle finish, preferably a different skill than warmup ----
  if (sessionLength > 2) {
    const c = pickWarmup(skills, input, pool, usedActivityIds, recentIds, warmupSkillIds);
    if (c) commit(c.skill, c.activity, 'cooldown', c.targetLevel);
  }

  if (planned.length === 0) {
    notes.push('Could not assemble any activities from the available pool.');
  }
  return { activities: planned, notes, frustrated };
}
