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
}

/**
 * The kid world shell (Wave 8 redesign): the ambient animated SkyBackdrop,
 * and a modern floating glass HUD bar — progress dots on the left, a star
 * points pill, mute and exit controls on the right.
 *
 * Props API is unchanged; all existing callers keep working.
 */
export default function KidShell({ children, doneCount = 0, totalSteps = 0, points = 0, onExit }: KidShellProps) {
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

      {/* HUD — floating glass bar. Sticky so the exit/mute controls stay
          reachable even when game content overflows and the overlay scrolls. */}
      <header className="sticky top-0 z-20 px-3 pt-3 md:px-8 md:pt-4">
        <div className="glass-kid mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-full px-3 py-2 md:px-5 md:py-2.5">
          {/* Progress dots */}
          <div className="flex items-center gap-1" role="img" aria-label={`${doneCount} of ${totalSteps} activities done`}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={i < doneCount ? 'animate-kid-pop-in' : ''}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <svg className="h-6 w-6 md:h-[34px] md:w-[34px]" viewBox="0 0 64 64">
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
          </div>

          {/* Points pill + controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-white/70 py-1.5 pl-2 pr-4 shadow-inner">
              <svg width="26" height="26" viewBox="0 0 64 64">
                <path d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z" fill="#FFC93C" stroke="#E09E00" strokeWidth="3" strokeLinejoin="round" />
              </svg>
              <span key={points} className="animate-kid-pop-in font-display text-xl font-bold tabular-nums text-kid-ink-900">
                {points}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/60 shadow-md backdrop-blur transition-transform hover:scale-105 active:scale-90"
            >
              {muted ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#17324F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" fill="#17324F" stroke="none" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#17324F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
                className="btn-kid btn-kid-coral btn-kid-sm"
              >
                <span className="hidden sm:inline">Done for now</span>
                <span className="sm:hidden">Done</span>
              </button>
            )}
          </div>
        </div>
      </header>

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
