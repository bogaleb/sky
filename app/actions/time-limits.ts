'use server';

import { requireParentZone } from '@/lib/parent-zone';
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_DAILY_MINUTES,
  MAX_DAILY_MINUTES,
  MIN_DAILY_MINUTES,
  buildTimeLimitStatus,
  computeActivePlayMinutes,
  startOfLocalDayIso,
  validateDailyMinutes,
  type PlayEvent,
  type TimeLimitStatus,
} from '@/lib/kid/time-limits';

export type { TimeLimitStatus };

/**
 * The signed-in parent must own the child row. Used by both the kid-side
 * status check (the child plays inside the parent's session) and the
 * parent-zone save below.
 */
async function requireChild(childId: string) {
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
  return supabase;
}

/**
 * Today's active play minutes for a child, computed SERVER-SIDE from
 * `learning_events` timestamps (see lib/kid/time-limits.ts for the pairing
 * rules). The kid session calls this on start and before every new game
 * start; when `exhausted` is true the client routes to the wind-down and
 * blocks new game starts. Enforcement lives here — the client only renders
 * what this returns.
 */
export async function getTimeLimitStatus(
  childId: string,
  opts?: { timeZone?: string },
): Promise<TimeLimitStatus> {
  const supabase = await requireChild(childId);

  const { data: settings } = await supabase
    .from('parent_settings')
    .select('daily_minutes')
    .eq('child_id', childId)
    .maybeSingle();
  const limitMinutes =
    validateDailyMinutes((settings as { daily_minutes?: unknown } | null)?.daily_minutes) ??
    DEFAULT_DAILY_MINUTES;

  const now = new Date();
  const dayStartIso = startOfLocalDayIso(opts?.timeZone, now);
  const dayStartMs = new Date(dayStartIso).getTime();

  const { data: events } = await supabase
    .from('learning_events')
    .select('event_type, session_id, metadata, created_at')
    .eq('child_id', childId)
    .gte('created_at', dayStartIso)
    .order('created_at', { ascending: true })
    .limit(5000);

  const playEvents: PlayEvent[] = ((events ?? []) as Array<{
    event_type: string;
    session_id: string | null;
    metadata: { kind?: string; sessionId?: string } | null;
    created_at: string;
  }>).map((e) => ({
    eventType: e.event_type,
    sessionId: e.session_id ?? e.metadata?.sessionId ?? null,
    kind: e.metadata?.kind ?? null,
    createdAtMs: new Date(e.created_at).getTime(),
  }));

  const usedMinutes = computeActivePlayMinutes(playEvents, now.getTime(), dayStartMs);
  return buildTimeLimitStatus(limitMinutes, usedMinutes);
}

/**
 * Save the daily time limit for a child. Parent-zone enforced: requires the
 * PIN-minted, device-bound grant (lib/parent-zone.ts) — tapping around the
 * client or calling this action directly cannot change the limit while the
 * zone is locked.
 */
export async function setDailyLimit(childId: string, minutes: number): Promise<{ limitMinutes: number }> {
  const supabase = await requireChild(childId);
  await requireParentZone(supabase);

  const valid = validateDailyMinutes(minutes);
  if (valid === null) {
    throw new Error(
      `Pick a daily limit between ${MIN_DAILY_MINUTES} and ${MAX_DAILY_MINUTES} minutes.`,
    );
  }

  const { error } = await supabase
    .from('parent_settings')
    .upsert({ child_id: childId, daily_minutes: valid }, { onConflict: 'child_id' });
  if (error) throw new Error('Could not save the daily limit.');
  return { limitMinutes: valid };
}
