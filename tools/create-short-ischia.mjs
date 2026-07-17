#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as H from '../.agents/skills/travel-itinerary/scripts/itinerary-helpers.mjs';
import { shortCalendar } from './lib/short-calendar.mjs';
import { PHOTOS } from './lib/short-ischia-photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'short-ischia';
const T = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/short-acadia/main.json'), 'utf8'));
const { headBody: templateHeadBody, navToMain } = H.sliceChrome(T.parts[0].html, 'Ischia + the Bay of Naples — June 2027');
const headBody = templateHeadBody.replace(
  '../../assets/img/short-acadia/google_frenchman_bay_sunrise_04.jpg',
  `../../assets/img/${slug}/${PHOTOS.heroUrl}`,
);
const outDir = path.join(root, 'src/_data', slug);
fs.mkdirSync(outDir, { recursive: true });

const A = `../../assets/img/${slug}`;
const srcLabel = (p) => (p.sourcePage || '').includes('flickr') ? 'Flickr source' : (p.sourcePage || '').includes('negombo') ? 'Operator gallery' : (p.sourcePage || '').includes('pexels') ? 'Pexels License' : 'Unsplash License';
const image = (p) => ({
  href: `${A}/${p.file}`, src: `${A}/${p.file}`, alt: p.alt, captionTitle: p.captionTitle,
  credit: `${p.photographer} · ${srcLabel(p)}`,
});

const f = H.fact;
const link = (url, label, note) => `<a href="${url}" target="_blank" rel="noreferrer"><b>${label}</b></a> — ${note}`;

const spots = {
  swim: H.mkSpot({
    name: 'Poseidon Gardens + Citara Bay',
    tags: ['poseidon', 'citara'],
    carouselId: 'is-swim',
    images: PHOTOS.swim.map(image),
    lat: 40.7096,
    lng: 13.8555,
    cost: 'Giardini Poseidon’s published 2026 tariff is <b>€50 adult full day, €45 from 1 p.m., ages 4–11 half price</b> — about €175 for this family. The one rule that shapes the day: <b>under-12s are not allowed in the thermal pools</b>, only the three seawater pools and the beach. The 13-year-old gets all 22 pools; the 8-year-old still gets a full beach-and-pool day.',
    climateLabel: 'Citara Bay, June',
    climate: '<b>Sea about 74°F by mid-June and the island’s driest stretch of the year.</b> Poseidon’s pools are graded 61–104°F, so a cool morning or a windy afternoon never cancels the day.',
    save: 'The afternoon ticket (from 1 p.m.) saves €20 for the family and still leaves four hours of pools; Citara’s public beach next door is free all week.',
    splurge: 'One full-day Poseidon visit is the trip’s signature purchase. Negombo on San Montano bay is the second thermal park if the family wants a rematch — note its child pricing runs by height, and both kids likely pay as adults there.',
    restos: [
      link('https://wanderlog.com/list/geoCategory/33785/best-family-restaurants-in-forio', 'La Tinaia', 'family trattoria in Forio center; plain pasta on request and a famous lemon spaghetti'),
      link('https://wanderlog.com/list/geoCategory/1860478/best-pizza-spots-in-forio', 'Pizzeria Di Meglio', 'frequently called the island’s best pizza, near San Francesco beach'),
      link('https://wanderlog.com/list/geoCategory/33785/best-family-restaurants-in-forio', 'La Ruota', 'beachfront on Chiaia — swim, then eat without moving the towels'),
    ],
    alts: [
      '<b>Negombo (San Montano)</b> if Poseidon reads as too big — smaller, greener, on the island’s calmest swimming bay.',
      '<b>San Montano bay on its own</b> — shallow, warm and the best pure kid-swim on Ischia, no park ticket required.',
    ],
    blogs: [
      { label: 'Giardini Poseidon · official prices', href: 'https://giardiniposeidonterme.com/en/preiseinfo-en/' },
      { label: 'Negombo · visitor info', href: 'https://negombo.it/en/useful-info/' },
    ],
  }),
  island: H.mkSpot({
    name: 'Castello Aragonese + Ischia Ponte',
    tags: ['castello', 'ischiaponte'],
    carouselId: 'is-island',
    images: PHOTOS.island.map(image),
    lat: 40.7316,
    lng: 13.9633,
    cost: 'Castello Aragonese is <b>€12 adult, €6 ages 10–18, free under 10</b> — €36 for this family, elevator included, and the ticket allows same-day re-entry. The stone causeway, the ramparts and the olive-terrace views are most of the visit; budget a gelato-paced half day.',
    climateLabel: 'Ischia Ponte, June',
    climate: '<b>June averages 79°F with about seven brief rain days for the whole month.</b> The castle is an open-air site with real sun exposure — do it before lunch and leave the afternoon for the beach below.',
    save: 'The castle’s €36 family total is the cheapest headline attraction on this board; the beach on either side of the causeway is free.',
    splurge: 'Dinner in Ischia Ponte with the castle floodlit — the malcbawn boat-and-castle shot in this carousel is a normal Tuesday here.',
    restos: [
      link('https://www.castelloaragoneseischia.com/en/plan-your-visit', 'Il Terrazzo (in the castle)', 'café-terrace inside the walls for mid-visit bribes'),
      link('https://wanderlog.com/list/geoCategory/33785/best-family-restaurants-in-forio', 'Ischia Ponte trattorias', 'plain pasta and pizza line the causeway street'),
      link('https://www.ischiareview.com/buses-in-ischia.html', 'CS/CD bus back to Forio', 'runs until late; no driving, no parking'),
    ],
    alts: [
      '<b>Sant’Angelo</b> — the car-free pastel village on the south coast, saved here for Saturday.',
      '<b>Mount Epomeo’s summit walk</b> from Fontana (about 2–2.5 hours round trip) if the family wants one real hike with a 360° bay view.',
    ],
    blogs: [
      { label: 'Castello Aragonese · plan your visit', href: 'https://www.castelloaragoneseischia.com/en/plan-your-visit' },
      { label: 'Ischia Review · buses', href: 'https://www.ischiareview.com/buses-in-ischia.html' },
    ],
  }),
  bay: H.mkSpot({
    name: 'Procida day trip',
    tags: ['procida', 'corricella'],
    carouselId: 'is-bay',
    images: PHOTOS.bay.map(image),
    lat: 40.7620,
    lng: 14.0169,
    cost: 'Ischia → Procida ferries run 15–30 minutes, up to a dozen sailings a day, roughly <b>€13–19 per person round trip</b> from Casamicciola — call it €60–80 for four. Marina Corricella and the Terra Murata viewpoint are free; lunch on the harbor is the day’s real spend.',
    climateLabel: 'Procida, June',
    climate: '<b>Same forgiving June as Ischia — around 79°F and dry.</b> The crossing is short enough that a windy-morning postponement costs nothing; swap it with any Forio beach day.',
    save: 'Procida is a half-day done cheaply: ferry, one climb to Terra Murata, granita, ferry home.',
    splurge: 'A long harbor-front lunch at Corricella facing the pastel amphitheater — the single most photographed table setting in the Bay of Naples.',
    restos: [
      link('https://www.directferries.com/ischia_procida_ferry.htm', 'Corricella harbor front', 'fried fish cones, pasta and pizza at the water’s edge'),
      link('https://www.directferries.com/ischia_procida_ferry.htm', 'Via Roma near the port', 'gelato and granita for the walk back'),
      link('https://www.directferries.com/ischia_procida_ferry.htm', 'Ferry-day picnic', 'Forio bakeries pack focaccia for the crossing'),
    ],
    alts: [
      '<b>Pompeii instead?</b> Honest answer: from Ischia it burns 3–4 hours of ferry + train each way. It only fits this trip as a departure-day add-on with a late flight, or by adding a Naples overnight. Tickets are €20 (Express) with a timed-entry cap — and note US-citizen kids pay; the EU under-18 free rule does not apply.',
      '<b>Capri is deliberately skipped</b> — the family has already been; Procida is the new island.',
    ],
    blogs: [
      { label: 'Direct Ferries · Ischia–Procida', href: 'https://www.directferries.com/ischia_procida_ferry.htm' },
      { label: 'Pompeii · official tickets', href: 'https://pompeiisites.org/en/visiting-info/timetables-and-tickets/' },
    ],
  }),
};

const days = [
  H.day('day0', 'c1', '1', 'Sat · Jun 12', 'Pittsburgh → Newark → overnight to Naples', 'One connection, then sleep over the Atlantic', 'Est. $120 · airport meals', [f('Flight', 'PIT → EWR → NAP · United, single ticket'), f('Sleep', 'In the air')], 'United’s Naples nonstop leaves Newark in the late afternoon or evening, so a midday PIT → EWR hop connects with slack. Mid-June is United’s one-flight-a-day window on this route — a misconnect means 24 hours, not three days, but build the buffer anyway.', [], '&#9992;&#65038; Overnight flight day'),
  H.day('day1', 'c1', '2', 'Sun · Jun 13', 'Naples → hydrofoil → Forio', 'Land, cross the bay, unpack once', 'Est. $220 · Alibus, hydrofoil, first dinner', [f('Transfer', 'Alibus €5pp → Molo Beverello → Alilauro hydrofoil ~50 min'), f('Sleep', 'Forio · night 1 of 7')], 'The Alibus runs every 15–30 minutes from the terminal to the port, and Alilauro serves Forio direct — no Naples logistics beyond one bus. If the sea is up, the slow car ferry from Porta di Massa almost never cancels; take it and lose an hour, not the day.', []),
  H.day('day2', 'c1', '3', 'Mon · Jun 14', 'Forio + Chiaia beach', 'A deliberately soft first full day', 'Est. $150 · beach, gelato, groceries', [f('Sleep', 'Forio · night 2 of 7'), f('Water', 'Sea about 74°F — warm enough to stay in')], 'Walk Forio, claim a stretch of Chiaia or San Francesco beach, and let the jet lag drain. The Soccorso church two blocks from town is the sunset ritual all week. Nothing today is allowed to have a ticket.', []),
  H.day('day3', 'c1', '4', 'Tue · Jun 15', 'Giardini Poseidon thermal day', 'The signature Ischia purchase', 'Est. $260 · park tickets + lunch', [f('Sleep', 'Forio · night 3 of 7'), f('Rule', 'Under-12s: seawater pools + beach, not thermal pools')], 'Twenty-two pools terraced above Citara Bay, graded from 61°F to 104°F. Split coverage: one parent rotates the hot pools with the 13-year-old, the other holds the seawater pools and beach with the 8-year-old, swap after lunch.', [spots.swim]),
  H.day('day4', 'c1', '5', 'Wed · Jun 16', 'Castello Aragonese + Ischia Ponte', 'The island’s icon, then its beach', 'Est. $180 · castle + dinner out', [f('Sleep', 'Forio · night 4 of 7'), f('Tickets', '€12 / €6 ages 10–18 / free under 10')], 'Bus across the island, walk the causeway, take the elevator up and the ramparts slowly. The beach beside the causeway fills the afternoon, and a floodlit-castle dinner in Ischia Ponte is the night to stay out late.', [spots.island]),
  H.day('day5', 'c1', '6', 'Thu · Jun 17', 'Procida day trip', 'Pastel Corricella, twenty minutes away', 'Est. $200 · ferries + harbor lunch', [f('Sleep', 'Forio · night 5 of 7'), f('Ferry', '15–30 min · ~€13–19pp round trip')], 'The Bay’s most photogenic harbor is one short crossing from Casamicciola. Climb to Terra Murata for the postcard angle, eat on the Corricella front, and be back on Ischia for an evening swim.', [spots.bay]),
  H.day('day6', 'c1', '7', 'Fri · Jun 18 · Juneteenth observed', 'Giro dell’isola boat day', 'Sea caves and swim stops by boat', 'Est. $340 · boat tour + dinner', [f('Sleep', 'Forio · night 6 of 7'), f('PTO', 'Observed holiday; employer policy')], 'The classic full-day boat circle of the island — sea caves, cliff villages from the water, and swim stops the buses can’t reach — runs about €73 per person with lunch. In the evening, Sorgeto’s free hot-spring cove is the volcanic party trick: thermal water bubbling straight into the sea.', []),
  H.day('day7', 'c1', '8', 'Sat · Jun 19', 'Sant’Angelo + Maronti', 'The car-free south coast, then pack', 'Est. $180 · buses, beach, last dinner', [f('Sleep', 'Forio · night 7 of 7'), f('Flex', 'This day absorbs any weather postponement')], 'Sant’Angelo is the whitewashed, car-free village on the sand isthmus; Maronti is the island’s longest beach, with fumaroles steaming in the sand. This is also the week’s pressure valve — anything the wind cancelled lands here.', []),
  H.travelDay('day8', '9', 'Sun · Jun 20', 'Forio → Naples → Pittsburgh', 'Boat, plane, home the same day', 'Est. $250 · hydrofoil, Alibus, airport meals', [f('Route', 'Hydrofoil → NAP → EWR → PIT · same-day arrival'), f('Sleep', 'Home')], 'Take an early hydrofoil with real slack — Sunday-morning boats toward Naples are the ones that sell out, so book this leg ahead. United’s Naples departure lands you in Pittsburgh the same evening, four clear days before the Jun 24–26 commitment.'),
];

const previewImages = PHOTOS.hero.map((p, i) => [`${A}/${p.file}`, `Highlight ${i + 1}`, p.captionTitle, p.heroCaption || p.alt]);
const preview = H.preview({
  kicker: 'Pittsburgh family of 4 · June 2027',
  h1Main: 'Ischia',
  h1Sub: 'Thermal island + the Bay of Naples',
  lead: 'Seven nights on the Bay of Naples’ volcanic spa island — 74°F sea, terraced thermal pools, a 15th-century castle on its own rock, and pastel Procida twenty minutes away. One base, no rental car, no driving.',
  stats: [['7', 'hotel nights'], ['1', 'home base'], ['$9.2k–12.7k', 'planning total'], ['4', 'PTO days']],
  split: [[50, 'Water + coast', 's1'], [30, 'Town + food', 's2'], [20, 'Nature', 's3']],
  images: previewImages,
});

const overview = `<section id="overview">${H.sectionLabel('The Week at a Glance', 'One island base, zero driving', 'Forio for seven nights. Buses, boats and one hydrofoil do all the moving — there is no rental car, no ZTL camera and no parking on this trip.')}<div class="overview"><div class="ocard"><h4>7 hotel nights</h4><p>All in Forio. The only base move is the day you fly home.</p></div><div class="ocard"><h4>Jun 12–20</h4><p>Overnight flight out, same-day return; four PTO days with Juneteenth observed.</p></div><div class="ocard"><h4>$9.2k–12.7k</h4><p>Airfare and the thermal-pool hotel drive the range.</p></div><div class="ocard"><h4>74°F sea + thermal</h4><p>The warmest dependable swim on the short-escape board.</p></div></div></section>`;

const why = `<section id="why-this-trip" class="divider">${H.sectionLabel('Why Ischia Works — and What It Costs You', 'The warmest water on this board, honestly priced', 'This trip wins on swimming and loses on the arrival chain. Both are real: the sea is warmer than anything else here, and getting to it takes a plane, a bus, a boat and a taxi.')}<div class="tips-grid">${H.tipcard('The water', 'sea + volcano together', ['About 74°F by mid-June — warm enough that nobody negotiates about getting in.', 'Poseidon’s 22 pools run 61–104°F regardless of weather.', 'Sorgeto’s free hot spring bubbles straight into the sea.'])}${H.tipcard('The ease on the ground', 'no car all week', ['One base, seven nights, zero repacking.', 'Buses and boats reach every day of this plan.', 'No ZTL cameras, no parking, no international driving permit.'])}${H.tipcard('The honest costs', 'the arrival chain is real', ['Plane → Alibus → hydrofoil → taxi, with a 6-hour time change.', 'Mid-June is United’s one-flight-a-day window to Naples.', 'Poseidon bans under-12s from the thermal pools — the 8-year-old gets beach and seawater pools.'])}</div></section>`;

const stays = `<section id="stays" class="divider">${H.sectionLabel('Where to Stay', 'Forio, west coast, 7 nights', 'Forio has the direct hydrofoil from Naples, the deepest bench of family thermal hotels, Citara Bay on its doorstep and the island’s sunsets.')}<div class="plan-grid">${H.card('Forio · 7 nights', `${H.prow('Dates', 'Jun 13–20')}${H.prow('Planning band', '$270–$415/night')}${H.prow('Candidates', 'Le Canne Family Resort · Sorriso Thermae · Parco Smeraldo (Maronti)')}${H.prow('Why Forio', 'Direct Alilauro boat + Poseidon next door')}<div class="tip">Most Ischia four-stars include their own thermal pools — the hotel pool here is a real thermal amenity, not a consolation. Half-board deals are common and worth pricing for picky-eater certainty.</div>`)}${H.card('Why not elsewhere', `${H.prow('Sant’Angelo', 'Prettiest, but car-free + remote: €50 taxi from the port')}${H.prow('Ischia Porto', 'Most connected, least resort-like')}${H.prow('Capri/Sorrento', 'Visited before; wrong island for this trip')}<div class="tip">Sant’Angelo and Maronti stay in the plan as bus-and-boat day trips — you get their beaches without their logistics.</div>`)}</div></section>`;

const calendar = shortCalendar({
  eyebrow: 'At a Glance',
  title: 'Your Ischia Week',
  intro: 'Only the boat tour and Poseidon are date-flexible purchases; everything else is a bus ride that can move with the weather.',
  ariaLabel: 'Ischia trip calendar June 12 through June 20 2027',
  days: [
    { date: [6, 12], blocks: [{ act: 'car', start: 10, end: 12, label: 'PIT → EWR' }, { act: 'air', start: 17, end: 22, label: 'Overnight to Naples' }] },
    { date: [6, 13], blocks: [{ act: 'air', start: 6, end: 11, label: 'Land NAP' }, { act: 'water', start: 12, end: 14, label: 'Hydrofoil to Forio' }, { act: 'rest', start: 15, end: 19, label: 'Check in + beach' }] },
    { date: [6, 14], blocks: [{ act: 'town', start: 9, end: 12, label: 'Forio' }, { act: 'water', start: 13, end: 18, label: 'Chiaia beach' }] },
    { date: [6, 15], blocks: [{ act: 'water', start: 9, end: 17, label: 'Poseidon thermal day' }, { act: 'rest', start: 18, end: 20, label: 'Soccorso sunset' }] },
    { date: [6, 16], blocks: [{ act: 'town', start: 9, end: 13, label: 'Castello Aragonese' }, { act: 'water', start: 14, end: 18, label: 'Ischia Ponte beach' }] },
    { date: [6, 17], blocks: [{ act: 'water', start: 9, end: 11, label: 'Ferry to Procida' }, { act: 'town', start: 11, end: 16, label: 'Corricella + Terra Murata' }, { act: 'water', start: 17, end: 19, label: 'Evening swim' }] },
    { date: [6, 18], blocks: [{ act: 'water', start: 9, end: 16, label: 'Boat: giro dell’isola' }, { act: 'water', start: 18, end: 20, label: 'Sorgeto hot spring' }] },
    { date: [6, 19], blocks: [{ act: 'town', start: 9, end: 13, label: 'Sant’Angelo' }, { act: 'water', start: 13, end: 17, label: 'Maronti beach' }, { act: 'rest', start: 18, end: 20, label: 'Pack' }] },
    { date: [6, 20], blocks: [{ act: 'water', start: 7, end: 9, label: 'Hydrofoil to Naples' }, { act: 'air', start: 11, end: 21, label: 'Fly home' }] },
  ],
});

const mapColors = { forio: '#c25a3a', thermal: '#1f6f78', ponte: '#3a6ea5', procida: '#7d5ba6', naples: '#3f7d4e' };
const mapPoints = [
  H.point('Naples International Airport', 40.8860, 14.2908, 'naples', 'flight'),
  H.point('Molo Beverello ferry terminal', 40.8375, 14.2520, 'naples', 'town'),
  H.point('Forio base', 40.7381, 13.8578, 'forio', 'hotel'),
  H.point('Chiesa del Soccorso', 40.7397, 13.8531, 'forio', 'view'),
  H.point('Chiaia beach', 40.7444, 13.8600, 'forio', 'view'),
  H.point('Giardini Poseidon Terme', 40.7096, 13.8555, 'thermal', 'view'),
  H.point('Citara beach', 40.7135, 13.8541, 'thermal', 'view'),
  H.point('Negombo · San Montano', 40.7576, 13.8830, 'thermal', 'view'),
  H.point('Sorgeto hot-spring cove', 40.7003, 13.8531, 'thermal', 'view'),
  H.point('Castello Aragonese', 40.7316, 13.9633, 'ponte', 'town'),
  H.point('Sant’Angelo village', 40.6959, 13.8933, 'ponte', 'town'),
  H.point('Maronti beach', 40.7003, 13.9107, 'ponte', 'view'),
  H.point('Casamicciola ferry port', 40.7477, 13.9074, 'ponte', 'town'),
  H.point('Marina Corricella · Procida', 40.7620, 14.0169, 'procida', 'town'),
  H.point('Terra Murata viewpoint', 40.7593, 14.0225, 'procida', 'view'),
];

const map = `<section id="map" class="divider">${H.sectionLabel('Where You Will Go', 'One island, one bay, no car', 'Everything moves by bus and boat. Forio anchors the west coast; the castle and the ferries sit on the east side, twenty minutes across.')}<div class="tripmap-wrap"><div class="mapbtns"><button data-region="forio"><span class="sw" style="background:${mapColors.forio}"></span>Forio</button><button data-region="thermal"><span class="sw" style="background:${mapColors.thermal}"></span>Thermal + swim</button><button data-region="ponte"><span class="sw" style="background:${mapColors.ponte}"></span>East + south</button><button data-region="procida"><span class="sw" style="background:${mapColors.procida}"></span>Procida</button><button data-region="naples"><span class="sw" style="background:${mapColors.naples}"></span>Naples gateway</button><button data-region="all">Whole trip</button></div><div class="mapstage"><button class="layers-btn" aria-expanded="false" aria-label="Map layers"><span class="lbi">▧</span> Layers</button><div class="layers-panel" hidden><div class="layers-top"><strong>Map layers</strong><button class="layers-x" aria-label="Close">×</button></div><div class="layers-acts"><button data-all="1">Select all</button><span class="dot">·</span><button data-all="0">Deselect all</button></div><div class="layers-list"></div></div><div id="tripmap"></div></div></div></section>`;

const airGround = `${map}<section id="air-travel" class="divider">${H.sectionLabel('Getting to Ischia', 'One connection, then a boat', 'United’s Newark–Naples nonstop is the clean single-ticket play from Pittsburgh. Mid-June is its one-flight-a-day window, so the EWR connection deserves real slack.')}<div class="plan-grid">${H.card('Preferred outbound', `${H.prow('Date', 'Sat Jun 12 · overnight')}${H.prow('Route', 'PIT → EWR → NAP · United, single ticket')}${H.prow('Family air band', '$4,400–$5,900 with bags/seats')}${H.prow('Backup', 'Delta JFK–NAP daily · ITA via FCO')}<div class="tip">United has ~6 PIT–EWR flights a day, so book the connection with hours of slack, not minutes. A misconnect in the 1x-daily window costs 24 hours.</div>`)}${H.card('The bay crossing', `${H.prow('Airport → port', 'Alibus · €5pp · every 15–30 min')}${H.prow('Hydrofoil', 'Alilauro Beverello → Forio direct · ~50 min')}${H.prow('Current fares', '€23.90–24.10 adult · €15.90 child 2–12 · bags €3.50')}${H.prow('Rough sea?', 'Slow car ferry from Porta di Massa almost never cancels')}<div class="tip">Book the Sunday-morning return boat ahead — those are the sailings that sell out. Everything else can be bought the day before.</div>`)}</div></section><section id="getting-around" class="divider">${H.sectionLabel('Getting Around', 'Buses, boats and two taxis', 'Ischia is the rare Italian trip where skipping the rental car makes the week easier, not harder. The CS/CD circle buses reach every base, beach and trailhead in this plan.')}<div class="plan-grid">${H.card('EAV island buses', `${H.prow('Single ride', '€1.70 pre-purchased · €2.20 onboard')}${H.prow('Day pass', '€5.10 · weekly €14.50')}${H.prow('Family week', 'About €58 in passes for four')}${H.prow('Coverage', 'Forio, Poseidon, Sant’Angelo, Maronti, the castle')}<div class="tip">June buses run late and often. The only taxi rides worth planning are the two hotel transfers with luggage (€15 minimum, ~€32 port → Forio).</div>`)}${H.card('Why no rental car', `${H.prow('Car ferry', '~€60 each way to bring one')}${H.prow('June parking', 'Tight everywhere, absent in Sant’Angelo')}${H.prow('ZTL risk', 'None on this plan — no driving at all')}<div class="tip">Water taxis from Ischia Ponte and Sant’Angelo are often cheaper than land taxis for coastal hops, and more fun.</div>`)}</div></section>`;

const healthTiming = `<section id="health-check" class="divider">${H.sectionLabel('What Could Change', 'Wind, one flight a day, and a pool rule', 'The plan is bus-simple, but three specific things deserve watching. None of them is a reason to skip the trip; all three are reasons to build slack.')}<div class="hc-grid"><div class="hc actnow"><span class="hc-tag">Act now</span><h4>The EWR connection is the trip’s pinch point</h4><p>Mid-June is United’s one-flight-a-day window to Naples. Book PIT–EWR with hours of slack, and know the Delta JFK–NAP daily exists as a same-day rescue.</p></div><div class="hc watch"><span class="hc-tag">Watch</span><h4>Hydrofoils cancel in chop; car ferries don’t</h4><p>Alilauro suspends around 2-meter waves. The mitigation is built in: the slow ferry from Porta di Massa keeps sailing, and the return morning has a spare boat’s worth of buffer.</p></div><div class="hc watch"><span class="hc-tag">Watch</span><h4>Poseidon’s under-12 thermal rule</h4><p>The 8-year-old gets the beach and three seawater pools, not the hot pools. Plan the split-parent rotation, or pick Negombo where the rule runs by height instead.</p></div><div class="hc good"><span class="hc-tag">Good</span><h4>June is Ischia’s driest, calmest month</h4><p>About 79°F, seven brief rain days, and Festa della Repubblica crowds gone two weeks before arrival. Sea state problems are isolated storm events, not a pattern.</p></div></div></section><section id="timing" class="divider">${H.sectionLabel('Why These Dates', 'Juneteenth saves a PTO day', 'Saturday out, Sunday home, four PTO days, and back four clear days before the family’s Jun 24–26 Pittsburgh commitment.')}<div class="timing-compare"><div class="tcard best"><span class="tlabel">Preferred</span><h4>Jun 12–20</h4><div class="trow"><span>Hotel nights</span><b>7</b></div><div class="trow"><span>PTO days</span><b>4</b></div><div class="trow"><span>Sea temp</span><b>~74°F</b></div></div><div class="tcard now"><span class="tlabel">Do not force</span><h4>Late June for warmer water</h4><div class="trow"><span>Sea temp gain</span><b>+1–2°F</b></div><div class="trow"><span>Cost</span><b>United’s 2x-daily starts ~Jun 23, but hotel rates climb</b></div></div></div><div class="verdict-box"><b>Verdict:</b> mid-June already clears the warm-water bar that defines this trip. Waiting a week buys a marginal sea-temperature gain and costs the Juneteenth PTO trick plus the pre-peak hotel pricing.</div></section>`;

const budgetRows = [
  ['Flights — PIT→EWR→NAP round trip, bags and seats', '$4,400–$5,900'],
  ['7 hotel nights — Forio thermal-pool family room', '$1,900–$2,900'],
  ['Ferries, Alibus, island buses and taxis', '$450–$600'],
  ['Food + groceries', '$1,300–$1,700'],
  ['Poseidon, castle, boat tour, Procida ferries', '$480–$620'],
  ['Contingency', '$700–$950'],
];

const budgetTips = `<section id="budget" class="divider">${H.sectionLabel('Planning Budget', 'Airfare decides the band', 'Everything on the ground is cheap for a resort island — buses cost euros and the castle costs less than an American museum. The flights and the thermal-pool hotel are the two lines that matter.')} ${H.table(['Line item', 'Family estimate'], budgetRows)}<div class="twocol"><div class="listcard save-list"><h4>Keep it near the floor</h4><ul><li>Book United the day 2027 inventory loads — June is the route’s priciest month.</li><li>Half-board hotel deals cover the picky-eater dinners cheaply.</li><li>Poseidon’s afternoon ticket saves €20; Sorgeto and San Montano are free.</li><li>Weekly bus passes, not taxis: €58 covers the family’s whole week.</li></ul></div><div class="listcard splurge-list"><h4>Worth paying for</h4><ul><li>The full-day giro dell’isola boat — the island’s best day, unreachable by bus.</li><li>A hotel whose thermal pools you’d actually use every evening.</li><li>The floodlit-castle dinner in Ischia Ponte.</li></ul></div></div></section><section id="totals" class="divider">${H.sectionLabel('Trip Total', 'Auditable family planning band', 'Six line items, no hidden food or contingency. The 13-year-old pays adult prices at Poseidon and on most ferries; the 8-year-old rides and swims at child rates.')} ${H.table(['Category', 'Planning range'], [...budgetRows, ['Grand total — family of 4', '$9,230–$12,670']], 'budget-tbl grand')}<p class="rate-note">Planning proxy reviewed July 16, 2026 against current-season operator pricing (Alilauro, Poseidon, Castello Aragonese, EAV, Alibus) and current-year June fare signals. The ceiling exceeds the $12,000 short-trip target; replace airfare and room bands with live June 2027 quotes before booking.</p></section><section id="tips" class="divider">${H.sectionLabel('Book in This Order', 'The flight, then the room, then nothing for months', 'Almost everything on Ischia is bought the day before. Only the transatlantic seat and the June hotel inventory reward early action.')}<div class="tips-order"><ol><li>Book PIT–EWR–NAP when United loads June 2027<span>· the route’s priciest month</span></li><li>Hold the Forio thermal hotel<span>· family rooms are the scarce unit</span></li><li>Book the Sunday-morning return hydrofoil<span>· the one boat that sells out</span></li><li>Reserve the giro dell’isola boat a few days out<span>· weather-flexible</span></li><li>Buy Poseidon tickets on the chosen morning<span>· no timed entry</span></li></ol></div></section>`;

const socialBalanceStatus = `<section id="social" class="divider">${H.sectionLabel('Family Fit', 'Warm water carries everyone', 'This is the rare trip where the 8-year-old’s perfect day and the teenager’s perfect day are the same day, just in different pools.')}<div class="tips-grid">${H.tipcard('For the 13-year-old', 'real range, real freedom', ['All 22 Poseidon pools, including the 104°F ones.', 'Cliff-jumping spots on the boat day and Sorgeto’s natural hot spring.', 'Procida’s photo game is genuinely strong.'])}${H.tipcard('For the 8-year-old', 'shallow, warm, sandy', ['San Montano and Maronti are shallow-entry, 74°F beaches.', 'The castle has an elevator, ramparts and a gelato terrace.', 'Boats replace car time — every transfer is part of the fun.'])}${H.tipcard('For picky eaters', 'the pizza homeland', ['Pizzeria Di Meglio and La Tinaia cover plain pizza and pasta in Forio.', 'Half-board hotel dining guarantees a known dinner.', 'Corricella’s harbor fries fish in paper cones — chicken-nugget adjacent.'])}</div></section><section id="balance" class="divider">${H.sectionLabel('Trip Balance', 'The most water-forward week on the board', 'Half of this trip happens in, on or beside warm water. Towns fill the evenings; the one hike is optional.')}<div class="bar"><i style="width:50%;background:var(--c1)"></i><i style="width:30%;background:var(--c2)"></i><i style="width:20%;background:var(--c3)"></i></div><div class="balance"><div class="bcard k1"><div class="pct">50%</div><h4>Water + coast</h4><p>Thermal parks, four beaches, a boat day, a hot-spring cove and two ferry crossings.</p></div><div class="bcard k2"><div class="pct">30%</div><h4>Town + food</h4><p>Forio evenings, Ischia Ponte, Sant’Angelo and Corricella.</p></div><div class="bcard k3"><div class="pct">20%</div><h4>Nature</h4><p>Volcanic coastline from the water, fumaroles in the sand, optional Epomeo summit.</p></div></div></section><section id="status" class="divider">${H.sectionLabel('What Is Decided', 'And what waits for live inventory', 'The one-base, no-car shape is settled. The money is the open question.')}<div class="status"><div class="scol settled"><h4>Decided</h4><div class="row"><b>Base</b><span>Forio, all seven nights.</span></div><div class="row"><b>Dates</b><span>Jun 12–20, 2027.</span></div><div class="row"><b>No rental car</b><span>Buses + boats cover the entire plan.</span></div><div class="row"><b>Procida, not Capri</b><span>Capri is already on the visited list; Procida is new.</span></div><div class="row"><b>Pompeii is optional</b><span>Departure-day add-on or Naples overnight only — not a mid-week ferry marathon.</span></div></div><div class="scol open"><h4>Choose later</h4><div class="row"><b>Airfare</b><span>United 2027 June fares — the band’s biggest swing.</span></div><div class="row"><b>The hotel</b><span>Le Canne vs Sorriso Thermae vs Parco Smeraldo.</span></div><div class="row"><b>Second thermal park</b><span>Negombo rematch vs a free San Montano day.</span></div></div></div></section>`;

const scorecard = {
  displayName: 'Ischia + Procida',
  blurb: 'Warmest swim on the short board: 74°F sea plus thermal parks, no car',
  axes: { budget: 4, weather: 4, swim: 5, variety: 4, ease: 3, food: 5, risk: 3, nights: 1, novelty: 4, pto: 5 },
  weightDefaults: { budget: 2, weather: 1, swim: 1, variety: 1, ease: 1, food: 1, risk: 1, nights: 1, novelty: 1, pto: 0 },
  budget: { floorUsd: 9230, ceilUsd: 12670, targetUsd: 12000, preferredMaxUsd: 15000 },
  pto: { days: 4, nights: 7 },
  facets: { continent: 'europe', maxConnections: 1, swimTempF: [73, 75], heatedSwimTempF: [82, 104], swimType: 'warm-sea-plus-thermal', noPassport: false, singleTicket: true, hasSwim: true },
  totalBaked: 37,
};
H.assertBaked(scorecard);

const main = {
  recommended: true,
  tripCategory: 'short',
  slug,
  lang: 'en',
  title: 'Ischia + the Bay of Naples — June 2027',
  countries: ['italy'],
  packingTags: ['beach', 'heat'],
  overrides: {
    packing: [
      '<b>Water shoes for everyone:</b> Sorgeto’s hot-spring cove and several coves are pebble-and-rock entries.',
      '<b>Reef-safe sunscreen and swim shirts:</b> the schedule averages four-plus water hours a day at 79°F.',
      '<b>One packable tote per person:</b> beach-and-bus days work out of totes, not the big bags, which never leave Forio.',
      '<b>Motion-sickness tabs:</b> one hydrofoil each way plus two ferry days — cheap insurance for the 8-year-old.',
      '<b>Passports + ETIAS printouts:</b> Italy is Schengen; check ETIAS status before travel.',
    ],
  },
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  itinerary: {
    className: 'divider',
    labelHtml: H.sectionLabel('Day by Day', 'Seven nights, one base, no car', 'Forio holds every night. Boats and buses carry the days, and Saturday absorbs whatever the wind postpones.'),
    daysClass: 'days',
    days,
  },
  parts: [
    { t: 'raw', html: `${headBody}${preview}${navToMain}${overview}${why}${stays}${calendar}` },
    { t: 'itinerary' },
    { t: 'raw', html: airGround },
    { t: 'entry' },
    { t: 'raw', html: healthTiming },
    { t: 'todo' },
    { t: 'raw', html: budgetTips },
    { t: 'packing' },
    { t: 'raw', html: socialBalanceStatus },
    ...T.parts.slice(9, 12),
    { t: 'raw', html: H.mapScripts(T.parts[12].html, mapPoints, mapColors) },
  ],
  preDepartureTodos: {
    labelHtml: '<p class="eyebrow">Before You Go</p><h2>Protect the flight and the Sunday boat</h2><p>Those two legs are the only scarce inventory on the whole trip.</p>',
    blocks: [
      { when: 'As early as inventory allows', tone: 'hot', title: 'Lock the airfare', items: ['<b>Book PIT–EWR–NAP on one United ticket</b> the day June 2027 loads — June is this route’s most expensive month.', '<b>Choose a PIT–EWR connection with hours of slack.</b> Mid-June is the one-flight-a-day window; a misconnect costs 24 hours.'] },
      { when: 'After flights', tone: 'hot', title: 'Hold the Forio hotel', items: ['<b>Price Le Canne, Sorriso Thermae and Parco Smeraldo</b> for a 4-person family room with half board.', '<b>Confirm the hotel’s own thermal pools</b> — they are the evening amenity that makes the week.'] },
      { when: 'A few weeks out', tone: 'watch', title: 'Boats and parks', items: ['<b>Book the Sunday-morning return hydrofoil</b> — the one sailing that sells out.', '<b>Reserve the giro dell’isola boat day</b> once the forecast firms up.', '<b>Recheck Poseidon’s 2027 prices and the under-12 thermal rule</b> before promising the kids anything.'] },
      { when: 'Final week', tone: 'done', title: 'Let the wind set the order', items: ['<b>Swap Procida, the boat day and beach days freely</b> — every ticket here is day-of or day-before.', '<b>Check ETIAS status for all four passports.</b>'] },
    ],
    callout: '<b>Ready now:</b> one-base route, dates, and an itemized budget. <b>Not ready to book:</b> exact 2027 flights, live room quotes, and 2027 park and ferry tariffs.',
  },
  scorecard,
};

for (const part of main.parts) {
  if (part.html?.includes('<footer>')) {
    part.html = part.html.replace(/<footer>[\s\S]*?<\/footer>/, '<footer><p>Ischia + Bay of Naples family itinerary for June 2027. Exact flights, rooms, ferry and park tariffs require fresh verification before booking. Maps via Google &amp; OpenStreetMap.</p></footer>');
  }
}
fs.writeFileSync(path.join(outDir, 'main.json'), `${JSON.stringify(main, null, 2)}\n`);

const axes = {
  budget: { score: 4, rationale: 'The six-category family estimate reconciles exactly to $9,230–$12,670. The whole band sits below $13,000 but the ceiling exceeds the $12,000 target, so this scores 4 rather than 5, matching the Alaska precedent. Ground costs are cheap; the transatlantic June fare drives the range.', confidence: 'medium', evidence: ['budget-band'] },
  weather: { score: 4, rationale: 'Ischia’s June normals run about 79°F/59°F with roughly seven brief rain days and one of the driest stretches of its year. Heat is moderate rather than punishing at this latitude in mid-June, and no monsoon-style washout pattern exists; wind is the only weather variable that touches the plan, via ferries.', confidence: 'medium', evidence: ['climate-proxy'] },
  swim: { score: 5, rationale: 'The sea reaches about 74°F by mid-June — the warmest dependable open water on the short-escape board — and the island adds 22 graded thermal pools at Poseidon (61–104°F), Negombo, the free Sorgeto hot-spring cove, and shallow kid beaches at San Montano and Maronti. Water is scheduled on seven of nine days.', confidence: 'high', evidence: ['swim-conditions'] },
  variety: { score: 4, rationale: 'Distinct modes fill the week — thermal-park day, a 15th-century island castle, a pastel-island ferry day trip, a full-day boat circle with sea caves, four different beaches and an optional volcano-rim hike. It stops short of 5 because the modes are all coastal-leisure variants; there is no true wilderness or high-culture anchor.', confidence: 'high', evidence: ['itinerary-structure'] },
  ease: { score: 3, rationale: 'One base, no rental car, no ZTL exposure and single-ticket air are genuinely easy. But the arrival chain is plane → Alibus → hydrofoil → taxi with a six-hour time change, mid-June sits in United’s one-flight-a-day Naples window, and every mainland connection depends on a boat. That chain holds it below the fly-and-drive one-base trips.', confidence: 'high', evidence: ['operational-load'] },
  food: { score: 5, rationale: 'Campania is the pizza homeland: Pizzeria Di Meglio and La Tinaia cover plain pizza and pasta in Forio, half-board hotel dining guarantees known dinners, and every harbor front serves fried fish, fries and plain pasta. Adult upside is real (coniglio all’ischitana, Procida lemons). Exact 2027 menus remain a recheck.', confidence: 'medium', evidence: ['family-food-coverage'] },
  risk: { score: 3, rationale: 'Hydrofoils suspend in about 2-meter waves and mid-June is a one-flight-a-day window, so the connection and the crossing are genuine exposure. Mitigations are structural: car ferries keep sailing when hydrofoils stop, Delta’s JFK–NAP daily is a same-day air rescue, the Saturday flex day absorbs postponements, and no activity is prepaid more than days ahead.', confidence: 'medium', evidence: ['route-readiness'] },
  nights: { score: 1, rationale: 'Seven hotel nights derive 1/5 under the shared rubric for trips of eight nights or fewer.', confidence: 'high', evidence: ['trip-window'] },
  novelty: { score: 4, rationale: 'Ischia, Procida and the thermal-park mode are all new, but the route runs through Naples and the family has already visited Naples, Capri and Positano — a visited gateway under the shared rubric, scoring 4. Capri is deliberately excluded from the plan for the same reason.', confidence: 'high', evidence: ['visited-overlap'] },
  pto: { score: 5, rationale: 'Four PTO days receive 5/5; Juneteenth falls on Saturday June 19, 2027 and is observed Friday June 18, protecting a workday subject to employer policy. Return lands Sunday Jun 20, four clear days before the Jun 24–26 Pittsburgh commitment.', confidence: 'high', evidence: ['trip-window'] },
};

const efact = (id, category, proxyStatus, confidence, sourceRefs, value, sourceLocators, expiresAt = null, claimType = proxyStatus === 'derived' ? 'derived' : proxyStatus === 'confirmed' ? 'confirmed' : 'proxy') => ({ id, category, proxyStatus, confidence, sourceRefs, value, verifiedAt: '2026-07-16', expiresAt, sourceLocators, claimType });

const evidence = {
  schemaVersion: 1,
  slug,
  reviewedAt: '2026-07-16',
  overallConfidence: 'medium',
  axes,
  facts: [
    efact('budget-band', 'budget', 'current-proxy', 'medium', ['internal-itinerary', 'giardini-poseidon-prices', 'alilauro-naples-ischia-2026'], { lowUsd: 9230, expectedUsd: null, highUsd: 12670, targetUsd: 12000, preferredMaxUsd: 15000, distribution: 'planning-band', lineItemCount: 6, arithmetic: '4400–5900 + 1900–2900 + 450–600 + 1300–1700 + 480–620 + 700–950 = 9230–12670', exceedsShortTripTarget: true }, { 'internal-itinerary': 'short-ischia/main.json #budget and #totals; six itemized categories reconcile to the displayed total', 'giardini-poseidon-prices': 'Official 2026 tariff €50 adult / €45 afternoon / ages 4–11 half price supports the activities line', 'alilauro-naples-ischia-2026': 'Current hydrofoil fares €23.90–24.10 adult, €15.90 child, €3.50 per qualifying bag support the ferries-and-transfers line' }, '2026-12-31'),
    efact('trip-window', 'dates', 'confirmed', 'high', ['decision-profile'], { depart: '2027-06-12', return: '2027-06-20', hotelNights: 7, ptoDays: 4, juneteenthObserved: '2027-06-18', pittsburghBlackoutRespected: true }, { 'decision-profile': 'decisionProfile.json tripWindows.short-ischia [2027-06-12, 2027-06-20]; returns four days before the Jun 24–26 Pittsburgh commitment' }),
    efact('climate-proxy', 'climate', 'current-proxy', 'medium', ['weather-atlas-ischia'], { score: 4, ischiaJuneHighLowF: [79, 59], ischiaJuneRainDays: 7, ischiaJuneRainInches: 1.1, forecast: false, weatherRisks: ['wind-driven ferry suspensions', 'brief showers'] }, { 'weather-atlas-ischia': 'Ischia June normals: about 26°C/15°C (79°F/59°F) with ~27 mm of rain across ~7 trace-rain days — among the island’s driest months' }, '2027-04-01'),
    efact('swim-conditions', 'swim', 'current-proxy', 'high', ['seatemperature-ischia', 'giardini-poseidon-prices'], { score: 5, temperatureF: [73, 75], heatedSwimTemperatureF: [82, 104], swimType: 'warm-sea-plus-thermal', hasSwim: true, scheduledSwimDays: 7, primarySwim: 'Citara, Chiaia, San Montano and Maronti beaches plus Poseidon/Negombo thermal parks and the free Sorgeto hot-spring cove', under12ThermalRule: 'Poseidon bars under-12s from thermal pools; seawater pools and beach remain available' }, { 'seatemperature-ischia': 'Ischia June average sea temperature ~23.3°C (74°F), rising toward 25°C late month', 'giardini-poseidon-prices': 'Official page documents 22 pools graded 16–40°C (61–104°F) and the under-12 thermal-pool restriction' }, '2027-05-15'),
    efact('itinerary-structure', 'itinerary', 'derived', 'high', ['internal-itinerary', 'castello-aragonese-visit'], { score: 4, hotelNights: 7, lodgingBases: 1, baseNames: ['Forio'], scheduledModes: ['thermal park', 'island castle', 'island-hop ferry day', 'full-day boat circle', 'beach days', 'hot-spring cove'], capriExcluded: true, capriReason: 'already on the family visited-place list; Procida is the new island', pompeiiOptional: true, pompeiiReason: 'a mid-week Ischia→Pompeii round trip burns 3–4 hours each way; it fits only as a departure-day add-on or with a Naples overnight' }, { 'internal-itinerary': 'short-ischia/main.json itinerary.days: seven Forio nights, zero base moves, water scheduled on seven of nine days', 'castello-aragonese-visit': 'Official visitor page: €12 adult / €6 ages 10–18 / free under 10, elevator included, open daily 9:00–sunset' }),
    efact('operational-load', 'logistics', 'derived', 'high', ['internal-itinerary', 'anm-alibus', 'ischiareview-transport'], { easeScore: 3, maxConnections: 1, singleTicket: true, nonstopExists: false, lodgingBases: 1, baseMoves: 0, rentalCars: 0, timeZoneShift: 6, arrivalChainLegs: 4, hydrofoilMinutes: 50, airHoursPlanningEstimate: 22, groundHoursPlanningEstimate: 6, oneFlightPerDayWindow: true }, { 'internal-itinerary': 'short-ischia/main.json day0/day8: PIT→EWR→NAP single ticket, Alibus + ~50-min hydrofoil each way, no rental car', 'anm-alibus': 'Official ANM Alibus page: €5 per person, every 15–30 minutes, airport → Molo Beverello', 'ischiareview-transport': 'EAV bus fares €1.70 single / €5.10 day / €14.50 weekly; CS/CD circle lines reach Forio, Citara, Sant’Angelo, Maronti and the castle' }, '2027-02-01'),
    efact('family-food-coverage', 'food', 'current-proxy', 'medium', ['internal-itinerary', 'ischia-family-dining'], { score: 5, plainFoodRequired: true, coveredBases: ['Forio', 'Ischia Ponte', 'Procida harbor'], fallbackTypes: ['pizza', 'pasta', 'fried fish cones', 'fries', 'half-board hotel dining', 'groceries'], halfBoardCommon: true, thirteenYearOldPricesAsAdult: true }, { 'internal-itinerary': 'short-ischia/main.json structured spots name La Tinaia, Pizzeria Di Meglio and La Ruota as plain-food anchors at the Forio base', 'ischia-family-dining': 'Curated Forio family-restaurant listings document La Tinaia (family trattoria) and Pizzeria Di Meglio (island’s best-regarded pizza) with plain pasta/pizza coverage' }, '2027-04-01'),
    efact('route-readiness', 'route', 'current-proxy', 'medium', ['internal-itinerary', 'united-ewr-nap-schedule', 'alilauro-naples-ischia-2026'], { status: 'current-proxy', singleTicket: true, maxConnections: 1, nonstopExists: false, outbound: 'PIT → EWR → NAP · United single ticket; EWR–NAP nonstop ~2x daily June 2026, historically 1x daily until ~Jun 23', return: 'NAP → EWR → PIT · same-day arrival', exact2027FlightsVerified: false, hydrofoilWeatherRisk: 'Alilauro suspends around 2 m waves; Porta di Massa car ferries almost never cancel Apr–Oct', deltaJfkNapBackup: true }, { 'internal-itinerary': 'short-ischia/main.json #air-travel marks all routings and fares as current proxies requiring 2027 verification', 'united-ewr-nap-schedule': 'Flight-schedule data shows United EWR–NAP ~14 weekly June 2026 on 767-300, seasonal May–Oct; second daily historically starts ~Jun 23', 'alilauro-naples-ischia-2026': 'Operator publishes June 15–Sept 15 2026 schedule with frequent daily Beverello–Forio/Ischia hydrofoils; 2027 times unpublished' }, '2026-12-31'),
    efact('visited-overlap', 'novelty', 'derived', 'high', ['decision-profile', 'scorecard-contract'], { score: 4, overlap: ['Naples (gateway)', 'Capri (excluded from plan)', 'Positano (not visited on this plan)'], newRegions: ['Ischia', 'Procida'] }, { 'decision-profile': 'Family visited-place list includes Naples, Capri and Positano; Ischia and Procida do not appear', 'scorecard-contract': 'tools/scorecard.manifest.json novelty rubric: mostly new with one visited gateway scores 4/5' }),
  ],
  metrics: {
    airHours: 22,
    groundHours: 6,
    timeZones: 6,
    baseMoves: 0,
    longestTransferHours: 2,
    highOutputDayStreak: 2,
    fallbackDays: 2,
    childActivityFit: { age13: 'fits', age8: 'fits' },
    lodgingComfort: {
      airConditioning: 'required in June and standard in Ischia four-stars',
      kitchen: 'optional; half-board dining replaces it here',
      laundry: 'preferred for seven beach nights',
      realBeds: 'required but unknown until property selection',
    },
    waterSafety: 'Sea about 74°F with shallow-entry family beaches at San Montano and Maronti; Sorgeto’s hot-spring cove has rock entries and locally very hot pockets — water shoes and supervision required. Poseidon bars under-12s from thermal pools.',
    crowdingPressure: 'Mid-June is busy but pre-peak; Festa della Repubblica (Wed Jun 2, 2027) surge ends well before arrival. Sunday-return hydrofoils to Naples sell out and should be booked ahead.',
    medicalAccess: 'Ischia has a hospital (Anna Rizzoli, Lacco Ameno); Naples carries full tertiary care one hydrofoil crossing away.',
    childActivityNotes: {
      age13: 'all 22 Poseidon pools, cliff-jump swim stops on the boat day, Sorgeto at night and Procida photo terrain',
      age8: 'shallow warm beaches, a castle with an elevator, boats as entertainment rather than transit',
    },
  },
  confidenceBasis: [
    'official operator tariffs from Giardini Poseidon, Castello Aragonese, Alilauro, ANM Alibus and EAV',
    'published June climate and sea-temperature normals for Ischia',
    'current United EWR–NAP schedule data and historical seasonal pattern',
    'one-base itinerary derivation',
    'no exact June 2027 schedule, fare or room quote exists for any line',
  ],
  evidenceBasis: 'Official operator and transit tariffs, published climate and sea-temperature normals, current-season ferry and flight schedules, and line-by-line derivation from the one-base itinerary. Exact June 2027 prices, flights and ferry times remain current-season proxies.',
};
fs.writeFileSync(path.join(outDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);

const variants = {
  schemaVersion: 1,
  slug,
  canonicalId: 'canonical',
  variants: [{
    id: 'canonical',
    label: 'Forio one-base · 7 nights',
    canonical: true,
    status: 'documented-needs-live-quotes',
    nights: 7,
    ptoDays: 4,
    budget: { lowUsd: 9230, expectedUsd: null, highUsd: 12670, distribution: 'planning-band', chanceUnderPreferredMax: null },
    removedExperiences: ['Capri (already visited by the family)', 'A dedicated Pompeii day, which requires a Naples overnight or a departure-day add-on'],
    notes: 'Fly Pittsburgh to Naples with one United connection, cross by Alibus and hydrofoil, and hold Forio for all seven nights with no rental car. Poseidon, the Castello Aragonese, Procida, the giro dell’isola boat day and the south-coast beaches all run on buses and boats.',
    confidence: 'medium',
    claimType: 'proxy',
    sourceRefs: ['internal-itinerary'],
    sourceLocators: { 'internal-itinerary': 'short-ischia/main.json Jun 12–20 route, seven Forio hotel nights, four PTO days and itemized $9,230–$12,670 total' },
  }],
  alternateStatus: 'not-needed',
  alternateNotes: 'Seven nights is the short-trip ceiling and one base is the premise. Adding a Naples or Sorrento leg would reintroduce the base move and the packing churn this band exists to avoid; Pompeii stays documented as an optional departure-day add-on instead.',
};
fs.writeFileSync(path.join(outDir, 'variants.json'), `${JSON.stringify(variants, null, 2)}\n`);
console.log(`wrote src/_data/${slug}/{main,evidence,variants}.json — ${PHOTOS.hero.length} hero + ${PHOTOS.island.length + PHOTOS.swim.length + PHOTOS.bay.length} carousel placements`);
