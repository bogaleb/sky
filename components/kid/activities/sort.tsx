'use client';

import { useState } from 'react';
import type { CardOption, SortGroup } from '@/lib/kid/types';
import { playSfx } from '@/lib/kid/audio';

export interface SortRendererProps {
  items: CardOption[];
  groups: SortGroup[];
  onCommit: (answer: { groups: Record<string, string[]> }) => void;
  locked: boolean;
}

const GROUP_STYLES = [
  { bg: 'bg-kid-sky-400', border: 'border-kid-sky-600', glow: 'shadow-[0_10px_26px_rgba(76,201,240,0.45)]' },
  { bg: 'bg-kid-berry-500', border: 'border-kid-berry-400', glow: 'shadow-[0_10px_26px_rgba(241,91,181,0.45)]' },
];

/**
 * Tap-an-item, tap-a-basket sorting. Selected item glows; baskets bounce
 * when they receive an item. "Check" commits the grouping.
 */
export default function SortRenderer({ items, groups, onCommit, locked }: SortRendererProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const [justDropped, setJustDropped] = useState<string | null>(null);

  const unassigned = items.filter((it) => !assigned[it.id]);

  const tapItem = (id: string) => {
    if (locked) return;
    playSfx('click');
    setSelected((s) => (s === id ? null : id));
  };

  const tapGroup = (groupId: string) => {
    if (locked || !selected) return;
    playSfx('pop');
    setAssigned((a) => ({ ...a, [selected]: groupId }));
    setSelected(null);
    setJustDropped(groupId);
    setTimeout(() => setJustDropped((j) => (j === groupId ? null : j)), 500);
  };

  const unassign = (id: string) => {
    if (locked) return;
    playSfx('click');
    setAssigned((a) => {
      const next = { ...a };
      delete next[id];
      return next;
    });
  };

  const labelOf = (id: string) => items.find((it) => it.id === id)?.label ?? id;
  const complete = unassigned.length === 0;

  const commit = () => {
    playSfx('whoosh');
    const out: Record<string, string[]> = {};
    for (const g of groups) out[g.id] = [];
    for (const [itemId, groupId] of Object.entries(assigned)) {
      (out[groupId] ||= []).push(itemId);
    }
    // Server compares against deterministic sorted lists; keep insertion order
    // stable by sorting each group's item ids.
    for (const g of groups) out[g.id].sort();
    onCommit({ groups: out });
  };

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-5">
      {/* Baskets */}
      <div className="grid w-full grid-cols-2 gap-4 md:gap-6">
        {groups.map((g, gi) => {
          const st = GROUP_STYLES[gi % GROUP_STYLES.length];
          const here = items.filter((it) => assigned[it.id] === g.id);
          return (
            <button
              key={g.id}
              type="button"
              disabled={locked}
              onClick={() => tapGroup(g.id)}
              className={`min-h-44 rounded-kid-card border-4 border-white/70 ${st.bg} ${st.glow} p-4 text-white shadow-xl transition-all hover:brightness-105 active:scale-[0.98] ${justDropped === g.id ? 'animate-kid-bounce-soft' : ''} ${selected ? 'ring-4 ring-kid-sun-400 ring-offset-2' : ''}`}
              aria-label={`Basket: ${g.label}`}
            >
              <span className="text-xl font-black uppercase tracking-wide drop-shadow md:text-2xl">{g.label}</span>
              <span className="mt-2 flex min-h-16 flex-wrap items-center justify-center gap-2">
                {here.map((it) => (
                  <span
                    key={it.id}
                    onClick={(e) => { e.stopPropagation(); unassign(it.id); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); unassign(it.id); } }}
                    className="animate-kid-pop-in cursor-pointer rounded-full bg-white px-4 py-2 text-lg font-extrabold text-kid-ink-900 shadow transition-transform hover:scale-105"
                    aria-label={`Remove ${it.label} from ${g.label}`}
                  >
                    {it.label}
                  </span>
                ))}
                {here.length === 0 && (
                  <span className="text-white/70 text-lg font-bold">
                    {selected ? 'Tap here!' : '—'}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Item pool */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-kid-card border-4 border-white/60 bg-white/50 px-6 py-4 shadow-lg backdrop-blur-sm" role="group" aria-label="Items to sort">
        {unassigned.map((it, i) => (
          <button
            key={it.id}
            type="button"
            disabled={locked}
            onClick={() => tapItem(it.id)}
            className={`animate-kid-pop-in rounded-full px-6 py-3 text-xl font-extrabold shadow-lg transition-all active:scale-90 md:text-2xl ${
              selected === it.id
                ? 'scale-110 bg-kid-sun-400 text-kid-ink-900 ring-4 ring-white'
                : 'bg-white text-kid-ink-900 hover:scale-105'
            }`}
            style={{ animationDelay: `${i * 0.06}s` }}
            aria-label={`Sort ${it.label}`}
            aria-pressed={selected === it.id}
          >
            {it.label}
          </button>
        ))}
        {unassigned.length === 0 && (
          <p className="px-4 py-2 text-lg font-bold text-kid-ink-700/70">All sorted! Tap an item to move it.</p>
        )}
      </div>

      <button
        type="button"
        disabled={locked || !complete}
        onClick={commit}
        className="rounded-kid-card border-b-8 border-kid-mint-600 bg-kid-mint-500 px-12 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:saturate-50"
      >
        Check my sorting!
      </button>
    </div>
  );
}
