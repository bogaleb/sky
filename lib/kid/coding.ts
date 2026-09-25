/**
 * Milo's Coding Cove — queue commands to guide Milo through mazes to the star.
 *
 * Grid is 5x5, coordinates x (0-4 left to right), y (0-4 top to bottom).
 * Commands: 'forward' | 'left' | 'right'. 'left'/'right' rotate Milo in place.
 * runProgram() is a pure, deterministic simulator used by both the game
 * and the tests.
 */

export type Command = 'forward' | 'left' | 'right';
export const COMMANDS: Command[] = ['forward', 'left', 'right'];

export type Dir = 'N' | 'E' | 'S' | 'W';

export interface MazePos {
  x: number;
  y: number;
}

export interface MazeLevel {
  id: string;
  /** 1-based level number shown to kids. */
  level: number;
  /** Wall cells as [x, y] pairs. */
  walls: Array<[number, number]>;
  start: MazePos & { dir: Dir };
  goal: MazePos;
  /** Hard cap on queued commands. */
  maxCommands: number;
  /** Solution length for 3 stars. */
  par: number;
  /** Spoken hint from Milo. */
  hint: string;
}

export interface RunStep extends MazePos {
  dir: Dir;
}

export type RunOutcome = 'goal' | 'crash' | 'out-of-moves';

export interface RunResult {
  /** Positions Milo visited, including turns (same x/y, new dir). */
  path: RunStep[];
  outcome: RunOutcome;
  /** Number of commands consumed. */
  steps: number;
}

export const GRID_SIZE = 5;

const DX: Record<Dir, number> = { N: 0, E: 1, S: 0, W: -1 };
const DY: Record<Dir, number> = { N: -1, E: 0, S: 1, W: 0 };
const DIRS: Dir[] = ['N', 'E', 'S', 'W'];

function turn(dir: Dir, cmd: 'left' | 'right'): Dir {
  const i = DIRS.indexOf(dir);
  return DIRS[(i + (cmd === 'right' ? 1 : 3)) % 4];
}

export const LEVELS: MazeLevel[] = [
  {
    id: 'cove-1',
    level: 1,
    walls: [],
    start: { x: 0, y: 2, dir: 'E' },
    goal: { x: 3, y: 2 },
    maxCommands: 6,
    par: 3,
    hint: 'Press Forward three times to zoom to the star!',
  },
  {
    id: 'cove-2',
    level: 2,
    walls: [],
    start: { x: 1, y: 1, dir: 'E' },
    goal: { x: 3, y: 3 },
    maxCommands: 8,
    par: 5,
    hint: 'Go straight, then turn Right and go straight again!',
  },
  {
    id: 'cove-3',
    level: 3,
    walls: [],
    start: { x: 3, y: 1, dir: 'W' },
    goal: { x: 1, y: 3 },
    maxCommands: 8,
    par: 5,
    hint: 'Go straight, then turn Left and march down!',
  },
  {
    id: 'cove-4',
    level: 4,
    walls: [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    start: { x: 0, y: 0, dir: 'S' },
    goal: { x: 4, y: 4 },
    maxCommands: 12,
    par: 9,
    hint: 'A wall blocks the way! Go down, around the bottom, then across.',
  },
  {
    id: 'cove-5',
    level: 5,
    walls: [[2, 2]],
    start: { x: 0, y: 2, dir: 'E' },
    goal: { x: 4, y: 2 },
    maxCommands: 13,
    par: 10,
    hint: 'Zigzag around the rock in the middle!',
  },
  {
    id: 'cove-6',
    level: 6,
    walls: [
      [2, 2],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
    start: { x: 2, y: 4, dir: 'N' },
    goal: { x: 2, y: 0 },
    maxCommands: 13,
    par: 10,
    hint: 'The middle is blocked. Loop around the right side!',
  },
  {
    id: 'cove-7',
    level: 7,
    walls: [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
    ],
    start: { x: 0, y: 0, dir: 'E' },
    goal: { x: 4, y: 4 },
    maxCommands: 23,
    par: 20,
    hint: 'Snake all the way down the cove, row by row!',
  },
  {
    id: 'cove-8',
    level: 8,
    walls: [
      [1, 3],
      [3, 1],
      [4, 2],
      [0, 1],
      [1, 4],
    ],
    start: { x: 0, y: 4, dir: 'N' },
    goal: { x: 4, y: 0 },
    maxCommands: 14,
    par: 11,
    hint: 'Find the winding path through the coral!',
  },
  {
    id: 'cove-9',
    level: 9,
    walls: [
      [3, 3],
      [1, 3],
      [1, 1],
      [3, 1],
      [4, 2],
    ],
    start: { x: 4, y: 4, dir: 'W' },
    goal: { x: 0, y: 0 },
    maxCommands: 14,
    par: 11,
    hint: 'Zigzag all the way to the far corner!',
  },
  {
    id: 'cove-10',
    level: 10,
    walls: [
      [2, 1],
      [1, 2],
      [3, 2],
    ],
    start: { x: 2, y: 2, dir: 'N' },
    goal: { x: 4, y: 4 },
    maxCommands: 10,
    par: 7,
    hint: 'Milo is boxed in! Turn around first, then escape.',
  },
  {
    id: 'cove-11',
    level: 11,
    walls: [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
      [3, 2],
      [3, 3],
      [4, 3],
    ],
    start: { x: 0, y: 0, dir: 'S' },
    goal: { x: 4, y: 4 },
    maxCommands: 12,
    par: 9,
    hint: 'The middle is full of rocks. Hug the edges instead!',
  },
  {
    id: 'cove-12',
    level: 12,
    walls: [
      [2, 0],
      [4, 1],
      [2, 1],
      [0, 2],
      [2, 3],
      [0, 3],
    ],
    start: { x: 4, y: 0, dir: 'W' },
    goal: { x: 0, y: 4 },
    maxCommands: 15,
    par: 12,
    hint: 'The grand finale! Plan every turn carefully, Code Captain.',
  },
];

/**
 * Known-good solutions, one per level, used by tests and (optionally) by a
 * future "show me" hint. Kept separate from MazeLevel so the level type
 * stays kid-facing.
 */
export const SOLUTIONS: Record<string, Command[]> = {
  'cove-1': ['forward', 'forward', 'forward'],
  'cove-2': ['forward', 'forward', 'right', 'forward', 'forward'],
  'cove-3': ['forward', 'forward', 'left', 'forward', 'forward'],
  'cove-4': ['forward', 'forward', 'forward', 'forward', 'left', 'forward', 'forward', 'forward', 'forward'],
  'cove-5': ['forward', 'right', 'forward', 'left', 'forward', 'forward', 'left', 'forward', 'right', 'forward'],
  'cove-6': ['forward', 'right', 'forward', 'left', 'forward', 'forward', 'left', 'forward', 'right', 'forward'],
  'cove-7': [
    'forward', 'forward', 'forward', 'forward', 'right', 'forward', 'forward', 'right',
    'forward', 'forward', 'forward', 'forward', 'left', 'forward', 'forward', 'left',
    'forward', 'forward', 'forward', 'forward',
  ],
  'cove-8': ['forward', 'forward', 'right', 'forward', 'forward', 'left', 'forward', 'forward', 'right', 'forward', 'forward'],
  'cove-9': ['forward', 'forward', 'right', 'forward', 'forward', 'left', 'forward', 'forward', 'right', 'forward', 'forward'],
  'cove-10': ['right', 'right', 'forward', 'forward', 'left', 'forward', 'forward'],
  'cove-11': ['forward', 'forward', 'forward', 'forward', 'left', 'forward', 'forward', 'forward', 'forward'],
  'cove-12': ['forward', 'left', 'forward', 'forward', 'right', 'forward', 'forward', 'left', 'forward', 'forward', 'right', 'forward'],
};

/** Deterministic maze simulator. */
export function runProgram(level: MazeLevel, commands: Command[]): RunResult {
  const wallSet = new Set(level.walls.map(([x, y]) => `${x},${y}`));
  let { x, y, dir } = level.start;
  const path: RunStep[] = [{ x, y, dir }];
  let steps = 0;

  const isGoal = (px: number, py: number) => px === level.goal.x && py === level.goal.y;

  for (const cmd of commands) {
    steps++;
    if (cmd === 'left' || cmd === 'right') {
      dir = turn(dir, cmd);
      path.push({ x, y, dir });
      continue;
    }
    const nx = x + DX[dir];
    const ny = y + DY[dir];
    const offGrid = nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE;
    if (offGrid || wallSet.has(`${nx},${ny}`)) {
      return { path, outcome: 'crash', steps };
    }
    x = nx;
    y = ny;
    path.push({ x, y, dir });
    if (isGoal(x, y)) {
      return { path, outcome: 'goal', steps };
    }
  }
  return { path, outcome: 'out-of-moves', steps };
}

/** Stars for a completed level: par or better = 3, near par = 2, else 1. */
export function starsForLevel(level: MazeLevel, commandsUsed: number): 1 | 2 | 3 {
  if (commandsUsed <= level.par) return 3;
  if (commandsUsed <= level.par + 3) return 2;
  return 1;
}

export function getLevel(id: string): MazeLevel | undefined {
  return LEVELS.find((l) => l.id === id);
}
