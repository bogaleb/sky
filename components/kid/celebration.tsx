'use client';

import { useMemo, type CSSProperties } from 'react';

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
      className="fixed inset-0 z-40 flex cursor-pointer items-center justify-center bg-kid-ink-900/25 backdrop-blur-[2px]"
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
