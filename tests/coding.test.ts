import { describe, expect, it } from 'vitest';
import {
  LEVELS,
  SOLUTIONS,
  COMMANDS,
  GRID_SIZE,
  runProgram,
  starsForLevel,
  getLevel,
  type Command,
  type Dir,
  type MazeLevel,
} from '../lib/kid/coding';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

const DX: Record<Dir, number> = { N: 0, E: 1, S: 0, W: -1 };
const DY: Record<Dir, number> = { N: -1, E: 0, S: 1, W: 0 };
const DIRS: Dir[] = ['N', 'E', 'S', 'W'];

/** Breadth-first search for the shortest command sequence to the goal. */
function bfsSolve(level: MazeLevel): Command[] | null {
  const wallSet = new Set(level.walls.map(([x, y]) => `${x},${y}`));
  const key = (x: number, y: number, d: Dir) => `${x},${y},${d}`;
  const start = { x: level.start.x, y: level.start.y, dir: level.start.dir };
  const queue: Array<{ x: number; y: number; dir: Dir; cmds: Command[] }> = [
    { ...start, cmds: [] },
  ];
  const seen = new Set([key(start.x, start.y, start.dir)]);
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.x === level.goal.x && cur.y === level.goal.y) return cur.cmds;
    const moves: Array<{ cmd: Command; x: number; y: number; dir: Dir }> = [
      { cmd: 'left', x: cur.x, y: cur.y, dir: DIRS[(DIRS.indexOf(cur.dir) + 3) % 4] },
      { cmd: 'right', x: cur.x, y: cur.y, dir: DIRS[(DIRS.indexOf(cur.dir) + 1) % 4] },
      {
        cmd: 'forward',
        x: cur.x + DX[cur.dir],
        y: cur.y + DY[cur.dir],
        dir: cur.dir,
      },
    ];
    for (const m of moves) {
      if (m.cmd === 'forward') {
        if (m.x < 0 || m.y < 0 || m.x >= GRID_SIZE || m.y >= GRID_SIZE) continue;
        if (wallSet.has(`${m.x},${m.y}`)) continue;
      }
      const k = key(m.x, m.y, m.dir);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ x: m.x, y: m.y, dir: m.dir, cmds: [...cur.cmds, m.cmd] });
    }
  }
  return null;
}

describe('coding levels', () => {
  it('has exactly 12 levels on 5x5 grids', () => {
    expect(LEVELS).toHaveLength(12);
    expect(GRID_SIZE).toBe(5);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(12);
  });

  it('has valid geometry: start/goal/walls in bounds, goal not a wall', () => {
    for (const l of LEVELS) {
      for (const [x, y] of l.walls) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(GRID_SIZE);
        expect(y).toBeLessThan(GRID_SIZE);
      }
      expect(l.walls.some(([x, y]) => x === l.goal.x && y === l.goal.y)).toBe(false);
      expect(l.walls.some(([x, y]) => x === l.start.x && y === l.start.y)).toBe(false);
      expect(l.maxCommands).toBeGreaterThanOrEqual(l.par);
    }
  });

  it('every level is solvable within maxCommands (BFS)', () => {
    for (const l of LEVELS) {
      const sol = bfsSolve(l);
      expect(sol, `${l.id} has no solution`).not.toBeNull();
      expect(sol!.length).toBeLessThanOrEqual(l.maxCommands);
    }
  });

  it('known solutions reach the goal', () => {
    for (const l of LEVELS) {
      const sol = SOLUTIONS[l.id];
      expect(sol, `${l.id} missing solution`).toBeDefined();
      const r = runProgram(l, sol);
      expect(r.outcome, `${l.id} solution failed`).toBe('goal');
      expect(r.steps).toBeLessThanOrEqual(l.maxCommands);
    }
  });

  it('known solutions earn 3 stars (match par)', () => {
    for (const l of LEVELS) {
      const r = runProgram(l, SOLUTIONS[l.id]);
      expect(starsForLevel(l, r.steps)).toBe(3);
    }
  });

  it('hints are kid-friendly and emoji-free', () => {
    for (const l of LEVELS) {
      expect(l.hint.trim().length).toBeGreaterThan(10);
      expect(EMOJI_RE.test(l.hint)).toBe(false);
    }
  });
});

describe('runProgram', () => {
  const open: MazeLevel = {
    id: 'test-open',
    level: 0,
    walls: [],
    start: { x: 0, y: 0, dir: 'E' },
    goal: { x: 2, y: 0 },
    maxCommands: 10,
    par: 2,
    hint: 'test',
  };

  it('reaches the goal and reports steps', () => {
    const r = runProgram(open, ['forward', 'forward']);
    expect(r.outcome).toBe('goal');
    expect(r.steps).toBe(2);
    expect(r.path[r.path.length - 1]).toMatchObject({ x: 2, y: 0 });
  });

  it('is deterministic', () => {
    const a = runProgram(LEVELS[6], SOLUTIONS['cove-7']);
    const b = runProgram(LEVELS[6], SOLUTIONS['cove-7']);
    expect(a).toEqual(b);
  });

  it('crashes when driving into a wall', () => {
    const r = runProgram(LEVELS[4], ['forward', 'forward', 'forward']);
    expect(r.outcome).toBe('crash');
  });

  it('crashes when leaving the grid', () => {
    const r = runProgram(open, ['left', 'forward']);
    expect(r.outcome).toBe('crash');
  });

  it('reports out-of-moves when the program ends early', () => {
    const r = runProgram(open, ['forward']);
    expect(r.outcome).toBe('out-of-moves');
    expect(r.steps).toBe(1);
  });

  it('turns rotate in place without moving', () => {
    const r = runProgram(open, ['left', 'left']);
    expect(r.outcome).toBe('out-of-moves');
    expect(r.path).toHaveLength(3);
    expect(r.path[2]).toMatchObject({ x: 0, y: 0, dir: 'W' });
  });

  it('stops at the goal even with extra commands', () => {
    const r = runProgram(open, ['forward', 'forward', 'forward', 'forward']);
    expect(r.outcome).toBe('goal');
    expect(r.steps).toBe(2);
  });
});

describe('helpers', () => {
  it('COMMANDS lists the three kid commands', () => {
    expect(COMMANDS).toEqual(['forward', 'left', 'right']);
  });

  it('getLevel resolves by id', () => {
    expect(getLevel('cove-1')?.level).toBe(1);
    expect(getLevel('nope')).toBeUndefined();
  });

  it('starsForLevel grades by par', () => {
    const l = LEVELS[0]; // par 3
    expect(starsForLevel(l, 3)).toBe(3);
    expect(starsForLevel(l, 5)).toBe(2);
    expect(starsForLevel(l, 7)).toBe(1);
  });
});
