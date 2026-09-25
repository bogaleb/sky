import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Wave 8 "Mesmerizing" visual redesign: contract class names are used in the
// map-phase JSX, every entry point label is still present, handlers are
// untouched, and no emoji slipped into child-facing surfaces.
const kidDir = join(process.cwd(), 'components', 'kid');
const player = readFileSync(join(kidDir, 'session-player.tsx'), 'utf8');
const map = readFileSync(join(kidDir, 'sky-map.tsx'), 'utf8');
const fallback = readFileSync(join(kidDir, 'design-fallback.tsx'), 'utf8');

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

const PARK_HANDLERS = [
  'setShowMemory(true)',
  'setShowDressUp(true)',
  'setShowPattern(true)',
  'setShowPuzzle(true)',
  'setShowTrophies(true)',
  'setShowWords(true)',
  'setShowNumbers(true)',
  'setShowCinema(true)',
  'setShowStudio(true)',
  'setShowBedtime(true)',
  'setShowWriting(true)',
  'setShowGeography(true)',
  'setShowRhythm(true)',
  'setShowScience(true)',
  'setShowCoding(true)',
  'setShowPhonics(true)',
  'setShowEncyclopedia(true)',
  'setShowTime(true)',
  'setShowMoney(true)',
  'setShowMovies(true)',
  'setShowHomes(true)',
  'setShowFeelings(true)',
  'setShowColors(true)',
  'setShowRhymes(true)',
  'setShowPlayground(true)',
  'setShowFractions(true)',
  'setShowAvatarStudio(true)',
  'setShowSentences(true)',
  'setShowMeasure(true)',
  'setShowOpposites(true)',
];

const EMOJI = /[🌀-🫿☀-➿⬀-⯿️]/u;

describe('map redesign contract', () => {
  it('renders the ambient SkyBackdrop once via KidShell (no duplicate in the map phase)', () => {
    expect(shell).toContain('<SkyBackdrop />');
    expect(shell).toMatch(/from '\.\/sky-backdrop'/);
    // The map phase must not render its own copy — KidShell covers it.
    expect(player).not.toContain('<SkyBackdrop />');
    expect(player).toMatch(/from '\.\/design-fallback'/);
  });

  it('uses the design-system contract classes in the map phase', () => {
    for (const cls of ['glass-kid', 'font-display', 'btn-kid', 'btn-kid-coral', 'btn-kid-sky', 'btn-kid-mint', 'btn-kid-grape']) {
      expect(player, cls).toContain(cls);
    }
  });

  it('presents Sky Park as a glass panel with a display-font title', () => {
    expect(player).toContain('aria-label="Sky Park"');
    expect(player).toMatch(/<section[^>]*className="[^"]*glass-kid/);
    expect(player).toMatch(/<h2 className="font-display[^"]*">Sky Park<\/h2>/);
  });

  it('keeps all 30 Sky Park game buttons with contract button classes', () => {
    for (const label of PARK_LABELS) {
      expect(player, label).toContain(`>${label}<`);
    }
    const buttons = player.match(/className="btn-kid btn-kid-(coral|sky|mint|grape) group"/g) ?? [];
    expect(buttons.length).toBe(PARK_LABELS.length);
    for (const color of ['coral', 'sky', 'mint', 'grape']) {
      expect(player, `btn-kid-${color}`).toContain(`btn-kid-${color}`);
    }
  });

  it('keeps every Sky Park onClick handler identical (visual pass only)', () => {
    for (const handler of PARK_HANDLERS) {
      expect(player, handler).toContain(handler);
    }
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
    expect(player).toContain('h-12 w-12');
    expect(player).toContain('motion-safe:group-hover:scale-110');
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

describe('design fallback', () => {
  it('exports the contract names the map phase imports', () => {
    expect(fallback).toContain('export default function SkyBackdrop');
    expect(fallback).toContain('export function DesignFallbackStyles');
  });

  it('defines minimal contract-class styles with a reduced-motion guard', () => {
    for (const cls of ['.glass-kid', '.btn-kid', '.btn-kid-coral', '.btn-kid-sky', '.btn-kid-mint', '.btn-kid-grape', '.card-kid', '.font-display']) {
      expect(fallback, cls).toContain(cls);
    }
    expect(fallback).toContain('prefers-reduced-motion');
  });

  it('only injects fallback styles when the real design system is absent', () => {
    expect(fallback).toContain('getComputedStyle');
    expect(fallback).toContain('data-sky-design-fallback');
  });
});

describe('child-surface hygiene', () => {
  it('adds no emoji to the redesigned surfaces', () => {
    expect(player).not.toMatch(EMOJI);
    expect(map).not.toMatch(EMOJI);
    expect(fallback).not.toMatch(EMOJI);
  });
});
