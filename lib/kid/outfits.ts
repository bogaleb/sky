/**
 * Sky Shop outfit catalog — Avatar Dress-Up accessories kids buy with
 * earned stars. All kid-facing: no emoji, friendly names and blurbs.
 * Art lives in ./outfit-art.tsx (OutfitArt), sized to the 96x96 avatar viewBox.
 */

export type OutfitSlot = 'hat' | 'glasses' | 'extra';

export interface Outfit {
  id: string;
  name: string;
  cost: number;
  slot: OutfitSlot;
  blurb: string;
}

export const OUTFITS: Outfit[] = [
  {
    id: 'explorer-hat',
    name: 'Explorer Hat',
    cost: 15,
    slot: 'hat',
    blurb: 'A brave safari hat for big adventures!',
  },
  {
    id: 'sleepy-nightcap',
    name: 'Sleepy Nightcap',
    cost: 15,
    slot: 'hat',
    blurb: 'A cozy cap for dreamy bedtime stories.',
  },
  {
    id: 'sailor-cap',
    name: 'Sailor Cap',
    cost: 20,
    slot: 'hat',
    blurb: 'All aboard! Captain of the Sky seas.',
  },
  {
    id: 'rainbow-glasses',
    name: 'Rainbow Glasses',
    cost: 25,
    slot: 'glasses',
    blurb: 'See the world in every color!',
  },
  {
    id: 'flower-crown',
    name: 'Flower Crown',
    cost: 30,
    slot: 'hat',
    blurb: 'A crown of garden flowers, just for you.',
  },
  {
    id: 'robot-antenna',
    name: 'Robot Antenna',
    cost: 35,
    slot: 'hat',
    blurb: 'Beep boop! Tune in to brilliant ideas.',
  },
  {
    id: 'pirate-hat',
    name: 'Pirate Hat',
    cost: 40,
    slot: 'hat',
    blurb: 'Sail the clouds and find hidden treasure!',
  },
  {
    id: 'butterfly-wings',
    name: 'Butterfly Wings',
    cost: 50,
    slot: 'extra',
    blurb: 'Fluttery wings for soaring high.',
  },
  {
    id: 'star-crown',
    name: 'Star Crown',
    cost: 60,
    slot: 'hat',
    blurb: 'A golden crown for a true Sky star.',
  },
  {
    id: 'supernova-cape',
    name: 'Supernova Cape',
    cost: 70,
    slot: 'extra',
    blurb: 'A hero cape that sparkles like the stars.',
  },
  {
    id: 'wizard-hat',
    name: 'Wizard Hat',
    cost: 25,
    slot: 'hat',
    blurb: 'A pointy hat for magical learning spells!',
  },
  {
    id: 'chef-hat',
    name: 'Chef Hat',
    cost: 20,
    slot: 'hat',
    blurb: 'Cook up something yummy in the Sky kitchen!',
  },
  {
    id: 'astronaut-helmet',
    name: 'Astronaut Helmet',
    cost: 45,
    slot: 'hat',
    blurb: 'Blast off to the stars and beyond!',
  },
  {
    id: 'firefighter-helmet',
    name: 'Firefighter Helmet',
    cost: 30,
    slot: 'hat',
    blurb: 'Brave helpers save the day!',
  },
  {
    id: 'star-glasses',
    name: 'Starry Glasses',
    cost: 30,
    slot: 'glasses',
    blurb: 'See stars wherever you go!',
  },
  {
    id: 'superhero-mask',
    name: 'Hero Mask',
    cost: 35,
    slot: 'glasses',
    blurb: 'A secret mask for everyday heroes!',
  },
  {
    id: 'frog-backpack',
    name: 'Froggy Backpack',
    cost: 40,
    slot: 'extra',
    blurb: 'Hop along with a froggy friend on your back!',
  },
  {
    id: 'party-balloon',
    name: 'Party Balloon',
    cost: 25,
    slot: 'extra',
    blurb: 'A floaty balloon for celebration days!',
  },
  {
    id: 'cowboy-hat',
    name: 'Cowboy Hat',
    cost: 25,
    slot: 'hat',
    blurb: 'Howdy, partner! Ride the Sky range.',
  },
  {
    id: 'knight-helmet',
    name: 'Knight Helmet',
    cost: 45,
    slot: 'hat',
    blurb: 'A shiny helmet for the bravest knights.',
  },
  {
    id: 'detective-cap',
    name: 'Detective Cap',
    cost: 30,
    slot: 'hat',
    blurb: 'A clever cap for solving every mystery.',
  },
  {
    id: 'snorkel-mask',
    name: 'Snorkel Mask',
    cost: 35,
    slot: 'glasses',
    blurb: 'Dive down for under-the-sea adventures!',
  },
  {
    id: 'rain-boots',
    name: 'Rain Boots',
    cost: 30,
    slot: 'extra',
    blurb: 'Sunny yellow boots for splashing in puddles!',
  },
  {
    id: 'rocket-jetpack',
    name: 'Rocket Jetpack',
    cost: 60,
    slot: 'extra',
    blurb: 'Zoom to the stars at super speed!',
  },
];

export function getOutfit(id: string): Outfit | undefined {
  return OUTFITS.find((o) => o.id === id);
}

/** Outfit ids that share a slot — equipping one unequips the rest. */
export function slotMates(id: string): string[] {
  const outfit = getOutfit(id);
  if (!outfit) return [];
  return OUTFITS.filter((o) => o.slot === outfit.slot && o.id !== id).map((o) => o.id);
}

export interface OutfitState extends Outfit {
  unlocked: boolean;
  equipped: boolean;
}
