#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as H from '../.agents/skills/travel-itinerary/scripts/itinerary-helpers.mjs';
import { shortCalendar } from './lib/short-calendar.mjs';
import { PHOTOS } from './lib/short-alaska-photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'short-alaska';
const T = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/short-acadia/main.json'), 'utf8'));
const { headBody: templateHeadBody, navToMain } = H.sliceChrome(T.parts[0].html, 'Alaska: Kenai Fjords + Girdwood — June 2027');
const headBody = templateHeadBody.replace(
  '../../assets/img/short-acadia/google_frenchman_bay_sunrise_04.jpg',
  `../../assets/img/${slug}/${PHOTOS.heroUrl}`,
);
const outDir = path.join(root, 'src/_data', slug);
const assetDir = path.join(root, 'assets/img', slug);
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(assetDir, { recursive: true });

const A = `../../assets/img/${slug}`;
const cap = (file) => file.replace(/^google_/, '').replace(/_\d+\.jpg$/, '').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const image = (p) => ({
  href: `${A}/${p.file}`, src: `${A}/${p.file}`, alt: p.alt, captionTitle: p.captionTitle || cap(p.file),
  credit: `${p.photographer} · Google Images source`,
});
const photoObject = (p) => ({
  file: p.file, alt: p.alt, captionTitle: p.captionTitle || cap(p.file),
  credit: `${p.photographer} · Google Images source`, sourcePage: p.sourcePage, discoveredVia: 'Google Images',
});

const fjordImages = PHOTOS.fjords.map(image);
const sewardImages = PHOTOS.seward.map(image);
const armImages = PHOTOS.arm.map(image);

const f = H.fact;
const link = (url, label, note) => `<a href="${url}" target="_blank" rel="noreferrer"><b>${label}</b></a> — ${note}`;

const spots = {
  fjords: H.mkSpot({
    name: 'Kenai Fjords day cruise',
    tags: ['kenaifjords', 'aialikbay'],
    carouselId: 'ak-fjords',
    images: fjordImages,
    lat: 59.8833,
    lng: -149.6500,
    cost: 'Major Marine’s current six-hour Kenai Fjords cruise lists $239 adult and $119.50 child (2–11), with a deli lunch included. The 13-year-old prices as an adult, so plan roughly $840–$950 for four once tax and the per-person harbor fee land. 2027 fares are not published.',
    climateLabel: 'Open water, June',
    climate: '<b>Dress for 45–55°F on deck even when Seward is sunny.</b> Wind and spray make the bow far colder than the forecast; the sea itself runs about 48–51°F. This is a wildlife-and-glacier boat, never a swim.',
    save: 'Take the six-hour Aialik Bay cruise rather than the 8.5-hour Northwestern Fjord, which the operator does not recommend under age 12.',
    splurge: 'Pay for the cruise on the settled-forecast day and treat it as the week’s one fixed anchor.',
    restos: [
      link('https://sewardbrewery.com/', 'Seward Brewing Company', 'pizza, burgers and pretzels with a bay view'),
      link('https://www.rayswaterfront.com/', 'Ray’s Waterfront', 'burgers and fish and chips on the harbor'),
      link('https://www.alaskasealife.org/', 'Alaska SeaLife Center', 'a warm indoor backup beside the harbor'),
    ],
    alts: [
      '<b>The four-hour Resurrection Bay cruise</b> if six hours on the water reads as too long for the 8-year-old.',
      '<b>Alaska SeaLife Center</b> when the boat cancels for weather — puffins and otters at eye level, indoors.',
    ],
    blogs: [
      { label: 'Major Marine · 6-hour cruise', href: 'https://majormarine.com/tour/6-hour-kenai-fjords-national-park-cruise/' },
      { label: 'NPS · Kenai Fjords fees', href: 'https://www.nps.gov/kefj/planyourvisit/fees.htm' },
    ],
  }),
  seward: H.mkSpot({
    name: 'Exit Glacier + Seward',
    tags: ['exitglacier', 'seward'],
    carouselId: 'ak-seward',
    images: sewardImages,
    lat: 60.1886,
    lng: -149.6303,
    cost: 'Kenai Fjords National Park charges <b>no entrance fee</b> and the ranger-led Exit Glacier walks are free. Budget only for the Alaska SeaLife Center (about $30 adult) if you use it.',
    climateLabel: 'Seward, June',
    climate: '<b>About 59°F high and 47°F low, and roughly 18.8 hours of daylight.</b> June is Seward’s driest month but still logs rain on about half its days — bring a shell and stop treating the forecast as a verdict.',
    save: 'Take the free ranger walk at 10 a.m., 2 p.m. or 4 p.m. and skip paid tours entirely on this day.',
    splurge: 'Add the SeaLife Center on a wet afternoon rather than forcing a long hike in rain.',
    restos: [
      link('https://sewardbrewery.com/', 'Seward Brewing Company', 'pizza and burgers; the reliable picky-eater pick'),
      link('https://www.rayswaterfront.com/', 'Ray’s Waterfront', 'burgers and chicken alongside the seafood'),
      link('https://sewardbrewery.com/', 'Groceries in town', 'Safeway on the Seward Highway for breakfasts and trail food'),
    ],
    alts: [
      '<b>The lower Exit Glacier loop</b> instead of the Harding Icefield Trail — that one is 8.2 miles with about 1,000 ft of gain per mile and holds snow into July.',
      '<b>Seward harbor and the SeaLife Center</b> when the glacier road is socked in.',
    ],
    blogs: [
      { label: 'NPS · Exit Glacier area', href: 'https://www.nps.gov/kefj/planyourvisit/exit-glacier-area.htm' },
      { label: 'NPS · Harding Icefield Trail', href: 'https://www.nps.gov/kefj/planyourvisit/harding_icefield_trail.htm' },
    ],
  }),
  arm: H.mkSpot({
    name: 'Turnagain Arm + Portage',
    tags: ['turnagainarm', 'portageglacier'],
    carouselId: 'ak-arm',
    images: armImages,
    lat: 60.8153,
    lng: -148.9989,
    cost: 'Alaska Wildlife Conservation Center lists $30 adult and $26 youth (4–12) — about $116 for four. The Portage Glacier cruise runs roughly $49–$69 per person. The Whittier tunnel toll is $13 per car round-trip and is only needed if you actually cross to Whittier.',
    climateLabel: 'Turnagain Arm, June',
    climate: '<b>Cooler and wetter than Seward — Girdwood averages about 53°F and 4.4 inches of June rain.</b> The Arm makes its own weather; the drive is worth doing even under cloud.',
    save: 'The Arm’s pullouts — Beluga Point, Bird Point — cost nothing and carry the scenery on their own.',
    splurge: 'The wildlife center is the trip’s most reliable bear-and-moose sighting, and it is worth the money precisely because it is not left to luck.',
    restos: [
      link('https://chairfive.com/', 'Chair 5', 'pizza and burgers made to order; the best picky-eater option in Girdwood'),
      link('https://jacksprat.net/', 'Jack Sprat', 'a real kids’ menu at the base of the tram'),
      link('https://www.alyeskaresort.com/', 'Hotel Alyeska', 'in-house options when nobody wants to drive again'),
    ],
    alts: [
      '<b>The bore tide at Beluga Point</b> — it runs about 2 hr 15 min after Anchorage low tide, so it is a tide-table plan, not a whim.',
      '<b>Byron Glacier’s short trail</b> if the Portage cruise is full or cancelled.',
    ],
    blogs: [
      { label: 'AWCC · visit info', href: 'https://alaskawildlife.org/visit/' },
      { label: 'Portage Glacier Cruises', href: 'https://portageglaciercruises.com/' },
      { label: 'Alaska DOT · Whittier tunnel tolls', href: 'https://dot.alaska.gov/creg/whittiertunnel/tolls.shtml' },
    ],
  }),
};

const days = [
  H.day('day0', 'c1', '1', 'Sat · Jun 12', 'Pittsburgh → Anchorage → Seward', 'One long travel day, then unpack once', 'Est. $320 · rental car, fuel and meals', [f('Flight', 'PIT → ANC · one stop, ~9–10 hr'), f('Sleep', 'Seward · night 1 of 7')], 'There is no PIT–ANC nonstop; every routing connects through Seattle, Chicago, Minneapolis or Denver. You also gain four hours going west, so a morning departure still lands with daylight to spare for the 2 hr 15 min drive to Seward.', [], '&#9992;&#65038; Flight + rental-car transfer day'),
  H.day('day1', 'c1', '2', 'Sun · Jun 13', 'Exit Glacier + Seward', 'A deliberately soft first day', 'Est. $180 · groceries, meals and optional SeaLife Center', [f('Sleep', 'Seward · night 2 of 7'), f('Park fee', 'None — Kenai Fjords charges no entrance fee')], 'Join a free ranger walk at Exit Glacier, then buy groceries and let everyone adjust to the time change and the light. Do not schedule anything that has to succeed.', [spots.seward]),
  H.day('day2', 'c1', '3', 'Mon · Jun 14', 'Kenai Fjords day cruise', 'The headline day — glaciers and whales', 'Est. $900 · cruise for four plus meals', [f('Sleep', 'Seward · night 3 of 7'), f('Water', 'Scenery only; sea about 48–51°F')], 'The six-hour Aialik Bay cruise is the trip’s anchor. Keep it movable within the Seward nights and spend it on the best-forecast morning.', [spots.fjords]),
  H.day('day3', 'c1', '4', 'Tue · Jun 15', 'Seward → Turnagain Arm → Girdwood', 'The drive is the attraction', 'Est. $260 · wildlife center, fuel and meals', [f('Sleep', 'Girdwood · night 4 of 7'), f('Drive', 'Seward → Girdwood · about 1 hr 45 min')], 'The only base move of the week. Break it with the Alaska Wildlife Conservation Center and the Turnagain Arm pullouts rather than driving it straight through.', [spots.arm], '&#128663; Base move — Seward to Girdwood'),
  H.day('day4', 'c1', '5', 'Wed · Jun 16', 'Alyeska tram + Girdwood', 'Big view, short day', 'Est. $230 · tram and meals', [f('Sleep', 'Girdwood · night 5 of 7'), f('Tram', '$55 gate / $50 online; youth $40')], 'Ride the tram for the Turnagain Arm view, walk the ridge if the weather allows, and keep the afternoon free. The hotel pool is capped at one reserved hour a day, so book it early if the kids want it.', []),
  H.day('day5', 'c1', '6', 'Thu · Jun 17', 'Portage Glacier + Byron', 'Icebergs and a short forest trail', 'Est. $290 · Portage cruise and meals', [f('Sleep', 'Girdwood · night 6 of 7'), f('Portage cruise', 'About $49–$69 per person')], 'Portage Lake still carries ice in June. The m/v Ptarmigan runs five daily departures; Byron Glacier’s short trail is the free alternative if it is booked out.', []),
  H.day('day6', 'c1', '7', 'Fri · Jun 18 · Juneteenth observed', 'Weather-reset day', 'The week’s pressure-release valve', 'Est. $220 · flexible', [f('Sleep', 'Girdwood · night 7 of 7'), f('PTO', 'Observed holiday; employer policy')], 'Keep this blank until the forecast settles. It can rescue the cruise, become an Anchorage day, a Virgin Creek Falls walk, laundry, or simply nothing at all.', []),
  H.travelDay('day7', '8', 'Sat · Jun 19', 'Girdwood → Anchorage → Pittsburgh', 'Drive once, fly home', 'Est. $190 · fuel and airport meals', [f('Route', 'Girdwood → ANC → PIT · one stop'), f('Sleep', 'Home')], 'Girdwood to ANC is about 45 minutes. You lose the four hours back, so an afternoon departure becomes a next-day arrival — check what the return red-eye actually costs the family before booking it.'),
];

const previewImages = PHOTOS.hero.map((p, i) => [`${A}/${p.file}`, `Highlight ${i + 1}`, p.captionTitle || cap(p.file), p.heroCaption]);
const preview = H.preview({
  kicker: 'Pittsburgh family of 4 · June 2027',
  h1Main: 'Alaska: Kenai Fjords',
  h1Sub: 'Seward + Girdwood',
  lead: 'Seven nights of tidewater glaciers, breaching humpbacks and nineteen-hour daylight from two Southcentral bases — the most scenery per night on this board, and the coldest water.',
  stats: [['7', 'hotel nights'], ['2', 'home bases'], ['$9.1k–12.6k', 'planning total'], ['4', 'PTO days']],
  // 15/25/60, not 10/25/65: the Kenai Fjords cruise is a full water day (1 of 8 ≈ 12.5%),
  // and a 10-flex segment is too narrow to hold the "Water + coast" label without overflowing
  // into the next one. Keep in sync with the #balance bar below.
  split: [[15, 'Water + coast', 's1'], [25, 'Town + food', 's2'], [60, 'Nature', 's3']],
  images: previewImages,
});

const overview = `<section id="overview">${H.sectionLabel('The Week at a Glance', 'Two bases, one road, no Denali', 'Seward for the fjords and Girdwood for the Arm. Denali is deliberately left out — it sits five hours north and would cost this week its ease.')}<div class="overview"><div class="ocard"><h4>7 hotel nights</h4><p>Seward 3, Girdwood 4, one base move.</p></div><div class="ocard"><h4>Jun 12–19</h4><p>Saturday to Saturday; four PTO days if Juneteenth is observed.</p></div><div class="ocard"><h4>$9.1k–12.6k</h4><p>The most expensive short escape here. Airfare and Girdwood lodging drive it.</p></div><div class="ocard"><h4>~18.8 hr daylight</h4><p>Near-solstice light is the reason to come in June.</p></div></div></section>`;

const why = `<section id="why-this-trip" class="divider">${H.sectionLabel('Why Alaska Works — and What It Costs You', 'Unmatched scenery, honestly priced', 'This trip wins on wildlife and glaciers and loses on money, water temperature and the connection. All three tradeoffs are real and none are hidden.')}<div class="tips-grid">${H.tipcard('Scenery without a road trip', 'two bases, 1 hr 45 min apart', ['Tidewater glaciers and humpbacks in one six-hour boat.', 'The Seward Highway is itself a headline drive.', 'A free ranger walk reaches a glacier face.'])}${H.tipcard('The light', 'about 18.8 hours of it', ['Dinner at 9 p.m. still feels like afternoon.', 'A cancelled morning can restart at 6 p.m.', 'Blackout curtains matter more than you expect.'])}${H.tipcard('The honest costs', 'no swimming, real money', ['Sea water runs about 48–51°F — this is not a swim trip.', 'The planning ceiling is $12.6k, the highest short escape here.', 'Every routing connects; there is no PIT–ANC nonstop.'])}</div></section>`;

const stays = `<section id="stays" class="divider">${H.sectionLabel('Where to Stay', 'Seward 3 nights, Girdwood 4', 'One base move all week. Girdwood is the expensive half and Hotel Alyeska effectively has no competitor at scale.')}<div class="plan-grid">${H.card('Seward · 3 nights', `${H.prow('Dates', 'Jun 12–15')}${H.prow('Planning band', '$330–$470/night')}${H.prow('Candidates', 'Harbor 360 · Seward Windsong Lodge')}${H.prow('Why', 'Harbor 360 sits beside the cruise dock')}<div class="tip">Harbor 360 has the town’s only pool and puts the Major Marine dock behind the building — worth it on cruise morning.</div>`)}${H.card('Girdwood · 4 nights', `${H.prow('Dates', 'Jun 15–19')}${H.prow('Planning band', '$436–$464/night')}${H.prow('Candidate', 'Hotel Alyeska')}${H.prow('Pool', 'Heated · 1 reserved hour per day')}<div class="tip">Alyeska dominates Girdwood lodging. Its heated pool is the only realistic “swim” on this trip, and the one-hour daily cap is a current policy worth reconfirming.</div>`)}</div></section>`;

const calendar = shortCalendar({
  eyebrow: 'At a Glance',
  title: 'Your Alaska Week',
  intro: 'The cruise is the only fixed anchor and it stays movable inside the Seward nights. Everything else bends to the forecast.',
  ariaLabel: 'Alaska trip calendar June 12 through June 19 2027',
  days: [
    { date: [6, 12], blocks: [{ act: 'air', start: 6, end: 14, label: 'Fly PIT–ANC' }, { act: 'car', start: 15, end: 18, label: 'Drive to Seward' }, { act: 'rest', start: 19, end: 21, label: 'Check in' }] },
    { date: [6, 13], blocks: [{ act: 'hike', start: 10, end: 13, label: 'Exit Glacier walk' }, { act: 'town', start: 14, end: 18, label: 'Seward + groceries' }] },
    { date: [6, 14], blocks: [{ act: 'water', start: 8, end: 15, label: 'Kenai Fjords cruise' }, { act: 'rest', start: 16, end: 19, label: 'Harbor + dinner' }] },
    { date: [6, 15], blocks: [{ act: 'car', start: 9, end: 12, label: 'Seward → Girdwood' }, { act: 'hike', start: 12, end: 15, label: 'Wildlife center' }, { act: 'town', start: 16, end: 19, label: 'Turnagain pullouts' }] },
    { date: [6, 16], blocks: [{ act: 'hike', start: 9, end: 13, label: 'Alyeska tram' }, { act: 'water', start: 15, end: 17, label: 'Pool hour' }] },
    { date: [6, 17], blocks: [{ act: 'car', start: 9, end: 11, label: 'Drive to Portage' }, { act: 'water', start: 11, end: 14, label: 'Portage cruise' }, { act: 'hike', start: 15, end: 17, label: 'Byron Glacier' }] },
    { date: [6, 18], blocks: [{ act: 'rest', start: 9, end: 15, label: 'Weather reset' }, { act: 'town', start: 16, end: 19, label: 'Anchorage option' }] },
    { date: [6, 19], blocks: [{ act: 'car', start: 8, end: 10, label: 'Drive to ANC' }, { act: 'air', start: 12, end: 20, label: 'Fly home' }] },
  ],
});

const mapColors = { seward: '#1f6f78', kenai: '#3f7d4e', turnagain: '#c25a3a', girdwood: '#3a6ea5', transfer: '#7d5ba6' };
const mapPoints = [
  H.point('Ted Stevens Anchorage International', 61.1743, -149.9962, 'transfer', 'flight'),
  H.point('Seward base', 60.1042, -149.4422, 'seward', 'hotel'),
  H.point('Seward Small Boat Harbor', 60.1211, -149.4419, 'seward', 'town'),
  H.point('Alaska SeaLife Center', 60.1044, -149.4436, 'seward', 'town'),
  H.point('Exit Glacier', 60.1886, -149.6303, 'kenai', 'hike'),
  H.point('Aialik Bay · cruise turnaround', 59.8833, -149.6500, 'kenai', 'view'),
  H.point('Alaska Wildlife Conservation Center', 60.8153, -148.9989, 'turnagain', 'view'),
  H.point('Beluga Point', 61.0119, -149.5528, 'turnagain', 'view'),
  H.point('Portage Glacier · Begich Boggs', 60.7847, -148.8397, 'turnagain', 'view'),
  H.point('Girdwood base · Hotel Alyeska', 60.9708, -149.0989, 'girdwood', 'hotel'),
  H.point('Alyeska aerial tram', 60.9633, -149.0961, 'girdwood', 'view'),
  H.point('Virgin Creek Falls', 60.9789, -149.1553, 'girdwood', 'hike'),
];

const map = `<section id="map" class="divider">${H.sectionLabel('Where You Will Go', 'One highway, two bases', 'Everything sits on the Seward Highway between Anchorage and Resurrection Bay. The fjords are reachable only by boat.')}<div class="tripmap-wrap"><div class="mapbtns"><button data-region="seward"><span class="sw" style="background:${mapColors.seward}"></span>Seward</button><button data-region="kenai"><span class="sw" style="background:${mapColors.kenai}"></span>Kenai Fjords</button><button data-region="turnagain"><span class="sw" style="background:${mapColors.turnagain}"></span>Turnagain Arm</button><button data-region="girdwood"><span class="sw" style="background:${mapColors.girdwood}"></span>Girdwood</button><button data-region="transfer"><span class="sw" style="background:${mapColors.transfer}"></span>Anchorage</button><button data-region="all">Whole trip</button></div><div class="mapstage"><button class="layers-btn" aria-expanded="false" aria-label="Map layers"><span class="lbi">▧</span> Layers</button><div class="layers-panel" hidden><div class="layers-top"><strong>Map layers</strong><button class="layers-x" aria-label="Close">×</button></div><div class="layers-acts"><button data-all="1">Select all</button><span class="dot">·</span><button data-all="0">Deselect all</button></div><div class="layers-list"></div></div><div id="tripmap"></div></div></div></section>`;

const airGround = `${map}<section id="air-travel" class="divider">${H.sectionLabel('Getting to Alaska', 'Every routing connects', 'There is no PIT–ANC nonstop. Plan a one-stop day of roughly 9–10 hours each way and treat the four-hour time change as part of the itinerary.')}<div class="plan-grid">${H.card('Preferred outbound', `${H.prow('Date', 'Sat Jun 12')}${H.prow('Route', 'PIT → SEA/ORD/MSP/DEN → ANC')}${H.prow('Family air band', '$2,000–$3,000 with bags/seats')}${H.prow('Time change', 'Gain 4 hours westbound')}<div class="tip">A morning departure lands with hours of daylight left — Alaska in June makes an evening arrival drive genuinely easy.</div>`)}${H.card('Return', `${H.prow('Date', 'Sat Jun 19')}${H.prow('Drive buffer', 'Girdwood → ANC · about 45 min')}${H.prow('Time change', 'Lose 4 hours eastbound')}<div class="tip">An afternoon ANC departure arrives in Pittsburgh the next day. Price that red-eye honestly before assuming it is the cheap option.</div>`)}</div></section><section id="getting-around" class="divider">${H.sectionLabel('Getting Around', 'One rental car for the whole week', 'The Seward Highway is the trip. A car beats the train here because the wildlife center, the Arm pullouts and Portage are all roadside stops the train passes by.')}<div class="plan-grid">${H.card('Rental car', `${H.prow('Pickup / return', 'ANC')}${H.prow('Planning band', '$700–$1,100 all-in')}${H.prow('ANC → Seward', 'About 2 hr 15 min')}${H.prow('Seward → Girdwood', 'About 1 hr 45 min')}<div class="tip">June is peak; Alaska rental rates surge harder than the lower 48. Book early — this line moves more than airfare does.</div>`)}${H.card('The train alternative', `${H.prow('Service', 'Alaska Railroad Coastal Classic')}${H.prow('Current fare', '$133 adult / $67 child one-way')}${H.prow('Duration', 'About 4 hours')}<div class="tip">Beautiful, and about $800 round-trip for four — but it strands you without a car in Seward and skips Portage entirely. Take it only if nobody wants to drive.</div>`)}</div></section>`;

const healthTiming = `<section id="health-check" class="divider">${H.sectionLabel('What Could Change', 'Weather, wildlife and one boat', 'The plan is simple, but a single cancelled cruise removes the headline. Everything here is about protecting that one day.')}<div class="hc-grid"><div class="hc actnow"><span class="hc-tag">Act now</span><h4>The cruise is a single point of failure</h4><p>Weather cancels Kenai Fjords sailings. Book it early in the Seward nights so a cancellation still has a spare day to land on.</p></div><div class="hc watch"><span class="hc-tag">Watch</span><h4>Bears are real, not decorative</h4><p>June brings mothers with cubs and the start of the salmon run. Stick to ranger-led walks and well-travelled trails; skip backcountry hiking as a family.</p></div><div class="hc watch"><span class="hc-tag">Watch</span><h4>Alyeska pool policy</h4><p>Current policy caps the pool at one reserved hour per day. Reconfirm — it is the only warm water on the trip.</p></div><div class="hc good"><span class="hc-tag">Good</span><h4>Daylight is a safety margin</h4><p>About 18.8 hours of it means a blown morning is fully recoverable in the evening.</p></div></div></section><section id="timing" class="divider">${H.sectionLabel('Why These Dates', 'Juneteenth saves a PTO day', 'Saturday to Saturday, four PTO days, and home well before the family’s Jun 24–26 Pittsburgh commitment.')}<div class="timing-compare"><div class="tcard best"><span class="tlabel">Preferred</span><h4>Jun 12–19</h4><div class="trow"><span>Hotel nights</span><b>7</b></div><div class="trow"><span>PTO days</span><b>4</b></div><div class="trow"><span>Daylight</span><b>~18.8 hr</b></div></div><div class="tcard now"><span class="tlabel">Do not force</span><h4>Later June for warmer water</h4><div class="trow"><span>Sea temp gain</span><b>Negligible</b></div><div class="trow"><span>Mosquitoes</span><b>Worse mid-June onward</b></div></div></div><div class="verdict-box"><b>Verdict:</b> early-to-mid June is the right window — it is Seward’s driest month, the light is near its maximum, and the mosquitoes have not yet peaked. Waiting will not warm the water.</div></section>`;

const budgetRows = [
  ['Flights — PIT→ANC one stop, bags and seats', '$2,000–$3,000'],
  ['7 hotel nights — Seward 3, Girdwood 4', '$2,750–$3,500'],
  ['Rental car + fuel', '$700–$1,100'],
  ['Food + groceries', '$1,500–$2,100'],
  ['Kenai Fjords cruise — 3 adult fares + 1 child', '$840–$950'],
  ['Tram, wildlife center, Portage, tunnel toll', '$450–$750'],
  ['Contingency', '$900–$1,200'],
];

const budgetTips = `<section id="budget" class="divider">${H.sectionLabel('Planning Budget', 'The most expensive short escape here', 'Alaska does not come in cheap. Airfare and Girdwood lodging are the two lines that decide whether this lands near $9k or near $12.6k.')} ${H.table(['Line item', 'Family estimate'], budgetRows)}<div class="twocol"><div class="listcard save-list"><h4>Keep it near the floor</h4><ul><li>Book airfare early — $500/person and $750/person are both realistic.</li><li>Take the six-hour cruise, not the 8.5-hour Northwestern Fjord.</li><li>Use the free ranger walks and the Arm pullouts; they carry the scenery.</li><li>A Girdwood condo with a kitchen would cut both lodging and food — at the cost of Alyeska’s pool.</li></ul></div><div class="listcard splurge-list"><h4>Worth paying for</h4><ul><li>The Kenai Fjords cruise. It is the trip.</li><li>The wildlife center — guaranteed bears and moose beat hoping.</li><li>A Seward room by the cruise dock.</li></ul></div></div></section><section id="totals" class="divider">${H.sectionLabel('Trip Total', 'Auditable family planning band', 'Seven line items, no hidden food or contingency. Note the 13-year-old prices as an adult on the cruise — child fares stop at 11.')} ${H.table(['Category', 'Planning range'], [...budgetRows, ['Grand total — family of 4', '$9,140–$12,600']], 'budget-tbl grand')}<p class="rate-note">Planning proxy reviewed July 15, 2026 against current-season operator pricing. The ceiling exceeds the $12,000 short-trip target; this is the one short escape where that gate binds. Replace airfare, room and car bands with live June 2027 quotes before booking.</p></section><section id="tips" class="divider">${H.sectionLabel('Book in This Order', 'Airfare and the boat first', 'Everything else in Southcentral Alaska has slack. These two do not.')}<div class="tips-order"><ol><li>Book PIT–ANC as early as inventory allows<span>· this line moves most</span></li><li>Hold the Kenai Fjords cruise on an early Seward day<span>· leaves a spare day for weather</span></li><li>Reserve the rental car<span>· June peak sells out</span></li><li>Hold Seward and Girdwood rooms<span>· Alyeska has no real competitor</span></li><li>Reconfirm the Alyeska pool policy<span>· only warm water on the trip</span></li></ol></div></section>`;

const socialBalanceStatus = `<section id="social" class="divider">${H.sectionLabel('Family Fit', 'Wildlife carries the 8-year-old', 'The cruise and the wildlife center do the heavy lifting; nothing here demands a hard hike.')}<div class="tips-grid">${H.tipcard('For the 13-year-old', 'genuinely big country', ['Calving glaciers and breaching humpbacks are not kid programming.', 'The tram ridge and Harding Icefield trail offer real effort if wanted.', 'Note: prices as an adult on the cruise.'])}${H.tipcard('For the 8-year-old', 'short wins, no forced miles', ['Six hours on a boat is the longest ask all week.', 'Guaranteed bears and moose at the wildlife center.', 'The free ranger walk reaches a glacier without a climb.'])}${H.tipcard('For picky eaters', 'pizza and burgers exist', ['Chair 5 in Girdwood makes pizza and burgers to order.', 'Seward Brewing covers pizza and burgers in town.', 'Grizzly’s Pizza sits inside the Anchorage terminal for travel days.'])}</div></section><section id="balance" class="divider">${H.sectionLabel('Trip Balance', 'Nature-dominant, and unapologetic about it', 'This is the least balanced trip on the board by design. There is almost no swimming and the towns are small.')}<div class="bar"><i style="width:15%;background:var(--c1)"></i><i style="width:25%;background:var(--c2)"></i><i style="width:60%;background:var(--c3)"></i></div><div class="balance"><div class="bcard k1"><div class="pct">15%</div><h4>Water + coast</h4><p>The cruise day, and all of it from a boat deck. The sea is 48–51°F.</p></div><div class="bcard k2"><div class="pct">25%</div><h4>Town + food</h4><p>Seward harbor and Girdwood village — both small.</p></div><div class="bcard k3"><div class="pct">60%</div><h4>Nature</h4><p>Glaciers, wildlife, the Arm drive and Girdwood’s rainforest.</p></div></div></section><section id="status" class="divider">${H.sectionLabel('What Is Decided', 'And what waits for live inventory', 'The two-base route is settled. The money is the open question.')}<div class="status"><div class="scol settled"><h4>Decided</h4><div class="row"><b>Bases</b><span>Seward 3 nights, Girdwood 4 nights.</span></div><div class="row"><b>Dates</b><span>Jun 12–19, 2027.</span></div><div class="row"><b>No Denali</b><span>Five hours north; it would cost the week its ease.</span></div><div class="row"><b>Not a swim trip</b><span>Sea 48–51°F. Accepted, not worked around.</span></div></div><div class="scol open"><h4>Choose later</h4><div class="row"><b>Airfare</b><span>The $1,000 swing between booking early and late.</span></div><div class="row"><b>Girdwood room</b><span>Hotel Alyeska versus a kitchen condo.</span></div><div class="row"><b>Cruise operator</b><span>Major Marine versus Kenai Fjords Tours.</span></div></div></div></section>`;

const scorecard = {
  displayName: 'Alaska: Kenai + Girdwood',
  blurb: 'Tidewater glaciers and 19-hour daylight from two Southcentral bases',
  axes: { budget: 4, weather: 3, swim: 1, variety: 4, ease: 3, food: 4, risk: 3, nights: 1, novelty: 5, pto: 5 },
  weightDefaults: { budget: 2, weather: 1, swim: 1, variety: 1, ease: 1, food: 1, risk: 1, nights: 1, novelty: 1, pto: 0 },
  budget: { floorUsd: 9140, ceilUsd: 12600, targetUsd: 12000, preferredMaxUsd: 15000 },
  pto: { days: 4, nights: 7 },
  facets: { continent: 'north-america', maxConnections: 1, swimTempF: [48, 51], noPassport: true, singleTicket: true, hasSwim: false },
  totalBaked: 32,
};
H.assertBaked(scorecard);

const main = {
  recommended: true,
  tripCategory: 'short',
  slug,
  lang: 'en',
  title: 'Alaska: Kenai Fjords + Girdwood — June 2027',
  countries: ['usa'],
  packingTags: ['domestic', 'hiking', 'rain'],
  overrides: {
    packing: [
      '<b>Real rain shell and warm mid-layer:</b> Girdwood averages 4.4 inches of June rain and a 53°F day.',
      '<b>Boat-deck layers:</b> hat and gloves are not overkill on a six-hour fjord cruise, even in sun.',
      '<b>Blackout eye masks:</b> about 18.8 hours of daylight means the sun is up past 11 p.m.',
      '<b>Insect repellent:</b> Girdwood’s valley gets moderate mosquitoes from mid-June; coastal Seward is much lighter.',
      '<b>Binoculars:</b> the wildlife is often distant — this is the one gear item that changes the cruise.',
    ],
  },
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  itinerary: {
    className: 'divider',
    labelHtml: H.sectionLabel('Day by Day', 'Seven nights, one base move', 'Seward carries the fjords, Girdwood carries the Arm, and one blank day absorbs whatever the weather does.'),
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
    labelHtml: '<p class="eyebrow">Before You Go</p><h2>Protect the airfare and the boat</h2><p>Those two lines decide both the budget and whether the trip has its headline day.</p>',
    blocks: [
      { when: 'As early as inventory allows', tone: 'hot', title: 'Lock the airfare', items: ['<b>Book PIT–ANC when the schedule loads.</b> The gap between an early and a late booking is roughly $1,000 for four.', '<b>Choose the connection deliberately</b> — SEA, ORD, MSP and DEN all work; the shortest total is about 8.5 hours.'] },
      { when: 'When the operator opens 2027', tone: 'hot', title: 'Hold the Kenai Fjords cruise', items: ['<b>Book the six-hour Aialik Bay sailing</b>, not the 8.5-hour Northwestern Fjord — the operator does not recommend that one under age 12.', '<b>Put it on an early Seward day</b> so a weather cancellation still has somewhere to go.'] },
      { when: 'After flights', tone: 'watch', title: 'Car and rooms', items: ['<b>Reserve the rental car early.</b> June is peak and Alaska rates surge harder than the lower 48.', '<b>Hold Seward and Girdwood rooms.</b> Hotel Alyeska has no competitor at scale in Girdwood.'] },
      { when: 'Final month', tone: 'watch', title: 'Reconfirm the details that move', items: ['<b>Alyeska’s pool policy</b> — currently one reserved hour per day.', '<b>Bore tide timing</b> at Beluga Point runs about 2 hr 15 min after Anchorage low tide; read the real tide table.', '<b>Winner Creek’s hand tram is permanently closed</b> — do not plan the day around it.'] },
      { when: 'Final week', tone: 'done', title: 'Let weather set the order', items: ['<b>Move the cruise</b> to the settled morning.', '<b>Check bear activity and trail status</b> with the Exit Glacier ranger station.'] },
    ],
    callout: '<b>Ready now:</b> two-base route, dates, and an itemized budget. <b>Not ready to book:</b> exact 2027 flights, live room and car quotes, and 2027 cruise fares.',
  },
  scorecard,
};

for (const part of main.parts) {
  if (part.html?.includes('<footer>')) {
    part.html = part.html.replace(/<footer>[\s\S]*?<\/footer>/, '<footer><p>Alaska: Kenai Fjords + Girdwood family itinerary for June 2027. Exact flights, rooms, cruise fares and reservations require fresh verification before booking. Maps via Google &amp; OpenStreetMap.</p></footer>');
  }
}
fs.writeFileSync(path.join(outDir, 'main.json'), `${JSON.stringify(main, null, 2)}\n`);

const photoPlan = {
  hero: PHOTOS.hero.map(photoObject),
  carousels: {
    'ak-fjords': PHOTOS.fjords.map(photoObject),
    'ak-seward': PHOTOS.seward.map(photoObject),
    'ak-arm': PHOTOS.arm.map(photoObject),
  },
  review: {
    candidateSheets: '/tmp/pics/short-alaska/<subject>/_sheet.jpg',
    reviewedAt: '2026-07-15',
    criteria: 'Two-pass visual review for true-horizontal framing, professional light, composition, watermark freedom, duplicate composition, and — specific to this trip — rejection of winter/shoulder-season frames that would misrepresent a June itinerary.',
  },
};
fs.writeFileSync(path.join(assetDir, '_photo-plan.json'), `${JSON.stringify(photoPlan, null, 2)}\n`);

const variants = {
  schemaVersion: 1,
  slug,
  canonicalId: 'canonical',
  variants: [{
    id: 'canonical',
    label: 'Seward + Girdwood · 7 nights',
    canonical: true,
    status: 'documented-needs-live-quotes',
    nights: 7,
    ptoDays: 4,
    budget: { lowUsd: 9140, expectedUsd: null, highUsd: 12600, distribution: 'planning-band', chanceUnderPreferredMax: null },
    removedExperiences: ['Denali National Park and Talkeetna flightseeing, which sit about five hours north of Girdwood'],
    notes: 'Fly Pittsburgh to Anchorage with one connection, rent one car, sleep three nights in Seward and four in Girdwood. The Kenai Fjords cruise, Exit Glacier, the Turnagain Arm drive, the wildlife center and Portage fit with a single base move and one blank weather day.',
    confidence: 'medium',
    claimType: 'proxy',
    sourceRefs: ['internal-itinerary'],
    sourceLocators: { 'internal-itinerary': 'short-alaska/main.json Jun 12–19 route, three Seward and four Girdwood hotel nights, four PTO days and itemized $9,140–$12,600 total' },
  }],
  alternateStatus: 'not-needed',
  alternateNotes: 'Seven nights is the short-trip ceiling. Adding Denali or Talkeetna would need a third base and roughly five hours of driving each way, which contradicts the ease-first premise of the short-escape band.',
};
fs.writeFileSync(path.join(outDir, 'variants.json'), `${JSON.stringify(variants, null, 2)}\n`);

const axes = {
  budget: { score: 4, rationale: 'The seven-category family estimate reconciles exactly to $9,140–$12,600. The entire band sits at or below $13,500 but the ceiling exceeds the $12,000 target, so this scores 4 rather than 5 — the only short escape where that gate binds. Cost never excludes the trip.', confidence: 'medium', evidence: ['budget-band'] },
  weather: { score: 3, rationale: 'June is Seward’s driest month at about 59°F/47°F, but it still logs rain on roughly half its days and Girdwood averages 4.4 inches and a 53°F day. Headline days remain workable with layers, and about 18.8 hours of daylight makes a rained-out morning fully recoverable.', confidence: 'medium', evidence: ['climate-proxy'] },
  swim: { score: 1, rationale: 'Resurrection Bay and the Kenai Fjords run about 48–51°F in June, which requires a full wetsuit and is not usable by children. The only warm water is Hotel Alyeska’s heated pool, currently capped at one reserved hour per day. There is no meaningful family swim.', confidence: 'high', evidence: ['swim-conditions'] },
  variety: { score: 4, rationale: 'The week schedules genuinely distinct modes — a tidewater-glacier and whale cruise, a free glacier walk, a wildlife center, an aerial tram, an iceberg lake and the Turnagain Arm drive. Water and town/culture are the light modes: Seward and Girdwood are both small and the sea is scenery only.', confidence: 'high', evidence: ['itinerary-structure'] },
  ease: { score: 3, rationale: 'One rental car, no passport, one base move and short roadside stops are strong. But every PIT–ANC routing connects, the travel day runs about 9–10 hours each way, and a four-hour time change applies in both directions. That connection and base move keep it below the one-base domestic trips.', confidence: 'high', evidence: ['operational-load'] },
  food: { score: 4, rationale: 'Chair 5 in Girdwood makes pizza and burgers to order, Seward Brewing covers pizza and burgers in town, and Grizzly’s Pizza sits inside the Anchorage terminal for travel days. Plain-food coverage exists at both bases. Exact 2027 menus, hours and prices remain a recheck.', confidence: 'medium', evidence: ['family-food-coverage'] },
  risk: { score: 3, rationale: 'Domestic travel and flexible days help, but the Kenai Fjords cruise is a genuine single point of failure that weather cancels, and every routing depends on one connection. June also brings bears with cubs and the start of the salmon run. Mitigations are real — a spare Seward day, ranger-led walks, an indoor SeaLife Center fallback — but the exposure is above a one-base domestic week.', confidence: 'medium', evidence: ['route-readiness'] },
  nights: { score: 1, rationale: 'Seven hotel nights derive 1/5 under the shared rubric for trips of eight nights or fewer.', confidence: 'high', evidence: ['trip-window'] },
  novelty: { score: 5, rationale: 'Alaska, the Kenai Peninsula and Southcentral do not overlap the documented visited-place list.', confidence: 'high', evidence: ['visited-overlap'] },
  pto: { score: 5, rationale: 'Four PTO days receive 5/5; Juneteenth falls on Saturday June 19, 2027 and is observed Friday June 18, protecting a workday subject to employer policy.', confidence: 'high', evidence: ['trip-window'] },
};

const efact = (id, category, proxyStatus, confidence, sourceRefs, value, sourceLocators, expiresAt = null, claimType = proxyStatus === 'derived' ? 'derived' : proxyStatus === 'confirmed' ? 'confirmed' : 'proxy') => ({ id, category, proxyStatus, confidence, sourceRefs, value, verifiedAt: '2026-07-15', expiresAt, sourceLocators, claimType });

const evidence = {
  schemaVersion: 1,
  slug,
  reviewedAt: '2026-07-15',
  overallConfidence: 'medium',
  axes,
  facts: [
    efact('budget-band', 'budget', 'current-proxy', 'medium', ['internal-itinerary', 'majormarine-kenai-cruise'], { lowUsd: 9140, expectedUsd: null, highUsd: 12600, targetUsd: 12000, preferredMaxUsd: 15000, distribution: 'planning-band', lineItemCount: 7, arithmetic: '2000–3000 + 2750–3500 + 700–1100 + 1500–2100 + 840–950 + 450–750 + 900–1200 = 9140–12600', exceedsShortTripTarget: true }, { 'internal-itinerary': 'short-alaska/main.json #budget and #totals; seven itemized categories reconcile to the displayed total', 'majormarine-kenai-cruise': 'Current 6-hour cruise fares $239 adult / $119.50 child (2–11) support the $840–$950 cruise line for three adult fares plus one child' }, '2026-12-31'),
    efact('trip-window', 'dates', 'confirmed', 'high', ['decision-profile'], { depart: '2027-06-12', return: '2027-06-19', hotelNights: 7, ptoDays: 4, juneteenthObserved: '2027-06-18', pittsburghBlackoutRespected: true }, { 'decision-profile': 'decisionProfile.json tripWindows.short-alaska [2027-06-12, 2027-06-19]; returns five days before the Jun 24–26 Pittsburgh commitment' }),
    efact('climate-proxy', 'climate', 'current-proxy', 'medium', ['weather-atlas-seward', 'wanderlog-girdwood'], { score: 3, sewardJuneHighLowF: [59, 47], girdwoodJuneAvgF: 53, sewardJuneRainInches: 2.1, sewardJuneRainDays: 15.8, girdwoodJuneRainInches: 4.4, sewardDaylightHours: 18.8, girdwoodDaylightHours: 19.1, forecast: false, weatherRisks: ['rain', 'low cloud', 'cold boat decks'] }, { 'weather-atlas-seward': 'Seward June normals: 59°F/47°F, 2.1 in over 15.8 days, 18.8 hours of daylight; June is the driest month', 'wanderlog-girdwood': 'Girdwood June average about 53°F with 4.4 in of rain over 11 days and 19.1 hours of daylight' }, '2027-04-01'),
    efact('swim-conditions', 'swim', 'current-proxy', 'high', ['seatemperature-kenai', 'alyeska-amenities'], { score: 1, temperatureF: [48, 51], juneSeaMinF: 42, hasSwim: false, scheduledSwimDays: 0, wetsuitRequired: true, primarySwim: 'Hotel Alyeska heated pool only, currently capped at one reserved hour per day' }, { 'seatemperature-kenai': 'June Resurrection Bay / Kenai water temperature 48.2–51°F, coldest 42°F; full wetsuit required', 'alyeska-amenities': 'Hotel Alyeska lists a heated saltwater pool and two 95°F whirlpools with a current one-hour daily reservation policy' }, '2027-05-15'),
    efact('itinerary-structure', 'itinerary', 'derived', 'high', ['internal-itinerary', 'nps-exit-glacier'], { score: 4, hotelNights: 7, lodgingBases: 2, baseNames: ['Seward', 'Girdwood'], scheduledModes: ['tidewater-glacier cruise', 'wildlife', 'glacier walk', 'aerial tram', 'iceberg lake', 'scenic drive'], denaliExcluded: true, denaliReason: 'about five hours north of Girdwood; a third base would contradict the ease-first short-trip premise' }, { 'internal-itinerary': 'short-alaska/main.json itinerary.days and #stays; three Seward nights and four Girdwood nights with one base move', 'nps-exit-glacier': 'Official NPS Exit Glacier page supports free ranger-led walks at 10 a.m., 2 p.m. and 4 p.m. May through Labor Day' }),
    efact('operational-load', 'logistics', 'derived', 'high', ['internal-itinerary', 'alaska-railroad-fares'], { easeScore: 3, maxConnections: 1, singleTicket: true, nonstopExists: false, lodgingBases: 2, baseMoves: 1, rentalCars: 1, timeZoneShift: 4, longestTransferHours: 2.25, airHoursPlanningEstimate: 19, groundHoursPlanningEstimate: 12, trainAlternativeConsidered: true }, { 'internal-itinerary': 'short-alaska/main.json day0/day7 one-stop routings, ANC→Seward 2 hr 15 min and Seward→Girdwood 1 hr 45 min', 'alaska-railroad-fares': 'Coastal Classic current fares $133 adult / $67 child one-way evaluated as a car alternative and rejected because it skips Portage and the Arm pullouts' }, '2027-02-01'),
    efact('family-food-coverage', 'food', 'current-proxy', 'medium', ['internal-itinerary', 'chair5-girdwood'], { score: 4, plainFoodRequired: true, coveredBases: ['Seward', 'Girdwood', 'Anchorage airport'], fallbackTypes: ['pizza', 'burgers', 'chicken', 'groceries'], lodgingKitchenConfirmed: false, thirteenYearOldPricesAsAdult: true }, { 'internal-itinerary': 'short-alaska/main.json structured spots name Chair 5, Seward Brewing and Ray’s Waterfront as plain-food fallbacks at both bases', 'chair5-girdwood': 'Chair 5 Restaurant Girdwood lists made-to-order pizza and burgers, the strongest verified picky-eater option at the Girdwood base' }, '2027-04-01'),
    efact('route-readiness', 'route', 'current-proxy', 'medium', ['internal-itinerary', 'majormarine-kenai-cruise', 'adfg-bears'], { status: 'current-proxy', singleTicket: true, maxConnections: 1, nonstopExists: false, outbound: 'PIT → SEA/ORD/MSP/DEN → ANC; no nonstop exists', return: 'ANC → one connection → PIT; eastbound loses four hours', exact2027FlightsVerified: false, cruiseIsSinglePointOfFailure: true, bearExposure: 'June brings mothers with cubs and the start of the salmon run' }, { 'internal-itinerary': 'short-alaska/main.json #air-travel marks every routing as connecting and prices as current proxies', 'majormarine-kenai-cruise': 'Operator publishes current-season sailings only; 2027 fares and schedules are not available and weather cancellation is an operator-stated risk', 'adfg-bears': 'Official ADF&G bear-country guidance supports the ranger-led-walk and well-travelled-trail mitigation rather than family backcountry hiking' }, '2026-12-31'),
    efact('visited-overlap', 'novelty', 'derived', 'high', ['decision-profile', 'scorecard-contract'], { score: 5, overlap: [] }, { 'decision-profile': 'Family visited-place list does not include Alaska, the Kenai Peninsula or Southcentral', 'scorecard-contract': 'tools/scorecard.manifest.json novelty rubric gives 5/5 for no overlap' }),
  ],
  metrics: {
    airHours: 19,
    groundHours: 12,
    timeZones: 4,
    baseMoves: 1,
    longestTransferHours: 2.25,
    highOutputDayStreak: 2,
    fallbackDays: 2,
    childActivityFit: { age13: 'fits', age8: 'fits' },
    lodgingComfort: {
      airConditioning: 'not needed in June',
      kitchen: 'preferred; a Girdwood condo would cut both lodging and food but forfeits the Alyeska pool',
      laundry: 'preferred for seven nights',
      realBeds: 'required but unknown until property selection',
    },
    waterSafety: 'Sea temperature runs 48–51°F and requires a full wetsuit; there is no open-water family swimming. The only warm water is Hotel Alyeska’s heated pool, currently limited to one reserved hour per day.',
    crowdingPressure: 'June is peak for Alaska rental cars and Kenai Fjords sailings; both should be booked early. Trails and pullouts are not crowd-limited.',
    medicalAccess: 'Seward has a small hospital; Anchorage carries full care and is roughly two hours from Seward and 45 minutes from Girdwood.',
    childActivityNotes: {
      age13: 'calving glaciers, humpbacks and the tram ridge read as real country, not kid programming; prices as an adult on the cruise',
      age8: 'six hours on the cruise is the longest ask; guaranteed bears and moose at the wildlife center and a free ranger walk to a glacier face carry the rest',
    },
  },
  confidenceBasis: [
    'official NPS fee, Exit Glacier and Harding Icefield guidance',
    'official Alaska DOT tunnel-toll and Alaska Railroad fare pages',
    'current operator pricing from Major Marine, AWCC, Alyeska and Portage Glacier Cruises',
    'official ADF&G bear-country guidance',
    'two-base itinerary derivation',
    'no exact June 2027 schedule, fare or room quote exists for any line',
  ],
  evidenceBasis: 'Official federal park, state transport and wildlife sources, current operator pricing, published climate and sea-temperature normals, and line-by-line derivation from the two-base itinerary. Exact June 2027 prices, flights and cruise schedules remain current-season proxies.',
};
fs.writeFileSync(path.join(outDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`wrote src/_data/${slug}/main.json and ${photoPlan.hero.length}+${Object.values(photoPlan.carousels).flat().length} photo placements`);
