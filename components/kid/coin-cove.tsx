'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COIN_DEFS,
  ROUND_LEVELS,
  ROUNDS_PER_GAME,
  generateQuestion,
  moneyLines,
  spokenCents,
  totalCents,
  type CoinId,
  type MoneyQuestion,
} from '@/lib/kid/money';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { ageProfile } from '@/lib/kid/age-profile';
import type { AgeBand } from '@/lib/planner/types';
import { useGameSession, GameWinScreen } from './game-shell';
import { AnswerTray, ChoiceCard, choiceStateFor, GameFrame, GameIntro, useTeaching } from './game-frame';
import KidShell from '@/components/kid/kid-shell';

export interface CoinCoveProps {
  childId: string;
  nickname?: string;
  ageBand?: AgeBand;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const HOST = 'milo';
const CELEBRATE_MS = 2000;
const HOW_TO = 'Milo found treasure! Tap each coin to count it, then tap how much money there is.';

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

export default function CoinCove({ childId, nickname = 'friend', ageBand, onExit }: CoinCoveProps) {
  const profile = ageProfile(ageBand);
  // Gradual release: younger children count with a running total shown and
  // spoken (support); independent counters (7–8) keep the total in their head.
  const scaffoldTotal = profile.band !== '7-8';
  const [phase, setPhase] = useState<Phase>('intro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [question, setQuestion] = useState<MoneyQuestion | null>(null);
  const [counted, setCounted] = useState<boolean[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'money_game',
    stickerId: 'money-master',
    trophyEvent: 'money_done',
    milestone: 'coin_cove_win',
    learning: { gameId: 'coin-cove', skill: 'money' },
  });
  const { logSupport } = session;
  const teaching = useTeaching({ profile, host: HOST, onSupport: logSupport });
  const starBalance = session.starBalance ?? 0;
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
      teaching.next();
      setQuestion(q);
      setCounted(new Array(q.coins.length).fill(false));
      setRoundIndex(index);
      speakAs(HOST, 'Tap each coin to count it. Then tell me how much money we have.');
    },
    [teaching]
  );

  const startGame = useCallback(() => {
    setMistakes(0);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    startRound(0, Date.now());
  }, [startRound]);

  const tapCoin = (index: number) => {
    if (!question || phase !== 'play' || counted[index]) return;
    const next = [...counted];
    next[index] = true;
    setCounted(next);
    playSfx('click');
    const def = COIN_DEFS[question.coins[index]];
    if (scaffoldTotal) {
      const soFar = totalCents(question.coins.filter((_, i) => next[i]));
      speakAs(HOST, `${def.name}! ${spokenCents(def.value)}. We have ${spokenCents(soFar)} so far.`);
    } else {
      speakAs(HOST, `${def.name}. ${spokenCents(def.value)}.`);
    }
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
  }, [nickname, mistakes, session]);

  const pickChoice = (choice: number) => {
    if (!question || phase !== 'play' || teaching.state.mode === 'correct') return;
    const correct = choice === question.answer;
    // With the running total shown the child is counting WITH support, so it
    // is weaker evidence: one level lower than an unsupported count.
    session.recordAnswer(correct, { level: scaffoldTotal ? question.level : question.level + 1, itemKey: roundIndex });
    teaching.judge(correct, String(choice), moneyLines(question), question.choices.length);
    if (correct) {
      later(CELEBRATE_MS, () => {
        if (roundIndex + 1 < ROUNDS_PER_GAME) {
          startRound(roundIndex + 1, Date.now() + (roundIndex + 1) * 7919);
        } else {
          void handleWin();
        }
      });
    } else {
      setMistakes((m) => m + 1);
    }
  };

  if (phase === 'intro') {
    return (
      <GameIntro title="Coin Cove" say={HOW_TO} host={HOST} profile={profile} onStart={startGame} onExit={onExit} startLabel="Count the treasure" />
    );
  }

  if (phase === 'won') {
    return (
      <KidShell onExit={onExit} points={starBalance}>
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Money Master, ${nickname}!`}
          message={`You counted ${ROUNDS_PER_GAME} piles of treasure!`}
          stickerId="money-master"
          onPlayAgain={startGame}
          onExit={onExit}
        />
      </KidShell>
    );
  }

  if (!question) return null;
  const showTally = scaffoldTotal || teaching.state.mode === 'show';
  return (
    <GameFrame
      title="Coin Cove"
      host={HOST}
      profile={profile}
      onExit={onExit}
      progress={{ current: roundIndex + 1, total: ROUNDS_PER_GAME }}
      prompt={
        allCounted
          ? { text: 'How much money is it?', say: 'How much money is it? Tap the right amount.' }
          : { text: 'Tap each coin to count it', say: 'Tap each coin to count it.' }
      }
      teaching={teaching.state}
      tray={
        allCounted ? (
          <AnswerTray label="Total choices">
            {question.choices.map((choice) => (
              <ChoiceCard
                key={choice}
                say={spokenCents(choice)}
                state={choiceStateFor(teaching.state, String(choice), String(question.answer))}
                onPick={() => pickChoice(choice)}
                minHeight={profile.minTarget}
                host={HOST}
              >
                <span className="tabular-nums">{choice}¢</span>
              </ChoiceCard>
            ))}
          </AnswerTray>
        ) : undefined
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex flex-wrap items-center justify-center gap-3 rounded-kid-card bg-white/70 p-4 shadow-xl md:gap-4"
          role="group"
          aria-label="Coins to count"
        >
          {question.coins.map((coin, i) => (
            <button
              key={i}
              type="button"
              onClick={() => tapCoin(i)}
              disabled={counted[i]}
              aria-label={counted[i] ? `${COIN_DEFS[coin].name} counted` : `Count the ${COIN_DEFS[coin].name}`}
              className="kid-press flex items-center justify-center rounded-full p-1 disabled:cursor-default"
              style={{ minWidth: profile.minTarget, minHeight: profile.minTarget }}
            >
              <CoinArt coin={coin} counted={counted[i]} />
            </button>
          ))}
        </div>
        {showTally && (
          <div className="rounded-full bg-white px-6 py-2 text-2xl font-black tabular-nums text-kid-ink-900 shadow-lg" aria-live="polite">
            {teaching.state.mode === 'show' ? `Total: ${question.answer}¢` : `Counted so far: ${countedTotal}¢`}
          </div>
        )}
      </div>
    </GameFrame>
  );
}
