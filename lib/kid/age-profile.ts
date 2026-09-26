import type { AgeBand } from '@/lib/planner/types';

/**
 * Age profiles: how the kid UI changes with age. One place decides layout,
 * text, touch-target size, narration and scaffolding per band, so every
 * screen adapts the same way instead of each component guessing.
 *
 * Bands mirror children.age_band ('3-4' | '5-6' | '7-8'). The fields are
 * written so finer bands (e.g. splitting 5-6 into K and Grade 1) only need a
 * new entry here.
 */

export type HomeLayout = 'picture' | 'path' | 'explorer';

export interface AgeProfile {
  band: AgeBand;
  /** Parent-facing name for the band. */
  label: string;
  /**
   * picture:  pre-readers. A few giant picture tiles, voice-led, no menus.
   * path:     early readers. Today's path plus a small favorites shelf.
   * explorer: independent readers. Path, shelf and the full game library.
   */
  home: HomeLayout;
  /** Stops on today's path. Short for the youngest (attention span). */
  pathLength: number;
  /** Free-play games on the home shelf. */
  shelfSize: number;
  /** The full, browsable library of games by subject. */
  showLibrary: boolean;
  /** Text on tiles: none (picture + voice only), short title, or title + subtitle. */
  tileText: 'none' | 'title' | 'full';
  /** Speak each screen's instructions when it appears. */
  autoNarrate: boolean;
  /** Minimum touch target in CSS px (Apple HIG is 44; small hands need more). */
  minTarget: number;
  /** Wrong answers before a hint, and before a worked "show me" example. */
  hintAfter: number;
  showMeAfter: number;
  /** Subjects in the growth garden (the youngest see fewer, core ones). */
  gardenSubjects: string[];
}

const ALL_SUBJECTS = ['reading', 'writing', 'math', 'science', 'geography', 'coding', 'music', 'drawing', 'feelings'];

export const AGE_PROFILES: Record<AgeBand, AgeProfile> = {
  '3-4': {
    band: '3-4',
    label: 'Ages 3–4',
    home: 'picture',
    pathLength: 3,
    shelfSize: 4,
    showLibrary: false,
    tileText: 'none',
    autoNarrate: true,
    minTarget: 96,
    hintAfter: 1,
    showMeAfter: 2,
    gardenSubjects: ['reading', 'math', 'drawing', 'feelings'],
  },
  '5-6': {
    band: '5-6',
    label: 'Ages 5–6',
    home: 'path',
    pathLength: 4,
    shelfSize: 6,
    showLibrary: false,
    tileText: 'title',
    autoNarrate: true,
    minTarget: 80,
    hintAfter: 1,
    showMeAfter: 2,
    gardenSubjects: ['reading', 'writing', 'math', 'science', 'music', 'feelings'],
  },
  '7-8': {
    band: '7-8',
    label: 'Ages 7–8',
    home: 'explorer',
    pathLength: 4,
    shelfSize: 6,
    showLibrary: true,
    tileText: 'full',
    autoNarrate: false,
    minTarget: 64,
    hintAfter: 1,
    showMeAfter: 3,
    gardenSubjects: ALL_SUBJECTS,
  },
};

export function isAgeBand(v: unknown): v is AgeBand {
  return v === '3-4' || v === '5-6' || v === '7-8';
}

/** Profile for a band; unknown or missing bands get the middle profile. */
export function ageProfile(band: AgeBand | null | undefined): AgeProfile {
  return isAgeBand(band) ? AGE_PROFILES[band] : AGE_PROFILES['5-6'];
}
