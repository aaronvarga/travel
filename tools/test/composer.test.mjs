import test from 'node:test';
import assert from 'node:assert/strict';
import { budgetScore, nightsScore, ptoDays, ptoScore } from '../composer/estimate-scorecard.mjs';
import fs from 'node:fs';

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

test('composed pages preserve the canonical itinerary section contract', () => {
  const template = fs.readFileSync('src/builder.njk', 'utf8')
    + fs.readFileSync('src/_includes/itinerary/composed-map.njk', 'utf8')
    + fs.readFileSync('src/_includes/composer/sections.njk', 'utf8');
  const required = ['overview', 'why-this-trip', 'kids-favorites', 'stays', 'calendar', 'itinerary', 'map', 'air-travel', 'getting-around', 'entry', 'health-check', 'timing', 'todo', 'budget', 'totals', 'tips', 'packing', 'social', 'balance', 'status', 'photo-guide', 'food-guide', 'recommendation-readiness', 'recommendation-evidence', 'variants'];
  for (const id of required) assert.match(template, new RegExp(`id=\\"${id}\\"|id=\\'${id}\\'`));
  assert.match(template, /verification-empty/);
  assert.match(template, /verification-badge/);
  assert.match(template, /class="preview"/);
  assert.match(template, /class="site-nav"/);
});
