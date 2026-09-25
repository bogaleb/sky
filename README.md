# Sky — Phase 1: Foundation, Auth & Child Profiles

Sky is a learning world for children ages 3–8 (and their parents), built from
scratch with:

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** (design-token-driven, iPad landscape first)
- **Supabase** (Postgres + Auth + Storage) as the real database
- **pnpm** + **Vitest**

> Phase 1 scope: database schema, parent sign-up/login, parent PIN gate,
> child-profile creation, profile picker with real play sessions, and the
> full test/build verification loop. No placeholders, no dead buttons — every
> control on screen does something real.

---

## 1. Prerequisites

- Node.js 20+ and `pnpm` (`npm i -g pnpm` if needed)
- A Supabase project (free tier is fine). You need:
  - Project URL
  - Publishable (anon) key
  - Secret key (server-side only — never ship to the browser)

## 2. Configure

```bash
cp .env.example .env.local
```

Fill in:

| Variable                        | Where to find it                                  |
| ------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase dashboard → Project Settings → API       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same page, "Publishable key"               |
| `SUPABASE_SECRET_KEY`           | Same page, "Secret key" (server actions only)     |

The app builds and typechecks without these set; pages that need the
database will fail at request time until they are configured.

## 3. Create the database

Apply the migrations **in order** (filenames sort chronologically):

```
supabase/migrations/
  20260924000100_core.sql          parents, children, sessions, avatars, RLS, parent RPCs
  20260924000200_taxonomy.sql      9 subjects, 44 skills, 5 level descriptors each
  20260924000300_activity_bank.sql private activities table (answer keys never leave the server)
  20260924000400_learning.sql      learning_events, skill_mastery, grading + spaced repetition RPCs
  20260924000500_storage.sql      kid-media (public) + gallery (private) buckets, media_clips catalog
supabase/seed.sql                  70 real starter activities, levels 1–3
```

With the Supabase CLI linked:

```bash
supabase db push        # applies migrations in order
psql "$DATABASE_URL" -f supabase/seed.sql   # loads the starter activity bank
```

Or paste each file, in order, into the Supabase dashboard SQL editor
(the seed last).

### Resetting during development

```sql
-- Nuclear option for a dev project only:
drop schema public cascade;
create schema public;
-- then re-apply migrations + seed from scratch.
```

## 4. Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

### Verify

```bash
pnpm typecheck  # tsc --noEmit, must be clean
pnpm test       # vitest: validation, migration contracts, answer secrecy
pnpm build      # production build, must succeed without env vars
```

## 5. The sign-up → child-profile flow (what Phase 1 delivers)

1. **Parent signs up** (`/signup`) with email + password, or logs in (`/login`).
   Supabase Auth creates the user; the `ensure_parent_profile` RPC creates the
   `parents` row and a `free` entitlement.
2. **Parent sets a PIN** (`/onboarding/pin`): 4–6 digits, entered twice on a
   tap-friendly pad, bcrypt-hashed server-side via `set_parent_pin`. Five wrong
   attempts lock the PIN for five minutes.
3. **Parent creates child profiles** (`/onboarding/children`): nickname
   (1–24 chars, sanitized), one of 8 original avatar characters, age band
   3–4 / 5–6 / 7–8. Children never use email — nickname + avatar only.
4. **Profile picker** (`/profiles`): one tap per child. `start_session` opens a
   real row in `sessions`; the active child/session are stored in httpOnly
   cookies.
5. **Deck** (`/deck`): confirms the active child. "Done for now" calls
   `end_session` and clears the cookies — the goodbye ritual that Phase 6
   will expand.

### Security properties enforced by the schema

- Every table has RLS; parents can only ever see their own rows
  (`auth.uid() = parent_id`, including through `children`).
- PIN hashes live in `parents` with **no** SELECT policy — only the
  `verify_parent_pin` / `set_parent_pin` RPCs touch them.
- The `activities.answer` keys have **no** client-readable policy at all;
  `fetch_activity_card` returns a card with the answer stripped, and
  `submit_attempt` grades server-side.
- All RPCs are `SECURITY DEFINER` with a fixed `search_path`, revoked from
  `anon`/`public`, granted to `authenticated` only.

## 6. Project layout

```
app/                    routes: (auth), onboarding, profiles, deck
app/actions/            server actions: auth, onboarding, profiles
components/             ui primitives, forms, 8 original avatar SVGs
lib/                    supabase clients, validation, avatars, auth helpers
supabase/migrations/    5 ordered SQL migrations
supabase/seed.sql       starter activity bank
tests/                  vitest suites (run in CI, no network needed)
```

## 7. What's next

Phase 2 per the build plan: the adaptive learning engine UI (deck → quest
player), driven by `fetch_activity_card` / `submit_attempt` / `log_event`
which already exist and are tested at the contract level.
