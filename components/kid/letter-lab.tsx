'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SESSION_LENGTH,
  letterPassed,
  letterStrokes,
  phonicsFor,
  pickSessionLetters,
  sampleStroke,
  type Pt,
} from '@/lib/kid/writing';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen } from './game-shell';
import KidShell from '@/components/kid/kid-shell';
import { AVATARS } from '@/components/avatars';

export interface LetterLabProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';
type LetterPhase = 'watch' | 'trace' | 'celebrate';

const STROKE_MS = 900;
const STROKE_PAUSE_MS = 380;
const CELEBRATE_MS = 2600;
const CANVAS_PX = 480;
const HOST = 'luna';

const TRY_AGAIN_LINES = [
  'Good try! Follow the soft lines once more.',
  'Almost! Trace right over the soft gray lines.',
  'Nice effort! Slow and steady over the lines.',
];

function pathFrom(points: Pt[]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M10 20 h8 l10 -8 v24 l-10 -8 h-8 z" fill="#fff" stroke="#17324F" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 18 q6 6 0 12 M35 13 q10 11 0 22" fill="none" stroke="#17324F" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

/** Animated stroke-order demo: a glowing dot draws each stroke in turn. */
function WatchDemo({ letter, onDone }: { letter: string; onDone: () => void }) {
  const strokes = letterStrokes(letter);
  const [doneCount, setDoneCount] = useState(0);
  const [head, setHead] = useState<{ idx: number; frac: number } | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setDoneCount(0);
    setHead(null);
    let raf = 0;
    let strokeIdx = 0;
    let strokeStart = 0;
    let started = false;
    const tick = (now: number) => {
      if (!started) {
        started = true;
        strokeStart = now;
      }
      const stroke = strokes[strokeIdx];
      if (!stroke) {
        if (!doneRef.current) {
          doneRef.current = true;
          setDoneCount(strokes.length);
          setHead(null);
          window.setTimeout(onDone, STROKE_PAUSE_MS);
        }
        return;
      }
      const elapsed = now - strokeStart;
      if (elapsed >= STROKE_MS) {
        strokeIdx++;
        setDoneCount(strokeIdx);
        setHead(null);
        strokeStart = now + STROKE_PAUSE_MS;
      } else {
        setHead({ idx: strokeIdx, frac: Math.min(1, elapsed / STROKE_MS) });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter]);

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={`How to write ${letter}`}>
      {strokes.map((s, i) => (
        <g key={i}>
          <path d={pathFrom(s)} fill="none" stroke="#D7E3F4" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" />
          {i < doneCount && (
            <path d={pathFrom(s)} fill="none" stroke="#7C5CBF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {head && head.idx === i && (
            <path
              d={pathFrom(sampleStroke(s, 40).slice(0, Math.max(2, Math.floor(head.frac * 40))))}
              fill="none"
              stroke="#7C5CBF"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <circle cx={s[0][0]} cy={s[0][1]} r="5.5" fill="#FFD93C" stroke="#B97F00" strokeWidth="1.5" />
          <text x={s[0][0]} y={s[0][1] + 3.4} textAnchor="middle" fontSize="7" fontWeight="900" fill="#17324F">
            {i + 1}
          </text>
        </g>
      ))}
      {head &&
        (() => {
          const s = strokes[head.idx];
          const pts = sampleStroke(s, 40);
          const p = pts[Math.max(0, Math.min(pts.length - 1, Math.floor(head.frac * 40)))];
          return (
            <g>
              <circle cx={p[0]} cy={p[1]} r="9" fill="#FFD93C" opacity="0.35" />
              <circle cx={p[0]} cy={p[1]} r="5" fill="#FFD93C" stroke="#B97F00" strokeWidth="2" />
            </g>
          );
        })()}
    </svg>
  );
}

export default function LetterLab({ childId, nickname = 'friend', onExit }: LetterLabProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [letters, setLetters] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [letterPhase, setLetterPhase] = useState<LetterPhase>('watch');
  const [kidStrokes, setKidStrokes] = useState<Pt[][]>([]);
  const [retries, setRetries] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'writing_game',
    stickerId: 'pen-pal',
    trophyEvent: 'writing_done',
    milestone: 'letter_lab_win',
    learning: { gameId: 'letter-lab', skill: 'trace_letters' },
  });
  const starBalance = session.starBalance ?? 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<Pt[]>([]);
  const timers = useRef<number[]>([]);
  const tryAgainRef = useRef(0);
  const seedRef = useRef<number>(0);
  if (seedRef.current === 0) seedRef.current = Date.now() % 2147483647;

  const LunaAvatar = AVATARS.luna.Component;
  const letter = letters[index] ?? '';
  const ph = phonicsFor(letter);

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
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setLetters(pickSessionLetters(seedRef.current));
    setIndex(0);
    setLetterPhase('watch');
    setKidStrokes([]);
    setRetries(0);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
  }, []);

  const speakLetterIntro = useCallback(
    (ch: string) => {
      const p = phonicsFor(ch);
      speakAs(HOST, `Watch! I write ${p.name} like this.`);
    },
    []
  );

  const beginLetter = useCallback(
    (i: number, next: string[]) => {
      setIndex(i);
      setLetterPhase('watch');
      setKidStrokes([]);
      speakLetterIntro(next[i]);
    },
    [speakLetterIntro]
  );

  // Draw the ghost letter + kid strokes onto the canvas.
  const paintCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !letter) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scale = CANVAS_PX / 100;
    ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);
    // writing guide lines
    ctx.strokeStyle = '#E8F0FA';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    for (const y of [12, 50, 88]) {
      ctx.beginPath();
      ctx.moveTo(8 * scale, y * scale);
      ctx.lineTo(92 * scale, y * scale);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // ghost strokes
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of letterStrokes(letter)) {
      ctx.beginPath();
      s.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x * scale, y * scale);
        else ctx.lineTo(x * scale, y * scale);
      });
      ctx.strokeStyle = '#C9D8EC';
      ctx.lineWidth = 13;
      ctx.stroke();
    }
    // kid strokes
    ctx.strokeStyle = '#7C5CBF';
    ctx.lineWidth = 11;
    for (const s of kidStrokes) {
      if (s.length < 2) continue;
      ctx.beginPath();
      s.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x * scale, y * scale);
        else ctx.lineTo(x * scale, y * scale);
      });
      ctx.stroke();
    }
  }, [letter, kidStrokes]);

  useEffect(() => {
    if (letterPhase === 'trace') paintCanvas();
  }, [letterPhase, paintCanvas]);

  const pointFromEvent = (e: React.PointerEvent): Pt => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [
      Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    ];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (letterPhase !== 'trace') return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    currentStrokeRef.current = [pointFromEvent(e)];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || letterPhase !== 'trace') return;
    e.preventDefault();
    const p = pointFromEvent(e);
    const cur = currentStrokeRef.current;
    const last = cur[cur.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.8) {
      cur.push(p);
      // live paint the in-progress stroke
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && last) {
        const scale = CANVAS_PX / 100;
        ctx.strokeStyle = '#7C5CBF';
        ctx.lineWidth = 11;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(last[0] * scale, last[1] * scale);
        ctx.lineTo(p[0] * scale, p[1] * scale);
        ctx.stroke();
      }
    }
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentStrokeRef.current.length >= 2) {
      setKidStrokes((prev) => [...prev, currentStrokeRef.current]);
    }
    currentStrokeRef.current = [];
  };

  const advance = useCallback(
    (next: string[], i: number) => {
      if (i + 1 >= next.length) {
        const stars = retries === 0 ? 3 : retries <= 3 ? 2 : 1;
        setStarsEarned(stars);
        setPhase('won');
        playSfx('fanfare');
        speakAs(HOST, `Amazing writing, ${nickname}! You earned ${stars} stars!`);
        void session.complete({ stars, extraMetadata: { letters: next.length, retries } });
      } else {
        beginLetter(i + 1, next);
      }
    },
    [retries, nickname, session, beginLetter]
  );

  const checkTracing = useCallback(() => {
    if (letterPhase !== 'trace') return;
    const allPoints = kidStrokes.flat();
    if (allPoints.length < 4) {
      speakAs(HOST, 'Trace the letter with your finger first!');
      return;
    }
    const passed = letterPassed(letter, allPoints);
    // First trace per letter is the evidence (uppercase is level 2, lowercase 3).
    session.recordAnswer(passed, { level: letter === letter.toUpperCase() ? 2 : 3, itemKey: `${index}-${letter}` });
    if (passed) {
      playSfx('correct');
      setLetterPhase('celebrate');
      speakAs(HOST, `${ph.name}! ${ph.sound}, like ${ph.word}! Wonderful writing!`);
      later(CELEBRATE_MS, () => advance(letters, index));
    } else {
      playSfx('wrong');
      setRetries((r) => r + 1);
      const line = TRY_AGAIN_LINES[tryAgainRef.current % TRY_AGAIN_LINES.length];
      tryAgainRef.current++;
      speakAs(HOST, line);
    }
  }, [letterPhase, kidStrokes, letter, ph, letters, index, later, advance, session]);

  const watchDone = useCallback(() => {
    setLetterPhase('trace');
    speakAs(HOST, `Now you try! Trace the soft ${ph.name} with your finger.`);
  }, [ph]);

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-xl flex-col items-center px-4 text-center">
          <div className="animate-kid-bounce-soft h-28 w-28 md:h-36 md:w-36">
            <LunaAvatar className="h-full w-full" />
          </div>
          <h1 className="animate-kid-rise mt-2 text-3xl font-black text-kid-ink-900 md:text-5xl">Letter Lab</h1>
          <p className="animate-kid-rise mt-2 text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
            Watch Luna write each letter, then trace it yourself with your finger!
          </p>
          <button
            type="button"
            onClick={() => {
              playSfx('pop');
              speakAs(HOST, `Welcome to the Letter Lab, ${nickname}! Watch how I write each letter, then trace it with your finger!`);
              startGame();
            }}
            className="animate-kid-rise mt-6 rounded-full bg-kid-grape-400 px-10 py-4 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
          >
            Start writing
          </button>
        </div>
      )}

      {phase === 'play' && letter && (
        <div className="flex w-full max-w-4xl flex-col items-center px-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="h-10 w-10"><LunaAvatar className="h-full w-full" /></span>
              <span className="text-base font-black text-kid-ink-900 md:text-lg">
                Letter {index + 1} of {letters.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => speakAs(HOST, `${ph.name}! ${ph.sound}, like ${ph.word}.`)}
              className="flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-base font-black text-kid-ink-900 shadow-lg backdrop-blur transition-transform active:scale-95"
              aria-label={`Hear the letter ${letter}`}
            >
              <SpeakerIcon className="h-8 w-8" />
              Hear it
            </button>
          </div>

          <div className="mt-4 flex w-full flex-col items-center gap-4 md:flex-row md:items-start md:justify-center">
            <div className="w-full max-w-[300px] shrink-0 md:max-w-[340px]">
              <div className="rounded-kid-card bg-white/90 p-3 shadow-xl">
                <p className="mb-1 text-center text-sm font-black uppercase tracking-wide text-kid-ink-700">
                  {letterPhase === 'watch' ? 'Watch Luna' : letterPhase === 'trace' ? 'Your turn' : 'You did it!'}
                </p>
                <div className="aspect-square w-full" aria-hidden={letterPhase !== 'watch'}>
                  {letterPhase === 'watch' ? (
                    <WatchDemo key={`${index}-watch`} letter={letter} onDone={watchDone} />
                  ) : (
                    <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={`Letter ${letter}`}>
                      {letterStrokes(letter).map((s, i) => (
                        <path key={i} d={pathFrom(s)} fill="none" stroke="#7C5CBF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                      ))}
                    </svg>
                  )}
                </div>
                {letterPhase === 'trace' && (
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      setLetterPhase('watch');
                      speakLetterIntro(letter);
                    }}
                    className="mt-2 w-full rounded-full bg-kid-sky-200 px-4 py-2 text-sm font-black text-kid-ink-900 transition-transform active:scale-95"
                  >
                    Watch again
                  </button>
                )}
              </div>
            </div>

            <div className="flex w-full max-w-[520px] flex-col items-center">
              {letterPhase === 'trace' ? (
                <>
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_PX}
                    height={CANVAS_PX}
                    className="aspect-square w-full touch-none select-none rounded-kid-card bg-white shadow-xl"
                    style={{ touchAction: 'none' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endStroke}
                    onPointerCancel={endStroke}
                    onPointerLeave={endStroke}
                    role="img"
                    aria-label={`Tracing canvas for the letter ${letter}. Trace over the soft lines with your finger.`}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        playSfx('click');
                        setKidStrokes([]);
                        paintCanvas();
                      }}
                      className="rounded-full bg-white/80 px-6 py-3 text-lg font-black text-kid-ink-700 shadow-lg transition-transform active:scale-95"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSfx('pop');
                        checkTracing();
                      }}
                      className="rounded-full bg-kid-grape-400 px-10 py-3 text-xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
                    >
                      Done
                    </button>
                  </div>
                </>
              ) : (
                <div className="animate-kid-pop-in flex aspect-square w-full flex-col items-center justify-center rounded-kid-card bg-white/95 p-6 text-center shadow-xl">
                  {letterPhase === 'watch' ? (
                    <>
                      <span className="text-8xl font-black text-kid-ink-300 md:text-9xl" aria-hidden>{letter}</span>
                      <p className="mt-3 text-lg font-bold text-kid-ink-700">Watch the glowing dot…</p>
                    </>
                  ) : (
                    <>
                      <span className="animate-kid-bounce-soft text-8xl font-black text-kid-grape-500 md:text-9xl" aria-hidden>{letter}</span>
                      <p className="mt-3 text-2xl font-black text-kid-ink-900">
                        {ph.name}! {ph.sound}, like {ph.word}!
                      </p>
                      <button
                        type="button"
                        onClick={() => advance(letters, index)}
                        className="mt-4 rounded-full bg-kid-sun-400 px-8 py-3 text-lg font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
                      >
                        Next letter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Great writing, ${nickname}!`}
          message={`You traced all ${SESSION_LENGTH} letters`}
          stickerId="pen-pal"
          onPlayAgain={() => {
            seedRef.current = (seedRef.current + 1) % 2147483647;
            startGame();
          }}
          onExit={onExit}
          playAgainLabel="Write again"
        />
      )}
    </KidShell>
  );
}
