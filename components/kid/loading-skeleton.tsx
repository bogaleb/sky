'use client';

/**
 * Shimmer loading skeletons for the kid world. Each skeleton is sized to
 * the content it stands in for, so swapping real content in never shifts
 * layout. Pure token-driven CSS; static under prefers-reduced-motion.
 */

/** Placeholder for the sky map: island card grid shape. */
export function MapSkeleton() {
  return (
    <div className="flex w-full flex-col items-center gap-5" aria-hidden>
      <div className="kid-skeleton h-24 w-full max-w-3xl" />
      <div className="grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="kid-skeleton h-36" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}

/** Placeholder for an island intro: hero banner + text lines + big button. */
export function IslandIntroSkeleton() {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4 px-4" aria-hidden>
      <div className="kid-skeleton h-44 w-full md:h-56" />
      <div className="kid-skeleton h-8 w-2/3" />
      <div className="kid-skeleton h-5 w-full" />
      <div className="kid-skeleton h-5 w-5/6" />
      <div className="kid-skeleton h-16 w-64" style={{ borderRadius: '999px' }} />
    </div>
  );
}
