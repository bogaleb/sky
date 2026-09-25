'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EXPERIMENTS,
  LAB_SESSION_SIZE,
  PAINT_HEX,
  blendHex,
  type PaintColor,
  type ScienceExperiment,
  type ScienceOption,
  type ScienceTrial,
} from '@/lib/kid/science';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen } from './game-shell';
import KidShell from '@/components/kid/kid-shell';
import HostCharacter from '@/components/kid/host-character';

const HOST = 'bea';

export interface ScienceLabProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

/* ------------------------------------------------------------------ */
/* Simple original SVG art for every material, object, and concept.    */
/* ------------------------------------------------------------------ */

function ScienceArt({ art, className }: { art: string; className?: string }) {
  const cls = className ?? 'h-16 w-16';
  const svg = (inner: React.ReactNode, label: string) => (
    <svg viewBox="0 0 64 64" className={cls} role="img" aria-label={label}>
      {inner}
    </svg>
  );
  switch (art) {
    case 'tank':
      return svg(
        <>
          <rect x="8" y="10" width="48" height="46" rx="6" fill="#D6ECF7" stroke="#8FB8D8" strokeWidth="3" />
          <rect x="11" y="24" width="42" height="29" rx="4" fill="#4FB3E8" opacity="0.85" />
          <path d="M11 24 q6 -4 12 0 t12 0 t12 0 t6 0 v-2 h-42 z" fill="#7CCBF2" />
        </>,
        'water tank'
      );
    case 'apple':
      return svg(
        <>
          <circle cx="32" cy="36" r="18" fill="#EF4444" />
          <rect x="30" y="12" width="4" height="10" rx="2" fill="#7D5F3E" />
          <ellipse cx="42" cy="18" rx="9" ry="5" fill="#4E9E5B" transform="rotate(-20 42 18)" />
          <ellipse cx="26" cy="30" rx="5" ry="8" fill="#FCA5A5" opacity="0.7" />
        </>,
        'apple'
      );
    case 'rock':
      return svg(
        <path d="M12 44 L18 24 L36 16 L52 30 L48 46 L26 50 Z" fill="#9AA5B1" stroke="#6B7280" strokeWidth="3" strokeLinejoin="round" />,
        'rock'
      );
    case 'leaf':
      return svg(
        <>
          <path d="M32 6 C50 14 54 38 32 58 C10 38 14 14 32 6 Z" fill="#4E9E5B" />
          <line x1="32" y1="10" x2="32" y2="54" stroke="#2F6B3A" strokeWidth="3" />
        </>,
        'leaf'
      );
    case 'spoon':
      return svg(
        <>
          <ellipse cx="32" cy="20" rx="10" ry="13" fill="#C7D0D9" stroke="#8A94A0" strokeWidth="3" />
          <rect x="29" y="30" width="6" height="26" rx="3" fill="#9AA5B1" />
        </>,
        'spoon'
      );
    case 'cork':
      return svg(
        <>
          <rect x="22" y="14" width="20" height="36" rx="8" fill="#D9A866" stroke="#A9763A" strokeWidth="3" />
          <line x1="22" y1="26" x2="42" y2="26" stroke="#A9763A" strokeWidth="2.5" />
          <line x1="22" y1="38" x2="42" y2="38" stroke="#A9763A" strokeWidth="2.5" />
        </>,
        'cork'
      );
    case 'key':
      return svg(
        <>
          <circle cx="20" cy="20" r="10" fill="none" stroke="#E0A93C" strokeWidth="6" />
          <rect x="28" y="26" width="6" height="26" rx="3" fill="#E0A93C" transform="rotate(35 31 39)" />
          <rect x="40" y="44" width="10" height="5" rx="2" fill="#E0A93C" transform="rotate(35 45 46)" />
        </>,
        'key'
      );
    case 'float':
      return svg(
        <>
          <circle cx="32" cy="32" r="22" fill="#4FB3E8" />
          <path d="M32 46 V20 M22 30 L32 18 L42 30" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>,
        'floats up'
      );
    case 'sink':
      return svg(
        <>
          <circle cx="32" cy="32" r="22" fill="#4FB3E8" />
          <path d="M32 18 V44 M22 34 L32 46 L42 34" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </>,
        'sinks down'
      );
    case 'seed':
      return svg(<ellipse cx="32" cy="34" rx="12" ry="16" fill="#A9763A" stroke="#7D5F3E" strokeWidth="3" />, 'seed');
    case 'sprout':
      return svg(
        <>
          <ellipse cx="32" cy="52" rx="22" ry="8" fill="#8A5A33" />
          <path d="M32 52 C32 40 30 34 28 28" fill="none" stroke="#3E8E4E" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="22" cy="30" rx="8" ry="5" fill="#5FB56D" transform="rotate(-25 22 30)" />
          <ellipse cx="42" cy="26" rx="8" ry="5" fill="#5FB56D" transform="rotate(25 42 26)" />
        </>,
        'sprout'
      );
    case 'seedling':
      return svg(
        <>
          <ellipse cx="32" cy="54" rx="22" ry="8" fill="#8A5A33" />
          <path d="M32 54 C32 40 32 30 32 20" fill="none" stroke="#3E8E4E" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="20" cy="36" rx="10" ry="6" fill="#5FB56D" transform="rotate(-20 20 36)" />
          <ellipse cx="44" cy="32" rx="10" ry="6" fill="#5FB56D" transform="rotate(20 44 32)" />
          <ellipse cx="22" cy="22" rx="8" ry="5" fill="#7ED6A5" transform="rotate(-30 22 22)" />
        </>,
        'seedling'
      );
    case 'plant':
      return svg(
        <>
          <ellipse cx="32" cy="54" rx="22" ry="8" fill="#8A5A33" />
          <path d="M32 54 C31 40 33 30 32 18" fill="none" stroke="#3E8E4E" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="18" cy="38" rx="10" ry="6" fill="#5FB56D" transform="rotate(-20 18 38)" />
          <ellipse cx="46" cy="34" rx="10" ry="6" fill="#5FB56D" transform="rotate(20 46 34)" />
          <circle cx="32" cy="12" r="7" fill="#FF8FB1" />
          <circle cx="25" cy="12" r="5" fill="#FFB3C9" />
          <circle cx="39" cy="12" r="5" fill="#FFB3C9" />
          <ellipse cx="46" cy="46" rx="4" ry="8" fill="#8FD6A0" transform="rotate(30 46 46)" />
        </>,
        'bean plant'
      );
    case 'soil':
      return svg(<ellipse cx="32" cy="40" rx="24" ry="14" fill="#8A5A33" />, 'soil');
    case 'sun':
      return svg(
        <>
          <circle cx="32" cy="32" r="14" fill="#FFD93C" stroke="#E0A93C" strokeWidth="3" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            const x1 = 32 + Math.cos(a) * 19;
            const y1 = 32 + Math.sin(a) * 19;
            const x2 = 32 + Math.cos(a) * 27;
            const y2 = 32 + Math.sin(a) * 27;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E0A93C" strokeWidth="4" strokeLinecap="round" />;
          })}
        </>,
        'sun'
      );
    case 'shade':
      return svg(
        <>
          <rect x="28" y="34" width="8" height="20" rx="3" fill="#7D5F3E" />
          <circle cx="32" cy="24" r="16" fill="#4E9E5B" />
          <circle cx="20" cy="30" r="10" fill="#5FB56D" />
          <circle cx="44" cy="30" r="10" fill="#5FB56D" />
          <ellipse cx="32" cy="56" rx="26" ry="5" fill="#8FD6A0" />
        </>,
        'shady tree'
      );
    case 'hands':
      return svg(
        <>
          <rect x="10" y="24" width="18" height="26" rx="9" fill="#F2B27A" />
          <rect x="36" y="24" width="18" height="26" rx="9" fill="#F2B27A" />
          <circle cx="19" cy="20" r="6" fill="#F2B27A" />
          <circle cx="45" cy="20" r="6" fill="#F2B27A" />
        </>,
        'warm hands'
      );
    case 'ice':
      return svg(
        <>
          <rect x="16" y="16" width="32" height="32" rx="8" fill="#BEE3F8" stroke="#7CCBF2" strokeWidth="3" />
          <path d="M24 24 L32 40" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
        </>,
        'ice cube'
      );
    case 'magnet':
      return svg(
        <>
          <path d="M16 10 v22 a16 16 0 0 0 32 0 V10" fill="none" stroke="#EF4444" strokeWidth="12" />
          <path d="M16 10 v22 a16 16 0 0 0 32 0 V10" fill="none" stroke="#fff" strokeWidth="12" strokeDasharray="0" opacity="0" />
          <rect x="10" y="8" width="12" height="10" fill="#E5E7EB" />
          <rect x="42" y="8" width="12" height="10" fill="#E5E7EB" />
        </>,
        'magnet'
      );
    case 'paperclip':
      return svg(
        <path d="M22 44 V24 a8 8 0 0 1 16 0 V40 a6 6 0 0 1 -12 0 V26" fill="none" stroke="#9AA5B1" strokeWidth="5" strokeLinecap="round" />,
        'paperclip'
      );
    case 'nail':
      return svg(
        <>
          <rect x="28" y="10" width="8" height="40" rx="4" fill="#9AA5B1" />
          <ellipse cx="32" cy="12" rx="10" ry="5" fill="#6B7280" />
          <path d="M28 50 L36 50 L32 58 Z" fill="#6B7280" />
        </>,
        'nail'
      );
    case 'woodblock':
      return svg(
        <>
          <rect x="12" y="20" width="40" height="32" rx="4" fill="#C08A4E" stroke="#8A5A33" strokeWidth="3" />
          <path d="M12 24 L32 12 L52 24" fill="#D9A866" stroke="#8A5A33" strokeWidth="3" strokeLinejoin="round" />
        </>,
        'wooden block'
      );
    case 'button':
      return svg(
        <>
          <circle cx="32" cy="32" r="18" fill="#A855F7" stroke="#7C3AED" strokeWidth="3" />
          <circle cx="26" cy="26" r="3" fill="#fff" />
          <circle cx="38" cy="26" r="3" fill="#fff" />
          <circle cx="26" cy="38" r="3" fill="#fff" />
          <circle cx="38" cy="38" r="3" fill="#fff" />
        </>,
        'plastic button'
      );
    case 'foil':
      return svg(
        <path d="M14 16 L40 12 L52 30 L44 52 L16 48 L10 30 Z" fill="#D7DEE6" stroke="#9AA5B1" strokeWidth="3" strokeLinejoin="round" />,
        'foil'
      );
    case 'coin':
      return svg(
        <>
          <circle cx="32" cy="32" r="18" fill="#FFD93C" stroke="#E0A93C" strokeWidth="3" />
          <path d="M32 22 l3 6 6.5.8 -4.8 4.4 1.3 6.4 -6 -3.2 -6 3.2 1.3 -6.4 -4.8 -4.4 6.5 -.8 z" fill="#E0A93C" />
        </>,
        'coin'
      );
    case 'magnet-grab':
      return svg(
        <>
          <path d="M16 10 v22 a16 16 0 0 0 32 0 V10" fill="none" stroke="#EF4444" strokeWidth="12" />
          <rect x="10" y="8" width="12" height="10" fill="#E5E7EB" />
          <rect x="42" y="8" width="12" height="10" fill="#E5E7EB" />
          <path d="M50 44 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" fill="#22C55E" transform="translate(-38 -30) scale(0.7)" />
        </>,
        'magnet grabs'
      );
    case 'magnet-miss':
      return svg(
        <>
          <path d="M16 10 v22 a16 16 0 0 0 32 0 V10" fill="none" stroke="#9AA5B1" strokeWidth="12" />
          <rect x="10" y="8" width="12" height="10" fill="#E5E7EB" />
          <rect x="42" y="8" width="12" height="10" fill="#E5E7EB" />
          <path d="M46 44 L58 56 M58 44 L46 56" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
        </>,
        'magnet cannot grab'
      );
    case 'day':
      return svg(
        <>
          <circle cx="32" cy="32" r="14" fill="#FFD93C" stroke="#E0A93C" strokeWidth="3" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={32 + Math.cos(a) * 19}
                y1={32 + Math.sin(a) * 19}
                x2={32 + Math.cos(a) * 26}
                y2={32 + Math.sin(a) * 26}
                stroke="#E0A93C"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}
        </>,
        'daytime'
      );
    case 'night':
      return svg(
        <>
          <path d="M40 8 a22 22 0 1 0 12 36 A24 24 0 0 1 40 8 z" fill="#FFE66D" />
          <path d="M46 12 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 z" fill="#fff" />
        </>,
        'nighttime'
      );
    case 'earth':
      return svg(
        <>
          <circle cx="32" cy="32" r="22" fill="#4FB3E8" />
          <path d="M18 26 q8 -8 16 -2 q-4 10 -14 8 q-6 -2 -2 -6 z" fill="#5FB56D" />
          <path d="M36 40 q10 -4 12 4 q-6 8 -14 4 q-2 -4 2 -8 z" fill="#5FB56D" />
        </>,
        'Earth'
      );
    case 'house':
      return svg(
        <>
          <path d="M32 10 L52 28 H46 V50 H18 V28 H12 Z" fill="#FF8C42" stroke="#C05E1E" strokeWidth="3" strokeLinejoin="round" />
          <rect x="28" y="36" width="9" height="14" rx="2" fill="#7D4A1E" />
        </>,
        'little house'
      );
    default:
      if (art.startsWith('paint-')) {
        const color = art.slice(6) as PaintColor;
        const hex = PAINT_HEX[color] ?? '#9AA5B1';
        return svg(
          <>
            <path d="M32 8 C46 20 52 34 50 44 a18 14 0 1 1 -36 0 C12 34 18 20 32 8 Z" fill={hex} />
            <ellipse cx="25" cy="32" rx="5" ry="9" fill="#fff" opacity="0.45" />
          </>,
          `${color} paint`
        );
      }
      return svg(<circle cx="32" cy="32" r="18" fill="#C7D0D9" />, art);
  }
}

function shuffle<T>(items: T[], seedStr: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ------------------------------------------------------------------ */
/* Animated results: the correct outcome, physically true, every time. */
/* ------------------------------------------------------------------ */

function SinkFloatReveal({ objectArt, floats }: { objectArt?: string; floats: boolean }) {
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLanded(true), 60);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="relative mx-auto h-72 w-64" aria-hidden>
      <ScienceArt art="tank" className="absolute inset-x-0 bottom-0 h-64 w-64" />
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: landed ? (floats ? '38%' : '76%') : '-16%',
          transition: 'top 1.4s cubic-bezier(.3,.6,.4,1)',
        }}
      >
        <div className={landed && floats ? 'animate-kid-bob' : undefined}>
          <ScienceArt art={objectArt ?? 'rock'} className="h-20 w-20" />
        </div>
      </div>
      {landed && (
        <div className="animate-kid-pop-in absolute inset-x-0 bottom-2 text-center">
          <span
            className={`inline-block rounded-full px-5 py-2 text-lg font-black ${
              floats ? 'bg-kid-sky-400 text-white' : 'bg-kid-ink-700 text-white'
            }`}
          >
            {floats ? 'It floats!' : 'It sinks!'}
          </span>
        </div>
      )}
    </div>
  );
}

function ColorMixReveal({ a, b, result }: { a: PaintColor; b: PaintColor; result: PaintColor }) {
  const [mixed, setMixed] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMixed(true), 900);
    return () => window.clearTimeout(t);
  }, []);
  const aHex = PAINT_HEX[a];
  const bHex = PAINT_HEX[b];
  return (
    <div className="relative mx-auto flex h-64 w-full max-w-md items-center justify-center" aria-hidden>
      <div
        className="absolute"
        style={{
          transform: mixed ? 'translateX(-22px) scale(0.9)' : 'translateX(-70px)',
          transition: 'transform 0.9s ease',
          opacity: mixed ? 0.55 : 1,
        }}
      >
        <ScienceArt art={`paint-${a}`} className="h-24 w-24" />
      </div>
      <div
        className="absolute"
        style={{
          transform: mixed ? 'translateX(22px) scale(0.9)' : 'translateX(70px)',
          transition: 'transform 0.9s ease',
          opacity: mixed ? 0.55 : 1,
        }}
      >
        <ScienceArt art={`paint-${b}`} className="h-24 w-24" />
      </div>
      {mixed && (
        <div className="animate-kid-pop-in absolute z-10">
          <svg viewBox="0 0 64 64" className="h-32 w-32" role="img" aria-label={`${result} paint result`}>
            <path
              d="M32 8 C46 20 52 34 50 44 a18 14 0 1 1 -36 0 C12 34 18 20 32 8 Z"
              fill={PAINT_HEX[result]}
              style={{ transition: 'fill 0.6s ease' }}
            />
            <ellipse cx="25" cy="32" rx="5" ry="9" fill="#fff" opacity="0.45" />
          </svg>
          <p className="mt-1 text-center text-2xl font-black text-kid-ink-900">
            {result.charAt(0).toUpperCase() + result.slice(1)}!
          </p>
        </div>
      )}
      <span className="sr-only">
        {a} and {b} blend from {blendHex(aHex, bHex)} into {result}
      </span>
    </div>
  );
}

function StagesReveal({ experiment }: { experiment: ScienceExperiment }) {
  const stages = experiment.stages ?? [];
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const timers: number[] = [];
    stages.forEach((_, i) => {
      timers.push(window.setTimeout(() => setShown(i + 1), 700 * (i + 1)));
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiment.id]);
  return (
    <div className="mx-auto flex min-h-64 w-full max-w-2xl flex-wrap items-end justify-center gap-4" aria-hidden>
      {stages.slice(0, shown).map((s, i) => (
        <div key={s.id} className="animate-kid-pop-in flex flex-col items-center" style={{ animationDelay: `${i * 0.05}s` }}>
          <div style={{ transform: `scale(${0.85 + i * 0.12})`, transformOrigin: 'bottom center' }}>
            <ScienceArt art={s.art} className="h-24 w-24" />
          </div>
          <span className="mt-1 rounded-full bg-white/90 px-3 py-1 text-sm font-black text-kid-ink-900">{s.label}</span>
          {i === shown - 1 && shown > 0 && (
            <span className="mt-1 max-w-40 text-center text-sm font-bold text-kid-ink-700">{s.caption}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function MeltReveal() {
  const [melted, setMelted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMelted(true), 500);
    return () => window.clearTimeout(t);
  }, []);
  const station = (art: string, label: string, meltTo: number, winner: boolean) => (
    <div className="flex flex-col items-center gap-2">
      <ScienceArt art={art} className="h-16 w-16" />
      <div className="flex h-24 items-end justify-center">
        <div
          style={{
            transform: melted ? `scale(${meltTo})` : 'scale(1)',
            opacity: melted && meltTo < 0.4 ? 0.35 : 1,
            transition: 'transform 2.2s ease, opacity 2.2s ease',
            transformOrigin: 'bottom center',
          }}
        >
          <ScienceArt art="ice" className="h-20 w-20" />
        </div>
      </div>
      {melted && meltTo < 0.4 && (
        <svg viewBox="0 0 64 20" className="animate-kid-pop-in -mt-4 h-5 w-16" aria-hidden>
          <ellipse cx="32" cy="10" rx="28" ry="8" fill="#7CCBF2" />
        </svg>
      )}
      <span className={`rounded-full px-4 py-1 text-base font-black ${winner ? 'bg-kid-sun-400 text-kid-ink-900' : 'bg-white/80 text-kid-ink-700'}`}>
        {label}
      </span>
    </div>
  );
  return (
    <div className="mx-auto flex w-full max-w-2xl items-start justify-center gap-6 md:gap-10" aria-hidden>
      {station('sun', 'Sunshine', 0.2, true)}
      {station('hands', 'Warm hands', 0.55, false)}
      {station('shade', 'Shady grass', 0.9, false)}
    </div>
  );
}

function MagnetReveal({ objectArt, grabs }: { objectArt?: string; grabs: boolean }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 700);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="relative mx-auto h-64 w-full max-w-md" aria-hidden>
      <div className={`absolute left-8 top-16 ${done && !grabs ? 'animate-kid-wiggle' : ''}`}>
        <ScienceArt art="magnet" className="h-28 w-28" />
      </div>
      <div
        className="absolute right-8 top-20"
        style={{
          transform: done && grabs ? 'translateX(-150px)' : 'translateX(0)',
          transition: 'transform 1.1s cubic-bezier(.3,.7,.4,1.2)',
        }}
      >
        <ScienceArt art={objectArt ?? 'paperclip'} className="h-24 w-24" />
      </div>
      {done && (
        <div className="animate-kid-pop-in absolute inset-x-0 bottom-0 text-center">
          <span
            className={`inline-block rounded-full px-5 py-2 text-lg font-black ${
              grabs ? 'bg-kid-mint-400 text-kid-ink-900' : 'bg-white/90 text-kid-ink-700'
            }`}
          >
            {grabs ? 'Grabbed!' : 'No grab!'}
          </span>
        </div>
      )}
    </div>
  );
}

function EarthReveal({ day }: { day: boolean }) {
  return (
    <div className="relative mx-auto h-72 w-72" aria-hidden>
      <div className={`absolute inset-0 rounded-full ${day ? 'bg-kid-sky-200' : 'bg-kid-night-700'}`} style={{ transition: 'background 1s' }} />
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        {day ? (
          <div className="animate-kid-sparkle">
            <ScienceArt art="sun" className="h-24 w-24" />
          </div>
        ) : (
          <ScienceArt art="night" className="h-20 w-20 opacity-90" />
        )}
      </div>
      <div className="absolute right-10 top-1/2 -translate-y-1/2">
        <div className="animate-kid-spin-slow" style={{ animationDuration: '6s' }}>
          <div className="relative">
            <ScienceArt art="earth" className="h-36 w-36" />
            <div className="absolute" style={{ right: day ? '-6px' : 'auto', left: day ? 'auto' : '-6px', top: '44px' }}>
              <ScienceArt art="house" className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <span
          className={`inline-block rounded-full px-5 py-2 text-lg font-black ${
            day ? 'bg-kid-sun-400 text-kid-ink-900' : 'bg-kid-night-600 text-white'
          }`}
        >
          {day ? 'Daytime!' : 'Nighttime!'}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The lab itself: pick any 3 of 6 experiments, predict first, watch.  */
/* ------------------------------------------------------------------ */

type Phase = 'pick' | 'predict' | 'reveal' | 'finale';

export default function ScienceLab({ childId, nickname, onExit }: ScienceLabProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [exp, setExp] = useState<ScienceExperiment | null>(null);
  const [trialIdx, setTrialIdx] = useState(0);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [orderList, setOrderList] = useState<ScienceOption[]>([]);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const [wasRight, setWasRight] = useState<boolean | null>(null);
  const [explained, setExplained] = useState(false);
  const [totals, setTotals] = useState({ correct: 0, total: 0 });
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'science_game',
    stickerId: 'jr-scientist',
    trophyEvent: 'science_done',
    milestone: 'science_lab_win',
  });
  const starBalance = session.starBalance ?? 0;
  const timers = useRef<number[]>([]);
  const rewarded = useRef(false);

  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => window.clearTimeout(t));
      stopSpeaking();
    };
  }, []);

  const trial: ScienceTrial | null = exp ? exp.trials[trialIdx] ?? null : null;

  /* Speak the prediction prompt whenever we enter a predict step. */
  useEffect(() => {
    if (phase === 'predict' && trial) {
      speakAs(HOST, trial.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trialIdx, exp?.id]);

  const startExperiment = useCallback(
    (e: ScienceExperiment) => {
      playSfx('whoosh');
      setExp(e);
      setTrialIdx(0);
      setOrder([]);
      setWasRight(null);
      setExplained(false);
      if (e.kind === 'stages' && e.trials[0]) {
        setOrderList(shuffle(e.trials[0].choices, `stages-${e.id}`));
      }
      setPhase('predict');
      speakAs(HOST, e.intro);
    },
    []
  );

  const goReveal = useCallback(
    (correct: boolean) => {
      setWasRight(correct);
      setTotals((t) => ({ correct: t.correct + (correct ? 1 : 0), total: t.total + 1 }));
      playSfx(correct ? 'correct' : 'wrong');
      speakAs(
        HOST,
        correct
          ? `Great guess, ${nickname ?? 'scientist'}! Let us watch what really happens.`
          : 'Good scientists guess first! Now let us watch what really happens.'
      );
      later(2200, () => {
        setPhase('reveal');
        if (trial) speakAs(HOST, trial.resultLine);
      });
    },
    [later, nickname, trial]
  );

  const handlePredict = useCallback(
    (option: ScienceOption) => {
      if (!trial || phase !== 'predict') return;
      goReveal(option.id === trial.correctId);
    },
    [trial, phase, goReveal]
  );

  const handleOrderTap = useCallback(
    (stageId: string) => {
      if (!exp?.stages || phase !== 'predict') return;
      const expected = exp.stages[order.length]?.id;
      if (stageId === expected) {
        playSfx('pop');
        const next = [...order, stageId];
        setOrder(next);
        if (next.length === exp.stages.length) {
          later(500, () => goReveal(true));
        }
      } else {
        playSfx('wrong');
        setShakeKey(stageId);
        later(600, () => setShakeKey(null));
        speakAs(HOST, 'Hmm, not quite that one. Which step comes next?');
      }
    },
    [exp, order, phase, later, goReveal]
  );

  const nextStep = useCallback(() => {
    if (!exp) return;
    playSfx('pop');
    if (trialIdx + 1 < exp.trials.length) {
      setTrialIdx(trialIdx + 1);
      setOrder([]);
      setWasRight(null);
      setExplained(false);
      setPhase('predict');
    } else {
      const grown = [...doneIds, exp.id];
      setDoneIds(grown);
      setExp(null);
      if (grown.length >= LAB_SESSION_SIZE) {
        setPhase('finale');
      } else {
        setPhase('pick');
        speakAs(HOST, `Experiment complete! Pick another one, ${nickname ?? 'scientist'}.`);
      }
    }
  }, [exp, trialIdx, doneIds, nickname]);

  const explain = useCallback(() => {
    if (!exp || explained) return;
    setExplained(true);
    playSfx('click');
    speakAs(HOST, exp.explain);
  }, [exp, explained]);

  /* Finale rewards: fire exactly once. */
  const restart = useCallback(() => {
    rewarded.current = false;
    setDoneIds([]);
    setTotals({ correct: 0, total: 0 });
    setStarsEarned(0);
    setPhase('pick');
  }, []);

  useEffect(() => {
    if (phase !== 'finale' || rewarded.current) return;
    rewarded.current = true;
    const ratio = totals.total === 0 ? 1 : totals.correct / totals.total;
    const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    setStarsEarned(stars);
    playSfx('fanfare');
    speakAs(HOST, `You did it, ${nickname ?? 'young scientist'}! You are a real scientist now!`);
    void session.complete({ stars, extraMetadata: { correct: totals.correct, total: totals.total } });
  }, [phase, totals, childId, nickname, session]);

  const renderReveal = () => {
    if (!exp || !trial) return null;
    switch (exp.kind) {
      case 'sink-float':
        return <SinkFloatReveal key={trial.id} objectArt={trial.objectArt} floats={trial.correctId === 'float'} />;
      case 'color-mix': {
        const [a, b] = trial.mixPair ?? (['red', 'blue'] as [PaintColor, PaintColor]);
        return <ColorMixReveal key={trial.id} a={a} b={b} result={trial.correctId as PaintColor} />;
      }
      case 'stages':
        return <StagesReveal key={trial.id} experiment={exp} />;
      case 'melt':
        return <MeltReveal key={trial.id} />;
      case 'magnet':
        return <MagnetReveal key={trial.id} objectArt={trial.objectArt} grabs={trial.correctId === 'grab'} />;
      case 'earth':
        return <EarthReveal key={trial.id} day={trial.correctId === 'day'} />;
    }
  };

  return (
    <KidShell onExit={onExit} points={phase === 'finale' ? starBalance : 0}>
      {phase === 'pick' && (
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-center gap-3">
            <HostCharacter characterId={HOST} mood="happy" size={96} />
            <div>
              <h1 className="animate-kid-rise text-3xl font-black text-kid-ink-900 md:text-5xl">Bea&apos;s Science Lab</h1>
              <p className="animate-kid-rise mt-1 text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
                Guess first, then watch the magic! Pick {LAB_SESSION_SIZE - doneIds.length} more experiment
                {LAB_SESSION_SIZE - doneIds.length === 1 ? '' : 's'}, {nickname ?? 'scientist'}.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
            {EXPERIMENTS.map((e, i) => {
              const done = doneIds.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  disabled={done}
                  onClick={() => startExperiment(e)}
                  className="animate-kid-rise rounded-kid-card bg-white/90 px-5 py-4 text-left shadow-xl transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                  style={{ animationDelay: `${0.15 + i * 0.07}s` }}
                  aria-label={done ? `${e.title}, completed` : `Start ${e.title}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-kid-mint-300">
                      <ScienceArt art={e.materials[1]?.id ?? 'magnet'} className="h-10 w-10" />
                      {done && (
                        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kid-mint-500">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                            <path d="M5 13 l5 5 9 -11" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </span>
                    <span>
                      <span className="block text-xl font-black text-kid-ink-900">{e.title}</span>
                      <span className="block text-sm font-bold text-kid-ink-700">{e.subtitle}</span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-kid-ink-700">{e.question}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'predict' && exp && trial && (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="rounded-full bg-white/85 px-4 py-2 shadow-lg backdrop-blur">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">{exp.title}</span>
            </div>
            <button
              type="button"
              onClick={() => speakAs(HOST, trial.prompt)}
              className="rounded-full bg-white/85 px-4 py-2 text-base font-black text-kid-ink-900 shadow-lg backdrop-blur transition-transform active:scale-95"
              aria-label="Hear the question again"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                <path d="M4 9v6h4l5 4V5L8 9H4z" fill="#17324F" />
                <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="#17324F" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <HostCharacter characterId={HOST} mood="thinking" size={88} />
            <p className="max-w-md rounded-kid-card bg-white/90 px-5 py-3 text-xl font-black text-kid-ink-900 shadow-lg md:text-2xl">
              {trial.prompt}
            </p>
          </div>
          <p className="mt-2 text-base font-bold text-kid-ink-700">Scientists guess FIRST, then test!</p>

          {exp.kind === 'stages' ? (
            <div className="mt-4 w-full">
              <div className="flex min-h-20 flex-wrap items-center justify-center gap-2 rounded-kid-card bg-white/70 p-3" aria-live="polite" aria-label="Your order so far">
                {order.length === 0 && <span className="text-base font-bold text-kid-ink-700">Tap the pictures in order...</span>}
                {order.map((id, i) => {
                  const s = exp.stages?.find((st) => st.id === id);
                  return (
                    <span key={id} className="animate-kid-pop-in flex items-center gap-1 rounded-full bg-kid-mint-400 px-3 py-2 text-base font-black text-kid-ink-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm">{i + 1}</span>
                      {s?.label}
                    </span>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4" role="listbox" aria-label="Life stages, tap in order">
                {orderList.map((opt) => {
                  const used = order.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={used}
                      disabled={used}
                      onClick={() => handleOrderTap(opt.id)}
                      className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-kid-card bg-white/95 p-3 shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 ${
                        shakeKey === opt.id ? 'animate-kid-shake' : ''
                      }`}
                      aria-label={opt.label}
                    >
                      <ScienceArt art={opt.art} className="h-16 w-16" />
                      <span className="text-base font-black text-kid-ink-900">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid w-full grid-cols-2 gap-3 md:grid-cols-3" role="group" aria-label="Your prediction">
              {trial.choices.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePredict(opt)}
                  className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-kid-card bg-white/95 p-3 shadow-lg transition-transform hover:scale-105 active:scale-95"
                  aria-label={`Predict: ${opt.label}`}
                >
                  <ScienceArt art={opt.art} className="h-16 w-16" />
                  <span className="text-lg font-black text-kid-ink-900">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'reveal' && exp && trial && (
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex items-center gap-3">
            <HostCharacter characterId={HOST} mood={wasRight ? 'cheer' : 'happy'} size={88} />
            <p className="max-w-md rounded-kid-card bg-white/90 px-5 py-3 text-xl font-black text-kid-ink-900 shadow-lg md:text-2xl" aria-live="polite">
              {trial.resultLine}
            </p>
          </div>

          <div className="mt-4 w-full rounded-kid-card bg-white/70 p-4 shadow-inner">{renderReveal()}</div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={explain}
              disabled={explained}
              className="rounded-full bg-kid-grape-400 px-8 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              {explained ? 'Bea explained it!' : 'Bea explains'}
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="rounded-full bg-kid-sun-400 px-8 py-3 text-lg font-extrabold text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {trialIdx + 1 < exp.trials.length ? 'Next test' : doneIds.length + 1 >= LAB_SESSION_SIZE ? 'See my award!' : 'Finish experiment'}
            </button>
          </div>
        </div>
      )}

      {phase === 'finale' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`Young Scientist${nickname ? `, ${nickname}` : ''}!`}
          message={`You guessed ${totals.correct} out of ${totals.total} like a true scientist and earned`}
          stickerId="jr-scientist"
          hostAvatar={(
            <svg viewBox="0 0 64 64" role="img" aria-label="Young Scientist medal">
              <circle cx="32" cy="26" r="18" fill="#FFD93C" stroke="#E0A93C" strokeWidth="3" />
              <path d="M32 16 l3.5 7 7.5 1 -5.5 5.2 1.4 7.4 -6.9 -3.7 -6.9 3.7 1.4 -7.4 -5.5 -5.2 7.5 -1 z" fill="#fff" />
              <path d="M24 42 L18 58 L26 54 L32 60 L38 54 L46 58 L40 42" fill="#4FB3E8" stroke="#2E86C1" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          )}
          onPlayAgain={restart}
          onExit={onExit}
          playAgainLabel="More experiments"
        />
      )}
    </KidShell>
  );
}
