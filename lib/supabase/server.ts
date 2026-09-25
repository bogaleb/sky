import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from './config';
import type { Database } from './database.types';

// Create per request. A shared server client could leak one parent's session
// into another's.
export async function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies; the proxy refreshes them.
          // Route Handlers and Server Actions have a writable cookie store.
        }
      },
    },
  });
}
