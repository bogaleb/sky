import { redirect } from 'next/navigation';
import { requireParent } from '@/lib/auth';
import { endSessionAndSwitch, getActiveChild } from '@/app/actions/profiles';
import { getSessionPlan } from '@/app/actions/learning';
import { toPlannedStep, type ServerPlanItem } from '@/lib/kid/types';
import DeckClient from '@/components/kid/deck-client';

export const dynamic = 'force-dynamic';

// Sky Deck — the kid's sky world. Loads the adaptive session plan
// server-side (answer keys never leave the server) and hands it to the
// session player: intro -> activities -> celebration.
export default async function DeckPage() {
  const { supabase } = await requireParent();
  const active = await getActiveChild();
  if (!active) redirect('/profiles');

  const { data } = await supabase
    .from('children')
    .select('id, nickname, avatar_id')
    .eq('id', active.childId)
    .single();
  if (!data) redirect('/profiles');

  let plan: ServerPlanItem[] = [];
  try {
    const res = await getSessionPlan(active.childId);
    plan = res.plan as unknown as ServerPlanItem[];
  } catch {
    plan = [];
  }

  return (
    <DeckClient
      child={{ id: data.id, nickname: data.nickname, avatarId: data.avatar_id }}
      initialSteps={plan.map(toPlannedStep)}
      sessionId={active.sessionId}
      onExit={endSessionAndSwitch}
    />
  );
}
