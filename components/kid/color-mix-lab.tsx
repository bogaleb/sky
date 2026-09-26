'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PAINT_PALETTE,
  COLOR_DEFS,
  ROUND_LEVELS,
  ROUNDS_PER_GAME,
  generateQuestion,
  mix,
  spokenQuestion,
  type ColorId,
  type ColorQuestion,
} from '@/lib/kid/colors';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen, AnswerFeedbackPanel } from './game-shell';
import KidShell from '@/components/kid/kid-shell';
import { AVATARS } from '@/components/avatars';

export interface ColorMixLabProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'mix' | 'quiz' | 'won';

const SWIRL_MS = 1600;
const CELEBRATE_MS = 2000;
const HOST = 'bea';

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M10 20 h8 l10 -8 v24 l-10 -8 h-8 z" fill="#fff" stroke="#17324F" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 18 q6 6 0 12 M35 13 q10 11 0 22" fill="none" stroke="#17324F" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function PaintBlob({
  color,
  size = 'md',
  selected,
  onTap,
  label,
}: {
  color: ColorId;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onTap?: () => void;
  label: string;
}) {
  const def = COLOR_DEFS[color];
  const sizeCls =
    size === 'lg' ? 'h-28 w-28 md:h-36 md:w-36' : size === 'sm' ? 'h-14 w-14 md:h-16 md:w-16' : 'h-20 w-20 md:h-24 md:w-24';
  const blob = (
    <span
      className={`${sizeCls} inline-block rounded-full border-4 shadow-xl transition-transform ${
        selected ? 'scale-110 border-kid-ink-900' : 'border-white/80'
      }`}
      style={{ background: `radial-gradient(circle at 32% 30%, #ffffff88, transparent 55%), ${def.hex}` }}
      aria-hidden
    />
  );
  if (!onTap) return blob;
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Pick ${def.name} paint`}
      aria-pressed={selected}
      className="min-h-[72px] min-w-[72px] rounded-full transition-transform hover:scale-105 active:scale-95"
    >
      {blob}
      <span className="mt-1 block text-center text-sm font-black text-kid-ink-900">{def.name}</span>
    </button>
  );
}

export default function ColorMixLab({ childId, nickname = 'friend', onExit }: ColorMixLabProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  // Free play.
  const [picked, setPicked] = useState<ColorId[]>([]);
  const [swirling, setSwirling] = useState(false);
  const [mixedResult, setMixedResult] = useState<ColorId | null>(null);
  // Quiz.
  const [questions, setQuestions] = useState<ColorQuestion[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [shakeId, setShakeId] = useState<ColorId | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'color_game',
    stickerId: 'color-wizard',
    trophyEvent: 'color_done',
    milestone: 'color_lab_win',
    learning: { gameId: 'color-mix-lab', skill: 'experiments' },
  });
  const starBalance = session.starBalance ?? 0;
  const timers = useRef<number[]>([]);

  const BeaAvatar = AVATARS.bea.Component;
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

  const startMixing = useCallback(() => {
    setPicked([]);
    setMixedResult(null);
    setSwirling(false);
    setPhase('mix');
    playSfx('whoosh');
    speakAs(HOST, `Welcome to the Color Mix Lab, ${nickname}! Pick two paints and swirl them together!`);
  }, [nickname]);

  const startQuiz = useCallback(() => {
    const seed = Date.now();
    const qs = ROUND_LEVELS.map((level, i) => generateQuestion(level, seed + i * 7919));
    setQuestions(qs);
    setRoundIndex(0);
    setAttempts(0);
    setCelebrating(false);
    setShakeId(null);
    setPhase('quiz');
    playSfx('whoosh');
    const first = qs[0];
    speakAs(HOST, `Quiz time! ${spokenQuestion(first.a, first.b)}`);
  }, []);

  const handleWin = useCallback(async () => {
    const stars = attempts === 0 ? 12 : attempts <= 6 ? 10 : 8;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(HOST, `You are a true color scientist, ${nickname}! You earned ${stars} stars!`);
    await session.complete({ stars, extraMetadata: { attempts, rounds: ROUNDS_PER_GAME } });
  }, [childId, nickname, attempts, session]);

  const advanceQuiz = useCallback(() => {
    if (roundIndex + 1 < questions.length) {
      const next = roundIndex + 1;
      setRoundIndex(next);
      setCelebrating(false);
      const q = questions[next];
      speakAs(HOST, spokenQuestion(q.a, q.b));
    } else {
      void handleWin();
    }
  }, [roundIndex, questions, handleWin]);

  const tapPaint = (color: ColorId) => {
    if (swirling || mixedResult) return;
    playSfx('click');
    const next = picked.includes(color) ? picked.filter((c) => c !== color) : [...picked, color].slice(-2);
    setPicked(next);
    if (next.length === 2) {
      const [a, b] = next;
      const result = mix(a, b);
      setSwirling(true);
      playSfx('pop');
      speakAs(HOST, `Swirl, swirl, swirl! What will ${a} and ${b} make?`);
      later(SWIRL_MS, () => {
        setSwirling(false);
        if (result) {
          setMixedResult(result);
          playSfx('correct');
          speakAs(HOST, `${a} and ${b} make ${result}! Beautiful!`);
        } else {
          setPicked([]);
          playSfx('wrong');
          speakAs(HOST, `Ooh, a mystery mix! Check my recipe book below, ${nickname}, and try red and blue!`);
        }
      });
    }
  };

  const mixAgain = () => {
    setPicked([]);
    setMixedResult(null);
    playSfx('pop');
  };

  const pickChoice = (choice: ColorId) => {
    if (!question || celebrating) return;
    speakAs(HOST, choice);
    session.recordAnswer(choice === question.answer, { itemKey: `${roundIndex}-${question.a}-${question.b}` });
    if (choice === question.answer) {
      setCelebrating(true);
      playSfx('correct');
      speakAs(HOST, `Yes! ${question.a} and ${question.b} make ${question.answer}!`);
      later(CELEBRATE_MS, advanceQuiz);
    } else {
      playSfx('wrong');
      setAttempts((a) => a + 1);
      setShakeId(choice);
      speakAs(HOST, 'Not quite! Look at the paints and try again.');
      later(600, () => setShakeId(null));
    }
  };

  const hearQuestion = () => {
    if (!question) return;
    playSfx('click');
    speakAs(HOST, spokenQuestion(question.a, question.b));
  };

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center text-center">
          <div className="animate-kid-bounce-soft h-32 w-32 md:h-40 md:w-40">
            <BeaAvatar className="h-full w-full" />
          </div>
          <h1 className="animate-kid-rise mt-4 text-4xl font-black text-kid-ink-900 md:text-6xl">
            Color Mix Lab
          </h1>
          <p
            className="animate-kid-rise mt-3 max-w-md text-lg font-bold text-kid-ink-700 md:text-xl"
            style={{ animationDelay: '0.1s' }}
          >
            Swirl paints together and discover brand-new colors — with Bea the bee scientist!
          </p>
          <button
            type="button"
            onClick={startMixing}
            className="animate-kid-rise mt-8 rounded-full bg-kid-sun-400 px-12 py-4 text-2xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
            aria-label="Start mixing colors"
          >
            Start Mixing!
          </button>
        </div>
      )}

      {phase === 'mix' && (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white px-4 py-2 shadow-lg">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Color Mix Lab</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Bea</span>
            </div>
            <button
              type="button"
              onClick={startQuiz}
              className="rounded-full bg-kid-grape-400 px-6 py-2 text-base font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Take the color quiz"
            >
              Quiz me!
            </button>
          </div>

          <h2 className="mt-4 text-center text-2xl font-black text-kid-ink-900 md:text-3xl">
            Pick two paints to mix!
          </h2>

          <div className="mt-6 flex flex-wrap items-start justify-center gap-3 md:gap-4" role="group" aria-label="Paint colors">
            {PAINT_PALETTE.map((color) => (
              <PaintBlob
                key={color}
                color={color}
                label={COLOR_DEFS[color].name}
                selected={picked.includes(color)}
                onTap={() => tapPaint(color)}
              />
            ))}
          </div>

          <div className="mt-8 flex min-h-44 flex-col items-center justify-center" aria-live="polite">
            {swirling && (
              <div className="animate-kid-pop-in flex items-center gap-4">
                <PaintBlob color={picked[0]} size="lg" label={COLOR_DEFS[picked[0]].name} />
                <span className="animate-kid-spin-slow text-5xl font-black text-kid-ink-900" style={{ animationDuration: '0.8s' }} aria-hidden>
                  <svg viewBox="0 0 48 48" className="h-12 w-12">
                    <path d="M24 6 a18 18 0 1 1 -12.7 5.3" fill="none" stroke="#17324F" strokeWidth="5" strokeLinecap="round" />
                    <path d="M8 8 l4 8 8 -4" fill="none" stroke="#17324F" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <PaintBlob color={picked[1]} size="lg" label={COLOR_DEFS[picked[1]].name} />
              </div>
            )}
            {mixedResult && !swirling && (
              <div className="animate-kid-pop-in flex flex-col items-center">
                <PaintBlob color={mixedResult} size="lg" label={COLOR_DEFS[mixedResult].name} />
                <p className="mt-3 text-3xl font-black capitalize text-kid-ink-900 md:text-4xl">
                  {mixedResult}!
                </p>
                <p className="mt-1 text-lg font-bold text-kid-ink-700">
                  {COLOR_DEFS[picked[0]].name} + {COLOR_DEFS[picked[1]].name} = {mixedResult}
                </p>
                <button
                  type="button"
                  onClick={mixAgain}
                  className="mt-4 rounded-full bg-kid-sky-400 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Mix again!
                </button>
              </div>
            )}
            {!swirling && !mixedResult && picked.length > 0 && (
              <p className="text-lg font-bold text-kid-ink-700">Pick one more paint…</p>
            )}
          </div>

          <div className="mt-4 w-full max-w-xl rounded-kid-card bg-white/85 p-4 shadow-lg">
            <h3 className="text-lg font-black text-kid-ink-900">Bea&apos;s recipe book</h3>
            <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-3">
              {[
                ['red', 'blue', 'purple'],
                ['red', 'yellow', 'orange'],
                ['blue', 'yellow', 'green'],
              ].map(([a, b, r]) => (
                <li key={`${a}-${b}`} className="flex items-center gap-2 text-sm font-bold text-kid-ink-700">
                  <span className="h-5 w-5 rounded-full border-2 border-white/70" style={{ background: COLOR_DEFS[a as ColorId].hex }} aria-hidden />
                  <span aria-hidden>+</span>
                  <span className="h-5 w-5 rounded-full border-2 border-white/70" style={{ background: COLOR_DEFS[b as ColorId].hex }} aria-hidden />
                  <span aria-hidden>=</span>
                  <span className="h-5 w-5 rounded-full border-2 border-white/70" style={{ background: COLOR_DEFS[r as ColorId].hex }} aria-hidden />
                  <span className="sr-only">
                    {a} plus {b} makes {r}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {phase === 'quiz' && question && (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white px-4 py-2 shadow-lg">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Color Quiz</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Bea</span>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg md:text-lg">
              {roundIndex + 1} / {questions.length}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 md:gap-6">
            <PaintBlob color={question.a} size="lg" label={COLOR_DEFS[question.a].name} />
            <span className="text-5xl font-black text-kid-ink-900" aria-hidden>
              +
            </span>
            <PaintBlob color={question.b} size="lg" label={COLOR_DEFS[question.b].name} />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <h2 className="text-center text-2xl font-black capitalize text-kid-ink-900 md:text-3xl">
              What do {question.a} and {question.b} make?
            </h2>
            <button
              type="button"
              onClick={hearQuestion}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-kid-sky-400 shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Hear the question"
            >
              <SpeakerIcon className="h-8 w-8" />
            </button>
          </div>

          <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-label="Color choices">
            {question.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => pickChoice(choice)}
                disabled={celebrating}
                aria-label={`Choose ${choice}`}
                className={`flex min-h-[72px] items-center justify-center gap-3 rounded-kid-card border-4 bg-white/95 px-4 py-4 shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:cursor-default ${
                  shakeId === choice ? 'animate-kid-shake border-kid-coral-500' : 'border-kid-sky-400'
                }`}
              >
                <span
                  className="h-10 w-10 shrink-0 rounded-full border-2 border-white/70 shadow"
                  style={{ background: COLOR_DEFS[choice].hex }}
                  aria-hidden
                />
                <span className="text-2xl font-black capitalize text-kid-ink-900">{choice}</span>
              </button>
            ))}
          </div>

          <div className="sr-only" aria-live="polite">
            Round {roundIndex + 1} of {questions.length}
          </div>
        </div>
      )}

      <AnswerFeedbackPanel feedback={session.feedback} />

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Color wizard, ${nickname}!`}
          message={`You mixed ${ROUNDS_PER_GAME} colors and earned`}
          stickerId="color-wizard"
          hostAvatar={<BeaAvatar className="h-24 w-24 md:h-28 md:w-28" />}
          onPlayAgain={startQuiz}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
