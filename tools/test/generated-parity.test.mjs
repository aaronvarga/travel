import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');

test('summary preserves every source trip and canonical score', () => {
  const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets/trips-summary.json'), 'utf8'));
  assert.equal(summary.trips.length, 28);
  for (const trip of summary.trips) {
    const main = JSON.parse(fs.readFileSync(path.join(root, 'src/_data', trip.slug, 'main.json'), 'utf8'));
    assert.equal(trip.totalBaked, main.scorecard.totalBaked);
    assert.deepEqual(trip.axes, main.scorecard.axes);
    assert.deepEqual(trip.budget, main.scorecard.budget);
  }
});
