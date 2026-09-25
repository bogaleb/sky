import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GAME_GROUPS,
  GAME_REGISTRY,
  VISIBLE_GAMES,
  gamesForGroup,
  getGame,
  picksForDate,
  todaysPicks,
} from '@/components/kid/game-registry';
import { GAME_ART } from '@/components/kid/game-art';

// Wave 10 hub restructure: the game registry is the single source of truth
// for every Sky Park game. Behavioral tests import the real module; the
// HEAD cross-check guarantees no game was lost in the refactor.

const kidDir = join(process.cwd(), 'components', 'kid');
const player = readFileSync(join(kidDir, 'session-player.tsx'), 'utf8');
const registrySrc = readFileSync(join(kidDir, 'game-registry.tsx'), 'utf8');

const COLORS = ['coral', 'sky', 'mint', 'grape'] as const;

function headLabels(): string[] {
  const atHead = execSync('git show HEAD:components/kid/session-player.tsx', {
    cwd: process.cwd(),
    maxBuffer: 8 * 1024 * 1024,
  }).toString('utf8');
  const labels = new Set<string>();
  const re = /<span className="font-display text-lg[^"]*">([^<]+)<\/span>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(atHead)) !== null) labels.add(m[1].trim());
  return [...labels];
}

describe('registry integrity', () => {
  it('registers 30 visible games plus the hidden pet companion entry', () => {
    expect(GAME_REGISTRY).toHaveLength(31);
    expect(VISIBLE_GAMES).toHaveLength(30);
    expect(GAME_REGISTRY.filter((g) => g.hidden)).toHaveLength(1);
  });

  it('has unique ids and complete fields on every entry', () => {
    const ids = GAME_REGISTRY.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GAME_REGISTRY) {
      expect(g.id, 'id').toMatch(/^[a-z]+$/);
      expect(g.title.length, `${g.id} title`).toBeGreaterThan(0);
      expect(g.sub.length, `${g.id} sub`).toBeGreaterThan(0);
      expect(COLORS, `${g.id} color`).toContain(g.color);
      expect(typeof g.render).toBe('function');
    }
  });

  it('references only real groups, and every group has games', () => {
    const groupIds = new Set(GAME_GROUPS.map((g) => g.id));
    for (const g of GAME_REGISTRY) expect(groupIds, g.id).toContain(g.group);
    for (const group of GAME_GROUPS) {
      expect(gamesForGroup(group.id).length, group.id).toBeGreaterThan(0);
    }
    // No game leaks between groups.
    const total = GAME_GROUPS.reduce((n, g) => n + gamesForGroup(g.id).length, 0);
    expect(total).toBe(VISIBLE_GAMES.length);
  });

  it('has button art for every visible entry', () => {
    for (const g of VISIBLE_GAMES) {
      expect(GAME_ART[g.art], `${g.id} art`).toBeDefined();
    }
  });

  it('resolves entries by id and returns undefined for unknown ids', () => {
    expect(getGame('words')?.title).toBe('Word Builder');
    expect(getGame('pet')?.hidden).toBe(true);
    expect(getGame(null)).toBeUndefined();
    expect(getGame('nope')).toBeUndefined();
  });
});

describe('HEAD cross-check: no game lost in the refactor', () => {
  it('keeps every game that was reachable at HEAD', () => {
    const labels = headLabels();
    expect(labels.length).toBe(30);
    const titles = new Set(GAME_REGISTRY.map((g) => g.title));
    for (const label of labels) {
      expect(titles, label).toContain(label);
    }
  });
});

describe("today's picks", () => {
  it('is deterministic for a given date', () => {
    const a = picksForDate(2026, 9, 25).map((g) => g.id);
    const b = picksForDate(2026, 9, 25).map((g) => g.id);
    expect(a).toEqual(b);
  });

  it('returns 3 distinct, valid games spread across groups', () => {
    const picks = picksForDate(2026, 9, 25);
    expect(picks).toHaveLength(3);
    const ids = picks.map((g) => g.id);
    expect(new Set(ids).size).toBe(3);
    for (const p of picks) expect(getGame(p.id)).toBeDefined();
    const groups = picks.map((g) => g.group);
    expect(new Set(groups).size).toBe(3);
  });

  it('varies across dates', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 10; d++) {
      seen.add(picksForDate(2026, 9, d).map((g) => g.id).join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('todaysPicks returns 3 valid entries', () => {
    expect(todaysPicks(new Date(2026, 8, 25))).toHaveLength(3);
  });
});

describe('player restructure', () => {
  it('drives every game overlay through one openGame state', () => {
    expect(player).toContain('const [openGame, setOpenGame]');
    expect(player).toContain('<GameOverlay');
    expect(player).toContain('getGame(openGame)');
    // The 30 hand-written booleans are gone.
    expect(player).not.toMatch(/const \[show(Memory|Words|Cinema|Trophies|Pet)\b/);
    expect(player).not.toContain('setShowMemory(true)');
    expect(player).not.toContain('setShowTrophies(true)');
  });

  it('removed the dead design-fallback shim entirely', () => {
    expect(existsSync(join(kidDir, 'design-fallback.tsx'))).toBe(false);
    expect(player).not.toContain('design-fallback');
    expect(player).not.toContain('DesignFallbackStyles');
  });

  it('renders overlays transparent to the SkyBackdrop (no opaque gradient covers)', () => {
    expect(player).not.toContain('bg-gradient-to-b from-kid-sky-300 to-kid-sky-500');
    expect(registrySrc).not.toContain('from-kid-sky-300');
  });

  it('keeps the Trail as the hero: banner before the park, park before the map', () => {
    const trail = player.indexOf('<TrailBanner');
    const park = player.indexOf('aria-label="Sky Park"');
    const upNext = player.indexOf('<UpNext');
    const skyMap = player.indexOf('<SkyMap');
    expect(trail).toBeGreaterThan(-1);
    expect(park).toBeGreaterThan(trail);
    expect(upNext).toBeGreaterThan(park);
    expect(skyMap).toBeGreaterThan(upNext);
  });

  it('keeps UpNext, the widget row, stickers, and character talk wired', () => {
    expect(player).toContain('<UpNext');
    expect(player).toContain('<GoalMeter');
    expect(player).toContain('<DailyGift');
    expect(player).toContain('<ShowdownCard');
    expect(player).toContain('<StreakCalendar');
    expect(player).toContain('onOpenStickers={() => setShowStickers(true)}');
    expect(player).toContain('onTalkToCharacter={(id) => setTalkWith(id)}');
  });
});

describe('overlay focus behavior (contract)', () => {
  it('moves focus into the dialog, closes on Escape, restores focus on close', () => {
    expect(registrySrc).toContain('role="dialog"');
    expect(registrySrc).toContain('aria-modal="true"');
    expect(registrySrc).toContain("e.key === 'Escape'");
    expect(registrySrc).toContain('restoreRef.current?.focus');
    expect(registrySrc).toContain("document.body.style.overflow = 'hidden'");
  });

  it('exposes the focus hook for Track 3 to adopt', () => {
    expect(registrySrc).toContain('export function useGameOverlayFocus');
  });
});
