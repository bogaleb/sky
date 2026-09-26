'use client';

import { useEffect, useState } from 'react';
import { getLearningDays, getStreakSummary, type StreakSummary } from '@/app/actions/calendar';
import {
  dayKey,
  buildMonthGrid,
  MONTH_NAMES,
  WEEKDAYS,
  streakGraceDays,
  streakMood,
  streakCopy,
} from '@/lib/kid/calendar';

/** Small star badge for active days. Pure SVG, no emoji. */
function LearnedStar() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 1.5l2.7 7.1 7.3.5-5.6 4.7 1.8 7.1-6.2-4-6.2 4 1.8-7.1L2 9.1l7.3-.5z"
        fill="#FFD93C"
        stroke="#E8A800"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/**
 * Streak calendar: a month grid showing which days the child learned.
 * Active days are read from learning_events (read-only server action).
 */
export default function StreakCalendar({ childId }: { childId: string }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayKey = dayKey(year, month, now.getDate());
  const weeks = buildMonthGrid(year, month);

  const [activeDays, setActiveDays] = useState<Set<string> | null>(null);
  const [streak, setStreak] = useState<StreakSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getLearningDays(childId)
      .then((days) => {
        if (!cancelled) setActiveDays(new Set(days));
      })
      .catch(() => {
        if (!cancelled) setActiveDays(new Set());
      });
    void getStreakSummary(childId)
      .then((s) => {
        if (!cancelled) setStreak(s);
      })
      .catch(() => {
        if (!cancelled) setStreak({ currentStreak: 0, lastActiveDate: null, ageBand: null });
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  const learnedCount = activeDays ? [...activeDays].filter((k) => k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length : 0;

  // Gentle streak line: the streak pauses ("takes a cozy nap") instead of
  // breaking — copy is kind, emoji-free, and 18px+. last_active_date is a
  // questDateKey (UTC), so the mood uses the matching UTC today key.
  const streakLine = (() => {
    if (!streak) return null;
    if (streak.currentStreak <= 0 && !streak.lastActiveDate) {
      return streak.ageBand === '3-4'
        ? 'Every learning day grows your streak — hooray for today!'
        : 'Every learning day grows your streak — start today!';
    }
    const utcToday = new Date().toISOString().slice(0, 10);
    const mood = streakMood(streak.lastActiveDate, utcToday, streakGraceDays(streak.ageBand));
    return streakCopy(mood, streak.currentStreak, streak.ageBand);
  })();

  return (
    <section
      aria-label={`${MONTH_NAMES[month]} learning calendar`}
      className="w-full max-w-xs rounded-kid-card bg-white/80 p-4 shadow-lg"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-black text-kid-ink-900">
          {MONTH_NAMES[month]} {year}
        </h2>
        {activeDays !== null && (
          <p className="text-xs font-extrabold text-kid-ink-700">
            {learnedCount} {learnedCount === 1 ? 'day' : 'days'} of learning
          </p>
        )}
      </div>

      {streakLine && (
        <p className="mt-2 text-lg font-extrabold text-kid-ink-900" aria-live="polite">
          {streakLine}
        </p>
      )}

      {activeDays === null ? (
        <div className="mt-3 grid grid-cols-7 gap-1" aria-hidden="true">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="kid-skeleton aspect-square rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="mt-3" role="grid" aria-label="Days you learned this month">
          <div className="grid grid-cols-7 gap-1" role="row">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="pb-1 text-center text-[11px] font-black text-kid-ink-700" aria-hidden="true">
                {d}
              </span>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1" role="row">
              {week.map((day, di) => {
                if (day === null) return <span key={di} aria-hidden="true" />;
                const key = dayKey(year, month, day);
                const learned = activeDays.has(key);
                const isToday = key === todayKey;
                return (
                  <span
                    key={di}
                    role="gridcell"
                    aria-label={`${MONTH_NAMES[month]} ${day}${learned ? ' — you learned!' : ''}${isToday ? ' — today' : ''}`}
                    className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-black ${
                      learned
                        ? 'bg-kid-sun-400/90 text-kid-ink-900 shadow'
                        : 'bg-kid-sky-100/70 text-kid-ink-700'
                    } ${isToday ? 'ring-2 ring-kid-coral-500 ring-offset-1' : ''}`}
                  >
                    {learned ? <LearnedStar /> : day}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 flex items-center gap-2 text-xs font-bold text-kid-ink-700">
        <LearnedStar /> = You learned!
      </p>
    </section>
  );
}
