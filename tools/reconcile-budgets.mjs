#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const outPath = path.join(root, 'assets', 'budget-reconciliation.json');
const strict = process.argv.includes('--strict');
const results = [];

for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
  const mainPath = path.join(dataDir, entry.name, 'main.json');
  if (!entry.isDirectory() || !fs.existsSync(mainPath)) continue;
  const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
  const html = (main.parts || []).filter((part) => part.t === 'raw').map((part) => part.html || '').join('\n');
  const $ = load(html);
  const budget = main.scorecard?.budget;
  if (!budget) continue;
  const rows = [];
  let displayed = null;
  $('#totals tr').each((_, row) => {
    const cells = $(row).find('th,td').map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim()).get();
    if (cells.length < 2 || /^category$/i.test(cells[0])) return;
    const label = cells[0];
    const value = cells.slice(1).join(' ');
    const range = parseRange(value);
    if (!range) return;
    if (/grand\s+total|total\s+trip\s+cost/i.test(label) || $(row).hasClass('total')) {
      if (!displayed) displayed = { ...range, label, text: value };
      return;
    }
    if (/subtotal/i.test(label)) return;
    rows.push({ label, text: value, ...range });
  });

  const sumLow = rows.reduce((sum, row) => sum + row.lowUsd, 0);
  const sumHigh = rows.reduce((sum, row) => sum + row.highUsd, 0);
  const toleranceUsd = 150;
  const deltaLow = sumLow - budget.floorUsd;
  const deltaHigh = sumHigh - budget.ceilUsd;
  const displayedDeltaLow = displayed ? displayed.lowUsd - budget.floorUsd : null;
  const displayedDeltaHigh = displayed ? displayed.highUsd - budget.ceilUsd : null;
  const arithmetic = {
    lineItems: rows.length,
    sumLowUsd: roundHundred(sumLow),
    sumHighUsd: roundHundred(sumHigh),
    displayedLowUsd: displayed?.lowUsd ?? null,
    displayedHighUsd: displayed?.highUsd ?? null,
    deltaLowUsd: roundHundred(deltaLow),
    deltaHighUsd: roundHundred(deltaHigh),
    displayedDeltaLowUsd: displayedDeltaLow == null ? null : roundHundred(displayedDeltaLow),
    displayedDeltaHighUsd: displayedDeltaHigh == null ? null : roundHundred(displayedDeltaHigh),
    toleranceUsd,
  };
  const status = rows.length >= 3 && displayed && Math.abs(deltaLow) <= toleranceUsd && Math.abs(deltaHigh) <= toleranceUsd && Math.abs(displayedDeltaLow) <= toleranceUsd && Math.abs(displayedDeltaHigh) <= toleranceUsd
    ? 'matched' : 'needs-review';
  results.push({
    slug: entry.name,
    canonical: { lowUsd: budget.floorUsd, highUsd: budget.ceilUsd },
    status,
    arithmetic,
    lineItems: rows,
    note: status === 'matched'
      ? 'Line-item low/high sums and the displayed Grand Total agree with the canonical planning band within the rounding tolerance.'
      : 'The canonical planning band, displayed Grand Total, and line-item arithmetic disagree or are incomplete; re-price before treating it as quote-ready.',
  });
}

results.sort((a, b) => a.slug.localeCompare(b.slug));
fs.writeFileSync(outPath, `${JSON.stringify({ schemaVersion: 2, generatedAt: new Date().toISOString(), trips: results }, null, 2)}\n`);
const unresolved = results.filter((result) => result.status !== 'matched');
console.log(`reconciled ${results.length} budget records (${results.length - unresolved.length} matched, ${unresolved.length} explicitly needs review)`);
if (strict && unresolved.length) {
  console.error(unresolved.map((result) => `${result.slug}: ${JSON.stringify(result.arithmetic)}`).join('\n'));
  process.exit(1);
}

function parseRange(text) {
  const normalized = text.replace(/[–—]/g, '-').replace(/\u00a0/g, ' ');
  const amounts = [...normalized.matchAll(/(?:[$€£]\s*)?([\d][\d,.]*)(?:\s*(k))?/gi)]
    .map((match) => money(match[1], match[2]))
    .filter((value) => Number.isFinite(value));
  if (!amounts.length) return null;
  const low = amounts[0];
  const high = amounts.length > 1 ? amounts[1] : low;
  if (!Number.isFinite(low) || !Number.isFinite(high) || high < low) return null;
  return { lowUsd: low, highUsd: high };
}

function money(value, suffix) {
  const number = Number(String(value).replace(/,/g, ''));
  return suffix ? Math.round(number * 1000) : Math.round(number);
}

function roundHundred(value) { return Math.round(value / 100) * 100; }
