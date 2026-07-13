#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as H from '../.agents/skills/travel-itinerary/scripts/itinerary-helpers.mjs';
import { shortCalendar } from './lib/short-calendar.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'src/_data/short-azores');
const source = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/short-madeira/main.json'), 'utf8'));
const A = '../../assets/img/short-azores';

const replacements = [
  ['Madeira Short Escape', 'Portugal: São Miguel'],
  ['Madeira Airport', 'Ponta Delgada Airport'],
  ['Madeira’s', 'São Miguel’s'], ['Madeira\u2019s', 'São Miguel’s'], ['Madeira', 'São Miguel'],
  ['Funchal / São Martinho', 'Ponta Delgada'], ['São Martinho/Lido', 'Ponta Delgada'],
  ['Funchal Old Town and cable car', 'Ponta Delgada old town and harbor'],
  ['Funchal', 'Ponta Delgada'], ['FNC', 'PDL'],
  ['Lido Bathing Complex', 'Poça da Dona Beija'], ['Lido', 'Dona Beija'],
  ['Pico do Areeiro', 'Sete Cidades'], ['Pico do Arieiro', 'Sete Cidades'],
  ['Balcões / Ribeiro Frio', 'Boca do Inferno viewpoint'], ['Balcões', 'Boca do Inferno'], ['Ribeiro Frio', 'Sete Cidades'],
  ['Fanal Forest', 'Furnas geothermal valley'], ['Fanal', 'Furnas'],
  ['Porto Moniz Natural Pools', 'Terra Nostra thermal pool'], ['Porto Moniz', 'Terra Nostra'],
  ['Cabo Girão Skywalk', 'Caldeira Velha'], ['Cabo Girão', 'Caldeira Velha'],
  ['Rabaçal / PR6 Levada das 25 Fontes', 'Lagoa do Fogo and Caldeira Velha'],
  ['PR6 25 Fontes + PR6.1 Risco waterfall', 'Lagoa do Fogo viewpoints + Caldeira Velha soak'],
  ['PR6', 'Lagoa do Fogo'], ['PR6.1', 'Caldeira Velha'], ['Risco Waterfall', 'Salto do Prego waterfall'], ['Risco', 'Salto do Prego'],
  ['Ponta de São Lourenço', 'Mosteiros and Ferraria'],
  ['Machico beach', 'Vila Franca do Campo marina'], ['Machico', 'Vila Franca do Campo'],
  ['$5,700–$8,900', '$6,200–$9,800'], ['$5,700&ndash;$8,900', '$6,200&ndash;$9,800'],
  ['5,700', '6,200'], ['8,900', '9,800'],
  ['$3,000&ndash;$4,400', '$3,200&ndash;$5,000'], ['$875&ndash;$1,575', '$1,050&ndash;$1,750'],
  ['$550&ndash;$950', '$450&ndash;$800'], ['$700&ndash;$1,050', '$750&ndash;$1,150'],
  ['$175&ndash;$325', '$300&ndash;$500'], ['$400&ndash;$600', '$450&ndash;$600'],
  ['PIT&ndash;LIS&ndash;PDL', 'PIT&ndash;BOS&ndash;PDL'], ['PIT–LIS–PDL', 'PIT–BOS–PDL'],
  ['65–75°F', '61–72°F'], ['68–71°F', '64–67°F'],
];

let text = JSON.stringify(source);
for (const [from, to] of replacements.sort((a, b) => b[0].length - a[0].length)) text = text.split(from).join(to);
const doc = JSON.parse(text);

doc.slug = 'short-azores';
doc.tripCategory = 'short';
doc.title = 'Portugal: São Miguel — June 2027';
for (const part of doc.parts) {
  if (part.html?.includes('<title>')) part.html = part.html.replace(/<title>[\s\S]*?<\/title>/, '<title>Portugal: São Miguel &mdash; June 2027</title>');
}
doc.countries = ['portugal'];
doc.packingTags = ['hiking', 'beach', 'rain'];
doc.mapColors = { ponta: '#1f6f78', calderas: '#3f7d4e', thermal: '#c25a3a', coast: '#3a6ea5', transfer: '#7d5ba6' };
doc.mapPoints = [
  H.point('Ponta Delgada Airport (PDL)', 37.7412, -25.6979, 'transfer', 'flight'),
  H.point('Ponta Delgada apartment base', 37.7412, -25.6756, 'ponta', 'hotel'),
  H.point('Ponta Delgada old town and marina', 37.7394, -25.6687, 'ponta', 'town'),
  H.point('Sete Cidades / Vista do Rei', 37.8392, -25.7944, 'calderas', 'view'),
  H.point('Boca do Inferno viewpoint', 37.8356, -25.7598, 'calderas', 'hike'),
  H.point('Furnas geothermal valley', 37.7725, -25.3094, 'thermal', 'town'),
  H.point('Terra Nostra Garden', 37.7722, -25.3147, 'thermal', 'beach'),
  H.point('Poça da Dona Beija', 37.7691, -25.3168, 'thermal', 'beach'),
  H.point('Lagoa do Fogo', 37.7555, -25.4707, 'calderas', 'view'),
  H.point('Caldeira Velha', 37.7819, -25.4996, 'thermal', 'beach'),
  H.point('Gorreana Tea Plantation', 37.8186, -25.4021, 'coast', 'town'),
  H.point('Mosteiros', 37.8909, -25.8217, 'coast', 'beach'),
  H.point('Ribeira dos Caldeirões', 37.8425, -25.4870, 'coast', 'hike'),
  H.point('Nordeste viewpoints', 37.8323, -25.1460, 'coast', 'view'),
];

const labels = {
  city: ['Furnas Forest', 'Atlantic Light', 'Mosteiros Sunset', 'Stone Village', 'Hydrangea Coast', 'Green Headland', 'Volcanic Cliffs', 'Vila Franca Islet', 'Ponta Delgada', 'Harbor City'],
  sete: ['King’s View', 'Crater Water', 'Sete Cidades Volcano', 'Caldera Ridge', 'Hidden Lagoons', 'Volcanic Lakes', 'Lake Village', 'Flowers and Water', 'Caldera Walls', 'Rim Trail'],
  furnas: ['Forest Waterfall', 'Thermal Forest', 'Furnas Lake', 'Iron-Rich Pool', 'Cozido Steam', 'Tea Terraces', 'Pineapple Greenhouse', 'Terra Nostra', 'Thermal Estate', 'Furnas Gates'],
  fogo: ['Fire Lake', 'Crater in Bloom', 'Forest Lagoon', 'Ridge Walk', 'Emerald Caldera', 'Salto do Prego', 'Sunlit Crater', 'Blue-Hour Ridge', 'Lake Overlook', 'Hydrangea Rim'],
  east: ['South-Coast Light', 'Basalt Coast', 'Vila Franca Islet', 'High Ridge', 'Tea Country', 'Hidden Falls', 'Golden Caldera', 'Sunset Mountains', 'Pineapple Fields', 'Hydrangea Lake'],
};
const alts = {
  city: ['A white church framed by giant tree ferns on São Miguel', 'A couple looking across São Miguel’s Atlantic coast at golden hour', 'A traveler watching sunset from black volcanic rocks at Mosteiros', 'A stone Azorean house and garden in warm afternoon light', 'Blue hydrangeas lining green fields above the Atlantic', 'A green volcanic headland glowing above the ocean', 'São Miguel’s basalt cliffs dropping into deep blue water', 'Vila Franca do Campo islet surrounded by open Atlantic', 'Ponta Delgada’s black-and-white church above red roofs', 'Ponta Delgada’s marina and old town seen from above'],
  sete: ['The twin Sete Cidades lakes viewed through a stand of cedars', 'Turquoise crater water and a forested peninsula from above', 'The broad Sete Cidades caldera in clear green light', 'A narrow trail tracing a volcanic caldera ridge', 'Multiple jewel-like lagoons nested inside green crater walls', 'An aerial panorama of São Miguel’s western volcanic lakes', 'Sete Cidades village and lake beneath steep crater walls', 'Red flowers framing blue and green lakes', 'The lake and towering inner wall of the Sete Cidades caldera', 'A footpath leading along the crater rim above layered lakes'],
  furnas: ['A waterfall pouring into a fern-filled forest pool', 'A swimmer in a warm jungle pool near Furnas', 'A chapel reflected beside Furnas Lake', 'A bather soaking in Terra Nostra’s iron-rich thermal pool', 'Cozido being lifted from geothermally heated earth', 'Bright green tea terraces curving across São Miguel', 'Pineapple rows beneath a traditional glass greenhouse', 'Terra Nostra’s ochre thermal pool and garden house', 'Aerial view of a thermal estate beneath old trees', 'Furnas village gates framed by flowers and volcanic hills'],
  fogo: ['Lagoa do Fogo’s turquoise water filling a wild green crater', 'Crater lakes framed by red wildflowers', 'A round emerald lagoon surrounded by dense forest', 'A sunlit trail running along a volcanic ridge', 'Green slopes descending to a luminous crater lake', 'Salto do Prego waterfall glowing between dark basalt walls', 'Golden light spilling across a high volcanic crater', 'A mountain ridge above cloud at blue hour', 'A wide lake overlook from São Miguel’s highlands', 'Hydrangeas framing an emerald lake and folded green hills'],
  east: ['A sunlit São Miguel headland reaching into the Atlantic', 'A dramatic basalt road and cliff above deep blue water', 'Vila Franca islet isolated in clear Atlantic water', 'A narrow trail following São Miguel’s green volcanic spine', 'Sculpted tea terraces glowing in low sun', 'A tall waterfall dropping through a shadowed basalt gorge', 'A volcanic crater catching late golden light', 'Layered mountain ridges beneath a pastel sunset', 'A straight road cutting through geometric pineapple fields', 'Blue hydrangeas framing a volcanic lake panorama'],
};
const photo = (group, i) => ({
  href: `${A}/google_${group}_${String(i + 1).padStart(2, '0')}.jpg`,
  src: `${A}/google_${group}_${String(i + 1).padStart(2, '0')}.jpg`,
  alt: alts[group][i], captionTitle: labels[group][i], credit: 'Azores Getaways · Google Images source',
});
const groups = {
  'sm-funchal': ['sa-city', 'city', 'Ponta Delgada soft landing: old town, marina and pineapple'],
  'sm-peaks': ['sa-sete', 'sete', 'Sete Cidades crater lakes and Boca do Inferno viewpoint'],
  'sm-west': ['sa-furnas', 'furnas', 'Furnas geothermal valley, Terra Nostra and Dona Beija'],
  'sm-pr6': ['sa-fogo', 'fogo', 'Lagoa do Fogo viewpoints and Caldeira Velha soak'],
  'sm-east': ['sa-east', 'east', 'Nordeste, Ribeira dos Caldeirões and Gorreana tea'],
};
const spotDefs = {
  'sm-funchal': { lat: 37.7394, lng: -25.6687, tags: ['pontadelgada', 'saomiguel'], cost: 'Old town, marina and pineapple greenhouses are free or low-cost. Budget €15–25 per adult for a whale-watching harbor option only after checking sea conditions.', climate: '<b>June in Ponta Delgada:</b> mild, often 61–72°F, with quick showers and bright breaks. This is the deliberately car-light arrival day.', save: 'Walk the Portas da Cidade, marina and Mercado da Graça, then cook in the apartment.', splurge: 'Use a calm-sea afternoon for a reputable whale-watching departure from the marina.', restos: ['<b>Forneria São Dinis</b> — pizza and pasta.', '<b>Supléxio</b> — burgers and fries.', '<b>Continente Modelo</b> — apartment and picnic fallback.'], alts: ['Pineapple plantation if rain arrives.', 'Carlos Machado Museum for a wet afternoon.', 'Marina sunset and an early night after the overnight flight.'], blogs: [{ label: 'Visit Azores', href: 'https://www.visitazores.com/en' }] },
  'sm-peaks': { lat: 37.8356, lng: -25.7598, tags: ['setecidades', 'bocadoinferno'], cost: 'Viewpoints and the lakeshore are free. Kayak or bike hire is optional; verify the current family rate and wind conditions.', climate: '<b>Caldera weather:</b> cloud can erase the view even when Ponta Delgada is bright. Start early and swap days rather than waiting in fog.', save: 'Drive Vista do Rei, Boca do Inferno and the village, with a supermarket picnic by the lake.', splurge: 'Book a guided rim walk or lake kayak only on a clear, low-wind day.', restos: ['<b>Green Love</b> — burgers, sandwiches and fries.', '<b>Lagoa Azul</b> — grilled plates with simple sides.', '<b>Packed lunch</b> — best weather-flex tool.'], alts: ['Mosteiros coast if the caldera is clouded in.', 'Ferraria viewpoints without entering the water.', 'Ponta Delgada museum day in persistent rain.'], blogs: [{ label: 'Official Sete Cidades park information', href: 'https://parquesnaturais.azores.gov.pt/en/parques/9/areasprotegidas/122' }] },
  'sm-west': { lat: 37.7722, lng: -25.3147, tags: ['furnas', 'terranostra'], cost: 'Budget for Terra Nostra or Dona Beija, not both by default. Reserve timed thermal entry where required and confirm current child rules.', climate: '<b>Warm water is dependable; air weather is not:</b> thermal pools are roughly 95–104°F while June Atlantic water is much cooler. Bring dark swimwear.', save: 'Choose one managed thermal complex, walk Furnas village and watch the steaming caldeiras.', splurge: 'Add a guided Furnas day with cozido lunch so neither adult drives the long return.', restos: ['<b>A Quinta</b> — pizza, burgers and grilled chicken.', '<b>Caldeiras & Vulcões</b> — cozido plus plain sides.', '<b>Padaria Gloria Moniz</b> — sandwiches and pastries.'], alts: ['Gorreana tea plantation in a shower.', 'Pico do Ferro viewpoint between clouds.', 'Return early for an apartment dinner.'], blogs: [{ label: 'São Miguel Nature Park', href: 'https://parquesnaturais.azores.gov.pt/en/parques/9' }] },
  'sm-pr6': { lat: 37.7555, lng: -25.4707, tags: ['lagoadofogo', 'caldeiravelha'], cost: 'Lagoa do Fogo viewpoints are free; Caldeira Velha uses timed paid entry. Confirm 2027 access controls, road rules and family tickets.', climate: '<b>High crater first:</b> wind and cloud build quickly. Caldeira Velha is the weather-tolerant second half, but heavy rain can still affect access.', save: 'Use short official viewpoints and reserve a standard thermal slot rather than a full guided tour.', splurge: 'Take a small-group Lagoa do Fogo/Caldeira Velha tour if the family wants to avoid mountain driving.', restos: ['<b>Alabote</b> — grilled food and fries in Ribeira Grande.', '<b>TukáTulá</b> — burgers and simple beach plates.', '<b>Packed picnic</b> — protects the clear-weather window.'], alts: ['Ribeira Grande old town if the crater is hidden.', 'Santa Bárbara beach viewpoint without swimming.', 'Furnas thermal day if Caldeira Velha is unavailable.'], blogs: [{ label: 'Official Lagoa do Fogo reserve', href: 'https://parquesnaturais.azores.gov.pt/pt/parques/9/areasprotegidas/105' }] },
  'sm-east': { lat: 37.8425, lng: -25.4870, tags: ['nordeste', 'ribeiradoscaldeiroes', 'gorreana'], cost: 'Ribeira dos Caldeirões park and Gorreana are free; budget only food and fuel unless adding a guided canyon or tea experience.', climate: '<b>The long green loop:</b> the northeast is wetter than Ponta Delgada. Waterfalls look best after rain, but slippery paths require conservative footwear and pace.', save: 'Drive the signed main roads to Gorreana, Ribeira dos Caldeirões and one Nordeste viewpoint, then return before dark.', splurge: 'Use a small-group Nordeste tour so both adults can watch the scenery and nobody manages the longest driving loop.', restos: ['<b>Restaurante Tronqueira</b> — grilled meat, fries and simple sides.', '<b>Gorreana café</b> — sandwiches, cake and tea.', '<b>Apartment dinner</b> — reliable after the long loop.'], alts: ['Ribeira Grande old town if rain becomes heavy.', 'Short Gorreana plantation walk without the full northeast loop.', 'Final Ponta Delgada shopping and thermal re-soak.'], blogs: [{ label: 'Official Azores trails', href: 'https://trails.visitazores.com/en/islands/sao-miguel' }] },
};
for (const day of doc.itinerary.days) for (const spot of day.spots || []) {
  const hit = groups[spot.carouselId];
  if (hit) Object.assign(spot, H.mkSpot({ ...spotDefs[spot.carouselId], name: hit[2], carouselId: hit[0], images: Array.from({ length: 10 }, (_, i) => photo(hit[1], i)) }));
}

const heroGroups = [['sete', 4], ['furnas', 0], ['fogo', 0], ['city', 8], ['east', 1], ['sete', 7], ['furnas', 2], ['fogo', 5], ['city', 2], ['east', 4]];
const heroFigures = heroGroups.map(([g, i], n) => {
  const im = photo(g, i); return `<figure><img src="${im.src}" alt="${im.alt}"${n ? ' loading="lazy"' : ''}><figcaption><span class="cap-day">Trip highlight</span><strong>${im.captionTitle}</strong><span class="cap-desc">${im.alt}</span></figcaption></figure>`;
}).join('');
doc.parts[0].html = doc.parts[0].html.replace(/<div class="carousel pvcar" data-n="\d+">[\s\S]*?<\/div>\s*<\/section>/, `<div class="carousel pvcar" data-n="10"><div class="track">${heroFigures}</div><button class="nav prev" aria-label="Previous">&#8249;</button><button class="nav next" aria-label="Next">&#8250;</button><div class="counter"><span class="cur">1</span> / 10</div></div></section>`);
const preview = H.preview({
  kicker: '7 hotel nights · one São Miguel base', h1Main: 'Portugal:', h1Sub: 'São Miguel',
  lead: 'An easy volcanic-island week from Ponta Delgada: crater lakes, steaming valleys, warm thermal swimming and no hotel changes.',
  stats: [['7', 'hotel nights'], ['5', 'PTO days'], ['$6.2k–$9.8k', 'family planning band'], ['1', 'apartment base']],
  split: [[35, 'Water & thermal', 'water'], [25, 'Town & food', 'town'], [40, 'Nature & views', 'nature']],
  images: heroGroups.map(([g, i]) => { const im = photo(g, i); return [im.src, 'Trip highlight', im.captionTitle, im.alt]; }),
});
doc.parts[0].html = doc.parts[0].html.replace(/<section class="preview">[\s\S]*?<\/section>/, preview);

const overview = `<section id="overview" class="divider">${H.sectionLabel('The Shape of the Week', 'One Ponta Delgada base keeps São Miguel simple', 'Unpack once, use one small rental car, and let the clearest forecast choose between crater lakes, geothermal valleys and the coast.')}<div class="plan-grid">${H.card('Your dates', H.prow('Leave Pittsburgh', 'Fri Jun 11, 2027') + H.prow('Arrive home', 'Sat Jun 19') + H.prow('Hotel nights', '7') + H.prow('Vacation days', '5'))}${H.card('Your home base', H.prow('Neighborhood', 'Ponta Delgada center') + H.prow('Kitchen', 'Required') + H.prow('Hotel changes', 'None') + H.prow('Rental car', 'One for the week'))}${H.card('Why it works', '<p>The airport is close, the city handles easy dinners, and every signature landscape is a day trip. Three thermal complexes make warm swimming realistic even when the Atlantic is cool.</p>')}</div></section>`;
const why = `<section id="why-this-trip" class="divider">${H.sectionLabel('Why This Trip', 'Volcanic drama without a complicated itinerary', 'São Miguel delivers the Azores’ signature scenery without an inter-island flight or ferry.')}<div class="tips-grid">${H.tipcard('Easy shape', 'One base', ['No hotel moves.', 'Short airport transfer.', 'Weather-flex day order.'])}${H.tipcard('Family payoff', 'Warm water + volcanoes', ['Terra Nostra or Dona Beija.', 'Sete Cidades crater lakes.', 'Whale watching only in calm conditions.'])}${H.tipcard('Budget control', 'Choose the splurges', ['Apartment breakfasts.', 'One rental car.', 'One paid thermal complex per day.'])}</div></section>`;
const stays = `<section id="stays" class="divider">${H.sectionLabel('Where We Stay', 'Seven nights in central Ponta Delgada', 'Choose a refundable two-bedroom apartment with real beds, kitchen, laundry and parking—not a remote thermal resort.')}<div class="plan-grid">${H.card('Best zone', H.prow('Target', 'Old town / marina edge') + H.prow('Airport', 'About 10–15 minutes') + H.prow('Walkability', 'Dinner and groceries'))}${H.card('Planning band', H.prow('7 nights', '$1,050–$1,750') + H.prow('Must have', '2 bedrooms + kitchen') + H.prow('Nice to have', 'Parking + laundry'))}${H.card('Why not Furnas?', '<p>Ponta Delgada is better for the airport, whale operators, groceries and flexible drives. Furnas stays a full day trip rather than a second packing event.</p>')}</div></section>`;
const calendar = shortCalendar({eyebrow:'Daily Rhythm',title:'A weather-smart island rhythm',intro:'Crater lakes and geothermal valleys take the clearest mornings; a city day and final flex day absorb fast-changing island weather. Exact flight and thermal times remain open.',ariaLabel:'São Miguel trip calendar June 11 through June 19 2027',days: [
  { date: [6,11], blocks: [{ act:'air', start:16, end:22, label:'PIT → BOS → PDL' }] },
  { date: [6,12], blocks: [{ act:'car', start:8, end:10, label:'Land + apartment' }, { act:'town', start:14, end:18, label:'Ponta Delgada' }] },
  { date: [6,13], blocks: [{ act:'hike', start:8, end:13, label:'Sete Cidades' }, { act:'car', start:14, end:17, label:'Mosteiros coast' }] },
  { date: [6,14], blocks: [{ act:'hike', start:8, end:12, label:'Furnas valley' }, { act:'water', start:13, end:17, label:'Thermal swim' }] },
  { date: [6,15], blocks: [{ act:'rest', start:8, end:12, label:'Slow morning' }, { act:'town', start:14, end:18, label:'City + pineapple' }] },
  { date: [6,16], blocks: [{ act:'hike', start:8, end:12, label:'Lagoa do Fogo' }, { act:'water', start:13, end:17, label:'Caldeira Velha' }] },
  { date: [6,17], blocks: [{ act:'car', start:8, end:10, label:'Northeast drive' }, { act:'hike', start:10, end:15, label:'Falls + tea' }] },
  { date: [6,18], blocks: [{ act:'rest', start:8, end:12, label:'Weather flex' }, { act:'water', start:13, end:17, label:'Whales or re-soak' }] },
  { date: [6,19], blocks: [{ act:'air', start:8, end:20, label:'PDL → BOS → PIT' }] },
] });
doc.parts[0].html = doc.parts[0].html
  .replace(/<section id="overview"[\s\S]*?(?=<section id="why-this-trip")/, overview)
  .replace(/<section id="why-this-trip"[\s\S]*?(?=<section id="stays")/, why)
  .replace(/<section id="stays"[\s\S]*?(?=<section id="calendar")/, stays)
  .replace(/<section id="calendar"[\s\S]*?<\/section>/, calendar);

const dayCopy = [
  ['Leave Pittsburgh', 'Position through Boston only with protected ticketing or a conservative overnight buffer.'],
  ['Land, unpack and walk Ponta Delgada', 'Airport, apartment, groceries and an easy marina evening.'],
  ['Sete Cidades when the caldera is clear', 'Vista do Rei, Boca do Inferno and lakeshore picnic.'],
  ['Furnas geothermal day', 'Steam, gardens and one warm managed thermal swim.'],
  ['Ponta Delgada reset day', 'Late breakfast, pineapple greenhouses and optional calm-sea whales.'],
  ['Lagoa do Fogo + Caldeira Velha', 'High crater views first, warm forest pool second.'],
  ['Nordeste waterfall and tea loop', 'Ribeira dos Caldeirões, Gorreana and one east-coast viewpoint.'],
  ['Final weather-flex day', 'Whales, tea, thermal re-soak or a true rest day.'],
  ['Fly home to Pittsburgh', 'Keep the Boston connection protected or generously buffered.'],
];
doc.itinerary.days.forEach((day, i) => { if (dayCopy[i]) { day.heading = dayCopy[i][0]; day.feel = dayCopy[i][1]; } });

doc.parts[12].html = H.mapScripts(source.parts[12].html, doc.mapPoints, doc.mapColors);
const mapButtons = `<div class="mapbtns"><button data-region="all">Whole trip</button><button data-region="ponta">Ponta Delgada</button><button data-region="calderas">Crater lakes</button><button data-region="thermal">Thermal valleys</button><button data-region="coast">Coast</button><button data-region="transfer">Flights</button></div>`;
const air = `<section id="air-travel" class="divider">${H.sectionLabel('Getting There', 'Boston is the useful gateway—but 2027 is not bookable yet', 'Azores Airlines currently publishes/operates Boston–Ponta Delgada service. Treat that only as a route-pattern proxy until the exact June 2027 dates load.')}<div class="plan-grid">${H.card('Preferred booking', H.prow('Outbound', 'PIT–BOS–PDL') + H.prow('Return', 'PDL–BOS–PIT') + H.prow('Protection', 'One ticket if offered') + H.prow('Fallback', 'Overnight Boston buffer'))}${H.card('Do not force it', '<p>If PIT–BOS and BOS–PDL must be separate tickets, use a conservative Boston overnight in each direction or reject the itinerary. A same-day self-connect is not an “easy trip.”</p>')}${H.card('Current planning status', H.prow('2027 schedule', 'Not published / not verified') + H.prow('Fare band', '$3,200–$5,000 family proxy') + H.prow('Recheck', 'When June 2027 inventory opens'))}</div></section>`;
const ground = `<section id="getting-around" class="divider">${H.sectionLabel('On São Miguel', 'One small automatic, one apartment, four easy loops', 'The airport is close to Ponta Delgada; all signature days return to the same beds.')}<div class="plan-grid">${H.card('Airport and city', H.prow('PDL → apartment', 'About 10–15 min') + H.prow('City day', 'Walk / taxi') + H.prow('Parking', 'Require it at lodging'))}${H.card('Driving loops', H.prow('Sete Cidades + Mosteiros', 'About 2–3 hr driving') + H.prow('Furnas + tea', 'About 2.5–3 hr') + H.prow('Fogo + Caldeira Velha', 'About 1.5–2 hr') + H.prow('Nordeste option', 'About 3–4 hr'))}${H.card('Ease rules', '<p>Use daylight, avoid tiny scenic-road detours in fog, and swap the caldera days to match webcams. No ferry, internal flight or second rental-car contract.</p>')}</div></section>`;
doc.parts[2].html = doc.parts[2].html
  .replace(/<div class="mapbtns">[\s\S]*?<\/div>/, mapButtons)
  .replace(/<section id="air-travel"[\s\S]*?(?=<section id="getting-around")/, air)
  .replace(/<section id="getting-around"[\s\S]*?<\/section>/, ground);

const budgetRows = [
  ['Flights: PIT–BOS–PDL for four', '$3,200–$5,000'],
  ['Seven-night Ponta Delgada apartment', '$1,050–$1,750'],
  ['Automatic car, fuel and parking', '$450–$800'],
  ['Food and groceries', '$750–$1,150'],
  ['Thermal pools, whale option and entries', '$300–$500'],
  ['Insurance and contingency', '$450–$600'],
];
const budget = `<section id="budget" class="divider">${H.sectionLabel('Planning Band', 'A one-base Azores week stays comfortably controlled', 'The band is a current planning proxy, not a June 2027 quote. Airfare is the largest open variable.')} ${H.table(['Line item', 'Family of 4'], budgetRows)}<div class="plan-grid">${H.card('Keep it low', '<p>Apartment breakfasts, picnic lunches, one paid thermal complex per geothermal day and free viewpoints.</p>')}${H.card('Spend where it matters', '<p>Protected air ticketing or safe Boston buffers, a reliable automatic car and one high-quality whale trip in calm conditions.</p>')}</div></section>`;
const totalsRows = budgetRows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('');
const totals = `<section id="totals" class="divider">${H.sectionLabel('Total Cost', '$6,200–$9,800 for four', 'All six categories reconcile directly to the scorecard band.')}<div class="budget-scroll"><table class="budget-tbl grand"><tr><th>Line item</th><th>Family of 4</th></tr>${totalsRows}<tr class="total"><td>Grand Total</td><td>$6,200–$9,800</td></tr></table></div><p class="rate-note">Reprice flights, apartment, automatic car and thermal entries when exact June 2027 inventory opens.</p></section>`;
doc.parts[6].html = doc.parts[6].html
  .replace(/<section id="budget"[\s\S]*?(?=<section id="totals")/, budget)
  .replace(/<section id="totals"[\s\S]*?(?=<section id="tips")/, totals);

const balance = `<section id="balance" class="divider">${H.sectionLabel('Trip Balance', 'Big scenery with planned recovery', 'Two crater days and one geothermal day carry the adventure; Ponta Delgada and the flex day prevent a driving marathon.')}<div class="bar"><i style="width:35%;background:#1f6f78"></i><i style="width:25%;background:#c25a3a"></i><i style="width:40%;background:#3f7d4e"></i></div><div class="balance"><div class="bcard k1"><div class="pct">35%</div><h4>Water & thermal</h4><p>Terra Nostra or Dona Beija, Caldeira Velha and optional calm-sea whales.</p></div><div class="bcard k2"><div class="pct">25%</div><h4>Town & food</h4><p>Ponta Delgada, Furnas, tea, pineapple and easy apartment evenings.</p></div><div class="bcard k3"><div class="pct">40%</div><h4>Calderas & coast</h4><p>Sete Cidades, Lagoa do Fogo, Mosteiros, Ferraria and flexible viewpoints.</p></div></div></section>`;
const status = `<section id="status" class="divider">${H.sectionLabel('Before You Book', 'The week is clear; the air contract is not', 'Keep the shape, but wait for exact June 2027 flights and current thermal reservations.')}<div class="status"><div class="scol settled"><h4>Ready to plan around</h4><div class="row"><b>Length</b><span>Exactly seven hotel nights</span></div><div class="row"><b>Dates</b><span>Jun 11–19, 2027</span></div><div class="row"><b>Base</b><span>Central Ponta Delgada</span></div><div class="row"><b>Planning band</b><span>$6.2k–$9.8k for four</span></div></div><div class="scol open"><h4>Recheck before paying</h4><div class="row"><b>Flights</b><span>Protected PIT–BOS–PDL or safe Boston overnight buffers</span></div><div class="row"><b>Apartment</b><span>Two bedrooms, kitchen, parking and refundable terms</span></div><div class="row"><b>Thermal pools</b><span>2027 prices, child rules and reservation windows</span></div><div class="row"><b>Whales</b><span>Operator, sea forecast and flexible cancellation</span></div></div></div></section>`;
doc.parts[8].html = doc.parts[8].html
  .replace(/<section id="balance"[\s\S]*?(?=<section id="status")/, balance)
  .replace(/<section id="status"[\s\S]*?<\/section>/, status);

doc.scorecard = {
  displayName: 'Portugal: São Miguel', blurb: 'One volcanic island, one easy base, thermal swimming',
  axes: { budget: 5, weather: 3, swim: 4, variety: 4, ease: 4, food: 4, risk: 3, nights: 1, novelty: 5, pto: 5 },
  weightDefaults: { budget: 2, weather: 1, swim: 1, variety: 1, ease: 1, food: 1, risk: 1, nights: 1, novelty: 1, pto: 0 },
  budget: { floorUsd: 6200, ceilUsd: 9800, targetUsd: 12000, preferredMaxUsd: 15000 },
  pto: { days: 5, nights: 7 },
  facets: { continent: 'europe', maxConnections: 1, swimTempF: [64, 67], heatedSwimTempF: [95, 104], swimType: 'geothermal', noPassport: false, singleTicket: false, hasSwim: true },
  totalBaked: 38,
};

const evidence = {
  schemaVersion: 1, slug: 'short-azores', reviewedAt: '2026-07-13', overallConfidence: 'medium',
  axes: {
    budget: { score: 5, rationale: 'The $6,200–$9,800 planning band stays below the family targets, but exact June 2027 air and lodging quotes are not yet loaded.', confidence: 'medium', evidence: ['budget-band'] },
    weather: { score: 3, rationale: 'June is mild, but fast cloud, wind and rain changes make daily order flexibility essential.', confidence: 'medium', evidence: ['climate-proxy'] },
    swim: { score: 4, rationale: 'Warm managed thermal pools are a core experience; June Atlantic water remains cool and ocean entries are optional.', confidence: 'high', evidence: ['swim-conditions'] },
    variety: { score: 4, rationale: 'Crater lakes, thermal gardens, waterfalls, tea, coast, town and optional whale watching fit one island.', confidence: 'high', evidence: ['itinerary-structure'] },
    ease: { score: 4, rationale: 'One apartment and one rental car avoid base moves; the BOS positioning/PDL ticket structure prevents a perfect score.', confidence: 'high', evidence: ['operational-load'] },
    food: { score: 4, rationale: 'Ponta Delgada apartment cooking plus pizza, burgers, grilled chicken and bakery fallbacks cover picky eaters.', confidence: 'medium', evidence: ['food-coverage'] },
    risk: { score: 3, rationale: 'Weather and separate-ticket exposure are material; a protected through-ticket or long BOS buffer is mandatory.', confidence: 'medium', evidence: ['route-readiness'] },
    nights: { score: 1, rationale: 'Exactly seven hotel nights intentionally earns the short-trip 1/5 length score.', confidence: 'high', evidence: ['trip-window'] },
    novelty: { score: 5, rationale: 'São Miguel is new to the family’s recorded travel history.', confidence: 'high', evidence: ['visited-overlap'] },
    pto: { score: 5, rationale: 'Friday-to-Saturday timing around observed Juneteenth requires five vacation days.', confidence: 'high', evidence: ['trip-window'] },
  },
  facts: [
    { id: 'budget-band', category: 'budget', proxyStatus: 'current-proxy', confidence: 'medium', sourceRefs: ['internal-itinerary'], value: { lowUsd: 6200, highUsd: 9800, targetUsd: 12000, preferredMaxUsd: 15000, distribution: 'planning-band', lineItemCount: 6, arithmetic: '3200/5000 + 1050/1750 + 450/800 + 750/1150 + 300/500 + 450/600 = 6200/9800' }, verifiedAt: '2026-07-13', expiresAt: '2026-10-31', sourceLocators: { 'internal-itinerary': 'short-azores/main.json #budget and #totals planning band' }, claimType: 'proxy' },
    { id: 'trip-window', category: 'dates', proxyStatus: 'confirmed', confidence: 'high', sourceRefs: ['decision-profile'], value: { depart: '2027-06-11', return: '2027-06-19', hotelNights: 7, ptoDays: 5, holiday: 'Juneteenth observed Friday 2027-06-18' }, verifiedAt: '2026-07-13', expiresAt: null, sourceLocators: { 'decision-profile': 'Required decisionProfile addition: tripWindows.short-azores' }, claimType: 'confirmed' },
    { id: 'climate-proxy', category: 'climate', proxyStatus: 'current-proxy', confidence: 'medium', sourceRefs: ['azores-climate-official'], value: { juneAirF: [61, 72], forecast: false, rapidChanges: true }, verifiedAt: '2026-07-13', expiresAt: '2027-04-01', sourceLocators: { 'azores-climate-official': 'IPMA/Azores historical Ponta Delgada June climate normal; add to shared evidenceSources' }, claimType: 'proxy' },
    { id: 'swim-conditions', category: 'swim', proxyStatus: 'current-proxy', confidence: 'high', sourceRefs: ['noaa-oisst', 'azores-parks-official'], value: { score: 4, temperatureF: [64, 67], thermalPools: ['Terra Nostra', 'Poça da Dona Beija', 'Caldeira Velha'], heatedTemperatureF: [95, 104], swimType: 'geothermal', hasSwim: true }, verifiedAt: '2026-07-13', expiresAt: '2027-04-01', sourceLocators: { 'noaa-oisst': 'Historical June coastal SST planning range around São Miguel; not a 2027 forecast', 'azores-parks-official': 'Official São Miguel Nature Park and operator pool pages; opening and reservations require recheck' }, claimType: 'proxy' },
    { id: 'itinerary-structure', category: 'itinerary', proxyStatus: 'derived', confidence: 'high', sourceRefs: ['internal-itinerary'], value: { hotelNights: 7, baseNames: ['Ponta Delgada'], nightSplit: [7], scheduledModes: ['city', 'crater lakes', 'thermal pools', 'waterfalls', 'tea plantation', 'coast', 'optional whale watching'] }, verifiedAt: '2026-07-13', expiresAt: null, sourceLocators: { 'internal-itinerary': 'short-azores/main.json itinerary and calendar' }, claimType: 'derived' },
    { id: 'operational-load', category: 'logistics', proxyStatus: 'derived', confidence: 'high', sourceRefs: ['internal-itinerary'], value: { easeScore: 4, baseMoves: 0, rentalCars: 1, internalFlights: 0, lodgingSleeps: 1, maxConnections: 1, singleTicket: false }, verifiedAt: '2026-07-13', expiresAt: '2027-02-01', sourceLocators: { 'internal-itinerary': 'One Ponta Delgada base and one rental car' }, claimType: 'derived' },
    { id: 'food-coverage', category: 'food', proxyStatus: 'current-proxy', confidence: 'medium', sourceRefs: ['internal-itinerary'], value: { score: 4, fallbackTypes: ['pizza', 'burgers', 'grilled chicken', 'fries', 'apartment kitchen', 'packed lunch'] }, verifiedAt: '2026-07-13', expiresAt: '2027-04-01', sourceLocators: { 'internal-itinerary': 'Restaurants and apartment fallbacks in main.json' }, claimType: 'proxy' },
    { id: 'route-readiness', category: 'route', proxyStatus: 'exact-2027-schedule-required', confidence: 'medium', sourceRefs: ['azores-airlines-bos-pdl', 'internal-itinerary'], value: { status: 'exact-2027-schedule-required', routeRule: 'Prefer a protected PIT–BOS–PDL itinerary; if tickets are separate, overnight in Boston each direction or reject', june2027Verified: false, currentPattern: 'Azores Airlines currently advertises daily June Boston–Ponta Delgada service', maxConnections: 1, singleTicket: false }, verifiedAt: '2026-07-13', expiresAt: '2026-10-31', sourceLocators: { 'azores-airlines-bos-pdl': 'Official Azores Airlines Flights to Azores page, Boston <> Ponta Delgada: June through September all days; exact June 2027 inventory not yet confirmed', 'internal-itinerary': 'main.json air-travel rules' }, claimType: 'proxy' },
    { id: 'visited-overlap', category: 'novelty', proxyStatus: 'derived', confidence: 'high', sourceRefs: ['decision-profile', 'scorecard-contract'], value: { score: 5, overlap: [] }, verifiedAt: '2026-07-13', expiresAt: null, sourceLocators: { 'decision-profile': 'Family visited-place history; São Miguel/Azores absent', 'scorecard-contract': 'tools/scorecard.manifest.json visitedPlaces list and novelty rubric; São Miguel/Azores absent' }, claimType: 'derived' },
  ],
  metrics: { airHours: 11, groundHours: 13, timeZones: 1, baseMoves: 0, longestTransferHours: 8, highOutputDayStreak: 2, fallbackDays: 3, childActivityFit: { age13: 'fits', age8: 'fits' }, lodgingComfort: { kitchen: 'required', laundry: 'preferred', realBeds: 'required' }, waterSafety: 'Use staffed thermal pools; ocean swimming only with safe flags and conditions.', crowdingPressure: 'Reserve thermal pools and whale trips; reach crater viewpoints early.', medicalAccess: 'Ponta Delgada is the strongest medical base; remote calderas require conservative plans.' },
  evidenceBasis: 'Current official/operator route, park, trail and thermal information plus derived one-base structure.',
  confidenceBasis: ['dates and one-base structure are high confidence', 'exact 2027 flights and prices remain open', 'June climate is a historical planning proxy'],
};

const variants = { schemaVersion: 1, slug: 'short-azores', canonicalId: 'canonical', variants: [{ id: 'canonical', eyebrow: 'The trip as planned', label: '7 nights on São Miguel', canonical: true, status: 'documented', nights: 7, ptoDays: 5, budget: { lowUsd: 6200, expectedUsd: null, highUsd: 9800, distribution: 'planning-band', chanceUnderPreferredMax: null }, removedExperiences: [], notes: 'Seven nights in one Ponta Delgada base preserve two thermal days, two crater-weather opportunities and a coast/whale flex day.', confidence: 'medium', claimType: 'derived', sourceRefs: ['internal-itinerary'], sourceLocators: { 'internal-itinerary': 'short-azores/main.json canonical dates, nights and totals' } }], alternateStatus: 'not-needed', alternateNotes: 'Shortening the week removes the weather-flex day that makes the Azores practical.' };

const sourcePages = {
  city: 'https://azoresgetaways.com/en-us/vacation-packages/sao-miguel-highlights',
  sete: 'https://azoresgetaways.com/en-us/vacations/destination/europe/azores/general-articles/setecidades',
  furnas: 'https://azoresgetaways.com/en-us/vacation-packages/sao-miguel-furnas',
  fogo: 'https://azoresgetaways.com/en-us/vacation-packages/pdl-summer-flash-sale',
  east: 'https://azoresgetaways.com/en-us/vacation-packages/sao-miguel-car',
};
const photoPlan = {
  visualBrief: 'A green-volcano family escape: crater-lake scale, warm geothermal water, hydrangeas and black-basalt Atlantic edges.',
  contactSheets: {
    candidateSheets: ['/tmp/pics/short-azores/candidate-sheet-0.png', '/tmp/pics/short-azores/candidate-sheet-1.png', '/tmp/pics/short-azores/candidate-sheet-2.png'],
    finalistSheet: '/tmp/pics/short-azores/finalists-sheet-2.png',
    reviewedAt: '2026-07-13', review: 'All 50 selected files are true-horizontal, watermark-free and visually reviewed; within-carousel near-duplicates were replaced after the finalist pass.'
  },
  hero: heroGroups.map(([group, i]) => ({
    file: `google_${group}_${String(i + 1).padStart(2, '0')}.jpg`, alt: alts[group][i], captionTitle: labels[group][i],
    credit: 'Azores Getaways · Google Images source', sourcePage: sourcePages[group], discoveredVia: 'Google Images',
  })),
  carousels: {}
};
for (const [oldId, [newId, group]] of Object.entries(groups)) {
  void oldId;
  photoPlan.carousels[newId] = Array.from({ length: 10 }, (_, i) => ({
    file: `google_${group}_${String(i + 1).padStart(2, '0')}.jpg`,
    alt: alts[group][i], captionTitle: labels[group][i],
    credit: 'Azores Getaways · Google Images source', sourcePage: sourcePages[group], discoveredVia: 'Google Images',
  }));
}

fs.mkdirSync(outDir, { recursive: true });
const cleanup = [
  ['Lisbon or another European hub', 'Boston'], ['European hub', 'Boston'],
  ['mountain and levada', 'caldera and thermal'], ['Peaks, levadas and volcanic coast', 'Crater lakes, geothermal valleys and volcanic coast'],
  ['Rabaçal drive', 'Lagoa do Fogo drive'], ['Rabaçal', 'Lagoa do Fogo'], ['levada', 'caldera trail'], ['Levada', 'Caldera trail'],
  ['25 Fontes', 'Lagoa do Fogo'], ['near the Dona Beija', 'in central Ponta Delgada'], ['Dona Beija promenade', 'marina promenade'],
  ['$5.7k–$8.9k', '$6.2k–$9.8k'], ['Pico, Boca do Inferno, Furnas, Lagoa do Fogo, Salto do Prego and Ponta', 'Sete Cidades, Furnas, Lagoa do Fogo, Mosteiros and Ferraria'],
  ['visitmadeira.com', 'trails.visitazores.com'], ['simplifica.madeira.gov.pt/services/78-82-259', 'parquesnaturais.azores.gov.pt/en/parques/9'],
];
let finalText = JSON.stringify(doc);
for (const [from, to] of cleanup) finalText = finalText.split(from).join(to);
const finalDoc = JSON.parse(finalText);
for (const part of finalDoc.parts) {
  if (part.html?.includes('<footer>')) part.html = part.html.replace(/<footer>[\s\S]*?<\/footer>/, '<footer><p>Portugal: São Miguel family itinerary for June 2027. Exact flights, rooms, tours and prices require fresh verification before booking. Maps via Google &amp; OpenStreetMap.</p></footer>');
}
fs.writeFileSync(path.join(outDir, 'main.json'), JSON.stringify(finalDoc, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'variants.json'), JSON.stringify(variants, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'assets/img/short-azores/_photo-plan.json'), JSON.stringify(photoPlan, null, 2) + '\n');
console.log('wrote short-azores main/evidence/variants');
