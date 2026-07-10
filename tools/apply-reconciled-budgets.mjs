#!/usr/bin/env node
import fs from 'node:fs';

const corrections = {
  croatia: { lowUsd: 8400, highUsd: 12800, total: '~$8.4k–12.8k' },
  'italy-salento-amalfi': { lowUsd: 11400, highUsd: 16300, total: '~$11.4k–16.3k realistic · preference-fit trim ~$12.4k–14.8k' },
  'sardinia-corsica': { lowUsd: 10700, highUsd: 16500, total: '~$10.7k–16.5k preference-fit · stress ~$16.5k' },
  'southern-france': { lowUsd: 9600, highUsd: 14900, total: '~$9.6k–14.9k · stress case ~$15,000' },
};

for (const [slug, correction] of Object.entries(corrections)) {
  const file = `src/_data/${slug}/main.json`;
  const main = JSON.parse(fs.readFileSync(file, 'utf8'));
  main.scorecard.budget.floorUsd = correction.lowUsd;
  main.scorecard.budget.ceilUsd = correction.highUsd;
  const canonical = main.scorecard.axes.budget;
  main.scorecard.totalBaked = main.scorecard.axes.budget * 2
    + Object.entries(main.scorecard.axes).filter(([axis]) => axis !== 'budget' && axis !== 'pto').reduce((sum, [, score]) => sum + score, 0);
  for (const part of main.parts || []) {
    if (part.t !== 'raw') continue;
    const start = part.html.indexOf('id="totals"');
    if (start < 0) continue;
    const before = part.html;
    const head = part.html.slice(0, start);
    const tail = part.html.slice(start).replace(/(<td>Grand total[^<]*<\/td><td>)(.*?)(<\/td>)/, (_match, prefix, _old, suffix) => `${prefix}${correction.total}${suffix}`);
    part.html = head + tail;
    if (before !== part.html) break;
  }
  const variantsPath = `src/_data/${slug}/variants.json`;
  if (fs.existsSync(variantsPath)) {
    const variants = JSON.parse(fs.readFileSync(variantsPath, 'utf8'));
    const variant = variants.variants.find((item) => item.id === variants.canonicalId);
    if (variant) { variant.budget.lowUsd = correction.lowUsd; variant.budget.highUsd = correction.highUsd; }
    fs.writeFileSync(variantsPath, `${JSON.stringify(variants, null, 2)}\n`);
  }
  void canonical;
  fs.writeFileSync(file, `${JSON.stringify(main, null, 2)}\n`);
}

console.log(`applied reconciled canonical budgets to ${Object.keys(corrections).length} itineraries`);
