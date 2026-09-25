'use server';

import { createClient } from '@/lib/supabase/server';
import { TROPHIES, getTrophy, type Trophy, type TrophyEvent } from '@/lib/kid/trophies';
import { TRAIL_LENGTH } from '@/lib/kid/trail';
import { questDateKey } from '@/lib/kid/quests';
import { awardStars } from './rewards';

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

/** All trophy ids a child has earned, oldest first. */
export async function getTrophies(childId: string): Promise<string[]> {
  const supabase = await requireChild(childId);
  const { data, error } = await supabase
    .from('trophy_awards')
    .select('trophy_id, awarded_at')
    .eq('child_id', childId)
    .order('awarded_at', { ascending: true });
  if (error) throw new Error('Could not load trophies.');
  return (data ?? []).map((r) => r.trophy_id);
}

/**
 * Award a trophy if new. Idempotent: re-awarding returns awarded: false.
 * A fresh award also grants the trophy's star bonus to the wallet.
 */
export async function awardTrophy(
  childId: string,
  trophyId: string
): Promise<{ awarded: boolean; trophy: Trophy | null }> {
  const def = getTrophy(trophyId);
  if (!def) return { awarded: false, trophy: null };
  const supabase = await requireChild(childId);

  const { data, error } = await supabase
    .from('trophy_awards')
    .upsert(
      { child_id: childId, trophy_id: trophyId },
      { onConflict: 'child_id,trophy_id', ignoreDuplicates: true }
    )
    .select('trophy_id');
  if (error) throw new Error('Could not award trophy.');
  const awarded = (data ?? []).length > 0;
  if (awarded && def.starBonus > 0) {
    // Star bonus is a nice-to-have; the trophy itself is already recorded.
    await awardStars(childId, def.starBonus).catch(() => {});
  }
  return { awarded, trophy: awarded ? def : null };
}

/** COUNT(*) with an exact count for the small per-child trophy tables. */
async function exactCount(
  supabase: Awaited<ReturnType<typeof requireChild>>,
  table: 'learning_events' | 'quest_progress' | 'child_outfits',
  match: Record<string, string | boolean>
): Promise<number> {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(match)) {
    query = query.eq(k, v);
  }
  const { count } = await query;
  return count ?? 0;
}

/**
 * Evaluate trophy conditions for a gameplay event and award anything newly
 * earned. Returns the newly awarded trophies (full definitions) so the UI
 * can celebrate them. Safe to call often: awards are idempotent and each
 * branch runs cheap COUNT queries.
 */
export async function checkTrophies(
  childId: string,
  event: TrophyEvent,
  opts: { perfect?: boolean } = {}
): Promise<Trophy[]> {
  const supabase = await requireChild(childId);
  const earned: Trophy[] = [];

  const grant = async (trophyId: string) => {
    const def = getTrophy(trophyId);
    if (!def) return;
    const { data, error } = await supabase
      .from('trophy_awards')
      .upsert(
        { child_id: childId, trophy_id: trophyId },
        { onConflict: 'child_id,trophy_id', ignoreDuplicates: true }
      )
      .select('trophy_id');
    if (error) return;
    if ((data ?? []).length > 0) {
      earned.push(def);
      if (def.starBonus > 0) {
        await awardStars(childId, def.starBonus).catch(() => {});
      }
    }
  };

  switch (event) {
    case 'activity_complete': {
      const n = await exactCount(supabase, 'learning_events', {
        child_id: childId,
        event_type: 'attempt',
      });
      if (n >= 1) await grant('first-flight');
      if (n >= 10) await grant('activities-10');
      if (n >= 50) await grant('activities-50');
      if (n >= 100) await grant('activities-100');
      break;
    }
    case 'session_complete':
    case 'perfect_session': {
      const perfect = opts.perfect ?? event === 'perfect_session';
      if (perfect) {
        await supabase.from('learning_events').insert({
          child_id: childId,
          event_type: 'milestone',
          metadata: { kind: 'perfect_session' },
        });
        const { count } = await supabase
          .from('learning_events')
          .select('id', { count: 'exact', head: true })
          .eq('child_id', childId)
          .eq('event_type', 'milestone')
          .contains('metadata', { kind: 'perfect_session' });
        const n = count ?? 0;
        if (n >= 1) await grant('perfect-first');
        if (n >= 3) await grant('perfect-trio');
      }
      const { data: bal } = await supabase
        .from('star_balances')
        .select('lifetime_earned')
        .eq('child_id', childId)
        .maybeSingle();
      const lifetime = bal?.lifetime_earned ?? 0;
      if (lifetime >= 100) await grant('stars-100');
      if (lifetime >= 500) await grant('stars-500');
      if (lifetime >= 1000) await grant('stars-1000');
      break;
    }
    case 'streak_day': {
      const { data } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('child_id', childId)
        .maybeSingle();
      const s = data?.current_streak ?? 0;
      if (s >= 3) await grant('streak-3');
      if (s >= 7) await grant('streak-7');
      break;
    }
    case 'quest_done': {
      const n = await exactCount(supabase, 'quest_progress', {
        child_id: childId,
        quest_date: questDateKey(),
        completed: true,
      });
      if (n >= 1) await grant('quest-first');
      if (n >= 3) await grant('quest-trio');
      break;
    }
    case 'trail_chapter': {
      // Chapter 1 spans the first fifth of the trail (level 1 across skills).
      const chapterSize = Math.floor(TRAIL_LENGTH / 5);
      const { data } = await supabase
        .from('trail_progress')
        .select('quests_completed')
        .eq('child_id', childId)
        .maybeSingle();
      if ((data?.quests_completed ?? 0) >= chapterSize) await grant('trail-chapter-1');
      break;
    }
    case 'pet_hatched':
      await grant('pet-hatched');
      break;
    case 'pet_grown':
      await grant('pet-grown');
      break;
    case 'outfit_bought': {
      const n = await exactCount(supabase, 'child_outfits', {
        child_id: childId,
        unlocked: true,
      });
      if (n >= 1) await grant('outfit-first');
      if (n >= 5) await grant('outfit-five');
      break;
    }
    case 'memory_done':
      await grant('memory-first');
      break;
    case 'story_done':
      await grant('story-first');
      break;
    case 'song_done':
      await grant('song-first');
      break;
    case 'pattern_done':
      await grant('pattern-first');
      break;
    case 'puzzle_done':
      await grant('puzzle-first');
      break;
    case 'word_done':
      await grant('word-first');
      break;
    case 'number_done':
      await grant('number-first');
      break;
    case 'cinema_done':
      await grant('cinema-first');
      break;
    case 'art_done':
      await grant('art-first');
      break;
    case 'bedtime_done':
      await grant('bedtime-first');
      break;
    case 'writing_done':
      await grant('writing-first');
      break;
    case 'geography_done':
      await grant('geography-first');
      break;
    case 'rhythm_done':
      await grant('rhythm-first');
      break;
    case 'science_done':
      await grant('science-first');
      break;
    case 'coding_done':
      await grant('coding-first');
      break;
    case 'phonics_done':
      await grant('phonics-first');
      break;
    case 'onboarding_done':
      await grant('welcome-first');
      break;
    case 'goal_done':
      await grant('goal-first');
      break;
    case 'collection_done':
      await grant('collector-first');
      break;
    case 'time_done':
      await grant('time-first');
      break;
    case 'money_done':
      await grant('money-first');
      break;
    case 'showdown_done':
      await grant('showdown-first');
      break;
    case 'movie_done':
      await grant('movie-first');
      break;
    case 'homes_done':
      await grant('homes-first');
      break;
    default: {
      // Unknown events are ignored so new gameplay can fire freely.
      const _exhaustive: never = event;
      void _exhaustive;
      break;
    }
  }

  // Keep the static catalog honest: never return a trophy id with no def.
  return earned.filter((t) => TROPHIES.includes(t));
}
