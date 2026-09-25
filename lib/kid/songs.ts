/**
 * Riff's Songbook — three original sing-along songs for ages 3-8.
 * Simple vocabulary, strong rhythm, repetitive chorus. All original.
 */

export interface SongLine {
  text: string;
}

export interface Song {
  id: string;
  title: string;
  characterId: 'riff';
  lines: SongLine[];
}

export const SONGS: Song[] = [
  {
    id: 'five-little-bunnies',
    title: 'Five Little Bunnies',
    characterId: 'riff',
    lines: [
      { text: 'One little bunny, hop hop hop!' },
      { text: 'Two little bunnies, stop stop stop!' },
      { text: 'Three little bunnies, hop hop hop!' },
      { text: 'Four little bunnies, jump so high!' },
      { text: 'Five little bunnies, touch the sky!' },
      { text: 'Five little bunnies, hop with me!' },
      { text: 'One, two, three, four, five, yay, we did it!' },
    ],
  },
  {
    id: 'colors-all-around',
    title: 'Colors All Around',
    characterId: 'riff',
    lines: [
      { text: 'Red is the apple, red red red!' },
      { text: 'Blue is the ocean, blue blue blue!' },
      { text: 'Yellow is the sunshine, yellow too!' },
      { text: 'Green is the grass where bunnies play!' },
      { text: 'Red and blue and yellow, green!' },
      { text: 'Colors all around, what a scene!' },
      { text: 'Red, blue, yellow, green, sing with me!' },
    ],
  },
  {
    id: 'try-again-song',
    title: "Riff's Try-Again Song",
    characterId: 'riff',
    lines: [
      { text: 'I tried and I fell, oh well, oh well!' },
      { text: 'I shake it off, and I feel so swell!' },
      { text: 'Try again, try again, one more time!' },
      { text: 'Try again, try again, I will shine!' },
      { text: 'Little steps, little hops, I can do it!' },
      { text: 'Never never never give up, I will do it!' },
      { text: 'I tried again, and now I can!' },
    ],
  },
];

export function getSong(id: string): Song | undefined {
  return SONGS.find((song) => song.id === id);
}
