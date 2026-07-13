#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as H from '../.agents/skills/travel-itinerary/scripts/itinerary-helpers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const MapT = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/portugal-sicily/main.json'), 'utf8'));
const slug = 'short-iceland';
const outDir = path.join(root, 'src/_data', slug);
const A = (file) => `../../assets/img/${slug}/${file}`;
const photo = (file, title, credit) => H.img(A(file), title, credit);

const mapColors = { reykjavik: '#1f6f78', south: '#c25a3a', reykjanes: '#3f7d4e', transfer: '#3a6ea5' };
const mapPoints = [
  H.point('Keflavík International Airport', 63.985, -22.6056, 'transfer', 'flight'),
  H.point('Reykjavík · 2 nights', 64.1466, -21.9426, 'reykjavik', 'hotel'),
  H.point('Laugardalslaug', 64.1407, -21.88, 'reykjavik', 'beach'),
  H.point('Reykjavík Old Harbour', 64.1512, -21.941, 'reykjavik', 'town'),
  H.point('Þingvellir', 64.2559, -21.1295, 'south', 'view'),
  H.point('Geysir', 64.3104, -20.3024, 'south', 'view'),
  H.point('Gullfoss', 64.3271, -20.1199, 'south', 'view'),
  H.point('Secret Lagoon', 64.1379, -20.3107, 'south', 'beach'),
  H.point('Hella / Hvolsvöllur · 4 nights', 63.835, -20.4, 'south', 'hotel'),
  H.point('Seljalandsfoss', 63.6156, -19.9886, 'south', 'view'),
  H.point('Skógafoss', 63.5321, -19.5114, 'south', 'view'),
  H.point('Sólheimajökull', 63.531, -19.369, 'south', 'hike'),
  H.point('Reynisfjara', 63.4034, -19.0447, 'south', 'view'),
  H.point('Reykjanes Peninsula', 63.87, -22.45, 'reykjanes', 'view'),
  H.point('Keflavík · 1 night', 64.0049, -22.5657, 'reykjanes', 'hotel'),
];

const arrival = H.mkSpot({
  name: 'Reykjavík soft landing + geothermal reset', tags: ['reykjavik', 'geothermal'], carouselId: 'si-arrival',
  images: [photo('geothermal-steam.jpg', 'Geothermal steam in blue-hour light', 'Sam Bark · Unsplash License'), photo('geothermal-lounge.jpg', 'Infinity-edge geothermal water', 'Owen Roth · Unsplash License')],
  lat: 64.1407, lng: -21.88,
  cost: 'A Bónus grocery stop and a municipal-pool visit keep the landing day modest. Laugardalslaug admission is roughly 1,380 ISK per adult and 210 ISK per child at the current planning rate; recheck 2027 prices.',
  climateLabel: 'Warm reset', climate: '<b>Warm water, cool air.</b> The city lists the main pool at 82°F, children’s pool at 84°F, wading pool at 90°F and hot tubs at 100–111°F.',
  save: 'Use a city pool and an apartment meal rather than spending jet-lagged hours and premium prices at a destination lagoon.',
  splurge: 'Keep the first evening unbooked; a nice harbour dinner is a better optional upgrade than a rigid arrival slot.',
  restos: ['<b>Hamborgarabúllan</b> — burgers and fries.', '<b>Flatey Pizza</b> — familiar pizza.', '<b>Bónus</b> — breakfast, snacks and a simple apartment dinner.'],
  alts: ['Sundhöllin if Laugardalslaug maintenance changes.', 'A short Sun Voyager walk if everyone has energy.', 'Groceries and bed if the overnight flight lands hard.'],
  blogs: [{ label: 'Laugardalslaug · official', href: 'https://reykjavik.is/en/laugardalslaug-pool/about-laugardalslaug-pool' }],
});

const reykjavik = H.mkSpot({
  name: 'Reykjavík old town + Laugardalslaug', tags: ['reykjavik', 'laugardalslaug'], carouselId: 'si-reykjavik',
  images: [photo('reykjavik-rooftops.jpg', 'Reykjavík rooftops from above', 'Tim Trad · Unsplash License'), photo('hallgrimskirkja.jpg', 'Hallgrímskirkja over the old town', 'Owen Roth · Unsplash License')],
  lat: 64.1466, lng: -21.9426,
  cost: 'Hallgrímskirkja and the waterfront are free. Plan roughly 1,430 ISK per adult and 210 ISK per child for the tower, plus about 1,380 ISK per adult and 210 ISK per child for a city-pool visit; recheck 2027 prices. A family city day can stay near $80 before meals.',
  climateLabel: 'Air + pool', climate: '<b>June air averages roughly 46–55°F; pool water is genuinely warm.</b> The city lists the main Laugardalslaug pool at 82°F, children’s pool at 84°F, wading pool at 90°F, and hot tubs at 100–111°F.',
  save: 'Walk Hallgrímskirkja, Harpa, Sun Voyager and the harbour, then use a municipal geothermal pool instead of a premium lagoon.',
  splurge: 'Add one Elding whale-watch only if the forecast is calm; the classic boat is easier with children than a RIB.',
  restos: ['<b>Hamborgarabúllan</b> — burgers and fries.', '<b>Flatey Pizza</b> — Neapolitan pizza near Grandi.', '<b>Bónus</b> — apartment breakfast, snacks and picnic supplies.'],
  alts: ['Perlan for a wet afternoon.', 'Whales of Iceland beside the harbour.', 'Sundhöllin if Laugardalslaug hours or maintenance change.'],
  blogs: [{ label: 'Laugardalslaug · official', href: 'https://reykjavik.is/en/laugardalslaug-pool/about-laugardalslaug-pool' }, { label: 'Visit Reykjavík', href: 'https://visitreykjavik.is/' }],
});

const golden = H.mkSpot({
  name: 'Golden Circle: Þingvellir, Strokkur + Gullfoss', tags: ['goldencircle', 'gullfoss', 'strokkur'], carouselId: 'si-golden',
  images: [photo('gullfoss-aerial.jpg', 'Gullfoss from above', 'Rino Adamo · Pexels License'), photo('strokkur-sunset.jpg', 'Strokkur erupting in evening light', 'Suju · Pexels License')],
  lat: 64.3271, lng: -20.1199,
  cost: 'The three headline landscapes have no admission charge. Budget about 1,000 ISK for Þingvellir parking; Geysir and Gullfoss are currently free to enter. With a packed lunch, this is one of the trip’s cheapest high-wow days.',
  climateLabel: 'June weather', climate: '<b>Expect roughly 45–57°F, wind and spray.</b> Strokkur usually erupts every few minutes; Gullfoss viewpoints are short walks but wet. Waterproof shells matter more than umbrellas.',
  save: 'Pack lunch and treat the landscapes as the activity; do not add every paid crater and greenhouse stop.',
  splurge: 'Reserve Friðheimar tomato greenhouse for soup, pasta and a memorable lunch.',
  restos: ['<b>Gullfoss Café</b> — soup, sandwiches and cake.', '<b>Friðheimar</b> — tomato soup and pasta; reserve.', '<b>Efstidalur II</b> — burgers and farm ice cream.'],
  alts: ['Kerið crater for a short paid stop.', 'Laugarvatn Fontana if Secret Lagoon inventory fails.', 'Skip the loop and use Reykjavík museums if wind makes driving unpleasant.'],
  blogs: [{ label: 'Þingvellir · official', href: 'https://www.thingvellir.is/en/' }, { label: 'Geysir · South Iceland', href: 'https://www.south.is/en/place/geysir' }],
});

const secret = H.mkSpot({
  name: 'Secret Lagoon family soak', tags: ['secretlagoon', 'fludir'], carouselId: 'si-secret',
  images: [photo('secret-lagoon-rugged.jpg', 'Steaming pool in rugged geothermal country', 'Xintao Zhou · Pexels License'), photo('secret-lagoon-mist.jpg', 'Misty geothermal water near Flúðir', 'Laura Paredis · Pexels License')],
  lat: 64.1379, lng: -20.3107,
  cost: 'The operator currently lists adults at 4,200 ISK and children 14 and under at 200 ISK when accompanied by an adult: about 8,800 ISK for this family before towel rental. Bring towels and recheck the exact 2027 slot.',
  climateLabel: 'Warm water', climate: '<b>The bathing water is about 100–104°F.</b> This is the trip’s best-value natural-feeling warm swim and works for both children; outdoor air may be around 50°F.',
  save: 'Bring towels and skip the premium ritual package—the standard admission is the experience.',
  splurge: 'Book a quieter evening slot under the late light and eat nearby rather than rushing onward.',
  restos: ['<b>Minilik</b> — Ethiopian dishes with rice and mild options.', '<b>Farmers Bistro</b> — soup and familiar sides.', '<b>Picnic from Reykjavík</b> — the sure picky-eater fallback.'],
  alts: ['Laugarvatn Fontana on the Golden Circle.', 'A local Hella pool for the lowest-cost soak.', 'Move the swim to the following recovery day if the loop runs long.'],
  blogs: [{ label: 'Secret Lagoon · prices', href: 'https://secretlagoon.is/' }],
});

const waterfalls = H.mkSpot({
  name: 'Seljalandsfoss + Skógafoss', tags: ['seljalandsfoss', 'skogafoss'], carouselId: 'si-waterfalls',
  images: [photo('seljalandsfoss-rainbow.jpg', 'Seljalandsfoss and a full rainbow', 'Vibhavari Bellutagi · Pexels License'), photo('skogafoss-rainbow.jpg', 'Skógafoss rainbow curtain', 'Andreas Ebner · Pexels License')],
  lat: 63.57, lng: -19.75,
  cost: 'Both waterfalls have free admission. Plan about 1,000 ISK for Seljalandsfoss parking; Skógafoss parking is currently free. Gljúfrabúi and Kvernufoss are no-cost add-ons.',
  climateLabel: 'Spray', climate: '<b>Cool, wet and slippery even on a dry day.</b> June air is commonly in the upper 40s to mid-50s°F. Wear rain pants and grippy shoes for the walk behind Seljalandsfoss.',
  save: 'Make the free waterfall corridor the entire headline day and picnic between stops.',
  splurge: 'Add the Lava Centre in Hvolsvöllur if rain becomes persistent rather than buying another outdoor tour.',
  restos: ['<b>Mia’s Country Van</b> — fish and chips near Skógafoss; verify opening day.', '<b>Hotel Skógafoss Bistro</b> — burgers and fries.', '<b>Smiðjan Brugghús in Vík</b> — burgers, wings and fries.'],
  alts: ['Gljúfrabúi beside Seljalandsfoss.', 'Kvernufoss for a quieter short walk.', 'Lava Centre as the strong indoor weather fallback.'],
  blogs: [{ label: 'Seljalandsfoss · official region guide', href: 'https://www.south.is/en/place/seljalandsfoss' }, { label: 'Skógafoss · official region guide', href: 'https://www.south.is/en/place/skogafoss' }],
});

const glacier = H.mkSpot({
  name: 'Sólheimajökull guided glacier walk', tags: ['solheimajokull', 'glacierhike'], carouselId: 'si-glacier',
  images: [photo('glacier-walk.jpg', 'Roped walkers on Sólheimajökull', 'Brianna Eisman · Pexels License'), photo('glacier-blue-ice.jpg', 'Deep-blue glacier ice', 'Philippe Bonnaire · Pexels License')],
  lat: 63.531, lng: -19.369,
  cost: 'A current age-8-friendly three-hour guided walk is advertised from about $107 per person, roughly $428 for four before optional boot rental. Confirm the operator’s minimum shoe size and age rule before purchase.',
  climateLabel: 'On the ice', climate: '<b>Near-freezing feel, wind and glare.</b> Use warm layers, waterproofs, gloves and sturdy boots. Never step onto the glacier without a certified guide.',
  save: 'Walk only to the free glacier-tongue viewpoint if the tour price or the child fit is wrong.',
  splurge: 'The guided walk is the one adventure worth funding; skip extra paid attractions to make room for it.',
  restos: ['<b>Suður-Vík</b> — pizza, burgers and fries.', '<b>Smiðjan Brugghús</b> — burgers and wings.', '<b>Krónan Vík</b> — sandwiches and picnic food.'],
  alts: ['Free glacier viewpoint.', 'Skógar Museum in poor weather.', 'A slow Vík café morning if the guide cancels.'],
  blogs: [{ label: 'Tröll glacier tours', href: 'https://troll.is/tour/solheimajokull-glacier-hike/' }],
});

const blackBeach = H.mkSpot({
  name: 'Reynisfjara + Dyrhólaey viewpoints', tags: ['reynisfjara', 'dyrholaey'], carouselId: 'si-blackbeach',
  images: [photo('reynisfjara-basalt.jpg', 'Basalt columns above black sand', 'Laura Paredis · Pexels License'), photo('reynisfjara-surf.jpg', 'Atlantic surf on Iceland’s black coast', 'Raul Ling · Pexels License')],
  lat: 63.4034, lng: -19.0447,
  cost: 'No admission; Reynisfjara currently uses paid parking. Treat the beach as a brief viewpoint, not a play stop, and obey the live warning lights.',
  climateLabel: 'Safety first', climate: '<b>Ocean water around 50°F and dangerous sneaker waves.</b> This is not a swim. Stay well back on dry sand, face the sea, and leave immediately if the warning system escalates.',
  save: 'Keep it short and pair it with the paid glacier tour; the coastal views themselves are free.',
  splurge: 'None needed—spend on a warm meal in Vík after the glacier.',
  restos: ['<b>Black Crust Pizzeria</b> — pizza in Vík.', '<b>Ströndin Pub</b> — burgers and fish and chips.', '<b>Krónan Vík</b> — dependable grocery fallback.'],
  alts: ['View the sea stacks from Vík instead.', 'Dyrhólaey upper viewpoint if road and nesting restrictions allow.', 'Skip entirely when warning lights or wind are unfavorable.'],
  blogs: [{ label: 'SafeTravel beach conditions', href: 'https://safetravel.is/' }],
});

const reykjanes = H.mkSpot({
  name: 'Reykjanes lava coast + near-airport finale', tags: ['reykjanes', 'iceland'], carouselId: 'si-reykjanes',
  images: [photo('reykjanes-rift.jpg', 'Rift through Reykjanes lava', 'John Wayne Hill · Unsplash License'), photo('reykjanes-lava.jpg', 'Fresh lava glowing on Reykjanes', 'Rino Adamo · Pexels License'), photo('blue-lagoon.jpg', 'Milky-blue geothermal lagoon', 'Karsten Winegeart · Unsplash License')],
  lat: 63.87, lng: -22.45,
  cost: 'Gunnuhver, Bridge Between Continents and coastal viewpoints are free. Blue Lagoon pricing is dynamic and can exceed $100 per person; it is deliberately optional, not baked into the low budget.',
  climateLabel: 'Volcanic coast', climate: '<b>Windy and changeable.</b> Reykjanes access and air quality can change quickly with volcanic activity. Check SafeTravel and the Icelandic Met Office before leaving the main road.',
  save: 'Do the free peninsula loop, eat in Keflavík and use a local pool instead of Blue Lagoon.',
  splurge: 'Book a refundable Blue Lagoon slot only if operations and air quality are normal 48 hours before arrival.',
  restos: ['<b>Fernando’s</b> — pizza in Keflavík.', '<b>Hamborgarabúlla Tómasar</b> — burgers and fries.', '<b>Bónus Reykjanesbær</b> — final breakfast and plane snacks.'],
  alts: ['Viking World in poor weather.', 'Keflavík harbour walk.', 'Stay at the hotel if volcanic access is restricted.'],
  blogs: [{ label: 'SafeTravel Iceland', href: 'https://safetravel.is/' }, { label: 'Blue Lagoon status', href: 'https://www.bluelagoon.com/seismic-activity' }],
});

const days = [
  H.travelDay('day1', 'DAY 1', 'Sun · Jun 13', 'PIT → KEF overnight', 'One nonstop overnight flight; no connection or self-transfer.', '$60–100', [H.fact('Flight', 'Icelandair PIT → KEF nonstop'), H.fact('Sleep', 'Overnight in the air')], 'Eat before boarding and treat this as transportation, not an activity day.'),
  H.day('day2', 'c1', 'DAY 2', 'Mon · Jun 14', 'Soft landing in Reykjavík', 'Pick up one automatic car, check in for two nights, walk the compact center, then reset in a warm local pool.', '$120–180', [H.fact('Drive', 'KEF → Reykjavík · about 50 min'), H.fact('Sleep', 'Reykjavík · night 1 of 2')], 'Keep the first day low-stakes; groceries and an early night protect the rest of the week.', [arrival]),
  H.day('day3', 'c1', 'DAY 3', 'Tue · Jun 15', 'Reykjavík at an easy pace', 'Old Harbour, Hallgrímskirkja, waterfront and a weather-dependent whale boat or museum.', '$120–320', [H.fact('Car', 'Parked most of the day'), H.fact('Sleep', 'Reykjavík · night 2 of 2')], 'The boat is optional; the city works well without it.', [reykjavik]),
  H.day('day4', 'c2', 'DAY 4', 'Wed · Jun 16', 'Golden Circle transfer to the South Coast', 'Check out once, cross Þingvellir, Geysir and Gullfoss, soak at Secret Lagoon, then continue south instead of backtracking to Reykjavík.', '$100–180', [H.fact('Drive', 'Reykjavík → Golden Circle → Hella · about 4 hr wheels turning'), H.fact('Sleep', 'Hella/Hvolsvöllur · night 1 of 4')], 'Start early, pack lunch and arrive at the four-night base after the soak.', [golden, secret], '&#128663; Transfer day &mdash; sleep-base color switches to the South Coast'),
  H.day('day5', 'c2', 'DAY 5', 'Thu · Jun 17', 'Waterfall corridor from one settled base', 'With luggage left in Hella, make Seljalandsfoss and Skógafoss an easy out-and-back nature day.', '$100–170', [H.fact('Drive', 'Hella/Hvolsvöllur → falls → base · about 2 hr wheels turning'), H.fact('Sleep', 'Hella/Hvolsvöllur · night 2 of 4')], 'Sleeping west of Vík keeps the room cost down and tomorrow flexible.', [waterfalls]),
  H.day('day6', 'c2', 'DAY 6', 'Fri · Jun 18', 'Glacier + black coast', 'The trip’s one expensive adventure, paired with Vík and a tightly controlled beach viewpoint.', '$520–650', [H.fact('Holiday', 'Juneteenth observed · no PTO'), H.fact('Sleep', 'Hella/Hvolsvöllur · night 3 of 4')], 'Book an age-8 operator and treat any cancellation as a built-in savings day.', [glacier, blackBeach]),
  H.day('day7', 'c2', 'DAY 7', 'Sat · Jun 19', 'Weather buffer + local recovery', 'A deliberately unscheduled half-day absorbs whatever Iceland moved earlier; use Hella pool or Lava Centre after.', '$70–180', [H.fact('Drive', '0–90 min depending on fallback'), H.fact('Sleep', 'Hella/Hvolsvöllur · night 4 of 4')], 'This buffer is what makes a seven-night Iceland plan feel easy instead of frantic.', []),
  H.day('day8', 'c3', 'DAY 8', 'Sun · Jun 20', 'Reykjanes finale near the airport', 'Move west once, explore only where official conditions are normal, and sleep close to KEF.', '$100–600', [H.fact('Drive', 'Hella → Keflavík · about 2 hr direct'), H.fact('Sleep', 'Keflavík · 1 night')], 'The premium lagoon is optional; the budget version is a free coast loop and local pool.', [reykjanes]),
  H.travelDay('day9', 'DAY 9', 'Mon · Jun 21', 'KEF → PIT nonstop', 'Return the car, fly home, and arrive before the Jun 24–26 Pittsburgh blackout.', '$80–140', [H.fact('Airport', 'Sleep near KEF removes a dawn cross-island drive'), H.fact('Home', 'Mon Jun 21')], 'Keep fuel and airport receipts until the rental closes.'),
];

const preview = H.preview({
  kicker: 'A shorter, easier family trip · 7 hotel nights', h1Main: 'Iceland', h1Sub: 'Big scenery, small radius',
  lead: 'A direct-flight week built around three simple bases, free landscapes, one guided glacier splurge and genuinely warm geothermal swims—not an exhausting Ring Road sprint.',
  stats: [['7', 'hotel nights'], ['3', 'bases'], ['5', 'PTO days'], ['$7.1–9.6k', 'family plan']],
  split: [[25, 'Warm water', 's1'], [25, 'Town + food', 's2'], [50, 'Nature', 's3']],
  images: [[A('gullfoss-aerial.jpg'), 'DAY 4', 'Gullfoss', 'A huge free payoff on the Golden Circle'], [A('seljalandsfoss-rainbow.jpg'), 'DAY 5', 'Seljalandsfoss', 'Walk behind the water curtain'], [A('glacier-walk.jpg'), 'DAY 6', 'Sólheimajökull', 'The one marquee paid adventure'], [A('blue-lagoon.jpg'), 'DAY 8', 'Geothermal finale', 'Optional luxury; warm local pools are the value play']],
});

const overview = `<section id="overview" class="divider">${H.sectionLabel('The Short Version', 'Why this seven-night Iceland works', 'The Golden Circle becomes the transfer to a four-night South Coast base, eliminating the old return to Reykjavík.')}<div class="plan-grid">${H.card('The route', H.prow('Jun 13–21, 2027', '7 hotel nights + outbound overnight') + H.prow('Places to unpack', 'Reykjavík 2 · Hella area 4 · Keflavík 1') + H.prow('Hotel moves', 'Only 2'))}${H.card('Value for the week', H.prow('Current airfare', 'From $709 pp on nearby June 2027 dates') + H.prow('Free big-scenery days', 'Golden Circle · waterfalls · coast') + H.prow('Family trip estimate', '$7,100–9,600 all-in'))}${H.card('What stays out', H.prow('You skip', 'Jökulsárlón · Höfn · full Ring Road') + H.prow('You gain', 'No Golden Circle backtrack · cheaper rooms · a buffer day') + H.prow('Sea swimming', 'No—geothermal water instead'))}</div></section>`;
const why = `<section id="why-this-trip" class="divider">${H.sectionLabel('Why This Trip', 'Iceland without the endurance test', 'Two Reykjavík nights, four nights near Hella and a final airport night deliver the famous sights without a Ring Road marathon.')}<div class="tips-grid">${H.tipcard('Easy from Pittsburgh', 'A rare route advantage', ['A seasonal PIT–KEF nonstop removes the connection.', 'One round trip on a single ticket; one rental car.', 'The airport finale prevents a stressful departure morning.'])}${H.tipcard('Spend where it matters', 'Pay only for the irreplaceable', ['Waterfalls, geysers and viewpoints are mostly free.', 'Apartment breakfasts and picnic lunches control food cost.', 'One glacier walk is the planned splurge.'], ' t2')}${H.tipcard('Warm-water bonus', 'Geothermal counts', ['City pools are warm, family-friendly and inexpensive.', 'Secret Lagoon gives a natural-feeling soak at a manageable price.', 'Blue Lagoon stays optional because it can strain both cost and reliability.'], ' t3')}</div></section>`;
const stays = `<section id="stays" class="divider">${H.sectionLabel('Where to Stay', 'Two real bases plus an airport night', 'Choose kitchen access and real beds before chasing design hotels.')}<div class="plan-grid">${H.card('Reykjavík · 2 nights', H.prow('Target', '$240–330/night') + H.prow('Best zone', 'Downtown edge / Laugardalur with parking') + H.prow('Must have', 'Kitchen · real beds · blackout curtains'))}${H.card('Hella / Hvolsvöllur · 4 nights', H.prow('Target', '$220–300/night') + H.prow('Why here', 'Cheaper than Vík; central to west South Coast') + H.prow('Must have', 'Breakfast or kitchen · parking'))}${H.card('Keflavík · 1 night', H.prow('Target', '$190–260') + H.prow('Why here', 'Easy rental return and flight morning') + H.prow('Must have', 'Early breakfast or kitchenette'))}</div></section>`;

const calendarDays = [
  { date: [6, 13], blocks: [{ act: 'air', start: 18, end: 22, label: 'PIT → KEF' }] },
  { date: [6, 14], blocks: [{ act: 'car', start: 8, end: 10, label: 'KEF → Reykjavík' }, { act: 'town', start: 11, end: 15, label: 'Old town' }, { act: 'water', start: 16, end: 18, label: 'Warm pool' }] },
  { date: [6, 15], blocks: [{ act: 'town', start: 9, end: 15, label: 'Harbour + city' }, { act: 'rest', start: 16, end: 19, label: 'Free evening' }] },
  { date: [6, 16], blocks: [{ act: 'car', start: 8, end: 11, label: 'Golden Circle' }, { act: 'hike', start: 11, end: 15, label: 'Geysers + falls' }, { act: 'water', start: 15, end: 17, label: 'Secret Lagoon' }, { act: 'car', start: 17, end: 19, label: '→ Hella' }] },
  { date: [6, 17], blocks: [{ act: 'car', start: 9, end: 11, label: 'Waterfall corridor' }, { act: 'hike', start: 11, end: 17, label: 'Waterfalls' }] },
  { date: [6, 18], blocks: [{ act: 'hike', start: 9, end: 13, label: 'Glacier' }, { act: 'hike', start: 14, end: 17, label: 'Black coast' }] },
  { date: [6, 19], blocks: [{ act: 'rest', start: 9, end: 15, label: 'Weather buffer' }, { act: 'water', start: 16, end: 18, label: 'Local pool' }] },
  { date: [6, 20], blocks: [{ act: 'car', start: 9, end: 12, label: 'Move west' }, { act: 'hike', start: 13, end: 17, label: 'Reykjanes' }] },
  { date: [6, 21], blocks: [{ act: 'air', start: 8, end: 17, label: 'KEF → PIT' }] },
];

function continuousCalendar(tripDays) {
  const hours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
  const hourRow = (hour) => Math.max(1, Math.min(9, Math.round((hour - 6) / 2) + 1));
  const timeLabel = (hour) => `${hour > 12 ? hour - 12 : hour}${hour < 12 ? 'a' : 'p'}`;
  const headers = tripDays.map(({ date: [month, day] }) => {
    const value = new Date(Date.UTC(2027, month - 1, day));
    const dow = value.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    return `<div class="cc-day"><span>${dow}</span><b>Jun ${day}</b></div>`;
  }).join('');
  const timeLabels = hours.map((hour, index) => `<div class="cc-time" style="grid-row:${index + 1}">${timeLabel(hour)}</div>`).join('');
  const events = tripDays.map((tripDay, dayIndex) => tripDay.blocks.map((block) => {
    const start = hourRow(block.start);
    const end = Math.max(start + 1, Math.min(10, hourRow(block.end) + (block.end % 2 ? 1 : 0)));
    return `<div class="cc-event ${block.act}" style="grid-column:${dayIndex + 2};grid-row:${start}/${end}">${block.label}</div>`;
  }).join('')).join('');
  return `<section id="calendar" class="divider continuous-calendar">
    ${H.sectionLabel('Your Days in Iceland', 'Nine days, from takeoff to homecoming', 'See when the drives, waterfalls, geothermal swims and recovery time happen across the trip. Swipe sideways on a phone to follow the full journey.')}
    <style>
      .continuous-calendar .cc-legend{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 16px;font-size:.76rem;font-weight:750;color:var(--muted)}
      .continuous-calendar .cc-legend span{display:inline-flex;align-items:center;gap:6px}.continuous-calendar .cc-legend i{width:13px;height:13px;border-radius:4px}
      .continuous-calendar .cc-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:8px}
      .continuous-calendar .cc-strip{min-width:960px}
      .continuous-calendar .cc-head,.continuous-calendar .cc-body{display:grid;grid-template-columns:64px repeat(${tripDays.length},minmax(92px,1fr))}
      .continuous-calendar .cc-head{border-bottom:2px solid var(--line)}
      .continuous-calendar .cc-corner{border-right:1px solid var(--line)}
      .continuous-calendar .cc-day{text-align:center;padding:8px 4px;background:rgba(31,111,120,.055);border-right:1px solid var(--line)}
      .continuous-calendar .cc-day span{display:block;font-size:.65rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
      .continuous-calendar .cc-day b{font-size:.88rem;color:var(--ink)}
      .continuous-calendar .cc-body{grid-template-rows:repeat(9,32px);position:relative;background-image:repeating-linear-gradient(to bottom,transparent 0 31px,var(--line) 31px 32px)}
      .continuous-calendar .cc-time{grid-column:1;text-align:right;padding:3px 7px 0 0;font-size:.62rem;font-weight:700;color:var(--muted);border-right:1px solid var(--line)}
      .continuous-calendar .cc-event{margin:2px;border-radius:6px;padding:4px 5px;color:#fff;font-size:.64rem;font-weight:750;line-height:1.12;z-index:2;overflow:hidden;box-shadow:0 1px 3px rgba(30,32,28,.18)}
      .continuous-calendar .cc-event.air{background:#3d4d74}.continuous-calendar .cc-event.car{background:var(--gold);color:#3a2f12}.continuous-calendar .cc-event.hike{background:var(--c3)}.continuous-calendar .cc-event.water{background:var(--c1)}.continuous-calendar .cc-event.town{background:var(--c2)}.continuous-calendar .cc-event.rest{background:#8a857c}
    </style>
    <div class="cc-legend"><span><i style="background:#3d4d74"></i>Air</span><span><i style="background:var(--gold)"></i>Drive</span><span><i style="background:var(--c3)"></i>Nature</span><span><i style="background:var(--c1)"></i>Warm water</span><span><i style="background:var(--c2)"></i>Town</span><span><i style="background:#8a857c"></i>Buffer</span></div>
    <div class="cc-scroll"><div class="cc-strip" data-trip-days="${tripDays.length}"><div class="cc-head" style="grid-template-columns:64px repeat(${tripDays.length},minmax(92px,1fr))"><div class="cc-corner"></div>${headers}</div><div class="cc-body" style="grid-template-columns:64px repeat(${tripDays.length},minmax(92px,1fr))">${timeLabels}${events}</div></div></div>
  </section>`;
}

const calendar = continuousCalendar(calendarDays);

const mapStage = '<div class="mapstage"><button class="layers-btn" aria-expanded="false" aria-label="Map layers"><span class="lbi">▧</span> Layers</button><div class="layers-panel" hidden><div class="layers-top"><strong>Map layers</strong><button class="layers-x" aria-label="Close">×</button></div><div class="layers-acts"><button data-all="1">Select all</button><span class="dot">·</span><button data-all="0">Deselect all</button></div><div class="layers-list"></div></div><div id="tripmap"></div></div>';
const mapAirGround = `<section id="map" class="divider">${H.sectionLabel('The Whole Trip, Mapped', 'Reykjavík, the Golden Circle and the South Coast', 'Follow the route east through Iceland’s biggest sights, then finish near the airport without retracing the whole trip.')}<div class="tripmap-wrap"><div class="mapbtns"><button data-region="reykjavik"><span class="sw" style="background:${mapColors.reykjavik}"></span>Reykjavík</button><button data-region="south"><span class="sw" style="background:${mapColors.south}"></span>South Coast</button><button data-region="reykjanes"><span class="sw" style="background:${mapColors.reykjanes}"></span>Reykjanes</button><button data-region="all">Whole trip</button></div>${mapStage}</div></section><section id="air-travel" class="divider">${H.sectionLabel('Flights from Pittsburgh', 'The nonstop makes a one-week Iceland trip easy', 'Icelandair is showing June 2027 PIT–KEF fares now; confirm the exact flight days, seats and bags before booking the rooms.')}<div class="plan-grid">${H.card('What flights cost now', H.prow('Route', 'PIT ↔ KEF nonstop') + H.prow('June 2027 fares', 'From $709 per person') + H.prow('Family flight budget', '$2,840–3,600 with seat/bag margin'))}${H.card('When to book', H.prow('Good price', 'At or below $3,600 family all-in') + H.prow('Confirm first', 'Jun 13 outbound + Jun 21 return operate nonstop') + H.prow('Backup', 'One-stop itinerary on a single ticket'))}${H.card('Time off work', H.prow('Workdays away', 'Jun 14–17 and Jun 21') + H.prow('Holiday', 'Fri Jun 18 · Juneteenth observed') + H.prow('Total', '5 PTO days'))}</div></section><section id="getting-around" class="divider">${H.sectionLabel('Driving in Iceland', 'One automatic car for the whole week', 'Every road on this route is paved and outside the highlands; weather and wind deserve more attention than navigation.')}<div class="plan-grid">${H.card('Rental car', H.prow('Pickup / return', 'KEF · Jun 14–21') + H.prow('Car budget', '$650–950 including fuel and coverage') + H.prow('Coverage', 'Gravel + sand/ash; inspect exclusions'))}${H.card('How much driving', H.prow('Hotel moves', '2') + H.prow('Longest day', 'Golden Circle transfer · ~4 hr driving') + H.prow('Best route', 'Continue to Hella instead of returning to Reykjavík'))}${H.card('Before each drive', H.prow('Check', 'SafeTravel + road.is each morning') + H.prow('Wind', 'Hold doors; slow down') + H.prow('Bad-weather plan', 'Museums, local pools, buffer day'))}</div></section>`;

const healthTiming = `<section id="health-check" class="divider">${H.sectionLabel('Safety & Comfort', 'Cold landscape, warm pools and a few firm rules', 'This trip works well for both children when the family respects the ocean, wind, glacier and volcanic warnings.')}<div class="hc-grid"><div class="hc good"><span class="hc-tag">Good</span><h4>Warm swimming is easy</h4><p>Municipal pools and Secret Lagoon are heated/geothermal and all-age; the cold Atlantic is never presented as swimming.</p></div><div class="hc watch"><span class="hc-tag">Watch</span><h4>Reynisfjara is viewing-only</h4><p>Obey the live warning lights, stay far from the surf and skip it without hesitation in bad conditions.</p></div><div class="hc watch"><span class="hc-tag">Watch</span><h4>Confirm the glacier tour fits</h4><p>Check the age-8 tour, shoe-size requirement and supplied safety gear; never walk onto ice unguided.</p></div><div class="hc actnow"><span class="hc-tag">Act</span><h4>Volcanic status can change</h4><p>Reykjanes and Blue Lagoon access are never assumed. Recheck official alerts within 48 hours and again that morning.</p></div></div></section><section id="timing" class="divider">${H.sectionLabel('Best Dates', 'Jun 13–21 saves a vacation day', 'Juneteenth falls inside the trip, the family returns before the Pittsburgh commitment, and nonstop fares are already appearing for nearby June dates.')}<div class="timing-compare"><div class="tcard best"><span class="tlabel">Best fit</span><h4>Jun 13–21</h4><div class="trow"><span>Hotel nights</span><b>7</b></div><div class="trow"><span>PTO</span><b>5 days</b></div><div class="trow"><span>Home</span><b>Jun 21</b></div></div><div class="tcard now"><span class="tlabel">Does not work</span><h4>Jun 19–27</h4><div class="trow"><span>Conflict</span><b>Away Jun 24–26</b></div><div class="trow"><span>Decision</span><b>Choose earlier dates</b></div></div></div><div class="verdict-box"><h4>Vacation-day count</h4><p>Depart Sunday Jun 13, return Monday Jun 21. PTO is Mon–Thu Jun 14–17 plus Mon Jun 21; Fri Jun 18 is the observed Juneteenth holiday. The family is home for every required Pittsburgh day, Jun 24–26.</p></div></section>`;

const budgetTips = `<section id="budget" class="divider">${H.sectionLabel('Trip Budget', 'What a week in Iceland should cost', 'Estimated in US dollars for four travelers, with room for seats, bags, weather changes and the trip’s best paid activities.')} ${H.table(['Line item', 'Lower-cost trip', 'More comfortable trip'], [['PIT ↔ KEF airfare incl. seat/bag margin', '$2,840', '$3,600'], ['Lodging · 7 nights', '$1,550', '$2,150'], ['Rental car, coverage, fuel, parking', '$650', '$950'], ['Food + groceries · 9 calendar days', '$1,150', '$1,550'], ['Activities · pools, tower, glacier, optional boat', '$560', '$850'], ['Insurance, eSIM + contingency', '$350', '$500'], ['<b>Grand total</b>', '<b>$7,100</b>', '<b>$9,600</b>']])}<div class="twocol"><div class="listcard save-list"><h4>Easy ways to save</h4><ul><li>Kitchen lodging and a grocery breakfast every day.</li><li>Municipal pools instead of premium lagoons.</li><li>Free nature is the backbone; pay for one glacier experience.</li><li>Stay around Hella/Hvolsvöllur rather than scarce Vík rooms.</li></ul></div><div class="listcard splurge-list"><h4>Worth spending more on</h4><ul><li>The certified glacier walk, if both children qualify.</li><li>One calm-weather whale boat.</li><li>Secret Lagoon as the warm-water signature.</li><li>Blue Lagoon only as a refundable bonus above the base plan.</li></ul></div></section><section id="totals" class="divider">${H.sectionLabel('The Bottom Line', '$7,100–9,600 for the family', 'Even the more comfortable version leaves breathing room below the family’s $12,000 trip target.')} ${H.table(['Category', 'Estimated cost'], [['Flights', '$2,840–3,600'], ['Lodging', '$1,550–2,150'], ['Car + fuel + parking', '$650–950'], ['Food + activities', '$1,710–2,400'], ['Insurance + contingency', '$350–500'], ['<b>Grand total · family of 4</b>', '<b>$7,100–9,600</b>']], 'budget-tbl grand')}<p class="rate-note">Blue Lagoon is not included in the lower-cost trip. The upper activity estimate can cover a whale boat or another modest splurge, but not every premium extra at once.</p></section><section id="tips" class="divider">${H.sectionLabel('Booking Advice', 'Reserve the few things that can sell out', 'Most waterfalls, viewpoints and coastal stops need no advance booking, so keep those days flexible for the weather.')}<div class="tips-order"><ol><li>PIT–KEF nonstop and bags<span> · aim for no more than $3,600 for the family</span></li><li>Three kitchen-capable lodgings<span> · choose refundable rates while flights settle</span></li><li>Automatic rental with clear coverage<span> · KEF to KEF</span></li><li>Age-8 glacier walk<span> · verify shoes and cancellation policy</span></li><li>Secret Lagoon and optional whale boat<span> · reserve times that leave weather flexibility</span></li></ol></div><div class="tips-grid">${H.tipcard('Weather', 'Keep the week flexible', ['Check official conditions each morning.', 'Use the buffer day before sacrificing safety.', 'Waterproof pants are worth the luggage space.'])}${H.tipcard('Food', 'Keep driving days simple', ['Carry picnic food on every driving day.', 'Pizza and burgers exist in all three bases.', 'Never depend on one remote restaurant being open.'], ' t2')}${H.tipcard('Safety', 'Non-negotiable', [{ flag: 'No ocean swimming and no playing at Reynisfjara.' }, 'Guided glacier only.', 'Skip Reykjanes stops under official restrictions.'], ' t3')}</div></section>`;

const socialBalanceStatus = `<section id="social" class="divider">${H.sectionLabel('What to Expect', 'Three reasons this route works', 'The flight, swimming options and eastbound route all make Iceland manageable in a single week.')}<div class="plan-grid">${H.card('A rare nonstop from Pittsburgh', '<p>Icelandair is showing nearby seven-to-eight-day June 2027 fares from $709 per person, avoiding the connection that usually makes a short Europe trip feel longer.</p>')}${H.card('Warm water despite the cold sea', '<p>Reykjavík’s municipal pools are comfortably heated for children, and Secret Lagoon adds a natural-feeling geothermal swim.</p>')}${H.card('Sightseeing without backtracking', '<p>The Golden Circle carries the family from Reykjavík into Hella, leaving four nights in one South Coast room and a full weather-buffer day.</p>')}</div></section><section id="balance" class="divider">${H.sectionLabel('How the Week Feels', 'Big nature days with room to recover', 'Half the trip is dramatic outdoor scenery, balanced by warm swims, Reykjavík time and one deliberately open day.')}<div class="bar"><i style="width:25%;background:#1f6f78"></i><i style="width:25%;background:#c25a3a"></i><i style="width:50%;background:#3f7d4e"></i></div><div class="balance"><div class="bcard k1"><div class="pct">25%</div><h4>Warm water</h4><p>Municipal geothermal pools, Secret Lagoon and an optional premium finale.</p></div><div class="bcard k2"><div class="pct">25%</div><h4>Town + food</h4><p>Reykjavík, Vík meals, Keflavík and low-key recovery time.</p></div><div class="bcard k3"><div class="pct">50%</div><h4>Nature</h4><p>Geysers, waterfalls, glacier ice, black coast and volcanic landscapes.</p></div></div></section><section id="status" class="divider">${H.sectionLabel('Trip Decisions', 'What is chosen and what still needs booking', 'The dates and route are set; flights, family rooms and weather-sensitive activities need fresh prices and availability.')}<div class="status"><div class="scol settled"><h4>Chosen</h4><div class="row"><b>Trip style</b><span>Easy seven-night Iceland escape</span></div><div class="row"><b>Dates</b><span>Jun 13–21, 2027 · 7 hotel nights · 5 PTO days</span></div><div class="row"><b>Route</b><span>Reykjavík 2 → Golden Circle transfer → Hella area 4 → Keflavík 1</span></div><div class="row"><b>Trip budget</b><span>$7,100–9,600 for the family</span></div></div><div class="scol open"><h4>Still to book</h4><div class="row"><b>Flights</b><span>Quote exact seats, bags and nonstop days before lodging becomes nonrefundable.</span></div><div class="row"><b>Lodging</b><span>Confirm kitchens, real beds and parking within each estimate.</span></div><div class="row"><b>Glacier</b><span>Verify the younger child’s operator and shoe eligibility.</span></div><div class="row"><b>Reykjanes</b><span>Recheck volcanic access and air quality close to travel.</span></div></div></div></section>`;

const preDepartureTodos = { labelHtml: H.sectionLabel('Before You Go', 'What to reserve, and when', 'Book the nonstop first, hold family rooms next and keep the weather-sensitive extras flexible.'), blocks: [
  { when: 'Now–Oct 2026', tone: 'hot', title: 'Quote the actual week', items: ['Price <b>PIT–KEF Jun 13–21</b> for all four travelers with selected seats and required bags.', 'Buy only if the exact nonstop pattern works and the family total stays under <b>$3,600</b>.', 'Hold refundable kitchen lodging in Reykjavík, Hella/Hvolsvöllur and Keflavík.'] },
  { when: 'By Jan 2027', title: 'Protect the simple route', items: ['Reserve one automatic rental at KEF with transparent gravel and sand/ash terms.', 'Book the age-8 glacier tour and confirm the shoe-size rule in writing.', 'Check passport validity and the live ETIAS launch status.'] },
  { when: '60–30 days', tone: 'watch', title: 'Add only the timed extras', items: ['Reserve Secret Lagoon.', 'Choose a refundable whale boat only if the family wants it.', 'Treat Blue Lagoon as optional and refundable, never a route dependency.'] },
  { when: 'Final week', tone: 'done', title: 'Operational checks', items: ['Download SafeTravel, road and weather resources plus offline maps.', 'Recheck Reykjanes access, glacier weather and Reynisfjara warning practice.', 'Pack waterproof layers, eye masks, swimsuits, quick-dry towels and picnic gear.'] },
], callout: '<b>Booking order matters:</b> exact nonstop → refundable beds → car → glacier → optional extras.' };

const scorecard = H.assertBaked({ displayName: 'Iceland: Reykjavík + South Coast', blurb: 'Direct, dramatic and deliberately compact', axes: { budget: 5, weather: 2, swim: 3, variety: 4, ease: 4, food: 3, risk: 3, nights: 1, novelty: 5, pto: 5 }, weightDefaults: { budget: 2, weather: 1, swim: 1, variety: 1, ease: 1, food: 1, risk: 1, nights: 1, novelty: 1, pto: 0 }, budget: { floorUsd: 7100, ceilUsd: 9600, targetUsd: 12000,preferredMaxUsd: 15000 }, pto: { days: 5, nights: 7 }, facets: { continent: 'europe', maxConnections: 0, swimTempF: [50, 52], heatedSwimTempF: [82, 110], swimType: 'geothermal', noPassport: false, singleTicket: true, hasSwim: true }, totalBaked: 35 });

const { headBody, navToMain } = H.sliceChrome(T.parts[0].html, 'Short Iceland · Reykjavík + South Coast — June 2027');
const main = { recommended: true, tripCategory: 'short', slug, lang: 'en', title: 'Short Iceland · Reykjavík + South Coast — June 2027', countries: ['iceland'], packingTags: ['rain', 'hiking'], overrides: { packing: ['<b>Cold-rain kit:</b> waterproof shells and pants, warm mid-layers, hats and gloves.', '<b>Warm-water kit:</b> swimsuits and compact towels for pools and lagoons.', '<b>Sleep:</b> blackout masks for bright June nights.', '<b>Driving:</b> offline maps, a PIN-enabled card and a strict wind-door habit.'] }, hasPhotoGuide: false, hasFoodGuide: false, mapPoints, mapColors, itinerary: { className: 'divider', labelHtml: H.sectionLabel('Day by Day', 'Seven nights from Reykjavík to the South Coast', 'Each day includes the drive, weather reality, family food choices and expected activity costs.'), daysClass: 'days', days }, preDepartureTodos, scorecard, parts: [{ t: 'raw', html: `${headBody}${preview}${navToMain}${overview}${why}${stays}${calendar}` }, { t: 'itinerary' }, { t: 'raw', html: mapAirGround }, { t: 'entry' }, { t: 'raw', html: healthTiming }, { t: 'todo' }, { t: 'raw', html: budgetTips }, { t: 'packing' }, { t: 'raw', html: socialBalanceStatus }, ...MapT.parts.slice(11, 14), { t: 'raw', html: H.mapScripts(MapT.parts[14].html, mapPoints, mapColors) }] };

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'main.json'), `${JSON.stringify(main, null, 2)}\n`);
console.log(`wrote src/_data/${slug}/main.json`);
