'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LEVELS,
  runProgram,
  starsForLevel,
  GRID_SIZE,
  type Command,
  type Dir,
  type MazeLevel,
  type RunStep,
} from '@/lib/kid/coding';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { logLearningEvent } from '@/app/actions/learning';
import { checkTrophies } from '@/app/actions/trophies';
import KidShell from '@/components/kid/kid-shell';

export interface CodingCoveProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'map' | 'play' | 'complete';

interface CodeProgress {
  unlocked: number;
  stars: Record<string, number>;
}

const STEP_MS = 450;
const LEVEL_STARS = 2;
const COMPLETION_STARS = 15;

const COMMAND_LABEL: Record<Command, string> = {
  forward: 'Forward',
  left: 'Turn left',
  right: 'Turn right',
};

const DIR_DEG: Record<Dir, number> = { N: 0, E: 90, S: 180, W: 270 };

function loadProgress(childId: string): CodeProgress {
  try {
    const raw = window.localStorage.getItem(`sky-code-${childId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CodeProgress>;
      return {
        unlocked: Math.min(Math.max(1, parsed.unlocked ?? 1), LEVELS.length),
        stars: parsed.stars ?? {},
      };
    }
  } catch {
    /* corrupt data heals to defaults */
  }
  return { unlocked: 1, stars: {} };
}

function saveProgress(childId: string, progress: CodeProgress) {
  try {
    window.localStorage.setItem(`sky-code-${childId}`, JSON.stringify(progress));
  } catch {
    /* storage-full is non-fatal */
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

/** Milo as a direction arrow: robot face pointing the way he's facing. */
function MiloArrow({ dir, className }: { dir: Dir; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={`Milo facing ${dir === 'N' ? 'up' : dir === 'E' ? 'right' : dir === 'S' ? 'down' : 'left'}`}
      style={{ transform: `rotate(${DIR_DEG[dir]}deg)`, transition: 'transform 0.35s ease' }}
    >
      <circle cx="32" cy="34" r="20" fill="#4D96FF" stroke="#2B6FD6" strokeWidth="3" />
      <rect x="22" y="12" width="20" height="10" rx="4" fill="#9CC4FF" stroke="#2B6FD6" strokeWidth="2.5" />
      <circle cx="25" cy="32" r="4" fill="#fff" />
      <circle cx="39" cy="32" r="4" fill="#fff" />
      <circle cx="25" cy="32" r="2" fill="#17324F" />
      <circle cx="39" cy="32" r="2" fill="#17324F" />
      <path d="M26 44 q6 5 12 0" fill="none" stroke="#17324F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 0 L42 14 L22 14 Z" fill="#FF6B6B" stroke="#D64545" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function CommandIcon({ command, className }: { command: Command; className?: string }) {
  if (command === 'forward') {
    return (
      <svg viewBox="0 0 48 48" className={className} aria-hidden>
        <path d="M24 6 L38 24 L28 24 L28 42 L20 42 L20 24 L10 24 Z" fill="currentColor" />
      </svg>
    );
  }
  const flip = command === 'left' ? -1 : 1;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden style={{ transform: `scaleX(${flip})` }}>
      <path
        d="M30 8 C18 8 10 18 10 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M10 22 L10 34 L22 30 Z" fill="currentColor" transform="rotate(8 14 28)" />
    </svg>
  );
}

function MazeGrid({
  level,
  milo,
  crashed,
}: {
  level: MazeLevel;
  milo: RunStep;
  crashed: boolean;
}) {
  const walls = new Set(level.walls.map(([x, y]) => `${x},${y}`));
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isWall = walls.has(`${x},${y}`);
      const isGoal = x === level.goal.x && y === level.goal.y;
      const isStart = x === level.start.x && y === level.start.y;
      cells.push(
        <div
          key={`${x},${y}`}
          className={`flex items-center justify-center rounded-lg border-2 ${
            isWall
              ? 'border-kid-coral-600 bg-kid-coral-400'
              : isGoal
                ? 'border-kid-sun-500 bg-kid-sun-200'
                : isStart
                  ? 'border-kid-sky-500 bg-kid-sky-200'
                  : 'border-kid-sky-200 bg-white/80'
          }`}
        >
          {isWall && (
            <svg viewBox="0 0 32 32" className="h-2/3 w-2/3" aria-hidden>
              <path d="M8 24 L16 8 L24 24 Z" fill="#fff" opacity="0.7" />
              <path d="M12 24 L16 14 L20 24 Z" fill="#C2410C" opacity="0.5" />
            </svg>
          )}
          {isGoal && !isWall && <StarIcon className="h-3/4 w-3/4 animate-kid-bounce-soft" />}
        </div>
      );
    }
  }
  return (
    <div className="relative aspect-square w-full" role="img" aria-label={`Level ${level.level} maze`}>
      <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-1.5">{cells}</div>
      <div
        className={`absolute h-1/5 w-1/5 p-1 ${crashed ? 'animate-kid-shake' : ''}`}
        style={{
          left: `${(milo.x / GRID_SIZE) * 100}%`,
          top: `${(milo.y / GRID_SIZE) * 100}%`,
          transition: 'left 0.4s ease, top 0.4s ease',
        }}
      >
        <MiloArrow dir={milo.dir} className="h-full w-full drop-shadow-lg" />
      </div>
    </div>
  );
}

export default function CodingCove({ childId, nickname, onExit }: CodingCoveProps) {
  const [phase, setPhase] = useState<Phase>('map');
  const [progress, setProgress] = useState<CodeProgress>({ unlocked: 1, stars: {} });
  const [levelIdx, setLevelIdx] = useState(0);
  const [queue, setQueue] = useState<Command[]>([]);
  const [running, setRunning] = useState(false);
  const [animIdx, setAnimIdx] = useState(0);
  const [runPath, setRunPath] = useState<RunStep[]>([]);
  const [crashed, setCrashed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [wonStars, setWonStars] = useState<0 | 1 | 2 | 3>(0);
  const [levelDone, setLevelDone] = useState(false);
  const [starBalance, setStarBalance] = useState(0);
  const timers = useRef<number[]>([]);

  const level = LEVELS[levelIdx];
  const name = nickname ?? 'coder';

  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    setProgress(loadProgress(childId));
    speakAs('milo', `Welcome to my Coding Cove, ${name}! Queue up commands and guide me to the star!`);
    const pending = timers.current;
    return () => {
      pending.forEach((t) => window.clearTimeout(t));
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const startLevel = useCallback(
    (idx: number) => {
      const lv = LEVELS[idx];
      setLevelIdx(idx);
      setQueue([]);
      setRunning(false);
      setAnimIdx(0);
      setRunPath([]);
      setCrashed(false);
      setMessage(null);
      setWonStars(0);
      setLevelDone(false);
      setPhase('play');
      playSfx('whoosh');
      speakAs('milo', `Level ${lv.level}! ${lv.hint}`);
    },
    []
  );

  const addCommand = useCallback(
    (cmd: Command) => {
      if (running || levelDone) return;
      if (queue.length >= level.maxCommands) {
        speakAs('milo', `That's all ${level.maxCommands} commands! Press Run!`);
        return;
      }
      playSfx('click');
      setQueue((q) => [...q, cmd]);
    },
    [running, levelDone, queue.length, level.maxCommands]
  );

  const removeCommand = useCallback(
    (idx: number) => {
      if (running || levelDone) return;
      playSfx('click');
      setQueue((q) => q.filter((_, i) => i !== idx));
    },
    [running, levelDone]
  );

  const handleLevelWin = useCallback(
    async (lv: MazeLevel, commandsUsed: number) => {
      const stars = starsForLevel(lv, commandsUsed);
      setWonStars(stars);
      setLevelDone(true);
      playSfx('fanfare');
      const isFinal = lv.level === LEVELS.length;
      speakAs(
        'milo',
        isFinal
          ? `You did it, ${name}! You finished every maze! You are a true Code Captain!`
          : `Star reached, ${name}! ${stars} star${stars === 1 ? '' : 's'} for you!`
      );
      try {
        const balance = await awardStars(childId, LEVEL_STARS);
        setStarBalance(balance);
        const next: CodeProgress = {
          unlocked: Math.min(LEVELS.length, Math.max(progress.unlocked, lv.level + 1)),
          stars: { ...progress.stars, [lv.id]: Math.max(progress.stars[lv.id] ?? 0, stars) },
        };
        setProgress(next);
        saveProgress(childId, next);
        await logLearningEvent(childId, 'milestone', {
          metadata: { kind: 'coding_cove_level', level: lv.level, stars, commandsUsed },
        });
        if (isFinal) {
          const finalBalance = await awardStars(childId, COMPLETION_STARS);
          setStarBalance(finalBalance);
          await bumpQuestProgress(childId, 'coding_game', 1);
          await awardStickers(childId, ['code-captain']);
          await checkTrophies(childId, 'coding_done').catch(() => {});
          await logLearningEvent(childId, 'milestone', {
            metadata: { kind: 'coding_cove_win' },
          });
          setPhase('complete');
        }
      } catch {
        /* progress logging is best-effort; the celebration still stands */
      }
    },
    [childId, name, progress]
  );

  const runProgramCb = useCallback(() => {
    if (running || levelDone || queue.length === 0) return;
    const result = runProgram(level, queue);
    setRunPath(result.path);
    setAnimIdx(0);
    setRunning(true);
    setCrashed(false);
    setMessage(null);
    playSfx('whoosh');
    speakAs('milo', 'Running your program!');

    result.path.forEach((_, i) => {
      if (i === 0) return;
      later(i * STEP_MS, () => setAnimIdx(i));
    });

    later(result.path.length * STEP_MS + 200, () => {
      setRunning(false);
      if (result.outcome === 'goal') {
        void handleLevelWin(level, queue.length);
      } else if (result.outcome === 'crash') {
        setCrashed(true);
        playSfx('wrong');
        setMessage('Oops! Milo bumped into something. Try a different path!');
        speakAs('milo', 'Oops! I bumped into something. Change your commands and try again!');
        later(1400, () => {
          setCrashed(false);
          setRunPath([]);
          setAnimIdx(0);
        });
      } else {
        playSfx('wrong');
        setMessage('Milo ran out of moves before the star. Add more commands!');
        speakAs('milo', 'I ran out of moves! Add more commands and run again!');
        later(1200, () => {
          setRunPath([]);
          setAnimIdx(0);
        });
      }
    });
  }, [running, levelDone, queue, level, later, handleLevelWin]);

  const milo: RunStep =
    runPath.length > 0 ? runPath[Math.min(animIdx, runPath.length - 1)] : { ...level.start };

  return (
    <KidShell onExit={onExit} points={starBalance}>
      {phase === 'map' && (
        <div className="w-full max-w-3xl">
          <h1 className="animate-kid-rise text-center text-3xl font-black text-kid-ink-900 md:text-5xl">
            Milo&apos;s Coding Cove
          </h1>
          <p
            className="animate-kid-rise mt-2 text-center text-lg font-bold text-kid-ink-700 md:text-xl"
            style={{ animationDelay: '0.1s' }}
          >
            Queue up commands and guide Milo to the star. Pick a level, {name}!
          </p>
          <div
            className="mt-6 grid animate-kid-rise grid-cols-3 gap-3 md:grid-cols-4 md:gap-4"
            style={{ animationDelay: '0.15s' }}
          >
            {LEVELS.map((lv, i) => {
              const locked = i + 1 > progress.unlocked;
              const earned = progress.stars[lv.id] ?? 0;
              return (
                <button
                  key={lv.id}
                  type="button"
                  disabled={locked}
                  onClick={() => startLevel(i)}
                  aria-label={locked ? `Level ${lv.level}, locked` : `Level ${lv.level}${earned > 0 ? `, ${earned} stars earned` : ''}`}
                  className={`flex flex-col items-center gap-1 rounded-kid-card px-4 py-5 shadow-lg transition-transform ${
                    locked
                      ? 'cursor-not-allowed bg-kid-ink-200/60 opacity-60'
                      : 'bg-white/90 hover:scale-105 active:scale-95'
                  }`}
                >
                  <span className="text-2xl font-black text-kid-ink-900 md:text-3xl">{lv.level}</span>
                  {locked ? (
                    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
                      <rect x="8" y="14" width="16" height="12" rx="3" fill="#94A3B8" />
                      <path d="M11 14 v-3 a5 5 0 0 1 10 0 v3" fill="none" stroke="#94A3B8" strokeWidth="3" />
                    </svg>
                  ) : (
                    <span className="flex gap-0.5" aria-hidden>
                      {[1, 2, 3].map((s) => (
                        <StarIcon key={s} className={`h-5 w-5 ${s <= earned ? '' : 'opacity-25 grayscale'}`} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'play' && (
        <div className="flex w-full max-w-4xl flex-col items-center gap-4">
          <div className="flex w-full items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                playSfx('whoosh');
                setPhase('map');
              }}
              className="rounded-full bg-white/85 px-5 py-2 text-base font-black text-kid-ink-900 shadow-lg backdrop-blur transition-transform active:scale-95"
              aria-label="Back to level map"
            >
              ← Levels
            </button>
            <div className="rounded-full bg-white/85 px-4 py-2 text-base font-black text-kid-ink-900 shadow-lg backdrop-blur md:text-lg">
              Level {level.level}
              <button
                type="button"
                onClick={() => speakAs('milo', level.hint)}
                className="ml-2 rounded-full bg-kid-sky-300 px-3 py-1 text-sm font-black text-kid-ink-900"
                aria-label="Hear Milo's hint"
              >
                Hear hint
              </button>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2">
            <MazeGrid level={level} milo={milo} crashed={crashed} />

            <div className="flex flex-col gap-3">
              <div
                className="min-h-[76px] rounded-kid-card bg-white/90 p-3 shadow-lg"
                aria-label="Your command queue"
              >
                <p className="text-sm font-black text-kid-ink-700">
                  My program ({queue.length}/{level.maxCommands})
                </p>
                <div className="mt-1 flex min-h-[44px] flex-wrap gap-1.5">
                  {queue.length === 0 && (
                    <span className="text-sm font-bold text-kid-ink-500">
                      Tap the buttons below to add commands!
                    </span>
                  )}
                  {queue.map((cmd, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => removeCommand(i)}
                      disabled={running || levelDone}
                      aria-label={`Remove ${COMMAND_LABEL[cmd]} number ${i + 1}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-kid-sky-400 text-white shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                    >
                      <CommandIcon command={cmd} className="h-6 w-6" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['forward', 'left', 'right'] as Command[]).map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => addCommand(cmd)}
                    disabled={running || levelDone}
                    aria-label={`Add ${COMMAND_LABEL[cmd]}`}
                    className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-kid-card bg-kid-mint-400 px-2 py-3 font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                  >
                    <CommandIcon command={cmd} className="h-8 w-8" />
                    <span className="text-sm">{COMMAND_LABEL[cmd]}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={runProgramCb}
                  disabled={running || levelDone || queue.length === 0}
                  className="flex-1 rounded-full bg-kid-sun-400 px-8 py-4 text-xl font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {running ? 'Running…' : 'RUN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (running || levelDone) return;
                    playSfx('click');
                    setQueue([]);
                  }}
                  disabled={running || levelDone || queue.length === 0}
                  className="rounded-full bg-white/85 px-6 py-4 text-lg font-black text-kid-ink-700 shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                  aria-label="Clear all commands"
                >
                  Clear
                </button>
              </div>

              <div className="min-h-[28px] text-center" aria-live="polite">
                {message && <p className="text-base font-bold text-kid-ink-700">{message}</p>}
              </div>
            </div>
          </div>

          {levelDone && (
            <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
              <div className="flex gap-1">
                {[1, 2, 3].map((s) => (
                  <StarIcon key={s} className={`h-14 w-14 ${s <= wonStars ? 'animate-kid-bounce-soft' : 'opacity-25 grayscale'}`} />
                ))}
              </div>
              <h2 className="mt-3 text-3xl font-black text-kid-ink-900">Star reached!</h2>
              <p className="mt-2 text-lg font-bold text-kid-ink-700">
                Milo made it in {queue.length} command{queue.length === 1 ? '' : 's'}!
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {level.level < LEVELS.length ? (
                  <button
                    type="button"
                    onClick={() => startLevel(levelIdx + 1)}
                    className="rounded-full bg-kid-sky-400 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    Next level
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPhase('map')}
                    className="rounded-full bg-kid-sky-400 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    Back to map
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startLevel(levelIdx)}
                  className="rounded-full bg-kid-sun-400 px-8 py-3 text-lg font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Play again
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'complete' && (
        <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center rounded-kid-card bg-white/95 px-8 py-8 text-center shadow-2xl">
          <div className="animate-kid-bounce-soft">
            <StarIcon className="h-24 w-24 md:h-28 md:w-28" />
          </div>
          <h2 className="mt-3 text-3xl font-black text-kid-ink-900 md:text-4xl">
            Code Captain, {name}!
          </h2>
          <p className="mt-2 text-lg font-bold text-kid-ink-700">
            You guided Milo through all 12 mazes!
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPhase('map')}
              className="rounded-full bg-kid-sky-400 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Back to map
            </button>
            <button
              type="button"
              onClick={onExit}
              className="rounded-full bg-kid-sun-400 px-8 py-3 text-lg font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Keep exploring
            </button>
          </div>
        </div>
      )}
    </KidShell>
  );
}
