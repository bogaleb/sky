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
