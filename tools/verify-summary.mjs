#!/usr/bin/env node
/**
 * verify-summary.mjs — proves the extraction is lossless.
 *
 * For every trip, the default-weighted total of the six single-weight scored
 * axes plus the double-weighted budget axis (i.e. the original /40 rubric,
 * which excludes PTO) must equal the baked total transcribed from index.html.
 * Exits non-zero on any mismatch.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'trips-summary.json'), 'utf8'));

// Original /40 = budget*2 + weather + swim + variety + ease + food + risk (no pto).
const SCORED_40 = ['weather', 'swim', 'variety', 'ease', 'food', 'risk'];

const bad = [];
for (const t of summary.trips) {
  const computed = t.axes.budget * 2 + SCORED_40.reduce((s, a) => s + (t.axes[a] || 0), 0);
  if (computed !== t.totalBaked) bad.push(`${t.slug}: computed ${computed} != baked ${t.totalBaked}`);
}

if (bad.length) {
  console.error('✗ scorecard transcription mismatch:');
  for (const b of bad) console.error(`  ${b}`);
  process.exit(1);
}
console.log(`✓ all ${summary.trips.length} scorecards match baked /40 totals`);
