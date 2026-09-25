'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Story } from '@/lib/kid/stories';
import { speakAs, stopSpeaking, unlockAudio, playSfx } from '@/lib/kid/audio';

/* ------------------------------------------------------------------ */
/* Tiny inline SVG icons (no emoji, no icon fonts on kid screens)       */
/* ------------------------------------------------------------------ */

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.2 5.8a9 9 0 0 1 0 12.4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Simple storybook illustration kit: sun, moon, stars, trees, animals */
/* ------------------------------------------------------------------ */

function Sun({ x, y, r }: { x: number; y: number; r: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <g>
      {rays.map((a, i) => (
        <line
          key={i}
          x1={x + Math.cos(a) * (r + 7)}
          y1={y + Math.sin(a) * (r + 7)}
          x2={x + Math.cos(a) * (r + 18)}
          y2={y + Math.sin(a) * (r + 18)}
          stroke="#FFB300"
          strokeWidth={5}
          strokeLinecap="round"
        />
      ))}
      <circle cx={x} cy={y} r={r} fill="#FFD93C" />
      <circle cx={x - r * 0.3} cy={y - r * 0.25} r={r * 0.28} fill="#FFE98A" />
    </g>
  );
}

function Sparkle({ x, y, s, color = '#FFF6C9' }: { x: number; y: number; s: number; color?: string }) {
  const k = s * 0.18;
  return (
    <path
      d={`M ${x} ${y - s} Q ${x + k} ${y - k} ${x + s} ${y} Q ${x + k} ${y + k} ${x} ${y + s} Q ${x - k} ${y + k} ${x - s} ${y} Q ${x - k} ${y - k} ${x} ${y - s} Z`}
      fill={color}
    />
  );
}

function Cloud({ x, y, s, opacity = 0.95 }: { x: number; y: number; s: number; opacity?: number }) {
  return (
    <g fill="#FFFFFF" opacity={opacity}>
      <ellipse cx={x} cy={y} rx={34 * s} ry={20 * s} />
      <ellipse cx={x - 24 * s} cy={y + 6 * s} rx={22 * s} ry={14 * s} />
      <ellipse cx={x + 24 * s} cy={y + 6 * s} rx={22 * s} ry={14 * s} />
    </g>
  );
}

function Tree({ x, y, s, night = false }: { x: number; y: number; s: number; night?: boolean }) {
  const trunk = night ? '#232B4D' : '#8B5E3C';
  const leaf = night ? '#2E3A5E' : '#5FA85C';
  const leafLight = night ? '#3A4A72' : '#6FBF6B';
  return (
    <g>
      <rect x={x - 10 * s} y={y - 70 * s} width={20 * s} height={70 * s} rx={8 * s} fill={trunk} />
      <circle cx={x} cy={y - 95 * s} r={34 * s} fill={leaf} />
      <circle cx={x - 26 * s} cy={y - 78 * s} r={24 * s} fill={leafLight} />
      <circle cx={x + 26 * s} cy={y - 78 * s} r={24 * s} fill={leafLight} />
    </g>
  );
}

function Hill({ color = '#79C97E' }: { color?: string }) {
  return <ellipse cx={200} cy={308} rx={295} ry={88} fill={color} />;
}

function Fox({ x, y, s, happy = true }: { x: number; y: number; s: number; happy?: boolean }) {
  return (
    <g>
      <ellipse cx={x + 34 * s} cy={y + 8 * s} rx={20 * s} ry={10 * s} fill="#E0802A" transform={`rotate(-30 ${x + 34 * s} ${y + 8 * s})`} />
      <ellipse cx={x + 45 * s} cy={y - 1 * s} rx={8 * s} ry={6 * s} fill="#FFF3E0" transform={`rotate(-30 ${x + 45 * s} ${y - 1 * s})`} />
      <ellipse cx={x} cy={y} rx={22 * s} ry={26 * s} fill="#E0802A" />
      <ellipse cx={x} cy={y + 9 * s} rx={12 * s} ry={15 * s} fill="#FFF3E0" />
      <circle cx={x} cy={y - 34 * s} r={20 * s} fill="#E0802A" />
      <path d={`M ${x - 18 * s} ${y - 44 * s} L ${x - 23 * s} ${y - 66 * s} L ${x - 4 * s} ${y - 52 * s} Z`} fill="#E0802A" />
      <path d={`M ${x + 18 * s} ${y - 44 * s} L ${x + 23 * s} ${y - 66 * s} L ${x + 4 * s} ${y - 52 * s} Z`} fill="#E0802A" />
      <ellipse cx={x} cy={y - 26 * s} rx={10 * s} ry={7 * s} fill="#FFF3E0" />
      <path d={`M ${x - 4 * s} ${y - 28 * s} L ${x + 4 * s} ${y - 28 * s} L ${x} ${y - 22 * s} Z`} fill="#17324f" />
      {happy ? (
        <g stroke="#17324f" strokeWidth={2.4 * s} strokeLinecap="round" fill="none">
          <path d={`M ${x - 13 * s} ${y - 36 * s} q ${4.5 * s} ${-5 * s} ${9 * s} 0`} />
          <path d={`M ${x + 4 * s} ${y - 36 * s} q ${4.5 * s} ${-5 * s} ${9 * s} 0`} />
        </g>
      ) : (
        <g fill="#17324f">
          <circle cx={x - 8 * s} cy={y - 36 * s} r={2.6 * s} />
          <circle cx={x + 8 * s} cy={y - 36 * s} r={2.6 * s} />
        </g>
      )}
    </g>
  );
}

function Rabbit({ x, y, s, sad = false }: { x: number; y: number; s: number; sad?: boolean }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={20 * s} ry={24 * s} fill="#F2F4F8" />
      <ellipse cx={x} cy={y + 10 * s} rx={10 * s} ry={12 * s} fill="#FFFFFF" />
      <circle cx={x} cy={y - 30 * s} r={16 * s} fill="#F2F4F8" />
      <ellipse cx={x - 8 * s} cy={y - 58 * s} rx={6 * s} ry={18 * s} fill="#F2F4F8" />
      <ellipse cx={x + 8 * s} cy={y - 58 * s} rx={6 * s} ry={18 * s} fill="#F2F4F8" />
      <ellipse cx={x - 8 * s} cy={y - 58 * s} rx={2.6 * s} ry={11 * s} fill="#FFB3C7" />
      <ellipse cx={x + 8 * s} cy={y - 58 * s} rx={2.6 * s} ry={11 * s} fill="#FFB3C7" />
      <circle cx={x - 6 * s} cy={y - 32 * s} r={2.4 * s} fill="#17324f" />
      <circle cx={x + 6 * s} cy={y - 32 * s} r={2.4 * s} fill="#17324f" />
      <ellipse cx={x} cy={y - 26 * s} rx={3 * s} ry={2.2 * s} fill="#F48FB1" />
      {sad ? (
        <path d={`M ${x - 5 * s} ${y - 19 * s} q ${5 * s} ${-4 * s} ${10 * s} 0`} stroke="#17324f" strokeWidth={2 * s} fill="none" strokeLinecap="round" />
      ) : (
        <path d={`M ${x - 5 * s} ${y - 22 * s} q ${5 * s} ${4 * s} ${10 * s} 0`} stroke="#17324f" strokeWidth={2 * s} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

function Owl({ x, y, s, asleep = false, eyesOpen = true }: { x: number; y: number; s: number; asleep?: boolean; eyesOpen?: boolean }) {
  const showEyes = eyesOpen && !asleep;
  return (
    <g>
      <path d={`M ${x - 16 * s} ${y - 26 * s} L ${x - 22 * s} ${y - 42 * s} L ${x - 6 * s} ${y - 32 * s} Z`} fill="#7A5C3E" />
      <path d={`M ${x + 16 * s} ${y - 26 * s} L ${x + 22 * s} ${y - 42 * s} L ${x + 6 * s} ${y - 32 * s} Z`} fill="#7A5C3E" />
      <ellipse cx={x} cy={y} rx={24 * s} ry={28 * s} fill="#8B6B4A" />
      <ellipse cx={x} cy={y + 8 * s} rx={13 * s} ry={15 * s} fill="#D9BE96" />
      <ellipse cx={x - 22 * s} cy={y + 2 * s} rx={7 * s} ry={16 * s} fill="#7A5C3E" />
      <ellipse cx={x + 22 * s} cy={y + 2 * s} rx={7 * s} ry={16 * s} fill="#7A5C3E" />
      {showEyes ? (
        <g>
          <circle cx={x - 10 * s} cy={y - 12 * s} r={9 * s} fill="#FFFFFF" />
          <circle cx={x + 10 * s} cy={y - 12 * s} r={9 * s} fill="#FFFFFF" />
          <circle cx={x - 10 * s} cy={y - 12 * s} r={4 * s} fill="#17324f" />
          <circle cx={x + 10 * s} cy={y - 12 * s} r={4 * s} fill="#17324f" />
          <circle cx={x - 11.5 * s} cy={y - 13.5 * s} r={1.4 * s} fill="#FFFFFF" />
          <circle cx={x + 8.5 * s} cy={y - 13.5 * s} r={1.4 * s} fill="#FFFFFF" />
        </g>
      ) : (
        <g stroke="#3E2F23" strokeWidth={2.4 * s} strokeLinecap="round" fill="none">
          <path d={`M ${x - 18 * s} ${y - 12 * s} q ${8 * s} ${5 * s} ${16 * s} 0`} />
          <path d={`M ${x + 2 * s} ${y - 12 * s} q ${8 * s} ${5 * s} ${16 * s} 0`} />
        </g>
      )}
      <path d={`M ${x - 5 * s} ${y - 2 * s} L ${x + 5 * s} ${y - 2 * s} L ${x} ${y + 4 * s} Z`} fill="#F2A03D" />
      <path
        d={`M ${x - 10 * s} ${y + 28 * s} l 0 ${6 * s} M ${x - 3.5 * s} ${y + 28 * s} l 0 ${6 * s} M ${x + 3.5 * s} ${y + 28 * s} l 0 ${6 * s} M ${x + 10 * s} ${y + 28 * s} l 0 ${6 * s}`}
        stroke="#F2A03D"
        strokeWidth={2.4 * s}
        strokeLinecap="round"
      />
    </g>
  );
}

function Bee({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g>
      <ellipse cx={x - 8 * s} cy={y - 20 * s} rx={10 * s} ry={14 * s} fill="#D6ECFF" opacity={0.92} transform={`rotate(-20 ${x - 8 * s} ${y - 20 * s})`} />
      <ellipse cx={x + 8 * s} cy={y - 20 * s} rx={10 * s} ry={14 * s} fill="#D6ECFF" opacity={0.92} transform={`rotate(20 ${x + 8 * s} ${y - 20 * s})`} />
      <ellipse cx={x} cy={y} rx={20 * s} ry={15 * s} fill="#FFC93C" />
      <rect x={x - 9 * s} y={y - 12 * s} width={5 * s} height={24 * s} rx={2.5 * s} fill="#17324f" />
      <rect x={x + 1 * s} y={y - 12 * s} width={5 * s} height={24 * s} rx={2.5 * s} fill="#17324f" />
      <circle cx={x - 13 * s} cy={y - 3 * s} r={2.6 * s} fill="#17324f" />
      <path d={`M ${x - 19 * s} ${y + 4 * s} q ${5 * s} ${4 * s} ${9 * s} ${1 * s}`} stroke="#17324f" strokeWidth={2 * s} fill="none" strokeLinecap="round" />
      <path d={`M ${x - 4 * s} ${y - 14 * s} q ${-4 * s} ${-8 * s} ${-10 * s} ${-10 * s}`} stroke="#17324f" strokeWidth={2 * s} fill="none" strokeLinecap="round" />
      <circle cx={x - 14 * s} cy={y - 24 * s} r={2 * s} fill="#17324f" />
    </g>
  );
}

function Flower({ x, y, s, color = '#F15BB5', droop = false }: { x: number; y: number; s: number; color?: string; droop?: boolean }) {
  const petals = [0, 72, 144, 216, 288];
  const hx = droop ? x + 10 * s : x;
  const hy = droop ? y - 56 * s : y - 66 * s;
  return (
    <g>
      {droop ? (
        <path d={`M ${x} ${y} Q ${x + 28 * s} ${y - 18 * s} ${hx} ${hy + 12 * s}`} stroke="#3E9E5C" strokeWidth={6 * s} fill="none" strokeLinecap="round" />
      ) : (
        <rect x={x - 3 * s} y={y - 60 * s} width={6 * s} height={60 * s} rx={3 * s} fill="#3E9E5C" />
      )}
      <ellipse cx={x - 11 * s} cy={y - 18 * s} rx={10 * s} ry={5 * s} fill="#5FBF6B" transform={`rotate(-30 ${x - 11 * s} ${y - 18 * s})`} />
      {petals.map((a) => (
        <ellipse
          key={a}
          cx={hx + 16 * s * Math.cos((a * Math.PI) / 180)}
          cy={hy + 16 * s * Math.sin((a * Math.PI) / 180)}
          rx={11 * s}
          ry={11 * s}
          fill={color}
        />
      ))}
      <circle cx={hx} cy={hy} r={10 * s} fill="#FFD93C" />
      <circle cx={hx - 3 * s} cy={hy - 3 * s} r={3 * s} fill="#FFE98A" />
    </g>
  );
}

function Basket({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g>
      <circle cx={x - 18 * s} cy={y - 26 * s} r={9 * s} fill="#E14E4E" />
      <circle cx={x} cy={y - 33 * s} r={10 * s} fill="#E14E4E" />
      <circle cx={x + 18 * s} cy={y - 26 * s} r={9 * s} fill="#E14E4E" />
      <circle cx={x - 9 * s} cy={y - 39 * s} r={8 * s} fill="#F2707A" />
      <circle cx={x + 9 * s} cy={y - 39 * s} r={8 * s} fill="#F2707A" />
      <path d={`M ${x - 30 * s} ${y - 18 * s} L ${x + 30 * s} ${y - 18 * s} L ${x + 22 * s} ${y + 22 * s} L ${x - 22 * s} ${y + 22 * s} Z`} fill="#B07A45" />
      <path d={`M ${x - 30 * s} ${y - 18 * s} L ${x + 30 * s} ${y - 18 * s} L ${x + 28 * s} ${y - 8 * s} L ${x - 28 * s} ${y - 8 * s} Z`} fill="#8B5E3C" />
      <line x1={x - 26 * s} y1={y + 2 * s} x2={x + 26 * s} y2={y + 2 * s} stroke="#8B5E3C" strokeWidth={3 * s} />
      <line x1={x - 24 * s} y1={y + 12 * s} x2={x + 24 * s} y2={y + 12 * s} stroke="#8B5E3C" strokeWidth={3 * s} />
    </g>
  );
}

function Berry({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#E14E4E" />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.28} fill="#F5979D" />
    </g>
  );
}

function Hive({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g>
      <path
        d={`M ${x - 30 * s} ${y + 24 * s} Q ${x - 34 * s} ${y - 30 * s} ${x} ${y - 42 * s} Q ${x + 34 * s} ${y - 30 * s} ${x + 30 * s} ${y + 24 * s} Z`}
        fill="#E8A93D"
      />
      <path d={`M ${x - 31 * s} ${y + 6 * s} Q ${x} ${y + 16 * s} ${x + 31 * s} ${y + 6 * s}`} stroke="#B97F26" strokeWidth={4 * s} fill="none" />
      <path d={`M ${x - 27 * s} ${y - 10 * s} Q ${x} ${y} ${x + 27 * s} ${y - 10 * s}`} stroke="#B97F26" strokeWidth={4 * s} fill="none" />
      <ellipse cx={x} cy={y + 10 * s} rx={8 * s} ry={10 * s} fill="#5B3A1E" />
    </g>
  );
}

function Heart({ x, y, s, color = '#F15BB5' }: { x: number; y: number; s: number; color?: string }) {
  return (
    <path
      d={`M ${x} ${y + 7 * s} C ${x - 15 * s} ${y - 4 * s} ${x - 9 * s} ${y - 15 * s} ${x} ${y - 6 * s} C ${x + 9 * s} ${y - 15 * s} ${x + 15 * s} ${y - 4 * s} ${x} ${y + 7 * s} Z`}
      fill={color}
    />
  );
}

function Crown({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      d={`M ${x - 13 * s} ${y} L ${x - 13 * s} ${y + 10 * s} L ${x - 6.5 * s} ${y + 4 * s} L ${x} ${y + 10 * s} L ${x + 6.5 * s} ${y + 4 * s} L ${x + 13 * s} ${y + 10 * s} L ${x + 13 * s} ${y} Z`}
      fill="#FFD93C"
      stroke="#E8A93D"
      strokeWidth={2 * s}
      strokeLinejoin="round"
    />
  );
}

/* Sky backdrop helper */
function Sky({ id, from, to, children }: { id: string; from: string; to: string; children?: ReactNode }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width={400} height={260} fill={`url(#${id})`} />
      {children}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* One illustration per story page                                     */
/* ------------------------------------------------------------------ */

function renderScene(scene: string): ReactNode {
  switch (scene) {
    /* ---- Pip Shares the Berries ---- */
    case 'berry-bush':
      return (
        <Sky id="sc-day" from="#7DD8F7" to="#EAFBFF">
          <Sun x={64} y={52} r={22} />
          <Cloud x={300} y={44} s={1} />
          <Cloud x={180} y={30} s={0.7} opacity={0.8} />
          <Hill />
          <Tree x={340} y={218} s={0.85} />
          <circle cx={105} cy={185} r={36} fill="#4E9E4E" />
          <circle cx={150} cy={172} r={44} fill="#4E9E4E" />
          <circle cx={195} cy={186} r={34} fill="#4E9E4E" />
          <circle cx={132} cy={160} r={26} fill="#5FBF6B" />
          <Berry x={95} y={170} r={7} />
          <Berry x={125} y={158} r={7} />
          <Berry x={152} y={148} r={7} />
          <Berry x={176} y={160} r={7} />
          <Berry x={196} y={174} r={7} />
          <Fox x={278} y={196} s={1.05} />
        </Sky>
      );
    case 'basket-full':
      return (
        <Sky id="sc-morning" from="#AEE7FF" to="#FFF3C4">
          <Sun x={330} y={50} r={24} />
          <Cloud x={90} y={50} s={0.9} />
          <Hill />
          <Flower x={58} y={228} s={0.8} color="#F15BB5" />
          <Flower x={342} y={228} s={0.8} color="#B983FF" />
          <Basket x={200} y={188} s={1.5} />
          <Sparkle x={140} y={108} s={10} />
          <Sparkle x={262} y={100} s={8} />
          <Sparkle x={200} y={76} s={9} />
          <Fox x={92} y={202} s={1} />
        </Sky>
      );
    case 'rabbit-asks':
      return (
        <Sky id="sc-day" from="#7DD8F7" to="#EAFBFF">
          <Sun x={60} y={50} r={20} />
          <Cloud x={320} y={40} s={1} />
          <Hill />
          <Tree x={45} y={218} s={0.8} />
          <Rabbit x={120} y={202} s={1.05} />
          <Fox x={295} y={196} s={1.05} />
          <Basket x={295} y={224} s={0.75} />
          <Berry x={207} y={138} r={9} />
          <Sparkle x={207} y={112} s={7} />
        </Sky>
      );
    case 'hesitate':
      return (
        <Sky id="sc-day" from="#7DD8F7" to="#EAFBFF">
          <Cloud x={200} y={40} s={0.8} opacity={0.7} />
          <Hill />
          <Fox x={180} y={190} s={1.25} happy={false} />
          <Basket x={180} y={226} s={0.95} />
          <Rabbit x={332} y={206} s={0.8} sad />
        </Sky>
      );
    case 'sharing':
      return (
        <Sky id="sc-warm" from="#FFE3B3" to="#FFE9F2">
          <Sun x={200} y={58} r={26} />
          <Hill />
          <Fox x={132} y={196} s={1.1} />
          <Rabbit x={272} y={200} s={1.05} />
          <Berry x={202} y={138} r={13} />
          <Sparkle x={168} y={108} s={8} />
          <Sparkle x={236} y={104} s={9} />
          <Sparkle x={202} y={76} s={7} />
          <Heart x={202} y={44} s={1} />
        </Sky>
      );
    case 'picnic':
      return (
        <Sky id="sc-day" from="#7DD8F7" to="#EAFBFF">
          <Sun x={70} y={55} r={22} />
          <Cloud x={310} y={45} s={1} />
          <Hill />
          <rect x={100} y={206} width={200} height={42} rx={10} fill="#FF9D8A" />
          <line x1={150} y1={206} x2={150} y2={248} stroke="#FFFFFF" strokeWidth={5} opacity={0.55} />
          <line x1={200} y1={206} x2={200} y2={248} stroke="#FFFFFF" strokeWidth={5} opacity={0.55} />
          <line x1={250} y1={206} x2={250} y2={248} stroke="#FFFFFF" strokeWidth={5} opacity={0.55} />
          <Fox x={145} y={186} s={0.95} />
          <Rabbit x={256} y={190} s={0.95} />
          <Basket x={200} y={202} s={0.85} />
          <Berry x={168} y={222} r={6} />
          <Berry x={232} y={222} r={6} />
        </Sky>
      );
    /* ---- Hoot and the Star Blanket ---- */
    case 'tree-dusk':
      return (
        <Sky id="sc-sunset" from="#FFB26B" to="#B983FF">
          <Sun x={200} y={196} r={30} />
          <Tree x={110} y={232} s={1.4} />
          <rect x={110} y={140} width={190} height={12} rx={6} fill="#8B5E3C" />
          <Owl x={245} y={118} s={1.1} />
          <Cloud x={320} y={50} s={0.8} opacity={0.7} />
        </Sky>
      );
    case 'dark-night':
      return (
        <Sky id="sc-night" from="#2B2D6E" to="#17324f">
          <circle cx={340} cy={50} r={20} fill="#FFE9A8" />
          <Sparkle x={60} y={50} s={6} />
          <Sparkle x={140} y={80} s={5} />
          <Sparkle x={240} y={45} s={7} />
          <Sparkle x={300} y={110} s={5} />
          <Sparkle x={180} y={120} s={4} />
          <Tree x={80} y={238} s={1.1} night />
          <Hill color="#2F5D46" />
          <Owl x={235} y={172} s={1.25} eyesOpen={false} />
        </Sky>
      );
    case 'mama-comfort':
      return (
        <Sky id="sc-night" from="#2B2D6E" to="#17324f">
          <circle cx={330} cy={55} r={24} fill="#FFE9A8" />
          <Sparkle x={70} y={60} s={6} />
          <Sparkle x={170} y={40} s={5} />
          <Sparkle x={260} y={100} s={5} />
          <Hill color="#2F5D46" />
          <Owl x={148} y={176} s={1.5} />
          <Owl x={238} y={198} s={0.85} />
          <Heart x={196} y={112} s={0.9} color="#FF8AC2" />
        </Sky>
      );
    case 'starry-sky':
      return (
        <Sky id="sc-night" from="#2B2D6E" to="#17324f">
          <circle cx={200} cy={80} r={26} fill="#FFF6C9" opacity={0.35} />
          <Sparkle x={200} y={80} s={20} />
          <Sparkle x={80} y={50} s={7} />
          <Sparkle x={140} y={120} s={6} />
          <Sparkle x={300} y={60} s={8} />
          <Sparkle x={340} y={140} s={6} />
          <Sparkle x={60} y={150} s={5} />
          <Sparkle x={260} y={150} s={5} />
          <Sparkle x={120} y={180} s={4} />
          <Hill color="#2F5D46" />
          <Owl x={200} y={208} s={1.15} />
        </Sky>
      );
    case 'moon-smile':
      return (
        <Sky id="sc-night" from="#2B2D6E" to="#17324f">
          <Sparkle x={70} y={50} s={6} />
          <Sparkle x={330} y={70} s={7} />
          <Sparkle x={290} y={150} s={5} />
          <Sparkle x={110} y={140} s={5} />
          <circle cx={200} cy={105} r={46} fill="#FFE9A8" />
          <g stroke="#8B6B1E" strokeWidth={3} strokeLinecap="round" fill="none">
            <path d="M 178 100 q 6 -7 12 0" />
            <path d="M 210 100 q 6 -7 12 0" />
            <path d="M 184 120 q 16 13 32 0" />
          </g>
          <circle cx={176} cy={114} r={6} fill="#FFB3C7" opacity={0.6} />
          <circle cx={224} cy={114} r={6} fill="#FFB3C7" opacity={0.6} />
          <Hill color="#2F5D46" />
          <Owl x={200} y={218} s={0.9} />
        </Sky>
      );
    case 'sleepy-owl':
      return (
        <Sky id="sc-night" from="#2B2D6E" to="#17324f">
          <circle cx={70} cy={55} r={22} fill="#FFE9A8" />
          <Sparkle x={160} y={50} s={5} />
          <Sparkle x={300} y={80} s={6} />
          <Sparkle x={340} y={150} s={5} />
          <Tree x={200} y={238} s={1.4} night />
          <rect x={120} y={140} width={170} height={12} rx={6} fill="#232B4D" />
          <Owl x={205} y={118} s={1.1} asleep />
          <circle cx={262} cy={80} r={5} fill="#D6ECFF" opacity={0.5} />
          <circle cx={288} cy={60} r={7} fill="#D6ECFF" opacity={0.45} />
          <circle cx={318} cy={44} r={9} fill="#D6ECFF" opacity={0.4} />
        </Sky>
      );
    /* ---- Buzzy's Big Day ---- */
    case 'hive-morning':
      return (
        <Sky id="sc-morning" from="#AEE7FF" to="#FFF3C4">
          <Sun x={320} y={55} r={24} />
          <Cloud x={100} y={45} s={0.9} />
          <Hill />
          <Tree x={110} y={228} s={1.2} />
          <rect x={72} y={96} width={88} height={10} rx={5} fill="#8B5E3C" />
          <line x1={116} y1={106} x2={116} y2={122} stroke="#8B5E3C" strokeWidth={4} />
          <Hive x={116} y={152} s={1} />
          <Bee x={290} y={180} s={0.7} />
          <Flower x={250} y={232} s={0.9} color="#F15BB5" />
          <Flower x={342} y={232} s={0.9} color="#B983FF" />
        </Sky>
      );
    case 'big-bees':
      return (
        <Sky id="sc-day" from="#7DD8F7" to="#EAFBFF">
          <Sun x={60} y={50} r={20} />
          <Cloud x={210} y={48} s={1} />
          <path d="M 40 130 q 60 -46 130 -8" stroke="#BFD9E8" strokeWidth={4} fill="none" strokeDasharray="10 8" strokeLinecap="round" />
          <path d="M 150 105 q 60 -40 120 -6" stroke="#BFD9E8" strokeWidth={4} fill="none" strokeDasharray="10 8" strokeLinecap="round" />
          <path d="M 240 140 q 50 -36 110 -10" stroke="#BFD9E8" strokeWidth={4} fill="none" strokeDasharray="10 8" strokeLinecap="round" />
          <Bee x={110} y={122} s={1.25} />
          <Bee x={212} y={96} s={1.35} />
          <Bee x={312} y={128} s={1.25} />
          <Hill />
          <Bee x={200} y={218} s={0.7} />
        </Sky>
      );
    case 'droopy-flower':
      return (
        <Sky id="sc-day" from="#7DD8F7" to="#EAFBFF">
          <Sun x={80} y={55} r={22} />
          <Cloud x={300} y={45} s={0.9} />
          <Hill />
          <Flower x={200} y={228} s={1.5} color="#B983FF" droop />
          <Flower x={90} y={232} s={0.9} color="#F15BB5" />
          <Flower x={315} y={232} s={0.9} color="#FFD93C" />
        </Sky>
      );
    case 'buzzy-helps':
      return (
        <Sky id="sc-day" from="#7DD8F7" to="#EAFBFF">
          <Sun x={70} y={50} r={20} />
          <Hill />
          <Flower x={200} y={230} s={1.6} color="#F15BB5" />
          <Bee x={206} y={104} s={0.85} />
          <Sparkle x={140} y={90} s={8} />
          <Sparkle x={272} y={95} s={9} />
          <Sparkle x={206} y={56} s={7} />
        </Sky>
      );
    case 'bloom':
      return (
        <Sky id="sc-morning" from="#AEE7FF" to="#FFF3C4">
          <Sun x={200} y={66} r={30} />
          <Hill />
          <Flower x={200} y={238} s={2} color="#FF6B9D" />
          <Flower x={80} y={232} s={0.9} color="#B983FF" />
          <Flower x={322} y={232} s={0.9} color="#F15BB5" />
          <Sparkle x={120} y={100} s={9} />
          <Sparkle x={285} y={105} s={8} />
          <Sparkle x={200} y={130} s={7} color="#FFFFFF" />
        </Sky>
      );
    case 'queen-hug':
      return (
        <Sky id="sc-morning" from="#AEE7FF" to="#FFF3C4">
          <line x1={70} y1={0} x2={70} y2={52} stroke="#8B5E3C" strokeWidth={4} />
          <Hive x={70} y={84} s={0.8} />
          <Cloud x={310} y={45} s={0.9} />
          <Hill />
          <Bee x={160} y={178} s={1.1} />
          <Bee x={246} y={178} s={1.15} />
          <Crown x={246} y={140} s={1.1} />
          <Heart x={203} y={104} s={1.3} />
          <Flower x={110} y={238} s={0.9} color="#F15BB5" />
          <Flower x={300} y={238} s={0.9} color="#B983FF" />
        </Sky>
      );
    /* ---- Fallback ---- */
    default:
      return (
        <Sky id="sc-day" from="#7DD8F7" to="#EAFBFF">
          <Sun x={70} y={55} r={22} />
          <Cloud x={300} y={45} s={1} />
          <Hill />
          <Tree x={320} y={218} s={1} />
          <Flower x={80} y={228} s={1} color="#F15BB5" />
          <Flower x={150} y={232} s={0.9} color="#B983FF" />
          <Rabbit x={220} y={202} s={1} />
        </Sky>
      );
  }
}

const SCENES: Record<string, string[]> = {
  'pip-shares-berries': ['berry-bush', 'basket-full', 'rabbit-asks', 'hesitate', 'sharing', 'picnic'],
  'hoot-star-blanket': ['tree-dusk', 'dark-night', 'mama-comfort', 'starry-sky', 'moon-smile', 'sleepy-owl'],
  'buzzys-big-day': ['hive-morning', 'big-bees', 'droopy-flower', 'buzzy-helps', 'bloom', 'queen-hug'],
};

function sceneFor(storyId: string, pageIndex: number): string {
  const list = SCENES[storyId];
  if (list && list[pageIndex]) return list[pageIndex];
  return 'meadow';
}

function SceneArt({ scene, label }: { scene: string; label: string }) {
  return (
    <svg
      viewBox="0 0 400 260"
      className="block h-full w-full"
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid slice"
    >
      {renderScene(scene)}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* The Storybook component                                             */
/* ------------------------------------------------------------------ */

export default function Storybook({
  story,
  onDone,
  onFinish,
}: {
  story: Story;
  onDone: () => void;
  onFinish: () => void;
}) {
  const pageCount = story.pages.length;
  const [pageIndex, setPageIndex] = useState(0);
  const lastPage = pageIndex >= pageCount - 1;
  const page = pageCount > 0 ? story.pages[Math.min(pageIndex, pageCount - 1)] : undefined;

  const goTo = useCallback(
    (i: number) => setPageIndex(Math.max(0, Math.min(pageCount - 1, i))),
    [pageCount]
  );
  const goNext = useCallback(() => goTo(pageIndex + 1), [goTo, pageIndex]);
  const goPrev = useCallback(() => goTo(pageIndex - 1), [goTo, pageIndex]);

  const handleClose = useCallback(() => {
    stopSpeaking();
    onDone();
  }, [onDone]);

  const handleFinish = useCallback(() => {
    stopSpeaking();
    playSfx('fanfare');
    onFinish();
  }, [onFinish]);

  // Luna reads each page aloud when it turns.
  useEffect(() => {
    if (pageCount === 0) return;
    unlockAudio();
    playSfx('whoosh');
    const t = window.setTimeout(() => {
      const p = story.pages[pageIndex];
      if (p) speakAs('luna', p.text);
    }, 450);
    return () => {
      window.clearTimeout(t);
      stopSpeaking();
    };
  }, [pageIndex, pageCount, story]);

  // Keyboard: arrows turn pages, Escape closes the book.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, handleClose]);

  const replay = () => {
    if (page) speakAs('luna', page.text);
  };

  if (!page) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900 p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Storybook"
      >
        <div className="rounded-kid-card bg-kid-cream p-10 text-center shadow-2xl">
          <p className="text-2xl font-black text-kid-ink-900">This storybook is empty.</p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-6 rounded-kid-pill bg-kid-sun-400 px-8 py-4 text-xl font-black text-kid-ink-900 shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Close book
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-kid-grape-700 via-[#3a2c6d] to-kid-ink-900 p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Storybook: ${story.title}`}
    >
      {/* Twinkling backdrop stars */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { left: '8%', top: '12%', d: '0s' },
          { left: '22%', top: '78%', d: '0.6s' },
          { left: '88%', top: '20%', d: '1.1s' },
          { left: '76%', top: '85%', d: '0.3s' },
          { left: '48%', top: '6%', d: '1.5s' },
          { left: '94%', top: '60%', d: '0.9s' },
        ].map((s, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="animate-kid-sparkle absolute h-6 w-6"
            style={{ left: s.left, top: s.top, animationDelay: s.d }}
          >
            <path
              d="M12 2 Q12.8 10 22 12 Q12.8 14 12 22 Q11.2 14 2 12 Q11.2 10 12 2 Z"
              fill="#FFF6C9"
              opacity={0.8}
            />
          </svg>
        ))}
      </div>

      {/* Close book */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close book"
        className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-3 text-white backdrop-blur transition-all hover:scale-110 hover:bg-white/30 active:scale-95"
      >
        <CloseIcon />
      </button>

      {/* Title */}
      <div className="relative mb-4 mt-10 text-center md:mt-0">
        <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-kid-sun-300">
          Luna&apos;s Storybook
        </p>
        <h1 className="mt-1 text-3xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] md:text-4xl">
          {story.title}
        </h1>
      </div>

      {/* Open book */}
      <div
        key={pageIndex}
        className="animate-kid-pop-in relative flex w-full max-w-5xl flex-col overflow-hidden rounded-kid-card border-4 border-white/70 bg-kid-cream shadow-2xl md:flex-row"
      >
        {/* Illustration page */}
        <div className="relative aspect-[16/10] w-full shrink-0 bg-kid-sky-300 md:aspect-auto md:min-h-[26rem] md:w-1/2">
          <SceneArt scene={sceneFor(story.id, pageIndex)} label={page.caption} />
          <p
            aria-hidden="true"
            className="absolute bottom-3 left-3 max-w-[80%] rounded-full bg-kid-ink-900/55 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm"
          >
            {page.caption}
          </p>
        </div>

        {/* Spine */}
        <div aria-hidden="true" className="hidden w-4 shrink-0 bg-gradient-to-r from-kid-ink-900/15 via-kid-ink-900/5 to-kid-ink-900/15 md:block" />

        {/* Text page */}
        <div className="flex min-w-0 flex-1 flex-col p-6 md:p-10">
          <p className="text-sm font-extrabold uppercase tracking-widest text-kid-grape-500">
            Page {pageIndex + 1} of {pageCount}
          </p>
          <p
            aria-live="polite"
            className="mt-3 flex-1 text-2xl font-extrabold leading-snug text-kid-ink-900 md:text-[2rem] md:leading-snug"
          >
            {page.text}
          </p>

          <button
            type="button"
            onClick={replay}
            className="mt-4 inline-flex items-center gap-2 self-start rounded-kid-pill bg-kid-grape-500/15 px-5 py-3 text-lg font-extrabold text-kid-grape-700 transition-all hover:scale-105 active:scale-95"
          >
            <SpeakerIcon />
            Hear Luna read
          </button>

          {lastPage && (
            <div className="mt-6 border-t-4 border-dashed border-kid-grape-400/40 pt-6 text-center">
              <p className="text-3xl font-black text-kid-grape-700">The End</p>
              <p className="mx-auto mt-3 max-w-md rounded-kid-card bg-kid-sun-300/50 px-5 py-4 text-xl font-bold text-kid-ink-900">
                {story.moral}
              </p>
              <button
                type="button"
                onClick={handleFinish}
                className="mt-5 rounded-kid-pill bg-kid-mint-500 px-10 py-5 text-2xl font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Finish story
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Page controls */}
      <div className="relative mt-6 flex w-full max-w-5xl items-center justify-between gap-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={pageIndex === 0}
          aria-label="Previous page"
          className="flex items-center gap-1 rounded-kid-pill bg-white/90 py-4 pl-4 pr-6 text-xl font-black text-kid-ink-900 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          <ChevronLeftIcon />
          Back
        </button>

        <div className="flex items-center gap-2" role="group" aria-label="Story pages">
          {story.pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === pageIndex}
              className={`h-4 rounded-full transition-all ${
                i === pageIndex
                  ? 'w-10 bg-kid-sun-400'
                  : 'w-4 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>

        {!lastPage ? (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next page"
            className="flex items-center gap-1 rounded-kid-pill bg-kid-sun-400 py-4 pl-6 pr-4 text-xl font-black text-kid-ink-900 shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Next
            <ChevronRightIcon />
          </button>
        ) : (
          <div aria-hidden="true" className="invisible flex items-center gap-1 py-4 pl-6 pr-4">
            <span className="text-xl font-black">Next</span>
            <ChevronRightIcon />
          </div>
        )}
      </div>
    </div>
  );
}
