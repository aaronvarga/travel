/* board.js — loads assets/trips-summary.json and progressively enhances the
 * hand-authored scoreboard + shortlist cards. Owns the derived render:
 *   - weighted totals + live re-sort of the scoreboard (Feature 1)
 *   - facet visibility of rows + cards (Feature 3)
 *   - compare selection highlight (Feature 2)
 *   - completeness meters + gated badges (Feature 4)
 * All state lives in Store; features only call Store.set(). No-JS users keep
 * the baked table/cards as-is (this only enhances what's already rendered). */
(function () {
  'use strict';
  const B = (window.Board = {
    loaded: false, axesDefs: [], budgetTargets: {}, evidenceSources: {}, trips: [],
    byToken: {}, bySlug: {}, currentBySlug: {}, rows: {}, cards: {},
  });

  fetch('assets/trips-summary.json')
    .then((r) => r.json())
    .then((data) => init(data))
    .catch((err) => console.warn('[board] manifest load failed; leaving static content', err));

  function defaultWeights(axes) {
    return Object.fromEntries(axes.map((a) => [a.id, a.weightDefault]));
  }

  function init(data) {
    B.axesDefs = data.axes;
    B.budgetTargets = data.budgetTargets;
    B.evidenceSources = data.evidenceSources || {};
    B.trips = data.trips;
    data.trips.forEach((t) => { B.byToken[t.token] = t; B.bySlug[t.slug] = t; });

    attachDom();
    B.loaded = true;

    // Seed default weights (URL state, if present, overrides before first paint).
    if (!Store.get().weights) Store.set({ weights: defaultWeights(data.axes) });
    Store.subscribe(render);
    document.dispatchEvent(new CustomEvent('board:ready', { detail: B }));
    render(Store.get(), { reason: 'init' });
  }

  // Wire existing DOM nodes to manifest records.
  function attachDom() {
    document.querySelectorAll('.compare-table tbody tr[data-trip]').forEach((tr) => {
      const t = B.byToken[tr.getAttribute('data-trip')];
      if (t) { B.rows[t.slug] = tr; tr.dataset.slug = t.slug; }
    });
    document.querySelectorAll('.sl-grid .sl-card[href]').forEach((a) => {
      const m = a.getAttribute('href').match(/locations\/([^/]+)\//);
      const t = m && B.bySlug[m[1]];
      if (t) { B.cards[t.slug] = a; a.dataset.slug = t.slug; a.dataset.trip = t.token; }
    });

    // Click-to-sort headers. Toggles direction on repeat clicks; numeric
    // columns default to descending, the Trip name column to ascending.
    document.querySelectorAll('.compare-table thead th[data-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        const cur = Store.get().sort;
        const dir = (cur && cur.key === key)
          ? (cur.dir === 'asc' ? 'desc' : 'asc')
          : (key === 'trip' ? 'asc' : 'desc');
        Store.set({ sort: { key, dir } });
      });
    });
  }

  // Value a row sorts on for a given column key (weighted total handled inline).
  function sortVal(t, key) {
    if (key === 'trip') return (t.displayName || t.title || '').toLowerCase();
    if (key === 'pto') return t.pto?.days ?? 999;
    if (key === 'travel') {
      const tr = B.rows[t.slug];
      return tr ? (Number(tr.dataset.plane || 0) + Number(tr.dataset.car || 0)) : 0;
    }
    return t.axes[key] ?? 0;
  }

  // ---- scoring -------------------------------------------------------------
  B.total = function (t, weights) {
    return RecommendationEngine.total(t, B.axesDefs, weights || Store.get().weights || {});
  };
  B.maxTotal = function (weights) {
    const w = weights || Store.get().weights || {};
    return B.axesDefs.reduce((s, a) => s + 5 * (w[a.id] || 0), 0);
  };
  B.preferences = function (state) {
    const current = state || Store.get();
    return Object.assign({}, B.budgetTargets, {
      preferredMaxUsd: current.preferredMaxUsd || B.budgetTargets.preferredMaxUsd,
    });
  };

  // ---- filtering -----------------------------------------------------------
  B.matches = function (t, filters) {
    const f = filters || {};
    if (f.europe && t.facets.continent !== 'europe') return false;
    if (f.maxConn != null && t.facets.maxConnections > f.maxConn) return false;
    if (f.underUsd != null && t.budget.ceilUsd > f.underUsd) return false;
    if (f.hasSwim && !t.facets.hasSwim) return false;
    if (f.hideReroute && t.routeReadiness === 'reroute-required') return false;
    return true;
  };

  // ---- render --------------------------------------------------------------
  function render(state) {
    if (!B.loaded) return;
    const weights = state.weights || {};
    const filters = state.filters || {};
    const selected = state.selected || [];

    const views = B.trips.map((trip) => {
      const variantId = state.variants?.[trip.slug];
      const variant = trip.variants?.find((item) => item.id === variantId);
      return RecommendationEngine.applyVariant(trip, variant, B.axesDefs);
    });
    B.currentBySlug = Object.fromEntries(views.map((trip) => [trip.slug, trip]));
    const visible = views.filter((t) => B.matches(t, filters));
    const visibleSlugs = new Set(visible.map((t) => t.slug));

    // Sort scoreboard rows by weighted total (desc). With Budget enabled, ties
    // prefer bands within the family's preferred maximum; cost never hides or
    // excludes a trip. Remaining ties use PTO days, ceiling, then floor.
    const sort = state.sort || null;
    const ordered = visible.slice().sort((a, b) => {
      // Explicitly excluded trips (family decision, e.g. a repeat) sink below
      // every ranked trip regardless of score; their data stays visible.
      const ex = (t) => (t.excluded ? 1 : 0);
      if (ex(a) !== ex(b)) return ex(a) - ex(b);
      // Explicit column sort (user clicked a header) overrides the default
      // weighted-total order for every column except Total itself.
      if (sort && sort.key && sort.key !== 'total') {
        const ka = sortVal(a, sort.key), kb = sortVal(b, sort.key);
        const d = (typeof ka === 'string') ? ka.localeCompare(kb) : ka - kb;
        if (d !== 0) return sort.dir === 'asc' ? d : -d;
      }
      const dt = B.total(b, weights) - B.total(a, weights);
      if (dt !== 0) return (sort && sort.key === 'total' && sort.dir === 'asc') ? -dt : dt;
      return RecommendationEngine.compareDefault(a, b, B.axesDefs, weights, B.preferences(state));
    });

    // Compare-selection state applies to every row/card regardless of order or
    // visibility (uses .is-compared to avoid clobbering the decision-console's
    // own .is-picked highlight).
    Object.entries(B.rows).forEach(([slug, tr]) => {
      tr.classList.toggle('is-compared', selected.includes(slug));
    });

    const tbody = document.querySelector('.compare-table tbody');
    if (tbody) {
      ordered.forEach((t) => {
        const tr = B.rows[t.slug];
        if (!tr) return;
        const cell = tr.querySelector('td:last-child b');
        if (cell) cell.textContent = B.total(t, weights);
        tr.style.display = '';
        tbody.appendChild(tr); // reorder
      });
      Object.entries(B.rows).forEach(([slug, tr]) => {
        if (!visibleSlugs.has(slug)) tr.style.display = 'none';
      });
    }

    // Cards keep editorial order; toggle visibility + compare state.
    Object.entries(B.cards).forEach(([slug, a]) => {
      a.style.display = visibleSlugs.has(slug) ? '' : 'none';
      a.classList.toggle('is-compared', selected.includes(slug));
      const score = a.querySelector('.sl-score');
      if (score) {
        const total = B.total(B.currentBySlug[slug] || B.bySlug[slug], weights);
        const max = B.maxTotal(weights);
        const value = score.querySelector('b');
        const scale = score.querySelector(':scope > span');
        if (value) value.textContent = total;
        if (scale) scale.firstChild.textContent = '/' + max;
        score.setAttribute('aria-label', 'Rated ' + total + ' out of ' + max);
      }
    });

    // Update the scoreboard total header to reflect the live max.
    const th = document.querySelector('.compare-table thead th:last-child');
    if (th) {
      th.textContent = 'Total ';
      const max = document.createElement('span');
      max.className = 'tot-max';
      max.textContent = '/' + B.maxTotal(weights);
      th.appendChild(max);
    }

    // Reflect active sort column/direction in the header arrows.
    document.querySelectorAll('.compare-table thead th[data-sort]').forEach((th) => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (sort && sort.key === th.getAttribute('data-sort')) {
        th.classList.add(sort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });

    document.dispatchEvent(new CustomEvent('board:render', { detail: { ordered, visible, state } }));
  }

  B.render = () => render(Store.get(), { reason: 'manual' });
})();
