#!/usr/bin/env node
// Apply a photo plan to a trip's main.json. Deterministic surgery — do NOT hand-edit
// a 150-400KB JSON. You author the plan from the inventory; this executes it safely,
// keeps indent-2 pretty-print, and refuses to write if the result won't parse or a
// referenced local file is missing.
//   node scripts/apply-photos.mjs <slug> <plan.json>
//
// plan.json shape (all files are basenames living in assets/img/<slug>/):
// {
//   "carousels": {
//     "c0": [
//       { "file": "google_kaputas_beach_01.jpg",
//         "alt": "Turquoise cove framed by pine cliffs at Kaputas Beach",
//         "captionTitle": "Kaputas Cove",
//         "credit": "Dan Novac · Google Images source" }
//     ],
//     "c1": [ ... ]
//   },
//   "htmlReplacements": {
//     "https://images.unsplash.com/photo-OLD-hero": "../../assets/img/<slug>/google_hero_01.jpg",
//     "https://upload.wikimedia.org/.../OldBaseCard.jpg": "../../assets/img/<slug>/google_antalya_card_01.jpg"
//   }
// }
//
// Rules encoded here (§6 of the skill):
//  - a carousel's images are REPLACED wholesale by the plan array, in order.
//  - href and src are set to the SAME local path (../../assets/img/<slug>/<file>).
//  - htmlReplacements rewrite raw URLs in parts[0].html (hero pvcar imgs, --hero-url, .bimg).
//    Applied longest-key-first so no old URL is a substring-clobbered by another.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const slug = process.argv[2];
const planPath = process.argv[3];
if (!slug || !planPath) { console.error('usage: node scripts/apply-photos.mjs <slug> <plan.json>'); process.exit(1); }

const jsonPath = `src/_data/${slug}/main.json`;
const doc = JSON.parse(readFileSync(jsonPath, 'utf8'));
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
const localRoot = join('assets', 'img', slug);
const rel = (file) => `../../assets/img/${slug}/${file}`;

const missing = [];
const check = (file) => { if (!existsSync(join(localRoot, file))) missing.push(file); };

// index carousels by id
const spotsById = new Map();
for (const day of doc.itinerary?.days || []) {
  for (const spot of day.spots || []) {
    if ('carouselId' in spot) spotsById.set(spot.carouselId, spot);
  }
}

let carouselsSet = 0, imagesSet = 0;
for (const [cid, imgs] of Object.entries(plan.carousels || {})) {
  const spot = spotsById.get(cid);
  if (!spot) { console.error(`✗ carouselId ${cid} not found in ${slug}`); process.exit(1); }
  spot.images = imgs.map((im) => {
    check(im.file);
    const p = rel(im.file);
    imagesSet++;
    return { href: p, src: p, alt: im.alt, captionTitle: im.captionTitle, credit: im.credit };
  });
  carouselsSet++;
}

// parts[0].html raw-URL replacements (hero + base cards)
let htmlSwaps = 0;
if (plan.htmlReplacements && doc.parts?.[0]?.html) {
  let html = doc.parts[0].html;
  const keys = Object.keys(plan.htmlReplacements).sort((a, b) => b.length - a.length);
  for (const oldUrl of keys) {
    const newUrl = plan.htmlReplacements[oldUrl];
    if (/assets\/img\//.test(newUrl)) check(newUrl.split('/').pop());
    if (html.includes(oldUrl)) { html = html.split(oldUrl).join(newUrl); htmlSwaps++; }
    else console.warn(`  ⚠ htmlReplacement key not found in parts[0].html: ${oldUrl.slice(0, 70)}…`);
  }
  doc.parts[0].html = html;
}

// home-page card header in index.html (scoped to THIS slug's .sl-card so a shared URL
// elsewhere can't be clobbered). Optional: plan.indexCard = { file, alt? }. Checked here,
// written only after the missing-file guard below so a bad plan never half-writes.
if (plan.indexCard?.file) check(plan.indexCard.file);

if (missing.length) {
  console.error(`\n✗ ${missing.length} referenced file(s) not in ${localRoot}/ — self-host them first:`);
  missing.forEach((f) => console.error('   ' + f));
  process.exit(1);
}

let cardSwapped = false;
if (plan.indexCard?.file && existsSync('index.html')) {
  let idx = readFileSync('index.html', 'utf8');
  const cardRe = new RegExp(`(<a class="sl-card" href="locations/${slug}/[^>]*>[\\s\\S]*?class="sl-photo"[\\s\\S]*?<img[^>]+src=")([^"]+)(")`);
  if (!cardRe.test(idx)) { console.error(`✗ index.html .sl-card for ${slug} not found`); process.exit(1); }
  // index.html lives at the repo root, so its card image is ROOT-relative (no ../../).
  idx = idx.replace(cardRe, `$1assets/img/${slug}/${plan.indexCard.file}$3`);
  if (plan.indexCard.alt) {
    idx = idx.replace(
      new RegExp(`(<a class="sl-card" href="locations/${slug}/[^>]*>[\\s\\S]*?class="sl-photo"[\\s\\S]*?<img[^>]+alt=")([^"]*)(")`),
      `$1${plan.indexCard.alt.replace(/\$/g, '$$$$')}$3`);
  }
  writeFileSync('index.html', idx);
  cardSwapped = true;
}

const out = JSON.stringify(doc, null, 2) + '\n';
JSON.parse(out); // sanity — throws before we clobber the file
writeFileSync(jsonPath, out);
console.log(`✓ ${slug}: ${carouselsSet} carousels (${imagesSet} images) set, ${htmlSwaps} html URL(s) swapped${cardSwapped ? ', home card updated' : ''}`);
