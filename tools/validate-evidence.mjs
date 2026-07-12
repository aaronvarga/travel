#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { freshnessIssues, parseDate } from './lib/evidence-freshness.mjs';
import { deriveEvidenceConfidence, highConfidenceFactIssue } from './lib/evidence-confidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const manifest = readJson(path.join(root, 'tools', 'evidence.manifest.json'));
const scoreManifest = readJson(path.join(root, 'tools', 'scorecard.manifest.json'));
const profile = readJson(path.join(dataDir, 'decisionProfile.json'));
const sources = readJson(path.join(dataDir, 'shared', 'evidenceSources.json'));
const args = new Set(process.argv.slice(2));
const problems = [];

validateContract();
if (args.has('--schema-only')) finish('evidence contract');

const trips = discoverTrips();
if (args.has('--init')) initializeMissing(trips);
validateTrips(trips);
finish(`${trips.length} trip evidence records`);

function validateContract() {
  if (manifest.schemaVersion !== 1) issue('manifest', 'unsupported schemaVersion');
  const axes = scoreManifest.axes.map((axis) => axis.id);
  if (JSON.stringify(axes) !== JSON.stringify(manifest.requiredAxes)) {
    issue('manifest', 'requiredAxes must match scorecard axis order');
  }
  for (const [id, source] of Object.entries(sources)) {
    if (!manifest.sourceTiers.includes(source.tier)) issue(`source:${id}`, `unknown tier ${source.tier}`);
    if (!source.url && !source.path) issue(`source:${id}`, 'requires url or path');
    if (source.url && !source.scope) issue(`source:${id}`, 'external source requires a scope/limitation statement');
    if (source.url && !source.publisher) issue(`source:${id}`, 'external source requires a publisher');
  }
}

function discoverTrips() {
  return fs.readdirSync(dataDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dataDir, entry.name, 'main.json')))
    .map((entry) => ({
      slug: entry.name,
      dir: path.join(dataDir, entry.name),
      main: readJson(path.join(dataDir, entry.name, 'main.json')),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function initializeMissing(trips) {
  const travel = readTravelMetrics();
  for (const trip of trips) {
    const evidencePath = path.join(trip.dir, 'evidence.json');
    const variantsPath = path.join(trip.dir, 'variants.json');
    if (!fs.existsSync(evidencePath)) writeJson(evidencePath, seedEvidence(trip, travel[trip.slug]));
    if (!fs.existsSync(variantsPath)) writeJson(variantsPath, seedVariants(trip));
  }
}

function seedEvidence({ slug, main }, travel = {}) {
  const sc = main.scorecard;
  const window = profile.tripWindows[slug];
  const route = profile.routeReadiness[slug] || 'current-proxy';
  const routeConfidence = route === 'confirmed' ? 'high' : route === 'current-proxy' ? 'medium' : 'low';
  const factIds = {
    budget: 'budget-band', weather: 'climate-proxy', swim: 'swim-conditions',
    variety: 'itinerary-structure', ease: 'operational-load', food: 'family-food-coverage',
    risk: 'route-readiness', nights: 'trip-window', novelty: 'visited-overlap', pto: 'trip-window',
  };
  const axes = {};
  for (const axis of scoreManifest.axes) {
    axes[axis.id] = {
      score: sc.axes[axis.id],
      rationale: rationale(axis.id, sc.axes[axis.id], sc),
      confidence: ['nights', 'novelty', 'pto', 'variety'].includes(axis.id) ? 'high'
        : axis.id === 'risk' ? routeConfidence : 'medium',
      evidence: [factIds[axis.id]],
    };
  }
  return {
    schemaVersion: 1,
    slug,
    reviewedAt: '2026-07-09',
    overallConfidence: routeConfidence === 'low' ? 'low' : 'medium',
    axes,
    facts: [
      fact('budget-band', 'budget', 'current-proxy', 'medium', ['internal-itinerary'], {
        lowUsd: sc.budget.floorUsd,
        expectedUsd: null,
        highUsd: sc.budget.ceilUsd,
        targetUsd: profile.budget.targetUsd,
        preferredMaxUsd: profile.budget.preferredMaxUsd,
        distribution: 'planning-band',
      }, '2026-12-31'),
      fact('trip-window', 'dates', 'confirmed', 'high', ['decision-profile'], {
        depart: window?.[0] || null,
        return: window?.[1] || null,
        hotelNights: sc.pto.nights,
        ptoDays: sc.pto.days,
      }),
      fact('climate-proxy', 'climate', 'current-proxy', 'medium', [
        sc.facets.continent === 'north-america' || sc.facets.continent === 'pacific' ? 'noaa-climate' : 'copernicus-climate',
        'internal-itinerary',
      ], { score: sc.axes.weather }, '2027-04-01'),
      fact('swim-conditions', 'swim', 'current-proxy', 'medium', [
        'noaa-oisst', ...(sc.facets.continent === 'europe' ? ['eea-bathing-water'] : []), 'internal-itinerary',
      ], { score: sc.axes.swim, temperatureF: sc.facets.swimTempF, hasSwim: sc.facets.hasSwim }, '2027-05-15'),
      fact('itinerary-structure', 'itinerary', 'derived', 'high', ['internal-itinerary'], {
        score: sc.axes.variety,
        hotelNights: sc.pto.nights,
      }),
      fact('operational-load', 'logistics', 'current-proxy', 'medium', ['internal-itinerary', 'bts-ontime'], {
        easeScore: sc.axes.ease,
        maxConnections: sc.facets.maxConnections,
        singleTicket: sc.facets.singleTicket,
        airHours: numberOrNull(travel.airHours),
        groundHours: numberOrNull(travel.groundHours),
      }, '2027-02-01'),
      fact('family-food-coverage', 'food', 'current-proxy', 'medium', ['internal-itinerary'], {
        score: sc.axes.food,
        plainFoodRequired: true,
      }, '2027-04-01'),
      fact('route-readiness', 'route', route, routeConfidence, ['internal-itinerary', 'state-travel', 'cdc-travel'], {
        status: route,
        singleTicket: sc.facets.singleTicket,
        maxConnections: sc.facets.maxConnections,
      }, '2026-12-31'),
      fact('visited-overlap', 'novelty', 'derived', 'high', ['decision-profile', 'scorecard-contract'], {
        score: sc.axes.novelty,
      }),
    ],
    metrics: {
      airHours: numberOrNull(travel.airHours),
      groundHours: numberOrNull(travel.groundHours),
      timeZones: null,
      baseMoves: null,
      longestTransferHours: null,
      highOutputDayStreak: null,
      fallbackDays: null,
      childActivityFit: { age13: 'unknown', age8: 'unknown' },
      lodgingComfort: { airConditioning: 'unknown', kitchen: 'unknown', laundry: 'unknown', realBeds: 'unknown' },
      waterSafety: 'unknown',
      crowdingPressure: 'unknown',
      medicalAccess: 'unknown',
    },
  };
}

function seedVariants({ slug, main }) {
  const sc = main.scorecard;
  return {
    schemaVersion: 1,
    slug,
    canonicalId: 'canonical',
    variants: [{
      id: 'canonical',
      label: `${sc.pto.nights}-night canonical plan`,
      canonical: true,
      status: 'documented',
      nights: sc.pto.nights,
      ptoDays: sc.pto.days,
      budget: {
        lowUsd: sc.budget.floorUsd,
        expectedUsd: null,
        highUsd: sc.budget.ceilUsd,
        distribution: 'planning-band',
        chanceUnderPreferredMax: null,
      },
      removedExperiences: [],
      notes: 'The checked-in itinerary remains the immutable comparison baseline.',
    }],
    alternateStatus: 'not-yet-evidence-backed',
    alternateNotes: 'A shorter plan should be added only after route-specific savings and lost experiences are reconciled.',
  };
}

function fact(id, category, proxyStatus, confidence, sourceRefs, value, expiresAt = null) {
  return {
    id, category, proxyStatus, confidence, sourceRefs, value,
    verifiedAt: '2026-07-09',
    expiresAt,
  };
}

function rationale(id, score, sc) {
  const levels = {
    weather: ['conflicts with the core itinerary', 'has material disruption exposure', 'requires recurring weather management', 'is mostly comfortable with manageable exposure', 'is reliable for nearly every headline day'],
    swim: ['has no meaningful family swim', 'offers cold or occasional swimming', 'offers usable but limited or cool swimming', 'offers frequent comfortable swimming', 'offers frequent warm natural swimming'],
    variety: ['is one-note', 'is repetitive', 'has two strong modes', 'has three modes with one lighter', 'balances water, culture/towns, and nature'],
    ease: ['has very high deterministic logistics load', 'has high logistics load', 'has moderate logistics load', 'has relatively manageable logistics', 'has minimal logistics friction'],
    food: ['has poor family food coverage', 'has weak fallback coverage', 'has adequate fallback coverage', 'has strong destination and plain-food coverage', 'has exceptional appeal and fallback coverage'],
    risk: ['has critical unresolved disruption or safety exposure', 'has material unresolved exposure', 'has manageable uncertainty with mitigations', 'has low uncertainty', 'has very low uncertainty'],
    novelty: ['mostly repeats prior travel', 'substantially overlaps prior travel', 'mixes familiar and new places', 'is mostly new with a familiar element', 'is genuinely new'],
  };
  if (id === 'budget') return `The reconciled $${sc.budget.floorUsd.toLocaleString()}–$${sc.budget.ceilUsd.toLocaleString()} planning band scores ${score}/5 against the $12,000 target and $15,000 preferred maximum; cost never excludes the trip.`;
  if (id === 'nights') return `${sc.pto.nights} hotel nights derives a ${score}/5 score from the canonical nights rubric.`;
  if (id === 'pto') return `${sc.pto.days} PTO days derives a ${score}/5 slider score and has zero default weight.`;
  const description = levels[id]?.[score - 1] || `scores ${score}/5 under the canonical rubric`;
  return `The documented itinerary ${description} (${score}/5).`;
}

function readTravelMetrics() {
  const indexPath = path.join(root, 'index.html');
  if (!fs.existsSync(indexPath)) return {};
  const $ = load(fs.readFileSync(indexPath, 'utf8'));
  const tokenBySlug = Object.fromEntries(discoverTrips().map(({ slug, main }) => [slug, main.scorecard.displayName]));
  const summaryPath = path.join(root, 'assets', 'trips-summary.json');
  const summary = fs.existsSync(summaryPath) ? readJson(summaryPath) : { trips: [] };
  const byToken = Object.fromEntries(summary.trips.map((trip) => [trip.token, trip.slug]));
  const result = {};
  $('.compare-table tbody tr[data-trip]').each((_, row) => {
    const el = $(row);
    const slug = byToken[el.attr('data-trip')];
    if (slug) result[slug] = { airHours: +el.attr('data-plane'), groundHours: +el.attr('data-car') };
  });
  void tokenBySlug;
  return result;
}

function validateTrips(trips) {
  for (const trip of trips) {
    const evidencePath = path.join(trip.dir, 'evidence.json');
    const variantsPath = path.join(trip.dir, 'variants.json');
    if (!fs.existsSync(evidencePath)) { issue(trip.slug, 'missing evidence.json'); continue; }
    if (!fs.existsSync(variantsPath)) { issue(trip.slug, 'missing variants.json'); continue; }
    const evidence = readJson(evidencePath);
    const variants = readJson(variantsPath);
    if (evidence.schemaVersion !== manifest.schemaVersion || evidence.slug !== trip.slug) issue(trip.slug, 'invalid evidence identity');
    if (!manifest.confidenceLevels.includes(evidence.overallConfidence)) issue(trip.slug, 'invalid overallConfidence');
    const reviewedAt = parseDate(evidence.reviewedAt);
    if (!reviewedAt) issue(trip.slug, 'reviewedAt must be an ISO date');
    const facts = new Map();
    for (const item of evidence.facts || []) {
      if (facts.has(item.id)) issue(trip.slug, `duplicate fact ${item.id}`);
      facts.set(item.id, item);
      if (!manifest.requiredFactCategories.includes(item.category) && !manifest.volatileCategories.includes(item.category)) issue(trip.slug, `unknown fact category ${item.category}`);
      if (!manifest.proxyStatuses.includes(item.proxyStatus)) issue(trip.slug, `invalid proxy status ${item.proxyStatus}`);
      if (!manifest.confidenceLevels.includes(item.confidence)) issue(trip.slug, `invalid fact confidence ${item.confidence}`);
      for (const ref of item.sourceRefs || []) if (!sources[ref]) issue(trip.slug, `unknown source ${ref}`);
      const confidenceIssue = highConfidenceFactIssue(item, sources);
      if (confidenceIssue) issue(`${trip.slug}:${item.id}`, confidenceIssue);
      if (manifest.volatileCategories.includes(item.category) && (!item.verifiedAt || !item.expiresAt)) issue(trip.slug, `${item.id} needs verifiedAt/expiresAt`);
      const freshness = freshnessIssues(item, process.env.EVIDENCE_AS_OF ? new Date(`${process.env.EVIDENCE_AS_OF}T00:00:00Z`) : new Date());
      for (const problem of freshness) issue(`${trip.slug}:${item.id}`, problem);
      const verifiedAt = parseDate(item.verifiedAt);
      if (reviewedAt && verifiedAt && verifiedAt > reviewedAt) issue(`${trip.slug}:${item.id}`, 'verifiedAt cannot be later than the evidence review');
      for (const ref of item.sourceRefs || []) {
        const locator = item.sourceLocators?.[ref];
        if (!locator) issue(`${trip.slug}:${item.id}`, `missing source locator for ${ref}`);
        else if (locator.length < 24 || /not yet available|source locator required/i.test(locator)) {
          issue(`${trip.slug}:${item.id}`, `source locator for ${ref} is not specific enough`);
        }
      }
    }
    for (const category of manifest.requiredFactCategories) {
      if (![...facts.values()].some((item) => item.category === category)) issue(trip.slug, `missing ${category} fact`);
    }
    for (const axis of manifest.requiredAxes) {
      const record = evidence.axes?.[axis];
      if (!record) { issue(trip.slug, `missing ${axis} evidence`); continue; }
      if (record.score !== trip.main.scorecard.axes[axis]) issue(trip.slug, `${axis} evidence score drift`);
      if (!record.rationale || !manifest.confidenceLevels.includes(record.confidence)) issue(trip.slug, `invalid ${axis} rationale/confidence`);
      for (const id of record.evidence || []) if (!facts.has(id)) issue(trip.slug, `${axis} references missing fact ${id}`);
    }
    const derived = deriveEvidenceConfidence(evidence, scoreManifest);
    for (const [axis, confidence] of Object.entries(derived.axes)) {
      if (evidence.axes?.[axis]?.confidence !== confidence) {
        issue(trip.slug, `${axis} confidence must derive to ${confidence}, found ${evidence.axes?.[axis]?.confidence || 'missing'}`);
      }
    }
    if (evidence.overallConfidence !== derived.overall) {
      issue(trip.slug, `overallConfidence must derive to ${derived.overall}, found ${evidence.overallConfidence}`);
    }
    const routeFact = facts.get('route-readiness');
    const expectedRoute = profile.routeReadiness[trip.slug] || 'current-proxy';
    if (!routeFact) issue(trip.slug, 'missing route-readiness fact');
    else {
      if (routeFact.proxyStatus !== expectedRoute) issue(trip.slug, `route-readiness proxyStatus must be ${expectedRoute}`);
      if (routeFact.value?.status !== expectedRoute) issue(trip.slug, `route-readiness value.status must be ${expectedRoute}`);
      if (routeFact.value?.singleTicket !== trip.main.scorecard.facets.singleTicket) issue(trip.slug, 'route-readiness singleTicket drift');
      if (routeFact.value?.maxConnections !== trip.main.scorecard.facets.maxConnections) issue(trip.slug, 'route-readiness maxConnections drift');
    }
    const swimFact = facts.get('swim-conditions');
    if (JSON.stringify(swimFact?.value?.temperatureF) !== JSON.stringify(trip.main.scorecard.facets.swimTempF)) {
      issue(trip.slug, 'swim-conditions temperatureF must match scorecard facets.swimTempF');
    }
    const loadFact = facts.get('operational-load');
    if (loadFact?.value && 'singleTicket' in loadFact.value && loadFact.value.singleTicket !== trip.main.scorecard.facets.singleTicket) {
      issue(trip.slug, 'operational-load singleTicket drift');
    }
    if (loadFact?.value && 'maxConnections' in loadFact.value && loadFact.value.maxConnections !== trip.main.scorecard.facets.maxConnections) {
      issue(trip.slug, 'operational-load maxConnections drift');
    }
    for (const [metric, unit] of Object.entries(manifest.metricUnits)) {
      const value = evidence.metrics?.[metric];
      if (value != null && !Number.isFinite(value)) issue(trip.slug, `${metric} must be numeric or null (${unit})`);
    }
    const canonical = variants.variants?.find((variant) => variant.id === variants.canonicalId);
    if (!canonical?.canonical) issue(trip.slug, 'missing canonical variant');
    if (canonical && (canonical.nights !== trip.main.scorecard.pto.nights || canonical.ptoDays !== trip.main.scorecard.pto.days)) issue(trip.slug, 'canonical variant drift');
  }
  if (trips.length !== 29) issue("all", `expected 29 trips, found ${trips.length}`);
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  console.log(`created ${path.relative(root, file)}`);
}

function issue(scope, message) {
  problems.push(`${scope}: ${message}`);
}

function finish(label) {
  if (problems.length) {
    console.error('Evidence validation failed:');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(`validated ${label}`);
  process.exit(0);
}
