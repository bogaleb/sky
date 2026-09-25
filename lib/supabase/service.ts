// Service-role Supabase client. SERVER ONLY — never import from a Client
// Component. Bypasses RLS; every caller must enforce its own authorization
// (verify the child belongs to the signed-in parent) before touching data.
//
// Used by the planner's server actions, which read the full activity pool and
// cross-child-safe snapshots that RLS would otherwise hide from the parent's
// own session.
import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getServiceRoleKey, getSupabaseConfig } from './config';
import type { Database } from './database.types';

export function createServiceClient() {
  const { url } = getSupabaseConfig();
  return createClient<Database>(url, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
