// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DESIGN_CONTRACT } from '../lib/kid/design';
import { createElement } from 'react';

const cssPath = join(process.cwd(), 'app', 'globals.css');
const layoutPath = join(process.cwd(), 'app', 'layout.tsx');
const backdropPath = join(process.cwd(), 'components', 'kid', 'sky-backdrop.tsx');
const shellPath = join(process.cwd(), 'components', 'kid', 'kid-shell.tsx');

const emoji =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/u;

describe('design contract constants', () => {
  it('exports the exact contract shape other tracks depend on', () => {
    expect(DESIGN_CONTRACT.backdrop).toBe('SkyBackdrop');
    expect([...DESIGN_CONTRACT.classes]).toEqual([
      'font-display',
      'glass-kid',
      'btn-kid',
      'card-kid',
    ]);
    expect(DESIGN_CONTRACT.fonts.display.family).toBe('Fredoka');
    expect([...DESIGN_CONTRACT.fonts.display.weights]).toEqual([600, 700]);
    expect(DESIGN_CONTRACT.fonts.display.cssVar).toBe('--font-display');
    expect(DESIGN_CONTRACT.fonts.body.family).toBe('Nunito');
    expect(DESIGN_CONTRACT.fonts.body.cssVar).toBe('--font-body');
  });

  it('documents button modifiers and keyframe utilities', () => {
    expect(DESIGN_CONTRACT.buttonModifiers).toContain('btn-kid-coral');
    expect(DESIGN_CONTRACT.buttonModifiers).toContain('btn-kid-sky');
    expect(DESIGN_CONTRACT.buttonModifiers).toContain('btn-kid-mint');
    expect(DESIGN_CONTRACT.buttonModifiers).toContain('btn-kid-grape');
    expect(DESIGN_CONTRACT.keyframes.aurora).toBe('animate-kid-aurora');
    expect(DESIGN_CONTRACT.keyframes.twinkle).toBe('animate-kid-twinkle');
    expect(DESIGN_CONTRACT.keyframes.floatSlow).toBe('animate-kid-float-slow');
    expect(DESIGN_CONTRACT.keyframes.shimmer).toBe('animate-kid-shimmer');
  });
});

describe('globals.css design system', () => {
  const css = readFileSync(cssPath, 'utf8');

  it('loads Fredoka + Nunito via next/font in the root layout', () => {
    const layout = readFileSync(layoutPath, 'utf8');
    expect(layout).toMatch(/from 'next\/font\/google'/);
    expect(layout).toMatch(/Fredoka/);
    expect(layout).toMatch(/Nunito/);
    expect(layout).toContain('--font-display');
    expect(layout).toContain('--font-body');
  });

  it('sets the body font to Nunito', () => {
    expect(css).toMatch(/body\s*{[^}]*font-family:\s*var\(--font-body/);
  });

  it('defines .font-display for Fredoka headings', () => {
    expect(css).toContain('.font-display');
    expect(css).toMatch(/\.font-display\s*{[^}]*var\(--font-display/);
  });

  it('defines .glass-kid (glassmorphism card)', () => {
    expect(css).toContain('.glass-kid');
    expect(css).toMatch(/\.glass-kid\s*{[^}]*backdrop-filter/);
    expect(css).toMatch(/\.glass-kid\s*{[^}]*rgba\(255,\s*255,\s*255,\s*0\.45\)/);
  });

  it('defines .btn-kid with 3D edge + color modifiers', () => {
    expect(css).toContain('.btn-kid');
    expect(css).toMatch(/\.btn-kid\s*{[^}]*border-bottom-width:\s*8px/);
    for (const mod of ['btn-kid-coral', 'btn-kid-sky', 'btn-kid-mint', 'btn-kid-grape']) {
      expect(css, mod).toContain(`.${mod}`);
    }
  });

  it('defines .card-kid (elevated card)', () => {
    expect(css).toContain('.card-kid');
    expect(css).toMatch(/\.card-kid\s*{[^}]*box-shadow/);
  });

  it('defines the aurora + float-slow keyframes', () => {
    expect(css).toContain('@keyframes kid-aurora');
    expect(css).toContain('@keyframes kid-float-slow');
    // twinkle + shimmer predate Wave 8 and must still be present.
    expect(css).toContain('@keyframes kid-twinkle');
    expect(css).toContain('@keyframes kid-shimmer');
  });

  it('honors prefers-reduced-motion for the new ambient animations', () => {
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.animate-kid-aurora/
    );
  });

  it('has no emoji in the design system sources', () => {
    for (const file of [cssPath, layoutPath, backdropPath, shellPath]) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(emoji);
    }
  });
});

describe('SkyBackdrop (rendered)', () => {
  it('is a fixed pointer-transparent ambient layer with aurora, stars, clouds', async () => {
    const SkyBackdrop = (await import('../components/kid/sky-backdrop')).default;
    const { render } = await import('@testing-library/react');
    const { container, unmount } = render(createElement(SkyBackdrop));
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('fixed inset-0');
    expect(root.className).toContain('pointer-events-none');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    const html = container.innerHTML;
    for (const cls of ['animate-kid-aurora', 'animate-kid-twinkle', 'animate-kid-drift', 'animate-kid-float-slow']) {
      expect(html, cls).toContain(cls);
    }
    unmount();
  });

  it('renders character cameo art', async () => {
    const SkyBackdrop = (await import('../components/kid/sky-backdrop')).default;
    const { render } = await import('@testing-library/react');
    const { container, unmount } = render(createElement(SkyBackdrop));
    // Cameos reuse the avatar SVGs.
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    unmount();
  });
});

describe('KidShell upgrade (rendered)', () => {
  it('renders the compact HUD with the full props API', async () => {
    const KidShell = (await import('../components/kid/kid-shell')).default;
    const { render, screen } = await import('@testing-library/react');
    const { createElement } = await import('react');
    const { container, unmount } = render(
      createElement(KidShell, {
        child: { id: 'c1', nickname: 'Ada', avatarId: 'fox' },
        doneCount: 3,
        totalSteps: 8,
        points: 42,
        onExit: () => {},
      } as never, createElement('div', null, 'game content'))
    );
    const html = container.innerHTML;
    // Compact HUD marker, design-system classes, ambient backdrop.
    expect(container.querySelector('[data-kid-hud]')).not.toBeNull();
    expect(html).toContain('font-display');
    expect(html).toContain('btn-kid');
    expect(html).toContain('kid-aurora');
    // HUD surfaces the session progress (star dots with an accessible label).
    expect(screen.getByRole('img', { name: '3 of 8 activities done' })).toBeInTheDocument();
    // Mute toggle preserved.
    expect(
      screen.getByRole('button', { name: /turn sound (on|off)/i })
    ).toBeInTheDocument();
    unmount();
  });

  it('hides the HUD when hideHud is set', async () => {
    const KidShell = (await import('../components/kid/kid-shell')).default;
    const { render } = await import('@testing-library/react');
    const { createElement } = await import('react');
    const { container, unmount } = render(
      createElement(KidShell, {
        child: { id: 'c1', nickname: 'Ada', avatarId: 'fox' },
        doneCount: 0,
        totalSteps: 8,
        points: 0,
        onExit: () => {},
        hideHud: true,
      } as never, createElement('div', null, 'game content'))
    );
    expect(container.querySelector('[data-kid-hud]')).toBeNull();
    unmount();
  });
});
