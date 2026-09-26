'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  generateRound,
  levelForRound,
  skillForRound,
  ROUNDS_PER_GAME,
  DOT_POSITIONS,
  type NumberRound,
  type DotGroup,
} from '@/lib/kid/numbers';
import {
  levelFor,
  adaptiveRamp,
  placementSeedLevel,
  type DifficultyLevel,
} from '@/lib/kid/adapt';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen, AnswerFeedbackPanel } from './game-shell';
import KidShell from '@/components/kid/kid-shell';
import HostCharacter from '@/components/kid/host-character';
import { AVATARS } from '@/components/avatars';

export interface NumberRunProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const HOST = 'milo';
const INTRO_LINE =
  'Hello, racer! I am Milo! Count with me, add with me, and sprint all the way to the finish flag. Ready, set, GO!';
const PRAISE = [
  'Zoom zoom! That is right!',
  'Fantastic counting, racer!',
  'You are speeding ahead!',
  'Brilliant! Keep running!',
];
const RETRY = [
  'Almost! Try again, you can do it!',
  'Good try! Count once more!',
  'Not quite, racer. One more go!',
];

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M10 24 h12 l14 -11 v38 l-14 -11 h-12 z"
        fill="#3B82F6"
        stroke="#17324F"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M42 24 q9 8 0 16" fill="none" stroke="#17324F" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 18 q13 14 0 28" fill="none" stroke="#17324F" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const STAR_PATH = 'M0,-10 L2.9,-3.1 L10,-3.1 L4.1,1.9 L5.9,8.1 L0,4 L-5.9,8.1 L-4.1,1.9 L-10,-3.1 L-2.9,-3.1 Z';

/** One dot group rendered as an SVG card. Crossed dots are dimmed with an X. */
function DotCard({ group, color }: { group: DotGroup; color: string }) {
  const positions = DOT_POSITIONS[Math.min(group.count, DOT_POSITIONS.length - 1)];
  const solid = group.count - (group.crossed ?? 0);
  return (
    <div className="flex items-center justify-center rounded-kid-card border-4 border-white/70 bg-white/85 px-3 py-3 shadow-lg">
      <svg viewBox="0 0 100 100" className="h-28 w-28 md:h-36 md:w-36" role="img" aria-label={`${group.count} dots`}>
        {positions.slice(0, group.count).map(([x, y], i) => {
          const crossed = i >= solid;
          if (group.shape === 'star') {
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <path
                  d={STAR_PATH}
                  fill={crossed ? '#E2E8F0' : color}
                  stroke={crossed ? '#94A3B8' : '#17324F'}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  opacity={crossed ? 0.6 : 1}
                />
                {crossed && (
                  <g stroke="#EF4444" strokeWidth="3" strokeLinecap="round">
                    <line x1="-7" y1="-7" x2="7" y2="7" />
                    <line x1="7" y1="-7" x2="-7" y2="7" />
                  </g>
                )}
              </g>
            );
          }
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="10"
                fill={crossed ? '#E2E8F0' : color}
                stroke={crossed ? '#94A3B8' : '#17324F'}
                strokeWidth="2.5"
                opacity={crossed ? 0.6 : 1}
              />
              {crossed && (
                <g stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round">
                  <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} />
                  <line x1={x + 8} y1={y - 8} x2={x - 8} y2={y + 8} />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Operator({ op }: { op: string }) {
  return (
    <span className="text-4xl font-black text-white drop-shadow-[0_2px_6px_rgba(23,50,79,0.5)] md:text-5xl" aria-hidden>
      {op}
    </span>
  );
}

/** Visual for a round: dot groups with operators, or number tiles. */
function RoundVisual({ round }: { round: NumberRound }) {
  if (round.kind === 'missing') {
    return (
      <div className="flex items-center justify-center gap-2 md:gap-3" role="img" aria-label="Number sequence with one missing">
        {round.sequence.map((v, i) =>
          v === null ? (
            <div
              key={i}
              className="flex h-20 w-16 items-center justify-center rounded-kid-card border-4 border-dashed border-kid-sun-500 bg-kid-sun-200/70 md:h-24 md:w-20"
            >
              <span className="text-4xl font-black text-kid-sun-700 md:text-5xl">?</span>
            </div>
          ) : (
            <div
              key={i}
              className="flex h-20 w-16 items-center justify-center rounded-kid-card border-4 border-white/70 bg-white/85 shadow-lg md:h-24 md:w-20"
            >
              <span className="text-4xl font-black tabular-nums text-kid-ink-900 md:text-5xl">{v}</span>
            </div>
          )
        )}
      </div>
    );
  }
  const colors = ['#3B82F6', '#FFC93C'];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
      {round.dots.map((group, i) => (
        <div key={i} className="flex items-center gap-2 md:gap-4">
          {i > 0 && (
            <Operator
              op={round.kind === 'add' ? '+' : round.kind === 'subtract' ? '−' : '·'}
            />
          )}
          <DotCard group={group} color={colors[i % colors.length]} />
        </div>
      ))}
    </div>
  );
}

/** Shared Milo avatar for the track and the win screen. */
const MiloAvatar = AVATARS.milo.Component;

/** Milo sprints along the track: one step per correct answer, 8 to the flag. */
function MiloTrack({ stepsDone }: { stepsDone: number }) {
  const left = 4 + stepsDone * 11.5;
  return (
    <div className="relative h-20 w-full md:h-24" aria-hidden="true">
      <div className="absolute left-[4%] right-[4%] top-1/2 h-3 -translate-y-1/2 rounded-full bg-white/50 shadow-inner" />
      {Array.from({ length: ROUNDS_PER_GAME }, (_, i) => {
        const reached = i < stepsDone;
        return (
          <div
            key={i}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${4 + (i + 1) * 11.5}%` }}
          >
            <div
              className={`h-4 w-4 rounded-full border-2 transition-colors duration-500 ${
                reached ? 'border-kid-sun-600 bg-kid-sun-400' : 'border-white/70 bg-white/40'
              }`}
            />
          </div>
        );
      })}
      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: '96%' }}>
        <svg viewBox="0 0 32 48" className="h-12 w-8 md:h-14 md:w-9">
          <line x1="7" y1="4" x2="7" y2="46" stroke="#8B5E34" strokeWidth="4" strokeLinecap="round" />
          <path d="M7 4 h21 l-6 7.5 6 7.5 h-21 z" fill="#22C55E" stroke="#15803D" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-[62%] transition-all duration-700 ease-out"
        style={{ left: `${left}%` }}
      >
        <div className={stepsDone > 0 ? 'animate-kid-bob' : ''}>
          <MiloAvatar className="h-14 w-14 drop-shadow-[0_8px_14px_rgba(23,50,79,0.35)] md:h-16 md:w-16" />
        </div>
      </div>
    </div>
  );
}

export default function NumberRun({ childId, nickname = 'friend', onExit }: NumberRunProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [gameSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<{ value: number; correct: boolean } | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'number_game',
    stickerId: 'number-ninja',
    trophyEvent: 'number_done',
    milestone: 'number_run_win',
    learning: { gameId: 'number-run', skill: 'count' },
  });
  const starBalance = session.starBalance ?? 0;
  // Adaptive difficulty (ZPD): round difficulty follows the child's level.
  const [adaptLevel, setAdaptLevel] = useState<DifficultyLevel>(() =>
    levelFor(childId, 'number-run', placementSeedLevel(childId))
  );
  const timers = useRef<number[]>([]);

  // The stock 8-round ramp, biased easier/harder by the adaptive level.
  const baseRamp = useMemo(
    () => Array.from({ length: ROUNDS_PER_GAME }, (_, i) => levelForRound(i)),
    []
  );
  const roundLevels = useMemo(() => adaptiveRamp(baseRamp, adaptLevel), [baseRamp, adaptLevel]);

  const round = generateRound(
    roundLevels[Math.min(roundIndex, roundLevels.length - 1)],
    gameSeed + roundIndex * 7919
  );

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

  const startGame = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    // Re-read the adaptive level each game so recent results reshape content.
    const level = levelFor(childId, 'number-run', placementSeedLevel(childId));
    setAdaptLevel(level);
    const levels = adaptiveRamp(baseRamp, level);
    setRoundIndex(0);
    setAttempts(0);
    setCorrectCount(0);
    setPicked(null);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    later(400, () => {
      const first = generateRound(levels[0], gameSeed);
      speakAs(HOST, first.prompt);
    });
  }, [gameSeed, later, baseRamp]);

  const handleWin = useCallback(
    async (finalAttempts: number) => {
      // 3 stars for a perfect run (8 tries), 2 for <= 12, else 1.
      const stars = finalAttempts === ROUNDS_PER_GAME ? 3 : finalAttempts <= 12 ? 2 : 1;
      setStarsEarned(stars);
      setPhase('won');
      playSfx('fanfare');
      speakAs(
        HOST,
        nickname
          ? `Amazing racing, ${nickname}! You reached the finish flag! You earned ${stars} stars!`
          : `Amazing racing! You reached the finish flag! You earned ${stars} stars!`
      );
      await session.complete({ stars, extraMetadata: { attempts: finalAttempts } });
    },
    [childId, nickname, session]
  );

  const choose = useCallback(
    (value: number) => {
      if (picked || phase !== 'play') return;
      // Every answer is evidence: feeds skill mastery and adaptive difficulty.
      session.recordAnswer(value === round.answer, { ...skillForRound(round), itemKey: `${gameSeed}-${roundIndex}` });
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (value === round.answer) {
        playSfx('correct');
        setPicked({ value, correct: true });
        const nextCorrect = correctCount + 1;
        setCorrectCount(nextCorrect);
        speakAs(HOST, PRAISE[roundIndex % PRAISE.length]);
        later(1000, () => {
          setPicked(null);
          if (nextCorrect >= ROUNDS_PER_GAME) {
            void handleWin(nextAttempts);
          } else {
            setRoundIndex((i) => i + 1);
            const next = generateRound(
              roundLevels[Math.min(roundIndex + 1, roundLevels.length - 1)],
              gameSeed + (roundIndex + 1) * 7919
            );
            later(350, () => speakAs(HOST, next.prompt));
          }
        });
      } else {
        playSfx('wrong');
        setPicked({ value, correct: false });
        speakAs(HOST, RETRY[attempts % RETRY.length]);
        later(750, () => setPicked(null));
      }
    },
    [picked, phase, attempts, round, roundIndex, roundLevels, correctCount, gameSeed, later, handleWin, session]
  );

  const speakQuestion = useCallback(() => {
    speakAs(HOST, round.prompt);
  }, [round]);

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-2xl flex-col items-center px-4 text-center">
          <HostCharacter characterId={HOST} mood="happy" />
          <h1 className="animate-kid-rise mt-2 text-3xl font-black text-kid-ink-900 md:text-5xl">
            Number Run
          </h1>
          <p className="animate-kid-rise mt-2 max-w-xl text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
            Count the dots, solve the sums, and help Milo sprint 8 steps to the finish flag!
          </p>
          <button
            type="button"
            onClick={() => {
              playSfx('pop');
              speakAs(HOST, INTRO_LINE);
              startGame();
            }}
            className="animate-kid-rise mt-6 rounded-full border-b-8 border-kid-sun-600 bg-kid-sun-400 px-12 py-4 text-2xl font-black text-kid-ink-900 shadow-[0_14px_30px_rgba(255,201,60,0.45)] transition-all hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
          >
            Start running!
          </button>
        </div>
      )}

      {phase === 'play' && (
        <div className="flex w-full max-w-3xl flex-col items-center px-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="rounded-full bg-white px-4 py-2 shadow-lg">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Number Run</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Milo</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={speakQuestion}
                aria-label="Hear the question read aloud"
                className="flex min-h-[56px] items-center gap-2 rounded-full bg-white px-5 py-2 text-base font-black text-kid-ink-900 shadow-lg transition-transform active:scale-95"
              >
                <SpeakerIcon className="h-8 w-8" />
                Hear it
              </button>
              <div className="rounded-full bg-white px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg md:text-lg">
                {correctCount} / {ROUNDS_PER_GAME}
              </div>
            </div>
          </div>

          <div className="mt-1 w-full">
            <MiloTrack stepsDone={correctCount} />
          </div>

          <div key={`${gameSeed}-${roundIndex}`} className="mt-1 flex w-full flex-col items-center">
            <p className="animate-kid-rise text-center text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(23,50,79,0.55)] md:text-3xl">
              {round.question}
            </p>
            <div className="animate-kid-pop-in mt-3">
              <RoundVisual round={round} />
            </div>

            <div
              className="mt-5 grid w-full max-w-xl grid-cols-2 gap-3 md:grid-cols-4"
              role="group"
              aria-label="Answer choices"
            >
              {round.choices.map((choice) => {
                const isPicked = picked?.value === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => choose(choice)}
                    disabled={picked?.correct === true}
                    aria-label={`Answer ${choice}`}
                    className={`flex min-h-[72px] items-center justify-center rounded-kid-card border-b-8 px-4 py-3 text-4xl font-black tabular-nums shadow-xl transition-all hover:scale-105 active:scale-95 disabled:cursor-default md:text-5xl ${
                      isPicked && picked.correct
                        ? 'animate-kid-pop-in border-kid-sun-600 bg-kid-sun-300 text-kid-ink-900 shadow-[0_0_26px_10px_rgba(255,201,60,0.65)]'
                        : isPicked
                          ? 'animate-kid-shake border-kid-grape-600 bg-kid-grape-300 text-white'
                          : 'border-kid-sky-600 bg-white text-kid-ink-900'
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm font-bold text-white/90 drop-shadow-[0_1px_4px_rgba(23,50,79,0.5)]" aria-live="polite">
              {picked?.correct
                ? 'That is right! Milo sprints ahead!'
                : picked
                  ? 'Try again, racer!'
                  : 'Tap the right number!'}
            </p>
          </div>
        </div>
      )}

      <AnswerFeedbackPanel feedback={session.feedback} />

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Finish flag, ${nickname}!`}
          message={`Milo sprinted all ${ROUNDS_PER_GAME} steps in ${attempts} tries!`}
          stickerId="number-ninja"
          hostAvatar={<MiloAvatar className="h-24 w-24 md:h-28 md:w-28" />}
          onPlayAgain={startGame}
          onExit={onExit}
          playAgainLabel="Run again"
        />
      )}
    </KidShell>
  );
}
