import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Wave 10 hub restructure: the Sky Park is now registry-driven
// (components/kid/game-registry.tsx). Contract class names still hold in the
// map-phase JSX, every entry point label is still present in the registry,
// the Trail leads the hub, and no emoji slipped into child-facing surfaces.
const kidDir = join(process.cwd(), 'components', 'kid');
const player = readFileSync(join(kidDir, 'session-player.tsx'), 'utf8');
const map = readFileSync(join(kidDir, 'sky-map.tsx'), 'utf8');
const registry = readFileSync(join(kidDir, 'game-registry.tsx'), 'utf8');
const art = readFileSync(join(kidDir, 'game-art.tsx'), 'utf8');
const shell = readFileSync(join(kidDir, 'kid-shell.tsx'), 'utf8');

const PARK_LABELS = [
  'Memory Cove',
  'Dress Up',
  'Pattern Parade',
  'Puzzle Reef',
  'Trophies',
  'Word Builder',
  'Number Run',
  'Story Cinema',
  'Creative Studio',
  'Bedtime',
  'Letter Lab',
  'World Tour',
  'Rhythm Studio',
  'Science Lab',
  'Coding Cove',
  'Phonics Fun',
  'Animal Book',
  'Clock Tower',
  'Coin Cove',
  'Movie Studio',
  'Character Homes',
  'Feelings Theater',
  'Color Mix Lab',
  'Rhyme Time',
  'Pet Playground',
  'Fraction Fair',
  'My Look',
  'Sentence Studio',
  'Measure Meadow',
  'Opposites Attic',
];

const PARK_IDS = [
  'memory',
  'dressup',
  'pattern',
  'puzzle',
  'trophies',
  'words',
  'numbers',
  'cinema',
  'studio',
  'bedtime',
  'writing',
  'geography',
  'rhythm',
  'science',
  'coding',
  'phonics',
  'encyclopedia',
  'time',
  'money',
  'movies',
  'homes',
  'feelings',
  'colors',
  'rhymes',
  'playground',
  'fractions',
  'avatar',
  'sentences',
  'measure',
  'opposites',
];

const EMOJI = /[🌀-🫿☀-➿⬀-⯿️]/u;

describe('map redesign contract', () => {
  it('renders the ambient SkyBackdrop once via KidShell (no duplicate in the map phase)', () => {
    expect(shell).toContain('<SkyBackdrop />');
    expect(shell).toMatch(/from '\.\/sky-backdrop'/);
    // The map phase must not render its own copy — KidShell covers it.
    expect(player).not.toContain('<SkyBackdrop />');
    // The dead design-fallback shim is gone entirely.
    expect(player).not.toContain('design-fallback');
  });

  it('uses the design-system contract classes in the map phase and registry', () => {
    for (const cls of ['glass-kid', 'font-display', 'btn-kid']) {
      expect(player, cls).toContain(cls);
    }
    // GameCard applies the color modifier per entry via template literal.
    expect(registry).toContain('btn-kid-${entry.color}');
    expect(registry).toContain('font-display');
  });

  it('presents Sky Park as a glass panel with a display-font title', () => {
    expect(player).toContain('aria-label="Sky Park"');
    expect(player).toMatch(/<section[^>]*className="[^"]*glass-kid/);
    expect(player).toMatch(/<h2 className="font-display[^"]*">Sky Park<\/h2>/);
  });

  it('leads the hub with the Trail, then the park, then the map', () => {
    const trail = player.indexOf('<TrailBanner');
    const park = player.indexOf('aria-label="Sky Park"');
    const skyMap = player.indexOf('<SkyMap');
    expect(trail).toBeGreaterThan(-1);
    expect(park).toBeGreaterThan(trail);
    expect(skyMap).toBeGreaterThan(park);
  });

  it('keeps all 30 Sky Park games in the registry with contract button classes', () => {
    for (const label of PARK_LABELS) {
      expect(registry, label).toContain(`title: '${label}'`);
    }
    for (const id of PARK_IDS) {
      expect(registry, id).toContain(`id: '${id}'`);
    }
    // GameCard keeps the Wave 8/9 chunky button styling for every color.
    expect(registry).toMatch(/`btn-kid btn-kid-\$\{entry\.color\} group`/);
  });

  it('opens every park game through the single registry renderer (no per-game booleans)', () => {
    expect(player).toContain('<GameCard');
    expect(player).toContain('onOpen={(id) => setOpenGame(id)}');
    expect(player).toContain('<GameOverlay');
    expect(player).not.toContain('setShowMemory(true)');
    expect(player).not.toContain('setShowTrophies(true)');
  });

  it('keeps the widget row with all four widgets inside a glass strip', () => {
    expect(player).toMatch(/<div className="glass-kid[^"]*">\s*<GoalMeter/);
    expect(player).toContain('<DailyGift');
    expect(player).toContain('<ShowdownCard');
    expect(player).toContain('<StreakCalendar');
  });

  it('keeps character talk and sticker book entry points prominent', () => {
    expect(player).toContain('onOpenStickers={() => setShowStickers(true)}');
    expect(player).toContain('onTalkToCharacter={(id) => setTalkWith(id)}');
    expect(map).toContain('Say hello to a friend!');
    expect(map).toContain('My stickers');
  });

  it('enlarges game button art with hover motion that respects reduced motion', () => {
    expect(art).toContain('h-12 w-12');
    expect(art).toContain('motion-safe:group-hover:scale-110');
  });
});

describe('island card redesign', () => {
  it('uses card-kid, font-display, and glass-kid on the map', () => {
    expect(map).toContain('card-kid');
    expect(map).toContain('font-display');
    expect(map).toContain('glass-kid');
  });

  it('gives island cards a 3D-tilt hover with glow, reduced-motion safe', () => {
    expect(map).toContain('perspective(900px)');
    expect(map).toContain('motion-safe:hover:');
    expect(map).toContain('radial-gradient');
  });

  it('shows progress as a ring instead of a bar, from the same progress prop', () => {
    expect(map).toContain('strokeDasharray');
    expect(map).toContain('strokeLinecap="round"');
    expect(map).not.toContain('h-2.5 overflow-hidden rounded-full');
    expect(map).toContain('{progress.mastered}/{progress.total}');
  });

  it('keeps the island card public API unchanged', () => {
    expect(map).toContain('onSelectIsland: (island: Island) => void');
    expect(map).toContain('onSurprise: () => void');
    expect(map).toContain('onOpenStickers?: () => void');
    expect(map).toContain('onTalkToCharacter?: (characterId: string) => void');
    expect(map).toContain('progress?: Record<string, { mastered: number; total: number }>');
  });

  it('styles Surprise and sticker buttons with contract button classes', () => {
    expect(map).toContain('btn-kid btn-kid-sky');
    expect(map).toContain('btn-kid btn-kid-grape');
    expect(map).toContain('Surprise me!');
  });
});

describe('child-surface hygiene', () => {
  it('adds no emoji to the redesigned surfaces', () => {
    expect(player).not.toMatch(EMOJI);
    expect(map).not.toMatch(EMOJI);
    expect(registry).not.toMatch(EMOJI);
    expect(art).not.toMatch(EMOJI);
  });
});
