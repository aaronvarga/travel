---
name: travel-itinerary-photos
description: Upgrade the photos on an existing TravelPlanner trip page (src/_data/<slug>/main.json) to professional, self-hosted "wow" shots — replacing Wikimedia/Unsplash/Pexels/remote images (in the day carousels, the hero, and the base cards) with photographer-grade images discovered via Google Images, downloaded, and self-hosted under assets/img/<slug>/. Use this skill whenever the user wants better/nicer/more professional photos on a trip, says the pics look amateur/boring/broken/Wikimedia, asks to "upgrade the photos", "replace the images", "self-host the pictures", "fix the photos on <trip>", "make the carousels look pro", or "swap the wiki photos" for a trip that already exists on the site — even if they don't name a file, carousel, or host. This is the photo-refresh counterpart to the travel-itinerary builder; reach for it to improve an existing page's imagery, not to build a new trip.
---

# Travel Itinerary Photo Upgrade

Photos are the thing the user decides on **first** — a correct-but-dull shot is a failure,
not a pass. This skill replaces every remote/amateur image on an existing trip page with a
professional-grade, self-hosted one. The mechanical surgery (inventory, JSON rewrite, verify)
is done by bundled scripts so it's exact and repeatable; **your effort goes into finding
knockout photos and rejecting mediocre ones by eye.**

The page you're editing is `src/_data/<slug>/main.json` (150–400KB, indent-2 pretty-printed).
**Four** photo surfaces belong to a trip:
- **Day carousels** — `itinerary.days[].spots[].images[]`, keyed by `carouselId` (c0, c1…).
- **Hero** — a full-bleed `.pvcar` carousel of `<figure><img>` inside `parts[0].html`, and on
  some trips a `--hero-url:url(...)` CSS background.
- **Base cards** — three `<img class="bimg">` in `parts[0].html`.
- **Home-page card** — the trip's `.sl-card .sl-photo <img>` in the repo-root `index.html`
  (the decision-hub grid). This one lives in a *different* file and is easy to forget — many
  cards still point at a remote Unsplash URL even when the trip page itself is fully localized.
  Its image path is **root-relative** (`assets/img/<slug>/…`, no `../../`) because `index.html`
  sits at the repo root, unlike the trip pages under `locations/<slug>/`.

Read `references/sourcing.md` for the Google-Images discovery recipe, the contact-sheet
workflow, and the full rejection rubric. Work one slug at a time.

> **This is a live repo with unrelated uncommitted edits.** `git status` before you start
> and only ever touch the slug you're upgrading (`src/_data/<slug>/main.json`, its
> `assets/img/<slug>/` files, and its one card in `index.html`). **Never** `git checkout` /
> `git restore` / `git stash` to undo an experiment — sibling trip files carry uncommitted
> work that a checkout silently discards. If you need a sandbox, copy the file aside; don't
> revert it. `apply-photos.mjs` only rewrites the one slug and the one card, by design.

## Workflow

### 1. Inventory first — never guess what's there

```bash
node <skill>/scripts/inventory.mjs <slug>
```

It prints every carousel (id, spot, image count, which are remote), the hero's pvcar image
count and any `--hero-url`, the base-card srcs, and a host tally (wikimedia / unsplash /
pexels / other-remote vs. local). `maps.wikimedia.org` tiles are map infrastructure and are
excluded — only `upload`/`commons.wikimedia.org` count as photos to kill. A trip already at
`0` remote is done; don't churn it.

### 2. Source only through Google Images discovery

For each subject, discover via web/Google Images image search using **these query forms**
(this is a hard requirement — the provenance is what makes the shots pro-grade, and the
credit + plan record must say so):

- `<location> professional photography`
- `<location> professional landscape photos`
- `<location> instagram photos horizontal`

**Never use a Google thumbnail URL.** Thumbnails are tiny and hotlink-rotted. Open the real
source page the result points to (Flickr, a photography blog, a tourism board, a magazine)
and take the full-resolution source image URL from *that* page.

### 3. Expect anti-bot pages — discover, then fetch from source

Google's own UI automation will hit CAPTCHA/anti-bot walls. Don't fight them. Use image
search to *discover the source pages*, then fetch the actual image directly from the source
page (WebFetch the page, read the `<img>`/og:image, download that URL). You still record
"discovered via Google Images" in the plan/manifest and credit — the discovery channel is the
requirement, the fetch path is just pragmatism.

### 4. Build a contact sheet before choosing — always

Download every candidate to `/tmp/pics/<slug>/<subject>/` and montage them into one sheet so
you compare at a glance instead of committing to the first hit. See `references/sourcing.md`
for the exact `montage` command. Then **reject by eye**: portrait crops (carousels are
landscape), storm/gloom/flat-overcast light, interiors, watermarks/date-stamps, tourist
snapshots, and near-duplicates of another slot. Keep only shots that would sit in a
photographer's portfolio. Fewer great photos beat more mediocre ones.

### 5. Self-host every selected image by hand

Save each winner into `assets/img/<slug>/` with a **stable, descriptive name**:
`google_<subject>_01.jpg` (e.g. `google_kaputas_beach_01.jpg`). Do **not** run the repo's
`localize-images.mjs` for these — it only handles Unsplash/Pexels/Wikimedia CDNs and will
choke on Flickr/blog/tourism-board URLs. Download them yourself (`curl -L` with a browser
User-Agent, or WebFetch → write bytes) and confirm each file is a real image >10KB.

### 6. Apply the plan with the script — don't hand-edit the JSON

Author a plan JSON (this doubles as the provenance manifest; save it to
`assets/img/<slug>/_photo-plan.json`) mapping carousels and raw HTML URLs to your new local
files, then run:

```bash
node <skill>/scripts/apply-photos.mjs <slug> assets/img/<slug>/_photo-plan.json
```

Plan shape (full example in `references/sourcing.md`):

```json
{
  "carousels": {
    "c1": [
      { "file": "google_kaleici_harbor_01.jpg",
        "alt": "Antalya's Kaleici old harbor at golden hour, yachts below Roman walls",
        "captionTitle": "Kaleici Harbor",
        "credit": "Ali Yücel · Google Images source",
        "sourcePage": "https://www.flickr.com/photos/…", "discoveredVia": "Google Images" }
    ]
  },
  "htmlReplacements": {
    "https://images.unsplash.com/photo-OLD-hero?…": "../../assets/img/turkish-riviera/google_antalya_hero_01.jpg",
    "https://upload.wikimedia.org/…/OldCard.jpg": "../../assets/img/turkish-riviera/google_kas_card_01.jpg"
  },
  "indexCard": { "file": "google_antalya_hero_01.jpg", "alt": "Antalya's Kaleici harbor at golden hour" }
}
```

The script replaces each carousel's images wholesale (in order), sets `href` and `src` to the
**same** local path, string-swaps the raw hero/base-card URLs in `parts[0].html`
(longest-first, so no partial clobber), and — from `indexCard` — swaps the trip's home-page
`.sl-card` image in `index.html` (scoped to this slug's card, written **root-relative**, alt
updated if given). It keeps indent-2 format and refuses to write anything if a referenced file
is missing or the JSON won't parse. `captionTitle` stays short; `alt` is descriptive; `credit`
ends in `· Google Images source`. Reuse your best hero winner as the `indexCard` file (a
distinct card shot is fine too) — just self-host it under `assets/img/<slug>/` like the rest.

### 7. Verify the upgrade is clean

```bash
node <skill>/scripts/verify.mjs <slug>
```

Gate: **0** wikimedia photos, **0** unsplash, **0** pexels, 0 other remote image URLs; every
structured carousel `src` starts with `../../assets/img/<slug>/`; every embedded HTML photo
ref is local **and the file exists**; the trip's home-page `.sl-card` image in `index.html` is
local with its file present; JSON parses. Fix anything it flags before building.

### 8. Build and browser-check — actually look at it

```bash
npm run build
cp -R _site/locations/ locations/    # GitHub Pages serves root HTML, not _site/
```

A root service worker caches the shell — clear CacheStorage / hard-refresh before screenshots
or you'll shoot the stale version. Then drive `locations/<slug>/` with the Chrome browser
tool: screenshot the hero, the base cards, and at least one day carousel (click its next
button), and browser-eval `document.images` to confirm **zero** `naturalWidth===0` (broken)
images. Check for the classic regressions: a duplicated image across two cards, a portrait
shot letterboxed in a landscape slot, a caption/credit on the wrong photo.

## Things that bite

- **Thumbnails and hotlinks rot.** Self-host every image; never leave a remote src. That's the whole point — verify enforces it.
- **`localize-images.mjs` is the wrong tool here.** It's for Unsplash/Pexels/Wikimedia CDNs only. Flickr/blog/tourism URLs must be downloaded by hand (§5).
- **Dull beats broken as the top complaint.** Run the contact sheet and the rubric every time; re-subject to a photogenic nearby view rather than settle for a flat literal shot.
- **Don't hand-edit the JSON.** Targeted string edits on a 300KB file clobber fields silently. `apply-photos.mjs` does it safely and re-checks parse.
- **Same image twice = a caught regression.** Keep names unique per subject; the browser pass is where duplicates surface.
- **The home-page card lives in a different file.** It's the most-forgotten surface — a fully-localized trip page still shows a remote card on the hub. `inventory.mjs` reports it, `indexCard` in the plan updates it, `verify.mjs` gates it. Its path is root-relative (`assets/img/<slug>/…`), and after editing `index.html` you don't need `cp` — it's a source file, not generated. Screenshot the hub card too.
