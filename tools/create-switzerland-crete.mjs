#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const outDir = path.join(root, 'src/_data/switzerland-crete');

// ---- helpers (kept local, mirroring the other create-*.mjs builders) --------
function gmaps(lat, lng) { return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`; }
function point(n, lat, lng, r, t) { return { n, lat, lng, r, g: gmaps(lat, lng), t }; }
function unsplash(id, width = 1200) { return `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`; }
function pexels(id, width = 1200) { return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`; }
function img(src, captionTitle, credit, href = src) { return { href, src, alt: captionTitle.replace(/&amp;/g, '&'), captionTitle, credit }; }
function explore(name, tags = []) {
  const q = encodeURIComponent(name.replace(/&amp;/g, '&').replace(/<[^>]+>/g, ''));
  const tagLinks = tags.map((tag) => `<a class="xi" href="https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/" target="_blank" rel="noreferrer">IG &middot; ${tag}</a>`).join('');
  return `<a class="xg" href="https://www.google.com/search?tbm=isch&amp;q=${q}" target="_blank" rel="noreferrer">Photos</a>${tagLinks}<a class="xf" href="https://www.flickr.com/search/?text=${q}&amp;sort=interestingness-desc" target="_blank" rel="noreferrer">Flickr</a>`;
}
function spotMap(name, lat, lng) {
  const title = name.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
  return `<div class="spot-map">
          <div class="mapwrap"><iframe class="gmap" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${lat},${lng}&amp;z=13&amp;output=embed" title="Map of ${title}"></iframe></div>
          <a class="gmap-btn" href="${gmaps(lat, lng)}" target="_blank" rel="noreferrer">&#128205; Open in Google Maps &#8617;</a>
        </div>`;
}
function altList(items) { return `<ul class="alt-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`; }
function mkSpot({ name, tags, carouselId, images, lat, lng, cost, climateLabel = 'Weather', climate, save, splurge, restos, alts, blogs, alltrailsTrail }) {
  return {
    name,
    exploreHtml: explore(name, tags),
    carouselId,
    images,
    alltrailsTrail,
    cost,
    climateLabel,
    climate,
    saveHtml: `<b>Save</b> ${save}`,
    splurgeHtml: `<b>Splurge</b> ${splurge}`,
    restoHtml: restos.map((r) => `<li>${r}</li>`).join(''),
    altboxHtml: altList(alts),
    bloglinksHtml: blogs.map((b) => `<a class="xg" href="${b.href}" target="_blank" rel="noreferrer">${b.label}</a>`).join(''),
    spotMapHtml: spotMap(name, lat, lng),
  };
}
function day(id, colorClass, badge, eyebrow, heading, feel, daycost, facts, note, spots = [], travelNote = null) {
  return { id, colorClass, badge, eyebrow, heading, feel, daycost, facts, note, spots, travelNote };
}
function fact(label, valueHtml) { return { label, valueHtml }; }
function card(title, body) { return `<div class="pcard"><h4><span class="dot"></span>${title}</h4>${body}</div>`; }
function prow(label, value) { return `<div class="prow"><span>${label}</span><strong>${value}</strong></div>`; }
function table(headers, rows, className = 'budget-tbl') {
  return `<div class="budget-scroll"><table class="${className}"><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
}

// ---- Crete leg: reuse the fully-researched, self-hosted spots from the ------
// madeira-crete sibling. Same beaches → same best photos; the image paths point
// at assets/img/madeira-crete/ which persist regardless of this builder.
const MC = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/madeira-crete/main.json'), 'utf8'));
const mcSpots = MC.itinerary.days.flatMap((d) => d.spots || []);
const pickCrete = (name) => {
  const s = mcSpots.find((x) => x.name === name);
  if (!s) throw new Error(`missing reused Crete spot: ${name}`);
  return JSON.parse(JSON.stringify(s));
};
const chaniaSpot = pickCrete('Chania old town + Nea Chora / Agii Apostoli');
const balosSpot = pickCrete('Balos Lagoon by Kissamos boat');
const elafonissiSpot = pickCrete('Elafonissi Lagoon or Falasarna sunset');
const imbrosSpot = pickCrete('Imbros Gorge + south-coast swim');
const rethymnoSpot = pickCrete('Rethymno old town + Fortezza + beach');
const preveliSpot = pickCrete('Preveli Palm Beach + Kourtaliotiko Gorge');
const samariaSpot = pickCrete('Samaria Gorge — full Lefka Ori descent');

// ---- map -------------------------------------------------------------------
const mapColors = {
  berneroberland: '#1f6f78',
  transfer: '#c25a3a',
  chania: '#3f7d4e',
  rethymno: '#3a6ea5',
};
const mapPoints = [
  point('Zurich Airport (ZRH)', 47.4647, 8.5492, 'transfer', 'flight'),
  point('Lauterbrunnen / Interlaken base', 46.5934, 7.9061, 'berneroberland', 'hotel'),
  point('Staubbach Falls, Lauterbrunnen', 46.5946, 7.9083, 'berneroberland', 'view'),
  point('Trümmelbach Falls', 46.5691, 7.9033, 'berneroberland', 'view'),
  point('Jungfraujoch — Top of Europe', 46.5475, 7.9805, 'berneroberland', 'view'),
  point('Grindelwald-First (cliff walk)', 46.6656, 8.0431, 'berneroberland', 'hike'),
  point('Männlichen — Royal Walk', 46.6203, 7.9525, 'berneroberland', 'hike'),
  point('Iseltwald / Lake Brienz', 46.6883, 7.9377, 'berneroberland', 'town'),
  point('Giessbach Falls', 46.7195, 8.0006, 'berneroberland', 'view'),
  point('Harder Kulm / Interlaken', 46.7027, 7.8659, 'berneroberland', 'view'),
  point('Heraklion Airport (HER)', 35.3397, 25.1803, 'transfer', 'flight'),
  point('Chania old town base', 35.517, 24.017, 'chania', 'hotel'),
  point('Balos Lagoon (Kissamos boat)', 35.5836, 23.5906, 'chania', 'beach'),
  point('Elafonissi Lagoon', 35.2716, 23.5407, 'chania', 'beach'),
  point('Imbros Gorge', 35.2508, 24.1672, 'chania', 'hike'),
  point('Samaria Gorge (Xyloskalo)', 35.3072, 23.9189, 'chania', 'hike'),
  point('Rethymno old town + Fortezza', 35.3694, 24.473, 'rethymno', 'town'),
  point('Preveli Palm Beach', 35.1531, 24.4722, 'rethymno', 'beach'),
  point('Chania Airport (CHQ) — homebound', 35.5317, 24.1497, 'transfer', 'flight'),
];

// ---- Switzerland photos (Unsplash + Pexels, all verified reachable) ---------
const interlakenImages = [
  img(unsplash('1594987975747-b0822d768bb2'), 'Interlaken between Lake Thun and Lake Brienz', 'Alex Ghizila &middot; Unsplash License'),
  img(pexels('13818274'), 'Two-lakes panorama from Harder Kulm', 'Paintalia &middot; Pexels License'),
];
const lauterbrunnenImages = [
  img(pexels('30441907'), 'Lauterbrunnen at twilight beneath the Alps', 'Ilia Bronskiy &middot; Pexels License'),
  img(pexels('18498336'), 'Staubbach Falls plunging down the valley wall', 'Adrien Olichon &middot; Pexels License'),
];
const jungfraujochImages = [
  img(unsplash('1719784284559-fb7251f1e7ac'), 'Sphinx station on the snowbound Jungfraujoch', 'Kirill Prikhodko &middot; Unsplash License'),
  img(unsplash('1460891053196-b9d4d9483d9b'), 'Walking the Aletsch Glacier snowfield', 'Dino Reichmuth &middot; Unsplash License'),
];
const firstImages = [
  img(pexels('27289395'), 'First Cliff Walk suspended against the Eiger', 'Nanda Gopal Lakshman &middot; Pexels License'),
  img(pexels('13612696'), 'The First Cliff Walk platform over the void', 'allPhoto Bangkok &middot; Pexels License'),
];
const mannlichenImages = [
  img(unsplash('1731514562446-c1cc0b65cb6c'), 'Grindelwald high country at golden hour', 'Christopher Politano &middot; Unsplash License'),
  img(pexels('24604748'), 'Bachalpsee mirroring the Schreckhorn', 'Willian Justen de Vasconcellos &middot; Pexels License'),
];
const brienzImages = [
  img(unsplash('1700485598851-87e9964b3788'), 'The Iseltwald pier on turquoise Lake Brienz', 'Björn Schmidt &middot; Unsplash License'),
  img(pexels('30779921'), 'Iseltwald village and castle on the lake', 'Jean-Paul Wettstein &middot; Pexels License'),
  img(pexels('32455476'), 'Giessbach Falls tumbling to the lakeshore', 'Jean-Paul Wettstein &middot; Pexels License'),
];

// ---- Switzerland spots -----------------------------------------------------
const interlakenSpot = mkSpot({
  name: 'Interlaken soft landing: Höheweg + Harder Kulm view',
  tags: ['interlaken', 'harderkulm', 'berneroberland'],
  carouselId: 'c-int',
  images: interlakenImages,
  lat: 46.7027,
  lng: 7.8659,
  cost: 'The Höheweg promenade and lakefronts are free. The Harder Kulm funicular is the paid add-on, but its published fare is genuinely inconsistent across sources (roughly CHF 19–51 adult depending on window/pass) — treat it as unknown until you check jungfrau.ch the week you travel. Half-Fare/Swiss Travel Pass takes ~50% off.',
  climateLabel: 'Valley',
  climate: '<b>Valley floor, ~1,900 ft.</b> June highs about 63°F / lows 47°F, with a high day-to-day rain probability (~57% chance of some rain). A relaxed arrival day is the right use of jet-lagged legs before the mountain days.',
  save: 'Walk the Höheweg, watch the paragliders land, and skip the funicular on arrival day; save Harder Kulm for a clear evening later in the block.',
  splurge: 'A clear-evening Harder Kulm sunset ride for the classic squeezed-between-two-lakes shot, if the sky cooperates.',
  restos: [
    '<b>Luna Piccante (Wilderswil, ~6 min)</b> — wood-fired pizza with a kids’ play area and free parking',
    '<b>Asllanis Corner</b> — gourmet burgers and fries, casual and family-friendly',
    '<b>Ristorante e Pizzeria Sapori</b> — classic Italian in the center, reliable picky-kid pizza/pasta',
  ],
  alts: [
    '<b>Lake Thun boat</b> for a low-effort first afternoon if energy is very low.',
    '<b>Bönigen lakeshore</b> for a quiet turquoise-water stroll away from the crowds.',
    '<b>Grocery + early night</b> — the honest jet-lag choice before Jungfraujoch.',
  ],
  blogs: [
    { label: 'Harder Kulm official info', href: 'https://www.jungfrau.ch/en-gb/harderkulm/' },
    { label: 'Interlaken tourism', href: 'https://www.interlaken.ch/en' },
  ],
});

const lauterbrunnenSpot = mkSpot({
  name: 'Lauterbrunnen valley: 72 waterfalls + Trümmelbach',
  tags: ['lauterbrunnen', 'staubbach', 'trummelbach'],
  carouselId: 'c-lauter',
  images: lauterbrunnenImages,
  lat: 46.5934,
  lng: 7.9061,
  cost: 'Staubbach Falls is free from the village. Trümmelbach Falls (the glacier torrents inside the mountain) charges about CHF 18 adult / CHF 8 child 6–15 — roughly CHF 52 (~$58) for the family; under-4s are not permitted for safety. Open early April–early November, ~9am–5pm in June.',
  climateLabel: 'Valley',
  climate: '<b>Cliff-walled valley, ~2,600 ft.</b> June is green and misty with frequent afternoon showers. Trümmelbach is inside the rock, so it is the smart rainy-morning pick; the open-valley waterfall walks want a drier window.',
  save: 'Do the free Staubbach base walk and the village-to-Stechelberg valley path; pay only for Trümmelbach, which is genuinely unique.',
  splurge: 'Add the Wengen or Mürren cliff-shelf funicular for a car-free balcony village and a different angle on the valley.',
  restos: [
    '<b>Restaurant Steinbeck</b> — ~20 pizza varieties, kid-size portions available',
    '<b>Restaurant Weidstübli</b> — pizza/pasta with vegetarian, vegan and gluten-free options, Staubbach views',
    '<b>Hotel Oberland</b> — pizzas, pasta and soups with a garden in the village center',
  ],
  alts: [
    '<b>Mürren (car-free shelf village)</b> for the balcony view if the valley floor is socked in.',
    '<b>Trümmelbach only</b> as a rainy-morning anchor, then regroup.',
    '<b>Wengen</b> for an easy cog-rail town day with Jungfrau views.',
  ],
  blogs: [
    { label: 'Trümmelbach Falls official', href: 'https://lauterbrunnen.swiss/en/map/detail/trummelbach-waterfalls-52c355bf-8544-4c9b-9885-427fc77657fb.html' },
    { label: 'Lauterbrunnen tourism', href: 'https://lauterbrunnen.swiss/en/' },
  ],
});

const jungfraujochSpot = mkSpot({
  name: 'Jungfraujoch — Top of Europe (3,454 m)',
  tags: ['jungfraujoch', 'topofeurope', 'aletsch'],
  carouselId: 'c-jung',
  images: jungfraujochImages,
  lat: 46.5475,
  lng: 7.9805,
  cost: 'The single biggest line item of the whole leg. Plan off the Grindelwald round-trip fare (~CHF 239 adult in summer), with kids 6–15 at about CHF 20–30 (or free with a Swiss Family / Junior card), plus the CHF 10/person May–Oct reservation. Realistic family total: <b>roughly CHF 560–580 (~$630–650)</b>. A Swiss Travel Pass gives only 25% off the summit railway — it is not included. Re-verify at jungfraujochtickets.ch before booking; peak fares run dynamic.',
  climateLabel: 'Summit',
  climate: '<b>3,454 m / near-freezing year-round.</b> Expect roughly 28–36°F at the top even in June, regardless of valley heat — hats, gloves and real jackets. Cloud can white out the Aletsch view entirely, so keep a flex day and go on the clearest morning.',
  save: 'Buy the Grindelwald-side ticket (cheaper than Interlaken Ost), get free Junior/Family cards at any SBB station first, and pack summit snacks — the Crystal/Panorama self-service is pricey cafeteria fare.',
  splurge: 'The full summit experience — Ice Palace, Sphinx terrace, and a snow-play hour — is the once-in-a-lifetime payoff on a clear day; go all-in when the forecast is good.',
  restos: [
    '<b>Crystal / Panorama self-service (summit)</b> — fries, pasta, sandwiches; functional, not cheap',
    '<b>Bollywood restaurant (summit)</b> — Indian, the novelty option at the top station',
    '<b>Pack lunch</b> — the smartest move; eat a proper dinner back down in Grindelwald or the valley',
  ],
  alts: [
    '<b>Go on the clearest forecast day</b> — this is why the Swiss block keeps a flex morning.',
    '<b>Schynige Platte or Männlichen</b> as the lower-altitude big-view fallback if the summit is clouded.',
    '<b>Skip entirely and bank the ~$640</b> toward the Crete leg if weather never cooperates.',
  ],
  blogs: [
    { label: 'Jungfraujoch official', href: 'https://www.jungfrau.ch/en-gb/jungfraujoch-top-of-europe/' },
    { label: 'Jungfrau prices & tickets', href: 'https://www.jungfrau.ch/en-gb/prices-and-tickets/' },
  ],
});

const firstSpot = mkSpot({
  name: 'Grindelwald-First: Cliff Walk + adventure day',
  tags: ['grindelwaldfirst', 'firstcliffwalk', 'firstflyer'],
  carouselId: 'c-first',
  images: firstImages,
  lat: 46.6656,
  lng: 8.0431,
  cost: 'The single best kid-magnet of the leg. Gondola round-trip runs about CHF 76 adult in peak June (kids reduced; STP/Half-Fare ~50% off). The Cliff Walk is free with any gondola ticket. Add-on rides — First Flyer zipline, First Glider, Mountain Cart, Trottibike — start ~CHF 21 each; an Adventure Package bundling gondola + activities is ~CHF 69–99/person. A full family adventure day lands around <b>CHF 500–600 (~$570–680)</b>.',
  climateLabel: 'Mountain',
  climate: '<b>2,168 m.</b> June is roughly 50–59°F up top, windier than the valley, with the usual Alpine afternoon-thunderstorm risk. Ride up in the morning, do the cliff walk and rides before clouds build, and keep rain shells in the pack.',
  save: 'Buy the gondola + one activity each rather than the whole ride menu; the Cliff Walk and Bachalpsee hike are free once you’re up.',
  splurge: 'Let each kid pick a First Flyer/Mountain Cart combo — this is the day the 8-year-old remembers most.',
  restos: [
    '<b>Berggasthaus First (top station)</b> — burgers, bacon-cheese penne, rösti, goulash soup, vegan options, big terrace',
    '<b>Grindelwald village pizzerias</b> — plenty of plain-pizza/pasta fallbacks after the descent',
    '<b>Pack trail snacks</b> — for the Bachalpsee walk if you extend the day',
  ],
  alts: [
    '<b>Bachalpsee hike (from First)</b> — ~1 hr each way to the region’s iconic reflection lake.',
    '<b>Cliff Walk only</b> if the kids just want the headline photo and the rides look too much.',
    '<b>Move to a clear day</b> — swap with Jungfraujoch if the summit forecast is better today.',
  ],
  blogs: [
    { label: 'Grindelwald-First official', href: 'https://www.jungfrau.ch/en-gb/grindelwaldfirst/' },
    { label: 'First Adventure Package', href: 'https://www.jungfrau.ch/en-gb/grindelwaldfirst/adventure-package/' },
  ],
});

const mannlichenSpot = mkSpot({
  name: 'Männlichen Royal Walk — easy Eiger–Mönch–Jungfrau panorama',
  tags: ['mannlichen', 'royalwalk', 'grindelwald'],
  carouselId: 'c-mann',
  images: mannlichenImages,
  lat: 46.6203,
  lng: 7.9525,
  cost: 'The best value big-view of the leg. Männlichen gondola from Grindelwald Terminal is about CHF 34 adult / ~CHF 17 child return — roughly half the Schynige Platte cog railway (CHF 68 adult). The Royal Walk itself (~2 km, +120 m, ~30 min to the crown platform) is free and genuinely stroller-and-8-year-old friendly.',
  climateLabel: 'Ridge',
  climate: '<b>~2,230 m ridge.</b> Cooler and breezier than the valley; the payoff is a dead-ahead Eiger–Mönch–Jungfrau wall from an easy, short walk. A good half-day to pair with the Lake Brienz afternoon.',
  save: 'Ride from the Grindelwald side (cheaper), do the free Royal Walk, and picnic at the top instead of buying summit food.',
  splurge: 'Walk the panorama ridge trail toward Kleine Scheidegg for a longer high balcony if the 13-year-old wants more.',
  restos: [
    '<b>Berghaus Männlichen (top)</b> — rösti and simple mountain plates at the crown',
    '<b>Grindelwald village</b> — return for pizza/pasta and burgers after the ride down',
    '<b>Pack a summit picnic</b> — cheapest and best-timed with the panorama',
  ],
  alts: [
    '<b>Schynige Platte</b> instead if you’re Interlaken-side and want the alpine botanical garden.',
    '<b>Kleine Scheidegg ridge walk</b> to extend the panorama for stronger legs.',
    '<b>Straight to Lake Brienz</b> if clouds swallow the peaks — save the ridge for a clear slot.',
  ],
  blogs: [
    { label: 'Männlichen fares (Grindelwald)', href: 'https://www.maennlichen.ch/en/summer/information/fare-prices-from-grindelwald.html' },
    { label: 'Royal Walk official', href: 'https://www.maennlichen.ch/en/summer/experiences/royal-walk.html' },
  ],
});

const brienzSpot = mkSpot({
  name: 'Lake Brienz: Iseltwald pier + Giessbach Falls boat',
  tags: ['lakebrienz', 'iseltwald', 'giessbach'],
  carouselId: 'c-brienz',
  images: brienzImages,
  lat: 46.6883,
  lng: 7.9377,
  cost: 'The turquoise-lake day. A BLS lake boat runs its full schedule from late May; a one-way Interlaken Ost–Brienz seat is ~CHF 39 adult (kids reduced; free with pass). The famous Iseltwald wooden pier now has a turnstile with a ~CHF 5 entry to control crowds. The Giessbach funicular is likely bundled into a BLS combo ticket — confirm that fare before counting on it.',
  climateLabel: 'Lake',
  climate: '<b>Glacier-fed, ~57–64°F in June.</b> The vivid turquoise comes from glacial rock flour — but this is a <b>look-don’t-swim</b> lake in June; kids can wade, full swimming waits for the Crete leg. Official swim season is really July–August.',
  save: 'Do the free Iseltwald village lanes and the short lakeshore, ride one boat leg rather than the full loop, and let the swimming happen in Crete.',
  splurge: 'The full Brienz → Giessbach → Iseltwald boat loop with the historic Giessbach funicular is a lovely slow half-day if the weather is calm.',
  restos: [
    '<b>Chälet du Lac (Iseltwald)</b> — explicit kids’ menu and portions, lake-fish specialties',
    '<b>Restaurant Seegarten (Iseltwald)</b> — pizza, salads, burgers on a lakeside terrace',
    '<b>Strandhotel Iseltwald</b> — lake-caught fish plus house plates on the water',
  ],
  alts: [
    '<b>Giessbach Falls funicular + terrace</b> for the grand-hotel waterfall setting.',
    '<b>Brienz village woodcarving shops</b> for a rainy-afternoon town stop.',
    '<b>Lake Thun / Spiez</b> as the alternate turquoise-lake option from Interlaken’s west side.',
  ],
  blogs: [
    { label: 'Lake Brienz boat tickets (BLS)', href: 'https://www.bls-schiff.ch/en/lake-cruise/tickets-vouchers/tickets' },
    { label: 'Iseltwald crowd-control story', href: 'https://www.swissinfo.ch/eng/culture/swiss-beauty-spot-to-contain-korean-netflix-tourists/48516698' },
  ],
});

// ---- itinerary: 12 hotel nights (Berner Oberland 5 + Chania 7) -------------
const days = [
  day('day0', 'c0', '0', 'Tue &middot; Jun 8', 'Depart Pittsburgh after work', 'Overnight to Zurich', 'Est. $90 &middot; airport meals', [
    fact('Sleep', 'Overnight flight'),
    fact('Route target', 'PIT -> EWR/IAD/FRA/MUC/LHR -> ZRH'),
    fact('Constraint', 'In Pittsburgh all day Jun 24-26; Jun 23 return is allowed'),
  ], 'Open-jaw ticket: fly into Zurich, home from Crete. PIT has no transatlantic nonstop, so plan one clean European connection into ZRH.', [], 'Travel day - position toward Zurich.'),

  day('day1', 'c1', '1', 'Wed &middot; Jun 9', 'Arrive Zurich, train to the Berner Oberland', 'Interlaken soft landing', 'Est. $150 &middot; train, groceries, easy dinner', [
    fact('Sleep', 'Lauterbrunnen / Interlaken &middot; night 1 of 5'),
    fact('Transfer', 'ZRH -> Interlaken ~2h by direct train'),
    fact('Plan', 'Check-in, Höheweg walk, groceries, early night'),
  ], 'No Swiss rental car — the rail network reaches every mountain in this plan. Land, take the scenic train down, and let jet-lagged legs recover before the summit days.', [interlakenSpot]),

  day('day2', 'c1', '2', 'Thu &middot; Jun 10', 'Lauterbrunnen valley', 'Waterfall valley + Trümmelbach', 'Est. $140 &middot; Trümmelbach, lunch, dinner', [
    fact('Sleep', 'Lauterbrunnen / Interlaken &middot; night 2 of 5'),
    fact('Anchor', 'Staubbach + Trümmelbach glacier torrents'),
    fact('Weather rule', 'Trümmelbach is inside the rock — the smart rainy-morning pick'),
  ], 'The classic cliff-walled valley: 72 waterfalls, the Staubbach free-fall, and the Trümmelbach glacier torrents carved inside the mountain. Weather-flexible on purpose.', [lauterbrunnenSpot]),

  day('day3', 'c1', '3', 'Fri &middot; Jun 11', 'Jungfraujoch — Top of Europe', 'Highest railway in Europe, on the clearest morning', 'Est. $700 &middot; summit railway, snacks, dinner', [
    fact('Sleep', 'Lauterbrunnen / Interlaken &middot; night 3 of 5'),
    fact('Cost truth', 'Family ~CHF 560-580 (~$640) — the leg’s biggest line'),
    fact('Weather rule', 'Go on the clearest forecast day; keep it flexible with First'),
  ], 'The marquee splurge: cog rail to 3,454 m, the Aletsch Glacier, Ice Palace and Sphinx terrace. Near-freezing at the top even in June, and cloud can white it out — so this day floats to the best forecast morning of the block.', [jungfraujochSpot]),

  day('day4', 'c1', '4', 'Sat &middot; Jun 12', 'Grindelwald-First adventure day', 'Cliff Walk, zipline, mountain carts', 'Est. $620 &middot; gondola, activities, dinner', [
    fact('Sleep', 'Lauterbrunnen / Interlaken &middot; night 4 of 5'),
    fact('Anchor', 'First Cliff Walk + First Flyer / Mountain Cart'),
    fact('Kid win', 'The single best day for the 8-year-old'),
  ], 'The kid-magnet day: the cantilevered First Cliff Walk against the Eiger, then the First Flyer zipline, First Glider and Mountain Carts back down. Swap with Jungfraujoch if today’s summit forecast is the better one.', [firstSpot]),

  day('day5', 'c1', '5', 'Sun &middot; Jun 13', 'Männlichen panorama + Lake Brienz', 'Easy ridge view, then turquoise lake', 'Est. $220 &middot; gondola, boat, dinner', [
    fact('Sleep', 'Lauterbrunnen / Interlaken &middot; night 5 of 5'),
    fact('Morning', 'Männlichen Royal Walk — easy Eiger-Mönch-Jungfrau view'),
    fact('Afternoon', 'Iseltwald pier + Lake Brienz boat'),
  ], 'A gentler finale to the Swiss block: the short Männlichen Royal Walk for the big three-peak panorama without a hard hike, then down to glacier-turquoise Lake Brienz and the Iseltwald pier. Pack for the Crete flight tomorrow.', [mannlichenSpot, brienzSpot]),

  day('day6', 'c0', '6', 'Mon &middot; Jun 14', 'Fly Zurich -> Crete', 'Alps to the Aegean, new base at Chania', 'Est. $260 &middot; flight, transfer, dinner', [
    fact('Sleep', 'Chania old town &middot; night 1 of 7'),
    fact('Flight', 'ZRH -> HER (Heraklion) nonstop ~3h (Edelweiss/SWISS/Aegean)'),
    fact('Transfer', 'HER -> Chania ~2h20 rental-car drive west'),
  ], 'Fly into Heraklion, which has far more capacity than the weekly Zurich–Chania nonstop, then drive west to the Chania base. If a same-day ZRH–CHQ Edelweiss nonstop happens to match, it skips the drive — but do not build the dates around a weekly flight.', [], 'Travel day - train to Zurich airport, fly to Crete, drive to Chania.'),

  day('day7', 'c2', '7', 'Tue &middot; Jun 15', 'Chania old town + town beaches', 'Venetian harbor, first warm swim', 'Est. $180 &middot; town, beach, taverna', [
    fact('Sleep', 'Chania old town &middot; night 2 of 7'),
    fact('Anchor', 'Venetian harbor + Nea Chora / Agii Apostoli beaches'),
    fact('Payoff', 'Sea ~73°F — the warm water the whole trip was built around'),
  ], 'This is why Crete is the partner leg: the cold Swiss lakes give way to a ~73°F Aegean. Ease in with the Venetian harbor and the easy town beaches before the big beach days.', [chaniaSpot]),

  day('day8', 'c2', '8', 'Wed &middot; Jun 16', 'Balos Lagoon', 'Kissamos boat to the famous lagoon', 'Est. $220 &middot; boat, lunch, dinner', [
    fact('Sleep', 'Chania old town &middot; night 3 of 7'),
    fact('Anchor', 'Gramvousa / Balos boat from Kissamos'),
    fact('Note', 'Hot and exposed — bring shade, water, wind buffer'),
  ], 'The postcard lagoon: shallow, warm, pale-turquoise water from the Kissamos boat. Booked as a boat day rather than the rough 4x4 track, which keeps it easy for the kids.', [balosSpot]),

  day('day9', 'c2', '9', 'Thu &middot; Jun 17', 'Elafonissi lagoon', 'Pink-sand shallows or Falasarna sunset', 'Est. $170 &middot; parking, lunch, dinner', [
    fact('Sleep', 'Chania old town &middot; night 4 of 7'),
    fact('Anchor', 'Elafonissi pink-sand lagoon (Falasarna as the sunset swap)'),
    fact('Note', 'Shallow lagoon water feels warmer than open beaches'),
  ], 'The shallow pink-tinted lagoon is the calmest warm-water day of the trip — ideal for the 8-year-old. If wind is up, flip to Falasarna for the famous sunset instead.', [elafonissiSpot]),

  day('day10', 'c2', '10', 'Fri &middot; Jun 18', 'Imbros Gorge + south-coast swim', 'Juneteenth observed: no-PTO gorge day', 'Est. $150 &middot; entry, transfer, dinner', [
    fact('Sleep', 'Chania old town &middot; night 5 of 7'),
    fact('Holiday', 'Juneteenth observed Fri Jun 18 for many employers'),
    fact('Anchor', 'Imbros Gorge (8 km, shaded) + Komitades swim'),
  ], 'The family-scaled gorge: Imbros is 8 km, mostly downhill and shaded — far easier than Samaria — finishing at a south-coast swim. Uses the Juneteenth observed day so it costs no PTO.', [imbrosSpot]),

  day('day11', 'c3', '11', 'Sat &middot; Jun 19', 'Rethymno + Preveli palm beach', 'Old town, Fortezza, palm-lined river beach', 'Est. $190 &middot; fort, beach, dinner', [
    fact('Sleep', 'Chania old town &middot; night 6 of 7'),
    fact('Morning', 'Rethymno old town + Fortezza'),
    fact('Afternoon', 'Preveli Palm Beach + Kourtaliotiko Gorge'),
  ], 'The east-swing day: Venetian Rethymno and its Fortezza, then the palm-lined Preveli river beach on the south coast. A scenic long day back toward the Heraklion side of the island.', [rethymnoSpot, preveliSpot]),

  day('day12', 'c2', '12', 'Sun &middot; Jun 20', 'Chania send-off (Samaria for the fit)', 'Calm last beach day, or the big gorge', 'Est. $170-$300 &middot; beach or Samaria logistics', [
    fact('Sleep', 'Chania old town &middot; night 7 of 7'),
    fact('Default', 'Relaxed Chania beach + old-town evening'),
    fact('Option', 'Samaria Gorge full descent only if everyone is game'),
  ], 'Protect the homebound flight: the default is a calm Chania beach and a last old-town dinner. The full Samaria descent is here as a conscious upgrade for a fit family, not a default the day before flying.', [samariaSpot]),

  day('day13', 'c0', '13', 'Mon-Tue &middot; Jun 21-22', 'Fly Crete -> Pittsburgh', 'Home before the blackout', 'Est. $120 &middot; airport meals', [
    fact('Sleep', 'Home by Tue Jun 22'),
    fact('Route target', 'CHQ -> ATH -> European hub -> PIT'),
    fact('Schedule', 'Home by Tue Jun 22, ahead of the Jun 23 preference'),
  ], 'Fly out of Chania via Athens (frequent CHQ-ATH service), connect through a European hub, and land home by Tue Jun 22 — ahead of the preferred Jun 23 return and safely before the required full days in Pittsburgh on Jun 24-26.', [], 'Travel day - leave Crete Monday Jun 21, arrive Pittsburgh by Tuesday Jun 22.'),
];

const previewImages = [
  [pexels('30441907'), 'Day 2 &middot; Thu Jun 10', 'Lauterbrunnen valley', 'The waterfall valley at twilight opens the Alpine half.'],
  [unsplash('1719784284559-fb7251f1e7ac'), 'Day 3 &middot; Fri Jun 11', 'Jungfraujoch', 'Top of Europe at 3,454 m on the clearest morning.'],
  [pexels('27289395'), 'Day 4 &middot; Sat Jun 12', 'Grindelwald-First', 'The Cliff Walk cantilevered against the Eiger.'],
  [unsplash('1700485598851-87e9964b3788'), 'Day 5 &middot; Sun Jun 13', 'Lake Brienz', 'Glacier-turquoise water and the Iseltwald pier.'],
  ['../../assets/img/madeira-crete/google_chania_harbor_aerial_01.jpg', 'Day 7 &middot; Tue Jun 15', 'Chania', 'The Venetian harbor and the first warm Aegean swim.'],
  ['../../assets/img/madeira-crete/google_balos_lagoon_qa_01.jpg', 'Day 8 &middot; Wed Jun 16', 'Balos Lagoon', 'Shallow turquoise water from the Kissamos boat.'],
  ['../../assets/img/madeira-crete/google_elafonissi_beach_qa_01.jpg', 'Day 9 &middot; Thu Jun 17', 'Elafonissi', 'The pink-sand lagoon, the calmest warm swim of the trip.'],
  ['../../assets/img/madeira-crete/google_preveli_palm_beach_01.jpg', 'Day 11 &middot; Sat Jun 19', 'Preveli', 'Palm-lined river beach on the south coast.'],
];

const oldPart0 = template.parts[0].html;
const afterBody = oldPart0.indexOf('</head><body>') + '</head><body>'.length;
const navStart = oldPart0.indexOf('<nav class="site-nav"');
const overviewStart = oldPart0.indexOf('<section id="overview"');
const headBody = oldPart0.slice(0, afterBody)
  .replace(/<title>.*?<\/title>/, '<title>Switzerland + Crete &middot; Berner Oberland to Chania &mdash; June 2027</title>');
const navToMain = oldPart0.slice(navStart, overviewStart)
  .replace('      <a href="#photo-guide">Photo Guide</a>\n      <a href="#food-guide">Food Guide</a>\n', '');

const preview = `<section class="preview">
  <div class="pv-pane">
    <span class="pv-kicker">Family Trip &middot; Jun 8&ndash;22, 2027</span>
    <h1>Switzerland + Crete<span>Berner Oberland to Chania</span></h1>
    <p class="pv-lead">Twelve hotel nights splitting the two things a family trip usually has to choose between: five nights of Alps &mdash; Jungfraujoch, the Grindelwald-First Cliff Walk, Lauterbrunnen&rsquo;s waterfalls &mdash; then seven nights of warm Aegean swimming on Crete&rsquo;s Chania coast. The cold Swiss lakes are covered by Balos, Elafonissi, and a 73&deg;F sea.</p>
    <div class="pv-stats"><div><b>12</b><span>Hotel nights</span></div><div><b>2</b><span>Home bases</span></div><div><b>18</b><span>Stops mapped</span></div><div><b>$14.1k</b><span>priced target</span></div></div>
    <div class="pv-split" role="img" aria-label="Trip mix: about 30% water, 25% towns and food, 45% nature">
      <div class="seg water" style="flex:30"><b>30%</b><span>Water</span></div>
      <div class="seg town" style="flex:25"><b>25%</b><span>Towns &amp; food</span></div>
      <div class="seg nature" style="flex:45"><b>45%</b><span>Nature</span></div>
    </div>
    <p class="pv-cue">&darr; Full day-by-day plan below</p>
  </div>
  <div class="carousel pvcar" data-n="${previewImages.length}">
    <div class="track">${previewImages.map(([src, capDay, title, desc], index) => `<figure><img src="${src}" alt="${title}"${index ? ' loading="lazy"' : ''}><figcaption><span class="cap-day">${capDay}</span><strong>${title}</strong><span class="cap-desc">${desc}</span></figcaption></figure>`).join('')}</div>
    <button class="nav prev" aria-label="Previous">&#8249;</button>
    <button class="nav next" aria-label="Next">&#8250;</button>
    <div class="counter"><span class="cur">1</span> / ${previewImages.length}</div>
  </div>
</section>`;

const overview = `<section id="overview">
    <div class="section-label">
      <p class="eyebrow">The Plan at a Glance</p>
      <h2>The scenic Alps, rescued for swimming by warm-water Crete</h2>
      <p>Switzerland alone fails the family swim test &mdash; June lakes are 57&ndash;64&deg;F &mdash; and it is expensive enough to strain the budget on its own. This plan keeps the Alpine payoff to a tight <b>5-night Berner Oberland block</b>, then spends <b>7 nights on Crete&rsquo;s Chania coast</b> where the sea is ~73&deg;F. The route flies into Zurich, home from Crete, and protects the required full days in Pittsburgh on <b>Jun 24-26</b>.</p>
    </div>
    <div class="overview">
      <div class="ocard"><p class="eyebrow">Route</p><h4>PIT -> Zurich -> Berner Oberland -> Crete -> PIT</h4><p><b>5 nights Interlaken/Lauterbrunnen</b> (rail, no car), then <b>7 nights Chania</b> (rental car). Open-jaw ticket; home by Tue Jun 22.</p></div>
      <div class="ocard"><p class="eyebrow">Why the split</p><h4>Neither leg works alone</h4><p>Switzerland has no warm swimming and a brutal cost curve; Crete has no Alps. Together they cover water, mountains, towns, and two very different countries in one 12-night trip.</p></div>
      <div class="ocard"><p class="eyebrow">Budget truth</p><h4>Priced target ~$14,120; high case ~$19,440</h4><p>This is the honest number: Switzerland is expensive. The target is above the $12k goal and the high case is well above the $15k preferred maximum. Budget is the axis this trip sacrifices.</p></div>
    </div>
  </section>

  <section id="why-this-trip" class="divider">
    <div class="section-label">
      <p class="eyebrow">Why This Trip</p>
      <h2>The most scenic contrast on the board</h2>
      <p>No other plan swings from a 3,454 m glacier summit to a pink-sand lagoon in the same week. The price of that contrast is cost and one extra country of logistics.</p>
    </div>
    <div class="plan-grid">
      ${card('The Alps, kept tight', `<p>Five nights is exactly enough for Jungfraujoch, the Grindelwald-First Cliff Walk, Lauterbrunnen&rsquo;s waterfalls, and one easy panorama ridge &mdash; without letting Switzerland&rsquo;s daily cost run for two weeks.</p>`)}
      ${card('Crete does the swimming', `<p>The whole reason for the split. Balos, Elafonissi, and the Chania town beaches deliver the ~73&deg;F warm-water week the Swiss lakes never could, plus the family-scaled Imbros gorge.</p>`)}
      ${card('The honest tradeoff', `<p>This is the priciest realistic plan on the board and it carries two-country, open-jaw logistics. You are buying unmatched variety and scenery, and paying for it in budget and one more moving part.</p>`)}
    </div>
  </section>

  <section id="stays" class="divider">
    <div class="section-label">
      <p class="eyebrow">Where We Stay</p>
      <h2>Two bases, two very different rhythms</h2>
      <p>Switzerland is rail-based from a single valley base; Crete is a rental-car base on the Chania coast. No airport-buffer night is needed &mdash; the homebound flies from Chania via Athens.</p>
    </div>
    <div class="plan-grid">
      ${card('Berner Oberland &middot; 5 nights', `${prow('Target', 'Lauterbrunnen or Interlaken 2-bedroom apartment &middot; $180-$280/night')}${prow('Why', 'Central to Jungfrau railways, First, Männlichen, and the lakes; no car needed')}${prow('Add', 'Tourist tax ~CHF 3/person/night on top')}`)}
      ${card('Chania &middot; 7 nights', `${prow('Target', 'Chania old-town or Nea Chora apartment &middot; $130-$190/night')}${prow('Why', 'Walk to the harbor and town beaches; drive to Balos, Elafonissi, Imbros')}${prow('Car', 'Rental picked up at HER, dropped at CHQ')}`)}
      ${card('Why no buffer night', `${prow('Homebound', 'Chania -> Athens -> hub -> PIT is a clean same-day chain')}${prow('Contrast', 'Unlike the fragile island-hop plans, Crete has frequent Athens service')}${prow('Result', 'Full 12 hotel nights, no wasted airport night')}`)}
    </div>
  </section>

  <section id="calendar" class="divider">
    <div class="section-label">
      <p class="eyebrow">Calendar</p>
      <h2>Jun 8-22 fits the window and protects the Pittsburgh dates</h2>
      <p>Dates sit inside the Jun 6-Aug 15, 2027 planning window, return before the preferred Jun 23 date, and keep the family in Pittsburgh all day Jun 24-26.</p>
    </div>
    ${table(['Date', 'Night', 'Base', 'Purpose'], [
      ['Tue Jun 8', 'Red-eye', 'PIT -> Zurich', 'After-work departure'],
      ['Wed Jun 9-Sun Jun 13', '5', 'Berner Oberland', 'Jungfraujoch, First, Lauterbrunnen, lakes'],
      ['Mon Jun 14', 'travel', 'Zurich -> Chania', 'Fly to Crete, drive to Chania'],
      ['Tue Jun 15-Sun Jun 20', '7', 'Chania', 'Balos, Elafonissi, Imbros, Rethymno, Preveli'],
      ['Mon-Tue Jun 21-22', 'Home', 'Crete -> PIT', 'Arrive before blackout'],
    ])}
  </section>`;

const mapAirGround = `<section id="map" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Whole Trip, Mapped</p>
      <h2>Every stop on one map</h2>
      <p>Open <b>Map layers</b> to show or hide flights, lodging, hikes, beaches, towns, and viewpoints. Tap a region to fly there, then click any pin for Google Maps.</p>
    </div>
    <div class="tripmap-wrap">
      <div class="mapbtns">
        <button data-region="berneroberland"><span class="sw" style="background:#1f6f78"></span>Berner Oberland</button><button data-region="chania"><span class="sw" style="background:#3f7d4e"></span>West Crete</button><button data-region="rethymno"><span class="sw" style="background:#3a6ea5"></span>Rethymno / south</button><button data-region="transfer"><span class="sw" style="background:#c25a3a"></span>Flights</button><button data-region="all">Whole trip</button>
      </div>
      <div class="mapstage">
        <button class="layers-btn" aria-expanded="false" aria-label="Map layers"><span class="lbi">&#9639;</span> Layers</button>
        <div class="layers-panel" hidden>
          <div class="layers-top"><strong>Map layers</strong><button class="layers-x" aria-label="Close">&times;</button></div>
          <div class="layers-acts"><button data-all="1">Select all</button><span class="dot">&middot;</span><button data-all="0">Deselect all</button></div>
          <div class="layers-list"></div>
        </div>
        <div id="tripmap"></div>
      </div>
    </div>
  </section>

  <section id="air-travel" class="divider">
    <div class="section-label">
      <p class="eyebrow">Air Travel</p>
      <h2>Open-jaw: into Zurich, home from Crete</h2>
      <p>Research status: 2027 schedules are not yet bookable, so current 2026 route and fare signals are planning proxies. No live 2027 open-jaw quote exists &mdash; the number below is arithmetic on verified 2026 legs. Re-quote on ITA Matrix once inventory opens.</p>
    </div>
    <div class="plan-grid">
      ${card('PIT -> Zurich', `${prow('Reality', 'No PIT transatlantic nonstop; one clean Europe connection')}${prow('Corridors', 'EWR/IAD (United/SWISS), FRA/MUC (Lufthansa), or LHR (BA)')}${prow('Fare signal', '~$950-$1,300 pp target; $1,400-$2,000 high')}`)}
      ${card('Crete -> PIT (open-jaw)', `${prow('Preferred', 'CHQ -> ATH -> European hub -> PIT')}${prow('One-airline option', 'BA: HER -> LHR nonstop + LHR -> PIT nonstop')}${prow('Fare signal', '~$1,250-$1,700 pp (verified prior PIT-Crete band)')}`)}
      ${card('Zurich -> Crete hop', `${prow('Best airport', 'HER (Heraklion): Edelweiss/SWISS/Aegean nonstop ~3h')}${prow('Watch', 'ZRH -> CHQ (Chania) nonstop is weekly (Edelweiss) — do not date around it')}${prow('Family fare', '$1,000-$1,800 round trip')}`)}
      ${card('Open-jaw total', `${prow('Target', '~$4,400-$5,600 family transatlantic (HRT construction)')}${prow('High', '~$6,400-$8,000 if booked late or summer demand runs hot')}${prow('ETIAS', 'Mandatory by Jun 2027; ~$22/person, both Schengen legs')}`)}
    </div>
  </section>

  <section id="getting-around" class="divider">
    <div class="section-label">
      <p class="eyebrow">Getting Around</p>
      <h2>Rail in Switzerland, one rental car on Crete</h2>
      <p>No Swiss rental car: the Jungfrau Railways network reaches everything in the Berner Oberland. A regional pass covers the base trains; mountain excursions are separate.</p>
    </div>
    <div class="plan-grid">
      ${card('Swiss rail + passes', `${prow('Likely best', 'Berner Oberland Regional Pass over the Swiss Travel Pass for a region-only trip')}${prow('Kids', 'Free with a Swiss Family Card (get it at any SBB station)')}${prow('Verify', 'Jungfraujoch discount differs by pass — reconfirm before buying')}`)}
      ${card('Crete car', `${prow('Pickup/drop', 'HER Jun 14 -> CHQ Jun 21')}${prow('Budget', '$450-$650 plus fuel; book an automatic early')}${prow('Why', 'Balos/Kissamos, Elafonissi, Imbros, Preveli all need a car')}`)}
      ${card('The one transfer', `${prow('HER -> Chania', '~2h20 drive west on arrival day')}${prow('Why HER not CHQ', 'Heraklion has real capacity; Chania nonstop from Zurich is weekly')}${prow('If CHQ works', 'A matching ZRH-CHQ Edelweiss flight skips the drive entirely')}`)}
    </div>
  </section>`;

const healthTiming = `<section id="health-check" class="divider">
    <div class="section-label">
      <p class="eyebrow">Plan Health-Check</p>
      <h2>What to lock, watch, and expect</h2>
      <p>Current research refreshed July 2026 for a June 2027 trip. Kids assumed 13 and 8.</p>
    </div>
    <div class="hc-grid">
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The contrast is the point</h4><p>A 3,454 m glacier summit and a pink-sand lagoon in one 12-night trip is unmatched variety. The split exists specifically so Crete&rsquo;s warm sea covers the cold Swiss lakes.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The Pittsburgh dates are protected</h4><p>Depart Tue Jun 8, fly home Mon Jun 21, arrive by Tue Jun 22 &mdash; ahead of the preferred Jun 23 return and the required full days Jun 24-26.</p></div>
      <div class="hc actnow"><span class="hc-tag">Cost</span><h4>Budget is the real cost</h4><p>Target ~$14,120 is above the $12k goal, and the high case ~$19,440 is well past the $15k preferred maximum. Switzerland drives this; there is no cheap version of a Jungfrau week.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Swiss weather can eat a marquee day</h4><p>Lauterbrunnen sees rain on well over half of June days, and Jungfraujoch can white out. Jungfraujoch and First are deliberately swappable to chase the clearest morning.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>The Zurich-Crete hop</h4><p>Fly into Heraklion (real capacity), not the weekly Chania nonstop. The open-jaw fare is arithmetic on 2026 proxies, not a live 2027 quote &mdash; re-price before booking.</p></div>
      <div class="hc good"><span class="hc-tag">By design</span><h4>Swimming is on Crete, not Switzerland</h4><p>Lake Brienz is a look-don&rsquo;t-swim lake in June, and that is the accepted split tradeoff: the Alpine leg earns its place on epic scenery and hiking, while Crete carries the warm-water week. Every real swim day is on the Chania coast.</p></div>
    </div>
  </section>

  <section id="timing" class="divider">
    <div class="section-label">
      <p class="eyebrow">Best Time</p>
      <h2>Why early June wins for this constraint set</h2>
      <p>It gives 12 hotel nights, uses Juneteenth observed as a no-PTO active day, and returns before the blackout.</p>
    </div>
    ${table(['Window', 'Nights', 'PTO', 'Blackout fit', 'Verdict'], [
      ['Jun 8-22', '12 hotel nights', '8 days', 'Home before Jun 23', '<b>Use this</b>'],
      ['Jun 15-29', '12+', '8-9 days', '<b>Invalid</b> - away during Jun 24-26', 'Reject'],
      ['Jun 27-Jul 10', '12+', '9 days', 'Valid', 'Backup if early June flights fail'],
      ['Aug 1-14', '12+', '9-10 days', 'Valid', 'Hotter on Crete, pricier, peak crowds'],
    ])}
    <div class="verdict-box" style="border-left-color:var(--c3);margin-top:18px"><h4>PTO math</h4><p>Friday Jun 18 is Juneteenth observed for many US employers, so it costs no PTO. Likely PTO days: Jun 9, 10, 11, then Jun 14, 15, 16, 17, then Jun 21 travel &mdash; about <b>8 PTO days</b>, with weekends Jun 12-13 and 19-20 free. The plan is home a day ahead of the preferred Jun 23 return and clear of the required Pittsburgh days Jun 24-26.</p></div>
  </section>`;

const budgetTips = `<section id="budget" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Money</p>
      <h2>Budget, savers &amp; splurges</h2>
      <p>Real priced planning band using 2026 route/fare/lodging signals because June 2027 inventory is not live. USD, family of four. This is the priciest plan on the board &mdash; the numbers are honest about that.</p>
    </div>
    ${table(['Line item', 'Target case', 'High case'], [
      ['PIT -> Zurich / Crete -> PIT open-jaw airfare', '$5,200', '$7,200'],
      ['Zurich -> Heraklion intra-Europe hop', '$1,100', '$1,800'],
      ['Lodging: Berner Oberland 5 nights', '$1,150', '$1,450'],
      ['Lodging: Chania 7 nights', '$1,020', '$1,340'],
      ['Swiss rail pass + Jungfraujoch/First/Männlichen/boat', '$2,150', '$2,650'],
      ['Crete car, fuel, Balos boat, gorge fees', '$850', '$1,150'],
      ['Food and groceries, 13 travel days', '$2,150', '$2,750'],
      ['Insurance, ETIAS, fees, misc buffer', '$500', '$1,100'],
      ['<b>Grand total</b>', '<b>$14,120</b>', '<b>$19,440</b>'],
    ])}
    <div class="twocol">
      <div class="listcard save-list"><h4>Save money</h4><ul><li>Cook in the apartments &mdash; Swiss restaurant meals run CHF 20-50/person.</li><li>Buy the Grindelwald-side Jungfraujoch ticket and free Junior/Family cards before you go.</li><li>Skip Harder Kulm if the funicular fare is high; the free Höheweg gives the town view.</li><li>Do the free Männlichen Royal Walk and picnic instead of summit restaurants.</li><li>Bank the Jungfraujoch ~$640 toward Crete if the summit never clears.</li></ul></div>
      <div class="listcard splurge-list"><h4>Worth the splurge</h4><ul><li>Jungfraujoch in full on a clear day &mdash; the once-in-a-lifetime summit.</li><li>The First adventure package: zipline, glider, and mountain carts for the kids.</li><li>The full Lake Brienz + Giessbach boat loop on a calm afternoon.</li><li>The Balos boat day rather than the rough 4x4 track.</li><li>An automatic Crete rental booked early to avoid manual-only fleets.</li></ul></div>
    </div>
  </section>

  <section id="totals" class="divider">
    <div class="section-label">
      <p class="eyebrow">Bottom Line</p>
      <h2>Total trip cost</h2>
      <p>This plan does not hit the $12k target and its high case exceeds the $15k preferred maximum. It buys the most scenic variety on the board; budget is what it trades away.</p>
    </div>
    ${table(['Category', 'Estimate'], [
      ['Flights and intra-Europe hop', '$6,300 target / $9,000 high'],
      ['Lodging, 12 hotel nights', '$2,170 target / $2,790 high'],
      ['Swiss rail pass + mountain excursions', '$2,150 target / $2,650 high'],
      ['Crete car, boats, gorge fees, activities', '$850 target / $1,150 high'],
      ['Food, groceries, 13 travel days', '$2,150 target / $2,750 high'],
      ['Insurance, ETIAS, fees, buffer', '$500 target / $1,100 high'],
      ['<b>Grand total - family of 4</b>', '<b>$14,120 target / $19,440 high</b>'],
    ])}
    <p class="rate-note">Per-day itinerary costs cover food + activities only. Lodging, flights, rail passes, and the rental car sit in the totals above, not the daily numbers.</p>
  </section>

  <section id="tips" class="divider">
    <div class="section-label">
      <p class="eyebrow">Travel Tips</p>
      <h2>The stuff nobody tells you</h2>
      <p>Operational rules that keep an expensive, two-country plan from becoming a fragile one.</p>
    </div>
    <div class="tips-order">
      <p class="mini-h">Book in roughly this order</p>
      <ol>
        <li>Protected PIT-Zurich / Crete-PIT open-jaw ticket<span> &middot; re-quote on ITA Matrix when 2027 loads</span></li>
        <li>ZRH -> Heraklion nonstop + Crete rental car<span> &middot; automatic booked early</span></li>
        <li>Refundable Berner Oberland apartment + Chania apartment<span> &middot; parking, AC, washer</span></li>
        <li>Swiss passes + Jungfraujoch reservation<span> &middot; verify pass/discount terms first</span></li>
        <li>Balos boat + any First adventure add-ons<span> &middot; closer to travel</span></li>
      </ol>
    </div>
    <div class="tips-grid">
      <div class="tipcard"><h4>Flights</h4><p class="sub">Open-jaw, into Zurich</p><ul><li><b>Fly into Heraklion, not weekly Chania.</b></li><li><b>Home via Athens</b> keeps the return clean.</li><li><b>Re-quote the open-jaw</b>; the number is 2026-proxy arithmetic.</li></ul></div>
      <div class="tipcard t2"><h4>Switzerland</h4><p class="sub">Chase the weather</p><ul><li><b>Jungfraujoch and First are swappable</b> &mdash; do the clearer one first.</li><li><b>Layers for the summit</b>; it&rsquo;s near freezing in June.</li><li><b>Lakes are for looking</b>, not June swimming.</li></ul></div>
      <div class="tipcard t3"><h4>Money</h4><p class="sub">Switzerland is the cost</p><ul><li><b>Cook in the apartment</b> to blunt Swiss food prices.</li><li><b>Swiss francs, not euros</b> &mdash; CHF on that leg.</li><li><b>Verify pass math</b> before buying Jungfrau tickets.</li></ul></div>
      <div class="tipcard t4"><h4>Crete</h4><p class="sub">The warm-water week</p><ul><li><b>Balos and Elafonissi are the calm-water wins.</b></li><li><b>Imbros over Samaria</b> for the family gorge.</li><li><b>Hard chalky tap water</b> &mdash; many prefer bottled.</li></ul></div>
    </div>
  </section>`;

const socialBalanceStatus = `<section id="social" class="divider">
    <div class="section-label">
      <p class="eyebrow">What People Are Saying</p>
      <h2>Research signals to keep in mind</h2>
      <p>Official pages and current route data point the same way: the Berner Oberland is the best-connected Alps for families, and Crete&rsquo;s Chania coast is the warm-water payoff.</p>
    </div>
    <div class="plan-grid">
      ${card('Cost signal', `<p>Jungfrau railway fares, Swiss lodging, and food all confirm the same thing: this is the priciest plan on the board. The saving move is a rail pass plus apartment cooking, not skipping the mountain days.</p>`)}
      ${card('Weather signal', `<p>Lauterbrunnen&rsquo;s high June rain frequency and Jungfraujoch&rsquo;s whiteout risk are why the two marquee summit days are built to be swapped to the clearest morning.</p>`)}
      ${card('Family signal', `<p>The Grindelwald-First rides and the shallow Balos/Elafonissi lagoons are the two ends that make the hard days (summit, gorge) worth it for an 8-year-old.</p>`)}
    </div>
  </section>

  <section id="balance" class="divider">
    <div class="section-label">
      <p class="eyebrow">Trip Balance</p>
      <h2>What the days add up to</h2>
      <p>Nature-forward across both legs, with Crete carrying the water and both legs supplying town time.</p>
    </div>
    <div class="bar"><i style="width:30%;background:#1f6f78"></i><i style="width:25%;background:#c25a3a"></i><i style="width:45%;background:#3f7d4e"></i></div>
    <div class="balance">
      <div class="bcard k1"><div class="pct">30%</div><h4>Water &middot; Beaches &middot; Lakes</h4><p>Chania town beaches, Balos and Elafonissi lagoons, Preveli, the Imbros south-coast swim, and the look-only Lake Brienz.</p></div>
      <div class="bcard k2"><div class="pct">25%</div><h4>Towns &middot; Food &middot; Reset</h4><p>Interlaken, Lauterbrunnen village, Iseltwald, Chania old town, Rethymno, groceries, and the arrival/travel days.</p></div>
      <div class="bcard k3"><div class="pct">45%</div><h4>Alps &middot; Gorges &middot; Ridges</h4><p>Jungfraujoch, Grindelwald-First, Männlichen, Trümmelbach, and Crete&rsquo;s Imbros and optional Samaria gorges.</p></div>
    </div>
  </section>

  <section id="status" class="divider">
    <div class="section-label"><p class="eyebrow">Settled &amp; Open</p><h2>What is decided, what still needs a call</h2><p>The route is opinionated, but 2027 fares, Swiss pass math, and the Zurich-Crete schedule need live re-quotes before booking.</p></div>
    <div class="status"><div class="scol settled"><h4>Settled</h4>
      <div class="row"><b>Slug</b><span>switzerland-crete</span></div>
      <div class="row"><b>Route</b><span>Berner Oberland 5 nights (rail) -> Chania 7 nights (car), open-jaw ZRH in / Crete out.</span></div>
      <div class="row"><b>Dates</b><span>Depart Tue Jun 8, 2027; home by Tue Jun 22, ahead of the preferred Jun 23 return and required Pittsburgh days Jun 24-26.</span></div>
      <div class="row"><b>Swim decision</b><span>All real swimming is on Crete; Swiss lakes are look-only in June.</span></div>
      <div class="row"><b>Budget verdict</b><span>$14,120 target / $19,440 high &mdash; above the $12k target and the $15k preferred maximum. Budget is the sacrificed axis.</span></div>
    </div><div class="scol open"><h4>Open</h4>
      <div class="row"><b>Open-jaw fare</b><span>No live 2027 quote exists; the number is 2026-proxy arithmetic. Re-price on ITA Matrix.</span></div>
      <div class="row"><b>Zurich-Crete airport</b><span>HER (Heraklion) is the capacity choice; a matching ZRH-CHQ Edelweiss nonstop would skip the drive.</span></div>
      <div class="row"><b>Swiss pass math</b><span>Berner Oberland Regional Pass vs Swiss Travel Pass, and the exact Jungfraujoch discount, need a direct check.</span></div>
      <div class="row"><b>Weather flex</b><span>Jungfraujoch vs First order is decided day-of by the forecast.</span></div>
    </div></div>
  </section>`;

const todo = {
  labelHtml: `
      <p class="eyebrow">Pre-Departure To-Do</p>
      <h2>What to book before leaving</h2>
      <p>Planning sequence for the Jun 8-22, 2027 Switzerland + Crete route. Track fares before buying; the open-jaw needs a live re-quote once 2027 inventory opens.</p>
    `,
  blocks: [
    {
      when: 'Jul-Aug 2026',
      tone: 'hot',
      title: 'Flight inventory opens: track, do not auto-buy',
      note: 'Map the open-jaw as a family-of-4 total and set alerts; buy only when routing and price both work.',
      items: [
        '<b>Track PIT -> ZRH and Crete -> PIT as one open-jaw.</b> Watch EWR/IAD (United/SWISS), FRA/MUC (Lufthansa), and LHR (BA).',
        '<b>Set the airfare gate.</b> Target ~$5,200 family transatlantic; high case ~$7,200 with seats/bags.',
        '<b>Price the ZRH -> Heraklion hop separately.</b> Edelweiss/SWISS/Aegean nonstop ~3h.',
      ],
    },
    {
      when: 'By Sep 2026',
      title: 'Hold refundable lodging',
      items: [
        '<b>Berner Oberland:</b> 5 nights Lauterbrunnen/Interlaken 2-bedroom apartment with washer and parking.',
        '<b>Chania:</b> 7 nights old-town or Nea Chora apartment near the harbor.',
        '<b>Reserve the Crete rental car</b> (automatic) for HER pickup, CHQ drop.',
      ],
    },
    {
      when: 'Winter 2026-27',
      tone: 'watch',
      title: 'Passes, documents, and pass math',
      items: [
        '<b>Decide Berner Oberland Regional Pass vs Swiss Travel Pass</b> and confirm the Jungfraujoch discount for the one you pick.',
        '<b>Check passports, ETIAS (mandatory by Jun 2027), and travel insurance.</b>',
        '<b>Get free Swiss Family / Junior cards</b> for the kids at an SBB station on arrival.',
      ],
    },
    {
      when: '60-30 days out',
      title: 'Turn the plan into bookings',
      items: [
        '<b>Buy the Jungfraujoch reservation</b> (mandatory May-Oct) once the weather-flex plan is set.',
        '<b>Book the Balos/Gramvousa boat</b> and any First adventure add-ons.',
        '<b>Confirm the ZRH -> Crete nonstop day</b> and, if using CHQ, that the weekly flight matches.',
      ],
    },
    {
      when: 'Final 2 weeks',
      tone: 'done',
      title: 'Operational checks',
      items: [
        '<b>Download offline maps</b> for the Berner Oberland, Chania, and the west-Crete beaches.',
        '<b>Reconfirm flight times, rail schedules, the HER car counter, and mountain weather.</b>',
        '<b>Pack layers and rain shells for the Alps, plus swim gear and reef shoes for Crete.</b>',
      ],
    },
  ],
  callout: '<b>Do not forget:</b> this plan trades budget for the most scenic contrast on the board. Keep the Swiss block tight and rail-based, and let Crete carry every warm swim.',
};

const scorecard = {
  displayName: 'Switzerland + Crete',
  blurb: 'Alps epic + warm Crete swimming',
  axes: {
    budget: 1,
    weather: 3,
    swim: 4,
    variety: 5,
    ease: 2,
    food: 4,
    risk: 2,
    nights: 5,
    novelty: 5,
    pto: 3,
  },
  weightDefaults: {
    budget: 2,
    weather: 1,
    swim: 1,
    variety: 1,
    ease: 1,
    food: 1,
    risk: 1,
    nights: 1,
    novelty: 1,
    pto: 0,
  },
  budget: {
    floorUsd: 14120,
    ceilUsd: 19440,
    targetUsd: 12000,
    preferredMaxUsd: 15000,
  },
  pto: {
    days: 8,
    nights: 12,
  },
  facets: {
    continent: 'europe',
    maxConnections: 2,
    swimTempF: [72, 75],
    noPassport: false,
    singleTicket: false,
    hasSwim: true,
  },
  totalBaked: 32,
};

let scripts = template.parts[12].html
  .replace(/window\.__MAP_POINTS__=.*?;window\.__MAP_COLORS__=/s, `window.__MAP_POINTS__=${JSON.stringify(mapPoints)};window.__MAP_COLORS__=`)
  .replace(/window\.__MAP_COLORS__=.*?;window\.__MAP_TYPES__=/s, `window.__MAP_COLORS__=${JSON.stringify(mapColors)};window.__MAP_TYPES__=`)
  .replace(
    /L\.tileLayer\('https:\/\/maps\.[^']+',\{maxZoom:19,attribution:'&copy; OpenStreetMap contributors, [^']+'\}\)\.addTo\(map\);/,
    "L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);",
  );

const data = {
  recommended: true,
  countries: ['switzerland', 'greece'],
  packingTags: ['hiking', 'beach', 'heat', 'rain'],
  slug: 'switzerland-crete',
  lang: 'en',
  title: 'Switzerland + Crete · Berner Oberland to Chania — June 2027',
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  overrides: {
    packing: [
      '<b>Alpine layers:</b> fleece or light puffer, hat and gloves for Jungfraujoch even in June.',
      '<b>Rain shells:</b> Lauterbrunnen and First see frequent afternoon showers.',
      '<b>Real shoes both ways:</b> grippy trainers for the Alps, reef shoes for Crete&rsquo;s beaches and gorges.',
      '<b>Sun + heat kit:</b> UPF shirts, hats, sunscreen for the exposed Crete beach and boat days.',
      '<b>Two currencies:</b> Swiss francs for Switzerland, euros for Crete.',
    ],
  },
  itinerary: {
    className: 'divider',
    labelHtml: `
      <p class="eyebrow">The Itinerary</p>
      <h2>Day by day</h2>
      <p>Swipe each carousel for photos. Every stop carries its cost, a money-saving tip, a splurge, picky-kid restaurants, backup / if-time ideas, blog links, and a map. Daily costs are food + activities only, not flights, lodging, rail passes, or the car.</p>
`,
    daysClass: 'days',
    days,
  },
  parts: [
    { t: 'raw', html: `${headBody}${preview}${navToMain}${overview}` },
    { t: 'itinerary' },
    { t: 'raw', html: mapAirGround },
    { t: 'entry' },
    { t: 'raw', html: healthTiming },
    { t: 'todo' },
    { t: 'raw', html: budgetTips },
    { t: 'packing' },
    { t: 'raw', html: socialBalanceStatus },
    { t: 'raw', html: scripts },
  ],
  preDepartureTodos: todo,
  scorecard,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'main.json'), `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${path.relative(root, path.join(outDir, 'main.json'))}`);
