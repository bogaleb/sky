import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireParent } from '@/lib/auth';
import { selectProfile } from '@/app/actions/profiles';
import { signOut } from '@/app/actions/auth';
import { AVATARS } from '@/components/avatars';
import { AvatarWithOutfit } from '@/components/kid/dress-up';
import { getEquippedOutfits } from '@/app/actions/outfits';
import { Button } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface ChildRow {
  id: string;
  nickname: string;
  avatar_id: string;
  age_band: string;
}

// One tap per child. Big avatars, no reading required — a non-reader can
// complete this screen alone.
export default async function ProfilesPage() {
  const { supabase, profile } = await requireParent();
  if (!profile?.has_pin) redirect('/onboarding/pin');

  const { data } = await supabase
    .from('children')
    .select('id, nickname, avatar_id, age_band')
    .order('created_at', { ascending: true });
  const children = (data ?? []) as ChildRow[];
  if (children.length === 0) redirect('/onboarding/children');

  // Equipped outfits per child, so the picker shows their dressed-up look.
  const outfitsByChild = new Map<string, string[]>();
  await Promise.all(
    children.map(async (c) => {
      try {
        outfitsByChild.set(c.id, await getEquippedOutfits(c.id));
      } catch {
        outfitsByChild.set(c.id, []);
      }
    })
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center justify-center px-6 py-12">
      <h1 className="text-center text-3xl font-extrabold tracking-tight text-parent-sky-900 sm:text-4xl">
        Who is playing?
      </h1>
      <p className="mt-2 text-center text-parent-ink-600">
        Tap your face to start.
      </p>

      <div className="mt-10 grid w-full grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {children.map((child) => {
          return (
            <form key={child.id} action={selectProfile}>
              <input type="hidden" name="child_id" value={child.id} />
              <button
                type="submit"
                aria-label={`Play as ${child.nickname}`}
                className="group flex w-full flex-col items-center gap-3 rounded-parent-card border border-parent-sky-100 bg-white p-6 shadow-[0_8px_30px_rgba(18,60,96,0.08)] transition-transform hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(18,60,96,0.14)]"
              >
                <AvatarWithOutfit
                  avatarId={child.avatar_id}
                  outfitId={outfitsByChild.get(child.id) ?? []}
                  className="h-24 w-24 transition-transform group-hover:scale-105 sm:h-28 sm:w-28"
                />
                <span className="text-xl font-extrabold text-parent-ink-900">
                  {child.nickname}
                </span>
              </button>
            </form>
          );
        })}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Link href="/onboarding/children">
          <Button variant="secondary">Add another child</Button>
        </Link>
        <Link href="/parent">
          <Button variant="secondary">Parent zone: learning reports</Button>
        </Link>
        <form action={signOut}>
          <Button variant="ghost" type="submit">
            Log out
          </Button>
        </form>
      </div>
    </main>
  );
}
