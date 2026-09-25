'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  QUESTIONS,
  scorePlacement,
  savePlacement,
  type PlacementResult,
  type ShapeId,
} from '@/lib/kid/placement';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession } from './game-shell';
import KidShell from '@/components/kid/kid-shell';
import Curio from '@/components/avatars/curio';
import { ConfettiBurst } from '@/components/kid/celebration';

export interface WelcomeQuestProps {
  childId: string;
  nickname?: string;
  onDone: () => void;
}

type Phase = 'greet' | 'q0' | 'q1' | 'q2' | 'done';

const PHASE_FOR_INDEX: Phase[] = ['q0', 'q1', 'q2'];

function ShapeArt({ shape }: { shape: ShapeId }) {
  const common = 'h-16 w-16 md:h-20 md:w-20';
  if (shape === 'circle')
    return (
      <svg viewBox="0 0 64 64" className={common} role="img" aria-label="circle">
        <circle cx="32" cy="32" r="26" fill="#5BC8E8" stroke="#2E9BC6" strokeWidth="4" />
      </svg>
    );
  if (shape === 'triangle')
    return (
      <svg viewBox="0 0 64 64" className={common} role="img" aria-label="triangle">
        <path d="M32 8 L58 54 L6 54 Z" fill="#FFD93C" stroke="#E0A800" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 64 64" className={common} role="img" aria-label="square">
      <rect x="8" y="8" width="48" height="48" rx="8" fill="#FF8C42" stroke="#D96C1E" strokeWidth="4" />
    </svg>
  );
}

function StarArt() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 md:h-16 md:w-16" role="img" aria-label="star">
      <path
        d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
        fill="#FFD93C"
        stroke="#E0A800"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PRAISE = [
  'Yes! You got it!',
  'Wonderful!',
  'That is exactly right!',
];
const RETRY = [
  'Good try! Have another go.',
  'Almost! Try once more.',
  'Nice trying! You can do it.',
];

export default function WelcomeQuest({ childId, nickname, onDone }: WelcomeQuestProps) {
  const [phase, setPhase] = useState<Phase>('greet');
  const [firstTry, setFirstTry] = useState<boolean[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [result, setResult] = useState<PlacementResult | null>(null);
  const timers = useRef<number[]>([]);
  const awardsFired = useRef(false);
  const name = nickname?.trim() || 'friend';

  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => window.clearTimeout(t));
      stopSpeaking();
    };
  }, []);

  const speakPrompt = useCallback(
    (index: number) => {
      const q = QUESTIONS[index];
      if (q.kind === 'sound') {
        speakAs('curio', `${q.prompt} The letter ${q.letter}. Is it ${q.choices.join(', ')}?`);
      } else {
        speakAs('curio', q.prompt);
      }
    },
    []
  );

  const startQuest = useCallback(() => {
    playSfx('pop');
    unlockAudioOnce();
    setAttempts(0);
    setFeedback('idle');
    setPhase('q0');
    later(350, () => speakPrompt(0));
  }, [later, speakPrompt]);

  // One-time audio unlock helper (speech needs a user gesture on mobile).
  function unlockAudioOnce() {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        if (ctx.state === 'suspended') void ctx.resume();
        void ctx.close();
      }
    } catch {
      /* best-effort */
    }
  }

  const answerQuestion = useCallback(
    (index: number, correct: boolean) => {
      if (feedback !== 'idle') return;
      if (correct) {
        setFeedback('correct');
        playSfx('correct');
        setFirstTry((prev) => [...prev, attempts === 0]);
        speakAs('curio', PRAISE[index % PRAISE.length]);
        later(1400, () => {
          setAttempts(0);
          setFeedback('idle');
          if (index < 2) {
            const next = PHASE_FOR_INDEX[index + 1];
            setPhase(next);
            later(350, () => speakPrompt(index + 1));
          } else {
            setPhase('done');
          }
        });
      } else {
        setFeedback('wrong');
        playSfx('wrong');
        setAttempts((a) => a + 1);
        speakAs('curio', RETRY[attempts % RETRY.length]);
        later(900, () => setFeedback('idle'));
      }
    },
    [feedback, attempts, later, speakPrompt]
  );

  // Celebration + rewards, fired exactly once. Runs through the shared
  // GameShell so one failing step never blocks the others.
  const session = useGameSession({
    childId,
    stickerId: 'brave-beginner',
    trophyEvent: 'onboarding_done',
    milestone: 'welcome_quest_done',
  });
  useEffect(() => {
    if (phase !== 'done' || awardsFired.current) return;
    awardsFired.current = true;
    const placement = scorePlacement(firstTry);
    setResult(placement);
    savePlacement(childId, placement.level);
    playSfx('fanfare');
    speakAs('curio', `You're ready for Sky, ${name}! You are a ${placement.label}!`);
    void session.complete({
      stars: 0,
      extraMetadata: { level: placement.level, label: placement.label },
    });
  }, [phase, firstTry, childId, name, session]);

  const questionIndex = phase === 'q0' ? 0 : phase === 'q1' ? 1 : phase === 'q2' ? 2 : -1;

  return (
    <KidShell>
      <style>{`@keyframes kid-wave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(10deg); } } .kid-wave { display: inline-block; animation: kid-wave 1.8s ease-in-out infinite; transform-origin: 50% 85%; }`}</style>

      {phase === 'greet' && (
        <div className="flex w-full max-w-2xl flex-col items-center px-4 text-center">
          <div className="kid-wave animate-kid-pop-in">
            <Curio className="h-40 w-40 md:h-52 md:w-52" />
          </div>
          <h1 className="animate-kid-rise mt-4 text-3xl font-black text-kid-ink-900 md:text-5xl">
            Hi{name !== 'friend' ? `, ${name}` : ''}! I&apos;m Curio!
          </h1>
          <p
            className="animate-kid-rise mt-3 max-w-xl text-lg font-bold text-kid-ink-700 md:text-2xl"
            style={{ animationDelay: '0.12s' }}
          >
            Welcome to the Sky! Let&apos;s play 3 quick games together, so I can
            find the perfect starting place for you.
          </p>
          <button
            type="button"
            onClick={startQuest}
            className="animate-kid-rise mt-8 rounded-full bg-kid-sun-400 px-10 py-4 text-2xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.24s' }}
            aria-label="Start the welcome quest"
          >
            Let&apos;s play!
          </button>
          <p className="mt-4 text-sm font-bold text-kid-ink-700">
            No rush, no wrong answers. Just fun.
          </p>
        </div>
      )}

      {questionIndex >= 0 && (
        <div className="flex w-full max-w-2xl flex-col items-center px-4">
          <div className="rounded-full bg-white/85 px-5 py-2 text-base font-black text-kid-ink-900 shadow-lg backdrop-blur md:text-lg" aria-label={`Game ${questionIndex + 1} of 3`}>
            Game {questionIndex + 1} of 3
          </div>

          {(() => {
            const q = QUESTIONS[questionIndex];
            if (q.kind === 'counting') {
              return (
                <div className="mt-6 flex w-full flex-col items-center">
                  <h2 className="animate-kid-rise text-center text-2xl font-black text-kid-ink-900 md:text-4xl">
                    {q.prompt}
                  </h2>
                  <div className="animate-kid-pop-in mt-6 flex flex-wrap items-center justify-center gap-3" role="img" aria-label={`${q.count} stars`}>
                    {Array.from({ length: q.count }).map((_, i) => (
                      <span key={i} className="animate-kid-bounce-soft" style={{ animationDelay: `${i * 0.12}s` }}>
                        <StarArt />
                      </span>
                    ))}
                  </div>
                  <div className="mt-8 flex items-center justify-center gap-4">
                    {q.choices.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => answerQuestion(0, n === q.count)}
                        aria-label={`Answer: ${n}`}
                        className={`flex h-20 w-20 items-center justify-center rounded-kid-card bg-white text-4xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95 md:h-24 md:w-24 ${
                          feedback === 'wrong' ? 'animate-kid-shake' : ''
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            if (q.kind === 'sound') {
              return (
                <div className="mt-6 flex w-full flex-col items-center">
                  <h2 className="animate-kid-rise text-center text-2xl font-black text-kid-ink-900 md:text-4xl">
                    {q.prompt}
                  </h2>
                  <div className="animate-kid-pop-in mt-6 flex h-32 w-32 items-center justify-center rounded-kid-card bg-kid-grape-300 text-7xl font-black text-kid-ink-900 shadow-xl md:h-40 md:w-40 md:text-8xl" aria-label={`The letter ${q.letter}`}>
                    {q.letter}
                  </div>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    {q.choices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => answerQuestion(1, choice === q.answer)}
                        aria-label={`Sound: ${choice}`}
                        className={`rounded-full bg-white px-8 py-4 text-3xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95 md:text-4xl ${
                          feedback === 'wrong' ? 'animate-kid-shake' : ''
                        }`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => speakPrompt(1)}
                    className="mt-6 rounded-full bg-white/70 px-6 py-3 text-lg font-extrabold text-kid-ink-700 shadow transition-transform active:scale-95"
                    aria-label="Hear the question again"
                  >
                    Hear it again
                  </button>
                </div>
              );
            }
            return (
              <div className="mt-6 flex w-full flex-col items-center">
                <h2 className="animate-kid-rise text-center text-2xl font-black text-kid-ink-900 md:text-4xl">
                  {q.prompt}
                </h2>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
                  {q.choices.map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => answerQuestion(2, shape === q.target)}
                      aria-label={`Choose the ${shape}`}
                      className={`flex h-28 w-28 items-center justify-center rounded-kid-card bg-white shadow-xl transition-transform hover:scale-105 active:scale-95 md:h-36 md:w-36 ${
                        feedback === 'wrong' ? 'animate-kid-shake' : ''
                      }`}
                    >
                      <ShapeArt shape={shape} />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => speakPrompt(2)}
                  className="mt-6 rounded-full bg-white/70 px-6 py-3 text-lg font-extrabold text-kid-ink-700 shadow transition-transform active:scale-95"
                  aria-label="Hear the question again"
                >
                  Hear it again
                </button>
              </div>
            );
          })()}

          <div className="sr-only" aria-live="polite">
            {feedback === 'correct' ? 'Correct! Well done!' : feedback === 'wrong' ? 'Good try, have another go.' : ''}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="relative flex w-full max-w-2xl flex-col items-center px-4 text-center">
          <ConfettiBurst />
          <div className="kid-wave animate-kid-pop-in">
            <Curio className="h-36 w-36 md:h-44 md:w-44" />
          </div>
          <h1 className="animate-kid-rise mt-4 text-3xl font-black text-kid-ink-900 md:text-5xl">
            You&apos;re ready for Sky{name !== 'friend' ? `, ${name}` : ''}!
          </h1>
          <p className="animate-kid-rise mt-3 text-lg font-bold text-kid-ink-700 md:text-2xl" style={{ animationDelay: '0.12s' }}>
            You earned the <span className="font-black text-kid-ink-900">Brave Beginner</span> sticker!
          </p>
          {result && (
            <div className="animate-kid-rise mt-5 rounded-kid-card bg-white/90 px-8 py-4 shadow-xl" style={{ animationDelay: '0.2s' }}>
              <p className="text-sm font-bold uppercase tracking-wide text-kid-ink-700">Your starting level</p>
              <p className="mt-1 text-3xl font-black text-kid-ink-900">{result.label}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              playSfx('fanfare');
              onDone();
            }}
            className="animate-kid-rise mt-8 rounded-full bg-kid-sun-400 px-10 py-4 text-2xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.28s' }}
            aria-label="Start exploring Sky"
          >
            Start exploring!
          </button>
        </div>
      )}
    </KidShell>
  );
}
