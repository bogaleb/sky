'use client';

import { STICKERS, getSticker } from '@/lib/kid/stickers';
import { AVATARS } from '@/components/avatars';
import { playSfx, speakAs } from '@/lib/kid/audio';

/** A single sticker badge. */
function StickerBadge({ id, earned }: { id: string; earned: boolean }) {
  const sticker = getSticker(id);
  if (!sticker) return null;
  const Avatar = (AVATARS[sticker.characterId] ?? AVATARS.curio).Component;
  return (
    <button
      type="button"
      onClick={() => {
        if (!earned) return;
        playSfx('pop');
        speakAs(sticker.characterId, `${sticker.name}! ${sticker.description}`);
      }}
      className={`flex flex-col items-center gap-1 rounded-kid-card border-4 p-3 transition-all ${
        earned
          ? 'border-white/80 bg-white shadow-[0_10px_24px_rgba(23,50,79,0.2)] hover:scale-105 active:scale-95'
          : 'border-white/30 bg-white/20 opacity-50'
      }`}
      aria-label={earned ? `${sticker.name}: ${sticker.description}. Tap to hear.` : 'Locked sticker'}
    >
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full shadow-inner"
        style={{
          background: earned
            ? `linear-gradient(135deg, ${sticker.colors[0]}, ${sticker.colors[1]})`
            : 'linear-gradient(135deg, #C9D6E3, #9FB2C8)',
        }}
      >
        {earned ? (
          <Avatar className="h-16 w-16" />
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" aria-hidden="true">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        )}
      </span>
      <span className={`text-sm font-black ${earned ? 'text-kid-ink-900' : 'text-white/80'}`}>
        {earned ? sticker.name : '???'}
      </span>
    </button>
  );
}

/**
 * The sticker book: every sticker the child has earned, plus locked
 * silhouettes for the rest. Tap an earned sticker to hear about it.
 */
export default function StickerBook({
  earnedIds,
  onClose,
}: {
  earnedIds: string[];
  onClose: () => void;
}) {
  const earned = new Set(earnedIds);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/70 p-3 backdrop-blur-sm md:p-8">
      <div className="animate-kid-pop-in flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-kid-card border-4 border-white/70 bg-gradient-to-b from-kid-sky-200 to-kid-sky-300 shadow-2xl">
        <div className="flex items-center justify-between bg-white/70 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-2xl font-black text-kid-ink-900 md:text-3xl">My Sticker Book</h2>
            <p className="text-base font-bold text-kid-ink-700">
              {earnedIds.length} of {STICKERS.length} stickers! Keep learning to earn more!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-kid-ink-900/80 px-5 py-2.5 text-lg font-black text-white transition-transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-4 md:grid-cols-4 md:gap-4 md:p-6">
          {STICKERS.map((s) => (
            <StickerBadge key={s.id} id={s.id} earned={earned.has(s.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
