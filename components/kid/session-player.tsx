'use client';

import { useCallback, useRef, useState } from 'react';
import type { AttemptResult, PlannedStep, SessionChild } from '@/lib/kid/types';
import { submitActivityAttempt, logLearningEvent } from '@/app/actions/learning';
import { playSfx, speak, unlockAudio } from '@/lib/kid/audio';
import KidShell from './kid-shell';
import ActivityStage from './activity-stage';
import HostCharacter, { type CharacterMood } from './host-character';
import { ConfettiBurst } from './celebration';
import { AVATARS } from '@/components/avatars';

export interface SessionPlayerProps {
  child: SessionChild;
  steps: PlannedStep[];
  sessionId: string | null;
  onExit: () => void;
  onReplay: () => void;
}

type Phase = 'intro' | 'playing' | 'complete';

function VideoSpot({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <video
      src={src}
      autoPlay
      muted
      playsInline
      onError={() => setFailed(true)}
      aria-label={label}
      className="h-full w-full object-cover"
    />
  );
}

/** Welcome intro: video moment + the child's avatar ready to fly. */
function Intro({ child, onStart }: { child: SessionChild; onStart: () => void }) {
  const Avatar = (AVATARS[child.avatarId] ?? AVATARS.curio).Component;
  return (
    <div className="flex w-full max-w-3xl flex-col items-center text-center">
      <div className="animate-kid-rise w-full overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]">
        <div className="relative aspect-video w-full bg-gradient-to-b from-kid-sky-300 to-kid-sky-400">
          <VideoSpot src="/videos/welcome.mp4" label="Welcome to the sky" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-kid-bob">
              <Avatar className="h-36 w-36 drop-shadow-[0_14px_24px_rgba(23,50,79,0.35)] md:h-44 md:w-44" />
            </div>
          </div>
        </div>
      </div>
      <h1 className="animate-kid-rise mt-6 text-4xl font-black text-kid-ink-900 md:text-5xl" style={{ animationDelay: '0.15s' }}>
        Ready to fly, {child.nickname}?
      </h1>
      <p className="animate-kid-rise mt-2 max-w-md text-xl font-bold text-kid-ink-700" style={{ animationDelay: '0.25s' }}>
        Six sky adventures are waiting. Tap, count, trace and say — let&apos;s go!
      </p>
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          playSfx('fanfare');
          onStart();
        }}
        className="animate-kid-rise mt-8 rounded-kid-card border-b-8 border-kid-coral-600 bg-kid-coral-500 px-14 py-6 text-3xl font-black text-white shadow-[0_18px_44px_rgba(255,107,107,0.5)] transition-all hover:scale-105 hover:brightness-105 active:scale-95"
        style={{ animationDelay: '0.35s' }}
      >
        Let&apos;s fly!
      </button>
    </div>
  );
}

/** Session complete: celebration video, stars, points, replay/exit. */
function Complete({
  child,
  stars,
  points,
  onReplay,
  onExit,
}: {
  child: SessionChild;
  stars: number;
  points: number;
  onReplay: () => void;
  onExit: () => void;
}) {
  const Avatar = (AVATARS[child.avatarId] ?? AVATARS.curio).Component;
  return (
    <div className="flex w-full max-w-3xl flex-col items-center text-center">
      <ConfettiBurst count={90} />
      <div className="animate-kid-rise w-full overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]">
        <div className="relative aspect-video w-full bg-gradient-to-b from-kid-grape-400 via-kid-berry-400 to-kid-sun-300">
          <VideoSpot src="/videos/celebrate.mp4" label="Celebration" />
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="animate-kid-pop-in" style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
                <svg width="72" height="72" viewBox="0 0 64 64">
                  <path
                    d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
                    fill={i < stars ? '#FFC93C' : 'rgba(255,255,255,0.5)'}
                    stroke={i < stars ? '#E09E00' : 'rgba(255,255,255,0.9)'}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="animate-kid-bob mt-4">
        <Avatar className="h-28 w-28 drop-shadow-[0_12px_20px_rgba(23,50,79,0.3)]" />
      </div>
      <h1 className="mt-2 text-4xl font-black text-kid-ink-900 md:text-5xl">
        Amazing flying, {child.nickname}!
      </h1>
      <p className="mt-2 text-2xl font-extrabold text-kid-ink-700">
        You earned <span className="text-kid-sun-500">{points} points</span> today!
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => {
            playSfx('whoosh');
            onReplay();
          }}
          className="rounded-kid-card border-b-8 border-kid-mint-600 bg-kid-mint-500 px-10 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
        >
          Play again!
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-kid-card border-b-8 border-white/60 bg-white/85 px-10 py-5 text-2xl font-black text-kid-ink-700 shadow-[0_14px_30px_rgba(23,50,79,0.2)] backdrop-blur transition-all hover:scale-105 active:scale-95"
        >
          Done for now
        </button>
      </div>
    </div>
  );
}

/**
 * The session state machine: intro -> one activity at a time -> complete.
 * Owns points, star progress, character mood, and server submission.
 */
export default function SessionPlayer({ child, steps, sessionId, onExit, onReplay }: SessionPlayerProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [stars, setStars] = useState(0);
  const [mood, setMood] = useState<CharacterMood>('idle');
  const resultsRef = useRef<AttemptResult[]>([]);

  const step = steps[index];

  const handleSubmit = useCallback(
    async (activityId: string, answer: unknown, latencyMs: number): Promise<AttemptResult> => {
      const result = await submitActivityAttempt(child.id, activityId, answer, latencyMs, sessionId ?? undefined);
      return result;
    },
    [child.id, sessionId]
  );

  const handleComplete = useCallback(
    (result: AttemptResult) => {
      resultsRef.current.push(result);
      if (result.correct) {
        setPoints((p) => p + result.pointsEarned);
        setStars((s) => s + 1);
        if (result.leveledUp) {
          setTimeout(() => playSfx('levelup'), 900);
        }
      }
      if (index + 1 < steps.length) {
        setMood('idle');
        setIndex((i) => i + 1);
        playSfx('whoosh');
      } else {
        setPhase('complete');
        playSfx('fanfare');
        speak(`Amazing flying, ${child.nickname}! You earned ${resultsRef.current.filter((r) => r.correct).length} stars!`);
        void logLearningEvent(child.id, 'milestone', {
          sessionId: sessionId ?? undefined,
          metadata: {
            kind: 'session_complete',
            stars: resultsRef.current.filter((r) => r.correct).length,
            points: resultsRef.current.reduce((s, r) => s + r.pointsEarned, 0),
          },
        }).catch(() => {});
      }
    },
    [child.id, child.nickname, index, steps.length, sessionId]
  );

  const start = () => {
    setPhase('playing');
    const first = steps[0];
    if (first) {
      void logLearningEvent(child.id, 'milestone', {
        sessionId: sessionId ?? undefined,
        metadata: { kind: 'session_start', planned: steps.length },
      }).catch(() => {});
    }
  };

  return (
    <KidShell
      doneCount={stars}
      totalSteps={steps.length}
      points={points}
      onExit={phase === 'playing' ? onExit : undefined}
    >
      {phase === 'intro' && <Intro child={child} onStart={start} />}
      {phase === 'playing' && step && (
        <div key={step.activityId} className="flex w-full flex-col items-center">
          <ActivityStage
            step={step}
            onSubmit={handleSubmit}
            onComplete={handleComplete}
            onMood={setMood}
          />
          {/* Mood mirror for small screens where the character hides */}
          <div className="mt-4 sm:hidden">
            <HostCharacter characterId={step.hostCharacter} mood={mood} size={84} />
          </div>
        </div>
      )}
      {phase === 'complete' && (
        <Complete
          child={child}
          stars={Math.min(3, Math.round((stars / Math.max(steps.length, 1)) * 3))}
          points={points}
          onReplay={onReplay}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
