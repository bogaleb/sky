/**
 * Rhythm Studio beat-pattern engine.
 * All sounds are synthesized with WebAudio (no audio files):
 * kick = sine drop, clap = noise burst, shaker = highpass noise,
 * bell = triangle tone. SSR-safe: every function no-ops when there is
 * no window / AudioContext (e.g. in tests).
 */

export type DrumSound = 'kick' | 'clap' | 'shaker' | 'bell';

/** A tap is Perfect within 120ms, Good within 250ms, else a Miss. */
export const PERFECT_WINDOW_MS = 120;
export const HIT_WINDOW_MS = 250;

/** How long a beat note travels down the highway before the hit line. */
export const TRAVEL_MS = 2200;

/** Count-in beats before a tune starts. */
export const COUNT_IN_BEATS = 4;

export const SOUND_LABELS: Record<DrumSound, string> = {
  kick: 'Drum',
  clap: 'Clap',
  shaker: 'Shaker',
  bell: 'Bell',
};

// ---------------------------------------------------------------------------
// AudioContext management
// ---------------------------------------------------------------------------

let sharedCtx: AudioContext | null = null;

/**
 * Create (or resume) the shared AudioContext. Must be called inside a user
 * gesture so mobile autoplay policies allow sound. Returns null on the
 * server or when WebAudio is unavailable.
 */
export function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedCtx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      sharedCtx = new AC();
    }
    if (sharedCtx.state === 'suspended') {
      void sharedCtx.resume().catch(() => {});
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/** For tests: drop the cached context. */
export function _resetAudioForTests(): void {
  sharedCtx = null;
}

function now(ctx: AudioContext): number {
  return ctx.currentTime;
}

/** Kick: sine oscillator dropping from 150Hz to 50Hz with a fast decay. */
export function playKick(ctx: AudioContext | null = sharedCtx, when = 0): void {
  if (!ctx) return;
  try {
    const t = now(ctx) + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  } catch {
    /* audio is enhancement-only */
  }
}

/** Shared noise buffer helper. */
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 0.5;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Clap: short band-passed noise burst. */
export function playClap(ctx: AudioContext | null = sharedCtx, when = 0): void {
  if (!ctx) return;
  try {
    const t = now(ctx) + when;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.25);
  } catch {
    /* audio is enhancement-only */
  }
}

/** Shaker: bright high-passed noise tick. */
export function playShaker(ctx: AudioContext | null = sharedCtx, when = 0): void {
  if (!ctx) return;
  try {
    const t = now(ctx) + when;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.15);
  } catch {
    /* audio is enhancement-only */
  }
}

/** Bell: triangle tone at the given frequency with a gentle shimmer decay. */
export function playBell(ctx: AudioContext | null = sharedCtx, freq = 880, when = 0): void {
  if (!ctx) return;
  try {
    const t = now(ctx) + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.9);
  } catch {
    /* audio is enhancement-only */
  }
}

/** Play whichever drum sound a beat note calls for. */
export function playSound(sound: DrumSound, ctx: AudioContext | null = sharedCtx, freq?: number, when = 0): void {
  switch (sound) {
    case 'kick':
      playKick(ctx, when);
      break;
    case 'clap':
      playClap(ctx, when);
      break;
    case 'shaker':
      playShaker(ctx, when);
      break;
    case 'bell':
      playBell(ctx, freq ?? 880, when);
      break;
  }
}

// ---------------------------------------------------------------------------
// Deterministic pattern generation
// ---------------------------------------------------------------------------

/** Tiny seeded PRNG (mulberry32) so patterns are reproducible. */
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

/** One scheduled hit in a tune: which sound, how many ms after tune start. */
export interface BeatNote {
  /** ms after the tune's first beat */
  at: number;
  sound: DrumSound;
  /** bell pitch in Hz (only for bell notes) */
  freq?: number;
  /** index of this note in the tune's note list (stable identity) */
  index: number;
}

export type TuneMode = 'tap-along' | 'echo';

export interface TuneDef {
  id: string;
  title: string;
  level: 1 | 2 | 3 | 4;
  intro: string;
  /** ms between consecutive beats */
  tempoMs: number;
  /** pads the kid can tap during this tune */
  pads: DrumSound[];
  mode: TuneMode;
  /** for 'echo': how many beats Riff plays before the kid repeats */
  echoLength?: number;
  /** for 'tap-along': the repeating pattern (null = rest) */
  pattern?: Array<DrumSound | null>;
  /** how many times the pattern repeats */
  bars?: number;
  /** bell melody for level 4: [sound freq in Hz, beats long][] */
  melody?: Array<[number, number]>;
}

/** Bell pitches for the Twinkle tune (C5, G5, A5). */
export const BELL_FREQS = { low: 523.25, mid: 783.99, high: 880.0 } as const;

export const TUNES: TuneDef[] = [
  {
    id: 'steady-drum',
    title: 'Steady Drum',
    level: 1,
    intro: 'Tap the big drum on every beat. One, two, ready, you!',
    tempoMs: 650,
    pads: ['kick'],
    mode: 'tap-along',
    pattern: ['kick'],
    bars: 8,
  },
  {
    id: 'kick-clap-march',
    title: 'Kick Clap March',
    level: 2,
    intro: 'Two sounds now! Boom, boom, clap! Match the drum and the clap.',
    tempoMs: 550,
    pads: ['kick', 'clap'],
    mode: 'tap-along',
    pattern: ['kick', 'kick', 'clap'],
    bars: 4,
  },
  {
    id: 'riffs-echo',
    title: "Riff's Echo",
    level: 3,
    intro: 'Riff plays a rhythm, then you play it back. Listen close, echo it back!',
    tempoMs: 500,
    pads: ['kick', 'clap', 'shaker'],
    mode: 'echo',
    echoLength: 4,
  },
  {
    id: 'twinkle-bells',
    title: 'Twinkle Bells',
    level: 4,
    intro: 'Ring the bells to the twinkle tune. Low, low, high, high!',
    tempoMs: 480,
    pads: ['bell'],
    mode: 'tap-along',
    melody: [
      [BELL_FREQS.low, 1],
      [BELL_FREQS.low, 1],
      [BELL_FREQS.mid, 1],
      [BELL_FREQS.mid, 1],
      [BELL_FREQS.high, 1],
      [BELL_FREQS.high, 1],
      [BELL_FREQS.mid, 2],
    ],
    bars: 1,
  },
];

export function getTune(id: string): TuneDef | undefined {
  return TUNES.find((t) => t.id === id);
}

/**
 * Build the full note list for a tune, deterministically from a seed.
 * For echo tunes the call pattern is drawn from the seeded PRNG using the
 * tune's pad palette (never repeating the same sound twice in a row).
 */
export function buildBeatMap(tune: TuneDef, seed: number): BeatNote[] {
  const notes: BeatNote[] = [];
  let index = 0;
  if (tune.mode === 'echo') {
    const rand = mulberry32(seed);
    const palette = tune.pads;
    const len = tune.echoLength ?? 4;
    let prev = -1;
    for (let i = 0; i < len; i++) {
      let pick = Math.floor(rand() * palette.length);
      if (palette.length > 1) {
        while (pick === prev) pick = Math.floor(rand() * palette.length);
      }
      prev = pick;
      notes.push({ at: i * tune.tempoMs, sound: palette[pick], index: index++ });
    }
    return notes;
  }
  if (tune.melody) {
    let at = 0;
    for (const [freq, beats] of tune.melody) {
      notes.push({ at, sound: 'bell', freq, index: index++ });
      at += beats * tune.tempoMs;
    }
    return notes;
  }
  const pattern = tune.pattern ?? ['kick'];
  const bars = tune.bars ?? 1;
  for (let b = 0; b < bars; b++) {
    for (let s = 0; s < pattern.length; s++) {
      const sound = pattern[s];
      if (sound) notes.push({ at: (b * pattern.length + s) * tune.tempoMs, sound, index: index++ });
    }
  }
  return notes;
}

/** Total ms a tune lasts once its first beat lands. */
export function tuneDurationMs(tune: TuneDef, seed = 0): number {
  const notes = buildBeatMap(tune, seed);
  if (notes.length === 0) return 0;
  return notes[notes.length - 1].at + tune.tempoMs;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export type Judgment = 'perfect' | 'good' | 'miss';

/**
 * Judge a tap against a beat time. A tap counts as a hit when it lands
 * within HIT_WINDOW_MS (250ms) of the beat — Perfect within 120ms.
 */
export function scoreTap(beatAtMs: number, tapAtMs: number): Judgment {
  const delta = Math.abs(tapAtMs - beatAtMs);
  if (delta <= PERFECT_WINDOW_MS) return 'perfect';
  if (delta <= HIT_WINDOW_MS) return 'good';
  return 'miss';
}

export interface TuneScore {
  perfect: number;
  good: number;
  miss: number;
  maxCombo: number;
}

export function emptyScore(): TuneScore {
  return { perfect: 0, good: 0, miss: 0, maxCombo: 0 };
}

/** Merge one tune's score into a running session total. */
export function mergeScore(total: TuneScore, tune: TuneScore): TuneScore {
  return {
    perfect: total.perfect + tune.perfect,
    good: total.good + tune.good,
    miss: total.miss + tune.miss,
    maxCombo: Math.max(total.maxCombo, tune.maxCombo),
  };
}

/** 0-100 accuracy from a score. */
export function accuracyOf(score: TuneScore): number {
  const judged = score.perfect + score.good + score.miss;
  if (judged === 0) return 0;
  return Math.round(((score.perfect + score.good) / judged) * 100);
}

/** 1-3 stars from session accuracy. */
export function starsForAccuracy(accuracy: number): 1 | 2 | 3 {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  return 1;
}
