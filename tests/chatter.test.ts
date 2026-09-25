import { describe, expect, it } from 'vitest';
import {
  CHATTER,
  CHATTER_CHARACTER_IDS,
  CHATTER_TABS,
  chatterLine,
  type ChatterCategory,
} from '../lib/kid/char-chatter';
import { CHARACTER_IDS } from '../lib/kid/characters';

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

const EXPECTED_COUNTS: Record<ChatterCategory, number> = {
  greeting: 3,
  joke: 3,
  funFact: 4,
  encouragement: 3,
};

describe('character chatter', () => {
  it('covers every cast member', () => {
    expect([...CHATTER_CHARACTER_IDS].sort()).toEqual([...CHARACTER_IDS].sort());
  });

  it('gives every character all four categories, non-empty, at the required counts', () => {
    for (const id of CHARACTER_IDS) {
      const pack = CHATTER[id];
      expect(pack, `${id} needs a chatter pack`).toBeDefined();
      for (const [category, count] of Object.entries(EXPECTED_COUNTS) as [ChatterCategory, number][]) {
        const lines = pack[category];
        expect(Array.isArray(lines), `${id}.${category} must be an array`).toBe(true);
        expect(lines.length, `${id}.${category} needs ${count} lines`).toBe(count);
        for (const line of lines) {
          expect(typeof line).toBe('string');
          expect(line.trim().length, `${id}.${category} line too short`).toBeGreaterThan(10);
          expect(line).not.toMatch(EMOJI_RE);
        }
      }
    }
  });

  it('keeps chatter COPPA-safe: no personal questions about the child', () => {
    const PERSONAL_RE =
      /what('s| is) your name|where do you live|how old are you|what school/i;
    for (const id of CHARACTER_IDS) {
      const pack = CHATTER[id];
      for (const category of Object.keys(EXPECTED_COUNTS) as ChatterCategory[]) {
        for (const line of pack[category]) {
          expect(line, `${id}.${category} asks something personal`).not.toMatch(PERSONAL_RE);
        }
      }
    }
  });

  it('chatterLine returns a line from the requested pack', () => {
    for (const id of CHARACTER_IDS) {
      for (const category of Object.keys(EXPECTED_COUNTS) as ChatterCategory[]) {
        expect(CHATTER[id][category]).toContain(chatterLine(id, category));
      }
    }
  });

  it('chatterLine falls back to Curio for unknown characters', () => {
    expect(CHATTER.curio.greeting).toContain(chatterLine('mystery-guest', 'greeting'));
  });

  it('exposes one tab per category in display order', () => {
    expect(CHATTER_TABS.map((t) => t.id)).toEqual([
      'greeting',
      'joke',
      'funFact',
      'encouragement',
    ]);
    for (const tab of CHATTER_TABS) {
      expect(tab.label.trim().length).toBeGreaterThan(0);
    }
  });
});
