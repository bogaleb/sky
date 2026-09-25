'use client';

import { useEffect, useRef, useState } from 'react';
import { speakAs, startMusicBed, stopMusicBed, isMuted } from '@/lib/kid/audio';
import { getCharacter } from '@/lib/kid/characters';
import { AVATARS } from '@/components/avatars';

/**
 * A cinematic video moment: the (silent) generated clip plays while we
 * layer a character voiceover, a soft music bed, and captions on top.
 * This is what makes every video feel alive with sound.
 */
export default function VideoSpot({
  src,
  label,
  characterId,
  voiceover,
  caption,
  poster,
  onDone,
}: {
  src: string;
  label: string;
  /** Which character "speaks" the voiceover. */
  characterId: string;
  /** What the character says while the video plays. */
  voiceover: string;
  /** On-screen caption text. */
  caption: string;
  poster?: string;
  onDone?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted] = useState(() => isMuted());
  const character = getCharacter(characterId);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const begin = () => {
      if (started) return;
      setStarted(true);
      // Layer the sound: character voice + gentle music.
      if (!muted) {
        startMusicBed();
        // Slight delay so the music settles before the voice.
        setTimeout(() => speakAs(characterId, voiceover), 600);
      }
    };

    const finish = () => {
      stopMusicBed();
      onDone?.();
    };

    video.addEventListener('play', begin);
    video.addEventListener('ended', finish);
    // Autoplay muted-first is not needed; the parent screen appears
    // after a tap, so we can play with sound right away.
    video.play().catch(() => {
      /* user will tap to play */
    });

    return () => {
      video.removeEventListener('play', begin);
      video.removeEventListener('ended', finish);
      stopMusicBed();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (failed) {
    // Graceful fallback: the character speaks their line over a pretty backdrop.
    const Avatar = (AVATARS[characterId] ?? AVATARS.curio).Component;
    return (
      <div className="kid-video-spot kid-video-spot--fallback" role="img" aria-label={label}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6">
          <button
            type="button"
            onClick={() => speakAs(characterId, voiceover)}
            className="animate-kid-bob rounded-full transition-transform hover:scale-105 active:scale-95"
            aria-label={`Hear ${character.name}`}
          >
            <Avatar className="h-32 w-32 drop-shadow-[0_14px_24px_rgba(23,50,79,0.35)] md:h-40 md:w-40" />
          </button>
          <p className="max-w-md text-center text-lg font-bold text-white drop-shadow-[0_2px_8px_rgba(23,50,79,0.5)]">
            {caption}
          </p>
          <p className="text-sm font-extrabold uppercase tracking-widest text-white/80">
            Tap {character.name} to hear
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="kid-video-spot" role="img" aria-label={label}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
        className="kid-video-spot__video"
      />
      {/* Caption bar — every video is captioned. */}
      <div className="kid-video-spot__caption" aria-hidden="true">
        <span className="kid-video-spot__caption-name" style={{ color: character.color }}>
          {character.name}
        </span>
        <span className="kid-video-spot__caption-text">{caption}</span>
      </div>
      {/* Tap to replay the voiceover. */}
      <button
        type="button"
        className="kid-video-spot__replay-voice"
        onClick={() => speakAs(characterId, voiceover)}
        aria-label={`Hear ${character.name} again`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      </button>
    </div>
  );
}
