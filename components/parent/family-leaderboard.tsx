'use client';

import { useEffect, useState } from 'react';
import { AVATARS } from '@/components/avatars';
import { getFamilyLeaderboard, type FamilyWeeklyRow } from '@/app/actions/showdown';
import { STAR_SPRINT_TARGET, siblingRankings } from '@/lib/kid/showdown';

const CurioFallback = AVATARS.curio.Component;

/**
 * Parent dashboard section: this week's family standings. Read-only,
 * calm parent tokens, no emoji. Silent (renders nothing) when there is a
 * single child or no data yet.
 */
export default function FamilyLeaderboard() {
  const [rows, setRows] = useState<FamilyWeeklyRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getFamilyLeaderboard()
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rows || rows.length < 2) return null;

  const ranked = siblingRankings(
    rows.map((r) => ({ id: r.childId, nickname: r.nickname, weeklyStars: r.weeklyStars })),
  );
  const byId = new Map(rows.map((r) => [r.childId, r]));
  const leader = ranked[0];
  const leaderRow = leader ? byId.get(leader.id) : undefined;

  return (
    <div className="rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
      <h2 className="text-xl font-extrabold text-parent-sky-900">Family leaderboard</h2>
      <p className="mt-1 text-sm text-parent-ink-600">
        This week&rsquo;s Star Sprint — first to {STAR_SPRINT_TARGET} stars wins.
      </p>

      {leaderRow && leader.weeklyStars > 0 && (
        <div className="mt-4 rounded-xl bg-parent-sun-400/15 px-4 py-3" aria-live="polite">
          <p className="font-extrabold text-parent-ink-900">
            {leaderRow.nickname} is leading with {leader.weeklyStars}{' '}
            {leader.weeklyStars === 1 ? 'star' : 'stars'}.
          </p>
        </div>
      )}

      <table className="mt-4 w-full text-left">
        <thead>
          <tr className="text-xs font-extrabold uppercase tracking-wider text-parent-ink-600">
            <th scope="col" className="pb-2 pr-2">Rank</th>
            <th scope="col" className="pb-2 pr-2">Child</th>
            <th scope="col" className="pb-2 pr-2 text-right">Stars</th>
            <th scope="col" className="pb-2 text-right">Activities</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((entry) => {
            const row = byId.get(entry.id);
            if (!row) return null;
            const Avatar = AVATARS[row.avatarId]?.Component ?? CurioFallback;
            return (
              <tr key={entry.id} className="border-t border-parent-sky-100">
                <td className="py-2 pr-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-parent-sky-600 text-sm font-black text-white">
                    {entry.rank}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-2">
                    <Avatar className="h-8 w-8" />
                    <span className="font-extrabold text-parent-ink-900">{row.nickname}</span>
                  </span>
                </td>
                <td className="py-2 pr-2 text-right font-black text-parent-sky-900">
                  {entry.weeklyStars}
                </td>
                <td className="py-2 text-right font-bold text-parent-ink-600">
                  {row.weeklyActivities}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-parent-ink-600">
        Friendly race, not a report card — every child earns stars at their own pace.
      </p>
    </div>
  );
}
