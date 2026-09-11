import fs from 'node:fs';
import { deriveEvidenceConfidence } from './lib/evidence-confidence.mjs';

// Evidence correction, not a new price search. Preserve the original observations
// and downgrade unsupported live-confirmation claims instead of renewing them.
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const date = '2026-09-11';
const profile = read('src/_data/decisionProfile.json');
const sources = read('src/_data/shared/evidenceSources.json');
const flights = read('src/_data/flightAudits.json');
const manifest = read('tools/scorecard.manifest.json');
const checks = {
  'short-acadia': ['Pittsburgh International Airport', 'https://flypittsburgh.com/pittsburgh-international-airport/flights/destinations/', 'The airport currently lists Portland, Maine on Breeze three times weekly, seasonally. This is not an exact June 12–19 schedule or a protected connecting-ticket quote.'],
  'short-alaska': ['Alaska Airlines', 'https://www.alaskaair.com/en/flights-from-pittsburgh-to-anchorage', 'Alaska markets Pittsburgh–Anchorage fares, currently for other dates and one passenger. June 12–19 family availability, Seattle connections and eastbound arrival date require checkout verification.'],
  'short-algarve': ['British Airways', 'https://www.britishairways.com/content/en/us/flights/portugal/algarve', 'BA lists London Heathrow and London City service to Faro. Require the same London airport and one through-ticket from Pittsburgh; no June 12–20 family quote was reproduced.'],
  'short-azores': ['Azores Airlines', 'https://flights.azoresairlines.pt/en/flights-to-azores', 'The operator markets Boston–Ponta Delgada for other dates. No June 11–19 family ticket or Pittsburgh positioning protection was verified; the old Newark option is historical, not a renewed quote.'],
  'short-iceland': ['Icelandair', 'https://www.icelandair.com/en-us/flights/flights-from-pittsburgh-to-reykjavik', 'The operator markets PIT–KEF but the retrieved offers do not reproduce June 13–21 at $709. Economy Light offers exclude optional extras. Exact nonstop operating days, four seats, checked bags and seat fees remain booking gates.'],
  'short-ischia': ['Naples Airport / United Airlines', 'https://www.aeroportodinapoli.it/documents/d/gesac/united-airlines-extends-seasonal-service-between-naples-and-new-york-final-pdf?download=true', 'The airport-hosted United release documents Newark–Naples seasonal service historically, not June 2027 availability. Require a protected PIT–NAP ticket and a weather-safe Naples/Ischia ferry buffer.'],
  'short-madeira': ['TAP Air Portugal', 'https://www.flytap.com/en_us/flights-to-funchal', 'TAP markets Funchal service, but the destination page does not establish the complete June 11–19 Pittsburgh family itinerary. Reject London airport changes and separate-ticket connections; wind disruption remains a planning risk.'],
  'short-portugal': ['TAP Air Portugal', 'https://www.flytap.com/en_us/flights-to-lisbon', 'TAP markets Lisbon service, not the required complete June 12–20 LIS-in/FAO-out Pittsburgh family ticket. Price both ends together; retain the Lisbon airport-night fallback if Faro does not work.'],
  'short-puerto-rico': ['American Airlines', 'https://www.aa.com/en-us/flights-from-pittsburgh-to-san-juan', 'American markets PIT–SJU for other dates and one adult; Basic Economy and optional-fee caveats apply. No June 12–19 four-passenger fare or connection protection was reproduced.'],
  'short-sicily': ['Delta Air Lines', 'https://news.delta.com/discover-captivating-catania-delta-introduces-nonstop-service-sicily', 'Delta documents the daily JFK–Catania route launch in May 2025, not the June 12–20, 2027 family price or availability. Require a protected PIT–JFK–CTA ticket and reprice bags and seats.'],
};
const pending = [];
for (const [slug, [publisher, url, finding]] of Object.entries(checks)) {
  const p = `src/_data/${slug}`;
  const e = read(`${p}/evidence.json`);
  const m = read(`${p}/main.json`);
  const sourceId = `${slug}-route-review-20260911`;
  sources[sourceId] = {label: `${publisher} route evidence reviewed September 11, 2026`, tier: 'operator', publisher, url, scope: finding};
  const stale = e.facts.filter(f => f.expiresAt && f.expiresAt < date);
  if (!stale.length) continue;
  e.archivedExpiredFacts = [...(e.archivedExpiredFacts || []), ...structuredClone(stale)];
  e.reviewedAt = date;
  for (const f of stale) {
    f.verifiedAt = date;
    f.expiresAt = '2026-10-11';
    f.confidence = 'medium';
    f.claimType = 'proxy';
    f.sourceRefs = ['internal-itinerary', sourceId];
    f.sourceLocators = {'internal-itinerary': `${slug}/main.json: unchanged planning dates and itemized budget; prior fare observation archived, not re-quoted`, [sourceId]: finding};
    if (f.id === 'route-readiness') {
      f.proxyStatus = 'current-proxy';
      f.value = {status:'current-proxy', singleTicket:m.scorecard.facets.singleTicket, maxConnections:m.scorecard.facets.maxConnections, exact2027FlightsVerified:false, june2027Verified:false, fourSeatsVerified:false, protectionVerified:false, singleTicketIsBookingRequirement:true, currentFlightAudit:finding, historicalObservationDate:'2026-08-08'};
    } else if (f.id === 'budget-band') {
      f.proxyStatus = 'derived';
      delete f.value.airfareObservation;
      f.value.currentSupplierQuote = false;
      f.value.basis = 'Itemized planning arithmetic reviewed; historical airfare and unquoted lodging/other allowances retained, not confirmed current prices.';
    } else if (f.id === 'airfare-signal') {
      f.proxyStatus = 'current-proxy';
      f.value = {route:'PIT–KEF',currentDisplayedFareUsdPerPerson:null,historicalFareUsdPerPerson:709,historicalObservationDate:'2026-08-08',displayedDates:null,requestedDates:profile.tripWindows[slug],fareIncludesFamilySeatsAndBags:false,checkoutReconfirmationRequired:true, finding};
    }
  }
  profile.routeReadiness[slug] = 'current-proxy';
  e.flightAudit = {reviewedAt:date,status:'current-proxy',headline:'Route proxy only; previous fare is historical'};
  const prior = flights.trips[slug];
  flights.trips[slug] = {reviewedAt:date,status:'current-proxy',headline:'Recheck exact dates and four seats before booking',detail: finding + ' Existing costs are planning allowances, not a fresh quote. Bags, seats, fare rules and protected connections must be priced for all four.',historicalObservation:prior};
  const derived = deriveEvidenceConfidence(e,manifest);
  for (const [axis, confidence] of Object.entries(derived.axes)) e.axes[axis].confidence = confidence;
  e.overallConfidence = derived.overall;
  let count = 0;
  for (const part of m.parts) if (part.html) {
    part.html = part.html.replace(/<section id="air-travel"[^>]*>([\s\S]*?)<\/section>/g, (_, inner) => {
      count++;
      const historical = inner.replace(/<article class="current-flight-callout"[\s\S]*?<\/article>/g, '');
      return `<section id="air-travel" class="divider"><div class="section-label"><p class="eyebrow">Flights from Pittsburgh</p><h2>Route proxy — recheck before booking</h2><p>Evidence reviewed September 11, 2026. ${finding}</p></div><p>Travel window: ${profile.tripWindows[slug].join(' through ')}. Price all four travelers (three adult fares and one child aged 8), bags and seats on the same itinerary. Through-ticket protection is a booking requirement, not confirmed inventory. Retain the Pittsburgh June 24–26 buffer.</p><p><a href="${url}" target="_blank" rel="noopener">${publisher}: route evidence and limitations</a></p><details><summary>Historical planning notes — prices and schedules below are not current confirmations</summary><p>These earlier estimates are retained for context only. They were not reproduced in this review. Do not book nonrefundable lodging against them.</p>${historical}</details></section>`;
    });
  }
  if (count !== 1) throw new Error(`${slug}: expected one air section, found ${count}`);
  pending.push([`${p}/evidence.json`, e], [`${p}/main.json`, m]);
}
for (const [p,v] of pending) write(p,v);
write('src/_data/shared/evidenceSources.json',sources);
write('src/_data/decisionProfile.json',profile);
write('src/_data/flightAudits.json',flights);
const priorNote = ' This prior September 10 component evidence was reviewed, not newly reproduced for four passengers; retain the booking gate.';
const dedupe = value => {
  if (typeof value === 'string') {
    while (value.includes(priorNote + priorNote)) value = value.replace(priorNote + priorNote, priorNote);
    return value;
  }
  if (Array.isArray(value)) return value.map(dedupe);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,dedupe(v)]));
  return value;
};
for (const p of ['src/_data/flightAudits.json','src/_data/rerankingAudit.json', ...fs.readdirSync('src/_data').filter(s=>fs.existsSync(`src/_data/${s}/main.json`)).map(s=>`src/_data/${s}/main.json`)]) {
  const current=read(p), cleaned=dedupe(current);
  if (JSON.stringify(current)!==JSON.stringify(cleaned)) write(p,cleaned);
}
console.log(`Corrected expired evidence for ${pending.length / 2} short escapes; costs and axes unchanged.`);
// Explicit years prevent the display-date transform from inheriting the 2026
// review year when the next sentence describes a June 2027 travel window.
const explicitYear = value => {
  if (typeof value === 'string') return value.replace(/June (\d{1,2})–(\d{1,2})(?![\d,]| 2027)/g, (_,a,b)=>`June ${a}–${b}, 2027`);
  if (Array.isArray(value)) return value.map(explicitYear);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,explicitYear(v)]));
  return value;
};
for (const p of ['src/_data/shared/evidenceSources.json','src/_data/flightAudits.json',...Object.keys(checks).flatMap(s=>[`src/_data/${s}/main.json`,`src/_data/${s}/evidence.json`])]) {
  const current=read(p), corrected=explicitYear(current);
  if (JSON.stringify(current)!==JSON.stringify(corrected)) write(p,corrected);
}
