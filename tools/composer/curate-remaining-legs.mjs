import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const draftsDir = path.join(root, 'tmp/composer-drafts');
const legsDir = path.join(root, 'src/_data/composer/legs');

const configs = {
  algarve: { airports: ['FAO'], nights: [4, 5, 7], sea: 68, air: 80, budget: [[180, 280], [55, 85], [140, 190], [300, 600]], scores: [5, 3, 4, 3], tags: ['beaches', 'cliffs', 'towns', 'water-parks'] },
  kefalonia: { airports: ['EFL'], nights: [5, 6, 8], sea: 75, air: 82, budget: [[170, 270], [60, 95], [140, 190], [450, 800]], scores: [4, 5, 4, 4], tags: ['beaches', 'caves', 'harbors', 'boats'] },
  lefkada: { airports: ['PVK'], nights: [4, 5, 7], sea: 75, air: 83, budget: [[165, 260], [60, 95], [140, 190], [350, 700]], scores: [4, 5, 4, 5], tags: ['beaches', 'boats', 'villages', 'cliffs'] },
  'athens-cyclades': { airports: ['ATH', 'MLO'], nights: [8, 9, 10], sea: 74, air: 84, budget: [[190, 310], [20, 50], [150, 210], [900, 1500]], scores: [4, 5, 5, 4], tags: ['beaches', 'ancient-sites', 'ferries', 'villages', 'boats'] },
  switzerland: { airports: ['ZRH'], nights: [4, 5, 7], sea: null, air: 72, budget: [[240, 380], [20, 60], [170, 230], [900, 1500]], scores: [4, 2, 4, 5], tags: ['mountains', 'trains', 'lakes', 'villages'] },
  slovenia: { airports: ['LJU'], nights: [7, 9, 11], sea: 72, air: 79, budget: [[170, 260], [55, 85], [140, 190], [500, 900]], scores: [4, 4, 4, 5], tags: ['mountains', 'lakes', 'caves', 'coast', 'old-towns'] },
  mallorca: { airports: ['PMI'], nights: [5, 6, 8], sea: 75, air: 82, budget: [[190, 310], [60, 95], [150, 210], [450, 850]], scores: [4, 5, 4, 3], tags: ['beaches', 'caves', 'mountains', 'old-towns'] },
  malta: { airports: ['MLA'], nights: [3, 4, 6], sea: 75, air: 83, budget: [[180, 290], [0, 25], [145, 200], [400, 750]], scores: [4, 5, 4, 4], tags: ['swimming', 'fortresses', 'boats', 'old-towns'] },
  'venice-dolomites': { airports: ['VCE'], nights: [6, 7, 9], sea: null, air: 72, budget: [[210, 340], [65, 100], [160, 220], [700, 1200]], scores: [4, 2, 5, 4], tags: ['canals', 'mountains', 'lakes', 'villages'] },
  sardinia: { airports: ['OLB', 'CAG', 'AHO'], nights: [6, 7, 9], sea: 75, air: 83, budget: [[180, 290], [65, 100], [150, 205], [550, 1000]], scores: [4, 5, 4, 4], tags: ['beaches', 'boats', 'gorges', 'old-towns'] },
  corsica: { airports: ['FSC', 'AJA'], nights: [3, 4, 6], sea: 74, air: 81, budget: [[190, 310], [70, 110], [155, 210], [350, 700]], scores: [4, 5, 4, 5], tags: ['beaches', 'cliffs', 'ferries', 'old-towns'] },
};

function rewrite(id, day) {
  const next = structuredClone(day);
  if (id === 'kefalonia' && /Argostoli/.test(next.heading)) {
    next.note = 'Use the final Kefalonia day for Argostoli turtles and a Lassi swim; keep the evening flexible around the eventual outbound schedule.';
    next.facts = next.facts.filter((fact) => fact.label !== 'Sleep');
  }
  if (id === 'lefkada' && /Lefkada Town/.test(next.heading)) next.note = 'A relaxed finale: walkable Lefkada Town, the floating causeway, and the flat lagoon loop past the Gyra windmills, with a last waterfront dinner.';
  if (id === 'switzerland' && /Männlichen/.test(next.heading)) next.note = 'A gentler alpine day: the short Männlichen Royal Walk for the three-peak panorama, then glacier-turquoise Lake Brienz and the Iseltwald pier.';
  if (id === 'malta' && /Fly Catania/.test(next.heading)) {
    next.heading = 'Arrive Malta and settle in Valletta or Sliema';
    next.note = 'Skip the rental car: left-side driving and tight parking make a short Malta stay easier with ferries, taxis, and tours.';
    next.facts = next.facts.filter((fact) => !/Sicily|CTA|Ortigia/i.test(fact.valueHtml ?? ''));
  }
  if (id === 'venice-dolomites' && /Cinque Torri/.test(next.heading)) next.note = 'Use the short Cinque Torri loop for a lighter alpine finale: WWI trenches beneath wild towers, then Cortina for a stroll and gelato.';
  if (id === 'sardinia' && /Gulf of Orosei/.test(next.heading)) {
    next.heading = 'Gulf of Orosei boat day';
    next.note = 'Book a smaller boat from Santa Maria Navarrese or Arbatax and confirm which beaches require landing reservations under 2027 rules.';
  }
  if (id === 'corsica' && /Drive Alghero/.test(next.heading)) {
    next.heading = 'Arrive Bonifacio by ferry';
    next.note = 'Cross the Strait of Bonifacio, settle near the old town, and keep the first evening focused on the cliff-top lanes and harbor.';
    next.facts = next.facts.filter((fact) => !/Sardinia|Alghero/i.test(fact.valueHtml ?? ''));
  }
  return next;
}

function heroImages(days) {
  const result = [];
  for (const day of days) for (const spot of day.spots ?? []) for (const image of spot.images ?? []) {
    if (!result.some((item) => item.src === image.src)) result.push(image);
    if (result.length === 3) return result;
  }
  return result;
}

for (const [id, config] of Object.entries(configs)) {
  const draft = JSON.parse(fs.readFileSync(path.join(draftsDir, `${id}.draft.json`), 'utf8'));
  let days = draft.days.filter((day) => !(id === 'switzerland' && /Fly Zurich/.test(day.heading)));
  days = days.map((day) => rewrite(id, day));
  const [lodging, car, food, activities] = config.budget;
  const leg = {
    id, name: draft.name, country: draft.country, sourceTrip: draft.sourceTrip, mapColor: draft.mapColor,
    mapPoints: draft.mapPoints, gateways: {
      airports: config.airports,
      pitOutbound: { route: `PIT→gateway→${config.airports[0]}`, hours: 12, familyCostUsd: [2800, 4200], notes: 'Confirm a protected 2027 itinerary' },
      pitReturn: { route: `${config.airports[0]}→gateway→PIT`, hours: 13, familyCostUsd: [2800, 4200], notes: 'Confirm a protected 2027 itinerary' },
    },
    nights: { min: config.nights[0], canonical: config.nights[1], max: config.nights[2] }, heroImages: heroImages(days), packingTags: draft.packingTags,
    june: { seaTempF: config.sea, airHiF: config.air, facts: ['Reconfirm destination-specific 2027 operating schedules before booking'] },
    budget: { lodgingPerNightUsd: lodging, carPerDayUsd: car, foodPerDayUsd: food, activitiesFlatUsd: activities, provenance: `${draft.sourceTrip} destination-labelled budget rows, allocated to ${id}` },
    scoreHints: { weather: config.scores[0], swim: config.scores[1], food: config.scores[2], novelty: config.scores[3], varietyTags: config.tags }, days,
  };
  fs.writeFileSync(path.join(legsDir, `${id}.json`), `${JSON.stringify(leg, null, 2)}\n`);
  console.log(`curated ${id}: ${days.length} days`);
}

for (const file of fs.readdirSync(legsDir).filter((name) => name.endsWith('.json'))) {
  const legPath = path.join(legsDir, file);
  const leg = JSON.parse(fs.readFileSync(legPath, 'utf8'));
  for (const day of leg.days) {
    day.heading = day.heading.replace(/^Juneteenth:\s*/i, '').replace(/^Juneteenth beach day:\s*/i, '').replace(/Juneteenth transfer/i, 'Transfer');
    day.feel = day.feel.replace(/Juneteenth(?: observed)?:?\s*(?:no-PTO )?/ig, '').replace(/\s*·\s*$/, '');
    day.facts = (day.facts ?? []).filter((fact) => !/Juneteenth|no PTO/i.test(`${fact.label} ${fact.valueHtml}`));
    day.note = day.note.replace(/(?:It falls|On) (?:on )?the Juneteenth(?:-observed| observed)? holiday[^.]*\.\s*/ig, '').replace(/The relaxed coast day, on the Juneteenth observed holiday so it costs no PTO:/i, 'A relaxed coast day:').replace(/Juneteenth is observed today, so this is the free PTO day inside the corrected route\.\s*/i, '');
  }
  fs.writeFileSync(legPath, `${JSON.stringify(leg, null, 2)}\n`);
}
