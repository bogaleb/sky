'use client';

import { useMemo } from 'react';
import KidShell from '@/components/kid/kid-shell';
import TodayHome from '@/components/kid/today-home';
import RhymeTime from '@/components/kid/rhyme-time';
import ClockTower from '@/components/kid/clock-tower';
import CoinCove from '@/components/kid/coin-cove';
import { GAME_REGISTRY } from '@/components/kid/game-registry';
import { ageProfile, isAgeBand } from '@/lib/kid/age-profile';
import { buildGarden, type SkillMasterySnapshot } from '@/lib/kid/garden';
import { buildToday } from '@/lib/kid/today';

const DEMO_CHILD = '00000000-0000-0000-0000-00000000demo';

// A child a few weeks in: some skills growing, one due for review.
const SAMPLE: SkillMasterySnapshot[] = [
  { code: 'rhyming', subject: 'reading', status: 'developing', currentLevel: 2, nextReviewAt: '2026-01-01T00:00:00Z', lastPracticedAt: '2026-09-20T00:00:00Z' },
  { code: 'alphabet', subject: 'reading', status: 'mastered', currentLevel: 5, nextReviewAt: null, lastPracticedAt: '2026-09-18T00:00:00Z' },
  { code: 'count', subject: 'math', status: 'proficient', currentLevel: 3, nextReviewAt: '2026-12-01T00:00:00Z', lastPracticedAt: '2026-09-22T00:00:00Z' },
  { code: 'add', subject: 'math', status: 'emerging', currentLevel: 1, nextReviewAt: '2026-12-01T00:00:00Z', lastPracticedAt: '2026-09-23T00:00:00Z' },
  { code: 'emotions', subject: 'feelings', status: 'developing', currentLevel: 1, nextReviewAt: null, lastPracticedAt: '2026-09-21T00:00:00Z' },
  { code: 'trace_letters', subject: 'writing', status: 'emerging', currentLevel: 1, nextReviewAt: null, lastPracticedAt: '2026-09-19T00:00:00Z' },
  { code: 'coloring', subject: 'drawing', status: null, currentLevel: 1, nextReviewAt: null, lastPracticedAt: null },
];

export default function UiPreview({ view, band }: { view: string; band: string }) {
  const ageBand = isAgeBand(band) ? band : '5-6';
  const profile = ageProfile(ageBand);
  const plan = useMemo(() => buildToday({ profile, games: GAME_REGISTRY, skills: SAMPLE, now: new Date() }), [profile]);
  const garden = useMemo(() => buildGarden(profile.gardenSubjects, SAMPLE), [profile]);
  const noop = () => {};

  if (view === 'rhymes') return <RhymeTime childId={DEMO_CHILD} nickname="Ada" ageBand={ageBand} onExit={noop} />;
  if (view === 'clock') return <ClockTower childId={DEMO_CHILD} nickname="Ada" ageBand={ageBand} onExit={noop} />;
  if (view === 'coins') return <CoinCove childId={DEMO_CHILD} nickname="Ada" ageBand={ageBand} onExit={noop} />;

  return (
    <KidShell points={42} onExit={noop}>
      <TodayHome
        nickname="Ada"
        profile={profile}
        plan={plan}
        garden={garden}
        done={plan.path.slice(0, 1).map((s) => s.key)}
        onStartStop={noop}
        onOpenGame={noop}
        onExplore={noop}
      />
    </KidShell>
  );
}
