/**
 * Letter Lab: handwriting tracing data and matching logic.
 *
 * Every letter (A-Z, a-z) and digit (0-9) is described as an ordered list of
 * strokes. Each stroke is a polyline in normalized 0-100 coordinates —
 * kid-simplified print formations (not perfect typography; plausible,
 * forgiving shapes for ages 4-7).
 *
 * Tracing evaluation is forgiving on purpose: a stroke passes when at least
 * TRACE_COVERAGE_REQUIRED of its sampled points fall within TRACE_TOLERANCE
 * of any point the child drew. Stroke order is NOT enforced.
 */

export type Pt = [number, number];
export type Stroke = Pt[];

/** All traceable characters, in ramp order: uppercase, lowercase, digits. */
export const LETTERS: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');

export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'.split('');
export const DIGITS = '0123456789'.split('');

/**
 * Maximum distance (in 0-100 units) between a model point and a kid-drawn
 * point for the model point to count as "covered". Generous for little hands.
 */
export const TRACE_TOLERANCE = 14;

/** Fraction of a stroke's sampled points that must be covered to pass. */
export const TRACE_COVERAGE_REQUIRED = 0.6;

/** Letters traced per Letter Lab session. */
export const SESSION_LENGTH = 8;

const STROKES: Record<string, Stroke[]> = {
  // ---------------- uppercase ----------------
  A: [[[12, 88], [50, 12], [88, 88]], [[32, 60], [68, 60]]],
  B: [
    [[32, 12], [32, 88]],
    [[32, 12], [58, 12], [72, 28], [58, 46], [32, 46]],
    [[32, 46], [62, 46], [76, 66], [60, 88], [32, 88]],
  ],
  C: [[[78, 22], [62, 12], [38, 14], [20, 32], [20, 66], [38, 86], [62, 88], [78, 76]]],
  D: [
    [[32, 12], [32, 88]],
    [[32, 12], [62, 12], [84, 32], [84, 66], [62, 88], [32, 88]],
  ],
  E: [
    [[78, 12], [28, 12], [28, 88], [78, 88]],
    [[28, 50], [58, 50]],
  ],
  F: [
    [[78, 12], [28, 12], [28, 88]],
    [[28, 50], [58, 50]],
  ],
  G: [[[78, 24], [64, 12], [40, 12], [20, 32], [20, 68], [40, 88], [64, 88], [78, 72], [78, 56], [60, 56]]],
  H: [
    [[26, 12], [26, 88]],
    [[74, 12], [74, 88]],
    [[26, 50], [74, 50]],
  ],
  I: [
    [[34, 12], [66, 12]],
    [[50, 12], [50, 88]],
    [[34, 88], [66, 88]],
  ],
  J: [[[70, 12], [70, 72], [56, 86], [38, 82], [30, 70]]],
  K: [
    [[26, 12], [26, 88]],
    [[72, 12], [26, 56]],
    [[46, 66], [74, 88]],
  ],
  L: [[[32, 12], [32, 88], [74, 88]]],
  M: [[[18, 88], [18, 12], [50, 56], [82, 12], [82, 88]]],
  N: [[[26, 88], [26, 12], [74, 88], [74, 12]]],
  O: [[[50, 12], [30, 18], [16, 38], [16, 62], [30, 82], [50, 88], [70, 82], [84, 62], [84, 38], [70, 18], [50, 12]]],
  P: [
    [[32, 88], [32, 12]],
    [[32, 12], [60, 12], [74, 30], [60, 48], [32, 48]],
  ],
  Q: [
    [[50, 12], [30, 18], [16, 38], [16, 62], [30, 82], [50, 88], [70, 82], [84, 62], [84, 38], [70, 18], [50, 12]],
    [[62, 68], [86, 94]],
  ],
  R: [
    [[32, 88], [32, 12]],
    [[32, 12], [60, 12], [74, 30], [60, 48], [32, 48]],
    [[48, 48], [74, 88]],
  ],
  S: [[[76, 24], [60, 12], [38, 14], [26, 28], [32, 44], [54, 54], [68, 68], [60, 84], [38, 88], [22, 76]]],
  T: [
    [[20, 12], [80, 12]],
    [[50, 12], [50, 88]],
  ],
  U: [[[26, 12], [26, 68], [38, 84], [62, 84], [74, 68], [74, 12]]],
  V: [[[20, 12], [50, 88], [80, 12]]],
  W: [[[14, 12], [30, 88], [50, 44], [70, 88], [86, 12]]],
  X: [
    [[26, 12], [74, 88]],
    [[74, 12], [26, 88]],
  ],
  Y: [
    [[20, 12], [50, 52], [80, 12]],
    [[50, 52], [50, 88]],
  ],
  Z: [[[22, 12], [78, 12], [22, 88], [78, 88]]],
  // ---------------- lowercase ----------------
  a: [
    [[52, 52], [36, 56], [28, 68], [30, 80], [44, 88], [60, 86], [66, 74], [60, 60], [50, 54], [44, 56]],
    [[66, 46], [66, 88]],
  ],
  b: [
    [[34, 12], [34, 88]],
    [[34, 56], [52, 52], [64, 64], [60, 80], [44, 88], [34, 82]],
  ],
  c: [[[66, 60], [54, 52], [40, 56], [34, 68], [40, 82], [54, 88], [66, 80]]],
  d: [
    [[40, 52], [28, 58], [24, 70], [32, 84], [48, 88], [58, 78], [56, 62], [46, 52]],
    [[58, 12], [58, 88]],
  ],
  e: [
    [[68, 64], [52, 54], [36, 58], [30, 72], [42, 86], [58, 86], [68, 74]],
    [[34, 68], [62, 68]],
  ],
  f: [
    [[58, 88], [58, 20], [46, 12], [36, 18]],
    [[38, 44], [68, 44]],
  ],
  g: [
    [[48, 52], [34, 56], [30, 68], [38, 82], [52, 84], [60, 74], [56, 60], [46, 54]],
    [[60, 52], [60, 86], [50, 96], [38, 92]],
  ],
  h: [
    [[30, 12], [30, 88]],
    [[30, 58], [48, 52], [60, 64], [60, 88]],
  ],
  i: [
    [[50, 52], [50, 88]],
    [[50, 30], [50, 34]],
  ],
  j: [
    [[58, 52], [58, 80], [48, 92], [38, 88]],
    [[58, 30], [58, 34]],
  ],
  k: [
    [[34, 12], [34, 88]],
    [[64, 52], [34, 70]],
    [[46, 76], [64, 88]],
  ],
  l: [[[50, 12], [50, 88]]],
  m: [
    [[28, 56], [28, 88]],
    [[28, 56], [44, 52], [52, 66], [52, 88]],
    [[52, 56], [68, 52], [76, 66], [76, 88]],
  ],
  n: [
    [[28, 56], [28, 88]],
    [[28, 56], [48, 52], [60, 66], [60, 88]],
  ],
  o: [[[48, 52], [34, 58], [30, 70], [38, 84], [52, 88], [64, 80], [64, 66], [56, 54], [48, 52]]],
  p: [
    [[38, 52], [38, 96]],
    [[38, 56], [54, 52], [64, 66], [56, 82], [40, 88], [34, 78]],
  ],
  q: [
    [[44, 52], [32, 58], [30, 70], [40, 84], [54, 86], [62, 74], [58, 60], [48, 52]],
    [[62, 52], [62, 96]],
  ],
  r: [
    [[34, 56], [34, 88]],
    [[34, 62], [52, 56], [60, 64]],
  ],
  s: [[[66, 60], [52, 52], [40, 56], [36, 66], [48, 72], [60, 78], [54, 88], [40, 88], [32, 80]]],
  t: [
    [[50, 12], [50, 88]],
    [[32, 40], [68, 40]],
  ],
  u: [
    [[30, 56], [30, 78], [40, 88], [54, 86], [60, 76], [60, 56]],
    [[70, 56], [70, 88]],
  ],
  v: [[[28, 56], [48, 88], [68, 56]]],
  w: [[[22, 56], [32, 88], [48, 64], [64, 88], [74, 56]]],
  x: [
    [[30, 56], [70, 88]],
    [[70, 56], [30, 88]],
  ],
  y: [
    [[28, 56], [48, 82]],
    [[68, 56], [44, 96]],
  ],
  z: [[[30, 56], [70, 56], [30, 88], [70, 88]]],
  // ---------------- digits ----------------
  '0': [[[50, 12], [30, 18], [16, 38], [16, 62], [30, 82], [50, 88], [70, 82], [84, 62], [84, 38], [70, 18], [50, 12]]],
  '1': [
    [[40, 26], [56, 12], [56, 88]],
    [[40, 88], [72, 88]],
  ],
  '2': [[[32, 22], [50, 12], [66, 26], [52, 50], [32, 88], [70, 88]]],
  '3': [
    [[32, 20], [54, 12], [68, 26], [56, 42], [40, 48]],
    [[40, 48], [62, 48], [72, 64], [60, 82], [36, 88], [28, 80]],
  ],
  '4': [
    [[62, 12], [30, 54], [72, 54]],
    [[62, 12], [62, 88]],
  ],
  '5': [[[70, 12], [38, 12], [36, 48], [58, 48], [68, 62], [60, 80], [40, 86], [28, 76]]],
  '6': [[[64, 22], [46, 12], [28, 30], [28, 64], [44, 86], [62, 80], [64, 62], [48, 56], [32, 62]]],
  '7': [[[26, 12], [74, 12], [44, 88]]],
  '8': [
    [[50, 12], [36, 18], [30, 32], [40, 46], [56, 44], [62, 30], [56, 16], [50, 12]],
    [[50, 46], [36, 52], [30, 66], [40, 82], [58, 80], [66, 64], [58, 50], [50, 46]],
  ],
  '9': [[[36, 78], [54, 88], [72, 70], [72, 36], [56, 14], [38, 20], [36, 38], [48, 50], [64, 44]]],
};

/** Ordered stroke polylines for a character. Empty array for unknown chars. */
export function letterStrokes(ch: string): Stroke[] {
  return STROKES[ch] ?? [];
}

/** TTS-friendly name + phonetic sound + example word for the celebration. */
export interface Phonics {
  /** Spoken name, e.g. "bee" or "three". */
  name: string;
  /** Phonetic sound, e.g. "buh". */
  sound: string;
  /** Example word, e.g. "ball". */
  word: string;
}

const PHONICS: Record<string, Phonics> = {
  a: { name: 'ay', sound: 'ah', word: 'apple' },
  b: { name: 'bee', sound: 'buh', word: 'ball' },
  c: { name: 'see', sound: 'kuh', word: 'cat' },
  d: { name: 'dee', sound: 'duh', word: 'dog' },
  e: { name: 'ee', sound: 'eh', word: 'egg' },
  f: { name: 'eff', sound: 'fff', word: 'fish' },
  g: { name: 'jee', sound: 'guh', word: 'goat' },
  h: { name: 'aych', sound: 'huh', word: 'hat' },
  i: { name: 'eye', sound: 'ih', word: 'igloo' },
  j: { name: 'jay', sound: 'juh', word: 'jelly' },
  k: { name: 'kay', sound: 'kuh', word: 'kite' },
  l: { name: 'ell', sound: 'lll', word: 'lion' },
  m: { name: 'em', sound: 'mmm', word: 'moon' },
  n: { name: 'en', sound: 'nnn', word: 'nest' },
  o: { name: 'oh', sound: 'oh', word: 'octopus' },
  p: { name: 'pee', sound: 'puh', word: 'pig' },
  q: { name: 'cue', sound: 'kwuh', word: 'queen' },
  r: { name: 'ar', sound: 'rrr', word: 'rabbit' },
  s: { name: 'ess', sound: 'sss', word: 'sun' },
  t: { name: 'tee', sound: 'tuh', word: 'tiger' },
  u: { name: 'you', sound: 'uh', word: 'umbrella' },
  v: { name: 'vee', sound: 'vvv', word: 'violin' },
  w: { name: 'double-you', sound: 'wuh', word: 'whale' },
  x: { name: 'ex', sound: 'ks', word: 'box' },
  y: { name: 'why', sound: 'yuh', word: 'yellow' },
  z: { name: 'zee', sound: 'zzz', word: 'zebra' },
  '0': { name: 'zero', sound: 'zoh', word: 'zero cookies' },
  '1': { name: 'one', sound: 'wun', word: 'one sun' },
  '2': { name: 'two', sound: 'too', word: 'two shoes' },
  '3': { name: 'three', sound: 'three', word: 'three birds' },
  '4': { name: 'four', sound: 'for', word: 'four fish' },
  '5': { name: 'five', sound: 'five', word: 'five stars' },
  '6': { name: 'six', sound: 'six', word: 'six frogs' },
  '7': { name: 'seven', sound: 'seven', word: 'seven ducks' },
  '8': { name: 'eight', sound: 'ate', word: 'eight ants' },
  '9': { name: 'nine', sound: 'nine', word: 'nine bees' },
};

/** Phonics for any traceable character (case-insensitive). */
export function phonicsFor(ch: string): Phonics {
  return PHONICS[ch.toLowerCase()] ?? { name: ch, sound: ch, word: ch };
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

/**
 * Pick SESSION_LENGTH letters for a session: 4 uppercase, then 2 lowercase,
 * then 2 digits. Deterministic per seed, no repeats within a session.
 */
export function pickSessionLetters(seed: number = Date.now()): string[] {
  const rand = mulberry32(seed);
  const take = (pool: string[], n: number): string[] => {
    const copy = [...pool];
    const out: string[] = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    }
    return out;
  };
  const uppers = take(UPPERCASE, 4);
  // Lowercase picks avoid repeating the same letter as an uppercase pick.
  const lowers = take(
    LOWERCASE.filter((c) => !uppers.includes(c.toUpperCase())),
    2
  );
  const digits = take(DIGITS, 2);
  return [...uppers, ...lowers, ...digits];
}

/** Evenly sample `n` points along a polyline. */
export function sampleStroke(stroke: Stroke, n: number = 28): Pt[] {
  if (stroke.length === 0) return [];
  if (stroke.length === 1) return Array.from({ length: n }, () => stroke[0]);
  const lengths: number[] = [0];
  for (let i = 1; i < stroke.length; i++) {
    const dx = stroke[i][0] - stroke[i - 1][0];
    const dy = stroke[i][1] - stroke[i - 1][1];
    lengths.push(lengths[i - 1] + Math.hypot(dx, dy));
  }
  const total = lengths[lengths.length - 1] || 1;
  const out: Pt[] = [];
  for (let s = 0; s < n; s++) {
    const target = (s / (n - 1)) * total;
    let i = 1;
    while (i < lengths.length - 1 && lengths[i] < target) i++;
    const segLen = lengths[i] - lengths[i - 1] || 1;
    const t = (target - lengths[i - 1]) / segLen;
    out.push([
      stroke[i - 1][0] + (stroke[i][0] - stroke[i - 1][0]) * t,
      stroke[i - 1][1] + (stroke[i][1] - stroke[i - 1][1]) * t,
    ]);
  }
  return out;
}

/**
 * Fraction of a model stroke's sampled points that fall within `tolerance`
 * of any kid-drawn point. 1 = perfectly traced.
 */
export function strokeCoverage(
  model: Stroke,
  kidPoints: Pt[],
  tolerance: number = TRACE_TOLERANCE
): number {
  if (kidPoints.length === 0) return 0;
  const samples = sampleStroke(model);
  let covered = 0;
  for (const [mx, my] of samples) {
    for (const [kx, ky] of kidPoints) {
      if (Math.hypot(mx - kx, my - ky) <= tolerance) {
        covered++;
        break;
      }
    }
  }
  return covered / samples.length;
}

/**
 * Every stroke of the letter must reach TRACE_COVERAGE_REQUIRED.
 * Stroke order is not enforced — little hands are forgiven.
 */
export function letterPassed(
  ch: string,
  kidPoints: Pt[],
  tolerance: number = TRACE_TOLERANCE
): boolean {
  const strokes = letterStrokes(ch);
  if (strokes.length === 0) return false;
  return strokes.every(
    (s) => strokeCoverage(s, kidPoints, tolerance) >= TRACE_COVERAGE_REQUIRED
  );
}
