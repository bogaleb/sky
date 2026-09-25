import { redirect } from 'next/navigation';
import { requireParent } from '@/lib/auth';
import ChildForm from '@/components/child-form';
import ContinueButton from '@/components/continue-button';
import { AVATARS } from '@/components/avatars';
import { Card, PageShell } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface ChildRow {
  id: string;
  nickname: string;
  avatar_id: string;
  age_band: string;
}

export default async function ChildrenOnboardingPage() {
  const { supabase, profile } = await requireParent();
  if (!profile?.has_pin) redirect('/onboarding/pin');

  const { data } = await supabase
    .from('children')
    .select('id, nickname, avatar_id, age_band')
    .order('created_at', { ascending: true });
  const children = (data ?? []) as ChildRow[];

  return (
    <PageShell wide>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-parent-sky-900">
          Who is flying with us?
        </h1>
        <p className="mt-2 text-parent-ink-600">
          Add each child — a nickname, an avatar, an age band. You can add more
          any time.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ChildForm key={children.length} onAdded={() => {}} />

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-lg font-bold text-parent-ink-900">
              Your crew {children.length > 0 && `(${children.length})`}
            </h2>
            {children.length === 0 ? (
              <p className="mt-3 text-parent-ink-600">
                No children yet — add the first one to begin.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {children.map((child) => {
                  const avatar = AVATARS[child.avatar_id];
                  const AvatarComponent = avatar?.Component;
                  return (
                    <li
                      key={child.id}
                      className="flex items-center gap-3 rounded-2xl bg-parent-sky-50 px-3 py-2.5"
                    >
                      {AvatarComponent && (
                        <AvatarComponent className="h-12 w-12" />
                      )}
                      <div>
                        <p className="font-bold text-parent-ink-900">
                          {child.nickname}
                        </p>
                        <p className="text-xs text-parent-ink-600">
                          Ages {child.age_band}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <ContinueButton disabled={children.length === 0} />
        </div>
      </div>
    </PageShell>
  );
}
