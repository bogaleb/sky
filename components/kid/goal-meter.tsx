'use client';

import { useEffect, useState } from 'react';
import { getGoalProgress, type GoalProgress } from '@/app/actions/goals';

/** Star jar that fills toward the weekly goal. Original SVG art, no emoji. */
function JarArt({ fill }: { fill: number }) {
  const clamped = Math.min(1, Math.max(0, fill));
  // Inner jar area: x 30..90, y 34..104. Fill rises from the bottom.
  const innerH = 70;
  const fillH = innerH * clamped;
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20 md:h-24 md:w-24" role="img" aria-label={`Star jar ${Math.round(clamped * 100)} percent full`}>
      <defs>
        <clipPath id="sky-jar-inner">
          <path d="M34 36 h52 v56 a10 10 0 0 1 -10 10 h-32 a10 10 0 0 1 -10 -10 z" />
        </clipPath>
      </defs>
      {/* glass */}
      <path
        d="M30 32 h60 v58 a14 14 0 0 1 -14 14 h-32 a14 14 0 0 1 -14 -14 z"
        fill="#E8F4FD"
        stroke="#7FB6E6"
        strokeWidth="4"
      />
      {/* lid */}
      <rect x="26" y="18" width="68" height="14" rx="7" fill="#7FB6E6" />
      {/* star fill */}
      <g clipPath="url(#sky-jar-inner)">
        <rect x="30" y={36 + (innerH - fillH)} width="60" height={fillH} fill="#FFD93C" opacity="0.85" />
        {clamped > 0.05 && (
          <path
            d="M60 44 L63 52 L71 52 L65 57 L67 65 L60 60 L53 65 L55 57 L49 52 L57 52 Z"
            fill="#fff"
            opacity="0.9"
          />
        )}
      </g>
      {/* shine */}
      <rect x="38" y="40" width="8" height="52" rx="4" fill="#fff" opacity="0.5" />
    </svg>
  );
}

/**
 * Small map widget showing the weekly goal as a star jar filling up.
 * Silent on error or when no goal data is available.
 */
export default function GoalMeter({ childId }: { childId: string }) {
  const [progress, setProgress] = useState<GoalProgress | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGoalProgress(childId)
      .then((p) => {
        if (!cancelled) setProgress(p);
      })
      .catch(() => {
        /* widget stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  if (!progress || progress.target <= 0) return null;

  const remaining = Math.max(0, progress.target - progress.completed);
  const fill = progress.completed / progress.target;

  return (
    <div
      className="flex items-center gap-3 rounded-kid-card bg-white/90 px-4 py-3 shadow-lg"
      aria-live="polite"
      aria-label={
        remaining === 0
          ? 'Weekly goal complete. The star jar is full.'
          : `${remaining} more ${remaining === 1 ? 'activity' : 'activities'} to fill the star jar.`
      }
    >
      <JarArt fill={fill} />
      <div>
        <p className="text-base font-black text-kid-ink-900 md:text-lg">Weekly star jar</p>
        <p className="text-sm font-bold text-kid-ink-700">
          {remaining === 0 ? (
            <>Goal complete! The jar is full!</>
          ) : (
            <>
              {remaining} more to fill the jar! ({progress.completed}/{progress.target})
            </>
          )}
        </p>
      </div>
    </div>
  );
}
