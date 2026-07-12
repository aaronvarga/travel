#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const slug = 'switzerland-sicily';
const outDir = path.join(root, 'src/_data', slug);
const imgDir = path.join(root, 'assets/img', slug);

// ---- helpers (kept local, mirroring the other create-*.mjs builders) --------
function gmaps(lat, lng) { return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`; }
function point(n, lat, lng, r, t) { return { n, lat, lng, r, g: gmaps(lat, lng), t }; }
function img(file, captionTitle, credit, alt = captionTitle) {
  const src = `../../assets/img/${slug}/${file}`;
  return { href: src, src, alt: alt.replace(/&amp;/g, '&'), captionTitle, credit };
}
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

// ---- self-host every carousel image under this slug's own folder ------------
// The Swiss leg reuses the fully-sourced google_* Alpine photos already vetted
// on the switzerland-crete sibling; the Sicily leg reuses the fully-sourced
// google_* Sicily photos from the portugal-sicily / sicily-malta siblings.
// verify/optimize require every src to resolve under assets/img/<slug>/, so the
// files are physically copied here (content-hashed derivatives dedupe on build).
const COPIES = {
  'switzerland-crete': [
    'google_interlaken_harderkulm_vista_01', 'google_interlaken_three_peaks_01', 'google_interlaken_lakethun_silhouette_01', 'google_harderkulm_platform_01', 'google_harderkulm_overlook_01',
    'google_lauterbrunnen_twilight_01', 'google_lauterbrunnen_wengen_pano_01', 'google_lauterbrunnen_chalets_01', 'google_lauterbrunnen_valley_overview_01', 'google_lauterbrunnen_valley_peaks_01',
    'google_jungfraujoch_sphinx_01', 'google_jungfraujoch_aletsch_01', 'google_jungfraujoch_summit_walk_01', 'google_jungfraujoch_peaks_01', 'google_jungfraujoch_patrouille_01',
    'google_first_cliffwalk_schreckhorn_01', 'google_bachalpsee_summer_01', 'google_first_cliffwalk_overhang_01', 'google_first_platform_eiger_01', 'google_bachalpsee_bluehour_01',
    'google_mannlichen_eiger_ridge_01', 'google_mannlichen_eiger_cloud_01', 'google_mannlichen_gondola_valley_01', 'google_mannlichen_valley_below_01', 'google_mannlichen_eiger_monch_01',
    'google_iseltwald_pier_01', 'google_brienz_boat_turquoise_01', 'google_brienz_sunset_sailboat_01', 'google_giessbach_falls_01', 'google_brienz_benches_sunset_01',
  ],
  'portugal-sicily': [
    'google_cefalu_larocca_beach_01', 'google_cefalu_aerial_01', 'google_cefalu_waterfront_01', 'google_cefalu_dusk_flickr_01', 'google_cefalu_rocca_trail_01',
    'google_taormina_isola_bella_01', 'google_taormina_mazzaro_01', 'google_isola_bella_kayak_01', 'google_taormina_coast_01', 'google_taormina_viewpoint_01',
    'google_etna_south_crater_01', 'google_etna_volcanic_trail_01', 'google_etna_sunset_photo_tour_01',
  ],
  'sicily-malta': [
    'google_etna_funivia_south_01',
    'google_ortigia_aerial_01', 'google_ortigia_golden_waterfront_01', 'google_ortigia_waterfront_01',
    'google_noto_baroque_dusk_01', 'google_noto_cathedral_01', 'google_fontane_bianche_shore_01',
  ],
};
fs.mkdirSync(imgDir, { recursive: true });
for (const [srcSlug, files] of Object.entries(COPIES)) {
  for (const f of files) {
    const from = path.join(root, 'assets/img', srcSlug, `${f}.jpg`);
    const to = path.join(imgDir, `${f}.jpg`);
    if (!fs.existsSync(from)) throw new Error(`missing source image: ${srcSlug}/${f}.jpg`);
    fs.copyFileSync(from, to);
  }
}

// ---- map -------------------------------------------------------------------
const mapColors = {
  berneroberland: '#1f6f78',
  transfer: '#c25a3a',
  ionian: '#3f7d4e',
  siracusa: '#3a6ea5',
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
  point('Catania Airport (CTA)', 37.4668, 15.0664, 'transfer', 'flight'),
  point('Taormina / Giardini-Naxos base', 37.8522, 15.2866, 'ionian', 'hotel'),
  point('Isola Bella + Mazzarò', 37.8508, 15.3007, 'ionian', 'beach'),
  point('Mount Etna — Rifugio Sapienza', 37.6995, 15.0021, 'ionian', 'hike'),
  point('Cefalù old town + La Rocca', 38.0394, 14.0229, 'ionian', 'town'),
  point('Siracusa / Ortigia base', 37.0613, 15.2933, 'siracusa', 'hotel'),
  point('Noto baroque old town', 36.8908, 15.0699, 'siracusa', 'town'),
  point('Fontane Bianche beach', 37.0217, 15.2694, 'siracusa', 'beach'),
  point('Catania Airport (CTA) — homebound', 37.4668, 15.0664, 'transfer', 'flight'),
];

// ---- Switzerland photos (self-hosted, reused from switzerland-crete) --------
const interlakenImages = [
  img('google_interlaken_harderkulm_vista_01.jpg', 'Harder Kulm', 'Kosala Bandara &middot; Google Images source', 'The Harder Kulm platform cantilevered above Interlaken between Lakes Thun and Brienz'),
  img('google_interlaken_three_peaks_01.jpg', 'The Big Three', 'Eric Y &middot; Google Images source', 'Eiger, Mönch and Jungfrau under a towering cumulus above Interlaken'),
  img('google_interlaken_lakethun_silhouette_01.jpg', 'Lake Thun Light', 'Ank Kumar &middot; Google Images source', 'Crepuscular sun rays breaking over Lake Thun and the Niesen pyramid'),
  img('google_harderkulm_platform_01.jpg', 'Two-Lakes View', 'MARCO POLO &middot; Google Images source', 'The Harder Kulm viewing platform with the snow peaks beyond'),
  img('google_harderkulm_overlook_01.jpg', 'Interlaken Below', 'Snuffy &middot; Google Images source', 'Interlaken and its turquoise river seen from the Harder Kulm overlook'),
];
const lauterbrunnenImages = [
  img('google_lauterbrunnen_twilight_01.jpg', 'Twilight Valley', 'Li Feng &middot; Google Images source', 'Lauterbrunnen valley at dusk with a silky river and snow peaks between the cliffs'),
  img('google_lauterbrunnen_wengen_pano_01.jpg', 'Valley Sweep', 'S. Lasiuk &middot; Google Images source', 'The Lauterbrunnen valley sweeping toward the Jungfrau from the Wengen side'),
  img('google_lauterbrunnen_chalets_01.jpg', 'Alpine Chalets', 'Ning Goldtranquil &middot; Google Images source', 'Traditional chalets under a towering cloud in the Lauterbrunnen valley'),
  img('google_lauterbrunnen_valley_overview_01.jpg', '72 Waterfalls', 'Jared Smith &middot; Google Images source', 'The Lauterbrunnen valley floor and Staubbach Falls seen from above'),
  img('google_lauterbrunnen_valley_peaks_01.jpg', 'Cliff Walls', 'JaZ99wro &middot; Google Images source', 'Snow peaks and a cliff waterfall closing the head of the Lauterbrunnen valley'),
];
const jungfraujochImages = [
  img('google_jungfraujoch_sphinx_01.jpg', 'Sphinx Summit', 'Kevin Poh &middot; Google Images source', 'The Sphinx Observatory perched on the rock spire at the Jungfraujoch'),
  img('google_jungfraujoch_aletsch_01.jpg', 'Aletsch Glacier', 'Hurni Christoph &middot; Google Images source', 'The Aletsch Glacier sweeping between peaks from the Top of Europe'),
  img('google_jungfraujoch_summit_walk_01.jpg', 'Top of Europe', 'Kosala Bandara &middot; Google Images source', 'Visitors on the snow saddle at the Jungfraujoch under a sunstar sky'),
  img('google_jungfraujoch_peaks_01.jpg', 'Jungfrau Massif', 'Hurni Christoph &middot; Google Images source', 'The snow-capped Jungfrau massif under a deep blue sky'),
  img('google_jungfraujoch_patrouille_01.jpg', 'Alpine Airshow', 'Hurni Christoph &middot; Google Images source', 'Patrouille Suisse jets streaking past the sun over the Jungfrau peaks'),
];
const firstImages = [
  img('google_first_cliffwalk_schreckhorn_01.jpg', 'First Cliff Walk', 'Craig Warner &middot; Google Images source', 'The First Cliff Walk on the cliff edge below the glaciated Schreckhorn'),
  img('google_bachalpsee_summer_01.jpg', 'Mirror Lake', 'Izakigur &middot; Google Images source', 'Summer peaks and clouds doubled in the Bachalpsee reflection'),
  img('google_first_cliffwalk_overhang_01.jpg', 'Under the Cliff', 'Robert Smrekar &middot; Google Images source', 'The First Cliff Walk ducking under a rock overhang toward the Eiger'),
  img('google_first_platform_eiger_01.jpg', 'Eiger Panorama', 'Michael Kemper &middot; Google Images source', 'Hikers on the First platform facing the Eiger north face'),
  img('google_bachalpsee_bluehour_01.jpg', 'Bachalpsee', 'Bugtris &middot; Google Images source', 'Snow peaks mirrored in a glass-still Bachalpsee at blue hour'),
];
const mannlichenImages = [
  img('google_mannlichen_eiger_ridge_01.jpg', 'Eiger From the Ridge', 'Jason Selby &middot; Google Images source', 'The Eiger north face from the Männlichen ridge trail under blue sky'),
  img('google_mannlichen_eiger_cloud_01.jpg', 'Cloud on the Eiger', 'Michael Kemper &middot; Google Images source', 'Cloud wrapping the Eiger above green Männlichen meadows'),
  img('google_mannlichen_gondola_valley_01.jpg', 'Gondola Descent', 'Kosala Bandara &middot; Google Images source', 'The Männlichen gondola descending toward the Lauterbrunnen valley'),
  img('google_mannlichen_valley_below_01.jpg', 'Valley Below', 'Kimon Berlin &middot; Google Images source', 'Wengen and the valley floor seen far below the Männlichen ridge'),
  img('google_mannlichen_eiger_monch_01.jpg', 'Eiger & Mönch', 'Jimmy Pierce &middot; Google Images source', 'The Eiger and Mönch rising beyond the Männlichen meadows'),
];
const brienzImages = [
  img('google_iseltwald_pier_01.jpg', 'Iseltwald Pier', 'John Wisdom &middot; Google Images source', 'The famous wooden Iseltwald pier reaching into turquoise Lake Brienz'),
  img('google_brienz_boat_turquoise_01.jpg', 'Brienz Boat', 'Eduardo Arostegui &middot; Google Images source', 'The decorated MS Brienz cruising the turquoise water of Lake Brienz'),
  img('google_brienz_sunset_sailboat_01.jpg', 'Golden Hour', 'Anthony Petter &middot; Google Images source', 'A sailboat on Lake Brienz at sunset with warm reflections'),
  img('google_giessbach_falls_01.jpg', 'Giessbach Falls', 'Svetlana Peric &middot; Google Images source', 'Giessbach Falls and its grand hotel above the Lake Brienz shore'),
  img('google_brienz_benches_sunset_01.jpg', 'Lakeside Sunset', 'Wolfgang Staudt &middot; Google Images source', 'Empty benches facing a golden Lake Brienz sunset near Iseltwald'),
];

// ---- Sicily photos (self-hosted, reused from portugal-sicily / sicily-malta) -
const cefaluImages = [
  img('google_cefalu_larocca_beach_01.jpg', 'Cefalù Beach', 'Damiano Giuliano &middot; Google Images source', 'Cefalù old town and beach at the foot of La Rocca'),
  img('google_cefalu_aerial_01.jpg', 'Cefalù Aerial', 'Alpitour &middot; Google Images source', 'Aerial view of Cefalù rooftops, harbor, and turquoise water'),
  img('google_cefalu_waterfront_01.jpg', 'Waterfront Beach', 'Experto Italy &middot; Google Images source', 'Cefalù beach backed by medieval waterfront houses'),
  img('google_cefalu_dusk_flickr_01.jpg', 'Cefalù Dusk', 'Naval S &middot; Google Images source', 'Cefalù waterfront and La Rocca at dusk from the sea'),
  img('google_cefalu_rocca_trail_01.jpg', 'Rocca Trail', 'BucketListly Blog &middot; Google Images source', 'The Rocca trail looking down over Cefalù and the Tyrrhenian coast'),
];
const taorminaImages = [
  img('google_taormina_isola_bella_01.jpg', 'Isola Bella', 'Antonino Bartuccio &middot; Google Images source', 'Isola Bella and Mazzarò Bay in clear turquoise water'),
  img('google_taormina_mazzaro_01.jpg', 'Mazzarò Bay', 'Celebrated Experiences &middot; Google Images source', 'Mazzarò Bay and Isola Bella from above in clear Ionian blue water'),
  img('google_isola_bella_kayak_01.jpg', 'Isola Bella Aerial', 'Katania.pl &middot; Google Images source', 'Aerial view of Isola Bella and Taormina coves in bright Ionian water'),
  img('google_taormina_coast_01.jpg', 'Taormina & Etna', 'CountryClubuk &middot; Google Images source', 'Taormina coast sweeping toward Mount Etna above the Ionian Sea'),
  img('google_taormina_viewpoint_01.jpg', 'Taormina View', 'Natalia Macheda &middot; Google Images source', 'Taormina rooftops and coastline seen from above with Etna in the distance'),
];
const etnaImages = [
  img('google_etna_south_crater_01.jpg', 'Etna Crater', 'Etna Lava &middot; Google Images source', 'Red and black volcanic craters on the Etna south slope'),
  img('google_etna_volcanic_trail_01.jpg', 'Volcanic Trail', 'Go-Etna &middot; Google Images source', 'Ash road and volcanic cones on Mount Etna beneath a blue sky'),
  img('google_etna_funivia_south_01.jpg', 'Funivia dell’Etna', 'Etna Cable Car &middot; Google Images source', 'The Funivia dell’Etna cable car climbing the south slope above the lava fields'),
  img('google_etna_sunset_photo_tour_01.jpg', 'Etna Sunset', 'Giancarlo Tine &middot; Google Images source', 'Mount Etna lava fields and pine forest in golden-hour light'),
];
const ortigiaImages = [
  img('google_ortigia_waterfront_01.jpg', 'Ortigia Waterfront', 'Michele Ponzio &middot; Google Images source', 'Ortigia waterfront with pale buildings and transparent turquoise water'),
  img('google_ortigia_golden_waterfront_01.jpg', 'Golden Hour', 'Home Ortigia &middot; Google Images source', 'The Ortigia island waterfront glowing gold at the end of the day'),
  img('google_ortigia_aerial_01.jpg', 'Ortigia Island', 'Visit Siracusa &middot; Google Images source', 'The island of Ortigia and Siracusa’s harbor from the air'),
];
const notoImages = [
  img('google_noto_baroque_dusk_01.jpg', 'Noto at Dusk', 'Home Ortigia &middot; Google Images source', 'Noto Baroque buildings glowing at dusk'),
  img('google_noto_cathedral_01.jpg', 'Noto Cathedral', 'Visit Sicily &middot; Google Images source', 'Noto cathedral and golden Baroque facades under blue sky'),
  img('google_fontane_bianche_shore_01.jpg', 'Fontane Bianche', 'Val di Noto &middot; Google Images source', 'Clear Fontane Bianche water with rocks and white sand'),
];

// ---- Switzerland spots (prose verbatim from the switzerland-crete sibling) --
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
    '<b>Skip entirely and bank the ~$640</b> toward the Sicily leg if weather never cooperates.',
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
  climate: '<b>Glacier-fed, ~57–64°F in June.</b> The vivid turquoise comes from glacial rock flour — but this is a <b>look-don’t-swim</b> lake in June; kids can wade, full swimming waits for the Sicily leg. Official swim season is really July–August.',
  save: 'Do the free Iseltwald village lanes and the short lakeshore, ride one boat leg rather than the full loop, and let the swimming happen in Sicily.',
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

// ---- Sicily spots (prose reused/adapted from the Sicily siblings) ----------
const taorminaSpot = mkSpot({
  name: 'Taormina old town + Isola Bella first swim',
  tags: ['taormina', 'isolabella', 'mazzaro'],
  carouselId: 'c-taor',
  images: taorminaImages,
  lat: 37.8522,
  lng: 15.2866,
  cost: 'The Ancient Theatre is EUR 14 adult / EUR 7 reduced (official). Isola Bella beach access is free; a sunbed/umbrella set at the paid strands runs ~EUR 20–35, and the little cable car from Taormina down to Mazzarò is ~EUR 3 each way. A relaxed town-plus-swim day lands well under the mountain-day costs.',
  climateLabel: 'Weather',
  climate: '<b>Ionian coast, mid-June:</b> warm to hot days in the upper 70s–low 80s F, with sea around <b>72–75°F</b>. This is the first real swim of the trip after the look-only Swiss lakes — Isola Bella’s sheltered cove is calm and kid-friendly.',
  save: 'Stay in Giardini-Naxos below Taormina and use the cable car or bus up; skip old-town parking and lodging premiums, and swim at the free ends of Isola Bella.',
  splurge: 'The Greek Theatre at golden hour with Etna smoking behind the stage, then an Isola Bella boat-and-swim stop — budget ~$120–$250 for the family depending on the tour.',
  restos: [
    '<b>Da Cristina (Taormina)</b> — arancini, pizza slices and quick fried comfort food the kids will eat',
    '<b>Bam Bar (Taormina)</b> — the famous granita-and-brioche stop for an easy snack win',
    '<b>Giardini-Naxos seafront</b> — broad pizza, pasta, burger and beach-lunch options if Taormina menus skew too adult',
  ],
  alts: [
    '<b>Giardini-Naxos beach</b> — easier logistics and lower prices if Taormina is crowded.',
    '<b>Alcantara Gorge</b> — cool basalt canyon and water play if the coast is too hot.',
    '<b>Castelmola</b> — the hilltop village above Taormina for views without a beach afternoon.',
  ],
  blogs: [
    { label: 'Official theatre tickets', href: 'https://parchiarcheologici.regione.sicilia.it/naxos-taormina/en/biglietti/teatro-antico-di-taormina-2/' },
    { label: 'Taormina theatre guide', href: 'https://www.traveltaormina.com/en/monuments/greek-theatre-taormina.html' },
  ],
});

const etnaSpot = mkSpot({
  name: 'Mount Etna south slope (Rifugio Sapienza)',
  tags: ['mountetna', 'etna', 'sicily'],
  carouselId: 'c-etna',
  images: etnaImages,
  lat: 37.6995,
  lng: 15.0021,
  cost: 'The free Silvestri craters at Rifugio Sapienza (~1,900 m) are the budget plan and plenty for the 8-year-old. Going higher: the Funivia dell’Etna cable car has been reported around EUR 50 adult / EUR 30 kids 5–10; adding the 4x4 + guide to ~2,900 m can push a family toward EUR 250–320. Buy the upper-mountain options only on a clear morning.',
  climateLabel: 'Mountain',
  climate: '<b>Volcano day:</b> cooler and much windier than the coast, often 15–20°F below the beach even in June. Visibility drives the value — do not pay for the summit options if clouds or ash are rolling in. Closed shoes and a windbreaker are non-negotiable on the ash.',
  save: 'Walk the Silvestri craters for free, then bank the cable-car money for a beach dinner or an Ortigia boat later.',
  splurge: 'Cable car + 4x4 to the high craters on a clear morning — the 13-year-old will get far more out of the lunar-landscape summit than the 8-year-old.',
  restos: [
    '<b>Rifugio Sapienza bar/restaurant</b> — pasta, panini and fries at the cable-car base',
    '<b>Nicolosi town (on the drive up)</b> — pizzerias and simple trattorias with plain pasta',
    '<b>Pack a picnic</b> — smartest on a mountain day; eat a proper dinner back on the coast',
  ],
  alts: [
    '<b>Alcantara Gorge</b> — cool-water nature day if Etna weather is poor or crater access is restricted.',
    '<b>Etna wine-country back roads</b> — lava-soil vineyards and villages for a gentler volcano day.',
    '<b>Letojanni beach</b> — swap to a lower-key beach town north of Taormina if the mountain is socked in.',
  ],
  blogs: [
    { label: 'Etna cable-car price proxy', href: 'https://www.sicilyactive.com/en/mount-etna-cable-car' },
    { label: 'Etna 4x4 price proxy', href: 'https://guidevulcanologicheetna.it/en/prices-update-of-the-etnas-cableway/' },
  ],
  alltrailsTrail: 'https://www.alltrails.com/trail/italy/sicily/crateri-silvestri-superiori-monti-calcarazzi',
});

const cefaluSpot = mkSpot({
  name: 'Cefalù old town + beach + La Rocca',
  tags: ['cefalu', 'larocca', 'sicily'],
  carouselId: 'c-cefalu',
  images: cefaluImages,
  lat: 38.0394,
  lng: 14.0229,
  cost: 'The old town, cathedral square and beach are free. La Rocca urban park is EUR 5 full / EUR 2.50 reduced ages 6–14 — about EUR 15 for the family. This is the trip’s one long drive (~2h40 each way from the Taormina base), so it is a full headline day, not a half-day add-on.',
  climateLabel: 'Weather',
  climate: '<b>Tyrrhenian north coast, mid-June:</b> warm coastal days in the upper 70s–low 80s F, with sea around <b>72–75°F</b> — the golden-crescent town beach sits right under the medieval waterfront. Start La Rocca early before the midday heat on the exposed climb.',
  save: 'Make the day nearly free: town beach, cathedral square, sunset harbor and a grocery breakfast, with La Rocca only if the morning is cool.',
  splurge: 'Rent a beach set on the old-town sand or take a short coastal boat outing; confirm the chair/umbrella price before sitting.',
  restos: [
    '<b>Bottega Tivitti</b> — seafront pizzeria with pizza, burgers and fries',
    '<b>Pasta e Pasti</b> — casual pasta counter where plain tomato pasta works',
    '<b>’Nna Principi</b> — Italian/pizza spot with Margherita and penne on the menu',
  ],
  alts: [
    '<b>Skip the drive</b> — do Castelmola + Alcantara Gorge near the Taormina base instead if a 5-hour round-trip is too much.',
    '<b>Campofelice di Roccella</b> — better-value beach with parking a few minutes east of Cefalù.',
    '<b>Mondello Beach</b> — the classic Palermo swim if you push all the way west.',
  ],
  blogs: [
    { label: 'La Rocca practical guide', href: 'https://travelmademedoit.com/rocca-di-cefalu/' },
    { label: 'Cefalù restaurant ideas', href: 'https://savoringsicily.com/restaurants-in-cefalu/' },
  ],
});

const notoSpot = mkSpot({
  name: 'Noto baroque + Fontane Bianche swim',
  tags: ['noto', 'fontanebianche', 'valdinoto'],
  carouselId: 'c-noto',
  images: notoImages,
  lat: 36.8908,
  lng: 15.0699,
  cost: 'Noto’s streets and church exteriors are free; the cathedral roof and selected palazzi run ~EUR 3–8 pp. Fontane Bianche lido sets are ~EUR 25–45, or the free public stretches cost nothing. This is the relocation day south from Taormina to the Siracusa base, done as a stop-and-swim rather than a straight drive.',
  climateLabel: 'June weather',
  climate: '<b>Southeast Sicily, Jun 18:</b> air ~<b>80–84°F</b>, and the sea off Fontane Bianche is usually <b>73–75°F</b> — the warmest, sandiest kid swim of the trip, with less crowding than late June. Do baroque Noto early before the tour-bus heat, then hit the water.',
  save: 'Tour Noto in the cooler morning, then use the free public beach at Fontane Bianche after the heat builds.',
  splurge: 'Reserve a Fontane Bianche beach-club set so shade, loungers and bathrooms are solved for the afternoon.',
  restos: [
    '<b>Caffè Sicilia / Corrado Costanzo (Noto)</b> — legendary granita and pastries for an easy kid stop',
    '<b>Trattorias off Corso Vittorio Emanuele</b> — pasta alla Norma and pizza in baroque Noto',
    '<b>Fontane Bianche lidos</b> — beach-bar pizza, panini and fries within reach of the sand',
  ],
  alts: [
    '<b>Marzamemi</b> — postcard fishing village with easy snacks and a short wander.',
    '<b>Vendicari Reserve</b> — nature-and-beach mix if the family wants a wilder coast.',
    '<b>Ragusa Ibla</b> — a second baroque town if Noto whets the appetite.',
  ],
  blogs: [
    { label: 'Noto day-trip guide', href: 'https://www.alongdustyroads.com/posts/things-to-do-noto-sicily' },
    { label: 'Fontane Bianche beach notes', href: 'https://www.thethinkingtraveller.com/italy/sicily/beaches/fontane-bianche' },
  ],
});

const ortigiaSpot = mkSpot({
  name: 'Ortigia + Siracusa waterfront',
  tags: ['ortigia', 'siracusa', 'sicily'],
  carouselId: 'c-ortigia',
  images: ortigiaImages,
  lat: 37.0613,
  lng: 15.2933,
  cost: 'Walking Ortigia is free; a small boat loop around the island’s sea caves is usually ~EUR 20–30 adult / discounted child, and paid lots near Talete handle the car. The Neapolis archaeological park (Greek theatre, Ear of Dionysius) is ~EUR 13 adult if you add it.',
  climateLabel: 'June weather',
  climate: '<b>Ortigia island, mid-June:</b> air ~<b>80–84°F</b>, sea ~<b>73–75°F</b>. The old-town lanes hold shade through the heat, and the swimming ladders off the Ortigia rocks (Forte Vigliena) are a warm, deep, grown-up swim to pair with the day.',
  save: 'Park off-island near Talete and walk in; deep-Ortigia driving risks the ZTL zone and luggage stress.',
  splurge: 'A sunset private boat around the Ortigia sea caves, roughly EUR 180–300 for the boat, is the memorable Siracusa splurge.',
  restos: [
    '<b>Antica Pizzeria da Michele (Ortigia)</b> — Neapolitan pizza, ~$12–20 pp',
    '<b>A Putia delle Cose Buone</b> — pasta and sandwich plates, lively and casual',
    '<b>Sicilia in Tavola</b> — fresh pasta with familiar pizza-adjacent options',
  ],
  alts: [
    '<b>Fontane Bianche</b> — sandier, easier kid swim 25–30 min south if Ortigia’s rock ladders are too much.',
    '<b>Neapolis archaeological park</b> — Greek theatre and the Ear of Dionysius for a culture morning.',
    '<b>Marzamemi</b> — a low-key fishing-village dinner run down the coast.',
  ],
  blogs: [
    { label: 'Siracusa with kids', href: 'https://mamalovesitaly.com/syracuse-sicily-with-kids/' },
    { label: 'Ortigia food & walking guide', href: 'https://www.amsterdamfoodie.nl/2025/ortigia-restaurants/' },
  ],
});

// ---- itinerary: 12 hotel nights (Berner Oberland 5 + Sicily 7) -------------
const days = [
  day('day0', 'c0', '0', 'Tue &middot; Jun 8', 'Depart Pittsburgh after work', 'Overnight to Zurich', 'Est. $90 &middot; airport meals', [
    fact('Sleep', 'Overnight flight'),
    fact('Route target', 'PIT -> EWR/IAD/FRA/MUC/LHR -> ZRH'),
    fact('Constraint', 'In Pittsburgh all day Jun 24-26; Jun 23 return is allowed'),
  ], 'Open-jaw ticket: fly into Zurich, home from Catania. PIT has no transatlantic nonstop, so plan one clean European connection into ZRH.', [], 'Travel day - position toward Zurich.'),

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
  ], 'A gentler finale to the Swiss block: the short Männlichen Royal Walk for the big three-peak panorama without a hard hike, then down to glacier-turquoise Lake Brienz and the Iseltwald pier. Pack for the Catania flight tomorrow.', [mannlichenSpot, brienzSpot]),

  day('day6', 'c0', '6', 'Mon &middot; Jun 14', 'Fly Zurich -> Catania', 'Alps to the Ionian, new base at Taormina', 'Est. $240 &middot; flight, car, dinner', [
    fact('Sleep', 'Taormina / Giardini-Naxos &middot; night 1 of 7'),
    fact('Flight', 'ZRH -> CTA (Catania) nonstop ~2h (SWISS/Edelweiss seasonal)'),
    fact('Transfer', 'CTA -> Taormina ~50 min by rental car'),
  ], 'Fly into Catania — a major airport with far more capacity and cleaner US connections than a Greek island field — pick up the Sicily rental car, and drive up the Ionian coast to the Taormina base. No weekly-flight gamble here.', [], 'Travel day - train to Zurich airport, fly to Catania, drive to Taormina.'),

  day('day7', 'c2', '7', 'Tue &middot; Jun 15', 'Taormina + Isola Bella', 'Greek theatre, first warm swim', 'Est. $180 &middot; theatre, beach, dinner', [
    fact('Sleep', 'Taormina / Giardini-Naxos &middot; night 2 of 7'),
    fact('Anchor', 'Ancient Theatre + Isola Bella / Mazzarò swim'),
    fact('Payoff', 'Sea ~73°F — the warm water the whole trip was built around'),
  ], 'This is why Sicily is the partner leg: the cold Swiss lakes give way to a ~73°F Ionian. Ease in with the Greek theatre and Etna backdrop, then the sheltered Isola Bella cove for the first real swim.', [taorminaSpot]),

  day('day8', 'c2', '8', 'Wed &middot; Jun 16', 'Mount Etna south slope', 'Europe’s biggest volcano, kid route', 'Est. $220 &middot; craters, cable car, dinner', [
    fact('Sleep', 'Taormina / Giardini-Naxos &middot; night 3 of 7'),
    fact('Anchor', 'Free Silvestri craters + optional Funivia cable car'),
    fact('Weather rule', 'Buy the summit options only on a clear morning'),
  ], 'The volcano day: walk the free Silvestri craters at Rifugio Sapienza, and add the Funivia dell’Etna cable car (and 4x4 for the fit) only if the sky is clear. Cooler and windier than the coast — pack layers.', [etnaSpot]),

  day('day9', 'c2', '9', 'Thu &middot; Jun 17', 'Cefalù old town + beach', 'North-coast headline day, La Rocca', 'Est. $170 &middot; La Rocca, beach, dinner', [
    fact('Sleep', 'Taormina / Giardini-Naxos &middot; night 4 of 7'),
    fact('Anchor', 'Cefalù golden-crescent beach + La Rocca climb'),
    fact('Note', 'The trip’s one long drive (~2h40 each way) — a full day'),
  ], 'The postcard north-coast town: a medieval waterfront over a golden-crescent beach, with the La Rocca clifftop climb for the view. It is the leg’s one long drive, so it is a full headline day — or swap for Castelmola + Alcantara closer to base.', [cefaluSpot]),

  day('day10', 'c3', '10', 'Fri &middot; Jun 18', 'Noto baroque + Fontane Bianche', 'Juneteenth observed: relocate south + swim', 'Est. $160 &middot; Noto, beach, dinner', [
    fact('Sleep', 'Siracusa / Ortigia &middot; night 5 of 7'),
    fact('Holiday', 'Juneteenth observed Fri Jun 18 for many employers'),
    fact('Anchor', 'Baroque Noto + Fontane Bianche warm swim'),
  ], 'The relocation day, done as a stop-and-swim: golden baroque Noto in the cool morning, the warm sandy shallows of Fontane Bianche in the afternoon, then into the Siracusa base. Uses the Juneteenth observed day so it costs no PTO.', [notoSpot]),

  day('day11', 'c2', '11', 'Sat &middot; Jun 19', 'Ortigia + Siracusa waterfront', 'Island old town, sea-cave boat', 'Est. $180 &middot; boat, town, dinner', [
    fact('Sleep', 'Siracusa / Ortigia &middot; night 6 of 7'),
    fact('Morning', 'Ortigia lanes, Piazza Duomo, market'),
    fact('Afternoon', 'Sea-cave boat + a swim off the Ortigia rocks'),
  ], 'The Siracusa headliner: the honey-stone island of Ortigia, its Piazza Duomo and market, a boat around the sea caves, and a warm deep swim off the rock ladders. Add the Neapolis Greek theatre if the family wants the archaeology.', [ortigiaSpot]),

  day('day12', 'c2', '12', 'Sun &middot; Jun 20', 'Siracusa send-off', 'Calm last beach + old-town evening', 'Est. $150 &middot; beach, market, dinner', [
    fact('Sleep', 'Siracusa / Ortigia &middot; night 7 of 7'),
    fact('Default', 'Slow Fontane Bianche / Ortigia beach morning'),
    fact('Evening', 'Last Ortigia passeggiata and dinner'),
  ], 'Protect the homebound flight: the default is a calm last swim at Fontane Bianche or off the Ortigia rocks, an easy market lunch, and a final old-town evening — nothing that risks the early Monday drive to Catania.', []),

  day('day13', 'c0', '13', 'Mon-Tue &middot; Jun 21-22', 'Fly Catania -> Pittsburgh', 'Home before the blackout', 'Est. $120 &middot; airport meals', [
    fact('Sleep', 'Home by Tue Jun 22'),
    fact('Route target', 'CTA -> European hub -> PIT'),
    fact('Schedule', 'Home by Tue Jun 22, ahead of the Jun 23 preference'),
  ], 'Fly out of Catania — which connects cleanly through Rome, Munich, Frankfurt or Zurich — and land home by Tue Jun 22, ahead of the preferred Jun 23 return and safely before the required full days in Pittsburgh on Jun 24-26.', [], 'Travel day - leave Sicily Monday Jun 21, arrive Pittsburgh by Tuesday Jun 22.'),
];

const previewImages = [
  [`../../assets/img/${slug}/google_lauterbrunnen_twilight_01.jpg`, 'Day 2 &middot; Thu Jun 10', 'Lauterbrunnen valley', 'The waterfall valley at twilight opens the Alpine half.'],
  [`../../assets/img/${slug}/google_jungfraujoch_sphinx_01.jpg`, 'Day 3 &middot; Fri Jun 11', 'Jungfraujoch', 'Top of Europe at 3,454 m on the clearest morning.'],
  [`../../assets/img/${slug}/google_first_cliffwalk_schreckhorn_01.jpg`, 'Day 4 &middot; Sat Jun 12', 'Grindelwald-First', 'The Cliff Walk cantilevered against the Eiger.'],
  [`../../assets/img/${slug}/google_brienz_sunset_sailboat_01.jpg`, 'Day 5 &middot; Sun Jun 13', 'Lake Brienz', 'Glacier-turquoise water before the flight south.'],
  [`../../assets/img/${slug}/google_taormina_isola_bella_01.jpg`, 'Day 7 &middot; Tue Jun 15', 'Taormina', 'Isola Bella and the first warm Ionian swim.'],
  [`../../assets/img/${slug}/google_etna_south_crater_01.jpg`, 'Day 8 &middot; Wed Jun 16', 'Mount Etna', 'Europe’s biggest volcano on the kid route.'],
  [`../../assets/img/${slug}/google_cefalu_aerial_01.jpg`, 'Day 9 &middot; Thu Jun 17', 'Cefalù', 'The golden-crescent beach under the medieval town.'],
  [`../../assets/img/${slug}/google_ortigia_waterfront_01.jpg`, 'Day 11 &middot; Sat Jun 19', 'Ortigia', 'The honey-stone island old town of Siracusa.'],
];

const oldPart0 = template.parts[0].html;
const afterBody = oldPart0.indexOf('</head><body>') + '</head><body>'.length;
const navStart = oldPart0.indexOf('<nav class="site-nav"');
const overviewStart = oldPart0.indexOf('<section id="overview"');
const headBody = oldPart0.slice(0, afterBody)
  .replace(/<title>.*?<\/title>/, '<title>Switzerland + Sicily &middot; Berner Oberland to Taormina &mdash; June 2027</title>');
const navToMain = oldPart0.slice(navStart, overviewStart)
  .replace('      <a href="#photo-guide">Photo Guide</a>\n      <a href="#food-guide">Food Guide</a>\n', '');

const preview = `<section class="preview">
  <div class="pv-pane">
    <span class="pv-kicker">Family Trip &middot; Jun 8&ndash;22, 2027</span>
    <h1>Switzerland + Sicily<span>Berner Oberland to Taormina</span></h1>
    <p class="pv-lead">Twelve hotel nights splitting the two things a family trip usually has to choose between: five nights of Alps &mdash; Jungfraujoch, the Grindelwald-First Cliff Walk, Lauterbrunnen&rsquo;s waterfalls &mdash; then seven nights of warm Ionian swimming in Sicily, from Taormina&rsquo;s Isola Bella to Fontane Bianche. The cold Swiss lakes are covered by a 73&deg;F Mediterranean and Mount Etna&rsquo;s volcano day.</p>
    <div class="pv-stats"><div><b>12</b><span>Hotel nights</span></div><div><b>2</b><span>Home bases</span></div><div><b>18</b><span>Stops mapped</span></div><div><b>$14.0k</b><span>priced target</span></div></div>
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
      <h2>The scenic Alps, rescued for swimming by warm-water Sicily</h2>
      <p>Switzerland alone fails the family swim test &mdash; June lakes are 57&ndash;64&deg;F &mdash; and it is expensive enough to strain the budget on its own. This plan keeps the Alpine payoff to a tight <b>5-night Berner Oberland block</b>, then spends <b>7 nights in eastern Sicily</b> where the Ionian sea is ~73&deg;F. The route flies into Zurich, home from Catania, and protects the required full days in Pittsburgh on <b>Jun 24-26</b>.</p>
    </div>
    <div class="overview">
      <div class="ocard"><p class="eyebrow">Route</p><h4>PIT -> Zurich -> Berner Oberland -> Sicily -> PIT</h4><p><b>5 nights Interlaken/Lauterbrunnen</b> (rail, no car), then <b>7 nights Sicily</b> across Taormina and Siracusa (rental car). Open-jaw ticket; home by Tue Jun 22.</p></div>
      <div class="ocard"><p class="eyebrow">Why the split</p><h4>Neither leg works alone</h4><p>Switzerland has no warm swimming and a brutal cost curve; Sicily has no Alps. Together they cover water, mountains, a live volcano, towns, and two very different countries in one 12-night trip.</p></div>
      <div class="ocard"><p class="eyebrow">Budget truth</p><h4>Priced target ~$14,000; high case ~$19,350</h4><p>This is the honest number: Switzerland is expensive. The target is above the $12k goal and the high case is well above the $15k preferred maximum. Budget is the axis this trip sacrifices.</p></div>
    </div>
  </section>

  <section id="why-this-trip" class="divider">
    <div class="section-label">
      <p class="eyebrow">Why This Trip</p>
      <h2>The most scenic contrast on the board, with an easier landing than Crete</h2>
      <p>Few plans swing from a 3,454 m glacier summit to a live volcano and a warm lagoon in the same week. The price of that contrast is cost and one extra country of logistics &mdash; but Catania&rsquo;s strong connections make the Sicily half less fragile than a Greek-island leg.</p>
    </div>
    <div class="plan-grid">
      ${card('The Alps, kept tight', `<p>Five nights is exactly enough for Jungfraujoch, the Grindelwald-First Cliff Walk, Lauterbrunnen&rsquo;s waterfalls, and one easy panorama ridge &mdash; without letting Switzerland&rsquo;s daily cost run for two weeks.</p>`)}
      ${card('Sicily does the swimming', `<p>The whole reason for the split. Isola Bella, Fontane Bianche, and Cefalù deliver the ~73&deg;F warm-water week the Swiss lakes never could, plus Mount Etna&rsquo;s volcano day and baroque Ortigia.</p>`)}
      ${card('The honest tradeoff', `<p>This is one of the priciest plans on the board and it carries two-country, open-jaw logistics. You are buying unmatched variety and scenery, and paying for it in budget and one more moving part.</p>`)}
    </div>
  </section>

  <section id="stays" class="divider">
    <div class="section-label">
      <p class="eyebrow">Where We Stay</p>
      <h2>Three bases, two very different rhythms</h2>
      <p>Switzerland is rail-based from a single valley base; Sicily is a rental-car leg split between an Ionian base at Taormina and a southeast base at Siracusa. No airport-buffer night is needed &mdash; the homebound flies from Catania.</p>
    </div>
    <div class="plan-grid">
      ${card('Berner Oberland &middot; 5 nights', `${prow('Target', 'Lauterbrunnen or Interlaken 2-bedroom apartment &middot; $180-$280/night')}${prow('Why', 'Central to Jungfrau railways, First, Männlichen, and the lakes; no car needed')}${prow('Add', 'Tourist tax ~CHF 3/person/night on top')}`)}
      ${card('Taormina area &middot; 4 nights', `${prow('Target', 'Giardini-Naxos or Taormina apartment &middot; $150-$210/night')}${prow('Why', 'Base for Isola Bella, Etna, and the Cefalù north-coast day')}${prow('Car', 'Rental picked up at CTA on arrival')}`)}
      ${card('Siracusa / Ortigia &middot; 3 nights', `${prow('Target', 'Ortigia or near-Talete apartment &middot; $140-$200/night')}${prow('Why', 'Walk to Ortigia, swim off the rocks, day-trip Noto & Fontane Bianche')}${prow('Homebound', 'Drive Siracusa -> CTA ~1h on the last morning')}`)}
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
      ['Mon Jun 14', 'travel', 'Zurich -> Catania', 'Fly to Sicily, drive to Taormina'],
      ['Tue Jun 15-Thu Jun 17', '3', 'Taormina', 'Isola Bella, Etna, Cefalù'],
      ['Fri Jun 18-Sun Jun 20', '4', 'Siracusa / Ortigia', 'Noto, Fontane Bianche, Ortigia'],
      ['Mon-Tue Jun 21-22', 'Home', 'Catania -> PIT', 'Arrive before blackout'],
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
        <button data-region="berneroberland"><span class="sw" style="background:#1f6f78"></span>Berner Oberland</button><button data-region="ionian"><span class="sw" style="background:#3f7d4e"></span>East Sicily</button><button data-region="siracusa"><span class="sw" style="background:#3a6ea5"></span>Siracusa / south</button><button data-region="transfer"><span class="sw" style="background:#c25a3a"></span>Flights</button><button data-region="all">Whole trip</button>
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
      <h2>Open-jaw: into Zurich, home from Catania</h2>
      <p>Research status: 2027 schedules are not yet bookable, so current 2026 route and fare signals are planning proxies. No live 2027 open-jaw quote exists &mdash; the number below is arithmetic on verified 2026 legs. Re-quote on ITA Matrix once inventory opens.</p>
    </div>
    <div class="plan-grid">
      ${card('PIT -> Zurich', `${prow('Reality', 'No PIT transatlantic nonstop; one clean Europe connection')}${prow('Corridors', 'EWR/IAD (United/SWISS), FRA/MUC (Lufthansa), or LHR (BA)')}${prow('Fare signal', '~$950-$1,300 pp target; $1,400-$2,000 high')}`)}
      ${card('Catania -> PIT (open-jaw)', `${prow('Preferred', 'CTA -> FCO/MUC/FRA/ZRH -> PIT')}${prow('Why easier than Crete', 'Catania is a major airport with far more US-connecting capacity than a Greek island field')}${prow('Fare signal', '~$1,250-$1,700 pp (verified Sicily-return band)')}`)}
      ${card('Zurich -> Catania hop', `${prow('Best option', 'SWISS/Edelweiss ZRH -> CTA nonstop ~2h, seasonal summer service')}${prow('Backup', 'ITA/Lufthansa via FCO/MUC if the nonstop day does not match')}${prow('Family fare', '$900-$1,700 round-trip equivalent one-way pair')}`)}
      ${card('Open-jaw total', `${prow('Target', '~$4,400-$5,600 family transatlantic (HRT construction)')}${prow('High', '~$6,400-$8,000 if booked late or summer demand runs hot')}${prow('ETIAS', 'Mandatory by Jun 2027; ~$22/person, both Schengen legs')}`)}
    </div>
  </section>

  <section id="getting-around" class="divider">
    <div class="section-label">
      <p class="eyebrow">Getting Around</p>
      <h2>Rail in Switzerland, one rental car in Sicily</h2>
      <p>No Swiss rental car: the Jungfrau Railways network reaches everything in the Berner Oberland. A regional pass covers the base trains; mountain excursions are separate. Sicily is a rental-car leg from Catania.</p>
    </div>
    <div class="plan-grid">
      ${card('Swiss rail + passes', `${prow('Likely best', 'Berner Oberland Regional Pass over the Swiss Travel Pass for a region-only trip')}${prow('Kids', 'Free with a Swiss Family Card (get it at any SBB station)')}${prow('Verify', 'Jungfraujoch discount differs by pass — reconfirm before buying')}`)}
      ${card('Sicily car', `${prow('Pickup/drop', 'CTA Jun 14 -> CTA Jun 21 (round-trip from Catania)')}${prow('Budget', '$450-$650 plus fuel; book an automatic early')}${prow('Why', 'Etna, Cefalù, Noto, Fontane Bianche all need a car')}`)}
      ${card('The one long drive', `${prow('Cefalù day', '~2h40 each way from the Taormina base')}${prow('ZTL warning', 'Avoid driving into Taormina and Ortigia old-town ZTL zones')}${prow('Relocation', 'Taormina -> Siracusa ~1h20, done as the Noto stop-and-swim day')}`)}
    </div>
  </section>`;

const healthTiming = `<section id="health-check" class="divider">
    <div class="section-label">
      <p class="eyebrow">Plan Health-Check</p>
      <h2>What to lock, watch, and expect</h2>
      <p>Current research refreshed July 2026 for a June 2027 trip. Kids assumed 13 and 8.</p>
    </div>
    <div class="hc-grid">
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The contrast is the point</h4><p>A 3,454 m glacier summit, a live volcano, and a warm lagoon in one 12-night trip is unmatched variety. The split exists specifically so Sicily&rsquo;s warm sea covers the cold Swiss lakes.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The Pittsburgh dates are protected</h4><p>Depart Tue Jun 8, fly home Mon Jun 21, arrive by Tue Jun 22 &mdash; ahead of the preferred Jun 23 return and the required full days Jun 24-26.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>Catania de-risks the Sicily half</h4><p>Unlike a weekly Greek-island nonstop, Catania is a major airport with frequent Zurich links and clean US connections through Rome, Munich or Frankfurt. That is why this plan&rsquo;s route risk sits a notch above the Crete twin.</p></div>
      <div class="hc actnow"><span class="hc-tag">Cost</span><h4>Budget is the real cost</h4><p>Target ~$14,000 is above the $12k goal, and the high case ~$19,350 is well past the $15k preferred maximum. Switzerland drives this; there is no cheap version of a Jungfrau week.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Swiss weather can eat a marquee day</h4><p>Lauterbrunnen sees rain on well over half of June days, and Jungfraujoch can white out. Jungfraujoch and First are deliberately swappable to chase the clearest morning.</p></div>
      <div class="hc good"><span class="hc-tag">By design</span><h4>Swimming is in Sicily, not Switzerland</h4><p>Lake Brienz is a look-don&rsquo;t-swim lake in June, and that is the accepted split tradeoff: the Alpine leg earns its place on epic scenery and hiking, while Sicily carries the warm-water week. Every real swim day is on the Sicilian coast.</p></div>
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
      ['Aug 1-14', '12+', '9-10 days', 'Valid', 'Hotter in Sicily, pricier, peak crowds'],
    ])}
    <div class="verdict-box" style="border-left-color:var(--c3);margin-top:18px"><h4>PTO math</h4><p>Friday Jun 18 is Juneteenth observed for many US employers, so it costs no PTO. Likely PTO days: Jun 9, 10, 11, then Jun 14, 15, 16, 17, then Jun 21 travel &mdash; about <b>8 PTO days</b>, with weekends Jun 12-13 and 19-20 free. The plan is home a day ahead of the preferred Jun 23 return and clear of the required Pittsburgh days Jun 24-26.</p></div>
  </section>`;

const budgetTips = `<section id="budget" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Money</p>
      <h2>Budget, savers &amp; splurges</h2>
      <p>Real priced planning band using 2026 route/fare/lodging signals because June 2027 inventory is not live. USD, family of four. This is among the priciest plans on the board &mdash; the numbers are honest about that.</p>
    </div>
    ${table(['Line item', 'Target case', 'High case'], [
      ['PIT -> Zurich / Catania -> PIT open-jaw airfare', '$5,200', '$7,200'],
      ['Zurich -> Catania intra-Europe hop', '$1,000', '$1,700'],
      ['Lodging: Berner Oberland 5 nights', '$1,150', '$1,450'],
      ['Lodging: Sicily 7 nights (Taormina + Siracusa)', '$1,080', '$1,400'],
      ['Swiss rail pass + Jungfraujoch/First/Männlichen/boat', '$2,150', '$2,650'],
      ['Sicily car, fuel, Etna, Ortigia boat, beach sets', '$820', '$1,150'],
      ['Food and groceries, 13 travel days', '$2,100', '$2,700'],
      ['Insurance, ETIAS, fees, misc buffer', '$500', '$1,100'],
      ['<b>Grand total</b>', '<b>$14,000</b>', '<b>$19,350</b>'],
    ])}
    <div class="twocol">
      <div class="listcard save-list"><h4>Save money</h4><ul><li>Cook in the apartments &mdash; Swiss restaurant meals run CHF 20-50/person.</li><li>Buy the Grindelwald-side Jungfraujoch ticket and free Junior/Family cards before you go.</li><li>Skip Harder Kulm if the funicular fare is high; the free Höheweg gives the town view.</li><li>Walk Etna&rsquo;s free Silvestri craters instead of buying the cable car on a cloudy day.</li><li>Swap the long Cefalù drive for Castelmola + Alcantara near base if fuel and hours matter.</li></ul></div>
      <div class="listcard splurge-list"><h4>Worth the splurge</h4><ul><li>Jungfraujoch in full on a clear day &mdash; the once-in-a-lifetime summit.</li><li>The First adventure package: zipline, glider, and mountain carts for the kids.</li><li>The Etna cable car + 4x4 to the high craters on a clear morning.</li><li>A sunset boat around the Ortigia sea caves.</li><li>An automatic Sicily rental booked early to avoid manual-only fleets.</li></ul></div>
    </div>
  </section>

  <section id="totals" class="divider">
    <div class="section-label">
      <p class="eyebrow">Bottom Line</p>
      <h2>Total trip cost</h2>
      <p>This plan does not hit the $12k target and its high case exceeds the $15k preferred maximum. It buys the most scenic variety on the board; budget is what it trades away.</p>
    </div>
    ${table(['Category', 'Estimate'], [
      ['Flights and intra-Europe hop', '$6,200 target / $8,900 high'],
      ['Lodging, 12 hotel nights', '$2,230 target / $2,850 high'],
      ['Swiss rail pass + mountain excursions', '$2,150 target / $2,650 high'],
      ['Sicily car, Etna, boat, beach sets', '$820 target / $1,150 high'],
      ['Food, groceries, 13 travel days', '$2,100 target / $2,700 high'],
      ['Insurance, ETIAS, fees, buffer', '$500 target / $1,100 high'],
      ['<b>Grand total - family of 4</b>', '<b>$14,000 target / $19,350 high</b>'],
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
        <li>Protected PIT-Zurich / Catania-PIT open-jaw ticket<span> &middot; re-quote on ITA Matrix when 2027 loads</span></li>
        <li>ZRH -> Catania nonstop + Sicily rental car<span> &middot; automatic booked early</span></li>
        <li>Refundable Berner Oberland apartment + Taormina + Siracusa apartments<span> &middot; parking, AC, washer</span></li>
        <li>Swiss passes + Jungfraujoch reservation<span> &middot; verify pass/discount terms first</span></li>
        <li>Etna cable car + Ortigia boat + any First add-ons<span> &middot; closer to travel</span></li>
      </ol>
    </div>
    <div class="tips-grid">
      <div class="tipcard"><h4>Flights</h4><p class="sub">Open-jaw, into Zurich</p><ul><li><b>Home from Catania</b>, a major well-connected airport.</li><li><b>Connect via Rome/Munich/Frankfurt/Zurich</b> on the return.</li><li><b>Re-quote the open-jaw</b>; the number is 2026-proxy arithmetic.</li></ul></div>
      <div class="tipcard t2"><h4>Switzerland</h4><p class="sub">Chase the weather</p><ul><li><b>Jungfraujoch and First are swappable</b> &mdash; do the clearer one first.</li><li><b>Layers for the summit</b>; it&rsquo;s near freezing in June.</li><li><b>Lakes are for looking</b>, not June swimming.</li></ul></div>
      <div class="tipcard t3"><h4>Money</h4><p class="sub">Switzerland is the cost</p><ul><li><b>Cook in the apartment</b> to blunt Swiss food prices.</li><li><b>Swiss francs, not euros</b> &mdash; CHF on that leg.</li><li><b>Verify pass math</b> before buying Jungfrau tickets.</li></ul></div>
      <div class="tipcard t4"><h4>Sicily</h4><p class="sub">The warm-water week</p><ul><li><b>Isola Bella and Fontane Bianche are the calm-water wins.</b></li><li><b>Etna needs a clear morning</b> and closed shoes.</li><li><b>Mind the ZTL zones</b> in Taormina and Ortigia.</li></ul></div>
    </div>
  </section>`;

const socialBalanceStatus = `<section id="social" class="divider">
    <div class="section-label">
      <p class="eyebrow">What People Are Saying</p>
      <h2>Research signals to keep in mind</h2>
      <p>Official pages and current route data point the same way: the Berner Oberland is the best-connected Alps for families, and Sicily&rsquo;s Ionian coast is the warm-water payoff with an easier air landing than the Greek islands.</p>
    </div>
    <div class="plan-grid">
      ${card('Cost signal', `<p>Jungfrau railway fares, Swiss lodging, and food all confirm the same thing: this is among the priciest plans on the board. The saving move is a rail pass plus apartment cooking, not skipping the mountain days.</p>`)}
      ${card('Weather signal', `<p>Lauterbrunnen&rsquo;s high June rain frequency and Jungfraujoch&rsquo;s whiteout risk are why the two marquee summit days are built to be swapped to the clearest morning.</p>`)}
      ${card('Family signal', `<p>The Grindelwald-First rides, the Isola Bella cove, and Mount Etna&rsquo;s crater walk are the ends that make the hard days (summit, long Cefalù drive) worth it for an 8-year-old.</p>`)}
    </div>
  </section>

  <section id="balance" class="divider">
    <div class="section-label">
      <p class="eyebrow">Trip Balance</p>
      <h2>What the days add up to</h2>
      <p>Nature-forward across both legs, with Sicily carrying the water and both legs supplying town time.</p>
    </div>
    <div class="bar"><i style="width:30%;background:#1f6f78"></i><i style="width:25%;background:#c25a3a"></i><i style="width:45%;background:#3f7d4e"></i></div>
    <div class="balance">
      <div class="bcard k1"><div class="pct">30%</div><h4>Water &middot; Beaches &middot; Lakes</h4><p>Isola Bella and Mazzarò, Fontane Bianche, Cefalù&rsquo;s town beach, the Ortigia rock swims, and the look-only Lake Brienz.</p></div>
      <div class="bcard k2"><div class="pct">25%</div><h4>Towns &middot; Food &middot; Reset</h4><p>Interlaken, Lauterbrunnen village, Iseltwald, Taormina, baroque Noto, honey-stone Ortigia, groceries, and the travel days.</p></div>
      <div class="bcard k3"><div class="pct">45%</div><h4>Alps &middot; Volcano &middot; Ridges</h4><p>Jungfraujoch, Grindelwald-First, Männlichen, Trümmelbach, and Sicily&rsquo;s Mount Etna and La Rocca climbs.</p></div>
    </div>
  </section>

  <section id="status" class="divider">
    <div class="section-label"><p class="eyebrow">Settled &amp; Open</p><h2>What is decided, what still needs a call</h2><p>The route is opinionated, but 2027 fares, Swiss pass math, and the Zurich-Catania schedule need live re-quotes before booking.</p></div>
    <div class="status"><div class="scol settled"><h4>Settled</h4>
      <div class="row"><b>Slug</b><span>switzerland-sicily</span></div>
      <div class="row"><b>Route</b><span>Berner Oberland 5 nights (rail) -> Taormina 4 + Siracusa 3 nights (car), open-jaw ZRH in / Catania out.</span></div>
      <div class="row"><b>Dates</b><span>Depart Tue Jun 8, 2027; home by Tue Jun 22, ahead of the preferred Jun 23 return and required Pittsburgh days Jun 24-26.</span></div>
      <div class="row"><b>Swim decision</b><span>All real swimming is in Sicily; Swiss lakes are look-only in June.</span></div>
      <div class="row"><b>Budget verdict</b><span>$14,000 target / $19,350 high &mdash; above the $12k target and the $15k preferred maximum. Budget is the sacrificed axis.</span></div>
    </div><div class="scol open"><h4>Open</h4>
      <div class="row"><b>Open-jaw fare</b><span>No live 2027 quote exists; the number is 2026-proxy arithmetic. Re-price on ITA Matrix.</span></div>
      <div class="row"><b>Zurich-Catania hop</b><span>SWISS/Edelweiss nonstop is seasonal; confirm the June 2027 day or route via FCO/MUC.</span></div>
      <div class="row"><b>Swiss pass math</b><span>Berner Oberland Regional Pass vs Swiss Travel Pass, and the exact Jungfraujoch discount, need a direct check.</span></div>
      <div class="row"><b>Weather flex</b><span>Jungfraujoch vs First order is decided day-of by the forecast.</span></div>
    </div></div>
  </section>`;

const todo = {
  labelHtml: `
      <p class="eyebrow">Pre-Departure To-Do</p>
      <h2>What to book before leaving</h2>
      <p>Planning sequence for the Jun 8-22, 2027 Switzerland + Sicily route. Track fares before buying; the open-jaw needs a live re-quote once 2027 inventory opens.</p>
    `,
  blocks: [
    {
      when: 'Jul-Aug 2026',
      tone: 'hot',
      title: 'Flight inventory opens: track, do not auto-buy',
      note: 'Map the open-jaw as a family-of-4 total and set alerts; buy only when routing and price both work.',
      items: [
        '<b>Track PIT -> ZRH and Catania -> PIT as one open-jaw.</b> Watch EWR/IAD (United/SWISS), FRA/MUC (Lufthansa), and LHR (BA).',
        '<b>Set the airfare gate.</b> Target ~$5,200 family transatlantic; high case ~$7,200 with seats/bags.',
        '<b>Price the ZRH -> Catania hop separately.</b> SWISS/Edelweiss nonstop ~2h, seasonal.',
      ],
    },
    {
      when: 'By Sep 2026',
      title: 'Hold refundable lodging',
      items: [
        '<b>Berner Oberland:</b> 5 nights Lauterbrunnen/Interlaken 2-bedroom apartment with washer and parking.',
        '<b>Sicily:</b> 4 nights Taormina/Giardini-Naxos + 3 nights Ortigia/Siracusa, both with AC.',
        '<b>Reserve the Sicily rental car</b> (automatic) for CTA pickup and drop.',
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
        '<b>Book the Etna cable car / 4x4</b> and the Ortigia sea-cave boat.',
        '<b>Confirm the ZRH -> Catania nonstop day</b> or the FCO/MUC routing if it does not match.',
      ],
    },
    {
      when: 'Final 2 weeks',
      tone: 'done',
      title: 'Operational checks',
      items: [
        '<b>Download offline maps</b> for the Berner Oberland, the Ionian coast, and southeast Sicily.',
        '<b>Reconfirm flight times, rail schedules, the CTA car counter, and Etna/mountain weather.</b>',
        '<b>Pack layers and rain shells for the Alps, plus swim gear and reef shoes for Sicily.</b>',
      ],
    },
  ],
  callout: '<b>Do not forget:</b> this plan trades budget for the most scenic contrast on the board. Keep the Swiss block tight and rail-based, and let Sicily carry every warm swim.',
};

const scorecard = {
  displayName: 'Switzerland + Sicily',
  blurb: 'Alps epic + warm Sicily swimming',
  axes: {
    budget: 1,
    weather: 3,
    swim: 4,
    variety: 5,
    ease: 2,
    food: 4,
    risk: 3,
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
    floorUsd: 14000,
    ceilUsd: 19350,
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
  totalBaked: 33,
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
  countries: ['switzerland', 'italy'],
  packingTags: ['hiking', 'beach', 'heat', 'rain'],
  slug,
  lang: 'en',
  title: 'Switzerland + Sicily · Berner Oberland to Taormina — June 2027',
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  overrides: {
    packing: [
      '<b>Alpine layers:</b> fleece or light puffer, hat and gloves for Jungfraujoch even in June.',
      '<b>Rain shells:</b> Lauterbrunnen and First see frequent afternoon showers.',
      '<b>Real shoes both ways:</b> grippy trainers for the Alps and Etna ash, reef shoes for Sicily&rsquo;s rock swims.',
      '<b>Sun + heat kit:</b> UPF shirts, hats, sunscreen for the exposed Sicilian beach and volcano days.',
      '<b>Two currencies:</b> Swiss francs for Switzerland, euros for Sicily.',
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
