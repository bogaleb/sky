'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  generateRound,
  describeItem,
  PATTERN_LEVELS,
  PATTERN_HOST_CHARACTER,
  PATTERN_INTRO_LINE,
  ROUNDS_PER_GAME,
  levelForRound,
  type PatternItem,
  type PatternRound,
} from '@/lib/kid/patterns';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { logLearningEvent } from '@/app/actions/learning';
import KidShell from '@/components/kid/kid-shell';
import HostCharacter from '@/components/kid/host-character';

export interface PatternParadeProps {
  childId: string;
  nickname?: string;
  onExit?: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const COLOR_HEX: Record<string, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#FACC15',
  purple: '#A855F7',
  orange: '#FB923C',
};

const SIZE_SCALE: Record<string, number> = {
  small: 0.6,
  medium: 0.85,
  large: 1.02,
};

const PRAISE = [
  'You found it!',
  'Amazing pattern spotting!',
  "That's the one!",
  'Brilliant! You cracked the code!',
];

const ENCOURAGE = [
  'Good try! Look at the march again.',
  'Almost! What keeps repeating?',
  'Try another one — you can do it!',
];

/** Inline SVG shape glyph. No emoji, ever. */
function ShapeGlyph({ shape, color }: { shape: string; color: string }) {
  const fill = COLOR_HEX[color] ?? '#FF8C42';
  const stroke = '#17324F';
  return (
    <>
      {shape === 'circle' && (
        <circle cx="32" cy="32" r="26" fill={fill} stroke={stroke} strokeWidth="3" />
      )}
      {shape === 'square' && (
        <rect x="8" y="8" width="48" height="48" rx="8" fill={fill} stroke={stroke} strokeWidth="3" />
      )}
      {shape === 'triangle' && (
        <path d="M32 6 L58 54 L6 54 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
      )}
      {shape === 'diamond' && (
        <path d="M32 6 L56 32 L32 58 L8 32 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
      )}
      {shape === 'star' && (
        <path
          d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
      {shape === 'heart' && (
        <path
          d="M32 56 C10 40 6 22 18 14 C26 9 32 14 32 20 C32 14 38 9 46 14 C58 22 54 40 32 56 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
    </>
  );
}

/** Counting dots laid out on a tidy grid. */
function DotsGlyph({ count, color }: { count: number; color: string }) {
  const n = Math.min(12, Math.max(1, count));
  const cols = n <= 2 ? n : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const r = n > 6 ? 5 : 6.5;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const rr = Math.floor(i / cols);
    pts.push([(64 * (c + 1)) / (cols + 1), (64 * (rr + 1)) / (rows + 1)]);
  }
  return (
    <svg viewBox="0 0 64 64" className="h-3/4 w-3/4" role="img" aria-label={`${n} dots`}>
      {pts.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={COLOR_HEX[color] ?? '#3B82F6'} />
      ))}
    </svg>
  );
}

/** One pattern item: numeral, counting dots, or a colored shape. */
function PatternTile({ item }: { item: PatternItem }) {
  if (item.value !== undefined) {
    return (
      <span
        className="text-5xl font-black text-kid-ink-900 md:text-6xl"
        role="img"
        aria-label={describeItem(item)}
      >
        {item.value}
      </span>
    );
  }
  if (item.dots !== undefined) {
    return <DotsGlyph count={item.dots} color={item.color} />;
  }
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-3/4 w-3/4"
      role="img"
      aria-label={describeItem(item)}
    >
      <g
        transform={`translate(32 32) scale(${SIZE_SCALE[item.size] ?? 0.85}) translate(-32 -32)`}
      >
        <ShapeGlyph shape={item.shape} color={item.color} />
      </g>
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
        fill="#FFC93C"
        stroke="#E09E00"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
      <path
        d="M42 24 q9 8 0 16"
        fill="none"
        stroke="#17324F"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M48 17 q14 15 0 30"
        fill="none"
        stroke="#17324F"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function PatternParade({ childId, nickname, onExit }: PatternParadeProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [gameSeed, setGameSeed] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [pickedWrong, setPickedWrong] = useState<number[]>([]);
  const [justCorrect, setJustCorrect] = useState(false);
  const [lock, setLock] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const [starBalance, setStarBalance] = useState(0);
  const timers = useRef<number[]>([]);

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

  const round: PatternRound = useMemo(
    () => generateRound(levelForRound(roundIndex), gameSeed + roundIndex * 7919),
    [gameSeed, roundIndex],
  );
  const levelDef = PATTERN_LEVELS[round.level - 1];

  const startGame = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setGameSeed(Math.floor(Math.random() * 1_000_000_000));
    setRoundIndex(0);
    setTotalAttempts(0);
    setPickedWrong([]);
    setJustCorrect(false);
    setLock(false);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    speakAs(PATTERN_HOST_CHARACTER, PATTERN_INTRO_LINE);
  }, []);

  const handleWin = useCallback(
    async (attempts: number) => {
      const stars =
        attempts <= ROUNDS_PER_GAME ? 3 : attempts <= ROUNDS_PER_GAME + 4 ? 2 : 1;
      setStarsEarned(stars);
      setPhase('won');
      playSfx('fanfare');
      speakAs(
        PATTERN_HOST_CHARACTER,
        nickname
          ? `Amazing, ${nickname}! You finished the whole parade! You earned ${stars} stars!`
          : `Amazing! You finished the whole parade! You earned ${stars} stars!`,
      );
      try {
        const balance = await awardStars(childId, stars);
        setStarBalance(balance);
        await bumpQuestProgress(childId, 'pattern_game', 1);
        await awardStickers(childId, ['pattern-pro']);
        await logLearningEvent(childId, 'milestone', {
          metadata: {
            kind: 'pattern_parade_win',
            stars,
            attempts,
            rounds: ROUNDS_PER_GAME,
          },
        });
      } catch {
        /* progress logging is best-effort; the celebration still stands */
      }
    },
    [childId, nickname],
  );

  const choose = useCallback(
    (choiceIndex: number) => {
      if (lock || justCorrect || phase !== 'play') return;
      const attempts = totalAttempts + 1;
      setTotalAttempts(attempts);
      if (choiceIndex === round.answerIndex) {
        setJustCorrect(true);
        setLock(true);
        playSfx('correct');
        speakAs(PATTERN_HOST_CHARACTER, PRAISE[roundIndex % PRAISE.length]);
        later(1200, () => {
          const next = roundIndex + 1;
          if (next >= ROUNDS_PER_GAME) {
            void handleWin(attempts);
          } else {
            const nextLevel = levelForRound(next);
            setPickedWrong([]);
            setJustCorrect(false);
            setLock(false);
            setRoundIndex(next);
            if (nextLevel > round.level) {
              const def = PATTERN_LEVELS[nextLevel - 1];
              speakAs(
                PATTERN_HOST_CHARACTER,
                `Level ${nextLevel}! ${def.name}! ${def.tagline}!`,
              );
            }
          }
        });
      } else {
        playSfx('wrong');
        setPickedWrong((prev) =>
          prev.includes(choiceIndex) ? prev : [...prev, choiceIndex],
        );
        speakAs(
          PATTERN_HOST_CHARACTER,
          ENCOURAGE[roundIndex % ENCOURAGE.length],
        );
      }
    },
    [lock, justCorrect, phase, round, roundIndex, totalAttempts, later, handleWin],
  );

  const speakSequence = useCallback(() => {
    const words = round.sequence.map((s) =>
      s ? describeItem(s) : 'a missing one',
    );
    speakAs(
      PATTERN_HOST_CHARACTER,
      `${words.join(', ')}. What comes next?`,
    );
  }, [round]);

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center px-4 text-center">
          <HostCharacter
            characterId={PATTERN_HOST_CHARACTER}
            mood="happy"
            size={140}
          />
          <h1 className="animate-kid-rise mt-2 text-3xl font-black text-kid-ink-900 md:text-5xl">
            Pattern Parade
          </h1>
          <p
            className="animate-kid-rise mt-3 text-lg font-bold text-kid-ink-700 md:text-xl"
            style={{ animationDelay: '0.1s' }}
          >
            Shapes are marching in a parade! Spot the pattern and tap what
            comes next. Eight rounds, from easy marches to mastermind puzzles!
          </p>
          <button
            type="button"
            onClick={startGame}
            className="animate-kid-rise mt-6 min-h-[64px] rounded-full bg-kid-sun-400 px-10 py-4 text-xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
          >
            Start the parade!
          </button>
        </div>
      )}

      {phase === 'play' && (
        <div className="flex w-full max-w-4xl flex-col items-center px-2">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">
                Round {roundIndex + 1} of {ROUNDS_PER_GAME}
              </span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">
                Level {round.level} · {levelDef.name}
              </span>
            </div>
            <button
              type="button"
              onClick={speakSequence}
              aria-label="Hear the pattern read aloud"
              className="flex min-h-[56px] items-center gap-2 rounded-full bg-white/85 px-5 py-2 text-base font-black text-kid-ink-900 shadow-lg backdrop-blur transition-transform active:scale-95"
            >
              <SpeakerIcon className="h-8 w-8" />
              Hear it
            </button>
          </div>

          <div
            key={`${gameSeed}-${roundIndex}`}
            className="mt-6 flex flex-wrap items-center justify-center gap-2 md:gap-3"
            role="list"
            aria-label="Pattern sequence"
          >
            {round.sequence.map((slot, i) =>
              slot === null ? (
                <div
                  key={i}
                  role="listitem"
                  aria-label="Missing spot — what comes next?"
                  className="animate-kid-pop-in flex h-20 w-20 items-center justify-center rounded-kid-card border-4 border-dashed border-kid-sun-400 bg-white/70 shadow-lg md:h-24 md:w-24"
                  style={{ animationDelay: `${i * 0.14}s` }}
                >
                  <span className="animate-kid-pulse-ring text-4xl font-black text-kid-ink-700 md:text-5xl">
                    ?
                  </span>
                </div>
              ) : (
                <div
                  key={i}
                  role="listitem"
                  aria-label={describeItem(slot)}
                  className="animate-kid-pop-in flex h-20 w-20 items-center justify-center rounded-kid-card border-4 border-kid-sky-200 bg-white shadow-lg md:h-24 md:w-24"
                  style={{ animationDelay: `${i * 0.14}s` }}
                >
                  <PatternTile item={slot} />
                </div>
              ),
            )}
          </div>

          <p className="mt-4 text-center text-lg font-bold text-kid-ink-700 md:text-xl">
            {round.hostLine}
          </p>

          <div
            className="mt-4 flex flex-wrap items-stretch justify-center gap-3 md:gap-4"
            role="group"
            aria-label="Answer choices"
          >
            {round.choices.map((choice, ci) => {
              const wasWrong = pickedWrong.includes(ci);
              const isAnswer = justCorrect && ci === round.answerIndex;
              return (
                <button
                  key={ci}
                  type="button"
                  onClick={() => choose(ci)}
                  disabled={wasWrong || lock}
                  aria-label={`Choice: ${describeItem(choice)}`}
                  className={`flex min-h-[88px] min-w-[88px] items-center justify-center rounded-kid-card border-4 bg-white px-4 py-3 shadow-xl transition-all md:min-h-[104px] md:min-w-[104px] ${
                    isAnswer
                      ? 'animate-kid-bounce-soft border-kid-sun-400 shadow-[0_0_26px_10px_rgba(255,201,60,0.65)]'
                      : wasWrong
                        ? 'animate-kid-shake border-kid-sky-200 opacity-40'
                        : 'border-kid-sky-200 hover:scale-105 active:scale-95'
                  }`}
                >
                  <PatternTile item={choice} />
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm font-bold tabular-nums text-kid-ink-700">
            Tries this game: {totalAttempts}
          </p>
        </div>
      )}

      {phase === 'won' && (
        <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
          <div className="animate-kid-bounce-soft">
            <StarIcon className="h-24 w-24 md:h-28 md:w-28" />
          </div>
          <h2 className="mt-3 text-3xl font-black text-kid-ink-900 md:text-4xl">
            Parade complete{nickname ? `, ${nickname}` : ''}!
          </h2>
          <p className="mt-2 text-lg font-bold text-kid-ink-700">
            You spotted all {ROUNDS_PER_GAME} patterns in {totalAttempts} tries
            and earned
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StarIcon className="h-10 w-10" />
            <span className="text-4xl font-black tabular-nums text-kid-ink-900">
              {starsEarned}
            </span>
            <span className="text-2xl font-black text-kid-ink-700">stars</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={startGame}
              className="min-h-[56px] rounded-full bg-kid-sky-400 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              March again
            </button>
          </div>
        </div>
      )}
    </KidShell>
  );
}

export default PatternParade;
