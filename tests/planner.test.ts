// Unit tests for the adaptive planner (lib/planner).
import { describe, expect, it } from 'vitest';
import { activityFitsAge, availableSkills, prerequisitesMet } from '../lib/planner/gating';
import { placementLevel } from '../lib/planner/placement';
import { detectFrustration, planSession } from '../lib/planner/session';
import type {
  ActivityCard,
  AttemptSummary,
  MasteryState,
  PlannerInput,
  SkillInfo,
} from '../lib/planner/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date('2026-09-25T12:00:00Z');

function skill(code: string, subject = 'math', id?: string): SkillInfo {
  return {
    id: id ?? `skill-${code}`,
    code,
    subjectCode: subject,
    name: code,
    ageMin: 3,
    ageMax: 8,
  };
}

function mastery(over: Partial<MasteryState> & { skillId: string }): MasteryState {
  return {
    currentLevel: 1,
    status: 'emerging',
    attempts: 0,
    correct: 0,
    streak: 0,
    lastPracticedAt: null,
    nextReviewAt: null,
    ...over,
  };
}

function activity(skillId: string, level: number, n: number, ageBand: '3-4' | '5-6' | '7-8' = '3-4'): ActivityCard {
  return {
    id: `act-${skillId}-L${level}-${n}`,
    skillId,
    level,
    kind: 'multiple_choice',
    promptText: `Q ${n}`,
    points: 10,
    minAgeBand: '3-4',
    maxAgeBand: ageBand,
  };
}

function attempt(skillId: string, activityId: string, isCorrect: boolean, minutesAgo: number): AttemptSummary {
  return {
    skillId,
    activityId,
    isCorrect,
    createdAt: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString(),
  };
}

function baseInput(over: Partial<PlannerInput> = {}): PlannerInput {
  const skills = [skill('count'), skill('add', 'math'), skill('alphabet', 'reading')];
  const activities: ActivityCard[] = [];
  for (const s of skills) {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let n = 1; n <= 3; n++) activities.push(activity(s.id, lvl, n));
    }
  }
  return {
    childAgeBand: '3-4',
    skills,
    mastery: new Map(),
    prerequisites: [],
    activities,
    recentAttempts: [],
    now: NOW,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// placement
// ---------------------------------------------------------------------------

describe('placementLevel', () => {
  it('starts unstarted skills at level 1 for young children', () => {
    expect(placementLevel(undefined, '3-4')).toBe(1);
    expect(placementLevel(undefined, '5-6')).toBe(1);
  });

  it('starts unstarted skills at level 2 for 7-8 year olds', () => {
    expect(placementLevel(undefined, '7-8')).toBe(2);
  });

  it('returns the current level for started skills', () => {
    expect(placementLevel(mastery({ skillId: 'x', currentLevel: 4 }), '3-4')).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// gating
// ---------------------------------------------------------------------------

describe('activityFitsAge', () => {
  it('accepts activities whose band range includes the child band', () => {
    expect(activityFitsAge({ minAgeBand: '3-4', maxAgeBand: '5-6' }, '3-4')).toBe(true);
    expect(activityFitsAge({ minAgeBand: '3-4', maxAgeBand: '5-6' }, '5-6')).toBe(true);
    expect(activityFitsAge({ minAgeBand: '5-6', maxAgeBand: '7-8' }, '3-4')).toBe(false);
  });
});

describe('prerequisitesMet / availableSkills', () => {
  const prereq = { skillId: 'skill-add', requiresSkillId: 'skill-count', requiresLevel: 2 };

  it('blocks a skill whose prerequisite level is not reached', () => {
    const m = new Map([['skill-count', mastery({ skillId: 'skill-count', currentLevel: 1 })]]);
    expect(prerequisitesMet('skill-add', m, [prereq])).toBe(false);
  });

  it('allows a skill whose prerequisite level is reached', () => {
    const m = new Map([['skill-count', mastery({ skillId: 'skill-count', currentLevel: 2 })]]);
    expect(prerequisitesMet('skill-add', m, [prereq])).toBe(true);
  });

  it('blocks when the prerequisite skill was never attempted', () => {
    expect(prerequisitesMet('skill-add', new Map(), [prereq])).toBe(false);
  });

  it('availableSkills filters out gated skills', () => {
    const input = baseInput();
    const avail = availableSkills(input.skills, new Map(), [prereq]);
    expect(avail.map((s) => s.code).sort()).toEqual(['alphabet', 'count']);
  });
});

// ---------------------------------------------------------------------------
// frustration
// ---------------------------------------------------------------------------

describe('detectFrustration', () => {
  it('is false with too few attempts', () => {
    expect(detectFrustration([attempt('s', 'a', false, 1)])).toBe(false);
  });

  it('is true with 3 misses in the last 4', () => {
    const rs = [
      attempt('s', 'a1', false, 1),
      attempt('s', 'a2', true, 2),
      attempt('s', 'a3', false, 3),
      attempt('s', 'a4', false, 4),
    ];
    expect(detectFrustration(rs)).toBe(true);
  });

  it('is false when the child is succeeding', () => {
    const rs = [
      attempt('s', 'a1', true, 1),
      attempt('s', 'a2', true, 2),
      attempt('s', 'a3', false, 3),
      attempt('s', 'a4', true, 4),
    ];
    expect(detectFrustration(rs)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// planSession
// ---------------------------------------------------------------------------

describe('planSession', () => {
  it('returns an empty plan with a note when nothing is available', () => {
    const plan = planSession(baseInput({ skills: [], activities: [] }));
    expect(plan.activities).toEqual([]);
    expect(plan.notes.length).toBeGreaterThan(0);
  });

  it('builds a full-length session with warmup first and cooldown last', () => {
    const plan = planSession(baseInput(), { sessionLength: 6 });
    expect(plan.activities).toHaveLength(6);
    expect(plan.activities[0].reason).toBe('warmup');
    expect(plan.activities[5].reason).toBe('cooldown');
  });

  it('never repeats an activity id within a session', () => {
    const plan = planSession(baseInput(), { sessionLength: 6 });
    const ids = plan.activities.map((p) => p.activity.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('spreads core picks across skills (variety)', () => {
    const plan = planSession(baseInput(), { sessionLength: 6 });
    const coreSkills = plan.activities
      .filter((p) => p.reason === 'new_learning' || p.reason === 'review')
      .map((p) => p.activity.skillId);
    expect(new Set(coreSkills).size).toBeGreaterThan(1);
  });

  it('prioritizes spaced review: a due skill appears as review', () => {
    const dueMastery = mastery({
      skillId: 'skill-count',
      currentLevel: 2,
      status: 'developing',
      nextReviewAt: new Date(NOW.getTime() - 60_000).toISOString(),
    });
    const input = baseInput({ mastery: new Map([['skill-count', dueMastery]]) });
    const plan = planSession(input, { sessionLength: 4 });
    const reviews = plan.activities.filter((p) => p.reason === 'review');
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].activity.skillId).toBe('skill-count');
  });

  it('does not schedule mastered skills that are not due', () => {
    const m = mastery({ skillId: 'skill-count', currentLevel: 5, status: 'mastered' });
    const input = baseInput({ mastery: new Map([['skill-count', m]]) });
    const plan = planSession(input, { sessionLength: 6 });
    const coreForMastered = plan.activities.filter(
      (p) => p.activity.skillId === 'skill-count' && (p.reason === 'new_learning' || p.reason === 'review')
    );
    expect(coreForMastered).toEqual([]);
  });

  it('scaffolds on frustration: easier levels and a confidence booster', () => {
    const m = mastery({ skillId: 'skill-count', currentLevel: 3, status: 'emerging', attempts: 10, correct: 4 });
    const recent = [
      attempt('skill-count', 'act-x1', false, 1),
      attempt('skill-count', 'act-x2', false, 2),
      attempt('skill-count', 'act-x3', true, 3),
      attempt('skill-count', 'act-x4', false, 4),
    ];
    const input = baseInput({ mastery: new Map([['skill-count', m]]), recentAttempts: recent });
    const plan = planSession(input, { sessionLength: 6 });
    expect(plan.frustrated).toBe(true);
    expect(plan.notes.join(' ')).toMatch(/scaffold/i);
    const booster = plan.activities.find((p) => p.reason === 'confidence');
    expect(booster).toBeDefined();
  });

  it('avoids recently played activities', () => {
    const recent = [attempt('skill-count', 'act-skill-count-L1-1', true, 5)];
    const input = baseInput({ recentAttempts: recent });
    const plan = planSession(input, { sessionLength: 6 });
    const ids = plan.activities.map((p) => p.activity.id);
    expect(ids).not.toContain('act-skill-count-L1-1');
  });

  it('respects prerequisite gating end to end', () => {
    const prereq = { skillId: 'skill-add', requiresSkillId: 'skill-count', requiresLevel: 2 };
    const input = baseInput({ prerequisites: [prereq] });
    const plan = planSession(input, { sessionLength: 6 });
    const addPicks = plan.activities.filter((p) => p.activity.skillId === 'skill-add');
    expect(addPicks).toEqual([]);
  });

  it('plans only within the requested subject when subjectCode is set', () => {
    const plan = planSession(baseInput(), { sessionLength: 6, subjectCode: 'reading' });
    expect(plan.activities.length).toBeGreaterThan(0);
    const skillIds = new Set(plan.activities.map((p) => p.activity.skillId));
    // Only the reading skill exists in fixtures.
    expect(skillIds).toEqual(new Set(['skill-alphabet']));
  });

  it('returns an empty plan with a note for an unknown subjectCode', () => {
    const plan = planSession(baseInput(), { sessionLength: 6, subjectCode: 'nope' });
    expect(plan.activities).toEqual([]);
    expect(plan.notes.length).toBeGreaterThan(0);
  });
});
