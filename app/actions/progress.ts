'use server';

import { createClient } from '@/lib/supabase/server';

/** Per-subject progress for the sky map: mastered skills / total skills. */
export interface IslandProgress {
  subjectCode: string;
  mastered: number;
  total: number;
}

async function requireChild(childId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: child } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single();
  if (!child) throw new Error('Child not found.');
  return supabase;
}

export async function getIslandProgress(childId: string): Promise<IslandProgress[]> {
  const supabase = await requireChild(childId);

  // Total skills per subject.
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('subject_code');
  if (skillsError) throw new Error('Could not load skills.');
  const totals = new Map<string, number>();
  for (const s of (skills ?? []) as Array<{ subject_code: string }>) {
    totals.set(s.subject_code, (totals.get(s.subject_code) ?? 0) + 1);
  }

  // Mastered (or proficient+) skills per subject for this child.
  const { data: mastery, error: masteryError } = await supabase
    .from('skill_mastery')
    .select('skill_id, status')
    .eq('child_id', childId)
    .in('status', ['proficient', 'mastered']);
  if (masteryError) throw new Error('Could not load progress.');

  const { data: skillRows } = await supabase
    .from('skills')
    .select('id, subject_code');
  const subjectBySkill = new Map<string, string>();
  for (const s of (skillRows ?? []) as Array<{ id: string; subject_code: string }>) {
    subjectBySkill.set(s.id, s.subject_code);
  }

  const mastered = new Map<string, number>();
  for (const m of (mastery ?? []) as Array<{ skill_id: string }>) {
    const code = subjectBySkill.get(m.skill_id);
    if (code) mastered.set(code, (mastered.get(code) ?? 0) + 1);
  }

  return [...totals.entries()].map(([subjectCode, total]) => ({
    subjectCode,
    mastered: mastered.get(subjectCode) ?? 0,
    total,
  }));
}
