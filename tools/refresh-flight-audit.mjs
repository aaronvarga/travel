#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareDefault } from './lib/recommendation-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const audit = readJson(path.join(dataDir, 'flightAudits.json'));
const profilePath = path.join(dataDir, 'decisionProfile.json');
const profile = readJson(profilePath);
const sourceId = 'google-flights-2027-current-audit';

const budgetUpdates = {
  'short-acadia': { flightOld: '$800–$1,600', flightNew: '$1,800–$2,200', totalOld: '$6,700–$10,200', totalNew: '$7,700–$10,800', low: 7700, high: 10800, arithmetic: '1800–2200 + 2450–3850 + 650–1100 + 1200–1700 + 300–550 + 1300–1400 = 7700–10800' },
  'short-algarve': { flightOld: '$4,800–$6,200', flightNew: '$6,200–$7,000', totalOld: '$8,400–$11,850', totalNew: '$9,800–$12,650', low: 9800, high: 12650, arithmetic: '6200–7000 + 1600–2400 + 850–1150 + 350–650 + 300–650 + 500–800 = 9800–12650' },
  'short-azores': { flightOld: '$3,200–$5,000', flightNew: '$6,600–$7,400', totalOld: '$6,200–$9,800', totalNew: '$9,600–$12,200', low: 9600, high: 12200, arithmetic: '6600–7400 + 1050–1750 + 450–800 + 750–1150 + 300–500 + 450–600 = 9600–12200' },
  'short-madeira': { flightOld: '$3,000–4,400', flightNew: '$8,200–9,000', totalOld: '$5,700–8,900', totalNew: '$10,900–13,500', low: 10900, high: 13500, arithmetic: '8200/9000 + 875/1575 + 550/950 + 700/1050 + 175/325 + 400/600 = 10900/13500' },
  'short-sicily': { flightOld: '$4,600–$5,800', flightNew: '$7,600–$8,400', totalOld: '$8,400–$12,100', totalNew: '$11,400–$14,700', low: 11400, high: 14700, arithmetic: '7600–8400 + 600–1050 + 1150–2150 + 900–1300 + 650–1050 + 500–750 = 11400–14700' },
  portugal: { flightOld: '$2,300–3,500', flightNew: '$5,300–6,200', totalOld: '$7,500–11,700', totalNew: '$10,500–14,400', low: 10500, high: 14400, arithmetic: '5300–6200 + 390–785 + 650–1250 + 250–350 + 2200–3500 + 1700–2300 = 10490–14385; displayed 10500–14400' },
  croatia: { flightOld: '$3,600–4,800', flightNew: '$5,600–6,800', totalOld: '~$8.4k–12.8k', totalNew: '~$10.4k–14.8k', low: 10400, high: 14800, arithmetic: '5600–6800 flights + 700–1300 grouped ground transport + 2100–3100 lodging + 1705–2900 grouped food/activities + 300–700 buffer = 10405–14800; displayed 10400–14800' },
  'sardinia-corsica': { flightOld: '$3,200-4,600', flightNew: '$5,400-6,400', totalOld: '~$10.7k–16.5k', totalNew: '~$12.9k–18.3k', low: 12900, high: 18300, arithmetic: '5400–6400 + 3200–5500 + 1280–2400 + 3000–4000 = 12880–18300; displayed 12900–18300' },
  'turkish-riviera': { flightOld: '$4,800-$7,000', flightNew: '$7,000-$8,000', totalOld: '~$10.0k-$17.4k', totalNew: '~$12.2k-$18.4k', low: 12200, high: 18400, arithmetic: '7000–8000 + 1100–2000 + 1650–3400 + 1350–2250 + 700–2000 + 350–700 = 12150–18350; displayed 12200–18400' }
};

const scoreUpdates = {
  'short-acadia': { ease: 3 },
  'short-algarve': { budget: 4, risk: 4 },
  'short-azores': { budget: 4, risk: 4 },
  'short-madeira': { budget: 4 },
  'short-sicily': { budget: 2, risk: 4 },
  'short-iceland': { risk: 4 },
  'short-ischia': { risk: 4 },
  'short-puerto-rico': { risk: 4 },
  portugal: { budget: 2 },
  croatia: { budget: 2 },
  'canary-islands': { risk: 3 },
  'madeira-crete': { risk: 3 },
  'madeira-sicily': { ease: 2 },
  'slovenia-adriatic': { risk: 4 },
  'iceland-ischia-cilento': { risk: 1 }
  ,'greece-ionian': { ease: 3 }
};

const facetUpdates = {
  'short-acadia': { maxConnections: 1 },
  'short-azores': { singleTicket: true },
  'slovenia-adriatic': { singleTicket: true }
};

const textUpdates = {
  'greece-ionian': [
    ['The warmest, easiest turquoise-swim trip on the board', 'Warm turquoise swimming with a necessary Athens exit'],
    ['takes one short direct ferry to Lefkada for 5 nights', 'takes one short direct ferry to Lefkada for 4 nights, then uses an Athens-airport buffer'],
    ['for 5 nights (Porto Katsiki', 'for 4 nights (Porto Katsiki'],
    ['and flies home from nearby Preveza', 'and flies home from Athens because Preveza has no itinerary on the exact return date'],
    ['EFL -> Kefalonia 7n -> ferry -> Lefkada 5n -> PVK', 'EFL -> Kefalonia 7n -> ferry -> Lefkada 4n -> Athens airport 1n -> ATH'],
    ['One country, one short ferry, no backtracking.', 'One country, one short ferry, then a 4½–5 hour drive to the Athens-airport buffer.'],
    ['Reliable Kefalonia arrival; road causeway (no ferry) links Lefkada to the Preveza departure.', 'Exact-date Kefalonia and Athens inventory is live; the Athens buffer replaces the nonexistent Preveza return.'],
    ['One thin flight leg', 'One long final transfer'],
    ['The homebound Preveza leg is a thin, often separate-ticket charter — the plan puts the reliable airport on arrival, buffers the departure, and documents a round-trip-Kefalonia variant that avoids it entirely.', 'No flight itinerary exists from Preveza on the exact return date. The corrected plan leaves Lefkada on Jun 21, drives to an Athens-airport hotel, and uses the sold Jun 22 ATH–PIT inventory.'],
    ['The homebound Preveza leg is a thin, often separate-ticket charter', 'No flight itinerary exists from Preveza on the exact return date'],
    ['In via reliable Kefalonia, home via thin Preveza', 'Kefalonia in, Athens out with a buffer night'],
    ['Research status: 2027 schedules are not yet bookable, so current 2025-2026 route and fare signals are planning proxies. Re-quote on ITA Matrix once inventory opens.', 'Research status: exact June 2027 inventory is live. PIT–EFL and ATH–PIT sell, while PVK returns no itinerary on the required date.'],
    ['Home: Preveza (PVK)', 'Home: Athens (ATH)'],
    ['Thin, seasonal, charter-heavy (LGW/FRA/MUC)', 'Sold one-stop transatlantic inventory after an airport-buffer night'],
    ['The last leg is often a separate low-cost ticket = self-transfer', 'The required PVK itinerary does not exist; use the protected ATH return instead'],
    ['Buffer 3+ hrs, insure the self-transfer, hold Jun 23', 'Drive Lefkada → ATH on Jun 21, sleep by the airport, fly Jun 22'],
    ['Lower-risk variant', 'Rejected alternative'],
    ['Round-trip EFL', 'Keep the PVK exit'],
    ['Fly in and out of Kefalonia, fully single-ticket via Athens', 'No exact-date PVK itinerary is sold'],
    ['One extra ferry and a little backtracking to skip PVK', 'Do not build the trip around a flight that Google Flights cannot price'],
    ['Protecting the Jun 24-26 blackout is the priority', 'Only reconsider if a protected PVK itinerary later appears'],
    ['open-jaw EFL in / PVK out', 'multi-city EFL in / ATH out'],
    ['Thu Jun 17-Mon Jun 21', 'Thu Jun 17-Sun Jun 20'],
    ['5</td><td>Lefkada (Nydri)', '4</td><td>Lefkada (Nydri)'],
    ['<tr><td>Tue Jun 22</td><td>Home</td><td>Lefkada -> PVK -> PIT</td><td>Home before the Jun 23 buffer</td></tr>', '<tr><td>Mon Jun 21</td><td>1</td><td>Athens airport</td><td>Drive 4½–5 hours from Lefkada; return the car and sleep by ATH</td></tr><tr><td>Tue Jun 22</td><td>Home</td><td>ATH -> PIT</td><td>Protected one-stop inventory is selling</td></tr>'],
    ['Lefkada -> Preveza (PVK) ~20-36 min, no ferry', 'Lefkada -> Athens airport ~4½–5 hr; buffer overnight'],
    ['The Preveza departure leg is thin', 'The Preveza departure is unavailable'],
    ['PVK\'s last leg is a seasonal, often separate-ticket charter (self-transfer).', 'No exact-date PVK itinerary is sold. The Athens-airport buffer is now part of the canonical route.'],
    ['Open-jaw EFL-in / PVK-out ticket (or round-trip EFL)', 'Multi-city EFL-in / ATH-out ticket'],
    ['or round-trip EFL', 'and return from ATH'],
    ['Kefalonia 7 nights (Sami) -> Fiskardo-Vasiliki ferry -> Lefkada 5 nights (Nydri), open-jaw EFL in / PVK out, a separate car per island.', 'Kefalonia 7 nights (Sami) -> Fiskardo-Vasiliki ferry -> Lefkada 4 nights (Nydri) -> Athens-airport buffer 1 night, multi-city EFL in / ATH out.'],
    ['No live 2027 quote; 2025-2026 proxy. Compare open-jaw EFL/PVK vs round-trip EFL on ITA Matrix; buffer and insure the PVK leg.', 'Exact-date EFL and ATH inventory is live; price EFL-in/ATH-out as one protected multi-city ticket and reject PVK.']
    ,['Real priced planning band using 2025-2026 route/fare/lodging signals because June 2027 inventory is not live.', 'Current planning band with exact-date air inventory checked August 8, 2026; the final protected multi-city price still needs checkout confirmation.'],
    ['Airfare, open-jaw (EFL in / PVK out)', 'Airfare, multi-city (EFL in / ATH out)'],
    ['Consider the round-trip-Kefalonia routing — it can undercut the open-jaw and de-risk the flights.', 'Keep the Athens buffer; do not trade it for the unavailable PVK exit.'],
    ['Kefalonia 7 nights (Sami) -> Fiskardo-Vasiliki ferry -> Lefkada 5 nights (Nydri), multi-city EFL in / ATH out, a separate car per island.', 'Kefalonia 7 nights (Sami) -> Fiskardo-Vasiliki ferry -> Lefkada 4 nights (Nydri) -> Athens-airport buffer 1 night, multi-city EFL in / ATH out.'],
    ['the route is opinionated, but 2027 fares, the ferry timetable', 'the corrected air route is defined, but the final multi-city fare, ferry timetable'],
    ['The route is opinionated, but 2027 fares, the ferry timetable', 'The corrected air route is defined, but the final multi-city fare, ferry timetable'],
    ['Lefkada for 5 nights', 'Lefkada for 4 nights'],
    ['It delivers the board’s easiest warm swimming — calm turquoise coves, short drives, one ferry — while being straight about the one weak link, the Preveza flight leg.', 'It delivers the board’s easiest warm swimming while being straight about the corrected exit: a long Lefkada-to-Athens transfer and airport-buffer night.'],
    ['Land at Kefalonia’s well-served airport (single-ticketable via Athens), one short direct ferry to Lefkada, a road causeway (no ferry) to Preveza, short island drives, and a separate easy car on each island. No open-jaw scramble on arrival, no long transfers.', 'Land at Kefalonia’s well-served airport, take one short direct ferry to Lefkada, then drive 4½–5 hours to an Athens-airport hotel on Jun 21. The islands remain easy; the final mainland transfer is the deliberate cost of using a sold return.'],
    ['You give up big-city culture and mountains — this is a focused island-and-sea trip — and you accept one thin flight leg. Preveza’s homebound charter is the weak link, so the plan buffers it and offers a round-trip-Kefalonia alternative that skips it.', 'You give up one Lefkada night and accept a third lodging sleep plus the long Athens transfer. That is less easy than the old PVK draft, but it protects the Jun 22 return with real inventory.'],
    ['Two island bases, one short ferry apart', 'Two island bases plus one Athens-airport buffer'],
    ['A calm east-coast Kefalonia base for the caves, Myrtos, and boat days, then a Lefkada east-coast base within reach of the west beaches and the Nydri boats. No airport-buffer night is needed — the causeway puts Preveza minutes from the last base.', 'Use Kefalonia for seven nights and Lefkada for four, then leave after the final island breakfast on Jun 21 for one protected Athens-airport night before flying home.'],
    ['Lefkada (Nydri) · 5 nights', 'Lefkada (Nydri) · 4 nights'],
    ['<div class="pcard"><h4><span class="dot"></span>The ferry between</h4>', '<div class="pcard"><h4><span class="dot"></span>Athens airport · 1 night</h4><div class="prow"><span>When</span><strong>Mon Jun 21</strong></div><div class="prow"><span>Plan</span><strong>Drive from Lefkada, return the car, sleep near ATH</strong></div><div class="prow"><span>Why</span><strong>Protect the sold Jun 22 return and reject unavailable PVK</strong></div></div><div class="pcard"><h4><span class="dot"></span>The ferry between</h4>'],
    ['PVK’s last leg is a seasonal, often separate-ticket charter (self-transfer). Buffer 3+ hours, insure the misconnection, and keep the round-trip-Kefalonia variant as the low-risk alternative.', 'No exact-date PVK itinerary is sold. Leave Lefkada on Jun 21, drive to ATH, and protect the sold Jun 22 return with the airport-buffer night.'],
    ['Proxies until 2027 loads', 'Only the non-flight details remain provisional'],
    ['The open-jaw fare, the June ferry timetable, and the Navagio/Egremni access status are all current proxies. Re-quote and reconfirm once 2027 inventory and municipal notices are out.', 'The flight components are live; re-price the protected multi-city checkout and reconfirm the ferry timetable plus Navagio/Egremni access before purchase.'],
    ['Current research refreshed July 2026 for a June 2027 trip.', 'Flight research refreshed August 8, 2026 for the exact June 2027 dates.'],
    ['holding the preferred Jun 23 return as a buffer against the thin Preveza leg', 'holding Jun 23 as a buffer after the sold Athens return'],
    ['re-quote on ITA Matrix when 2027 loads', 'refresh the protected checkout price before purchase'],
    ['<h4>Flights</h4><p class="sub">Reliable in, thin out</p><ul><li class="flag"><b>Arrive at Kefalonia (EFL)</b> — single-ticketable via Athens.</li><li class="flag"><b>Buffer the Preveza leg</b> — it’s a thin self-transfer charter.</li><li><b>Or fly round-trip EFL</b> and ferry to Lefkada to skip PVK.</li></ul>', '<h4>Flights</h4><p class="sub">Kefalonia in, Athens out</p><ul><li class="flag"><b>Arrive at Kefalonia (EFL)</b> on the sold exact-date routing.</li><li class="flag"><b>Reject Preveza (PVK)</b> — no itinerary exists for the return date.</li><li><b>Sleep by ATH on Jun 21</b> before the protected flight home.</li></ul>'],
    ['Kefalonia’s ~28 weekly Athens flights and Delta/Aegean interline make the arrival single-ticketable, and the direct ~1h Fiskardo-Vasiliki ferry keeps island-hopping simple — while the thin Preveza departure is the one leg reviewers flag as fragile.', 'Kefalonia’s Athens feed and the direct Fiskardo–Vasiliki ferry keep the island half simple. The final 4½–5 hour drive and ATH buffer replace the unavailable Preveza departure.'],
    ['Open-jaw total', 'Multi-city total']
  ],
  'short-acadia': [
    ['Current seasonal PIT–PWM nonstop service is useful evidence, but exact June 2027 operating days and fares are not confirmed.', 'Exact June 2027 inventory is live: the planned dates sell with one protected connection, not a nonstop.'],
    ['PIT → PWM nonstop if operating', 'PIT → DCA/PHL → PWM · protected one-stop'],
    ['If the nonstop timing leaves an evening mountain drive, take a protected connection instead.', 'Choose the connection that reaches Portland early enough for the three-hour drive; do not chase an unavailable nonstop.'],
    ['One protected connection', 'One protected connection · exact-date inventory live'],
    ['Exact nonstop days and safe timing.', 'Choose the safest one-stop times; no exact-date nonstop is sold.'],
    ['PIT → Portland (PWM) ~1.7h', 'PIT → Portland (PWM) ~3.5h'],
    ['Portland (PWM) → PIT ~1.8h', 'Portland (PWM) → PIT ~3.5h'],
    ['flight routings are 2027 planning proxies', 'flight routing was checked against exact 2027 inventory']
  ],
  'short-algarve': [
    ['Current Pittsburgh-to-Portugal fare evidence supports the range, but exact June 2027 Faro flights are not yet a family quote.', 'Exact June 2027 Faro inventory is selling with one protected connection; the live fare is near the top of the former planning range.'],
    ['Family flight estimate $4,800–$6,200 with seats/bags', 'Family flight estimate $6,200–$7,000 with seats/bags'],
    ['Family air band $4,800–$6,200 with bags/seats', 'Family air band $6,200–$7,000 with bags/seats'],
    ['Exact 2027 flights and the specific pool stay are not available yet', 'Exact 2027 flights are live; the specific pool stay still needs a current quote']
  ],
  'short-azores': [
    ['Boston is the useful gateway—but 2027 is not bookable yet', 'Newark is the protected exact-date gateway'],
    ['Azores Airlines currently publishes/operates Boston–Ponta Delgada service. Treat that only as a route-pattern proxy until the exact June 2027 dates load.', 'United now sells the exact June 11–19 itinerary as PIT–EWR–PDL on one protected ticket.'],
    ['PIT–BOS–PDL', 'PIT–EWR–PDL'],
    ['PDL–BOS–PIT', 'PDL–EWR–PIT'],
    ['Fallback Overnight Boston buffer', 'Fallback A later protected EWR connection'],
    ['If PIT–BOS and BOS–PDL must be separate tickets, use a conservative Boston overnight in each direction or reject the itinerary. A same-day self-connect is not an “easy trip.”', 'Do not replace the sold protected itinerary with separate tickets just to save a small amount.'],
    ['2027 schedule Not published / not verified', '2027 schedule Exact June 11–19 itinerary verified'],
    ['When June 2027 inventory opens', 'Monthly until purchase'],
    ['Fallback Overnight Boston buffer', 'Fallback A later protected EWR connection'],
    ['Not published / not verified', 'Exact June 11–19 itinerary verified'],
    ['$6,600–$7,400 family proxy', '$6,600–$7,400 current family band'],
    ['Exact flight and thermal times remain open.', 'Flight inventory is live; thermal reservations and weather remain open.'],
    ['The band is a current planning proxy, not a June 2027 quote. Airfare is the largest open variable.', 'The band uses the current exact-date airfare snapshot; airfare should still be refreshed before purchase.'],
    ['Protected air ticketing or safe Boston buffers', 'Protected PIT–EWR–PDL ticketing'],
    ['Reprice flights, apartment, automatic car and thermal entries when exact June 2027 inventory opens.', 'Refresh the sold flight, apartment, automatic car and thermal-entry prices before purchase.'],
    ['The week is clear; the air contract is not', 'The air route is live; the ground details remain open'],
    ['Keep the shape, but wait for exact June 2027 flights and current thermal reservations.', 'Keep the protected one-stop and wait only for current thermal reservations and a satisfactory total price.'],
    ['$6.2k–$9.8k for four', '$9.6k–$12.2k for four'],
    ['Protected PIT–EWR–PDL or safe Boston overnight buffers', 'Protected PIT–EWR–PDL on the sold exact dates'],
    ['PIT → BOS → PDL', 'PIT → EWR → PDL'], ['PDL → BOS → PIT', 'PDL → EWR → PIT']
  ],
  'short-madeira': [
    ['There is no PIT–FNC nonstop; exact June 2027 schedules still need to load before choosing the best connection.', 'Exact June 2027 schedules are loaded. The acceptable options use two protected connections; the cheaper one-stop changes London airports and is rejected.'],
    ['Excellent family fare Around $3,000 with bags/seats', 'Current family floor About $8,200 with seats/bags'],
    ['Upper comfort limit $4,400', 'Current planning ceiling About $9,000'],
    ['If the protected family total rises much above $4.4k, Madeira loses its value advantage.', 'The exact-date airfare has already removed Madeira’s former value advantage; book only if the full $10.9k–$13.5k trip band is acceptable.'],
    ['$3,000', '$8,200'], ['$4,400', '$9,000'], ['$5,700', '$10,900'], ['$8,900', '$13,500'],
    ['$5.7k–$8.9k', '$10.9k–$13.5k'],
    ['refresh exact prices when June 2027 inventory opens', 'use the exact-date airfare snapshot and refresh it before purchase'],
    ['Excellent family fare', 'Observed family floor']
  ],
  'short-sicily': [
    ['June 2027 schedules and fares are not published yet.', 'Exact June 2027 schedules and fares are now published.'],
    ['Family flight estimate $4,600–$5,800 with seats/bags', 'Family flight estimate $7,600–$8,400 with seats/bags'],
    ['June is Catania’s priciest month (~$1,380/person average).', 'The live exact-date floor is about $1,886 per traveler before optional seats and bags.']
  ],
  portugal: [
    ['Return route depends on schedules and pricing. Fly home from FNC unless pricing is absurd.', 'Exact June inventory is live. Fly home from FNC on a protected itinerary and reject any option arriving after Jun 23; current prices require the revised airfare band.'],
    ['Exact flights 2027 schedules not loaded yet; Faro→Madeira timing is the fragile piece', 'Exact flights PIT–LIS and Faro→Madeira are live; the protected FNC→PIT return price is the remaining gate']
  ],
  iceland: [
    ['Clean nonstop logistics', 'Book the protected one-stop that actually operates'],
    ['2027 schedules aren\'t fully loaded yet, so current 2026 route/fare signals are the planning proxy. Re-quote once inventory opens.', 'Exact June 8–21 inventory is live. Protected one-stop tickets sell from about $649 round trip; the Tuesday outbound has no Icelandair nonstop.'],
    ['PIT KEF nonstop', 'PIT → YUL/ORD/IAD → KEF'],
    ['Carrier Icelandair, seasonal summer nonstop (~5h50m)', 'Carriers Air Canada/United/Delta · protected one-stop (~8h15–12h30 outbound)'],
    ['Family airfare gate ~$2,600 target; high case ~$3,600', 'Observed fare From ~$649 pp round trip; retain $2,600–$3,600 family allowance'],
    ['Verify 2026-07-19 Google Flights: June 2027 sells one-stop only so far (United via IAD ~$541 pp); the nonstop needs Icelandair\'s 2027 filing', 'Verified 2026-08-08: exact June 8–21 one-stop itineraries sell; no Tuesday PIT–KEF nonstop is offered'],
    ['No mid-trip flights', 'No mid-trip flights; one connection each way'],
    ['One round-trip, one carrier — no self-transfer risk', 'One protected round-trip — no self-transfer risk']
  ],
  'madeira-sicily': [
    ['The route hinge: the Tuesday easyJet rotation is what makes five Madeira nights possible &mdash; it is selling on Tuesdays in the current pattern (verified Google Flights 2026-07-19), and if the 2027 schedule kills it, same-day one-stops via Rome (TAP+ITA) or Barcelona (Vueling) preserve this exact day.', 'Exact June 15 inventory has no Lisbon–Palermo nonstop. Use a sold one-stop via Rome, Zurich or Munich; the Lisbon buffer still protects this full transfer day from Madeira wind.'],
    ['LIS -&gt; PMO nonstop pattern, ~3 hr', 'LIS -&gt; PMO one stop, ~6.5-10 hr'],
    ['Funchal → Lisbon → Palermo', 'Funchal → Lisbon buffer → Palermo'],
    ['~4¾h airborne', '~6½–10h Lisbon–Palermo journey after the buffer night'],
    ['2027 flight and hotel calendars are not open yet', 'Exact-date flight inventory is open; hotel calendars still need live quotes']
  ],
  'greece-via-lisbon': [
    ['Bands below are 2025&ndash;2026 data as a 2027 proxy &mdash; re-quote once 2027 schedules load.', 'Exact June 2027 LIS–CHQ inventory is live; retain the bands until the complete protected open-jaw is quoted.'],
    ['Lock once 2027 TAP/Aegean/Sky Express schedules load', 'Lock after the CHQ–PIT return prices on one protected multi-city ticket']
  ],
  hawaii: [
    ['Verified 2026 prices where 2027 is not bookable yet', 'Exact 2027 flights verified; non-air costs remain current planning prices'],
    ['The route is intentionally opinionated, but the booking details still need live fare and lodging checks once the 2027 window opens.', 'The exact flight legs are live; lodging and final checkout totals still need current checks.'],
    ['Confirm PIT-HNL and KOA-PIT open-jaw fares once June 2027 schedules are fully loaded.', 'PIT–HNL and KOA–PIT exact-date inventory is loaded; refresh the protected open-jaw total before purchase.']
  ],
  'short-portugal': [
    ['the exact 2027 family fare is not available yet', 'the exact PIT–LIS fare is live and the FAO–PIT open-jaw still needs checkout confirmation']
  ],
  'sicily-malta': [
    ['The exact 2027 airfare curve will still need fare tracking once schedules load.', 'The exact CTA–MLA flight is live; track the Sicily-in/Malta-out transatlantic until the protected multi-city price is acceptable.'],
    ['International flights <span>· when 2027 fares open; protect Jun 23 return</span>', 'International flights <span>· quote the live open-jaw now; protect Jun 23 return</span>'],
    ['CTA→MLA flight <span>· once Jun 20 schedule is loaded</span>', 'CTA→MLA flight <span>· exact Jun 20 nonstops are loaded</span>']
  ],
  spain: [
    ['Exact flights 2027 fares not loaded yet; compare PIT&ndash;MAD/AGP open jaw against round-trip MAD', 'Exact PIT–MAD inventory is live; compare the protected MAD-in/AGP-out price against round-trip MAD'],
    ['2027 fares not loaded yet; compare PIT–MAD/AGP open jaw against round-trip MAD.', 'Exact PIT–MAD inventory is live; compare the protected MAD-in/AGP-out price against round-trip MAD.']
  ],
  'sardinia-corsica': [
    ['$3,200-4,600', '$5,400-6,400'],
    ['~$10,680–16,500 planning band · stress ~$16,800', '~$12,880–18,300 planning band · stress ~$18,600'],
    ['~$10.7k–16.5k preference-fit · stress ~$16.5k', '~$12.9k–18.3k preference-fit · stress ~$18.6k'],
    ['2026 prices/ranges; 2027 flights, cars, and villas need re-checking once bookable.', 'Exact-date Sardinia airfare is live; the open-jaw, cars and villas still need current checkout quotes.']
  ],
  'turkish-riviera': [
    ['$4,800-$7,000', '$7,000-$8,000'],
    ['~$10.0k-$17.4k', '~$12.2k-$18.4k'],
    ['if flights and lodging are booked in the middle of the range', 'only if current quotes beat the middle of the range'],
    ['2027 flights and some ticket prices need a fresh quote before booking.', 'Exact Antalya inventory is live; the Dalaman open-jaw and ticket prices still need a fresh checkout quote before booking.']
  ],
  'iceland-ischia-cilento': [
    ['Seasonal PIT–KEF proxy; exact 2027 operation required', 'PIT–KEF one-stop is sold; the assumed Jun 10 nonstop is not'],
    ['Book PIT→FCO on Icelandair with a four-night Iceland stopover if the Jun 10 nonstop and Jun 15 KEF→FCO connection price together correctly.', 'Do not book this route as written: the Jun 10 PIT–KEF nonstop is absent, so the assumed Icelandair stopover fare to Rome cannot be constructed. Re-date or rebuild all three air tickets first.'],
    ['The route uses Icelandair’s stopover structure', 'The draft depended on an Icelandair stopover structure that is not sold on these dates'],
    ['Not ready to book 2027 exact PIT–KEF and KEF–FCO operating days, the stopover fare, and all live quotes require recheck.', 'Reroute required: exact PIT–KEF one-stop tickets sell, but the Jun 10 nonstop and assumed stopover fare to Rome do not.'],
    ['The planning construction is PIT→KEF→FCO on Icelandair, then a separately protected FCO→PIT return.', 'The former PIT→KEF→FCO Icelandair construction is invalid on Jun 10. Re-date or rebuild before booking any lodging.'],
    ['Jun 10 PIT → KEF seasonal nonstop', 'Jun 10 PIT → KEF: no nonstop sold; one-stop only'],
    ['4 Iceland nights; most fares permit up to 7', 'Four Iceland nights only after a replacement through-fare is found'],
    ['Exact PIT → KEF → FCO stopover flights', 'A replacement protected PIT → KEF → FCO construction'],
    ['Exact 2027 operating days', 'Reroute required'],
    ['Nearby June 2027 PIT–KEF fares are live, but the precise Jun 10 stopover construction still needs a bookable quote.', 'Exact one-stop PIT–KEF fares are live, but the required Jun 10 Icelandair nonstop/stopover construction is absent.']
  ]
};

const genericTextUpdates = [
  ['flight routings are 2027 planning proxies', 'flight durations are planning estimates; the current flight check governs route availability'],
  ['flight, rail, ferry and driving durations are 2027 planning proxies', 'flight, rail, ferry and driving durations are planning estimates; the current flight check governs route availability'],
  ['since 2027 schedules are not published yet', 'because the graphic shows sequence and approximate time blocks rather than a selected ticket'],
  ['since 2027 schedules are not published yet.', 'because the graphic shows sequence and approximate time blocks rather than a selected ticket.'],
  ['Research status: 2027 schedules are not live, so current 2025-2026 route and fare signals are used as planning proxies.', 'Research status: exact-date 2027 flight inventory has been checked; the current flight card states which parts still need a protected multi-city quote.'],
  ['Research status: 2027 schedules are not fully reliable yet, so current 2026/live route and fare signals are used as planning proxies.', 'Research status: exact-date 2027 long-haul and internal-flight inventory has been checked and is summarized in the current flight card.'],
  ['Research status: 2027 schedules are not yet bookable, so current 2025-2026 route and fare signals are planning proxies.', 'Research status: exact-date 2027 inventory has been checked; the current flight card distinguishes sold legs from open-jaw quote gates.'],
  ['Research status: 2027 schedules are not yet bookable, so current 2026 route and fare signals are planning proxies.', 'Research status: exact-date 2027 inventory has been checked; the current flight card distinguishes sold legs from open-jaw quote gates.'],
  ['Research is current as of July 2026; 2027 fares are not yet published, so the plan uses current proxies and explicit quote gates.', 'Flight research was refreshed August 8, 2026 against exact 2027 dates; the plan retains explicit quote gates for unpriced open-jaw combinations.'],
  ['2027 flight and hotel calendars are not open yet, so current 2026 data is used as proxy and flagged where it matters.', 'Exact-date flight inventory is now open and reflected here; hotel pricing remains a planning band and is flagged where it matters.'],
  ['2027 flights/cars/lodging are not bookable yet.', 'Exact-date flight inventory is live; cars and lodging still require current quotes.'],
  ['2027 flights/lodging are not bookable yet, so fare and lodging lines use current typical-summer bands researched July 2026.', 'Exact-date flight inventory is live; the fare line reflects the current route check while lodging remains a planning band.'],
  ['Schedules below are 2026 as a 2027 proxy — re-quote ~11 months out.', 'The exact June 2027 internal flight is live; the outer open-jaw still requires one protected multi-city quote.'],
  ['Schedules below are 2026 as a 2027 proxy &mdash; re-quote ~11 months out.', 'The exact June 2027 internal flight is live; the outer open-jaw still requires one protected multi-city quote.']
];

for (const [slug, flight] of Object.entries(audit.trips)) {
  const mainPath = path.join(dataDir, slug, 'main.json');
  const evidencePath = path.join(dataDir, slug, 'evidence.json');
  const variantsPath = path.join(dataDir, slug, 'variants.json');
  const main = readJson(mainPath);
  const evidence = readJson(evidencePath);
  const variants = readJson(variantsPath);

  main.parts = recursiveStrings(main.parts, (value) => applyStructuralFlightUpdates(slug, applyTextUpdates(applyTextUpdates(value, genericTextUpdates), textUpdates[slug] || [])));
  if (slug === 'greece-ionian') {
    main.preDepartureTodos = recursiveStrings(main.preDepartureTodos, (value) => value
      .replace('<b>Lefkada (Nydri)</b> 5 nights', '<b>Lefkada (Nydri)</b> 4 nights plus <b>Athens airport</b> 1 night')
      .replace('buffer the thin Preveza departure', 'use the Jun 21 Athens-airport buffer'));
    main.preDepartureTodos.labelHtml = '\n      <p class="eyebrow">Pre-Departure To-Do</p>\n      <h2>What to book before leaving</h2>\n      <p>Planning sequence for the Jun 9-22, 2027 Ionian route. Price the protected EFL-in / ATH-out ticket before lodging.</p>\n    ';
    Object.assign(main.preDepartureTodos.blocks[0], {
      when: 'Now',
      title: 'Exact flight inventory: price the corrected multi-city route',
      note: 'The component flights are live; buy only when the complete protected family price and connection times work.',
      items: [
        '<b>Price EFL in / ATH out on one protected multi-city ticket.</b> Do not restore the unavailable PVK return.',
        '<b>Set the airfare gate.</b> Retain the $5,600 target and $6,900 high case until the complete checkout is observed.',
        '<b>Protect the final transfer.</b> Leave Lefkada on Jun 21, return the car at ATH, and sleep by the airport.',
      ],
    });
    const exitPoint = main.mapPoints?.find((point) => /Preveza|PVK/.test(point.n));
    if (exitPoint) Object.assign(exitPoint, {
      n: 'Athens International Airport (ATH)', lat: 37.9364, lng: 23.9445,
      g: 'https://www.google.com/maps/search/?api=1&query=37.9364,23.9445', t: 'flight',
    });
  }
  injectFlightCallout(main, flight);

  const budget = budgetUpdates[slug];
  if (budget) {
    main.parts = recursiveStrings(main.parts, (value) => replaceAll(replaceAll(value, budget.flightOld, budget.flightNew), budget.totalOld, budget.totalNew));
    main.scorecard.budget.floorUsd = budget.low;
    main.scorecard.budget.ceilUsd = budget.high;
    const budgetFact = evidence.facts.find((fact) => fact.id === 'budget-band');
    budgetFact.value.lowUsd = budget.low;
    budgetFact.value.highUsd = budget.high;
    budgetFact.value.arithmetic = budget.arithmetic;
    budgetFact.verifiedAt = audit.reviewedAt;
    budgetFact.expiresAt = '2026-09-08';
    budgetFact.sourceRefs = unique([...(budgetFact.sourceRefs || []), sourceId]);
    budgetFact.sourceLocators = { ...(budgetFact.sourceLocators || {}), [sourceId]: flight.detail };
    const canonical = variants.variants.find((variant) => variant.id === variants.canonicalId);
    canonical.budget.lowUsd = budget.low;
    canonical.budget.highUsd = budget.high;
    canonical.confidence = 'high';
  }

  Object.assign(main.scorecard.axes, scoreUpdates[slug] || {});
  Object.assign(main.scorecard.facets, facetUpdates[slug] || {});
  main.scorecard.totalBaked = weightedTotal(main.scorecard);

  for (const [axis, score] of Object.entries(scoreUpdates[slug] || {})) {
    evidence.axes[axis].score = score;
  }
  updateChangedRationales(slug, main, evidence);

  const routeFact = evidence.facts.find((fact) => fact.id === 'route-readiness');
  routeFact.proxyStatus = flight.status;
  routeFact.confidence = 'high';
  routeFact.sourceRefs = unique([...(routeFact.sourceRefs || []), sourceId]);
  routeFact.value = {
    ...routeFact.value,
    status: flight.status,
    maxConnections: main.scorecard.facets.maxConnections,
    singleTicket: main.scorecard.facets.singleTicket,
    currentFlightAudit: flight.detail,
    exact2027FlightsVerified: flight.status === 'confirmed',
    june2027Verified: flight.status === 'confirmed'
  };
  routeFact.verifiedAt = audit.reviewedAt;
  routeFact.expiresAt = '2026-09-08';
  routeFact.sourceLocators = { ...(routeFact.sourceLocators || {}), [sourceId]: flight.detail };
  evidence.reviewedAt = audit.reviewedAt;
  const loadFact = evidence.facts.find((fact) => fact.id === 'operational-load');
  if (loadFact) {
    loadFact.value.easeScore = main.scorecard.axes.ease;
    loadFact.value.maxConnections = main.scorecard.facets.maxConnections;
    loadFact.value.singleTicket = main.scorecard.facets.singleTicket;
  }
  evidence.axes.risk.evidence = unique([...(evidence.axes.risk.evidence || []), 'route-readiness']);
  evidence.axes.risk.confidence = 'high';
  if (slug === 'short-sicily') evidence.axes.risk.confidence = 'medium';
  if (slug === 'short-puerto-rico') evidence.axes.ease.confidence = 'high';
  evidence.flightAudit = { reviewedAt: audit.reviewedAt, status: flight.status, headline: flight.headline };

  if (slug === 'greece-ionian') updateGreeceIonianRecords(evidence, variants);

  profile.routeReadiness[slug] = flight.status;
  writeJson(mainPath, main);
  writeJson(evidencePath, evidence);
  writeJson(variantsPath, variants);
}

writeJson(profilePath, profile);
refreshScoreCitations();
console.log(`refreshed flight audit for ${Object.keys(audit.trips).length} itineraries`);

function refreshScoreCitations() {
  const manifest = readJson(path.join(root, 'tools', 'scorecard.manifest.json'));
  const weights = Object.fromEntries(manifest.axes.map((axis) => [axis.id, axis.weightDefault]));
  const records = Object.keys(audit.trips).map((slug) => {
    const file = path.join(dataDir, slug, 'main.json');
    const main = readJson(file);
    return {
      file, main, slug,
      displayName: main.scorecard.displayName,
      excluded: typeof main.excluded === 'string' ? main.excluded : null,
      axes: main.scorecard.axes,
      budget: main.scorecard.budget,
      pto: main.scorecard.pto,
    };
  });
  const ranked = [...records]
    .filter((record) => record.main.tripCategory !== 'short')
    .sort((a, b) => compareDefault(a, b, manifest.axes, weights, profile.budget))
    .filter((record) => !record.excluded);
  const rankBySlug = new Map(ranked.map((record, index) => [record.slug, index + 1]));
  for (const record of records) {
    const total = record.main.scorecard.totalBaked;
    const rank = rankBySlug.get(record.slug);
    record.main.parts = recursiveStrings(record.main.parts, (value) => value
      .replace(/\b\d{2}\/55\b/g, `${total}/55`)
      .replace(/#\d+ of \d+/g, (match) => rank ? `#${rank} of ${ranked.length}` : match));
    writeJson(record.file, record.main);
  }
}

function updateGreeceIonianRecords(evidence, variants) {
  evidence.axes.risk.rationale = 'The corrected route removes the unavailable PVK self-transfer and uses sold ATH inventory, but the 4½–5 hour final drive, one-way car return, ferry timetable, and beach-access rules still require active management; Risk remains 3/5.';
  evidence.axes.nights.rationale = 'Twelve hotel nights (Kefalonia 7 + Lefkada 4 + Athens airport 1) derive 5/5 under the canonical nights rubric.';
  const load = evidence.facts.find((fact) => fact.id === 'operational-load');
  Object.assign(load.value, {
    baseMoves: 2,
    departureAirport: 'ATH after a 4½–5 hour Lefkada drive and one airport-buffer night',
    note: 'One country and one ferry remain simple on the islands; the corrected exit adds a long Lefkada-to-ATH drive, a one-way mainland car return, and a third lodging sleep.',
  });
  const route = evidence.facts.find((fact) => fact.id === 'route-readiness');
  Object.assign(route.value, {
    departureLeg: 'Lefkada -> ATH by car on Jun 21; airport-buffer night; ATH -> one protected hub -> PIT on Jun 22',
    note: 'Exact-date PIT-EFL and ATH-PIT components are live. Price EFL-in/ATH-out as one protected multi-city ticket, reject PVK, and reconfirm the ferry timetable and Navagio status.',
  });
  route.sourceLocators['aegean-ath-efl'] = 'EFL arrival frequency and sold ATH return inventory supporting the corrected multi-city route';
  route.sourceLocators['internal-itinerary'] = 'Corrected EFL-in/ATH-out construction with Jun 21 airport-buffer night';
  const canonical = variants.variants.find((variant) => variant.id === variants.canonicalId);
  canonical.notes = 'The checked-in canonical route is Kefalonia 7 nights, Lefkada 4 nights, and an Athens-airport buffer night; fly EFL in / ATH out and return Jun 22.';
  canonical.sourceLocators['internal-itinerary'] = 'Kefalonia + Lefkada + Athens-airport buffer; canonical EFL-in/ATH-out route';
  variants.alternateStatus = 'not-needed-current-route-corrected';
  variants.alternateNotes = 'The former PVK exit is rejected because no exact-date itinerary is sold. The Athens-airport buffer is now canonical rather than an alternate.';
}

function injectFlightCallout(main, flight) {
  const callout = `<article class="current-flight-callout" data-flight-audit="${audit.reviewedAt}"><span>Current flight check · 8/8/2026</span><strong>${escapeHtml(flight.headline)}</strong><p>${escapeHtml(flight.detail)}</p></article>`;
  main.parts = recursiveStrings(main.parts, (value) => value.replace(/<article class="current-flight-callout"[\s\S]*?<\/article>/g, ''));
  let inserted = false;
  main.parts = recursiveStrings(main.parts, (value) => {
    if (inserted || !value.includes('<section id="air-travel"')) return value;
    inserted = true;
    return value.replace(/(<section id="air-travel"[^>]*>)/, (section) => `${section}${callout}`);
  });
}

function updateChangedRationales(slug, main, evidence) {
  const a = evidence.axes;
  const range = `$${main.scorecard.budget.floorUsd.toLocaleString()}–$${main.scorecard.budget.ceilUsd.toLocaleString()}`;
  if (budgetUpdates[slug]) {
    a.budget.rationale = `The exact-date flight refresh moves the reconciled family band to ${range}. The Budget ${main.scorecard.axes.budget}/5 score follows the shared rubric; current airfare is an observed snapshot and must be re-priced before purchase.`;
    a.budget.confidence = 'medium';
  }
  const rationales = {
    'short-acadia': { ease: 'One room and one rental car remain simple, but the exact itinerary now requires one air connection plus the three-hour Portland drive in each direction, supporting Ease 3/5.' },
    'short-algarve': { risk: 'Exact protected Faro inventory removes the former schedule gate. The remaining uncertainty is ordinary Atlantic/cliff conditions with flexible one-base fallbacks, supporting Risk 4/5.' },
    'short-azores': { risk: 'A sold protected PIT–EWR–PDL itinerary removes the separate-ticket Boston failure point. Island weather remains the principal uncertainty, supporting Risk 4/5.' },
    'short-sicily': { risk: 'Exact protected one-stop Catania inventory removes the flight-publication gate. Etna operations and summer disruption remain manageable, supporting Risk 4/5.' },
    'short-iceland': { risk: 'The exact PIT–KEF nonstop is sold in both directions. Wind, road, surf and volcanic conditions still require daily checks, but schedule uncertainty is now low enough for Risk 4/5.' },
    'short-ischia': { risk: 'Exact protected Naples inventory removes the transatlantic schedule gate. Bay crossing weather remains a managed fallback risk, supporting Risk 4/5.' },
    'short-puerto-rico': { risk: 'Exact protected one-stop inventory removes the flight-publication gate. June tropical weather remains flexible rather than critical, supporting Risk 4/5.' },
    'canary-islands': { risk: 'Exact PIT–Tenerife and Tenerife–La Palma inventory is selling. Two airports, two car rentals and island weather still create moderate disruption exposure, supporting Risk 3/5.' },
    'madeira-crete': { risk: 'Exact PIT–FNC and protected LIS–ATH–CHQ inventory is selling. The deliberate Lisbon buffer contains Madeira wind risk, supporting Risk 3/5.' },
    'madeira-sicily': { ease: 'Four lodging sleeps, three base moves, two cars and a now-confirmed one-stop Lisbon–Palermo transfer are very high deterministic load, but the itinerary remains executable; Ease 2/5 is more consistent than 1/5.' },
    'slovenia-adriatic': { risk: 'Exact protected PIT–LJU inventory is selling. The remaining uncertainty is the Vršič Pass and ordinary road/weather disruption, supporting Risk 4/5.' },
    'iceland-ischia-cilento': { risk: 'The assumed June 10 Icelandair nonstop/stopover construction is not sold. Because the air stack must be re-dated or rebuilt before the trip works, Risk falls to 1/5.' }
    ,'greece-ionian': { ease: 'The corrected route adds a third lodging sleep and a 4½–5 hour Lefkada-to-Athens transfer before the buffer night, so Ease falls from 4/5 to 3/5.' }
  };
  for (const [axis, text] of Object.entries(rationales[slug] || {})) a[axis].rationale = text;
}

function applyTextUpdates(value, pairs) {
  for (const [from, to] of pairs) value = replaceAll(value, from, to);
  return value;
}

function applyStructuralFlightUpdates(slug, value) {
  if (slug !== 'greece-ionian') return value;
  return value
    .replace(/\{"n":"Preveza \/ Aktion Airport \(PVK\)","lat":38\.9254,"lng":20\.7653,"r":"transfer","g":"https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=38\.9254,20\.7653","t":"flight"\}/g, '{"n":"Athens International Airport (ATH)","lat":37.9364,"lng":23.9445,"r":"transfer","g":"https://www.google.com/maps/search/?api=1&query=37.9364,23.9445","t":"flight"}')
    .replace(/Lefkada for <b>5 nights<\/b>/g, 'Lefkada for <b>4 nights</b>')
    .replace(/(<h4>One long final transfer<\/h4><p>)[\s\S]*?(<\/p>)/, '$1The corrected route trades one Lefkada night for a 4½–5 hour drive and Athens-airport buffer before the sold Jun 22 return.$2')
    .replace(/<section id="why-this-trip"[\s\S]*?<\/section>/, `<section id="why-this-trip" class="divider">
    <div class="section-label"><p class="eyebrow">Why This Trip</p><h2>Warm water with an honest Athens exit</h2><p>The island half remains the board’s easiest warm-swim plan; the current flight schedule adds one deliberate mainland transfer.</p></div>
    <div class="plan-grid">
      <div class="pcard"><h4><span class="dot"></span>Warmest, calmest swim</h4><p>The Ionian in June is a clear ~73°F with sheltered family coves at Assos, Antisamos, Lassi, and Milos, plus the electric-blue cave lakes at Melissani and Zakynthos.</p></div>
      <div class="pcard"><h4><span class="dot"></span>Simple island sequence</h4><p>Land at Kefalonia, use one short direct ferry to Lefkada, and keep separate easy rental cars. The islands themselves still have low daily friction.</p></div>
      <div class="pcard"><h4><span class="dot"></span>The honest trade</h4><p>No exact-date Preveza itinerary exists. Leave Lefkada on Jun 21, drive 4½–5 hours to ATH, and sleep by the airport before the sold Jun 22 return.</p></div>
    </div>
  </section>`)
    .replace(/<section id="stays"[\s\S]*?<\/section>/, `<section id="stays" class="divider">
    <div class="section-label"><p class="eyebrow">Where We Stay</p><h2>Two island bases plus one airport buffer</h2><p>Seven Kefalonia nights and four Lefkada nights preserve the island core; the final night moves to Athens airport so the family can use a real flight home.</p></div>
    <div class="plan-grid">
      <div class="pcard"><h4><span class="dot"></span>Kefalonia · 7 nights</h4><div class="prow"><span>Base</span><strong>Sami / Agia Efimia</strong></div><div class="prow"><span>Why</span><strong>Central to Melissani, Myrtos, Fiskardo, Antisamos, and the Zakynthos boat</strong></div></div>
      <div class="pcard"><h4><span class="dot"></span>Lefkada (Nydri) · 4 nights</h4><div class="prow"><span>Why</span><strong>West beaches, Agios Nikitas, and Nydri boat days</strong></div><div class="prow"><span>Arrive</span><strong>Fiskardo → Vasiliki ferry, then ~40 minutes</strong></div></div>
      <div class="pcard"><h4><span class="dot"></span>Athens airport · 1 night</h4><div class="prow"><span>When</span><strong>Mon Jun 21</strong></div><div class="prow"><span>Plan</span><strong>Drive from Lefkada, return the car, sleep near ATH</strong></div><div class="prow"><span>Why</span><strong>Protect the sold Jun 22 return and reject unavailable PVK</strong></div></div>
    </div>
  </section>`)
    .replace(/<div class="hc watch"><span class="hc-tag">Watch<\/span><h4>The Preveza departure is unavailable<\/h4>[\s\S]*?<\/div>/, '<div class="hc watch"><span class="hc-tag">Corrected</span><h4>Exit through Athens, not Preveza</h4><p>No exact-date PVK itinerary is sold. Leave Lefkada on Jun 21, drive to ATH, and protect the sold Jun 22 return with the airport-buffer night.</p></div>')
    .replace(/<div class="hc watch"><span class="hc-tag">Watch<\/span><h4>(?:Proxies until 2027 loads|Only the non-flight details remain provisional)<\/h4>[\s\S]*?<\/div>/, '<div class="hc watch"><span class="hc-tag">Watch</span><h4>Only the non-flight details remain provisional</h4><p>Refresh the protected multi-city checkout and reconfirm the ferry timetable plus Navagio/Egremni access before purchase.</p></div>')
    .replace(/buffer against the thin Preveza leg/g, 'buffer after the sold Athens return')
    .replace(/<div class="tipcard"><h4>Flights<\/h4>[\s\S]*?<\/div>/, '<div class="tipcard"><h4>Flights</h4><p class="sub">Kefalonia in, Athens out</p><ul><li class="flag"><b>Arrive at Kefalonia (EFL)</b> on the sold exact-date routing.</li><li class="flag"><b>Reject Preveza (PVK)</b> — no itinerary exists for the return date.</li><li><b>Sleep by ATH on Jun 21</b> before the protected flight home.</li></ul></div>')
    .replace(/<div class="pcard"><h4><span class="dot"><\/span>Logistics signal<\/h4>[\s\S]*?<\/div>/, '<div class="pcard"><h4><span class="dot"></span>Logistics signal</h4><p>Kefalonia’s Athens feed and the direct Fiskardo–Vasiliki ferry keep the island half simple. The final 4½–5 hour drive and ATH buffer replace the unavailable Preveza departure.</p></div>');
}

function recursiveStrings(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((item) => recursiveStrings(item, fn));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, recursiveStrings(item, fn)]));
  return value;
}

function replaceAll(value, from, to) {
  if (!from || from === to) return value;
  return value.split(from).join(to);
}

function weightedTotal(scorecard) {
  return Object.entries(scorecard.axes).reduce((sum, [axis, score]) => sum + score * (scorecard.weightDefaults[axis] || 0), 0);
}

function unique(values) { return [...new Set(values)]; }
function escapeHtml(value) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
