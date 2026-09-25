'use client';

/**
 * DailyGift — Curio pops by once a day with 5 bonus stars and an animal
 * fun fact. Renders nothing once today's gift is claimed. No emoji.
 */

import { useEffect, useState } from 'react';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { awardStars } from '@/app/actions/rewards';
import { reportRewardError } from './game-shell';
import {
  DAILY_GIFT_STARS,
  canClaimGift,
  markGiftClaimed,
  giftAnimalFor,
} from '@/lib/kid/daily-gift';
import { CritterArt } from './encyclopedia';

function GiftBox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="10" y="26" width="44" height="30" rx="5" fill="#E8734A" />
      <rect x="28" y="26" width="8" height="30" fill="#FFD93C" />
      <rect x="7" y="18" width="50" height="12" rx="4" fill="#F0925C" />
      <rect x="28" y="18" width="8" height="12" fill="#FFD93C" />
      <path d="M32 18 C26 10 18 12 22 18 M32 18 C38 10 46 12 42 18" fill="none" stroke="#FFD93C" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
        fill="#FFC93C"
        stroke="#E09E00"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DailyGift({
  childId,
  nickname,
}: {
  childId: string;
  nickname?: string;
}) {
  const [phase, setPhase] = useState<'checking' | 'ready' | 'claimed'>('checking');
  const [animal] = useState(() => giftAnimalFor());

  useEffect(() => {
    setPhase(canClaimGift(childId) ? 'ready' : 'claimed');
    return () => stopSpeaking();
  }, [childId]);

  if (phase !== 'ready') return null;

  const claim = async () => {
    if (!canClaimGift(childId)) {
      setPhase('claimed');
      return;
    }
    playSfx('fanfare');
    speakAs(
      'curio',
      `A gift for you${nickname ? `, ${nickname}` : ''}! ${DAILY_GIFT_STARS} shiny stars! And did you know? ${animal.fact}`
    );
    try {
      await awardStars(childId, DAILY_GIFT_STARS);
    } catch (err) {
      reportRewardError(childId, 'awardStars', err);
    }
    markGiftClaimed(childId);
    setPhase('claimed');
  };

  return (
    <div className="animate-kid-pop-in flex items-center gap-3 rounded-kid-card bg-white/95 px-4 py-3 shadow-xl">
      <div className="animate-kid-bounce-soft shrink-0">
        <GiftBox className="h-14 w-14" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-black text-kid-ink-900 md:text-lg">
          A gift from Curio!
        </p>
        <div className="mt-1 flex items-center gap-2">
          <CritterArt id={animal.id} className="h-10 w-10 shrink-0" />
          <p className="truncate text-sm font-bold text-kid-ink-700">{animal.fact}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void claim()}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-kid-sun-400 px-5 py-3 text-base font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={`Claim your daily gift of ${DAILY_GIFT_STARS} stars`}
      >
        <StarIcon className="h-6 w-6" />
        Claim
      </button>
    </div>
  );
}
