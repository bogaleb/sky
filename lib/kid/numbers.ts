// Number Run — deterministic number-round generators for the gentle math
// arcade game. Five levels, seeded RNG (mulberry32): the same
// (level, seed) always produces the same round.

export type NumberRoundKind = 'count' | 'compare' | 'add' | 'subtract' | 'missing';

export interface DotGroup {
  count: number;
  /** Dots rendered crossed-out (subtraction: "these are gone"). */
  crossed?: number;
  shape: 'dot' | 'star';
}

export interface NumberRound {
  kind: NumberRoundKind;
  level: number;
  /** Spoken prompt for TTS / non-readers. */
  prompt: string;
  /** Short on-screen question text, numerals only. */
  question: string;
  /** Visual dot groups, left to right. Empty for 'missing'. */
  dots: DotGroup[];
  /** Number tiles for 'missing' (exactly one null). Empty otherwise. */
  sequence: Array<number | null>;
  choices: number[];
  answer: number;
}

export const NUM_LEVELS = [1, 2, 3, 4, 5] as const;
export const ROUNDS_PER_GAME = 8;

/** Level ramp across the 8 rounds: [1,1,2,2,3,3,4,5]. */
export function levelForRound(roundIndex: number): number {
  const ramp = [1, 1, 2, 2, 3, 3, 4, 5];
  return ramp[Math.min(Math.max(0, roundIndex), ramp.length - 1)];
}

/** Dot positions for n dots in a 100x100 viewBox (up to 10). */
export const DOT_POSITIONS: Array<Array<[number, number]>> = [
  [],
  [[50, 50]],
  [[32, 50], [68, 50]],
  [[30, 64], [50, 34], [70, 64]],
  [[32, 32], [68, 32], [32, 68], [68, 68]],
  [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  [[30, 28], [70, 28], [30, 50], [70, 50], [30, 72], [70, 72]],
  [[28, 26], [50, 26], [72, 26], [50, 50], [28, 74], [50, 74], [72, 74]],
  [[28, 26], [50, 26], [72, 26], [28, 50], [72, 50], [28, 74], [50, 74], [72, 74]],
  [[28, 28], [50, 28], [72, 28], [28, 50], [50, 50], [72, 50], [28, 72], [50, 72], [72, 72]],
  [[20, 30], [35, 30], [50, 30], [65, 30], [80, 30], [20, 70], [35, 70], [50, 70], [65, 70], [80, 70]],
];

type Rng = () => number;

/** Deterministic PRNG (mulberry32). Same seed -> same stream. */
function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random int in [min, max], inclusive. */
function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function shuffleInPlace<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build the choice set: misconception-based candidates first, then a safe
 * fallback pool. Guarantees: exactly `total` choices, exactly one equals
 * `answer`, all distinct, all >= 0.
 */
function buildChoices(rng: Rng, answer: number, candidates: number[], total: number): number[] {
  const seen = new Set<number>();
  const picks: number[] = [];
  for (const c of candidates) {
    if (picks.length >= total - 1) break;
    if (Number.isInteger(c) && c >= 0 && c !== answer && !seen.has(c)) {
      seen.add(c);
      picks.push(c);
    }
  }
  let f = answer + 2;
  let guard = 0;
  while (picks.length < total - 1 && guard < 200) {
    guard++;
    if (f !== answer && !seen.has(f) && f >= 0) {
      seen.add(f);
      picks.push(f);
    }
    f++;
  }
  picks.push(answer);
  return shuffleInPlace(rng, picks);
}

function countRound(rng: Rng): NumberRound {
  const n = int(rng, 3, 6);
  const shape: 'dot' | 'star' = rng() < 0.5 ? 'dot' : 'star';
  const shapeWord = shape === 'dot' ? 'dots' : 'stars';
  // Misconceptions: off-by-one (miscounted), off-by-two (skipped one).
  const choices = buildChoices(rng, n, [n + 1, n - 1, n + 2], 3);
  return {
    kind: 'count',
    level: 1,
    prompt: `How many ${shapeWord} do you see? Tap the right number!`,
    question: 'How many?',
    dots: [{ count: n, shape }],
    sequence: [],
    choices,
    answer: n,
  };
}

function compareRound(rng: Rng): NumberRound {
  const a = int(rng, 2, 6);
  let b = int(rng, 2, 6);
  while (b === a) b = int(rng, 2, 6);
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  // Misconceptions: tapped the smaller side, off-by-one on the bigger.
  const choices = buildChoices(rng, big, [small, big + 1, big - 1], 3);
  return {
    kind: 'compare',
    level: 2,
    prompt: 'Which side has more dots? Tap the bigger number!',
    question: 'Which is more?',
    dots: [
      { count: a, shape: 'dot' },
      { count: b, shape: 'dot' },
    ],
    sequence: [],
    choices,
    answer: big,
  };
}

function addRound(rng: Rng): NumberRound {
  const a = int(rng, 1, 6);
  const b = int(rng, 1, 10 - a);
  const sum = a + b;
  // Misconceptions: off-by-one, subtracted instead of adding.
  const choices = buildChoices(rng, sum, [sum + 1, sum - 1, Math.abs(a - b)], 4);
  return {
    kind: 'add',
    level: 3,
    prompt: `What is ${a} plus ${b}? Count the dots to help you!`,
    question: `${a} + ${b} = ?`,
    dots: [
      { count: a, shape: 'dot' },
      { count: b, shape: 'star' },
    ],
    sequence: [],
    choices,
    answer: sum,
  };
}

function subtractRound(rng: Rng): NumberRound {
  const a = int(rng, 4, 10);
  const b = int(rng, 1, a - 1);
  const diff = a - b;
  // Misconceptions: off-by-one, added instead of subtracting.
  const choices = buildChoices(rng, diff, [diff + 1, diff - 1, a + b], 4);
  return {
    kind: 'subtract',
    level: 4,
    prompt: `What is ${a} take away ${b}? The crossed-out dots are gone!`,
    question: `${a} − ${b} = ?`,
    dots: [{ count: a, crossed: b, shape: 'dot' }],
    sequence: [],
    choices,
    answer: diff,
  };
}

function missingRound(rng: Rng): NumberRound {
  const start = int(rng, 1, 4);
  const step = rng() < 0.7 ? 1 : 2;
  const blankIndex = int(rng, 1, 3); // never the first tile
  const full = [0, 1, 2, 3].map((i) => start + i * step);
  const answer = full[blankIndex];
  const sequence: Array<number | null> = full.map((v, i) => (i === blankIndex ? null : v));
  // Misconceptions: off-by-one, continued with the wrong step.
  const choices = buildChoices(rng, answer, [answer + 1, answer - 1, answer + step], 4);
  const spoken = full.map((v, i) => (i === blankIndex ? 'blank' : String(v))).join(', ');
  return {
    kind: 'missing',
    level: 5,
    prompt: `What number is missing? ${spoken}. Tap the missing number!`,
    question: 'What is missing?',
    dots: [],
    sequence,
    choices,
    answer,
  };
}

/** Generate one deterministic round for a level (1-5, clamped). */
export function generateRound(level: number, seed: number): NumberRound {
  const lv = Math.min(5, Math.max(1, Math.floor(level) || 1));
  const rng = mulberry32((seed >>> 0) * 2654435761 + lv * 97 + 13);
  switch (lv) {
    case 1:
      return countRound(rng);
    case 2:
      return compareRound(rng);
    case 3:
      return addRound(rng);
    case 4:
      return subtractRound(rng);
    default:
      return missingRound(rng);
  }
}

/**
 * The skill (and its 1–5 level) a round is evidence for, per the math
 * taxonomy descriptors: e.g. "Adds within 5 using objects" is add level 2,
 * "Adds within 10" is add level 3.
 */
export function skillForRound(round: NumberRound): { skill: 'count' | 'compare_order' | 'add' | 'subtract'; level: number } {
  switch (round.kind) {
    case 'count':
      return { skill: 'count', level: round.answer <= 5 ? 1 : round.answer <= 10 ? 2 : 3 };
    case 'compare':
      return { skill: 'compare_order', level: round.answer <= 5 ? 2 : 3 };
    case 'add':
      return { skill: 'add', level: round.answer <= 5 ? 2 : round.answer <= 10 ? 3 : 4 };
    case 'subtract': {
      const start = round.dots[0]?.count ?? round.answer;
      return { skill: 'subtract', level: start <= 5 ? 2 : start <= 10 ? 3 : 4 };
    }
    case 'missing':
      // Filling a gap in a number line is ordering numbers (level 3: "Puts numbers 1 to 10 in order").
      return { skill: 'compare_order', level: 3 };
  }
}
