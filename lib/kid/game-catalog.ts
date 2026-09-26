import type { AgeBand } from '@/lib/planner/types';
import type { GameSkillCode } from './game-skills';

/**
 * Learning metadata for every Sky Park game, keyed by registry id
 * (components/kid/game-registry.tsx owns titles, art and rendering).
 *
 * - ages:   bands the game is designed for. The home only offers a game to
 *           children in these bands (older children can still reach
 *           everything through "Explore").
 * - skills: taxonomy skills the game produces evidence for. Today's path
 *           uses these to send a child to the game that practices the skill
 *           that is due for review.
 * - say:    what the game is, spoken aloud (hold any tile to hear it), for
 *           children who cannot read the title.
 */
export interface GameMeta {
  ages: AgeBand[];
  skills: GameSkillCode[];
  say: string;
}

const ALL: AgeBand[] = ['3-4', '5-6', '7-8'];
const K_UP: AgeBand[] = ['5-6', '7-8'];
const G2_UP: AgeBand[] = ['7-8'];

export const GAME_META: Record<string, GameMeta> = {
  words: { ages: K_UP, skills: ['build_words'], say: 'Word Builder. Spell words with letter tiles.' },
  writing: { ages: ALL, skills: ['trace_letters'], say: 'Letter Lab. Trace letters with your finger.' },
  phonics: { ages: K_UP, skills: ['blending', 'sight_words'], say: 'Phonics Fun. Blend sounds into words.' },
  sentences: { ages: K_UP, skills: ['write_sentences'], say: 'Sentence Studio. Put words in order to make a sentence.' },
  opposites: { ages: ALL, skills: ['vocabulary'], say: 'Opposites Attic. Find words that mean the opposite, like big and little.' },
  rhymes: { ages: ALL, skills: ['rhyming'], say: 'Rhyme Time. Find words that sound alike.' },
  numbers: { ages: ALL, skills: ['count', 'compare_order', 'add', 'subtract'], say: 'Number Run. Count and add with Milo.' },
  pattern: { ages: ALL, skills: ['shapes_patterns'], say: 'Pattern Parade. What comes next in the pattern?' },
  time: { ages: K_UP, skills: ['telling_time'], say: 'Clock Tower. Learn to read the clock.' },
  money: { ages: K_UP, skills: ['money'], say: 'Coin Cove. Count coins.' },
  fractions: { ages: G2_UP, skills: ['fractions'], say: 'Fraction Fair. Halves, thirds and quarters.' },
  measure: { ages: ALL, skills: ['measurement'], say: 'Measure Meadow. Which is longer, taller or heavier?' },
  coding: { ages: K_UP, skills: ['sequencing'], say: 'Coding Cove. Give Milo steps to get home.' },
  geography: { ages: K_UP, skills: ['continents_oceans', 'landmarks', 'world_animals'], say: 'World Tour. Explore the world with Atlas.' },
  science: { ages: ALL, skills: ['experiments'], say: 'Science Lab. Guess what will happen, then try it.' },
  encyclopedia: { ages: ALL, skills: [], say: 'Animal Book. Meet animals and collect them.' },
  colors: { ages: ALL, skills: ['experiments'], say: 'Color Mix Lab. Mix two colors to make a new one.' },
  rhythm: { ages: ALL, skills: [], say: 'Rhythm Studio. Tap along to the beat.' },
  studio: { ages: ALL, skills: [], say: 'Creative Studio. Draw and color.' },
  movies: { ages: K_UP, skills: [], say: 'Movie Studio. Make your own cartoon.' },
  cinema: { ages: ALL, skills: [], say: 'Story Cinema. Watch a cartoon story.' },
  bedtime: { ages: ALL, skills: [], say: 'Bedtime. A calm story before sleep.' },
  feelings: { ages: ALL, skills: ['emotions', 'calm_down'], say: 'Feelings Theater. Name big feelings and find ways to feel calm.' },
  memory: { ages: ALL, skills: [], say: 'Memory Cove. Find the matching pairs.' },
  puzzle: { ages: ALL, skills: [], say: 'Puzzle Reef. Put the picture together.' },
  homes: { ages: ALL, skills: [], say: 'Character Homes. Visit your friends at home.' },
  playground: { ages: ALL, skills: [], say: 'Pet Playground. Play with your pet.' },
  dressup: { ages: ALL, skills: [], say: 'Dress Up. Use your stars to pick an outfit.' },
  avatar: { ages: ALL, skills: [], say: 'My Look. Design how you look.' },
  trophies: { ages: ALL, skills: [], say: 'Trophies. See the trophies you have won.' },
  pet: { ages: ALL, skills: [], say: 'Your pet friend.' },
};

export function gameMeta(id: string): GameMeta | undefined {
  return GAME_META[id];
}

export function gameFitsAge(id: string, band: AgeBand): boolean {
  return GAME_META[id]?.ages.includes(band) ?? false;
}
