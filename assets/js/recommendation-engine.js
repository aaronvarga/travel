/* Shared recommendation calculations. Appeal, readiness, confidence and budget
 * status are deliberately separate so uncertainty never silently changes taste. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RecommendationEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CONFIDENCE = { unknown: 0, low: 1, medium: 2, high: 3 };

  function total(trip, axes, weights) {
    return axes.reduce((sum, axis) => sum + (trip.axes[axis.id] || 0) * (weights[axis.id] || 0), 0);
  }

  function budgetStatus(budget, preferences) {
    const target = preferences.targetUsd || 12000;
    const preferredMax = preferences.preferredMaxUsd || 15000;
    if (budget.ceilUsd <= target) return 'target-fit';
    if (budget.ceilUsd <= preferredMax) return 'within-preference';
    if (budget.floorUsd <= preferredMax) return 'crosses-preference';
    return 'likely-over-preference';
  }

  function readiness(trip) {
    if (trip.excluded) return { id: 'family-excluded', label: 'Family-excluded reference', tone: 'muted', bookable: false };
    const route = trip.routeReadiness || 'current-proxy';
    if (route === 'confirmed') return { id: route, label: 'Route confirmed', tone: 'good', bookable: true };
    if (route === 'reroute-required') return { id: route, label: 'Reroute required', tone: 'bad', bookable: false };
    if (route === 'exact-2027-schedule-required') return { id: route, label: 'Exact 2027 schedule required', tone: 'warn', bookable: false };
    if (route === 'unknown') return { id: route, label: 'Route evidence needed', tone: 'warn', bookable: false };
    return { id: 'current-proxy', label: 'Not ready to book', tone: 'info', bookable: false };
  }

  function evidenceConfidence(evidence) {
    const id = evidence?.overallConfidence || 'unknown';
    return { id, value: CONFIDENCE[id] ?? 0, label: `${id[0].toUpperCase()}${id.slice(1)} evidence confidence` };
  }

  function compareDefault(a, b, axes, weights, preferences) {
    const excluded = Number(Boolean(a.excluded)) - Number(Boolean(b.excluded));
    if (excluded) return excluded;
    const score = total(b, axes, weights) - total(a, axes, weights);
    if (score) return score;
    const budgetWeighted = (weights.budget || 0) > 0;
    const budgetTie = budgetWeighted
      ? budgetTier(a.budget, preferences) - budgetTier(b.budget, preferences)
      : 0;
    const budgetRangeTie = budgetWeighted
      ? (a.budget.ceilUsd - b.budget.ceilUsd) || (a.budget.floorUsd - b.budget.floorUsd)
      : 0;
    return budgetTie ||
      ((a.pto?.days ?? 99) - (b.pto?.days ?? 99)) ||
      budgetRangeTie ||
      String(a.displayName || a.slug).localeCompare(String(b.displayName || b.slug));
  }

  function applyVariant(trip, variant, axes) {
    if (!variant || variant.canonical) return trip;
    const copy = {
      ...trip,
      axes: { ...trip.axes, ...(variant.axisOverrides || {}) },
      budget: {
        ...trip.budget,
        floorUsd: variant.budget.lowUsd,
        ceilUsd: variant.budget.highUsd,
      },
      pto: { ...trip.pto, days: variant.ptoDays, nights: variant.nights },
      activeVariant: variant.id,
    };
    copy.totalBaked = total(copy, axes, copy.weightDefaults);
    return copy;
  }

  function budgetTier(budget, preferences) {
    return ['target-fit', 'within-preference', 'crosses-preference', 'likely-over-preference']
      .indexOf(budgetStatus(budget, preferences));
  }

  return { total, budgetStatus, readiness, evidenceConfidence, compareDefault, applyVariant };
});
