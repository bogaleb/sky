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
];

/** Look up a story by id. */
export function getStory(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}
