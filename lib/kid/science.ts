/**
 * Bea's Science Lab experiment data. Pure data + real-science answer keys:
 * every correct outcome below is physically true (sink/float densities,
 * RYB subtractive color mixing, bean life-cycle order, melt rates,
 * ferromagnetism, Earth's rotation).
 *
 * Pedagogy: the kid always taps a PREDICTION first, then watches the
 * animated result. No fake physics, no trick outcomes.
 */

export type ScienceKind =
  | 'sink-float'
  | 'color-mix'
  | 'stages'
  | 'melt'
  | 'magnet'
  | 'earth';

export interface ScienceMaterial {
  id: string;
  name: string;
}

export interface ScienceOption {
  id: string;
  label: string;
  /** SVG art key rendered by <ScienceArt> in the lab component. */
  art: string;
}

export interface ScienceTrial {
  id: string;
  /** Spoken prompt — the prediction question, TTS friendly. */
  prompt: string;
  /** Prediction choices (kid taps one FIRST). */
  choices: ScienceOption[];
  /** The physically correct option id. */
  correctId: string;
  /** Fun fact shown after the animated result. */
  resultLine: string;
  /** Object being tested (sink/float + magnet trials): SVG art key for the reveal. */
  objectArt?: string;
  /** The two paints being mixed (color-mix trials). */
  mixPair?: [PaintColor, PaintColor];
}

export interface ScienceStage {
  id: string;
  label: string;
  art: string;
  /** One-line spoken caption for the growth animation. */
  caption: string;
}

export interface ScienceExperiment {
  id: string;
  title: string;
  subtitle: string;
  /** The big spoken question Bea asks. */
  question: string;
  /** Bea's spoken intro when the experiment opens. */
  intro: string;
  /** One-sentence science line Bea speaks after the result. */
  explain: string;
  kind: ScienceKind;
  materials: ScienceMaterial[];
  trials: ScienceTrial[];
  /** Ordered life stages; only used when kind === 'stages'. */
  stages?: ScienceStage[];
}

/* ------------------------------------------------------------------ */
/* Color mixing: real RYB subtractive mixing for primary kid paints.   */
/* ------------------------------------------------------------------ */

export type PaintColor = 'red' | 'yellow' | 'blue' | 'orange' | 'purple' | 'green';

export const PAINT_HEX: Record<PaintColor, string> = {
  red: '#EF4444',
  yellow: '#FACC15',
  blue: '#3B82F6',
  orange: '#FB923C',
  purple: '#A855F7',
  green: '#22C55E',
};

export const PAINT_LABEL: Record<PaintColor, string> = {
  red: 'Red',
  yellow: 'Yellow',
  blue: 'Blue',
  orange: 'Orange',
  purple: 'Purple',
  green: 'Green',
};

const MIX_TABLE: Record<string, PaintColor> = {
  'red+yellow': 'orange',
  'yellow+red': 'orange',
  'red+blue': 'purple',
  'blue+red': 'purple',
  'yellow+blue': 'green',
  'blue+yellow': 'green',
};

/** Real subtractive mix of two primary paints (same + same = itself). */
export function mixPaint(a: PaintColor, b: PaintColor): PaintColor {
  if (a === b) return a;
  return MIX_TABLE[`${a}+${b}`] ?? a;
}

/** Average two hex colors in RGB space (used for the blend animation). */
export function blendHex(a: string, b: string): string {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const r = Math.round((ch(a, 1) + ch(b, 1)) / 2);
  const g = Math.round((ch(a, 3) + ch(b, 3)) / 2);
  const bl = Math.round((ch(a, 5) + ch(b, 5)) / 2);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

const sinkFloatChoices: ScienceOption[] = [
  { id: 'float', label: 'It floats', art: 'float' },
  { id: 'sink', label: 'It sinks', art: 'sink' },
];

const magnetChoices: ScienceOption[] = [
  { id: 'grab', label: 'Magnet grabs it', art: 'magnet-grab' },
  { id: 'nograb', label: 'Magnet can\'t', art: 'magnet-miss' },
];

const dayNightChoices: ScienceOption[] = [
  { id: 'day', label: 'Daytime', art: 'day' },
  { id: 'night', label: 'Nighttime', art: 'night' },
];

const paintChoices: ScienceOption[] = (Object.keys(PAINT_HEX) as PaintColor[]).map((c) => ({
  id: c,
  label: PAINT_LABEL[c],
  art: `paint-${c}`,
}));

function colorTrial(id: string, a: PaintColor, b: PaintColor): ScienceTrial {
  const result = mixPaint(a, b);
  return {
    id,
    prompt: `If we mix ${PAINT_LABEL[a].toLowerCase()} paint and ${PAINT_LABEL[b].toLowerCase()} paint, what new color will we get?`,
    choices: paintChoices,
    correctId: result,
    resultLine: `${PAINT_LABEL[a]} and ${PAINT_LABEL[b]} make ${PAINT_LABEL[result].toLowerCase()}!`,
    mixPair: [a, b],
  };
}

function sinkTrial(id: string, name: string, art: string, floats: boolean, fact: string): ScienceTrial {
  return {
    id,
    prompt: `Will the ${name} sink or float in the water?`,
    choices: sinkFloatChoices,
    correctId: floats ? 'float' : 'sink',
    resultLine: fact,
    objectArt: art,
  };
}

function magnetTrial(id: string, name: string, art: string, grabs: boolean, fact: string): ScienceTrial {
  return {
    id,
    prompt: `Will the magnet grab the ${name}?`,
    choices: magnetChoices,
    correctId: grabs ? 'grab' : 'nograb',
    resultLine: fact,
    objectArt: art,
  };
}

const BEAN_STAGES: ScienceStage[] = [
  {
    id: 'seed',
    label: 'Seed',
    art: 'seed',
    caption: 'First, the tiny bean seed sleeps in the soil.',
  },
  {
    id: 'sprout',
    label: 'Sprout',
    art: 'sprout',
    caption: 'A little root pops out, then a shoot reaches up!',
  },
  {
    id: 'seedling',
    label: 'Seedling',
    art: 'seedling',
    caption: 'Green leaves open up to catch the sunshine.',
  },
  {
    id: 'plant',
    label: 'Bean plant',
    art: 'plant',
    caption: 'Flowers bloom, and new bean pods grow!',
  },
];

export const EXPERIMENTS: ScienceExperiment[] = [
  {
    id: 'sink-float',
    title: 'Sink or Float?',
    subtitle: 'drop it in the water',
    question: 'Will it sink, or will it float?',
    intro: 'Let us be water scientists! First guess, then drop each thing in the tank and see!',
    explain: 'Things that are light for their size float, and things that are heavy for their size sink!',
    kind: 'sink-float',
    materials: [
      { id: 'tank', name: 'Water tank' },
      { id: 'apple', name: 'Apple' },
      { id: 'rock', name: 'Rock' },
      { id: 'leaf', name: 'Leaf' },
      { id: 'spoon', name: 'Metal spoon' },
      { id: 'cork', name: 'Cork' },
      { id: 'key', name: 'Metal key' },
    ],
    trials: [
      sinkTrial('apple', 'apple', 'apple', true, 'The apple floats! It is light for its size, so the water holds it up.'),
      sinkTrial('rock', 'rock', 'rock', false, 'The rock sinks straight down. It is heavy for its size!'),
      sinkTrial('leaf', 'leaf', 'leaf', true, 'The leaf floats like a tiny boat on top of the water.'),
      sinkTrial('spoon', 'spoon', 'spoon', false, 'The metal spoon sinks. Metal is heavy for its size!'),
      sinkTrial('cork', 'cork', 'cork', true, 'The cork bobs right back up. Cork is full of tiny air pockets!'),
      sinkTrial('key', 'key', 'key', false, 'The metal key sinks to the bottom of the tank.'),
    ],
  },
  {
    id: 'color-mixer',
    title: 'Color Mixer',
    subtitle: 'mix the paints',
    question: 'What new color will the paints make?',
    intro: 'Time to be a color chef! Guess the new color first, then watch the paints swirl together!',
    explain: 'Red, yellow, and blue are magic starter colors. Mix them and brand-new colors appear!',
    kind: 'color-mix',
    materials: [
      { id: 'paint-red', name: 'Red paint' },
      { id: 'paint-yellow', name: 'Yellow paint' },
      { id: 'paint-blue', name: 'Blue paint' },
      { id: 'mixing-bowl', name: 'Mixing bowl' },
    ],
    trials: [
      colorTrial('mix-ry', 'red', 'yellow'),
      colorTrial('mix-rb', 'red', 'blue'),
      colorTrial('mix-yb', 'yellow', 'blue'),
    ],
  },
  {
    id: 'plant-growth',
    title: 'Plant Growth',
    subtitle: 'grow the bean',
    question: 'Can you put the bean\'s life in order?',
    intro: 'A bean seed wants to grow up! Tap the pictures in the right order, from first to last.',
    explain: 'Every plant grows in steps: seed, then sprout, then seedling, then a grown-up plant!',
    kind: 'stages',
    materials: [
      { id: 'seed', name: 'Bean seed' },
      { id: 'soil', name: 'Soil' },
      { id: 'water', name: 'Water' },
      { id: 'sun', name: 'Sunshine' },
    ],
    stages: BEAN_STAGES,
    trials: [
      {
        id: 'order-stages',
        prompt: 'Which picture comes first in the bean\'s life? Tap them in order, from first to last!',
        choices: BEAN_STAGES.map((s) => ({ id: s.id, label: s.label, art: s.art })),
        correctId: 'seed',
        resultLine: 'Seed, sprout, seedling, plant. You grew a bean!',
      },
    ],
  },
  {
    id: 'ice-melt',
    title: 'Ice Melt Race',
    subtitle: 'which melts fastest',
    question: 'Which ice cube will melt the fastest?',
    intro: 'Three ice cubes are racing to melt! One sits in the sunshine, one in the shady grass, one in warm hands. Guess the winner!',
    explain: 'Warmth melts ice! The sunny spot is the warmest, so sunshine wins the melting race.',
    kind: 'melt',
    materials: [
      { id: 'ice-sun', name: 'Ice cube in the sun' },
      { id: 'ice-shade', name: 'Ice cube in the shade' },
      { id: 'ice-hands', name: 'Ice cube in warm hands' },
    ],
    trials: [
      {
        id: 'melt-winner',
        prompt: 'Which ice cube melts the fastest: the one in the sunshine, the shady grass, or the warm hands?',
        choices: [
          { id: 'sun', label: 'Sunshine', art: 'sun' },
          { id: 'shade', label: 'Shady grass', art: 'shade' },
          { id: 'hands', label: 'Warm hands', art: 'hands' },
        ],
        correctId: 'sun',
        resultLine: 'The sunshine cube wins! Warm hands are second, and the shady grass cube is the slowest of all.',
      },
    ],
  },
  {
    id: 'magnet-hunt',
    title: 'Magnet Hunt',
    subtitle: 'what does it grab',
    question: 'Which things will the magnet grab?',
    intro: 'Our magnet is hungry! Guess which things it can grab, then watch it try.',
    explain: 'Magnets only grab iron and steel! Wood, plastic, and foil are not magnetic at all.',
    kind: 'magnet',
    materials: [
      { id: 'magnet', name: 'Magnet' },
      { id: 'paperclip', name: 'Paperclip' },
      { id: 'nail', name: 'Nail' },
      { id: 'woodblock', name: 'Wooden block' },
      { id: 'button', name: 'Plastic button' },
      { id: 'foil', name: 'Foil' },
      { id: 'coin', name: 'Coin' },
    ],
    trials: [
      magnetTrial('paperclip', 'paperclip', 'paperclip', true, 'Grabbed! The paperclip is made of steel, and magnets love steel.'),
      magnetTrial('nail', 'nail', 'nail', true, 'Grabbed! The nail is iron, and iron sticks to magnets.'),
      magnetTrial('woodblock', 'wooden block', 'woodblock', false, 'No grab. Wood is not magnetic, so the magnet slides right off.'),
      magnetTrial('button', 'plastic button', 'button', false, 'No grab. Plastic is not magnetic at all.'),
      magnetTrial('foil', 'foil', 'foil', false, 'No grab! Foil is shiny metal, but it is aluminum, and magnets cannot grab aluminum.'),
      magnetTrial('coin', 'coin', 'coin', false, 'No grab. Most coins are not the kind of metal magnets like.'),
    ],
  },
  {
    id: 'day-night',
    title: 'Day and Night',
    subtitle: 'spin the Earth',
    question: 'Is it day or night for the little house?',
    intro: 'Our Earth is spinning! When your side faces the sun it is day. When it turns away, it is night. You guess!',
    explain: 'The sun does not move across the sky — our Earth spins, and that spin makes day and night!',
    kind: 'earth',
    materials: [
      { id: 'earth', name: 'Spinning Earth' },
      { id: 'sun', name: 'Sun' },
      { id: 'house', name: 'Little house' },
    ],
    trials: [
      {
        id: 'earth-1',
        prompt: 'The little house is turned toward the sun. Is it day or night there?',
        choices: dayNightChoices,
        correctId: 'day',
        resultLine: 'Daytime! The house faces the sun, so it is bright and sunny.',
      },
      {
        id: 'earth-2',
        prompt: 'Now the Earth spun, and the little house is turned away from the sun. Day or night?',
        choices: dayNightChoices,
        correctId: 'night',
        resultLine: 'Nighttime! The house turned away from the sun, so the stars come out.',
      },
      {
        id: 'earth-3',
        prompt: 'One more spin! The little house is back in the sunshine. Day or night?',
        choices: dayNightChoices,
        correctId: 'day',
        resultLine: 'Daytime again! The Earth keeps spinning, and day always comes back around.',
      },
    ],
  },
];

export function getExperiment(id: string): ScienceExperiment | undefined {
  return EXPERIMENTS.find((e) => e.id === id);
}

/** Number of experiments in one lab session (kids pick any 3 of 6). */
export const LAB_SESSION_SIZE = 3;
