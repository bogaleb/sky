'use client';

import { AVATARS } from '@/components/avatars';

/**
 * SkyBackdrop — the ambient animated background of the redesigned kid world.
 *
 * A fixed, pointer-transparent layer: aurora/mesh gradient blobs drifting
 * slowly, twinkling stars, drifting clouds, and tiny avatar cameos floating
 * at the edges. Rendered behind everything (z-0); kid content sits at z-10+.
 *
 * Reduced motion: all animation is disabled and the scene falls back to
 * static gradients (see the Wave 8 block in globals.css).
 */

interface StarSpec {
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

/** Deterministic star field — static array avoids hydration flicker. */
const STARS: StarSpec[] = [
  { left: '6%', top: '12%', size: 14, delay: 0, duration: 2.4, color: '#FFE66D' },
  { left: '14%', top: '58%', size: 10, delay: 0.6, duration: 3.1, color: '#FFFFFF' },
  { left: '21%', top: '28%', size: 18, delay: 1.1, duration: 2.8, color: '#FFE66D' },
  { left: '30%', top: '8%', size: 10, delay: 0.3, duration: 3.4, color: '#FFFFFF' },
  { left: '38%', top: '66%', size: 12, delay: 1.6, duration: 2.6, color: '#FFD9E8' },
  { left: '46%', top: '18%', size: 16, delay: 0.9, duration: 3.0, color: '#FFE66D' },
  { left: '55%', top: '6%', size: 10, delay: 1.9, duration: 2.5, color: '#FFFFFF' },
  { left: '62%', top: '44%', size: 14, delay: 0.4, duration: 3.2, color: '#FFE66D' },
  { left: '70%', top: '14%', size: 18, delay: 1.3, duration: 2.7, color: '#FFFFFF' },
  { left: '78%', top: '62%', size: 12, delay: 0.7, duration: 3.3, color: '#FFE66D' },
  { left: '84%', top: '30%', size: 10, delay: 1.7, duration: 2.9, color: '#FFFFFF' },
  { left: '90%', top: '10%', size: 16, delay: 0.2, duration: 3.1, color: '#FFE66D' },
  { left: '94%', top: '52%', size: 12, delay: 1.0, duration: 2.6, color: '#FFD9E8' },
  { left: '10%', top: '82%', size: 12, delay: 0.5, duration: 3.0, color: '#FFFFFF' },
  { left: '26%', top: '88%', size: 14, delay: 1.4, duration: 2.8, color: '#FFE66D' },
  { left: '48%', top: '80%', size: 10, delay: 0.8, duration: 3.2, color: '#FFFFFF' },
  { left: '66%', top: '86%', size: 16, delay: 1.2, duration: 2.5, color: '#FFE66D' },
  { left: '82%', top: '78%', size: 10, delay: 1.8, duration: 3.4, color: '#FFFFFF' },
  { left: '36%', top: '40%', size: 9, delay: 2.0, duration: 2.7, color: '#FFFFFF' },
  { left: '58%', top: '26%', size: 9, delay: 2.2, duration: 3.0, color: '#FFD9E8' },
];

interface CloudSpec {
  top: string;
  scale: number;
  duration: number;
  delay: number;
  opacity: number;
}

const CLOUDS: CloudSpec[] = [
  { top: '10%', scale: 1.0, duration: 74, delay: -18, opacity: 0.85 },
  { top: '26%', scale: 0.65, duration: 104, delay: -52, opacity: 0.65 },
  { top: '48%', scale: 0.45, duration: 128, delay: -80, opacity: 0.5 },
];

/** Tiny avatar cameos drifting at the screen edges. */
const CAMEOS = [
  { id: 'curio', left: '3%', top: '38%', size: 'h-20 w-20', delay: 0 },
  { id: 'tuno', left: '90%', top: '64%', size: 'h-[76px] w-[76px]', delay: 2.4 },
  { id: 'bea', left: '86%', top: '8%', size: 'h-16 w-16', delay: 4.6 },
];

function BackdropStar({ star }: { star: StarSpec }) {
  return (
    <div
      className="pointer-events-none absolute animate-kid-twinkle"
      style={{
        left: star.left,
        top: star.top,
        animationDelay: `${star.delay}s`,
        animationDuration: `${star.duration}s`,
      }}
    >
      <svg width={star.size} height={star.size} viewBox="0 0 24 24" fill={star.color} aria-hidden>
        <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
      </svg>
    </div>
  );
}

function BackdropCloud({ cloud }: { cloud: CloudSpec }) {
  return (
    <div
      className="pointer-events-none absolute animate-kid-drift"
      style={{
        top: cloud.top,
        animationDuration: `${cloud.duration}s`,
        animationDelay: `${cloud.delay}s`,
        opacity: cloud.opacity,
      }}
    >
      <svg width={180 * cloud.scale} height={90 * cloud.scale} viewBox="0 0 180 90" fill="white" aria-hidden>
        <ellipse cx="60" cy="55" rx="42" ry="26" />
        <ellipse cx="100" cy="42" rx="36" ry="30" />
        <ellipse cx="132" cy="58" rx="30" ry="20" />
      </svg>
    </div>
  );
}

export default function SkyBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Base day-sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #5ECBF2 0%, #8FDDF9 30%, #C9EFFC 55%, #FDEFD3 82%, #FFF7E6 100%)',
        }}
      />

      {/* Aurora / mesh gradient blobs — slowly drifting */}
      <div
        className="absolute -left-[12%] -top-[14%] h-[58vmax] w-[58vmax] rounded-full opacity-55 blur-3xl animate-kid-aurora"
        style={{ background: 'radial-gradient(circle, rgba(255,138,122,0.75) 0%, transparent 68%)' }}
      />
      <div
        className="absolute -right-[14%] top-[8%] h-[52vmax] w-[52vmax] rounded-full opacity-50 blur-3xl animate-kid-aurora"
        style={{
          background: 'radial-gradient(circle, rgba(79,216,196,0.7) 0%, transparent 68%)',
          animationDelay: '-9s',
        }}
      />
      <div
        className="absolute -bottom-[18%] left-[22%] h-[60vmax] w-[60vmax] rounded-full opacity-45 blur-3xl animate-kid-aurora"
        style={{
          background: 'radial-gradient(circle, rgba(185,131,255,0.65) 0%, transparent 68%)',
          animationDelay: '-17s',
        }}
      />
      <div
        className="absolute -left-[8%] bottom-[6%] h-[40vmax] w-[40vmax] rounded-full opacity-40 blur-3xl animate-kid-aurora"
        style={{
          background: 'radial-gradient(circle, rgba(255,217,104,0.7) 0%, transparent 68%)',
          animationDelay: '-5s',
        }}
      />

      {/* Twinkling stars */}
      {STARS.map((star, i) => (
        <BackdropStar key={i} star={star} />
      ))}

      {/* Drifting clouds */}
      {CLOUDS.map((cloud, i) => (
        <BackdropCloud key={i} cloud={cloud} />
      ))}

      {/* Avatar cameos */}
      {CAMEOS.map((cameo) => {
        const Avatar = AVATARS[cameo.id]?.Component;
        if (!Avatar) return null;
        return (
          <div
            key={cameo.id}
            className="pointer-events-none absolute animate-kid-float-slow opacity-90"
            style={{ left: cameo.left, top: cameo.top, animationDelay: `${cameo.delay}s` }}
          >
            <Avatar className={cameo.size} />
          </div>
        );
      })}
    </div>
  );
}
