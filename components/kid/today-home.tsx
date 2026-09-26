'use client';

import type { ReactNode } from 'react';
import { AVATARS } from '@/components/avatars';
import type { AgeProfile } from '@/lib/kid/age-profile';
import { gameMeta } from '@/lib/kid/game-catalog';
import type { GardenPlant } from '@/lib/kid/garden';
import type { PathStop, StopReason, TodayPlan } from '@/lib/kid/today';
import { playSfx } from '@/lib/kid/audio';
import { GAME_GROUPS, GameArt, gamesForGroup, getGame, type GameEntry } from './game-registry';
import GrowthGarden from './growth-garden';
import { ListenButton, TalkTile, useNarrateOnce, type TileTone } from './ui/talk';

/**
 * The Today home — what a child sees when they open Sky.
 *
 * Replaces "choose from 9 islands and 30 games" with a short, planned path
 * (lib/kid/today.ts), a garden that grows with mastery, and a small shelf of
 * free play. The layout changes with the child's age profile:
 *
 *   picture (3–4)  voice-led, no text on tiles, 3 giant stops, 4 play tiles
 *   path    (5–6)  titles on tiles, 4 stops, 6 play tiles
 *   explorer(7–8)  titles + why, 4 stops, 6 play tiles, the full library
 *
 * Everything that used to be on the home (islands, trail, gifts, stickers…)
 * is one tap away behind "Explore the sky".
 */

const REASON_TEXT: Record<StopReason, string> = {
  lesson: 'Learn something new',
  review: 'Time to practice again',
  practice: 'Keep it growing',
  new: 'Try something new',
  story: 'A cozy story',
  create: 'Make something',
};

const STOP_TONES: TileTone[] = ['sky', 'coral', 'mint', 'grape'];

interface StopView {
  title: string;
  say: string;
  art: ReactNode;
  character: string;
}

function stopView(stop: PathStop): StopView {
  if (stop.kind === 'lesson') {
    const Curio = AVATARS.curio.Component;
    return {
      title: 'Learn with Curio',
      say: 'Learn with Curio! A short lesson just for you.',
      art: <Curio />,
      character: 'curio',
    };
  }
  if (stop.kind === 'story') {
    const Luna = AVATARS.luna.Component;
    return { title: 'Story time', say: 'Story time with Luna. Pick a story to hear.', art: <Luna />, character: 'luna' };
  }
  const entry = getGame(stop.gameId ?? null);
  return {
    title: entry?.title ?? 'Play',
    say: gameMeta(stop.gameId ?? '')?.say ?? entry?.title ?? 'Play a game',
    art: entry ? <GameArt entry={entry} /> : null,
    character: 'curio',
  };
}

function Check() {
  return (
    <span className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-7 w-7 text-kid-mint-600">
        <path d="M5 12.5 10 17l9-10" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function StepNumber({ n, next }: { n: number; next: boolean }) {
  return (
    <span
      className={`absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full font-display text-2xl font-black shadow-md ${
        next ? 'bg-kid-sun-400 text-kid-ink-900 motion-safe:animate-kid-bounce-soft' : 'bg-white/90 text-kid-ink-800'
      }`}
      aria-hidden
    >
      {n}
    </span>
  );
}

function SectionTitle({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return <h2 className="font-display mb-3 text-2xl font-black text-kid-ink-900 md:text-3xl">{children}</h2>;
}

export interface TodayHomeProps {
  nickname: string;
  profile: AgeProfile;
  /** null while loading. */
  plan: TodayPlan | null;
  garden: GardenPlant[] | null;
  /** Path stop keys finished today. */
  done: string[];
  onStartStop: (stop: PathStop) => void;
  onOpenGame: (gameId: string) => void;
  onExplore: () => void;
}

export default function TodayHome({ nickname, profile, plan, garden, done, onStartStop, onOpenGame, onExplore }: TodayHomeProps) {
  const text = profile.tileText;
  const nextIndex = plan ? plan.path.findIndex((s) => !done.includes(s.key)) : -1;
  const allDone = !!plan && nextIndex === -1;
  const greeting = allDone
    ? `You finished today's path, ${nickname}! Play anything you like.`
    : profile.home === 'picture'
      ? `Hi ${nickname}! Tap the big picture to start. Hold any picture to hear what it is.`
      : `Hi ${nickname}! Here is your path for today.`;
  useNarrateOnce(profile.autoNarrate && !!plan, 'curio', greeting, 900);

  const stopHeight = profile.home === 'picture' ? 260 : 210;
  const shelfEntries = (plan?.shelf ?? []).map((id) => getGame(id)).filter((g): g is GameEntry => !!g);

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6 pb-10">
      {/* Greeting */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <h1 className="font-display text-center text-3xl font-black text-kid-ink-900 md:text-5xl">
          {allDone ? `Great job, ${nickname}!` : `Hi, ${nickname}!`}
        </h1>
        <ListenButton say={greeting} character="curio" size={56} tone="sun" label="Hear what to do" />
      </div>

      {/* Today's path */}
      <section aria-label="Today's path">
        <SectionTitle show={text !== 'none'}>Today</SectionTitle>
        {!plan ? (
          <div className={`grid gap-4 ${profile.home === 'picture' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
            {Array.from({ length: profile.pathLength }).map((_, i) => (
              <div key={i} className="kid-skeleton rounded-kid-card" style={{ minHeight: stopHeight }} aria-hidden />
            ))}
          </div>
        ) : (
          <ol className={`grid gap-4 ${profile.home === 'picture' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
            {plan.path.map((stop, i) => {
              const v = stopView(stop);
              const isDone = done.includes(stop.key);
              const isNext = i === nextIndex;
              return (
                <li key={stop.key} className="relative">
                  <TalkTile
                    art={v.art}
                    title={v.title}
                    sub={REASON_TEXT[stop.reason]}
                    say={v.say}
                    character={v.character}
                    tone={STOP_TONES[i % STOP_TONES.length]}
                    textMode={text}
                    minHeight={stopHeight}
                    onPress={() => onStartStop(stop)}
                    className={`h-full ${isNext ? 'rounded-kid-card ring-8 ring-kid-sun-300/80' : ''} ${isDone ? 'opacity-80' : ''}`}
                    badge={isDone ? <Check /> : <StepNumber n={i + 1} next={isNext} />}
                  />
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Growth garden */}
      {garden && <GrowthGarden plants={garden} showLabel={text !== 'none'} />}

      {/* Free play shelf */}
      {shelfEntries.length > 0 && (
        <section aria-label="Free play">
          <SectionTitle show={text !== 'none'}>Free play</SectionTitle>
          <div className={`grid gap-4 ${profile.home === 'picture' ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {shelfEntries.map((entry) => (
              <TalkTile
                key={entry.id}
                art={<GameArt entry={entry} />}
                title={entry.title}
                sub={entry.sub}
                say={gameMeta(entry.id)?.say ?? entry.title}
                tone={entry.color}
                textMode={text}
                minHeight={profile.home === 'picture' ? 170 : 150}
                onPress={() => onOpenGame(entry.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Full library for independent readers */}
      {profile.showLibrary && (
        <section aria-label="All games" className="flex flex-col gap-5">
          <SectionTitle show>All games</SectionTitle>
          {GAME_GROUPS.map((group) => {
            const entries = gamesForGroup(group.id).filter((e) => gameMeta(e.id)?.ages.includes(profile.band));
            if (entries.length === 0) return null;
            return (
              <div key={group.id}>
                <h3 className="mb-2 text-xl font-black text-kid-ink-800">{group.label}</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {entries.map((entry) => (
                    <TalkTile
                      key={entry.id}
                      art={<GameArt entry={entry} />}
                      title={entry.title}
                      say={gameMeta(entry.id)?.say ?? entry.title}
                      tone={entry.color}
                      textMode="title"
                      minHeight={130}
                      onPress={() => onOpenGame(entry.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Everything else: islands, trail, stickers, gifts */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            playSfx('whoosh');
            onExplore();
          }}
          aria-label="Explore the sky: islands, quests, stickers and more"
          className="kid-press flex items-center gap-3 rounded-full border-b-8 border-kid-grape-700 bg-kid-grape-500 px-8 text-xl font-black text-white shadow-xl md:text-2xl"
          style={{ minHeight: Math.min(profile.minTarget, 80) }}
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" />
            <path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor" />
          </svg>
          {text !== 'none' ? 'Explore the sky' : null}
        </button>
      </div>
    </div>
  );
}
