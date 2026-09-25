'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signIn, signUp, type AuthResult } from '@/app/actions/auth';
import { Button, Card, FormError, PageShell, TextField } from '@/components/ui';

const initialState: AuthResult = {};

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const action = mode === 'login' ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.needsConfirmation) {
    return (
      <PageShell>
        <Card>
          <h1 className="font-display text-2xl font-extrabold text-parent-sky-900">
            Check your inbox
          </h1>
          <p className="mt-3 text-parent-ink-600">
            We sent you a confirmation email. Click the link inside, then come
            back here to log in and meet your crew.
          </p>
          <div className="mt-6">
            <Link href="/login">
              <Button className="w-full">Back to log in</Button>
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Card>
        <p className="font-display text-center text-2xl font-extrabold text-parent-sky-900">
          Sky
        </p>
        <h1 className="font-display mt-2 text-center text-xl font-bold text-parent-ink-900">
          {mode === 'login' ? 'Welcome back' : 'Create your parent account'}
        </h1>
        <p className="mt-1 text-center text-sm text-parent-ink-600">
          {mode === 'login'
            ? 'Log in to manage your family’s learning.'
            : 'One account for you — your children need no email.'}
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={mode === 'signup' ? 8 : undefined}
            placeholder={
              mode === 'signup' ? 'At least 8 characters, with a number' : 'Your password'
            }
          />
          <FormError message={state.error} />
          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending
              ? 'One moment…'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-parent-ink-600">
          {mode === 'login' ? (
            <>
              New to Sky?{' '}
              <Link href="/signup" className="font-semibold text-parent-sky-700 underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-parent-sky-700 underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </Card>
    </PageShell>
  );
}
