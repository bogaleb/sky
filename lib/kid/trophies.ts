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
  // Learner — practice and mastery
  { id: 'activities-10', name: 'Practice Pro', description: 'Finished 10 activities!', category: 'learner', starBonus: 10, art: 'medal' },
  { id: 'activities-50', name: 'Super Solver', description: 'Finished 50 activities!', category: 'learner', starBonus: 20, art: 'cup' },
  { id: 'activities-100', name: 'Century Star', description: 'Finished 100 activities!', category: 'learner', starBonus: 30, art: 'crown' },
  { id: 'perfect-first', name: 'Perfect Flight', description: 'Got every answer right in one session!', category: 'learner', starBonus: 15, art: 'star' },
  { id: 'perfect-trio', name: 'Triple Perfect', description: 'Three perfect sessions! Amazing!', category: 'learner', starBonus: 30, art: 'crown' },
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
  | 'bedtime_done';
