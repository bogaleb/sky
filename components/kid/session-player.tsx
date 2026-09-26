'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AttemptResult, PlannedStep, SessionChild } from '@/lib/kid/types';
import { getSessionPlan, submitActivityAttempt, logLearningEvent } from '@/app/actions/learning';
import { awardStickers, getChildStickers, awardStars, getStarBalance } from '@/app/actions/rewards';
import { checkTrophies } from '@/app/actions/trophies';
import type { Trophy } from '@/lib/kid/trophies';
import { getHomeSnapshot, getIslandProgress } from '@/app/actions/progress';
import { ageProfile } from '@/lib/kid/age-profile';
import { buildGarden, type SkillMasterySnapshot } from '@/lib/kid/garden';
import { buildToday, daySeed, type PathStop } from '@/lib/kid/today';
import TodayHome from './today-home';
import { getTrailState, getTrailPlan, completeTrailQuest, recordDailyActivity, bumpQuestProgress, type TrailState } from '@/app/actions/trail';
import TrailBanner from './trail-banner';
import QuestIntro from './quest-intro';
import ShowdownCard from './showdown-card';
import SplashIntro from './splash-intro';
import StreakCalendar from './streak-calendar';
import {
  GAME_GROUPS,
  GAME_REGISTRY,
  GameCard,
  GameOverlay,
  gamesForGroup,
  getGame,
  todaysPicks,
  type GameGroupId,
} from './game-registry';
import WelcomeQuest from './welcome-quest';
import GoalMeter from './goal-meter';
import SeasonalDecor from './seasonal-decor';
import DailyGift from './daily-gift';
import OfflineBanner from './offline-banner';
import { loadPlacement } from '@/lib/kid/placement';
import UpNext from './up-next';
import CharacterTalk from './character-talk';
import { PetWidget } from './pet-widget';
import type { TrailStop } from '@/lib/kid/trail';
import { toPlannedStep, type ServerPlanItem } from '@/lib/kid/types';
import { playSfx, speak, speakAs, unlockAudio } from '@/lib/kid/audio';
import { getCharacter, charLine } from '@/lib/kid/characters';
import { getIsland, type Island } from '@/lib/kid/islands';
import { STICKERS, stickersForIslandVisit, getSticker } from '@/lib/kid/stickers';
import type { Song } from '@/lib/kid/songs';
import type { Story } from '@/lib/kid/stories';
import KidShell from './kid-shell';
import ActivityStage from './activity-stage';
import PhaseTransition from './kid-transition';
import { IslandIntroSkeleton } from './loading-skeleton';
import HostCharacter, { type CharacterMood } from './host-character';
import SkyMap from './sky-map';
import VideoSpot from './video-spot';
import StickerBook from './sticker-book';
import Songbook from './songbook';
import Storybook from './storybook';
import LibraryPicker from './library-picker';
import { ConfettiBurst } from './celebration';
import { TrophyCelebration } from './trophy-shelf';
import { AVATARS } from '@/components/avatars';

export interface SessionPlayerProps {
  child: SessionChild;
  steps: PlannedStep[];
  sessionId: string | null;
  onExit: () => void;
  onReplay: () => void;
}

// 'map' is the Today home; 'explore' is the full hub (islands, Sky Park, trail, gifts).
type Phase = 'intro' | 'map' | 'explore' | 'islandIntro' | 'trailIntro' | 'playing' | 'complete' | 'goodbye';

/** Welcome intro: Captain Curio's video fills the screen, UI floats on top. */
function Intro({ child, onStart }: { child: SessionChild; onStart: () => void }) {
  return (
    <div className="animate-kid-rise relative w-full flex-1 overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]" style={{ minHeight: '62vh' }}>
      <div className="absolute inset-0">
        <VideoSpot
          rounded={false}
          src="/videos/welcome.mp4"
          label="Captain Curio welcomes you to the sky"
          characterId="curio"
          voiceover={`Ahoy, ${child.nickname}! I'm Captain Curio! Welcome to the Sky! Nine magical islands are waiting for you. Pick one, and let's learn together!`}
          caption={`Ahoy, ${child.nickname}! Welcome to the Sky! Pick an island and let's learn together!`}
          overlay={
            <button
              type="button"
              onClick={() => {
                unlockAudio();
                playSfx('fanfare');
                onStart();
              }}
              className="rounded-kid-card border-b-8 border-kid-coral-600 bg-kid-coral-500 px-14 py-6 text-3xl font-black text-white shadow-[0_18px_44px_rgba(255,107,107,0.5)] transition-all hover:scale-105 hover:brightness-105 active:scale-95"
            >
              Let&apos;s fly!
            </button>
          }
        />
      </div>
      {/* Title floats over the top of the video. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[rgba(12,24,44,0.55)] to-transparent px-6 pb-10 pt-6 text-center">
        <h1 className="text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(12,24,44,0.6)] md:text-5xl">
          Ready to fly, {child.nickname}?
        </h1>
        <p className="mt-1 text-xl font-bold text-white/95 drop-shadow-[0_2px_8px_rgba(12,24,44,0.6)]">
          Nine islands are waiting — reading, math, music, and more!
        </p>
      </div>
    </div>
  );
}

/** Island intro: the host's video fills the screen, UI floats on top. */
function IslandIntro({
  island,
  child,
  onStart,
  onStoryTime,
  onSingAlong,
}: {
  island: Island;
  child: SessionChild;
  onStart: () => void;
  onStoryTime?: () => void;
  onSingAlong?: () => void;
}) {
  const host = getCharacter(island.hostCharacter);
  return (
    <div className="animate-kid-rise relative w-full flex-1 overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]" style={{ minHeight: '62vh' }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${island.sky[0]}, ${island.sky[1]})` }}>
        <VideoSpot
          rounded={false}
          src={`/videos/${island.hostCharacter}-intro.mp4`}
          label={`${host.name} welcomes you to ${island.islandName}`}
          characterId={island.hostCharacter}
          voiceover={host.greeting}
          caption={host.greeting}
          overlay={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  playSfx('whoosh');
                  speakAs(island.hostCharacter, `Yay! Let's play, ${child.nickname}!`);
                  onStart();
                }}
                className="rounded-kid-card border-b-8 px-12 py-5 text-2xl font-black text-white shadow-[0_18px_44px_rgba(23,50,79,0.35)] transition-all hover:scale-105 hover:brightness-105 active:scale-95"
                style={{ background: island.color, borderColor: 'rgba(0,0,0,0.18)' }}
              >
                Play with {host.name}!
              </button>
              {onStoryTime && (
                <button
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    playSfx('pop');
                    onStoryTime();
                  }}
                  className="rounded-kid-card border-b-8 border-kid-grape-600 bg-kid-grape-400 px-8 py-5 text-2xl font-black text-white shadow-[0_18px_44px_rgba(23,50,79,0.35)] transition-all hover:scale-105 active:scale-95"
                >
                  Story time!
                </button>
              )}
              {onSingAlong && (
                <button
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    playSfx('pop');
                    onSingAlong();
                  }}
                  className="rounded-kid-card border-b-8 border-kid-berry-600 bg-kid-berry-400 px-8 py-5 text-2xl font-black text-white shadow-[0_18px_44px_rgba(23,50,79,0.35)] transition-all hover:scale-105 active:scale-95"
                >
                  Sing with {host.name}!
                </button>
              )}
            </div>
          }
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[rgba(12,24,44,0.55)] to-transparent px-6 pb-10 pt-6 text-center">
        <h1 className="text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(12,24,44,0.6)] md:text-5xl">
          {island.islandName}
        </h1>
        <p className="mt-1 text-xl font-bold text-white/95 drop-shadow-[0_2px_8px_rgba(12,24,44,0.6)]">
          {host.name} has {child.nickname}&apos;s {island.subjectName.toLowerCase()} games ready!
        </p>
      </div>
    </div>
  );
}

/** Session complete: celebration video, stars, points, replay/exit. */
function Complete({
  child,
  stars,
  points,
  newStickers,
  questOutro,
  onReplay,
  onExit,
}: {
  child: SessionChild;
  stars: number;
  points: number;
  newStickers: string[];
  questOutro: string | null;
  onReplay: () => void;
  onExit: () => void;
}) {
  const Avatar = (AVATARS[child.avatarId] ?? AVATARS.curio).Component;
  return (
    <div className="animate-kid-rise relative w-full flex-1 overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]" style={{ minHeight: '62vh' }}>
      <ConfettiBurst count={90} />
      <div className="absolute inset-0 bg-gradient-to-b from-kid-grape-400 via-kid-berry-400 to-kid-sun-300">
        <VideoSpot
          rounded={false}
          src="/videos/celebrate.mp4"
          label="Celebration"
          characterId="curio"
          voiceover={`Amazing flying, ${child.nickname}! You earned ${points} points! The whole sky is so proud of you!`}
          caption={`Amazing flying, ${child.nickname}! You earned ${points} points!`}
          overlay={
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  playSfx('whoosh');
                  onReplay();
                }}
                className="rounded-kid-card border-b-8 border-kid-mint-600 bg-kid-mint-500 px-10 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
              >
                Play again!
              </button>
              <button
                type="button"
                onClick={onExit}
                className="rounded-kid-card border-b-8 border-white/60 bg-white/85 px-10 py-5 text-2xl font-black text-kid-ink-700 shadow-[0_14px_30px_rgba(23,50,79,0.2)] backdrop-blur transition-all hover:scale-105 active:scale-95"
              >
                Done for now
              </button>
            </div>
          }
        />
      </div>
      {/* Stars + headline float over the top of the video. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center bg-gradient-to-b from-[rgba(12,24,44,0.55)] to-transparent px-6 pb-12 pt-5">
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="animate-kid-pop-in" style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <path
                  d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
                  fill={i < stars ? '#FFC93C' : 'rgba(255,255,255,0.5)'}
                  stroke={i < stars ? '#E09E00' : 'rgba(255,255,255,0.9)'}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ))}
        </div>
        <h1 className="mt-1 text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(12,24,44,0.6)] md:text-5xl">
          {questOutro ? 'Quest complete!' : `Amazing flying, ${child.nickname}!`}
        </h1>
        {questOutro && (
          <p className="mt-2 max-w-xl text-center text-xl font-bold text-white/95 drop-shadow-[0_2px_8px_rgba(12,24,44,0.6)]">
            {questOutro}
          </p>
        )}
        {newStickers.length > 0 && (
          <div className="animate-kid-pop-in mt-3 flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 shadow-xl" style={{ animationDelay: '1s' }}>
            <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
              <rect x="10" y="14" width="44" height="38" rx="6" fill="#FFD93C" />
              <circle cx="32" cy="34" r="9" fill="#fff" />
              <path d="M32 29l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#FFD93C" />
            </svg>
            <span className="text-lg font-black text-kid-ink-900">
              New sticker{newStickers.length > 1 ? 's' : ''}: {newStickers.map((id) => getSticker(id)?.name).filter(Boolean).join(', ')}!
            </span>
          </div>
        )}
        <div className="animate-kid-bob mt-2">
          <Avatar className="h-20 w-20 drop-shadow-[0_12px_20px_rgba(23,50,79,0.3)]" />
        </div>
      </div>
    </div>
  );
}

/** Goodbye ritual: Captain Curio's video fills the screen, farewell floats on top. */
function Goodbye({ child, onDone }: { child: SessionChild; onDone: () => void }) {
  return (
    <div className="animate-kid-rise relative w-full flex-1 overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]" style={{ minHeight: '62vh' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-kid-grape-400 to-kid-sun-300">
        <VideoSpot
          rounded={false}
          src="/videos/goodbye.mp4"
          label="Captain Curio says goodbye"
          characterId="curio"
          voiceover={`What a wonderful day of learning, ${child.nickname}! I'm so proud of you. Tomorrow, a brand-new island adventure is waiting. Sleep tight, little captain!`}
          caption={`What a wonderful day, ${child.nickname}! Tomorrow brings a brand-new adventure!`}
          onDone={onDone}
          overlay={
            <button
              type="button"
              onClick={onDone}
              className="rounded-kid-card border-b-8 border-kid-sky-600 bg-kid-sky-500 px-12 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
            >
              Bye-bye!
            </button>
          }
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[rgba(12,24,44,0.55)] to-transparent px-6 pb-10 pt-6 text-center">
        <h1 className="text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(12,24,44,0.6)] md:text-5xl">
          See you tomorrow, {child.nickname}!
        </h1>
      </div>
    </div>
  );
}

/**
 * The session state machine:
 * intro -> map -> islandIntro -> playing -> complete -> goodbye.
 * Owns points, star progress, character mood, and server submission.
 */
export default function SessionPlayer({ child, steps, sessionId, onExit, onReplay }: SessionPlayerProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [stars, setStars] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [mood, setMood] = useState<CharacterMood>('idle');
  const [island, setIsland] = useState<Island | null>(null);
  const [islandSteps, setIslandSteps] = useState<PlannedStep[] | null>(null);
  const [loadingIsland, setLoadingIsland] = useState(false);
  const [novaComfort, setNovaComfort] = useState(false);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [islandProgress, setIslandProgress] = useState<Record<string, { mastered: number; total: number }>>({});
  const [stickerIds, setStickerIds] = useState<string[]>([]);
  const [showStickers, setShowStickers] = useState(false);
  const [newStickers, setNewStickers] = useState<string[]>([]);
  const [newTrophies, setNewTrophies] = useState<Trophy[]>([]);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [pickingLibrary, setPickingLibrary] = useState<'story' | 'song' | null>(null);
  const [trailState, setTrailState] = useState<TrailState | null>(null);
  const [trailStop, setTrailStop] = useState<TrailStop | null>(null);
  const [questMode, setQuestMode] = useState<'trail' | null>(null);
  const [startingQuest, setStartingQuest] = useState(false);
  const [questOutro, setQuestOutro] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [talkWith, setTalkWith] = useState<string | null>(null);
  const [openGame, setOpenGame] = useState<string | null>(null);
  const [parkTab, setParkTab] = useState<GameGroupId>('reading');
  // Today home: age profile, mastery snapshot, and which path stops are done.
  const profile = ageProfile(child.ageBand);
  const [snapshot, setSnapshot] = useState<SkillMasterySnapshot[] | null>(null);
  const doneKey = `sky-today-done-${child.id}-${daySeed(new Date())}`;
  const [doneStops, setDoneStops] = useState<string[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(doneKey) : null;
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
    } catch {
      return [];
    }
  });
  const activeStop = useRef<string | null>(null);
  const markStopDone = useCallback(
    (key: string | null) => {
      if (!key) return;
      activeStop.current = null;
      setDoneStops((prev) => {
        if (prev.includes(key)) return prev;
        const next = [...prev, key];
        try {
          window.localStorage.setItem(doneKey, JSON.stringify(next));
        } catch {
          /* per-device convenience only */
        }
        return next;
      });
    },
    [doneKey]
  );
  const resultsRef = useRef<AttemptResult[]>([]);

  // Browser back button closes an open game overlay instead of leaving the deck.
  // When a game opens we push a history entry; popstate closes the overlay.
  // A ref tracks whether the close came from the back button (popstate) vs.
  // the in-app UI (Escape/button), so we only undo the push in the latter case.
  // Also sets a body attribute so CSS can hide the outer HUD (double-HUD fix).
  const gameCloseFromPop = useRef(false);
  useEffect(() => {
    if (openGame === null) {
      document.body.removeAttribute('data-sky-game-open');
      return;
    }
    document.body.setAttribute('data-sky-game-open', 'true');
    gameCloseFromPop.current = false;
    window.history.pushState({ skyGame: openGame }, '', `${window.location.pathname}#game-${openGame}`);
    const onPop = () => {
      gameCloseFromPop.current = true;
      setOpenGame(null);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // In-app close (not the back button): undo our push so back skips the game.
      if (!gameCloseFromPop.current && window.location.hash.startsWith('#game-')) {
        window.history.back();
      }
    };
  }, [openGame]);

  // Load the real star wallet balance on mount so the HUD shows the child's actual stars.
  useEffect(() => {
    void getStarBalance(child.id)
      .then(({ balance }) => setWalletBalance(balance))
      .catch(() => {});
  }, [child.id]);

  // Load island progress + sticker book + trail state whenever the map shows.
  useEffect(() => {
    if (phase !== 'map' && phase !== 'explore') return;
    void getIslandProgress(child.id)
      .then((list) => {
        const map: Record<string, { mastered: number; total: number }> = {};
        for (const p of list) map[p.subjectCode] = { mastered: p.mastered, total: p.total };
        setIslandProgress(map);
      })
      .catch(() => {});
    void getChildStickers(child.id)
      .then(setStickerIds)
      .catch(() => {});
    void getTrailState(child.id)
      .then(setTrailState)
      .catch(() => {});
    // Welcome Quest: first-ever run gets the magical onboarding.
    try {
      if (!loadPlacement(child.id)) setShowWelcome(true);
    } catch {
      /* corrupted placement data — skip the quest */
    }
  }, [phase, child.id]);

  // Mastery snapshot for today's path and the garden (refreshed on every return home).
  useEffect(() => {
    if (phase !== 'map') return;
    void getHomeSnapshot(child.id)
      .then(setSnapshot)
      .catch(() => setSnapshot((prev) => prev ?? []));
  }, [phase, child.id]);

  const todayPlan = useMemo(
    () =>
      snapshot === null
        ? null
        : buildToday({ profile, games: GAME_REGISTRY, skills: snapshot, now: new Date() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profile is derived from child.ageBand
    [snapshot, child.ageBand]
  );
  const garden = useMemo(
    () => (snapshot === null ? null : buildGarden(profile.gardenSubjects, snapshot)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profile is derived from child.ageBand
    [snapshot, child.ageBand]
  );

  // A game opened from today's path counts as done when the child comes back.
  const prevOpenGame = useRef<string | null>(null);
  useEffect(() => {
    const was = prevOpenGame.current;
    prevOpenGame.current = openGame;
    if (was && !openGame && activeStop.current === `game-${was}`) markStopDone(activeStop.current);
  }, [openGame, markStopDone]);

  const activeSteps = islandSteps ?? steps;
  const step = activeSteps[index];

  const handleSubmit = useCallback(
    async (activityId: string, answer: unknown, latencyMs: number): Promise<AttemptResult> => {
      const result = await submitActivityAttempt(child.id, activityId, answer, latencyMs, sessionId ?? undefined);
      return result;
    },
    [child.id, sessionId]
  );

  const handleComplete = useCallback(
    (result: AttemptResult) => {
      resultsRef.current.push(result);
      if (result.correct) {
        setPoints((p) => p + result.pointsEarned);
        setStars((s) => s + 1);
        setNovaComfort(false);
        if (result.leveledUp) {
          setTimeout(() => playSfx('levelup'), 900);
        }
        // The host celebrates in their own voice.
        const hostId = step?.hostCharacter ?? 'curio';
        speakAs(hostId, charLine(hostId, 'praise'));
      } else {
        // Nova the peer comforts after mistakes — mistakes are safe here.
        setNovaComfort(true);
        speakAs('nova', charLine('nova', 'encouragement'));
        setTimeout(() => setNovaComfort(false), 6000);
      }
      if (index + 1 < activeSteps.length) {
        setMood('idle');
        setIndex((i) => i + 1);
        playSfx('whoosh');
      } else {
        setPhase('complete');
        if (activeStop.current === 'lesson') markStopDone('lesson');
        playSfx('fanfare');
        const earnedCount = resultsRef.current.filter((r) => r.correct).length;
        const totalPoints = resultsRef.current.reduce((s, r) => s + r.pointsEarned, 0);
        speak(`Amazing flying, ${child.nickname}! You earned ${earnedCount} stars!`);
        // Award stickers for the island visit + special achievements.
        const visitSubject = island?.subjectCode ?? trailStop?.subjectCode ?? null;
        const stickerEarn: string[] = stickersForIslandVisit(visitSubject);
        if (earnedCount === activeSteps.length && activeSteps.length > 0) stickerEarn.push('perfect-flight');
        if (resultsRef.current.some((r) => !r.correct)) stickerEarn.push('brave-try');
        void awardStickers(child.id, stickerEarn)
          .then((fresh) => {
            setNewStickers(fresh);
            if (fresh.length > 0) {
              setStickerIds((prev) => [...prev, ...fresh.filter((f) => !prev.includes(f))]);
              const first = getSticker(fresh[0]);
              if (first) {
                setTimeout(() => speakAs(first.characterId, `You earned the ${first.name} sticker! ${first.description}`), 2500);
              }
            }
          })
          .catch(() => {});
        void logLearningEvent(child.id, 'milestone', {
          sessionId: sessionId ?? undefined,
          metadata: {
            kind: 'session_complete',
            stars: earnedCount,
            points: totalPoints,
          },
        }).catch(() => {});
        // Persist stars to the wallet, keep the streak, feed daily quests.
        void recordDailyActivity(child.id).catch(() => {});
        // Trophies: persist stars first so lifetime-star milestones see the
        // fresh total, then check activity-count, perfect-session, and star
        // trophies. Best-effort; awards are idempotent.
        void (async () => {
          try {
            await awardStars(child.id, earnedCount);
            // Star Collector sticker at 100 lifetime stars (idempotent).
            const { lifetimeEarned } = await getStarBalance(child.id);
            if (lifetimeEarned >= 100) {
              const freshStars = await awardStickers(child.id, ['star-100']).catch(() => [] as string[]);
              if (freshStars.length > 0) {
                setStickerIds((prev) => [...prev, ...freshStars.filter((f) => !prev.includes(f))]);
              }
            }
            const perfect = earnedCount === activeSteps.length && activeSteps.length > 0;
            const [activityTrophies, sessionTrophies] = await Promise.all([
              checkTrophies(child.id, 'activity_complete'),
              checkTrophies(child.id, 'session_complete', { perfect }),
            ]);
            const fresh = [...activityTrophies, ...sessionTrophies];
            if (fresh.length > 0) {
              setNewTrophies((prev) => [
                ...prev,
                ...fresh.filter((t) => !prev.some((p) => p.id === t.id)),
              ]);
            }
          } catch {
            /* trophies are enhancement-only */
          }
        })();
        void bumpQuestProgress(child.id, 'activities_6', activeSteps.length).catch(() => {});
        void bumpQuestProgress(child.id, 'stars_50', earnedCount).catch(() => {});
        const visitedSubject = island?.subjectCode ?? trailStop?.subjectCode;
        if (visitedSubject) {
          void bumpQuestProgress(child.id, 'islands_2', 1).catch(() => {});
        }
        // Trail quest completion: advance the trail and celebrate.
        // (Session-level quest bumps already happened above; completeTrailQuest
        // only advances trail-specific progress to avoid double-counting.)
        if (questMode === 'trail' && trailStop) {
          const finishedStop = trailStop;
          void completeTrailQuest(child.id)
            .then((res) => {
              setQuestOutro(finishedStop.outro);
              speakAs('curio', `Quest complete! ${finishedStop.outro} Your next quest is ${res.nextStop.questTitle}!`);
              return getTrailState(child.id);
            })
            .then(setTrailState)
            .catch(() => {});
        }
      }
    },
    [child.id, child.nickname, index, activeSteps.length, sessionId, step?.hostCharacter, questMode, trailStop, markStopDone]
  );

  const startIslandSession = useCallback(
    async (selected: Island | null) => {
      // null = "Surprise me": use the adaptive mix already planned.
      if (!selected) {
        setIsland(null);
        setIslandSteps(null);
        setIndex(0);
        setPhase('playing');
        return;
      }
      setLoadingIsland(true);
      try {
        const res = await getSessionPlan(child.id, { subjectCode: selected.subjectCode, sessionLength: 6 });
        const next = (res.plan as unknown as ServerPlanItem[]).map(toPlannedStep);
        if (next.length === 0) throw new Error('empty plan');
        setIsland(selected);
        setIslandSteps(next);
        setIndex(0);
        setPoints(0);
        setStars(0);
        resultsRef.current = [];
        setPhase('islandIntro');
      } catch {
        // Fall back to the adaptive mix if the island plan fails.
        setIsland(selected);
        setIslandSteps(null);
        setIndex(0);
        setPhase('islandIntro');
      } finally {
        setLoadingIsland(false);
      }
    },
    [child.id]
  );

  const startTrailQuest = useCallback(async () => {
    setStartingQuest(true);
    try {
      const res = await getTrailPlan(child.id);
      const next = (res.plan as unknown as ServerPlanItem[]).map(toPlannedStep);
      if (next.length === 0) throw new Error('empty plan');
      setTrailStop(res.stop);
      setQuestMode('trail');
      setIslandSteps(next);
      setIsland(null);
      setIndex(0);
      setPoints(0);
      setStars(0);
      setQuestOutro(null);
      resultsRef.current = [];
      setPhase('trailIntro');
    } catch {
      // Fall back to the map if the quest plan fails.
      setPhase('map');
    } finally {
      setStartingQuest(false);
    }
  }, [child.id]);

  const beginPlaying = () => {
    setPhase('playing');
    const first = activeSteps[0];
    if (first) {
      void logLearningEvent(child.id, 'milestone', {
        sessionId: sessionId ?? undefined,
        metadata: {
          kind: 'session_start',
          planned: activeSteps.length,
          island: island?.subjectCode ?? 'surprise',
          quest_mode: questMode ?? 'free',
          trail_quest: trailStop?.questTitle ?? null,
        },
      }).catch(() => {});
    }
  };

  const startStop = (stop: PathStop) => {
    activeStop.current = stop.key;
    if (stop.kind === 'lesson') void startIslandSession(null);
    else if (stop.kind === 'story') setPickingLibrary('story');
    else if (stop.gameId) setOpenGame(stop.gameId);
  };

  const backToMap = () => {
    setPhase('map');
    setIndex(0);
    setIsland(null);
    setIslandSteps(null);
    setTrailStop(null);
    setQuestMode(null);
    setQuestOutro(null);
    setPoints(0);
    setStars(0);
    setNewStickers([]);
    setNewTrophies([]);
    resultsRef.current = [];
  };

  return (
    <>
    <KidShell
      doneCount={stars}
      totalSteps={activeSteps.length}
      points={(walletBalance ?? 0) + points}
      onExit={phase === 'playing' || phase === 'map' || phase === 'explore' || phase === 'trailIntro' ? onExit : undefined}
      hideHud={openGame !== null}
      hudId="outer"
    >
      <SplashIntro onDone={() => {}} />
      {loadingIsland && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-sky-300/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-kid-card bg-white/90 px-6 py-8 shadow-2xl">
            <p className="mb-5 text-center text-2xl font-black text-kid-ink-900">Flying to the island…</p>
            <IslandIntroSkeleton />
          </div>
        </div>
      )}
      <PhaseTransition transitionKey={phase} className="flex w-full flex-col items-center">
      {phase === 'intro' && <Intro child={child} onStart={() => setPhase('map')} />}
      {phase === 'map' && (
        <TodayHome
          nickname={child.nickname}
          profile={profile}
          plan={todayPlan}
          garden={garden}
          done={doneStops}
          onStartStop={startStop}
          onOpenGame={(id) => setOpenGame(id)}
          onExplore={() => setPhase('explore')}
        />
      )}
      {phase === 'explore' && (
        <>
          <div className="relative z-10 flex w-full flex-col items-center gap-5">
          <button
            type="button"
            onClick={() => {
              playSfx('whoosh');
              setPhase('map');
            }}
            className="kid-press self-start rounded-full border-b-4 border-kid-ink-700 bg-white px-6 py-3 text-lg font-black text-kid-ink-900 shadow-lg"
            aria-label="Back to today"
          >
            ← Today
          </button>
          <SeasonalDecor />
          <OfflineBanner />
          <TrailBanner trail={trailState} onStartQuest={() => void startTrailQuest()} starting={startingQuest} />
          {/* Sky Park: Trail-first hub. Today's picks for 1-tap fun, then games
              organized by subject — every game reachable in at most 2 taps. */}
          <section aria-label="Sky Park" className="glass-kid relative w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
            <h2 className="font-display text-center text-2xl text-kid-ink-900 md:text-4xl">Sky Park</h2>
            <p className="mt-1 text-center text-sm font-bold text-kid-ink-700 md:text-base">
              Pick today&apos;s games, or explore by subject
            </p>
            {/* Today's picks — deterministic daily rotation, one tap to play. */}
            <div className="mt-5">
              <h3 className="font-display text-lg font-black text-kid-ink-900 md:text-xl">Today&apos;s picks</h3>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
                {todaysPicks().map((entry) => (
                  <GameCard key={entry.id} entry={entry} onOpen={(id) => setOpenGame(id)} />
                ))}
              </div>
            </div>
            {/* Subject tabs — every game is one more tap away. */}
            <div className="mt-6">
              <div role="tablist" aria-label="Games by subject" className="flex flex-wrap justify-center gap-2">
                {GAME_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    role="tab"
                    aria-selected={parkTab === g.id}
                    onClick={() => {
                      playSfx('pop');
                      setParkTab(g.id);
                    }}
                    className={
                      parkTab === g.id
                        ? 'btn-kid btn-kid-sky btn-kid-sm'
                        : 'rounded-full bg-white/70 px-5 py-2.5 text-base font-extrabold text-kid-ink-900 shadow-md transition-transform hover:scale-105 active:scale-95'
                    }
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-xs font-bold text-kid-ink-700">
                {(GAME_GROUPS.find((g) => g.id === parkTab) ?? GAME_GROUPS[0]).tag}
              </p>
              <div role="tabpanel" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
                {gamesForGroup(parkTab).map((entry) => (
                  <GameCard key={entry.id} entry={entry} onOpen={(id) => setOpenGame(id)} />
                ))}
              </div>
            </div>
            {/* Pet companion quick entry. */}
            <div className="mt-5 flex justify-center">
              <PetWidget child={child} onOpen={() => setOpenGame('pet')} />
            </div>
          </section>
          <UpNext
            childId={child.id}
            onPracticeIsland={(islandId) => {
              const isl = getIsland(islandId);
              if (isl) void startIslandSession(isl);
            }}
            onStartTrail={() => void startTrailQuest()}
          />
          <div className="glass-kid flex w-full max-w-4xl flex-wrap items-stretch justify-center gap-3 px-4 py-4">
            <GoalMeter childId={child.id} />
            <DailyGift childId={child.id} nickname={child.nickname} />
            <ShowdownCard childId={child.id} />
            <StreakCalendar childId={child.id} />
          </div>
          <SkyMap
            nickname={child.nickname}
            onSelectIsland={(isl) => void startIslandSession(isl)}
            onSurprise={() => void startIslandSession(null)}
            onOpenStickers={() => setShowStickers(true)}
            onTalkToCharacter={(id) => setTalkWith(id)}
            progress={islandProgress}
            stickerCount={stickerIds.length}
            stickerTotal={STICKERS.length}
          />
          </div>
        </>
      )}
      {showWelcome && (
        <WelcomeQuest childId={child.id} nickname={child.nickname} onDone={() => setShowWelcome(false)} />
      )}
            {talkWith && <CharacterTalk characterId={talkWith} onClose={() => setTalkWith(null)} />}
      {phase === 'trailIntro' && trailStop && (
        <QuestIntro stop={trailStop} nickname={child.nickname} onStart={beginPlaying} />
      )}
      {showStickers && (
        <StickerBook earnedIds={stickerIds} onClose={() => setShowStickers(false)} />
      )}
      {phase === 'islandIntro' && island && (
        <IslandIntro
          island={island}
          child={child}
          onStart={beginPlaying}
          onStoryTime={island.subjectCode === 'reading' ? () => setPickingLibrary('story') : undefined}
          onSingAlong={island.subjectCode === 'music' ? () => setPickingLibrary('song') : undefined}
        />
      )}
      {pickingLibrary && (
        <LibraryPicker
          kind={pickingLibrary}
          onClose={() => setPickingLibrary(null)}
          onPick={(item) => {
            setPickingLibrary(null);
            if (pickingLibrary === 'story') setActiveStory(item as Story);
            else setActiveSong(item as Song);
          }}
        />
      )}
      {activeStory && (
        <Storybook
          story={activeStory}
          onDone={() => {
            setActiveStory(null);
            if (activeStop.current === 'story') markStopDone('story');
          }}
          onFinish={() => {
            setActiveStory(null);
            if (activeStop.current === 'story') markStopDone('story');
            // Finishing a story earns the Bookworm sticker + feeds the Bookworm daily quest!
            // After 6pm local time it also earns the Night Owl bedtime-story sticker.
            void bumpQuestProgress(child.id, 'story_read', 1).catch(() => {});
            const storyStickers = ['bookworm', 'friend-luna', 'star-reading'];
            if (new Date().getHours() >= 18) storyStickers.push('night-owl');
            void awardStickers(child.id, storyStickers)
              .then((fresh) => {
                if (fresh.length > 0) {
                  setStickerIds((prev) => [...prev, ...fresh.filter((f) => !prev.includes(f))]);
                  speakAs('luna', 'Wonderful reading! You finished the whole story! You earned the Story Explorer sticker!');
                }
              })
              .catch(() => {});
            void logLearningEvent(child.id, 'milestone', {
              sessionId: sessionId ?? undefined,
              metadata: { kind: 'story_finished', story: activeStory.id },
            }).catch(() => {});
          }}
        />
      )}
      {activeSong && (
        <Songbook
          song={activeSong}
          onDone={() => setActiveSong(null)}
          onFinish={() => {
            setActiveSong(null);
            // Singing earns the Songbird sticker + feeds the Songbird daily quest!
            void bumpQuestProgress(child.id, 'song_sung', 1).catch(() => {});
            void awardStickers(child.id, ['songbird', 'friend-riff', 'star-music'])
              .then((fresh) => {
                if (fresh.length > 0) {
                  setStickerIds((prev) => [...prev, ...fresh.filter((f) => !prev.includes(f))]);
                  speakAs('riff', 'Bravo! You sang the whole song! You earned the Songbird sticker!');
                }
              })
              .catch(() => {});
            void logLearningEvent(child.id, 'milestone', {
              sessionId: sessionId ?? undefined,
              metadata: { kind: 'song_finished', song: activeSong.id },
            }).catch(() => {});
          }}
        />
      )}
      {phase === 'playing' && step && (
        <div key={step.activityId} className="animate-kid-view-enter relative flex w-full flex-col items-center">
          <ActivityStage
            step={step}
            onSubmit={handleSubmit}
            onComplete={handleComplete}
            onMood={setMood}
          />
          {/* Nova the peer pops in to comfort after mistakes */}
          {novaComfort && (
            <div className="animate-kid-pop-in absolute -top-2 right-2 flex items-center gap-2 rounded-kid-card border-4 border-white/70 bg-white/95 px-4 py-2 shadow-xl md:right-8">
              <HostCharacter characterId="nova" mood="oops" size={64} />
              <div className="flex flex-col items-start gap-1">
                <p className="max-w-[180px] text-base font-extrabold text-kid-ink-800">
                  Oops! Let&apos;s try again together!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    setShowTryAgain(true);
                  }}
                  className="rounded-full bg-kid-sun-400 px-4 py-1.5 text-sm font-black text-kid-ink-900 shadow transition-all hover:scale-105 active:scale-95"
                >
                  Watch me try!
                </button>
              </div>
            </div>
          )}
          {/* Nova's try-again encouragement video — big cinematic modal */}
          {showTryAgain && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/70 p-3 backdrop-blur-sm md:p-8">
              <div className="animate-kid-pop-in relative h-full max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-kid-card border-4 border-white/70 shadow-2xl">
                <VideoSpot
                  rounded={false}
                  src="/videos/nova-try-again.mp4"
                  label="Nova tries again"
                  characterId="nova"
                  voiceover="Watch me! Oops, my tower fell over! That's okay. Mistakes help our brains grow. Let me try again... Yay, I did it! You can try again too!"
                  caption="Oops! My tower fell. That's okay — mistakes help our brains grow. Trying again!"
                  onDone={() => setShowTryAgain(false)}
                  overlay={
                    <button
                      type="button"
                      onClick={() => setShowTryAgain(false)}
                      className="rounded-kid-card border-b-8 border-kid-sun-600 bg-kid-sun-400 px-10 py-4 text-2xl font-black text-kid-ink-900 shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                      Back to playing
                    </button>
                  }
                />
              </div>
            </div>
          )}
          {/* Mood mirror for small screens where the character hides */}
          <div className="mt-4 sm:hidden">
            <HostCharacter characterId={step.hostCharacter} mood={mood} size={84} />
          </div>
        </div>
      )}
      {phase === 'complete' && (
        <Complete
          child={child}
          stars={Math.min(3, Math.round((stars / Math.max(activeSteps.length, 1)) * 3))}
          points={points}
          newStickers={newStickers}
          questOutro={questOutro}
          onReplay={backToMap}
          onExit={() => setPhase('goodbye')}
        />
      )}
      {phase === 'complete' && newTrophies.length > 0 && (
        <TrophyCelebration trophies={newTrophies} onDone={() => setNewTrophies([])} />
      )}
      {phase === 'goodbye' && <Goodbye child={child} onDone={onExit} />}
      </PhaseTransition>
    </KidShell>
    {/* Game overlay rendered outside KidShell (and PhaseTransition) so position:fixed
        is viewport-relative, not broken by ancestor transforms. */}
    {(() => {
      const entry = getGame(openGame);
      return entry ? (
        <GameOverlay entry={entry} child={child} nickname={child.nickname} onClose={() => setOpenGame(null)} />
      ) : null;
    })()}
    </>
  );
}
