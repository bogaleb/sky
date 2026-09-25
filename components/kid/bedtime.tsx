'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TrophyEvent } from '@/lib/kid/trophies';
import { playSfx, speakAs, stopSpeaking, unlockAudio } from '@/lib/kid/audio';
import { useGameSession } from './game-shell';
import { AVATARS } from '@/components/avatars';
import Storybook from './storybook';
import Songbook from './songbook';
import {
  BEDTIME_STARS,
  BREATHE_CYCLES,
  BREATHE_HOLD_MS,
  BREATHE_IN_MS,
  BREATHE_OUT_MS,
  STAR_GAZER_STICKER,
  SWEET_DREAMS_STICKER,
  calmSongs,
  calmStories,
} from '@/lib/kid/bedtime';
import type { Story } from '@/lib/kid/stories';
import type { Song } from '@/lib/kid/songs';

/** Bedtime trophy event fires best-effort; the def lands in Wave 3 integration. */
const BEDTIME_TROPHY_EVENT: TrophyEvent = 'bedtime_done';

type Phase = 'doors' | 'stories' | 'songs' | 'breathe' | 'sweet';
type BreatheStage = 'inhale' | 'hold' | 'exhale';

/* ------------------------------------------------------------------ */
/* Night sky backdrop: twinkling stars, crescent moon, fireflies       */
/* ------------------------------------------------------------------ */

function NightSky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        left: (i * 37.7 + 11) % 100,
        top: (i * 53.3 + 7) % 72,
        size: 7 + ((i * 13) % 13),
        delay: ((i * 0.37) % 1.8).toFixed(2),
      })),
    [],
  );
  const fireflies = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        id: i,
        left: 8 + ((i * 41.3) % 84),
        top: 62 + ((i * 17.7) % 30),
        delay: ((i * 1.3) % 6).toFixed(1),
        duration: (7 + ((i * 2.1) % 5)).toFixed(1),
      })),
    [],
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* twinkling stars */}
      {stars.map((s) => (
        <svg
          key={s.id}
          viewBox="0 0 24 24"
          className="bedtime-twinkle animate-kid-sparkle absolute"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        >
          <path
            d="M12 2 Q12.8 10 22 12 Q12.8 14 12 22 Q11.2 14 2 12 Q11.2 10 12 2 Z"
            fill="#FFF6C9"
            opacity={0.85}
          />
        </svg>
      ))}
      {/* crescent moon */}
      <svg
        viewBox="0 0 100 100"
        className="absolute right-[6%] top-[7%] h-20 w-20 opacity-95 md:h-28 md:w-28"
      >
        <defs>
          <radialGradient id="bedtime-moon" cx="0.4" cy="0.4" r="0.9">
            <stop offset="0%" stopColor="#FFF8DC" />
            <stop offset="100%" stopColor="#F5D76E" />
          </radialGradient>
        </defs>
        <path d="M62 8 A38 38 0 1 0 62 92 A30 30 0 1 1 62 8 Z" fill="url(#bedtime-moon)" />
        <circle cx="70" cy="30" r="4" fill="#E8C95A" opacity="0.5" />
        <circle cx="62" cy="62" r="5" fill="#E8C95A" opacity="0.4" />
      </svg>
      {/* drifting fireflies */}
      {fireflies.map((f) => (
        <span
          key={f.id}
          className="bedtime-firefly absolute rounded-full"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            width: 10,
            height: 10,
            background: 'radial-gradient(circle, #FFF9B0 0%, #FFE45C 45%, transparent 70%)',
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        />
      ))}
      <style>{`
        .bedtime-firefly { animation: bedtime-drift 9s ease-in-out infinite alternate; }
        @keyframes bedtime-drift {
          0% { transform: translate(0, 0); opacity: 0.35; }
          50% { opacity: 1; }
          100% { transform: translate(46px, -38px); opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bedtime-twinkle, .bedtime-firefly { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Door icons (inline SVG, no emoji)                                    */
/* ------------------------------------------------------------------ */

function StoryDoorIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 md:h-20 md:w-20" aria-hidden="true">
      <path d="M50 6 A20 20 0 1 0 50 46 A16 16 0 1 1 50 6 Z" fill="#FFE9A8" />
      <path d="M10 44 q11 -7 22 0 q11 7 22 0 v12 q-11 7 -22 0 q-11 -7 -22 0 Z" fill="#B983FF" />
      <path d="M10 44 q11 -7 22 0 v12 q-11 -7 -22 0 Z" fill="#9B5DE5" />
      <line x1="32" y1="40" x2="32" y2="56" stroke="#6D3FC0" strokeWidth="2.5" />
    </svg>
  );
}

function SongDoorIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 md:h-20 md:w-20" aria-hidden="true" fill="#8FE3C9">
      <path d="M24 44a7 7 0 1 1-4.9-8.4V16.5l24-5.8V36a7 7 0 1 1-4.9-8.4V17.4L24 20.7V44z" />
      <path d="M48 50a5 5 0 1 1-3.5-6V30.8l12-2.9V40a5 5 0 1 1-3.5-6V32l-5 1.2V50z" opacity="0.65" />
    </svg>
  );
}

function BreatheDoorIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 md:h-20 md:w-20" aria-hidden="true">
      <path
        d="M32 4 Q33.5 24 60 32 Q33.5 40 32 60 Q30.5 40 4 32 Q30.5 24 32 4 Z"
        fill="#FFF6C9"
      />
      <circle cx="32" cy="32" r="7" fill="#FFD93C" />
    </svg>
  );
}

function MoonIcon({ className = 'h-24 w-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M62 8 A38 38 0 1 0 62 92 A30 30 0 1 1 62 8 Z" fill="#FFE9A8" />
      <g stroke="#8B6B1E" strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M 40 52 q 5 5 10 0" />
        <path d="M 38 66 q 12 9 24 0" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Bedtime                                                             */
/* ------------------------------------------------------------------ */

export default function Bedtime({
  childId,
  nickname = 'friend',
  onExit,
}: {
  childId: string;
  nickname?: string;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('doors');
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [breath, setBreath] = useState<{ cycle: number; stage: BreatheStage } | null>(null);
  const [breathing, setBreathing] = useState(false);
  const doneRef = useRef(false);
  const finaleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const session = useGameSession({
    childId,
    trophyEvent: BEDTIME_TROPHY_EVENT,
    milestone: 'bedtime_complete',
  });

  const stories = useMemo(() => calmStories(), []);
  const songs = useMemo(() => calmSongs(), []);
  const TunoAvatar = AVATARS.tuno.Component;

  // Luna's soft welcome when bedtime opens.
  useEffect(() => {
    unlockAudio();
    const t = window.setTimeout(() => {
      speakAs('luna', `Shh... it's bedtime, ${nickname}. Pick something cozy.`);
    }, 600);
    return () => {
      window.clearTimeout(t);
      stopSpeaking();
    };
  }, [nickname]);

  // Tidy up any pending finale timer on unmount.
  useEffect(() => {
    return () => {
      if (finaleTimer.current) window.clearTimeout(finaleTimer.current);
    };
  }, []);

  const close = useCallback(() => {
    stopSpeaking();
    if (finaleTimer.current) window.clearTimeout(finaleTimer.current);
    onExit();
  }, [onExit]);

  const goDoors = useCallback(() => {
    stopSpeaking();
    if (finaleTimer.current) window.clearTimeout(finaleTimer.current);
    setBreath(null);
    setBreathing(false);
    doneRef.current = false;
    setPhase('doors');
  }, []);

  /** Every finished door ends the same gentle way: stars, stickers, milestone. */
  const completeBedtime = useCallback(
    async (door: 'story' | 'song' | 'breathe') => {
      if (doneRef.current) return;
      doneRef.current = true;
      stopSpeaking();
      playSfx('star');
      const stickers = [SWEET_DREAMS_STICKER];
      if (door === 'breathe') stickers.push(STAR_GAZER_STICKER);
      await session.complete({ stars: BEDTIME_STARS, stickerIds: stickers, extraMetadata: { door } });
      setActiveStory(null);
      setActiveSong(null);
      setBreath(null);
      setBreathing(false);
      setPhase('sweet');
    },
    [childId, session],
  );

  /* ---------------- Star-breathing state machine ---------------- */

  const startBreathing = useCallback(() => {
    unlockAudio();
    playSfx('pop');
    setBreathing(true);
    setBreath({ cycle: 0, stage: 'inhale' });
    speakAs('tuno', 'Breathe in... two... three... four...');
  }, []);

  useEffect(() => {
    if (!breathing || !breath) return;
    const durations: Record<BreatheStage, number> = {
      inhale: BREATHE_IN_MS,
      hold: BREATHE_HOLD_MS,
      exhale: BREATHE_OUT_MS,
    };
    const t = window.setTimeout(() => {
      if (breath.stage === 'inhale') {
        setBreath({ cycle: breath.cycle, stage: 'hold' });
        speakAs('tuno', 'Hold it... soft and still...');
      } else if (breath.stage === 'hold') {
        setBreath({ cycle: breath.cycle, stage: 'exhale' });
        speakAs('tuno', 'Breathe out... two... three... four...');
      } else if (breath.cycle + 1 >= BREATHE_CYCLES) {
        setBreathing(false);
        speakAs('tuno', 'All done. You are calm and sleepy, like the little stars.');
        finaleTimer.current = setTimeout(() => {
          void completeBedtime('breathe');
        }, 3600);
      } else {
        setBreath({ cycle: breath.cycle + 1, stage: 'inhale' });
        speakAs('tuno', 'Breathe in... two... three... four...');
      }
    }, durations[breath.stage]);
    return () => window.clearTimeout(t);
  }, [breathing, breath, completeBedtime]);

  const breathScale = !breath ? 1 : breath.stage === 'exhale' ? 1 : 1.35;
  const stageLabel =
    !breath || !breathing
      ? ''
      : breath.stage === 'inhale'
        ? 'Breathe in…'
        : breath.stage === 'hold'
          ? 'Hold…'
          : 'Breathe out…';

  const openDoor = (door: Phase) => {
    unlockAudio();
    playSfx('pop');
    if (door === 'stories') {
      speakAs('luna', 'Choose a cozy story, little one.');
      setPhase('stories');
    } else if (door === 'songs') {
      speakAs('riff', 'Time for sleepy songs. Soft and slow.');
      setPhase('songs');
    } else if (door === 'breathe') {
      setPhase('breathe');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-to-b from-kid-night-900 via-kid-night-700 to-kid-night-600"
      role="dialog"
      aria-modal="true"
      aria-label="Bedtime"
    >
      <NightSky />

      {/* Header */}
      <div className="relative flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <MoonIcon className="h-10 w-10 md:h-12 md:w-12" />
          <h1 className="text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] md:text-4xl">
            Bedtime
          </h1>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Leave bedtime"
          className="rounded-full bg-white/15 px-6 py-3 text-lg font-black text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/25 active:scale-95"
        >
          Close
        </button>
      </div>

      {/* ------------------------------ Doors ------------------------------ */}
      {phase === 'doors' && (
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-10">
          <p className="animate-kid-rise text-center text-xl font-bold text-kid-sun-300 md:text-2xl">
            Shh… the sky is getting sleepy.
          </p>
          <p className="animate-kid-rise mt-1 text-center text-base font-bold text-white/70" style={{ animationDelay: '0.1s' }}>
            Pick one cozy thing, {nickname}.
          </p>
          <div className="mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => openDoor('stories')}
              className="animate-kid-rise group flex min-h-[11rem] flex-col items-center justify-center gap-2 rounded-kid-card border-2 border-white/20 bg-white/10 px-6 py-8 backdrop-blur transition-all hover:scale-[1.03] hover:bg-white/15 active:scale-95"
              style={{ animationDelay: '0.15s' }}
            >
              <StoryDoorIcon />
              <span className="text-2xl font-black text-white">Cozy Story</span>
              <span className="text-sm font-bold text-white/70">4 gentle tales with Luna</span>
            </button>
            <button
              type="button"
              onClick={() => openDoor('songs')}
              className="animate-kid-rise group flex min-h-[11rem] flex-col items-center justify-center gap-2 rounded-kid-card border-2 border-white/20 bg-white/10 px-6 py-8 backdrop-blur transition-all hover:scale-[1.03] hover:bg-white/15 active:scale-95"
              style={{ animationDelay: '0.25s' }}
            >
              <SongDoorIcon />
              <span className="text-2xl font-black text-white">Sleepy Songs</span>
              <span className="text-sm font-bold text-white/70">soft songs with Riff</span>
            </button>
            <button
              type="button"
              onClick={() => openDoor('breathe')}
              className="animate-kid-rise group flex min-h-[11rem] flex-col items-center justify-center gap-2 rounded-kid-card border-2 border-white/20 bg-white/10 px-6 py-8 backdrop-blur transition-all hover:scale-[1.03] hover:bg-white/15 active:scale-95"
              style={{ animationDelay: '0.35s' }}
            >
              <BreatheDoorIcon />
              <span className="text-2xl font-black text-white">Breathe with Tuno</span>
              <span className="text-sm font-bold text-white/70">4 slow star breaths</span>
            </button>
          </div>
        </div>
      )}

      {/* --------------------------- Story picker --------------------------- */}
      {phase === 'stories' && (
        <div className="relative flex flex-1 flex-col items-center px-4 pb-10">
          <BackToDoors onBack={goDoors} />
          <h2 className="mt-2 text-center text-2xl font-black text-white md:text-3xl">Pick a cozy story</h2>
          <div className="mt-6 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
            {stories.map((story, i) => (
              <button
                key={story.id}
                type="button"
                onClick={() => {
                  playSfx('pop');
                  setActiveStory(story);
                }}
                className="animate-kid-rise flex min-h-[7rem] items-center gap-4 rounded-kid-card border-2 border-white/20 bg-white/10 px-5 py-5 text-left backdrop-blur transition-all hover:scale-[1.02] hover:bg-white/15 active:scale-95"
                style={{ animationDelay: `${i * 0.08}s` }}
                aria-label={`Read ${story.title}`}
              >
                <MoonIcon className="h-12 w-12 shrink-0" />
                <span>
                  <span className="block text-xl font-black text-white">{story.title}</span>
                  <span className="mt-0.5 block text-sm font-bold text-white/70">
                    {story.pages.length} pages · read by Luna
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------- Song picker ---------------------------- */}
      {phase === 'songs' && (
        <div className="relative flex flex-1 flex-col items-center px-4 pb-10">
          <BackToDoors onBack={goDoors} />
          <h2 className="mt-2 text-center text-2xl font-black text-white md:text-3xl">Pick a sleepy song</h2>
          <div className="mt-6 flex w-full max-w-2xl flex-col gap-4">
            {songs.map((song, i) => (
              <button
                key={song.id}
                type="button"
                onClick={() => {
                  playSfx('pop');
                  setActiveSong(song);
                }}
                className="animate-kid-rise flex min-h-[6.5rem] items-center gap-4 rounded-kid-card border-2 border-white/20 bg-white/10 px-5 py-5 text-left backdrop-blur transition-all hover:scale-[1.02] hover:bg-white/15 active:scale-95"
                style={{ animationDelay: `${i * 0.08}s` }}
                aria-label={`Sing ${song.title}`}
              >
                <svg viewBox="0 0 24 24" className="h-12 w-12 shrink-0 text-kid-mint-400" fill="currentColor" aria-hidden="true">
                  <path d="M9 18.5a3 3 0 1 1-2-2.83V6.4l10-2.4v11.37a3 3 0 1 1-2-2.83V5.1L9 6.9v11.6z" />
                </svg>
                <span>
                  <span className="block text-xl font-black text-white">{song.title}</span>
                  <span className="mt-0.5 block text-sm font-bold text-white/70">sung softly by Riff</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------ Breathing ------------------------------ */}
      {phase === 'breathe' && (
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-10">
          <BackToDoors onBack={goDoors} />
          {!breath ? (
            <div className="animate-kid-pop-in flex max-w-xl flex-col items-center rounded-kid-card border-2 border-white/20 bg-white/10 px-8 py-10 text-center backdrop-blur">
              <TunoAvatar className="h-32 w-32 drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] md:h-40 md:w-40" />
              <h2 className="mt-4 text-3xl font-black text-white">Breathe with Tuno</h2>
              <p className="mt-2 text-lg font-bold text-white/75">
                We will take {BREATHE_CYCLES} slow star breaths together. Watch Tuno&apos;s star
                grow as you breathe in, and shrink as you breathe out.
              </p>
              <button
                type="button"
                onClick={startBreathing}
                className="mt-6 rounded-kid-pill bg-kid-mint-500 px-12 py-5 text-2xl font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Start breathing
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* cycle stars */}
              <div className="mb-6 flex items-center gap-3" aria-label={`Breath ${Math.min(breath.cycle + 1, BREATHE_CYCLES)} of ${BREATHE_CYCLES}`}>
                {Array.from({ length: BREATHE_CYCLES }, (_, i) => (
                  <svg key={i} viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                    <path
                      d="M12 2 Q12.8 10 22 12 Q12.8 14 12 22 Q11.2 14 2 12 Q11.2 10 12 2 Z"
                      fill={i < breath.cycle ? '#FFD93C' : 'none'}
                      stroke="#FFE9A8"
                      strokeWidth={2}
                      opacity={i <= breath.cycle ? 1 : 0.45}
                    />
                  </svg>
                ))}
              </div>
              {/* Tuno's breathing star */}
              <div
                className="relative flex items-center justify-center rounded-full"
                style={{
                  width: 280,
                  height: 280,
                  transform: `scale(${breathScale})`,
                  transition: `transform ${BREATHE_IN_MS}ms ease-in-out`,
                  background: 'radial-gradient(circle, rgba(255,246,201,0.9) 0%, rgba(255,217,60,0.55) 42%, rgba(255,217,60,0.12) 68%, transparent 72%)',
                }}
              >
                <TunoAvatar className="h-40 w-40 drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] md:h-48 md:w-48" />
              </div>
              <p aria-live="polite" className="mt-8 text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] md:text-5xl">
                {stageLabel}
              </p>
              <p className="mt-2 text-lg font-bold text-white/70">
                Slow star breath {Math.min(breath.cycle + 1, BREATHE_CYCLES)} of {BREATHE_CYCLES}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------- Sweet dreams ---------------------------- */}
      {phase === 'sweet' && (
        <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-10">
          <div className="animate-kid-pop-in flex max-w-xl flex-col items-center rounded-kid-card border-2 border-white/25 bg-white/10 px-8 py-10 text-center shadow-2xl backdrop-blur">
            <MoonIcon className="h-28 w-28 md:h-36 md:w-36" />
            <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">
              Sweet dreams, {nickname}!
            </h2>
            <p className="mt-3 text-xl font-bold text-kid-sun-300">
              You earned {BEDTIME_STARS} sleepy stars.
            </p>
            <p className="mt-1 text-base font-bold text-white/70">
              The sky is proud of you. Rest well, little explorer.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={goDoors}
                className="rounded-kid-pill border-b-4 border-white/30 bg-white/15 px-8 py-4 text-xl font-black text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/25 active:scale-95"
              >
                More bedtime
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-kid-pill border-b-4 border-kid-mint-600 bg-kid-mint-500 px-8 py-4 text-xl font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Goodnight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storybook / Songbook overlays (fixed z-50 modals) */}
      {activeStory && (
        <Storybook
          story={activeStory}
          onDone={() => setActiveStory(null)}
          onFinish={() => void completeBedtime('story')}
        />
      )}
      {activeSong && (
        <Songbook
          song={activeSong}
          onDone={() => setActiveSong(null)}
          onFinish={() => void completeBedtime('song')}
        />
      )}
    </div>
  );
}

function BackToDoors({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex w-full max-w-4xl justify-start">
      <button
        type="button"
        onClick={() => {
          playSfx('whoosh');
          onBack();
        }}
        className="rounded-full bg-white/15 px-6 py-3 text-lg font-black text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/25 active:scale-95"
        aria-label="Back to bedtime choices"
      >
        ← Back
      </button>
    </div>
  );
}
