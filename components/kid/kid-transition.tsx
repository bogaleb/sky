'use client';

/**
 * Keyed enter transition for kid-world phase changes (map <-> island intro
 * <-> activity <-> celebration). Changing `transitionKey` remounts the
 * wrapper so the view-enter animation replays: a gentle fade, rise, and
 * settle. Disabled automatically under prefers-reduced-motion.
 */
export default function PhaseTransition({
  transitionKey,
  children,
  className = '',
}: {
  transitionKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div key={transitionKey} className={`animate-kid-view-enter ${className}`}>
      {children}
    </div>
  );
}
