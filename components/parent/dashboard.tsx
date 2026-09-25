'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getDashboardData,
  getWeeklyDigest,
  type ChildDashboard,
  type WeeklyDigest,
} from '@/app/actions/dashboard';
import { AVATARS } from '@/components/avatars';
import PinGate from './pin-gate';
import WeeklyGoals from './weekly-goals';
import Certificate from './certificate';
import FamilyLeaderboard from './family-leaderboard';
import { getTrophies } from '@/app/actions/trophies';

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

function formatMinutes(mins: number): string {
  if (mins < 1) return '0 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const STATUS_LABEL: Record<string, string> = {
  emerging: 'Starting out',
  developing: 'Developing',
  proficient: 'Proficient',
  mastered: 'Mastered',
};

function SkillRow({ skill }: { skill: ChildDashboard['skillMastery'][number] }) {
  const pct = Math.round((skill.currentLevel / 5) * 100);
  return (
    <div className="py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold text-parent-ink-900">{skill.skillName}</p>
        <div className="flex items-center gap-3 text-sm">
          {skill.accuracyPct !== null && (
            <span className="font-semibold text-parent-ink-600">{skill.accuracyPct}% correct</span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
              skill.status === 'mastered'
                ? 'bg-parent-leaf-600/10 text-parent-leaf-600'
                : skill.status === 'proficient'
                  ? 'bg-parent-sky-100 text-parent-sky-700'
                  : 'bg-parent-sun-400/15 text-parent-sun-500'
            }`}
          >
            {STATUS_LABEL[skill.status] ?? skill.status}
          </span>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-parent-sky-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-parent-sky-600 to-parent-sky-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-14 shrink-0 text-right text-sm font-bold text-parent-ink-600">
          Lv {skill.currentLevel}/5
        </span>
      </div>
    </div>
  );
}

function CelebrateCertificate({ child }: { child: ChildDashboard }) {
  const [trophyCount, setTrophyCount] = useState(0);
  useEffect(() => {
    getTrophies(child.id)
      .then((t) => setTrophyCount(t.length))
      .catch(() => {});
  }, [child.id]);
  return (
    <Certificate
      nickname={child.nickname}
      stats={{ stars: child.stars7d, trophies: trophyCount, activities: child.activities7d }}
    />
  );
}

function ChildReport({ child }: { child: ChildDashboard }) {
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);

  // Load this week's summary automatically; it is cached server-side.
  useEffect(() => {
    let cancelled = false;
    getWeeklyDigest(child.id)
      .then((d) => {
        if (!cancelled) setDigest(d);
      })
      .catch(() => {
        /* summary stays unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, [child.id]);

  const skillGroups = useMemo(() => {
    const groups = new Map<string, { subjectName: string; islandName: string; skills: typeof child.skillMastery }>();
    for (const s of child.skillMastery) {
      const g = groups.get(s.subjectCode) ?? { subjectName: s.subjectName, islandName: s.islandName, skills: [] };
      g.skills.push(s);
      groups.set(s.subjectCode, g);
    }
    return [...groups.values()];
  }, [child.skillMastery]);

  return (
    <div className="mt-6">
      {/* Weekly digest */}
      <div className="rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
        <h2 className="text-xl font-extrabold text-parent-sky-900">Weekly digest</h2>
        <p className="mt-1 text-sm text-parent-ink-600">
          {child.nickname}&rsquo;s last 7 days at a glance.
          {child.lastActiveAt && (
            <> Last active {timeAgo(child.lastActiveAt)}.</>
          )}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Activities answered" value={child.activities7d} sub={`${child.sessions7d} learning flights`} />
          <StatCard label="Stars earned" value={child.stars7d} sub={`${child.points7d} points`} />
          <StatCard label="Learning time" value={formatMinutes(child.timePlayedMinutes7d)} sub="estimated from flights" />
          <StatCard
            label="Day streak"
            value={child.streak}
            sub={child.longestStreak > 0 ? `best: ${child.longestStreak} days` : 'fly daily to start one'}
          />
          <StatCard label="Daily quests done" value={child.questsCompleted7d} sub="in the last 7 days" />
          <StatCard label="Stickers earned" value={child.stickers} sub="in the sticker book" />
        </div>

        {child.topSkills.length > 0 && (
          <div className="mt-4 rounded-xl bg-parent-sky-50 px-4 py-3">
            <p className="text-sm font-extrabold text-parent-sky-900">Most practiced this week</p>
            <p className="mt-1 text-parent-ink-600">
              {child.topSkills
                .map((s) => `${s.skillName} (${s.attempts} ${s.attempts === 1 ? 'try' : 'tries'})`)
                .join(' · ')}
            </p>
          </div>
        )}

        <div className="mt-4 border-t border-parent-sky-100 pt-4">
          {digest ? (
            <div>
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
            <p className="text-parent-ink-600">Writing this week&rsquo;s summary…</p>
          )}
        </div>
      </div>

      {/* Weekly goals + celebrate */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <WeeklyGoals childId={child.id} />
        <div className="rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
          <h2 className="text-xl font-extrabold text-parent-sky-900">Celebrate</h2>
          <p className="mt-1 text-sm text-parent-ink-600">
            Print a certificate for {child.nickname}&rsquo;s week of learning.
          </p>
          <div className="mt-4">
            <CelebrateCertificate child={child} />
          </div>
        </div>
      </div>

      {/* Suggested focus */}
      {child.focusSkills.length > 0 && (
        <div className="mt-6 rounded-2xl border border-parent-sun-400/40 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
          <h2 className="text-xl font-extrabold text-parent-sky-900">Suggested focus</h2>
          <p className="mt-1 text-sm text-parent-ink-600">
            Skills {child.nickname} practiced recently that could use a little more time.
          </p>
          <ul className="mt-3 space-y-3">
            {child.focusSkills.map((f) => (
              <li key={f.skillName} className="rounded-xl bg-parent-sky-50 px-4 py-3">
                <p className="font-extrabold text-parent-ink-900">
                  {f.skillName} <span className="font-semibold text-parent-ink-600">· {f.subjectName}</span>
                </p>
                <p className="mt-1 text-parent-ink-600">{f.suggestion}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-skill mastery, grouped by island */}
      <div className="mt-6 rounded-2xl border border-parent-sky-100 bg-white p-6 shadow-[0_4px_16px_rgba(18,60,96,0.06)]">
        <h2 className="text-xl font-extrabold text-parent-sky-900">Skill mastery</h2>
        <p className="mt-1 text-sm text-parent-ink-600">
          Every skill {child.nickname} has attempted, grouped by island. Levels run 1–5 per skill.
        </p>
        {skillGroups.length === 0 ? (
          <p className="mt-3 text-parent-ink-600">No skills attempted yet — fly to an island to begin!</p>
        ) : (
          <div className="mt-4 space-y-6">
            {skillGroups.map((g) => (
              <section key={g.subjectName} aria-label={`${g.subjectName} skills`}>
                <div className="flex items-baseline justify-between border-b-2 border-parent-sky-100 pb-1.5">
                  <h3 className="font-extrabold text-parent-sky-900">{g.subjectName}</h3>
                  <p className="text-sm font-semibold text-parent-ink-400">{g.islandName}</p>
                </div>
                <div className="divide-y divide-parent-sky-50">
                  {g.skills.map((s) => (
                    <SkillRow key={s.skillId} skill={s} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Learning by subject (overview) */}
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

          {/* Family leaderboard: sibling Star Sprint, all children */}
          <div className="mt-6">
            <FamilyLeaderboard />
          </div>
        </>
      )}
    </main>
  );
}
