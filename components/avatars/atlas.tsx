export default function Atlas({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" strokeLinecap="round" strokeLinejoin="round">
      <title>Atlas</title>
      <defs>
        <linearGradient id="atlas-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9BEDC" />
          <stop offset="1" stopColor="#7E97BC" />
        </linearGradient>
        <linearGradient id="atlas-hat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D8C48C" />
          <stop offset="1" stopColor="#B89F63" />
        </linearGradient>
      </defs>
      <g className="avatar-bob">
      {/* shoulders */}
      <path d="M26,96 C26,85 37,79 48,79 C59,79 70,85 70,96 Z" fill="#8FA3B8" stroke="#64788E" strokeWidth="3" />
      <g className="avatar-tilt">
      {/* large friendly ears */}
      <path d="M30,44 C18,38 12,48 16,60 C19,70 28,72 32,66 Z" fill="#8AA2C4" stroke="#5B7396" strokeWidth="3" />
      <path d="M66,44 C78,38 84,48 80,60 C77,70 68,72 64,66 Z" fill="#8AA2C4" stroke="#5B7396" strokeWidth="3" />
      <path d="M28,50 C22,48 20,54 22,60 C24,64 28,63 29,59 Z" fill="#B9CBE4" />
      <path d="M68,50 C74,48 76,54 74,60 C72,64 68,63 67,59 Z" fill="#B9CBE4" />
      {/* head */}
      <path d="M28,48 C28,36 37,30 48,30 C59,30 68,36 68,48 C68,60 59,68 48,68 C37,68 28,60 28,48 Z" fill="url(#atlas-skin)" stroke="#5B7396" strokeWidth="3" />
      {/* trunk curled up in a welcoming curl */}
      <path d="M48,60 C46,52 43,47 45,40 C46.5,34 52,33 55,36 C57,38 56,42 53,41" fill="none" stroke="#5B7396" strokeWidth="13" />
      <path d="M48,60 C46,52 43,47 45,40 C46.5,34 52,33 55,36 C57,38 56,42 53,41" fill="none" stroke="#A9BEDC" strokeWidth="8" />
      <circle cx="53.5" cy="38.5" r="1.6" fill="#4A5E78" />
      {/* wise warm eyes */}
      <g className="avatar-blink">
      <ellipse cx="38" cy="47" rx="4.5" ry="5" fill="#FFFFFF" stroke="#5B7396" strokeWidth="2.5" />
      <ellipse cx="58" cy="47" rx="4.5" ry="5" fill="#FFFFFF" stroke="#5B7396" strokeWidth="2.5" />
      <circle cx="38.5" cy="48" r="2.4" fill="#6B4A2A" />
      <circle cx="58.5" cy="48" r="2.4" fill="#6B4A2A" />
      <circle cx="39.4" cy="47" r="1" fill="#FFFFFF" />
      <circle cx="59.4" cy="47" r="1" fill="#FFFFFF" />
      </g>
      {/* gentle lids */}
      <path d="M33,43 Q38,41 43,43" fill="none" stroke="#5B7396" strokeWidth="2" />
      <path d="M53,43 Q58,41 63,43" fill="none" stroke="#5B7396" strokeWidth="2" />
      {/* blush */}
      <circle cx="34" cy="55" r="3" fill="#F0A080" opacity="0.55" />
      <circle cx="62" cy="55" r="3" fill="#F0A080" opacity="0.55" />
      {/* tiny khaki explorer hat */}
      <path d="M34,30 C35,16 61,16 62,30 Z" fill="url(#atlas-hat)" stroke="#9A844E" strokeWidth="3" />
      <rect x="34" y="24" width="28" height="5" fill="#8A6F45" />
      <ellipse cx="48" cy="30" rx="19" ry="5.5" fill="#D8C48C" stroke="#9A844E" strokeWidth="3" />
      </g>
      </g>
    </svg>
  );
}
