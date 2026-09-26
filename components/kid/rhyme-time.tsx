'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pickSession, rhymeLines, ROUNDS_PER_GAME, type RhymeRound } from '@/lib/kid/rhymes';
import { playSfx, speakAs, stopSpeaking } from '@/lib/kid/audio';
import { ageProfile } from '@/lib/kid/age-profile';
import type { AgeBand } from '@/lib/planner/types';
import { useGameSession, GameWinScreen } from './game-shell';
import { choiceStateFor, DragToSlot, GameFrame, GameIntro, useTeaching } from './game-frame';
import { ListenButton } from './ui/talk';
import KidShell from '@/components/kid/kid-shell';

export interface RhymeTimeProps {
  childId: string;
  nickname?: string;
  ageBand?: AgeBand;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const CELEBRATE_MS = 2200;
const HOST = 'luna';
const HOW_TO = 'Find the word that rhymes. Drag it into the boat, or just tap it. Tap a speaker to hear any word.';

export default function RhymeTime({ childId, nickname = 'friend', ageBand, onExit }: RhymeTimeProps) {
  const profile = ageProfile(ageBand);
  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds, setRounds] = useState<RhymeRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'rhyme_game',
    stickerId: 'rhyme-star',
    trophyEvent: 'rhyme_done',
    milestone: 'rhyme_time_win',
    learning: { gameId: 'rhyme-time', skill: 'rhyming' },
  });
  const { logSupport } = session;
  const teaching = useTeaching({ profile, host: HOST, onSupport: logSupport });
  const starBalance = session.starBalance ?? 0;
  const timers = useRef<number[]>([]);
  const round = rounds[roundIndex];

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
    const next = pickSession(Date.now());
    setRounds(next);
    setRoundIndex(0);
    setAttempts(0);
    teaching.next();
    setPhase('play');
    playSfx('whoosh');
    later(400, () => speakAs(HOST, `Which word rhymes with ${next[0].prompt}?`));
  }, [later, teaching]);

  const handleWin = useCallback(async () => {
    const stars = attempts === 0 ? 12 : attempts <= 6 ? 10 : 8;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(HOST, `You are a rhyming star, ${nickname}! You earned ${stars} stars!`);
    await session.complete({ stars, extraMetadata: { attempts, rounds: ROUNDS_PER_GAME } });
  }, [session, nickname, attempts]);

  const advance = useCallback(() => {
    teaching.next();
    if (roundIndex + 1 < rounds.length) {
      const next = roundIndex + 1;
      setRoundIndex(next);
      speakAs(HOST, `Which word rhymes with ${rounds[next].prompt}?`);
    } else {
      void handleWin();
    }
  }, [roundIndex, rounds, handleWin, teaching]);

  const pickChoice = (choice: string) => {
    if (!round || teaching.state.mode === 'correct') return;
    const correct = choice === round.answer;
    // Three spoken choices: rhyming level 3. First pick per round counts.
    session.recordAnswer(correct, { level: 3, itemKey: `${roundIndex}-${round.prompt}` });
    teaching.judge(correct, choice, rhymeLines(round), round.choices.length);
    if (correct) later(CELEBRATE_MS, advance);
    else setAttempts((a) => a + 1);
  };

  if (phase === 'intro') {
    return <GameIntro title="Rhyme Time" say={HOW_TO} host={HOST} profile={profile} onStart={startGame} onExit={onExit} startLabel="Let's rhyme!" />;
  }

  if (phase === 'won') {
    return (
      <KidShell onExit={onExit} points={starBalance}>
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Rhyming star, ${nickname}!`}
          message={`You found ${ROUNDS_PER_GAME} rhymes`}
          stickerId="rhyme-star"
          onPlayAgain={startGame}
          onExit={onExit}
        />
      </KidShell>
    );
  }

  if (!round) return null;
  const solved = teaching.state.mode === 'correct';
  return (
    <GameFrame
      title="Rhyme Time"
      host={HOST}
      profile={profile}
      onExit={onExit}
      progress={{ current: roundIndex + 1, total: rounds.length }}
      prompt={{ text: `Which word rhymes with ${round.prompt}?`, say: `Which word rhymes with ${round.prompt}?` }}
      teaching={teaching.state}
    >
      <DragToSlot
        items={round.choices.map((c) => ({ key: c, say: c, content: <span className="uppercase tracking-wide">{c}</span> }))}
        onDrop={pickChoice}
        stateFor={(k) => choiceStateFor(teaching.state, k, round.answer)}
        minHeight={profile.minTarget}
        host={HOST}
        slotLabel={`The rhyme boat for ${round.prompt}`}
        slot={
          <div className="flex flex-wrap items-center justify-center gap-3 py-3">
            <span className="text-5xl font-black uppercase tracking-wide text-kid-grape-600 md:text-6xl">{round.prompt}</span>
            <ListenButton say={round.prompt} character={HOST} size={52} tone="sky" label={`Hear ${round.prompt}`} />
            <span className="text-4xl font-black text-kid-ink-400" aria-hidden>
              +
            </span>
            <span
              className={`min-w-[5ch] rounded-2xl border-4 px-3 py-1 text-center text-4xl font-black uppercase md:text-5xl ${
                solved ? 'border-kid-mint-600 bg-kid-mint-200 text-kid-ink-900' : 'border-dashed border-kid-sky-300 text-kid-sky-300'
              }`}
            >
              {solved ? round.answer : '?'}
            </span>
          </div>
        }
      />
    </GameFrame>
  );
}
