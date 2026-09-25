import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export interface ParentProfile {
  id: string;
  email: string;
  display_name: string | null;
  has_pin: boolean;
  narration_enabled: boolean;
}

// Pages that require a signed-in parent call this. It never returns for
// anonymous visitors (redirects to /login instead).
export async function requireParent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase.rpc('get_parent_profile');
  const profile = data as unknown as ParentProfile | null;

  return { supabase, user, profile };
}
