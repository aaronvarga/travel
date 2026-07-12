# M1 results

- Status: success
- Added deterministic extraction drafts outside Eleventy data, standalone leg validation, four curated pilot legs, transfer templates, and four seed edges.
- Reviewed all extractor `_review` flags individually. Boundary days were removed/reframed; PTO and cross-leg language was stripped; mixed-region days retained only when both regions belong to the same leg.
- `npm run validate:legs`: passed (4 legs)
- contamination search: no unresolved trip-scoped phrases in curated leg prose
- `npm test`: passed (38 tests)
- `npm run build`: passed (29 canonical scorecards unchanged)

