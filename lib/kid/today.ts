import type { AgeBand } from '@/lib/planner/types';
import type { AgeProfile } from './age-profile';
import { GAME_META, gameFitsAge } from './game-catalog';
import type { SkillMasterySnapshot } from './garden';

/**
 * Today's path: the 3–4 things a child does first when they open Sky.
 *
 * Replaces "pick from 9 islands and 30 games" with a short, planned route
 * built from learning science:
 *   1. a lesson from the adaptive planner (retrieval + new material),
 *   2. a game for the skill most due for spaced review,
 *   3. a game from a DIFFERENT subject (interleaving),
 *   4. a story (or, for older children, a creative break).
 * Everything else stays reachable, but the default is guided. Pure.
 */

export type StopKind = 'lesson' | 'game' | 'story';
export type StopReason = 'lesson' | 'review' | 'practice' | 'new' | 'story' | 'create';

export interface PathStop {
  key: string;
  kind: StopKind;
  /** Registry id when kind === 'game'. */
  gameId?: string;
  reason: StopReason;
  /** Skill this stop practices, when known (for the parent-facing "why"). */
  skill?: string;
}

export interface GameRef {
  id: string;
  group: string;
  hidden?: boolean;
}

export interface TodayInput {
  profile: AgeProfile;
  games: GameRef[];
  skills: SkillMasterySnapshot[];
  now: Date;
}

export interface TodayPlan {
  path: PathStop[];
  /** Free-play shelf: age-appropriate games not already on the path. */
  shelf: string[];
}

/** Deterministic daily seed so the plan is stable for a day, fresh the next. */
export function daySeed(now: Date): number {
  return now.getFullYear() * 10_000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function rotate<T>(items: T[], seed: number): T[] {
  if (items.length === 0) return items;
  const k = seed % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

/** Skills ordered by how much they need practice right now. */
export function skillsByNeed(skills: SkillMasterySnapshot[], now: Date): SkillMasterySnapshot[] {
  const t = now.getTime();
  const due = skills
    .filter((s) => s.status && s.status !== 'mastered' && s.nextReviewAt && Date.parse(s.nextReviewAt) <= t)
    .sort((a, b) => Date.parse(a.nextReviewAt!) - Date.parse(b.nextReviewAt!));
  const weak = skills
    .filter((s) => (s.status === 'emerging' || s.status === 'developing') && !due.includes(s))
    .sort((a, b) => Date.parse(a.lastPracticedAt ?? '0') - Date.parse(b.lastPracticedAt ?? '0'));
  return [...due, ...weak];
}

function learningGamesFor(band: AgeBand, games: GameRef[]): GameRef[] {
  return games.filter((g) => !g.hidden && gameFitsAge(g.id, band) && (GAME_META[g.id]?.skills.length ?? 0) > 0);
}

export function buildToday({ profile, games, skills, now }: TodayInput): TodayPlan {
  const seed = daySeed(now);
  const band = profile.band;
  const learning = rotate(learningGamesFor(band, games), seed);
  const path: PathStop[] = [{ key: 'lesson', kind: 'lesson', reason: 'lesson' }];
  const usedGames = new Set<string>();
  const usedGroups = new Set<string>();
  // Lesson + games, keeping the final slot for the calm / creative stop.
  const gameSlots = profile.pathLength - 1;

  const pickFor = (skill: SkillMasterySnapshot): GameRef | undefined =>
    learning.find(
      (g) => !usedGames.has(g.id) && !usedGroups.has(g.group) && GAME_META[g.id].skills.includes(skill.code as never)
    );

  // Review / practice stops: the neediest skills, one subject group each.
  for (const skill of skillsByNeed(skills, now)) {
    if (path.length >= gameSlots) break;
    const game = pickFor(skill);
    if (!game) continue;
    const isDue = !!skill.nextReviewAt && Date.parse(skill.nextReviewAt) <= now.getTime();
    path.push({ key: `game-${game.id}`, kind: 'game', gameId: game.id, reason: isDue ? 'review' : 'practice', skill: skill.code });
    usedGames.add(game.id);
    usedGroups.add(game.group);
  }

  // Not enough history yet: try something new, still interleaving subjects.
  for (const game of learning) {
    if (path.length >= gameSlots) break;
    if (usedGames.has(game.id) || usedGroups.has(game.group)) continue;
    path.push({ key: `game-${game.id}`, kind: 'game', gameId: game.id, reason: 'new', skill: GAME_META[game.id].skills[0] });
    usedGames.add(game.id);
    usedGroups.add(game.group);
  }

  // The last stop is a calm or creative one: a story for younger children,
  // a making activity for older ones (on alternate days).
  const creative = band === '7-8' && seed % 2 === 0;
  const last: PathStop = creative
    ? { key: 'game-studio', kind: 'game', gameId: 'studio', reason: 'create' }
    : { key: 'story', kind: 'story', reason: 'story' };
  path.push(last);
  if (last.gameId) usedGames.add(last.gameId);

  const shelf = rotate(
    games.filter((g) => !g.hidden && gameFitsAge(g.id, band) && !usedGames.has(g.id)).map((g) => g.id),
    seed * 7
  ).slice(0, profile.shelfSize);

  return { path, shelf };
}
