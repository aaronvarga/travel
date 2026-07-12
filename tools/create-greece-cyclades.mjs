#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const outDir = path.join(root, 'src/_data/greece-cyclades');

// ---- helpers (mirroring the other create-*.mjs builders) --------------------
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
function mkSpot({ name, tags, carouselId, images, lat, lng, cost, climateLabel = 'Weather', climate, save, splurge, restos, alts, blogs }) {
  return {
    name,
    exploreHtml: explore(name, tags),
    carouselId,
    images,
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

// ---- self-hosted photos: 30 downloaded, optimized local assets --------------
const BASE = '../../assets/img/greece-cyclades';
function im(file, alt, captionTitle, credit) {
  const src = `${BASE}/${file}`;
  return { href: src, src, alt, captionTitle, credit };
}

// ---- map -------------------------------------------------------------------
const mapColors = {
  athens: '#7d5ba6',
  naxos: '#1f6f78',
  paros: '#3f7d4e',
  milos: '#3a6ea5',
  transfer: '#c25a3a',
};
const mapPoints = [
  point('Athens Airport (ATH)', 37.9364, 23.9445, 'transfer', 'flight'),
  point('Plaka / Acropolis base (Athens)', 37.9715, 23.7268, 'athens', 'hotel'),
  point('Acropolis &amp; Parthenon', 37.9715, 23.7257, 'athens', 'view'),
  point('Anafiotika (Cycladic quarter)', 37.9727, 23.7278, 'athens', 'town'),
  point('Piraeus ferry port', 37.9475, 23.6350, 'transfer', 'flight'),
  point('Naxos Town / Chora base', 37.1055, 25.3760, 'naxos', 'hotel'),
  point('Portara (Temple of Apollo gate)', 37.1090, 25.3730, 'naxos', 'view'),
  point('Agios Prokopios beach', 37.0850, 25.3560, 'naxos', 'beach'),
  point('Plaka beach (Naxos)', 37.0700, 25.3620, 'naxos', 'beach'),
  point('Halki (kitron village)', 37.0430, 25.4790, 'naxos', 'town'),
  point('Apeiranthos (marble village)', 37.0640, 25.5330, 'naxos', 'town'),
  point('Naoussa harbor (Paros)', 37.1236, 25.2380, 'paros', 'town'),
  point('Kolymbithres beach', 37.1300, 25.2270, 'paros', 'beach'),
  point('Golden Beach (Chrissi Akti)', 37.0430, 25.2560, 'paros', 'beach'),
  point('Parikia old town', 37.0855, 25.1500, 'paros', 'town'),
  point('Adamas port (Milos)', 36.7250, 24.4470, 'milos', 'hotel'),
  point('Kleftiko sea caves', 36.6690, 24.3390, 'milos', 'view'),
  point('Sarakiniko moonscape', 36.7580, 24.4460, 'milos', 'beach'),
  point('Firopotamos cove', 36.7580, 24.4210, 'milos', 'beach'),
  point('Klima (syrmata boat houses)', 36.7360, 24.4110, 'milos', 'town'),
  point('Plaka village &amp; castle (Milos)', 36.7460, 24.4270, 'milos', 'view'),
  point('Milos Airport (MLO)', 36.6970, 24.4770, 'transfer', 'flight'),
];

// ---- spots -----------------------------------------------------------------
const acropolisSpot = mkSpot({
  name: 'The Acropolis &amp; the marble city',
  tags: ['acropolis', 'parthenon', 'athens'],
  carouselId: 'c-acropolis',
  images: [
    im('google_acropolis_golden.jpg', 'The Parthenon and Odeon of Herodes Atticus on the Acropolis rock, warm golden-hour side light over green foreground.', 'Acropolis, Golden Hour', 'Constantinos Kollias · Unsplash License'),
    im('google_acropolis_dusk.jpg', 'The illuminated Parthenon on the Acropolis against a deep red and blue twilight sky above the city lights.', 'Parthenon at Blue Hour', 'Simone Dinoia · Unsplash License'),
  ],
  lat: 37.9715,
  lng: 23.7257,
  cost: 'The headline is the Acropolis: a combined site ticket is about &euro;30 adult in summer; children under 5 are free and non-EU kids 6&ndash;25 pay a reduced ~&euro;15, so a family of four runs roughly &euro;75&ndash;90 (~$85&ndash;100). Since 2024 entry is a <b>mandatory timed slot</b> &mdash; book online at hhticket.gr and arrive in your 15-minute window. The separate Acropolis Museum is ~&euro;15 (summer) and is the air-conditioned, kid-friendly companion.',
  climateLabel: 'City heat',
  climate: '<b>Hot, dry, sunny inland.</b> June highs average ~30&deg;C / 86&deg;F and there is almost no shade on the rock. Go at opening (~8am) or after 6pm; the midday climb is brutal for an 8-year-old. Carry 2+ liters of water, hats, and sunscreen; sunset is ~9pm, so a late-afternoon visit stays comfortable.',
  save: 'Book the earliest timed slot to beat the heat and the cruise crowds, and skip the paid guided tours &mdash; the free hilltop climb to Areopagus or Filopappou gives the postcard Parthenon view for nothing.',
  splurge: 'Pair the site with the Acropolis Museum (the AC and the scale models are a genuine kid win), then a rooftop dinner in Plaka or Monastiraki with the lit Parthenon overhead.',
  restos: [
    '<b>Tzitzikas kai Mermigas (Syntagma)</b> &mdash; big Greek menu, famous fresh chips and grilled-pork pita the kids reliably eat',
    '<b>A Plaka pizza/pasta trattoria</b> &mdash; wood-fired pizza and simple pasta a two-minute walk from the site for the pickiest eater',
    '<b>A family taverna at the foot of the Acropolis</b> &mdash; pork or chicken gyros, tzatziki, bread, and fries as the dependable fallback',
  ],
  alts: [
    '<b>Late-afternoon Acropolis</b> instead of morning if you want the marble in warm light and cooler air.',
    '<b>Acropolis Museum first</b> on a scorching day for the AC, then the rock at 6pm.',
    '<b>Cape Sounion (Temple of Poseidon)</b> as a half-day sea-cliff sunset drive if you have a spare afternoon.',
  ],
  blogs: [
    { label: 'Acropolis timed tickets — hhticket.gr', href: 'https://hhticket.gr/' },
    { label: 'Acropolis Museum — plan your visit', href: 'https://www.theacropolismuseum.gr/en/plan-your-visit' },
  ],
});

const plakaSpot = mkSpot({
  name: 'Plaka &amp; Anafiotika',
  tags: ['plaka', 'anafiotika', 'athens'],
  carouselId: 'c-plaka',
  images: [
    im('google_plaka_lane.jpg', 'A pedestrian Plaka lane of pastel neoclassical houses with blue shutters, potted plants, and bougainvillea below the Acropolis hill.', 'Plaka Lanes', 'Matt Cramblett · Unsplash License'),
    im('google_plaka_taverna.jpg', 'A weathered taverna sign and street name on a warm-yellow Plaka wall with a potted plant in soft light.', 'Plaka Detail', 'Despina Galani · Unsplash License'),
  ],
  lat: 37.9727,
  lng: 23.7278,
  cost: 'Free to wander. Plaka is the old pedestrian quarter under the Acropolis &mdash; neoclassical lanes, tavernas, and souvenir stalls &mdash; and tucked into its upper slope is <b>Anafiotika</b>, a pocket of whitewashed, blue-doored Cycladic houses built by island masons in the 1840s. It is the trip&rsquo;s gentle first taste of the islands, and a perfect jet-lag evening stroll.',
  climateLabel: 'Old town',
  climate: '<b>Shaded, walkable, warm-evening.</b> The narrow lanes hold shade even midday, and June evenings stay pleasant into the night. Anafiotika is residential &mdash; steep little stair-paths, worth the quiet respect (people live there).',
  save: 'Make Plaka your free arrival-evening walk: climb the Anafiotika stairs for the rooftop-to-Lycabettus view at golden hour and eat where the locals do, off the main tourist strip.',
  splurge: 'A sit-down dinner on a vine-shaded Plaka terrace, plus a loukoumades (honey-doughnut) stop the kids will remember longer than any ruin.',
  restos: [
    '<b>Plaka tavernas off the main lane</b> &mdash; gyros, souvlaki, chips, and bread; the easiest picky-kid dinner in Athens',
    '<b>A Monastiraki pita counter</b> &mdash; &euro;3&ndash;4 pork/chicken gyros for a fast, cheap arrival-night meal',
    '<b>Loukoumades shop</b> &mdash; hot honey doughnuts for dessert as the jet-lag treat',
  ],
  alts: [
    '<b>Anafiotika at golden hour</b> for the whitewashed-village preview and the best rooftop light.',
    '<b>National Garden</b> for a shaded, free morning with the 8-year-old before the Acropolis.',
    '<b>Panathenaic (Kallimarmaro) Stadium</b> for a quick run around the marble track.',
  ],
  blogs: [
    { label: 'Anafiotika neighborhood guide', href: 'https://www.walksdevour.com/blog/anafiotika/' },
    { label: 'Athens in June — weather', href: 'https://www.weather2travel.com/greece/athens/june/' },
  ],
});

const portaraSpot = mkSpot({
  name: 'Naxos Chora &amp; the Portara at sunset',
  tags: ['portara', 'naxos', 'naxoschora'],
  carouselId: 'c-portara',
  images: [
    im('google_naxos_portara_sunset.jpg', 'The great marble Portara doorway of the Temple of Apollo silhouetted with the sun setting exactly inside the frame over the Aegean.', 'The Portara at Sunset', 'Pexels · Pexels License'),
    im('google_naxos_chora_causeway.jpg', 'The whitewashed town of Naxos Chora cascading to a curving stone causeway that reaches into a turquoise bay with swimmers.', 'Chora &amp; the Causeway', 'Pexels · Pexels License'),
    im('google_naxos_chora_aerial.jpg', 'Aerial view of the Naxos Chora causeway curving toward the Portara islet with the white town and mountains behind.', 'Chora from Above', 'Chris Barbalis · Unsplash License'),
  ],
  lat: 37.1090,
  lng: 25.3730,
  cost: 'Free, 24/7. The <b>Portara</b> &mdash; the colossal marble doorway of an unfinished 6th-century-BC Temple of Apollo &mdash; stands on the islet off Naxos Town, a 10-minute walk across the causeway and up ~75 steps. It frames the sunset like nothing else in the Cyclades. Below it, Naxos Chora tumbles up to a Venetian kastro of stone lanes.',
  climateLabel: 'Aegean',
  climate: '<b>Warm, sunny, breezy.</b> June air tops out around ~28&deg;C / 82&deg;F with low humidity, and the sea has warmed to ~22&deg;C / 72&deg;F. Afternoons can pick up a north breeze (the meltemi is mild in early/mid June); the causeway to the Portara is exposed and glorious at golden hour.',
  save: 'The Portara is free &mdash; make it your first-evening ritual, arriving 45 minutes before sunset for a spot on the marble. Wander the kastro lanes for nothing rather than paying for a walking tour.',
  splurge: 'A waterfront-taverna dinner in Chora after the sunset, then a Naxos kitron (citron) liqueur nightcap for the grown-ups.',
  restos: [
    '<b>Caya (Naxos Town)</b> &mdash; Italian-Mediterranean with wood-fired pizza and gnocchi, an easy picky-kid win',
    '<b>Scirocco (Protodikeiou Sq.)</b> &mdash; family-run since 1995, modern Greek with pasta and grilled plates',
    '<b>Trata (Agios Georgios beach)</b> &mdash; classic beach taverna: grilled meat, fries, pasta, calamari',
  ],
  alts: [
    '<b>Portara at dawn</b> if you want it crowd-free instead of the sunset scrum.',
    '<b>Kastro walk + Della Rocca-Barozzi tower</b> for a bit of Venetian history in the lanes.',
    '<b>Naxos Town harbor stroll</b> for a low-key first evening if the flight day was long.',
  ],
  blogs: [
    { label: 'Portara — visiting info', href: 'https://explorenaxosparos.com/portara-naxos-temple-of-apollo/' },
    { label: 'Naxos in June — climate', href: 'https://www.climatestotravel.com/climate/greece/naxos' },
  ],
});

const naxosBeachSpot = mkSpot({
  name: 'Agios Prokopios &amp; Plaka: the long sandy beaches',
  tags: ['agiosprokopios', 'plakabeach', 'naxos'],
  carouselId: 'c-naxbeach',
  images: [
    im('google_naxos_town_beach.jpg', 'A long crescent of golden sand meeting shallow turquoise water below the white town of Naxos, hills behind.', 'Naxos Sand &amp; Shallows', 'Efrem Efre · Pexels License'),
    im('google_naxos_bay_aerial.jpg', 'Aerial view of a Naxos bay with clear turquoise shallows, sandy shore, and the white town along the coast.', 'Naxos Bay from Above', 'Efrem Efre · Pexels License'),
  ],
  lat: 37.0850,
  lng: 25.3560,
  cost: 'The reason Naxos is the family base. <b>Agios Prokopios</b> is a Blue-Flag, 1.5 km crescent of golden sand with a gentle shallow shelf &mdash; the most kid-friendly swim on the trip. Sunbed-and-umbrella pairs run ~&euro;20/day at the organized south end; the north end is free. <b>Plaka beach</b> next door is a 4 km ribbon of white sand and dunes. Water is a warming ~22&deg;C / 72&deg;F.',
  climateLabel: 'Sea',
  climate: '<b>Sandy, shallow, west-facing.</b> Warm sun and calm mornings; the meltemi, when it blows, hits these west-coast beaches strongest in the afternoon, so swim early and picnic late. For a truly wind-sheltered day, the south/east beaches (Agiassos, Kalantos) stay calmer.',
  save: 'Park at the free north end of Agios Prokopios, bring your own umbrella, and swim before the afternoon breeze; a local bus (~&euro;3.50) reaches the beaches if you skip the car that day.',
  splurge: 'A front-row sunbed set with a beach-bar lunch, or a lesson at a Plaka/Mikri Vigla watersports center for the 13-year-old (windsurf/SUP).',
  restos: [
    '<b>Beach-bar tavernas at Agios Prokopios</b> &mdash; toasties, fries, pasta, and grilled fish steps from the sand',
    '<b>Caya or a Chora pizzeria</b> &mdash; back in town for a reliable wood-fired-pizza dinner',
    '<b>Naxos Town gyros counters</b> &mdash; cheap, fast picky-kid lunches between swims',
  ],
  alts: [
    '<b>Plaka beach dunes</b> for a wilder, quieter stretch than Agios Prokopios.',
    '<b>Mikri Vigla</b> for the windier watersports end if the teen wants a lesson.',
    '<b>Agiassos or Kalantos (south)</b> as the meltemi-sheltered backup on a windy day.',
  ],
  blogs: [
    { label: 'Agios Prokopios guide', href: 'https://www.thecommonwanderer.com/blog/agios-prokopios-naxos-guide' },
    { label: 'Naxos June sea temperature', href: 'https://seatemperature.info/june/naxos-water-temperature.html' },
  ],
});

const naxosVillageSpot = mkSpot({
  name: 'Halki &amp; Apeiranthos: the mountain villages',
  tags: ['apeiranthos', 'halki', 'naxos'],
  carouselId: 'c-naxvillage',
  images: [
    im('google_apeiranthos.jpg', 'The marble-paved main square of Apeiranthos, Naxos’s mountain village, with a taverna under a tree and stone lanes in soft evening light.', 'Apeiranthos Square', 'Gábor Tikos · Flickr'),
    im('google_naxos_stone_alley.jpg', 'A whitewashed stone-paved alley in a Naxos village, narrow and shaded between traditional houses.', 'Village Lanes', 'Efrem Efre · Pexels License'),
    im('google_naxos_blue_alley.jpg', 'A blue-and-white Naxos village alley with vibrant flowers and a parked Vespa.', 'Blue &amp; White', 'Efrem Efre · Pexels License'),
  ],
  lat: 37.0640,
  lng: 25.5330,
  cost: 'Naxos is the greenest, most mountainous Cyclade, and its inland villages are the antidote to a pure beach trip. <b>Halki</b> (~25 min up) is the old kitron capital: the free Vallindras distillery pours a family-friendly citron-liqueur tasting with a small museum. <b>Apeiranthos</b> (~30&ndash;40 min) is a marble-paved mountain village of Venetian towers and little museums. Both are free to wander; you just need the rental car and a couple of euros for coffee.',
  climateLabel: 'Mountains',
  climate: '<b>Cooler and greener up high.</b> The drive climbs through Tragea olive valleys to villages several degrees cooler than the coast &mdash; a smart midday escape from beach heat or an afternoon meltemi. Marble lanes are shaded; bring grippy shoes for the cobbles.',
  save: 'The villages cost nothing to explore and the Vallindras kitron tasting is free &mdash; make it a self-drive loop (Halki &rarr; Filoti &rarr; Apeiranthos) with a taverna lunch, no tour needed.',
  splurge: 'Lunch at a mountain taverna in Apeiranthos or Filoti with a view over the Tragea, plus a stop at the Fish &amp; Olive ceramics gallery in Halki.',
  restos: [
    '<b>Apeiranthos / Filoti mountain tavernas</b> &mdash; grilled meat, fries, and local cheese with a valley view',
    '<b>Halki cafes on the square</b> &mdash; toasties, sweets, and drinks around the kitron distillery',
    '<b>A bakery in Chalki or Filoti</b> &mdash; cheese pies and pastries for a picky-kid car lunch',
  ],
  alts: [
    '<b>Temple of Demeter (Sangri)</b> as an easy ancient-site add-on on the way up.',
    '<b>Melanes / Flerio kouros</b> to hunt the giant unfinished marble statue lying in an orchard.',
    '<b>Mount Zas cave</b> for a short hike with the teen if you want a leg-stretch.',
  ],
  blogs: [
    { label: 'Halki (kitron village) guide', href: 'https://www.thecommonwanderer.com/blog/halki-naxos-guide' },
    { label: 'Naxos villages one-day drive', href: 'https://naxosdrivetime.com/en/page/one-day-guide-on-the-most-beautiful-villages-of-naxos' },
  ],
});

const naoussaSpot = mkSpot({
  name: 'Naoussa: the fishing harbor at golden hour',
  tags: ['naoussa', 'paros', 'naoussaparos'],
  carouselId: 'c-naoussa',
  images: [
    im('google_naoussa_harbor.jpg', 'The old Naoussa harbor on Paros lined with fishing boats and white tavernas under a bright Aegean sky.', 'Naoussa Harbor', 'AXP Photography · Pexels License'),
    im('google_paros_village.jpg', 'A Paros hillside village of whitewashed houses with a tall pine, warm evening light over the Cycladic rooftops.', 'Paros Whitewash', 'Tobias Rademacher · Unsplash License'),
    im('google_paros_hillside.jpg', 'Stacked white Cycladic houses with blue shutters climbing a Paros hillside.', 'Cycladic Houses', 'Diego F. Parra · Pexels License'),
  ],
  lat: 37.1236,
  lng: 25.2380,
  cost: 'Free to soak up. <b>Naoussa</b> is the prettiest fishing village in the Cyclades: a working harbor of caiques and octopus drying on the quay, a half-sunk 15th-century Venetian kastro you can wade to, and a warren of white lanes that fill with tavernas at night. Golden hour (~18:30&ndash;19:30 in June) lights the boats and the fort &mdash; the trip&rsquo;s most romantic evening, and it costs nothing but dinner.',
  climateLabel: 'Coast',
  climate: '<b>Warm, bright, breezy.</b> June air ~28&deg;C / 82&deg;F, sea ~22&deg;C / 72&deg;F. Paros is a windsurf island for a reason &mdash; the afternoon meltemi is real here &mdash; but Naoussa&rsquo;s harbor and lanes are sheltered and calm at dusk.',
  save: 'Wander the harbor and kastro for free, wade out to the ruined fort, and eat gyros on the quay rather than a full sit-down if the budget is tight.',
  splurge: 'A seafood dinner on the Naoussa waterfront at sunset, then a gelato walk through the lantern-lit back lanes.',
  restos: [
    '<b>Pita Frank (Naoussa)</b> &mdash; legendary ~&euro;3.50 gyros, customizable, an instant kid favorite',
    '<b>Taverna Glafkos (Naoussa)</b> &mdash; family-run, pasta and traditional plates on the water',
    '<b>Cuore Rosso (Parikia)</b> &mdash; widely rated the island&rsquo;s best pizza for the pickiest eater',
  ],
  alts: [
    '<b>Parikia old town + Panagia Ekatontapyliani</b> (the 4th-century "church of 100 doors") for a quieter afternoon.',
    '<b>Lefkes mountain village</b> for a stone-lane, bougainvillea half-day inland.',
    '<b>Naoussa kastro swim</b> off the rocks by the harbor fort.',
  ],
  blogs: [
    { label: 'Naoussa, Paros guide', href: 'https://www.thecommonwanderer.com/blog/naoussa-paros-guide' },
    { label: 'Paros in June — weather', href: 'https://www.greeka.com/cyclades/paros/weather/' },
  ],
});

const kolymbithresSpot = mkSpot({
  name: 'Kolymbithres &amp; the Paros coves',
  tags: ['kolymbithres', 'paros', 'goldenbeachparos'],
  carouselId: 'c-kolymbithres',
  images: [
    im('google_kolymbithres.jpg', 'The smooth, wind-sculpted grey granite rock formations of Kolymbithres beach on Paros under a dramatic cloud-streaked sky.', 'Kolymbithres Granite', 'Alexander Ponick · Flickr'),
    im('google_paros_clearwater.jpg', 'Clear, shallow turquoise water over pale rock at a Paros cove under a bright blue sky.', 'Paros Coves', 'Stella · Pexels License'),
    im('google_paros_portes.jpg', 'Two sculpted sea-stack rocks standing in a golden, hazy Aegean off Paros at dusk.', 'The Portes Rocks', 'Terry Vlisidis · Unsplash License'),
  ],
  lat: 37.1300,
  lng: 25.2270,
  cost: '<b>Kolymbithres</b>, across the bay from Naoussa, is a run of little coves cupped between smooth, wind- and wave-sculpted granite "baptisteries" &mdash; otherworldly rock the kids can clamber over, with shallow, sheltered turquoise pools between them. Free to enter; the parking lot fills by ~11am, so come early or take the <b>water taxi from Naoussa (~&euro;5&ndash;7)</b>, which is half the fun. <b>Golden Beach</b> on the south coast is the long-sand, windsurf alternative.',
  climateLabel: 'Coves',
  climate: '<b>Sheltered pools, exposed points.</b> The granite coves break the wind and warm the shallows, so Kolymbithres stays swimmable even when the meltemi is up &mdash; the smart windy-day beach on Paros. Golden Beach, by contrast, is where the wind (and the windsurfers) go.',
  save: 'Water-taxi over from Naoussa (cheaper and easier than fighting for parking), bring shade and snacks &mdash; the coves have limited facilities &mdash; and let the rocks be the day&rsquo;s free playground.',
  splurge: 'Rent a small boat or SUPs to explore the coves from the water, or a beach-club lounger day at one of the organized sections.',
  restos: [
    '<b>Kolymbithres cove taverna</b> &mdash; simple grilled plates, fries, and drinks by the rocks',
    '<b>Back in Naoussa: Pita Frank</b> &mdash; the reliable gyros stop after the beach',
    '<b>Golden Beach kiosks</b> &mdash; toasties and ice cream if you chase the windsurf scene instead',
  ],
  alts: [
    '<b>Golden Beach / New Golden Beach</b> for long sand and a windsurf lesson for the teen.',
    '<b>Kolymbithres by water taxi</b> rather than car to skip the parking crush.',
    '<b>Monastiri beach</b> next door for another sheltered, organized cove.',
  ],
  blogs: [
    { label: 'Kolymbithres beach guide', href: 'https://goparos.gr/kolymbithres-beach-paros/' },
    { label: 'Golden Beach, Paros', href: 'https://greeceinsiders.travel/golden-beach-paros/' },
  ],
});

const kleftikoSpot = mkSpot({
  name: 'Kleftiko: the sea caves by boat',
  tags: ['kleftiko', 'milos', 'kleftikomilos'],
  carouselId: 'c-kleftiko',
  images: [
    im('google_kleftiko_yachts.jpg', 'Aerial view of Kleftiko’s white volcanic sea stacks and cliffs rising from brilliant turquoise water, sailing yachts moored among the pinnacles.', 'Kleftiko by Sea', 'Wikimedia Commons · CC BY 2.0'),
    im('google_kleftiko_arch.jpg', 'A towering white volcanic sea cliff with a natural arch rising from clear blue water on the Milos coast, a distant island beyond.', 'White Cliffs &amp; Arches', 'drbdrb · Pexels License'),
    im('google_kleftiko_cliffs.jpg', 'Aerial view of the white chalk cliffs and rock formations of Kleftiko dropping into deep turquoise Aegean water off Milos.', 'The White Cliffs', 'Wikimedia Commons · CC BY 2.0'),
  ],
  lat: 36.6690,
  lng: 24.3390,
  cost: 'The trip&rsquo;s marquee: <b>Kleftiko</b> &mdash; a cathedral of white volcanic sea caves, arches, and stacks on Milos&rsquo;s roadless southwest coast &mdash; is reachable only by boat. A <b>full-day group cruise from Adamas or Pollonia runs ~&euro;120&ndash;175/person</b> (kids often reduced) and typically includes several swim/snorkel stops, gear, and lunch on board; a family of four is roughly &euro;400&ndash;620 (~$450&ndash;680). Operators include Horizon, Excellent Yachting, Polco Sailing, and Zephyros.',
  climateLabel: 'Boat day',
  climate: '<b>The wind-dependent day &mdash; the one to keep flexible.</b> Kleftiko faces the open southwest, so a strong meltemi can force operators to cancel or reroute at short notice. June is the calm shoulder (the meltemi peaks in July&ndash;August), and cancellations are uncommon, but this is exactly why the plan carries buffer days: book it early in the Milos stay so a blown-out day can slide.',
  save: 'Take a larger group boat rather than a private charter, book directly with a Milos operator, and pick a morning departure when the sea is calmest.',
  splurge: 'A small-group or semi-private sailing catamaran to Kleftiko with fewer people, more swim time, and a proper on-board lunch.',
  restos: [
    '<b>Lunch is aboard</b> &mdash; most full-day Kleftiko cruises feed you on the boat, so this is a packed day',
    '<b>Adamas waterfront on return</b> &mdash; Aktaion for pizza/pasta or a gyros counter for the kids',
    '<b>Pollonia tavernas</b> &mdash; if you sail from the north end, an easy seafood-or-pasta dinner after',
  ],
  alts: [
    '<b>Half-day Kleftiko motorboat tour</b> if a full 9-hour day is too much for the 8-year-old.',
    '<b>Reschedule within the Milos stay</b> if the wind is up &mdash; the built-in reason for three nights.',
    '<b>Papafragas + Sarakiniko by car</b> as the no-boat backup if Kleftiko blows out entirely.',
  ],
  blogs: [
    { label: 'Kleftiko boat tours (GetYourGuide)', href: 'https://www.getyourguide.com/kleftiko-caves-l97800/' },
    { label: 'Kleftiko by Horizon Yachts', href: 'https://www.kleftiko-milos.gr/' },
  ],
});

const sarakinikoSpot = mkSpot({
  name: 'Sarakiniko: the white moonscape',
  tags: ['sarakiniko', 'milos', 'sarakinikobeach'],
  carouselId: 'c-sarakiniko',
  images: [
    im('google_sarakiniko_moonscape.jpg', 'Sarakiniko’s blinding-white wind-carved volcanic rock formations dropping into a narrow turquoise inlet on Milos.', 'Sarakiniko Moonscape', 'Diego Allen · Unsplash License'),
    im('google_sarakiniko_channel.jpg', 'Aerial view of Sarakiniko’s white rock channels and a turquoise inlet cutting through the pale volcanic shore.', 'Sarakiniko from Above', 'dimi · Pexels License'),
    im('google_sarakiniko_ridge.jpg', 'A smooth white wind-sculpted rock ridge at Sarakiniko against a deep blue sky.', 'White Ridges', 'François Fayet · Unsplash License'),
    im('google_sarakiniko_wide.jpg', 'A wide view of Sarakiniko’s lunar white rock coastline meeting the dark blue Aegean.', 'Lunar Coast', 'Thomas Tsopanakis · Unsplash License'),
  ],
  lat: 36.7580,
  lng: 24.4460,
  cost: 'Free, and unlike anywhere else on the trip. <b>Sarakiniko</b> is a moonscape of blinding-white, wind-smoothed volcanic rock rolling into a slot of turquoise water &mdash; the most photographed spot on Milos. There&rsquo;s a small sandy patch and flat rock ledges to swim from, plus little caves to explore. Parking is free at the entrance; there is no shade and no facilities, so it&rsquo;s a sunrise or late-afternoon place.',
  climateLabel: 'Volcanic coast',
  climate: '<b>Bright, exposed, north-facing.</b> The white rock throws light and heat, and Sarakiniko sits on the exposed north coast, so a strong meltemi makes the swim choppy &mdash; another calm-morning target. Go at first light for the empty moonscape or before sunset for the warm glow; midday is a glare-bomb with no shade.',
  save: 'It&rsquo;s free &mdash; come at sunrise or ~6pm for soft light and no crowds, bring your own water and shade, and swim off the ledges rather than paying for anything.',
  splurge: 'Pair a sunset here with dinner in hilltop Plaka village nearby, or add a short boat/kayak to the adjacent sea caves.',
  restos: [
    '<b>Adamas tavernas (~10 min)</b> &mdash; Egoist for burgers/pasta, or Gyros of Milos for the kids',
    '<b>Pollonia (~10 min)</b> &mdash; relaxed seafront pizza and pasta if you&rsquo;re based north',
    '<b>Plaka village tavernas</b> &mdash; combine with the sunset-castle climb above',
  ],
  alts: [
    '<b>Sunrise Sarakiniko</b> for an empty moonscape and the best light.',
    '<b>Papafragas cove (nearby)</b> for a sea-carved gorge swim &mdash; sturdy shoes for the steep descent.',
    '<b>Firopotamos</b> for a calmer, sandier north-coast swim if Sarakiniko is windy.',
  ],
  blogs: [
    { label: 'Sarakiniko beach guide', href: 'https://takemetogreece.com/sarakiniko-beach/' },
    { label: 'Milos June sea temperature', href: 'https://www.seatemperature.org/europe/greece/milos-june.htm' },
  ],
});

const milosVillageSpot = mkSpot({
  name: 'Plaka, Klima &amp; the fishing coves',
  tags: ['klima', 'plakamilos', 'firopotamos'],
  carouselId: 'c-milosvillage',
  images: [
    im('google_klima_syrmata.jpg', 'The colorful two-level syrmata fishermen’s boat houses of Klima on Milos, bright doors at the waterline below a hill.', 'Klima Syrmata', 'Despina Galani · Unsplash License'),
    im('google_milos_firopotamos_aerial.jpg', 'Aerial view of a Milos fishing cove with white houses, moored boats, and a turquoise bay ringed by pale cliffs.', 'A Milos Fishing Cove', 'David Tip · Unsplash License'),
    im('google_milos_cove_boats.jpg', 'A sheltered Milos cove with colorful fishing boats moored over clear turquoise water below white rock and a hill village.', 'Coves &amp; Caiques', 'Daciana Cristina Visan · Pexels License'),
  ],
  lat: 36.7360,
  lng: 24.4110,
  cost: 'The island&rsquo;s village-and-cove side. <b>Klima</b> is a row of <i>syrmata</i> &mdash; two-level fishermen&rsquo;s houses with brightly painted doors carved right into the rock at the waterline, glowing at sunset. Hilltop <b>Plaka</b> is the whitewashed capital, with a free 200-step climb to a Venetian castle for one of the Aegean&rsquo;s best sunsets. <b>Firopotamos</b> and <b>Papafragas</b> are tiny, photogenic swim coves. All free; you just need the car.',
  climateLabel: 'Villages',
  climate: '<b>Warm evenings, west-facing sunsets.</b> Klima and the Plaka castle both face west for the sunset; June nights are balmy for a village dinner. Papafragas has a steep, rocky final descent to the water &mdash; sturdy shoes, and mind the little ones.',
  save: 'Klima, Plaka, and the castle are all free &mdash; make a sunset loop of them, park once and walk, and swim at Firopotamos rather than a paid beach.',
  splurge: 'Sunset dinner in Plaka after the castle climb, or a couple of nights based in pretty Pollonia at the quieter north end.',
  restos: [
    '<b>Plaka / Trypiti tavernas</b> &mdash; grilled plates and pasta with the sunset view',
    '<b>Adamas: Egoist &amp; Gyros of Milos</b> &mdash; burgers, pasta, and gyros for the picky crew',
    '<b>Pollonia seafront</b> &mdash; relaxed pizza-and-seafood dinners at the north end',
  ],
  alts: [
    '<b>Plaka castle at sunset</b> for the island&rsquo;s cinematic view (200 steps up).',
    '<b>Mandrakia</b> &mdash; another photogenic syrmata fishing hamlet if Klima is busy.',
    '<b>Firopotamos swim</b> as the calm, sandy-ish north-coast cove.',
  ],
  blogs: [
    { label: 'Klima travel guide', href: 'https://roamandthrive.com/klima-milos-travel-guide/' },
    { label: 'Milos best sunset spots', href: 'https://accommodationsmilos.com/best-sunset-spots-on-milos-island/' },
  ],
});

// ---- itinerary: 12 nights (Athens 2 + Naxos 4 + Paros 2 + Milos 3 + Athens 1)
const days = [
  day('day0', 'c0', '0', 'Tue &middot; Jun 8', 'Depart Pittsburgh after work', 'Overnight to Athens', 'Est. $90 &middot; airport meals', [
    fact('Sleep', 'Overnight flight'),
    fact('Route target', 'PIT -> US gateway (JFK/EWR/PHL) -> Euro hub (LHR/FRA/CDG/AMS) -> ATH'),
    fact('Constraint', 'In Pittsburgh all day Jun 24-26; Jun 23 return is allowed'),
  ], 'PIT has no nonstop to Athens, so this is a two- (sometimes three-) stop day: a US gateway, a European hub, then into ATH. Book one through-ticket for the family. ETIAS is likely required by June 2027 (~&euro;20/adult; kids exempt but must apply).', [], 'Travel day - position toward Athens.'),

  day('day1', 'c1', '1', 'Wed &middot; Jun 9', 'Arrive Athens, Plaka evening', 'Soft landing under the Acropolis', 'Est. $150 &middot; taxi, easy dinner', [
    fact('Sleep', 'Athens (Plaka/Syntagma) &middot; night 1 of 2'),
    fact('Transfer', 'ATH airport -> Plaka ~40 min by taxi/metro'),
    fact('Plan', 'Check in, wander Plaka &amp; Anafiotika, early dinner'),
  ], 'Land in Athens, drop bags near Plaka, and let the first evening be gentle: the pedestrian lanes of Plaka and the whitewashed island-in-the-city pocket of Anafiotika are the perfect jet-lag stroll before the islands begin.', [plakaSpot], 'Travel day - arrive ATH, settle in Plaka.'),

  day('day2', 'c1', '2', 'Thu &middot; Jun 10', 'The Acropolis', 'The Parthenon, then the Acropolis Museum', 'Est. $180 &middot; site + museum tickets, dinner', [
    fact('Sleep', 'Athens (Plaka/Syntagma) &middot; night 2 of 2'),
    fact('Anchor', 'Acropolis (timed slot) + Acropolis Museum'),
    fact('Heat rule', 'Go at 8am open or after 6pm - midday is brutal'),
  ], 'The one big culture day: the Acropolis at opening or late afternoon to beat the June heat, with the air-conditioned Acropolis Museum as the kid-friendly companion. Book the timed-entry slot in advance. Repack tonight for tomorrow&rsquo;s ferry.', [acropolisSpot]),

  day('day3', 'c2', '3', 'Fri &middot; Jun 11', 'Ferry to Naxos, Portara sunset', 'Into the Cyclades', 'Est. $170 &middot; ferry, taxi, dinner', [
    fact('Sleep', 'Naxos (Chora) &middot; night 1 of 4'),
    fact('Transfer', 'Piraeus -> Naxos high-speed ferry ~3h15 (SeaJets/Blue Star)'),
    fact('Payoff', 'Sunset through the marble Portara your first evening'),
  ], 'Morning high-speed ferry from Piraeus out to Naxos, the greenest and most kid-friendly Cyclade. Collect the rental car, settle into Chora, and walk out to the Portara for sunset &mdash; the great marble doorway framing the sun over the Aegean.', [portaraSpot], 'Travel day - Piraeus to Naxos by ferry.'),

  day('day4', 'c2', '4', 'Sat &middot; Jun 12', 'Naxos beach day', 'Agios Prokopios &amp; Plaka sand', 'Est. $150 &middot; sunbeds, lunch, dinner', [
    fact('Sleep', 'Naxos (Chora) &middot; night 2 of 4'),
    fact('Anchor', 'Agios Prokopios + Plaka beaches (shallow, sandy)'),
    fact('Water', 'Sea ~22°C / 72°F - the warmest, easiest swim of the trip'),
  ], 'The reason Naxos is the base: long crescents of golden sand and gentle shallow water at Agios Prokopios and Plaka &mdash; the best family swimming on the trip. Swim in the calm morning, and keep the south beaches in your pocket if the afternoon breeze picks up.', [naxosBeachSpot]),

  day('day5', 'c2', '5', 'Sun &middot; Jun 13', 'Naxos mountain villages', 'Halki, kitron &amp; marble Apeiranthos', 'Est. $130 &middot; car day, tastings, taverna lunch', [
    fact('Sleep', 'Naxos (Chora) &middot; night 3 of 4'),
    fact('Anchor', 'Halki (Vallindras kitron) + Apeiranthos marble village'),
    fact('Why', 'Cooler, greener inland - a break from beach heat'),
  ], 'Naxos is the one Cyclade with a real mountainous interior. Drive up through the Tragea olive valleys to Halki for a free citron-liqueur tasting, then marble-paved Apeiranthos &mdash; a cooler, greener half-day and a genuine change of pace from the sand.', [naxosVillageSpot], 'Self-drive day around inland Naxos.'),

  day('day6', 'c2', '6', 'Mon &middot; Jun 14', 'Naxos flex + Portara', 'Beach, town, or a boat', 'Est. $150 &middot; beach or watersports, dinner', [
    fact('Sleep', 'Naxos (Chora) &middot; night 4 of 4'),
    fact('Flex', 'Wind-led: sheltered beach, Chora kastro, or watersports'),
    fact('Option', 'Mikri Vigla lesson for the 13-year-old'),
  ], 'A flex day &mdash; read the wind and choose: another shallow-beach morning, the Venetian kastro lanes of Chora, or a watersports lesson at breezy Mikri Vigla for the teen. A relaxed last Naxos evening before the island-hop resumes. Repack tonight.', []),

  day('day7', 'c3', '7', 'Tue &middot; Jun 15', 'Ferry to Paros, Naoussa', 'Short hop, prettiest harbor', 'Est. $150 &middot; ferry, taxi, harbor dinner', [
    fact('Sleep', 'Paros (Naoussa/Parikia) &middot; night 1 of 2'),
    fact('Transfer', 'Naxos -> Paros high-speed ferry ~30-40 min'),
    fact('Payoff', 'Naoussa fishing harbor at golden hour'),
  ], 'The easiest transfer of the trip: a 30&ndash;40 minute ferry hop to Paros. Base in or near Naoussa, the Cyclades&rsquo; loveliest fishing village &mdash; a working harbor, a half-sunk Venetian fort, and lanes that glow at sunset.', [naoussaSpot], 'Travel day - Naxos to Paros by ferry.'),

  day('day8', 'c3', '8', 'Wed &middot; Jun 16', 'Kolymbithres &amp; the coves', 'Sculpted granite pools', 'Est. $150 &middot; water taxi, beach, dinner', [
    fact('Sleep', 'Paros (Naoussa/Parikia) &middot; night 2 of 2'),
    fact('Anchor', 'Kolymbithres coves (water taxi from Naoussa)'),
    fact('Wind rule', 'Kolymbithres shelters; Golden Beach is the windsurf end'),
  ], 'Water-taxi across Naoussa Bay to Kolymbithres, where smooth wind-carved granite cups shallow turquoise pools the kids can clamber around &mdash; the smart sheltered swim if the meltemi is up. Golden Beach on the south coast is the long-sand, windsurf alternative.', [kolymbithresSpot]),

  day('day9', 'c4', '9', 'Thu &middot; Jun 17', 'Ferry to Milos, Plaka sunset', 'The volcanic finale begins', 'Est. $170 &middot; ferry, car, dinner', [
    fact('Sleep', 'Milos (Adamas/Pollonia) &middot; night 1 of 3'),
    fact('Transfer', 'Paros -> Milos ferry ~2-2.5h (Blue Star)'),
    fact('Payoff', 'Klima syrmata + Plaka castle at sunset'),
  ], 'Ferry southwest to Milos, the volcanic showpiece. Collect the car, settle in Adamas or Pollonia, and ease in with the island&rsquo;s villages: the color-doored syrmata of Klima and a sunset climb to the castle above whitewashed Plaka.', [milosVillageSpot], 'Travel day - Paros to Milos by ferry.'),

  day('day10', 'c4', '10', 'Fri &middot; Jun 18', 'Kleftiko boat day', 'Sea caves by boat &middot; Juneteenth', 'Est. $560 &middot; full-day family cruise', [
    fact('Sleep', 'Milos (Adamas/Pollonia) &middot; night 2 of 3'),
    fact('Holiday', 'Juneteenth observed Fri Jun 18 for many employers'),
    fact('Anchor', 'Full-day Kleftiko cruise (book early in the stay)'),
  ], 'The marquee: a full-day boat to Kleftiko&rsquo;s white sea caves and arches, with swim and snorkel stops along the roadless southwest coast. It falls on the Juneteenth-observed holiday, so it costs no PTO. Keep it flexible &mdash; if the wind is up, this is the day that slides into the buffer.', [kleftikoSpot]),

  day('day11', 'c4', '11', 'Sat &middot; Jun 19', 'Sarakiniko + coves', 'The white moonscape', 'Est. $140 &middot; car day, lunch, dinner', [
    fact('Sleep', 'Milos (Adamas/Pollonia) &middot; night 3 of 3'),
    fact('Anchor', 'Sarakiniko moonscape + Firopotamos/Papafragas'),
    fact('Light rule', 'Sarakiniko at sunrise or ~6pm - no shade midday'),
  ], 'The photo payoff: Sarakiniko&rsquo;s blinding-white volcanic moonscape and its turquoise slot, best at sunrise or golden hour, plus the little swim-coves of Firopotamos and sea-carved Papafragas. A last, otherworldly Aegean day before the flight home. Repack tonight.', [sarakinikoSpot]),

  day('day12', 'c1', '12', 'Sun &middot; Jun 20', 'Fly Milos -> Athens (buffer)', 'Island air, safety night in Athens', 'Est. $160 &middot; flight, Athens dinner', [
    fact('Sleep', 'Athens (near airport) &middot; buffer night'),
    fact('Transfer', 'MLO -> ATH ~40 min (Sky Express/Olympic)'),
    fact('Why buffer', 'Protects the international connection + meltemi delays'),
  ], 'Fly the 40-minute domestic hop from little Milos (MLO) back to Athens and overnight near the airport. This buffer night is deliberate: it protects the next-day international connection and absorbs any meltemi-driven ferry or flight delay from the islands.', [], 'Travel day - fly Milos to Athens, overnight buffer.'),

  day('day13', 'c0', '13', 'Mon &middot; Jun 21', 'Fly Athens -> Pittsburgh', 'Home before the blackout', 'Est. $110 &middot; airport meals', [
    fact('Sleep', 'Home by Mon Jun 21 (evening)'),
    fact('Route target', 'ATH -> Euro hub -> US gateway -> PIT'),
    fact('Schedule', 'Home Mon Jun 21, ahead of the Jun 23 preference'),
  ], 'Fly Athens home through a European hub and a US gateway, landing in Pittsburgh Monday Jun 21 &mdash; two days ahead of the preferred Jun 23 return and comfortably clear of the required full days in Pittsburgh on Jun 24-26.', [], 'Travel day - fly Athens to Pittsburgh, home Jun 21.'),
];

const previewImages = [
  [`${BASE}/google_naxos_portara_sunset.jpg`, 'Day 3 &middot; Fri Jun 11', 'Naxos', 'The sun setting through the marble Portara.'],
  [`${BASE}/google_sarakiniko_moonscape.jpg`, 'Day 11 &middot; Sat Jun 19', 'Milos', 'Sarakiniko’s white volcanic moonscape.'],
  [`${BASE}/google_kleftiko_yachts.jpg`, 'Day 10 &middot; Fri Jun 18', 'Milos', 'Kleftiko’s white sea stacks and caves, reached by boat.'],
  [`${BASE}/google_naoussa_harbor.jpg`, 'Day 7 &middot; Tue Jun 15', 'Paros', 'Naoussa’s fishing harbor at golden hour.'],
  [`${BASE}/google_naxos_chora_aerial.jpg`, 'Day 3 &middot; Fri Jun 11', 'Naxos', 'The Chora causeway curving into the bay.'],
];

const oldPart0 = template.parts[0].html;
const afterBody = oldPart0.indexOf('</head><body>') + '</head><body>'.length;
const navStart = oldPart0.indexOf('<nav class="site-nav"');
const overviewStart = oldPart0.indexOf('<section id="overview"');
const headBody = oldPart0.slice(0, afterBody)
  .replace(/<title>.*?<\/title>/, '<title>Greek Cyclades &middot; Naxos, Paros &amp; Milos via Athens &mdash; June 2027</title>');
const navToMain = oldPart0.slice(navStart, overviewStart)
  .replace('      <a href="#photo-guide">Photo Guide</a>\n      <a href="#food-guide">Food Guide</a>\n', '');

const preview = `<section class="preview">
  <div class="pv-pane">
    <span class="pv-kicker">Family Trip &middot; Jun 8&ndash;21, 2027</span>
    <h1>Greek Cyclades<span>Naxos, Paros &amp; Milos via Athens</span></h1>
    <p class="pv-lead">The maximal iconic-Aegean &ldquo;wow&rdquo;: a short Athens culture opener, then three islands that each do something different &mdash; Naxos for long sandy family beaches and green mountain villages, Paros for the Cyclades&rsquo; prettiest fishing harbor, and Milos for the volcanic payoff of Sarakiniko&rsquo;s white moonscape and the Kleftiko sea caves. White villages, warm water, wild coves.</p>
    <div class="pv-stats"><div><b>12</b><span>Hotel nights</span></div><div><b>4</b><span>Home bases</span></div><div><b>22</b><span>Stops mapped</span></div><div><b>$11.7k</b><span>priced target</span></div></div>
    <div class="pv-split" role="img" aria-label="Trip mix: about 45% water, 30% towns, 25% nature">
      <div class="seg water" style="flex:45"><b>45%</b><span>Water</span></div>
      <div class="seg town" style="flex:30"><b>30%</b><span>Towns &amp; food</span></div>
      <div class="seg nature" style="flex:25"><b>25%</b><span>Nature</span></div>
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
      <h2>The iconic Aegean, done as a family</h2>
      <p>This is the postcard-Greece trip built for kids 13 and 8: a two-night Athens culture bookend, then three Cyclades islands chosen so each covers a different need. <b>Naxos (4 nights)</b> is the base &mdash; the greenest, most kid-friendly island, with long shallow sandy beaches and cool mountain villages. <b>Paros (2 nights)</b> adds the Cyclades&rsquo; prettiest harbor and its wind-sculpted granite coves. <b>Milos (3 nights)</b> is the visual climax: Sarakiniko&rsquo;s white moonscape and the Kleftiko sea caves. A final buffer night in Athens protects the flight home, so the family is back in Pittsburgh well before the <b>Jun 24-26</b> commitment.</p>
    </div>
    <div class="overview">
      <div class="ocard"><p class="eyebrow">Route</p><h4>Athens -> Naxos -> Paros -> Milos -> Athens -> PIT</h4><p>Open-jaw in spirit: ferry out through the islands, fly the last leg Milos -> Athens, then home. Four bases, three high-speed ferries, one short domestic flight. Home Mon Jun 21.</p></div>
      <div class="ocard"><p class="eyebrow">Why it wins</p><h4>Maximal wow, real family swimming</h4><p>Portara sunsets, a fishing-harbor golden hour, a white volcanic moonscape, and sea caves by boat &mdash; with Naxos&rsquo;s shallow sandy beaches as the warm-water anchor the younger one actually swims at.</p></div>
      <div class="ocard"><p class="eyebrow">The honest trade</p><h4>Ferries + wind are the risk</h4><p>Three inter-island ferries and one island airport mean more logistics than a single-island plan, and the meltemi wind can disrupt ferries and the Kleftiko boat. June is the calm shoulder, and the plan carries buffer days &mdash; but this is the thing to watch.</p></div>
    </div>
  </section>

  <section id="why-this-trip" class="divider">
    <div class="section-label">
      <p class="eyebrow">Why This Trip</p>
      <h2>Every iconic-Aegean image, in one trip</h2>
      <p>It is the &ldquo;we went to the Greek islands&rdquo; trip &mdash; white villages, blue water, volcanic coves &mdash; sequenced so the kids get real beach time and the parents get the photographs.</p>
    </div>
    <div class="plan-grid">
      ${card('Three islands, three jobs', `<p>Naxos is the family anchor (sandy shallow beaches, green mountain villages), Paros is the pretty-harbor and cove day, and Milos is the volcanic wow. Athens bookends it with the Acropolis. No island is a repeat of another.</p>`)}
      ${card('Warm, easy water', `<p>Naxos&rsquo;s Agios Prokopios and Plaka are long, shallow, sandy Blue-Flag beaches &mdash; the easiest family swimming on the board &mdash; and the sea is a comfortable ~72&deg;F by mid-June, warming all week.</p>`)}
      ${card('The honest trade', `<p>You buy the maximal Aegean wow; you take on more logistics &mdash; three ferries plus a domestic flight &mdash; and the meltemi&rsquo;s ferry/boat risk. June is the calm shoulder and the plan builds in buffer days, but it needs watching.</p>`)}
    </div>
  </section>

  <section id="stays" class="divider">
    <div class="section-label">
      <p class="eyebrow">Where We Stay</p>
      <h2>Four bases, low backtracking</h2>
      <p>Two culture nights in Athens, then the islands in a clean southwest arc: Naxos, Paros, Milos. The final Athens night is a deliberate airport-and-weather buffer, not sightseeing.</p>
    </div>
    <div class="plan-grid">
      ${card('Athens &middot; 2 nights', `${prow('Target', 'Plaka/Syntagma apartment &middot; &euro;150-250/night')}${prow('Why', 'Walk to the Acropolis, Plaka, Anafiotika; metro to the port')}${prow('Plus', '1 buffer night near ATH airport at the end')}`)}
      ${card('Naxos &middot; 4 nights', `${prow('Target', 'Chora or Agios Prokopios apartment &middot; &euro;150-225/night')}${prow('Why', 'Beaches, Portara, and the mountain villages all close')}${prow('Car', '~&euro;30-45/day; parking tight in Chora')}`)}
      ${card('Paros &middot; 2 nights', `${prow('Target', 'Naoussa/Parikia studio &middot; &euro;100-160/night')}${prow('Why', 'Walk Naoussa harbor; water-taxi to Kolymbithres')}${prow('Move', 'Short 30-40 min ferry from Naxos')}`)}
      ${card('Milos &middot; 3 nights', `${prow('Target', 'Adamas/Pollonia apartment &middot; &euro;120-200/night')}${prow('Why', 'Base for Kleftiko, Sarakiniko, and the villages')}${prow('Buffer', '3 nights so a windy Kleftiko day can slide')}`)}
    </div>
  </section>

  <section id="calendar" class="divider">
    <div class="section-label">
      <p class="eyebrow">Calendar</p>
      <h2>Jun 8-21 fits the window and protects the Pittsburgh dates</h2>
      <p>Dates sit inside the Jun 6-Aug 15, 2027 planning window, return before the preferred Jun 23 date, and keep the family in Pittsburgh all day Jun 24-26. June is also the calm shoulder before the July-August meltemi peak.</p>
    </div>
    ${table(['Date', 'Night', 'Base', 'Purpose'], [
      ['Tue Jun 8', 'Red-eye', 'PIT -> Athens', 'After-work departure'],
      ['Wed Jun 9-Thu Jun 10', '2', 'Athens', 'Plaka, Anafiotika, the Acropolis'],
      ['Fri Jun 11', 'ferry', 'Piraeus -> Naxos', 'High-speed ferry + Portara sunset'],
      ['Fri Jun 11-Mon Jun 14', '4', 'Naxos', 'Beaches, mountain villages, flex day'],
      ['Tue Jun 15', 'ferry', 'Naxos -> Paros', 'Short hop + Naoussa'],
      ['Tue Jun 15-Wed Jun 16', '2', 'Paros', 'Naoussa, Kolymbithres, coves'],
      ['Thu Jun 17', 'ferry', 'Paros -> Milos', 'Ferry + Klima/Plaka sunset'],
      ['Thu Jun 17-Sat Jun 19', '3', 'Milos', 'Kleftiko, Sarakiniko, villages'],
      ['Sun Jun 20', 'buffer', 'Milos -> Athens', 'Domestic flight + safety night'],
      ['Mon Jun 21', 'Home', 'Athens -> PIT', 'Arrive before blackout'],
    ])}
  </section>`;

const mapAirGround = `<section id="map" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Whole Trip, Mapped</p>
      <h2>Every stop on one map</h2>
      <p>Open <b>Map layers</b> to show or hide flights, lodging, beaches, towns, and viewpoints. Tap a region to fly there, then click any pin for Google Maps.</p>
    </div>
    <div class="tripmap-wrap">
      <div class="mapbtns">
        <button data-region="athens"><span class="sw" style="background:#7d5ba6"></span>Athens</button><button data-region="naxos"><span class="sw" style="background:#1f6f78"></span>Naxos</button><button data-region="paros"><span class="sw" style="background:#3f7d4e"></span>Paros</button><button data-region="milos"><span class="sw" style="background:#3a6ea5"></span>Milos</button><button data-region="transfer"><span class="sw" style="background:#c25a3a"></span>Ferries &amp; flights</button><button data-region="all">Whole trip</button>
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
      <h2>Two stops in, a domestic hop out</h2>
      <p>Research status: 2027 schedules are not yet bookable, so current 2025-2026 route and fare signals are planning proxies. Re-quote on ITA Matrix / Aegean once inventory opens.</p>
    </div>
    <div class="plan-grid">
      ${card('PIT -> Athens (ATH)', `${prow('Reality', 'No PIT-Athens nonstop')}${prow('Corridors', 'PIT -> JFK/EWR/PHL -> LHR/FRA/CDG/AMS -> ATH')}${prow('Fare signal', '~$1,250-$1,650 pp; ~$5,000-$6,600 for four')}`)}
      ${card('Milos -> Athens (MLO)', `${prow('Airlines', 'Sky Express &amp; Olympic/Aegean; ~40 min, up to 7/day in June')}${prow('Fare signal', '~&euro;50-170 pp one-way; book early, small aircraft')}${prow('Rule', 'Fly the last island leg, do not ferry back to Piraeus')}`)}
      ${card('The buffer night', `${prow('Why', 'A same-day MLO -> ATH -> US connection is tight and risky')}${prow('Plan', 'Overnight in Athens, fly the Atlantic the next day')}${prow('Bonus', 'Also absorbs any meltemi ferry/flight delay')}`)}
      ${card('Round-trip total', `${prow('Target', '~$5,000 family (round-trip ATH) + ~$300 the MLO hop')}${prow('High', '~$6,600 if booked late or summer demand runs hot')}${prow('ETIAS', 'Likely mandatory by Jun 2027; ~&euro;20/adult, kids apply but are exempt from the fee')}`)}
    </div>
  </section>

  <section id="getting-around" class="divider">
    <div class="section-label">
      <p class="eyebrow">Getting Around</p>
      <h2>High-speed ferries + a rental car per island</h2>
      <p>The islands connect by fast ferry; on each one you want a small rental car (or ATV) for the beaches and villages. Book ferries 1-2 months ahead for June, and watch the wind.</p>
    </div>
    <div class="plan-grid">
      ${card('The ferries', `${prow('Piraeus -> Naxos', 'High-speed ~3h15, ~&euro;45-52 pp (SeaJets/Blue Star)')}${prow('Naxos -> Paros', 'Short hop ~30-40 min, ~&euro;10-20 pp')}${prow('Paros -> Milos', 'Conventional ~2-2.5h, ~&euro;60-90 pp (Blue Star)')}`)}
      ${card('Cars &amp; ATVs', `${prow('Naxos', '~&euro;30-45/day; needed for beaches + villages')}${prow('Paros', 'ATV from ~&euro;38/day, or a small car')}${prow('Milos', '~&euro;31-50/day; book a month ahead, some rough roads')}`)}
      ${card('Book &amp; watch', `${prow('Ferries', 'Ferryhopper / operator sites, 1-2 months ahead for June')}${prow('Wind', 'Check the Aegean forecast 5-7 days before each ferry leg')}${prow('Meltemi', 'High-speed cats cancel first in strong wind; June is calm')}`)}
    </div>
  </section>`;

const healthTiming = `<section id="health-check" class="divider">
    <div class="section-label">
      <p class="eyebrow">Plan Health-Check</p>
      <h2>What to lock, watch, and expect</h2>
      <p>Current research refreshed July 2026 for a June 2027 trip. Kids assumed 13 and 8.</p>
    </div>
    <div class="hc-grid">
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The iconic-Aegean wow is real</h4><p>Portara sunsets, Naoussa&rsquo;s harbor, Sarakiniko&rsquo;s moonscape, and the Kleftiko sea caves are as good as the postcards &mdash; and Naxos&rsquo;s sandy shallow beaches give the 8-year-old real, warm swimming.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>Naxos is the right family base</h4><p>The greenest, most kid-friendly Cyclade: shallow Blue-Flag beaches, green mountain villages, and the Portara &mdash; four nights here anchor the trip.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The Pittsburgh dates are protected</h4><p>Depart Tue Jun 8, fly home Mon Jun 21 with an Athens buffer night &mdash; two days ahead of the preferred Jun 23 return and clear of the required full days Jun 24-26.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>The meltemi &amp; the ferries</h4><p>Three inter-island ferries plus a domestic flight is the real risk: a strong north wind can cancel high-speed ferries and the Kleftiko boat. June is the calm shoulder (the meltemi peaks in July-August), and the plan carries buffer days &mdash; but book the Kleftiko cruise early in the Milos stay and keep the flex day flexible.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Milos&rsquo;s coves are exposed</h4><p>Sarakiniko and Kleftiko face open water, so a windy day makes them choppy or closes the boat. Have the sheltered picks ready (Firopotamos, the Naxos south beaches) and treat sunrise as the calm window.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Two connections + a small airport</h4><p>PIT-Athens is a two-stop routing, and MLO is a tiny domestic airport, so the Athens buffer night is not optional. Fares are 2025-2026 proxies until 2027 loads.</p></div>
    </div>
  </section>

  <section id="timing" class="divider">
    <div class="section-label">
      <p class="eyebrow">Best Time</p>
      <h2>Why early-mid June wins for this constraint set</h2>
      <p>It gives 12 hotel nights, uses Juneteenth observed as a no-PTO boat day, catches the calm pre-meltemi shoulder, and returns before the blackout.</p>
    </div>
    ${table(['Window', 'Nights', 'PTO', 'Blackout fit', 'Verdict'], [
      ['Jun 8-21', '12 hotel nights', '8 days', 'Home before Jun 23', '<b>Use this</b>'],
      ['Jun 15-28', '12+', '8-9 days', '<b>Invalid</b> - away during Jun 24-26', 'Reject'],
      ['Jun 27-Jul 10', '12+', '9 days', 'Valid', 'Backup; warmer sea, rising meltemi'],
      ['Aug 1-14', '12+', '9-10 days', 'Valid', 'Warmest sea, but peak meltemi + crowds'],
    ])}
    <div class="verdict-box" style="border-left-color:var(--c4);margin-top:18px"><h4>PTO math</h4><p>Friday Jun 18 is Juneteenth observed for many US employers, so the Kleftiko boat day costs no PTO. Likely PTO days: Jun 9, 10, 11, then Jun 14, 15, 16, 17, then Jun 21 travel &mdash; about <b>8 PTO days</b>, with weekends Jun 12-13 and 19-20 free. The plan is home Monday Jun 21, ahead of the preferred Jun 23 return and clear of the required Pittsburgh days Jun 24-26. Early-mid June also lands in the calm shoulder before the July-August meltemi peak, when ferry cancellations are least likely.</p></div>
  </section>`;

const budgetTips = `<section id="budget" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Money</p>
      <h2>Budget, savers &amp; splurges</h2>
      <p>Real priced planning band using 2025-2026 route/fare/lodging signals because June 2027 inventory is not live. USD, family of four. The transatlantic airfare and the island lodging are what push the high case toward the preferred maximum &mdash; cost is the honest weak point of an otherwise knockout trip.</p>
    </div>
    ${table(['Line item', 'Target case', 'High case'], [
      ['PIT <-> Athens round-trip airfare', '$5,000', '$6,600'],
      ['Milos -> Athens domestic flight (family)', '$300', '$480'],
      ['Inter-island ferries (3 legs, family)', '$340', '$540'],
      ['Lodging: 12 hotel nights, four bases', '$2,150', '$2,880'],
      ['Rental cars (3 islands), fuel, parking', '$850', '$1,200'],
      ['Activities: Acropolis, Kleftiko boat, beaches', '$900', '$1,400'],
      ['Food and groceries, 13 travel days', '$1,650', '$2,200'],
      ['Insurance, ETIAS, fees, misc buffer', '$460', '$700'],
      ['<b>Grand total</b>', '<b>$11,650</b>', '<b>$16,000</b>'],
    ])}
    <div class="twocol">
      <div class="listcard save-list"><h4>Save money</h4><ul><li>Book the transatlantic ticket early on ITA Matrix &mdash; it is the single biggest lever by far.</li><li>Cook breakfasts and beach lunches from island supermarkets; eat gyros (~&euro;3-4) not sit-down every night.</li><li>Swim the free ends of Agios Prokopios and Sarakiniko rather than paying for sunbeds daily.</li><li>Water-taxi to Kolymbithres instead of a car-and-parking scramble.</li><li>Take group Kleftiko boats, not a private charter; the free villages (Klima, Plaka, Halki) carry whole days.</li></ul></div>
      <div class="listcard splurge-list"><h4>Worth the splurge</h4><ul><li>The full-day Kleftiko cruise &mdash; the trip&rsquo;s signature, and worth every euro on a calm day.</li><li>A semi-private sailing catamaran if you want fewer people and more swim time.</li><li>A sunset seafood dinner on the Naoussa waterfront.</li><li>Front-row sunbeds and a beach-bar lunch at Agios Prokopios.</li><li>A watersports lesson at Mikri Vigla or Golden Beach for the 13-year-old.</li></ul></div>
    </div>
  </section>

  <section id="totals" class="divider">
    <div class="section-label">
      <p class="eyebrow">Bottom Line</p>
      <h2>Total trip cost</h2>
      <p>The low case lands just under the $12k target, but the high case reaches ~$16k &mdash; above the $15k strongly preferred maximum &mdash; driven by transatlantic airfare and peak-season island lodging. Cost never hides the trip, but budget is the honest reason it is not ranked higher.</p>
    </div>
    ${table(['Category', 'Estimate'], [
      ['Flights (round-trip Athens + the Milos hop)', '$5,300 target / $7,080 high'],
      ['Inter-island ferries, 3 legs', '$340 target / $540 high'],
      ['Lodging, 12 hotel nights', '$2,150 target / $2,880 high'],
      ['Rental cars (3 islands), fuel, parking', '$850 target / $1,200 high'],
      ['Activities, Acropolis, Kleftiko boat, beaches', '$900 target / $1,400 high'],
      ['Food, groceries, 13 travel days', '$1,650 target / $2,200 high'],
      ['Insurance, ETIAS, fees, buffer', '$460 target / $700 high'],
      ['<b>Grand total - family of 4</b>', '<b>$11,650 target / $16,000 high</b>'],
    ])}
    <p class="rate-note">Per-day itinerary costs cover food + activities only. Lodging, flights, ferries, and the rental cars sit in the totals above, not the daily numbers.</p>
  </section>

  <section id="tips" class="divider">
    <div class="section-label">
      <p class="eyebrow">Travel Tips</p>
      <h2>The stuff nobody tells you</h2>
      <p>Operational rules that keep a multi-ferry island plan running smoothly in meltemi country.</p>
    </div>
    <div class="tips-order">
      <p class="mini-h">Book in roughly this order</p>
      <ol>
        <li>Round-trip PIT-Athens ticket<span> &middot; re-quote on ITA Matrix when 2027 loads</span></li>
        <li>Milos -> Athens domestic flight + the buffer-night hotel<span> &middot; small aircraft sell out</span></li>
        <li>Inter-island ferries (Piraeus-Naxos, Naxos-Paros, Paros-Milos)<span> &middot; 1-2 months ahead</span></li>
        <li>Refundable island apartments + one rental car per island<span> &middot; automatics book out</span></li>
        <li>Acropolis timed slot + the Kleftiko cruise<span> &middot; Kleftiko early in the Milos stay</span></li>
      </ol>
    </div>
    <div class="tips-grid">
      <div class="tipcard"><h4>Ferries</h4><p class="sub">Wind is the variable</p><ul><li class="flag"><b>Check the Aegean forecast</b> 5-7 days before each ferry leg.</li><li><b>High-speed cats cancel first</b> in strong meltemi; June is calm.</li><li><b>Book 1-2 months ahead</b> on Ferryhopper for June sailings.</li></ul></div>
      <div class="tipcard t2"><h4>The Kleftiko boat</h4><p class="sub">Keep it flexible</p><ul><li class="flag"><b>Book it early in the Milos stay</b> so a windy day can slide.</li><li><b>Group boat over charter</b> to save; morning departures are calmest.</li><li><b>Papafragas + Sarakiniko by car</b> is the no-boat backup.</li></ul></div>
      <div class="tipcard t3"><h4>Cars &amp; tickets</h4><p class="sub">Per island</p><ul><li><b>Book an automatic early</b> on each island; they sell out first.</li><li><b>Acropolis is a timed slot</b> &mdash; buy at hhticket.gr in advance.</li><li><b>Water-taxi to Kolymbithres</b> to skip the parking crush.</li></ul></div>
      <div class="tipcard t4"><h4>Heat &amp; sun</h4><p class="sub">June is hot &amp; bright</p><ul><li><b>Acropolis at 8am or 6pm</b> &mdash; midday on the rock is brutal.</li><li><b>Sarakiniko has no shade</b> &mdash; sunrise or late afternoon only.</li><li><b>Reef shoes</b> for the rocky coves and Sarakiniko ledges.</li></ul></div>
    </div>
  </section>`;

const socialBalanceStatus = `<section id="social" class="divider">
    <div class="section-label">
      <p class="eyebrow">What People Are Saying</p>
      <h2>Research signals to keep in mind</h2>
      <p>Operator prices, current ferry data, and June climate all point the same way: a knockout iconic-Aegean trip whose watch-items are wind and cost, not the experience.</p>
    </div>
    <div class="plan-grid">
      ${card('Value signal', `<p>Athens is cheap and Naxos/Paros/Milos lodging is mid-range, but the transatlantic airfare and the Kleftiko cruise carry the budget: the low case slips under $12k, while the high case runs to ~$16k &mdash; the reason budget scores low despite a great trip.</p>`)}
      ${card('Weather signal', `<p>June is hot, dry, and sunny with a warming ~72&deg;F sea, and it sits in the calm shoulder before the July-August meltemi peak &mdash; the best window for ferry reliability. Afternoons can still blow on the exposed west/north coasts.</p>`)}
      ${card('Family signal', `<p>Naxos&rsquo;s shallow sandy beaches are the standout for the 8-year-old; the Portara sunset, the Kleftiko caves, the Sarakiniko moonscape, and a windsurf lesson at Mikri Vigla or Golden Beach keep the 13-year-old engaged.</p>`)}
    </div>
  </section>

  <section id="balance" class="divider">
    <div class="section-label">
      <p class="eyebrow">Trip Balance</p>
      <h2>What the days add up to</h2>
      <p>Water-forward &mdash; sandy beaches, sculpted coves, a boat day, and a volcanic swim &mdash; with the villages and Athens carrying the town time and a lighter nature share.</p>
    </div>
    <div class="bar"><i style="width:45%;background:#3a6ea5"></i><i style="width:30%;background:#7d5ba6"></i><i style="width:25%;background:#3f7d4e"></i></div>
    <div class="balance">
      <div class="bcard k1"><div class="pct">45%</div><h4>Water &middot; Beaches &middot; Boats</h4><p>Agios Prokopios and Plaka sand, Kolymbithres coves, the Kleftiko boat day, Sarakiniko&rsquo;s turquoise slot, and Firopotamos.</p></div>
      <div class="bcard k2"><div class="pct">30%</div><h4>Towns &middot; Food &middot; Culture</h4><p>Athens and the Acropolis, Plaka and Anafiotika, Naoussa&rsquo;s harbor, Naxos Chora, and hilltop Plaka on Milos.</p></div>
      <div class="bcard k3"><div class="pct">25%</div><h4>Islands &middot; Villages &middot; Nature</h4><p>Naxos&rsquo;s green mountain villages, Klima&rsquo;s syrmata, the Portara, and the volcanic moonscape landscapes of Milos.</p></div>
    </div>
  </section>

  <section id="status" class="divider">
    <div class="section-label"><p class="eyebrow">Settled &amp; Open</p><h2>What is decided, what still needs a call</h2><p>The route is opinionated, but 2027 fares, the ferry schedules, and the meltemi wind need confirming before booking.</p></div>
    <div class="status"><div class="scol settled"><h4>Settled</h4>
      <div class="row"><b>Slug</b><span>greece-cyclades</span></div>
      <div class="row"><b>Route</b><span>Athens 2 nights -> Naxos 4 -> Paros 2 -> Milos 3 -> Athens 1 buffer, ferries out and a Milos -> Athens flight home.</span></div>
      <div class="row"><b>Dates</b><span>Depart Tue Jun 8, 2027; home Mon Jun 21, ahead of the preferred Jun 23 return and required Pittsburgh days Jun 24-26.</span></div>
      <div class="row"><b>Base</b><span>Naxos is the family anchor (4 nights) for shallow sandy beaches; Milos is the visual finale.</span></div>
      <div class="row"><b>Budget verdict</b><span>$11,650 target / $16,000 high &mdash; low case under the $12k target, high case above the $15k preferred maximum. Cost is the honest weak point.</span></div>
    </div><div class="scol open"><h4>Open</h4>
      <div class="row"><b>Airfare</b><span>No live 2027 quote; 2025-2026 proxy. Re-price PIT-Athens on ITA Matrix when inventory opens.</span></div>
      <div class="row"><b>Ferry schedules</b><span>2027 sailings not published; current SeaJets/Blue Star timings are proxies. Confirm and book 1-2 months out.</span></div>
      <div class="row"><b>Meltemi risk</b><span>June is calm, but keep the Kleftiko cruise early in the stay and the flex day open in case the wind blows.</span></div>
      <div class="row"><b>Kleftiko operator</b><span>Pick and pre-book a full-day cruise (Horizon, Excellent Yachting, Polco, Zephyros); confirm kid policy.</span></div>
    </div></div>
  </section>`;

const todo = {
  labelHtml: `
      <p class="eyebrow">Pre-Departure To-Do</p>
      <h2>What to book before leaving</h2>
      <p>Planning sequence for the Jun 8-21, 2027 Cyclades route. Track transatlantic fares before buying; ferries and the Milos flight come next; the Kleftiko cruise goes early in the Milos stay so weather can&rsquo;t sink it.</p>
    `,
  blocks: [
    {
      when: 'Jul-Aug 2026',
      tone: 'hot',
      title: 'Flight inventory opens: track, do not auto-buy',
      note: 'Price the family-of-4 PIT-Athens total and set alerts; the transatlantic ticket is the biggest single cost.',
      items: [
        '<b>Track PIT -> ATH.</b> Watch two-stop routings via a US gateway (JFK/EWR/PHL) and a European hub (LHR/FRA/CDG/AMS).',
        '<b>Set the airfare gate.</b> Target ~$5,000 family round-trip; high case ~$6,600.',
        '<b>Book one through-ticket</b> for the family rather than a self-transfer with kids.',
      ],
    },
    {
      when: 'By Sep 2026',
      title: 'Hold refundable lodging + the island cars',
      items: [
        '<b>Athens</b> 2 nights + 1 airport buffer night, <b>Naxos</b> 4, <b>Paros</b> 2, <b>Milos</b> 3 &mdash; refundable, with AC and parking.',
        '<b>Reserve a small automatic rental car per island</b> (Naxos, Paros, Milos) &mdash; automatics sell out first.',
        '<b>Note the Milos -> Athens flight</b> (Sky Express/Olympic) and hold the buffer-night hotel near ATH.',
      ],
    },
    {
      when: 'Winter 2026-27',
      tone: 'watch',
      title: 'Documents and the ferries',
      items: [
        '<b>Check passports, ETIAS (likely mandatory by Jun 2027; kids apply but are fee-exempt), and travel insurance.</b>',
        '<b>Map the ferry legs</b> on Ferryhopper: Piraeus-Naxos, Naxos-Paros, Paros-Milos; note June frequencies.',
        '<b>Bookmark an Aegean wind forecast</b> to watch the meltemi 5-7 days before each ferry.',
      ],
    },
    {
      when: '60-30 days out',
      title: 'Turn the plan into bookings',
      items: [
        '<b>Book the three inter-island ferries</b> once June 2027 sailings are published.',
        '<b>Buy the Acropolis timed-entry slot</b> at hhticket.gr and the Acropolis Museum tickets.',
        '<b>Pre-book a full-day Kleftiko cruise</b> for early in the Milos stay; confirm the kid policy.',
      ],
    },
    {
      when: 'Final 2 weeks',
      tone: 'done',
      title: 'Operational checks',
      items: [
        '<b>Download offline maps</b> for Athens, Naxos, Paros, and Milos.',
        '<b>Reconfirm flights, ferry times, island car counters, and the Kleftiko + Acropolis slots.</b>',
        '<b>Pack swim gear, reef shoes, hats, and high-SPF sunscreen</b> for the beaches, coves, and the shadeless Acropolis and Sarakiniko.',
      ],
    },
  ],
  callout: '<b>Do not forget:</b> this is the maximal-wow Aegean trip &mdash; but the meltemi and the transatlantic fare are the watch-items. Book the Kleftiko cruise early in the Milos stay, keep the flex day open, and take the Athens buffer night so nothing rides on a same-day island-to-Atlantic connection.',
};

const scorecard = {
  displayName: 'Greek Cyclades',
  blurb: 'Iconic Aegean: Naxos, Paros &amp; Milos',
  axes: {
    budget: 1,
    weather: 3,
    swim: 4,
    variety: 5,
    ease: 3,
    food: 4,
    risk: 3,
    nights: 5,
    novelty: 4,
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
    floorUsd: 11650,
    ceilUsd: 16000,
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
    swimTempF: [71, 73],
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
  countries: ['greece'],
  packingTags: ['beach', 'heat', 'hiking'],
  slug: 'greece-cyclades',
  lang: 'en',
  title: 'Greek Cyclades · Naxos, Paros & Milos via Athens — June 2027',
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  overrides: {
    packing: [
      '<b>Swim + sun kit:</b> suits, UPF shirts, hats, and high-SPF sunscreen for beaches, coves, and boat days.',
      '<b>Reef/water shoes:</b> for Sarakiniko&rsquo;s rock ledges, Kolymbithres granite, and Papafragas&rsquo;s steep descent.',
      '<b>A light layer for ferries:</b> fast catamarans and open decks get breezy in the meltemi.',
      '<b>Motion-sickness tablets:</b> for the kids on the longer ferry legs in a chop.',
      '<b>Grippy trainers:</b> for the Acropolis marble, the Plaka castle steps, and the mountain-village lanes.',
    ],
  },
  itinerary: {
    className: 'divider',
    labelHtml: `
      <p class="eyebrow">The Itinerary</p>
      <h2>Day by day</h2>
      <p>Swipe each carousel for photos. Every stop carries its cost, a money-saving tip, a splurge, picky-kid restaurants, backup / if-time ideas, blog links, and a map. Daily costs are food + activities only, not flights, lodging, ferries, or the rental cars.</p>
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
