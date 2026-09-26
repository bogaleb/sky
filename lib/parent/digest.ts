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
  /**
   * Weekly growth for this skill, or null when there was no mastery
   * movement this week. Derived from the last-7-days attempt stream in
   * learning_events (see estimateWeekStartLevel) — no history table exists.
   */
  masteryDelta: MasteryDelta | null;
}

/**
 * Per-skill weekly growth. `toLevel` is exact (skill_mastery.current_level);
 * `fromLevel` is estimated from the difficulty of the child's opening
 * practice this week (learning_events attempt rows carry item difficulty,
 * not mastery level, and level-ups are never logged). `reachedMastery` is
 * exact (skill_mastery.mastered_at).
 */
export interface MasteryDelta {
  /** Estimated level at the start of the week; null when it can't be estimated. */
  fromLevel: number | null;
  /** Current level 1-5 (exact). */
  toLevel: number;
  /** True when the skill hit 'mastered' this week (exact). */
  reachedMastery: boolean;
}

/** One attempt's evidence, as read from learning_events. */
export interface MasteryAttempt {
  /** Item difficulty 1-5, or null when the event didn't record one. */
  difficultyLevel: number | null;
  /** ISO timestamp of the attempt. */
  at: string;
}

/**
 * Estimate the child's level at the start of the week: the difficulty of
 * their earliest attempt on/after the week boundary. Rationale: a level-up
 * L→L+1 requires 8+ correct answers at item difficulty ≥ L with ≥80%
 * accuracy, so the child must actually play at that difficulty for the level
 * to move — the week's opening practice difficulty closely tracks the
 * starting level. Using the earliest *in-window* attempt (rather than the
 * latest pre-window one) avoids crediting stale growth: if the level-up
 * happened last week, this week's opening difficulty already reflects the
 * new level. Limitation: review items served below mastery at the week's
 * opening can overstate the gap.
 */
export function estimateWeekStartLevel(
  attempts: MasteryAttempt[],
  weekStartIso: string,
): number | null {
  let earliest: MasteryAttempt | null = null;
  for (const a of attempts) {
    if (a.at < weekStartIso) continue;
    if (a.difficultyLevel == null) continue;
    if (earliest === null || a.at < earliest.at) earliest = a;
  }
  return earliest?.difficultyLevel ?? null;
}

/**
 * Decide whether a skill shows weekly growth. Returns null (show nothing)
 * when the skill wasn't practiced this week, when the estimated start level
 * isn't below the current level, or when a mastered skill's mastery predates
 * the week (a mastered level can't move — any gap would be stale review play).
 */
export function buildMasteryDelta(opts: {
  currentLevel: number;
  status: string;
  masteredAt: string | null;
  weekStartIso: string;
  attempts: MasteryAttempt[];
}): MasteryDelta | null {
  const { currentLevel, status, masteredAt, weekStartIso, attempts } = opts;
  const practicedThisWeek = attempts.some((a) => a.at >= weekStartIso);
  if (!practicedThisWeek) return null;
  const fromLevel = estimateWeekStartLevel(attempts, weekStartIso);
  if (status === 'mastered') {
    const reachedMastery = masteredAt != null && masteredAt >= weekStartIso;
    return reachedMastery
      ? { fromLevel, toLevel: currentLevel, reachedMastery: true }
      : null;
  }
  if (fromLevel == null || fromLevel >= currentLevel) return null;
  return { fromLevel, toLevel: currentLevel, reachedMastery: false };
}

/** Parent-facing sentence for a skill's weekly growth. */
export function describeMasteryDelta(d: MasteryDelta): string {
  if (d.reachedMastery) return 'reached mastery this week';
  if (d.fromLevel == null) return `reached level ${d.toLevel} this week`;
  return `grew from level ${d.fromLevel} → ${d.toLevel} this week`;
}

/** Compact form for the weekly digest bullet. */
export function masteryDeltaShort(d: MasteryDelta): string {
  if (d.reachedMastery) return 'reached mastery';
  if (d.fromLevel == null) return `reached level ${d.toLevel}`;
  return `level ${d.fromLevel} → ${d.toLevel}`;
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

  const growth = dash.skillMastery.flatMap((s) =>
    s.masteryDelta ? [{ name: s.skillName, delta: s.masteryDelta }] : [],
  );
  if (growth.length > 0) {
    const shown = growth.slice(0, 3);
    const parts = shown.map((g) => `${g.name} (${masteryDeltaShort(g.delta)})`).join('; ');
    const more = growth.length > shown.length ? `, and ${growth.length - shown.length} more` : '';
    bullets.push(`Level-ups this week: ${parts}${more}.`);
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
