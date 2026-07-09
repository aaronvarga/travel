/**
 * trips.js — pagination index for src/itinerary.njk.
 * Reads the per-trip sidecar files written by tools/extract.mjs:
 *   src/_data/<slug>/main.json   (required)
 *   src/_data/<slug>/photoGuide.json / foodGuide.json (optional)
 * Returns an array of { slug, main, photoGuide?, foodGuide? }.
 */
const fs = require('fs');
const path = require('path');

module.exports = function () {
  const dir = __dirname; // src/_data
  const ignored = new Set(['smoketest']);
  const slugs = fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !ignored.has(name))
    .filter((name) => fs.existsSync(path.join(dir, name, 'main.json')))
    .sort();

  return slugs.map((slug) => {
    const base = path.join(dir, slug);
    const readJson = (f) => JSON.parse(fs.readFileSync(path.join(base, f), 'utf8'));
    const trip = { slug, main: readJson('main.json') };
    if (fs.existsSync(path.join(base, 'photoGuide.json'))) trip.photoGuide = readJson('photoGuide.json');
    if (fs.existsSync(path.join(base, 'foodGuide.json'))) trip.foodGuide = readJson('foodGuide.json');
    return trip;
  });
};
