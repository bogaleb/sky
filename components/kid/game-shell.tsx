'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { bumpQuestProgress } from '@/app/actions/trail';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent, recordGameAttempts } from '@/app/actions/learning';
import { recordResult } from '@/lib/kid/adapt';
import { createAttemptBuffer, type AttemptBuffer } from '@/lib/kid/attempt-buffer';
import type { GameSkillCode } from '@/lib/kid/game-skills';
import type { TrophyEvent } from '@/lib/kid/trophies';
import { getSticker } from '@/lib/kid/stickers';
import { reportRewardError } from '@/lib/kid/reward-errors';

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
// Win layer (unified).
//
// celebration.tsx's contents now live here: one win layer instead of two.
// celebration.tsx remains as a thin re-export so existing imports
// (activity-stage, trophy-shelf, welcome-quest, session-player, tests) keep
// working. Behavior is identical from the kid's perspective.
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = ['#FF6B6B', '#FFC93C', '#4CC9F0', '#9B5DE5', '#2EC4B6', '#F15BB5', '#FFE66D'];

type ConfettiShape = 'circle' | 'square' | 'ribbon' | 'triangle';

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  shape: ConfettiShape;
  sway: number;
  flip: boolean;
}

const SHAPES: ConfettiShape[] = ['circle', 'square', 'ribbon', 'triangle'];

/**
 * A burst of falling confetti. Pure CSS, no canvas needed. Deterministic
 * (no Math.random) so server and client renders agree; varied shapes,
 * sizes, sway, and flip keep it lively.
 */
export function ConfettiBurst({ count = 90 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        left: (i * 97.3) % 100,
        delay: ((i * 37) % 700) / 1000,
        duration: 2.4 + ((i * 53) % 1600) / 1000,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 8 + ((i * 29) % 12),
        shape: SHAPES[i % SHAPES.length],
        sway: (i * 61) % 70 - 35,
        flip: i % 2 === 0,
      })),
    [count]
  );

  return (
    <div className="kid-confetti pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => {
        const style: CSSProperties = {
          left: `${p.left}%`,
          width: p.size,
          height: p.shape === 'ribbon' ? p.size * 0.45 : p.size,
          background: p.color,
          animation: `kid-confetti-fall${p.flip ? '-flip' : ''} ${p.duration}s cubic-bezier(0.2, 0.6, 0.6, 1) ${p.delay}s both`,
          ['--sway' as string]: `${p.sway}px`,
        };
        if (p.shape === 'circle') style.borderRadius = '50%';
        else if (p.shape === 'square') style.borderRadius = '2px';
        else if (p.shape === 'ribbon') style.borderRadius = '3px';
        else style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        return <span key={i} className="absolute top-[-4%]" style={style} />;
      })}
      <style>{`
        @keyframes kid-confetti-fall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(112vh) translateX(var(--sway)) rotate(720deg); opacity: 0.85; }
        }
        @keyframes kid-confetti-fall-flip {
          0% { transform: translateY(0) translateX(0) rotate(0deg) rotateY(0deg); opacity: 1; }
          100% { transform: translateY(112vh) translateX(var(--sway)) rotate(540deg) rotateY(720deg); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

const PRAISE = [
  'Amazing!',
  'You did it!',
  'Brilliant!',
  'Super star!',
  'Wow, yes!',
  'Fantastic!',
];

const ENCOURAGE = [
  'Good try!',
  'Almost!',
  'Keep going!',
  'Nice effort!',
];

export function praiseFor(streak: number): string {
  if (streak >= 5) return 'On fire!';
  if (streak >= 3) return 'Streak power!';
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

export function encourage(): string {
  return ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
}

export interface FeedbackOverlayProps {
  correct: boolean;
  streak: number;
  pointsEarned: number;
  leveledUp: boolean;
  onDone: () => void;
}

/** Stars that pop in one after another. Fixed height so nothing shifts. */
export function StarPopRow({ count = 3 }: { count?: number }) {
  return (
    <div className="flex h-14 items-center justify-center gap-2" aria-hidden>
      {Array.from({ length: Math.max(0, Math.min(5, count)) }).map((_, i) => (
        <span key={i} className="animate-kid-pop-in" style={{ animationDelay: `${i * 0.14}s` }}>
          <svg width="44" height="44" viewBox="0 0 64 64">
            <path
              d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
              fill="#FFC93C"
              stroke="#E09E00"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}

/**
 * Full-screen feedback after an attempt: celebration for correct answers,
 * gentle encouragement for misses. Auto-dismisses; tap to skip ahead.
 */
export function FeedbackOverlay({ correct, streak, pointsEarned, leveledUp, onDone }: FeedbackOverlayProps) {
  const title = correct ? praiseFor(streak) : encourage();

  return (
    <button
      type="button"
      onClick={onDone}
      className="fixed inset-0 z-40 flex cursor-pointer items-center justify-center bg-kid-ink-900/25"
      aria-label={correct ? 'Correct! Continue' : 'Try the next one'}
    >
      {correct && <ConfettiBurst />}
      <div
        className="card-kid animate-kid-pop-in mx-4 flex flex-col items-center px-10 py-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={correct ? 'animate-kid-bounce-soft' : 'animate-kid-wiggle'}>
          {correct ? (
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="42" fill="#2EC4B6" />
              <circle cx="48" cy="48" r="42" fill="none" stroke="#1DA192" strokeWidth="5" />
              <path d="M30 49 L43 62 L67 36" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="42" fill="#FFD968" />
              <circle cx="48" cy="48" r="42" fill="none" stroke="#E09E00" strokeWidth="5" />
              <circle cx="36" cy="40" r="5" fill="#17324F" />
              <circle cx="60" cy="40" r="5" fill="#17324F" />
              <path d="M34 60 Q48 70 62 60" fill="none" stroke="#17324F" strokeWidth="5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <p className="font-display mt-4 text-4xl font-bold text-kid-ink-900">{title}</p>
        {correct && <StarPopRow count={streak >= 5 ? 3 : streak >= 2 ? 2 : 1} />}
        {correct && pointsEarned > 0 && (
          <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-kid-sun-500">
            <svg width="28" height="28" viewBox="0 0 64 64">
              <path d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z" fill="#FFC93C" stroke="#E09E00" strokeWidth="3" strokeLinejoin="round" />
            </svg>
            +{pointsEarned}
          </p>
        )}
        {leveledUp && (
          <p className="animate-kid-wiggle mt-3 rounded-full border-b-4 border-kid-grape-600 bg-kid-grape-500 px-5 py-2 text-lg font-black text-white shadow-lg">
            Level up!
          </p>
        )}
        <span className="mt-5 text-sm font-bold text-kid-ink-700/60">Tap to keep flying</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Staged teaching feedback.
//
// A wrong answer opens a teaching moment instead of a bare "shake + Try
// again", staged so the child is never flooded — one stage at a time:
//
//   1. hint-offer — "Want a hint?" (the child chooses to see help)
//   2. hint       — the hint itself, then "Show me how"
//   3. example    — a worked example, then "Let me try" (retry)
//
// The game may pass `hint` / `workedExample` on recordAnswer(); when it
// passes none, warm generic defaults keep the moment teaching-flavored
// (never lorem). Viewing a hint or example is logged as a `hint_used` /
// `show_me` learning event — best-effort, never blocks play.
//
// Games render <AnswerFeedbackPanel feedback={session.feedback} /> once and
// get the whole staged flow; the hook owns the state, so every instrumented
// game shares the pipeline. The existing per-item "first judgment counts"
// (tries) semantics are unchanged: only the first judgment per itemKey
// opens feedback.
// ---------------------------------------------------------------------------

/** A worked example: a single step, or an ordered list of steps. */
export type WorkedExampleInput = { steps: string[] } | string;

export type TeachingFeedbackStage = 'hint-offer' | 'hint' | 'example';

export type TeachingFeedbackAction = 'show-hint' | 'show-example' | 'dismiss';

export interface TeachingFeedback {
  stage: TeachingFeedbackStage;
  hint: string;
  /** Worked-example steps, shown on the final stage. */
  steps: string[];
  showHint: () => void;
  showExample: () => void;
  dismiss: () => void;
}

/** Warm generic hint when the game passes none — teaching-flavored, never lorem. */
export const DEFAULT_TEACHING_HINT = 'Slow down and look closely. What do you notice first?';

/** Warm generic worked example when the game passes none. */
export const DEFAULT_WORKED_EXAMPLE_STEPS: readonly string[] = [
  'Look at the question one more time.',
  'Say what you see out loud.',
  'Pick the answer that fits what you said.',
];

/** Normalize a worked-example input to a non-empty step list. Pure for tests. */
export function normalizeWorkedExample(input?: WorkedExampleInput): string[] {
  if (typeof input === 'string') {
    const single = input.trim();
    return single ? [single] : [...DEFAULT_WORKED_EXAMPLE_STEPS];
  }
  const steps = (input?.steps ?? []).map((s) => s.trim()).filter(Boolean);
  return steps.length > 0 ? steps : [...DEFAULT_WORKED_EXAMPLE_STEPS];
}

/**
 * Pure stage machine for the teaching feedback. Returns the next
 * TeachingFeedback (same object when the action is a no-op for the stage)
 * or null on dismiss. The hook applies it via a functional setState so
 * panel callbacks never go stale.
 */
export function applyTeachingAction(
  feedback: TeachingFeedback | null,
  action: TeachingFeedbackAction
): TeachingFeedback | null {
  if (!feedback || action === 'dismiss') return null;
  const next: TeachingFeedbackStage =
    action === 'show-hint'
      ? feedback.stage === 'hint-offer'
        ? 'hint'
        : feedback.stage
      : feedback.stage === 'hint'
        ? 'example'
        : feedback.stage;
  return next === feedback.stage ? feedback : { ...feedback, stage: next };
}

/**
 * The staged teaching panel. Render it once per game with
 * `feedback={session.feedback}` — the hook drives everything else.
 * All kid-facing text is >= 18px, no emoji, on the Wave 8 design contract.
 */
export function AnswerFeedbackPanel({ feedback }: { feedback: TeachingFeedback | null }) {
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const stage = feedback?.stage;
  // Move focus to the primary action as stages advance (keyboard users).
  useEffect(() => {
    primaryRef.current?.focus();
  }, [stage]);
  if (!feedback) return null;

  const isOffer = stage === 'hint-offer';
  const isHint = stage === 'hint';
  const eyebrow = isOffer ? 'Good thinking' : isHint ? "Here's a hint" : "Let's work it out together";
  const primaryLabel = isOffer ? 'Show hint' : isHint ? 'Show me how' : 'Let me try';
  const onPrimary = isOffer ? feedback.showHint : isHint ? feedback.showExample : feedback.dismiss;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-kid-ink-900/25 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Learning help"
    >
      <div className="card-kid animate-kid-pop-in flex w-full max-w-md flex-col px-8 py-8 text-center">
        <p className="text-lg font-black uppercase tracking-wide text-kid-sky-600">{eyebrow}</p>
        {isOffer && (
          <>
            <p className="font-display mt-2 text-3xl font-black text-kid-ink-900">Want a hint?</p>
            <p className="mt-2 text-lg font-bold text-kid-ink-700">
              Getting it wrong is how we learn.
            </p>
          </>
        )}
        {isHint && <p className="mt-2 text-xl font-bold text-kid-ink-900">{feedback.hint}</p>}
        {stage === 'example' && (
          <ol className="mt-3 space-y-2 text-left">
            {feedback.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kid-sky-400 text-lg font-black text-white"
                >
                  {i + 1}
                </span>
                <span className="text-xl font-bold text-kid-ink-900">{step}</span>
              </li>
            ))}
          </ol>
        )}
        <button ref={primaryRef} type="button" onClick={onPrimary} className="btn-kid btn-kid-sky mt-6 w-full">
          {primaryLabel}
        </button>
        {stage !== 'example' && (
          <button type="button" onClick={feedback.dismiss} className="btn-kid mt-3 w-full">
            Let me try
          </button>
        )}
      </div>
    </div>
  );
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
  /**
   * Per-answer learning evidence. Set for every game that asks the child
   * questions with right/wrong answers, then call session.recordAnswer() at
   * each judgment. Omit for open-ended play (dress-up, studio, bedtime).
   */
  learning?: {
    /** Stable id for learning_events.metadata.game_id and the adaptive engine. */
    gameId: string;
    /** Default skill for this game's answers; recordAnswer can override per item. */
    skill: GameSkillCode;
  };
}

export interface RecordAnswerOptions {
  /** Overrides the configured skill (games that mix skills, e.g. count vs add). */
  skill?: GameSkillCode;
  /** Item difficulty on the skill's 1–5 scale. Omit when unknown. */
  level?: number;
  /**
   * Identifies the question being answered (e.g. the round index). Only the
   * FIRST judgment per item is recorded, so retries after a wrong tap do not
   * count as extra correct answers. Omit when every call is a new item.
   */
  itemKey?: string | number;
  /**
   * Teaching hint shown when this answer is wrong (feedback stage 2).
   * Falls back to a warm generic hint when omitted.
   */
  hint?: string;
  /**
   * Worked example shown after the hint (feedback stage 3): a single step
   * or { steps }. Falls back to a warm generic example when omitted.
   */
  workedExample?: WorkedExampleInput;
}

export interface CompleteArgs {
  stars: number;
  mistakes?: number;
  /** Extra metadata merged into the milestone event (kind/stars/mistakes are set automatically). */
  extraMetadata?: Record<string, unknown>;
  /** Overrides the configured stickerId for this call (e.g. conditional stickers). */
  stickerIds?: string[];
  /**
   * Stars paid per skill that leveled up during this session. Completion
   * itself is only ever the small `stars` acknowledgment; the meaningful
   * payout is mastery-tied. Defaults to LEVEL_UP_STAR_BONUS.
   */
  levelUpStars?: number;
}

/** Default mastery payout: 10 stars per skill that leveled up this session. */
export const LEVEL_UP_STAR_BONUS = 10;

export interface GameSession {
  complete: (args: CompleteArgs) => Promise<CompleteResult>;
  /**
   * Record one judged answer: feeds skill mastery (batched to the server) and
   * this child's adaptive difficulty. A wrong answer opens staged teaching
   * feedback (see session.feedback). No-op when `learning` is not configured.
   */
  recordAnswer: (correct: boolean, opts?: RecordAnswerOptions) => void;
  reset: () => void;
  loading: boolean;
  completed: boolean;
  /** Latest star balance returned by awardStars (null until complete runs). */
  starBalance: number | null;
  /**
   * Staged teaching feedback for the last wrong answer; null when there is
   * none. Render <AnswerFeedbackPanel feedback={session.feedback} /> once per
   * game to show it.
   */
  feedback: TeachingFeedback | null;
  /** Dismiss the teaching feedback (the child is retrying). */
  clearFeedback: () => void;
}

export interface CompleteResult {
  /** Star balance returned by awardStars (null when stars <= 0 or the step failed). */
  starBalance: number | null;
  /** Reward failures recorded during this run (also sent to reportRewardError). */
  errors: RewardStepError[];
  /** Skill codes whose mastery leveled up during this session. */
  levelUps: string[];
  /** Extra stars paid for those level-ups (0 when none). */
  levelUpBonus: number;
}

/**
 * Runs the full win reward sequence with per-step isolation:
 * awardStars -> bumpQuestProgress -> awardStickers -> checkTrophies ->
 * logLearningEvent(milestone). A failing step is reported via
 * reportRewardError and never blocks the remaining steps.
 *
 * Payouts are mastery-tied: `stars` is only a small completion
 * acknowledgment; the meaningful payout (LEVEL_UP_STAR_BONUS per skill, via
 * the same atomic awardStars wallet RPC) goes to skills whose mastery
 * leveled up during this session, detected from the per-flush results of
 * record_game_attempts (the RPC surfaces leveled_up per skill — no schema
 * change needed).
 */
export function useGameSession(config: GameSessionConfig): GameSession {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [starBalance, setStarBalance] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<TeachingFeedback | null>(null);
  const inFlight = useRef(false);
  const cfgRef = useRef(config);
  // Keep the latest config for the stable callbacks below (read only in
  // event handlers, after commit — never during render).
  useEffect(() => {
    cfgRef.current = config;
  });

  // One buffer per mounted game. Created lazily so games without `learning`
  // never allocate one; flushed on completion, when the page is hidden, and
  // on unmount (the child tapping back to the map mid-round).
  const bufferRef = useRef<AttemptBuffer | null>(null);
  const lastItemKey = useRef<string | number | null>(null);
  // Skill codes whose mastery leveled up during this session (accumulated
  // from every buffer flush, including the final one in complete()).
  const leveledSkillsRef = useRef<Set<string>>(new Set());
  const getBuffer = useCallback((): AttemptBuffer | null => {
    const cfg = cfgRef.current;
    if (!cfg.learning) return null;
    if (!bufferRef.current) {
      const { childId } = cfg;
      const { gameId } = cfg.learning;
      bufferRef.current = createAttemptBuffer({
        send: async (attempts) => {
          const res = await recordGameAttempts(childId, gameId, attempts);
          for (const code of res.leveledSkills) leveledSkillsRef.current.add(code);
          return res.recorded;
        },
        onError: (err) => reportRewardError(childId, 'recordGameAttempts', err),
      });
    }
    return bufferRef.current;
  }, []);

  useEffect(() => {
    const flush = () => void bufferRef.current?.flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const recordAnswer = useCallback(
    (correct: boolean, opts: RecordAnswerOptions = {}) => {
      const cfg = cfgRef.current;
      const buffer = getBuffer();
      if (!cfg.learning || !buffer) return;
      if (opts.itemKey !== undefined) {
        if (opts.itemKey === lastItemKey.current) return;
        lastItemKey.current = opts.itemKey;
      }
      recordResult(cfg.childId, cfg.learning.gameId, correct);
      const skill = opts.skill ?? cfg.learning.skill;
      buffer.add({
        skill,
        correct,
        ...(opts.level !== undefined ? { level: opts.level } : {}),
      });
      if (!correct) {
        const hint = opts.hint?.trim() || DEFAULT_TEACHING_HINT;
        const steps = normalizeWorkedExample(opts.workedExample);
        const gameId = cfg.learning.gameId;
        const childId = cfg.childId;
        const logTeaching = (eventType: 'hint_used' | 'show_me') => {
          // Best-effort: a failed log must never interrupt the teaching flow.
          void logLearningEvent(childId, eventType, {
            metadata: { game_id: gameId, skill },
          }).catch(() => {});
        };
        setFeedback({
          stage: 'hint-offer',
          hint,
          steps,
          showHint: () => {
            logTeaching('hint_used');
            setFeedback((prev) => applyTeachingAction(prev, 'show-hint'));
          },
          showExample: () => {
            logTeaching('show_me');
            setFeedback((prev) => applyTeachingAction(prev, 'show-example'));
          },
          dismiss: () => {
            setFeedback((prev) => applyTeachingAction(prev, 'dismiss'));
          },
        });
      }
    },
    [getBuffer]
  );

  const complete = useCallback(
    async ({
      stars,
      mistakes = 0,
      extraMetadata,
      stickerIds: stickerIdsOverride,
      levelUpStars = LEVEL_UP_STAR_BONUS,
    }: CompleteArgs): Promise<CompleteResult> => {
      if (inFlight.current) return { starBalance: null, errors: [], levelUps: [], levelUpBonus: 0 };
      inFlight.current = true;
      setLoading(true);
      const cfg = cfgRef.current;
      // Flush buffered per-answer evidence first so any mastery level-up
      // earned during this session is known before payouts are decided.
      // The buffer reports send failures itself; this never throws.
      try {
        await bufferRef.current?.flush();
      } catch {
        /* reported via onError -> reportRewardError */
      }
      lastItemKey.current = null;
      const levelUps = [...leveledSkillsRef.current];
      const levelUpBonus = levelUps.length * levelUpStars;
      let balance: number | null = null;
      const runErrors: RewardStepError[] = [];
      const failed = (step: RewardStepError['step'], err: unknown) => {
        reportRewardError(cfg.childId, step, err);
        runErrors.push({ step, message: err instanceof Error ? err.message : String(err), at: Date.now() });
      };
      try {
        // Small acknowledgment for finishing the game.
        if (stars > 0) {
          try {
            balance = await awardStars(cfg.childId, stars);
            setStarBalance(balance);
          } catch (err) {
            failed('awardStars', err);
          }
        }
        // Meaningful payout for mastery actually earned this session.
        if (levelUpBonus > 0) {
          try {
            balance = await awardStars(cfg.childId, levelUpBonus);
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
            const metadata: Record<string, unknown> = {
              kind: cfg.milestone,
              stars,
              mistakes,
              ...extraMetadata,
            };
            if (levelUps.length > 0) {
              metadata.levelUps = levelUps;
              metadata.levelUpBonus = levelUpBonus;
            }
            await logLearningEvent(cfg.childId, 'milestone', { metadata });
          } catch (err) {
            failed('logLearningEvent', err);
          }
        }
      } finally {
        inFlight.current = false;
        setLoading(false);
        setCompleted(true);
      }
      return { starBalance: balance, errors: runErrors, levelUps, levelUpBonus };
    },
    []
  );

  const reset = useCallback(() => {
    lastItemKey.current = null;
    leveledSkillsRef.current.clear();
    setFeedback(null);
    setCompleted(false);
    setLoading(false);
  }, []);

  // Stable identity across renders so callers can safely list `session` in
  // effect/callback dependency arrays.
  return useMemo(
    () => ({ complete, recordAnswer, reset, loading, completed, starBalance, feedback, clearFeedback }),
    [complete, recordAnswer, reset, loading, completed, starBalance, feedback, clearFeedback]
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
