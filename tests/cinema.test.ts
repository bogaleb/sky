import { describe, expect, it } from 'vitest';
import {
  EPISODES,
  FRIEND_ART_IDS,
  FRIEND_NAMES,
  getEpisode,
  type CinemaEpisode,
} from '../lib/kid/cinema';
import { CHARACTERS, CHARACTER_IDS } from '../lib/kid/characters';

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

const VALID_BACKDROPS = ['meadow', 'night', 'ocean', 'sky'];

function allScenes(): { episode: CinemaEpisode; sceneId: string; index: number }[] {
  return EPISODES.flatMap((episode) =>
    episode.scenes.map((s, index) => ({ episode, sceneId: s.id, index }))
  );
}

describe('story cinema episodes', () => {
  it('has exactly 4 episodes', () => {
    expect(EPISODES.length).toBe(4);
  });

  it('gives every episode exactly 6 scenes', () => {
    for (const ep of EPISODES) {
      expect(ep.scenes.length, `${ep.id} needs 6 scenes`).toBe(6);
    }
  });

  it('uses unique episode and scene ids', () => {
    const epIds = EPISODES.map((e) => e.id);
    expect(new Set(epIds).size).toBe(epIds.length);
    const sceneIds = allScenes().map((s) => s.sceneId);
    expect(new Set(sceneIds).size).toBe(sceneIds.length);
  });

  it('gives every scene narration, caption, a valid backdrop, and a stage direction', () => {
    for (const ep of EPISODES) {
      expect(ep.title.trim().length).toBeGreaterThan(3);
      expect(ep.tagline.trim().length).toBeGreaterThan(3);
      for (const s of ep.scenes) {
        expect(s.narration.trim().length, `${s.id} narration`).toBeGreaterThan(20);
        expect(s.caption.trim().length, `${s.id} caption`).toBeGreaterThan(5);
        expect(VALID_BACKDROPS, `${s.id} backdrop`).toContain(s.backdrop);
        expect(s.action.trim().length, `${s.id} action`).toBeGreaterThan(5);
        if (s.fx !== undefined) {
          expect(['rain', 'bubbles'], `${s.id} fx`).toContain(s.fx);
        }
      }
    }
  });

  it('keeps narration to short TTS-friendly passages', () => {
    for (const ep of EPISODES) {
      for (const s of ep.scenes) {
        // Strip quoted dialogue ("Whoosh!", "My kite!") before counting —
        // exclamations inside quotes are stylistic, not extra sentences.
        const spoken = s.narration.replace(/["“][^"”]*["”]/g, ' ');
        const sentences = spoken.split(/[.!?]+/).filter((t) => t.trim().length > 0);
        expect(
          sentences.length,
          `${s.id} should be 1-2 sentences`
        ).toBeLessThanOrEqual(4);
        expect(s.narration.length, `${s.id} narration too long`).toBeLessThanOrEqual(280);
      }
    }
  });

  it('resolves every cast id via getCharacter or the story-friend roster', () => {
    const friends = new Set<string>(FRIEND_ART_IDS);
    for (const ep of EPISODES) {
      for (const s of ep.scenes) {
        expect(s.cast.length, `${s.id} needs actors on stage`).toBeGreaterThan(0);
        for (const id of s.cast) {
          const ok = id in CHARACTERS || friends.has(id);
          expect(ok, `${s.id} cast id "${id}" does not resolve`).toBe(true);
        }
      }
    }
  });

  it('covers the expected avatar cast ids', () => {
    for (const id of CHARACTER_IDS) {
      expect(typeof id).toBe('string');
    }
    // Every episode poster friend has art + a display name.
    for (const ep of EPISODES) {
      expect(FRIEND_ART_IDS, `${ep.id} friendId`).toContain(ep.friendId);
      expect(FRIEND_NAMES[ep.friendId].length).toBeGreaterThan(1);
    }
  });

  it('has no emoji anywhere in episode text', () => {
    for (const ep of EPISODES) {
      expect(ep.title).not.toMatch(EMOJI_RE);
      expect(ep.tagline).not.toMatch(EMOJI_RE);
      for (const s of ep.scenes) {
        expect(s.narration, `${s.id} narration`).not.toMatch(EMOJI_RE);
        expect(s.caption, `${s.id} caption`).not.toMatch(EMOJI_RE);
      }
    }
  });

  it('finds episodes by id', () => {
    for (const ep of EPISODES) {
      expect(getEpisode(ep.id)?.title).toBe(ep.title);
    }
    expect(getEpisode('no-such-episode')).toBeUndefined();
  });
});
