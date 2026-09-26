'use client';

import { getCharacter } from '@/lib/kid/characters';
import { AVATARS } from '@/components/avatars';
import { getIsland } from '@/lib/kid/islands';
import type { TrailState } from '@/app/actions/trail';
import { playSfx } from '@/lib/kid/audio';
import ProgressRail, { type ProgressRailItem } from './progress-rail';

/** Check circle shown at the head of each daily-quest row. */
function QuestCheckArt({ completed, title }: { completed: boolean; title: string }) {
  return (
    <span
      role="img"
      aria-label={completed ? `${title}: done` : `${title}: not done yet`}
      className={`flex h-8 w-8 items-center justify-center rounded-full ${
        completed ? 'bg-kid-leaf-400' : 'bg-kid-sky-100'
      }`}
    >
      {completed && (
        <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden>
          <path d="M3 8.5l3.2 3L13 4.5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

/** Star shown next to a completed quest's bonus. */
function StarBadge() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"
        fill="#FFD166"
        stroke="#E8A100"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * TrailBanner — the Adventure Trail quest card + streak flame + daily
 * quests, shown above the island map. The "Start Quest" button launches
 * the guided learning path; the quest list gives kids daily reasons to
 * return.
 *
 * Progress rendering (the trail bar and the quest list) goes through the
 * shared ProgressRail primitive; the quest header + streak flame are
 * trail-specific identity and stay here.
 */
export default function TrailBanner({
  trail,
  onStartQuest,
  starting,
}: {
  trail: TrailState | null;
  onStartQuest: () => void;
  starting: boolean;
}) {
  if (!trail) return null;
  const island = getIsland(trail.stop.subjectCode);
  const Host = (AVATARS[island.hostCharacter] ?? AVATARS.curio).Component;
  const hostName = getCharacter(island.hostCharacter).name;
  const progress = Math.min(1, Math.max(0, trail.position / trail.totalStops));
  const pct = Math.round(progress * 100);

  const trailItem: ProgressRailItem = {
    id: 'trail-progress',
    label: 'Trail progress',
    progress,
    meta: `${pct}%`,
    detail: `Quest ${trail.questNo} of ${trail.totalStops} · ${trail.chapter}`,
    cta: {
      label: `Start Quest ${trail.questNo}!`,
      busyLabel: 'Charting your course…',
      disabled: starting,
      onClick: () => {
        playSfx('whoosh');
        onStartQuest();
      },
      className:
        'mt-3 w-full rounded-full bg-kid-coral-500 px-8 py-4 text-xl font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60',
    },
  };

  const questItems: ProgressRailItem[] = trail.quests.map((q) => ({
    id: q.id,
    label: q.title,
    progress: q.goal > 0 ? q.progress / q.goal : 0,
    meta: q.completed ? `+${q.stars}` : `${q.progress}/${q.goal}`,
    detail: q.detail,
    complete: q.completed,
    art: <QuestCheckArt completed={q.completed} title={q.title} />,
    badge: q.completed ? <StarBadge /> : undefined,
    barClassName: q.completed ? 'bg-kid-leaf-400' : undefined,
  }));

  return (
    <div className="w-full max-w-3xl px-4">
      <div className="animate-kid-rise overflow-hidden rounded-kid-card bg-white/95 shadow-2xl">
        {/* Quest header */}
        <div
          className="flex items-center gap-4 px-5 py-4"
          style={{ background: `linear-gradient(135deg, ${island.color}22, ${island.color}55)` }}
        >
          <div className="h-20 w-20 shrink-0">
            <Host className="h-full w-full drop-shadow-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black uppercase tracking-widest text-kid-ink-500">
              {trail.chapter} · Quest {trail.questNo} of {trail.totalStops}
            </p>
            <h2 className="truncate text-2xl font-black text-kid-ink-900">{trail.stop.questTitle}</h2>
            <p className="text-lg font-bold text-kid-ink-600">{island.islandName} · with {hostName}</p>
          </div>
          {trail.streak > 0 && (
            <div
              role="img"
              aria-label={`${trail.streak} day streak`}
              className="flex shrink-0 flex-col items-center rounded-2xl bg-orange-100 px-3 py-2"
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
                <path
                  d="M12 2c1 4-4 6-4 11a4.5 4.5 0 009 0c0-2-1-3.5-2-5-.8 1.2-1.4 2-1.8 3.2C12.6 8.6 12.4 5 12 2z"
                  fill="#FF8C42"
                />
                <path d="M12 22a6.5 6.5 0 01-6.5-6.5c0-1.5.5-2.8 1.2-4C8.4 14 10 15.5 10 18a2.5 2.5 0 005 0c0-1-.4-1.9-1-2.6.9-.4 1.7-1 2.3-1.8 1 1.6 1.7 3.3 1.7 4.9A6.5 6.5 0 0112 22z" fill="#FFB703" opacity="0.85" />
              </svg>
              <span className="text-lg font-black text-orange-600">{trail.streak}</span>
              <span className="-mt-1 text-lg font-black uppercase text-orange-500">day streak</span>
            </div>
          )}
        </div>

        {/* Trail progress bar + start button, via the shared rail. */}
        <div className="px-5 py-4">
          <ProgressRail items={[trailItem]} label="Trail progress" />
        </div>

        {/* Daily quests, via the shared rail. */}
        {questItems.length > 0 && (
          <div className="border-t-2 border-dashed border-kid-sky-100 px-5 py-4">
            <p className="mb-3 text-lg font-black uppercase tracking-widest text-kid-ink-500">
              Today&apos;s quests
            </p>
            <ProgressRail items={questItems} label="Today's quests" />
          </div>
        )}
      </div>
    </div>
  );
}
