/**
 * Measure Meadow — measurement engine (length, height, weight, capacity).
 * Milo hosts. Round kinds: 'longer' (ribbons), 'taller' (towers),
 * 'heavier' (balance scale — which pan drops?), 'holds-more' (cups).
 *
 * Levels: L1 obvious differences, L2 closer sizes, L3 tight sizes plus
 * mixed non-standard units ("3 blocks vs 5 buttons" — count the units!).
 * Pure and deterministic: the same seed always produces the same question.
 */

import { mulberry32 } from './words';

export type MeasureLevel = 1 | 2 | 3;

export type MeasureKind = 'longer' | 'taller' | 'heavier' | 'holds-more';

export interface UnitDef {
  unit: string;
  plural: string;
  /** Abstract magnitude of one unit. */
  value: number;
}

/** Non-standard length/height units: a block is twice as long as a button. */
export const LENGTH_UNITS: UnitDef[] = [
  { unit: 'block', plural: 'blocks', value: 2 },
  { unit: 'button', plural: 'buttons', value: 1 },
];

/** Non-standard weight units: an apple is three times as heavy as a feather. */
export const WEIGHT_UNITS: UnitDef[] = [
  { unit: 'apple', plural: 'apples', value: 3 },
  { unit: 'feather', plural: 'feathers', value: 1 },
];

export interface UnitCount {
  count: number;
  def: UnitDef;
}

export interface MeasureOption {
  id: number;
  /** Total abstract magnitude — the winner is the largest. */
  size: number;
  /** Present for L3 mixed-unit questions ("3 blocks"). */
  units?: UnitCount;
  /** Short spoken label, e.g. "the red ribbon" or "3 blocks". */
  label: string;
  /** Color theme index 0..2 for the artwork. */
  color: number;
}

export interface MeasureQuestion {
  level: MeasureLevel;
  kind: MeasureKind;
  /** Spoken + displayed prompt, e.g. "Which ribbon is the longest?" */
  ask: string;
  options: MeasureOption[];
  /** Winning option id. */
  answer: number;
}

export const ROUNDS_PER_GAME = 8;

/** Level for each round of a game: gentle ramp 1,1,2,2,3,3,3,3. */
export const ROUND_LEVELS: MeasureLevel[] = [1, 1, 2, 2, 3, 3, 3, 3];

export const KIND_ASK: Record<MeasureKind, string> = {
  longer: 'Which ribbon is the longest?',
  taller: 'Which tower is the tallest?',
  heavier: 'Which pan is the heaviest? Which side goes down?',
  'holds-more': 'Which cup holds the most water?',
};

const KIND_COLORS = ['red', 'blue', 'green'];

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Distinct sizes with a level-appropriate spread. */
function makeSizes(rng: () => number, level: MeasureLevel): [number, number, number] {
  if (level === 1) {
    // Obvious: 1x / 2x / 3x.
    const base = 2 + Math.floor(rng() * 3); // 2..4
    return [base, base * 2, base * 3];
  }
  if (level === 2) {
    // Closer: base, base+2, base+4.
    const base = 4 + Math.floor(rng() * 4); // 4..7
    return [base, base + 2, base + 4];
  }
  // Tight: base, base+1, base+2.
  const base = 5 + Math.floor(rng() * 4); // 5..8
  return [base, base + 1, base + 2];
}

const MIXED_KINDS: MeasureKind[] = ['longer', 'taller', 'heavier'];

function unitsFor(kind: MeasureKind): UnitDef[] {
  return kind === 'heavier' ? WEIGHT_UNITS : LENGTH_UNITS;
}

/**
 * L3 mixed-unit sizes: three options built from (unit, count) pairs where
 * counting alone misleads — e.g. 3 blocks (6) beats 5 buttons (5).
 */
function makeMixedSizes(rng: () => number, kind: MeasureKind): [UnitCount, UnitCount, UnitCount] {
  const defs = unitsFor(kind);
  const big = defs[0];
  const small = defs[1];
  for (let attempt = 0; attempt < 60; attempt++) {
    const a: UnitCount = { count: 2 + Math.floor(rng() * 3), def: big }; // 2..4
    const b: UnitCount = { count: 4 + Math.floor(rng() * 4), def: small }; // 4..7
    const c: UnitCount =
      rng() < 0.5
        ? { count: 1 + Math.floor(rng() * 2), def: big }
        : { count: 2 + Math.floor(rng() * 3), def: small };
    const sizes = [a, b, c].map((u) => u.count * u.def.value);
    if (new Set(sizes).size === 3) return [a, b, c];
  }
  // Fallback (practically unreachable): guaranteed distinct.
  return [
    { count: 3, def: big },
    { count: 5, def: small },
    { count: 2, def: big },
  ];
}

function labelFor(kind: MeasureKind, colorName: string, units?: UnitCount): string {
  if (units) {
    const word = units.count === 1 ? units.def.unit : units.def.plural;
    return `${units.count} ${word}`;
  }
  switch (kind) {
    case 'longer':
      return `the ${colorName} ribbon`;
    case 'taller':
      return `the ${colorName} tower`;
    case 'heavier':
      return `the ${colorName} pan`;
    case 'holds-more':
      return `the ${colorName} cup`;
  }
}

/** Generate one deterministic measurement question. */
export function generateQuestion(level: MeasureLevel, seed: number): MeasureQuestion {
  const rng = mulberry32(seed >>> 0);
  const kinds: MeasureKind[] =
    level === 1 ? ['longer', 'taller'] : ['longer', 'taller', 'heavier', 'holds-more'];
  const kind = pick(rng, kinds);
  const mixed = level === 3 && MIXED_KINDS.includes(kind) && rng() < 0.6;

  let options: MeasureOption[];
  if (mixed) {
    const [ua, ub, uc] = makeMixedSizes(rng, kind);
    const units = shuffle(rng, [ua, ub, uc]);
    options = units.map((u, i) => ({
      id: i,
      size: u.count * u.def.value,
      units: u,
      label: labelFor(kind, KIND_COLORS[i], u),
      color: i,
    }));
  } else {
    const sizes = shuffle(rng, makeSizes(rng, level));
    options = sizes.map((size, i) => ({
      id: i,
      size,
      label: labelFor(kind, KIND_COLORS[i]),
      color: i,
    }));
  }

  const answer = options.reduce((best, o) => (o.size > best.size ? o : best), options[0]).id;
  return { level, kind, ask: KIND_ASK[kind], options, answer };
}

/** Spoken description of an option for TTS ("the red ribbon", "3 blocks"). */
export function spokenOption(option: MeasureOption): string {
  return option.label;
}

/** True when the option's visual magnitude matches its declared size (test helper). */
export function optionSize(option: MeasureOption): number {
  return option.units ? option.units.count * option.units.def.value : option.size;
}
