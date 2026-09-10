#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', '_data');
const audit = readJson(path.join(dataDir, 'flightAudits.json'));
const profilePath = path.join(dataDir, 'decisionProfile.json');
const profile = readJson(profilePath);
const sourceId = 'google-flights-2027-current-audit';
const reviewedAt = audit.fullTripsReviewedAt;
const expiresAt = audit.fullTripsExpiresAt;

if (!reviewedAt || !expiresAt) throw new Error('flightAudits.json must define fullTripsReviewedAt and fullTripsExpiresAt');

const staged = [];
for (const [slug, flight] of Object.entries(audit.trips)) {
  const mainPath = path.join(dataDir, slug, 'main.json');
  const evidencePath = path.join(dataDir, slug, 'evidence.json');
  if (!fs.existsSync(mainPath) || !fs.existsSync(evidencePath)) continue;

  const main = readJson(mainPath);
  if (main.tripCategory === 'short') continue;
  const evidence = readJson(evidencePath);
  const routeFact = evidence.facts.find((fact) => fact.id === 'route-readiness');
  if (!routeFact) throw new Error(`${slug}: missing route-readiness fact`);

  routeFact.proxyStatus = flight.status;
  routeFact.confidence = 'high';
  routeFact.sourceRefs = unique([...(routeFact.sourceRefs || []), sourceId]);
  routeFact.value = {
    ...routeFact.value,
    status: flight.status,
    currentFlightAudit: flight.detail,
    exact2027FlightsVerified: flight.status === 'confirmed',
    june2027Verified: flight.status === 'confirmed',
  };
  routeFact.verifiedAt = reviewedAt;
  routeFact.expiresAt = expiresAt;
  routeFact.sourceLocators = { ...(routeFact.sourceLocators || {}), [sourceId]: flight.detail };

  // Any planning fact that already cites the central audit should carry the
  // same observation window and locator. This keeps budget bands that depend
  // on airfare from claiming an older quote after the route audit is refreshed.
  for (const fact of evidence.facts) {
    if (!(fact.sourceRefs || []).includes(sourceId)) continue;
    fact.verifiedAt = reviewedAt;
    fact.expiresAt = expiresAt;
    fact.sourceLocators = { ...(fact.sourceLocators || {}), [sourceId]: flight.detail };
  }

  if (slug === 'iceland-ischia-cilento') {
    const airfareFact = evidence.facts.find((fact) => fact.id === 'airfare-proxy');
    if (!airfareFact) throw new Error(`${slug}: missing airfare-proxy fact`);
    airfareFact.proxyStatus = 'reroute-required';
    airfareFact.confidence = 'high';
    airfareFact.sourceRefs = [sourceId];
    airfareFact.value = {
      pitKefRoundTripPerPersonUsd: 663,
      kefFcoOneWayPerPersonUsd: 241,
      exactTripQuoteObserved: true,
      assumedIcelandairStopoverAvailable: false,
      routeConclusion: 'The exact dates require connections on both PIT–KEF and KEF–FCO; rebuild the air stack.',
    };
    airfareFact.verifiedAt = reviewedAt;
    airfareFact.expiresAt = expiresAt;
    airfareFact.sourceLocators = { [sourceId]: flight.detail };
  }

  evidence.reviewedAt = reviewedAt;
  evidence.axes.risk.evidence = unique([...(evidence.axes.risk.evidence || []), 'route-readiness']);
  evidence.flightAudit = { reviewedAt, status: flight.status, headline: flight.headline };
  profile.routeReadiness[slug] = flight.status;

  injectFlightCallout(main, flight, reviewedAt);
  staged.push({ mainPath, main, evidencePath, evidence });
}

for (const item of staged) {
  writeJson(item.mainPath, item.main);
  writeJson(item.evidencePath, item.evidence);
}
writeJson(profilePath, profile);
console.log(`synchronized ${staged.length} full-itinerary flight audits reviewed ${reviewedAt}`);

function injectFlightCallout(main, flight, date) {
  const displayDate = new Intl.DateTimeFormat('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
  const callout = `<article class="current-flight-callout" data-flight-audit="${date}"><span>Current flight check · ${displayDate}</span><strong>${escapeHtml(flight.headline)}</strong><p>${escapeHtml(flight.detail)}</p></article>`;
  let inserted = false;
  main.parts = recursiveStrings(main.parts, (value) => {
    if (inserted || !value.includes('<article class="current-flight-callout"')) return value;
    inserted = true;
    return value.replace(/<article class="current-flight-callout"[\s\S]*?<\/article>/, () => callout);
  });
  if (!inserted) {
    main.parts = recursiveStrings(main.parts, (value) => {
      if (inserted || !/<section id="(?:air-travel|flights)"/.test(value)) return value;
      inserted = true;
      return value.replace(/(<section id="(?:air-travel|flights)"[^>]*>)/, (section) => `${section}${callout}`);
    });
  }
  // Some legacy pages have no dedicated flight section. Their current audit still
  // renders through itinerary/readiness.njk, so an embedded duplicate is optional.
}

function recursiveStrings(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((item) => recursiveStrings(item, fn));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, recursiveStrings(item, fn)]));
  }
  return value;
}

function unique(values) { return [...new Set(values)]; }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
