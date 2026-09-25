'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COIN_DEFS,
  ROUND_LEVELS,
  ROUNDS_PER_GAME,
  generateQuestion,
  spokenCents,
  totalCents,
  type CoinId,
  type MoneyQuestion,
} from '@/lib/kid/money';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen } from './game-shell';
import KidShell from '@/components/kid/kid-shell';

export interface CoinCoveProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const HOST = 'milo';
const CELEBRATE_MS = 1400;

/** Original coin art per denomination. No emoji, ever. */
function CoinArt({ coin, counted }: { coin: CoinId; counted: boolean }) {
  const def = COIN_DEFS[coin];
  const size = coin === 'quarter' ? 96 : coin === 'dime' ? 64 : 80;
  const palette =
    coin === 'penny'
      ? { face: '#E8965A', edge: '#B96A2E', text: '#7A3F14' }
      : { face: '#DDE6EC', edge: '#9AA9B5', text: '#4A5A66' };
  const r = size / 2;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={counted ? `${def.name}, counted` : def.name}
      className={counted ? 'opacity-90' : undefined}
    >
      <circle cx={r} cy={r} r={r - 2} fill={palette.face} stroke={palette.edge} strokeWidth="4" />
      <circle
        cx={r}
        cy={r}
        r={r - 10}
        fill="none"
        stroke={palette.edge}
        strokeWidth="2.5"
        strokeDasharray="5 5"
        opacity="0.8"
      />
      <text
        x={r}
        y={r + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.32}
        fontWeight="900"
        fill={palette.text}
        fontFamily="system-ui, sans-serif"
      >
        {def.value}
      </text>
      <text
        x={r}
        y={r + size * 0.28}
        textAnchor="middle"
        fontSize={size * 0.14}
        fontWeight="800"
        fill={palette.text}
        fontFamily="system-ui, sans-serif"
      >
        {def.value}¢
      </text>
      {counted && (
        <g>
          <circle cx={size - 14} cy={14} r="12" fill="#22C55E" stroke="#15803D" strokeWidth="2.5" />
          <path
            d={`M${size - 20} 14 l4.5 4.5 l8 -9`}
            stroke="#fff"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

export default function CoinCove({ childId, nickname = 'friend', onExit }: CoinCoveProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [question, setQuestion] = useState<MoneyQuestion | null>(null);
  const [counted, setCounted] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'money_game',
    stickerId: 'money-master',
    trophyEvent: 'money_done',
    milestone: 'coin_cove_win',
  });
  const starBalance = session.starBalance ?? 0;
  const [shakeId, setShakeId] = useState<number | null>(null);
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

  const startRound = useCallback(
    (index: number, seed: number) => {
      const q = generateQuestion(ROUND_LEVELS[index], seed);
      setQuestion(q);
      setCounted(new Array(q.coins.length).fill(false));
      setPicked(null);
      setRoundIndex(index);
      speakAs(HOST, `Tap each coin to count it, ${nickname}! Then tell me how much money we have.`);
    },
    [nickname]
  );

  const startGame = useCallback(() => {
    const seed = Date.now();
    setMistakes(0);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    speakAs(HOST, `Welcome to Coin Cove, ${nickname}! Count the shiny coins with me!`);
    later(1600, () => startRound(0, seed));
  }, [later, startRound]);

  const tapCoin = (index: number) => {
    if (!question || phase !== 'play' || counted[index]) return;
    const next = [...counted];
    next[index] = true;
    setCounted(next);
    playSfx('click');
    const def = COIN_DEFS[question.coins[index]];
    const soFar = totalCents(question.coins.filter((_, i) => next[i]));
    speakAs(HOST, `${def.name}! ${spokenCents(def.value)}. We have ${spokenCents(soFar)} so far.`);
  };

  const allCounted = question !== null && counted.length > 0 && counted.every(Boolean);
  const countedTotal = question ? totalCents(question.coins.filter((_, i) => counted[i])) : 0;

  const handleWin = useCallback(async () => {
    const stars = mistakes === 0 ? 3 : mistakes <= 4 ? 2 : 1;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(HOST, `Treasure counted, ${nickname}! You counted ${ROUNDS_PER_GAME} piles of coins! You earned ${stars} stars!`);
    await session.complete({ stars, mistakes, extraMetadata: { rounds: ROUNDS_PER_GAME } });
  }, [childId, nickname, mistakes, session]);

  const pickChoice = (choice: number) => {
    if (!question || phase !== 'play' || picked !== null) return;
    if (choice === question.answer) {
      setPicked(choice);
      playSfx('fanfare');
      speakAs(HOST, `Yes! ${spokenCents(choice)}! Great counting, ${nickname}!`);
      later(CELEBRATE_MS, () => {
        if (roundIndex + 1 < ROUNDS_PER_GAME) {
          startRound(roundIndex + 1, Date.now() + (roundIndex + 1) * 7919);
        } else {
          void handleWin();
        }
      });
    } else {
      playSfx('wrong');
      setMistakes((m) => m + 1);
      setShakeId(choice);
      speakAs(HOST, 'Not quite. Count the coins again — tap each one slowly.');
      later(650, () => setShakeId((s) => (s === choice ? null : s)));
    }
  };

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center px-4 text-center">
          <h1 className="animate-kid-rise text-3xl font-black text-kid-ink-900 md:text-5xl">Coin Cove</h1>
          <p className="animate-kid-rise mt-2 text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
            Milo found a treasure chest! Tap each coin to count it, then say how much money we have.
          </p>
          <button
            type="button"
            onClick={startGame}
            className="animate-kid-rise mt-6 min-h-[72px] rounded-full bg-kid-sun-400 px-10 py-4 text-2xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
          >
            Count the treasure
          </button>
        </div>
      )}

      {phase === 'play' && question && (
        <div className="flex w-full max-w-2xl flex-col items-center px-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Coin Cove</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Milo</span>
            </div>
            <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
              {roundIndex + 1} / {ROUNDS_PER_GAME}
            </div>
          </div>

          <div className="mt-4 flex w-full flex-col items-center gap-3">
            <p className="text-center text-2xl font-black text-kid-ink-900 md:text-3xl">
              {allCounted ? 'How much money is it?' : 'Tap each coin to count it'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4" role="group" aria-label="Coins to count">
              {question.coins.map((coin, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => tapCoin(i)}
                  disabled={counted[i]}
                  aria-label={counted[i] ? `${COIN_DEFS[coin].name} counted` : `Count the ${COIN_DEFS[coin].name}`}
                  className="min-h-[72px] min-w-[72px] rounded-full p-1 transition-transform active:scale-90 disabled:cursor-default"
                  style={{ transform: counted[i] ? 'scale(0.92)' : undefined }}
                >
                  <CoinArt coin={coin} counted={counted[i]} />
                </button>
              ))}
            </div>
            <div
              className="rounded-full bg-white/85 px-6 py-2 text-xl font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-2xl"
              aria-live="polite"
            >
              Counted so far: {countedTotal}¢
            </div>

            {allCounted && (
              <div className="mt-2 flex flex-col gap-3" role="group" aria-label="Total choices">
                {question.choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => pickChoice(choice)}
                    disabled={picked !== null}
                    aria-label={`${choice} cents`}
                    className={`min-h-[72px] min-w-[180px] rounded-kid-card border-4 px-8 py-3 text-3xl font-black tabular-nums shadow-xl transition-transform active:scale-95 ${
                      picked === choice
                        ? 'border-kid-sun-400 bg-kid-sun-200 text-kid-ink-900'
                        : shakeId === choice
                          ? 'animate-kid-shake border-kid-coral-500 bg-white text-kid-ink-900'
                          : 'border-kid-sky-300 bg-white text-kid-ink-900 hover:scale-105'
                    }`}
                  >
                    {choice}¢
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Money Master, ${nickname}!`}
          message={`You counted ${ROUNDS_PER_GAME} piles of treasure!`}
          stickerId="money-master"
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
