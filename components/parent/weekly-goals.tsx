'use client';

import { useEffect, useState } from 'react';
import { getGoalProgress, setWeeklyGoal, type GoalProgress } from '@/app/actions/goals';

const TARGET_OPTIONS = [3, 5, 7, 10];

/**
 * Parent-side weekly goal setter. Shows this week's progress bar and lets the
 * parent pick a target (3/5/7/10 activities). Styled to match the parent
 * dashboard's calm parent-* tokens.
 */
export default function WeeklyGoals({ childId }: { childId: string }) {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [target, setTarget] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getGoalProgress(childId)
      .then((p) => {
        if (cancelled) return;
        setProgress(p);
        setTarget(p.target);
      })
      .catch(() => {
        /* goal section stays in its default state */
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const p = await setWeeklyGoal(childId, target);
      setProgress(p);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Could not save the goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pct = progress
    ? Math.min(100, Math.round((progress.completed / Math.max(1, progress.target)) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
      <h2 className="text-xl font-extrabold text-parent-sky-900">Weekly goal</h2>
      <p className="mt-1 text-sm text-parent-ink-600">
        Set a learning target for this week. When it&rsquo;s reached, the goal is
        celebrated with a sticker and a trophy.
      </p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="font-bold text-parent-ink-900">
            {progress ? `${progress.completed} of ${progress.target} activities` : 'Loading…'}
          </p>
          <p className="text-sm font-semibold text-parent-ink-600">{pct}%</p>
        </div>
        <div
          className="mt-1.5 h-3 overflow-hidden rounded-full bg-parent-sky-100"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Weekly goal progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-parent-sky-600 to-parent-sky-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-extrabold text-parent-ink-900">Activities per week</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Weekly activity target">
          {TARGET_OPTIONS.map((t) => {
            const selected = target === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTarget(t)}
                className={`rounded-full px-5 py-2.5 text-base font-extrabold transition-all ${
                  selected
                    ? 'bg-parent-sky-600 text-white shadow-md'
                    : 'bg-parent-sky-100 text-parent-sky-900 hover:bg-parent-sky-200'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-parent-sky-600 px-6 py-2.5 text-base font-extrabold text-white shadow-md transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save goal'}
        </button>
        {saved && <p className="text-sm font-bold text-parent-leaf-600">Goal saved.</p>}
        {error && (
          <p className="text-sm font-bold text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
