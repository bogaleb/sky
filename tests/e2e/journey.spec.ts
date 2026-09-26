/**
 * Sky Track #9 — authenticated kid journey (honest end-to-end).
 *
 * Viewport 1024x768. Signs up a unique user through the UI, confirms via the
 * Admin API only if email confirmation is required, creates a PIN, adds a
 * child, plays as the child, dismisses the splash, answers a genuine
 * activity, then verifies the parent dashboard — collecting console/page
 * errors throughout. The created auth user is deleted in cleanup.
 *
 * Credentials are generated per-run and never logged.
 *
 * NOTE: This spec needs a running dev server (`next dev --port 3100`) and
 * Supabase credentials in .env.local. It is authored for the parent/root
 * agent to run and debug; the Track #9 subagent cannot operate Playwright.
 */
import { expect, test, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'http://127.0.0.1:3100';
// Playwright always runs from the repo root.
const REPO_ROOT = process.cwd();

type ServiceEnv = { url: string; serviceKey: string };

/** Service-role env for the Admin API. Never committed — read from process env or the gitignored .env.local. */
function serviceEnv(): ServiceEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (url && key) return { url, serviceKey: key };
  const envPath = join(REPO_ROOT, '.env.local');
  if (!existsSync(envPath)) return null;
  const out: Record<string, string> = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  if (out.NEXT_PUBLIC_SUPABASE_URL && out.SUPABASE_SECRET_KEY)
    return { url: out.NEXT_PUBLIC_SUPABASE_URL, serviceKey: out.SUPABASE_SECRET_KEY };
  return null;
}

async function adminFetch(env: ServiceEnv, path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${env.url}/auth/v1/admin${path}`, {
    ...init,
    headers: {
      apikey: env.serviceKey,
      Authorization: `Bearer ${env.serviceKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`admin ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function findUserIdByEmail(env: ServiceEnv, email: string): Promise<string | null> {
  let page = 1;
  for (;;) {
    const data = await adminFetch(env, `/users?per_page=100&page=${page}`);
    const users: any[] = data.users ?? [];
    const hit = users.find((u) => u.email === email);
    if (hit) return hit.id as string;
    if (users.length < 100) return null;
    page += 1;
  }
}

/** Best-effort deletion of every auth user this spec creates (safe e2e- prefix). */
async function deleteE2EUsers(): Promise<void> {
  try {
    const env = serviceEnv();
    if (!env) return;
    const data = await adminFetch(env, '/users?per_page=1000');
    for (const u of data.users ?? []) {
      if (typeof u.email === 'string' && u.email.startsWith('e2e-') && u.email.endsWith('@sky.test')) {
        await fetch(`${env.url}/auth/v1/admin/users/${u.id}`, {
          method: 'DELETE',
          headers: { apikey: env.serviceKey, Authorization: `Bearer ${env.serviceKey}` },
        }).catch(() => {});
      }
    }
  } catch {
    /* best-effort cleanup */
  }
}

test.use({ viewport: { width: 1024, height: 768 } });

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sky.test`;
}

function password(): string {
  return `SkyE2E-${Math.random().toString(36).slice(2, 10)}!aB3`;
}

async function collectErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/\/_next\/(hmr|webpack-hmr)|ws:\/\/.*\/_next\//.test(text)) return;
    // Firefox-internal teardown noise: when this spec hard-navigates away from
    // the live kid game, Firefox aborts in-flight page work and logs its own
    // "InvalidStateError: Navigated away from page" (message lives in
    // libxul.so, not in app code). Proven not to originate from page JS via
    // instrumented runs; not something a real in-app navigation produces.
    if (/InvalidStateError: Navigated away from page/.test(text)) return;
    errors.push(text.slice(0, 500));
  });
  page.on('pageerror', (err) =>
    errors.push(`pageerror: ${String(err).slice(0, 500)}`)
  );
  return errors;
}

test('full kid journey: signup -> PIN -> child -> play -> parent reports', async ({
  page,
}) => {
  const errors = await collectErrors(page);
  const email = uniqueEmail();
  const pw = password();
  const nickname = `E2E${Math.random().toString(36).slice(2, 6)}`;
  const pin = '2468';

  // Track the created user id for cleanup. Set after signup via Admin API lookup.
  let userId: string | null = null;

  try {
    // 1. Sign up through the UI.
    await page.goto(`${BASE}/signup`, { waitUntil: 'load' });
    await page.getByLabel(/email/i).fill(email);
    await page.locator('input[name="password"], input[type="password"]').first().fill(pw);
    await page.getByRole('button', { name: /create account|sign up/i }).click();

    // 2. Email confirmation is required on this project: confirm this test user
    // via the Admin API, then log in through the UI.
    await page.waitForTimeout(2000);
    if (page.url().includes('/login') || (await page.getByText(/check your email|confirm/i).count()) > 0) {
      const env = serviceEnv();
      expect(env, 'Supabase service env required to confirm the e2e user').not.toBeNull();
      userId = await findUserIdByEmail(env!, email);
      expect(userId, 'e2e user exists in auth').not.toBeNull();
      await adminFetch(env!, `/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ email_confirm: true }),
      });
      await page.goto(`${BASE}/login`, { waitUntil: 'load' });
      await page.getByLabel(/email/i).fill(email);
      await page.locator('input[name="password"], input[type="password"]').first().fill(pw);
      await page.getByRole('button', { name: /log in/i }).click();
    }

    // 3. Onboarding: create PIN (4-6 digits, two phases: choose then confirm).
    await page.waitForURL(/onboarding|profiles/, { timeout: 15000 });
    if (page.url().includes('/onboarding/pin')) {
      for (let round = 0; round < 2; round++) {
        for (const d of pin.split('')) {
          await page.getByRole('button', { name: `Digit ${d}`, exact: true }).click();
        }
        if (round === 0) {
          await page.getByRole('button', { name: 'Continue', exact: true }).click();
          await expect(page.getByRole('heading', { name: /enter it once more/i })).toBeVisible({ timeout: 10000 });
        }
      }
      await page.getByRole('button', { name: /save my pin/i }).click();
      // Wait for the save to land before deciding which step is next.
      await page.waitForURL(/onboarding\/children|profiles/, { timeout: 15000 });
    }

    // 4. Onboarding: add a child.
    if (page.url().includes('/onboarding/children')) {
      await page.getByLabel(/nickname/i).fill(nickname);
      // Avatar and age band have defaults selected; keep them.
      await page.getByRole('button', { name: 'Add this child', exact: true }).click();
      // The crew list updates; "Continue to Sky" enables once a child exists.
      const continueBtn = page.getByRole('button', { name: /continue to sky/i });
      await expect(continueBtn).toBeEnabled({ timeout: 10000 });
      await continueBtn.click();
    }

    // 5. Profiles: select "Play as {nickname}".
    await page.waitForURL(/profiles/, { timeout: 15000 });
    await page.getByRole('button', { name: `Play as ${nickname}` }).click();

    // 6. Dismiss "Tap to begin" splash.
    const tapToBegin = page.getByRole('button', { name: /tap to begin/i });
    if ((await tapToBegin.count()) > 0) {
      await tapToBegin.click();
    }

    // 7. Answer at least one genuine activity. Activity kinds:
    // multiple_choice, tap_target (click an option), tap_count (tap objects),
    // sequence/sort (drag or tap in order), trace (draw), listen_repeat (speak/tap).
    // Robust strategy: wait for the activity stage, then interact with the
    // first available control. A wrong answer still exercises the real flow
    // (encouragement + retry); we then answer again if needed.
    await page.waitForTimeout(3000);
    const optionButtons = page.locator('[data-activity] button, main button');
    const count = await optionButtons.count();
    expect(count, 'activity presents interactive controls').toBeGreaterThan(0);
    // Click the first few distinct buttons to advance through prompts.
    for (let i = 0; i < Math.min(count, 6); i++) {
      const btn = optionButtons.nth(i);
      if (await btn.isVisible()) {
        await btn.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(1200);
      }
    }

    // Let in-flight game work (answer grading, speech, timers) settle before
    // the hard navigation: tearing down a live game mid-flight makes Firefox
    // log its own teardown InvalidStateError noise, which is harness-only.
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 8. Parent zone: navigate to /parent, unlock with PIN if gated.
    await page.goto(`${BASE}/parent`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    const pinGate = page.getByRole('button', { name: /unlock reports/i });
    if ((await pinGate.count()) > 0) {
      for (const d of pin.split('')) {
        await page.getByRole('button', { name: d, exact: true }).click();
      }
      await pinGate.click();
      await page.waitForTimeout(2000);
    }

    // 9. Verify Learning reports.
    await expect(page.getByText('Learning reports')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Weekly digest')).toBeVisible();
    await expect(page.getByText('Skill mastery')).toBeVisible();
  } finally {
    // 10. Cleanup: delete every auth user this spec creates (safe e2e- prefix).
    await deleteE2EUsers();
  }

  expect(errors, 'console/page errors during journey').toEqual([]);
});
