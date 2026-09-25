import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migDir = join(root, 'supabase', 'migrations');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

const migrationFiles = readdirSync(migDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();
const migrations = new Map(
  migrationFiles.map((f) => [f, readFileSync(join(migDir, f), 'utf8')])
);
const allSql = [...migrations.values()].join('\n');

// Extract '...'::jsonb literals by scanning backwards from each '::jsonb,
// respecting SQL '' escapes. (A naive regex over-matches across columns.)
function extractJsonbLiterals(sql: string): string[] {
  const out: string[] = [];
  const re = /'::jsonb/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    let i = m.index - 1;
    let buf = '';
    while (i >= 0) {
      const ch = sql[i];
      if (ch === "'") {
        if (sql[i - 1] === "'") {
          buf = "'" + buf;
          i -= 2;
        } else {
          break;
        }
      } else {
        buf = ch + buf;
        i--;
      }
    }
    out.push(buf);
  }
  return out;
}

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

describe('migration files', () => {
  it('are complete and strictly ordered', () => {
    expect(migrationFiles).toEqual([
      '20260924000100_core.sql',
      '20260924000200_taxonomy.sql',
      '20260924000300_activity_bank.sql',
      '20260924000400_learning.sql',
      '20260924000500_storage.sql',
      '20260924000600_pgcrypto_search_path.sql',
      '20260925000100_fix_choice_grading.sql',
      '20260925000200_sticker_awards.sql',
      '20260925000300_content_refresh.sql',
      '20260925000400_trail_streaks.sql',
      '20260925000500_pets.sql',
      '20260925000600_outfits.sql',
      '20260925000700_wallet_rpc.sql',
    ]);
  });
});

describe('row level security', () => {
  const tables = [...allSql.matchAll(/create table public\.(\w+)/g)].map(
    (m) => m[1]
  );

  it('covers every table', () => {
    expect(tables.length).toBeGreaterThan(10);
    for (const t of new Set(tables)) {
      expect(
        allSql.includes(`alter table public.${t} enable row level security`),
        `table public.${t} must enable RLS`
      ).toBe(true);
    }
  });

  it('never exposes answer keys: activities has no client policies', () => {
    const bank = migrations.get('20260924000300_activity_bank.sql') ?? '';
    expect(bank).not.toMatch(/create policy/i);
  });

  it('never exposes PIN hashes: parents has no client policies', () => {
    expect(allSql).not.toMatch(/create policy[^;]*on public\.parents/i);
  });

  it('public catalogs are readable by authenticated users only', () => {
    for (const t of [
      'avatars',
      'subjects',
      'skills',
      'skill_prerequisites',
      'media_clips',
    ]) {
      const policies = [
        ...allSql.matchAll(
          new RegExp(`create policy[^;]*on public\\.${t}[^;]*;`, 'gis')
        ),
      ];
      expect(policies.length, `${t} needs a select policy`).toBeGreaterThan(0);
      for (const p of policies) {
        expect(p[0]).toMatch(/to authenticated/);
        expect(p[0]).not.toMatch(/to anon/);
      }
    }
  });

  it('no policy grants to anon anywhere in the schema', () => {
    const anonPolicies = [
      ...allSql.matchAll(/create policy[^;]*to anon[^;]*;/gis),
    ];
    expect(anonPolicies.map((p) => p[0])).toEqual([]);
  });
});

describe('security definer RPCs', () => {
  const fnChunks = allSql
    .split(/(?=create or replace function public\.)/g)
    .filter((c) => c.startsWith('create or replace function public.'));
  const fnNames = fnChunks.map(
    (c) => c.match(/create or replace function public\.(\w+)\(/)?.[1] ?? '?'
  );
  // set_updated_at is a plain trigger helper, not a client-callable RPC.
  const rpcChunks = fnChunks.filter((c) => !c.includes('function public.set_updated_at('));
  const rpcNames = rpcChunks.map(
    (c) => c.match(/create or replace function public\.(\w+)\(/)?.[1] ?? '?'
  );

  it('exposes exactly the intended RPC surface', () => {
    // A function redefined by a later migration (e.g. submit_attempt) counts once.
    expect([...new Set(rpcNames)].sort()).toEqual(
      [
        'ensure_parent_profile',
        'get_parent_profile',
        'set_parent_pin',
        'verify_parent_pin',
        'update_parent_profile',
        'start_session',
        'end_session',
        'fetch_activity_card',
        'submit_attempt',
        'log_event',
        'award_stars',
        'spend_stars',
        'bump_quest_progress',
      ].sort()
    );
  });

  it('every RPC is SECURITY DEFINER with a fixed search_path', () => {
    for (const chunk of rpcChunks) {
      const name = chunk.match(/function public\.(\w+)\(/)?.[1];
      expect(chunk, `${name} must be SECURITY DEFINER`).toMatch(
        /security definer/i
      );
      // public first (our tables), extensions second (pgcrypto on Supabase).
      expect(chunk, `${name} must fix search_path`).toMatch(
        /set search_path = public,\s*extensions/i
      );
    }
  });

  it('every RPC is revoked from anon and granted to authenticated', () => {
    for (const name of rpcNames) {
      expect(
        allSql.includes(`revoke all on function public.${name}(`),
        `${name} must be revoked from anon/public`
      ).toBe(true);
      expect(
        allSql.includes(`grant execute on function public.${name}(`),
        `${name} must be granted to authenticated`
      ).toBe(true);
    }
  });

  it('the trigger helper is not client-callable', () => {
    expect(allSql).not.toMatch(/grant execute on function public\.set_updated_at/);
    expect(allSql).not.toMatch(/revoke all on function public\.set_updated_at/);
  });
});

describe('taxonomy seed', () => {
  const taxonomy = migrations.get('20260924000200_taxonomy.sql') ?? '';
  const codes = [
    ...taxonomy.matchAll(/\n\('([a-z]+)', '([a-z_]+)', '/g),
  ].map((m) => m[2]);

  it('seeds 44 skills with unique codes', () => {
    expect(codes.length).toBe(44);
    expect(new Set(codes).size).toBe(44);
  });

  it('gives every skill exactly 5 non-empty level descriptors', () => {
    const literals = extractJsonbLiterals(taxonomy);
    expect(literals.length).toBe(44);
    for (const raw of literals) {
      const levels = JSON.parse(raw) as unknown;
      expect(Array.isArray(levels)).toBe(true);
      expect((levels as string[]).length).toBe(5);
      for (const d of levels as string[]) {
        expect(typeof d).toBe('string');
        expect(d.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('has no emoji in kid-facing content', () => {
    expect(taxonomy).not.toMatch(EMOJI_RE);
  });
});

describe('avatar roster', () => {
  it('matches across SQL seed, lib list, and visual registry', () => {
    const core = migrations.get('20260924000100_core.sql') ?? '';
    const sqlIds = [
      ...core.matchAll(/\n {2}\('([a-z]+)',\s+'[A-Z][a-z]+',\s+'[a-z]+',\s*'(?:captain|peer|host)'/g),
    ].map((m) => m[1]);

    const libSrc = read('lib/avatars.ts');
    const libIds = [...(libSrc.match(/AVATAR_IDS = \[([\s\S]*?)\]/)?.[1] ?? '').matchAll(
      /'([a-z]+)'/g
    )].map((m) => m[1]);

    const registrySrc = read('components/avatars/index.tsx');
    const registryIds = [...registrySrc.matchAll(/^\s{2}([a-z]+): \{ name:/gm)].map(
      (m) => m[1]
    );

    expect(sqlIds).toEqual(libIds);
    expect(registryIds.sort()).toEqual([...libIds].sort());
    expect(sqlIds.length).toBe(8);
  });

  it('avatar artwork contains no emoji', () => {
    for (const id of ['curio', 'nova', 'luna', 'milo', 'bea', 'tuno', 'riff', 'atlas']) {
      expect(read(`components/avatars/${id}.tsx`)).not.toMatch(EMOJI_RE);
    }
  });
});

describe('activity bank seed', () => {
  const seed = read('supabase/seed.sql');
  const taxonomy = migrations.get('20260924000200_taxonomy.sql') ?? '';
  const skillCodes = new Set(
    [...taxonomy.matchAll(/\n\('([a-z]+)', '([a-z_]+)', '/g)].map((m) => m[2])
  );
  const KINDS = new Set([
    'multiple_choice',
    'tap_target',
    'tap_count',
    'sequence',
    'sort',
    'trace',
    'listen_repeat',
  ]);

  const blocks = seed
    .split(/(?=insert into public\.activities)/g)
    .filter((b) => b.startsWith('insert into public.activities'));

  it('references only real skill codes, kinds, and levels 1–3', () => {
    expect(blocks.length).toBeGreaterThanOrEqual(60);
    for (const b of blocks) {
      const code = b.match(/s\.code = '([a-z_]+)'/)?.[1];
      expect(skillCodes.has(code ?? ''), `unknown skill code ${code}`).toBe(true);
      const meta = b.match(/select s\.id,\s*(\d+),\s*'([a-z_]+)'/);
      expect(meta, 'insert must carry level + kind').not.toBeNull();
      expect(Number(meta?.[1])).toBeGreaterThanOrEqual(1);
      expect(Number(meta?.[1])).toBeLessThanOrEqual(3);
      expect(KINDS.has(meta?.[2] ?? ''), `unknown kind ${meta?.[2]}`).toBe(true);
      const points = b.match(/,\s*(\d+),\s*'[0-9]-[0-9]',\s*'[0-9]-[0-9]'/)?.[1];
      expect(Number(points)).toBeGreaterThanOrEqual(1);
      expect(Number(points)).toBeLessThanOrEqual(100);
    }
  });

  it('has valid JSONB and kind-correct answer shapes', () => {
    for (const b of blocks) {
      const kind = b.match(/select s\.id,\s*\d+,\s*'([a-z_]+)'/)?.[1] as string;
      const literals = extractJsonbLiterals(b);
      expect(literals.length, 'each activity needs card + answer').toBe(2);
      const [card, answer] = literals.map((raw) => JSON.parse(raw) as any);

      // Everything narrated: a non-reader must be able to complete it.
      expect(
        typeof card.narration === 'string' || typeof card.text === 'string',
        'card needs narration or text'
      ).toBe(true);

      switch (kind) {
        case 'multiple_choice': {
          const ids = card.options.map((o: any) => o.id);
          expect(ids.length).toBeGreaterThanOrEqual(2);
          expect(ids).toContain(answer.choice);
          break;
        }
        case 'tap_target': {
          const ids = card.targets.map((t: any) => t.id);
          expect(ids.length).toBeGreaterThanOrEqual(2);
          expect(ids).toContain(answer.choice);
          break;
        }
        case 'tap_count': {
          expect(Number.isInteger(answer.count)).toBe(true);
          expect(card.sets.map((s: any) => s.count)).toContain(answer.count);
          break;
        }
        case 'sequence': {
          const ids = card.items.map((i: any) => i.id).sort();
          expect([...answer.sequence].sort()).toEqual(ids);
          break;
        }
        case 'sort': {
          const groupIds = card.groups.map((g: any) => g.id);
          const itemIds = card.items.map((i: any) => i.id).sort();
          const placed = Object.values(answer.groups as Record<string, string[]>)
            .flat()
            .sort();
          expect(Object.keys(answer.groups).every((k) => groupIds.includes(k))).toBe(true);
          expect(placed).toEqual(itemIds);
          break;
        }
        case 'trace': {
          expect(typeof answer.min_coverage).toBe('number');
          expect(answer.min_coverage).toBeGreaterThan(0);
          expect(answer.min_coverage).toBeLessThanOrEqual(1);
          expect(typeof card.path).toBe('string');
          break;
        }
        case 'listen_repeat': {
          expect(answer).toEqual({});
          break;
        }
      }
    }
  });

  it('has no emoji and no lorem ipsum', () => {
    expect(seed).not.toMatch(EMOJI_RE);
    expect(seed.toLowerCase()).not.toContain('lorem');
  });
});
