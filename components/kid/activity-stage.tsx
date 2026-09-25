'use client';

import { useEffect, useRef, useState } from 'react';
import type { AttemptResult, PlannedStep } from '@/lib/kid/types';
import { countObjectsFrom, listenScriptFrom, traceTargetFrom } from '@/lib/kid/card-mapping';
import { speak, playSfx, stopSpeaking } from '@/lib/kid/audio';
import PromptBar from './prompt-bar';
import ChoiceRenderer from './activities/choice';
import CountRenderer from './activities/count';
import SequenceRenderer from './activities/sequence';
import SortRenderer from './activities/sort';
import TraceRenderer from './activities/trace';
import ListenRenderer from './activities/listen';
import { FeedbackOverlay } from './celebration';
import type { CharacterMood } from './host-character';

export interface ActivityStageProps {
  step: PlannedStep;
  onSubmit: (activityId: string, answer: unknown, latencyMs: number) => Promise<AttemptResult>;
  onComplete: (result: AttemptResult) => void;
  onMood: (mood: CharacterMood) => void;
}

function narrationOf(step: PlannedStep): string {
  const c = step.card.card as { narration?: string };
  return c.narration || step.card.prompt_text;
}

/**
 * One activity on stage: prompt + renderer, then the feedback overlay.
 * Announces the prompt aloud on arrival (non-reader support).
 */
export default function ActivityStage({ step, onSubmit, onComplete, onMood }: ActivityStageProps) {
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<AttemptResult | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const startRef = useRef(Date.now());
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = step.card;
  const payload = card.card as Record<string, unknown>;
  const narration = narrationOf(step);

  // Fresh activity: reset, announce aloud, reset mood.
  useEffect(() => {
    setLocked(false);
    setFeedback(null);
    setPickedId(null);
    startRef.current = Date.now();
    onMood('idle');
    const t = setTimeout(() => speak(narration), 600);
    return () => {
      clearTimeout(t);
      stopSpeaking();
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.activityId]);

  const commit = async (answer: unknown) => {
    if (locked) return;
    setLocked(true);
    stopSpeaking();
    if (answer && typeof answer === 'object' && 'choice' in answer) {
      setPickedId((answer as { choice: string }).choice);
    }
    const latencyMs = Date.now() - startRef.current;
    try {
      const result = await onSubmit(step.activityId, answer, latencyMs);
      if (result.correct) {
        playSfx('correct');
        onMood('cheer');
      } else {
        playSfx('wrong');
        onMood('oops');
      }
      setFeedback(result);
      // Auto-advance after the celebration; tap skips ahead.
      feedbackTimer.current = setTimeout(() => advance(result), result.correct ? 2600 : 3200);
    } catch {
      setLocked(false);
      onMood('idle');
    }
  };

  const advance = (result: AttemptResult) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(null);
    onComplete(result);
  };

  const accent = (['grape', 'sky', 'coral', 'mint'] as const)[step.targetLevel % 4] ?? 'grape';

  return (
    <div className="flex w-full flex-col items-center gap-6 md:gap-8">
      <PromptBar
        prompt={card.prompt_text}
        narration={narration}
        characterId={step.hostCharacter}
        mood={feedback ? (feedback.correct ? 'cheer' : 'oops') : 'idle'}
        islandName={step.islandName}
        skillName={step.skillName}
      />

      <div key={step.activityId} className="flex w-full justify-center">
        {step.kind === 'multiple_choice' && (
          <ChoiceRenderer
            options={(payload.options as { id: string; label: string }[]) ?? []}
            onCommit={commit}
            locked={locked}
            accent={accent}
            reveal={feedback ? { correct: feedback.correct, pickedId: pickedId ?? '' } : null}
          />
        )}
        {step.kind === 'tap_target' && (
          <ChoiceRenderer
            options={(payload.targets as { id: string; label: string }[]) ?? []}
            onCommit={commit}
            locked={locked}
            accent="sky"
            reveal={feedback ? { correct: feedback.correct, pickedId: pickedId ?? '' } : null}
          />
        )}
        {step.kind === 'tap_count' && (
          <CountRenderer
            objects={countObjectsFrom(payload)}
            onCommit={commit}
            locked={locked}
          />
        )}
        {step.kind === 'sequence' && (
          <SequenceRenderer
            items={(payload.items as { id: string; label: string }[]) ?? []}
            onCommit={commit}
            locked={locked}
          />
        )}
        {step.kind === 'sort' && (
          <SortRenderer
            items={(payload.items as { id: string; label: string }[]) ?? []}
            groups={(payload.groups as { id: string; label: string }[]) ?? []}
            onCommit={commit}
            locked={locked}
          />
        )}
        {step.kind === 'trace' && (
          <TraceRenderer
            target={traceTargetFrom(card.prompt_text)}
            onCommit={commit}
            locked={locked}
          />
        )}
        {step.kind === 'listen_repeat' && (
          <ListenRenderer
            script={listenScriptFrom(payload)}
            narration={narration}
            onCommit={commit}
            locked={locked}
          />
        )}
      </div>

      {feedback && (
        <FeedbackOverlay
          correct={feedback.correct}
          streak={feedback.streak}
          pointsEarned={feedback.pointsEarned}
          leveledUp={feedback.leveledUp}
          onDone={() => advance(feedback)}
        />
      )}
    </div>
  );
}
