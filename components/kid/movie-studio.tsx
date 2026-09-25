'use client';

/**
 * My Movie Studio — kids direct their own cartoons.
 *
 * Three studio tabs (Cast / Scene / Story), then a full-screen Premiere with
 * TTS narration, a "The End" card, and a "My Movies" gallery saved on-device.
 * No emoji, token-driven CSS, ARIA labels, big touch targets, iPad landscape first.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AVATARS } from '@/components/avatars';
import { getCharacter } from '@/lib/kid/characters';
import { playSfx, speakAs, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import { browserStorage, type StorageLike } from '@/lib/kid/offline';
import {
  BACKDROPS,
  BEATS,
  CAST_IDS,
  MAX_MOVIES,
  backdropFor,
  beatFor,
  fillNarration,
  validMovie,
  saveMovie,
  getMovies,
  deleteMovie,
  premiereKey,
  type Backdrop,
  type Movie,
  type StoryBeat,
} from '@/lib/kid/movies';

export interface MovieStudioProps {
  childId: string;
  nickname?: string;
  onExit: () => void;
}

type Tab = 'cast' | 'scene' | 'story';
type Phase = 'studio' | 'premiere' | 'end';

function storage(): StorageLike | null {
  return browserStorage();
}

// ---------------------------------------------------------------------------
// Backdrop art — original SVG scenes per backdrop id.
// ---------------------------------------------------------------------------

function BackdropArt({ backdrop, className }: { backdrop: Backdrop; className?: string }) {
  const [top, mid, ground] = backdrop.colors;
  const gid = `ms-${backdrop.id}`;
  return (
    <svg viewBox="0 0 400 225" className={className} role="img" aria-label={backdrop.name} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="62%" stopColor={mid} />
          <stop offset="62%" stopColor={ground} />
          <stop offset="100%" stopColor={ground} />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill={`url(#${gid})`} />
      {backdrop.id === 'meadow' && (
        <g>
          <circle cx="330" cy="40" r="26" fill={backdrop.accent} />
          <ellipse cx="90" cy="42" rx="30" ry="12" fill="#ffffff" opacity="0.9" />
          <ellipse cx="118" cy="48" rx="24" ry="10" fill="#ffffff" opacity="0.9" />
          {(
            [
              [40, 170, '#FF7BAC'],
              [90, 185, '#9B7EDE'],
              [150, 172, '#FF6B6B'],
              [230, 186, '#FF7BAC'],
              [300, 174, '#9B7EDE'],
              [360, 188, '#FF6B6B'],
            ] as [number, number, string][]
          ).map(([x, y, c], i) => (
            <g key={i}>
              <line x1={x} y1={y} x2={x} y2={y + 14} stroke="#3FA97C" strokeWidth="3" />
              <circle cx={x} cy={y} r="6" fill={c} />
            </g>
          ))}
        </g>
      )}
      {backdrop.id === 'night' && (
        <g>
          <path d="M330 18a30 30 0 1 0 18 52A34 34 0 0 1 330 18z" fill={backdrop.accent} />
          {[
            [40, 30],
            [110, 60],
            [180, 28],
            [250, 70],
            [300, 40],
            [60, 100],
            [150, 95],
            [220, 40],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3.4 : 2.2} fill="#fff" opacity="0.9" className="animate-kid-sparkle" style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
          <path d="M0 160 Q100 140 200 160 T400 155 V225 H0 Z" fill={ground} opacity="0.6" />
        </g>
      )}
      {backdrop.id === 'reef' && (
        <g>
          {[60, 140, 220, 300, 350].map((x, i) => (
            <circle key={i} cx={x} cy={50 + (i % 3) * 30} r={5 + (i % 3) * 3} fill="#ffffff" opacity="0.5" />
          ))}
          <path d="M0 170 Q50 155 100 170 T200 170 T300 170 T400 170 V225 H0 Z" fill={ground} />
          <ellipse cx="90" cy="120" rx="26" ry="16" fill={backdrop.accent} />
          <path d="M116 120 L132 110 L130 120 L132 130 Z" fill={backdrop.accent} />
          <circle cx="80" cy="116" r="3" fill="#17324F" />
          <ellipse cx="300" cy="90" rx="18" ry="11" fill="#FFD93C" />
          <path d="M318 90 L330 82 L328 90 L330 98 Z" fill="#FFD93C" />
          <circle cx="293" cy="87" r="2.4" fill="#17324F" />
          <g stroke="#3FA97C" strokeWidth="5" strokeLinecap="round">
            <path d="M180 200 q6 -22 -4 -40" fill="none" />
            <path d="M200 200 q-4 -20 6 -38" fill="none" />
          </g>
        </g>
      )}
      {backdrop.id === 'library' && (
        <g>
          {[30, 150, 270].map((x, i) => (
            <g key={i}>
              <rect x={x} y={30} width="100" height="170" rx="6" fill="#8A5A2B" />
              {[0, 1, 2].map((shelf) => (
                <g key={shelf}>
                  <rect x={x + 8} y={44 + shelf * 52} width="84" height="40" fill="#6E4520" rx="3" />
                  {[0, 1, 2, 3].map((b) => (
                    <rect
                      key={b}
                      x={x + 12 + b * 20}
                      y={48 + shelf * 52}
                      width="15"
                      height="32"
                      rx="2"
                      fill={['#9B7EDE', '#FF7BAC', '#4CC9F0', '#FFD93C'][((i + shelf + b) % 4) as number]}
                    />
                  ))}
                </g>
              ))}
            </g>
          ))}
        </g>
      )}
      {backdrop.id === 'space' && (
        <g>
          {[50, 130, 210, 290, 350].map((x, i) => (
            <circle key={i} cx={x} cy={30 + ((i * 47) % 90)} r="2.2" fill="#fff" opacity="0.85" />
          ))}
          <circle cx="90" cy="120" r="34" fill={backdrop.accent} opacity="0.9" />
          <ellipse cx="90" cy="120" rx="58" ry="14" fill="none" stroke="#fff" strokeWidth="4" opacity="0.7" transform="rotate(-18 90 120)" />
          <circle cx="300" cy="80" r="20" fill="#FF7BAC" />
          <circle cx="330" cy="160" r="12" fill="#FFD93C" />
          <rect x="150" y="150" width="90" height="46" rx="10" fill="#8FA3B8" />
          <rect x="162" y="160" width="66" height="24" rx="6" fill="#263238" />
          <circle cx="180" cy="172" r="4" fill="#4DD0E1" />
          <circle cx="210" cy="172" r="4" fill="#FFC93C" />
        </g>
      )}
      {backdrop.id === 'garden' && (
        <g>
          <circle cx="60" cy="44" r="24" fill="#fff" opacity="0.85" />
          <circle cx="340" cy="44" r="24" fill={backdrop.accent} />
          {[
            [70, 175],
            [140, 188],
            [210, 172],
            [280, 186],
            [350, 174],
          ].map(([x, y], i) => (
            <g key={i}>
              <line x1={x} y1={y} x2={x} y2={y + 16} stroke="#3FA97C" strokeWidth="4" />
              {[0, 1, 2, 3, 4].map((p) => (
                <circle key={p} cx={x + Math.cos((p * Math.PI) / 2.5) * 8} cy={y + Math.sin((p * Math.PI) / 2.5) * 8} r="5.5" fill={i % 2 ? '#FF7BAC' : '#fff'} stroke={backdrop.accent} strokeWidth="1.5" />
              ))}
              <circle cx={x} cy={y} r="5" fill="#FFD93C" />
            </g>
          ))}
          <ellipse cx="180" cy="70" rx="14" ry="10" fill="#FFD93C" stroke="#D9A800" strokeWidth="2" />
          <path d="M170 62 q10 -12 20 0 M190 62 q10 -12 20 0" stroke="#fff" strokeWidth="3" fill="none" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MovieStudio({ childId, nickname = 'friend', onExit }: MovieStudioProps) {
  const [tab, setTab] = useState<Tab>('cast');
  const [phase, setPhase] = useState<Phase>('studio');
  const [cast, setCast] = useState<string[]>([]);
  const [backdropId, setBackdropId] = useState<string | null>(null);
  const [beatIds, setBeatIds] = useState<string[]>([]);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const [gallery, setGallery] = useState<Movie[]>([]);
  const [starsEarned, setStarsEarned] = useState(0);
  const rewardedRef = useRef(false);

  // Load the saved-movie gallery on mount.
  useEffect(() => {
    const s = storage();
    if (s) setGallery(getMovies(s, childId));
  }, [childId]);

  // Stop narration when leaving.
  useEffect(() => () => stopSpeaking(), []);

  const previewName = (slot: 0 | 1) =>
    cast[slot] ? getCharacter(cast[slot]).name : slot === 0 ? 'our hero' : 'their friend';

  const toggleCast = useCallback((id: string) => {
    playSfx('pop');
    setCast((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  const pickBackdrop = useCallback((id: string) => {
    playSfx('pop');
    setBackdropId(id);
    setBeatIds([]);
  }, []);

  const toggleBeat = useCallback(
    (beat: StoryBeat) => {
      playSfx('pop');
      setBeatIds((prev) => {
        if (prev.includes(beat.id)) return prev.filter((b) => b !== beat.id);
        if (prev.length >= 3 || !backdropId) return prev;
        return [...prev, beat.id];
      });
    },
    [backdropId]
  );

  const previewBeat = useCallback(
    (beat: StoryBeat) => {
      playSfx('pop');
      const narrator = cast[0] ?? 'curio';
      speakAs(narrator, fillNarration(beat.narration, previewName(0), previewName(1)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cast]
  );

  const ready = cast.length === 2 && backdropId !== null && beatIds.length === 3;

  const startPremiere = useCallback(
    (m: Movie) => {
      if (!validMovie(m)) return;
      stopSpeaking();
      playSfx('fanfare');
      setMovie(m);
      setBeatIndex(0);
      setPhase('premiere');
      speakAs('curio', `Lights, camera, action! ${nickname}, your movie is starting!`);
    },
    [nickname]
  );

  const newMoviePremiere = useCallback(() => {
    if (!ready || !backdropId) return;
    const m: Movie = {
      characters: [cast[0], cast[1]],
      backdropId,
      beats: [beatIds[0], beatIds[1], beatIds[2]],
    };
    const s = storage();
    if (s) {
      if (saveMovie(s, childId, m)) setGallery(getMovies(s, childId));
    }
    startPremiere(m);
  }, [ready, backdropId, cast, beatIds, childId, startPremiere]);

  const watchSaved = useCallback(
    (m: Movie) => {
      playSfx('pop');
      startPremiere(m);
    },
    [startPremiere]
  );

  const removeSaved = useCallback(
    (index: number) => {
      playSfx('whoosh');
      const s = storage();
      if (s) setGallery(deleteMovie(s, childId, index));
    },
    [childId]
  );

  // Narrate each beat of the premiere, alternating the two stars.
  useEffect(() => {
    if (phase !== 'premiere' || !movie) return;
    const beat = beatFor(movie.backdropId, movie.beats[beatIndex]);
    if (!beat) return;
    const narrator = beatIndex % 2 === 0 ? movie.characters[0] : movie.characters[1];
    const nameA = getCharacter(movie.characters[0]).name;
    const nameB = getCharacter(movie.characters[1]).name;
    const t = window.setTimeout(() => {
      speakAs(narrator, fillNarration(beat.narration, nameA, nameB));
    }, 350);
    return () => window.clearTimeout(t);
  }, [phase, movie, beatIndex]);

  // First-premiere rewards.
  useEffect(() => {
    if (phase !== 'premiere' || rewardedRef.current) return;
    const s = storage();
    const firstEver = !s || !s.getItem(premiereKey(childId));
    if (!firstEver) return;
    rewardedRef.current = true;
    if (s) {
      try {
        s.setItem(premiereKey(childId), new Date().toISOString());
      } catch {
        /* flag is a bonus */
      }
    }
    void (async () => {
      try {
        await awardStars(childId, 10);
        setStarsEarned(10);
        await bumpQuestProgress(childId, 'movie_game', 1);
        // 'movie-maker' sticker def lands via the sibling Wave 6 track;
        // awardStickers filters unknown ids, so this is safe until then.
        await awardStickers(childId, ['movie-maker']);
        await logLearningEvent(childId, 'milestone', {
          metadata: { kind: 'movie_studio_premiere', backdrop: movie?.backdropId },
        });
      } catch {
        /* rewards are best-effort; the show still goes on */
      }
      // Trophy def lands in integration; until then this is a safe no-op.
      void checkTrophies(childId, 'movie_done').catch(() => {});
    })();
  }, [phase, childId, movie]);

  const nextBeat = useCallback(() => {
    playSfx('pop');
    if (beatIndex < 2) setBeatIndex(beatIndex + 1);
    else {
      stopSpeaking();
      setPhase('end');
    }
  }, [beatIndex]);

  const replayMovie = useCallback(() => {
    if (!movie) return;
    setBeatIndex(0);
    setPhase('premiere');
  }, [movie]);

  const backToStudio = useCallback(() => {
    stopSpeaking();
    setMovie(null);
    setPhase('studio');
    setTab('cast');
    setCast([]);
    setBackdropId(null);
    setBeatIds([]);
  }, []);

  const currentBackdrop = movie ? backdropFor(movie.backdropId) : null;
  const currentBeat = movie ? beatFor(movie.backdropId, movie.beats[beatIndex]) : null;

  const TABS: { id: Tab; label: string; done: boolean }[] = [
    { id: 'cast', label: 'Cast', done: cast.length === 2 },
    { id: 'scene', label: 'Scene', done: backdropId !== null },
    { id: 'story', label: 'Story', done: beatIds.length === 3 },
  ];

  return (
    <div className="flex min-h-full w-full flex-col items-center px-4 py-6">
      <style>{`
        .movie-bob { animation: movie-bob 2.4s ease-in-out infinite; }
        @keyframes movie-bob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .movie-bob { animation: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex w-full max-w-5xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
            playSfx('whoosh');
            stopSpeaking();
            onExit();
          }}
          className="rounded-full border-b-4 border-kid-ink-700 bg-white px-6 py-3 text-lg font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Back to the map"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-black text-kid-ink-900 md:text-3xl">My Movie Studio</h2>
        <div className="w-24" aria-hidden />
      </div>

      {phase === 'studio' && (
        <div className="mt-4 flex w-full max-w-5xl flex-col items-center">
          <p className="text-center text-lg font-bold text-kid-ink-700">
            Direct your own cartoon! Pick the cast, the scene, and the story — then premiere it.
          </p>

          {/* Tabs */}
          <div className="mt-4 flex w-full max-w-2xl gap-2" role="tablist" aria-label="Movie studio steps">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => {
                  playSfx('pop');
                  setTab(t.id);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-lg font-black transition-transform hover:scale-105 active:scale-95 ${
                  tab === t.id
                    ? 'bg-kid-ink-900 text-white shadow-lg'
                    : 'bg-white text-kid-ink-900 shadow'
                }`}
              >
                {t.label}
                {t.done && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-kid-mint-500 text-sm text-white" aria-label="done">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Cast tab */}
          {tab === 'cast' && (
            <div className="mt-6 w-full" role="tabpanel" aria-label="Pick the cast">
              <p className="text-center text-xl font-black text-kid-ink-900">Who stars in your movie? Pick two!</p>
              <div className="mt-4 grid grid-cols-4 gap-3 md:gap-4">
                {CAST_IDS.map((id) => {
                  const Avatar = AVATARS[id]?.Component;
                  const selected = cast.includes(id);
                  const order = cast.indexOf(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleCast(id)}
                      aria-pressed={selected}
                      aria-label={`${getCharacter(id).name}${selected ? `, star ${order + 1}` : ''}`}
                      className={`relative flex flex-col items-center gap-1 rounded-kid-card bg-white p-3 shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                        selected ? 'ring-4 ring-kid-sun-400' : ''
                      }`}
                    >
                      {Avatar && <Avatar className="h-16 w-16 md:h-20 md:w-20" />}
                      <span className="text-sm font-black text-kid-ink-900 md:text-base">{getCharacter(id).name}</span>
                      {selected && (
                        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-kid-sun-400 text-sm font-black text-kid-ink-900" aria-hidden>
                          {order + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scene tab */}
          {tab === 'scene' && (
            <div className="mt-6 w-full" role="tabpanel" aria-label="Pick the scene">
              <p className="text-center text-xl font-black text-kid-ink-900">Where does your movie happen?</p>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                {BACKDROPS.map((b) => {
                  const selected = backdropId === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => pickBackdrop(b.id)}
                      aria-pressed={selected}
                      aria-label={b.name}
                      className={`overflow-hidden rounded-kid-card bg-white text-left shadow-lg transition-transform hover:scale-[1.03] active:scale-95 ${
                        selected ? 'ring-4 ring-kid-sun-400' : ''
                      }`}
                    >
                      <BackdropArt backdrop={b} className="aspect-video w-full" />
                      <div className="px-4 py-3">
                        <p className="text-lg font-black text-kid-ink-900">{b.name}</p>
                        <p className="text-sm font-bold text-kid-ink-700">{b.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Story tab */}
          {tab === 'story' && (
            <div className="mt-6 w-full" role="tabpanel" aria-label="Pick the story beats">
              {!backdropId ? (
                <p className="text-center text-lg font-bold text-kid-ink-700">
                  Pick a scene first, then come back to choose your story!
                </p>
              ) : (
                <>
                  <p className="text-center text-xl font-black text-kid-ink-900">
                    Pick 3 story moments, in order! ({beatIds.length}/3)
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {(BEATS[backdropId] ?? []).map((beat) => {
                      const order = beatIds.indexOf(beat.id);
                      const selected = order >= 0;
                      return (
                        <div
                          key={beat.id}
                          className={`flex items-stretch gap-3 rounded-kid-card bg-white p-4 shadow-lg ${
                            selected ? 'ring-4 ring-kid-sun-400' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleBeat(beat)}
                            aria-pressed={selected}
                            aria-label={`${selected ? 'Remove' : 'Add'} story moment: ${beat.title}`}
                            className="flex flex-1 flex-col items-start gap-1 text-left"
                          >
                            <span className="flex items-center gap-2">
                              {selected && (
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-kid-sun-400 text-sm font-black text-kid-ink-900" aria-hidden>
                                  {order + 1}
                                </span>
                              )}
                              <span className="text-lg font-black text-kid-ink-900">{beat.title}</span>
                            </span>
                            <span className="text-sm font-bold text-kid-ink-700">
                              {fillNarration(beat.narration, previewName(0), previewName(1))}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => previewBeat(beat)}
                            aria-label={`Hear ${beat.title}`}
                            className="flex h-14 w-14 shrink-0 items-center justify-center self-center rounded-full bg-kid-sky-400 text-white shadow transition-transform hover:scale-110 active:scale-95"
                          >
                            <SpeakerIcon className="h-7 w-7" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Premiere button */}
          <button
            type="button"
            disabled={!ready}
            onClick={newMoviePremiere}
            className="mt-8 rounded-full border-b-8 border-kid-coral-700 bg-kid-coral-400 px-12 py-5 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Premiere!
          </button>
          {!ready && (
            <p className="mt-2 text-center text-sm font-bold text-kid-ink-700" aria-live="polite">
              {cast.length < 2 && 'Pick 2 stars for your cast. '}
              {!backdropId && 'Choose a scene. '}
              {beatIds.length < 3 && 'Choose 3 story moments.'}
            </p>
          )}

          {/* My Movies gallery */}
          {gallery.length > 0 && (
            <div className="mt-10 w-full">
              <h3 className="text-center text-2xl font-black text-kid-ink-900">My Movies</h3>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-4" role="list" aria-label="Saved movies">
                {gallery.map((m, i) => {
                  const bd = backdropFor(m.backdropId);
                  if (!bd) return null;
                  const A = AVATARS[m.characters[0]]?.Component;
                  const B = AVATARS[m.characters[1]]?.Component;
                  return (
                    <div key={i} role="listitem" className="w-56 shrink-0 overflow-hidden rounded-kid-card bg-white shadow-lg">
                      <BackdropArt backdrop={bd} className="aspect-video w-full" />
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex -space-x-2" aria-hidden>
                          {A && <A className="h-10 w-10 rounded-full bg-kid-sky-100" />}
                          {B && <B className="h-10 w-10 rounded-full bg-kid-sky-100" />}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => watchSaved(m)}
                            aria-label={`Watch movie ${i + 1}`}
                            className="rounded-full bg-kid-mint-500 px-4 py-2 text-sm font-black text-white transition-transform hover:scale-105 active:scale-95"
                          >
                            Watch
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSaved(i)}
                            aria-label={`Delete movie ${i + 1}`}
                            className="rounded-full bg-kid-coral-400 px-4 py-2 text-sm font-black text-white transition-transform hover:scale-105 active:scale-95"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Premiere playback */}
      {phase === 'premiere' && movie && currentBackdrop && (
        <div className="fixed inset-0 z-50 flex flex-col bg-kid-ink-900" role="dialog" aria-modal="true" aria-label="Movie premiere">
          <div className="relative flex-1 overflow-hidden">
            <BackdropArt backdrop={currentBackdrop} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-8 pb-6 md:gap-16">
              {movie.characters.map((cid, i) => {
                const Avatar = AVATARS[cid]?.Component;
                return Avatar ? (
                  <div key={cid} className="movie-bob flex flex-col items-center" style={{ animationDelay: `${i * 0.6}s` }}>
                    <Avatar className="h-28 w-28 drop-shadow-[0_10px_16px_rgba(23,50,79,0.5)] md:h-40 md:w-40" />
                    <span className="mt-1 rounded-full bg-black/50 px-4 py-1 text-lg font-black text-white">
                      {getCharacter(cid).name}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                playSfx('whoosh');
                stopSpeaking();
                setPhase('studio');
              }}
              aria-label="Stop the movie"
              className="absolute left-4 top-4 rounded-full bg-black/50 px-5 py-2.5 text-lg font-black text-white transition-transform hover:scale-105 active:scale-95"
            >
              ← Stop
            </button>
          </div>
          <div className="flex flex-col items-center gap-3 bg-kid-ink-900 px-4 pb-8 pt-2">
            <div className="flex gap-2" aria-label={`Scene ${beatIndex + 1} of 3`}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-full ${i === beatIndex ? 'bg-kid-sun-400' : 'bg-white/30'}`}
                  aria-hidden
                />
              ))}
            </div>
            <p className="text-center text-xl font-black text-white md:text-2xl" aria-live="polite">
              {currentBeat?.title}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!currentBeat) return;
                  playSfx('pop');
                  const narrator = beatIndex % 2 === 0 ? movie.characters[0] : movie.characters[1];
                  speakAs(
                    narrator,
                    fillNarration(
                      currentBeat.narration,
                      getCharacter(movie.characters[0]).name,
                      getCharacter(movie.characters[1]).name
                    )
                  );
                }}
                aria-label="Hear this scene again"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white transition-transform hover:scale-110 active:scale-95"
              >
                <SpeakerIcon className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={nextBeat}
                className="rounded-full border-b-8 border-kid-sun-600 bg-kid-sun-400 px-10 py-4 text-xl font-black text-kid-ink-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
              >
                {beatIndex < 2 ? 'Next scene →' : 'The End'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The End card */}
      {phase === 'end' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/90 p-4" role="dialog" aria-modal="true" aria-label="The end">
          <div className="animate-kid-pop-in flex w-full max-w-lg flex-col items-center rounded-kid-card bg-white px-8 py-10 shadow-2xl">
            <p className="text-5xl font-black text-kid-ink-900 md:text-6xl">The End</p>
            <p className="mt-3 text-center text-lg font-bold text-kid-ink-700">
              Bravo, director {nickname}! Your cartoon premiered{starsEarned > 0 && ` and earned ${starsEarned} stars`}!
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playSfx('pop');
                  replayMovie();
                }}
                className="rounded-full border-b-4 border-kid-sky-700 bg-kid-sky-400 px-8 py-4 text-xl font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Watch again
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx('pop');
                  backToStudio();
                }}
                className="rounded-full border-b-4 border-kid-mint-700 bg-kid-mint-500 px-8 py-4 text-xl font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                New movie
              </button>
            </div>
            <p className="mt-4 text-sm font-bold text-kid-ink-600">
              Find it anytime in My Movies{gallery.length >= MAX_MOVIES - 1 ? ` (${MAX_MOVIES} max)` : ''}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
