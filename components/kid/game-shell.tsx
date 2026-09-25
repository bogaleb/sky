'use client';

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import type { TrophyEvent } from '@/lib/kid/trophies';
import { getSticker } from '@/lib/kid/stickers';
import { reportRewardError } from '@/lib/kid/reward-errors';
import { StarPopRow, ConfettiBurst } from './celebration';

// Re-exported so game components can report incidental (non-completion)
// reward failures through the same shared pipeline.
export { reportRewardError };

// ---------------------------------------------------------------------------
// Reward-error observability (Wave 10).
//
// Every reward step runs in its own try/catch so one failing service can
// never block the others — and failures are reported through Track 3's
// shared reporter (lib/kid/reward-errors), which buffers them client-side
// and flushes them to the `reward_error` learning-event kind. Nothing here
// invents new database tables.
// ---------------------------------------------------------------------------

export interface RewardStepError {
  step: 'awardStars' | 'bumpQuestProgress' | 'awardStickers' | 'checkTrophies' | 'logLearningEvent';
  message: string;
  at: number;
}

// ---------------------------------------------------------------------------
// useGameSession — the one shared reward sequence for every game.
// ---------------------------------------------------------------------------

export interface GameSessionConfig {
  childId: string;
  /** Daily-quest id, e.g. 'word_game'. Omit when the game has no quest. */
  gameKey?: string;
  /** Sticker id (or ids) to award on completion. Omit when none. */
  stickerId?: string | string[];
  /** Trophy event to check. Omit when none. */
  trophyEvent?: TrophyEvent;
  /** learning_events metadata kind, e.g. 'word_builder_win'. Optional — omit for flows with no milestone. */
  milestone?: string;
}

export interface CompleteArgs {
  stars: number;
  mistakes?: number;
  /** Extra metadata merged into the milestone event (kind/stars/mistakes are set automatically). */
  extraMetadata?: Record<string, unknown>;
  /** Overrides the configured stickerId for this call (e.g. conditional stickers). */
  stickerIds?: string[];
}

export interface GameSession {
  complete: (args: CompleteArgs) => Promise<CompleteResult>;
  reset: () => void;
  loading: boolean;
  completed: boolean;
  /** Latest star balance returned by awardStars (null until complete runs). */
  starBalance: number | null;
}

export interface CompleteResult {
  /** Star balance returned by awardStars (null when stars <= 0 or the step failed). */
  starBalance: number | null;
  /** Reward failures recorded during this run (also sent to reportRewardError). */
  errors: RewardStepError[];
}

/**
 * Runs the full win reward sequence with per-step isolation:
 * awardStars -> bumpQuestProgress -> awardStickers -> checkTrophies ->
 * logLearningEvent(milestone). A failing step is reported via
 * reportRewardError and never blocks the remaining steps.
 */
export function useGameSession(config: GameSessionConfig): GameSession {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [starBalance, setStarBalance] = useState<number | null>(null);
  const inFlight = useRef(false);
  const cfgRef = useRef(config);
  cfgRef.current = config;

  const complete = useCallback(async ({ stars, mistakes = 0, extraMetadata, stickerIds: stickerIdsOverride }: CompleteArgs): Promise<CompleteResult> => {
    if (inFlight.current) return { starBalance: null, errors: [] };
    inFlight.current = true;
    setLoading(true);
    const cfg = cfgRef.current;
    let balance: number | null = null;
    const runErrors: RewardStepError[] = [];
    const failed = (step: RewardStepError['step'], err: unknown) => {
      reportRewardError(cfg.childId, step, err);
      runErrors.push({ step, message: err instanceof Error ? err.message : String(err), at: Date.now() });
    };
    try {
      if (stars > 0) {
        try {
          balance = await awardStars(cfg.childId, stars);
          setStarBalance(balance);
        } catch (err) {
          failed('awardStars', err);
        }
      }
      if (cfg.gameKey) {
        try {
          await bumpQuestProgress(cfg.childId, cfg.gameKey, 1);
        } catch (err) {
          failed('bumpQuestProgress', err);
        }
      }
      const configured = cfg.stickerId ? (Array.isArray(cfg.stickerId) ? cfg.stickerId : [cfg.stickerId]) : [];
      const stickerIds = stickerIdsOverride ?? configured;
      if (stickerIds.length > 0) {
        try {
          await awardStickers(cfg.childId, stickerIds);
        } catch (err) {
          failed('awardStickers', err);
        }
      }
      if (cfg.trophyEvent) {
        try {
          await checkTrophies(cfg.childId, cfg.trophyEvent);
        } catch (err) {
          failed('checkTrophies', err);
        }
      }
      if (cfg.milestone) {
        try {
          await logLearningEvent(cfg.childId, 'milestone', {
            metadata: { kind: cfg.milestone, stars, mistakes, ...extraMetadata },
          });
        } catch (err) {
          failed('logLearningEvent', err);
        }
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
      setCompleted(true);
    }
    return { starBalance: balance, errors: runErrors };
  }, []);

  const reset = useCallback(() => {
    setCompleted(false);
    setLoading(false);
  }, []);

  // Stable identity across renders so callers can safely list `session` in
  // effect/callback dependency arrays.
  return useMemo(
    () => ({ complete, reset, loading, completed, starBalance }),
    [complete, reset, loading, completed, starBalance]
  );
}

// ---------------------------------------------------------------------------
// GameWinScreen — the one shared win screen, on the Wave 8 design contract.
// ---------------------------------------------------------------------------

export interface GameWinScreenProps {
  stars: number;
  nickname?: string;
  /** Big headline. Defaults to a nickname-aware celebration. */
  title?: string;
  /** Supporting line under the headline. */
  message?: string;
  /** Sticker id to reveal as an earned badge. */
  stickerId?: string;
  /** Host character avatar art shown above the headline. */
  hostAvatar?: ReactNode;
  onPlayAgain: () => void;
  onExit: () => void;
  playAgainLabel?: string;
  /** Optional third action rendered beside Play again (e.g. "Another deck"). */
  secondaryAction?: { label: string; onClick: () => void };
  /** 'calm' skips confetti for wind-down experiences (bedtime). */
  tone?: 'celebration' | 'calm';
}

export function GameWinScreen({
  stars,
  nickname,
  title,
  message,
  stickerId,
  hostAvatar,
  onPlayAgain,
  onExit,
  playAgainLabel = 'Play again',
  secondaryAction,
  tone = 'celebration',
}: GameWinScreenProps) {
  const sticker = stickerId ? getSticker(stickerId) : undefined;
  const headline = title ?? (nickname ? `You did it, ${nickname}!` : 'You did it!');
  return (
    <div className="animate-kid-pop-in mx-4 flex w-full max-w-md flex-col items-center px-4 text-center">
      {tone === 'celebration' && <ConfettiBurst />}
      <div className="glass-kid flex w-full flex-col items-center px-8 py-8">
        {hostAvatar && (
          <div className="animate-kid-bounce-soft -mt-20 mb-1 [&>svg]:h-24 [&>svg]:w-24 md:[&>svg]:h-28 md:[&>svg]:w-28">
            {hostAvatar}
          </div>
        )}
        <h2 className="font-display text-3xl font-black text-kid-ink-900 md:text-4xl">{headline}</h2>
        {message && (
          <p className="mt-2 text-lg font-bold text-kid-ink-700">{message}</p>
        )}
        <div className="mt-3" role="status" aria-label={`You earned ${stars} stars`}>
          <StarPopRow count={stars} />
        </div>
        <p className="flex items-center gap-2 text-2xl font-black text-kid-ink-900">
          <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
            <path
              d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
              fill="#FFC93C"
              stroke="#E09E00"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
          <span className="tabular-nums">{stars}</span>
          <span className="text-kid-ink-700">{stars === 1 ? 'star' : 'stars'}</span>
        </p>
        {sticker && (
          <div className="animate-kid-pop-in mt-4 flex flex-col items-center" style={{ animationDelay: '0.4s' }}>
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white shadow-[0_10px_24px_rgba(23,50,79,0.3)]"
              style={{ background: `linear-gradient(135deg, ${sticker.colors[0]}, ${sticker.colors[1]})` }}
              role="img"
              aria-label={`Sticker earned: ${sticker.name}`}
            >
              <svg width="40" height="40" viewBox="0 0 64 64" aria-hidden>
                <path
                  d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
                  fill="#fff"
                  stroke="rgba(23,50,79,0.25)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mt-2 text-base font-black text-kid-ink-900">{sticker.name}</p>
            <p className="text-sm font-bold text-kid-ink-700">added to your sticker book!</p>
          </div>
        )}
        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={onPlayAgain} className="btn-kid btn-kid-sky btn-kid-sm">
            {playAgainLabel}
          </button>
          {secondaryAction && (
            <button type="button" onClick={secondaryAction.onClick} className="btn-kid btn-kid-coral btn-kid-sm">
              {secondaryAction.label}
            </button>
          )}
          <button type="button" onClick={onExit} className="btn-kid btn-kid-mint btn-kid-sm" aria-label="Back to the map">
            Map
          </button>
        </div>
      </div>
    </div>
  );
}
