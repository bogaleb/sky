'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSkillMastery, type SkillMasteryRow } from '@/app/actions/report-card';

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17l-5.7 3 1.2-6.3L2.8 9.3l6.4-.8z"
        fill={filled ? '#F59E0B' : 'none'}
        stroke={filled ? '#F59E0B' : '#94A3B8'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${count} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= count} />
      ))}
    </span>
  );
}

/**
 * Printable Report Card: the full 44-skill mastery grid grouped by island.
 * Parents print it from the dashboard; the print stylesheet renders clean
 * black-on-white.
 */
export default function ReportCard({
  childId,
  nickname,
}: {
  childId: string;
  nickname: string;
}) {
  const [rows, setRows] = useState<SkillMasteryRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    getSkillMastery(childId)
      .then((r) => {
        if (alive) setRows(r);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [childId]);

  const groups = useMemo(() => {
    if (!rows) return [];
    const order: string[] = [];
    const bySubject = new Map<string, SkillMasteryRow[]>();
    for (const r of rows) {
      if (!bySubject.has(r.subjectCode)) {
        bySubject.set(r.subjectCode, []);
        order.push(r.subjectCode);
      }
      bySubject.get(r.subjectCode)!.push(r);
    }
    return order.map((code) => ({ code, skills: bySubject.get(code)! }));
  }, [rows]);

  const started = rows?.filter((r) => r.stars > 0).length ?? 0;
  const avg =
    rows && rows.length > 0
      ? (rows.reduce((a, r) => a + r.stars, 0) / rows.length).toFixed(1)
      : '0.0';

  const print = () => {
    document.body.classList.add('sky-print-report');
    const done = () => document.body.classList.remove('sky-print-report');
    window.addEventListener('afterprint', done, { once: true });
    window.print();
    window.setTimeout(done, 1500);
  };

  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      <style>{`
        @media print {
          body.sky-print-report * { visibility: hidden; }
          body.sky-print-report .sky-report-root,
          body.sky-print-report .sky-report-root * { visibility: visible; }
          body.sky-print-report .sky-report-root {
            position: fixed;
            inset: 0;
            margin: 0;
            border: none;
            box-shadow: none;
            background: #fff;
            color: #000;
            overflow: visible;
          }
          body.sky-print-report .sky-report-root * {
            color: #000 !important;
            background: transparent !important;
            border-color: #bbb !important;
            box-shadow: none !important;
          }
          body.sky-print-report .no-print { display: none !important; }
        }
      `}</style>

      <div className="sky-report-root rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-parent-sky-700">
              Sky Learning
            </p>
            <h2 className="mt-1 text-2xl font-black text-parent-ink-900">
              Report Card &mdash; {nickname}
            </h2>
            <p className="mt-1 text-sm text-parent-ink-600">
              {date} &middot; {started} of {rows?.length ?? 44} skills started &middot; average {avg} of 5 stars
            </p>
          </div>
          <button
            type="button"
            onClick={print}
            className="no-print rounded-xl bg-parent-sky-600 px-5 py-2.5 font-bold text-white transition-all hover:bg-parent-sky-700"
          >
            Print
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 font-bold text-red-700">
            Could not load the report card. Please try again later.
          </p>
        )}

        {rows === null && !error && (
          <p className="mt-6 text-parent-ink-600">Gathering {nickname}&rsquo;s skills&hellip;</p>
        )}

        {rows !== null && rows.length === 0 && (
          <p className="mt-6 text-parent-ink-600">
            No skills found yet. They will appear here once learning begins.
          </p>
        )}

        {groups.map((g) => (
          <section key={g.code} className="mt-6">
            <h3 className="text-lg font-extrabold text-parent-sky-900">
              {g.skills[0].subjectName}
              {g.skills[0].islandName && (
                <span className="ml-2 text-sm font-semibold text-parent-ink-600">
                  {g.skills[0].islandName}
                </span>
              )}
            </h3>
            <ul className="mt-2 divide-y divide-parent-sky-100 overflow-hidden rounded-xl border border-parent-sky-100">
              {g.skills.map((s) => (
                <li
                  key={s.skillId}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-parent-ink-900">{s.skillName}</p>
                    <p className="text-xs text-parent-ink-600">
                      {s.status === 'not_started'
                        ? 'Not started yet'
                        : `${s.status.charAt(0).toUpperCase() + s.status.slice(1)}${
                            s.practicedAt
                              ? ` · practiced ${new Date(s.practicedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                              : ''
                          }`}
                    </p>
                  </div>
                  <Stars count={s.stars} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
