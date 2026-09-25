/**
 * Welcome Quest placement: three quick, zero-pressure questions that seed a
 * child's starting difficulty level. Pure and deterministic so the adaptive
 * planner, tests, and the onboarding UI can all share it.
 */

export type ShapeId = 'circle' | 'triangle' | 'square';

export interface CountingQuestion {
  kind: 'counting';
  prompt: string;
  count: number;
  choices: number[];
}

export interface SoundQuestion {
  kind: 'sound';
  letter: string;
  prompt: string;
  choices: string[];
  answer: string;
}

export interface ShapeQuestion {
  kind: 'shape';
  prompt: string;
  target: ShapeId;
  choices: ShapeId[];
}

export type PlacementQuestion = CountingQuestion | SoundQuestion | ShapeQuestion;

export const COUNTING_QUESTION: CountingQuestion = {
  kind: 'counting',
  prompt: 'How many stars do you see?',
  count: 4,
  choices: [3, 4, 5],
};

export const SOUND_QUESTION: SoundQuestion = {
  kind: 'sound',
  letter: 'B',
  prompt: 'What sound does B make?',
  choices: ['buh', 'mmm', 'sss'],
  answer: 'buh',
};

export const SHAPE_QUESTION: ShapeQuestion = {
  kind: 'shape',
  prompt: 'Tap the triangle.',
  target: 'triangle',
  choices: ['circle', 'triangle', 'square'],
};

/** The three placement questions, in play order. */
export const QUESTIONS: PlacementQuestion[] = [
  COUNTING_QUESTION,
  SOUND_QUESTION,
  SHAPE_QUESTION,
];

export type PlacementLevel = 1 | 2 | 3;

export interface PlacementResult {
  level: PlacementLevel;
  /** Kid-friendly label for the starting level. */
  label: string;
  /** Number of questions answered correctly on the first try. */
  correct: number;
}

export const PLACEMENT_LABELS: Record<PlacementLevel, string> = {
  3: 'Sky Captain',
  2: 'Star Explorer',
  1: 'Little Sprout',
};

/**
 * Score first-try correctness into a starting level.
 * 3 correct -> level 3, 2 correct -> level 2, 0-1 correct -> level 1.
 * Level 1 is a warm welcome, never a failure: every child lands somewhere kind.
 */
export function scorePlacement(answers: boolean[]): PlacementResult {
  const correct = answers.filter(Boolean).length;
  const level: PlacementLevel = correct >= 3 ? 3 : correct === 2 ? 2 : 1;
  return { level, label: PLACEMENT_LABELS[level], correct };
}

/** localStorage key for a child's saved placement. */
export function placementStorageKey(childId: string): string {
  return `sky-placement-${childId}`;
}

export interface SavedPlacement {
  level: PlacementLevel;
  at: string;
}

export function savePlacement(childId: string, level: PlacementLevel): void {
  try {
    const record: SavedPlacement = { level, at: new Date().toISOString() };
    window.localStorage.setItem(placementStorageKey(childId), JSON.stringify(record));
  } catch {
    /* storage is best-effort; the quest still counts */
  }
}

export function loadPlacement(childId: string): SavedPlacement | null {
  try {
    const raw = window.localStorage.getItem(placementStorageKey(childId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedPlacement>;
    if (parsed.level !== 1 && parsed.level !== 2 && parsed.level !== 3) return null;
    return { level: parsed.level, at: typeof parsed.at === 'string' ? parsed.at : '' };
  } catch {
    return null;
  }
}
