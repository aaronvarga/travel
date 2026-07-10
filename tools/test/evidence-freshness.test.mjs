import assert from 'node:assert/strict';
import test from 'node:test';
import { freshnessIssues } from '../lib/evidence-freshness.mjs';

test('freshness rejects expired or inverted evidence windows', () => {
  const now = new Date('2026-07-10T00:00:00Z');
  assert.ok(freshnessIssues({ verifiedAt: '2026-01-01', expiresAt: '2026-07-09' }, now).some((issue) => issue.includes('expired')));
  assert.ok(freshnessIssues({ verifiedAt: '2026-08-01', expiresAt: '2026-07-01' }, now).some((issue) => issue.includes('on or after')));
  assert.deepEqual(freshnessIssues({ verifiedAt: '2026-07-01', expiresAt: '2026-12-31' }, now), []);
});
