'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, type ReactNode } from 'react';
import type { SessionChild } from '@/lib/kid/types';
import type { AgeBand } from '@/lib/planner/types';
import { playSfx } from '@/lib/kid/audio';
import { GAME_ART } from './game-art';

/**
 * Game registry — Wave 10 hub restructure.
 *
 * Every Sky Park game is registered here exactly once: id, kid-facing title,
 * subtitle, button color, subject group, button art, and a render function.
 * Games load via next/dynamic so the map no longer ships all ~30 games in
 * one JS chunk. Track 1 keeps each game's default-export props API stable;
 * the render functions below are the only place that API is consumed.
 */

function GameLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="glass-kid px-8 py-6 text-center">
        <p className="font-display text-2xl font-black text-kid-ink-900">Loading your game…</p>
        <p className="mt-1 text-sm font-bold text-kid-ink-700">Packing the crayons</p>
      </div>
    </div>
  );
}

const MemoryCove = dynamic(() => import('./memory-cove'), { loading: GameLoading });
const DressUp = dynamic(() => import('./dress-up'), { loading: GameLoading });
const PatternParade = dynamic(() => import('./pattern-parade'), { loading: GameLoading });
const PuzzleReef = dynamic(() => import('./puzzle-reef'), { loading: GameLoading });
const TrophyShelf = dynamic(() => import('./trophy-shelf'), { loading: GameLoading });
const WordBuilder = dynamic(() => import('./word-builder'), { loading: GameLoading });
const NumberRun = dynamic(() => import('./number-run'), { loading: GameLoading });
const StoryCinema = dynamic(() => import('./story-cinema'), { loading: GameLoading });
const CreativeStudio = dynamic(() => import('./studio'), { loading: GameLoading });
const Bedtime = dynamic(() => import('./bedtime'), { loading: GameLoading });
const LetterLab = dynamic(() => import('./letter-lab'), { loading: GameLoading });
const WorldTour = dynamic(() => import('./world-tour'), { loading: GameLoading });
const RhythmStudio = dynamic(() => import('./rhythm-studio'), { loading: GameLoading });
const ScienceLab = dynamic(() => import('./science-lab'), { loading: GameLoading });
const CodingCove = dynamic(() => import('./coding-cove'), { loading: GameLoading });
const PhonicsFun = dynamic(() => import('./phonics-fun'), { loading: GameLoading });
const Encyclopedia = dynamic(() => import('./encyclopedia'), { loading: GameLoading });
const ClockTower = dynamic(() => import('./clock-tower'), { loading: GameLoading });
const CoinCove = dynamic(() => import('./coin-cove'), { loading: GameLoading });
const MovieStudio = dynamic(() => import('./movie-studio'), { loading: GameLoading });
const CharacterHomes = dynamic(() => import('./character-homes'), { loading: GameLoading });
const FeelingsTheater = dynamic(() => import('./feelings-theater'), { loading: GameLoading });
const ColorMixLab = dynamic(() => import('./color-mix-lab'), { loading: GameLoading });
const RhymeTime = dynamic(() => import('./rhyme-time'), { loading: GameLoading });
const PetPlayground = dynamic(() => import('./pet-playground'), { loading: GameLoading });
const FractionFair = dynamic(() => import('./fraction-fair'), { loading: GameLoading });
const AvatarStudio = dynamic(() => import('./avatar-studio'), { loading: GameLoading });
const SentenceStudio = dynamic(() => import('./sentence-studio'), { loading: GameLoading });
const MeasureMeadow = dynamic(() => import('./measure-meadow'), { loading: GameLoading });
const OppositesAttic = dynamic(() => import('./opposites-attic'), { loading: GameLoading });
const PetCompanion = dynamic(() => import('./pet-companion'), { loading: GameLoading });

export type GameColor = 'coral' | 'sky' | 'mint' | 'grape';
export type GameGroupId = 'reading' | 'numbers' | 'world' | 'create' | 'calm' | 'play' | 'mine';

export interface GameGroup {
  id: GameGroupId;
  label: string;
  tag: string;
}

export const GAME_GROUPS: GameGroup[] = [
  { id: 'reading', label: 'Reading Cove', tag: 'words and stories' },
  { id: 'numbers', label: 'Number Land', tag: 'counting and measuring' },
  { id: 'world', label: 'World & Science', tag: 'explore and discover' },
  { id: 'create', label: 'Music & Art', tag: 'make and create' },
  { id: 'calm', label: 'Cozy Corner', tag: 'rest and big feelings' },
  { id: 'play', label: 'Playground', tag: 'games and pets' },
  { id: 'mine', label: 'My Stuff', tag: 'dress up and trophies' },
];

export type RenderGame = (child: SessionChild, nickname: string, onExit: () => void) => ReactNode;

export interface GameEntry {
  id: string;
  title: string;
  sub: string;
  color: GameColor;
  group: GameGroupId;
  /** Key into GAME_ART (game-art.tsx). */
  art: string;
  render: RenderGame;
  /** Hidden entries are reachable programmatically but have no park button. */
  hidden?: boolean;
}

const byId = (childId: string, nickname: string, onExit: () => void, ageBand?: AgeBand) => ({
  childId,
  nickname,
  onExit,
  ageBand,
});

export const GAME_REGISTRY: GameEntry[] = [
  {
    id: 'words', title: 'Word Builder', sub: 'spell magic words', color: 'sky', group: 'reading', art: 'Words',
    render: (c, n, x) => <WordBuilder {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'writing', title: 'Letter Lab', sub: 'trace your ABCs', color: 'mint', group: 'reading', art: 'Writing',
    render: (c, n, x) => <LetterLab {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'phonics', title: 'Phonics Fun', sub: 'blend the sounds', color: 'coral', group: 'reading', art: 'Phonics',
    render: (c, n, x) => <PhonicsFun {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'sentences', title: 'Sentence Studio', sub: 'build super sentences', color: 'sky', group: 'reading', art: 'Sentences',
    render: (c, n, x) => <SentenceStudio {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'opposites', title: 'Opposites Attic', sub: 'words that are opposites', color: 'grape', group: 'reading', art: 'Opposites',
    render: (c, n, x) => <OppositesAttic {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'rhymes', title: 'Rhyme Time', sub: 'words that chime', color: 'coral', group: 'reading', art: 'Rhymes',
    render: (c, n, x) => <RhymeTime {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'numbers', title: 'Number Run', sub: 'race with math', color: 'mint', group: 'numbers', art: 'Numbers',
    render: (c, n, x) => <NumberRun {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'pattern', title: 'Pattern Parade', sub: 'finish the pattern', color: 'mint', group: 'numbers', art: 'Pattern',
    render: (c, n, x) => <PatternParade {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'time', title: 'Clock Tower', sub: 'tell the time', color: 'grape', group: 'numbers', art: 'Time',
    render: (c, n, x) => <ClockTower {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'money', title: 'Coin Cove', sub: 'count coins', color: 'mint', group: 'numbers', art: 'Money',
    render: (c, n, x) => <CoinCove {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'fractions', title: 'Fraction Fair', sub: 'halves, thirds, quarters', color: 'coral', group: 'numbers', art: 'Fractions',
    render: (c, n, x) => <FractionFair {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'measure', title: 'Measure Meadow', sub: 'longer, taller, heavier', color: 'mint', group: 'numbers', art: 'Measure',
    render: (c, n, x) => <MeasureMeadow {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'coding', title: 'Coding Cove', sub: 'guide Milo home', color: 'mint', group: 'numbers', art: 'Coding',
    render: (c, n, x) => <CodingCove {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'geography', title: 'World Tour', sub: 'explore with Atlas', color: 'coral', group: 'world', art: 'Geography',
    render: (c, n, x) => <WorldTour {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'science', title: 'Science Lab', sub: 'try experiments', color: 'sky', group: 'world', art: 'Science',
    render: (c, n, x) => <ScienceLab {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'encyclopedia', title: 'Animal Book', sub: 'collect critters', color: 'sky', group: 'world', art: 'Encyclopedia',
    render: (c, n, x) => <Encyclopedia childId={c.id} onExit={x} />,
  },
  {
    id: 'colors', title: 'Color Mix Lab', sub: 'mix magic colors', color: 'grape', group: 'world', art: 'Colors',
    render: (c, n, x) => <ColorMixLab {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'rhythm', title: 'Rhythm Studio', sub: 'tap the beat', color: 'grape', group: 'create', art: 'Rhythm',
    render: (c, n, x) => <RhythmStudio {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'studio', title: 'Creative Studio', sub: 'draw and color', color: 'grape', group: 'create', art: 'Studio',
    render: (c, n, x) => <CreativeStudio {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'movies', title: 'Movie Studio', sub: 'direct cartoons', color: 'coral', group: 'create', art: 'Movies',
    render: (c, n, x) => <MovieStudio {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'cinema', title: 'Story Cinema', sub: 'watch cartoons', color: 'coral', group: 'create', art: 'Cinema',
    render: (c, n, x) => <StoryCinema childId={c.id} onExit={x} />,
  },
  {
    id: 'bedtime', title: 'Bedtime', sub: 'wind down', color: 'sky', group: 'calm', art: 'Bedtime',
    render: (c, n, x) => <Bedtime {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'feelings', title: 'Feelings Theater', sub: 'name big feelings', color: 'mint', group: 'calm', art: 'Feelings',
    render: (c, n, x) => <FeelingsTheater {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'memory', title: 'Memory Cove', sub: 'a matching game', color: 'grape', group: 'play', art: 'Memory',
    render: (c, _n, x) => <MemoryCove child={c} onExit={x} />,
  },
  {
    id: 'puzzle', title: 'Puzzle Reef', sub: 'build the picture', color: 'sky', group: 'play', art: 'Puzzle',
    render: (c, n, x) => <PuzzleReef {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'homes', title: 'Character Homes', sub: 'visit friends', color: 'sky', group: 'play', art: 'Homes',
    render: (c, n, x) => <CharacterHomes {...byId(c.id, n, x, c.ageBand)} />,
  },
  {
    id: 'playground', title: 'Pet Playground', sub: 'play with your pet', color: 'sky', group: 'play', art: 'Playground',
    render: (c, _n, x) => <PetPlayground childId={c.id} onExit={x} />,
  },
  {
    id: 'dressup', title: 'Dress Up', sub: 'spend your stars', color: 'coral', group: 'mine', art: 'DressUp',
    render: (c, _n, x) => <DressUp child={c} onExit={x} />,
  },
  {
    id: 'avatar', title: 'My Look', sub: 'design your avatar', color: 'grape', group: 'mine', art: 'AvatarStudio',
    render: (c, _n, x) => <AvatarStudio childId={c.id} onExit={x} />,
  },
  {
    id: 'trophies', title: 'Trophies', sub: 'my trophy shelf', color: 'grape', group: 'mine', art: 'Trophies',
    render: (c, _n, x) => (
      <>
        <div className="flex justify-start p-4">
          <button
            type="button"
            onClick={() => {
              playSfx('whoosh');
              x();
            }}
            className="rounded-full border-b-4 border-kid-ink-700 bg-white px-6 py-3 text-lg font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Back to the map"
          >
            ← Back
          </button>
        </div>
        <TrophyShelf childId={c.id} />
      </>
    ),
  },
  {
    id: 'pet', title: 'Pet Companion', sub: 'your pet friend', color: 'sky', group: 'play', art: 'Memory', hidden: true,
    render: (c, _n, x) => <PetCompanion child={c} onExit={x} />,
  },
];

export const VISIBLE_GAMES = GAME_REGISTRY.filter((g) => !g.hidden);

export function getGame(id: string | null): GameEntry | undefined {
  if (!id) return undefined;
  return GAME_REGISTRY.find((g) => g.id === id);
}

export function gamesForGroup(group: GameGroupId): GameEntry[] {
  return VISIBLE_GAMES.filter((g) => g.group === group);
}

/** The button art for a registry entry (decorative; buttons carry labels). */
export function GameArt({ entry }: { entry: GameEntry }) {
  const Art = GAME_ART[entry.art];
  if (!Art) return null;
  return <Art />;
}

/** A single Sky Park game button — keeps the Wave 8/9 contract button styling. */
export function GameCard({ entry, onOpen }: { entry: GameEntry; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        playSfx('pop');
        onOpen(entry.id);
      }}
      className={`btn-kid btn-kid-${entry.color} group`}
      aria-label={`${entry.title} — ${entry.sub}`}
    >
      <GameArt entry={entry} />
      <span className="font-display text-lg font-black leading-tight md:text-xl">{entry.title}</span>
      <span className="text-xs font-bold opacity-90">{entry.sub}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Today's picks — deterministic daily rotation so the park always has a fresh
// 1-tap doorway. Pure + seeded; exported pickers are unit-testable.
// ---------------------------------------------------------------------------

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Three game picks for a calendar date — deterministic, spread across groups. */
export function picksForDate(year: number, month: number, day: number): GameEntry[] {
  const rng = mulberry32(hashSeed(`${year}-${month}-${day}`));
  const pool = [...VISIBLE_GAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picks: GameEntry[] = [];
  for (const e of pool) {
    if (picks.length >= 3) break;
    if (!picks.some((p) => p.group === e.group)) picks.push(e);
  }
  for (const e of pool) {
    if (picks.length >= 3) break;
    if (!picks.includes(e)) picks.push(e);
  }
  return picks;
}

/** Today's picks for the device-local date. */
export function todaysPicks(now: Date = new Date()): GameEntry[] {
  return picksForDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// ---------------------------------------------------------------------------
// GameOverlay — the single generic overlay renderer for every registry game.
// Transparent to the KidShell SkyBackdrop (no opaque gradient cover), with
// focus management: focus moves into the overlay on open (first heading or
// button), Escape closes, and focus is restored to the opener on close.
// ---------------------------------------------------------------------------

export function useGameOverlayFocus(open: boolean, onClose: () => void) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    restoreRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const el = overlayRef.current;
    const timer = window.setTimeout(() => {
      const target = el?.querySelector<HTMLElement>('[data-autofocus], h1, h2, button');
      if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
      else el?.focus({ preventScroll: true });
    }, 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [open ]);

  return overlayRef;
}

export function GameOverlay({
  entry,
  child,
  nickname,
  onClose,
}: {
  entry: GameEntry;
  child: SessionChild;
  nickname: string;
  onClose: () => void;
}) {
  const overlayRef = useGameOverlayFocus(true, onClose);
  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={entry.title}
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto bg-kid-sky-200 outline-none"
    >
      {entry.render(child, nickname, onClose)}
    </div>
  );
}
