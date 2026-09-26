'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  pickChoices,
  isBlendable,
  phonicsForLevel,
  PHONICS_RAMP,
  PHONICS_PER_GAME,
  skillForPhonics,
  type PhonicsEntry,
} from '@/lib/kid/phonics';
import {
  levelFor,
  adaptiveRamp,
  pickAdaptiveItems,
  placementSeedLevel,
  type DifficultyLevel,
} from '@/lib/kid/adapt';
import { pictogramFor, hasPictogram } from '@/lib/kid/words';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen, AnswerFeedbackPanel } from './game-shell';
import KidShell from '@/components/kid/kid-shell';
import { AVATARS } from '@/components/avatars';

export interface PhonicsFunProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';
type RoundPhase = 'listen' | 'match';

const CELEBRATE_MS = 2400;
const BLEND_PAUSE_MS = 2600;
const HOST = 'luna';

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M10 20 h8 l10 -8 v24 l-10 -8 h-8 z" fill="#fff" stroke="#17324F" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 18 q6 6 0 12 M35 13 q10 11 0 22" fill="none" stroke="#17324F" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#22C55E" />
      <path d="M7 12.5 l3.2 3.2 L17 9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Letter block in the word-art style: chunky rounded tile with a big letter. */
function LetterBlock({ text, className }: { text: string; className?: string }) {
  return (
    <span
      className={`inline-flex min-h-16 min-w-16 items-center justify-center rounded-kid-card border-4 border-kid-grape-500 bg-kid-grape-400 px-3 py-2 text-4xl font-black text-kid-ink-900 shadow-lg md:min-h-20 md:min-w-20 md:text-5xl ${className ?? ''}`}
      aria-hidden
    >
      {text}
    </span>
  );
}

export default function PhonicsFun({ childId, nickname = 'friend', onExit }: PhonicsFunProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [items, setItems] = useState<PhonicsEntry[]>([]);
  const [itemIndex, setItemIndex] = useState(0);
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('listen');
  const [heard, setHeard] = useState<boolean[]>([]);
  const [choices, setChoices] = useState<PhonicsEntry[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'phonics_game',
    stickerId: 'sound-sleuth',
    trophyEvent: 'phonics_done',
    milestone: 'phonics_fun_win',
    learning: { gameId: 'phonics-fun', skill: 'blending' },
  });
  const starBalance = session.starBalance ?? 0;
  // Adaptive difficulty (ZPD): content difficulty follows the child's level.
  const [adaptLevel, setAdaptLevel] = useState<DifficultyLevel>(() =>
    levelFor(childId, 'phonics-fun', placementSeedLevel(childId))
  );
  const timers = useRef<number[]>([]);

  const LunaAvatar = AVATARS.luna.Component;
  const item = items[itemIndex];

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
    (entry: PhonicsEntry, seed: number, index: number) => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      setHeard(new Array(entry.phonemes.length).fill(false));
      setChoices(pickChoices(entry, seed + index * 1013));
      setRoundPhase('listen');
      setCelebrating(false);
      setShakeId(null);
      playSfx('whoosh');
      if (isBlendable(entry)) {
        speakAs(
          HOST,
          `Tap each sound to hear it, ${nickname}. Then press Blend it! ${entry.hint}`
        );
      } else {
        speakAs(HOST, `This word is ${entry.word}. Say it with me! ${entry.hint}`);
      }
    },
    [nickname]
  );

  const startGame = useCallback(() => {
    const seed = Date.now();
    // Re-read the adaptive level each game so recent results reshape content.
    const level = levelFor(childId, 'phonics-fun', placementSeedLevel(childId));
    setAdaptLevel(level);
    const picked = pickAdaptiveItems(
      [phonicsForLevel(1), phonicsForLevel(2), phonicsForLevel(3)],
      adaptiveRamp(PHONICS_RAMP, level),
      seed,
      (w) => w.word
    );
    setItems(picked);
    setItemIndex(0);
    setAttempts(0);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    speakAs(HOST, `Welcome to Phonics Fun, ${nickname}! Let's blend sounds into words together!`);
    later(1800, () => startRound(picked[0], seed, 0));
  }, [nickname, later, startRound]);

  const handleWin = useCallback(async () => {
    const stars = attempts === 0 ? 3 : attempts <= 4 ? 2 : 1;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(
      HOST,
      `Amazing, ${nickname}! You blended ${PHONICS_PER_GAME} words! You earned ${stars} stars!`
    );
    await session.complete({ stars, extraMetadata: { attempts, words: PHONICS_PER_GAME } });
  }, [session, nickname, attempts]);

  const advance = useCallback(() => {
    if (itemIndex + 1 < items.length) {
      const next = itemIndex + 1;
      setItemIndex(next);
      startRound(items[next], Date.now() + next * 7919, next);
    } else {
      void handleWin();
    }
  }, [itemIndex, items, startRound, handleWin]);

  const tapSound = (i: number) => {
    if (!item || celebrating || roundPhase !== 'listen') return;
    playSfx('click');
    speakAs(HOST, item.sounds[i]);
    setHeard((h) => h.map((v, j) => (j === i ? true : v)));
  };

  const blendIt = () => {
    if (!item || celebrating || roundPhase !== 'listen' || !isBlendable(item)) return;
    playSfx('pop');
    const slow = item.sounds.join(', ');
    speakAs(HOST, `${slow}... ${item.word}!`);
    setCelebrating(true);
    later(BLEND_PAUSE_MS, () => {
      setCelebrating(false);
      setRoundPhase('match');
      speakAs(HOST, `Now find the word, ${nickname}. Which one says ${item.word}?`);
    });
  };

  const saySightWord = () => {
    if (!item || celebrating || roundPhase !== 'listen') return;
    playSfx('click');
    speakAs(HOST, item.word);
  };

  const acceptSightWord = () => {
    if (!item || celebrating || roundPhase !== 'listen') return;
    playSfx('pop');
    speakAs(HOST, `${item.word}! Great reading, ${nickname}! Now find it.`);
    later(1800, () => setRoundPhase('match'));
  };

  const pickChoice = (choice: PhonicsEntry) => {
    if (!item || celebrating || roundPhase !== 'match') return;
    // Every word choice is evidence: feeds skill mastery and adaptive difficulty.
    session.recordAnswer(choice.word === item.word, { ...skillForPhonics(item), itemKey: `${itemIndex}-${item.word}`, hint: item.hint });
    // Every tap previews the word aloud so non-readers can play.
    speakAs(HOST, choice.word);
    if (choice.word === item.word) {
      setCelebrating(true);
      playSfx('correct');
      speakAs(HOST, `Yes! ${item.word}! Wonderful blending, ${nickname}!`);
      later(CELEBRATE_MS, advance);
    } else {
      playSfx('wrong');
      setAttempts((a) => a + 1);
      setShakeId(choice.word);
      speakAs(HOST, 'Try again! Sound it out with Luna.');
      later(600, () => setShakeId(null));
    }
  };

  const hearWordAgain = () => {
    if (!item) return;
    playSfx('click');
    if (isBlendable(item)) {
      speakAs(HOST, `${item.sounds.join(', ')}... ${item.word}!`);
    } else {
      speakAs(HOST, item.word);
    }
  };

  const Pictogram = item && hasPictogram(item.word) ? pictogramFor(item.word) : null;

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center text-center">
          <div className="animate-kid-bounce-soft h-32 w-32 md:h-40 md:w-40">
            <LunaAvatar className="h-full w-full" />
          </div>
          <h1 className="animate-kid-rise mt-4 text-4xl font-black text-kid-ink-900 md:text-6xl">
            Phonics Fun
          </h1>
          <p
            className="animate-kid-rise mt-3 max-w-md text-lg font-bold text-kid-ink-700 md:text-xl"
            style={{ animationDelay: '0.1s' }}
          >
            Tap each sound, blend them together, and find the word — with Luna the reading owl!
          </p>
          <button
            type="button"
            onClick={startGame}
            className="animate-kid-rise mt-8 rounded-full bg-kid-grape-400 px-12 py-4 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
            aria-label="Start Phonics Fun"
          >
            Let&apos;s Blend!
          </button>
        </div>
      )}

      {phase === 'play' && item && (
        <div className="flex w-full max-w-3xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white px-4 py-2 shadow-lg">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Phonics Fun</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Luna</span>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg md:text-lg">
              {itemIndex + 1} / {items.length}
            </div>
          </div>

          {Pictogram && (
            <div className="animate-kid-pop-in mt-4 h-28 w-28 md:h-36 md:w-36">
              <Pictogram className="h-full w-full" />
            </div>
          )}

          {roundPhase === 'listen' && (
            <div className="mt-4 flex w-full flex-col items-center">
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4" role="group" aria-label="Word sounds">
                {isBlendable(item) ? (
                  item.phonemes.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => tapSound(i)}
                      className={`flex min-h-20 min-w-20 flex-col items-center justify-center gap-1 rounded-kid-card border-4 px-4 py-3 shadow-lg transition-transform hover:scale-105 active:scale-95 md:min-h-24 md:min-w-24 ${
                        heard[i]
                          ? 'border-kid-mint-500 bg-kid-mint-400'
                          : 'border-kid-grape-500 bg-kid-grape-400'
                      }`}
                      aria-label={`Hear the sound ${item.sounds[i]}`}
                    >
                      <span className="text-4xl font-black text-kid-ink-900 md:text-5xl">{p}</span>
                      {heard[i] ? (
                        <CheckIcon className="h-6 w-6" />
                      ) : (
                        <SpeakerIcon className="h-6 w-6 opacity-60" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="flex items-center gap-3">
                    <LetterBlock text={item.word} />
                    <button
                      type="button"
                      onClick={saySightWord}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-kid-sky-400 shadow-lg transition-transform hover:scale-105 active:scale-95 md:h-24 md:w-24"
                      aria-label={`Hear the word ${item.word}`}
                    >
                      <SpeakerIcon className="h-10 w-10" />
                    </button>
                  </div>
                )}
              </div>

              {isBlendable(item) ? (
                <button
                  type="button"
                  onClick={blendIt}
                  disabled={celebrating}
                  className="mt-8 rounded-full bg-kid-coral-400 px-12 py-4 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                  aria-label="Blend the sounds into the word"
                >
                  Blend it!
                </button>
              ) : (
                <button
                  type="button"
                  onClick={acceptSightWord}
                  className="mt-8 rounded-full bg-kid-coral-400 px-12 py-4 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
                  aria-label="I can read this word, continue"
                >
                  I can read it!
                </button>
              )}
              <p className="mt-4 text-center text-base font-bold text-kid-ink-700">
                {isBlendable(item)
                  ? 'Tap each sound, then blend them together!'
                  : 'This is a sight word — say it fast, like a snapshot!'}
              </p>
            </div>
          )}

          {roundPhase === 'match' && (
            <div className="mt-4 flex w-full flex-col items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-kid-ink-900 md:text-3xl">
                  Which word did we blend?
                </h2>
                <button
                  type="button"
                  onClick={hearWordAgain}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-kid-sky-400 shadow-lg transition-transform hover:scale-105 active:scale-95"
                  aria-label="Hear the word again"
                >
                  <SpeakerIcon className="h-8 w-8" />
                </button>
              </div>
              <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-label="Word choices">
                {choices.map((c) => (
                  <button
                    key={c.word}
                    type="button"
                    onClick={() => pickChoice(c)}
                    disabled={celebrating}
                    aria-label={`Choose the word ${c.word}`}
                    className={`rounded-kid-card border-4 bg-white/95 px-4 py-6 text-3xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:cursor-default md:text-4xl ${
                      shakeId === c.word ? 'animate-kid-shake border-kid-coral-500' : 'border-kid-sky-400'
                    }`}
                  >
                    {c.word}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sr-only" aria-live="polite">
            Round {itemIndex + 1} of {items.length}
          </div>
        </div>
      )}

      <AnswerFeedbackPanel feedback={session.feedback} />

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Super blending, ${nickname}!`}
          message={`You blended ${PHONICS_PER_GAME} words`}
          stickerId="sound-sleuth"
          onPlayAgain={startGame}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
