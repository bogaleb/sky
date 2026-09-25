import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');

/**
 * Every `kid-<palette>-<shade>` utility referenced in components must have a
 * matching `--color-kid-<palette>-<shade>` token in globals.css. Tailwind
 * silently drops classes for undefined tokens, which once left dozens of
 * backgrounds/gradients invisible across the app.
 */
describe('design tokens', () => {
  it('defines every kid color shade referenced by components', () => {
    const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');
    const defined = new Set(
      [...css.matchAll(/--color-(kid-[a-z]+-\d+):/g)].map((m) => m[1]),
    );

    const files = execSync(
      `grep -rhoE "kid-(sky|sun|coral|grape|mint|berry|ink|night)-[0-9]+" components app lib --include="*.tsx" --include="*.ts" | sort -u`,
      { cwd: ROOT, encoding: 'utf8' },
    )
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    expect(files.length).toBeGreaterThan(0);
    const missing = files.filter((f) => !defined.has(f));
    expect(missing).toEqual([]);
  });
});
