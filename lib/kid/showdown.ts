/**
 * Sibling Showdown — friendly family competition. Pure, testable logic.
 *
 * The "Star Sprint": every week, siblings race to be the first to
 * STAR_SPRINT_TARGET stars. Data layer lives in app/actions/showdown.ts.
 */

export const STAR_SPRINT_TARGET = 30;

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

/** Monday (00:00 UTC) of the week containing `now`, as YYYY-MM-DD. */
export function weekKey(now: Date = new Date()): string {
  const d = new Date(now);
  const diff = (d.getDay() + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
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
