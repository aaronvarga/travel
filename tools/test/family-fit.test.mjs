import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');

test('family profile preserves unknowns instead of inventing constraints', () => {
  const profile = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/decisionProfile.json'), 'utf8'));
  assert.equal(profile.familyProfile.status, 'incomplete');
  assert.ok(Object.values(profile.familyProfile.answers).every((answer) => answer === null));
  assert.match(profile.familyProfile.privacy, /local browser storage/i);
});

test('all trips expose canonical travel burden and explicit unknown family facts', () => {
  const dataDir = path.join(root, 'src/_data');
  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    const file = path.join(dataDir, entry.name, 'evidence.json');
    if (!entry.isDirectory() || !fs.existsSync(file)) continue;
    const evidence = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.ok(Number.isFinite(evidence.metrics.airHours));
    assert.ok(Number.isFinite(evidence.metrics.groundHours));
    assert.ok(['unknown', 'fits', 'does-not-fit', 'alternative-required'].includes(evidence.metrics.childActivityFit.age8));
    assert.ok(['unknown', 'fits', 'does-not-fit', 'alternative-required'].includes(evidence.metrics.childActivityFit.age13));
  }
});
