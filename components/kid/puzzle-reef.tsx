'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PUZZLES,
  DIFFICULTY_LABELS,
  getPuzzle,
  puzzlesForDifficulty,
  type Puzzle,
  type PuzzleDifficulty,
  type PuzzleShape,
  type PuzzleSlot,
} from '@/lib/kid/puzzles';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { logLearningEvent } from '@/app/actions/learning';
import KidShell from '@/components/kid/kid-shell';

export interface PuzzleReefProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'pick' | 'play' | 'sessionDone';

const ADVANCE_MS = 1900;
const SHAKE_MS = 650;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** One 4-puzzle adventure: a random puzzle from each difficulty, then a rotating bonus pick. */
function buildSession(): Puzzle[] {
  const picks: Puzzle[] = [];
  ([1, 2, 3] as PuzzleDifficulty[]).forEach((d) => {
    const pool = shuffle(puzzlesForDifficulty(d));
    picks.push(pool[0]);
  });
  const rest = shuffle(PUZZLES.filter((p) => !picks.includes(p)));
  picks.push(rest[0]);
  return picks;
}

function slotTransform(slot: PuzzleSlot): string {
  return `translate(${slot.x} ${slot.y}) rotate(${slot.rotation}) scale(${slot.size / 100}) translate(-50 -50)`;
}

/** Geometric puzzle piece / slot art. Plain SVG, never emoji. */
function PieceShape({
  shape,
  color,
  silhouette = false,
  highlight = false,
}: {
  shape: PuzzleShape;
  color: string;
  silhouette?: boolean;
  highlight?: boolean;
}) {
  const fill = silhouette ? 'rgba(23,50,79,0.08)' : color;
  const stroke = silhouette ? (highlight ? '#FFB020' : '#9DB4CC') : 'rgba(23,50,79,0.55)';
  const common = {
    fill,
    stroke,
    strokeWidth: silhouette ? (highlight ? 6 : 3.5) : 5,
    strokeLinejoin: 'round' as const,
    ...(silhouette ? { strokeDasharray: '10 7' } : {}),
  };
  switch (shape) {
    case 'circle':
      return <circle cx="50" cy="50" r="44" {...common} />;
    case 'square':
      return <rect x="6" y="6" width="88" height="88" rx="12" {...common} />;
    case 'triangle':
      return <polygon points="50,8 92,88 8,88" {...common} />;
    case 'star':
      return (
        <path
          d="M50 6 L61.5 37.5 L94 37.5 L68 56.5 L77.5 89.5 L50 70 L22.5 89.5 L32 56.5 L6 37.5 L38.5 37.5 Z"
          {...common}
        />
      );
    case 'semicircle':
      return <path d="M8 58 A42 42 0 0 1 92 58 Z" {...common} />;
    case 'diamond':
      return <polygon points="50,6 94,50 50,94 6,50" {...common} />;
    case 'oval':
      return <ellipse cx="50" cy="50" rx="44" ry="30" {...common} />;
    case 'rectangle':
      return <rect x="6" y="24" width="88" height="52" rx="10" {...common} />;
  }
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

export default function PuzzleReef({ childId, nickname = 'friend', onExit }: PuzzleReefProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [session, setSession] = useState<Puzzle[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle>(PUZZLES[0]);
  const [trayOrder, setTrayOrder] = useState<string[]>([]);
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [popId, setPopId] = useState<string | null>(null);
  const [hintSpoken, setHintSpoken] = useState(false);
  const [sessionStars, setSessionStars] = useState(0);
  const [starBalance, setStarBalance] = useState(0);
  const starsRef = useRef(0);
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

  const startPuzzle = useCallback(
    (next: Puzzle, nextSession: Puzzle[], nextIndex: number) => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      setSession(nextSession);
      setSessionIndex(nextIndex);
      setPuzzle(next);
      setTrayOrder(shuffle(next.pieces.map((p) => p.id)));
      setPlacedIds([]);
      setSelectedId(null);
      setMistakes(0);
      setShakeId(null);
      setPopId(null);
      setHintSpoken(false);
      setPhase('play');
      playSfx('whoosh');
      speakAs(next.hostCharacter, next.intro);
    },
    []
  );

  const startAdventure = useCallback(() => {
    starsRef.current = 0;
    setSessionStars(0);
    const list = buildSession();
    startPuzzle(list[0], list, 0);
  }, [startPuzzle]);

  const playSingle = useCallback(
    (id: string) => {
      const found = getPuzzle(id) ?? PUZZLES[0];
      starsRef.current = 0;
      setSessionStars(0);
      startPuzzle(found, [found], 0);
    },
    [startPuzzle]
  );

  const finishSession = useCallback(async () => {
    const total = starsRef.current;
    setPhase('sessionDone');
    playSfx('fanfare');
    speakAs(
      'curio',
      total >= 10
        ? `Incredible, ${nickname}! A perfect puzzle adventure! You earned ${total} stars!`
        : `Wonderful building, ${nickname}! You earned ${total} stars!`
    );
    try {
      const balance = await awardStars(childId, total);
      setStarBalance(balance);
      await logLearningEvent(childId, 'milestone', {
        metadata: {
          kind: 'puzzle_reef_session',
          puzzles: session.map((p) => p.id),
          stars: total,
        },
      });
    } catch {
      /* progress logging is best-effort; the celebration still stands */
    }
  }, [childId, nickname, session]);

  const completePuzzle = useCallback(
    (finalMistakes: number) => {
      const stars = finalMistakes === 0 ? 3 : finalMistakes <= 2 ? 2 : 1;
      starsRef.current += stars;
      setSessionStars(starsRef.current);
      playSfx('fanfare');
      speakAs(
        puzzle.hostCharacter,
        `Amazing, ${nickname}! You built the ${puzzle.subject}! You earned ${stars} stars!`
      );
      bumpQuestProgress(childId, 'puzzle_game', 1).catch(() => {});
      awardStickers(childId, ['puzzle-pro']).catch(() => {});
      later(ADVANCE_MS, () => {
        if (sessionIndex + 1 < session.length) {
          startPuzzle(session[sessionIndex + 1], session, sessionIndex + 1);
        } else {
          void finishSession();
        }
      });
    },
    [childId, nickname, puzzle, session, sessionIndex, startPuzzle, finishSession, later]
  );

  const tapPiece = useCallback(
    (id: string) => {
      if (phase !== 'play' || placedIds.includes(id)) return;
      playSfx('click');
      setSelectedId((prev) => (prev === id ? null : id));
    },
    [phase, placedIds]
  );

  const tapSlot = useCallback(
    (slotPieceId: string) => {
      if (phase !== 'play' || placedIds.includes(slotPieceId)) return;
      if (!selectedId) {
        if (!hintSpoken) {
          setHintSpoken(true);
          speakAs(puzzle.hostCharacter, 'Tap a puzzle piece first, then tap where it goes!');
        }
        return;
      }
      if (selectedId === slotPieceId) {
        const grown = [...placedIds, slotPieceId];
        setPlacedIds(grown);
        setSelectedId(null);
        setPopId(slotPieceId);
        later(SHAKE_MS, () => setPopId(null));
        playSfx('correct');
        if (grown.length === puzzle.pieces.length) {
          completePuzzle(mistakes);
        }
      } else {
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        setShakeId(selectedId);
        later(SHAKE_MS, () => setShakeId(null));
        setSelectedId(null);
        playSfx('wrong');
      }
    },
    [phase, placedIds, selectedId, hintSpoken, puzzle, mistakes, completePuzzle, later]
  );

  const hostName = puzzle.hostCharacter.charAt(0).toUpperCase() + puzzle.hostCharacter.slice(1);
  const loosePieces = trayOrder.flatMap((id) => {
    const found = puzzle.pieces.find((p) => p.id === id);
    return found && !placedIds.includes(found.id) ? [found] : [];
  });

  return (
    <KidShell onExit={onExit} points={phase === 'sessionDone' ? starBalance : 0}>
      {phase === 'pick' && (
        <div className="w-full max-w-3xl">
          <h1 className="animate-kid-rise text-center text-3xl font-black text-kid-ink-900 md:text-5xl">
            Puzzle Reef
          </h1>
          <p
            className="animate-kid-rise mt-2 text-center text-lg font-bold text-kid-ink-700 md:text-xl"
            style={{ animationDelay: '0.1s' }}
          >
            Tap a piece, then tap its spot in the gray shape. Build all the sea friends!
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={startAdventure}
              className="animate-kid-rise rounded-full bg-kid-sun-400 px-10 py-4 text-xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
              style={{ animationDelay: '0.15s' }}
            >
              Start Puzzle Adventure (4 puzzles)
            </button>
          </div>
          {([1, 2, 3] as PuzzleDifficulty[]).map((d, di) => (
            <div key={d} className="mt-6">
              <h2
                className="animate-kid-rise text-xl font-black text-kid-ink-900 md:text-2xl"
                style={{ animationDelay: `${0.2 + di * 0.05}s` }}
              >
                {DIFFICULTY_LABELS[d].name}
                <span className="ml-2 text-sm font-bold text-kid-ink-700">{DIFFICULTY_LABELS[d].tagline}</span>
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {puzzlesForDifficulty(d).map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => playSingle(p.id)}
                    className="animate-kid-rise rounded-kid-card bg-white/90 px-4 py-4 text-center shadow-xl transition-transform hover:scale-[1.03] active:scale-95"
                    style={{ animationDelay: `${0.25 + di * 0.05 + i * 0.05}s` }}
                    aria-label={`Build ${p.title}`}
                  >
                    <svg viewBox={p.viewBox} className="mx-auto h-20 w-20 md:h-24 md:w-24" aria-hidden>
                      {p.pieces.map((piece) => (
                        <g key={piece.id} transform={slotTransform(piece.slot)}>
                          <PieceShape shape={piece.shape} color={piece.color} />
                        </g>
                      ))}
                    </svg>
                    <span className="mt-1 block text-base font-black text-kid-ink-900">{p.title}</span>
                    <span className="block text-xs font-bold text-kid-ink-700">
                      {p.pieces.length} pieces
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === 'play' && (
        <div className="flex w-full max-w-4xl flex-col items-center">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">{puzzle.title}</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with {hostName}</span>
            </div>
            <div className="flex items-center gap-2">
              {session.length > 1 && (
                <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
                  Puzzle {sessionIndex + 1} / {session.length}
                </div>
              )}
              <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
                {placedIds.length} / {puzzle.pieces.length}
              </div>
            </div>
          </div>

          <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-kid-card bg-white/90 p-4 shadow-xl">
              <svg
                viewBox={puzzle.viewBox}
                className="mx-auto aspect-square w-full max-w-md"
                role="group"
                aria-label={`${puzzle.title} silhouette`}
              >
                {puzzle.pieces.map((piece) => {
                  const isPlaced = placedIds.includes(piece.id);
                  const isPop = popId === piece.id;
                  return (
                    <g key={piece.id} transform={slotTransform(piece.slot)}>
                      {isPlaced ? (
                        <g
                          className={isPop ? 'animate-kid-pop-in' : undefined}
                          style={isPop ? { transformBox: 'fill-box', transformOrigin: 'center' } : undefined}
                        >
                          <PieceShape shape={piece.shape} color={piece.color} />
                        </g>
                      ) : (
                        <g
                          onClick={() => tapSlot(piece.id)}
                          className={selectedId ? 'cursor-pointer' : ''}
                          role="button"
                          aria-label={`Empty spot for the ${piece.shape}`}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') tapSlot(piece.id);
                          }}
                        >
                          <PieceShape shape={piece.shape} color={piece.color} silhouette highlight={Boolean(selectedId)} />
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex flex-col rounded-kid-card bg-white/90 p-4 shadow-xl">
              <p className="text-center text-base font-black text-kid-ink-900 md:text-lg">
                {selectedId ? 'Now tap its spot in the gray shape!' : 'Tap a piece to pick it up'}
              </p>
              <div className="mt-3 grid flex-1 grid-cols-3 content-start gap-3" role="list" aria-label="Loose pieces">
                {loosePieces.map((piece) => {
                  const isSelected = selectedId === piece.id;
                  const isShaking = shakeId === piece.id;
                  return (
                    <button
                      key={piece.id}
                      type="button"
                      role="listitem"
                      onClick={() => tapPiece(piece.id)}
                      aria-label={`${piece.color} ${piece.shape} piece${isSelected ? ', selected' : ''}`}
                      aria-pressed={isSelected}
                      className={`flex aspect-square w-full items-center justify-center rounded-kid-card border-4 bg-kid-sky-100 p-2 shadow-lg transition-all ${
                        isShaking ? 'animate-kid-shake' : ''
                      } ${
                        isSelected
                          ? 'scale-110 border-kid-sun-400 shadow-[0_0_24px_8px_rgba(255,201,60,0.55)]'
                          : 'border-kid-sky-200 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
                        <PieceShape shape={piece.shape} color={piece.color} />
                      </svg>
                    </button>
                  );
                })}
                {loosePieces.length === 0 && (
                  <p className="col-span-3 py-8 text-center text-lg font-black text-kid-ink-700">
                    All pieces placed! Wonderful!
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setPhase('pick');
            }}
            className="mt-4 rounded-full bg-white/70 px-5 py-2 text-sm font-bold text-kid-ink-700 shadow backdrop-blur transition-transform active:scale-95"
          >
            Choose another puzzle
          </button>
        </div>
      )}

      {phase === 'sessionDone' && (
        <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
          <div className="animate-kid-bounce-soft">
            <StarIcon className="h-24 w-24 md:h-28 md:w-28" />
          </div>
          <h2 className="mt-3 text-3xl font-black text-kid-ink-900 md:text-4xl">
            Reef built, {nickname}!
          </h2>
          <p className="mt-2 text-lg font-bold text-kid-ink-700">
            You finished {session.length} {session.length === 1 ? 'puzzle' : 'puzzles'} and earned
          </p>
          <div className="mt-2 flex items-center gap-2">
            <StarIcon className="h-10 w-10" />
            <span className="text-4xl font-black tabular-nums text-kid-ink-900">{sessionStars}</span>
            <span className="text-2xl font-black text-kid-ink-700">stars</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={startAdventure}
              className="rounded-full bg-kid-sky-400 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={() => setPhase('pick')}
              className="rounded-full bg-kid-sun-400 px-8 py-3 text-lg font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Pick a puzzle
            </button>
          </div>
        </div>
      )}
    </KidShell>
  );
}
