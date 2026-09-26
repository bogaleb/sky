'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AttemptResult, PlannedStep, SessionChild } from '@/lib/kid/types';
import { getSessionPlan, submitActivityAttempt, logLearningEvent } from '@/app/actions/learning';
import { awardStickers, getChildStickers, getStarBalance, awardStars } from '@/app/actions/rewards';
import { checkTrophies } from '@/app/actions/trophies';
import type { Trophy } from '@/lib/kid/trophies';
import { getIslandProgress } from '@/app/actions/progress';
import { getTrailState, getTrailPlan, completeTrailQuest, recordDailyActivity, bumpQuestProgress, type TrailState } from '@/app/actions/trail';
import { getTimeLimitStatus } from '@/app/actions/time-limits';
import { loadPlacement } from '@/lib/kid/placement';
import type { TrailStop } from '@/lib/kid/trail';
import { toPlannedStep, type ServerPlanItem } from '@/lib/kid/types';
import { playSfx, speak, speakAs } from '@/lib/kid/audio';
import { charLine } from '@/lib/kid/characters';
import type { Island } from '@/lib/kid/islands';
import { stickersForIslandVisit, getSticker } from '@/lib/kid/stickers';
import type { Song } from '@/lib/kid/songs';
import type { Story } from '@/lib/kid/stories';
import type { CharacterMood } from '../host-character';
import type { GameGroupId } from '../game-registry';

export type SessionPhase = 'intro' | 'map' | 'islandIntro' | 'trailIntro' | 'playing' | 'complete' | 'goodbye' | 'winddown';

export interface UseSessionMachineInput {
  child: SessionChild;
  steps: PlannedStep[];
  sessionId: string | null;
  onExit: () => void;
}

/**
 * useSessionMachine — the session state machine, extracted from the old
 * session-player god component with zero behavior change:
 * intro -> map -> islandIntro -> playing -> complete -> goodbye.
 * Owns points, star progress, character mood, and server submission.
 * Pure state + transitions; rendering lives in phase-router.tsx.
 */
export function useSessionMachine({ child, steps, sessionId, onExit }: UseSessionMachineInput) {
  const [phase, setPhase] = useState<SessionPhase>('intro');
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

  // Daily time limit — enforced server-side (app/actions/time-limits.ts).
  // Checked on session start, before every new game/session start, and once
  // a minute while the map is showing. When the day's minutes are used up we
  // route to the wind-down phase and block new game starts. A failed check
  // fails OPEN: a network blip must never lock a child out of learning.
  const refreshTimeLimit = useCallback(async (): Promise<boolean> => {
    try {
      const status = await getTimeLimitStatus(child.id, {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (status.exhausted) {
        setOpenGame(null);
        setPhase('winddown');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [child.id]);

  useEffect(() => {
    void refreshTimeLimit();
  }, [refreshTimeLimit]);

  useEffect(() => {
    if (phase !== 'map') return;
    const timer = window.setInterval(() => {
      void refreshTimeLimit();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [phase, refreshTimeLimit]);

  /** Open a Sky Park game (or the pet widget): re-check the limit first. */
  const requestOpenGame = useCallback(
    async (id: string) => {
      // Bedtime is itself a wind-down, so it stays reachable past the limit.
      if (id !== 'bedtime' && (await refreshTimeLimit())) return;
      setOpenGame(id);
    },
    [refreshTimeLimit]
  );

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
        // listen_repeat ("I said it") is self-reported practice: the server
        // awards it zero points, so it earns praise but no wallet/quest star.
        if (result.pointsEarned > 0) setStars((s) => s + 1);
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
        const earnedCount = resultsRef.current.filter(
          (r) => r.correct && r.pointsEarned > 0
        ).length;
        // Perfect session counts correctness, not stars: a correctly completed
        // listen_repeat must not invalidate a perfect flight.
        const allCorrect =
          resultsRef.current.length > 0 &&
          resultsRef.current.every((r) => r.correct);
        const totalPoints = resultsRef.current.reduce((s, r) => s + r.pointsEarned, 0);
        speak(`Amazing flying, ${child.nickname}! You earned ${earnedCount} stars!`);
        // Award stickers for the island visit + special achievements.
        const visitSubject = island?.subjectCode ?? trailStop?.subjectCode ?? null;
        const stickerEarn: string[] = stickersForIslandVisit(visitSubject);
        if (allCorrect && activeSteps.length > 0) stickerEarn.push('perfect-flight');
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
            const perfect = allCorrect && activeSteps.length > 0;
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

  const beginPlaying = async () => {
    if (await refreshTimeLimit()) return;
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

  return {
    child,
    sessionId,
    onExit,
    phase,
    setPhase,
    index,
    points,
    stars,
    walletBalance,
    mood,
    setMood,
    island,
    islandSteps,
    loadingIsland,
    novaComfort,
    showTryAgain,
    setShowTryAgain,
    islandProgress,
    stickerIds,
    setStickerIds,
    showStickers,
    setShowStickers,
    newStickers,
    newTrophies,
    setNewTrophies,
    activeSong,
    setActiveSong,
    activeStory,
    setActiveStory,
    pickingLibrary,
    setPickingLibrary,
    trailState,
    trailStop,
    questMode,
    startingQuest,
    questOutro,
    showWelcome,
    setShowWelcome,
    talkWith,
    setTalkWith,
    openGame,
    setOpenGame,
    requestOpenGame,
    refreshTimeLimit,
    parkTab,
    setParkTab,
    activeSteps,
    step,
    handleSubmit,
    handleComplete,
    startIslandSession,
    startTrailQuest,
    beginPlaying,
    backToMap,
  };
}

/** The machine object handed to the phase router and the views. */
export type SessionMachine = ReturnType<typeof useSessionMachine>;
