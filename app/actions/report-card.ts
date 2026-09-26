'use server';

import { requireParentZone } from '@/lib/parent-zone';
import { createClient } from '@/lib/supabase/server';
import { starsFromMastery } from '@/lib/kid/mastery';

/**
 * One row of the printable Report Card: a single curriculum skill with its
 * island grouping and a 0-5 star mastery rating.
 */
export interface SkillMasteryRow {
  /** The skill's UUID in the skills table. */
  skillId: string;
  /** Stable curriculum code (e.g. "letter_sounds"). */
  skillCode: string;
  skillName: string;
  subjectCode: string;
  subjectName: string;
  islandName: string;
  /** 0 = not yet practiced, otherwise the child's current level (1-5). */
  stars: number;
  practicedAt: string | null;
  status: 'emerging' | 'developing' | 'proficient' | 'mastered' | 'not_started';
}

const SUBJECT_NAMES: Record<string, string> = {
  reading: 'Reading',
  math: 'Math',
  writing: 'Writing',
  science: 'Science',
  geography: 'Geography',
  coding: 'Coding',
  music: 'Music',
  drawing: 'Drawing',
  feelings: 'Feelings & Focus',
};

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

/**
 * Read-only report card: every curriculum skill grouped by island, with a
 * 0-5 star rating from the same skill_mastery data the dashboard uses.
 * Skills the child has never practiced appear with 0 stars.
 *
 * Never writes. The child must belong to the signed-in parent.
 */
export async function getSkillMastery(childId: string): Promise<SkillMasteryRow[]> {
  const supabase = await requireChild(childId);
  await requireParentZone(supabase);

  const [{ data: skills }, { data: subjectRows }, { data: masteryRows }] = await Promise.all([
    supabase.from('skills').select('id, subject_code, code, name, sort_order').order('sort_order'),
    supabase.from('subjects').select('code, name, island_name'),
    supabase
      .from('skill_mastery')
      .select('skill_id, current_level, status, last_practiced_at')
      .eq('child_id', childId),
  ]);

  const islandBySubject = new Map<string, string>();
  const subjectNameByCode = new Map<string, string>();
  for (const s of (subjectRows ?? []) as Array<{ code: string; name: string; island_name: string }>) {
    islandBySubject.set(s.code, s.island_name);
    subjectNameByCode.set(s.code, s.name);
  }

  const masteryBySkill = new Map<
    string,
    { current_level: number; status: string; last_practiced_at: string | null }
  >();
  for (
    const m of (masteryRows ?? []) as Array<{
      skill_id: string;
      current_level: number;
      status: string;
      last_practiced_at: string | null;
    }>
  ) {
    masteryBySkill.set(m.skill_id, m);
  }

  const rows: SkillMasteryRow[] = [];
  for (
    const s of (skills ?? []) as Array<{
      id: string;
      subject_code: string;
      code: string;
      name: string;
    }>
  ) {
    const m = masteryBySkill.get(s.id);
    const status = (m?.status ?? 'not_started') as SkillMasteryRow['status'];
    rows.push({
      skillId: s.id,
      skillCode: s.code,
      skillName: s.name,
      subjectCode: s.subject_code,
      subjectName:
        subjectNameByCode.get(s.subject_code) ?? SUBJECT_NAMES[s.subject_code] ?? s.subject_code,
      islandName: islandBySubject.get(s.subject_code) ?? '',
      stars: starsFromMastery(m?.current_level),
      practicedAt: m?.last_practiced_at ?? null,
      status,
    });
  }
  return rows;
}
