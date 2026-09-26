'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { playSfx, speakAs } from '@/lib/kid/audio';

/**
 * Voice-first primitives. Children who cannot read yet must be able to use
 * every control, so the kid UI follows one rule:
 *
 *   tap = do it        press and hold = hear what it is
 *
 * plus a visible speaker button wherever words matter. Everything here keeps
 * a full aria-label, so screen readers get the same information.
 */

const HOLD_MS = 450;

/**
 * Pointer handlers for "tap to act, hold to hear". Keyboard activation
 * (Enter/Space -> click) still acts, so this never removes accessibility.
 */
export function useHoldToHear({
  say,
  character = 'curio',
  onPress,
  disabled,
}: {
  say: string;
  character?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const timer = useRef<number | null>(null);
  const heard = useRef(false);
  const [holding, setHolding] = useState(false);

  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);

  useEffect(() => clear, [clear]);

  return {
    holding,
    handlers: {
      onPointerDown: () => {
        if (disabled) return;
        heard.current = false;
        setHolding(true);
        timer.current = window.setTimeout(() => {
          heard.current = true;
          setHolding(false);
          speakAs(character, say);
        }, HOLD_MS);
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      // iPad long-press would otherwise open the callout / text selection.
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      onClick: () => {
        if (disabled) return;
        if (heard.current) {
          heard.current = false; // this click ended a hold-to-hear
          return;
        }
        onPress();
      },
    },
  };
}

function SpeakerGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path d="M9 19h8l10-8v26l-10-8H9z" fill="currentColor" />
      <path d="M31 17q6 7 0 14M36 12q11 12 0 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/** A round "hear it" button. Size follows the child's minimum touch target. */
export function ListenButton({
  say,
  character = 'curio',
  label,
  size = 56,
  tone = 'sky',
}: {
  say: string;
  character?: string;
  label?: string;
  size?: number;
  tone?: 'sky' | 'sun' | 'white';
}) {
  const tones = {
    sky: 'bg-kid-sky-500 text-white',
    sun: 'bg-kid-sun-400 text-kid-ink-900',
    white: 'bg-white text-kid-sky-700',
  } as const;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        playSfx('click');
        speakAs(character, say);
      }}
      aria-label={label ?? `Hear: ${say}`}
      className={`kid-press flex shrink-0 items-center justify-center rounded-full shadow-lg ring-4 ring-white/80 ${tones[tone]}`}
      style={{ width: size, height: size }}
    >
      <SpeakerGlyph className="h-[55%] w-[55%]" />
    </button>
  );
}

export type TileTone = 'coral' | 'sky' | 'mint' | 'grape' | 'sun';

const TILE_TONES: Record<TileTone, string> = {
  coral: 'bg-kid-coral-400 border-kid-coral-600',
  sky: 'bg-kid-sky-400 border-kid-sky-700',
  mint: 'bg-kid-mint-400 border-kid-mint-700',
  grape: 'bg-kid-grape-400 border-kid-grape-700',
  sun: 'bg-kid-sun-400 border-kid-sun-700',
};

/**
 * A big picture tile. Tap to open, hold (or tap the speaker) to hear what it
 * is. How much text shows depends on the child's age profile; the spoken
 * description and aria-label are always complete.
 */
export function TalkTile({
  art,
  title,
  sub,
  say,
  tone,
  textMode,
  onPress,
  character,
  badge,
  minHeight,
  className = '',
}: {
  art: ReactNode;
  title: string;
  sub?: string;
  say: string;
  tone: TileTone;
  textMode: 'none' | 'title' | 'full';
  onPress: () => void;
  character?: string;
  badge?: ReactNode;
  minHeight?: number;
  className?: string;
}) {
  const { holding, handlers } = useHoldToHear({
    say,
    character,
    onPress: () => {
      playSfx('pop');
      onPress();
    },
  });
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        {...handlers}
        aria-label={`${title}. ${say}`}
        className={`kid-no-callout kid-press relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-kid-card border-b-[10px] px-3 pb-4 pt-5 text-white shadow-[0_14px_30px_rgba(23,50,79,0.22)] transition-transform ${TILE_TONES[tone]} ${
          holding ? 'scale-[0.97]' : ''
        }`}
        style={{ minHeight }}
      >
        <span className="flex w-full flex-1 items-center justify-center [&>svg]:h-full [&>svg]:max-h-32 [&>svg]:w-auto">
          {art}
        </span>
        {textMode !== 'none' && (
          <span className="font-display text-xl leading-tight font-black drop-shadow-sm md:text-2xl">{title}</span>
        )}
        {textMode === 'full' && sub && <span className="text-base font-bold opacity-95">{sub}</span>}
        {badge}
      </button>
      <div className="absolute -right-2 -top-2">
        <ListenButton say={say} character={character} label={`Hear what ${title} is`} size={48} tone="white" />
      </div>
    </div>
  );
}

/** Speak a line once when a screen appears (only for profiles that auto-narrate). */
export function useNarrateOnce(enabled: boolean, character: string, line: string, delayMs = 500) {
  const said = useRef(false);
  useEffect(() => {
    if (!enabled || said.current || !line) return;
    const id = window.setTimeout(() => {
      said.current = true;
      speakAs(character, line);
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [enabled, character, line, delayMs]);
}
