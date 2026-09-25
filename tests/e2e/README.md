# E2E tests (Wave 10)

## Automated smoke suite

`tests/e2e/smoke.spec.ts` — runs headless Firefox against a local dev
server. It covers only what is verifiable **without** Supabase
credentials:

- `/` landing renders
- `/login` and `/signup` render with **zero console errors**
- `/offline` fallback renders
- `/manifest.webmanifest` is served and valid
- `/sw.js` service worker script is served

Run it:

```sh
pnpm test:e2e
# or: npx playwright test
```

The suite reuses the pre-installed Playwright Firefox
(`~/.cache/ms-playwright/firefox-1543`, matching `@playwright/test`
1.63.0) via `playwright.config.ts` — no `playwright install` needed.
Set `PLAYWRIGHT_FIREFOX_PATH` to override the browser binary.
The config starts `next dev --port 3100` automatically
(`reuseExistingServer: true`).

### Known finding: PWA plumbing is auth-gated

`proxy.ts`'s matcher excludes image extensions but not `.webmanifest`,
`.js`, or `.mp4`, so logged-out requests for `/manifest.webmanifest`
and `/sw.js` 307-redirect to `/login` (the smoke tests accept both the
200 and the 307 shapes). Recommendation for a later wave: extend the
matcher exclusions to `webmanifest` and `sw.js` so the PWA install
plumbing is reachable without a session. Videos staying behind auth is
fine (kid content).

## Manual QA checklist — authenticated path (for Bin, on a real device)

Local runs have no production Supabase credentials, so the full
journey must be checked by hand after the 9 pending migrations are
applied. Work through this on an iPad (landscape) and a phone
(portrait):

1. **Signup** — create a parent account; confirm the welcome email
   arrives and the link signs you in.
2. **Onboarding** — add a child profile (nickname + avatar), set the
   parent PIN.
3. **Login → profiles** — sign out, sign back in, pick the child
   profile with one tap.
4. **Kid map** — islands render with progress rings; Sky Park buttons
   all open their games; Trail banner starts a quest; Up Next rail
   suggests the right island.
5. **One island session** — play through to completion; stars land in
   the wallet (header count increases); sticker + trophy toasts appear.
6. **One Sky Park game win** — e.g. Sentence Studio: quest progress
   bumps, `sentence-first` trophy granted, sticker `sentence-scribe`
   in the sticker book.
7. **Parent zone** — unlock with PIN; dashboard sections load (weekly
   digest, mastery, goals, leaderboard); set a weekly goal; print a
   certificate.
8. **Rewards consistency** — spend stars in Dress Up; balance matches
   across map header and shop.
9. **Offline** — enable airplane mode mid-session, finish a game,
   reconnect; outbox syncs with no duplicates (check parent Recent
   activity).
10. **PWA** — install to home screen; icon, splash, and offline
    fallback all work.
11. **Audio/video** — character voiceovers speak (iOS: voices load on
    first tap), intro videos play with the music bed, Story Cinema
    narrates each scene.

## Video diet (Wave 10)

`public/videos/` ships 20 MP4s totalling ~90 MB. Inventory by size:

| File | Size |
|---|---|
| celebrate.mp4 | **11.8 MB** ← outlier |
| riff-intro.mp4 | 8.1 MB |
| luna-intro.mp4 | 5.9 MB |
| milo-intro.mp4 | 5.2 MB |
| bea-intro.mp4 | 4.8 MB |
| tuno-home.mp4 | 4.7 MB |
| bea-home.mp4 | 4.4 MB |
| welcome.mp4 | 4.1 MB |
| atlas-intro.mp4 | 4.0 MB |
| luna-home.mp4 | 3.9 MB |
| curio-home.mp4 | 3.7 MB |
| curio-intro.mp4 | 3.5 MB |
| milo-home.mp4 | 3.5 MB |
| goodbye.mp4 | 3.4 MB |
| atlas-home.mp4 | 3.3 MB |
| riff-home.mp4 | 3.3 MB |
| nova-try-again.mp4 | 3.2 MB |
| nova-intro.mp4 | 3.1 MB |
| nova-home.mp4 | 3.0 MB |
| tuno-intro.mp4 | 2.9 MB |

Done in code: `video-spot.tsx` now uses `preload="metadata"` and only
sets the video `src` when the player scrolls near the viewport
(IntersectionObserver, graceful fallback); `next.config.ts` sends
`Cache-Control: public, max-age=31536000, immutable` for `/videos/*`.

Still to do by hand (needs ffmpeg — not run in this environment):

```sh
# Re-encode the 11.8 MB outlier. Target: <4 MB, visually identical
# on a tablet. Keeps H.264 for maximum device compatibility.
ffmpeg -i public/videos/celebrate.mp4 \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p \
  -movflags +faststart -an \
  -vf "scale='min(1280,iw)':-2" \
  public/videos/celebrate.mp4.new && \
  mv public/videos/celebrate.mp4.new public/videos/celebrate.mp4

# Optional: same treatment for riff-intro.mp4 (8.1 MB) if it stays
# above ~5 MB after the cache/lazy-load wins are measured.
```

Notes:
- `-an` drops the audio track: the clips are silent by design (the
  music bed + voiceover are synthesized at runtime).
- `-movflags +faststart` moves metadata to the front so playback
  starts before the whole file downloads.
- Because `/videos/*` is cached immutably for a year, **rename the
  file if you ever replace its contents** (e.g. `celebrate-v2.mp4`).
