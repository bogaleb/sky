/**
 * The Sky archipelago: one floating island per subject, each with its
 * host character, signature colors, and decorative theme.
 */

export interface Island {
  subjectCode: string;
  subjectName: string;
  islandName: string;
  hostCharacter: string;
  /** Primary island color. */
  color: string;
  /** Secondary/accent color. */
  accent: string;
  /** Sky gradient behind the island. */
  sky: [string, string];
  /** Decorative motif drawn on the island. */
  motif: 'books' | 'volcano' | 'garden' | 'telescope' | 'palette' | 'notes' | 'gears' | 'moon' | 'pencil';
  tagline: string;
}

export const ISLANDS: Island[] = [
  {
    subjectCode: 'reading',
    subjectName: 'Reading',
    islandName: 'The Floating Library',
    hostCharacter: 'luna',
    color: '#8B7BC7',
    accent: '#FFD166',
    sky: ['#B8A9E0', '#7C6BB0'],
    motif: 'books',
    tagline: 'Open a story with Luna',
  },
  {
    subjectCode: 'math',
    subjectName: 'Math',
    islandName: 'The Number Volcano',
    hostCharacter: 'milo',
    color: '#FF8C42',
    accent: '#FFD166',
    sky: ['#FFB37E', '#E86A33'],
    motif: 'volcano',
    tagline: 'Count and erupt with Milo',
  },
  {
    subjectCode: 'writing',
    subjectName: 'Writing',
    islandName: 'Inkwell Isle',
    hostCharacter: 'curio',
    color: '#2EC4B6',
    accent: '#FFD166',
    sky: ['#7FE3D4', '#1A9E92'],
    motif: 'pencil',
    tagline: 'Write with Captain Curio',
  },
  {
    subjectCode: 'science',
    subjectName: 'Science',
    islandName: 'The Greenhouse',
    hostCharacter: 'bea',
    color: '#7FB069',
    accent: '#FFC93C',
    sky: ['#A8D5A2', '#5C9455'],
    motif: 'garden',
    tagline: 'Discover with Bea',
  },
  {
    subjectCode: 'geography',
    subjectName: 'Geography',
    islandName: 'The Observatory',
    hostCharacter: 'atlas',
    color: '#4A6FA5',
    accent: '#FFD166',
    sky: ['#6E8FC2', '#2E4A73'],
    motif: 'telescope',
    tagline: 'Explore the world with Atlas',
  },
  {
    subjectCode: 'coding',
    subjectName: 'Coding',
    islandName: 'The Loom Cloud',
    hostCharacter: 'milo',
    color: '#4CC9F0',
    accent: '#FFD166',
    sky: ['#8FE3FF', '#2A9DC4'],
    motif: 'gears',
    tagline: 'Build patterns with Milo',
  },
  {
    subjectCode: 'music',
    subjectName: 'Music',
    islandName: 'The Rhythm Stage',
    hostCharacter: 'riff',
    color: '#F15BB5',
    accent: '#FFD166',
    sky: ['#FF9ED2', '#C23A86'],
    motif: 'notes',
    tagline: 'Make music with Riff',
  },
  {
    subjectCode: 'drawing',
    subjectName: 'Drawing',
    islandName: 'The Painted Atelier',
    hostCharacter: 'curio',
    color: '#FF6B6B',
    accent: '#FFD166',
    sky: ['#FFA8A8', '#E05252'],
    motif: 'palette',
    tagline: 'Paint with Captain Curio',
  },
  {
    subjectCode: 'feelings',
    subjectName: 'Feelings & Focus',
    islandName: 'The Quiet Cloud',
    hostCharacter: 'tuno',
    color: '#9B8EC4',
    accent: '#B8E0D2',
    sky: ['#C5BBE8', '#7A6BA8'],
    motif: 'moon',
    tagline: 'Rest and breathe with Tuno',
  },
];

export function getIsland(subjectCode: string): Island {
  return ISLANDS.find((i) => i.subjectCode === subjectCode) ?? ISLANDS[0];
}
