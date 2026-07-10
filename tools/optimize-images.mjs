#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const DATA = join(ROOT, 'src', '_data');
const OUT = join(ROOT, 'assets', 'generated', 'images');
const MANIFEST = join(ROOT, 'assets', 'generated', 'image-manifest.json');
const WIDTHS = [640, 1280];
const MAX_BYTES = 700_000;
const checkOnly = process.argv.includes('--check');

function walk(value, found) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/(?<![/:])(?:\.\.\/\.\.\/)?(assets\/img\/[^?#"'()\s]+)/g)) found.add(match[1]);
  } else if (Array.isArray(value)) value.forEach((item) => walk(item, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => walk(item, found));
}

const sources = new Set();
for (const slug of readdirSync(DATA)) {
  const folder = join(DATA, slug);
  if (!statSync(folder).isDirectory()) continue;
  for (const name of readdirSync(folder).filter((name) => name.endsWith('.json'))) {
    walk(JSON.parse(readFileSync(join(folder, name), 'utf8')), sources);
  }
}
walk(readFileSync(join(ROOT, 'src', 'index.njk'), 'utf8'), sources);
walk(readFileSync(join(DATA, 'card-images.js'), 'utf8'), sources);

const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { images: {} };
const images = {};

async function optimize(source) {
  const absolute = join(ROOT, source);
  if (!existsSync(absolute)) throw new Error(`${source}: source file is missing`);
  const digest = createHash('sha256').update(readFileSync(absolute)).digest('hex').slice(0, 16);
  const prior = previous.images?.[source];
  if (prior?.sourceHash === digest && Object.values(prior.variants || {}).flat().every((item) => existsSync(join(ROOT, item.url)))) {
    images[source] = prior;
    return prior;
  }

  const metadata = await sharp(absolute, { failOn: 'error' }).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`${source}: dimensions unavailable`);
  const widths = [...new Set(WIDTHS.map((width) => Math.min(width, metadata.width)))];
  const stem = basename(source, extname(source)).replace(/[^a-zA-Z0-9_-]+/g, '-');
  const folder = join(OUT, source.split('/')[2]);
  mkdirSync(folder, { recursive: true });
  const variants = { avif: [], webp: [], jpeg: [] };

  for (const width of widths) {
    const height = Math.round(metadata.height * width / metadata.width);
    for (const format of Object.keys(variants)) {
      const extension = format === 'jpeg' ? 'jpg' : format;
      const output = join(folder, `${stem}-${digest}-${width}.${extension}`);
      let pipeline = sharp(absolute, { failOn: 'error' }).rotate().resize({ width, withoutEnlargement: true });
      if (format === 'avif') pipeline = pipeline.avif({ quality: 50, effort: 4 });
      if (format === 'webp') pipeline = pipeline.webp({ quality: 74, effort: 4 });
      if (format === 'jpeg') pipeline = pipeline.flatten({ background: '#f7f4ee' }).jpeg({ quality: 78, mozjpeg: true });
      await pipeline.toFile(output);
      variants[format].push({ width, height, url: relative(ROOT, output).replaceAll('\\', '/'), bytes: statSync(output).size });
    }
  }
  return { sourceHash: digest, width: metadata.width, height: metadata.height, variants };
}

async function pool(items, limit, worker) {
  let cursor = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      images[item] = await worker(item);
      if (cursor % 50 === 0) process.stdout.write(`optimized ${Math.min(cursor, items.length)}/${items.length}\n`);
    }
  }));
}

function validate(manifest) {
  const errors = [];
  for (const source of sources) {
    const entry = manifest.images?.[source];
    if (!entry) { errors.push(`${source}: missing manifest entry`); continue; }
    for (const format of ['avif', 'webp', 'jpeg']) {
      if (!entry.variants?.[format]?.length) errors.push(`${source}: missing ${format} derivative`);
      for (const variant of entry.variants?.[format] || []) {
        const file = join(ROOT, variant.url);
        if (!existsSync(file)) errors.push(`${variant.url}: missing derivative`);
        else if (statSync(file).size > MAX_BYTES) errors.push(`${variant.url}: exceeds ${MAX_BYTES} bytes`);
        if (variant.width > 1280) errors.push(`${variant.url}: exceeds 1280px width`);
      }
    }
  }
  if (errors.length) throw new Error(`image optimization check failed:\n- ${errors.join('\n- ')}`);
  console.log(`validated ${sources.size} responsive image sets (max ${MAX_BYTES} bytes / 1280px)`);
}

function pruneStale(manifest) {
  const keep = new Set(Object.values(manifest.images || {}).flatMap((entry) =>
    Object.values(entry.variants || {}).flat().map((variant) => variant.url)
  ));
  let removed = 0;
  for (const folder of readdirSync(OUT, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const directory = join(OUT, folder.name);
    for (const name of readdirSync(directory)) {
      const url = relative(ROOT, join(directory, name)).replaceAll('\\', '/');
      if (!keep.has(url)) {
        unlinkSync(join(directory, name));
        removed += 1;
      }
    }
  }
  if (removed) console.log(`pruned ${removed} stale image derivatives`);
}

if (checkOnly) {
  if (!existsSync(MANIFEST)) throw new Error('image manifest is missing; run node tools/optimize-images.mjs');
  validate(previous);
} else {
  mkdirSync(dirname(MANIFEST), { recursive: true });
  await pool([...sources].sort(), 4, optimize);
  const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(), budgets: { maxVariantBytes: MAX_BYTES, maxWidth: 1280 }, images };
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  pruneStale(manifest);
  validate(manifest);
  console.log(`wrote ${relative(ROOT, MANIFEST)}`);
}
