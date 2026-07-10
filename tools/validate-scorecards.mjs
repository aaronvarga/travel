#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const manifest = readJson(path.join(root, 'tools', 'scorecard.manifest.json'));
const profile = readJson(path.join(dataDir, 'decisionProfile.json'));
const expectedWeights = Object.fromEntries(manifest.axes.map((axis) => [axis.id, axis.weightDefault]));
const expectedAxes = new Set(manifest.axes.map((axis) => axis.id));
const problems = [];
const trips = [];

for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
  const file = path.join(dataDir, entry.name, 'main.json');
  if (!entry.isDirectory() || !fs.existsSync(file)) continue;
  const main = readJson(file);
  if (!main.scorecard) continue;
  trips.push({ slug: entry.name, main });
}

for (const { slug, main } of trips) {
  const sc = main.scorecard;
  const axes = Object.keys(sc.axes || {});
  const missingAxes = [...expectedAxes].filter((axis) => !axes.includes(axis));
  const extraAxes = axes.filter((axis) => !expectedAxes.has(axis));
  if (missingAxes.length) issue(slug, `missing axes: ${missingAxes.join(', ')}`);
  if (extraAxes.length) issue(slug, `unknown axes: ${extraAxes.join(', ')}`);
  for (const [axis, value] of Object.entries(sc.axes || {})) {
    if (!Number.isInteger(value) || value < 1 || value > 5) issue(slug, `${axis} must be an integer from 1 to 5`);
  }

  if (JSON.stringify(sc.weightDefaults) !== JSON.stringify(expectedWeights)) {
    issue(slug, 'weightDefaults do not match scorecard.manifest.json');
  }

  const expectedNights = nightsScore(sc.pto?.nights);
  if (sc.axes?.nights !== expectedNights) issue(slug, `nights score ${sc.axes?.nights} != derived ${expectedNights}`);
  const expectedPto = manifest.ptoRubric[String(sc.pto?.days)];
  if (sc.axes?.pto !== expectedPto) issue(slug, `PTO score ${sc.axes?.pto} != derived ${expectedPto}`);
  if (sc.facets?.hasSwim !== (sc.axes?.swim >= 3)) issue(slug, 'hasSwim must equal swim >= 3');

  const [low, high] = sc.facets?.swimTempF || [];
  if (![low, high].every(Number.isFinite) || low > high || low < 28 || high > 90) {
    issue(slug, 'swimTempF must be an ordered ambient/sea-water range from 28F to 90F');
  }
  if (sc.facets?.heatedSwimTempF) {
    const [heatedLow, heatedHigh] = sc.facets.heatedSwimTempF;
    if (![heatedLow, heatedHigh].every(Number.isFinite) || heatedLow > heatedHigh || heatedHigh > 110) {
      issue(slug, 'heatedSwimTempF must be an ordered range no higher than 110F');
    }
  }

  const budget = sc.budget || {};
  if (![budget.floorUsd, budget.ceilUsd, budget.targetUsd, budget.preferredMaxUsd].every(Number.isFinite)) {
    issue(slug, 'budget fields must be numeric');
  } else {
    if (budget.floorUsd > budget.ceilUsd) issue(slug, 'budget floor exceeds ceiling');
    if (budget.targetUsd !== profile.budget.targetUsd || budget.preferredMaxUsd !== profile.budget.preferredMaxUsd) {
      issue(slug, 'budget target/preferred maximum do not match decisionProfile.json');
    }
    if (budget.hardMaxUsd != null) issue(slug, 'trip scorecards must not define a hard budget maximum');
  }

  const window = profile.tripWindows[slug];
  if (!window) {
    issue(slug, 'missing trip window in decisionProfile.json');
  } else {
    const [depart, home] = window.map(parseDate);
    if (depart > home) issue(slug, 'trip window departure is after return');
    for (const day of profile.pittsburghCommitment.requiredFullDays.map(parseDate)) {
      if (depart <= day && day <= home) issue(slug, `away during required Pittsburgh day ${iso(day)}`);
    }
  }
}

const excluded = trips.filter(({ main }) => typeof main.excluded === 'string');
if (trips.length !== 22) issue('all', `expected 22 trips, found ${trips.length}`);
if (excluded.length !== 9) issue('all', `expected 9 excluded trips, found ${excluded.length}`);

if (problems.length) {
  console.error('Scorecard validation failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`validated ${trips.length} scorecards (${trips.length - excluded.length} ranked, ${excluded.length} excluded)`);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function nightsScore(nights) {
  if (nights >= 12) return 5;
  if (nights === 11) return 4;
  if (nights === 10) return 3;
  if (nights === 9) return 2;
  return 1;
}

function parseDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.valueOf())) throw new Error(`Invalid ISO date: ${value}`);
  return date;
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function issue(slug, message) {
  problems.push(`${slug}: ${message}`);
}
