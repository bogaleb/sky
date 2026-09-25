'use client';

import { useEffect, useState } from 'react';

/** Minimal storage surface so the outbox logic is unit-testable in node. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

/** True when the browser reports an online connection. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  return online;
}

export interface QueuedLearningEvent {
  id: string;
  childId: string;
  eventType: string;
  skillId?: string;
  activityId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  queuedAt: string;
}

export const OUTBOX_KEY = 'sky-outbox';
export const OUTBOX_CAP = 200;

function makeId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Read the queued events, healing corrupt data to an empty list. */
export function readOutbox(storage: StorageLike): QueuedLearningEvent[] {
  try {
    const raw = storage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is QueuedLearningEvent =>
        !!e && typeof e.id === 'string' && typeof e.childId === 'string' && typeof e.eventType === 'string'
    );
  } catch {
    return [];
  }
}

function writeOutbox(storage: StorageLike, items: QueuedLearningEvent[]): void {
  try {
    storage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch {
    /* Storage full or unavailable: keep the in-memory state; the
       events simply won't survive a reload. Never crash the game. */
  }
}

/**
 * Queue a learning event while offline. Oldest entries are dropped past
 * the cap so the outbox can never grow without bound.
 */
export function queueLearningEvent(
  storage: StorageLike,
  entry: Omit<QueuedLearningEvent, 'id' | 'queuedAt'>
): QueuedLearningEvent[] {
  const items = readOutbox(storage);
  items.push({ ...entry, id: makeId(), queuedAt: new Date().toISOString() });
  const trimmed = items.slice(-OUTBOX_CAP);
  writeOutbox(storage, trimmed);
  return trimmed;
}

/** Remove everything currently queued. */
export function clearOutbox(storage: StorageLike): void {
  storage.removeItem(OUTBOX_KEY);
}

export interface FlushResult {
  sent: number;
  failed: number;
}

/**
 * Send queued events through the provided async sender, in order.
 * Entries that fail stay queued for the next attempt; successful ones
 * are removed. Returns the counts.
 */
export async function flushOutbox(
  storage: StorageLike,
  sender: (entry: QueuedLearningEvent) => Promise<unknown>
): Promise<FlushResult> {
  const items = readOutbox(storage);
  const remaining: QueuedLearningEvent[] = [];
  let sent = 0;
  let failed = 0;
  for (const entry of items) {
    try {
      await sender(entry);
      sent++;
    } catch {
      failed++;
      remaining.push(entry);
    }
  }
  writeOutbox(storage, remaining);
  return { sent, failed };
}
