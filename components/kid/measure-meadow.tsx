'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ROUNDS_PER_GAME,
  ROUND_LEVELS,
  generateQuestion,
  type MeasureOption,
  type MeasureQuestion,
} from '@/lib/kid/measure';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen, AnswerFeedbackPanel } from './game-shell';
import KidShell from '@/components/kid/kid-shell';

export interface MeasureMeadowProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const HOST = 'milo';
const CELEBRATE_MS = 1400;

const PALETTES = [
  { main: '#E2574C', dark: '#B23A30', light: '#F49B93', name: 'red' },
  { main: '#4A90D9', dark: '#2F6BA8', light: '#9CC4EE', name: 'blue' },
  { main: '#3FB97F', dark: '#2A8A5C', light: '#93DDB4', name: 'green' },
];

const SUPERLATIVE: Record<MeasureQuestion['kind'], string> = {
  longer: 'longest',
  taller: 'tallest',
  heavier: 'heaviest',
  'holds-more': 'holds the most water',
};

/** Longest/tallest/heaviest ribbon, tower, or scale drop per question. */
function pxPerUnit(question: MeasureQuestion): number {
  const max = Math.max(...question.options.map((o) => o.size));
  return 200 / max;
}

/** Ribbon for 'longer': horizontal bar, segmented into units when mixed. */
function RibbonArt({ option, question }: { option: MeasureOption; question: MeasureQuestion }) {
  const p = PALETTES[option.color];
  const ppu = pxPerUnit(question);
  const h = 46;
  if (option.units) {
    const segW = option.units.def.value * ppu;
    const totalW = option.units.count * segW + (option.units.count - 1) * 5;
    return (
      <svg viewBox={`0 0 ${totalW + 8} ${h + 8}`} width={totalW + 8} height={h + 8} role="img" aria-label={option.label}>
        {Array.from({ length: option.units.count }).map((_, i) => (
          <rect
            key={i}
            x={4 + i * (segW + 5)}
            y={4}
            width={segW}
            height={h}
            rx={i === 0 ? 10 : 3}
            fill={i % 2 === 0 ? p.main : p.light}
            stroke={p.dark}
            strokeWidth="3"
          />
        ))}
        <path
          d={`M${totalW + 4} 4 l14 ${h / 2} l-14 ${h / 2} z`}
          fill={p.main}
          stroke={p.dark}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const w = Math.max(30, option.size * ppu);
  return (
    <svg viewBox={`0 0 ${w + 22} ${h + 8}`} width={w + 22} height={h + 8} role="img" aria-label={option.label}>
      <rect x={4} y={4} width={w} height={h} rx="12" fill={p.main} stroke={p.dark} strokeWidth="3" />
      <rect x={4} y={4} width={Math.min(26, w)} height={h} rx="12" fill={p.dark} opacity="0.45" />
      <path
        d={`M${w + 4} 4 l14 ${h / 2} l-14 ${h / 2} z`}
        fill={p.main}
        stroke={p.dark}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Tower for 'taller': stacked blocks, unit-sized when mixed. */
function TowerArt({ option, question }: { option: MeasureOption; question: MeasureQuestion }) {
  const p = PALETTES[option.color];
  const ppu = pxPerUnit(question);
  const w = 64;
  const baseY = 200;
  if (option.units) {
    const segH = option.units.def.value * ppu;
    const totalH = option.units.count * segH + (option.units.count - 1) * 4;
    return (
      <svg viewBox={`0 0 ${w + 40} ${totalH + 30}`} width={w + 40} height={Math.min(230, totalH + 30)} role="img" aria-label={option.label}>
        {Array.from({ length: option.units.count }).map((_, i) => (
          <rect
            key={i}
            x={20}
            y={14 + i * (segH + 4)}
            width={w}
            height={segH}
            rx="8"
            fill={i % 2 === 0 ? p.main : p.light}
            stroke={p.dark}
            strokeWidth="3"
          />
        ))}
        <path d={`M${20 + w / 2} 14 l10 -12 l10 12 z`} fill="#FFD93C" stroke="#E09E00" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    );
  }
  const h = Math.max(36, option.size * ppu);
  const blocks = Math.max(2, Math.round(h / 34));
  const bh = h / blocks;
  return (
    <svg viewBox={`0 0 ${w + 40} ${h + 44}`} width={w + 40} height={Math.min(244, h + 44)} role="img" aria-label={option.label}>
      {Array.from({ length: blocks }).map((_, i) => (
        <rect
          key={i}
          x={20}
          y={28 + i * bh}
          width={w}
          height={bh - 3}
          rx="8"
          fill={i % 2 === 0 ? p.main : p.light}
          stroke={p.dark}
          strokeWidth="3"
        />
      ))}
      <rect x={8} y={28 + h} width={w + 24} height={12} rx="6" fill="#B08968" stroke="#8A6642" strokeWidth="2.5" />
    </svg>
  );
}

/** Balance scale for 'heavier': the loaded pan drops lower when heavier. */
function ScaleArt({ option, question }: { option: MeasureOption; question: MeasureQuestion }) {
  const p = PALETTES[option.color];
  const max = Math.max(...question.options.map((o) => o.size));
  const drop = 4 + (option.size / max) * 30;
  const cx = 110;
  const beamY = 62;
  const leftX = 42;
  const rightX = 178;
  const leftY = beamY + drop;
  const rightY = beamY - drop * 0.4;

  const objects = option.units
    ? Array.from({ length: option.units.count }).map((_, i) =>
        option.units!.def.unit === 'apple' ? (
          <g key={i}>
            <circle cx={leftX - 16 + (i % 3) * 16} cy={leftY + 44 - Math.floor(i / 3) * 16} r="9" fill="#E2574C" stroke="#B23A30" strokeWidth="2.5" />
            <rect x={leftX - 18 + (i % 3) * 16} y={leftY + 30 - Math.floor(i / 3) * 16} width="4" height="7" rx="2" fill="#7A4A21" />
          </g>
        ) : (
          <ellipse
            key={i}
            cx={leftX - 14 + (i % 4) * 11}
            cy={leftY + 42 - Math.floor(i / 4) * 10}
            rx="8"
            ry="4.5"
            fill="#E8DCC8"
            stroke="#B8A888"
            strokeWidth="2"
            transform={`rotate(-18 ${leftX - 14 + (i % 4) * 11} ${leftY + 42 - Math.floor(i / 4) * 10})`}
          />
        )
      )
    : [
        <circle key="obj" cx={leftX} cy={leftY + 36} r={10 + (option.size / max) * 8} fill={p.main} stroke={p.dark} strokeWidth="3" />,
      ];

  return (
    <svg viewBox="0 0 220 190" width={200} height={173} role="img" aria-label={option.label}>
      <rect x={cx - 26} y={168} width={52} height={12} rx={6} fill="#8A6642" />
      <rect x={cx - 5} y={beamY} width={10} height={172 - beamY} rx={5} fill="#B08968" stroke="#8A6642" strokeWidth="2" />
      <line x1={leftX} y1={leftY} x2={rightX} y2={rightY} stroke="#7A4A21" strokeWidth="7" strokeLinecap="round" />
      <circle cx={cx} cy={beamY} r={8} fill="#FFD93C" stroke="#E09E00" strokeWidth="3" />
      {/* left (loaded) pan */}
      <line x1={leftX} y1={leftY} x2={leftX - 20} y2={leftY + 34} stroke="#7A4A21" strokeWidth="2.5" />
      <line x1={leftX} y1={leftY} x2={leftX + 20} y2={leftY + 34} stroke="#7A4A21" strokeWidth="2.5" />
      <ellipse cx={leftX} cy={leftY + 36} rx={26} ry={8} fill="#C9A227" stroke="#8A6D1A" strokeWidth="2.5" />
      {objects}
      {/* right (empty) pan */}
      <line x1={rightX} y1={rightY} x2={rightX - 20} y2={rightY + 34} stroke="#7A4A21" strokeWidth="2.5" />
      <line x1={rightX} y1={rightY} x2={rightX + 20} y2={rightY + 34} stroke="#7A4A21" strokeWidth="2.5" />
      <ellipse cx={rightX} cy={rightY + 36} rx={26} ry={8} fill="#C9A227" stroke="#8A6D1A" strokeWidth="2.5" />
    </svg>
  );
}

/** Cup for 'holds-more': water fill rises with size. */
function CupArt({ option, question }: { option: MeasureOption; question: MeasureQuestion }) {
  const p = PALETTES[option.color];
  const max = Math.max(...question.options.map((o) => o.size));
  const fillH = 18 + (option.size / max) * 108;
  const cupH = 150;
  const topW = 110;
  const botW = 78;
  return (
    <svg viewBox="0 0 140 170" width={140} height={170} role="img" aria-label={option.label}>
      <clipPath id={`cupclip-${option.id}`}>
        <path d={`M15 12 L${15 + (topW - botW) / 2} ${12 + cupH} L${15 + topW - (topW - botW) / 2} ${12 + cupH} L${15 + topW} 12 Z`} />
      </clipPath>
      <rect
        x={15}
        y={12 + cupH - fillH}
        width={topW}
        height={fillH}
        fill="#4AA8E0"
        opacity="0.85"
        clipPath={`url(#cupclip-${option.id})`}
      />
      <path
        d={`M15 ${12 + cupH - fillH} q12 -8 24 0 t24 0 t24 0 t24 0`}
        fill="none"
        stroke="#BDE3F7"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d={`M15 12 L${15 + (topW - botW) / 2} ${12 + cupH} L${15 + topW - (topW - botW) / 2} ${12 + cupH} L${15 + topW} 12 Z`}
        fill="rgba(255,255,255,0.25)"
        stroke={p.dark}
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OptionArt({ option, question }: { option: MeasureOption; question: MeasureQuestion }) {
  switch (question.kind) {
    case 'longer':
      return <RibbonArt option={option} question={question} />;
    case 'taller':
      return <TowerArt option={option} question={question} />;
    case 'heavier':
      return <ScaleArt option={option} question={question} />;
    case 'holds-more':
      return <CupArt option={option} question={question} />;
  }
}

export default function MeasureMeadow({ childId, nickname = 'friend', onExit }: MeasureMeadowProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [question, setQuestion] = useState<MeasureQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'measure_game',
    stickerId: 'measure-master',
    trophyEvent: 'measure_done',
    milestone: 'measure_meadow_win',
    learning: { gameId: 'measure-meadow', skill: 'measurement' },
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
      setPicked(null);
      setRoundIndex(index);
      speakAs(HOST, `${q.ask} Tap your answer, ${nickname}!`);
    },
    [nickname]
  );

  const startGame = useCallback(() => {
    const seed = Date.now();
    setMistakes(0);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    speakAs(HOST, `Welcome to Measure Meadow, ${nickname}! Let's compare and measure things together!`);
    later(1600, () => startRound(0, seed));
  }, [later, startRound, nickname]);

  const hearIt = useCallback(() => {
    if (!question) return;
    playSfx('click');
    const opts = question.options.map((o) => o.label).join(', ');
    speakAs(HOST, `${question.ask} Your choices are: ${opts}.`);
  }, [question]);

  const handleWin = useCallback(async () => {
    const stars = mistakes === 0 ? 3 : mistakes <= 4 ? 2 : 1;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(HOST, `Measuring complete, ${nickname}! You compared ${ROUNDS_PER_GAME} things! You earned ${stars} stars!`);
    await session.complete({ stars, mistakes, extraMetadata: { rounds: ROUNDS_PER_GAME } });
  }, [childId, nickname, mistakes, session]);

  const pickOption = (id: number) => {
    if (!question || phase !== 'play' || picked !== null) return;
    const option = question.options[id];
    // Two options is "compares two things" (level 1); three or more is ordering (level 2).
    session.recordAnswer(id === question.answer, {
      level: question.options.length <= 2 ? 1 : 2,
      itemKey: roundIndex,
    });
    if (id === question.answer) {
      setPicked(id);
      playSfx('correct');
      speakAs(HOST, `Yes! ${option.label} is the ${SUPERLATIVE[question.kind]}! Great measuring, ${nickname}!`);
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
      setShakeId(id);
      speakAs(HOST, 'Not quite. Look very carefully and try again!');
      later(650, () => setShakeId((s) => (s === id ? null : s)));
    }
  };

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center px-4 text-center">
          <h1 className="font-display animate-kid-rise text-3xl font-black text-kid-ink-900 md:text-5xl">
            Measure Meadow
          </h1>
          <p
            className="animate-kid-rise mt-2 text-lg font-bold text-kid-ink-700 md:text-xl"
            style={{ animationDelay: '0.1s' }}
          >
            Milo needs a measuring helper! Compare ribbons, towers, scales, and cups — and watch out for tricky units!
          </p>
          <button
            type="button"
            onClick={startGame}
            className="animate-kid-rise mt-6 min-h-[72px] rounded-full bg-kid-sun-400 px-10 py-4 text-2xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
          >
            Start measuring
          </button>
        </div>
      )}

      {phase === 'play' && question && (
        <div className="flex w-full max-w-4xl flex-col items-center px-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white px-4 py-2 shadow-lg">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Measure Meadow</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Milo</span>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg md:text-lg">
              {roundIndex + 1} / {ROUNDS_PER_GAME}
            </div>
          </div>

          <div className="mt-4 flex w-full flex-col items-center gap-4">
            <p className="text-center text-2xl font-black text-kid-ink-900 md:text-3xl">{question.ask}</p>
            <button
              type="button"
              onClick={hearIt}
              className="min-h-[72px] rounded-full bg-white/85 px-6 py-3 text-lg font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Hear the question read aloud"
            >
              Hear it
            </button>
            <div
              className="flex w-full flex-col items-stretch justify-center gap-4 md:flex-row md:items-end md:gap-6"
              role="group"
              aria-label="Measurement choices"
            >
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => pickOption(option.id)}
                  disabled={picked !== null}
                  aria-label={`Choose ${option.label}`}
                  className={`flex min-h-[72px] flex-1 flex-col items-center justify-end gap-2 rounded-kid-card border-4 px-4 py-4 shadow-xl transition-transform active:scale-95 ${
                    picked === option.id
                      ? 'border-kid-sun-400 bg-kid-sun-200'
                      : shakeId === option.id
                        ? 'animate-kid-shake border-kid-coral-500 bg-white'
                        : 'border-kid-sky-300 bg-white hover:scale-105'
                  }`}
                >
                  <OptionArt option={option} question={question} />
                  <span className="text-lg font-black text-kid-ink-900 md:text-xl">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnswerFeedbackPanel feedback={session.feedback} />

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Measure Master, ${nickname}!`}
          message={`You compared ${ROUNDS_PER_GAME} things!`}
          stickerId="measure-master"
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
