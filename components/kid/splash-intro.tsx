'use client';

import { useEffect, useState } from 'react';
import { AVATARS, AVATAR_IDS } from '@/components/avatars';
import { playSfx } from '@/lib/kid/audio';
import { shouldShowSplash, markSplashSeen } from '@/lib/kid/splash';

const LOGO_COLORS = ['#FF6B6B', '#FFD93C', '#4CC9F0'];

/** Twinkling star decoration. Pure SVG, no emoji. */
function Twinkle({
  left,
  top,
  size,
  delay,
  animated,
}: {
  left: string;
  top: string;
  size: number;
  delay: string;
  animated: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={`absolute ${animated ? 'animate-kid-twinkle' : ''}`}
      style={{ left, top, animationDelay: animated ? delay : undefined }}
    >
      <path
        d="M12 1l2.6 7.2 7.4.4-5.8 4.7 1.9 7.2-6.1-4.1-6.1 4.1 1.9-7.2L2 8.6l7.4-.4z"
        fill="#FFE66D"
        stroke="#F4A900"
        strokeWidth="1.2"
      />
    </svg>
  );
}

/**
 * Cinematic splash intro. Plays once per browser session (sessionStorage
 * guard); reduced-motion users get a calm static version with the same
 * "Tap to begin" button.
 */
export default function SplashIntro({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!shouldShowSplash(typeof sessionStorage === 'undefined' ? null : sessionStorage)) {
      onDone();
      return;
    }
    setVisible(true);
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true);
    }
  }, [onDone]);

  if (!visible) return null;

  const begin = () => {
    playSfx('fanfare');
    markSplashSeen(typeof sessionStorage === 'undefined' ? null : sessionStorage);
    onDone();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Sky"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-kid-sky-400 via-kid-sky-300 to-kid-cream px-6"
    >
      {/* twinkling stars */}
      <Twinkle left="8%" top="12%" size={34} delay="0s" animated={!reduced} />
      <Twinkle left="86%" top="18%" size={26} delay="0.7s" animated={!reduced} />
      <Twinkle left="14%" top="68%" size={24} delay="1.3s" animated={!reduced} />
      <Twinkle left="80%" top="64%" size={38} delay="0.4s" animated={!reduced} />
      <Twinkle left="68%" top="10%" size={22} delay="1.8s" animated={!reduced} />
      <Twinkle left="28%" top="24%" size={20} delay="2.2s" animated={!reduced} />

      {/* bouncing logo */}
      <h1 className="flex select-none text-8xl font-black tracking-tight md:text-9xl" aria-label="Sky">
        {'SKY'.split('').map((letter, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`inline-block ${reduced ? '' : 'animate-kid-bounce-in'}`}
            style={{
              color: LOGO_COLORS[i % LOGO_COLORS.length],
              textShadow: '0 6px 0 rgba(23,50,79,0.18), 0 14px 28px rgba(23,50,79,0.25)',
              animationDelay: reduced ? undefined : `${0.15 + i * 0.16}s`,
            }}
          >
            {letter}
          </span>
        ))}
      </h1>
      <p
        className={`mt-3 text-center text-xl font-black text-kid-ink-900 md:text-2xl ${reduced ? '' : 'animate-kid-rise'}`}
        style={{ animationDelay: reduced ? undefined : '0.75s' }}
      >
        Where learning takes flight!
      </p>

      {/* character parade */}
      <div className="mt-8 w-full overflow-hidden" aria-hidden="true">
        <div className={`flex w-max items-end gap-6 px-4 ${reduced ? 'mx-auto' : 'animate-kid-parade'}`}>
          {AVATAR_IDS.map((id, i) => {
            const Avatar = AVATARS[id].Component;
            return (
              <div
                key={id}
                className={reduced ? '' : 'animate-kid-bob'}
                style={{ animationDelay: reduced ? undefined : `${i * 0.22}s` }}
              >
                <Avatar className="h-16 w-16 drop-shadow-[0_10px_16px_rgba(23,50,79,0.35)] md:h-20 md:w-20" />
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={begin}
        className={`mt-10 rounded-full border-b-8 border-kid-sun-600 bg-kid-sun-400 px-12 py-5 text-2xl font-black text-kid-ink-900 transition-transform hover:scale-105 active:scale-95 md:text-3xl ${reduced ? '' : 'animate-kid-glow'}`}
        style={{ animationDelay: reduced ? undefined : '1.1s' }}
      >
        Tap to begin
      </button>
      <p className="mt-4 text-sm font-bold text-kid-ink-700">Your friends are waiting!</p>
    </div>
  );
}
