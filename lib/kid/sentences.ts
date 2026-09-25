/**
 * Sentence Studio engine: kids arrange shuffled word tiles to build real
 * sentences. Pure + deterministic (mulberry32), so tests and gameplay agree.
 *
 * Levels:
 *  L1 — 3-word sentences ("The cat naps.")
 *  L2 — 4-5 word sentences ("The big dog barks.")
 *  L3 — 6+ word sentences with and/because ("The cat naps because it is tired.")
 */

import { mulberry32, seededShuffle } from './words';

export interface SentenceEntry {
  /** Display sentence, capital first word, period at the end. */
  text: string;
  level: 1 | 2 | 3;
}

export const SENTENCES: SentenceEntry[] = [
  // L1 — three words
  { text: 'The cat naps.', level: 1 },
  { text: 'The dog runs.', level: 1 },
  { text: 'The sun shines.', level: 1 },
  { text: 'The bee buzzes.', level: 1 },
  { text: 'The fish swims.', level: 1 },
  { text: 'The bird sings.', level: 1 },
  { text: 'The pig digs.', level: 1 },
  { text: 'The frog jumps.', level: 1 },
  // L2 — four to five words
  { text: 'The big dog barks.', level: 2 },
  { text: 'My cat likes milk.', level: 2 },
  { text: 'The red bus stops.', level: 2 },
  { text: 'A frog hops high.', level: 2 },
  { text: 'The bees make honey.', level: 2 },
  { text: 'My friend reads books.', level: 2 },
  { text: 'Ducks swim in ponds.', level: 2 },
  { text: 'The moon glows tonight.', level: 2 },
  // L3 — six or more words, with and/because
  { text: 'The cat naps because it is tired.', level: 3 },
  { text: 'Dogs bark loudly and birds sing sweetly.', level: 3 },
  { text: 'I like red apples and yellow bananas.', level: 3 },
  { text: 'The turtle walks slowly because he is calm.', level: 3 },
  { text: 'Bees buzz loudly and flowers bloom brightly.', level: 3 },
  { text: 'My robot beeps because it is happy.', level: 3 },
  { text: 'We read books and sing songs.', level: 3 },
  { text: 'The owl hoots because night is here.', level: 3 },
];

export interface WordTile {
  id: string;
  /** Display text: first tile capitalized, last tile carries the period. */
  text: string;
}

export interface SentenceRound {
  sentence: string;
  words: string[];
  tiles: WordTile[];
  /** Tile ids in correct sentence order. */
  answer: string[];
  level: 1 | 2 | 3;
}

/** A sentence is valid when it starts with a capital and ends with a period. */
export function isValidSentence(text: string): boolean {
  if (!text || text.length < 3) return false;
  const first = text[0];
  return first === first.toUpperCase() && first !== first.toLowerCase() && text.endsWith('.');
}

export function sentencesForLevel(level: 1 | 2 | 3): SentenceEntry[] {
  return SENTENCES.filter((s) => s.level === level);
}

/** Split a sentence into display words; first capitalized, last with period. */
export function sentenceWords(sentence: string): string[] {
  return sentence.split(' ');
}

function tilesForWords(words: string[]): { tiles: WordTile[]; answer: string[] } {
  const tiles: WordTile[] = words.map((text, i) => ({ id: `t${i}`, text }));
  return { tiles, answer: tiles.map((t) => t.id) };
}

export function generateRound(level: 1 | 2 | 3, seed: number): SentenceRound {
  const pool = sentencesForLevel(level);
  const rand = mulberry32(seed);
  const entry = pool[Math.floor(rand() * pool.length)] ?? pool[0];
  return roundFromEntry(entry, seed);
}

function roundFromEntry(entry: SentenceEntry, seed: number): SentenceRound {
  const words = sentenceWords(entry.text);
  const { tiles, answer } = tilesForWords(words);
  return {
    sentence: entry.text,
    words,
    tiles: seededShuffle(tiles, seed ^ 0x51ed),
    answer,
    level: entry.level,
  };
}

/** 8-round ramp: L1 x3, L2 x3, L3 x2. */
export const ROUNDS_PER_GAME = 8;

export function levelForRound(roundIndex: number): 1 | 2 | 3 {
  if (roundIndex < 3) return 1;
  if (roundIndex < 6) return 2;
  return 3;
}

export function pickRounds(seed: number): SentenceRound[] {
  // Shuffle each level's pool once so a game never repeats a sentence.
  const pools: Record<1 | 2 | 3, SentenceEntry[]> = {
    1: seededShuffle(sentencesForLevel(1), seed ^ 0x1e01),
    2: seededShuffle(sentencesForLevel(2), seed ^ 0x2e00),
    3: seededShuffle(sentencesForLevel(3), seed ^ 0x3e00),
  };
  const used: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  const rounds: SentenceRound[] = [];
  for (let i = 0; i < ROUNDS_PER_GAME; i++) {
    const level = levelForRound(i);
    const pool = pools[level];
    const entry = pool[used[level] % pool.length];
    used[level] += 1;
    rounds.push(roundFromEntry(entry, seed + i * 7919));
  }
  return rounds;
}

/** Rebuild the display sentence from tiles placed in order. */
export function builtSentence(placed: WordTile[]): string {
  return placed.map((t) => t.text).join(' ');
}
