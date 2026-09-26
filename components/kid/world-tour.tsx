'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateRound,
  MODES,
  ROUNDS_PER_GAME,
  CONTINENTS,
  getContinent,
  getAnimal,
  getLandmark,
  type GeoMode,
  type GeoRound,
} from '@/lib/kid/geography';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { useGameSession, GameWinScreen, AnswerFeedbackPanel } from './game-shell';
import { unlockItem } from '@/app/actions/collections';
import KidShell from '@/components/kid/kid-shell';
import HostCharacter from '@/components/kid/host-character';

export interface WorldTourProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Phase = 'intro' | 'play' | 'won';

const HOST = 'atlas';
const INTRO_LINE =
  'Hello, explorer! I am Atlas! Pack your bags! We will meet amazing animals, visit famous landmarks, and travel all seven continents. Off we go!';
const PRAISE = [
  'Wonderful exploring!',
  'That is the right continent!',
  'You are a true world traveler!',
  'Brilliant! The journey continues!',
];
const RETRY = [
  'Not quite! Look at the map and try again!',
  'Good guess! Which continent could it be?',
  'Almost, explorer! Tap another continent!',
];

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M10 24 h12 l14 -11 v38 l-14 -11 h-12 z" fill="#3B82F6" stroke="#17324F" strokeWidth="3" strokeLinejoin="round" />
      <path d="M42 24 q9 8 0 16" fill="none" stroke="#17324F" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 18 q13 14 0 28" fill="none" stroke="#17324F" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Animal pictograms — original cute SVG art, 64x64.                   */
/* ------------------------------------------------------------------ */

function Penguin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="penguin">
      <ellipse cx="32" cy="38" rx="14" ry="17" fill="#2D3A4A" />
      <ellipse cx="32" cy="42" rx="8" ry="11" fill="#FFFFFF" />
      <ellipse cx="32" cy="22" rx="10" ry="8" fill="#FFFFFF" />
      <circle cx="28" cy="20" r="2.2" fill="#17324F" />
      <circle cx="36" cy="20" r="2.2" fill="#17324F" />
      <path d="M29 25 L35 25 L32 29 Z" fill="#FF9D3C" stroke="#D97A1E" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="17" cy="38" rx="4" ry="9" fill="#22303F" transform="rotate(12 17 38)" />
      <ellipse cx="47" cy="38" rx="4" ry="9" fill="#22303F" transform="rotate(-12 47 38)" />
      <ellipse cx="25" cy="56" rx="5" ry="2.6" fill="#FF9D3C" />
      <ellipse cx="39" cy="56" rx="5" ry="2.6" fill="#FF9D3C" />
    </svg>
  );
}

function Kangaroo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="kangaroo">
      <path d="M28 44 C16 46 8 54 6 60 C16 58 26 52 32 46 Z" fill="#B97A3E" />
      <ellipse cx="34" cy="42" rx="11" ry="12" fill="#C98A4B" />
      <ellipse cx="24" cy="56" rx="9" ry="3.6" fill="#B97A3E" />
      <ellipse cx="42" cy="56" rx="6" ry="3" fill="#B97A3E" />
      <circle cx="42" cy="24" r="8" fill="#C98A4B" />
      <ellipse cx="38" cy="13" rx="2.6" ry="6" fill="#C98A4B" transform="rotate(-12 38 13)" />
      <ellipse cx="46" cy="13" rx="2.6" ry="6" fill="#C98A4B" transform="rotate(12 46 13)" />
      <ellipse cx="38" cy="13" rx="1.2" ry="3.4" fill="#F3D9AE" transform="rotate(-12 38 13)" />
      <ellipse cx="46" cy="13" rx="1.2" ry="3.4" fill="#F3D9AE" transform="rotate(12 46 13)" />
      <circle cx="44" cy="23" r="2" fill="#17324F" />
      <ellipse cx="48" cy="28" rx="3" ry="2.2" fill="#F3D9AE" />
      <ellipse cx="28" cy="42" rx="3.4" ry="6" fill="#B97A3E" transform="rotate(18 28 42)" />
    </svg>
  );
}

function Koala({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="koala">
      <circle cx="17" cy="20" r="9" fill="#8A97A8" />
      <circle cx="47" cy="20" r="9" fill="#8A97A8" />
      <circle cx="17" cy="20" r="4.5" fill="#F3C6D3" />
      <circle cx="47" cy="20" r="4.5" fill="#F3C6D3" />
      <circle cx="32" cy="32" r="15" fill="#9AA7B8" />
      <ellipse cx="32" cy="36" rx="5.5" ry="7.5" fill="#3A4356" />
      <circle cx="25" cy="28" r="2.4" fill="#17324F" />
      <circle cx="39" cy="28" r="2.4" fill="#17324F" />
      <ellipse cx="32" cy="54" rx="10" ry="6" fill="#8A97A8" />
    </svg>
  );
}

function Panda({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="panda">
      <circle cx="20" cy="16" r="6.5" fill="#2D3A4A" />
      <circle cx="44" cy="16" r="6.5" fill="#2D3A4A" />
      <circle cx="32" cy="32" r="16" fill="#FFFFFF" stroke="#D8DEE8" strokeWidth="2" />
      <ellipse cx="25" cy="30" rx="4.5" ry="5.5" fill="#2D3A4A" transform="rotate(-18 25 30)" />
      <ellipse cx="39" cy="30" rx="4.5" ry="5.5" fill="#2D3A4A" transform="rotate(18 39 30)" />
      <circle cx="25" cy="29" r="1.8" fill="#FFFFFF" />
      <circle cx="39" cy="29" r="1.8" fill="#FFFFFF" />
      <ellipse cx="32" cy="39" rx="3" ry="2.2" fill="#2D3A4A" />
      <ellipse cx="18" cy="48" rx="5" ry="8" fill="#2D3A4A" transform="rotate(20 18 48)" />
      <ellipse cx="46" cy="48" rx="5" ry="8" fill="#2D3A4A" transform="rotate(-20 46 48)" />
    </svg>
  );
}

function Tiger({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="tiger">
      <path d="M46 44 C56 44 60 52 58 60 C52 58 46 52 44 46 Z" fill="#FF9D3C" />
      <path d="M50 48 l4 -1 M52 53 l4 -1" stroke="#17324F" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="30" cy="42" rx="14" ry="10" fill="#FF9D3C" />
      <path d="M20 38 l5 2 M20 44 l5 1 M38 36 l5 -2 M40 42 l5 -1" stroke="#17324F" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="30" cy="22" r="11" fill="#FF9D3C" />
      <path d="M24 14 l4 5 M36 14 l-4 5" stroke="#17324F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M20 12 L24 4 L28 11 Z" fill="#FF9D3C" stroke="#D97A1E" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M32 11 L36 4 L40 12 Z" fill="#FF9D3C" stroke="#D97A1E" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="26" cy="21" r="2" fill="#17324F" />
      <circle cx="34" cy="21" r="2" fill="#17324F" />
      <path d="M28 27 Q30 29 32 27" stroke="#17324F" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Camel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="camel">
      <circle cx="23" cy="34" r="6.5" fill="#D9A05B" />
      <circle cx="36" cy="34" r="6.5" fill="#D9A05B" />
      <ellipse cx="30" cy="44" rx="15" ry="9" fill="#D9A05B" />
      <rect x="22" y="38" width="16" height="7" rx="2" fill="#E8574D" />
      <path d="M42 40 C44 32 44 24 46 16 L52 16 C50 24 50 32 48 40 Z" fill="#D9A05B" />
      <ellipse cx="49" cy="14" rx="6" ry="5" fill="#D9A05B" />
      <ellipse cx="45" cy="9" rx="2" ry="3" fill="#D9A05B" />
      <circle cx="50" cy="13" r="1.6" fill="#17324F" />
      <rect x="18" y="48" width="5" height="10" rx="2" fill="#B97F3E" />
      <rect x="28" y="48" width="5" height="10" rx="2" fill="#B97F3E" />
      <rect x="38" y="48" width="5" height="10" rx="2" fill="#B97F3E" />
    </svg>
  );
}

function Elephant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="elephant">
      <ellipse cx="19" cy="32" rx="8" ry="11" fill="#8A97A8" />
      <circle cx="30" cy="38" r="14" fill="#9AA7B8" />
      <circle cx="40" cy="28" r="10" fill="#9AA7B8" />
      <path d="M46 30 C52 34 52 44 46 50 C44 52 40 50 42 46 C45 41 45 36 42 33 Z" fill="#9AA7B8" stroke="#7E8A9C" strokeWidth="1.5" />
      <path d="M36 34 L40 40 L34 38 Z" fill="#FFFFFF" />
      <circle cx="41" cy="25" r="2" fill="#17324F" />
      <rect x="20" y="46" width="6" height="11" rx="3" fill="#8A97A8" />
      <rect x="32" y="46" width="6" height="11" rx="3" fill="#8A97A8" />
      <path d="M18 44 C12 42 8 44 6 48" stroke="#8A97A8" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Toucan({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="toucan">
      <path d="M20 40 L8 56 L16 58 L28 46 Z" fill="#22303F" />
      <ellipse cx="30" cy="42" rx="11" ry="12" fill="#2D3A4A" />
      <circle cx="34" cy="22" r="10" fill="#2D3A4A" />
      <path d="M28 24 C26 30 28 36 32 38 C28 38 24 34 24 28 Z" fill="#FFFFFF" />
      <path d="M40 18 L60 26 L40 32 C44 28 44 22 40 18 Z" fill="#FF9D3C" stroke="#D97A1E" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="35" cy="20" r="2.2" fill="#FFFFFF" />
      <circle cx="35.5" cy="20" r="1.2" fill="#17324F" />
      <rect x="24" y="52" width="4" height="7" rx="2" fill="#5B7FA6" />
      <rect x="32" y="52" width="4" height="7" rx="2" fill="#5B7FA6" />
    </svg>
  );
}

function Llama({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="llama">
      <ellipse cx="26" cy="46" rx="13" ry="9" fill="#E8C98F" />
      <circle cx="36" cy="42" r="7" fill="#F3DDAE" />
      <path d="M34 40 C36 30 36 22 38 14 L46 14 C44 22 44 30 42 40 Z" fill="#E8C98F" />
      <ellipse cx="42" cy="12" rx="6.5" ry="5.5" fill="#E8C98F" />
      <ellipse cx="38" cy="6" rx="2" ry="3.4" fill="#E8C98F" />
      <ellipse cx="46" cy="6" rx="2" ry="3.4" fill="#E8C98F" />
      <circle cx="43" cy="11" r="1.6" fill="#17324F" />
      <ellipse cx="47" cy="15" rx="2.6" ry="2" fill="#F3DDAE" />
      <rect x="18" y="50" width="4.5" height="9" rx="2" fill="#C9A86B" />
      <rect x="28" y="50" width="4.5" height="9" rx="2" fill="#C9A86B" />
      <circle cx="14" cy="44" r="4" fill="#F3DDAE" />
    </svg>
  );
}

function PolarBear({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="polar bear">
      <ellipse cx="32" cy="42" rx="15" ry="11" fill="#F5FAFF" stroke="#C9D9E8" strokeWidth="2" />
      <circle cx="32" cy="22" r="10" fill="#F5FAFF" stroke="#C9D9E8" strokeWidth="2" />
      <circle cx="24" cy="14" r="3.4" fill="#F5FAFF" stroke="#C9D9E8" strokeWidth="1.6" />
      <circle cx="40" cy="14" r="3.4" fill="#F5FAFF" stroke="#C9D9E8" strokeWidth="1.6" />
      <circle cx="28" cy="20" r="2" fill="#17324F" />
      <circle cx="36" cy="20" r="2" fill="#17324F" />
      <ellipse cx="32" cy="26" rx="3" ry="2.2" fill="#17324F" />
      <ellipse cx="22" cy="50" rx="5" ry="3.4" fill="#EAF2FA" />
      <ellipse cx="42" cy="50" rx="5" ry="3.4" fill="#EAF2FA" />
    </svg>
  );
}

function Fox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="fox">
      <path d="M16 44 C8 46 4 54 6 60 C14 58 20 52 22 46 Z" fill="#E8734A" />
      <path d="M6 60 C8 57 12 55 15 55 C12 57 10 59 9 61 Z" fill="#FFFFFF" />
      <ellipse cx="34" cy="44" rx="12" ry="9" fill="#E8734A" />
      <ellipse cx="30" cy="46" rx="6" ry="5" fill="#FFFFFF" />
      <circle cx="44" cy="26" r="9" fill="#E8734A" />
      <path d="M37 20 L36 10 L43 16 Z" fill="#E8734A" stroke="#C25A35" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M47 16 L52 10 L51 21 Z" fill="#E8734A" stroke="#C25A35" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M36 10 L37.5 14 L40 15 L38 11 Z" fill="#3A2E2E" />
      <path d="M52 10 L50.5 14 L48 15 L50 11 Z" fill="#3A2E2E" />
      <circle cx="41" cy="25" r="1.8" fill="#17324F" />
      <circle cx="47" cy="25" r="1.8" fill="#17324F" />
      <path d="M43 31 L45 31 L44 33 Z" fill="#3A2E2E" />
      <rect x="28" y="50" width="4.5" height="8" rx="2" fill="#C25A35" />
      <rect x="38" y="50" width="4.5" height="8" rx="2" fill="#C25A35" />
    </svg>
  );
}

const ANIMAL_ART: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  penguin: Penguin,
  kangaroo: Kangaroo,
  koala: Koala,
  panda: Panda,
  tiger: Tiger,
  camel: Camel,
  elephant: Elephant,
  toucan: Toucan,
  llama: Llama,
  'polar-bear': PolarBear,
  fox: Fox,
};

/* ------------------------------------------------------------------ */
/* Landmark icons — original tiny SVG art, 64x64.                      */
/* ------------------------------------------------------------------ */

function EiffelTower({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Eiffel Tower">
      <path d="M32 6 L22 56 L26 56 L32 14 L38 56 L42 56 Z" fill="#8A6D4B" />
      <path d="M28 22 L36 22 M26 34 L38 34 M24 46 L40 46" stroke="#6E5639" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 56 C24 50 40 50 42 56 Z" fill="#6E5639" />
      <rect x="30" y="2" width="4" height="6" rx="2" fill="#6E5639" />
    </svg>
  );
}

function BigBen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Big Ben">
      <path d="M32 4 L38 14 L26 14 Z" fill="#5B7FA6" />
      <rect x="24" y="14" width="16" height="42" rx="2" fill="#D9B98A" stroke="#B8955F" strokeWidth="2" />
      <circle cx="32" cy="28" r="8" fill="#FFFFFF" stroke="#17324F" strokeWidth="2" />
      <line x1="32" y1="28" x2="32" y2="22" stroke="#17324F" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="28" x2="36" y2="30" stroke="#17324F" strokeWidth="2" strokeLinecap="round" />
      <rect x="24" y="42" width="16" height="4" fill="#B8955F" />
    </svg>
  );
}

function Pyramids({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Pyramids">
      <circle cx="48" cy="14" r="7" fill="#FFD93C" />
      <path d="M8 50 L26 20 L44 50 Z" fill="#D9A05B" stroke="#B97F3E" strokeWidth="2" strokeLinejoin="round" />
      <path d="M34 50 L46 30 L58 50 Z" fill="#C98A4B" stroke="#B97F3E" strokeWidth="2" strokeLinejoin="round" />
      <rect x="4" y="50" width="56" height="8" rx="2" fill="#E8C98F" />
    </svg>
  );
}

function GreatWall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Great Wall">
      <ellipse cx="32" cy="52" rx="28" ry="9" fill="#7BD88A" />
      <rect x="8" y="36" width="48" height="12" rx="2" fill="#9AA7B8" />
      <path d="M8 36 h6 v-6 h5 v6 h6 v-6 h5 v6 h6 v-6 h5 v6 h6 v-6 h5 v6 h4 v6 h-48 Z" fill="#8A97A8" />
      <rect x="26" y="24" width="12" height="12" rx="1" fill="#7E8A9C" />
      <path d="M26 24 h3 v-4 h2 v4 h3 v-4 h2 v4 h2 v4 h-12 Z" fill="#6E7A8C" />
    </svg>
  );
}

function TajMahal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Taj Mahal">
      <rect x="16" y="38" width="32" height="16" rx="2" fill="#F5F0E8" stroke="#D8D0C2" strokeWidth="1.6" />
      <path d="M32 10 C40 18 42 26 42 32 C42 36 37 38 32 38 C27 38 22 36 22 32 C22 26 24 18 32 10 Z" fill="#FFFFFF" stroke="#D8D0C2" strokeWidth="1.6" />
      <rect x="31" y="4" width="2" height="7" fill="#C9A86B" />
      <rect x="8" y="24" width="5" height="30" rx="2" fill="#F5F0E8" stroke="#D8D0C2" strokeWidth="1.4" />
      <rect x="51" y="24" width="5" height="30" rx="2" fill="#F5F0E8" stroke="#D8D0C2" strokeWidth="1.4" />
      <circle cx="10.5" cy="22" r="3" fill="#FFFFFF" stroke="#D8D0C2" strokeWidth="1.2" />
      <circle cx="53.5" cy="22" r="3" fill="#FFFFFF" stroke="#D8D0C2" strokeWidth="1.2" />
      <path d="M28 46 a4 4 0 0 1 8 0 v8 h-8 Z" fill="#5B7FA6" />
    </svg>
  );
}

function StatueOfLiberty({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Statue of Liberty">
      <rect x="22" y="50" width="20" height="8" rx="2" fill="#8A97A8" />
      <path d="M32 24 L22 50 L42 50 Z" fill="#7BC4B5" stroke="#5AA898" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="32" cy="20" r="5" fill="#7BC4B5" stroke="#5AA898" strokeWidth="1.6" />
      <path d="M24 18 l-4 -4 M28 15 l-2 -5 M32 14 l0 -5 M36 15 l2 -5 M40 18 l4 -4" stroke="#5AA898" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 30 L46 14" stroke="#7BC4B5" strokeWidth="5" strokeLinecap="round" />
      <rect x="43" y="6" width="6" height="9" rx="2" fill="#8A6D4B" />
      <path d="M46 6 c-3 -2 -3 -6 0 -8 c3 2 3 6 0 8" fill="#FF9D3C" />
    </svg>
  );
}

function ChristRedeemer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Christ the Redeemer">
      <path d="M6 56 L24 30 L44 56 Z" fill="#5FA96B" />
      <path d="M40 56 L52 40 L62 56 Z" fill="#4E8F5A" />
      <rect x="29" y="16" width="6" height="24" rx="3" fill="#9AA7B8" />
      <rect x="20" y="22" width="24" height="6" rx="3" fill="#9AA7B8" />
      <circle cx="32" cy="12" r="4.5" fill="#9AA7B8" />
    </svg>
  );
}

function SydneyOperaHouse({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Sydney Opera House">
      <rect x="4" y="44" width="56" height="6" rx="2" fill="#8A6D4B" />
      <rect x="4" y="50" width="56" height="10" rx="3" fill="#4CC9F0" />
      <path d="M12 44 C12 32 18 24 26 22 C24 30 22 37 22 44 Z" fill="#FFFFFF" stroke="#D8DEE8" strokeWidth="1.6" />
      <path d="M26 44 C26 30 34 22 44 20 C40 28 38 36 38 44 Z" fill="#FFFFFF" stroke="#D8DEE8" strokeWidth="1.6" />
      <path d="M42 44 C42 34 48 28 54 27 C52 33 51 39 51 44 Z" fill="#F5F0E8" stroke="#D8DEE8" strokeWidth="1.6" />
    </svg>
  );
}

const LANDMARK_ART: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  'eiffel-tower': EiffelTower,
  'big-ben': BigBen,
  pyramids: Pyramids,
  'great-wall': GreatWall,
  'taj-mahal': TajMahal,
  'statue-of-liberty': StatueOfLiberty,
  'christ-redeemer': ChristRedeemer,
  'sydney-opera-house': SydneyOperaHouse,
};

/* ------------------------------------------------------------------ */
/* Stylized world map — big tappable continent blobs, clearly labeled. */
/* Simplified shapes, not geographically precise.                      */
/* ------------------------------------------------------------------ */

interface BlobDef {
  id: string;
  path: string;
  fill: string;
  labelX: number;
  labelY: number;
  lines: string[];
}

const BLOBS: BlobDef[] = [
  {
    id: 'north-america',
    path: 'M60 40 C80 28 120 28 138 44 C152 58 148 84 128 94 C108 104 78 102 62 90 C48 79 48 52 60 40 Z',
    fill: '#FFD93C',
    labelX: 100,
    labelY: 62,
    lines: ['North', 'America'],
  },
  {
    id: 'south-america',
    path: 'M84 122 C104 116 124 124 128 146 C132 172 122 200 108 210 C94 219 78 208 74 184 C70 160 72 130 84 122 Z',
    fill: '#7BD88A',
    labelX: 101,
    labelY: 166,
    lines: ['South', 'America'],
  },
  {
    id: 'europe',
    path: 'M196 44 C212 34 240 36 248 50 C254 62 244 76 226 78 C208 80 192 68 192 56 C192 50 193 47 196 44 Z',
    fill: '#B983FF',
    labelX: 220,
    labelY: 60,
    lines: ['Europe'],
  },
  {
    id: 'africa',
    path: 'M204 100 C226 92 254 98 260 118 C266 140 258 170 244 186 C230 201 210 194 202 172 C194 150 194 110 204 100 Z',
    fill: '#FF9D5C',
    labelX: 230,
    labelY: 148,
    lines: ['Africa'],
  },
  {
    id: 'asia',
    path: 'M276 44 C310 28 360 30 384 52 C402 70 394 100 368 108 C340 117 300 112 282 96 C266 81 264 56 276 44 Z',
    fill: '#FF7B9C',
    labelX: 330,
    labelY: 72,
    lines: ['Asia'],
  },
  {
    id: 'australia',
    path: 'M298 172 C318 162 352 164 362 180 C370 194 358 210 336 214 C314 218 296 206 294 190 C293 182 294 176 298 172 Z',
    fill: '#4CC9F0',
    labelX: 329,
    labelY: 192,
    lines: ['Australia'],
  },
  {
    id: 'antarctica',
    path: 'M70 252 C140 242 280 242 350 252 C360 262 356 276 340 280 C260 288 160 288 80 280 C64 276 62 262 70 252 Z',
    fill: '#EAF6FF',
    labelX: 210,
    labelY: 268,
    lines: ['Antarctica'],
  },
];

function WorldMap({
  picked,
  onPick,
}: {
  picked: { id: string; correct: boolean } | null;
  onPick: (continentId: string) => void;
}) {
  return (
    <div className="w-full rounded-kid-card border-4 border-white/60 bg-[#2E7FC4] p-2 shadow-2xl">
      <svg viewBox="0 0 420 300" className="h-auto w-full" role="group" aria-label="World map. Tap a continent.">
        {BLOBS.map((blob) => {
          const isPicked = picked?.id === blob.id;
          const continent = getContinent(blob.id);
          return (
            <g
              key={blob.id}
              role="button"
              tabIndex={0}
              aria-label={`Choose ${continent?.name ?? blob.id}`}
              onClick={() => onPick(blob.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPick(blob.id);
                }
              }}
              className={`cursor-pointer outline-none ${isPicked && !picked.correct ? 'animate-kid-shake' : ''}`}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <path
                d={blob.path}
                fill={isPicked && picked.correct ? '#FFE66D' : blob.fill}
                stroke={isPicked ? '#17324F' : '#FFFFFF'}
                strokeWidth={isPicked ? 5 : 3}
                style={
                  isPicked && picked.correct
                    ? { filter: 'drop-shadow(0 0 10px rgba(255,201,60,0.9))' }
                    : undefined
                }
              />
              <text
                x={blob.labelX}
                y={blob.labelY}
                textAnchor="middle"
                fontSize={blob.lines.length > 1 ? 12 : 14}
                fontWeight="800"
                fill="#17324F"
                pointerEvents="none"
              >
                {blob.lines.map((line, i) => (
                  <tspan key={line} x={blob.labelX} dy={i === 0 ? -(blob.lines.length - 1) * 7 : 14}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Round visual: the animal, landmark, or Atlas-says line.             */
/* ------------------------------------------------------------------ */

function RoundVisual({ round }: { round: GeoRound }) {
  if (round.mode === 'animal' && round.animalId) {
    const Animal = ANIMAL_ART[round.animalId];
    const animal = getAnimal(round.animalId);
    return (
      <div className="animate-kid-pop-in flex flex-col items-center">
        <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/70 bg-white/85 shadow-xl md:h-44 md:w-44">
          {Animal && <Animal className="h-28 w-28 md:h-36 md:w-36" />}
        </div>
        <p className="mt-2 text-xl font-black capitalize text-white drop-shadow-[0_2px_6px_rgba(23,50,79,0.55)] md:text-2xl">
          the {animal?.name}
        </p>
      </div>
    );
  }
  if (round.mode === 'landmark' && round.landmarkId) {
    const Landmark = LANDMARK_ART[round.landmarkId];
    const landmark = getLandmark(round.landmarkId);
    return (
      <div className="animate-kid-pop-in flex flex-col items-center">
        <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/70 bg-white/85 shadow-xl md:h-44 md:w-44">
          {Landmark && <Landmark className="h-28 w-28 md:h-36 md:w-36" />}
        </div>
        <p className="mt-2 text-xl font-black capitalize text-white drop-shadow-[0_2px_6px_rgba(23,50,79,0.55)] md:text-2xl">
          {landmark?.name}
        </p>
      </div>
    );
  }
  return (
    <div className="animate-kid-pop-in flex w-full max-w-xl flex-col items-center rounded-kid-card border-4 border-white/60 bg-white/85 px-6 py-4 shadow-xl">
      <p className="text-center text-xl font-black text-kid-ink-900 md:text-2xl">
        {round.prompt.split('___').map((part, i, arr) => (
          <span key={i}>
            {part}
            {i < arr.length - 1 && (
              <span className="mx-1 inline-block rounded-lg bg-kid-sun-300 px-3 text-kid-ink-900">?</span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

const MODE_LABEL: Record<GeoMode, string> = {
  animal: 'Animal Homes',
  landmark: 'Landmark Match',
  fact: 'Atlas Says',
};

/* ------------------------------------------------------------------ */
/* Main game.                                                          */
/* ------------------------------------------------------------------ */

export default function WorldTour({ childId, nickname = 'friend', onExit }: WorldTourProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [gameSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<{ id: string; correct: boolean } | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const session = useGameSession({
    childId,
    gameKey: 'geography_game',
    stickerId: 'globe-trotter',
    trophyEvent: 'geography_done',
    milestone: 'world_tour_win',
    learning: { gameId: 'world-tour', skill: 'continents_oceans' },
  });
  const starBalance = session.starBalance ?? 0;
  const timers = useRef<number[]>([]);

  const mode: GeoMode = MODES[roundIndex % MODES.length];
  const round = generateRound(mode, gameSeed + roundIndex * 7919);

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

  const startGame = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setRoundIndex(0);
    setAttempts(0);
    setCorrectCount(0);
    setPicked(null);
    setStarsEarned(0);
    setPhase('play');
    playSfx('whoosh');
    later(400, () => {
      const first = generateRound(MODES[0], gameSeed);
      speakAs(HOST, first.spoken);
    });
  }, [gameSeed, later]);

  const handleWin = useCallback(
    async (finalAttempts: number) => {
      // 3 stars for a perfect tour (8 tries), 2 for <= 12, else 1.
      const stars = finalAttempts === ROUNDS_PER_GAME ? 3 : finalAttempts <= 12 ? 2 : 1;
      setStarsEarned(stars);
      setPhase('won');
      playSfx('fanfare');
      speakAs(
        HOST,
        `Incredible journey, ${nickname}! You visited every corner of the map! You earned ${stars} stars!`
      );
      // Bespoke game logic (not part of the shared reward sequence):
      // unlock every animal met on the tour into the child's animal book.
      try {
        const seen = new Set<string>();
        for (let i = 0; i < ROUNDS_PER_GAME; i += 1) {
          const r = generateRound(MODES[i % MODES.length], gameSeed + i * 7919);
          if (r.mode === 'animal' && r.animalId) seen.add(r.animalId);
        }
        await Promise.all([...seen].map((id) => unlockItem(childId, 'animals', id).catch(() => {})));
      } catch {
        /* animal-book unlocks are best-effort; the celebration still stands */
      }
      await session.complete({ stars, extraMetadata: { attempts: finalAttempts } });
    },
    [childId, nickname, gameSeed, session]
  );

  const choose = useCallback(
    (continentId: string) => {
      if (picked || phase !== 'play') return;
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      session.recordAnswer(continentId === round.answer, {
        skill: round.mode === 'animal' ? 'world_animals' : round.mode === 'landmark' ? 'landmarks' : 'continents_oceans',
        itemKey: `${gameSeed}-${roundIndex}`,
      });
      if (continentId === round.answer) {
        playSfx('correct');
        setPicked({ id: continentId, correct: true });
        const nextCorrect = correctCount + 1;
        setCorrectCount(nextCorrect);
        const continent = getContinent(continentId);
        speakAs(HOST, `${PRAISE[roundIndex % PRAISE.length]} ${continent?.fact ?? ''}`);
        later(1400, () => {
          setPicked(null);
          if (nextCorrect >= ROUNDS_PER_GAME) {
            void handleWin(nextAttempts);
          } else {
            setRoundIndex((i) => i + 1);
            const nextMode = MODES[(roundIndex + 1) % MODES.length];
            const next = generateRound(nextMode, gameSeed + (roundIndex + 1) * 7919);
            later(400, () => speakAs(HOST, next.spoken));
          }
        });
      } else {
        playSfx('wrong');
        setPicked({ id: continentId, correct: false });
        speakAs(HOST, RETRY[attempts % RETRY.length]);
        later(900, () => setPicked(null));
      }
    },
    [picked, phase, attempts, round, roundIndex, correctCount, gameSeed, later, handleWin, session]
  );

  const speakQuestion = useCallback(() => {
    speakAs(HOST, round.spoken);
  }, [round]);

  return (
    <KidShell onExit={onExit} points={phase === 'won' ? starBalance : 0}>
      {phase === 'intro' && (
        <div className="flex w-full max-w-2xl flex-col items-center px-4 text-center">
          <HostCharacter characterId={HOST} mood="happy" />
          <h1 className="animate-kid-rise mt-2 text-3xl font-black text-kid-ink-900 md:text-5xl">
            Atlas World Tour
          </h1>
          <p
            className="animate-kid-rise mt-2 max-w-xl text-lg font-bold text-kid-ink-700 md:text-xl"
            style={{ animationDelay: '0.1s' }}
          >
            Find animal homes, match famous landmarks, and answer Atlas on a trip around all seven continents!
          </p>
          <button
            type="button"
            onClick={() => {
              playSfx('pop');
              speakAs(HOST, INTRO_LINE);
              startGame();
            }}
            className="animate-kid-rise mt-6 rounded-full border-b-8 border-kid-sun-600 bg-kid-sun-400 px-12 py-4 text-2xl font-black text-kid-ink-900 shadow-[0_14px_30px_rgba(255,201,60,0.45)] transition-all hover:scale-105 active:scale-95"
            style={{ animationDelay: '0.2s' }}
          >
            Start the tour!
          </button>
        </div>
      )}

      {phase === 'play' && (
        <div className="flex w-full max-w-4xl flex-col items-center px-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="rounded-full bg-white px-4 py-2 shadow-lg">
              <span className="text-base font-black text-kid-ink-900 md:text-lg">World Tour</span>
              <span className="ml-2 text-sm font-bold text-kid-ink-700">with Atlas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white px-4 py-2 text-base font-black text-kid-ink-900 shadow-lg md:text-lg">
                {MODE_LABEL[mode]}
              </div>
              <button
                type="button"
                onClick={speakQuestion}
                aria-label="Hear the question read aloud"
                className="flex min-h-[56px] items-center gap-2 rounded-full bg-white px-5 py-2 text-base font-black text-kid-ink-900 shadow-lg transition-transform active:scale-95"
              >
                <SpeakerIcon className="h-8 w-8" />
                Hear it
              </button>
              <div className="rounded-full bg-white px-4 py-2 text-base font-black tabular-nums text-kid-ink-900 shadow-lg md:text-lg">
                {correctCount} / {ROUNDS_PER_GAME}
              </div>
            </div>
          </div>

          <div key={`${gameSeed}-${roundIndex}`} className="mt-2 flex w-full flex-col items-center gap-3">
            <p className="animate-kid-rise text-center text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(23,50,79,0.55)] md:text-3xl">
              {round.prompt}
            </p>
            <RoundVisual round={round} />
            <div className="w-full max-w-2xl">
              <WorldMap picked={picked} onPick={choose} />
            </div>
            <p className="text-sm font-bold text-white/90 drop-shadow-[0_1px_4px_rgba(23,50,79,0.5)]" aria-live="polite">
              {picked?.correct
                ? 'That is right! On to the next stop!'
                : picked
                  ? 'Try again, explorer!'
                  : 'Tap the right continent on the map!'}
            </p>
          </div>
        </div>
      )}

      <AnswerFeedbackPanel feedback={session.feedback} />

      {phase === 'won' && (
        <GameWinScreen
          stars={starsEarned}
          nickname={nickname}
          title={`World traveler, ${nickname}!`}
          message={`You toured all ${ROUNDS_PER_GAME} stops in ${attempts} tries and earned`}
          stickerId="globe-trotter"
          hostAvatar={<HostCharacter characterId={HOST} mood="cheer" />}
          onPlayAgain={startGame}
          onExit={onExit}
          playAgainLabel="Tour again"
        />
      )}
    </KidShell>
  );
}
