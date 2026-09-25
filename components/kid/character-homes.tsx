'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import VideoSpot from './video-spot';
import { AVATARS } from '@/components/avatars';
import { getCharacter } from '@/lib/kid/characters';
import { playSfx, speakAs, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import {
  HOMES,
  getHome,
  loadVisited,
  markVisited,
  hasVisitedAll,
  loadHomesAwarded,
  markHomesAwarded,
  claimHiddenStar,
  type CharacterHome,
} from '@/lib/kid/homes';

export interface CharacterHomesProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

/** Original simple SVG home art — one cozy house per character. No emoji. */
function HomeArt({ characterId, className }: { characterId: string; className?: string }) {
  const art: Record<string, React.JSX.Element> = {
    curio: (
      <g>
        <rect x="27" y="30" width="10" height="24" rx="3" fill="#8A5A2B" />
        <rect x="12" y="12" width="40" height="22" rx="5" fill="#C98A4B" stroke="#8A5A2B" strokeWidth="2.5" />
        <path d="M10 14 L32 2 L54 14 Z" fill="#A86F2E" stroke="#8A5A2B" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="32" cy="23" r="6" fill="#BFE3F0" stroke="#5B8CC0" strokeWidth="2.5" />
        <rect x="26" y="36" width="12" height="12" rx="2" fill="#A86F2E" />
      </g>
    ),
    nova: (
      <g>
        <path d="M6 52 Q32 18 58 52 Z" fill="#7ED6A5" stroke="#3FA97C" strokeWidth="2.5" />
        <ellipse cx="32" cy="46" rx="10" ry="9" fill="#5B4A38" />
        <ellipse cx="32" cy="46" rx="6" ry="5.5" fill="#2E2620" />
        <circle cx="18" cy="30" r="4" fill="#FFD93C" />
        <circle cx="46" cy="28" r="3" fill="#FF9DAD" />
        <circle cx="40" cy="38" r="2.5" fill="#FFF6EA" />
      </g>
    ),
    luna: (
      <g>
        <path d="M40 6 a14 14 0 1 0 9 24 A16 16 0 0 1 40 6z" fill="#FFE66D" />
        <rect x="10" y="34" width="44" height="20" rx="3" fill="#8B7BC7" stroke="#5F4FA3" strokeWidth="2.5" />
        <rect x="15" y="38" width="8" height="12" fill="#FFD93C" />
        <rect x="25" y="38" width="8" height="12" fill="#F15BB5" />
        <rect x="35" y="38" width="8" height="12" fill="#5BC8E8" />
        <circle cx="14" cy="12" r="1.8" fill="#fff" />
        <circle cx="24" cy="8" r="1.4" fill="#fff" />
      </g>
    ),
    milo: (
      <g>
        <circle cx="24" cy="24" r="12" fill="#9AA7B8" stroke="#5B6B7F" strokeWidth="2.5" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <rect key={a} x="21.5" y="6" width="5" height="8" rx="2" fill="#5B6B7F" transform={`rotate(${a} 24 24)`} />
        ))}
        <circle cx="24" cy="24" r="5" fill="#4CC9F0" stroke="#1D8FBF" strokeWidth="2" />
        <circle cx="46" cy="44" r="9" fill="#C9D4E0" stroke="#5B6B7F" strokeWidth="2.5" />
        <circle cx="46" cy="44" r="3.5" fill="#FFD93C" />
      </g>
    ),
    bea: (
      <g>
        <path d="M32 8 l9 5.5 v11 L32 30 l-9 -5.5 v-11 z" fill="#FFC93C" stroke="#D9A415" strokeWidth="2.5" />
        <path d="M18 30 l9 5.5 v11 L18 52 l-9 -5.5 v-11 z" fill="#FFD93C" stroke="#D9A415" strokeWidth="2.5" transform="translate(4 -6) scale(0.9)" />
        <path d="M46 30 l9 5.5 v11 L46 52 l-9 -5.5 v-11 z" fill="#FFE08A" stroke="#D9A415" strokeWidth="2.5" transform="translate(-8 -6) scale(0.9)" />
        <circle cx="32" cy="17" r="2" fill="#8A5A2B" />
      </g>
    ),
    tuno: (
      <g>
        <ellipse cx="32" cy="42" rx="24" ry="10" fill="#5BC8E8" stroke="#2E9BC6" strokeWidth="2.5" />
        <ellipse cx="20" cy="40" rx="7" ry="3.5" fill="#7ED6A5" stroke="#3FA97C" strokeWidth="2" />
        <ellipse cx="44" cy="42" rx="6" ry="3" fill="#7ED6A5" stroke="#3FA97C" strokeWidth="2" />
        <circle cx="20" cy="36" r="2.5" fill="#FF9DAD" />
        <path d="M24 30 q8 -8 16 0 l-2 8 h-12 z" fill="#C98A4B" stroke="#8A5A2B" strokeWidth="2.5" strokeLinejoin="round" />
      </g>
    ),
    riff: (
      <g>
        <path d="M8 52 Q32 22 56 52 Z" fill="#A9805E" stroke="#7A5A3C" strokeWidth="2.5" />
        <ellipse cx="32" cy="48" rx="9" ry="7" fill="#5B4A38" />
        <circle cx="24" cy="16" r="4" fill="#F15BB5" />
        <rect x="27" y="4" width="3" height="14" fill="#F15BB5" />
        <path d="M30 4 q8 2 8 8" fill="none" stroke="#F15BB5" strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="22" r="3" fill="#8B7BC7" />
        <rect x="46.5" y="12" width="2.5" height="11" fill="#8B7BC7" />
      </g>
    ),
    atlas: (
      <g>
        <rect x="26" y="18" width="12" height="34" rx="6" fill="#A9805E" stroke="#7A5A3C" strokeWidth="2.5" />
        <path d="M28 20 Q18 10 12 12 M36 20 Q46 10 52 12" fill="none" stroke="#7A5A3C" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="32" cy="10" rx="20" ry="7" fill="#7ED6A5" stroke="#3FA97C" strokeWidth="2.5" />
        <rect x="28" y="36" width="8" height="14" rx="3" fill="#5B4A38" />
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-hidden>
      {art[characterId] ?? art.curio}
    </svg>
  );
}

/** Where the hidden star sparkles in each home (percent of the scene). */
const STAR_SPOTS: Record<string, { left: string; top: string }> = {
  curio: { left: '78%', top: '18%' },
  nova: { left: '16%', top: '30%' },
  luna: { left: '82%', top: '58%' },
  milo: { left: '70%', top: '70%' },
  bea: { left: '24%', top: '16%' },
  tuno: { left: '80%', top: '34%' },
  riff: { left: '14%', top: '62%' },
  atlas: { left: '76%', top: '26%' },
};

function HiddenStar({
  spot,
  found,
  claimed,
  onFind,
}: {
  spot: { left: string; top: string };
  found: boolean;
  claimed: boolean;
  onFind: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onFind}
      aria-label={claimed ? 'Hidden star already found today' : 'A sparkling hidden star — tap it!'}
      style={{ left: spot.left, top: spot.top }}
      className={`absolute z-20 h-14 w-14 -translate-x-1/2 -translate-y-1/2 transition-transform ${
        found ? 'scale-125' : 'animate-kid-sparkle hover:scale-110 active:scale-95'
      }`}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full drop-shadow-[0_0_10px_rgba(255,217,60,0.9)]" aria-hidden>
        <path
          d="M24 4l4.6 12.2L41 18l-9.5 8.6L34.5 40 24 32.6 13.5 40l3-13.4L7 18l12.4-1.8z"
          fill={claimed ? '#B8C4D4' : '#FFD93C'}
          stroke={claimed ? '#8A97AB' : '#E0A800'}
          strokeWidth="2.5"
          strokeLinejoin="round"
          opacity={claimed ? 0.55 : 1}
        />
      </svg>
    </button>
  );
}

export default function CharacterHomes({ childId, nickname = 'friend', onExit }: CharacterHomesProps) {
  const [visiting, setVisiting] = useState<string | null>(null);
  const [visited, setVisited] = useState<string[]>(() => {
    try {
      return loadVisited(childId);
    } catch {
      return [];
    }
  });
  const [starFound, setStarFound] = useState(false);
  const [starClaimedToday, setStarClaimedToday] = useState(false);
  const [allVisited, setAllVisited] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    speakAs('curio', `Welcome to Character Homes, ${nickname}! Tap a home to visit your friends. Can you visit all eight?`);
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visit = useCallback(
    async (home: CharacterHome) => {
      playSfx('pop');
      const updated = markVisited(childId, home.characterId);
      setVisited(updated);
      setVisiting(home.characterId);
      setStarFound(false);
      setStarClaimedToday(false);
      // Celebrate visiting every home — exactly once.
      if (updated.length >= 8 && hasVisitedAll(childId) && !loadHomesAwarded(childId)) {
        markHomesAwarded(childId);
        setAllVisited(true);
        try {
          await awardStickers(childId, ['home-sweet-home']);
          await checkTrophies(childId, 'homes_done').catch(() => {});
          await logLearningEvent(childId, 'milestone', {
            metadata: { kind: 'homes_all_visited' },
          });
        } catch {
          /* celebration is best-effort */
        }
        playSfx('fanfare');
        speakAs(
          'curio',
          `Amazing, ${nickname}! You visited all eight homes! You are the friendliest explorer in the sky!`
        );
      }
    },
    [childId, nickname]
  );

  const findStar = useCallback(
    async (home: CharacterHome) => {
      if (starFound) return;
      playSfx('pop');
      const fresh = claimHiddenStar(childId, home.characterId);
      setStarFound(true);
      setStarClaimedToday(!fresh);
      if (fresh) {
        try {
          await awardStars(childId, 1);
        } catch {
          /* star award is best-effort */
        }
        playSfx('fanfare');
        speakAs(home.characterId, `You found my hidden star, ${nickname}! One shiny star for you!`);
      } else {
        speakAs(home.characterId, 'You already found my hidden star today. Come back tomorrow!');
      }
    },
    [childId, nickname, starFound]
  );

  const closeVisit = useCallback(() => {
    playSfx('whoosh');
    stopSpeaking();
    setVisiting(null);
  }, []);

  const home = visiting ? getHome(visiting) : undefined;

  if (home) {
    const character = getCharacter(home.characterId);
    const Avatar = AVATARS[home.characterId]?.Component ?? AVATARS.curio.Component;
    const spot = STAR_SPOTS[home.characterId] ?? { left: '80%', top: '20%' };
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-6">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={closeVisit}
            className="rounded-full border-b-4 border-kid-ink-700 bg-white px-6 py-3 text-lg font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Back to all homes"
          >
            ← Homes
          </button>
          <p className="text-sm font-black uppercase tracking-widest text-white/90">
            {allVisited || visited.length >= 8 ? 'All homes visited!' : `${visited.length} of 8 homes visited`}
          </p>
        </div>

        <div className="relative w-full overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]" style={{ minHeight: '52vh' }}>
          {home.clipSrc ? (
            <VideoSpot
              src={home.clipSrc}
              label={`${character.name}'s home: ${home.homeName}`}
              characterId={home.characterId}
              voiceover={home.greeting}
              caption={`${home.homeName} — ${home.tagline}`}
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center"
              style={{ minHeight: '52vh', background: `linear-gradient(to bottom, ${character.color}55, #9FE3FA)` }}
            >
              <Avatar className="h-40 w-40 animate-kid-bob" />
              <p className="max-w-md text-2xl font-black text-kid-ink-900">{home.greeting}</p>
            </div>
          )}
          {/* Hidden star floats over the scene — find it! */}
          <HiddenStar spot={spot} found={starFound} claimed={starClaimedToday} onFind={() => void findStar(home)} />
        </div>

        <p className="text-center text-lg font-bold text-white/95" aria-live="polite">
          {starFound
            ? starClaimedToday
              ? 'You already found today\u2019s star here. Come back tomorrow!'
              : 'You found the hidden star! Plus one shiny star!'
            : 'Psst… a hidden star is sparkling somewhere. Can you find it?'}
        </p>

        <FallbackGreeting characterId={home.characterId} greeting={home.greeting} hasClip={!!home.clipSrc} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-5 px-4 py-6">
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border-b-4 border-kid-ink-700 bg-white px-6 py-3 text-lg font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Back to the map"
        >
          ← Back
        </button>
        <p className="text-sm font-black uppercase tracking-widest text-white/90">
          {visited.length} of 8 visited
        </p>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-black text-white drop-shadow-[0_2px_8px_rgba(12,24,44,0.5)] md:text-4xl">
          Character Homes
        </h2>
        <p className="mt-1 text-lg font-bold text-white/95">
          Visit your friends! Find each hidden star.
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4" role="list" aria-label="Character homes">
        {HOMES.map((h) => {
          const c = getCharacter(h.characterId);
          const isVisited = visited.includes(h.characterId);
          return (
            <button
              key={h.characterId}
              type="button"
              role="listitem"
              onClick={() => void visit(h)}
              className="relative flex flex-col items-center gap-1 rounded-kid-card bg-white/95 px-3 py-5 shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label={`Visit ${h.homeName}, home of ${c.name}${isVisited ? ', visited' : ''}`}
            >
              {isVisited && (
                <span
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-kid-sun-400 text-sm font-black text-kid-ink-900"
                  aria-hidden
                >
                  ✓
                </span>
              )}
              <HomeArt characterId={h.characterId} className="h-20 w-20" />
              <span className="text-base font-black text-kid-ink-900">{h.homeName}</span>
              <span className="text-xs font-bold" style={{ color: c.color }}>
                {c.name} the {c.species}
              </span>
            </button>
          );
        })}
      </div>

      {allVisited || visited.length >= 8 ? (
        <p className="rounded-kid-card bg-kid-sun-300 px-6 py-3 text-lg font-black text-kid-ink-900" aria-live="polite">
          You visited every home! You earned the Home Sweet Home sticker!
        </p>
      ) : null}
    </div>
  );
}

/** Speaks the greeting when there is no video clip to carry the voiceover. */
function FallbackGreeting({
  characterId,
  greeting,
  hasClip,
}: {
  characterId: string;
  greeting: string;
  hasClip: boolean;
}) {
  useEffect(() => {
    if (hasClip) return;
    const t = window.setTimeout(() => speakAs(characterId, greeting), 400);
    return () => window.clearTimeout(t);
  }, [characterId, greeting, hasClip]);
  return null;
}
