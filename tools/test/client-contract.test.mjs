import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('board publishes evidence sources required by the evidence drawer', () => {
  const board = fs.readFileSync('assets/js/board.js', 'utf8');
  assert.match(board, /B\.evidenceSources = data\.evidenceSources/);
  const evidence = fs.readFileSync('assets/js/evidence.js', 'utf8');
  assert.match(evidence, /B\.evidenceSources\?\.\[sourceId\]/);
});

test('filter count uses active variant records', () => {
  const filters = fs.readFileSync('assets/js/filters.js', 'utf8');
  assert.match(filters, /B\.currentBySlug\[trip\.slug\] \|\| trip/);
});
