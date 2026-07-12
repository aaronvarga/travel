#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const outDir = path.join(root, 'src/_data/slovenia-adriatic');

// ---- helpers (kept local, mirroring the other create-*.mjs builders) --------
function gmaps(lat, lng) { return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`; }
function point(n, lat, lng, r, t) { return { n, lat, lng, r, g: gmaps(lat, lng), t }; }
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

// ---- self-hosted photos: metadata lives in _photo-plan.json -----------------
// Every image is a downloaded, optimized local asset (5 per carousel, 50 total).
const PLAN = JSON.parse(fs.readFileSync(path.join(root, 'assets/img/slovenia-adriatic/_photo-plan.json'), 'utf8'));
const BASE = '../../assets/img/slovenia-adriatic';
function imgs(...files) {
  return files.map((file) => {
    const m = PLAN.images[file];
    if (!m) throw new Error(`missing photo-plan entry: ${file}`);
    const src = `${BASE}/${file}`;
    return { href: src, src, alt: m.alt, captionTitle: m.captionTitle, credit: m.credit };
  });
}

// ---- map -------------------------------------------------------------------
const mapColors = {
  gorenjska: '#1f6f78',
  soca: '#3f7d4e',
  primorska: '#3a6ea5',
  ljubljana: '#7d5ba6',
  transfer: '#c25a3a',
};
const mapPoints = [
  point('Ljubljana Airport (LJU)', 46.2237, 14.4576, 'transfer', 'flight'),
  point('Lake Bled base', 46.3683, 14.1146, 'gorenjska', 'hotel'),
  point('Bled Island (Church of the Assumption)', 46.3625, 14.0876, 'gorenjska', 'view'),
  point('Bled Castle', 46.3691, 14.1006, 'gorenjska', 'view'),
  point('Vintgar Gorge', 46.3949, 14.0894, 'gorenjska', 'hike'),
  point('Lake Bohinj', 46.2803, 13.8869, 'gorenjska', 'beach'),
  point('Vogel cable car', 46.2597, 13.8403, 'gorenjska', 'view'),
  point('Savica Waterfall', 46.2942, 13.8003, 'gorenjska', 'hike'),
  point('Vršič Pass (1611 m)', 46.4331, 13.7472, 'soca', 'view'),
  point('Russian Chapel (Ruska kapelica)', 46.4611, 13.7581, 'soca', 'view'),
  point('Bovec / Soča Valley base', 46.3381, 13.5522, 'soca', 'hotel'),
  point('Great Soča Gorge (Velika korita)', 46.3128, 13.6100, 'soca', 'hike'),
  point('Kozjak Waterfall (Kobarid)', 46.2586, 13.5836, 'soca', 'hike'),
  point('Tolmin Gorges (Tolminska korita)', 46.1897, 13.7386, 'soca', 'hike'),
  point('Škocjan Caves (UNESCO)', 45.6633, 13.9903, 'primorska', 'view'),
  point('Piran base', 45.5285, 13.5683, 'primorska', 'hotel'),
  point('Fiesa beach', 45.5236, 13.5758, 'primorska', 'beach'),
  point('Portorož beaches', 45.5136, 13.5931, 'primorska', 'beach'),
  point('Sečovlje Salina Nature Park', 45.4831, 13.6153, 'primorska', 'view'),
  point('Ljubljana Old Town base', 46.0500, 14.5069, 'ljubljana', 'hotel'),
  point('Ljubljana Castle', 46.0489, 14.5083, 'ljubljana', 'view'),
];

// ---- spots -----------------------------------------------------------------
const bledSpot = mkSpot({
  name: 'Lake Bled: island church, pletna &amp; clifftop castle',
  tags: ['lakebled', 'bledisland', 'slovenia'],
  carouselId: 'c-bled',
  images: imgs('google_bled_island_aerial_01.jpg', 'google_bled_pletna_boat_01.jpg', 'google_bled_castle_cliff_01.jpg', 'google_bled_church_bell_01.jpg', 'google_bled_dawn_reflection_01.jpg'),
  lat: 46.3625,
  lng: 14.0876,
  cost: 'The pletna boat to the island is €20 adult / €10 child round trip (cash to the pletnar, ~20 min each way plus ~40 min on the island); the island church admission with the wishing bell is €12 adult / €5 child. Bled Castle is about €19 adult / €7 child. A family of four doing all three runs roughly €150 (~$165). Walking the lake shore, ringing nothing, and photographing the island is free.',
  climateLabel: 'Lake',
  climate: '<b>~1,500 ft, Julian Alps foothills.</b> June highs are a pleasant ~24&deg;C / mid-70s&deg;F with frequent afternoon showers. The lake itself is a swimmable-but-cool ~18&ndash;19&deg;C in June &mdash; fine for a quick dip off the grassy lidos, not a warm-water day (that waits for Piran).',
  save: 'Skip the pletna and walk the 6 km lakeshore path for the classic island view for free; ring the wishing bell only if the kids insist. The castle courtyard view is the same whether or not you buy the museum ticket.',
  splurge: 'Do the full ritual: pletna across, 99 steps up, ring the bell, then a slice of Bled cream cake (kremšnita) on a castle terrace over the lake.',
  restos: [
    '<b>Pizzeria Rustika</b> &mdash; wood-fired pizza with a kids&rsquo; pizza noted and simple pasta, a reliable picky-eater anchor',
    '<b>Pizzeria Gallus</b> &mdash; big straightforward pizzas near the lake',
    '<b>Slaščičarna Šmon</b> &mdash; the original Bled cream cake plus ice cream for a low-drama treat stop',
  ],
  alts: [
    '<b>Bled Castle first, island after</b> if morning light is better on the water later.',
    '<b>Straž hill or Ojstrica viewpoint</b> for the postcard aerial of the island without a drone.',
    '<b>Rent a rowboat</b> instead of the pletna for a cheaper, more active crossing.',
  ],
  blogs: [
    { label: 'Bled Island — official pricelist', href: 'https://www.bled.si/en/what-to-see/natural-sights/the-bled-island/Price-lists-reservations' },
    { label: 'Bled tourism', href: 'https://www.bled.si/en/' },
  ],
});

const vintgarSpot = mkSpot({
  name: 'Vintgar Gorge: emerald boardwalk through the Radovna canyon',
  tags: ['vintgargorge', 'blejskivintgar', 'slovenia'],
  carouselId: 'c-vintgar',
  images: imgs('google_vintgar_boardwalk_01.jpg', 'google_vintgar_emerald_water_01.jpg', 'google_vintgar_gorge_bridge_01.jpg', 'google_vintgar_rapids_01.jpg', 'google_vintgar_canyon_01.jpg'),
  lat: 46.3949,
  lng: 14.0894,
  cost: 'Entry is €15 adult / €5 child (up to 15) &mdash; about €40 (~$44) for the family. Since 2025 there are NO tickets at the gorge entrance: you must buy an online timed-slot pass in advance (or on-site only at the P1 Vintgar central parking before the shuttle). Miss your slot and you wait. Open April&ndash;October only; helmets are provided and mandatory.',
  climateLabel: 'Gorge',
  climate: '<b>Shaded river canyon.</b> The 1.6 km wooden boardwalk hugs the emerald Radovna over rapids and pools, ending at the Šum waterfall. Cool and often damp underfoot &mdash; a smart pick on a warm or showery morning. About 45 minutes one way; fine for both kids, not for strollers.',
  save: 'Book the earliest online slot to beat the tour buses and the midday crush, and walk back the upper forest loop rather than paying for the shuttle.',
  splurge: 'Pair it with the nearby St Catherine&rsquo;s church hilltop or the Pokljuka plateau for a bigger half-day in the Bled backcountry.',
  restos: [
    '<b>Gostilna Vintgar (at the entrance)</b> &mdash; simple grilled plates, fries, and pizza right by the exit',
    '<b>Pizzeria Rustika (Bled, ~10 min)</b> &mdash; the dependable kids&rsquo;-pizza fallback back in town',
    '<b>Bled lakeside kiosks</b> &mdash; ice cream and quick bites after the walk',
  ],
  alts: [
    '<b>Come at opening or late afternoon</b> &mdash; midday is the crowd peak on the narrow boardwalk.',
    '<b>Tolmin or Great Soča gorges later</b> if you want a second, different canyon on the Soča leg.',
    '<b>Skip if heavy rain</b> closes or slicks the boardwalk &mdash; it&rsquo;s a fair-weather walk.',
  ],
  blogs: [
    { label: 'Vintgar Gorge — pricelist & booking', href: 'https://www.vintgar.si/en/my-visit/pricelist/' },
    { label: 'Vintgar visit info', href: 'https://www.vintgar.si/en/my-visit/' },
  ],
});

const bohinjSpot = mkSpot({
  name: 'Lake Bohinj: Vogel cable car + Savica Waterfall',
  tags: ['lakebohinj', 'vogel', 'triglavnationalpark'],
  carouselId: 'c-bohinj',
  images: imgs('google_bohinj_lake_church_01.jpg', 'google_bohinj_savica_waterfall_01.jpg', 'google_vogel_cablecar_view_01.jpg', 'google_bohinj_kayak_01.jpg', 'google_triglav_peaks_01.jpg'),
  lat: 46.2803,
  lng: 13.8869,
  cost: 'Quieter and wilder than Bled, inside Triglav National Park (no park entry fee). The Vogel cable car is about €33 adult / €16 child return for a huge balcony view over the lake to the Triglav massif. Savica Waterfall is a ~€4 walk-in on a stepped path. Kayak or SUP rental on the lake runs ~€15&ndash;20/hour. The lakeshore and the stone bridge at Ribčev Laz are free.',
  climateLabel: 'Alpine lake',
  climate: '<b>Glacial lake, deeper in the park.</b> Bohinj is colder than Bled &mdash; high-teens &deg;C water even in June &mdash; and can catch mountain cloud. The Vogel top station sits above 1,500 m, so pack a layer even on a warm valley day.',
  save: 'Do the free lakeshore walk and the Savica path, and skip the cable car if the summit is clouded &mdash; the view is the whole point of the ticket.',
  splurge: 'Ride Vogel on a clear morning for the Triglav panorama, then kayak the glassy east end of the lake in the afternoon.',
  restos: [
    '<b>Pizzerija Ema</b> &mdash; very family-friendly with a small playground and coloring for kids, wood-fired pizza',
    '<b>Pizzeria Ukanc</b> &mdash; large simple pizzas at the quiet Ukanc (west) end of the lake',
    '<b>Slaščičarna at Ribčev Laz</b> &mdash; ice cream and pancakes by the bridge',
  ],
  alts: [
    '<b>Savica + lakeshore only</b> as a gentle half-day if the peaks are socked in.',
    '<b>Mostnica Gorge (Stara Fužina)</b> for a shorter, cheaper canyon walk with a cow-shaped rock the kids hunt for.',
    '<b>Panoramic lake boat</b> instead of the cable car for a low-effort option.',
  ],
  blogs: [
    { label: 'Vogel cable car — summer pricelist', href: 'https://vogel.si/en/price-list-summer/' },
    { label: 'Bohinj tourism', href: 'https://www.bohinj.si/en/' },
  ],
});

const vrsicSpot = mkSpot({
  name: 'Vršič Pass: 50 hairpins over the roof of Slovenia',
  tags: ['vrsicpass', 'julianalps', 'socavalley'],
  carouselId: 'c-vrsic',
  images: imgs('google_vrsic_switchbacks_01.jpg', 'google_vrsic_russian_chapel_01.jpg', 'google_vrsic_pass_peaks_01.jpg', 'google_vrsic_valley_view_01.jpg', 'google_vrsic_road_aerial_01.jpg'),
  lat: 46.4331,
  lng: 13.7472,
  cost: 'Free to drive &mdash; the pass is a regional mountain road, so no vignette or toll applies. The only costs are fuel and your nerves on 50 numbered hairpins (24 up from Kranjska Gora, 26 down to the Soča). Budget the whole day for it: the Russian Chapel, the summit, Lake Jasna, and a dozen pull-offs.',
  climateLabel: 'High pass',
  climate: '<b>1,611 m &mdash; Slovenia&rsquo;s highest road pass.</b> Normally fully open and clear by mid-June, but this is the one real timing risk of the trip: late-lying snow can delay the spring clearing and there is no guaranteed open-by date. Check promet.si and the Erjavčeva koča cameras before committing; the Predel/Tarvisio route is the fallback if it&rsquo;s shut.',
  save: 'It&rsquo;s a free scenic drive &mdash; pack a picnic for the summit and let the road be the day&rsquo;s main event rather than paying for anything up top.',
  splurge: 'Stop at Erjavčeva koča near the top for štruklji and a hot chocolate with the peaks overhead, and detour to turquoise Lake Jasna on the descent.',
  restos: [
    '<b>Erjavčeva koča (near the summit)</b> &mdash; mountain-hut plates, štruklji, soups, and simple kid food with a view',
    '<b>Okrepčevalnica Loka (Trenta)</b> &mdash; casual grill and pizza on the Soča side of the pass',
    '<b>Pack a picnic</b> &mdash; the smartest move for the summit and the pull-offs',
  ],
  alts: [
    '<b>Predel Pass via Tarvisio (Italy)</b> as the ~2&ndash;2.5 hr fallback if Vršič is closed &mdash; still Schengen, no border stop.',
    '<b>Lake Jasna (Kranjska Gora side)</b> for an easy turquoise-water photo stop with the ibex statue.',
    '<b>Soča Trail / river source (Trenta)</b> for a short leg-stretch on the way down.',
  ],
  blogs: [
    { label: 'Vršič Pass road status (Erjavčeva koča)', href: 'https://www.erjavcevakoca.com/road-conditions-over-vrsic-pass/' },
    { label: 'Live road conditions — promet.si', href: 'https://www.promet.si/en/' },
  ],
});

const socaSpot = mkSpot({
  name: 'Soča Valley: emerald river, family rafting &amp; the Great Gorge',
  tags: ['socariver', 'bovec', 'rafting'],
  carouselId: 'c-soca',
  images: imgs('google_soca_river_emerald_01.jpg', 'google_soca_rafting_01.jpg', 'google_soca_great_gorge_01.jpg', 'google_kozjak_waterfall_01.jpg', 'google_soca_valley_aerial_01.jpg'),
  lat: 46.3381,
  lng: 13.5522,
  cost: 'The impossibly emerald Soča is the heart of the leg. Guided rafting runs roughly €45&ndash;80/person plus a ~€6 river permit; standard trips take ages 8+ (the 13-year-old is fine), while a dedicated family/panoramic float suits the 8-year-old. The Great Soča Gorge (Velika korita) has free parking and no entry fee; Kozjak Waterfall is €5 adult / €3 child on an easy 3.3 km forest walk.',
  climateLabel: 'River',
  climate: '<b>Glacial river, cold year-round.</b> The Soča is a stunning ~11&ndash;15&deg;C even in summer &mdash; perfect for wetsuit rafting, too cold for casual kid swimming beyond a shriek-and-out dip. June valley air is warm; afternoon thunderstorms are common, so book water sports for the morning.',
  save: 'Do the free Great Soča Gorge boardwalk and the cheap Kozjak Waterfall walk, and pick the shorter family rafting stretch rather than the full-day trip.',
  splurge: 'Book the guided rafting for the whole family (wetsuits included) and add the Boka waterfall viewpoint or a via-ferrata taster for the 13-year-old.',
  restos: [
    '<b>Pizzeria Črna Ovca (&ldquo;Black Sheep&rdquo;), Bovec</b> &mdash; widely praised oven-baked pizza, English-speaking staff',
    '<b>Ristorante Pizzeria Papillo, Bovec</b> &mdash; family-friendly and fast, plain pizza/pasta guaranteed',
    '<b>Letni Vrt, Bovec</b> &mdash; pizza-focused garden spot for an easy dinner',
  ],
  alts: [
    '<b>Family/panoramic raft (Čezsoča stretch)</b> for the 8-year-old instead of the standard run.',
    '<b>Great Soča Gorge + Kozjak</b> as a no-rafting, low-cost water day.',
    '<b>Kobarid WWI museum + Napoleon Bridge</b> for a rainy-morning indoor pivot.',
  ],
  blogs: [
    { label: 'Bovec family rafting & ages', href: 'https://aquatoursbovec.com/family-rafting-on-the-soca-river-the-perfect-active-adventure-in-bovec/' },
    { label: 'Soča Valley tourism', href: 'https://www.soca-valley.com/en/' },
  ],
});

const tolminSpot = mkSpot({
  name: 'Tolmin Gorges: Devil&rsquo;s Bridge &amp; the Triglav park&rsquo;s lowest canyon',
  tags: ['tolmingorges', 'tolminskakorita', 'socavalley'],
  carouselId: 'c-tolmin',
  images: imgs('google_tolmin_gorge_confluence_01.jpg', 'google_tolmin_devils_bridge_01.jpg', 'google_tolmin_emerald_pool_01.jpg', 'google_tolmin_boardwalk_01.jpg', 'google_tolmin_gorge_walls_01.jpg'),
  lat: 46.1897,
  lng: 13.7386,
  cost: 'Entry is €12 adult / €6 child (6&ndash;15) in high season &mdash; about €36 (~$40) for the family &mdash; on a one-hour timed slot. The loop takes in the Devil&rsquo;s Bridge (60 m above the river), the thermal spring at the Tolminka&ndash;Zadlaščica confluence, and Dante&rsquo;s Cave. Open roughly April&ndash;October; it closes only in exceptional high water, and tickets are refundable if it does.',
  climateLabel: 'Gorge',
  climate: '<b>Lowest entry point into Triglav National Park.</b> A cooler, shaded canyon walk &mdash; a good hot-afternoon pick. The narrow paths and stairs are fine for both kids but not for strollers. After heavy rain the Tolminka can rise and force a closure, so keep it weather-flexible.',
  save: 'It&rsquo;s already cheap &mdash; just go early for your slot and bring water; the thermal-spring pool is a free cool-off.',
  splurge: 'Add the nearby Javorca memorial church or a Tolmin town gelato, or combine with the Kozjak Waterfall for a two-canyon day.',
  restos: [
    '<b>Pizzeria Cinca Marinca, Tolmin</b> &mdash; casual pizza and pasta in town',
    '<b>Gostilna Rajht (Kobarid, ~20 min)</b> &mdash; hearty local plates with simpler kid options',
    '<b>Tolmin bakeries</b> &mdash; burek and pastries for a cheap trail lunch',
  ],
  alts: [
    '<b>Great Soča Gorge instead</b> if you&rsquo;d rather a free, shorter canyon walk.',
    '<b>Tolmin thermal spring pool</b> for a quick kid cool-off inside the gorge.',
    '<b>Skip in high water</b> &mdash; check the gorge&rsquo;s status line before driving over.',
  ],
  blogs: [
    { label: 'Tolmin Gorges — pricelist & hours', href: 'https://www.soca-valley.com/en/attraction/tolmin-gorges/price-list/' },
    { label: 'Tolmin Gorges info', href: 'https://www.socavalley.com/tolmin-gorges/' },
  ],
});

const skocjanSpot = mkSpot({
  name: 'Škocjan Caves: an underground canyon bridged high over the Reka',
  tags: ['skocjancaves', 'skocjanskejame', 'unesco'],
  carouselId: 'c-skocjan',
  images: imgs('google_skocjan_underground_canyon_01.jpg', 'google_skocjan_gorge_bridge_01.jpg', 'google_skocjan_cave_chamber_01.jpg', 'google_skocjan_collapse_doline_01.jpg', 'google_skocjan_reka_river_01.jpg'),
  lat: 45.6633,
  lng: 13.9903,
  cost: 'The UNESCO show-stopper on the drive to the coast. The Underground Canyon tour is about €22&ndash;24 adult / €12.50 child in summer &mdash; roughly €70 (~$77) for the family &mdash; with departures around 10:00, 11:30, 13:00, 14:00, 15:00. It&rsquo;s a 5 km, ~1,000-step, 2.5&ndash;3 hr walk crossing the famous Cerkvenik footbridge high above the Reka. Interior is ~12&deg;C; no photography inside.',
  climateLabel: 'Cave',
  climate: '<b>~12&deg;C underground, year-round.</b> Bring a layer even on a hot coastal day. This is a genuinely strenuous walk, not a stroll, and not stroller-accessible &mdash; fine for a capable 8-year-old but a real hike. The early-exit option at the Big Collapse Doline shortens it to ~3 km.',
  save: 'Take the standard Underground Canyon tour rather than any combo add-ons; the collapse-doline early exit trims the steps if legs are tired.',
  splurge: 'If the 8-year-old would prefer easier magic, swap to Postojna Cave&rsquo;s ride-in cave train &mdash; less dramatic than Škocjan&rsquo;s canyon, but stroller-adaptable and a kid hit.',
  restos: [
    '<b>Gostilna near the park entrance</b> &mdash; simple grilled plates and pizza before the drive on',
    '<b>Divača bakeries (~10 min)</b> &mdash; burek and pastries for a car snack',
    '<b>Piran/Portorož dinner</b> &mdash; save the real meal for arrival on the coast',
  ],
  alts: [
    '<b>Postojna Cave</b> as the easier, train-served alternative for younger kids.',
    '<b>Predjama Castle</b> combined with Postojna if you pivot inland.',
    '<b>Big Collapse Doline early exit</b> to cut the tour short without missing the canyon.',
  ],
  blogs: [
    { label: 'Škocjan Caves — tours & tickets', href: 'https://www.park-skocjanske-jame.si/en/read/tourist-information/skocjan-caves-guided-tours' },
    { label: 'Škocjan vs Postojna for kids', href: 'https://takethekidseverywhere.com/postojna-or-skocjan-caves/' },
  ],
});

const piranSpot = mkSpot({
  name: 'Piran: a Venetian peninsula and the first warm Adriatic swim',
  tags: ['piran', 'slovenianistria', 'adriatic'],
  carouselId: 'c-piran',
  images: imgs('google_piran_aerial_peninsula_01.jpg', 'google_piran_tartini_square_01.jpg', 'google_piran_redroofs_sunset_01.jpg', 'google_piran_belltower_view_01.jpg', 'google_piran_harbor_01.jpg'),
  lat: 45.5285,
  lng: 13.5683,
  cost: 'Wandering Tartini Square, the harbor, and the tangle of Venetian lanes is free. The town walls are €3 adult / €2 student (under-12 free) for the best red-roof panorama; St George&rsquo;s bell tower is ~€3 to climb its 146 steps. Piran&rsquo;s own shoreline is rocky bathing platforms with ladders into deep water &mdash; the warm-water payoff of the whole trip, if a cooler-than-tropical one.',
  climateLabel: 'Coast',
  climate: '<b>Northern Adriatic.</b> June air is a warm ~25&ndash;28&deg;C / high-70s&deg;F, and the sea is about ~22&deg;C / 72&deg;F &mdash; genuinely swimmable but refreshing, not bathwater, especially early June. This is warmer and calmer than the Atlantic beaches on the Portugal-style plans, and the honest ceiling on this trip&rsquo;s swimming.',
  save: 'Swim free off the Punta rocks or the concrete platforms along Prešernovo nabrežje, and climb the €3 walls at golden hour instead of a pricier boat trip.',
  splurge: 'A sunset seafood dinner on the Piran waterfront, then the bell-tower climb for the 360&deg; over the peninsula as the lights come on.',
  restos: [
    '<b>Pizzeria Porto Konoba</b> &mdash; among the best pizza on the Slovenian coast, plus simple seafood',
    '<b>Pizzeria Burin</b> &mdash; straightforward pizza with a sea view and family-friendly staff',
    '<b>Fritolin pri Cantini</b> &mdash; casual order-at-the-counter fried calamari and simple plates at fair prices',
  ],
  alts: [
    '<b>Fiesa beach (15-min walk)</b> for easier pebble-beach family swimming.',
    '<b>Piran town walls at sunset</b> for the red-roof panorama without midday heat.',
    '<b>Boat or kayak to the cliffs</b> for a calm-water paddle off the peninsula.',
  ],
  blogs: [
    { label: 'Portorož & Piran beaches', href: 'https://www.portoroz.si/en/what-to-do/beaches/' },
    { label: 'Piran June sea temperature', href: 'https://seatemperature.net/monthly/portoroz-piran-pirano-slovenia-sea-temperature-in-june-1438' },
  ],
});

const coastSpot = mkSpot({
  name: 'Portorož beaches, Fiesa cove &amp; the Sečovlje salt pans',
  tags: ['portoroz', 'fiesa', 'secovlje'],
  carouselId: 'c-coast',
  images: imgs('google_fiesa_beach_01.jpg', 'google_portoroz_beach_01.jpg', 'google_secovlje_saltpans_01.jpg', 'google_piran_swim_platform_01.jpg', 'google_slovenia_adriatic_sunset_01.jpg'),
  lat: 45.5136,
  lng: 13.5931,
  cost: 'The relaxed beach day. Portorož has the coast&rsquo;s most groomed, gently-shelving family beaches (free entry; sunbed + umbrella ~€10&ndash;15/day), and pebbly Fiesa cove between Piran and Portorož is the local family favorite. Sečovlje Salina Nature Park is €7 adult / €5 student, under-6 free, family €16 &mdash; hand-worked salt pans, flamingos and waders, and an open-air salt museum.',
  climateLabel: 'Coast',
  climate: '<b>Calm, shallow, north-Adriatic water.</b> Warm and easy for the kids in June, though not the crystal clarity of the coast further south. The Sečovlje pans are flat and exposed with almost no shade &mdash; do them in the morning or late afternoon with hats and water, not at midday.',
  save: 'Walk to Fiesa from Piran (parking there is scarce and ~€10) and bring your own shade; the Sečovlje family ticket is a cheap, unusual half-day.',
  splurge: 'A Portorož beach-club lounger day, or a Sečovlje thalasso/salt-spa session using the pans&rsquo; own mud and brine.',
  restos: [
    '<b>Portorož seafront pizzerias</b> &mdash; plenty of plain-pizza and pasta options along the promenade',
    '<b>Fiesa beach buffet</b> &mdash; casual fries, toasties, and ice cream at the cove',
    '<b>Piran dinner</b> &mdash; walk back over the hill for the harbor restaurants',
  ],
  alts: [
    '<b>Fiesa over Piran&rsquo;s rocks</b> for the calmest, most kid-friendly swim.',
    '<b>Sečovlje salt pans</b> for a birdwatching morning before the beach.',
    '<b>Strunjan cliffs & lagoon</b> as a quieter nature alternative up the coast.',
  ],
  blogs: [
    { label: 'Sečovlje Salina — entry & info', href: 'https://www.kpss.si/en/visiting/entry-fees' },
    { label: 'Portorož beaches', href: 'https://www.portoroz.si/en/what-to-do/beaches/' },
  ],
});

const ljubljanaSpot = mkSpot({
  name: 'Ljubljana: castle funicular, dragons, and a car-free riverfront',
  tags: ['ljubljana', 'ljubljanacastle', 'slovenia'],
  carouselId: 'c-ljubljana',
  images: imgs('google_ljubljana_castle_view_01.jpg', 'google_ljubljana_dragon_bridge_01.jpg', 'google_ljubljana_riverfront_01.jpg', 'google_ljubljana_triple_bridge_01.jpg', 'google_ljubljana_market_evening_01.jpg'),
  lat: 46.0489,
  lng: 14.5083,
  cost: 'A compact, pedestrian, genuinely easy capital to end on. The castle funicular is a €15 family return; the courtyard and ramparts are free once you&rsquo;re up if you skip the €36-family museum ticket. The Old Town, Dragon Bridge, Triple Bridge, Plečnik&rsquo;s market colonnade, and Tivoli Park cost nothing. Park in a garage (~€15/day cap) since the center is car-free.',
  climateLabel: 'City',
  climate: '<b>Warm inland June.</b> Days in the high-20s&deg;C, warm evenings for a riverside dinner and buskers along the Ljubljanica. An afternoon thunderstorm is possible; the covered market arcade and castle funicular make good rain pivots.',
  save: 'Ride the funicular but skip the paid castle museum, eat from the riverside market and bakeries, and let the free Old Town and Tivoli Park be the day.',
  splurge: 'A Ljubljanica river boat cruise plus dinner on the embankment, or the full castle ticket with the Time Machine costumed tour for the kids.',
  restos: [
    '<b>Pop&rsquo;s Pizza (by Cobblers&rsquo; Bridge)</b> &mdash; wood-fired Neapolitan, widely rated the city&rsquo;s best pizza',
    '<b>PizzaBurger (market arcade)</b> &mdash; burgers and pizza, reviewed as a hit with young kids',
    '<b>Marley &amp; Me (Old Town)</b> &mdash; pasta, salads, and Mediterranean plates for a sit-down dinner',
  ],
  alts: [
    '<b>Walk up to the castle</b> via the free path instead of the funicular for older kids.',
    '<b>Tivoli Park + the zoo</b> for a low-key final morning with the 8-year-old.',
    '<b>Postojna Cave day-trip</b> (~45 min) if you want one more wow before flying home.',
  ],
  blogs: [
    { label: 'Ljubljana Castle — funicular & tickets', href: 'https://www.ljubljanskigrad.si/en/plan-your-visit/price-list/' },
    { label: 'Visit Ljubljana', href: 'https://www.visitljubljana.com/en/visitors/' },
  ],
});

// ---- itinerary: 12 hotel nights (Bled 4, Bovec 3, Piran 3, Ljubljana 2) -----
const days = [
  day('day0', 'c0', '0', 'Tue &middot; Jun 8', 'Depart Pittsburgh after work', 'Overnight to Europe', 'Est. $90 &middot; airport meals', [
    fact('Sleep', 'Overnight flight'),
    fact('Route target', 'PIT -> EWR/IAD/ORD -> FRA/MUC/VIE -> LJU'),
    fact('Constraint', 'In Pittsburgh all day Jun 24-26; Jun 23 return is allowed'),
  ], 'PIT has no transatlantic nonstop, and Ljubljana has no long-haul service, so plan two clean European connections (Lufthansa group via Frankfurt/Munich/Vienna). Flying into Venice instead is a cheaper single-connection option with a ~2 hr drive.', [], 'Travel day - position toward Ljubljana.'),

  day('day1', 'c1', '1', 'Wed &middot; Jun 9', 'Arrive Ljubljana, drive to Lake Bled', 'Soft landing on the lake', 'Est. $130 &middot; groceries, easy dinner', [
    fact('Sleep', 'Lake Bled &middot; night 1 of 4'),
    fact('Transfer', 'LJU -> Bled ~30 min by rental car'),
    fact('Plan', 'Pick up the car, check in, lakeshore stroll, early night'),
  ], 'Ljubljana&rsquo;s airport is just 30 minutes from Bled, so the trip starts gently: collect the one rental car you keep the whole trip, settle in, and walk the lake to shake off the flights before the island and gorge days.', [], 'Travel day - land at LJU, collect car, drive to Bled.'),

  day('day2', 'c1', '2', 'Thu &middot; Jun 10', 'Lake Bled', 'Island church, pletna, and the clifftop castle', 'Est. $200 &middot; boat, island, castle, dinner', [
    fact('Sleep', 'Lake Bled &middot; night 2 of 4'),
    fact('Anchor', 'Pletna to Bled Island + Bled Castle'),
    fact('Treat', 'Bled cream cake (kremšnita) on a castle terrace'),
  ], 'The postcard day: a pletna boat to the island church and wishing bell, then up to the clifftop castle for the view down the lake. The iconic Slovenia image, and an easy one for the kids.', [bledSpot]),

  day('day3', 'c1', '3', 'Fri &middot; Jun 11', 'Vintgar Gorge', 'Emerald boardwalk through the canyon', 'Est. $150 &middot; gorge entry, lunch, dinner', [
    fact('Sleep', 'Lake Bled &middot; night 3 of 4'),
    fact('Anchor', 'Vintgar Gorge (book the online timed slot)'),
    fact('Weather rule', 'Shaded and cool - a good warm-or-showery-morning pick'),
  ], 'The 1.6 km wooden boardwalk clings to the emerald Radovna over rapids to the Šum waterfall. Buy the timed online pass in advance &mdash; there are no tickets at the gate anymore &mdash; and go early to beat the buses.', [vintgarSpot]),

  day('day4', 'c1', '4', 'Sat &middot; Jun 12', 'Lake Bohinj + Vogel', 'Wilder lake, cable-car panorama, waterfall', 'Est. $210 &middot; cable car, Savica, dinner', [
    fact('Sleep', 'Lake Bled &middot; night 4 of 4'),
    fact('Morning', 'Vogel cable car over Triglav National Park'),
    fact('Afternoon', 'Savica Waterfall + Bohinj lakeshore'),
  ], 'Quieter and wilder than Bled, deep in Triglav National Park: the Vogel cable car for the big peak panorama, the Savica waterfall walk, and a glassy lake for a kayak. Pack a layer for the summit and repack tonight for the Vršič crossing.', [bohinjSpot]),

  day('day5', 'c2', '5', 'Sun &middot; Jun 13', 'Vršič Pass to the Soča Valley', 'Slovenia&rsquo;s highest road, 50 hairpins', 'Est. $120 &middot; picnic, hut stop, dinner', [
    fact('Sleep', 'Bovec / Soča Valley &middot; night 1 of 3'),
    fact('Anchor', 'Vršič Pass (1611 m), Russian Chapel, Lake Jasna'),
    fact('Risk check', 'Confirm the pass is open on promet.si; Predel is the fallback'),
  ], 'The scenic transfer that earns its own day: over the Vršič Pass&rsquo;s 50 numbered hairpins, past the WWI Russian Chapel and turquoise Lake Jasna, down to the emerald Soča. Check the pass is clear before setting off; if late snow has it shut, loop via Predel/Tarvisio.', [vrsicSpot], 'Scenic transfer - Bled to Bovec over Vršič Pass (or Predel if closed).'),

  day('day6', 'c2', '6', 'Mon &middot; Jun 14', 'Soča Valley water day', 'Emerald river, rafting, the Great Gorge', 'Est. $320 &middot; rafting, gorge, dinner', [
    fact('Sleep', 'Bovec / Soča Valley &middot; night 2 of 3'),
    fact('Anchor', 'Family rafting + Great Soča Gorge + Kozjak Waterfall'),
    fact('Water truth', 'Soča is a glacial 11-15°C - wetsuits, not casual swimming'),
  ], 'The adventure heart of the trip: guided rafting on the impossibly green Soča (a gentle family stretch for the 8-year-old, the standard run for the 13-year-old), then the free Great Soča Gorge and the easy Kozjak Waterfall walk. Book the water for the morning ahead of afternoon storms.', [socaSpot]),

  day('day7', 'c2', '7', 'Tue &middot; Jun 15', 'Tolmin Gorges', 'Devil&rsquo;s Bridge and the park&rsquo;s lowest canyon', 'Est. $150 &middot; gorge entry, lunch, dinner', [
    fact('Sleep', 'Bovec / Soča Valley &middot; night 3 of 3'),
    fact('Anchor', 'Tolmin Gorges (timed 1-hour slot)'),
    fact('Option', 'Bovec zipline / Kobarid WWI museum add-ons'),
  ], 'A cooler canyon walk to close the Soča leg: the Devil&rsquo;s Bridge high over the river, the thermal spring at the confluence, and Dante&rsquo;s Cave. Add the Bovec zipline for the 13-year-old (height/weight limits apply) or the Kobarid museum if it rains.', [tolminSpot]),

  day('day8', 'c3', '8', 'Wed &middot; Jun 16', 'Drive to the coast via Škocjan Caves', 'Underground canyon, then the Adriatic', 'Est. $180 &middot; cave tour, transfer, dinner', [
    fact('Sleep', 'Piran &middot; night 1 of 3'),
    fact('Anchor', 'Škocjan Caves (UNESCO) en route to Piran'),
    fact('Transfer', 'Bovec -> Škocjan -> Piran ~2h30 total'),
  ], 'The Alps-to-coast transition, broken by the UNESCO Škocjan Caves &mdash; a vast underground canyon crossed by a footbridge high over the Reka. It sits right on the route to Piran, so it&rsquo;s a marquee stop, not a detour. Arrive on the coast for the first warm-water evening.', [skocjanSpot], 'Scenic transfer - Bovec to Piran with the Škocjan Caves en route.'),

  day('day9', 'c3', '9', 'Thu &middot; Jun 17', 'Piran old town', 'Venetian lanes and the first Adriatic swim', 'Est. $150 &middot; walls, bell tower, taverna', [
    fact('Sleep', 'Piran &middot; night 2 of 3'),
    fact('Anchor', 'Tartini Square, town walls, St George&rsquo;s bell tower'),
    fact('Payoff', 'Sea ~22°C / 72°F - the warm-water leg the trip builds to'),
  ], 'The reward after the mountains: a Venetian peninsula of red roofs and narrow lanes, the town-wall panorama, and the first proper Adriatic swim off the Punta rocks. Warmer and calmer than the Atlantic plans, if honestly a refreshing 72°F rather than tropical.', [piranSpot]),

  day('day10', 'c3', '10', 'Fri &middot; Jun 18', 'Beaches + Sečovlje salt pans', 'Juneteenth observed: no-PTO beach day', 'Est. $140 &middot; beach, salt park, dinner', [
    fact('Sleep', 'Piran &middot; night 3 of 3'),
    fact('Holiday', 'Juneteenth observed Fri Jun 18 for many employers'),
    fact('Anchor', 'Portorož/Fiesa beaches + Sečovlje Salina'),
  ], 'The relaxed coast day, on the Juneteenth observed holiday so it costs no PTO: groomed Portorož sand or pebbly Fiesa cove for easy family swimming, then the flamingos and hand-worked salt pans of the Sečovlje nature park in the cooler late afternoon.', [coastSpot]),

  day('day11', 'c4', '11', 'Sat &middot; Jun 19', 'Coast to Ljubljana', 'Castle funicular and the Old Town', 'Est. $170 &middot; funicular, castle, dinner', [
    fact('Sleep', 'Ljubljana Old Town &middot; night 1 of 2'),
    fact('Transfer', 'Piran -> Ljubljana ~1h30 by car'),
    fact('Anchor', 'Ljubljana Castle funicular + riverfront evening'),
  ], 'Drive up to the capital and end on the easiest city on the board: the castle funicular for the view, the Dragon and Triple Bridges, and a car-free riverfront dinner with buskers along the Ljubljanica.', [ljubljanaSpot], 'Transfer - Piran to Ljubljana, the final base near the airport.'),

  day('day12', 'c4', '12', 'Sun &middot; Jun 20', 'Ljubljana at leisure', 'Market, Tivoli Park, last river evening', 'Est. $150 &middot; market, boat, dinner', [
    fact('Sleep', 'Ljubljana Old Town &middot; night 2 of 2'),
    fact('Morning', 'Central Market + Tivoli Park'),
    fact('Option', 'Postojna Cave day-trip (~45 min) for one more wow'),
  ], 'A gentle final full day: Plečnik&rsquo;s riverside market, a Ljubljanica boat cruise, and Tivoli Park &mdash; or a half-day out to Postojna Cave&rsquo;s ride-in cave train if the kids want one last headline. Repack tonight; the airport is 25 minutes away.', []),

  day('day13', 'c0', '13', 'Mon-Tue &middot; Jun 21-22', 'Fly Ljubljana -> Pittsburgh', 'Home before the blackout', 'Est. $110 &middot; airport meals', [
    fact('Sleep', 'Home by Tue Jun 22'),
    fact('Route target', 'LJU -> FRA/MUC/VIE -> US hub -> PIT'),
    fact('Schedule', 'Home by Tue Jun 22, ahead of the Jun 23 preference'),
  ], 'Drop the car at Ljubljana airport, connect through a Lufthansa-group hub and a US gateway, and land home by Tue Jun 22 &mdash; ahead of the preferred Jun 23 return and safely before the required full days in Pittsburgh on Jun 24-26.', [], 'Travel day - leave Ljubljana Monday Jun 21, arrive Pittsburgh by Tuesday Jun 22.'),
];

const previewImages = [
  [`${BASE}/google_bled_dawn_reflection_01.jpg`, 'Day 2 &middot; Thu Jun 10', 'Lake Bled', 'The island church mirrored at dawn below the Julian Alps.'],
  [`${BASE}/google_vintgar_emerald_water_01.jpg`, 'Day 3 &middot; Fri Jun 11', 'Vintgar Gorge', 'The emerald boardwalk through the Radovna canyon.'],
  [`${BASE}/google_vrsic_switchbacks_01.jpg`, 'Day 5 &middot; Sun Jun 13', 'Vršič Pass', 'Fifty hairpins over the roof of Slovenia.'],
  [`${BASE}/google_soca_river_emerald_01.jpg`, 'Day 6 &middot; Mon Jun 14', 'Soča Valley', 'The impossibly green glacial river below Bovec.'],
  [`${BASE}/google_piran_aerial_peninsula_01.jpg`, 'Day 9 &middot; Thu Jun 17', 'Piran', 'The Venetian peninsula and the first warm Adriatic swim.'],
];

const oldPart0 = template.parts[0].html;
const afterBody = oldPart0.indexOf('</head><body>') + '</head><body>'.length;
const navStart = oldPart0.indexOf('<nav class="site-nav"');
const overviewStart = oldPart0.indexOf('<section id="overview"');
const headBody = oldPart0.slice(0, afterBody)
  .replace(/<title>.*?<\/title>/, '<title>Slovenia + Adriatic &middot; Julian Alps to Piran &mdash; June 2027</title>');
const navToMain = oldPart0.slice(navStart, overviewStart)
  .replace('      <a href="#photo-guide">Photo Guide</a>\n      <a href="#food-guide">Food Guide</a>\n', '');

const preview = `<section class="preview">
  <div class="pv-pane">
    <span class="pv-kicker">Family Trip &middot; Jun 8&ndash;22, 2027</span>
    <h1>Slovenia + Adriatic<span>Julian Alps to Piran</span></h1>
    <p class="pv-lead">Twelve hotel nights of Alps-grade scenery at a fraction of Switzerland&rsquo;s cost, all in one easy country and one rental car: Lake Bled and Bohinj, the Vršič Pass, and the emerald Soča Valley, then a warm-water finish on the Venetian coast at Piran. Bigger scenery per dollar than almost anything on the board.</p>
    <div class="pv-stats"><div><b>12</b><span>Hotel nights</span></div><div><b>4</b><span>Home bases</span></div><div><b>21</b><span>Stops mapped</span></div><div><b>$10.7k</b><span>priced target</span></div></div>
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
      <h2>Epic Alpine scenery, minus the Swiss price tag</h2>
      <p>This is the answer to &ldquo;Switzerland looks incredible but costs a fortune.&rdquo; Slovenia&rsquo;s Julian Alps deliver Bled, glacial gorges, and the emerald Soča for roughly a third less &mdash; and because it&rsquo;s one compact country with one rental car and short drives, it&rsquo;s far easier than a two-country Alpine plan. The trade is the swim: the Adriatic at Piran is a swimmable-but-refreshing ~72&deg;F, not a warm lagoon. The route runs <b>Bled (4 nights) -> Bovec/Soča (3) -> Piran (3) -> Ljubljana (2)</b> and protects the required full days in Pittsburgh on <b>Jun 24-26</b>.</p>
    </div>
    <div class="overview">
      <div class="ocard"><p class="eyebrow">Route</p><h4>LJU -> Bled -> Vršič -> Soča -> Piran -> Ljubljana -> LJU</h4><p>One country, one rental car, four bases, no intra-Europe flight and no open-jaw. Longest single drive is ~2h30. Home by Tue Jun 22.</p></div>
      <div class="ocard"><p class="eyebrow">Why it wins</p><h4>Scenery per dollar</h4><p>Bled, the Vršič Pass, and the Soča rival the Alps proper, but Slovenia&rsquo;s lodging, food, activities, and car all cost far less. The priced target lands under the $12k goal.</p></div>
      <div class="ocard"><p class="eyebrow">The honest trade</p><h4>The swim is good, not tropical</h4><p>Piran&rsquo;s Adriatic is ~72&deg;F in June &mdash; warmer than the Atlantic plans, cooler than the Greek/Crete ones. Croatia would be the obvious warm partner but is excluded by family choice; a Greece swim-leg swap is documented as a variant.</p></div>
    </div>
  </section>

  <section id="why-this-trip" class="divider">
    <div class="section-label">
      <p class="eyebrow">Why This Trip</p>
      <h2>The value pick with the biggest scenery</h2>
      <p>It answers the Switzerland problem &mdash; same order of Alpine drama, far lower cost, and a single easy country &mdash; while still ending on warm water.</p>
    </div>
    <div class="plan-grid">
      ${card('Alps drama, low cost', `<p>Lake Bled, the Vogel panorama, the Vršič Pass&rsquo;s 50 hairpins, and the emerald Soča are Alpine-grade scenery, but Slovenia&rsquo;s prices are a fraction of Switzerland&rsquo;s. The priced target lands under the $12k goal instead of blowing past it.</p>`)}
      ${card('One easy country', `<p>One rental car for the whole trip, four bases, short drives, no intra-Europe flight, no open-jaw ticket. After the mountains, the emerald river, and the caves, the coast and the capital fall in a clean loop back to the airport.</p>`)}
      ${card('The honest trade', `<p>You buy scenery, ease, and value; you give up warm-lagoon swimming. Piran&rsquo;s ~72&deg;F Adriatic is real and pleasant but refreshing, and the glacial Soča is for rafting, not floating. Croatia is excluded by family decision; a Greece swim-leg is a variant.</p>`)}
    </div>
  </section>

  <section id="stays" class="divider">
    <div class="section-label">
      <p class="eyebrow">Where We Stay</p>
      <h2>Four bases in a tidy loop</h2>
      <p>Every base is a ~30 min to ~2h30 drive from the last, so the one rental car never sits idle and there&rsquo;s no backtracking. No airport-buffer night is needed &mdash; the last base, Ljubljana, is 25 minutes from the airport.</p>
    </div>
    <div class="plan-grid">
      ${card('Lake Bled &middot; 4 nights', `${prow('Target', 'Bled or Bohinj apartment &middot; €130-170/night')}${prow('Why', 'Central to Bled, Vintgar, Bohinj, and Vogel; 30 min from LJU')}${prow('Add', 'Tourist tax ~€2.50/person/night')}`)}
      ${card('Bovec / Soča &middot; 3 nights', `${prow('Target', 'Bovec or Kobarid apartment &middot; €110-150/night')}${prow('Why', 'Base for rafting, the Great Gorge, Kozjak, and Tolmin')}${prow('Arrive', 'Over the Vršič Pass as the scenic transfer')}`)}
      ${card('Piran &middot; 3 nights', `${prow('Target', 'Piran or Portorož apartment &middot; €150-200/night (peak coast)')}${prow('Why', 'Walk to the old town and swims; drive to Fiesa and Sečovlje')}${prow('Route', 'Via the Škocjan Caves from the Soča')}`)}
      ${card('Ljubljana &middot; 2 nights', `${prow('Target', 'Old Town apartment &middot; €110-150/night')}${prow('Why', 'Car-free center, castle, riverfront; 25 min to the airport')}${prow('Park', 'Garage ~€15/day cap')}`)}
    </div>
  </section>

  <section id="calendar" class="divider">
    <div class="section-label">
      <p class="eyebrow">Calendar</p>
      <h2>Jun 8-22 fits the window and protects the Pittsburgh dates</h2>
      <p>Dates sit inside the Jun 6-Aug 15, 2027 planning window, return before the preferred Jun 23 date, and keep the family in Pittsburgh all day Jun 24-26.</p>
    </div>
    ${table(['Date', 'Night', 'Base', 'Purpose'], [
      ['Tue Jun 8', 'Red-eye', 'PIT -> Ljubljana', 'After-work departure'],
      ['Wed Jun 9-Sat Jun 12', '4', 'Lake Bled', 'Bled, Vintgar, Bohinj, Vogel'],
      ['Sun Jun 13', 'transfer', 'Vršič -> Bovec', 'Scenic pass drive to the Soča'],
      ['Sun Jun 13-Tue Jun 15', '3', 'Bovec / Soča', 'Rafting, Great Gorge, Kozjak, Tolmin'],
      ['Wed Jun 16', 'transfer', 'Škocjan -> Piran', 'Caves en route to the coast'],
      ['Wed Jun 16-Fri Jun 18', '3', 'Piran', 'Old town, beaches, Sečovlje'],
      ['Sat Jun 19-Sun Jun 20', '2', 'Ljubljana', 'Castle, Old Town, market'],
      ['Mon-Tue Jun 21-22', 'Home', 'Ljubljana -> PIT', 'Arrive before blackout'],
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
        <button data-region="gorenjska"><span class="sw" style="background:#1f6f78"></span>Julian Alps</button><button data-region="soca"><span class="sw" style="background:#3f7d4e"></span>Soča Valley</button><button data-region="primorska"><span class="sw" style="background:#3a6ea5"></span>Adriatic coast</button><button data-region="ljubljana"><span class="sw" style="background:#7d5ba6"></span>Ljubljana</button><button data-region="transfer"><span class="sw" style="background:#c25a3a"></span>Flights</button><button data-region="all">Whole trip</button>
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
      <h2>Two hops in, or fly Venice and drive</h2>
      <p>Research status: 2027 schedules are not yet bookable, so current 2025-2026 route and fare signals are planning proxies. Re-quote on ITA Matrix once inventory opens.</p>
    </div>
    <div class="plan-grid">
      ${card('PIT -> Ljubljana (LJU)', `${prow('Reality', 'No PIT-Europe nonstop; LJU has no long-haul at all')}${prow('Corridors', 'PIT -> EWR/IAD/ORD -> FRA/MUC/VIE -> LJU (Lufthansa group)')}${prow('Fare signal', '~$1,200-$1,700 pp; ~$4,800-$6,800 for four')}`)}
      ${card('Cheaper: Venice (VCE)', `${prow('Why', 'More capacity, often a single connection, usually cheaper')}${prow('Fare signal', '~$900-$1,400 pp; ~$3,600-$5,600 for four')}${prow('Cost', 'A ~2h13 drive to Slovenia + a cross-border car fee')}`)}
      ${card('Connection risk', `${prow('Weak link', 'The final LJU leg has ~3 flights/day - a missed evening connection can mean an overnight at the hub')}${prow('Rule', 'Book one through-ticket, not a self-transfer, with kids')}${prow('Trieste (TRS)', 'Closest airport (~1h20) but thin US connectivity')}`)}
      ${card('Round-trip total', `${prow('Target', '~$4,800 family (round-trip LJU) or less via VCE')}${prow('High', '~$6,400 if booked late or summer demand runs hot')}${prow('ETIAS', 'Likely mandatory by Jun 2027; ~€20/adult, kids exempt but must apply')}`)}
    </div>
  </section>

  <section id="getting-around" class="divider">
    <div class="section-label">
      <p class="eyebrow">Getting Around</p>
      <h2>One rental car, one vignette, short drives</h2>
      <p>Slovenia is compact: the whole loop is a series of ~30 min to ~2h30 drives on good roads. The one thing not to forget is the mandatory motorway e-vignette.</p>
    </div>
    <div class="plan-grid">
      ${card('The rental car', `${prow('Plan', 'One automatic, LJU pickup and drop, whole trip')}${prow('Budget', '~$700-$1,200 for two weeks; book the automatic early')}${prow('Why', 'Bled, the Soča, the coast, and the caves all need a car')}`)}
      ${card('The e-vignette', `${prow('Required', 'Mandatory e-vinjeta for motorways/expressways')}${prow('Cost', '~€32 monthly; buy at evinjeta.dars.si or a petrol station')}${prow('Exempt', 'Regional roads incl. the Vršič Pass need no vignette')}`)}
      ${card('The drives', `${prow('Scenic', 'Bled -> Bovec over Vršič is the highlight, not just transit')}${prow('Longest', 'Bovec -> Piran (with Škocjan) ~2h30')}${prow('Fuel', '~€6/gallon; ~€150-250 for the trip')}`)}
    </div>
  </section>`;

const healthTiming = `<section id="health-check" class="divider">
    <div class="section-label">
      <p class="eyebrow">Plan Health-Check</p>
      <h2>What to lock, watch, and expect</h2>
      <p>Current research refreshed July 2026 for a June 2027 trip. Kids assumed 13 and 8.</p>
    </div>
    <div class="hc-grid">
      <div class="hc good"><span class="hc-tag">Solid</span><h4>Scenery-per-dollar is the win</h4><p>Alpine-grade lakes, passes, gorges, and an emerald river for a priced target under $12k. Slovenia is the value answer to an expensive Switzerland plan, without giving up the drama.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>One easy country</h4><p>One rental car, four bases, short drives, no intra-Europe flight and no open-jaw. Low logistics friction on the ground &mdash; the ease this trip is built on.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The Pittsburgh dates are protected</h4><p>Depart Tue Jun 8, fly home Mon Jun 21, arrive by Tue Jun 22 &mdash; ahead of the preferred Jun 23 return and the required full days Jun 24-26.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>The Vršič Pass opening</h4><p>Normally fully open by mid-June, but late snow can delay clearing and there&rsquo;s no guaranteed open-by date. Check promet.si before the transfer day; the Predel/Tarvisio route is the fallback.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>The swim is refreshing, not tropical</h4><p>Piran&rsquo;s Adriatic is ~72&deg;F in June and the Soča is a glacial 11-15&deg;C. This is a scenery-and-rafting trip with a good coastal swim, not a warm-lagoon beach holiday. Croatia (the obvious warm partner) is excluded.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Two connections each way</h4><p>LJU has no long-haul, so it&rsquo;s a two-stop routing with a fragile final leg. Book one through-ticket, or fly into Venice and drive. Fares are 2025-2026 proxies until 2027 loads.</p></div>
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
      ['Jun 27-Jul 10', '12+', '9 days', 'Valid', 'Backup; warmer sea, busier coast'],
      ['Aug 1-14', '12+', '9-10 days', 'Valid', 'Warmest Adriatic, but peak crowds and prices'],
    ])}
    <div class="verdict-box" style="border-left-color:var(--c3);margin-top:18px"><h4>PTO math</h4><p>Friday Jun 18 is Juneteenth observed for many US employers, so it costs no PTO. Likely PTO days: Jun 9, 10, 11, then Jun 14, 15, 16, 17, then Jun 21 travel &mdash; about <b>8 PTO days</b>, with weekends Jun 12-13 and 19-20 free. The plan is home a day ahead of the preferred Jun 23 return and clear of the required Pittsburgh days Jun 24-26. Early June also means the Vršič Pass is normally open and the coast is warm but pre-peak.</p></div>
  </section>`;

const budgetTips = `<section id="budget" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Money</p>
      <h2>Budget, savers &amp; splurges</h2>
      <p>Real priced planning band using 2025-2026 route/fare/lodging signals because June 2027 inventory is not live. USD, family of four. This is one of the better-value plans on the board &mdash; the target lands under the $12k goal.</p>
    </div>
    ${table(['Line item', 'Target case', 'High case'], [
      ['PIT -> Ljubljana round-trip airfare', '$4,800', '$6,400'],
      ['Lodging: 12 hotel nights, four bases', '$1,950', '$2,500'],
      ['Rental car, e-vignette, fuel, tolls, parking', '$1,000', '$1,500'],
      ['Activities: gorges, cable car, rafting, caves, castle', '$850', '$1,250'],
      ['Food and groceries, 13 travel days', '$1,700', '$2,250'],
      ['Insurance, ETIAS, fees, misc buffer', '$400', '$900'],
      ['<b>Grand total</b>', '<b>$10,700</b>', '<b>$14,800</b>'],
    ])}
    <div class="twocol">
      <div class="listcard save-list"><h4>Save money</h4><ul><li>Fly into Venice and drive &mdash; often $200-$400/person under the two-stop Ljubljana fare.</li><li>Cook in the apartments; Slovenian groceries (Mercator/Spar) are cheap.</li><li>Walk the free lakeshores and skip the pletna and cable car if the weather or the view doesn&rsquo;t cooperate.</li><li>Do the free Great Soča Gorge instead of paying for every canyon.</li><li>Buy the monthly e-vignette (same price as two weekly) and one automatic booked early.</li></ul></div>
      <div class="listcard splurge-list"><h4>Worth the splurge</h4><ul><li>Guided family rafting on the Soča &mdash; the trip&rsquo;s standout adventure.</li><li>The Vogel cable car on a clear morning for the Triglav panorama.</li><li>The full pletna-and-castle ritual at Bled with a cream cake.</li><li>The Škocjan Caves tour &mdash; a genuine UNESCO wow on the route.</li><li>A Ljubljanica river cruise and an embankment dinner to finish.</li></ul></div>
    </div>
  </section>

  <section id="totals" class="divider">
    <div class="section-label">
      <p class="eyebrow">Bottom Line</p>
      <h2>Total trip cost</h2>
      <p>This plan lands under the $12k target and keeps the high case under the $15k preferred maximum &mdash; strong value for Alpine-grade scenery. Budget is a reason to pick it, not a reason to hesitate.</p>
    </div>
    ${table(['Category', 'Estimate'], [
      ['Flights (round-trip Ljubljana, or less via Venice)', '$4,800 target / $6,400 high'],
      ['Lodging, 12 hotel nights', '$1,950 target / $2,500 high'],
      ['Rental car, e-vignette, fuel, tolls, parking', '$1,000 target / $1,500 high'],
      ['Activities, gorges, rafting, caves, castle', '$850 target / $1,250 high'],
      ['Food, groceries, 13 travel days', '$1,700 target / $2,250 high'],
      ['Insurance, ETIAS, fees, buffer', '$400 target / $900 high'],
      ['<b>Grand total - family of 4</b>', '<b>$10,700 target / $14,800 high</b>'],
    ])}
    <p class="rate-note">Per-day itinerary costs cover food + activities only. Lodging, flights, the rental car, and the e-vignette sit in the totals above, not the daily numbers.</p>
  </section>

  <section id="tips" class="divider">
    <div class="section-label">
      <p class="eyebrow">Travel Tips</p>
      <h2>The stuff nobody tells you</h2>
      <p>Operational rules that keep a compact, single-country plan running smoothly.</p>
    </div>
    <div class="tips-order">
      <p class="mini-h">Book in roughly this order</p>
      <ol>
        <li>Round-trip PIT-Ljubljana ticket (or PIT-Venice + car)<span> &middot; re-quote on ITA Matrix when 2027 loads</span></li>
        <li>One automatic rental car + the e-vignette<span> &middot; automatic booked early</span></li>
        <li>Refundable apartments in Bled, Bovec, Piran, Ljubljana<span> &middot; parking, AC, washer</span></li>
        <li>Vintgar timed online pass + Škocjan tour slot<span> &middot; both sell out / gate-free</span></li>
        <li>Soča family rafting + any Bovec zipline<span> &middot; closer to travel</span></li>
      </ol>
    </div>
    <div class="tips-grid">
      <div class="tipcard"><h4>Flights</h4><p class="sub">Two stops, or Venice</p><ul><li class="flag"><b>Book one through-ticket</b> to LJU; the final leg is fragile.</li><li><b>Venice is the cheaper gateway</b> with a 2 hr drive.</li><li><b>Re-quote the fare</b>; it&rsquo;s 2025-2026 proxy data.</li></ul></div>
      <div class="tipcard t2"><h4>Driving</h4><p class="sub">Vignette + the pass</p><ul><li class="flag"><b>Buy the e-vignette</b> before the first motorway; fines are steep.</li><li><b>Check Vršič is open</b> on promet.si before the transfer.</li><li><b>Book an automatic early</b> &mdash; manuals dominate the fleet.</li></ul></div>
      <div class="tipcard t3"><h4>Tickets</h4><p class="sub">Timed and online</p><ul><li><b>Vintgar is online/timed-only</b> &mdash; no gate sales since 2025.</li><li><b>Škocjan runs set tour times</b> &mdash; plan the drive around one.</li><li><b>Rafting has age limits</b> &mdash; family float for the 8-year-old.</li></ul></div>
      <div class="tipcard t4"><h4>Water</h4><p class="sub">Manage expectations</p><ul><li><b>Piran ~72&deg;F</b> &mdash; swimmable, refreshing, not tropical.</li><li><b>Soča is glacial</b> &mdash; wetsuit rafting, not swimming.</li><li><b>Fiesa over Piran&rsquo;s rocks</b> for easy family swims.</li></ul></div>
    </div>
  </section>`;

const socialBalanceStatus = `<section id="social" class="divider">
    <div class="section-label">
      <p class="eyebrow">What People Are Saying</p>
      <h2>Research signals to keep in mind</h2>
      <p>Official operator prices, current route data, and June climate all point the same way: Slovenia is the value-and-scenery pick, with a good-not-tropical coastal swim.</p>
    </div>
    <div class="plan-grid">
      ${card('Value signal', `<p>Operator fares (Bled pletna, Vintgar, Vogel, Tolmin, Škocjan, Ljubljana castle) and cheap lodging, food, and car all confirm the same thing: this is one of the best-value plans on the board, landing under the $12k target while delivering Alpine-grade scenery.</p>`)}
      ${card('Weather signal', `<p>Julian Alps June sees frequent afternoon showers and the coast is warm-dry; the gorges and caves are the smart rainy-window picks, and water sports go in the morning ahead of storms.</p>`)}
      ${card('Family signal', `<p>The Soča family raft, the shallow Fiesa and Portorož beaches, and the pletna-and-castle ritual are the wins for an 8-year-old; the 13-year-old gets standard rafting, the zipline, and the Škocjan canyon walk.</p>`)}
    </div>
  </section>

  <section id="balance" class="divider">
    <div class="section-label">
      <p class="eyebrow">Trip Balance</p>
      <h2>What the days add up to</h2>
      <p>Nature-forward &mdash; lakes, gorges, a mountain pass, and an emerald river &mdash; with the coast and the capital carrying the town time and the warm-water days.</p>
    </div>
    <div class="bar"><i style="width:30%;background:#3a6ea5"></i><i style="width:25%;background:#7d5ba6"></i><i style="width:45%;background:#3f7d4e"></i></div>
    <div class="balance">
      <div class="bcard k1"><div class="pct">30%</div><h4>Water &middot; Coast &middot; Lakes</h4><p>Piran and the Punta rocks, Fiesa and Portorož beaches, the Sečovlje pans, plus the Bled and Bohinj lakes and Soča rafting.</p></div>
      <div class="bcard k2"><div class="pct">25%</div><h4>Towns &middot; Food &middot; Reset</h4><p>Piran&rsquo;s Venetian old town, Ljubljana&rsquo;s riverfront and castle, Bled and Bovec villages, groceries, and the arrival day.</p></div>
      <div class="bcard k3"><div class="pct">45%</div><h4>Alps &middot; Gorges &middot; River</h4><p>Vintgar, Bohinj and Vogel, the Vršič Pass, the Great Soča Gorge, Kozjak, the Tolmin Gorges, and the Škocjan Caves.</p></div>
    </div>
  </section>

  <section id="status" class="divider">
    <div class="section-label"><p class="eyebrow">Settled &amp; Open</p><h2>What is decided, what still needs a call</h2><p>The route is opinionated, but 2027 fares, the Vršič opening, and the coast-swim expectation need confirming before booking.</p></div>
    <div class="status"><div class="scol settled"><h4>Settled</h4>
      <div class="row"><b>Slug</b><span>slovenia-adriatic</span></div>
      <div class="row"><b>Route</b><span>Bled 4 nights -> Bovec 3 (via Vršič) -> Piran 3 (via Škocjan) -> Ljubljana 2, round-trip LJU, one rental car.</span></div>
      <div class="row"><b>Dates</b><span>Depart Tue Jun 8, 2027; home by Tue Jun 22, ahead of the preferred Jun 23 return and required Pittsburgh days Jun 24-26.</span></div>
      <div class="row"><b>Swim decision</b><span>The warm water is Piran&rsquo;s ~72&deg;F Adriatic; Croatia (the obvious warm partner) is excluded by family choice.</span></div>
      <div class="row"><b>Budget verdict</b><span>$10,700 target / $14,800 high &mdash; under the $12k target and the $15k preferred maximum. Value is a reason to pick it.</span></div>
    </div><div class="scol open"><h4>Open</h4>
      <div class="row"><b>Airfare</b><span>No live 2027 quote; 2025-2026 proxy. Compare round-trip LJU vs Venice-in-and-drive on ITA Matrix.</span></div>
      <div class="row"><b>Vršič opening</b><span>Normally open by mid-June but not guaranteed; confirm on promet.si, keep the Predel fallback.</span></div>
      <div class="row"><b>Warm-swim swap</b><span>A Greece swim-leg variant is documented for families who want a truly warm-water week.</span></div>
      <div class="row"><b>Timed tickets</b><span>Vintgar (online-only) and Škocjan (set tour times) need booking ahead in peak season.</span></div>
    </div></div>
  </section>`;

const todo = {
  labelHtml: `
      <p class="eyebrow">Pre-Departure To-Do</p>
      <h2>What to book before leaving</h2>
      <p>Planning sequence for the Jun 8-22, 2027 Slovenia route. Track fares before buying; compare a round-trip Ljubljana ticket against flying into Venice and driving.</p>
    `,
  blocks: [
    {
      when: 'Jul-Aug 2026',
      tone: 'hot',
      title: 'Flight inventory opens: track, do not auto-buy',
      note: 'Price the family-of-4 total both ways and set alerts; buy only when routing and price both work.',
      items: [
        '<b>Track PIT -> LJU (two-stop) vs PIT -> VCE + drive.</b> Watch Lufthansa group via FRA/MUC/VIE, and United/Delta into Venice.',
        '<b>Set the airfare gate.</b> Target ~$4,800 family round-trip LJU; high case ~$6,400. Venice often runs cheaper.',
        '<b>Favor one through-ticket to LJU</b> over a self-transfer &mdash; the final leg is the fragile one.',
      ],
    },
    {
      when: 'By Sep 2026',
      title: 'Hold refundable lodging + the car',
      items: [
        '<b>Bled/Bohinj</b> 4 nights, <b>Bovec/Kobarid</b> 3, <b>Piran/Portorož</b> 3, <b>Ljubljana</b> 2 &mdash; refundable, with parking and a washer.',
        '<b>Reserve one automatic rental car</b> for LJU pickup and drop, whole trip.',
        '<b>Note the e-vignette</b> &mdash; buy it before the first motorway if the car doesn&rsquo;t already have one.',
      ],
    },
    {
      when: 'Winter 2026-27',
      tone: 'watch',
      title: 'Documents and the pass',
      items: [
        '<b>Check passports, ETIAS (likely mandatory by Jun 2027; kids exempt but must apply), and travel insurance.</b>',
        '<b>Carry an AAA International Driving Permit</b> as cheap insurance for the rental.',
        '<b>Bookmark promet.si</b> to confirm the Vršič Pass is open near travel; know the Predel fallback.',
      ],
    },
    {
      when: '60-30 days out',
      title: 'Turn the plan into bookings',
      items: [
        '<b>Buy the Vintgar Gorge timed online pass</b> &mdash; there are no tickets at the gate.',
        '<b>Book a Škocjan Caves tour slot</b> and the Soča family rafting.',
        '<b>Reserve any Bovec zipline</b> and check the kids&rsquo; height/weight against the operator limits.',
      ],
    },
    {
      when: 'Final 2 weeks',
      tone: 'done',
      title: 'Operational checks',
      items: [
        '<b>Download offline maps</b> for the Julian Alps, the Soča, the coast, and Ljubljana.',
        '<b>Reconfirm flight times, the LJU car counter, the Vršič status, and the gorge/cave slots.</b>',
        '<b>Pack rain shells and layers for the Alps, plus swim gear and reef shoes for Piran&rsquo;s rocks.</b>',
      ],
    },
  ],
  callout: '<b>Do not forget:</b> this is the value pick &mdash; Alpine-grade scenery in one easy country under the $12k target. Buy the e-vignette, confirm the Vršič Pass, and set expectations that the swim is a good ~72&deg;F, not tropical.',
};

const scorecard = {
  displayName: 'Slovenia + Adriatic',
  blurb: 'Julian Alps value + a warm Piran finish',
  axes: {
    budget: 3,
    weather: 3,
    swim: 3,
    variety: 5,
    ease: 3,
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
    floorUsd: 10700,
    ceilUsd: 14800,
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
    swimTempF: [70, 73],
    noPassport: false,
    singleTicket: false,
    hasSwim: true,
  },
  totalBaked: 37,
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
  countries: ['slovenia'],
  packingTags: ['hiking', 'beach', 'rain'],
  slug: 'slovenia-adriatic',
  lang: 'en',
  title: 'Slovenia + Adriatic · Julian Alps to Piran — June 2027',
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  overrides: {
    packing: [
      '<b>Rain shells + layers:</b> the Julian Alps see frequent June afternoon showers; the Vršič summit is cool.',
      '<b>Reef/water shoes:</b> for Piran&rsquo;s rocky bathing platforms and the gorge boardwalks.',
      '<b>Grippy trainers:</b> Vintgar, Tolmin, and the ~1,000-step Škocjan tour want real shoes.',
      '<b>Swim + sun kit:</b> suits, UPF shirts, hats, and sunscreen for the coast and the exposed salt pans.',
      '<b>A warm layer for caves:</b> Škocjan is ~12&deg;C underground even on a hot day.',
    ],
  },
  itinerary: {
    className: 'divider',
    labelHtml: `
      <p class="eyebrow">The Itinerary</p>
      <h2>Day by day</h2>
      <p>Swipe each carousel for photos. Every stop carries its cost, a money-saving tip, a splurge, picky-kid restaurants, backup / if-time ideas, blog links, and a map. Daily costs are food + activities only, not flights, lodging, or the rental car.</p>
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
