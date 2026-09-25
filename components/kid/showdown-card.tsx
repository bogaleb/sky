'use client';

import { useEffect, useRef, useState } from 'react';
import { AVATARS } from '@/components/avatars';
import { getFamilyWeeklyStars, type FamilyWeeklyRow } from '@/app/actions/showdown';
import { awardStickers } from '@/app/actions/rewards';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import {
  STAR_SPRINT_TARGET,
  challengeProgress,
  siblingRankings,
  showdownStatus,
  weekKey,
} from '@/lib/kid/showdown';

const CurioFallback = AVATARS.curio.Component;

function SiblingAvatar({ avatarId, className }: { avatarId: string; className?: string }) {
  const Avatar = AVATARS[avatarId]?.Component ?? CurioFallback;
  return <Avatar className={className} />;
}

/**
 * Map widget for the weekly Star Sprint. Shown only when the child has at
 * least one sibling to race against; silent (renders nothing) otherwise, on
 * error, or before data loads.
 */
export default function ShowdownCard({ childId }: { childId: string }) {
  const [rows, setRows] = useState<FamilyWeeklyRow[] | null>(null);
  const celebratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void getFamilyWeeklyStars(childId)
      .then((list) => {
        if (cancelled) return;
        setRows(list);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  // Star Sprint win: fired once per week, best-effort. awardStickers is a
  // no-op for unknown ids until the 'friendly-rival' def lands; the trophy
  // event is ignored until the union member lands in parent integration.
  useEffect(() => {
    if (!rows || celebratedRef.current) return;
    const me = rows.find((r) => r.childId === childId);
    const siblings = rows.filter((r) => r.childId !== childId);
    if (!me || siblings.length === 0) return;
    if (me.weeklyStars < STAR_SPRINT_TARGET) return;
    const key = `sky-showdown-${childId}-${weekKey()}`;
    try {
      if (window.localStorage.getItem(key) === '1') return;
    } catch {
      /* storage unavailable — still celebrate, rewards are idempotent */
    }
    celebratedRef.current = true;
    void (async () => {
      try {
        await awardStickers(childId, ['friendly-rival']);
        await checkTrophies(childId, 'showdown_done').catch(() => {});
        await logLearningEvent(childId, 'milestone', {
          metadata: { kind: 'showdown_win', stars: me.weeklyStars },
        }).catch(() => {});
      } catch {
        /* celebration is best-effort */
      }
      try {
        window.localStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
    })();
  }, [rows, childId]);

  if (!rows || rows.length < 2) return null;

  const me = rows.find((r) => r.childId === childId);
  if (!me) return null;
  const siblings = rows.filter((r) => r.childId !== childId);
  const status = showdownStatus(me.weeklyStars, siblings.length);
  if (!status.hasRival) return null;

  const progress = challengeProgress(me.weeklyStars);
  const ranked = siblingRankings(rows.map((r) => ({ id: r.childId, nickname: r.nickname, weeklyStars: r.weeklyStars })));
  const byId = new Map(rows.map((r) => [r.childId, r]));
  const fill = Math.min(1, me.weeklyStars / STAR_SPRINT_TARGET);

  return (
    <div
      className="w-full max-w-md rounded-kid-card bg-white/90 px-4 py-3 shadow-lg"
      aria-live="polite"
      aria-label={`Star Sprint: you have ${me.weeklyStars} of ${STAR_SPRINT_TARGET} stars this week.`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-black text-kid-ink-900 md:text-lg">Star Sprint</p>
        <p className="text-sm font-black text-kid-grape-700">
          {progress.done ? 'Finished!' : `${progress.remaining} to go`}
        </p>
      </div>

      <div
        className="mt-2 h-4 overflow-hidden rounded-full bg-kid-ink-900/15"
        role="progressbar"
        aria-valuenow={me.weeklyStars}
        aria-valuemin={0}
        aria-valuemax={STAR_SPRINT_TARGET}
        aria-label="Your stars toward the Star Sprint goal"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-kid-grape-400 to-kid-sun-400 transition-all"
          style={{ width: `${Math.round(fill * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-xs font-bold text-kid-ink-700">
        {me.weeklyStars}/{STAR_SPRINT_TARGET} stars this week — first to {STAR_SPRINT_TARGET} wins!
      </p>

      <ol className="mt-2 space-y-1">
        {ranked.map((entry) => {
          const row = byId.get(entry.id);
          if (!row) return null;
          const isMe = entry.id === childId;
          return (
            <li
              key={entry.id}
              className={`flex items-center gap-2 rounded-2xl px-2 py-1 ${
                isMe ? 'bg-kid-sun-300 font-black' : 'bg-kid-sky-300/25 font-bold'
              }`}
              aria-current={isMe ? 'true' : undefined}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kid-grape-500 text-sm font-black text-white"
                aria-label={`Rank ${entry.rank}`}
              >
                {entry.rank}
              </span>
              <SiblingAvatar avatarId={row.avatarId} className="h-8 w-8 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm text-kid-ink-900">
                {isMe ? 'You' : row.nickname}
              </span>
              <span className="shrink-0 text-sm font-black text-kid-grape-700">
                {entry.weeklyStars} {entry.weeklyStars === 1 ? 'star' : 'stars'}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs font-bold text-kid-ink-600">{status.message}</p>
    </div>
  );
}
