import { describe, it, expect } from 'vitest';
import { STICKERS, getSticker, stickersForIslandVisit } from '../lib/kid/stickers';
import { STORIES } from '../lib/kid/stories';
import { SONGS } from '../lib/kid/songs';

describe('sticker book', () => {
  it('has 24 collectible stickers', () => {
    expect(STICKERS.length).toBe(24);
  });

  it('every sticker resolves and has a character, name, and colors', () => {
    for (const s of STICKERS) {
      expect(getSticker(s.id)).toBeDefined();
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.characterId.length).toBeGreaterThan(0);
      expect(s.colors.length).toBe(2);
    }
  });

  it('sticker ids are unique', () => {
    const ids = STICKERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('island visits earn a friend + star sticker', () => {
    expect(stickersForIslandVisit('reading')).toEqual(['friend-luna', 'star-reading']);
    expect(stickersForIslandVisit('music')).toEqual(['friend-riff', 'star-music']);
    expect(stickersForIslandVisit('math')).toEqual(['friend-milo', 'star-math']);
  });

  it('surprise visits earn a Curio friend sticker', () => {
    expect(stickersForIslandVisit(null)).toEqual(['friend-curio']);
  });

  it('every earned sticker id from island visits exists', () => {
    const subjects = ['reading', 'math', 'writing', 'science', 'geography', 'coding', 'music', 'drawing', 'feelings'];
    for (const sub of subjects) {
      for (const id of stickersForIslandVisit(sub)) {
        expect(getSticker(id), id).toBeDefined();
      }
    }
  });
});

describe('storybook', () => {
  it('has 3 original stories', () => {
    expect(STORIES.length).toBe(3);
  });

  it('every story has 5-6 pages with text, hosted by Luna', () => {
    for (const story of STORIES) {
      expect(story.characterId).toBe('luna');
      expect(story.pages.length).toBeGreaterThanOrEqual(5);
      expect(story.pages.length).toBeLessThanOrEqual(6);
      for (const page of story.pages) {
        expect(page.text.length).toBeGreaterThan(10);
      }
      expect(story.moral.length).toBeGreaterThan(0);
    }
  });

  it('story ids are unique', () => {
    const ids = STORIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('songbook', () => {
  it('has 3 original songs', () => {
    expect(SONGS.length).toBe(3);
  });

  it('every song has 6-8 lines, hosted by Riff', () => {
    for (const song of SONGS) {
      expect(song.characterId).toBe('riff');
      expect(song.lines.length).toBeGreaterThanOrEqual(6);
      expect(song.lines.length).toBeLessThanOrEqual(8);
      for (const line of song.lines) {
        expect(line.text.length).toBeGreaterThan(3);
      }
    }
  });

  it('song ids are unique', () => {
    const ids = SONGS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
