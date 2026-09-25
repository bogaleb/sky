// Sky Bedtime Mode — curated calm content + star-breathing constants.
//
// Bedtime is a wind-down space: no daily-quest pressure, no scores. Kids
// pick a cozy story, a sleepy song, or breathe with Tuno, and every door
// ends with the same gentle "Sweet dreams" send-off.

import { getStory, type Story } from './stories';
import { SONGS, type Song } from './songs';

/**
 * The four gentlest stories, curated for winding down:
 * - Bolt Learns to Slow Down — mindfulness, slowing down to notice
 * - Wren's Little Garden — patience, quiet growing
 * - Hoot and the Star Blanket — the night sky is not scary
 * - Dewdrop's Long Way Home — a soft journey home at day's end
 */
export const CALM_STORY_IDS = [
  'bolt-learns-to-slow-down',
  'wrens-little-garden',
  'hoot-star-blanket',
  'dewdrops-long-way-home',
] as const;

export type CalmStoryId = (typeof CALM_STORY_IDS)[number];

/** The calm stories in door order. Filters out any id missing from the bank. */
export function calmStories(): Story[] {
  return CALM_STORY_IDS.map((id) => getStory(id)).filter(
    (s): s is Story => s !== undefined,
  );
}

/** Sleepy songs: every song tagged with the calm mood. */
export function calmSongs(): Song[] {
  return SONGS.filter((s) => s.mood === 'calm');
}

/* ------------------------------------------------------------------ */
/* Star-breathing with Tuno                                            */
/* ------------------------------------------------------------------ */

/** Inhale length (ms). */
export const BREATHE_IN_MS = 4000;
/** Hold length (ms). */
export const BREATHE_HOLD_MS = 4000;
/** Exhale length (ms). */
export const BREATHE_OUT_MS = 4000;
/** Full breathing cycles per session. */
export const BREATHE_CYCLES = 4;

/** Total breathing time in ms (one full wind-down). */
export const BREATHE_TOTAL_MS =
  (BREATHE_IN_MS + BREATHE_HOLD_MS + BREATHE_OUT_MS) * BREATHE_CYCLES;

/* ------------------------------------------------------------------ */
/* Rewards                                                             */
/* ------------------------------------------------------------------ */

/** Stars granted when any bedtime door completes. */
export const BEDTIME_STARS = 2;

/** Sticker ids awarded on bedtime completion (defined in stickers.ts). */
export const SWEET_DREAMS_STICKER = 'sweet-dreams';
export const STAR_GAZER_STICKER = 'star-gazer';
