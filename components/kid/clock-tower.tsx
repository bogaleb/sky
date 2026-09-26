'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateQuestion,
  handAngles,
  ROUND_LEVELS,
  ROUNDS_PER_GAME,
  timeLines,
  type TimeQuestion,
} from '@/lib/kid/time';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { ageProfile } from '@/lib/kid/age-profile';
import type { AgeBand } from '@/lib/planner/types';
import { useGameSession, GameWinScreen } from './game-shell';
import { AnswerTray, ChoiceCard, choiceStateFor, GameFrame, GameIntro, useTeaching } from './game-frame';
import KidShell from '@/components/kid/kid-shell';

export interface ClockTowerProps {
  childId: string;
  nickname?: string;
  ageBand?: AgeBand;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const HOST = 'tuno';
const CELEBRATE_MS = 2000;
const HOW_TO = 'Tuno shows you a big clock. Read the short hand for the hour and the long hand for the minutes, then tap the right time.';

/** Big analog clock showing the question time. Original SVG art, no emoji. */
function AnalogClock({
  question,
  emphasis = 'none',
}: {
  question: TimeQuestion;
  /** Highlight the hand(s) the hint or worked example talks about. */
  emphasis?: 'none' | 'hour' | 'minute' | 'both';
}) {
  const hourHot = emphasis === 'hour' || emphasis === 'both';
  const minuteHot = emphasis === 'minute' || emphasis === 'both';
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
        stroke={hourHot ? '#FF6B6B' : '#17324F'}
        strokeWidth={hourHot ? 14 : 11}
        strokeLinecap="round"
        transform={`rotate(${hourAngle} ${cx} ${cy})`}
      />
      {/* minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - 88}
        stroke={minuteHot ? '#9B5DE5' : '#2E9BC6'}
        strokeWidth={minuteHot ? 10 : 7}
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

export default function ClockTower({ childId, nickname = 'friend', ageBand, onExit }: ClockTowerProps) {
  const profile = ageProfile(ageBand);
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
      setRoundIndex(index);
      speakAs(HOST, 'What time is it? Look at the clock.');
    },
    [teaching]
  );

  const startGame = useCallback(() => {
    setMistakes(0);
    setAttempts(0);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    startRound(0, Date.now());
  }, [startRound]);

  const handleWin = useCallback(async () => {
    const stars = mistakes === 0 ? 3 : mistakes <= 4 ? 2 : 1;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(HOST, `Wonderful, ${nickname}! You read ${ROUNDS_PER_GAME} clocks! You earned ${stars} stars!`);
    await session.complete({ stars, mistakes, extraMetadata: { attempts } });
  }, [nickname, mistakes, attempts, session]);

  const pickChoice = (choice: string) => {
    if (!question || phase !== 'play' || teaching.state.mode === 'correct') return;
    const correct = choice === question.answer;
    setAttempts((a) => a + 1);
    // Hour / half past / quarter clocks are telling_time levels 2 / 3 / 4.
    session.recordAnswer(correct, { level: question.level + 1, itemKey: roundIndex });
    teaching.judge(correct, choice, timeLines(question), question.choices.length);
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
    return <GameIntro title="Clock Tower" say={HOW_TO} host={HOST} profile={profile} onStart={startGame} onExit={onExit} startLabel="Climb the tower" />;
  }

  if (phase === 'won') {
    return (
      <KidShell onExit={onExit} points={starBalance}>
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Time Keeper, ${nickname}!`}
          message={`You read ${ROUNDS_PER_GAME} clocks!`}
          stickerId="time-keeper"
          onPlayAgain={startGame}
          onExit={onExit}
        />
      </KidShell>
    );
  }

  if (!question) return null;
  const mode = teaching.state.mode;
  return (
    <GameFrame
      title="Clock Tower"
      host={HOST}
      profile={profile}
      onExit={onExit}
      progress={{ current: roundIndex + 1, total: ROUNDS_PER_GAME }}
      prompt={{ text: 'What time is it?', say: 'What time is it? Look at the short hand, then the long hand.' }}
      teaching={teaching.state}
      tray={
        <AnswerTray label="Time choices">
          {question.choices.map((choice) => (
            <ChoiceCard
              key={choice}
              say={choice}
              state={choiceStateFor(teaching.state, choice, question.answer)}
              onPick={() => pickChoice(choice)}
              minHeight={profile.minTarget}
              host={HOST}
            >
              <span className="tabular-nums">{choice}</span>
            </ChoiceCard>
          ))}
        </AnswerTray>
      }
    >
      <div className="rounded-full bg-white/70 p-3 shadow-xl">
        <AnalogClock question={question} emphasis={mode === 'show' ? 'both' : mode === 'hint' ? (question.minute === 0 ? 'hour' : 'minute') : 'none'} />
      </div>
    </GameFrame>
  );
}
