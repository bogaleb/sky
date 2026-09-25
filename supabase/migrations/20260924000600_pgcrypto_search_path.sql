-- 0006: make SECURITY DEFINER functions see the pgcrypto extension.
--
-- On Supabase, `create extension pgcrypto` installs into the `extensions`
-- schema, but our RPCs pin `search_path = public`, so `gen_salt`/`crypt`
-- were invisible and `set_parent_pin` failed with "function gen_salt does
-- not exist". Adding `extensions` to the pinned path fixes it; on databases
-- where the extension lives in `public`, the extra entry is harmless
-- (missing schemas in search_path are ignored).

alter function public.ensure_parent_profile() set search_path = public, extensions;
alter function public.get_parent_profile() set search_path = public, extensions;
alter function public.set_parent_pin(text) set search_path = public, extensions;
alter function public.verify_parent_pin(text) set search_path = public, extensions;
alter function public.update_parent_profile(text, boolean) set search_path = public, extensions;
alter function public.start_session(uuid) set search_path = public, extensions;
alter function public.end_session(uuid, text) set search_path = public, extensions;
alter function public.fetch_activity_card(uuid, uuid) set search_path = public, extensions;
alter function public.submit_attempt(uuid, uuid, jsonb, integer, uuid) set search_path = public, extensions;
alter function public.log_event(uuid, text, uuid, uuid, uuid, jsonb) set search_path = public, extensions;
