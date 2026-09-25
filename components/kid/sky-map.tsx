'use client';

import { ISLANDS, type Island } from '@/lib/kid/islands';
import { getCharacter } from '@/lib/kid/characters';
import { CHATTER } from '@/lib/kid/char-chatter';
import { AVATARS } from '@/components/avatars';
import { playSfx, speakAs } from '@/lib/kid/audio';
/** Decorative motif drawn on each island. */
function IslandMotif({ motif, color }: { motif: Island['motif']; color: string }) {
  const common = { stroke: color, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' as const };
  switch (motif) {
    case 'books':
      return (
        <g {...common}>
          <rect x="34" y="30" width="14" height="20" rx="2" fill="#fff" opacity="0.9" />
          <rect x="50" y="26" width="14" height="24" rx="2" fill="#fff" opacity="0.7" />
          <line x1="38" y1="36" x2="44" y2="36" />
          <line x1="38" y1="41" x2="44" y2="41" />
          <line x1="54" y1="32" x2="60" y2="32" />
          <line x1="54" y1="37" x2="60" y2="37" />
        </g>
      );
    case 'volcano':
      return (
        <g {...common}>
          <path d="M36 52 L44 28 L52 28 L60 52 Z" fill="#fff" opacity="0.85" />
          <path d="M46 20 q3 -6 6 0 q3 6 6 0" stroke="#FFD166" strokeWidth="4" fill="none" />
          <circle cx="48" cy="12" r="3" fill="#FFD166" stroke="none" />
          <text x="40" y="46" fontSize="12" fontWeight="900" fill={color} stroke="none">123</text>
        </g>
      );
    case 'garden':
      return (
        <g {...common}>
          <line x1="48" y1="52" x2="48" y2="34" stroke="#2E7D32" />
          <circle cx="48" cy="28" r="7" fill="#FF6B9D" stroke="none" opacity="0.95" />
          <circle cx="41" cy="32" r="5" fill="#FF8FAB" stroke="none" opacity="0.9" />
          <circle cx="55" cy="32" r="5" fill="#FF8FAB" stroke="none" opacity="0.9" />
          <ellipse cx="40" cy="46" rx="6" ry="3.5" fill="#2E7D32" stroke="none" opacity="0.8" />
          <ellipse cx="56" cy="46" rx="6" ry="3.5" fill="#2E7D32" stroke="none" opacity="0.8" />
        </g>
      );
    case 'telescope':
      return (
        <g {...common}>
          <line x1="40" y1="52" x2="44" y2="36" stroke="#5B4A68" />
          <line x1="56" y1="52" x2="52" y2="36" stroke="#5B4A68" />
          <rect x="38" y="26" width="20" height="10" rx="5" transform="rotate(-24 48 31)" fill="#fff" opacity="0.9" />
          <circle cx="63" cy="22" r="4" fill="#FFD166" stroke="none" />
        </g>
      );
    case 'palette':
      return (
        <g {...common}>
          <ellipse cx="48" cy="38" rx="16" ry="12" fill="#fff" opacity="0.92" />
          <circle cx="41" cy="34" r="3.4" fill="#FF6B6B" stroke="none" />
          <circle cx="50" cy="32" r="3.4" fill="#FFD166" stroke="none" />
          <circle cx="57" cy="37" r="3.4" fill="#4CC9F0" stroke="none" />
          <circle cx="48" cy="42" r="3.4" fill="#7FB069" stroke="none" />
        </g>
      );
    case 'notes':
      return (
        <g {...common} stroke="#fff">
          <circle cx="38" cy="46" r="4.5" fill="#fff" stroke="none" />
          <line x1="42.5" y1="46" x2="42.5" y2="28" />
          <path d="M42.5 28 q8 2 10 10" fill="none" />
          <circle cx="58" cy="48" r="4.5" fill="#fff" stroke="none" />
          <line x1="62.5" y1="48" x2="62.5" y2="30" />
          <path d="M62.5 30 q-8 2 -10 10" fill="none" />
        </g>
      );
    case 'gears':
      return (
        <g {...common} stroke="#fff">
          <circle cx="42" cy="38" r="8" fill="#fff" opacity="0.9" />
          <circle cx="42" cy="38" r="3" fill={color} stroke="none" />
          <circle cx="58" cy="30" r="5.5" fill="#fff" opacity="0.75" />
          <circle cx="58" cy="30" r="2" fill={color} stroke="none" />
          <circle cx="56" cy="48" r="4" fill="#fff" opacity="0.6" />
        </g>
      );
    case 'moon':
      return (
        <g {...common}>
          <path d="M58 24 a14 14 0 1 0 8 24 a11 11 0 1 1 -8 -24" fill="#FFF6D6" stroke="none" opacity="0.95" />
          <circle cx="36" cy="30" r="2" fill="#fff" stroke="none" />
          <circle cx="40" cy="44" r="1.6" fill="#fff" stroke="none" />
          <circle cx="62" cy="46" r="2" fill="#fff" stroke="none" />
        </g>
      );
    case 'pencil':
      return (
        <g {...common}>
          <rect x="40" y="28" width="10" height="22" rx="2" transform="rotate(24 45 39)" fill="#fff" opacity="0.92" />
          <path d="M52 24 l6 8 l-9 2 z" fill="#FFD166" stroke="none" transform="rotate(24 55 28)" />
          <line x1="38" y1="52" x2="60" y2="52" stroke="#fff" strokeWidth="4" />
        </g>
      );
  }
}

/** A single floating island card, with a learning-progress bar. */
function IslandCard({
  island,
  index,
  onSelect,
  progress,
}: {
  island: Island;
  index: number;
  onSelect: (island: Island) => void;
  progress?: { mastered: number; total: number };
}) {
  const host = getCharacter(island.hostCharacter);
  const HostAvatar = (AVATARS[island.hostCharacter] ?? AVATARS.curio).Component;
  const pct = progress && progress.total > 0 ? Math.round((progress.mastered / progress.total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={() => {
        playSfx('whoosh');
        onSelect(island);
      }}
      className="kid-island-card animate-kid-rise group relative w-full text-left"
      style={{ animationDelay: `${index * 0.07}s` }}
      aria-label={`Visit ${island.islandName} for ${island.subjectName} with ${host.name}${progress ? `, ${progress.mastered} of ${progress.total} skills growing` : ''}`}
    >
      <svg viewBox="0 0 120 110" className="w-full" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={`isl-${island.subjectCode}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={island.sky[0]} />
            <stop offset="1" stopColor={island.sky[1]} />
          </linearGradient>
        </defs>
        {/* island body */}
        <ellipse cx="60" cy="72" rx="52" ry="16" fill={`url(#isl-${island.subjectCode})`} />
        <path d="M14 74 Q60 108 106 74 Q60 84 14 74" fill={island.color} opacity="0.55" />
        <ellipse cx="60" cy="70" rx="52" ry="14" fill="#ffffff" opacity="0.25" />
        {/* motif */}
        <IslandMotif motif={island.motif} color={island.color} />
      </svg>
      {/* host character peeking over the island */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 transition-transform duration-300 group-hover:-translate-y-1/3 group-hover:scale-110">
        <div className="animate-kid-bob" style={{ animationDelay: `${index * 0.4}s` }}>
          <HostAvatar className="h-16 w-16 drop-shadow-[0_8px_14px_rgba(23,50,79,0.35)] md:h-20 md:w-20" />
        </div>
      </div>
      <div className="mt-1 text-center">
        <p className="text-base font-black text-kid-ink-900 md:text-lg">{island.islandName}</p>
        <p className="text-sm font-bold" style={{ color: island.color }}>
          {island.subjectName} · {host.name}
        </p>
        {progress && progress.total > 0 && (
          <div className="mx-auto mt-1.5 w-full max-w-[140px]" aria-hidden="true">
            <div className="h-2.5 overflow-hidden rounded-full bg-white/60 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${island.color}, #FFD93C)` }}
              />
            </div>
            <p className="mt-0.5 text-[11px] font-extrabold text-kid-ink-700">
              {progress.mastered}/{progress.total} growing
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * The Sky map: the child's home hub. Nine floating islands, one per
 * subject, each hosted by a character — plus "Surprise me" for the
 * adaptive daily mix.
 */
export default function SkyMap({
  nickname,
  onSelectIsland,
  onSurprise,
  onOpenStickers,
  onTalkToCharacter,
  progress,
  stickerCount,
  stickerTotal,
}: {
  nickname: string;
  onSelectIsland: (island: Island) => void;
  onSurprise: () => void;
  onOpenStickers?: () => void;
  onTalkToCharacter?: (characterId: string) => void;
  progress?: Record<string, { mastered: number; total: number }>;
  stickerCount?: number;
  stickerTotal?: number;
}) {
  return (
    <div className="kid-sky-map relative flex w-full max-w-6xl flex-col items-center px-4">
      <h1 className="animate-kid-rise text-center text-3xl font-black text-kid-ink-900 md:text-5xl">
        Where to, {nickname}?
      </h1>
      <p className="animate-kid-rise mt-2 text-center text-lg font-bold text-kid-ink-700 md:text-xl" style={{ animationDelay: '0.1s' }}>
        Pick an island to visit — or let the sky surprise you!
      </p>

      <div className="animate-kid-rise mt-5 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '0.15s' }}>
        <button
          type="button"
          onClick={() => {
            playSfx('fanfare');
            speakAs('curio', "Ooh, a mystery adventure! Let's see where the wind takes us!");
            onSurprise();
          }}
          className="group flex items-center gap-3 rounded-full border-b-8 border-kid-sun-600 bg-kid-sun-400 px-10 py-4 text-2xl font-black text-kid-ink-900 shadow-[0_14px_30px_rgba(255,201,60,0.45)] transition-all hover:scale-105 active:scale-95"
        >
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-500 group-hover:rotate-180">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          Surprise me!
        </button>
        {onOpenStickers && (
          <button
            type="button"
            onClick={() => {
              playSfx('pop');
              onOpenStickers();
            }}
            className="flex items-center gap-2 rounded-full border-b-8 border-kid-grape-600 bg-kid-grape-400 px-8 py-4 text-xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
          >
            <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
              <rect x="10" y="14" width="44" height="38" rx="6" fill="#fff" opacity="0.95" />
              <rect x="16" y="8" width="32" height="10" rx="3" fill="#FFD93C" />
              <circle cx="32" cy="34" r="9" fill="#FFD93C" />
              <path d="M32 29l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#fff" />
            </svg>
            My stickers{stickerCount !== undefined && stickerTotal !== undefined ? ` (${stickerCount}/${stickerTotal})` : ''}
          </button>
        )}
      </div>

      <div className="mt-6 grid w-full grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-3">
        {ISLANDS.map((island, i) => (
          <IslandCard
            key={island.subjectCode}
            island={island}
            index={i}
            onSelect={onSelectIsland}
            progress={progress?.[island.subjectCode]}
          />
        ))}
      </div>

      {onTalkToCharacter && (
        <div className="mt-8 flex w-full max-w-4xl flex-col items-center">
          <p className="text-xl font-black text-kid-ink-900 md:text-2xl">Say hello to a friend!</p>
          <p className="mt-1 text-sm font-bold text-kid-ink-700">Tap a friend to hear a joke, a fun fact, or a cheer.</p>
          <div className="mt-3 flex w-full flex-wrap items-start justify-center gap-3">
            {Object.keys(CHATTER).map((characterId, i) => {
              const character = getCharacter(characterId);
              const Avatar = (AVATARS[characterId] ?? AVATARS.curio).Component;
              return (
                <button
                  key={characterId}
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    onTalkToCharacter(characterId);
                  }}
                  className="animate-kid-rise group flex w-20 flex-col items-center gap-1 rounded-kid-card bg-white/70 px-2 py-3 shadow-md transition-transform hover:scale-105 active:scale-95 md:w-24"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  aria-label={`Talk to ${character.name}`}
                >
                  <div className="animate-kid-bob" style={{ animationDelay: `${i * 0.35}s` }}>
                    <Avatar className="h-12 w-12 drop-shadow-[0_6px_10px_rgba(23,50,79,0.3)] transition-transform duration-300 group-hover:scale-110 md:h-14 md:w-14" />
                  </div>
                  <span className="text-xs font-black text-kid-ink-900 md:text-sm">{character.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
