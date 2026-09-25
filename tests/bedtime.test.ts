import { describe, expect, it } from 'vitest';
import {
  BEDTIME_STARS,
  BREATHE_CYCLES,
  BREATHE_HOLD_MS,
  BREATHE_IN_MS,
  BREATHE_OUT_MS,
  BREATHE_TOTAL_MS,
  CALM_STORY_IDS,
  STAR_GAZER_STICKER,
  SWEET_DREAMS_STICKER,
  calmSongs,
  calmStories,
} from '../lib/kid/bedtime';
import { getStory } from '../lib/kid/stories';

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe('bedtime calm stories', () => {
  it('curates exactly four unique story ids', () => {
    expect(CALM_STORY_IDS).toHaveLength(4);
    expect(new Set(CALM_STORY_IDS).size).toBe(4);
  });

  it('every calm story id exists in the story bank with pages', () => {
    for (const id of CALM_STORY_IDS) {
      const story = getStory(id);
      expect(story, `missing story: ${id}`).toBeDefined();
      expect(story!.pages.length).toBeGreaterThan(0);
      expect(story!.title).not.toMatch(EMOJI_RE);
    }
  });

  it('calmStories returns the four stories in door order', () => {
    const stories = calmStories();
    expect(stories.map((s) => s.id)).toEqual([...CALM_STORY_IDS]);
  });
});

describe('bedtime calm songs', () => {
  it('has at least three calm-mood songs', () => {
    const songs = calmSongs();
    expect(songs.length).toBeGreaterThanOrEqual(3);
    for (const song of songs) {
      expect(song.mood).toBe('calm');
      expect(song.lines.length).toBeGreaterThan(0);
    }
  });

  it('includes the expected sleepy songs', () => {
    const ids = new Set(calmSongs().map((s) => s.id));
    expect(ids.has('twinkle-down-to-sleep')).toBe(true);
    expect(ids.has('breathe-like-tuno')).toBe(true);
    expect(ids.has('rain-on-the-leaves')).toBe(true);
  });
});

describe('star-breathing timing', () => {
  it('uses slow, kid-safe phase lengths (3–6s)', () => {
    for (const ms of [BREATHE_IN_MS, BREATHE_HOLD_MS, BREATHE_OUT_MS]) {
      expect(ms).toBeGreaterThanOrEqual(3000);
      expect(ms).toBeLessThanOrEqual(6000);
    }
  });

  it('runs a calm number of cycles', () => {
    expect(BREATHE_CYCLES).toBeGreaterThanOrEqual(3);
    expect(BREATHE_CYCLES).toBeLessThanOrEqual(6);
  });

  it('total wind-down stays short (under three minutes)', () => {
    expect(BREATHE_TOTAL_MS).toBe(
      (BREATHE_IN_MS + BREATHE_HOLD_MS + BREATHE_OUT_MS) * BREATHE_CYCLES,
    );
    expect(BREATHE_TOTAL_MS).toBeLessThanOrEqual(3 * 60 * 1000);
  });
});

describe('bedtime rewards', () => {
  it('grants a gentle two stars per door', () => {
    expect(BEDTIME_STARS).toBe(2);
  });

  it('uses the shared Wave 3 sticker id contract', () => {
    expect(SWEET_DREAMS_STICKER).toBe('sweet-dreams');
    expect(STAR_GAZER_STICKER).toBe('star-gazer');
  });
});
