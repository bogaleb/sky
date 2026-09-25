import { defineConfig } from '@playwright/test';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Wave 10 smoke suite. Uses the pre-installed Playwright Firefox
 * (revision 1543, matching @playwright/test 1.63.0) so CI/local runs
 * never need `playwright install`.
 *
 * Override with PLAYWRIGHT_FIREFOX_PATH if your browser lives elsewhere.
 */
const firefoxPath =
  process.env.PLAYWRIGHT_FIREFOX_PATH ??
  join(
    homedir(),
    '.cache',
    'ms-playwright',
    'firefox-1543',
    'firefox',
    'firefox'
  );

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: 'line',
  projects: [
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: true,
        launchOptions: { executablePath: firefoxPath },
      },
    },
  ],
  webServer: {
    // NOTE: uses the repo-local next binary directly (no pnpm wrapper).
    command: 'node_modules/.bin/next dev --port 3100',
    url: 'http://127.0.0.1:3100/login',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
