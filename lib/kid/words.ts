/**
 * Word Builder: spelling word bank + deterministic game logic.
 *
 * 52 words across 4 levels:
 *  L1 — CVC words (cat, dog, sun…)
 *  L2 — CCVC / CVCC words (frog, jump…)
 *  L3 — digraph words (ship, chick…)
 *  L4 — sight words (the, said…)
 *
 * Pure logic lives here (no DOM). Pictograms live in ./word-art.tsx and
 * are re-exported so `import { ... } from '@/lib/kid/words'` gets everything.
 */

import { WORD_ART, WordFallbackArt, pictogramKey, type Pictogram } from './word-art';

export type { Pictogram };
export { WORD_ART, WordFallbackArt };

export interface WordEntry {
  word: string;
  level: 1 | 2 | 3 | 4;
  /** Short spoken clue Luna reads with the word. */
  hint: string;
}

export const WORDS: WordEntry[] = [
  // Level 1 — CVC (consonant-vowel-consonant)
  { word: 'cat', level: 1, hint: 'It says meow!' },
  { word: 'dog', level: 1, hint: 'It says woof!' },
  { word: 'sun', level: 1, hint: 'It shines in the sky!' },
  { word: 'pig', level: 1, hint: 'It says oink!' },
  { word: 'hat', level: 1, hint: 'You wear it on your head!' },
  { word: 'box', level: 1, hint: 'You put toys inside it!' },
  { word: 'cup', level: 1, hint: 'You drink from it!' },
  { word: 'bus', level: 1, hint: 'It takes you to school!' },
  { word: 'hen', level: 1, hint: 'It lays eggs!' },
  { word: 'pan', level: 1, hint: 'You cook pancakes in it!' },
  { word: 'map', level: 1, hint: 'It shows you the way!' },
  { word: 'bed', level: 1, hint: 'You sleep in it!' },
  { word: 'fox', level: 1, hint: 'A clever orange animal!' },
  { word: 'jar', level: 1, hint: 'You keep cookies in it!' },
  // Level 2 — blends: CCVC and CVCC
  { word: 'frog', level: 2, hint: 'It says ribbit and hops!' },
  { word: 'crab', level: 2, hint: 'It walks sideways and snaps!' },
  { word: 'drum', level: 2, hint: 'You bang it to make music!' },
  { word: 'flag', level: 2, hint: 'It waves in the wind!' },
  { word: 'slug', level: 2, hint: 'A slow, wiggly garden friend!' },
  { word: 'nest', level: 2, hint: "A bird's cozy home!" },
  { word: 'jump', level: 2, hint: 'You do it with both feet!' },
  { word: 'milk', level: 2, hint: 'Cows make it white!' },
  { word: 'lamp', level: 2, hint: 'It lights up the dark!' },
  { word: 'tent', level: 2, hint: 'You sleep in it when camping!' },
  { word: 'pond', level: 2, hint: 'Frogs splash in it!' },
  { word: 'hand', level: 2, hint: 'You wave with it!' },
  { word: 'belt', level: 2, hint: 'It holds your pants up!' },
  { word: 'dust', level: 2, hint: 'Tiny bits that tickle your nose!' },
  // Level 3 — digraphs (sh, ch, wh, th, ck)
  { word: 'ship', level: 3, hint: 'It sails on the sea! Sh, sh!' },
  { word: 'fish', level: 3, hint: 'It swims! Sh, sh!' },
  { word: 'chick', level: 3, hint: 'A baby chicken! Ch, ch!' },
  { word: 'cheese', level: 3, hint: 'Mice love it! Ch, ch!' },
  { word: 'whale', level: 3, hint: 'The biggest sea animal! Wh, wh!' },
  { word: 'wheel', level: 3, hint: 'It goes round and round! Wh, wh!' },
  { word: 'this', level: 3, hint: 'Points right here! Th, th!' },
  { word: 'that', level: 3, hint: 'Points over there! Th, th!' },
  { word: 'moth', level: 3, hint: 'A fuzzy night flyer! Th, th!' },
  { word: 'duck', level: 3, hint: 'It says quack! Ck, ck!' },
  { word: 'sock', level: 3, hint: 'You wear it on your foot! Ck, ck!' },
  { word: 'clock', level: 3, hint: 'It tells the time! Ck, ck!' },
  // Level 4 — sight words
  { word: 'the', level: 4, hint: 'The word you see everywhere!' },
  { word: 'and', level: 4, hint: 'It joins things together!' },
  { word: 'you', level: 4, hint: 'That means YOU!' },
  { word: 'said', level: 4, hint: 'What someone told!' },
  { word: 'was', level: 4, hint: "Yesterday's is!" },
  { word: 'are', level: 4, hint: 'You are amazing!' },
  { word: 'have', level: 4, hint: 'You have toys!' },
  { word: 'like', level: 4, hint: 'I like you!' },
  { word: 'come', level: 4, hint: 'Come here, please!' },
  { word: 'here', level: 4, hint: 'Right here!' },
  { word: 'they', level: 4, hint: 'All of them together!' },
  { word: 'what', level: 4, hint: 'A question word!' },
];

export function wordsForLevel(level: 1 | 2 | 3 | 4): WordEntry[] {
  return WORDS.filter((w) => w.level === level);
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/** True when a word is consonant-vowel-consonant (the L1 pattern). */
export function isCVC(word: string): boolean {
  const w = word.toLowerCase();
  if (w.length !== 3) return false;
  return !VOWELS.has(w[0]) && VOWELS.has(w[1]) && !VOWELS.has(w[2]);
}

/** Deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher-Yates shuffle. Same seed → same order. */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const WORDS_PER_GAME = 8;
/** Level ramp across the 8 words of a game: 1,1,2,2,3,3,4,4. */
export const LEVEL_RAMP: Array<1 | 2 | 3 | 4> = [1, 1, 2, 2, 3, 3, 4, 4];

/**
 * Pick 8 words for a game, ramping levels 1→4. Deterministic per seed,
 * never repeats a word within a game.
 */
export function pickGameWords(seed: number): WordEntry[] {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const used = new Set<string>();
  return LEVEL_RAMP.map((level) => {
    const pool = wordsForLevel(level).filter((w) => !used.has(w.word));
    const pick = pool[Math.floor(rand() * pool.length)];
    used.add(pick.word);
    return pick;
  });
}

/** Pictogram component for a word, falling back to a letter block. */
export function pictogramFor(word: string): Pictogram {
  return pictogramKey(word) ?? WordFallbackArt;
}

/** True when the word has its own dedicated pictogram. */
export function hasPictogram(word: string): boolean {
  return pictogramKey(word) !== undefined;
}

/**
 * The build_words level a spelling item is evidence for: CVC words are level
 * 2 ("three-letter words from letter tiles"); blends, digraphs and sight
 * words are level 3.
 */
export function buildWordsLevel(entry: WordEntry): number {
  return entry.level === 1 ? 2 : 3;
}
