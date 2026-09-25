'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  pickRounds,
  builtSentence,
  ROUNDS_PER_GAME,
  type SentenceRound,
  type WordTile,
} from '@/lib/kid/sentences';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import KidShell from '@/components/kid/kid-shell';
import { AVATARS } from '@/components/avatars';

export interface SentenceStudioProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const CELEBRATE_MS = 2600;
const HOST = 'luna';

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M10 20 h8 l10 -8 v24 l-10 -8 h-8 z" fill="#fff" stroke="#17324F" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 18 q6 6 0 12 M35 13 q10 11 0 22" fill="none" stroke="#17324F" strokeWidth="2.8" strokeLinecap="round" />
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

export default function SentenceStudio({ childId, nickname = 'friend', onExit }: SentenceStudioProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds, setRounds] = useState<SentenceRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [bank, setBank] = useState<WordTile[]>([]);
  const [placed, setPlaced] = useState<WordTile[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [shaking, setShaking] = useState(false);
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

  const LunaAvatar = AVATARS.luna.Component;
  const round = rounds[roundIndex];

  const readSentence = useCallback((text: string) => {
    speakAs(HOST, text);
  }, []);

  const startRound = useCallback(
    (r: SentenceRound) => {
      setBank(r.tiles);
      setPlaced([]);
      setCelebrating(false);
      setShaking(false);
      readSentence(`Build this sentence: ${r.sentence}`);
    },
    [readSentence]
  );

  const startGame = useCallback(() => {
    const seed = Date.now();
    const picked = pickRounds(seed);
    setRounds(picked);
    setRoundIndex(0);
    setMistakes(0);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    speakAs(
      HOST,
      `Welcome to Sentence Studio, ${nickname}! Tap the word tiles to build each sentence. Tap a word again to take it back.`
    );
    later(2200, () => startRound(picked[0]));
  }, [nickname, later, startRound]);

  const handleWin = useCallback(async () => {
    const stars = mistakes === 0 ? 3 : mistakes <= 4 ? 2 : 1;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(
      HOST,
      `Amazing writing, ${nickname}! You built ${ROUNDS_PER_GAME} super sentences! You earned ${stars} stars!`
    );
    try {
      const balance = await awardStars(childId, stars);
      setStarBalance(balance);
      await bumpQuestProgress(childId, 'sentence_game', 1);
      await awardStickers(childId, ['sentence-scribe']);
      // 'sentence_done' trophy lands in integration; the cast keeps tsc green now.
      checkTrophies(childId, 'sentence_done').catch(() => {});
      await logLearningEvent(childId, 'milestone', {
        metadata: { kind: 'sentence_studio_win', stars, mistakes, rounds: ROUNDS_PER_GAME },
      });
    } catch {
      /* progress logging is best-effort; the celebration still stands */
    }
  }, [childId, nickname, mistakes]);

  const tapBankTile = (tile: WordTile) => {
    if (celebrating || phase !== 'play' || !round) return;
    playSfx('click');
    setPlaced((p) => [...p, tile]);
    setBank((b) => b.filter((t) => t.id !== tile.id));
  };

  const tapPlacedTile = (tile: WordTile) => {
    if (celebrating || phase !== 'play' || !round) return;
    playSfx('pop');
    setPlaced((p) => p.filter((t) => t.id !== tile.id));
    setBank((b) => [...b, tile]);
  };

  const checkSentence = () => {
    if (celebrating || phase !== 'play' || !round) return;
    if (placed.length !== round.words.length) return;
    const correct = placed.every((t, i) => t.id === round.answer[i]);
    if (correct) {
      setCelebrating(true);
      playSfx('fanfare');
      readSentence(`${round.sentence} Wonderful writing, ${nickname}!`);
      later(CELEBRATE_MS, () => {
        if (roundIndex + 1 < rounds.length) {
          const next = roundIndex + 1;
          setRoundIndex(next);
          startRound(rounds[next]);
        } else {
          void handleWin();
        }
      });
    } else {
      playSfx('wrong');
      setMistakes((m) => m + 1);
      setShaking(true);
      speakAs(HOST, 'Not quite! Tap the words to fix the order, then check again.');
      later(650, () => setShaking(false));
    }
  };

  const readBuilt = () => {
    if (placed.length === 0) {
      speakAs(HOST, 'Tap some word tiles first, then I will read your sentence!');
      return;
    }
    readSentence(builtSentence(placed));
  };

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center px-4 text-center">
          <div className="animate-kid-bob">
            <LunaAvatar className="h-28 w-28 drop-shadow-[0_10px_18px_rgba(23,50,79,0.35)] md:h-36 md:w-36" />
          </div>
          <h1 className="font-display animate-kid-rise mt-4 text-3xl text-kid-ink-900 md:text-5xl">
            Sentence Studio
          </h1>
          <p className="animate-kid-rise mt-2 text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
            Luna will say a sentence. Tap the word tiles to build it in order!
            Build {ROUNDS_PER_GAME} sentences to win stars.
          </p>
          <button
            type="button"
            onClick={startGame}
            className="btn-kid btn-kid-grape animate-kid-rise mt-6 px-12 py-4 text-2xl"
            style={{ animationDelay: '0.2s' }}
          >
            Play!
          </button>
        </div>
      )}

      {phase === 'play' && round && (
        <div className="flex w-full max-w-3xl flex-col items-center px-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">
                Sentence {roundIndex + 1} of {ROUNDS_PER_GAME}
              </span>
              <span className="ml-2 rounded-full bg-kid-grape-400 px-2.5 py-0.5 text-sm font-black text-white">
                Level {round.level}
              </span>
            </div>
            <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
              Tries: {mistakes}
            </div>
          </div>

          <button
            type="button"
            onClick={() => readSentence(`Build this sentence: ${round.sentence}`)}
            className="mt-4 flex items-center gap-3 rounded-kid-card bg-kid-sun-400 px-6 py-3 shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Hear the sentence again"
          >
            <SpeakerIcon className="h-10 w-10" />
            <span className="text-base font-black text-kid-ink-900">Hear the sentence</span>
          </button>

          {/* Answer tray */}
          <div
            className={`mt-5 flex min-h-[96px] w-full flex-wrap items-center justify-center gap-2 rounded-kid-card border-4 border-dashed p-3 md:min-h-[112px] ${
              shaking ? 'animate-kid-shake border-red-400 bg-red-50/60' : 'border-white/70 bg-white/40'
            }`}
            role="status"
            aria-label={placed.length ? `Your sentence: ${builtSentence(placed)}` : 'Your sentence tray is empty. Tap word tiles below.'}
          >
            {placed.length === 0 && (
              <span className="px-4 text-lg font-bold text-kid-ink-500">Tap word tiles to build your sentence…</span>
            )}
            {placed.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => tapPlacedTile(tile)}
                disabled={celebrating}
                aria-label={`Remove word ${tile.text}`}
                className="animate-kid-pop-in flex min-h-[72px] items-center justify-center rounded-kid-card border-b-8 border-kid-sun-600 bg-white px-5 text-2xl font-black text-kid-ink-900 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:cursor-default md:text-3xl"
              >
                {tile.text}
              </button>
            ))}
          </div>

          {/* Word bank */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Word tiles">
            {bank.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => tapBankTile(tile)}
                disabled={celebrating}
                aria-label={`Word ${tile.text}`}
                className="flex min-h-[72px] items-center justify-center rounded-kid-card border-b-8 border-kid-sky-600 bg-kid-sky-400 px-5 text-2xl font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:cursor-default md:text-3xl"
              >
                {tile.text}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={readBuilt}
              disabled={celebrating}
              className="flex min-h-[72px] items-center gap-2 rounded-full border-b-8 border-kid-mint-600 bg-kid-mint-400 px-8 text-xl font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:cursor-default disabled:opacity-60"
            >
              <SpeakerIcon className="h-8 w-8" />
              Read it
            </button>
            <button
              type="button"
              onClick={checkSentence}
              disabled={celebrating || placed.length !== round.words.length}
              aria-label="Check my sentence"
              className="btn-kid btn-kid-coral min-h-[72px] px-10 text-xl disabled:cursor-default disabled:opacity-60"
            >
              Check
            </button>
          </div>

          {celebrating && (
            <p className="animate-kid-pop-in mt-5 text-center text-2xl font-black text-kid-ink-900 md:text-3xl">
              {round.sentence} Super writing!
            </p>
          )}
        </div>
      )}

      {phase === 'won' && (
        <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
          <div className="animate-kid-bounce-soft">
            <LunaAvatar className="h-24 w-24 md:h-28 md:w-28" />
          </div>
          <h2 className="font-display mt-3 text-3xl text-kid-ink-900 md:text-4xl">
            You did it, {nickname}!
          </h2>
          <p className="mt-2 text-lg font-bold text-kid-ink-700">
            You built all {ROUNDS_PER_GAME} sentences{mistakes === 0 ? ' with no mistakes' : ` with ${mistakes} ${mistakes === 1 ? 'try' : 'tries'}`} and earned
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StarIcon className="h-10 w-10" />
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
              Back to map
            </button>
          </div>
        </div>
      )}
    </KidShell>
  );
}
