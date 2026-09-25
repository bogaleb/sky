'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  pickSession,
  fractionName,
  ROUNDS_PER_GAME,
  type FractionQuestion,
} from '@/lib/kid/fractions';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { logLearningEvent } from '@/app/actions/learning';
import { checkTrophies } from '@/app/actions/trophies';
import KidShell from '@/components/kid/kid-shell';

export interface FractionFairProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const PRAISE = [
  'Sweet sharing!',
  'Fair and square!',
  'Yummy math!',
  'Perfectly fair!',
];
const TRY_AGAIN = [
  'Almost! Count the shaded parts once more.',
  'Good try! Look closely and try again.',
  'Not quite — you can do it!',
];

/** Slice path for a circle divided into equal parts. Angles in degrees from top. */
function slicePath(cx: number, cy: number, r: number, index: number, parts: number): string {
  const step = 360 / parts;
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const a1 = index * step;
  const a2 = (index + 1) * step;
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  const x2 = cx + r * Math.cos(rad(a2));
  const y2 = cy + r * Math.sin(rad(a2));
  const large = step > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}

const PALETTES: Record<string, { base: string; shaded: string; crust: string; line: string }> = {
  pizza: { base: '#F9DCB8', shaded: '#E76F51', crust: '#E8A94B', line: '#C77F2E' },
  pie: { base: '#DCE7FB', shaded: '#5B7FD6', crust: '#8FB8F0', line: '#5B8CC0' },
  bar: { base: '#FDE9C8', shaded: '#9B7EDE', crust: '#C9A227', line: '#8A6BC9' },
};

/**
 * Original SVG art for a fraction whole. `shaded` is an array of booleans
 * (length = parts) marking shaded slices. `onSliceTap` makes slices
 * interactive for "shade it yourself" rounds. No emoji, ever.
 */
function FractionArt({
  whole,
  shaded,
  onSliceTap,
  interactiveLabel,
}: {
  whole: FractionQuestion['whole'];
  shaded: boolean[];
  onSliceTap?: (index: number) => void;
  interactiveLabel?: string;
}) {
  const parts = shaded.length;
  const pal = PALETTES[whole];

  if (whole === 'bar') {
    const W = 320;
    const segW = W / parts;
    return (
      <svg
        viewBox="0 0 340 120"
        className="h-36 w-full max-w-md md:h-44"
        role={onSliceTap ? 'group' : 'img'}
        aria-label={interactiveLabel ?? `${whole} divided into ${parts} parts`}
      >
        <rect x="6" y="14" width="328" height="92" rx="18" fill={pal.crust} />
        {shaded.map((isShaded, i) => (
          <g
            key={i}
            onClick={onSliceTap ? () => onSliceTap(i) : undefined}
            onKeyDown={
              onSliceTap
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSliceTap(i);
                    }
                  }
                : undefined
            }
            tabIndex={onSliceTap ? 0 : undefined}
            role={onSliceTap ? 'button' : undefined}
            aria-label={onSliceTap ? `Slice ${i + 1} of ${parts}` : undefined}
            className={onSliceTap ? 'cursor-pointer' : undefined}
          >
            <rect
              x={12 + i * segW}
              y="20"
              width={Math.max(2, segW - 5)}
              height="80"
              rx="10"
              fill={isShaded ? pal.shaded : pal.base}
              stroke={pal.line}
              strokeWidth="3"
            />
          </g>
        ))}
      </svg>
    );
  }

  // pizza / pie: circle of slices
  return (
    <svg
      viewBox="0 0 220 220"
      className="h-52 w-52 md:h-64 md:w-64"
      role={onSliceTap ? 'group' : 'img'}
      aria-label={interactiveLabel ?? `${whole} divided into ${parts} parts`}
    >
      <circle cx="110" cy="110" r="102" fill={pal.crust} />
      {shaded.map((isShaded, i) => (
        <g
          key={i}
          onClick={onSliceTap ? () => onSliceTap(i) : undefined}
          onKeyDown={
            onSliceTap
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSliceTap(i);
                  }
                }
              : undefined
          }
          tabIndex={onSliceTap ? 0 : undefined}
          role={onSliceTap ? 'button' : undefined}
          aria-label={onSliceTap ? `Slice ${i + 1} of ${parts}` : undefined}
          className={onSliceTap ? 'cursor-pointer' : undefined}
        >
          <path
            d={slicePath(110, 110, 92, i, parts)}
            fill={isShaded ? pal.shaded : pal.base}
            stroke={pal.line}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
      ))}
      {whole === 'pizza' && (
        <>
          <circle cx="80" cy="80" r="7" fill="#C0392B" />
          <circle cx="140" cy="70" r="7" fill="#C0392B" />
          <circle cx="110" cy="140" r="7" fill="#C0392B" />
        </>
      )}
      {whole === 'pie' && (
        <path d="M60 60 Q110 40 160 60" fill="none" stroke="#3B5BA9" strokeWidth="5" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** Speaker button for non-readers. */
function HearIt({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        playSfx('click');
        speakAs('bea', text);
      }}
      className="flex items-center gap-2 rounded-full bg-white/85 px-5 py-3 text-base font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="#17324F" />
        <path d="M16 8a5 5 0 010 8M18.5 5.5a9 9 0 010 13" stroke="#17324F" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      Hear it
    </button>
  );
}

export default function FractionFair({ childId, nickname = 'friend', onExit }: FractionFairProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions] = useState<FractionQuestion[]>(() =>
    pickSession(Math.floor(Math.random() * 1_000_000)),
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [tapped, setTapped] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [encouragement, setEncouragement] = useState('');
  const [starsEarned, setStarsEarned] = useState(0);
  const [starBalance, setStarBalance] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const timers = useRef<number[]>([]);

  const question = questions[roundIndex];

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

  /** Shaded-array the art should show for the current round. */
  const shownShaded = useMemo(() => {
    if (!question) return [];
    if (question.kind === 'pick') return tapped;
    const arr = new Array<boolean>(question.parts).fill(false);
    for (let i = 0; i < question.shaded; i++) arr[i] = true;
    return arr;
  }, [question, tapped]);

  const promptText = useMemo(() => {
    if (!question) return '';
    const name = fractionName(question.shaded, question.parts);
    if (question.kind === 'shade') return `How much of the ${question.whole} is shaded?`;
    if (question.kind === 'pick') return `Tap the slices to shade ${name}.`;
    return `Share the ${question.whole} fairly between ${question.parts} friends. How much does each friend get?`;
  }, [question]);

  const startGame = useCallback(() => {
    setPhase('play');
    setRoundIndex(0);
    setTapped(new Array(questions[0]?.parts ?? 2).fill(false));
    setFeedback('idle');
    setEncouragement('');
    setStarsEarned(0);
    setFirstTryCorrect(0);
    playSfx('whoosh');
    speakAs('bea', `Welcome to the Fraction Fair, ${nickname}! Let's share yummy treats and learn halves, thirds, and quarters!`);
  }, [nickname, questions]);

  const nextRound = useCallback(
    (wasFirstTry: boolean) => {
      const next = roundIndex + 1;
      if (next >= ROUNDS_PER_GAME) {
        void (async () => {
          const stars = 15;
          setStarsEarned(stars);
          setPhase('won');
          playSfx('fanfare');
          speakAs('bea', `Amazing sharing, ${nickname}! You are a true Fraction Fan! You earned ${stars} stars!`);
          try {
            const balance = await awardStars(childId, stars);
            setStarBalance(balance);
            await bumpQuestProgress(childId, 'fraction_game', 1);
            await awardStickers(childId, ['fraction-fan']);
            await checkTrophies(childId, 'fraction_done').catch(() => {});
            await logLearningEvent(childId, 'milestone', {
              metadata: { kind: 'fraction_fair_win', rounds: ROUNDS_PER_GAME, firstTryCorrect: wasFirstTry ? firstTryCorrect + 1 : firstTryCorrect },
            });
          } catch {
            /* best-effort */
          }
        })();
        return;
      }
      setRoundIndex(next);
      setTapped(new Array(questions[next]?.parts ?? 2).fill(false));
      setFeedback('idle');
      setEncouragement('');
    },
    [roundIndex, questions, childId, nickname, firstTryCorrect],
  );

  const handleCorrect = useCallback(
    (firstTry: boolean) => {
      setFeedback('correct');
      if (firstTry) setFirstTryCorrect((c) => c + 1);
      playSfx('correct');
      speakAs('bea', `${PRAISE[Math.floor(Math.random() * PRAISE.length)]} That's ${fractionName(question.shaded, question.parts)}!`);
      later(1600, () => nextRound(firstTry));
    },
    [later, nextRound, question],
  );

  const handleWrong = useCallback(() => {
    setFeedback('wrong');
    playSfx('wrong');
    const line = TRY_AGAIN[Math.floor(Math.random() * TRY_AGAIN.length)];
    setEncouragement(line);
    speakAs('bea', line);
    later(1400, () => setFeedback('idle'));
  }, [later]);

  const [attempted, setAttempted] = useState(false);

  const chooseFraction = useCallback(
    (choice: string) => {
      if (feedback !== 'idle') return;
      const firstTry = !attempted;
      setAttempted(true);
      if (choice === question.answer) handleCorrect(firstTry);
      else handleWrong();
    },
    [feedback, attempted, question, handleCorrect, handleWrong],
  );

  const toggleSlice = useCallback(
    (index: number) => {
      if (feedback !== 'idle') return;
      playSfx('click');
      setTapped((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        return next;
      });
    },
    [feedback],
  );

  const checkShading = useCallback(() => {
    if (feedback !== 'idle') return;
    const firstTry = !attempted;
    setAttempted(true);
    const count = tapped.filter(Boolean).length;
    if (count === question.shaded) handleCorrect(firstTry);
    else handleWrong();
  }, [feedback, attempted, tapped, question, handleCorrect, handleWrong]);

  useEffect(() => {
    setAttempted(false);
  }, [roundIndex]);

  const shadedCount = tapped.filter(Boolean).length;

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
          <svg viewBox="0 0 220 220" className="h-32 w-32 md:h-40 md:w-40" aria-hidden>
            <circle cx="110" cy="110" r="102" fill="#E8A94B" />
            <path d={slicePath(110, 110, 92, 0, 2)} fill="#E76F51" stroke="#C77F2E" strokeWidth="3" strokeLinejoin="round" />
            <path d={slicePath(110, 110, 92, 1, 2)} fill="#F9DCB8" stroke="#C77F2E" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="80" cy="80" r="7" fill="#C0392B" />
            <circle cx="140" cy="70" r="7" fill="#C0392B" />
          </svg>
          <h1 className="mt-3 text-3xl font-black text-kid-ink-900 md:text-4xl">Fraction Fair</h1>
          <p className="mt-2 text-lg font-bold text-kid-ink-700">
            Share yummy pizzas, pies, and treat bars with Bea! Learn halves, thirds, and quarters.
          </p>
          <button
            type="button"
            onClick={startGame}
            className="mt-6 rounded-full bg-kid-sun-400 px-10 py-4 text-xl font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Start sharing
          </button>
        </div>
      )}

      {phase === 'play' && question && (
        <div className="flex w-full max-w-2xl flex-col items-center px-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Fraction Fair</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Bea</span>
            </div>
            <div className="flex items-center gap-2">
              <HearIt text={promptText} label="Hear the question" />
              <div
                className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg"
                aria-label={`Round ${roundIndex + 1} of ${ROUNDS_PER_GAME}`}
              >
                {roundIndex + 1} / {ROUNDS_PER_GAME}
              </div>
            </div>
          </div>

          <h2 className="mt-4 text-center text-2xl font-black text-kid-ink-900 md:text-3xl">{promptText}</h2>

          <div className={`mt-4 ${feedback === 'wrong' ? 'animate-kid-shake' : ''} ${feedback === 'correct' ? 'animate-kid-pop-in' : ''}`}>
            <FractionArt
              whole={question.whole}
              shaded={shownShaded}
              onSliceTap={question.kind === 'pick' ? toggleSlice : undefined}
              interactiveLabel={
                question.kind === 'pick'
                  ? `Tap slices to shade ${fractionName(question.shaded, question.parts)}`
                  : undefined
              }
            />
          </div>

          {question.kind === 'pick' ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              <p className="text-lg font-black tabular-nums text-kid-ink-900" aria-live="polite">
                Shaded: {shadedCount} of {question.shaded} needed
              </p>
              <button
                type="button"
                onClick={checkShading}
                disabled={feedback !== 'idle'}
                className="min-h-[72px] rounded-full bg-kid-sky-400 px-10 py-3 text-xl font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                Check my shading
              </button>
            </div>
          ) : (
            <div className="mt-4 grid w-full max-w-xl grid-cols-3 gap-3" role="group" aria-label="Fraction choices">
              {question.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => chooseFraction(choice)}
                  disabled={feedback !== 'idle'}
                  className="flex min-h-[72px] flex-col items-center justify-center rounded-kid-card bg-white/90 px-2 py-3 shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-80"
                  aria-label={`${choice}, ${fractionName(Number(choice.split('/')[0]), Number(choice.split('/')[1]))}`}
                >
                  <span className="text-3xl font-black tabular-nums text-kid-ink-900 md:text-4xl">{choice}</span>
                  <span className="text-sm font-bold text-kid-ink-700">
                    {fractionName(Number(choice.split('/')[0]), Number(choice.split('/')[1]))}
                  </span>
                </button>
              ))}
            </div>
          )}

          {encouragement && feedback !== 'correct' && (
            <p className="mt-3 text-center text-lg font-bold text-kid-ink-700" aria-live="polite">
              {encouragement}
            </p>
          )}
        </div>
      )}

      {phase === 'won' && (
        <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
          <svg viewBox="0 0 64 64" className="animate-kid-bounce-soft h-24 w-24 md:h-28 md:w-28" aria-hidden>
            <path
              d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
              fill="#FFC93C"
              stroke="#E09E00"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="mt-3 text-3xl font-black text-kid-ink-900 md:text-4xl">
            Fair and square, {nickname}!
          </h2>
          <p className="mt-2 text-lg font-bold text-kid-ink-700">
            You shared every treat fairly and earned
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-4xl font-black tabular-nums text-kid-ink-900">{starsEarned}</span>
            <span className="text-2xl font-black text-kid-ink-700">stars</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={startGame}
              className="rounded-full bg-kid-sky-400 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={onExit}
              className="rounded-full bg-kid-sun-400 px-8 py-3 text-lg font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Back to the map
            </button>
          </div>
        </div>
      )}
    </KidShell>
  );
}
