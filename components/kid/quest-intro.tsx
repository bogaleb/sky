'use client';

import { getCharacter, charLine } from '@/lib/kid/characters';
import { AVATARS } from '@/components/avatars';
import { getIsland } from '@/lib/kid/islands';
import type { TrailStop } from '@/lib/kid/trail';
import { questNumber } from '@/lib/kid/trail';
import { playSfx, speakAs } from '@/lib/kid/audio';
import { useEffect } from 'react';

/**
 * QuestIntro — cinematic story intro before a Trail quest begins.
 * The host character sets the scene, then the child taps to play.
 */
export default function QuestIntro({
  stop,
  nickname,
  onStart,
}: {
  stop: TrailStop;
  nickname: string;
  onStart: () => void;
}) {
  const island = getIsland(stop.subjectCode);
  const Host = (AVATARS[island.hostCharacter] ?? AVATARS.curio).Component;

  useEffect(() => {
    speakAs(island.hostCharacter, `Ahoy, ${nickname}! ${stop.intro} Are you ready?`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-6 py-10">
      <div
        className="animate-kid-rise w-full max-w-2xl rounded-kid-card bg-white/95 p-8 text-center shadow-2xl"
        style={{ borderTop: `8px solid ${island.color}` }}
      >
        <p className="text-sm font-black uppercase tracking-widest text-kid-ink-500">
          Quest {questNumber(stop.index)}
        </p>
        <div className="mx-auto my-4 h-44 w-44 animate-kid-bounce-soft">
          <Host className="h-full w-full drop-shadow-xl" />
        </div>
        <h2 className="mb-3 text-3xl font-black text-kid-ink-900">{stop.questTitle}</h2>
        <p className="mx-auto mb-2 max-w-lg text-lg font-bold leading-relaxed text-kid-ink-700">{stop.intro}</p>
        <p className="mx-auto mb-6 max-w-lg text-base font-bold text-kid-ink-500">
          Play 4 sky games to complete the quest!
        </p>
        <button
          type="button"
          onClick={() => {
            playSfx('fanfare');
            onStart();
          }}
          className="rounded-full bg-kid-coral-500 px-12 py-4 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          Let&apos;s go!
        </button>
        <p className="mt-4 text-sm font-bold text-kid-ink-400">{charLine(island.hostCharacter, 'encouragement')}</p>
      </div>
    </div>
  );
}
