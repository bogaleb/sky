/**
 * Memory Cove deck library. Educational flip-and-match decks for ages 3-8.
 *
 * Each pair has two faces: `a` (always rendered as text) and `b`.
 * When `kind` is 'text', face `b` renders as text. When `kind` is 'shape',
 * face `b` is a graphic descriptor rendered by the game as inline SVG —
 * never emoji, always kid-token colors.
 *
 * Graphic descriptors for `b` with kind 'shape':
 *   - shape names: 'circle' | 'square' | 'triangle' | 'diamond' |
 *     'star' | 'heart' | 'oval' | 'rectangle'
 *   - color names (CSS color strings): 'red' | 'blue' | 'green' |
 *     'yellow' | 'purple' | 'orange' | 'pink' | 'brown' -> swatch
 *   - 'dots:N' -> N counting dots (for the number deck)
 */

export interface MemoryPair {
  a: string;
  b: string;
  kind: 'text' | 'shape';
}

export interface MemoryDeck {
  id: string;
  title: string;
  hostCharacter: string;
  intro: string;
  pairs: MemoryPair[];
}

export const MEMORY_DECKS: MemoryDeck[] = [
  {
    id: 'letters',
    title: 'Letter Lagoon',
    hostCharacter: 'luna',
    intro: 'Match each BIG letter with its small letter twin!',
    pairs: [
      { a: 'A', b: 'a', kind: 'text' },
      { a: 'B', b: 'b', kind: 'text' },
      { a: 'C', b: 'c', kind: 'text' },
      { a: 'D', b: 'd', kind: 'text' },
      { a: 'E', b: 'e', kind: 'text' },
      { a: 'F', b: 'f', kind: 'text' },
      { a: 'G', b: 'g', kind: 'text' },
      { a: 'H', b: 'h', kind: 'text' },
    ],
  },
  {
    id: 'numbers',
    title: 'Number Reef',
    hostCharacter: 'milo',
    intro: 'Match each number with its dot count!',
    pairs: [
      { a: '1', b: 'dots:1', kind: 'shape' },
      { a: '2', b: 'dots:2', kind: 'shape' },
      { a: '3', b: 'dots:3', kind: 'shape' },
      { a: '4', b: 'dots:4', kind: 'shape' },
      { a: '5', b: 'dots:5', kind: 'shape' },
      { a: '6', b: 'dots:6', kind: 'shape' },
      { a: '7', b: 'dots:7', kind: 'shape' },
      { a: '8', b: 'dots:8', kind: 'shape' },
    ],
  },
  {
    id: 'shapes',
    title: 'Shape Shores',
    hostCharacter: 'curio',
    intro: 'Match each shape name with its shape!',
    pairs: [
      { a: 'circle', b: 'circle', kind: 'shape' },
      { a: 'square', b: 'square', kind: 'shape' },
      { a: 'triangle', b: 'triangle', kind: 'shape' },
      { a: 'star', b: 'star', kind: 'shape' },
      { a: 'diamond', b: 'diamond', kind: 'shape' },
      { a: 'heart', b: 'heart', kind: 'shape' },
      { a: 'oval', b: 'oval', kind: 'shape' },
      { a: 'rectangle', b: 'rectangle', kind: 'shape' },
    ],
  },
  {
    id: 'sight-words',
    title: 'Word Waves',
    hostCharacter: 'luna',
    intro: 'Match each word with its twin!',
    pairs: [
      { a: 'the', b: 'the', kind: 'text' },
      { a: 'and', b: 'and', kind: 'text' },
      { a: 'see', b: 'see', kind: 'text' },
      { a: 'you', b: 'you', kind: 'text' },
      { a: 'like', b: 'like', kind: 'text' },
      { a: 'my', b: 'my', kind: 'text' },
      { a: 'big', b: 'big', kind: 'text' },
      { a: 'can', b: 'can', kind: 'text' },
    ],
  },
  {
    id: 'colors',
    title: 'Color Coral',
    hostCharacter: 'bea',
    intro: 'Match each color name with its color!',
    pairs: [
      { a: 'red', b: 'red', kind: 'shape' },
      { a: 'blue', b: 'blue', kind: 'shape' },
      { a: 'green', b: 'green', kind: 'shape' },
      { a: 'yellow', b: 'yellow', kind: 'shape' },
      { a: 'purple', b: 'purple', kind: 'shape' },
      { a: 'orange', b: 'orange', kind: 'shape' },
      { a: 'pink', b: 'pink', kind: 'shape' },
      { a: 'brown', b: 'brown', kind: 'shape' },
    ],
  },
];

export function getDeck(id: string): MemoryDeck | undefined {
  return MEMORY_DECKS.find((d) => d.id === id);
}
