export default function Milo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" strokeLinecap="round" strokeLinejoin="round">
      <title>Milo</title>
      <defs>
        <linearGradient id="milo-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#93CBF2" />
          <stop offset="1" stopColor="#5FA8DE" />
        </linearGradient>
      </defs>
      <g className="avatar-bob">
      {/* neck + body */}
      <rect x="38" y="68" width="20" height="12" rx="4" fill="#4A6FA5" stroke="#33527E" strokeWidth="3" />
      <path d="M28,96 C28,86 38,80 48,80 C58,80 68,86 68,96 Z" fill="#4A6FA5" stroke="#33527E" strokeWidth="3" />
      <circle cx="48" cy="88" r="2.4" fill="#9FD8FF" />
      <g className="avatar-tilt">
      {/* bolt-shaped ear caps */}
      <path d="M24,46 L31,46 L27.5,54 L33,54 L25,68 L27,57 L21,57 Z" fill="#F2C14E" stroke="#B8860B" strokeWidth="2.5" />
      <path d="M72,46 L65,46 L68.5,54 L63,54 L71,68 L69,57 L75,57 Z" fill="#F2C14E" stroke="#B8860B" strokeWidth="2.5" />
      {/* antenna with star tip */}
      <path d="M48,30 L48,20" fill="none" stroke="#3B7BB0" strokeWidth="3" />
      <path d="M48,6 L49.7,10.7 L54.7,10.8 L50.7,13.9 L52.1,18.7 L48,15.8 L43.9,18.7 L45.3,13.9 L41.3,10.8 L46.4,10.7 Z" fill="#F2C14E" stroke="#B8860B" strokeWidth="2" />
      {/* rounded head */}
      <rect x="23" y="30" width="50" height="40" rx="15" fill="url(#milo-shell)" stroke="#3B7BB0" strokeWidth="3" />
      {/* face screen */}
      <rect x="33" y="39" width="30" height="25" rx="8" fill="#DFF0FC" stroke="#3B7BB0" strokeWidth="2.5" />
      {/* friendly digital eyes */}
      <g className="avatar-blink">
      <rect x="37.5" y="44" width="8" height="11" rx="4" fill="#1E3A5C" />
      <rect x="50.5" y="44" width="8" height="11" rx="4" fill="#1E3A5C" />
      <circle cx="40" cy="47.5" r="1.5" fill="#9FD8FF" />
      <circle cx="53" cy="47.5" r="1.5" fill="#9FD8FF" />
      </g>
      {/* rounded-rect smile mouth */}
      <rect x="39" y="57" width="18" height="6" rx="3" fill="#1E3A5C" />
      <path d="M42.5,60 Q48,63.2 53.5,60" fill="none" stroke="#9FD8FF" strokeWidth="1.8" />
      {/* small gear detail on one cheek */}
      <g transform="translate(28.5 52)">
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="-1.8" y="-8" width="3.6" height="4.5" rx="1.2" fill="#C9D6E2" stroke="#5B7A99" strokeWidth="1.5" transform={`rotate(${i * 45})`} />
        ))}
        <circle r="4.6" fill="#C9D6E2" stroke="#5B7A99" strokeWidth="2" />
        <circle r="1.8" fill="#5B7A99" />
      </g>
      </g>
      </g>
    </svg>
  );
}
