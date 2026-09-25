'use client';

/**
 * Game button art for the Sky Park registry (Wave 10).
 * The original per-button SVG illustrations, moved verbatim out of the
 * session-player god component so the registry can render them by id.
 * Decorative: always aria-hidden; buttons carry the accessible label.
 */

function ArtMemory() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="6" y="10" width="16" height="22" rx="4" fill="#fff" opacity="0.95" />
    <rect x="26" y="10" width="16" height="22" rx="4" fill="#fff" opacity="0.6" />
    <path d="M14 17l1.5 3.2 3.5.4-2.6 2.4.7 3.5-3.1-1.7-3.1 1.7.7-3.5-2.6-2.4 3.5-.4z" fill="#7C5CBF" />
    </svg>
  );
}

function ArtDressUp() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <path d="M24 6l4 8h-8z" fill="#FF6B6B" />
    <rect x="10" y="16" width="28" height="8" rx="4" fill="#FF6B6B" />
    <circle cx="17" cy="30" r="6" fill="none" stroke="#17324F" strokeWidth="3" />
    <circle cx="31" cy="30" r="6" fill="none" stroke="#17324F" strokeWidth="3" />
    <line x1="23" y1="30" x2="25" y2="30" stroke="#17324F" strokeWidth="3" />
    </svg>
  );
}

function ArtPattern() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <circle cx="10" cy="24" r="6" fill="#fff" opacity="0.95" />
    <path d="M22 18l6 12h-12z" fill="#fff" opacity="0.75" />
    <rect x="32" y="18" width="11" height="11" rx="2" fill="#fff" opacity="0.95" />
    <text x="30" y="44" fontSize="10" fontWeight="900" fill="#17324F">?</text>
    </svg>
  );
}

function ArtPuzzle() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <path d="M18 8h6v4a3 3 0 1 0 6 0V8h6v10h-4a3 3 0 1 0 0 6h4v10H18V8z" fill="#fff" opacity="0.95" transform="translate(-4 4)" />
    <path d="M30 30h10v4h-4a3 3 0 1 0 0 6h4v2H30V30z" fill="#fff" opacity="0.6" />
    </svg>
  );
}

function ArtTrophies() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <path d="M16 8h16v12a8 8 0 0 1-16 0V8z" fill="#fff" opacity="0.95" />
    <path d="M16 12H9a7 7 0 0 0 9 9M32 12h7a7 7 0 0 1-9 9" fill="none" stroke="#fff" strokeWidth="3.5" opacity="0.9" />
    <rect x="22" y="28" width="4" height="7" fill="#fff" opacity="0.95" />
    <rect x="16" y="35" width="16" height="5" rx="2.5" fill="#fff" opacity="0.95" />
    <path d="M24 12l1.4 2.9 3.2.4-2.3 2.2.6 3.1-2.9-1.5-2.9 1.5.6-3.1-2.3-2.2 3.2-.4z" fill="#FFD93C" />
    </svg>
  );
}

function ArtWords() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="6" y="26" width="10" height="10" rx="2.5" fill="#fff" opacity="0.95" />
    <rect x="19" y="26" width="10" height="10" rx="2.5" fill="#fff" opacity="0.75" />
    <rect x="32" y="26" width="10" height="10" rx="2.5" fill="#fff" opacity="0.95" />
    <text x="8.5" y="34.5" fontSize="9" fontWeight="900" fill="#7C5CBF">A</text>
    <text x="21.5" y="34.5" fontSize="9" fontWeight="900" fill="#17324F">B</text>
    <text x="34" y="34.5" fontSize="9" fontWeight="900" fill="#7C5CBF">C</text>
    <path d="M24 6l2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" fill="#FFD93C" />
    </svg>
  );
}

function ArtNumbers() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="4" y="34" width="40" height="5" rx="2.5" fill="#fff" opacity="0.6" />
    <text x="8" y="26" fontSize="12" fontWeight="900" fill="#fff">3</text>
    <text x="21" y="26" fontSize="12" fontWeight="900" fill="#fff">+</text>
    <text x="33" y="26" fontSize="12" fontWeight="900" fill="#fff">4</text>
    <path d="M24 2l3 6.5L34 9l-5 4.7 1.2 6.8L24 17.4l-6.2 3.1L19 13.7 14 9l7-.5z" fill="#FFD93C" />
    </svg>
  );
}

function ArtCinema() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="6" y="10" width="36" height="24" rx="4" fill="#17324F" opacity="0.9" />
    <rect x="9" y="13" width="30" height="18" rx="2" fill="#FFD93C" opacity="0.95" />
    <path d="M21 17l8 4.5-8 4.5z" fill="#17324F" />
    <rect x="20" y="34" width="8" height="4" rx="2" fill="#fff" opacity="0.95" />
    <rect x="14" y="38" width="20" height="3" rx="1.5" fill="#fff" opacity="0.75" />
    </svg>
  );
}

function ArtStudio() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <path d="M10 38c8-1 24-9 28-26l-8-3c-9 12-16 20-24 22z" fill="#FF8C42" />
    <path d="M38 9l3-3 3 3-3 3z" fill="#17324F" />
    <path d="M8 40l4 2-2 4-4-2z" fill="#17324F" />
    <circle cx="16" cy="36" r="2.5" fill="#3B82F6" />
    <circle cx="22" cy="33" r="2.5" fill="#22C55E" />
    </svg>
  );
}

function ArtBedtime() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <path d="M32 6a16 16 0 1 0 10 28A18 18 0 0 1 32 6z" fill="#FFE66D" />
    <path d="M14 12l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#fff" opacity="0.95" />
    <path d="M40 30l.9 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="#fff" opacity="0.8" />
    </svg>
  );
}

function ArtWriting() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <path d="M10 36L34 12l4 4L14 40l-6 2z" fill="#17324F" />
    <path d="M34 12l2-2 4 4-2 2z" fill="#FF8C42" />
    <path d="M8 38l6-1-5-5z" fill="#17324F" />
    <text x="30" y="42" fontSize="10" fontWeight="900" fill="#17324F">Aa</text>
    </svg>
  );
}

function ArtGeography() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <circle cx="24" cy="24" r="16" fill="#3B82F6" />
    <path d="M14 20c4-5 10-7 14-5s8 1 8 5-4 6-8 6-6 4-10 2-6-4-4-8z" fill="#22C55E" />
    <path d="M30 12l2 3-2 3-2-3z" fill="#FFE66D" />
    </svg>
  );
}

function ArtRhythm() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <circle cx="16" cy="34" r="9" fill="#fff" opacity="0.95" />
    <circle cx="32" cy="30" r="9" fill="#fff" opacity="0.7" />
    <rect x="23" y="8" width="4" height="14" rx="2" fill="#fff" opacity="0.95" transform="rotate(15 25 15)" />
    <rect x="33" y="6" width="4" height="14" rx="2" fill="#fff" opacity="0.75" transform="rotate(-12 35 13)" />
    </svg>
  );
}

function ArtScience() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <path d="M20 6h8v10l8 18a6 6 0 0 1-5.5 8h-13A6 6 0 0 1 12 34l8-18z" fill="#fff" opacity="0.95" />
    <path d="M17 32h14l2.5 4.5a3 3 0 0 1-2.7 4.5H17.2a3 3 0 0 1-2.7-4.5z" fill="#22C55E" />
    <circle cx="22" cy="28" r="2" fill="#fff" opacity="0.8" />
    <circle cx="27" cy="30" r="1.6" fill="#fff" opacity="0.8" />
    </svg>
  );
}

function ArtCoding() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="8" y="10" width="32" height="28" rx="6" fill="#fff" opacity="0.95" />
    <path d="M17 20l-5 4 5 4" fill="none" stroke="#17324F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M31 20l5 4-5 4" fill="none" stroke="#17324F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="14" y="40" width="20" height="4" rx="2" fill="#fff" opacity="0.7" />
    </svg>
  );
}

function ArtPhonics() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="6" y="14" width="15" height="15" rx="3" fill="#fff" opacity="0.95" />
    <rect x="27" y="14" width="15" height="15" rx="3" fill="#fff" opacity="0.7" />
    <text x="9.5" y="26.5" fontSize="11" fontWeight="900" fill="#D64545">sh</text>
    <text x="31" y="26.5" fontSize="11" fontWeight="900" fill="#17324F">op</text>
    <path d="M14 34q4 4 8 0M26 34q4 4 8 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

function ArtEncyclopedia() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <path d="M8 12q8-3 16 0v24q-8-3-16 0z" fill="#fff" opacity="0.95" />
    <path d="M40 12q-8-3-16 0v24q8-3 16 0z" fill="#fff" opacity="0.7" />
    <circle cx="24" cy="22" r="6" fill="#22C55E" />
    <circle cx="22" cy="20" r="2" fill="#17324F" />
    <path d="M20 26q4 3 8 0" stroke="#17324F" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ArtTime() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <circle cx="24" cy="24" r="17" fill="#fff" opacity="0.95" />
    <circle cx="24" cy="24" r="17" fill="none" stroke="#0B5E8A" strokeWidth="4" />
    <path d="M24 24V13M24 24l7 5" stroke="#0B5E8A" strokeWidth="4" strokeLinecap="round" />
    <circle cx="24" cy="24" r="3" fill="#0B5E8A" />
    </svg>
  );
}

function ArtMoney() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <ellipse cx="24" cy="34" rx="13" ry="5" fill="#fff" opacity="0.7" />
    <ellipse cx="24" cy="27" rx="13" ry="5" fill="#fff" opacity="0.85" />
    <ellipse cx="24" cy="20" rx="13" ry="5" fill="#fff" opacity="0.95" />
    <ellipse cx="24" cy="20" rx="13" ry="5" fill="none" stroke="#B45309" strokeWidth="2.5" />
    <text x="24" y="25" fontSize="11" fontWeight="900" fill="#B45309" textAnchor="middle">25</text>
    </svg>
  );
}

function ArtMovies() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="7" y="14" width="34" height="26" rx="5" fill="#fff" opacity="0.95" />
    <rect x="7" y="8" width="34" height="8" rx="3" fill="#fff" opacity="0.7" />
    <path d="M10 8l4 8M18 8l4 8M26 8l4 8M34 8l4 8" stroke="#6D28D9" strokeWidth="2.5" />
    <path d="M20 21l10 6-10 6z" fill="#6D28D9" />
    </svg>
  );
}

function ArtHomes() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <path d="M6 24L24 8l18 16" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="12" y="22" width="24" height="17" rx="3" fill="#fff" opacity="0.95" />
    <rect x="21" y="30" width="6" height="9" rx="2" fill="#C2410C" />
    <circle cx="24" cy="18" r="4" fill="#FDE68A" />
    </svg>
  );
}

function ArtFeelings() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <circle cx="24" cy="24" r="16" fill="#fff" opacity="0.95" />
    <circle cx="18" cy="21" r="2.5" fill="#0D7C5F" />
    <circle cx="30" cy="21" r="2.5" fill="#0D7C5F" />
    <path d="M16 30q8 8 16 0" stroke="#0D7C5F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ArtColors() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <circle cx="18" cy="20" r="9" fill="#EF4444" opacity="0.95" />
    <circle cx="30" cy="20" r="9" fill="#3B82F6" opacity="0.95" />
    <circle cx="24" cy="33" r="10" fill="#8B5CF6" opacity="0.95" />
    <path d="M18 29q6 4 12 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ArtRhymes() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="8" y="12" width="32" height="10" rx="5" fill="#fff" opacity="0.95" />
    <rect x="8" y="26" width="32" height="10" rx="5" fill="#fff" opacity="0.7" />
    <text x="24" y="20.5" fontSize="9" fontWeight="900" fill="#C2410C" textAnchor="middle">cat</text>
    <text x="24" y="34.5" fontSize="9" fontWeight="900" fill="#7C2D12" textAnchor="middle">hat</text>
    </svg>
  );
}

function ArtPlayground() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="6" y="28" width="36" height="6" rx="3" fill="#fff" opacity="0.9" />
    <circle cx="14" cy="20" r="8" fill="#fff" opacity="0.95" />
    <path d="M10 20a4 4 0 008 0 4 4 0 00-8 0" fill="#B45309" />
    <rect x="28" y="10" width="14" height="14" rx="4" fill="#fff" opacity="0.7" />
    <circle cx="35" cy="17" r="4" fill="#B45309" opacity="0.8" />
    </svg>
  );
}

function ArtFractions() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <circle cx="24" cy="24" r="16" fill="#F5C66B" />
    <path d="M24 8a16 16 0 010 32z" fill="#E2574C" opacity="0.85" />
    <circle cx="24" cy="24" r="16" fill="none" stroke="#B45309" strokeWidth="2.5" />
    <line x1="24" y1="8" x2="24" y2="40" stroke="#B45309" strokeWidth="2.5" />
    <circle cx="15" cy="18" r="2.2" fill="#fff" opacity="0.9" />
    <circle cx="14" cy="30" r="2.2" fill="#fff" opacity="0.9" />
    <circle cx="32" cy="24" r="2.2" fill="#fff" opacity="0.9" />
    </svg>
  );
}

function ArtAvatarStudio() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <circle cx="24" cy="25" r="14" fill="#FFE3B3" />
    <path d="M10 22a14 14 0 0128 0v-2a14 8 0 00-28 0z" fill="#7C5CBF" />
    <circle cx="18.5" cy="25" r="2.6" fill="#17324F" />
    <circle cx="29.5" cy="25" r="2.6" fill="#17324F" />
    <path d="M18 32a6 6 0 0012 0" fill="none" stroke="#17324F" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="13" cy="29" r="2.4" fill="#FF9AA2" opacity="0.8" />
    <circle cx="35" cy="29" r="2.4" fill="#FF9AA2" opacity="0.8" />
    </svg>
  );
}

function ArtSentences() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="6" y="10" width="36" height="10" rx="5" fill="#fff" opacity="0.95" />
    <rect x="6" y="24" width="28" height="10" rx="5" fill="#fff" opacity="0.7" />
    <rect x="6" y="38" width="18" height="6" rx="3" fill="#fff" opacity="0.5" />
    <text x="24" y="18" fontSize="8" fontWeight="900" fill="#1D4ED8" textAnchor="middle">The cat</text>
    <text x="20" y="32" fontSize="8" fontWeight="900" fill="#1E40AF" textAnchor="middle">naps.</text>
    </svg>
  );
}

function ArtMeasure() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="22" y="6" width="4" height="36" fill="#B45309" />
    <line x1="6" y1="14" x2="42" y2="14" stroke="#17324F" strokeWidth="3" strokeLinecap="round" />
    <rect x="8" y="18" width="12" height="8" rx="2" fill="#FF6B6B" />
    <rect x="28" y="22" width="12" height="8" rx="2" fill="#4ECDC4" />
    <circle cx="24" cy="6" r="3" fill="#17324F" />
    </svg>
  );
}

function ArtOpposites() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 drop-shadow-[0_6px_12px_rgba(23,50,79,0.3)] transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 md:h-14 md:w-14" aria-hidden>
    <rect x="6" y="8" width="16" height="32" rx="4" fill="#fff" opacity="0.95" />
    <rect x="26" y="8" width="16" height="32" rx="4" fill="#fff" opacity="0.6" />
    <text x="14" y="22" fontSize="8" fontWeight="900" fill="#7C5CBF" textAnchor="middle">big</text>
    <text x="14" y="34" fontSize="8" fontWeight="900" fill="#7C5CBF" textAnchor="middle">BIG</text>
    <text x="34" y="22" fontSize="8" fontWeight="900" fill="#5B21B6" textAnchor="middle">tiny</text>
    <text x="34" y="34" fontSize="7" fontWeight="900" fill="#5B21B6" textAnchor="middle">small</text>
    </svg>
  );
}

export const GAME_ART: Record<string, () => React.JSX.Element> = {
  Memory: ArtMemory,
  DressUp: ArtDressUp,
  Pattern: ArtPattern,
  Puzzle: ArtPuzzle,
  Trophies: ArtTrophies,
  Words: ArtWords,
  Numbers: ArtNumbers,
  Cinema: ArtCinema,
  Studio: ArtStudio,
  Bedtime: ArtBedtime,
  Writing: ArtWriting,
  Geography: ArtGeography,
  Rhythm: ArtRhythm,
  Science: ArtScience,
  Coding: ArtCoding,
  Phonics: ArtPhonics,
  Encyclopedia: ArtEncyclopedia,
  Time: ArtTime,
  Money: ArtMoney,
  Movies: ArtMovies,
  Homes: ArtHomes,
  Feelings: ArtFeelings,
  Colors: ArtColors,
  Rhymes: ArtRhymes,
  Playground: ArtPlayground,
  Fractions: ArtFractions,
  AvatarStudio: ArtAvatarStudio,
  Sentences: ArtSentences,
  Measure: ArtMeasure,
  Opposites: ArtOpposites,
};
