#!/usr/bin/env node
/**
 * verify-summary.mjs — proves the extraction is lossless.
 *
 * For every trip, the default-weighted total of the eight single-weight scored
 * axes plus the double-weighted budget axis (the /50 rubric, excluding PTO)
 * must equal the baked total transcribed from index.html.
 * Exits non-zero on any mismatch.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'trips-summary.json'), 'utf8'));

// /50 = budget*2 + weather + swim + variety + ease + food + risk + nights + novelty (no pto).
const SCORED_AXES = ['weather', 'swim', 'variety', 'ease', 'food', 'risk', 'nights', 'novelty'];

const bad = [];
for (const t of summary.trips) {
  const computed = t.axes.budget * 2 + SCORED_AXES.reduce((s, a) => s + (t.axes[a] || 0), 0);
  if (computed !== t.totalBaked) bad.push(`${t.slug}: computed ${computed} != baked ${t.totalBaked}`);
}

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const $ = load(indexHtml);
const active = summary.trips
  .filter((trip) => !trip.excluded)
  .sort(defaultTripSort);
const expectedSlugs = active.map((trip) => trip.slug);
const activeTokens = new Set(active.map((trip) => trip.token));
const rowSlugs = $('.compare-table tbody tr[data-trip]')
  .toArray()
  .map((row) => summary.trips.find((trip) => trip.token === $(row).attr('data-trip')))
  .filter((trip) => trip && activeTokens.has(trip.token))
  .map((trip) => trip.slug);
const cardSlugs = $('.shortlist > .sl-grid')
  .first()
  .find('.sl-card[href]')
  .toArray()
  .map((card) => $(card).attr('href')?.match(/locations\/([^/]+)\//)?.[1])
  .filter(Boolean);

if (JSON.stringify(rowSlugs) !== JSON.stringify(expectedSlugs)) {
  bad.push(`static scoreboard order does not match default comparator\n    expected: ${expectedSlugs.join(', ')}\n    actual:   ${rowSlugs.join(', ')}`);
}
if (JSON.stringify(cardSlugs) !== JSON.stringify(expectedSlugs)) {
  bad.push(`static card order does not match default comparator\n    expected: ${expectedSlugs.join(', ')}\n    actual:   ${cardSlugs.join(', ')}`);
}

$('.compare-table tbody tr[data-trip]').each((_, row) => {
  const trip = summary.trips.find((item) => item.token === $(row).attr('data-trip'));
  if (!trip) return;
  const displayed = Number($(row).find('td:last-child b').text());
  if (displayed !== trip.totalBaked) bad.push(`${trip.slug}: static row total ${displayed} != ${trip.totalBaked}`);
});

active.forEach((trip, index) => {
  const card = $(`.shortlist > .sl-grid .sl-card[href="locations/${trip.slug}/index.html"]`).first();
  const displayed = card.find('.sl-rank').text().trim();
  if (displayed !== `#${index + 1}`) bad.push(`${trip.slug}: static rank ${displayed} != #${index + 1}`);
});

if (bad.length) {
  console.error('✗ scorecard transcription mismatch:');
  for (const b of bad) console.error(`  ${b}`);
  process.exit(1);
}
console.log(`✓ all ${summary.trips.length} scorecards match baked /50 totals`);

function defaultTripSort(a, b) {
  const score = b.totalBaked - a.totalBaked;
  if (score) return score;
  const cap = summary.budgetTargets.capUsd || 15000;
  const capClean = Number(a.budget.ceilUsd > cap) - Number(b.budget.ceilUsd > cap);
  return capClean ||
    (a.pto.days - b.pto.days) ||
    (a.budget.ceilUsd - b.budget.ceilUsd) ||
    (a.budget.floorUsd - b.budget.floorUsd);
}
