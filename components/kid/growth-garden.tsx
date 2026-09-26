'use client';

import { getIsland } from '@/lib/kid/islands';
import { plantLine, type GardenPlant, type GrowthStage } from '@/lib/kid/garden';
import { playSfx, speakAs } from '@/lib/kid/audio';

/**
 * The growth garden: one plant per subject, grown by real mastery
 * (lib/kid/garden.ts). A pre-reader can see progress without numbers; tap or
 * hold a plant to hear how it is doing and what helps it grow.
 */

function PlantArt({ stage, color }: { stage: GrowthStage; color: string }) {
  return (
    <svg viewBox="0 0 100 110" className="h-full w-full" aria-hidden>
      {/* pot */}
      <path d="M26 78h48l-6 26H32z" fill="#E07A4F" stroke="#B85A33" strokeWidth="3" strokeLinejoin="round" />
      <rect x="22" y="72" width="56" height="10" rx="4" fill="#F29D6B" stroke="#B85A33" strokeWidth="3" />
      <ellipse cx="50" cy="74" rx="24" ry="4" fill="#6B4A2F" />
      {stage === 0 && <ellipse cx="50" cy="71" rx="6" ry="4" fill="#8B5E34" stroke="#5E3D1F" strokeWidth="2" />}
      {stage >= 1 && (
        <path
          d={stage === 1 ? 'M50 73 V60' : stage === 2 ? 'M50 73 V44' : 'M50 73 V30'}
          stroke="#3E9B4F"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      )}
      {stage === 1 && (
        <>
          <path d="M50 62 q-9 -8 -14 -2 q6 6 14 2z" fill="#6BCB77" />
          <path d="M50 62 q9 -8 14 -2 q-6 6 -14 2z" fill="#6BCB77" />
        </>
      )}
      {stage >= 2 && (
        <>
          <path d="M50 60 q-16 -10 -22 -1 q9 9 22 1z" fill="#5DBB63" stroke="#3E9B4F" strokeWidth="1.5" />
          <path d="M50 52 q16 -10 22 -1 q-9 9 -22 1z" fill="#5DBB63" stroke="#3E9B4F" strokeWidth="1.5" />
        </>
      )}
      {stage === 3 && <ellipse cx="50" cy="26" rx="8" ry="11" fill={color} stroke="#ffffff" strokeWidth="2.5" />}
      {stage === 4 && (
        <g>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse
              key={a}
              cx="50"
              cy="16"
              rx="8"
              ry="12"
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              transform={`rotate(${a} 50 28)`}
            />
          ))}
          <circle cx="50" cy="28" r="8" fill="#FFD166" stroke="#E0A800" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

function Plant({ plant }: { plant: GardenPlant }) {
  const island = getIsland(plant.subject);
  const line = plantLine(island.subjectName.toLowerCase(), plant);
  // A plant has nothing else to do, so a tap speaks how it is growing.
  return (
    <button
      type="button"
      onClick={() => {
        playSfx('pop');
        speakAs(island.hostCharacter, line);
      }}
      aria-label={line}
      className="kid-press kid-no-callout flex flex-col items-center rounded-3xl px-1 pb-1 pt-2"
    >
      <span className="block h-20 w-20 md:h-24 md:w-24">
        <PlantArt stage={plant.stage} color={island.color} />
      </span>
      <span className="mt-1 text-base font-extrabold text-kid-ink-800">{island.subjectName}</span>
    </button>
  );
}

// Even rows at every size (no plant stranded alone on a row).
const GRID: Record<number, string> = {
  4: 'grid-cols-2 sm:grid-cols-4',
  6: 'grid-cols-3 md:grid-cols-6',
  9: 'grid-cols-3 md:grid-cols-9',
};

export default function GrowthGarden({ plants, showLabel }: { plants: GardenPlant[]; showLabel: boolean }) {
  return (
    <section aria-label="My growing garden" className="w-full rounded-kid-card bg-white/85 px-3 py-4 shadow-lg md:px-6">
      {showLabel && (
        <h2 className="font-display mb-1 text-center text-2xl font-black text-kid-ink-900">My garden</h2>
      )}
      <div className={`grid items-end justify-items-center gap-x-2 gap-y-3 ${GRID[plants.length] ?? GRID[9]}`}>
        {plants.map((p) => (
          <Plant key={p.subject} plant={p} />
        ))}
      </div>
    </section>
  );
}
