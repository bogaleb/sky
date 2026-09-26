'use client';

import { useEffect, useRef, useState } from 'react';
import { getPracticeSignals } from '@/app/actions/progress';
import { recommendNext, type Recommendation } from '@/lib/kid/recommend';
import { getIsland } from '@/lib/kid/islands';
import { speakAs, playSfx } from '@/lib/kid/audio';

/**
 * UpNext — an adaptive recommendation rail for the Sky map.
 * Suggests what to practice next based on mastery and recency
 * (spaced repetition), with the Adventure Trail first when a
 * quest is waiting. Curio introduces the picks once per view.
 */

export interface UpNextProps {
  childId: string;
  onPracticeIsland: (islandId: string) => void;
  onStartTrail: () => void;
}

function TrailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M8 42c8-2 10-8 14-14s6-12 14-14" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="1 8" />
      <path d="M30 6h12v18H30z" fill="#fff" opacity="0.35" />
      <rect x="30" y="6" width="12" height="14" rx="2" fill="#fff" />
      <path d="M32 8.5l8 4-8 4z" fill="#FF6B6B" />
      <circle cx="8" cy="42" r="4" fill="#fff" />
    </svg>
  );
}

function PracticeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="10" y="8" width="28" height="34" rx="4" fill="#fff" opacity="0.35" />
      <rect x="13" y="11" width="22" height="28" rx="2.5" fill="#fff" />
      <line x1="18" y1="19" x2="30" y2="19" stroke="#7C5CBF" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="25" x2="30" y2="25" stroke="#7C5CBF" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="31" x2="26" y2="31" stroke="#7C5CBF" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 36l6-2-2 6z" fill="#FFD166" />
    </svg>
  );
}

function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="8" y="10" width="14" height="18" rx="3" fill="#fff" opacity="0.95" />
      <rect x="26" y="10" width="14" height="18" rx="3" fill="#fff" opacity="0.6" />
      <path d="M15 16l1.4 2.9 3.1.4-2.2 2.1.5 3-2.8-1.5-2.8 1.5.5-3-2.2-2.1 3.1-.4z" fill="#7C5CBF" />
      <path d="M14 34a8 8 0 1 1-4-7" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M6 24l4-1 1 4z" fill="#fff" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
        fill="#FFC93C"
        stroke="#E09E00"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = { trail: TrailIcon, practice: PracticeIcon, replay: ReplayIcon } as const;
const CARD_BG = {
  trail: 'bg-kid-coral-400',
  practice: 'bg-kid-grape-400',
  replay: 'bg-kid-sun-400',
} as const;
const CARD_TEXT = { trail: 'text-white', practice: 'text-white', replay: 'text-kid-ink-900' } as const;
const BUTTON_LABEL = { trail: "Let's go!", practice: 'Practice time!', replay: 'Keep adventuring' } as const;

export default function UpNext({ childId, onPracticeIsland, onStartTrail }: UpNextProps) {
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const greeted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const signals = await getPracticeSignals(childId);
        if (cancelled) return;
        const next = recommendNext({ mastery: signals.mastery, trail: signals.trail });
        setRecs(next);
        if (!greeted.current && next.length > 0) {
          greeted.current = true;
          speakAs('curio', "Look what I picked for you today!");
        }
      } catch {
        if (!cancelled) setRecs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [childId]);

  if (recs === null) {
    return (
      <section aria-label="Up next for you" className="w-full max-w-3xl px-4">
        <div className="kid-skeleton mb-3 h-8 w-48" aria-hidden />
        <div className="flex gap-3 overflow-hidden" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="kid-skeleton h-40 min-w-56 flex-1" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </section>
    );
  }

  if (recs.length === 0) {
    return (
      <section aria-label="Up next for you" className="w-full max-w-3xl px-4">
        <div className="animate-kid-pop-in flex flex-col items-center rounded-kid-card bg-white/95 px-6 py-6 text-center shadow-xl">
          <div className="animate-kid-bounce-soft">
            <StarIcon className="h-16 w-16" />
          </div>
          <h2 className="mt-2 text-2xl font-black text-kid-ink-900">You&apos;re a superstar!</h2>
          <p className="mt-1 text-base font-bold text-kid-ink-700">
            You practiced everything. Amazing work!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Up next for you" className="w-full max-w-3xl px-4">
      <h2 className="mb-3 text-xl font-black text-kid-ink-900 md:text-2xl">Up next for you</h2>
      <ul role="list" className="flex gap-3 overflow-x-auto pb-2">
        {recs.map((rec) => {
          const Icon = ICONS[rec.kind];
          const island = rec.islandId ? getIsland(rec.islandId) : null;
          const go = () => {
            playSfx('pop');
            if (rec.kind === 'practice' && rec.islandId) onPracticeIsland(rec.islandId);
            else onStartTrail();
          };
          return (
            <li key={`${rec.kind}-${rec.skillId ?? rec.islandId ?? 'x'}`} role="listitem" className="min-w-56 flex-1">
              <button
                type="button"
                onClick={go}
                aria-label={`${rec.title}. ${rec.detail}`}
                className={`flex h-full w-full flex-col items-start gap-2 rounded-kid-card ${CARD_BG[rec.kind]} ${CARD_TEXT[rec.kind]} px-5 py-4 text-left shadow-lg transition-transform hover:scale-[1.03] active:scale-95`}
              >
                <Icon className="h-12 w-12" />
                <span>
                  <span className="block text-lg font-black leading-tight">{rec.title}</span>
                  <span className="mt-1 block text-sm font-bold opacity-90">{rec.detail}</span>
                </span>
                <span className="mt-auto inline-block rounded-full bg-white/90 px-4 py-2 text-sm font-black text-kid-ink-900">
                  {BUTTON_LABEL[rec.kind]}
                </span>
                {island && <span className="sr-only">on {island.islandName}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
