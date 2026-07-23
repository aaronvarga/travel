---
name: travel-itinerary-recs
description: >-
  Audit and correct the TravelPlanner recommendation engine — the /55 scorecards, the ranking order, and
  the factual pros/cons/risks/metrics across every itinerary — so the hub reflects real family-travel
  considerations. Use this whenever the user wants to re-rank trips, verify or fix scores, reconcile budget
  numbers, correct a trip's claims (routes, ETIAS, licensing, reservations, temperatures, airline schedules),
  fix a scoreboard/card/rank-badge mismatch, or update the schedule language around the Pittsburgh June 24–26
  commitment. Trigger on things like "audit the rankings", "the scores are wrong", "re-rank the trips",
  "is Portugal really #1", "fix the pros and cons on <trip>", "reconcile the budgets", "the ranking doesn't
  match the table", "check the recommendation engine", or "update the return-date wording" — even when the
  user names a single trip and not the engine. This is the correctness/ranking counterpart to the
  travel-itinerary builder and travel-itinerary-photos refresher; reach for it to audit or fix an existing
  recommendation, not to build a new trip page or swap images.
---

# Travel Itinerary Recommendations Audit

The TravelPlanner hub contains 40 family-trip itineraries for a June 2027 vacation: 21 ranked comparison
plans, 9 excluded comparison references, and 10 short escapes ranked in their own band.
The ranking, the scores, and the prose on each trip page are three layers that **drift independently** — a
score change that isn't propagated to the static card, the scoreboard row, the rank badge, and the TL;DR box
produces a hub that silently contradicts itself. This skill audits those layers back into agreement and
fact-checks the itinerary prose against the decision profile.

Your job is correctness, not persuasion. Never invent a ranking to please the user; derive it from the
scorecards and the tie-break rules, then make every surface match what you derived.

## Ground truth (read these first, every time)

The repo already encodes the decisions — don't relitigate them, reconcile against them.

- `src/_data/decisionProfile.json` — **the canonical family profile**: party, budget target ($12k) / strongly
  preferred maximum ($15k; not an exclusion gate), the Pittsburgh commitment (preferred return 2027-06-23, evening OK; **required full days
  2027-06-24/25/26**), per-trip `tripWindows`, and `routeReadiness` gates. Treat this file as the source of
  truth for constraints; if the user states a new constraint, update this file, don't hardcode it elsewhere.
- `tools/scorecard.manifest.json` — the axis contract: axis ids, labels, `weightDefault`s, per-axis rubrics,
  the `ptoRubric` map, and the visited-places novelty list. Scores are justified against these rubrics.
- `CLAUDE.md` — the scoring rules and invariants in prose. Re-read the "Scoring rules" and "Invariants"
  sections before touching any score.
- `src/_data/<slug>/main.json` — per-trip source of truth (150–400KB, indent-2 pretty-printed). Holds
  `scorecard` (axes 1–5, `weightDefaults`, `budget`, `pto`, `facets`, `totalBaked`), the `parts[]` prose, and
  `recommended` / `excluded` flags.

## The scoring model (do the arithmetic, don't trust the bake)

Total is **/55**: `Budget×2 + Weather + Fire safety + Swim + Variety + Ease + Food + Risk + Nights + Novelty`, each axis
1–5. **PTO has `weightDefault` 0** — it's a slider-only axis, never in the default total.

- `scorecard.totalBaked` is a cached number. **Recompute it from the component axes every time** and treat a
  mismatch as the bug. `tools/verify-summary.mjs` asserts `totalBaked` against the manifest-weighted axes; if you
  change an axis you must recompute `totalBaked` and update every surface that cites it (see propagation).
- **Nights and PTO are derived, not free.** `validate-scorecards.mjs` recomputes `nights` from
  `pto.nights` (12+→5, 11→4, 10→3, 9→2, ≤8→1) and `pto` from `manifest.ptoRubric[pto.days]`. Set the source
  fields; don't hand-author the derived score to a value the rubric won't reproduce.
- `facets.hasSwim` must equal `swim >= 3`. `facets.swimTempF` is an ordered ambient/sea range (28–90°F);
  `heatedSwimTempF` (pools/geothermal) is separate and must not be conflated with sea temperature.
- **Budget score reflects confidence, not just the midpoint.** A reconciled, itemized estimate comfortably
  under target earns a high score; an unitemized, low-confidence contingency near the preferred maximum is
  penalized even at the same nominal number. A high case above $15k stays visible and strongly cautioned;
  budget alone never excludes an itinerary because quotes, trip length, or the family budget can change.

### Tie-breaks (in order)
within-preference band when Budget is weighted → PTO days → budget ceiling → budget floor. Encoded in `assets/js/board.js`. The static card
order, scoreboard row order, and rank badges must reproduce this exact sort at default weights. To verify,
simulate the sort: `(excluded, -weightedTotal, capBreach, ptoDays, ceil, floor)` and diff against the card
`href`s and `<tr data-trip>` order in `index.html`.

## Workflow

1. **Load ground truth.** Read `decisionProfile.json`, `scorecard.manifest.json`, and the `CLAUDE.md`
   scoring/invariants sections. Note any concurrent uncommitted work (`git status`) — photo refreshes and
   asset changes are common; **preserve them, never revert unrelated work**.
2. **Enumerate trips** from `src/_data/*/main.json`. Classify ranked vs excluded by the `excluded` string
   field. Confirm the 40 total / 21 ranked comparison / 9 excluded / 10 short counts. `recommended: true` means the page has all required sections — it is
   a **completeness gate, not an engine endorsement**; do not read it as a ranking signal.
3. **Recompute every metric.** For each trip: reconcile the budget category arithmetic against the page's own
   "Grand total" rollup; recompute each axis against its manifest rubric; recompute `totalBaked`. Record every
   delta.
4. **Verify derived axes and dates programmatically** — run `node tools/validate-scorecards.mjs`. It enforces
   the axis set, default weights, derived Nights/PTO, `hasSwim`, swim-temp ranges, budget fields, the 40/21/9/10
   counts, and that **no trip window overlaps June 24–26**. Fix source data until it passes; don't work around
   it.
5. **Audit the prose.** Fact-check pros/cons/risks against primary sources and the decision profile. Correct
   unsupported absolutes, route claims, licensing/IDP language, reservation requirements, ETIAS wording, and
   temperature semantics. Label every future-travel schedule claim with its confidence (see taxonomy below).
6. **Correct source JSON and hub copy.** Edit `main.json` via targeted string replacement (files are large).
   Then reconcile `index.html`: card order, `.sl-rank` badges, scoreboard `<tr>` order and total cells, the
   decision console, winner cards, and the practical comparison matrix.
7. **Rebuild and propagate** (see below).
8. **Verify order, totals, ranks, route gates**, then smoke-test URLs. Report the ranking, unresolved booking
   gates, validation results, and any visual check you couldn't complete.

## Route-readiness taxonomy

Future-travel routing is a booking gate, not a fact. Label each claim as one of — and keep the label in
`decisionProfile.json` `routeReadiness` when it gates a trip:

- **confirmed** — a real, bookable 2027 schedule verified.
- **current proxy** — a present-day schedule shown as a stand-in; 2027 not yet published.
- **exact-2027-schedule-required** — the plan depends on a connection whose 2027 timetable must be verified
  before booking.
- **reroute-required** — the published proxy does **not** support the plan as written (e.g. Greece's Tuesday
  Athens→Lisbon return); the itinerary needs a different routing.

## Propagation checklist (what drifts when a score changes)

A single axis edit ripples. After changing any score, update **all** of:

- `scorecard.totalBaked` in that trip's `main.json` (recomputed).
- The static scoreboard total cell, `<tr data-trip>` row order, card order, and `.sl-rank` badges in
  `index.html`. Tokens differ from slugs for some trips (`sicily`, `sardinia`, `greece`, `italy`, `turkey`,
  `california`, `southernfrance`).
- Any prose that cites the score or rank: hub cards, hero, decision console, winner cards, the practical
  matrix, and the **per-page TL;DR box** (injected into each ranked page's `overview` section, may cite
  "#N of 21" and the score).
- `assets/js/urlstate.js` — the hardcoded `AXES` array + `DEFAULT_W` are **positional**; they must match the
  manifest axis order and default weights exactly, or shared URL weight vectors decode wrong.

## Build and verify

```bash
npm test
npm run build   # validators -> summary/rank/images -> eleventy -> parity/performance audits
npm run sync
npm run sync:check
```

If `npm run` misbehaves, run the chain directly (note validate-scorecards is now part of the gate):

```bash
node tools/lint-sections.mjs && node tools/validate-scorecards.mjs && node tools/build-summary.mjs \
  && node tools/verify-summary.mjs && node ./node_modules/@11ty/eleventy/cmd.cjs
```

GitHub Pages serves root HTML, not `_site/`; use the safe sync commands above rather than copying directories manually.

Verify: `validate-scorecards` prints `40 scorecards (21 ranked comparison trips, 9 excluded, 10 short)`; `verify-summary` confirms the
static row/card/rank order equals the engine sort; `git diff --check` is clean. Then **verify in-browser**,
not with curl (curl triggers anti-bot false-negatives; a root service worker also serves the previous shell —
hard-refresh or clear CacheStorage). Confirm no regressions: duplicated blocks, clobbered fields, duplicate
images/cards.

## Pitfalls (these have bitten before)

- **Never trust `totalBaked`** — recompute from component axes.
- **Never rerun the itinerary generators** (`tools/create-*.mjs`, `refresh-*.mjs`) to "fix" a scorecard — they
  can overwrite manual scorecard corrections and exclusions. Treat builder scripts as potentially stale
  relative to the checked-in JSON; edit the JSON directly.
- **`String.prototype.replace` with a string replacement containing `$1`/`$2`/`$&`** silently does capture
  substitution and corrupts data. When scripting bulk edits, pass a **replacer function**, not a string.
- **Separate the four constraint kinds** and don't collapse them: hard constraints (Pittsburgh Jun 24–26),
  preferences (swimming, scenery), nominal planning windows (Jun 6 start is nominal — ranked Spain and Hawaii
  depart Jun 3 and Jun 5), and route-readiness gates. June 23 return is **preferred but optional**; only
  Jun 24–26 in Pittsburgh is mandatory.
- **`recommended: true` ≠ endorsement** — it's a section-completeness flag.
- **Generated output can drift from source** — always run `npm run sync:check`; never hand-edit root
  `index.html` or `locations/`.
- **Preserve concurrent asset/photo work** and publish only through `npm run sync` after the full build passes.
