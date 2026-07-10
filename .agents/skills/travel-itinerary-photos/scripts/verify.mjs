#!/usr/bin/env node
// The §7 gate. Read-only. Exits non-zero if the upgrade isn't clean.
//   node scripts/verify.mjs <slug>
// Asserts:
//   - 0 wikimedia photo URLs (upload/commons) — map tiles are exempt
//   - 0 unsplash / 0 pexels remote URLs
//   - 0 other remote photo hosts (Flickr, blogs, tourism boards) left un-localized
//   - every structured carousel image src starts with ../../assets/img/<slug>/
//   - every embedded parts[].html photo ref is local AND the file exists on disk
//   - JSON still parses
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const slug = process.argv[2];
if (!slug) { console.error('usage: node scripts/verify.mjs <slug>'); process.exit(1); }
const jsonPath = `src/_data/${slug}/main.json`;
const require = createRequire(import.meta.url);
const raw = readFileSync(jsonPath, 'utf8');
let doc;
try { doc = JSON.parse(raw); } catch (e) { console.error(`✗ JSON parse failed: ${e.message}`); process.exit(1); }

const TILE = /(maps\.wikimedia\.org|tile\.openstreetmap|\.tile\.|basemaps\.|openfreemap|demotiles|tiles\.)/i;
const fails = [];

// 1. remote photo hosts anywhere in the file
const remote = [...raw.matchAll(/https?:\/\/[^"'\\{}\s]+/g)].map(m => m[0]).filter(u => !TILE.test(u));
const wiki = remote.filter(u => /(upload|commons)\.wikimedia\.org/i.test(u));
const unspl = remote.filter(u => /unsplash/i.test(u));
const pex = remote.filter(u => /images\.pexels\.com/i.test(u));
// other remote that look like image refs (in an image field or with an image ext)
const other = remote.filter(u => !wiki.includes(u) && !unspl.includes(u) && !pex.includes(u)
  && /\.(jpe?g|png|webp|avif)(\?|$)/i.test(u));
if (wiki.length) fails.push(`${wiki.length} wikimedia photo URL(s) remain (want 0)`);
if (unspl.length) fails.push(`${unspl.length} unsplash URL(s) remain (want 0)`);
if (pex.length) fails.push(`${pex.length} pexels URL(s) remain (want 0)`);
if (other.length) fails.push(`${other.length} other remote image URL(s) remain (want 0): ${other.slice(0, 3).map(u => u.slice(0, 60)).join(', ')}…`);

// 2. structured carousel srcs must be local + files exist
let imgN = 0, localN = 0;
for (const day of doc.itinerary?.days || []) {
  for (const spot of day.spots || []) {
    for (const im of spot.images || []) {
      imgN++;
      const src = im.src || '';
      if (!src.startsWith(`../../assets/img/${slug}/`)) { fails.push(`carousel ${spot.carouselId} img src not local: ${src.slice(0, 70)}`); continue; }
      localN++;
      const f = join('assets', 'img', slug, src.split('/').pop());
      if (!existsSync(f)) fails.push(`missing file for carousel ${spot.carouselId}: ${f}`);
    }
  }
}

// 3. embedded html local refs must exist on disk
const embedded = [...raw.matchAll(new RegExp(`\\.\\./\\.\\./assets/img/${slug}/[^"'\\\\{}\\s]+`, 'g'))].map(m => m[0]);
for (const ref of [...new Set(embedded)]) {
  const f = join('assets', 'img', slug, ref.split('/').pop());
  if (!existsSync(f)) fails.push(`missing embedded file: ${f}`);
}

// 4. home-page card manifest entry must be local + file exists
let cardState = 'n/a';
try {
  const card = require('../../../../src/_data/card-images.js')[slug];
  if (!card?.path || !card?.alt) {
    fails.push('home-page card manifest entry is missing path or alt text');
    cardState = 'missing';
  } else if (!card.path.startsWith('assets/img/')) {
    fails.push(`home-page card is not a local source asset: ${card.path}`);
    cardState = 'non-local';
  } else if (!existsSync(card.path)) {
    fails.push(`home-page card file missing: ${card.path}`);
    cardState = 'missing file';
  } else cardState = 'local';
} catch {
  fails.push('home-page card manifest could not be loaded');
  cardState = 'unavailable';
}

console.log(`\n🔍 verify ${slug}: ${imgN} carousel images (${localN} local), ${new Set(embedded).size} embedded local refs, home card manifest: ${cardState}`);
if (fails.length) {
  console.error(`✗ ${fails.length} problem(s):`);
  fails.forEach(f => console.error('   ✗ ' + f));
  process.exit(1);
}
console.log('✓ clean: 0 wikimedia / 0 unsplash / 0 pexels / 0 other remote, all local files present, JSON parses\n');
