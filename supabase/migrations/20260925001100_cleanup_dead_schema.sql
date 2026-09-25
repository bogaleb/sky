-- ============================================================================
-- 20260925001100_cleanup_dead_schema.sql
--
-- STATUS: PREPARED ONLY — DO NOT APPLY until Bin runs the full migration
-- queue in order. This file is staged for the same SQL Editor session.
--
-- Drops tables that shipped with the early schema but were never referenced
-- by application code (verified 2026-09-25 with a repo-wide grep over
-- app/, components/, lib/ and supabase/, excluding the generated type
-- stubs in lib/supabase/database.types.ts):
--
--   public.gallery_art  -- Phase 7 art-portfolio metadata index. The
--                          Creative Studio / Movie Studio features that
--                          would have used it store everything in
--                          localStorage instead; nothing reads or writes
--                          this table.
--   public.media_clips  -- Video metadata catalog for a generation
--                          pipeline that never shipped. Clips are served
--                          as static files from public/videos/.
--   public.entitlements -- Billing stub (free/plus/family). No paywall
--                          code exists anywhere in the app.
--
-- Deliberately NOT dropped: public.avatars. Although the avatar *picker*
-- UI is client-side, children.avatar_id is a live foreign key to
-- public.avatars(id) and the table is seeded with the cast catalog
-- (20260924000100_core.sql). Dropping it would break onboarding inserts.
--
-- After applying, regenerate the TypeScript types so the stubs disappear:
--   supabase gen types typescript --linked > lib/supabase/database.types.ts
-- ============================================================================

-- media_clips has a FK to avatars(id): drop it before touching anything
-- near avatars (avatars itself is kept, but order matters for safety).
drop table if exists public.media_clips;

drop table if exists public.gallery_art;

drop table if exists public.entitlements;
