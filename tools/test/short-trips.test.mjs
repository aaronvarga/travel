import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);

test('short escapes stay compact, budget-first, and outside the long-trip ranking', () => {
  const shortTrips = require('../../src/_data/shortTrips.js')();
  const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets/trips-summary.json'), 'utf8'));

  assert.deepEqual(shortTrips.map((trip) => trip.slug), [
    'short-puerto-rico',
    'short-ischia',
    'short-azores',
    'short-portugal',
    'short-algarve',
    'short-iceland',
    'short-acadia',
    'short-sicily',
    'short-madeira',
    'short-alaska',
  ]);
  assert.deepEqual(shortTrips.map((trip) => trip.shortScore), [47, 45, 45, 44, 44, 44, 42, 42, 42, 38]);
  assert.deepEqual(shortTrips.map((trip) => trip.shortRank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const trip of shortTrips) {
    const main = JSON.parse(fs.readFileSync(path.join(root, 'src/_data', trip.slug, 'main.json'), 'utf8'));
    assert.equal(main.tripCategory, 'short');
    assert.equal(main.recommended, true);
    assert.ok(main.scorecard.pto.nights <= 7, `${trip.slug} exceeds seven hotel nights`);
    // Current exact-date airfare can push a short escape above the old $13k planning guard.
    // Keep it visible through the shared $15k preferred maximum and let Budget scoring
    // communicate the loss of value rather than hiding a researched option.
    assert.ok(main.scorecard.budget.ceilUsd <= 15000, `${trip.slug} exceeds the preferred maximum`);
    assert.equal(summary.trips.some((ranked) => ranked.slug === trip.slug), false);
  }
});

test('the short-escape band appears before the comparison shortlist', () => {
  const source = fs.readFileSync(path.join(root, 'src/index.njk'), 'utf8');
  assert.ok(source.indexOf('<section id="short-trips">') < source.indexOf('<section id="trips"'));
});

test('every short escape uses one continuous hourly calendar', () => {
  for (const { slug } of require('../../src/_data/shortTrips.js')()) {
    const main = JSON.parse(fs.readFileSync(path.join(root, 'src/_data', slug, 'main.json'), 'utf8'));
    const calendar = main.parts[0].html.match(/<section id="calendar"[\s\S]*?<\/section>/)?.[0] || '';
    assert.equal((calendar.match(/class="cal-week"/g) || []).length, 1, `${slug} must have one strip`);
    assert.equal((calendar.match(/class="dh trip"/g) || []).length, main.itinerary.days.length, `${slug} must show every travel day`);
    assert.equal((calendar.match(/class="tl"/g) || []).length, 9, `${slug} must show the 6a–10p hour gutter`);
    assert.doesNotMatch(calendar, /short-cal-|cc-/, `${slug} still contains a legacy short calendar`);
  }
});

test('every short escape carousel contains exactly ten photos', () => {
  for (const { slug } of require('../../src/_data/shortTrips.js')()) {
    const main = JSON.parse(fs.readFileSync(path.join(root, 'src/_data', slug, 'main.json'), 'utf8'));
    const hero = main.parts[0].html.match(/<div class="carousel pvcar"[\s\S]*?<\/section>/)?.[0] || '';
    assert.equal((hero.match(/<figure>/g) || []).length, 10, `${slug} hero must have ten photos`);
    assert.match(hero, /data-n="10"/, `${slug} hero count metadata must be ten`);
    const heroSources = [...hero.matchAll(/<img src="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(heroSources).size, 10, `${slug} hero contains duplicate photos`);
    for (const day of main.itinerary.days) {
      for (const spot of day.spots || []) {
        if (!spot.carouselId) continue;
        assert.equal(spot.images?.length, 10, `${slug} ${spot.carouselId} must have ten photos`);
        assert.equal(new Set(spot.images.map((image) => image.src)).size, 10, `${slug} ${spot.carouselId} contains duplicate photos`);
      }
    }
  }
});
