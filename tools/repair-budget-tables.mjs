#!/usr/bin/env node
import fs from 'node:fs';

const fixes = {
  portugal: { line: 'Food + activities — sum of the daily blocks above', value: '$1,700–2,300' },
  'greece-via-lisbon': { line: 'Food + activities — sum of daily blocks above', value: '$2,500–3,700' },
};

for (const [slug, fix] of Object.entries(fixes)) {
  const file = `src/_data/${slug}/main.json`;
  const main = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = false;
  for (const part of main.parts || []) {
    if (part.t !== 'raw' || !part.html.includes(fix.line)) continue;
    const before = part.html;
    part.html = part.html.replace(new RegExp(`${escapeRegExp(fix.line)}<\\/td><td>[^<]*<\\/td>`), `${fix.line}</td><td>${fix.value}</td>`);
    changed ||= before !== part.html;
  }
  if (!changed) throw new Error(`${slug}: could not locate implicit daily-block budget row`);
  fs.writeFileSync(file, `${JSON.stringify(main, null, 2)}\n`);
}

console.log(`made explicit budget rows for ${Object.keys(fixes).length} itineraries`);

function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
