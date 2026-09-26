'use client';

import type { ReactNode } from 'react';

/**
 * ProgressRail — the ONE shared progress UI primitive for the kid
 * surfaces. The Adventure Trail progress, the daily quests list, and the
 * parent-set weekly goal all render their progress through this component.
 *
 * Each item is a row: optional leading art, a label + meta line, an
 * animated progress bar, a detail line, an optional call-to-action, and an
 * optional trailing badge. Hosts keep their own containers; the rail only
 * owns the shared row language so the three systems read as one family.
 *
 * Motion budget: no ambient loops here. The bar fill animates with a
 * 700ms ease (purposeful feedback when progress changes); check/star art
 * pops in once on completion.
 *
 * Kid-facing text is always >= 18px (text-lg).
 */
export interface ProgressRailCta {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Shown while disabled, e.g. "Charting your course…". */
  busyLabel?: string;
  className?: string;
}

export interface ProgressRailItem {
  id: string;
  /** Big label, e.g. "Trail progress", "Bookworm", "Weekly star jar". */
  label: string;
  /** Fraction 0..1 of the bar filled; clamped for display. */
  progress: number;
  /** Right-aligned meta text, e.g. "Quest 12 of 220" or "3/6". */
  meta?: string;
  /** Supporting line under the bar, e.g. "2 more to fill the jar!". */
  detail?: string;
  /** Completed items get the done treatment: struck label, full bar. */
  complete?: boolean;
  /** Leading art: star jar, check circle, avatar… */
  art?: ReactNode;
  /** Trailing badge: star reward, streak flame… */
  badge?: ReactNode;
  cta?: ProgressRailCta;
  /** Bar fill classes; defaults to the sun→coral gradient. */
  barClassName?: string;
}

export interface ProgressRailProps {
  items: ProgressRailItem[];
  /** Accessible name for the list. */
  label?: string;
  className?: string;
}

const DEFAULT_BAR = 'bg-gradient-to-r from-kid-sun-400 to-kid-coral-400';
const DEFAULT_CTA =
  'btn-kid btn-kid-coral mt-3 w-full';

function ProgressRailRow({ item }: { item: ProgressRailItem }) {
  const pct = Math.round(Math.min(1, Math.max(0, item.progress)) * 100);
  const ctaLabel = item.cta && item.cta.disabled && item.cta.busyLabel ? item.cta.busyLabel : item.cta?.label;
  return (
    <div role="listitem" className="flex items-center gap-4">
      {item.art && <div className="shrink-0">{item.art}</div>}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`font-display text-lg font-black ${
              item.complete ? 'text-kid-ink-400 line-through' : 'text-kid-ink-900'
            }`}
          >
            {item.label}
          </p>
          {item.meta && (
            <span className="shrink-0 text-lg font-black text-kid-ink-500">{item.meta}</span>
          )}
        </div>
        <div
          className="mt-1.5 h-3 overflow-hidden rounded-full bg-kid-sky-100"
          role="progressbar"
          aria-label={item.label}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ${item.barClassName ?? DEFAULT_BAR}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {item.detail && (
          <p className="mt-1.5 text-lg font-bold text-kid-ink-700">{item.detail}</p>
        )}
        {item.cta && (
          <button
            type="button"
            disabled={item.cta.disabled}
            onClick={item.cta.onClick}
            className={item.cta.className ?? DEFAULT_CTA}
          >
            {ctaLabel}
          </button>
        )}
      </div>
      {item.badge && <div className="shrink-0">{item.badge}</div>}
    </div>
  );
}

export default function ProgressRail({ items, label, className }: ProgressRailProps) {
  if (items.length === 0) return null;
  return (
    <div role="list" aria-label={label} className={`flex w-full flex-col gap-4 ${className ?? ''}`}>
      {items.map((item) => (
        <ProgressRailRow key={item.id} item={item} />
      ))}
    </div>
  );
}
