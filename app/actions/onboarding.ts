'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { childSchema, pinSchema } from '@/lib/validation';

export interface ActionResult {
  error?: string;
}

// --- Parent PIN ------------------------------------------------------------

export async function setPin(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = pinSchema.safeParse({
    pin: formData.get('pin'),
    confirm: formData.get('confirm'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.rpc('set_parent_pin', {
    pin: parsed.data.pin,
  });
  if (error) return { error: 'We could not save that PIN. Please try again.' };

  redirect('/onboarding/children');
}

// --- Child profiles --------------------------------------------------------

export async function createChild(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = childSchema.safeParse({
    nickname: formData.get('nickname'),
    avatar_id: formData.get('avatar_id'),
    age_band: formData.get('age_band'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: child, error } = await supabase
    .from('children')
    .insert({
      parent_id: user.id,
      nickname: parsed.data.nickname,
      avatar_id: parsed.data.avatar_id,
      age_band: parsed.data.age_band,
    })
    .select('id')
    .single();

  if (error || !child) {
    if (error?.code === '23505') {
      return {
        error: `"${parsed.data.nickname}" is already one of your children. Pick a different nickname.`,
      };
    }
    return { error: 'We could not create that profile. Please try again.' };
  }

  // Materialize default settings now so the parent dashboard (Phase 8) always
  // has a row to read.
  await supabase.from('parent_settings').insert({ child_id: child.id });

  revalidatePath('/onboarding/children');
  return {};
}

export async function finishOnboarding(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { count } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', user.id);

  if (!count) {
    return { error: 'Add at least one child to continue.' };
  }
  redirect('/profiles');
}
