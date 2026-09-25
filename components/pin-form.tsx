'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { setPin, type ActionResult } from '@/app/actions/onboarding';
import { Button, Card, FormError, PageShell } from '@/components/ui';

const initialState: ActionResult = {};
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

function DigitDots({ count, total }: { count: number; total: number }) {
  return (
    <div className="flex justify-center gap-3" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-4 w-4 rounded-full border-2 transition-colors ${
            i < count
              ? 'border-parent-sky-600 bg-parent-sky-600'
              : 'border-parent-sky-200 bg-white'
          }`}
        />
      ))}
    </div>
  );
}

export default function PinForm() {
  const [state, formAction, pending] = useActionState(setPin, initialState);
  // Two phases: choose, then confirm.
  const [phase, setPhase] = useState<'choose' | 'confirm'>('choose');
  const [first, setFirst] = useState('');
  const [entry, setEntry] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const padRef = useRef<HTMLDivElement>(null);

  const press = (d: string) => {
    setMismatch(false);
    setEntry((e) => (e.length < 6 ? e + d : e));
  };
  const backspace = () => {
    setMismatch(false);
    setEntry((e) => e.slice(0, -1));
  };

  // Keyboard support: the pad is operable without a pointer.
  useEffect(() => {
    const el = padRef.current;
    if (!el) return;
    const onKey = (ev: KeyboardEvent) => {
      if (/^[0-9]$/.test(ev.key)) press(ev.key);
      else if (ev.key === 'Backspace') backspace();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  const advance = () => {
    if (entry.length < 4) return;
    if (phase === 'choose') {
      setFirst(entry);
      setEntry('');
      setPhase('confirm');
    }
  };

  const resetAll = () => {
    setFirst('');
    setEntry('');
    setPhase('choose');
    setMismatch(false);
  };

  const submitMismatch = phase === 'confirm' && entry.length >= 4 && entry !== first;

  return (
    <PageShell>
      <Card>
        <h1 className="text-center text-2xl font-extrabold text-parent-sky-900">
          {phase === 'choose' ? 'Choose your parent PIN' : 'Enter it once more'}
        </h1>
        <p className="mt-2 text-center text-sm text-parent-ink-600">
          Your PIN guards the parent zone — settings, limits and reports. Your
          children never need it. 4 to 6 digits.
        </p>

        <div
          ref={padRef}
          tabIndex={0}
          role="group"
          aria-label="PIN entry pad. Type digits on your keyboard or tap the buttons."
          className="mt-6 rounded-2xl outline-none"
        >
          <DigitDots count={entry.length} total={6} />
          <p className="mt-2 h-5 text-center text-sm font-medium text-parent-rose-600" role="alert">
            {mismatch || submitMismatch ? 'Those PINs do not match. Try again.' : ''}
          </p>

          <div className="mx-auto mt-2 grid max-w-[240px] grid-cols-3 gap-2.5">
            {DIGITS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => press(d)}
                aria-label={`Digit ${d}`}
                className="flex h-14 items-center justify-center rounded-2xl border border-parent-sky-200 bg-parent-sky-50 text-xl font-bold text-parent-sky-900 transition-colors hover:bg-parent-sky-100 active:bg-parent-sky-200"
              >
                {d}
              </button>
            ))}
            <span aria-hidden="true" />
            <button
              type="button"
              onClick={backspace}
              aria-label="Delete last digit"
              className="flex h-14 items-center justify-center rounded-2xl border border-parent-sky-200 bg-white text-sm font-semibold text-parent-ink-600 hover:bg-parent-sky-50"
            >
              Delete
            </button>
          </div>
        </div>

        <form action={formAction} className="mt-6">
          <input type="hidden" name="pin" value={first} />
          <input type="hidden" name="confirm" value={entry} />
          <FormError message={state.error} />
          {phase === 'choose' ? (
            <Button
              type="button"
              onClick={advance}
              disabled={entry.length < 4 || pending}
              className="w-full"
              size="lg"
            >
              Continue
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={entry.length < 4 || pending}
                className="w-full"
                size="lg"
                onClick={(e) => {
                  if (entry !== first) {
                    e.preventDefault();
                    // Back to the choose phase, but keep the mismatch message
                    // visible until the parent starts typing again.
                    setFirst('');
                    setEntry('');
                    setPhase('choose');
                    setMismatch(true);
                  }
                }}
              >
                {pending ? 'Saving…' : 'Save my PIN'}
              </Button>
              <Button type="button" variant="ghost" onClick={resetAll} className="w-full">
                Start over
              </Button>
            </div>
          )}
        </form>
      </Card>
    </PageShell>
  );
}
