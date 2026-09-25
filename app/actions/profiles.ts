'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SKY_CHILD_COOKIE, SKY_SESSION_COOKIE } from '@/lib/session';

// One tap on a profile: verify the child belongs to this parent, open a play
// session (logged server-side), and remember the active child in httpOnly
// cookies. The kid world (Phase 3+) reads these cookies.
export async function selectProfile(formData: FormData): Promise<never> {
  const childId = String(formData.get('child_id') ?? '');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single();
  if (!child) redirect('/profiles');

  const { data: sessionId, error } = await supabase.rpc('start_session', {
    p_child_id: child.id,
  });
  if (error || !sessionId) redirect('/profiles');

  const store = await cookies();
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 12, // 12h; the goodbye ritual ends sessions earlier
    secure: process.env.NODE_ENV === 'production',
  };
  store.set(SKY_CHILD_COOKIE, child.id, cookieOpts);
  store.set(SKY_SESSION_COOKIE, sessionId, cookieOpts);

  redirect('/deck');
}

// The goodbye ritual (Phase 6 expands it): close the session server-side,
// forget the active child, and return to the profile picker.
export async function endSessionAndSwitch(): Promise<never> {
  const store = await cookies();
  const sessionId = store.get(SKY_SESSION_COOKIE)?.value;

  if (sessionId) {
    const supabase = await createClient();
    await supabase.rpc('end_session', {
      p_session_id: sessionId,
      p_reason: 'child_done',
    });
  }

  store.delete(SKY_CHILD_COOKIE);
  store.delete(SKY_SESSION_COOKIE);
  redirect('/profiles');
}

export interface ActiveChild {
  childId: string;
  sessionId: string | null;
}

// Reads the active-child cookies. Returns null when no profile is picked.
export async function getActiveChild(): Promise<ActiveChild | null> {
  const store = await cookies();
  const childId = store.get(SKY_CHILD_COOKIE)?.value;
  if (!childId) return null;
  return { childId, sessionId: store.get(SKY_SESSION_COOKIE)?.value ?? null };
}
