-- Minimal stand-in for the pieces of a Supabase project that our migrations
-- depend on (roles, auth.uid(), the extensions schema, storage). Used ONLY by
-- scripts/verify-db.mjs against a throwaway local Postgres — never applied to
-- a real Supabase project, which already provides all of this.
--
-- auth.uid() reads the `request.jwt.claim.sub` setting, which is how the SQL
-- tests impersonate a signed-in parent:
--   set local role authenticated;
--   set local request.jwt.claim.sub = '<parent uuid>';

-- Roles are cluster-wide, so they may survive from an earlier run.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create schema extensions;
create extension pgcrypto schema extensions;

create schema storage;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid
);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[]
language sql immutable
as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;

-- Supabase grants table/function access to the API roles and relies on RLS
-- (and explicit revokes) for protection. Mirror that so the tests exercise
-- the same security model.
grant usage on schema public, auth, extensions, storage to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
