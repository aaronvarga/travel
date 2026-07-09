#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const slug = process.argv[2];
const planPath = process.argv[3];

if (!slug || !planPath) {
  console.error('usage: node tools/apply-photo-plan-all-spots.mjs <slug> <plan.json>');
  process.exit(1);
}

const jsonPath = `src/_data/${slug}/main.json`;
const localRoot = join('assets', 'img', slug);
const rel = (file) => `../../assets/img/${slug}/${file}`;
const doc = JSON.parse(readFileSync(jsonPath, 'utf8'));
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
const missing = [];

const check = (file) => {
  if (!existsSync(join(localRoot, file))) missing.push(file);
};

for (const imgs of Object.values(plan.carousels || {})) {
  for (const im of imgs) check(im.file);
}
if (plan.indexCard?.file) check(plan.indexCard.file);
if (plan.htmlReplacements) {
  for (const next of Object.values(plan.htmlReplacements)) {
    if (/assets\/img\//.test(next)) check(next.split('/').pop());
  }
}

if (missing.length) {
  console.error(`Missing ${missing.length} file(s) in ${localRoot}:`);
  for (const file of [...new Set(missing)]) console.error(`  ${file}`);
  process.exit(1);
}

let carouselsSet = 0;
let imagesSet = 0;
for (const day of doc.itinerary?.days || []) {
  for (const spot of day.spots || []) {
    if (!spot.carouselId || !plan.carousels?.[spot.carouselId]) continue;
    spot.images = plan.carousels[spot.carouselId].map((im) => {
      const p = rel(im.file);
      imagesSet++;
      return {
        href: p,
        src: p,
        alt: im.alt,
        captionTitle: im.captionTitle,
        credit: im.credit
      };
    });
    carouselsSet++;
  }
}

let htmlSwaps = 0;
if (plan.htmlReplacements && doc.parts?.[0]?.html) {
  let html = doc.parts[0].html;
  for (const oldUrl of Object.keys(plan.htmlReplacements).sort((a, b) => b.length - a.length)) {
    if (html.includes(oldUrl)) {
      html = html.split(oldUrl).join(plan.htmlReplacements[oldUrl]);
      htmlSwaps++;
    }
  }
  doc.parts[0].html = html;
}

let cardSwapped = false;
if (plan.indexCard?.file && existsSync('index.html')) {
  let idx = readFileSync('index.html', 'utf8');
  const cardRe = new RegExp(`(<a class="sl-card" href="locations/${slug}/[^>]*>[\\s\\S]*?class="sl-photo"[\\s\\S]*?<img[^>]+src=")([^"]+)(")`);
  if (cardRe.test(idx)) {
    idx = idx.replace(cardRe, `$1assets/img/${slug}/${plan.indexCard.file}$3`);
    if (plan.indexCard.alt) {
      idx = idx.replace(
        new RegExp(`(<a class="sl-card" href="locations/${slug}/[^>]*>[\\s\\S]*?class="sl-photo"[\\s\\S]*?<img[^>]+alt=")([^"]*)(")`),
        `$1${plan.indexCard.alt.replace(/\$/g, '$$$$')}$3`
      );
    }
    writeFileSync('index.html', idx);
    cardSwapped = true;
  }
}

const out = JSON.stringify(doc, null, 2) + '\n';
JSON.parse(out);
writeFileSync(jsonPath, out);

console.log(`✓ ${slug}: ${carouselsSet} spot carousel(s), ${imagesSet} image(s), ${htmlSwaps} html URL swap(s)${cardSwapped ? ', home card updated' : ''}`);
