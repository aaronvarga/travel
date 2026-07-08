/**
 * Resolve itinerary restaurant names to coordinates via Nominatim.
 *
 * Restaurants are geocoded inside a small viewbox around the related day-stop
 * coordinates from `spotMapHtml`, then cached to tools/geocache-<slug>.json.
 * Nominatim is intentionally rate-limited to one request per second.
 *
 * Usage:
 *   node tools/geocode-restaurants.mjs          # all itineraries
 *   node tools/geocode-restaurants.mjs portugal # one itinerary
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataRoot = path.join(root, 'src', '_data');
const UA = 'TravelPlanner/1.0 (personal itinerary map; avarga1982@gmail.com)';

function slugsFromArgs() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('all')) {
    return fs.readdirSync(dataRoot)
      .filter((name) => fs.existsSync(path.join(dataRoot, name, 'main.json')))
      .sort();
  }
  return args;
}

function coordsFrom(html) {
  const match = /q=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(html || '');
  return match ? [+match[1], +match[2]] : null;
}

function cleanName(raw) {
  return decodeHtmlEntities(raw)
    .trim()
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtmlEntities(value) {
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, token) => {
    const lower = token.toLowerCase();
    if (lower === 'amp') return '&';
    if (lower === 'quot') return '"';
    if (lower === 'apos' || lower === '#39') return "'";
    if (lower === 'lt') return '<';
    if (lower === 'gt') return '>';
    if (lower.startsWith('#x')) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith('#')) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return entity;
  });
}

function collectRestaurants(main) {
  const items = [];

  function walk(value) {
    if (!value || typeof value !== 'object') return;

    if (value.restoHtml && value.spotMapHtml) {
      const spot = coordsFrom(value.spotMapHtml);
      if (spot) {
        for (const match of value.restoHtml.matchAll(/<b>([^<]+)<\/b>/g)) {
          const name = cleanName(match[1]);
          if (name) items.push({ name, spot });
        }
      }
    }

    for (const key of Object.keys(value)) walk(value[key]);
  }

  walk(main);
  return items;
}

function cacheKey(item) {
  return `${item.name}|${item.spot[0].toFixed(3)},${item.spot[1].toFixed(3)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocode(name, [lat, lng]) {
  const d = 0.12;
  const viewbox = `${lng - d},${lat + d},${lng + d},${lat - d}`;
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&bounded=1' +
    `&viewbox=${encodeURIComponent(viewbox)}&q=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json[0] ? [+json[0].lat, +json[0].lon] : null;
}

async function processSlug(slug) {
  const file = path.join(dataRoot, slug, 'main.json');
  const cacheFile = path.join(__dirname, `geocache-${slug}.json`);
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);

  const main = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
  const restaurants = collectRestaurants(main);
  const unique = new Map();

  for (const item of restaurants) {
    const key = cacheKey(item);
    if (!unique.has(key)) unique.set(key, item);
  }

  const missing = [...unique.entries()].filter(([key]) => !(key in cache));
  console.log(`\n${slug}: ${unique.size} restaurant location keys, ${missing.length} missing`);

  let hit = 0;
  let miss = 0;
  let error = 0;

  for (const [key, item] of missing) {
    try {
      const coords = await geocode(item.name, item.spot);
      cache[key] = coords;
      if (coords) hit++;
      else miss++;
      console.log(`${coords ? '✓' : '·'} ${item.name}${coords ? '' : ' (no OSM match)'}`);
      await sleep(1100);
    } catch (err) {
      cache[key] = null;
      error++;
      console.warn(`✗ ${item.name}: ${err.message}`);
      await sleep(1500);
    }
    fs.writeFileSync(cacheFile, `${JSON.stringify(cache, null, 2)}\n`);
  }

  if (!fs.existsSync(cacheFile)) {
    fs.writeFileSync(cacheFile, `${JSON.stringify(cache, null, 2)}\n`);
  }

  console.log(`${slug}: new hits ${hit}, misses ${miss}, errors ${error}, cached ${unique.size - missing.length}`);
}

for (const slug of slugsFromArgs()) {
  await processSlug(slug);
}
