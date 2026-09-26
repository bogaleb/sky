'use client';

import TrailBanner from '../trail-banner';
import {
  GAME_GROUPS,
  GameCard,
  gamesForGroup,
  todaysPicks,
} from '../game-registry';
import UpNext from '../up-next';
import GoalMeter from '../goal-meter';
import SeasonalDecor from '../seasonal-decor';
import DailyGift from '../daily-gift';
import OfflineBanner from '../offline-banner';
import ShowdownCard from '../showdown-card';
import StreakCalendar from '../streak-calendar';
import { PetWidget } from '../pet-widget';
import { getIsland } from '@/lib/kid/islands';
import { STICKERS } from '@/lib/kid/stickers';
import { playSfx } from '@/lib/kid/audio';
import SkyMap from '../sky-map';
import GrowthGarden from '../growth-garden';
import type { SessionMachine } from './phase-machine';

/**
 * MapView — the Trail-first hub: TrailBanner, Sky Park (today's picks +
 * subject tabs), UpNext, the widget strip, and the island map.
 * Motion budget: no ambient loops of its own; GameCard hover motion is
 * interaction feedback and respects reduced motion upstream.
 */
export default function MapView({ machine }: { machine: SessionMachine }) {
  const { child } = machine;
  return (
    <div className="relative z-10 flex w-full flex-col items-center gap-5">
      <SeasonalDecor />
      <OfflineBanner />
      <TrailBanner trail={machine.trailState} onStartQuest={() => void machine.startTrailQuest()} starting={machine.startingQuest} />
      {/* Growth Garden hero: the mastery-driven bloom visual, right under the
          trail banner so progress greets the kid first. */}
      <GrowthGarden progress={machine.islandProgress} />
      {/* Sky Park: Trail-first hub. Today's picks for 1-tap fun, then games
          organized by subject — every game reachable in at most 2 taps. */}
      <section aria-label="Sky Park" className="glass-kid relative w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
        <h2 className="font-display text-center text-2xl text-kid-ink-900 md:text-4xl">Sky Park</h2>
        <p className="mt-1 text-center text-sm font-bold text-kid-ink-700 md:text-base">
          Pick today&apos;s games, or explore by subject
        </p>
        {/* Today's picks — deterministic daily rotation, one tap to play. */}
        <div className="mt-5">
          <h3 className="font-display text-lg font-black text-kid-ink-900 md:text-xl">Today&apos;s picks</h3>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
            {todaysPicks().map((entry) => (
              <GameCard key={entry.id} entry={entry} onOpen={(id) => void machine.requestOpenGame(id)} />
            ))}
          </div>
        </div>
        {/* Subject tabs — every game is one more tap away. */}
        <div className="mt-6">
          <div role="tablist" aria-label="Games by subject" className="flex flex-wrap justify-center gap-2">
            {GAME_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={machine.parkTab === g.id}
                onClick={() => {
                  playSfx('pop');
                  machine.setParkTab(g.id);
                }}
                className={
                  machine.parkTab === g.id
                    ? 'btn-kid btn-kid-sky btn-kid-sm'
                    : 'rounded-full bg-white/70 px-5 py-2.5 text-base font-extrabold text-kid-ink-900 shadow-md transition-transform hover:scale-105 active:scale-95'
                }
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs font-bold text-kid-ink-700">
            {(GAME_GROUPS.find((g) => g.id === machine.parkTab) ?? GAME_GROUPS[0]).tag}
          </p>
          <div role="tabpanel" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
            {gamesForGroup(machine.parkTab).map((entry) => (
              <GameCard key={entry.id} entry={entry} onOpen={(id) => void machine.requestOpenGame(id)} />
            ))}
          </div>
        </div>
        {/* Pet companion quick entry. */}
        <div className="mt-5 flex justify-center">
          <PetWidget child={child} onOpen={() => void machine.requestOpenGame('pet')} />
        </div>
      </section>
      <UpNext
        childId={child.id}
        onPracticeIsland={(islandId) => {
          const isl = getIsland(islandId);
          if (isl) void machine.startIslandSession(isl);
        }}
        onStartTrail={() => void machine.startTrailQuest()}
      />
      <div className="glass-kid flex w-full max-w-4xl flex-wrap items-stretch justify-center gap-3 px-4 py-4">
        <GoalMeter childId={child.id} />
        <DailyGift childId={child.id} nickname={child.nickname} />
        <ShowdownCard childId={child.id} />
        <StreakCalendar childId={child.id} />
      </div>
      <SkyMap
        nickname={child.nickname}
        onSelectIsland={(isl) => void machine.startIslandSession(isl)}
        onSurprise={() => void machine.startIslandSession(null)}
        onOpenStickers={() => machine.setShowStickers(true)}
        onTalkToCharacter={(id) => machine.setTalkWith(id)}
        progress={machine.islandProgress}
        stickerCount={machine.stickerIds.length}
        stickerTotal={STICKERS.length}
      />
    </div>
  );
}
