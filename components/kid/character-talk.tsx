'use client';

import { useEffect, useState } from 'react';
import { AVATARS } from '@/components/avatars';
import { getCharacter } from '@/lib/kid/characters';
import { CHATTER, CHATTER_TABS, type ChatterCategory } from '@/lib/kid/char-chatter';
import { playSfx, speakAs, stopSpeaking, unlockAudio } from '@/lib/kid/audio';

/**
 * Talk to a Sky character: a speech-bubble popup with the character's art.
 * Kids pick a tab (say hi, joke, fun fact, cheer me up) and tap the bubble
 * to hear the character say the next line in their own voice.
 */
export default function CharacterTalk({
  characterId,
  onClose,
}: {
  characterId: string;
  onClose: () => void;
}) {
  const character = getCharacter(characterId);
  const Avatar = (AVATARS[characterId] ?? AVATARS.curio).Component;
  const pack = CHATTER[characterId] ?? CHATTER.curio;

  const [tab, setTab] = useState<ChatterCategory>('greeting');
  const [index, setIndex] = useState(0);
  const lines = pack[tab];
  const line = lines[index % lines.length];

  // Greet out loud on open (the tap that opened this counts as the gesture).
  useEffect(() => {
    unlockAudio();
    const t = setTimeout(() => speakAs(characterId, pack.greeting[0]), 350);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const sayLine = (text: string) => {
    playSfx('pop');
    speakAs(characterId, text);
  };

  const nextLine = () => {
    const next = (index + 1) % lines.length;
    setIndex(next);
    sayLine(lines[next]);
  };

  const switchTab = (next: ChatterCategory) => {
    playSfx('click');
    setTab(next);
    setIndex(0);
    sayLine(pack[next][0]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/70 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Talk with ${character.name}`}
      onClick={onClose}
    >
      <div
        className="animate-kid-pop-in w-full max-w-lg rounded-kid-card border-4 border-white/80 bg-kid-cream p-5 shadow-[0_24px_60px_rgba(23,50,79,0.45)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: character art + name */}
        <div className="flex items-center gap-4">
          <span
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-lg sm:h-24 sm:w-24"
            style={{ background: `linear-gradient(135deg, ${character.color}55, ${character.color})` }}
          >
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-kid-ink-900 sm:text-3xl">{character.name}</h2>
            <p className="text-sm font-bold capitalize text-kid-ink-700">{character.species}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              playSfx('click');
              stopSpeaking();
              onClose();
            }}
            className="ml-auto rounded-full bg-kid-ink-900/10 px-4 py-2 text-lg font-black text-kid-ink-700 transition-all hover:scale-105 active:scale-95"
            aria-label="Close"
          >
            X
          </button>
        </div>

        {/* Speech bubble: tap to hear the next line */}
        <button
          type="button"
          onClick={nextLine}
          className="relative mt-4 w-full rounded-kid-card border-4 border-kid-sky-400 bg-white p-5 text-left shadow-[0_10px_24px_rgba(23,50,79,0.15)] transition-all hover:scale-[1.01] active:scale-[0.99]"
          aria-label={`${character.name} says: ${line}. Tap to hear another.`}
        >
          <span className="absolute -top-3 left-10 h-6 w-6 rotate-45 border-l-4 border-t-4 border-kid-sky-400 bg-white" aria-hidden="true" />
          <p className="text-xl font-bold leading-snug text-kid-ink-900 sm:text-2xl">{line}</p>
          <p className="mt-2 text-sm font-black uppercase tracking-widest text-kid-sky-600">
            Tap for another
          </p>
        </button>

        {/* Category tabs */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Things to talk about">
          {CHATTER_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => switchTab(id)}
              className={`rounded-kid-card border-b-4 px-3 py-3 text-base font-black transition-all hover:scale-105 active:scale-95 sm:text-sm ${
                tab === id
                  ? 'border-kid-grape-700 bg-kid-grape-500 text-white shadow-lg'
                  : 'border-kid-ink-700/20 bg-white text-kid-ink-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
