'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { AVATARS } from '@/components/avatars';
import { playSfx, speakAs } from '@/lib/kid/audio';
import type { AgeProfile } from '@/lib/kid/age-profile';
import { INITIAL_TEACH, supportReached, teachReducer, type TeachLines, type TeachState } from '@/lib/kid/teaching';
import SkyBackdrop from './sky-backdrop';
import { ListenButton, useNarrateOnce } from './ui/talk';

/**
 * GameFrame — the one layout every Sky Park game shares.
 *
 *   ┌ header: back · host · progress · listen again ┐
 *   │ prompt bubble (+ hint / worked-example feedback)│
 *   │ stage (the game's own visual)  │ answer tray    │  <- side by side on
 *   └────────────────────────────────┴────────────────┘     landscape iPad,
 *                                                           stacked on phones
 * The same controls live in the same places in every game, touch targets
 * follow the child's age profile, and wrong answers get teaching feedback
 * (hint -> worked example) instead of a bare shake.
 */

// ---------------------------------------------------------------------------
// Teaching feedback hook
// ---------------------------------------------------------------------------

export interface Teaching {
  state: TeachState;
  /**
   * Judge one answer. Speaks the hint / explanation / praise. Pass the number
   * of choices so the worked example always arrives while there is still a
   * real choice left to make (never after the last wrong option is gone).
   */
  judge: (correct: boolean, key: string, lines: TeachLines, choiceCount?: number) => void;
  /** Start a new item (clears tried choices and the bubble). */
  next: () => void;
}

/** The profile's show-me threshold, capped so it fires before only the answer is left. */
export function effectiveShowMeAfter(profile: Pick<AgeProfile, 'hintAfter' | 'showMeAfter'>, choiceCount?: number): number {
  if (!choiceCount || choiceCount < 2) return profile.showMeAfter;
  return Math.max(profile.hintAfter, Math.min(profile.showMeAfter, choiceCount - 1));
}

export function useTeaching({
  profile,
  host,
  onSupport,
}: {
  profile: AgeProfile;
  host: string;
  onSupport?: (kind: 'hint_used' | 'show_me') => void;
}): Teaching {
  const [state, dispatch] = useReducer(teachReducer, INITIAL_TEACH);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const judge = useCallback(
    (correct: boolean, key: string, lines: TeachLines, choiceCount?: number) => {
      const prev = stateRef.current;
      if (correct) {
        const next = teachReducer(prev, { type: 'correct', lines });
        stateRef.current = next; // fast double taps must see this answer
        dispatch({ type: 'correct', lines });
        playSfx('correct');
        speakAs(host, next.message);
        return;
      }
      const action = {
        type: 'wrong' as const,
        key,
        lines,
        hintAfter: profile.hintAfter,
        showMeAfter: effectiveShowMeAfter(profile, choiceCount),
      };
      const next = teachReducer(prev, action);
      stateRef.current = next;
      dispatch(action);
      playSfx('wrong');
      speakAs(host, next.message);
      const reached = supportReached(prev, next);
      if (reached) onSupport?.(reached);
    },
    [host, profile.hintAfter, profile.showMeAfter, onSupport]
  );

  const next = useCallback(() => {
    stateRef.current = INITIAL_TEACH;
    dispatch({ type: 'reset' });
  }, []);
  return useMemo(() => ({ state, judge, next }), [state, judge, next]);
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Progress({ current, total, numeric }: { current: number; total: number; numeric: boolean }) {
  if (numeric) {
    return (
      <span className="rounded-full bg-white px-4 py-2 text-lg font-black tabular-nums text-kid-ink-900 shadow">
        {current} / {total}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5" role="img" aria-label={`Question ${current} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm transition-colors md:h-4 md:w-4 ${
            i < current - 1 ? 'bg-kid-mint-500' : i === current - 1 ? 'bg-kid-sun-400' : 'bg-white/60'
          }`}
        />
      ))}
    </span>
  );
}

const FEEDBACK_STYLES: Record<Exclude<TeachState['mode'], 'idle'>, { label: string; cls: string }> = {
  hint: { label: 'Hint', cls: 'border-kid-sun-500 bg-kid-sun-200' },
  show: { label: 'Watch me', cls: 'border-kid-grape-500 bg-kid-grape-300/40' },
  correct: { label: 'Yes!', cls: 'border-kid-mint-600 bg-kid-mint-200' },
};

function FeedbackBubble({ state, host }: { state: TeachState; host: string }) {
  if (state.mode === 'idle' || !state.message) return null;
  const style = FEEDBACK_STYLES[state.mode];
  return (
    <div
      key={`${state.mode}-${state.wrong}`}
      className={`animate-kid-pop-in mt-3 flex w-full max-w-2xl items-center gap-3 rounded-kid-card border-4 px-4 py-3 shadow-lg ${style.cls}`}
    >
      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-black uppercase tracking-wide text-kid-ink-900">
        {style.label}
      </span>
      <p className="flex-1 text-lg font-extrabold leading-snug text-kid-ink-900 md:text-xl">{state.message}</p>
      <ListenButton say={state.message} character={host} size={48} tone="white" label="Hear that again" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// GameFrame
// ---------------------------------------------------------------------------

export interface GameFrameProps {
  title: string;
  host: string;
  profile: AgeProfile;
  onExit: () => void;
  progress?: { current: number; total: number };
  /** The instruction. `say` is the spoken form (can be richer than `text`). */
  prompt?: { text: string; say: string };
  teaching?: TeachState;
  /** Answer controls. Rendered in the thumb-reachable tray. */
  tray?: ReactNode;
  /** The game's visual (clock, word, picture...). */
  children?: ReactNode;
}

export function GameFrame({ title, host, profile, onExit, progress, prompt, teaching, tray, children }: GameFrameProps) {
  const Host = AVATARS[host]?.Component;
  const showText = profile.tileText !== 'none';
  return (
    <div className="relative flex min-h-dvh flex-col" data-game-frame>
      <SkyBackdrop />
      <header className="sticky top-0 z-20 px-3 pt-3 md:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 rounded-full bg-white/90 p-1.5 pr-2 shadow-md">
          <button
            type="button"
            onClick={() => {
              playSfx('whoosh');
              onExit();
            }}
            aria-label="Back to the map"
            className="kid-press flex items-center gap-1 rounded-full bg-kid-sky-100 px-3 font-black text-kid-ink-900"
            style={{ minHeight: Math.min(profile.minTarget, 64), minWidth: Math.min(profile.minTarget, 64) }}
          >
            <BackArrow />
            {showText && <span className="pr-1 text-lg">Map</span>}
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            {Host && <Host className="h-10 w-10 shrink-0" />}
            <span className="font-display truncate text-lg font-black text-kid-ink-900 md:text-xl">{title}</span>
          </div>
          {progress && <Progress current={progress.current} total={progress.total} numeric={profile.tileText === 'full'} />}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-3 pb-6 md:px-6">
        {prompt && (
          <div className="mt-4 flex flex-col items-center">
            <div className="flex w-full max-w-2xl items-center gap-3 rounded-kid-card bg-white px-4 py-3 shadow-lg md:px-6">
              {showText ? (
                <p className="flex-1 text-center text-2xl font-black leading-snug text-kid-ink-900 md:text-3xl">{prompt.text}</p>
              ) : (
                <p className="sr-only">{prompt.text}</p>
              )}
              <div className={showText ? '' : 'mx-auto'}>
                <ListenButton
                  say={prompt.say}
                  character={host}
                  size={showText ? 56 : profile.minTarget}
                  tone="sun"
                  label="Hear the question again"
                />
              </div>
            </div>
            {teaching && <FeedbackBubble state={teaching} host={host} />}
          </div>
        )}
        <div className="sr-only" aria-live="polite">
          {teaching?.mode !== 'idle' ? teaching?.message : ''}
        </div>

        <div className="mt-5 flex flex-1 flex-col items-center gap-5 md:landscape:flex-row md:landscape:items-center md:landscape:justify-center md:landscape:gap-10">
          {children && (
            // Beside a tray the stage sizes to its content; alone it takes the full width.
            <div className={`flex w-full flex-col items-center justify-center ${tray ? 'md:landscape:w-auto' : 'max-w-3xl'}`}>
              {children}
            </div>
          )}
          {tray && <div className="w-full max-w-xl md:landscape:max-w-md">{tray}</div>}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intro screen (voice-led for pre-readers)
// ---------------------------------------------------------------------------

export function GameIntro({
  title,
  say,
  host,
  profile,
  onStart,
  onExit,
  startLabel = "Let's play!",
}: {
  title: string;
  say: string;
  host: string;
  profile: AgeProfile;
  onStart: () => void;
  onExit: () => void;
  startLabel?: string;
}) {
  const Host = AVATARS[host]?.Component;
  useNarrateOnce(profile.autoNarrate, host, say);
  return (
    <GameFrame title={title} host={host} profile={profile} onExit={onExit}>
      <div className="flex max-w-xl flex-col items-center text-center">
        {Host && <Host className="h-36 w-36 drop-shadow-[0_12px_20px_rgba(23,50,79,0.3)] md:h-44 md:w-44" />}
        {profile.tileText !== 'none' && (
          <p className="mt-4 text-xl font-bold leading-snug text-kid-ink-800 md:text-2xl">{say}</p>
        )}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              playSfx('pop');
              onStart();
            }}
            aria-label={`${startLabel} Start ${title}`}
            className="kid-press flex items-center gap-3 rounded-full border-b-8 border-kid-mint-700 bg-kid-mint-500 px-10 text-2xl font-black text-white shadow-xl md:text-3xl"
            style={{ minHeight: profile.minTarget }}
          >
            <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden>
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
            {profile.tileText !== 'none' && startLabel}
          </button>
          <ListenButton say={say} character={host} size={64} tone="sun" label={`Hear how to play ${title}`} />
        </div>
      </div>
    </GameFrame>
  );
}

// ---------------------------------------------------------------------------
// Answer tray + choice cards
// ---------------------------------------------------------------------------

export type ChoiceState = 'idle' | 'tried' | 'reveal' | 'correct' | 'locked';

/** Card state for a choice, from the teaching state and the right answer. */
export function choiceStateFor(teaching: TeachState, key: string, answerKey: string): ChoiceState {
  if (teaching.mode === 'correct') return key === answerKey ? 'correct' : 'locked';
  if (teaching.tried.includes(key)) return 'tried';
  if (teaching.mode === 'show' && key === answerKey) return 'reveal';
  return 'idle';
}

const CHOICE_STYLES: Record<ChoiceState, string> = {
  idle: 'border-kid-sky-300 bg-white',
  tried: 'border-kid-coral-300 bg-white/70 opacity-60',
  // Steady glow (an opacity pulse would make the answer look disabled mid-fade).
  reveal: 'border-kid-sun-500 bg-kid-sun-200 ring-8 ring-kid-sun-300/80 shadow-[0_0_28px_rgba(255,201,60,0.8)]',
  correct: 'border-kid-mint-600 bg-kid-mint-200',
  locked: 'border-kid-sky-200 bg-white/60 opacity-60',
};

function Mark({ state }: { state: ChoiceState }) {
  if (state === 'correct')
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0 text-kid-mint-700" aria-hidden>
        <path d="M5 12.5 10 17l9-10" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (state === 'reveal')
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0 text-kid-grape-600 motion-safe:animate-kid-bounce-soft" aria-hidden>
        <path d="M4 12h11M11 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return null;
}

export function AnswerTray({ children, columns = 1, label }: { children: ReactNode; columns?: 1 | 2 | 3; label: string }) {
  const cols = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3' }[columns];
  return (
    <div role="group" aria-label={label} className={`grid w-full gap-3 ${cols}`}>
      {children}
    </div>
  );
}

export function ChoiceCard({
  children,
  say,
  state,
  onPick,
  minHeight,
  host,
  listen = false,
}: {
  children: ReactNode;
  say: string;
  state: ChoiceState;
  onPick: () => void;
  minHeight: number;
  host: string;
  /** Show a speaker to hear the choice (words; not needed for numbers/times). */
  listen?: boolean;
}) {
  const disabled = state === 'correct' || state === 'locked';
  return (
    <div className={`flex items-center gap-2 rounded-kid-card border-4 px-3 shadow-lg transition-all ${CHOICE_STYLES[state]}`}>
      <button
        type="button"
        onClick={onPick}
        disabled={disabled}
        aria-label={`Choose ${say}`}
        className="kid-press kid-no-callout flex flex-1 items-center justify-center gap-3 py-2 text-3xl font-black text-kid-ink-900 disabled:cursor-default md:text-4xl"
        style={{ minHeight }}
      >
        <Mark state={state} />
        {children}
      </button>
      {listen && <ListenButton say={say} character={host} size={52} tone="sky" label={`Hear ${say}`} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag-to-slot manipulative
// ---------------------------------------------------------------------------

export interface DragItem {
  key: string;
  say: string;
  content: ReactNode;
}

/**
 * Drag an answer card into the slot. Children who cannot drag yet (or use a
 * switch / keyboard) can simply tap a card, which counts as dropping it.
 */
export function DragToSlot({
  items,
  slot,
  onDrop,
  stateFor,
  minHeight,
  host,
  slotLabel,
}: {
  items: DragItem[];
  slot: ReactNode;
  onDrop: (key: string) => void;
  stateFor: (key: string) => ChoiceState;
  minHeight: number;
  host: string;
  slotLabel: string;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  // Set when a real drag ended over the slot, so the click that follows the
  // pointerup does not drop the card a second time.
  const droppedByDrag = useRef(false);
  const [drag, setDrag] = useState<{ key: string; x0: number; y0: number; dx: number; dy: number } | null>(null);
  const [over, setOver] = useState(false);

  const inSlot = (x: number, y: number) => {
    const r = slotRef.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div
        ref={slotRef}
        aria-label={slotLabel}
        className={`flex min-h-[120px] w-full max-w-2xl flex-wrap items-center justify-center rounded-kid-card border-4 border-dashed px-4 transition-colors ${
          over ? 'border-kid-mint-600 bg-kid-mint-200/80' : 'border-kid-sky-400 bg-white/80'
        }`}
      >
        {slot}
      </div>
      <div role="group" aria-label="Answer cards" className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const state = stateFor(item.key);
          const disabled = state === 'correct' || state === 'locked';
          const dragging = drag?.key === item.key;
          return (
            <div
              key={item.key}
              className={`flex items-center gap-2 rounded-kid-card border-4 px-3 shadow-lg ${CHOICE_STYLES[state]} ${
                dragging ? 'relative z-30 scale-105 shadow-2xl' : 'motion-safe:transition-transform'
              }`}
              style={dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
            >
              <button
                type="button"
                disabled={disabled}
                aria-label={`Choose ${item.say}`}
                className="flex flex-1 cursor-grab items-center justify-center gap-3 py-2 text-3xl font-black text-kid-ink-900 select-none active:cursor-grabbing disabled:cursor-default md:text-4xl"
                // touch-action: none so a drag moves the card instead of scrolling the page.
                style={{ minHeight, touchAction: 'none', WebkitTouchCallout: 'none' }}
                onPointerDown={(e) => {
                  if (disabled) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDrag({ key: item.key, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 });
                }}
                onPointerMove={(e) => {
                  if (!drag || drag.key !== item.key) return;
                  setDrag({ ...drag, dx: e.clientX - drag.x0, dy: e.clientY - drag.y0 });
                  setOver(inSlot(e.clientX, e.clientY));
                }}
                onPointerUp={(e) => {
                  if (!drag || drag.key !== item.key) return;
                  const dragged = Math.hypot(drag.dx, drag.dy) >= 10;
                  setDrag(null);
                  setOver(false);
                  // A tap (no real movement) is handled by onClick below.
                  if (dragged && inSlot(e.clientX, e.clientY)) {
                    droppedByDrag.current = true;
                    onDrop(item.key);
                  }
                }}
                onPointerCancel={() => {
                  setDrag(null);
                  setOver(false);
                }}
                onClick={() => {
                  // Taps, keyboard (Enter/Space) and assistive tech all arrive here.
                  if (droppedByDrag.current) {
                    droppedByDrag.current = false;
                    return;
                  }
                  onDrop(item.key);
                }}
              >
                <Mark state={state} />
                {item.content}
              </button>
              <ListenButton say={item.say} character={host} size={52} tone="sky" label={`Hear ${item.say}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
