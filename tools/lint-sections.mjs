#!/usr/bin/env node
/**
 * lint-sections.mjs — section-completeness guardrail for itineraries.
 *
 * For every trip (src/_data/<slug>/main.json) it detects which canonical
 * sections (tools/sections.manifest.json) are present, by:
 *   - scanning the concatenated parts[].html for <section id="..."> anchors,
 *   - treating structured markers as their anchor (part.t "itinerary" => the
 *     itinerary section; preDepartureTodos / part.t "todo" => "todo";
 *     part.t "entry"/"packing" => their anchors, since the njk macros emit
 *     <section id="entry|packing">).
 *
 * Prints a presence matrix, writes assets/section-status.json (consumed by
 * index.html), and exits non-zero if any `recommended: true` trip is missing a
 * required section. Non-recommended trips are reported but never fail the build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const manifestPath = path.join(root, 'tools', 'sections.manifest.json');
const outPath = path.join(root, 'assets', 'section-status.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const required = manifest.sections.filter((s) => s.required).map((s) => s.id);
const ignoredSlugs = new Set(['smoketest']);

const slugs = fs
  .readdirSync(dataDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(dataDir, d.name, 'main.json')))
  .map((d) => d.name)
  .filter((name) => !ignoredSlugs.has(name))
  .sort();

const ANCHOR_RE = /<section[^>]*\bid="([^"]+)"/g;

function detect(main) {
  const found = new Set();
  const parts = Array.isArray(main.parts) ? main.parts : [];
  const html = parts.map((p) => p.html || '').join('\n');
  let m;
  while ((m = ANCHOR_RE.exec(html)) !== null) found.add(m[1]);
  // structured parts that don't carry a raw <section id> in `html`
  for (const p of parts) {
    if (p.t === 'itinerary') found.add('itinerary');
    if (p.t === 'todo' && main.preDepartureTodos) found.add('todo');
    if (p.t === 'entry') found.add('entry');
    if (p.t === 'packing') found.add('packing');
  }
  if (main.preDepartureTodos) found.add('todo');
  return found;
}

const status = {};
const failures = [];

for (const slug of slugs) {
  const main = JSON.parse(fs.readFileSync(path.join(dataDir, slug, 'main.json'), 'utf8'));
  const found = detect(main);
  const sections = {};
  let complete = 0;
  for (const id of required) {
    const present = found.has(id);
    sections[id] = present;
    if (present) complete += 1;
  }
  const recommended = main.recommended === true;
  status[slug] = { recommended, complete, total: required.length, sections };
  if (recommended && complete < required.length) {
    const missing = required.filter((id) => !found.has(id));
    failures.push({ slug, missing });
  }
}

// ---- report ----
const idCol = required.map((id) => id.slice(0, 4).padEnd(5));
console.log('SECTION COMPLETENESS\n');
console.log('trip'.padEnd(20) + 'rec  ' + idCol.join('') + ' score');
for (const slug of slugs) {
  const s = status[slug];
  const cells = required.map((id) => (s.sections[id] ? ' ✓   ' : ' ·   ')).join('');
  console.log(
    slug.padEnd(20) + (s.recommended ? '★    ' : '     ') + cells + ` ${s.complete}/${s.total}`,
  );
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(status, null, 2) + '\n');
console.log(`\nwrote ${path.relative(root, outPath)}`);

if (failures.length) {
  console.error('\n✗ recommended trips missing required sections:');
  for (const f of failures) console.error(`  ${f.slug}: ${f.missing.join(', ')}`);
  process.exit(1);
}
console.log('\n✓ all recommended trips complete');
