// Rewrites each spot's Flickr (.xf) explore link to search the SAME tag as the
// spot's primary (first) Instagram (.xi) link, instead of the full spot name.
// Also collapses any accidental multiple .xf buttons down to a single one.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'src/_data');
const IG = /class="xi"\s+href="https:\/\/www\.instagram\.com\/explore\/tags\/([^/"]+)\//;
const XF = /<a class="xf"[^>]*>.*?<\/a>/g;

let changed = 0; const samples = [];
for (const slug of readdirSync(DATA).filter(d => existsSync(resolve(DATA, d, 'main.json')))) {
  const file = resolve(DATA, slug, 'main.json');
  const d = JSON.parse(readFileSync(file, 'utf8'));
  let dirty = false;
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') {
      if (typeof o.exploreHtml === 'string' && o.exploreHtml.includes('class="xf"')) {
        const m = o.exploreHtml.match(IG);
        if (m) {
          const tag = m[1];
          const flickr = `<a class="xf" href="https://www.flickr.com/search/?tags=${tag}&amp;sort=interestingness-desc" target="_blank" rel="noreferrer">Flickr</a>`;
          let seen = false;
          const next = o.exploreHtml.replace(XF, () => (seen ? '' : (seen = true, flickr)));
          if (next !== o.exploreHtml) {
            o.exploreHtml = next; dirty = true; changed++;
            if (samples.length < 4) samples.push(`${slug} | ${o.name} | tag=${tag}`);
          }
        }
      }
      Object.values(o).forEach(walk);
    }
  };
  walk(d);
  if (dirty) writeFileSync(file, JSON.stringify(d, null, 2));
}
console.log(samples.join('\n'));
console.log(`\nflickr links retagged: ${changed}`);
