'use client';

import { useState } from 'react';
import type { CardOption } from '@/lib/kid/types';
import { playSfx } from '@/lib/kid/audio';

export interface ChoiceRendererProps {
  options: CardOption[];
  onCommit: (answer: { choice: string }) => void;
  locked: boolean;
  /** Result of the graded attempt, to highlight right/wrong. */
  reveal?: { correct: boolean; pickedId: string } | null;
  /** Accent color for the option buttons. */
  accent?: 'grape' | 'sky' | 'coral' | 'mint';
}

const ACCENTS: Record<string, string> = {
  grape: 'bg-kid-grape-500 hover:bg-kid-grape-400 border-kid-grape-700',
  sky: 'bg-kid-sky-400 hover:bg-kid-sky-300 border-kid-sky-600',
  coral: 'bg-kid-coral-500 hover:bg-kid-coral-400 border-kid-coral-600',
  mint: 'bg-kid-mint-500 hover:bg-kid-mint-400 border-kid-mint-600',
};

/**
 * Big bouncy option buttons for multiple_choice and tap_target.
 * One tap commits the answer — no tiny radios, no double-tap needed.
 */
export default function ChoiceRenderer({ options, onCommit, locked, reveal, accent = 'grape' }: ChoiceRendererProps) {
  const [picked, setPicked] = useState<string | null>(null);

  const tap = (id: string) => {
    if (locked || picked) return;
    playSfx('pop');
    setPicked(id);
    // A beat for the press animation, then commit.
    setTimeout(() => onCommit({ choice: id }), 260);
  };

  return (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-4 md:gap-6" role="group" aria-label="Answer choices">
      {options.map((opt, i) => {
        const isPicked = picked === opt.id;
        const isRevealedPick = reveal?.pickedId === opt.id;
        const showCorrect = reveal && reveal.correct && isRevealedPick;
        const showWrong = reveal && !reveal.correct && isRevealedPick;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={locked}
            onClick={() => tap(opt.id)}
            className={[
              'animate-kid-pop-in min-h-28 rounded-kid-card border-b-8 px-4 py-6 text-4xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.22)] transition-all md:min-h-36 md:text-5xl',
              ACCENTS[accent],
              isPicked && !reveal ? 'scale-110 brightness-110' : '',
              showCorrect ? 'scale-110 border-kid-mint-600 bg-kid-mint-500' : '',
              showWrong ? 'animate-kid-shake border-kid-coral-600 bg-kid-coral-500' : '',
              locked && !isRevealedPick ? 'opacity-70 saturate-50' : '',
              'active:scale-95 disabled:cursor-default',
            ].join(' ')}
            style={{ animationDelay: `${i * 0.09}s` }}
            aria-label={`Answer: ${opt.label}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
