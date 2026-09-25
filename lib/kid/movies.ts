/**
 * My Movie Studio — data + logic for kid-directed cartoons.
 *
 * Kids pick 2 cast members from the 8-character Sky cast, 1 of 6 backdrops,
 * and 3 story beats in order, then premiere their cartoon with TTS narration.
 * Movies are saved on-device (localStorage), cap 12 per child.
 */

export interface Backdrop {
  id: string;
  name: string;
  tagline: string;
  /** [sky top, sky bottom, ground] gradient stops */
  colors: [string, string, string];
  accent: string;
}

export interface StoryBeat {
  id: string;
  title: string;
  /** {A} and {B} are replaced with the two cast members' names at showtime. */
  narration: string;
}

export interface Movie {
  characters: [string, string];
  backdropId: string;
  beats: [string, string, string];
}

export const MAX_MOVIES = 12;

export const CAST_IDS = ['curio', 'nova', 'luna', 'milo', 'bea', 'tuno', 'riff', 'atlas'] as const;

export const BACKDROPS: Backdrop[] = [
  {
    id: 'meadow',
    name: 'Sunny Meadow',
    tagline: 'A bright field full of flowers',
    colors: ['#7CC4F2', '#BFE8FA', '#7ED6A5'],
    accent: '#FFD93C',
  },
  {
    id: 'night',
    name: 'Starry Night',
    tagline: 'Twinkling stars and a sleepy moon',
    colors: ['#1B2A52', '#3A4A8C', '#2E4A6E'],
    accent: '#FFF3B0',
  },
  {
    id: 'reef',
    name: 'Ocean Reef',
    tagline: 'Bubbles and friendly fish',
    colors: ['#4CC9F0', '#8FE3FF', '#2E9BC6'],
    accent: '#FF9DAD',
  },
  {
    id: 'library',
    name: 'Cozy Library',
    tagline: 'Tall shelves of storybooks',
    colors: ['#C98A4B', '#E8B96E', '#8A5A2B'],
    accent: '#9B7EDE',
  },
  {
    id: 'space',
    name: 'Space Station',
    tagline: 'Planets spinning outside the window',
    colors: ['#2B1B52', '#5B3A9E', '#3A2A6E'],
    accent: '#4FD8C4',
  },
  {
    id: 'garden',
    name: 'Honey Garden',
    tagline: 'Buzzing bees and sweet blossoms',
    colors: ['#FFE66D', '#FFF3B0', '#FFB020'],
    accent: '#FF7BAC',
  },
];

export const BEATS: Record<string, StoryBeat[]> = {
  meadow: [
    {
      id: 'meadow-hello',
      title: 'A Sunny Hello',
      narration: '{A} waves hello to {B} under the warm morning sun. "What a perfect day for an adventure!"',
    },
    {
      id: 'meadow-picnic',
      title: 'The Picnic',
      narration: '{A} and {B} spread a blanket and share crunchy apple slices. They giggle when a butterfly lands on the basket.',
    },
    {
      id: 'meadow-kite',
      title: 'Kite Trouble',
      narration: 'Oh no! Their kite is stuck in the tallest tree! {A} boosts {B} up high, and together they set it free.',
    },
    {
      id: 'meadow-dance',
      title: 'Flower Dance',
      narration: '{A} and {B} dance between the flowers until the sun begins to set. "Best day ever," they both sigh.',
    },
  ],
  night: [
    {
      id: 'night-stargaze',
      title: 'Counting Stars',
      narration: '{A} and {B} lie on a soft hill and count the twinkling stars. One, two, three... so many!',
    },
    {
      id: 'night-shooting',
      title: 'A Shooting Star',
      narration: 'Look! A shooting star streaks across the sky! {A} and {B} close their eyes and make a wish.',
    },
    {
      id: 'night-owl',
      title: 'Hoot Says Hi',
      narration: 'A sleepy owl hoots hello from the old oak tree. {A} hoots back, and they both laugh softly.',
    },
    {
      id: 'night-moon',
      title: 'Goodnight Moon',
      narration: 'The moon smiles down as {A} and {B} whisper, "Goodnight, stars. Goodnight, moon."',
    },
  ],
  reef: [
    {
      id: 'reef-dive',
      title: 'Splash In',
      narration: '{A} and {B} splash into the sparkling reef. "Blub blub!" says {A}, and {B} laughs bubbles.',
    },
    {
      id: 'reef-fish',
      title: 'Fish Friends',
      narration: 'A school of rainbow fish swims by. {A} and {B} follow them through a wavy garden of sea plants.',
    },
    {
      id: 'reef-shell',
      title: 'The Singing Shell',
      narration: '{A} finds a big pink shell. When they hold it up, it plays the prettiest ocean song.',
    },
    {
      id: 'reef-treasure',
      title: 'Hidden Treasure',
      narration: 'Behind the coral, {A} and {B} find a treasure chest! Inside are shiny pebbles for every friend back home.',
    },
  ],
  library: [
    {
      id: 'library-find',
      title: 'The Big Book',
      narration: '{A} pulls the biggest book off the shelf. "Whoa," whispers {B}. "This one is full of magic!"',
    },
    {
      id: 'library-read',
      title: 'Story Time',
      narration: '{B} reads aloud while {A} turns the pages. The pictures seem to wiggle and dance.',
    },
    {
      id: 'library-ladder',
      title: 'Ladder Climb',
      narration: '{A} climbs the rolling ladder to the tippy top shelf and finds a book nobody has ever read.',
    },
    {
      id: 'library-secret',
      title: 'A Secret Door',
      narration: 'One book is really a secret door! {A} and {B} peek through and find... another library, tinier still.',
    },
  ],
  space: [
    {
      id: 'space-blast',
      title: 'Blast Off',
      narration: 'Three, two, one... blast off! {A} and {B} zoom past the moon in their shiny rocket.',
    },
    {
      id: 'space-planets',
      title: 'Planet Parade',
      narration: '{B} points out every planet to {A}. "That one is striped! That one is red! That one looks like candy!"',
    },
    {
      id: 'space-alien',
      title: 'A Friendly Alien',
      narration: 'A tiny green alien waves at the window. {A} waves back, and the alien does a happy flip.',
    },
    {
      id: 'space-home',
      title: 'Home Again',
      narration: 'The rocket lands softly in the meadow. "Space was amazing," says {B} to {A}, "but home is the best."',
    },
  ],
  garden: [
    {
      id: 'garden-bloom',
      title: 'Flowers Wake Up',
      narration: 'The sun tickles the blossoms awake. {A} and {B} sniff the sweetest flower they can find.',
    },
    {
      id: 'garden-bees',
      title: 'Bee Parade',
      narration: 'The bees march by in a buzzing parade. {A} and {B} march along, buzzing too. Bzzzzz!',
    },
    {
      id: 'garden-honey',
      title: 'Sticky Honey',
      narration: '{A} finds a drippy honeycomb. They taste one tiny drop. "Mmm! Sweet like sunshine!"',
    },
    {
      id: 'garden-seeds',
      title: 'Planting Seeds',
      narration: '{A} and {B} plant tiny seeds and promise to water them every day. "Grow big and tall!"',
    },
  ],
};

export function backdropFor(id: string): Backdrop | undefined {
  return BACKDROPS.find((b) => b.id === id);
}

export function beatFor(backdropId: string, beatId: string): StoryBeat | undefined {
  return (BEATS[backdropId] ?? []).find((b) => b.id === beatId);
}

/** Replace {A}/{B} placeholders with the cast members' names. */
export function fillNarration(narration: string, nameA: string, nameB: string): string {
  return narration.replaceAll('{A}', nameA).replaceAll('{B}', nameB);
}

export function validMovie(movie: unknown): movie is Movie {
  if (typeof movie !== 'object' || movie === null) return false;
  const m = movie as Record<string, unknown>;
  if (!Array.isArray(m.characters) || m.characters.length !== 2) return false;
  if (!m.characters.every((c) => typeof c === 'string' && (CAST_IDS as readonly string[]).includes(c))) return false;
  if (m.characters[0] === m.characters[1]) return false;
  if (typeof m.backdropId !== 'string' || !backdropFor(m.backdropId)) return false;
  if (!Array.isArray(m.beats) || m.beats.length !== 3) return false;
  const beats = BEATS[m.backdropId as string] ?? [];
  if (!m.beats.every((b) => typeof b === 'string' && beats.some((beat) => beat.id === b))) return false;
  return true;
}

// ---------------------------------------------------------------------------
// On-device movie gallery (localStorage). Storage is injectable for tests.
// ---------------------------------------------------------------------------

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function movieKey(childId: string): string {
  return `sky-movies-${childId}`;
}

function readMovies(storage: StorageLike, childId: string): Movie[] {
  try {
    const raw = storage.getItem(movieKey(childId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validMovie).slice(0, MAX_MOVIES);
  } catch {
    return [];
  }
}

function writeMovies(storage: StorageLike, childId: string, movies: Movie[]): void {
  try {
    storage.setItem(movieKey(childId), JSON.stringify(movies.slice(0, MAX_MOVIES)));
  } catch {
    /* storage full or unavailable — movies are a bonus, not critical */
  }
}

/** Save a movie to the front of the gallery. Returns false when the gallery is full. */
export function saveMovie(storage: StorageLike, childId: string, movie: Movie): boolean {
  if (!validMovie(movie)) return false;
  const movies = readMovies(storage, childId);
  if (movies.length >= MAX_MOVIES) return false;
  writeMovies(storage, childId, [movie, ...movies]);
  return true;
}

export function getMovies(storage: StorageLike, childId: string): Movie[] {
  return readMovies(storage, childId);
}

export function deleteMovie(storage: StorageLike, childId: string, index: number): Movie[] {
  const movies = readMovies(storage, childId);
  if (index < 0 || index >= movies.length) return movies;
  const next = movies.filter((_, i) => i !== index);
  writeMovies(storage, childId, next);
  return next;
}

export function premiereKey(childId: string): string {
  return `sky-movie-premiered-${childId}`;
}
