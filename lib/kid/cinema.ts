/**
 * Story Cinema: cartoon-like animated tales for ages 3-8.
 * Eight original mini-episodes, six to eight scenes each. The island crew
 * acts out gentle stories about their storybook friends (Pip, Hoot,
 * Sprocket, Dewdrop) while Curio narrates every scene aloud with TTS.
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
  {
    id: 'milo-share-spark',
    title: 'The Robot Who Shared',
    tagline: 'A wind-up car and a very big idea',
    friendId: 'sprocket',
    scenes: [
      {
        id: 'milo-1',
        narration:
          'Milo the robot got a shiny new wind-up zoom car for his birthday. It went vroom vroom all around the meadow.',
        caption: 'Milo shows off his new zoom car',
        backdrop: 'meadow',
        cast: ['milo', 'sprocket'],
        action: 'Milo winds up the zoom car, Sprocket watches wide-eyed',
      },
      {
        id: 'milo-2',
        narration:
          'Sprocket clapped his hands. “May I please have a turn?” he asked. Milo hugged the car tight. “Not yet,” he said.',
        caption: 'Sprocket asks for a turn',
        backdrop: 'meadow',
        cast: ['milo', 'sprocket'],
        action: 'Sprocket reaches out, Milo holds the car close',
      },
      {
        id: 'milo-3',
        narration:
          'Milo zoomed the car in circles all by himself. It was fun, but it felt a little quiet with no friend to cheer.',
        caption: 'Zooming alone feels a little quiet',
        backdrop: 'meadow',
        cast: ['milo'],
        action: 'Milo watches the car circle, looking thoughtful',
      },
      {
        id: 'milo-4',
        narration:
          'Just then Curio trotted by. “Shared joy is double joy,” said Curio with a wink. Milo’s light bulb blinked bright.',
        caption: 'Curio shares a wise little saying',
        backdrop: 'sky',
        cast: ['milo', 'curio'],
        action: 'Curio winks as Milo’s bulb lights up',
      },
      {
        id: 'milo-5',
        narration:
          'Milo rolled right over to Sprocket. “Your turn!” he beeped, handing over the winder. Sprocket’s face lit up like sunshine.',
        caption: 'Milo hands Sprocket the winder',
        backdrop: 'meadow',
        cast: ['milo', 'sprocket'],
        action: 'Milo gives the winder to a delighted Sprocket',
      },
      {
        id: 'milo-6',
        narration:
          'Together they built a twisty twig track. Nova and Bea came to watch the great race. “Ready, set, zoom!” everyone cheered.',
        caption: 'Friends build a twig track together',
        backdrop: 'meadow',
        cast: ['milo', 'sprocket', 'nova', 'bea'],
        action: 'All friends build the track and cheer the race',
      },
      {
        id: 'milo-7',
        narration:
          'The zoom car zipped around the track again and again. Milo smiled his biggest robot smile. Sharing made the fun twice as big.',
        caption: 'Sharing made the fun twice as big',
        backdrop: 'sky',
        cast: ['milo', 'sprocket', 'nova', 'bea'],
        action: 'Friends cheer as the car zooms past',
      },
    ],
  },
  {
    id: 'bea-garden-rescue',
    title: 'The Garden Rescue',
    tagline: 'Teamwork saves the flowers',
    friendId: 'dewdrop',
    scenes: [
      {
        id: 'bea-1',
        narration:
          'Bea the bee loved her little flower garden more than anything. But one very hot week, the flowers began to droop.',
        caption: 'Bea’s flowers droop in the hot sun',
        backdrop: 'meadow',
        cast: ['bea', 'dewdrop'],
        action: 'Bea frowns at the wilting flowers',
      },
      {
        id: 'bea-2',
        narration:
          'Dewdrop the droplet sighed. “I am too tiny to water them all alone,” she said. Bea nodded. “Then we will not do it alone!”',
        caption: 'Dewdrop is too tiny to help alone',
        backdrop: 'meadow',
        cast: ['bea', 'dewdrop'],
        action: 'Dewdrop looks small beside the tall flowers',
      },
      {
        id: 'bea-3',
        narration:
          'Bea buzzed off to gather her friends. “Garden rescue team, assemble!” she called. Soon everyone came running.',
        caption: 'Bea gathers the rescue team',
        backdrop: 'sky',
        cast: ['bea'],
        action: 'Bea zooms off, trailing a dotted flight path',
      },
      {
        id: 'bea-4',
        narration:
          'Atlas carried cool pond water in his big trunk. Milo brought a bucket, and Nova brought a watering can.',
        caption: 'Atlas brings cool pond water',
        backdrop: 'ocean',
        cast: ['atlas', 'bea', 'milo', 'nova'],
        action: 'Atlas sprays water from his trunk',
      },
      {
        id: 'bea-5',
        narration:
          'Everyone watered the garden together. Dewdrop sprinkled the petals, and Bea fanned them cool with her wings.',
        caption: 'Everyone waters the garden together',
        backdrop: 'meadow',
        cast: ['bea', 'dewdrop', 'atlas', 'milo'],
        action: 'Friends water and fan the flowers',
        fx: 'rain',
      },
      {
        id: 'bea-6',
        narration:
          'One by one, the flowers lifted their heads. Buds popped open in pink and purple and gold.',
        caption: 'The flowers perk up and bloom',
        backdrop: 'meadow',
        cast: ['bea', 'dewdrop'],
        action: 'Bea and Dewdrop admire the blooming flowers',
      },
      {
        id: 'bea-7',
        narration:
          'That evening they had a picnic among the blossoms. “Many small helpers make one big rescue,” said Bea proudly.',
        caption: 'A picnic among the blossoms',
        backdrop: 'meadow',
        cast: ['bea', 'dewdrop', 'atlas', 'milo', 'nova'],
        action: 'All friends picnic in the blooming garden',
      },
    ],
  },
  {
    id: 'tuno-brave-paddle',
    title: 'The Brave Little Turtle',
    tagline: 'Trying is brave',
    friendId: 'hoot',
    scenes: [
      {
        id: 'tuno-1',
        narration:
          'At the meadow playground stood the biggest, twistiest slide in all of Sky. Tuno the turtle watched the others slide down.',
        caption: 'Tuno eyes the big twisty slide',
        backdrop: 'meadow',
        cast: ['tuno', 'riff', 'nova'],
        action: 'Tuno looks up at the tall slide',
      },
      {
        id: 'tuno-2',
        narration:
          'Riff waved. “Come on, Tuno, it is so much fun!” Tuno’s tummy felt all fluttery. “Maybe tomorrow,” he whispered.',
        caption: 'Tuno’s tummy feels fluttery',
        backdrop: 'meadow',
        cast: ['tuno', 'riff'],
        action: 'Tuno shakes his head, looking nervous',
      },
      {
        id: 'tuno-3',
        narration:
          'Hoot fluttered down beside him. “Big slides scare me too,” Hoot admitted. “Let us try the little slide first, together.”',
        caption: 'Hoot shares Tuno’s wobbly feeling',
        backdrop: 'meadow',
        cast: ['tuno', 'hoot'],
        action: 'Hoot sits beside Tuno, both looking at the slide',
      },
      {
        id: 'tuno-4',
        narration:
          'Tuno climbed the three little steps. He pushed off... wheee! Down he went, giggling the whole way.',
        caption: 'The little slide is fun, not scary',
        backdrop: 'meadow',
        cast: ['tuno', 'hoot'],
        action: 'Tuno slides down, laughing',
      },
      {
        id: 'tuno-5',
        narration:
          '“I did it!” cheered Tuno. He looked at the big slide again. It still looked tall, but now it looked a little bit fun too.',
        caption: 'Tuno eyes the big slide again',
        backdrop: 'sky',
        cast: ['tuno', 'hoot'],
        action: 'Tuno gazes up, feeling braver',
      },
      {
        id: 'tuno-6',
        narration:
          'Step by step, Tuno climbed to the very top. Hoot cheered from below. Then whoosh! Down he zoomed, laughing loud!',
        caption: 'Tuno zooms down the big slide',
        backdrop: 'meadow',
        cast: ['tuno', 'hoot', 'riff', 'nova'],
        action: 'Tuno slides down as friends cheer',
      },
      {
        id: 'tuno-7',
        narration:
          'Tuno slid again and again until the sun went low. “Brave does not mean not scared,” he said. “Brave means trying anyway.”',
        caption: 'Trying anyway is what brave means',
        backdrop: 'sky',
        cast: ['tuno', 'hoot', 'riff'],
        action: 'Tuno slides once more into the sunset',
      },
    ],
  },
  {
    id: 'atlas-map-kindness',
    title: 'The Map of Kindness',
    tagline: 'Every heart marks a helping hand',
    friendId: 'pip',
    scenes: [
      {
        id: 'atlas-1',
        narration:
          'Atlas the elephant unrolled a big hand-drawn map. “This is my Map of Kindness,” he trumpeted. “Every heart marks a helping hand.”',
        caption: 'Atlas unrolls the Map of Kindness',
        backdrop: 'meadow',
        cast: ['atlas', 'pip'],
        action: 'Atlas spreads the big map on the grass',
      },
      {
        id: 'atlas-2',
        narration:
          'Pip the little fox came dashing up. “I chased a butterfly and lost my way home!” he panted. Atlas smiled. “Then we will follow the kind path together.”',
        caption: 'Pip lost his way chasing a butterfly',
        backdrop: 'meadow',
        cast: ['atlas', 'pip'],
        action: 'Pip looks worried, Atlas pats him gently',
      },
      {
        id: 'atlas-3',
        narration:
          'First stop: Milo’s gears had spilled everywhere. Atlas lifted the heavy box while Pip gathered the tiny screws.',
        caption: 'Helping Milo with his spilled gears',
        backdrop: 'meadow',
        cast: ['atlas', 'pip', 'milo'],
        action: 'Atlas lifts the box, Pip collects screws',
      },
      {
        id: 'atlas-4',
        narration:
          'Next stop: Tuno felt sleepy and slow today. They left warm honey cakes at his door with a kind little note.',
        caption: 'Honey cakes for a sleepy Tuno',
        backdrop: 'meadow',
        cast: ['atlas', 'pip', 'tuno'],
        action: 'Pip sets the cakes by Tuno’s door',
      },
      {
        id: 'atlas-5',
        narration:
          'They followed the map’s dotted path as the sky turned gold. Pip held Atlas’s trunk and did not feel lost at all.',
        caption: 'Following the dotted path home',
        backdrop: 'sky',
        cast: ['atlas', 'pip'],
        action: 'Pip holds Atlas’s trunk on the path',
      },
      {
        id: 'atlas-6',
        narration:
          'At last they reached Pip’s cozy den. Nova was waiting with a hug. “Thank you, Atlas!” said Pip. “You are the kindest!”',
        caption: 'Pip arrives home safe and sound',
        backdrop: 'meadow',
        cast: ['atlas', 'pip', 'nova'],
        action: 'Nova hugs Pip at the den door',
      },
      {
        id: 'atlas-7',
        narration:
          'That night Atlas drew one more heart on his map. Right in the middle he wrote: helped Pip find home.',
        caption: 'A new heart on the Map of Kindness',
        backdrop: 'night',
        cast: ['atlas'],
        action: 'Atlas draws a heart under the stars',
      },
    ],
  },
];

export function getEpisode(id: string): CinemaEpisode | undefined {
  return EPISODES.find((e) => e.id === id);
}
