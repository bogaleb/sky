// Supabase configuration. Env vars are read lazily so `next build` succeeds
// without credentials; the error only throws when a client is actually built.

export class SupabaseConfigurationError extends Error {
  constructor(message?: string) {
    super(
      message ??
        'Supabase is not configured. Copy .env.example to .env.local and fill in your project URL and keys.'
    );
    this.name = 'SupabaseConfigurationError';
  }
}

export function getSupabaseConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!rawUrl || !publishableKey) throw new SupabaseConfigurationError();
  // Normalize: the Supabase JS client appends /auth/v1, /rest/v1, etc. itself,
  // so a copied Data API URL like https://xyz.supabase.co/rest/v1/ would break
  // auth. Strip any path and trailing slash.
  const url = rawUrl.split('/').slice(0, 3).join('/');
  return { url, publishableKey };
}

export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new SupabaseConfigurationError();
  return key;
}
