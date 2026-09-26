import { redirect } from 'next/navigation';
import { requireParent } from '@/lib/auth';
import { isParentZoneUnlocked } from '@/lib/parent-zone';
import Dashboard from '@/components/parent/dashboard';

export const dynamic = 'force-dynamic';

// Parent zone: PIN-gated learning reports. Visually separate from the kid
// world — calm parent styling, plain-language summaries, no kid UI.
export default async function ParentPage() {
  const { supabase, profile } = await requireParent();
  if (!profile?.has_pin) redirect('/onboarding/pin');

  // The PIN gate is enforced server-side (see lib/parent-zone.ts); this only
  // decides whether to show the gate or the reports first.
  return <Dashboard initiallyUnlocked={await isParentZoneUnlocked(supabase)} />;
}
