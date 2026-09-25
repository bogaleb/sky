-- Sky — Phase 1: storage + media catalog
--
-- Buckets:
--   kid-media : PUBLIC read. Holds the generated video clips, posters and
--               captions (Phase 5). Only the service role may write.
--   gallery   : PRIVATE. Holds children's art-atelier uploads (Phase 7).
--               Path convention: gallery/<child_id>/<filename>.
--
-- media_clips is the single source of truth for every clip (spec §5): one row
-- per clip with caption + poster. Phase 5 fills it.

insert into storage.buckets (id, name, public)
values
  ('kid-media', 'kid-media', true),
  ('gallery', 'gallery', false)
on conflict (id) do nothing;

-- kid-media: anyone (even logged-out, for CDN caching) may read.
create policy "kid-media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'kid-media');

-- kid-media: no client writes. Service role uploads in Phase 5.

-- gallery: parents read/write only their own children's folders.
create policy "parents read their children's art"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] in (
      select id::text from public.children where parent_id = auth.uid()
    )
  );

create policy "parents upload their children's art"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] in (
      select id::text from public.children where parent_id = auth.uid()
    )
  );

create policy "parents delete their children's art"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] in (
      select id::text from public.children where parent_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- media_clips: the catalog. Every clip ships with a caption and a poster.
-- ---------------------------------------------------------------------------
create table public.media_clips (
  id text primary key, -- e.g. 'curio-welcome', 'luna-intro', 'bea-teaching-seed'
  character_id text not null references public.avatars (id),
  kind text not null check (kind in (
    'welcome', 'intro', 'teaching', 'celebrate', 'encourage', 'travel', 'goodbye'
  )),
  title text not null,
  caption text not null,
  file_path text not null,  -- path inside the kid-media bucket
  poster_path text not null,
  duration_s smallint not null check (duration_s between 1 and 120),
  created_at timestamptz not null default now()
);

alter table public.media_clips enable row level security;

create policy "clip catalog is visible to signed-in users"
  on public.media_clips for select
  to authenticated
  using (true);

-- No client writes: the Phase 5 generation pipeline uses the service role.
