import { redirect } from 'next/navigation';
import { requireParent } from '@/lib/auth';
import Dashboard from '@/components/parent/dashboard';

export const dynamic = 'force-dynamic';

// Parent zone: PIN-gated learning reports. Visually separate from the kid
// world — calm parent styling, plain-language summaries, no kid UI.
export default async function ParentPage() {
  const { profile } = await requireParent();
  if (!profile?.has_pin) redirect('/onboarding/pin');

  return <Dashboard />;
}
