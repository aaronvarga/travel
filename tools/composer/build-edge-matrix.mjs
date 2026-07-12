import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const output = path.join(root, 'src/_data/composer/edges.json');
const specs = [
  ['madeira', 'crete', 28, 5, 4, true], ['madeira', 'sicily', 28.75, 5, 5, true], ['madeira', 'kefalonia', 27, 5, 4, true], ['madeira', 'mallorca', 27, 4, 4, true], ['madeira', 'malta', 28, 5, 5, true],
  ['lisbon-cascais', 'crete', 8, 4, 4], ['lisbon-cascais', 'sicily', 3, 4, 4], ['lisbon-cascais', 'mallorca', 2, 3, 3], ['lisbon-cascais', 'malta', 5, 4, 4], ['lisbon-cascais', 'athens-cyclades', 4, 3, 3],
  ['algarve', 'sicily', 9.67, 5, 5], ['algarve', 'mallorca', 5, 4, 3], ['algarve', 'malta', 6, 4, 4],
  ['switzerland', 'crete', 5, 2, 2], ['switzerland', 'sicily', 3.5, 2, 2], ['switzerland', 'mallorca', 3, 2, 2],
  ['venice-dolomites', 'sardinia', 1.5, 3, 3], ['venice-dolomites', 'malta', 2, 3, 3],
  ['slovenia', 'malta', 4, 3, 3], ['slovenia', 'sardinia', 5, 4, 3],
  ['athens-cyclades', 'crete', 1, 3, 3], ['athens-cyclades', 'malta', 2, 3, 3],
  ['malta', 'sicily', 0.75, 2, 2], ['kefalonia', 'lefkada', 3, 3, 3, false, 'ferry'],
  ['sardinia', 'corsica', 1, 3, 3, false, 'ferry'], ['corsica', 'sardinia', 1, 3, 3, false, 'ferry'],
];

const edges = specs.map(([from, to, hours, complexity, risk, buffer = false, mode = 'air']) => ({
  id: `${from}->${to}`, enabled: true, from, to, mode, via: buffer ? ['LIS'] : [], hours,
  familyCostUsd: mode === 'ferry' ? [250, 550] : [700 + complexity * 100, 1100 + complexity * 180],
  complexity, risk,
  buffer: buffer ? { nights: 1, city: 'Lisbon', lodgingPerNightUsd: [130, 200], reason: 'island weather and thin-schedule insurance' } : null,
  transferTemplate: buffer ? 'island-exit-with-buffer' : mode === 'ferry' ? 'ferry' : 'short-hop',
  watch: mode === 'ferry' ? 'Confirm the 2027 ferry day, vehicle rules, and port check-in window.' : 'Confirm the exact 2027 operating day and prefer a protected itinerary where available.',
  schedule2027: 'unconfirmed',
}));

const transferTemplates = {
  'short-hop': { transferDays: 1, replacesFromDeparture: true, replacesToArrival: true, pattern: ['Check out, complete the air transfer, collect the next car if needed, and keep the first evening light.'] },
  'island-exit-with-buffer': { transferDays: 2, replacesFromDeparture: true, replacesToArrival: true, pattern: ['Fly from the island to the buffer city and sleep near the onward gateway.', 'Continue on the protected connection and settle into the next destination.'] },
  ferry: { transferDays: 1, replacesFromDeparture: true, replacesToArrival: true, pattern: ['Return the first car if required, cross by ferry, collect the next car, and keep the arrival evening light.'] },
};
fs.writeFileSync(output, `${JSON.stringify({ edges, transferTemplates }, null, 2)}\n`);
console.log(`wrote ${edges.length} directed composer edges`);
