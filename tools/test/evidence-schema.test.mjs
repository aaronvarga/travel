import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { deriveEvidenceConfidence, highConfidenceFactIssue } from '../lib/evidence-confidence.mjs';

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
    if (source.url) {
      assert.ok(source.publisher);
      assert.ok(source.scope);
    }
  }
});

test('confidence derives from cited facts and remains separate from route outcome', () => {
  const scorecard = { axes: [
    { id: 'risk', weightDefault: 1 },
    { id: 'pto', weightDefault: 0 },
  ] };
  const evidence = {
    facts: [
      { id: 'route', proxyStatus: 'reroute-required', confidence: 'high', sourceRefs: ['operator'] },
      { id: 'dates', proxyStatus: 'confirmed', confidence: 'medium', sourceRefs: ['internal'] },
    ],
    axes: {
      risk: { evidence: ['route'] },
      pto: { evidence: ['dates'] },
    },
  };
  assert.deepEqual(deriveEvidenceConfidence(evidence, scorecard), {
    axes: { risk: 'high', pto: 'medium' },
    overall: 'high',
  });
});

test('high-confidence proxies require a qualifying source tier', () => {
  const fact = { confidence: 'high', proxyStatus: 'current-proxy', sourceRefs: ['internal'] };
  assert.match(highConfidenceFactIssue(fact, { internal: { tier: 'internal-derived' } }), /requires an official/);
  assert.equal(highConfidenceFactIssue(fact, { internal: { tier: 'official' } }), null);
});
