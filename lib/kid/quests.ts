// Sky daily quests — three small missions per day that give kids a reason
// to come back. Deterministic: the same child gets the same three quests
// all day, and a fresh set tomorrow. Progress is tracked in
// public.quest_progress; quest definitions live here.

export interface QuestDef {
  id: string;
  title: string;
  detail: string;
  goal: number;
  /** Unit shown to kids, e.g. "activities". */
  unit: string;
  stars: number; // bonus stars on completion
}

const QUEST_POOL: QuestDef[] = [
  { id: 'trail_quest', title: 'Trailblazer', detail: 'Finish a Trail quest', goal: 1, unit: 'quest', stars: 15 },
  { id: 'activities_6', title: 'Busy Explorer', detail: 'Play 6 activities', goal: 6, unit: 'activities', stars: 10 },
  { id: 'islands_2', title: 'Island Hopper', detail: 'Visit 2 islands', goal: 2, unit: 'islands', stars: 10 },
  { id: 'stars_50', title: 'Star Collector', detail: 'Earn 50 stars', goal: 50, unit: 'stars', stars: 10 },
  { id: 'memory_game', title: 'Memory Master', detail: 'Play a round of Memory Cove', goal: 1, unit: 'round', stars: 12 },
  { id: 'pattern_game', title: 'Pattern Pro', detail: 'Play a round of Pattern Parade', goal: 1, unit: 'round', stars: 12 },
  { id: 'puzzle_game', title: 'Puzzle Solver', detail: 'Solve a Puzzle Reef puzzle', goal: 1, unit: 'puzzle', stars: 12 },
  { id: 'word_game', title: 'Word Wizard', detail: 'Play a round of Word Builder', goal: 1, unit: 'round', stars: 12 },
  { id: 'number_game', title: 'Number Ninja', detail: 'Play a round of Number Run', goal: 1, unit: 'round', stars: 12 },
  { id: 'writing_game', title: 'Pen Pal', detail: 'Trace letters in the Letter Lab', goal: 1, unit: 'round', stars: 12 },
  { id: 'geography_game', title: 'World Explorer', detail: 'Play a round of Atlas World Tour', goal: 1, unit: 'round', stars: 12 },
  { id: 'rhythm_game', title: 'Beat Master', detail: 'Play a tune in the Rhythm Studio', goal: 1, unit: 'tune', stars: 12 },
  { id: 'science_game', title: 'Young Scientist', detail: 'Run experiments in the Science Lab', goal: 1, unit: 'session', stars: 12 },
  { id: 'coding_game', title: 'Code Captain', detail: 'Guide Milo through a maze in the Coding Cove', goal: 1, unit: 'session', stars: 12 },
  { id: 'phonics_game', title: 'Sound Sleuth', detail: 'Blend words in Phonics Fun', goal: 1, unit: 'session', stars: 12 },
  { id: 'time_game', title: 'Clock Watcher', detail: 'Tell time in the Clock Tower', goal: 1, unit: 'session', stars: 12 },
  { id: 'money_game', title: 'Coin Counter', detail: 'Count coins in Coin Cove', goal: 1, unit: 'session', stars: 12 },
  { id: 'movie_game', title: 'Movie Director', detail: 'Direct a cartoon in Movie Studio', goal: 1, unit: 'premiere', stars: 12 },
  { id: 'feelings_game', title: 'Feelings Friend', detail: 'Name big feelings with Tuno', goal: 1, unit: 'session', stars: 12 },
  { id: 'color_game', title: 'Color Scientist', detail: 'Mix colors in the Color Mix Lab', goal: 1, unit: 'session', stars: 12 },
  { id: 'rhyme_game', title: 'Rhyme Star', detail: 'Rhyme words with Luna', goal: 1, unit: 'session', stars: 12 },
  { id: 'pet_play', title: 'Pet Playdate', detail: 'Play all 3 playground games with your pet', goal: 1, unit: 'playdate', stars: 12 },
  { id: 'perfect_3', title: 'Sharpshooter', detail: 'Get 3 answers right in a row', goal: 3, unit: 'in a row', stars: 12 },
  { id: 'pet_fed', title: 'Good Friend', detail: 'Feed your pet', goal: 1, unit: 'meal', stars: 8 },
  { id: 'story_read', title: 'Bookworm', detail: 'Read a storybook tale', goal: 1, unit: 'story', stars: 8 },
  { id: 'song_sung', title: 'Songbird', detail: 'Sing a songbook song', goal: 1, unit: 'song', stars: 8 },
];

/** Deterministic daily quest date key (YYYY-MM-DD) in the child's timezone. */
export function questDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Simple string hash for deterministic daily selection. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pick 3 distinct quests for this child + date, deterministically. */
export function dailyQuests(childId: string, dateKey: string = questDateKey()): QuestDef[] {
  const picks: QuestDef[] = [];
  const used = new Set<number>();
  let salt = 0;
  while (picks.length < 3 && salt < 100) {
    const idx = hashStr(`${childId}|${dateKey}|${salt}`) % QUEST_POOL.length;
    salt++;
    if (used.has(idx)) continue;
    used.add(idx);
    picks.push(QUEST_POOL[idx]);
  }
  return picks;
}

export function getQuestDef(questId: string): QuestDef | undefined {
  return QUEST_POOL.find((q) => q.id === questId);
}
