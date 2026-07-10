import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');

test('canonical variants remain the checked-in itinerary baseline', () => {
  const dataDir = path.join(root, 'src', '_data');
  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    const mainPath = path.join(dataDir, entry.name, 'main.json');
    if (!entry.isDirectory() || !fs.existsSync(mainPath)) continue;
    const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
    const variants = JSON.parse(fs.readFileSync(path.join(dataDir, entry.name, 'variants.json'), 'utf8'));
    const canonical = variants.variants.find((variant) => variant.id === variants.canonicalId);
    assert.equal(canonical.nights, main.scorecard.pto.nights);
    assert.equal(canonical.ptoDays, main.scorecard.pto.days);
    assert.equal(canonical.budget.lowUsd, main.scorecard.budget.floorUsd);
    assert.equal(canonical.budget.highUsd, main.scorecard.budget.ceilUsd);
  }
});

test('the Italy shorter variant does not overwrite the canonical plan', () => {
  const variants = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/italy-salento-amalfi/variants.json'), 'utf8'));
  const canonical = variants.variants.find((variant) => variant.id === 'canonical');
  const shorter = variants.variants.find((variant) => variant.id === 'preference-fit-11n');
  assert.equal(canonical.nights, 12);
  assert.equal(shorter.nights, 11);
  assert.ok(shorter.budget.highUsd <= 15000);
  assert.notDeepEqual(shorter, canonical);
});

