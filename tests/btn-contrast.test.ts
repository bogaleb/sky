import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Wave 10 a11y: white Fredoka text on the .btn-kid gradient must keep >= 3:1
// (large-text) contrast across the whole button. We pin the actual gradient
// stops from the shipped CSS and recompute the ratio in-test.

function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastVsWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

const css = () => readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

function btnKidGradientStops(): [string, string] {
  const block = css().match(/\.btn-kid \{[^}]*background: linear-gradient\(180deg, ([^)]+)\)/);
  expect(block).not.toBeNull();
  const stops = [...block![1].matchAll(/#([0-9a-fA-F]{6})/g)].map((m) => m[1]);
  expect(stops.length).toBeGreaterThanOrEqual(2);
  return [stops[0], stops[stops.length - 1]];
}

describe('btn-kid contrast (Wave 10)', () => {
  it('keeps >= 3:1 white-text contrast at both gradient stops', () => {
    const [light, dark] = btnKidGradientStops();
    expect(contrastVsWhite(light)).toBeGreaterThanOrEqual(3);
    expect(contrastVsWhite(dark)).toBeGreaterThanOrEqual(3);
  });

  it('.btn-kid-sky uses the same accessible stops', () => {
    const block = css().match(/\.btn-kid-sky \{[^}]*background: linear-gradient\(180deg, ([^)]+)\)/);
    expect(block).not.toBeNull();
    const stops = [...block![1].matchAll(/#([0-9a-fA-F]{6})/g)].map((m) => m[1]);
    for (const s of stops) expect(contrastVsWhite(s)).toBeGreaterThanOrEqual(3);
  });

  it('documents why the stops were darkened', () => {
    expect(css()).toContain('Wave 10 a11y');
  });
});
