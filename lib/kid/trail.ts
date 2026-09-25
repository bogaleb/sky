// Sky Adventure Trail — the guided learning path.
//
// 220 quest stops: 44 skills x 5 levels, ordered level-major so the journey
// rises in difficulty like chapters of a storybook. Each stop is a quest:
// a 6-activity session drawn from that skill + level, framed by a story
// intro and outro. Stop definitions are deterministic and version-controlled
// here; per-child progress lives in public.trail_progress.

export interface TrailStop {
  index: number;
  skillCode: string;
  subjectCode: string;
  level: number;
  chapter: number; // 1..5 (== level)
  questTitle: string;
  intro: string;
  outro: string;
}

/** Island order for the trail: the route Captain Curio sails. */
const SUBJECT_ORDER = [
  'reading',
  'math',
  'writing',
  'science',
  'geography',
  'coding',
  'music',
  'drawing',
  'feelings',
] as const;

const SKILLS_BY_SUBJECT: Record<string, string[]> = {
  reading: ['alphabet', 'letter_sounds', 'blending', 'sight_words', 'sentences', 'stories'],
  math: ['count', 'cardinality', 'compare_order', 'add', 'subtract', 'place_value', 'shapes_patterns', 'fractions'],
  writing: ['trace_letters', 'build_words', 'write_sentences'],
  science: ['plants', 'animals_habitats', 'weather', 'human_body', 'experiments'],
  geography: ['continents_oceans', 'landmarks', 'world_animals', 'map_skills', 'cultures'],
  coding: ['sequencing', 'patterns_coding', 'loops', 'conditions', 'debugging'],
  music: ['rhythm', 'pitch', 'instruments', 'dance'],
  drawing: ['brush_control', 'coloring', 'shape_drawing', 'scene_composition'],
  feelings: ['emotions', 'breathing', 'calm_down', 'attention'],
};

/**
 * Canonical skill codes per subject, exported so parent tools (report
 * cards, play cards) validate against the real curriculum bank.
 */
export const SKILL_CODES: Record<string, string[]> = SKILLS_BY_SUBJECT;

/** One quest title per skill — the story the child steps into. */
const QUEST_TITLES: Record<string, string> = {
  alphabet: 'The Scattered Star-Books',
  letter_sounds: 'The Sound Thief',
  blending: "The Wind's Jumbled Words",
  sight_words: 'The Smudged Note',
  sentences: 'The Story Repair Shop',
  stories: "Pip's Cheese Adventure",
  trace_letters: 'The Signpost Saga',
  build_words: "Quill's Message Workshop",
  write_sentences: "The Captain's Log",
  count: "Bolt's Firefly Count",
  cardinality: 'How Many Fireflies?',
  compare_order: "Sprocket's Mixed-Up Row",
  add: "Milo's Fuel Recipes",
  subtract: 'The Missing Fuel Crystals',
  place_value: "Sprocket's Tray",
  shapes_patterns: 'The Pattern Bridge',
  fractions: 'Sharing the Volcano Cake',
  brush_control: "Paint Pip's Portrait",
  coloring: 'The Stolen Yellow',
  shape_drawing: "Wren's Compass",
  scene_composition: 'The Grand Gallery',
  continents_oceans: 'The Magic Globe',
  landmarks: "Wren's Postcards",
  world_animals: 'The Animal Parade',
  map_skills: 'The Treasure Map',
  cultures: 'The Festival Invitations',
  sequencing: "Milo's Morning Routine",
  patterns_coding: "The Loom's Snag",
  loops: 'The Hop Loop',
  conditions: "Sprocket's Umbrella Rule",
  debugging: 'The Unraveled Blanket',
  plants: "Sprout's Growth Diary",
  animals_habitats: 'The Fallen Baby Bird',
  weather: 'The Puddle Mystery',
  human_body: 'The Body Expedition',
  experiments: "Buzzy's Big Questions",
  rhythm: 'The Concert Tonight',
  pitch: "Hoot's Humming Lessons",
  instruments: "The Band's Parade",
  dance: 'Teaching the Loom Sprites',
  emotions: "Pebble's Big Feelings",
  breathing: 'The Breathing Cave',
  calm_down: 'The Calm-Down Toolbox',
  attention: 'The Focus Fireflies',
};

const CHAPTER_NAMES = [
  'First Steps',
  'New Horizons',
  'Helping Hands',
  'Great Mysteries',
  'Master Quests',
];

const LEVEL_BEATS = [
  'Your adventure begins!',
  'The plot thickens...',
  'A friend needs your help!',
  'A mystery to solve!',
  'The master quest awaits!',
];

const LEVEL_OUTROS = [
  'You did it! The island cheers for you.',
  'Another page turned. Onward!',
  'Your friend is smiling because of you.',
  'Mystery solved! You are a true detective.',
  'Mastered! The whole sky is proud of you.',
];

function buildTrail(): TrailStop[] {
  const stops: TrailStop[] = [];
  let index = 0;
  for (let level = 1; level <= 5; level++) {
    for (const subject of SUBJECT_ORDER) {
      for (const skill of SKILLS_BY_SUBJECT[subject] ?? []) {
        const title = QUEST_TITLES[skill] ?? skill;
        stops.push({
          index: index++,
          skillCode: skill,
          subjectCode: subject,
          level,
          chapter: level,
          questTitle: title,
          intro: `${LEVEL_BEATS[level - 1]} Time for "${title}".`,
          outro: LEVEL_OUTROS[level - 1],
        });
      }
    }
  }
  return stops;
}

export const TRAIL: TrailStop[] = buildTrail();
export const TRAIL_LENGTH = TRAIL.length;

export function getTrailStop(index: number): TrailStop {
  const i = Math.max(0, Math.min(index, TRAIL_LENGTH - 1));
  return TRAIL[i];
}

export function chapterName(chapter: number): string {
  return CHAPTER_NAMES[chapter - 1] ?? `Chapter ${chapter}`;
}

/** Quest number shown to kids (1-based). */
export function questNumber(index: number): number {
  return Math.min(index, TRAIL_LENGTH - 1) + 1;
}
