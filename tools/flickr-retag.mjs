// Rewrites every Flickr search link to search the SAME tag as its nearest
// preceding Instagram (/explore/tags/<tag>/) link in the same HTML string —
// covering structured spot .exploreHtml AND raw guide/intro HTML blobs.
// Idempotent: converts flickr ?text=... or ?tags=... to ?tags=<igTag>.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'src/_data');
const IG_TAG = /instagram\.com\/explore\/tags\/([^/"]+)\//g;
// any <a ...href="https://www.flickr.com/search/?text=...|tags=..." ...>Flickr</a>
const FLICKR = /(<a\b[^>]*href=")https:\/\/www\.flickr\.com\/search\/\?[^"]*("[^>]*>\s*Flickr\s*<\/a>)/g;

let retagged = 0, orphan = 0; const samples = [];

function transform(html) {
  // Precompute IG tag positions in this string.
  const igs = [];
  let m;
  IG_TAG.lastIndex = 0;
  while ((m = IG_TAG.exec(html)) !== null) igs.push({ idx: m.index, tag: m[1] });
  if (!igs.length) return html;

  let segStart = 0; // each row ends with its Flickr link; PRIMARY IG = first IG in the row
  return html.replace(FLICKR, (full, pre, post, offset) => {
    // first IG tag in this row's segment (after the previous Flickr, before this one)
    const tag = (igs.find(g => g.idx >= segStart && g.idx < offset) || {}).tag || null;
    segStart = offset + full.length;
    if (!tag) { orphan++; return full; }
    const href = `https://www.flickr.com/search/?tags=${tag}&amp;sort=interestingness-desc`;
    retagged++;
    if (samples.length < 5) samples.push(`tag=${tag}`);
    return pre + href + post;
  });
}

function walk(o) {
  if (Array.isArray(o)) { let d = false; o.forEach(v => { if (walk(v)) d = true; }); return d; }
  if (o && typeof o === 'object') {
    let dirty = false;
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string' && v.includes('flickr.com/search')) {
        const next = transform(v);
        if (next !== v) { o[k] = next; dirty = true; }
      } else if (v && typeof v === 'object') {
        if (walk(v)) dirty = true;
      }
    }
    return dirty;
  }
  return false;
}

for (const slug of readdirSync(DATA).filter(d => existsSync(resolve(DATA, d)))) {
  for (const name of ['main.json', 'photoGuide.json', 'foodGuide.json']) {
    const file = resolve(DATA, slug, name);
    if (!existsSync(file)) continue;
    const d = JSON.parse(readFileSync(file, 'utf8'));
    if (walk(d)) writeFileSync(file, JSON.stringify(d, null, 2));
  }
}
console.log(samples.join('  '));
console.log(`\nflickr links retagged: ${retagged} | orphan (no preceding IG, left as-is): ${orphan}`);
