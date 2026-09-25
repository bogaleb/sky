'use client';

import { getCharacter } from './characters';

/**
 * Kid audio engine: spoken narration (for non-readers) and synthesized
 * sound effects via Web Audio. No audio files needed; everything is
 * generated. Mute state persists in localStorage.
 */

const MUTE_KEY = 'sky-kid-muted';

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(MUTE_KEY) === '1';
}

export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  if (muted) stopSpeaking();
}

/** Speak narration aloud for non-readers. Kid-friendly pitch and pace. */
export function speak(text: string): void {
  speakAs('curio', text);
}

/**
 * Speak as a specific character — each cast member gets a distinct
 * voice (pitch/rate profile) so children can tell them apart.
 */
export function speakAs(characterId: string, text: string): void {
  if (typeof window === 'undefined' || isMuted()) return;
  try {
    const character = getCharacter(characterId);
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = character.voice.rate;
    utter.pitch = character.voice.pitch;
    utter.volume = 1;
    // Prefer a warm English voice when available.
    const voices = synth.getVoices();
    const warm =
      voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|zira|google us english/i.test(v.name)) ??
      voices.find((v) => /^en/i.test(v.lang));
    if (warm) utter.voice = warm;
    synth.speak(utter);
  } catch {
    /* narration is enhancement-only */
  }
}

export function stopSpeaking(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* noop */
  }
}

type SfxName =
  | 'click'
  | 'pop'
  | 'correct'
  | 'wrong'
  | 'star'
  | 'whoosh'
  | 'fanfare'
  | 'levelup';

function tone(
  ac: AudioContext,
  opts: {
    freq: number;
    freqEnd?: number;
    time: number;
    dur: number;
    type?: OscillatorType;
    gain?: number;
  }
): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, ac.currentTime + opts.time);
  if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, ac.currentTime + opts.time + opts.dur);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + opts.time);
  gain.gain.exponentialRampToValueAtTime(opts.gain ?? 0.22, ac.currentTime + opts.time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + opts.time + opts.dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + opts.time);
  osc.stop(ac.currentTime + opts.time + opts.dur + 0.05);
}

const SFX: Record<SfxName, Array<Parameters<typeof tone>[1]>> = {
  click: [{ freq: 660, freqEnd: 880, time: 0, dur: 0.09, type: 'triangle', gain: 0.12 }],
  pop: [
    { freq: 420, freqEnd: 900, time: 0, dur: 0.12, type: 'sine', gain: 0.25 },
    { freq: 1200, time: 0.02, dur: 0.06, type: 'triangle', gain: 0.08 },
  ],
  correct: [
    { freq: 523.25, time: 0, dur: 0.16, type: 'triangle', gain: 0.2 },
    { freq: 659.25, time: 0.1, dur: 0.16, type: 'triangle', gain: 0.2 },
    { freq: 783.99, time: 0.2, dur: 0.28, type: 'triangle', gain: 0.22 },
  ],
  wrong: [
    { freq: 330, freqEnd: 262, time: 0, dur: 0.22, type: 'sine', gain: 0.14 },
    { freq: 262, freqEnd: 220, time: 0.14, dur: 0.24, type: 'sine', gain: 0.12 },
  ],
  star: [
    { freq: 1046.5, time: 0, dur: 0.2, type: 'sine', gain: 0.16 },
    { freq: 1318.5, time: 0.08, dur: 0.26, type: 'sine', gain: 0.16 },
  ],
  whoosh: [{ freq: 300, freqEnd: 1400, time: 0, dur: 0.28, type: 'sawtooth', gain: 0.06 }],
  fanfare: [
    { freq: 523.25, time: 0, dur: 0.18, type: 'triangle', gain: 0.2 },
    { freq: 523.25, time: 0.2, dur: 0.18, type: 'triangle', gain: 0.2 },
    { freq: 659.25, time: 0.4, dur: 0.18, type: 'triangle', gain: 0.2 },
    { freq: 783.99, time: 0.6, dur: 0.4, type: 'triangle', gain: 0.24 },
    { freq: 1046.5, time: 0.6, dur: 0.4, type: 'sine', gain: 0.12 },
  ],
  levelup: [
    { freq: 392, time: 0, dur: 0.14, type: 'square', gain: 0.08 },
    { freq: 523.25, time: 0.12, dur: 0.14, type: 'square', gain: 0.08 },
    { freq: 659.25, time: 0.24, dur: 0.14, type: 'square', gain: 0.08 },
    { freq: 783.99, time: 0.36, dur: 0.3, type: 'square', gain: 0.1 },
  ],
};

/** Play a synthesized sound effect. Silent when muted or unsupported. */
export function playSfx(name: SfxName): void {
  if (isMuted()) return;
  const ac = ctx();
  if (!ac) return;
  try {
    for (const t of SFX[name]) tone(ac, t);
  } catch {
    /* enhancement-only */
  }
}

/** Unlock audio on first user gesture (mobile autoplay policy). */
export function unlockAudio(): void {
  ctx();
  // Warm up the voice list for speechSynthesis.
  try {
    window.speechSynthesis?.getVoices();
  } catch {
    /* noop */
  }
}

let musicTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start a soft looping music bed (gentle music-box waltz) under videos.
 * This gives our silent generated clips a warm cinematic feel.
 */
export function startMusicBed(): void {
  if (isMuted() || musicTimer) return;
  const ac = ctx();
  if (!ac) return;
  // Music-box waltz in C major, soft triangle tones.
  const melody = [
    523.25, 587.33, 659.25, 783.99, 659.25, 587.33,
    523.25, 440.0, 523.25, 659.25, 587.33, 523.25,
  ];
  let i = 0;
  const playNote = () => {
    if (isMuted()) {
      stopMusicBed();
      return;
    }
    const a = ctx();
    if (!a) return;
    try {
      tone(a, { freq: melody[i % melody.length], time: 0, dur: 0.9, type: 'triangle', gain: 0.05 });
      // Soft bass note on the downbeat.
      if (i % 3 === 0) {
        tone(a, { freq: melody[i % melody.length] / 4, time: 0, dur: 1.1, type: 'sine', gain: 0.06 });
      }
    } catch {
      /* noop */
    }
    i++;
  };
  playNote();
  musicTimer = setInterval(playNote, 620);
}

/** Stop the music bed. */
export function stopMusicBed(): void {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
