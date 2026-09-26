'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { adoptPet, feedPet, getPet, hatchPet, namePet, playWithPet } from '@/app/actions/pets';
import { getStarBalance } from '@/app/actions/rewards';
import {
  FEED_COST,
  PET_NAMES,
  PET_SPECIES,
  STAGE_THRESHOLDS,
  getSpecies,
  type Pet,
  type PetSpecies,
} from '@/lib/kid/pets';
import type { SessionChild } from '@/lib/kid/types';
import { playSfx, speakAs } from '@/lib/kid/audio';
import { PetArt, HappinessBar } from './pet-widget';

type Step = 'loading' | 'choose' | 'hatching' | 'naming' | 'home';

const STAGE_LABEL: Record<Pet['stage'], string> = {
  egg: 'Egg',
  hatchling: 'Hatchling',
  junior: 'Junior',
  grown: 'Grown-Up',
};

function nextStageInfo(pet: Pet): string {
  if (pet.stage === 'grown') return 'Fully grown! What an amazing friend.';
  const next = pet.stage === 'hatchling' ? 'junior' : 'grown';
  const remaining = STAGE_THRESHOLDS[next] - pet.feedCount;
  return `${remaining} more ${remaining === 1 ? 'meal' : 'meals'} until ${STAGE_LABEL[next]}`;
}

function Shell({ children, onExit }: { children: ReactNode; onExit: () => void }) {
  // NOTE: PetCompanion always renders inside GameOverlay, so this shell must
  // NOT use fixed positioning of its own — a second fixed overlay stacked on
  // top of GameOverlay caused the "blurred empty screen" bug. It is a plain
  // centered card that scrolls naturally with the overlay.
  return (
    <div className="flex min-h-dvh items-center justify-center p-3 md:p-8">
      <div className="animate-kid-pop-in flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-kid-card border-4 border-white/70 bg-gradient-to-b from-kid-sky-200 to-kid-sky-300 shadow-2xl">
        <div className="flex items-center justify-between bg-white px-6 py-4">
          <h2 className="text-2xl font-black text-kid-ink-900 md:text-3xl">Pet Companion</h2>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full bg-kid-ink-900/80 px-5 py-2.5 text-lg font-black text-white transition-transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * The pet companion: adopt an egg, tap to hatch, pick a preset name,
 * then feed and play with your pet as it grows from hatchling to grown-up.
 */
export default function PetCompanion({ child, onExit }: { child: SessionChild; onExit: () => void }) {
  const [step, setStep] = useState<Step>('loading');
  const [pet, setPet] = useState<Pet | null>(null);
  const [balance, setBalance] = useState(0);
  const [taps, setTaps] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reactKey, setReactKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const spokeHome = useRef(false);

  const load = useCallback(async () => {
    try {
      const [p, stars] = await Promise.all([getPet(child.id), getStarBalance(child.id)]);
      setPet(p);
      setBalance(stars.balance);
      if (!p) {
        setStep('choose');
        speakAs('curio', 'Pick an egg to adopt! A surprise friend is hiding inside.');
      } else if (p.stage === 'egg') {
        setStep('hatching');
        speakAs('curio', 'Tap the egg to help your new friend hatch!');
      } else if (!p.name) {
        setStep('naming');
        speakAs(getSpecies(p.species).hostCharacter, 'I hatched! What will you call me?');
      } else {
        setStep('home');
      }
    } catch {
      setError('Could not load your pet. Please try again.');
    }
  }, [child.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (step === 'home' && pet && !spokeHome.current) {
      spokeHome.current = true;
      const info = getSpecies(pet.species);
      speakAs(info.hostCharacter, `Hello, ${child.nickname}! ${pet.name ?? 'Your pet'} is so happy to see you!`);
    }
  }, [step, pet, child.nickname]);

  async function handleAdopt(species: PetSpecies) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const info = getSpecies(species);
      playSfx('pop');
      const p = await adoptPet(child.id, species);
      setPet(p);
      setTaps(0);
      setStep('hatching');
      speakAs(info.hostCharacter, `You picked me! Tap the egg three times to help me hatch!`);
    } catch {
      setError('Could not adopt the egg. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleTapEgg() {
    if (!pet || busy) return;
    const next = taps + 1;
    setTaps(next);
    if (next < 3) {
      playSfx('pop');
      if (next === 2) speakAs(getSpecies(pet.species).hostCharacter, 'Almost there! One more tap!');
      return;
    }
    setBusy(true);
    try {
      playSfx('fanfare');
      const p = await hatchPet(child.id);
      setPet(p);
      setTaps(0);
      setStep('naming');
      speakAs(getSpecies(p.species).hostCharacter, 'I hatched! I am your new friend! What will you call me?');
    } catch {
      setError('The egg would not hatch. Please try again.');
      setTaps(0);
    } finally {
      setBusy(false);
    }
  }

  async function handleName(name: string) {
    if (!pet || busy) return;
    setBusy(true);
    setError(null);
    try {
      playSfx('star');
      const p = await namePet(child.id, name);
      setPet(p);
      spokeHome.current = true; // name message plays; skip the home greeting
      setStep('home');
      speakAs(getSpecies(p.species).hostCharacter, `${name}! I love my name!`);
    } catch {
      setError('Could not set the name. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleFeed() {
    if (!pet || busy || balance < FEED_COST) return;
    setBusy(true);
    setError(null);
    try {
      const { pet: p, leveledUp } = await feedPet(child.id);
      setPet(p);
      setBalance((b) => b - FEED_COST);
      setReactKey((k) => k + 1);
      if (leveledUp) {
        playSfx('fanfare');
        speakAs(getSpecies(p.species).hostCharacter, `Yummy! Look at me, ${p.name}! I grew bigger!`);
      } else {
        playSfx('star');
        speakAs(getSpecies(p.species).hostCharacter, 'Yummy! Thank you for the meal!');
      }
    } catch {
      setError('Could not feed your pet. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePlay() {
    if (!pet || busy) return;
    setBusy(true);
    setError(null);
    try {
      const p = await playWithPet(child.id);
      setPet(p);
      setReactKey((k) => k + 1);
      playSfx('correct');
      speakAs(getSpecies(p.species).hostCharacter, 'Whee! That was so much fun!');
    } catch {
      setError('Could not play right now. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const petInfo = pet ? getSpecies(pet.species) : null;
  const canFeed = balance >= FEED_COST && !busy;

  return (
    <Shell onExit={onExit}>
      {error && (
        <div className="mb-4 rounded-kid-card border-2 border-kid-coral-500 bg-white/90 px-4 py-3 text-center">
          <p className="text-base font-bold text-kid-ink-900">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              void load();
            }}
            className="mt-3 rounded-full bg-kid-sky-500 px-6 py-2.5 text-lg font-black text-white transition-transform hover:scale-105 active:scale-95"
          >
            Try again
          </button>
        </div>
      )}

      {step === 'loading' && !error && (
        <p className="py-16 text-center text-xl font-black text-kid-ink-900">Loading your pet...</p>
      )}

      {step === 'choose' && (
        <div>
          <p className="mb-4 text-center text-lg font-bold text-kid-ink-900">
            Choose an egg! Each one hides a different surprise friend.
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {PET_SPECIES.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy}
                onClick={() => void handleAdopt(s.id)}
                className="flex flex-col items-center gap-2 rounded-kid-card border-4 border-white/70 bg-white/85 p-4 shadow-[0_8px_20px_rgba(23,50,79,0.18)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                aria-label={`Adopt a ${s.displayName} egg`}
              >
                <PetArt species={s.id} stage="egg" className="h-24 w-24 animate-kid-bob" />
                <span className="text-lg font-black text-kid-ink-900">{s.displayName}</span>
                <span className="text-sm font-bold text-kid-ink-700">{s.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'hatching' && pet && petInfo && (
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-center text-lg font-bold text-kid-ink-900">
            Tap the egg <span className="font-black">{3 - taps}</span> more{' '}
            {3 - taps === 1 ? 'time' : 'times'} to hatch your {petInfo.displayName}!
          </p>
          <button
            key={taps}
            type="button"
            disabled={busy}
            onClick={() => void handleTapEgg()}
            className="animate-kid-shake cursor-pointer transition-transform hover:scale-105 active:scale-90"
            aria-label="Tap the egg"
          >
            <PetArt species={pet.species} stage="egg" cracks={taps} className="h-56 w-56 md:h-64 md:w-64" />
          </button>
          <div className="flex gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-4 w-4 rounded-full ${i < taps ? 'bg-kid-sun-500' : 'bg-kid-ink-900/20'}`}
              />
            ))}
          </div>
        </div>
      )}

      {step === 'naming' && pet && petInfo && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div key={reactKey} className="animate-kid-bounce-soft">
            <PetArt species={pet.species} stage={pet.stage} className="h-44 w-44 md:h-52 md:w-52" />
          </div>
          <p className="text-center text-lg font-bold text-kid-ink-900">
            Pick a name for your {petInfo.displayName}!
          </p>
          <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
            {PET_NAMES.map((n) => (
              <button
                key={n}
                type="button"
                disabled={busy}
                onClick={() => void handleName(n)}
                className="rounded-kid-card border-4 border-white/70 bg-white/85 px-4 py-3 text-xl font-black text-kid-ink-900 shadow-[0_8px_20px_rgba(23,50,79,0.18)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'home' && pet && petInfo && (
        <div className="flex flex-col items-center gap-4">
          <div key={reactKey} className="animate-kid-bounce-soft">
            <PetArt species={pet.species} stage={pet.stage} className="h-52 w-52 md:h-64 md:w-64" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-kid-ink-900">{pet.name ?? petInfo.displayName}</p>
            <p className="text-base font-bold text-kid-ink-700">
              {petInfo.displayName} &middot; {STAGE_LABEL[pet.stage]}
            </p>
          </div>
          <div className="w-full max-w-md">
            <HappinessBar happiness={pet.happiness} />
            <p className="mt-1 text-center text-sm font-bold text-kid-ink-700">
              Happiness: {pet.happiness} &middot; {nextStageInfo(pet)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void handleFeed()}
              disabled={!canFeed}
              className="rounded-full bg-kid-sun-400 px-8 py-3.5 text-xl font-black text-kid-ink-900 shadow-[0_8px_20px_rgba(23,50,79,0.2)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              Feed &middot; {FEED_COST} stars
            </button>
            <button
              type="button"
              onClick={() => void handlePlay()}
              disabled={busy}
              className="rounded-full bg-kid-mint-400 px-8 py-3.5 text-xl font-black text-kid-ink-900 shadow-[0_8px_20px_rgba(23,50,79,0.2)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              Play
            </button>
          </div>
          <p className="text-sm font-bold text-kid-ink-700">You have {balance} stars.</p>
        </div>
      )}
    </Shell>
  );
}
