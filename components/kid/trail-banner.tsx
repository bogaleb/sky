'use client';

import { getCharacter } from '@/lib/kid/characters';
import { AVATARS } from '@/components/avatars';
import { getIsland } from '@/lib/kid/islands';
import type { TrailState } from '@/app/actions/trail';
import { playSfx } from '@/lib/kid/audio';

/**
 * TrailBanner — the Adventure Trail quest card + streak flame + daily
 * quests, shown above the island map. The "Start Quest" button launches
 * the guided learning path; the quest list gives kids daily reasons to
 * return.
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
  const pct = Math.round((trail.position / trail.totalStops) * 100);

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
            <p className="text-xs font-black uppercase tracking-widest text-kid-ink-500">
              {trail.chapter} · Quest {trail.questNo} of {trail.totalStops}
            </p>
            <h2 className="truncate text-2xl font-black text-kid-ink-900">{trail.stop.questTitle}</h2>
            <p className="text-sm font-bold text-kid-ink-600">{island.islandName} · with {hostName}</p>
          </div>
          {trail.streak > 0 && (
            <div className="flex shrink-0 flex-col items-center rounded-2xl bg-orange-100 px-3 py-2">
              <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
                <path
                  d="M12 2c1 4-4 6-4 11a4.5 4.5 0 009 0c0-2-1-3.5-2-5-.8 1.2-1.4 2-1.8 3.2C12.6 8.6 12.4 5 12 2z"
                  fill="#FF8C42"
                />
                <path d="M12 22a6.5 6.5 0 01-6.5-6.5c0-1.5.5-2.8 1.2-4C8.4 14 10 15.5 10 18a2.5 2.5 0 005 0c0-1-.4-1.9-1-2.6.9-.4 1.7-1 2.3-1.8 1 1.6 1.7 3.3 1.7 4.9A6.5 6.5 0 0112 22z" fill="#FFB703" opacity="0.85" />
              </svg>
              <span className="text-lg font-black text-orange-600">{trail.streak}</span>
              <span className="-mt-1 text-[10px] font-black uppercase text-orange-500">day streak</span>
            </div>
          )}
        </div>

        {/* Progress + start */}
        <div className="px-5 py-4">
          <div className="mb-1 flex justify-between text-xs font-black uppercase tracking-wider text-kid-ink-500">
            <span>Trail progress</span>
            <span>{pct}%</span>
          </div>
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-kid-sky-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-kid-sun-400 to-kid-coral-400 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            type="button"
            disabled={starting}
            onClick={() => {
              playSfx('whoosh');
              onStartQuest();
            }}
            className="w-full rounded-full bg-kid-coral-500 px-8 py-4 text-xl font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {starting ? 'Charting your course…' : `Start Quest ${trail.questNo}!`}
          </button>
        </div>

        {/* Daily quests */}
        {trail.quests.length > 0 && (
          <div className="border-t-2 border-dashed border-kid-sky-100 px-5 py-3">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-kid-ink-500">Today's quests</p>
            <div className="flex flex-col gap-1.5">
              {trail.quests.map((q) => (
                <div key={q.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      q.completed ? 'bg-kid-leaf-400' : 'bg-kid-sky-100'
                    }`}
                  >
                    {q.completed && (
                      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
                        <path d="M3 8.5l3.2 3L13 4.5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                  <span className={`font-bold ${q.completed ? 'text-kid-ink-400 line-through' : 'text-kid-ink-700'}`}>
                    {q.title}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-xs font-black text-kid-ink-500">
                    {q.completed ? (
                      <>
                        +{q.stars}
                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                          <path
                            d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"
                            fill="#FFD166"
                            stroke="#E8A100"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </>
                    ) : (
                      `${q.progress}/${q.goal}`
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
