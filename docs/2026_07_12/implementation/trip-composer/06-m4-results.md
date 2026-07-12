# M4 results

- Implementation status: success; browser-only verification blocked by environment.
- Added server-rendered picker with 26 JS-off cards, safe inline JSON, cache-busted progressive filter, and hub link.
- Added symmetric stale-composer detection and pre-copy pruning to site sync.
- Bumped the service worker to `tp-v10` and added the versioned builder script to the app shell.
- Stale-prune acceptance: seeded `locations/combo--stale-prune-check`, ran sync, and verified it was removed.
- Rendered picker checks: 26 cards = 26 inline records; 12 start chips; Madeira exposes 5 partners; hub link and versioned script present.
- `npm test`: passed (41 tests)
- `npm run build`: passed
- `npm run sync && npm run sync:check`: passed
- Browser skill recovery was attempted as required, but the runtime reported no available browser backends. JS-on/local browser and live Pages browser checks remain unverified rather than being substituted with curl or claimed as passed.

