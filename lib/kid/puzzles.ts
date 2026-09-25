/**
 * Puzzle Reef puzzle library. Tap-to-place shape puzzles for ages 3-8.
 *
 * Each puzzle is a kid-friendly subject (fish, rocket, owl, ...) built from
 * 3-6 geometric pieces. A "slot" is the piece's target position inside the
 * silhouette: the game renders the silhouette from the same slots, so the
 * pieces always fit exactly. No emoji anywhere; shapes are plain SVG.
 */

export type PuzzleShape =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'star'
  | 'semicircle'
  | 'diamond'
  | 'oval'
  | 'rectangle';

export type PuzzleDifficulty = 1 | 2 | 3;

export const PUZZLE_SHAPES: readonly PuzzleShape[] = [
  'circle',
  'square',
  'triangle',
  'star',
  'semicircle',
  'diamond',
  'oval',
  'rectangle',
];

/**
 * Target position of a piece inside the silhouette. Shapes are drawn in a
 * local 100x100 box centered on (50, 50); the slot maps that onto the
 * puzzle's viewBox: translate(x, y) -> rotate(rotation deg) -> scale(size/100).
 */
export interface PuzzleSlot {
  x: number;
  y: number;
  rotation: number;
  size: number;
}

export interface PuzzlePiece {
  id: string;
  shape: PuzzleShape;
  /** Hex color string, e.g. '#4CC9F0'. */
  color: string;
  /** The slot this piece belongs in. Exactly one slot per piece. */
  slot: PuzzleSlot;
}

export interface Puzzle {
  id: string;
  title: string;
  /** Kid-friendly subject name used in spoken praise, e.g. 'fish'. */
  subject: string;
  hostCharacter: string;
  intro: string;
  difficulty: PuzzleDifficulty;
  viewBox: string;
  pieces: PuzzlePiece[];
}

const VB = '0 0 200 200';

export const PUZZLES: Puzzle[] = [
  // ------------------------------------------------ difficulty 1: 3 pieces
  {
    id: 'fish',
    title: 'Finn the Fish',
    subject: 'fish',
    hostCharacter: 'bea',
    intro: 'Finn the fish lost his pieces! Tap a piece, then tap where it goes in the gray shape.',
    difficulty: 1,
    viewBox: VB,
    pieces: [
      { id: 'fish-body', shape: 'oval', color: '#4CC9F0', slot: { x: 100, y: 100, rotation: 0, size: 110 } },
      { id: 'fish-tail', shape: 'triangle', color: '#FB923C', slot: { x: 26, y: 100, rotation: -90, size: 58 } },
      { id: 'fish-fin', shape: 'semicircle', color: '#1D8FBF', slot: { x: 100, y: 62, rotation: 0, size: 42 } },
    ],
  },
  {
    id: 'boat',
    title: 'Sailboat Sam',
    subject: 'boat',
    hostCharacter: 'atlas',
    intro: 'Sam the sailboat needs his pieces before he can sail! Tap a piece, then tap its spot.',
    difficulty: 1,
    viewBox: VB,
    pieces: [
      { id: 'boat-hull', shape: 'semicircle', color: '#3B82F6', slot: { x: 100, y: 128, rotation: 180, size: 132 } },
      { id: 'boat-sail', shape: 'triangle', color: '#FFE66D', slot: { x: 100, y: 58, rotation: 0, size: 72 } },
      { id: 'boat-window', shape: 'circle', color: '#FF6B6B', slot: { x: 100, y: 128, rotation: 0, size: 30 } },
    ],
  },
  {
    id: 'house',
    title: 'Cozy Cottage',
    subject: 'house',
    hostCharacter: 'tuno',
    intro: 'Let us build a cozy cottage together, nice and slow. Tap a piece, then tap its spot.',
    difficulty: 1,
    viewBox: VB,
    pieces: [
      { id: 'house-body', shape: 'square', color: '#FF8C42', slot: { x: 100, y: 126, rotation: 0, size: 100 } },
      { id: 'house-roof', shape: 'triangle', color: '#A855F7', slot: { x: 100, y: 50, rotation: 0, size: 122 } },
      { id: 'house-door', shape: 'rectangle', color: '#FFC93C', slot: { x: 100, y: 142, rotation: 90, size: 56 } },
    ],
  },
  {
    id: 'flower',
    title: 'Petal the Flower',
    subject: 'flower',
    hostCharacter: 'bea',
    intro: 'Petal the flower wants to bloom! Tap a piece, then tap where it goes.',
    difficulty: 1,
    viewBox: VB,
    pieces: [
      { id: 'flower-left', shape: 'circle', color: '#EC8899', slot: { x: 60, y: 96, rotation: 0, size: 58 } },
      { id: 'flower-right', shape: 'circle', color: '#EC8899', slot: { x: 140, y: 96, rotation: 0, size: 58 } },
      { id: 'flower-center', shape: 'circle', color: '#FFC93C', slot: { x: 100, y: 78, rotation: 0, size: 56 } },
    ],
  },

  // ------------------------------------------------ difficulty 2: 4 pieces
  {
    id: 'rocket',
    title: 'Rocket Ruby',
    subject: 'rocket',
    hostCharacter: 'milo',
    intro: 'Ruby the rocket is ready for countdown! Tap a piece, then tap its spot to build her.',
    difficulty: 2,
    viewBox: VB,
    pieces: [
      { id: 'rocket-body', shape: 'rectangle', color: '#3B82F6', slot: { x: 100, y: 100, rotation: 90, size: 92 } },
      { id: 'rocket-nose', shape: 'triangle', color: '#EF4444', slot: { x: 100, y: 42, rotation: 0, size: 56 } },
      { id: 'rocket-window', shape: 'circle', color: '#FFE66D', slot: { x: 100, y: 95, rotation: 0, size: 34 } },
      { id: 'rocket-flame', shape: 'triangle', color: '#FB923C', slot: { x: 100, y: 162, rotation: 180, size: 46 } },
    ],
  },
  {
    id: 'turtle',
    title: 'Tilly the Turtle',
    subject: 'turtle',
    hostCharacter: 'tuno',
    intro: 'Tilly the turtle is taking it slow and steady. Tap a piece, then tap where it belongs.',
    difficulty: 2,
    viewBox: VB,
    pieces: [
      { id: 'turtle-shell', shape: 'circle', color: '#22C55E', slot: { x: 98, y: 102, rotation: 0, size: 112 } },
      { id: 'turtle-head', shape: 'circle', color: '#4ADE80', slot: { x: 160, y: 68, rotation: 0, size: 46 } },
      { id: 'turtle-foot-front', shape: 'semicircle', color: '#4ADE80', slot: { x: 132, y: 150, rotation: 0, size: 42 } },
      { id: 'turtle-foot-back', shape: 'semicircle', color: '#4ADE80', slot: { x: 64, y: 150, rotation: 0, size: 42 } },
    ],
  },
  {
    id: 'butterfly',
    title: 'Bella the Butterfly',
    subject: 'butterfly',
    hostCharacter: 'bea',
    intro: 'Bella the butterfly wants her wings back! Tap a piece, then tap its spot.',
    difficulty: 2,
    viewBox: VB,
    pieces: [
      { id: 'butterfly-wing-left', shape: 'circle', color: '#B983FF', slot: { x: 60, y: 88, rotation: 0, size: 82 } },
      { id: 'butterfly-wing-right', shape: 'circle', color: '#B983FF', slot: { x: 140, y: 88, rotation: 0, size: 82 } },
      { id: 'butterfly-body', shape: 'rectangle', color: '#7C3AED', slot: { x: 100, y: 102, rotation: 90, size: 62 } },
      { id: 'butterfly-head', shape: 'circle', color: '#7C3AED', slot: { x: 100, y: 58, rotation: 0, size: 34 } },
    ],
  },
  {
    id: 'car',
    title: 'Zoom the Car',
    subject: 'car',
    hostCharacter: 'milo',
    intro: 'Zoom the car needs wheels before the big race! Tap a piece, then tap its spot.',
    difficulty: 2,
    viewBox: VB,
    pieces: [
      { id: 'car-body', shape: 'rectangle', color: '#EF4444', slot: { x: 100, y: 118, rotation: 0, size: 112 } },
      { id: 'car-top', shape: 'rectangle', color: '#93C5FD', slot: { x: 100, y: 78, rotation: 0, size: 70 } },
      { id: 'car-wheel-left', shape: 'circle', color: '#1F2937', slot: { x: 64, y: 152, rotation: 0, size: 38 } },
      { id: 'car-wheel-right', shape: 'circle', color: '#1F2937', slot: { x: 136, y: 152, rotation: 0, size: 38 } },
    ],
  },

  // ------------------------------------------------ difficulty 3: 5-6 pieces
  {
    id: 'castle',
    title: 'Curio Castle',
    subject: 'castle',
    hostCharacter: 'curio',
    intro: 'Welcome, brave builder! Our castle needs six pieces. Tap a piece, then tap its spot.',
    difficulty: 3,
    viewBox: VB,
    pieces: [
      { id: 'castle-keep', shape: 'square', color: '#9CA3AF', slot: { x: 100, y: 122, rotation: 0, size: 92 } },
      { id: 'castle-tower-left', shape: 'rectangle', color: '#9CA3AF', slot: { x: 50, y: 112, rotation: 90, size: 62 } },
      { id: 'castle-tower-right', shape: 'rectangle', color: '#9CA3AF', slot: { x: 150, y: 112, rotation: 90, size: 62 } },
      { id: 'castle-roof-left', shape: 'triangle', color: '#EF4444', slot: { x: 50, y: 66, rotation: 0, size: 44 } },
      { id: 'castle-roof-right', shape: 'triangle', color: '#EF4444', slot: { x: 150, y: 66, rotation: 0, size: 44 } },
      { id: 'castle-door', shape: 'semicircle', color: '#7C4A21', slot: { x: 100, y: 152, rotation: 0, size: 42 } },
    ],
  },
  {
    id: 'submarine',
    title: 'Sunny the Submarine',
    subject: 'submarine',
    hostCharacter: 'atlas',
    intro: 'Sunny the submarine is diving deep! Six pieces to find. Tap a piece, then tap its spot.',
    difficulty: 3,
    viewBox: VB,
    pieces: [
      { id: 'sub-hull', shape: 'oval', color: '#FFC93C', slot: { x: 100, y: 112, rotation: 0, size: 132 } },
      { id: 'sub-tower', shape: 'rectangle', color: '#E5A800', slot: { x: 92, y: 58, rotation: 90, size: 56 } },
      { id: 'sub-window-left', shape: 'circle', color: '#4CC9F0', slot: { x: 74, y: 112, rotation: 0, size: 28 } },
      { id: 'sub-window-right', shape: 'circle', color: '#4CC9F0', slot: { x: 114, y: 112, rotation: 0, size: 28 } },
      { id: 'sub-propeller', shape: 'triangle', color: '#9CA3AF', slot: { x: 172, y: 112, rotation: 90, size: 42 } },
      { id: 'sub-fin', shape: 'triangle', color: '#E5A800', slot: { x: 34, y: 112, rotation: -90, size: 42 } },
    ],
  },
  {
    id: 'owl',
    title: 'Hoot the Owl',
    subject: 'owl',
    hostCharacter: 'luna',
    intro: 'Hoot the owl is watching the night sky. Five pieces to place. Tap a piece, then tap its spot.',
    difficulty: 3,
    viewBox: VB,
    pieces: [
      { id: 'owl-body', shape: 'oval', color: '#B983FF', slot: { x: 100, y: 106, rotation: 0, size: 112 } },
      { id: 'owl-wing-left', shape: 'semicircle', color: '#7B4FC9', slot: { x: 52, y: 112, rotation: -90, size: 46 } },
      { id: 'owl-wing-right', shape: 'semicircle', color: '#7B4FC9', slot: { x: 148, y: 112, rotation: 90, size: 46 } },
      { id: 'owl-eye-left', shape: 'circle', color: '#FFFFFF', slot: { x: 84, y: 88, rotation: 0, size: 30 } },
      { id: 'owl-eye-right', shape: 'circle', color: '#FFFFFF', slot: { x: 116, y: 88, rotation: 0, size: 30 } },
    ],
  },
  {
    id: 'crab',
    title: 'Coco the Crab',
    subject: 'crab',
    hostCharacter: 'bea',
    intro: 'Coco the crab is snapping with joy! Five pieces to place. Tap a piece, then tap its spot.',
    difficulty: 3,
    viewBox: VB,
    pieces: [
      { id: 'crab-body', shape: 'semicircle', color: '#EF4444', slot: { x: 100, y: 122, rotation: 0, size: 112 } },
      { id: 'crab-claw-left', shape: 'circle', color: '#F87171', slot: { x: 36, y: 74, rotation: 0, size: 46 } },
      { id: 'crab-claw-right', shape: 'circle', color: '#F87171', slot: { x: 164, y: 74, rotation: 0, size: 46 } },
      { id: 'crab-eye-left', shape: 'circle', color: '#FFFFFF', slot: { x: 88, y: 82, rotation: 0, size: 24 } },
      { id: 'crab-eye-right', shape: 'circle', color: '#FFFFFF', slot: { x: 112, y: 82, rotation: 0, size: 24 } },
    ],
  },
];

export function getPuzzle(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

export function puzzlesForDifficulty(level: PuzzleDifficulty): Puzzle[] {
  return PUZZLES.filter((p) => p.difficulty === level);
}

/** Pure validation used by tests (and handy for future tooling). */
export interface PuzzleProblem {
  puzzleId: string;
  message: string;
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function validatePuzzle(puzzle: Puzzle): PuzzleProblem[] {
  const problems: PuzzleProblem[] = [];
  const bad = (message: string) => problems.push({ puzzleId: puzzle.id, message });
  if (puzzle.pieces.length < 3 || puzzle.pieces.length > 6) {
    bad(`expected 3-6 pieces, found ${puzzle.pieces.length}`);
  }
  const ids = new Set<string>();
  for (const piece of puzzle.pieces) {
    if (ids.has(piece.id)) bad(`duplicate piece id "${piece.id}"`);
    ids.add(piece.id);
    if (!PUZZLE_SHAPES.includes(piece.shape)) bad(`unknown shape "${piece.shape}" on piece "${piece.id}"`);
    if (!HEX_RE.test(piece.color)) bad(`color "${piece.color}" on piece "${piece.id}" is not a #RRGGBB hex`);
    const { x, y, rotation, size } = piece.slot;
    for (const [name, v] of [['x', x], ['y', y], ['rotation', rotation], ['size', size]] as const) {
      if (typeof v !== 'number' || !Number.isFinite(v)) bad(`slot.${name} on piece "${piece.id}" is not a finite number`);
    }
    if (x < 0 || x > 200 || y < 0 || y > 200) bad(`slot center (${x}, ${y}) on piece "${piece.id}" is outside the 200x200 viewBox`);
    if (size < 20 || size > 140) bad(`slot size ${size} on piece "${piece.id}" is outside the 20-140 range`);
  }
  return problems;
}

/** Difficulty labels for the picker UI. */
export const DIFFICULTY_LABELS: Record<PuzzleDifficulty, { name: string; tagline: string }> = {
  1: { name: 'Splashy', tagline: '3 pieces — easy peasy' },
  2: { name: 'Deep', tagline: '4 pieces — a fun challenge' },
  3: { name: 'Abyss', tagline: '5-6 pieces — master builder' },
};
