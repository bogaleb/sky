'use client';

import { useState } from 'react';
import { getSessionPlan } from '@/app/actions/learning';
import { toPlannedStep, type PlannedStep, type SessionChild, type ServerPlanItem } from '@/lib/kid/types';
import SessionPlayer from '@/components/kid/session-player';
import KidShell from '@/components/kid/kid-shell';

export interface DeckClientProps {
  child: SessionChild;
  initialSteps: PlannedStep[];
  sessionId: string | null;
  onExit: () => Promise<void>;
}

/**
 * Client owner of the session plan: renders the player and can fetch a
 * fresh plan for "Play again" without a full page reload.
 */
export default function DeckClient({ child, initialSteps, sessionId, onExit }: DeckClientProps) {
  const [steps, setSteps] = useState<PlannedStep[]>(initialSteps);
  const [round, setRound] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  const replay = async () => {
    setReloading(true);
    setError(null);
    try {
      const res = await getSessionPlan(child.id);
      const next = (res.plan as unknown as ServerPlanItem[]).map(toPlannedStep);
      if (next.length === 0) throw new Error('empty plan');
      setSteps(next);
      setRound((r) => r + 1);
    } catch {
      setError('Hmm, the sky needs a moment. Try again!');
    } finally {
      setReloading(false);
    }
  };

  if (error && steps.length === 0) {
    return (
      <KidShell>
        <div className="animate-kid-rise rounded-kid-card bg-white/90 px-10 py-8 text-center shadow-2xl">
          <p className="text-2xl font-black text-kid-ink-900">{error}</p>
          <button
            type="button"
            onClick={() => void onExit()}
            className="kid-press mt-4 rounded-full bg-kid-sky-400 px-8 py-3 text-lg font-extrabold text-white"
          >
            Back to profiles
          </button>
        </div>
      </KidShell>
    );
  }

  return (
    <>
      {reloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-sky-300/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-kid-card bg-white/90 px-8 py-8 shadow-2xl">
            <p className="animate-kid-bounce-soft text-center text-2xl font-black text-kid-ink-900">
              Finding new adventures…
            </p>
            <div className="kid-skeleton mt-5 h-10 w-full" style={{ borderRadius: '999px' }} aria-hidden />
            <div className="kid-skeleton mx-auto mt-3 h-5 w-2/3" aria-hidden />
          </div>
        </div>
      )}
      <SessionPlayer
        key={round}
        child={child}
        steps={steps}
        sessionId={sessionId}
        onExit={() => void onExit()}
        onReplay={() => void replay()}
      />
    </>
  );
}
