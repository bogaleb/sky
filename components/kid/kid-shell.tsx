'use client';

import { useState } from 'react';
import { isMuted, setMuted, playSfx } from '@/lib/kid/audio';

/** Drifting cloud. */
function Cloud({ top, scale, duration, delay, opacity }: { top: string; scale: number; duration: number; delay: number; opacity: number }) {
  return (
    <div
      className="pointer-events-none absolute animate-kid-drift"
      style={{ top, animationDuration: `${duration}s`, animationDelay: `${delay}s`, opacity }}
    >
      <svg width={180 * scale} height={90 * scale} viewBox="0 0 180 90" fill="white">
        <ellipse cx="60" cy="55" rx="42" ry="26" />
        <ellipse cx="100" cy="42" rx="36" ry="30" />
        <ellipse cx="132" cy="58" rx="30" ry="20" />
      </svg>
    </div>
  );
}

/** Floating island silhouette. */
function Island({ left, bottom, scale, delay }: { left: string; bottom: string; scale: number; delay: number }) {
  return (
    <div className="pointer-events-none absolute animate-kid-float" style={{ left, bottom, animationDelay: `${delay}s`, opacity: 0.9 }}>
      <svg width={150 * scale} height={110 * scale} viewBox="0 0 150 110">
        <ellipse cx="75" cy="38" rx="62" ry="20" fill="#8FD6A0" />
        <ellipse cx="75" cy="34" rx="52" ry="15" fill="#A9E5B8" />
        <path d="M28 48 Q75 108 122 48 Q100 58 75 58 Q50 58 28 48 Z" fill="#9C7B54" />
        <path d="M28 48 Q75 108 122 48" fill="none" stroke="#7D5F3E" strokeWidth="3" />
        <rect x="70" y="8" width="8" height="22" fill="#7D5F3E" rx="3" />
        <circle cx="74" cy="10" r="14" fill="#4E9E5B" />
        <circle cx="62" cy="16" r="9" fill="#5FB56D" />
        <circle cx="86" cy="16" r="9" fill="#5FB56D" />
      </svg>
    </div>
  );
}

function Sparkle({ left, top, delay, size }: { left: string; top: string; delay: number; size: number }) {
  return (
    <div className="pointer-events-none absolute animate-kid-sparkle" style={{ left, top, animationDelay: `${delay}s` }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFE66D">
        <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
      </svg>
    </div>
  );
}

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
 * The kid world shell: animated sky gradient, drifting clouds, floating
 * islands, twinkling sparkles, and the session HUD (stars, points, mute).
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
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #6FCFF5 0%, #9FE3FA 34%, #CDEFFD 58%, #FFF3D6 100%)',
        }}
        aria-hidden
      />
      {/* Sun */}
      <div className="pointer-events-none absolute right-[6%] top-[5%] h-24 w-24 md:h-32 md:w-32" aria-hidden>
        <div className="absolute inset-0 animate-kid-spin-slow">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={i}
                x="47"
                y="2"
                width="6"
                height="18"
                rx="3"
                fill="#FFD968"
                opacity="0.85"
                transform={`rotate(${i * 30} 50 50)`}
              />
            ))}
          </svg>
        </div>
        <div className="absolute inset-[22%] rounded-full bg-kid-sun-400 shadow-[0_0_44px_14px_rgba(255,201,60,0.55)]" />
      </div>

      {/* Clouds */}
      <Cloud top="8%" scale={1.1} duration={68} delay={-12} opacity={0.95} />
      <Cloud top="20%" scale={0.75} duration={92} delay={-45} opacity={0.8} />
      <Cloud top="4%" scale={0.55} duration={120} delay={-70} opacity={0.7} />

      {/* Islands */}
      <Island left="4%" bottom="6%" scale={1} delay={0} />
      <Island left="78%" bottom="10%" scale={0.7} delay={1.6} />

      {/* Sparkles */}
      <Sparkle left="22%" top="30%" delay={0} size={22} />
      <Sparkle left="64%" top="18%" delay={0.7} size={16} />
      <Sparkle left="45%" top="12%" delay={1.3} size={20} />

      {/* HUD */}
      <header className="relative z-20 flex items-center justify-between gap-2 px-3 pt-3 md:gap-3 md:px-8 md:pt-4">
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

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/85 py-1.5 pl-2 pr-4 shadow-lg backdrop-blur">
            <svg width="26" height="26" viewBox="0 0 64 64">
              <path d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z" fill="#FFC93C" stroke="#E09E00" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <span key={points} className="animate-kid-pop-in text-xl font-extrabold tabular-nums text-kid-ink-900">
              {points}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 shadow-lg backdrop-blur transition-transform active:scale-90"
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
              className="rounded-full bg-white/85 px-3 py-2 text-sm font-bold text-kid-ink-700 shadow-lg backdrop-blur transition-transform active:scale-95 md:px-4 md:py-2.5"
            >
              <span className="hidden sm:inline">Done for now</span>
              <span className="sm:hidden">Done</span>
            </button>
          )}
        </div>
      </header>

      {/* Stage */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-2 md:px-8">
        {children}
      </main>
    </div>
  );
}
