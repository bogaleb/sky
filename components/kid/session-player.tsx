'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AttemptResult, PlannedStep, SessionChild } from '@/lib/kid/types';
import { getSessionPlan, submitActivityAttempt, logLearningEvent } from '@/app/actions/learning';
import { awardStickers, getChildStickers, awardStars, getStarBalance } from '@/app/actions/rewards';
import { checkTrophies } from '@/app/actions/trophies';
import type { Trophy } from '@/lib/kid/trophies';
import { getIslandProgress } from '@/app/actions/progress';
import { getTrailState, getTrailPlan, completeTrailQuest, recordDailyActivity, bumpQuestProgress, type TrailState } from '@/app/actions/trail';
import TrailBanner from './trail-banner';
import QuestIntro from './quest-intro';
import MemoryCove from './memory-cove';
import PatternParade from './pattern-parade';
import PuzzleReef from './puzzle-reef';
import WordBuilder from './word-builder';
import NumberRun from './number-run';
import StoryCinema from './story-cinema';
import CreativeStudio from './studio';
import Bedtime from './bedtime';
import LetterLab from './letter-lab';
import WorldTour from './world-tour';
import RhythmStudio from './rhythm-studio';
import ScienceLab from './science-lab';
import CodingCove from './coding-cove';
import ClockTower from './clock-tower';
import CoinCove from './coin-cove';
import MovieStudio from './movie-studio';
import CharacterHomes from './character-homes';
import ShowdownCard from './showdown-card';
import FeelingsTheater from './feelings-theater';
import ColorMixLab from './color-mix-lab';
import RhymeTime from './rhyme-time';
import PetPlayground from './pet-playground';
import FractionFair from './fraction-fair';
import AvatarStudio from './avatar-studio';
import SplashIntro from './splash-intro';
import StreakCalendar from './streak-calendar';
// Wave 8 design fallback styles — dormant while Track A's design core is present.
import { DesignFallbackStyles } from './design-fallback';
import PhonicsFun from './phonics-fun';
import Encyclopedia from './encyclopedia';
import WelcomeQuest from './welcome-quest';
import GoalMeter from './goal-meter';
import SeasonalDecor from './seasonal-decor';
import DailyGift from './daily-gift';
import OfflineBanner from './offline-banner';
import { loadPlacement } from '@/lib/kid/placement';
import UpNext from './up-next';
import TrophyShelf from './trophy-shelf';
import CharacterTalk from './character-talk';
import DressUp from './dress-up';
import PetCompanion from './pet-companion';
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

type Phase = 'intro' | 'map' | 'islandIntro' | 'trailIntro' | 'playing' | 'complete' | 'goodbye';

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
  const [showMemory, setShowMemory] = useState(false);
  const [showDressUp, setShowDressUp] = useState(false);
  const [showPet, setShowPet] = useState(false);
  const [showPattern, setShowPattern] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showWords, setShowWords] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [showCinema, setShowCinema] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [showBedtime, setShowBedtime] = useState(false);
  const [showWriting, setShowWriting] = useState(false);
  const [showGeography, setShowGeography] = useState(false);
  const [showRhythm, setShowRhythm] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [showCoding, setShowCoding] = useState(false);
  const [showPhonics, setShowPhonics] = useState(false);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showMoney, setShowMoney] = useState(false);
  const [showMovies, setShowMovies] = useState(false);
  const [showHomes, setShowHomes] = useState(false);
  const [showFeelings, setShowFeelings] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showRhymes, setShowRhymes] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const [showFractions, setShowFractions] = useState(false);
  const [showAvatarStudio, setShowAvatarStudio] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTrophies, setShowTrophies] = useState(false);
  const [talkWith, setTalkWith] = useState<string | null>(null);
  const resultsRef = useRef<AttemptResult[]>([]);

  // Load island progress + sticker book + trail state whenever the map shows.
  useEffect(() => {
    if (phase !== 'map') return;
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
    [child.id, child.nickname, index, activeSteps.length, sessionId, step?.hostCharacter, questMode, trailStop]
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
    <KidShell
      doneCount={stars}
      totalSteps={activeSteps.length}
      points={points}
      onExit={phase === 'playing' || phase === 'map' || phase === 'trailIntro' ? onExit : undefined}
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
        <>
          <DesignFallbackStyles />
          <div className="relative z-10 flex w-full flex-col items-center gap-5">
          <SeasonalDecor />
          <OfflineBanner />
          <TrailBanner trail={trailState} onStartQuest={() => void startTrailQuest()} starting={startingQuest} />
          {/* Sky Park: games, pets, trophies, and dress-up between quests. */}
          <section aria-label="Sky Park" className="glass-kid relative w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
            <h2 className="font-display text-center text-2xl text-kid-ink-900 md:text-4xl">Sky Park</h2>
            <p className="mt-1 text-center text-sm font-bold text-kid-ink-700 md:text-base">
              Games, pets, trophies, and dress-up between quests
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
              <div className="col-span-2 sm:col-span-1">
                <PetWidget child={child} onOpen={() => setShowPet(true)} />
              </div>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowMemory(true);
              }}
              className="btn-kid btn-kid-grape group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <rect x="6" y="10" width="16" height="22" rx="4" fill="#fff" opacity="0.95" />
                <rect x="26" y="10" width="16" height="22" rx="4" fill="#fff" opacity="0.6" />
                <path d="M14 17l1.5 3.2 3.5.4-2.6 2.4.7 3.5-3.1-1.7-3.1 1.7.7-3.5-2.6-2.4 3.5-.4z" fill="#7C5CBF" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Memory Cove</span>
              <span className="text-xs font-bold opacity-90">a matching game</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowDressUp(true);
              }}
              className="btn-kid btn-kid-coral group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <path d="M24 6l4 8h-8z" fill="#FF6B6B" />
                <rect x="10" y="16" width="28" height="8" rx="4" fill="#FF6B6B" />
                <circle cx="17" cy="30" r="6" fill="none" stroke="#17324F" strokeWidth="3" />
                <circle cx="31" cy="30" r="6" fill="none" stroke="#17324F" strokeWidth="3" />
                <line x1="23" y1="30" x2="25" y2="30" stroke="#17324F" strokeWidth="3" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Dress Up</span>
              <span className="text-xs font-bold opacity-80">spend your stars</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowPattern(true);
              }}
              className="btn-kid btn-kid-mint group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <circle cx="10" cy="24" r="6" fill="#fff" opacity="0.95" />
                <path d="M22 18l6 12h-12z" fill="#fff" opacity="0.75" />
                <rect x="32" y="18" width="11" height="11" rx="2" fill="#fff" opacity="0.95" />
                <text x="30" y="44" fontSize="10" fontWeight="900" fill="#17324F">?</text>
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Pattern Parade</span>
              <span className="text-xs font-bold opacity-80">finish the pattern</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowPuzzle(true);
              }}
              className="btn-kid btn-kid-sky group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <path d="M18 8h6v4a3 3 0 1 0 6 0V8h6v10h-4a3 3 0 1 0 0 6h4v10H18V8z" fill="#fff" opacity="0.95" transform="translate(-4 4)" />
                <path d="M30 30h10v4h-4a3 3 0 1 0 0 6h4v2H30V30z" fill="#fff" opacity="0.6" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Puzzle Reef</span>
              <span className="text-xs font-bold opacity-90">build the picture</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('fanfare');
                setShowTrophies(true);
              }}
              className="btn-kid btn-kid-grape group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <path d="M16 8h16v12a8 8 0 0 1-16 0V8z" fill="#fff" opacity="0.95" />
                <path d="M16 12H9a7 7 0 0 0 9 9M32 12h7a7 7 0 0 1-9 9" fill="none" stroke="#fff" strokeWidth="3.5" opacity="0.9" />
                <rect x="22" y="28" width="4" height="7" fill="#fff" opacity="0.95" />
                <rect x="16" y="35" width="16" height="5" rx="2.5" fill="#fff" opacity="0.95" />
                <path d="M24 12l1.4 2.9 3.2.4-2.3 2.2.6 3.1-2.9-1.5-2.9 1.5.6-3.1-2.3-2.2 3.2-.4z" fill="#FFD93C" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Trophies</span>
              <span className="text-xs font-bold opacity-80">my trophy shelf</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowWords(true);
              }}
              className="btn-kid btn-kid-sky group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <rect x="6" y="26" width="10" height="10" rx="2.5" fill="#fff" opacity="0.95" />
                <rect x="19" y="26" width="10" height="10" rx="2.5" fill="#fff" opacity="0.75" />
                <rect x="32" y="26" width="10" height="10" rx="2.5" fill="#fff" opacity="0.95" />
                <text x="8.5" y="34.5" fontSize="9" fontWeight="900" fill="#7C5CBF">A</text>
                <text x="21.5" y="34.5" fontSize="9" fontWeight="900" fill="#17324F">B</text>
                <text x="34" y="34.5" fontSize="9" fontWeight="900" fill="#7C5CBF">C</text>
                <path d="M24 6l2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" fill="#FFD93C" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Word Builder</span>
              <span className="text-xs font-bold opacity-80">spell magic words</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowNumbers(true);
              }}
              className="btn-kid btn-kid-mint group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <rect x="4" y="34" width="40" height="5" rx="2.5" fill="#fff" opacity="0.6" />
                <text x="8" y="26" fontSize="12" fontWeight="900" fill="#fff">3</text>
                <text x="21" y="26" fontSize="12" fontWeight="900" fill="#fff">+</text>
                <text x="33" y="26" fontSize="12" fontWeight="900" fill="#fff">4</text>
                <path d="M24 2l3 6.5L34 9l-5 4.7 1.2 6.8L24 17.4l-6.2 3.1L19 13.7 14 9l7-.5z" fill="#FFD93C" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Number Run</span>
              <span className="text-xs font-bold opacity-80">race with math</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowCinema(true);
              }}
              className="btn-kid btn-kid-coral group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <rect x="6" y="10" width="36" height="24" rx="4" fill="#17324F" opacity="0.9" />
                <rect x="9" y="13" width="30" height="18" rx="2" fill="#FFD93C" opacity="0.95" />
                <path d="M21 17l8 4.5-8 4.5z" fill="#17324F" />
                <rect x="20" y="34" width="8" height="4" rx="2" fill="#fff" opacity="0.95" />
                <rect x="14" y="38" width="20" height="3" rx="1.5" fill="#fff" opacity="0.75" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Story Cinema</span>
              <span className="text-xs font-bold opacity-90">watch cartoons</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowStudio(true);
              }}
              className="btn-kid btn-kid-grape group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <path d="M10 38c8-1 24-9 28-26l-8-3c-9 12-16 20-24 22z" fill="#FF8C42" />
                <path d="M38 9l3-3 3 3-3 3z" fill="#17324F" />
                <path d="M8 40l4 2-2 4-4-2z" fill="#17324F" />
                <circle cx="16" cy="36" r="2.5" fill="#3B82F6" />
                <circle cx="22" cy="33" r="2.5" fill="#22C55E" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Creative Studio</span>
              <span className="text-xs font-bold opacity-80">draw and color</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('whoosh');
                setShowBedtime(true);
              }}
              className="btn-kid btn-kid-sky group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <path d="M32 6a16 16 0 1 0 10 28A18 18 0 0 1 32 6z" fill="#FFE66D" />
                <path d="M14 12l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#fff" opacity="0.95" />
                <path d="M40 30l.9 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="#fff" opacity="0.8" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Bedtime</span>
              <span className="text-xs font-bold opacity-90">wind down</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowWriting(true);
              }}
              className="btn-kid btn-kid-mint group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <path d="M10 36L34 12l4 4L14 40l-6 2z" fill="#17324F" />
                <path d="M34 12l2-2 4 4-2 2z" fill="#FF8C42" />
                <path d="M8 38l6-1-5-5z" fill="#17324F" />
                <text x="30" y="42" fontSize="10" fontWeight="900" fill="#17324F">Aa</text>
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Letter Lab</span>
              <span className="text-xs font-bold opacity-80">trace your ABCs</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowGeography(true);
              }}
              className="btn-kid btn-kid-coral group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <circle cx="24" cy="24" r="16" fill="#3B82F6" />
                <path d="M14 20c4-5 10-7 14-5s8 1 8 5-4 6-8 6-6 4-10 2-6-4-4-8z" fill="#22C55E" />
                <path d="M30 12l2 3-2 3-2-3z" fill="#FFE66D" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">World Tour</span>
              <span className="text-xs font-bold opacity-80">explore with Atlas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowRhythm(true);
              }}
              className="btn-kid btn-kid-grape group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <circle cx="16" cy="34" r="9" fill="#fff" opacity="0.95" />
                <circle cx="32" cy="30" r="9" fill="#fff" opacity="0.7" />
                <rect x="23" y="8" width="4" height="14" rx="2" fill="#fff" opacity="0.95" transform="rotate(15 25 15)" />
                <rect x="33" y="6" width="4" height="14" rx="2" fill="#fff" opacity="0.75" transform="rotate(-12 35 13)" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Rhythm Studio</span>
              <span className="text-xs font-bold opacity-90">tap the beat</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowScience(true);
              }}
              className="btn-kid btn-kid-sky group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <path d="M20 6h8v10l8 18a6 6 0 0 1-5.5 8h-13A6 6 0 0 1 12 34l8-18z" fill="#fff" opacity="0.95" />
                <path d="M17 32h14l2.5 4.5a3 3 0 0 1-2.7 4.5H17.2a3 3 0 0 1-2.7-4.5z" fill="#22C55E" />
                <circle cx="22" cy="28" r="2" fill="#fff" opacity="0.8" />
                <circle cx="27" cy="30" r="1.6" fill="#fff" opacity="0.8" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Science Lab</span>
              <span className="text-xs font-bold opacity-90">try experiments</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowCoding(true);
              }}
              className="btn-kid btn-kid-mint group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <rect x="8" y="10" width="32" height="28" rx="6" fill="#fff" opacity="0.95" />
                <path d="M17 20l-5 4 5 4" fill="none" stroke="#17324F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M31 20l5 4-5 4" fill="none" stroke="#17324F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="14" y="40" width="20" height="4" rx="2" fill="#fff" opacity="0.7" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Coding Cove</span>
              <span className="text-xs font-bold opacity-90">guide Milo home</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowPhonics(true);
              }}
              className="btn-kid btn-kid-coral group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <rect x="6" y="14" width="15" height="15" rx="3" fill="#fff" opacity="0.95" />
                <rect x="27" y="14" width="15" height="15" rx="3" fill="#fff" opacity="0.7" />
                <text x="9.5" y="26.5" fontSize="11" fontWeight="900" fill="#D64545">sh</text>
                <text x="31" y="26.5" fontSize="11" fontWeight="900" fill="#17324F">op</text>
                <path d="M14 34q4 4 8 0M26 34q4 4 8 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Phonics Fun</span>
              <span className="text-xs font-bold opacity-90">blend the sounds</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowEncyclopedia(true);
              }}
              className="btn-kid btn-kid-sky group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <path d="M8 12q8-3 16 0v24q-8-3-16 0z" fill="#fff" opacity="0.95" />
                <path d="M40 12q-8-3-16 0v24q8-3 16 0z" fill="#fff" opacity="0.7" />
                <circle cx="24" cy="22" r="6" fill="#22C55E" />
                <circle cx="22" cy="20" r="2" fill="#17324F" />
                <path d="M20 26q4 3 8 0" stroke="#17324F" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Animal Book</span>
              <span className="text-xs font-bold opacity-90">collect critters</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowTime(true);
              }}
              className="btn-kid btn-kid-grape group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <circle cx="24" cy="24" r="17" fill="#fff" opacity="0.95" />
                <circle cx="24" cy="24" r="17" fill="none" stroke="#0B5E8A" strokeWidth="4" />
                <path d="M24 24V13M24 24l7 5" stroke="#0B5E8A" strokeWidth="4" strokeLinecap="round" />
                <circle cx="24" cy="24" r="3" fill="#0B5E8A" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Clock Tower</span>
              <span className="text-xs font-bold opacity-90">tell the time</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowMoney(true);
              }}
              className="btn-kid btn-kid-mint group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <ellipse cx="24" cy="34" rx="13" ry="5" fill="#fff" opacity="0.7" />
                <ellipse cx="24" cy="27" rx="13" ry="5" fill="#fff" opacity="0.85" />
                <ellipse cx="24" cy="20" rx="13" ry="5" fill="#fff" opacity="0.95" />
                <ellipse cx="24" cy="20" rx="13" ry="5" fill="none" stroke="#B45309" strokeWidth="2.5" />
                <text x="24" y="25" fontSize="11" fontWeight="900" fill="#B45309" textAnchor="middle">25</text>
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Coin Cove</span>
              <span className="text-xs font-bold opacity-90">count coins</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowMovies(true);
              }}
              className="btn-kid btn-kid-coral group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <rect x="7" y="14" width="34" height="26" rx="5" fill="#fff" opacity="0.95" />
                <rect x="7" y="8" width="34" height="8" rx="3" fill="#fff" opacity="0.7" />
                <path d="M10 8l4 8M18 8l4 8M26 8l4 8M34 8l4 8" stroke="#6D28D9" strokeWidth="2.5" />
                <path d="M20 21l10 6-10 6z" fill="#6D28D9" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Movie Studio</span>
              <span className="text-xs font-bold opacity-90">direct cartoons</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowHomes(true);
              }}
              className="btn-kid btn-kid-sky group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <path d="M6 24L24 8l18 16" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="12" y="22" width="24" height="17" rx="3" fill="#fff" opacity="0.95" />
                <rect x="21" y="30" width="6" height="9" rx="2" fill="#C2410C" />
                <circle cx="24" cy="18" r="4" fill="#FDE68A" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Character Homes</span>
              <span className="text-xs font-bold opacity-90">visit friends</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowFeelings(true);
              }}
              className="btn-kid btn-kid-mint group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <circle cx="24" cy="24" r="16" fill="#fff" opacity="0.95" />
                <circle cx="18" cy="21" r="2.5" fill="#0D7C5F" />
                <circle cx="30" cy="21" r="2.5" fill="#0D7C5F" />
                <path d="M16 30q8 8 16 0" stroke="#0D7C5F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Feelings Theater</span>
              <span className="text-xs font-bold opacity-90">name big feelings</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowColors(true);
              }}
              className="btn-kid btn-kid-grape group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <circle cx="18" cy="20" r="9" fill="#EF4444" opacity="0.95" />
                <circle cx="30" cy="20" r="9" fill="#3B82F6" opacity="0.95" />
                <circle cx="24" cy="33" r="10" fill="#8B5CF6" opacity="0.95" />
                <path d="M18 29q6 4 12 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Color Mix Lab</span>
              <span className="text-xs font-bold opacity-90">mix magic colors</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowRhymes(true);
              }}
              className="btn-kid btn-kid-coral group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <rect x="8" y="12" width="32" height="10" rx="5" fill="#fff" opacity="0.95" />
                <rect x="8" y="26" width="32" height="10" rx="5" fill="#fff" opacity="0.7" />
                <text x="24" y="20.5" fontSize="9" fontWeight="900" fill="#C2410C" textAnchor="middle">cat</text>
                <text x="24" y="34.5" fontSize="9" fontWeight="900" fill="#7C2D12" textAnchor="middle">hat</text>
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Rhyme Time</span>
              <span className="text-xs font-bold opacity-90">words that chime</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowPlayground(true);
              }}
              className="btn-kid btn-kid-sky group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <rect x="6" y="28" width="36" height="6" rx="3" fill="#fff" opacity="0.9" />
                <circle cx="14" cy="20" r="8" fill="#fff" opacity="0.95" />
                <path d="M10 20a4 4 0 008 0 4 4 0 00-8 0" fill="#B45309" />
                <rect x="28" y="10" width="14" height="14" rx="4" fill="#fff" opacity="0.7" />
                <circle cx="35" cy="17" r="4" fill="#B45309" opacity="0.8" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Pet Playground</span>
              <span className="text-xs font-bold opacity-90">play with your pet</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowFractions(true);
              }}
              className="btn-kid btn-kid-coral group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <circle cx="24" cy="24" r="16" fill="#F5C66B" />
                <path d="M24 8a16 16 0 010 32z" fill="#E2574C" opacity="0.85" />
                <circle cx="24" cy="24" r="16" fill="none" stroke="#B45309" strokeWidth="2.5" />
                <line x1="24" y1="8" x2="24" y2="40" stroke="#B45309" strokeWidth="2.5" />
                <circle cx="15" cy="18" r="2.2" fill="#fff" opacity="0.9" />
                <circle cx="14" cy="30" r="2.2" fill="#fff" opacity="0.9" />
                <circle cx="32" cy="24" r="2.2" fill="#fff" opacity="0.9" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">Fraction Fair</span>
              <span className="text-xs font-bold opacity-90">halves, thirds, quarters</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setShowAvatarStudio(true);
              }}
              className="btn-kid btn-kid-grape group"
            >
              <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
                <circle cx="24" cy="25" r="14" fill="#FFE3B3" />
                <path d="M10 22a14 14 0 0128 0v-2a14 8 0 00-28 0z" fill="#7C5CBF" />
                <circle cx="18.5" cy="25" r="2.6" fill="#17324F" />
                <circle cx="29.5" cy="25" r="2.6" fill="#17324F" />
                <path d="M18 32a6 6 0 0012 0" fill="none" stroke="#17324F" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="13" cy="29" r="2.4" fill="#FF9AA2" opacity="0.8" />
                <circle cx="35" cy="29" r="2.4" fill="#FF9AA2" opacity="0.8" />
              </svg>
              <span className="font-display text-lg font-black leading-tight md:text-xl">My Look</span>
              <span className="text-xs font-bold opacity-90">design your avatar</span>
            </button>
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
      {showMemory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <MemoryCove child={child} onExit={() => setShowMemory(false)} />
        </div>
      )}
      {showPattern && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <PatternParade childId={child.id} nickname={child.nickname} onExit={() => setShowPattern(false)} />
        </div>
      )}
      {showPuzzle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <PuzzleReef childId={child.id} nickname={child.nickname} onExit={() => setShowPuzzle(false)} />
        </div>
      )}
      {showWords && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <WordBuilder childId={child.id} nickname={child.nickname} onExit={() => setShowWords(false)} />
        </div>
      )}
      {showNumbers && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <NumberRun childId={child.id} nickname={child.nickname} onExit={() => setShowNumbers(false)} />
        </div>
      )}
      {showCinema && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <StoryCinema childId={child.id} onExit={() => setShowCinema(false)} />
        </div>
      )}
      {showStudio && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <CreativeStudio childId={child.id} nickname={child.nickname} onExit={() => setShowStudio(false)} />
        </div>
      )}
      {showBedtime && <Bedtime childId={child.id} nickname={child.nickname} onExit={() => setShowBedtime(false)} />}
      {showWriting && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <LetterLab childId={child.id} nickname={child.nickname} onExit={() => setShowWriting(false)} />
        </div>
      )}
      {showGeography && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <WorldTour childId={child.id} nickname={child.nickname} onExit={() => setShowGeography(false)} />
        </div>
      )}
      {showRhythm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <RhythmStudio childId={child.id} nickname={child.nickname} onExit={() => setShowRhythm(false)} />
        </div>
      )}
      {showScience && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <ScienceLab childId={child.id} nickname={child.nickname} onExit={() => setShowScience(false)} />
        </div>
      )}
      {showCoding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <CodingCove childId={child.id} nickname={child.nickname} onExit={() => setShowCoding(false)} />
        </div>
      )}
      {showPhonics && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <PhonicsFun childId={child.id} nickname={child.nickname} onExit={() => setShowPhonics(false)} />
        </div>
      )}
      {showEncyclopedia && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <Encyclopedia childId={child.id} onExit={() => setShowEncyclopedia(false)} />
        </div>
      )}
      {showTime && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <ClockTower childId={child.id} nickname={child.nickname} onExit={() => setShowTime(false)} />
        </div>
      )}
      {showMoney && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <CoinCove childId={child.id} nickname={child.nickname} onExit={() => setShowMoney(false)} />
        </div>
      )}
      {showMovies && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <MovieStudio childId={child.id} nickname={child.nickname} onExit={() => setShowMovies(false)} />
        </div>
      )}
      {showHomes && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <CharacterHomes childId={child.id} nickname={child.nickname} onExit={() => setShowHomes(false)} />
        </div>
      )}
      {showFeelings && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <FeelingsTheater childId={child.id} nickname={child.nickname} onExit={() => setShowFeelings(false)} />
        </div>
      )}
      {showColors && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <ColorMixLab childId={child.id} nickname={child.nickname} onExit={() => setShowColors(false)} />
        </div>
      )}
      {showRhymes && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <RhymeTime childId={child.id} nickname={child.nickname} onExit={() => setShowRhymes(false)} />
        </div>
      )}
      {showPlayground && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <PetPlayground childId={child.id} onExit={() => setShowPlayground(false)} />
        </div>
      )}
      {showFractions && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <FractionFair childId={child.id} nickname={child.nickname} onExit={() => setShowFractions(false)} />
        </div>
      )}
      {showAvatarStudio && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <AvatarStudio childId={child.id} onExit={() => setShowAvatarStudio(false)} />
        </div>
      )}
      {showWelcome && (
        <WelcomeQuest childId={child.id} nickname={child.nickname} onDone={() => setShowWelcome(false)} />
      )}
      {showTrophies && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-kid-sky-300 to-kid-sky-500">
          <div className="flex justify-start p-4">
            <button
              type="button"
              onClick={() => {
                playSfx('whoosh');
                setShowTrophies(false);
              }}
              className="rounded-full border-b-4 border-kid-ink-700 bg-white px-6 py-3 text-lg font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Back to the map"
            >
              ← Back
            </button>
          </div>
          <TrophyShelf childId={child.id} />
        </div>
      )}
      {talkWith && <CharacterTalk characterId={talkWith} onClose={() => setTalkWith(null)} />}
      {showDressUp && <DressUp child={child} onExit={() => setShowDressUp(false)} />}
      {showPet && <PetCompanion child={child} onExit={() => setShowPet(false)} />}
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
          onDone={() => setActiveStory(null)}
          onFinish={() => {
            setActiveStory(null);
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
  );
}
