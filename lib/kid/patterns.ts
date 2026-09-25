/**
 * Pattern Parade pattern engine. Deterministic pattern/sequencing
 * generators for ages 3-8 across 5 difficulty levels.
 *
 * Pure logic: no DOM, no audio, and no randomness beyond the seeded
 * PRNG, so any (level, seed) pair always produces the same round —
 * reproducible for tests, replays, and debugging.
 *
 * Every round hides exactly one item (never the first) and offers 3-4
 * big choices with exactly one correct answer. Wrong answers are
 * misconception-based: they model the mistake a child actually makes
 * (repeating the last item, restarting a cycle too soon, growing too
 * fast), never joke answers.
 */

export type ShapeName =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'heart';

export type ColorName =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange';

export type SizeName = 'small' | 'medium' | 'large';

export interface PatternItem {
  shape: ShapeName;
  color: ColorName;
  size: SizeName;
  /** Dot count for growing/shrinking dot patterns. */
  dots?: number;
  /** Numeral for number-sequence patterns. */
  value?: number;
}

export type PatternKind =
  | 'abab'
  | 'aabb'
  | 'abcabc'
  | 'color-ab'
  | 'growing-dots'
  | 'shrinking-dots'
  | 'combo'
  | 'color-shape'
  | 'number-plus2'
  | 'aab';

export interface PatternLevel {
  level: number;
  name: string;
  tagline: string;
  kinds: PatternKind[];
}

export const PATTERN_LEVELS: PatternLevel[] = [
  {
    level: 1,
    name: 'First March',
    tagline: 'Easy two-step patterns',
    kinds: ['abab', 'aabb'],
  },
  {
    level: 2,
    name: 'Color Crew',
    tagline: 'Three-step and color patterns',
    kinds: ['abcabc', 'color-ab'],
  },
  {
    level: 3,
    name: 'Growing Garden',
    tagline: 'Patterns that grow and shrink',
    kinds: ['growing-dots', 'shrinking-dots'],
  },
  {
    level: 4,
    name: 'Double Trouble',
    tagline: 'Two things change at once',
    kinds: ['combo', 'color-shape'],
  },
  {
    level: 5,
    name: 'Mastermind',
    tagline: 'Tricky number and repeat patterns',
    kinds: ['number-plus2', 'aab'],
  },
];

/** Milo hosts Pattern Parade — patterns are his favorite math game. */
export const PATTERN_HOST_CHARACTER = 'milo';

export const PATTERN_INTRO_LINE =
  "Hi! I'm Milo! Welcome to Pattern Parade! Watch the shapes march by, then tap the one that comes next!";

export const ROUNDS_PER_GAME = 8;

/** Level ramp across one 8-round game: gentle start, tricky finish. */
export function levelForRound(roundIndex: number): number {
  const ramp = [1, 1, 2, 2, 3, 3, 4, 5];
  return ramp[Math.min(Math.max(0, roundIndex), ramp.length - 1)];
}

export interface PatternRound {
  id: string;
  level: number;
  kind: PatternKind;
  /** Kid-friendly label, e.g. "AB pattern". */
  kindLabel: string;
  /** Voiced host line for the round. */
  hostLine: string;
  /** The full sequence; exactly one entry is null (the hidden slot). */
  sequence: Array<PatternItem | null>;
  missingIndex: number;
  /** 3-4 choices; exactly one equals the hidden item. */
  choices: PatternItem[];
  answerIndex: number;
}

const KIND_LABELS: Record<PatternKind, string> = {
  abab: 'AB pattern',
  aabb: 'AABB pattern',
  abcabc: 'ABC pattern',
  'color-ab': 'color pattern',
  'growing-dots': 'growing dots',
  'shrinking-dots': 'shrinking dots',
  combo: 'shape and size pattern',
  'color-shape': 'color and shape pattern',
  'number-plus2': 'skip-counting pattern',
  aab: 'AAB pattern',
};

const HOST_LINES: Record<PatternKind, string> = {
  abab: 'Watch the march: two friends taking turns! What comes next?',
  aabb: 'They march in twos this time! What comes next?',
  abcabc: 'Three friends marching in a circle! Who comes next?',
  'color-ab': 'The colors are taking turns! What comes next?',
  'growing-dots': 'The dots are growing! How many come next?',
  'shrinking-dots': 'The dots are shrinking! How many come next?',
  combo: 'Two things are changing — shape AND size! What comes next?',
  'color-shape': 'The colors and shapes are dancing together! What comes next?',
  'number-plus2': "We're skip-counting by twos! What number comes next?",
  aab: 'A tricky march: two, then one! What comes next?',
};

const SHAPES: ShapeName[] = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'star',
  'heart',
];

const COLORS: ColorName[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
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

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickDistinct<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

function makeItem(
  shape: ShapeName,
  color: ColorName,
  size: SizeName = 'medium',
  extra: { dots?: number; value?: number } = {},
): PatternItem {
  return { shape, color, size, ...extra };
}

/** Structural equality: two items look identical to the child. */
export function itemsEqual(a: PatternItem, b: PatternItem): boolean {
  return (
    a.shape === b.shape &&
    a.color === b.color &&
    a.size === b.size &&
    a.dots === b.dots &&
    a.value === b.value
  );
}

/** Spoken description for non-readers, e.g. "big red circle", "3 blue dots". */
export function describeItem(item: PatternItem): string {
  if (item.value !== undefined) return `the number ${item.value}`;
  const sizeWord =
    item.size === 'small' ? 'little' : item.size === 'large' ? 'big' : '';
  if (item.dots !== undefined) {
    const dotWord = item.dots === 1 ? 'dot' : 'dots';
    return `${item.dots} ${item.color}${sizeWord ? ` ${sizeWord}` : ''} ${dotWord}`;
  }
  return `${sizeWord ? `${sizeWord} ` : ''}${item.color} ${item.shape}`;
}

interface BuiltPattern {
  items: PatternItem[];
  /**
   * Misconception-based wrong answers for the hidden slot. Every
   * candidate models a real mistake: repeating the last-seen item,
   * restarting a cycle too soon, growing too fast, or noticing only
   * one of two changing attributes.
   */
  candidates: (
    answer: PatternItem,
    items: PatternItem[],
    missingIndex: number,
  ) => PatternItem[];
}

function buildAbab(rng: Rng): BuiltPattern {
  const [a, b] = pickDistinct(rng, SHAPES, 2);
  const color = pick(rng, COLORS);
  const items = [0, 1, 2, 3, 4].map((i) =>
    makeItem(i % 2 === 0 ? a : b, color),
  );
  return {
    items,
    candidates: (answer, full, mi) => {
      const other = answer.shape === a ? b : a;
      const novel = pick(
        rng,
        SHAPES.filter((s) => s !== a && s !== b),
      );
      const offColor = pick(
        rng,
        COLORS.filter((c) => c !== color),
      );
      return [
        makeItem(other, color), // repeats the last-seen friend: the "keep going" slip
        makeItem(full[mi - 1].shape, color), // copies the neighbor outright
        makeItem(novel, color), // a brand-new friend crashes the parade
        makeItem(answer.shape, offColor), // right shape, wrong color
      ];
    },
  };
}

function buildAabb(rng: Rng): BuiltPattern {
  const [a, b] = pickDistinct(rng, SHAPES, 2);
  const color = pick(rng, COLORS);
  const seq: ShapeName[] = [a, a, b, b, a, a];
  const items = seq.map((s) => makeItem(s, color));
  return {
    items,
    candidates: (answer, full, mi) => {
      const other = answer.shape === a ? b : a;
      const novel = pick(
        rng,
        SHAPES.filter((s) => s !== a && s !== b),
      );
      const offColor = pick(
        rng,
        COLORS.filter((c) => c !== color),
      );
      return [
        makeItem(other, color), // alternates instead of doubling up
        makeItem(full[mi - 1].shape, color), // copies the neighbor
        makeItem(novel, color), // newcomer crashes the parade
        makeItem(answer.shape, offColor), // right shape, wrong color
      ];
    },
  };
}

function buildAbcabc(rng: Rng): BuiltPattern {
  const [a, b, c] = pickDistinct(rng, SHAPES, 3);
  const color = pick(rng, COLORS);
  const cycle = [a, b, c];
  const items = [0, 1, 2, 3, 4, 5].map((i) =>
    makeItem(cycle[i % 3], color),
  );
  return {
    items,
    candidates: (answer, full, mi) => {
      const cyclePos = mi % 3;
      const offByOne = cycle[(cyclePos + 1) % 3]; // restarts or skips the cycle
      const novel = pick(
        rng,
        SHAPES.filter((s) => s !== a && s !== b && s !== c),
      );
      const offColor = pick(
        rng,
        COLORS.filter((cc) => cc !== color),
      );
      return [
        makeItem(offByOne, color), // one step off in the cycle
        makeItem(full[mi - 1].shape, color), // copies the neighbor
        makeItem(novel, color), // newcomer crashes the parade
        makeItem(answer.shape, offColor), // right shape, wrong color
      ];
    },
  };
}

function buildColorAb(rng: Rng): BuiltPattern {
  const shape = pick(rng, SHAPES);
  const [c1, c2] = pickDistinct(rng, COLORS, 2);
  const items = [0, 1, 2, 3, 4, 5].map((i) =>
    makeItem(shape, i % 2 === 0 ? c1 : c2),
  );
  return {
    items,
    candidates: (answer, full, mi) => {
      const otherColor = answer.color === c1 ? c2 : c1;
      const third = pick(
        rng,
        COLORS.filter((c) => c !== c1 && c !== c2),
      );
      const otherShape = pick(
        rng,
        SHAPES.filter((s) => s !== shape),
      );
      return [
        makeItem(shape, otherColor), // repeats the last color seen
        makeItem(shape, full[mi - 1].color), // copies the neighbor
        makeItem(shape, third), // a color from outside the pattern
        makeItem(otherShape, answer.color), // right color, wrong shape
      ];
    },
  };
}

function buildGrowingDots(rng: Rng): BuiltPattern {
  const color = pick(rng, COLORS);
  const start = 1 + Math.floor(rng() * 4); // 1..4
  const len = 5 + Math.floor(rng() * 2); // 5..6
  const items = Array.from({ length: len }, (_, i) =>
    makeItem('circle', color, 'medium', { dots: start + i }),
  );
  return {
    items,
    candidates: (answer) => {
      const d = answer.dots ?? 1;
      return [
        makeItem('circle', color, 'medium', { dots: d }), // flat: no growth at all
        makeItem('circle', color, 'medium', { dots: d + 2 }), // grows too fast
        makeItem('circle', color, 'medium', { dots: Math.max(1, d - 1) }), // shrinks instead
        makeItem('circle', color, 'medium', { dots: d + 3 }), // grows way too fast
      ];
    },
  };
}

function buildShrinkingDots(rng: Rng): BuiltPattern {
  const color = pick(rng, COLORS);
  const len = 5 + Math.floor(rng() * 2); // 5..6
  const start = len + Math.floor(rng() * 4); // smallest value stays >= 1
  const items = Array.from({ length: len }, (_, i) =>
    makeItem('circle', color, 'medium', { dots: start - i }),
  );
  return {
    items,
    candidates: (answer) => {
      const d = answer.dots ?? 1;
      return [
        makeItem('circle', color, 'medium', { dots: d }), // flat: no shrinking
        makeItem('circle', color, 'medium', { dots: Math.max(1, d - 2) }), // shrinks too fast
        makeItem('circle', color, 'medium', { dots: d + 1 }), // grows instead
        makeItem('circle', color, 'medium', { dots: Math.max(1, d - 3) }),
      ];
    },
  };
}

function buildCombo(rng: Rng): BuiltPattern {
  const [s1, s2] = pickDistinct(rng, SHAPES, 2);
  const color = pick(rng, COLORS);
  const units = [makeItem(s1, color, 'small'), makeItem(s2, color, 'large')];
  const items = [0, 1, 2, 3, 4, 5].map((i) => ({ ...units[i % 2] }));
  return {
    items,
    candidates: (answer, full, mi) => {
      const otherSize: SizeName = answer.size === 'small' ? 'large' : 'small';
      const otherShape = answer.shape === s1 ? s2 : s1;
      const novel = pick(
        rng,
        SHAPES.filter((s) => s !== s1 && s !== s2),
      );
      return [
        makeItem(answer.shape, color, otherSize), // right shape, wrong size
        makeItem(otherShape, color, answer.size), // wrong shape, right size
        { ...full[mi - 1] }, // copies the neighbor outright
        makeItem(novel, color, answer.size), // newcomer, right size
      ];
    },
  };
}

function buildColorShape(rng: Rng): BuiltPattern {
  const [s1, s2] = pickDistinct(rng, SHAPES, 2);
  const [c1, c2] = pickDistinct(rng, COLORS, 2);
  const units = [makeItem(s1, c1), makeItem(s2, c2)];
  const items = [0, 1, 2, 3, 4, 5].map((i) => ({ ...units[i % 2] }));
  return {
    items,
    candidates: (answer, full, mi) => {
      const otherColor = answer.color === c1 ? c2 : c1;
      const otherShape = answer.shape === s1 ? s2 : s1;
      const novel = pick(
        rng,
        SHAPES.filter((s) => s !== s1 && s !== s2),
      );
      return [
        makeItem(answer.shape, otherColor), // right shape, wrong color
        makeItem(otherShape, answer.color), // wrong shape, right color
        { ...full[mi - 1] }, // copies the neighbor outright
        makeItem(novel, answer.color), // newcomer in the right color
      ];
    },
  };
}

function buildNumberPlus2(rng: Rng): BuiltPattern {
  const color = pick(rng, COLORS);
  const start = 2 + 2 * Math.floor(rng() * 3); // 2, 4, or 6
  const len = 5 + Math.floor(rng() * 2); // 5..6
  const items = Array.from({ length: len }, (_, i) =>
    makeItem('square', color, 'medium', { value: start + 2 * i }),
  );
  return {
    items,
    candidates: (answer) => {
      const v = answer.value ?? 2;
      return [
        makeItem('square', color, 'medium', { value: v + 1 }), // counts by ones instead
        makeItem('square', color, 'medium', { value: v }), // flat: no counting at all
        makeItem('square', color, 'medium', { value: v + 4 }), // skips too far
        makeItem('square', color, 'medium', { value: Math.max(0, v - 2) }), // counts backward
      ];
    },
  };
}

function buildAab(rng: Rng): BuiltPattern {
  const [a, b] = pickDistinct(rng, SHAPES, 2);
  const color = pick(rng, COLORS);
  const seq: ShapeName[] = [a, a, b, a, a, b];
  const items = seq.map((s) => makeItem(s, color));
  return {
    items,
    candidates: (answer, full, mi) => {
      const other = answer.shape === a ? b : a;
      const novel = pick(
        rng,
        SHAPES.filter((s) => s !== a && s !== b),
      );
      const offColor = pick(
        rng,
        COLORS.filter((c) => c !== color),
      );
      return [
        makeItem(other, color), // breaks the double
        makeItem(full[mi - 1].shape, color), // copies the neighbor
        makeItem(novel, color), // newcomer crashes the parade
        makeItem(answer.shape, offColor), // right shape, wrong color
      ];
    },
  };
}

const BUILDERS: Record<PatternKind, (rng: Rng) => BuiltPattern> = {
  abab: buildAbab,
  aabb: buildAabb,
  abcabc: buildAbcabc,
  'color-ab': buildColorAb,
  'growing-dots': buildGrowingDots,
  'shrinking-dots': buildShrinkingDots,
  combo: buildCombo,
  'color-shape': buildColorShape,
  'number-plus2': buildNumberPlus2,
  aab: buildAab,
};

function dedupeItems(items: PatternItem[]): PatternItem[] {
  const out: PatternItem[] = [];
  for (const it of items) {
    if (!out.some((o) => itemsEqual(o, it))) out.push(it);
  }
  return out;
}

/** Fallback pool guaranteeing enough distinct wrong answers. */
function* fallbackPool(answer: PatternItem): Generator<PatternItem> {
  for (const shape of SHAPES) {
    for (const color of COLORS) {
      const cand = makeItem(shape, color);
      if (!itemsEqual(cand, answer)) yield cand;
    }
  }
}

/**
 * Generate one pattern round. Deterministic: the same (level, seed)
 * always yields the same round.
 */
export function generateRound(level: number, seed: number): PatternRound {
  const clamped = Math.min(5, Math.max(1, Math.floor(level) || 1));
  const rng = mulberry32(
    ((((seed >>> 0) * 2654435761) >>> 0) + clamped * 97) >>> 0,
  );
  const def = PATTERN_LEVELS[clamped - 1];
  const kind = def.kinds[Math.floor(rng() * def.kinds.length)];
  const built = BUILDERS[kind](rng);

  const items = built.items;
  // Hidden slot is never first: the parade needs a running start.
  const missingIndex = 1 + Math.floor(rng() * (items.length - 1));
  const answer = items[missingIndex];
  const sequence = items.map((it, i) => (i === missingIndex ? null : it));

  const choiceCount = clamped <= 2 ? 3 : 4;
  let distractors = dedupeItems(
    built
      .candidates(answer, items, missingIndex)
      .filter((d) => !itemsEqual(d, answer)),
  );
  if (distractors.length < choiceCount - 1) {
    for (const p of fallbackPool(answer)) {
      if (distractors.length >= choiceCount - 1) break;
      if (!distractors.some((d) => itemsEqual(d, p))) distractors.push(p);
    }
  }
  distractors = distractors.slice(0, choiceCount - 1);

  const choices = [...distractors];
  const answerIndex = Math.floor(rng() * choiceCount);
  choices.splice(answerIndex, 0, answer);

  return {
    id: `${clamped}-${seed}-${kind}`,
    level: clamped,
    kind,
    kindLabel: KIND_LABELS[kind],
    hostLine: HOST_LINES[kind],
    sequence,
    missingIndex,
    choices,
    answerIndex,
  };
}
