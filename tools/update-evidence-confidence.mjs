#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { deriveEvidenceConfidence } from './lib/evidence-confidence.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dataDir = path.join(root, 'src', '_data');
const scoreManifest = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'scorecard.manifest.json'), 'utf8'));
let updated = 0;

for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
  const file = path.join(dataDir, entry.name, 'evidence.json');
  if (!entry.isDirectory() || !fs.existsSync(file)) continue;
  const evidence = JSON.parse(fs.readFileSync(file, 'utf8'));
  const derived = deriveEvidenceConfidence(evidence, scoreManifest);
  for (const [axis, confidence] of Object.entries(derived.axes)) evidence.axes[axis].confidence = confidence;
  evidence.overallConfidence = derived.overall;
  fs.writeFileSync(file, `${JSON.stringify(evidence, null, 2)}\n`);
  updated += 1;
}

console.log(`updated derived confidence for ${updated} trip evidence records`);
