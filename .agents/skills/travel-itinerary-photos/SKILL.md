---
name: travel-itinerary-photos
description: Upgrade the photos on an existing TravelPlanner trip page (src/_data/<slug>/main.json) to aspirational, self-hosted flagship photography — replacing Wikimedia/Unsplash/Pexels/remote images and any dull, generic, watermarked, portrait, or accidental selections in day carousels, heroes, base cards, and the home-page card. Use this skill whenever the user wants better/nicer/more professional photos on a trip, says the pics look amateur/boring/broken/Wikimedia, asks to "upgrade the photos", "replace the images", "self-host the pictures", "fix the photos on <trip>", "make the carousels look pro", or asks for more epic/iconic/click-worthy travel imagery. This is the photo-refresh counterpart to the travel-itinerary builder; reach for it to improve an existing page's imagery, not to build a new trip.
---

# Travel Itinerary Photo Upgrade

Photos are the thing the user decides on **first** — a correct-but-dull shot is a failure,
not a pass. Treat every visible image as a miniature travel poster: it should make someone
want to be there, not merely prove that the place exists. The mechanical surgery (inventory,
JSON rewrite, verify) is done by bundled scripts so it's exact and repeatable; **your effort
goes into finding knockout photos and rejecting mediocre ones by eye.**

The home-page card is the quality bar for the rest of the trip. Its image should be the one
unmistakable, aspirational frame that sells the itinerary at a glance. Carousel images may be
more specific to an activity or stop, but every one still needs the same professional visual
standard. Read `references/sourcing.md` before sourcing: it contains the flagship-photo rubric,
the two-pass contact-sheet process, and the rendered-crop check.

The page you're editing is `src/_data/<slug>/main.json` (150–400KB, indent-2 pretty-printed).
**Four** photo surfaces belong to a trip:
- **Day carousels** — `itinerary.days[].spots[].images[]`, keyed by `carouselId` (c0, c1…).
- **Hero** — a full-bleed `.pvcar` carousel of `<figure><img>` inside `parts[0].html`, and on
  some trips a `--hero-url:url(...)` CSS background.
- **Base cards** — three `<img class="bimg">` in `parts[0].html`.
- **Home-page card** — the trip's required entry in `src/_data/card-images.js`, rendered into
  the decision-hub grid. This is the source of truth; root `index.html` is generated output.
  It deliberately prevents the hub from silently using the first arbitrary itinerary photo.

Work one slug at a time. Never let a technically valid local image pass without a visual review.

> **This is a live repo with unrelated uncommitted edits.** `git status` before you start
> and only ever touch the slug you're upgrading (`src/_data/<slug>/main.json`, its
> `assets/img/<slug>/` files, and its one entry in `src/_data/card-images.js`). **Never** `git checkout` /
> `git restore` / `git stash` to undo an experiment — sibling trip files carry uncommitted
> work that a checkout silently discards. If you need a sandbox, copy the file aside; don't
> revert it. `apply-photos.mjs` only rewrites the one slug; update the card-image manifest
> separately and only for that slug.

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

### 1a. Write the visual brief before searching

For each surface, name the desired emotional payoff and the strongest visual subject. Use the
trip's actual promise, not a generic landmark: volcanic drama for Iceland, a cliff-and-cove
reveal for a coast, a ridge with scale for a hiking itinerary, or a luminous old town above
water for a culture-and-sea itinerary. The home card gets the single best frame; the hero gets
the broadest scene; carousel shots can tell the supporting story without repeating either.

If the exact stop has no remarkable photography, broaden to the most photogenic nearby view
that truthfully represents the day's experience. A stunning regional image beats a flat,
literal record shot.

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

### 4. Build contact sheets before choosing — always

Download 4–8 credible candidates to `/tmp/pics/<slug>/<subject>/` and montage them into one
sheet so you compare at a glance instead of committing to the first hit. Keep the filenames or
a small candidate list beside the sheet so the winner is unambiguous. Then make a second sheet
of only the finalists across related surfaces to catch duplicates and uneven quality.

Reject by eye: portrait or square crops (carousels are landscape), flat or blown-out light,
interiors, watermarks/date-stamps/agency bugs, website screenshots, logos, tourist snapshots,
and near-duplicates. Also reject a technically beautiful image if it lacks a clear focal point
or could belong to any destination. Keep only frames that would sit in a professional travel
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
  }
}
```

The script replaces each carousel's images wholesale (in order), sets `href` and `src` to the
**same** local path, string-swaps the raw hero/base-card URLs in `parts[0].html`
(longest-first, so no partial clobber). It keeps indent-2 format and refuses to write anything
if a referenced file is missing or the JSON won't parse. `captionTitle` stays short; `alt` is
descriptive; `credit` ends in `· Google Images source`.

For the home card, update that slug's explicit entry in `src/_data/card-images.js` after the
winner is self-hosted. Set its `path` and a descriptive `alt`; do not edit generated
`index.html`, and do not restore the old automatic-image fallback. Reuse the most aspirational
hero winner when it is truly the best crop, otherwise select a distinct flagship image.

### 7. Verify the upgrade is clean

```bash
node <skill>/scripts/verify.mjs <slug>
```

Technical gate: **0** wikimedia photos, **0** unsplash, **0** pexels, 0 other remote image
URLs; every structured carousel `src` starts with `../../assets/img/<slug>/`; every embedded
HTML photo ref is local **and the file exists**; JSON parses.

Visual gate: the final sheet contains only landscape, watermark-free frames with clear subjects,
depth, pleasing light, and no duplicate composition. The card-image manifest has one distinct,
existing image for every itinerary. A card or carousel that is merely "fine" fails this gate.

### 8. Build and browser-check — actually look at it

```bash
npm run build
npm run sync
```

A root service worker caches the shell — clear CacheStorage / hard-refresh before screenshots
or you'll shoot the stale version. Then drive `locations/<slug>/` with the Chrome browser
tool: screenshot the hero, the base cards, and at least one day carousel (click its next
button), and browser-eval `document.images` to confirm **zero** `naturalWidth===0` (broken)
images. Make a final generated hub-card contact sheet as well. Check for the classic
regressions: a duplicated image across two cards, a portrait shot letterboxed in a landscape
slot, a watermark or logo missed in source review, and a caption/credit on the wrong photo.

## Things that bite

- **Thumbnails and hotlinks rot.** Self-host every image; never leave a remote src. That's the whole point — verify enforces it.
- **`localize-images.mjs` is the wrong tool here.** It's for Unsplash/Pexels/Wikimedia CDNs only. Flickr/blog/tourism URLs must be downloaded by hand (§5).
- **Dull beats broken as the top complaint.** Run both contact-sheet passes and the rendered-crop review every time; re-subject to a photogenic nearby view rather than settle for a flat literal shot.
- **Don't hand-edit the JSON.** Targeted string edits on a 300KB file clobber fields silently. `apply-photos.mjs` does it safely and re-checks parse.
- **Same image twice = a caught regression.** Keep names unique per subject; the browser pass is where duplicates surface.
- **The home-page card is deliberate data, not a convenient fallback.** Update its entry in `src/_data/card-images.js`; the generated hub and responsive-image pipeline will carry it through. Screenshot the hub card too.
