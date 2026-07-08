// Injects alltrailsTrail / alltrailsArea fields into matching spots across all
// trip main.json files. Map source: tools/alltrails-map.json
//   [{ spotName, alltrailsTrail, alltrailsArea }]
// Matching is entity-decoded + whitespace-normalized on the spot `name` field.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'src/_data');

const norm = s => (s || '')
  .replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
  .replace(/&#39;|&rsquo;|&apos;/g, "'").replace(/[’]/g, "'")
  .replace(/\s+/g, ' ').trim().toLowerCase();

const map = JSON.parse(readFileSync(resolve(ROOT, 'tools/alltrails-map.json'), 'utf8'));
const byName = new Map();
for (const m of map) {
  if (!m.alltrailsTrail && !m.alltrailsArea) continue;
  byName.set(norm(m.spotName), m);
}

let injected = 0, spotsSeen = 0;
const hits = [];
const slugs = readdirSync(DATA).filter(d => existsSync(resolve(DATA, d, 'main.json')));

for (const slug of slugs) {
  const file = resolve(DATA, slug, 'main.json');
  const d = JSON.parse(readFileSync(file, 'utf8'));
  let changed = false;
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') {
      if (o.name && o.carouselId !== undefined) {
        spotsSeen++;
        const m = byName.get(norm(o.name));
        if (m) {
          if (m.alltrailsTrail) o.alltrailsTrail = m.alltrailsTrail;
          if (m.alltrailsArea) o.alltrailsArea = m.alltrailsArea;
          injected++; changed = true;
          hits.push(`${slug} | ${o.name.replace(/&amp;/g,'&').replace(/&gt;/g,'>')} | trail:${m.alltrailsTrail?'y':'-'} area:${m.alltrailsArea?'y':'-'}`);
        }
      }
      Object.values(o).forEach(walk);
    }
  };
  walk(d);
  if (changed) writeFileSync(file, JSON.stringify(d, null, 2));
}

console.log(hits.sort().join('\n'));
console.log(`\nspots injected: ${injected} (of ${spotsSeen} total spots) | map entries: ${byName.size}`);
const unmatched = [...byName.keys()].filter(k => !hits.some(h => norm(h.split(' | ')[1]) === k));
if (unmatched.length) console.log(`\nMAP ENTRIES THAT MATCHED NO SPOT:\n  ` + unmatched.join('\n  '));
