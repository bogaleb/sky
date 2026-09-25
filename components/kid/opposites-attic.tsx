'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pickSession, ROUNDS_PER_GAME, type OppositeRound } from '@/lib/kid/opposites';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import KidShell from '@/components/kid/kid-shell';
import { AVATARS } from '@/components/avatars';

export interface OppositesAtticProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const CELEBRATE_MS = 2000;
const HOST = 'luna';

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
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-kid-grape-400 shadow-lg transition-transform hover:scale-105 active:scale-95"
      aria-label={label}
    >
      <SpeakerIcon className="h-8 w-8" />
    </button>
  );
}

/** Cozy attic scene: slanted beams, round window with the moon, hanging lamp, crates. */
function AtticScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="A cozy attic with boxes, a lamp, and a round window">
      {/* walls */}
      <rect x="0" y="0" width="400" height="220" rx="24" fill="#8A5A3B" />
      <rect x="0" y="120" width="400" height="100" rx="0" fill="#7A4E33" />
      {/* roof beams */}
      <rect x="-20" y="18" width="440" height="18" rx="9" fill="#5E3B24" transform="rotate(-14 200 27)" />
      <rect x="-20" y="18" width="440" height="18" rx="9" fill="#5E3B24" transform="rotate(14 200 27)" />
      {/* round window with night sky */}
      <circle cx="310" cy="80" r="46" fill="#2B3A67" />
      <circle cx="310" cy="80" r="46" fill="none" stroke="#E8C87A" strokeWidth="8" />
      <circle cx="326" cy="66" r="12" fill="#F5E6B8" />
      <circle cx="292" cy="92" r="2.5" fill="#fff" />
      <circle cx="310" cy="102" r="2" fill="#fff" />
      <circle cx="328" cy="94" r="2.5" fill="#fff" />
      <line x1="310" y1="34" x2="310" y2="126" stroke="#E8C87A" strokeWidth="4" />
      <line x1="264" y1="80" x2="356" y2="80" stroke="#E8C87A" strokeWidth="4" />
      {/* hanging lamp */}
      <line x1="120" y1="0" x2="120" y2="52" stroke="#3E2A18" strokeWidth="5" />
      <path d="M96 52 h48 l10 26 h-68 z" fill="#E8A13D" />
      <ellipse cx="120" cy="86" rx="26" ry="10" fill="#FFD97A" opacity="0.55" />
      <circle cx="120" cy="92" r="8" fill="#FFE9A8" />
      {/* crates */}
      <g>
        <rect x="36" y="140" width="86" height="62" rx="8" fill="#B07A4F" />
        <rect x="36" y="140" width="86" height="62" rx="8" fill="none" stroke="#7A4E33" strokeWidth="4" />
        <line x1="36" y1="171" x2="122" y2="171" stroke="#7A4E33" strokeWidth="4" />
        <line x1="79" y1="140" x2="79" y2="202" stroke="#7A4E33" strokeWidth="4" />
        <rect x="96" y="96" width="70" height="50" rx="8" fill="#C08A5C" />
        <rect x="96" y="96" width="70" height="50" rx="8" fill="none" stroke="#7A4E33" strokeWidth="4" />
        <line x1="131" y1="96" x2="131" y2="146" stroke="#7A4E33" strokeWidth="4" />
      </g>
      {/* rug */}
      <ellipse cx="230" cy="196" rx="90" ry="16" fill="#A8433F" />
      <ellipse cx="230" cy="196" rx="66" ry="11" fill="#C65B54" />
      {/* stacked books */}
      <rect x="250" y="168" width="56" height="12" rx="3" fill="#4E7FA6" />
      <rect x="254" y="156" width="48" height="12" rx="3" fill="#7FB069" />
      <rect x="250" y="144" width="56" height="12" rx="3" fill="#E8A13D" />
    </svg>
  );
}

export default function OppositesAttic({ childId, nickname = 'friend', onExit }: OppositesAtticProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds, setRounds] = useState<OppositeRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const [starBalance, setStarBalance] = useState(0);
  // Match-round state: tapped cards and found pairs.
  const [selected, setSelected] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
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

  const promptFor = useCallback((r: OppositeRound) => {
    if (r.kind === 'ask') return `What is the opposite of ${r.word}?`;
    return 'Tap two cards that are opposites!';
  }, []);

  const startGame = useCallback(() => {
    const session = pickSession(Date.now());
    setRounds(session);
    setRoundIndex(0);
    setAttempts(0);
    setCelebrating(false);
    setShakeKey(null);
    setSelected([]);
    setFound([]);
    setPhase('play');
    playSfx('whoosh');
    speakAs(
      HOST,
      `Welcome to the Opposites Attic, ${nickname}! Tap the speaker to hear every word, then find the opposites!`
    );
    later(2200, () => speakAs(HOST, promptFor(session[0])));
  }, [nickname, later, promptFor]);

  const handleWin = useCallback(async () => {
    const stars = attempts === 0 ? 12 : attempts <= 8 ? 10 : 8;
    setStarsEarned(stars);
    setPhase('won');
    playSfx('fanfare');
    speakAs(HOST, `You are an opposites ace, ${nickname}! You earned ${stars} stars!`);
    try {
      const balance = await awardStars(childId, stars);
      setStarBalance(balance);
      await bumpQuestProgress(childId, 'opposites_game', 1);
      // 'opposites-ace' sticker def lands with Track A; the call safely no-ops until then.
      await awardStickers(childId, ['opposites-ace']);
      // 'opposites_done' trophy lands in integration; the cast keeps tsc green now.
      checkTrophies(childId, 'opposites_done').catch(() => {});
      await logLearningEvent(childId, 'milestone', {
        metadata: { kind: 'opposites_attic_win', stars, attempts, rounds: ROUNDS_PER_GAME },
      });
    } catch {
      /* progress logging is best-effort; the celebration still stands */
    }
  }, [childId, nickname, attempts]);

  const advance = useCallback(() => {
    if (roundIndex + 1 < rounds.length) {
      const next = roundIndex + 1;
      setRoundIndex(next);
      setCelebrating(false);
      setSelected([]);
      setFound([]);
      speakAs(HOST, promptFor(rounds[next]));
    } else {
      void handleWin();
    }
  }, [roundIndex, rounds, handleWin, promptFor]);

  const pickAskChoice = (choice: string) => {
    if (!round || round.kind !== 'ask' || celebrating) return;
    // Every tap previews the word aloud so non-readers can play.
    speakAs(HOST, choice);
    if (choice === round.answer) {
      setCelebrating(true);
      playSfx('correct');
      speakAs(HOST, `Yes! The opposite of ${round.word} is ${round.answer}!`);
      later(CELEBRATE_MS, advance);
    } else {
      playSfx('wrong');
      setAttempts((a) => a + 1);
      setShakeKey(choice);
      speakAs(HOST, `Hmm, ${choice} is not the opposite of ${round.word}. Listen again and try!`);
      later(600, () => setShakeKey(null));
    }
  };

  const tapMatchCard = (word: string) => {
    if (!round || round.kind !== 'match' || celebrating) return;
    if (found.includes(word)) return;
    // Every tap speaks the word so non-readers can play by listening.
    speakAs(HOST, word);
    if (selected.length === 0) {
      playSfx('click');
      setSelected([word]);
      return;
    }
    if (selected[0] === word) {
      setSelected([]);
      return;
    }
    const [first] = selected;
    const isPair = round.pairs.some(
      ([a, b]) => (a === first && b === word) || (a === word && b === first)
    );
    if (isPair) {
      const newlyFound = [...found, first, word];
      setFound(newlyFound);
      setSelected([]);
      playSfx('correct');
      if (newlyFound.length >= round.cards.length) {
        setCelebrating(true);
        speakAs(HOST, `Amazing! You matched every opposite pair!`);
        later(CELEBRATE_MS, advance);
      } else {
        speakAs(HOST, `Yes! ${first} and ${word} are opposites! Find the next pair!`);
      }
    } else {
      playSfx('wrong');
      setAttempts((a) => a + 1);
      setShakeKey(`${first}|${word}`);
      speakAs(HOST, `${first} and ${word} are not opposites. Try again!`);
      later(700, () => {
        setShakeKey(null);
        setSelected([]);
      });
    }
  };

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center text-center">
          <AtticScene className="animate-kid-rise w-full max-w-md shadow-2xl" />
          <div className="animate-kid-bounce-soft -mt-10 h-28 w-28 md:h-32 md:w-32">
            <LunaAvatar className="h-full w-full drop-shadow-xl" />
          </div>
          <h1 className="animate-kid-rise mt-2 text-4xl font-black text-kid-ink-900 md:text-6xl">
            Opposites Attic
          </h1>
          <p
            className="animate-kid-rise mt-3 max-w-md text-lg font-bold text-kid-ink-700 md:text-xl"
            style={{ animationDelay: '0.1s' }}
          >
            Climb up to Luna&apos;s cozy attic! Hear every word, then find its opposite — with Luna the reading owl!
          </p>
          <button
            type="button"
            onClick={startGame}
            className="animate-kid-rise mt-8 rounded-full bg-kid-grape-400 px-12 py-4 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
            aria-label="Start Opposites Attic"
          >
            Let&apos;s Play!
          </button>
        </div>
      )}

      {phase === 'play' && round && (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">Opposites Attic</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Luna</span>
            </div>
            <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
              {roundIndex + 1} / {rounds.length}
            </div>
          </div>

          {round.kind === 'ask' && (
            <>
              <h2 className="mt-6 text-center text-2xl font-black text-kid-ink-900 md:text-3xl">
                What is the opposite of…
              </h2>
              <div className="animate-kid-pop-in mt-4 flex items-center gap-4 rounded-kid-card bg-white/95 px-8 py-5 shadow-2xl">
                <span className="text-5xl font-black uppercase tracking-wide text-kid-grape-500 md:text-7xl">
                  {round.word}
                </span>
                <HearButton word={round.word} label={`Hear the word ${round.word}`} />
              </div>
              <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-label="Opposite word choices">
                {round.choices.map((choice) => (
                  <div
                    key={choice}
                    className={`flex min-h-[72px] items-center justify-between gap-2 rounded-kid-card border-4 bg-white/95 px-4 py-3 shadow-xl ${
                      shakeKey === choice ? 'animate-kid-shake border-kid-coral-500' : 'border-kid-grape-400'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => pickAskChoice(choice)}
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
            </>
          )}

          {round.kind === 'match' && (
            <>
              <h2 className="mt-6 text-center text-2xl font-black text-kid-ink-900 md:text-3xl">
                Tap two cards that are opposites!
              </h2>
              <p className="mt-2 text-center text-base font-bold text-kid-ink-700">
                Tap a card to hear its word. Found pairs stay glowing!
              </p>
              <div className="mt-6 grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-label="Opposite pair cards">
                {round.cards.map((card) => {
                  const isFound = found.includes(card);
                  const isSelected = selected.includes(card);
                  const isShaking = shakeKey !== null && shakeKey.split('|').includes(card);
                  return (
                    <button
                      key={card}
                      type="button"
                      onClick={() => tapMatchCard(card)}
                      disabled={celebrating || isFound}
                      aria-label={isFound ? `${card}, already matched` : `Card: ${card}`}
                      aria-pressed={isSelected}
                      className={`flex min-h-[88px] items-center justify-center rounded-kid-card border-4 px-4 py-4 shadow-xl transition-all ${
                        isFound
                          ? 'border-kid-mint-400 bg-kid-mint-200/80'
                          : isSelected
                            ? 'scale-105 border-kid-sun-400 bg-kid-sun-200/90'
                            : isShaking
                              ? 'animate-kid-shake border-kid-coral-500 bg-white/95'
                              : 'border-kid-grape-400 bg-white/95 hover:scale-105 active:scale-95'
                      } disabled:cursor-default`}
                    >
                      <span className="text-2xl font-black uppercase text-kid-ink-900 md:text-3xl">
                        {card}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 rounded-full bg-white/85 px-4 py-2 text-base font-black text-kid-ink-900 shadow-lg backdrop-blur" aria-live="polite">
                Pairs found: {found.length / 2} of {round.pairs.length}
              </div>
            </>
          )}

          <div className="sr-only" aria-live="polite">
            Round {roundIndex + 1} of {rounds.length}
          </div>
        </div>
      )}

      {phase === 'won' && (
        <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
          <div className="animate-kid-bounce-soft">
            <StarIcon className="h-24 w-24 md:h-28 md:w-28" />
          </div>
          <h2 className="mt-3 text-3xl font-black text-kid-ink-900 md:text-4xl">
            Opposites ace, {nickname}!
          </h2>
          <p className="mt-2 text-lg font-bold text-kid-ink-700">
            You found {ROUNDS_PER_GAME} rounds of opposites and earned
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
              className="rounded-full bg-kid-grape-400 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={onExit}
              className="rounded-full bg-kid-sun-400 px-8 py-3 text-lg font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Back to Sky Park
            </button>
          </div>
        </div>
      )}
    </KidShell>
  );
}
