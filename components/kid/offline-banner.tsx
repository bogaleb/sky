'use client';

import { useEffect, useRef, useState } from 'react';
import { useOnlineStatus, browserStorage, readOutbox, flushOutbox } from '@/lib/kid/offline';
import { logLearningEvent } from '@/app/actions/learning';
import { playSfx } from '@/lib/kid/audio';

const BACK_ONLINE_MS = 4000;

/**
 * Fixed banner that appears when the device loses connectivity and, on
 * reconnect, flushes any queued learning events before celebrating.
 * Mount once near the root of the kid experience.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const storage = browserStorage();
    if (!online) {
      setShowBackOnline(false);
      if (storage) setQueuedCount(readOutbox(storage).length);
      return;
    }
    // Reconnected: flush anything queued while offline.
    if (!storage) return;
    const pending = readOutbox(storage);
    if (pending.length === 0) return;
    (async () => {
      const result = await flushOutbox(storage, (entry) =>
        logLearningEvent(entry.childId, entry.eventType, {
          skillId: entry.skillId,
          activityId: entry.activityId,
          sessionId: entry.sessionId,
          metadata: entry.metadata,
        })
      ).catch(() => ({ sent: 0, failed: pending.length }));
      if (result.sent > 0) {
        playSfx('correct');
        setShowBackOnline(true);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS);
      }
      setQueuedCount(readOutbox(storage).length);
    })();
  }, [online]);

  if (showBackOnline) {
    return (
      <div
        role="status"
        className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-kid-mint-400 px-4 py-2.5 text-center shadow-lg"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
          <path d="M12 2a10 10 0 1 0 10 10" fill="none" stroke="#17324F" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
          <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="#17324F" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M8 12.5l2.8 2.8L16 10" fill="none" stroke="#17324F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-black text-kid-ink-900 md:text-base">Back online! Everything is synced.</span>
      </div>
    );
  }

  if (!online) {
    return (
      <div
        role="alert"
        className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-kid-ink-900/90 px-4 py-2.5 text-center shadow-lg"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
          <path d="M2 8.5A15 15 0 0 1 12 5c3.9 0 7.4 1.5 10 3.9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M5.5 12.5a10.5 10.5 0 0 1 13 0" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1.8" fill="#fff" />
          <line x1="3" y1="3" x2="21" y2="21" stroke="#FF8C42" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-black text-white md:text-base">
          You&apos;re offline — your stars will sync later
          {queuedCount > 0 ? ` (${queuedCount} waiting)` : ''}.
        </span>
      </div>
    );
  }

  return null;
}
