#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';

const MAX_HUB = 650_000;
const MAX_TRIP = 1_100_000;
const errors = [];
const hub = '_site/index.html';
if (!existsSync(hub)) errors.push(`${hub} is missing; run npm run build first`);
else if (statSync(hub).size > MAX_HUB) errors.push(`${hub} is ${statSync(hub).size} bytes (budget ${MAX_HUB})`);

for (const slug of existsSync('_site/locations') ? readdirSync('_site/locations') : []) {
  const file = join('_site', 'locations', slug, 'index.html');
  if (!existsSync(file)) continue;
  const bytes = statSync(file).size;
  if (bytes > MAX_TRIP) errors.push(`${file} is ${bytes} bytes (budget ${MAX_TRIP})`);
  const html = readFileSync(file, 'utf8');
  if (/(?:\.\.\/\.\.\/|["'(=]\/?)assets\/img\//.test(html)) errors.push(`${file} still deploys an archival image path`);
  if (/assets\/generated\/images\//.test(html) && !/\bsrcset=/.test(html)) errors.push(`${file} has optimized images but no responsive sources`);
  if (load(html)('.carousel picture').length) errors.push(`${file} wraps carousel images in layout-breaking picture elements`);
}

if (errors.length) {
  console.error(`performance audit failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`performance budgets pass (hub <= ${MAX_HUB}, trips <= ${MAX_TRIP}, responsive images only)`);
