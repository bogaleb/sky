'use client';

import { useActionState } from 'react';
import { finishOnboarding, type ActionResult } from '@/app/actions/onboarding';
import { Button, FormError } from '@/components/ui';

const initialState: ActionResult = {};

export default function ContinueButton({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(finishOnboarding, initialState);
  return (
    <form action={formAction}>
      <FormError message={state.error} />
      <Button
        type="submit"
        disabled={disabled || pending}
        className="w-full"
        size="lg"
      >
        {pending ? 'One moment…' : 'Continue to Sky'}
      </Button>
      {disabled && (
        <p className="mt-2 text-center text-sm text-parent-ink-600">
          Add at least one child to continue.
        </p>
      )}
    </form>
  );
}
