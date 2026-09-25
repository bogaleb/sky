'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MEMORY_DECKS, getDeck, type MemoryDeck, type MemoryPair } from '@/lib/kid/memory-decks';
import type { SessionChild } from '@/lib/kid/types';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen } from './game-shell';
import KidShell from '@/components/kid/kid-shell';

export interface MemoryCoveProps {
  child: SessionChild;
  onExit: () => void;
}

type Phase = 'pick' | 'play' | 'won';

interface PlayCard {
  key: number;
  pairIndex: number;
  face: 'a' | 'b';
}

const FLIP_BACK_MS = 900;
const MATCH_PAUSE_MS = 450;

const COLOR_HEX: Record<string, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#FACC15',
  purple: '#A855F7',
  orange: '#FB923C',
  pink: '#EC8899',
  brown: '#92400E',
};

const SHAPES = new Set([
  'circle',
  'square',
  'triangle',
  'diamond',
  'star',
  'heart',
  'oval',
  'rectangle',
]);

const DOT_POSITIONS: Array<Array<[number, number]>> = [
  [],
  [[32, 32]],
  [[22, 32], [42, 32]],
  [[20, 42], [32, 22], [44, 42]],
  [[20, 20], [44, 20], [20, 44], [44, 44]],
  [[20, 20], [44, 20], [32, 32], [20, 44], [44, 44]],
  [[18, 20], [32, 20], [46, 20], [18, 44], [32, 44], [46, 44]],
  [[18, 18], [32, 18], [46, 18], [18, 32], [46, 32], [18, 46], [46, 46]],
  [[18, 18], [32, 18], [46, 18], [18, 32], [46, 32], [18, 46], [32, 46], [46, 46]],
];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Spoken description of a matched pair for non-readers. */
function describePair(deckId: string, pair: MemoryPair): string {
  switch (deckId) {
    case 'letters':
      return `${pair.a} matches ${pair.b}`;
    case 'numbers': {
      const n = Number(pair.a);
      const words = ['', 'one dot', 'two dots', 'three dots', 'four dots', 'five dots', 'six dots', 'seven dots', 'eight dots'];
      return `${pair.a} matches ${words[n] ?? `${n} dots`}`;
    }
    case 'shapes':
      return `${pair.a} matches the ${pair.b} shape`;
    case 'colors':
      return `${pair.a} matches the ${pair.b} color`;
    default:
      return `${pair.a} matches ${pair.b}`;
  }
}

/** Inline SVG graphic for a `b` face with kind 'shape'. No emoji, ever. */
function GraphicFace({ descriptor }: { descriptor: string }) {
  if (descriptor.startsWith('dots:')) {
    const n = Math.min(8, Math.max(1, Number(descriptor.slice(5)) || 1));
    const dots = DOT_POSITIONS[n];
    return (
      <svg viewBox="0 0 64 64" className="h-3/4 w-3/4" role="img" aria-label={`${n} dots`}>
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="7" fill="#17324F" />
        ))}
      </svg>
    );
  }
  if (COLOR_HEX[descriptor]) {
    return (
      <svg viewBox="0 0 64 64" className="h-3/4 w-3/4" role="img" aria-label={`${descriptor} color`}>
        <circle cx="32" cy="32" r="25" fill={COLOR_HEX[descriptor]} stroke="#FFFFFF" strokeWidth="5" />
      </svg>
    );
  }
  if (SHAPES.has(descriptor)) {
    const fill = '#FF8C42';
    const stroke = '#D96C1E';
    return (
      <svg viewBox="0 0 64 64" className="h-3/4 w-3/4" role="img" aria-label={descriptor}>
        {descriptor === 'circle' && <circle cx="32" cy="32" r="26" fill={fill} stroke={stroke} strokeWidth="3" />}
        {descriptor === 'square' && <rect x="8" y="8" width="48" height="48" rx="8" fill={fill} stroke={stroke} strokeWidth="3" />}
        {descriptor === 'triangle' && <path d="M32 6 L58 54 L6 54 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />}
        {descriptor === 'diamond' && <path d="M32 6 L56 32 L32 58 L8 32 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />}
        {descriptor === 'star' && (
          <path d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
        )}
        {descriptor === 'heart' && (
          <path d="M32 56 C10 40 6 22 18 14 C26 9 32 14 32 20 C32 14 38 9 46 14 C58 22 54 40 32 56 Z" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
        )}
        {descriptor === 'oval' && <ellipse cx="32" cy="32" rx="26" ry="18" fill={fill} stroke={stroke} strokeWidth="3" />}
        {descriptor === 'rectangle' && <rect x="6" y="18" width="52" height="28" rx="8" fill={fill} stroke={stroke} strokeWidth="3" />}
      </svg>
    );
  }
  // Unknown descriptor: fall back to text so the game never breaks.
  return <span className="text-2xl font-black text-kid-ink-900 md:text-4xl">{descriptor}</span>;
}

/** Face-down card art: a sea star on ocean blue. */
function CardBackArt() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-kid-card bg-kid-sky-400">
      <svg viewBox="0 0 64 64" className="h-1/2 w-1/2" aria-hidden>
        <path
          d="M32 8 L37.5 25 L55 25 L41 35.5 L46.5 53 L32 43 L17.5 53 L23 35.5 L9 25 L26.5 25 Z"
          fill="#FFE66D"
          stroke="#E0B73C"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function buildCards(deck: MemoryDeck): PlayCard[] {
  const cards: PlayCard[] = [];
  deck.pairs.forEach((pair, pairIndex) => {
    cards.push({ key: pairIndex * 2, pairIndex, face: 'a' });
    cards.push({ key: pairIndex * 2 + 1, pairIndex, face: 'b' });
  });
  return shuffle(cards);
}

export default function MemoryCove({ child, onExit }: MemoryCoveProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [deck, setDeck] = useState<MemoryDeck>(MEMORY_DECKS[0]);
  const [cards, setCards] = useState<PlayCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId: child.id,
    gameKey: 'memory_game',
    stickerId: 'memory-master',
    milestone: 'memory_cove_win',
  });
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

  const startGame = useCallback(
    (nextDeck: MemoryDeck) => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      setDeck(nextDeck);
      setCards(buildCards(nextDeck));
      setFlipped([]);
      setMatched(new Set());
      setMoves(0);
      setLock(false);
      setStarsEarned(0);
      setPhase('play');
      playSfx('whoosh');
      speakAs(nextDeck.hostCharacter, `${nextDeck.intro} Find the matching pairs!`);
    },
    []
  );

  const handleWin = useCallback(
    async (wonDeck: MemoryDeck, finalMoves: number) => {
      const stars = Math.max(5, Math.min(20, Math.round(20 - (finalMoves - wonDeck.pairs.length) * 0.75)));
      setStarsEarned(stars);
      setPhase('won');
      playSfx('fanfare');
      speakAs(wonDeck.hostCharacter, `Amazing, ${child.nickname}! You found every pair! You earned ${stars} stars!`);
      await session.complete({
        stars,
        extraMetadata: { deck: wonDeck.id, moves: finalMoves },
      });
    },
    [child.id, child.nickname, session]
  );

  const flipCard = useCallback(
    (index: number) => {
      if (lock || phase !== 'play') return;
      const card = cards[index];
      if (!card || flipped.includes(index) || matched.has(card.pairIndex)) return;
      playSfx('click');
      const next = [...flipped, index];
      setFlipped(next);
      if (next.length === 2) {
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        setLock(true);
        const [x, y] = next;
        const a = cards[x];
        const b = cards[y];
        if (a.pairIndex === b.pairIndex) {
          later(MATCH_PAUSE_MS, () => {
            const grown = new Set(matched).add(a.pairIndex);
            setMatched(grown);
            setFlipped([]);
            setLock(false);
            playSfx('correct');
            speakAs(deck.hostCharacter, `You found a match! ${describePair(deck.id, deck.pairs[a.pairIndex])}!`);
            if (grown.size === deck.pairs.length) {
              void handleWin(deck, nextMoves);
            }
          });
        } else {
          playSfx('wrong');
          later(FLIP_BACK_MS, () => {
            setFlipped([]);
            setLock(false);
          });
        }
      }
    },
    [lock, phase, cards, flipped, matched, moves, deck, later, handleWin]
  );

  const replay = useCallback(() => {
    startGame(deck);
  }, [deck, startGame]);

  const hostName = deck.hostCharacter.charAt(0).toUpperCase() + deck.hostCharacter.slice(1);

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'pick' && (
        <div className="w-full max-w-3xl">
          <h1 className="animate-kid-rise text-center text-3xl font-black text-kid-ink-900 md:text-5xl">
            Memory Cove
          </h1>
          <p className="animate-kid-rise mt-2 text-center text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
            Flip the cards and find every matching pair. Pick a treasure chest to begin!
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            {MEMORY_DECKS.map((d, i) => (
              <button
                key={d.id}
                type="button"
                onClick={() => startGame(getDeck(d.id) ?? MEMORY_DECKS[0])}
                className="animate-kid-rise rounded-kid-card bg-white/90 px-5 py-4 text-left shadow-xl transition-transform hover:scale-[1.03] active:scale-95"
                style={{ animationDelay: `${0.15 + i * 0.07}s` }}
                aria-label={`Play ${d.title}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-kid-sky-300 text-xl font-black text-kid-ink-900">
                    {d.title.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-xl font-black text-kid-ink-900">{d.title}</span>
                    <span className="block text-sm font-bold text-kid-ink-700">
                      Hosted by {d.hostCharacter.charAt(0).toUpperCase() + d.hostCharacter.slice(1)}
                    </span>
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-kid-ink-700">{d.intro}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'play' && (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">{deck.title}</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with {hostName}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
                Moves: {moves}
              </div>
              <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
                {matched.size} / {deck.pairs.length}
              </div>
            </div>
          </div>

          <div className="mt-4 grid w-full grid-cols-4 gap-2 md:gap-3" role="grid" aria-label="Memory cards">
            {cards.map((card, index) => {
              const isUp = flipped.includes(index) || matched.has(card.pairIndex);
              const isMatched = matched.has(card.pairIndex);
              const pair = deck.pairs[card.pairIndex];
              return (
                <button
                  key={card.key}
                  type="button"
                  role="gridcell"
                  onClick={() => flipCard(index)}
                  disabled={isUp || lock}
                  aria-label={isUp ? `Card showing ${card.face === 'a' ? pair.a : pair.b}` : 'Face-down card'}
                  className="aspect-square w-full cursor-pointer disabled:cursor-default"
                  style={{ perspective: '800px' }}
                >
                  <div
                    className="relative h-full w-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.45s ease',
                    }}
                  >
                    <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                      <CardBackArt />
                    </div>
                    <div
                      className="absolute inset-0"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div
                        className={`flex h-full w-full items-center justify-center rounded-kid-card border-4 bg-white px-1 text-center ${
                          isMatched
                            ? 'border-kid-sun-400 shadow-[0_0_26px_10px_rgba(255,201,60,0.65)]'
                            : 'border-kid-sky-200 shadow-lg'
                        }`}
                      >
                        {card.face === 'a' || pair.kind === 'text' ? (
                          <span className="text-3xl font-black text-kid-ink-900 md:text-5xl">
                            {card.face === 'a' ? pair.a : pair.b}
                          </span>
                        ) : (
                          <GraphicFace descriptor={pair.b} />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPhase('pick')}
            className="mt-4 rounded-full bg-white/70 px-5 py-2 text-sm font-bold text-kid-ink-700 shadow backdrop-blur transition-transform active:scale-95"
          >
            Switch deck
          </button>
        </div>
      )}

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={child.nickname}
          title={`You did it, ${child.nickname}!`}
          message={`You found all ${deck.pairs.length} pairs in ${moves} moves!`}
          stickerId="memory-master"
          secondaryAction={{ label: 'Another deck', onClick: () => setPhase('pick') }}
          onPlayAgain={replay}
          onExit={onExit}
        />
      )}
    </KidShell>
  );
}
