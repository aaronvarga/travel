#!/usr/bin/env node
// One-off, data-driven application of the 2026-11-03 live four-passenger flight
// refresh (tools/flight-refresh-2026-11-03.json). Reads the CURRENT checked-in
// JSON (never a baseline commit) and only touches flight lines and the totals
// they drive. Run tools/sync-full-flight-audit.mjs and sync-score-citations.mjs after.
// Applied once on 2026-11-03, followed by apply-2026-11-03-route-fixes.mjs and one-off
// session scripts that synced #air-travel blocks, TL;DR route status, air allowances,
// superseded fare prose, singleTicket facets and rerankingAudit.json. Not idempotent.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import points from './lib/points-budget.cjs';
import { deriveEvidenceConfidence } from './lib/evidence-confidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const refresh = readJson(path.join(root, 'tools', 'flight-refresh-2026-11-03.json'));
const manifest = readJson(path.join(root, 'tools', 'scorecard.manifest.json'));
const auditPath = path.join(dataDir, 'flightAudits.json');
const audit = readJson(auditPath);
const pointsPath = path.join(dataDir, 'capitalOnePoints.json');
const pointsData = readJson(pointsPath);
const sourcesPath = path.join(dataDir, 'shared', 'evidenceSources.json');
const sources = readJson(sourcesPath);
const profilePath = path.join(dataDir, 'decisionProfile.json');
const profile = readJson(profilePath);
const { reviewedAt, expiresAt, sourceId } = refresh;
const money = (n) => `$${n.toLocaleString('en-US')}`;
const band = (l, h) => `${money(l)}–${money(h)}`;

sources[sourceId] = refresh.source;
audit.fullTripsReviewedAt = reviewedAt;
audit.fullTripsExpiresAt = expiresAt;
audit.reviewedAt = reviewedAt;
audit.sourceId = sourceId;
audit.source = refresh.source.label;

const log = [];
const staged = []; // write nothing until every trip applies cleanly
for (const [slug, t] of Object.entries(refresh.trips)) {
  const mainPath = path.join(dataDir, slug, 'main.json');
  const evidencePath = path.join(dataDir, slug, 'evidence.json');
  const variantsPath = path.join(dataDir, slug, 'variants.json');
  const main = readJson(mainPath);
  const evidence = readJson(evidencePath);
  const variants = readJson(variantsPath);
  const sc = main.scorecard;
  const isShort = main.tripCategory === 'short';
  const usesPoints = sc.budget.basis === 'fixed-value-travel';
  const before = { total: sc.totalBaked, floor: sc.budget.floorUsd, ceil: sc.budget.ceilUsd, axes: { ...sc.axes } };

  const prior = audit.trips[slug] || {};
  audit.trips[slug] = { ...prior, status: t.status, headline: t.headline, detail: t.detail, reviewedAt };
  if (t.airfareFact) audit.trips[slug].airfareFact = t.airfareFact;

  // 1. Flight rows in the rerank-format itemized tables (#budget and #totals carry the same table).
  if (t.rows?.length) {
    if (!usesPoints) throw new Error(`${slug}: row mode is only for itemized points-format tables; use replacements`);
    let delta = [0, 0];
    let counted = false;
    for (const part of main.parts) {
      if (part.t !== 'raw') continue;
      for (const id of ['budget', 'totals']) {
        part.html = part.html.replace(new RegExp(`<section\\b[^>]*id="${id}"[\\s\\S]*?<\\/section>`), (section) => {
          let d = [0, 0];
          for (const row of t.rows) {
            const re = new RegExp(`(<tr><td>)(${esc(row.match)}[^<]*)(</td><td>)\\$([\\d,]+)–\\$([\\d,]+)(</td></tr>)`);
            const m = section.match(re);
            if (!m) throw new Error(`${slug}#${id}: no row matching ${row.match}`);
            const [oldLow, oldHigh] = [num(m[4]), num(m[5])];
            d = [d[0] + row.low - oldLow, d[1] + row.high - oldHigh];
            section = section.replace(re, (_, a, label, c, _l, _h, e) => `${a}${row.label ?? label}${c}${band(row.low, row.high)}${e}`);
          }
          if (!counted) { delta = d; counted = true; }
          return section;
        });
      }
    }
    if (!counted) throw new Error(`${slug}: no budget/totals section found`);
    const gross = { floorUsd: sc.budget.grossFloorUsd + delta[0], ceilUsd: sc.budget.grossCeilUsd + delta[1] };
    const oldGross = band(sc.budget.grossFloorUsd, sc.budget.grossCeilUsd);
    const oldNet = band(sc.budget.floorUsd, sc.budget.ceilUsd);
    Object.assign(sc.budget, points.fixedValuePlan(gross, refresh.minEligibleAirUsd, pointsData.balance));
    const newGross = band(gross.floorUsd, gross.ceilUsd);
    const newNet = band(sc.budget.floorUsd, sc.budget.ceilUsd);
    main.parts = replaceAll(main.parts, oldGross, newGross);
    main.parts = replaceAll(main.parts, oldNet, newNet);
    const plan = pointsData.plans[slug];
    if (plan) {
      plan.grossCashRangeUsd = [gross.floorUsd, gross.ceilUsd];
      plan.netCashRangeUsd = [sc.budget.floorUsd, sc.budget.ceilUsd];
      plan.cashPlan.tripRangeUsd = [gross.floorUsd, gross.ceilUsd];
      plan.cashAirfareRangeUsd = plan.cashAirfareRangeUsd.map((v, i) => v + delta[i]); // every row is an air line
      plan.remainingCashAirfareUsd = plan.cashAirfareRangeUsd.map((v) => v - plan.savingsUsd);
    }
  }

  // 2. Legacy/short tables: exact row rewrites inside #budget/#totals, then reviewed prose pairs.
  for (const [label, from, to, newLabel] of t.cells || []) {
    // Legacy totals rows may carry class="total" and/or <b>-wrapped cells; keep that markup.
    const cell = (v) => `<td>(<b>)?${esc(v)}(?:</b>)?</td>`;
    const re = new RegExp(`<tr([^>]*)>${cell(label)}${from.map(cell).join('')}`, 'g');
    const html = (attrs, bold) => { const w = (v) => (bold ? `<b>${v}</b>` : v); return `<tr${attrs}><td>${w(newLabel ?? label)}</td>${to.map((v) => `<td>${w(v)}</td>`).join('')}`; };
    let hits = 0;
    for (const part of main.parts) {
      if (part.t !== 'raw') continue;
      part.html = part.html.replace(/<section\b[^>]*id="(?:budget|totals)"[\s\S]*?<\/section>/g, (section) => section.replace(re, (_, attrs, bold) => { hits += 1; return html(attrs, bold); }));
    }
    if (!hits) throw new Error(`${slug}: no table row ${label} = ${from.join(' / ')}`);
  }
  for (const [from, to] of t.replacements || []) {
    const keys = ['parts', 'itinerary', 'preDepartureTodos'].filter((k) => main[k]);
    const hits = keys.reduce((n, k) => n + JSON.stringify(main[k]).split(JSON.stringify(from).slice(1, -1)).length - 1, 0);
    if (!hits) throw new Error(`${slug}: replacement source absent: ${from}`);
    for (const k of keys) main[k] = replaceAll(main[k], from, to);
  }
  if (t.budget) [sc.budget.floorUsd, sc.budget.ceilUsd] = t.budget;

  // 3. Scores: budget axis follows the shared rubric whenever the band moved.
  const bandMoved = sc.budget.floorUsd !== before.floor || sc.budget.ceilUsd !== before.ceil;
  if (bandMoved) sc.axes.budget = points.budgetScore(sc.budget, 'medium');
  Object.assign(sc.axes, t.axes || {});
  sc.totalBaked = manifest.axes.reduce((s, a) => s + sc.axes[a.id] * a.weightDefault, 0);
  if (sc.axes.budget !== before.axes.budget) main.parts = replaceAll(main.parts, `Budget ${before.axes.budget}/5 uses the net range`, `Budget ${sc.axes.budget}/5 uses the net range`);

  // 4. Evidence: the budget band is re-verified against today's fares whether or not it moved.
  const bf = evidence.facts.find((f) => f.id === 'budget-band');
  if (!bf) throw new Error(`${slug}: missing budget-band fact`);
  bf.value = { ...bf.value, lowUsd: sc.budget.floorUsd, highUsd: sc.budget.ceilUsd };
  if (usesPoints) Object.assign(bf.value, { grossLowUsd: sc.budget.grossFloorUsd, grossHighUsd: sc.budget.grossCeilUsd });
  if (bandMoved) bf.value.arithmetic = `${bf.value.arithmetic ?? ''} | ${reviewedAt}: flight lines repriced, band ${band(before.floor, before.ceil)} -> ${band(sc.budget.floorUsd, sc.budget.ceilUsd)}`.replace(/^ \| /, '');
  bf.verifiedAt = reviewedAt;
  bf.expiresAt = expiresAt;
  bf.sourceRefs = unique([...(bf.sourceRefs || []), sourceId]);
  bf.sourceLocators = { ...(bf.sourceLocators || {}), [sourceId]: t.detail };
  if (isShort) {
    const rf = evidence.facts.find((f) => f.id === 'route-readiness');
    if (!rf) throw new Error(`${slug}: missing route-readiness fact`);
    rf.verifiedAt = reviewedAt;
    rf.expiresAt = expiresAt;
    rf.proxyStatus = t.status;
    rf.sourceRefs = unique([...(rf.sourceRefs || []), sourceId]);
    rf.sourceLocators = { ...(rf.sourceLocators || {}), [sourceId]: t.detail };
    rf.value = { ...rf.value, status: t.status, currentFlightAudit: t.detail, exact2027FlightsVerified: t.status === 'confirmed' };
    profile.routeReadiness[slug] = t.status;
  }
  for (const id of t.refreshFacts || []) {
      const f = evidence.facts.find((x) => x.id === id);
      if (!f) throw new Error(`${slug}: missing ${id}`);
      f.verifiedAt = reviewedAt;
      f.expiresAt = expiresAt;
      f.sourceRefs = unique([...(f.sourceRefs || []), sourceId]);
      f.sourceLocators = { ...(f.sourceLocators || {}), [sourceId]: t.detail };
  }
  if (t.routeFactValue) Object.assign(evidence.facts.find((f) => f.id === 'route-readiness').value, t.routeFactValue);
  evidence.axes.budget.score = sc.axes.budget;
  if (bandMoved) evidence.axes.budget.rationale = `${t.budgetNote ?? ''} The ${reviewedAt} four-passenger flight refresh moves the planning band to ${band(sc.budget.floorUsd, sc.budget.ceilUsd)}${usesPoints ? ` net (${band(sc.budget.grossFloorUsd, sc.budget.grossCeilUsd)} gross)` : ''}. Budget ${sc.axes.budget}/5 follows the shared rubric; fares are aggregator snapshots, not held tickets.`.trim();
  for (const [axis, score] of Object.entries(t.axes || {})) {
    evidence.axes[axis].score = score;
    if (t.axisRationale?.[axis]) evidence.axes[axis].rationale = t.axisRationale[axis];
  }
  evidence.reviewedAt = reviewedAt;
  if (evidence.axes && !isShort) {
    const confidence = deriveEvidenceConfidence(evidence, manifest);
    for (const [axis, value] of Object.entries(confidence.axes)) evidence.axes[axis].confidence = value;
    evidence.overallConfidence = confidence.overall;
  }

  const canonical = variants.variants.find((v) => v.canonical || v.id === variants.canonicalId);
  if (!canonical) throw new Error(`${slug}: canonical variant not found`);
  canonical.budget = { ...canonical.budget, lowUsd: sc.budget.floorUsd, highUsd: sc.budget.ceilUsd };
  if (usesPoints) Object.assign(canonical.budget, { grossLowUsd: sc.budget.grossFloorUsd, grossHighUsd: sc.budget.grossCeilUsd });

  staged.push([mainPath, main], [evidencePath, evidence], [variantsPath, variants]);
  log.push(`${slug}: ${before.total}->${sc.totalBaked} ${band(before.floor, before.ceil)} -> ${band(sc.budget.floorUsd, sc.budget.ceilUsd)} axes ${JSON.stringify(diff(before.axes, sc.axes))}`);
}

for (const [file, value] of staged) writeJson(file, value);
writeJson(auditPath, audit);
writeJson(pointsPath, pointsData);
writeJson(sourcesPath, sources);
writeJson(profilePath, profile);
console.log(log.join('\n'));

function num(s) { return Number(s.replaceAll(',', '')); }
function diff(a, b) { return Object.fromEntries(Object.keys(b).filter((k) => a[k] !== b[k]).map((k) => [k, `${a[k]}->${b[k]}`])); }
function replaceAll(value, from, to) {
  if (typeof value === 'string') return value.split(from).join(to);
  if (Array.isArray(value)) return value.map((v) => replaceAll(v, from, to));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceAll(v, from, to)]));
  return value;
}
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function unique(values) { return [...new Set(values)]; }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
