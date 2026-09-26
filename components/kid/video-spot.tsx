'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { speakAs, startMusicBed, stopMusicBed, isMuted } from '@/lib/kid/audio';
import { getCharacter } from '@/lib/kid/characters';
import { AVATARS } from '@/components/avatars';

/**
 * A cinematic video moment: the (silent) generated clip plays full-bleed
 * while we layer a character voiceover, a soft music bed, and captions
 * on top. Captions and action buttons float OVER the video — never below it.
 *
 * Sound controls live only in the session header; VideoSpot itself has no
 * sound icon. The voiceover auto-plays once the video starts.
 */
export default function VideoSpot({
  src,
  label,
  characterId,
  voiceover,
  caption,
  poster,
  onDone,
  overlay,
  rounded = true,
}: {
  src: string;
  label: string;
  /** Which character "speaks" the voiceover. */
  characterId: string;
  /** What the character says while the video plays. */
  voiceover: string;
  /** On-screen caption text, overlaid on the video. */
  caption: string;
  poster?: string;
  onDone?: () => void;
  /** Buttons/content rendered on top of the video (bottom overlay zone). */
  overlay?: ReactNode;
  /** Rounded card look (false for full-bleed cinematic). */
  rounded?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted] = useState(() => isMuted());
  // Wave 10 video diet: don't fetch the bytes until the player is near
  // the viewport. Falls back to loading immediately where
  // IntersectionObserver is unavailable.
  const [srcReady, setSrcReady] = useState(false);
  const character = getCharacter(characterId);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSrcReady(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSrcReady(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!srcReady) return;
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
    // The parent screen appears after a tap, so we can play with sound.
    video.play().catch(() => {
      /* user will tap to play */
    });

    return () => {
      video.removeEventListener('play', begin);
      video.removeEventListener('ended', finish);
      stopMusicBed();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, srcReady]);

  if (failed) {
    // Graceful fallback: the character speaks their line over a pretty backdrop.
    const Avatar = (AVATARS[characterId] ?? AVATARS.curio).Component;
    return (
      <div
        className={rounded ? 'kid-video-spot' : 'kid-video-spot kid-video-spot--bleed'}
        role="img"
        aria-label={label}
      >
        <div className="kid-video-spot__fallback">
          <button
            type="button"
            onClick={() => speakAs(characterId, voiceover)}
            className="animate-kid-bob rounded-full transition-transform hover:scale-105 active:scale-95"
            aria-label={`Hear ${character.name}`}
          >
            <Avatar className="h-32 w-32 drop-shadow-[0_14px_24px_rgba(23,50,79,0.35)] md:h-44 md:w-44" />
          </button>
          <p className="kid-video-spot__fallback-caption">{caption}</p>
          {overlay && <div className="kid-video-spot__overlay">{overlay}</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={rounded ? 'kid-video-spot' : 'kid-video-spot kid-video-spot--bleed'}
      role="img"
      aria-label={label}
    >
      <video
        ref={videoRef}
        src={srcReady ? src : undefined}
        poster={poster}
        playsInline
        preload="none"
        onError={() => setFailed(true)}
        className="kid-video-spot__video"
      />
      {/* Cinematic gradient so captions stay readable over bright video. */}
      <div className="kid-video-spot__shade" aria-hidden="true" />
      {/* Caption floats on the video. */}
      <div className="kid-video-spot__caption" aria-hidden="true">
        <span className="kid-video-spot__caption-name" style={{ color: character.color }}>
          {character.name}
        </span>
        <span className="kid-video-spot__caption-text">{caption}</span>
      </div>
      {/* Action buttons float on the video, above the caption. */}
      {overlay && <div className="kid-video-spot__overlay">{overlay}</div>}
    </div>
  );
}
