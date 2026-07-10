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
import { compareDefault } from './lib/recommendation-engine.mjs';
import displayDates from './lib/display-date.cjs';

const { formatCompactTravelWindow } = displayDates;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'trips-summary.json'), 'utf8'));

// /50 = budget*2 + weather + swim + variety + ease + food + risk + nights + novelty (no pto).
const SCORED_AXES = ['weather', 'swim', 'variety', 'ease', 'food', 'risk', 'nights', 'novelty'];

const bad = [];
for (const t of summary.trips) {
  const computed = t.axes.budget * 2 + SCORED_AXES.reduce((s, a) => s + (t.axes[a] || 0), 0);
  if (computed !== t.totalBaked) bad.push(`${t.slug}: computed ${computed} != baked ${t.totalBaked}`);
}

const siteMode = process.argv.includes('--site');
const indexTarget = siteMode ? path.join(root, '_site', 'index.html') : path.join(root, 'index.html');
const indexHtml = fs.readFileSync(indexTarget, 'utf8');
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

const renderedPages = siteMode
  ? [indexTarget, ...summary.trips.map((trip) => path.join(root, '_site', 'locations', trip.slug, 'index.html'))]
  : [indexTarget];
for (const page of renderedPages) {
  const pageHtml = fs.readFileSync(page, 'utf8');
  const pageDocument = load(pageHtml);
  pageDocument('body').find('*').addBack().contents().each((_, node) => {
    if (node.type !== 'text' || !hasNonDisplayDate(node.data || '')) return;
    const parentTag = node.parent?.name?.toLowerCase();
    if (['script', 'style', 'template', 'noscript'].includes(parentTag)) return;
    if (pageDocument(node.parent).closest('[data-preserve-date]').length) return;
    bad.push(`${path.relative(root, page)}: visible ISO date remains in “${node.data.trim().slice(0, 100)}”`);
  });
  if (page !== indexTarget) {
    const pageSlug = page.match(/\/locations\/([^/]+)\/index\.html$/)?.[1];
    const pageTrip = summary.trips.find((trip) => trip.slug === pageSlug);
    const expectedTravelFrame = formatCompactTravelWindow(pageTrip?.travelWindow);
    const travelFrames = pageDocument('[data-travel-frame]');
    if (travelFrames.length !== 1) bad.push(`${path.relative(root, page)}: expected one hero travel-frame block, found ${travelFrames.length}`);
    if (travelFrames.find('b').first().text().trim() !== expectedTravelFrame) bad.push(`${path.relative(root, page)}: hero travel frame does not match ${expectedTravelFrame}`);
    if (travelFrames.find('span').last().text().trim() !== 'Travel frame') bad.push(`${path.relative(root, page)}: hero travel-frame label is not canonical`);
    const hero = pageDocument('.pvcar[data-all-trip-photos="true"]').first();
    const heroPhotos = uniquePhotoSources(pageDocument, hero.find('img[src]'));
    const pagePhotos = uniquePhotoSources(pageDocument, pageDocument('body img[src]').filter((_, image) =>
      !pageDocument(image).closest('.leaflet-container,#tripmap,.spot-map,.trip-gallery-dialog').length
    ));
    if (!hero.length) bad.push(`${path.relative(root, page)}: missing synchronized hero carousel`);
    if (hero.find('figure').length !== heroPhotos.length) bad.push(`${path.relative(root, page)}: hero contains duplicate photo figures`);
    const missing = pagePhotos.filter((source) => !heroPhotos.includes(source));
    if (missing.length) bad.push(`${path.relative(root, page)}: hero is missing ${missing.length} page photo(s): ${missing.slice(0, 3).join(', ')}`);
  }
}

if (bad.length) {
  console.error('✗ scorecard transcription mismatch:');
  for (const b of bad) console.error(`  ${b}`);
  process.exit(1);
}
console.log(`✓ all ${summary.trips.length} scorecards match baked /50 totals`);

function hasNonDisplayDate(value) {
  return /\b\d{4}-\d{2}-\d{2}\b/.test(value)
    || /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:\s*[-–—]\s*(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+)?\d{1,2})?(?:,?\s+\d{4})?\b/i.test(value);
}

function uniquePhotoSources(document, images) {
  return [...new Set(images.toArray().map((image) =>
    String(document(image).attr('src') || '').split(/[?#]/)[0]
  ).filter(Boolean))];
}

function defaultTripSort(a, b) {
  const weights = Object.fromEntries(summary.axes.map((axis) => [axis.id, axis.weightDefault]));
  return compareDefault(a, b, summary.axes, weights, summary.budgetTargets);
}
