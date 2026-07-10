#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareDefault } from './lib/recommendation-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'trips-summary.json'), 'utf8'));
const outPath = path.join(root, 'assets', 'rank-analysis.json');
const active = summary.trips.filter((trip) => !trip.excluded);
const iterations = 25000;
const stats = Object.fromEntries(active.map((trip) => [trip.slug, { wins: 0, top3: 0, rankTotal: 0 }]));
let seed = 20260709;

for (let index = 0; index < iterations; index++) {
  const weights = {};
  for (const axis of summary.axes) {
    weights[axis.id] = axis.id === 'budget' ? 1 + Math.floor(random() * 3)
      : axis.id === 'pto' ? Math.floor(random() * 3)
        : Math.floor(random() * 4);
  }
  const ordered = [...active].sort((a, b) => compareDefault(a, b, summary.axes, weights, summary.budgetTargets));
  ordered.forEach((trip, rank) => {
    stats[trip.slug].rankTotal += rank + 1;
    if (rank === 0) stats[trip.slug].wins++;
    if (rank < 3) stats[trip.slug].top3++;
  });
}

const trips = active.map((trip) => ({
  slug: trip.slug,
  winPct: round(100 * stats[trip.slug].wins / iterations),
  top3Pct: round(100 * stats[trip.slug].top3 / iterations),
  averageRank: round(stats[trip.slug].rankTotal / iterations),
})).sort((a, b) => b.top3Pct - a.top3Pct || b.winPct - a.winPct);

const presets = {
  default: weights({ budget: 2 }),
  value: weights({ budget: 3, ease: 2, risk: 2, nights: 1, pto: 1 }),
  'lowest-friction': weights({ budget: 1, ease: 3, risk: 3, pto: 2, nights: 1 }),
  'maximum-swim': weights({ budget: 1, swim: 3, weather: 2, risk: 1, nights: 1 }),
  'epic-scenery': weights({ budget: 1, variety: 3, novelty: 2, weather: 2, nights: 1 }),
};

const presetResults = Object.fromEntries(Object.entries(presets).map(([id, preset]) => [id,
  [...active].sort((a, b) => compareDefault(a, b, summary.axes, preset, summary.budgetTargets)).slice(0, 5).map((trip) => trip.slug),
]));

const output = {
  schemaVersion: 1,
  method: {
    seed: 20260709,
    iterations,
    weightRanges: 'Budget 1-3; PTO 0-2; other axes 0-3, integer uniform. Results describe sensitivity, not probability of trip quality.',
  },
  presets,
  presetResults,
  robustFinalists: trips.filter((trip) => trip.top3Pct >= 20).map((trip) => trip.slug),
  trips,
};

fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`wrote assets/rank-analysis.json (${iterations} deterministic profiles)`);

function weights(overrides) {
  return Object.fromEntries(summary.axes.map((axis) => [axis.id, overrides[axis.id] ?? axis.weightDefault]));
}

function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function round(value) {
  return Math.round(value * 10) / 10;
}
