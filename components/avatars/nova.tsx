export default function Nova({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" strokeLinecap="round" strokeLinejoin="round">
      <title>Nova</title>
      <defs>
        <linearGradient id="nova-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C08A52" />
          <stop offset="1" stopColor="#9E6736" />
        </linearGradient>
      </defs>
      <g className="avatar-bob">
      {/* shirt + backpack straps */}
      <path d="M24,96 C24,84 36,78 48,78 C60,78 72,84 72,96 Z" fill="#2FA39A" stroke="#1E7A74" strokeWidth="3" />
      <path d="M34,78 L30,96" fill="none" stroke="#8A5A2B" strokeWidth="7" />
      <path d="M62,78 L66,96" fill="none" stroke="#8A5A2B" strokeWidth="7" />
      <rect x="43" y="66" width="10" height="12" rx="4" fill="#9E6736" />
      <g className="avatar-tilt">
      {/* short curly hair */}
      <g fill="#2B1D12" stroke="#1A1009" strokeWidth="2.5">
        <circle cx="30" cy="36" r="7" />
        <circle cx="37" cy="28" r="7.5" />
        <circle cx="48" cy="25" r="8" />
        <circle cx="59" cy="28" r="7.5" />
        <circle cx="66" cy="36" r="7" />
        <circle cx="27" cy="46" r="6" />
        <circle cx="69" cy="46" r="6" />
      </g>
      {/* face */}
      <circle cx="48" cy="50" r="21" fill="url(#nova-skin)" stroke="#7C4E26" strokeWidth="3" />
      {/* brass explorer goggles pushed up on forehead */}
      <path d="M27,40 L69,40" fill="none" stroke="#8A5A2B" strokeWidth="5" />
      <circle cx="37" cy="40" r="8" fill="#D8A93F" stroke="#8A5A1A" strokeWidth="2.5" />
      <circle cx="59" cy="40" r="8" fill="#D8A93F" stroke="#8A5A1A" strokeWidth="2.5" />
      <circle cx="37" cy="40" r="4.5" fill="#CDEBFA" />
      <circle cx="59" cy="40" r="4.5" fill="#CDEBFA" />
      <circle cx="35.5" cy="38.5" r="1.4" fill="#FFFFFF" />
      <circle cx="57.5" cy="38.5" r="1.4" fill="#FFFFFF" />
      {/* big curious eyes */}
      <g className="avatar-blink">
      <ellipse cx="38" cy="58" rx="4.5" ry="5.2" fill="#FFFFFF" stroke="#7C4E26" strokeWidth="2.5" />
      <ellipse cx="58" cy="58" rx="4.5" ry="5.2" fill="#FFFFFF" stroke="#7C4E26" strokeWidth="2.5" />
      <circle cx="38" cy="59" r="2.4" fill="#2B1D12" />
      <circle cx="58" cy="59" r="2.4" fill="#2B1D12" />
      <circle cx="38.9" cy="58" r="1" fill="#FFFFFF" />
      <circle cx="58.9" cy="58" r="1" fill="#FFFFFF" />
      </g>
      {/* brows */}
      <path d="M33,50 Q38,48 43,50" fill="none" stroke="#2B1D12" strokeWidth="2.5" />
      <path d="M53,50 Q58,48 63,50" fill="none" stroke="#2B1D12" strokeWidth="2.5" />
      {/* cheeks + nose */}
      <circle cx="33" cy="63" r="3.2" fill="#D98E5F" opacity="0.7" />
      <circle cx="63" cy="63" r="3.2" fill="#D98E5F" opacity="0.7" />
      <path d="M46,62 Q48,63.5 50,62" fill="none" stroke="#7C4E26" strokeWidth="2" />
      {/* gap-tooth smile */}
      <path d="M38,65.5 Q48,76 58,65.5 Q48,69.5 38,65.5 Z" fill="#7A3B2E" />
      <rect x="42.5" y="66" width="4.5" height="4" rx="1" fill="#FFFFFF" />
      <rect x="49.5" y="66" width="4.5" height="4" rx="1" fill="#FFFFFF" />
      </g>
      </g>
    </svg>
  );
}
