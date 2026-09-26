'use client';

import QuestIntro from '../quest-intro';
import StickerBook from '../sticker-book';
import Songbook from '../songbook';
import Storybook from '../storybook';
import LibraryPicker from '../library-picker';
import { TrophyCelebration } from '../trophy-shelf';
import { IslandIntroSkeleton } from '../loading-skeleton';
import HostCharacter from '../host-character';
import VideoSpot from '../video-spot';
import ActivityStage from '../activity-stage';
import WelcomeQuest from '../welcome-quest';
import CharacterTalk from '../character-talk';
import { bumpQuestProgress } from '@/app/actions/trail';
import { awardStickers } from '@/app/actions/rewards';
import { logLearningEvent } from '@/app/actions/learning';
import { playSfx, speakAs } from '@/lib/kid/audio';
import type { Song } from '@/lib/kid/songs';
import type { Story } from '@/lib/kid/stories';
import { Intro, IslandIntro, Complete, Goodbye } from './moments';
import MapView from './map-view';
import { TimeLimitWindDown } from '../bedtime';
import type { SessionMachine } from './phase-machine';

/**
 * PhaseRouter — renders the current session phase plus the phase-independent
 * overlays (welcome quest, character talk, sticker book, library, story,
 * song, island-loading). Pure view routing over the session machine;
 * motion budget: entrance/feedback animations only, no new ambient loops.
 */
export default function PhaseRouter({ machine }: { machine: SessionMachine }) {
  const {
    child,
    sessionId,
    onExit,
    phase,
    setPhase,
    points,
    stars,
    mood,
    setMood,
    island,
    loadingIsland,
    novaComfort,
    showTryAgain,
    setShowTryAgain,
    stickerIds,
    setStickerIds,
    showStickers,
    setShowStickers,
    newStickers,
    newTrophies,
    setNewTrophies,
    activeSong,
    setActiveSong,
    activeStory,
    setActiveStory,
    pickingLibrary,
    setPickingLibrary,
    trailStop,
    questOutro,
    showWelcome,
    setShowWelcome,
    talkWith,
    setTalkWith,
    activeSteps,
    step,
    handleSubmit,
    handleComplete,
    beginPlaying,
    backToMap,
  } = machine;

  return (
    <>
      {loadingIsland && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-sky-300/60 p-4">
          <div className="w-full max-w-2xl rounded-kid-card bg-white/90 px-6 py-8 shadow-2xl">
            <p className="mb-5 text-center text-2xl font-black text-kid-ink-900">Flying to the island…</p>
            <IslandIntroSkeleton />
          </div>
        </div>
      )}
      {phase === 'intro' && <Intro child={child} onStart={() => setPhase('map')} />}
      {phase === 'map' && <MapView machine={machine} />}
      {showWelcome && (
        <WelcomeQuest childId={child.id} nickname={child.nickname} onDone={() => setShowWelcome(false)} />
      )}
      {talkWith && <CharacterTalk characterId={talkWith} onClose={() => setTalkWith(null)} />}
      {phase === 'trailIntro' && trailStop && (
        <QuestIntro stop={trailStop} nickname={child.nickname} onStart={beginPlaying} />
      )}
      {showStickers && (
        <StickerBook earnedIds={stickerIds} onClose={() => setShowStickers(false)} />
      )}
      {phase === 'islandIntro' && island && (
        <IslandIntro
          island={island}
          child={child}
          onStart={beginPlaying}
          onStoryTime={island.subjectCode === 'reading' ? () => setPickingLibrary('story') : undefined}
          onSingAlong={island.subjectCode === 'music' ? () => setPickingLibrary('song') : undefined}
        />
      )}
      {pickingLibrary && (
        <LibraryPicker
          kind={pickingLibrary}
          onClose={() => setPickingLibrary(null)}
          onPick={(item) => {
            setPickingLibrary(null);
            if (pickingLibrary === 'story') setActiveStory(item as Story);
            else setActiveSong(item as Song);
          }}
        />
      )}
      {activeStory && (
        <Storybook
          story={activeStory}
          onDone={() => setActiveStory(null)}
          onFinish={() => {
            setActiveStory(null);
            // Finishing a story earns the Bookworm sticker + feeds the Bookworm daily quest!
            // After 6pm local time it also earns the Night Owl bedtime-story sticker.
            void bumpQuestProgress(child.id, 'story_read', 1).catch(() => {});
            const storyStickers = ['bookworm', 'friend-luna', 'star-reading'];
            if (new Date().getHours() >= 18) storyStickers.push('night-owl');
            void awardStickers(child.id, storyStickers)
              .then((fresh) => {
                if (fresh.length > 0) {
                  setStickerIds((prev) => [...prev, ...fresh.filter((f) => !prev.includes(f))]);
                  speakAs('luna', 'Wonderful reading! You finished the whole story! You earned the Story Explorer sticker!');
                }
              })
              .catch(() => {});
            void logLearningEvent(child.id, 'milestone', {
              sessionId: sessionId ?? undefined,
              metadata: { kind: 'story_finished', story: activeStory.id },
            }).catch(() => {});
          }}
        />
      )}
      {activeSong && (
        <Songbook
          song={activeSong}
          onDone={() => setActiveSong(null)}
          onFinish={() => {
            setActiveSong(null);
            // Singing earns the Songbird sticker + feeds the Songbird daily quest!
            void bumpQuestProgress(child.id, 'song_sung', 1).catch(() => {});
            void awardStickers(child.id, ['songbird', 'friend-riff', 'star-music'])
              .then((fresh) => {
                if (fresh.length > 0) {
                  setStickerIds((prev) => [...prev, ...fresh.filter((f) => !prev.includes(f))]);
                  speakAs('riff', 'Bravo! You sang the whole song! You earned the Songbird sticker!');
                }
              })
              .catch(() => {});
            void logLearningEvent(child.id, 'milestone', {
              sessionId: sessionId ?? undefined,
              metadata: { kind: 'song_finished', song: activeSong.id },
            }).catch(() => {});
          }}
        />
      )}
      {phase === 'playing' && step && (
        <div key={step.activityId} className="animate-kid-view-enter relative flex w-full flex-col items-center">
          <ActivityStage
            step={step}
            onSubmit={handleSubmit}
            onComplete={handleComplete}
            onMood={setMood}
          />
          {/* Nova the peer pops in to comfort after mistakes */}
          {novaComfort && (
            <div className="animate-kid-pop-in absolute -top-2 right-2 flex items-center gap-2 rounded-kid-card border-4 border-white/70 bg-white/95 px-4 py-2 shadow-xl md:right-8">
              <HostCharacter characterId="nova" mood="oops" size={64} />
              <div className="flex flex-col items-start gap-1">
                <p className="max-w-[180px] text-base font-extrabold text-kid-ink-800">
                  Oops! Let&apos;s try again together!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('pop');
                    setShowTryAgain(true);
                  }}
                  className="rounded-full bg-kid-sun-400 px-4 py-1.5 text-sm font-black text-kid-ink-900 shadow transition-all hover:scale-105 active:scale-95"
                >
                  Watch me try!
                </button>
              </div>
            </div>
          )}
          {/* Nova's try-again encouragement video — big cinematic modal */}
          {showTryAgain && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/70 p-3 md:p-8">
              <div className="animate-kid-pop-in relative h-full max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-kid-card border-4 border-white/70 shadow-2xl">
                <VideoSpot
                  rounded={false}
                  src="/videos/nova-try-again.mp4"
                  poster="/videos/posters/nova-try-again.jpg"
                  label="Nova tries again"
                  characterId="nova"
                  voiceover="Watch me! Oops, my tower fell over! That's okay. Mistakes help our brains grow. Let me try again... Yay, I did it! You can try again too!"
                  caption="Oops! My tower fell. That's okay — mistakes help our brains grow. Trying again!"
                  onDone={() => setShowTryAgain(false)}
                  overlay={
                    <button
                      type="button"
                      onClick={() => setShowTryAgain(false)}
                      className="rounded-kid-card border-b-8 border-kid-sun-600 bg-kid-sun-400 px-10 py-4 text-2xl font-black text-kid-ink-900 shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                      Back to playing
                    </button>
                  }
                />
              </div>
            </div>
          )}
          {/* Mood mirror for small screens where the character hides */}
          <div className="mt-4 sm:hidden">
            <HostCharacter characterId={step.hostCharacter} mood={mood} size={84} />
          </div>
        </div>
      )}
      {phase === 'complete' && (
        <Complete
          child={child}
          stars={Math.min(3, Math.round((stars / Math.max(activeSteps.length, 1)) * 3))}
          points={points}
          newStickers={newStickers}
          questOutro={questOutro}
          onReplay={backToMap}
          onExit={() => setPhase('goodbye')}
        />
      )}
      {phase === 'complete' && newTrophies.length > 0 && (
        <TrophyCelebration trophies={newTrophies} onDone={() => setNewTrophies([])} />
      )}
      {phase === 'goodbye' && <Goodbye child={child} onDone={onExit} />}
      {phase === 'winddown' && (
        <TimeLimitWindDown childId={child.id} nickname={child.nickname} onDone={onExit} />
      )}
    </>
  );
}
