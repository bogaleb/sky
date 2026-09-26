'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TUNES,
  buildBeatMap,
  tuneDurationMs,
  scoreTap,
  emptyScore,
  mergeScore,
  accuracyOf,
  starsForAccuracy,
  ensureAudio,
  playSound,
  playShaker,
  HIT_WINDOW_MS,
  TRAVEL_MS,
  COUNT_IN_BEATS,
  SOUND_LABELS,
  BELL_FREQS,
  type TuneDef,
  type BeatNote,
  type Judgment,
  type TuneScore,
  type DrumSound,
} from '@/lib/kid/rhythm';
import { speakAs, playSfx, stopSpeaking, unlockAudio } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen, AnswerFeedbackPanel } from './game-shell';
import KidShell from '@/components/kid/kid-shell';

export interface RhythmStudioProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'pick' | 'countin' | 'play' | 'echo-call' | 'echo-response' | 'won';

interface Pad {
  key: string;
  sound: DrumSound;
  freq?: number;
  label: string;
}

const HIT_LINE_PCT = 18;

const PAD_STYLES: Record<DrumSound, string> = {
  kick: 'bg-kid-coral-400 border-kid-coral-600',
  clap: 'bg-kid-sun-400 border-kid-sun-500',
  shaker: 'bg-kid-mint-400 border-kid-mint-600',
  bell: 'bg-kid-grape-400 border-kid-grape-500',
};

const NOTE_STYLES: Record<DrumSound, string> = {
  kick: 'bg-kid-coral-400',
  clap: 'bg-kid-sun-400',
  shaker: 'bg-kid-mint-400',
  bell: 'bg-kid-grape-400',
};

const JUDGMENT_STYLES: Record<Judgment, string> = {
  perfect: 'text-kid-sun-500',
  good: 'text-kid-mint-600',
  miss: 'text-kid-coral-500',
};

const JUDGMENT_WORDS: Record<Judgment, string> = {
  perfect: 'Perfect!',
  good: 'Good!',
  miss: 'Miss',
};

function padsFor(tune: TuneDef): Pad[] {
  if (tune.id === 'twinkle-bells') {
    return [
      { key: 'bell-low', sound: 'bell', freq: BELL_FREQS.low, label: 'Low bell' },
      { key: 'bell-mid', sound: 'bell', freq: BELL_FREQS.mid, label: 'Middle bell' },
      { key: 'bell-high', sound: 'bell', freq: BELL_FREQS.high, label: 'High bell' },
    ];
  }
  return tune.pads.map((sound) => ({ key: sound, sound, label: SOUND_LABELS[sound] }));
}

function padMatches(pad: Pad, note: BeatNote): boolean {
  if (pad.sound !== note.sound) return false;
  if (pad.sound === 'bell') return pad.freq === note.freq;
  return true;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M9 18V5l10-2v13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="18" r="2.8" fill="currentColor" />
      <circle cx="16.5" cy="16" r="2.8" fill="currentColor" />
    </svg>
  );
}

export default function RhythmStudio({ childId, nickname, onExit }: RhythmStudioProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [tune, setTune] = useState<TuneDef | null>(null);
  const [notes, setNotes] = useState<BeatNote[]>([]);
  const [judged, setJudged] = useState<Record<number, Judgment>>({});
  const [countIn, setCountIn] = useState(COUNT_IN_BEATS);
  const [live, setLive] = useState({ perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0 });
  const [total, setTotal] = useState<TuneScore>(emptyScore());
  const [tunesDone, setTunesDone] = useState<string[]>([]);
  const [nowMs, setNowMs] = useState(0);
  const [flashPad, setFlashPad] = useState<string | null>(null);
  const [beatFlash, setBeatFlash] = useState(0);
  const [popup, setPopup] = useState<{ key: number; text: string; kind: Judgment } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [echoPtr, setEchoPtr] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'rhythm_game',
    stickerId: 'beat-master',
    trophyEvent: 'rhythm_done',
    milestone: 'rhythm_studio_win',
    learning: { gameId: 'rhythm-studio', skill: 'rhythm' },
  });
  const starBalance = session.starBalance ?? 0;
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [finalCombo, setFinalCombo] = useState(0);

  const timers = useRef<number[]>([]);
  const rafId = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const startEpochRef = useRef(0);
  const seedRef = useRef(1);
  const judgedRef = useRef<Record<number, Judgment>>({});
  const liveRef = useRef({ perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0 });
  const echoPtrRef = useRef(0);
  const popupKey = useRef(0);
  // Tune identity + level for recordAnswer, and a per-play counter so note
  // itemKeys stay unique when a tune is replayed in one session.
  const tuneInfoRef = useRef<{ id: string; level: number } | null>(null);
  const playCountRef = useRef(0);

  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    cancelAnimationFrame(rafId.current);
  }, []);

  useEffect(() => {
    speakAs('riff', `Hey ${nickname ?? 'friend'}! Welcome to the Rhythm Studio! Pick a tune and tap along with me!`);
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(rafId.current);
      stopSpeaking();
    };
  }, [nickname]);

  const pads = useMemo(() => (tune ? padsFor(tune) : []), [tune]);

  const recordJudgment = useCallback((index: number, judgment: Judgment, hint?: string) => {
    judgedRef.current = { ...judgedRef.current, [index]: judgment };
    setJudged(judgedRef.current);
    // One answered item per beat note: first judgment wins (a wrong pad in
    // echo mode keeps the first, wrong judgment for that note).
    const play = tuneInfoRef.current;
    if (play) {
      session.recordAnswer(judgment !== 'miss', {
        level: play.level,
        itemKey: `${play.id}-${playCountRef.current}-${index}`,
        hint,
      });
    }
    const l = liveRef.current;
    const combo = judgment === 'miss' ? 0 : l.combo + 1;
    liveRef.current = {
      perfect: l.perfect + (judgment === 'perfect' ? 1 : 0),
      good: l.good + (judgment === 'good' ? 1 : 0),
      miss: l.miss + (judgment === 'miss' ? 1 : 0),
      combo,
      maxCombo: Math.max(l.maxCombo, combo),
    };
    setLive({ ...liveRef.current });
    const key = ++popupKey.current;
    setPopup({ key, text: JUDGMENT_WORDS[judgment], kind: judgment });
    if (judgment === 'perfect') playSfx('correct');
    if (judgment === 'miss') playSfx('wrong');
  }, [session]);

  const beatTimeOf = useCallback((note: BeatNote) => startEpochRef.current + note.at, []);

  const fireBeat = useCallback(
    (note: BeatNote) => {
      playSound(note.sound, ctxRef.current, note.freq);
      setBeatFlash((f) => f + 1);
    },
    []
  );

  const finishTune = useCallback(() => {
    const tuneScore: TuneScore = {
      perfect: liveRef.current.perfect,
      good: liveRef.current.good,
      miss: liveRef.current.miss,
      maxCombo: liveRef.current.maxCombo,
    };
    const newTotal = mergeScore(total, tuneScore);
    const done = tune ? [...tunesDone, tune.id] : tunesDone;
    setTotal(newTotal);
    setTunesDone(done);
    clearTimers();
    playSfx('fanfare');
    if (done.length >= TUNES.length) {
      const accuracy = accuracyOf(newTotal);
      const stars = starsForAccuracy(accuracy);
      setFinalAccuracy(accuracy);
      setFinalCombo(newTotal.maxCombo);
      setStarsEarned(stars);
      setPhase('won');
      speakAs('riff', `Amazing, ${nickname ?? 'friend'}! You finished every tune with ${accuracy} percent! You earned ${stars} stars!`);
      void session.complete({
        stars,
        extraMetadata: { accuracy, maxCombo: newTotal.maxCombo },
      });
    } else {
      speakAs('riff', `Nice playing, ${nickname ?? 'friend'}! Pick another tune!`);
      setPhase('pick');
      setTune(null);
    }
  }, [total, tunesDone, tune, nickname, childId, clearTimers, session]);

  // ---- tap-along scheduling -------------------------------------------------
  const beginPlaying = useCallback(
    (nextTune: TuneDef, nextNotes: BeatNote[]) => {
      startEpochRef.current = performance.now();
      setPhase('play');
      setNowMs(0);
      const tick = () => {
        setNowMs(performance.now() - startEpochRef.current);
        rafId.current = requestAnimationFrame(tick);
      };
      rafId.current = requestAnimationFrame(tick);
      for (const note of nextNotes) {
        later(note.at, () => fireBeat(note));
        later(note.at + HIT_WINDOW_MS + 40, () => {
          if (!(note.index in judgedRef.current)) {
            recordJudgment(note.index, 'miss', 'Watch the beat line and tap!');
            setHint('Watch the beat line and tap!');
          }
        });
      }
      later(tuneDurationMs(nextTune, seedRef.current) + 700, () => {
        cancelAnimationFrame(rafId.current);
        finishTune();
      });
    },
    [finishTune, fireBeat, later, recordJudgment]
  );

  // ---- echo (call and response) ---------------------------------------------
  const beginEchoCall = useCallback(
    (nextTune: TuneDef, nextNotes: BeatNote[]) => {
      setPhase('echo-call');
      setEchoPtr(0);
      echoPtrRef.current = 0;
      speakAs('riff', 'Listen to my rhythm...');
      nextNotes.forEach((note, i) => {
        later(i * nextTune.tempoMs, () => {
          playSound(note.sound, ctxRef.current, note.freq);
          const pad = padsFor(nextTune).find((p) => padMatches(p, note));
          if (pad) {
            setFlashPad(pad.key);
            later(280, () => setFlashPad(null));
          }
        });
      });
      later(nextNotes.length * nextTune.tempoMs + 500, () => {
        setPhase('echo-response');
        speakAs('riff', 'Your turn! Copy my rhythm!');
      });
    },
    [later]
  );

  const replayEchoCall = useCallback(() => {
    if (!tune) return;
    clearTimers();
    beginEchoCall(tune, notes);
  }, [tune, notes, clearTimers, beginEchoCall]);

  // ---- tune start (user gesture: safe to create AudioContext) ---------------
  const startTune = useCallback(
    (nextTune: TuneDef) => {
      unlockAudio();
      ctxRef.current = ensureAudio();
      clearTimers();
      const nextSeed = (Date.now() % 100000) + Math.floor(Math.random() * 1000);
      seedRef.current = nextSeed;
      tuneInfoRef.current = { id: nextTune.id, level: nextTune.level };
      playCountRef.current += 1;
      const nextNotes = buildBeatMap(nextTune, nextSeed);
      setTune(nextTune);
      setNotes(nextNotes);
      judgedRef.current = {};
      setJudged({});
      liveRef.current = { perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0 };
      setLive({ ...liveRef.current });
      setHint(null);
      setPopup(null);
      setPhase('countin');
      speakAs('riff', `${nextTune.intro}`);
      for (let i = 0; i < COUNT_IN_BEATS; i++) {
        later(i * nextTune.tempoMs, () => {
          setCountIn(COUNT_IN_BEATS - i);
          playShaker(ctxRef.current);
        });
      }
      later(COUNT_IN_BEATS * nextTune.tempoMs + 120, () => {
        if (nextTune.mode === 'echo') beginEchoCall(nextTune, nextNotes);
        else beginPlaying(nextTune, nextNotes);
      });
    },
    [later, clearTimers, beginEchoCall, beginPlaying]
  );

  // ---- tapping ---------------------------------------------------------------
  const handlePadTap = useCallback(
    (pad: Pad) => {
      unlockAudio();
      if (!ctxRef.current) ctxRef.current = ensureAudio();
      playSound(pad.sound, ctxRef.current, pad.freq);
      const now = performance.now();

      if (phase === 'echo-response' && tune) {
        const expected = notes[echoPtrRef.current];
        if (!expected) return;
        if (padMatches(pad, expected)) {
          recordJudgment(expected.index, 'perfect');
          const next = echoPtrRef.current + 1;
          echoPtrRef.current = next;
          setEchoPtr(next);
          setHint(null);
          if (next >= notes.length) {
            later(500, finishTune);
          }
        } else {
          const missHint = `Listen again, then tap the ${padsFor(tune).find((p) => padMatches(p, expected))?.label ?? 'right pad'}!`;
          recordJudgment(expected.index, 'miss', missHint);
          setHint(missHint);
        }
        return;
      }

      if (phase !== 'play') return;
      // Nearest unjudged note with a matching pad inside the hit window.
      let best: BeatNote | null = null;
      let bestDelta = Infinity;
      for (const note of notes) {
        if (note.index in judgedRef.current) continue;
        if (!padMatches(pad, note)) continue;
        const delta = Math.abs(now - beatTimeOf(note));
        if (delta < bestDelta) {
          bestDelta = delta;
          best = note;
        }
      }
      if (best && bestDelta <= HIT_WINDOW_MS) {
        recordJudgment(best.index, scoreTap(beatTimeOf(best), now));
        setHint(null);
        return;
      }
      // Wrong pad? Flag the nearest unjudged beat inside the window.
      let nearest: BeatNote | null = null;
      let nearestDelta = Infinity;
      for (const note of notes) {
        if (note.index in judgedRef.current) continue;
        const delta = Math.abs(now - beatTimeOf(note));
        if (delta < nearestDelta) {
          nearestDelta = delta;
          nearest = note;
        }
      }
      if (nearest && nearestDelta <= HIT_WINDOW_MS) {
        const want = pads.find((p) => padMatches(p, nearest as BeatNote));
        const missHint = `Oops! That beat wanted the ${want?.label ?? 'other pad'}.`;
        recordJudgment(nearest.index, 'miss', missHint);
        setHint(missHint);
      }
      // Otherwise: free tap far from any beat — just the sound, no penalty.
    },
    [phase, tune, notes, pads, beatTimeOf, recordJudgment, later, finishTune]
  );

  const playAgain = useCallback(() => {
    setTotal(emptyScore());
    setTunesDone([]);
    setStarsEarned(0);
    setTune(null);
    setPhase('pick');
  }, []);

  const judgedCount = Object.keys(judged).length;
  const totalNotes = notes.length;

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'pick' && (
        <div className="w-full max-w-3xl">
          <h1 className="animate-kid-rise text-center text-3xl font-black text-kid-ink-900 md:text-5xl">
            Rhythm Studio
          </h1>
          <p className="animate-kid-rise mt-2 text-center text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
            Riff&apos;s band is warming up! Pick a tune and tap along with the beat.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            {TUNES.map((t, i) => {
              const done = tunesDone.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => startTune(t)}
                  className="animate-kid-rise rounded-kid-card bg-white/90 px-5 py-4 text-left shadow-xl transition-transform hover:scale-[1.03] active:scale-95"
                  style={{ animationDelay: `${0.15 + i * 0.07}s` }}
                  aria-label={`Play ${t.title}, level ${t.level}${done ? ', completed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-kid-grape-400 text-white">
                      {done ? (
                        <CheckIcon className="h-6 w-6" />
                      ) : (
                        <MusicNoteIcon className="h-6 w-6" />
                      )}
                    </span>
                    <span>
                      <span className="block text-xl font-black text-kid-ink-900">{t.title}</span>
                      <span className="block text-sm font-bold text-kid-ink-700">Level {t.level}</span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-kid-ink-700">{t.intro}</p>
                </button>
              );
            })}
          </div>
          {tunesDone.length > 0 && tunesDone.length < TUNES.length && (
            <p className="mt-4 text-center text-base font-bold text-kid-ink-700">
              {tunesDone.length} of {TUNES.length} tunes played. Keep grooving!
            </p>
          )}
        </div>
      )}

      {(phase === 'countin' || phase === 'play' || phase === 'echo-call' || phase === 'echo-response') && tune && (
        <div className="flex w-full max-w-4xl flex-col items-center">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="rounded-full bg-white px-4 py-2 shadow-lg">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">{tune.title}</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Riff</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="rounded-full bg-white px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg md:text-lg"
                aria-live="polite"
              >
                Combo x{live.combo}
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg md:text-lg">
                {judgedCount} / {totalNotes}
              </div>
            </div>
          </div>

          {phase === 'countin' && (
            <div className="flex min-h-64 flex-col items-center justify-center">
              <p className="text-xl font-black text-kid-ink-900">Get ready...</p>
              <p key={countIn} className="animate-kid-pop-in mt-2 text-7xl font-black text-kid-grape-500 md:text-8xl" aria-live="polite">
                {countIn}
              </p>
            </div>
          )}

          {phase === 'echo-call' && (
            <div className="flex min-h-64 flex-col items-center justify-center">
              <p className="text-2xl font-black text-kid-ink-900">Listen to Riff...</p>
              <p className="mt-2 text-lg font-bold text-kid-ink-700">Watch the pads light up, then copy the rhythm!</p>
            </div>
          )}

          {(phase === 'play' || phase === 'echo-response') && (
            <>
              {!reducedMotion ? (
                <div className="relative mt-4 h-40 w-full overflow-hidden rounded-kid-card bg-kid-ink-900/85 shadow-xl" aria-hidden>
                  {/* hit line */}
                  <div
                    className="absolute inset-y-2 w-1.5 rounded-full bg-white/90"
                    style={{ left: `${HIT_LINE_PCT}%` }}
                  />
                  <div
                    key={beatFlash}
                    className="animate-kid-pop-in absolute inset-y-2 w-10 rounded-full bg-white/20"
                    style={{ left: `calc(${HIT_LINE_PCT}% - 1.25rem)` }}
                  />
                  {notes.map((note) => {
                    if (note.index in judged) return null;
                    const beatAt = startEpochRef.current + note.at;
                    const progress = (nowMs - (beatAt - TRAVEL_MS)) / TRAVEL_MS;
                    if (progress < 0 || progress > 1.15) return null;
                    const left = 100 - Math.min(progress, 1) * (100 - HIT_LINE_PCT);
                    return (
                      <div
                        key={note.index}
                        className={`absolute top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white/80 shadow-lg ${NOTE_STYLES[note.sound]}`}
                        style={{ left: `${left}%` }}
                      >
                        <MusicNoteIcon className="h-7 w-7 text-white" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 flex h-40 w-full flex-col items-center justify-center rounded-kid-card bg-kid-ink-900/85 shadow-xl" aria-hidden>
                  <div
                    key={beatFlash}
                    className="animate-kid-bounce-soft flex h-20 w-20 items-center justify-center rounded-full bg-kid-grape-400"
                  >
                    <MusicNoteIcon className="h-10 w-10 text-white" />
                  </div>
                  <p className="mt-2 text-sm font-bold text-white/80">Tap when the beat lights up!</p>
                </div>
              )}

              <div aria-live="polite" className="sr-only">
                {popup ? popup.text : ''}
              </div>
              <div className="pointer-events-none relative flex h-10 items-center justify-center" aria-hidden>
                {popup && (
                  <span key={popup.key} className={`animate-kid-rise text-2xl font-black md:text-3xl ${JUDGMENT_STYLES[popup.kind]}`}>
                    {popup.text}
                  </span>
                )}
              </div>
              {hint && (
                <p className="mb-1 text-center text-base font-bold text-kid-ink-700" role="status">
                  {hint}
                </p>
              )}
              {phase === 'echo-response' && (
                <button
                  type="button"
                  onClick={replayEchoCall}
                  className="mb-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-kid-ink-700 shadow transition-transform active:scale-95"
                >
                  Hear it again
                </button>
              )}
            </>
          )}

          {/* drum pads */}
          <div className="mt-2 flex flex-wrap items-end justify-center gap-4 md:gap-6" role="group" aria-label="Drum pads">
            {pads.map((pad) => {
              const flashing = flashPad === pad.key;
              return (
                <button
                  key={pad.key}
                  type="button"
                  onClick={() => handlePadTap(pad)}
                  disabled={phase === 'countin' || phase === 'echo-call'}
                  aria-label={`Tap the ${pad.label}`}
                  className={`flex h-24 w-24 flex-col items-center justify-center rounded-full border-b-8 shadow-xl transition-transform active:scale-90 md:h-32 md:w-32 ${PAD_STYLES[pad.sound]} ${
                    flashing ? 'scale-110 ring-8 ring-white' : 'hover:scale-105'
                  } disabled:cursor-default disabled:opacity-60`}
                >
                  <MusicNoteIcon className="h-10 w-10 text-white md:h-14 md:w-14" />
                  <span className="mt-1 text-sm font-black text-white md:text-base">{pad.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-sm font-bold text-kid-ink-700">
            {tune.mode === 'echo'
              ? phase === 'echo-response'
                ? `Your turn! Tap the pads in order. (${echoPtr} of ${notes.length})`
                : 'Riff is playing...'
              : 'Tap the matching pad as each beat crosses the white line!'}
          </p>
        </div>
      )}

      <AnswerFeedbackPanel feedback={session.feedback} />

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname ?? 'friend'}
          title={`Rock star, ${nickname ?? 'friend'}!`}
          message={`You played all 4 tunes with ${finalAccuracy}% accuracy and a best combo of x${finalCombo}!`}
          stickerId="beat-master"
          onPlayAgain={playAgain}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
