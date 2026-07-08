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
    loaded: false, axesDefs: [], budgetTargets: {}, trips: [],
    byToken: {}, bySlug: {}, rows: {}, cards: {},
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
  }

  // ---- scoring -------------------------------------------------------------
  B.total = function (t, weights) {
    const w = weights || Store.get().weights || {};
    let s = 0;
    for (const a of B.axesDefs) s += (t.axes[a.id] || 0) * (w[a.id] || 0);
    return s;
  };
  B.maxTotal = function (weights) {
    const w = weights || Store.get().weights || {};
    return B.axesDefs.reduce((s, a) => s + 5 * (w[a.id] || 0), 0);
  };

  // ---- filtering -----------------------------------------------------------
  B.matches = function (t, filters) {
    const f = filters || {};
    if (f.europe && t.facets.continent !== 'europe') return false;
    if (f.maxConn != null && t.facets.maxConnections > f.maxConn) return false;
    if (f.underUsd != null && t.budget.ceilUsd > f.underUsd) return false;
    if (f.hasSwim && !t.facets.hasSwim) return false;
    return true;
  };

  // ---- render --------------------------------------------------------------
  function render(state) {
    if (!B.loaded) return;
    const weights = state.weights || {};
    const filters = state.filters || {};
    const selected = state.selected || [];

    const visible = B.trips.filter((t) => B.matches(t, filters));
    const visibleSlugs = new Set(visible.map((t) => t.slug));

    // Sort scoreboard rows by weighted total (desc), tiebreak by budget floor (asc).
    const ordered = visible.slice().sort((a, b) => {
      const d = B.total(b, weights) - B.total(a, weights);
      return d !== 0 ? d : a.budget.floorUsd - b.budget.floorUsd;
    });

    const tbody = document.querySelector('.compare-table tbody');
    if (tbody) {
      ordered.forEach((t) => {
        const tr = B.rows[t.slug];
        if (!tr) return;
        const tot = B.total(t, weights);
        const cell = tr.querySelector('td:last-child b');
        if (cell) cell.textContent = tot;
        tr.classList.toggle('is-picked', selected.includes(t.slug));
        tr.style.display = '';
        tbody.appendChild(tr); // reorder
      });
      // Hide filtered-out rows.
      Object.entries(B.rows).forEach(([slug, tr]) => {
        if (!visibleSlugs.has(slug)) tr.style.display = 'none';
      });
    }

    // Cards keep editorial order; only toggle visibility + picked state + meters.
    Object.entries(B.cards).forEach(([slug, a]) => {
      a.style.display = visibleSlugs.has(slug) ? '' : 'none';
      a.classList.toggle('is-picked', selected.includes(slug));
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

    document.dispatchEvent(new CustomEvent('board:render', { detail: { ordered, visible } }));
  }

  B.render = () => render(Store.get(), { reason: 'manual' });
})();
