'use client';

import { useState } from 'react';
import { AVATARS } from '@/components/avatars';
import { getCharacter, charLine } from '@/lib/kid/characters';
import { playSfx, speakAs } from '@/lib/kid/audio';

export type CharacterMood = 'idle' | 'happy' | 'thinking' | 'cheer' | 'oops';

/**
 * The subject host character, floating beside the prompt. Bobs idly and
 * blinks; bursts with joy on correct answers and wiggles encouragement
 * on misses. Tapping the character makes them talk — every cast member
 * has their own voice and playful tap reactions.
 */
export default function HostCharacter({
  characterId,
  mood = 'idle',
  size = 120,
  interactive = true,
}: {
  characterId: string;
  mood?: CharacterMood;
  size?: number;
  interactive?: boolean;
}) {
  const entry = AVATARS[characterId] ?? AVATARS.curio;
  const C = entry.Component;
  const character = getCharacter(characterId);
  const [tapped, setTapped] = useState(false);

  const anim =
    mood === 'happy' || mood === 'cheer'
      ? 'animate-kid-bounce-soft'
      : mood === 'oops'
        ? 'animate-kid-wiggle'
        : mood === 'thinking'
          ? 'animate-kid-sway'
          : 'animate-kid-bob';

  const handleTap = () => {
    if (!interactive) return;
    playSfx('pop');
    setTapped(true);
    speakAs(characterId, charLine(characterId, 'tapReaction'));
    setTimeout(() => setTapped(false), 900);
  };

  return (
    <div
      className={`relative ${interactive ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      role={interactive ? 'button' : 'img'}
      aria-label={interactive ? `Say hi to ${character.name}` : character.name}
      tabIndex={interactive ? 0 : undefined}
      onClick={handleTap}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleTap();
        }
      }}
    >
      {/* soft glow pedestal */}
      <div
        className="absolute -bottom-2 left-1/2 h-6 w-4/5 -translate-x-1/2 rounded-full bg-kid-ink-900/10 blur-md"
        aria-hidden
      />
      <div
        key={mood}
        className={`${anim} h-full w-full drop-shadow-[0_12px_18px_rgba(23,50,79,0.25)] transition-transform ${tapped ? 'scale-110' : ''} ${interactive ? 'hover:scale-105 active:scale-95' : ''}`}
      >
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
