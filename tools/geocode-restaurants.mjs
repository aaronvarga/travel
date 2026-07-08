/**
 * geocode-restaurants.mjs — resolve restaurant names to coords via Nominatim (OSM).
 * Bounded to a small viewbox around each restaurant's parent spot so a common
 * name resolves to the right town. Results cached to tools/geocache.json so
 * re-runs are free. Misses are recorded (coords:null) and skipped by the map.
 *
 *   node tools/geocode-restaurants.mjs portugal
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const slug = process.argv[2] || 'portugal';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'src', '_data', slug, 'main.json');
const cacheFile = path.join(__dirname, `geocache-${slug}.json`);
const main = JSON.parse(fs.readFileSync(file, 'utf8'));
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};

const coordsFrom = (html) => {
  const m = /q=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(html || '');
  return m ? [+m[1], +m[2]] : null;
};

// gather restaurants with parent-spot coords
const items = [];
(function walk(o) {
  if (o && typeof o === 'object') {
    if (o.restoHtml && o.spotMapHtml) {
      const c = coordsFrom(o.spotMapHtml);
      if (c) {
        [...o.restoHtml.matchAll(/<b>([^<]+)<\/b>/g)].forEach((m) => {
          const raw = m[1].trim();
          const name = raw.replace(/\s*\([^)]*\)\s*$/, '').trim(); // drop trailing "(Estoril)"
          items.push({ name, raw, spot: [c[0], c[1]] });
        });
      }
    }
    for (const k in o) walk(o[k]);
  }
})(main);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'TravelPlanner/1.0 (personal itinerary map; avarga1982@gmail.com)';

async function geocode(name, [lat, lng]) {
  const d = 0.12; // ~13km box
  const viewbox = `${lng - d},${lat + d},${lng + d},${lat - d}`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&bounded=1` +
    `&viewbox=${encodeURIComponent(viewbox)}&q=${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return j[0] ? [+j[0].lat, +j[0].lon] : null;
}

let hit = 0, miss = 0, cached = 0;
for (const it of items) {
  const key = `${it.name}|${it.spot[0].toFixed(3)},${it.spot[1].toFixed(3)}`;
  if (key in cache) { cached++; continue; }
  try {
    const c = await geocode(it.name, it.spot);
    cache[key] = c;
    if (c) hit++; else miss++;
    console.log(`${c ? '✓' : '·'} ${it.name}${c ? '' : '  (no OSM match)'}`);
    await sleep(1100); // Nominatim: <=1 req/sec
  } catch (e) {
    console.warn(`✗ ${it.name}: ${e.message}`);
    cache[key] = null; miss++;
    await sleep(1500);
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 1)); // persist as we go
}
console.log(`\ndone. new hits:${hit} misses:${miss} from-cache:${cached}. total keys:${Object.keys(cache).length}`);
