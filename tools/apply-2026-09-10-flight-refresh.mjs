#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const reviewedAt = '2026-09-10';
const sourceId = 'google-flights-2027-current-audit';
const staged = [];

updateTrip('madeira-crete', {
  budget: [13700, 18100],
  replacements: [
    ['$5,400-$6,900', '$7,000-$8,200'],
    ['$6,580-$8,700', '$8,180-$10,000'],
    ['~$12.1k-$16.8k', '~$13.7k-$18.1k'],
    ['$12.1k-$16.8k', '$13.7k-$18.1k'],
    ['Flights are the driver: the family flight stack signal is $5.4k-$6.9k. Without the flight gate and apartment-first lodging the worst case runs ~$16k, over the $15k preferred maximum.', 'Flights are the driver: exact-date components now support a $7.0k-$8.2k family air band before the final protected checkout. The resulting $13.7k-$18.1k total is a budget stretch, not a preference-fit plan.'],
    ['Go only if the full family flight stack (all legs, seats, bags) prices at <b>$6.9k or less - target $5.4k-$6.5k</b>. Above that, this branch honestly breaks the $15k preferred maximum: fall back to the mainland Portugal + Crete version, or trim (skip the Balos boat, pick CHQ vs HER by fare, apartment-first everywhere).', 'Treat the full family flight stack (all legs, seats, bags, and ticket protection) as the first go/no-go decision. Current components support a $7.0k-$8.2k air band, so choose this branch for the Madeira experience—not because it fits the $15k preference.'],
    ['Current July 2026 proxies, not 2027 guarantees. Flights dominate: the family stack signal is $5.4k-$8.3k, and this plan only ships with the $6.9k walk-away gate enforced.', 'Exact-date flight components reviewed September 10, 2026 support a $7.0k-$8.2k family air band before final seats, bags, and ticket protection. Lodging and activity lines remain planning estimates.'],
    ['<b>Enforce the flight gate.</b> Quote the whole chain (PIT-FNC, FNC-LIS, LIS-ATH-CHQ, return) before booking anything; above $6.9k family, fall back to the mainland version - that alone saves $850-$1,750.', '<b>Quote the whole chain first.</b> Price PIT-FNC, FNC-LIS, LIS-ATH-CHQ, and the return with seats, bags, and protection before booking anything; compare the finished total with the mainland version.'],
    ['Target path is roughly $12.4k-$13.6k with mid-band flights and apartment-first lodging. Unconstrained worst case sums to ~$16.1k - over the preferred maximum - so the two gates are real: flights at $6.9k or less, and apartment-first stays. If the flight quote gate fails, the honest answer is the cheaper mainland Portugal + Crete version, not a bigger budget.', 'The refreshed planning band is $13.7k-$18.1k. Exact-date airfare removed the former preference-fit path, so this is now an experience-first stretch; compare the protected family checkout directly with mainland Portugal + Crete before committing.'],
    ['<b>Quote as one system.</b> Price every leg together before assuming the budget works; above $6.9k family, fall back to the mainland version.', '<b>Quote as one system.</b> Price every leg, seat, bag, and protection together before comparing this stretch plan with the mainland version.'],
    ['<b>Flights over $6.9k kill the branch.</b> That is not a trim trigger - it is the signal to book the mainland Portugal + Crete version instead and bank the difference.', '<b>The current $7.0k-$8.2k air band makes this a stretch.</b> Compare the complete protected quote with mainland Portugal + Crete; do not disguise the difference with optimistic component fares.'],
    ["Re-quote when schedules load (~late summer 2026); family gate is $6.9k walk-away, $5.4k-$6.5k target. UA's EWR-FNC nonstop for 2027 is likely but unconfirmed.", 'Exact-date components are now visible; complete the protected family checkout inside the $7.0k-$8.2k working air band and recheck operating days before purchase.'],
    ['<td>Best preference fit</td><td><b>Chosen</b></td>', '<td>High</td><td><b>Chosen for timing, not price</b></td>'],
    ['One less PTO day, roughly $850-$1,750 cheaper, 6 Chania + 3 Rethymno nights, no FNC wind risk - but Cascais/Sintra instead of the stairway ridge.', 'One less PTO day, a simpler air stack, 6 Chania + 3 Rethymno nights, and no FNC wind risk - but Cascais/Sintra instead of the stairway ridge.'],
  ],
  arithmetic: '8180–10000 + 1955–3150 + 1850–2500 + 1150–1750 + 500–700 = 13635–18100; displayed 13700–18100',
});

updateTrip('madeira-kefalonia', {
  budget: [14000, 18100],
  axes: { budget: 1 },
  replacements: [
    ['$5,950–$7,900', '$9,000–$11,000'],
    ['$10,900–$15,000', '$14,000–$18,100'],
    ['$10.9k–$15.0k', '$14.0k–$18.1k'],
    ['$11.9–15.0k', '$14.0–18.1k'],
    ['$6.7k high case', '$9.0k current air ceiling'],
    ['$5,200–$6,700', '$8,000–$9,000'],
    ['The preferred maximum is not a hard cap, but this version only earns its budget score while the re-quoted high case stays at or below $15,000.', 'The preferred maximum is not a hard cap. Exact-date airfare moves this version above it at the high end, so Budget is 1/5 and the complete protected checkout must drive the decision.'],
    ['Research is a 2026 current proxy for a June 2027 family trip.', 'Exact-date flight components were reviewed September 10, 2026; lodging, activities, and ground costs remain planning proxies for June 2027.'],
    ['Exact 2027 schedules are not ready to book.', 'Exact-date components are visible, but the complete protected chain and family checkout are not ready to book.'],
  ],
  arithmetic: '9000–11000 + 2100–3350 + 1550–2050 + 850–1150 + 450–550 = 13950–18100; displayed 14000–18100',
});

updateTrip('madeira-mallorca', {
  budget: [13100, 15900],
  axes: { budget: 1 },
  replacements: [
    ['$5,400-$6,400', '$6,700-$7,500'],
    ['$6,300-$7,700', '$7,600-$8,800'],
    ['~$11.8k-$14.8k', '~$13.1k-$15.9k'],
    ['$11.8k-$14.8k', '$13.1k-$15.9k'],
    ['$6.4k', '$7.5k'],
    ['Budget score 3/5', 'Budget score 1/5'],
    ['with within-preference budget, 12 nights, novelty 5', 'with a range crossing the preferred maximum, 12 nights, novelty 5'],
    ['It leads the hybrid field because LIS-PMI is simpler than LIS-ATH-CHQ and its planning band stays under $15k. Exact 2027 EWR-FNC operating days and a protected all-leg quote must be proven before calling the flights clean. The budget ceiling stays clean only with the $7.5k family airfare gate and apartment-first Mallorca lodging.', 'It remains the strongest Madeira hybrid because LIS-PMI is simpler than LIS-ATH-CHQ, but the refreshed $13.1k-$15.9k band crosses preference. Exact operating days, ticket protection, seats, bags, and the complete family checkout must be verified before booking.'],
    ['<td>Best preference-fit shot</td><td><b>Use this</b></td>', '<td>Crosses preference at the high end</td><td><b>Use for the experience</b></td>'],
    ['Preference-fit plan using July 2026 route/activity/lodging signals. These are gates, not blank-check ranges: airfare must stay under $7.5k family, and Mallorca lodging must stay apartment-first.', 'Exact-date airfare reviewed September 10, 2026 moves this to a $13.1k-$15.9k stretch band. Keep the $7.5k family airfare ceiling and apartment-first Mallorca lodging as decision gates.'],
    ['<b>Enforce the $7.5k airfare gate.</b> If the multi-city quote is higher, Madeira + Mallorca stops being a preference-fit contender.', '<b>Enforce the $7.5k airfare gate.</b> A higher complete quote makes an already preference-crossing route materially worse.'],
  ],
  arithmetic: '7600–8800 + 2300–3150 + 1850–2250 + 800–1100 + 550–600 = 13100–15900',
});

updateTrip('madeira-sicily', {
  budget: [12600, 15900],
  axes: { ease: 3, risk: 3 },
  replacements: [
    ['$5,600-$6,400', '$5,900-$6,800'],
    ['$6,900-$8,200', '$7,200-$8,600'],
    ['~$12.3k-$15.5k', '~$12.6k-$15.9k'],
    ['$5.6k-$6.4k', '$5.9k-$6.8k'],
    ['$6.2k', '$6.8k'],
    ['it is selling on Tuesdays in the current pattern (verified Google Flights 2026-07-19), and if the 2027 schedule kills it', 'the exact June 15, 2027 nonstop is selling (verified Google Flights 2026-09-10), and if it changes'],
    ['Current June proxy data puts the family total around', 'Current exact-date component pricing puts the family total around'],
    ["Confirm the Tuesday nonstop when easyJet's summer 2027 loads; Rome one-stop is the fallback", 'The exact Tuesday nonstop is selling; retain a same-day one-stop fallback'],
    ['twice-weekly Palermo flight', 'exact Tuesday Palermo flight'],
    ['The hinge is a Tuesday Lisbon-Palermo nonstop, but the current official timetable proxy does not show June service. Keep this route conditional until exact 2027 service appears or price a protected one-stop.', 'The exact Tuesday Lisbon-Palermo nonstop is selling for June 15, 2027. Keep the Lisbon wind buffer and verify the complete family checkout, seats, bags, and fallback before making Sicily lodging nonrefundable.'],
    ['The high case exceeds $15k and the June air hinge is unproven. A priced route plus apartment-first lodging must reconcile below the preferred maximum.', 'The high case exceeds $15k even with the now-live June nonstop. The final protected family checkout and apartment-first lodging remain the go/no-go gates.'],
    ['The score falls to 38/55 because Budget 1, Ease 1, and Risk 2 are severe; the $12.3k-$15.5k range can exceed the preferred maximum.', 'The plan scores 38/55: the sold nonstop improves Ease and Risk to 3/5, while Budget 1 and the $12.6k-$15.9k band remain the major constraint.'],
    ['The unprotected Lisbon to Palermo hinge and four flight legs make this the board&rsquo;s most fragile logistics plan.', 'The Lisbon buffer and sold nonstop reduce the former hinge risk, but separate tickets, Madeira wind, and four flight legs still require deliberate protection.'],
    ['Preference-fit budget using current July 2026 fare/hotel signals and official 2026 Madeira fees where 2027 is not loaded', 'Flight-refreshed budget using exact-date airfare plus current lodging signals and official 2026 Madeira fees where 2027 pricing is not loaded'],
  ],
  arithmetic: '7200–8600 + 2350–3300 + 2100–2450 + 600–1100 + 350–500 = 12600–15950; displayed 12600–15900',
  after({ evidence }) {
    evidence.axes.ease.rationale = 'Four lodging sleeps, three base moves and two cars remain a meaningful load, but the sold three-hour Lisbon–Palermo nonstop removes the former all-day connecting transfer; Ease is now 3/5.';
    evidence.axes.risk.rationale = 'The exact June 15 easyJet Lisbon–Palermo nonstop is selling and same-day one-stop backups remain available. Madeira wind and separate tickets still require the Lisbon buffer, so Risk improves to 3/5 rather than higher.';
    const load = fact(evidence, 'operational-load');
    Object.assign(load.value, { easeScore: 3, airHoursPlanningEstimate: 18.7 });
    Object.assign(evidence.metrics, { airHours: 18.7, longestTransferHours: 5.5 });
    const route = fact(evidence, 'route-readiness');
    route.value.criticalLeg = 'exact June 15 easyJet LIS–PMO nonstop';
  },
});

updateTrip('portugal-algarve-sicily', {
  budget: [13550, 17350],
  axes: { ease: 2 },
  replacements: [
    ['FAO → BCN → PMO via Vueling (Barcelona): ~7h total, 1 stop', 'FAO → LIS → FCO → PMO on TAP + ITA: ~8h20 total, 2 stops'],
    ['Vueling FAO–BCN–PMO', 'TAP/ITA FAO–LIS–FCO–PMO'],
    ['FAO–BCN–PMO', 'FAO–LIS–FCO–PMO'],
    ['Faro → Barcelona → Palermo', 'Faro → Lisbon → Rome → Palermo'],
    ['Faro–Barcelona–Palermo', 'Faro–Lisbon–Rome–Palermo'],
    ['Vueling via Barcelona', 'TAP/ITA via Lisbon and Rome'],
    ['single Vueling connection', 'protected TAP/ITA two-stop connection'],
    ['Vueling hop', 'TAP/ITA two-stop hop'],
    ['$600–$1,100', '$1,300–$1,700'],
    ['$7,050–$9,000', '$7,750–$9,600'],
    ['$12,850–$16,750', '$13,550–$17,350'],
    ['$12.85k–16.75k', '$13.55k–17.35k'],
    ['$16.75k', '$17.35k'],
    ['Prefer one Vueling through-ticket; verify single-ticket at booking', 'Use the live TAP/ITA two-stop routing; verify protection across the entire itinerary'],
    ['TAP/ITA’s Lisbon and Rome connection is the fastest single-ticket FAO→PMO routing. Book it as one protected itinerary; if only separate self-transfer fares exist, allow a generous Barcelona connection and keep passports plus one change of clothes in carry-on.', 'TAP/ITA via Lisbon and Rome is the best same-day FAO→PMO routing observed for June 17. Confirm that the whole itinerary is protected; reject a tight self-transfer and keep passports plus one change of clothes in carry-on.'],
    ['Food, Nights and Novelty all 5/5, and cutting the old Lisbon leg lifts Ease to 3 and Risk to 3 — three bases, no Carvoeiro-to-Lisbon backtrack, and one protected Vueling connection instead of a twice-weekly self-transfer. Budget still holds it back: the $12.85k&ndash;16.75k band crosses the $15k preference at the high end, and the Atlantic keeps Swim at 3.', 'Food, Nights and Novelty all score 5/5, but the live internal routing now takes 8h20 with two stops; Ease falls to 2 while Risk remains 3. The refreshed $13.55k&ndash;17.35k band crosses the $15k preference, and the Atlantic keeps Swim at 3.'],
    ['<b>Protected hinge:</b> one Vueling connection through Barcelona replaces the twice-weekly easyJet self-transfer.', '<b>Live hinge:</b> TAP/ITA via Lisbon and Rome replaces the unsold Vueling/Barcelona sketch, but adds a second connection.'],
    ['2026 schedules and prices are planning proxies only. No 2027 flight is presented as confirmed.', 'Exact June 2027 inventory was observed September 10, 2026. Prices remain volatile and no ticket is held.'],
    ['Vueling FAO → BCN → PMO, ~7h total via Barcelona (1 stop)', 'TAP/ITA FAO → LIS → FCO → PMO, 8h20 total (2 stops)'],
    ['Single Vueling through-ticket + exact 2027 day', 'Protection across the complete TAP/ITA itinerary'],
    ['Barcelona is the fastest one-stop. Book one Vueling itinerary so the connection is protected; if only self-transfer fares exist, allow a generous Barcelona layover and carry-on essentials.', 'The prior Barcelona option is not sold on the exact date. Use the live Lisbon/Rome route only if the full itinerary is protected; reject tight self-transfers and keep carry-on essentials accessible.'],
    ['If the 2027 Vueling connection forces an odd day, move one Algarve night rather than shortening Sicily below three nights per base.', 'If a protected version of the live two-stop route does not price cleanly, move one Algarve night to test adjacent dates rather than shortening Sicily below three nights per base.'],
    ['If only self-transfer fares exist, allow a generous Barcelona connection — never a tight same-terminal gamble with checked bags.', 'If only self-transfer fares exist, reject the itinerary — Lisbon and Rome leave no room for an unprotected checked-bag gamble.'],
    ['Current route information is a 2026 proxy. The exact 2027 Vueling connection must be solved before nonrefundable lodging is allowed to drive the plan.', 'Exact June 2027 inventory is visible, but the complete TAP/ITA protection and family checkout must be solved before nonrefundable lodging drives the plan.'],
    ['<b>Confirm a single protected TAP/ITA itinerary</b> for the exact June-2027 day, with a protected Barcelona connection.', '<b>Confirm protection across the complete TAP/ITA itinerary</b> for the exact June 17 day through Lisbon and Rome.'],
    ['<b>If only self-transfer fares exist</b>, allow a generous Barcelona layover and keep passports plus a change of clothes in carry-on.', '<b>If only self-transfer fares exist</b>, reject the chain and test an adjacent date; keep passports plus a change of clothes in carry-on regardless.'],
    ['<b>Route status:</b> Not ready to book. The current Vueling Barcelona routing is evidence of a possible pattern, not confirmation — and the single-through-ticket is unverified — for June 2027.', '<b>Route status:</b> Exact-date inventory exists via Lisbon and Rome, but it is not ready to book until protection across the whole itinerary and the complete family price are verified.'],
    ['The Faro–Lisbon–Rome–Palermo connection must be proven — and its single-ticket status verified — on actual 2027 schedules.', 'The Faro–Lisbon–Rome–Palermo connection is selling on the exact date; protection across the whole itinerary and the complete family price still must be verified.'],
  ],
  arithmetic: '5200–6200 outer air + 1300–1700 TAP/ITA hop + 2900–4200 lodging + 2100–2400 food + 1250–1800 cars + 300–500 activities + 500–550 contingency = 13550–17350',
  after({ evidence }) {
    evidence.axes.ease.rationale = 'Three bases and two base moves remain manageable, but the exact internal flight now requires two protected connections through Lisbon and Rome and about 8h20 in transit; Ease falls to 2/5.';
    evidence.axes.risk.rationale = 'The planned Vueling/Barcelona chain is not sold, but a same-day TAP/ITA itinerary via Lisbon and Rome is. The exact route exists, while two connections and the outer open-jaw keep Risk at 3/5.';
    const load = fact(evidence, 'operational-load');
    Object.assign(load.value, {
      easeScore: 2,
      airHours: 28.3,
      longestTransferHours: 11,
      criticalTransfer: 'Faro → Lisbon → Rome → Palermo',
    });
    Object.assign(evidence.metrics, { airHours: 28.3, longestTransferHours: 11 });
  },
});

for (const item of staged) {
  writeJson(item.mainPath, item.main);
  writeJson(item.evidencePath, item.evidence);
  writeJson(item.variantsPath, item.variants);
}

console.log(`applied material flight changes to ${staged.length} itineraries`);

function updateTrip(slug, options) {
  const mainPath = path.join(dataDir, slug, 'main.json');
  const evidencePath = path.join(dataDir, slug, 'evidence.json');
  const variantsPath = path.join(dataDir, slug, 'variants.json');
  const main = readJson(mainPath);
  const evidence = readJson(evidencePath);
  const variants = readJson(variantsPath);

  for (const [from, to] of options.replacements || []) {
    const result = replaceRecursive(main, from, to);
    if (result.count === 0 && !JSON.stringify(main).includes(to)) {
      console.warn(`${slug}: replacement source already absent: ${from}`);
    }
    Object.assign(main, result.value);
  }

  const [low, high] = options.budget;
  main.scorecard.budget.floorUsd = low;
  main.scorecard.budget.ceilUsd = high;
  Object.assign(main.scorecard.axes, options.axes || {});
  main.scorecard.totalBaked = weightedTotal(main.scorecard.axes);

  const budget = fact(evidence, 'budget-band');
  Object.assign(budget.value, { lowUsd: low, highUsd: high, arithmetic: options.arithmetic });
  budget.verifiedAt = reviewedAt;
  budget.sourceRefs = unique([...(budget.sourceRefs || []), sourceId]);
  budget.sourceLocators = { ...(budget.sourceLocators || {}), [sourceId]: 'Exact-date Google Flights component fares reviewed 2026-09-10; see the current flight audit card.' };
  evidence.axes.budget.score = main.scorecard.axes.budget;
  evidence.axes.budget.rationale = `The exact-date flight refresh moves the reconciled family band to $${low.toLocaleString()}–$${high.toLocaleString()}. Budget ${main.scorecard.axes.budget}/5 follows the shared rubric; component fares remain snapshots and require a final protected checkout.`;
  for (const [axis, score] of Object.entries(options.axes || {})) evidence.axes[axis].score = score;

  const canonical = variants.variants.find((variant) => variant.id === variants.canonicalId);
  if (!canonical) throw new Error(`${slug}: canonical variant not found`);
  canonical.budget.lowUsd = low;
  canonical.budget.highUsd = high;

  options.after?.({ main, evidence, variants });
  staged.push({ mainPath, main, evidencePath, evidence, variantsPath, variants });
}

function replaceRecursive(value, from, to) {
  let count = 0;
  const visit = (item) => {
    if (typeof item === 'string') {
      const hits = item.split(from).length - 1;
      count += hits;
      return hits ? item.split(from).join(to) : item;
    }
    if (Array.isArray(item)) return item.map(visit);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, visit(child)]));
    return item;
  };
  return { value: visit(value), count };
}

function weightedTotal(axes) {
  return axes.budget * 2 + axes.weather + axes.fireRisk + axes.swim + axes.variety + axes.ease + axes.food + axes.risk + axes.nights + axes.novelty;
}
function fact(evidence, id) {
  const match = evidence.facts.find((item) => item.id === id);
  if (!match) throw new Error(`missing evidence fact: ${id}`);
  return match;
}
function unique(values) { return [...new Set(values)]; }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
