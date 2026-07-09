# `main.json` contract

One `src/_data/<slug>/main.json` per trip; `src/itinerary.njk` paginates it into
`locations/<slug>/index.html`. This documents every field the template reads, so
a `create-<slug>.mjs` (using `scripts/itinerary-helpers.mjs`) produces a valid,
current-format page. Optional sidecars `photoGuide.json` / `foodGuide.json`
(`{ html }`) are out of scope by default — leave `hasPhotoGuide/hasFoodGuide` false.

## How a trip is built (why "clone", not "generate")

Every trip's chrome — the `<head>` stylesheet (~40 KB, still evolving), the
site-nav, the MapLibre/Leaflet JS — is **byte-identical boilerplate you clone
from a template trip and keep verbatim**. Only the destination content is
rebuilt. So `create-<slug>.mjs`:

1. Reads a complete current trip as the template (default `hawaii` — a known-good
   13-part layout with a MapLibre map that needs no separate lib part).
2. `sliceChrome(template.parts[0].html, title)` → `{ headBody, navToMain }`.
3. Rebuilds each section's HTML with the helpers, and the typed itinerary/map data.
4. Reassembles `parts[]` in the exact order below and writes `main.json`.

Pick the template by "most complete current trip" — clone whatever best reflects
today's design so you inherit the latest CSS/section set for free.

## Top-level fields

| field | type | notes |
|---|---|---|
| `recommended` | bool | `true` only if all 17 required sections present AND it's hub-integrated (scoreboard row/card + scorecard). New trips start `false`. |
| `slug` | string | dir name; also `mapPoints`/permalink. |
| `lang` | string | `"en"`. |
| `title` | string | `<title>` — "Place · Sub — Month Year". |
| `countries` | string[] | keys into `src/_data/shared/countries.json`; drives the `entry` section. Add the country there if missing (else that card renders empty). |
| `packingTags` | string[] | keys into `shared/packing.json` `modifiers` (`beach`,`hiking`,`heat`,`rain`,…); drives `packing`. |
| `overrides.packing` | string[]? | trip-specific packing `<li>` HTML, shown as a "This trip specifically" card. |
| `hasPhotoGuide`/`hasFoodGuide` | bool | keep false unless you also write the sidecar. |
| `mapPoints` | obj[] | `{ n, lat, lng, r, g, t }` via `point()`. `r`=region key, `t`=type (`flight/hotel/hike/beach/view/town/food`) for layer filtering. |
| `mapColors` | obj | `{ <regionKey>: "#hex" }`. Region order = first-appearance; palette `#1f6f78,#c25a3a,#3f7d4e,#3a6ea5,#7d5ba6,#b5566f` → `--c1..--c6`. |
| `itinerary` | obj | `{ className:"divider", labelHtml, daysClass:"days", days[] }`. |
| `parts` | arr | see below. |
| `preDepartureTodos` | obj | `{ labelHtml, blocks[], callout }` → `todo` marker. |
| `scorecard` | obj? | omit for a new unranked trip (adding it makes `build-summary` demand a hub row). Add during hub promotion. |

## `parts[]` — exact order (from the `hawaii` layout)

```js
[
  { t:'raw', html: `${headBody}${preview}${navToMain}${overview}${why}${stays}${calendar}` },
  { t:'itinerary' },                                   // renders itinerary.days
  { t:'raw', html: mapAirGround },                     // #map #air-travel #getting-around
  { t:'entry' },                                       // renders from countries + shared
  { t:'raw', html: healthTiming },                     // #health-check #timing
  { t:'todo' },                                        // renders preDepartureTodos
  { t:'raw', html: budgetTips },                       // #budget #totals #tips
  { t:'packing' },                                     // renders packingTags + overrides
  { t:'raw', html: socialBalanceStatus },              // #social #balance #status
  { t:'raw', html: mapScripts(template.parts[12].html, mapPoints, mapColors, mapTypes) },
]
```

The 17 required section ids (`tools/sections.manifest.json`): `overview, stays,
calendar, map, air-travel, getting-around, entry, health-check, timing, todo,
budget, totals, tips, packing, social, balance, status`. Plus the `why-this-trip`
pitch and the `preview` hero.

## Section anatomy (what each raw group contains)

- **preview** (hero, no id): `.pv-pane` (`.pv-kicker`/`h1`+`<span>`/`.pv-lead`/`.pv-stats` 4× / `.pv-split` water·town·nature / `.pv-cue`) + `.pvcar` carousel of the trip's best photos, captioned per day. → `preview()`.
- **overview**: `.overview > .ocard`(eyebrow/h4/p) ×3–4. Optional `.tldr` box only once hub-ranked.
- **why-this-trip**: `.plan-grid > .pcard` or `.tips-grid > .tipcard` ×3. → `card()`/`tipcard()`.
- **stays**: `.plan-grid > .pcard` (canary style) or `.bases > .base.bN`(band/bimg/bbody). → `card()`+`prow()`.
- **calendar**: the schematic `.cal-*` activity-block grid. → `calendarGrid()` (self-contained style).
- **map**: `.tripmap-wrap` with `.mapbtns` (one `<button data-region>` per region + "Whole trip") and `.mapstage`/`#tripmap`. Copy the `.mapstage`/layers markup from the template; only swap region buttons.
- **air-travel / getting-around**: `.plan-grid > .pcard` with `.prow` rows + `.tip`. → `card()`+`prow()`.
- **health-check**: `.hc-grid > .hc.{actnow|watch|good}`(`.hc-tag`/h4/p).
- **timing** (Week Later?): `.timing-compare > .tcard.{best|now}`(`.tlabel`/h4/`.trow`) + optional `.verdict-box`.
- **budget**: `table(['Line item','Estimate (family of 4)'], rows)` + `.twocol > .listcard.{save-list|splurge-list}`.
- **totals**: `table([...], rows, 'budget-tbl grand')` with a `.total` row + `.rate-note`.
- **tips**: `.tips-order > ol`(`<li>text<span>· when</span>`) + `.tips-grid > .tipcard` (`li.flag` = critical).
- **social**: `.tips-grid > .tipcard` (same shape as tips).
- **balance**: `.bar > i`(width%/`var(--cN)`) + `.balance > .bcard.kN`(`.pct`/h4/p).
- **status**: `.status > .scol.{settled|open} > .row`(b/span).

## Structured markers pull shared data (rendered by njk macros)

- `entry` ← `countries[]` × `shared/countries.json` (passport/ETIAS/visa/driving/money/water/emergency/esim/sources) + a fixed travel-insurance card.
- `packing` ← `shared/packing.json.base` + `packingTags` modifiers + `overrides.packing`.
- `todo` ← `preDepartureTodos`: `blocks[] = { when, title, items[], tone?:'hot'|'watch'|'done', note? }`, `callout`.

## Typed itinerary → spot fields (via `mkSpot()`)

`days[] = { id, colorClass('c0' travel | 'c1..cN' sleep base), badge, eyebrow('Sat
· Jun 12'), heading, feel, daycost, facts:[{label,valueHtml}], note, travelNote?,
spots[] }`. Each spot: `name, exploreHtml, carouselId(unique 'cN'), images:[{href?,
src, alt, captionTitle, credit}], cost, climateLabel, climate, saveHtml, splurgeHtml,
restoHtml(<li>…), altboxHtml(.alt-list), bloglinksHtml, lat, lng, spotMapHtml`.

## Scoring (don't relitigate — see repo CLAUDE.md)

`/50 = budget×2 + weather+swim+variety+ease+food+risk+nights+novelty` (pto weight 0,
slider-only). `scorecard.totalBaked` must equal that — `assertBaked(scorecard)`
throws otherwise. Nights rubric 12+→5,11→4,10→3,9→2,≤8→1. Budget vs $12k target /
$15k hard cap. Hard constraints: Jun 6–Aug 15 2027 window; **Jun 23–26 Pittsburgh
blackout untouchable**.

## Build & verify

```
node tools/create-<slug>.mjs                 # writes src/_data/<slug>/main.json
npm run build                                # lint-sections → build-summary → verify-summary → eleventy
cp -R _site/locations/ locations/            # GitHub Pages serves root HTML
```

`build-summary` fails on a `scorecard` with no hub scoreboard token — expected for
an unranked new trip; omit the scorecard until you promote it into `index.html`.
