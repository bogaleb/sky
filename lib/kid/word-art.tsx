'use client';

/**
 * Tiny inline-SVG pictograms for Word Builder spelling words.
 * Original simple art in the Sky cute style (faces on everything).
 * No emoji, no icon fonts. Falls back to a letter block.
 */

export type Pictogram = (props: { className?: string }) => React.JSX.Element;

function Eyes({ y = 30, spread = 7 }: { y?: number; spread?: number }) {
  return (
    <g>
      <circle cx={32 - spread} cy={y} r="3.2" fill="#17324F" />
      <circle cx={32 + spread} cy={y} r="3.2" fill="#17324F" />
      <circle cx={32 - spread + 1.1} cy={y - 1.1} r="1.1" fill="#fff" />
      <circle cx={32 + spread + 1.1} cy={y - 1.1} r="1.1" fill="#fff" />
    </g>
  );
}

function Smile({ y = 40 }: { y?: number }) {
  return (
    <path d={`M26 ${y} Q32 ${y + 5.5} 38 ${y}`} stroke="#17324F" strokeWidth="2.6" fill="none" strokeLinecap="round" />
  );
}

function Svg({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={label}>
      {children}
    </svg>
  );
}

function CatArt({ className }: { className?: string }) {
  return (
    <Svg label="cat" className={className}>
      <path d="M15 28 L10 8 L28 17 Z" fill="#FF9A3D" stroke="#D97A1E" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M49 28 L54 8 L36 17 Z" fill="#FF9A3D" stroke="#D97A1E" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="32" cy="37" r="18" fill="#FF9A3D" stroke="#D97A1E" strokeWidth="2.5" />
      <path d="M9 38 h9 M9 44 h9 M46 38 h9 M46 44 h9" stroke="#D97A1E" strokeWidth="2" strokeLinecap="round" />
      <Eyes y={33} />
      <Smile y={43} />
    </Svg>
  );
}

function DogArt({ className }: { className?: string }) {
  return (
    <Svg label="dog" className={className}>
      <ellipse cx="13" cy="34" rx="7" ry="13" fill="#8A5A2B" transform="rotate(12 13 34)" />
      <ellipse cx="51" cy="34" rx="7" ry="13" fill="#8A5A2B" transform="rotate(-12 51 34)" />
      <circle cx="32" cy="36" r="18" fill="#C98A4B" stroke="#8A5A2B" strokeWidth="2.5" />
      <ellipse cx="32" cy="43" rx="8" ry="6" fill="#E8C39A" />
      <circle cx="32" cy="40" r="3" fill="#17324F" />
      <Eyes y={31} />
    </Svg>
  );
}

function SunArt({ className }: { className?: string }) {
  return (
    <Svg label="sun" className={className}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={32 + Math.cos(a) * 19}
            y1={32 + Math.sin(a) * 19}
            x2={32 + Math.cos(a) * 26}
            y2={32 + Math.sin(a) * 26}
            stroke="#F5A623"
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx="32" cy="32" r="15" fill="#FFD93C" stroke="#F5A623" strokeWidth="2.5" />
      <Eyes y={30} spread={6} />
      <Smile y={37} />
    </Svg>
  );
}

function PigArt({ className }: { className?: string }) {
  return (
    <Svg label="pig" className={className}>
      <path d="M16 24 L12 8 L28 16 Z" fill="#FF9DAD" stroke="#D96C7E" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M48 24 L52 8 L36 16 Z" fill="#FF9DAD" stroke="#D96C7E" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="32" cy="36" r="18" fill="#FF9DAD" stroke="#D96C7E" strokeWidth="2.5" />
      <ellipse cx="32" cy="43" rx="8" ry="6.5" fill="#F2728C" />
      <circle cx="29" cy="43" r="1.6" fill="#8A3A48" />
      <circle cx="35" cy="43" r="1.6" fill="#8A3A48" />
      <Eyes y={30} />
    </Svg>
  );
}

function HatArt({ className }: { className?: string }) {
  return (
    <Svg label="party hat" className={className}>
      <path d="M32 6 L48 50 L16 50 Z" fill="#9B7EDE" stroke="#6C4FD8" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M26 24 L38 24 M22 36 L42 36" stroke="#FFD93C" strokeWidth="4" />
      <circle cx="32" cy="8" r="6" fill="#FF7BAC" stroke="#D6457E" strokeWidth="2" />
      <path d="M16 50 h32" stroke="#6C4FD8" strokeWidth="4" strokeLinecap="round" />
    </Svg>
  );
}

function BoxArt({ className }: { className?: string }) {
  return (
    <Svg label="box" className={className}>
      <rect x="12" y="22" width="40" height="32" rx="4" fill="#D9A05B" stroke="#A86F2E" strokeWidth="2.5" />
      <rect x="29" y="22" width="6" height="32" fill="#B97A2E" opacity="0.7" />
      <path d="M12 30 h40" stroke="#A86F2E" strokeWidth="2.5" />
      <path d="M12 22 L24 12 h16 L52 22" fill="#E8B96E" stroke="#A86F2E" strokeWidth="2.5" strokeLinejoin="round" />
    </Svg>
  );
}

function CupArt({ className }: { className?: string }) {
  return (
    <Svg label="cup" className={className}>
      <path d="M20 18 h24 l-3 30 a4 4 0 0 1 -4 4 h-10 a4 4 0 0 1 -4 -4 z" fill="#5BC8E8" stroke="#2E9BC6" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M44 24 q10 2 8 12 q-2 8 -11 7" fill="none" stroke="#2E9BC6" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 18 h24" stroke="#2E9BC6" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

function BusArt({ className }: { className?: string }) {
  return (
    <Svg label="bus" className={className}>
      <rect x="8" y="16" width="48" height="26" rx="8" fill="#FF6B6B" stroke="#D64545" strokeWidth="2.5" />
      <rect x="14" y="21" width="12" height="9" rx="2" fill="#BFE3F0" />
      <rect x="30" y="21" width="12" height="9" rx="2" fill="#BFE3F0" />
      <rect x="46" y="21" width="6" height="9" rx="2" fill="#BFE3F0" />
      <circle cx="20" cy="46" r="6" fill="#33415C" />
      <circle cx="44" cy="46" r="6" fill="#33415C" />
      <circle cx="20" cy="46" r="2.4" fill="#BFC9D9" />
      <circle cx="44" cy="46" r="2.4" fill="#BFC9D9" />
    </Svg>
  );
}

function HenArt({ className }: { className?: string }) {
  return (
    <Svg label="hen" className={className}>
      <circle cx="26" cy="14" r="4" fill="#E84A5F" />
      <circle cx="32" cy="12" r="4.6" fill="#E84A5F" />
      <circle cx="38" cy="14" r="4" fill="#E84A5F" />
      <ellipse cx="32" cy="38" rx="17" ry="15" fill="#FFF6EA" stroke="#D9C4A5" strokeWidth="2.5" />
      <path d="M44 30 l10 4 -10 4 z" fill="#F5A623" stroke="#D98A00" strokeWidth="2" strokeLinejoin="round" />
      <Eyes y={32} spread={6} />
      <Smile y={40} />
      <path d="M22 40 q-6 2 -8 8" fill="none" stroke="#D9C4A5" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

function PanArt({ className }: { className?: string }) {
  return (
    <Svg label="pan" className={className}>
      <rect x="38" y="28" width="20" height="7" rx="3.5" fill="#8A5A2B" transform="rotate(-18 38 28)" />
      <circle cx="24" cy="36" r="17" fill="#4A4A58" stroke="#2E2E38" strokeWidth="2.5" />
      <circle cx="24" cy="36" r="11" fill="#6E6E7E" />
      <ellipse cx="20" cy="32" rx="4" ry="2.6" fill="#9A9AA8" opacity="0.8" transform="rotate(-24 20 32)" />
    </Svg>
  );
}

function MapArt({ className }: { className?: string }) {
  return (
    <Svg label="map" className={className}>
      <rect x="10" y="14" width="44" height="36" rx="4" fill="#FFF3D6" stroke="#D9B86C" strokeWidth="2.5" />
      <path d="M25 14 v36 M39 14 v36" stroke="#D9B86C" strokeWidth="2" />
      <path d="M16 40 q8 -6 14 0 t14 0" fill="none" stroke="#5BC8E8" strokeWidth="2.5" strokeDasharray="4 3" />
      <path d="M44 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#E84A5F" />
    </Svg>
  );
}

function BedArt({ className }: { className?: string }) {
  return (
    <Svg label="bed" className={className}>
      <rect x="8" y="14" width="8" height="34" rx="3" fill="#8A5A2B" />
      <rect x="48" y="26" width="8" height="22" rx="3" fill="#8A5A2B" />
      <rect x="12" y="30" width="40" height="12" rx="4" fill="#FFF6EA" stroke="#D9C4A5" strokeWidth="2.5" />
      <rect x="14" y="28" width="12" height="8" rx="4" fill="#BFE3F0" stroke="#7FB6CC" strokeWidth="2" />
      <rect x="12" y="36" width="40" height="10" rx="4" fill="#5BC8E8" opacity="0.85" />
    </Svg>
  );
}

function FoxArt({ className }: { className?: string }) {
  return (
    <Svg label="fox" className={className}>
      <path d="M14 30 L10 8 L30 18 Z" fill="#E8792E" stroke="#B95A1A" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 30 L54 8 L34 18 Z" fill="#E8792E" stroke="#B95A1A" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 18 C20 18 12 28 14 40 C16 50 24 54 32 54 C40 54 48 50 50 40 C52 28 44 18 32 18 Z" fill="#F58A3C" stroke="#B95A1A" strokeWidth="2.5" />
      <path d="M22 44 q10 8 20 0 q-4 8 -10 8 q-6 0 -10 -8" fill="#FFF6EA" />
      <circle cx="32" cy="42" r="3.4" fill="#17324F" />
      <Eyes y={32} />
    </Svg>
  );
}

function JarArt({ className }: { className?: string }) {
  return (
    <Svg label="jar" className={className}>
      <rect x="20" y="8" width="24" height="9" rx="3" fill="#8A5A2B" stroke="#6E4520" strokeWidth="2" />
      <rect x="16" y="17" width="32" height="36" rx="10" fill="#BFE3F0" opacity="0.75" stroke="#7FB6CC" strokeWidth="2.5" />
      <circle cx="26" cy="34" r="5" fill="#D9A05B" stroke="#A86F2E" strokeWidth="2" />
      <circle cx="37" cy="42" r="5" fill="#D9A05B" stroke="#A86F2E" strokeWidth="2" />
      <circle cx="30" cy="46" r="4" fill="#E8B96E" />
    </Svg>
  );
}

function FrogArt({ className }: { className?: string }) {
  return (
    <Svg label="frog" className={className}>
      <circle cx="22" cy="18" r="8" fill="#7ED6A5" stroke="#3FA97C" strokeWidth="2.5" />
      <circle cx="42" cy="18" r="8" fill="#7ED6A5" stroke="#3FA97C" strokeWidth="2.5" />
      <circle cx="22" cy="18" r="3" fill="#17324F" />
      <circle cx="42" cy="18" r="3" fill="#17324F" />
      <ellipse cx="32" cy="40" rx="19" ry="15" fill="#7ED6A5" stroke="#3FA97C" strokeWidth="2.5" />
      <path d="M24 42 Q32 48 40 42" stroke="#17324F" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="36" r="3.4" fill="#FF9DAD" opacity="0.7" />
      <circle cx="40" cy="36" r="3.4" fill="#FF9DAD" opacity="0.7" />
    </Svg>
  );
}

function CrabArt({ className }: { className?: string }) {
  return (
    <Svg label="crab" className={className}>
      <circle cx="12" cy="20" r="8" fill="#E84A5F" stroke="#B93245" strokeWidth="2.5" />
      <circle cx="52" cy="20" r="8" fill="#E84A5F" stroke="#B93245" strokeWidth="2.5" />
      <path d="M14 26 L22 34 M50 26 L42 34" stroke="#B93245" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="32" cy="40" rx="17" ry="12" fill="#E84A5F" stroke="#B93245" strokeWidth="2.5" />
      <path d="M18 48 l-4 8 M26 49 l-2 8 M38 49 l2 8 M46 48 l4 8" stroke="#B93245" strokeWidth="3" strokeLinecap="round" />
      <Eyes y={36} spread={6} />
      <Smile y={44} />
    </Svg>
  );
}

function FishArt({ className }: { className?: string }) {
  return (
    <Svg label="fish" className={className}>
      <path d="M44 32 L58 20 L56 32 L58 44 Z" fill="#4CC9F0" stroke="#1D8FBF" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="28" cy="32" rx="19" ry="13" fill="#4CC9F0" stroke="#1D8FBF" strokeWidth="2.5" />
      <path d="M30 32 L42 32 M30 26 L40 26 M30 38 L40 38" stroke="#8FE3FF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="28" r="3.2" fill="#17324F" />
      <circle cx="20" cy="27" r="1.1" fill="#fff" />
      <path d="M13 33 Q18 37 24 33" stroke="#1D8FBF" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function ShipArt({ className }: { className?: string }) {
  return (
    <Svg label="ship" className={className}>
      <path d="M12 44 h40 l-7 12 h-26 z" fill="#8A5A2B" stroke="#6E4520" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="32" y1="44" x2="32" y2="14" stroke="#6E4520" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M32 14 L50 40 L32 40 Z" fill="#FFF6EA" stroke="#D9C4A5" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 44 q5 4 10 0 t10 0 t10 0" fill="none" stroke="#5BC8E8" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function DuckArt({ className }: { className?: string }) {
  return (
    <Svg label="duck" className={className}>
      <ellipse cx="30" cy="42" rx="17" ry="12" fill="#FFD93C" stroke="#E0A800" strokeWidth="2.5" />
      <circle cx="42" cy="24" r="11" fill="#FFD93C" stroke="#E0A800" strokeWidth="2.5" />
      <path d="M51 22 l8 3 -8 4 z" fill="#F58A3C" stroke="#D96C1E" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="44" cy="21" r="2.8" fill="#17324F" />
      <path d="M18 40 q-8 -2 -10 -10 q8 2 12 6" fill="#F5B93C" stroke="#E0A800" strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function SockArt({ className }: { className?: string }) {
  return (
    <Svg label="sock" className={className}>
      <path d="M22 8 h18 v22 q0 8 8 10 q6 2 4 8 q-2 6 -10 5 q-14 -2 -20 -12 q-4 -7 -4 -14 z" fill="#FF7BAC" stroke="#D6457E" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="22" y="8" width="18" height="9" fill="#FFF6EA" stroke="#D9C4A5" strokeWidth="2" />
      <path d="M24 44 q8 6 18 4" stroke="#D6457E" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function WhaleArt({ className }: { className?: string }) {
  return (
    <Svg label="whale" className={className}>
      <path d="M46 30 q10 -8 12 -16 q-8 2 -12 8 q2 -8 -2 -12 q-4 6 -4 12" fill="#5B8CC0" stroke="#3A6A9E" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="28" cy="38" rx="20" ry="13" fill="#5B8CC0" stroke="#3A6A9E" strokeWidth="2.5" />
      <path d="M14 38 q10 8 22 8" fill="none" stroke="#BFD9F2" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="34" r="3" fill="#17324F" />
      <circle cx="38" cy="18" r="2.4" fill="#BFD9F2" />
      <circle cx="42" cy="12" r="1.8" fill="#BFD9F2" />
    </Svg>
  );
}

function NestArt({ className }: { className?: string }) {
  return (
    <Svg label="nest" className={className}>
      <ellipse cx="24" cy="34" rx="6" ry="7.5" fill="#BFE3F0" stroke="#7FB6CC" strokeWidth="2" />
      <ellipse cx="38" cy="33" rx="6" ry="7.5" fill="#FFF6EA" stroke="#D9C4A5" strokeWidth="2" />
      <path d="M10 36 q22 22 44 0 l-4 10 q-18 10 -36 0 z" fill="#8A5A2B" stroke="#6E4520" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 40 l10 -4 M50 40 l-10 -4 M24 48 l8 -6 M40 48 l-8 -6" stroke="#6E4520" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LampArt({ className }: { className?: string }) {
  return (
    <Svg label="lamp" className={className}>
      <circle cx="32" cy="26" r="20" fill="#FFD93C" opacity="0.25" />
      <path d="M20 10 h24 l6 16 h-36 z" fill="#FF9A3D" stroke="#D97A1E" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="32" y1="26" x2="32" y2="46" stroke="#8A5A2B" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="32" cy="50" rx="12" ry="5" fill="#8A5A2B" stroke="#6E4520" strokeWidth="2" />
      <circle cx="32" cy="30" r="4" fill="#FFF3B0" />
    </Svg>
  );
}

function TentArt({ className }: { className?: string }) {
  return (
    <Svg label="tent" className={className}>
      <path d="M32 8 L56 52 H8 Z" fill="#7ED6A5" stroke="#3FA97C" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 30 L42 52 H22 Z" fill="#2E6E4E" />
      <line x1="32" y1="8" x2="32" y2="2" stroke="#3FA97C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="4" r="3" fill="#FFD93C" />
      <path d="M20 24 l6 4 M44 24 l-6 4" stroke="#3FA97C" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Generic fallback: a letter block, used when a word has no dedicated art. */
export function WordFallbackArt({ className }: { className?: string }) {
  return (
    <Svg label="word tile" className={className}>
      <rect x="10" y="10" width="44" height="44" rx="10" fill="#9B7EDE" stroke="#6C4FD8" strokeWidth="2.5" />
      <text x="32" y="43" textAnchor="middle" fontSize="26" fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">
        ?
      </text>
    </Svg>
  );
}

export const WORD_ART: Record<string, Pictogram> = {
  cat: CatArt,
  dog: DogArt,
  sun: SunArt,
  pig: PigArt,
  hat: HatArt,
  box: BoxArt,
  cup: CupArt,
  bus: BusArt,
  hen: HenArt,
  pan: PanArt,
  map: MapArt,
  bed: BedArt,
  fox: FoxArt,
  jar: JarArt,
  frog: FrogArt,
  crab: CrabArt,
  fish: FishArt,
  ship: ShipArt,
  duck: DuckArt,
  sock: SockArt,
  whale: WhaleArt,
  nest: NestArt,
  lamp: LampArt,
  tent: TentArt,
};

/** Pictogram for a word, or undefined when the word has no dedicated art. */
export function pictogramKey(word: string): Pictogram | undefined {
  return WORD_ART[word.toLowerCase()];
}
