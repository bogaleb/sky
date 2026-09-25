'use client';

/**
 * Cute SVG drawings for tap_count objects. Each is a self-contained,
 * colorful illustration — no emoji, no icon fonts.
 */

function Apple({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="apple">
      <path d="M32 14 C26 8 20 10 22 14 C24 18 28 16 32 20 Z" fill="#7CB342" />
      <path d="M32 18 C20 8 8 18 10 34 C12 48 24 58 32 58 C40 58 52 48 54 34 C56 18 44 8 32 18 Z" fill="#FF6B6B" stroke="#D64545" strokeWidth="2.5" />
      <ellipse cx="24" cy="30" rx="6" ry="9" fill="#FF9D9D" opacity="0.7" transform="rotate(-18 24 30)" />
      <path d="M32 18 C32 12 32 10 32 8" stroke="#6D4C41" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="star">
      <path
        d="M32 6 L39 24 L58 24 L43 35 L48 54 L32 43 L16 54 L21 35 L6 24 L25 24 Z"
        fill="#FFC93C"
        stroke="#E09E00"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="30" r="2.4" fill="#17324F" />
      <circle cx="38" cy="30" r="2.4" fill="#17324F" />
      <path d="M27 36 Q32 40 37 36" stroke="#17324F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Fish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="fish">
      <path d="M46 32 L60 20 L58 32 L60 44 Z" fill="#4CC9F0" stroke="#1D8FBF" strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="28" cy="32" rx="20" ry="14" fill="#4CC9F0" stroke="#1D8FBF" strokeWidth="2.5" />
      <path d="M28 20 Q34 12 40 18 Q34 18 32 24 Z" fill="#1D8FBF" />
      <circle cx="20" cy="28" r="3" fill="#17324F" />
      <circle cx="21" cy="27" r="1" fill="#fff" />
      <path d="M14 32 Q20 36 26 32" stroke="#1D8FBF" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M32 32 L44 32 M32 26 L42 26 M32 38 L42 38" stroke="#8FE3FF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Bird({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="bird">
      <ellipse cx="32" cy="36" rx="16" ry="13" fill="#B983FF" stroke="#7B4FC9" strokeWidth="2.5" />
      <circle cx="40" cy="22" r="11" fill="#B983FF" stroke="#7B4FC9" strokeWidth="2.5" />
      <path d="M49 22 L58 25 L49 28 Z" fill="#FFB020" stroke="#D98A00" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="42" cy="20" r="2.6" fill="#17324F" />
      <path d="M18 34 Q8 28 6 18 Q16 22 22 28" fill="#9B5DE5" stroke="#7B4FC9" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M26 48 L26 56 M34 48 L34 56" stroke="#D98A00" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Cookie({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="cookie">
      <circle cx="32" cy="32" r="22" fill="#E8A856" stroke="#B97A2E" strokeWidth="2.5" />
      <circle cx="24" cy="26" r="3.4" fill="#5C3A21" />
      <circle cx="38" cy="22" r="3.4" fill="#5C3A21" />
      <circle cx="32" cy="36" r="3.4" fill="#5C3A21" />
      <circle cx="42" cy="38" r="3.4" fill="#5C3A21" />
      <circle cx="22" cy="40" r="3.4" fill="#5C3A21" />
      <circle cx="26" cy="30" r="2" fill="#17324F" />
      <circle cx="38" cy="32" r="2" fill="#17324F" />
      <path d="M27 40 Q32 44 37 40" stroke="#17324F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Clap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="clap">
      <path d="M14 44 L14 22 Q14 16 20 16 L26 16 L26 44 Z" fill="#FFD9B3" stroke="#C98A4B" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 44 L50 22 Q50 16 44 16 L38 16 L38 44 Z" fill="#FFD9B3" stroke="#C98A4B" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 22 L16 12 M26 20 L24 8 M44 22 L48 12 M38 20 L40 8" stroke="#FFC93C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="12" cy="14" r="3" fill="#FFC93C" className="animate-kid-sparkle" />
      <circle cx="52" cy="14" r="3" fill="#FFC93C" className="animate-kid-sparkle" style={{ animationDelay: '0.4s' }} />
    </svg>
  );
}

const SHAPES: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  apple: Apple,
  star: Star,
  fish: Fish,
  bird: Bird,
  cookie: Cookie,
  clap: Clap,
};

/** Render a count object by shape name; falls back to a star. */
export default function KidShape({ shape, className }: { shape: string; className?: string }) {
  const C = SHAPES[shape] ?? Star;
  return <C className={className} />;
}
