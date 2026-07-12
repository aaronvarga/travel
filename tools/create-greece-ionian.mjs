#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const outDir = path.join(root, 'src/_data/greece-ionian');

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
// Every image is a downloaded, optimized local asset discovered via Google Images
// and pulled full-res from Pexels/Unsplash/Flickr source pages.
const PLAN = JSON.parse(fs.readFileSync(path.join(root, 'assets/img/greece-ionian/_photo-plan.json'), 'utf8'));
const BASE = '../../assets/img/greece-ionian';
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
  kefalonia: '#1f6f78',
  zakynthos: '#7d5ba6',
  transfer: '#c25a3a',
  lefkada: '#3f7d4e',
};
const mapPoints = [
  point('Kefalonia Airport (EFL)', 38.1201, 20.5053, 'transfer', 'flight'),
  point('Sami / Agia Efimia base', 38.2969, 20.6012, 'kefalonia', 'hotel'),
  point('Myrtos Beach', 38.3390, 20.5352, 'kefalonia', 'beach'),
  point('Myrtos cliff-road viewpoint', 38.3452, 20.5401, 'kefalonia', 'view'),
  point('Assos village &amp; Venetian castle', 38.3772, 20.5391, 'kefalonia', 'town'),
  point('Melissani Cave (underground lake)', 38.2631, 20.6281, 'kefalonia', 'view'),
  point('Drogarati Cave', 38.2394, 20.6322, 'kefalonia', 'view'),
  point('Fiskardo harbour village', 38.4573, 20.5782, 'kefalonia', 'town'),
  point('Antisamos Beach', 38.2583, 20.6803, 'kefalonia', 'beach'),
  point('Argostoli / Koutavos lagoon', 38.1743, 20.4891, 'kefalonia', 'town'),
  point('Lassi / Makris Gialos beach', 38.1561, 20.4662, 'kefalonia', 'beach'),
  point('Navagio (Shipwreck) viewpoint, Zakynthos', 37.8593, 20.6252, 'zakynthos', 'view'),
  point('Blue Caves, Zakynthos', 37.9291, 20.6303, 'zakynthos', 'beach'),
  point('Vasiliki &ndash; Fiskardo ferry', 38.6281, 20.6071, 'transfer', 'flight'),
  point('Nydri base, Lefkada', 38.7501, 20.7122, 'lefkada', 'hotel'),
  point('Porto Katsiki beach', 38.6521, 20.5522, 'lefkada', 'beach'),
  point('Egremni beach', 38.6671, 20.5571, 'lefkada', 'beach'),
  point('Kathisma beach', 38.7201, 20.5522, 'lefkada', 'beach'),
  point('Agios Nikitas &amp; Milos beach', 38.7821, 20.5822, 'lefkada', 'town'),
  point('Nydri / Dimosari gorge', 38.7351, 20.7201, 'lefkada', 'hike'),
  point('Vasiliki windsurf bay', 38.6281, 20.6071, 'lefkada', 'town'),
  point('Lefkada Town &amp; Gyra lagoon', 38.8341, 20.7061, 'lefkada', 'town'),
  point('Preveza / Aktion Airport (PVK)', 38.9254, 20.7653, 'transfer', 'flight'),
];

// ---- spots -----------------------------------------------------------------
const arriveSpot = mkSpot({
  name: 'Land at Kefalonia (EFL) and settle on the Sami coast',
  tags: ['kefalonia', 'ioniansea', 'greece'],
  carouselId: 'c-arrive',
  images: imgs('google_kefalonia_coast_01.jpg', 'google_ionian_turquoise_01.jpg', 'google_ionian_sunset_01.jpg'),
  lat: 38.2969,
  lng: 20.6012,
  cost: 'Kefalonia Airport (EFL) is the reliable Ionian gateway &mdash; around 28 flights a week from Athens (Aegean and Sky Express, ~1h15), which can be single-ticketed through from the US on Delta/Aegean or United/Aegean. Pick up the first rental car at the airport (~9 min from Argostoli) and drive ~35&ndash;45 min to a Sami or Agia Efimia base on the calm east coast, central to the caves, Myrtos, and the ferry.',
  climateLabel: 'Arrival',
  climate: '<b>Ionian June: warm, dry, and calm.</b> Highs ~78&ndash;84&deg;F, sea a swimmable ~72&ndash;74&deg;F, and only ~1&ndash;3 rain days all month. Mornings are glassy; a gentle NW Maistro breeze builds in the afternoon &mdash; nothing like the Aegean Meltemi. A grocery run tonight (there are Lidl/AB supermarkets in Argostoli and Sami) sets up easy apartment breakfasts.',
  save: 'Base in Sami/Agia Efimia rather than pricier Fiskardo or Lassi; a self-catering apartment with a pool and an early grocery stop cuts the food line hard.',
  splurge: 'A first-night seafront taverna dinner in Agia Efimia while the kids decompress from the flights.',
  restos: [
    '<b>Tereza, Sami</b> &mdash; harbourfront pizza/café, a reliable plain-cheese-pizza landing spot after travel',
    '<b>Contessina Pizzeria, Sami</b> &mdash; seaside pizza with a harbour view',
    '<b>Local AB / Lidl, Argostoli</b> &mdash; stock the apartment for breakfasts and beach lunches',
  ],
  alts: [
    '<b>Base in Lassi instead</b> for sandy, shallow beaches right by the airport if you prefer town amenities.',
    '<b>Quiet Agia Efimia harbour</b> for a smaller-village feel with tavernas on the water.',
    '<b>Early night, no plans</b> &mdash; the caves and Myrtos keep until tomorrow.',
  ],
  blogs: [
    { label: 'Kefalonia Airport info', href: 'https://www.efl-airport.gr/en/flights--more/flights--destinations' },
    { label: 'Kefalonia family guide', href: 'https://www.greeka.com/ionian/kefalonia/' },
  ],
});

const myrtosSpot = mkSpot({
  name: 'Myrtos Beach from the cliff road',
  tags: ['myrtos', 'myrtosbeach', 'kefalonia'],
  carouselId: 'c-myrtos',
  images: imgs('google_myrtos_cliff_01.jpg', 'google_myrtos_cliff_02.jpg', 'google_myrtos_cliff_03.jpg'),
  lat: 38.3390,
  lng: 20.5352,
  cost: 'The island&rsquo;s signature view &mdash; a white-pebble crescent between limestone headlands &mdash; and it&rsquo;s free. Park at the northern clifftop viewpoint for the postcard panorama with the hairpin road in frame, then drive the steep switchbacks down to the sand. Free roadside/lot parking above the beach (arrive before ~10am in season); a set of sunbeds runs about &euro;15/day.',
  climateLabel: 'Beach',
  climate: '<b>Stunning to look at, tricky to swim.</b> The seabed shelves steeply just metres out and waves/currents build with the afternoon breeze &mdash; multiple sources call it unsuitable for young or weak swimmers. Treat it as a wade-and-photograph beach for the 8-year-old and keep swimming close to shore; save real family swims for calmer Assos, Antisamos, or Lassi.',
  save: 'The northern viewpoint is the shot &mdash; you can get the whole trip&rsquo;s marquee photo without paying for anything but time. Bring your own shade and water rather than renting sunbeds.',
  splurge: 'A late-afternoon return for golden light on the white cliffs after the midday buses leave, with a drink at the viewpoint kantina.',
  restos: [
    '<b>Alaties / Divino taverna, Agia Efimia</b> &mdash; simple grilled chicken and pasta on the way back',
    '<b>Assos village tavernas</b> &mdash; pair Myrtos with lunch in Assos (below)',
    '<b>Apartment picnic</b> &mdash; there are no real facilities at the beach itself; pack lunch',
  ],
  alts: [
    '<b>Assos first, Myrtos viewpoint after</b> for better afternoon light on the bay.',
    '<b>Skip the descent</b> and enjoy the viewpoint only if the sea is rough &mdash; the swim isn&rsquo;t the point here.',
    '<b>Combine with Fiskardo</b> on a single north-coast loop day if pressed for time.',
  ],
  blogs: [
    { label: 'Myrtos viewpoint & beach', href: 'https://visitkefalonia.eu/viewpoint-myrtos-beach-north/' },
    { label: 'Myrtos beach guide', href: 'https://amazingkefalonia.com/myrtos-beach/' },
  ],
});

const assosSpot = mkSpot({
  name: 'Assos: a pastel village under a Venetian castle',
  tags: ['assos', 'assoskefalonia', 'kefalonia'],
  carouselId: 'c-assos',
  images: imgs('google_assos_01.jpg', 'google_assos_02.jpg', 'google_assos_03.jpg'),
  lat: 38.3772,
  lng: 20.5391,
  cost: 'One of Greece&rsquo;s prettiest villages: pastel houses on a slim isthmus below a pine-covered headland crowned by a 16th-century Venetian castle. Two free car parks (the near one fills first; the overflow is a ~5-min walk). The castle loop is a free ~2-hour walk (mostly unshaded &mdash; hats and water). The protected village bay is smooth pebbles and calm turquoise &mdash; the gentle family swim Myrtos isn&rsquo;t.',
  climateLabel: 'Village + swim',
  climate: '<b>Sheltered, calm, and easy.</b> The horseshoe harbour bay stays gentle even when the open coast is choppy, with a soft pebble entry &mdash; ideal for the 8-year-old after the drama of Myrtos. June air in the low 80s&deg;F; shade is scarce on the castle path, so do it early or late.',
  save: 'Park in the free overflow lot and swim off the village bay for nothing; the castle walk is free and the best thing here anyway.',
  splurge: 'A long lunch at a harbourside taverna table right on the water, then the full castle-headland loop for the view back over the village.',
  restos: [
    '<b>Platanos, Assos</b> &mdash; waterfront taverna with pasta and grilled options for the kids',
    '<b>Molos / Nefeli, Assos</b> &mdash; harbour tavernas with simple plates and village charm',
    '<b>Ice cream on the quay</b> &mdash; a low-drama treat after the castle climb',
  ],
  alts: [
    '<b>Swim first, castle after</b> to beat the midday heat on the unshaded path.',
    '<b>Skip the full castle loop</b> with tired legs &mdash; the gate and lower walls still give the view.',
    '<b>Myrtos viewpoint on the same loop</b> &mdash; the two pair naturally in one north-coast day.',
  ],
  blogs: [
    { label: 'Assos village guide', href: 'https://www.therepublicofrose.com/assos-kefalonia-guide/' },
    { label: 'Assos beach & castle', href: 'https://nomadekefalonia.com/experiences/assos-beach-kefalonia/' },
  ],
});

const cavesSpot = mkSpot({
  name: 'Melissani&rsquo;s blue lake &amp; Drogarati&rsquo;s cavern',
  tags: ['melissani', 'melissanicave', 'drogarati'],
  carouselId: 'c-caves',
  images: imgs('google_melissani_03.jpg', 'google_melissani_02.jpg', 'google_drogarati_01.jpg'),
  lat: 38.2631,
  lng: 20.6281,
  cost: 'Melissani is a collapsed-roof cave whose underground lake turns electric turquoise when the midday sun drops through the opening; a 10&ndash;15 min rowboat glides you across it. Admission is &euro;10 adult / &euro;5 child (a second on-site operator sets slightly different prices, so expect &plusmn;&euro;3). A few minutes away, Drogarati is a big walk-in stalactite cavern &mdash; &euro;6 adult / &euro;3 child, or a &euro;13 combo ticket. Summer hours ~09:00&ndash;19:00.',
  climateLabel: 'Caves',
  climate: '<b>Time Melissani for 11am&ndash;2pm.</b> The sunbeam that lights the water only fires when the sun is high, which also concentrates the crowds &mdash; arrive near opening of that window. Drogarati is a cool, dry ~18&deg;C cavern, a good midday heat-break and easy for both kids (steps, no boat). Both are short visits, well suited to an 8-year-old&rsquo;s attention span.',
  save: 'Buy the &euro;13 Melissani+Drogarati combo and go straight at the 11am sun window to skip the worst queue; the nearby Karavomilos lakeside park is a free shady picnic spot.',
  splurge: 'Add a swim and lunch at Karavomilos or Sami afterwards, or a glass-bottom Sami boat trip to cap the cave morning.',
  restos: [
    '<b>Karavomilos lake taverna</b> &mdash; shaded tables by the spring, simple pasta and grills',
    '<b>Tereza / Contessina, Sami</b> &mdash; harbour pizza a few minutes away',
    '<b>Melissani café kiosk</b> &mdash; drinks and snacks between the two caves',
  ],
  alts: [
    '<b>Drogarati first, Melissani at the sun window</b> to nail the blue-lake light.',
    '<b>Skip Drogarati</b> if the kids have had enough &mdash; Melissani is the headliner.',
    '<b>Sami beach afterwards</b> for an easy swim to finish the day.',
  ],
  blogs: [
    { label: 'Melissani official fees & hours', href: 'https://www.melissani-cave.com/fees' },
    { label: 'Melissani + Drogarati guide', href: 'https://theworldtravelguy.com/melissani-cave-lake/' },
  ],
});

const fiskardoSpot = mkSpot({
  name: 'Fiskardo: the Venetian harbour that survived the quake',
  tags: ['fiskardo', 'fiscardo', 'kefalonia'],
  carouselId: 'c-fiskardo',
  images: imgs('google_fiskardo_01.jpg', 'google_fiskardo_02.jpg', 'google_fiskardo_03.jpg'),
  lat: 38.4573,
  lng: 20.5782,
  cost: 'The one village that survived Kefalonia&rsquo;s 1953 earthquake intact, so its pastel Venetian waterfront is the real thing &mdash; a compact, walkable harbour ringed with tavernas and lined with yachts. Wandering and swimming off the nearby coves is free; the splurge is a self-drive day boat (small rental boats sit right on the harbour, roughly &euro;80&ndash;150/day for a licence-free outboard) to reach the turquoise coves.',
  climateLabel: 'Harbour village',
  climate: '<b>Calm, sheltered east-coast water.</b> The coves around Fiskardo (Emblisi, Foki) are protected and clear &mdash; easy family swimming with pine shade. June is warm and dry; the harbour is at its best in the early evening when the day boats return and the waterfront lights come on.',
  save: 'Park on the edge and walk in; swim at free Emblisi or Foki cove just outside the village rather than renting a boat, and eat pizza in Sami before or after.',
  splurge: 'Rent a small self-drive boat for a half-day of cove-hopping, then a harbourfront seafood dinner at Irida or Tassia as the parents&rsquo;-choice night.',
  restos: [
    '<b>Pomodoro-style pizza in Sami/Agia Efimia</b> &mdash; do the picky-kid meal off the harbour; Fiskardo skews upscale-seafood',
    '<b>Irida, Fiskardo</b> &mdash; well-loved harbour taverna for the splurge dinner',
    '<b>Snack kiosks on the quay</b> &mdash; crepes and ice cream keep the kids happy while parents linger',
  ],
  alts: [
    '<b>Emblisi or Foki cove</b> for the swim instead of a boat rental.',
    '<b>Half-day only</b>, paired with Assos/Myrtos on the north loop.',
    '<b>Water taxi to a cove</b> if you skip driving a boat yourself.',
  ],
  blogs: [
    { label: 'Fiskardo village guide', href: 'https://kefaloniagreece.net/fiskardo' },
    { label: 'Fiskardo boat rental', href: 'https://www.fiscardoboatrental.com/' },
  ],
});

const antisamosSpot = mkSpot({
  name: 'Antisamos: a green-backed turquoise bay',
  tags: ['antisamos', 'antisamosbeach', 'kefalonia'],
  carouselId: 'c-antisamos',
  images: imgs('google_antisamos_01.jpg', 'google_antisamos_02.jpg', 'google_antisamos_03.jpg'),
  lat: 38.2583,
  lng: 20.6803,
  cost: 'A wide white-pebble bay backed by steep green pine hills (a Captain Corelli filming location), ~4km east of Sami. Free to visit; well organised with sunbeds and mattresses (~&euro;15/pair, or free if you eat/drink at the beach bars), two tavernas, and good snorkelling just offshore. A genuine easy resort-day counterpart to wild Myrtos.',
  climateLabel: 'Beach',
  climate: '<b>Calm, clear, and family-easy.</b> Sheltered by its bay, the water is turquoise and gentle near shore, deepening gradually &mdash; comfortable for both kids in the ~73&deg;F Ionian. It gets busy in high summer thanks to the film fame; a mid-morning arrival gets the best sunbeds before the tour crowd.',
  save: 'Buy a couple of drinks at a beach bar to get free loungers, and bring snorkels &mdash; the rocky ends have the best fish for the kids.',
  splurge: 'A long lunch under the trees at the beach taverna, then a lazy full afternoon of swimming and snorkelling.',
  restos: [
    '<b>Antisamos beach tavernas</b> &mdash; grilled chicken, fries, and pasta right on the sand',
    '<b>Tereza / Contessina, Sami</b> &mdash; the go-to pizza a few minutes away',
    '<b>Sami gelato</b> &mdash; a harbour treat on the way home',
  ],
  alts: [
    '<b>Sami town beach</b> for an easier, closer swim if legs are tired.',
    '<b>Snorkel the rocky headlands</b> at either end for the best marine life.',
    '<b>Rest/pool afternoon</b> &mdash; a slow beach day is a valid mid-trip reset.',
  ],
  blogs: [
    { label: 'Antisamos beach guide', href: 'https://www.greeka.com/ionian/kefalonia/beaches/antisamos/' },
    { label: 'Antisamos reviews', href: 'https://www.tripadvisor.com/Attraction_Review-g678734-d3441870-Reviews-Antisamos_Beach-Sami_Kefalonia_Ionian_Islands.html' },
  ],
});

const navagioSpot = mkSpot({
  name: 'Navagio (Shipwreck) viewpoint, Zakynthos',
  tags: ['navagio', 'shipwreckbeach', 'zakynthos'],
  carouselId: 'c-navagio',
  images: imgs('google_navagio_aerial_01.jpg', 'google_navagio_aerial_02.jpg', 'google_navagio_aerial_03.jpg'),
  lat: 37.8593,
  lng: 20.6252,
  cost: 'The most famous beach in Greece &mdash; a rusted wreck on white sand in a cliff-ringed turquoise cove. <b>Honest status:</b> the cove has been closed to landing and swimming through at least Oct 2026 after repeated landslides, so tour boats now view it from the bay mouth only, and the sanctioned land view is the clifftop platform above (reached via Volimes). Re-check the 2027 status before booking. A full-day Kefalonia&ndash;Zakynthos boat trip runs ~&euro;45&ndash;60pp.',
  climateLabel: 'Boat day',
  climate: '<b>A long, sun-exposed sea day &mdash; morning is calmer.</b> Book an early departure before the afternoon Maistro builds a little chop, bring hats, sunscreen, and motion-sickness backup for the open crossing. The boat still swims at other Zakynthos coves even though Navagio itself is view-only.',
  save: 'Take the combined Blue Caves + Navagio-viewpoint boat rather than separate trips; it swims at open coves along the way, giving the kids water time even with the cove closed.',
  splurge: 'A smaller-group or semi-private boat with lunch included for more swim stops and less waiting.',
  restos: [
    '<b>Onboard / packed lunch</b> &mdash; most day boats include or allow food; pack kid snacks',
    '<b>Agia Efimia taverna dinner</b> &mdash; back on Kefalonia after the boat',
    '<b>Ice cream at the harbour</b> &mdash; a reliable end-of-boat-day win',
  ],
  alts: [
    '<b>Skip Zakynthos entirely</b> if a long boat day sounds like too much &mdash; a Kefalonia beach day is a fair swap.',
    '<b>Blue Caves focus</b> (below) for the best in-water swimming without the long Navagio run.',
    '<b>Clifftop platform by car+ferry</b> only if you want the land view &mdash; it&rsquo;s a big day for a photo.',
  ],
  blogs: [
    { label: 'Navagio closure status', href: 'https://www.thetraveler.org/zakynthos-navagio-beach-closed-to-visitors-until-october-2026/' },
    { label: 'Kefalonia to Zakynthos boat', href: 'https://www.getyourguide.com/kefalonia-l32475/from-kefalonia-zakynthos-full-day-boat-tour-t370901/' },
  ],
});

const blueCavesSpot = mkSpot({
  name: 'The Blue Caves by boat',
  tags: ['bluecaves', 'zakynthos', 'ionian'],
  carouselId: 'c-bluecaves',
  images: imgs('google_blue_caves_01.jpg', 'google_blue_caves_02.jpg'),
  lat: 37.9291,
  lng: 20.6303,
  cost: 'On Zakynthos&rsquo;s north tip, a run of sea arches and grottoes where the water glows an unreal electric blue as light reflects off the white limestone below. Unaffected by the Navagio closure, so the boat actually goes in and stops to swim &mdash; the real in-water highlight of the day. Included in the same ~&euro;45&ndash;60pp full-day boat trip.',
  climateLabel: 'Sea caves',
  climate: '<b>Clear, cool, luminous water.</b> The grottoes are calmest in the morning; the boat noses into the arches and usually gives a swim stop in the glowing water &mdash; a genuine wow for the kids. Bring goggles; the light is brightest under a high sun.',
  save: 'It&rsquo;s bundled into the day-boat fare &mdash; no extra cost. Bring your own goggles/snorkels rather than renting onboard.',
  splurge: 'A boat that lingers longer at the caves with a dedicated swim stop, or a sea-kayak add-on for the older kid.',
  restos: [
    '<b>Onboard lunch</b> &mdash; part of most full-day tours',
    '<b>Agios Nikolaos (Zak) kiosk</b> &mdash; snacks near the north-tip departure coves',
    '<b>Kefalonia dinner</b> &mdash; eat back at base after the crossing',
  ],
  alts: [
    '<b>Blue Caves only</b> as a shorter northern-Zakynthos boat if the full day is too long.',
    '<b>Snorkel the swim stop</b> for the best of the glowing water.',
    '<b>Swap for a Kefalonia cove day</b> if seas are up.',
  ],
  blogs: [
    { label: 'Zakynthos Blue Caves', href: 'https://www.zakynthos.gr/en/what-to-see/blue-caves/' },
    { label: 'Day boat with transfer', href: 'https://powertraveller.com/from-kefalonia-zakynthos-boat-trip-with-transfer/' },
  ],
});

const argostoliSpot = mkSpot({
  name: 'Argostoli: loggerhead turtles &amp; the Lassi beaches',
  tags: ['argostoli', 'koutavos', 'lassi'],
  carouselId: 'c-argostoli',
  images: imgs('google_argostoli_01.jpg', 'google_argostoli_02.jpg'),
  lat: 38.1743,
  lng: 20.4891,
  cost: 'The capital, and a gentle last Kefalonia day. Wild loggerhead sea turtles gather in the harbour (best 8&ndash;11am when the fishing boats return) &mdash; free to watch from the quay. Walk the 1813 De Bosset stone bridge across Koutavos lagoon, see the Katavothres sea-sinkholes, then finish at the shallow, sandy Lassi beaches (Makris Gialos / Platys Gialos) that are made for young kids (sunbeds ~&euro;15&ndash;20/pair, lifeguard in peak season).',
  climateLabel: 'Town + sandy beach',
  climate: '<b>The easiest swimming on the island.</b> Unlike pebbly steep Myrtos, Lassi&rsquo;s Makris and Platys Gialos are soft sand with shallow, calm water a long way out &mdash; explicitly good for the 8-year-old. June is warm; the turtle-watch works best early, before the heat and the boats stir the harbour.',
  save: 'Watch the turtles from the free public quay (no boat needed), walk the free De Bosset bridge, and bring your own beach shade for Lassi.',
  splurge: 'A sit-down waterfront lunch in Argostoli with a kids&rsquo; menu, then paid loungers at Makris Gialos for a lazy final beach afternoon.',
  restos: [
    '<b>Ampelaki, Argostoli</b> &mdash; waterfront taverna with a dedicated kids&rsquo; menu and plain pasta',
    '<b>Pizza Al Forno, Argostoli</b> &mdash; homemade pizza since 2006, a solid picky-kid pick',
    '<b>Lassi beach bars</b> &mdash; fries, toasties, and ice cream on the sand',
  ],
  alts: [
    '<b>Respect the turtles</b> &mdash; watch, don&rsquo;t feed or chase; the marine group posts guidance on the quay.',
    '<b>Platys over Makris</b> for the volleyball court and a slightly quieter stretch.',
    '<b>Katavothres + lighthouse</b> loop for a short novelty walk before the beach.',
  ],
  blogs: [
    { label: 'Argostoli turtles', href: 'https://www.island-wildlife.com/guided-walks/koutavos-lagoon,-argostoli' },
    { label: 'Lassi / Makris Gialos', href: 'https://www.tripadvisor.com/Attraction_Review-g644214-d2259066-Reviews-Makris_Gialos_Beach_Kefalonia-Lassi_Kefalonia_Ionian_Islands.html' },
  ],
});

const ferrySpot = mkSpot({
  name: 'Ferry the channel to Lefkada',
  tags: ['ionianferry', 'fiskardo', 'lefkada'],
  carouselId: 'c-ferry',
  images: imgs('google_lefkada_lagoon_02.jpg', 'google_meganisi_03.jpg'),
  lat: 38.6281,
  lng: 20.6071,
  cost: 'The one inter-island move, and it&rsquo;s short: a direct Ionion Pelagos ferry Fiskardo (Kefalonia) &rarr; Vasiliki (Lefkada), about an hour across the channel, no Ithaca transfer needed. Roughly &euro;40 for the car plus ~&euro;11&ndash;12/adult and half-fare kids &mdash; about &euro;90 for the family. Return the Kefalonia car at Fiskardo/EFL and pick up a fresh Lefkada car at Vasiliki, then drive up to a Nydri base (~40 min).',
  climateLabel: 'Ferry crossing',
  climate: '<b>A calm, scenic hour.</b> June crossings run a few times daily (frequency ramps up through the month); the channel is usually gentle in the morning. The exact 2027 timetable isn&rsquo;t published yet &mdash; treat the schedule as a proxy and reconfirm on Ionion Pelagos/Ferryhopper before travel.',
  save: 'Rent a separate economy car on each island (round-trip pickup at each) rather than paying a steep one-way ferry-crossing fee to carry one car across.',
  splurge: 'Time a mid-morning sailing and stop for lunch on the Vasiliki waterfront before driving up the Lefkada east coast.',
  restos: [
    '<b>Vasiliki waterfront tavernas</b> &mdash; simple pasta and grills at the arrival port',
    '<b>Pomodoro, Nydri</b> &mdash; wood-fired pizza waiting at the new base',
    '<b>Ferry snacks</b> &mdash; pack drinks/snacks; onboard options are limited',
  ],
  alts: [
    '<b>Lower-risk variant: round-trip EFL</b> &mdash; fly in and out of Kefalonia and reach Lefkada by this same ferry both ways, trading one extra crossing for avoiding the thin PVK flight.',
    '<b>Book the ferry ahead in peak weeks</b> for the car deck.',
    '<b>Early sailing</b> to keep the afternoon for settling in at Nydri.',
  ],
  blogs: [
    { label: 'Vasiliki–Fiskardo ferry', href: 'https://www.ferryscanner.com/en/ferry-routes/ferry-vassiliki-lefkada-fiskardo-kefalonia' },
    { label: 'Ionion Pelagos schedules', href: 'https://ionionpelagos.com/en/ferry-schedules/' },
  ],
});

const westBeachesSpot = mkSpot({
  name: 'Porto Katsiki &amp; the west-coast beaches',
  tags: ['portokatsiki', 'egremni', 'lefkada'],
  carouselId: 'c-westbeaches',
  images: imgs('google_porto_katsiki_01.jpg', 'google_egremni_01.jpg', 'google_kathisma_01.jpg', 'google_kathisma_02.jpg'),
  lat: 38.6521,
  lng: 20.5522,
  cost: 'Lefkada&rsquo;s west coast is a run of white-cliff, turquoise-water beaches. Porto Katsiki is the postcard &mdash; ~80&ndash;100 steps down from a paid clifftop lot (~&euro;8&ndash;15/day, half-price after 4pm; no beach fee). Kathisma is the big, easy, organised beach (free lot, sunbeds, tavernas) &mdash; the family-friendly pick. <b>Egremni is currently boat-only</b> after a June 2025 municipal closure of the land route (re-verify for 2027); day boats reach it from Nydri/Vasiliki.',
  climateLabel: 'West-coast beaches',
  climate: '<b>Go in the morning.</b> These west-facing beaches are calm at dawn, but the NW Maistro builds from midday and brings real chop and bigger waves by afternoon &mdash; every source says visit early for calm water and a parking spot. Kathisma is the most sheltered and stroller-friendly; Porto Katsiki&rsquo;s steep climb is hot at midday.',
  save: 'Do Kathisma (free parking, sunbeds, easy access) as the main swim and Porto Katsiki as a morning photo-and-dip; skip paid sunbeds and bring shade.',
  splurge: 'A boat trip from Vasiliki/Nydri that reaches Porto Katsiki and boat-only Egremni from the water, avoiding the cliff stairs entirely.',
  restos: [
    '<b>Rachi, Exanthia</b> &mdash; famous sunset-view taverna above the west coast, simple options for kids',
    '<b>Kathisma beach bars</b> &mdash; fries, toasties, and pasta right on the sand',
    '<b>Pack water + snacks</b> &mdash; Porto Katsiki has only a small kantina',
  ],
  alts: [
    '<b>Kathisma over Porto Katsiki</b> if the kids won&rsquo;t do the cliff stairs.',
    '<b>Kavalikefta</b> for a quieter, wilder west-coast cove (narrow access road).',
    '<b>Boat to Egremni/Porto Katsiki</b> for the cliff beaches without the climb.',
  ],
  blogs: [
    { label: 'Porto Katsiki guide', href: 'https://amazinglefkada.com/porto-katsiki-beach/' },
    { label: 'Egremni access status', href: 'https://amazinglefkada.com/egremni-beach/' },
  ],
});

const agiosNikitasSpot = mkSpot({
  name: 'Agios Nikitas village, Milos beach &amp; Vasiliki bay',
  tags: ['agiosnikitas', 'milosbeach', 'vasiliki'],
  carouselId: 'c-agiosnikitas',
  images: imgs('google_agios_nikitas_02.jpg', 'google_nydri_waterfalls_02.jpg'),
  lat: 38.7821,
  lng: 20.5822,
  cost: 'Agios Nikitas is Lefkada&rsquo;s prettiest, car-free stone village &mdash; walkable lanes and easy tavernas. Just around the headland, Milos beach is reached on foot (15&ndash;20 min uphill each way, past an old windmill) or by a ~5-min water taxi (~&euro;5&ndash;10pp) &mdash; the easier call with kids. Down south, Vasiliki bay is a windsurf mecca; the 13-year-old can try a beginner lesson on the reliable afternoon wind.',
  climateLabel: 'Village + bays',
  climate: '<b>Village mornings, wind sports afternoons.</b> Milos and the west side are calmest before midday; Vasiliki is the opposite &mdash; flat and calm early, then a dependable ~15&ndash;20kt thermal wind fills in around 3pm (which is exactly why windsurfers love it). Schedule family swims in the morning and any windsurf lesson for the afternoon.',
  save: 'Walk to Milos beach instead of the water taxi if the kids are up for the uphill return; wander Agios Nikitas and swim off the village beach for free.',
  splurge: 'A beginner windsurf lesson at Vasiliki for the older kid, and a sunset dinner in car-free Agios Nikitas.',
  restos: [
    '<b>To Steki, Agios Nikitas</b> &mdash; kids&rsquo; menu (grilled chicken/pasta), high chairs, and coloring books',
    '<b>Agios Nikitas village tavernas</b> &mdash; simple fish, pasta, and grills in the car-free lanes',
    '<b>Vasiliki waterfront</b> &mdash; casual lunch between windsurf sessions',
  ],
  alts: [
    '<b>Water taxi to Milos</b> to skip the hot uphill return.',
    '<b>Kids&rsquo; windsurf/SUP at Vasiliki</b> on the afternoon wind.',
    '<b>Quiet village evening</b> &mdash; Agios Nikitas is a lovely low-key dinner base.',
  ],
  blogs: [
    { label: 'Agios Nikitas & Milos', href: 'https://amazinglefkada.com/agios-nikitas-beach/' },
    { label: 'Vasiliki windsurfing', href: 'https://vasiliki.eu/windsurfing.html' },
  ],
});

const nydriBoatSpot = mkSpot({
  name: 'Nydri: Meganisi boat day &amp; the Dimosari gorge',
  tags: ['nydri', 'meganisi', 'skorpios'],
  carouselId: 'c-nydri',
  images: imgs('google_nydri_waterfalls_01.jpg', 'google_meganisi_boat_02.jpg', 'google_skorpios_01.jpg'),
  lat: 38.7501,
  lng: 20.7122,
  cost: 'From Nydri harbour, a wooden day-boat cruises the Meganisi channel: the boat motors <b>inside</b> the Papanikolis sea cave (a real kid wow), then loops the former Onassis islands of Skorpios and Madouri with a turquoise swim stop &mdash; roughly &euro;30&ndash;40pp for a group cruise, ~&euro;70&ndash;80pp with lunch. Pair a morning gorge or afternoon boat: the free Dimosari gorge walk near Nydri is a short, shaded canyon (parking free), though the falls run low by June &mdash; treat it as a pretty walk, not a waterfall swim.',
  climateLabel: 'Boat + gorge',
  climate: '<b>Calm channel, shaded gorge.</b> The Meganisi/Skorpios cruise is sheltered and gentle &mdash; good for the 8-year-old &mdash; with warm ~73&deg;F swim stops in turquoise coves. The Dimosari gorge is shaded and cool, a fine hot-afternoon alternative, but manage expectations on the waterfall flow by mid-June.',
  save: 'Take the group wooden-boat cruise (not a private charter) and bring your own snacks; the Dimosari gorge and its trailhead parking are free.',
  splurge: 'A smaller-group Meganisi cruise with lunch and more swim stops, or a private boat to time the Papanikolis cave without crowds.',
  restos: [
    '<b>Pomodoro, Nydri</b> &mdash; wood-fired pizza and pasta on the marina, a picky-kid favourite',
    '<b>Nydri waterfront tavernas</b> &mdash; grills and simple plates along the harbour',
    '<b>The Plane Tree, Dimosari trailhead</b> &mdash; drinks/snacks at the gorge entrance',
  ],
  alts: [
    '<b>Boat only</b> if the gorge is dry &mdash; the Meganisi cruise is the real highlight.',
    '<b>Dimosari gorge morning</b>, boat afternoon, or vice versa.',
    '<b>Sivota bay lunch</b> by boat or car for another turquoise cove.',
  ],
  blogs: [
    { label: 'Papanikolis / Meganisi cruise', href: 'https://www.getyourguide.com/papanikolis-cave-l175358/' },
    { label: 'Dimosari gorge walk', href: 'https://amazinglefkada.com/dimosari-waterfalls/' },
  ],
});

const lefkadaTownSpot = mkSpot({
  name: 'Lefkada Town, the lagoon &amp; Gyra windmills',
  tags: ['lefkadatown', 'gyra', 'lefkada'],
  carouselId: 'c-lefkadatown',
  images: imgs('google_lefkada_town_01.jpg', 'google_lefkada_lagoon_01.jpg'),
  lat: 38.8341,
  lng: 20.7061,
  cost: 'An easy, free last day. Lefkada Town connects to the mainland by the Agia Mavra floating causeway (no ferry ever needed to reach the island), and its centre is walkable and full of casual tavernas. The flat ~7km Gyra loop path rings the western lagoon past the surviving stone windmills and Gyra beach &mdash; a relaxed bike or drive-and-stroll to close the trip and repack before the short hop to Preveza airport.',
  climateLabel: 'Town + lagoon',
  climate: '<b>Warm, flat, and shadeless around the lagoon.</b> Walk or cycle the Gyra loop early or late; midday on the exposed spit is hot. The town itself has shaded lanes and a swing bridge that opens on the hour for boats &mdash; an easy, low-key finale after a busy Lefkada week.',
  save: 'The whole day is essentially free &mdash; walk the town, the lagoon path, and Gyra beach, and eat a final pizza in the centre.',
  splurge: 'A last seafood dinner on the Lefkada Town waterfront, or a sunset drink out at the Gyra windmills.',
  restos: [
    '<b>Made in Love, Lefkada Town</b> &mdash; Neapolitan-trained pizzeria, family-friendly, gluten-free dough option',
    '<b>Lefkada Town centre tavernas</b> &mdash; simple pasta, grills, and gyros in the walkable lanes',
    '<b>Bakeries + gelato</b> &mdash; easy trailside snacks for the lagoon loop',
  ],
  alts: [
    '<b>Gyra beach swim</b> for one last dip near town.',
    '<b>Bike the lagoon loop</b> instead of driving for an active last morning.',
    '<b>Early repack</b> &mdash; Preveza airport is only ~20&ndash;36 min via the causeway.',
  ],
  blogs: [
    { label: 'Lefkada town & Gyra', href: 'https://lefkadaslowguide.gr/en/locations/trip/the-towns-environs/' },
    { label: 'Preveza (PVK) to Lefkada', href: 'https://www.welcomepickups.com/aktion/airport-to-lefkada/' },
  ],
});

// ---- itinerary: 12 hotel nights (Kefalonia 7, Lefkada 5) --------------------
const days = [
  day('day0', 'c0', '0', 'Wed &middot; Jun 9', 'Depart Pittsburgh after work', 'Overnight to Athens', 'Est. $90 &middot; airport meals', [
    fact('Sleep', 'Overnight flight'),
    fact('Route target', 'PIT -> EWR/JFK -> ATH -> Kefalonia (EFL)'),
    fact('Constraint', 'In Pittsburgh all day Jun 24-26; Jun 23 return is allowed'),
  ], 'PIT has no nonstop to Greece and neither island airport takes long-haul, so the plan routes through a US gateway and Athens. Crucially, the Athens&ndash;Kefalonia leg can be single-ticketed through on Delta/Aegean or United/Aegean &mdash; so the arrival is on the reliable, well-served airport, not the thin one.', [], 'Travel day - position toward Athens and Kefalonia.'),

  day('day1', 'c1', '1', 'Thu &middot; Jun 10', 'Arrive Kefalonia (EFL), settle Sami', 'Soft landing on the Ionian', 'Est. $150 &middot; groceries, easy dinner', [
    fact('Sleep', 'Kefalonia (Sami/Agia Efimia) &middot; night 1 of 7'),
    fact('Transfer', 'EFL -> Sami ~35-45 min by rental car'),
    fact('Plan', 'Collect the car, check in, grocery run, harbour dinner'),
  ], 'Land at Kefalonia&rsquo;s reliable airport, pick up the first rental car, and drive to a calm east-coast base near Sami &mdash; central to the caves, Myrtos, and the ferry. An easy grocery-and-taverna evening to shake off the flights.', [arriveSpot], 'Travel day - land at EFL, collect car, drive to the Sami coast.'),

  day('day2', 'c1', '2', 'Fri &middot; Jun 11', 'Myrtos + Assos', 'The island&rsquo;s signature north-coast loop', 'Est. $180 &middot; parking, lunch, dinner', [
    fact('Sleep', 'Kefalonia (Sami/Agia Efimia) &middot; night 2 of 7'),
    fact('Anchor', 'Myrtos viewpoint + Assos village & castle'),
    fact('Swim rule', 'Swim at calm Assos, not steep-shelved Myrtos'),
  ], 'The postcard day: the Myrtos cliff-road panorama and a careful dip, then lunch and a gentle swim in the sheltered bay at pastel Assos below its Venetian castle. The two pair naturally on one north-coast loop.', [myrtosSpot, assosSpot]),

  day('day3', 'c1', '3', 'Sat &middot; Jun 12', 'Melissani + Drogarati caves', 'The electric-blue underground lake', 'Est. $150 &middot; cave tickets, lunch, dinner', [
    fact('Sleep', 'Kefalonia (Sami/Agia Efimia) &middot; night 3 of 7'),
    fact('Timing', 'Hit Melissani in the 11am-2pm sun window'),
    fact('Combo', 'Melissani + Drogarati €13 combo ticket'),
  ], 'A short, high-wow morning: the sunbeam-lit turquoise lake of Melissani by rowboat, timed for the midday sun shaft, then the cool stalactite cavern of Drogarati minutes away &mdash; a perfect heat-break, then an easy Sami swim.', [cavesSpot]),

  day('day4', 'c1', '4', 'Sun &middot; Jun 13', 'Fiskardo harbour day', 'Venetian pastel and turquoise coves', 'Est. $190 &middot; coves, lunch, boat option', [
    fact('Sleep', 'Kefalonia (Sami/Agia Efimia) &middot; night 4 of 7'),
    fact('Anchor', 'Fiskardo village + Emblisi/Foki coves'),
    fact('Option', 'Licence-free self-drive boat (~€80-150/day)'),
  ], 'The prettiest harbour on the island &mdash; the one village that survived the 1953 quake &mdash; with sheltered coves for easy swimming and optional self-drive boats to reach the clearest water. Do the picky-kid meal in Sami; Fiskardo dinner is the upscale splurge.', [fiskardoSpot]),

  day('day5', 'c1', '5', 'Mon &middot; Jun 14', 'Antisamos beach day', 'A green-backed turquoise resort bay', 'Est. $150 &middot; sunbeds, taverna, snorkel', [
    fact('Sleep', 'Kefalonia (Sami/Agia Efimia) &middot; night 5 of 7'),
    fact('Anchor', 'Antisamos Beach (Captain Corelli bay)'),
    fact('Kids', 'Calm near-shore water + snorkelling'),
  ], 'The easy beach day: a wide, organised, green-backed bay minutes from Sami with sunbeds, tavernas, and gentle turquoise water for both kids &mdash; a relaxed counterpoint to wild Myrtos and a good mid-trip reset.', [antisamosSpot]),

  day('day6', 'c1', '6', 'Tue &middot; Jun 15', 'Zakynthos boat day', 'Navagio viewpoint + the Blue Caves', 'Est. $320 &middot; day boat, lunch, dinner', [
    fact('Sleep', 'Kefalonia (Sami/Agia Efimia) &middot; night 6 of 7'),
    fact('Anchor', 'Full-day boat: Blue Caves swim + Navagio view'),
    fact('Honest', 'Navagio cove is view-only (closed to landing)'),
  ], 'The big set-piece: a full-day boat across to Zakynthos for the glowing Blue Caves (a real in-water swim stop) and the famous Navagio shipwreck cove &mdash; viewed from the bay mouth, since landing is closed. Book an early, calmer departure.', [navagioSpot, blueCavesSpot]),

  day('day7', 'c1', '7', 'Wed &middot; Jun 16', 'Argostoli + Lassi', 'Turtles, the stone bridge, and sandy beaches', 'Est. $150 &middot; town, lunch, beach', [
    fact('Sleep', 'Kefalonia (Sami/Agia Efimia) &middot; night 7 of 7'),
    fact('Morning', 'Loggerhead turtles at the harbour (8-11am)'),
    fact('Afternoon', 'Shallow, sandy Makris/Platys Gialos at Lassi'),
  ], 'A gentle last Kefalonia day: wild loggerhead turtles in Argostoli harbour, the historic De Bosset bridge over Koutavos lagoon, then the soft-sand, shallow Lassi beaches &mdash; the easiest swimming on the island for the 8-year-old. Repack tonight for the ferry.', [argostoliSpot]),

  day('day8', 'c4', '8', 'Thu &middot; Jun 17', 'Ferry to Lefkada, settle Nydri', 'A short channel crossing', 'Est. $200 &middot; ferry, car, dinner', [
    fact('Sleep', 'Lefkada (Nydri) &middot; night 1 of 5'),
    fact('Transfer', 'Fiskardo -> Vasiliki ferry ~1h, then ~40 min drive'),
    fact('Swap', 'Return the Kefalonia car; pick up a Lefkada car'),
  ], 'The one inter-island move, and an easy one: a direct ~1-hour ferry from Fiskardo to Vasiliki, a fresh rental car, and a scenic drive up the Lefkada east coast to a Nydri base. Reconfirm the sailing time &mdash; the 2027 timetable isn&rsquo;t published yet.', [ferrySpot], 'Ferry day - Fiskardo to Vasiliki, then drive up to Nydri.'),

  day('day9', 'c4', '9', 'Fri &middot; Jun 18', 'West-coast beaches', 'Porto Katsiki, Egremni &amp; Kathisma', 'Est. $150 &middot; parking, sunbeds, dinner', [
    fact('Sleep', 'Lefkada (Nydri) &middot; night 2 of 5'),
    fact('Holiday', 'Juneteenth observed Fri Jun 18 - a no-PTO active day'),
    fact('Timing', 'Go early: west beaches chop up in the afternoon wind'),
  ], 'On the Juneteenth observed holiday (no PTO for many employers), tackle Lefkada&rsquo;s famous white-cliff west coast in the calm morning: the postcard cliffs of Porto Katsiki and the easy, organised sands of Kathisma, with boat-only Egremni viewed from the water.', [westBeachesSpot]),

  day('day10', 'c4', '10', 'Sat &middot; Jun 19', 'Agios Nikitas + Vasiliki', 'Car-free village and a windsurf bay', 'Est. $170 &middot; water taxi, lesson, dinner', [
    fact('Sleep', 'Lefkada (Nydri) &middot; night 3 of 5'),
    fact('Morning', 'Agios Nikitas village + Milos beach (water taxi)'),
    fact('Afternoon', 'Optional windsurf lesson at Vasiliki'),
  ], 'A change of pace: the pretty car-free village of Agios Nikitas and a water-taxi hop to Milos beach in the calm morning, then south to windsurf-famous Vasiliki bay where the older kid can try a beginner lesson on the reliable afternoon wind.', [agiosNikitasSpot]),

  day('day11', 'c4', '11', 'Sun &middot; Jun 20', 'Meganisi boat day', 'Sea caves, Skorpios &amp; a shaded gorge', 'Est. $220 &middot; boat cruise, lunch, dinner', [
    fact('Sleep', 'Lefkada (Nydri) &middot; night 4 of 5'),
    fact('Anchor', 'Nydri boat: Papanikolis cave + Skorpios swim stop'),
    fact('Option', 'Dimosari gorge walk (low flow by June)'),
  ], 'The Lefkada boat day from Nydri: motoring into the Papanikolis sea cave and around the old Onassis islands with turquoise swim stops &mdash; sheltered and gentle for the kids &mdash; with the shaded Dimosari gorge as a cool-off alternative if you want land time.', [nydriBoatSpot]),

  day('day12', 'c4', '12', 'Mon &middot; Jun 21', 'Lefkada Town + Gyra', 'An easy last day and repack', 'Est. $140 &middot; town, lagoon, dinner', [
    fact('Sleep', 'Lefkada (Nydri) &middot; night 5 of 5'),
    fact('Morning', 'Lefkada Town, the causeway, the Gyra windmills'),
    fact('Tonight', 'Repack; Preveza airport is only ~20-36 min away'),
  ], 'A relaxed finale: walkable Lefkada Town, the floating causeway, and the flat lagoon loop past the Gyra windmills, with a last waterfront dinner. Repack tonight &mdash; the causeway puts Preveza airport just a short drive away tomorrow.', [lefkadaTownSpot]),

  day('day13', 'c0', '13', 'Tue &middot; Jun 22', 'Fly home from Preveza (PVK)', 'Home a day before the buffer', 'Est. $110 &middot; airport meals', [
    fact('Sleep', 'Home by Tue Jun 22 (buffer day Jun 23)'),
    fact('Route target', 'PVK -> London/Frankfurt/Munich -> US hub -> PIT'),
    fact('Risk', 'The PVK leg is thin/charter - buffer + insurance'),
  ], 'Drive the causeway to Preveza (PVK) and fly home via a European hub and a US gateway. This is the trip&rsquo;s one weak link &mdash; PVK&rsquo;s last leg is a thin, often separate-ticket charter &mdash; so the plan lands home Jun 22 and holds Jun 23 as a buffer before the required Pittsburgh days Jun 24-26.', [], 'Travel day - causeway to Preveza, fly home via a European hub.'),
];

const previewImages = [
  [`${BASE}/google_myrtos_cliff_01.jpg`, 'Day 2 &middot; Fri Jun 11', 'Myrtos Beach', 'The white crescent and deep-blue bay from the Kefalonia cliff road.'],
  [`${BASE}/google_melissani_03.jpg`, 'Day 3 &middot; Sat Jun 12', 'Melissani Cave', 'The midday sun shaft firing the underground lake electric turquoise.'],
  [`${BASE}/google_navagio_aerial_01.jpg`, 'Day 6 &middot; Tue Jun 15', 'Navagio, Zakynthos', 'The famous shipwreck cove on the full-day Ionian boat trip.'],
  [`${BASE}/google_porto_katsiki_01.jpg`, 'Day 9 &middot; Fri Jun 18', 'Porto Katsiki', 'Lefkada&rsquo;s white cliffs plunging into turquoise water.'],
  [`${BASE}/google_assos_01.jpg`, 'Day 2 &middot; Fri Jun 11', 'Assos', 'The pastel village and Venetian castle on their slim isthmus.'],
];

const oldPart0 = template.parts[0].html;
const afterBody = oldPart0.indexOf('</head><body>') + '</head><body>'.length;
const navStart = oldPart0.indexOf('<nav class="site-nav"');
const overviewStart = oldPart0.indexOf('<section id="overview"');
const headBody = oldPart0.slice(0, afterBody)
  .replace(/<title>.*?<\/title>/, '<title>Ionian Islands &middot; Kefalonia &amp; Lefkada &mdash; June 2027</title>');
const navToMain = oldPart0.slice(navStart, overviewStart)
  .replace('      <a href="#photo-guide">Photo Guide</a>\n      <a href="#food-guide">Food Guide</a>\n', '');

const preview = `<section class="preview">
  <div class="pv-pane">
    <span class="pv-kicker">Family Trip &middot; Jun 9&ndash;22, 2027</span>
    <h1>Ionian Islands<span>Kefalonia &amp; Lefkada</span></h1>
    <p class="pv-lead">Twelve hotel nights of the warmest, easiest turquoise swimming on the board &mdash; greener and gentler than the Cyclades, with almost no ferry stress. Seven nights on Kefalonia (Myrtos, Melissani&rsquo;s blue cave lake, Assos, Fiskardo, a Zakynthos boat day) then five on road-linked Lefkada (Porto Katsiki, the west-coast beaches, a Meganisi cruise). Calm ~73&deg;F water, one short ferry, short drives.</p>
    <div class="pv-stats"><div><b>12</b><span>Hotel nights</span></div><div><b>2</b><span>Islands</span></div><div><b>23</b><span>Stops mapped</span></div><div><b>$12k</b><span>priced target</span></div></div>
    <div class="pv-split" role="img" aria-label="Trip mix: about 55% water, 25% towns and food, 20% nature">
      <div class="seg water" style="flex:55"><b>55%</b><span>Water</span></div>
      <div class="seg town" style="flex:25"><b>25%</b><span>Towns &amp; food</span></div>
      <div class="seg nature" style="flex:20"><b>20%</b><span>Nature</span></div>
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
      <h2>The warmest, easiest turquoise-swim trip on the board</h2>
      <p>The Ionian is greener, calmer, and gentler than the Cyclades &mdash; no Aegean Meltemi, warm ~73&deg;F water, and genuine wow beaches. This plan lands at Kefalonia&rsquo;s reliable airport, spends <b>7 nights on Kefalonia</b> (Myrtos, Melissani, Assos, Fiskardo, a Zakynthos boat day), takes <b>one short direct ferry</b> to <b>Lefkada for 5 nights</b> (Porto Katsiki, the west-coast beaches, a Meganisi cruise), and flies home from nearby Preveza. It protects the required full days in Pittsburgh on <b>Jun 24-26</b>, with Jun 23 held as a buffer.</p>
    </div>
    <div class="overview">
      <div class="ocard"><p class="eyebrow">Route</p><h4>EFL -> Kefalonia 7n -> ferry -> Lefkada 5n -> PVK</h4><p>One country, one short ferry, no backtracking. Reliable Kefalonia arrival; road causeway (no ferry) links Lefkada to the Preveza departure. Home by Tue Jun 22.</p></div>
      <div class="ocard"><p class="eyebrow">Why it wins</p><h4>Easy warm swimming</h4><p>Calm, clear, turquoise ~73&deg;F water with sheltered family coves at Assos, Antisamos, Lassi, and Milos &mdash; plus short drives and low ferry stress. This is the ease-and-swim pick.</p></div>
      <div class="ocard"><p class="eyebrow">The honest trade</p><h4>One thin flight leg</h4><p>The homebound Preveza leg is a thin, often separate-ticket charter &mdash; the plan puts the reliable airport on arrival, buffers the departure, and documents a round-trip-Kefalonia variant that avoids it entirely.</p></div>
    </div>
  </section>

  <section id="why-this-trip" class="divider">
    <div class="section-label">
      <p class="eyebrow">Why This Trip</p>
      <h2>Warm water and low friction, done honestly</h2>
      <p>It delivers the board&rsquo;s easiest warm swimming &mdash; calm turquoise coves, short drives, one ferry &mdash; while being straight about the one weak link, the Preveza flight leg.</p>
    </div>
    <div class="plan-grid">
      ${card('Warmest, calmest swim', `<p>The Ionian in June is a warm, clear ~73&deg;F with no Meltemi &mdash; sheltered family coves at Assos, Antisamos, Lassi, and Milos, plus the electric-blue cave lakes at Melissani and Zakynthos. Gentler and greener than the Cyclades, and a stronger swim tier than the Atlantic or Alpine plans.</p>`)}
      ${card('Low logistics friction', `<p>Land at Kefalonia&rsquo;s well-served airport (single-ticketable via Athens), one short direct ferry to Lefkada, a road causeway (no ferry) to Preveza, short island drives, and a separate easy car on each island. No open-jaw scramble on arrival, no long transfers.</p>`)}
      ${card('The honest trade', `<p>You give up big-city culture and mountains &mdash; this is a focused island-and-sea trip &mdash; and you accept one thin flight leg. Preveza&rsquo;s homebound charter is the weak link, so the plan buffers it and offers a round-trip-Kefalonia alternative that skips it.</p>`)}
    </div>
  </section>

  <section id="stays" class="divider">
    <div class="section-label">
      <p class="eyebrow">Where We Stay</p>
      <h2>Two island bases, one short ferry apart</h2>
      <p>A calm east-coast Kefalonia base for the caves, Myrtos, and boat days, then a Lefkada east-coast base within reach of the west beaches and the Nydri boats. No airport-buffer night is needed &mdash; the causeway puts Preveza minutes from the last base.</p>
    </div>
    <div class="plan-grid">
      ${card('Kefalonia (Sami / Agia Efimia) &middot; 7 nights', `${prow('Target', 'Villa/apartment with pool &middot; €120-230/night')}${prow('Why', 'Central to Melissani, Myrtos, Fiskardo, Antisamos, and the Zakynthos boat')}${prow('Add', 'Tourist tax + grocery-friendly (Sami/Argostoli supermarkets)')}`)}
      ${card('Lefkada (Nydri) &middot; 5 nights', `${prow('Target', 'Villa/apartment with pool &middot; €150-300/night')}${prow('Why', 'East-coast base for the west beaches, Agios Nikitas, and Nydri boat days')}${prow('Arrive', 'By the Fiskardo -> Vasiliki ferry, then ~40 min drive')}`)}
      ${card('The ferry between', `${prow('Route', 'Fiskardo -> Vasiliki, direct, ~1 hour')}${prow('Cost', '~€90 family with the car (separate car per island)')}${prow('Note', '2027 timetable unpublished; reconfirm on Ionion Pelagos')}`)}
    </div>
  </section>

  <section id="calendar" class="divider">
    <div class="section-label">
      <p class="eyebrow">Calendar</p>
      <h2>Jun 9-22 fits the window and protects the Pittsburgh dates</h2>
      <p>Dates sit inside the Jun 6-Aug 15, 2027 planning window, return before the preferred Jun 23 date (holding it as a buffer), and keep the family in Pittsburgh all day Jun 24-26.</p>
    </div>
    ${table(['Date', 'Night', 'Base', 'Purpose'], [
      ['Wed Jun 9', 'Red-eye', 'PIT -> Athens', 'After-work departure'],
      ['Thu Jun 10-Wed Jun 16', '7', 'Kefalonia (Sami)', 'Myrtos, caves, Fiskardo, Zakynthos, Argostoli'],
      ['Thu Jun 17', 'ferry', 'Fiskardo -> Vasiliki', 'Direct ~1h crossing to Lefkada'],
      ['Thu Jun 17-Mon Jun 21', '5', 'Lefkada (Nydri)', 'West beaches, Agios Nikitas, Meganisi boat, town'],
      ['Tue Jun 22', 'Home', 'Lefkada -> PVK -> PIT', 'Home before the Jun 23 buffer'],
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
        <button data-region="kefalonia"><span class="sw" style="background:#1f6f78"></span>Kefalonia</button><button data-region="lefkada"><span class="sw" style="background:#3f7d4e"></span>Lefkada</button><button data-region="zakynthos"><span class="sw" style="background:#7d5ba6"></span>Zakynthos</button><button data-region="transfer"><span class="sw" style="background:#c25a3a"></span>Flights &amp; ferry</button><button data-region="all">Whole trip</button>
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
      <h2>In via reliable Kefalonia, home via thin Preveza</h2>
      <p>Research status: 2027 schedules are not yet bookable, so current 2025-2026 route and fare signals are planning proxies. Re-quote on ITA Matrix once inventory opens.</p>
    </div>
    <div class="plan-grid">
      ${card('In: PIT -> Kefalonia (EFL)', `${prow('Reality', 'No US nonstop; route via a US gateway + Athens')}${prow('Why it&rsquo;s safe', 'ATH-EFL is ~28 flights/week and single-ticketable via Delta/Aegean or United/Aegean')}${prow('Fare signal', '~$1,400-$1,725 pp long-haul portion')}`)}
      ${card('Home: Preveza (PVK)', `${prow('Reality', 'Thin, seasonal, charter-heavy (LGW/FRA/MUC)')}${prow('Weak link', 'The last leg is often a separate low-cost ticket = self-transfer')}${prow('Rule', 'Buffer 3+ hrs, insure the self-transfer, hold Jun 23')}`)}
      ${card('Lower-risk variant', `${prow('Round-trip EFL', 'Fly in and out of Kefalonia, fully single-ticket via Athens')}${prow('Trade', 'One extra ferry and a little backtracking to skip PVK')}${prow('Use when', 'Protecting the Jun 24-26 blackout is the priority')}`)}
      ${card('Open-jaw total', `${prow('Target', '~$5,600 family (open-jaw EFL in / PVK out)')}${prow('High', '~$6,900 if booked late or summer demand runs hot')}${prow('ETIAS', 'Likely mandatory by Jun 2027; ~$22/person, kids exempt but must apply')}`)}
    </div>
  </section>

  <section id="getting-around" class="divider">
    <div class="section-label">
      <p class="eyebrow">Getting Around</p>
      <h2>A car on each island, one short ferry</h2>
      <p>The Ionian is easy on the ground: short island drives on the calm side, and a single direct ferry between the two islands. The causeway means no ferry is ever needed to reach Lefkada itself.</p>
    </div>
    <div class="plan-grid">
      ${card('Two rental cars', `${prow('Plan', 'A separate economy automatic on each island')}${prow('Budget', '~$800-$1,300 total + fuel; book the automatic early')}${prow('Why', 'Cheaper than a costly one-way ferry-crossing car fee')}`)}
      ${card('The inter-island ferry', `${prow('Route', 'Fiskardo -> Vasiliki, direct, ~1 hour (Ionion Pelagos)')}${prow('Cost', '~€40 car + ~€11-12/adult, half-fare kids (~€90 family)')}${prow('Note', 'Frequency ramps up through June; 2027 timetable unpublished')}`)}
      ${card('The drives', `${prow('Short', 'Most island drives are 20-50 min on the calm coast')}${prow('Slow', 'The Myrtos descent and Kavalikefta road are narrow/winding')}${prow('Causeway', 'Lefkada -> Preveza (PVK) ~20-36 min, no ferry')}`)}
    </div>
  </section>`;

const healthTiming = `<section id="health-check" class="divider">
    <div class="section-label">
      <p class="eyebrow">Plan Health-Check</p>
      <h2>What to lock, watch, and expect</h2>
      <p>Current research refreshed July 2026 for a June 2027 trip. Kids assumed 13 and 8.</p>
    </div>
    <div class="hc-grid">
      <div class="hc good"><span class="hc-tag">Solid</span><h4>Easiest warm swimming on the board</h4><p>Calm, clear ~73&deg;F turquoise water with sheltered family coves (Assos, Antisamos, Lassi, Milos), no Aegean Meltemi, one short ferry, and short island drives. The ease-and-swim pick.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>Reliable arrival airport</h4><p>Kefalonia (EFL) has ~28 Athens flights a week and can be single-ticketed through from the US &mdash; so the trip <b>starts</b> on the dependable airport, not the thin one.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The Pittsburgh dates are protected</h4><p>Home by Tue Jun 22 with Jun 23 held as a buffer &mdash; ahead of the preferred Jun 23 return and clear of the required full days Jun 24-26.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>The Preveza departure leg is thin</h4><p>PVK&rsquo;s last leg is a seasonal, often separate-ticket charter (self-transfer). Buffer 3+ hours, insure the misconnection, and keep the round-trip-Kefalonia variant as the low-risk alternative.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Some beaches need care</h4><p>Myrtos shelves steeply with waves (a wade-not-swim beach for the 8-year-old), the west-coast beaches chop up after midday, Egremni is currently boat-only, and Navagio is closed to landing. All have easy alternatives.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Proxies until 2027 loads</h4><p>The open-jaw fare, the June ferry timetable, and the Navagio/Egremni access status are all current proxies. Re-quote and reconfirm once 2027 inventory and municipal notices are out.</p></div>
    </div>
  </section>

  <section id="timing" class="divider">
    <div class="section-label">
      <p class="eyebrow">Best Time</p>
      <h2>Why early-to-mid June wins for this constraint set</h2>
      <p>It gives 12 hotel nights, uses Juneteenth observed as a no-PTO active day, and returns before the blackout with a buffer.</p>
    </div>
    ${table(['Window', 'Nights', 'PTO', 'Blackout fit', 'Verdict'], [
      ['Jun 9-22', '12 hotel nights', '9 days', 'Home Jun 22, buffer Jun 23', '<b>Use this</b>'],
      ['Jun 15-29', '12+', '9 days', '<b>Invalid</b> - away during Jun 24-26', 'Reject'],
      ['Jun 27-Jul 10', '12+', '9 days', 'Valid', 'Backup; warmer sea, busier islands'],
      ['Aug 1-14', '12+', '9-10 days', 'Valid', 'Warmest Ionian, but peak crowds and prices'],
    ])}
    <div class="verdict-box" style="border-left-color:var(--c3);margin-top:18px"><h4>PTO math</h4><p>Friday Jun 18 is Juneteenth observed for many US employers, so it costs no PTO. Likely PTO days: Jun 9, 10, 11, then Jun 14, 15, 16, 17, then Jun 21, 22 &mdash; about <b>9 PTO days</b>, with weekends Jun 12-13 and 19-20 and the Jun 18 holiday free. The plan is home Tue Jun 22, holding the preferred Jun 23 return as a buffer against the thin Preveza leg and clear of the required Pittsburgh days Jun 24-26. Early June also means calm seas and pre-peak crowds.</p></div>
  </section>`;

const budgetTips = `<section id="budget" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Money</p>
      <h2>Budget, savers &amp; splurges</h2>
      <p>Real priced planning band using 2025-2026 route/fare/lodging signals because June 2027 inventory is not live. USD, family of four. Good mid-board value: the target lands at the $12k goal, with the high case grazing the $15k preferred maximum.</p>
    </div>
    ${table(['Line item', 'Target case', 'High case'], [
      ['Airfare, open-jaw (EFL in / PVK out), family of 4', '$5,600', '$6,700'],
      ['Lodging: 12 nights, two island villas/apartments w/ pool', '$1,700', '$2,800'],
      ['Rental cars (two islands) + fuel', '$800', '$1,300'],
      ['Inter-island ferry, parking, water-taxi, local transport', '$150', '$300'],
      ['Food and groceries, 13 travel days', '$1,560', '$2,200'],
      ['Activities: caves, Zakynthos + Meganisi boats, sunbeds', '$520', '$850'],
      ['Travel insurance, ETIAS, fees, buffer', '$470', '$850'],
      ['<b>Grand total</b>', '<b>$10,800</b>', '<b>$15,000</b>'],
    ])}
    <div class="twocol">
      <div class="listcard save-list"><h4>Save money</h4><ul><li>Self-cater from Sami/Argostoli supermarkets (Lidl/AB); apartment breakfasts and beach lunches cut the food line hard.</li><li>Rent an economy car on each island rather than paying a one-way ferry-crossing car fee.</li><li>Swim the free coves (Emblisi, Foki, Assos bay, Milos) and skip paid sunbeds; the Myrtos viewpoint is free.</li><li>Bundle the Blue Caves + Navagio into one day boat, and buy the €13 Melissani+Drogarati combo.</li><li>Consider the round-trip-Kefalonia routing &mdash; it can undercut the open-jaw and de-risk the flights.</li></ul></div>
      <div class="listcard splurge-list"><h4>Worth the splurge</h4><ul><li>The full-day Zakynthos boat for the glowing Blue Caves and the Navagio cove.</li><li>A self-drive boat from Fiskardo to reach the clearest turquoise coves.</li><li>The Meganisi/Papanikolis cruise from Nydri with a Skorpios swim stop.</li><li>A beginner windsurf lesson at Vasiliki for the 13-year-old.</li><li>A harbourfront seafood dinner in upscale Fiskardo or Assos.</li></ul></div>
    </div>
  </section>

  <section id="totals" class="divider">
    <div class="section-label">
      <p class="eyebrow">Bottom Line</p>
      <h2>Total trip cost</h2>
      <p>This plan lands at the $12k target, with the high case grazing the $15k preferred maximum on peak lodging and the open-jaw airfare. Good value for the board&rsquo;s easiest warm-water week.</p>
    </div>
    ${table(['Category', 'Estimate'], [
      ['Airfare, open-jaw (EFL in / PVK out)', '$5,600 target / $6,700 high'],
      ['Lodging, 12 nights, two islands', '$1,700 target / $2,800 high'],
      ['Rental cars (two islands) + fuel', '$800 target / $1,300 high'],
      ['Inter-island ferry, parking, local transport', '$150 target / $300 high'],
      ['Food, groceries, 13 travel days', '$1,560 target / $2,200 high'],
      ['Activities, caves, boat trips, sunbeds', '$520 target / $850 high'],
      ['Insurance, ETIAS, fees, buffer', '$470 target / $850 high'],
      ['<b>Grand total - family of 4</b>', '<b>$10,800 target / $15,000 high</b>'],
    ])}
    <p class="rate-note">Per-day itinerary costs cover food + activities only. Lodging, flights, the rental cars, and the ferry sit in the totals above, not the daily numbers.</p>
  </section>

  <section id="tips" class="divider">
    <div class="section-label">
      <p class="eyebrow">Travel Tips</p>
      <h2>The stuff nobody tells you</h2>
      <p>Operational rules that keep a two-island Ionian plan running smoothly.</p>
    </div>
    <div class="tips-order">
      <p class="mini-h">Book in roughly this order</p>
      <ol>
        <li>Open-jaw EFL-in / PVK-out ticket (or round-trip EFL)<span> &middot; re-quote on ITA Matrix when 2027 loads</span></li>
        <li>Two automatic rental cars, one per island<span> &middot; automatics book out early</span></li>
        <li>Refundable pool apartments in Sami and Nydri<span> &middot; parking, AC, kitchen</span></li>
        <li>The Fiskardo -> Vasiliki ferry<span> &middot; reconfirm the 2027 timetable</span></li>
        <li>The Zakynthos and Meganisi day boats<span> &middot; closer to travel</span></li>
      </ol>
    </div>
    <div class="tips-grid">
      <div class="tipcard"><h4>Flights</h4><p class="sub">Reliable in, thin out</p><ul><li class="flag"><b>Arrive at Kefalonia (EFL)</b> &mdash; single-ticketable via Athens.</li><li class="flag"><b>Buffer the Preveza leg</b> &mdash; it&rsquo;s a thin self-transfer charter.</li><li><b>Or fly round-trip EFL</b> and ferry to Lefkada to skip PVK.</li></ul></div>
      <div class="tipcard t2"><h4>Beaches</h4><p class="sub">Timing and safety</p><ul><li class="flag"><b>West-coast beaches in the morning</b> &mdash; afternoon wind brings chop.</li><li><b>Myrtos is a wade beach</b> for young kids &mdash; steep shelf, waves.</li><li><b>Swim calm Assos/Antisamos/Lassi</b> for the easy family water.</li></ul></div>
      <div class="tipcard t3"><h4>Tickets</h4><p class="sub">Timed and seasonal</p><ul><li><b>Melissani 11am-2pm</b> for the sun-shaft blue.</li><li><b>Navagio is view-only</b> &mdash; the cove is closed to landing.</li><li><b>Egremni is boat-only</b> right now &mdash; re-verify for 2027.</li></ul></div>
      <div class="tipcard t4"><h4>Driving</h4><p class="sub">Cars and the ferry</p><ul><li><b>Book an automatic early</b> &mdash; manuals dominate the fleet.</li><li><b>Rent per island</b> rather than a costly one-way ferry car fee.</li><li><b>Reconfirm the ferry time</b> &mdash; the 2027 timetable isn&rsquo;t out.</li></ul></div>
    </div>
  </section>`;

const socialBalanceStatus = `<section id="social" class="divider">
    <div class="section-label">
      <p class="eyebrow">What People Are Saying</p>
      <h2>Research signals to keep in mind</h2>
      <p>Operator data, official cave fees, and June climate all point the same way: the Ionian is the warm-and-easy swim pick, with one flight leg to manage.</p>
    </div>
    <div class="plan-grid">
      ${card('Swim signal', `<p>June sea temps of ~72-74&deg;F, the gentle Maistro breeze (no Meltemi), and sheltered coves at Assos, Antisamos, Lassi, and Milos all confirm the same thing: this is the board&rsquo;s easiest warm-water week, with the marquee Myrtos best admired and calmer bays best swum.</p>`)}
      ${card('Logistics signal', `<p>Kefalonia&rsquo;s ~28 weekly Athens flights and Delta/Aegean interline make the arrival single-ticketable, and the direct ~1h Fiskardo-Vasiliki ferry keeps island-hopping simple &mdash; while the thin Preveza departure is the one leg reviewers flag as fragile.</p>`)}
      ${card('Family signal', `<p>The Melissani boat, the Blue Caves swim, the Papanikolis cave cruise, the Argostoli turtles, and shallow sandy Lassi are the wins for an 8-year-old; the 13-year-old gets a Vasiliki windsurf lesson, snorkelling, and the cliff-beach adventure.</p>`)}
    </div>
  </section>

  <section id="balance" class="divider">
    <div class="section-label">
      <p class="eyebrow">Trip Balance</p>
      <h2>What the days add up to</h2>
      <p>Water-forward &mdash; turquoise beaches, cave lakes, and boat days &mdash; with pastel harbour villages carrying the town time and a little gorge, windmill, and cave walking for the nature slice.</p>
    </div>
    <div class="bar"><i style="width:55%;background:#3a6ea5"></i><i style="width:25%;background:#7d5ba6"></i><i style="width:20%;background:#3f7d4e"></i></div>
    <div class="balance">
      <div class="bcard k1"><div class="pct">55%</div><h4>Water &middot; Beaches &middot; Boats</h4><p>Myrtos, Assos, Antisamos, Lassi and Milos coves, the Melissani and Blue Caves, and the Zakynthos and Meganisi boat days.</p></div>
      <div class="bcard k2"><div class="pct">25%</div><h4>Towns &middot; Food &middot; Reset</h4><p>Pastel Fiskardo and Assos, car-free Agios Nikitas, Lefkada Town and Argostoli, tavernas, groceries, and the arrival day.</p></div>
      <div class="bcard k3"><div class="pct">20%</div><h4>Caves &middot; Gorge &middot; Walks</h4><p>The Drogarati cavern, the Dimosari gorge walk, the Assos castle loop, and the Gyra lagoon-and-windmills path.</p></div>
    </div>
  </section>

  <section id="status" class="divider">
    <div class="section-label"><p class="eyebrow">Settled &amp; Open</p><h2>What is decided, what still needs a call</h2><p>The route is opinionated, but 2027 fares, the ferry timetable, and the Navagio/Egremni access status need confirming before booking.</p></div>
    <div class="status"><div class="scol settled"><h4>Settled</h4>
      <div class="row"><b>Slug</b><span>greece-ionian</span></div>
      <div class="row"><b>Route</b><span>Kefalonia 7 nights (Sami) -> Fiskardo-Vasiliki ferry -> Lefkada 5 nights (Nydri), open-jaw EFL in / PVK out, a separate car per island.</span></div>
      <div class="row"><b>Dates</b><span>Depart Wed Jun 9, 2027; home by Tue Jun 22, holding Jun 23 as a buffer before the required Pittsburgh days Jun 24-26.</span></div>
      <div class="row"><b>Swim decision</b><span>Warm, calm ~73&deg;F Ionian; marquee Myrtos is a wade beach for the 8-year-old, with abundant sheltered coves for real family swimming.</span></div>
      <div class="row"><b>Budget verdict</b><span>$10,800 target / $15,000 high &mdash; at the $12k target, high case at the $15k preferred maximum. Good mid-board value.</span></div>
    </div><div class="scol open"><h4>Open</h4>
      <div class="row"><b>Airfare</b><span>No live 2027 quote; 2025-2026 proxy. Compare open-jaw EFL/PVK vs round-trip EFL on ITA Matrix; buffer and insure the PVK leg.</span></div>
      <div class="row"><b>Ferry timetable</b><span>June 2027 Fiskardo-Vasiliki times unpublished; reconfirm on Ionion Pelagos/Ferryhopper and book the car deck in peak weeks.</span></div>
      <div class="row"><b>Beach access</b><span>Egremni is currently boat-only and Navagio is closed to landing; re-verify both municipal statuses close to travel.</span></div>
      <div class="row"><b>Lodging</b><span>The €120-300/night pool-apartment band is a directional proxy; get real quotes once 2027 rates publish.</span></div>
    </div></div>
  </section>`;

const todo = {
  labelHtml: `
      <p class="eyebrow">Pre-Departure To-Do</p>
      <h2>What to book before leaving</h2>
      <p>Planning sequence for the Jun 9-22, 2027 Ionian route. Track fares before buying; compare the open-jaw EFL-in / PVK-out against a lower-risk round-trip Kefalonia.</p>
    `,
  blocks: [
    {
      when: 'Jul-Aug 2026',
      tone: 'hot',
      title: 'Flight inventory opens: track, do not auto-buy',
      note: 'Price the family-of-4 total both ways and set alerts; buy only when routing and price both work.',
      items: [
        '<b>Track open-jaw (EFL in / PVK out) vs round-trip EFL.</b> Watch a US gateway + Athens on Delta/Aegean or United/Aegean, and the seasonal PVK charters (LGW/FRA/MUC).',
        '<b>Set the airfare gate.</b> Target ~$5,600 family; high case ~$6,900. The round-trip EFL routing can undercut the open-jaw.',
        '<b>Single-ticket the Athens-Kefalonia arrival</b>; if you take the PVK departure, buffer 3+ hrs and insure the self-transfer.',
      ],
    },
    {
      when: 'By Sep 2026',
      title: 'Hold refundable lodging + two cars',
      items: [
        '<b>Kefalonia (Sami/Agia Efimia)</b> 7 nights and <b>Lefkada (Nydri)</b> 5 nights &mdash; refundable pool apartments with parking, AC, and a kitchen.',
        '<b>Reserve one automatic rental car per island</b> (round-trip pickup at each) rather than a costly one-way ferry crossing.',
        '<b>Pencil the Fiskardo -> Vasiliki ferry</b> and note that the exact June 2027 timetable is not yet published.',
      ],
    },
    {
      when: 'Winter 2026-27',
      tone: 'watch',
      title: 'Documents and access checks',
      items: [
        '<b>Check passports, ETIAS (likely mandatory by Jun 2027; kids exempt but must apply), and travel insurance</b> that covers self-transfer misconnections for the PVK leg.',
        '<b>Carry an AAA International Driving Permit</b> &mdash; Greek insurers may require it alongside your license.',
        '<b>Re-verify Egremni land access and the Navagio landing status</b> via the Lefkada/Zakynthos municipalities.',
      ],
    },
    {
      when: '60-30 days out',
      title: 'Turn the plan into bookings',
      items: [
        '<b>Book the Zakynthos Blue Caves + Navagio day boat</b> and the Nydri Meganisi/Papanikolis cruise.',
        '<b>Confirm the Fiskardo -> Vasiliki sailing time</b> once the 2027 timetable posts, and reserve the car deck.',
        '<b>Note Melissani&rsquo;s 11am-2pm sun window</b> and any windsurf lesson at Vasiliki for the 13-year-old.',
      ],
    },
    {
      when: 'Final 2 weeks',
      tone: 'done',
      title: 'Operational checks',
      items: [
        '<b>Download offline maps</b> for Kefalonia, Zakynthos, and Lefkada.',
        '<b>Reconfirm flight times, both car counters, the ferry sailing, and the boat-trip departures.</b>',
        '<b>Pack reef shoes for pebble beaches, snorkels, swim/sun kit, and a light layer for the caves.</b>',
      ],
    },
  ],
  callout: '<b>Do not forget:</b> this is the warm-and-easy swim pick &mdash; calm ~73&deg;F water, one short ferry, short drives. Arrive at reliable Kefalonia, buffer the thin Preveza departure, and re-verify the ferry timetable and the Navagio/Egremni access before you commit.',
};

const scorecard = {
  displayName: 'Ionian Islands',
  blurb: 'Warmest, easiest turquoise-swim trip',
  axes: {
    budget: 3,
    weather: 4,
    swim: 4,
    variety: 3,
    ease: 4,
    food: 4,
    risk: 3,
    nights: 5,
    novelty: 4,
    pto: 2,
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
    floorUsd: 10800,
    ceilUsd: 15000,
    targetUsd: 12000,
    preferredMaxUsd: 15000,
  },
  pto: {
    days: 9,
    nights: 12,
  },
  facets: {
    continent: 'europe',
    maxConnections: 2,
    swimTempF: [72, 74],
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
  countries: ['greece-ionian'],
  packingTags: ['beach', 'hiking', 'heat'],
  slug: 'greece-ionian',
  lang: 'en',
  title: 'Ionian Islands · Kefalonia & Lefkada — June 2027',
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  overrides: {
    packing: [
      '<b>Reef/water shoes:</b> Ionian beaches are pebble (Myrtos, Antisamos) and the coves have rocky entries.',
      '<b>Snorkels + goggles:</b> the Blue Caves swim stop, Fiskardo coves, and Antisamos headlands reward them.',
      '<b>Swim + sun kit:</b> suits, UPF shirts, hats, and reef-safe sunscreen for long boat and beach days.',
      '<b>Motion-sickness backup:</b> for the open Zakynthos crossing and the Meganisi cruise.',
      '<b>A light layer for the caves:</b> Drogarati is a cool ~18&deg;C even on a hot day.',
    ],
  },
  itinerary: {
    className: 'divider',
    labelHtml: `
      <p class="eyebrow">The Itinerary</p>
      <h2>Day by day</h2>
      <p>Swipe each carousel for photos. Every stop carries its cost, a money-saving tip, a splurge, picky-kid restaurants, backup / if-time ideas, blog links, and a map. Daily costs are food + activities only, not flights, lodging, the rental cars, or the ferry.</p>
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
