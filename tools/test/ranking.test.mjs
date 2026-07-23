import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { applyVariant, budgetStatus, compareDefault, readiness } from '../lib/recommendation-engine.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets/trips-summary.json'), 'utf8'));
const defaults = Object.fromEntries(summary.axes.map((axis) => [axis.id, axis.weightDefault]));

test('default appeal order keeps all active and reference trips visible', () => {
  const ordered = [...summary.trips].sort((a, b) => compareDefault(a, b, summary.axes, defaults, summary.budgetTargets));
  assert.equal(ordered.length, 30);
  assert.deepEqual(ordered.slice(0, 4).map((trip) => trip.slug), ['portugal', 'madeira-mallorca', 'portugal-sicily', 'slovenia-adriatic']);
  assert.equal(ordered.filter((trip) => !trip.excluded).length, 21);
  assert.equal(ordered.filter((trip) => trip.excluded).length, 9);
});

test('source prose rank and total citations match the default engine result', () => {
  const ordered = [...summary.trips].sort((a, b) => compareDefault(a, b, summary.axes, defaults, summary.budgetTargets));
  const ranked = ordered.filter((trip) => !trip.excluded);
  const rankBySlug = new Map(ranked.map((trip, index) => [trip.slug, index + 1]));
  for (const trip of summary.trips) {
    const main = JSON.parse(fs.readFileSync(path.join(root, 'src', '_data', trip.slug, 'main.json'), 'utf8'));
    for (const text of stringValues(main)) {
      for (const match of text.matchAll(/#(\d+) of (\d+)/g)) {
        assert.equal(Number(match[1]), rankBySlug.get(trip.slug), `${trip.slug} has stale rank citation ${match[0]}`);
        assert.equal(Number(match[2]), ranked.length, `${trip.slug} has stale ranked-count citation ${match[0]}`);
      }
      for (const match of text.matchAll(/\b(\d{2})\/55\b/g)) {
        assert.equal(Number(match[1]), trip.totalBaked, `${trip.slug} has stale total citation ${match[0]}`);
      }
    }
  }
});

test('readiness never changes appeal data', () => {
  const greece = summary.trips.find((trip) => trip.slug === 'greece-via-lisbon');
  assert.equal(readiness(greece).id, 'exact-2027-schedule-required');
  assert.equal(readiness(greece).bookable, false);
  assert.equal(greece.totalBaked, 35);
  assert.equal(greece.excluded, null);
});

test('applying a shorter variant returns a new trip', () => {
  const italy = summary.trips.find((trip) => trip.slug === 'italy-salento-amalfi');
  const variant = italy.variants.find((item) => item.id === 'preference-fit-11n');
  const changed = applyVariant(italy, variant, summary.axes);
  assert.notEqual(changed, italy);
  assert.equal(italy.pto.nights, 12);
  assert.equal(changed.pto.nights, 11);
  assert.equal(changed.budget.ceilUsd, 14800);
});

test('zero Budget weight removes every cost-based tie-break', () => {
  const weights = { ...defaults, budget: 0 };
  const base = {
    excluded: null,
    axes: Object.fromEntries(summary.axes.map((axis) => [axis.id, 3])),
    pto: { days: 8, nights: 12 },
  };
  const expensiveA = { ...base, slug: 'a', displayName: 'A expensive', budget: { floorUsd: 18000, ceilUsd: 22000 } };
  const cheapZ = { ...base, slug: 'z', displayName: 'Z cheap', budget: { floorUsd: 7000, ceilUsd: 9000 } };
  assert.ok(compareDefault(expensiveA, cheapZ, summary.axes, weights, summary.budgetTargets) < 0);
});

test('preferred maximum changes warning status but never visibility data', () => {
  const alternative = summary.trips.find((trip) => trip.slug === 'portugal-algarve-sicily');
  const statusAt15 = budgetStatus(alternative.budget, { targetUsd: 12000, preferredMaxUsd: 15000 });
  const statusAt18 = budgetStatus(alternative.budget, { targetUsd: 12000, preferredMaxUsd: 18000 });
  assert.equal(statusAt15, 'crosses-preference');
  assert.equal(statusAt18, 'within-preference');
  assert.equal(alternative.excluded, null);
});

function* stringValues(value) {
  if (typeof value === 'string') {
    yield value;
  } else if (Array.isArray(value)) {
    for (const item of value) yield* stringValues(item);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) yield* stringValues(item);
  }
}
