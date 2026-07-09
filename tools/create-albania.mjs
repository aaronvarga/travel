#!/usr/bin/env node
/**
 * create-albania.mjs — Albania: Theth & the Accursed Mountains -> the Albanian Riviera.
 * Madeira replacement: alpine epic + real warm-water swim payoff, no Atlantic-island flight trap.
 * Clones the hawaii layout for chrome; rebuilds all destination content from researched data.
 * Unranked new trip: recommended:false, NO scorecard (promotion into the hub is a separate step).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as H from '/Users/aaron/.claude/skills/travel-itinerary/scripts/itinerary-helpers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const outDir = path.join(root, 'src/_data/albania');

const { unsplash: U, pexels: P, img, point, mkSpot, day, travelDay, fact, card, prow, table, preview, calendarGrid, sliceChrome, assertBaked } = H;

const { headBody, navToMain } = sliceChrome(T.parts[0].html, 'Albania &middot; Accursed Mountains to the Riviera &mdash; June 2027');

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------
const mapColors = { tirana: '#7d5ba6', theth: '#3f7d4e', riviera: '#1f6f78', transfer: '#c25a3a' };

const mapPoints = [
  point('Tirana Airport (TIA / Rinas)', 41.4147, 19.7206, 'transfer', 'flight'),
  point('Skanderbeg Square / central Tirana', 41.3275, 19.8189, 'tirana', 'town'),
  point('Pazari i Ri (New Bazaar) dinner zone', 41.3283, 19.8236, 'tirana', 'food'),
  point('Dajti Ekspres cable car', 41.3606, 19.9236, 'tirana', 'view'),
  point('Shkoder / Rozafa Castle (gateway)', 42.0486, 19.4903, 'theth', 'view'),
  point('Theth village & stone church', 42.3944, 19.7683, 'theth', 'hotel'),
  point('Grunas Waterfall', 42.3783, 19.7856, 'theth', 'hike'),
  point('Blue Eye of Theth (via Nderlysaj)', 42.3486, 19.8069, 'theth', 'view'),
  point('Valbona Pass (Qafa e Valbones ~1,800m)', 42.4128, 19.8300, 'theth', 'hike'),
  point('Koman Lake ferry', 42.1039, 19.8236, 'theth', 'view'),
  point('Llogara Pass (Riviera reveal)', 40.2033, 19.5906, 'riviera', 'view'),
  point('Himare / Livadhi beach', 40.1017, 19.7450, 'riviera', 'town'),
  point('Gjipe Beach & canyon', 40.1636, 19.6472, 'riviera', 'beach'),
  point('Porto Palermo castle & bay', 40.0625, 19.7900, 'riviera', 'view'),
  point('Ksamil beaches & islets', 39.7686, 20.0064, 'riviera', 'hotel'),
  point('Butrint National Park (UNESCO)', 39.7456, 20.0206, 'riviera', 'view'),
  point('Blue Eye of Sarande (Syri i Kalter)', 39.9247, 20.1878, 'riviera', 'view'),
  point('Sarande port (Corfu ferry)', 39.8756, 20.0053, 'transfer', 'flight'),
  point('Corfu Airport (CFU) — fly home', 39.6019, 19.9117, 'transfer', 'flight'),
];

// ---------------------------------------------------------------------------
// Photos (all IDs verified reachable via scripts/verify_images.py)
// ---------------------------------------------------------------------------
const tiranaImgs = [
  img(P('11126448'), 'Tirana skyline at golden hour', 'Valter Zhara &middot; Pexels License'),
  img(P('14643117'), 'Skanderbeg Square, central Tirana', 'Eva Hamitaj &middot; Pexels License'),
  img(P('36910861'), 'Tirana under Dajti Mountain', 'Beka &middot; Pexels License'),
];
const shkoderImgs = [
  img(P('30459667'), 'Rozafa Castle wall at sunset', 'Sebastian Wright &middot; Pexels License'),
  img(P('34062037'), 'Lake Shkodra panorama from Rozafa', 'mfbeki &middot; Pexels License'),
  img(P('29201405'), 'Rozafa ramparts and the Albanian flag', 'necatiomerk &middot; Pexels License'),
];
const grunasImgs = [
  img(P('12937451'), 'Grunas Waterfall over mossy rock', 'Ledana Mance &middot; Pexels License'),
  img(P('12937449'), 'Grunas cascade in Theth National Park', 'Ledana Mance &middot; Pexels License'),
];
const thethImgs = [
  img(P('17841141'), 'Theth stone church at twilight', 'Maxed Raw &middot; Pexels License'),
  img(P('35810738'), 'Theth valley with the church below the peaks', 'Abstracts Photo &middot; Pexels License'),
  img(P('13643780'), 'Theth church against the Accursed Mountains', 'Klajdi Cena &middot; Pexels License'),
];
const blueEyeThethImgs = [
  img(P('13891425'), 'Turquoise pool below a Theth cascade', 'Valter Zhara &middot; Pexels License'),
  img(P('13149225'), 'Crystal-clear forest stream, Theth', 'Sabina Kallari &middot; Pexels License'),
  img(P('11971154'), 'Glacial-blue Valbona-valley river', 'Valter Zhara &middot; Pexels License'),
];
const valbonaImgs = [
  img(P('28837420'), 'Accursed Mountains at sunset over Valbona', 'Sabina Kallari &middot; Pexels License'),
  img(P('28641875'), 'Lone hiker on a Valbona ridge trail', 'Sabina Kallari &middot; Pexels License'),
  img(P('28580670'), 'Limestone peaks of Valbona National Park', 'Sabina Kallari &middot; Pexels License'),
];
const komanImgs = [
  img(P('36766373'), 'Koman Lake between sheer fjord walls', 'Kokorevas &middot; Pexels License'),
  img(P('36766366'), 'The ferry threading the Koman canyon', 'Kokorevas &middot; Pexels License'),
  img(P('30172331'), 'Clear blue water ringed by mountains, Koman', 'Nbasak &middot; Pexels License'),
];
const llogaraImgs = [
  img(U('1738248000826-3c9cbbe3189b'), 'Llogara Pass vista over the Riviera', 'Marie Volkert &middot; Unsplash License'),
  img(U('1742244049253-5ff61512657a'), 'Dhermi white village above the turquoise shore', 'Adventure Albania &middot; Unsplash License'),
  img(P('34017466'), 'Aerial of the Dhermi coastline', 'ani kameraj &middot; Pexels License'),
];
const ksamilImgs = [
  img(U('1648046143698-1204e59eb43b'), 'Ksamil islet ringed by turquoise water', 'Bleron Salihi &middot; Unsplash License'),
  img(U('1653982969676-2408ca464041'), 'Ksamil cove with umbrellas and boats', 'Bleron Salihi &middot; Unsplash License'),
  img(P('34092443'), 'Ksamil beach and clear Ionian water', 'Laura Meinhardt &middot; Pexels License'),
];
const butrintImgs = [
  img(U('1741267087595-833115cb7e22'), 'Ancient stone gate in the Butrint forest', 'Marie Volkert &middot; Unsplash License'),
  img(U('1685012777017-b9b282f61613'), 'Weathered columns at Butrint', 'Herolinda Pollozhani &middot; Unsplash License'),
  img(U('1742243910186-c31c321abb53'), 'Pulebardha cove inside Butrint NP', 'Adventure Albania &middot; Unsplash License'),
];
const northCoastImgs = [
  img(P('14427064'), 'Aerial of the Sarande–Riviera coast', 'Andreas Ebner &middot; Pexels License'),
  img(P('33127955'), 'Rocky Ionian shoreline near Sarande', 'Paolo Bici &middot; Pexels License'),
  img(P('20398875'), 'Steep summer mountains over the water', 'Kujtim Shabani &middot; Pexels License'),
];
const blueEyeSarandeImgs = [
  img(P('33039995'), 'The turquoise Blue Eye spring of Sarande', 'Arlind Photography &middot; Pexels License'),
  img(P('33714700'), 'Emerald karst spring in the forest', 'Salihzkr &middot; Pexels License'),
  img(P('33714690'), 'Blue Eye of Sarande boardwalk', 'Salihzkr &middot; Pexels License'),
];

// ---------------------------------------------------------------------------
// Spots
// ---------------------------------------------------------------------------
const tiranaSpot = mkSpot({
  name: 'Tirana: Bunk’Art 2 + Skanderbeg Square + Pazari i Ri',
  tags: ['tirana', 'bunkart', 'skanderbegsquare'],
  carouselId: 'c-tirana',
  images: tiranaImgs,
  lat: 41.3275, lng: 19.8189,
  cost: 'Cheap and cash-friendly. Bunk’Art 2 about 900 lek (~€9) adult / reduced child; a Bunk’Art 1+2 combo is 1,300 lek (~€13, valid 72h). Skanderbeg Square and Et’hem Bey Mosque are free. A bazaar-grill family dinner runs about 2,500–4,000 lek (~$27–43).',
  climateLabel: 'Weather',
  climate: '<b>June in Tirana:</b> highs about 78–82°F, lows about 61–66°F, mostly sunny with a chance of an afternoon shower. Perfect for a slow first-evening walk.',
  save: 'Do the arrival day on foot: Bunk’Art 2, Skanderbeg Square, Et’hem Bey Mosque, and a bazaar-grill dinner are all a few minutes apart. Withdraw lek from an ATM (choose “without conversion”) — the bunker museums and market stalls are cash only.',
  splurge: 'Add the Dajti Ekspres cable car (~1,500 lek / €15 round trip, 15 min each way) — <b>but note it is CLOSED on Tuesdays</b>, which is arrival day, so schedule it for a different Tirana touch or skip it.',
  restos: [
    '<a href="https://www.google.com/maps/search/Zgara+te+Pazari+Tirana" target="_blank" rel="noreferrer"><b>Zgara te Pazari</b></a> — classic bazaar grill; <b>plain grilled chicken / qofte + fries</b> is the safest picky-kid table in town, cheap and fast',
    '<a href="https://www.google.com/maps/search/Era+Restaurant+Tirana" target="_blank" rel="noreferrer"><b>Era</b></a> — long-running crowd-pleaser doing Albanian plus <b>pizza and pasta</b>; the reliable “everyone finds something” fallback',
    '<a href="https://www.google.com/maps/search/Oda+Restaurant+Tirana" target="_blank" rel="noreferrer"><b>Oda</b></a> — atmospheric traditional room by the bazaar (tave kosi, fergese, grills); order kids the grilled chicken + bread + fries',
  ],
  alts: [
    '<b>Dajti Ekspres cable car</b> for an effortless mountain-top panorama — only on a non-Tuesday.',
    '<b>Pyramid of Tirana</b>, now a walkable stepped park, is a good sunset landmark a short stroll away.',
    '<b>Bunk’Art 1</b> (the huge 5-story bunker at the Dajti edge) if you want the deeper Cold-War museum on a fuller, non-arrival day.',
  ],
  blogs: [
    { label: 'Bunk’Art official', href: 'https://www.bunkart.al/' },
    { label: 'Dajti Ekspres info (Tuesday closure)', href: 'https://albaniatourguide.com/is-the-dajti-cable-car-worth-it-price-time-length-opening-times-getting-there-dajti-ekspres/' },
  ],
});

const shkoderSpot = mkSpot({
  name: 'Shkoder & Rozafa Castle — gateway to the Alps',
  tags: ['shkodra', 'rozafacastle', 'lakeshkoder'],
  carouselId: 'c-shkoder',
  images: shkoderImgs,
  lat: 42.0486, lng: 19.4903,
  cost: 'Rozafa Castle entry is a few hundred lek per adult (~€3–5), kids reduced. A lakeside lunch for four runs roughly €30–50. This is a half-day stop on the drive up, not a paid-attraction day.',
  climateLabel: 'Weather',
  climate: '<b>Warm lowland stop</b> before the mountains: June highs in the low 80s°F. Golden hour on the castle walls over Lake Shkodra and the Buna/Drin confluence is the photo.',
  save: 'Stretch the legs at Rozafa Castle and grab a lakeside fish lunch, then push on to Theth. Fill the fuel tank in <b>Koplik</b> — there is no petrol station in Theth.',
  splurge: 'If you leave Tirana early, a short Lake Shkodra boat spin or a stop at the Ottoman <b>Mesi Bridge</b> makes the transition day its own small adventure.',
  restos: [
    '<a href="https://www.google.com/maps/search/fish+restaurant+Lake+Shkodra+Shiroka" target="_blank" rel="noreferrer"><b>Shiroka lakeside restaurants</b></a> — grilled lake fish, plus <b>pasta, fries, and grilled chicken</b> for the kids',
    '<a href="https://www.google.com/maps/search/pizza+Shkoder+center" target="_blank" rel="noreferrer"><b>Shkoder center pizzerias</b></a> — the pedestrian café street has easy wood-fired pizza before the mountain leg',
  ],
  alts: [
    '<b>Mesi Bridge</b> (Ottoman stone arch) for a quick photogenic leg-stretch north of town.',
    '<b>Lake Shkodra shore</b> for a swim or bike if the day is running ahead of schedule.',
    '<b>Venice Art Mask Factory</b> if a rain shower interrupts the outdoor plan.',
  ],
  blogs: [
    { label: 'SH21 road-to-Theth conditions', href: 'https://carhirealbania.com/sh21-to-theth-safe-drive/' },
    { label: 'Driving the road to Theth', href: 'https://thetravelfolk.com/road-to-theth-albania/' },
  ],
});

const grunasSpot = mkSpot({
  name: 'Grunas Waterfall — the best family hike from the village',
  tags: ['grunaswaterfall', 'theth', 'albanianalps'],
  carouselId: 'c-grunas',
  images: grunasImgs,
  lat: 42.3783, lng: 19.7856,
  cost: 'Free (national-park land). This is a no-ticket day — just water, snacks, and good shoes.',
  climateLabel: 'Trail',
  climate: '<b>Easy-to-moderate, ~2.5 km each way, 2–3 hr round trip with kids.</b> Flat riverside start, then a ~200 m climb with one steep final section. Well within an 8-year-old’s ability with breaks.',
  save: 'Walk straight from the Theth church; no guide or transport needed. Pair it with the village church and the lock-in tower for a full, low-cost first mountain day.',
  splurge: 'Grab byrek and fresh trout at a trailside guesthouse café on the way back instead of self-catering.',
  restos: [
    '<b>Your guesthouse half-board dinner</b> — the default and usually excellent: bread, byrek, pasta, grilled meat, fresh dairy; tell the host about dislikes and they accommodate',
    '<a href="https://www.google.com/maps/search/Theth+guesthouse+restaurant" target="_blank" rel="noreferrer"><b>Village guesthouse cafés</b></a> — simple omelets, fries, and byrek for lunch between hikes',
  ],
  alts: [
    '<b>Kulla e Ngujimit (lock-in tower)</b> — the blood-feud refuge tower, now a tiny museum (~150 lek); the “castle where the men hid” framing lands with both kids.',
    '<b>Theth church meadow</b> at golden hour for the postcard shot of the whole region.',
    '<b>Riverside picnic</b> below the village if legs are tired after the drive in.',
  ],
  blogs: [
    { label: 'Theth National Park overview', href: 'https://adventurealbania.com/theth/' },
  ],
});

const thethSpot = mkSpot({
  name: 'Theth village: the stone church, the meadow, the kulla towers',
  tags: ['theth', 'thethchurch', 'kulla'],
  carouselId: 'c-thethvillage',
  images: thethImgs,
  lat: 42.3944, lng: 19.7683,
  cost: 'Village wandering is free. The Kulla e Ngujimit (lock-in tower) museum is about 150 lek (~$1.50); locals from the next house open it on request. Guesthouse half-board runs roughly €20–35 per person.',
  climateLabel: 'Alpine',
  climate: '<b>Theth sits at 770 m:</b> June valley highs ~73°F, but <b>nights are genuinely cold (~46–54°F)</b> and the pass is colder. Pack real layers and warm sleep clothes. Afternoon thunderstorms are the operative hazard.',
  save: 'The church, the meadows, and the stone kulla towers cost nothing and are the visual heart of the valley — shoot them at golden hour.',
  splurge: 'A local guide for a half-day of valley history and the Kanun (mountain-law) code turns the towers from photo stops into a story.',
  restos: [
    '<b>Guesthouse family dinner</b> — set, multi-course, home-cooked (often with house wine and welcome raki); the best food in the valley',
    '<a href="https://www.google.com/maps/search/Bujtina+Polia+Theth" target="_blank" rel="noreferrer"><b>Bujtina Polia</b></a> — the best-documented Theth bujtina; hearty half-board with plenty of plain options for kids',
  ],
  alts: [
    '<b>Grunas Waterfall</b> if you have not already done it — the natural companion to a village day.',
    '<b>Blue Eye of Theth</b> as a half-day if weather closes the higher trails.',
    '<b>Slow recovery day</b> — the valley rewards doing less; read in the meadow before the big pass day.',
  ],
  blogs: [
    { label: 'Theth guesthouses & half-board', href: 'https://adventurealbania.com/theth/' },
  ],
});

const blueEyeThethSpot = mkSpot({
  name: 'Blue Eye of Theth (Syri i Kalter) — the turquoise spring',
  tags: ['blueeyeoftheth', 'syrikalter', 'theth'],
  carouselId: 'c-blueeyetheth',
  images: blueEyeThethImgs,
  lat: 42.3486, lng: 19.8069,
  cost: 'The pool itself is free. The family-smart version: <b>drive to Nderlysaj</b>, then a ~4.8 km / ~2-hour round-trip walk. Budget a few euros for parking / a short 4x4 shuttle segment at the trailhead (not consistently posted).',
  climateLabel: 'Water',
  climate: '<b>Glacial and crystal-clear — and frigid (~50–55°F) year-round.</b> Expect a brief, shrieky plunge, not a lazy swim. This is the northern Theth Blue Eye — a different place from the famous southern one near Sarande.',
  save: 'Skip the full 11 km hike from the village; the Nderlysaj drive-and-walk gives the same payoff at a fraction of the effort — ideal as the recovery day opposite the big pass hike.',
  splurge: 'Hire a village 4x4 shuttle for the rough final stretch so the 8-year-old saves energy for the walk to the pool.',
  restos: [
    '<a href="https://www.google.com/maps/search/Nderlysaj+cafe+Theth" target="_blank" rel="noreferrer"><b>Nderlysaj trailhead cafés</b></a> — byrek, omelets, fries, and grilled trout right by the parking',
    '<b>Back at your Theth guesthouse</b> for the half-board dinner — no need to seek out a restaurant',
  ],
  alts: [
    '<b>Grunas Waterfall</b> if you want a second easy water hike the same day.',
    '<b>Kulla lock-in tower</b> on the way back for a short cultural stop.',
    '<b>Village downtime</b> — the cold plunge plus the walk is a full, satisfying day for younger legs.',
  ],
  blogs: [
    { label: 'Blue Eye of Theth (not the southern one)', href: 'https://adventurealbania.com/theth/' },
  ],
});

const valbonaSpot = mkSpot({
  name: 'Valbona Pass — the epic (with a kid-friendly turn-back)',
  tags: ['valbonapass', 'thethtovalbona', 'accursedmountains'],
  carouselId: 'c-valbona',
  images: valbonaImgs,
  lat: 42.4128, lng: 19.8300,
  cost: 'The trail is free. Families add a <b>mule + handler</b> (arranged the night before through your guesthouse; luggage-mule ~$25–45/bag, a child-carry/porter arrangement negotiated above that) and often a <b>local guide</b> (~€70–100 pp, sometimes bundling transport).',
  climateLabel: 'Big hike',
  climate: '<b>~16–17 km point-to-point, ~1,000 m climb out of Theth, 7–9 hr total, over the ~1,800 m col.</b> Moderate-to-challenging — explicitly not a casual family walk.',
  save: 'Do it as an <b>out-and-back from Theth</b>, turning around at the tree-line meadows or the first mountain café on the ascent. You get the dramatic valley views without committing the 8-year-old to a 9-hour crossing.',
  splurge: 'For the full one-way crossing, book a guide and a mule: hike Theth → Valbona, then loop back scenically via the <b>Koman Lake ferry</b> rather than backtracking. Be at/past the pass by 2 pm — afternoon storms are common, forcing a 6–7 am start.',
  restos: [
    '<b>Guesthouse packed lunch</b> — arrange it the night before; there is little on the trail beyond a seasonal café or two',
    '<a href="https://www.google.com/maps/search/Rilindja+Valbona+restaurant" target="_blank" rel="noreferrer"><b>Rilindja (Valbona side)</b></a> — the institution at the far end if you do the full crossing',
  ],
  alts: [
    '<b>Turn-back at the first viewpoint</b> — the honest default with an 8-year-old; nobody regrets the meadows.',
    '<b>Mule for the kids</b> on the ascent so the family can go higher together.',
    '<b>Swap for a Koman ferry day</b> entirely if early-June snow still sits on the col (verify with your guesthouse a few days out).',
  ],
  blogs: [
    { label: 'Theth–Valbona pass (season & snow notes)', href: 'https://adventurealbania.com/theth-to-valbona-hike/' },
  ],
});

const komanSpot = mkSpot({
  name: 'Koman Lake ferry — the fjord-canyon boat day',
  tags: ['komanlake', 'komanferry', 'shala'],
  carouselId: 'c-koman',
  images: komanImgs,
  lat: 42.1039, lng: 19.8236,
  cost: 'Foot passengers ~€8–11 pp (family of four ~€32–44); vehicles priced by size. Berisha runs the big car-and-passenger ferry, typically Koman 09:00 out / return early afternoon — verify seasonally and book ahead in summer.',
  climateLabel: 'Scenic',
  climate: '<b>A ~2.5–3 hr ride</b> through a fjord-like canyon: vertical limestone walls dropping into deep turquoise-green water, road-less hamlets, snow-dusted peaks behind. Regularly called one of the world’s most beautiful boat rides.',
  save: 'As a Theth-based day, drive to Koman, ride out and back, and skip the vehicle fee by going on foot. Many trips add a side run up the <b>Shala River</b> (“Albania’s Thailand”) for a pool-blue swim — an easy crowd-pleaser for kids.',
  splurge: 'Book a Shala River boat excursion with a swim stop and lunch — the highlight of the ferry day for the 8-year-old.',
  restos: [
    '<a href="https://www.google.com/maps/search/Shala+river+restaurant+Albania" target="_blank" rel="noreferrer"><b>Shala River eco-restaurants</b></a> — grilled fish and simple plates at the swim beaches',
    '<b>Koman-side cafés</b> — basic byrek, fries, and drinks by the dock before/after',
  ],
  alts: [
    '<b>Full Valbona crossing loop</b> — use the ferry (Fierze→Koman) as the scenic exit from a one-way pass hike.',
    '<b>Shala River swim day</b> if the family wants water over another long hike.',
    '<b>Recovery in Theth</b> if the pass day was tiring — the ferry is optional, not mandatory.',
  ],
  blogs: [
    { label: 'Koman Lake ferry timetable & prices', href: 'https://komanilakeferry.com/timetables-and-prices/' },
  ],
});

const llogaraSpot = mkSpot({
  name: 'Llogara Pass & the Riviera reveal',
  tags: ['llogarapass', 'dhermi', 'albanianriviera'],
  carouselId: 'c-llogara',
  images: llogaraImgs,
  lat: 40.2033, lng: 19.5906,
  cost: 'The drive is the attraction — free. Budget only fuel and a lunch stop. The Llogara <b>tunnel</b> (~7 min) saves time on a long transfer day; the old <b>pass road</b> (30+ min of hairpins) trades time for one of the great sea-and-mountain views in the Balkans.',
  climateLabel: 'Drive',
  climate: '<b>The big transfer day:</b> Theth → Ksamil is ~415 km and a realistic 8–9 hr with stops. The reward is the moment the road crests Llogara and the whole turquoise Riviera opens below at Dhermi.',
  save: 'Take the tunnel on the way down when everyone is tired; leave Theth by ~07:00 and treat this as one deliberate scenic driving day rather than squeezing a hike in first.',
  splurge: 'Take the old pass road for the viewpoint and a coffee at the top, then drop into Dhermi for a first Ionian swim before the final push to Ksamil.',
  restos: [
    '<a href="https://www.google.com/maps/search/Llogara+pass+restaurant" target="_blank" rel="noreferrer"><b>Llogara pass grills</b></a> — spit-roast lamb and simple plates with a view; fries and bread for kids',
    '<a href="https://www.google.com/maps/search/Dhermi+beach+pizza" target="_blank" rel="noreferrer"><b>Dhermi beach pizzerias</b></a> — first-swim lunch on the coast',
  ],
  alts: [
    '<b>Split the drive</b> with a night in Berat or Vlore if 8–9 hours in a day is too much (see the Status card).',
    '<b>First swim at Dhermi</b> to break up the descent.',
    '<b>Vlore waterfront</b> stop for a leg-stretch and ice cream before the coastal road.',
  ],
  blogs: [
    { label: 'Theth→Sarande routing', href: 'https://www.rome2rio.com/s/Theth/Saranda' },
  ],
});

const ksamilSpot = mkSpot({
  name: 'Ksamil beaches & islets — the swim payoff',
  tags: ['ksamil', 'ksamilislands', 'albanianriviera'],
  carouselId: 'c-ksamil',
  images: ksamilImgs,
  lat: 39.7686, lng: 20.0064,
  cost: 'Two sunbeds + umbrella run ~1,500–2,000 lek (€15–20 / $16–21) a day in June (cash). A motorboat taxi to the islets is ~500–1,000 lek/person; pedalos ~€20/hr. The beaches themselves are free to walk onto.',
  climateLabel: 'Beach',
  climate: '<b>June air highs ~83°F; Ionian sea ~72°F rising into the mid-70s by late June.</b> Genuinely warm, calm, and Caribbean-clear — the warm-water swim a Madeira/Atlantic trip cannot match. Water is clearest in the morning.',
  save: 'Base here so you unpack once. Swim or wade to the little offshore islets — shallow and safe for the 8-year-old — instead of paying for a boat every day. Try Mirror Beach (Pasqyra) or Pulebardha for clearer, less-mobbed water.',
  splurge: 'A half-day motorboat rental to the islets, or a beach club with front-row loungers on a peak afternoon.',
  restos: [
    '<a href="http://www.abioriksamil.com/" target="_blank" rel="noreferrer"><b>Abiori Bar Restaurant Pizzeria</b></a> — on the sand, <b>wood-fired pizza and pasta</b> for the kids',
    '<a href="https://www.tripadvisor.com/Restaurant_Review-g4505725-d14772388-Reviews-Fourth-Island-Ksamil_Saranda_Vlore_County.html" target="_blank" rel="noreferrer"><b>Fourth Island</b></a> — garden terrace; pizza, pasta, salads plus grilled fish',
    '<a href="https://the-mussel-house.business.site/" target="_blank" rel="noreferrer"><b>The Mussel House</b></a> — Lake Butrint mussels for the adults, <b>pasta and cake</b> for the kids',
  ],
  alts: [
    '<b>Mirror Beach (Pasqyra)</b> ~10 min away for clearer water and fewer crowds.',
    '<b>Pulebardha cove</b> for snorkeling off the rocks.',
    '<b>Sunset xhiro in Sarande</b> (~20 min) for the waterfront promenade and ice cream.',
  ],
  blogs: [
    { label: 'Ksamil beaches & boat tours', href: 'https://www.tripadvisor.com/Attractions-g4505725-Activities-Ksamil_Saranda_Vlore_County.html' },
  ],
});

const butrintSpot = mkSpot({
  name: 'Butrint National Park (UNESCO) — ruins in the forest',
  tags: ['butrint', 'butrintnationalpark', 'unesco'],
  carouselId: 'c-butrint',
  images: butrintImgs,
  lat: 39.7456, lng: 20.0206,
  cost: 'Adult 1,000 lek (~€10); child 6–12 500 lek (~€5); under 6 free (cash preferred). A 2–3 hr flat woodland loop, ~15 min south of Ksamil.',
  climateLabel: 'Ruins',
  climate: '<b>Wooded but sun-exposed at the ruins.</b> June midday is intense — go 9–11 am or after 4 pm, bring water and real shoes, then swim back in Ksamil in the afternoon.',
  save: 'Go early to beat both the heat and the tour buses, then bank the rest of the day for the beach. No guide needed — the signage and layout do the work.',
  splurge: 'A licensed guide brings the Greek theatre, the Lion Gate, and the Venetian tower alive for the 13-year-old.',
  restos: [
    '<a href="https://the-mussel-house.business.site/" target="_blank" rel="noreferrer"><b>The Mussel House</b></a> — on the Lake Butrint waterfront between the ruins and Ksamil; easy lunch stop',
    '<a href="https://www.google.com/maps/search/Ksamil+restaurant+pizza" target="_blank" rel="noreferrer"><b>Ksamil pizzerias</b></a> — back in town for the picky-kid default after the ruins',
  ],
  alts: [
    '<b>Climbable city walls + Venetian tower</b> — the “treasure hunt in the forest” that keeps kids moving.',
    '<b>Turtles in the ponds</b> and the carved Lion Gate for the 8-year-old.',
    '<b>Afternoon Ksamil swim</b> to cool off after the ruins.',
  ],
  blogs: [
    { label: 'Butrint National Park (UNESCO)', href: 'https://whc.unesco.org/en/list/570/' },
  ],
});

const northCoastSpot = mkSpot({
  name: 'The wild north coast: Himare, Gjipe & Porto Palermo',
  tags: ['himara', 'gjipe', 'portopalermo'],
  carouselId: 'c-northcoast',
  images: northCoastImgs,
  lat: 40.1017, lng: 19.7450,
  cost: 'A day trip up the SH8 (~1h20 to Himare). Porto Palermo castle 300 lek (~€3); Gjipe clifftop parking 300 lek; a Gjipe boat taxi from Himare ~€15–20 pp. Himare sunbeds ~€10–20.',
  climateLabel: 'Coast',
  climate: '<b>The quieter, wilder Riviera.</b> Gjipe is a pebble cove at a canyon mouth walled by ~20 m cliffs; Porto Palermo has one of the calmest, glass-clear bays on the coast — gentle entry, ideal for kids.',
  save: 'Reach Gjipe by the clifftop park-and-walk (30–45 min down, unshaded) only if everyone is up for the hot climb back; otherwise it is a scenery day at Himare’s Livadhi and Llamani beaches. Bring your own water — Gjipe has none.',
  splurge: 'Take the <b>boat taxi to Gjipe</b> from Himare so the 8-year-old skips the brutal uphill return, and add Porto Palermo’s Ali Pasha castle + calm-bay swim on the way back.',
  restos: [
    '<a href="https://www.google.com/maps/search/Pizzeria+Napoli+Himare" target="_blank" rel="noreferrer"><b>Pizzeria Napoli, Himare</b></a> — straightforward pizza and pasta',
    '<a href="https://www.google.com/maps/search/Obelix+Beer+N+Burger+Himare" target="_blank" rel="noreferrer"><b>Obelix Beer N’ Burger</b></a> — burgers and fries for a guaranteed kid win',
  ],
  alts: [
    '<b>Porto Palermo bay</b> — the calmest, kid-friendliest swim on the whole coast, with a castle to explore (bring a flashlight for the dungeons).',
    '<b>Livadhi & Llamani beaches</b> at Himare if the Gjipe walk or boat does not line up.',
    '<b>Dhermi</b> for a livelier beach scene on the way back south.',
  ],
  blogs: [
    { label: 'Albanian Riviera coast guide', href: 'https://www.rentingacarineurope101.com/albania-road-trip-itinerary/' },
  ],
});

const blueEyeSarandeSpot = mkSpot({
  name: 'Blue Eye of Sarande + a boat day',
  tags: ['blueeyesarande', 'syrikalter', 'sarande'],
  carouselId: 'c-blueeyesarande',
  images: blueEyeSarandeImgs,
  lat: 39.9247, lng: 20.1878,
  cost: 'Blue Eye entry is almost nothing — 50 lek/person, 100 lek/car, parking 200–800 lek. A shared boat trip from Ksamil/Sarande runs €16–37 pp; a 3-hour RIB to Tongo Island with snorkel gear is ~€60 pp (family of four ~€240).',
  climateLabel: 'Spring',
  climate: '<b>A vivid turquoise-to-emerald karst spring, ~50–54°F and look-don’t-swim</b> (cold and officially protected — people dip downstream). An easy ~2 km flat, shaded forest walk to the boardwalk; go before 9 am in peak.',
  save: 'Pair the Blue Eye (a cheap 2–3 hr morning stop) with a Sarande waterfront evening — both low-cost. Skip the pricey private boat and take a shared “Five Islands” circuit if you want time on the water.',
  splurge: 'A half-day RIB boat to the sea caves and Tongo Island with snorkeling — the trip highlight for water-loving kids.',
  restos: [
    '<a href="https://www.google.com/maps/search/Sarande+waterfront+restaurant+pizza" target="_blank" rel="noreferrer"><b>Sarande waterfront (Hasan Tahsini)</b></a> — al-fresco dining with pizza/pasta options and the evening promenade',
    '<a href="https://www.instagram.com/veranda_by_apollonia/" target="_blank" rel="noreferrer"><b>Veranda Apollonia, Ksamil</b></a> — rooftop sea views; pizza, risotto, grilled fish',
  ],
  alts: [
    '<b>Shared boat trip</b> to the coves and sea caves instead of a private charter.',
    '<b>Sarande city beach + xhiro</b> for a low-key town evening.',
    '<b>Back to a Ksamil islet swim</b> if the Blue Eye crowds are heavy.',
  ],
  blogs: [
    { label: 'Blue Eye of Sarande visitor info', href: 'https://www.tripadvisor.com/Attraction_Review-g2340166-d8827307-Reviews-The_Blue_Eye-Sarande_Sarande_Vlore_County.html' },
  ],
});

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------
const days = [
  travelDay('day0', '0', 'Mon &middot; Jun 7', 'Depart Pittsburgh after work', 'Overnight to Tirana via one European hub', 'Est. $90 &middot; airport meals', [
    fact('Sleep', 'Overnight flight'),
    fact('Route target', 'PIT -> VIE / MUC / LHR / IST -> TIA'),
    fact('Constraint', 'In Pittsburgh all day Jun 24-26; Jun 23 return is allowed'),
  ], 'This early-June plan gets the family home by Tue Jun 22 while banking 13 hotel nights. Book it as one open-jaw multi-city ticket: into Tirana, home out of Corfu.'),

  day('day1', 'c5', '1', 'Tue &middot; Jun 8', 'Arrive Tirana, soft landing', 'Bunk’Art 2, Skanderbeg Square, bazaar dinner', 'Est. $110 &middot; museum, dinner, walk', [
    fact('Sleep', 'Central Tirana &middot; 1 night'),
    fact('Plan', 'Bunk’Art 2 + Skanderbeg Square on foot'),
    fact('Heads-up', 'Dajti cable car is closed Tuesdays'),
  ], 'A deliberate jet-lag buffer off the red-eye. Everything is walkable from the center; the cable car and Bunk’Art 1 wait for another day since Tuesday closes the cable car.', [tiranaSpot]),

  day('day2', 'c3', '2', 'Wed &middot; Jun 9', 'Drive north to the Alps', 'Tirana -> Shkoder -> Theth', 'Est. $120 &middot; castle, lunch, dinner', [
    fact('Sleep', 'Theth village &middot; night 1 of 5'),
    fact('Drive', '~3.5-4 hr incl. the SH21 mountain road'),
    fact('Fuel', 'Fill up in Koplik — no petrol in Theth'),
  ], 'A transition day colored by where you sleep. Break it at Rozafa Castle and Lake Shkodra, then climb the now-paved SH21 to Theth for the first mountain night.', [shkoderSpot], 'Travel day into the mountains — Shkoder is the gateway stop, Theth is the destination.'),

  day('day3', 'c3', '3', 'Thu &middot; Jun 10', 'Theth on foot', 'Grunas Waterfall + church + kulla towers', 'Est. $95 &middot; guesthouse half-board, snacks', [
    fact('Sleep', 'Theth village &middot; night 2 of 5'),
    fact('Anchor', 'Grunas Waterfall family hike (2-3 hr)'),
    fact('Culture', 'Lock-in tower + stone church'),
  ], 'Ease into the mountains with the valley’s best easy hike, the postcard church, and the blood-feud lock-in tower — a full day without a hard climb.', [grunasSpot, thethSpot]),

  day('day4', 'c3', '4', 'Fri &middot; Jun 11', 'Blue Eye of Theth', 'Turquoise glacial spring, kid-friendly', 'Est. $90 &middot; parking/shuttle, lunch, dinner', [
    fact('Sleep', 'Theth village &middot; night 3 of 5'),
    fact('Plan', 'Drive to Nderlysaj + ~2 hr round-trip walk'),
    fact('Water', 'Crystal-clear and frigid — a quick plunge'),
  ], 'The recovery day opposite the big pass hike: the drive-and-walk version of the northern Blue Eye is easy enough for the 8-year-old and dramatic enough for everyone.', [blueEyeThethSpot]),

  day('day5', 'c3', '5', 'Sat &middot; Jun 12', 'Valbona Pass day', 'The epic — full crossing or turn-back', 'Est. $180-$360 &middot; guide + mule optional', [
    fact('Sleep', 'Theth village &middot; night 4 of 5'),
    fact('Default', 'Out-and-back to the meadows / first viewpoint'),
    fact('Upgrade', 'Full crossing with guide + mule, off the col by 2 pm'),
  ], 'The signature Balkan day-hike — honestly framed. The 8-year-old is the limiting factor, so the default is a turn-back with the same big views; the full ~1,800 m crossing is a conscious upgrade with a guide and a mule.', [valbonaSpot]),

  day('day6', 'c3', '6', 'Sun &middot; Jun 13', 'Koman Lake ferry', 'Fjord-canyon boat + Shala River swim', 'Est. $150 &middot; ferry, Shala excursion, lunch', [
    fact('Sleep', 'Theth village &middot; night 5 of 5'),
    fact('Plan', 'Drive to Koman, ferry the canyon, swim the Shala'),
    fact('Note', 'Verify summer sailing times; book ahead'),
  ], 'The scenic counterpoint to all the hiking: a ferry through a fjord-like canyon, plus a Shala River swim stop that the kids will rank as the trip highlight.', [komanSpot]),

  day('day7', 'c1', '7', 'Mon &middot; Jun 14', 'The big drive to the Riviera', 'Theth -> Llogara -> Ksamil', 'Est. $130 &middot; fuel, grill lunch, dinner', [
    fact('Sleep', 'Ksamil &middot; night 1 of 6'),
    fact('Drive', '~415 km, realistic 8-9 hr with stops'),
    fact('Reveal', 'Llogara Pass opens the whole turquoise coast'),
  ], 'One deliberate scenic driving day down the length of the country. Leave Theth by ~07:00; take the Llogara tunnel when tired, or the old pass road for the view. First Ionian swim at Dhermi optional.', [llogaraSpot], '&#128663; Big transfer day — Theth to the coast, colored by tonight’s Ksamil base.'),

  day('day8', 'c1', '8', 'Tue &middot; Jun 15', 'Ksamil beaches & islets', 'The Caribbean-clear swim payoff', 'Est. $130 &middot; sunbeds, boat, dinner', [
    fact('Sleep', 'Ksamil &middot; night 2 of 6'),
    fact('Water', '~72-75°F, calm, clear — warm enough to laze in'),
    fact('Kids', 'Wade / swim to the offshore islets'),
  ], 'The reason the swim leg beats an Atlantic island: warm, calm, turquoise water and little islets the 8-year-old can reach on their own. Unpack once and settle in.', [ksamilSpot]),

  day('day9', 'c1', '9', 'Wed &middot; Jun 16', 'Butrint, then the beach', 'UNESCO ruins morning + Ksamil afternoon', 'Est. $120 &middot; tickets, lunch, swim, dinner', [
    fact('Sleep', 'Ksamil &middot; night 3 of 6'),
    fact('Morning', 'Butrint ruins loop, 9-11 am to beat the heat'),
    fact('Afternoon', 'Back to Ksamil to swim'),
  ], 'The one culture day on the coast, timed early against the June sun — a Greek theatre, Venetian tower, and climbable walls in a forest — then straight back to the water.', [butrintSpot]),

  day('day10', 'c1', '10', 'Thu &middot; Jun 17', 'The wild north coast', 'Himare, Gjipe & Porto Palermo', 'Est. $150 &middot; boat taxi, castle, lunch', [
    fact('Sleep', 'Ksamil &middot; night 4 of 6'),
    fact('Drive', '~1h20 up the SH8 to Himare'),
    fact('Swim', 'Porto Palermo’s calm bay is the kid win'),
  ], 'A day trip to the quieter, wilder Riviera: the canyon-mouth cove at Gjipe (by boat for the kids), Himare’s beaches, and Porto Palermo’s castle and glass-clear bay.', [northCoastSpot]),

  day('day11', 'c1', '11', 'Fri &middot; Jun 18', 'Blue Eye + boat day', 'Juneteenth observed: a no-PTO water day', 'Est. $140-$300 &middot; boat trip optional', [
    fact('Sleep', 'Ksamil &middot; night 5 of 6'),
    fact('Holiday', 'Juneteenth observed for many employers'),
    fact('Plan', 'Blue Eye of Sarande morning + boat or town evening'),
  ], 'Juneteenth (observed) lands mid-trip as a free active day. Pair the cheap, dramatic Blue Eye of Sarande with a boat trip to the sea caves or a Sarande waterfront evening.', [blueEyeSarandeSpot]),

  day('day12', 'c1', '12', 'Sat &middot; Jun 19', 'Flex beach day', 'Islets, Mirror Beach, or one more boat', 'Est. $110 &middot; sunbeds, snacks, dinner', [
    fact('Sleep', 'Ksamil &middot; night 6 of 6'),
    fact('Plan', 'Unstructured — best swim spots on repeat'),
    fact('Prep', 'Pack; confirm tomorrow’s Sarande ferry time'),
  ], 'A deliberate open day: back to the clearest coves (Mirror Beach, Pulebardha), a final islet swim, or one more short boat run — then pack for the ferry. No new stop card by design; the Riviera beaches carry it.', []),

  travelDay('day13', '13', 'Sun &middot; Jun 20', 'Ferry to Corfu', 'Drop the car in Sarande, cross to Greece', 'Est. $180 &middot; ferry, Corfu dinner, airport hotel', [
    fact('Sleep', 'Corfu (CFU) airport buffer &middot; 1 night'),
    fact('Ferry', 'Sarande -> Corfu, 30-35 min high-speed'),
    fact('Border', 'Passport control both ends — arrive ~1 hr early'),
  ], 'The open-jaw payoff: a 30-minute boat replaces an island-hop flight. Drop the Albanian rental in Sarande, walk onto the ferry, and buffer overnight in Corfu to protect the long-haul home.'),

  travelDay('day14', '14', 'Mon-Tue &middot; Jun 21-22', 'Fly Corfu -> Pittsburgh', 'Home before the blackout', 'Est. $110 &middot; airport meals', [
    fact('Sleep', 'Home by Tue Jun 22'),
    fact('Route target', 'CFU -> VIE / MUC -> PIT'),
    fact('Schedule', 'Home by Tue Jun 22'),
  ], 'The trip arrives before the preferred Jun 23 return date, leaving a buffer before the required full days in Pittsburgh on Jun 24-26. A Monday departure from Corfu connects through a European hub and arrives Monday or Tuesday.'),
];

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
const previewImages = [
  [U('1648046143698-1204e59eb43b'), 'Day 8 &middot; Tue Jun 15', 'Ksamil islets', 'The warm, turquoise, Caribbean-clear swim payoff a Madeira trip can’t match.'],
  [P('17841141'), 'Day 3 &middot; Thu Jun 10', 'Theth stone church', 'The postcard of the Accursed Mountains, alone in its meadow at twilight.'],
  [P('28837420'), 'Day 5 &middot; Sat Jun 12', 'Valbona Pass', 'The signature Balkan day-hike — epic for the 13-year-old, turn-back-friendly for the 8.'],
  [P('36766373'), 'Day 6 &middot; Sun Jun 13', 'Koman Lake ferry', 'A fjord-like canyon boat ride, one of the most beautiful in the world.'],
  [P('30459667'), 'Day 2 &middot; Wed Jun 9', 'Rozafa Castle', 'Golden hour over Lake Shkodra on the drive up to the mountains.'],
  [P('13891425'), 'Day 4 &middot; Fri Jun 11', 'Blue Eye of Theth', 'A glacial turquoise spring, reachable on an easy family walk.'],
  [U('1741267087595-833115cb7e22'), 'Day 9 &middot; Wed Jun 16', 'Butrint (UNESCO)', 'Greek, Roman and Venetian ruins in a forest, 15 minutes from the beach.'],
  [U('1738248000826-3c9cbbe3189b'), 'Day 7 &middot; Mon Jun 14', 'Llogara Pass', 'The moment the road crests and the whole Riviera opens below.'],
];

const previewHtml = preview({
  kicker: 'Family Trip &middot; Jun 7&ndash;22, 2027',
  h1Main: 'Albania',
  h1Sub: 'Accursed Mountains to the Riviera',
  lead: 'Thirteen nights that answer Madeira with a bigger contrast: an alpine hiking core in the Theth valley of the Accursed Mountains, then a genuine warm-water swim leg on the Ksamil coast — all on one country’s roads, with no island-hop flight and a 30-minute Corfu ferry as the exit.',
  stats: [['13', 'Hotel nights'], ['3', 'Sleep bases'], ['19', 'Stops mapped'], ['$9.7k', 'priced target']],
  split: [[45, 'Water', 'water'], [20, 'Towns &amp; food', 'town'], [35, 'Nature', 'nature']],
  images: previewImages,
});

// ---------------------------------------------------------------------------
// Overview / Why / Stays / Calendar
// ---------------------------------------------------------------------------
const overview = `<section id="overview">
    <div class="section-label">
      <p class="eyebrow">The Plan at a Glance</p>
      <h2>Madeira’s hiking idea, dialed up — with a real swim payoff</h2>
      <p>This is the <b>alpine-epic + warm-water</b> option: the Theth valley of the <b>Accursed Mountains</b> for dramatically different scenery and serious hiking, then the <b>Albanian Riviera</b> at Ksamil for turquoise, swimmable Ionian water. It gets home before the preferred Jun 23 return date and protects the required full days in Pittsburgh on <b>Jun 24-26</b>.</p>
    </div>
    <div class="overview">
      <div class="ocard"><p class="eyebrow">Route</p><h4>PIT -> Tirana -> Theth -> Ksamil -> Corfu -> PIT</h4><p><b>1 night Tirana</b>, <b>5 nights Theth</b>, <b>6 nights Ksamil</b>, then <b>1 Corfu airport buffer</b>. Open-jaw: fly into Tirana, home out of Corfu. Home by Tue Jun 22.</p></div>
      <div class="ocard"><p class="eyebrow">Why it beats Madeira</p><h4>No island-hop flight trap</h4><p>Madeira’s weakness was the Atlantic-island air funnel with no direct hops to Mediterranean islands. Albania puts mountains <b>and</b> coast on one continuous road network, one rental car, and swaps the risky inter-island flight for a 30-minute Sarande–Corfu ferry.</p></div>
      <div class="ocard"><p class="eyebrow">Budget</p><h4>Priced target: ~$9,700; high case ~$13,900</h4><p>Comfortably under the $12k target and well under the $15k hard cap. Albania is genuinely cheap; the transatlantic airfare is the only big line, and even the high case clears the cap.</p></div>
    </div>
  </section>

  <section id="why-this-trip" class="divider">
    <div class="section-label">
      <p class="eyebrow">Why This Trip</p>
      <h2>The Madeira replacement, done properly</h2>
      <p>Epic alpine hiking and dramatically different scenery, but with the one thing an Atlantic-island trip can’t give a family: warm, calm, turquoise water — and no flight trap to reach it.</p>
    </div>
    <div class="plan-grid">
      ${card('Bigger scenery contrast', `<p>The Theth valley — 1,800 m limestone passes, a glacial Blue Eye, stone lock-in towers, a fjord-like ferry canyon — is a far more dramatic mountain world than a levada walk, and it sits three hours from a Caribbean-clear coast.</p>`)}
      ${card('A real swim payoff', `<p>Ksamil’s Ionian water runs into the mid-70s°F by late June, calm and clear, with little islets the 8-year-old can swim to. That is the warm-water reward the Madeira idea never had.</p>`)}
      ${card('No Atlantic flight trap', `<p>Mountains and coast connect by one country’s roads on a single rental car; the exit is a 30-minute Corfu ferry, not a weather-sensitive island-hop flight. Value is the bonus: the whole trip lands near $9.7k.</p>`)}
    </div>
  </section>

  <section id="stays" class="divider">
    <div class="section-label">
      <p class="eyebrow">Where We Stay</p>
      <h2>Two real bases, plus two buffers</h2>
      <p>A Theth mountain base and a Ksamil coast base do the work; the Tirana arrival night and the Corfu departure night are flight insurance, not vacation bases.</p>
    </div>
    <div class="plan-grid">
      ${card('Tirana &middot; 1 night', `${prow('Target', 'Central hotel / family apartment &middot; $80-140/night')}${prow('Why', 'Jet-lag buffer off the red-eye; walkable to Bunk’Art 2, the square, and the bazaar')}${prow('Tradeoff', 'One night only — the trip is about the mountains and the coast')}`)}
      ${card('Theth &middot; 5 nights', `${prow('Target', 'Traditional guesthouse (bujtina), half-board &middot; €20-35 pp; family room ~$70-120/night')}${prow('Why', 'Walk to trailheads for Grunas, the Blue Eye, and the Valbona pass; home-cooked dinners')}${prow('Tradeoff', 'Cold nights, patchy signal, cash only — pack layers and lek')}`)}
      ${card('Ksamil &middot; 6 nights', `${prow('Target', 'Apartment/hotel with pool or beach access &middot; $80-140/night')}${prow('Why', 'Unpack once; Butrint, Sarande, and the Blue Eye are all short drives, the islets are a swim away')}${prow('Tradeoff', 'The northern Riviera (Himare/Gjipe) is a day-trip, not next door')}`)}
      ${card('Corfu &middot; 1 night (buffer)', `${prow('Target', 'CFU airport-area hotel &middot; $110-200')}${prow('Why', 'Protects the long-haul home; ferry in from Sarande, fly out fresh')}${prow('Rule', 'Keep the buffer unless a same-day ferry-to-flight is genuinely clean')}`)}
    </div>
  </section>`;

const calendar = calendarGrid({
  window: [2027, 6, 7, 6, 21],
  intro: 'The Jun 7-22, 2027 plan as colored time blocks, coded by <b>activity</b>. It sits inside the Jun 6-Aug 15 window and gets home before the preferred Jun 23 return date; the required full Pittsburgh days are Jun 24-26. Juneteenth (observed Fri Jun 18) lands mid-trip as a free active day. <b>Block times are schematic</b> &mdash; they show sequence and rough time-of-day, not real flight or ferry times.',
  tripDays: [
    { date: [6, 7], blocks: [{ act: 'air', start: 20, end: 23, label: 'Fly PIT &rarr; hub' }] },
    { date: [6, 8], blocks: [{ act: 'air', start: 8, end: 11, label: 'Land Tirana' }, { act: 'town', start: 16, end: 20, label: 'Bunk&rsquo;Art 2 + bazaar' }] },
    { date: [6, 9], blocks: [{ act: 'car', start: 9, end: 14, label: 'Drive to Theth' }, { act: 'town', start: 14, end: 16, label: 'Shkoder / Rozafa' }] },
    { date: [6, 10], blocks: [{ act: 'hike', start: 9, end: 13, label: 'Grunas Waterfall' }, { act: 'town', start: 16, end: 18, label: 'Church + kulla' }] },
    { date: [6, 11], blocks: [{ act: 'hike', start: 10, end: 14, label: 'Blue Eye of Theth' }] },
    { date: [6, 12], blocks: [{ act: 'hike', start: 7, end: 16, label: 'Valbona pass' }] },
    { date: [6, 13], blocks: [{ act: 'water', start: 9, end: 15, label: 'Koman ferry + Shala' }] },
    { date: [6, 14], blocks: [{ act: 'car', start: 7, end: 16, label: 'Drive to the coast' }, { act: 'water', start: 17, end: 19, label: 'Dhermi swim' }] },
    { date: [6, 15], blocks: [{ act: 'water', start: 10, end: 17, label: 'Ksamil islets' }] },
    { date: [6, 16], blocks: [{ act: 'town', start: 9, end: 12, label: 'Butrint ruins' }, { act: 'water', start: 14, end: 18, label: 'Ksamil beach' }] },
    { date: [6, 17], blocks: [{ act: 'car', start: 9, end: 12, label: 'North coast drive' }, { act: 'water', start: 12, end: 17, label: 'Gjipe / Porto Palermo' }] },
    { date: [6, 18], blocks: [{ act: 'water', start: 9, end: 12, label: 'Blue Eye Sarande' }, { act: 'water', start: 14, end: 18, label: 'Boat / Sarande' }] },
    { date: [6, 19], blocks: [{ act: 'water', start: 10, end: 17, label: 'Flex beach day' }] },
    { date: [6, 20], blocks: [{ act: 'car', start: 9, end: 13, label: 'Ferry to Corfu' }, { act: 'rest', start: 16, end: 20, label: 'Corfu buffer' }] },
    { date: [6, 21], blocks: [{ act: 'air', start: 10, end: 14, label: 'Fly CFU &rarr; PIT' }] },
  ],
});

// ---------------------------------------------------------------------------
// Map / Air / Ground
// ---------------------------------------------------------------------------
const mapAirGround = `<section id="map" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Whole Trip, Mapped</p>
      <h2>Every stop on one map</h2>
      <p>Open <b>Map layers</b> to show or hide flights, lodging, hikes, beaches, towns, viewpoints, and restaurants. Tap a region to fly there, then click any pin for Google Maps.</p>
    </div>
    <div class="tripmap-wrap">
      <div class="mapbtns">
        <button data-region="tirana"><span class="sw" style="background:#7d5ba6"></span>Tirana</button><button data-region="theth"><span class="sw" style="background:#3f7d4e"></span>Theth / Alps</button><button data-region="riviera"><span class="sw" style="background:#1f6f78"></span>Riviera</button><button data-region="transfer"><span class="sw" style="background:#c25a3a"></span>Flights / ferry</button><button data-region="all">Whole trip</button>
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
      <h2>Open-jaw: into Tirana, home out of Corfu</h2>
      <p>Research status: 2027 schedules are not live, so current 2025-2026 route and fare signals are used as planning proxies. Re-quote as protected tickets once inventory opens.</p>
    </div>
    <div class="plan-grid">
      ${card('PIT -> Tirana (TIA)', `${prow('Routing', 'One European hub — VIE (Austrian), MUC/FRA (Lufthansa), LHR (BA), or IST (Turkish)')}${prow('Connections', 'Typically 1-2 stops; no nonstop exists')}${prow('Family airfare gate', '$4,600-$5,800 target; high case up to ~$8,000')}${prow('Note', 'TIA has grown fast — far better served than any Atlantic-island airport')}`)}
      ${card('Corfu (CFU) -> PIT', `${prow('Routing', 'CFU -> VIE or MUC -> PIT on Star Alliance, single ticket')}${prow('Season', 'Corfu has broad summer hub links in June')}${prow('Why open-jaw', 'Avoids a 5-hr backtrack drive to Tirana on the last day')}${prow('Fare', 'Open-jaw prices ~like a round-trip, cheaper than two one-ways')}`)}
      ${card('Sarande -> Corfu ferry', `${prow('The hop', 'High-speed 30-35 min; slower car ferry 60-75 min')}${prow('Price', '€25-40 pp; family one-way ~€100-160 (kids discounted)')}${prow('Operators', 'Finikas Lines, Ionian Seaways')}${prow('Border', 'Passport control both ends — Albania is outside Schengen')}`)}
      ${card('Why this beats Madeira on air', `${prow('Madeira', 'Atlantic-island funnel; no direct hops to Med islands, self-transfer risk')}${prow('Albania', 'Mountains + coast on one road network, one rental car')}${prow('Exit', 'A 30-min ferry replaces an inter-island flight entirely')}`)}
    </div>
  </section>

  <section id="getting-around" class="divider">
    <div class="section-label">
      <p class="eyebrow">Getting Around</p>
      <h2>One rental car does the whole country</h2>
      <p>Pick up at Tirana airport, drop in Sarande before the ferry. Several local firms (e.g. Tic Rent Car, rentfromlocals) offer a free one-way TIA -> Sarande drop; you cannot take an Albanian rental across to Corfu.</p>
    </div>
    <div class="plan-grid">
      ${card('The rental car', `${prow('Pickup/drop', 'TIA Jun 9 -> Sarande Jun 20 (~12 days)')}${prow('Budget', '~€330-500 + fuel; book an automatic early (limited, premium)')}${prow('Roads', 'SH21 to Theth is paved but narrow/steep; SH8 coast is winding — no night driving')}`)}
      ${card('In the mountains', `${prow('Theth', 'Village is walkable; trailheads on foot or a short 4x4 shuttle')}${prow('Koman ferry', '~€8-11 pp on foot; a scenic day, not a required transfer')}${prow('Fuel', 'Fill in Koplik — there is no petrol in Theth')}`)}
      ${card('On the coast', `${prow('Ksamil -> Butrint', '~15 min')}${prow('Ksamil -> Sarande', '~20 min (the ferry port)')}${prow('Ksamil -> Himare', '~1h20 up the SH8')}`)}
    </div>
  </section>`;

// ---------------------------------------------------------------------------
// Health / Timing
// ---------------------------------------------------------------------------
const healthTiming = `<section id="health-check" class="divider">
    <div class="section-label">
      <p class="eyebrow">Plan Health-Check</p>
      <h2>What to lock, watch, and expect</h2>
      <p>Current research refreshed July 2026 for a June 2027 trip. Kids assumed 13 and 8.</p>
    </div>
    <div class="hc-grid">
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The concept is coherent</h4><p>Theth delivers the alpine epic and dramatically different scenery; Ksamil delivers the warm-water swim. It is a genuine Madeira upgrade, not a lateral move.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The Pittsburgh dates are protected</h4><p>Depart Mon Jun 7, ferry to Corfu Jun 20, fly home Jun 21, arrive by Jun 22. That is ahead of the preferred Jun 23 return and the required full days in Pittsburgh on Jun 24-26.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The budget has huge headroom</h4><p>Even the high case (~$13.9k) clears the $15k cap, and the target (~$9.7k) is well under $12k. Albania is cheap; airfare is the only big line.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>The Valbona pass vs an 8-year-old</h4><p>The full crossing is 7-9 hr over a 1,800 m col — a real stretch for the 8-year-old. Default to the out-and-back; treat the full crossing as a guided, mule-assisted upgrade.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Early-June snow on the col</h4><p>The Valbona pass is snow-closed until roughly early-to-mid June; Jun 9-13 is usually walkable but at the boundary. Verify with the guesthouse a few days out and keep a Grunas/Koman fallback.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>The Theth -> Ksamil drive is long</h4><p>~415 km, a realistic 8-9 hr. Plan it as one deliberate scenic day (early start, Llogara tunnel when tired) or split it with a Berat/Vlore night.</p></div>
    </div>
  </section>

  <section id="timing" class="divider">
    <div class="section-label">
      <p class="eyebrow">Best Time</p>
      <h2>Why this June window wins</h2>
      <p>It gives 13 hotel nights, uses Juneteenth (observed Fri Jun 18) as a no-PTO active day, opens the Valbona pass, and warms the Ionian — all before the blackout.</p>
    </div>
    ${table(['Window', 'Nights', 'PTO', 'Blackout fit', 'Verdict'], [
      ['Jun 7-22', '13 hotel nights', '~9 days', 'Home before Jun 23', '<b>Use this</b>'],
      ['Jun 15-29', '13+', '~9 days', '<b>Invalid</b> - away during Jun 24-26', 'Reject'],
      ['Jun 27-Jul 10', '13+', '~9 days', 'Valid', 'Backup; warmer sea but the pass is fully open'],
      ['Aug 1-14', '13+', '~10 days', 'Valid', 'Hotter, busier Riviera, higher prices'],
    ])}
    <div class="verdict-box" style="border-left-color:var(--c3);margin-top:18px"><h4>PTO math</h4><p>Departing Mon Jun 7 after work costs no PTO that day. Weekdays needing PTO: Jun 8-11 and Jun 14-17 (eight days), with <b>Fri Jun 18 free if the employer observes Juneteenth</b>, plus Jun 21-22 for travel/recovery: about <b>9 PTO days</b>. The calendar rule allows a Jun 23 return and requires full days in Pittsburgh Jun 24-26; this plan is home a day earlier.</p></div>
  </section>`;

// ---------------------------------------------------------------------------
// Budget / Totals / Tips
// ---------------------------------------------------------------------------
const budgetTips = `<section id="budget" class="divider">
    <div class="section-label">
      <p class="eyebrow">The Money</p>
      <h2>Budget, savers &amp; splurges</h2>
      <p>Real priced planning target using 2025-2026 route/fare/lodging signals because June 2027 inventory is not live. USD, family of four. Albania is cash-based — carry lek.</p>
    </div>
    ${table(['Line item', 'Target case', 'High case'], [
      ['PIT -> Tirana / Corfu -> PIT open-jaw airfare (x4)', '$5,200', '$7,600'],
      ['Sarande -> Corfu ferry (family)', '$130', '$180'],
      ['Rental car (~12 days) + fuel + free one-way drop', '$650', '$950'],
      ['Lodging: Tirana 1 night', '$110', '$150'],
      ['Lodging: Theth 5 nights (half-board)', '$475', '$600'],
      ['Lodging: Ksamil 6 nights', '$570', '$800'],
      ['Lodging: Corfu buffer 1 night', '$130', '$200'],
      ['Food & groceries, 14 travel days', '$1,300', '$1,700'],
      ['Activities: Butrint, boats, guide/mule, Blue Eyes, castles', '$700', '$1,050'],
      ['Insurance, fees, misc buffer', '$450', '$1,000'],
      ['<b>Grand total</b>', '<b>$9,715</b>', '<b>$14,230</b>'],
    ])}
    <div class="twocol">
      <div class="listcard save-list"><h4>Save money</h4><ul><li>Book the airfare as one open-jaw ticket — cheaper than two one-ways and no backtrack drive.</li><li>Use a free one-way car drop (Tic Rent Car / rentfromlocals) instead of paying a €120 fee.</li><li>Theth guesthouse half-board is cheap and excellent — don’t seek out restaurants.</li><li>Swim/wade to the Ksamil islets instead of a daily boat.</li><li>Withdraw lek and pay cash — euros on the coast get a poor rate.</li></ul></div>
      <div class="listcard splurge-list"><h4>Worth the splurge</h4><ul><li>A guide + mule for the full Valbona crossing if the family is ready.</li><li>A Shala River boat excursion off the Koman ferry.</li><li>A half-day RIB boat to the Ksamil/Sarande sea caves and Tongo Island.</li><li>The Gjipe boat taxi so the kids skip the hot uphill return.</li><li>Front-row beach loungers on one peak afternoon.</li></ul></div>
    </div>
  </section>

  <section id="totals" class="divider">
    <div class="section-label">
      <p class="eyebrow">Bottom Line</p>
      <h2>Total trip cost</h2>
      <p>This route clears the $12k target with real room to spare, and even the high case stays under the $15k hard cap. The value is the headline: a two-week mountains-and-coast trip for a family of four near $9.7k.</p>
    </div>
    ${table(['Category', 'Estimate'], [
      ['Flights + Corfu ferry', '$5,330 target / $7,780 high'],
      ['Lodging, 13 hotel nights', '$1,285 target / $1,750 high'],
      ['Rental car, fuel, one-way drop', '$650 target / $950 high'],
      ['Food, groceries, activities, tickets', '$2,000 target / $2,750 high'],
      ['Insurance, fees, buffer', '$450 target / $1,000 high'],
      ['<b>Grand total - family of 4</b>', '<b>$9,715 target / $14,230 high</b>'],
    ])}
    <p class="rate-note">Per-day itinerary costs cover food + activities only. Lodging, flights, the rental car, and docs sit in the totals above, not the daily numbers.</p>
  </section>

  <section id="tips" class="divider">
    <div class="section-label">
      <p class="eyebrow">Travel Tips</p>
      <h2>The stuff nobody tells you</h2>
      <p>Operational rules that keep a two-region Albania route smooth with kids.</p>
    </div>
    <div class="tips-order">
      <p class="mini-h">Book in roughly this order</p>
      <ol>
        <li>Open-jaw PIT-Tirana / Corfu-PIT airfare<span> &middot; start tracking when schedules load</span></li>
        <li>Theth guesthouse (half-board) and Ksamil apartment<span> &middot; refundable, family rooms</span></li>
        <li>Rental car with free one-way drop, automatic<span> &middot; TIA pickup, Sarande drop</span></li>
        <li>Sarande-Corfu ferry + Corfu buffer hotel<span> &middot; once flight home is set</span></li>
        <li>Valbona guide/mule, Koman & sea-cave boats<span> &middot; nearer the date, weather-dependent</span></li>
      </ol>
    </div>
    <div class="tips-grid">
      <div class="tipcard"><h4>Cash & currency</h4><p class="sub">Albania runs on lek</p><ul><li class="flag"><b>Carry lek cash</b> — Theth guesthouses, ferries, parking, bunker museums, and market stalls are cash only.</li><li><b>Withdraw “without conversion”</b> at ATMs to dodge DCC fees.</li><li><b>Euros work poorly</b> on the coast — you’ll lose on the rate.</li></ul></div>
      <div class="tipcard t2"><h4>The mountains</h4><p class="sub">Scale the big hike honestly</p><ul><li class="flag"><b>The full Valbona pass is not a casual family walk.</b> Default to a turn-back with the 8-year-old.</li><li><b>Verify snow on the col</b> a few days out; keep a Grunas/Koman fallback.</li><li><b>Pack real layers</b> — Theth nights hit the 40s°F even in June.</li></ul></div>
      <div class="tipcard t3"><h4>The drive</h4><p class="sub">Respect the transfer day</p><ul><li class="flag"><b>Theth -> Ksamil is 8-9 hr.</b> Leave by 07:00 or split with a Berat/Vlore night.</li><li><b>Take the Llogara tunnel</b> when everyone is tired; the old pass road for the view.</li><li><b>No night driving</b> on the winding, unlit SH8 coast road.</li></ul></div>
      <div class="tipcard t4"><h4>The coast</h4><p class="sub">Warm water, easy wins</p><ul><li><b>Mornings are clearest</b> at Ksamil; sheltered coves stagnate by afternoon.</li><li><b>Butrint early</b> (9-11 am) to beat heat and buses, then swim.</li><li><b>Gjipe by boat</b> with kids — the uphill return is brutal in the sun.</li></ul></div>
    </div>
  </section>`;

// ---------------------------------------------------------------------------
// Social / Balance / Status
// ---------------------------------------------------------------------------
const socialBalanceStatus = `<section id="social" class="divider">
    <div class="section-label">
      <p class="eyebrow">What People Are Saying</p>
      <h2>Research signals to keep in mind</h2>
      <p>Guidebooks, road-trip write-ups, and official pages agree on the shape of this trip: north for the hiking, south for the swimming, and a ferry — not a flight — to leave.</p>
    </div>
    <div class="plan-grid">
      ${card('Mountains signal', `<p>The Theth-Valbona pass is repeatedly called one of the best day-hikes in the Balkans, and the Koman ferry one of the world’s most scenic boat rides — the reasons the north is worth five nights.</p>`)}
      ${card('Coast signal', `<p>Ksamil’s water is described as Caribbean-grade, warm and clear by mid-June, with wade-able islets — exactly the family swim payoff the Madeira idea lacked.</p>`)}
      ${card('Logistics signal', `<p>The recurring advice: one rental car north-to-south, drop it in Sarande, and ferry to Corfu to fly home. No island-hop, no self-transfer risk.</p>`)}
    </div>
  </section>

  <section id="balance" class="divider">
    <div class="section-label">
      <p class="eyebrow">Trip Balance</p>
      <h2>What the days add up to</h2>
      <p>Water-forward overall, but the mountain block is the emotional core. The coast makes the hiking sustainable for the kids.</p>
    </div>
    <div class="bar"><i style="width:45%;background:#1f6f78"></i><i style="width:20%;background:#7d5ba6"></i><i style="width:35%;background:#3f7d4e"></i></div>
    <div class="balance">
      <div class="bcard k1"><div class="pct">45%</div><h4>Water &middot; Beaches &middot; Coast</h4><p>Ksamil islets, Butrint’s coves, Himare/Gjipe/Porto Palermo, the Blue Eyes, boat days, and the Shala River swim.</p></div>
      <div class="bcard k2"><div class="pct">20%</div><h4>Towns &middot; Food &middot; Reset</h4><p>Tirana’s bazaar, Shkoder, Sarande’s waterfront, guesthouse dinners, and the Corfu buffer evening.</p></div>
      <div class="bcard k3"><div class="pct">35%</div><h4>Mountains &middot; Hikes &middot; Canyons</h4><p>Grunas Waterfall, the Blue Eye of Theth, the Valbona pass, the stone kulla towers, and the Koman ferry canyon.</p></div>
    </div>
  </section>

  <section id="status" class="divider">
    <div class="section-label"><p class="eyebrow">Settled &amp; Open</p><h2>What is decided, what still needs a call</h2><p>The route is opinionated, but 2027 schedules, ferry times, and guesthouse prices need live re-quotes before booking.</p></div>
    <div class="status"><div class="scol settled"><h4>Settled</h4>
      <div class="row"><b>Slug</b><span>albania</span></div>
      <div class="row"><b>Route</b><span>Tirana 1 night -> Theth 5 nights -> Ksamil 6 nights -> Corfu airport buffer 1 night.</span></div>
      <div class="row"><b>Dates</b><span>Depart Mon Jun 7, 2027; arrive home by Tue Jun 22, ahead of the preferred Jun 23 return and required Pittsburgh days Jun 24-26.</span></div>
      <div class="row"><b>Air strategy</b><span>Open-jaw: into Tirana, home out of Corfu, one rental car, 30-min Sarande-Corfu ferry as the exit.</span></div>
      <div class="row"><b>Budget verdict</b><span>~$9,715 target / ~$14,230 high case — well under the $12k target and the $15k cap.</span></div>
    </div><div class="scol open"><h4>Open</h4>
      <div class="row"><b>Valbona pass</b><span>Full crossing vs out-and-back depends on the 8-year-old’s readiness and current-season snow on the col.</span></div>
      <div class="row"><b>Big drive</b><span>Do Theth -> Ksamil in one deliberate day, or split it with a Berat/Vlore night?</span></div>
      <div class="row"><b>Corfu buffer</b><span>Keep the overnight, or attempt a clean same-day Sarande ferry -> CFU flight if timing genuinely allows.</span></div>
      <div class="row"><b>Automatic car</b><span>Availability and premium for an automatic need an early quote — manual is the default in Albania.</span></div>
    </div></div>
  </section>`;

// ---------------------------------------------------------------------------
// Pre-departure to-dos
// ---------------------------------------------------------------------------
const todo = {
  labelHtml: `
      <p class="eyebrow">Pre-Departure To-Do</p>
      <h2>What to book before leaving</h2>
      <p>Planning sequence for the Jun 7-22, 2027 Albania route. Inventory opens before prices are attractive, so tracking and buying are separate decisions.</p>
    `,
  blocks: [
    {
      when: 'Jul-Aug 2026',
      tone: 'hot',
      title: 'Flight inventory opens: track the open-jaw, do not auto-buy',
      note: 'Map options and set fare alerts; buy only when the protected routing and total price work.',
      items: [
        '<b>Search multi-city:</b> PIT -> TIA out, CFU -> PIT back, as a family-of-4 total. Watch VIE, MUC, FRA, LHR, IST hubs.',
        '<b>Set the airfare gate.</b> Target ~$5.2k family, high case ~$7.6k including seats/bags.',
        '<b>Confirm open-jaw prices like a round-trip</b> before defaulting to two one-ways.',
      ],
    },
    {
      when: 'By Sep 2026',
      title: 'Hold refundable lodging',
      items: [
        '<b>Theth:</b> 5 nights at a traditional guesthouse with half-board and a family room.',
        '<b>Ksamil:</b> 6 nights, apartment/hotel with pool or beach access, book early for June.',
        '<b>Buffers:</b> 1 central Tirana night and 1 refundable Corfu airport night.',
      ],
    },
    {
      when: 'Winter 2026-27',
      tone: 'watch',
      title: 'Car, ferry, and documents',
      items: [
        '<b>Reserve the rental car</b> with a free one-way TIA -> Sarande drop; request an automatic early.',
        '<b>Check passports (>=6 months), get IDPs</b> from AAA, and buy travel insurance.',
        '<b>Note the Sarande-Corfu ferry operators</b> (Finikas, Ionian Seaways); times publish weeks ahead.',
      ],
    },
    {
      when: '60-30 days out',
      title: 'Turn the mountain plan into bookings',
      items: [
        '<b>Arrange a Theth guide + mule</b> if attempting the full Valbona crossing.',
        '<b>Verify current-season snow</b> on the col with the guesthouse; confirm a Grunas/Koman fallback.',
        '<b>Book the Koman ferry / Shala River and any sea-cave boat day.</b>',
      ],
    },
    {
      when: 'Final 2 weeks',
      tone: 'done',
      title: 'Operational checks',
      items: [
        '<b>Download offline maps</b> for Theth, the SH21, the SH8 coast, Ksamil, and Sarande.',
        '<b>Reconfirm ferry times, car counters, guesthouse cash policy, and mountain weather.</b>',
        '<b>Pack layers, trail shoes, swimsuits, snacks, motion-sickness meds, lek cash, and printed confirmations.</b>',
      ],
    },
  ],
  callout: '<b>Do not forget:</b> the trip works because one rental car links the mountains and the coast, and a ferry — not a flight — gets you to the plane home. Carry lek, and default the Valbona pass to the kid-friendly turn-back.',
};

// ---------------------------------------------------------------------------
// Trailing map scripts (clone hawaii's, swap data, keep template types; OSM tile fix)
// ---------------------------------------------------------------------------
let scripts = T.parts[12].html
  .replace(/window\.__MAP_POINTS__=.*?;window\.__MAP_COLORS__=/s, `window.__MAP_POINTS__=${JSON.stringify(mapPoints)};window.__MAP_COLORS__=`)
  .replace(/window\.__MAP_COLORS__=.*?;window\.__MAP_TYPES__=/s, `window.__MAP_COLORS__=${JSON.stringify(mapColors)};window.__MAP_TYPES__=`)
  .replace(
    /L\.tileLayer\('https:\/\/maps\.[^']+',\{maxZoom:19,attribution:'&copy; OpenStreetMap contributors, [^']+'\}\)\.addTo\(map\);/,
    "L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);",
  );

// ---------------------------------------------------------------------------
// Scorecard — the working-tree build-summary.mjs requires one for EVERY trip
// (matching balkans/dolomites-sardinia/spain, which are also unranked). Kept
// with recommended:false: this registers the scores but does NOT promote the
// trip onto the hub (no index.html scoreboard row / ranked card yet). Axis
// scores are my best-reasoned call — flagged to the user for adjustment.
// /50 = budget×2 + weather+swim+variety+ease+food+risk+nights+novelty.
// ---------------------------------------------------------------------------
const scorecard = assertBaked({
  displayName: 'Albania',
  blurb: 'Alpine epic + a warm swim',
  axes: { budget: 5, weather: 4, swim: 5, variety: 5, ease: 3, food: 4, risk: 3, nights: 5, novelty: 5, pto: 2 },
  weightDefaults: { budget: 2, weather: 1, swim: 1, variety: 1, ease: 1, food: 1, risk: 1, nights: 1, novelty: 1, pto: 0 },
  budget: { floorUsd: 9715, ceilUsd: 14230, targetUsd: 12000, capUsd: 15000 },
  pto: { days: 9, nights: 13 },
  facets: { continent: 'europe', maxConnections: 2, swimTempF: [72, 75], noPassport: false, singleTicket: true, hasSwim: true },
  totalBaked: 44,
});

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------
const data = {
  recommended: false,
  countries: ['albania', 'greece'],
  packingTags: ['hiking', 'beach', 'heat'],
  slug: 'albania',
  lang: 'en',
  title: 'Albania · Accursed Mountains to the Riviera — June 2027',
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  overrides: {
    packing: [
      '<b>Real alpine layers:</b> fleece or light puffer and warm sleep clothes — Theth nights hit the 40s°F in June.',
      '<b>Proper hiking shoes:</b> the Grunas, Blue Eye, and Valbona trails are rocky; trainers are not enough for the pass.',
      '<b>Lek cash:</b> Theth guesthouses, ferries, parking, and bunker museums are cash only.',
      '<b>Sun & water kit:</b> UPF shirts, hats, reef-safe sunscreen, water shoes for pebble beaches, and a dry bag for boat days.',
      '<b>Car & motion kit:</b> nausea meds for the SH21/SH8 switchbacks, snacks, and a phone mount with offline maps.',
    ],
  },
  itinerary: {
    className: 'divider',
    labelHtml: `
      <p class="eyebrow">The Itinerary</p>
      <h2>Day by day</h2>
      <p>Swipe each carousel for photos. Every stop carries its cost, a money-saving tip, a splurge, picky-kid restaurants, backup / if-time ideas, blog links, and a map. Daily costs are food + activities only, not flights, lodging, or the car.</p>
`,
    daysClass: 'days',
    days,
  },
  parts: [
    { t: 'raw', html: `${headBody}${previewHtml}${navToMain}${overview}${calendar}` },
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
