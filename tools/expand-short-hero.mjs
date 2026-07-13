#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!slug?.startsWith('short-')) throw new Error('Usage: node tools/expand-short-hero.mjs short-<slug>');
const file = path.resolve(import.meta.dirname, '..', 'src', '_data', slug, 'main.json');
const document = JSON.parse(fs.readFileSync(file, 'utf8'));
const candidates = document.itinerary.days.flatMap((day) => (day.spots || []).flatMap((spot) => spot.images || []));
const images = [...new Map(candidates.map((image) => [image.src, image])).values()].slice(0, 10);
if (images.length !== 10) throw new Error(`${slug} has only ${images.length} distinct carousel images`);

const figures = images.map((image, index) => `<figure><img src="${image.src}" alt="${image.alt}"${index ? ' loading="lazy"' : ''}><figcaption><span class="cap-day">Trip highlight</span><strong>${image.captionTitle}</strong><span class="cap-desc">${image.alt}</span></figcaption></figure>`).join('');
const hero = `<div class="carousel pvcar" data-n="10">
    <div class="track">${figures}</div>
    <button class="nav prev" aria-label="Previous">&#8249;</button>
    <button class="nav next" aria-label="Next">&#8250;</button>
    <div class="counter"><span class="cur">1</span> / 10</div>
  </div>
</section>`;
const next = document.parts[0].html.replace(/<div class="carousel pvcar"[\s\S]*?<\/section>/, hero);
if (next === document.parts[0].html) throw new Error(`Hero carousel not found in ${slug}`);
document.parts[0].html = next;
fs.writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
console.log(`expanded ${slug} hero to 10 photos`);
