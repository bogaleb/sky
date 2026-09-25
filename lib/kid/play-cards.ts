/**
 * Screen-free Play Cards — real-world activities parents can do with their
 * child, one per curriculum skill. Every card ties back to a real skill code
 * from the curriculum bank (lib/kid/trail.ts), so the app can suggest cards
 * for the exact skills a child is practicing.
 */

export interface PlayCard {
  /** Stable kebab-case id. */
  id: string;
  /** Real skill code from SKILL_CODES in lib/kid/trail.ts. */
  skillId: string;
  /** Subject code (island) this card belongs to. */
  subjectCode: string;
  title: string;
  /** 2-3 sentences in a parent's voice: what to do together. */
  howTo: string;
  /** Household items needed. */
  materials: string;
  /** Suggested duration in minutes. */
  minutes: number;
}

export const PLAY_CARDS: PlayCard[] = [
  // ---------------------------------------------------------------- Reading
  {
    id: 'alphabet-shelf-hunt',
    skillId: 'alphabet',
    subjectCode: 'reading',
    title: 'Alphabet Shelf Hunt',
    howTo:
      'Hide magnetic or paper letters around one room. Call out a letter and let your child race to find it and name something in the room that starts with it. Play until the whole alphabet is back on the fridge.',
    materials: 'Magnetic letters or paper letter cards',
    minutes: 15,
  },
  {
    id: 'sound-sandwiches',
    skillId: 'letter_sounds',
    subjectCode: 'reading',
    title: 'Sound Sandwiches',
    howTo:
      'Say a word slowly, stretching the first sound, like "sss-un". Your child guesses the whole word, then makes the first sound back at you. Take turns being the sound-stretcher and the guesser.',
    materials: 'No materials needed',
    minutes: 10,
  },
  {
    id: 'blend-the-grocery-list',
    skillId: 'blending',
    subjectCode: 'reading',
    title: 'Blend the Grocery List',
    howTo:
      'While putting groceries away, say each item in robot talk: "m-i-l-k". Your child blends the sounds and runs to find the item. Celebrate every blend, even the wobbly ones, before trying a longer word.',
    materials: 'Groceries or pantry items',
    minutes: 10,
  },
  {
    id: 'sight-word-hopscotch',
    skillId: 'sight_words',
    subjectCode: 'reading',
    title: 'Sight-Word Hopscotch',
    howTo:
      'Write sight words on paper squares and tape them in a hopscotch path on the floor. Your child hops from square to square, reading each word out loud before jumping. Swap in new words as the old ones become easy.',
    materials: 'Paper, marker, tape',
    minutes: 15,
  },

  // -------------------------------------------------------------------- Math
  {
    id: 'sock-pair-count',
    skillId: 'count',
    subjectCode: 'math',
    title: 'Sock Pair Count',
    howTo:
      'Dump a basket of clean socks on the floor. Count them together by twos as you match each pair, touching every sock as you count. Ask your child to predict how many pairs there will be before you start.',
    materials: 'Basket of clean socks',
    minutes: 10,
  },
  {
    id: 'snack-addition',
    skillId: 'add',
    subjectCode: 'math',
    title: 'Snack Addition',
    howTo:
      'Put 3 crackers on a plate and 2 more beside it. Ask your child to count all of them to find the total, then write the number sentence together on paper: 3 + 2 = 5. Eat the answer and try another combination.',
    materials: 'Crackers or small snacks, paper, crayon',
    minutes: 10,
  },
  {
    id: 'cookie-subtraction',
    skillId: 'subtract',
    subjectCode: 'math',
    title: 'Cookie Subtraction',
    howTo:
      'Start with 8 small snacks in a bowl. Take some away and ask your child how many are left, counting what remains. Let them be the one who takes snacks away while you guess the new total.',
    materials: 'Small snacks, a bowl',
    minutes: 10,
  },
  {
    id: 'shape-walk',
    skillId: 'shapes_patterns',
    subjectCode: 'math',
    title: 'Shape Walk',
    howTo:
      'Take a walk and spot shapes together: circles on car wheels, rectangles on doors, triangles on roofs. Your child calls out each shape and counts its sides. See who can find the most unusual shape on the block.',
    materials: 'No materials needed',
    minutes: 20,
  },

  // ----------------------------------------------------------------- Writing
  {
    id: 'shaving-cream-letters',
    skillId: 'trace_letters',
    subjectCode: 'writing',
    title: 'Shaving-Cream Letters',
    howTo:
      'Spread shaving cream on a baking tray. Say a letter sound and have your child trace the big letter in the cream with one finger, saying the sound as they write. Smooth it flat and try the next letter.',
    materials: 'Shaving cream, baking tray',
    minutes: 15,
  },
  {
    id: 'fridge-word-builder',
    skillId: 'build_words',
    subjectCode: 'writing',
    title: 'Fridge Word Builder',
    howTo:
      'Put out letter magnets and build a simple word together, like "cat". Change one letter at a time to make new words: cat, hat, hot, hop. Read each new word aloud and cheer for every word your child builds alone.',
    materials: 'Magnetic letters',
    minutes: 10,
  },
  {
    id: 'bedtime-caption',
    skillId: 'write_sentences',
    subjectCode: 'writing',
    title: 'Bedtime Caption',
    howTo:
      'Ask your child to draw one thing that happened today, then help them write one sentence about it underneath. Sound out the words together and let invented spelling be just fine. Date it and keep the pages in a folder.',
    materials: 'Paper, crayons, pencil',
    minutes: 15,
  },

  // ----------------------------------------------------------------- Science
  {
    id: 'bean-in-a-cup',
    skillId: 'plants',
    subjectCode: 'science',
    title: 'Bean in a Cup',
    howTo:
      'Push a dried bean against the inside of a clear cup filled with damp paper towel. Check it every morning and draw what you see. Ask your child to predict what will appear next: root first, or sprout?',
    materials: 'Clear cup, dried bean, paper towel, water',
    minutes: 5,
  },
  {
    id: 'backyard-habitat-tour',
    skillId: 'animals_habitats',
    subjectCode: 'science',
    title: 'Backyard Habitat Tour',
    howTo:
      'Walk outside and look for three animal homes: a web, a nest, an anthill, or a burrow. For each one, ask your child what the animal eats, drinks, and does to stay safe. Draw the favorite habitat when you get home.',
    materials: 'No materials needed; paper and crayons for the drawing',
    minutes: 20,
  },
  {
    id: 'weather-window',
    skillId: 'weather',
    subjectCode: 'science',
    title: 'Weather Window',
    howTo:
      'Look out the window together each morning for a week and record the weather with a quick drawing: sun, cloud, rain, or snow. At the end of the week, count which kind of weather won. Talk about what you wore on each day.',
    materials: 'Paper, crayons',
    minutes: 5,
  },
  {
    id: 'sink-or-float-lab',
    skillId: 'experiments',
    subjectCode: 'science',
    title: 'Sink or Float Lab',
    howTo:
      'Fill a tub with water and gather safe household objects: a spoon, a cork, a sponge, a coin. Before dropping each one, your child predicts sink or float, then tests it. Sort the results into two proud piles.',
    materials: 'Tub of water, safe household objects, towel',
    minutes: 15,
  },

  // --------------------------------------------------------------- Geography
  {
    id: 'pillow-continents',
    skillId: 'continents_oceans',
    subjectCode: 'geography',
    title: 'Pillow Continents',
    howTo:
      'Lay pillows on the floor as continents and a blue blanket as the ocean around them. Name each "continent" together, then sail a toy boat from one to another, naming where you land. Move the pillows and sail a new route.',
    materials: 'Pillows, blue blanket, toy boat',
    minutes: 15,
  },
  {
    id: 'animal-passport',
    skillId: 'world_animals',
    subjectCode: 'geography',
    title: 'Animal Passport',
    howTo:
      'Pick an animal from another part of the world, like a penguin or a kangaroo. Look it up together and draw it in a "passport" page with three facts: where it lives, what it eats, and one thing that makes it special.',
    materials: 'Paper, crayons',
    minutes: 15,
  },
  {
    id: 'treasure-map-bedroom',
    skillId: 'map_skills',
    subjectCode: 'geography',
    title: 'Treasure Map Bedroom',
    howTo:
      'Draw a simple map of your child\u2019s bedroom together: bed, door, window, toy box. Hide a small treasure and mark it with an X on the map. Trade roles so your child draws the map and hides the treasure for you.',
    materials: 'Paper, crayons, a small "treasure"',
    minutes: 20,
  },

  // ------------------------------------------------------------------ Coding
  {
    id: 'robot-parent',
    skillId: 'sequencing',
    subjectCode: 'coding',
    title: 'Robot Parent',
    howTo:
      'Your child programs you like a robot to make a sandwich, using only exact step-by-step instructions. Follow the instructions literally and hilariously. Then switch roles and let them be the robot.',
    materials: 'Bread and sandwich fillings',
    minutes: 15,
  },
  {
    id: 'clap-loop-patterns',
    skillId: 'loops',
    subjectCode: 'coding',
    title: 'Clap Loop Patterns',
    howTo:
      'Make a pattern of moves, like clap-clap-stomp, and repeat it four times as a "loop". Ask your child to be the programmer: they design a loop, you perform it exactly four times. Make the loops sillier each round.',
    materials: 'No materials needed',
    minutes: 10,
  },
  {
    id: 'bug-hunt-recipe',
    skillId: 'debugging',
    subjectCode: 'coding',
    title: 'Bug Hunt Recipe',
    howTo:
      'Write the steps for brushing teeth but sneak in one wrong step, like "put the toothbrush in your ear". Your child finds the bug and fixes the step. Take turns planting bugs for each other to debug.',
    materials: 'Paper, pencil',
    minutes: 10,
  },

  // ------------------------------------------------------------------- Music
  {
    id: 'kitchen-band-beat',
    skillId: 'rhythm',
    subjectCode: 'music',
    title: 'Kitchen Band Beat',
    howTo:
      'Grab pots, spoons, and shakers made from rice in a jar. You play a simple beat and your child copies it back, then they lead and you copy. Try a slow beat, a fast beat, and a silly beat.',
    materials: 'Pots, wooden spoons, jar with rice',
    minutes: 15,
  },
  {
    id: 'high-low-voice-game',
    skillId: 'pitch',
    subjectCode: 'music',
    title: 'High-Low Voice Game',
    howTo:
      'Sing a note high like a bird, then low like a bear. Your child echoes each one and tells you whether it was high or low. Draw a bird up high and a bear down low, pointing to the right one as you sing.',
    materials: 'Paper, crayons',
    minutes: 10,
  },
  {
    id: 'mystery-instrument',
    skillId: 'instruments',
    subjectCode: 'music',
    title: 'Mystery Instrument',
    howTo:
      'Play short clips of different instruments, or hum what they sound like, while your child guesses each one with eyes closed. Talk about what each instrument is made of and how the sound is made.',
    materials: 'Phone or speaker for clips (optional)',
    minutes: 10,
  },

  // ----------------------------------------------------------------- Drawing
  {
    id: 'rainbow-line-race',
    skillId: 'brush_control',
    subjectCode: 'drawing',
    title: 'Rainbow Line Race',
    howTo:
      'Draw wavy, zigzag, and spiral paths on paper. Your child traces each path slowly with a crayon, trying to stay on the line like a race car on a track. Time them on the second try and celebrate smoother lines.',
    materials: 'Paper, crayons',
    minutes: 10,
  },
  {
    id: 'color-the-feelings-face',
    skillId: 'coloring',
    subjectCode: 'drawing',
    title: 'Color the Feelings Face',
    howTo:
      'Draw a big blank face together. Ask your child to color it to show how they feel today, picking colors that match the mood. Talk about why they chose those colors while they work.',
    materials: 'Paper, crayons or markers',
    minutes: 10,
  },
  {
    id: 'story-scene-diorama',
    skillId: 'scene_composition',
    subjectCode: 'drawing',
    title: 'Story Scene Diorama',
    howTo:
      'Pick a favorite story and build one scene inside a shoebox: background drawing taped to the back, paper characters on the floor. Your child retells the story using the diorama as the stage.',
    materials: 'Shoebox, paper, crayons, tape, scissors (with help)',
    minutes: 20,
  },

  // ---------------------------------------------------------------- Feelings
  {
    id: 'feelings-charades',
    skillId: 'emotions',
    subjectCode: 'feelings',
    title: 'Feelings Charades',
    howTo:
      'Take turns acting out a feeling with only your face and body while the other person guesses: happy, sad, angry, scared, surprised, proud. After each guess, share a time you really felt that way.',
    materials: 'No materials needed',
    minutes: 10,
  },
  {
    id: 'star-breathing-together',
    skillId: 'breathing',
    subjectCode: 'feelings',
    title: 'Star Breathing Together',
    howTo:
      'Trace a star shape on paper. Breathe in as your finger climbs to a point, breathe out as it slides down to the next valley. Do five slow stars together, and notice how your bodies feel afterward.',
    materials: 'Paper with a drawn star',
    minutes: 5,
  },
  {
    id: 'calm-down-kit',
    skillId: 'calm_down',
    subjectCode: 'feelings',
    title: 'Calm-Down Kit',
    howTo:
      'Decorate a small box together and fill it with calm-down tools: a smooth stone, a family photo, a lavender cotton ball. Practice opening the kit and using one tool while calm, so it is ready for big feelings.',
    materials: 'Small box, smooth stone, photo, cotton ball',
    minutes: 15,
  },
];

/** All cards for one subject (island), in catalog order. */
export function playCardsForSubject(subjectCode: string): PlayCard[] {
  return PLAY_CARDS.filter((c) => c.subjectCode === subjectCode);
}

/** Find a card by id. */
export function getPlayCard(id: string): PlayCard | undefined {
  return PLAY_CARDS.find((c) => c.id === id);
}

/** Cards that practice a specific skill. */
export function playCardsForSkill(skillId: string): PlayCard[] {
  return PLAY_CARDS.filter((c) => c.skillId === skillId);
}

/** Human-friendly skill name from a code like "letter_sounds". */
export function skillDisplayName(skillId: string): string {
  return skillId
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
