# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static Eleventy site (GitHub Pages) with 45 fully-built family trip itineraries for a June 2027 vacation (family of 4 from Pittsburgh, kids 13 and 8): 25 ranked comparison plans, 9 excluded comparison references, and 11 short escapes.

## Commands

```bash
npm test          # semantic, evidence, scenario, ranking, and generated-parity tests
npm run build     # all validators -> summary/rank/image generation -> Eleventy -> payload audit
npm run serve     # eleventy dev server
npm run sync      # safely publish _site/index.html + _site/locations to the root Pages output
npm run sync:check
```

GitHub Pages serves root HTML, not `_site/`. Never copy by hand: `npm run sync` updates the deployable root output and `npm run sync:check` detects drift.

## Architecture

Two generated page layers, one canonical data graph:

1. **Decision hub** — `src/index.njk`, with the canonical scoreboard rendered by `src/_includes/hub/scoreboard.njk` from `src/_data/hub.js`. Progressive-enhancement JS reads `assets/trips-summary.json` for re-weighting, scenarios, evidence explanations, family fit, filters, comparison, and URL state. `index.html` is generated deploy output, not an editing source.
2. **Trip pages** — `src/itinerary.njk` paginates over `src/_data/trips.js`, rendering one page per `src/_data/<slug>/main.json` into `_site/locations/<slug>/index.html`.

**`src/_data/<slug>/main.json` is the per-trip source of truth** (pretty-printed, indent 2). Key fields:

- `parts[]` — ordered page sections. Most are `{t:"raw", html:"..."}` chunks; structured markers `{t:"entry"|"packing"|"itinerary"|"todo"}` are rendered by njk macros from data (`countries` + `shared/countries.json` drive the entry section; `preDepartureTodos` drives todo).
- `scorecard` — axes (1–5), `weightDefaults`, `budget` band, `pto`, `facets`, `totalBaked`.
- `recommended: true` — means the page has all required planning sections; it is a completeness gate, not the ranking verdict. `excluded: "<reason>"` sinks a trip to the unranked reference group.
- `evidence.json` — axis rationales, source links/tiers, direct-vs-proxy status, confidence, freshness, and explicit unknowns.
- `variants.json` — immutable `canonical` baseline plus additive shorter/cheaper alternatives when facts support them.

`tools/scorecard.manifest.json` is the axis contract; `tools/evidence.manifest.json` is the evidence contract. `tools/build-summary.mjs` merges scorecards, evidence, variants, and section status into `assets/trips-summary.json`. Server and browser ranking both use the shared engine in `tools/lib/recommendation-engine.mjs` / `assets/js/recommendation-engine.js`.

## Scoring rules (decisions already made — don't relitigate)

- Total is **/55**: Budget ×2 + Weather, Fire safety, Swim, Variety, Ease, Food, Risk, Nights, Novelty (each /5). **PTO has weightDefault 0** (slider-only, not in the total).
- Budget is scored against a **$12k target / $15k strongly preferred maximum** using each page's own "Grand total" rollup. Budget remains double-weighted, and a planning range above $15k stays visibly cautioned, but cost alone never hides or excludes an itinerary. The preferred maximum can change as quotes, trip length, or the family budget changes.
- Nights rubric: 12+→5, 11→4, 10→3, 9→2, ≤8→1. Novelty rubric: overlap vs the visited-places list in `scorecard.manifest.json`.
- Default tie-breaks (in order): within-preference budget band when Budget has nonzero weight → PTO days → budget ceiling → floor. Encoded in the shared recommendation engine; static hub output must reproduce it.
- **Albania, Balkans, California, Canary Islands, Croatia, Italy: Salento-Amalfi, Southern France, Spain, and Turkish Riviera are excluded** by family decision. Croatia is the documented 2026 repeat; all nine remain visible as unranked "EX" references.
- The Portugal/Italy preference bias is **retired** from ranking; novelty expresses it via data.
- The nominal planning window is Jun 6–Aug 15, 2027, but it is not a hard boundary: the Spain and Hawaii plans depart Jun 3 and Jun 5. Returning to Pittsburgh on **Jun 23 is acceptable and preferred**, including an evening arrival. The only hard calendar constraint is that the family must be in Pittsburgh for the full days **Jun 24–26**; no itinerary may travel or be away on those dates.

## Invariants (things that break silently if ignored)

- `verify-summary.mjs` asserts every trip's `totalBaked` matches the manifest-weighted axes. Change any axis → recompute `totalBaked`, rebuild, and update any editorial prose citing scores/ranks.
- Live JS sort must equal the static card order at default weights. After scoring changes, simulate: sort trips by (excluded, -weighted total, crosses-preferred-maximum, pto days, ceil, floor) and compare against card hrefs.
- `assets/js/urlstate.js` has a hardcoded `AXES` array + `DEFAULT_W` that must match the manifest's axis order and default weights exactly (URL weight vectors are positional).
- `recommended: true` requires all 17 sections (lint-sections gate fails the build otherwise). Section detection = `<section id="...">` anchors in part html + structured part markers. `tools/sections.manifest.json` lists required sections.
- Each ranked trip page carries a TL;DR box (injected into the `overview` section html) that may cite its rank and score — rank shifts require updating these across affected trips.
- A root-scoped service worker (`sw.js`) keeps documents network-first, isolates photos in a bounded 80-entry image cache, and caches an itinerary only when the visitor chooses “Save trip offline.” Hard-refresh (or clear CacheStorage) after a cache-version change.
- `node tools/optimize-images.mjs --check` enforces responsive derivative dimensions/bytes; archival `assets/img/` originals are inputs and are not copied into deployed output.

## Editing notes

- `main.json` files are 150–400KB; edit via targeted string replacement (script), not full reads. Keep the indent-2 pretty-printed format.
- Edit the generated hub in `src/index.njk` and its hub includes/data, never in root `index.html`.
- `docs/ux-upgrade-plan.md` is the phased plan behind the interactive hub features (Phases 1–8: board engine, re-weighting, URL state, filters, compare, meters, print, service worker).

## Travel Itineraries / Project Conventions

- Always build travel itineraries in the repo-native Eleventy/JSON format integrated into `index.html` — never as standalone HTML or Dropbox docs.
- Match the existing custom map panel pattern, not a generic Leaflet component.
- Photos: go for the "Wow!" factor — pro / viral / Instagram-worthy shots. Never Wikimedia or plain snapshots that look unprofessional. Never reuse the same image across days/cards. Photos are what the user decides on first.

## Verification / Workflow

- Work directly on `main` by default. Never create or use a feature branch unless the user explicitly asks for one; implementation, commit, and push requests do not authorize a feature branch.
- After any bulk edit, script injection, or extract/transform script, verify in-browser and check for regressions (duplicated blocks, clobbered fields, duplicate images/cards) before committing.
- Use browser verification over `curl` — `curl` triggers anti-bot false-negatives.
