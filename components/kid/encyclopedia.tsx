'use client';

/**
 * Encyclopedia — "My Animal Book". Kids unlock animal entries by meeting
 * animals in Atlas World Tour; locked entries show as silhouettes with a
 * habitat hint. All animal art is original, data-driven SVG (no emoji).
 */

import { useCallback, useEffect, useState } from 'react';
import KidShell from '@/components/kid/kid-shell';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession } from './game-shell';
import { getCollection } from '@/app/actions/collections';
import {
  COLLECTION_ANIMALS,
  isCollectionComplete,
  type AnimalEntry,
} from '@/lib/kid/collections';
import { getContinent } from '@/lib/kid/geography';

/* ------------------------------------------------------------------ */
/* Data-driven critter art — one cute SVG renderer for all 24 animals. */
/* ------------------------------------------------------------------ */

type BodyShape = 'round' | 'tall' | 'wide' | 'long' | 'blob';
type EarKind = 'round' | 'pointy' | 'long' | 'tuft' | 'none';
type LegKind = 'two' | 'four' | 'flippers' | 'none';

interface CritterConfig {
  name: string;
  shape: BodyShape;
  body: string;
  belly?: string;
  ears: EarKind;
  earColor?: string;
  legs: LegKind;
  legColor?: string;
  extras: Array<
    | 'flippers'
    | 'tail'
    | 'bushy-tail'
    | 'patches'
    | 'stripes'
    | 'bee-stripes'
    | 'humps'
    | 'trunk'
    | 'beak'
    | 'shell'
    | 'wings'
    | 'big-wings'
    | 'tentacles'
    | 'mane'
    | 'fin'
    | 'fluke'
    | 'blowhole'
    | 'antennae'
    | 'spikes'
    | 'eye-bumps'
  >;
  extraColor?: string;
}

const SIL = '#22314B';

const CRITTERS: Record<string, CritterConfig> = {
  penguin: { name: 'Penguin', shape: 'tall', body: '#2D3A4A', belly: '#FFFFFF', ears: 'none', legs: 'two', legColor: '#F5A623', extras: ['flippers'] },
  kangaroo: { name: 'Kangaroo', shape: 'tall', body: '#C98A4B', belly: '#F2D8B3', ears: 'pointy', earColor: '#A96F36', legs: 'two', legColor: '#A96F36', extras: ['tail'] },
  koala: { name: 'Koala', shape: 'round', body: '#9AA3A8', belly: '#E8ECEC', ears: 'round', earColor: '#7E888D', legs: 'two', legColor: '#7E888D', extras: [] },
  panda: { name: 'Panda', shape: 'round', body: '#FFFFFF', ears: 'round', earColor: '#2D3A4A', legs: 'four', legColor: '#2D3A4A', extras: ['patches'] },
  tiger: { name: 'Tiger', shape: 'round', body: '#F5A623', belly: '#FDEBC8', ears: 'round', earColor: '#D98F16', legs: 'four', legColor: '#D98F16', extras: ['stripes'] },
  camel: { name: 'Camel', shape: 'tall', body: '#D9A05B', ears: 'round', earColor: '#B9833F', legs: 'four', legColor: '#B9833F', extras: ['humps'] },
  elephant: { name: 'Elephant', shape: 'wide', body: '#9AA3A8', ears: 'round', earColor: '#8A959B', legs: 'four', legColor: '#8A959B', extras: ['trunk'] },
  toucan: { name: 'Toucan', shape: 'round', body: '#2D3A4A', belly: '#FFFFFF', ears: 'none', legs: 'two', legColor: '#F5A623', extras: ['beak'] },
  llama: { name: 'Llama', shape: 'tall', body: '#F2E8D5', ears: 'pointy', earColor: '#D9CBB0', legs: 'four', legColor: '#D9CBB0', extras: [] },
  'polar-bear': { name: 'Polar Bear', shape: 'round', body: '#FFFFFF', ears: 'round', earColor: '#E4E9EC', legs: 'four', legColor: '#E4E9EC', extras: [] },
  fox: { name: 'Fox', shape: 'round', body: '#E8734A', belly: '#FDEBC8', ears: 'pointy', earColor: '#C85A34', legs: 'four', legColor: '#C85A34', extras: ['bushy-tail'] },
  dolphin: { name: 'Dolphin', shape: 'long', body: '#7FB3D5', belly: '#D6EAF8', ears: 'none', legs: 'none', extras: ['fin', 'fluke'] },
  owl: { name: 'Owl', shape: 'tall', body: '#8D6E63', belly: '#D7CCC8', ears: 'tuft', legs: 'two', legColor: '#F5A623', extras: [] },
  bee: { name: 'Bee', shape: 'round', body: '#FFC93C', ears: 'none', legs: 'none', extras: ['bee-stripes', 'wings', 'antennae'] },
  turtle: { name: 'Turtle', shape: 'wide', body: '#7CB342', ears: 'none', legs: 'four', legColor: '#5A8A2E', extras: ['shell'] },
  rabbit: { name: 'Rabbit', shape: 'tall', body: '#B0BEC5', ears: 'long', earColor: '#F4A9C4', legs: 'two', legColor: '#90A4AE', extras: [] },
  frog: { name: 'Frog', shape: 'round', body: '#66BB6A', belly: '#DCEDC8', ears: 'none', legs: 'four', legColor: '#4E9A52', extras: ['eye-bumps'] },
  whale: { name: 'Whale', shape: 'long', body: '#5B7FA6', belly: '#D6EAF8', ears: 'none', legs: 'none', extras: ['fluke', 'blowhole'] },
  butterfly: { name: 'Butterfly', shape: 'round', body: '#5C4A72', ears: 'none', legs: 'none', extras: ['big-wings', 'antennae'], extraColor: '#F4A9C4' },
  squirrel: { name: 'Squirrel', shape: 'round', body: '#C98A4B', belly: '#F2D8B3', ears: 'pointy', earColor: '#A96F36', legs: 'two', legColor: '#A96F36', extras: ['bushy-tail'] },
  hedgehog: { name: 'Hedgehog', shape: 'round', body: '#A1887F', belly: '#EFEBE9', ears: 'round', earColor: '#8D6E63', legs: 'four', legColor: '#8D6E63', extras: ['spikes'] },
  octopus: { name: 'Octopus', shape: 'blob', body: '#E88CA0', ears: 'none', legs: 'none', extras: ['tentacles'] },
  lion: { name: 'Lion', shape: 'round', body: '#E8A93C', belly: '#F9E2B8', ears: 'round', earColor: '#B97A1F', legs: 'four', legColor: '#B97A1F', extras: ['mane'] },
  zebra: { name: 'Zebra', shape: 'round', body: '#F5F5F5', ears: 'pointy', earColor: '#BDBDBD', legs: 'four', legColor: '#9E9E9E', extras: ['stripes'] },
};

interface BodyGeo {
  cx: number; cy: number; rx: number; ry: number;
  belly?: { cx: number; cy: number; rx: number; ry: number };
  eyes: Array<[number, number]>;
  ears: Array<[number, number]> | null;
  nose: [number, number];
}

const GEO: Record<BodyShape, BodyGeo> = {
  round: { cx: 32, cy: 37, rx: 15, ry: 14, belly: { cx: 32, cy: 41, rx: 9, ry: 8 }, eyes: [[26, 32], [38, 32]], ears: [[19, 22], [45, 22]], nose: [32, 38] },
  tall: { cx: 32, cy: 38, rx: 11, ry: 16, belly: { cx: 32, cy: 43, rx: 6.5, ry: 9 }, eyes: [[28, 31], [36, 31]], ears: [[23, 17], [41, 17]], nose: [32, 37] },
  wide: { cx: 32, cy: 39, rx: 18, ry: 11, belly: { cx: 32, cy: 42, rx: 11, ry: 6.5 }, eyes: [[25, 35], [39, 35]], ears: [[16, 27], [48, 27]], nose: [32, 40] },
  long: { cx: 32, cy: 41, rx: 20, ry: 8, belly: { cx: 32, cy: 44, rx: 12, ry: 4.5 }, eyes: [[22, 38], [30, 38]], ears: null, nose: [37, 41] },
  blob: { cx: 32, cy: 33, rx: 16, ry: 15, eyes: [[26, 29], [38, 29]], ears: null, nose: [32, 35] },
};

export function CritterArt({
  id,
  className,
  silhouette = false,
}: {
  id: string;
  className?: string;
  silhouette?: boolean;
}) {
  const cfg = CRITTERS[id];
  if (!cfg) return null;
  const g = GEO[cfg.shape];
  const C = (color: string) => (silhouette ? SIL : color);
  const legY = g.cy + g.ry - 3;
  const spikes = [-55, -35, -15, 5, 25, 45, 65];

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={silhouette ? 'Mystery animal' : cfg.name}>
      {/* behind-body extras */}
      {cfg.extras.includes('mane') && <circle cx="32" cy="34" r="20" fill={C('#B97A1F')} />}
      {cfg.extras.includes('shell') && <ellipse cx="32" cy="33" rx="17" ry="11" fill={C('#4E7A27')} />}
      {cfg.extras.includes('wings') && (
        <>
          <ellipse cx="21" cy="20" rx="6" ry="9" fill={C('#D6EAF8')} opacity={silhouette ? 1 : 0.85} />
          <ellipse cx="43" cy="20" rx="6" ry="9" fill={C('#D6EAF8')} opacity={silhouette ? 1 : 0.85} />
        </>
      )}
      {cfg.extras.includes('big-wings') && (
        <>
          <ellipse cx="17" cy="30" rx="10" ry="14" fill={C(cfg.extraColor ?? '#F4A9C4')} />
          <ellipse cx="47" cy="30" rx="10" ry="14" fill={C(cfg.extraColor ?? '#F4A9C4')} />
          {!silhouette && (
            <>
              <circle cx="14" cy="26" r="2.5" fill="#FFFFFF" opacity="0.7" />
              <circle cx="50" cy="34" r="2.5" fill="#FFFFFF" opacity="0.7" />
            </>
          )}
        </>
      )}
      {cfg.extras.includes('spikes') &&
        spikes.map((a) => {
          const rad = ((a - 90) * Math.PI) / 180;
          const x = 32 + Math.cos(rad) * 15;
          const y = 37 + Math.sin(rad) * 14;
          const tx = 32 + Math.cos(rad) * 21;
          const ty = 37 + Math.sin(rad) * 20;
          return <path key={a} d={`M${x - 3.5},${y + 2} L${tx},${ty} L${x + 3.5},${y + 2} Z`} fill={C('#5D4037')} />;
        })}
      {cfg.extras.includes('tail') && (
        <path d="M44 46 Q56 46 54 34" fill="none" stroke={C(cfg.body)} strokeWidth="7" strokeLinecap="round" />
      )}
      {cfg.extras.includes('bushy-tail') && (
        <path d="M45 44 Q58 42 55 28 Q52 22 46 26 Q42 30 44 38 Z" fill={C(cfg.body)} />
      )}
      {cfg.extras.includes('humps') && (
        <>
          <circle cx="27" cy="23" r="5" fill={C(cfg.body)} />
          <circle cx="37" cy="23" r="5" fill={C(cfg.body)} />
        </>
      )}
      {cfg.extras.includes('fin') && <path d="M28 35 L34 24 L39 35 Z" fill={C('#5B8FB9')} />}
      {cfg.extras.includes('fluke') && (
        <path d="M13 41 L3 33 L6 41 L3 49 Z" fill={C(cfg.body)} strokeLinejoin="round" />
      )}
      {cfg.extras.includes('tentacles') &&
        [20, 27, 37, 44].map((x) => (
          <path key={x} d={`M${x} 45 q-2 8 -5 9`} fill="none" stroke={C(cfg.body)} strokeWidth="5" strokeLinecap="round" />
        ))}

      {/* legs */}
      {cfg.legs === 'two' && (
        <>
          <rect x="24" y={legY - 1} width="6" height="9" rx="3" fill={C(cfg.legColor ?? cfg.body)} />
          <rect x="34" y={legY - 1} width="6" height="9" rx="3" fill={C(cfg.legColor ?? cfg.body)} />
        </>
      )}
      {cfg.legs === 'four' && (
        <>
          {[19, 27, 35, 43].map((x) => (
            <rect key={x} x={x} y={legY - 1} width="5" height="9" rx="2.5" fill={C(cfg.legColor ?? cfg.body)} />
          ))}
        </>
      )}
      {cfg.legs === 'flippers' && (
        <>
          <ellipse cx={g.cx - g.rx - 1} cy={g.cy + 3} rx="4" ry="8" fill={C(cfg.body)} />
          <ellipse cx={g.cx + g.rx + 1} cy={g.cy + 3} rx="4" ry="8" fill={C(cfg.body)} />
        </>
      )}
      {cfg.extras.includes('flippers') && (
        <>
          <ellipse cx={g.cx - g.rx - 1} cy={g.cy + 3} rx="4" ry="8" fill={C(cfg.body)} />
          <ellipse cx={g.cx + g.rx + 1} cy={g.cy + 3} rx="4" ry="8" fill={C(cfg.body)} />
        </>
      )}

      {/* body */}
      <ellipse cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry} fill={C(cfg.body)} />
      {cfg.belly && g.belly && !silhouette && (
        <ellipse cx={g.belly.cx} cy={g.belly.cy} rx={g.belly.rx} ry={g.belly.ry} fill={cfg.belly} opacity="0.95" />
      )}

      {/* body stripes */}
      {cfg.extras.includes('stripes') && !silhouette && (
        <>
          {[24, 32, 40].map((x) => (
            <line key={x} x1={x} y1={g.cy - g.ry + 3} x2={x} y2={g.cy - g.ry + 10} stroke="#5D4037" strokeWidth="3" strokeLinecap="round" />
          ))}
        </>
      )}
      {cfg.extras.includes('bee-stripes') && !silhouette && (
        <>
          <rect x={g.cx - g.rx + 2} y={g.cy - 4} width={(g.rx - 2) * 2} height="5" rx="2.5" fill="#5D4037" />
          <rect x={g.cx - g.rx + 4} y={g.cy + 5} width={(g.rx - 4) * 2} height="5" rx="2.5" fill="#5D4037" />
        </>
      )}

      {/* ears */}
      {g.ears && cfg.ears === 'round' &&
        g.ears.map(([x, y]) => <circle key={x} cx={x} cy={y} r="5.5" fill={C(cfg.earColor ?? cfg.body)} />)}
      {g.ears && cfg.ears === 'pointy' &&
        g.ears.map(([x, y]) => (
          <path key={x} d={`M${x - 5},${y + 4} L${x},${y - 7} L${x + 5},${y + 4} Z`} fill={C(cfg.earColor ?? cfg.body)} strokeLinejoin="round" />
        ))}
      {g.ears && cfg.ears === 'long' &&
        g.ears.map(([x, y]) => (
          <g key={x}>
            <ellipse cx={x} cy={y - 8} rx="3.5" ry="9" fill={C(cfg.body)} />
            {!silhouette && <ellipse cx={x} cy={y - 8} rx="1.6" ry="5.5" fill={cfg.earColor ?? '#F4A9C4'} />}
          </g>
        ))}
      {cfg.ears === 'tuft' && (
        <>
          <path d="M24 20 L27 12 L30 19 Z" fill={C(cfg.body)} strokeLinejoin="round" />
          <path d="M40 20 L37 12 L34 19 Z" fill={C(cfg.body)} strokeLinejoin="round" />
        </>
      )}

      {/* face extras */}
      {cfg.extras.includes('patches') && !silhouette && (
        <>
          <ellipse cx="26" cy="32" rx="4.5" ry="5.5" fill="#2D3A4A" transform="rotate(-15 26 32)" />
          <ellipse cx="38" cy="32" rx="4.5" ry="5.5" fill="#2D3A4A" transform="rotate(15 38 32)" />
        </>
      )}
      {cfg.extras.includes('beak') && (
        <ellipse cx="41" cy="36" rx="8" ry="5.5" fill={C('#F5A623')} />
      )}
      {cfg.extras.includes('trunk') && (
        <path d="M30 40 q-1 9 -8 11" fill="none" stroke={C(cfg.body)} strokeWidth="6" strokeLinecap="round" />
      )}
      {cfg.extras.includes('blowhole') && !silhouette && (
        <>
          <circle cx="32" cy={g.cy - g.ry - 4} r="2" fill="#7FB3D5" />
          <circle cx="28" cy={g.cy - g.ry - 9} r="1.6" fill="#7FB3D5" />
          <circle cx="36" cy={g.cy - g.ry - 10} r="1.6" fill="#7FB3D5" />
        </>
      )}
      {cfg.extras.includes('antennae') && (
        <>
          <line x1="28" y1={g.cy - g.ry + 2} x2="24" y2={g.cy - g.ry - 6} stroke={C(cfg.body)} strokeWidth="2" strokeLinecap="round" />
          <line x1="36" y1={g.cy - g.ry + 2} x2="40" y2={g.cy - g.ry - 6} stroke={C(cfg.body)} strokeWidth="2" strokeLinecap="round" />
          {!silhouette && (
            <>
              <circle cx="24" cy={g.cy - g.ry - 6} r="1.8" fill="#5D4037" />
              <circle cx="40" cy={g.cy - g.ry - 6} r="1.8" fill="#5D4037" />
            </>
          )}
        </>
      )}
      {cfg.extras.includes('eye-bumps') && (
        <>
          <circle cx="25" cy="22" r="4.5" fill={C(cfg.body)} />
          <circle cx="39" cy="22" r="4.5" fill={C(cfg.body)} />
        </>
      )}

      {/* face */}
      {!silhouette && (
        <>
          {cfg.extras.includes('eye-bumps') ? (
            <>
              <circle cx="25" cy="21" r="2.6" fill="#FFFFFF" />
              <circle cx="25" cy="21" r="1.4" fill="#17324F" />
              <circle cx="39" cy="21" r="2.6" fill="#FFFFFF" />
              <circle cx="39" cy="21" r="1.4" fill="#17324F" />
            </>
          ) : (
            g.eyes.map(([x, y]) => (
              <g key={x}>
                <circle cx={x} cy={y} r="4" fill="#FFFFFF" />
                <circle cx={x} cy={y} r="2" fill="#17324F" />
              </g>
            ))
          )}
          <ellipse cx={g.nose[0]} cy={g.nose[1]} rx="2.2" ry="1.7" fill="#5D4037" opacity="0.85" />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Encyclopedia component                                              */
/* ------------------------------------------------------------------ */

export interface EncyclopediaProps {
  childId: string;
  onExit: () => void;
}

export default function Encyclopedia({ childId, onExit }: EncyclopediaProps) {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    let alive = true;
    getCollection(childId, 'animals')
      .then((ids) => {
        if (alive) setUnlocked(ids);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      stopSpeaking();
    };
  }, [childId]);

  // Book-complete celebration (fires once per mount when already complete).
  const session = useGameSession({
    childId,
    stickerId: 'curious-collector',
    trophyEvent: 'collection_done',
  });
  useEffect(() => {
    if (loading || celebrated) return;
    if (!isCollectionComplete('animals', unlocked)) return;
    setCelebrated(true);
    playSfx('fanfare');
    speakAs('curio', 'Wow! Your animal book is full! You found every single animal. You are a true explorer!');
    void session.complete({ stars: 0 });
  }, [loading, unlocked, celebrated, childId, session]);

  const hearFact = useCallback((animal: AnimalEntry) => {
    playSfx('pop');
    speakAs('curio', `${animal.name}. ${animal.fact}`);
  }, []);

  const selected: AnimalEntry | undefined = selectedId
    ? COLLECTION_ANIMALS.find((a) => a.id === selectedId)
    : undefined;
  const selectedUnlocked = selected ? unlocked.includes(selected.id) : false;
  const found = COLLECTION_ANIMALS.filter((a) => unlocked.includes(a.id)).length;

  return (
    <KidShell onExit={onExit}>
      <div className="w-full max-w-3xl">
        <h1 className="animate-kid-rise text-center text-3xl font-black text-kid-ink-900 md:text-5xl">
          My Animal Book
        </h1>
        <p className="animate-kid-rise mt-2 text-center text-lg font-bold text-kid-ink-700" style={{ animationDelay: '0.1s' }}>
          Meet animals in Atlas World Tour to fill your book!
        </p>

        <div
          className="animate-kid-rise mx-auto mt-4 max-w-md"
          style={{ animationDelay: '0.15s' }}
          role="status"
          aria-label={`${found} of ${COLLECTION_ANIMALS.length} animals found`}
        >
          <div className="flex items-center justify-between text-base font-black text-kid-ink-900">
            <span>{found} / {COLLECTION_ANIMALS.length} found</span>
            <span>{Math.round((found / COLLECTION_ANIMALS.length) * 100)}%</span>
          </div>
          <div className="mt-1 h-4 overflow-hidden rounded-full bg-white/70 shadow-inner">
            <div
              className="h-full rounded-full bg-kid-sun-400 transition-all duration-700"
              style={{ width: `${(found / COLLECTION_ANIMALS.length) * 100}%` }}
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3" aria-label="Loading your animal book">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="kid-skeleton aspect-square rounded-kid-card" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3" role="list" aria-label="Animals">
            {COLLECTION_ANIMALS.map((animal, i) => {
              const isOpen = unlocked.includes(animal.id);
              return (
                <button
                  key={animal.id}
                  type="button"
                  role="listitem"
                  onClick={() => {
                    playSfx('click');
                    setSelectedId(animal.id);
                  }}
                  aria-label={isOpen ? animal.name : `Mystery animal. Hint: lives in ${animal.habitat}`}
                  className="animate-kid-rise flex aspect-square flex-col items-center justify-center gap-1 rounded-kid-card bg-white/90 p-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ animationDelay: `${0.05 + Math.min(i, 12) * 0.04}s` }}
                >
                  <CritterArt
                    id={animal.id}
                    silhouette={!isOpen}
                    className="h-3/5 w-3/5"
                  />
                  {isOpen ? (
                    <span className="text-sm font-black text-kid-ink-900 md:text-base">{animal.name}</span>
                  ) : (
                    <span className="px-1 text-center text-xs font-bold leading-tight text-kid-ink-700">
                      <span className="block text-base font-black text-kid-ink-900">?</span>
                      Lives in {animal.habitat}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-kid-ink-900/40 p-4"
          onClick={() => setSelectedId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedUnlocked ? selected.name : 'Mystery animal'}
        >
          <div
            className="animate-kid-pop-in w-full max-w-sm rounded-kid-card bg-white px-6 py-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CritterArt id={selected.id} silhouette={!selectedUnlocked} className="mx-auto h-32 w-32" />
            <h2 className="mt-2 text-2xl font-black text-kid-ink-900">
              {selectedUnlocked ? selected.name : '???'}
            </h2>
            {selectedUnlocked ? (
              <>
                <p className="mt-2 text-base font-bold text-kid-ink-700">{selected.fact}</p>
                <p className="mt-2 text-sm font-bold text-kid-ink-700">
                  Home: {selected.habitat}
                  {getContinent(selected.continentId) ? ` · ${getContinent(selected.continentId)!.name}` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => hearFact(selected)}
                  className="mt-4 rounded-full bg-kid-sky-400 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Hear the fact
                </button>
              </>
            ) : (
              <p className="mt-2 text-base font-bold text-kid-ink-700">
                A mystery friend! It lives in {selected.habitat}. Play Atlas World Tour to meet it.
              </p>
            )}
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mt-4 block w-full rounded-full bg-kid-ink-900/10 px-6 py-2 text-base font-extrabold text-kid-ink-900 transition-transform active:scale-95"
            >
              Back to my book
            </button>
          </div>
        </div>
      )}
    </KidShell>
  );
}
