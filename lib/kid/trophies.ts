/**
 * Trophy shelf: achievement trophies kids earn for learning milestones.
 * Each trophy has an id, kid-readable name/description, a category, a star
 * bonus granted on first award, and an art key for the shelf display.
 * Awarded via awardTrophy() / checkTrophies() in app/actions/trophies.ts.
 */

export type TrophyCategory = 'explorer' | 'learner' | 'collector' | 'friend';

export type TrophyArt = 'star' | 'medal' | 'cup' | 'crown' | 'gem' | 'ribbon';

export interface Trophy {
  id: string;
  name: string;
  description: string;
  category: TrophyCategory;
  /** Stars granted to the wallet the first time this trophy is earned. */
  starBonus: number;
  art: TrophyArt;
}

export const TROPHY_CATEGORIES: Record<TrophyCategory, { label: string; hint: string }> = {
  explorer: { label: 'Explorer', hint: 'First times and big journeys' },
  learner: { label: 'Learner', hint: 'Practice and perfect flights' },
  collector: { label: 'Collector', hint: 'Stars and treasures' },
  friend: { label: 'Friend', hint: 'Streaks and daily quests' },
};

export const TROPHIES: Trophy[] = [
  // Explorer — firsts and journeys
  { id: 'first-flight', name: 'First Flight', description: 'Finished your very first activity!', category: 'explorer', starBonus: 5, art: 'star' },
  { id: 'trail-chapter-1', name: 'Chapter Champion', description: 'Finished the whole first chapter of the Adventure Trail!', category: 'explorer', starBonus: 25, art: 'medal' },
  { id: 'pet-hatched', name: 'New Friend', description: 'Hatched your pet egg!', category: 'explorer', starBonus: 10, art: 'ribbon' },
  { id: 'memory-first', name: 'Memory Explorer', description: 'Played your first Memory Cove game!', category: 'explorer', starBonus: 10, art: 'gem' },
  { id: 'story-first', name: 'Story Explorer', description: 'Read your first storybook tale!', category: 'explorer', starBonus: 10, art: 'ribbon' },
  { id: 'song-first', name: 'Songbird', description: 'Sang your first songbook song!', category: 'explorer', starBonus: 10, art: 'ribbon' },
  { id: 'pattern-first', name: 'Pattern Pioneer', description: 'Played your first Pattern Parade game!', category: 'explorer', starBonus: 10, art: 'star' },
  { id: 'puzzle-first', name: 'Puzzle Pro', description: 'Solved your first Puzzle Reef puzzle!', category: 'explorer', starBonus: 10, art: 'gem' },
  { id: 'word-first', name: 'Word Wizard', description: 'Played your first Word Builder game!', category: 'explorer', starBonus: 10, art: 'star' },
  { id: 'number-first', name: 'Number Explorer', description: 'Played your first Number Run race!', category: 'explorer', starBonus: 10, art: 'medal' },
  { id: 'cinema-first', name: 'Movie Star', description: 'Watched your first Story Cinema tale!', category: 'explorer', starBonus: 10, art: 'ribbon' },
  { id: 'art-first', name: 'Little Artist', description: 'Saved your first Creative Studio artwork!', category: 'explorer', starBonus: 10, art: 'gem' },
  { id: 'bedtime-first', name: 'Sleepy Star', description: 'Finished a cozy bedtime wind-down!', category: 'explorer', starBonus: 10, art: 'ribbon' },
  { id: 'writing-first', name: 'First Strokes', description: 'Traced your first ABCs in the Letter Lab!', category: 'explorer', starBonus: 10, art: 'star' },
  { id: 'geography-first', name: 'Globe Explorer', description: 'Played your first Atlas World Tour game!', category: 'explorer', starBonus: 10, art: 'gem' },
  { id: 'rhythm-first', name: 'Rhythm Rookie', description: 'Played your first Rhythm Studio tune!', category: 'explorer', starBonus: 10, art: 'ribbon' },
  { id: 'science-first', name: 'Young Scientist', description: 'Ran your first Science Lab experiment!', category: 'explorer', starBonus: 10, art: 'medal' },
  { id: 'coding-first', name: 'Code Captain', description: 'Guided Milo through the Coding Cove!', category: 'explorer', starBonus: 15, art: 'gem' },
  { id: 'phonics-first', name: 'Sound Sleuth', description: 'Blended your first word in Phonics Fun!', category: 'explorer', starBonus: 10, art: 'star' },
  { id: 'welcome-first', name: 'Sky Newcomer', description: 'Finished the Welcome Quest!', category: 'explorer', starBonus: 10, art: 'star' },
  { id: 'goal-first', name: 'Goal Getter', description: 'Smashed your weekly learning goal!', category: 'explorer', starBonus: 15, art: 'cup' },
  { id: 'collector-first', name: 'Curious Collector', description: 'Filled your animal book!', category: 'explorer', starBonus: 25, art: 'crown' },
  { id: 'time-first', name: 'Clock Star', description: 'Told time in the Clock Tower!', category: 'explorer', starBonus: 10, art: 'medal' },
  { id: 'money-first', name: 'Coin Collector', description: 'Counted coins in Coin Cove!', category: 'explorer', starBonus: 10, art: 'gem' },
  { id: 'showdown-first', name: 'Friendly Rival', description: 'Finished a sibling Star Sprint!', category: 'explorer', starBonus: 15, art: 'cup' },
  { id: 'movie-first', name: 'Movie Director', description: 'Premiered your first cartoon!', category: 'explorer', starBonus: 15, art: 'ribbon' },
  { id: 'homes-first', name: 'Home Explorer', description: 'Visited every character home!', category: 'explorer', starBonus: 20, art: 'crown' },
  { id: 'feelings-first', name: 'Feelings Friend', description: 'Named big feelings with Tuno!', category: 'explorer', starBonus: 10, art: 'ribbon' },
  { id: 'color-first', name: 'Color Wizard', description: 'Mixed magical colors in the lab!', category: 'explorer', starBonus: 10, art: 'gem' },
  { id: 'rhyme-first', name: 'Rhyme Star', description: 'Rhymed words with Luna!', category: 'explorer', starBonus: 10, art: 'star' },
  { id: 'playground-first', name: 'Playground Pro', description: 'Played every pet playground game!', category: 'explorer', starBonus: 15, art: 'medal' },
  { id: 'fraction-first', name: 'Fraction Fan', description: 'Shared pizzas fairly at Fraction Fair!', category: 'explorer', starBonus: 10, art: 'star' },
  { id: 'avatar-first', name: 'Avatar Artist', description: 'Designed your very own avatar!', category: 'explorer', starBonus: 10, art: 'gem' },
  { id: 'sentence-first', name: 'Sentence Scribe', description: 'Built super sentences in Sentence Studio!', category: 'explorer', starBonus: 10, art: 'star' },
  { id: 'measure-first', name: 'Measure Master', description: 'Measured everything in Measure Meadow!', category: 'explorer', starBonus: 10, art: 'medal' },
  { id: 'opposites-first', name: 'Opposites Ace', description: 'Mastered opposites in the Attic!', category: 'explorer', starBonus: 10, art: 'gem' },
  // Learner — practice and mastery
  { id: 'activities-10', name: 'Practice Pro', description: 'Finished 10 activities!', category: 'learner', starBonus: 10, art: 'medal' },
  { id: 'activities-50', name: 'Super Solver', description: 'Finished 50 activities!', category: 'learner', starBonus: 20, art: 'cup' },
  { id: 'activities-100', name: 'Century Star', description: 'Finished 100 activities!', category: 'learner', starBonus: 30, art: 'crown' },
  { id: 'perfect-first', name: 'Perfect Flight', description: 'Got every answer right in one session!', category: 'learner', starBonus: 15, art: 'star' },
  { id: 'perfect-trio', name: 'Triple Perfect', description: 'Three perfect sessions! Amazing!', category: 'learner', starBonus: 30, art: 'crown' },
  // Learner — mastery tiers (driven by the Wave-11 skill_mastery engine;
  // evaluated on every trophy check in app/actions/trophies.ts)
  { id: 'mastery-2', name: 'Skill Sprout', description: 'Reached level 2 in a skill — look at you grow!', category: 'learner', starBonus: 15, art: 'star' },
  { id: 'mastery-3', name: 'Mastery Bloom', description: 'Reached level 3 in a skill — your learning is blooming!', category: 'learner', starBonus: 25, art: 'gem' },
  { id: 'mastery-trio', name: 'Triple Grower', description: 'Reached level 3 in three different skills!', category: 'learner', starBonus: 30, art: 'cup' },
  { id: 'mastery-5', name: 'Sky Master', description: 'Reached the very top level in a skill!', category: 'learner', starBonus: 50, art: 'crown' },
  // Collector — stars and treasures
  { id: 'stars-100', name: 'Star Collector', description: 'Earned 100 stars in total!', category: 'collector', starBonus: 15, art: 'gem' },
  { id: 'stars-500', name: 'Shooting Star', description: 'Earned 500 stars in total!', category: 'collector', starBonus: 25, art: 'gem' },
  { id: 'stars-1000', name: 'Superstar', description: 'Earned 1,000 stars in total!', category: 'collector', starBonus: 40, art: 'crown' },
  { id: 'outfit-first', name: 'New Look', description: 'Bought your first outfit!', category: 'collector', starBonus: 10, art: 'ribbon' },
  { id: 'outfit-five', name: 'Fashion Star', description: 'Own 5 outfits!', category: 'collector', starBonus: 20, art: 'cup' },
  { id: 'pet-grown', name: 'Grown-Up Buddy', description: 'Raised your pet all the way up!', category: 'collector', starBonus: 25, art: 'cup' },
  // Friend — streaks and daily quests
  { id: 'streak-3', name: 'Three-Day Streak', description: 'Learned 3 days in a row!', category: 'friend', starBonus: 15, art: 'medal' },
  { id: 'streak-7', name: 'Week Warrior', description: 'Learned 7 days in a row!', category: 'friend', starBonus: 30, art: 'crown' },
  { id: 'quest-first', name: 'Quest Starter', description: 'Finished your first daily quest!', category: 'friend', starBonus: 10, art: 'star' },
  { id: 'quest-trio', name: 'Quest Hero', description: 'Finished 3 daily quests in one day!', category: 'friend', starBonus: 20, art: 'medal' },
];

export function getTrophy(id: string): Trophy | undefined {
  return TROPHIES.find((t) => t.id === id);
}

/**
 * Mastery-tier awards. `levels` are the child's per-skill current_level
 * values from skill_mastery. Pure — the server action applies the grants
 * idempotently.
 */

/** Mastery level that counts as real, durable learning. */
export const MASTERY_LEVEL_REAL = 3;
/** Top mastery level in the engine. */
export const MASTERY_LEVEL_TOP = 5;

/** Trophy ids unlocked by the child's per-skill mastery levels. */
export function masteryTrophyIdsForLevels(levels: number[]): string[] {
  const clean = levels.filter((l) => Number.isFinite(l));
  const max = clean.length > 0 ? Math.max(...clean) : 0;
  const ids: string[] = [];
  if (max >= 2) ids.push('mastery-2');
  if (max >= MASTERY_LEVEL_REAL) ids.push('mastery-3');
  if (clean.filter((l) => l >= MASTERY_LEVEL_REAL).length >= 3) ids.push('mastery-trio');
  if (max >= MASTERY_LEVEL_TOP) ids.push('mastery-5');
  return ids;
}

/** Sticker ids mirroring the mastery trophies (same unlock moments). */
export function masteryStickerIdsForLevels(levels: number[]): string[] {
  const clean = levels.filter((l) => Number.isFinite(l));
  const max = clean.length > 0 ? Math.max(...clean) : 0;
  const ids: string[] = [];
  if (max >= 2) ids.push('skill-sprout');
  if (max >= MASTERY_LEVEL_REAL) ids.push('bloom-bright');
  if (max >= MASTERY_LEVEL_TOP) ids.push('sky-master');
  return ids;
}

/**
 * Real mastery in at least one skill — the gate for the flashiest crowns
 * ('stars-1000', 'perfect-trio'), so grind alone can't earn them.
 */
export function hasRealMastery(levels: number[]): boolean {
  return levels.some((l) => l >= MASTERY_LEVEL_REAL);
}

/** Events that can earn trophies, fired from gameplay touchpoints. */
export type TrophyEvent =
  | 'activity_complete'
  | 'session_complete'
  | 'perfect_session'
  | 'streak_day'
  | 'quest_done'
  | 'trail_chapter'
  | 'pet_hatched'
  | 'pet_grown'
  | 'outfit_bought'
  | 'memory_done'
  | 'story_done'
  | 'song_done'
  | 'pattern_done'
  | 'puzzle_done'
  | 'word_done'
  | 'number_done'
  | 'cinema_done'
  | 'art_done'
  | 'bedtime_done'
  | 'writing_done'
  | 'geography_done'
  | 'rhythm_done'
  | 'science_done'
  | 'coding_done'
  | 'phonics_done'
  | 'onboarding_done'
  | 'goal_done'
  | 'collection_done'
  | 'time_done'
  | 'money_done'
  | 'showdown_done'
  | 'movie_done'
  | 'homes_done'
  | 'feelings_done'
  | 'color_done'
  | 'rhyme_done'
  | 'playground_done'
  | 'fraction_done'
  | 'avatar_done'
  | 'sentence_done'
  | 'measure_done'
  | 'opposites_done';
