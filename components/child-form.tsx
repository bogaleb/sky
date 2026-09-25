'use client';

import { useActionState, useRef, useState } from 'react';
import { createChild, type ActionResult } from '@/app/actions/onboarding';
import { AVATARS } from '@/components/avatars';
import { AGE_BAND_DESCRIPTIONS, AGE_BANDS, type AgeBand } from '@/lib/avatars';
import { Button, Card, FormError, TextField } from '@/components/ui';

const initialState: ActionResult = {};

export default function ChildForm({ onAdded }: { onAdded: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await createChild(prev, formData);
      if (!result.error) {
        onAdded();
        formRef.current?.reset();
        setAvatarId('curio');
        setAgeBand('5-6');
      }
      return result;
    },
    initialState
  );
  const [avatarId, setAvatarId] = useState('curio');
  const [ageBand, setAgeBand] = useState<AgeBand>('5-6');
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <h2 className="text-lg font-bold text-parent-ink-900">Add a child</h2>
      <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-5">
        <TextField
          label="Nickname"
          name="nickname"
          required
          maxLength={24}
          autoComplete="off"
          placeholder="e.g. Maya"
          hint="This is the only personal detail Sky keeps about your child."
        />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-parent-ink-900">
            Pick an avatar
          </legend>
          <div
            className="grid grid-cols-4 gap-2.5"
            role="radiogroup"
            aria-label="Avatar"
          >
            {Object.entries(AVATARS).map(([id, { name, Component }]) => {
              const selected = avatarId === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAvatarId(id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition-colors ${
                    selected
                      ? 'border-parent-sky-600 bg-parent-sky-50'
                      : 'border-transparent hover:border-parent-sky-200 hover:bg-parent-sky-50'
                  }`}
                >
                  <Component className="h-14 w-14" />
                  <span className="text-xs font-semibold text-parent-ink-600">
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
          <input type="hidden" name="avatar_id" value={avatarId} />
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-parent-ink-900">
            Age band
          </legend>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Age band">
            {AGE_BANDS.map((band) => {
              const selected = ageBand === band;
              return (
                <button
                  key={band}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAgeBand(band)}
                  className={`rounded-2xl border-2 p-3 text-left transition-colors ${
                    selected
                      ? 'border-parent-sky-600 bg-parent-sky-50'
                      : 'border-parent-sky-100 bg-white hover:border-parent-sky-200'
                  }`}
                >
                  <span className="block text-base font-extrabold text-parent-sky-900">
                    Ages {band}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-parent-ink-600">
                    {AGE_BAND_DESCRIPTIONS[band]}
                  </span>
                </button>
              );
            })}
          </div>
          <input type="hidden" name="age_band" value={ageBand} />
        </fieldset>

        <FormError message={state.error} />
        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending ? 'Adding…' : 'Add this child'}
        </Button>
      </form>
    </Card>
  );
}
