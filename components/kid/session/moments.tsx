'use client';

import type { SessionChild } from '@/lib/kid/types';
import { playSfx, speakAs, unlockAudio } from '@/lib/kid/audio';
import { getCharacter } from '@/lib/kid/characters';
import { getIsland, type Island } from '@/lib/kid/islands';
import { getSticker } from '@/lib/kid/stickers';
import VideoSpot from '../video-spot';
import { ConfettiBurst } from '../celebration';
import { AVATARS } from '@/components/avatars';

/**
 * Cinematic session moments: the full-screen video views that bookend and
 * punctuate a session. Each view carries at most one gentle ambient looping
 * animation (the Complete avatar's bob); everything else is purposeful
 * one-shot entrance or feedback motion.
 */

/** Welcome intro: Captain Curio's video fills the screen, UI floats on top. */
export function Intro({ child, onStart }: { child: SessionChild; onStart: () => void }) {
  return (
    <div className="animate-kid-rise relative w-full flex-1 overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]" style={{ minHeight: '62vh' }}>
      <div className="absolute inset-0">
        <VideoSpot
          rounded={false}
          src="/videos/welcome.mp4"
          poster="/videos/posters/welcome.jpg"
          label="Captain Curio welcomes you to the sky"
          characterId="curio"
          voiceover={`Ahoy, ${child.nickname}! I'm Captain Curio! Welcome to the Sky! Nine magical islands are waiting for you. Pick one, and let's learn together!`}
          caption={`Ahoy, ${child.nickname}! Welcome to the Sky! Pick an island and let's learn together!`}
          overlay={
            <button
              type="button"
              onClick={() => {
                unlockAudio();
                playSfx('fanfare');
                onStart();
              }}
              className="rounded-kid-card border-b-8 border-kid-coral-600 bg-kid-coral-500 px-14 py-6 text-3xl font-black text-white shadow-[0_18px_44px_rgba(255,107,107,0.5)] transition-all hover:scale-105 hover:brightness-105 active:scale-95"
            >
              Let&apos;s fly!
            </button>
          }
        />
      </div>
      {/* Title floats over the top of the video. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[rgba(12,24,44,0.55)] to-transparent px-6 pb-10 pt-6 text-center">
        <h1 className="text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(12,24,44,0.6)] md:text-5xl">
          Ready to fly, {child.nickname}?
        </h1>
        <p className="mt-1 text-xl font-bold text-white/95 drop-shadow-[0_2px_8px_rgba(12,24,44,0.6)]">
          Nine islands are waiting — reading, math, music, and more!
        </p>
      </div>
    </div>
  );
}

/** Island intro: the host's video fills the screen, UI floats on top. */
export function IslandIntro({
  island,
  child,
  onStart,
  onStoryTime,
  onSingAlong,
}: {
  island: Island;
  child: SessionChild;
  onStart: () => void;
  onStoryTime?: () => void;
  onSingAlong?: () => void;
}) {
  const host = getCharacter(island.hostCharacter);
  return (
    <div className="animate-kid-rise relative w-full flex-1 overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]" style={{ minHeight: '62vh' }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${island.sky[0]}, ${island.sky[1]})` }}>
        <VideoSpot
          rounded={false}
          src={`/videos/${island.hostCharacter}-intro.mp4`}
          label={`${host.name} welcomes you to ${island.islandName}`}
          characterId={island.hostCharacter}
          voiceover={host.greeting}
          caption={host.greeting}
          overlay={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  playSfx('whoosh');
                  speakAs(island.hostCharacter, `Yay! Let's play, ${child.nickname}!`);
                  onStart();
                }}
                className="rounded-kid-card border-b-8 px-12 py-5 text-2xl font-black text-white shadow-[0_18px_44px_rgba(23,50,79,0.35)] transition-all hover:scale-105 hover:brightness-105 active:scale-95"
                style={{ background: island.color, borderColor: 'rgba(0,0,0,0.18)' }}
              >
                Play with {host.name}!
              </button>
              {onStoryTime && (
                <button
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    playSfx('pop');
                    onStoryTime();
                  }}
                  className="rounded-kid-card border-b-8 border-kid-grape-600 bg-kid-grape-400 px-8 py-5 text-2xl font-black text-white shadow-[0_18px_44px_rgba(23,50,79,0.35)] transition-all hover:scale-105 active:scale-95"
                >
                  Story time!
                </button>
              )}
              {onSingAlong && (
                <button
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    playSfx('pop');
                    onSingAlong();
                  }}
                  className="rounded-kid-card border-b-8 border-kid-berry-600 bg-kid-berry-400 px-8 py-5 text-2xl font-black text-white shadow-[0_18px_44px_rgba(23,50,79,0.35)] transition-all hover:scale-105 active:scale-95"
                >
                  Sing with {host.name}!
                </button>
              )}
            </div>
          }
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[rgba(12,24,44,0.55)] to-transparent px-6 pb-10 pt-6 text-center">
        <h1 className="text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(12,24,44,0.6)] md:text-5xl">
          {island.islandName}
        </h1>
        <p className="mt-1 text-xl font-bold text-white/95 drop-shadow-[0_2px_8px_rgba(12,24,44,0.6)]">
          {host.name} has {child.nickname}&apos;s {island.subjectName.toLowerCase()} games ready!
        </p>
      </div>
    </div>
  );
}

/** Session complete: celebration video, stars, points, replay/exit. */
export function Complete({
  child,
  stars,
  points,
  newStickers,
  questOutro,
  onReplay,
  onExit,
}: {
  child: SessionChild;
  stars: number;
  points: number;
  newStickers: string[];
  questOutro: string | null;
  onReplay: () => void;
  onExit: () => void;
}) {
  const Avatar = (AVATARS[child.avatarId] ?? AVATARS.curio).Component;
  return (
    <div className="animate-kid-rise relative w-full flex-1 overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]" style={{ minHeight: '62vh' }}>
      <ConfettiBurst count={90} />
      <div className="absolute inset-0 bg-gradient-to-b from-kid-grape-400 via-kid-berry-400 to-kid-sun-300">
        <VideoSpot
          rounded={false}
          src="/videos/celebrate.mp4"
          poster="/videos/posters/celebrate.jpg"
          label="Celebration"
          characterId="curio"
          voiceover={`Amazing flying, ${child.nickname}! You earned ${points} points! The whole sky is so proud of you!`}
          caption={`Amazing flying, ${child.nickname}! You earned ${points} points!`}
          overlay={
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  playSfx('whoosh');
                  onReplay();
                }}
                className="rounded-kid-card border-b-8 border-kid-mint-600 bg-kid-mint-500 px-10 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
              >
                Play again!
              </button>
              <button
                type="button"
                onClick={onExit}
                className="rounded-kid-card border-b-8 border-white/60 bg-white px-10 py-5 text-2xl font-black text-kid-ink-700 shadow-[0_14px_30px_rgba(23,50,79,0.2)] transition-all hover:scale-105 active:scale-95"
              >
                Done for now
              </button>
            </div>
          }
        />
      </div>
      {/* Stars + headline float over the top of the video. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center bg-gradient-to-b from-[rgba(12,24,44,0.55)] to-transparent px-6 pb-12 pt-5">
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="animate-kid-pop-in" style={{ animationDelay: `${0.3 + i * 0.25}s` }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <path
                  d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
                  fill={i < stars ? '#FFC93C' : 'rgba(255,255,255,0.5)'}
                  stroke={i < stars ? '#E09E00' : 'rgba(255,255,255,0.9)'}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ))}
        </div>
        <h1 className="mt-1 text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(12,24,44,0.6)] md:text-5xl">
          {questOutro ? 'Quest complete!' : `Amazing flying, ${child.nickname}!`}
        </h1>
        {questOutro && (
          <p className="mt-2 max-w-xl text-center text-xl font-bold text-white/95 drop-shadow-[0_2px_8px_rgba(12,24,44,0.6)]">
            {questOutro}
          </p>
        )}
        {newStickers.length > 0 && (
          <div className="animate-kid-pop-in mt-3 flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 shadow-xl" style={{ animationDelay: '1s' }}>
            <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
              <rect x="10" y="14" width="44" height="38" rx="6" fill="#FFD93C" />
              <circle cx="32" cy="34" r="9" fill="#fff" />
              <path d="M32 29l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#FFD93C" />
            </svg>
            <span className="text-lg font-black text-kid-ink-900">
              New sticker{newStickers.length > 1 ? 's' : ''}: {newStickers.map((id) => getSticker(id)?.name).filter(Boolean).join(', ')}!
            </span>
          </div>
        )}
        <div className="animate-kid-bob mt-2">
          <Avatar className="h-20 w-20 drop-shadow-[0_12px_20px_rgba(23,50,79,0.3)]" />
        </div>
      </div>
    </div>
  );
}

/** Goodbye ritual: Captain Curio's video fills the screen, farewell floats on top. */
export function Goodbye({ child, onDone }: { child: SessionChild; onDone: () => void }) {
  return (
    <div className="animate-kid-rise relative w-full flex-1 overflow-hidden rounded-kid-card border-4 border-white/70 shadow-[0_24px_60px_rgba(23,50,79,0.3)]" style={{ minHeight: '62vh' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-kid-grape-400 to-kid-sun-300">
        <VideoSpot
          rounded={false}
          src="/videos/goodbye.mp4"
          poster="/videos/posters/goodbye.jpg"
          label="Captain Curio says goodbye"
          characterId="curio"
          voiceover={`What a wonderful day of learning, ${child.nickname}! I'm so proud of you. Tomorrow, a brand-new island adventure is waiting. Sleep tight, little captain!`}
          caption={`What a wonderful day, ${child.nickname}! Tomorrow brings a brand-new adventure!`}
          onDone={onDone}
          overlay={
            <button
              type="button"
              onClick={onDone}
              className="rounded-kid-card border-b-8 border-kid-sky-600 bg-kid-sky-500 px-12 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
            >
              Bye-bye!
            </button>
          }
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[rgba(12,24,44,0.55)] to-transparent px-6 pb-10 pt-6 text-center">
        <h1 className="text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(12,24,44,0.6)] md:text-5xl">
          See you tomorrow, {child.nickname}!
        </h1>
      </div>
    </div>
  );
}
