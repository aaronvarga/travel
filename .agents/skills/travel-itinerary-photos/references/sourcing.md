# Sourcing, contact sheets, and the plan format

Detail for §2–§6 of SKILL.md. The goal is portfolio-grade photos, discovered via Google
Images, self-hosted, applied deterministically — and judged like an editor selecting a travel
magazine cover, not a scraper collecting proof-of-place images.

## The flagship-photo standard

Every photo needs a reason to exist. A winner usually has most of these qualities:

- **Immediate pull** — the subject is understandable in a second and makes the viewer want to
  enter the scene.
- **Sense of place** — it could not plausibly be filed under a dozen other destinations.
- **Composition and depth** — a strong foreground, leading line, layered landscape, or a clear
  focal point makes the frame work at card size as well as full screen.
- **Light and color** — golden/blue hour, clean sun, or intentional atmosphere; never flat,
  gray, or blown-out merely because the landmark is famous.
- **Trip promise** — it sells the actual reason this itinerary is compelling: a towering ridge,
  turquoise cove, volcano, sea-and-old-town reveal, or other signature experience.
- **Landscape safety** — horizontal enough to survive the carousel and card crop without
  decapitating the subject or turning the view into a narrow strip.

The home card is the strictest surface: pick the one flagship frame for the whole trip. Hero
shots should be broad and transporting. Carousel photos can be more specific, but should still
look intentional next to the flagship rather than like an unedited camera roll.

Fail a candidate immediately if it contains a watermark, agency bug, logo, UI/browser chrome,
caption burned into the pixels, date stamp, or visible low-resolution artifacts. A source page
may be legitimate while its preview image is not; judge the actual downloaded file.

## 1. Google Images discovery (the required channel)

For every subject (a spot, the hero, a base card), search image results with one or more of:

- `<location> professional photography`
- `<location> professional landscape photos`
- `<location> instagram photos horizontal`

Be specific — `Kaputas Beach Turkey professional landscape photos`, not `Turkey`. The
horizontal/instagram form biases toward landscape framing, which is what the carousels need.

**Thumbnails are banned.** A Google result thumbnail (`encrypted-tbn0.gstatic.com/…`) is a
low-res proxy that rots. Follow the result to its **source page** and take the full image from
there.

## 2. Anti-bot reality

Automating google.com/imghp or the image grid will frequently hit a CAPTCHA / "unusual
traffic" wall. Don't loop on it. Practical path:

1. Use image search (or a plain web search of the same query) to surface candidate **source
   pages** — Flickr photo pages, photography blogs, tourism boards, magazine features.
2. `WebFetch` the source page; pull the real image URL from `<meta property="og:image">`, the
   main `<img>`, or a "download/original" link.
3. Download that URL directly (see §4).

You are still "discovering via Google Images" — record it as such. The anti-bot workaround
only changes *how you fetch*, not the discovery channel.

## 3. Two-pass contact sheets before choosing — always

Download 4–8 candidates per subject, then montage so you judge them side by side instead of
committing to the first plausible hit. Keep a text list of the candidates in montage order.

```bash
mkdir -p /tmp/pics/<slug>/<subject>
# download candidates as 01.jpg 02.jpg … into that dir, then:
montage /tmp/pics/<slug>/<subject>/*.jpg \
  -tile 4x -geometry 400x300+6+6 \
  /tmp/pics/<slug>/<subject>_sheet.jpg
```

Open the sheet (Read the image file). Reject on sight:

- **Portrait / square crops** — carousels are landscape; a tall shot letterboxes ugly.
- **Storm, gloom, flat overcast, blown-out midday** — want golden/blue hour or clean drama.
- **Interiors, museum halls, close-up food** — unless the spot genuinely is that.
- **Watermarks, date-stamps, agency bugs, logos.**
- **Tourist snapshots** — centered, eye-level, no composition, phone-flat color.
- **Near-duplicates** of a shot already chosen for another slot — every image must be distinct.
- **Generic postcards** — pretty coastlines, town views, or pools that lack a defining subject,
  depth, or emotional pull.
- **Wrong promise** — an image that hides the defining half of a hybrid or sells an incidental
  stop over the experience the family is choosing.

Keep only the one or two that make you want to go there. Build a second, cross-surface finalist
sheet before selecting the card/hero/carousel winners. This catches two failures invisible in
single-subject sheets: several beautiful-but-nearly-identical coast shots, and one weak frame
next to otherwise exceptional photography.

Simulate the final crop for each card finalist before committing. A wide card crop is ruthless:
the subject should remain visible and compelling when top and bottom detail disappear. If the
candidate only works uncropped, choose another image rather than fight CSS with `object-position`.
If nothing clears the bar, re-subject: shoot the coastline the village sits on, the famous
overlook, the harbor at sunset. A stunning shot of the *area* beats a flat literal shot of the
*exact spot*.

## 4. Download & self-host

```bash
curl -L -A 'Mozilla/5.0' -o assets/img/<slug>/google_<subject>_01.jpg '<source-image-url>'
file assets/img/<slug>/google_<subject>_01.jpg   # confirm it's really a JPEG/PNG, not HTML
```

- Names are stable and descriptive: `google_kaputas_beach_01.jpg`, `google_antalya_hero_01.jpg`.
- Confirm size >10KB and `file` reports an image (a saved anti-bot HTML page will not).
- Do **not** use `tools/localize-images.mjs` — it only rewrites Unsplash/Pexels/Wikimedia CDN
  URLs and won't touch Flickr/blog/tourism sources.

## 5. Plan / manifest format

One plan per slug, saved to `assets/img/<slug>/_photo-plan.json`. It is both the input to
`apply-photos.mjs` and the provenance record ("Google Images discovered").

```json
{
  "carousels": {
    "c1": [
      { "file": "google_kaleici_harbor_01.jpg",
        "alt": "Antalya's Kaleici old harbor at golden hour, yachts below Roman walls",
        "captionTitle": "Kaleici Harbor",
        "credit": "Ali Yücel · Google Images source",
        "sourcePage": "https://www.flickr.com/photos/…/12345/",
        "discoveredVia": "Google Images" },
      { "file": "google_mermerli_beach_01.jpg",
        "alt": "Mermerli Beach terrace over turquoise water below Antalya's old walls",
        "captionTitle": "Mermerli Beach",
        "credit": "Deniz Kaya · Google Images source",
        "sourcePage": "https://…", "discoveredVia": "Google Images" }
    ],
    "c5": [ /* Kaputas Beach + Patara — one object per image, in carousel order */ ]
  },
  "htmlReplacements": {
    "https://images.unsplash.com/photo-OLD-hero?w=2400&q=80": "../../assets/img/<slug>/google_antalya_hero_01.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/…/OldBaseCard.jpg": "../../assets/img/<slug>/google_kas_card_01.jpg"
  }
}
```

Field rules (enforced or expected by `apply-photos.mjs` and `verify.mjs`):

- `file` — basename only; the file must already exist in `assets/img/<slug>/`.
- `href` and `src` are set by the script to the **same** local path — you don't write them.
- `captionTitle` — short (2–4 words), it overlays the photo.
- `alt` — one descriptive sentence (accessibility + the subject/light you chose).
- `credit` — `"<Photographer or Source> · Google Images source"`. The `· Google Images source`
  suffix is the manifest's discovery enforcement; keep it.
- `sourcePage` / `discoveredVia` — provenance; the script ignores them but they stay in the
  saved plan as the record.

### Finding the old URLs for `htmlReplacements`

`inventory.mjs` prints the hero pvcar image srcs, the base-card srcs, and any `--hero-url`
value. Those raw URLs are the keys; your new local paths are the values. Replace the hero
carousel's images and all three base cards. If a `--hero-url:url('…')` CSS value is present,
include that old URL as a key too (value = the local hero file).

### The home-page card (`src/_data/card-images.js`)

The hub's source of truth is the required entry for the slug in `src/_data/card-images.js`, not
generated `index.html`. Update that entry's `path` and `alt` after the selected winner is
self-hosted. The hub refuses to build when an itinerary lacks this deliberate selection, and
the responsive-image optimizer scans the manifest. Do not reintroduce an automatic “first local
image” fallback.

## 6. After applying

Run `verify.mjs` (must be clean), then `npm run build`, `npm run sync`, clear the service-worker
cache, and browser-screenshot the hero + base cards + one carousel plus the hub card. Make a
final generated-card contact sheet and a `document.images` broken-image check. Details in
SKILL.md §7–§8.
