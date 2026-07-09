#!/usr/bin/env node
/**
 * create-iceland.mjs — builds src/_data/iceland/main.json
 * Southwest/South linear corridor, June 2027, family of 4 (kids 13 & 8).
 * Photography-first "novel swim register" trip: geothermal lagoons + hot pots.
 * NOT the Ring Road. New unranked trip: recommended:false, no scorecard.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as H from '/Users/aaron/.claude/skills/travel-itinerary/scripts/itinerary-helpers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const outDir = path.join(root, 'src/_data/iceland');

const { unsplash: U, pexels: P, img, point, mkSpot, day, fact, card, prow, table } = H;

// ---------------------------------------------------------------------------
// Map — regions in first-appearance order → --c1..--c5
// ---------------------------------------------------------------------------
const mapColors = {
  reykjavik: '#1f6f78',
  southcoast: '#c25a3a',
  southeast: '#3f7d4e',
  reykjanes: '#3a6ea5',
  transfer: '#7d5ba6',
};

const mapPoints = [
  point('Keflavík International Airport (KEF)', 63.985, -22.6056, 'transfer', 'flight'),
  point('Reykjavík base (2 arrival nights)', 64.1466, -21.9426, 'reykjavik', 'hotel'),
  point('Laugardalslaug geothermal pool', 64.1407, -21.88, 'reykjavik', 'beach'),
  point('Old Harbour — whale & puffin boats', 64.1512, -21.941, 'reykjavik', 'town'),
  point('Hallgrímskirkja + Sun Voyager', 64.1417, -21.9266, 'reykjavik', 'view'),
  point('Sky Lagoon (teens/adults soak option)', 64.1206, -21.9356, 'reykjavik', 'beach'),
  point('Þingvellir National Park', 64.2559, -21.1295, 'southcoast', 'view'),
  point('Geysir / Strokkur', 64.3104, -20.3024, 'southcoast', 'view'),
  point('Gullfoss waterfall', 64.3271, -20.1199, 'southcoast', 'view'),
  point('Secret Lagoon (Gamla Laugin), Flúðir', 64.1379, -20.3107, 'southcoast', 'beach'),
  point('South Coast base (Hvolsvöllur / Vík)', 63.4186, -19.006, 'southcoast', 'hotel'),
  point('Seljalandsfoss (walk-behind falls)', 63.6156, -19.9886, 'southcoast', 'view'),
  point('Skógafoss + Kvernufoss', 63.5321, -19.5114, 'southcoast', 'view'),
  point('Sólheimajökull glacier walk', 63.531, -19.369, 'southcoast', 'hike'),
  point('Reynisfjara black-sand beach', 63.4034, -19.0447, 'southcoast', 'beach'),
  point('Dyrhólaey puffin cliffs', 63.4014, -19.1275, 'southcoast', 'view'),
  point('Fjaðrárgljúfur canyon', 64.0616, -18.1718, 'southeast', 'view'),
  point('Skaftafell / Svartifoss (Vatnajökull NP)', 64.0159, -16.9662, 'southeast', 'hike'),
  point('Jökulsárlón glacier lagoon', 64.0784, -16.2306, 'southeast', 'view'),
  point('Diamond Beach', 64.0428, -16.1769, 'southeast', 'beach'),
  point('Höfn base (3 nights)', 64.2539, -15.2082, 'southeast', 'hotel'),
  point('Vestrahorn / Stokksnes', 64.2483, -14.9756, 'southeast', 'view'),
  point('Hoffell natural hot tubs', 64.403, -15.348, 'southeast', 'beach'),
  point('Bridge Between Continents', 63.8686, -22.6758, 'reykjanes', 'view'),
  point('Gunnuhver hot springs', 63.8188, -22.6847, 'reykjanes', 'view'),
  point('Seltún / Krýsuvík geothermal', 63.8944, -22.0553, 'reykjanes', 'view'),
  point('Blue Lagoon (near-airport soak)', 63.8804, -22.4495, 'reykjanes', 'beach'),
  point('Keflavík base (final nights)', 64.0049, -22.5657, 'reykjanes', 'hotel'),
];

// ---------------------------------------------------------------------------
// Images (all verified reachable; Unsplash + Pexels only)
// ---------------------------------------------------------------------------
const arrivalImages = [
  img(U('1514371229-a867362eb0f0'), 'Geothermal steam at blue hour', 'Sam Bark &middot; Unsplash License'),
  img(U('1741660419957-2cb7baa19e3f'), 'Infinity-edge geothermal lagoon lounge', 'Owen Roth &middot; Unsplash License'),
];
const cityImages = [
  img(U('1484619701999-76d79bbc51d1'), 'Reykjavík rooftops from the air', 'Tim Trad &middot; Unsplash License'),
  img(U('1741660419768-1dc53ed5c23b'), 'Hallgrímskirkja over the old town', 'Owen Roth &middot; Unsplash License'),
  img(U('1769210897451-7af9408be722'), 'Sun Voyager on the waterfront', 'Dave Meckler &middot; Unsplash License'),
];
const goldenImages = [
  img(P('34589716'), 'Gullfoss two-tier falls from above', 'Rino Adamo &middot; Pexels License'),
  img(P('34638567'), 'Strokkur erupting against sunset colour', 'Suju &middot; Pexels License'),
  img(P('34598759'), 'Gullfoss canyon in golden light', 'Andreas Ebner &middot; Pexels License'),
];
const secretImages = [
  img(P('32577913'), 'Steaming geothermal pool in rugged terrain', 'Xintao Zhou &middot; Pexels License'),
  img(P('19499959'), 'Misty hot spring at Flúðir', 'Laura Paredis &middot; Pexels License'),
  img(P('32261428'), 'Geothermal steam rising off the water', 'Raul Ling &middot; Pexels License'),
];
const waterfallImages = [
  img(P('35317550'), 'Seljalandsfoss with a full rainbow', 'Vibhavari Bellutagi &middot; Pexels License'),
  img(P('34598736'), 'Skógafoss rainbow curtain', 'Andreas Ebner &middot; Pexels License'),
  img(P('12708175'), 'Green cliffs framing Seljalandsfoss', 'Timon Cornelissen &middot; Pexels License'),
];
const glacierImages = [
  img(P('29084576'), 'Roped up on the Sólheimajökull ice', 'Brianna Eisman &middot; Pexels License'),
  img(P('6353790'), 'Deep-blue glacier ice detail', 'Philippe Bonnaire &middot; Pexels License'),
  img(P('29084584'), 'Crampons on the glacier tongue', 'Brianna Eisman &middot; Pexels License'),
];
const reynisImages = [
  img(P('20458528'), 'Basalt columns at Reynisfjara', 'Laura Paredis &middot; Pexels License'),
  img(P('32798879'), 'Black sand and Atlantic surf', 'Raul Ling &middot; Pexels License'),
  img(P('37066099'), 'Basalt sea cave, Reynisfjara', 'David Hitchcock &middot; Pexels License'),
];
const canyonImages = [
  img(U('1741808045701-16fbab329169'), 'Fjaðrárgljúfur canyon from above', 'Karsten Winegeart &middot; Unsplash License'),
  img(U('1503993656770-0479a287559e'), 'Serpentine green canyon walls', 'Geoffrey Lucas &middot; Unsplash License'),
  img(U('1696709699529-683fe6172436'), 'Svartifoss over black basalt columns', 'Bernd Dittrich &middot; Unsplash License'),
];
const jokulImages = [
  img(U('1692865146808-57c99b91e672'), 'Blue icebergs drifting on Jökulsárlón', 'Xavier S. &middot; Unsplash License'),
  img(U('1606673563105-945aa5ac4184'), 'Glacier lagoon at twilight', 'Mauro-Fabio Cilurzo &middot; Unsplash License'),
];
const diamondImages = [
  img(P('4087258'), 'Ice fragments on the black sand', 'Diamond Beach &middot; Pexels License'),
  img(P('4008347'), 'Glassy ice chunk stranded on the beach', 'Diamond Beach &middot; Pexels License'),
];
const vestraImages = [
  img(P('33431641'), 'Vestrahorn mirrored on wet black sand', 'Lonneke Meijer &middot; Pexels License'),
  img(P('32151713'), 'Vestrahorn reflected in still water', 'Raul Ling &middot; Pexels License'),
  img(P('32077773'), 'Moody Vestrahorn over black dunes', 'Raul Ling &middot; Pexels License'),
];
const reykjanesImages = [
  img(P('34586070'), 'Glowing lava on the Reykjanes peninsula', 'Rino Adamo &middot; Pexels License'),
  img(U('1681754109530-0875eb85dac9'), 'Continental-divide rift through the lava', 'John Wayne Hill &middot; Unsplash License'),
];
const blueLagoonImages = [
  img(U('1726441138748-c40db4021cd6'), 'Floating in the milky-blue lagoon', 'Karsten Winegeart &middot; Unsplash License'),
  img(U('1514371229-a867362eb0f0'), 'Blue Lagoon geothermal steam at sunset', 'Sam Bark &middot; Unsplash License'),
];

// ---------------------------------------------------------------------------
// Spots
// ---------------------------------------------------------------------------
const arrivalSpot = mkSpot({
  name: 'Reykjavík soft landing + Laugardalslaug geothermal pool',
  tags: ['reykjavik', 'laugardalslaug', 'iceland'],
  carouselId: 'c-arrival',
  images: arrivalImages,
  lat: 64.1407, lng: -21.88,
  cost: 'Laugardalslaug (Reykjavík\'s big neighbourhood geothermal pool) is about 1,330 ISK adult (~$10) and roughly 205 ISK for kids — hot pots, a waterslide, and locals, for a fraction of the famous lagoons. Whole-family baseline under $30.',
  climateLabel: 'Water',
  climate: '<b>Warm geothermal, cold air.</b> Pools and hot pots run 38-40&deg;C / 100-104&deg;F; June air is only ~53-59&deg;F. The sea is a frigid ~50&deg;F and nobody swims it &mdash; on this trip <b>the water is always geothermal</b>, and that starts on day one.',
  save: 'Skip a big-name lagoon on arrival day when everyone is jet-lagged and use Laugardalslaug: all ages welcome, cheap, and the most local thing you\'ll do all week.',
  splurge: 'If both adults want the marquee soak, one adult + the 13-year-old can do <b>Sky Lagoon</b> (its sea-cliff infinity edge is stunning) &mdash; but note Sky Lagoon bans under-12s, so the 8-year-old cannot go (see Health-Check).',
  restos: [
    '<a href="https://www.bullan.is/" target="_blank" rel="noreferrer"><b>Hamborgarabúllan (Búllan)</b></a> - beloved Icelandic burger-and-fries chain, the picky-kid win right off the plane',
    '<b>Bæjarins Beztu Pylsur</b> - the world-famous hot-dog stand, ~600 ISK, the cheapest kid meal in Reykjavík',
    '<b>Bónus / Krónan supermarket</b> - stock the apartment; Iceland groceries are pricey but far cheaper than eating out three times a day',
  ],
  alts: [
    '<b>Sundhöllin</b> - Reykjavík\'s handsome downtown pool with rooftop hot tubs if Laugardalslaug is busy.',
    '<b>Sky Lagoon</b> for the adults + teen if the 8-year-old naps with one parent.',
    '<b>Grocery run + early night</b> if the redeye flattened everyone; the midnight sun makes an evening walk easy.',
  ],
  blogs: [
    { label: 'Laugardalslaug official pool page', href: 'https://reykjavik.is/en/laugardalslaug' },
    { label: 'Sky Lagoon packages & age rules', href: 'https://www.skylagoon.com/packages' },
  ],
});

const citySpot = mkSpot({
  name: 'Reykjavík city + whale & puffin boat',
  tags: ['reykjavik', 'puffins', 'whalewatching'],
  carouselId: 'c-city',
  images: cityImages,
  lat: 64.1512, lng: -21.941,
  cost: 'Elding classic whale or puffin watching (~3h from the Old Harbour): about 8,300 ISK adult, 4,150 ISK child 7-15, under-6 free &mdash; roughly 24,900 ISK (~$189) for the four of you. Hallgrímskirkja tower is ~1,400 ISK adult / ~200 ISK child; most of the city is free to walk.',
  climateLabel: 'Boat',
  climate: '<b>June is peak season</b> for both puffins (Apr-Aug) and whales (minke, humpback, dolphins). Faxaflói Bay can be choppy &mdash; give kids Dramamine an hour ahead and stay on deck watching the horizon. Elding\'s big classic boats are gentler for an 8-year-old than a RIB.',
  save: 'Do a single boat (whale OR puffin, not both), climb the Hallgrímskirkja tower for the one paid view worth it, and eat hot dogs and street-food lamb soup rather than sit-down dinners.',
  splurge: 'Elding\'s whale + puffin combo, or a fast RIB puffin tour the 13-year-old will love.',
  restos: [
    '<a href="https://www.icelandicstreetfood.com/" target="_blank" rel="noreferrer"><b>Icelandic Street Food</b></a> - lamb soup with free refills in a bread bowl, cheap and fast',
    '<a href="https://www.flateypizza.is/" target="_blank" rel="noreferrer"><b>Flatey Pizza (Grandi)</b></a> - proper Neapolitan pizza near the harbour, the 8-year-old\'s safe bet',
    '<b>Hamborgarabúllan, Geirsgata</b> - burgers right by the whale-watch dock',
  ],
  alts: [
    '<b>FlyOver Iceland</b> (Grandi) - a ride-film "flight" over the country if a boat looks too rough that day.',
    '<b>Whales of Iceland / Perlan</b> museums for a rainy indoor option.',
    '<b>Grótta lighthouse</b> walk at "sunset" (near midnight) for empty golden light.',
  ],
  blogs: [
    { label: 'Elding whale & puffin schedule/prices', href: 'https://elding.is/reykjavik-schedule-prices' },
    { label: 'Visit Reykjavík official', href: 'https://visitreykjavik.is/' },
  ],
});

const goldenSpot = mkSpot({
  name: 'Golden Circle: Þingvellir, Geysir & Gullfoss',
  tags: ['goldencircle', 'gullfoss', 'thingvellir'],
  carouselId: 'c-golden',
  images: goldenImages,
  lat: 64.3271, lng: -20.1199,
  cost: 'All three headline stops are free to enter; you pay only parking. Þingvellir parking is ~1,000 ISK for the whole day (one payment covers every lot). Geysir and Gullfoss parking are free. Family baseline for the day: about $10 in parking plus lunch.',
  climateLabel: 'Weather',
  climate: '<b>Cool, breezy, ~54&deg;F.</b> Strokkur erupts every 5-10 minutes, 15-20m high &mdash; stand upwind. Gullfoss throws spray and rainbows on sunny afternoons; bring rain shells. Everything here is an easy walk for an 8-year-old.',
  save: 'Pay Þingvellir parking once and don\'t move the car between lots. Eat the famous lamb soup at the free Gullfoss café rather than a sit-down spot.',
  splurge: 'Lunch at Friðheimar tomato greenhouse (pre-book) or the Kerið crater stop; add the Secret Lagoon soak below to close the loop.',
  restos: [
    '<b>Gullfoss Café</b> - hearty lamb soup with refills, right at the upper viewpoint',
    '<a href="https://fridheimar.is/en" target="_blank" rel="noreferrer"><b>Friðheimar</b></a> - tomato-greenhouse restaurant (tomato soup, fresh pasta, pizza) — reserve ahead',
    '<b>Efstidalur II farm</b> - burgers and farm ice cream between Þingvellir and Geysir',
  ],
  alts: [
    '<b>Kerið crater</b> (~600 ISK) for a quick, colourful volcanic-lake stop on the way south.',
    '<b>Brúarfoss</b> for the bluest water in Iceland if legs are still fresh.',
    '<b>Skip Silfra snorkeling</b> — the fissure dive has a ~12+ minimum and drysuit rules; view it free from the boardwalk instead.',
  ],
  blogs: [
    { label: 'Þingvellir National Park official', href: 'https://www.thingvellir.is/en/' },
    { label: 'Geysir & Gullfoss visitor info', href: 'https://www.south.is/en/place/geysir' },
  ],
});

const secretSpot = mkSpot({
  name: 'Secret Lagoon (Gamla Laugin), Flúðir',
  tags: ['secretlagoon', 'geothermal', 'fludir'],
  carouselId: 'c-secret',
  images: secretImages,
  lat: 64.1379, lng: -20.3107,
  cost: 'Adults about 3,000 ISK (~$22); children 14 and under free. Roughly 6,000 ISK (~$44) for the family &mdash; the best-value warm soak on the whole route. Bring your own towels to skip rental fees. Pre-book a slot in peak summer.',
  climateLabel: 'Water',
  climate: '<b>Iceland\'s oldest pool (1891), 38-40&deg;C.</b> A genuine natural geothermal pool with a little hot spring erupting beside it &mdash; low-key, steamy, and far calmer than the Blue Lagoon. This is the second bead on the trip\'s geothermal string.',
  save: 'This IS the save: kids-free pricing makes it the cheapest lagoon on the trip. Own towels, no upsells.',
  splurge: 'If you want the luxury version instead, swap in Sky Lagoon (teens/adults) or the Blue Lagoon on the return leg — but Secret Lagoon is the family-value pick.',
  restos: [
    '<a href="https://www.minilik.is/" target="_blank" rel="noreferrer"><b>Minilik, Flúðir</b></a> - Ethiopian, surprisingly kid-friendly, near the lagoon',
    '<b>Friðheimar</b> - if you didn\'t already stop for greenhouse pasta on the Golden Circle',
    '<b>Pack a picnic</b> - Flúðir options are thin; soak, then drive on toward the south base',
  ],
  alts: [
    '<b>Sky Lagoon</b> as the upscale substitute if you\'d rather do it near Reykjavík.',
    '<b>Fontana Geothermal (Laugarvatn)</b> — lakeside steam-baths right on the Golden Circle route.',
    '<b>Gamla Laugin evening slot</b> under the midnight sun if the day ran long.',
  ],
  blogs: [
    { label: 'Secret Lagoon official booking', href: 'https://secretlagoon.is/' },
    { label: 'Fontana Geothermal (alternative)', href: 'https://www.fontana.is/en/' },
  ],
});

const waterfallSpot = mkSpot({
  name: 'Seljalandsfoss + Skógafoss (walk-behind & 60m curtain)',
  tags: ['seljalandsfoss', 'skogafoss', 'waterfalls'],
  carouselId: 'c-waterfalls',
  images: waterfallImages,
  lat: 63.6156, lng: -19.9886,
  cost: 'Both waterfalls are free; Seljalandsfoss parking is ~1,000 ISK, Skógafoss parking free. Hidden Kvernufoss (a 15-min walk from the Skógar Museum) is free too. Family day cost: parking plus lunch.',
  climateLabel: 'Waterfalls',
  climate: '<b>You will get soaked.</b> The path <i>behind</i> Seljalandsfoss is thrilling and slippery &mdash; rain jackets, non-slip shoes, hold the 8-year-old\'s hand. West-facing, so both falls glow gold and throw rainbows in the late-evening light. Skógafoss has a 527-step staircase to the top for the trophy view.',
  save: 'Everything here is free. Add Gljúfrabúi (the partly-hidden falls 5 min north of Seljalandsfoss) and Kvernufoss for two more waterfalls at zero cost.',
  splurge: 'Nothing needed — this is the free, high-wow day. Put money toward the glacier hike instead.',
  restos: [
    '<a href="https://www.facebook.com/sveitagrillidmiu/" target="_blank" rel="noreferrer"><b>Mia\'s Country Van (Sveitagrill Míu)</b></a> - famous fresh fish & chips at Skógafoss (often closed Fri)',
    '<a href="https://hotelskogafoss.is/bistro-bar/" target="_blank" rel="noreferrer"><b>Hótel Skógafoss Bistro</b></a> - local-beef burgers and meat soup at the base of the falls',
    '<b>Gljúfrabúi car-park food truck</b> - simple snacks between the two waterfalls',
  ],
  alts: [
    '<b>Kvernufoss</b> — a crowd-free walk-behind falls behind the Skógar Museum.',
    '<b>Seljavallalaug</b> — a free 1923 hidden geothermal pool up a short valley walk (unmaintained, murky, adventurous only).',
    '<b>Sólheimasandur DC-3 wreck</b> — a bleak 4km flat walk (or shuttle) to the 1973 plane wreck on black sand.',
  ],
  blogs: [
    { label: 'Seljalandsfoss official (South Iceland)', href: 'https://www.south.is/en/place/seljalandsfoss' },
    { label: 'Skógafoss visitor info', href: 'https://www.south.is/en/place/skogafoss' },
  ],
});

const glacierSpot = mkSpot({
  name: 'Sólheimajökull kid-appropriate glacier walk',
  tags: ['solheimajokull', 'glacierhike', 'iceland'],
  carouselId: 'c-glacier',
  images: glacierImages,
  lat: 63.531, lng: -19.369,
  cost: 'Tröll Expeditions\' 3-hour Easy Glacier Hike takes ages 8+ (min EU-34 shoe for crampons) from about $107/person &mdash; roughly $428 for the family, crampons, harness, helmet, ice axe and guide included. Never walk on the glacier without a certified guide.',
  climateLabel: 'Glacier',
  climate: '<b>Cold, bright, crevassed.</b> Wear warm layers, waterproofs, and sturdy boots (rentable). The walk is easy-to-moderate on the ice tongue &mdash; the marquee adventure of the trip and completely doable for a fit 8-year-old with Tröll\'s age-8 tour.',
  save: 'View the glacier tongue and its lagoon for free from the ~15-min walk at the parking lot if you\'d rather not pay for the guided ice time.',
  splurge: 'Add an ice-cave or blue-ice extension, or upgrade to a small-group tour for more time actually on the glacier.',
  restos: [
    '<a href="https://www.sudur-vik.com/" target="_blank" rel="noreferrer"><b>Suður-Vík, Vík</b></a> - burgers, pizza, fries and Thai curry, the reliable post-glacier family dinner',
    '<a href="https://www.skoolbeans.com/" target="_blank" rel="noreferrer"><b>Skool Beans, Vík</b></a> - a converted school-bus café for hot chocolate and snacks',
    '<b>Halldórskaffi, Vík</b> - pizzas and Icelandic classics (verify it has reopened after 2026 renovation)',
  ],
  alts: [
    '<b>Icelandic Mountain Guides Sólheimajökull walk</b> (age 10+) if you want a smaller group.',
    '<b>Glacier-tongue free viewpoint</b> if crampon time isn\'t worth it that day.',
    '<b>Katla Ice Cave super-jeep tour</b> for the older kid on a splurge day.',
  ],
  blogs: [
    { label: 'Tröll Expeditions glacier hikes', href: 'https://www.troll.is/' },
    { label: 'Icelandic Mountain Guides (Sólheimajökull)', href: 'https://www.mountainguides.is/' },
  ],
});

const reynisSpot = mkSpot({
  name: 'Reynisfjara black sand + Dyrhólaey puffins',
  tags: ['reynisfjara', 'dyrholaey', 'blacksand'],
  carouselId: 'c-reynis',
  images: reynisImages,
  lat: 63.4034, lng: -19.0447,
  cost: 'Reynisfjara and Dyrhólaey are free (free parking, café on site at the beach). Budget only for lunch and the optional DC-3 wreck shuttle (~3,400 ISK adult / ~2,380 ISK child if you skip the walk).',
  climateLabel: 'Beach — DANGER',
  climate: '<b>&#9888;&#65039; Sneaker waves kill people here.</b> Waves surge far up the sand without warning and drag people into ~50&deg;F water &mdash; there have been multiple deaths, including a 9-year-old in Aug 2025. <b>Stay on dry sand well back from the water, never turn your back to the ocean,</b> and obey the green/yellow/red warning lights. Look, photograph, do not wade.',
  save: 'It\'s all free. Combine Reynisfjara, the basalt columns, and Dyrhólaey\'s puffins in one loop; the DC-3 wreck is a free walk if you skip the shuttle.',
  splurge: 'The DC-3 shuttle to save little legs, or a Katla/Mýrdalsjökull ice-cave add-on from Vík.',
  restos: [
    '<a href="https://www.sudur-vik.com/" target="_blank" rel="noreferrer"><b>Suður-Vík, Vík</b></a> - the dependable family dinner in town',
    '<b>Black Beach Restaurant</b> - right at the Reynisfjara car park, soups and sandwiches with a view (and a warm break from the wind)',
    '<b>Ströndin Bistro, Vík</b> - burgers and fish by the shore',
  ],
  alts: [
    '<b>Dyrhólaey upper viewpoint</b> for puffins and the arch (lower road often closed for nesting to ~late June).',
    '<b>Reyniskirkja hilltop</b> for the classic red-roofed-church-over-Vík photo.',
    '<b>Sólheimasandur DC-3 wreck</b> as the flex add-on if the beach is on a red-flag day.',
  ],
  blogs: [
    { label: 'SafeTravel — Reynisfjara safety', href: 'https://safetravel.is/' },
    { label: 'Dyrhólaey nature reserve info', href: 'https://www.south.is/en/place/dyrholaey' },
  ],
});

const canyonSpot = mkSpot({
  name: 'Fjaðrárgljúfur canyon + Skaftafell / Svartifoss',
  tags: ['fjadrargljufur', 'svartifoss', 'skaftafell'],
  carouselId: 'c-canyon',
  images: canyonImages,
  lat: 64.0159, lng: -16.9662,
  cost: 'Fjaðrárgljúfur is free (upper lot free, lower lot ~1,000 ISK). Skaftafell / Vatnajökull NP parking is ~1,040 ISK per day &mdash; and if you also park at Jökulsárlón the same day you get 50% off. No per-person park entry. Family day: a few dollars in parking.',
  climateLabel: 'Canyon & falls',
  climate: '<b>Two easy-to-moderate walks.</b> Fjaðrárgljúfur is a ~1-1.5h rim walk on a roped path (kid-safe). Svartifoss is a ~1.5-2h round hike up to a black basalt-column waterfall. Both are exposed &mdash; pack the rain shells the southeast is famous for needing.',
  save: 'Park the free upper Fjaðrárgljúfur lot and walk down. Svartifoss + the flat Skaftafellsjökull glacier-viewpoint walk fill a half-day for just the parking fee.',
  splurge: 'A guided Skaftafell blue-ice glacier hike (Icelandic Mountain Guides, ~$130pp, age 8-10 min — confirm the 8-year-old qualifies).',
  restos: [
    '<a href="https://www.systrakaffi.is/" target="_blank" rel="noreferrer"><b>Systrakaffi, Kirkjubæjarklaustur</b></a> - burgers, pizzas and vegan options; the reliable stop in a town with few choices',
    '<b>Skaftafell Bistro (visitor centre)</b> - soups, sandwiches and coffee at the trailhead',
    '<b>Pack lunch</b> - services are sparse between Vík and Höfn; carry snacks and water',
  ],
  alts: [
    '<b>Skaftafellsjökull glacier-snout walk</b> — flat ~3.7km round, big payoff for kids, free.',
    '<b>Systrafoss / Kirkjubæjarklaustur</b> stop if Fjaðrárgljúfur is closed for erosion recovery (check same-day).',
    '<b>Fjallsárlón</b> — a quieter glacier lagoon just before Jökulsárlón.',
  ],
  blogs: [
    { label: 'Vatnajökull NP — Skaftafell', href: 'https://www.vatnajokulsthjodgardur.is/en/areas/skaftafell' },
    { label: 'Fjaðrárgljúfur access status', href: 'https://safetravel.is/' },
  ],
});

const jokulSpot = mkSpot({
  name: 'Jökulsárlón glacier lagoon + iceberg boat',
  tags: ['jokulsarlon', 'glacierlagoon', 'icebergs'],
  carouselId: 'c-jokul',
  images: jokulImages,
  lat: 64.0784, lng: -16.2306,
  cost: 'The amphibian boat (~40 min, all ages) runs about 7,100 ISK adult, 3,500 ISK child 6-12 &mdash; roughly 24,800 ISK (~$177) for the family. The faster Zodiac gets closer to the ice but has a ~10-12 minimum age, so the 8-year-old is likely excluded &mdash; take the amphibian. Walking the shore is free.',
  climateLabel: 'Glacier lagoon',
  climate: '<b>Icebergs calve off Breiðamerkurjökull</b> and drift across a tidal lagoon full of seals, glowing blue in the near-endless June light. Book a timed boat slot online in advance (summer sells out). Cold and wind off the ice &mdash; layer up.',
  save: 'Skip the boat and walk the free shoreline &mdash; you still see the blue bergs and seals up close, and put the money toward Diamond Beach next door for nothing.',
  splurge: 'The Zodiac (if the kids are old enough) puts you right against the calving ice; or add the quieter Fjallsárlón lagoon.',
  restos: [
    '<b>Jökulsárlón Café</b> - the on-site food truck/café for soup, hot dogs and coffee between lagoon and beach',
    '<a href="https://www.pakkhus.is/" target="_blank" rel="noreferrer"><b>Pakkhús, Höfn</b></a> - harbourside langoustine (plus burgers for kids) back at base',
    '<b>Ishúsið Pizzeria, Höfn</b> - stone-baked pizzas, the picky-kid winner in town',
  ],
  alts: [
    '<b>Diamond Beach</b> — literally across the road; do them as one stop (see below).',
    '<b>Fjallsárlón</b> — smaller, quieter lagoon with its own Zodiac.',
    '<b>Evening light slot</b> — the midnight sun on the bergs is the best photography of the trip.',
  ],
  blogs: [
    { label: 'Jökulsárlón boat tours official', href: 'https://icelagoon.is/' },
    { label: 'Vatnajökull NP — Jökulsárlón', href: 'https://www.vatnajokulsthjodgardur.is/en/areas/jokulsarlon' },
  ],
});

const diamondSpot = mkSpot({
  name: 'Diamond Beach (ice on black sand)',
  tags: ['diamondbeach', 'breidamerkursandur', 'iceland'],
  carouselId: 'c-diamond',
  images: diamondImages,
  lat: 64.0428, lng: -16.1769,
  cost: 'Free, with two parking lots either side of the river mouth (the west lot usually has bigger ice). Two minutes from Jökulsárlón &mdash; pair them.',
  climateLabel: 'Beach',
  climate: '<b>The signature shot of the trip:</b> chunks of glacier ice strand on black volcanic sand, backlit and glowing. In June the "night" low-sun light lasts for hours. Same sneaker-wave caution as any Icelandic black beach &mdash; keep the kids back from the surf line.',
  save: 'It\'s free and right beside the lagoon; combine into one stop and shoot the ice at the low-sun evening hours.',
  splurge: 'Bring a cheap tripod + ND filter for silky long exposures &mdash; the backlit ice is worth the setup.',
  restos: [
    '<a href="https://humarhofnin.is/" target="_blank" rel="noreferrer"><b>Humarhöfnin, Höfn</b></a> - "langoustine haven": langoustine soup, tails, and even langoustine pizza; reserve ahead',
    '<a href="https://www.pakkhus.is/" target="_blank" rel="noreferrer"><b>Pakkhús, Höfn</b></a> - the harbourside classic (no reservations — expect a summer wait)',
    '<b>Ishúsið Pizzeria, Höfn</b> - the dependable pizza fallback for the kids',
  ],
  alts: [
    '<b>Jökulsárlón shore</b> — the paired half of this stop.',
    '<b>Stokksnes / Vestrahorn</b> — the photographer\'s mountain, ~1h further east (next day).',
    '<b>Fjallsárlón</b> — if Jökulsárlón is mobbed with tour buses.',
  ],
  blogs: [
    { label: 'Diamond Beach (Vatnajökull NP)', href: 'https://www.vatnajokulsthjodgardur.is/en/areas/jokulsarlon' },
    { label: 'Höfn area guide', href: 'https://www.visitvatnajokull.is/' },
  ],
});

const vestraSpot = mkSpot({
  name: 'Vestrahorn / Stokksnes + Hoffell hot tubs',
  tags: ['vestrahorn', 'stokksnes', 'hoffell'],
  carouselId: 'c-vestra',
  images: vestraImages,
  lat: 64.2483, lng: -14.9756,
  cost: 'Stokksnes / Vestrahorn access is ~900-1,000 ISK/person at the Viking Café (includes the film-set Viking village and the beach) &mdash; about $28 for the family, the best photo in Iceland for the price. Hoffell natural hot tubs run ~2,000-4,900 ISK/adult (price varies by source; under-8 free) &mdash; confirm current rate.',
  climateLabel: 'Mountain & soak',
  climate: '<b>Vestrahorn mirrors on wet black sand</b> at low tide with calm wind &mdash; check Höfn tide tables and aim for the low-sun hours. Then unwind at Hoffell\'s small geothermal tubs facing Hoffellsjökull glacier &mdash; the southeast bead on the trip\'s hot-water string.',
  save: 'Vestrahorn is cheap for the payoff; Hoffell is a low-key farm soak versus a pricey spa. Do both on the same relaxed day.',
  splurge: 'A humar (langoustine) dinner in Höfn, the town\'s signature, at Pakkhús or Humarhöfnin.',
  restos: [
    '<a href="https://humarhofnin.is/" target="_blank" rel="noreferrer"><b>Humarhöfnin, Höfn</b></a> - langoustine done every way; reserve ahead',
    '<a href="https://www.pakkhus.is/" target="_blank" rel="noreferrer"><b>Pakkhús, Höfn</b></a> - historic warehouse, langoustine + kid burgers',
    '<b>Ishúsið Pizzeria, Höfn</b> - Travellers\' Choice pizzas; the easy picky-kid dinner',
  ],
  alts: [
    '<b>Hoffell hot tubs</b> as the soak; or the Höfn town pool (Sundlaug Hafnar) as a cheap all-ages backup.',
    '<b>Þórbergssetur museum</b> at Hali on a rainy day.',
    '<b>Höfn harbour walk</b> for the glacier-backed town view at "sunset".',
  ],
  blogs: [
    { label: 'Stokksnes / Viking Café info', href: 'https://www.visitvatnajokull.is/place/stokksnes/' },
    { label: 'Hoffell hot tubs (Glacier World)', href: 'https://glacierworld.is/' },
  ],
});

const reykjanesSpot = mkSpot({
  name: 'Reykjanes peninsula: rifts, steam & lava',
  tags: ['reykjanes', 'gunnuhver', 'bridgebetweencontinents'],
  carouselId: 'c-reykjanes',
  images: reykjanesImages,
  lat: 63.8686, lng: -22.6758,
  cost: 'Everything on Reykjanes is free &mdash; the cheapest "wow" day of the trip. Just fuel and a picnic. Only pay if you choose a guided eruption-site tour.',
  climateLabel: 'Volcanic',
  climate: '<b>A volcanic moonscape 20-45 min from the airport.</b> Walk between the tectonic plates at the Bridge Between Continents, watch Iceland\'s largest mud pool steam at Gunnuhver, and cross the boiling ground at Seltún. <b>Recent-eruption lava fields are viewing-only and only if authorities mark them safe</b> &mdash; never approach active vents (toxic gas, unstable crust).',
  save: 'Free all day. Provision snacks and water in Keflavík first &mdash; there\'s no food at the sights.',
  splurge: 'A guided Reykjanes + eruption-site tour with a geologist if there\'s safe, active-lava access during your window.',
  restos: [
    '<a href="https://duus.is/" target="_blank" rel="noreferrer"><b>Kaffi Duus, Keflavík</b></a> - harbourside seafood and soups with kid options, the local landmark',
    '<b>Rain, Keflavík</b> - burgers, pasta and pub food; the "Rain Burger" + fries for the kids',
    '<b>Keflavík pizzerias</b> - several pizza/pasta spots 5-10 min from KEF, open till ~21:00-22:00',
  ],
  alts: [
    '<b>Kleifarvatn</b> — a moody black-sand crater lake, great for the drive.',
    '<b>Reykjanesviti lighthouse</b> — Iceland\'s oldest, on the seabird cliffs.',
    '<b>Skip the lava fields</b> entirely if the Met Office flags gas or unrest — the rifts and steam vents stand alone.',
  ],
  blogs: [
    { label: 'Visit Reykjanes official', href: 'https://www.visitreykjanes.is/en' },
    { label: 'Icelandic Met Office — activity status', href: 'https://en.vedur.is/' },
  ],
});

const blueLagoonSpot = mkSpot({
  name: 'Blue Lagoon — the near-airport finale soak',
  tags: ['bluelagoon', 'grindavik', 'geothermal'],
  carouselId: 'c-blue',
  images: blueLagoonImages,
  lat: 63.8804, lng: -22.4495,
  cost: 'Comfort package (entry + silica mask + towel + a drink) from about 11,990 ISK adult; children 2-13 free with a paying adult. Roughly $180-200 for the family &mdash; confirm the 13-year-old\'s rate at booking. Pre-booking is MANDATORY and timed slots sell out; it\'s ~20 min from KEF.',
  climateLabel: 'Water',
  climate: '<b>The milky-blue, 38-39&deg;C finale</b> &mdash; and, unlike Sky Lagoon, it admits all ages, so the whole family soaks together on the way out. Book the earliest morning slot the day you fly home: cheapest dynamic pricing and ahead of the crowds.',
  save: 'The 8-year-old is free and the earliest slot is cheapest. Eat in Keflavík rather than the pricey on-site Lava Restaurant.',
  splurge: 'The in-water bar and silica/algae mask upgrade, or the Retreat/Premium package with sauna and lagoon-side dining.',
  restos: [
    '<b>Blue Café (on-site)</b> - soup and sandwiches without leaving the lagoon complex',
    '<a href="https://duus.is/" target="_blank" rel="noreferrer"><b>Kaffi Duus, Keflavík</b></a> - a proper last Icelandic meal near the airport',
    '<b>Keflavík pizza/burger spots</b> - the reliable picky-kid send-off before the flight',
  ],
  alts: [
    '<b>Sky Lagoon</b> (teens/adults) or a Keflavík town pool if the Blue Lagoon is closed for volcanic activity — check within 48h (see Health-Check).',
    '<b>Laugardalslaug</b> back in Reykjavík as the all-ages fallback soak.',
    '<b>Krýsuvík/Seltún steam</b> if you\'d rather see geothermal than soak on the last day.',
  ],
  blogs: [
    { label: 'Blue Lagoon day-visit booking', href: 'https://www.bluelagoon.com/day-visit/the-blue-lagoon' },
    { label: 'Grindavík / Blue Lagoon status (Met Office)', href: 'https://en.vedur.is/' },
  ],
});

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------
const days = [
  day('day0', 'c0', '0', 'Tue &middot; Jun 8', 'Depart Pittsburgh after work', 'Overnight nonstop to Keflavík', 'Est. $90 &middot; airport meals', [
    fact('Sleep', 'Overnight flight'),
    fact('Route', 'Icelandair PIT &rarr; KEF nonstop (seasonal), ~5h50m'),
    fact('Constraint', 'In Pittsburgh all day Jun 24-26; Jun 23 return is allowed'),
  ], 'Icelandair\'s Pittsburgh nonstop is a redeye (dep ~20:25, arr KEF ~06:15) &mdash; one transatlantic flight, one carrier, no mid-trip flights at all. That single clean ticket is a big reason Iceland beats the island-hop trips on logistics.', [], 'Travel day &mdash; after-work redeye to Iceland.'),

  day('day1', 'c1', '1', 'Wed &middot; Jun 9', 'Land Keflavík, ease into Reykjavík', 'First geothermal soak, groceries, early night', 'Est. $120 &middot; pool, groceries, dinner', [
    fact('Sleep', 'Reykjavík &middot; night 1 of 2'),
    fact('Car', 'Pick up the rental at KEF; ~45 min to Reykjavík'),
    fact('Plan', 'Laugardalslaug pool, supermarket, sleep off the redeye'),
  ], 'You land at ~06:15 in full daylight. Keep day one gentle: grab the car, settle the apartment, and let the jet lag melt in a warm neighbourhood pool. The midnight sun means there\'s no rush and no darkness to beat.', [arrivalSpot]),

  day('day2', 'c1', '2', 'Thu &middot; Jun 10', 'Reykjavík city + whale/puffin boat', 'The capital, then out on Faxaflói Bay', 'Est. $330 &middot; boat tour, tower, meals', [
    fact('Sleep', 'Reykjavík &middot; night 2 of 2'),
    fact('Anchor', 'Old Harbour boat + Hallgrímskirkja tower'),
    fact('Season', 'June = peak puffins AND whales'),
  ], 'A compact, walkable capital: the Hallgrímskirkja tower for the rooftop view, Sun Voyager on the water, and a 3-hour boat into the bay for puffins and whales at the best odds of the year.', [citySpot]),

  day('day3', 'c2', '3', 'Fri &middot; Jun 11', 'Golden Circle + Secret Lagoon', 'Tectonic rift, geyser, waterfall, warm soak', 'Est. $220 &middot; parking, Secret Lagoon, meals', [
    fact('Sleep', 'South Coast base (Hvolsvöllur / Vík) &middot; night 1 of 4'),
    fact('Drive', 'Golden Circle loop, then ~1h south to base'),
    fact('Anchor', 'Þingvellir &middot; Geysir &middot; Gullfoss &middot; Secret Lagoon'),
  ], 'The classic loop, done as a driving day that ends at the south-coast base: walk between continents at Þingvellir, watch Strokkur fire, feel Gullfoss\'s spray, then soak at the Secret Lagoon before checking in near Hvolsvöllur or Vík.', [goldenSpot, secretSpot]),

  day('day4', 'c2', '4', 'Sat &middot; Jun 12', 'Seljalandsfoss + Skógafoss', 'The two-waterfall day (and a hidden third)', 'Est. $180 &middot; parking, meals', [
    fact('Sleep', 'South Coast base (Hvolsvöllur / Vík) &middot; night 2 of 4'),
    fact('Mode', 'Walk behind one falls, climb the other'),
    fact('Bonus', 'Gljúfrabúi + Kvernufoss for free'),
  ], 'Walk <i>behind</i> Seljalandsfoss (you will get soaked), then stand under the 60m curtain of Skógafoss and climb the 527 steps to the top. Add the hidden Gljúfrabúi and Kvernufoss and it\'s four waterfalls for a parking fee.', [waterfallSpot]),

  day('day5', 'c2', '5', 'Sun &middot; Jun 13', 'Sólheimajökull glacier walk', 'Crampons on real ice — the marquee adventure', 'Est. $560 &middot; guided glacier hike, meals', [
    fact('Sleep', 'South Coast base (Hvolsvöllur / Vík) &middot; night 3 of 4'),
    fact('Anchor', 'Tröll age-8 Easy Glacier Hike, ~3h'),
    fact('Gear', 'Crampons/harness/helmet provided; bring boots + layers'),
  ], 'The big one: a guided walk on the Sólheimajökull ice tongue, crampons crunching, blue crevasses underfoot. Tröll\'s age-8 tour is built for exactly this family. An afternoon in Vík to recover.', [glacierSpot]),

  day('day6', 'c2', '6', 'Mon &middot; Jun 14', 'Reynisfjara + Dyrhólaey', 'Black sand, basalt columns, puffins', 'Est. $220 &middot; shuttle, meals', [
    fact('Sleep', 'South Coast base (Hvolsvöllur / Vík) &middot; night 4 of 4'),
    fact('Safety', 'Sneaker waves are lethal — stay well back'),
    fact('Flex', 'DC-3 wreck / hidden pool as add-ons'),
  ], 'A lighter, photograph-heavy day: the basalt columns and roaring surf of Reynisfjara (from a safe distance &mdash; the sneaker waves here kill people), puffins at Dyrhólaey, and the DC-3 plane wreck or a hidden hot pool if there\'s appetite.', [reynisSpot]),

  day('day7', 'c3', '7', 'Tue &middot; Jun 15', 'Drive east: canyon + Skaftafell', 'Serpentine gorge and a basalt-column falls', 'Est. $180 &middot; parking, meals', [
    fact('Sleep', 'Höfn / southeast base &middot; night 1 of 3'),
    fact('Drive', 'Vík &rarr; Höfn, ~2.5h + stops'),
    fact('Anchor', 'Fjaðrárgljúfur + Svartifoss / Skaftafell'),
  ], 'The transition east into glacier country: the serpentine Fjaðrárgljúfur canyon, then Skaftafell for the black basalt-column Svartifoss and a flat glacier-snout walk, arriving at the Höfn base for the night.', [canyonSpot]),

  day('day8', 'c3', '8', 'Wed &middot; Jun 16', 'Jökulsárlón + Diamond Beach', 'Blue icebergs and ice on black sand', 'Est. $320 &middot; iceberg boat, meals', [
    fact('Sleep', 'Höfn / southeast base &middot; night 2 of 3'),
    fact('Anchor', 'Amphibian iceberg boat + Diamond Beach'),
    fact('Light', 'Shoot the bergs in the endless evening sun'),
  ], 'The most otherworldly day of the trip: icebergs drifting on the Jökulsárlón lagoon (all-ages amphibian boat), then the diamonds of glacier ice glowing on the black sand across the road. This is the "nowhere else on Earth" photograph.', [jokulSpot, diamondSpot]),

  day('day9', 'c3', '9', 'Thu &middot; Jun 17', 'Vestrahorn + Hoffell hot tubs', 'The photographer\'s mountain, then a glacier-view soak', 'Est. $300 &middot; Stokksnes, hot tubs, langoustine', [
    fact('Sleep', 'Höfn / southeast base &middot; night 3 of 3'),
    fact('Anchor', 'Stokksnes / Vestrahorn + Hoffell'),
    fact('Treat', 'Höfn langoustine (humar) dinner'),
  ], 'Vestrahorn reflected on wet black sand at Stokksnes is Iceland\'s most-photographed mountain; time it to the tide and the low sun. Then soak at Hoffell facing the glacier, and eat the langoustine Höfn is famous for.', [vestraSpot]),

  day('day10', 'c4', '10', 'Fri &middot; Jun 18', 'Scenic drive back west', 'Juneteenth: the long, light-filled return', 'Est. $150 &middot; road meals', [
    fact('Sleep', 'Reykjavík / Keflavík return base &middot; night 1 of 3'),
    fact('Holiday', 'Juneteenth observed for many employers (no PTO)'),
    fact('Drive', 'Höfn &rarr; west, a full day with re-stops'),
  ], 'The one long drive of the trip, and the midnight sun makes it easy &mdash; re-shoot any south-coast falls in better light on the way. Juneteenth (observed Fri Jun 18) is a no-PTO day for many employers, so the calendar spends it on the road, not on leave.', [], 'Travel day &mdash; the scenic reposition west, unhurried under the midnight sun.'),

  day('day11', 'c4', '11', 'Sat &middot; Jun 19', 'Reykjanes peninsula', 'Rifts, steam vents and lava near the airport', 'Est. $150 &middot; picnic, meals', [
    fact('Sleep', 'Reykjavík / Keflavík return base &middot; night 2 of 3'),
    fact('Anchor', 'Bridge Between Continents, Gunnuhver, Seltún'),
    fact('Cost', 'Free — the cheapest wow day of the trip'),
  ], 'A volcanic moonscape minutes from the airport: stand between the tectonic plates, watch Gunnuhver steam, and cross the boiling ground at Seltún &mdash; with recent-eruption lava viewing only if the Met Office marks it safe.', [reykjanesSpot]),

  day('day12', 'c4', '12', 'Sun &middot; Jun 20', 'Blue Lagoon finale + last Reykjavík', 'The whole-family soak before flying home', 'Est. $300 &middot; Blue Lagoon, meals', [
    fact('Sleep', 'Reykjavík / Keflavík return base &middot; night 3 of 3'),
    fact('Anchor', 'Blue Lagoon (all ages) + Reykjavík wind-down'),
    fact('Book', 'Timed slot mandatory; check volcanic status'),
  ], 'The last bead on the geothermal string, and the one Sky Lagoon couldn\'t be: the Blue Lagoon admits all ages, so the whole family floats together in the milky-blue water before a final Reykjavík evening and an easy pack.', [blueLagoonSpot]),

  day('day13', 'c0', '13', 'Mon &middot; Jun 21', 'Fly Keflavík &rarr; Pittsburgh', 'Home before the blackout', 'Est. $90 &middot; airport meals', [
    fact('Sleep', 'Home Mon Jun 21'),
    fact('Route', 'Icelandair KEF &rarr; PIT nonstop, lands same day'),
    fact('Schedule', 'Home Mon Jun 21'),
  ], 'The westbound nonstop is a daytime flight that lands in Pittsburgh the same calendar day &mdash; home Monday Jun 21, ahead of the preferred Jun 23 return and the required full Pittsburgh days Jun 24-26.', [], 'Travel day &mdash; nonstop home, arrives PIT the same day.'),
];

// ---------------------------------------------------------------------------
// Hero preview
// ---------------------------------------------------------------------------
const previewImages = [
  [U('1692865146808-57c99b91e672'), 'Day 8 &middot; Wed Jun 16', 'Jökulsárlón glacier lagoon', 'Blue icebergs drifting to the sea — the "nowhere else on Earth" shot.'],
  [P('34598736'), 'Day 4 &middot; Sat Jun 12', 'Skógafoss', 'A 60-metre curtain of water throwing a full rainbow.'],
  [P('33431641'), 'Day 9 &middot; Thu Jun 17', 'Vestrahorn / Stokksnes', 'Iceland\'s most-photographed mountain, mirrored on black sand.'],
  [P('20458528'), 'Day 6 &middot; Mon Jun 14', 'Reynisfjara', 'Basalt columns and Atlantic surf on a black-sand beach.'],
  [P('29084576'), 'Day 5 &middot; Sun Jun 13', 'Sólheimajökull', 'Crampons on real glacier ice — the marquee family adventure.'],
  [P('4087258'), 'Day 8 &middot; Wed Jun 16', 'Diamond Beach', 'Glacier ice glowing on black volcanic sand.'],
  [P('35317550'), 'Day 4 &middot; Sat Jun 12', 'Seljalandsfoss', 'The waterfall you walk behind, lit gold at midnight.'],
  [U('1514371229-a867362eb0f0'), 'Day 12 &middot; Sun Jun 20', 'Blue Lagoon', 'The all-ages geothermal finale, 20 minutes from the airport.'],
  [P('34589716'), 'Day 3 &middot; Fri Jun 11', 'Gullfoss', 'The Golden Circle\'s thundering two-tier falls.'],
];

const preview = H.preview({
  kicker: 'Family Trip &middot; Jun 8&ndash;21, 2027',
  h1Main: 'Iceland',
  h1Sub: 'Reykjavík, the South Coast & the glacier lagoons',
  lead: 'Twelve nights of scenery that looks like nowhere we\'ve been &mdash; waterfalls you walk behind, black-sand beaches, a glacier walk, and icebergs on a lagoon &mdash; strung together by a genuinely novel swim: geothermal lagoons and hot pots, warm as a bath while the air stays cool. One nonstop each way, no Ring Road, no mid-trip flights.',
  stats: [['12', 'Hotel nights'], ['4', 'Sleep bases'], ['28', 'Stops mapped'], ['$11.4k', 'priced target']],
  split: [[45, 'Water', 'water'], [20, 'Towns & food', 'town'], [35, 'Nature', 'nature']],
  images: previewImages,
});

// ---------------------------------------------------------------------------
// Overview + why + stays + calendar (parts[0] tail)
// ---------------------------------------------------------------------------
const overview = `<section id="overview">
    <div class="section-label">
      <p class="eyebrow">The Plan at a Glance</p>
      <h2>The "photographs like nowhere else" trip</h2>
      <p>This is the deliberate contrast to the Mediterranean board and our recent Mexico trip: <b>epic, alien scenery</b> and a genuinely new swim register. The route is the <b>southwest/south linear corridor only</b> &mdash; Reykjavík, the Golden Circle, the South Coast waterfalls and black sand, and the glacier lagoons around Jökulsárlón &mdash; <b>not the full Ring Road</b>, which is too much driving with an 8-year-old in 12 nights.</p>
    </div>
    <div class="overview">
      <div class="ocard"><p class="eyebrow">Route</p><h4>KEF &rarr; Reykjavík &rarr; South Coast &rarr; Höfn &rarr; back west</h4><p><b>2 nights Reykjavík</b>, <b>4 nights South Coast</b> (Hvolsvöllur/Vík), <b>3 nights Höfn/southeast</b>, then <b>3 nights back west</b> near the airport. Home Mon Jun 21.</p></div>
      <div class="ocard"><p class="eyebrow">The swim is different on purpose</p><h4>Warm geothermal, never the sea</h4><p>The recurring "water" thread is <b>geothermal lagoons and hot pots</b> at 38-40&deg;C: Laugardalslaug, the Secret Lagoon, Hoffell\'s farm tubs, and the Blue Lagoon. The ocean is a frigid 50&deg;F you only photograph &mdash; the warm soak is the novel feature, not a downgrade.</p></div>
      <div class="ocard"><p class="eyebrow">Budget</p><h4>Priced target ~$11,420; high case ~$14,720</h4><p>Under the $12k target and the $15k hard cap. Cheap nonstop airfare offsets Iceland\'s high on-ground costs &mdash; lodging and food are the pressure points.</p></div>
      <div class="ocard"><p class="eyebrow">Logistics</p><h4>One nonstop each way, no mid-trip flights</h4><p>Icelandair flies <b>PIT&ndash;KEF nonstop</b> (seasonal). A single ticket, a single carrier, and a paved route needing no 4x4 &mdash; none of the mid-trip-flight fragility of the island trips.</p></div>
    </div>
  </section>

  <section id="why-this-trip" class="divider">
    <div class="section-label">
      <p class="eyebrow">Why This Trip</p>
      <h2>Chosen to look nothing like the rest of the board</h2>
      <p>Every other option is Mediterranean or tropical. Iceland is the deliberate outlier: sub-Arctic light, volcanoes, glaciers, and a swim that\'s warm water in cool air. It\'s the trip picked for the photographs and the novelty.</p>
    </div>
    <div class="plan-grid">
      ${card('The scenery register', `<p>Waterfalls you walk behind, a black-sand beach under basalt columns, a guided glacier walk, and icebergs glowing on a lagoon &mdash; a look the family has <b>never</b> come home with. This is the "wow photos" trip by design.</p>`)}
      ${card('The novel swim', `<p>Instead of a warm sea, the water thread is <b>geothermal</b>: four warm-lagoon/hot-pot soaks strung through the itinerary. Warm as a bath, steaming into cool air &mdash; a swim register the Med and Mexico simply don\'t have.</p>`)}
      ${card('Built around the kids', `<p>No Ring Road marathon. Reasonable daily drives, a glacier hike with an <b>age-8 minimum</b>, all-ages lagoons, puffins and geysers for the 8-year-old, and the midnight sun killing all time pressure. The 13-year-old gets the ice and the volcano country.</p>`)}
    </div>
  </section>

  <section id="stays" class="divider">
    <div class="section-label">
      <p class="eyebrow">Where We Stay</p>
      <h2>Four bases, minimal backtracking</h2>
      <p>A linear corridor east, then one long scenic drive back west. Book apartments with kitchens &mdash; Iceland groceries beat restaurant prices three meals a day.</p>
    </div>
    <div class="plan-grid">
      ${card('Reykjavík &middot; 2 nights', `${prow('Target', 'Downtown apartment / apart-hotel &middot; $220-300/night')}${prow('Why', 'Soft landing off the redeye; city, harbour boat, first geothermal soak')}${prow('Tradeoff', 'Priciest base; a 2-bed apartment with a kitchen is the value play')}`)}
      ${card('South Coast &middot; 4 nights', `${prow('Target', 'Hvolsvöllur / Vík guesthouse or family room &middot; $250-350/night')}${prow('Why', 'Central to Golden Circle, waterfalls, glacier walk, Reynisfjara')}${prow('Tradeoff', 'Wettest, windiest coast; rooms often sleep 2, so book a family room early')}`)}
      ${card('Höfn / southeast &middot; 3 nights', `${prow('Target', 'Höfn / near Jökulsárlón &middot; $250-400/night')}${prow('Why', 'Glacier lagoons, Skaftafell, Vestrahorn, langoustine town')}${prow('Tradeoff', 'Remote and pricey; Fosshotel Glacier Lagoon or Höfn town are the anchors')}`)}
      ${card('Back west / near KEF &middot; 3 nights', `${prow('Target', 'Reykjavík then Keflavík &middot; $200-280/night')}${prow('Why', 'Reykjanes day + Blue Lagoon + a stress-free morning flight')}${prow('Note', 'Grindavík lodging is off the table (evacuated) — base in Keflavík')}`)}
    </div>
  </section>`;

const calendar = H.calendarGrid({
  window: [2027, 6, 8, 6, 21],
  intro: 'The Jun 8-21 route as colored activity blocks &mdash; a color means the same thing on every itinerary. On this trip the <b>water blocks are all geothermal</b> (warm lagoons and hot pots), never the sea. Block times are schematic, snapped to a 2-hour grid; set them to real departures when flights and boats are booked.',
  tripDays: [
    { date: [6, 8], blocks: [{ act: 'air', start: 20, end: 22, label: '&#9992;&#65039; PIT&rarr;KEF redeye' }] },
    { date: [6, 9], blocks: [{ act: 'air', start: 6, end: 8, label: 'Land KEF' }, { act: 'car', start: 8, end: 10, label: '&rarr; Reykjavík' }, { act: 'water', start: 16, end: 18, label: 'Laugardalslaug' }] },
    { date: [6, 10], blocks: [{ act: 'town', start: 10, end: 14, label: 'Reykjavík city' }, { act: 'town', start: 14, end: 18, label: 'Whale/puffin boat' }] },
    { date: [6, 11], blocks: [{ act: 'car', start: 9, end: 11, label: 'Golden Circle' }, { act: 'hike', start: 11, end: 15, label: 'Þingvellir/Geysir/Gullfoss' }, { act: 'water', start: 16, end: 18, label: 'Secret Lagoon' }] },
    { date: [6, 12], blocks: [{ act: 'hike', start: 10, end: 16, label: 'Seljalandsfoss + Skógafoss' }] },
    { date: [6, 13], blocks: [{ act: 'hike', start: 9, end: 15, label: 'Sólheimajökull glacier' }, { act: 'town', start: 16, end: 18, label: 'Vík' }] },
    { date: [6, 14], blocks: [{ act: 'hike', start: 10, end: 14, label: 'Reynisfjara + Dyrhólaey' }, { act: 'rest', start: 14, end: 18, label: 'DC-3 / flex' }] },
    { date: [6, 15], blocks: [{ act: 'car', start: 9, end: 11, label: '&rarr; east' }, { act: 'hike', start: 11, end: 13, label: 'Fjaðrárgljúfur' }, { act: 'hike', start: 14, end: 16, label: 'Svartifoss' }] },
    { date: [6, 16], blocks: [{ act: 'water', start: 10, end: 12, label: 'Jökulsárlón boat' }, { act: 'water', start: 13, end: 15, label: 'Diamond Beach' }] },
    { date: [6, 17], blocks: [{ act: 'hike', start: 10, end: 12, label: 'Vestrahorn/Stokksnes' }, { act: 'water', start: 15, end: 17, label: 'Hoffell hot tubs' }, { act: 'town', start: 19, end: 21, label: 'Höfn langoustine' }] },
    { date: [6, 18], blocks: [{ act: 'car', start: 9, end: 17, label: '&rarr; west (Juneteenth)' }, { act: 'town', start: 19, end: 21, label: 'Reykjavík' }] },
    { date: [6, 19], blocks: [{ act: 'car', start: 10, end: 11, label: '&rarr; Reykjanes' }, { act: 'hike', start: 11, end: 16, label: 'Bridge/Gunnuhver/Seltún' }] },
    { date: [6, 20], blocks: [{ act: 'water', start: 10, end: 13, label: 'Blue Lagoon' }, { act: 'town', start: 14, end: 17, label: 'Reykjavík' }] },
    { date: [6, 21], blocks: [{ act: 'air', start: 12, end: 15, label: '&#9992;&#65039; KEF&rarr;PIT home' }] },
  ],
});

// ---------------------------------------------------------------------------
// Map + air + ground
// ---------------------------------------------------------------------------
const mapAirGround = `<section id="map" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Whole Trip, Mapped</p>
      <h2>Every stop on one map</h2>
      <p>Open <b>Map layers</b> to show or hide flights, lodging, hikes, beaches &amp; geothermal swims, viewpoints, towns, and restaurants. Tap a region to fly there, then click any pin for Google Maps.</p>
    </div>
    <div class="tripmap-wrap">
      <div class="mapbtns">
        <button data-region="reykjavik"><span class="sw" style="background:#1f6f78"></span>Reykjavík</button><button data-region="southcoast"><span class="sw" style="background:#c25a3a"></span>South Coast</button><button data-region="southeast"><span class="sw" style="background:#3f7d4e"></span>Southeast / Höfn</button><button data-region="reykjanes"><span class="sw" style="background:#3a6ea5"></span>Reykjanes</button><button data-region="transfer"><span class="sw" style="background:#7d5ba6"></span>Airport</button><button data-region="all">Whole trip</button>
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
      <h2>One nonstop each way &mdash; the cleanest logistics on the board</h2>
      <p>Research status: 2027 schedules aren\'t fully loaded yet, so current 2026 route/fare signals are the planning proxy. Re-quote once inventory opens.</p>
    </div>
    <div class="plan-grid">
      ${card('PIT &harr; KEF nonstop', `${prow('Carrier', 'Icelandair, seasonal summer nonstop (~5h50m)')}${prow('Timing', 'Eastbound redeye lands ~06:15; westbound lands PIT same day')}${prow('Family airfare gate', '~$2,600 target; high case ~$3,600')}${prow('Verify', 'Confirm the seasonal PIT nonstop still runs summer 2027')}`)}
      ${card('No mid-trip flights', `${prow('Ticket', 'One round-trip, one carrier — no self-transfer risk')}${prow('Contrast', 'None of the Madeira/island mid-trip-flight fragility')}${prow('Stopover', 'Icelandair\'s free-stopover perk exists but isn\'t needed here')}`)}
      ${card('If the nonstop is cut', `${prow('Backup', 'PIT &rarr; BOS/EWR/JFK/IAD &rarr; KEF one-stop on Icelandair or a US carrier')}${prow('PLAY', 'Not an option — PLAY exited all US routes in 2025')}${prow('Impact', 'Adds a connection but keeps a single European-style gateway')}`)}
      ${card('Jet lag', `${prow('Eastbound', 'Overnight; land in full daylight — keep day 1 gentle')}${prow('Westbound', 'Daytime flight, home the same calendar day')}${prow('Daylight', 'Midnight sun means no darkness to plan around')}`)}
    </div>
  </section>

  <section id="getting-around" class="divider">
    <div class="section-label">
      <p class="eyebrow">Getting Around</p>
      <h2>One rental car, paved the whole way</h2>
      <p>The SW/South corridor is entirely paved Route 1 and paved side roads &mdash; <b>no F-roads, no 4x4 required</b>. Rent one car for the whole trip; the hazard here is wind, not traction.</p>
    </div>
    <div class="plan-grid">
      ${card('The car', `${prow('Pick', 'Mid-size SUV for luggage + wind stability (2WD is legal/fine)')}${prow('Budget', '~$1,250-1,500 for 12 days, June')}${prow('Insurance', 'Add Gravel (GP) + Sand/Ash (SAAP) — worth it on the south coast')}`)}
      ${card('Fuel & tolls', `${prow('Petrol', '~210-220 ISK/L (~$6-6.80/gal); ~$220-240 for the route')}${prow('Road tax', 'New 2026 per-km charge (~$0.05/km) — ask how the agency bills it')}${prow('Tolls', 'Effectively toll-free; only a small ~$11 Höfn-area toll since 2026')}`)}
      ${card('Driving rules', `${prow('Headlights', 'On 24/7 — easy to forget in the midnight sun')}${prow('Wind', 'Hold the door with both hands; wind damage isn\'t covered and is the #1 claim')}${prow('Off-road', 'Illegal and heavily fined — stay on marked roads always')}`)}
      ${card('The daylight advantage', `${prow('June', '~21-22h of light; the sun barely dips')}${prow('Use it', 'Drive long legs in the "evening", hit famous falls at 10pm with no crowds')}${prow('Bridges', 'Single-lane bridges — first car to the bridge has priority')}`)}
    </div>
  </section>`;

// ---------------------------------------------------------------------------
// Health-check + timing
// ---------------------------------------------------------------------------
const healthTiming = `<section id="health-check" class="divider">
    <div class="section-label">
      <p class="eyebrow">Plan Health-Check</p>
      <h2>What to lock, watch, and expect</h2>
      <p>Current research refreshed mid-2026 for a June 2027 trip. Kids assumed 13 and 8.</p>
    </div>
    <div class="hc-grid">
      <div class="hc good"><span class="hc-tag">Solid</span><h4>Logistics are the cleanest on the board</h4><p>One nonstop each way, one rental car, a fully paved route with no F-roads and no mid-trip flights. Nothing here can strand the family between legs.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The Pittsburgh dates are protected</h4><p>Depart Tue Jun 8, fly home Mon Jun 21 (lands same day), ahead of the preferred Jun 23 return and the required full days in Pittsburgh on Jun 24-26.</p></div>
      <div class="hc actnow"><span class="hc-tag">Fixed</span><h4>Sky Lagoon can\'t be the family soak</h4><p>Sky Lagoon bans under-12s, so the 8-year-old can\'t enter. The plan routes the whole-family soaks through <b>all-ages</b> water instead &mdash; Laugardalslaug, Secret Lagoon, Hoffell, and the Blue Lagoon &mdash; with Sky Lagoon left as a teens/adults option.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Blue Lagoon can close on short notice</h4><p>The Reykjanes/Sundhnúkur system has erupted repeatedly since 2023 and the Blue Lagoon has closed for evacuations and air quality. Book it but keep Sky Lagoon or a city pool as a fallback, and check status within 48h via vedur.is.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Reynisfjara sneaker waves are lethal</h4><p>Real fatalities, including a 9-year-old in Aug 2025. Brief the kids firmly, stay on dry sand, obey the warning lights, and never turn your back to the ocean.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>On-ground costs, not airfare, drive the budget</h4><p>Flights are cheap; lodging and food are the pressure points. Apartments with kitchens keep the priced target near $11.4k and the high case under the $15k cap.</p></div>
    </div>
  </section>

  <section id="timing" class="divider">
    <div class="section-label">
      <p class="eyebrow">Best Time</p>
      <h2>Why early-to-mid June wins this constraint set</h2>
      <p>It gives 12 hotel nights, catches peak puffin/whale season and the midnight sun, spends Juneteenth (observed) on the road as a no-PTO day, and returns before the blackout.</p>
    </div>
    ${table(['Window', 'Nights', 'PTO', 'Blackout fit', 'Verdict'], [
      ['Jun 8-21', '12 hotel nights', '~8 days', 'Home Jun 21, before Jun 23', '<b>Use this</b>'],
      ['Jun 15-28', '12+', '~8-9 days', '<b>Invalid</b> — away during Jun 24-26', 'Reject'],
      ['Jun 27-Jul 10', '12+', '~9 days', 'Valid', 'Backup if June nonstop pricing fails'],
      ['Jul / Aug', '12+', '~9-10 days', 'Valid', 'Peak crowds and prices; longer daylight fading'],
    ])}
    <div class="verdict-box" style="border-left-color:var(--c3);margin-top:18px"><h4>PTO math (recomputed for 2027)</h4><p>Departing Tue Jun 8 after work and flying home Mon Jun 21, the working days needing PTO are Jun 9-11 (Wed-Fri), Jun 14-17 (Mon-Thu) and Jun 21 (Mon) &mdash; with <b>Fri Jun 18 covered by Juneteenth (observed)</b> and both weekends free. That\'s <b>~8 PTO days for 12 nights</b>. The calendar rule allows a Jun 23 return and requires full days in Pittsburgh Jun 24-26; this plan is home two days earlier.</p></div>
  </section>`;

// ---------------------------------------------------------------------------
// Budget + totals + tips
// ---------------------------------------------------------------------------
const budgetTips = `<section id="budget" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Money</p>
      <h2>Budget, savers &amp; splurges</h2>
      <p>Real priced planning target using 2026 route/fare/lodging signals because June 2027 inventory isn\'t fully live. USD, family of four.</p>
    </div>
    ${table(['Line item', 'Target case', 'High case'], [
      ['PIT &harr; KEF nonstop airfare (family of 4)', '$2,600', '$3,600'],
      ['Lodging: 12 hotel nights', '$3,200', '$3,900'],
      ['Rental SUV, fuel, road tax, tolls', '$1,570', '$1,920'],
      ['Food and groceries, 13 travel days', '$2,300', '$2,700'],
      ['Activities: glacier hike, boats, lagoons, tickets', '$1,250', '$1,600'],
      ['Insurance, eSIM, fees, buffer', '$500', '$1,000'],
      ['<b>Grand total</b>', '<b>$11,420</b>', '<b>$14,720</b>'],
    ])}
    <div class="twocol">
      <div class="listcard save-list"><h4>Save money</h4><ul><li>Book apartments with kitchens; a Bónus/Krónan grocery run beats three restaurant meals a day.</li><li>Use Laugardalslaug and the Secret Lagoon (kids free) instead of stacking premium lagoons.</li><li>Most waterfalls, black beaches, and all of Reykjanes are free — the scenery doesn\'t cost anything.</li><li>Walk the free Jökulsárlón shore rather than paying for both a boat and Diamond Beach.</li><li>Book the earliest, cheapest Blue Lagoon slot the morning you fly out.</li></ul></div>
      <div class="listcard splurge-list"><h4>Worth the splurge</h4><ul><li>The Sólheimajökull guided glacier walk — the marquee family adventure.</li><li>The Jökulsárlón amphibian iceberg boat.</li><li>A Höfn langoustine dinner at Pakkhús or Humarhöfnin.</li><li>The whale + puffin boat combo from Reykjavík.</li><li>Sky Lagoon for the adults + teen on the arrival evening.</li></ul></div>
    </div>
  </section>

  <section id="totals" class="divider">
    <div class="section-label">
      <p class="eyebrow">Bottom Line</p>
      <h2>Total trip cost</h2>
      <p>Cheap nonstop airfare is what makes an otherwise-expensive country land under target. Discipline on lodging and food keeps the high case under the $15k hard cap.</p>
    </div>
    ${table(['Category', 'Estimate'], [
      ['Flights (nonstop, family of 4)', '$2,600 target / $3,600 high'],
      ['Lodging, 12 hotel nights', '$3,200 target / $3,900 high'],
      ['Rental car, fuel, road tax, tolls', '$1,570 target / $1,920 high'],
      ['Food, groceries, activities, tickets', '$3,550 target / $4,300 high'],
      ['Insurance, eSIM, fees, buffer', '$500 target / $1,000 high'],
      ['<b>Grand total — family of 4</b>', '<b>$11,420 target / $14,720 high</b>'],
    ])}
    <p class="rate-note">Per-day itinerary costs cover food + activities only. Lodging, flights, the rental car, and insurance sit in the totals above, not the daily numbers. Lands under the $12k target and the $15k hard cap.</p>
  </section>

  <section id="tips" class="divider">
    <div class="section-label">
      <p class="eyebrow">Travel Tips</p>
      <h2>The stuff nobody tells you</h2>
      <p>Operational rules that keep a beautiful route from turning fragile.</p>
    </div>
    <div class="tips-order">
      <p class="mini-h">Book in roughly this order</p>
      <ol>
        <li>Icelandair PIT-KEF nonstop<span> &middot; verify the seasonal route runs summer 2027, then buy when priced right</span></li>
        <li>Apartments with kitchens in all four bases<span> &middot; family rooms book out early for June</span></li>
        <li>One rental SUV with GP + SAAP insurance<span> &middot; the whole trip, KEF to KEF</span></li>
        <li>Timed lagoon + boat slots<span> &middot; Blue Lagoon, Secret Lagoon, Jökulsárlón, whale/puffin</span></li>
        <li>The Sólheimajökull glacier walk (age-8 tour)<span> &middot; confirm the shoe-size minimum for the 8-year-old</span></li>
      </ol>
    </div>
    <div class="tips-grid">
      <div class="tipcard"><h4>Water &amp; swim</h4><p class="sub">Geothermal, never the sea</p><ul><li><b>Every swim is a warm lagoon or hot pot</b> — pack swimsuits, not wetsuits.</li><li><b>Shower naked before entering</b> — Icelandic pool etiquette is strict and enforced.</li><li><b>Blue Lagoon and boats need timed pre-booking</b> and sell out in summer.</li></ul></div>
      <div class="tipcard t2"><h4>Safety</h4><p class="sub">The scenery has teeth</p><ul><li class="flag"><b>Reynisfjara sneaker waves kill</b> — stay on dry sand, obey the warning lights.</li><li><b>Never walk on a glacier unguided</b> — crevasses; use the certified tours only.</li><li><b>Install the 112 Iceland app</b> — it sends your GPS to rescue teams.</li></ul></div>
      <div class="tipcard t3"><h4>Driving</h4><p class="sub">Wind is the real hazard</p><ul><li class="flag"><b>Hold the car door against the wind</b> — door damage isn\'t insured and is the #1 claim.</li><li><b>Headlights on 24/7</b>, even at midnight in full sun.</li><li><b>No F-roads on this route</b> — a 4x4 isn\'t required, but SUV wind-stability helps.</li></ul></div>
      <div class="tipcard t4"><h4>Money &amp; food</h4><p class="sub">Cashless and expensive</p><ul><li><b>Iceland is nearly cashless</b> — a PIN card runs everything, including fuel pumps.</li><li><b>Drink the tap water</b> — it\'s glacial and free; never buy bottled.</li><li><b>Groceries + kitchens</b> are the single biggest cost saver.</li></ul></div>
    </div>
  </section>`;

// ---------------------------------------------------------------------------
// Social + balance + status
// ---------------------------------------------------------------------------
const socialBalanceStatus = `<section id="social" class="divider">
    <div class="section-label">
      <p class="eyebrow">What People Are Saying</p>
      <h2>Research signals to keep in mind</h2>
      <p>Official sources and current route/fare data point the same way: the SW/South corridor is the right scope, and the warm-lagoon swim is the trip\'s signature.</p>
    </div>
    <div class="plan-grid">
      ${card('Scope signal', `<p>Guides and families agree the full Ring Road is too much in ~12 days with a young child. The Reykjavík &rarr; South Coast &rarr; Jökulsárlón corridor delivers the iconic scenery on reasonable daily drives, then one scenic day back west.</p>`)}
      ${card('Swim signal', `<p>The consistent advice: the sea is for photographs, the lagoons are for swimming. Building the water thread around geothermal soaks is exactly how families actually experience Iceland\'s "swimming".</p>`)}
      ${card('Safety signal', `<p>The two repeated warnings from every credible source are Reynisfjara\'s sneaker waves and unguided glaciers. Both are designed out of this plan — safe distances and certified guides only.</p>`)}
    </div>
  </section>

  <section id="balance" class="divider">
    <div class="section-label">
      <p class="eyebrow">Trip Balance</p>
      <h2>What the days add up to</h2>
      <p>Nature-forward, with the geothermal soaks doing double duty as both the "water" and the recovery days that keep the driving sustainable for the kids.</p>
    </div>
    <div class="bar"><i style="width:45%;background:#3a6ea5"></i><i style="width:20%;background:#c25a3a"></i><i style="width:35%;background:#3f7d4e"></i></div>
    <div class="balance">
      <div class="bcard k1"><div class="pct">45%</div><h4>Water &middot; Geothermal Lagoons</h4><p>Laugardalslaug, the Secret Lagoon, Hoffell hot tubs, the Blue Lagoon, plus the black-sand beaches you photograph rather than swim.</p></div>
      <div class="bcard k2"><div class="pct">20%</div><h4>Towns &middot; Food &middot; Reset</h4><p>Reykjavík, Vík, Höfn\'s langoustine harbour, Keflavík, groceries, and the midnight-sun evening walks.</p></div>
      <div class="bcard k3"><div class="pct">35%</div><h4>Waterfalls &middot; Glaciers &middot; Volcanoes</h4><p>The Golden Circle, Seljalandsfoss and Skógafoss, the Sólheimajökull glacier walk, Skaftafell, Jökulsárlón, Vestrahorn, and the Reykjanes lava fields.</p></div>
    </div>
  </section>

  <section id="status" class="divider">
    <div class="section-label"><p class="eyebrow">Settled &amp; Open</p><h2>What is decided, what still needs a call</h2><p>The route is opinionated, but 2027 schedules, lodging prices, and volcanic status still need live re-checks before booking.</p></div>
    <div class="status"><div class="scol settled"><h4>Settled</h4>
      <div class="row"><b>Slug</b><span>iceland</span></div>
      <div class="row"><b>Route</b><span>Reykjavík 2 nights &rarr; South Coast 4 &rarr; Höfn/southeast 3 &rarr; back west 3. SW/South corridor only, no Ring Road.</span></div>
      <div class="row"><b>Dates</b><span>Depart Tue Jun 8, 2027; home Mon Jun 21, ahead of the preferred Jun 23 return and required Pittsburgh days Jun 24-26.</span></div>
      <div class="row"><b>Swim identity</b><span>Geothermal lagoons and hot pots as the recurring warm-water thread; sea is photograph-only.</span></div>
      <div class="row"><b>Budget verdict</b><span>$11,420 target / $14,720 high case, under both the $12k target and the $15k hard cap.</span></div>
    </div><div class="scol open"><h4>Open</h4>
      <div class="row"><b>Nonstop confirmation</b><span>Verify the seasonal Icelandair PIT-KEF nonstop still runs summer 2027; hold a one-stop backup.</span></div>
      <div class="row"><b>Blue Lagoon status</b><span>Reykjanes volcanic activity can close it — confirm within 48h and keep a fallback soak.</span></div>
      <div class="row"><b>Glacier age check</b><span>Confirm the 8-year-old meets Tröll\'s EU-34 shoe minimum for crampons on the Sólheimajökull walk.</span></div>
      <div class="row"><b>Hub promotion</b><span>This renders as an unranked page; adding it to the decision dashboard (scorecard + scoreboard row) is a separate step.</span></div>
    </div></div>
  </section>`;

// ---------------------------------------------------------------------------
// Pre-departure to-dos
// ---------------------------------------------------------------------------
const todo = {
  labelHtml: `
      <p class="eyebrow">Pre-Departure To-Do</p>
      <h2>What to book before leaving</h2>
      <p>Exact planning sequence for the Jun 8-21, 2027 Iceland route. Timed lagoons and boats sell out in summer, so tracking and booking are separate decisions.</p>
    `,
  blocks: [
    {
      when: 'Jul-Sep 2026',
      tone: 'hot',
      title: 'Confirm the nonstop and start tracking fares',
      note: 'The seasonal PIT-KEF nonstop is the whole logistics advantage — verify it, then buy when the family total is right.',
      items: [
        '<b>Confirm Icelandair still runs the PIT-KEF summer nonstop for 2027</b> and watch the family-of-4 total (target ~$2.6k).',
        '<b>Hold a one-stop backup</b> via BOS/EWR/JFK/IAD in case the seasonal route is cut. (PLAY is no longer a US option.)',
        '<b>Set the airfare gate:</b> buy under ~$3.6k family including seats and bags.',
      ],
    },
    {
      when: 'By Oct 2026',
      title: 'Hold refundable lodging in all four bases',
      items: [
        '<b>Reykjavík:</b> 2-night downtown apartment with a kitchen.',
        '<b>South Coast:</b> 4-night Hvolsvöllur/Vík family room (books out early).',
        '<b>Höfn/southeast:</b> 3 nights near Jökulsárlón or in Höfn.',
        '<b>Back west:</b> 3 nights (Reykjavík then Keflavík — not Grindavík).',
      ],
    },
    {
      when: 'Winter 2026-27',
      tone: 'watch',
      title: 'Car, documents, and the big-ticket activities',
      items: [
        '<b>Reserve one SUV, KEF to KEF,</b> with Gravel (GP) + Sand/Ash (SAAP) insurance.',
        '<b>Book the Sólheimajökull glacier walk</b> (Tröll age-8 tour) and confirm the shoe-size minimum.',
        '<b>Check passports, ETIAS status, travel insurance, IDPs,</b> and buy an eSIM.',
      ],
    },
    {
      when: '60-30 days out',
      title: 'Lock the timed slots',
      items: [
        '<b>Book the Blue Lagoon</b> (earliest slot on fly-home day) and the Jökulsárlón amphibian boat.',
        '<b>Reserve the Secret Lagoon slot</b> and the Reykjavík whale/puffin boat.',
        '<b>Pre-book any Höfn langoustine dinner</b> (Humarhöfnin takes reservations; Pakkhús does not).',
      ],
    },
    {
      when: 'Final 2 weeks',
      tone: 'done',
      title: 'Operational checks',
      items: [
        '<b>Check volcanic + road status</b> on vedur.is and safetravel.is; install the 112 Iceland app.',
        '<b>Download offline maps</b> for the whole Route 1 corridor and Reykjanes.',
        '<b>Pack layers, waterproofs, swimsuits, sturdy boots, sunglasses, an eye mask</b> (midnight sun), and printed confirmations.',
      ],
    },
  ],
  callout: '<b>Do not forget:</b> the whole plan hinges on the nonstop and the timed slots. Confirm the flight first, book the lagoons and boats early, and keep a fallback soak in case the Blue Lagoon closes for volcanic activity.',
};

// ---------------------------------------------------------------------------
// Map scripts (swap points + colors; keep template map TYPES + OSM tile fix)
// ---------------------------------------------------------------------------
let scripts = T.parts[12].html
  .replace(/window\.__MAP_POINTS__=.*?;window\.__MAP_COLORS__=/s, `window.__MAP_POINTS__=${JSON.stringify(mapPoints)};window.__MAP_COLORS__=`)
  .replace(/window\.__MAP_COLORS__=.*?;window\.__MAP_TYPES__=/s, `window.__MAP_COLORS__=${JSON.stringify(mapColors)};window.__MAP_TYPES__=`)
  .replace(
    /L\.tileLayer\('https:\/\/maps\.[^']+',\{maxZoom:19,attribution:'&copy; OpenStreetMap contributors, [^']+'\}\)\.addTo\(map\);/,
    "L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);",
  );

// ---------------------------------------------------------------------------
// Scorecard — PROVISIONAL axes (user will finalize the rank). build-summary
// requires a scorecard + TOKEN for every trip; recommended:true + an index.html
// card puts it on the ranked hub. /50 = budget×2 + the 8 scored axes.
// ---------------------------------------------------------------------------
const scorecard = H.assertBaked({
  displayName: 'Iceland',
  blurb: 'Photographs like nowhere else',
  axes: {
    budget: 3,
    weather: 2,
    swim: 3,
    variety: 5,
    ease: 4,
    food: 3,
    risk: 3,
    nights: 5,
    novelty: 5,
    pto: 3,
  },
  weightDefaults: {
    budget: 2, weather: 1, swim: 1, variety: 1, ease: 1, food: 1, risk: 1, nights: 1, novelty: 1, pto: 0,
  },
  budget: { floorUsd: 11420, ceilUsd: 14720, targetUsd: 12000, capUsd: 15000 },
  pto: { days: 8, nights: 12 },
  facets: {
    continent: 'europe',
    maxConnections: 0,
    swimTempF: [50, 52],
    heatedSwimTempF: [100, 104],
    swimType: 'geothermal',
    noPassport: false,
    singleTicket: true,
    hasSwim: true,
  },
  totalBaked: 36,
});

// ---------------------------------------------------------------------------
// Chrome + assembly
// ---------------------------------------------------------------------------
const { headBody, navToMain } = H.sliceChrome(T.parts[0].html, 'Iceland &middot; Reykjavík, South Coast & Glacier Lagoons — June 2027');

const data = {
  recommended: true,
  countries: ['iceland'],
  packingTags: ['hiking', 'rain'],
  slug: 'iceland',
  lang: 'en',
  title: 'Iceland · Reykjavík, South Coast & Glacier Lagoons — June 2027',
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  overrides: {
    packing: [
      '<b>Warm layers:</b> fleece/light puffer, hats, gloves — June highs are only ~55&deg;F and windy.',
      '<b>Waterproof everything:</b> rain shells and rain pants; you\'ll walk behind waterfalls and through blowing spray.',
      '<b>Swimsuits + quick-dry towels:</b> four geothermal soaks — swimsuits, not wetsuits.',
      '<b>Sturdy waterproof boots:</b> for the glacier walk, canyon rims, and slick waterfall paths.',
      '<b>Sunglasses + a sleep eye-mask:</b> the midnight sun never sets — the mask is essential for the kids.',
      '<b>Reusable water bottle:</b> tap water is glacial and free everywhere; skip bottled.',
    ],
  },
  itinerary: {
    className: 'divider',
    labelHtml: `
      <p class="eyebrow">The Itinerary</p>
      <h2>Day by day</h2>
      <p>Swipe each carousel for photos. Every stop carries its cost, a money-saving tip, a splurge, picky-kid restaurants, backup / if-time ideas, links, and a map. Daily costs are food + activities only, not flights, lodging, or the car.</p>
`,
    daysClass: 'days',
    days,
  },
  parts: [
    { t: 'raw', html: `${headBody}${preview}${navToMain}${overview}\n\n  ${calendar}` },
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
