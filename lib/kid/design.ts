/**
 * Sky design system contract — Wave 8 "mesmerizing modern" redesign.
 *
 * This module documents the exact names other tracks and future waves must
 * use. Do not rename these without coordinating every consumer.
 *
 * FONTS (loaded in app/layout.tsx via next/font/google):
 * - Display: Fredoka (600, 700) -> CSS var --font-display -> utility .font-display
 * - Body:    Nunito (400..800)  -> CSS var --font-body (set on <body>)
 *
 * CLASSES (defined in app/globals.css, Wave 8 block):
 * - .glass-kid  : glassmorphism card — white/45, backdrop-blur-xl,
 *                 1px white/60 border, soft shadow, kid-card radius.
 * - .btn-kid    : chunky 3D button — bright gradient, 8px bottom edge,
 *                 glow shadow, press dip on :active. Color modifiers:
 *                 .btn-kid-coral / .btn-kid-sky / .btn-kid-mint / .btn-kid-grape,
 *                 compact variant .btn-kid-sm.
 * - .card-kid   : elevated card — white/80, layered soft shadows,
 *                 kid-card radius, subtle top highlight.
 *
 * BACKDROP:
 * - <SkyBackdrop /> (components/kid/sky-backdrop.tsx): fixed inset-0 z-0
 *   ambient layer — aurora gradient blobs, twinkling stars, drifting clouds,
 *   avatar cameos. Static gradients under prefers-reduced-motion.
 *
 * KEYFRAMES (animate utilities):
 * - kid-aurora     -> animate-kid-aurora  (aurora blob drift)   [new, Wave 8]
 * - kid-twinkle    -> animate-kid-twinkle (star twinkle)        [existing]
 * - kid-float-slow -> animate-kid-float-slow (slow float)       [new, Wave 8]
 * - kid-shimmer    -> animate-kid-shimmer (skeleton shimmer)    [existing]
 */
export const DESIGN_CONTRACT = {
  fonts: {
    display: {
      family: 'Fredoka',
      weights: [600, 700] as const,
      cssVar: '--font-display',
      utility: 'font-display',
    },
    body: {
      family: 'Nunito',
      weights: [400, 500, 600, 700, 800] as const,
      cssVar: '--font-body',
    },
  },
  classes: ['font-display', 'glass-kid', 'btn-kid', 'card-kid'] as const,
  buttonModifiers: [
    'btn-kid-coral',
    'btn-kid-sky',
    'btn-kid-mint',
    'btn-kid-grape',
    'btn-kid-sm',
  ] as const,
  backdrop: 'SkyBackdrop',
  keyframes: {
    aurora: 'animate-kid-aurora',
    twinkle: 'animate-kid-twinkle',
    floatSlow: 'animate-kid-float-slow',
    shimmer: 'animate-kid-shimmer',
  },
} as const;

export type DesignContract = typeof DESIGN_CONTRACT;
