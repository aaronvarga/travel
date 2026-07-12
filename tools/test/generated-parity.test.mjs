import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');

test('summary preserves every source trip and canonical score', () => {
  const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets/trips-summary.json'), 'utf8'));
  assert.equal(summary.trips.length, 30);
  for (const trip of summary.trips) {
    const main = JSON.parse(fs.readFileSync(path.join(root, 'src/_data', trip.slug, 'main.json'), 'utf8'));
    assert.equal(trip.totalBaked, main.scorecard.totalBaked);
    assert.deepEqual(trip.axes, main.scorecard.axes);
    assert.deepEqual(trip.budget, main.scorecard.budget);
  }
});

test('itinerary document titles use the canonical destination and date pattern', () => {
  const tripRoot = path.join(root, 'src/_data');
  const tripDirs = fs.readdirSync(tripRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(tripRoot, entry.name, 'main.json')));

  for (const tripDir of tripDirs) {
    const main = JSON.parse(fs.readFileSync(path.join(tripRoot, tripDir.name, 'main.json'), 'utf8'));
    const browserTitle = main.parts[0].html.match(/<title>(.*?)<\/title>/)?.[1]
      ?.replaceAll('&middot;', '·')
      .replaceAll('&mdash;', '—')
      .replaceAll('&amp;', '&');

    assert.equal(browserTitle, main.title, `${tripDir.name} browser title must match its canonical title`);
    assert.match(main.title, / — .+ 2027$/, `${tripDir.name} title must end with an em-dash date`);
    assert.doesNotMatch(
      main.title,
      /Family Itinerary|Hybrid|Road Trip| - /,
      `${tripDir.name} title contains legacy wording or date punctuation`,
    );
  }

  const composerTemplate = fs.readFileSync(path.join(root, 'src/builder.njk'), 'utf8');
  assert.doesNotMatch(composerTemplate.match(/<title>.*?<\/title>/)?.[0] ?? '', /Family Itinerary|Hybrid|Road Trip| - /);
});
