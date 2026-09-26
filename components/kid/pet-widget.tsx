'use client';

import { useEffect, useState } from 'react';
import { getPet } from '@/app/actions/pets';
import { getSpecies, type Pet, type PetSpecies, type PetStage } from '@/lib/kid/pets';
import type { SessionChild } from '@/lib/kid/types';

/** Shared gradient id prefix helper (unique per species+stage to avoid collisions). */
function gid(species: PetSpecies, suffix: string) {
  return `pet-${species}-${suffix}`;
}

function EggArt({ species, cracks }: { species: PetSpecies; cracks: number }) {
  const info = getSpecies(species);
  const [c0, c1] = info.eggColors;
  const id = gid(species, 'egg');
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label={`${info.displayName} egg`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c0} />
          <stop offset="1" stopColor={c1} />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="108" rx="30" ry="6" fill="#17324F" opacity="0.12" />
      <path
        d="M60 18 C84 18 96 52 96 74 C96 96 80 106 60 106 C40 106 24 96 24 74 C24 52 36 18 60 18 Z"
        fill={`url(#${id})`}
        stroke="#ffffff"
        strokeWidth="4"
      />
      <circle cx="48" cy="60" r="7" fill="#ffffff" opacity="0.55" />
      <circle cx="70" cy="82" r="5" fill="#ffffff" opacity="0.45" />
      <circle cx="62" cy="42" r="4" fill="#ffffff" opacity="0.5" />
      {cracks >= 1 && (
        <path d="M52 30 L58 46 L50 58 L60 72" fill="none" stroke="#8A6D3B" strokeWidth="3" strokeLinecap="round" />
      )}
      {cracks >= 2 && (
        <path d="M70 34 L64 50 L74 62 L66 78" fill="none" stroke="#8A6D3B" strokeWidth="3" strokeLinecap="round" />
      )}
    </svg>
  );
}

function Sparkles() {
  const star = 'M0,-9 C1.5,-2.5 2.5,-1.5 9,0 C2.5,1.5 1.5,2.5 0,9 C-1.5,2.5 -2.5,1.5 -9,0 C-2.5,-1.5 -1.5,-2.5 0,-9 Z';
  return (
    <g className="animate-kid-sparkle" fill="#FFF3B0" stroke="#F5B301" strokeWidth="1.5">
      <path d={star} transform="translate(18,24) scale(0.9)" />
      <path d={star} transform="translate(102,30) scale(0.7)" />
      <path d={star} transform="translate(96,96) scale(1)" />
      <path d={star} transform="translate(22,92) scale(0.6)" />
    </g>
  );
}

function BumblePup() {
  return (
    <g>
      <ellipse cx="60" cy="110" rx="32" ry="6" fill="#17324F" opacity="0.12" />
      <path d="M90 80 Q108 76 104 54" fill="none" stroke="#F5A623" strokeWidth="11" strokeLinecap="round" />
      <rect x="42" y="92" width="13" height="15" rx="6.5" fill="#E8930C" />
      <rect x="65" y="92" width="13" height="15" rx="6.5" fill="#E8930C" />
      <ellipse cx="60" cy="74" rx="28" ry="24" fill="#FFC93C" />
      <path d="M37 66 Q60 58 83 66" fill="none" stroke="#8B5E34" strokeWidth="6" strokeLinecap="round" />
      <path d="M35 80 Q60 72 85 80" fill="none" stroke="#8B5E34" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="38" cy="32" rx="8" ry="14" fill="#E8930C" transform="rotate(-24 38 32)" />
      <ellipse cx="82" cy="32" rx="8" ry="14" fill="#E8930C" transform="rotate(24 82 32)" />
      <circle cx="60" cy="42" r="21" fill="#FFD97A" />
      <ellipse cx="38" cy="32" rx="3.5" ry="7" fill="#FFE9C4" transform="rotate(-24 38 32)" />
      <ellipse cx="82" cy="32" rx="3.5" ry="7" fill="#FFE9C4" transform="rotate(24 82 32)" />
      <circle cx="52" cy="40" r="3.6" fill="#2B2B2B" />
      <circle cx="68" cy="40" r="3.6" fill="#2B2B2B" />
      <circle cx="53.2" cy="38.8" r="1.2" fill="#fff" />
      <circle cx="69.2" cy="38.8" r="1.2" fill="#fff" />
      <ellipse cx="60" cy="50" rx="9" ry="7" fill="#FFF3D6" />
      <path d="M55 47 Q60 44 65 47 Q64 52 60 52 Q56 52 55 47 Z" fill="#5B3A1E" />
      <path d="M60 52 Q60 56 56 57 M60 52 Q60 56 64 57" fill="none" stroke="#5B3A1E" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function CloudKitten() {
  return (
    <g>
      <ellipse cx="60" cy="108" rx="34" ry="6" fill="#17324F" opacity="0.12" />
      <path d="M46 54 L38 28 L60 44 Z" fill="#E8F4FF" stroke="#A9CFF2" strokeWidth="3" strokeLinejoin="round" />
      <path d="M74 54 L82 28 L60 44 Z" fill="#E8F4FF" stroke="#A9CFF2" strokeWidth="3" strokeLinejoin="round" />
      <path d="M47 47 L43 34 L54 42 Z" fill="#FFC9D6" />
      <path d="M73 47 L77 34 L66 42 Z" fill="#FFC9D6" />
      <circle cx="44" cy="72" r="17" fill="#F7FBFF" />
      <circle cx="60" cy="64" r="22" fill="#F7FBFF" />
      <circle cx="76" cy="72" r="17" fill="#F7FBFF" />
      <ellipse cx="60" cy="80" rx="24" ry="16" fill="#F7FBFF" />
      <circle cx="52" cy="70" r="3.6" fill="#2B2B2B" />
      <circle cx="68" cy="70" r="3.6" fill="#2B2B2B" />
      <circle cx="53.2" cy="68.8" r="1.2" fill="#fff" />
      <circle cx="69.2" cy="68.8" r="1.2" fill="#fff" />
      <path d="M57 77 L63 77 L60 80 Z" fill="#F27BB5" strokeLinejoin="round" />
      <path d="M60 80 Q55 85 50 83 M60 80 Q65 85 70 83" fill="none" stroke="#5B6B7C" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="46" cy="78" rx="5" ry="3.4" fill="#FFC9D6" opacity="0.8" />
      <ellipse cx="74" cy="78" rx="5" ry="3.4" fill="#FFC9D6" opacity="0.8" />
      <path d="M34 74 L22 71 M34 79 L23 80 M86 74 L98 71 M86 79 L97 80" stroke="#A9CFF2" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="44" cy="96" rx="8" ry="6" fill="#E8F4FF" />
      <ellipse cx="76" cy="96" rx="8" ry="6" fill="#E8F4FF" />
    </g>
  );
}

function SproutTurtle() {
  return (
    <g>
      <ellipse cx="60" cy="108" rx="36" ry="6" fill="#17324F" opacity="0.12" />
      <path d="M30 88 L20 84 L28 78 Z" fill="#A8E6A1" strokeLinejoin="round" />
      <ellipse cx="38" cy="94" rx="8" ry="6" fill="#A8E6A1" />
      <ellipse cx="56" cy="98" rx="8" ry="6" fill="#A8E6A1" />
      <ellipse cx="74" cy="98" rx="8" ry="6" fill="#A8E6A1" />
      <path d="M28 88 C28 58 44 46 60 46 C76 46 92 58 92 88 Z" fill="#7BC96F" stroke="#4E9B47" strokeWidth="4" />
      <circle cx="60" cy="70" r="10" fill="none" stroke="#4E9B47" strokeWidth="3" />
      <circle cx="44" cy="76" r="6" fill="none" stroke="#4E9B47" strokeWidth="2.6" />
      <circle cx="76" cy="76" r="6" fill="none" stroke="#4E9B47" strokeWidth="2.6" />
      <circle cx="94" cy="82" r="13" fill="#A8E6A1" />
      <circle cx="97" cy="79" r="3.4" fill="#2B2B2B" />
      <circle cx="98.2" cy="77.8" r="1.1" fill="#fff" />
      <path d="M102 88 Q106 90 108 87" fill="none" stroke="#3E7D3A" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M60 46 L60 30" stroke="#3E7D3A" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="30" rx="9" ry="5" fill="#5BBF5B" transform="rotate(-28 50 30)" />
      <ellipse cx="70" cy="26" rx="9" ry="5" fill="#5BBF5B" transform="rotate(28 70 26)" />
    </g>
  );
}

function StarFox() {
  const star = 'M0,-6 L1.8,-1.8 L6,-1.8 L2.6,1 L3.8,5 L0,2.6 L-3.8,5 L-2.6,1 L-6,-1.8 L-1.8,-1.8 Z';
  return (
    <g>
      <ellipse cx="60" cy="110" rx="32" ry="6" fill="#17324F" opacity="0.12" />
      <ellipse cx="92" cy="84" rx="16" ry="22" fill="#F2994A" transform="rotate(24 92 84)" />
      <ellipse cx="92" cy="92" rx="8" ry="12" fill="#FFE3C2" transform="rotate(24 92 92)" />
      <path d="M40 42 L32 12 L58 32 Z" fill="#F2994A" strokeLinejoin="round" />
      <path d="M78 42 L86 12 L60 32 Z" fill="#F2994A" strokeLinejoin="round" />
      <path d="M42 34 L38 20 L50 30 Z" fill="#FFD9C0" />
      <path d="M76 34 L80 20 L68 30 Z" fill="#FFD9C0" />
      <circle cx="59" cy="60" r="25" fill="#F2994A" />
      <path d={star} transform="translate(42,52) scale(0.9)" fill="#FFE28A" />
      <path d={star} transform="translate(76,50) scale(0.7)" fill="#FFE28A" />
      <path d={star} transform="translate(60,42) scale(0.55)" fill="#FFE28A" />
      <ellipse cx="59" cy="70" rx="12" ry="9" fill="#FFF1E0" />
      <circle cx="50" cy="58" r="4" fill="#2B2B2B" />
      <circle cx="68" cy="58" r="4" fill="#2B2B2B" />
      <circle cx="51.4" cy="56.6" r="1.3" fill="#fff" />
      <circle cx="69.4" cy="56.6" r="1.3" fill="#fff" />
      <circle cx="59" cy="67" r="4" fill="#5B3A1E" />
      <path d="M59 71 Q59 75 55 76 M59 71 Q59 75 63 76" fill="none" stroke="#5B3A1E" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="44" cy="66" rx="5" ry="3.4" fill="#FFB3A0" opacity="0.7" />
      <ellipse cx="74" cy="66" rx="5" ry="3.4" fill="#FFB3A0" opacity="0.7" />
    </g>
  );
}

function BubbleFrog() {
  return (
    <g>
      <ellipse cx="60" cy="110" rx="32" ry="6" fill="#17324F" opacity="0.12" />
      <ellipse cx="36" cy="96" rx="11" ry="7" fill="#5FBF8A" />
      <ellipse cx="84" cy="96" rx="11" ry="7" fill="#5FBF8A" />
      <circle cx="44" cy="46" r="11" fill="#7FD6A8" />
      <circle cx="76" cy="46" r="11" fill="#7FD6A8" />
      <circle cx="60" cy="72" r="27" fill="#7FD6A8" />
      <circle cx="44" cy="46" r="7" fill="#fff" />
      <circle cx="76" cy="46" r="7" fill="#fff" />
      <circle cx="44" cy="47" r="3.6" fill="#2B2B2B" />
      <circle cx="76" cy="47" r="3.6" fill="#2B2B2B" />
      <circle cx="45.3" cy="45.7" r="1.2" fill="#fff" />
      <circle cx="77.3" cy="45.7" r="1.2" fill="#fff" />
      <ellipse cx="60" cy="82" rx="14" ry="10" fill="#D9F7E8" />
      <path d="M44 68 Q60 82 76 68" fill="none" stroke="#2F6B4F" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="40" cy="62" rx="6" ry="4" fill="#FFB3C8" opacity="0.7" />
      <ellipse cx="80" cy="62" rx="6" ry="4" fill="#FFB3C8" opacity="0.7" />
      <circle cx="28" cy="28" r="6" fill="#E8F9FF" stroke="#BFE9FF" strokeWidth="2" opacity="0.9" />
      <circle cx="94" cy="24" r="8" fill="#E8F9FF" stroke="#BFE9FF" strokeWidth="2" opacity="0.9" />
      <circle cx="104" cy="44" r="5" fill="#E8F9FF" stroke="#BFE9FF" strokeWidth="2" opacity="0.9" />
    </g>
  );
}

/**
 * Original SVG art for each pet species. Stage scales the creature
 * (egg stays small, grown is big with sparkles).
 */
export function PetArt({
  species,
  stage,
  cracks = 0,
  className = '',
}: {
  species: PetSpecies;
  stage: PetStage;
  cracks?: number;
  className?: string;
}) {
  const info = getSpecies(species);
  if (stage === 'egg') {
    return (
      <div className={className}>
        <EggArt species={species} cracks={cracks} />
      </div>
    );
  }
  const scale = stage === 'hatchling' ? 0.72 : stage === 'junior' ? 0.88 : 1;
  return (
    <div className={className}>
      <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label={info.displayName}>
        {stage === 'grown' && <Sparkles />}
        <g transform={`translate(60 62) scale(${scale}) translate(-60 -62)`}>
          {species === 'bumble-pup' && <BumblePup />}
          {species === 'cloud-kitten' && <CloudKitten />}
          {species === 'sprout-turtle' && <SproutTurtle />}
          {species === 'star-fox' && <StarFox />}
          {species === 'bubble-frog' && <BubbleFrog />}
        </g>
      </svg>
    </div>
  );
}

const STAGE_LABEL: Record<PetStage, string> = {
  egg: 'Egg',
  hatchling: 'Hatchling',
  junior: 'Junior',
  grown: 'Grown-Up',
};

/** Happiness bar for the pet. */
export function HappinessBar({ happiness }: { happiness: number }) {
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-kid-ink-900/15"
      role="meter"
      aria-valuenow={happiness}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Happiness"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-kid-sun-400 to-kid-coral-400 transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(100, happiness))}%` }}
      />
    </div>
  );
}

/**
 * Small map widget: pet art + name + happiness. Tap opens the companion.
 * If the child has no pet yet, shows an "adopt" teaser.
 */
export function PetWidget({ child, onOpen }: { child: SessionChild; onOpen: () => void }) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getPet(child.id)
      .then((p) => {
        if (alive) {
          setPet(p);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [child.id]);

  if (!loaded) return null;

  const info = pet ? getSpecies(pet.species) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="animate-kid-pop-in flex items-center gap-3 rounded-kid-card border-4 border-white/70 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(23,50,79,0.2)] transition-transform hover:scale-105 active:scale-95"
      aria-label={pet ? `Visit ${pet.name ?? info?.displayName ?? 'pet'}` : 'Adopt a pet'}
    >
      {pet && info ? (
        <>
          <PetArt species={pet.species} stage={pet.stage} className="h-14 w-14 shrink-0" />
          <span className="flex min-w-0 flex-col items-start gap-1">
            <span className="max-w-32 truncate text-base font-black text-kid-ink-900">
              {pet.name ?? info.displayName}
            </span>
            <span className="w-24">
              <HappinessBar happiness={pet.happiness} />
            </span>
            <span className="text-xs font-bold text-kid-ink-700">{STAGE_LABEL[pet.stage]}</span>
          </span>
        </>
      ) : (
        <>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label="Mystery egg">
              <path
                d="M60 18 C84 18 96 52 96 74 C96 96 80 106 60 106 C40 106 24 96 24 74 C24 52 36 18 60 18 Z"
                fill="#E8F4FF"
                stroke="#A9CFF2"
                strokeWidth="4"
                strokeDasharray="10 7"
              />
              <text x="60" y="74" textAnchor="middle" fontSize="34" fill="#7FA8C9" fontWeight="900">
                ?
              </text>
            </svg>
          </span>
          <span className="flex flex-col items-start">
            <span className="text-base font-black text-kid-ink-900">Adopt a pet!</span>
            <span className="text-xs font-bold text-kid-ink-700">Tap to meet your egg</span>
          </span>
        </>
      )}
    </button>
  );
}
