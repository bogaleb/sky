import { describe, it, expect } from 'vitest';
import { STICKERS, getSticker, stickersForIslandVisit } from '../lib/kid/stickers';
import { STORIES } from '../lib/kid/stories';
import { SONGS } from '../lib/kid/songs';
import { MEMORY_DECKS, getDeck } from '../lib/kid/memory-decks';
import { OUTFITS, getOutfit } from '../lib/kid/outfits';
import { OUTFIT_ART_IDS } from '../lib/kid/outfit-art';

describe('sticker book', () => {
  it('has 42 collectible stickers', () => {
    expect(STICKERS.length).toBe(42);
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
  it('has 9 original stories', () => {
    expect(STORIES.length).toBe(9);
  });

  it('every story has 5-12 pages with text, hosted by Luna', () => {
    for (const story of STORIES) {
      expect(story.characterId).toBe('luna');
      expect(story.pages.length).toBeGreaterThanOrEqual(5);
      expect(story.pages.length).toBeLessThanOrEqual(12);
      for (const page of story.pages) {
        expect(page.text.length).toBeGreaterThan(10);
        expect(page.caption.length).toBeGreaterThan(0);
      }
      expect(story.moral.length).toBeGreaterThan(0);
    }
  });

  it('story ids are unique', () => {
    const ids = STORIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('new stories span easy, medium, and challenge levels', () => {
    const leveled = STORIES.filter((s) => s.level);
    expect(leveled.filter((s) => s.level === 'easy').length).toBe(2);
    expect(leveled.filter((s) => s.level === 'medium').length).toBe(2);
    expect(leveled.filter((s) => s.level === 'challenge').length).toBe(2);
    expect(leveled.every((s) => s.pages.length >= 8 && s.pages.length <= 12)).toBe(true);
  });
});

describe('songbook', () => {
  it('has 9 original songs', () => {
    expect(SONGS.length).toBe(9);
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

  it('new songs include calm and upbeat moods', () => {
    const moods = SONGS.map((s) => s.mood).filter(Boolean);
    expect(moods.filter((m) => m === 'calm').length).toBe(3);
    expect(moods.filter((m) => m === 'upbeat').length).toBe(3);
  });
});

describe('memory cove decks', () => {
  it('has 9 decks', () => {
    expect(MEMORY_DECKS.length).toBe(9);
  });

  it('every deck has exactly 8 pairs for the 4x4 board', () => {
    for (const deck of MEMORY_DECKS) {
      expect(getDeck(deck.id)).toBeDefined();
      expect(deck.title.length).toBeGreaterThan(0);
      expect(deck.intro.length).toBeGreaterThan(0);
      expect(deck.pairs.length).toBe(8);
      for (const pair of deck.pairs) {
        expect(pair.a.length).toBeGreaterThan(0);
        expect(pair.b.length).toBeGreaterThan(0);
        expect(['text', 'shape']).toContain(pair.kind);
      }
      // 'a' faces are unique within a deck so every card is identifiable
      const aFaces = deck.pairs.map((p) => p.a);
      expect(new Set(aFaces).size).toBe(aFaces.length);
      // pair tuples are unique
      const tuples = deck.pairs.map((p) => `${p.kind}:${p.a}:${p.b}`);
      expect(new Set(tuples).size).toBe(tuples.length);
    }
  });

  it('deck ids are unique', () => {
    const ids = MEMORY_DECKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('sky shop outfits', () => {
  it('has 18 accessories', () => {
    expect(OUTFITS.length).toBe(18);
  });

  it('every outfit resolves, has art, a valid slot, and a sensible price', () => {
    for (const outfit of OUTFITS) {
      expect(getOutfit(outfit.id)).toBeDefined();
      expect(OUTFIT_ART_IDS).toContain(outfit.id);
      expect(outfit.name.length).toBeGreaterThan(0);
      expect(outfit.blurb.length).toBeGreaterThan(0);
      expect(['hat', 'glasses', 'extra']).toContain(outfit.slot);
      expect(outfit.cost).toBeGreaterThanOrEqual(15);
      expect(outfit.cost).toBeLessThanOrEqual(70);
    }
  });

  it('outfit ids are unique', () => {
    const ids = OUTFITS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
