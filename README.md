# 📡 Intergalactic Cable

A strange, funny, endlessly watchable television experience. Flip between
**12 channels of simulated live programming** from imaginary planets and
alternate universes — Galactic News 404, Cosmic Shopping, Void Weather,
Alien Nature, Space Court, Robot Kitchen, Parallel Sports, Dream
Commercials, Deep Space Radio, Earth Explained Wrong, Strange Signals, and
Public Access Planet.

Every broadcast is **original, procedurally animated fiction**: Canvas
scenes, Web Audio synthesized music and sound effects, authored dialogue
captions, and a deterministic schedule that makes each channel behave like a
station already on air. No backend, no API keys, no downloads — it runs
entirely in the browser as a static site.

> **Honest labeling:** this is *simulated* live TV. Programs are generated
> from a deterministic schedule seeded by the current time — not a real
> external broadcast feed, and not perfectly synchronized across devices
> (small clock differences shift positions by seconds).

## Quick start (local development)

Requires Node.js 18+ (tested with Node 20/22).

```bash
npm install       # install dependencies
npm run dev       # dev server at http://localhost:5173/intergalactic-cable/
```

## Build & preview

```bash
npm run build     # typecheck + production build into dist/
npm run preview   # serve the production build locally (http://localhost:4173/intergalactic-cable/)
npm test          # run the automated test suite (vitest)
npm run typecheck # TypeScript only
```

## Using the TV

- Press **Turn on TV** (this user gesture also unlocks browser audio).
- **Remote buttons:** power, CH ▲▼, VOL ±, mute, guide, random, favorite ★,
  captions (CC), fullscreen, share link, and ⚙ settings.
- **Keyboard:** ▲/▼ change channel · `M` mute · `F` fullscreen · `G` guide ·
  `0-9` direct tune (Enter commits) · `Esc` close overlays. Typing inside
  the guide search is never intercepted.
- **Guide:** search, category filters, favorites-only filter; the "on air"
  row always agrees with the player because both use the same schedule code.
- **Deep links:** `#/c/<channel-slug>` — e.g. `#/c/space-court`. Works on
  refresh and when pasted (hash routing needs no server rewrites).
- Favorites, volume, mute, captions, CRT effects, reduced motion, voice
  narration, and last channel are saved in `localStorage`. The ⚙ panel has
  a **Reset preferences** action.
- **Reduced motion** disables flicker, strobe and most canvas movement
  (and is auto-enabled on first visit if your OS prefers reduced motion).

## Project layout

```
src/
  data/channels.ts      channel metadata + authored segments/beats (pure data)
  lib/
    schedule.ts         deterministic "what's on air" engine (shared by player & guide)
    rng.ts              stable seeded randomness (hashString / mulberry32 / rand2)
    audio.ts            single AudioContext: procedural music beds, SFX, optional speech
    prefs.ts            versioned localStorage preferences (guarded)
    url.ts              hash routing + share links
    draw.ts             shared canvas toolkit (aliens, starfields, static, tickers…)
  channels/             one renderer module per channel + index.ts registry
  components/           TvStage (player), Remote, Guide
  hooks/usePrefs.ts     preferences state
tests/                  vitest: schedule, url, prefs, content integrity
```

## How scheduling works

Everything is a pure function of the wall clock — nothing runs in the
background for channels you are not watching:

1. **Fixed epoch** — `EPOCH_MS = 2025-01-01T00:00:00Z` (`src/lib/schedule.ts`).
2. **Per-channel offset** — `hashString("offset:" + channelId) % loopLength`
   staggers channels so they are not in lockstep.
3. **Loop** — each channel's segments form one loop; `elapsed = now − epoch + offset`,
   `cycle = floor(elapsed / loop)`, `loopT = elapsed mod loop`.
4. **Active segment** — walk the cumulative segment durations to find the
   segment and the offset `t` inside it; the active beat (caption/SFX) is the
   last beat with `beat.t ≤ t`.
5. **Seeded variation** — each (channel, cycle, segment) gets a stable seed,
   so visual variation changes between loops but is identical for everyone
   watching at the same broadcast position.

Leaving a channel and returning lands you at the current broadcast position,
not the start. The player recomputes state every animation frame; the guide
recomputes on a 250 ms tick — same function, same answer.

## How to add a channel

1. **Content** — append a `ChannelMeta` entry to `CHANNELS` in
   `src/data/channels.ts`: id, slug, number, name, `logoText` (≤ 6 chars),
   tagline, category, accent colors, music style, and **at least 3
   segments**. Each segment needs a title, a duration in seconds, and
   sorted beats (`b(seconds, caption, speaker?, sfx?)`, first beat at 0).
2. **Renderer** — create `src/channels/<name>.ts` exporting
   `render: ChannelRenderer` and `logo: LogoRenderer`. Draw with
   `FrameInfo` (`t`, `segIndex`, `beatIndex`, `seed`, `reduced`, …) and the
   helpers in `src/lib/draw.ts`. Keep motion gentle when `f.reduced` is true.
3. **Register** — add it to `CHANNEL_VISUALS` in `src/channels/index.ts`.
4. Tests in `tests/content.test.ts` will automatically enforce ≥ 3
   segments, ≥ 3 beats each, sorted timings, unique ids, and a registered
   renderer. Run `npm test`.

## How to edit programs & durations

All program text lives in `src/data/channels.ts` — captions, speakers,
sound-effect cues, segment titles and durations. Durations are plain
seconds; the schedule derives everything else. Visual content tables
(products, creatures, court cases, etc.) live at the top of each renderer
module in `src/channels/`.

## Publishing (GitHub Pages)

- `vite.config.ts` sets `base: '/intergalactic-cable/'` to match the
  repository subpath. For a custom domain, change it to `'/'`.
- `.github/workflows/deploy.yml` builds and deploys on pushes to `main`
  (and on `workflow_dispatch`) using the official `actions/configure-pages`,
  `actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4` with
  minimal `pages: write` / `id-token: write` permissions.
- One-time setup: repository **Settings → Pages → Source: GitHub Actions**.
  Note: GitHub Pages requires a **public** repository on the Free plan
  (private-repository Pages needs a paid plan).
- The build runs `npm ci && npm test && npm run build`, so a failing test
  blocks deployment. `dist/index.html` sits at the artifact root and hash
  routing means direct channel links survive refresh without rewrites.

## Asset credits & licensing

- **Everything is original.** No third-party footage, characters, scripts,
  music, or samples. All visuals are drawn at runtime with Canvas 2D; all
  audio is synthesized with Web Audio oscillators and a generated noise
  buffer; all dialogue is written for this project. Any resemblance to real
  shows, products, or persons is parody/coincidence, and every "product"
  and "news story" is explicitly fictional.
- Fonts: system font stack only (no web font downloads).
- Dependencies: React, Vite, TypeScript, Vitest (MIT-licensed dev tooling).
- This project is released under the MIT License (see `LICENSE`).

## Real limitations

- **Simulated live:** deterministic per device clock; two devices with
  skewed clocks can be seconds apart. It is not a real broadcast feed.
- **Audio** requires the initial user gesture (browser autoplay policy) —
  hence the "Turn on TV" button. Voice narration uses optional
  `speechSynthesis`; if unavailable, captions still carry all dialogue.
- **Fullscreen** is disabled where the browser does not support element
  fullscreen (e.g. iPhone Safari).
- No service worker is registered (nothing to cache-update), and there is
  no offline mode.
- Storage-less environments (some private modes) still work; preferences
  simply don't persist.
