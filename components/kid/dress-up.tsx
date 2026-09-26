'use client';

import { useCallback, useEffect, useState } from 'react';
import { AVATARS } from '@/components/avatars';
import { OutfitArt } from '@/lib/kid/outfit-art';
import { playSfx, speakAs } from '@/lib/kid/audio';
import type { SessionChild } from '@/lib/kid/types';
import type { OutfitState } from '@/lib/kid/outfits';
import {
  getOutfits,
  unlockOutfit,
  equipOutfit,
  unequipOutfit,
  type OutfitShopState,
} from '@/app/actions/outfits';

/** Avatar portrait with any number of outfit overlays stacked on top. */
export function AvatarWithOutfit({
  avatarId,
  outfitId,
  className,
}: {
  avatarId: string;
  outfitId?: string | string[] | null;
  className?: string;
}) {
  const Avatar = (AVATARS[avatarId] ?? AVATARS.curio).Component;
  const ids = Array.isArray(outfitId) ? outfitId : outfitId ? [outfitId] : [];
  return (
    <span className={`relative inline-block ${className ?? ''}`}>
      <Avatar className="h-full w-full" />
      {ids.map((id) => (
        <OutfitArt key={id} outfitId={id} className="absolute inset-0 h-full w-full" />
      ))}
    </span>
  );
}

/** Little star coin for prices and the balance. */
function StarCoin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12,2.5 l2.7,5.8 6.3,0.7 -4.7,4.3 1.3,6.2 -5.6,-3.1 -5.6,3.1 1.3,-6.2 -4.7,-4.3 6.3,-0.7 Z"
        fill="#FFC93C"
        stroke="#B57E12"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The Dress-Up Studio: kids preview outfits on their own avatar, buy
 * them with earned stars, and wear one accessory per slot.
 */
export default function DressUp({ child, onExit }: { child: SessionChild; onExit: () => void }) {
  const [shop, setShop] = useState<OutfitShopState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<OutfitState | null>(null);
  const [celebrating, setCelebrating] = useState<OutfitState | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setShop(await getOutfits(child.id));
    } catch {
      setError('Could not load the studio. Try again!');
    }
  }, [child.id]);

  useEffect(() => {
    void load();
    speakAs('curio', `Welcome to the Dress-Up Studio, ${child.nickname}! Spend your stars on fun new looks!`);
  }, [load, child.nickname]);

  const equippedIds = (shop?.outfits ?? []).filter((o) => o.equipped).map((o) => o.id);

  async function handleBuy(outfit: OutfitState) {
    setBusy(true);
    setError(null);
    try {
      const balance = await unlockOutfit(child.id, outfit.id);
      playSfx('fanfare');
      setCelebrating(outfit);
      setConfirming(null);
      setShop(await getOutfits(child.id));
      speakAs('curio', `Wow! The ${outfit.name}! ${outfit.blurb} You have ${balance} stars left.`);
    } catch (e) {
      playSfx('wrong');
      setError(e instanceof Error ? e.message : 'Could not buy this outfit.');
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleWear(outfit: OutfitState) {
    setBusy(true);
    try {
      await equipOutfit(child.id, outfit.id);
      playSfx('pop');
      setShop(await getOutfits(child.id));
    } catch {
      setError('Could not wear this outfit.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(outfit: OutfitState) {
    setBusy(true);
    try {
      await unequipOutfit(child.id, outfit.id);
      playSfx('click');
      setShop(await getOutfits(child.id));
    } catch {
      setError('Could not remove this outfit.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-kid-ink-900/75 p-3 md:p-8">
      <div className="animate-kid-pop-in flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-kid-card border-4 border-white/70 bg-gradient-to-b from-kid-grape-400 to-kid-sky-300 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between gap-3 bg-white px-6 py-4">
          <div>
            <h2 className="text-2xl font-black text-kid-ink-900 md:text-3xl">Dress-Up Studio</h2>
            <p className="text-base font-bold text-kid-ink-700">
              Try looks on {child.nickname}, then spend stars to keep them!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-kid-pill bg-kid-sun-400 px-4 py-2 text-lg font-black text-kid-ink-900 shadow">
              <StarCoin className="h-6 w-6" />
              {shop?.balance ?? 0}
            </span>
            <button
              type="button"
              onClick={onExit}
              className="rounded-full bg-kid-ink-900/80 px-5 py-2.5 text-lg font-black text-white transition-transform hover:scale-105 active:scale-95"
            >
              Done
            </button>
          </div>
        </div>

        {error && (
          <p className="bg-kid-coral-500 px-6 py-2 text-center text-base font-black text-white">{error}</p>
        )}

        <div className="grid flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[280px_1fr] md:p-6">
          {/* preview */}
          <div className="flex flex-col items-center justify-center gap-3 rounded-kid-card border-4 border-white/60 bg-white/50 p-6">
            <div className="animate-kid-bob">
              <AvatarWithOutfit avatarId={child.avatarId} outfitId={equippedIds} className="h-44 w-44 md:h-52 md:w-52" />
            </div>
            <p className="text-center text-base font-black text-kid-ink-900">
              {equippedIds.length === 0
                ? 'Pick a look below!'
                : `Wearing ${equippedIds.length} ${equippedIds.length === 1 ? 'treasure' : 'treasures'}!`}
            </p>
          </div>

          {/* outfit grid */}
          <div className="grid grid-cols-2 content-start gap-3 sm:grid-cols-3">
            {!shop && !error && (
              <p className="col-span-full py-10 text-center text-lg font-black text-white">
                Loading the studio…
              </p>
            )}
            {!shop && error && (
              <div className="col-span-full flex flex-col items-center gap-3 py-10">
                <button
                  type="button"
                  onClick={() => { setError(null); void load(); }}
                  className="rounded-full bg-white/90 px-8 py-3 text-lg font-black text-kid-ink-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Try again
                </button>
              </div>
            )}
            {shop?.outfits.map((outfit) => {
              const affordable = (shop.balance ?? 0) >= outfit.cost;
              return (
                <div
                  key={outfit.id}
                  className="flex flex-col items-center gap-1 rounded-kid-card border-4 border-white/60 bg-white/80 p-2 shadow transition-transform hover:scale-[1.03]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      speakAs('curio', `${outfit.name}! ${outfit.blurb}`);
                    }}
                    className="relative h-24 w-24"
                    aria-label={`${outfit.name}. ${outfit.blurb}`}
                  >
                    <AvatarWithOutfit
                      avatarId={child.avatarId}
                      outfitId={outfit.equipped ? equippedIds : [outfit.id]}
                      className="h-24 w-24"
                    />
                    {!outfit.unlocked && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full bg-kid-ink-900/60 p-2">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" aria-hidden="true">
                            <rect x="4" y="10" width="16" height="11" rx="2" />
                            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                          </svg>
                        </span>
                      </span>
                    )}
                  </button>
                  <span className="text-sm font-black text-kid-ink-900">{outfit.name}</span>
                  {outfit.equipped ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleRemove(outfit)}
                      className="rounded-kid-pill bg-kid-mint-500 px-4 py-1.5 text-sm font-black text-white shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                    >
                      Wearing — tap to take off
                    </button>
                  ) : outfit.unlocked ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleWear(outfit)}
                      className="rounded-kid-pill bg-kid-sky-600 px-4 py-1.5 text-sm font-black text-white shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                    >
                      Wear
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || !affordable}
                      onClick={() => setConfirming(outfit)}
                      className="flex items-center gap-1 rounded-kid-pill bg-kid-sun-400 px-4 py-1.5 text-sm font-black text-kid-ink-900 shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                      aria-label={affordable ? `Buy ${outfit.name} for ${outfit.cost} stars` : `Need ${outfit.cost - (shop.balance ?? 0)} more stars for ${outfit.name}`}
                    >
                      <StarCoin className="h-4 w-4" />
                      {affordable ? outfit.cost : `${outfit.cost - (shop.balance ?? 0)} more`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* buy confirmation */}
      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-kid-ink-900/70 p-4">
          <div className="animate-kid-pop-in w-full max-w-sm rounded-kid-card border-4 border-white/70 bg-kid-cream p-6 text-center shadow-2xl">
            <AvatarWithOutfit avatarId={child.avatarId} outfitId={[confirming.id]} className="mx-auto h-32 w-32" />
            <h3 className="mt-2 text-xl font-black text-kid-ink-900">Get the {confirming.name}?</h3>
            <p className="mt-1 text-base font-bold text-kid-ink-700">{confirming.blurb}</p>
            <p className="mt-2 flex items-center justify-center gap-1 text-lg font-black text-kid-ink-900">
              <StarCoin className="h-5 w-5" /> {confirming.cost} stars
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(null)}
                className="rounded-kid-pill bg-kid-ink-900/20 px-5 py-2.5 text-base font-black text-kid-ink-900 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                Not now
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleBuy(confirming)}
                className="rounded-kid-pill bg-kid-sun-400 px-5 py-2.5 text-base font-black text-kid-ink-900 shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                Yes, get it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* unlock celebration */}
      {celebrating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-kid-ink-900/70 p-4">
          <div className="animate-kid-pop-in w-full max-w-sm rounded-kid-card border-4 border-white/70 bg-gradient-to-b from-kid-sun-300 to-kid-berry-400 p-6 text-center shadow-2xl">
            <div className="animate-kid-sparkle mx-auto w-fit">
              <AvatarWithOutfit avatarId={child.avatarId} outfitId={[celebrating.id]} className="h-40 w-40" />
            </div>
            <h3 className="mt-2 text-2xl font-black text-kid-ink-900">You got the {celebrating.name}!</h3>
            <p className="mt-1 text-base font-bold text-kid-ink-700">{celebrating.blurb}</p>
            <button
              type="button"
              onClick={() => {
                playSfx('pop');
                setCelebrating(null);
              }}
              className="mt-4 rounded-kid-pill bg-kid-ink-900 px-6 py-2.5 text-base font-black text-white shadow transition-transform hover:scale-105 active:scale-95"
            >
              Keep looking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
