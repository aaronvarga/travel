#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { deriveEvidenceConfidence } from './lib/evidence-confidence.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dataDir = path.join(root, 'src', '_data');
const scoreManifest = readJson(path.join(root, 'tools', 'scorecard.manifest.json'));
const rows = [];

for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
  const mainPath = path.join(dataDir, entry.name, 'main.json');
  const evidencePath = path.join(dataDir, entry.name, 'evidence.json');
  if (!entry.isDirectory() || !fs.existsSync(mainPath) || !fs.existsSync(evidencePath)) continue;
  const main = readJson(mainPath);
  const evidence = readJson(evidencePath);
  const derived = deriveEvidenceConfidence(evidence, scoreManifest);
  const limitingAxes = scoreManifest.axes
    .filter(({ id, weightDefault }) => weightDefault > 0 && derived.axes[id] === derived.overall)
    .map(({ id }) => id);
  const route = evidence.facts.find((fact) => fact.id === 'route-readiness');
  rows.push({
    slug: entry.name,
    group: main.excluded ? 'excluded' : 'ranked',
    confidence: derived.overall,
    limitingAxes,
    route: route?.value?.status || route?.proxyStatus || 'unknown',
  });
}

rows.sort((a, b) => a.group.localeCompare(b.group) || a.slug.localeCompare(b.slug));
const counts = rows.reduce((result, row) => {
  const key = `${row.group}-${row.confidence}`;
  result[key] = (result[key] || 0) + 1;
  return result;
}, {});

console.log(JSON.stringify({ counts, trips: rows }, null, 2));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
