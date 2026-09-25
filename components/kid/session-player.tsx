'use client';

import { useCallback, useRef, useState } from 'react';
import type { AttemptResult, PlannedStep, SessionChild } from '@/lib/kid/types';
import { getSessionPlan, submitActivityAttempt, logLearningEvent } from '@/app/actions/learning';
import { toPlannedStep, type ServerPlanItem } from '@/lib/kid/types';
import { playSfx, speak, speakAs, unlockAudio } from '@/lib/kid/audio';
import { getCharacter, charLine } from '@/lib/kid/characters';
import { getIsland, type Island } from '@/lib/kid/islands';
import KidShell from './kid-shell';
import ActivityStage from './activity-stage';
import HostCharacter, { type CharacterMood } from './host-character';
import SkyMap from './sky-map';
import VideoSpot from './video-spot';
import { ConfettiBurst } from './celebration';
import { AVATARS } from '@/components/avatars';

export interface SessionPlayerProps {
  child: SessionChild;
  steps: PlannedStep[];
  sessionId: string | null;
  onExit: () => void;
  onReplay: () => void;
}

type Phase = 'intro' | 'map' | 'islandIntro' | 'playing' | 'complete' | 'goodbye';

/** Welcome intro: Captain Curio's video greeting (with sound!) + start. */
function Intro({ child, onStart }: { child: SessionChild; onStart: () => void }) {
  const Avatar = (AVATARS[child.avatarId] ?? AVATARS.curio).Component;
  return (
    <div className="flex w-full max-w-3xl flex-col items-center text-center">
      <div className="animate-kid-rise w-full overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]">
        <div className="relative aspect-video w-full bg-gradient-to-b from-kid-sky-300 to-kid-sky-400">
          <VideoSpot
            src="/videos/welcome.mp4"
            label="Captain Curio welcomes you to the sky"
            characterId="curio"
            voiceover={`Ahoy, ${child.nickname}! I'm Captain Curio! Welcome to the Sky! Nine magical islands are waiting for you. Pick one, and let's learn together!`}
            caption={`Ahoy, ${child.nickname}! Welcome to the Sky! Pick an island and let's learn together!`}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
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
        Nine islands are waiting — reading, math, music, and more. Let&apos;s go!
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

/** Island intro: the host character's video welcome before playing. */
function IslandIntro({
  island,
  child,
  onStart,
}: {
  island: Island;
  child: SessionChild;
  onStart: () => void;
}) {
  const host = getCharacter(island.hostCharacter);
  return (
    <div className="flex w-full max-w-3xl flex-col items-center text-center">
      <div className="animate-kid-rise w-full overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]">
        <div className="relative aspect-video w-full" style={{ background: `linear-gradient(to bottom, ${island.sky[0]}, ${island.sky[1]})` }}>
          <VideoSpot
            src={`/videos/${island.hostCharacter}-intro.mp4`}
            label={`${host.name} welcomes you to ${island.islandName}`}
            characterId={island.hostCharacter}
            voiceover={host.greeting}
            caption={host.greeting}
          />
        </div>
      </div>
      <h1 className="animate-kid-rise mt-6 text-4xl font-black text-kid-ink-900 md:text-5xl" style={{ animationDelay: '0.15s' }}>
        {island.islandName}
      </h1>
      <p className="animate-kid-rise mt-2 max-w-md text-xl font-bold text-kid-ink-700" style={{ animationDelay: '0.25s' }}>
        {host.name} has {child.nickname}&apos;s {island.subjectName.toLowerCase()} games ready!
      </p>
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          playSfx('whoosh');
          speakAs(island.hostCharacter, `Yay! Let's play, ${child.nickname}!`);
          onStart();
        }}
        className="animate-kid-rise mt-8 rounded-kid-card border-b-8 px-14 py-6 text-3xl font-black text-white shadow-[0_18px_44px_rgba(23,50,79,0.35)] transition-all hover:scale-105 hover:brightness-105 active:scale-95"
        style={{ background: island.color, borderColor: 'rgba(0,0,0,0.18)', animationDelay: '0.35s' }}
      >
        Play with {host.name}!
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
          <VideoSpot
            src="/videos/celebrate.mp4"
            label="Celebration"
            characterId="curio"
            voiceover={`Amazing flying, ${child.nickname}! You earned ${points} points! The whole sky is so proud of you!`}
            caption={`Amazing flying, ${child.nickname}! You earned ${points} points!`}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2">
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

/** Goodbye ritual: Captain Curio closes the session warmly. */
function Goodbye({ child, onDone }: { child: SessionChild; onDone: () => void }) {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center text-center">
      <div className="animate-kid-rise w-full overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]">
        <div className="relative aspect-video w-full bg-gradient-to-b from-kid-grape-400 to-kid-sun-300">
          <VideoSpot
            src="/videos/goodbye.mp4"
            label="Captain Curio says goodbye"
            characterId="curio"
            voiceover={`What a wonderful day of learning, ${child.nickname}! I'm so proud of you. Tomorrow, a brand-new island adventure is waiting. Sleep tight, little captain!`}
            caption={`What a wonderful day, ${child.nickname}! Tomorrow brings a brand-new adventure!`}
            onDone={onDone}
          />
        </div>
      </div>
      <h1 className="animate-kid-rise mt-6 text-4xl font-black text-kid-ink-900 md:text-5xl">
        See you tomorrow, {child.nickname}!
      </h1>
      <button
        type="button"
        onClick={onDone}
        className="animate-kid-rise mt-8 rounded-kid-card border-b-8 border-kid-sky-600 bg-kid-sky-500 px-12 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
      >
        Bye-bye!
      </button>
    </div>
  );
}

/**
 * The session state machine:
 * intro -> map -> islandIntro -> playing -> complete -> goodbye.
 * Owns points, star progress, character mood, and server submission.
 */
export default function SessionPlayer({ child, steps, sessionId, onExit, onReplay }: SessionPlayerProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [stars, setStars] = useState(0);
  const [mood, setMood] = useState<CharacterMood>('idle');
  const [island, setIsland] = useState<Island | null>(null);
  const [islandSteps, setIslandSteps] = useState<PlannedStep[] | null>(null);
  const [loadingIsland, setLoadingIsland] = useState(false);
  const [novaComfort, setNovaComfort] = useState(false);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const resultsRef = useRef<AttemptResult[]>([]);

  const activeSteps = islandSteps ?? steps;
  const step = activeSteps[index];

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
        setNovaComfort(false);
        if (result.leveledUp) {
          setTimeout(() => playSfx('levelup'), 900);
        }
        // The host celebrates in their own voice.
        const hostId = step?.hostCharacter ?? 'curio';
        speakAs(hostId, charLine(hostId, 'praise'));
      } else {
        // Nova the peer comforts after mistakes — mistakes are safe here.
        setNovaComfort(true);
        speakAs('nova', charLine('nova', 'encouragement'));
        setTimeout(() => setNovaComfort(false), 6000);
      }
      if (index + 1 < activeSteps.length) {
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
    [child.id, child.nickname, index, activeSteps.length, sessionId, step?.hostCharacter]
  );

  const startIslandSession = useCallback(
    async (selected: Island | null) => {
      // null = "Surprise me": use the adaptive mix already planned.
      if (!selected) {
        setIsland(null);
        setIslandSteps(null);
        setIndex(0);
        setPhase('playing');
        return;
      }
      setLoadingIsland(true);
      try {
        const res = await getSessionPlan(child.id, { subjectCode: selected.subjectCode, sessionLength: 6 });
        const next = (res.plan as unknown as ServerPlanItem[]).map(toPlannedStep);
        if (next.length === 0) throw new Error('empty plan');
        setIsland(selected);
        setIslandSteps(next);
        setIndex(0);
        setPoints(0);
        setStars(0);
        resultsRef.current = [];
        setPhase('islandIntro');
      } catch {
        // Fall back to the adaptive mix if the island plan fails.
        setIsland(selected);
        setIslandSteps(null);
        setIndex(0);
        setPhase('islandIntro');
      } finally {
        setLoadingIsland(false);
      }
    },
    [child.id]
  );

  const beginPlaying = () => {
    setPhase('playing');
    const first = activeSteps[0];
    if (first) {
      void logLearningEvent(child.id, 'milestone', {
        sessionId: sessionId ?? undefined,
        metadata: {
          kind: 'session_start',
          planned: activeSteps.length,
          island: island?.subjectCode ?? 'surprise',
        },
      }).catch(() => {});
    }
  };

  const backToMap = () => {
    setPhase('map');
    setIndex(0);
    setIsland(null);
    setIslandSteps(null);
    setPoints(0);
    setStars(0);
    resultsRef.current = [];
  };

  return (
    <KidShell
      doneCount={stars}
      totalSteps={activeSteps.length}
      points={points}
      onExit={phase === 'playing' || phase === 'map' ? onExit : undefined}
    >
      {loadingIsland && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-sky-300/60 backdrop-blur-sm">
          <div className="animate-kid-bounce-soft rounded-kid-card bg-white px-10 py-6 text-2xl font-black text-kid-ink-900 shadow-2xl">
            Flying to the island…
          </div>
        </div>
      )}
      {phase === 'intro' && <Intro child={child} onStart={() => setPhase('map')} />}
      {phase === 'map' && (
        <SkyMap
          nickname={child.nickname}
          onSelectIsland={(isl) => void startIslandSession(isl)}
          onSurprise={() => void startIslandSession(null)}
        />
      )}
      {phase === 'islandIntro' && island && (
        <IslandIntro island={island} child={child} onStart={beginPlaying} />
      )}
      {phase === 'playing' && step && (
        <div key={step.activityId} className="relative flex w-full flex-col items-center">
          <ActivityStage
            step={step}
            onSubmit={handleSubmit}
            onComplete={handleComplete}
            onMood={setMood}
          />
          {/* Nova the peer pops in to comfort after mistakes */}
          {novaComfort && (
            <div className="animate-kid-pop-in absolute -top-2 right-2 flex items-center gap-2 rounded-kid-card border-4 border-white/70 bg-white/95 px-4 py-2 shadow-xl md:right-8">
              <HostCharacter characterId="nova" mood="oops" size={64} />
              <div className="flex flex-col items-start gap-1">
                <p className="max-w-[180px] text-base font-extrabold text-kid-ink-800">
                  Oops! Let&apos;s try again together!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    setShowTryAgain(true);
                  }}
                  className="rounded-full bg-kid-sun-400 px-4 py-1.5 text-sm font-black text-kid-ink-900 shadow transition-all hover:scale-105 active:scale-95"
                >
                  Watch me try!
                </button>
              </div>
            </div>
          )}
          {/* Nova's try-again encouragement video */}
          {showTryAgain && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/60 p-4 backdrop-blur-sm">
              <div className="animate-kid-pop-in w-full max-w-2xl overflow-hidden rounded-kid-card border-4 border-white/70 shadow-2xl">
                <div className="relative aspect-video w-full bg-kid-sky-300">
                  <VideoSpot
                    src="/videos/nova-try-again.mp4"
                    label="Nova tries again"
                    characterId="nova"
                    voiceover="Watch me! Oops, my tower fell over! That's okay. Mistakes help our brains grow. Let me try again... Yay, I did it! You can try again too!"
                    caption="Oops! My tower fell. That's okay — mistakes help our brains grow. Trying again!"
                    onDone={() => setShowTryAgain(false)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowTryAgain(false)}
                  className="w-full bg-white px-6 py-4 text-xl font-black text-kid-ink-800 transition-colors hover:bg-kid-sky-100"
                >
                  Back to playing
                </button>
              </div>
            </div>
          )}
          {/* Mood mirror for small screens where the character hides */}
          <div className="mt-4 sm:hidden">
            <HostCharacter characterId={step.hostCharacter} mood={mood} size={84} />
          </div>
          <div className="mt-4 sm:hidden">
            <HostCharacter characterId={step.hostCharacter} mood={mood} size={84} />
          </div>
        </div>
      )}
      {phase === 'complete' && (
        <Complete
          child={child}
          stars={Math.min(3, Math.round((stars / Math.max(activeSteps.length, 1)) * 3))}
          points={points}
          onReplay={backToMap}
          onExit={() => setPhase('goodbye')}
        />
      )}
      {phase === 'goodbye' && <Goodbye child={child} onDone={onExit} />}
    </KidShell>
  );
}
