#!/usr/bin/env node
/**
 * seed-scorecard.mjs — one-time (idempotent) extractor.
 *
 * Parses the hand-authored scoreboard table in index.html and writes a
 * `scorecard` block into each src/_data/<slug>/main.json. Axis scores and
 * budget bands are transcribed verbatim from the baked table (no re-judging);
 * the PTO axis is derived from tools/scorecard.manifest.json ptoRubric.
 * Facets that are not present in the table come from the FACETS lookup below.
 *
 * Safe to re-run: it overwrites only the `scorecard` key.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'scorecard.manifest.json'), 'utf8'));
const ptoRubric = manifest.ptoRubric;
const { targetUsd, capUsd } = manifest.budgetTargets;

// scoreboard data-trip token -> directory slug
const SLUG = {
  portugal: 'portugal', 'portugal-crete': 'portugal-crete', 'madeira-crete': 'madeira-crete',
  'portugal-sicily': 'portugal-sicily', 'madeira-sicily': 'madeira-sicily', hawaii: 'hawaii',
  croatia: 'croatia', italy: 'italy-salento-amalfi', sardinia: 'sardinia-corsica',
  greece: 'greece-via-lisbon', turkey: 'turkish-riviera', sicily: 'sicily-malta',
  spain: 'spain', california: 'california-pacific-coast', southernfrance: 'southern-france',
  balkans: 'balkans',
};

// Non-tabular facets (judgement + card text). maxConnections = worst outbound legs.
const FACETS = {
  portugal:                 { continent: 'europe',        maxConnections: 1, swimTempF: [63, 70], noPassport: false, singleTicket: true },
  'portugal-crete':         { continent: 'europe',        maxConnections: 2, swimTempF: [73, 74], noPassport: false, singleTicket: true },
  'madeira-crete':          { continent: 'europe',        maxConnections: 3, swimTempF: [73, 74], noPassport: false, singleTicket: true },
  'portugal-sicily':        { continent: 'europe',        maxConnections: 2, swimTempF: [72, 75], noPassport: false, singleTicket: false },
  'madeira-sicily':         { continent: 'europe',        maxConnections: 3, swimTempF: [72, 75], noPassport: false, singleTicket: false },
  hawaii:                   { continent: 'pacific',       maxConnections: 2, swimTempF: [78, 80], noPassport: true,  singleTicket: true },
  croatia:                  { continent: 'europe',        maxConnections: 2, swimTempF: [71, 74], noPassport: false, singleTicket: true },
  'italy-salento-amalfi':   { continent: 'europe',        maxConnections: 2, swimTempF: [68, 74], noPassport: false, singleTicket: true },
  'sardinia-corsica':       { continent: 'europe',        maxConnections: 2, swimTempF: [72, 75], noPassport: false, singleTicket: false },
  'greece-via-lisbon':      { continent: 'europe',        maxConnections: 2, swimTempF: [72, 74], noPassport: false, singleTicket: true },
  'turkish-riviera':        { continent: 'europe',        maxConnections: 2, swimTempF: [75, 79], noPassport: false, singleTicket: true },
  'sicily-malta':           { continent: 'europe',        maxConnections: 2, swimTempF: [72, 75], noPassport: false, singleTicket: false },
  spain:                    { continent: 'europe',        maxConnections: 1, swimTempF: [68, 72], noPassport: false, singleTicket: true },
  'california-pacific-coast': { continent: 'north-america', maxConnections: 1, swimTempF: [64, 66], noPassport: true, singleTicket: true },
  'southern-france':        { continent: 'europe',        maxConnections: 1, swimTempF: [70, 70], noPassport: false, singleTicket: true },
  balkans:                  { continent: 'europe',        maxConnections: 2, swimTempF: [76, 79], noPassport: false, singleTicket: false },
};

const AXES = ['budget', 'weather', 'swim', 'variety', 'ease', 'food', 'risk'];

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const $ = cheerio.load(html);

const seeded = [];
$('.compare-table tbody tr').each((_, tr) => {
  const $tr = $(tr);
  const token = $tr.attr('data-trip');
  const slug = SLUG[token];
  if (!slug) throw new Error(`no slug mapping for data-trip="${token}"`);

  const displayName = $tr.find('th span').first().text().trim();
  const blurb = $tr.find('th small').first().text().trim();

  // All <b> in row order: [budget, weather, swim, variety, ease, food, risk, total]
  const bold = $tr.find('b').map((__, b) => parseInt($(b).text().trim(), 10)).get();
  if (bold.length !== 8) throw new Error(`${token}: expected 8 <b> values, got ${bold.length}`);
  const totalBaked = bold[7];

  const axes = {};
  AXES.forEach((a, i) => { axes[a] = bold[i]; });

  // Budget band text lives in the first <td>: "$7.5k-11.7k" (may be "... gated")
  const budgetText = $tr.find('td').first().text();
  const m = budgetText.match(/\$([\d.]+)k\s*[–\-]\s*([\d.]+)k/);
  if (!m) throw new Error(`${token}: cannot parse budget band from "${budgetText.trim()}"`);
  const floorUsd = Math.round(parseFloat(m[1]) * 1000);
  const ceilUsd = Math.round(parseFloat(m[2]) * 1000);

  // PTO cell: "8 PTO / 12 nights"
  const ptoText = $tr.find('td').filter((__, td) => /PTO\s*\//.test($(td).text())).first().text();
  const pm = ptoText.match(/(\d+)\s*PTO\s*\/\s*(\d+)\s*nights/);
  if (!pm) throw new Error(`${token}: cannot parse PTO from "${ptoText.trim()}"`);
  const ptoDays = parseInt(pm[1], 10);
  const nights = parseInt(pm[2], 10);
  axes.pto = ptoRubric[String(ptoDays)] ?? 3;

  const facets = { ...FACETS[slug], hasSwim: axes.swim >= 3 };
  const weightDefaults = Object.fromEntries(manifest.axes.map((x) => [x.id, x.weightDefault]));

  const scorecard = {
    displayName, blurb, axes, weightDefaults,
    budget: { floorUsd, ceilUsd, targetUsd, capUsd },
    pto: { days: ptoDays, nights },
    facets,
    totalBaked, // retained so verify-summary.mjs can prove lossless transcription
  };

  const mainPath = path.join(dataDir, slug, 'main.json');
  const main = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
  main.scorecard = scorecard;
  fs.writeFileSync(mainPath, JSON.stringify(main, null, 2) + '\n');
  seeded.push({ slug, total: totalBaked });
});

console.log(`seeded ${seeded.length} scorecards:`);
for (const s of seeded) console.log(`  ${s.slug.padEnd(24)} /40 = ${s.total}`);
if (seeded.length !== 16) throw new Error(`expected 16 trips, seeded ${seeded.length}`);
