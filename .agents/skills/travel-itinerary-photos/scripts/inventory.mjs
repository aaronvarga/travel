#!/usr/bin/env node
// Photo inventory for a trip. Deterministic, read-only. Run FIRST, before sourcing.
//   node scripts/inventory.mjs <slug> [--json]
//
// Reports what the photo upgrade has to touch and what still needs upgrading:
//  - every carousel (itinerary.days[].spots[].images[]) with id, spot name, image count, hosts
//  - the hero: the .pvcar carousel <img>s in parts[0].html and any --hero-url CSS value
//  - the base cards: <img class="bimg"> in parts[0].html
//  - host tallies: wikimedia photos, unsplash, pexels, other remote, local — the numbers §7 must drive to 0
//
// Map tiles (maps.wikimedia.org / tile.openstreetmap / *.tile.*) are infrastructure, NOT
// photos — they are excluded from every count. Only upload/commons.wikimedia.org are photos.
import { readFileSync } from 'node:fs';

const slug = process.argv[2];
const asJson = process.argv.includes('--json');
if (!slug) { console.error('usage: node scripts/inventory.mjs <slug> [--json]'); process.exit(1); }

const path = `src/_data/${slug}/main.json`;
const raw = readFileSync(path, 'utf8');
const doc = JSON.parse(raw);

const TILE = /(maps\.wikimedia\.org|tile\.openstreetmap|\.tile\.|basemaps\.|openfreemap|demotiles|tiles\.)/i;
const IMG_EXT = /\.(jpe?g|png|webp|avif)(\?|$)/i;
function classify(url) {
  if (!/^https?:\/\//.test(url)) return url.includes('assets/img/') ? 'local' : 'other-local';
  if (TILE.test(url)) return 'tile';
  if (/(upload|commons)\.wikimedia\.org/i.test(url)) return 'wikimedia';
  if (/images\.unsplash\.com|source\.unsplash/i.test(url)) return 'unsplash';
  if (/images\.pexels\.com/i.test(url)) return 'pexels';
  // A bare remote host is only a photo we must localize if it looks like an image file.
  // Restaurant/blog/tourism links (restoHtml, bloglinksHtml hrefs) are NOT photos — bucket
  // them as 'link' so they don't inflate the upgrade count.
  return IMG_EXT.test(url) ? 'other-remote' : 'link';
}

// --- structured carousels ---
const carousels = [];
for (const day of doc.itinerary?.days || []) {
  for (const spot of day.spots || []) {
    if (!('carouselId' in spot)) continue;
    const imgs = spot.images || [];
    carousels.push({
      carouselId: spot.carouselId,
      spot: spot.name?.replace(/<[^>]+>/g, '').trim() || '(unnamed)',
      day: day.heading?.replace(/<[^>]+>/g, '').trim() || day.id,
      count: imgs.length,
      hosts: imgs.map(i => classify(i.src || i.href || '')),
      srcs: imgs.map(i => i.src || i.href || ''),
    });
  }
}

// --- parts[0].html: hero (pvcar) + base cards (bimg) + hero-url ---
const p0 = doc.parts?.[0]?.html || '';
const pvcarImgs = [...p0.matchAll(/class="[^"]*pvcar[^"]*"[\s\S]*?<\/(?:section|div)>/g)]; // approximate block
const heroImgs = [...p0.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)]
  .map(m => m[1]);
const bimg = [...p0.matchAll(/<img[^>]*class="bimg"[^>]*src="([^"]+)"/g)].map(m => m[1]);
const heroUrl = (p0.match(/--hero-url\s*:\s*url\((['"]?)([^)'"]+)\1\)/i) || [])[2] || null;

// --- the home-page card header (index.html .sl-card .sl-photo img for this slug) ---
let card = { src: null, host: null };
try {
  const idx = readFileSync('index.html', 'utf8');
  const m = idx.match(new RegExp(`<a class="sl-card" href="locations/${slug}/[^>]*>[\\s\\S]*?class="sl-photo"[\\s\\S]*?<img[^>]+src="([^"]+)"`));
  if (m) card = { src: m[1], host: classify(m[1]) };
} catch { /* index.html absent — skip */ }

// --- host tally across the WHOLE file (structured + embedded html) ---
const allUrls = [...raw.matchAll(/https?:\/\/[^"'\\{}\s]+/g)].map(m => m[0]);
const localRefs = [...raw.matchAll(/\.\.\/\.\.\/assets\/img\/[^"'\\{}\s]+/g)].map(m => m[0]);
const tally = { wikimedia: 0, unsplash: 0, pexels: 0, 'other-remote': 0, tile: 0, link: 0, local: localRefs.length };
for (const u of allUrls) { const k = classify(u); tally[k] = (tally[k] || 0) + 1; }

const report = {
  slug, path,
  carouselCount: carousels.length,
  carousels,
  hero: { heroUrl, pvcarBlockCount: pvcarImgs.length, embeddedImgSrcs: heroImgs, baseCardSrcs: bimg },
  homeCard: card,
  tally,
  needsUpgrade: tally.wikimedia + tally.unsplash + tally.pexels + tally['other-remote'] > 0
    || (card.host && card.host !== 'local'),
};

if (asJson) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

console.log(`\n📸 ${slug}  (${path})`);
console.log(`   carousels: ${carousels.length}   hero pvcar imgs: ${heroImgs.length}   base cards: ${bimg.length}   --hero-url: ${heroUrl ? classify(heroUrl) : 'none'}`);
console.log(`   home-page card (index.html .sl-card): ${card.src ? card.host + '  ' + card.src.slice(0, 60) : 'not found'}`);
console.log(`   HOST TALLY  wikimedia:${tally.wikimedia}  unsplash:${tally.unsplash}  pexels:${tally.pexels}  other-remote:${tally['other-remote']}  |  local:${tally.local}  tiles(ok):${tally.tile}`);
console.log(`   → ${report.needsUpgrade ? 'NEEDS UPGRADE (remote photos present)' : 'already fully local ✅'}\n`);
for (const c of carousels) {
  const bad = c.hosts.filter(h => h !== 'local' && h !== 'tile').length;
  console.log(`   ${c.carouselId.padEnd(5)} ${String(c.count).padStart(2)} img  ${bad ? `⚠ ${bad} remote` : '✅ local'}  — ${c.spot}`);
}
console.log('');
