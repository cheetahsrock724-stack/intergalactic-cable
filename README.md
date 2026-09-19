# 📡 Intergalactic Cable

A strange, funny, endlessly watchable television experience. Flip between
**twelve hand-crafted channels** of simulated live programming from imaginary
planets and alternate universes — Galactic News 404, Cosmic Shopping, Void
Weather, Alien Nature, Space Court, Robot Kitchen, Parallel Sports, Dream
Commercials, Deep Space Radio, Earth Explained Wrong, Strange Signals, and
Public Access Planet — and then **keep flipping: every other number on the
dial is a channel too**, procedurally generated live and deterministic from
its number. The lineup is effectively infinite.

Every broadcast is **original, procedurally animated fiction**: photographic
scene plates, Canvas characters and graphics, Web Audio synthesized music and
sound effects, authored dialogue captions, and a deterministic schedule that
makes each channel behave like a station already on air. No backend, no API
keys, no downloads — it runs entirely in the browser as a static site.

Every scene is shot on a **photorealistic plate** — a photographic still of
the studio, landscape or set — with the channel's cast, props and broadcast
graphics composited over it and a film pass (grain, halation, haze, contact
shadows) tying the layers together. This holds for all twelve hand-crafted
channels *and* for every generated number on the infinite dial.

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
- **Remote buttons:** power, CH ▲▼, ⇄ LAST, VOL ±, mute, guide, random,
  favorite ★, captions (CC), fullscreen, share link, and ⚙ settings.
- **Keyboard:** ▲/▼ change channel · `L` last channel · `M` mute · `F`
  fullscreen · `G` guide · `0-9` direct tune (Enter commits) · `Esc` close
  overlays. Typing inside the guide search is never intercepted.
- **Last channel:** ⇄ (or `L`) hops back to the station you were watching a
  moment ago, and hops forward again if you press it twice — just like a real
  remote's "prev" button. It remembers one step, works out in the void, and
  lives for the current visit only (it is deliberately *not* persisted —
  `lastChannel` is).
- **Guide:** search, category filters, favorites-only filter; the "on air"
  row always agrees with the player because both use the same schedule code.
- **Deep links:** `#/c/<channel-slug>` — e.g. `#/c/space-court`. Works on
  refresh and when pasted (hash routing needs no server rewrites).
- Favorites, volume, mute, captions, CRT effects, reduced motion, voice
  narration, film grain & bloom, and last channel are saved in
  `localStorage`. The ⚙ panel has a **Reset preferences** action. Turning
  off film grain & bloom keeps the photographic sets but skips the
  per-pixel pass — worth trying if your device struggles.
- **Reduced motion** disables flicker, strobe and most canvas movement
  (and is auto-enabled on first visit if your OS prefers reduced motion).

## The infinite dial

The twelve channels above are hand-written. **Every other positive integer
is also a real channel**, conjured on demand by `src/data/generate.ts`:

- **Deterministic per number** — channel 100 is the same station on every
  device, forever: a fixed name, hosts, program loop, and accent palette
  derived from `mulberry32(hashString("inf-100"))`. Nothing is stored; the
  channel *is* its number.
- **Getting there:** press **CH ▲** past the last hand-crafted channel and
  you fall into the void (it starts at the lowest unused number and ascends
  forever); or type any number on the keypad (`0-9`, Enter); or hit the
  random button, which favors the void.
- **Generated stations** get their own name, tagline, hosts, segment titles,
  timed caption beats, sound cues, and accent colors. They borrow the
  renderer and music bed of the hand-crafted channel in the same category —
  "network family" affiliates — so every category's look is covered.
- **Everything still works out there:** deep links (`#/c/inf-100`),
  favorites (★), share links, captions, narration, and the deterministic
  schedule. The printed guide lists the hand-crafted twelve; the void is
  navigated with CH ▲▼, the keypad, or links.

## Project layout

```
public/
  plates/               photographic scene stills, one set per category
src/
  data/channels.ts      channel metadata + authored segments/beats (pure data)
  data/generate.ts      the infinite dial: deterministic procedural channels
  lib/
    plates.ts           deterministic plate choice + the camera move
    film.ts             grain, halation, haze, contact shadows, light wrap
    dial.ts             channel resolution + navigation (curated 12 + the void)
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

## The photoreal layer

Photorealism here is a **two-layer system**, because the dial is infinite and
per-channel artwork cannot be authored:

```
public/plates/*.jpg     photographic sets, one per category
public/subjects/*.jpg   photographic cast — hosts, creatures, players
src/lib/plates.ts       deterministic plate choice, camera move, cast compositing
src/lib/film.ts         grain, halation, haze, contact shadows, light wrap
src/channels/*.ts       props and broadcast graphics drawn on top
```

1. **Plate selection** — `plate = PLATES[channel.category][hash(channel, segment) % n]`.
   Same inputs, same still, on every device, forever. Nothing is stored.
2. **The camera** — each plate is cover-fitted and given a very slow push and
   drift (22–36 s, seeded per channel) so a still reads as a held shot rather
   than a slide. Reduced motion parks the camera.
3. **Grade + scrim** — the still is pulled toward the station's accent colour
   (`soft-light`), given a haze band along the bottom for depth, and scrimmed
   top and bottom so captions, tickers and bugs stay readable.
4. **The cast** — each category that has one also gets photographic subject
   plates (a host, a creature, an athlete). They are cropped to a portrait,
   feathered into the plate with a soft alpha mask, given a contact shadow and
   a slow breath so the join does not read as a rectangle. The drawn character
   is the fallback, not the main event.
5. **Props and graphics** — the channel's instruments, scoreboards, tickers,
   lower thirds and captions draw over the composite, which is exactly where
   they sit on a real broadcast.
6. **The film pass** — bloom (downsample → square → blur → `lighter`, so only
   highlights halate), animated photochemical grain (`overlay`), and haze.
   One frame, one image: the plate supplies light, material and depth, the
   subject plate supplies the performer, and the renderer supplies the
   broadcast around them.

Plates are a **progressive enhancement**. If an image has not decoded yet —
first frame after a cold cache, offline, or a failed request — `photoBackdrop()`
returns false and that channel renders the fully procedural scene it has always
drawn. The TV never shows a blank frame.

### Adding or swapping a plate

Drop a 16:9 still into `public/plates/` and add its name to that category in
`PLATES` (`src/lib/plates.ts`). Multiple entries per category are picked
between deterministically, so adding a second `nature-2.jpg` instantly gives
every nature channel — curated *and* generated — a second look. Keep stills
around 1365×768 JPEG (~200 KB); they are fetched lazily, one set at a time.

Subjects work the same way: drop a character still into `public/subjects/`
(shot with a blurred background so the feathered mask has something to melt
into), add it to `SUBJECTS`, and every channel in that category — including
the generated ones — gets that performer.

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
   It inherits the photographic plate for its category automatically; to give
   it its own, add a still to `PLATES` under that category.
4. **Composite** — in the renderer, call `photoBackdrop(ctx, f)` first and
   skip your drawn environment when it returns true, then finish with
   `filmPass(ctx, f)` (see any existing channel for the pattern).
5. Tests in `tests/content.test.ts` will automatically enforce ≥ 3
   segments, ≥ 3 beats each, sorted timings, unique ids, and a registered
   renderer; `tests/plates.test.ts` covers the photographic path. Run
   `npm test`.

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
  music, or samples. All dialogue is written for this project, all characters
  and broadcast graphics are drawn at runtime with Canvas 2D, and all audio is
  synthesized with Web Audio oscillators and a generated noise buffer. Any
  resemblance to real shows, products, or persons is parody/coincidence, and
  every "product" and "news story" is explicitly fictional.
- **The scene plates and the cast are AI-generated.** `public/plates/*.jpg`
  (sets) and `public/subjects/*.jpg` (hosts, creatures, players) are
  AI-generated photographic stills, committed to the repository and served as
  static assets — roughly 2.5 MB for the lot. They contain no real people,
  brands, or recognisable places, and no text. If you fork
  this project, be aware that generated imagery may carry different licensing
  considerations in your jurisdiction than the MIT-licensed code around it;
  swapping in your own photography is a one-line change per category.
- Everything except those stills is generated at runtime by the code in this
  repository.
- Fonts: system font stack only (no web font downloads).
- Dependencies: React, Vite, TypeScript, Vitest (MIT-licensed dev tooling).
- This project is released under the MIT License (see `LICENSE`).

## Real limitations

- **Simulated live:** deterministic per device clock; two devices with
  skewed clocks can be seconds apart. It is not a real broadcast feed.
- **Photorealism is photographic, not video.** Each scene is one still with a
  slow camera move; the cast and graphics are still drawn as vectors. It reads
  as a photographed set with characters in it, not as a film.
- **The film pass costs fill rate.** Grain and bloom run over every pixel. On
  a desktop GPU this is negligible; on a weak phone it can be the difference
  between smooth and not, which is why ⚙ has a **Film grain & bloom** toggle.
- **Audio** requires the initial user gesture (browser autoplay policy) —
  hence the "Turn on TV" button. Voice narration uses optional
  `speechSynthesis`; if unavailable, captions still carry all dialogue.
- **Fullscreen** is disabled where the browser does not support element
  fullscreen (e.g. iPhone Safari).
- No service worker is registered (nothing to cache-update), and there is
  no offline mode.
- Storage-less environments (some private modes) still work; preferences
  simply don't persist.
