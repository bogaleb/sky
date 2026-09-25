import { describe, expect, it } from 'vitest';
import {
  EPISODES,
  FRIEND_ART_IDS,
  FRIEND_NAMES,
  getEpisode,
  type CinemaEpisode,
} from '../lib/kid/cinema';
import { CHARACTER_IDS } from '../lib/kid/characters';

/**
 * Wave 8: four brand-new episodes headlined by Milo, Bea, Tuno, and Atlas.
 * Each episode's poster friend must be one of the four story friends with
 * SVG actors (the schema's `friendId`); the headliner island character
 * leads the cast in every scene.
 */
const NEW_EPISODES: { id: string; headliner: string }[] = [
  { id: 'milo-share-spark', headliner: 'milo' },
  { id: 'bea-garden-rescue', headliner: 'bea' },
  { id: 'tuno-brave-paddle', headliner: 'tuno' },
  { id: 'atlas-map-kindness', headliner: 'atlas' },
];

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

// Characters that reliably break speech synthesis if read literally.
const TTS_UNSAFE_RE = /[@#*{}\\<>|`$^=+]/;

const VALID_BACKDROPS = ['meadow', 'night', 'ocean', 'sky'];

function newEpisodes(): CinemaEpisode[] {
  return NEW_EPISODES.map(({ id }) => {
    const ep = getEpisode(id);
    expect(ep, `episode "${id}" must exist`).toBeDefined();
    return ep as CinemaEpisode;
  });
}

describe('story cinema wave 8 episodes', () => {
  it('has all 4 new episodes', () => {
    const eps = newEpisodes();
    expect(eps.length).toBe(4);
    expect(EPISODES.length).toBe(8);
  });

  it('uses unique episode and scene ids across the whole catalog', () => {
    const epIds = EPISODES.map((e) => e.id);
    expect(new Set(epIds).size).toBe(epIds.length);
    const sceneIds = EPISODES.flatMap((e) => e.scenes.map((s) => s.id));
    expect(new Set(sceneIds).size).toBe(sceneIds.length);
  });

  it('fills every field on the new episodes', () => {
    for (const ep of newEpisodes()) {
      expect(ep.title.trim().length, `${ep.id} title`).toBeGreaterThan(3);
      expect(ep.tagline.trim().length, `${ep.id} tagline`).toBeGreaterThan(3);
      expect(FRIEND_ART_IDS, `${ep.id} friendId`).toContain(ep.friendId);
      expect(FRIEND_NAMES[ep.friendId].length, `${ep.id} friend name`).toBeGreaterThan(1);
      for (const s of ep.scenes) {
        expect(s.narration.trim().length, `${s.id} narration`).toBeGreaterThan(20);
        expect(s.caption.trim().length, `${s.id} caption`).toBeGreaterThan(5);
        expect(VALID_BACKDROPS, `${s.id} backdrop`).toContain(s.backdrop);
        expect(s.action.trim().length, `${s.id} action`).toBeGreaterThan(5);
        expect(s.cast.length, `${s.id} cast`).toBeGreaterThan(0);
        if (s.fx !== undefined) {
          expect(['rain', 'bubbles'], `${s.id} fx`).toContain(s.fx);
        }
      }
    }
  });

  it('headlines a valid island character who leads every scene', () => {
    const validIds = new Set<string>(CHARACTER_IDS);
    for (const { id, headliner } of NEW_EPISODES) {
      expect(validIds, `${id} headliner "${headliner}"`).toContain(headliner);
      const ep = getEpisode(id) as CinemaEpisode;
      for (const s of ep.scenes) {
        expect(s.cast, `${s.id} should feature ${headliner}`).toContain(headliner);
      }
    }
  });

  it('gives each new episode 6 to 8 scenes', () => {
    for (const ep of newEpisodes()) {
      expect(ep.scenes.length, `${ep.id} scene count`).toBeGreaterThanOrEqual(6);
      expect(ep.scenes.length, `${ep.id} scene count`).toBeLessThanOrEqual(8);
    }
  });

  it('keeps narration emoji-free and TTS-safe', () => {
    for (const ep of newEpisodes()) {
      expect(ep.title).not.toMatch(EMOJI_RE);
      expect(ep.tagline).not.toMatch(EMOJI_RE);
      for (const s of ep.scenes) {
        expect(s.narration, `${s.id} narration`).not.toMatch(EMOJI_RE);
        expect(s.caption, `${s.id} caption`).not.toMatch(EMOJI_RE);
        expect(s.narration, `${s.id} narration TTS`).not.toMatch(TTS_UNSAFE_RE);
        expect(s.caption, `${s.id} caption TTS`).not.toMatch(TTS_UNSAFE_RE);
        // Short read-aloud passages: strip quoted dialogue before counting.
        const spoken = s.narration.replace(/["“][^"”]*["”]/g, ' ');
        const sentences = spoken.split(/[.!?]+/).filter((t) => t.trim().length > 0);
        expect(sentences.length, `${s.id} sentence count`).toBeGreaterThanOrEqual(2);
        expect(sentences.length, `${s.id} sentence count`).toBeLessThanOrEqual(4);
        expect(s.narration.length, `${s.id} narration too long`).toBeLessThanOrEqual(280);
      }
    }
  });
});
