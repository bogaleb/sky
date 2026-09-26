/**
 * Clock Tower — telling-time engine.
 * Levels 1-3: L1 hour only (:00), L2 half hour (:30), L3 quarter hours (:15/:45).
 * Pure and deterministic: the same seed always produces the same question.
 */

import { mulberry32 } from './words';

export type TimeLevel = 1 | 2 | 3;

export interface TimeQuestion {
  hour: number; // 1-12
  minute: number; // 0, 15, 30, or 45
  level: TimeLevel;
  /** Digital display strings, e.g. "3:00". */
  choices: string[];
  answer: string;
  /** Kid-friendly spoken form, e.g. "three o'clock". */
  spoken: string;
}

export const ROUNDS_PER_GAME = 8;

/** Level for each round of a game: gentle ramp 1,1,2,2,3,3,3,3. */
export const ROUND_LEVELS: TimeLevel[] = [1, 1, 2, 2, 3, 3, 3, 3];

const HOUR_WORDS = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
];

/** Digital display, e.g. hour=3 minute=5 -> "3:05". */
export function formatTime(hour: number, minute: number): string {
  return `${hour}:${minute === 0 ? '00' : minute}`;
}

/** Spoken form for a time: "three o'clock", "three thirty", "quarter past three", "quarter to four". */
export function spokenTime(hour: number, minute: number): string {
  const word = HOUR_WORDS[hour] ?? `${hour}`;
  if (minute === 0) return `${word} o'clock`;
  if (minute === 30) return `${word} thirty`;
  if (minute === 15) return `quarter past ${word}`;
  // minute === 45: "quarter to <next hour>"
  const next = hour === 12 ? 1 : hour + 1;
  return `quarter to ${HOUR_WORDS[next] ?? `${next}`}`;
}

/** Analog clock hand angles in degrees, 12 at 0. */
export function handAngles(hour: number, minute: number): { hourAngle: number; minuteAngle: number } {
  return {
    hourAngle: ((hour % 12) * 30 + minute * 0.5) % 360,
    minuteAngle: (minute * 6) % 360,
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** Plausible wrong answers for a time question (unique, never the answer). */
function distractors(hour: number, minute: number, rng: () => number): string[] {
  const answer = formatTime(hour, minute);
  const candidates: string[] = [];
  // Wrong hour, same minutes.
  for (const dh of [1, -1, 2, -2]) {
    const h = ((hour - 1 + dh + 12) % 12) + 1;
    candidates.push(formatTime(h, minute));
  }
  // Same hour, confusable minutes.
  if (minute === 0) candidates.push(formatTime(hour, 30));
  if (minute === 30) candidates.push(formatTime(hour, 0));
  if (minute === 15) candidates.push(formatTime(hour, 45));
  if (minute === 45) candidates.push(formatTime(hour, 15));
  // Both slightly off.
  const h2 = ((hour - 1 + 3 + 12) % 12) + 1;
  candidates.push(formatTime(h2, minute));
  const seen = new Set<string>();
  const out: string[] = [];
  // Deterministic shuffle of candidates, then take 2 unique non-answer options.
  const shuffled = [...candidates].sort(() => rng() - 0.5);
  for (const c of shuffled) {
    if (c !== answer && !seen.has(c)) {
      seen.add(c);
      out.push(c);
      if (out.length === 2) break;
    }
  }
  return out;
}

/** Generate one telling-time question for a level. Deterministic in (level, seed). */
export function generateQuestion(level: TimeLevel, seed: number): TimeQuestion {
  const rng = mulberry32(seed);
  const hour = 1 + Math.floor(rng() * 12);
  let minute = 0;
  if (level === 2) minute = 30;
  if (level === 3) minute = pick(rng, [15, 45]);
  const answer = formatTime(hour, minute);
  const choices = [answer, ...distractors(hour, minute, rng)].sort(() => rng() - 0.5);
  return {
    hour,
    minute,
    level,
    choices,
    answer,
    spoken: spokenTime(hour, minute),
  };
}

/**
 * Teaching lines for a clock: the hint points at the right hand to read, the
 * worked example reads the clock out loud step by step (short hand first,
 * then the long hand), ending on the answer the child then taps.
 */
export function timeLines(q: TimeQuestion): { hint: string; explain: string; praise: string } {
  const hourWord = HOUR_WORDS[q.hour] ?? `${q.hour}`;
  const nextHour = q.hour === 12 ? 1 : q.hour + 1;
  const nextWord = HOUR_WORDS[nextHour] ?? `${nextHour}`;
  const hint =
    q.minute === 0
      ? 'Look at the short hand first. The short hand tells the hour. Where is the long hand pointing?'
      : 'Look at the long hand. Is it pointing to 12, 3, 6, or 9? Then find the short hand.';
  let explain: string;
  if (q.minute === 0) {
    explain = `The short hand points to ${hourWord}. The long hand points straight up to 12. That means ${q.spoken}. That is ${q.answer}.`;
  } else if (q.minute === 30) {
    explain = `The long hand points down to 6. That means thirty, or half past. The short hand is just past ${hourWord}. So it is ${q.spoken}. That is ${q.answer}.`;
  } else if (q.minute === 15) {
    explain = `The long hand points to 3. That means fifteen, or quarter past. The short hand is just past ${hourWord}. So it is ${q.spoken}. That is ${q.answer}.`;
  } else {
    explain = `The long hand points to 9. That means forty five, or quarter to. The short hand is almost at ${nextWord}, so it is still ${hourWord}. It is ${q.spoken}. That is ${q.answer}.`;
  }
  return { hint, explain, praise: `Yes! It's ${q.spoken}!` };
}
