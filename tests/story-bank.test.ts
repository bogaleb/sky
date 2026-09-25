import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bank: {
  skill: string;
  level: number;
  kind: string;
  prompt_text: string;
  card: Record<string, unknown>;
  answer: Record<string, unknown>;
  min_age_band: string;
  max_age_band: string;
}[] = JSON.parse(readFileSync(join(root, 'supabase', 'seed_phase3.json'), 'utf8'));

const KINDS = new Set([
  'multiple_choice',
  'tap_target',
  'tap_count',
  'trace',
  'sequence',
  'sort',
  'listen_repeat',
]);

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

// Worksheet-style / placeholder language that must not appear in story content.
const BANNED = [
  'lorem',
  'fill in the blank',
  'circle the correct',
  'what comes next? red, blue',
];

function optionCards(a: (typeof bank)[number]) {
  const c = a.card as { options?: { id: string }[]; targets?: { id: string }[] };
  return c.options ?? c.targets ?? null;
}

describe('phase 3 story bank', () => {
  it('has exactly 880 activities: 44 skills x 5 levels x 4', () => {
    expect(bank.length).toBe(880);
    const pairs = new Map<string, number>();
    for (const a of bank) pairs.set(`${a.skill}|${a.level}`, (pairs.get(`${a.skill}|${a.level}`) ?? 0) + 1);
    expect(pairs.size).toBe(220);
    for (const [k, n] of pairs) expect(n, k).toBe(4);
  });

  it('uses only known activity kinds, and all seven kinds across the bank', () => {
    for (const a of bank) expect(KINDS.has(a.kind), a.prompt_text).toBe(true);
    expect(new Set(bank.map((a) => a.kind))).toEqual(KINDS);
  });

  it('has answer keys that resolve inside their cards', () => {
    for (const a of bank) {
      const cards = optionCards(a);
      if (cards) {
        const ids = cards.map((o) => o.id);
        expect(ids, `${a.skill} L${a.level}: ${a.prompt_text}`).toContain(a.answer.choice);
        expect(new Set(ids).size, 'duplicate option ids').toBe(ids.length);
        expect(ids.length).toBe(4);
      }
      if (a.kind === 'sequence') {
        const seq = a.answer.sequence as string[];
        const items = (a.card as { items: { id: string }[] }).items.map((i) => i.id);
        expect([...seq].sort()).toEqual([...items].sort());
      }
      if (a.kind === 'sort') {
        const groups = (a.answer.groups ?? {}) as Record<string, string[]>;
        const card = a.card as { items: { id: string; group: string }[]; groups: { id: string; label: string }[] };
        const itemIds = new Set(card.items.map((i) => i.id));
        const grouped: string[] = [];
        for (const [gid, ids] of Object.entries(groups)) {
          expect(card.groups.map((g) => g.id), 'unknown group id').toContain(gid);
          for (const id of ids) {
            expect(itemIds, `answer id ${id} missing from items`).toContain(id);
            grouped.push(id);
          }
        }
        expect(grouped.sort()).toEqual([...itemIds].sort());
      }
    }
  });

  it('has no duplicate prompts within a skill', () => {
    const seen = new Map<string, Set<string>>();
    for (const a of bank) {
      const s = seen.get(a.skill) ?? new Set<string>();
      expect(s.has(a.prompt_text), `[${a.skill}] dup: ${a.prompt_text}`).toBe(false);
      s.add(a.prompt_text);
      seen.set(a.skill, s);
    }
  });

  it('keeps prompts short enough for TTS and non-readers', () => {
    for (const a of bank) {
      const words = a.prompt_text.split(/\s+/).length;
      expect(words, a.prompt_text).toBeLessThanOrEqual(30);
      expect(a.prompt_text.length, a.prompt_text).toBeLessThanOrEqual(220);
    }
  });

  it('has no emoji in kid-facing prompts', () => {
    for (const a of bank) expect(a.prompt_text, a.skill).not.toMatch(EMOJI_RE);
  });

  it('has no worksheet-style placeholder language', () => {
    for (const a of bank) {
      const low = a.prompt_text.toLowerCase();
      for (const b of BANNED) expect(low, a.prompt_text).not.toContain(b);
    }
  });

  it('has sane age bands', () => {
    const BANDS = new Set(['3-4', '5-6', '7-8']);
    for (const a of bank) {
      expect(BANDS.has(a.min_age_band as unknown as string), a.prompt_text).toBe(true);
      expect(BANDS.has(a.max_age_band as unknown as string), a.prompt_text).toBe(true);
    }
  });

  it('migration refreshes the bank transactionally', () => {
    const mig = readFileSync(
      join(root, 'supabase', 'migrations', '20260925000300_content_refresh.sql'),
      'utf8',
    );
    expect(mig).toMatch(/^BEGIN;/m);
    expect(mig).toMatch(/^COMMIT;/m);
    expect(mig).toMatch(/DELETE FROM public\.activities;/);
    expect(mig).toMatch(/NOT EXISTS/);
    // answers are never exposed: migration must not create any policy on activities
    expect(mig).not.toMatch(/create policy/i);
  });
});
