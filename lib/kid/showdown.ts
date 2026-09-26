/**
 * Sibling Showdown — friendly family competition. Pure, testable logic.
 *
 * The "Star Sprint": every week, siblings race to be the first to
 * STAR_SPRINT_TARGET stars. Data layer lives in app/actions/showdown.ts.
 */

export const STAR_SPRINT_TARGET = 30;

/**
 * The Star Sprint leaderboard is age-gated: a ranked sibling leaderboard is
 * a social-comparison dark pattern for ages 3–5, with no developmental
 * upside. Only the 7–8 band sees the competitive card; younger kids get a
 * warm, non-competitive encouragement instead (see showdown-card.tsx).
 */
export const SHOWDOWN_AGE_BAND = '7-8';

/** Whether this age band may see the competitive Star Sprint leaderboard. */
export function canSeeShowdown(ageBand: string | null | undefined): boolean {
  return ageBand === SHOWDOWN_AGE_BAND;
}

export interface SiblingEntry {
  id: string;
  nickname: string;
  weeklyStars: number;
}

export interface RankedSibling extends SiblingEntry {
  /** Dense rank: ties share a rank and the next rank is +1 (kid-friendly). */
  rank: number;
  /** Stars behind the sibling one rank ahead; 0 for the leader(s). */
  gapToNext: number;
}

/**
 * Monday (00:00 UTC) of the week containing `now`, as YYYY-MM-DD.
 *
 * Pure UTC arithmetic on purpose: the server action builds a `...T00:00:00Z`
 * filter from this key, so local-time getters here would shift the week
 * boundary by hours for anyone outside UTC (Wave 10 honesty fix).
 */
export function weekKey(now: Date = new Date()): string {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diff = (monday.getUTCDay() + 6) % 7; // days since Monday, UTC
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

/** Minimal shape of a learning_events row needed for weekly tallies. */
export interface WeeklyEventLike {
  child_id: string;
  event_type: string;
  skill_id: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Honest weekly tally from raw events (pure — the server action paginates and
 * calls this). Stars: EVERY milestone carrying a positive numeric
 * `metadata.stars` counts — Trail session_complete, all 30 mini-game wins,
 * quest-completion bonuses — because every one of those is a real star award.
 * Activities: attempt events with a skill_id, as before.
 */
export function tallyWeeklyEvents(events: WeeklyEventLike[]): {
  starsByChild: Map<string, number>;
  activitiesByChild: Map<string, number>;
} {
  const starsByChild = new Map<string, number>();
  const activitiesByChild = new Map<string, number>();
  for (const e of events) {
    if (e.event_type === 'milestone') {
      const stars = Number(e.metadata?.stars);
      if (Number.isFinite(stars) && stars > 0) {
        starsByChild.set(e.child_id, (starsByChild.get(e.child_id) ?? 0) + stars);
      }
    } else if (e.event_type === 'attempt' && e.skill_id) {
      activitiesByChild.set(e.child_id, (activitiesByChild.get(e.child_id) ?? 0) + 1);
    }
  }
  return { starsByChild, activitiesByChild };
}

/**
 * Rank siblings by weekly stars, highest first. Ties share a dense rank.
 * gapToNext tells each child how many stars they need to catch the sibling
 * one rank ahead — never negative.
 */
export function siblingRankings(children: SiblingEntry[]): RankedSibling[] {
  const sorted = [...children].sort(
    (a, b) => b.weeklyStars - a.weeklyStars || a.nickname.localeCompare(b.nickname),
  );
  const out: RankedSibling[] = [];
  let rank = 0;
  let lastStars: number | null = null;
  for (let i = 0; i < sorted.length; i += 1) {
    if (lastStars === null || sorted[i].weeklyStars !== lastStars) {
      rank += 1;
      lastStars = sorted[i].weeklyStars;
    }
    out.push({
      ...sorted[i],
      rank,
      gapToNext: i === 0 ? 0 : Math.max(0, sorted[i - 1].weeklyStars - sorted[i].weeklyStars),
    });
  }
  return out;
}

export interface ShowdownStatus {
  hasRival: boolean;
  message: string;
}

/** Whether the child has anyone to race against this week. */
export function showdownStatus(childWeeklyStars: number, siblingCount: number): ShowdownStatus {
  if (siblingCount <= 0) {
    return {
      hasRival: false,
      message:
        childWeeklyStars > 0
          ? `Solo flight this week — you earned ${childWeeklyStars} stars all by yourself!`
          : 'Solo flight this week — earn stars and shine on your own!',
    };
  }
  return {
    hasRival: true,
    message: `Star Sprint is on! First to ${STAR_SPRINT_TARGET} stars wins the week.`,
  };
}

export interface ChallengeProgress {
  target: number;
  done: boolean;
  remaining: number;
}

/** Progress toward this week's Star Sprint target. */
export function challengeProgress(weeklyStars: number): ChallengeProgress {
  const target = STAR_SPRINT_TARGET;
  const whole = Math.max(0, Math.floor(weeklyStars));
  return {
    target,
    done: whole >= target,
    remaining: Math.max(0, target - whole),
  };
}
