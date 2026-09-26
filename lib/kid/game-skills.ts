/**
 * Skill codes the Sky Park games report practice against.
 *
 * Every code here must exist in the `skills` taxonomy (the migrations seed
 * them; tests/game-skills.test.ts enforces it), because record_game_attempts
 * rejects unknown skills. Games report through useGameSession().recordAnswer,
 * which feeds the same skill_mastery / spaced-repetition rules as the
 * server-graded activity bank — so the parent report reflects real play.
 */

export const GAME_SKILL_CODES = [
  // reading
  'alphabet',
  'letter_sounds',
  'blending',
  'sight_words',
  'sentences',
  'rhyming',
  'vocabulary',
  // writing
  'trace_letters',
  'build_words',
  'write_sentences',
  // math
  'count',
  'cardinality',
  'compare_order',
  'add',
  'subtract',
  'shapes_patterns',
  'fractions',
  'telling_time',
  'money',
  'measurement',
  // geography
  'continents_oceans',
  'landmarks',
  'world_animals',
  'cultures',
  // coding
  'sequencing',
  'loops',
  'debugging',
  // science
  'experiments',
  'animals_habitats',
  'weather',
  'plants',
  'human_body',
  // music
  'rhythm',
  'pitch',
  // feelings
  'emotions',
  'calm_down',
  'attention',
] as const;

export type GameSkillCode = (typeof GAME_SKILL_CODES)[number];

export function isGameSkillCode(code: string): code is GameSkillCode {
  return (GAME_SKILL_CODES as readonly string[]).includes(code);
}

/** One answered item, as sent to record_game_attempts. */
export interface GameAttempt {
  skill: GameSkillCode;
  correct: boolean;
  /** Difficulty of the item on the skill's 1–5 scale. Omit when unknown (counted as 1). */
  level?: number;
  latency_ms?: number;
}

/** Max items per server call (the RPC enforces 50). */
export const GAME_ATTEMPT_BATCH = 50;
/** The shell flushes once this many answers are buffered. */
export const GAME_ATTEMPT_FLUSH_AT = 6;
