'use client';

import { STORIES, type Story } from '@/lib/kid/stories';
import { SONGS, type Song } from '@/lib/kid/songs';
import { AVATARS } from '@/components/avatars';
import { playSfx, speakAs } from '@/lib/kid/audio';

/**
 * LibraryPicker — lets kids choose which story to read or which song to sing.
 * Big tappable cards, no reading required beyond the titles (read aloud on tap).
 */
export default function LibraryPicker({
  kind,
  onPick,
  onClose,
}: {
  kind: 'story' | 'song';
  onPick: (item: Story | Song) => void;
  onClose: () => void;
}) {
  const isStory = kind === 'story';
  const items: Array<Story | Song> = isStory ? STORIES : SONGS;
  const characterId = isStory ? 'luna' : 'riff';
  const Character = (AVATARS[characterId] ?? AVATARS.curio).Component;
  const heading = isStory ? "Luna's Storybook" : "Riff's Songbook";
  const prompt = isStory ? 'Which story shall we read?' : 'Which song shall we sing?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/75 p-4">
      <div className="animate-kid-pop-in w-full max-w-2xl rounded-kid-card border-4 border-white/70 bg-gradient-to-b from-kid-sky-100 to-kid-sky-200 p-6 shadow-2xl md:p-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-2xl font-black text-kid-ink-900 md:text-3xl">{heading}</h2>
          <button
            type="button"
            onClick={() => {
              playSfx('pop');
              onClose();
            }}
            aria-label="Close"
            className="rounded-full bg-kid-ink-900/80 px-5 py-2.5 text-lg font-black text-white transition-transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
        <div className="mb-5 flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 animate-kid-bounce-soft">
            <Character className="h-full w-full drop-shadow-lg" />
          </div>
          <p className="text-xl font-black text-kid-ink-800">{prompt}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playSfx('whoosh');
                speakAs(characterId, item.title);
                onPick(item);
              }}
              className="group flex flex-col items-center gap-3 rounded-kid-card border-b-8 border-kid-sky-300 bg-white/95 p-5 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-kid-sky-100 transition-transform group-hover:scale-110">
                <Character className="h-20 w-20" />
              </div>
              <span className="text-center text-lg font-black leading-snug text-kid-ink-900">
                {item.title}
              </span>
              <span className="text-sm font-bold text-kid-ink-500">
                {isStory ? `${(item as Story).pages.length} pages` : `${(item as Song).lines.length} lines`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
