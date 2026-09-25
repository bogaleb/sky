'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Days with learning activity, for the streak calendar. There is no
 * per-day ledger table (streaks holds counts only), so we derive active
 * days from learning_events — read-only, indexed on (child_id, created_at).
 * No migrations needed.
 */
export async function getLearningDays(childId: string, lookbackDays = 45): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single();
  if (!child) throw new Error('Child not found.');

  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const { data: events } = await supabase
    .from('learning_events')
    .select('created_at')
    .eq('child_id', childId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })
    .limit(3000);

  const days = new Set<string>();
  for (const e of (events ?? []) as Array<{ created_at: string }>) {
    const d = new Date(e.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.add(key);
  }
  return [...days].sort();
}
