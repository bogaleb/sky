// Registers @testing-library/jest-dom matchers (toBeInTheDocument,
// toHaveTextContent, toHaveAttribute, …) for every test file, and unmounts
// RTL trees after each test (vitest does not do this automatically).
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom has no matchMedia; components that query reduced-motion or dark
// mode preferences get a deterministic "no preference" stub instead.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
