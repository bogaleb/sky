/**
 * Story Cinema: cartoon-like animated tales for ages 3-8.
 * Four original mini-episodes, six scenes each. The island crew acts out
 * gentle stories about their storybook friends (Pip, Hoot, Sprocket,
 * Dewdrop) while Curio narrates every scene aloud with TTS.
 */

export type CinemaBackdrop = 'meadow' | 'night' | 'ocean' | 'sky';

export interface CinemaScene {
  id: string;
  /** 1-2 simple sentences, read aloud by Curio. */
  narration: string;
  /** Short on-screen text shown under the scene. */
  caption: string;
  backdrop: CinemaBackdrop;
  /** Character ids on stage: the 8 avatar cast + the 4 story friends. */
  cast: string[];
  /** Short stage direction for the animators. */
  action: string;
  /** Optional weather/atmosphere overlay. */
  fx?: 'rain' | 'bubbles';
}

/** Story friends with hand-drawn SVG actors in story-cinema.tsx. */
export const FRIEND_ART_IDS = ['pip', 'hoot', 'sprocket', 'dewdrop'] as const;
export type FriendArtId = (typeof FRIEND_ART_IDS)[number];

/** Display names for the story friends (they are not in CHARACTERS). */
export const FRIEND_NAMES: Record<FriendArtId, string> = {
  pip: 'Pip',
  hoot: 'Hoot',
  sprocket: 'Sprocket',
  dewdrop: 'Dewdrop',
};

export interface CinemaEpisode {
  id: string;
  title: string;
  tagline: string;
  /** Featured story friend, drawn big on the episode poster. */
  friendId: FriendArtId;
  scenes: CinemaScene[];
}

export const EPISODES: CinemaEpisode[] = [
  {
    id: 'pip-lost-kite',
    title: 'Pip and the Lost Kite',
    tagline: 'A windy-day rescue with friends',
    friendId: 'pip',
    scenes: [
      {
        id: 'pip-1',
        narration:
          'One windy morning, Pip the little fox took his red kite to the meadow. Nova came along to help him fly it.',
        caption: 'Pip and Nova bring a red kite to the meadow',
        backdrop: 'meadow',
        cast: ['pip', 'nova'],
        action: 'Pip holds a red kite, Nova waves hello',
      },
      {
        id: 'pip-2',
        narration:
          'Whoosh! A big gust of wind tugged the string right out of Pip’s paws. “My kite!” cried Pip as it soared away.',
        caption: 'The wind carries the kite away',
        backdrop: 'sky',
        cast: ['pip', 'nova'],
        action: 'Kite flies up and away, Pip reaches up after it',
      },
      {
        id: 'pip-3',
        narration:
          'Milo and Bea hurried over. “Do not worry, Pip,” said Milo. “We will find your kite together.”',
        caption: 'Milo and Bea join the search',
        backdrop: 'meadow',
        cast: ['milo', 'bea', 'pip'],
        action: 'Friends gather around sad Pip to cheer him up',
      },
      {
        id: 'pip-4',
        narration:
          'Bea buzzed high above the trees. “I see it! I see it!” she called. The red kite was stuck in the tallest oak.',
        caption: 'Bea spots the kite in a tall tree',
        backdrop: 'sky',
        cast: ['bea', 'milo'],
        action: 'Bea points up at the kite in the treetop',
      },
      {
        id: 'pip-5',
        narration:
          'Milo stretched up tall on his tippy-toes and gently freed the kite. Pip hugged it tight. “Thank you!”',
        caption: 'Milo rescues the kite from the tree',
        backdrop: 'meadow',
        cast: ['milo', 'pip', 'nova'],
        action: 'Milo hands the kite to a very happy Pip',
      },
      {
        id: 'pip-6',
        narration:
          'That afternoon they all flew the kite together, taking turns holding the string. It was the best windy day ever.',
        caption: 'Everyone flies the kite together',
        backdrop: 'sky',
        cast: ['pip', 'nova', 'milo', 'bea'],
        action: 'All friends fly the kite, cheering and laughing',
      },
    ],
  },
  {
    id: 'hoot-midnight-picnic',
    title: "Hoot's Midnight Picnic",
    tagline: 'A cozy adventure under the stars',
    friendId: 'hoot',
    scenes: [
      {
        id: 'hoot-1',
        narration:
          'Hoot the little owl lived in a tall oak tree. He loved picnics, but he did not love the dark one bit.',
        caption: 'Hoot peeks out of his tree at night',
        backdrop: 'night',
        cast: ['hoot'],
        action: 'Hoot looks nervously at the dark sky',
      },
      {
        id: 'hoot-2',
        narration:
          'Luna floated down softly. “The night is full of treats,” she hooted. “Come see — I brought glowing berry lanterns!”',
        caption: 'Luna brings glowing lanterns',
        backdrop: 'night',
        cast: ['luna', 'hoot'],
        action: 'Luna hangs glowing lanterns on the branches',
      },
      {
        id: 'hoot-3',
        narration:
          'Tuno arrived with a blanket and warm honey cakes. “Picnics taste best under the stars,” he said with a slow, sleepy smile.',
        caption: 'Tuno spreads a picnic blanket',
        backdrop: 'night',
        cast: ['tuno', 'hoot', 'luna'],
        action: 'Tuno lays out cakes on a checkered blanket',
      },
      {
        id: 'hoot-4',
        narration:
          'Hoot took one small bite... then another. Above him, the stars twinkled like sugar sprinkles on a giant cake.',
        caption: 'Hoot munches cakes under twinkling stars',
        backdrop: 'night',
        cast: ['hoot', 'luna'],
        action: 'Hoot eats happily while stars twinkle above',
      },
      {
        id: 'hoot-5',
        narration:
          'The round moon smiled down. Hoot looked up and whispered, “The dark is just a cozy blanket with sparkles.”',
        caption: 'Hoot smiles at the kind moon',
        backdrop: 'night',
        cast: ['hoot'],
        action: 'Hoot gazes up, calm and happy',
      },
      {
        id: 'hoot-6',
        narration:
          'From that night on, Hoot loved midnight picnics best of all. And he always saved the biggest honey cake for Luna.',
        caption: 'Friends share the midnight picnic',
        backdrop: 'night',
        cast: ['hoot', 'luna', 'tuno'],
        action: 'All three share cakes, laughing softly',
      },
    ],
  },
  {
    id: 'sprocket-rainy-invention',
    title: "Sprocket's Rainy-Day Invention",
    tagline: 'Plip plop — time to build!',
    friendId: 'sprocket',
    scenes: [
      {
        id: 'sprocket-1',
        narration:
          'Plip! Plop! Rain poured down on the meadow. Sprocket the little inventor sighed. “No playing outside today.”',
        caption: 'Rain pours down on the meadow',
        backdrop: 'meadow',
        cast: ['sprocket'],
        action: 'Sprocket watches the rain from a doorway',
        fx: 'rain',
      },
      {
        id: 'sprocket-2',
        narration:
          'Milo splashed over in his yellow boots. “Rainy days are inventing days!” he beeped. Sprocket’s eyes lit up.',
        caption: 'Milo visits with an idea',
        backdrop: 'meadow',
        cast: ['sprocket', 'milo'],
        action: 'Milo splashes in puddles, Sprocket grins',
        fx: 'rain',
      },
      {
        id: 'sprocket-3',
        narration:
          'Clink! Clank! They built a boat from a bucket, a spoon mast, and a leaf sail. “The S.S. Puddle!” cheered Sprocket.',
        caption: 'They build a little leaf-sail boat',
        backdrop: 'meadow',
        cast: ['sprocket', 'milo'],
        action: 'Friends hammer and build the little boat',
        fx: 'rain',
      },
      {
        id: 'sprocket-4',
        narration:
          'Sprocket set the boat in a rushing puddle stream. It wobbled... it wibbled... and then it SAILED!',
        caption: 'The boat sails down the puddle stream',
        backdrop: 'meadow',
        cast: ['sprocket'],
        action: 'Boat sails away, Sprocket jumps with joy',
        fx: 'rain',
      },
      {
        id: 'sprocket-5',
        narration:
          'Just then the clouds parted, and a great rainbow arched across the sky. “Our boat sailed under a rainbow!” gasped Milo.',
        caption: 'A rainbow appears after the rain',
        backdrop: 'sky',
        cast: ['sprocket', 'milo'],
        action: 'Friends point up at the big rainbow',
      },
      {
        id: 'sprocket-6',
        narration:
          'Bea flew over to see the famous boat. Sprocket smiled big. “The best inventions come from rainy days.”',
        caption: 'Bea admires the little boat',
        backdrop: 'meadow',
        cast: ['sprocket', 'milo', 'bea'],
        action: 'All friends admire the boat together',
      },
    ],
  },
  {
    id: 'dewdrop-bubble-voyage',
    title: "Dewdrop's Bubble Voyage",
    tagline: 'Up, up and over the ocean!',
    friendId: 'dewdrop',
    scenes: [
      {
        id: 'dewdrop-1',
        narration:
          'Dewdrop was a tiny droplet who lived on a green leaf by the sea. “I wish I could see the whole wide ocean,” she sighed.',
        caption: 'Dewdrop gazes at the wide ocean',
        backdrop: 'ocean',
        cast: ['dewdrop'],
        action: 'Dewdrop looks out over the rolling waves',
      },
      {
        id: 'dewdrop-2',
        narration:
          'Bea blew a big, shimmering bubble. Plop! Dewdrop hopped right in. “Wheee! I am flying!” she giggled.',
        caption: 'Dewdrop hops into a giant bubble',
        backdrop: 'ocean',
        cast: ['dewdrop', 'bea'],
        action: 'Dewdrop climbs into the shimmering bubble',
        fx: 'bubbles',
      },
      {
        id: 'dewdrop-3',
        narration:
          'Up, up she floated, over the sparkling waves. Seagulls waved their wings. “Hello down there!” called Dewdrop.',
        caption: 'The bubble floats high over the waves',
        backdrop: 'sky',
        cast: ['dewdrop'],
        action: 'Bubble drifts through the bright sky',
        fx: 'bubbles',
      },
      {
        id: 'dewdrop-4',
        narration:
          'Atlas the elephant was splashing at the shore. “What a brave little traveler!” he trumpeted, spraying a happy fountain.',
        caption: 'Atlas waves from the shore',
        backdrop: 'ocean',
        cast: ['dewdrop', 'atlas'],
        action: 'Atlas sprays water playfully at the bubble',
        fx: 'bubbles',
      },
      {
        id: 'dewdrop-5',
        narration:
          'Riff the rabbit sang a floating song. “Bubbles up and bubbles down, the bravest drop in town!” Dewdrop danced inside her bubble.',
        caption: 'Riff sings a floating song',
        backdrop: 'sky',
        cast: ['dewdrop', 'riff'],
        action: 'Riff sings while Dewdrop dances in the bubble',
        fx: 'bubbles',
      },
      {
        id: 'dewdrop-6',
        narration:
          'At last the bubble landed soft as a whisper on a pink flower. “Home!” sighed Dewdrop. “What a wonderful voyage.”',
        caption: 'The bubble lands softly on a flower',
        backdrop: 'meadow',
        cast: ['dewdrop', 'bea'],
        action: 'Dewdrop waves goodbye from the flower',
      },
    ],
  },
];

export function getEpisode(id: string): CinemaEpisode | undefined {
  return EPISODES.find((e) => e.id === id);
}
