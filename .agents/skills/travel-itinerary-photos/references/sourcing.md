# Sourcing, contact sheets, and the plan format

Detail for §2–§6 of SKILL.md. The goal is portfolio-grade photos, discovered via Google
Images, self-hosted, applied deterministically.

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

## 3. Contact sheet before choosing — always

Download 4–8 candidates per subject, then montage so you judge them side by side instead of
committing to the first plausible hit.

```bash
mkdir -p /tmp/pics/<slug>/<subject>
# download candidates as 01.jpg 02.jpg … into that dir, then:
montage /tmp/pics/<slug>/<subject>/*.jpg \
  -tile 4x -geometry 400x300+6+6 -background '#111' -title '<subject>' \
  /tmp/pics/<slug>/<subject>_sheet.jpg
```

Open the sheet (Read the image file). Reject on sight:

- **Portrait / square crops** — carousels are landscape; a tall shot letterboxes ugly.
- **Storm, gloom, flat overcast, blown-out midday** — want golden/blue hour or clean drama.
- **Interiors, museum halls, close-up food** — unless the spot genuinely is that.
- **Watermarks, date-stamps, agency bugs, logos.**
- **Tourist snapshots** — centered, eye-level, no composition, phone-flat color.
- **Near-duplicates** of a shot already chosen for another slot — every image must be distinct.

Keep only the one or two that make you want to go there. If nothing clears the bar, re-subject:
shoot the coastline the village sits on, the famous overlook, the harbor at sunset. A stunning
shot of the *area* beats a flat literal shot of the *exact spot*.

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
  },
  "indexCard": {
    "file": "google_antalya_hero_01.jpg",
    "alt": "Antalya's Kaleici old harbor at golden hour below Roman walls"
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

### The home-page card (`index.html`)

`inventory.mjs` also prints the trip's home-page card image (the `.sl-card .sl-photo <img>` in
the repo-root `index.html`) and its host. Give the plan an `indexCard` block — the script finds
that slug's card, swaps the src to `assets/img/<slug>/<file>` (root-relative, since `index.html`
is at the root, **not** `../../…`), and updates the card's `alt` if you supply one. Self-host
the file under `assets/img/<slug>/` first, exactly like the other images (your hero winner is a
natural choice). Unlike the trip page, `index.html` is a source file — no `cp` step needed after.

## 6. After applying

Run `verify.mjs` (must be clean), then `npm run build`, `cp -R _site/locations/ locations/`,
clear the service-worker cache, and browser-screenshot the hero + base cards + one carousel,
plus a `document.images` broken-image check. Details in SKILL.md §7–§8.
