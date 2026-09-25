'use client';

export interface CertificateStats {
  stars: number;
  trophies: number;
  activities?: number;
}

/** Gold seal with a star — the Curio seal of approval. Original art, no emoji. */
function SealArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 md:h-28 md:w-28" role="img" aria-label="Curio seal of approval">
      <circle cx="60" cy="60" r="56" fill="#FFD93C" />
      <circle cx="60" cy="60" r="56" fill="none" stroke="#E09E00" strokeWidth="4" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#E09E00" strokeWidth="2" strokeDasharray="6 5" />
      <path
        d="M60 32 L67 51 L87 51 L71 62 L77 82 L60 70 L43 82 L49 62 L33 51 L53 51 Z"
        fill="#fff"
        stroke="#E09E00"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <text x="60" y="104" textAnchor="middle" fontSize="11" fontWeight="900" fill="#8A5B00">
        SKY
      </text>
    </svg>
  );
}

/**
 * Printable "Certificate of Achievement". The print stylesheet hides the rest
 * of the page (visibility pattern scoped by a body class added at print
 * time), so only the certificate reaches the printer.
 */
export default function Certificate({
  nickname,
  stats,
}: {
  nickname: string;
  stats: CertificateStats;
}) {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const print = () => {
    document.body.classList.add('sky-print-cert');
    const done = () => document.body.classList.remove('sky-print-cert');
    window.addEventListener('afterprint', done, { once: true });
    window.print();
    // Fallback in case afterprint never fires.
    window.setTimeout(done, 1500);
  };

  const statItems = [
    { label: 'Stars earned', value: stats.stars },
    { label: 'Trophies', value: stats.trophies },
    ...(stats.activities !== undefined ? [{ label: 'Activities', value: stats.activities }] : []),
  ];

  return (
    <div>
      <style>{`
        @media print {
          body.sky-print-cert * { visibility: hidden; }
          body.sky-print-cert .sky-cert-root,
          body.sky-print-cert .sky-cert-root * { visibility: visible; }
          body.sky-print-cert .sky-cert-root {
            position: fixed;
            inset: 0;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          body.sky-print-cert .no-print { display: none !important; }
        }
      `}</style>

      <div className="sky-cert-root rounded-2xl border-8 border-double border-parent-sun-500 bg-white p-8 text-center shadow-[0_4px_16px_rgba(18,60,96,0.06)] md:p-12">
        <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-parent-sky-700">
          Sky Learning
        </p>
        <h2 className="font-display mt-2 text-4xl font-black text-parent-ink-900 md:text-5xl">
          Certificate of Achievement
        </h2>
        <p className="mt-4 text-parent-ink-600">This certificate is proudly presented to</p>
        <p className="font-display mt-2 text-3xl font-black text-parent-sky-900 md:text-4xl">{nickname}</p>
        <p className="mx-auto mt-3 max-w-md text-parent-ink-600">
          for wonderful learning, curiosity, and persistence in the sky.
        </p>

        <div className="mx-auto mt-6 flex max-w-md items-stretch justify-center gap-6">
          {statItems.map((s) => (
            <div key={s.label} className="flex-1">
              <p className="text-3xl font-black text-parent-sky-900">{s.value}</p>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-parent-ink-600">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-sm font-bold text-parent-ink-900">{date}</p>
            <p className="text-xs text-parent-ink-600">Date awarded</p>
          </div>
          <SealArt />
          <div className="text-right">
            <p className="font-black italic text-parent-ink-900">Curio</p>
            <p className="text-xs text-parent-ink-600">Sky guide</p>
          </div>
        </div>
      </div>

      <div className="no-print mt-4 text-center">
        <button
          type="button"
          onClick={print}
          className="btn-kid btn-kid-sky btn-kid-sm text-base"
        >
          Print certificate
        </button>
      </div>
    </div>
  );
}
