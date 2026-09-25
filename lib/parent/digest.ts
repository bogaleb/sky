export interface SubjectMastery {
  subjectCode: string;
  subjectName: string;
  mastered: number;
  total: number;
  /** Average level (1-5) across attempted skills. */
  avgLevel: number;
}

/** Per-skill mastery detail for skills the child has attempted. */
export interface SkillMasteryDetail {
  skillId: string;
  skillName: string;
  subjectCode: string;
  subjectName: string;
  islandName: string;
  /** Current level 1-5. */
  currentLevel: number;
  status: 'emerging' | 'developing' | 'proficient' | 'mastered';
  attempts: number;
  correct: number;
  /** Accuracy 0-100, or null when there are no recorded attempts. */
  accuracyPct: number | null;
  lastPracticedAt: string | null;
}

/** One of the child's most-practiced skills in the last 7 days. */
export interface TopSkill {
  skillName: string;
  subjectName: string;
  attempts: number;
}

/** A low-mastery skill with recent activity, phrased for parents. */
export interface FocusSkill {
  skillName: string;
  subjectName: string;
  islandName: string;
  currentLevel: number;
  /** Parent-facing coaching suggestion. */
  suggestion: string;
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
  /** Answered activities in the last 7 days. */
  activities7d: number;
  /** Current daily streak. */
  streak: number;
  longestStreak: number;
  /** Daily quests completed in the last 7 days. */
  questsCompleted7d: number;
  /** Estimated learning minutes in the last 7 days. */
  timePlayedMinutes7d: number;
  /** Most-practiced skills in the last 7 days (up to 3). */
  topSkills: TopSkill[];
  /** Per-skill mastery for attempted skills; the UI groups by subject. */
  skillMastery: SkillMasteryDetail[];
  /** Two lowest-mastery recently-practiced skills, phrased for parents. */
  focusSkills: FocusSkill[];
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
    const parts = [`${nickname} completed ${dash.sessions7d} learning flight${dash.sessions7d === 1 ? '' : 's'} this week`];
    if (dash.activities7d > 0) parts.push(`${dash.activities7d} activities answered`);
    if (dash.timePlayedMinutes7d > 0) {
      const mins = dash.timePlayedMinutes7d;
      const timeLabel = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
      parts.push(`about ${timeLabel} of learning time`);
    }
    parts.push(`earning ${dash.stars7d} stars and ${dash.points7d} points`);
    bullets.push(parts.join(', ') + '.');
  }

  if (dash.streak >= 2) {
    bullets.push(
      `${nickname} is on a ${dash.streak}-day streak${dash.longestStreak > dash.streak ? ` (best ever: ${dash.longestStreak} days)` : ''} — daily practice is building strong habits.`,
    );
  }

  if (dash.questsCompleted7d > 0) {
    bullets.push(
      `${nickname} finished ${dash.questsCompleted7d} daily quest${dash.questsCompleted7d === 1 ? '' : 's'} this week.`,
    );
  }

  if (dash.topSkills.length > 0) {
    const top = dash.topSkills
      .map((s) => `${s.skillName} (${s.attempts} ${s.attempts === 1 ? 'try' : 'tries'})`)
      .join(', ');
    bullets.push(`Most practiced this week: ${top}.`);
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
