'use client';

import type { PlannedStep, SessionChild } from '@/lib/kid/types';
import { getGame, GameOverlay } from './game-registry';
import KidShell from './kid-shell';
import SplashIntro from './splash-intro';
import PhaseTransition from './kid-transition';
import { useSessionMachine } from './session/phase-machine';
import PhaseRouter from './session/phase-router';

export interface SessionPlayerProps {
  child: SessionChild;
  steps: PlannedStep[];
  sessionId: string | null;
  onExit: () => void;
  onReplay: () => void;
}

/**
 * SessionPlayer — thin orchestrator for the kid session.
 *
 * The session state machine lives in `./session/phase-machine.tsx`
 * (intro -> map -> islandIntro -> playing -> complete -> goodbye), the
 * per-phase views in `./session/phase-router.tsx`, `./session/map-view.tsx`,
 * and `./session/moments.tsx`. This component only wires the machine into
 * the KidShell HUD, the phase transition wrapper, and the game overlay.
 */
export default function SessionPlayer({ child, steps, sessionId, onExit, onReplay }: SessionPlayerProps) {
  const machine = useSessionMachine({ child, steps, sessionId, onExit });

  return (
    <>
    <KidShell
      doneCount={machine.stars}
      totalSteps={machine.activeSteps.length}
      points={(machine.walletBalance ?? 0) + machine.points}
      onExit={machine.phase === 'playing' || machine.phase === 'map' || machine.phase === 'trailIntro' ? onExit : undefined}
      hideHud={machine.openGame !== null}
      hudId="outer"
    >
      <SplashIntro onDone={() => {}} />
      <PhaseTransition transitionKey={machine.phase} className="flex w-full flex-col items-center">
        <PhaseRouter machine={machine} />
      </PhaseTransition>
    </KidShell>
    {/* Game overlay rendered outside KidShell (and PhaseTransition) so position:fixed
        is viewport-relative, not broken by ancestor transforms. */}
    {(() => {
      const entry = getGame(machine.openGame);
      return entry ? (
        <GameOverlay entry={entry} child={child} nickname={child.nickname} onClose={() => machine.setOpenGame(null)} />
      ) : null;
    })()}
    </>
  );
}
