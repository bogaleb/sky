/**
 * Opposites Attic — antonym vocabulary engine, hosted by Luna.
 * 36 opposite pairs across 3 levels. Two round kinds:
 *  - "ask":  "What is the opposite of X?" with 3 word choices.
 *  - "match": 6 cards (3 hidden pairs) — tap the two that are opposites.
 * Pure and deterministic: the same seed always produces the same session.
 */

import { mulberry32 } from './words';

export interface OppositePair {
  /** One side of the pair (either side can be the prompt). */
  word: string;
  /** The antonym partner. */
  opposite: string;
  /** 1 = concrete everyday, 2 = common, 3 = trickier. */
  level: 1 | 2 | 3;
}

export const OPPOSITE_PAIRS: OppositePair[] = [
  // Level 1 — concrete, everyday opposites.
  { word: 'big', opposite: 'little', level: 1 },
  { word: 'hot', opposite: 'cold', level: 1 },
  { word: 'fast', opposite: 'slow', level: 1 },
  { word: 'up', opposite: 'down', level: 1 },
  { word: 'in', opposite: 'out', level: 1 },
  { word: 'happy', opposite: 'sad', level: 1 },
  { word: 'day', opposite: 'night', level: 1 },
  { word: 'open', opposite: 'close', level: 1 },
  { word: 'yes', opposite: 'no', level: 1 },
  { word: 'on', opposite: 'off', level: 1 },
  { word: 'tall', opposite: 'short', level: 1 },
  { word: 'wet', opposite: 'dry', level: 1 },
  // Level 2 — common opposites.
  { word: 'light', opposite: 'dark', level: 2 },
  { word: 'empty', opposite: 'full', level: 2 },
  { word: 'start', opposite: 'finish', level: 2 },
  { word: 'push', opposite: 'pull', level: 2 },
  { word: 'loud', opposite: 'quiet', level: 2 },
  { word: 'clean', opposite: 'dirty', level: 2 },
  { word: 'new', opposite: 'old', level: 2 },
  { word: 'sweet', opposite: 'sour', level: 2 },
  { word: 'near', opposite: 'far', level: 2 },
  { word: 'laugh', opposite: 'cry', level: 2 },
  { word: 'win', opposite: 'lose', level: 2 },
  { word: 'above', opposite: 'below', level: 2 },
  // Level 3 — trickier opposites.
  { word: 'brave', opposite: 'scared', level: 3 },
  { word: 'smooth', opposite: 'rough', level: 3 },
  { word: 'kind', opposite: 'mean', level: 3 },
  { word: 'early', opposite: 'late', level: 3 },
  { word: 'strong', opposite: 'weak', level: 3 },
  { word: 'thick', opposite: 'thin', level: 3 },
  { word: 'wide', opposite: 'narrow', level: 3 },
  { word: 'heavy', opposite: 'light', level: 3 },
  { word: 'asleep', opposite: 'awake', level: 3 },
  { word: 'young', opposite: 'old', level: 3 },
  { word: 'give', opposite: 'take', level: 3 },
  { word: 'sit', opposite: 'stand', level: 3 },
];

export const ROUNDS_PER_GAME = 8;

/**
 * Words that could defensibly pair with a word even though they are not its
 * listed partner (e.g. "light" is the opposite of both "dark" and "heavy").
 * These are excluded from distractors and from sharing a match round.
 */
export const AMBIGUOUS_PARTNERS: Record<string, string[]> = {
  light: ['heavy'],
  heavy: ['light'],
  old: ['young', 'new'],
  young: ['old'],
  new: ['old'],
  day: ['dark'],
  dark: ['day'],
};

function ambiguousWith(word: string): string[] {
  return AMBIGUOUS_PARTNERS[word] ?? [];
}

/** True when a and b are listed partners (in either direction) of some pair. */
export function areOpposites(a: string, b: string, pairs: OppositePair[] = OPPOSITE_PAIRS): boolean {
  return pairs.some(
    (p) => (p.word === a && p.opposite === b) || (p.word === b && p.opposite === a)
  );
}

/** Look up the pair containing a word (as either side), or undefined. */
export function pairFor(word: string, pairs: OppositePair[] = OPPOSITE_PAIRS): OppositePair | undefined {
  return pairs.find((p) => p.word === word || p.opposite === word);
}

/** The antonym of a word from its pair, or undefined when unknown. */
export function oppositeOf(word: string, pairs: OppositePair[] = OPPOSITE_PAIRS): string | undefined {
  const pair = pairFor(word, pairs);
  if (!pair) return undefined;
  return pair.word === word ? pair.opposite : pair.word;
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Clamp to the supported levels. */
export function levelFor(level: number): 1 | 2 | 3 {
  if (level <= 1) return 1;
  if (level >= 3) return 3;
  return 2;
}

export interface AskRound {
  kind: 'ask';
  /** The prompt word. */
  word: string;
  /** 3 shuffled choices: the opposite + 2 distractors. */
  choices: string[];
  /** The correct opposite. */
  answer: string;
}

export interface MatchRound {
  kind: 'match';
  /** 6 shuffled word cards hiding 3 opposite pairs. */
  cards: string[];
  /** The 3 pairs, as [word, opposite] tuples. */
  pairs: [string, string][];
}

export type OppositeRound = AskRound | MatchRound;

/**
 * One "What is the opposite of X?" round from the given level.
 * Distractors come from other pairs' words and are never the word itself,
 * its partner, or an ambiguously-pairable word.
 */
export function generateQuestion(level: number, seed: number): AskRound {
  const lvl = levelFor(level);
  const rng = mulberry32(seed);
  const pool = OPPOSITE_PAIRS.filter((p) => p.level === lvl);
  const pair = pool[Math.floor(rng() * pool.length)];
  const promptFirst = rng() < 0.5;
  const word = promptFirst ? pair.word : pair.opposite;
  const answer = promptFirst ? pair.opposite : pair.word;

  const banned = new Set([word, answer, ...ambiguousWith(word), ...ambiguousWith(answer)]);
  const distractorPool = shuffled(
    OPPOSITE_PAIRS.flatMap((p) => [p.word, p.opposite]).filter((w) => !banned.has(w)),
    rng
  );
  const distractors = distractorPool.slice(0, 2);
  const choices = shuffled([answer, ...distractors], rng);
  return { kind: 'ask', word, choices, answer };
}

/**
 * One match round: 3 pairs (6 cards). Pairs are chosen so no word repeats
 * and no cross-pair ambiguity can sneak in.
 */
export function generateMatchRound(seed: number): MatchRound {
  const rng = mulberry32(seed);
  const chosen: OppositePair[] = [];
  const used = new Set<string>();
  for (const candidate of shuffled(OPPOSITE_PAIRS, rng)) {
    if (chosen.length >= 3) break;
    const words = [candidate.word, candidate.opposite];
    if (words.some((w) => used.has(w))) continue;
    const clashes = chosen.some((c) =>
      [c.word, c.opposite].some(
        (w) => ambiguousWith(w).some((a) => words.includes(a)) || words.some((x) => ambiguousWith(x).includes(w))
      )
    );
    if (clashes) continue;
    chosen.push(candidate);
    words.forEach((w) => used.add(w));
  }
  const pairs: [string, string][] = chosen.map((p) => [p.word, p.opposite]);
  const cards = shuffled(pairs.flat(), rng);
  return { kind: 'match', cards, pairs };
}

/** Session level ramp: concrete first, trickier later. */
export function levelForRound(index: number): 1 | 2 | 3 {
  if (index < 3) return 1;
  if (index < 6) return 2;
  return 3;
}

/** 8 deterministic rounds: ask, ask, match, ask, ask, match, ask, match. */
export function pickSession(seed: number): OppositeRound[] {
  const kinds: Array<'ask' | 'match'> = ['ask', 'ask', 'match', 'ask', 'ask', 'match', 'ask', 'match'];
  return kinds.map((kind, i) =>
    kind === 'ask'
      ? generateQuestion(levelForRound(i), seed + i * 7919)
      : generateMatchRound(seed + i * 104729)
  );
}

/**
 * The vocabulary level (1–5) an opposite word is evidence for: common pairs
 * like big/little are level 2 ("Matches simple opposites"), the rest level 3.
 */
export function oppositeSkillLevel(word: string): number {
  const pair = OPPOSITE_PAIRS.find((p) => p.word === word || p.opposite === word);
  return pair && pair.level === 1 ? 2 : 3;
}
