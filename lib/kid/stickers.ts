/**
 * Sticker book: collectible rewards kids earn for learning.
 * Each sticker has an id, name, the character who gives it, and colors
 * for its badge. Earned via awardSticker(); displayed in the sticker book.
 */

export interface Sticker {
  id: string;
  name: string;
  description: string;
  characterId: string;
  /** Badge background gradient stops. */
  colors: [string, string];
}

export const STICKERS: Sticker[] = [
  // Character friends (meet them by visiting their island)
  { id: 'friend-curio', name: 'Captain Curio', description: 'Met Captain Curio, the sky captain!', characterId: 'curio', colors: ['#FF9A3D', '#FF6B6B'] },
  { id: 'friend-nova', name: 'Nova Buddy', description: 'Nova is your trying-again buddy!', characterId: 'nova', colors: ['#FFB84D', '#FF8C42'] },
  { id: 'friend-luna', name: 'Luna Bookworm', description: 'Read with Luna the owl!', characterId: 'luna', colors: ['#9B7EDE', '#6C4FD8'] },
  { id: 'friend-milo', name: 'Milo Beep-Boop', description: 'Counted with Milo the robot!', characterId: 'milo', colors: ['#5BC8E8', '#2E9BC6'] },
  { id: 'friend-bea', name: 'Bea Buzz', description: 'Explored with Bea the bee!', characterId: 'bea', colors: ['#FFD93D', '#F5A623'] },
  { id: 'friend-tuno', name: 'Tuno Calm', description: 'Breathed deep with Tuno!', characterId: 'tuno', colors: ['#7ED6A5', '#3FA97C'] },
  { id: 'friend-riff', name: 'Riff Groove', description: 'Made music with Riff!', characterId: 'riff', colors: ['#FF7BAC', '#E84A7F'] },
  { id: 'friend-atlas', name: 'Atlas Explorer', description: 'Explored the world with Atlas!', characterId: 'atlas', colors: ['#8FB8DE', '#5B8CC0'] },
  // Subject stars (finish a session on that island)
  { id: 'star-reading', name: 'Reading Star', description: 'Finished a reading adventure!', characterId: 'luna', colors: ['#9B7EDE', '#FFD93D'] },
  { id: 'star-math', name: 'Math Star', description: 'Finished a math adventure!', characterId: 'milo', colors: ['#5BC8E8', '#FFD93D'] },
  { id: 'star-writing', name: 'Writing Star', description: 'Finished a writing adventure!', characterId: 'curio', colors: ['#FF9A3D', '#FFD93D'] },
  { id: 'star-science', name: 'Science Star', description: 'Finished a science adventure!', characterId: 'bea', colors: ['#7ED6A5', '#FFD93D'] },
  { id: 'star-geography', name: 'World Star', description: 'Finished a geography adventure!', characterId: 'atlas', colors: ['#8FB8DE', '#FFD93D'] },
  { id: 'star-coding', name: 'Coding Star', description: 'Finished a coding adventure!', characterId: 'milo', colors: ['#5BC8E8', '#9B7EDE'] },
  { id: 'star-music', name: 'Music Star', description: 'Finished a music adventure!', characterId: 'riff', colors: ['#FF7BAC', '#FFD93D'] },
  { id: 'star-drawing', name: 'Art Star', description: 'Finished a drawing adventure!', characterId: 'curio', colors: ['#FF9A3D', '#FF7BAC'] },
  { id: 'star-feelings', name: 'Feelings Star', description: 'Finished a feelings adventure!', characterId: 'tuno', colors: ['#7ED6A5', '#FFD93D'] },
  // Special achievements
  { id: 'brave-try', name: 'Brave Trier', description: 'Kept trying after a tricky one!', characterId: 'nova', colors: ['#FFB84D', '#FF6B6B'] },
  { id: 'perfect-flight', name: 'Perfect Flight', description: 'Got every game right in one flight!', characterId: 'curio', colors: ['#FFD93D', '#FF9A3D'] },
  { id: 'bookworm', name: 'Story Explorer', description: 'Finished a whole storybook!', characterId: 'luna', colors: ['#9B7EDE', '#5BC8E8'] },
  { id: 'songbird', name: 'Songbird', description: 'Sang a whole song with Riff!', characterId: 'riff', colors: ['#FF7BAC', '#9B7EDE'] },
  { id: 'sky-captain', name: 'Sky Captain', description: 'Visited every island in the sky!', characterId: 'curio', colors: ['#5BC8E8', '#FFD93D'] },
  { id: 'super-learner', name: 'Super Learner', description: 'Earned 100 points in one day!', characterId: 'nova', colors: ['#FFD93D', '#FF6B6B'] },
  { id: 'comeback-kid', name: 'Comeback Star', description: 'Came back to learn another day!', characterId: 'tuno', colors: ['#7ED6A5', '#5BC8E8'] },
  // Adventure milestones (Trail, quests, streaks)
  { id: 'trail-blazer', name: 'Trailblazer', description: 'Finished an Adventure Trail quest!', characterId: 'curio', colors: ['#FF9A3D', '#9B7EDE'] },
  { id: 'quest-hero', name: 'Quest Hero', description: 'Finished a daily quest!', characterId: 'nova', colors: ['#FFB84D', '#9B7EDE'] },
  { id: 'streak-3', name: 'Three-Day Star', description: 'Learned 3 days in a row!', characterId: 'tuno', colors: ['#7ED6A5', '#FFD93D'] },
  { id: 'streak-7', name: 'Week Warrior', description: 'Learned 7 days in a row!', characterId: 'tuno', colors: ['#3FA97C', '#FFD93D'] },
  { id: 'star-100', name: 'Star Collector', description: 'Earned 100 stars!', characterId: 'milo', colors: ['#5BC8E8', '#FFC93C'] },
  // Play & creativity
  { id: 'memory-master', name: 'Memory Master', description: 'Won a Memory Cove game!', characterId: 'luna', colors: ['#9B7EDE', '#FF7BAC'] },
  { id: 'pattern-pro', name: 'Pattern Pro', description: 'Finished a Pattern Parade!', characterId: 'milo', colors: ['#5BC8E8', '#FF7BAC'] },
  { id: 'puzzle-pro', name: 'Puzzle Pro', description: 'Solved a Puzzle Reef puzzle!', characterId: 'atlas', colors: ['#8FB8DE', '#FFD93D'] },
  { id: 'pet-pal', name: 'Pet Pal', description: 'Hatched a pet friend!', characterId: 'bea', colors: ['#FFD93D', '#7ED6A5'] },
  { id: 'pet-helper', name: 'Pet Helper', description: 'Fed your pet a yummy snack!', characterId: 'bea', colors: ['#F5A623', '#7ED6A5'] },
  { id: 'fashion-star', name: 'Fashion Star', description: 'Dressed up your avatar!', characterId: 'curio', colors: ['#FF7BAC', '#FFD93D'] },
  { id: 'night-owl', name: 'Night Owl', description: 'Read a cozy bedtime story!', characterId: 'luna', colors: ['#6C4FD8', '#5BC8E8'] },
  // Wave 3 play & creativity
  { id: 'word-wizard', name: 'Word Wizard', description: 'Spelled 10 magic words!', characterId: 'luna', colors: ['#8E6FC8', '#FFD166'] },
  { id: 'number-ninja', name: 'Number Ninja', description: 'Zoomed through Number Run!', characterId: 'milo', colors: ['#3A4A5A', '#5BC8E8'] },
  { id: 'star-gazer', name: 'Star Gazer', description: 'Breathed with the sleepy stars!', characterId: 'tuno', colors: ['#2B3A67', '#FFD93D'] },
  { id: 'little-artist', name: 'Little Artist', description: 'Made art in the Creative Studio!', characterId: 'curio', colors: ['#FF7BAC', '#FFD93C'] },
  { id: 'movie-star', name: 'Movie Star', description: 'Watched a Sky Cinema tale!', characterId: 'nova', colors: ['#FF6B6B', '#FFD93C'] },
  { id: 'sweet-dreams', name: 'Sweet Dreams', description: 'Finished a cozy bedtime!', characterId: 'luna', colors: ['#6C4FD8', '#FFD93D'] },
  // Wave 4 play & creativity
  { id: 'pen-pal', name: 'Pen Pal', description: 'Traced your ABCs!', characterId: 'luna', colors: ['#9B7EDE', '#FFD166'] },
  { id: 'globe-trotter', name: 'Globe Trotter', description: 'Explored the wide world!', characterId: 'atlas', colors: ['#8FB8DE', '#7ED6A5'] },
  { id: 'beat-master', name: 'Beat Master', description: 'Played the sky drums!', characterId: 'riff', colors: ['#FF7BAC', '#FFD93C'] },
  { id: 'jr-scientist', name: 'Junior Scientist', description: 'Ran a real experiment!', characterId: 'bea', colors: ['#7ED6A5', '#5BC8E8'] },
];

export function getSticker(id: string): Sticker | undefined {
  return STICKERS.find((s) => s.id === id);
}

/** Which stickers a finished island visit earns. */
export function stickersForIslandVisit(subjectCode: string | null): string[] {
  const earned: string[] = [];
  if (subjectCode) {
    const island = subjectCode;
    const friendMap: Record<string, string> = {
      reading: 'friend-luna',
      math: 'friend-milo',
      writing: 'friend-curio',
      science: 'friend-bea',
      geography: 'friend-atlas',
      coding: 'friend-milo',
      music: 'friend-riff',
      drawing: 'friend-curio',
      feelings: 'friend-tuno',
    };
    const starMap: Record<string, string> = {
      reading: 'star-reading',
      math: 'star-math',
      writing: 'star-writing',
      science: 'star-science',
      geography: 'star-geography',
      coding: 'star-coding',
      music: 'star-music',
      drawing: 'star-drawing',
      feelings: 'star-feelings',
    };
    if (friendMap[island]) earned.push(friendMap[island]);
    if (starMap[island]) earned.push(starMap[island]);
  } else {
    earned.push('friend-curio');
  }
  return earned;
}
