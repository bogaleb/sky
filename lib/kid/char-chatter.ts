/**
 * Character chatter: line packs for talking with the Sky cast.
 * Every character has greetings, clean silly jokes, real educational
 * fun facts tied to their subject, and warm encouragement.
 * COPPA-safe: no personal questions, no names, no data collection.
 */

export type ChatterCategory = 'greeting' | 'joke' | 'funFact' | 'encouragement';

export interface ChatterPack {
  greeting: string[];
  joke: string[];
  funFact: string[];
  encouragement: string[];
}

export const CHATTER: Record<string, ChatterPack> = {
  curio: {
    greeting: [
      'Ahoy, sky traveler! Captain Curio here, and the wind is just perfect for adventure.',
      'Welcome aboard! I saved you the very best cloud seat.',
      'Ahoy! My compass is spinning with excitement because you are here.',
    ],
    joke: [
      'Why did the cloud go to school? To become a little brighter!',
      'What do you call a fox who tells jokes? A real crack-up!',
      'Why do pirates never get lost? Because they always follow the arrr-t!',
    ],
    funFact: [
      'Long ago, sailors steered ships using only the stars, just like we sail the sky.',
      'A compass needle always points north because Earth is one giant magnet.',
      'Explorers once drew maps of lands nobody had ever seen, and they got better every trip.',
      'The word adventure comes from an old word that means about to happen. Every day is an adventure waiting to happen.',
    ],
    encouragement: [
      'Every great captain was once a beginner. You are doing wonderfully.',
      'Stormy skies pass, brave traveler. Keep sailing.',
      'I believe in you all the way to the horizon and back.',
    ],
  },
  nova: {
    greeting: [
      'Hi hi! It is me, Nova! Want to try something fun together?',
      'Yay, you are here! I was just practicing my wobbly cartwheels.',
      'Hello hello! Today is a great day to try, try again!',
    ],
    joke: [
      'Why did the banana go to the doctor? It was not peeling well!',
      'What do you call cheese that is not yours? Nacho cheese!',
      'Why did the cookie visit the hospital? Because it felt crumby!',
    ],
    funFact: [
      'Your brain grows stronger every single time you try something hard.',
      'Mistakes are how brains learn. Scientists call it growing a growth mindset.',
      'Even baby fox kits stumble when they learn to pounce. Practice makes pouncers.',
      'Laughing when you mess up tells your brain it is safe to keep trying.',
    ],
    encouragement: [
      'Oops is just the first step of yay! Let us try again.',
      'I messed that up three times yesterday. Four is my lucky number!',
      'Trying is the bravest thing of all, and you are doing it right now.',
    ],
  },
  luna: {
    greeting: [
      'Welcome to the Floating Library, little reader. Shall we open a story?',
      'Hoo! You came back to read. That makes my feathers fluff with joy.',
      'Shhh... the books missed you. Pick any shelf, and we will begin.',
    ],
    joke: [
      'Why did the book join the gym? To get its spine in shape!',
      'What is an owl favorite subject? Owl-gebra!',
      'Why are libraries so tall? Because they have so many stories!',
    ],
    funFact: [
      'Owls cannot move their eyes, so they turn their whole heads almost all the way around.',
      'A baby owl is called an owlet, and it says peep peep when it is tiny.',
      'Owls hear so well they can catch dinner in total darkness.',
      'Reading just twenty minutes a day fills your brain with thousands of new words every year.',
    ],
    encouragement: [
      'Take your time, little owl. Words wait for us patiently.',
      'Every reader stumbles. Even I mix up my hoots sometimes.',
      'You sounded that out beautifully. Your wings are growing.',
    ],
  },
  milo: {
    greeting: [
      'Beep boop! Milo here! Ready to crunch some numbers?',
      'Hello, human friend! My number circuits are warmed up and buzzing!',
      'Beep! Welcome to the Number Volcano! It is about to erupt with fun!',
    ],
    joke: [
      'Why was six afraid of seven? Because seven eight nine!',
      'What do you call a robot who takes long naps? A rust bucket!',
      'Why did the math book look sad? Too many problems!',
    ],
    funFact: [
      'Zero is the only number you cannot divide by. It breaks math brains!',
      'A pattern is just something that repeats. Spotting patterns is how computers think.',
      'Honeybees do a wiggly dance that tells their friends exactly where the flowers are. That is nature using code!',
      'Counting to ten uses the same brain power as building a robot. You are already an engineer.',
    ],
    encouragement: [
      'Error? No problem! Rebooting... let us try again together.',
      'My circuits believe in you. Computing... yep, definitely!',
      'One step at a time. Even robots learn line by line.',
    ],
  },
  bea: {
    greeting: [
      'Buzz buzz! Bea here! The Greenhouse is bursting with discoveries today!',
      'Hi hi! I just found the wiggliest worm. Science is the best!',
      'Welcome, explorer! Put on your curiosity goggles. We are going discovering!',
    ],
    joke: [
      'What do you call a bee who cannot stop talking? A blab-bee!',
      'Why do bees have sticky hair? Because they use honeycombs!',
      'What is a frog favorite science? Croak-ology!',
    ],
    funFact: [
      'Bees dance in a figure eight to tell their hive friends where the flowers are.',
      'Bees can see ultraviolet light, which is invisible to human eyes. Flowers glow for them!',
      'One bee visits thousands of flowers every single day to make honey.',
      'Plants drink water through their roots and breathe through tiny holes in their leaves.',
    ],
    encouragement: [
      'Scientists try lots of times! That is the fun part. Let us look closer.',
      'Every great discovery started with a curious hmm. You are on your way!',
      'Buzz it off and try again. I believe in your brilliant brain!',
    ],
  },
  tuno: {
    greeting: [
      'Hello, little one. Welcome to the Quiet Cloud. We can rest here together.',
      'Mmm... you made it. Slow down, breathe deep, stay a while.',
      'Welcome back, friend. My shell is warm and there is room for you.',
    ],
    joke: [
      'Why did the turtle cross the road? To get to the Shell station!',
      'What do you call a slow dance party? A turt-le disco!',
      'Why are turtles so wise? They take time to think things through!',
    ],
    funFact: [
      'Some tortoises live more than one hundred years. Slow and steady really works.',
      'Sea turtles can hold their breath for a very long time when they rest under the waves.',
      'Turtles can feel through their shells, so gentle touches feel extra cozy.',
      'Breathing out slowly tells your whole body it is safe to feel calm.',
    ],
    encouragement: [
      'It is okay to feel wobbly. Let us breathe together. In... and out...',
      'Rest a moment, little one. There is no hurry here. Not even a little.',
      'Feelings are like clouds. They drift by, and you are still you.',
    ],
  },
  riff: {
    greeting: [
      'Hey hey! Riff here! The Rhythm Stage is warmed up and ready to groove!',
      'La la la! You made it! Let us make some beautiful noise together!',
      'Hop hop! Welcome! I have been tapping my feet waiting for you!',
    ],
    joke: [
      'What is a rabbit favorite kind of music? Hip-hop!',
      'Why did the drum go to bed? It was beat!',
      'What do you call a musical bee? A hum-dinger!',
    ],
    funFact: [
      'Rhythm is just sound organized in time. Your heartbeat is your very first drum.',
      'Songs help brains remember things. That is why the alphabet has a tune!',
      'Rabbits thump their back feet to send messages. It is bunny drumming!',
      'Humming vibrates your whole body and can actually help you feel calmer.',
    ],
    encouragement: [
      'Missed the beat? No worries! Feel it again... one, two...',
      'Even drummers drop their sticks. Shake it off and jump back in!',
      'You have got the rhythm in you. I can hear it. Keep going!',
    ],
  },
  atlas: {
    greeting: [
      'Hello, explorer! Atlas here! The whole wide world is waiting for us!',
      'Welcome to the Observatory! I just polished my telescope for you!',
      'Greetings, traveler! My map has a brand new empty page with your name on the adventure.',
    ],
    joke: [
      'Why did the elephant bring a suitcase? It wanted to pack its trunk!',
      'What do you call an explorer who loves naps? A snore-plorer!',
      'Why are maps so good at keeping secrets? They never spill the beans, only the borders!',
    ],
    funFact: [
      'Elephants are the only animals that cannot jump. They do not need to. They are already amazing.',
      'An elephant trunk has about forty thousand muscles. Your whole body has only about six hundred!',
      'Earth has seven continents and five oceans, and people are still discovering new creatures in them.',
      'Elephants talk to each other through rumbles so low they travel through the ground.',
    ],
    encouragement: [
      'Explorers sometimes take the long way. That is how we discover!',
      'Every map was once blank. You are drawing yours beautifully.',
      'The world is lucky to have a curious explorer like you. Onward!',
    ],
  },
};

export const CHATTER_CHARACTER_IDS = Object.keys(CHATTER);

/** A random line from a character's pack. Falls back to Curio for unknown ids. */
export function chatterLine(characterId: string, category: ChatterCategory): string {
  const pack = CHATTER[characterId] ?? CHATTER.curio;
  const lines = pack[category];
  return lines[Math.floor(Math.random() * lines.length)];
}

/** Tab labels for the talk UI, in display order. */
export const CHATTER_TABS: { id: ChatterCategory; label: string }[] = [
  { id: 'greeting', label: 'Say hi' },
  { id: 'joke', label: 'Tell a joke' },
  { id: 'funFact', label: 'Fun fact' },
  { id: 'encouragement', label: 'Cheer me up' },
];
