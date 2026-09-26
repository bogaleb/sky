'use client';

import { useMemo, useState } from 'react';
import type { CountObject } from '@/lib/kid/types';
import { playSfx } from '@/lib/kid/audio';
import KidShape from '../shapes';

export interface CountRendererProps {
  objects: CountObject[];
  onCommit: (answer: { count: number }) => void;
  locked: boolean;
}

/**
 * Tap-each-to-count: objects float around the pond; each tap pops it with
 * a number badge and a *pop* sound. The big button commits the total.
 */
export default function CountRenderer({ objects, onCommit, locked, }: CountRendererProps) {
  const [tapped, setTapped] = useState<string[]>([]);

  // Deterministic scatter so the layout is stable per activity.
  const spots = useMemo(
    () =>
      objects.map((o, i) => {
        const n = objects.length;
        const cols = Math.ceil(Math.sqrt(n * 1.6));
        const row = Math.floor(i / cols);
        const col = i % cols;
        return {
          id: o.id,
          left: 6 + col * (88 / Math.max(cols - 1, 1)) + ((row % 2) * 7 - 3.5),
          top: 8 + row * 26 + ((i * 13) % 9),
          delay: (i * 0.35) % 2.4,
          size: 84 + ((i * 37) % 30),
        };
      }),
    [objects]
  );

  const tap = (id: string) => {
    if (locked || tapped.includes(id)) return;
    playSfx('pop');
    setTapped((t) => [...t, id]);
  };

  const count = tapped.length;

  return (
    <div className="flex w-full max-w-4xl flex-col items-center">
      {/* Pond */}
      <div className="relative h-72 w-full overflow-hidden rounded-kid-card border-4 border-white/60 bg-kid-sky-400/60 shadow-inner md:h-80">
        {spots.map((s, i) => {
          const isTapped = tapped.includes(s.id);
          const num = tapped.indexOf(s.id) + 1;
          return (
            <button
              key={s.id}
              type="button"
              disabled={locked || isTapped}
              onClick={() => tap(s.id)}
              className="absolute animate-kid-pop-in transition-transform"
              style={{
                left: `${Math.min(s.left, 82)}%`,
                top: `${Math.min(s.top, 62)}%`,
                width: s.size,
                height: s.size,
                animationDelay: `${i * 0.07}s`,
              }}
              aria-label={isTapped ? `Counted ${num}` : 'Tap to count'}
            >
              <span className={`block ${isTapped ? '' : 'animate-kid-float'}`} style={{ animationDelay: `${s.delay}s` }}>
                <span className={`relative block transition-all duration-200 ${isTapped ? 'scale-90 saturate-150' : 'hover:scale-110 active:scale-90'}`}>
                  <KidShape shape={objects[i].shape} className="h-full w-full drop-shadow-[0_8px_12px_rgba(23,50,79,0.25)]" />
                  <span
                    className={isTapped ? 'animate-kid-pop-in absolute -right-2 -top-2' : 'hidden'}
                    aria-hidden
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-kid-sun-400 text-lg font-black text-kid-ink-900 shadow-lg ring-2 ring-white">
                      {num}
                    </span>
                  </span>
                </span>
              </span>
            </button>
          );
        })}
        {/* Big live counter */}
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2">
          <div key={count} className="animate-kid-pop-in rounded-full bg-white/90 px-6 py-2 text-3xl font-black tabular-nums text-kid-ink-900 shadow-xl">
            {count}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={locked || count === 0}
        onClick={() => {
          playSfx('whoosh');
          onCommit({ count });
        }}
        className="animate-kid-rise mt-6 rounded-kid-card border-b-8 border-kid-mint-600 bg-kid-mint-500 px-12 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:saturate-50"
      >
        {count === 0 ? 'Tap each one!' : `That's ${count}!`}
      </button>
    </div>
  );
}
