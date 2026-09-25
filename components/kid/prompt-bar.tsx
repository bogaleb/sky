'use client';

import { speak, playSfx } from '@/lib/kid/audio';
import HostCharacter, { type CharacterMood } from './host-character';

/**
 * The activity prompt: host character + big friendly question text +
 * a speaker button that replays narration (for non-readers).
 */
export default function PromptBar({
  prompt,
  narration,
  characterId,
  mood = 'idle',
  islandName,
  skillName,
}: {
  prompt: string;
  narration: string;
  characterId: string;
  mood?: CharacterMood;
  islandName: string;
  skillName: string;
}) {
  const replay = () => {
    playSfx('click');
    speak(narration || prompt);
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 px-2">
        <span className="card-kid px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-kid-ink-700 md:px-4 md:text-sm">
          {islandName}
        </span>
        <span className="rounded-full bg-kid-grape-500/90 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white shadow-[0_6px_16px_rgba(23,50,79,0.25)] md:px-4 md:text-sm">
          {skillName}
        </span>
      </div>
      <div className="flex items-end justify-center gap-4 md:gap-6">
        <div className="hidden shrink-0 sm:block">
          <HostCharacter characterId={characterId} mood={mood} size={128} />
        </div>
        <div className="glass-kid animate-kid-rise relative max-w-2xl flex-1 px-6 py-5">
          <p className="font-display text-center text-2xl font-bold leading-snug text-kid-ink-900 md:text-3xl">
            {prompt}
          </p>
          <button
            type="button"
            onClick={replay}
            aria-label="Hear the question again"
            className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-full border-b-4 border-kid-sun-600 bg-kid-sun-400 shadow-[0_8px_20px_rgba(255,174,0,0.5)] transition-transform hover:scale-110 active:translate-y-0.5 active:scale-95"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#17324F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H2v6h4l5 4V5z" fill="#17324F" stroke="none" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          </button>
          {/* speech tail */}
          <div className="absolute -left-3 bottom-8 hidden h-6 w-6 rotate-45 border-b border-l border-white/60 bg-white/45 backdrop-blur-xl sm:block" aria-hidden />
        </div>
      </div>
    </div>
  );
}
