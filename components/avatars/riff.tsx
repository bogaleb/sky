export default function Riff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" strokeLinecap="round" strokeLinejoin="round">
      <title>Riff</title>
      <defs>
        <linearGradient id="riff-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FDF6E8" />
          <stop offset="1" stopColor="#F3E3C2" />
        </linearGradient>
        <linearGradient id="riff-ear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D3C2F0" />
          <stop offset="1" stopColor="#B9A4E4" />
        </linearGradient>
      </defs>
      {/* long upright ears with lavender inner ear */}
      <ellipse cx="36" cy="19" rx="8" ry="16" fill="url(#riff-fur)" stroke="#D9C6A8" strokeWidth="3" />
      <ellipse cx="60" cy="19" rx="8" ry="16" fill="url(#riff-fur)" stroke="#D9C6A8" strokeWidth="3" />
      <ellipse cx="36" cy="20" rx="4" ry="11" fill="url(#riff-ear)" />
      <ellipse cx="60" cy="20" rx="4" ry="11" fill="url(#riff-ear)" />
      {/* shoulders */}
      <path d="M24,96 C24,84 36,78 48,78 C60,78 72,84 72,96 Z" fill="#B9A8E0" stroke="#8A74B8" strokeWidth="3" />
      {/* head */}
      <path d="M28,54 C28,42 37,36 48,36 C59,36 68,42 68,54 C68,66 59,74 48,74 C37,74 28,66 28,54 Z" fill="url(#riff-fur)" stroke="#D9C6A8" strokeWidth="3" />
      {/* joyful eyes */}
      <ellipse cx="39" cy="53" rx="4.5" ry="5.5" fill="#FFFFFF" stroke="#D9C6A8" strokeWidth="2.5" />
      <ellipse cx="57" cy="53" rx="4.5" ry="5.5" fill="#FFFFFF" stroke="#D9C6A8" strokeWidth="2.5" />
      <circle cx="40" cy="54" r="2.4" fill="#3A2A1A" />
      <circle cx="58" cy="54" r="2.4" fill="#3A2A1A" />
      <circle cx="40.9" cy="53" r="1" fill="#FFFFFF" />
      <circle cx="58.9" cy="53" r="1" fill="#FFFFFF" />
      {/* blush */}
      <circle cx="33" cy="60" r="3" fill="#F0A080" opacity="0.6" />
      <circle cx="63" cy="60" r="3" fill="#F0A080" opacity="0.6" />
      {/* joyful open smile */}
      <ellipse cx="48" cy="63" rx="7" ry="5" fill="#7A3B2E" stroke="#5E2C22" strokeWidth="2.5" />
      <ellipse cx="48" cy="65" rx="4" ry="2.6" fill="#F09090" />
      {/* eighth-note motif on one cheek */}
      <g>
        <ellipse cx="29" cy="66" rx="3.2" ry="2.4" fill="#7C5CBF" transform="rotate(-20 29 66)" />
        <path d="M31.8,65 L31.8,54" fill="none" stroke="#7C5CBF" strokeWidth="2.5" />
        <path d="M31.8,54 Q37,55 35.5,60" fill="none" stroke="#7C5CBF" strokeWidth="2.5" />
      </g>
      {/* bow tie */}
      <path d="M48,79 L36,73 L36,85 Z" fill="#E86A6A" stroke="#B34A4A" strokeWidth="2.5" />
      <path d="M48,79 L60,73 L60,85 Z" fill="#E86A6A" stroke="#B34A4A" strokeWidth="2.5" />
      <circle cx="48" cy="79" r="3.5" fill="#D95F5F" stroke="#B34A4A" strokeWidth="2" />
    </svg>
  );
}
