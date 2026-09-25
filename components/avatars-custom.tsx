'use client';

import { AVATARS } from '@/components/avatars';
import { OutfitArt } from '@/lib/kid/outfit-art';
import {
  loadCustomAvatar,
  type AccessoryId,
  type AvatarDesign,
  type EyeStyle,
  type HairColor,
  type HairStyle,
  type MouthStyle,
  type SkinTone,
  type StorageLike,
} from '@/lib/kid/avatar-studio';

/**
 * CustomAvatar — the kid-designed avatar renderer.
 * Same prop contract as the preset avatars in components/avatars:
 * ({ className }) => <svg viewBox="0 0 96 96">.
 */

const OUTLINE = '#5B3A1E';

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function Hair({ style, color, skin }: { style: HairStyle; color: HairColor; skin: SkinTone }) {
  if (style === 'none') return null;
  const stroke = shade(color, -30);
  if (style === 'curly') {
    return (
      <g fill={color} stroke={stroke} strokeWidth="2.5">
        <circle cx="30" cy="36" r="7" />
        <circle cx="37" cy="28" r="7.5" />
        <circle cx="48" cy="25" r="8" />
        <circle cx="59" cy="28" r="7.5" />
        <circle cx="66" cy="36" r="7" />
        <circle cx="27" cy="46" r="6" />
        <circle cx="69" cy="46" r="6" />
      </g>
    );
  }
  if (style === 'straight') {
    return (
      <g>
        <path d="M27,48 C27,26 69,26 69,48 L69,44 C69,28 27,28 27,44 Z" fill={color} stroke={stroke} strokeWidth="2.5" />
        <path d="M27,44 C27,30 40,24 48,24 C56,24 69,30 69,44 C60,34 36,34 27,44 Z" fill={color} />
        <rect x="24" y="42" width="7" height="26" rx="3.5" fill={color} stroke={stroke} strokeWidth="2.5" />
        <rect x="65" y="42" width="7" height="26" rx="3.5" fill={color} stroke={stroke} strokeWidth="2.5" />
      </g>
    );
  }
  if (style === 'spiky') {
    return (
      <g fill={color} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M28,44 L32,22 L40,40 Z" />
        <path d="M40,40 L48,18 L56,40 Z" />
        <path d="M56,40 L64,22 L68,44 Z" />
        <path d="M28,44 C36,36 60,36 68,44 L68,40 C60,32 36,32 28,40 Z" fill={color} />
      </g>
    );
  }
  if (style === 'buns') {
    return (
      <g fill={color} stroke={stroke} strokeWidth="2.5">
        <path d="M28,46 C28,28 68,28 68,46 C58,36 38,36 28,46 Z" />
        <circle cx="24" cy="30" r="9" />
        <circle cx="72" cy="30" r="9" />
        <circle cx="24" cy="30" r="3.5" fill={shade(color, 40)} stroke="none" />
        <circle cx="72" cy="30" r="3.5" fill={shade(color, 40)} stroke="none" />
      </g>
    );
  }
  // mohawk
  return (
    <g fill={color} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round">
      <path d="M42,34 L42,12 L48,20 L54,12 L54,34 Z" />
      <path d="M40,36 C44,32 52,32 56,36 L56,32 C52,28 44,28 40,32 Z" fill={color} />
    </g>
  );
}

function Eyes({ style }: { style: EyeStyle }) {
  const white = '#FFFFFF';
  const pupil = '#2B1D12';
  if (style === 'happy') {
    return (
      <g fill="none" stroke={pupil} strokeWidth="3.5">
        <path d="M31,56 Q38,48 45,56" />
        <path d="M51,56 Q58,48 65,56" />
      </g>
    );
  }
  if (style === 'sleepy') {
    return (
      <g>
        <ellipse cx="38" cy="56" rx="5" ry="5.5" fill={white} stroke={OUTLINE} strokeWidth="2.5" />
        <ellipse cx="58" cy="56" rx="5" ry="5.5" fill={white} stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="32" y="46" width="12" height="7" rx="3" fill={OUTLINE} opacity="0.85" />
        <rect x="52" y="46" width="12" height="7" rx="3" fill={OUTLINE} opacity="0.85" />
        <circle cx="38" cy="58" r="2" fill={pupil} />
        <circle cx="58" cy="58" r="2" fill={pupil} />
      </g>
    );
  }
  if (style === 'starry') {
    const star = (cx: number, cy: number) =>
      `M${cx},${cy - 6} L${cx + 1.8},${cy - 1.8} L${cx + 6},${cy - 1.5} L${cx + 2.6},${cy + 1.4} L${cx + 3.8},${cy + 5.6} L${cx},${cy + 3} L${cx - 3.8},${cy + 5.6} L${cx - 2.6},${cy + 1.4} L${cx - 6},${cy - 1.5} L${cx - 1.8},${cy - 1.8} Z`;
    return (
      <g fill="#F5B301" stroke="#B45309" strokeWidth="1.8">
        <path d={star(38, 55)} />
        <path d={star(58, 55)} />
      </g>
    );
  }
  if (style === 'wink') {
    return (
      <g>
        <ellipse cx="38" cy="56" rx="4.5" ry="5.2" fill={white} stroke={OUTLINE} strokeWidth="2.5" />
        <circle cx="38" cy="57" r="2.4" fill={pupil} />
        <circle cx="38.9" cy="56" r="1" fill={white} />
        <path d="M51,56 Q58,60 65,56" fill="none" stroke={pupil} strokeWidth="3.5" />
      </g>
    );
  }
  if (style === 'lashes') {
    return (
      <g>
        <ellipse cx="38" cy="56" rx="4.5" ry="5.2" fill={white} stroke={OUTLINE} strokeWidth="2.5" />
        <ellipse cx="58" cy="56" rx="4.5" ry="5.2" fill={white} stroke={OUTLINE} strokeWidth="2.5" />
        <circle cx="38" cy="57" r="2.4" fill={pupil} />
        <circle cx="58" cy="57" r="2.4" fill={pupil} />
        <circle cx="38.9" cy="56" r="1" fill={white} />
        <circle cx="58.9" cy="56" r="1" fill={white} />
        <path d="M31,52 L27,49 M65,52 L69,49" stroke={pupil} strokeWidth="2.5" />
      </g>
    );
  }
  // round (default)
  return (
    <g>
      <ellipse cx="38" cy="56" rx="4.5" ry="5.2" fill={white} stroke={OUTLINE} strokeWidth="2.5" />
      <ellipse cx="58" cy="56" rx="4.5" ry="5.2" fill={white} stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="38" cy="57" r="2.4" fill={pupil} />
      <circle cx="58" cy="57" r="2.4" fill={pupil} />
      <circle cx="38.9" cy="56" r="1" fill={white} />
      <circle cx="58.9" cy="56" r="1" fill={white} />
    </g>
  );
}

function Mouth({ style }: { style: MouthStyle }) {
  const dark = '#7A3B2E';
  const line = '#2B1D12';
  if (style === 'grin') {
    return (
      <g>
        <path d="M36,64 Q48,78 60,64 Q48,68 36,64 Z" fill={dark} />
        <rect x="41" y="65" width="5" height="4.5" rx="1" fill="#FFFFFF" />
        <rect x="48" y="65" width="5" height="4.5" rx="1" fill="#FFFFFF" />
      </g>
    );
  }
  if (style === 'open') {
    return <ellipse cx="48" cy="67" rx="5" ry="6" fill={dark} stroke={line} strokeWidth="2" />;
  }
  if (style === 'smirk') {
    return <path d="M38,65 Q50,70 60,62" fill="none" stroke={line} strokeWidth="3" />;
  }
  if (style === 'small-o') {
    return <circle cx="48" cy="67" r="3.5" fill="none" stroke={line} strokeWidth="3" />;
  }
  if (style === 'calm') {
    return <path d="M40,66 Q48,68 56,66" fill="none" stroke={line} strokeWidth="3" />;
  }
  // smile (default)
  return <path d="M38,64 Q48,72 58,64" fill="none" stroke={line} strokeWidth="3.5" />;
}

function Accessory({ id, hairColor }: { id: AccessoryId; hairColor: HairColor }) {
  if (id === 'none') return null;
  if (id === 'star-clip') {
    return (
      <g>
        <path
          d="M70,34 l2.2,4.4 4.9,0.7 -3.5,3.5 0.8,4.9 -4.4,-2.3 -4.4,2.3 0.8,-4.9 -3.5,-3.5 4.9,-0.7 Z"
          fill="#F5B301"
          stroke="#B45309"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (id === 'glasses') {
    return (
      <g fill="none" stroke="#1E3A5F" strokeWidth="3">
        <rect x="29" y="48" width="17" height="14" rx="6" fill="#CDEBFA" opacity="0.55" />
        <rect x="50" y="48" width="17" height="14" rx="6" fill="#CDEBFA" opacity="0.55" />
        <path d="M46,54 Q48,52 50,54" />
      </g>
    );
  }
  if (id === 'bow') {
    return (
      <g>
        <path d="M48,26 L32,16 L34,30 Z" fill="#EC4899" stroke="#BE185D" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M48,26 L64,16 L62,30 Z" fill="#EC4899" stroke="#BE185D" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="48" cy="26" r="5" fill="#F9A8D4" stroke="#BE185D" strokeWidth="2.5" />
      </g>
    );
  }
  if (id === 'cap') {
    return (
      <g>
        <path d="M28,42 C28,24 68,24 68,42 L68,38 C68,26 28,26 28,38 Z" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="2.5" />
        <ellipse cx="48" cy="40" rx="24" ry="5" fill="#2563EB" stroke="#1E3A8A" strokeWidth="2.5" />
        <circle cx="48" cy="26" r="3.5" fill="#F5B301" stroke="#B45309" strokeWidth="2" />
      </g>
    );
  }
  // earrings
  return (
    <g>
      <circle cx="26" cy="58" r="3" fill="#F5B301" stroke="#B45309" strokeWidth="2" />
      <circle cx="70" cy="58" r="3" fill="#F5B301" stroke="#B45309" strokeWidth="2" />
    </g>
  );
}

export default function CustomAvatar({ design, className }: { design: AvatarDesign; className?: string }) {
  const gid = `custom-skin-${design.skin.replace('#', '')}`;
  return (
    <svg viewBox="0 0 96 96" className={className} role="img" strokeLinecap="round" strokeLinejoin="round">
      <title>My avatar</title>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(design.skin, 12)} />
          <stop offset="1" stopColor={shade(design.skin, -14)} />
        </linearGradient>
      </defs>
      <g className="avatar-bob">
        {/* shirt */}
        <path d="M24,96 C24,84 36,78 48,78 C60,78 72,84 72,96 Z" fill="#2FA39A" stroke="#1E7A74" strokeWidth="3" />
        <g className="avatar-tilt">
          <Hair style={design.hair.style} color={design.hair.color} skin={design.skin} />
          {/* face */}
          <circle cx="48" cy="50" r="21" fill={`url(#${gid})`} stroke={OUTLINE} strokeWidth="3" />
          <g className="avatar-blink">
            <Eyes style={design.eyes} />
          </g>
          <Mouth style={design.mouth} />
          {/* cheeks + nose */}
          <circle cx="33" cy="62" r="3.2" fill={shade(design.skin, -34)} opacity="0.55" />
          <circle cx="63" cy="62" r="3.2" fill={shade(design.skin, -34)} opacity="0.55" />
          <path d="M46,60 Q48,61.5 50,60" fill="none" stroke={OUTLINE} strokeWidth="2" />
          <Accessory id={design.accessory} hairColor={design.hair.color} />
        </g>
      </g>
    </svg>
  );
}

/**
 * Custom avatar portrait with outfit overlays — same stacking approach as
 * AvatarWithOutfit in dress-up.tsx (OutfitArt is absolutely positioned over
 * the same 96x96 viewBox).
 */
export function CustomAvatarWithOutfit({
  design,
  outfitId,
  className,
}: {
  design: AvatarDesign;
  outfitId?: string | string[] | null;
  className?: string;
}) {
  const ids = Array.isArray(outfitId) ? outfitId : outfitId ? [outfitId] : [];
  return (
    <span className={`relative inline-block ${className ?? ''}`}>
      <CustomAvatar design={design} className="h-full w-full" />
      {ids.map((id) => (
        <OutfitArt key={id} outfitId={id} className="absolute inset-0 h-full w-full" />
      ))}
    </span>
  );
}

/**
 * Resolve which avatar component to render for a child: their custom
 * design when one is saved, otherwise their preset avatarId.
 *
 * Client-side only: custom designs live in localStorage, so on the server
 * (e.g. app/profiles/page.tsx) this falls back to the preset. Mount it
 * behind a client component to see custom designs there.
 */
export function avatarComponentFor(
  childId: string,
  avatarId: string,
  store?: StorageLike | null
): (props: { className?: string }) => React.JSX.Element {
  const design = loadCustomAvatar(childId, store === undefined ? undefined : store);
  if (design) {
    const Bound = ({ className }: { className?: string }) => (
      <CustomAvatar design={design} className={className} />
    );
    return Bound;
  }
  return (AVATARS[avatarId] ?? AVATARS.curio).Component;
}
