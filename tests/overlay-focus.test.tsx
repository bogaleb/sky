// @vitest-environment jsdom
/**
 * Game overlay focus management.
 *
 * components/kid/game-registry.tsx exports useGameOverlayFocus(open, onClose),
 * the single focus primitive every game overlay uses: when an overlay opens,
 * focus moves to the first focusable element inside it, Escape closes it,
 * body scroll locks while it is open, and on close focus returns to the
 * element that opened it. These tests exercise that behavior through the
 * DOM instead of asserting on the source text.
 */
import { describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, useState } from 'react';

import { useGameOverlayFocus } from '@/components/kid/game-registry';

function Harness() {
  const [open, setOpen] = useState(false);
  const overlayRef = useGameOverlayFocus(open, () => setOpen(false));
  return createElement(
    'div',
    null,
    createElement(
      'button',
      { type: 'button', onClick: () => setOpen(true) },
      'Open game'
    ),
    open &&
      createElement(
        'div',
        { ref: overlayRef, role: 'dialog', 'aria-label': 'Game overlay' },
        createElement('button', { type: 'button', 'data-autofocus': true }, 'First action'),
        createElement('button', { type: 'button' }, 'Second action')
      )
  );
}

describe('useGameOverlayFocus', () => {
  it('moves focus into the overlay when it opens', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));
    await user.click(screen.getByRole('button', { name: 'Open game' }));
    // The hook focuses on a short timer so the overlay can paint first.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });
    expect(
      screen
        .getByRole('dialog', { name: 'Game overlay' })
        .contains(document.activeElement)
    ).toBe(true);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));
    await user.click(screen.getByRole('button', { name: 'Open game' }));
    expect(screen.getByRole('dialog', { name: 'Game overlay' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', { name: 'Game overlay' })
    ).not.toBeInTheDocument();
  });

  it('returns focus to the opener when the overlay closes', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));
    const opener = screen.getByRole('button', { name: 'Open game' });
    await user.click(opener);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 150));
    });
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(opener);
  });

  it('locks body scroll while open and restores it on close', async () => {
    const user = userEvent.setup();
    render(createElement(Harness));
    expect(document.body.style.overflow).toBe('');
    await user.click(screen.getByRole('button', { name: 'Open game' }));
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');
  });
});
