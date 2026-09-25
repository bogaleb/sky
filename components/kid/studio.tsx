'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  STAMPS,
  COLORING_PAGES,
  loadGallery,
  saveArtwork,
  deleteArtwork,
  newArtworkId,
  shouldAwardDailyStars,
  markDailyStarsAwarded,
  STUDIO_DAILY_STAR_BONUS,
  formatArtDate,
  type StudioArtwork,
  type ColoringPage,
  type ColoringRegion,
} from '@/lib/kid/studio';
import { speakAs, playSfx, stopSpeaking } from '@/lib/kid/audio';
import { awardStars, awardStickers } from '@/app/actions/rewards';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import KidShell from '@/components/kid/kid-shell';
import HostCharacter from '@/components/kid/host-character';

export interface CreativeStudioProps {
  childId: string;
  nickname?: string;
  onExit?: () => void;
}

type Tab = 'draw' | 'color' | 'gallery';

const STUDIO_HOST = 'curio';
const PAPER = '#FFFDF8';
const INK = '#17324F';
const CANVAS_W = 480;
const CANVAS_H = 360;
const MAX_STROKES = 30;

const PALETTE: Array<{ id: string; hex: string }> = [
  { id: 'red', hex: '#EF4444' },
  { id: 'orange', hex: '#FB923C' },
  { id: 'yellow', hex: '#FACC15' },
  { id: 'green', hex: '#22C55E' },
  { id: 'blue', hex: '#3B82F6' },
  { id: 'purple', hex: '#A855F7' },
  { id: 'pink', hex: '#EC8899' },
  { id: 'brown', hex: '#92400E' },
];

const BRUSH_SIZES = [
  { id: 'small', px: 6, label: 'Thin' },
  { id: 'medium', px: 12, label: 'Medium' },
  { id: 'large', px: 22, label: 'Thick' },
];

// ---------------------------------------------------------------------------
// Canvas stamp painters (drawn with the currently selected color).
// ---------------------------------------------------------------------------

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

type StampPainter = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) => void;

const STAMP_PAINTERS: Record<string, StampPainter> = {
  star: (ctx, x, y, s, c) => {
    starPath(ctx, x, y, s);
    ctx.fillStyle = c;
    ctx.fill();
  },
  heart: (ctx, x, y, s, c) => {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.7, y - s, x + s * 1.3, y, x, y + s * 0.9);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();
  },
  flower: (ctx, x, y, s, c) => {
    ctx.fillStyle = c;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(x, y, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
  },
  fish: (ctx, x, y, s, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y, s, s * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.8, y);
    ctx.lineTo(x + s * 1.5, y - s * 0.6);
    ctx.lineTo(x + s * 1.5, y + s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - s * 0.4, y - s * 0.15, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x - s * 0.4, y - s * 0.15, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  },
  rocket: (ctx, x, y, s, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.55, s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.5, y + s * 0.4);
    ctx.lineTo(x - s * 1.0, y + s * 1.0);
    ctx.lineTo(x - s * 0.35, y + s * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.5, y + s * 0.4);
    ctx.lineTo(x + s * 1.0, y + s * 1.0);
    ctx.lineTo(x + s * 0.35, y + s * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#BEE3F8';
    ctx.beginPath();
    ctx.arc(x, y - s * 0.25, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.3, y + s * 0.9);
    ctx.lineTo(x, y + s * 1.5);
    ctx.lineTo(x + s * 0.3, y + s * 0.9);
    ctx.closePath();
    ctx.fill();
  },
  moon: (ctx, x, y, s, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(x + s * 0.45, y - s * 0.2, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
  },
  sun: (ctx, x, y, s, c) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = Math.max(2, s * 0.18);
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * s * 1.15, y + Math.sin(a) * s * 1.15);
      ctx.lineTo(x + Math.cos(a) * s * 1.6, y + Math.sin(a) * s * 1.6);
      ctx.stroke();
    }
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(x, y, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
  },
  cloud: (ctx, x, y, s, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x - s * 0.7, y + s * 0.2, s * 0.5, 0, Math.PI * 2);
    ctx.arc(x - s * 0.15, y - s * 0.15, s * 0.65, 0, Math.PI * 2);
    ctx.arc(x + s * 0.55, y + s * 0.05, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - s * 1.15, y + s * 0.05, s * 2.3, s * 0.6);
  },
  tree: (ctx, x, y, s, c) => {
    ctx.fillStyle = '#8B5E34';
    ctx.fillRect(x - s * 0.12, y + s * 0.4, s * 0.24, s * 0.7);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.2);
    ctx.lineTo(x + s * 0.7, y - s * 0.2);
    ctx.lineTo(x - s * 0.7, y - s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.7);
    ctx.lineTo(x + s * 0.85, y + s * 0.35);
    ctx.lineTo(x - s * 0.85, y + s * 0.35);
    ctx.closePath();
    ctx.fill();
  },
  balloon: (ctx, x, y, s, c) => {
    ctx.strokeStyle = '#8B8B9E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.quadraticCurveTo(x + s * 0.3, y + s * 1.3, x, y + s * 1.7);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.75, s * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(x - s * 0.25, y - s * 0.3, s * 0.2, s * 0.32, -0.4, 0, Math.PI * 2);
    ctx.fill();
  },
};

/** Small SVG glyphs for the stamp picker buttons. */
function StampIcon({ id, color }: { id: string; color: string }) {
  const common = { fill: color, 'aria-hidden': true } as const;
  switch (id) {
    case 'star':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          <polygon points="24,6 29,18 42,18 31,26 35,39 24,31 13,39 17,26 6,18 19,18" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          <path d="M24 40 C10 28 6 20 10 14 C14 8 22 10 24 16 C26 10 34 8 38 14 C42 20 38 28 24 40 Z" />
        </svg>
      );
    case 'flower':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return <circle key={deg} cx={24 + Math.cos(a) * 10} cy={24 + Math.sin(a) * 10} r="8" />;
          })}
          <circle cx="24" cy="24" r="7" fill="#FACC15" />
        </svg>
      );
    case 'fish':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          <ellipse cx="20" cy="24" rx="12" ry="8" />
          <polygon points="30,24 42,15 42,33" />
        </svg>
      );
    case 'rocket':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          <ellipse cx="24" cy="20" rx="8" ry="14" />
          <polygon points="17,30 10,42 20,36" />
          <polygon points="31,30 38,42 28,36" />
          <polygon points="20,34 24,44 28,34" fill="#FB923C" />
        </svg>
      );
    case 'moon':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          <path d="M32 6 A17 17 0 1 0 32 42 A13.5 13.5 0 1 1 32 6 Z" />
        </svg>
      );
    case 'sun':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={24 + Math.cos(a) * 15}
                y1={24 + Math.sin(a) * 15}
                x2={24 + Math.cos(a) * 21}
                y2={24 + Math.sin(a) * 21}
                stroke={color}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx="24" cy="24" r="11" fill="#FACC15" />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          <ellipse cx="18" cy="28" rx="9" ry="7" />
          <ellipse cx="28" cy="22" rx="10" ry="8" />
          <ellipse cx="34" cy="29" rx="7" ry="6" />
        </svg>
      );
    case 'tree':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          <polygon points="24,6 34,22 14,22" />
          <polygon points="24,16 37,34 11,34" />
          <rect x="21" y="34" width="6" height="9" fill="#8B5E34" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" {...common}>
          <ellipse cx="24" cy="18" rx="11" ry="13" />
          <polygon points="24,31 21,36 27,36" />
          <path d="M24 36 Q28 42 24 46" stroke="#8B8B9E" strokeWidth="2.5" fill="none" />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function ColorPalette({ color, onPick }: { color: string; onPick: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2" role="radiogroup" aria-label="Paint colors">
      {PALETTE.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={color === c.hex}
          aria-label={`${c.id} paint`}
          onClick={() => {
            playSfx('click');
            onPick(c.hex);
          }}
          className={`h-14 w-14 rounded-full border-4 shadow-md transition-transform hover:scale-110 active:scale-95 ${
            color === c.hex ? 'scale-110 border-kid-ink-900' : 'border-white'
          }`}
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`flex min-h-[56px] min-w-[56px] items-center justify-center gap-2 rounded-kid-card px-4 py-2 text-base font-black shadow-md transition-transform hover:scale-105 active:scale-95 ${
        active ? 'bg-kid-ink-900 text-white' : 'bg-white text-kid-ink-900'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Draw tab
// ---------------------------------------------------------------------------

type DrawStroke =
  | { type: 'path'; points: Array<{ x: number; y: number }>; color: string; size: number; eraser: boolean }
  | { type: 'stamp'; stampId: string; x: number; y: number; size: number; color: string };

function paintStrokes(ctx: CanvasRenderingContext2D, strokes: DrawStroke[]) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (const st of strokes) {
    if (st.type === 'path') {
      ctx.strokeStyle = st.eraser ? PAPER : st.color;
      ctx.fillStyle = st.eraser ? PAPER : st.color;
      ctx.lineWidth = st.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (st.points.length === 1) {
        const p = st.points[0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, st.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (st.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(st.points[0].x, st.points[0].y);
        for (let i = 1; i < st.points.length; i++) ctx.lineTo(st.points[i].x, st.points[i].y);
        ctx.stroke();
      }
    } else {
      const painter = STAMP_PAINTERS[st.stampId];
      if (painter) painter(ctx, st.x, st.y, st.size, st.color);
    }
  }
}

function DrawTab({
  color,
  onPickColor,
  onSave,
}: {
  color: string;
  onPickColor: (hex: string) => void;
  onSave: (kind: 'draw', dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'brush' | 'stamp' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(12);
  const [stampId, setStampId] = useState(STAMPS[0].id);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const activeStroke = useRef<DrawStroke | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref mirror so pointer handlers always see fresh strokes.
  const strokesRef = useRef<DrawStroke[]>([]);
  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const live = activeStroke.current ? [...strokesRef.current, activeStroke.current] : strokesRef.current;
    paintStrokes(ctx, live);
  }, []);

  // Initial paper.
  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const posFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const commitStroke = (st: DrawStroke) => {
    const next = [...strokesRef.current, st].slice(-MAX_STROKES);
    strokesRef.current = next;
    setStrokes(next);
    activeStroke.current = null;
    render();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    const p = posFromEvent(e);
    if (tool === 'stamp') {
      playSfx('pop');
      commitStroke({ type: 'stamp', stampId, x: p.x, y: p.y, size: brushSize * 2.4, color });
      return;
    }
    activeStroke.current = {
      type: 'path',
      points: [p],
      color,
      size: brushSize,
      eraser: tool === 'eraser',
    };
    render();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = activeStroke.current;
    if (!st || st.type !== 'path') return;
    const p = posFromEvent(e);
    const last = st.points[st.points.length - 1];
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (dx * dx + dy * dy < 4) return;
    st.points.push(p);
    render();
  };

  const handlePointerUp = () => {
    const st = activeStroke.current;
    if (st && st.type === 'path' && st.points.length > 0) commitStroke(st);
    else activeStroke.current = null;
  };

  const undo = () => {
    if (strokesRef.current.length === 0) return;
    playSfx('click');
    const next = strokesRef.current.slice(0, -1);
    strokesRef.current = next;
    setStrokes(next);
    render();
  };

  const clearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      playSfx('click');
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setConfirmClear(false);
    playSfx('whoosh');
    strokesRef.current = [];
    setStrokes([]);
    render();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokesRef.current.length === 0) {
      speakAs(STUDIO_HOST, 'Draw something first, then tap Save!');
      return;
    }
    playSfx('pop');
    onSave('draw', canvas.toDataURL('image/png'));
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full touch-none rounded-kid-card border-4 border-white shadow-xl"
        style={{ aspectRatio: '4 / 3', backgroundColor: PAPER }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="Drawing canvas. Draw with your finger or mouse."
      />
      <ColorPalette color={color} onPick={onPickColor} />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ToolButton active={tool === 'brush'} onClick={() => { playSfx('click'); setTool('brush'); }} label="Brush tool">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M4 20 L14 10 M14 10 L18 4 L20 6 L14 12" />
            <path d="M4 20 q-1 1 1 1 q2 0 1 -1" />
          </svg>
          Brush
        </ToolButton>
        <ToolButton active={tool === 'stamp'} onClick={() => { playSfx('click'); setTool('stamp'); }} label="Stamp tool">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
            <polygon points="12,3 14.5,9 21,9 16,13 17.5,19 12,15.5 6.5,19 8,13 3,9 9.5,9" />
          </svg>
          Stamps
        </ToolButton>
        <ToolButton active={tool === 'eraser'} onClick={() => { playSfx('click'); setTool('eraser'); }} label="Eraser tool">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 19 L14 12 L19 17 L12 21 L8 21 Z" />
            <path d="M14 12 L17 9 L20 12" />
          </svg>
          Eraser
        </ToolButton>
        <ToolButton onClick={undo} label="Undo last stroke">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 7 L4 11 L8 15" />
            <path d="M4 11 H14 A6 6 0 0 1 14 23 H10" />
          </svg>
          Undo
        </ToolButton>
        <ToolButton onClick={clearAll} label={confirmClear ? 'Tap again to clear everything' : 'Clear the whole drawing'}>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 7 H19 M9 7 V5 H15 V7 M8 7 L9 20 H15 L16 7" />
          </svg>
          {confirmClear ? 'Tap again!' : 'Clear'}
        </ToolButton>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2" role="radiogroup" aria-label="Brush size">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={brushSize === b.px}
            aria-label={`${b.label} brush`}
            onClick={() => {
              playSfx('click');
              setBrushSize(b.px);
            }}
            className={`flex h-14 min-w-[64px] items-center justify-center rounded-kid-card px-3 shadow-md transition-transform hover:scale-105 active:scale-95 ${
              brushSize === b.px ? 'bg-kid-ink-900' : 'bg-white'
            }`}
          >
            <span
              className="rounded-full"
              style={{ width: b.px, height: b.px, backgroundColor: brushSize === b.px ? '#fff' : INK }}
            />
          </button>
        ))}
      </div>
      {tool === 'stamp' && (
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-kid-card bg-white/70 p-3 shadow-inner" role="radiogroup" aria-label="Stamps">
          {STAMPS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={stampId === s.id}
              aria-label={`${s.name} stamp`}
              onClick={() => {
                playSfx('click');
                setStampId(s.id);
              }}
              className={`flex h-16 w-16 items-center justify-center rounded-kid-card shadow-md transition-transform hover:scale-110 active:scale-95 ${
                stampId === s.id ? 'bg-kid-sun-300 ring-4 ring-kid-ink-900' : 'bg-white'
              }`}
            >
              <StampIcon id={s.id} color={color} />
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={save}
        className="rounded-full border-b-8 border-kid-mint-600 bg-kid-mint-500 px-12 py-4 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
      >
        Save to my gallery
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color tab
// ---------------------------------------------------------------------------

function RegionShape({
  region,
  fill,
  onPaint,
}: {
  region: ColoringRegion;
  fill: string;
  onPaint: () => void;
}) {
  const common = {
    fill,
    stroke: INK,
    strokeWidth: 3.5,
    strokeLinejoin: 'round' as const,
    style: { cursor: 'pointer' },
    onClick: onPaint,
    'data-region': region.id,
  };
  switch (region.shape) {
    case 'path':
      return <path d={region.d} {...common} />;
    case 'circle':
      return <circle cx={region.cx} cy={region.cy} r={region.r} {...common} />;
    case 'ellipse':
      return <ellipse cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} {...common} />;
    case 'rect':
      return <rect x={region.x} y={region.y} width={region.width} height={region.height} rx={4} {...common} />;
  }
}

function ColorTab({
  color,
  onPickColor,
  onSave,
}: {
  color: string;
  onPickColor: (hex: string) => void;
  onSave: (kind: 'color', dataUrl: string) => void;
}) {
  const [pageId, setPageId] = useState(COLORING_PAGES[0].id);
  const [fillsByPage, setFillsByPage] = useState<Record<string, Record<string, string>>>({});
  const [confirmReset, setConfirmReset] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const page: ColoringPage = COLORING_PAGES.find((p) => p.id === pageId) ?? COLORING_PAGES[0];
  const fills = fillsByPage[pageId] ?? {};
  const paintedCount = Object.keys(fills).length;

  const paint = (regionId: string) => {
    playSfx('pop');
    setFillsByPage((prev) => ({
      ...prev,
      [pageId]: { ...(prev[pageId] ?? {}), [regionId]: color },
    }));
  };

  const resetPage = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      playSfx('click');
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setConfirmReset(false);
    playSfx('whoosh');
    setFillsByPage((prev) => ({ ...prev, [pageId]: {} }));
  };

  const save = () => {
    const svg = svgRef.current;
    if (!svg || paintedCount === 0) {
      speakAs(STUDIO_HOST, 'Color a spot first, then tap Save!');
      return;
    }
    playSfx('pop');
    // Serialize the live SVG (fills included) — ASCII-only, so btoa is safe.
    const svgText = new XMLSerializer().serializeToString(svg);
    onSave('color', 'data:image/svg+xml;base64,' + btoa(svgText));
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full max-w-3xl gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Coloring pages">
        {COLORING_PAGES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={pageId === p.id}
            aria-label={`Color ${p.title}`}
            onClick={() => {
              playSfx('click');
              setPageId(p.id);
            }}
            className={`flex min-w-[120px] flex-col items-center gap-1 rounded-kid-card p-2 shadow-md transition-transform hover:scale-105 active:scale-95 ${
              pageId === p.id ? 'bg-kid-sun-300 ring-4 ring-kid-ink-900' : 'bg-white/80'
            }`}
          >
            <svg viewBox="0 0 200 200" className="h-16 w-16" aria-hidden="true">
              {p.regions.map((r) => (
                <RegionShape key={r.id} region={r} fill={(fillsByPage[p.id] ?? {})[r.id] ?? '#FFFFFF'} onPaint={() => {}} />
              ))}
            </svg>
            <span className="text-xs font-black text-kid-ink-900">{p.title}</span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-xl rounded-kid-card border-4 border-white bg-white shadow-xl">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          width="480"
          height="480"
          xmlns="http://www.w3.org/2000/svg"
          className="h-auto w-full"
          role="img"
          aria-label={`${page.title} coloring page. Tap a part to color it.`}
        >
          <rect x="0" y="0" width="200" height="200" fill={PAPER} />
          {page.regions.map((r) => (
            <RegionShape key={r.id} region={r} fill={fills[r.id] ?? '#FFFFFF'} onPaint={() => paint(r.id)} />
          ))}
        </svg>
      </div>

      <ColorPalette color={color} onPick={onPickColor} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <ToolButton onClick={resetPage} label={confirmReset ? 'Tap again to start over' : 'Start this page over'}>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 7 H19 M9 7 V5 H15 V7 M8 7 L9 20 H15 L16 7" />
          </svg>
          {confirmReset ? 'Tap again!' : 'Start over'}
        </ToolButton>
        <button
          type="button"
          onClick={save}
          className="rounded-full border-b-8 border-kid-mint-600 bg-kid-mint-500 px-12 py-4 text-2xl font-black text-white shadow-[0_14px_30px_rgba(23,50,79,0.25)] transition-all hover:scale-105 active:scale-95"
        >
          Save to my gallery
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery tab
// ---------------------------------------------------------------------------

function GalleryTab({ gallery, onDelete }: { gallery: StudioArtwork[]; onDelete: (id: string) => void }) {
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const viewing = gallery.find((a) => a.id === viewId) ?? null;

  const askDelete = (id: string) => {
    if (confirmId === id) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setConfirmId(null);
      playSfx('whoosh');
      onDelete(id);
      setViewId(null);
      return;
    }
    playSfx('click');
    setConfirmId(id);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setConfirmId(null), 3000);
  };

  if (gallery.length === 0) {
    return (
      <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-kid-card bg-white/70 p-8 text-center shadow-lg">
        <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label="Empty easel">
          <line x1="45" y1="30" x2="30" y2="112" stroke="#8B5E34" strokeWidth="7" strokeLinecap="round" />
          <line x1="75" y1="30" x2="90" y2="112" stroke="#8B5E34" strokeWidth="7" strokeLinecap="round" />
          <line x1="60" y1="18" x2="60" y2="40" stroke="#8B5E34" strokeWidth="7" strokeLinecap="round" />
          <rect x="34" y="34" width="52" height="44" rx="4" fill="#FFFDF8" stroke={INK} strokeWidth="3.5" />
          <circle cx="52" cy="52" r="7" fill="#FACC15" />
          <path d="M66 66 q8 -10 16 -2" stroke="#3B82F6" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="28" y="80" width="64" height="7" rx="3.5" fill="#8B5E34" />
        </svg>
        <p className="text-2xl font-black text-kid-ink-900">Your gallery is empty!</p>
        <p className="text-lg font-bold text-kid-ink-700">
          Draw a picture or color a page, then tap Save — your masterpieces will hang here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[...gallery].reverse().map((art) => (
          <button
            key={art.id}
            type="button"
            onClick={() => {
              playSfx('pop');
              setViewId(art.id);
            }}
            className="group overflow-hidden rounded-kid-card border-4 border-white bg-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label={`View artwork from ${formatArtDate(art.createdAt)}`}
          >
            <img src={art.dataUrl} alt={`Child artwork saved ${formatArtDate(art.createdAt)}`} className="aspect-square w-full object-cover" />
            <p className="bg-white px-2 py-1 text-center text-xs font-black text-kid-ink-700">
              {art.kind === 'draw' ? 'Drawing' : 'Coloring'} · {formatArtDate(art.createdAt)}
            </p>
          </button>
        ))}
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Artwork viewer"
          onClick={() => {
            setViewId(null);
            setConfirmId(null);
          }}
        >
          <div
            className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-kid-card bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewing.dataUrl}
              alt={`Child artwork saved ${formatArtDate(viewing.createdAt)}`}
              className="max-h-[60vh] w-auto max-w-full rounded-kid-card border-4 border-kid-sky-200"
            />
            <p className="text-lg font-black text-kid-ink-900">
              {viewing.kind === 'draw' ? 'Drawing' : 'Coloring'} · {formatArtDate(viewing.createdAt)}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => askDelete(viewing.id)}
                className={`min-h-[56px] rounded-full border-b-4 px-8 py-3 text-lg font-black shadow-md transition-transform hover:scale-105 active:scale-95 ${
                  confirmId === viewing.id
                    ? 'border-red-700 bg-red-500 text-white'
                    : 'border-kid-ink-700 bg-white text-kid-ink-900'
                }`}
                aria-label={confirmId === viewing.id ? 'Tap again to confirm delete' : 'Delete this artwork'}
              >
                {confirmId === viewing.id ? 'Tap again to delete' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSfx('whoosh');
                  setViewId(null);
                  setConfirmId(null);
                }}
                className="min-h-[56px] rounded-full border-b-4 border-kid-sky-600 bg-kid-sky-400 px-8 py-3 text-lg font-black text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                Back to gallery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  {
    id: 'draw',
    label: 'Draw',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M4 20 L14 10 M14 10 L18 4 L20 6 L14 12" />
      </svg>
    ),
  },
  {
    id: 'color',
    label: 'Color',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2">
        <ellipse cx="12" cy="12" rx="9" ry="7" transform="rotate(-20 12 12)" />
        <circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="13" cy="9" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="16" cy="12" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'gallery',
    label: 'My Gallery',
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.6" fill="currentColor" stroke="none" />
        <path d="M5 17 L10 12 L14 16 L17 13 L19 15" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function CreativeStudio({ childId, nickname, onExit }: CreativeStudioProps) {
  const [tab, setTab] = useState<Tab>('draw');
  const [gallery, setGallery] = useState<StudioArtwork[]>(() => loadGallery(childId));
  const [color, setColor] = useState(PALETTE[0].hex);
  const [savedFlash, setSavedFlash] = useState(false);

  // Welcome voiceover on mount; silence on unmount.
  useEffect(() => {
    const t = setTimeout(() => {
      speakAs(
        STUDIO_HOST,
        nickname
          ? `Welcome to the Creative Studio, ${nickname}! Draw a picture, color a page, or visit your gallery!`
          : 'Welcome to the Creative Studio! Draw a picture, color a page, or visit your gallery!'
      );
    }, 400);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [nickname]);

  const handleSave = useCallback(
    async (kind: 'draw' | 'color', dataUrl: string) => {
      const before = loadGallery(childId);
      const firstEver = before.length === 0;
      const item: StudioArtwork = { id: newArtworkId(), kind, dataUrl, createdAt: Date.now() };
      setGallery(saveArtwork(childId, item));
      playSfx('fanfare');
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2600);
      speakAs(
        STUDIO_HOST,
        nickname ? `Wow, ${nickname}! A masterpiece! I hung it in your gallery.` : 'Wow! A masterpiece! I hung it in your gallery.'
      );
      try {
        if (firstEver) {
          await awardStickers(childId, ['little-artist']);
          // Trophy def lands in integration; the check itself is best-effort.
          void checkTrophies(childId, 'art_done').catch(() => {});
        }
        if (shouldAwardDailyStars(childId)) {
          await awardStars(childId, STUDIO_DAILY_STAR_BONUS);
          markDailyStarsAwarded(childId);
        }
        await logLearningEvent(childId, 'milestone', {
          metadata: { kind: 'studio_art_saved', art_kind: kind },
        });
      } catch {
        /* progress logging is best-effort; the celebration still stands */
      }
      setTab('gallery');
    },
    [childId, nickname]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setGallery(deleteArtwork(childId, id));
      speakAs(STUDIO_HOST, 'All tidied up!');
    },
    [childId]
  );

  return (
    <KidShell onExit={onExit}>
      <div className="flex w-full max-w-5xl flex-col items-center px-4">
        <div className="flex items-center gap-3">
          <HostCharacter characterId={STUDIO_HOST} mood="happy" size={72} />
          <h1 className="animate-kid-rise text-center text-3xl font-black text-kid-ink-900 md:text-5xl">
            Creative Studio
          </h1>
        </div>
        <p className="animate-kid-rise mt-1 text-center text-lg font-bold text-kid-ink-700" style={{ animationDelay: '0.1s' }}>
          Draw, color, and keep your masterpieces!
        </p>

        {savedFlash && (
          <p className="animate-kid-pop-in mt-3 rounded-full bg-kid-mint-500 px-6 py-2 text-lg font-black text-white shadow-lg" role="status">
            Saved to your gallery!
          </p>
        )}

        <div className="animate-kid-rise mt-4 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '0.15s' }} role="tablist" aria-label="Studio sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                playSfx('click');
                setTab(t.id);
              }}
              className={`flex min-h-[64px] items-center gap-2 rounded-full border-b-8 px-8 py-3 text-xl font-black shadow-[0_14px_30px_rgba(23,50,79,0.2)] transition-all hover:scale-105 active:scale-95 ${
                tab === t.id
                  ? 'border-kid-sun-600 bg-kid-sun-400 text-kid-ink-900'
                  : 'border-kid-ink-700 bg-white text-kid-ink-900'
              }`}
            >
              {t.icon}
              {t.label}
              {t.id === 'gallery' && gallery.length > 0 && (
                <span className="rounded-full bg-kid-ink-900 px-2.5 py-0.5 text-sm font-black text-white" aria-label={`${gallery.length} artworks`}>
                  {gallery.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-5 w-full" role="tabpanel">
          {tab === 'draw' && <DrawTab color={color} onPickColor={setColor} onSave={handleSave} />}
          {tab === 'color' && <ColorTab color={color} onPickColor={setColor} onSave={handleSave} />}
          {tab === 'gallery' && <GalleryTab gallery={gallery} onDelete={handleDelete} />}
        </div>
      </div>
    </KidShell>
  );
}
