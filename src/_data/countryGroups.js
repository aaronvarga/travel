/**
 * countryGroups.js — data for the within-country comparison page (src/compare.njk).
 *
 * Groups every trip by the country/countries it visits so the family can compare
 * same-country options head-to-head (Cyclades vs Ionian vs the Crete legs, the
 * Portugal/Madeira options, the Sicily/Sardinia/Dolomites options, etc.).
 *
 * Scores/budget/facets come from the canonical assets/trips-summary.json; the
 * per-trip `countries` list comes from each src/_data/<slug>/main.json. The global
 * appeal rank is replayed with the same engine + default weights the hub uses so a
 * trip's badge here matches its rank on the decision hub.
 */
const fs = require('fs');
const path = require('path');
const Engine = require('../../assets/js/recommendation-engine.js');
const cardImages = require('./card-images.js');
const cardSummaries = require('./card-summaries.js');

// Clean single-word country labels. main.json country tokens carry a region flavour
// (greece-ionian, france-mainland, and countries.json names like "Greece (Crete)");
// for grouping we collapse to the bare country.
const COUNTRY_NAMES = {
  greece: 'Greece',
  italy: 'Italy',
  portugal: 'Portugal',
  spain: 'Spain',
  france: 'France',
  usa: 'United States',
  switzerland: 'Switzerland',
  slovenia: 'Slovenia',
  iceland: 'Iceland',
  malta: 'Malta',
  albania: 'Albania',
  croatia: 'Croatia',
  turkey: 'Turkey',
  balkans: 'Balkans',
};

// Excluded trips carry an empty `countries` array in main.json; infer the country so
// the family-excluded options still appear (marked EX) under the right heading.
const FALLBACK_COUNTRIES = {
  'california-pacific-coast': ['usa'],
  'croatia': ['croatia'],
  'italy-salento-amalfi': ['italy'],
  'spain': ['spain'],
  'turkish-riviera': ['turkey'],
  'balkans': ['balkans'],
};

const canon = (token) => String(token).replace(/-.*$/, '');
const nameFor = (key) => COUNTRY_NAMES[key] || (key.charAt(0).toUpperCase() + key.slice(1));

module.exports = function () {
  const root = path.resolve(__dirname, '../..');
  const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'trips-summary.json'), 'utf8'));
  const weights = Object.fromEntries(summary.axes.map((axis) => [axis.id, axis.weightDefault]));

  // Replay the hub's default ordering so appealRank matches the decision hub.
  const ordered = [...summary.trips].sort((a, b) =>
    Engine.compareDefault(a, b, summary.axes, weights, summary.budgetTargets));
  const rankOf = new Map();
  let appeal = 0;
  for (const trip of ordered) {
    rankOf.set(trip.slug, trip.excluded ? null : (appeal += 1) && appeal);
  }

  const readCountries = (slug) => {
    const mainPath = path.join(__dirname, slug, 'main.json');
    let list = [];
    try {
      list = JSON.parse(fs.readFileSync(mainPath, 'utf8')).countries || [];
    } catch { /* summary trip with no sidecar dir — fall through to fallback */ }
    if (!list.length && FALLBACK_COUNTRIES[slug]) list = FALLBACK_COUNTRIES[slug];
    return [...new Set(list.map(canon))];
  };

  const groups = new Map();
  for (const trip of summary.trips) {
    const card = cardImages[trip.slug] || {};
    const row = {
      slug: trip.slug,
      displayName: trip.displayName || trip.title,
      blurb: trip.blurb || '',
      excluded: Boolean(trip.excluded),
      excludedReason: typeof trip.excluded === 'string' ? trip.excluded : '',
      rank: rankOf.get(trip.slug),
      total: trip.totalBaked,
      axes: trip.axes,
      budget: trip.budget,
      budgetStatus: trip.budgetStatus,
      nights: trip.pto?.nights ?? null,
      ptoDays: trip.pto?.days ?? null,
      countries: readCountries(trip.slug),
      href: trip.href ? `../${trip.slug}/` : null,
      heroImage: card.path || null,
      cardImageAlt: card.alt || '',
      cardSummary: cardSummaries[trip.slug] || trip.blurb || '',
    };
    for (const key of row.countries) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
  }

  const axisMeta = summary.axes.map((axis) => ({ id: axis.id, label: axis.label }));
  // Per-country: best value per column (for "winner" highlighting) is computed over
  // the ACTIVE (non-excluded) trips only, so an excluded option can't win a column.
  const countries = [...groups.entries()].map(([key, trips]) => {
    trips.sort((a, b) => {
      if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
    const active = trips.filter((trip) => !trip.excluded);
    const pool = active.length ? active : trips;
    const best = { total: Math.max(...pool.map((t) => t.total || 0)) };
    for (const axis of axisMeta) best[axis.id] = Math.max(...pool.map((t) => t.axes?.[axis.id] || 0));
    best.nights = Math.max(...pool.map((t) => t.nights || 0));
    best.budgetCeil = Math.min(...pool.map((t) => t.budget?.ceilUsd || Infinity));
    return {
      key,
      name: nameFor(key),
      trips,
      activeCount: active.length,
      total: trips.length,
      best,
    };
  });

  // Countries with real (non-excluded) options first, then by how many options exist.
  countries.sort((a, b) => (b.activeCount - a.activeCount) || (b.total - a.total) || a.name.localeCompare(b.name));

  return { countries, axes: axisMeta, budgetTargets: summary.budgetTargets };
};
