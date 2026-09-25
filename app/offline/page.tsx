'use client';

import KidShell from '@/components/kid/kid-shell';
import { speakAs } from '@/lib/kid/audio';

/** A sleepy cloud napping on a crescent moon — SVG only, no emoji. */
function SleepyCloud() {
  return (
    <svg viewBox="0 0 220 150" className="h-36 w-52 md:h-44 md:w-64" role="img" aria-label="A sleepy cloud napping on the moon">
      <path d="M170 30a44 44 0 1 0 26 79A52 52 0 0 1 170 30z" fill="#FFE66D" />
      <g fill="#FFFFFF" opacity="0.95">
        <ellipse cx="80" cy="105" rx="52" ry="28" />
        <ellipse cx="120" cy="90" rx="44" ry="34" />
        <ellipse cx="150" cy="108" rx="34" ry="22" />
      </g>
      <circle cx="105" cy="102" r="4" fill="#17324F" />
      <circle cx="128" cy="102" r="4" fill="#17324F" />
      <path d="M110 112q6 5 13 0" fill="none" stroke="#17324F" strokeWidth="3" strokeLinecap="round" />
      <g fill="#FFE66D" opacity="0.9">
        <path d="M40 30l1.5 3.5 3.8.5-2.7 2.6.6 3.8-3.2-1.7-3.2 1.7.6-3.8-2.7-2.6 3.8-.5z" />
        <path d="M190 105l1.2 2.8 3 .4-2.2 2.1.5 3-2.5-1.3-2.5 1.3.5-3-2.2-2.1 3-.4z" />
      </g>
    </svg>
  );
}

const ON_DEVICE = [
  {
    title: 'Creative Studio',
    detail: 'Draw, color, and save art — it all stays on this device.',
    note: 'Works fully offline',
    color: 'bg-kid-sun-300',
    art: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
        <path d="M10 38c8-1 24-9 28-26l-8-3c-9 12-16 20-24 22z" fill="#FF8C42" />
        <path d="M38 9l3-3 3 3-3 3z" fill="#17324F" />
      </svg>
    ),
  },
  {
    title: 'Story Cinema',
    detail: 'Episodes you already watched are ready to replay.',
    note: 'Replay downloaded tales',
    color: 'bg-kid-coral-300',
    art: (
      <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden>
        <rect x="6" y="10" width="36" height="24" rx="4" fill="#17324F" opacity="0.9" />
        <rect x="9" y="13" width="30" height="18" rx="2" fill="#FFD93C" opacity="0.95" />
        <path d="M21 17l8 4.5-8 4.5z" fill="#17324F" />
      </svg>
    ),
  },
];

export default function OfflinePage() {
  const tryAgain = () => {
    window.location.reload();
  };

  return (
    <KidShell>
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        <div className="animate-kid-float">
          <SleepyCloud />
        </div>
        <h1 className="animate-kid-rise mt-2 text-3xl font-black text-kid-ink-900 md:text-5xl">
          You&apos;re offline
        </h1>
        <p className="animate-kid-rise mt-2 max-w-md text-lg font-bold text-kid-ink-700" style={{ animationDelay: '0.1s' }}>
          The sky went quiet for a moment. Your stars are safe — they&apos;ll sync when you&apos;re back.
        </p>

        <div className="animate-kid-rise mt-6 w-full rounded-kid-card bg-white/90 p-5 text-left shadow-xl" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-black text-kid-ink-900">Try these while you wait</h2>
          <ul className="mt-3 space-y-3">
            {ON_DEVICE.map((item) => (
              <li key={item.title} className="flex items-center gap-3 rounded-kid-card bg-kid-sky-100 p-3">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${item.color}`}>
                  {item.art}
                </span>
                <span>
                  <span className="block text-lg font-black text-kid-ink-900">{item.title}</span>
                  <span className="block text-sm font-bold text-kid-ink-700">{item.detail}</span>
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-kid-sky-600">{item.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => {
            speakAs('curio', 'Trying to reconnect. Fingers crossed!');
            tryAgain();
          }}
          className="animate-kid-rise mt-6 rounded-full bg-kid-sky-400 px-10 py-4 text-xl font-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
          style={{ animationDelay: '0.3s' }}
        >
          Try again
        </button>
      </div>
    </KidShell>
  );
}
