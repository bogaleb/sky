'use client';

import { useEffect, useState } from 'react';
import {
  TROPHIES,
  TROPHY_CATEGORIES,
  type Trophy,
  type TrophyArt,
  type TrophyCategory,
} from '@/lib/kid/trophies';
import { getTrophies } from '@/app/actions/trophies';
import { playSfx, speakAs, stopSpeaking } from '@/lib/kid/audio';
import { ConfettiBurst } from './celebration';

/** Category tint pairs for the trophy artwork gradients. */
const CATEGORY_TINTS: Record<TrophyCategory, [string, string]> = {
  explorer: ['#8FE0FA', '#2A9FD8'],
  learner: ['#C79CFF', '#6D3FC0'],
  collector: ['#FFDD70', '#FF9E00'],
  friend: ['#6FE3D2', '#1DA192'],
};

/** Original SVG artwork for each trophy art key. */
function TrophyArtwork({
  art,
  category,
  size = 64,
}: {
  art: TrophyArt;
  category: TrophyCategory;
  size?: number;
}) {
  const [light, deep] = CATEGORY_TINTS[category];
  const gid = `tg-${art}-${category}`;
  const stroke = 'rgba(23,50,79,0.35)';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
      </defs>
      {art === 'star' && (
        <g>
          <path
            d="M32 6 L39.5 24 L58 24 L43 35.5 L48.5 54 L32 43.5 L15.5 54 L21 35.5 L6 24 L24.5 24 Z"
            fill={`url(#${gid})`}
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="48" cy="14" r="3" fill="#FFFFFF" opacity="0.9" />
          <circle cx="15" cy="50" r="2.2" fill="#FFFFFF" opacity="0.8" />
        </g>
      )}
      {art === 'medal' && (
        <g>
          <path d="M23 4 L32 24 L41 4 L47 4 L37 28 L27 28 L17 4 Z" fill={`url(#${gid})`} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="32" cy="42" r="15" fill={`url(#${gid})`} stroke={stroke} strokeWidth="2.5" />
          <circle cx="32" cy="42" r="8.5" fill="#FFFFFF" opacity="0.55" />
          <path d="M32 36.5 L33.8 40.2 L37.8 40.6 L34.9 43.3 L35.6 47.2 L32 45.2 L28.4 47.2 L29.1 43.3 L26.2 40.6 L30.2 40.2 Z" fill={deep} />
        </g>
      )}
      {art === 'cup' && (
        <g>
          <path d="M18 8 h28 v4 c0 11 -6.5 18 -14 18 c-7.5 0 -14 -7 -14 -18 z" fill={`url(#${gid})`} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M18 12 c-7 0 -9 9 -2 12" fill="none" stroke={deep} strokeWidth="4" strokeLinecap="round" />
          <path d="M46 12 c7 0 9 9 2 12" fill="none" stroke={deep} strokeWidth="4" strokeLinecap="round" />
          <rect x="29.5" y="30" width="5" height="10" rx="2" fill={deep} />
          <rect x="21" y="40" width="22" height="7" rx="3.5" fill={deep} />
          <rect x="17" y="47" width="30" height="7" rx="3.5" fill={`url(#${gid})`} stroke={stroke} strokeWidth="2" />
          <circle cx="32" cy="18" r="3" fill="#FFFFFF" opacity="0.7" />
        </g>
      )}
      {art === 'crown' && (
        <g>
          <path
            d="M10 50 L13 20 L23 33 L32 13 L41 33 L51 20 L54 50 Z"
            fill={`url(#${gid})`}
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="10" y="44" width="44" height="9" rx="4" fill={deep} />
          <circle cx="32" cy="30" r="3.4" fill="#FFFFFF" opacity="0.85" />
          <circle cx="20" cy="38" r="2.4" fill="#FFFFFF" opacity="0.7" />
          <circle cx="44" cy="38" r="2.4" fill="#FFFFFF" opacity="0.7" />
        </g>
      )}
      {art === 'gem' && (
        <g>
          <path d="M32 5 L51 23 L32 59 L13 23 Z" fill={`url(#${gid})`} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M13 23 H51" stroke={stroke} strokeWidth="2" />
          <path d="M32 5 L24 23 L32 59" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
          <path d="M32 5 L40 23" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.45" />
        </g>
      )}
      {art === 'ribbon' && (
        <g>
          <path d="M22 30 L14 56 L22 52 L28 58 L32 34 Z" fill={deep} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M42 30 L50 56 L42 52 L36 58 L32 34 Z" fill={deep} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="32" cy="24" r="14" fill={`url(#${gid})`} stroke={stroke} strokeWidth="2.5" />
          <circle cx="32" cy="24" r="7" fill="#FFFFFF" opacity="0.55" />
          <path d="M32 19.5 L33.5 22.6 L36.9 22.9 L34.4 25.2 L35.1 28.5 L32 26.8 L28.9 28.5 L29.6 25.2 L27.1 22.9 L30.5 22.6 Z" fill={deep} />
        </g>
      )}
    </svg>
  );
}

function TrophyTile({
  trophy,
  earned,
}: {
  trophy: Trophy;
  earned: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!earned}
      onClick={() => {
        playSfx('pop');
        speakAs('curio', `${trophy.name}! ${trophy.description}`);
      }}
      className={`flex w-28 flex-col items-center gap-1 rounded-kid-card border-4 p-2 transition-all sm:w-32 ${
        earned
          ? 'border-white/80 bg-white/95 shadow-[0_10px_24px_rgba(23,50,79,0.25)] hover:scale-105 active:scale-95'
          : 'border-white/25 bg-white/10'
      }`}
      aria-label={earned ? `${trophy.name}: ${trophy.description}. Tap to hear.` : `Locked trophy. Hint: ${trophy.description}`}
    >
      <span
        className="flex h-20 w-20 items-center justify-center"
        style={earned ? undefined : { filter: 'brightness(0)', opacity: 0.32 }}
      >
        <TrophyArtwork art={trophy.art} category={trophy.category} size={72} />
      </span>
      <span className={`text-center text-sm font-black leading-tight ${earned ? 'text-kid-ink-900' : 'text-white/85'}`}>
        {earned ? trophy.name : '???'}
      </span>
      <span className={`text-center text-[11px] font-bold leading-tight ${earned ? 'text-kid-ink-700' : 'text-white/70'}`}>
        {trophy.description}
      </span>
      {earned && trophy.starBonus > 0 && (
        <span className="rounded-full bg-kid-sun-400 px-2 py-0.5 text-[11px] font-black text-kid-ink-900">
          +{trophy.starBonus} stars
        </span>
      )}
    </button>
  );
}

/** Standalone celebration popup for freshly-earned trophies. */
export function TrophyCelebration({
  trophies,
  onDone,
}: {
  trophies: Trophy[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const trophy = trophies[index];
  useEffect(() => {
    if (!trophy) return;
    playSfx('fanfare');
    const t = setTimeout(() => {
      speakAs('curio', `You earned the ${trophy.name} trophy! ${trophy.description} Plus ${trophy.starBonus} bonus stars!`);
    }, 400);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [trophy]);
  if (!trophy) return null;
  const last = index === trophies.length - 1;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/60 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`New trophy: ${trophy.name}`}
    >
      <ConfettiBurst count={70} />
      <div className="animate-kid-pop-in flex max-w-sm flex-col items-center gap-3 rounded-kid-card border-4 border-white/80 bg-kid-cream p-8 text-center shadow-[0_24px_60px_rgba(23,50,79,0.4)]">
        <TrophyArtwork art={trophy.art} category={trophy.category} size={120} />
        <p className="text-sm font-black uppercase tracking-widest text-kid-grape-700">New trophy!</p>
        <h2 className="text-3xl font-black text-kid-ink-900">{trophy.name}</h2>
        <p className="text-lg font-bold text-kid-ink-700">{trophy.description}</p>
        {trophy.starBonus > 0 && (
          <p className="rounded-full bg-kid-sun-400 px-4 py-1 text-base font-black text-kid-ink-900">
            +{trophy.starBonus} bonus stars!
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            playSfx('click');
            stopSpeaking();
            if (last) onDone();
            else setIndex((i) => i + 1);
          }}
          className="mt-2 rounded-kid-card border-b-8 border-kid-mint-600 bg-kid-mint-500 px-10 py-4 text-2xl font-black text-white transition-all hover:scale-105 active:scale-95"
        >
          {last ? 'Yay!' : 'Next!'}
        </button>
      </div>
    </div>
  );
}

/**
 * The trophy shelf: every achievement, grouped by category on wooden
 * shelves. Earned trophies shine in full color; locked ones wait as
 * silhouettes with hints. Pass freshly-earned trophies via `newTrophies`
 * to celebrate them with a popup.
 */
export default function TrophyShelf({
  childId,
  newTrophies = [],
  onClearNewTrophies,
}: {
  childId: string;
  newTrophies?: Trophy[];
  onClearNewTrophies?: () => void;
}) {
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [celebrating, setCelebrating] = useState<Trophy[]>([]);

  useEffect(() => {
    let live = true;
    getTrophies(childId)
      .then((ids) => {
        if (live) setEarnedIds(ids);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [childId]);

  useEffect(() => {
    if (newTrophies.length > 0) {
      setCelebrating((prev) => [...prev, ...newTrophies.filter((t) => !prev.some((p) => p.id === t.id))]);
      setEarnedIds((prev) => [...prev, ...newTrophies.map((t) => t.id).filter((id) => !prev.includes(id))]);
    }
  }, [newTrophies]);

  const earnedSet = new Set(earnedIds);
  const earnedCount = TROPHIES.filter((t) => earnedSet.has(t.id)).length;

  const categories = (Object.keys(TROPHY_CATEGORIES) as TrophyCategory[]).map((cat) => ({
    cat,
    meta: TROPHY_CATEGORIES[cat],
    trophies: TROPHIES.filter((t) => t.category === cat),
  }));

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-center gap-3">
        <h2 className="text-3xl font-black text-white drop-shadow-[0_2px_8px_rgba(12,24,44,0.5)]">
          Trophy Shelf
        </h2>
        <span className="rounded-full bg-white/90 px-4 py-1 text-lg font-black text-kid-ink-900 shadow">
          {earnedCount} / {TROPHIES.length}
        </span>
      </div>

      {categories.map(({ cat, meta, trophies }) => (
        <section key={cat} aria-label={`${meta.label} trophies`}>
          <div className="mb-2 flex items-baseline justify-center gap-2">
            <h3 className="text-xl font-black text-white drop-shadow-[0_2px_6px_rgba(12,24,44,0.5)]">
              {meta.label}
            </h3>
            <span className="text-sm font-bold text-white/80">{meta.hint}</span>
          </div>
          {/* Wooden plank shelf, token-driven warm tones. */}
          <div
            className="rounded-kid-card border-b-8 p-4 pt-5 shadow-[0_18px_36px_rgba(23,50,79,0.35)]"
            style={{
              background:
                'repeating-linear-gradient(180deg, var(--color-kid-sun-300) 0px, var(--color-kid-sun-300) 26px, rgba(23,50,79,0.08) 26px, rgba(23,50,79,0.08) 29px)',
              borderColor: 'var(--color-kid-sun-500)',
            }}
          >
            <div className="flex flex-wrap items-start justify-center gap-3">
              {trophies.map((t) => (
                <TrophyTile key={t.id} trophy={t} earned={earnedSet.has(t.id)} />
              ))}
            </div>
            {/* Shelf lip */}
            <div
              className="mt-4 h-3 rounded-full"
              style={{ background: 'var(--color-kid-sun-500)', opacity: 0.85 }}
            />
          </div>
        </section>
      ))}

      {celebrating.length > 0 && (
        <TrophyCelebration
          trophies={celebrating}
          onDone={() => {
            setCelebrating([]);
            onClearNewTrophies?.();
          }}
        />
      )}
    </div>
  );
}
