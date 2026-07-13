#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as H from '../.agents/skills/travel-itinerary/scripts/itinerary-helpers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const MapT = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/portugal-sicily/main.json'), 'utf8'));
const outDir = path.join(root, 'src/_data/short-madeira');
const A = '../../assets/img/short-madeira';
const { headBody, navToMain } = H.sliceChrome(T.parts[0].html, 'Madeira Short Escape &middot; One Easy Base &mdash; June 2027');

const mapColors = { funchal: '#1f6f78', mountains: '#3f7d4e', coast: '#c25a3a', transfer: '#7d5ba6' };
const mapPoints = [
  H.point('Madeira Airport (FNC)', 32.6979, -16.7745, 'transfer', 'flight'),
  H.point('Funchal / São Martinho apartment base', 32.6434, -16.9348, 'funchal', 'hotel'),
  H.point('Funchal Old Town and cable car', 32.6486, -16.9057, 'funchal', 'town'),
  H.point('Lido Bathing Complex', 32.6387, -16.9368, 'funchal', 'beach'),
  H.point('Pico do Areeiro', 32.7354, -16.9289, 'mountains', 'hike'),
  H.point('Balcões / Ribeiro Frio', 32.7358, -16.8869, 'mountains', 'hike'),
  H.point('Fanal Forest', 32.8106, -17.1425, 'mountains', 'hike'),
  H.point('Porto Moniz Natural Pools', 32.8669, -17.1667, 'coast', 'beach'),
  H.point('Cabo Girão Skywalk', 32.6572, -17.0047, 'coast', 'view'),
  H.point('Rabaçal / PR6 Levada das 25 Fontes', 32.7530, -17.1340, 'mountains', 'hike'),
  H.point('Risco Waterfall / PR6.1', 32.7582, -17.1290, 'mountains', 'view'),
  H.point('Ponta de São Lourenço', 32.7434, -16.7008, 'coast', 'hike'),
  H.point('Machico beach', 32.7192, -16.7622, 'coast', 'beach'),
];

const photos = {
  funchal: [
    H.img(`${A}/funchal-cable-car.jpg`, 'Cable cars above Funchal and the Atlantic', 'Balázs Gábor &middot; Unsplash License'),
    H.img(`${A}/funchal-bay.jpg`, 'Funchal amphitheatre beside the sea', 'Amir Deljouyi &middot; Unsplash License'),
  ],
  peaks: [
    H.img(`${A}/pico-areeiro.jpg`, 'Pico do Areeiro ridge above the clouds', 'Hikerwise.com &middot; Unsplash License'),
    H.img(`${A}/laurissilva.jpg`, 'Mist-softened Laurissilva trail', 'Willi Nüchterlein &middot; Unsplash License'),
  ],
  west: [
    H.img(`${A}/porto-moniz.jpg`, 'Porto Moniz lava pools from above', 'Colin Watts &middot; Unsplash License'),
    H.img(`${A}/fanal-mist.jpg`, 'Ancient trees in Fanal mist', 'Tomas Trajan &middot; Unsplash License'),
  ],
  pr6: [
    H.img(`${A}/risco-waterfall.jpg`, 'Risco waterfall through the Laurissilva', 'Daniel J. Schwarz &middot; Unsplash License'),
    H.img(`${A}/levada-waterfall.jpg`, 'Green cascade beside a Madeira levada', 'Eurico Craveiro &middot; Unsplash License'),
  ],
  east: [
    H.img(`${A}/ponta-lourenco.jpg`, 'Ponta de São Lourenço volcanic headland', 'Kylli Kittus &middot; Unsplash License'),
    H.img(`${A}/ponta-lourenco-mist.jpg`, 'Ochre cliffs meeting the Atlantic', 'Daniele Franchi &middot; Unsplash License'),
  ],
};

const commonBlogs = [{ label: 'Official Madeira trail status', href: 'https://visitmadeira.com/en/what-to-do/nature-seekers/activities/hiking/' }];
const funchal = H.mkSpot({
  name: 'Funchal soft landing: old town, cable car and Lido', carouselId: 'sm-funchal', images: photos.funchal,
  lat: 32.6486, lng: -16.9057, tags: ['funchal', 'madeira'],
  cost: 'Old Town and the seafront are free. Treat the cable car as an optional €60–80 family splurge after confirming the 2027 fare; Lido is a low-cost municipal swim.',
  climate: '<b>June coast normal:</b> about 65–75°F with low rainfall. Sea water is usually refreshing rather than warm, around 68–71°F; the saltwater pool is the gentler entry.',
  save: 'Stay in São Martinho/Lido with a kitchen and use buses or taxis on the two city days. Walk the promenade and Old Town for free.',
  splurge: 'Ride the cable car to Monte for the city-and-ocean reveal; skip the expensive basket sled unless everyone genuinely wants it.',
  restos: ['<b>Casa do Bolo do Caco</b> — burgers and simple sandwiches.', '<b>O Giro</b> — pizza, pasta and grilled chicken in central Funchal.', '<b>Continente Modelo São Martinho</b> — breakfast, picnic and apartment-dinner fallback.'],
  alts: ['CR7 Museum and marina if arrival weather is wet.', 'Monte Palace gardens instead of a swim.', 'A slow Lido promenade sunset with supermarket picnic supplies.'],
  blogs: [{ label: 'Official Funchal guide', href: 'https://visitmadeira.com/en/where-to-go/madeira/south-coast/funchal/' }],
});
const peaks = H.mkSpot({
  name: 'Pico do Areeiro sunrise, then Balcões family walk', carouselId: 'sm-peaks', images: photos.peaks,
  lat: 32.7354, lng: -16.9289, tags: ['picodoarieiro', 'balcoes'],
  cost: 'All classified PR trails require advance SIMplifica reservation. The official 2026 individual fee is generally €4.50 per visitor; verify the exact 2027 status, slot and fee. Parking/viewpoint time is otherwise inexpensive.',
  climate: '<b>Mountain rules:</b> the summit can be cold, windy or inside cloud while Funchal is sunny. This plan does not commit the 8-year-old to the full PR1 ridge; Balcões is the default family walk.',
  save: 'Self-drive at dawn, take the summit viewpoint and a short safe segment, then retreat to the lower, short Balcões route.',
  splurge: 'Book a reputable sunrise transfer so nobody drives mountain roads before dawn; keep the rental for the other island days.',
  restos: ['<b>O Abrigo do Poiso</b> — grilled chicken, soup and fries.', '<b>Ribeiro Frio Restaurant</b> — trout for adults and simple grilled plates.', '<b>Apartment dinner</b> — the reliable recovery meal after an early start.'],
  alts: ['Swap with the west-coast day for a clear summit forecast.', 'Santana houses if cloud closes both viewpoints.', 'Cable car and Monte gardens if mountain access is shut.'], blogs: commonBlogs,
});
const west = H.mkSpot({
  name: 'Fanal mist forest, Porto Moniz pools and Cabo Girão', carouselId: 'sm-west', images: photos.west,
  lat: 32.8669, lng: -17.1667, tags: ['fanal', 'portomoniz'],
  cost: 'Fanal wandering is free; Cabo Girão is currently €5 for visitors over 12 and free at 12 or under. Porto Moniz has a modest municipal admission; confirm the 2027 family rate and live pool opening.',
  climateLabel: 'Water & weather', climate: '<b>Two microclimates in one day:</b> Fanal may be foggy and cool while the coast is bright. Atlantic swell can close the pools; swimming is conditional on staff and live conditions.',
  save: 'Use the staffed Porto Moniz complex only if open; otherwise enjoy the aerial view and continue the scenic loop without paying for a replacement tour.',
  splurge: 'A west-island small-group tour removes the longest driving day and lets both adults enjoy the views.',
  restos: ['<b>Sea View Restaurant, Porto Moniz</b> — pizza, grilled chicken and fries.', '<b>Olhos d’Água</b> — fish plus straightforward sides.', '<b>Packed Continente lunch</b> — best hedge against weather changing the day order.'],
  alts: ['Free Cachalote pools only when supervised and calm.', 'Seixal viewpoint rather than an exposed ocean swim.', 'Câmara de Lobos harbor on the return drive.'], blogs: [{ label: 'Official Porto Moniz pools', href: 'https://visitmadeira.com/en/where-to-go/madeira/north-coast/porto-moniz/natural-pools-of-porto-moniz/' }],
});
const pr6 = H.mkSpot({
  name: 'PR6 25 Fontes + PR6.1 Risco waterfall', carouselId: 'sm-pr6', images: photos.pr6,
  lat: 32.7530, lng: -17.1340, tags: ['25fontes', 'risco', 'rabacal'],
  cost: 'Official 2026 rules require an advance online SIMplifica reservation for every classified PR trail. The individual fee is generally €4.50 per visitor; combining PR6 and PR6.1 may use the €9 daily combined-trail product. Recheck the exact 2027 product, slot and status before paying.',
  climateLabel: 'Trail & status', climate: '<b>PR6 is officially medium difficulty:</b> 4.3 km and about 3 hours for the signed route, before access-road/shuttle walking and the optional PR6.1 branch. Risco is an easier 1.5 km each way. Narrow levada edges, wet stone and crowd pinch-points need patient supervision.',
  save: 'Reserve the first practical morning slot, park at ER105 and use the Rabaçal shuttle only if it materially helps the younger child. Pack lunch and return before the busiest midday flow.',
  splurge: 'Use a small-group guided transfer from Funchal so both adults can focus on the children at narrow levada sections.',
  restos: ['<b>Rabaçal Nature Spot Café</b> — simple sandwiches, cake and drinks near the route hub.', '<b>Calheta pizzerias</b> — pizza and fries on the drive back.', '<b>Apartment dinner</b> — pack a real trail lunch and keep the evening easy.'],
  alts: ['Do PR6.1 Risco only if PR6 is too crowded or legs are tired.', 'Levada do Alecrim (PR6.2) only with its own valid reservation/status.', 'Stay in Funchal if the official page marks the route restricted or closed.'],
  blogs: [{ label: 'Official PR6 page', href: 'https://visitmadeira.com/en/what-to-do/nature-seekers/activities/hiking/pr-6-levada-das-25-fontes/' }, { label: 'SIMplifica trail reservations', href: 'https://simplifica.madeira.gov.pt/services/78-82-259' }],
});
const east = H.mkSpot({
  name: 'Ponta de São Lourenço viewpoints and Machico beach', carouselId: 'sm-east', images: photos.east,
  lat: 32.7434, lng: -16.7008, tags: ['pontasaolourenco', 'machico'],
  cost: 'PR8 requires an advance SIMplifica reservation; the official 2026 individual fee is generally €4.50. The road viewpoints and Machico beach are free; budget only parking/snacks if the full trail is too hot or windy.',
  climate: '<b>Exposed and dry:</b> start early with hats and water. Machico’s sheltered sand makes the easiest ocean try, but June water is refreshing and live flags still control the decision.',
  save: 'Walk only the first photogenic ridge section, turn around before the family is depleted, then picnic and paddle at Machico.',
  splurge: 'Take a half-day guided east-island walk with hotel pickup and let the rental sit.',
  restos: ['<b>Pizza Café, Machico</b> — plain pizza fallback.', '<b>O Pescador</b> — grilled chicken, fries and fish.', '<b>São Roque supermarket picnic</b> — inexpensive beach lunch.'],
  alts: ['Machico promenade and beach only for a true rest day.', 'Whale-watching from Funchal if wind closes PR8.', 'Levada dos Maroços for a gentler green walk.'], blogs: commonBlogs,
});

const days = [
  H.travelDay('day0', '0', 'Fri &middot; Jun 11', 'Depart Pittsburgh after work', 'One protected ticket; sleep on the plane.', '$40–80 food', [H.fact('Route rule', 'PIT &rarr; Lisbon or another European hub &rarr; FNC; reject separate tickets.'), H.fact('PTO', 'None &mdash; evening departure')], 'The short trip only works if the long-haul is protected and reasonably timed.'),
  H.day('day1', 'c1', '1', 'Sat &middot; Jun 12', 'Arrive, unpack once, keep Funchal soft', 'Airport transfer, groceries and a low-pressure evening.', '$100–180', [H.fact('Sleep', 'Funchal / São Martinho &middot; night 1 of 7'), H.fact('Drive', '20–30 min airport transfer')], 'No rental-car pickup after an overnight flight.', [funchal]),
  H.day('day2', 'c1', '2', 'Sun &middot; Jun 13', 'Pico do Areeiro weather window + Balcões', 'Big scenery without forcing the full ridge.', '$90–170', [H.fact('Sleep', 'Same apartment &middot; night 2'), H.fact('Walking', 'Short summit segment + easy Balcões default')], 'Move this day whenever the summit forecast is clearest.', [peaks]),
  H.day('day3', 'c1', '3', 'Mon &middot; Jun 14', 'Fanal and Porto Moniz west loop', 'The longest drive earns forest, cliffs and a conditional swim.', '$120–220', [H.fact('Sleep', 'Same apartment &middot; night 3'), H.fact('Drive', 'About 3.5–4.5 hr total with stops')], 'Treat a closed pool as information, not a failed day.', [west]),
  H.day('day4', 'c1', '4', 'Tue &middot; Jun 15', 'Zero-car Funchal reset', 'Late breakfast, Old Town, cable car or Lido.', '$80–180', [H.fact('Sleep', 'Same apartment &middot; night 4'), H.fact('Pace', 'Deliberately light')], 'This buffer absorbs jet lag and any weather-driven swap.', []),
  H.day('day5', 'c1', '5', 'Wed &middot; Jun 16', 'PR6 25 Fontes + Risco waterfall', 'The signature levada day, booked and checked rather than improvised.', '$100–190', [H.fact('Sleep', 'Same apartment &middot; night 5'), H.fact('Walking', 'PR6 4.3 km / ~3 hr signed route; PR6.1 is optional')], 'A valid reservation and an open official status are go/no-go requirements.', [pr6]),
  H.day('day6', 'c1', '6', 'Thu &middot; Jun 17', 'Ponta de São Lourenço + Machico', 'Ochre coast first; sheltered sand afterward.', '$90–170', [H.fact('Sleep', 'Same apartment &middot; night 6'), H.fact('Drive', 'About 1.5 hr total')], 'Turn around early on PR8; this is a view day, not an endurance test.', [east]),
  H.day('day7', 'c1', '7', 'Fri &middot; Jun 18', 'Final flex day and pack', 'Juneteenth observed: repeat the best missed window or stay close to Funchal.', '$60–160', [H.fact('Sleep', 'Same apartment &middot; night 7'), H.fact('Holiday', 'Juneteenth observed &mdash; saves one PTO day')], 'Keep this day unbooked; return the rental by evening if the flight is early.', []),
  H.travelDay('day8', '8', 'Sat &middot; Jun 19', 'FNC to Pittsburgh', 'One connection preferred; home a full five days before the blackout.', '$60–120 food', [H.fact('Home', 'Saturday evening target'), H.fact('Buffer', 'Jun 20–23 fully at home before Jun 24–26')], 'Do not book an unprotected same-day connection.'),
];

const hero = H.preview({ kicker: 'Short Escape · 7 Nights · One Base', h1Main: 'Madeira', h1Sub: 'easy island, small footprint',
  lead: 'A compact family trip built around one Funchal apartment, four flexible driving days and no hotel moves. The scenery is the promise; Atlantic swimming is a welcome bonus.',
  stats: [['7', 'hotel nights'], ['1', 'home base'], ['5', 'PTO days'], ['$5.7–8.9k', 'expected family cost']],
  split: [[25, 'Water & coast', 's1'], [25, 'Town & reset', 's2'], [50, 'Nature & viewpoints', 's3']],
  images: [[`${A}/porto-moniz.jpg`, 'Day 3', 'Porto Moniz from above', 'A swim only when the Atlantic cooperates.'], [`${A}/pico-areeiro.jpg`, 'Day 2', 'Above the cloud sea', 'Summit views with a kid-scaled trail plan.'], [`${A}/risco-waterfall.jpg`, 'Day 5', 'Risco through the green', 'The booked signature levada-and-waterfall day.'], [`${A}/ponta-lourenco.jpg`, 'Day 6', 'The dry eastern headland', 'A dramatic counterpoint to the green interior.']] });

const overview = `<section id="overview" class="divider">${H.sectionLabel('The Shape of the Week', 'Funchal makes every day easier', 'Unpack near the Lido, then choose mountains, forest, waterfalls or coast each morning without changing hotels.')}<div class="plan-grid">${H.card('Your dates', H.prow('Leave Pittsburgh', 'Fri Jun 11, 2027') + H.prow('Arrive home', 'Sat Jun 19') + H.prow('Nights away', '7') + H.prow('Vacation days', '5'))}${H.card('Your home on the island', H.prow('Neighborhood', 'Funchal / São Martinho') + H.prow('Kitchen', 'Yes') + H.prow('Car', '4 adventure days') + H.prow('Hotel changes', 'None'))}${H.card('Why Funchal works', '<p>The island is compact enough for spectacular day trips, while Funchal supplies easy dinners, groceries, swimming facilities and pleasant low-key evenings when mountain weather changes.</p>')}</div></section>
<section id="why-this-trip" class="divider">${H.sectionLabel('Why Madeira Works', 'Island-sized variety without a complicated route', 'The week alternates true adventure days with easy city time, so the family sees Madeira without spending the vacation packing.')}<div class="tips-grid">${H.tipcard('Easy mornings', 'One key, one grocery run', ['No hotel changes.', 'The airport is about 20–30 minutes away.', 'Two days need no car at all.'])}${H.tipcard('Money goes further', 'Short stay, apartment kitchen', ['Airfare is the biggest variable.', 'Many viewpoints are free and trail fees are modest.', 'There are no ferries or extra flights.'], ' t2')}${H.tipcard('Water without pressure', 'Swim when the Atlantic feels right', ['Lido and Porto Moniz offer managed entries.', 'Machico is the gentlest beach try.', 'Every water stop is worthwhile even without swimming.'], ' t3')}</div></section>
<section id="stays" class="divider">${H.sectionLabel('Your Home Base', 'Stay near Funchal’s Lido', 'A comfortable apartment here puts groceries, evening walks and an easy swim close by, while keeping every island road trip within reach.')}<div class="plan-grid">${H.card('$125–225 per night', H.prow('Value week', '$875') + H.prow('Roomier week', '$1,575') + '<p>Stay west of the center for the Lido promenade and quicker road exits. A second hotel on the north coast would add packing without saving enough driving time.</p>')}${H.card('What the family needs', '<p>Look for two real bedrooms, four proper beds, a kitchen, washer, blackout curtains, and either parking or a nearby rental-car office. Air conditioning is nice to have, though coastal evenings are usually mild.</p>')}</div></section>`;

const calendarDays = [
  ['Fri', 'Jun 11', [['air', '6p', 'Depart PIT']]],
  ['Sat', 'Jun 12', [['air', '6a', 'Arrive FNC'], ['town', '4p', 'Funchal']]],
  ['Sun', 'Jun 13', [['car', '6a', 'Mountain drive'], ['hike', '8a', 'Pico + Balcões'], ['rest', '4p', 'Recover']]],
  ['Mon', 'Jun 14', [['car', '8a', 'West loop'], ['hike', '10a', 'Fanal'], ['water', '2p', 'Porto Moniz']]],
  ['Tue', 'Jun 15', [['town', '10a', 'Funchal'], ['water', '3p', 'Lido']]],
  ['Wed', 'Jun 16', [['car', '7a', 'Rabaçal drive'], ['hike', '9a', 'PR6 + Risco']]],
  ['Thu', 'Jun 17', [['hike', '8a', 'Ponta ridge'], ['water', '2p', 'Machico']]],
  ['Fri', 'Jun 18', [['rest', '10a', 'Final flex'], ['rest', '4p', 'Pack']]],
  ['Sat', 'Jun 19', [['air', '6a', 'Fly home']]],
];
const calendar = `<section id="calendar" class="divider">
  ${H.sectionLabel('Daily Rhythm', 'How the week unfolds', 'Early starts protect the mountain and levada days; the Funchal reset and final flex day give the family room to slow down or follow the best weather.')}
  <style>
    .short-cal-legend{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 16px}.short-cal-legend span{display:inline-flex;align-items:center;gap:6px;font-size:.76rem;font-weight:700}.short-cal-legend i{width:14px;height:14px;border-radius:4px}.short-cal-scroll{overflow-x:auto;padding-bottom:8px}.short-cal-strip{display:grid;grid-template-columns:repeat(9,minmax(124px,1fr));gap:8px;min-width:1160px}.short-cal-day{border:1px solid var(--line);border-radius:12px;background:var(--card);overflow:hidden;min-height:224px}.short-cal-head{padding:9px 10px;border-bottom:1px solid var(--line);background:rgba(31,111,120,.06)}.short-cal-head b{display:block;font-size:.72rem;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}.short-cal-head strong{font-size:1rem}.short-cal-events{display:flex;flex-direction:column;gap:7px;padding:9px}.short-cal-event{border-radius:7px;padding:7px;color:#fff;font-size:.7rem;font-weight:750;line-height:1.18}.short-cal-event small{display:block;font-size:.62rem;opacity:.82;margin-bottom:2px}.short-cal-event.air{background:#3d4d74}.short-cal-event.car{background:var(--gold);color:#3a2f12}.short-cal-event.hike{background:var(--c3)}.short-cal-event.water{background:var(--c1)}.short-cal-event.town{background:var(--c2)}.short-cal-event.rest{background:#8a857c}
  </style>
  <div class="short-cal-legend"><span><i style="background:#3d4d74"></i>Air</span><span><i style="background:var(--gold)"></i>Drive</span><span><i style="background:var(--c3)"></i>Hike</span><span><i style="background:var(--c1)"></i>Water</span><span><i style="background:var(--c2)"></i>Town</span><span><i style="background:#8a857c"></i>Rest</span></div>
  <div class="short-cal-scroll" aria-label="Madeira trip calendar, June 11 through June 19, 2027"><div class="short-cal-strip">${calendarDays.map(([dow,date,events]) => `<article class="short-cal-day"><div class="short-cal-head"><b>${dow}</b><strong>${date}</strong></div><div class="short-cal-events">${events.map(([act,time,label]) => `<div class="short-cal-event ${act}"><small>${time}</small>${label}</div>`).join('')}</div></article>`).join('')}</div></div>
</section>`;

const mapAirGround = `<section id="map" class="divider">${H.sectionLabel('Find Your Bearings', 'Mountains, waterfalls and coast from Funchal', 'The island is small, but steep roads and microclimates make each direction feel like a different day out.')}<div class="tripmap-wrap"><div class="mapbtns"><button class="active" data-region="all">Whole trip</button><button data-region="funchal">Funchal</button><button data-region="mountains">Mountains</button><button data-region="coast">Coast</button><button data-region="transfer">Airport</button></div><div class="mapstage"><div id="tripmap"></div></div></div></section>
<section id="air-travel" class="divider">${H.sectionLabel('Getting to Madeira', 'Protect the connection and keep it simple', 'A single-ticket itinerary matters more than chasing the absolute cheapest fare, especially at a wind-sensitive island airport.')}<div class="plan-grid">${H.card('Best flight path', H.prow('Outbound', 'PIT–LIS–FNC') + H.prow('Return', 'FNC–LIS–PIT') + H.prow('Stops', '1 preferred; 2 max') + '<p>Buy the journey as one protected round trip. There is no PIT–FNC nonstop; exact June 2027 schedules still need to load before choosing the best connection.</p>')}${H.card('When the fare still feels right', H.prow('Excellent family fare', 'Around $3,000 with bags/seats') + H.prow('Upper comfort limit', '$4,400') + '<p>If the protected family total rises much above $4.4k, Madeira loses its value advantage. Separate tickets are not worth the missed-connection risk.</p>')}</div></section>
<section id="getting-around" class="divider">${H.sectionLabel('Driving the Island', 'Use a car for adventures, not city days', 'Four car days reach the peaks, west coast, Rabaçal and eastern headland; taxis or the Aerobus cover the airport and Funchal days.')}<div class="plan-grid">${H.card('Small automatic for four days', H.prow('Allow', '$450–800 all-in') + H.prow('Pickup', 'Delivered in Funchal') + H.prow('Return', 'Before the flight-home day') + '<p>Choose the smallest automatic that fits the family comfortably. Madeira’s steep streets and tight parking make an oversized vehicle a burden.</p>')}${H.card('Keep mountain roads comfortable', '<p>Skip summit driving in poor visibility, leave time for the west loop, and avoid an ambitious drive before flying home. Weather, parking and trail conditions set the day order.</p>')}</div></section>`;

const healthTiming = `<section id="health-check" class="divider">${H.sectionLabel('Travel Well', 'Three checks keep the week comfortable', 'Madeira is easy to enjoy when trail access, ocean conditions and mountain weather are treated as daily decisions.')}<div class="hc-grid"><div class="hc actnow"><div class="hc-tag">Reserve</div><h4>Trail access</h4><p>Book classified PR trails in advance and check for closures before leaving Funchal.</p></div><div class="hc watch"><div class="hc-tag">Check daily</div><h4>Ocean and wind</h4><p>Beach flags decide swimming; cloud and wind decide the peaks and can also affect flights.</p></div><div class="hc good"><div class="hc-tag">Plenty of room</div><h4>Homeward buffer</h4><p>Returning June 19 leaves five full days at home before June 24–26.</p></div></div></section>
<section id="timing" class="divider">${H.sectionLabel('Choose the Right Week', 'Juneteenth saves a vacation day', 'Traveling June 11–19 uses the Friday holiday, preserves the family’s June 24–26 commitment and still gives Madeira seven full nights.')}<div class="timing-compare"><div class="tcard best"><div class="tlabel">Best fit</div><h4>Jun 11–19</h4><div class="trow"><span>Nights</span><b>7</b></div><div class="trow"><span>Vacation days</span><b>5</b></div><div class="trow"><span>Holiday</span><b>Fri Jun 18</b></div></div><div class="tcard now"><div class="tlabel">Too late</div><h4>Jun 18–26</h4><div class="trow"><span>Conflict</span><b>Jun 24–26</b></div><div class="trow"><span>Fit</span><b>Does not work</b></div></div></div><div class="verdict-box"><b>Travel June 11–19.</b> Friday June 18 is the observed Juneteenth holiday, so the trip needs only five vacation days and finishes comfortably before the family commitment.</div></section>`;

const budgetTips = `<section id="budget" class="divider">${H.sectionLabel('What the Week Costs', 'Most of the budget goes to getting there', 'Use these ranges to judge flight and apartment choices; refresh exact prices when June 2027 inventory opens.')} ${H.table(['What you are paying for','Value range','Comfort range'], [['Protected PIT–FNC airfare, seats, bags','$3,000','$4,400'],['7-night apartment','$875','$1,575'],['4-day automatic, fuel, parking, transfers','$550','$950'],['Food and groceries','$700','$1,050'],['Activities and tickets','$175','$325'],['Insurance, ETIAS, extra cushion','$400','$600'],['<b>Grand total</b>','<b>$5,700</b>','<b>$8,900</b>']])}</section>
<section id="totals" class="divider">${H.sectionLabel('Family Price Range', '$5.7k–$8.9k for four', 'The lower end needs a strong airfare and apartment find; the upper end allows more comfortable choices without turning this into a major-trip budget.')} ${H.table(['Category','Allow for the family'], [['Flights','$3,000–4,400'],['Lodging','$875–1,575'],['Ground transport','$550–950'],['Food + activities','$875–1,375'],['Documents + extra cushion','$400–600'],['<b>Grand total</b>','<b>$5,700–8,900</b>']], 'budget-tbl grand')}<p class="rate-note">The day-by-day amounts cover meals and activities; flights, apartment and car appear only in this full-trip estimate.</p></section>
<section id="tips" class="divider">${H.sectionLabel('Make the Week Flow', 'Let weather lead and keep meals simple', 'A little flexibility matters more here than squeezing in another attraction.')}<div class="tips-order"><ol><li>Track a protected airfare<span> · buy when the total feels right</span></li><li>Hold a refundable apartment<span> · kitchen, washer, four real beds</span></li><li>Reserve a small automatic<span> · Funchal delivery is easiest</span></li><li>Book PR trail times<span> · then recheck access before hiking</span></li></ol></div><div class="tips-grid">${H.tipcard('Follow the clearest sky', 'Reorder the middle days freely', ['Put Pico on the clearest morning.', 'Use Funchal as the easy swap day.', 'Never force a closed trail or rough pool.'])}${H.tipcard('Keep picky eating easy', 'Use the apartment and pack lunches', ['Make breakfast and two dinners at home.', 'Carry a picnic on every road day.', 'Pizza, burgers and grilled chicken are easy in Funchal, Machico and Porto Moniz.'], ' t2')}</div></section>`;

const socialBalanceStatus = `<section id="social" class="divider">${H.sectionLabel('What June Feels Like', 'Warm coast, changeable peaks, refreshing water', 'Madeira rewards families who dress in layers and treat the daily forecast as an invitation to choose the right side of the island.')}<div class="plan-grid">${H.card('Mild, mostly dry coast', '<p>Funchal is usually comfortable for walking and outdoor dinners in June. The peaks can still be cloudy, windy and much cooler.</p>')}${H.card('Swimming is a bonus', '<p>Lido and Porto Moniz offer managed water access, but the Atlantic remains refreshing and swell can change the plan.</p>')}${H.card('Simple days from Funchal', '<p>Every outing returns to the same apartment, with no ferry, extra flight or hotel move. The only complicated choice is finding a good protected fare to the island.</p>')}</div></section>
<section id="balance" class="divider">${H.sectionLabel('The Feel of the Trip', 'Adventurous days with room to recover', 'Peaks, levadas and volcanic coast carry the excitement; Funchal and the final flex day keep the week from becoming a hiking marathon.')}<div class="bar"><i style="width:25%;background:#1f6f78"></i><i style="width:25%;background:#c25a3a"></i><i style="width:50%;background:#3f7d4e"></i></div><div class="balance"><div class="bcard k1"><div class="pct">25%</div><h4>Water & coast</h4><p>Porto Moniz, Lido, Machico and ocean viewpoints.</p></div><div class="bcard k2"><div class="pct">25%</div><h4>Town & downtime</h4><p>Funchal Old Town, gardens, promenade and relaxed apartment evenings.</p></div><div class="bcard k3"><div class="pct">50%</div><h4>Trails & views</h4><p>Pico, Balcões, Fanal, 25 Fontes, Risco and Ponta.</p></div></div></section>
<section id="status" class="divider">${H.sectionLabel('Before You Book', 'What you can choose now—and what should wait', 'The dates and shape of the week are clear; prices, trail times and ocean conditions get decided closer to travel.')}<div class="status"><div class="scol settled"><h4>Ready to plan around</h4><div class="row"><b>Length</b><span>Seven-night island escape</span></div><div class="row"><b>Dates</b><span>Jun 11–19, 2027</span></div><div class="row"><b>Neighborhood</b><span>Funchal / São Martinho</span></div><div class="row"><b>Expected cost</b><span>$5.7k–$8.9k for four</span></div></div><div class="scol open"><h4>Choose closer to travel</h4><div class="row"><b>Flights</b><span>The best protected June 2027 fare and connection</span></div><div class="row"><b>Apartment</b><span>A refundable two-bedroom near the Lido</span></div><div class="row"><b>Trail times</b><span>Slots that fit the forecast and the children</span></div><div class="row"><b>Swimming</b><span>Beaches and pools with calm same-day conditions</span></div></div></div></section>`;

const todo = { labelHtml: '<p class="eyebrow">Before You Go</p><h2>Book the trip in four simple rounds</h2><p>Flights and the apartment come first; the car and trail times can follow once the week is secure.</p>', blocks: [
  { when: 'When flights load', tone: 'hot', title: 'Find a protected family fare', items: ['Compare PIT–LIS–FNC on one ticket with other protected one-stop options.', 'Include seats and checked bags; pause if the family total rises much above $4,400.', 'Hold the seven-night apartment only after the flight dates work.'] },
  { when: '6–9 months out', title: 'Hold apartment and automatic', items: ['Book a refundable two-bedroom São Martinho/Lido apartment.', 'Reserve the smallest automatic for four island-driving days.', 'Buy travel insurance after the first non-refundable payment.'] },
  { when: '30 days out', tone: 'watch', title: 'Trail and entry checks', items: ['Reserve the intended PR routes in the official system.', 'Recheck ETIAS launch and passport validity.', 'Save pool, trail, airport and emergency contacts offline.'] },
  { when: 'Final week', tone: 'done', title: 'Let weather set the order', items: ['Choose the clearest Pico morning.', 'Check live trail closures and webcams.', 'Check Atlantic flags/swell before every swim.'] },
], callout: '<b>The key to an easy week:</b> protect the flights, unpack once, and let Madeira’s weather choose the order of the adventure days.' };

const scorecard = H.assertBaked({ displayName: 'Portugal: Madeira', blurb: 'One easy base, big scenery, controlled spend',
  axes: { budget: 5, weather: 4, swim: 2, variety: 4, ease: 4, food: 4, risk: 3, nights: 1, novelty: 5, pto: 5 },
  weightDefaults: { budget: 2, weather: 1, swim: 1, variety: 1, ease: 1, food: 1, risk: 1, nights: 1, novelty: 1, pto: 0 },
  budget: { floorUsd: 5700, ceilUsd: 8900, targetUsd: 12000, preferredMaxUsd: 15000 }, pto: { days: 5, nights: 7 },
  facets: { continent: 'europe', maxConnections: 2, swimTempF: [68, 71], noPassport: false, singleTicket: true, hasSwim: false }, totalBaked: 37 });

const data = { recommended: true, tripCategory: 'short', slug: 'short-madeira', lang: 'en', title: 'Madeira Short Escape · One Easy Base — June 2027', countries: ['portugal'], packingTags: ['hiking', 'beach', 'rain'], hasPhotoGuide: false, hasFoodGuide: false,
  mapPoints, mapColors, overrides: { packing: ['<b>Microclimate layers:</b> light fleece and rain shell even when Funchal is warm.', '<b>Pool kit:</b> water shoes and quick-dry towels for volcanic entries.', '<b>Road kit:</b> phone mount, offline map and motion-sickness medicine.', '<b>Trail kit:</b> grippy shoes, hats, headlamps and refillable bottles.'] },
  itinerary: { className: 'divider', labelHtml: '<p class="eyebrow">Your Week on Madeira</p><h2>From Funchal to the peaks and waterfalls</h2><p>Each day returns to the same apartment. Swap the mountain and coast outings when weather changes, and use the listed daily amounts for meals and activities.</p>', daysClass: 'days', days },
  parts: [{t:'raw',html:`${headBody}${hero}${navToMain}${overview}${calendar}`},{t:'itinerary'},{t:'raw',html:mapAirGround},{t:'entry'},{t:'raw',html:healthTiming},{t:'todo'},{t:'raw',html:budgetTips},{t:'packing'},{t:'raw',html:socialBalanceStatus},...MapT.parts.slice(11,14),{t:'raw',html:H.mapScripts(MapT.parts[14].html,mapPoints,mapColors)}],
  preDepartureTodos: todo, scorecard };

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'main.json'), `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${path.relative(root, path.join(outDir, 'main.json'))}`);
