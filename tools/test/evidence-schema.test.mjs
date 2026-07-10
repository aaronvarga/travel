import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('evidence contract matches the scorecard axes', () => {
  const evidence = readJson('tools/evidence.manifest.json');
  const scorecard = readJson('tools/scorecard.manifest.json');
  assert.deepEqual(evidence.requiredAxes, scorecard.axes.map((axis) => axis.id));
  assert.ok(evidence.proxyStatuses.includes('current-proxy'));
  assert.ok(evidence.proxyStatuses.includes('reroute-required'));
});

test('shared evidence sources have valid tiers and locations', () => {
  const evidence = readJson('tools/evidence.manifest.json');
  const sources = readJson('src/_data/shared/evidenceSources.json');
  for (const source of Object.values(sources)) {
    assert.ok(evidence.sourceTiers.includes(source.tier));
    assert.ok(source.url || source.path);
  }
});

