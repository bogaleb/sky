import { describe, expect, it } from 'vitest';
import {
  PUZZLES,
  PUZZLE_SHAPES,
  getPuzzle,
  puzzlesForDifficulty,
  validatePuzzle,
  type PuzzleDifficulty,
} from '../lib/kid/puzzles';

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

describe('Puzzle Reef library', () => {
  it('has exactly 12 puzzles', () => {
    expect(PUZZLES).toHaveLength(12);
  });

  it('groups 4 puzzles per difficulty', () => {
    ([1, 2, 3] as PuzzleDifficulty[]).forEach((d) => {
      const group = puzzlesForDifficulty(d);
      expect(group).toHaveLength(4);
      group.forEach((p) => expect(p.difficulty).toBe(d));
    });
  });

  it('has unique puzzle ids', () => {
    const ids = PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique piece ids across the whole bank', () => {
    const ids = PUZZLES.flatMap((p) => p.pieces.map((piece) => piece.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('validates every puzzle with zero problems', () => {
    for (const puzzle of PUZZLES) {
      expect(validatePuzzle(puzzle)).toEqual([]);
    }
  });

  it('gives every piece exactly one slot (piece count == slot count)', () => {
    for (const puzzle of PUZZLES) {
      // slots are embedded 1:1 on pieces; verify each piece carries a complete slot
      const slots = puzzle.pieces.map((piece) => piece.slot);
      expect(slots).toHaveLength(puzzle.pieces.length);
      const slotIds = puzzle.pieces.map((piece) => piece.id);
      expect(new Set(slotIds).size).toBe(slots.length);
      for (const slot of slots) {
        expect(typeof slot.x).toBe('number');
        expect(typeof slot.y).toBe('number');
        expect(typeof slot.rotation).toBe('number');
        expect(typeof slot.size).toBe('number');
      }
    }
  });

  it('scales piece count with difficulty', () => {
    const counts = (d: PuzzleDifficulty) =>
      puzzlesForDifficulty(d).map((p) => p.pieces.length);
    counts(1).forEach((n) => expect(n).toBe(3));
    counts(2).forEach((n) => expect(n).toBe(4));
    counts(3).forEach((n) => expect(n).toBeGreaterThanOrEqual(5));
  });

  it('uses only known shapes and hex colors', () => {
    for (const puzzle of PUZZLES) {
      for (const piece of puzzle.pieces) {
        expect(PUZZLE_SHAPES).toContain(piece.shape);
        expect(piece.color).toMatch(HEX_RE);
      }
    }
  });

  it('keeps every slot inside the 200x200 viewBox', () => {
    for (const puzzle of PUZZLES) {
      expect(puzzle.viewBox).toBe('0 0 200 200');
      for (const piece of puzzle.pieces) {
        expect(piece.slot.x).toBeGreaterThanOrEqual(0);
        expect(piece.slot.x).toBeLessThanOrEqual(200);
        expect(piece.slot.y).toBeGreaterThanOrEqual(0);
        expect(piece.slot.y).toBeLessThanOrEqual(200);
      }
    }
  });

  it('has no emoji in titles or intros', () => {
    for (const puzzle of PUZZLES) {
      expect(puzzle.title).not.toMatch(EMOJI_RE);
      expect(puzzle.intro).not.toMatch(EMOJI_RE);
      expect(puzzle.title.length).toBeGreaterThan(0);
      expect(puzzle.intro.length).toBeGreaterThan(0);
      expect(puzzle.hostCharacter.length).toBeGreaterThan(0);
      expect(puzzle.subject.length).toBeGreaterThan(0);
    }
  });

  it('resolves puzzles by id', () => {
    expect(getPuzzle('rocket')?.title).toBe('Rocket Ruby');
    expect(getPuzzle('nope')).toBeUndefined();
  });

  it('flags invalid puzzles', () => {
    const bad = {
      ...PUZZLES[0],
      pieces: [
        ...PUZZLES[0].pieces,
        { ...PUZZLES[0].pieces[0] }, // duplicate id
      ],
    };
    expect(validatePuzzle(bad).length).toBeGreaterThan(0);
  });
});
