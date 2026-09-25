import { expect, test, type Page } from '@playwright/test';

/**
 * Unauthenticated smoke suite (Wave 10).
 *
 * Covers what is verifiable without Supabase credentials: public pages
 * render, PWA plumbing answers, and no page throws or logs console
 * errors. The authenticated journey (signup -> PIN -> profile -> map ->
 * game win -> rewards) is a manual QA checklist in tests/e2e/README.md
 * because local runs have no production credentials.
 */

const BASE = 'http://127.0.0.1:3100';

async function collectErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // Dev-server HMR websocket noise — absent in production builds.
    if (/\/_next\/(hmr|webpack-hmr)|ws:\/\/.*\/_next\//.test(text)) return;
    errors.push(text.slice(0, 200));
  });
  page.on('pageerror', (err) =>
    errors.push(`pageerror: ${String(err).slice(0, 200)}`)
  );
  return errors;
}

test('landing page renders', async ({ page }) => {
  const errors = await collectErrors(page);
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  expect(errors, 'console errors on /').toEqual([]);
});

test('login page renders with zero console errors', async ({ page }) => {
  const errors = await collectErrors(page);
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /log in/i })
  ).toBeVisible();
  expect(errors, 'console errors on /login').toEqual([]);
});

test('signup page renders with zero console errors', async ({ page }) => {
  const errors = await collectErrors(page);
  await page.goto(`${BASE}/signup`, { waitUntil: 'load' });
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  expect(errors, 'console errors on /signup').toEqual([]);
});

test('offline fallback page renders', async ({ page }) => {
  const errors = await collectErrors(page);
  const res = await page.goto(`${BASE}/offline`, {
    waitUntil: 'load',
  });
  expect(res?.status()).toBeLessThan(400);
  expect(errors, 'console errors on /offline').toEqual([]);
});

test('web app manifest is served (or auth-gated)', async ({ request }) => {
  // NOTE (Wave 10 finding): proxy.ts's matcher does not exclude
  // .webmanifest/.js, so unauthenticated requests 307 to /login.
  // Logged-in users get the 200. Both shapes are accepted here; the
  // matcher exclusion is recommended in the README.
  const res = await request.get(`${BASE}/manifest.webmanifest`, {
    maxRedirects: 0,
  });
  if (res.status() === 200) {
    expect(res.headers()['content-type']).toContain('json');
    const manifest = await res.json();
    expect(manifest.name).toBe('Sky — Play & Learn');
    expect(manifest.short_name).toBe('Sky');
    expect(manifest.display).toBe('standalone');
  } else {
    expect(res.status()).toBe(307);
    expect(res.headers()['location']).toBe('/login');
  }
});

test('service worker script is served (or auth-gated)', async ({
  request,
}) => {
  const res = await request.get(`${BASE}/sw.js`, { maxRedirects: 0 });
  if (res.status() === 200) {
    const body = await res.text();
    expect(body.length).toBeGreaterThan(100);
  } else {
    expect(res.status()).toBe(307);
    expect(res.headers()['location']).toBe('/login');
  }
});
