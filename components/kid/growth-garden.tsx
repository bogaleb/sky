'use client';

/**
 * GrowthGarden — the hero progress metaphor for the kid home. One garden
 * that visibly blooms as skill_mastery levels up: every subject is a flower
 * whose growth stage (seed → sprout → bud → bloom → full bloom) is driven
 * by mastered/total skills from getIslandProgress (the existing Wave-11
 * skill_mastery read). No emoji; labels at 18px+.
 */

import { ISLANDS } from '@/lib/kid/islands';

export type SubjectProgress = { mastered: number; total: number };

export type GrowthStage = 0 | 1 | 2 | 3 | 4;

/**
 * Growth stage from the mastered ratio: 0 seed, 1 sprout, 2 bud,
 * 3 bloom, 4 full bloom.
 */
export function growthStage(mastered: number, total: number): GrowthStage {
  if (total <= 0 || mastered <= 0) return 0;
  const r = mastered / total;
  if (r < 1 / 3) return 1;
  if (r < 2 / 3) return 2;
  if (r < 1) return 3;
  return 4;
}

export function gardenTotals(progress: Record<string, SubjectProgress>): {
  mastered: number;
  total: number;
} {
  let mastered = 0;
  let total = 0;
  for (const p of Object.values(progress)) {
    mastered += p.mastered;
    total += p.total;
  }
  return { mastered, total };
}

const SOIL_TOP = 292;
const STEM_HEIGHTS = [26, 62, 94, 114, 130] as const;
const LEAF = '#3E7C4F';
const LEAF_DARK = '#2E5F3B';

function Sparkle({ x, y, delay = '0s', scale = 1 }: { x: number; y: number; delay?: string; scale?: number }) {
  return (
    <path
      d="M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z"
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="#FFF6C9"
      stroke="#F5C542"
      strokeWidth="1"
      className="animate-kid-sparkle"
      style={{ animationDelay: delay, transformBox: 'fill-box', transformOrigin: 'center' }}
      aria-hidden="true"
    />
  );
}

function Butterfly({ x, y, color, delay = '0s' }: { x: number; y: number; color: string; delay?: string }) {
  return (
    <g
      className="animate-kid-float"
      style={{ animationDelay: delay }}
      aria-hidden="true"
    >
      <ellipse cx={x - 7} cy={y} rx="8" ry="11" fill={color} opacity="0.92" transform={`rotate(-18 ${x - 7} ${y})`} />
      <ellipse cx={x + 7} cy={y} rx="8" ry="11" fill={color} opacity="0.92" transform={`rotate(18 ${x + 7} ${y})`} />
      <ellipse cx={x - 7} cy={y} rx="3.5" ry="5" fill="#FFFFFF" opacity="0.7" transform={`rotate(-18 ${x - 7} ${y})`} />
      <ellipse cx={x + 7} cy={y} rx="3.5" ry="5" fill="#FFFFFF" opacity="0.7" transform={`rotate(18 ${x + 7} ${y})`} />
      <rect x={x - 1.6} y={y - 11} width="3.2" height="22" rx="1.6" fill="#4A3728" />
    </g>
  );
}

function Flower({
  x,
  stage,
  color,
  accent,
  index,
}: {
  x: number;
  stage: GrowthStage;
  color: string;
  accent: string;
  index: number;
}) {
  const h = STEM_HEIGHTS[stage];
  const top = SOIL_TOP - h;
  return (
    <g
      className="animate-kid-sway"
      style={{ transformOrigin: `${x}px ${SOIL_TOP}px`, animationDelay: `${(index % 5) * 0.35}s` }}
    >
      {stage === 0 ? (
        <>
          <ellipse cx={x} cy={SOIL_TOP - 4} rx="8" ry="5.5" fill="#8B5E3C" />
          <ellipse cx={x - 6} cy={SOIL_TOP - 14} rx="6" ry="3" fill={LEAF} transform={`rotate(-30 ${x - 6} ${SOIL_TOP - 14})`} />
          <ellipse cx={x + 6} cy={SOIL_TOP - 14} rx="6" ry="3" fill={LEAF} transform={`rotate(30 ${x + 6} ${SOIL_TOP - 14})`} />
        </>
      ) : (
        <>
          <path
            d={`M ${x} ${SOIL_TOP} C ${x - 7} ${SOIL_TOP - h * 0.4}, ${x + 7} ${SOIL_TOP - h * 0.7}, ${x} ${top}`}
            stroke={LEAF_DARK}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          {/* leaves */}
          <ellipse cx={x - 13} cy={SOIL_TOP - h * 0.42} rx="12" ry="5.5" fill={LEAF} transform={`rotate(-28 ${x - 13} ${SOIL_TOP - h * 0.42})`} />
          <ellipse cx={x + 13} cy={SOIL_TOP - h * 0.42} rx="12" ry="5.5" fill={LEAF} transform={`rotate(28 ${x + 13} ${SOIL_TOP - h * 0.42})`} />
          {stage >= 2 && (
            <>
              <ellipse cx={x - 10} cy={SOIL_TOP - h * 0.66} rx="9" ry="4.5" fill={LEAF} transform={`rotate(-28 ${x - 10} ${SOIL_TOP - h * 0.66})`} />
              <ellipse cx={x + 10} cy={SOIL_TOP - h * 0.66} rx="9" ry="4.5" fill={LEAF} transform={`rotate(28 ${x + 10} ${SOIL_TOP - h * 0.66})`} />
            </>
          )}
          {stage === 2 && (
            <>
              <circle cx={x} cy={top} r="10" fill={accent} />
              <path d={`M ${x - 7} ${top + 8} q 7 6 14 0`} stroke={LEAF_DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}
          {stage >= 3 && (
            <>
              {stage === 4 && <circle cx={x} cy={top} r="30" fill={accent} opacity="0.22" />}
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <ellipse
                  key={deg}
                  cx={x}
                  cy={top - 15}
                  rx="10.5"
                  ry="16"
                  fill={color}
                  opacity="0.95"
                  transform={`rotate(${deg} ${x} ${top})`}
                />
              ))}
              <circle cx={x} cy={top} r="9" fill={accent} stroke="#B07A1F" strokeWidth="1.5" />
              {stage === 4 && <Sparkle x={x + 24} y={top - 22} delay={`${index * 0.4}s`} scale={0.9} />}
            </>
          )}
        </>
      )}
    </g>
  );
}

export default function GrowthGarden({ progress }: { progress: Record<string, SubjectProgress> | null }) {
  if (progress === null) {
    return (
      <section aria-label="My Growth Garden" className="w-full max-w-4xl">
        <div className="kid-skeleton h-64 w-full rounded-kid-card" aria-hidden="true" />
      </section>
    );
  }

  const totals = gardenTotals(progress);
  const flowers = ISLANDS.map((island, i) => {
    const p = progress[island.subjectCode] ?? { mastered: 0, total: 0 };
    return { island, stage: growthStage(p.mastered, p.total), mastered: p.mastered, total: p.total, x: 62 + i * 100 };
  });
  const fullBlooms = flowers.filter((f) => f.stage === 4);
  const butterflies = fullBlooms.slice(0, 3);
  const meadowSparkles = Math.min(6, Math.ceil(totals.mastered / 2));

  const headline =
    totals.total === 0
      ? 'Play games to plant your garden — every skill you practice makes it bloom!'
      : totals.mastered === 0
        ? 'Your garden is planted! Play a game to help the first flowers grow.'
        : totals.mastered >= totals.total
          ? `A full garden! All ${totals.total} skills are blooming!`
          : `${totals.mastered} of ${totals.total} skills blooming — keep growing!`;

  return (
    <section aria-label="My Growth Garden" className="w-full max-w-4xl">
      <div className="glass-kid overflow-hidden px-4 py-5 md:px-8 md:py-6">
        <h2 className="font-display text-center text-2xl text-kid-ink-900 md:text-4xl">My Growth Garden</h2>
        <p className="mt-1 text-center text-lg font-bold text-kid-ink-700">{headline}</p>

        <svg viewBox="0 0 920 340" className="mt-3 w-full" role="presentation" aria-hidden="true">
          <defs>
            <linearGradient id="garden-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BDE7FF" />
              <stop offset="100%" stopColor="#E8F9FF" />
            </linearGradient>
            <linearGradient id="garden-soil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9C6B43" />
              <stop offset="100%" stopColor="#7A4F2E" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="920" height="340" rx="24" fill="url(#garden-sky)" />

          {/* sun */}
          <g className="animate-kid-float" style={{ animationDelay: '0.6s' }}>
            <circle cx="836" cy="58" r="50" fill="#FFD93C" opacity="0.25" />
            <circle cx="836" cy="58" r="34" fill="#FFD93C" />
            <circle cx="826" cy="48" r="10" fill="#FFE89A" opacity="0.9" />
          </g>

          {/* clouds */}
          <g className="animate-kid-float" style={{ animationDelay: '1.4s' }} opacity="0.9">
            <ellipse cx="180" cy="62" rx="46" ry="18" fill="#FFFFFF" />
            <ellipse cx="216" cy="56" rx="34" ry="15" fill="#FFFFFF" />
            <ellipse cx="146" cy="56" rx="28" ry="13" fill="#FFFFFF" />
          </g>
          <g className="animate-kid-float" style={{ animationDelay: '2.6s' }} opacity="0.8">
            <ellipse cx="560" cy="40" rx="38" ry="15" fill="#FFFFFF" />
            <ellipse cx="590" cy="35" rx="28" ry="12" fill="#FFFFFF" />
          </g>

          {/* meadow sparkles scale with overall mastery */}
          {Array.from({ length: meadowSparkles }).map((_, i) => (
            <Sparkle
              key={i}
              x={90 + ((i * 173) % 740)}
              y={70 + ((i * 97) % 150)}
              delay={`${i * 0.5}s`}
              scale={0.7 + (i % 3) * 0.25}
            />
          ))}

          {/* soil */}
          <rect x="0" y={SOIL_TOP} width="920" height={340 - SOIL_TOP} fill="url(#garden-soil)" />
          <rect x="0" y={SOIL_TOP} width="920" height="10" fill="#B08050" opacity="0.7" />
          {/* grass tufts */}
          {Array.from({ length: 14 }).map((_, i) => {
            const gx = 30 + i * 64;
            return (
              <path
                key={i}
                d={`M ${gx} ${SOIL_TOP + 4} q 3 -12 6 0 M ${gx + 9} ${SOIL_TOP + 4} q 3 -15 6 0`}
                stroke={LEAF_DARK}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {flowers.map((f, i) => (
            <Flower
              key={f.island.subjectCode}
              x={f.x}
              stage={f.stage}
              color={f.island.color}
              accent={f.island.accent}
              index={i}
            />
          ))}

          {/* butterflies dance over full blooms */}
          {butterflies.map((f, i) => (
            <Butterfly
              key={f.island.subjectCode}
              x={f.x + (i % 2 === 0 ? 34 : -34)}
              y={SOIL_TOP - STEM_HEIGHTS[4] - 44 - (i % 2) * 18}
              color={i % 2 === 0 ? '#FF8FAB' : '#9B7EDE'}
              delay={`${i * 0.9}s`}
            />
          ))}
        </svg>

        {/* subject legend: 18px+ labels, no emoji */}
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-2" aria-label="Garden beds by subject">
          {flowers.map((f) => (
            <li
              key={f.island.subjectCode}
              className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow"
              aria-label={`${f.island.subjectName}: ${f.mastered} of ${f.total} skills blooming`}
            >
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: f.island.color }}
                aria-hidden="true"
              />
              <span className="text-lg font-extrabold text-kid-ink-900">{f.island.subjectName}</span>
              <span className="text-base font-bold text-kid-ink-700">
                {f.mastered}/{f.total}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
