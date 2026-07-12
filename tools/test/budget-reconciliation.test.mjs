import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('every canonical budget is arithmetically reconciled', () => {
  const data = JSON.parse(fs.readFileSync('assets/budget-reconciliation.json', 'utf8'));
  assert.equal(data.schemaVersion, 2);
  assert.equal(data.trips.length, 28);
  for (const trip of data.trips) {
    assert.equal(trip.status, 'matched', `${trip.slug} is not reconciled`);
    assert.ok(trip.arithmetic.lineItems >= 3, `${trip.slug} has too few line items`);
    assert.ok(Math.abs(trip.arithmetic.deltaLowUsd) <= trip.arithmetic.toleranceUsd);
    assert.ok(Math.abs(trip.arithmetic.deltaHighUsd) <= trip.arithmetic.toleranceUsd);
    assert.ok(Math.abs(trip.arithmetic.displayedDeltaLowUsd) <= trip.arithmetic.toleranceUsd);
    assert.ok(Math.abs(trip.arithmetic.displayedDeltaHighUsd) <= trip.arithmetic.toleranceUsd);
  }
});
