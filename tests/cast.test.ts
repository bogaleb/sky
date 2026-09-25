import { describe, expect, it } from 'vitest';
import { CHARACTERS, CHARACTER_IDS, getCharacter, charLine } from '../lib/kid/characters';
import { ISLANDS, getIsland } from '../lib/kid/islands';

describe('Sky cast', () => {
  it('has exactly 8 characters', () => {
    expect(CHARACTER_IDS).toHaveLength(8);
  });

  it('every character has a name, role, voice profile, and lines', () => {
    for (const id of CHARACTER_IDS) {
      const c = CHARACTERS[id];
      expect(c.name.length).toBeGreaterThan(0);
      expect(['captain', 'peer', 'host']).toContain(c.role);
      expect(c.voice.pitch).toBeGreaterThan(0);
      expect(c.voice.rate).toBeGreaterThan(0);
      expect(c.greeting.length).toBeGreaterThan(0);
      expect(c.praise.length).toBeGreaterThan(0);
      expect(c.encouragement.length).toBeGreaterThan(0);
      expect(c.tapReaction.length).toBeGreaterThan(0);
    }
  });

  it('has one captain and one peer', () => {
    const roles = CHARACTER_IDS.map((id) => CHARACTERS[id].role);
    expect(roles.filter((r) => r === 'captain')).toHaveLength(1);
    expect(roles.filter((r) => r === 'peer')).toHaveLength(1);
  });

  it('voices are distinct across the cast', () => {
    const signatures = CHARACTER_IDS.map((id) => `${CHARACTERS[id].voice.pitch}:${CHARACTERS[id].voice.rate}`);
    expect(new Set(signatures).size).toBe(8);
  });

  it('getCharacter falls back to the captain for unknown ids', () => {
    expect(getCharacter('nobody').id).toBe('curio');
  });

  it('charLine returns a non-empty line', () => {
    for (const id of CHARACTER_IDS) {
      expect(charLine(id, 'praise').length).toBeGreaterThan(0);
      expect(charLine(id, 'tapReaction').length).toBeGreaterThan(0);
    }
  });
});

describe('Sky islands', () => {
  it('has 9 islands, one per subject', () => {
    expect(ISLANDS).toHaveLength(9);
    const codes = ISLANDS.map((i) => i.subjectCode);
    expect(new Set(codes).size).toBe(9);
  });

  it('every island host is a real character', () => {
    for (const island of ISLANDS) {
      expect(CHARACTER_IDS).toContain(island.hostCharacter);
      expect(island.islandName.length).toBeGreaterThan(0);
      expect(island.tagline.length).toBeGreaterThan(0);
    }
  });

  it('getIsland resolves known subjects and falls back safely', () => {
    expect(getIsland('reading').hostCharacter).toBe('luna');
    expect(getIsland('math').hostCharacter).toBe('milo');
    expect(getIsland('nope').subjectCode).toBe('reading');
  });
});
