'use client';

// The win layer (ConfettiBurst, StarPopRow, FeedbackOverlay, praiseFor,
// encourage) now lives in ./game-shell.tsx — one win layer instead of two.
// This module is a thin re-export so existing imports keep working
// unchanged (activity-stage, trophy-shelf, welcome-quest, session-player,
// tests). Behavior is identical from the kid's perspective.
export {
  ConfettiBurst,
  StarPopRow,
  FeedbackOverlay,
  praiseFor,
  encourage,
} from './game-shell';
export type { FeedbackOverlayProps } from './game-shell';
