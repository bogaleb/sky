'use client';

import { useEffect, useMemo, useRef } from 'react';

/**
 * Design-system fallback for the Wave 8 "Mesmerizing" redesign.
 *
 * Track A builds the real design core (`./sky-backdrop`, `lib/kid/design.ts`,
 * and the `.glass-kid` / `.btn-kid` / `.card-kid` / `.font-display` styles in
 * globals.css) in parallel. Until it lands, this module provides the same
 * contract names so the map redesign renders beautifully and nothing breaks.
 *
 * INTEGRATOR: when `./sky-backdrop` exists, swap the `SkyBackdrop` import in
 * session-player.tsx to it and delete this file.
 */

const FALLBACK_CSS = `
.font-display{font-family:"Fredoka","Nunito",ui-rounded,system-ui,sans-serif;letter-spacing:.01em}
.glass-kid{background:rgba(255,255,255,.55);backdrop-filter:blur(18px) saturate(1.35);-webkit-backdrop-filter:blur(18px) saturate(1.35);border:1px solid rgba(255,255,255,.75);border-radius:1.75rem;box-shadow:0 24px 50px -20px rgba(23,50,79,.38),inset 0 1px 0 rgba(255,255,255,.8)}
.card-kid{background:rgba(255,255,255,.74);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.85);border-radius:1.5rem;box-shadow:0 18px 38px -18px rgba(23,50,79,.38),inset 0 1px 0 rgba(255,255,255,.9)}
.btn-kid{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.4rem;border-radius:1.5rem;padding:1.15rem .75rem;font-weight:900;color:#fff;border:0;border-bottom:6px solid rgba(0,0,0,.16);box-shadow:0 16px 30px -14px rgba(23,50,79,.45);cursor:pointer;transition:transform .28s ease,box-shadow .28s ease,filter .28s ease;text-align:center}
.btn-kid:hover{transform:translateY(-4px) scale(1.03);filter:brightness(1.07) saturate(1.08);box-shadow:0 24px 46px -14px rgba(23,50,79,.5),0 0 36px rgba(255,255,255,.55)}
.btn-kid:active{transform:translateY(0) scale(.97)}
.btn-kid-coral{background:linear-gradient(160deg,#FF9E6B 0%,#F65D5D 100%)}
.btn-kid-sky{background:linear-gradient(160deg,#5ED3F5 0%,#2B8FD9 100%)}
.btn-kid-mint{background:linear-gradient(160deg,#6FDCAC 0%,#2FA37C 100%)}
.btn-kid-grape{background:linear-gradient(160deg,#BE93F0 0%,#7C5CBF 100%)}
@media (prefers-reduced-motion:reduce){.btn-kid,.btn-kid:hover,.btn-kid:active{transition:none;transform:none}}
`;

/**
 * Injects minimal definitions for the design-contract classes, but ONLY when
 * the real design system is absent (detected via computed style on a probe).
 * When Track A's globals.css defines them, this stays completely dormant.
 */
export function DesignFallbackStyles() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    let missing = true;
    try {
      const probe = document.createElement('div');
      probe.className = 'glass-kid';
      probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      const bg = cs.backgroundColor.replace(/\s/g, '');
      missing = cs.backdropFilter === 'none' && (bg === 'rgba(0,0,0,0)' || bg === 'transparent');
      probe.remove();
    } catch {
      missing = true;
    }
    if (missing && !document.querySelector('style[data-sky-design-fallback]')) {
      const el = document.createElement('style');
      el.setAttribute('data-sky-design-fallback', 'true');
      el.textContent = FALLBACK_CSS;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

type Star = { left: string; top: string; size: number; delay: string; duration: string };

/**
 * Mesmerizing ambient background for the map: dreamy gradient sky, drifting
 * aurora blobs, twinkling stars, a soft sun glow, and slow clouds.
 * Decorative only — pointer-events-none, aria-hidden, reduced-motion safe.
 */
export default function SkyBackdrop() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: `${(i * 37.7 + 11) % 100}%`,
        top: `${(i * 53.3 + 7) % 55}%`,
        size: 2 + ((i * 7) % 4),
        delay: `${(i * 0.53) % 4}s`,
        duration: `${2.4 + ((i * 13) % 30) / 10}s`,
      })),
    []
  );
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* dreamy base sky */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#31497E_0%,#4A7FC2_28%,#7FB6E4_55%,#C4E4F5_78%,#FDF0D3_100%)]" />
      {/* aurora blobs */}
      <div className="absolute -left-32 top-1/4 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(190,147,240,0.5),transparent_65%)] blur-3xl motion-safe:animate-kid-drift" />
      <div
        className="absolute -right-40 top-1/2 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(94,211,245,0.45),transparent_65%)] blur-3xl motion-safe:animate-kid-drift"
        style={{ animationDuration: '95s', animationDelay: '-40s' }}
      />
      <div
        className="absolute left-1/3 top-2/3 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(255,217,60,0.28),transparent_65%)] blur-3xl motion-safe:animate-kid-drift"
        style={{ animationDuration: '120s', animationDelay: '-70s' }}
      />
      {/* sun glow */}
      <div className="absolute -top-24 right-[8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,240,200,0.9),rgba(255,220,130,0.35)_55%,transparent_70%)] blur-2xl" />
      {/* twinkling stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white motion-safe:animate-kid-twinkle"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.duration, opacity: 0.85 }}
        />
      ))}
      {/* slow drifting clouds */}
      <div className="absolute top-[16%] left-0 w-full opacity-70 motion-safe:animate-kid-drift" style={{ animationDuration: '110s' }}>
        <svg width="220" height="110" viewBox="0 0 180 90" fill="white" opacity="0.8">
          <ellipse cx="60" cy="55" rx="42" ry="26" />
          <ellipse cx="100" cy="42" rx="36" ry="30" />
          <ellipse cx="132" cy="58" rx="30" ry="20" />
        </svg>
      </div>
      <div
        className="absolute top-[58%] left-0 w-full opacity-50 motion-safe:animate-kid-drift"
        style={{ animationDuration: '150s', animationDelay: '-60s' }}
      >
        <svg width="160" height="80" viewBox="0 0 180 90" fill="white" opacity="0.7">
          <ellipse cx="60" cy="55" rx="42" ry="26" />
          <ellipse cx="100" cy="42" rx="36" ry="30" />
          <ellipse cx="132" cy="58" rx="30" ry="20" />
        </svg>
      </div>
      {/* soft vignette to keep foreground readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(23,50,79,0.18)_100%)]" />
    </div>
  );
}
