#!/usr/bin/env node
// Download every remote itinerary image into assets/img/<slug>/ and rewrite the
// trip JSON to reference the local copy. Run per-slug: node tools/localize-images.mjs <slug>
// Idempotent: already-local paths are skipped; re-downloads only missing files.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const slug = process.argv[2];
if (!slug) { console.error('usage: node tools/localize-images.mjs <slug>'); process.exit(1); }

const jsonPath = `src/_data/${slug}/main.json`;
let text = readFileSync(jsonPath, 'utf8');

// Remote image hosts we localize. (openfreemap tiles + gmap embeds are left alone.)
// Photo hosts only. All four are image CDNs (map-tile host maps.wikimedia.org is
// deliberately NOT listed). The char class stops at quotes/braces/spaces/backslashes,
// so tile templates and JS tails can't be captured. No extension filter — Unsplash
// URLs (images.unsplash.com/photo-…?w=1200) carry no file extension.
const HOSTS = /https?:\/\/(images\.unsplash\.com|images\.pexels\.com|upload\.wikimedia\.org|commons\.wikimedia\.org)\/[^"'\\{} ]+/g;
const urls = [...new Set(text.match(HOSTS) || [])];
if (!urls.length) { console.log(`${slug}: no remote images found`); process.exit(0); }

const outDir = join('assets', 'img', slug);
mkdirSync(outDir, { recursive: true });

const extFromType = (ct) => ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp'
  : ct.includes('svg') ? 'svg' : 'jpg';

let downloaded = 0, reused = 0, failed = [];
const map = new Map(); // url -> local relative path (as referenced from the trip page)

for (const url of urls) {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 12);
  // guess ext, corrected after fetch
  let file = `img-${hash}.jpg`;
  let localFs = join(outDir, file);
  // if any ext already present for this hash, reuse it
  const existing = ['jpg', 'png', 'webp', 'svg'].map(e => join(outDir, `img-${hash}.${e}`)).find(existsSync);
  if (existing) {
    reused++;
    map.set(url, `../../${existing.replaceAll('\\', '/')}`);
    continue;
  }
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (localize-images)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type') || 'image/jpeg';
    if (!ct.startsWith('image/')) throw new Error(`not an image (${ct}) — likely a credit/file-page link`);
    const ext = extFromType(ct);
    file = `img-${hash}.${ext}`;
    localFs = join(outDir, file);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error(`too small (${buf.length}b)`);
    writeFileSync(localFs, buf);
    downloaded++;
    map.set(url, `../../${localFs.replaceAll('\\', '/')}`);
    process.stdout.write('.');
  } catch (e) {
    failed.push(`${url} -> ${e.message}`);
    process.stdout.write('x');
  }
}
process.stdout.write('\n');

// Rewrite every occurrence. Longest-first avoids partial-substring clobbering.
for (const url of [...map.keys()].sort((a, b) => b.length - a.length)) {
  text = text.split(url).join(map.get(url));
}
writeFileSync(jsonPath, text);

// sanity: JSON must still parse
JSON.parse(text);

console.log(`${slug}: ${downloaded} downloaded, ${reused} reused, ${failed.length} failed, ${map.size}/${urls.length} localized`);
if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log('  ' + f)); }
