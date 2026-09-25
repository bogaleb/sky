'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { speakAs, stopSpeaking } from '@/lib/kid/audio';
import { AVATARS } from '@/components/avatars';
import type { Song } from '@/lib/kid/songs';

/** Line advance interval while singing along. */
const LINE_MS = 2500;

interface FloatingNote {
  id: number;
  left: number;
  delay: number;
  size: number;
}

function MusicNote({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M9 18.5a3 3 0 1 1-2-2.83V6.4l10-2.4v11.37a3 3 0 1 1-2-2.83V5.1L9 6.9v11.6z" />
    </svg>
  );
}

export default function Songbook({
  song,
  onDone,
  onFinish,
}: {
  song: Song;
  onDone: () => void;
  onFinish: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [notes] = useState<FloatingNote[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 6 + ((i * 97) % 88),
      delay: (i * 0.9) % 5,
      size: 22 + ((i * 37) % 26),
    })),
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const RiffAvatar = AVATARS.riff.Component;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const speakLine = useCallback((index: number) => {
    const line = song.lines[index];
    if (!line) return;
    speakAs('riff', line.text);
  }, [song]);

  const playFrom = useCallback(
    (index: number) => {
      stopTimer();
      setCurrentLine(index);
      speakLine(index);
      setPlaying(true);
      timerRef.current = setTimeout(() => {
        if (index + 1 < song.lines.length) {
          playFrom(index + 1);
        } else {
          stopTimer();
          setPlaying(false);
          setFinished(true);
        }
      }, LINE_MS);
    },
    [song, speakLine, stopTimer],
  );

  const stopSong = useCallback(() => {
    stopTimer();
    stopSpeaking();
    setPlaying(false);
  }, [stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
      stopSpeaking();
    };
  }, [stopTimer]);

  const handleTapLine = (index: number) => {
    setFinished(false);
    playFrom(index);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-kid-sky-100" role="dialog" aria-modal="true" aria-label={song.title}>
      {/* Floating music notes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {notes.map((note) => (
          <span
            key={note.id}
            className="songbook-note absolute text-kid-grape-500/60"
            style={{ left: `${note.left}%`, animationDelay: `${note.delay}s` }}
          >
            <MusicNote size={note.size} />
          </span>
        ))}
      </div>

      <style>{`
        .songbook-note {
          bottom: -8%;
          animation: songbook-float 6s linear infinite;
        }
        @keyframes songbook-float {
          0% { transform: translateY(0) rotate(-8deg); opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { transform: translateY(-110vh) rotate(10deg); opacity: 0; }
        }
      `}</style>

      {/* Top bar */}
      <div className="relative flex items-center justify-between p-4 md:p-6">
        <h1 className="animate-kid-pop-in text-3xl font-black text-kid-ink-900 md:text-5xl">{song.title}</h1>
        <button
          type="button"
          onClick={() => {
            stopSong();
            onDone();
          }}
          className="rounded-full bg-white/80 px-5 py-2.5 text-lg font-black text-kid-ink-800 shadow transition-transform hover:scale-105 active:scale-95"
        >
          Close
        </button>
      </div>

      {/* Riff dancing */}
      <div className="relative flex items-center justify-center gap-4 px-4">
        <div className={playing ? 'animate-kid-bob' : ''}>
          <RiffAvatar className="h-28 w-28 drop-shadow-[0_12px_20px_rgba(23,50,79,0.25)] md:h-36 md:w-36" />
        </div>
        {!playing && !finished && (
          <button
            type="button"
            onClick={() => playFrom(0)}
            className="animate-kid-pop-in rounded-full bg-kid-sun-400 px-8 py-4 text-2xl font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Play song
          </button>
        )}
        {playing && (
          <button
            type="button"
            onClick={stopSong}
            className="rounded-full bg-white/80 px-6 py-3 text-xl font-black text-kid-ink-800 shadow transition-transform hover:scale-105 active:scale-95"
          >
            Pause
          </button>
        )}
      </div>

      {/* Lyrics */}
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-2 overflow-y-auto px-6 py-4 md:gap-3">
        {finished ? (
          <div className="animate-kid-pop-in flex flex-col items-center gap-5 text-center">
            <p className="text-5xl font-black text-kid-ink-900 md:text-7xl">Bravo!</p>
            <p className="text-xl font-bold text-kid-ink-700">You sang the whole song!</p>
            <button
              type="button"
              onClick={() => {
                stopSong();
                onFinish();
              }}
              className="rounded-full bg-kid-mint-500 px-10 py-5 text-2xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95 md:text-3xl"
            >
              Finish song
            </button>
          </div>
        ) : (
          song.lines.map((line, index) => {
            const isCurrent = currentLine === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleTapLine(index)}
                aria-label={`Sing line: ${line.text}`}
                className={[
                  'rounded-kid-card border-4 px-5 py-3 text-center transition-all duration-300 md:px-8 md:py-4',
                  isCurrent
                    ? 'animate-kid-pop-in scale-105 border-kid-sun-500 bg-kid-cream text-2xl font-black text-kid-ink-900 shadow-xl md:text-4xl'
                    : currentLine !== null
                      ? 'border-transparent bg-white/50 text-lg font-bold text-kid-ink-700 md:text-2xl'
                      : 'border-white/70 bg-white/90 text-xl font-extrabold text-kid-ink-800 shadow hover:scale-[1.02] md:text-2xl',
                ].join(' ')}
              >
                {line.text}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
