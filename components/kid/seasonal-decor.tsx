'use client';

/**
 * SeasonalDecor — the Sky map dresses up for the season. Absolutely
 * positioned, pointer-events-none CSS decorations: falling snow in winter,
 * floating pumpkins in spooky season, blossoms in spring, sunshine in
 * summer, drifting leaves in autumn. Respects prefers-reduced-motion.
 * No emoji anywhere — all SVG shapes.
 */

import { useMemo } from 'react';
import { seasonFor, type SeasonId } from '@/lib/kid/seasons';

/** Deterministic pseudo-random in [0, 1) from an integer seed. */
function rand(seed: number): number {
  let h = seed >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function Snowflake({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" style={style} className="seasonal-fall" aria-hidden>
      <g stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.9">
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
        <line x1="19.8" y1="7.5" x2="4.2" y2="16.5" />
      </g>
    </svg>
  );
}

function Pumpkin({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={style} className="seasonal-drift" aria-hidden>
      <ellipse cx="32" cy="36" rx="20" ry="16" fill="#E8734A" />
      <ellipse cx="32" cy="36" rx="12" ry="16" fill="#F0925C" />
      <rect x="29" y="14" width="6" height="9" rx="3" fill="#5A8A2E" />
      <path d="M24 32 l4 -5 4 5 z M36 32 l4 -5 4 5 z" fill="#3A2410" />
      <path d="M24 42 q8 6 16 0" fill="none" stroke="#3A2410" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Blossom({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 32 32" style={style} className="seasonal-sway" aria-hidden>
      <g fill="#F4A9C4">
        <ellipse cx="16" cy="8" rx="5" ry="7" />
        <ellipse cx="16" cy="24" rx="5" ry="7" />
        <ellipse cx="8" cy="16" rx="7" ry="5" />
        <ellipse cx="24" cy="16" rx="7" ry="5" />
      </g>
      <circle cx="16" cy="16" r="3.5" fill="#FFE66D" />
    </svg>
  );
}

function Leaf({ style, color }: { style: React.CSSProperties; color: string }) {
  return (
    <svg viewBox="0 0 32 32" style={style} className="seasonal-fall" aria-hidden>
      <path d="M16 3 Q28 14 16 29 Q4 14 16 3 Z" fill={color} />
      <line x1="16" y1="6" x2="16" y2="26" stroke="#7A4A21" strokeWidth="1.6" />
    </svg>
  );
}

function Sparkle({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" style={style} className="seasonal-sway" aria-hidden>
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="#FFE66D" opacity="0.95" />
    </svg>
  );
}

export default function SeasonalDecor({ season }: { season?: SeasonId }) {
  const current: SeasonId = season ?? seasonFor(new Date());

  const items = useMemo(() => {
    switch (current) {
      case 'winter':
        return Array.from({ length: 22 }, (_, i) => ({
          key: i,
          left: rand(i * 37 + 11) * 100,
          size: 14 + rand(i * 53 + 7) * 18,
          duration: 7 + rand(i * 91 + 3) * 8,
          delay: -rand(i * 17 + 5) * 12,
        }));
      case 'halloween':
        return Array.from({ length: 8 }, (_, i) => ({
          key: i,
          left: rand(i * 41 + 13) * 100,
          size: 34 + rand(i * 67 + 7) * 26,
          duration: 9 + rand(i * 29 + 3) * 7,
          delay: -rand(i * 19 + 5) * 12,
        }));
      case 'spring':
        return Array.from({ length: 14 }, (_, i) => ({
          key: i,
          left: rand(i * 43 + 17) * 100,
          size: 16 + rand(i * 71 + 7) * 14,
          duration: 8 + rand(i * 31 + 3) * 7,
          delay: -rand(i * 23 + 5) * 12,
        }));
      case 'autumn':
        return Array.from({ length: 16 }, (_, i) => ({
          key: i,
          left: rand(i * 47 + 19) * 100,
          size: 16 + rand(i * 73 + 7) * 16,
          duration: 8 + rand(i * 37 + 3) * 8,
          delay: -rand(i * 29 + 5) * 12,
        }));
      case 'summer':
        return Array.from({ length: 10 }, (_, i) => ({
          key: i,
          left: rand(i * 51 + 23) * 100,
          size: 14 + rand(i * 79 + 7) * 12,
          duration: 6 + rand(i * 41 + 3) * 5,
          delay: -rand(i * 31 + 5) * 10,
        }));
    }
  }, [current]);

  const leafColors = ['#E8734A', '#D9A441', '#C25A35', '#E8A93C'];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes seasonal-fall {
          0% { transform: translateY(-12%) rotate(0deg); }
          100% { transform: translateY(112vh) rotate(340deg); }
        }
        @keyframes seasonal-drift {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-26px) rotate(6deg); }
        }
        @keyframes seasonal-sway {
          0%, 100% { transform: translateY(-6%) rotate(-14deg); }
          50% { transform: translateY(46vh) rotate(14deg); }
        }
        @keyframes seasonal-spin { to { transform: rotate(360deg); } }
        .seasonal-fall { position: absolute; top: -8%; animation: seasonal-fall linear infinite; }
        .seasonal-drift { position: absolute; top: 8%; animation: seasonal-drift ease-in-out infinite; }
        .seasonal-sway { position: absolute; top: -6%; animation: seasonal-sway ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .seasonal-fall, .seasonal-drift, .seasonal-sway, .seasonal-spin { animation: none !important; }
        }
      `}</style>

      {current === 'winter' &&
        items.map((it) => (
          <Snowflake
            key={it.key}
            style={{
              left: `${it.left}%`,
              width: it.size,
              height: it.size,
              animationDuration: `${it.duration}s`,
              animationDelay: `${it.delay}s`,
            }}
          />
        ))}

      {current === 'halloween' &&
        items.map((it) => (
          <Pumpkin
            key={it.key}
            style={{
              left: `${it.left}%`,
              width: it.size,
              height: it.size,
              animationDuration: `${it.duration}s`,
              animationDelay: `${it.delay}s`,
            }}
          />
        ))}

      {current === 'spring' &&
        items.map((it) => (
          <Blossom
            key={it.key}
            style={{
              left: `${it.left}%`,
              width: it.size,
              height: it.size,
              animationDuration: `${it.duration}s`,
              animationDelay: `${it.delay}s`,
            }}
          />
        ))}

      {current === 'autumn' &&
        items.map((it) => (
          <Leaf
            key={it.key}
            color={leafColors[it.key % leafColors.length]}
            style={{
              left: `${it.left}%`,
              width: it.size,
              height: it.size,
              animationDuration: `${it.duration}s`,
              animationDelay: `${it.delay}s`,
            }}
          />
        ))}

      {current === 'summer' && (
        <>
          <svg
            viewBox="0 0 96 96"
            className="seasonal-spin absolute"
            style={{ top: '4%', right: '5%', width: 84, height: 84, animation: 'seasonal-spin 24s linear infinite' }}
            aria-hidden
          >
            <g stroke="#FFD93C" strokeWidth="5" strokeLinecap="round">
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4;
                const x1 = 48 + Math.cos(a) * 30;
                const y1 = 48 + Math.sin(a) * 30;
                const x2 = 48 + Math.cos(a) * 42;
                const y2 = 48 + Math.sin(a) * 42;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </g>
            <circle cx="48" cy="48" r="22" fill="#FFE66D" stroke="#F0B429" strokeWidth="3" />
            <circle cx="41" cy="44" r="3" fill="#17324F" />
            <circle cx="55" cy="44" r="3" fill="#17324F" />
            <path d="M40 54 q8 6 16 0" fill="none" stroke="#17324F" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          {items.map((it) => (
            <Sparkle
              key={it.key}
              style={{
                left: `${it.left}%`,
                width: it.size,
                height: it.size,
                animationDuration: `${it.duration}s`,
                animationDelay: `${it.delay}s`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
