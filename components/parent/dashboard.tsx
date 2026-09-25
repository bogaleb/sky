'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getDashboardData,
  getWeeklyDigest,
  type ChildDashboard,
  type WeeklyDigest,
} from '@/app/actions/dashboard';
import { AVATARS } from '@/components/avatars';
import PinGate from './pin-gate';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-parent-sky-100 bg-white p-5 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
      <p className="text-3xl font-extrabold text-parent-sky-900">{value}</p>
      <p className="mt-1 font-bold text-parent-ink-900">{label}</p>
      {sub && <p className="text-sm text-parent-ink-600">{sub}</p>}
    </div>
  );
}

function SubjectBar({ subject }: { subject: ChildDashboard['subjects'][number] }) {
  const pct = subject.total > 0 ? Math.round((subject.mastered / subject.total) * 100) : 0;
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between">
        <p className="font-bold text-parent-ink-900">{subject.subjectName}</p>
        <p className="text-sm font-semibold text-parent-ink-600">
          {subject.mastered}/{subject.total} skills growing
          {subject.avgLevel > 0 && ` · avg level ${subject.avgLevel}`}
        </p>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-parent-sky-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-parent-sky-600 to-parent-sky-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ChildReport({ child }: { child: ChildDashboard }) {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);

  const loadDigest = async () => {
    setDigestLoading(true);
    try {
      setDigest(await getWeeklyDigest(child.id));
    } catch {
      /* keep null */
    } finally {
      setDigestLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Flights this week" value={child.sessions7d} sub={`${child.sessions30d} in 30 days`} />
        <StatCard label="Stars this week" value={child.stars7d} sub={`${child.points7d} points`} />
        <StatCard label="Stickers earned" value={child.stickers} sub="in the sticker book" />
        <StatCard
          label="Last active"
          value={child.lastActiveAt ? timeAgo(child.lastActiveAt) : '—'}
          sub={child.lastActiveAt ? new Date(child.lastActiveAt).toLocaleDateString() : 'not yet'}
        />
      </div>

      {/* Weekly digest */}
      <div className="mt-6 rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-parent-sky-900">Weekly digest</h2>
          {!digest && (
            <button
              type="button"
              onClick={loadDigest}
              disabled={digestLoading}
              className="rounded-xl bg-parent-sky-600 px-5 py-2.5 font-bold text-white transition-all hover:bg-parent-sky-700 active:scale-95 disabled:opacity-40"
            >
              {digestLoading ? 'Writing…' : 'Generate this week\u2019s summary'}
            </button>
          )}
        </div>
        {digest ? (
          <div className="mt-3">
            <p className="text-lg font-extrabold text-parent-ink-900">{digest.headline}</p>
            <ul className="mt-2 space-y-1.5">
              {digest.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-parent-ink-600">
                  <span aria-hidden="true" className="font-black text-parent-sky-600">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-parent-ink-600">
            A plain-language summary of {child.nickname}&rsquo;s week: what they mastered,
            what they practiced, and what needs attention.
          </p>
        )}
      </div>

      {/* Subject mastery */}
      <div className="mt-6 rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
        <h2 className="text-xl font-extrabold text-parent-sky-900">Learning by subject</h2>
        <p className="mt-1 text-sm text-parent-ink-600">
          Skills marked &ldquo;growing&rdquo; are proficient or mastered. Levels run 1–5 per skill.
        </p>
        <div className="mt-3 divide-y divide-parent-sky-50">
          {child.subjects.map((s) => (
            <SubjectBar key={s.subjectCode} subject={s} />
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-6 rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
        <h2 className="text-xl font-extrabold text-parent-sky-900">Recent activity</h2>
        {child.recentMilestones.length === 0 ? (
          <p className="mt-2 text-parent-ink-600">No learning activity yet — fly to an island to begin!</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {child.recentMilestones.map((m, i) => (
              <li key={i} className="flex items-start justify-between gap-4 border-b border-parent-sky-50 pb-2.5 last:border-0">
                <span className="text-parent-ink-600">{m.detail}</span>
                <span className="shrink-0 text-sm font-semibold text-parent-ink-400">{timeAgo(m.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** The parent dashboard: PIN-gated learning reports, one tab per child. */
export default function Dashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [children, setChildren] = useState<ChildDashboard[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('sky_parent_zone') === 'unlocked') {
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    getDashboardData()
      .then((data) => {
        setChildren(data);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch(() => setError('Could not load reports. Check your connection and try again.'));
  }, [unlocked]);

  if (!unlocked) return <PinGate onUnlocked={() => setUnlocked(true)} />;

  const active = children?.find((c) => c.id === activeId) ?? null;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-parent-sky-900">Learning reports</h1>
          <p className="mt-1 text-parent-ink-600">Proof of learning, in plain language.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/profiles"
            className="rounded-xl border border-parent-sky-200 bg-white px-5 py-2.5 font-bold text-parent-sky-700 transition-all hover:bg-parent-sky-50"
          >
            Back to profiles
          </Link>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('sky_parent_zone');
              setUnlocked(false);
            }}
            className="rounded-xl border border-parent-sky-200 bg-white px-5 py-2.5 font-bold text-parent-ink-600 transition-all hover:bg-parent-sky-50"
          >
            Lock
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700">
          {error}
        </p>
      )}

      {children === null && !error && (
        <p className="mt-10 text-center text-lg text-parent-ink-600">Loading reports…</p>
      )}

      {children && children.length === 0 && (
        <div className="mt-10 rounded-2xl border border-parent-sky-100 bg-white p-8 text-center">
          <p className="text-xl font-extrabold text-parent-sky-900">No children yet</p>
          <p className="mt-2 text-parent-ink-600">Add a child profile to start tracking learning.</p>
          <Link
            href="/onboarding/children"
            className="mt-4 inline-block rounded-xl bg-parent-sky-600 px-6 py-3 font-bold text-white"
          >
            Add a child
          </Link>
        </div>
      )}

      {children && children.length > 0 && (
        <>
          {/* Child tabs */}
          <div className="mt-6 flex flex-wrap gap-3">
            {children.map((c) => {
              const Avatar = AVATARS[c.avatarId]?.Component;
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`flex items-center gap-2.5 rounded-2xl border-2 px-4 py-2.5 font-extrabold transition-all ${
                    isActive
                      ? 'border-parent-sky-600 bg-parent-sky-600 text-white shadow-lg'
                      : 'border-parent-sky-100 bg-white text-parent-ink-900 hover:border-parent-sky-300'
                  }`}
                >
                  {Avatar && <Avatar className="h-9 w-9" />}
                  {c.nickname}
                </button>
              );
            })}
          </div>

          {active && <ChildReport key={active.id} child={active} />}
        </>
      )}
    </main>
  );
}
