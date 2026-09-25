'use client';

import { AVATARS } from '@/components/avatars';

export type CharacterMood = 'idle' | 'happy' | 'thinking' | 'cheer' | 'oops';

/**
 * The subject host character, floating beside the prompt. Bobs idly;
 * bursts with joy on correct answers and wiggles encouragement on misses.
 */
export default function HostCharacter({
  characterId,
  mood = 'idle',
  size = 120,
}: {
  characterId: string;
  mood?: CharacterMood;
  size?: number;
}) {
  const entry = AVATARS[characterId] ?? AVATARS.curio;
  const C = entry.Component;

  const anim =
    mood === 'happy' || mood === 'cheer'
      ? 'animate-kid-bounce-soft'
      : mood === 'oops'
        ? 'animate-kid-wiggle'
        : mood === 'thinking'
          ? 'animate-kid-sway'
          : 'animate-kid-bob';

  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={entry.name}>
      {/* soft glow pedestal */}
      <div
        className="absolute -bottom-2 left-1/2 h-6 w-4/5 -translate-x-1/2 rounded-full bg-kid-ink-900/10 blur-md"
        aria-hidden
      />
      <div key={mood} className={`${anim} h-full w-full drop-shadow-[0_12px_18px_rgba(23,50,79,0.25)]`}>
        <C className="h-full w-full" />
      </div>
      {mood === 'cheer' && (
        <>
          <span className="absolute -left-3 top-2 animate-kid-sparkle" aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFE66D">
              <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
            </svg>
          </span>
          <span className="absolute -right-3 top-8 animate-kid-sparkle" style={{ animationDelay: '0.5s' }} aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFE66D">
              <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
            </svg>
          </span>
        </>
      )}
    </div>
  );
}
