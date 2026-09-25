/**
 * Tuno's Feelings Theater — the SEL game engine.
 * Twelve emotions with SVG-face params, kid scenarios, and comfort tips.
 * Pure and deterministic: the same seed always produces the same session.
 */

import { mulberry32 } from './words';

export type Mouth = 'smile' | 'frown' | 'open' | 'wavy';
export type Eyes = 'dots' | 'happy-arcs' | 'worried';
export type Brows = 'up' | 'down' | 'flat';

export const MOUTHS: Mouth[] = ['smile', 'frown', 'open', 'wavy'];
export const EYE_KINDS: Eyes[] = ['dots', 'happy-arcs', 'worried'];
export const BROW_KINDS: Brows[] = ['up', 'down', 'flat'];

export interface FaceParams {
  mouth: Mouth;
  eyes: Eyes;
  brows?: Brows;
}

export interface Emotion {
  id: string;
  name: string;
  /** Kid-friendly definition of the feeling. */
  kidDefinition: string;
  face: FaceParams;
  /** Two-sentence kid situation. */
  scenario: string;
  /** What would help — the "comfort" answer. */
  comfortTip: string;
}

export const EMOTIONS: Emotion[] = [
  {
    id: 'happy',
    name: 'Happy',
    kidDefinition: 'Feeling good and smiley inside.',
    face: { mouth: 'smile', eyes: 'happy-arcs' },
    scenario: "Mia's friend shared crayons with her at school. She feels warm and giggly inside.",
    comfortTip: 'Share the happy feeling — give someone a high-five!',
  },
  {
    id: 'sad',
    name: 'Sad',
    kidDefinition: 'Feeling down, like a rainy day inside.',
    face: { mouth: 'frown', eyes: 'dots', brows: 'down' },
    scenario: 'Leo dropped his ice cream on the ground. His tummy feels heavy and his eyes feel watery.',
    comfortTip: 'Ask for a hug, or take a quiet minute.',
  },
  {
    id: 'angry',
    name: 'Angry',
    kidDefinition: 'Feeling hot and stormy, like a volcano.',
    face: { mouth: 'open', eyes: 'dots', brows: 'down' },
    scenario: "Zoe's brother knocked over her block tower. She feels hot and stompy.",
    comfortTip: 'Cool down: squeeze a pillow, then breathe slow.',
  },
  {
    id: 'scared',
    name: 'Scared',
    kidDefinition: 'Feeling wobbly, like something might go wrong.',
    face: { mouth: 'wavy', eyes: 'worried', brows: 'up' },
    scenario: 'It is thundering outside and the room is dark. Sam feels shaky and small.',
    comfortTip: 'Find a grown-up, and remember storms always pass.',
  },
  {
    id: 'surprised',
    name: 'Surprised',
    kidDefinition: 'Feeling a big wow all at once.',
    face: { mouth: 'open', eyes: 'dots', brows: 'up' },
    scenario: "Mom jumped out with a birthday cake and everyone shouted surprise! Max's eyes went wide.",
    comfortTip: 'Laugh it out — surprises can be fun!',
  },
  {
    id: 'proud',
    name: 'Proud',
    kidDefinition: 'Feeling tall inside because you did something great.',
    face: { mouth: 'smile', eyes: 'happy-arcs', brows: 'up' },
    scenario: 'Ava tied her shoes all by herself this morning. She feels tall and glowy inside.',
    comfortTip: 'Tell someone what you did — celebrate it!',
  },
  {
    id: 'shy',
    name: 'Shy',
    kidDefinition: 'Feeling small and quiet around new people.',
    face: { mouth: 'wavy', eyes: 'dots', brows: 'flat' },
    scenario: 'At a new playground, a kid waves hello. Ben hides a little behind his grown-up.',
    comfortTip: "It's okay to watch first — say hi when you're ready.",
  },
  {
    id: 'excited',
    name: 'Excited',
    kidDefinition: 'Feeling bouncy and buzzy, like popcorn.',
    face: { mouth: 'smile', eyes: 'dots', brows: 'up' },
    scenario: "Tomorrow is the zoo trip! Lily can't stop bouncing and grinning.",
    comfortTip: 'Wiggle it out — do a happy dance!',
  },
  {
    id: 'calm',
    name: 'Calm',
    kidDefinition: 'Feeling soft and still, like floating.',
    face: { mouth: 'smile', eyes: 'dots', brows: 'flat' },
    scenario: 'After the bath, Noor curls up with a book. Everything feels soft and quiet.',
    comfortTip: 'Keep the cozy going — slow breaths in and out.',
  },
  {
    id: 'frustrated',
    name: 'Frustrated',
    kidDefinition: 'Feeling stuck and grumpy because something is hard.',
    face: { mouth: 'frown', eyes: 'worried', brows: 'down' },
    scenario: "The puzzle piece won't fit no matter how hard Eli pushes. His cheeks feel hot.",
    comfortTip: 'Take a break, then try a new way.',
  },
  {
    id: 'jealous',
    name: 'Jealous',
    kidDefinition: 'Feeling ouchy because someone else has what you want.',
    face: { mouth: 'wavy', eyes: 'worried', brows: 'down' },
    scenario: "Rae's friend got the shiny sticker she wanted. Her tummy feels twisty.",
    comfortTip: "Name it: 'I feel jealous.' Then think of something you love.",
  },
  {
    id: 'brave',
    name: 'Brave',
    kidDefinition: 'Feeling strong even when something is a little scary.',
    face: { mouth: 'smile', eyes: 'happy-arcs', brows: 'flat' },
    scenario: 'The slide looks SO tall, but Kip takes a deep breath and climbs up. His heart is beating fast.',
    comfortTip: 'Take a big breath and try — brave means trying anyway.',
  },
];

export function getEmotion(id: string): Emotion | undefined {
  return EMOTIONS.find((e) => e.id === id);
}

export const ROUNDS_PER_GAME = 8;

export type RoundKind = 'name' | 'help';

export interface FeelingRound {
  kind: RoundKind;
  emotion: Emotion;
  /** Three choice labels; answer is always choices[answerIndex]. */
  choices: string[];
  answerIndex: number;
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** Shuffle in place with the seeded rng. */
function shuffleSeeded<T>(rng: () => number, items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Two name distractors for an emotion: other emotion names, unique. */
function nameDistractors(rng: () => number, emotion: Emotion): string[] {
  const others = shuffleSeeded(rng, EMOTIONS.filter((e) => e.id !== emotion.id));
  return [others[0].name, others[1].name];
}

/** Two comfort distractors: comfort tips from other emotions, unique and not the answer. */
function comfortDistractors(rng: () => number, emotion: Emotion): string[] {
  const others = shuffleSeeded(
    rng,
    EMOTIONS.filter((e) => e.id !== emotion.id && e.comfortTip !== emotion.comfortTip)
  );
  return [others[0].comfortTip, others[1].comfortTip];
}

/**
 * Build an 8-round session: 4 "name the feeling" + 4 "what would help?",
 * emotions picked without replacement, round order shuffled. Seeded.
 */
export function pickSession(seed: number): FeelingRound[] {
  const rng = mulberry32(seed);
  const emotions = shuffleSeeded(rng, EMOTIONS).slice(0, ROUNDS_PER_GAME);
  const kinds: RoundKind[] = shuffleSeeded(rng, [
    'name',
    'name',
    'name',
    'name',
    'help',
    'help',
    'help',
    'help',
  ]);
  return emotions.map((emotion, i) => {
    const kind = kinds[i];
    const answer = kind === 'name' ? emotion.name : emotion.comfortTip;
    const distractors =
      kind === 'name' ? nameDistractors(rng, emotion) : comfortDistractors(rng, emotion);
    const choiceTexts = shuffleSeeded(rng, [answer, ...distractors]);
    return {
      kind,
      emotion,
      choices: choiceTexts,
      answerIndex: choiceTexts.indexOf(answer),
    };
  });
}
