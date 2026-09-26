import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, SupabaseConfigurationError } from './config';
import type { Database } from './database.types';

const PUBLIC_PATHS = new Set(['/', '/login', '/signup']);

// Refreshes the Supabase session on every matched request and enforces the
// Phase 1 route gates: signed-out visitors can only see the public pages;
// signed-in parents are kept out of /login and /signup.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  let userId: string | null = null;
  try {
    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createServerClient<Database>(url, publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch (error) {
    if (!(error instanceof SupabaseConfigurationError)) throw error;
    // Unconfigured: treat as signed out. Public pages still render; the
    // pages themselves surface the configuration error.
    userId = null;
  }

  const pathname = request.nextUrl.pathname;
  // /dev/* is a local-only UI preview (sample data, no Supabase). It is never
  // public in production builds, and the pages themselves 404 there too.
  const isDevPreview = process.env.NODE_ENV !== 'production' && pathname.startsWith('/dev/');
  const isPublic = PUBLIC_PATHS.has(pathname) || isDevPreview;

  if (!userId && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (userId && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/profiles', request.url));
  }
  return response;
}
