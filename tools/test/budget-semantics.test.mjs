import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('budget profile uses a preference, not a hard cap', () => {
  const profile = readJson('src/_data/decisionProfile.json');
  assert.equal(profile.budget.targetUsd, 12000);
  assert.equal(profile.budget.preferredMaxUsd, 15000);
  assert.equal(profile.budget.hardMaxUsd, null);
  assert.equal('bookingCapUsd' in profile.budget, false);
});

test('budget status never changes itinerary visibility', () => {
  const summary = readJson('assets/trips-summary.json');
  assert.equal(summary.trips.length, 29);
  assert.equal(summary.trips.filter((trip) => !trip.excluded).length, 20);
  assert.equal(summary.trips.filter((trip) => trip.excluded).length, 9);
  assert.ok(summary.trips.some((trip) => trip.budget.ceilUsd > 15000 && !trip.excluded));
  assert.ok(summary.trips.every((trip) => [
    'target-fit',
    'within-preference',
    'crosses-preference',
    'likely-over-preference',
  ].includes(trip.budgetStatus)));
});
