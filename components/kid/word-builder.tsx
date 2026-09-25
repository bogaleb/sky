'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  pickGameWords,
  pictogramFor,
  seededShuffle,
  WORDS_PER_GAME,
  type WordEntry,
} from '@/lib/kid/words';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import KidShell from '@/components/kid/kid-shell';
import { AVATARS } from '@/components/avatars';

export interface WordBuilderProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

interface Tile {
  id: number;
  letter: string;
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

export default function WordBuilder({ childId, nickname = 'friend', onExit }: WordBuilderProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [words, setWords] = useState<WordEntry[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [built, setBuilt] = useState<Tile[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [shakeId, setShakeId] = useState<number | null>(null);
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
  const word = words[wordIndex];

  const speakWord = useCallback((entry: WordEntry) => {
    speakAs(HOST, `Spell: ${entry.word}. ${entry.hint}`);
  }, []);

  const startWord = useCallback(
    (entry: WordEntry, seed: number) => {
      const tileList = entry.word.split('').map((letter, i) => ({ id: i, letter }));
      setTiles(seededShuffle(tileList, seed));
      setBuilt([]);
      setCelebrating(false);
      setShakeId(null);
      speakWord(entry);
    },
    [speakWord]
  );

  const startGame = useCallback(() => {
    const seed = Date.now();
    const picked = pickGameWords(seed);
    setWords(picked);
    setWordIndex(0);
    setMistakes(0);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    speakAs(HOST, `Welcome to Word Builder, ${nickname}! Tap the letters in order to spell each word.`);
    later(1800, () => startWord(picked[0], seed));
  }, [nickname, later, startWord]);

  const handleWin = useCallback(async () => {
    const stars = mistakes === 0 ? 3 : mistakes <= 4 ? 2 : 1;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(
      HOST,
      `Amazing, ${nickname}! You built ${WORDS_PER_GAME} words! You earned ${stars} stars!`
    );
    try {
      const balance = await awardStars(childId, stars);
      setStarBalance(balance);
      await bumpQuestProgress(childId, 'word_game', 1);
      await awardStickers(childId, ['word-wizard']);
      // 'word_done' trophy lands in integration; the cast keeps tsc green now.
      checkTrophies(childId, 'word_done').catch(() => {});
      await logLearningEvent(childId, 'milestone', {
        metadata: { kind: 'word_builder_win', stars, mistakes, words: WORDS_PER_GAME },
      });
    } catch {
      /* progress logging is best-effort; the celebration still stands */
    }
  }, [childId, nickname, mistakes]);

  const tapTile = (tile: Tile) => {
    if (celebrating || phase !== 'play' || !word) return;
    const expected = word.word[built.length];
    if (tile.letter === expected) {
      playSfx('click');
      const nextBuilt = [...built, tile];
      setBuilt(nextBuilt);
      setTiles((t) => t.filter((x) => x.id !== tile.id));
      if (nextBuilt.length === word.word.length) {
        setCelebrating(true);
        playSfx('fanfare');
        const spelledOut = `${word.word.split('').join('. ')}. ${word.word}!`;
        speakAs(HOST, `${spelledOut} Wonderful spelling, ${nickname}!`);
        later(CELEBRATE_MS, () => {
          if (wordIndex + 1 < words.length) {
            const next = wordIndex + 1;
            setWordIndex(next);
            startWord(words[next], Date.now() + next * 7919);
          } else {
            void handleWin();
          }
        });
      }
    } else {
      playSfx('wrong');
      setMistakes((m) => m + 1);
      setShakeId(tile.id);
      speakAs(HOST, 'Try again! Find the next letter.');
      later(650, () => setShakeId((s) => (s === tile.id ? null : s)));
    }
  };

  const spelledSoFar = built.map((t) => t.letter).join('');
  const Picture = word ? pictogramFor(word.word) : null;

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center px-4 text-center">
          <div className="animate-kid-bob">
            <LunaAvatar className="h-28 w-28 drop-shadow-[0_10px_18px_rgba(23,50,79,0.35)] md:h-36 md:w-36" />
          </div>
          <h1 className="animate-kid-rise mt-4 text-3xl font-black text-kid-ink-900 md:text-5xl">
            Word Builder
          </h1>
          <p className="animate-kid-rise mt-2 text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
            Luna the owl will say a word. Tap the letter tiles in order to build it!
            Spell {WORDS_PER_GAME} words to win stars.
          </p>
          <button
            type="button"
            onClick={startGame}
            className="animate-kid-rise mt-6 rounded-full border-b-8 border-kid-grape-600 bg-kid-grape-400 px-12 py-4 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
          >
            Play!
          </button>
        </div>
      )}

      {phase === 'play' && word && Picture && (
        <div className="flex w-full max-w-2xl flex-col items-center px-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">
                Word {wordIndex + 1} of {WORDS_PER_GAME}
              </span>
              <span className="ml-2 rounded-full bg-kid-grape-400 px-2.5 py-0.5 text-sm font-black text-white">
                Level {word.level}
              </span>
            </div>
            <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
              Tries: {mistakes}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div
              className={`rounded-kid-card bg-white/90 p-4 shadow-xl ${celebrating ? 'animate-kid-bounce-soft' : 'animate-kid-pop-in'}`}
              key={word.word}
            >
              <Picture className="h-32 w-32 md:h-40 md:w-40" />
            </div>
            <button
              type="button"
              onClick={() => speakWord(word)}
              className="flex flex-col items-center gap-1 rounded-kid-card bg-kid-sun-400 px-5 py-4 shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Hear the word again"
            >
              <SpeakerIcon className="h-12 w-12" />
              <span className="text-sm font-black text-kid-ink-900">Hear it</span>
            </button>
          </div>

          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
            role="status"
            aria-label={spelledSoFar ? `Spelled so far: ${spelledSoFar.split('').join(' ')}` : 'No letters placed yet'}
          >
            {word.word.split('').map((letter, i) => {
              const placed = built[i];
              return (
                <div
                  key={i}
                  className={`flex h-16 w-14 items-center justify-center rounded-kid-card text-3xl font-black md:h-20 md:w-16 md:text-4xl ${
                    placed
                      ? 'animate-kid-pop-in border-4 border-kid-sun-400 bg-white text-kid-ink-900 shadow-lg'
                      : 'border-4 border-dashed border-white/70 bg-white/40 text-transparent'
                  }`}
                  aria-hidden={placed ? undefined : true}
                >
                  {placed ? placed.letter : '·'}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Letter tiles">
            {tiles.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => tapTile(tile)}
                disabled={celebrating}
                aria-label={`Letter ${tile.letter}`}
                className={`flex h-16 w-16 items-center justify-center rounded-kid-card border-b-8 text-3xl font-black shadow-lg transition-all hover:scale-105 active:scale-95 disabled:cursor-default md:h-20 md:w-20 md:text-4xl ${
                  shakeId === tile.id
                    ? 'animate-kid-shake border-red-400 bg-red-100 text-kid-ink-900'
                    : 'border-kid-sky-600 bg-kid-sky-400 text-white'
                }`}
              >
                {tile.letter}
              </button>
            ))}
          </div>

          {celebrating && (
            <p className="animate-kid-pop-in mt-5 text-2xl font-black text-kid-ink-900 md:text-3xl">
              {word.word.split('').join('-')}! Great spelling!
            </p>
          )}
        </div>
      )}

      {phase === 'won' && (
        <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
          <div className="animate-kid-bounce-soft">
            <LunaAvatar className="h-24 w-24 md:h-28 md:w-28" />
          </div>
          <h2 className="mt-3 text-3xl font-black text-kid-ink-900 md:text-4xl">
            You did it, {nickname}!
          </h2>
          <p className="mt-2 text-lg font-bold text-kid-ink-700">
            You built all {WORDS_PER_GAME} words{mistakes === 0 ? ' with no mistakes' : ` with ${mistakes} ${mistakes === 1 ? 'try' : 'tries'}`} and earned
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
