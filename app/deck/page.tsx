import { redirect } from 'next/navigation';
import { requireParent } from '@/lib/auth';
import { endSessionAndSwitch, getActiveChild } from '@/app/actions/profiles';
import { AVATARS } from '@/components/avatars';
import { Button, Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

// Sky Deck — the quiet moment after picking a profile. In Phase 1 it does one
// real job: it holds the open play session (started on profile tap) and closes
// it when the child finishes. The sky map and islands arrive in Phase 3.
export default async function DeckPage() {
  const { supabase } = await requireParent();
  const active = await getActiveChild();
  if (!active) redirect('/profiles');

  const { data } = await supabase
    .from('children')
    .select('id, nickname, avatar_id, age_band, created_at')
    .eq('id', active.childId)
    .single();
  if (!data) redirect('/profiles');

  const avatar = AVATARS[data.avatar_id];
  const AvatarComponent = avatar?.Component;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-parent-sky-100 via-parent-sky-50 to-white px-4 py-10">
      <Card className="w-full max-w-md text-center">
        {AvatarComponent && (
          <AvatarComponent className="mx-auto h-32 w-32 drop-shadow-[0_10px_20px_rgba(18,60,96,0.18)]" />
        )}
        <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-parent-ink-400">
          {today}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-parent-sky-900">
          Hello, {data.nickname}!
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-parent-ink-600">
          Your sky is getting ready. Captain Curio and the crew are preparing
          the floating islands for your first adventure.
        </p>
        <form action={endSessionAndSwitch} className="mt-8">
          <Button type="submit" variant="secondary" className="w-full" size="lg">
            Done for now
          </Button>
        </form>
        <p className="mt-3 text-xs text-parent-ink-400">
          This ends today’s session and returns to profile picking.
        </p>
      </Card>
    </main>
  );
}
