'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/lib/validation';

export interface AuthResult {
  error?: string;
  needsConfirmation?: boolean;
}

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'That email and password do not match. Try again, or create an account.';
  }
  if (/already registered|already exists|user already/i.test(message)) {
    return 'An account with that email already exists. Try logging in instead.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Please confirm your email first — check your inbox for our message.';
  }
  if (/password/i.test(message) && /weak|short|6 characters/i.test(message)) {
    return 'Supabase requires a stronger password. Try a longer one.';
  }
  return 'Something went wrong on our side. Please try again.';
}

async function routeAfterAuth(): Promise<never> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_parent_profile');
  const profile = data as unknown as { has_pin: boolean } | null;

  if (!profile?.has_pin) redirect('/onboarding/pin');

  const { data: children } = await supabase
    .from('children')
    .select('id')
    .limit(1);
  redirect(children && children.length > 0 ? '/profiles' : '/onboarding/children');
}

export async function signUp(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: friendlyAuthError(error.message) };

  // If the project requires email confirmation there is no session yet —
  // the parent finishes onboarding after clicking the link in their inbox.
  if (!data.session) return { needsConfirmation: true };

  const { error: rpcError } = await supabase.rpc('ensure_parent_profile');
  if (rpcError) {
    return {
      error:
        'Your sign-in was created, but we could not set up your parent profile. Please log in to continue.',
    };
  }
  return routeAfterAuth();
}

export async function signIn(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: friendlyAuthError(error.message) };

  const { error: rpcError } = await supabase.rpc('ensure_parent_profile');
  if (rpcError) {
    return { error: 'Signed in, but we could not load your parent profile. Please try again.' };
  }
  return routeAfterAuth();
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { cookies } = await import('next/headers');
  const store = await cookies();
  store.delete('sky_child');
  store.delete('sky_session');
  redirect('/');
}
