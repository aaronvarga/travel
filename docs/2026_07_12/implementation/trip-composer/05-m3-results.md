# M3 results

- Status: success
- Added 11 curated legs: Algarve, Kefalonia, Lefkada, Athens + Cyclades, Switzerland, Slovenia, Mallorca, Malta, Venice + Dolomites, Sardinia, and Corsica.
- Reviewed all remaining extractor flags individually. Explicit heading mappings resolved sources whose spots lacked coordinates; genuine fixed-date PTO, previous/next-leg, and transfer contamination was rewritten or removed.
- Added 26 enabled directed edges, including Kefalonia→Lefkada and Sardinia↔Corsica ferry edges.
- `npm run validate:legs`: passed (15 legs)
- `npm run validate:combos`: passed (26 combos)
- `npm test`: passed (41 tests)
- `npm run build`: passed (57 generated HTML pages; performance audit green)
- Verified no canonical `main.json` file changed.

