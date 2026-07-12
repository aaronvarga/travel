import test from 'node:test';
import assert from 'node:assert/strict';
import { budgetScore, nightsScore, ptoDays, ptoScore } from '../composer/estimate-scorecard.mjs';

test('composer score rubrics preserve canonical thresholds', () => {
  assert.equal(nightsScore(13), 5);
  assert.equal(nightsScore(11), 4);
  assert.equal(budgetScore({ floorUsd: 11000, ceilUsd: 14900 }), 3);
  assert.equal(ptoScore(9), 2);
});

test('PTO matches the Madeira-Crete convention and excludes observed Juneteenth', () => {
  assert.equal(ptoDays('2027-06-08', '2027-06-22'), 9);
});

test('committed combo timelines account for buffer nights exactly once', async () => {
  const combos = (await import('../../src/_data/composer/combos.json', { with: { type: 'json' } })).default;
  for (const combo of combos) {
    assert.equal(combo.totalNights, combo.legNightsA + combo.edgeNights + combo.legNightsB);
    assert.equal(combo.calendarDays, combo.totalNights + 2);
    assert.equal(combo.itinerary.days.length, combo.calendarDays + 1);
  }
});
