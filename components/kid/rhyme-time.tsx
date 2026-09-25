'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pickSession, ROUNDS_PER_GAME, type RhymeRound } from '@/lib/kid/rhymes';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen } from './game-shell';
import KidShell from '@/components/kid/kid-shell';
import { AVATARS } from '@/components/avatars';

export interface RhymeTimeProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const CELEBRATE_MS = 2000;
const HOST = 'luna';

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M10 20 h8 l10 -8 v24 l-10 -8 h-8 z" fill="#fff" stroke="#17324F" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 18 q6 6 0 12 M35 13 q10 11 0 22" fill="none" stroke="#17324F" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function HearButton({ word, label }: { word: string; label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        playSfx('click');
        speakAs(HOST, word);
      }}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-kid-sky-400 shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label={label}
    >
      <SpeakerIcon className="h-8 w-8" />
    </button>
  );
}

export default function RhymeTime({ childId, nickname = 'friend', onExit }: RhymeTimeProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds, setRounds] = useState<RhymeRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [shakeWord, setShakeWord] = useState<string | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'rhyme_game',
    stickerId: 'rhyme-star',
    trophyEvent: 'rhyme_done',
    milestone: 'rhyme_time_win',
  });
  const starBalance = session.starBalance ?? 0;
  const timers = useRef<number[]>([]);

  const LunaAvatar = AVATARS.luna.Component;
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
    const session = pickSession(Date.now());
    setRounds(session);
    setRoundIndex(0);
    setAttempts(0);
    setCelebrating(false);
    setShakeWord(null);
    setPhase('play');
    playSfx('whoosh');
    speakAs(
      HOST,
      `Welcome to Rhyme Time, ${nickname}! Tap the speaker to hear each word, then find the rhyme!`
    );
    later(2200, () => speakAs(HOST, `Which word rhymes with ${session[0].prompt}?`));
  }, [nickname, later]);

  const handleWin = useCallback(async () => {
    const stars = attempts === 0 ? 12 : attempts <= 6 ? 10 : 8;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(HOST, `You are a rhyming star, ${nickname}! You earned ${stars} stars!`);
    await session.complete({ stars, extraMetadata: { attempts, rounds: ROUNDS_PER_GAME } });
  }, [session, nickname, attempts]);

  const advance = useCallback(() => {
    if (roundIndex + 1 < rounds.length) {
      const next = roundIndex + 1;
      setRoundIndex(next);
      setCelebrating(false);
      speakAs(HOST, `Which word rhymes with ${rounds[next].prompt}?`);
    } else {
      void handleWin();
    }
  }, [roundIndex, rounds, handleWin]);

  const pickChoice = (choice: string) => {
    if (!round || celebrating) return;
    // Every tap previews the word aloud so non-readers can play.
    speakAs(HOST, choice);
    if (choice === round.answer) {
      setCelebrating(true);
      playSfx('correct');
      speakAs(HOST, `Yes! ${round.prompt} rhymes with ${round.answer}!`);
      later(CELEBRATE_MS, advance);
    } else {
      playSfx('wrong');
      setAttempts((a) => a + 1);
      setShakeWord(choice);
      speakAs(HOST, `Hmm, ${choice} does not rhyme with ${round.prompt}. Listen again and try!`);
      later(600, () => setShakeWord(null));
    }
  };

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center text-center">
          <div className="animate-kid-bounce-soft h-32 w-32 md:h-40 md:w-40">
            <LunaAvatar className="h-full w-full" />
          </div>
          <h1 className="animate-kid-rise mt-4 text-4xl font-black text-kid-ink-900 md:text-6xl">
            Rhyme Time
          </h1>
          <p
            className="animate-kid-rise mt-3 max-w-md text-lg font-bold text-kid-ink-700 md:text-xl"
            style={{ animationDelay: '0.1s' }}
          >
            Tap the speaker to hear every word, then find the one that rhymes — with Luna the reading owl!
          </p>
          <button
            type="button"
            onClick={startGame}
            className="animate-kid-rise mt-8 rounded-full bg-kid-grape-400 px-12 py-4 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
            aria-label="Start Rhyme Time"
          >
            Let&apos;s Rhyme!
          </button>
        </div>
      )}

      {phase === 'play' && round && (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Rhyme Time</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Luna</span>
            </div>
            <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
              {roundIndex + 1} / {rounds.length}
            </div>
          </div>

          <h2 className="mt-6 text-center text-2xl font-black text-kid-ink-900 md:text-3xl">
            Which word rhymes with…
          </h2>

          <div className="animate-kid-pop-in mt-4 flex items-center gap-4 rounded-kid-card bg-white/95 px-8 py-5 shadow-2xl">
            <span className="text-5xl font-black uppercase tracking-wide text-kid-grape-500 md:text-7xl">
              {round.prompt}
            </span>
            <HearButton word={round.prompt} label={`Hear the word ${round.prompt}`} />
          </div>

          <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-label="Rhyming word choices">
            {round.choices.map((choice) => (
              <div
                key={choice}
                className={`flex min-h-[72px] items-center justify-between gap-2 rounded-kid-card border-4 bg-white/95 px-4 py-3 shadow-xl ${
                  shakeWord === choice ? 'animate-kid-shake border-kid-coral-500' : 'border-kid-sky-400'
                }`}
              >
                <button
                  type="button"
                  onClick={() => pickChoice(choice)}
                  disabled={celebrating}
                  aria-label={`Choose the word ${choice}`}
                  className="min-h-[56px] flex-1 rounded-xl text-left text-3xl font-black uppercase text-kid-ink-900 transition-transform hover:scale-105 active:scale-95 disabled:cursor-default"
                >
                  {choice}
                </button>
                <HearButton word={choice} label={`Hear the word ${choice}`} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-base font-bold text-kid-ink-700">
            Tap the speaker on any card to hear the word.
          </p>

          <div className="sr-only" aria-live="polite">
            Round {roundIndex + 1} of {rounds.length}
          </div>
        </div>
      )}

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Rhyming star, ${nickname}!`}
          message={`You found ${ROUNDS_PER_GAME} rhymes`}
          stickerId="rhyme-star"
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
