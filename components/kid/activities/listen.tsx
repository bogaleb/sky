'use client';

import { useEffect, useState } from 'react';
import { speak, playSfx } from '@/lib/kid/audio';

export interface ListenRendererProps {
  script: string;
  narration: string;
  onCommit: (answer: { said_it: boolean }) => void;
  locked: boolean;
}

/**
 * Listen & repeat: the host says the script aloud (auto-played once),
 * the child echoes it, then taps the big "I said it!" star button.
 */
export default function ListenRenderer({ script, narration, onCommit, locked }: ListenRendererProps) {
  const [heard, setHeard] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      speak(narration || script);
      setHeard(true);
    }, 700);
    return () => clearTimeout(t);
  }, [narration, script]);

  const replay = () => {
    playSfx('click');
    speak(script);
    setHeard(true);
  };

  const saidIt = () => {
    playSfx('star');
    onCommit({ said_it: true });
  };

  return (
    <div className="flex w-full max-w-2xl flex-col items-center">
      {/* Script card */}
      <div className="animate-kid-rise w-full rounded-kid-card border-4 border-white/70 bg-white/90 px-8 py-8 text-center shadow-[0_18px_40px_rgba(23,50,79,0.18)]">
        <p className="text-sm font-extrabold uppercase tracking-widest text-kid-ink-700/60">Say it with me</p>
        <p className="mt-2 text-4xl font-black leading-tight text-kid-ink-900 md:text-5xl">{script}</p>
        <button
          type="button"
          onClick={replay}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-kid-sky-400 px-6 py-3 text-lg font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
          Hear it again
        </button>
      </div>

      {/* Pulsing mic */}
      <div className="relative mt-8" aria-hidden>
        <span className="absolute inset-0 animate-kid-pulse-ring rounded-full bg-kid-berry-500/60" />
        <span className="absolute inset-0 animate-kid-pulse-ring rounded-full bg-kid-berry-500/40" style={{ animationDelay: '0.5s' }} />
        <div className="relative flex h-32 w-32 animate-kid-bob items-center justify-center rounded-full border-4 border-white/70 bg-kid-berry-500 shadow-[0_16px_36px_rgba(241,91,181,0.5)]">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff" stroke="none" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </div>
      </div>
      <p className="mt-3 text-xl font-extrabold text-kid-ink-700">
        {heard ? 'Now you say it out loud!' : 'Listen…'}
      </p>

      <button
        type="button"
        disabled={locked || !heard}
        onClick={saidIt}
        className="mt-6 flex items-center gap-3 rounded-kid-card border-b-8 border-kid-sun-500 bg-kid-sun-400 px-12 py-5 text-2xl font-black text-kid-ink-900 shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:saturate-50"
      >
        <svg width="30" height="30" viewBox="0 0 64 64">
          <path d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z" fill="#fff" stroke="#E09E00" strokeWidth="3" strokeLinejoin="round" />
        </svg>
        I said it!
      </button>
    </div>
  );
}
