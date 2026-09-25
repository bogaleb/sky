import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * React Server Components cannot receive plain functions as props — only
 * serializable values or Server Actions. Next's production build only
 * surfaces this when the page is prerendered, so `force-dynamic` pages
 * (like onboarding) slipped through `pnpm build` and crashed at runtime.
 *
 * This test statically flags inline arrow-function props in server-component
 * pages (page.tsx files under app/ without a 'use client' directive). Passing a named
 * Server Action (e.g. action={finishOnboarding}) is fine and not flagged;
 * only inline `=>` expressions are.
 */
function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...pageFiles(full));
    else if (entry === 'page.tsx') out.push(full);
  }
  return out;
}

const root = join(__dirname, '..', 'app');
const pages = pageFiles(root);
const INLINE_FN_PROP = /[A-Za-z][\w-]*=\{[^}]*=>/;

describe('server component pages', () => {
  it('never pass inline function props to client components', () => {
    const offenders: string[] = [];
    for (const file of pages) {
      const src = readFileSync(file, 'utf8');
      if (src.startsWith("'use client'") || src.startsWith('"use client"'))
        continue;
      const match = src.match(INLINE_FN_PROP);
      if (match) {
        offenders.push(
          `${file.replace(root, 'app')}: ${match[0].slice(0, 60)}`
        );
      }
    }
    expect(
      offenders,
      'Server Components cannot receive inline function props.\n' +
        'Pass a Server Action, move the interactivity into the client ' +
        'component, or remove the prop.\nOffenders:\n' +
        offenders.join('\n')
    ).toEqual([]);
  });
});
