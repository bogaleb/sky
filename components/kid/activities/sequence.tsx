'use client';

import { useState } from 'react';
import type { CardOption } from '@/lib/kid/types';
import { playSfx } from '@/lib/kid/audio';

export interface SequenceRendererProps {
  items: CardOption[];
  onCommit: (answer: { sequence: string[] }) => void;
  locked: boolean;
}

/**
 * Tap-to-order: tiles start shuffled in the tray; each tap flies the tile
 * into the next answer slot. Tap a placed tile to send it back.
 */
export default function SequenceRenderer({ items, onCommit, locked }: SequenceRendererProps) {
  const [placed, setPlaced] = useState<string[]>([]);

  const remaining = items.filter((it) => !placed.includes(it.id));

  const place = (id: string) => {
    if (locked || placed.length >= items.length) return;
    playSfx('pop');
    setPlaced((p) => [...p, id]);
  };

  const unplace = (id: string) => {
    if (locked) return;
    playSfx('click');
    setPlaced((p) => p.filter((x) => x !== id));
  };

  const labelOf = (id: string) => items.find((it) => it.id === id)?.label ?? id;
  const complete = placed.length === items.length;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-6">
      {/* Answer slots */}
      <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Your order">
        {items.map((_, i) => {
          const id = placed[i];
          return (
            <div
              key={i}
              className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-dashed border-white/80 bg-white/40 text-3xl font-black text-kid-ink-900 shadow-inner md:h-24 md:w-24 md:text-4xl"
            >
              {id ? (
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => unplace(id)}
                  className="animate-kid-pop-in flex h-full w-full items-center justify-center rounded-2xl bg-kid-sun-400 shadow-[0_8px_18px_rgba(255,174,0,0.45)] transition-transform hover:scale-105 active:scale-95"
                  aria-label={`Remove ${labelOf(id)}`}
                >
                  {labelOf(id)}
                </button>
              ) : (
                <span className="text-white/70">{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tray */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-kid-card border-4 border-white/60 bg-white/85 px-6 py-5 shadow-lg" role="group" aria-label="Tiles to order">
        {remaining.map((it, i) => (
          <button
            key={it.id}
            type="button"
            disabled={locked}
            onClick={() => place(it.id)}
            className="animate-kid-pop-in h-20 w-20 rounded-2xl border-b-8 border-kid-grape-700 bg-kid-grape-500 text-3xl font-black text-white shadow-[0_10px_22px_rgba(23,50,79,0.22)] transition-all hover:-translate-y-1 hover:brightness-105 active:scale-90 md:h-24 md:w-24 md:text-4xl"
            style={{ animationDelay: `${i * 0.07}s` }}
            aria-label={`Place ${it.label}`}
          >
            {it.label}
          </button>
        ))}
        {remaining.length === 0 && (
          <p className="px-4 py-2 text-lg font-bold text-kid-ink-700/70">All placed! Tap one to move it back.</p>
        )}
      </div>

      <button
        type="button"
        disabled={locked || !complete}
        onClick={() => {
          playSfx('whoosh');
          onCommit({ sequence: placed });
        }}
        className="rounded-kid-card border-b-8 border-kid-mint-600 bg-kid-mint-500 px-12 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:saturate-50"
      >
        Check my order!
      </button>
    </div>
  );
}
