'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AVATARS } from '@/components/avatars';
import { getCharacter } from '@/lib/kid/characters';
import { playSfx, speakAs, stopSpeaking, unlockAudio } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import {
  EPISODES,
  FRIEND_NAMES,
  type CinemaBackdrop,
  type CinemaEpisode,
  type CinemaScene,
} from '@/lib/kid/cinema';

// ---------------------------------------------------------------------------
// Story-friend actors: hand-drawn SVG pals (Pip, Hoot, Sprocket, Dewdrop).
// No emoji, no icon fonts — original art only.
// ---------------------------------------------------------------------------

function PipFox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Pip the little fox">
      <path d="M14 4 L26 20 L8 18 Z" fill="#E8853D" />
      <path d="M50 4 L38 20 L56 18 Z" fill="#E8853D" />
      <path d="M16 10 L23 19 L12 17 Z" fill="#F7B267" />
      <path d="M48 10 L41 19 L52 17 Z" fill="#F7B267" />
      <ellipse cx="32" cy="38" rx="20" ry="17" fill="#F49E4C" />
      <ellipse cx="32" cy="46" rx="10" ry="7" fill="#FFF3E0" />
      <circle cx="24" cy="34" r="3" fill="#17324F" />
      <circle cx="40" cy="34" r="3" fill="#17324F" />
      <circle cx="25" cy="33" r="1" fill="#fff" />
      <circle cx="41" cy="33" r="1" fill="#fff" />
      <path d="M29 43 L35 43 L32 47 Z" fill="#17324F" />
      <path d="M26 50 Q32 54 38 50" stroke="#17324F" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function HootOwl({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Hoot the little owl">
      <path d="M16 12 L22 22 L12 20 Z" fill="#6D4C41" />
      <path d="M48 12 L42 22 L52 20 Z" fill="#6D4C41" />
      <ellipse cx="32" cy="36" rx="18" ry="20" fill="#8D6E63" />
      <ellipse cx="32" cy="43" rx="10" ry="11" fill="#D7CCC8" />
      <ellipse cx="15" cy="38" rx="5" ry="9" fill="#6D4C41" />
      <ellipse cx="49" cy="38" rx="5" ry="9" fill="#6D4C41" />
      <circle cx="25" cy="28" r="7" fill="#fff" />
      <circle cx="39" cy="28" r="7" fill="#fff" />
      <circle cx="25" cy="29" r="3.2" fill="#17324F" />
      <circle cx="39" cy="29" r="3.2" fill="#17324F" />
      <circle cx="26" cy="28" r="1.1" fill="#fff" />
      <circle cx="40" cy="28" r="1.1" fill="#fff" />
      <path d="M29 36 L35 36 L32 40 Z" fill="#FFB020" />
      <path d="M27 47 Q32 50 37 47" stroke="#4E342E" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function SprocketBot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Sprocket the little inventor">
      <line x1="32" y1="14" x2="32" y2="6" stroke="#78909C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="5" r="3.4" fill="#FFC93C" />
      <rect x="17" y="14" width="30" height="23" rx="9" fill="#90A4AE" />
      <rect x="21" y="19" width="22" height="10" rx="5" fill="#263238" />
      <circle cx="28" cy="24" r="2.6" fill="#4DD0E1" className="animate-kid-sparkle" />
      <circle cx="36" cy="24" r="2.6" fill="#4DD0E1" className="animate-kid-sparkle" style={{ animationDelay: '0.5s' }} />
      <rect x="22" y="39" width="20" height="15" rx="6" fill="#78909C" />
      <circle cx="28" cy="46" r="2.4" fill="#FF8A7A" />
      <circle cx="36" cy="46" r="2.4" fill="#4FD8C4" />
      <rect x="12" y="40" width="7" height="12" rx="3.5" fill="#78909C" />
      <rect x="45" y="40" width="7" height="12" rx="3.5" fill="#78909C" />
      <rect x="24" y="54" width="6" height="6" rx="2" fill="#546E7A" />
      <rect x="34" y="54" width="6" height="6" rx="2" fill="#546E7A" />
    </svg>
  );
}

function DewdropDrop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Dewdrop the tiny droplet">
      <path
        d="M32 5 C32 5 15 28 15 40 a17 17 0 0 0 34 0 C49 28 32 5 32 5 Z"
        fill="#4CC9F0"
        stroke="#1D8FBF"
        strokeWidth="2.5"
      />
      <ellipse cx="25" cy="36" rx="4.5" ry="7" fill="#BDEFFF" opacity="0.85" transform="rotate(-18 25 36)" />
      <circle cx="26" cy="40" r="2.8" fill="#17324F" />
      <circle cx="38" cy="40" r="2.8" fill="#17324F" />
      <circle cx="27" cy="39" r="1" fill="#fff" />
      <circle cx="39" cy="39" r="1" fill="#fff" />
      <path d="M27 47 Q32 51 37 47" stroke="#17324F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M14 44 Q8 48 6 54" stroke="#1D8FBF" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M50 44 Q56 48 58 54" stroke="#1D8FBF" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const FRIEND_ART: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  pip: PipFox,
  hoot: HootOwl,
  sprocket: SprocketBot,
  dewdrop: DewdropDrop,
};

/** Display name for any cinema cast id (avatar cast or story friend). */
function castName(id: string): string {
  const friend = (FRIEND_NAMES as Record<string, string>)[id];
  if (friend) return friend;
  return getCharacter(id).name;
}

/** Resolve any cinema cast id to its SVG actor component. */
function ActorArt({ id, className }: { id: string; className?: string }) {
  const Avatar = AVATARS[id]?.Component;
  if (Avatar) return <Avatar className={className} />;
  const Friend = FRIEND_ART[id];
  if (Friend) return <Friend className={className} />;
  const Fallback = AVATARS.curio.Component;
  return <Fallback className={className} />;
}

// ---------------------------------------------------------------------------
// Animated backdrops (SVG tableaux, 16:9).
// ---------------------------------------------------------------------------

const STARS: { x: number; y: number; r: number; d: string }[] = [
  { x: 60, y: 60, r: 2.4, d: '0s' },
  { x: 140, y: 140, r: 1.8, d: '0.4s' },
  { x: 220, y: 70, r: 2.8, d: '0.9s' },
  { x: 310, y: 150, r: 1.6, d: '0.2s' },
  { x: 390, y: 60, r: 2.2, d: '1.3s' },
  { x: 470, y: 130, r: 1.8, d: '0.7s' },
  { x: 550, y: 60, r: 2.6, d: '1.1s' },
  { x: 620, y: 160, r: 1.6, d: '0.5s' },
  { x: 710, y: 90, r: 2.2, d: '1.6s' },
  { x: 760, y: 180, r: 1.8, d: '0.1s' },
  { x: 100, y: 220, r: 1.6, d: '1.9s' },
  { x: 420, y: 210, r: 2, d: '0.8s' },
  { x: 680, y: 240, r: 1.7, d: '1.4s' },
  { x: 250, y: 200, r: 1.5, d: '0.3s' },
];

function Clouds({ count, dark = false }: { count: number; dark?: boolean }) {
  const fill = dark ? '#3A4670' : '#ffffff';
  const spots = [
    { x: 90, y: 80, s: 1, dur: '11s', delay: '0s' },
    { x: 330, y: 120, s: 0.7, dur: '15s', delay: '2s' },
    { x: 560, y: 70, s: 1.2, dur: '19s', delay: '5s' },
    { x: 700, y: 140, s: 0.8, dur: '13s', delay: '1s' },
  ];
  return (
    <g>
      {spots.slice(0, count).map((c, i) => (
        <g
          key={i}
          className="animate-kid-drift"
          style={{ animationDuration: c.dur, animationDelay: c.delay }}
          opacity={dark ? 0.8 : 0.92}
        >
          <g transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            <ellipse cx="0" cy="0" rx="46" ry="20" fill={fill} />
            <ellipse cx="-28" cy="8" rx="28" ry="15" fill={fill} />
            <ellipse cx="28" cy="8" rx="30" ry="16" fill={fill} />
          </g>
        </g>
      ))}
    </g>
  );
}

function BackdropArt({ backdrop }: { backdrop: CinemaBackdrop }) {
  if (backdrop === 'night') {
    return (
      <svg viewBox="0 0 800 450" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="cin-night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1B2451" />
            <stop offset="1" stopColor="#4A3B8C" />
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cin-night)" />
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFF6D6" className="animate-kid-sparkle" style={{ animationDelay: s.d }} />
        ))}
        <circle cx="660" cy="95" r="42" fill="#FFF6D6" opacity="0.98" />
        <circle cx="648" cy="85" r="9" fill="#EAD9A8" opacity="0.8" />
        <circle cx="672" cy="105" r="6" fill="#EAD9A8" opacity="0.8" />
        <circle cx="660" cy="80" r="4" fill="#EAD9A8" opacity="0.7" />
        <Clouds count={2} dark />
        <path d="M0 360 Q200 320 400 355 T800 345 V450 H0 Z" fill="#232C55" />
        <path d="M0 395 Q260 365 520 395 T800 388 V450 H0 Z" fill="#1A2148" />
      </svg>
    );
  }
  if (backdrop === 'ocean') {
    return (
      <svg viewBox="0 0 800 450" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="cin-osk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7DD8F7" />
            <stop offset="1" stopColor="#DFF6FF" />
          </linearGradient>
          <linearGradient id="cin-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2A9FD8" />
            <stop offset="1" stopColor="#1668A8" />
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cin-osk)" />
        <circle cx="150" cy="90" r="46" fill="#FFD93C" />
        <circle cx="150" cy="90" r="62" fill="#FFD93C" opacity="0.25" />
        <Clouds count={3} />
        <rect y="280" width="800" height="170" fill="url(#cin-sea)" />
        <g className="animate-kid-drift" style={{ animationDuration: '9s' }}>
          <path d="M0 292 Q50 282 100 292 T200 292 T300 292 T400 292 T500 292 T600 292 T700 292 T800 292 V310 H0 Z" fill="#ffffff" opacity="0.5" />
        </g>
        <g className="animate-kid-drift" style={{ animationDuration: '13s', animationDelay: '1.5s' }}>
          <path d="M0 330 Q60 320 120 330 T240 330 T360 330 T480 330 T600 330 T720 330 T840 330 V350 H0 Z" fill="#ffffff" opacity="0.35" />
        </g>
        {/* little sailboat on the horizon */}
        <g transform="translate(580 250)">
          <path d="M-34 44 L34 44 L22 62 L-22 62 Z" fill="#8D6E63" />
          <path d="M0 44 L0 4 L30 44 Z" fill="#fff" opacity="0.95" />
          <path d="M-4 44 L-4 10 L-28 44 Z" fill="#FF8A7A" opacity="0.95" />
        </g>
        {[120, 300, 480, 660, 220].map((x, i) => (
          <circle key={i} cx={x} cy={380 - (i % 3) * 24} r={5 + (i % 3) * 2} fill="#BDEFFF" opacity="0.55" className="animate-kid-float" style={{ animationDelay: `${i * 0.5}s` }} />
        ))}
      </svg>
    );
  }
  if (backdrop === 'sky') {
    return (
      <svg viewBox="0 0 800 450" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="cin-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4CC9F0" />
            <stop offset="1" stopColor="#DFF9FF" />
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#cin-sky)" />
        <g className="animate-kid-spin-slow" style={{ transformOrigin: '650px 100px', animationDuration: '24s' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x="646" y="30" width="8" height="26" rx="4" fill="#FFD93C" opacity="0.85" transform={`rotate(${i * 45} 650 100)`} />
          ))}
        </g>
        <circle cx="650" cy="100" r="44" fill="#FFD93C" />
        <circle cx="650" cy="100" r="60" fill="#FFD93C" opacity="0.25" />
        <Clouds count={4} />
        <path d="M180 200 q10 -12 20 0 q10 -12 20 0" stroke="#2B4A6F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M250 160 q8 -10 16 0 q8 -10 16 0" stroke="#2B4A6F" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M0 420 Q400 400 800 420 V450 H0 Z" fill="#BDEFFF" opacity="0.6" />
      </svg>
    );
  }
  // meadow
  return (
    <svg viewBox="0 0 800 450" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="cin-meadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7DD8F7" />
          <stop offset="0.62" stopColor="#DFF6FF" />
          <stop offset="0.63" stopColor="#7FB069" />
          <stop offset="1" stopColor="#5C9E52" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#cin-meadow)" />
      <circle cx="120" cy="85" r="40" fill="#FFD93C" />
      <circle cx="120" cy="85" r="54" fill="#FFD93C" opacity="0.25" />
      <Clouds count={3} />
      <path d="M0 330 Q200 290 400 330 T800 320 V450 H0 Z" fill="#7FB069" />
      <path d="M0 380 Q260 350 520 380 T800 372 V450 H0 Z" fill="#5C9E52" />
      {[
        { x: 120, y: 400, c: '#FF8AC2' },
        { x: 330, y: 415, c: '#FFD93C' },
        { x: 540, y: 402, c: '#FF8A7A' },
        { x: 700, y: 418, c: '#B983FF' },
      ].map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y})`}>
          <line x1="0" y1="0" x2="0" y2="-22" stroke="#2E7D32" strokeWidth="4" strokeLinecap="round" />
          <circle cx="0" cy="-28" r="8" fill={f.c} />
          <circle cx="0" cy="-28" r="3.4" fill="#fff" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Small SVG icon buttons (no emoji).
// ---------------------------------------------------------------------------

function Chevron({ dir, className }: { dir: 'left' | 'right'; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === 'left' ? <path d="M14 6 L8 12 L14 18" /> : <path d="M10 6 L16 12 L10 18" />}
    </svg>
  );
}

function PlayPauseIcon({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      {playing ? (
        <>
          <rect x="6" y="5" width="4.5" height="14" rx="1.5" />
          <rect x="13.5" y="5" width="4.5" height="14" rx="1.5" />
        </>
      ) : (
        <path d="M8 5.5 L18 12 L8 18.5 Z" />
      )}
    </svg>
  );
}

const RAIN_DROPS = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: ((i * 0.37) % 1.4).toFixed(2),
  dur: (0.9 + ((i * 13) % 7) / 10).toFixed(2),
}));

const POSTER_GRADIENTS: Record<string, string> = {
  pip: 'from-kid-sky-300 to-kid-mint-400',
  hoot: 'from-kid-ink-900 to-kid-grape-700',
  sprocket: 'from-kid-ink-700 to-kid-sky-400',
  dewdrop: 'from-kid-sky-300 to-kid-sky-600',
};

// ---------------------------------------------------------------------------
// StoryCinema
// ---------------------------------------------------------------------------

export default function StoryCinema({ childId, onExit }: { childId: string; onExit: () => void }) {
  const [phase, setPhase] = useState<'picker' | 'player' | 'end'>('picker');
  const [episode, setEpisode] = useState<CinemaEpisode | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [starsEarned, setStarsEarned] = useState(0);
  const playingRef = useRef(true);
  const rewardedRef = useRef(false);

  const scene: CinemaScene | null = episode ? episode.scenes[sceneIndex] ?? null : null;

  const speakScene = useCallback((ep: CinemaEpisode, idx: number) => {
    stopSpeaking();
    if (playingRef.current) speakAs('curio', ep.scenes[idx].narration);
  }, []);

  const startEpisode = useCallback(
    (ep: CinemaEpisode) => {
      unlockAudio();
      playSfx('fanfare');
      rewardedRef.current = false;
      setStarsEarned(0);
      setEpisode(ep);
      setSceneIndex(0);
      setPhase('player');
      playingRef.current = true;
      setPlaying(true);
      stopSpeaking();
      speakAs('curio', ep.scenes[0].narration);
    },
    []
  );

  const goToScene = useCallback(
    (idx: number) => {
      if (!episode) return;
      const clamped = Math.max(0, Math.min(episode.scenes.length - 1, idx));
      setSceneIndex(clamped);
      playSfx('pop');
      speakScene(episode, clamped);
    },
    [episode, speakScene]
  );

  const finishEpisode = useCallback(() => {
    if (!episode) return;
    playSfx('fanfare');
    stopSpeaking();
    setPhase('end');
    if (playingRef.current) {
      speakAs('curio', `The end! What a wonderful tale. You earned 5 stars for watching, little moviegoer!`);
    }
  }, [episode]);

  const next = useCallback(() => {
    if (!episode) return;
    if (sceneIndex < episode.scenes.length - 1) goToScene(sceneIndex + 1);
    else finishEpisode();
  }, [episode, sceneIndex, goToScene, finishEpisode]);

  const prev = useCallback(() => {
    if (sceneIndex > 0) goToScene(sceneIndex - 1);
  }, [sceneIndex, goToScene]);

  const togglePlay = useCallback(() => {
    if (!episode || !scene) return;
    const nowPlaying = !playingRef.current;
    playingRef.current = nowPlaying;
    setPlaying(nowPlaying);
    if (nowPlaying) {
      playSfx('pop');
      speakAs('curio', scene.narration);
    } else {
      stopSpeaking();
    }
  }, [episode, scene]);

  const backToPicker = useCallback(() => {
    stopSpeaking();
    setPhase('picker');
    setEpisode(null);
  }, []);

  // Keyboard: arrows move between scenes, space toggles narration.
  useEffect(() => {
    if (phase !== 'player') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, next, prev, togglePlay]);

  // Stop narration when leaving.
  useEffect(() => () => stopSpeaking(), []);

  // End-of-episode rewards: stars, sticker, trophy check, milestone log.
  useEffect(() => {
    if (phase !== 'end' || !episode || rewardedRef.current) return;
    rewardedRef.current = true;
    void (async () => {
      try {
        await awardStars(childId, 5);
        setStarsEarned(5);
        // 'movie-star' sticker is defined by the content track; awardStickers
        // ignores unknown ids, so this is safe until it lands.
        await awardStickers(childId, ['movie-star']);
        await logLearningEvent(childId, 'milestone', {
          metadata: { kind: 'cinema_watched', episode: episode.id },
        });
      } catch {
        /* rewards are best-effort; the celebration still stands */
      }
      // Trophy def lands in integration; until then this is a safe no-op.
      void checkTrophies(childId, 'cinema_done').catch(() => {});
    })();
  }, [phase, episode, childId]);

  return (
    <div className="flex min-h-full w-full flex-col items-center bg-gradient-to-b from-kid-sky-300 to-kid-sky-500 px-4 py-6">
      <style>{`
        .cinema-pan { animation: cinema-pan 16s ease-in-out infinite alternate; transform-origin: center; }
        @keyframes cinema-pan {
          from { transform: scale(1.03) translate(0, 0); }
          to { transform: scale(1.13) translate(-1.5%, 1%); }
        }
        .cinema-rain { animation-name: cinema-rain-fall; animation-timing-function: linear; animation-iteration-count: infinite; }
        @keyframes cinema-rain-fall {
          from { transform: translateY(-120%); }
          to { transform: translateY(1250%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cinema-pan, .cinema-rain { animation: none !important; }
        }
      `}</style>

      {phase === 'picker' && (
        <div className="flex w-full max-w-5xl flex-col items-center">
          <h2 className="animate-kid-rise text-center text-3xl font-black text-kid-ink-900 md:text-4xl">Story Cinema</h2>
          <p className="animate-kid-rise mt-2 text-center text-lg font-bold text-kid-ink-700" style={{ animationDelay: '0.1s' }}>
            Pick a cartoon tale — Curio will narrate every scene!
          </p>
          <div className="mt-6 grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
            {EPISODES.map((ep, i) => {
              const Friend = FRIEND_ART[ep.friendId];
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => startEpisode(ep)}
                  className="animate-kid-rise group overflow-hidden rounded-kid-card bg-white text-left shadow-xl transition-transform hover:scale-[1.02] active:scale-95"
                  style={{ animationDelay: `${0.15 + i * 0.08}s` }}
                  aria-label={`Watch ${ep.title}`}
                >
                  <div className={`relative aspect-video w-full overflow-hidden bg-gradient-to-b ${POSTER_GRADIENTS[ep.friendId]}`}>
                    {ep.friendId === 'hoot' &&
                      STARS.slice(0, 8).map((s, k) => (
                        <span
                          key={k}
                          className="animate-kid-sparkle absolute rounded-full bg-white"
                          style={{ left: `${(s.x / 800) * 100}%`, top: `${(s.y / 450) * 100}%`, width: 5, height: 5, animationDelay: s.d }}
                        />
                      ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Friend className="animate-kid-float h-28 w-28 drop-shadow-[0_10px_16px_rgba(23,50,79,0.4)] transition-transform duration-300 group-hover:scale-110 md:h-32 md:w-32" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-4 py-2.5">
                      <div>
                        <p className="text-lg font-black text-white md:text-xl">{ep.title}</p>
                        <p className="text-xs font-bold text-white/85 md:text-sm">{ep.tagline}</p>
                      </div>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-kid-sun-400 shadow-lg transition-transform group-hover:scale-110" aria-hidden="true">
                        <PlayPauseIcon playing={false} className="ml-0.5 h-6 w-6 text-kid-ink-900" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              playSfx('whoosh');
              stopSpeaking();
              onExit();
            }}
            className="mt-6 rounded-full border-b-4 border-kid-ink-700 bg-white px-8 py-3 text-lg font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Back
          </button>
        </div>
      )}

      {phase === 'player' && episode && scene && (
        <div className="flex w-full max-w-5xl flex-col items-center">
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playSfx('whoosh');
                backToPicker();
              }}
              className="rounded-full border-b-4 border-kid-ink-700 bg-white px-6 py-2.5 text-base font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Back to episode picker"
            >
              Back
            </button>
            <h2 className="text-center text-xl font-black text-kid-ink-900 md:text-2xl">{episode.title}</h2>
            <p className="rounded-full bg-white/70 px-4 py-2 text-sm font-black text-kid-ink-900" aria-live="polite">
              Scene {sceneIndex + 1} of {episode.scenes.length}
            </p>
          </div>

          {/* The cinema screen: 16:9 letterboxed tableau */}
          <div className="group/screen relative mt-4 aspect-video w-full overflow-hidden rounded-kid-card bg-black shadow-2xl">
            <div key={scene.id} className="cinema-pan absolute inset-0">
              <BackdropArt backdrop={scene.backdrop} />
              {scene.fx === 'rain' && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                  {RAIN_DROPS.map((d, i) => (
                    <span
                      key={i}
                      className="cinema-rain absolute -top-4 h-16 w-[2px] rounded bg-kid-sky-300/80"
                      style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }}
                    />
                  ))}
                </div>
              )}
              {scene.fx === 'bubbles' && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                  {[12, 30, 52, 70, 88].map((left, i) => (
                    <span
                      key={i}
                      className="animate-kid-float absolute rounded-full border-2 border-white/70 bg-white/20"
                      style={{
                        left: `${left}%`,
                        bottom: '8%',
                        width: 18 + (i % 3) * 10,
                        height: 18 + (i % 3) * 10,
                        animationDelay: `${i * 0.6}s`,
                        animationDuration: '5s',
                      }}
                    />
                  ))}
                </div>
              )}
              {/* actors on stage */}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-3 px-8 pb-6 md:gap-6">
                {scene.cast.map((id, i) => (
                  <div key={`${scene.id}-${id}`} className="animate-kid-pop-in flex flex-col items-center" style={{ animationDelay: `${i * 0.18}s` }}>
                    <div className="animate-kid-bob" style={{ animationDelay: `${i * 0.45}s` }}>
                      <ActorArt id={id} className="h-20 w-20 drop-shadow-[0_10px_14px_rgba(23,50,79,0.45)] md:h-28 md:w-28" />
                    </div>
                    <span className="mt-1 rounded-full bg-black/45 px-3 py-0.5 text-xs font-black text-white md:text-sm">
                      {castName(id)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* tap zones: left = previous, right = next */}
            <button
              type="button"
              onClick={prev}
              disabled={sceneIndex === 0}
              className="absolute inset-y-0 left-0 z-10 w-1/4 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100 disabled:cursor-default"
              aria-label="Previous scene"
            >
              <span className="absolute left-3 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white">
                <Chevron dir="left" className="h-8 w-8" />
              </span>
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute inset-y-0 right-0 z-10 w-1/4 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
              aria-label={sceneIndex === episode.scenes.length - 1 ? 'Finish episode' : 'Next scene'}
            >
              <span className="absolute right-3 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white">
                <Chevron dir="right" className="h-8 w-8" />
              </span>
            </button>

            {/* letterbox caption bar */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-black/80 px-4 py-3">
              <p className="text-center text-base font-bold text-white md:text-xl">{scene.caption}</p>
            </div>
          </div>

          {/* controls */}
          <div className="mt-4 flex w-full items-center justify-between gap-2 rounded-kid-card bg-white/85 px-3 py-3 shadow-lg md:px-5">
            <button
              type="button"
              onClick={prev}
              disabled={sceneIndex === 0}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-kid-sky-400 text-white shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
              aria-label="Previous scene"
            >
              <Chevron dir="left" className="h-7 w-7" />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Scenes">
              {episode.scenes.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === sceneIndex}
                  aria-label={`Go to scene ${i + 1}`}
                  onClick={() => goToScene(i)}
                  className={`h-4 rounded-full transition-all ${
                    i === sceneIndex ? 'w-10 bg-kid-sun-400' : 'w-4 bg-kid-ink-700/25 hover:bg-kid-ink-700/45'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-kid-coral-400 text-white shadow transition-transform hover:scale-105 active:scale-95"
              aria-label={playing ? 'Pause narration' : 'Play narration'}
            >
              <PlayPauseIcon playing={playing} className="h-7 w-7" />
            </button>
            <button
              type="button"
              onClick={next}
              className="flex h-14 items-center gap-1 rounded-full bg-kid-mint-500 px-6 text-lg font-black text-white shadow transition-transform hover:scale-105 active:scale-95"
              aria-label={sceneIndex === episode.scenes.length - 1 ? 'Finish episode' : 'Next scene'}
            >
              {sceneIndex === episode.scenes.length - 1 ? 'Finish' : 'Next'}
              <Chevron dir="right" className="h-6 w-6" />
            </button>
          </div>
          <p className="mt-2 text-center text-sm font-bold text-kid-ink-700">
            Tap the sides of the screen, use the arrow keys, or press the buttons to move through the tale.
          </p>
        </div>
      )}

      {phase === 'end' && episode && (
        <div className="animate-kid-pop-in flex w-full max-w-2xl flex-col items-center rounded-kid-card bg-kid-cream px-6 py-10 text-center shadow-2xl">
          <p className="text-5xl font-black text-kid-ink-900 md:text-6xl">The End</p>
          <p className="mt-3 text-xl font-bold text-kid-ink-700">{episode.title}</p>
          <div className="mt-5 flex items-center gap-2 rounded-full bg-kid-sun-400 px-8 py-3 shadow-lg">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#17324F" aria-hidden="true">
              <path d="M12 2 L14.8 8.6 L22 9.3 L16.7 14 L18.2 21 L12 17.3 L5.8 21 L7.3 14 L2 9.3 L9.2 8.6 Z" />
            </svg>
            <span className="text-2xl font-black text-kid-ink-900">+{starsEarned} stars!</span>
          </div>
          <p className="mt-3 text-base font-bold text-kid-ink-700">Great watching, little moviegoer!</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                backToPicker();
              }}
              className="rounded-full border-b-8 border-kid-sky-600 bg-kid-sky-400 px-8 py-4 text-xl font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Watch another
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('whoosh');
                stopSpeaking();
                onExit();
              }}
              className="rounded-full border-b-8 border-kid-ink-700 bg-white px-8 py-4 text-xl font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Back to the sky
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
