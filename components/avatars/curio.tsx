export default function Curio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" strokeLinecap="round" strokeLinejoin="round">
      <title>Curio</title>
      <defs>
        <linearGradient id="curio-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6AC55" />
          <stop offset="1" stopColor="#E0802A" />
        </linearGradient>
        <linearGradient id="curio-hat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3E4F86" />
          <stop offset="1" stopColor="#2A365E" />
        </linearGradient>
      </defs>
      {/* jacket shoulders */}
      <path d="M22,96 C22,82 34,76 48,76 C62,76 74,82 74,96 Z" fill="#33415F" stroke="#232C46" strokeWidth="3" />
      <circle cx="48" cy="84" r="2.3" fill="#F2C14E" />
      <circle cx="48" cy="91" r="2.3" fill="#F2C14E" />
      {/* tall triangular ears */}
      <path d="M30,38 L33,10 L56,30 Z" fill="url(#curio-fur)" stroke="#B25D18" strokeWidth="3" />
      <path d="M66,38 L63,10 L40,30 Z" fill="url(#curio-fur)" stroke="#B25D18" strokeWidth="3" />
      <path d="M32.4,19 L34,13.4 L39.8,16.8 Z" fill="#FBE7C6" />
      <path d="M63.6,19 L62,13.4 L56.2,16.8 Z" fill="#FBE7C6" />
      {/* head */}
      <path d="M27,45 C27,31 37,25 48,25 C59,25 69,31 69,45 C69,60 59,70 48,70 C37,70 27,60 27,45 Z" fill="url(#curio-fur)" stroke="#B25D18" strokeWidth="3" />
      {/* cheek tufts */}
      <path d="M28,54 L21,58 L28,61 Z" fill="url(#curio-fur)" stroke="#B25D18" strokeWidth="3" />
      <path d="M68,54 L75,58 L68,61 Z" fill="url(#curio-fur)" stroke="#B25D18" strokeWidth="3" />
      {/* cream muzzle */}
      <ellipse cx="48" cy="57" rx="15" ry="9.5" fill="#FBE7C6" stroke="#D9B98C" strokeWidth="3" />
      <path d="M43,53 Q48,50.5 53,53 Q52,57.5 48,57.5 Q44,57.5 43,53 Z" fill="#6B3A1A" />
      <path d="M48,57.5 Q48,61 43,61 M48,57.5 Q48,61 53,61" fill="none" stroke="#6B3A1A" strokeWidth="2.5" />
      {/* kind, confident eyes */}
      <ellipse cx="38" cy="43" rx="5" ry="5.6" fill="#FFFFFF" stroke="#B25D18" strokeWidth="2.5" />
      <ellipse cx="58" cy="43" rx="5" ry="5.6" fill="#FFFFFF" stroke="#B25D18" strokeWidth="2.5" />
      <circle cx="39" cy="44" r="2.6" fill="#3A2410" />
      <circle cx="57" cy="44" r="2.6" fill="#3A2410" />
      <circle cx="39.8" cy="43" r="1" fill="#FFFFFF" />
      <circle cx="57.8" cy="43" r="1" fill="#FFFFFF" />
      <path d="M31,34 L44,36" fill="none" stroke="#7A4212" strokeWidth="3" />
      <path d="M65,34 L52,36" fill="none" stroke="#7A4212" strokeWidth="3" />
      {/* navy captain's hat */}
      <path d="M29,31 C31,15 65,15 67,31 Z" fill="url(#curio-hat)" stroke="#1E2748" strokeWidth="3" />
      <rect x="25" y="28" width="46" height="9" rx="4.5" fill="#2A365E" stroke="#1E2748" strokeWidth="3" />
      {/* anchor emblem */}
      <g fill="none" stroke="#F2C14E" strokeWidth="2">
        <circle cx="48" cy="18.5" r="2.2" />
        <path d="M48,20.7 L48,27 M44.5,22.5 L51.5,22.5 M44.5,24.5 Q48,28 51.5,24.5" />
      </g>
    </svg>
  );
}
