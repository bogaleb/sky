import { describe, expect, it } from 'vitest';
import { TRAIL, TRAIL_LENGTH, getTrailStop, chapterName, questNumber } from '../lib/kid/trail';
import { dailyQuests, getQuestDef, questDateKey } from '../lib/kid/quests';
import { planSession } from '../lib/planner/session';
import type { PlannerInput } from '../lib/planner/types';

const SKILL_CODES = [
  'alphabet', 'letter_sounds', 'blending', 'sight_words', 'sentences', 'stories',
  'count', 'cardinality', 'compare_order', 'add', 'subtract', 'place_value', 'shapes_patterns', 'fractions',
  'trace_letters', 'build_words', 'write_sentences',
  'plants', 'animals_habitats', 'weather', 'human_body', 'experiments',
  'continents_oceans', 'landmarks', 'world_animals', 'map_skills', 'cultures',
  'sequencing', 'patterns_coding', 'loops', 'conditions', 'debugging',
  'rhythm', 'pitch', 'instruments', 'dance',
  'brush_control', 'coloring', 'shape_drawing', 'scene_composition',
  'emotions', 'breathing', 'calm_down', 'attention',
];

describe('adventure trail', () => {
  it('has 220 stops: 44 skills x 5 levels', () => {
    expect(TRAIL_LENGTH).toBe(220);
    expect(TRAIL.length).toBe(220);
  });

  it('covers every skill at every level exactly once', () => {
    const seen = new Set<string>();
    for (const stop of TRAIL) {
      const key = `${stop.skillCode}:${stop.level}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    for (const code of SKILL_CODES) {
      for (let level = 1; level <= 5; level++) {
        expect(seen.has(`${code}:${level}`)).toBe(true);
      }
    }
  });

  it('is ordered level-major (difficulty rises like chapters)', () => {
    for (let i = 1; i < TRAIL.length; i++) {
      expect(TRAIL[i].level).toBeGreaterThanOrEqual(TRAIL[i - 1].level);
    }
  });

  it('every stop has a real quest title, intro, and outro (no placeholders)', () => {
    for (const stop of TRAIL) {
      expect(stop.questTitle.length).toBeGreaterThan(3);
      expect(stop.intro.length).toBeGreaterThan(10);
      expect(stop.outro.length).toBeGreaterThan(10);
      expect(stop.questTitle).not.toMatch(/lorem|placeholder|todo/i);
      expect(stop.index).toBeGreaterThanOrEqual(0);
    }
  });

  it('quest titles are unique per skill', () => {
    const titles = TRAIL.filter((s) => s.level === 1).map((s) => s.questTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('getTrailStop clamps out-of-range indexes', () => {
    expect(getTrailStop(-5).index).toBe(0);
    expect(getTrailStop(99999).index).toBe(TRAIL_LENGTH - 1);
    expect(getTrailStop(10).index).toBe(10);
  });

  it('chapter names and quest numbers are 1-based', () => {
    expect(chapterName(1)).toBe('First Steps');
    expect(chapterName(5)).toBe('Master Quests');
    expect(questNumber(0)).toBe(1);
    expect(questNumber(TRAIL_LENGTH - 1)).toBe(TRAIL_LENGTH);
  });
});

describe('daily quests', () => {
  it('picks exactly 3 distinct quests per child per day', () => {
    const qs = dailyQuests('child-123', '2026-09-25');
    expect(qs.length).toBe(3);
    expect(new Set(qs.map((q) => q.id)).size).toBe(3);
  });

  it('is deterministic for the same child + date', () => {
    const a = dailyQuests('child-123', '2026-09-25').map((q) => q.id);
    const b = dailyQuests('child-123', '2026-09-25').map((q) => q.id);
    expect(a).toEqual(b);
  });

  it('varies across children and dates', () => {
    const a = dailyQuests('child-123', '2026-09-25').map((q) => q.id).join(',');
    const b = dailyQuests('child-999', '2026-09-25').map((q) => q.id).join(',');
    const c = dailyQuests('child-123', '2026-09-26').map((q) => q.id).join(',');
    // Extremely unlikely to all collide; at least one must differ.
    expect(a === b && b === c).toBe(false);
  });

  it('every quest def has a positive goal and star reward', () => {
    for (const q of dailyQuests('x', '2026-09-25')) {
      expect(q.goal).toBeGreaterThan(0);
      expect(q.stars).toBeGreaterThan(0);
      expect(getQuestDef(q.id)).toBeDefined();
    }
  });

  it('questDateKey returns YYYY-MM-DD', () => {
    expect(questDateKey(new Date('2026-09-25T14:00:00Z'))).toBe('2026-09-25');
  });
});

describe('planner trail mode', () => {
  function baseInput(): PlannerInput {
    const skills = SKILL_CODES.slice(0, 4).map((code, i) => ({
      id: `skill-${i}`,
      code,
      subjectCode: 'reading',
      name: code,
      ageMin: 3,
      ageMax: 8,
    }));
    const activities = skills.flatMap((s, si) =>
      [1, 2, 3, 4, 5].flatMap((level) =>
        // Mirror the real bank: exactly 4 activities per skill/level.
        [0, 1, 2, 3].map((n) => ({
          id: `act-${si}-${level}-${n}`,
          skillId: s.id,
          level,
          kind: 'multiple_choice',
          promptText: `Prompt ${si} ${level} ${n}`,
          points: 10,
          minAgeBand: '3-4' as const,
          maxAgeBand: '7-8' as const,
        }))
      )
    );
    return {
      childAgeBand: '5-6',
      skills,
      mastery: new Map(),
      prerequisites: [],
      activities,
      recentAttempts: [],
      now: new Date(),
    };
  }

  it('plans all activities from the trail stop skill + level', () => {
    const input = baseInput();
    const plan = planSession(input, {
      sessionLength: 4,
      trailStop: { skillCode: 'alphabet', level: 3 },
    });
    expect(plan.activities.length).toBe(4);
    for (const p of plan.activities) {
      expect(p.activity.skillId).toBe('skill-0');
      expect(p.activity.level).toBe(3);
    }
  });

  it('caps the trail quest at the available activities for the stop', () => {
    const input = baseInput();
    // Asking for more than the bank holds returns what exists (4), not 6.
    const plan = planSession(input, {
      sessionLength: 6,
      trailStop: { skillCode: 'alphabet', level: 3 },
    });
    expect(plan.activities.length).toBe(4);
  });

  it('returns an empty plan for an unknown skill code', () => {
    const plan = planSession(baseInput(), {
      trailStop: { skillCode: 'nope', level: 1 },
    });
    expect(plan.activities.length).toBe(0);
  });
});
