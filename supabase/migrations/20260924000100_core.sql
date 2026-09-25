-- Sky — Phase 1: family core
-- parents, children, avatars, parent_settings, entitlements, sessions,
-- gallery_art, digest_log. Row Level Security on every table.
--
-- Auth model: parents sign in with Supabase Auth (email). Children have no
-- login — nickname + avatar only (COPPA: minimal data). Kid-mode requests run
-- under the parent's JWT; every child-scoped row is fenced by
-- parent_id = auth.uid(). Answer keys and PIN hashes never reach the client:
-- the parents table has NO client policies; all access goes through the
-- SECURITY DEFINER RPCs below.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- avatars: public catalog of the original Sky cast.
-- Phase 4 adds the writing/drawing/coding hosts here; children.avatar_id is a
-- FK so the whitelist grows without schema changes.
-- ---------------------------------------------------------------------------
create table public.avatars (
  id text primary key,
  name text not null,
  species text not null,
  role text not null check (role in ('captain', 'peer', 'host')),
  subject_code text, -- set for hosts in the taxonomy migration
  sort_order integer not null
);

alter table public.avatars enable row level security;

create policy "avatars are visible to signed-in users"
  on public.avatars for select
  to authenticated
  using (true);

insert into public.avatars (id, name, species, role, sort_order) values
  ('curio', 'Curio', 'fox',      'captain', 1),
  ('nova',  'Nova',  'kid',      'peer',    2),
  ('luna',  'Luna',  'owl',      'host',    3),
  ('milo',  'Milo',  'robot',    'host',    4),
  ('bea',   'Bea',   'bee',      'host',    5),
  ('tuno',  'Tuno',  'turtle',   'host',    6),
  ('riff',  'Riff',  'rabbit',   'host',    7),
  ('atlas', 'Atlas', 'elephant', 'host',    8);

-- ---------------------------------------------------------------------------
-- parents: one row per Supabase Auth user. NO client RLS policies on purpose —
-- pin_hash must never be readable from a client session (a 4–6 digit PIN falls
-- to offline brute force). All access is via the RPCs below.
-- ---------------------------------------------------------------------------
create table public.parents (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  pin_hash text,
  pin_attempts integer not null default 0,
  pin_locked_until timestamptz,
  narration_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parents enable row level security;

create trigger parents_updated_at
  before update on public.parents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- children: nickname + avatar + age band. No email, no birthdate (COPPA).
-- ---------------------------------------------------------------------------
create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  avatar_id text not null references public.avatars (id),
  age_band text not null check (age_band in ('3-4', '5-6', '7-8')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, nickname)
);

alter table public.children enable row level security;

create policy "parents manage only their own children"
  on public.children for all
  to authenticated
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

create index children_parent_id_idx on public.children (parent_id);

create trigger children_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- parent_settings: per-child controls (daily limits, focus, age override).
-- ---------------------------------------------------------------------------
create table public.parent_settings (
  child_id uuid primary key references public.children (id) on delete cascade,
  daily_minutes integer not null default 30 check (daily_minutes between 5 and 180),
  subject_focus text[] not null default '{}',
  age_band_override text check (age_band_override in ('3-4', '5-6', '7-8')),
  narration_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parent_settings enable row level security;

create policy "parents manage settings for their own children"
  on public.parent_settings for all
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create trigger parent_settings_updated_at
  before update on public.parent_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- entitlements: subscription-ready billing state. Phase 8 stubs the paywall UI
-- against this table; plans are enforced server-side in Phase 8+.
-- ---------------------------------------------------------------------------
create table public.entitlements (
  parent_id uuid primary key references public.parents (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'plus', 'family')),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

create policy "parents read their own entitlement"
  on public.entitlements for select
  to authenticated
  using (parent_id = auth.uid());

create trigger entitlements_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sessions: one row per kid play session (the goodbye ritual closes these).
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_reason text
    check (ended_reason in ('child_done', 'time_limit', 'parent_ended', 'timeout')),
  event_count integer not null default 0,
  islands_visited text[] not null default '{}'
);

alter table public.sessions enable row level security;

create policy "parents read their children's sessions"
  on public.sessions for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

create index sessions_child_started_idx on public.sessions (child_id, started_at desc);

-- ---------------------------------------------------------------------------
-- gallery_art: the art atelier's portfolio (Phase 7). Files live in the
-- private `gallery` storage bucket; this table is the metadata index.
-- ---------------------------------------------------------------------------
create table public.gallery_art (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  storage_path text not null,
  title text not null default '' check (char_length(title) <= 60),
  created_at timestamptz not null default now()
);

alter table public.gallery_art enable row level security;

create policy "parents manage their children's gallery"
  on public.gallery_art for all
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()))
  with check (child_id in (select id from public.children where parent_id = auth.uid()));

create index gallery_art_child_created_idx on public.gallery_art (child_id, created_at desc);

-- ---------------------------------------------------------------------------
-- digest_log: the weekly proof-of-learning digest (Phase 8). One row per child
-- per week; emailed_at is set when the email goes out.
-- ---------------------------------------------------------------------------
create table public.digest_log (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  week_start date not null,
  summary jsonb not null default '{}',
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (child_id, week_start)
);

alter table public.digest_log enable row level security;

create policy "parents read their children's digests"
  on public.digest_log for select
  to authenticated
  using (child_id in (select id from public.children where parent_id = auth.uid()));

create index digest_log_child_week_idx on public.digest_log (child_id, week_start desc);

-- ---------------------------------------------------------------------------
-- RPCs: the only client path to the parents table.
-- SECURITY DEFINER + fixed search_path. Called with the parent's own JWT.
-- ---------------------------------------------------------------------------

-- Ensure a parents + entitlements row exists for the signed-in user.
-- Called once right after sign-up / sign-in. Idempotent.
create or replace function public.ensure_parent_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_row public.parents%rowtype;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select email into v_email from auth.users where id = v_user_id;

  insert into public.parents (id, email)
  values (v_user_id, coalesce(v_email, ''))
  on conflict (id) do update set email = excluded.email
  returning * into v_row;

  insert into public.entitlements (parent_id)
  values (v_user_id)
  on conflict (parent_id) do nothing;

  return jsonb_build_object(
    'id', v_row.id,
    'email', v_row.email,
    'display_name', v_row.display_name,
    'has_pin', v_row.pin_hash is not null,
    'narration_enabled', v_row.narration_enabled
  );
end;
$$;

-- Read the signed-in parent's profile (pin_hash is never exposed).
create or replace function public.get_parent_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.parents%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_row from public.parents where id = auth.uid();
  if not found then
    raise exception 'parent profile not found';
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'email', v_row.email,
    'display_name', v_row.display_name,
    'has_pin', v_row.pin_hash is not null,
    'narration_enabled', v_row.narration_enabled
  );
end;
$$;

-- Set (or change) the parent-zone PIN. 4–6 digits, bcrypt-hashed with pgcrypto.
create or replace function public.set_parent_pin(pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if pin is null or pin !~ '^\d{4,6}$' then
    raise exception 'PIN must be 4 to 6 digits';
  end if;

  update public.parents
  set pin_hash = crypt(pin, gen_salt('bf', 10)),
      pin_attempts = 0,
      pin_locked_until = null
  where id = auth.uid();

  return jsonb_build_object('has_pin', true);
end;
$$;

-- Verify the parent-zone PIN. 5 wrong attempts lock verification for 5 minutes.
-- Returns false (never raises) on a wrong PIN so the UI can't distinguish
-- "no PIN set" from "wrong PIN".
create or replace function public.verify_parent_pin(pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.parents%rowtype;
  v_ok boolean := false;
begin
  if auth.uid() is null then
    return false;
  end if;

  select * into v_row from public.parents where id = auth.uid();
  if not found or v_row.pin_hash is null then
    return false;
  end if;

  if v_row.pin_locked_until is not null and v_row.pin_locked_until > now() then
    return false;
  end if;

  v_ok := (crypt(pin, v_row.pin_hash) = v_row.pin_hash);

  if v_ok then
    update public.parents
    set pin_attempts = 0, pin_locked_until = null
    where id = v_row.id;
  else
    update public.parents
    set pin_attempts = v_row.pin_attempts + 1,
        pin_locked_until = case
          when v_row.pin_attempts + 1 >= 5 then now() + interval '5 minutes'
          else v_row.pin_locked_until
        end
    where id = v_row.id;
  end if;

  return v_ok;
end;
$$;

-- Update the parent's display name + narration preference.
create or replace function public.update_parent_profile(
  p_display_name text,
  p_narration_enabled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.parents%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_display_name is not null and char_length(p_display_name) > 40 then
    raise exception 'display name too long';
  end if;

  update public.parents
  set display_name = nullif(trim(p_display_name), ''),
      narration_enabled = coalesce(p_narration_enabled, narration_enabled)
  where id = auth.uid()
  returning * into v_row;

  return public.get_parent_profile();
end;
$$;

-- ---------------------------------------------------------------------------
-- Session RPCs (kid flow runs under the parent's JWT; ownership is checked).
-- ---------------------------------------------------------------------------

-- Open a play session for one of the caller's children. Returns the session id.
create or replace function public.start_session(p_child_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.children where id = p_child_id and parent_id = auth.uid()
  ) then
    raise exception 'child not found';
  end if;

  insert into public.sessions (child_id) values (p_child_id)
  returning id into v_session_id;
  return v_session_id;
end;
$$;

-- Close a play session (the goodbye ritual calls this).
create or replace function public.end_session(
  p_session_id uuid,
  p_reason text default 'child_done'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_child_id uuid;
  v_started timestamptz;
  v_events integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_reason not in ('child_done', 'time_limit', 'parent_ended', 'timeout') then
    raise exception 'invalid end reason';
  end if;

  select child_id, started_at into v_child_id, v_started
  from public.sessions
  where id = p_session_id
    and child_id in (select id from public.children where parent_id = auth.uid());
  if not found then
    raise exception 'session not found';
  end if;

  select count(*) into v_events
  from public.learning_events
  where session_id = p_session_id;

  update public.sessions
  set ended_at = now(),
      ended_reason = p_reason,
      event_count = v_events
  where id = p_session_id;

  return jsonb_build_object(
    'session_id', p_session_id,
    'minutes_played', greatest(0, round(extract(epoch from (now() - v_started)) / 60)),
    'event_count', v_events
  );
end;
$$;

-- Revoke execute from anon explicitly; only signed-in parents may call these.
revoke all on function public.ensure_parent_profile() from anon, public;
revoke all on function public.get_parent_profile() from anon, public;
revoke all on function public.set_parent_pin(text) from anon, public;
revoke all on function public.verify_parent_pin(text) from anon, public;
revoke all on function public.update_parent_profile(text, boolean) from anon, public;
revoke all on function public.start_session(uuid) from anon, public;
revoke all on function public.end_session(uuid, text) from anon, public;
grant execute on function public.ensure_parent_profile() to authenticated;
grant execute on function public.get_parent_profile() to authenticated;
grant execute on function public.set_parent_pin(text) to authenticated;
grant execute on function public.verify_parent_pin(text) to authenticated;
grant execute on function public.update_parent_profile(text, boolean) to authenticated;
grant execute on function public.start_session(uuid) to authenticated;
grant execute on function public.end_session(uuid, text) to authenticated;
