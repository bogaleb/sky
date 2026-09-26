'use client';

import { useState } from 'react';
import SkyBackdrop from './sky-backdrop';
import { isMuted, setMuted, playSfx } from '@/lib/kid/audio';

export interface KidShellProps {
  children: React.ReactNode;
  /** Completed steps (for the star progress row). */
  doneCount?: number;
  totalSteps?: number;
  /** Animated points total. */
  points?: number;
  onExit?: () => void;
  /** Hide the HUD header (used when a game overlay with its own HUD is open). */
  hideHud?: boolean;
  /** Identifier for the HUD: "outer" for the session shell, "game" for game overlays. */
  hudId?: 'outer' | 'game';
}

/**
 * The kid world shell (Wave 8 redesign, compact HUD): the ambient animated
 * SkyBackdrop, and a slim floating glass HUD bar — progress stars on the
 * left, a star points pill, mute and exit controls on the right.
 *
 * The header is compact (single row, small controls) and uses a solid
 * sky-tinted background so scrolling content never shows through behind it.
 *
 * Props API is unchanged; all existing callers keep working.
 */
export default function KidShell({ children, doneCount = 0, totalSteps = 0, points = 0, onExit, hideHud = false, hudId = 'game' }: KidShellProps) {
  const [muted, setMutedState] = useState(isMuted());

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) playSfx('click');
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-clip">
      <SkyBackdrop />

      {/* HUD — slim floating bar. Compact single-row design with a solid
          sky-tinted background so it never covers content with a translucent
          overlay. Sticky keeps exit/mute reachable while scrolling.
          Hidden when a game overlay (with its own HUD) is open. */}
      {!hideHud && (
      <header data-kid-hud={hudId} className="sticky top-0 z-20 bg-kid-sky-200 px-2 pb-2 pt-2 shadow-[0_2px_12px_rgba(23,50,79,0.08)] md:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 rounded-full border border-white/60 bg-white/70 py-1 pl-3 pr-1.5 shadow-md md:pl-4">
          {/* Progress stars — small and compact */}
          <div className="flex min-w-0 flex-1 items-center gap-0.5" role="img" aria-label={`${doneCount} of ${totalSteps} activities done`}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={i < doneCount ? 'animate-kid-pop-in' : ''}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <svg className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 64 64">
                  <path
                    d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
                    fill={i < doneCount ? '#FFC93C' : 'rgba(255,255,255,0.55)'}
                    stroke={i < doneCount ? '#E09E00' : 'rgba(255,255,255,0.9)'}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ))}
            {totalSteps === 0 && (
              <span className="text-xs font-black text-kid-ink-700">Have fun!</span>
            )}
          </div>

          {/* Points pill + controls — compact */}
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-full bg-white/80 py-1 pl-1.5 pr-2.5 shadow-inner">
              <svg width="18" height="18" viewBox="0 0 64 64">
                <path d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z" fill="#FFC93C" stroke="#E09E00" strokeWidth="3" strokeLinejoin="round" />
              </svg>
              <span key={points} className="animate-kid-pop-in font-display text-base font-bold tabular-nums text-kid-ink-900">
                {points}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white shadow-sm transition-transform hover:scale-105 active:scale-90"
            >
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17324F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" fill="#17324F" stroke="none" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17324F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" fill="#17324F" stroke="none" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                </svg>
              )}
            </button>
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="btn-kid btn-kid-coral rounded-full px-3 py-1.5 text-sm md:px-4"
              >
                <span className="hidden sm:inline">Done for now</span>
                <span className="sm:hidden">Done</span>
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Stage. Children get my-auto instead of justify-center on this
          container: identical centering when content fits, but the top can
          never be pushed above the scroll origin when it overflows
          (the classic flexbox centering + overflow trap). */}
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 pb-8 pt-2 [&>*]:my-auto md:px-8">
        {children}
      </main>
    </div>
  );
}
