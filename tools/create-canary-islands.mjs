#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const outDir = path.join(root, 'src/_data/canary-islands');

function gmaps(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function point(n, lat, lng, r, t) {
  return { n, lat, lng, r, g: gmaps(lat, lng), t };
}

function unsplash(id, width = 1200) {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;
}

function pexels(id, width = 1200) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
}

function img(src, captionTitle, credit, href = src) {
  return { href, src, alt: captionTitle.replace(/&amp;/g, '&'), captionTitle, credit };
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

function altList(items) {
  return `<ul class="alt-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}

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

function fact(label, valueHtml) {
  return { label, valueHtml };
}

function card(title, body) {
  return `<div class="pcard"><h4><span class="dot"></span>${title}</h4>${body}</div>`;
}

function prow(label, value) {
  return `<div class="prow"><span>${label}</span><strong>${value}</strong></div>`;
}

function table(headers, rows, className = 'budget-tbl') {
  return `<div class="budget-scroll"><table class="${className}"><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
}

const mapColors = {
  tenerife: '#1f6f78',
  lapalma: '#3f7d4e',
  transfer: '#c25a3a',
};

const mapPoints = [
  point('Tenerife South Airport (TFS)', 28.0445, -16.5725, 'transfer', 'flight'),
  point('Tenerife North Airport (TFN)', 28.4827, -16.3415, 'transfer', 'flight'),
  point('Puerto de la Cruz / north Tenerife base', 28.4136, -16.5482, 'tenerife', 'hotel'),
  point('Teide cable car / Roques de Garcia', 28.2546, -16.6249, 'tenerife', 'hike'),
  point('Anaga laurisilva: Cruz del Carmen', 28.5319, -16.2808, 'tenerife', 'hike'),
  point('Playa de Las Teresitas', 28.5096, -16.1856, 'tenerife', 'beach'),
  point('Playa de Las Gaviotas', 28.5116, -16.1749, 'tenerife', 'beach'),
  point('Masca village / gorge trailhead', 28.3045, -16.8403, 'tenerife', 'hike'),
  point('Playa Jardin / Puerto de la Cruz', 28.4137, -16.5575, 'tenerife', 'beach'),
  point('La Palma Airport (SPC)', 28.6265, -17.7556, 'transfer', 'flight'),
  point('Los Llanos / El Paso base', 28.6586, -17.9185, 'lapalma', 'hotel'),
  point('Caldera de Taburiente / Los Brecitos', 28.7197, -17.8843, 'lapalma', 'hike'),
  point('Los Tilos laurisilva', 28.7932, -17.8044, 'lapalma', 'hike'),
  point('Refugio El Pilar / Ruta de los Volcanes segment', 28.6055, -17.8386, 'lapalma', 'hike'),
  point('Roque de los Muchachos', 28.7541, -17.8851, 'lapalma', 'view'),
  point('Santa Cruz de La Palma', 28.684, -17.7645, 'lapalma', 'town'),
  point('Tazacorte / Puerto de Tazacorte', 28.642, -17.9338, 'lapalma', 'beach'),
  point('Pizzeria La Laguna', 28.6464, -17.9119, 'lapalma', 'food'),
  point('Taller de Pasta Fresca', 28.6588, -17.9132, 'lapalma', 'food'),
  point('Puerto de la Cruz dinner zone', 28.4136, -16.5482, 'tenerife', 'food'),
];

const teideImages = [
  img(unsplash('1677500607573-13b430d5399e'), 'Pico del Teide volcanic high country', 'Boris Busorgin &middot; Unsplash License'),
  img(unsplash('1667930579231-f34fa5df2970'), 'Mount Teide lava landscape', 'Hasmik Ghazaryan Olson &middot; Unsplash License'),
  img(unsplash('1768155210926-ce5e6116574c'), 'Teide road into the cloud sea', 'Kamil Molendys &middot; Unsplash License'),
];

const anagaImages = [
  img(unsplash('1628442222245-d40cfce76fd1'), 'Sendero de los Sentidos laurel tunnel', 'Kamil Molendys &middot; Unsplash License'),
  img(unsplash('1554743807-976e8b16ac88'), 'Cruz del Carmen sunset over Teide', 'Daniel Llorente &middot; Unsplash License'),
  img(unsplash('1695219600195-b7dde5b1b584'), 'Anaga cliffs above Benijo', 'Carla Diaferia &middot; Unsplash License'),
];

const beachImages = [
  img(pexels('31466226'), 'Las Teresitas aerial sweep', 'Danyil M. &middot; Pexels License'),
  img(pexels('6726419'), 'Las Teresitas bay from above', 'Magic K &middot; Pexels License'),
  img(unsplash('1699865701680-ef9214d90fbf'), 'Benijo black-sand sunset', 'Thomas Chizzali &middot; Unsplash License'),
];

const mascaImages = [
  img(unsplash('1754919982219-a3931e9ffc71'), 'Masca road and cliffs', 'Elodie Debard &middot; Unsplash License'),
  img(unsplash('1691397553539-c7c573138747'), 'Masca ridges above the Atlantic', 'Hendrik Cornelissen &middot; Unsplash License'),
  img(pexels('17213569'), 'Masca village under the Teno cliffs', 'Jacint Bofill &middot; Pexels License'),
];

const calderaImages = [
  img(unsplash('1742387436289-0733469c7dca'), 'Caldera cloud-wall ridges', 'Luke Thornton &middot; Unsplash License'),
  img(unsplash('1726851113251-9e92ff6812d7'), 'Caldera de Taburiente mist forest', 'Antoni Moszczynski &middot; Unsplash License'),
  img(unsplash('1742387436287-26b5200a5540'), 'La Palma peaks above the cloud sea', 'Luke Thornton &middot; Unsplash License'),
];

const tilosImages = [
  img(unsplash('1561298233-3b0dadf82094'), 'Cascada de Los Tilos waterfall', 'David Monje &middot; Unsplash License'),
  img(unsplash('1561298233-ff07544d8fee'), 'Los Tilos laurisilva canyon', 'David Monje &middot; Unsplash License'),
  img(unsplash('1561298233-cafd10eadbfa'), 'Los Tilos boardwalk through ferns', 'David Monje &middot; Unsplash License'),
];

const volcanesImages = [
  img(unsplash('1622315513561-3700c51ac236'), 'Teneguia volcanic cone above the Atlantic', 'Miguel &Aacute;ngel Sanz &middot; Unsplash License'),
  img(unsplash('1676034625780-f662d34ac673'), 'La Palma lava fields below Cumbre Vieja', 'Victoriano Izquierdo &middot; Unsplash License'),
  img(unsplash('1679581328066-7825fac7de14'), 'Cumbre Vieja volcanic ridge', 'Annie Knitter &middot; Unsplash License'),
];

const roqueImages = [
  img(unsplash('1742472194018-44f79dee11ff'), 'Roque observatory at sunset above clouds', 'Luke Thornton &middot; Unsplash License'),
  img(unsplash('1742472194058-0c94c73e3b43'), 'Telescope perched above the cloud sea', 'Luke Thornton &middot; Unsplash License'),
  img(unsplash('1763147164854-4a029c67de29'), 'La Palma dark-sky road under the Milky Way', 'Evgeni Tcherkasski &middot; Unsplash License'),
];

const santaCruzImages = [
  img(unsplash('1763299020114-5cb5cea33537'), 'Santa Cruz de La Palma coastal town', 'Andrei Moraru &middot; Unsplash License'),
  img(unsplash('1760532786648-90f655d24ab5'), 'La Palma volcanic sea pools and arches', 'Evgeni Tcherkasski &middot; Unsplash License'),
  img(unsplash('1722522695721-17c6d92e278b'), 'Santa Cruz de La Palma old-town street', 'Luke Thornton &middot; Unsplash License'),
];

const teideSpot = mkSpot({
  name: 'Teide National Park: cable car + Roques de Garcia trail segment',
  tags: ['teide', 'teidenationalpark', 'tenerife'],
  carouselId: 'c-teide',
  images: teideImages,
  lat: 28.2546,
  lng: -16.6249,
  cost: 'Teide cable car official 2026 price signal: non-resident adult return about &euro;42, child 3-13 return about &euro;21. Family cable-car baseline: about &euro;126 before parking, food, summit permits, or a guided add-on.',
  climateLabel: 'Altitude',
  climate: '<b>3,715m peak / high desert.</b> Tenerife coast can be upper 70s F in June, but the La Rambleta top station is 3,555m and colder, sunnier, windier, and dehydration-prone. Closed mountain/sports shoes are required; no under-3s on the cable car.',
  save: 'Buy cable-car tickets direct, skip the summit-permit obsession unless everyone is fit, and do a real but short trail: a top-station viewpoint trail, Roques de Garcia segment, or Montana Blanca lower section.',
  splurge: 'A sunrise/stargazing guided Teide evening works if everyone handles altitude, but it is not required for the family win.',
  restos: [
    '<a href="https://daarianna.com/" target="_blank" rel="noreferrer"><b>Da Arianna, Puerto de la Cruz</b></a> - fresh pasta and pizza after the mountain',
    '<a href="https://qr.menu-touch.fr/index.php?id_client=9457&lang=EN" target="_blank" rel="noreferrer"><b>Restaurante Divino</b></a> - chicken nuggets/fries, wings, and pasta fallback',
    '<b>Pack lunch</b> - Teide services are limited and mountain timing is better with snacks in the car',
  ],
  alts: [
    '<b>Roques de Garcia only</b> if the cable car is wind-closed or anyone feels altitude effects.',
    '<b>Mirador de Chipeque</b> for an easier sunset view if Teide tickets sell out.',
    '<b>La Orotava old town</b> as the low-altitude fallback in bad mountain weather.',
  ],
  blogs: [
    { label: 'Teide cable car official prices', href: 'https://www.volcanoteide.com/en/teide_cable_car/prices_and_opening_times' },
    { label: 'Teide National Park visitor info', href: 'https://www.volcanoteide.com/en/teide_national_park' },
  ],
});

const anagaSpot = mkSpot({
  name: 'Anaga laurel forest: Cruz del Carmen + Sendero de los Sentidos',
  tags: ['anaga', 'laurisilva', 'tenerife'],
  carouselId: 'c-anaga',
  images: anagaImages,
  lat: 28.5319,
  lng: -16.2808,
  cost: 'Most Anaga walking is free. The no-drama family anchor is Sendero de los Sentidos from Cruz del Carmen: about 2.15 km, low difficulty, with accessible boardwalk sections on route 1. El Pijaral / Enchanted Forest requires advance permission and strict caps.',
  climateLabel: 'Forest',
  climate: '<b>Cloud forest microclimate.</b> It can be misty, wet, and 10-15 F cooler than Santa Cruz. Bring a light rain shell even when the beach forecast looks perfect.',
  save: 'Use the free visitor-center trails and viewpoints. This is the Madeira-style Laurisilva day without paying for a guide.',
  splurge: 'Hire a private Anaga naturalist if you want the forest ecology interpreted instead of just photographed.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=family+restaurant+La+Laguna+Tenerife+pizza" target="_blank" rel="noreferrer"><b>La Laguna family restaurants</b></a> - best post-forest dinner base if you stay east/north',
    '<b>Bar-cafe fallback near Cruz del Carmen</b> - simple sandwiches/drinks, but do not rely on a full picky-kid meal in the forest',
  ],
  alts: [
    '<b>Taganana viewpoint loop</b> if roads and stomachs are holding up.',
    '<b>Playa de Benijo</b> for a black-sand scenery add-on, not a safe calm swim default.',
    '<b>San Cristobal de La Laguna</b> if fog/rain makes hiking unpleasant.',
  ],
  blogs: [
    { label: 'Tenerife Anaga official park info', href: 'https://www.webtenerife.co.uk/what-see/nature/rural-parks/anaga/' },
    { label: 'Permit/reservation portal', href: 'https://centralreservas.tenerife.es/' },
  ],
});

const beachSpot = mkSpot({
  name: 'Las Teresitas calm-water day + true black-sand add-ons',
  tags: ['lasteresitas', 'playajardin', 'tenerifebeach'],
  carouselId: 'c-beaches',
  images: beachImages,
  lat: 28.5096,
  lng: -16.1856,
  cost: 'Las Teresitas is free, has services, parking, lifeguards/showers in season, and a breakwater that keeps water calmer. Budget &euro;35-70 for chairs, snacks, ice cream, and parking friction if lots fill.',
  climateLabel: 'Beach',
  climate: '<b>June coast:</b> typical highs about 76-79 F; ocean around 70-72 F. Swimmable for hardy kids, but not Caribbean-warm.',
  save: 'Treat Las Teresitas as the family swim day because it is protected and easy. For black sand, add Las Gaviotas, Playa Jardin, Bollullo, or Benijo as scenery/splash stops.',
  splurge: 'Use a simple beach-club/chair setup for shade if the 8-year-old is getting too much sun.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=Las+Teresitas+Tenerife+restaurant+pizza" target="_blank" rel="noreferrer"><b>San Andres / Las Teresitas food search</b></a> - beach cafes plus simple meals',
    '<a href="https://www.google.com/maps/search/?api=1&query=Santa+Cruz+de+Tenerife+pizza+pasta" target="_blank" rel="noreferrer"><b>Santa Cruz pizza/pasta fallback</b></a> - better picky-kid safety after the beach',
  ],
  alts: [
    '<b>Playa Jardin</b> for true black sand and Puerto de la Cruz services.',
    '<b>Playa Bollullo</b> for dramatic black sand, with more parking/stair friction.',
    '<b>Las Gaviotas</b> immediately beyond Teresitas if you want the black-sand visual without a long drive.',
  ],
  blogs: [
    { label: 'Las Teresitas official beach page', href: 'https://www.webtenerife.co.uk/what-see/beaches/las-teresitas/' },
    { label: 'Tenerife beaches official list', href: 'https://www.webtenerife.co.uk/what-see/beaches/' },
  ],
});

const mascaSpot = mkSpot({
  name: 'Masca gorge decision day',
  tags: ['masca', 'barrancodemasca', 'tenerife'],
  carouselId: 'c-masca',
  images: mascaImages,
  lat: 28.3045,
  lng: -16.8403,
  cost: 'Official Masca trail booking currently lists descent-only access from about &euro;40.66 adult and reduced youth pricing, with helmet, hiking-shoe, water, ID, boat-ticket, and bus-access rules. Family baseline: treat full-gorge hiking as optional, not automatic.',
  climateLabel: 'Trail',
  climate: '<b>Dry, rocky, exposed.</b> The official descent is about 5 km one-way / ~4 hours and high difficulty. Under-8s are not allowed; an 8-year-old is legal but borderline unless already a strong hiker.',
  save: 'Do Masca village, viewpoints, and a short legal walk instead of buying four full gorge tickets.',
  splurge: 'If everyone is trail-ready, book the official descent and a boat/transfer plan; do not improvise this hike.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=Masca+Tenerife+restaurant" target="_blank" rel="noreferrer"><b>Masca village restaurants</b></a> - scenic but limited; bring kid snacks',
    '<a href="https://www.google.com/maps/search/?api=1&query=Santiago+del+Teide+pizza+burger" target="_blank" rel="noreferrer"><b>Santiago del Teide fallback</b></a> - simpler post-road food',
  ],
  alts: [
    '<b>Los Gigantes boat</b> if you want cliff drama without a hard canyon day.',
    '<b>Teno lighthouse / Buenavista</b> if road access and timing line up.',
    '<b>Garachico</b> for a lava-pool town alternative if Masca permits/weather fail.',
  ],
  blogs: [
    { label: 'Official Masca trail booking', href: 'https://www.caminobarrancodemasca.com/en/activities/booking/book-your-visit-to-the-masca-trail/' },
    { label: 'Teno Rural Park', href: 'https://www.webtenerife.co.uk/what-see/nature/rural-parks/teno/' },
  ],
});

const calderaSpot = mkSpot({
  name: 'Caldera de Taburiente: Los Brecitos / La Cumbrecita family version',
  tags: ['calderadetaburiente', 'lapalma', 'losbrecitos'],
  carouselId: 'c-caldera',
  images: calderaImages,
  lat: 28.7197,
  lng: -17.8843,
  cost: 'National park entry is free. Classic Los Brecitos logistics usually mean parking near Barranco de las Angustias and paying an authorized 4x4 taxi uphill; budget about &euro;50-60 family vehicle, uncertain until rechecked.',
  climateLabel: 'Trail',
  climate: '<b>Long rocky day if done classic.</b> The official Los Brecitos descent is about 12.5 km / 6 hr and high difficulty. With an 8-year-old, keep La Cumbrecita / visitor-center / partial-valley options alive.',
  save: 'Use La Cumbrecita viewpoints and a shorter marked walk if taxi timing or kid energy looks bad.',
  splurge: 'Book the Los Brecitos taxi and do the one-way descent only if everyone is ready for a real hiking day.',
  restos: [
    '<a href="https://pizzeria-la-laguna.eatbu.com/?lang=en" target="_blank" rel="noreferrer"><b>Pizzeria La Laguna</b></a> - pizza/pasta fallback near Los Llanos',
    '<a href="https://tallerdepasta.wordpress.com/" target="_blank" rel="noreferrer"><b>Taller de Pasta Fresca</b></a> - fresh pasta in Los Llanos',
  ],
  alts: [
    '<b>Mirador de La Cumbrecita</b> if the full descent is too much; reserve regulated parking during controlled hours.',
    '<b>Visitor center + short barranco walk</b> for a lower-risk Caldera day.',
    '<b>Tazacorte beach sunset</b> after the hike if legs are still functioning.',
  ],
  blogs: [
    { label: 'Caldera official route page', href: 'https://visitlapalma.es/en/hiking/la-palma/caldera-de-taburiente/' },
    { label: 'Caldera planning and rules', href: 'https://www.senderosdelapalma.es/en/nature-la-palma/parque-nacional-de-la-caldera-de-taburiente/planning-your-visit/' },
  ],
});

const tilosSpot = mkSpot({
  name: 'Los Tilos laurisilva: the direct Madeira ecological twin',
  tags: ['lostilos', 'laurisilva', 'lapalma'],
  carouselId: 'c-tilos',
  images: tilosImages,
  lat: 28.7932,
  lng: -17.8044,
  cost: 'Los Tilos visitor area and short walks are free. The family route is Cascada de Los Tilos plus the 2.5 km Espigon Atravesado-style forest walk if open; verify access and parking restrictions before driving.',
  climateLabel: 'Forest',
  climate: '<b>True Macaronesian laurel forest.</b> Expect damp shade, ferns, tunnels of green, and cooler temps than the west side. This is the clearest Madeira ecological comparison on the trip.',
  save: 'Skip the Marcos y Cordero full adventure unless conditions, closures, and 4x4 logistics are very clear.',
  splurge: 'Hire a local guide if you want the Laurisilva ecology explained, not just walked.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=San+Andres+y+Sauces+La+Palma+restaurant+pizza" target="_blank" rel="noreferrer"><b>San Andres y Sauces search</b></a> - lunch before/after the forest',
    '<b>Los Llanos dinner fallback</b> - return to the west base for pizza/pasta if rural menus are thin',
  ],
  alts: [
    '<b>Cubo de la Galga</b> if Los Tilos access is restricted.',
    '<b>San Andres coastal pools</b> for a water add-on after the forest.',
    '<b>Santa Cruz old town</b> if the northeast is socked in or parking is full.',
  ],
  blogs: [
    { label: 'Los Tilos official nature space', href: 'https://visitlapalma.es/en/nature-spaces/la-palma/los-tilos-forest/' },
    { label: 'Los Tilos visitor info', href: 'https://sanandresysauces.es/turismo/punto-de-informacion-de-los-tilos/' },
  ],
});

const volcanesSpot = mkSpot({
  name: 'Ruta de los Volcanes age-appropriate segment',
  tags: ['rutadelosvolcanes', 'lapalma', 'refugioelpilar'],
  carouselId: 'c-volcanes',
  images: volcanesImages,
  lat: 28.6055,
  lng: -17.8386,
  cost: 'Trail is free. The full route creates taxi logistics: Los Canarios to El Pilar taxi guidance is roughly &euro;46+ and the full ridge is too exposed for a default family day.',
  climateLabel: 'Trail',
  climate: '<b>Exposed volcanic ridge.</b> Official full Ruta is about 17.5 km / 5 hr 30 min with 1,207 m unevenness and high difficulty. In June, heat, wind, and no shade matter.',
  save: 'Do Refugio El Pilar out-and-back to the first strong volcanic views / Birigoyo shoulder and turn before it becomes a commitment.',
  splurge: 'If the 13-year-old wants more, split the family briefly or book a guide/transfer for a longer but still shortened segment.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=El+Paso+La+Palma+pizza" target="_blank" rel="noreferrer"><b>El Paso pizza/casual search</b></a> - closest simple dinner zone',
    '<a href="https://pizzeria-la-laguna.eatbu.com/?lang=en" target="_blank" rel="noreferrer"><b>Pizzeria La Laguna</b></a> - known La Palma pizza fallback',
  ],
  alts: [
    '<b>San Antonio / Teneguia volcanoes</b> for a shorter south-end volcano day.',
    '<b>Cumbre Vieja 2021 volcano viewpoints</b> with local rules respected.',
    '<b>Beach/pool recovery</b> if Caldera took more out of the kids than expected.',
  ],
  blogs: [
    { label: 'Ruta de los Volcanes official route', href: 'https://visitlapalma.es/en/hiking/la-palma/ruta-de-los-volcanes-volcano-route/' },
    { label: 'GR-131 stage detail and warnings', href: 'https://www.senderosdelapalma.es/en/footpaths/list-of-footpaths/long-distance-footpaths/gr-131-stage-3/' },
  ],
});

const roqueSpot = mkSpot({
  name: 'Roque de los Muchachos + observatory visitor center',
  tags: ['roquedelosmuchachos', 'lapalma', 'observatory'],
  carouselId: 'c-roque',
  images: roqueImages,
  lat: 28.7541,
  lng: -17.8851,
  cost: 'Visitor center current price signal: &euro;15 standard / &euro;7.50 discount / children up to 12 free, card only. Observatory tours are weather/operations-permitting; recent guide pricing puts a family tour around &euro;75.',
  climateLabel: 'Altitude',
  climate: '<b>About 2,400m.</b> No food/fuel up top, mountain roads, fast-changing weather, and real sun/wind exposure. Pack layers even when Los Llanos is hot.',
  save: 'Visitor center + viewpoints are enough if tour timing is awkward.',
  splurge: 'Book a daylight observatory tour with a Starlight guide if the schedule lines up, then keep dinner simple back down the mountain.',
  restos: [
    '<b>Pack lunch</b> - do not count on summit food',
    '<a href="https://www.google.com/maps/search/?api=1&query=Los+Llanos+La+Palma+burger+pizza" target="_blank" rel="noreferrer"><b>Los Llanos casual dinner search</b></a> - burgers/pizza after the drive down',
  ],
  alts: [
    '<b>Roque viewpoints only</b> if the observatory is unavailable.',
    '<b>Stargazing viewpoint</b> on a clear night if everyone can handle a late drive.',
    '<b>Santa Cruz de La Palma</b> if summit weather is socked in.',
  ],
  blogs: [
    { label: 'Roque visitor center tickets', href: 'https://lapalmasmart-reservas.lapalma.es/medioambiente/centro-de-visitantes-roque-de-los-muchachos' },
    { label: 'IAC observatory visits', href: 'https://www.iac.es/en/observatorios-de-canarias/roque-de-los-muchachos-observatory/visits' },
  ],
});

const santaCruzSpot = mkSpot({
  name: 'Santa Cruz de La Palma + Tazacorte coast',
  tags: ['santacruzdelapalma', 'tazacorte', 'lapalma'],
  carouselId: 'c-santacruz',
  images: santaCruzImages,
  lat: 28.684,
  lng: -17.7645,
  cost: 'Town walk is free. Budget &euro;45-90 for lunch/ice cream and a simple beach or harbor stop before the Tenerife reposition flight.',
  climateLabel: 'Coast',
  climate: '<b>Warm west/east coast reset.</b> Use this as a decompression day before flying back to Tenerife, not as another hard sightseeing day.',
  save: 'Keep the rental until airport drop, do Santa Cruz/harbor casually, and avoid a ferry unless car math clearly beats flights.',
  splurge: 'If flight timing allows, one relaxed waterfront lunch beats another checklist stop.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=Piccolo+Pizza+Pasta+Santa+Cruz+de+La+Palma" target="_blank" rel="noreferrer"><b>Piccolo Pizza &amp; Pasta search</b></a> - Santa Cruz pasta/pizza fallback',
    '<a href="https://www.google.com/maps/search/?api=1&query=chicken+takeaway+Santa+Cruz+de+La+Palma" target="_blank" rel="noreferrer"><b>Chicken/takeout search</b></a> - useful before the short hop',
  ],
  alts: [
    '<b>Puerto de Tazacorte beach</b> if the family wants one last swim.',
    '<b>Los Cancajos</b> if staying near SPC airport would lower stress.',
    '<b>Ferry to Los Cristianos</b> only if schedules and rental-car rules make it cleaner than the TFN/SPC flight.',
  ],
  blogs: [
    { label: 'La Palma destinations airport list', href: 'https://www.aena.es/en/la-palma/airlines-and-destinations/airport-destinations.html' },
    { label: 'Ferryhopper La Palma ferries', href: 'https://www.ferryhopper.com/en/ferries/spain/la-palma' },
  ],
});

const days = [
  day('day0', 'c0', '0', 'Tue &middot; Jun 8', 'Depart Pittsburgh after work', 'Overnight to Tenerife', 'Est. $90 &middot; airport meals', [
    fact('Sleep', 'Overnight flight'),
    fact('Route target', 'PIT -> DUB/LHR/KEF/EWR -> TFS or TFN'),
    fact('Constraint', 'In Pittsburgh all day Jun 24-26; Jun 23 return is allowed'),
  ], 'This early-June plan is chosen because it gets the family home by Tue Jun 22 while still hitting 12 hotel nights.', [], 'Travel day - position toward Tenerife.'),

  day('day1', 'c1', '1', 'Wed &middot; Jun 9', 'Arrive Tenerife, settle north', 'Puerto de la Cruz soft landing', 'Est. $180 &middot; groceries, dinner, local walk', [
    fact('Sleep', 'Puerto de la Cruz / north Tenerife &middot; night 1 of 6'),
    fact('Car', 'Pick up Tenerife rental at TFS or TFN'),
    fact('Plan', 'Check-in, groceries, early bedtime'),
  ], 'Puerto de la Cruz is the first-choice base for Teide, black sand, restaurants, and cost. Use La Laguna/Santa Cruz instead if the flight timing or Anaga/Teresitas access matters more.', [beachSpot]),

  day('day2', 'c1', '2', 'Thu &middot; Jun 10', 'Teide National Park', 'Spain highest peak + real trail segment', 'Est. $290 &middot; cable car, snacks, dinner', [
    fact('Sleep', 'Puerto de la Cruz / north Tenerife &middot; night 2 of 6'),
    fact('Drive', '~1h20-1h45 each way depending base'),
    fact('Anchor', 'Cable car + Roques de Garcia / lower trail'),
  ], 'This is the volcano-epic opener: cable car if wind allows, but a real on-foot lava landscape segment either way.', [teideSpot]),

  day('day3', 'c1', '3', 'Fri &middot; Jun 11', 'Anaga Laurisilva', 'Madeira-style laurel forest on Tenerife', 'Est. $185 &middot; lunch, fuel, simple dinner', [
    fact('Sleep', 'Puerto de la Cruz / north Tenerife &middot; night 3 of 6'),
    fact('Drive', '~30-60 min to Cruz del Carmen / Anaga'),
    fact('Mode', 'Cloud forest + La Laguna dinner'),
  ], 'This is the first explicit Madeira ecological-twin day: Macaronesian Laurisilva without adding Madeira flight friction.', [anagaSpot]),

  day('day4', 'c1', '4', 'Sat &middot; Jun 12', 'Las Teresitas + black-sand context', 'Calm family water, then volcanic coast if wanted', 'Est. $210 &middot; beach shade, snacks, dinner', [
    fact('Sleep', 'Puerto de la Cruz / north Tenerife &middot; night 4 of 6'),
    fact('Beach truth', 'Las Teresitas is golden/pale sand, not black sand'),
    fact('Black sand', 'Use Las Gaviotas, Playa Jardin, Bollullo, or Benijo as add-ons'),
  ], 'Las Teresitas stays because it is the family-friendly swim day. The black-sand box is satisfied separately, not by pretending Teresitas is black sand.', [beachSpot]),

  day('day5', 'c1', '5', 'Sun &middot; Jun 13', 'Masca / Teno decision day', 'Gorge drama without forcing a risky kid hike', 'Est. $220-$430 &middot; depends on gorge tickets/boat', [
    fact('Sleep', 'Puerto de la Cruz / north Tenerife &middot; night 5 of 6'),
    fact('Drive', '~1h30-2h each way plus mountain-road time'),
    fact('Rule', 'Full Masca gorge only if booked and kid-ready'),
  ], 'Masca is spectacular, but the official gorge is high difficulty. The default family plan is village, viewpoints, and a short legal walk; full descent is a conscious upgrade.', [mascaSpot]),

  day('day6', 'c1', '6', 'Mon &middot; Jun 14', 'North-coast black sand + Puerto de la Cruz', 'Recovery day before island hop', 'Est. $210 &middot; beach, garden/town, dinner', [
    fact('Sleep', 'Puerto de la Cruz / north Tenerife &middot; night 6 of 6'),
    fact('Plan', 'Playa Jardin / Bollullo / Benijo choice'),
    fact('Pack', 'Prep for TFN -> SPC hop next morning'),
  ], 'This gives the true black-sand beach day and lowers the pace before the La Palma hiking block.', [beachSpot]),

  day('day7', 'c0', '7', 'Tue &middot; Jun 15', 'Fly Tenerife -> La Palma', '25-45 minute island hop, new car, west base', 'Est. $260 &middot; inter-island flights, meals', [
    fact('Sleep', 'Los Llanos / El Paso / Tazacorte &middot; night 1 of 5'),
    fact('Flight', 'TFN -> SPC on Binter/Canaryfly-style frequency'),
    fact('Car', 'Drop Tenerife car; pick up La Palma car'),
  ], 'Use separate rentals. Ferrying one rental car is only worth revisiting if written permission and ferry math beat two simple airport rentals.', [], 'Travel day - short inter-island hop from Tenerife North to La Palma.'),

  day('day8', 'c2', '8', 'Wed &middot; Jun 16', 'Caldera de Taburiente', 'Big canyon day, scaled to the kids', 'Est. $250-$320 &middot; taxi, picnic, dinner', [
    fact('Sleep', 'Los Llanos / El Paso / Tazacorte &middot; night 2 of 5'),
    fact('Plan A', 'Los Brecitos taxi + partial/classic descent if kid-ready'),
    fact('Plan B', 'La Cumbrecita / visitor center shorter Caldera version'),
  ], 'Caldera is the La Palma anchor, but the page treats the classic route honestly: wonderful, long, rocky, and not mandatory for an 8-year-old.', [calderaSpot]),

  day('day9', 'c2', '9', 'Thu &middot; Jun 17', 'Los Tilos Laurisilva', 'The direct Madeira ecological twin', 'Est. $190 &middot; forest, lunch, easy dinner', [
    fact('Sleep', 'Los Llanos / El Paso / Tazacorte &middot; night 3 of 5'),
    fact('Drive', '~60-80 min each way from west base'),
    fact('Mode', 'Waterfall + short laurel-forest route'),
  ], 'This is the clearest reason to keep La Palma instead of replacing it: Los Tilos is exactly the Macaronesian laurel-forest parallel the Madeira option is chasing.', [tilosSpot]),

  day('day10', 'c2', '10', 'Fri &middot; Jun 18', 'Ruta de los Volcanes segment', 'Juneteenth observed: no-PTO volcano ridge', 'Est. $190-$280 &middot; fuel, picnic, simple dinner', [
    fact('Sleep', 'Los Llanos / El Paso / Tazacorte &middot; night 4 of 5'),
    fact('Holiday', 'Juneteenth observed for many employers'),
    fact('Plan', 'Refugio El Pilar out-and-back, not the full 17.5 km ridge'),
  ], 'The full Ruta is too much as a default family day. The point is to touch the volcanic spine, get the views, and turn around before it becomes a forced march.', [volcanesSpot]),

  day('day11', 'c2', '11', 'Sat &middot; Jun 19', 'Roque de los Muchachos', 'High observatory ridge + stargazing island identity', 'Est. $240-$360 &middot; visitor center/tour, packed food, dinner', [
    fact('Sleep', 'Los Llanos / El Paso / Tazacorte &middot; night 5 of 5'),
    fact('Drive', '~1h15-1h45 each way depending road/base'),
    fact('Rule', 'No food/fuel up top; weather can cancel tours'),
  ], 'Roque makes the La Palma half feel distinct: observatories, high cloud decks, and a sky-island road day instead of another beach.', [roqueSpot]),

  day('day12', 'c3', '12', 'Sun &middot; Jun 20', 'La Palma coast, then reposition to Tenerife', 'Protect the homebound flight', 'Est. $280 &middot; meals, hop, airport hotel', [
    fact('Sleep', 'La Laguna / TFN or TFS airport buffer &middot; 1 night'),
    fact('Morning', 'Santa Cruz / Tazacorte easy coast'),
    fact('Flight', 'SPC -> TFN/TFS, then overnight Tenerife'),
  ], 'This is the key routing decision: do not force a fragile SPC-Europe-PIT return. Reposition to Tenerife and use the larger Tenerife flight network home.', [santaCruzSpot]),

  day('day13', 'c0', '13', 'Mon-Tue &middot; Jun 21-22', 'Fly Tenerife -> Pittsburgh', 'Home before blackout', 'Est. $110 &middot; airport meals', [
    fact('Sleep', 'Home Tue Jun 22'),
    fact('Route target', 'TFS/TFN -> DUB/LHR/KEF/Europe hub -> PIT'),
    fact('Schedule', 'Home by Tue Jun 22'),
  ], 'The trip ends before the preferred Jun 23 return date. If a late Monday transatlantic arrives Tuesday, the required full days in Pittsburgh on Jun 24-26 remain protected.', [], 'Travel day - leave Tenerife Monday Jun 21, arrive Pittsburgh by Tuesday Jun 22.'),
];

const previewImages = [
  [unsplash('1768155210926-ce5e6116574c'), 'Day 2 &middot; Thu Jun 10', 'Teide volcanic high country', 'Spain highest peak gives the trip its first big volcanic epic.'],
  [unsplash('1628442222245-d40cfce76fd1'), 'Day 3 &middot; Fri Jun 11', 'Anaga Laurisilva', 'The Tenerife side of the Madeira-style cloud forest comparison.'],
  [pexels('31466226'), 'Day 4 &middot; Sat Jun 12', 'Las Teresitas', 'The calm family beach day, explicitly not the black-sand stop.'],
  [unsplash('1691397553539-c7c573138747'), 'Day 5 &middot; Sun Jun 13', 'Masca', 'Gorge drama scaled carefully for kids.'],
  [unsplash('1742387436287-26b5200a5540'), 'Day 8 &middot; Wed Jun 16', 'Caldera de Taburiente', 'La Palma starts with the island canyon.'],
  [unsplash('1561298233-3b0dadf82094'), 'Day 9 &middot; Thu Jun 17', 'Los Tilos', 'The direct Macaronesian Laurisilva twin.'],
  [unsplash('1622315513561-3700c51ac236'), 'Day 10 &middot; Fri Jun 18', 'Ruta de los Volcanes', 'A short ridge segment, not the full exposed route.'],
  [unsplash('1742472194018-44f79dee11ff'), 'Day 11 &middot; Sat Jun 19', 'Roque de los Muchachos', 'Observatory country above the clouds.'],
];

const oldPart0 = template.parts[0].html;
const afterBody = oldPart0.indexOf('</head><body>') + '</head><body>'.length;
const navStart = oldPart0.indexOf('<nav class="site-nav"');
const overviewStart = oldPart0.indexOf('<section id="overview"');
const headBody = oldPart0.slice(0, afterBody)
  .replace(/<title>.*?<\/title>/, '<title>Canary Islands &middot; Tenerife to La Palma &mdash; June 2027</title>');

const navToMain = oldPart0.slice(navStart, overviewStart)
  .replace('      <a href="#photo-guide">Photo Guide</a>\n      <a href="#food-guide">Food Guide</a>\n', '');

const preview = `<section class="preview">
  <div class="pv-pane">
    <span class="pv-kicker">Family Trip &middot; Jun 8&ndash;22, 2027</span>
    <h1>Canary Islands<span>Tenerife to La Palma</span></h1>
    <p class="pv-lead">Twelve hotel nights for the Madeira ecological-twin idea with easier air logistics: Tenerife's major flight network, Anaga and Los Tilos laurel forests, Teide and La Palma volcano days, plus enough beach recovery to keep the kids engaged.</p>
    <div class="pv-stats"><div><b>12</b><span>Hotel nights</span></div><div><b>3</b><span>Sleep bases</span></div><div><b>20</b><span>Stops mapped</span></div><div><b>$12.4k</b><span>priced target</span></div></div>
    <div class="pv-split" role="img" aria-label="Trip mix: about 35% water, 20% towns and food, 45% nature">
      <div class="seg water" style="flex:35"><b>35%</b><span>Water</span></div>
      <div class="seg town" style="flex:20"><b>20%</b><span>Towns &amp; food</span></div>
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
      <h2>Madeira's ecological idea, easier Canary Islands logistics</h2>
      <p>This is the <b>Macaronesian Laurisilva + volcano epic</b> option: Tenerife for Teide, Anaga, Masca, and beach recovery; La Palma for Caldera de Taburiente, Los Tilos, Ruta de los Volcanes, and Roque de los Muchachos. The route gets home before the preferred Jun 23 return date and protects the required full days in Pittsburgh on <b>Jun 24-26</b>.</p>
    </div>
    <div class="overview">
      <div class="ocard"><p class="eyebrow">Route</p><h4>PIT -> Tenerife -> La Palma -> Tenerife -> PIT</h4><p><b>6 nights Tenerife</b>, <b>5 nights La Palma</b>, then <b>1 Tenerife airport buffer</b>. Home by Tue Jun 22.</p></div>
      <div class="ocard"><p class="eyebrow">Why it beats Madeira on flights</p><h4>Tenerife is a major hub; Funchal is a funnel</h4><p>Tenerife South has broad direct European service and Tenerife North has frequent inter-island hops. Madeira/Funchal is excellent, but US routings more often funnel through Lisbon and its weather-sensitive airport.</p></div>
      <div class="ocard"><p class="eyebrow">Budget</p><h4>Priced target: ~$12,420; high case ~$14,690</h4><p>Under the $15k hard cap if economy airfare stays near $1,000-$1,150 per person and lodging stays apartment-first.</p></div>
    </div>
  </section>

  <section id="why-this-trip" class="divider">
    <div class="section-label">
      <p class="eyebrow">Why This Trip</p>
      <h2>The ecological twin to Madeira, with better connection odds</h2>
      <p>The Canaries keep the island-climate weirdness that makes Madeira compelling: laurel forest, cliffs, volcanoes, high ridges, black sand, and ocean villages. The difference is air network depth.</p>
    </div>
    <div class="plan-grid">
      ${card('The Madeira comparison', `<p>Madeira wins on compactness and famous levadas. The Canaries win on <b>connectivity and island variety</b>: Tenerife has the long-haul-friendly airport network, while La Palma supplies the quieter ecological/volcanic payoff.</p>`)}
      ${card('The family fit', `<p>The 13-year-old gets real mountain and volcano days. The 8-year-old gets protected beach time, shorter trail options, pizza/pasta fallbacks, and multiple days where the plan can be scaled down without ruining the route.</p>`)}
      ${card('Why not Gran Canaria by default', `<p>Gran Canaria is the logistics backup if La Palma home routing becomes ugly. It has a larger airport and more resort infrastructure, but it does not beat La Palma for Caldera, Los Tilos, Roque, or the volcanic-ridge identity.</p>`)}
    </div>
  </section>

  <section id="stays" class="divider">
    <div class="section-label">
      <p class="eyebrow">Where We Stay</p>
      <h2>Three sleeps, but only two real bases</h2>
      <p>Tenerife north keeps the nature days efficient; La Palma west keeps Caldera and volcano access realistic. The final Tenerife night is flight insurance, not a vacation base.</p>
    </div>
    <div class="plan-grid">
      ${card('Tenerife north &middot; 6 nights', `${prow('Target', 'Puerto de la Cruz apartment/aparthotel first; La Laguna / Santa Cruz if prioritizing TFN &middot; $150-$250/night')}${prow('Why', 'Puerto balances Teide, black sand, restaurants, and lower lodging cost; La Laguna wins for Anaga/TFN')}${prow('Tradeoff', 'Las Teresitas is longer from Puerto; Masca is a long day from any north base')}`)}
      ${card('La Palma west &middot; 5 nights', `${prow('Target', 'Los Llanos / El Paso / Tazacorte apartment &middot; $135-$230/night')}${prow('Why', 'Best for Caldera, Ruta de los Volcanes, Tazacorte, restaurants')}${prow('Tradeoff', 'Los Tilos and Roque are longer mountain-road days')}`)}
      ${card('Tenerife airport buffer &middot; 1 night', `${prow('Target', 'La Laguna / TFN or TFS airport hotel &middot; $150-$230')}${prow('Why', 'Protects the long-haul homebound from La Palma routing fragility')}${prow('Rule', 'Use this before swapping La Palma for Gran Canaria')}`)}
    </div>
  </section>

  <section id="calendar" class="divider">
    <div class="section-label">
      <p class="eyebrow">Calendar</p>
      <h2>Jun 8-22 fits the window and protects the Pittsburgh dates</h2>
      <p>Dates are inside the Jun 6-Aug 15, 2027 planning window, return before the preferred Jun 23 date, and keep the family in Pittsburgh all day Jun 24-26.</p>
    </div>
    ${table(['Date', 'Night', 'Base', 'Purpose'], [
      ['Tue Jun 8', 'Red-eye', 'PIT -> Tenerife', 'After-work departure'],
      ['Wed Jun 9-Mon Jun 14', '6', 'Tenerife north', 'Teide, Anaga, Masca, beaches'],
      ['Tue Jun 15-Sat Jun 19', '5', 'La Palma west', 'Caldera, Los Tilos, Ruta segment, Roque'],
      ['Sun Jun 20', '1', 'Tenerife airport / La Laguna', 'Reposition buffer'],
      ['Mon-Tue Jun 21-22', 'Home', 'Tenerife -> PIT', 'Arrive before blackout'],
    ])}
  </section>`;

const mapAirGround = `<section id="map" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Whole Trip, Mapped</p>
      <h2>Every stop on one map</h2>
      <p>Open <b>Map layers</b> to show or hide flights, lodging, hikes, beaches, towns, viewpoints, and restaurants. Tap a region to fly there, then click any pin for Google Maps.</p>
    </div>
    <div class="tripmap-wrap">
      <div class="mapbtns">
        <button data-region="tenerife"><span class="sw" style="background:#1f6f78"></span>Tenerife</button><button data-region="lapalma"><span class="sw" style="background:#3f7d4e"></span>La Palma</button><button data-region="transfer"><span class="sw" style="background:#c25a3a"></span>Flights / buffer</button><button data-region="all">Whole trip</button>
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
      <h2>Tenerife is the hub; La Palma is the nature add-on</h2>
      <p>Research status: 2027 schedules are not fully reliable yet, so current 2026/live route and fare signals are used as planning proxies. The route should be re-quoted as protected tickets once inventory opens.</p>
    </div>
    <div class="plan-grid">
      ${card('PIT -> Tenerife', `${prow('Best entry', 'TFS if the Europe connection is cleaner; TFN if pricing/schedule wins')}${prow('Likely corridors', 'DUB, LHR, KEF, MAD, or another European hub')}${prow('Family airfare gate', '$4,000-$5,200 target; high case $5,900')}${prow('Why Tenerife', 'TFS has far broader direct European service than Funchal or La Palma')}`)}
      ${card('Tenerife -> La Palma', `${prow('Preferred', 'TFN -> SPC inter-island flight')}${prow('Flight time', 'About 30-45 minutes depending source/schedule')}${prow('Frequency', 'Frequent Binter/Canaryfly-style service; much easier than a long ferry day')}${prow('Family budget', '$520-$720 for two inter-island hops with bag/flex buffer')}`)}
      ${card('Home strategy', `${prow('Recommended', 'SPC -> TFN/TFS on Jun 20, overnight Tenerife, then long-haul home Jun 21')}${prow('Avoid', 'Relying on SPC -> Europe -> PIT unless the connection is clean and protected')}${prow('Gran Canaria swap', 'Only if La Palma creates an extra overnight plus ugly homebound layovers')}`)}
      ${card('Explicit Madeira comparison', `${prow('Canaries', 'Tenerife = major direct-Europe hub + frequent inter-island hops')}${prow('Madeira', 'FNC is excellent but smaller; US itineraries often concentrate through Lisbon')}${prow('Practical result', 'More ways to recover from schedule changes, and no need to make Funchal the only air gateway')}`)}
    </div>
  </section>

  <section id="getting-around" class="divider">
    <div class="section-label">
      <p class="eyebrow">Getting Around</p>
      <h2>Rent cars separately; fly the inter-island hop</h2>
      <p>Do not ferry one rental car unless the agency gives written permission and the fare math beats two airport rentals. Separate rentals keep the route cleaner.</p>
    </div>
    <div class="plan-grid">
      ${card('Tenerife car', `${prow('Pickup/drop', 'TFS or TFN Jun 9 -> TFN Jun 15')}${prow('Budget', '$310-$470 plus fuel/parking')}${prow('Why', 'Teide, Anaga, Masca, north beaches, and flexible restaurants')}`)}
      ${card('La Palma car', `${prow('Pickup/drop', 'SPC Jun 15 -> SPC Jun 20')}${prow('Budget', '$240-$390 plus fuel')}${prow('Why', 'Caldera, Los Tilos, El Pilar, Roque, Tazacorte')}`)}
      ${card('Ferry reality check', `${prow('Los Cristianos -> La Palma', 'Fast ferry about 2h30, vehicle possible')}${prow('Why not default', 'Family + car can approach or exceed flight + separate rental math')}${prow('Use ferry if', 'Schedules align, rental permission is explicit, and the family wants a boat crossing')}`)}
    </div>
  </section>`;

const healthTiming = `<section id="health-check" class="divider">
    <div class="section-label">
      <p class="eyebrow">Plan Health-Check</p>
      <h2>What to lock, watch, and expect</h2>
      <p>Current research refreshed July 2026 for a June 2027 trip. Kids assumed 13 and 8.</p>
    </div>
    <div class="hc-grid">
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The concept is coherent</h4><p>Tenerife and La Palma are a true Madeira-twin pair: Laurisilva, volcanic national parks, black sand, high ridges, and Atlantic island towns, but with a stronger Tenerife air gateway.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The Pittsburgh dates are protected</h4><p>Depart Tue Jun 8, fly home Mon Jun 21, and arrive by Tue Jun 22. That is ahead of the preferred Jun 23 return and the required full days in Pittsburgh on Jun 24-26.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>La Palma hikes must be scaled</h4><p>Caldera and Ruta de los Volcanes are serious if done full-length. The page uses partial/family versions by default, with the full routes as conscious upgrades.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Flights are the budget gate</h4><p>The priced target assumes transatlantic fares near $1,000-$1,150 per person. If the protected family fare climbs above ~$5.9k, this becomes a cap-stress trip.</p></div>
      <div class="hc actnow"><span class="hc-tag">Act now later</span><h4>Bookable inventory timing matters</h4><p>Use July-August 2026 to start tracking, not blindly buying. Buy when protected routing, baggage, seats, and total family price are all inside the gate.</p></div>
      <div class="hc good"><span class="hc-tag">Fixed</span><h4>Las Teresitas corrected</h4><p>Las Teresitas is the calm family beach, but it is golden/pale sand. The true black-sand days are Playa Jardin, Bollullo, Benijo, Las Gaviotas, or La Palma/Tazacorte add-ons.</p></div>
    </div>
  </section>

  <section id="timing" class="divider">
    <div class="section-label">
      <p class="eyebrow">Best Time</p>
      <h2>Why early June wins for this constraint set</h2>
      <p>It gives 12 hotel nights, uses Juneteenth observed as a no-PTO active day if the employer observes it, and returns before the blackout.</p>
    </div>
    ${table(['Window', 'Nights', 'PTO', 'Blackout fit', 'Verdict'], [
      ['Jun 8-22', '12 hotel nights', '8-9 days', 'Home before Jun 23', '<b>Use this</b>'],
      ['Jun 15-29', '12+', '8-9 days', '<b>Invalid</b> - away during Jun 24-26', 'Reject'],
      ['Jun 27-Jul 10', '12+', '9 days', 'Valid', 'Backup if early June flights fail'],
      ['Aug 1-14', '12+', '9-10 days', 'Valid', 'Hotter, pricier, more peak-season pressure'],
    ])}
    <div class="verdict-box" style="border-left-color:var(--c3);margin-top:18px"><h4>PTO math</h4><p>If Friday Jun 18 is observed for Juneteenth, likely PTO is Jun 9-11, Jun 14-17, and Jun 21-22 if both travel/recovery days are counted: <b>8-9 PTO days</b> depending employer policy and whether Tue Jun 22 is a recovery day. The calendar rule allows a Jun 23 return and requires full days in Pittsburgh Jun 24-26; this plan is home a day earlier.</p></div>
  </section>`;

const budgetTips = `<section id="budget" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Money</p>
      <h2>Budget, savers &amp; splurges</h2>
      <p>Real priced planning target using 2026 route/fare/lodging signals because June 2027 inventory is not fully live. USD, family of four.</p>
    </div>
    ${table(['Line item', 'Target case', 'High case'], [
      ['PIT -> Tenerife round-trip/open-jaw airfare', '$4,400', '$5,900'],
      ['Tenerife -> La Palma -> Tenerife inter-island flights', '$620', '$820'],
      ['Lodging: Tenerife 6 nights', '$1,320', '$1,650'],
      ['Lodging: La Palma 5 nights', '$950', '$1,250'],
      ['Lodging: Tenerife airport buffer 1 night', '$180', '$260'],
      ['Cars, fuel, parking, transfers', '$1,130', '$1,520'],
      ['Food and groceries, 13 travel days', '$2,450', '$2,950'],
      ['Activities, tickets, taxis, beach shade', '$870', '$1,240'],
      ['Insurance, fees, misc buffer', '$500', '$1,100'],
      ['<b>Grand total</b>', '<b>$12,420</b>', '<b>$14,690</b>'],
    ])}
    <div class="twocol">
      <div class="listcard save-list"><h4>Save money</h4><ul><li>Use apartments with kitchens and washers in both bases.</li><li>Fly TFN-SPC instead of ferrying a rental car unless the written-permission math wins.</li><li>Keep Masca full-gorge hiking optional; village/viewpoint day costs far less.</li><li>Choose one La Palma paid guide/tour, not every possible astronomy/hiking upgrade.</li><li>Buy Teide cable car direct and pack mountain lunches.</li></ul></div>
      <div class="listcard splurge-list"><h4>Worth the splurge</h4><ul><li>Teide cable car if wind and tickets cooperate.</li><li>Masca official gorge only if everyone is trail-ready.</li><li>Los Brecitos 4x4 taxi if doing the classic Caldera descent.</li><li>Roque observatory tour if schedule/weather allows.</li><li>One real shade/chair beach day for sun management.</li></ul></div>
    </div>
  </section>

  <section id="totals" class="divider">
    <div class="section-label">
      <p class="eyebrow">Bottom Line</p>
      <h2>Total trip cost</h2>
      <p>This route can hit the $12k target only with disciplined airfare and apartment choices. It still has a credible high case below the $15k hard cap.</p>
    </div>
    ${table(['Category', 'Estimate'], [
      ['Flights and inter-island hops', '$5,020 target / $6,720 high'],
      ['Lodging, 12 hotel nights', '$2,450 target / $3,160 high'],
      ['Cars, fuel, parking, transfers', '$1,130 target / $1,520 high'],
      ['Food, groceries, activities, tickets', '$3,320 target / $4,190 high'],
      ['Insurance, fees, buffer', '$500 target / $1,100 high'],
      ['<b>Grand total - family of 4</b>', '<b>$12,420 target / $14,690 high</b>'],
    ])}
    <p class="rate-note">Per-day itinerary costs cover food + activities only. Lodging, flights, rental cars, and docs sit in the totals above, not the daily numbers.</p>
  </section>

  <section id="tips" class="divider">
    <div class="section-label">
      <p class="eyebrow">Travel Tips</p>
      <h2>The stuff nobody tells you</h2>
      <p>Operational rules that keep this from becoming a beautiful but fragile route.</p>
    </div>
    <div class="tips-order">
      <p class="mini-h">Book in roughly this order</p>
      <ol>
        <li>Protected PIT-Tenerife long-haul routing<span> &middot; start tracking when schedules load</span></li>
        <li>Refundable Tenerife and La Palma apartments<span> &middot; parking, AC, washer, real beds</span></li>
        <li>Two separate rental cars<span> &middot; automatic if needed; do not ferry without written permission</span></li>
        <li>Teide cable car and Masca decision<span> &middot; book only once weather/fitness plan is honest</span></li>
        <li>La Palma Caldera/Roque logistics<span> &middot; taxi, parking, visitor center, tour windows</span></li>
      </ol>
    </div>
    <div class="tips-grid">
      <div class="tipcard"><h4>Flights</h4><p class="sub">Use Tenerife as the air machine</p><ul><li><b>Prefer TFS for long-haul Europe connections</b> if fare/schedule is better.</li><li><b>Use TFN for La Palma.</b> It is the practical inter-island airport.</li><li><b>Reposition before flying home.</b> SPC homebound is the fragile part.</li></ul></div>
      <div class="tipcard t2"><h4>Hiking</h4><p class="sub">Scale the adult trails</p><ul><li><b>Masca, Caldera, and Ruta are not casual kid walks at full length.</b></li><li><b>Carry layers and sun protection</b> for Teide/Roque altitude.</li><li><b>Turn around early</b> when the day is still fun.</li></ul></div>
      <div class="tipcard t3"><h4>Food</h4><p class="sub">Keep easy dinners close</p><ul><li><b>Puerto de la Cruz, La Laguna, and Los Llanos are the safe dinner bases.</b></li><li><b>Pack lunches for high-mountain days</b>; summit services are thin.</li><li><b>Use pizza/pasta fallbacks without guilt</b> after hard hikes.</li></ul></div>
      <div class="tipcard t4"><h4>Beach expectations</h4><p class="sub">Atlantic, not Mediterranean</p><ul><li><b>Water is swimmable but not bath-warm.</b></li><li><b>Las Teresitas is the calm family beach.</b></li><li><b>Black-sand beaches can be rougher.</b> Treat Benijo/Bollullo as scenic unless conditions are clearly safe.</li></ul></div>
    </div>
  </section>`;

const socialBalanceStatus = `<section id="social" class="divider">
    <div class="section-label">
      <p class="eyebrow">What People Are Saying</p>
      <h2>Research signals to keep in mind</h2>
      <p>Official pages and current route/fare sources point to the same conclusion: La Palma is the better nature island, Tenerife is the better air gateway.</p>
    </div>
    <div class="plan-grid">
      ${card('Connectivity signal', `<p>Tenerife South is the big international gateway, Tenerife North is the inter-island workhorse, and La Palma is thin but reachable. That is why the route enters and exits through Tenerife.</p>`)}
      ${card('Nature signal', `<p>Los Tilos, Caldera, Ruta de los Volcanes, and Roque de los Muchachos are the exact reasons not to replace La Palma with an easier resort island unless flight routing forces it.</p>`)}
      ${card('Family signal', `<p>The best version is not the hardest version. Use family segments of big trails, protect beach recovery, and avoid stacking three high-effort hikes in a row.</p>`)}
    </div>
  </section>

  <section id="balance" class="divider">
    <div class="section-label">
      <p class="eyebrow">Trip Balance</p>
      <h2>What the days add up to</h2>
      <p>This is nature-forward but not nature-only. Beach and town days are what make the hiking sustainable for the kids.</p>
    </div>
    <div class="bar"><i style="width:35%;background:#1f6f78"></i><i style="width:20%;background:#c25a3a"></i><i style="width:45%;background:#3f7d4e"></i></div>
    <div class="balance">
      <div class="bcard k1"><div class="pct">35%</div><h4>Water &middot; Beaches &middot; Coast</h4><p>Las Teresitas, Las Gaviotas / Playa Jardin / Bollullo / Benijo, Tazacorte or Santa Cruz coast, and low-key pool/beach recovery.</p></div>
      <div class="bcard k2"><div class="pct">20%</div><h4>Towns &middot; Food &middot; Reset</h4><p>Puerto de la Cruz, La Laguna, Santa Cruz de Tenerife, Santa Cruz de La Palma, Los Llanos, groceries, pizza/pasta fallbacks, and airport buffer time.</p></div>
      <div class="bcard k3"><div class="pct">45%</div><h4>Laurisilva &middot; Volcanoes &middot; High Ridges</h4><p>Teide, Anaga, Masca, Caldera, Los Tilos, Ruta de los Volcanes, and Roque de los Muchachos.</p></div>
    </div>
  </section>

  <section id="status" class="divider">
    <div class="section-label"><p class="eyebrow">Settled &amp; Open</p><h2>What is decided, what still needs a call</h2><p>The route is opinionated, but 2027 schedules and lodging prices still need live re-quotes before booking.</p></div>
    <div class="status"><div class="scol settled"><h4>Settled</h4>
      <div class="row"><b>Slug</b><span>canary-islands</span></div>
      <div class="row"><b>Route</b><span>Tenerife 6 nights -> La Palma 5 nights -> Tenerife airport buffer 1 night.</span></div>
      <div class="row"><b>Dates</b><span>Depart Tue Jun 8, 2027; arrive home by Tue Jun 22, ahead of the preferred Jun 23 return and required Pittsburgh days Jun 24-26.</span></div>
      <div class="row"><b>La Palma decision</b><span>Keep it for Caldera, Los Tilos, Ruta de los Volcanes, and Roque; use Tenerife reposition instead of defaulting to Gran Canaria.</span></div>
      <div class="row"><b>Budget verdict</b><span>$12,420 target / $14,690 high case, below the $15k hard cap if airfare and lodging gates hold.</span></div>
    </div><div class="scol open"><h4>Open</h4>
      <div class="row"><b>Exact airports</b><span>TFS vs TFN inbound depends on the best protected Europe connection.</span></div>
      <div class="row"><b>Homebound routing</b><span>If SPC-Europe-PIT is clean and protected, it can replace the Tenerife buffer; otherwise keep the buffer.</span></div>
      <div class="row"><b>Gran Canaria backup</b><span>Swap only if La Palma requires an extra overnight plus bad layovers or the family wants easier resort infrastructure over nature uniqueness.</span></div>
      <div class="row"><b>Trail intensity</b><span>Masca, Caldera, and Ruta de los Volcanes final versions depend on kid fitness and current access rules.</span></div>
    </div></div>
  </section>`;

const todo = {
  labelHtml: `
      <p class="eyebrow">Pre-Departure To-Do</p>
      <h2>What to book before leaving</h2>
      <p>Exact planning sequence for the Jun 8-22, 2027 Canary Islands route. Inventory opens before prices necessarily become attractive, so tracking and buying are separate decisions.</p>
    `,
  blocks: [
    {
      when: 'Jul-Aug 2026',
      tone: 'hot',
      title: 'Flight inventory opens: start tracking, do not auto-buy',
      note: 'Use these dates to map options and set fare alerts; buy only when the protected routing and total price work.',
      items: [
        '<b>Track PIT -> Tenerife and Tenerife -> PIT as family-of-4 totals.</b> Watch DUB, LHR, KEF, MAD, and other clean Europe hubs.',
        '<b>Set the airfare gate.</b> Target ~$4.4k family, high case ~$5.9k including seats/bags.',
        '<b>Check whether a one-ticket open-jaw can include the inter-island hop.</b> If not, keep generous buffers and buy inter-island separately.',
      ],
    },
    {
      when: 'By Sep 2026',
      title: 'Hold refundable lodging',
      items: [
        '<b>Tenerife north:</b> 6 nights Puerto de la Cruz apartment/aparthotel first; La Laguna / Santa Cruz if flight or Anaga access wins.',
        '<b>La Palma west:</b> 5 nights Los Llanos / El Paso / Tazacorte apartment with washer and parking.',
        '<b>Tenerife buffer:</b> 1 refundable airport/La Laguna night for Jun 20.',
      ],
    },
    {
      when: 'Winter 2026-27',
      tone: 'watch',
      title: 'Cars, documents, and hike logistics',
      items: [
        '<b>Reserve separate rental cars</b> for Tenerife and La Palma; automatic if needed.',
        '<b>Check passports, ETIAS status, travel insurance, and IDPs.</b>',
        '<b>Track Teide, Masca, Caldera, Los Tilos, Ruta, and Roque access updates.</b>',
      ],
    },
    {
      when: '60-30 days out',
      title: 'Turn the trail plan into bookings',
      items: [
        '<b>Book Teide cable car</b> once the mountain day is stable.',
        '<b>Decide Masca full trail vs viewpoint version</b> honestly based on kid fitness.',
        '<b>Reserve Caldera taxi/parking and Roque visitor center or observatory tour</b> if choosing those upgrades.',
      ],
    },
    {
      when: 'Final 2 weeks',
      tone: 'done',
      title: 'Operational checks',
      items: [
        '<b>Download offline maps</b> for Tenerife, La Palma, trailheads, and airport areas.',
        '<b>Reconfirm inter-island flight times, car counters, lodging parking, and mountain weather.</b>',
        '<b>Pack layers, sun gear, trail shoes, swimsuits, snacks, motion-sickness meds, and printed confirmations.</b>',
      ],
    },
  ],
  callout: '<b>Do not forget:</b> the plan works because Tenerife absorbs the air-routing complexity. Keep the La Palma nature block, but return to Tenerife before the long-haul unless SPC routing is genuinely clean.',
};

const scorecard = {
  displayName: 'Canary Islands',
  blurb: 'Madeira twin, easier flights',
  axes: {
    budget: 1,
    weather: 4,
    swim: 3,
    variety: 5,
    ease: 2,
    food: 3,
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
    floorUsd: 12420,
    ceilUsd: 16690,
    targetUsd: 12000,
    capUsd: 15000,
  },
  pto: {
    days: 8,
    nights: 12,
  },
  facets: {
    continent: 'europe',
    maxConnections: 3,
    swimTempF: [70, 72],
    noPassport: false,
    singleTicket: true,
    hasSwim: true,
  },
  totalBaked: 31,
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
  countries: ['spain'],
  packingTags: ['hiking', 'beach', 'heat', 'rain'],
  slug: 'canary-islands',
  lang: 'en',
  title: 'Canary Islands · Tenerife to La Palma — June 2027',
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  overrides: {
    packing: [
      '<b>Altitude layers:</b> fleece or light puffer for Teide and Roque even in June.',
      '<b>Real hiking shoes:</b> volcanic rock is rough on casual sneakers.',
      '<b>Sun management:</b> UPF shirts, hats, sunglasses, sunscreen, and electrolyte tabs.',
      '<b>Offline trail maps:</b> download Teide, Anaga, Caldera, Los Tilos, and El Pilar areas.',
      '<b>Car kit:</b> nausea meds, snacks, spare water, and a light towel for black-sand beaches.',
    ],
  },
  itinerary: {
    className: 'divider',
    labelHtml: `
      <p class="eyebrow">The Itinerary</p>
      <h2>Day by day</h2>
      <p>Swipe each carousel for photos. Every stop carries its cost, a money-saving tip, a splurge, picky-kid restaurants, backup / if-time ideas, blog links, and a map. Daily costs are food + activities only, not flights, lodging, or cars.</p>
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
