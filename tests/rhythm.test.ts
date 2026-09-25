import { describe, expect, it } from 'vitest';
import {
  TUNES,
  getTune,
  buildBeatMap,
  tuneDurationMs,
  scoreTap,
  emptyScore,
  mergeScore,
  accuracyOf,
  starsForAccuracy,
  mulberry32,
  ensureAudio,
  playKick,
  playClap,
  playShaker,
  playBell,
  playSound,
  PERFECT_WINDOW_MS,
  HIT_WINDOW_MS,
  TRAVEL_MS,
  COUNT_IN_BEATS,
  BELL_FREQS,
} from '../lib/kid/rhythm';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe('tune catalog', () => {
  it('has exactly 4 tunes at levels 1-4', () => {
    expect(TUNES).toHaveLength(4);
    expect(TUNES.map((t) => t.level).sort()).toEqual([1, 2, 3, 4]);
    const ids = TUNES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every tune has a title, intro, tempo, and pads', () => {
    for (const t of TUNES) {
      expect(t.title.trim().length).toBeGreaterThan(2);
      expect(t.intro.trim().length).toBeGreaterThan(10);
      expect(t.tempoMs).toBeGreaterThanOrEqual(400);
      expect(t.tempoMs).toBeLessThanOrEqual(800);
      expect(t.pads.length).toBeGreaterThan(0);
    }
  });

  it('has no emoji in kid-facing text', () => {
    for (const t of TUNES) {
      expect(t.title).not.toMatch(EMOJI_RE);
      expect(t.intro).not.toMatch(EMOJI_RE);
    }
  });

  it('getTune resolves every id', () => {
    for (const t of TUNES) expect(getTune(t.id)).toBe(t);
    expect(getTune('nope')).toBeUndefined();
  });
});

describe('beat maps', () => {
  it('steady drum: 8 kick notes on a steady grid', () => {
    const notes = buildBeatMap(getTune('steady-drum')!, 7);
    expect(notes).toHaveLength(8);
    expect(notes.every((n) => n.sound === 'kick')).toBe(true);
    notes.forEach((n, i) => {
      expect(n.at).toBe(i * 650);
      expect(n.index).toBe(i);
    });
  });

  it('kick clap march: kick,kick,clap repeated with no rests', () => {
    const notes = buildBeatMap(getTune('kick-clap-march')!, 7);
    expect(notes).toHaveLength(12);
    const pattern = notes.slice(0, 3).map((n) => n.sound);
    expect(pattern).toEqual(['kick', 'kick', 'clap']);
    expect(notes.map((n) => n.sound)).toEqual([
      'kick', 'kick', 'clap',
      'kick', 'kick', 'clap',
      'kick', 'kick', 'clap',
      'kick', 'kick', 'clap',
    ]);
  });

  it('twinkle bells: C C G G A A G melody with correct pitches', () => {
    const notes = buildBeatMap(getTune('twinkle-bells')!, 7);
    expect(notes).toHaveLength(7);
    expect(notes.map((n) => n.freq)).toEqual([
      BELL_FREQS.low, BELL_FREQS.low,
      BELL_FREQS.mid, BELL_FREQS.mid,
      BELL_FREQS.high, BELL_FREQS.high,
      BELL_FREQS.mid,
    ]);
    expect(notes.map((n) => n.at)).toEqual([0, 480, 960, 1440, 1920, 2400, 2880]);
  });

  it('echo: 4 notes from the palette, never repeating twice in a row', () => {
    const tune = getTune('riffs-echo')!;
    for (let seed = 1; seed <= 20; seed++) {
      const notes = buildBeatMap(tune, seed);
      expect(notes).toHaveLength(4);
      for (const n of notes) expect(tune.pads).toContain(n.sound);
      for (let i = 1; i < notes.length; i++) {
        expect(notes[i].sound).not.toBe(notes[i - 1].sound);
      }
    }
  });

  it('is deterministic for the same seed', () => {
    const tune = getTune('riffs-echo')!;
    expect(buildBeatMap(tune, 42)).toEqual(buildBeatMap(tune, 42));
  });

  it('varies the echo pattern across seeds', () => {
    const tune = getTune('riffs-echo')!;
    const a = buildBeatMap(tune, 1).map((n) => n.sound).join(',');
    const b = buildBeatMap(tune, 2).map((n) => n.sound).join(',');
    expect(a).not.toBe(b);
  });

  it('tuneDurationMs covers the last note plus one beat', () => {
    expect(tuneDurationMs(getTune('steady-drum')!, 7)).toBe(7 * 650 + 650);
  });
});

describe('mulberry32', () => {
  it('is deterministic and varies by seed', () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    const c = mulberry32(6);
    expect(c()).not.toBe(mulberry32(5)());
  });
});

describe('scoreTap', () => {
  it('uses the documented windows', () => {
    expect(PERFECT_WINDOW_MS).toBe(120);
    expect(HIT_WINDOW_MS).toBe(250);
  });

  it('perfect at 0ms and at the 120ms boundary', () => {
    expect(scoreTap(1000, 1000)).toBe('perfect');
    expect(scoreTap(1000, 1120)).toBe('perfect');
    expect(scoreTap(1000, 880)).toBe('perfect');
  });

  it('good just outside perfect up to the 250ms boundary', () => {
    expect(scoreTap(1000, 1121)).toBe('good');
    expect(scoreTap(1000, 1250)).toBe('good');
    expect(scoreTap(1000, 750)).toBe('good');
  });

  it('miss beyond 250ms either side', () => {
    expect(scoreTap(1000, 1251)).toBe('miss');
    expect(scoreTap(1000, 749)).toBe('miss');
    expect(scoreTap(1000, 2000)).toBe('miss');
  });
});

describe('scoring helpers', () => {
  it('accuracyOf handles empty and partial scores', () => {
    expect(accuracyOf(emptyScore())).toBe(0);
    expect(accuracyOf({ perfect: 9, good: 0, miss: 1, maxCombo: 9 })).toBe(90);
    expect(accuracyOf({ perfect: 0, good: 7, miss: 3, maxCombo: 4 })).toBe(70);
  });

  it('starsForAccuracy thresholds', () => {
    expect(starsForAccuracy(100)).toBe(3);
    expect(starsForAccuracy(90)).toBe(3);
    expect(starsForAccuracy(89)).toBe(2);
    expect(starsForAccuracy(70)).toBe(2);
    expect(starsForAccuracy(69)).toBe(1);
    expect(starsForAccuracy(0)).toBe(1);
  });

  it('mergeScore sums and keeps the best combo', () => {
    const merged = mergeScore(
      { perfect: 8, good: 0, miss: 0, maxCombo: 8 },
      { perfect: 6, good: 2, miss: 1, maxCombo: 7 }
    );
    expect(merged).toEqual({ perfect: 14, good: 2, miss: 1, maxCombo: 8 });
  });
});

describe('synth functions', () => {
  it('are all defined', () => {
    for (const fn of [playKick, playClap, playShaker, playBell, playSound, ensureAudio]) {
      expect(typeof fn).toBe('function');
    }
  });

  it('no-op safely without an AudioContext (node has no window)', () => {
    expect(ensureAudio()).toBeNull();
    expect(() => playKick(null)).not.toThrow();
    expect(() => playClap(null)).not.toThrow();
    expect(() => playShaker(null)).not.toThrow();
    expect(() => playBell(null, 880)).not.toThrow();
    expect(() => playSound('kick', null)).not.toThrow();
    expect(() => playSound('bell', null, 523.25)).not.toThrow();
  });
});

describe('timing constants', () => {
  it('are sane for kids', () => {
    expect(TRAVEL_MS).toBeGreaterThanOrEqual(1500);
    expect(COUNT_IN_BEATS).toBe(4);
  });
});
