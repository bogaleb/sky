-- ============================================================================
-- 20260925001200_fix_ensure_parent_profile.sql
--
-- The 20260925001100 cleanup migration dropped public.entitlements, but
-- ensure_parent_profile() still inserted into it on every sign-in/sign-up.
-- That made the RPC raise `relation "public.entitlements" does not exist`,
-- so ALL logins and signups failed with "Signed in, but we could not load
-- your parent profile." This redefines the function without the dead
-- entitlements insert. Nothing else in the app reads or writes that table.
-- ============================================================================

create or replace function public.ensure_parent_profile()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
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

  return jsonb_build_object(
    'id', v_row.id,
    'email', v_row.email,
    'display_name', v_row.display_name,
    'has_pin', v_row.pin_hash is not null,
    'narration_enabled', v_row.narration_enabled
  );
end;
$$;

revoke all on function public.ensure_parent_profile() from anon, public;
grant execute on function public.ensure_parent_profile() to authenticated;
