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
  /** Energy of the song: calm for wind-down, upbeat for playtime. */
  mood?: 'calm' | 'upbeat';
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
  // --- Calm songs (wind-down, bedtime, quiet time) ---
  {
    id: 'twinkle-down-to-sleep',
    title: 'Twinkle Down to Sleep',
    characterId: 'riff',
    mood: 'calm',
    lines: [
      { text: 'Close your eyes, the day is done,' },
      { text: 'The sleepy moon has just begun.' },
      { text: 'Stars are peeking, one by one,' },
      { text: 'Dreamland waits, come join the fun.' },
      { text: 'Twinkle down, twinkle down to sleep,' },
      { text: 'Soft and cozy, warm and deep,' },
      { text: 'Twinkle down, twinkle down to sleep,' },
      { text: 'Goodnight, goodnight, my dreams to keep.' },
    ],
  },
  {
    id: 'breathe-like-tuno',
    title: 'Breathe Like Tuno',
    characterId: 'riff',
    mood: 'calm',
    lines: [
      { text: 'Breathe in slow, like Tuno the turtle,' },
      { text: 'Fill your belly, big and round.' },
      { text: 'Breathe out slow, let the wiggles go,' },
      { text: 'Feel your feet upon the ground.' },
      { text: 'In and out, in and out,' },
      { text: 'Calm and cozy, there is no doubt,' },
      { text: 'In and out, in and out,' },
      { text: 'Breathe like Tuno, calm and slow.' },
    ],
  },
  {
    id: 'rain-on-the-leaves',
    title: 'Rain on the Leaves',
    characterId: 'riff',
    mood: 'calm',
    lines: [
      { text: 'Pitter patter, rain is falling,' },
      { text: 'On the leaves, I hear it calling.' },
      { text: 'Drip drop down the windowpane,' },
      { text: 'Washing clean the dusty lane.' },
      { text: 'Rain, rain, soft and sweet,' },
      { text: 'Dancing down to tap my feet,' },
      { text: 'Rain, rain, soft and sweet,' },
      { text: 'Nature’s song is such a treat.' },
    ],
  },
  // --- Upbeat songs (movement, playtime, celebrations) ---
  {
    id: 'stomp-like-an-elephant',
    title: 'Stomp Like an Elephant',
    characterId: 'riff',
    mood: 'upbeat',
    lines: [
      { text: 'Stomp, stomp, stomp like Atlas the elephant,' },
      { text: 'Big and strong and proud!' },
      { text: 'Swing your trunk from side to side,' },
      { text: 'And trumpet really loud!' },
      { text: 'Stomp it, stomp it, feel the beat,' },
      { text: 'Stomping with your happy feet,' },
      { text: 'Stomp it, stomp it, feel the beat,' },
      { text: 'Elephant stomp, isn’t it neat!' },
    ],
  },
  {
    id: 'wiggle-and-giggle',
    title: 'Wiggle and Giggle',
    characterId: 'riff',
    mood: 'upbeat',
    lines: [
      { text: 'Wiggle your shoulders, wiggle your knees,' },
      { text: 'Wiggle like jelly in the breeze!' },
      { text: 'Shake your sillies, shake them out,' },
      { text: 'Then giggle, giggle, twist about!' },
      { text: 'Wiggle, giggle, wiggle, giggle,' },
      { text: 'Silly dancing makes me jiggle,' },
      { text: 'Wiggle, giggle, wiggle, giggle,' },
      { text: 'Dance until your toes go tingle!' },
    ],
  },
  {
    id: 'we-are-explorers',
    title: 'We Are Explorers',
    characterId: 'riff',
    mood: 'upbeat',
    lines: [
      { text: 'Pack your bag and grab your map,' },
      { text: 'Put on your explorer cap!' },
      { text: 'Over mountains, through the sky,' },
      { text: 'Curio says, “Come on, let’s fly!”' },
      { text: 'We are explorers, brave and true,' },
      { text: 'There’s a whole big world for me and you,' },
      { text: 'We are explorers, brave and true,' },
      { text: 'Adventure’s calling me and you!' },
    ],
  },
];

export function getSong(id: string): Song | undefined {
  return SONGS.find((song) => song.id === id);
}
