#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareDefault } from './lib/recommendation-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const manifest = readJson(path.join(root, 'tools', 'scorecard.manifest.json'));
const profile = readJson(path.join(dataDir, 'decisionProfile.json'));
const weights = Object.fromEntries(manifest.axes.map((axis) => [axis.id, axis.weightDefault]));

const records = fs.readdirSync(dataDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dataDir, entry.name, 'main.json')))
  .map((entry) => {
    const file = path.join(dataDir, entry.name, 'main.json');
    const main = readJson(file);
    return { file, main, slug: entry.name, excluded: typeof main.excluded === 'string' ? main.excluded : null, ...main.scorecard };
  })
  .filter((record) => record.main.tripCategory !== 'short');

const ranked = records
  .filter((record) => !record.excluded)
  .sort((a, b) => compareDefault(a, b, manifest.axes, weights, profile.budget));
const rankBySlug = new Map(ranked.map((record, index) => [record.slug, index + 1]));

for (const record of records) {
  const total = record.main.scorecard.totalBaked;
  const rank = rankBySlug.get(record.slug);
  record.main.parts = recursiveStrings(record.main.parts, (value) => value
    .replace(/\b\d{2}\/55\b/g, `${total}/55`)
    .replace(/#\d+ of \d+/g, (match) => rank ? `#${rank} of ${ranked.length}` : match));
}

for (const record of records) writeJson(record.file, record.main);
console.log(`synchronized score and rank citations for ${records.length} full itineraries`);

function recursiveStrings(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((item) => recursiveStrings(item, fn));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, recursiveStrings(item, fn)]));
  return value;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
