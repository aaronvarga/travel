#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dataDir = path.join(root, 'src', '_data');
const fire = readJson(path.join(dataDir, 'fireRisk.json'));
const manifest = readJson(path.join(root, 'tools', 'scorecard.manifest.json'));
const defaultWeights = Object.fromEntries(manifest.axes.map(({ id, weightDefault }) => [id, weightDefault]));
const chanceByScore = {
  5: { chanceBand: '<2%', level: 'Very low' },
  4: { chanceBand: '2–5%', level: 'Low' },
  3: { chanceBand: '5–10%', level: 'Moderate' },
  2: { chanceBand: '10–20%', level: 'High' },
  1: { chanceBand: '>20%', level: 'Very high' },
};

const trips = [];
for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
  const mainPath = path.join(dataDir, entry.name, 'main.json');
  const evidencePath = path.join(dataDir, entry.name, 'evidence.json');
  if (!entry.isDirectory() || !fs.existsSync(mainPath) || !fs.existsSync(evidencePath)) continue;
  const profileIds = fire.tripProfiles[entry.name];
  if (!profileIds?.length) throw new Error(`${entry.name}: missing fire-risk profile mapping`);
  const profiles = profileIds.map((id) => {
    if (!fire.profiles[id]) throw new Error(`${entry.name}: unknown fire-risk profile ${id}`);
    return { id, ...fire.profiles[id] };
  });
  const score = Math.min(...profiles.map((profile) => profile.score));
  const main = readJson(mainPath);
  const evidence = readJson(evidencePath);
  const oldTotal = main.scorecard.totalBaked;

  main.scorecard.axes = insertAfter(main.scorecard.axes, 'weather', 'fireRisk', score);
  main.scorecard.weightDefaults = { ...defaultWeights };
  main.scorecard.totalBaked = manifest.axes.reduce(
    (sum, axis) => sum + main.scorecard.axes[axis.id] * axis.weightDefault,
    0,
  );

  const sourceRefs = [...new Set(profiles.flatMap((profile) => profile.sourceRefs))];
  const sourceLocators = Object.assign({}, ...profiles.map((profile) => profile.sourceLocators));
  const routeNames = profiles.map((profile) => profile.name);
  const limiting = profiles.filter((profile) => profile.score === score);
  const summary = limiting.length === 1
    ? limiting[0].rationale
    : `The route's most exposed profiles are ${limiting.map((profile) => profile.name).join(' and ')}. ${limiting.map((profile) => profile.rationale).join(' ')}`;
  evidence.axes = insertAfter(evidence.axes, 'weather', 'fireRisk', {
    score,
    rationale: `${chanceByScore[score].level} is the safety rating (${score}/5), corresponding to a ${chanceByScore[score].chanceBand} planning chance of material wildfire disruption during the exact trip window. ${summary}`,
    confidence: 'medium',
    evidence: ['wildfire-exposure'],
  });
  evidence.facts = (evidence.facts || []).filter((fact) => fact.id !== 'wildfire-exposure');
  evidence.facts.push({
    id: 'wildfire-exposure',
    category: 'wildfire',
    proxyStatus: 'current-proxy',
    confidence: 'medium',
    sourceRefs,
    value: {
      score,
      level: chanceByScore[score].level,
      chanceBand: chanceByScore[score].chanceBand,
      outcome: fire.methodology.outcome,
      estimateType: fire.methodology.estimateType,
      routeProfiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        score: profile.score,
        level: chanceByScore[profile.score].level,
        chanceBand: chanceByScore[profile.score].chanceBand,
        rationale: profile.rationale,
      })),
      routeNames,
      aggregation: fire.methodology.aggregation,
      monitoring: fire.methodology.monitoring,
    },
    verifiedAt: fire.reviewedAt,
    expiresAt: '2027-05-15',
    sourceLocators,
    claimType: 'inference',
  });
  evidence.reviewedAt = maxIso(evidence.reviewedAt, fire.reviewedAt);

  replaceScoreCitations(main, oldTotal, main.scorecard.totalBaked);
  writeJson(mainPath, main);
  writeJson(evidencePath, evidence);
  trips.push({ slug: entry.name, main });
}

const ranked = trips
  .filter(({ main }) => main.tripCategory !== 'short' && typeof main.excluded !== 'string')
  .sort(compareDefault);
const rankBySlug = new Map(ranked.map(({ slug }, index) => [slug, index + 1]));
for (const { slug, main } of trips) {
  if (!rankBySlug.has(slug)) continue;
  walkStrings(main, (value) => value.replace(/#\d+ of \d+/g, `#${rankBySlug.get(slug)} of ${ranked.length}`));
  writeJson(path.join(dataDir, slug, 'main.json'), main);
}

console.log(`applied wildfire evidence and /55 scores to ${trips.length} trips`);

function insertAfter(object, afterKey, key, value) {
  const result = {};
  for (const [id, current] of Object.entries(object || {})) {
    if (id === key) continue;
    result[id] = current;
    if (id === afterKey) result[key] = value;
  }
  if (!(key in result)) result[key] = value;
  return result;
}

function replaceScoreCitations(value, oldTotal, newTotal) {
  walkStrings(value, (text) => text.replace(new RegExp(`\\b${oldTotal}\\/50\\b`, 'g'), `${newTotal}/55`));
}

function walkStrings(value, replace) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (typeof value[index] === 'string') value[index] = replace(value[index]);
      else if (value[index] && typeof value[index] === 'object') walkStrings(value[index], replace);
    }
    return;
  }
  for (const [key, current] of Object.entries(value || {})) {
    if (typeof current === 'string') value[key] = replace(current);
    else if (current && typeof current === 'object') walkStrings(current, replace);
  }
}

function compareDefault(a, b) {
  const total = (trip) => manifest.axes.reduce(
    (sum, axis) => sum + trip.main.scorecard.axes[axis.id] * axis.weightDefault,
    0,
  );
  const delta = total(b) - total(a);
  if (delta) return delta;
  const aSc = a.main.scorecard;
  const bSc = b.main.scorecard;
  const aCap = aSc.budget.ceilUsd > aSc.budget.preferredMaxUsd ? 1 : 0;
  const bCap = bSc.budget.ceilUsd > bSc.budget.preferredMaxUsd ? 1 : 0;
  return aCap - bCap
    || aSc.pto.days - bSc.pto.days
    || aSc.budget.ceilUsd - bSc.budget.ceilUsd
    || aSc.budget.floorUsd - bSc.budget.floorUsd
    || a.slug.localeCompare(b.slug);
}

function maxIso(a, b) { return !a || a < b ? b : a; }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
