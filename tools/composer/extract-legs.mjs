import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const root = path.resolve(import.meta.dirname, '../..');
const draftsDir = path.join(root, 'tmp/composer-drafts');
const definitions = {
  madeira: { sourceTrip: 'madeira-crete', name: 'Madeira', country: 'Portugal', regions: ['madeira'] },
  crete: { sourceTrip: 'madeira-crete', name: 'Crete', country: 'Greece', regions: ['chania', 'rethymno'] },
  sicily: { sourceTrip: 'madeira-sicily', name: 'Sicily', country: 'Italy', regions: ['north-sicily', 'east-sicily'] },
  'lisbon-cascais': { sourceTrip: 'portugal-sicily', name: 'Lisbon + Cascais', country: 'Portugal', regions: ['portugal'] },
};

function stripDay(day) {
  const clean = structuredClone(day);
  for (const key of ['id', 'badge', 'eyebrow', 'colorClass']) delete clean[key];
  clean.facts = (clean.facts ?? []).filter((fact) => !(fact.label === 'PTO' && /Day\s+\d+/i.test(fact.valueHtml ?? '')));
  clean.spots = (clean.spots ?? []).map((spot) => {
    const next = structuredClone(spot);
    delete next.carouselId;
    delete next.spotMapHtml;
    next.images = (next.images ?? []).slice(0, 3);
    return next;
  });
  return clean;
}

function dayRegions(day, pointRegionByName, pointRegionByCoordinate) {
  return [...new Set((day.spots ?? []).map((spot) => pointRegionByName.get(normalizeName(spot.name)) ?? pointRegionByCoordinate.get(`${Number(spot.lat).toFixed(4)},${Number(spot.lng).toFixed(4)}`)).filter(Boolean))];
}

function normalizeName(value) {
  return load(`<span>${value ?? ''}</span>`).text().replace(/\s+/g, ' ').trim();
}

function extractBudgetLines(main) {
  const budgetPart = (main.parts ?? []).find((part) => part.t === 'raw' && /The Money|Budget, savers/i.test(part.html ?? ''));
  if (!budgetPart) return [];
  const $ = load(budgetPart.html);
  return $('tr').map((_, row) => $(row).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean);
}

function contamination(day, config, regions) {
  const text = [day.heading, day.feel, day.note, day.travelNote, ...(day.facts ?? []).map((f) => f.valueHtml)].filter(Boolean).join(' ');
  const flags = [];
  if (regions.length > 1) flags.push(`mixed regions: ${regions.join(', ')}`);
  if (!regions.length && (day.spots ?? []).length) flags.push('spots could not be assigned to a configured region');
  if (/PTO Day|Day \d+ of \d+/i.test(text)) flags.push('trip-scoped PTO prose');
  if (/tomorrow|yesterday|next (?:flight|island|country)|buffer night|fly to|depart|return home/i.test(text)) flags.push('possible cross-leg or boundary prose');
  const ownWords = new Set([idWords(config.name), ...config.regions].flatMap((value) => value.split(/[-+ ]+/)).map((value) => value.toLowerCase()));
  const foreignRegions = [...new Set(mainRegionWords(config.sourceTrip).filter((word) => !ownWords.has(word)))];
  for (const word of foreignRegions) if (new RegExp(`\\b${word}\\b`, 'i').test(text)) flags.push(`mentions ${word}`);
  return flags;
}

function mainRegionWords(sourceTrip) {
  return sourceTrip.split('-');
}

function idWords(name) {
  return name.toLowerCase();
}

function inferRole(day, index, selectedLength) {
  const text = `${day.heading ?? ''} ${day.feel ?? ''}`;
  if (index === 0 || /arriv|soft landing/i.test(text)) return 'arrival';
  if (index === selectedLength - 1 && /depart|flight|transfer|return/i.test(text)) return 'departure';
  if (/flex|weather|choice|retry|open day/i.test(text)) return 'flex';
  return 'full';
}

function extract(id, config) {
  const sourcePath = path.join(root, 'src/_data', config.sourceTrip, 'main.json');
  const main = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const pointRegionByName = new Map((main.mapPoints ?? []).map((point) => [normalizeName(point.n), point.r]));
  const pointRegionByCoordinate = new Map((main.mapPoints ?? []).map((point) => [`${Number(point.lat).toFixed(4)},${Number(point.lng).toFixed(4)}`, point.r]));
  const selected = (main.itinerary?.days ?? []).filter((day) => {
    const regions = dayRegions(day, pointRegionByName, pointRegionByCoordinate);
    return regions.some((region) => config.regions.includes(region));
  });
  const review = [];
  const days = selected.map((day, index) => {
    const regions = dayRegions(day, pointRegionByName, pointRegionByCoordinate);
    for (const reason of contamination(day, config, regions)) review.push({ day: day.heading, reason });
    return { role: inferRole(day, index, selected.length), ...stripDay(day) };
  });
  const mapPoints = (main.mapPoints ?? []).filter((point) => config.regions.includes(point.r));
  const draft = {
    id,
    name: config.name,
    country: config.country,
    sourceTrip: config.sourceTrip,
    mapColor: main.mapColors?.[config.regions[0]],
    mapPoints,
    packingTags: main.packingTags ?? [],
    days,
    _budgetLines: extractBudgetLines(main),
    _review: review,
  };
  fs.mkdirSync(draftsDir, { recursive: true });
  fs.writeFileSync(path.join(draftsDir, `${id}.draft.json`), `${JSON.stringify(draft, null, 2)}\n`);
  console.log(`${id}: ${days.length} days, ${review.length} review flags`);
}

const requested = process.argv[2];
for (const [id, config] of Object.entries(definitions)) {
  if (!requested || requested === id) extract(id, config);
}
if (requested && !definitions[requested]) throw new Error(`Unknown leg: ${requested}`);
