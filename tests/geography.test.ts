import { describe, expect, it } from 'vitest';
import {
  generateRound,
  mulberry32,
  MODES,
  ROUNDS_PER_GAME,
  CONTINENTS,
  ANIMALS,
  LANDMARKS,
  getContinent,
  getAnimal,
  getLandmark,
  type GeoMode,
} from '../lib/kid/geography';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

const ALL_TEXT = [
  ...CONTINENTS.flatMap((c) => [c.name, c.fact, c.blankFact]),
  ...ANIMALS.flatMap((a) => [a.name, a.line]),
  ...LANDMARKS.flatMap((l) => [l.name, l.line]),
];

describe('geography content', () => {
  it('has exactly 7 continents', () => {
    expect(CONTINENTS).toHaveLength(7);
    const ids = CONTINENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(7);
    for (const want of ['north-america', 'south-america', 'europe', 'africa', 'asia', 'australia', 'antarctica']) {
      expect(ids).toContain(want);
    }
  });

  it('has no emoji anywhere in kid-facing text', () => {
    for (const text of ALL_TEXT) {
      expect(text).not.toMatch(EMOJI_RE);
    }
    // Also spot-check generated prompts/spoken lines.
    for (const mode of MODES) {
      for (let seed = 0; seed < 20; seed++) {
        const round = generateRound(mode, seed);
        expect(round.prompt).not.toMatch(EMOJI_RE);
        expect(round.spoken).not.toMatch(EMOJI_RE);
      }
    }
  });

  it('every animal maps to a real continent', () => {
    expect(ANIMALS.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(ANIMALS.map((a) => a.id));
    expect(ids.size).toBe(ANIMALS.length);
    for (const animal of ANIMALS) {
      expect(getContinent(animal.continentId)).toBeDefined();
      // The continent's primary animal should exist too.
      expect(getAnimal(getContinent(animal.continentId)!.animalId)).toBeDefined();
    }
  });

  it('every landmark maps to a real continent', () => {
    expect(LANDMARKS.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(LANDMARKS.map((l) => l.id));
    expect(ids.size).toBe(LANDMARKS.length);
    for (const landmark of LANDMARKS) {
      expect(getContinent(landmark.continentId)).toBeDefined();
    }
  });

  it('blank facts have exactly one blank and name the continent implicitly', () => {
    for (const c of CONTINENTS) {
      expect(c.blankFact.split('___')).toHaveLength(2);
    }
  });
});

describe('generateRound', () => {
  it('is deterministic for the same mode + seed', () => {
    for (const mode of MODES) {
      const a = generateRound(mode, 12345);
      const b = generateRound(mode, 12345);
      expect(a).toEqual(b);
    }
  });

  it('mulberry32 is a stable PRNG', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    for (let i = 0; i < 10; i++) expect(r1()).toBe(r2());
    const r3 = mulberry32(43);
    expect(r3()).not.toBe(mulberry32(42)());
  });

  it('has exactly one correct choice, and the answer is a real continent', () => {
    for (const mode of MODES) {
      for (let seed = 0; seed < 100; seed++) {
        const round = generateRound(mode, seed);
        expect(round.choices).toHaveLength(7);
        expect(new Set(round.choices).size).toBe(7);
        expect(round.choices.filter((c) => c === round.answer)).toHaveLength(1);
        expect(getContinent(round.answer)).toBeDefined();
      }
    }
  });

  it('animal mode picks a real animal on its home continent', () => {
    for (let seed = 0; seed < 50; seed++) {
      const round = generateRound('animal', seed);
      expect(round.animalId).toBeDefined();
      const animal = getAnimal(round.animalId!);
      expect(animal).toBeDefined();
      expect(animal!.continentId).toBe(round.answer);
      expect(round.prompt).toContain(animal!.name);
    }
  });

  it('landmark mode picks a real landmark on its continent', () => {
    for (let seed = 0; seed < 50; seed++) {
      const round = generateRound('landmark', seed);
      expect(round.landmarkId).toBeDefined();
      const landmark = getLandmark(round.landmarkId!);
      expect(landmark).toBeDefined();
      expect(landmark!.continentId).toBe(round.answer);
    }
  });

  it('fact mode uses a continent blank fact with that continent as answer', () => {
    for (let seed = 0; seed < 50; seed++) {
      const round = generateRound('fact', seed);
      const continent = getContinent(round.answer);
      expect(continent).toBeDefined();
      expect(round.prompt).toBe(continent!.blankFact);
      expect(round.spoken).not.toContain('___');
    }
  });

  it('all 7 continents appear as answers across seeds and modes', () => {
    const seen = new Set<string>();
    const modes: GeoMode[] = ['animal', 'landmark', 'fact'];
    for (let seed = 0; seed < 200 && seen.size < 7; seed++) {
      seen.add(generateRound(modes[seed % modes.length], seed).answer);
    }
    expect(seen.size).toBe(7);
  });

  it('ROUNDS_PER_GAME is 8 and modes rotate', () => {
    expect(ROUNDS_PER_GAME).toBe(8);
    expect(MODES).toEqual(['animal', 'landmark', 'fact']);
  });
});
