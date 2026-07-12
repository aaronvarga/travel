import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const dataDir = path.join(root, 'src', '_data');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'evidence.manifest.json'), 'utf8'));

test('all 27 trips have evidence and canonical variants', () => {
  const slugs = fs.readdirSync(dataDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dataDir, entry.name, 'main.json')))
    .map((entry) => entry.name);
  assert.equal(slugs.length, 28);
  for (const slug of slugs) {
    const main = read(slug, 'main.json');
    const evidence = read(slug, 'evidence.json');
    const variants = read(slug, 'variants.json');
    assert.equal(evidence.slug, slug);
    assert.deepEqual(Object.keys(evidence.axes), contract.requiredAxes);
    for (const axis of contract.requiredAxes) {
      assert.equal(evidence.axes[axis].score, main.scorecard.axes[axis]);
      assert.ok(evidence.axes[axis].rationale);
      assert.ok(evidence.axes[axis].evidence.length > 0);
    }
    const canonical = variants.variants.find((variant) => variant.id === variants.canonicalId);
    assert.equal(canonical.canonical, true);
    assert.equal(canonical.nights, main.scorecard.pto.nights);
  }
});

function read(slug, file) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, slug, file), 'utf8'));
}
