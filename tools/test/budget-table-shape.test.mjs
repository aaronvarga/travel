import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { load } from 'cheerio';

const root = path.resolve(import.meta.dirname, '../..');
const dataDir = path.join(root, 'src', '_data');

test('every totals table preserves its two-column contract', () => {
  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    const file = path.join(dataDir, entry.name, 'main.json');
    if (!entry.isDirectory() || !fs.existsSync(file)) continue;
    const main = JSON.parse(fs.readFileSync(file, 'utf8'));
    const totalsParts = (main.parts || []).filter((part) => part.html?.includes('id="totals"'));
    assert.ok(totalsParts.length > 0, `${entry.name}: missing totals section`);
    for (const part of totalsParts) {
      const $ = load(part.html);
      $('#totals tr').each((index, row) => {
        assert.equal($(row).find('th,td').length, 2, `${entry.name}: totals row ${index + 1} must have two cells`);
      });
    }
  }
});
