import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const draftsDir = path.join(root, 'tmp/composer-drafts');
const legsDir = path.join(root, 'src/_data/composer/legs');

const metadata = {
  madeira: {
    gateways: { airports: ['FNC'], pitOutbound: { route: 'PIT→EWR→FNC', hours: 12, familyCostUsd: [3200, 4400], notes: 'United seasonal nonstop connection; confirm 2027' }, pitReturn: null },
    nights: { min: 4, canonical: 5, max: 7 },
    june: { seaTempF: 70, airHiF: 75, facts: ['FNC wind disruption can require a Lisbon buffer'] },
    budget: { lodgingPerNightUsd: [163, 263], carPerDayUsd: [56, 90], foodPerDayUsd: [125, 168], activitiesFlatUsd: [300, 550], provenance: 'madeira-crete budget table: Funchal lodging, Madeira car, shared daily food, destination activities' },
    scoreHints: { weather: 4, swim: 3, food: 4, novelty: 5, varietyTags: ['mountains', 'levadas', 'ocean', 'villages'] },
  },
  crete: {
    gateways: { airports: ['CHQ', 'HER'], pitOutbound: null, pitReturn: { route: 'CHQ→ATH→PIT', hours: 14, familyCostUsd: [3000, 4100], notes: 'Prefer protected Athens connection' } },
    nights: { min: 5, canonical: 6, max: 8 },
    june: { seaTempF: 74, airHiF: 82, facts: ['North-coast wind can cancel Balos boats'] },
    budget: { lodgingPerNightUsd: [175, 283], carPerDayUsd: [89, 128], foodPerDayUsd: [125, 168], activitiesFlatUsd: [550, 900], provenance: 'madeira-crete budget table: Chania/Rethymno lodging, Crete car, shared daily food, gorge and beach logistics' },
    scoreHints: { weather: 4, swim: 4, food: 4, novelty: 4, varietyTags: ['beaches', 'gorges', 'old-towns', 'mountains'] },
  },
  sicily: {
    gateways: { airports: ['PMO', 'CTA'], pitOutbound: null, pitReturn: { route: 'CTA→FCO→PIT', hours: 14, familyCostUsd: [3000, 4000], notes: 'Confirm protected transatlantic itinerary' } },
    nights: { min: 5, canonical: 6, max: 8 },
    june: { seaTempF: 74, airHiF: 82, facts: ['Etna access changes with volcanic conditions'] },
    budget: { lodgingPerNightUsd: [196, 275], carPerDayUsd: [77, 109], foodPerDayUsd: [175, 204], activitiesFlatUsd: [300, 650], provenance: 'madeira-sicily budget table: six Sicily nights, Sicily share of two-car range, daily food, Sicily activities' },
    scoreHints: { weather: 4, swim: 4, food: 5, novelty: 4, varietyTags: ['beaches', 'volcanoes', 'old-towns', 'food'] },
  },
  'lisbon-cascais': {
    gateways: { airports: ['LIS'], pitOutbound: { route: 'PIT→EWR→LIS', hours: 11, familyCostUsd: [2600, 3500], notes: 'Multiple one-stop gateway options' }, pitReturn: { route: 'LIS→EWR→PIT', hours: 12, familyCostUsd: [2600, 3500], notes: 'Prefer one protected ticket' } },
    nights: { min: 4, canonical: 5, max: 7 },
    june: { seaTempF: 66, airHiF: 78, facts: ['Atlantic water is cool; coast is primarily scenic'] },
    budget: { lodgingPerNightUsd: [200, 260], carPerDayUsd: [0, 30], foodPerDayUsd: [175, 204], activitiesFlatUsd: [250, 450], provenance: 'portugal-sicily budget table: Portugal share of apartment lodging, transit, daily food, Regaleira and coast activities' },
    scoreHints: { weather: 4, swim: 2, food: 5, novelty: 3, varietyTags: ['coast', 'palaces', 'old-towns', 'food'] },
  },
};

function rewriteDay(legId, day) {
  const next = structuredClone(day);
  if (legId === 'madeira' && /Arrive Funchal/.test(next.heading)) {
    next.note = 'Keep arrival deliberately easy: pick up the car, check in, then use the Monte cable car and toboggan as the jet-lag-proof kid hook. Confirm the operating day, eat early in the Zona Velha, and save the alpine start for a rested morning.';
  }
  if (legId === 'madeira' && /25 Fontes/.test(next.heading)) {
    next.note = next.note.replace("counterpoint to yesterday's ridge", 'lower-exposure counterpoint to the alpine ridge day');
  }
  if (legId === 'madeira' && /Sao Lourenco/.test(next.heading)) {
    next.role = 'departure';
    next.heading = 'São Lourenço cliffs before airport handoff';
    next.feel = 'Last hike + flexible departure';
    next.daycost = 'Est. $60-$160 - permits, fuel, airport meal';
    next.facts = next.facts.filter((fact) => fact.label !== 'Sleep').map((fact) => fact.label === 'Flight' ? { label: 'Airport', valueHtml: 'FNC is about 10 minutes from the trailhead' } : fact);
    next.note = 'The east-end trailhead sits close to FNC, so a short PR8 out-and-back can work before a later flight. Keep this flexible: skip the hike when wind, trail conditions, or the departure time make the airport margin uncomfortable.';
    next.spots = next.spots.filter((spot) => /São|Sao Lourenco/i.test(spot.name));
  }
  if (legId === 'crete' && /Elafonissi/.test(next.heading)) next.note = next.note.replace('yesterday', 'on the prior boat outing');
  if (legId === 'crete' && /Juneteenth/.test(next.heading)) {
    next.heading = 'Imbros Gorge and south-coast swim';
    next.facts = next.facts.filter((fact) => fact.label !== 'Holiday');
    next.note = next.note.replace('tomorrow', 'on a later hiking day');
  }
  if (legId === 'crete' && /Samaria Gorge/.test(next.heading)) {
    next.note = 'Samaria supplies a full mountain-to-sea day when the family wants the leg’s biggest hike. For the 8-year-old, the complete descent is conditional; the shorter route from Agia Roumeli toward the Iron Gates is the kid-friendlier substitute.';
  }
  if (legId === 'lisbon-cascais' && /Arrive Lisbon/.test(next.heading)) {
    next.facts = next.facts.map((fact) => fact.label === 'Water' ? { label: 'Water', valueHtml: 'Scenic Atlantic coast; swimming is optional and cool' } : fact);
  }
  if (legId === 'sicily' && /Lisbon.*Palermo/.test(next.heading)) {
    next.heading = 'Arrive Palermo and settle into Cefalù';
    next.feel = 'Travel + first warm swim';
    next.facts = next.facts.map((fact) => fact.label === 'Flight' ? { label: 'Gateway', valueHtml: 'Arrive PMO, then collect the Sicily car' } : fact);
    next.note = 'Use Palermo as the arrival gateway, collect the rental car, and keep the first Cefalù evening deliberately light. The exact inbound routing belongs to the composed transfer edge, not this leg.';
  }
  if (legId === 'sicily' && /Cefalù beach day/.test(next.heading)) {
    next.note = 'Make this the first full warm-water day: hike La Rocca while it is cool, then leave a long afternoon for the beach and an old-town dinner.';
  }
  for (const spot of next.spots ?? []) {
    if (legId === 'sicily' && spot.climate) spot.climate = spot.climate.replace(/\s*— this is where the trip's warm-water act begins after Madeira's brisk pools\./, '.').replace(/\s*This is the swim finale the Madeira week deliberately saved itself for\./, '');
    if (legId === 'madeira' && spot.climate) spot.climate = spot.climate.replace(/; Crete still carries the warm-water week\./, '.');
  }
  return next;
}

function heroImages(days) {
  const images = [];
  for (const day of days) for (const spot of day.spots ?? []) for (const image of spot.images ?? []) {
    if (!images.some((candidate) => candidate.src === image.src)) images.push(image);
    if (images.length === 3) return images;
  }
  return images;
}

fs.mkdirSync(legsDir, { recursive: true });
for (const [id, extra] of Object.entries(metadata)) {
  const draft = JSON.parse(fs.readFileSync(path.join(draftsDir, `${id}.draft.json`), 'utf8'));
  let days = draft.days;
  if (id === 'crete') days = days.filter((day) => !/Fly Lisbon to Chania/.test(day.heading));
  days = days.map((day) => rewriteDay(id, day));
  const leg = {
    id: draft.id, name: draft.name, country: draft.country, sourceTrip: draft.sourceTrip,
    mapColor: draft.mapColor, mapPoints: draft.mapPoints,
    gateways: extra.gateways, nights: extra.nights, heroImages: heroImages(days),
    packingTags: draft.packingTags, june: extra.june, budget: extra.budget,
    scoreHints: extra.scoreHints, days,
  };
  fs.writeFileSync(path.join(legsDir, `${id}.json`), `${JSON.stringify(leg, null, 2)}\n`);
  console.log(`curated ${id}: ${days.length} days`);
}
