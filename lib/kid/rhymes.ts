/**
 * Rhyme Time — phonics rhyming engine.
 * 36 word-family rhyme sets. Each set: a prompt word, 4 rhyming words,
 * and 4 non-rhyming words for plausible distractors.
 * Pure and deterministic: the same seed always produces the same session.
 */

import { mulberry32 } from './words';

export interface RhymeSet {
  family: string;
  prompt: string;
  rhymes: string[];
  nonRhymes: string[];
}

export const RHYME_SETS: RhymeSet[] = [
  { family: '-at', prompt: 'cat', rhymes: ['hat', 'bat', 'mat', 'sat'], nonRhymes: ['dog', 'run', 'fish', 'sun'] },
  { family: '-og', prompt: 'dog', rhymes: ['fog', 'log', 'frog', 'hog'], nonRhymes: ['cat', 'pen', 'cup', 'bed'] },
  { family: '-in', prompt: 'pin', rhymes: ['win', 'bin', 'grin', 'spin'], nonRhymes: ['hat', 'log', 'tub', 'cake'] },
  { family: '-ed', prompt: 'bed', rhymes: ['red', 'fed', 'sled', 'bread'], nonRhymes: ['sun', 'map', 'kite', 'drum'] },
  { family: '-ake', prompt: 'cake', rhymes: ['bake', 'lake', 'rake', 'snake'], nonRhymes: ['pig', 'top', 'van', 'box'] },
  { family: '-ight', prompt: 'light', rhymes: ['night', 'right', 'kite', 'bright'], nonRhymes: ['ball', 'nest', 'drum', 'fox'] },
  { family: '-un', prompt: 'sun', rhymes: ['run', 'fun', 'bun', 'drum'], nonRhymes: ['cat', 'pig', 'leaf', 'rock'] },
  { family: '-ell', prompt: 'bell', rhymes: ['well', 'shell', 'yell', 'tell'], nonRhymes: ['dog', 'fish', 'cup', 'cake'] },
  { family: '-op', prompt: 'top', rhymes: ['hop', 'pop', 'mop', 'stop'], nonRhymes: ['pen', 'bug', 'nest', 'van'] },
  { family: '-an', prompt: 'pan', rhymes: ['can', 'fan', 'man', 'van'], nonRhymes: ['dog', 'cup', 'leaf', 'box'] },
  { family: '-ig', prompt: 'pig', rhymes: ['big', 'dig', 'wig', 'twig'], nonRhymes: ['hat', 'sun', 'nest', 'rock'] },
  { family: '-et', prompt: 'pet', rhymes: ['wet', 'net', 'jet', 'vet'], nonRhymes: ['bug', 'fox', 'drum', 'ball'] },
  { family: '-ug', prompt: 'bug', rhymes: ['hug', 'mug', 'rug', 'tug'], nonRhymes: ['pen', 'cat', 'fish', 'kite'] },
  { family: '-ack', prompt: 'back', rhymes: ['sack', 'tack', 'black', 'pack'], nonRhymes: ['sun', 'dog', 'leaf', 'top'] },
  { family: '-ing', prompt: 'sing', rhymes: ['ring', 'wing', 'king', 'swing'], nonRhymes: ['hat', 'cup', 'box', 'nest'] },
  { family: '-ot', prompt: 'hot', rhymes: ['pot', 'dot', 'not', 'spot'], nonRhymes: ['fish', 'pen', 'ball', 'drum'] },
  { family: '-ay', prompt: 'day', rhymes: ['say', 'play', 'way', 'hay'], nonRhymes: ['pig', 'fox', 'cup', 'nest'] },
  { family: '-ee', prompt: 'bee', rhymes: ['tree', 'see', 'knee', 'free'], nonRhymes: ['cat', 'dog', 'sun', 'box'] },
  { family: '-all', prompt: 'ball', rhymes: ['tall', 'fall', 'hall', 'wall'], nonRhymes: ['pig', 'sun', 'kite', 'nest'] },
  { family: '-ump', prompt: 'jump', rhymes: ['bump', 'dump', 'pump', 'hump'], nonRhymes: ['cat', 'leaf', 'pen', 'rock'] },
  { family: '-ick', prompt: 'kick', rhymes: ['lick', 'pick', 'sick', 'stick'], nonRhymes: ['dog', 'sun', 'top', 'van'] },
  { family: '-ide', prompt: 'ride', rhymes: ['hide', 'wide', 'side', 'slide'], nonRhymes: ['bug', 'pen', 'fox', 'cup'] },
  { family: '-ap', prompt: 'map', rhymes: ['cap', 'tap', 'nap', 'clap'], nonRhymes: ['dog', 'fish', 'sun', 'kite'] },
  { family: '-est', prompt: 'nest', rhymes: ['best', 'rest', 'test', 'west'], nonRhymes: ['pig', 'cup', 'ball', 'fox'] },
  { family: '-unk', prompt: 'trunk', rhymes: ['bunk', 'dunk', 'hunk', 'sunk'], nonRhymes: ['cat', 'pen', 'leaf', 'top'] },
  { family: '-ail', prompt: 'pail', rhymes: ['sail', 'tail', 'nail', 'whale'], nonRhymes: ['dog', 'cup', 'rock', 'fish'] },
  { family: '-ore', prompt: 'more', rhymes: ['store', 'core', 'door', 'floor'], nonRhymes: ['pig', 'sun', 'nest', 'hat'] },
  { family: '-ar', prompt: 'car', rhymes: ['far', 'jar', 'star', 'bar'], nonRhymes: ['dog', 'pen', 'cup', 'fish'] },
  { family: '-ink', prompt: 'pink', rhymes: ['sink', 'wink', 'drink', 'think'], nonRhymes: ['cat', 'top', 'leaf', 'ball'] },
  { family: '-ose', prompt: 'rose', rhymes: ['nose', 'hose', 'close', 'pose'], nonRhymes: ['pig', 'cup', 'drum', 'fox'] },
  { family: '-ub', prompt: 'cub', rhymes: ['tub', 'rub', 'hub', 'scrub'], nonRhymes: ['pen', 'cat', 'fish', 'kite'] },
  { family: '-ame', prompt: 'game', rhymes: ['name', 'same', 'flame', 'tame'], nonRhymes: ['dog', 'sun', 'top', 'box'] },
  { family: '-ock', prompt: 'rock', rhymes: ['lock', 'sock', 'clock', 'block'], nonRhymes: ['pig', 'sun', 'nest', 'cup'] },
  { family: '-ash', prompt: 'cash', rhymes: ['dash', 'crash', 'trash', 'splash'], nonRhymes: ['dog', 'pen', 'leaf', 'top'] },
  { family: '-eep', prompt: 'sheep', rhymes: ['sleep', 'deep', 'keep', 'sweep'], nonRhymes: ['cat', 'ball', 'fish', 'box'] },
  { family: '-oat', prompt: 'boat', rhymes: ['coat', 'goat', 'float', 'throat'], nonRhymes: ['pig', 'sun', 'cup', 'nest'] },
];

export const ROUNDS_PER_GAME = 8;

export interface RhymeRound {
  prompt: string;
  /** 3 shuffled choice words. */
  choices: string[];
  /** The one rhyming word. */
  answer: string;
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** One round from a rhyme set: the answer is a true rhyme, distractors are non-rhymes. */
export function roundFromSet(set: RhymeSet, seed: number): RhymeRound {
  const rng = mulberry32(seed);
  const answer = set.rhymes[Math.floor(rng() * set.rhymes.length)];
  const distractPool = shuffled(set.nonRhymes, rng).slice(0, 2);
  const choices = shuffled([answer, ...distractPool], rng);
  return { prompt: set.prompt, choices, answer };
}

/** 8 rounds from 8 different rhyme sets, deterministic for a seed. */
export function pickSession(seed: number): RhymeRound[] {
  const rng = mulberry32(seed);
  const order = shuffled(RHYME_SETS.map((_, i) => i), rng).slice(0, ROUNDS_PER_GAME);
  return order.map((setIndex, i) => roundFromSet(RHYME_SETS[setIndex], seed + i * 7919));
}
