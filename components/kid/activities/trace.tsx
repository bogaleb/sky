'use client';

import { useEffect, useRef, useState } from 'react';
import { playSfx } from '@/lib/kid/audio';

export interface TraceRendererProps {
  target: string;
  onCommit: (answer: { coverage: number; seconds: number }) => void;
  locked: boolean;
}

const W = 720;
const H = 380;

/** Draw the dotted guide for a target onto a context. */
function drawGuide(ctx: CanvasRenderingContext2D, target: string) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#2A9FD8';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.setLineDash([2, 20]);
  const t = target.trim().toLowerCase();
  if (t === 'big tall line') {
    ctx.beginPath();
    ctx.moveTo(W / 2, 50);
    ctx.lineTo(W / 2, H - 50);
    ctx.stroke();
  } else if (t === 'circle' || t === 'sun') {
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 110, 0, Math.PI * 2);
    ctx.stroke();
    if (t === 'sun') {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 + Math.cos(a) * 140, H / 2 + Math.sin(a) * 140);
        ctx.lineTo(W / 2 + Math.cos(a) * 175, H / 2 + Math.sin(a) * 175);
        ctx.stroke();
      }
    }
  } else {
    const word = target.trim();
    const size = word.length <= 1 ? 240 : word.length <= 3 ? 170 : 120;
    ctx.font = `900 ${size}px "Avenir Next", "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(word, W / 2, H / 2 + 8);
  }
  ctx.restore();
}

/**
 * Finger-tracing on canvas. The dotted guide is rasterized to a mask;
 * coverage = share of guide pixels the child actually painted over.
 * A live ink meter gamifies the tracing.
 */
export default function TraceRenderer({ target, onCommit, locked }: TraceRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<Uint8ClampedArray | null>(null);
  const targetPixelCount = useRef(1);
  const coveredRef = useRef<Uint8Array | null>(null);
  const coveredCount = useRef(0);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const startTime = useRef<number | null>(null);
  const [coverage, setCoverage] = useState(0);
  const [started, setStarted] = useState(false);

  // Build the guide + mask once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    drawGuide(ctx, target);
    const img = ctx.getImageData(0, 0, W, H);
    const mask = new Uint8ClampedArray(W * H);
    let count = 0;
    // Dilate: a guide pixel counts if within ~14px of a drawn dot.
    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const a = img.data[(y * W + x) * 4 + 3];
        if (a > 40) {
          for (let dy = -7; dy <= 7; dy += 2) {
            for (let dx = -7; dx <= 7; dx += 2) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < W && ny < H && !mask[ny * W + nx]) {
                mask[ny * W + nx] = 1;
                count++;
              }
            }
          }
        }
      }
    }
    maskRef.current = mask;
    targetPixelCount.current = Math.max(count, 1);
    coveredRef.current = new Uint8Array(W * H);
    coveredCount.current = 0;

    // Paint a soft paper background under the guide.
    const bg = ctx.getImageData(0, 0, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 36);
    ctx.fill();
    ctx.putImageData(bg, 0, 0);
    drawGuide(ctx, target);
  }, [target]);

  const pos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  };

  const stamp = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const mask = maskRef.current;
    const covered = coveredRef.current;
    if (!canvas || !ctx || !mask || !covered) return;

    // Paint the child's stroke: chunky rainbow crayon.
    const hue = (coveredCount.current / 40) % 360;
    ctx.save();
    ctx.strokeStyle = `hsl(${hue}, 85%, 55%)`;
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    if (last.current) {
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.1, y + 0.1);
    }
    ctx.stroke();
    ctx.restore();

    // Mark coverage along the segment.
    const steps = 8;
    for (let s = 0; s <= steps; s++) {
      const px = Math.round((last.current?.x ?? x) + ((x - (last.current?.x ?? x)) * s) / steps);
      const py = Math.round((last.current?.y ?? y) + ((y - (last.current?.y ?? y)) * s) / steps);
      for (let dy = -13; dy <= 13; dy += 3) {
        for (let dx = -13; dx <= 13; dx += 3) {
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const idx = ny * W + nx;
          if (mask[idx] && !covered[idx]) {
            covered[idx] = 1;
            coveredCount.current++;
          }
        }
      }
    }
    last.current = { x, y };
    const c = Math.min(1, coveredCount.current / targetPixelCount.current);
    setCoverage(c);
  };

  const down = (e: React.PointerEvent) => {
    if (locked) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = null;
    if (startTime.current === null) {
      startTime.current = Date.now();
      setStarted(true);
    }
    playSfx('click');
    stamp(pos(e).x, pos(e).y);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || locked) return;
    const p = pos(e);
    stamp(p.x, p.y);
  };

  const up = () => {
    drawing.current = false;
    last.current = null;
  };

  const done = () => {
    const seconds = startTime.current ? Math.max(1, Math.round((Date.now() - startTime.current) / 1000)) : 3;
    playSfx('whoosh');
    onCommit({ coverage: Math.round(coverage * 100) / 100, seconds });
  };

  const pct = Math.round(coverage * 100);

  return (
    <div className="flex w-full max-w-3xl flex-col items-center">
      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="w-full touch-none select-none rounded-kid-card border-4 border-white/70 shadow-[0_18px_40px_rgba(23,50,79,0.2)]"
          style={{ cursor: 'crosshair' }}
          role="img"
          aria-label={target ? `Trace the ${target}. Touch and drag your finger along the dots.` : 'Draw freely on the canvas. Touch and drag your finger.'}
        />
        {!started && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="animate-kid-bounce-soft rounded-full bg-kid-ink-900/70 px-6 py-3 text-xl font-extrabold text-white">
              {target ? 'Touch and draw along the dots!' : 'Touch and draw!'}
            </span>
          </div>
        )}
      </div>

      {/* Ink meter */}
      <div className="mt-4 w-full max-w-md" aria-label={`Traced ${pct} percent`}>
        <div className="h-6 overflow-hidden rounded-full bg-white/60 shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #4CC9F0, #9B5DE5, #F15BB5)',
            }}
          />
        </div>
        <p className="mt-1 text-center text-lg font-extrabold text-kid-ink-700">{pct}% traced</p>
      </div>

      <button
        type="button"
        disabled={locked || !started}
        onClick={done}
        className="mt-4 rounded-kid-card border-b-8 border-kid-mint-600 bg-kid-mint-500 px-12 py-5 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:saturate-50"
      >
        I traced it!
      </button>
    </div>
  );
}
