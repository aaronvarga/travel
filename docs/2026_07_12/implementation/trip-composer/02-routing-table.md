# Trip Composer routing table

| Milestone | Primary work | Validation |
|---|---|---|
| M1 | Leg/edge schemas, extractor, validator, four hand-reviewed pilot legs | `npm run validate:legs`, review every `_review` item, `npm test`, `npm run build` |
| M2 | Reusable itinerary macros, deterministic composer/score estimator/combo validator, composed pages | byte-identical real-location diff after macro extraction; `npm run build`; unchanged hub and summary; `npm test` |
| M3 | Remaining eleven legs and expanded viable edge matrix | combo validation, build/time inspection, `npm test`, `npm run build` |
| M4 | Picker, hub link, client filter, sync prune/check, service-worker versioning and publish | browser JS-on/off checks, sync and stale-prune checks, live browser verification, `npm test`, `npm run build` |

