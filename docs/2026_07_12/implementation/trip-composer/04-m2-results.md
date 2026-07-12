# M2 results

- Status: success
- Extracted only the reusable day/spot/carousel macros.
- Hard gate: `diff -r --exclude='combo--*' /tmp/trip-composer-baseline/locations _site/locations` returned no differences.
- Added deterministic pair composition, canonical buffer-night timeline math, score/PTO estimation, combo validation, committed combo/index output, two pilot pages, curated hero rendering, map summary, budget and watch sections.
- `npm run validate:combos`: passed (2 combos)
- `npm test`: passed (41 tests)
- `npm run build`: passed
- Hard gate: `_site/index.html` byte-identical to baseline.
- Hard gate: `assets/trips-summary.json` byte-identical to baseline.
- Rendered Madeira + Crete inspection: 6 hero figures, 15 timeline days, unique DOM ids, 12 budget rows, PTO and draft banner present.

