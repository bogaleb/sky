import { describe, it, expect } from 'vitest';
import {
  EXPERIMENTS,
  LAB_SESSION_SIZE,
  PAINT_HEX,
  mixPaint,
  blendHex,
  getExperiment,
  type ScienceExperiment,
} from '../lib/kid/science';

/** Rough emoji detector: pictographs, symbols, dingbats, misc symbols. */
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

function allText(e: ScienceExperiment): string[] {
  const out = [e.title, e.subtitle, e.question, e.intro, e.explain];
  for (const m of e.materials) out.push(m.name);
  for (const t of e.trials) {
    out.push(t.prompt, t.resultLine);
    for (const c of t.choices) out.push(c.label);
  }
  for (const s of e.stages ?? []) out.push(s.label, s.caption);
  return out;
}

describe('science experiments catalog', () => {
  it('has exactly 6 kid-safe experiments', () => {
    expect(EXPERIMENTS).toHaveLength(6);
    const ids = EXPERIMENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(6);
    for (const id of ['sink-float', 'color-mixer', 'plant-growth', 'ice-melt', 'magnet-hunt', 'day-night']) {
      expect(ids).toContain(id);
    }
  });

  it('getExperiment resolves every id', () => {
    for (const e of EXPERIMENTS) {
      expect(getExperiment(e.id)?.title).toBe(e.title);
    }
    expect(getExperiment('nope')).toBeUndefined();
  });

  it('every trial has choices, a valid correctId, and a result line', () => {
    for (const e of EXPERIMENTS) {
      expect(e.trials.length, `${e.id} trials`).toBeGreaterThan(0);
      expect(e.materials.length, `${e.id} materials`).toBeGreaterThan(0);
      for (const t of e.trials) {
        expect(t.choices.length, `${t.id} choices`).toBeGreaterThanOrEqual(2);
        const ids = t.choices.map((c) => c.id);
        expect(ids, `${t.id} correctId`).toContain(t.correctId);
        expect(t.prompt.trim().length, `${t.id} prompt`).toBeGreaterThan(10);
        expect(t.resultLine.trim().length, `${t.id} resultLine`).toBeGreaterThan(10);
      }
    }
  });

  it('lab session picks 3 of 6', () => {
    expect(LAB_SESSION_SIZE).toBe(3);
    expect(LAB_SESSION_SIZE).toBeLessThan(EXPERIMENTS.length);
  });

  it('contains zero emoji in any kid-facing text', () => {
    for (const e of EXPERIMENTS) {
      for (const text of allText(e)) {
        expect(text, `${e.id}: "${text.slice(0, 40)}..."`).not.toMatch(EMOJI_RE);
      }
    }
  });
});

describe('sink or float — real physics', () => {
  const truth: Record<string, 'float' | 'sink'> = {
    apple: 'float',
    rock: 'sink',
    leaf: 'float',
    spoon: 'sink',
    cork: 'float',
    key: 'sink',
  };
  const exp = getExperiment('sink-float')!;
  it('tests all 6 objects', () => {
    expect(exp.trials).toHaveLength(6);
  });
  for (const [id, expected] of Object.entries(truth)) {
    it(`${id} -> ${expected}`, () => {
      const t = exp.trials.find((x) => x.id === id);
      expect(t?.correctId).toBe(expected);
      expect(t?.objectArt).toBe(id);
    });
  }
});

describe('color mixer — real subtractive mixing', () => {
  it('mixPaint follows RYB rules', () => {
    expect(mixPaint('red', 'yellow')).toBe('orange');
    expect(mixPaint('yellow', 'red')).toBe('orange');
    expect(mixPaint('red', 'blue')).toBe('purple');
    expect(mixPaint('blue', 'red')).toBe('purple');
    expect(mixPaint('yellow', 'blue')).toBe('green');
    expect(mixPaint('blue', 'yellow')).toBe('green');
    expect(mixPaint('red', 'red')).toBe('red');
    expect(mixPaint('blue', 'blue')).toBe('blue');
  });

  it('trial answers match the mix table', () => {
    const exp = getExperiment('color-mixer')!;
    expect(exp.trials).toHaveLength(3);
    for (const t of exp.trials) {
      const [a, b] = t.mixPair!;
      expect(t.correctId).toBe(mixPaint(a, b));
      expect(t.choices.map((c) => c.id)).toContain(t.correctId);
    }
  });

  it('blendHex returns a valid hex color', () => {
    const out = blendHex(PAINT_HEX.red, PAINT_HEX.blue);
    expect(out).toMatch(/^#[0-9a-f]{6}$/);
    expect(blendHex('#000000', '#ffffff')).toBe('#808080');
  });

  it('paint choices cover all six colors', () => {
    const exp = getExperiment('color-mixer')!;
    expect(exp.trials[0].choices).toHaveLength(6);
  });
});

describe('plant growth — real life-cycle order', () => {
  it('has 4 stages in true order', () => {
    const exp = getExperiment('plant-growth')!;
    const ids = exp.stages!.map((s) => s.id);
    expect(ids).toEqual(['seed', 'sprout', 'seedling', 'plant']);
  });
  it('ordering trial starts with the seed', () => {
    const exp = getExperiment('plant-growth')!;
    expect(exp.trials[0].correctId).toBe('seed');
    expect(exp.trials[0].choices.map((c) => c.id).sort()).toEqual(['plant', 'seed', 'seedling', 'sprout']);
  });
});

describe('ice melt — real melt rates', () => {
  it('sunshine is the fastest melter', () => {
    const exp = getExperiment('ice-melt')!;
    expect(exp.trials).toHaveLength(1);
    expect(exp.trials[0].correctId).toBe('sun');
    expect(exp.trials[0].choices.map((c) => c.id).sort()).toEqual(['hands', 'shade', 'sun']);
  });
});

describe('magnet hunt — real ferromagnetism', () => {
  const truth: Record<string, 'grab' | 'nograb'> = {
    paperclip: 'grab', // steel
    nail: 'grab', // iron
    woodblock: 'nograb',
    button: 'nograb', // plastic
    foil: 'nograb', // aluminum is not ferromagnetic
    coin: 'nograb',
  };
  const exp = getExperiment('magnet-hunt')!;
  it('tests 6 objects', () => {
    expect(exp.trials).toHaveLength(6);
  });
  for (const [id, expected] of Object.entries(truth)) {
    it(`${id} -> ${expected}`, () => {
      const t = exp.trials.find((x) => x.id === id);
      expect(t?.correctId).toBe(expected);
      expect(t?.objectArt).toBe(id);
    });
  }
});

describe('day and night — real Earth rotation', () => {
  it('follows the spin sequence day, night, day', () => {
    const exp = getExperiment('day-night')!;
    expect(exp.trials.map((t) => t.correctId)).toEqual(['day', 'night', 'day']);
  });
  it('choices are day/night only', () => {
    const exp = getExperiment('day-night')!;
    for (const t of exp.trials) {
      expect(t.choices.map((c) => c.id).sort()).toEqual(['day', 'night']);
    }
  });
});
