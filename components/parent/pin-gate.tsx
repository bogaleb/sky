'use client';

import { useState } from 'react';
import { verifyParentZonePin } from '@/app/actions/dashboard';

/**
 * Parent-zone PIN gate. The parent enters their 4-6 digit PIN to unlock
 * the dashboard on this device. Verified server-side via verify_parent_pin —
 * the hash never leaves the database. Unlock lasts for this tab session.
 */
export default function PinGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    if (!/^\d{4,6}$/.test(pin)) {
      setError('Enter your 4 to 6 digit PIN.');
      return;
    }
    setChecking(true);
    setError('');
    try {
      const ok = await verifyParentZonePin(pin);
      if (!ok) {
        setError('That PIN didn\u2019t match. Try again.');
        setPin('');
        return;
      }
      sessionStorage.setItem('sky_parent_zone', 'unlocked');
      onUnlocked();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const press = (digit: string) => {
    if (pin.length >= 6) return;
    setError('');
    setPin((p) => p + digit);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="w-full rounded-3xl border border-parent-sky-100 bg-white p-8 shadow-[0_8px_30px_rgba(18,60,96,0.08)]">
        <h1 className="text-center text-2xl font-extrabold text-parent-sky-900">Parent zone</h1>
        <p className="mt-2 text-center text-parent-ink-600">
          Enter your PIN to see learning reports. Kids stay out!
        </p>

        <div className="mt-6 flex justify-center gap-3" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`flex h-12 w-10 items-center justify-center rounded-xl border-2 text-2xl font-black ${
                i < pin.length
                  ? 'border-parent-sky-600 bg-parent-sky-50 text-parent-sky-700'
                  : 'border-parent-sky-100 bg-parent-sky-50/50 text-transparent'
              }`}
            >
              •
            </span>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              className="rounded-2xl bg-parent-sky-50 py-3.5 text-2xl font-extrabold text-parent-sky-900 transition-all hover:bg-parent-sky-100 active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="rounded-2xl bg-parent-sky-50 py-3.5 text-lg font-bold text-parent-ink-600 transition-all hover:bg-parent-sky-100 active:scale-95"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => press('0')}
            className="rounded-2xl bg-parent-sky-50 py-3.5 text-2xl font-extrabold text-parent-sky-900 transition-all hover:bg-parent-sky-100 active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setPin((p) => p.slice(0, -1))}
            aria-label="Delete last digit"
            className="rounded-2xl bg-parent-sky-50 py-3.5 text-lg font-bold text-parent-ink-600 transition-all hover:bg-parent-sky-100 active:scale-95"
          >
            ⌫
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-center font-bold text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={checking || pin.length < 4}
          className="mt-6 w-full rounded-2xl bg-parent-sky-600 py-4 text-xl font-extrabold text-white shadow-lg transition-all hover:bg-parent-sky-700 active:scale-[0.98] disabled:opacity-40"
        >
          {checking ? 'Checking…' : 'Unlock reports'}
        </button>
      </div>
    </div>
  );
}
