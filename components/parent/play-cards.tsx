'use client';

import { useMemo, useState } from 'react';
import {
  PLAY_CARDS,
  playCardsForSubject,
  skillDisplayName,
  type PlayCard,
} from '@/lib/kid/play-cards';
import { ISLANDS } from '@/lib/kid/islands';

const SUBJECTS = ISLANDS.map((i) => ({
  code: i.subjectCode,
  name: i.subjectName,
  islandName: i.islandName,
}));

function PlayCardItem({ card }: { card: PlayCard }) {
  const subject = SUBJECTS.find((s) => s.code === card.subjectCode);
  return (
    <li className="card-kid rounded-2xl border border-parent-sky-100 bg-white p-5 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-extrabold text-parent-ink-900">{card.title}</h3>
        <p className="text-xs font-bold uppercase tracking-wider text-parent-sky-700">
          {card.minutes} min
        </p>
      </div>
      <p className="mt-1 text-sm font-semibold text-parent-ink-600">
        {subject?.name} &middot; practices {skillDisplayName(card.skillId)}
      </p>
      <p className="mt-3 text-parent-ink-900">{card.howTo}</p>
      <p className="mt-3 text-sm text-parent-ink-600">
        <span className="font-bold text-parent-ink-900">You will need: </span>
        {card.materials}
      </p>
    </li>
  );
}

/**
 * Screen-free Play Cards: real-world activities parents can do with their
 * child, filterable by island. Prints cleanly for the fridge door.
 */
export default function PlayCards() {
  const [filter, setFilter] = useState<string>('all');

  const cards = useMemo(
    () => (filter === 'all' ? PLAY_CARDS : playCardsForSubject(filter)),
    [filter],
  );

  const activeName =
    filter === 'all' ? 'All islands' : SUBJECTS.find((s) => s.code === filter)?.name ?? filter;

  const print = () => {
    document.body.classList.add('sky-print-playcards');
    const done = () => document.body.classList.remove('sky-print-playcards');
    window.addEventListener('afterprint', done, { once: true });
    window.print();
    window.setTimeout(done, 1500);
  };

  return (
    <div>
      <style>{`
        @media print {
          body.sky-print-playcards * { visibility: hidden; }
          body.sky-print-playcards .sky-playcards-root,
          body.sky-print-playcards .sky-playcards-root * { visibility: visible; }
          body.sky-print-playcards .sky-playcards-root {
            position: fixed;
            inset: 0;
            margin: 0;
            border: none;
            box-shadow: none;
            background: #fff;
            color: #000;
            overflow: visible;
          }
          body.sky-print-playcards .sky-playcards-root * {
            color: #000 !important;
            background: transparent !important;
            border-color: #bbb !important;
            box-shadow: none !important;
          }
          body.sky-print-playcards .no-print { display: none !important; }
          body.sky-print-playcards .sky-playcards-root li { break-inside: avoid; }
        }
      `}</style>

      <div className="sky-playcards-root card-kid rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-parent-sky-700">
              Beyond the screen
            </p>
            <h2 className="mt-1 text-2xl font-black text-parent-ink-900">Screen-free Play Cards</h2>
            <p className="mt-1 text-sm text-parent-ink-600">
              Real-world activities that practice the same skills &mdash; {cards.length} cards
              {filter !== 'all' && ` for ${activeName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={print}
            className="no-print rounded-xl bg-parent-sky-600 px-5 py-2.5 font-bold text-white transition-all hover:bg-parent-sky-700"
          >
            Print all
          </button>
        </div>

        <div className="no-print mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by island">
          <button
            type="button"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
              filter === 'all'
                ? 'bg-parent-sky-600 text-white'
                : 'border border-parent-sky-200 bg-white text-parent-ink-900 hover:border-parent-sky-400'
            }`}
          >
            All islands
          </button>
          {SUBJECTS.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => setFilter(s.code)}
              aria-pressed={filter === s.code}
              title={s.islandName}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                filter === s.code
                  ? 'bg-parent-sky-600 text-white'
                  : 'border border-parent-sky-200 bg-white text-parent-ink-900 hover:border-parent-sky-400'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <PlayCardItem key={card.id} card={card} />
          ))}
        </ul>

        {cards.length === 0 && (
          <p className="mt-6 text-parent-ink-600">No play cards for this island yet.</p>
        )}
      </div>
    </div>
  );
}
