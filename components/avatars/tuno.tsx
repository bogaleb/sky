export default function Tuno({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" strokeLinecap="round" strokeLinejoin="round">
      <title>Tuno</title>
      <defs>
        <linearGradient id="tuno-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9C795" />
          <stop offset="1" stopColor="#7FA36E" />
        </linearGradient>
        <linearGradient id="tuno-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7CA468" />
          <stop offset="1" stopColor="#5C844C" />
        </linearGradient>
      </defs>
      <g className="avatar-bob">
      {/* pastel thought cloud resting above head */}
      <g fill="#EDF6FB" stroke="#A9C6D8" strokeWidth="2.5">
        <circle cx="36" cy="16" r="7" />
        <circle cx="46" cy="12" r="9" />
        <circle cx="56" cy="16" r="7" />
        <rect x="30" y="14" width="32" height="11" rx="5.5" />
      </g>
      <circle cx="44" cy="32" r="2" fill="#EDF6FB" stroke="#A9C6D8" strokeWidth="1.5" />
      <circle cx="47" cy="38" r="2.5" fill="#EDF6FB" stroke="#A9C6D8" strokeWidth="1.5" />
      {/* patterned shell at shoulders */}
      <path d="M20,96 C20,72 33,62 48,62 C63,62 76,72 76,96 Z" fill="url(#tuno-shell)" stroke="#45653A" strokeWidth="3" />
      <g fill="none" stroke="#45653A" strokeWidth="2">
        <path d="M48,72 l5.2,3 l0,6 l-5.2,3 l-5.2,-3 l0,-6 Z" />
        <path d="M33,78 l5.2,3 l0,6 l-5.2,3 l-5.2,-3 l0,-6 Z" />
        <path d="M63,78 l5.2,3 l0,6 l-5.2,3 l-5.2,-3 l0,-6 Z" />
      </g>
      <g className="avatar-tilt">
      {/* head */}
      <path d="M31,52 C31,40 39,34 48,34 C57,34 65,40 65,52 C65,64 57,72 48,72 C39,72 31,64 31,52 Z" fill="url(#tuno-skin)" stroke="#5F7F52" strokeWidth="3" />
      {/* half-moon gentle eyes */}
      <g className="avatar-blink">
      <path d="M37,52 Q42,57 47,52" fill="none" stroke="#3E5233" strokeWidth="3" />
      <path d="M49,52 Q54,57 59,52" fill="none" stroke="#3E5233" strokeWidth="3" />
      </g>
      {/* soft blush */}
      <circle cx="37" cy="60" r="3" fill="#F0A080" opacity="0.6" />
      <circle cx="59" cy="60" r="3" fill="#F0A080" opacity="0.6" />
      {/* nose dots + calm smile */}
      <circle cx="45" cy="60" r="1.4" fill="#3E5233" />
      <circle cx="51" cy="60" r="1.4" fill="#3E5233" />
      <path d="M43,64 Q48,67 53,64" fill="none" stroke="#3E5233" strokeWidth="2.5" />
      </g>
      </g>
    </svg>
  );
}
