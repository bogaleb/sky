/**
 * Luna's Storybook: original gentle read-aloud stories for ages 3-8.
 * Luna the owl reads every page aloud with TTS; each page also carries
 * a short caption describing its illustration for accessibility.
 */

export interface StoryPage {
  /** 1-2 simple sentences, read aloud by Luna. */
  text: string;
  /** Short description of the page illustration. */
  caption: string;
}

export interface Story {
  id: string;
  title: string;
  characterId: 'luna';
  pages: StoryPage[];
  /** One-line gentle moral shown on the last page. */
  moral: string;
  /** Reading difficulty: easy (8 pages), medium (10 pages), challenge (12 pages). */
  level?: 'easy' | 'medium' | 'challenge';
}

export const STORIES: Story[] = [
  {
    id: 'pip-shares-berries',
    title: 'Pip Shares the Berries',
    characterId: 'luna',
    pages: [
      {
        text: 'Pip was a little fox with a big, fluffy tail. One sunny morning, he found a bush full of sweet red berries.',
        caption: 'Pip the little fox finds a bush full of red berries',
      },
      {
        text: 'Pip picked and picked until his basket was full to the very top. “Mine, all mine!” he said with a happy wiggle.',
        caption: 'Pip fills his basket to the top with berries',
      },
      {
        text: 'Just then, Ruby the rabbit hopped over. “May I please have one berry?” she asked in a soft voice.',
        caption: 'Ruby the rabbit hops over and asks for a berry',
      },
      {
        text: 'Pip held his basket very tight. But Ruby’s tummy rumbled, and her smile looked a little sad.',
        caption: 'Pip holds his basket tight while Ruby looks sad',
      },
      {
        text: 'Pip took a deep breath and gave Ruby the biggest berry of all. Ruby’s eyes sparkled. “Thank you!” she giggled.',
        caption: 'Pip gives Ruby the biggest berry of all',
      },
      {
        text: 'They sat in the warm sun and shared the whole basket together. The berries tasted even sweeter with a friend.',
        caption: 'Pip and Ruby share the berries together in the sun',
      },
    ],
    moral: 'Sharing makes happy moments even happier.',
  },
  {
    id: 'hoot-star-blanket',
    title: 'Hoot and the Star Blanket',
    characterId: 'luna',
    pages: [
      {
        text: 'Hoot was a small owl who lived in a tall oak tree. He loved sunny days, but he did not love the dark.',
        caption: 'Hoot the small owl in his tall tree at dusk',
      },
      {
        text: 'When night came, Hoot squeezed his eyes shut tight. “It is too dark,” he whispered. “I cannot see a thing.”',
        caption: 'Hoot squeezes his eyes shut in the dark night',
      },
      {
        text: 'His mama nuzzled him gently with her soft feathers. “Open just one eye, little one,” she said. “Look up.”',
        caption: 'Mama owl nuzzles Hoot gently',
      },
      {
        text: 'Hoot peeked... and gasped! The sky was full of twinkling stars, like tiny night-lights made just for him.',
        caption: 'Hoot discovers the twinkling stars in the sky',
      },
      {
        text: 'The round moon smiled down, kind and bright. “The dark is only a blanket,” said Mama, “and the stars are its sparkles.”',
        caption: 'The kind round moon smiles down over Hoot',
      },
      {
        text: 'From that night on, Hoot loved bedtime. He counted the twinkling stars until his eyes felt soft and sleepy.',
        caption: 'Hoot counts the stars until he feels soft and sleepy',
      },
    ],
    moral: 'The dark is not so scary when you look for the light.',
  },
  {
    id: 'buzzys-big-day',
    title: 'Buzzy’s Big Day',
    characterId: 'luna',
    pages: [
      {
        text: 'Buzzy was the smallest bee in the whole hive. “I am too little to help,” he sighed, watching the big bees zoom past.',
        caption: 'Buzzy the smallest bee beside the big beehive',
      },
      {
        text: 'The big bees carried heavy drops of golden nectar. Buzzy flapped his tiny wings and wished he could help too.',
        caption: 'Big bees carry golden nectar past little Buzzy',
      },
      {
        text: 'One morning, a tiny flower drooped in the garden. “I am so thirsty,” it whispered. No big bee could fit between its petals.',
        caption: 'A tiny flower droops sadly in the garden',
      },
      {
        text: 'Zip! Buzzy flew right in — he was just the right size! He sipped the sweet nectar and tickled the petals with his fuzzy feet.',
        caption: 'Buzzy flies inside the tiny flower to help',
      },
      {
        text: 'The flower lifted its head and bloomed bright and pink. “You saved me, little one!” it sang happily.',
        caption: 'The flower blooms bright and pink again',
      },
      {
        text: 'Buzzy buzzed all the way home, proud and happy. The queen bee gave him a big hug. “The smallest wings can do the biggest jobs!”',
        caption: 'The queen bee gives Buzzy a big proud hug',
      },
    ],
    moral: 'Even the smallest helper can make a big difference.',
  },
  {
    id: 'bolt-learns-to-slow-down',
    title: 'Bolt Learns to Slow Down',
    characterId: 'luna',
    level: 'easy',
    pages: [
      {
        text: 'Bolt was a speedy little squirrel. He ran everywhere, fast as the wind!',
        caption: 'Bolt the speedy squirrel running fast through the meadow',
      },
      {
        text: 'One morning, Bolt zoomed past the pond. Splash! He did not see the smooth, shiny stones.',
        caption: 'Bolt zooms past the pond without seeing the stones',
      },
      {
        text: 'He zoomed past the flower field. Whoosh! He did not smell the sweet flowers.',
        caption: 'Bolt rushes past the flower field without smelling them',
      },
      {
        text: 'At lunch, his tummy rumbled. Bolt had run right past Wren’s picnic without stopping!',
        caption: 'Bolt realizes he ran past Wren’s picnic',
      },
      {
        text: 'Wren waved her wing. “Slow down, Bolt! I saved you a berry muffin.” Bolt skidded to a stop.',
        caption: 'Wren offers Bolt a berry muffin',
      },
      {
        text: 'The muffin was warm and sweet. “This is the best muffin ever,” said Bolt. “I almost missed it!”',
        caption: 'Bolt enjoys the warm berry muffin',
      },
      {
        text: 'After lunch, Tuno the turtle taught Bolt to breathe in slow and out slow. Bolt felt calm and cozy.',
        caption: 'Tuno teaches Bolt slow breathing',
      },
      {
        text: 'Now Bolt still runs fast, but he stops to look, smell, and taste. “Slow moments are the sweetest,” he says.',
        caption: 'Bolt stops to enjoy the flowers and sunshine',
      },
    ],
    moral: 'Slowing down helps you notice the good things.',
  },
  {
    id: 'wrens-little-garden',
    title: 'Wren’s Little Garden',
    characterId: 'luna',
    level: 'easy',
    pages: [
      {
        text: 'Wren was a tiny bird with a big idea. She wanted to grow a garden.',
        caption: 'Wren the tiny bird dreaming of a garden',
      },
      {
        text: 'Sprout the seedling gave her three little seeds. “Plant them in the soft dirt,” said Sprout.',
        caption: 'Sprout gives Wren three little seeds',
      },
      {
        text: 'Wren dug three small holes with her beak. Plop, plop, plop went the seeds.',
        caption: 'Wren plants the seeds in soft dirt',
      },
      {
        text: 'She watered them every morning. Drip, drop, drip. But nothing came up.',
        caption: 'Wren waters the garden every morning',
      },
      {
        text: '“Grow, little seeds, grow!” Wren chirped. Still, there was only brown dirt.',
        caption: 'Wren waits but sees only brown dirt',
      },
      {
        text: 'Bea the bee buzzed by. “Seeds need time, little friend. Keep watering and waiting.”',
        caption: 'Bea the bee encourages patient Wren',
      },
      {
        text: 'One sunny morning, Wren saw three tiny green sprouts! “Hello, babies!” she sang.',
        caption: 'Three tiny green sprouts appear',
      },
      {
        text: 'Soon the garden bloomed red, yellow, and blue. Wren shared flowers with every friend in the sky.',
        caption: 'Wren’s garden blooms in bright colors',
      },
    ],
    moral: 'Good things grow with patience and care.',
  },
  {
    id: 'sprockets-flying-machine',
    title: 'Sprocket’s Flying Machine',
    characterId: 'luna',
    level: 'medium',
    pages: [
      {
        text: 'Sprocket was a clever little mouse who loved to build. His workshop was full of gears, springs, and bright ideas.',
        caption: 'Sprocket the mouse in his workshop full of gears',
      },
      {
        text: 'One windy day, Sprocket had a big idea. “I will build a flying machine!” he squeaked.',
        caption: 'Sprocket gets the big idea for a flying machine',
      },
      {
        text: 'He hammered and glued all afternoon. His machine had paper wings, a propeller, and a shiny red button.',
        caption: 'Sprocket builds the flying machine',
      },
      {
        text: 'Sprocket climbed on top and pressed the button. Whirr, clunk... the wings flopped right off!',
        caption: 'The wings flop off the machine',
      },
      {
        text: '“Oh no!” cried Sprocket. “My machine is broken.” He felt like giving up.',
        caption: 'Sprocket feels sad about the broken machine',
      },
      {
        text: 'Milo the robot rolled over. “Beep! Let us look at the problem together,” said Milo.',
        caption: 'Milo the robot comes to help Sprocket',
      },
      {
        text: 'They saw the wings were too heavy. “Lighter wings!” said Sprocket. They made new wings from soft leaves.',
        caption: 'Sprocket and Milo build light leaf wings',
      },
      {
        text: 'Sprocket pressed the button again. Whirr, whirr... the machine lifted into the air!',
        caption: 'The flying machine lifts into the air',
      },
      {
        text: 'Up, up, up he flew, waving to his friends below. “It works! It really works!”',
        caption: 'Sprocket flies high above his friends',
      },
      {
        text: 'Sprocket landed with a happy bump. “My mistake showed me what to fix,” he grinned.',
        caption: 'Sprocket lands safely with a happy grin',
      },
    ],
    moral: 'Mistakes are just clues that help you try again.',
  },
  {
    id: 'pebble-and-the-big-hill',
    title: 'Pebble and the Big Hill',
    characterId: 'luna',
    level: 'medium',
    pages: [
      {
        text: 'Pebble was a small turtle with a big dream. She wanted to watch the sunrise from the top of Big Hill.',
        caption: 'Pebble the small turtle dreaming of Big Hill',
      },
      {
        text: 'But Big Hill was very, very tall. “My legs are so short,” Pebble sighed.',
        caption: 'Pebble looks up at the very tall hill',
      },
      {
        text: 'Nova the explorer hopped beside her. “You do not have to climb it all at once,” said Nova. “Just take one step.”',
        caption: 'Nova encourages Pebble to take one step',
      },
      {
        text: 'So Pebble took one step. Then another. Step, step, step went her little feet.',
        caption: 'Pebble takes little steps up the hill',
      },
      {
        text: 'Halfway up, her legs felt wobbly. A kind breeze cooled her face. “Keep going,” whispered the breeze.',
        caption: 'A kind breeze cools Pebble halfway up',
      },
      {
        text: 'Pip the fox trotted by with a snack. “You are doing great, Pebble!” he cheered.',
        caption: 'Pip cheers Pebble on with a snack',
      },
      {
        text: 'Step by step, Pebble climbed higher and higher. The sky turned pink, then gold.',
        caption: 'The sky turns pink and gold as Pebble climbs',
      },
      {
        text: 'At last, Pebble reached the very top! She was just in time.',
        caption: 'Pebble reaches the top of Big Hill',
      },
      {
        text: 'The sun peeked over the clouds, warm and bright. Pebble’s heart felt as big as the sky.',
        caption: 'Pebble watches the warm sunrise',
      },
      {
        text: '“I did it!” she whispered. “One little step at a time.”',
        caption: 'Pebble smiles proudly at the sunrise',
      },
    ],
    moral: 'Little steps can climb the biggest hills.',
  },
  {
    id: 'quills-stormy-night',
    title: 'Quill’s Stormy Night',
    characterId: 'luna',
    level: 'challenge',
    pages: [
      {
        text: 'Quill was a gentle porcupine with soft spikes and a big imagination. He loved sunny days and quiet nights.',
        caption: 'Quill the gentle porcupine on a sunny day',
      },
      {
        text: 'But Quill did not love storms. When thunder rumbled, his spikes stood straight up. “Too loud!” he squeaked.',
        caption: 'Quill’s spikes stand up at the thunder',
      },
      {
        text: 'One evening, dark clouds rolled over the sky. Rain pattered, and thunder went rumble, crack!',
        caption: 'Dark storm clouds roll over the sky',
      },
      {
        text: 'Quill hid under his cozy leaf blanket. “I will stay right here,” he whispered, “where it is safe.”',
        caption: 'Quill hides under his cozy leaf blanket',
      },
      {
        text: 'Then he heard a small voice. “Help!” It was Hoot! The wind had blown his favorite branch down.',
        caption: 'Hoot calls for help in the storm',
      },
      {
        text: 'Quill’s tummy felt wobbly. But Hoot needed help. Quill took a deep breath and peeked out.',
        caption: 'Quill takes a brave deep breath',
      },
      {
        text: 'Rain tickled his spikes as he hurried to Hoot. Together, they lifted the branch back into place.',
        caption: 'Quill and Hoot lift the branch together',
      },
      {
        text: 'Next, they found Ruby the rabbit, shivering in the wet grass. Quill shared his leaf blanket with her.',
        caption: 'Quill shares his blanket with Ruby the rabbit',
      },
      {
        text: 'Luna the owl gathered everyone under the big oak tree. She read a soft story about a brave little star.',
        caption: 'Luna reads a soft story under the oak tree',
      },
      {
        text: 'Quill listened, and his spikes lay flat and calm. Helping his friends had made the storm feel smaller.',
        caption: 'Quill feels calm listening to Luna’s story',
      },
      {
        text: 'When the clouds cleared, the moon smiled down. “Thank you, Quill,” said Hoot. “You were so brave!”',
        caption: 'The moon smiles down after the storm',
      },
      {
        text: 'Quill smiled back. “I was scared,” he said, “but my friends needed me. Being brave is helping anyway.”',
        caption: 'Quill smiles, proud and brave',
      },
    ],
    moral: 'Being brave means helping others, even when you feel wobbly inside.',
  },
  {
    id: 'dewdrops-long-way-home',
    title: 'Dewdrop’s Long Way Home',
    characterId: 'luna',
    level: 'challenge',
    pages: [
      {
        text: 'Dewdrop was a tiny firefly with a glow as bright as a lantern. She loved to explore after sunset.',
        caption: 'Dewdrop the firefly glowing after sunset',
      },
      {
        text: 'One evening, a shiny silver balloon floated past. “Ooh!” said Dewdrop. “I must see where it goes!”',
        caption: 'Dewdrop spots a shiny silver balloon',
      },
      {
        text: 'She followed the balloon over the meadow, past the pond, and through the whispering pines.',
        caption: 'Dewdrop follows the balloon far from home',
      },
      {
        text: 'Pop! The balloon bumped a branch and flew away. Dewdrop looked around. “Oh no,” she whispered. “Where am I?”',
        caption: 'The balloon pops and Dewdrop is lost',
      },
      {
        text: 'Everything looked strange and new. Her glow flickered with worry.',
        caption: 'Dewdrop’s glow flickers with worry',
      },
      {
        text: 'Just then, Atlas the elephant stepped out from behind a tall tree. “Lost, little one?” he rumbled kindly.',
        caption: 'Atlas the elephant appears kindly',
      },
      {
        text: '“I followed a balloon and now I cannot find home,” said Dewdrop with a sniff.',
        caption: 'Dewdrop tells Atlas she is lost',
      },
      {
        text: 'Atlas smiled. “Explorers find their way by looking for landmarks. See that crooked pine? And the pond that shines like a mirror?”',
        caption: 'Atlas points out landmarks to Dewdrop',
      },
      {
        text: 'Dewdrop looked. “I remember the pond! My home is just past the pond!”',
        caption: 'Dewdrop recognizes the shining pond',
      },
      {
        text: 'Atlas walked with her, his big steps slow and steady. Dewdrop’s glow grew brighter with every step.',
        caption: 'Atlas walks Dewdrop home',
      },
      {
        text: 'At last, they saw her cozy hollow log, glowing warm in the dark. “Home!” cheered Dewdrop.',
        caption: 'Dewdrop sees her cozy hollow log',
      },
      {
        text: 'She hugged Atlas’s trunk. “Thank you! Now I know: look around, and you will find your way.”',
        caption: 'Dewdrop hugs Atlas’s trunk',
      },
    ],
    moral: 'When you feel lost, look around — the way home is closer than you think.',
  },
];

/** Look up a story by id. */
export function getStory(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}
