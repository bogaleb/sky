export default function Bea({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" strokeLinecap="round" strokeLinejoin="round">
      <title>Bea</title>
      <defs>
        <linearGradient id="bea-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7C948" />
          <stop offset="1" stopColor="#E8A23A" />
        </linearGradient>
        <clipPath id="bea-clip">
          <ellipse cx="48" cy="54" rx="20" ry="22" />
        </clipPath>
      </defs>
      <g className="avatar-bob">
      {/* translucent wings */}
      <ellipse cx="27" cy="30" rx="10" ry="15" fill="#FFFFFF" opacity="0.55" stroke="#A9C6D8" strokeWidth="2.5" transform="rotate(-25 27 30)" />
      <ellipse cx="69" cy="30" rx="10" ry="15" fill="#FFFFFF" opacity="0.55" stroke="#A9C6D8" strokeWidth="2.5" transform="rotate(25 69 30)" />
      <g className="avatar-tilt">
      {/* antennae */}
      <path d="M42,33 Q39,24 33,22" fill="none" stroke="#5A3D10" strokeWidth="2.5" />
      <path d="M54,33 Q57,24 63,22" fill="none" stroke="#5A3D10" strokeWidth="2.5" />
      <circle cx="33" cy="22" r="3" fill="#5A3D10" />
      <circle cx="63" cy="22" r="3" fill="#5A3D10" />
      {/* body */}
      <ellipse cx="48" cy="54" rx="20" ry="22" fill="url(#bea-body)" stroke="#B57E1F" strokeWidth="3" />
      {/* dark stripes, clipped to body */}
      <g clipPath="url(#bea-clip)">
        <rect x="28" y="56" width="40" height="7" fill="#6B4A12" />
        <rect x="28" y="68" width="40" height="7" fill="#6B4A12" />
      </g>
      {/* rosy cheeks */}
      <circle cx="34" cy="51" r="3.6" fill="#F08A80" opacity="0.8" />
      <circle cx="62" cy="51" r="3.6" fill="#F08A80" opacity="0.8" />
      {/* friendly eyes */}
      <g className="avatar-blink">
      <ellipse cx="41" cy="45" rx="4.2" ry="4.8" fill="#FFFFFF" stroke="#B57E1F" strokeWidth="2.5" />
      <ellipse cx="55" cy="45" rx="4.2" ry="4.8" fill="#FFFFFF" stroke="#B57E1F" strokeWidth="2.5" />
      <circle cx="41.8" cy="46" r="2.3" fill="#3A2410" />
      <circle cx="55.8" cy="46" r="2.3" fill="#3A2410" />
      <circle cx="42.6" cy="45" r="0.9" fill="#FFFFFF" />
      <circle cx="56.6" cy="45" r="0.9" fill="#FFFFFF" />
      </g>
      {/* smile */}
      <path d="M43,52 Q48,56 53,52" fill="none" stroke="#5A3D10" strokeWidth="2.5" />
      </g>
      {/* magnifying glass */}
      <circle cx="69" cy="66" r="9" fill="#DFF2FB" opacity="0.6" stroke="#8A5A2B" strokeWidth="4" />
      <path d="M75,72 L84,81" fill="none" stroke="#8A5A2B" strokeWidth="5" />
      <circle cx="66" cy="63" r="2" fill="#FFFFFF" opacity="0.8" />
      </g>
    </svg>
  );
}
