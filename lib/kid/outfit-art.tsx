/**
 * OutfitArt — SVG accessory overlays for Avatar Dress-Up.
 *
 * Every accessory renders in the same 0 0 96 96 viewBox as the avatar
 * portraits (see components/avatars/*), so the parent can stack it
 * absolutely on top of any avatar: hats sit on the head (top ~y 15-30),
 * glasses sit mid-face (y 40-64), extras stay at the sides/shoulders.
 * Gradient ids are prefixed per outfit so many instances can coexist.
 */

const P = {
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function ExplorerHat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      <defs>
        <linearGradient id="explorer-hat-tan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8C98A" />
          <stop offset="1" stopColor="#C69A52" />
        </linearGradient>
      </defs>
      {/* crown */}
      <path
        d="M33,26 C33,12 40,7 48,7 C56,7 63,12 63,26 Z"
        fill="url(#explorer-hat-tan)"
        stroke="#8A5A2B"
        strokeWidth="3"
      />
      {/* hat band */}
      <path d="M33,20 L63,20 L63,26 L33,26 Z" fill="#8A5A2B" opacity="0.85" />
      {/* wide brim */}
      <ellipse cx="48" cy="28" rx="29" ry="6.5" fill="url(#explorer-hat-tan)" stroke="#8A5A2B" strokeWidth="3" />
      {/* chin strap */}
      <path d="M34,32 C36,42 40,50 44,56" fill="none" stroke="#8A5A2B" strokeWidth="2.5" />
    </svg>
  );
}

function SleepyNightcap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      <defs>
        <linearGradient id="sleepy-nightcap-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#BFDDF7" />
          <stop offset="1" stopColor="#7FA8D9" />
        </linearGradient>
      </defs>
      {/* floppy cone */}
      <path
        d="M30,30 C36,18 44,12 52,10 C60,8 68,8 72,10 C66,14 62,20 60,26 C58,32 56,36 54,38 L36,38 C32,36 30,33 30,30 Z"
        fill="url(#sleepy-nightcap-blue)"
        stroke="#4A6FA5"
        strokeWidth="3"
      />
      {/* dots */}
      <circle cx="44" cy="22" r="2.2" fill="#FFFFFF" opacity="0.9" />
      <circle cx="54" cy="28" r="2.2" fill="#FFFFFF" opacity="0.9" />
      <circle cx="62" cy="16" r="2.2" fill="#FFFFFF" opacity="0.9" />
      {/* folded brim */}
      <rect x="28" y="28" width="40" height="10" rx="5" fill="#EAF4FD" stroke="#4A6FA5" strokeWidth="3" />
      {/* pompom */}
      <circle cx="72" cy="10" r="5.5" fill="#FFFFFF" stroke="#4A6FA5" strokeWidth="3" />
    </svg>
  );
}

function SailorCap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* cap top */}
      <path
        d="M32,24 C32,12 40,8 48,8 C56,8 64,12 64,24 L64,26 L32,26 Z"
        fill="#FFFFFF"
        stroke="#2B4A6F"
        strokeWidth="3"
      />
      {/* navy band */}
      <rect x="30" y="24" width="36" height="9" rx="4.5" fill="#2B4A6F" />
      {/* gold anchor dot emblem */}
      <circle cx="48" cy="16" r="4" fill="#FFC93C" stroke="#B57E12" strokeWidth="2.5" />
      <circle cx="48" cy="16" r="1.4" fill="#B57E12" />
    </svg>
  );
}

function RainbowGlasses({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* left lens rainbow rim */}
      <circle cx="37" cy="52" r="12" fill="#FFFFFF" opacity="0.25" />
      <circle cx="37" cy="52" r="12" fill="none" stroke="#FF6B6B" strokeWidth="2.5" />
      <circle cx="37" cy="52" r="9.5" fill="none" stroke="#FFAE00" strokeWidth="2" />
      <circle cx="37" cy="52" r="7.2" fill="none" stroke="#2EC4B6" strokeWidth="2" />
      {/* right lens rainbow rim */}
      <circle cx="59" cy="52" r="12" fill="#FFFFFF" opacity="0.25" />
      <circle cx="59" cy="52" r="12" fill="none" stroke="#9B5DE5" strokeWidth="2.5" />
      <circle cx="59" cy="52" r="9.5" fill="none" stroke="#4CC9F0" strokeWidth="2" />
      <circle cx="59" cy="52" r="7.2" fill="none" stroke="#F15BB5" strokeWidth="2" />
      {/* bridge + temples */}
      <path d="M49,52 Q48,48 47,48 Q46,48 45,52" fill="none" stroke="#5B4A8A" strokeWidth="3" />
      <path d="M25,50 L15,46" fill="none" stroke="#5B4A8A" strokeWidth="3" />
      <path d="M71,50 L81,46" fill="none" stroke="#5B4A8A" strokeWidth="3" />
      {/* sparkles */}
      <path d="M28,38 l1.6,3.4 3.4,1.6 -3.4,1.6 -1.6,3.4 -1.6,-3.4 -3.4,-1.6 3.4,-1.6 Z" fill="#FFC93C" />
      <path d="M70,62 l1.2,2.6 2.6,1.2 -2.6,1.2 -1.2,2.6 -1.2,-2.6 -2.6,-1.2 2.6,-1.2 Z" fill="#FFC93C" />
    </svg>
  );
}

function FlowerCrown({ className }: { className?: string }) {
  const flowers: Array<{ x: number; y: number; petal: string; center: string }> = [
    { x: 33, y: 26, petal: '#FF8AC2', center: '#FFC93C' },
    { x: 42, y: 20, petal: '#B983FF', center: '#FFFFFF' },
    { x: 52, y: 19, petal: '#FF8A7A', center: '#FFC93C' },
    { x: 61, y: 23, petal: '#4FD8C4', center: '#FFFFFF' },
    { x: 68, y: 29, petal: '#FFD968', center: '#E14E4E' },
  ];
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* vine */}
      <path d="M28,30 C36,20 60,20 70,30" fill="none" stroke="#2E9E5B" strokeWidth="4" />
      {/* leaves */}
      <ellipse cx="36" cy="32" rx="5" ry="2.8" fill="#3FBE72" transform="rotate(-30 36 32)" />
      <ellipse cx="60" cy="32" rx="5" ry="2.8" fill="#3FBE72" transform="rotate(30 60 32)" />
      {flowers.map((f) => (
        <g key={f.x}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle
              key={a}
              cx={f.x + 4.6 * Math.cos((a * Math.PI) / 180)}
              cy={f.y + 4.6 * Math.sin((a * Math.PI) / 180)}
              r="3.4"
              fill={f.petal}
              stroke="#17324F"
              strokeWidth="1.5"
            />
          ))}
          <circle cx={f.x} cy={f.y} r="3" fill={f.center} stroke="#17324F" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  );
}

function RobotAntenna({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      <defs>
        <linearGradient id="robot-antenna-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DCE6F2" />
          <stop offset="1" stopColor="#9FB2C8" />
        </linearGradient>
      </defs>
      {/* headband */}
      <rect x="28" y="24" width="40" height="9" rx="4.5" fill="url(#robot-antenna-metal)" stroke="#4A5A70" strokeWidth="3" />
      {/* side bolts */}
      <circle cx="32" cy="28.5" r="2.4" fill="#4CC9F0" stroke="#2A9FD8" strokeWidth="1.5" />
      <circle cx="64" cy="28.5" r="2.4" fill="#4CC9F0" stroke="#2A9FD8" strokeWidth="1.5" />
      {/* antenna stem + spring */}
      <path d="M48,24 L48,12" fill="none" stroke="#4A5A70" strokeWidth="3.5" />
      <path d="M44,16 q4,-3 8,0 q-4,3 -8,0" fill="none" stroke="#4A5A70" strokeWidth="2" />
      {/* bobble */}
      <circle cx="48" cy="8" r="5" fill="#FF6B6B" stroke="#C0392B" strokeWidth="2.5" />
      <circle cx="46.4" cy="6.4" r="1.5" fill="#FFFFFF" opacity="0.9" />
      {/* signal waves */}
      <path d="M40,6 a9,9 0 0 1 0,-4" fill="none" stroke="#4CC9F0" strokeWidth="2" opacity="0.8" />
      <path d="M56,6 a9,9 0 0 0 0,-4" fill="none" stroke="#4CC9F0" strokeWidth="2" opacity="0.8" />
    </svg>
  );
}

function PirateHat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* tricorn */}
      <path
        d="M20,26 C26,12 38,8 48,14 C58,8 70,12 76,26 C66,22 58,24 48,30 C38,24 30,22 20,26 Z"
        fill="#2B2B3A"
        stroke="#14141F"
        strokeWidth="3"
      />
      {/* gold trim */}
      <path
        d="M20,26 C30,22 38,24 48,30 C58,24 66,22 76,26"
        fill="none"
        stroke="#FFC93C"
        strokeWidth="2.5"
      />
      {/* skull coin emblem */}
      <circle cx="48" cy="20" r="6.5" fill="#FFC93C" stroke="#B57E12" strokeWidth="2.5" />
      <circle cx="45.8" cy="19" r="1.6" fill="#2B2B3A" />
      <circle cx="50.2" cy="19" r="1.6" fill="#2B2B3A" />
      <path d="M45,23.5 h6" stroke="#2B2B3A" strokeWidth="1.8" />
    </svg>
  );
}

function ButterflyWings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      <defs>
        <linearGradient id="butterfly-wings-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F7A8D8" />
          <stop offset="1" stopColor="#B983FF" />
        </linearGradient>
      </defs>
      {/* left wings */}
      <path
        d="M28,52 C14,36 6,38 8,50 C10,60 18,62 24,60 C16,64 14,74 20,80 C26,86 32,78 30,66 Z"
        fill="url(#butterfly-wings-wing)"
        stroke="#6D3FC0"
        strokeWidth="3"
      />
      {/* right wings */}
      <path
        d="M68,52 C82,36 90,38 88,50 C86,60 78,62 72,60 C80,64 82,74 76,80 C70,86 64,78 66,66 Z"
        fill="url(#butterfly-wings-wing)"
        stroke="#6D3FC0"
        strokeWidth="3"
      />
      {/* spots */}
      <circle cx="16" cy="52" r="3" fill="#FFFFFF" opacity="0.9" />
      <circle cx="20" cy="72" r="2.4" fill="#FFFFFF" opacity="0.9" />
      <circle cx="80" cy="52" r="3" fill="#FFFFFF" opacity="0.9" />
      <circle cx="76" cy="72" r="2.4" fill="#FFFFFF" opacity="0.9" />
      {/* sparkles */}
      <path d="M10,34 l1.6,3.4 3.4,1.6 -3.4,1.6 -1.6,3.4 -1.6,-3.4 -3.4,-1.6 3.4,-1.6 Z" fill="#FFD968" />
      <path d="M86,34 l1.6,3.4 3.4,1.6 -3.4,1.6 -1.6,3.4 -1.6,-3.4 -3.4,-1.6 3.4,-1.6 Z" fill="#FFD968" />
    </svg>
  );
}

function StarCrown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      <defs>
        <linearGradient id="star-crown-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE08A" />
          <stop offset="1" stopColor="#E8A93C" />
        </linearGradient>
      </defs>
      {/* points */}
      <path
        d="M32,26 L36,10 L42,22 L48,6 L54,22 L60,10 L64,26 Z"
        fill="url(#star-crown-gold)"
        stroke="#B57E12"
        strokeWidth="3"
      />
      {/* star tips */}
      {[
        [36, 10],
        [48, 6],
        [60, 10],
      ].map(([x, y]) => (
        <path
          key={x}
          d={`M${x},${y - 4} l1.4,2.8 3,0.6 -2.2,2.1 0.5,3 -2.7,-1.4 -2.7,1.4 0.5,-3 -2.2,-2.1 3,-0.6 Z`}
          fill="#FFF3C4"
          stroke="#B57E12"
          strokeWidth="1.5"
        />
      ))}
      {/* band */}
      <rect x="30" y="24" width="36" height="10" rx="5" fill="url(#star-crown-gold)" stroke="#B57E12" strokeWidth="3" />
      {/* jewels */}
      <circle cx="40" cy="29" r="2.6" fill="#FF6B6B" stroke="#B57E12" strokeWidth="1.5" />
      <circle cx="48" cy="29" r="2.6" fill="#4CC9F0" stroke="#B57E12" strokeWidth="1.5" />
      <circle cx="56" cy="29" r="2.6" fill="#9B5DE5" stroke="#B57E12" strokeWidth="1.5" />
    </svg>
  );
}

function SupernovaCape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      <defs>
        <linearGradient id="supernova-cape-fabric" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7B5FF0" />
          <stop offset="1" stopColor="#3D2B8F" />
        </linearGradient>
      </defs>
      {/* cape flowing behind shoulders */}
      <path
        d="M36,72 C28,78 22,86 20,96 L76,96 C74,86 68,78 60,72 C54,76 42,76 36,72 Z"
        fill="url(#supernova-cape-fabric)"
        stroke="#241A5E"
        strokeWidth="3"
      />
      {/* collar */}
      <path d="M36,72 C42,76 54,76 60,72 L58,66 C52,69 44,69 38,66 Z" fill="#FFC93C" stroke="#B57E12" strokeWidth="2.5" />
      {/* star sparkles on fabric */}
      <path d="M32,88 l1.6,3.2 3.2,1.6 -3.2,1.6 -1.6,3.2 -1.6,-3.2 -3.2,-1.6 3.2,-1.6 Z" fill="#FFE08A" />
      <path d="M62,84 l1.3,2.6 2.6,1.3 -2.6,1.3 -1.3,2.6 -1.3,-2.6 -2.6,-1.3 2.6,-1.3 Z" fill="#FFE08A" />
      <circle cx="48" cy="90" r="2" fill="#FFE08A" />
    </svg>
  );
}

function WizardHat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      <defs>
        <linearGradient id="wizard-hat-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9B5DE5" />
          <stop offset="1" stopColor="#5A2EA6" />
        </linearGradient>
      </defs>
      {/* tilted cone */}
      <path
        d="M34,28 L50,4 L62,26 Z"
        fill="url(#wizard-hat-purple)"
        stroke="#3A1D6E"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* golden tip */}
      <circle cx="50" cy="5" r="3.5" fill="#FFD968" stroke="#B57E12" strokeWidth="2" />
      {/* wide brim */}
      <ellipse cx="48" cy="28" rx="24" ry="6" fill="url(#wizard-hat-purple)" stroke="#3A1D6E" strokeWidth="3" />
      {/* magic star */}
      <path
        d="M43,15 l1.3,2.6 2.9,0.4 -2.1,2 0.5,2.9 -2.6,-1.4 -2.6,1.4 0.5,-2.9 -2.1,-2 2.9,-0.4 Z"
        fill="#FFE66D"
      />
      {/* little moon */}
      <path d="M57,13 a5,5 0 1 0 4.2,8.8 A4,4 0 1 1 57,13 Z" fill="#FFF3C4" />
    </svg>
  );
}

function ChefHat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* puffy top */}
      <path
        d="M32,22 C28,12 36,6 42,10 C44,4 54,4 56,10 C62,6 70,12 66,22 Z"
        fill="#FFFFFF"
        stroke="#8A9BB0"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* band */}
      <rect x="32" y="20" width="34" height="9" rx="4.5" fill="#EAF0F7" stroke="#8A9BB0" strokeWidth="3" />
      {/* band stripes */}
      <path d="M42,20 L42,29 M54,20 L54,29" stroke="#8A9BB0" strokeWidth="2" opacity="0.6" />
    </svg>
  );
}

function AstronautHelmet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* antenna */}
      <path d="M48,2 L48,8" fill="none" stroke="#4A5A70" strokeWidth="3" />
      <circle cx="48" cy="4" r="3" fill="#FF6B6B" stroke="#C0392B" strokeWidth="2" />
      {/* glass dome */}
      <circle cx="48" cy="24" r="20" fill="#BFE9F7" opacity="0.5" />
      <circle cx="48" cy="24" r="20" fill="none" stroke="#E8823C" strokeWidth="4" />
      {/* orange lower rim */}
      <path d="M28,24 a20,20 0 0 0 40,0" fill="none" stroke="#E8823C" strokeWidth="5" />
      {/* glass shine */}
      <path d="M36,14 a12,12 0 0 1 6,-6" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.9" />
      {/* side bolts */}
      <circle cx="29" cy="30" r="2.6" fill="#FFC93C" stroke="#B57E12" strokeWidth="1.5" />
      <circle cx="67" cy="30" r="2.6" fill="#FFC93C" stroke="#B57E12" strokeWidth="1.5" />
    </svg>
  );
}

function FirefighterHelmet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* dome */}
      <path
        d="M30,26 C30,12 38,6 48,6 C58,6 66,12 66,26 Z"
        fill="#E14E4E"
        stroke="#8E1F1F"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* brim */}
      <ellipse cx="48" cy="27" rx="26" ry="6" fill="#E14E4E" stroke="#8E1F1F" strokeWidth="3" />
      {/* front shield */}
      <path
        d="M48,10 l5,3 -1,8 -4,3 -4,-3 -1,-8 Z"
        fill="#FFC93C"
        stroke="#B57E12"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* shine */}
      <path d="M36,14 C38,10 42,8 46,8" fill="none" stroke="#FFFFFF" strokeWidth="2.5" opacity="0.7" />
    </svg>
  );
}

function StarGlasses({ className }: { className?: string }) {
  const star = (cx: number, cy: number) =>
    `M${cx},${cy - 11} l3.2,6.5 7.2,1 -5.2,5 1.2,7.1 -6.4,-3.4 -6.4,3.4 1.2,-7.1 -5.2,-5 7.2,-1 Z`;
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* left star lens */}
      <path d={star(37, 52)} fill="#FFE66D" stroke="#B57E12" strokeWidth="3" strokeLinejoin="round" />
      {/* right star lens */}
      <path d={star(59, 52)} fill="#FFE66D" stroke="#B57E12" strokeWidth="3" strokeLinejoin="round" />
      {/* glints */}
      <circle cx="37" cy="52" r="2" fill="#FFFFFF" />
      <circle cx="59" cy="52" r="2" fill="#FFFFFF" />
      {/* bridge + temples */}
      <path d="M47,50 Q48,46 49,46 Q50,46 51,50" fill="none" stroke="#B57E12" strokeWidth="3" />
      <path d="M27,50 L17,46" fill="none" stroke="#B57E12" strokeWidth="3" />
      <path d="M69,50 L79,46" fill="none" stroke="#B57E12" strokeWidth="3" />
    </svg>
  );
}

function SuperheroMask({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* mask band */}
      <path
        d="M20,48 C30,42 42,42 48,48 C54,42 66,42 76,48 L72,60 C64,55 56,55 48,60 C40,55 32,55 24,60 Z"
        fill="#E14E4E"
        stroke="#8E1F1F"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* eye holes */}
      <ellipse cx="37" cy="52" rx="6" ry="4.5" fill="#FFFFFF" />
      <ellipse cx="59" cy="52" rx="6" ry="4.5" fill="#FFFFFF" />
      {/* lightning emblem */}
      <path
        d="M50,42 l-4,8 3,0 -2,6 6,-9 -3,0 3,-5 Z"
        fill="#FFC93C"
        stroke="#B57E12"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* tie straps */}
      <path d="M20,48 L12,44" fill="none" stroke="#8E1F1F" strokeWidth="3" />
      <path d="M76,48 L84,44" fill="none" stroke="#8E1F1F" strokeWidth="3" />
    </svg>
  );
}

function FrogBackpack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* shoulder straps */}
      <path d="M34,58 C30,70 30,80 32,92" fill="none" stroke="#7A4E2D" strokeWidth="5" />
      <path d="M62,58 C66,70 66,80 64,92" fill="none" stroke="#7A4E2D" strokeWidth="5" />
      {/* backpack body at the side */}
      <rect x="66" y="62" width="20" height="24" rx="8" fill="#3FBE72" stroke="#1F7A45" strokeWidth="3" />
      {/* frog head peeking out */}
      <circle cx="76" cy="60" r="9" fill="#3FBE72" stroke="#1F7A45" strokeWidth="3" />
      {/* frog eyes */}
      <circle cx="72" cy="52" r="4" fill="#FFFFFF" stroke="#1F7A45" strokeWidth="2" />
      <circle cx="80" cy="52" r="4" fill="#FFFFFF" stroke="#1F7A45" strokeWidth="2" />
      <circle cx="72" cy="52" r="1.8" fill="#17324F" />
      <circle cx="80" cy="52" r="1.8" fill="#17324F" />
      {/* smile */}
      <path d="M71,62 Q76,66 81,62" fill="none" stroke="#1F7A45" strokeWidth="2" />
      {/* pocket */}
      <rect x="69" y="72" width="14" height="10" rx="5" fill="#2E9E5B" stroke="#1F7A45" strokeWidth="2" />
    </svg>
  );
}

function PartyBalloon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" aria-hidden="true" {...P}>
      {/* string */}
      <path d="M78,60 C76,72 80,82 76,94" fill="none" stroke="#8A9BB0" strokeWidth="2.5" />
      {/* balloon */}
      <ellipse cx="78" cy="42" rx="13" ry="16" fill="#FF7BAC" stroke="#C2437F" strokeWidth="3" />
      {/* knot */}
      <path d="M78,58 l-3,4 6,0 Z" fill="#C2437F" />
      {/* shine */}
      <ellipse cx="73" cy="35" rx="3.5" ry="6" fill="#FFFFFF" opacity="0.6" />
      {/* dots */}
      <circle cx="80" cy="40" r="2" fill="#FFFFFF" opacity="0.8" />
      <circle cx="75" cy="48" r="2" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

const ART: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  'explorer-hat': ExplorerHat,
  'sleepy-nightcap': SleepyNightcap,
  'sailor-cap': SailorCap,
  'rainbow-glasses': RainbowGlasses,
  'flower-crown': FlowerCrown,
  'robot-antenna': RobotAntenna,
  'pirate-hat': PirateHat,
  'butterfly-wings': ButterflyWings,
  'star-crown': StarCrown,
  'supernova-cape': SupernovaCape,
  'wizard-hat': WizardHat,
  'chef-hat': ChefHat,
  'astronaut-helmet': AstronautHelmet,
  'firefighter-helmet': FirefighterHelmet,
  'star-glasses': StarGlasses,
  'superhero-mask': SuperheroMask,
  'frog-backpack': FrogBackpack,
  'party-balloon': PartyBalloon,
};

/** Render an outfit's SVG overlay. Same 96x96 viewBox as the avatars — stack absolutely on top. */
export function OutfitArt({ outfitId, className }: { outfitId: string; className?: string }) {
  const Art = ART[outfitId];
  if (!Art) return null;
  return <Art className={className} />;
}

export const OUTFIT_ART_IDS = Object.keys(ART);
