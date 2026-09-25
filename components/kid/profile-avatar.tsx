'use client';

import { useEffect, useState } from 'react';
import { AvatarWithOutfit } from './dress-up';
import { CustomAvatarWithOutfit } from '@/components/avatars-custom';
import { loadCustomAvatar, type AvatarDesign } from '@/lib/kid/avatar-studio';

// Profile-picker portrait: shows the child's custom Avatar Studio design when
// one is saved on this device, otherwise their preset avatar with outfits.
// Custom designs live in localStorage, so this must be a client component.
export default function ProfileAvatar({
  childId,
  avatarId,
  outfitIds,
  className,
}: {
  childId: string;
  avatarId: string;
  outfitIds: string[];
  className?: string;
}) {
  const [design, setDesign] = useState<AvatarDesign | null>(null);
  useEffect(() => {
    setDesign(loadCustomAvatar(childId));
  }, [childId]);

  if (design) {
    return <CustomAvatarWithOutfit design={design} outfitId={outfitIds} className={className} />;
  }
  return <AvatarWithOutfit avatarId={avatarId} outfitId={outfitIds} className={className} />;
}
