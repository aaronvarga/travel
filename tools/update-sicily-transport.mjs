#!/usr/bin/env node
// Refresh only Sicily's transport sections from its retained, dated flight audit.
// Never rerun the original trip generator: the reviewed photos and itinerary stay intact.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import * as H from '../.agents/skills/travel-itinerary/scripts/itinerary-helpers.mjs';
import { deriveEvidenceConfidence } from './lib/evidence-confidence.mjs';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const mainPath = 'src/_data/sicily/main.json';
const main = read(mainPath);
const audit = read('src/_data/sicily/flightAudit.json');
const evidence = read('src/_data/sicily/evidence.json');
const profile = read('src/_data/decisionProfile.json');
const sources = read('src/_data/shared/evidenceSources.json');
const beforeImages = JSON.stringify(main.itinerary.days.flatMap(day => day.spots).map(spot => spot.images));
const beforeScorecard = JSON.stringify(main.scorecard);
const money = value => '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const link = (url, text) => `<a href="${escape(url)}" target="_blank" rel="noreferrer">${text}</a>`;
const card = (title, rows, note = '') => H.card(title, rows.map(([label, value]) => H.prow(label, value)).join('') + (note ? `<p class="tip">${note}</p>` : ''));
const verifyDate = '11/8/2026';
const quote = money(audit.fare.totalUsd);

assert.equal(audit.fare.verifiedAtAirlineCheckout, true);
assert.equal(audit.passengers.total, 4);
assert.equal(audit.inbound.arrivalDate, '2027-06-23');
assert.equal(audit.ticketed, false);

function replaceSection(id, replacement) {
  const regex = new RegExp(`<section id="${id}"[^>]*>[\\s\\S]*?<\\/section>`);
  const parts = main.parts.filter(part => regex.test(part.html || ''));
  assert.equal(parts.length, 1, `Expected one #${id}`);
  parts[0].html = parts[0].html.replace(regex, () => replacement);
}

const air = `<section id="air-travel" class="divider">
<article class="current-flight-callout" data-flight-audit="${audit.verifiedAt}" data-flight-expires="${audit.expiresAt}"><span>Airline checkout verified · ${verifyDate}</span><strong>June flights are on sale: ${quote} total for four in Economy</strong><p>The exact PIT–CTA June 10 / PMO–PIT June 23 itinerary reached United’s own checkout. All four flight segments were offered together, with first checked bags included. Nothing was bought or held; reprice before paying.</p></article>
${H.sectionLabel('Air Travel', 'Real flights, exact dates', 'One connection each way. All clocks below are local to the named airport. Prices and schedules need a fresh check before payment.')}
<div class="plan-grid">
${card('Outbound · June 10–11', [
  ['Route', 'PIT → Montréal (YUL) → Catania (CTA)'],
  ['June 10 · AC 8586', 'PIT 3:25 PM → YUL 5:11 PM · Air Canada Express / Jazz'],
  ['Montréal connection', '<b>1h04 · tight</b> · same airport; compare a longer protected connection'],
  ['AC 932 · overnight', 'YUL 6:15 PM June 10 → CTA 8:55 AM June 11 · Air Canada'],
  ['Total elapsed', '11h30 · arrive Friday morning; no mainland overnight']
], 'The airline sells this connection, but 64 minutes is not a generous family buffer. Do not treat “saleable” as a guarantee against a missed flight.')}
${card('Home · Wednesday, June 23', [
  ['Route', 'Palermo (PMO) → Newark (EWR) → PIT'],
  ['UA 736', 'PMO 9:45 AM → EWR 2:05 PM · United'],
  ['Newark connection', '2h05 · US entry formalities and bag reclaim/recheck'],
  ['UA 3591', 'EWR 4:10 PM → PIT 5:44 PM · United Express / Republic'],
  ['Total elapsed', '13h59 · Pittsburgh arrival June 23, not June 24']
], 'This protects the full June 24–26 Pittsburgh commitment. The 9:45 AM departure requires an early drive from Cefalù; see Getting Around.')}
${card('Compare complete fares for four', [
  ['Economy · airline checkout', `${quote} including $437.66 taxes/fees · not a per-person price`],
  ['Included at this fare', 'One carry-on and first checked bag per person; standard seat selection shown as included'],
  ['Basic Economy · Google display', '$5,138 total; seat fees and a displayed $180 checked-bag charge per person for the trip'],
  ['Fully refundable · Google display', '$6,898 total; not separately verified at airline checkout'],
  ['Planning allowance retained', '$6,200–$8,200 family cash allowance; full trip remains $12,260–$16,770']
], 'Economy is the useful comparison, not the bare Basic headline. Standard seats being included does not guarantee four seats together. No conditional $500 credit-card promotion, miles or status benefits are subtracted.')}
${card('Why not the British Airways headline?', [
  ['Displayed from', '$5,783 for the entire multi-city trip before completing both flight selections'],
  ['June 10 · BA 170', 'PIT 9:10 PM → Heathrow 9:35 AM June 11'],
  ['Hidden inconvenience', '<b>Change airports: LHR → LGW</b> within a 4h10 connection'],
  ['June 11 · BA 2612', 'Gatwick 1:45 PM → Catania 5:55 PM · 14h45 total outbound']
], 'Not the convenient one-stop alternative: it adds a cross-London transfer and sacrifices most of the arrival day. Transfer cost, baggage handling and final fare need their own verification.')}
</div><p>${link(audit.selectedUrl, 'Reopen the selected flights and fare options')} · ${link(audit.searchUrl, 'Compare the exact four-passenger search')} · ${link('../../docs/research/sicily-united-economy-2026-11-08.jpg', 'Retained United price evidence')}. Quote observed ${verifyDate}; recheck within 24 hours and again before paying. Birth dates, seats together, fare rules and passenger documents remain booking checks.</p></section>`;

// Copy the established layout verbatim, rather than introducing another transport design.
const template = read('src/_data/madeira-mallorca/main.json');
const templateDoc = load(template.parts.map(part => part.html || '').join(''));
const transportStyle = templateDoc('#getting-around style').first().toString();
assert.ok(transportStyle.includes('.tt-panel') && transportStyle.includes('.tt-bar'));
const groundLegs = [
  ['CTA → Ortigia', 60, 'June 11 airport-to-base drive; allow additional immigration, bags and rental pickup time.'],
  ['Southeast outings', 225, 'Approximate combined driving for the Greek Theatre / Noto and Marzamemi days from the Ortigia area.'],
  ['Ortigia → Giardini Naxos', 105, 'June 15 base move; do not detour through Taormina’s restricted center.'],
  ['Naxos-area outings', 225, 'Approximate combined Etna south-slope, Taormina and Isola Bella driving; Etna alone is about 75–90 minutes each way.'],
  ['Giardini Naxos → Cefalù', 210, 'June 19 north-coast move via Messina / A20; plan 3–3½ hours plus breaks.'],
  ['Cefalù → Palermo Airport', 105, 'June 23 early-morning return; allow 1½–2 hours driving plus fuel, rental return and airline check-in.']
];
const groundMinutes = groundLegs.reduce((sum, [, minutes]) => sum + minutes, 0);
const legs = [
  ['air', 106, 'AC 8586 · PIT → YUL', 'June 10, 3:25–5:11 PM local; Air Canada Express / Jazz.', false],
  ['wait', 64, 'Connection · Montréal', 'Same airport, only 1h04. Tight for a family; compare a longer protected option.', false],
  ['air', 520, 'AC 932 · YUL → CTA', 'June 10, 6:15 PM → June 11, 8:55 AM local; Air Canada.', false],
  ['road', groundMinutes, 'Sicily rental car · whole trip', 'Combined airport runs, two base moves and day outings: CTA–Ortigia ~1h; southeast outings ~3h45; Ortigia–Naxos ~1h45; Etna/Taormina outings ~3h45; Naxos–Cefalù ~3h30; Cefalù–PMO ~1h45. These are planning allowances, not measured journeys.', true],
  ['air', 620, 'UA 736 · PMO → EWR', 'June 23, 9:45 AM–2:05 PM local; United.', false],
  ['wait', 125, 'Connection · Newark', 'US entry formalities and checked-bag reclaim/recheck; 2h05.', false],
  ['air', 94, 'UA 3591 · EWR → PIT', 'June 23, 4:10–5:44 PM local; United Express / Republic.', false]
];
const duration = minutes => `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`;
const totalMinutes = legs.reduce((sum, [, minutes]) => sum + minutes, 0);
const icons = { air: '✈️', road: '🚗', wait: '⏱️' };
const segments = legs.map(([mode, minutes, label, detail, estimated]) => `<div class="seg ${mode}" data-mode="${mode}" data-minutes="${minutes}" style="flex:${minutes}" title="${escape(`${label} · ${estimated ? '~' : ''}${duration(minutes)} — ${detail}`)}" tabindex="0"><span class="ic">${icons[mode]}</span><b>${estimated ? '~' : ''}${duration(minutes)}</b></div>`).join('\n');
const ground = `<section id="getting-around" class="divider">
${H.sectionLabel('Getting Around', 'One car, two base moves', 'Fly into Catania, keep one automatic car for the island, and return it at Palermo. Four nights each in Ortigia, Giardini Naxos and Cefalù; no ferry or internal flight.')}
${transportStyle}<style>#getting-around .tt-bar{overflow-x:auto}#getting-around .tt-bar .seg{min-width:52px}#getting-around .tt-bar .wait{background:#6b7280}</style>
<div class="tt-panel"><div class="tt-meter"><div class="tt-h"><p>Every travel leg, in order</p><span class="tt-tot">${legs.length} legs · ~41 hrs flights, layovers + drives</span></div>
<div class="tt-bar" role="img" aria-label="${escape(legs.map(([, minutes, label,, estimated]) => `${label}: ${estimated ? 'approximately ' : ''}${duration(minutes)}`).join('; '))}">${segments}</div>
<p class="tt-note">Hover or focus a leg for route details. Width ≈ time. Blue = observed flights; gray = connections; orange = combined estimated island driving, including both base moves and day outings. Exact combined flight/connection time: 25h29; driving allowance: 15h30. This is not a door-to-door total: home–PIT travel, check-in, immigration, rental queues and meal breaks are extra. Drives start from base areas, not an unbooked lodging address.</p></div>
<div class="plan-grid">
${card('One automatic rental · CTA in, PMO out', [
  ['Pickup / return', 'CTA June 11 after the 8:55 AM arrival → PMO early June 23 · about 12 rental days'],
  ['Car planning band', '$800–$1,150 for automatic, insurance and one-way drop · not a supplier quote'],
  ['Fuel, tolls and parking', '$200–$320 separately budgeted; combined ground allowance $1,000–$1,470'],
  ['Before reserving', 'Four people plus luggage; driver documents/IDP, deposit card, excess, one-way fee and return opening hours']
])}
${card('The four essential drives', [
  ['CTA → Ortigia · June 11', '~45–60 min driving after bags, immigration and rental pickup'],
  ['Ortigia → Giardini Naxos · June 15', '~1h45; park at the new base before a swim'],
  ['Naxos → Cefalù · June 19', '~3–3½h via Messina / A20, plus a lunch break and traffic margin'],
  ['Cefalù → PMO · June 23', '~1½–2h, then fuel, rental return and terminal transfer']
])}
${card('Daily movement and parking', [
  ['Ortigia', 'Leave the car outside the historic-center ZTL and walk; use it for Noto and Marzamemi'],
  ['Taormina / Isola Bella', 'Use permitted parking, then walk or use the local cable car as operating; do not drive into the old town'],
  ['Etna south slope', '~75–90 min each way from Naxos; road access, wind and volcanic restrictions override the plan'],
  ['Cefalù', 'Choose legal parking with the stay; walk to the old town and beach, with pool/rest fallbacks']
])}
${card('Airport-day buffers', [
  ['June 11 arrival', 'CTA 8:55 AM; allow 1½–2h for arrival formalities and rental collection before the roughly one-hour drive'],
  ['June 23 departure', '<b>Leave Cefalù around 4:15–4:30 AM</b>; target the PMO terminal around 6:45–7:00 AM for the 9:45 AM flight'],
  ['Rental return', 'Verify early-hours drop, shuttle timing, fuel policy and receipt procedure with the chosen operator'],
  ['If that morning is too early', 'Compare a later protected flight before buying. A PMO hotel night would change the four-night Cefalù plan; it is not silently included']
])}
</div></div></section>`;
replaceSection('air-travel', air);
replaceSection('getting-around', ground);

// Synchronize the prose that otherwise still says no exact flights were found.
const swaps = [
  ['Exact flights, rooms and rental unquoted; not ready to book.', 'Exact June flights verified at United checkout; rooms and rental still unquoted.'],
  ['These are allocations, not a bundle of supplier quotes; exact airfare, family stays and one-way rental remain unknown.', `These remain planning allocations: United Economy was quoted at ${quote} for four on ${verifyDate}; family stays and one-way rental are still unquoted.`],
  ['Flights, rooms and rental remain unquoted;', `The current ${quote} United Economy quote fits inside the retained flight allowance; rooms and rental remain unquoted;`],
  ['International multi-city flights · unquoted family allowance', 'International multi-city flights · allowance; current Economy quote $6,097.66'],
  ['Complete plan · not ready to book', 'Flight route verified · rooms and car still open'],
  ['Exact protected international fare and times; four-person beds and AC; automatic one-way rental; current 2027 attraction prices, event calendars, access rules and daily warnings. Readiness remains current-proxy.', 'Current exact-date flights and the four-person United checkout are verified, not held. Before paying: reassess the 64-minute Montréal connection, reprice the fare, verify seats together and passenger details, select four-person beds/AC and an automatic one-way rental, and recheck 2027 access rules, tariffs and warnings.'],
  ['A verified evening flight could reduce nine to eight.', 'The verified 3:25 PM Pittsburgh departure still uses the departure weekday, so retain nine PTO days.']
];
for (const [old, replacement] of swaps) {
  const text = main.parts.filter(part => (part.html || '').includes(old));
  // Idempotent reruns must see either the old phrase once or its replacement once.
  if (text.length) { assert.equal(text.length, 1, old); text[0].html = text[0].html.replace(old, () => replacement); }
  else assert.ok(main.parts.some(part => (part.html || '').includes(replacement)), `Missing source phrase: ${old}`);
}
main.itinerary.days[0].facts = [H.fact('Flight', 'AC 8586 · PIT 3:25 PM → YUL 5:11 PM'), H.fact('Connection', 'Montréal 1h04; AC 932 leaves 6:15 PM'), H.fact('PTO', 'Departure weekday included · nine total')];
main.itinerary.days[0].note = `Exact-date option verified ${verifyDate}: Air Canada Express AC 8586 to Montréal, then AC 932 to Catania, landing June 11 at 8:55 AM. United offers this outbound and the Palermo return together for four in Economy at ${quote}, including first checked bags. The 64-minute connection is tight: compare a longer protected connection before paying. No tickets were bought or held.`;
main.itinerary.days[1].facts = [H.fact('Sleep', 'Ortigia · night 1 of 4'), H.fact('Land', 'CTA 8:55 AM · AC 932'), H.fact('Drive', 'CTA → Ortigia · about 45–60 min after arrival formalities and car pickup')];
main.itinerary.days[1].note = 'Arrive Catania at 8:55 AM on the currently observed AC 932. Allow 1½–2 hours for bags, arrival formalities and automatic-car collection, then roughly an hour to Ortigia. Expect a late-morning/noon arrival rather than a reserved sightseeing morning; arrange luggage storage if the room is not ready. Park outside the ZTL, unpack when permitted, shop and walk the waterfront.';
main.itinerary.days[13].facts = [H.fact('Leave base', 'Cefalù around 4:15–4:30 AM; confirm route and early rental return'), H.fact('Flight', 'UA 736 · PMO 9:45 AM → EWR 2:05 PM'), H.fact('Connection', 'Newark 2h05 · immigration and bag recheck'), H.fact('Home', 'UA 3591 · EWR 4:10 PM → PIT 5:44 PM June 23')];
main.itinerary.days[13].note = 'The observed return reaches Pittsburgh at 5:44 PM on June 23, preserving the full June 24–26 commitment. Target the PMO terminal around 6:45–7:00 AM after driving 1½–2 hours, refueling and returning the car. Verify early-hours drop and any shuttle with the operator. If the predawn start is unacceptable, compare later protected flights before buying; an airport hotel would alter the final Cefalù night and is not included.';
main.preDepartureTodos.blocks[0].title = 'Reprice the verified flight; close the ground gaps';
main.preDepartureTodos.blocks[0].items = [
  `Reprice the exact four-person United itinerary: ${quote} Economy observed ${verifyDate}; bags and standard seats included, no card credit assumed.`,
  'Decide whether the 64-minute Montréal connection is acceptable; compare a longer protected connection and verify final ticket rules, passenger ages and seats together.',
  'Confirm the June 23 5:44 PM Pittsburgh arrival, family-room occupancy, AC and four real beds.',
  'Quote CTA pickup / PMO early-hours return, automatic car, insurance, deposit and one-way fee.'
];
main.preDepartureTodos.callout = `Exact June flights are available now: ${quote} Economy for four reached United checkout on ${verifyDate}. Nothing is booked or held. Reprice and reassess the Montréal connection before committing; rooms and rental remain unquoted.`;

// The schematic calendar must not imply sightseeing before the new 8:55 AM arrival.
const html = main.parts[0].html;
const originalArrival = /<div class="ev town" style="grid-column:7;grid-row:2\/5">Arrive, drive to Ortigia \+ unpack<\/div>/;
if (originalArrival.test(html)) main.parts[0].html = html.replace(originalArrival, '<div class="ev air" style="grid-column:7;grid-row:2/4">CTA 8:55 AM · bags + rental</div><div class="ev car" style="grid-column:7;grid-row:4/5">Drive to Ortigia + unpack</div>');
assert.ok(main.parts[0].html.includes('CTA 8:55 AM · bags + rental'));
const calendarSwaps = [
  ['<div class="ev air" style="grid-column:6;grid-row:3/8">Pittsburgh → Catania</div>', '<div class="ev air" style="grid-column:6;grid-row:5/10">PIT 3:25 PM → YUL → CTA · overnight</div>'],
  ['<div class="ev air" style="grid-column:5;grid-row:3/8">Palermo → Pittsburgh</div>', '<div class="ev air" style="grid-column:5;grid-row:2/7">PMO 9:45 AM → EWR → PIT 5:44 PM</div>'],
  ['Planning times only; midday shade stays protected. Jun 24–26 are full days at home.', 'Flight labels use local airport clocks; bands are schematic. Jun 23 starts with a 4:15–4:30 AM Cefalù departure, before this grid. Midday shade stays protected; Jun 24–26 are full days at home.']
];
for (const [old, replacement] of calendarSwaps) {
  if (main.parts[0].html.includes(old)) main.parts[0].html = main.parts[0].html.replace(old, () => replacement);
  else assert.ok(main.parts[0].html.includes(replacement), 'Missing calendar flight label');
}

const route = evidence.facts.find(fact => fact.id === 'route-readiness');
Object.assign(route, {
  proxyStatus: 'confirmed', confidence: 'high', claimType: 'observed', verifiedAt: audit.verifiedAt, expiresAt: audit.expiresAt,
  value: {
    status: 'confirmed', singleTicket: true, singleTicketIsBookingRequirement: true, maxConnections: 1,
    exact2027FlightsVerified: true, fourSeatsVerified: true, singleAirlineCheckoutVerified: true,
    protectionVerified: false, protectionNote: 'Both directions and all four segments are offered together by United. Final fare rules and ticket conditions must still be checked; no ticket has been issued.',
    outbound: 'AC 8586 PIT–YUL June 10 3:25–5:11 PM; AC 932 YUL 6:15 PM–CTA June 11 8:55 AM; 1h04 connection',
    return: 'UA 736 PMO–EWR June 23 9:45 AM–2:05 PM; UA 3591 EWR–PIT 4:10–5:44 PM; 2h05 connection',
    exactFamilyFareUsd: audit.fare.totalUsd, fareFamily: 'Economy', baggage: 'First checked bag per person included', ticketed: false,
    tightOutboundConnectionMinutes: 64, homeArrivalDate: '2027-06-23'
  },
  sourceRefs: ['sicily-google-flights-2026-11-08', 'sicily-united-checkout-2026-11-08'],
  sourceLocators: {
    'sicily-google-flights-2026-11-08': 'Exact-date search PIT–CTA June 10 / PMO–PIT June 23 for three adult fares and one child; expanded flight numbers, local times and connections. Selected United Economy $6,098; Basic $5,138; refundable $6,898. Retained in sicily/flightAudit.json.',
    'sicily-united-checkout-2026-11-08': 'United traveler-information checkout after the Economy handoff: both directions and four segments together, four travelers, $5,660 base fare + $437.66 taxes = $6,097.66. General-traveler baggage table: first bag $0 for each direction. No names, birth dates or payment entered. Cropped price capture in docs/research/sicily-united-economy-2026-11-08.jpg.'
  }
});
const budgetFact = evidence.facts.find(fact => fact.id === 'budget-band');
budgetFact.value.lineItems[0].label = 'International multi-city flights · allowance; current Economy quote $6,097.66';
budgetFact.value.observedFlightQuoteUsd = audit.fare.totalUsd;
budgetFact.value.observedFlightQuoteDate = audit.verifiedAt;
budgetFact.value.currentSupplierQuote = false; // The whole package is still not quoted.
const loadFact = evidence.facts.find(fact => fact.id === 'operational-load');
loadFact.value.plannedDrivingHours = groundMinutes / 60;
loadFact.value.drivingBasis = 'Six driving allowances are grouped into the single cumulative rental-car timeline block in #getting-around, with individual airport/base drives detailed below; not measured journeys or exact-lodging routes.';
evidence.metrics.airHours = 1340 / 60;
evidence.metrics.groundHours = groundMinutes / 60;
evidence.metrics.connectionHours = 189 / 60;
evidence.metrics.airElapsedHours = 1529 / 60;
evidence.metrics.lodgingComfort.laundry = 'preferred at one of the three bases';
evidence.axes.budget.rationale = 'Cash $12,260–$16,770; high end exceeds $15k. United Economy airfare was observed at $6,097.66 for four, but lodging and rental remain unquoted, so the planning band and low overall budget confidence are retained.';
evidence.axes.risk.rationale = 'Exact four-person flights reached United checkout, but the 64-minute Montréal connection is tight, early PMO rental return remains unquoted, and Etna access is conditional. Two flex days protect activities; final fare and ticket rules still require review.';
evidence.evidenceBasis = 'Exact June 10 / June 23 four-passenger flights and $6,097.66 United Economy checkout verified November 8, 2026; quote not held. Retained dated Sicily climate, fire and attraction evidence; stays and rental remain unquoted. See flightAudit.json for clocks, baggage, caveats and alternative-route rejection.';
evidence.confidenceBasis = evidence.confidenceBasis.filter(text => !/canonical two-base|Delta newsroom route confirmation/.test(text));
evidence.confidenceBasis = [...new Set([...evidence.confidenceBasis, 'United four-traveler Economy checkout and Google exact-date flight details observed November 8; no booking or payment submitted.'])];
evidence.flightAudit = {
  reviewedAt: audit.verifiedAt, expiresAt: audit.expiresAt, status: 'confirmed',
  headline: 'Exact June flights verified: $6,097.66 Economy for four; tight Montréal connection',
  sourcePath: 'src/_data/sicily/flightAudit.json',
  note: 'One United airline checkout observed, not ticketed. Reprice before paying; no conditional credit-card discount is applied.'
};
profile.routeReadiness.sicily = 'confirmed';
sources['sicily-google-flights-2026-11-08'] = {
  label: 'Sicily exact-date flights · four passengers · November 8, 2026', tier: 'observed-quote', publisher: 'Google Flights', url: audit.selectedUrl,
  scope: 'PIT–CTA June 10 / PMO–PIT June 23, 2027; three adult fares and one child. Exact schedules and airline fare options observed, not held. The BA headline requires a Heathrow–Gatwick transfer. Recheck within 24 hours.'
};
sources['sicily-united-checkout-2026-11-08'] = {
  label: 'United Sicily Economy checkout · $6,097.66 for four', tier: 'observed-quote', publisher: 'United Airlines', url: 'https://www.united.com/en/us/traveler/choose-travelers',
  scope: 'Session-specific checkout reached from the retained Google itinerary; generic URL will not restore the cart. Both directions, four travelers and Economy total $6,097.66 verified, with first checked bags at $0. No traveler data or payment entered. No $500 card promotion deducted. Retained audit and cropped screenshot provide the locator.'
};
const derived = deriveEvidenceConfidence(evidence, read('tools/scorecard.manifest.json'));
for (const [id, confidence] of Object.entries(derived.axes)) evidence.axes[id].confidence = confidence;
evidence.overallConfidence = derived.overall;

assert.equal(JSON.stringify(main.scorecard), beforeScorecard);
assert.equal(JSON.stringify(main.itinerary.days.flatMap(day => day.spots).map(spot => spot.images)), beforeImages);
assert.equal(totalMinutes, 2459);
const outputs = [
  [mainPath, main], ['src/_data/sicily/evidence.json', evidence],
  ['src/_data/decisionProfile.json', profile], ['src/_data/shared/evidenceSources.json', sources]
].map(([file, value]) => [file, JSON.stringify(value, null, 2) + '\n']);
for (const [, value] of outputs) JSON.parse(value); // Preflight every write first.
for (const [file, value] of outputs) fs.writeFileSync(file, value);
console.log(`Updated Sicily transport: ${legs.length} timeline stages, ${quote} observed Economy fare; scores and photos unchanged.`);
