import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    // updateSession already degrades gracefully when Supabase is unconfigured;
    // this is the last-resort net for anything else.
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.next({ request });
    }
    return NextResponse.json(
      { error: 'Sky is temporarily unavailable. Please try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
