/**
 * Color Mix Lab — kid color-mixing engine.
 * 10 mixes across 3 levels: L1 primary mixes, L2 tints + gray, L3 browns and jewels.
 * Pure and deterministic: the same seed always produces the same question.
 */

import { mulberry32 } from './words';

export type MixLevel = 1 | 2 | 3;

export type ColorId =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'white'
  | 'black'
  | 'green'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'light blue'
  | 'gray'
  | 'brown'
  | 'lime'
  | 'teal'
  | 'magenta';

export interface ColorDef {
  id: ColorId;
  name: string;
  hex: string;
  /** Colors a kid can pick as paint blobs in free play. */
  mixable: boolean;
}

export const COLOR_DEFS: Record<ColorId, ColorDef> = {
  red: { id: 'red', name: 'red', hex: '#EF4444', mixable: true },
  blue: { id: 'blue', name: 'blue', hex: '#3B82F6', mixable: true },
  yellow: { id: 'yellow', name: 'yellow', hex: '#FACC15', mixable: true },
  white: { id: 'white', name: 'white', hex: '#FFFFFF', mixable: true },
  black: { id: 'black', name: 'black', hex: '#1F2937', mixable: true },
  green: { id: 'green', name: 'green', hex: '#22C55E', mixable: true },
  purple: { id: 'purple', name: 'purple', hex: '#A855F7', mixable: true },
  orange: { id: 'orange', name: 'orange', hex: '#FB923C', mixable: false },
  pink: { id: 'pink', name: 'pink', hex: '#F472A6', mixable: false },
  'light blue': { id: 'light blue', name: 'light blue', hex: '#7DD3FC', mixable: false },
  gray: { id: 'gray', name: 'gray', hex: '#9CA3AF', mixable: false },
  brown: { id: 'brown', name: 'brown', hex: '#92400E', mixable: false },
  lime: { id: 'lime', name: 'lime', hex: '#A3E635', mixable: false },
  teal: { id: 'teal', name: 'teal', hex: '#2DD4BF', mixable: false },
  magenta: { id: 'magenta', name: 'magenta', hex: '#E1439B', mixable: false },
};

export const PAINT_PALETTE: ColorId[] = ['red', 'blue', 'yellow', 'white', 'black', 'green', 'purple'];

export interface MixDef {
  a: ColorId;
  b: ColorId;
  result: ColorId;
  level: MixLevel;
}

/** The 10 mixes kids discover in the lab. */
export const MIXES: MixDef[] = [
  { a: 'red', b: 'blue', result: 'purple', level: 1 },
  { a: 'red', b: 'yellow', result: 'orange', level: 1 },
  { a: 'blue', b: 'yellow', result: 'green', level: 1 },
  { a: 'red', b: 'white', result: 'pink', level: 2 },
  { a: 'blue', b: 'white', result: 'light blue', level: 2 },
  { a: 'black', b: 'white', result: 'gray', level: 2 },
  { a: 'red', b: 'green', result: 'brown', level: 3 },
  { a: 'yellow', b: 'purple', result: 'brown', level: 3 },
  { a: 'blue', b: 'green', result: 'teal', level: 3 },
  { a: 'red', b: 'purple', result: 'magenta', level: 3 },
];

export const ROUNDS_PER_GAME = 8;

/** Level for each round of a game: gentle ramp 1,1,2,2,3,3,3,3. */
export const ROUND_LEVELS: MixLevel[] = [1, 1, 2, 2, 3, 3, 3, 3];

export function mixesForLevel(level: MixLevel): MixDef[] {
  return MIXES.filter((m) => m.level === level);
}

/** Order-independent mix key. */
function mixKey(a: ColorId, b: ColorId): string {
  return [a, b].sort().join('+');
}

const MIX_LOOKUP = new Map<string, MixDef>();
for (const m of MIXES) MIX_LOOKUP.set(mixKey(m.a, m.b), m);

/** What two paints make. Returns the result color, or null for unknown pairs. */
export function mix(a: ColorId, b: ColorId): ColorId | null {
  if (a === b) return a;
  return MIX_LOOKUP.get(mixKey(a, b))?.result ?? null;
}

export interface ColorQuestion {
  level: MixLevel;
  a: ColorId;
  b: ColorId;
  /** Choice color names, shuffled. */
  choices: ColorId[];
  /** The correct result color. */
  answer: ColorId;
}

/** Two plausible wrong result colors: never the answer, unique, from known results. */
function distractors(answer: ColorId, rng: () => number): ColorId[] {
  const results = MIXES.map((m) => m.result).filter((r) => r !== answer);
  const seen = new Set<ColorId>();
  const out: ColorId[] = [];
  const shuffled = [...results].sort(() => rng() - 0.5);
  for (const r of shuffled) {
    if (!seen.has(r)) {
      seen.add(r);
      out.push(r);
      if (out.length === 2) break;
    }
  }
  while (out.length < 2) {
    const fallback: ColorId = out.length === 0 ? 'orange' : 'pink';
    if (fallback !== answer && !seen.has(fallback)) {
      seen.add(fallback);
      out.push(fallback);
    } else break;
  }
  return out;
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateQuestion(level: MixLevel, seed: number): ColorQuestion {
  const rng = mulberry32(seed);
  const pool = mixesForLevel(level);
  const def = pool[Math.floor(rng() * pool.length)];
  const choices = shuffled([def.result, ...distractors(def.result, rng)], rng);
  return { level, a: def.a, b: def.b, choices, answer: def.result };
}

/** "What do red and blue make?" — the spoken quiz prompt. */
export function spokenQuestion(a: ColorId, b: ColorId): string {
  return `What do ${a} and ${b} make?`;
}
