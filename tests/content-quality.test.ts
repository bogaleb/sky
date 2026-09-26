import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Content-quality track (2026-09-26): 24 worksheet-style multiple_choice
// activities were converted 1-for-1 into genuinely interactive
// manipulatives via supabase/seed_generators/content_quality.py.
// Baseline before: 880 activities, 322 multiple_choice (36.59%).
// After: 880 activities, 298 multiple_choice (33.86%).

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bank: {
  skill: string;
  level: number;
  kind: string;
  prompt_text: string;
  card: Record<string, unknown>;
  answer: Record<string, unknown>;
  points: number;
  min_age_band: string;
  max_age_band: string;
}[] = JSON.parse(readFileSync(join(root, 'supabase', 'seed_phase3.json'), 'utf8'));

const mig = readFileSync(
  join(root, 'supabase', 'migrations', '20260926000200_content_quality.sql'),
  'utf8'
);
const historical = readFileSync(
  join(root, 'supabase', 'migrations', '20260925000300_content_refresh.sql'),
  'utf8'
);

// The 24 curated conversions: (skill, level, new kind, new prompt).
const CONVERSIONS: [string, number, string, string][] = [
  ['alphabet', 2, 'sequence', 'Pip was shelving books: A, B... then a gust blew two off the shelf! Put them back in ABC order.'],
  ['blending', 2, 'sequence', "Pip sounded out 'mmm-aaa-puh' but the letters bounced away! Put them in order to build the word he read."],
  ['blending', 3, 'sequence', "Hoot is stuck on a bedtime word: 'sss-uuu-nnn'. Line up the letters to build the word!"],
  ['blending', 5, 'sort', "Hoot's flying words got mixed up in the wind! Sort them: words with one part, and words with more parts."],
  ['trace_letters', 2, 'trace', 'Pip\'s cheese sign says CHE_SE now — the sprites ate a letter! Trace the missing letter E to fix his sign.'],
  ['trace_letters', 3, 'trace', "The sprites mixed up the letters on Pip's note! Trace the letter b to show Pip which one is his."],
  ['build_words', 1, 'trace', "Pip's cheese sign says CHE_SE — a sprite took a bite! Trace the missing letter E to fix the sign."],
  ['build_words', 3, 'trace', "Pip's new sign says THU_B — a sprite is sitting on a letter! Trace the missing letter M to finish his sign."],
  ['count', 1, 'tap_count', 'Sprocket dropped his gears — plip, plop! Tap each gear to count them all.'],
  ['count', 2, 'tap_count', "Milo's counting machine is blinking! Tap once for each blink to count them."],
  ['count', 3, 'tap_count', 'Sprocket packed a box of crystal bolts. Tap each bolt to count them all!'],
  ['cardinality', 1, 'tap_count', 'Sprocket dropped 4 gears into the oil pan — sploosh! Tap each gear to count them.'],
  ['cardinality', 2, 'tap_count', 'Bolt flashed into the counting jar! Tap each flash to count them all.'],
  ['cardinality', 3, 'tap_count', 'Sprocket needs 12 bolts: some in the tray, some on the floor. Tap each bolt to count them!'],
  ['shapes_patterns', 5, 'sequence', 'The master gate code grows: 5, 10, 15... Line up the number stones in growing order to open the gate!'],
  ['plants', 1, 'sort', "Buzz buzz! Sprout's parts got all jumbled in the wind! Sort them: parts above the soil, and parts below."],
  ['plants', 3, 'sort', "Buzz buzz! Buzzy's treasure box is a jumble! Sort what could grow into a new plant from what never could."],
  ['animals_habitats', 2, 'sort', 'Buzz buzz! A polar bear and a penguin feel too hot! Sort the animals into chilly homes and toasty homes.'],
  ['weather', 2, 'sort', 'Buzz buzz! Rain clouds are coming! Help Bea pack: what goes in the bag for a rainy day?'],
  ['experiments', 1, 'sort', "Buzz buzz! Bea is testing her experiment corner! Sort what floats in the pond from what sinks."],
  ['patterns_coding', 4, 'tap_target', 'WHIRR! The weaving has a SNAG: red, blue, red, GREEN, red, blue... Tap the thread that broke the pattern!'],
  ['patterns_coding', 5, 'sequence', 'BEEP! Master weaver! The royal blanket grows row by row. Lay out the rows in growing order!'],
  ['loops', 1, 'tap_count', 'BEEP! Sprocket winds his toy: turn, turn, turn, turn! Tap once for each turn to count them.'],
  ['dance', 1, 'sequence', 'Riff showed you his dance: first a twirl, then a hop, then a FREEZE! Line up the moves in order!'],
];

describe('content quality conversions', () => {
  it('converts exactly 24 activities and keeps the bank at 880', () => {
    expect(CONVERSIONS).toHaveLength(24);
    expect(bank).toHaveLength(880);
  });

  it('brings multiple_choice from 322 (36.59%) down to 298 (33.86%)', () => {
    const mc = bank.filter((a) => a.kind === 'multiple_choice');
    expect(mc).toHaveLength(298);
    expect(mc.length / bank.length).toBeCloseTo(0.3386, 4);
    const kinds: Record<string, number> = {};
    for (const a of bank) kinds[a.kind] = (kinds[a.kind] ?? 0) + 1;
    // deltas from the 24 conversions: -24 MC, +6 sequence, +6 sort, +7 tap_count, +4 trace, +1 tap_target
    expect(kinds).toMatchObject({
      multiple_choice: 298,
      sequence: 121,
      sort: 72,
      tap_count: 86,
      trace: 68,
      tap_target: 131,
      listen_repeat: 104,
    });
  });

  it('contains every converted activity with its new kind and prompt', () => {
    for (const [skill, level, kind, prompt] of CONVERSIONS) {
      const found = bank.filter(
        (a) => a.skill === skill && a.level === level && a.prompt_text === prompt
      );
      expect(found, `${skill} L${level}: ${prompt.slice(0, 40)}…`).toHaveLength(1);
      expect(found[0].kind).toBe(kind);
    }
  });

  it('has valid kind-specific card/answer payloads for every conversion', () => {
    for (const [skill, level, kind, prompt] of CONVERSIONS) {
      const a = bank.find(
        (x) => x.skill === skill && x.level === level && x.prompt_text === prompt
      )!;
      if (kind === 'sequence') {
        const items = (a.card.items ?? []) as { id: string }[];
        const seqIds = (a.answer.sequence ?? []) as string[];
        expect(seqIds.length).toBeGreaterThanOrEqual(3);
        for (const id of seqIds) {
          expect(items.some((i) => i.id === id), `${prompt} answer id ${id}`).toBe(true);
        }
      } else if (kind === 'sort') {
        const items = (a.card.items ?? []) as { id: string; group: string }[];
        const groups = a.answer.groups as Record<string, string[]>;
        expect(Object.keys(groups).length).toBeGreaterThanOrEqual(2);
        const assigned = Object.values(groups).flat();
        expect(new Set(assigned).size).toBe(assigned.length);
        // every card item id is assigned to exactly one answer group
        for (const it of items) {
          const hits = Object.entries(groups).filter(([, ids]) => ids.includes(it.id));
          expect(hits, `${prompt} item ${it.id}`).toHaveLength(1);
        }
        expect(assigned).toHaveLength(items.length);
        // group names are human-readable labels, distinct per group
        const names = new Set(items.map((i) => i.group));
        expect(names.size).toBe(Object.keys(groups).length);
      } else if (kind === 'tap_count') {
        expect(a.answer.count).toBe(a.card.total);
        expect(a.answer.count).toBeGreaterThan(0);
        expect(typeof a.card.thing).toBe('string');
      } else if (kind === 'trace') {
        expect(typeof a.card.trace).toBe('string');
        expect((a.card.trace as string).length).toBeGreaterThan(0);
        expect(typeof a.answer.min_coverage).toBe('number');
        expect(a.prompt_text.length).toBeLessThanOrEqual(220);
      } else if (kind === 'tap_target') {
        const targets = (a.card.targets ?? []) as { id: string }[];
        expect(targets.some((t) => t.id === a.answer.choice)).toBe(true);
      }
    }
  });

  it('keeps 4 activities per skill x level', () => {
    const counts: Record<string, number> = {};
    for (const a of bank) {
      const k = `${a.skill}:${a.level}`;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    expect(Object.keys(counts)).toHaveLength(220);
    for (const [k, n] of Object.entries(counts)) {
      expect(n, k).toBe(4);
    }
  });
});

describe('content quality migration', () => {
  it('is a guarded transaction with exactly 24 UPDATEs', () => {
    expect(mig.startsWith('--')).toBe(true);
    expect(mig).toMatch(/^BEGIN;/m);
    expect(mig.trimEnd().endsWith('COMMIT;')).toBe(true);
    const updates = mig.match(/^UPDATE public\.activities$/gm) ?? [];
    expect(updates).toHaveLength(24);
    // every UPDATE is guarded on skill code + level + kind + exact old prompt
    const guards = mig.match(
      /WHERE skill_id = \(SELECT id FROM public\.skills WHERE code = '\w+'\)\n  AND level = \d\n  AND kind = 'multiple_choice'\n  AND prompt_text = '/g
    );
    expect(guards).toHaveLength(24);
  });

  it('redefines submit_attempt with zero points for listen_repeat only', () => {
    expect(mig).toContain('create or replace function public.submit_attempt(');
    expect(mig).toContain("if v_correct and v_act.kind <> 'listen_repeat' then");
    // grading, auth checks, event logging, no-mastery rule all preserved
    expect(mig).toContain("raise exception 'not authenticated'");
    expect(mig).toContain("raise exception 'child not found'");
    expect(mig).toContain("insert into public.learning_events");
    expect(mig).toContain('set search_path = public, extensions');
    expect(mig).toContain('security definer');
  });

  it('leaves the historical content-refresh migration untouched', () => {
    // still the replace-style migration: DELETE + INSERT, no UPDATEs
    expect(historical).toMatch(/DELETE FROM public\.activities;/);
    expect(historical).toMatch(/INSERT INTO public\.activities/);
    expect(historical).not.toMatch(/^UPDATE /m);
    // the historical migration knows nothing about the reward-policy fix
    expect(historical).not.toContain('submit_attempt');
  });
});
