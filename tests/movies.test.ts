import { describe, expect, it } from 'vitest';
import {
  BACKDROPS,
  BEATS,
  CAST_IDS,
  MAX_MOVIES,
  backdropFor,
  beatFor,
  fillNarration,
  validMovie,
  saveMovie,
  getMovies,
  deleteMovie,
  type Movie,
  type StorageLike,
} from '../lib/kid/movies';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

function fakeStorage(): StorageLike {
  const data: Record<string, string> = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const goodMovie: Movie = {
  characters: ['curio', 'nova'],
  backdropId: 'meadow',
  beats: ['meadow-hello', 'meadow-picnic', 'meadow-dance'],
};

describe('movie studio data', () => {
  it('has 6 backdrops with names, taglines, and colors', () => {
    expect(BACKDROPS).toHaveLength(6);
    const ids = BACKDROPS.map((b) => b.id);
    expect(new Set(ids).size).toBe(6);
    for (const b of BACKDROPS) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.tagline.length).toBeGreaterThan(0);
      expect(b.colors).toHaveLength(3);
      for (const c of b.colors) expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(b.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(b.name).not.toMatch(EMOJI_RE);
      expect(b.tagline).not.toMatch(EMOJI_RE);
    }
  });

  it('has 4 beats per backdrop with valid ids and narration', () => {
    for (const b of BACKDROPS) {
      const beats = BEATS[b.id];
      expect(beats, `beats for ${b.id}`).toHaveLength(4);
      const ids = beats.map((x) => x.id);
      expect(new Set(ids).size).toBe(4);
      for (const beat of beats) {
        expect(beat.id.startsWith(`${b.id}-`)).toBe(true);
        expect(beat.title.length).toBeGreaterThan(0);
        expect(beat.narration.length).toBeGreaterThan(20);
        expect(beat.title).not.toMatch(EMOJI_RE);
        expect(beat.narration).not.toMatch(EMOJI_RE);
        // Placeholders the studio fills at showtime.
        expect(beat.narration).toMatch(/\{A\}/);
      }
    }
  });

  it('backdropFor and beatFor resolve correctly', () => {
    expect(backdropFor('reef')?.name).toBe('Ocean Reef');
    expect(backdropFor('nope')).toBeUndefined();
    expect(beatFor('space', 'space-blast')?.title).toBe('Blast Off');
    expect(beatFor('space', 'meadow-hello')).toBeUndefined();
  });

  it('fillNarration replaces {A} and {B}', () => {
    expect(fillNarration('{A} waves to {B}. {A} smiles.', 'Curio', 'Nova')).toBe(
      'Curio waves to Nova. Curio smiles.'
    );
  });

  it('validMovie accepts a good movie and rejects bad ones', () => {
    expect(validMovie(goodMovie)).toBe(true);
    expect(validMovie({ ...goodMovie, characters: ['curio'] })).toBe(false);
    expect(validMovie({ ...goodMovie, characters: ['curio', 'curio'] })).toBe(false);
    expect(validMovie({ ...goodMovie, characters: ['curio', 'shrek'] })).toBe(false);
    expect(validMovie({ ...goodMovie, backdropId: 'volcano' })).toBe(false);
    expect(validMovie({ ...goodMovie, beats: ['meadow-hello'] })).toBe(false);
    expect(validMovie({ ...goodMovie, beats: ['meadow-hello', 'night-stargaze', 'meadow-dance'] })).toBe(false);
    expect(validMovie(null)).toBe(false);
    expect(validMovie('movie')).toBe(false);
  });

  it('the cast covers the 8 Sky characters', () => {
    expect(CAST_IDS).toHaveLength(8);
    expect([...CAST_IDS].sort()).toEqual(
      ['atlas', 'bea', 'curio', 'luna', 'milo', 'nova', 'riff', 'tuno'].sort()
    );
  });
});

describe('movie gallery storage', () => {
  it('save/get round-trip with fake storage', () => {
    const s = fakeStorage();
    expect(getMovies(s, 'kid1')).toEqual([]);
    expect(saveMovie(s, 'kid1', goodMovie)).toBe(true);
    const movies = getMovies(s, 'kid1');
    expect(movies).toHaveLength(1);
    expect(movies[0]).toEqual(goodMovie);
    // Namespaced per child.
    expect(getMovies(s, 'kid2')).toEqual([]);
  });

  it('newest movies come first', () => {
    const s = fakeStorage();
    const second: Movie = { ...goodMovie, backdropId: 'night', beats: ['night-stargaze', 'night-shooting', 'night-moon'] };
    saveMovie(s, 'kid1', goodMovie);
    saveMovie(s, 'kid1', second);
    const movies = getMovies(s, 'kid1');
    expect(movies[0].backdropId).toBe('night');
    expect(movies[1].backdropId).toBe('meadow');
  });

  it('cap is enforced at MAX_MOVIES', () => {
    const s = fakeStorage();
    for (let i = 0; i < MAX_MOVIES + 3; i += 1) {
      saveMovie(s, 'kid1', goodMovie);
    }
    expect(getMovies(s, 'kid1')).toHaveLength(MAX_MOVIES);
    expect(MAX_MOVIES).toBe(12);
  });

  it('deleteMovie removes by index and ignores bad indexes', () => {
    const s = fakeStorage();
    const second: Movie = { ...goodMovie, backdropId: 'reef', beats: ['reef-dive', 'reef-fish', 'reef-treasure'] };
    saveMovie(s, 'kid1', goodMovie);
    saveMovie(s, 'kid1', second);
    const after = deleteMovie(s, 'kid1', 0);
    expect(after).toHaveLength(1);
    expect(after[0].backdropId).toBe('meadow');
    expect(deleteMovie(s, 'kid1', 99)).toHaveLength(1);
    expect(deleteMovie(s, 'kid1', -1)).toHaveLength(1);
  });

  it('rejects invalid movies and heals corrupt storage', () => {
    const s = fakeStorage();
    expect(saveMovie(s, 'kid1', { nope: true } as unknown as Movie)).toBe(false);
    s.setItem('sky-movies-kid1', 'not json {{{');
    expect(getMovies(s, 'kid1')).toEqual([]);
    s.setItem('sky-movies-kid1', JSON.stringify([goodMovie, { bad: 1 }]));
    expect(getMovies(s, 'kid1')).toHaveLength(1);
  });
});
