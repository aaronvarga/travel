# 22-trip reranking — validated planning audit

Research date: 2026-09-11. Baseline: a03d855e. Branch: main.

Scope is the user-confirmed 22-trip shortlist. The nine family-excluded references and eleven short escapes were not reranked. The original 40/21/9/10 description is stale: this checkout validates 42/22/9/11. The user subsequently authorized the evidence corrections needed to unblock the full build; the validator was not weakened.

This is a reconciled planning audit, not a complete set of bookable supplier quotes. Four complete outer cash itineraries reached Google Flights booking-option pages; other checks are explicitly gateway/component proxies. Exact lodging configurations, car coverage, most activity checkouts and all four-seat award searches remain unconfirmed. Do not interpret a stored estimate as a current quote.

## Complete deterministic ranking

All 22 alternatives independently spend the same 200,000 Capital One miles for $2,000 eligible travel credit at 1 cent/mile. Confidence is high for that redemption mechanism, conditional on an eligible charge; trip cost estimates are medium/low confidence. Award availability is unverified for every trip. Cash-only plans retain all 200,000 miles and cost the gross band.

| New | Previous | Trip | Score /55 | Gross cash | Net cash | Savings | Redemption confidence |
|---:|---:|---|---:|---|---|---:|---|
| 1 | 1 | Slovenia + Adriatic | 44 | $12,200–$15,400 | $10,200–$13,400 | $2,000 | Fixed high; awards unverified |
| 2 | 5 | Iceland + Ischia + Cilento | 42 | $10,400–$14,900 | $8,400–$12,900 | $2,000 | Fixed high; awards unverified |
| 3 | 4 | Iceland | 42 | $12,420–$15,320 | $10,420–$13,320 | $2,000 | Fixed high; awards unverified |
| 4 | 3 | Madeira + Mallorca | 41 | $13,100–$15,900 | $11,100–$13,900 | $2,000 | Fixed high; awards unverified |
| 5 | 8 | Greece: Ionian Islands | 41 | $10,800–$15,000 | $8,800–$13,000 | $2,000 | Fixed high; awards unverified |
| 6 | 6 | Madeira + Sicily | 40 | $12,600–$15,950 | $10,600–$13,950 | $2,000 | Fixed high; awards unverified |
| 7 | 13 | Greek Cyclades | 38 | $12,800–$16,970 | $10,800–$14,970 | $2,000 | Fixed high; awards unverified |
| 8 | 18 | Hawaii: Oahu + Big Island | 37 | $11,000–$15,800 | $9,000–$13,800 | $2,000 | Fixed high; awards unverified |
| 9 | 7 | Portugal (Algarve + Madeira) | 37 | $11,975–$16,500 | $9,975–$14,500 | $2,000 | Fixed high; awards unverified |
| 10 | 2 | Portugal (Lisbon) + Sicily | 37 | $14,150–$17,150 | $12,150–$15,150 | $2,000 | Fixed high; awards unverified |
| 11 | 9 | Portugal (Lisbon) + Crete | 37 | $12,530–$17,165 | $10,530–$15,165 | $2,000 | Fixed high; awards unverified |
| 12 | 10 | Sicily & Malta | 37 | $13,000–$18,700 | $11,000–$16,700 | $2,000 | Fixed high; awards unverified |
| 13 | 11 | Crete: Chania + Rethymno + Agios Nikolaos | 37 | $14,200–$18,300 | $12,200–$16,300 | $2,000 | Fixed high; awards unverified |
| 14 | 12 | Venice, Dolomites & Sardinia | 37 | $13,200–$18,890 | $11,200–$16,890 | $2,000 | Fixed high; awards unverified |
| 15 | 15 | Switzerland + Sicily | 36 | $14,000–$19,350 | $12,000–$17,350 | $2,000 | Fixed high; awards unverified |
| 16 | 14 | Portugal (Algarve) + Sicily | 36 | $15,300–$19,400 | $13,300–$17,400 | $2,000 | Fixed high; awards unverified |
| 17 | 21 | Switzerland + Crete | 36 | $14,120–$19,440 | $12,120–$17,440 | $2,000 | Fixed high; awards unverified |
| 18 | 17 | Madeira + Kefalonia | 36 | $13,700–$17,300 | $11,700–$15,300 | $2,000 | Fixed high; awards unverified |
| 19 | 16 | Madeira + Crete | 36 | $13,710–$18,250 | $11,710–$16,250 | $2,000 | Fixed high; awards unverified |
| 20 | 19 | Greece via Lisbon | 35 | $11,150–$17,600 | $9,150–$15,600 | $2,000 | Fixed high; awards unverified |
| 21 | 20 | Sardinia & Corsica | 35 | $12,880–$19,300 | $10,880–$17,300 | $2,000 | Fixed high; awards unverified |
| 22 | 22 | Hawaii: Maui + Kauai | 35 | $15,600–$22,400 | $13,600–$20,400 | $2,000 | Fixed high; awards unverified |

Iceland + Ischia/Cilento remains reroute-required. Its high raw score is not a book-ready recommendation. The reroute may materially exceed the retained airfare estimate. No family exclusion was removed and no readiness gate was hidden.

## Every score change

| Trip | Changed axis | Before → after | Evidence / calculation |
|---|---|---|---|
| Slovenia + Adriatic | budget | 2 → 4 | Gross $12,200–$15,400 minus $2,000 = $10,200–$13,400; manifest threshold applied. Raise airfare from $4,800–6,400 to $6,300–7,000: observed family base $5,342, four checked bags $720 and estimated paid seats $200–800. Round conservatively; do not assume free assigned seats. |
| Iceland + Ischia + Cilento | budget | 2 → 4 | Gross $10,400–$14,900 minus $2,000 = $8,400–$12,900; manifest threshold applied. Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates. |
| Iceland | budget | 2 → 4 | Gross $12,420–$15,320 minus $2,000 = $10,420–$13,320; manifest threshold applied. Reprice family airfare to $3,600–4,200 including the observed Basic/Standard options, four checked bags and estimated seats; the former $2,600 floor excluded those costs. |
| Madeira + Mallorca | budget | 1 → 2 | Gross $13,100–$15,900 minus $2,000 = $11,100–$13,900; manifest threshold applied. Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates. |
| Greece: Ionian Islands | budget | 2 → 4 | Gross $10,800–$15,000 minus $2,000 = $8,800–$13,000; manifest threshold applied. Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates. |
| Madeira + Sicily | budget | 1 → 2 | Gross $12,600–$15,950 minus $2,000 = $10,600–$13,950; manifest threshold applied. Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates. |
| Greek Cyclades | budget | 1 → 2 | Gross $12,800–$16,970 minus $2,000 = $10,800–$14,970; manifest threshold applied. Increase Athens airfare to $5,800–7,200 for bags/seats above the four-person fare snapshot. Increase Milos–Athens to $650–850: the stored $154/person September 10 snapshot already exceeds the old $300–480 family allowance before bags. |
| Hawaii: Oahu + Big Island | budget | 1 → 2 | Gross $11,000–$15,800 minus $2,000 = $9,000–$13,800; manifest threshold applied. Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates. |
| Portugal (Lisbon) + Sicily | budget | 2 → 1 | Gross $14,150–$17,150 minus $2,000 = $12,150–$15,150; manifest threshold applied. Replace the unsupported $5,800 all-flight hard gate with $6,900–8,300: $4,798 Lisbon gateway return plus $1,160 stored Monday Palermo connection, $720 bag proxy, $200–800 seats and up to $800 open-jaw uncertainty. These are rounded allowances, not a Catania-return quote. |
| Switzerland + Crete | risk | 2 → 3 | The September 10 exact-date ZRH–HER June 14 nonstop is selling from $149/person, replacing the old unpublished/weekly-Chania assumption. Like Switzerland + Sicily, the open-jaw checkout and mountain weather remain gates: Risk 3/5, not 2/5. This is stored prior-day evidence, not four-seat award availability. |

Every Nights and PTO axis was re-derived from the canonical hotel nights and PTO days; none changed. All weighted totals were recomputed. The nine other non-Budget axes were reviewed against their stored rubrics and evidence; except Switzerland + Crete Risk, these scores were retained. They were not all independently remeasured from new weather/fire datasets, and must not be described as new 2027 forecasts. PTO still has zero default weight.

## Rank-only movement and tie breaks

The shared engine sorts by weighted score, budget-preference tier when Budget is weighted, PTO days, net ceiling, net floor, then display name. No points bonus axis was added.

Counterfactual definition: a rank-only mover has unchanged component scores and reaches the same new rank when its own old values are restored while every other trip remains updated. Cost-only movement is not automatically called another trip’s effect.

- Portugal (Algarve + Madeira): #7 → #9, 37/55; same rank in the others-only counterfactual.
- Portugal (Lisbon) + Crete: #9 → #11, 37/55; same rank in the others-only counterfactual.
- Sicily & Malta: #10 → #12, 37/55; same rank in the others-only counterfactual.
- Venice, Dolomites & Sardinia: #12 → #14, 37/55; same rank in the others-only counterfactual.
- Portugal (Algarve) + Sicily: #14 → #16, 36/55; same rank in the others-only counterfactual.
- Madeira + Crete: #16 → #19, 36/55; same rank in the others-only counterfactual.
- Greece via Lisbon: #19 → #20, 35/55; same rank in the others-only counterfactual.
- Sardinia & Corsica: #20 → #21, 35/55; same rank in the others-only counterfactual.

## Sensitivity analysis

Regenerated 25,000 deterministic profiles using seed 20260709. The candidate set is unchanged at 22 ranked full trips (previously 22); no short escapes or excluded references entered the simulation. Percentages are weight sensitivity, not probabilities of vacation quality, prices, or booking success. Unchanged trips can gain or lose share when another trip’s Budget, Risk or tie-break costs change.

| Trip | Previous win % | New win % | Previous top-three % | New top-three % |
|---|---:|---:|---:|---:|
| Slovenia + Adriatic | 33.3 | 50.9 | 77.4 | 94 |
| Iceland + Ischia + Cilento | 16 | 25.7 | 30.4 | 51.8 |
| Iceland | 9.1 | 8.5 | 29.6 | 50.7 |
| Madeira + Mallorca | 14.7 | 6.8 | 54.6 | 55.1 |
| Greece: Ionian Islands | 0.4 | 0.9 | 3.8 | 11.6 |
| Madeira + Sicily | 2.3 | 1.5 | 18.8 | 19.5 |
| Greek Cyclades | 0 | 0 | 0 | 0.1 |
| Hawaii: Oahu + Big Island | 7.2 | 5.7 | 16.6 | 16.5 |
| Portugal (Algarve + Madeira) | 1.5 | 0 | 8.7 | 0 |
| Portugal (Lisbon) + Sicily | 15.1 | 0 | 50.2 | 0.3 |
| Portugal (Lisbon) + Crete | 0 | 0 | 3.1 | 0.1 |
| Sicily & Malta | 0 | 0 | 4.4 | 0.1 |
| Crete: Chania + Rethymno + Agios Nikolaos | 0 | 0 | 0.1 | 0 |
| Venice, Dolomites & Sardinia | 0 | 0 | 0 | 0 |
| Switzerland + Sicily | 0 | 0 | 0.1 | 0 |
| Portugal (Algarve) + Sicily | 0 | 0 | 0 | 0 |
| Switzerland + Crete | 0 | 0 | 0 | 0 |
| Madeira + Kefalonia | 0 | 0 | 0 | 0 |
| Madeira + Crete | 0 | 0 | 0 | 0 |
| Greece via Lisbon | 0 | 0 | 0 | 0 |
| Sardinia & Corsica | 0 | 0 | 0 | 0 |
| Hawaii: Maui + Kauai | 0.2 | 0 | 2.2 | 0.3 |

## Per-trip audit and open booking assumptions

### #1 Slovenia + Adriatic

Window: 2027-06-08 through 2027-06-22. Hotel nights: 12; PTO: 8. Route readiness: confirmed.

Cash check: complete round-trip; PIT–YYZ–MUC–LJU / LJU–EWR–PIT; family base $5,342. Four-passenger June 8–22, 2027 booking option. Outbound arrives June 9 12:35, with 3h05 YYZ and 1h35 MUC connections. Return nonstop LJU–EWR then 2h30 connection to PIT. This contradicts the old claim that Ljubljana has no long-haul service. Final airline checkout remains required.

Raise airfare from $4,800–6,400 to $6,300–7,000: observed family base $5,342, four checked bags $720 and estimated paid seats $200–800. Round conservatively; do not assume free assigned seats.

| Item | Low | High | Basis |
|---|---:|---:|---|
| PIT–Ljubljana family round-trip airfare, bags and seat allowance | $6,300 | $7,000 | Planning estimate; exact checkout open |
| Lodging: 12 hotel nights, four bases | $1,950 | $2,500 | Planning estimate; exact checkout open |
| Rental car, e-vignette, fuel, tolls, parking | $1,000 | $1,500 | Planning estimate; exact checkout open |
| Activities: gorges, cable car, rafting, caves, castle | $850 | $1,250 | Planning estimate; exact checkout open |
| Food and groceries, 13 travel days | $1,700 | $2,250 | Planning estimate; exact checkout open |
| Insurance, ETIAS, fees, misc buffer | $400 | $900 | Planning estimate; exact checkout open |

Gross $12,200–$15,400; fixed redemption $2,000; net $10,200–$13,400. Cash airfare allocation $6,300–$7,000; remaining airfare after credit $4,300–$5,000. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/slovenia-adriatic/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key slovenia-adriatic. No transfer or promotional bonus contributes savings.

### #2 Iceland + Ischia + Cilento

Window: 2027-06-10 through 2027-06-23. Hotel nights: 12; PTO: 8. Route readiness: reroute-required.

No new complete four-person cash quote. Stored previous-day component evidence: PIT–KEF is selling June 10–23 from $663 round trip, but no Thursday nonstop is offered; KEF–FCO on June 15 also requires a connection. The assumed Icelandair stopover construction still does not exist, so re-date or rebuild the air stack before booking. This prior September 10 component evidence was reviewed, not newly reproduced for four passengers; retain the booking gate.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Air · PIT→KEF stopover→FCO / FCO→PIT, seats + bags | $3,600 | $4,800 | Planning estimate; exact checkout open |
| Lodging · 4 Reykjavík / 3 Forio / 4 Castellabate / 1 Fiumicino | $2,550 | $3,750 | Planning estimate; exact checkout open |
| Ground transport · Iceland car, rail, hydrofoils, Italy car, fuel/tolls/parking | $1,400 | $2,000 | Planning estimate; exact checkout open |
| Food + groceries · 14 travel days | $1,550 | $2,200 | Planning estimate; exact checkout open |
| Activities · pools, castle, Negombo, Paestum and boats | $800 | $1,350 | Planning estimate; exact checkout open |
| Insurance, eSIM, fees + contingency | $500 | $800 | Planning estimate; exact checkout open |

Gross $10,400–$14,900; fixed redemption $2,000; net $8,400–$12,900. Cash airfare allocation $3,600–$4,800; remaining airfare after credit $1,600–$2,800. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/iceland-ischia-cilento/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key iceland-ischia-cilento. No transfer or promotional bonus contributes savings.

### #3 Iceland

Window: 2027-06-08 through 2027-06-21. Hotel nights: 12; PTO: 8. Route readiness: confirmed.

Cash check: complete round-trip; PIT–YUL–KEF / KEF–YUL–PIT; family base $2,619. Basic $2,619 plus $180 checked bag per person; Standard $3,499 includes the checked bag but charges for seats. Flex $5,191 includes seats/refunds. Selected June 8–21, 2027 flights show a same-day return. No nonstop outbound in these results.

Reprice family airfare to $3,600–4,200 including the observed Basic/Standard options, four checked bags and estimated seats; the former $2,600 floor excluded those costs.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Protected one-stop family airfare, bags and seat allowance | $3,600 | $4,200 | Planning estimate; exact checkout open |
| Lodging: 12 hotel nights | $3,200 | $3,900 | Planning estimate; exact checkout open |
| Rental SUV, fuel, road tax, tolls | $1,570 | $1,920 | Planning estimate; exact checkout open |
| Food and groceries, 13 travel days | $2,300 | $2,700 | Planning estimate; exact checkout open |
| Activities: glacier hike, boats, lagoons, tickets | $1,250 | $1,600 | Planning estimate; exact checkout open |
| Insurance, eSIM, fees, buffer | $500 | $1,000 | Planning estimate; exact checkout open |

Gross $12,420–$15,320; fixed redemption $2,000; net $10,420–$13,320. Cash airfare allocation $3,600–$4,200; remaining airfare after credit $1,600–$2,200. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/iceland/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key iceland. No transfer or promotional bonus contributes savings.

### #4 Madeira + Mallorca

Window: 2027-06-08 through 2027-06-21. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–BOS–LIS–FNC, June 8–21; family base $6,204. Four-passenger TAP/JetBlue result; does not price Catania exit or internal flights. United nonstop EWR–FNC connection shown from $7,189 family round-trip. Shared gateway evidence from madeira-sicily; not this complete open jaw.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Flights, seats, bags · PIT/FNC/LIS/PMI/PIT gated | $6,700 | $7,500 | Planning estimate; exact checkout open |
| Funchal lodging · 5 nights | $800 | $1,100 | Planning estimate; exact checkout open |
| Lisbon buffer hotel · 1 night | $140 | $220 | Planning estimate; exact checkout open |
| Palma lodging · 2 nights | $400 | $620 | Planning estimate; exact checkout open |
| Playa de Muro / Alcudia lodging · 4 nights | $960 | $1,210 | Planning estimate; exact checkout open |
| Two rental cars, fuel, parking, transfers | $900 | $1,300 | Planning estimate; exact checkout open |
| Food, groceries, casual dinners · 13 days | $1,850 | $2,250 | Planning estimate; exact checkout open |
| Activities · Madeira trails/cable car/toboggan + Soller/Drach/beach shade | $800 | $1,100 | Planning estimate; exact checkout open |
| Insurance, fees, misc buffer | $550 | $600 | Planning estimate; exact checkout open |

Gross $13,100–$15,900; fixed redemption $2,000; net $11,100–$13,900. Cash airfare allocation $6,700–$7,500; remaining airfare after credit $4,700–$5,500. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: 2026 individual trail fee €4.50; full PR1 €10.50. Timed reservations required. These are current published fees, not guaranteed 2027 prices; permit/trail access can remove a headline day. [Madeira 2026 trail fees and reservations](https://visitmadeira.com/en/blog/visit-madeira/everything-you-need-to-know-about-hiking-in-madeira-in-2026/)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/madeira-mallorca/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key madeira-mallorca. No transfer or promotional bonus contributes savings.

### #5 Greece: Ionian Islands

Window: 2027-06-09 through 2027-06-22. Hotel nights: 12; PTO: 9. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–JFK–ATH–EFL, June 9–22; family base $5,529. Four-passenger Aegean/American result; does not price the corrected Athens exit. Retain the Athens buffer night and drive.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Airfare, multi-city (EFL in / ATH out), family of 4 | $5,600 | $6,700 | Planning estimate; exact checkout open |
| Lodging: 12 nights including Athens airport buffer (estimate) | $1,700 | $2,800 | Planning estimate; exact checkout open |
| Rental cars (two islands) + fuel | $800 | $1,300 | Planning estimate; exact checkout open |
| Inter-island ferry, parking, water-taxi, local transport | $150 | $300 | Planning estimate; exact checkout open |
| Food and groceries, 13 travel days | $1,560 | $2,200 | Planning estimate; exact checkout open |
| Activities: caves, Zakynthos + Meganisi boats, sunbeds | $520 | $850 | Planning estimate; exact checkout open |
| Travel insurance, ETIAS, fees, buffer | $470 | $850 | Planning estimate; exact checkout open |

Gross $10,800–$15,000; fixed redemption $2,000; net $8,800–$13,000. Cash airfare allocation $5,600–$6,700; remaining airfare after credit $3,600–$4,700. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/greece-ionian/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key greece-ionian. No transfer or promotional bonus contributes savings.

### #6 Madeira + Sicily

Window: 2027-06-08 through 2027-06-21. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–BOS–LIS–FNC, June 8–21; family base $6,204. Four-passenger TAP/JetBlue result; does not price Catania exit or internal flights. United nonstop EWR–FNC connection shown from $7,189 family round-trip.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Flights · PIT-FNC + FNC-LIS + LIS-PMO + CTA-PIT, family of 4 | $5,900 | $6,800 | Planning estimate; exact checkout open |
| Lodging · 12 nights, apartment-first (Funchal 5 + Lisbon 1 + Sicily 6) | $2,350 | $3,300 | Planning estimate; exact checkout open |
| Food · groceries, casual lunches, simple dinners | $2,100 | $2,450 | Planning estimate; exact checkout open |
| Rental cars ×2 · Madeira ~5 days + Sicily 6 days, automatic + full cover | $850 | $1,200 | Planning estimate; exact checkout open |
| Fuel, tolls, parking, Lisbon transfers | $450 | $600 | Planning estimate; exact checkout open |
| Activities · trail fees, cable car + toboggans, pools, skywalk, La Rocca, theatre, optional Etna/boat | $600 | $1,100 | Planning estimate; exact checkout open |
| Travel insurance / passports buffer / misc. | $350 | $500 | Planning estimate; exact checkout open |

Gross $12,600–$15,950; fixed redemption $2,000; net $10,600–$13,950. Cash airfare allocation $5,900–$6,800; remaining airfare after credit $3,900–$4,800. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: 2026 individual trail fee €4.50; full PR1 €10.50. Timed reservations required. These are current published fees, not guaranteed 2027 prices; permit/trail access can remove a headline day. [Madeira 2026 trail fees and reservations](https://visitmadeira.com/en/blog/visit-madeira/everything-you-need-to-know-about-hiking-in-madeira-in-2026/)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/madeira-sicily/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key madeira-sicily. No transfer or promotional bonus contributes savings.

### #7 Greek Cyclades

Window: 2027-06-08 through 2027-06-21. Hotel nights: 12; PTO: 8. Route readiness: confirmed.

Cash check: exact-date gateway round-trip search, not checkout; PIT–YYZ–ATH, June 8–21; family base $5,202. Four-passenger Air Canada result; return flight and fare brand not selected. The $5,182 Montreal option has a 54-minute connection and is not the planning choice.

Increase Athens airfare to $5,800–7,200 for bags/seats above the four-person fare snapshot. Increase Milos–Athens to $650–850: the stored $154/person September 10 snapshot already exceeds the old $300–480 family allowance before bags.

| Item | Low | High | Basis |
|---|---:|---:|---|
| PIT <-> Athens round-trip airfare | $5,800 | $7,200 | Planning estimate; exact checkout open |
| Milos -> Athens domestic flight (family) | $650 | $850 | Planning estimate; exact checkout open |
| Inter-island ferries (3 legs, family) | $340 | $540 | Planning estimate; exact checkout open |
| Lodging: 12 hotel nights, four bases | $2,150 | $2,880 | Planning estimate; exact checkout open |
| Rental cars (3 islands), fuel, parking | $850 | $1,200 | Planning estimate; exact checkout open |
| Activities: Acropolis, Kleftiko boat, beaches | $900 | $1,400 | Planning estimate; exact checkout open |
| Food and groceries, 13 travel days | $1,650 | $2,200 | Planning estimate; exact checkout open |
| Insurance, ETIAS, fees, misc buffer | $460 | $700 | Planning estimate; exact checkout open |

Gross $12,800–$16,970; fixed redemption $2,000; net $10,800–$14,970. Cash airfare allocation $6,450–$8,050; remaining airfare after credit $4,450–$6,050. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: Current standard cancellation refunds step down at 14 days, 7 days and 12 hours; ferries are not airline-protected connections. Exact summer 2027 chain still requires inventory. [Seajets cancellation terms](https://tickets.seajets.com/TermsEN.pdf)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/greece-cyclades/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key greece-cyclades. No transfer or promotional bonus contributes savings.

### #8 Hawaii: Oahu + Big Island

Window: 2027-06-05 through 2027-06-15. Hotel nights: 9; PTO: 7. Route readiness: confirmed.

Cash check: gateway round-trip proxy for open-jaw; PIT–SEA–HNL, June 5–15; family base $3,488. Four-passenger Alaska result; return search date is a gateway proxy, not the required Kona June 14 red-eye. Bags/seat selection extra.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Flights — PIT→HNL / KOA→PIT | $3,600 | $4,400 | Planning estimate; exact checkout open |
| Inter-island HNL→KOA | $300 | $600 | Planning estimate; exact checkout open |
| Oahu day rental + Big Island rental + parking/fuel | $1,100 | $1,400 | Planning estimate; exact checkout open |
| Waikiki lodging, 4 nights (practical family stay, no luxury/ocean-view baseline) | $1,400 | $2,300 | Planning estimate; exact checkout open |
| Kona condo, 3 nights (practical family condo, kitchen/parking prioritized) | $900 | $1,500 | Planning estimate; exact checkout open |
| Volcano cottage/lodge, 2 nights | $600 | $1,000 | Planning estimate; exact checkout open |
| Food — groceries + casual restaurants, 10 travel days | $1,600 | $2,200 | Planning estimate; exact checkout open |
| Hanauma Bay + Pearl Harbor fees/logistics | $180 | $280 | Planning estimate; exact checkout open |
| North Shore / Waimea Valley day | $180 | $260 | Planning estimate; exact checkout open |
| One major paid splurge — Kealakekua snorkel or luau, not both | $420 | $650 | Planning estimate; exact checkout open |
| State/National Park fees + incidentals | $320 | $510 | Planning estimate; exact checkout open |
| Insurance and contingency | $400 | $700 | Planning estimate; exact checkout open |

Gross $11,000–$15,800; fixed redemption $2,000; net $9,000–$13,800. Cash airfare allocation $3,900–$5,000; remaining airfare after credit $1,900–$3,000. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: Published afternoon starting prices $117 adult age13+ and $90 child4–12 imply $441 for 3 adult-fare travelers plus one child, before checkout taxes/seasonal variation. Do not price both children at the child rate. [Fair Wind afternoon snorkel starting prices](https://www.fair-wind.com/afternoon-kealakekua-snorkel-tour/)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/hawaii/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key hawaii. No transfer or promotional bonus contributes savings.

### #9 Portugal (Algarve + Madeira)

Window: 2027-06-10 through 2027-06-23. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: complete open-jaw, internal flight separate; PIT–BOS–LIS / FNC–LIS–BOS–PIT; family base $5,457. Selected four-passenger booking option; displayed bag fee $0–262 per person depends on fare. Budget conservatively for bags; final fare brand and ticket protection need airline checkout. The separate Faro–Madeira flight is additional.

Use $6,000–7,400 outer airfare, encompassing the observed $5,457 base and variable bags/seats; Faro–Madeira $750–1,000 is a conservative estimate from the stored $169/person component plus bags. Add an explicit $400–700 insurance/contingency allowance. Lodging remains unquoted.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Flights — international, open-jaw (PIT↔Lisbon / Madeira) | $6,000 | $7,400 | Planning estimate; exact checkout open |
| Internal flight Faro–Lisbon–Funchal, bags and seats | $750 | $1,000 | Planning estimate; exact checkout open |
| Rental cars — mainland and Madeira, one-way drop, fuel/tolls allowance | $675 | $1,250 | Planning estimate; exact checkout open |
| Docs & extras — ETIAS, 2× IDP, Fast Track, eSIM, transfers | $250 | $350 | Planning estimate; exact checkout open |
| Lodging — 12 nights, 3 bases (rough — not researched) | $2,200 | $3,500 | Planning estimate; exact checkout open |
| Food + activities — sum of the daily blocks above | $1,700 | $2,300 | Planning estimate; exact checkout open |
| Insurance and contingency | $400 | $700 | Planning estimate; exact checkout open |

Gross $11,975–$16,500; fixed redemption $2,000; net $9,975–$14,500. Cash airfare allocation $6,750–$8,400; remaining airfare after credit $4,750–$6,400. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: 2026 individual trail fee €4.50; full PR1 €10.50. Timed reservations required. These are current published fees, not guaranteed 2027 prices; permit/trail access can remove a headline day. [Madeira 2026 trail fees and reservations](https://visitmadeira.com/en/blog/visit-madeira/everything-you-need-to-know-about-hiking-in-madeira-in-2026/)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/portugal/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key portugal. No transfer or promotional bonus contributes savings.

### #10 Portugal (Lisbon) + Sicily

Window: 2027-06-08 through 2027-06-21. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–LHR–LIS, June 8–21; family base $4,798. Four-passenger British Airways result; not a Catania-return quote. The stored Monday June 14 Lisbon–Palermo component is $290/person, not Tuesday’s cheaper nonstop. Add bags/seats and an open-jaw uncertainty reserve.

Replace the unsupported $5,800 all-flight hard gate with $6,900–8,300: $4,798 Lisbon gateway return plus $1,160 stored Monday Palermo connection, $720 bag proxy, $200–800 seats and up to $800 open-jaw uncertainty. These are rounded allowances, not a Catania-return quote.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Flights · PIT-LIS + CTA-PIT + LIS-PMO, family of 4 | $6,900 | $8,300 | Planning estimate; exact checkout open |
| Lodging · 12 nights, apartment-first | $2,650 | $3,150 | Planning estimate; exact checkout open |
| Food · groceries, casual lunches, simple dinners | $2,100 | $2,450 | Planning estimate; exact checkout open |
| Sicily rental car · 10 days + insurance | $850 | $1,000 | Planning estimate; exact checkout open |
| Fuel, tolls, parking, Portugal transfers/trains | $550 | $650 | Planning estimate; exact checkout open |
| Activities/tickets · Regaleira, boat, theatre, reserves, optional Etna | $750 | $1,100 | Planning estimate; exact checkout open |
| Travel insurance / passports buffer / misc. | $350 | $500 | Planning estimate; exact checkout open |

Gross $14,150–$17,150; fixed redemption $2,000; net $12,150–$15,150. Cash airfare allocation $6,900–$8,300; remaining airfare after credit $4,900–$6,300. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/portugal-sicily/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key portugal-sicily. No transfer or promotional bonus contributes savings.

### #11 Portugal (Lisbon) + Crete

Window: 2027-06-08 through 2027-06-21. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–LHR–LIS, June 8–21; family base $4,798. Four-passenger British Airways result; the 2h35 LHR option avoids the shorter 1h30 connection at the same price. Not a Crete-return quote. Add the stored $220/person June 14 Lisbon–Athens–Chania component, family bag/seat allowances and an explicit open-jaw uncertainty reserve.

The old $4,800–5,900 all-flight gate is not a current complete quote. Use a $6,600–8,000 planning proxy: $4,798 family Lisbon gateway return plus $880 stored Crete connection, $720 checked-bag proxy, $200–800 seats and up to $800 open-jaw uncertainty. Exact Crete exit can still exceed this estimate.

| Item | Low | High | Basis |
|---|---:|---:|---|
| All flights, seats, bags - PIT/LIS/ATH/Crete/PIT | $6,600 | $8,000 | Planning estimate; exact checkout open |
| Cascais/Estoril lodging · 5 nights | $900 | $1,625 | Planning estimate; exact checkout open |
| Chania lodging · 4 nights | $680 | $1,140 | Planning estimate; exact checkout open |
| Rethymno lodging - 3 nights | $450 | $750 | Planning estimate; exact checkout open |
| Crete rental car, fuel, tolls, parking | $650 | $950 | Planning estimate; exact checkout open |
| Portugal transfers, trains, local taxis | $300 | $500 | Planning estimate; exact checkout open |
| Food, groceries, gelato, casual dinners | $1,650 | $2,250 | Planning estimate; exact checkout open |
| Activities, tickets, Balos boat, beach chairs, Imbros logistics | $800 | $1,250 | Planning estimate; exact checkout open |
| Insurance, fees, misc buffer | $500 | $700 | Planning estimate; exact checkout open |

Gross $12,530–$17,165; fixed redemption $2,000; net $10,530–$15,165. Cash airfare allocation $6,600–$8,000; remaining airfare after credit $4,600–$6,000. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/portugal-crete/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key portugal-crete. No transfer or promotional bonus contributes savings.

### #12 Sicily & Malta

Window: 2027-06-10 through 2027-06-23. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–LHR–PMO, June 10–23; family base $5,667. Four-passenger BA result; does not price Malta exit or CTA–MLA flight.

Use $6,200–7,400 outer airfare as a conservative open-jaw planning proxy above the $5,667 Palermo round-trip result, not an observed Malta-return fare. Retain internal hop and local-cost estimates; add $400–700 insurance/contingency.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Outer airfare: Palermo in / Malta out, bags and seats (proxy) | $6,200 | $7,400 | Planning estimate; exact checkout open |
| Internal flight — Catania → Malta + bags | $250 | $500 | Planning estimate; exact checkout open |
| Ground transport — Sicily car + Malta no-car logistics | $1,050 | $1,850 | Planning estimate; exact checkout open |
| Docs & extras — ETIAS, IDP, eSIM, airport buffers | $250 | $400 | Planning estimate; exact checkout open |
| Lodging — 12 nights, 4 bases | $3,400 | $5,200 | Planning estimate; exact checkout open |
| Food + activities | $1,450 | $2,650 | Planning estimate; exact checkout open |
| Insurance and contingency | $400 | $700 | Planning estimate; exact checkout open |

Gross $13,000–$18,700; fixed redemption $2,000; net $11,000–$16,700. Cash airfare allocation $6,450–$7,900; remaining airfare after credit $4,450–$5,900. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/sicily-malta/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key sicily-malta. No transfer or promotional bonus contributes savings.

### #13 Crete: Chania + Rethymno + Agios Nikolaos

Window: 2027-06-09 through 2027-06-23. Hotel nights: 13; PTO: 9. Route readiness: confirmed.

Cash check: complete open-jaw; PIT–LHR–CHQ / HER–ATH–JFK–PIT; family base $6,733. Selected four-passenger multi-city booking option; one checked bag per person costs $180 for the itinerary. Final airline checkout, individual fare rules and paid seats remain unverified. The 1h30 JFK connection must be protected. Reject the BA return arriving June 24.

Replace the two one-way sum with the $6,733 complete family option; allow $720 bags and $200–800 seats, rounded up to $7,700–8,300. Add a previously missing $500–900 insurance/contingency allowance (estimate).

| Item | Low | High | Basis |
|---|---:|---:|---|
| Flights, seats and bags | $7,700 | $8,300 | Planning estimate; exact checkout open |
| Lodging · 13 nights | $2,300 | $3,700 | Planning estimate; exact checkout open |
| Automatic car, fuel, parking | $1,200 | $1,700 | Planning estimate; exact checkout open |
| Food and groceries | $1,800 | $2,500 | Planning estimate; exact checkout open |
| Activities and boats | $700 | $1,200 | Planning estimate; exact checkout open |
| Insurance and contingency | $500 | $900 | Planning estimate; exact checkout open |

Gross $14,200–$18,300; fixed redemption $2,000; net $12,200–$16,300. Cash airfare allocation $7,700–$8,300; remaining airfare after credit $5,700–$6,300. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/crete/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key crete. No transfer or promotional bonus contributes savings.

### #14 Venice, Dolomites & Sardinia

Window: 2027-06-27 through 2027-07-11. Hotel nights: 13; PTO: 9. Route readiness: exact-2027-schedule-required.

Cash check: gateway round-trip proxy for open-jaw; PIT–LHR–VCE, June 27–July 11; family base $5,183. Four-passenger BA result; does not price the required Olbia return.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Transatlantic airfare (open-jaw) | $5,400 | $7,000 | Planning estimate; exact checkout open |
| Island hop VCE->OLB + bags | $450 | $780 | Planning estimate; exact checkout open |
| Lodging: Venice 2 nights | $500 | $760 | Planning estimate; exact checkout open |
| Lodging: San Vito / Cortina 5 nights | $900 | $1,400 | Planning estimate; exact checkout open |
| Lodging: Cannigione 3 nights | $750 | $1,200 | Planning estimate; exact checkout open |
| Lodging: Cala Gonone 3 nights | $600 | $900 | Planning estimate; exact checkout open |
| Two rental cars + fuel + tolls | $1,200 | $1,850 | Planning estimate; exact checkout open |
| Boats (La Maddalena + Orosei) | $450 | $650 | Planning estimate; exact checkout open |
| Cable cars, tolls, entries | $500 | $750 | Planning estimate; exact checkout open |
| Food & drink (~14 days) | $2,000 | $2,900 | Planning estimate; exact checkout open |
| Docs, transfers, insurance, misc | $450 | $700 | Planning estimate; exact checkout open |

Gross $13,200–$18,890; fixed redemption $2,000; net $11,200–$16,890. Cash airfare allocation $5,850–$7,780; remaining airfare after credit $3,850–$5,780. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/dolomites-sardinia/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key dolomites-sardinia. No transfer or promotional bonus contributes savings.

### #15 Switzerland + Sicily

Window: 2027-06-08 through 2027-06-22. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–JFK–ZRH, June 8–22; family base $4,545. Four-passenger Delta result; does not price Sicily exit or the Zurich–Catania hop.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| PIT -> Zurich / Catania -> PIT open-jaw airfare | $5,200 | $7,200 | Planning estimate; exact checkout open |
| Zurich -> Catania intra-Europe hop | $1,000 | $1,700 | Planning estimate; exact checkout open |
| Lodging: Berner Oberland 5 nights | $1,150 | $1,450 | Planning estimate; exact checkout open |
| Lodging: Sicily 7 nights (Taormina + Siracusa) | $1,080 | $1,400 | Planning estimate; exact checkout open |
| Swiss rail pass + Jungfraujoch/First/Männlichen/boat | $2,150 | $2,650 | Planning estimate; exact checkout open |
| Sicily car, fuel, Etna, Ortigia boat, beach sets | $820 | $1,150 | Planning estimate; exact checkout open |
| Food and groceries, 13 travel days | $2,100 | $2,700 | Planning estimate; exact checkout open |
| Insurance, ETIAS, fees, misc buffer | $500 | $1,100 | Planning estimate; exact checkout open |

Gross $14,000–$19,350; fixed redemption $2,000; net $12,000–$17,350. Cash airfare allocation $5,200–$7,200; remaining airfare after credit $3,200–$5,200. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: 2026 Jungfraujoch seat reservation CHF10 per traveler, including children; family-card validity depends on the pass. Do not call all children free on every pass. [Jungfrau child/pass compatibility and reservations](https://www.jungfrau.ch/en-gb/faq/)
- Current operator check: 2026 six-day second-class Berner Oberland Pass CHF350/adult and CHF30/child 6–15: CHF760 for this party before summit supplements. 2027 quote unavailable. [Berner Oberland Pass 2026 prices](https://www.berneseoberlandpass.ch/prices-tickets/)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/switzerland-sicily/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key switzerland-sicily. No transfer or promotional bonus contributes savings.

### #16 Portugal (Algarve) + Sicily

Window: 2027-06-10 through 2027-06-23. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–LHR–FAO, June 10–23; family base $6,260. Four-passenger BA result; does not price Catania exit or the Faro–Palermo bridge.

Increase outer airfare allowance to $6,600–7,600 above the $6,260 Faro gateway proxy including bags/seats; this is not a Catania-return quote. Increase the former $150–250 insurance/misc line to an explicit $500–900 planning reserve.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Open-jaw outer flights (PIT→FAO / CTA→PIT), bags/seats | $6,600 | $7,600 | Planning estimate; exact checkout open |
| Faro → Lisbon → Rome → Palermo TAP/ITA two-stop hop | $1,300 | $1,700 | Planning estimate; exact checkout open |
| Lodging · 12 nights, apartment/pool-first | $2,900 | $4,200 | Planning estimate; exact checkout open |
| Food · groceries + casual meals | $2,100 | $2,400 | Planning estimate; exact checkout open |
| Portugal + Sicily rentals, fuel/tolls/parking | $1,250 | $1,700 | Planning estimate; exact checkout open |
| Activities · Benagil/Ponta boats, park/pool, La Rocca, theatre, optional Etna | $650 | $900 | Planning estimate; exact checkout open |
| Insurance and contingency | $500 | $900 | Planning estimate; exact checkout open |

Gross $15,300–$19,400; fixed redemption $2,000; net $13,300–$17,400. Cash airfare allocation $6,600–$7,600; remaining airfare after credit $4,600–$5,600. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/portugal-algarve-sicily/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key portugal-algarve-sicily. No transfer or promotional bonus contributes savings.

### #17 Switzerland + Crete

Window: 2027-06-08 through 2027-06-22. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–JFK–ZRH, June 8–22; family base $4,545. Four-passenger Delta result; does not price Sicily exit or the Zurich–Catania hop. Shared gateway evidence from switzerland-sicily; not this complete open jaw.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| PIT -> Zurich / Crete -> PIT open-jaw airfare | $5,200 | $7,200 | Planning estimate; exact checkout open |
| Zurich -> Heraklion intra-Europe hop | $1,100 | $1,800 | Planning estimate; exact checkout open |
| Lodging: Berner Oberland 5 nights | $1,150 | $1,450 | Planning estimate; exact checkout open |
| Lodging: Chania 7 nights | $1,020 | $1,340 | Planning estimate; exact checkout open |
| Swiss rail pass + Jungfraujoch/First/Männlichen/boat | $2,150 | $2,650 | Planning estimate; exact checkout open |
| Crete car, fuel, Balos boat, gorge fees | $850 | $1,150 | Planning estimate; exact checkout open |
| Food and groceries, 13 travel days | $2,150 | $2,750 | Planning estimate; exact checkout open |
| Insurance, ETIAS, fees, misc buffer | $500 | $1,100 | Planning estimate; exact checkout open |

Gross $14,120–$19,440; fixed redemption $2,000; net $12,120–$17,440. Cash airfare allocation $5,200–$7,200; remaining airfare after credit $3,200–$5,200. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: 2026 Jungfraujoch seat reservation CHF10 per traveler, including children; family-card validity depends on the pass. Do not call all children free on every pass. [Jungfrau child/pass compatibility and reservations](https://www.jungfrau.ch/en-gb/faq/)
- Current operator check: 2026 six-day second-class Berner Oberland Pass CHF350/adult and CHF30/child 6–15: CHF760 for this party before summit supplements. 2027 quote unavailable. [Berner Oberland Pass 2026 prices](https://www.berneseoberlandpass.ch/prices-tickets/)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/switzerland-crete/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key switzerland-crete. No transfer or promotional bonus contributes savings.

### #18 Madeira + Kefalonia

Window: 2027-06-08 through 2027-06-22. Hotel nights: 12; PTO: 9. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–BOS–LIS–FNC, June 8–22; family base $6,124. Four-passenger TAP/JetBlue result; does not price Greece exit or internal flights. United EWR–FNC result from $6,882 confirms a current exact-date schedule option, not the whole hybrid. Shared gateway evidence from madeira-crete; not this complete open jaw.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| All air tickets, seats and bags — PIT/FNC/LIS/ATH/EFL/PIT | $8,000 | $9,000 | Planning estimate; exact checkout open |
| Funchal lodging — 6 nights | $1,050 | $1,650 | Planning estimate; exact checkout open |
| Kefalonia lodging — 6 nights | $1,050 | $1,700 | Planning estimate; exact checkout open |
| Two automatic rentals, fuel, parking | $750 | $1,200 | Planning estimate; exact checkout open |
| Food and groceries | $1,550 | $2,050 | Planning estimate; exact checkout open |
| Activities: trails, cable car, caves, boat, beach logistics | $850 | $1,150 | Planning estimate; exact checkout open |
| Insurance, ETIAS, misc contingency | $450 | $550 | Planning estimate; exact checkout open |

Gross $13,700–$17,300; fixed redemption $2,000; net $11,700–$15,300. Cash airfare allocation $8,000–$9,000; remaining airfare after credit $6,000–$7,000. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: 2026 individual trail fee €4.50; full PR1 €10.50. Timed reservations required. These are current published fees, not guaranteed 2027 prices; permit/trail access can remove a headline day. [Madeira 2026 trail fees and reservations](https://visitmadeira.com/en/blog/visit-madeira/everything-you-need-to-know-about-hiking-in-madeira-in-2026/)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/madeira-kefalonia/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key madeira-kefalonia. No transfer or promotional bonus contributes savings.

### #19 Madeira + Crete

Window: 2027-06-08 through 2027-06-22. Hotel nights: 13; PTO: 9. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–BOS–LIS–FNC, June 8–22; family base $6,124. Four-passenger TAP/JetBlue result; does not price Greece exit or internal flights. United EWR–FNC result from $6,882 confirms a current exact-date schedule option, not the whole hybrid.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| All flights, seats, bags - PIT/FNC/LIS/ATH/Crete/PIT (gated) | $7,000 | $8,200 | Planning estimate; exact checkout open |
| Funchal lodging - 4 nights | $650 | $1,050 | Planning estimate; exact checkout open |
| Lisbon buffer hotel - 1 night | $130 | $200 | Planning estimate; exact checkout open |
| Chania lodging - 6 nights | $1,050 | $1,700 | Planning estimate; exact checkout open |
| Rethymno lodging - 2 nights | $300 | $500 | Planning estimate; exact checkout open |
| Madeira rental car (5 days, automatic) + fuel | $280 | $450 | Planning estimate; exact checkout open |
| Crete rental car (9 days), fuel, parking | $800 | $1,150 | Planning estimate; exact checkout open |
| Lisbon transfers, metro, taxis | $100 | $200 | Planning estimate; exact checkout open |
| Food, groceries, gelato, casual dinners - 14 days | $1,750 | $2,350 | Planning estimate; exact checkout open |
| Activities: trail permits, toboggan, cable car, pools, Balos boat, Samaria/Imbros/Omalos logistics | $1,150 | $1,750 | Planning estimate; exact checkout open |
| Insurance, fees, misc buffer | $500 | $700 | Planning estimate; exact checkout open |

Gross $13,710–$18,250; fixed redemption $2,000; net $11,710–$16,250. Cash airfare allocation $7,000–$8,200; remaining airfare after credit $5,000–$6,200. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: 2026 individual trail fee €4.50; full PR1 €10.50. Timed reservations required. These are current published fees, not guaranteed 2027 prices; permit/trail access can remove a headline day. [Madeira 2026 trail fees and reservations](https://visitmadeira.com/en/blog/visit-madeira/everything-you-need-to-know-about-hiking-in-madeira-in-2026/)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/madeira-crete/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key madeira-crete. No transfer or promotional bonus contributes savings.

### #20 Greece via Lisbon

Window: 2027-06-09 through 2027-06-22. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

No new complete four-person cash quote. Stored previous-day component evidence: PIT–LIS is selling June 9–22 from $1,215 round trip, and LIS–CHQ sells June 14 via ATH in 6h05 from $220. The CHQ–PIT return still needs one protected multi-city quote; do not route home through Lisbon on Tuesday. This prior September 10 component evidence was reviewed, not newly reproduced for four passengers; retain the booking gate.

Keep the outer/Lisbon–Athens airfare allowance separate from Athens–Chania, and add a previously missing $400–700 insurance/contingency line. This remains an unquoted planning allocation, not a protected all-family through-fare.

| Item | Low | High | Basis |
|---|---:|---:|---|
| International airfare and Lisbon–Athens allocation; Crete flights separate | $5,200 | $8,200 | Planning estimate; exact checkout open |
| Domestic flight — Athens ↔ Chania | $450 | $800 | Planning estimate; exact checkout open |
| Rental car — Crete, ~10 days | $500 | $850 | Planning estimate; exact checkout open |
| Docs & extras — ETIAS, eSIM, Fast Track, transfers | $250 | $350 | Planning estimate; exact checkout open |
| Lodging — 3 vacation bases + Athens gateway buffer | $1,850 | $3,000 | Planning estimate; exact checkout open |
| Food + activities — sum of daily blocks above | $2,500 | $3,700 | Planning estimate; exact checkout open |
| Insurance and contingency | $400 | $700 | Planning estimate; exact checkout open |

Gross $11,150–$17,600; fixed redemption $2,000; net $9,150–$15,600. Cash airfare allocation $5,650–$9,000; remaining airfare after credit $3,650–$7,000. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.


All axis scores and individual rubric rationales: [canonical evidence](../src/_data/greece-via-lisbon/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key greece-via-lisbon. No transfer or promotional bonus contributes savings.

### #21 Sardinia & Corsica

Window: 2027-06-10 through 2027-06-23. Hotel nights: 12; PTO: 8. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–LHR–OLB, June 10–23; family base $5,316. Four-passenger BA result with a long LHR wait; does not price Cagliari exit. Reject London airport-change alternatives.

Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Flights — PIT ↔ Sardinia open-jaw | $5,400 | $6,400 | Planning estimate; exact checkout open |
| Lodging — 12 nights, apartments/pool-villa mix | $3,200 | $5,500 | Planning estimate; exact checkout open |
| Sardinia rental car — automatic, one-way | $950 | $1,700 | Planning estimate; exact checkout open |
| Corsica ferry — foot-passenger family round trip | $180 | $350 | Planning estimate; exact checkout open |
| Corsica local taxis/boat/local rental | $150 | $350 | Planning estimate; exact checkout open |
| Food — groceries + casual dinners | $1,400 | $2,200 | Planning estimate; exact checkout open |
| Activities — one premium boat day, caves, permits, ruins | $900 | $1,600 | Planning estimate; exact checkout open |
| Docs/extras — ETIAS, IDP, eSIM, parking buffers | $300 | $500 | Planning estimate; exact checkout open |
| Insurance and contingency | $400 | $700 | Planning estimate; exact checkout open |

Gross $12,880–$19,300; fixed redemption $2,000; net $10,880–$17,300. Cash airfare allocation $5,400–$6,400; remaining airfare after credit $3,400–$4,400. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: Current Moby crossing is 50 minutes; summer foot passengers check in one hour ahead. Exact 2027 sailings/family fare unconfirmed; no vehicle ferry without written rental permission. [Moby Santa Teresa–Bonifacio current route](https://www.moby.it/rotte/traghetti-corsica/santa-teresa-bonifacio-santa-teresa/)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/sardinia-corsica/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key sardinia-corsica. No transfer or promotional bonus contributes savings.

### #22 Hawaii: Maui + Kauai

Window: 2027-06-10 through 2027-06-23. Hotel nights: 12; PTO: 9. Route readiness: current-proxy.

Cash check: gateway round-trip proxy for open-jaw; PIT–PHX–OGG, June 10–23; family base $3,904. Four-passenger American result with 1h58 PHX connection; the cheaper $3,032 DFW option has only 53 minutes. This does not price LIH departure June 22, required for PIT arrival June 23.

Use $4,200–5,200 outer airfare as a practical connection/bag/seat planning allowance above the $3,904 Maui round-trip proxy. Lihue June 22 return remains unquoted.

| Item | Low | High | Basis |
|---|---:|---:|---|
| Mainland open-jaw air · PIT→OGG / LIH→PIT | $4,200 | $5,200 | Planning estimate; exact checkout open |
| Inter-island OGG→LIH | $250 | $500 | Planning estimate; exact checkout open |
| Two rentals + fuel, parking, airport fees | $1,200 | $1,700 | Planning estimate; exact checkout open |
| Kīhei lodging · 5 nights | $2,250 | $3,200 | Planning estimate; exact checkout open |
| Poʻipū lodging · 4 nights | $1,800 | $2,800 | Planning estimate; exact checkout open |
| Princeville lodging · 3 nights | $1,300 | $2,200 | Planning estimate; exact checkout open |
| Food + groceries · 13 travel days | $2,400 | $3,200 | Planning estimate; exact checkout open |
| Activities + reservations | $1,500 | $2,500 | Planning estimate; exact checkout open |
| Insurance, fees + contingency | $700 | $1,100 | Planning estimate; exact checkout open |

Gross $15,600–$22,400; fixed redemption $2,000; net $13,600–$20,400. Cash airfare allocation $4,450–$5,700; remaining airfare after credit $2,450–$3,700. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.

- lodging: Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.
- transport: Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.
- food: Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.
- activities: Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.
- fees: Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.
- contingency: Explicit line where present; not insurance coverage or a guarantee against high fares.
- awards: No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.

- Current operator check: Sunrise permits release 60 days and 2 days before, 7am HST. June 2027 permit is not available now; park fee is separate and weather refunds are not promised. [Haleakala sunrise reservation timing](https://www.nps.gov/hale/planyourvisit/sunrise.htm)

All axis scores and individual rubric rationales: [canonical evidence](../src/_data/maui-kauai/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key maui-kauai. No transfer or promotional bonus contributes savings.

## Sources and evidence labels

- [Capital One eligible travel redemption and 90-day rule](https://www.capitalone.com/learn-grow/money-management/ways-to-redeem-venture-miles/) — primary.
- [Capital One transfer ratios and irreversible transfers](https://www.capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships/) — primary.
- [Independent confirmation of 1-cent travel redemption](https://thepointsguy.com/credit-cards/redeem-capital-one-miles-fixed-value/) — independent.
- [Aeroplan August 2026 award chart](https://www.aircanada.com/content/dam/aircanada/loyalty-content/documents/flight-rewards-chart-en.pdf) — primary.
- [Aeroplan partner booking and change/cancel fees](https://www.aircanada.com/ca/en/aco/home/aeroplan/legal/aeroplan-flight-reward-policy.html) — primary.
- [Flying Blue reward booking rules](https://www.flyingblue.com/en/flights) — primary.
- [British Airways reward flights](https://www.britishairways.com/content/the-british-airways-club/avios/spending-avios/reward-flights) — primary.
- [Madeira 2026 trail fees and reservations](https://visitmadeira.com/en/blog/visit-madeira/everything-you-need-to-know-about-hiking-in-madeira-in-2026/) — primary.
- [Jungfrau child/pass compatibility and reservations](https://www.jungfrau.ch/en-gb/faq/) — primary.
- [Berner Oberland Pass 2026 prices](https://www.berneseoberlandpass.ch/prices-tickets/) — primary.
- [Moby Santa Teresa–Bonifacio current route](https://www.moby.it/rotte/traghetti-corsica/santa-teresa-bonifacio-santa-teresa/) — primary.
- [Seajets cancellation terms](https://tickets.seajets.com/TermsEN.pdf) — primary.
- [Haleakala sunrise reservation timing](https://www.nps.gov/hale/planyourvisit/sunrise.htm) — primary.
- [Fair Wind afternoon snorkel starting prices](https://www.fair-wind.com/afternoon-kealakekua-snorkel-tour/) — primary.

Cash schedules/fare observations use [Google Flights](https://www.google.com/travel/flights) with 3 adults and 1 child aged 2–11, because the 13-year-old requires an adult fare. Exact booking-option observations are distinct from final airline checkouts, gateway proxies, published award floors and unsupported planning allowances. The checked route/date/time/party fields are recorded in the machine-readable audit. No login-gated award inventory was captured.

Transfers are irreversible; no transfer-time guarantee or active bonus is assumed. For a mixed award, price one direction for all four plus cash in the other direction and include taxes, carrier surcharges, bags, seats, positioning and the loss of round-trip cash pricing. Remaining Capital One miles can offset eligible charges at 1 cent. A theoretical 25,000-point award is not a $2,000+ saving.

## Validation and publication state

- tests: 57/57 pass
- scorecards: 42: 22 ranked comparison, 9 excluded, 11 short
- fullEvidence: 42/42 evidence records pass
- budgetReconciliation: 42/42 matched; exact zero tolerance for the 22 audited gross totals
- build: npm run build passed, including all evidence freshness gates
- render: 73 pages; source/static order, totals, badges, matrix and TLDR parity passed
- sync: npm run sync and npm run sync:check passed
- diff: git diff --check passed
- performance: hub <=650000 bytes; itinerary <=1100000 bytes; 2120 responsive image sets passed
- scope: 22 full trips reranked; all 11 short scorecards and variants unchanged. User-authorized follow-up corrected expired evidence and flight labels in 10 short escapes. Nine excluded source sets unchanged.
- browser: Fresh local Chromium session; preview CacheStorage and service workers cleared. Homepage, comparison table, Crete points, Slovenia flight audit, Iceland/Ischia/Cilento warning and refreshed short-Iceland route warning inspected.
- commit: See the commit containing this report (git log -1 -- docs/reranking-2026-09-11.md). Push result is reported separately; deployment is not verified.

The former blocker was 16 expired facts across 10 short escapes. Current operator route pages were reviewed; old exact-date confirmation claims were downgraded to current proxies, with the original facts archived. Budget arithmetic remains a planning estimate, not a renewed supplier quote. All short-escape scores and costs remain unchanged. The homepage now derives its lead score and Portugal cost comparison from canonical data instead of stale fixed-price claims.

## Files changed

Canonical changes: main/evidence/variants for the 22 listed trips; capitalOnePoints.json; decisionProfile.json (Crete dated schedule readiness); flightAudits.json; rerankingAudit.json; shared evidence sources; hub data/card summaries; homepage/comparison and points templates. Tools include capped points arithmetic, audit propagation/reporting, gross/net reconciliation and additional parity tests. Summary, sensitivity, image-manifest ordering and root HTML were generated by supported tools. No itinerary-creation generator ran.

The resulting commit is the commit containing this report; its hash and push result are provided in the task handoff. Deployment is not separately verified.
