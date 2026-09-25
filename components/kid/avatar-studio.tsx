'use client';

import { useCallback, useEffect, useState } from 'react';
import { playSfx, speakAs, stopSpeaking } from '@/lib/kid/audio';
import { awardStickers } from '@/app/actions/rewards';
import { checkTrophies } from '@/app/actions/trophies';
import { logLearningEvent } from '@/app/actions/learning';
import {
  ACCESSORIES,
  DEFAULT_AVATAR,
  EYE_STYLES,
  HAIR_COLORS,
  HAIR_STYLES,
  MOUTH_STYLES,
  SKIN_TONES,
  loadCustomAvatar,
  randomDesign,
  saveCustomAvatar,
  type AccessoryId,
  type AvatarDesign,
  type EyeStyle,
  type HairColor,
  type HairStyle,
  type MouthStyle,
  type SkinTone,
} from '@/lib/kid/avatar-studio';
import CustomAvatar from '@/components/avatars-custom';
import KidShell from './kid-shell';

/** Avatar Studio — kids design their own avatar, then wear it everywhere. */
export default function AvatarStudio({
  childId,
  onExit,
  onSaved,
}: {
  childId: string;
  onExit: () => void;
  onSaved?: () => void;
}) {
  const [design, setDesign] = useState<AvatarDesign>(() => loadCustomAvatar(childId) ?? DEFAULT_AVATAR);
  const [tab, setTab] = useState<'skin' | 'eyes' | 'mouth' | 'hair' | 'extras'>('skin');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    speakAs('curio', 'Welcome to the Avatar Studio! Design a face that looks just like you.');
    return () => stopSpeaking();
  }, []);

  const set = useCallback(<K extends keyof AvatarDesign>(key: K, value: AvatarDesign[K]) => {
    playSfx('pop');
    setDesign((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }, []);

  const surprise = useCallback(() => {
    playSfx('levelup');
    speakAs('curio', 'Ooh, surprise me! What a fun look!');
    setDesign(randomDesign());
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      saveCustomAvatar(childId, design);
      playSfx('fanfare');
      speakAs('curio', 'Wow! That looks amazing! This is your new look!');
      await awardStickers(childId, ['avatar-artist']);
      // 'avatar_done' trophy def lands in integration; the cast keeps tsc green now.
      checkTrophies(childId, 'avatar_done').catch(() => {});
      await logLearningEvent(childId, 'milestone', { metadata: { kind: 'avatar_studio_saved' } }).catch(
        () => {}
      );
      setSaved(true);
      onSaved?.();
    } catch {
      /* storage failure — the kid can still keep designing */
    } finally {
      setSaving(false);
    }
  }, [childId, design, onSaved, saving]);

  const tabs = [
    { id: 'skin', label: 'Skin' },
    { id: 'eyes', label: 'Eyes' },
    { id: 'mouth', label: 'Mouth' },
    { id: 'hair', label: 'Hair' },
    { id: 'extras', label: 'Extras' },
  ] as const;

  return (
    <KidShell doneCount={0} totalSteps={0} points={0} onExit={onExit}>
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-6">
        <h1 className="text-center text-3xl font-black text-kid-ink-900 md:text-4xl">Avatar Studio</h1>
        <p className="mt-1 text-center text-lg font-bold text-kid-ink-700">Design a face that is all you!</p>

        <div className="mt-6 grid w-full gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Live preview */}
          <div className="flex flex-col items-center gap-4 rounded-kid-card bg-white/80 p-6 shadow-lg">
            <div className="rounded-full bg-kid-sky-100 p-4">
              <CustomAvatar design={design} className="h-44 w-44 md:h-56 md:w-56" />
            </div>
            <button
              type="button"
              onClick={surprise}
              className="rounded-full border-b-4 border-kid-grape-700 bg-kid-grape-400 px-6 py-3 text-lg font-black text-white shadow transition-transform hover:scale-105 active:scale-95"
            >
              Surprise me!
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full border-b-4 border-kid-mint-700 bg-kid-mint-500 px-10 py-4 text-xl font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
            >
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save my look!'}
            </button>
            {saved && (
              <p className="text-center font-black text-kid-mint-700" role="status">
                Looking great! Your new face is ready.
              </p>
            )}
          </div>

          {/* Customizer tabs */}
          <div className="rounded-kid-card bg-white/80 p-4 shadow-lg md:p-6">
            <div role="tablist" aria-label="Avatar parts" className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => {
                    playSfx('pop');
                    setTab(t.id);
                  }}
                  className={`min-h-[52px] rounded-full px-5 py-2 text-lg font-black transition-transform hover:scale-105 active:scale-95 ${
                    tab === t.id
                      ? 'bg-kid-sky-500 text-white shadow'
                      : 'bg-kid-sky-100 text-kid-ink-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-4 min-h-[220px]" role="tabpanel">
              {tab === 'skin' && (
                <div className="grid grid-cols-4 gap-3" role="group" aria-label="Skin tone">
                  {SKIN_TONES.map((c: SkinTone) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Skin tone ${c}`}
                      aria-pressed={design.skin === c}
                      onClick={() => set('skin', c)}
                      className={`h-16 w-16 rounded-full border-4 transition-transform hover:scale-110 active:scale-95 ${
                        design.skin === c ? 'border-kid-sky-600 ring-4 ring-kid-sky-200' : 'border-white'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}

              {tab === 'eyes' && (
                <div className="grid grid-cols-3 gap-3" role="group" aria-label="Eye style">
                  {EYE_STYLES.map((e: EyeStyle) => (
                    <button
                      key={e}
                      type="button"
                      aria-pressed={design.eyes === e}
                      onClick={() => set('eyes', e)}
                      className={`min-h-[72px] rounded-kid-card px-3 py-3 text-lg font-black capitalize transition-transform hover:scale-105 active:scale-95 ${
                        design.eyes === e ? 'bg-kid-sky-500 text-white shadow' : 'bg-kid-sky-100 text-kid-ink-800'
                      }`}
                    >
                      {e.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}

              {tab === 'mouth' && (
                <div className="grid grid-cols-3 gap-3" role="group" aria-label="Mouth style">
                  {MOUTH_STYLES.map((m: MouthStyle) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={design.mouth === m}
                      onClick={() => set('mouth', m)}
                      className={`min-h-[72px] rounded-kid-card px-3 py-3 text-lg font-black capitalize transition-transform hover:scale-105 active:scale-95 ${
                        design.mouth === m ? 'bg-kid-sky-500 text-white shadow' : 'bg-kid-sky-100 text-kid-ink-800'
                      }`}
                    >
                      {m.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}

              {tab === 'hair' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3" role="group" aria-label="Hair style">
                    {HAIR_STYLES.map((h: HairStyle) => (
                      <button
                        key={h}
                        type="button"
                        aria-pressed={design.hair.style === h}
                        onClick={() => set('hair', { ...design.hair, style: h })}
                        className={`min-h-[64px] rounded-kid-card px-3 py-2 text-base font-black capitalize transition-transform hover:scale-105 active:scale-95 ${
                          design.hair.style === h
                            ? 'bg-kid-sky-500 text-white shadow'
                            : 'bg-kid-sky-100 text-kid-ink-800'
                        }`}
                      >
                        {h === 'none' ? 'Bald' : h}
                      </button>
                    ))}
                  </div>
                  {design.hair.style !== 'none' && (
                    <div className="grid grid-cols-6 gap-2" role="group" aria-label="Hair color">
                      {HAIR_COLORS.map((c: HairColor) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`Hair color ${c}`}
                          aria-pressed={design.hair.color === c}
                          onClick={() => set('hair', { ...design.hair, color: c })}
                          className={`h-12 w-12 rounded-full border-4 transition-transform hover:scale-110 active:scale-95 ${
                            design.hair.color === c ? 'border-kid-sky-600 ring-4 ring-kid-sky-200' : 'border-white'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'extras' && (
                <div className="grid grid-cols-3 gap-3" role="group" aria-label="Accessory">
                  {ACCESSORIES.map((a: AccessoryId) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={design.accessory === a}
                      onClick={() => set('accessory', a)}
                      className={`min-h-[72px] rounded-kid-card px-3 py-3 text-lg font-black capitalize transition-transform hover:scale-105 active:scale-95 ${
                        design.accessory === a
                          ? 'bg-kid-sky-500 text-white shadow'
                          : 'bg-kid-sky-100 text-kid-ink-800'
                      }`}
                    >
                      {a === 'none' ? 'No extra' : a.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </KidShell>
  );
}
