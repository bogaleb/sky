import { redirect } from 'next/navigation';
import { requireParent } from '@/lib/auth';
import PinForm from '@/components/pin-form';

export const dynamic = 'force-dynamic';

export default async function PinPage() {
  const { profile } = await requireParent();
  // A PIN already exists — nothing to do here.
  if (profile?.has_pin) redirect('/onboarding/children');
  return <PinForm />;
}
