'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateQuestion,
  handAngles,
  ROUND_LEVELS,
  ROUNDS_PER_GAME,
  type TimeQuestion,
} from '@/lib/kid/time';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen, AnswerFeedbackPanel } from './game-shell';
import KidShell from '@/components/kid/kid-shell';

export interface ClockTowerProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const HOST = 'tuno';
const CELEBRATE_MS = 1400;

/** Big analog clock showing the question time. Original SVG art, no emoji. */
function AnalogClock({ question }: { question: TimeQuestion }) {
  const { hourAngle, minuteAngle } = handAngles(question.hour, question.minute);
  const cx = 120;
  const cy = 120;
  return (
    <svg
      viewBox="0 0 240 240"
      className="h-56 w-56 md:h-72 md:w-72"
      role="img"
      aria-label={`Clock showing ${question.spoken}`}
    >
      <circle cx={cx} cy={cy} r="112" fill="#FFFDF5" stroke="#17324F" strokeWidth="6" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        const major = i % 3 === 0;
        const r1 = major ? 92 : 100;
        const r2 = 106;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r2}
            y2={cy + Math.sin(a) * r2}
            stroke="#17324F"
            strokeWidth={major ? 7 : 4}
            strokeLinecap="round"
          />
        );
      })}
      <text x={cx} y={52} textAnchor="middle" fontSize="26" fontWeight="900" fill="#17324F">12</text>
      <text x={196} y={130} textAnchor="middle" fontSize="26" fontWeight="900" fill="#17324F">3</text>
      <text x={cx} y={216} textAnchor="middle" fontSize="26" fontWeight="900" fill="#17324F">6</text>
      <text x={44} y={130} textAnchor="middle" fontSize="26" fontWeight="900" fill="#17324F">9</text>
      {/* hour hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - 58}
        stroke="#17324F"
        strokeWidth="11"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} ${cx} ${cy})`}
      />
      {/* minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - 88}
        stroke="#2E9BC6"
        strokeWidth="7"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} ${cx} ${cy})`}
      />
      <circle cx={cx} cy={cy} r="10" fill="#FF8C42" stroke="#D96C1E" strokeWidth="3" />
      {/* friendly face */}
      <circle cx={cx - 24} cy={cy + 62} r="5" fill="#17324F" />
      <circle cx={cx + 24} cy={cy + 62} r="5" fill="#17324F" />
      <path d={`M${cx - 14} ${cy + 76} Q${cx} ${cy + 86} ${cx + 14} ${cy + 76}`} stroke="#17324F" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function ClockTower({ childId, nickname = 'friend', onExit }: ClockTowerProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [question, setQuestion] = useState<TimeQuestion | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'time_game',
    stickerId: 'time-keeper',
    trophyEvent: 'time_done',
    milestone: 'clock_tower_win',
    learning: { gameId: 'clock-tower', skill: 'telling_time' },
  });
  const starBalance = session.starBalance ?? 0;
  const [picked, setPicked] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
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
      speakAs(HOST, `What time is it, ${nickname}? Look at the big clock and tap the right time.`);
    },
    [nickname]
  );

  const startGame = useCallback(() => {
    const seed = Date.now();
    setMistakes(0);
    setAttempts(0);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    speakAs(HOST, `Welcome to the Clock Tower, ${nickname}! Take your time and read the clock slowly.`);
    later(1600, () => startRound(0, seed));
  }, [later, startRound]);

  const hearIt = useCallback(() => {
    if (question) speakAs(HOST, `The clock says ${question.spoken}.`);
  }, [question]);

  const handleWin = useCallback(async () => {
    const stars = mistakes === 0 ? 3 : mistakes <= 4 ? 2 : 1;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(HOST, `Wonderful, ${nickname}! You read ${ROUNDS_PER_GAME} clocks! You earned ${stars} stars!`);
    await session.complete({ stars, mistakes, extraMetadata: { attempts } });
  }, [childId, nickname, mistakes, attempts, session]);

  const pickChoice = (choice: string) => {
    if (!question || phase !== 'play') return;
    setAttempts((a) => a + 1);
    // Hour / half past / quarter clocks are telling_time levels 2 / 3 / 4.
    session.recordAnswer(choice === question.answer, { level: question.level + 1, itemKey: roundIndex });
    if (choice === question.answer) {
      setPicked(choice);
      playSfx('fanfare');
      speakAs(HOST, `Yes! ${question.spoken}! Great reading, ${nickname}!`);
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
      speakAs(HOST, 'Not quite. Look at the clock again — take your time.');
      later(650, () => setShakeId((s) => (s === choice ? null : s)));
    }
  };

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center px-4 text-center">
          <h1 className="animate-kid-rise text-3xl font-black text-kid-ink-900 md:text-5xl">Clock Tower</h1>
          <p className="animate-kid-rise mt-2 text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
            Tuno will show you big clocks. Read each one and tap the right time.
          </p>
          <button
            type="button"
            onClick={startGame}
            className="animate-kid-rise mt-6 min-h-[72px] rounded-full bg-kid-sky-400 px-10 py-4 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
          >
            Climb the tower
          </button>
        </div>
      )}

      {phase === 'play' && question && (
        <div className="flex w-full max-w-2xl flex-col items-center px-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white px-4 py-2 shadow-lg">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Clock Tower</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Tuno</span>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg md:text-lg">
              {roundIndex + 1} / {ROUNDS_PER_GAME}
            </div>
          </div>

          <div className="mt-4 flex w-full flex-col items-center gap-4 md:flex-row md:justify-center md:gap-8">
            <AnalogClock question={question} />
            <div className="flex flex-col items-center gap-3">
              <p className="text-center text-2xl font-black text-kid-ink-900 md:text-3xl">What time is it?</p>
              <button
                type="button"
                onClick={hearIt}
                className="min-h-[72px] rounded-full bg-white/85 px-6 py-3 text-lg font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label="Hear the time spoken"
              >
                Hear it
              </button>
              <div className="flex flex-col gap-3" role="group" aria-label="Time choices">
                {question.choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => pickChoice(choice)}
                    disabled={picked !== null}
                    aria-label={`Time ${choice}`}
                    className={`min-h-[72px] min-w-[180px] rounded-kid-card border-4 px-8 py-3 text-3xl font-black tabular-nums shadow-xl transition-transform active:scale-95 ${
                      picked === choice
                        ? 'border-kid-sun-400 bg-kid-sun-200 text-kid-ink-900'
                        : shakeId === choice
                          ? 'animate-kid-shake border-kid-coral-500 bg-white text-kid-ink-900'
                          : 'border-kid-sky-300 bg-white text-kid-ink-900 hover:scale-105'
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <AnswerFeedbackPanel feedback={session.feedback} />

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Time Keeper, ${nickname}!`}
          message={`You read ${ROUNDS_PER_GAME} clocks!`}
          stickerId="time-keeper"
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
