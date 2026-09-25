'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getPet, playWithPet } from '@/app/actions/pets';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { logLearningEvent } from '@/app/actions/learning';
import { checkTrophies } from '@/app/actions/trophies';
import { getSpecies, type Pet } from '@/lib/kid/pets';
import {
  PLAYGROUND_GAMES,
  allGamesPlayed,
  fetchRound,
  groomSpots,
  isTossHit,
  loadPlayedGames,
  markGamePlayed,
  tossAim,
  type FetchSession,
  type PlaygroundGameId,
} from '@/lib/kid/playground';
import { playSfx, speakAs, stopSpeaking } from '@/lib/kid/audio';
import KidShell from '@/components/kid/kid-shell';
import { PetArt, HappinessBar } from './pet-widget';

const STARS_PER_GAME = 5;

function Ball({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Ball">
      <circle cx="32" cy="32" r="26" fill="#FF6B6B" stroke="#C0392B" strokeWidth="4" />
      <path d="M32,6 a26,26 0 0 1 0,52" fill="none" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M14,20 a26,26 0 0 1 20,-14" fill="none" stroke="#FFFFFF" strokeWidth="4" opacity="0.8" />
      <circle cx="24" cy="22" r="4" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

function SparkleSpot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Dust sparkle">
      <path
        d="M24,4 l5,15 15,5 -15,5 -5,15 -5,-15 -15,-5 15,-5 Z"
        fill="#FFE66D"
        stroke="#B57E12"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="3" fill="#FFFFFF" />
    </svg>
  );
}

function Treat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Treat">
      <rect x="18" y="22" width="28" height="20" rx="8" fill="#C68B4E" stroke="#8A5A2B" strokeWidth="3" />
      <path d="M18,28 L6,20 L10,32 L6,44 L18,36 Z" fill="#E8A93C" stroke="#8A5A2B" strokeWidth="2.5" />
      <path d="M46,28 L58,20 L54,32 L58,44 L46,36 Z" fill="#E8A93C" stroke="#8A5A2B" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="3" fill="#8A5A2B" />
    </svg>
  );
}

function spotPosition(spot: number): { left: string; top: string } {
  const col = spot % 3;
  const row = Math.floor(spot / 3);
  return { left: `${8 + col * 36}%`, top: `${6 + row * 34}%` };
}

/**
 * Pet Playground: three minigames for the pet companion.
 * Each completed game boosts pet happiness and earns the kid stars;
 * finishing all three unlocks the playground celebration.
 */
export default function PetPlayground({ childId, onExit }: { childId: string; onExit: () => void }) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<PlaygroundGameId>('fetch');
  const [played, setPlayed] = useState<PlaygroundGameId[]>([]);
  const [hopKey, setHopKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  // per-game state
  const [fetchSession, setFetchSession] = useState<FetchSession | null>(null);
  const [fetchAt, setFetchAt] = useState(0);
  const [spots, setSpots] = useState<number[]>([]);
  const [tossSession, setTossSession] = useState<{ sweetZones: number[] } | null>(null);
  const [tossAt, setTossAt] = useState(0);
  const [marker, setMarker] = useState(0);
  const [tossFlash, setTossFlash] = useState<'hit' | 'miss' | null>(null);

  const greeted = useRef(false);
  const celebratedRef = useRef(false);
  const dirRef = useRef(1);

  const startFetch = useCallback(() => {
    setFetchSession(fetchRound(Date.now()));
    setFetchAt(0);
  }, []);

  const startGroom = useCallback(() => {
    setSpots(groomSpots(Date.now()));
  }, []);

  const startToss = useCallback(() => {
    setTossSession(tossAim(Date.now()));
    setTossAt(0);
    setTossFlash(null);
    setMarker(0);
    dirRef.current = 1;
  }, []);

  const startGame = useCallback(
    (id: PlaygroundGameId) => {
      setTab(id);
      playSfx('pop');
      if (id === 'fetch') startFetch();
      if (id === 'groom') startGroom();
      if (id === 'treat-toss') startToss();
      const game = PLAYGROUND_GAMES.find((g) => g.id === id);
      if (game && pet) speakAs(getSpecies(pet.species).hostCharacter, game.howTo);
    },
    [pet, startFetch, startGroom, startToss],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getPet(childId);
        if (!alive) return;
        setPet(p);
        setPlayed(loadPlayedGames(childId));
        setCelebrated(allGamesPlayed(childId));
        if (p && p.stage !== 'egg' && !greeted.current) {
          greeted.current = true;
          const info = getSpecies(p.species);
          speakAs(info.hostCharacter, `${p.name ?? 'Your pet'} loves the playground! Pick a game to play together.`);
        }
      } catch {
        // offline or unavailable — the empty state below still renders
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [childId]);

  useEffect(() => {
    if (loaded && pet && pet.stage !== 'egg') startFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => () => stopSpeaking(), []);

  // Treat-toss marker sweep.
  useEffect(() => {
    if (tab !== 'treat-toss' || !tossSession || tossAt >= 5) return;
    const id = window.setInterval(() => {
      setMarker((m) => {
        let next = m + dirRef.current * 3;
        if (next >= 100) {
          next = 100;
          dirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          dirRef.current = 1;
        }
        return next;
      });
    }, 30);
    return () => window.clearInterval(id);
  }, [tab, tossSession, tossAt]);

  async function finishGame(gameId: PlaygroundGameId) {
    if (busy) return;
    setBusy(true);
    const info = pet ? getSpecies(pet.species) : null;
    try {
      playSfx('fanfare');
      const updated = markGamePlayed(childId, gameId);
      setPlayed(updated);
      setHopKey((k) => k + 1);
      // Pet happiness bump (free play action), then kid stars.
      try {
        const p = await playWithPet(childId);
        setPet(p);
      } catch {
        // pet happiness is a bonus; the kid's rewards still land
      }
      await awardStars(childId, STARS_PER_GAME).catch(() => {});
      if (info) speakAs(info.hostCharacter, 'That was wonderful! You are the best friend ever!');
      // All three played -> celebration.
      if (updated.length >= 3 && !celebratedRef.current) {
        celebratedRef.current = true;
        setCelebrated(true);
        await awardStickers(childId, ['playground-pro']).catch(() => {});
        void checkTrophies(childId, 'playground_done').catch(() => {});
        await bumpQuestProgress(childId, 'pet_play', 1).catch(() => {});
        await logLearningEvent(childId, 'milestone', { metadata: { kind: 'playground_all_played' } }).catch(() => {});
        playSfx('fanfare');
      }
    } finally {
      setBusy(false);
    }
  }

  function handleFetchTap(zone: number) {
    if (!fetchSession || busy || fetchAt >= fetchSession.throws) return;
    if (zone !== fetchSession.zones[fetchAt]) {
      playSfx('wrong');
      return;
    }
    playSfx('correct');
    setHopKey((k) => k + 1);
    const next = fetchAt + 1;
    setFetchAt(next);
    if (next >= fetchSession.throws) void finishGame('fetch');
  }

  function handleGroomTap(spot: number) {
    if (busy || !spots.includes(spot)) return;
    playSfx('star');
    const remaining = spots.filter((s) => s !== spot);
    setSpots(remaining);
    if (remaining.length === 0) void finishGame('groom');
    else setHopKey((k) => k + 1);
  }

  function handleToss() {
    if (!tossSession || busy || tossAt >= tossSession.sweetZones.length) return;
    const center = tossSession.sweetZones[tossAt];
    const hit = isTossHit(marker, center);
    setTossFlash(hit ? 'hit' : 'miss');
    playSfx(hit ? 'correct' : 'wrong');
    if (hit) setHopKey((k) => k + 1);
    window.setTimeout(() => {
      setTossFlash(null);
      const next = tossAt + 1;
      setTossAt(next);
      if (next >= tossSession.sweetZones.length) void finishGame('treat-toss');
    }, 650);
  }

  const petInfo = pet ? getSpecies(pet.species) : null;
  const hasPet = pet !== null && pet.stage !== 'egg';

  return (
    <KidShell onExit={onExit} doneCount={played.length} totalSteps={3} points={played.length * STARS_PER_GAME}>
      <div className="mx-auto w-full max-w-4xl px-4 pb-16">
        <h2 className="pt-2 text-center text-3xl font-black text-kid-ink-900 md:text-4xl">Pet Playground</h2>
        <p className="mt-1 text-center text-lg font-bold text-kid-ink-700">
          Play games with your pet to make it extra happy!
        </p>

        {!loaded && <p className="py-16 text-center text-xl font-black text-kid-ink-900">Loading the playground...</p>}

        {loaded && !hasPet && (
          <div className="mx-auto mt-8 max-w-xl rounded-kid-card border-4 border-white/70 bg-white/85 p-8 text-center shadow-[0_8px_20px_rgba(23,50,79,0.18)]">
            <p className="text-xl font-black text-kid-ink-900">No pet friend yet!</p>
            <p className="mt-2 text-base font-bold text-kid-ink-700">
              Adopt and hatch a pet first, then come back to play fetch, groom, and toss treats.
            </p>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                onExit();
              }}
              className="mt-5 rounded-full bg-kid-mint-400 px-8 py-3.5 text-xl font-black text-kid-ink-900 shadow-[0_8px_20px_rgba(23,50,79,0.2)] transition-transform hover:scale-105 active:scale-95"
            >
              Hatch my pet
            </button>
          </div>
        )}

        {loaded && hasPet && pet && petInfo && (
          <div className="mt-4">
            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Playground games">
              {PLAYGROUND_GAMES.map((g) => {
                const active = tab === g.id;
                const done = played.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => startGame(g.id)}
                    className={`flex min-h-[64px] min-w-[120px] items-center gap-2 rounded-kid-card border-4 px-5 py-3 text-xl font-black transition-transform hover:scale-105 active:scale-95 ${
                      active
                        ? 'border-kid-sun-500 bg-kid-sun-300 text-kid-ink-900'
                        : 'border-white/70 bg-white/85 text-kid-ink-900'
                    }`}
                  >
                    {g.name}
                    {done && (
                      <span aria-label="Completed" className="flex h-7 w-7 items-center justify-center rounded-full bg-kid-mint-500">
                        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                          <path d="M4,10.5 L8.5,15 L16,5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {celebrated && (
              <p className="mx-auto mt-4 max-w-xl rounded-kid-card border-4 border-kid-sun-500 bg-kid-sun-200/90 px-4 py-3 text-center text-lg font-black text-kid-ink-900">
                Playground champion! You played all three games with {pet.name ?? 'your pet'}!
              </p>
            )}

            <div className="mt-6 grid items-start gap-6 md:grid-cols-[1fr_1.4fr]">
              {/* Pet side */}
              <div className="flex flex-col items-center gap-3 rounded-kid-card border-4 border-white/70 bg-white/85 p-5 shadow-[0_8px_20px_rgba(23,50,79,0.18)]">
                <div key={hopKey} className="animate-kid-bounce-soft">
                  <PetArt species={pet.species} stage={pet.stage} className="h-44 w-44 md:h-56 md:w-56" />
                </div>
                <p className="text-2xl font-black text-kid-ink-900">{pet.name ?? petInfo.displayName}</p>
                <div className="w-full max-w-xs">
                  <HappinessBar happiness={pet.happiness} />
                  <p className="mt-1 text-center text-sm font-bold text-kid-ink-700">Happiness: {pet.happiness}</p>
                </div>
                <p className="text-center text-sm font-bold text-kid-ink-700">
                  {PLAYGROUND_GAMES.find((g) => g.id === tab)?.howTo}
                </p>
              </div>

              {/* Game side */}
              <div className="rounded-kid-card border-4 border-white/70 bg-white/85 p-5 shadow-[0_8px_20px_rgba(23,50,79,0.18)]">
                {tab === 'fetch' && fetchSession && (
                  <div>
                    <p className="text-center text-lg font-black text-kid-ink-900">
                      Throw {fetchAt + 1} of {fetchSession.throws} — tap the ball!
                    </p>
                    <div className="mt-4 grid grid-cols-5 gap-2" role="group" aria-label="Ball spots">
                      {[0, 1, 2, 3, 4].map((zone) => (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => handleFetchTap(zone)}
                          disabled={fetchAt >= fetchSession.throws}
                          className="flex min-h-[88px] items-center justify-center rounded-kid-card border-4 border-kid-sky-200 bg-kid-sky-100 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                          aria-label={`Throw the ball, spot ${zone + 1}`}
                        >
                          {fetchAt < fetchSession.throws && fetchSession.zones[fetchAt] === zone ? (
                            <Ball className="h-16 w-16 animate-kid-pop-in" />
                          ) : (
                            <span className="h-16 w-16 rounded-full border-4 border-dashed border-kid-sky-300" aria-hidden="true" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
                      {fetchSession.zones.map((_, i) => (
                        <span
                          key={i}
                          className={`h-4 w-4 rounded-full ${i < fetchAt ? 'bg-kid-mint-500' : 'bg-kid-ink-900/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'groom' && (
                  <div>
                    <p className="text-center text-lg font-black text-kid-ink-900">
                      {spots.length > 0 ? `Tap the sparkles — ${spots.length} left!` : 'All clean!'}
                    </p>
                    <div className="relative mx-auto mt-4 h-72 w-full max-w-sm rounded-kid-card bg-kid-sky-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PetArt species={pet.species} stage={pet.stage} className="h-40 w-40 opacity-60" />
                      </div>
                      {spots.map((spot) => {
                        const pos = spotPosition(spot);
                        return (
                          <button
                            key={spot}
                            type="button"
                            onClick={() => handleGroomTap(spot)}
                            className="absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-90"
                            style={{ left: pos.left, top: pos.top }}
                            aria-label={`Brush away sparkle ${spot + 1}`}
                          >
                            <SparkleSpot className="h-full w-full animate-kid-twinkle" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tab === 'treat-toss' && tossSession && (
                  <div>
                    <p className="text-center text-lg font-black text-kid-ink-900">
                      Toss {tossAt + 1} of {tossSession.sweetZones.length} — tap Toss in the golden zone!
                    </p>
                    <div className="relative mx-auto mt-6 h-16 w-full max-w-md rounded-full bg-kid-sky-100" aria-hidden="true">
                      {tossAt < tossSession.sweetZones.length && (
                        <div
                          className="absolute top-0 h-full rounded-full bg-kid-sun-300/90"
                          style={{
                            left: `${tossSession.sweetZones[tossAt] - 10}%`,
                            width: '20%',
                          }}
                        />
                      )}
                      <div
                        className="absolute top-0 h-full w-3 rounded-full bg-kid-coral-500"
                        style={{ left: `calc(${marker}% - 6px)` }}
                      />
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <Treat className={`h-20 w-20 ${tossFlash === 'hit' ? 'animate-kid-pop-in' : ''}`} />
                      <button
                        type="button"
                        onClick={handleToss}
                        disabled={busy || tossAt >= tossSession.sweetZones.length}
                        className={`min-h-[88px] rounded-full px-12 text-2xl font-black text-kid-ink-900 shadow-[0_8px_20px_rgba(23,50,79,0.2)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 ${
                          tossFlash === 'hit'
                            ? 'bg-kid-mint-400'
                            : tossFlash === 'miss'
                              ? 'bg-kid-coral-400'
                              : 'bg-kid-sun-400'
                        }`}
                        aria-label="Toss the treat now"
                      >
                        Toss!
                      </button>
                    </div>
                    <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
                      {tossSession.sweetZones.map((_, i) => (
                        <span
                          key={i}
                          className={`h-4 w-4 rounded-full ${i < tossAt ? 'bg-kid-mint-500' : 'bg-kid-ink-900/20'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </KidShell>
  );
}
