import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getSupabaseConfig, SupabaseConfigurationError } from '../lib/supabase/config';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe('getSupabaseConfig', () => {
  it('throws when vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(() => getSupabaseConfig()).toThrow(SupabaseConfigurationError);
  });

  it('returns the URL unchanged when it has no path', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'pk';
    const { getSupabaseConfig: fresh } = await import('../lib/supabase/config');
    expect(fresh().url).toBe('https://xyz.supabase.co');
  });

  it('strips a /rest/v1/ suffix copied from the Data API dialog', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co/rest/v1/';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'pk';
    const { getSupabaseConfig: fresh } = await import('../lib/supabase/config');
    expect(fresh().url).toBe('https://xyz.supabase.co');
  });

  it('strips a trailing slash', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co/';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'pk';
    const { getSupabaseConfig: fresh } = await import('../lib/supabase/config');
    expect(fresh().url).toBe('https://xyz.supabase.co');
  });
});
