import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  OUTBOX_CAP,
  OUTBOX_KEY,
  clearOutbox,
  flushOutbox,
  queueLearningEvent,
  readOutbox,
  type StorageLike,
} from '../lib/kid/offline';

const repoRoot = process.cwd();

function memoryStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
}

describe('learning-event outbox', () => {
  it('queues entries with ids and timestamps', () => {
    const s = memoryStorage();
    const items = queueLearningEvent(s, { childId: 'c1', eventType: 'attempt', metadata: { correct: true } });
    expect(items).toHaveLength(1);
    expect(items[0].id).toMatch(/^q_/);
    expect(items[0].queuedAt).toBeTruthy();
    expect(items[0].childId).toBe('c1');
    expect(readOutbox(s)).toHaveLength(1);
  });

  it('caps the queue at OUTBOX_CAP, dropping oldest first', () => {
    const s = memoryStorage();
    for (let i = 0; i < OUTBOX_CAP + 25; i++) {
      queueLearningEvent(s, { childId: 'c1', eventType: 'attempt', metadata: { n: i } });
    }
    const items = readOutbox(s);
    expect(items).toHaveLength(OUTBOX_CAP);
    expect(items[0].metadata).toEqual({ n: 25 });
    expect(items[items.length - 1].metadata).toEqual({ n: OUTBOX_CAP + 24 });
  });

  it('heals corrupt storage to an empty list', () => {
    const s = memoryStorage();
    s.setItem(OUTBOX_KEY, 'not-json{{{');
    expect(readOutbox(s)).toEqual([]);
    s.setItem(OUTBOX_KEY, JSON.stringify({ not: 'an array' }));
    expect(readOutbox(s)).toEqual([]);
    // Queueing after corruption still works.
    queueLearningEvent(s, { childId: 'c1', eventType: 'attempt' });
    expect(readOutbox(s)).toHaveLength(1);
  });

  it('flush sends in order and clears on full success', async () => {
    const s = memoryStorage();
    queueLearningEvent(s, { childId: 'c1', eventType: 'attempt', metadata: { n: 1 } });
    queueLearningEvent(s, { childId: 'c1', eventType: 'milestone', metadata: { n: 2 } });
    const seen: string[] = [];
    const result = await flushOutbox(s, async (e) => {
      seen.push(e.eventType);
    });
    expect(result).toEqual({ sent: 2, failed: 0 });
    expect(seen).toEqual(['attempt', 'milestone']);
    expect(readOutbox(s)).toHaveLength(0);
  });

  it('keeps failed entries for the next attempt', async () => {
    const s = memoryStorage();
    queueLearningEvent(s, { childId: 'c1', eventType: 'attempt', metadata: { n: 1 } });
    queueLearningEvent(s, { childId: 'c1', eventType: 'attempt', metadata: { n: 2 } });
    const result = await flushOutbox(s, async (e) => {
      if (e.metadata?.n === 2) throw new Error('network down');
    });
    expect(result).toEqual({ sent: 1, failed: 1 });
    const remaining = readOutbox(s);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].metadata).toEqual({ n: 2 });
  });

  it('clearOutbox empties the queue', () => {
    const s = memoryStorage();
    queueLearningEvent(s, { childId: 'c1', eventType: 'attempt' });
    clearOutbox(s);
    expect(readOutbox(s)).toEqual([]);
  });
});

// The manifest and service worker are static deployable artifacts in public/,
// not TypeScript application source — reading them validates what ships.
describe('web app manifest', () => {
  it('is valid JSON with the required PWA fields', () => {
    const raw = readFileSync(join(repoRoot, 'public', 'manifest.webmanifest'), 'utf8');
    const manifest = JSON.parse(raw);
    expect(manifest.name).toBe('Sky — Play & Learn');
    expect(manifest.short_name).toBe('Sky');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/play');
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((i: { purpose?: string }) => (i.purpose ?? '').includes('maskable'))).toBe(true);
  });
});

describe('service worker', () => {
  const sw = readFileSync(join(repoRoot, 'public', 'sw.js'), 'utf8');

  it('versions its caches', () => {
    expect(sw).toMatch(/CACHE_VERSION\s*=\s*['"]sky-v\d+['"]/);
  });

  it('precaches the app shell including the offline page', () => {
    expect(sw).toContain('/offline');
    expect(sw).toContain('/manifest.webmanifest');
    expect(sw).toContain('/icons/icon-192.png');
  });

  it('serves the offline page as the navigation fallback', () => {
    expect(sw).toContain("caches.match('/offline')");
  });

  it('never intercepts non-GET requests or /api', () => {
    expect(sw).toContain("request.method !== 'GET'");
    expect(sw).toContain('/api');
  });

  it('uses cache-first for build assets and icons', () => {
    expect(sw).toContain('/_next/static/');
    expect(sw).toContain('/icons/');
  });
});
