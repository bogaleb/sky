export interface SubjectMastery {
  subjectCode: string;
  subjectName: string;
  mastered: number;
  total: number;
  /** Average level (1-5) across attempted skills. */
  avgLevel: number;
}

export interface ChildDashboard {
  id: string;
  nickname: string;
  avatarId: string;
  ageBand: string;
  /** Sessions in the last 30 days. */
  sessions30d: number;
  /** Sessions in the last 7 days. */
  sessions7d: number;
  /** Stars earned in the last 7 days. */
  stars7d: number;
  /** Points earned in the last 7 days. */
  points7d: number;
  /** Total stickers earned. */
  stickers: number;
  subjects: SubjectMastery[];
  recentMilestones: Array<{ kind: string; detail: string; at: string }>;
  lastActiveAt: string | null;
}

export interface WeeklyDigest {
  weekStart: string;
  headline: string;
  bullets: string[];
  /** Subjects that need attention. */
  focusAreas: string[];
}

/**
 * Pure builder for the weekly digest copy. Takes dashboard data for one
 * child and returns the plain-language summary — no DB, no auth, so it is
 * unit-testable.
 */
export function buildWeeklyDigest(dash: ChildDashboard, weekStart: string): WeeklyDigest {
  const nickname = dash.nickname;
  const bullets: string[] = [];

  if (dash.sessions7d === 0) {
    bullets.push(`${nickname} hasn't flown this week yet — even 10 minutes counts!`);
  } else {
    bullets.push(
      `${nickname} completed ${dash.sessions7d} learning flight${dash.sessions7d === 1 ? '' : 's'} this week, earning ${dash.stars7d} stars and ${dash.points7d} points.`,
    );
  }

  const activeSubjects = dash.subjects
    .filter((s) => s.mastered > 0)
    .sort((a, b) => b.mastered - a.mastered);
  if (activeSubjects.length > 0) {
    const top = activeSubjects.slice(0, 3).map((s) => s.subjectName).join(', ');
    bullets.push(`Strongest areas right now: ${top}.`);
  }

  if (dash.stickers > 0) {
    bullets.push(`${nickname} has collected ${dash.stickers} sticker${dash.stickers === 1 ? '' : 's'} in the sticker book.`);
  }

  const focusAreas = dash.subjects
    .filter((s) => s.mastered === 0 && s.avgLevel > 0)
    .map((s) => s.subjectName)
    .slice(0, 3);
  if (focusAreas.length > 0) {
    bullets.push(`Worth a visit soon: ${focusAreas.join(', ')} — a little practice goes a long way.`);
  } else if (dash.sessions7d > 0) {
    bullets.push(`Everything ${nickname} touched this week is growing. Keep the streak going!`);
  }

  const headline =
    dash.sessions7d === 0 ? `A quiet week for ${nickname}` : `${nickname} is flying high this week`;

  return { weekStart, headline, bullets, focusAreas };
}
