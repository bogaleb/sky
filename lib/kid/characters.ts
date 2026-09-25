/**
 * The Sky cast: 8 original characters with distinct personalities,
 * TTS voice profiles, and signature lines. Single source of truth
 * for who everyone is, everywhere in the app.
 */

export interface CharacterVoice {
  /** 0..2, 1 = normal */
  pitch: number;
  /** 0.5..2, 1 = normal */
  rate: number;
}

export interface SkyCharacter {
  id: string;
  name: string;
  species: string;
  role: 'captain' | 'peer' | 'host';
  /** Which subject islands they host (empty for captain/peer). */
  subjects: string[];
  personality: string;
  color: string;
  voice: CharacterVoice;
  greeting: string;
  praise: string[];
  encouragement: string[];
  tapReaction: string[];
}

export const CHARACTERS: Record<string, SkyCharacter> = {
  curio: {
    id: 'curio',
    name: 'Curio',
    species: 'Fox captain',
    role: 'captain',
    subjects: ['drawing', 'writing'],
    personality: 'Warm, brave, and kind. The leader of the sky who greets every child by name and believes in them.',
    color: '#E0802A',
    voice: { pitch: 0.9, rate: 0.95 },
    greeting: "Ahoy, sky traveler! I'm Captain Curio, and I'm so glad you're here.",
    praise: [
      'Brilliant flying, little captain!',
      'You did it! The whole sky is cheering!',
      'Wow! You are getting so strong at this!',
    ],
    encouragement: [
      "That's okay, captain. Even I get turned around in the clouds sometimes.",
      'Take a breath. We can try again together.',
    ],
    tapReaction: [
      "Ahoy! Ready for an adventure?",
      'My scarf is extra fluffy today!',
      'I once flew all the way to the giggly clouds!',
    ],
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    species: 'Fox kit',
    role: 'peer',
    subjects: [],
    personality: 'A playful kid just like the player. Nova tries things, messes up out loud, laughs, and tries again. Teaches resilience.',
    color: '#F6AC55',
    voice: { pitch: 1.35, rate: 1.05 },
    greeting: "Hi hi! I'm Nova! I love trying new things. Sometimes I mess up, and that's okay!",
    praise: [
      'Whoa, you did it! High five!',
      'That was awesome! Can you teach me?',
      'Yay yay yay!',
    ],
    encouragement: [
      "Oops! I did that wrong too. Let's try again together!",
      'Hmm, that was tricky. One more try?',
      'Mistakes help our brains grow. Watch me try!',
    ],
    tapReaction: [
      'Hee hee! That tickles!',
      'Wanna see me do a flip? Wheee!',
      'I dropped my balloon again... oops!',
    ],
  },
  luna: {
    id: 'luna',
    name: 'Luna',
    species: 'Owl librarian',
    role: 'host',
    subjects: ['reading'],
    personality: 'Wise, gentle, and patient. Speaks softly and loves words. Never rushes.',
    color: '#8B7BC7',
    voice: { pitch: 0.85, rate: 0.85 },
    greeting: 'Welcome to the Floating Library, little reader. I am Luna. Let us open a story together.',
    praise: [
      'Beautifully read, little owl.',
      'Your words are growing wings.',
      'Hoo! What a wonderful reader you are becoming.',
    ],
    encouragement: [
      'Take your time. Words wait for us patiently.',
      'Let us sound it out together, slowly.',
    ],
    tapReaction: [
      'Shhh... the books are dreaming.',
      'I read three stories before breakfast!',
      'Every word is a tiny treasure.',
    ],
  },
  milo: {
    id: 'milo',
    name: 'Milo',
    species: 'Robot',
    role: 'host',
    subjects: ['math', 'coding'],
    personality: 'Cheerful, logical, loves patterns. Speaks in a bouncy robot rhythm. Gets excited about numbers.',
    color: '#4CC9F0',
    voice: { pitch: 0.7, rate: 1.0 },
    greeting: 'Beep boop! Hello! I am Milo! Welcome to the Number Volcano! Numbers are my favorite!',
    praise: [
      'Beep! Correct! My circuits are doing a happy dance!',
      'One hundred percent awesome! Computing... yep, awesome!',
      'You solved it! High-five my metal hand!',
    ],
    encouragement: [
      'Error? No problem! Rebooting our brains... try again!',
      'Let me count it with you. One... two...',
    ],
    tapReaction: [
      'Beep boop! Did you hear that?',
      'I can count to one million! Want to hear? Kidding!',
      'My favorite number is... all of them!',
    ],
  },
  bea: {
    id: 'bea',
    name: 'Bea',
    species: 'Bee explorer',
    role: 'host',
    subjects: ['science'],
    personality: 'Bubbly, curious, always buzzing with questions. Loves growing things and asking "why?".',
    color: '#FFC93C',
    voice: { pitch: 1.25, rate: 1.1 },
    greeting: 'Buzz buzz! Hi! I\'m Bea! Welcome to the Greenhouse! Let\'s discover something amazing!',
    praise: [
      'Buzz-tastic! You figured it out!',
      'Ohh, what a wonderful discovery!',
      'You think like a real scientist!',
    ],
    encouragement: [
      'Hmm, not quite. Scientists try lots of times! That\'s the fun part!',
      'Let\'s look closer together. What do you notice?',
    ],
    tapReaction: [
      'Buzz buzz! I\'m doing the waggle dance!',
      'Did you know flowers can hear us? Maybe!',
      'I planted a giggle seed today!',
    ],
  },
  tuno: {
    id: 'tuno',
    name: 'Tuno',
    species: 'Turtle',
    role: 'host',
    subjects: ['feelings'],
    personality: 'Calm, slow, soothing. Speaks gently. Helps children breathe and name their feelings.',
    color: '#7FB069',
    voice: { pitch: 0.75, rate: 0.75 },
    greeting: 'Hello, little one. I am Tuno. Welcome to the Quiet Cloud. We can rest here.',
    praise: [
      'Mmm. That was lovely. Well done.',
      'You did beautifully. Feel that calm?',
      'Slow and steady. Just like me.',
    ],
    encouragement: [
      'It\'s okay to feel wobbly. Let\'s breathe together.',
      'Rest a moment. There is no hurry here.',
    ],
    tapReaction: [
      'Mmm... I\'m having a cozy thought.',
      'Breathe in... and out... lovely.',
      'My shell is the comfiest pillow.',
    ],
  },
  riff: {
    id: 'riff',
    name: 'Riff',
    species: 'Rabbit musician',
    role: 'host',
    subjects: ['music'],
    personality: 'Energetic, rhythmic, speaks with musical bounce. Everything is a beat.',
    color: '#F15BB5',
    voice: { pitch: 1.15, rate: 1.15 },
    greeting: 'Hey hey! I\'m Riff! Welcome to the Rhythm Stage! Let\'s make some music!',
    praise: [
      'That was music to my ears!',
      'You\'ve got the beat! Encore!',
      'Hop hop hooray! Amazing rhythm!',
    ],
    encouragement: [
      'Missed the beat? No worries! Feel it again... one, two...',
      'Even drummers drop their sticks. Shake it off!',
    ],
    tapReaction: [
      'La la la! Sing with me!',
      'My ears can hear every beat!',
      'Boom chicka boom! That\'s my jam!',
    ],
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    species: 'Elephant explorer',
    role: 'host',
    subjects: ['geography'],
    personality: 'Gentle giant, loves maps and faraway places. Speaks with wonder about the world.',
    color: '#7A8BA3',
    voice: { pitch: 0.65, rate: 0.9 },
    greeting: 'Hello, explorer! I am Atlas! Welcome to the Observatory! The whole world is waiting for us!',
    praise: [
      'What a journey! You found it!',
      'The world is lucky to have an explorer like you!',
      'Stamped in my explorer journal: AMAZING!',
    ],
    encouragement: [
      'Explorers sometimes take the long way. That\'s how we discover!',
      'Let\'s look at the map together. Where could it be?',
    ],
    tapReaction: [
      'I\'ve been to the giggly clouds AND the sleepy seas!',
      'My satchel holds maps to everywhere!',
      'Did you know elephants never forget? I remember you!',
    ],
  },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS);

export function getCharacter(id: string): SkyCharacter {
  return CHARACTERS[id] ?? CHARACTERS.curio;
}

/** Pick a random line from a character's list. */
export function charLine(id: string, kind: 'praise' | 'encouragement' | 'tapReaction'): string {
  const c = getCharacter(id);
  const lines = c[kind];
  return lines[Math.floor(Math.random() * lines.length)];
}
