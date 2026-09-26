'use client';

import { useEffect, useState } from 'react';
import {
  getTimeLimitStatus,
  setDailyLimit,
  type TimeLimitStatus,
} from '@/app/actions/time-limits';
import { MAX_DAILY_MINUTES, MIN_DAILY_MINUTES } from '@/lib/kid/time-limits';

const PRESET_OPTIONS = [15, 30, 45, 60, 90, 120];

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/**
 * Parent-side daily time-limit control. Shows today's used minutes and lets
 * the parent pick the cap (5–180 min). Saving goes through setDailyLimit,
 * which requires the PIN-minted parent-zone grant — without it the save
 * fails and the parent is asked to unlock again.
 */
export default function TimeLimitSetting({
  childId,
  nickname,
}: {
  childId: string;
  nickname: string;
}) {
  const [status, setStatus] = useState<TimeLimitStatus | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getTimeLimitStatus(childId, {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
      .then((s) => {
        if (cancelled) return;
        setStatus(s);
        setMinutes(s.limitMinutes);
      })
      .catch(() => {
        /* section stays in its default state */
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { limitMinutes } = await setDailyLimit(childId, minutes);
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              limitMinutes,
              remainingMinutes: Math.max(0, limitMinutes - prev.usedMinutes),
              exhausted: prev.usedMinutes >= limitMinutes,
            }
          : prev,
      );
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(
        'Could not save the time limit. If the parent zone locked, unlock it with your PIN and try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const pct = status
    ? Math.min(100, Math.round((status.usedMinutes / Math.max(1, status.limitMinutes)) * 100))
    : 0;

  return (
    <div className="card-kid rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
      <h2 className="font-display text-xl font-extrabold text-parent-sky-900">Daily time limit</h2>
      <p className="mt-1 text-sm text-parent-ink-600">
        Cap {nickname}&rsquo;s learning time per day. When the time is used up,
        {nickname} is gently wound down for the day — no new games start until tomorrow.
      </p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="font-bold text-parent-ink-900">
            {status
              ? `Today: ${formatMinutes(status.usedMinutes)} of ${formatMinutes(status.limitMinutes)} used`
              : 'Loading…'}
          </p>
          <p className="text-sm font-semibold text-parent-ink-600">{pct}%</p>
        </div>
        <div
          className="mt-1.5 h-3 overflow-hidden rounded-full bg-parent-sky-100"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Daily time used"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-parent-sky-600 to-parent-sky-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-extrabold text-parent-ink-900">
          Daily limit: <span className="text-parent-sky-700">{formatMinutes(minutes)}</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setMinutes(opt)}
              aria-pressed={minutes === opt}
              className={`rounded-xl border-2 px-3.5 py-2 text-sm font-extrabold transition-all ${
                minutes === opt
                  ? 'border-parent-sky-600 bg-parent-sky-600 text-white shadow-md'
                  : 'border-parent-sky-100 bg-white text-parent-ink-900 hover:border-parent-sky-300'
              }`}
            >
              {formatMinutes(opt)}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="sr-only">Custom daily limit in minutes</span>
          <input
            type="range"
            min={MIN_DAILY_MINUTES}
            max={MAX_DAILY_MINUTES}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full accent-parent-sky-600"
            aria-valuetext={`${minutes} minutes per day`}
          />
        </label>
        <div className="flex items-center justify-between text-xs font-semibold text-parent-ink-400">
          <span>{MIN_DAILY_MINUTES} min</span>
          <span>{formatMinutes(MAX_DAILY_MINUTES)}</span>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || (status !== null && minutes === status.limitMinutes)}
          className="rounded-xl bg-parent-sky-600 px-5 py-2.5 font-extrabold text-white shadow-md transition-all hover:bg-parent-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save time limit'}
        </button>
        {saved && <p className="text-sm font-bold text-parent-leaf-600">Saved.</p>}
      </div>
    </div>
  );
}
