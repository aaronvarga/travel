import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/capitalOnePoints.json'), 'utf8'));
const dataRoot = path.join(root, 'src/_data');

test('every full itinerary has one Capital One points plan and short escapes do not', () => {
  const mains = fs.readdirSync(dataRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dataRoot, entry.name, 'main.json'))
    .filter((file) => fs.existsSync(file))
    .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));

  const fullSlugs = mains.filter((main) => main.tripCategory !== 'short').map((main) => main.slug).sort();
  const shortSlugs = mains.filter((main) => main.tripCategory === 'short').map((main) => main.slug).sort();
  assert.deepEqual(Object.keys(data.plans).sort(), fullSlugs);
  for (const slug of shortSlugs) assert.equal(data.plans[slug], undefined, `${slug} should not have a full-trip points plan`);
});

test('points assumptions and rendered include remain synchronized', () => {
  assert.equal(data.balance, 200000);
  assert.equal(data.fixedValueUsd, 2000);
  assert.equal(data.balance / 100, data.fixedValueUsd);

  const include = fs.readFileSync(path.join(root, 'src/_includes/itinerary/capital-one-points.njk'), 'utf8');
  const page = fs.readFileSync(path.join(root, 'src/itinerary.njk'), 'utf8');
  assert.match(include, /id="capital-one-points"/);
  assert.match(include, /trip\.main\.tripCategory != "short"/);
  assert.match(page, /Points &amp; Miles/);
  assert.match(page, /include "itinerary\/capital-one-points\.njk"/);
});
