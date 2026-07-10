#!/usr/bin/env node
/**
 * build-summary.mjs — aggregates per-trip scorecards + section completeness
 * into a single client-consumable manifest: assets/trips-summary.json.
 *
 * Run after lint-sections.mjs (which writes assets/section-status.json) and
 * before eleventy. Fails the build on any slug mismatch between the two sources.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { budgetStatus, evidenceConfidence, readiness } from './lib/recommendation-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const statusPath = path.join(root, 'assets', 'section-status.json');
const outPath = path.join(root, 'assets', 'trips-summary.json');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'scorecard.manifest.json'), 'utf8'));
const decisionProfile = JSON.parse(fs.readFileSync(path.join(dataDir, 'decisionProfile.json'), 'utf8'));
const evidenceSources = JSON.parse(fs.readFileSync(path.join(dataDir, 'shared', 'evidenceSources.json'), 'utf8'));

const status = fs.existsSync(statusPath) ? JSON.parse(fs.readFileSync(statusPath, 'utf8')) : {};
const ignoredSlugs = new Set(['smoketest']);

// directory slug -> scoreboard data-trip token used in index.html markup
const TOKEN = {
  portugal: 'portugal', 'portugal-crete': 'portugal-crete', 'madeira-crete': 'madeira-crete',
  'portugal-sicily': 'portugal-sicily', 'madeira-sicily': 'madeira-sicily',
  'portugal-algarve-sicily': 'portugal-algarve-sicily',
  'madeira-mallorca': 'madeira-mallorca', 'canary-islands': 'canary-islands', hawaii: 'hawaii',
  'maui-kauai': 'maui-kauai',
  croatia: 'croatia', 'italy-salento-amalfi': 'italy', 'sardinia-corsica': 'sardinia',
  'greece-via-lisbon': 'greece', 'turkish-riviera': 'turkey', 'sicily-malta': 'sicily',
  spain: 'spain', 'california-pacific-coast': 'california', 'southern-france': 'southernfrance',
  balkans: 'balkans', 'dolomites-sardinia': 'dolomites-sardinia', albania: 'albania',
  iceland: 'iceland',
};

const slugs = fs
  .readdirSync(dataDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(dataDir, d.name, 'main.json')))
  .map((d) => d.name)
  .filter((name) => !ignoredSlugs.has(name))
  .sort();

const trips = [];
const problems = [];

for (const slug of slugs) {
  const main = JSON.parse(fs.readFileSync(path.join(dataDir, slug, 'main.json'), 'utf8'));
  const sc = main.scorecard;
  const evidencePath = path.join(dataDir, slug, 'evidence.json');
  const variantsPath = path.join(dataDir, slug, 'variants.json');
  const evidence = fs.existsSync(evidencePath) ? JSON.parse(fs.readFileSync(evidencePath, 'utf8')) : null;
  const variants = fs.existsSync(variantsPath) ? JSON.parse(fs.readFileSync(variantsPath, 'utf8')) : null;
  if (!sc) { problems.push(`${slug}: missing scorecard block`); continue; }
  const st = status[slug];
  if (!st) problems.push(`${slug}: no entry in section-status.json`);

  if (!TOKEN[slug]) problems.push(`${slug}: no scoreboard token mapping`);
  const trip = {
    slug,
    token: TOKEN[slug],
    title: main.title,
    displayName: sc.displayName,
    blurb: sc.blurb,
    recommended: main.recommended === true,
    excluded: typeof main.excluded === 'string' ? main.excluded : null,
    axes: sc.axes,
    weightDefaults: sc.weightDefaults,
    budget: sc.budget,
    pto: sc.pto,
    facets: sc.facets,
    totalBaked: sc.totalBaked,
    travelWindow: decisionProfile.tripWindows[slug],
    routeReadiness: decisionProfile.routeReadiness[slug] || 'current-proxy',
    budgetStatus: budgetStatus(sc.budget, decisionProfile.budget),
    evidence: evidence ? {
      reviewedAt: evidence.reviewedAt,
      overallConfidence: evidence.overallConfidence,
      limitingAxes: manifest.axes
        .filter((axis) => axis.weightDefault > 0 && evidence.axes?.[axis.id]?.confidence === evidence.overallConfidence)
        .map((axis) => axis.id),
      evidenceBasis: evidence.evidenceBasis,
      confidenceBasis: evidence.confidenceBasis,
      confidence: evidenceConfidence(evidence),
      axes: evidence.axes,
      facts: evidence.facts,
    } : null,
    metrics: evidence?.metrics || null,
    variants: variants?.variants || [],
    canonicalVariantId: variants?.canonicalId || null,
    alternateStatus: variants?.alternateStatus || null,
    completeness: st ? { complete: st.complete, total: st.total } : null,
    href: `locations/${slug}/index.html`,
  };
  trip.readiness = readiness(trip);
  trips.push(trip);
}

// Every status slug must have a scorecard trip too.
for (const slug of Object.keys(status)) {
  if (ignoredSlugs.has(slug)) continue;
  if (!trips.find((t) => t.slug === slug)) problems.push(`${slug}: in section-status.json but no scorecard trip`);
}

if (problems.length) {
  console.error('✗ build-summary problems:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

const out = { axes: manifest.axes, budgetTargets: manifest.budgetTargets, evidenceSources, trips };
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${path.relative(root, outPath)} (${trips.length} trips)`);
