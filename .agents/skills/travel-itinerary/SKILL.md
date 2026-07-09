---
name: travel-itinerary
description: Build a complete, repo-native family travel itinerary as a src/_data/<slug>/main.json page for the TravelPlanner Eleventy site — the photo-first hero, PTO/Health-Check analysis, an interactive map, day-by-day cards with photo carousels, an auto activity-block calendar, real researched prices/routes/restaurants, entry docs, packing, pre-departure to-dos, budget, and travel tips, in the exact current visual format of the existing trips (Portugal, Hawaii, Sicily-Malta, Sardinia-Corsica, Canary Islands). Use this skill whenever the user asks to plan a trip, build an itinerary, add a new destination to the comparison, or says things like "build me an itinerary for X", "plan our trip to X", "add X to the trip site", "make a travel doc for X", or names any destination in a family-vacation-planning context — even if they don't mention HTML, JSON, main.json, or the other trips explicitly. Also use it to update/extend a trip previously built this way (new dates, added stop, re-priced budget, better photos).
---

# Travel Itinerary Builder

Every trip on this site is the same document wearing a different destination. Don't
redesign anything — **clone the most complete current trip as a template, keep its
chrome verbatim, and rebuild only the destination content.** Spend your effort on
the two things that actually vary and that the user judges hardest: the **research**
(real prices, routes, restaurants) and the **photos** (real "wow" shots — see §3,
this is what the user reacts to first).

Output is a repo-native page: `src/_data/<slug>/main.json`, rendered by
`src/itinerary.njk` into `locations/<slug>/`. Read `references/main_json_schema.md`
for the full field/section contract, and build with `scripts/itinerary-helpers.mjs`.

## Defaults (use unless the user says otherwise)

- Family of 4, kids 13 & 8 (adjust for the trip year)
- 11–13 nights, Jun 2027, inside the **Jun 6–Aug 15 2027** window
- A return to Pittsburgh on **Jun 23 is acceptable and preferred**, including an evening arrival
- The family must be in Pittsburgh for the full days **Jun 24–26** — never be traveling or away on those dates
- Origin: Pittsburgh (PIT)
- Picky eaters — every stop needs a plain pizza/pasta/burger/fries/chicken option
- ~45% water/swim, 30% towns, 25% nature/hikes
- 2–4 home bases, minimizing backtracking

If the user gives a destination and nothing else, use these and say so rather than
stopping to ask — that's the point. Only ask when something genuinely can't be
inferred (e.g. "Asia" is too broad — you need a region/country).

## Workflow

### 1. Scope the trip

Pick (or confirm) dates, party, region/route. If given a country/region rather than
a specific route, research and choose the best-balanced 2–4-base route yourself, with
real driving/ferry/flight times, matching the activity mix. State your reasoning in
the Overview. Check the PTO angle: if a US holiday (Juneteenth, Memorial Day, July 4)
sits near the dates, work out whether a Thursday-evening departure onto the holiday
saves a PTO day — recompute the actual day-of-week for **this** trip year; don't reuse
a prior trip's calendar. When it lands, it belongs in Health-Check + the "Week Later?"
(`timing`) section. Don't force it if the dates don't line up.

### 2. Research, in parallel

Real research, not placeholder-filling — every price, ticket rule, restaurant, and
climate figure is something you actually looked up. Spawn one subagent per base/region
(plus one for flights/getting-around) so it happens in parallel and doesn't fill your
context. Ask each to report honest confidence flags ("current 2026 data" vs.
"estimated") rather than one confident-sounding number.

Every stop needs real numbers for: entry/ticket cost (and timed-entry rules), a
June air + water/pool temp, 2–3 real restaurants with picky-kid options, a lodging
band per base, and — the thing users call out hardest — real currently-priced
flights/ferries/trains, never stale or invented. If you can't find a real range, say
so and flag it; that beats a confident guess.

### 3. Source "wow" photos — this makes or breaks the doc

**This is the single thing the user judges the doc on first.** The photos in the hero
carousel and every stop are what they identify with and decide on. The bar is a
**professional's portfolio / viral-Instagram / magazine-cover** shot — the one that
makes someone stop scrolling and want to *go there*. A correct-but-dull picture is a
**failure here**, even though it shows the right place. "It's fine, it shows the
castle" is the failure mode — reach for the one that makes the reader want to go.

**Hold every candidate against this before it goes in:**
- Golden-hour / blue-hour / dramatic light, or a clean aerial/drone perspective. Flat overcast midday light is an automatic reject.
- Deliberate composition — leading lines, symmetry, a strong foreground subject, real depth. Not a centered eye-level snapshot.
- Saturated, true color and real dynamic range. Not washed-out, grey, or oversharpened HDR mush.
- Looks **shot by a photographer**, not a tourist or a municipal tourism board. If it reads like a Wikipedia infobox or a hotel-brochure plate, it's the wrong photo.
- No date-stamps, watermarks, people mugging at the camera, parking lots, crowds, or scaffolding in frame.

**Sources — Unsplash and Pexels only.** Both are free, professionally curated, and
hotlinkable. **Do not use Wikimedia/Commons** for hero or stop photos — those read
as amateur/infobox snapshots and cheapen the whole doc. (`wiki()` exists in the
helpers strictly as an absolute last resort and should stay unused on a good build.)

1. **Unsplash (primary).** WebSearch `"<specific place name> unsplash"` (e.g. `"Fortica Hvar unsplash"`, not just `"Hvar"`). Google/Bing index individual Unsplash photo pages, so snippets surface real `images.unsplash.com/photo-<id>` URLs. Build with the `unsplash(id)` helper. Reject `plus.unsplash.com` / `premium_photo` (paid tier).
2. **Pexels (equal peer).** When Unsplash is thin, search `"<place> pexels"` — real `images.pexels.com/photos/<id>/…jpeg`. Build with `pexels(id)`. Sometimes it simply has the better shot; treat it as a full peer, not a consolation.

**When a spot has no pro-grade coverage** (genuinely niche places): do **not** drop
to a dull snapshot to fill the slot. **Change the subject to something photogenic
nearby** — the coastline the village sits on, the famous overlook above it, the
harbor at sunset, the trail's payoff view. A stunning shot of the *area* beats a flat
literal shot of the *exact spot* every time. Fewer great photos beat more mediocre
ones — land 2 knockouts rather than pad to 3 with a weak one.

**Do this via subagents too** — one per base/region, each briefed with this rubric so
they come back with knockouts, not tourism-board filler. Then:
- Verify every surviving URL with `python3 scripts/verify_images.py` (host-agnostic reachability; rejects `plus.unsplash.com`/`premium_photo`). It proves the URL *resolves* — it can't judge quality; that call is yours, by eye, against the rubric above.
- **Credits:** each image carries `credit` = `"Photographer Name · Unsplash License"` or `"Photographer Name · Pexels License"`. Grab the photographer name from the search result.

Aim for ~3 images per stop, and a hero carousel that aggregates the trip's very best
shots (captioned per day). The first hero image is the single most striking shot in
the whole trip.

### 4. Write `tools/create-<slug>.mjs`

Model your builder on an existing one in `tools/` (e.g. `create-canary-islands.mjs`),
but **import the shared helpers instead of redefining them**:

```js
import fs from 'node:fs';
import * as H from '<skill>/scripts/itinerary-helpers.mjs';
const T = JSON.parse(fs.readFileSync('src/_data/hawaii/main.json','utf8'));   // template
const { headBody, navToMain } = H.sliceChrome(T.parts[0].html, 'Place · Sub — June 2027');
```

Then build with the helpers (see `references/main_json_schema.md` for every field):
`H.preview(...)` for the hero, `H.calendarGrid(...)` for the activity grid,
`H.mkSpot(...)`/`H.day(...)`/`H.fact(...)` for the typed itinerary,
`H.card()`/`H.prow()`/`H.table()`/`H.tipcard()`/`H.sectionLabel()` for the section
groups, `H.point()`/`H.mapColors` for the map, and `H.mapScripts(T.parts[12].html, …)`
for the trailing JS. Assemble `parts[]` in the exact documented order and write
`src/_data/<slug>/main.json`.

Write real prose in every field — no placeholders, no generic filler. Reuse the
structural judgment calls from existing trips (a travel/transition day is colored by
the *destination* base you sleep in, not the one you leave; "Also awesome instead"
alternates are genuinely comparable, not afterthoughts). Set `recommended:false` and
**omit `scorecard`** for a new trip — it renders as an unranked page; ranking is a
separate promotion step (§6).

### 5. Build and verify

```bash
node tools/create-<slug>.mjs                 # writes src/_data/<slug>/main.json
npm run build                                # lint-sections → build-summary → verify-summary → eleventy
cp -R _site/locations/ locations/            # GitHub Pages serves root HTML, not _site/
```

Then **actually look at it** — `python3 -m http.server` in the output dir and drive it
with the Chrome browser tool: scroll every section, click a carousel's next button and
a map region filter, confirm the hero carousel loads real photos (not broken-image
icons), the calendar grid places blocks on the right day+time, and the map pins
render. This has caught real bugs before (a broken JSON literal, a region-color
collision, a placeholder image) — don't skip it.

> Heads-up: this is a live repo that may have concurrent edits. Check `git status`
> before building; don't clobber unrelated work. `npm run build` regenerates
> `assets/section-status.json` and `assets/trips-summary.json`.

### 6. (Optional) Promote to ranked — hub integration

A new trip renders fine unranked. To put it on the decision dashboard, it's a separate,
deliberate step (the scoring is a settled family decision — see repo `CLAUDE.md`, don't
relitigate): add a `scorecard` (with `H.assertBaked(scorecard)` verifying
`totalBaked = budget×2 + the 8 axes`), then add its scoreboard `<tr data-trip>` row and
ranked `.sl-card` in `index.html` in the correct sorted position, and update any prose
citing counts/ranks. Flag this to the user rather than guessing the axis scores.

## Reusable assets (don't reinvent these)

- `scripts/itinerary-helpers.mjs` — the whole rebuild kit (hero, calendar grid, spots/days, section helpers, chrome slicing, map-script swap, scorecard check). Import it; don't copy helper bodies into each `create-<slug>.mjs`.
- `scripts/verify_images.py` — host-agnostic URL reachability + paid-tier rejection for photo candidates.
- `scripts/wikimedia_search.py` — absolute last-resort only; a good build never needs it (see §3).
- `references/main_json_schema.md` — the field/section/part contract.

## Things that have bitten past attempts

- **Dull photos cheapen the whole doc.** The most common complaint isn't a broken image — it's a *boring* one. Unsplash/Pexels only, apply the "wow" rubric by eye, and re-subject to a photogenic nearby view before ever settling for a flat literal shot. No Wikimedia. Fewer great photos beat more mediocre ones.
- **Don't invent flight/ferry prices.** Every doc that shipped a placeholder number got called out. Give a real current range or flag the uncertainty.
- **PTO math is easy to get subtly wrong.** Recompute the actual day-of-week for every date in *this* trip year.
- **Missing shared data renders blank.** If a country isn't in `shared/countries.json`, its `entry` card is empty — add it. Same for `packingTags` not in `shared/packing.json`.
- **A stray `scorecard` breaks the build.** `build-summary` demands a hub scoreboard row for any trip with a scorecard — omit it until you promote the trip (§6).
- **Keep main.json pretty-printed (indent 2).** Edit later via targeted string replacement, not full rewrites.
