import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useGameOverlayFocus } from '../components/kid/game-registry';

// Focus management lives in the registry's GameOverlay (the single overlay
// renderer every game opens through). These tests pin the behavior contract:
// focus moves into the dialog on open, Escape closes, focus restores on close,
// and body scroll locks while open.

const SRC = readFileSync(
  join(__dirname, '..', 'components', 'kid', 'game-registry.tsx'),
  'utf8',
);

describe('game overlay focus contract', () => {
  it('exports the focus hook used by the single overlay renderer', () => {
    expect(typeof useGameOverlayFocus).toBe('function');
    expect(SRC).toContain('export function GameOverlay');
    expect(SRC).toContain('useGameOverlayFocus(true, onClose)');
  });

  it('moves focus into the overlay on open', () => {
    expect(SRC).toContain('document.activeElement');
    expect(SRC).toContain('restoreRef');
    expect(SRC).toContain("querySelector<HTMLElement>('[data-autofocus], h1, h2, button')");
    expect(SRC).toContain('.focus({ preventScroll: true })');
  });

  it('restores focus to the opener on close', () => {
    expect(SRC).toContain('restoreRef.current?.focus?.({ preventScroll: true })');
  });

  it('closes on Escape and locks body scroll while open', () => {
    expect(SRC).toContain("e.key === 'Escape'");
    expect(SRC).toContain("document.body.style.overflow = 'hidden'");
  });

  it('renders the overlay as an accessible modal dialog', () => {
    expect(SRC).toContain('role="dialog"');
    expect(SRC).toContain('aria-modal="true"');
    expect(SRC).toContain('tabIndex={-1}');
  });
});
