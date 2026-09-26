-- Schema-contract tests for the Supabase migrations. Run by
-- scripts/verify-db.mjs inside a throwaway database. Everything happens in
-- one transaction that is rolled back, and any failed assertion raises.
--
-- This is the behavioral replacement for the old tests/migrations.test.ts
-- source-text scans: instead of grepping the migration SQL for
-- "create policy" / "security definer" strings, we assert against the live
-- catalogs (pg_class, pg_policies, pg_proc) and the seeded rows after
-- applying every migration in order.

begin;

do $$
declare
  n int;
  t text;
  expected_rpcs text[] := array[
    'ensure_parent_profile', 'get_parent_profile', 'set_parent_pin',
    'verify_parent_pin', 'update_parent_profile', 'start_session',
    'end_session', 'fetch_activity_card', 'submit_attempt', 'log_event',
    'award_stars', 'spend_stars', 'bump_quest_progress',
    'record_game_attempts', 'unlock_parent_zone',
    'parent_zone_is_unlocked', 'lock_parent_zone'
  ];
  rpc text;
  p_oid oid;
  sp text;
  catalog text;
begin
  -- ---- RLS: every public table has it enabled ---------------------------
  select count(*) into n
  from pg_class c join pg_namespace nsp on nsp.oid = c.relnamespace
  where nsp.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  assert n = 0, format('%s public tables lack RLS', n);

  -- Tables that must stay reachable only through SECURITY DEFINER RPCs
  -- (answer keys, PIN hashes, zone grants): RLS on + zero policies = deny
  -- everything for anon/authenticated.
  for t in select unnest(array['activities', 'parents', 'parent_zone_grants']) loop
    select count(*) into n from pg_policies
    where schemaname = 'public' and tablename = t;
    assert n = 0, format('%s must have zero client policies, has %s', t, n);
  end loop;

  -- Every other table needs at least one policy (no accidental deny-all).
  for t in
    select c.relname from pg_class c join pg_namespace nsp on nsp.oid = c.relnamespace
    where nsp.nspname = 'public' and c.relkind = 'r'
      and c.relname not in ('activities', 'parents', 'parent_zone_grants')
  loop
    select count(*) into n from pg_policies
    where schemaname = 'public' and tablename = t;
    assert n >= 1, format('table %s has no policies', t);
  end loop;

  -- Public catalogs: selectable by authenticated users, never by anon.
  for catalog in select unnest(array['avatars', 'subjects', 'skills', 'skill_prerequisites']) loop
    select count(*) into n from pg_policies
    where schemaname = 'public' and tablename = catalog
      and cmd = 'SELECT' and 'authenticated' = any (roles);
    assert n >= 1, format('catalog %s needs an authenticated SELECT policy', catalog);
    select count(*) into n from pg_policies
    where schemaname = 'public' and tablename = catalog and 'anon' = any (roles);
    assert n = 0, format('catalog %s must not grant anon', catalog);
  end loop;

  -- No policy grants to anon anywhere in the schema.
  select count(*) into n from pg_policies
  where schemaname = 'public' and 'anon' = any (roles);
  assert n = 0, format('%s policies grant to anon', n);

  -- ---- RPC surface -------------------------------------------------------
  -- Exactly the intended client-callable RPCs exist (plus the two known
  -- non-client helpers, asserted separately below).
  for rpc in select unnest(expected_rpcs) loop
    select p.oid into p_oid from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
    where nsp.nspname = 'public' and p.proname = rpc and p.prokind = 'f';
    assert p_oid is not null, format('RPC %s is missing', rpc);

    assert (select prosecdef from pg_proc where oid = p_oid),
      format('RPC %s must be SECURITY DEFINER', rpc);

    select setting into sp from pg_proc,
      lateral unnest(proconfig) s(setting)
    where oid = p_oid and setting like 'search_path=%';
    assert sp = 'search_path=public, extensions',
      format('RPC %s must fix search_path, got %s', rpc, coalesce(sp, 'null'));

    assert not has_function_privilege('anon', p_oid, 'execute'),
      format('RPC %s must not be executable by anon', rpc);
    assert has_function_privilege('authenticated', p_oid, 'execute'),
      format('RPC %s must be executable by authenticated', rpc);
  end loop;

  -- No surprise extra public functions beyond the RPCs + 2 known helpers.
  select count(*) into n from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
  where nsp.nspname = 'public' and p.prokind = 'f'
    and p.proname <> all (expected_rpcs || array['apply_skill_attempt', 'set_updated_at']);
  assert n = 0, format('%s unexpected public functions', n);

  -- Internal helper: SECURITY DEFINER but never client-callable.
  select p.oid into p_oid from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
  where nsp.nspname = 'public' and p.proname = 'apply_skill_attempt';
  assert p_oid is not null, 'apply_skill_attempt missing';
  assert (select prosecdef from pg_proc where oid = p_oid), 'apply_skill_attempt must be SECURITY DEFINER';
  assert not has_function_privilege('anon', p_oid, 'execute'), 'apply_skill_attempt callable by anon';
  assert not has_function_privilege('authenticated', p_oid, 'execute'), 'apply_skill_attempt callable by authenticated';

  -- Trigger helper: not SECURITY DEFINER (no elevated rights if invoked).
  select p.oid into p_oid from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
  where nsp.nspname = 'public' and p.proname = 'set_updated_at';
  assert p_oid is not null, 'set_updated_at missing';
  assert not (select prosecdef from pg_proc where oid = p_oid),
    'set_updated_at must not be SECURITY DEFINER';

  -- ---- taxonomy seed ------------------------------------------------------
  select count(*) into n from public.skills;
  assert n = 49, format('expected 49 skills, got %s', n);
  select count(distinct code) into n from public.skills;
  assert n = 49, 'skill codes must be unique';

  -- Every skill: exactly 5 non-empty level descriptors, no emoji.
  select count(*) into n from public.skills
  where jsonb_array_length(levels) <> 5;
  assert n = 0, format('%s skills lack 5 level descriptors', n);
  select count(*) into n from public.skills s,
    lateral jsonb_array_elements_text(s.levels) d
  where length(trim(d)) <= 10;
  assert n = 0, 'level descriptors must be non-empty sentences';
  select count(*) into n from public.skills s,
    lateral jsonb_array_elements_text(s.levels) d
  where s.name ~ E'[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF]'
     or s.summary ~ E'[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF]'
     or d ~ E'[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF]';
  assert n = 0, 'emoji in kid-facing skill content';

  -- ---- avatar roster -------------------------------------------------------
  select count(*) into n from public.avatars;
  assert n = 8, format('expected 8 avatars, got %s', n);
  for t in select unnest(array['curio', 'nova', 'luna', 'milo', 'bea', 'tuno', 'riff', 'atlas']) loop
    select count(*) into n from public.avatars where id = t;
    assert n = 1, format('avatar %s missing from seed', t);
  end loop;

  -- ---- activity bank hygiene -------------------------------------------------
  -- (kind distribution + conversion spot-checks live in content_quality.test.sql)
  select count(*) into n from public.activities;
  assert n = 880, format('expected 880 activities, got %s', n);
  select count(*) into n from public.activities
  where kind not in ('multiple_choice', 'tap_target', 'tap_count', 'sequence', 'sort', 'trace', 'listen_repeat');
  assert n = 0, format('%s activities have unknown kinds', n);
  select count(*) into n from public.activities
  where level < 1 or level > 5;
  assert n = 0, 'activity levels must be 1-5';
  select count(*) into n from public.activities
  where prompt_text ~ E'[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF]'
     or prompt_text ilike '%lorem ipsum%';
  assert n = 0, 'emoji or lorem ipsum in activity prompts';

  -- ---- trophy awards mirror the sticker_awards convention --------------------
  select count(*) into n
  from information_schema.columns
  where table_schema = 'public' and table_name = 'trophy_awards'
    and column_name in ('child_id', 'trophy_id');
  assert n = 2, 'trophy_awards must mirror sticker_awards (child_id, trophy_id)';
end $$;

rollback;
