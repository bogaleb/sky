export default function Luna({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" strokeLinecap="round" strokeLinejoin="round">
      <title>Luna</title>
      <defs>
        <linearGradient id="luna-feather" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CBB9EE" />
          <stop offset="1" stopColor="#A78BD8" />
        </linearGradient>
        <linearGradient id="luna-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7C65C" />
          <stop offset="1" stopColor="#E89B2F" />
        </linearGradient>
      </defs>
      <g className="avatar-bob">
      {/* wings at sides */}
      <ellipse cx="24" cy="62" rx="7" ry="14" fill="#A78BD8" stroke="#7E63B8" strokeWidth="3" transform="rotate(12 24 62)" />
      <ellipse cx="72" cy="62" rx="7" ry="14" fill="#A78BD8" stroke="#7E63B8" strokeWidth="3" transform="rotate(-12 72 62)" />
      <g className="avatar-tilt">
      {/* ear tufts */}
      <path d="M30,36 L25,20 L42,30 Z" fill="url(#luna-feather)" stroke="#7E63B8" strokeWidth="3" />
      <path d="M66,36 L71,20 L54,30 Z" fill="url(#luna-feather)" stroke="#7E63B8" strokeWidth="3" />
      {/* body */}
      <ellipse cx="48" cy="56" rx="24" ry="28" fill="url(#luna-feather)" stroke="#7E63B8" strokeWidth="3" />
      {/* cream belly feathers */}
      <path d="M34,56 C34,68 40,78 48,78 C56,78 62,68 62,56 C58,52 54,50 48,50 C42,50 38,52 34,56 Z" fill="#F7EFDB" stroke="#D9C9A8" strokeWidth="2.5" />
      <path d="M40,62 Q44,65 48,62 Q52,65 56,62" fill="none" stroke="#D9C9A8" strokeWidth="2" />
      <path d="M41,69 Q45,72 49,69 Q52,72 55,69" fill="none" stroke="#D9C9A8" strokeWidth="2" />
      {/* huge round amber eyes */}
      <g className="avatar-blink">
      <circle cx="37" cy="44" r="11" fill="url(#luna-amber)" stroke="#7E63B8" strokeWidth="3" />
      <circle cx="59" cy="44" r="11" fill="url(#luna-amber)" stroke="#7E63B8" strokeWidth="3" />
      <circle cx="37" cy="45" r="4.5" fill="#3A2410" />
      <circle cx="59" cy="45" r="4.5" fill="#3A2410" />
      <circle cx="35" cy="42" r="2" fill="#FFFFFF" />
      <circle cx="57" cy="42" r="2" fill="#FFFFFF" />
      </g>
      {/* small round glasses */}
      <circle cx="37" cy="44" r="13.5" fill="none" stroke="#5B4A8A" strokeWidth="2.5" />
      <circle cx="59" cy="44" r="13.5" fill="none" stroke="#5B4A8A" strokeWidth="2.5" />
      <path d="M50.5,44 L45.5,44" fill="none" stroke="#5B4A8A" strokeWidth="2.5" />
      {/* beak */}
      <path d="M44,53 L52,53 L48,58 Z" fill="#E8913A" stroke="#B56A1F" strokeWidth="2" />
      </g>
      {/* tiny open book at chest */}
      <path d="M33,72 Q40,68 48,72 L48,82 Q40,78 33,82 Z" fill="#FFFFFF" stroke="#8A7FB8" strokeWidth="2.5" />
      <path d="M63,72 Q56,68 48,72 L48,82 Q56,78 63,82 Z" fill="#FFFFFF" stroke="#8A7FB8" strokeWidth="2.5" />
      <path d="M37,74.5 Q41,73 45,74.5 M51,74.5 Q55,73 59,74.5" fill="none" stroke="#B9AEDD" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
