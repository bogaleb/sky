/**
 * Phonics Fun: sound-blending word bank + deterministic session logic.
 *
 * Pure logic lives here (no DOM). The game teaches kids to tap each sound
 * (phoneme) and then blend them into a whole word, in the style of the best
 * commercial reading apps.
 *
 *  68 items across 3 levels:
 *   L1 — 40 CVC words (bat, pen, sit…) with per-phoneme breakdowns
 *   L2 — 16 digraph words (shop, chin, bath…) with sh/ch/th/wh/ck sounds
 *   L3 — 12 sight words (me, we, see…) taught whole-word, no breakdown
 *
 * Sounds are TTS-friendly letter sounds ("buh", "ah", "shh") spoken by Luna.
 */

import { mulberry32 } from './words';

export interface PhonicsEntry {
  word: string;
  /** Grapheme breakdown, e.g. ['c','a','t'] or ['sh','o','p']. Empty for sight words. */
  phonemes: string[];
  /** TTS-friendly sound per phoneme, e.g. ['kuh','ah','tuh']. Empty for sight words. */
  sounds: string[];
  level: 1 | 2 | 3;
  /** Short spoken clue Luna reads with the word. */
  hint: string;
}

/** Level 1 — CVC words: consonant-vowel-consonant, the classic blending set. */
export const WORDS: PhonicsEntry[] = [
  { word: 'bat', phonemes: ['b', 'a', 't'], sounds: ['buh', 'ah', 'tuh'], level: 1, hint: 'A flying night animal!' },
  { word: 'rat', phonemes: ['r', 'a', 't'], sounds: ['rrr', 'ah', 'tuh'], level: 1, hint: 'A small animal with a long tail!' },
  { word: 'mat', phonemes: ['m', 'a', 't'], sounds: ['mmm', 'ah', 'tuh'], level: 1, hint: 'You wipe your feet on it!' },
  { word: 'cap', phonemes: ['c', 'a', 'p'], sounds: ['kuh', 'ah', 'puh'], level: 1, hint: 'You wear it on your head!' },
  { word: 'tap', phonemes: ['t', 'a', 'p'], sounds: ['tuh', 'ah', 'puh'], level: 1, hint: 'You turn it to get water!' },
  { word: 'bag', phonemes: ['b', 'a', 'g'], sounds: ['buh', 'ah', 'guh'], level: 1, hint: 'You carry things in it!' },
  { word: 'tag', phonemes: ['t', 'a', 'g'], sounds: ['tuh', 'ah', 'guh'], level: 1, hint: 'You are it in the game of tag!' },
  { word: 'jam', phonemes: ['j', 'a', 'm'], sounds: ['juh', 'ah', 'mmm'], level: 1, hint: 'Sweet spread for toast!' },
  { word: 'van', phonemes: ['v', 'a', 'n'], sounds: ['vvv', 'ah', 'nnn'], level: 1, hint: 'A big car for the family!' },
  { word: 'cab', phonemes: ['c', 'a', 'b'], sounds: ['kuh', 'ah', 'buh'], level: 1, hint: 'A yellow taxi car!' },
  { word: 'pen', phonemes: ['p', 'e', 'n'], sounds: ['puh', 'eh', 'nnn'], level: 1, hint: 'You write with it!' },
  { word: 'ten', phonemes: ['t', 'e', 'n'], sounds: ['tuh', 'eh', 'nnn'], level: 1, hint: 'Two hands have this many fingers!' },
  { word: 'jet', phonemes: ['j', 'e', 't'], sounds: ['juh', 'eh', 'tuh'], level: 1, hint: 'A super fast airplane!' },
  { word: 'net', phonemes: ['n', 'e', 't'], sounds: ['nnn', 'eh', 'tuh'], level: 1, hint: 'It catches fish and butterflies!' },
  { word: 'red', phonemes: ['r', 'e', 'd'], sounds: ['rrr', 'eh', 'duh'], level: 1, hint: 'The color of apples and fire trucks!' },
  { word: 'leg', phonemes: ['l', 'e', 'g'], sounds: ['lll', 'eh', 'guh'], level: 1, hint: 'You stand on two of them!' },
  { word: 'web', phonemes: ['w', 'e', 'b'], sounds: ['wuh', 'eh', 'buh'], level: 1, hint: 'A spider spins it!' },
  { word: 'big', phonemes: ['b', 'i', 'g'], sounds: ['buh', 'ih', 'guh'], level: 1, hint: 'Not small!' },
  { word: 'dig', phonemes: ['d', 'i', 'g'], sounds: ['duh', 'ih', 'guh'], level: 1, hint: 'You do it in the sand with a shovel!' },
  { word: 'fig', phonemes: ['f', 'i', 'g'], sounds: ['fff', 'ih', 'guh'], level: 1, hint: 'A sweet little fruit!' },
  { word: 'wig', phonemes: ['w', 'i', 'g'], sounds: ['wuh', 'ih', 'guh'], level: 1, hint: 'Funny hair you can wear!' },
  { word: 'pin', phonemes: ['p', 'i', 'n'], sounds: ['puh', 'ih', 'nnn'], level: 1, hint: 'It holds papers together!' },
  { word: 'sit', phonemes: ['s', 'i', 't'], sounds: ['sss', 'ih', 'tuh'], level: 1, hint: 'You do it on a chair!' },
  { word: 'kit', phonemes: ['k', 'i', 't'], sounds: ['kuh', 'ih', 'tuh'], level: 1, hint: 'A box of tools or toys!' },
  { word: 'zip', phonemes: ['z', 'i', 'p'], sounds: ['zzz', 'ih', 'puh'], level: 1, hint: 'It closes your jacket!' },
  { word: 'log', phonemes: ['l', 'o', 'g'], sounds: ['lll', 'aw', 'guh'], level: 1, hint: 'A thick piece of a tree!' },
  { word: 'fog', phonemes: ['f', 'o', 'g'], sounds: ['fff', 'aw', 'guh'], level: 1, hint: 'Clouds close to the ground!' },
  { word: 'top', phonemes: ['t', 'o', 'p'], sounds: ['tuh', 'aw', 'puh'], level: 1, hint: 'The highest part!' },
  { word: 'hop', phonemes: ['h', 'o', 'p'], sounds: ['huh', 'aw', 'puh'], level: 1, hint: 'A bunny moves this way!' },
  { word: 'mop', phonemes: ['m', 'o', 'p'], sounds: ['mmm', 'aw', 'puh'], level: 1, hint: 'It cleans the floor!' },
  { word: 'pot', phonemes: ['p', 'o', 't'], sounds: ['puh', 'aw', 'tuh'], level: 1, hint: 'You cook soup in it!' },
  { word: 'hot', phonemes: ['h', 'o', 't'], sounds: ['huh', 'aw', 'tuh'], level: 1, hint: 'Not cold!' },
  { word: 'dot', phonemes: ['d', 'o', 't'], sounds: ['duh', 'aw', 'tuh'], level: 1, hint: 'A tiny round spot!' },
  { word: 'cob', phonemes: ['c', 'o', 'b'], sounds: ['kuh', 'aw', 'buh'], level: 1, hint: 'Corn grows on it!' },
  { word: 'bun', phonemes: ['b', 'u', 'n'], sounds: ['buh', 'uh', 'nnn'], level: 1, hint: 'A soft round bread!' },
  { word: 'fun', phonemes: ['f', 'u', 'n'], sounds: ['fff', 'uh', 'nnn'], level: 1, hint: 'Playing and laughing!' },
  { word: 'run', phonemes: ['r', 'u', 'n'], sounds: ['rrr', 'uh', 'nnn'], level: 1, hint: 'Faster than walking!' },
  { word: 'pup', phonemes: ['p', 'u', 'p'], sounds: ['puh', 'uh', 'puh'], level: 1, hint: 'A baby dog!' },
  { word: 'hug', phonemes: ['h', 'u', 'g'], sounds: ['huh', 'uh', 'guh'], level: 1, hint: 'A warm squeeze!' },
  { word: 'rug', phonemes: ['r', 'u', 'g'], sounds: ['rrr', 'uh', 'guh'], level: 1, hint: 'A soft carpet on the floor!' },
];

/** Level 2 — digraph words: two letters, one sound (sh, ch, th, wh, ck). */
export const DIGRAPHS: PhonicsEntry[] = [
  { word: 'shop', phonemes: ['sh', 'o', 'p'], sounds: ['shh', 'aw', 'puh'], level: 2, hint: 'You buy things there! Sh, sh!' },
  { word: 'shed', phonemes: ['sh', 'e', 'd'], sounds: ['shh', 'eh', 'duh'], level: 2, hint: 'A little house in the garden! Sh, sh!' },
  { word: 'shin', phonemes: ['sh', 'i', 'n'], sounds: ['shh', 'ih', 'nnn'], level: 2, hint: 'The front of your leg! Sh, sh!' },
  { word: 'chin', phonemes: ['ch', 'i', 'n'], sounds: ['chuh', 'ih', 'nnn'], level: 2, hint: 'Right under your mouth! Ch, ch!' },
  { word: 'chat', phonemes: ['ch', 'a', 't'], sounds: ['chuh', 'ah', 'tuh'], level: 2, hint: 'A friendly talk! Ch, ch!' },
  { word: 'chop', phonemes: ['ch', 'o', 'p'], sounds: ['chuh', 'aw', 'puh'], level: 2, hint: 'Cut it up small! Ch, ch!' },
  { word: 'thin', phonemes: ['th', 'i', 'n'], sounds: ['thuh', 'ih', 'nnn'], level: 2, hint: 'Not thick! Th, th!' },
  { word: 'thick', phonemes: ['th', 'i', 'ck'], sounds: ['thuh', 'ih', 'kuh'], level: 2, hint: 'Not thin! Th, th!' },
  { word: 'them', phonemes: ['th', 'e', 'm'], sounds: ['thuh', 'eh', 'mmm'], level: 2, hint: 'All of them! Th, th!' },
  { word: 'when', phonemes: ['wh', 'e', 'n'], sounds: ['wuh', 'eh', 'nnn'], level: 2, hint: 'What time? Wh, wh!' },
  { word: 'whip', phonemes: ['wh', 'i', 'p'], sounds: ['wuh', 'ih', 'puh'], level: 2, hint: 'Stir it fast! Wh, wh!' },
  { word: 'which', phonemes: ['wh', 'i', 'ch'], sounds: ['wuh', 'ih', 'chuh'], level: 2, hint: 'This one or that one? Wh, wh!' },
  { word: 'path', phonemes: ['p', 'a', 'th'], sounds: ['puh', 'ah', 'thuh'], level: 2, hint: 'A little walking road! Th, th!' },
  { word: 'bath', phonemes: ['b', 'a', 'th'], sounds: ['buh', 'ah', 'thuh'], level: 2, hint: 'Splash in the tub! Th, th!' },
  { word: 'with', phonemes: ['w', 'i', 'th'], sounds: ['wuh', 'ih', 'thuh'], level: 2, hint: 'Together! Th, th!' },
  { word: 'back', phonemes: ['b', 'a', 'ck'], sounds: ['buh', 'ah', 'kuh'], level: 2, hint: 'Behind you! Ck, ck!' },
];

/** Level 3 — sight words: taught whole-word, no phoneme breakdown. */
export const SIGHTS: PhonicsEntry[] = [
  { word: 'me', phonemes: [], sounds: [], level: 3, hint: 'That is me!' },
  { word: 'we', phonemes: [], sounds: [], level: 3, hint: 'You and me together!' },
  { word: 'my', phonemes: [], sounds: [], level: 3, hint: 'It belongs to me!' },
  { word: 'by', phonemes: [], sounds: [], level: 3, hint: 'Right next to!' },
  { word: 'she', phonemes: [], sounds: [], level: 3, hint: 'A girl!' },
  { word: 'he', phonemes: [], sounds: [], level: 3, hint: 'A boy!' },
  { word: 'see', phonemes: [], sounds: [], level: 3, hint: 'I see with my eyes!' },
  { word: 'no', phonemes: [], sounds: [], level: 3, hint: 'The opposite of yes!' },
  { word: 'go', phonemes: [], sounds: [], level: 3, hint: 'Time to move!' },
  { word: 'so', phonemes: [], sounds: [], level: 3, hint: 'So much fun!' },
  { word: 'up', phonemes: [], sounds: [], level: 3, hint: 'Toward the sky!' },
  { word: 'is', phonemes: [], sounds: [], level: 3, hint: 'It is a word!' },
];

export const ALL_PHONICS: PhonicsEntry[] = [...WORDS, ...DIGRAPHS, ...SIGHTS];

export function phonicsForLevel(level: 1 | 2 | 3): PhonicsEntry[] {
  return ALL_PHONICS.filter((w) => w.level === level);
}

/** True for blending words (levels 1-2); sight words (level 3) skip the blend step. */
export function isBlendable(entry: PhonicsEntry): boolean {
  return entry.phonemes.length > 0 && entry.sounds.length > 0;
}

export const PHONICS_PER_GAME = 8;
/** Level ramp across the 8 rounds of a game: 1,1,2,2,3,3,3,3. */
export const PHONICS_RAMP: Array<1 | 2 | 3> = [1, 1, 2, 2, 3, 3, 3, 3];

/**
 * Pick 8 items for a game, ramping levels 1→3. Deterministic per seed,
 * never repeats a word within a game.
 */
export function pickSession(seed: number): PhonicsEntry[] {
  const rand = mulberry32(seed ^ 0x51ab3f2d);
  const used = new Set<string>();
  return PHONICS_RAMP.map((level) => {
    const pool = phonicsForLevel(level).filter((w) => !used.has(w.word));
    const pick = pool[Math.floor(rand() * pool.length)];
    used.add(pick.word);
    return pick;
  });
}

/**
 * Build 3 word choices for the matching step: the answer plus 2
 * same-level distractors, deterministically shuffled.
 */
export function pickChoices(entry: PhonicsEntry, seed: number): PhonicsEntry[] {
  const rand = mulberry32(seed ^ 0x77aa1c5e);
  const pool = phonicsForLevel(entry.level).filter((w) => w.word !== entry.word);
  const distractors = [...pool].sort(() => rand() - 0.5).slice(0, 2);
  const all = [entry, ...distractors];
  return all.sort(() => rand() - 0.5);
}

/**
 * The skill a phonics item is evidence for. CVC blends are blending level 3
 * ("c-a-t = cat"), digraph blends are level 4 ("ship"); sight words are read
 * whole, so they count toward sight_words (level 2: early common words).
 */
export function skillForPhonics(entry: PhonicsEntry): { skill: 'blending' | 'sight_words'; level: number } {
  if (entry.level === 3) return { skill: 'sight_words', level: 2 };
  return { skill: 'blending', level: entry.level === 2 ? 4 : 3 };
}
