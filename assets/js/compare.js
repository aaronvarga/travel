/* compare.js — Feature 2: side-by-side compare (2-5 trips).
 * Adds compare toggles to shortlist cards + scoreboard rows (cap 5) and renders
 * a column-per-trip diff drawer in #compare-bar with best-value highlighting.
 * Selection lives in Store.selected (serialized to the URL by urlstate.js). */
(function () {
  'use strict';
  const MAX = 5;

  const Compare = (window.Compare = {
    toggle(slug) {
      const sel = (Store.get().selected || []).slice();
      const i = sel.indexOf(slug);
      if (i >= 0) sel.splice(i, 1);
      else if (sel.length < MAX) sel.push(slug);
      else return; // at cap
      Store.set({ selected: sel });
    },
    clear() { Store.set({ selected: [] }); },
  });

  document.addEventListener('board:ready', function (e) {
    const B = e.detail;
    injectCardButtons(B);
    injectRowButtons(B);
    const bar = document.getElementById('compare-bar');
    Store.subscribe(() => render(B, bar));
    render(B, bar);
  });

  function injectCardButtons(B) {
    Object.entries(B.cards).forEach(([slug, a]) => {
      const host = a.querySelector('.sl-photo') || a;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmp-toggle cmp-card-toggle';
      btn.dataset.slug = slug;
      btn.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        Compare.toggle(slug);
      });
      host.appendChild(btn);
    });
  }

  function injectRowButtons(B) {
    Object.entries(B.rows).forEach(([slug, tr]) => {
      const th = tr.querySelector('th');
      if (!th) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmp-toggle cmp-row-toggle';
      btn.dataset.slug = slug;
      btn.title = 'Add to compare';
      btn.addEventListener('click', () => Compare.toggle(slug));
      th.appendChild(btn);
    });
  }

  function render(B, bar) {
    const sel = (Store.get().selected || []).filter((s) => B.bySlug[s]);
    const atCap = sel.length >= MAX;

    // reflect toggle button states
    document.querySelectorAll('.cmp-toggle').forEach((btn) => {
      const on = sel.includes(btn.dataset.slug);
      btn.classList.toggle('on', on);
      btn.textContent = on ? '✓ Comparing' : '+ Compare';
      btn.disabled = !on && atCap;
    });

    if (!bar) return;
    if (sel.length === 0) {
      bar.hidden = true;
      bar.replaceChildren();
      return;
    }
    // Docked bar stays compact; the comparison table only renders when the
    // user expands it, so selecting trips is never intrusive.
    bar.hidden = false;
    const showTable = expanded && sel.length >= 2;
    bar.classList.toggle('expanded', showTable);
    if (showTable) {
      bar.replaceChildren(headBar(B, sel), buildTable(B, sel));
    } else if (sel.length === 1) {
      const name = B.bySlug[sel[0]].displayName;
      const hint = el('p', 'cmp-hint', name + ' selected — pick at least 1 more trip (up to 5 total) to unlock the side-by-side comparison.');
      bar.replaceChildren(headBar(B, sel), hint);
    } else {
      bar.replaceChildren(headBar(B, sel));
    }
  }

  let expanded = false;

  function headBar(B, sel) {
    const head = el('div', 'hub-panel-head');
    const title = sel.length === 1
      ? '1 trip selected'
      : 'Comparing: ' + sel.map((s) => B.bySlug[s].displayName).join(' vs ');
    head.appendChild(el('h3', null, title));
    const right = el('div', 'cmp-actions');
    if (sel.length >= 2) {
      const tog = el('button', 'hub-btn cmp-expand', expanded ? 'Hide comparison ▾' : 'Show comparison ▴');
      tog.type = 'button';
      tog.addEventListener('click', () => { expanded = !expanded; Store.touch({ reason: 'compare-expand' }); });
      right.appendChild(tog);
    }
    const clear = el('button', 'hub-btn', 'Clear');
    clear.type = 'button';
    clear.addEventListener('click', () => { expanded = false; Compare.clear(); });
    right.appendChild(clear);
    head.appendChild(right);
    return head;
  }

  // metric rows: {label, val(t)->displayString, num(t)->number|null, better}
  function metrics(B) {
    const axisRows = B.axesDefs.map((a) => ({
      label: a.label + ' (1-5)',
      num: (t) => t.axes[a.id],
      val: (t) => String(t.axes[a.id]),
      better: 'max',
    }));
    return [
      { label: 'Weighted total', num: (t) => B.total(t), val: (t) => String(B.total(t)), better: 'max', strong: true },
      ...axisRows,
      { label: 'Budget ceiling', num: (t) => t.budget.ceilUsd, val: (t) => '$' + (t.budget.floorUsd / 1000) + '–' + (t.budget.ceilUsd / 1000) + 'k', better: 'min' },
      { label: 'Budget preference', num: () => null, val: (t) => budgetLabel(RecommendationEngine.budgetStatus(t.budget, B.preferences()), B.preferences()), better: null },
      { label: 'Booking readiness', num: () => null, val: (t) => t.readiness?.label || 'Unknown', better: null },
      { label: 'Evidence confidence', num: (t) => t.evidence?.confidence?.value ?? null, val: (t) => t.evidence?.confidence?.label || 'Unknown', better: 'max' },
      { label: 'PTO days', num: (t) => t.pto.days, val: (t) => t.pto.days + ' PTO / ' + t.pto.nights + 'n', better: 'min' },
      { label: 'Continent', num: () => null, val: (t) => t.facets.continent, better: null },
      { label: 'Connections', num: (t) => t.facets.maxConnections, val: (t) => '≤' + t.facets.maxConnections, better: 'min' },
      { label: 'Flight time', num: (t) => t.metrics?.airHours ?? null, val: (t) => t.metrics?.airHours != null ? t.metrics.airHours + 'h' : 'Unknown', better: 'min' },
      { label: 'Ground time', num: (t) => t.metrics?.groundHours ?? null, val: (t) => t.metrics?.groundHours != null ? t.metrics.groundHours + 'h' : 'Unknown', better: 'min' },
      { label: 'Age 8 activity fit', num: () => null, val: (t) => t.metrics?.childActivityFit?.age8 || 'unknown', better: null },
      { label: 'Swim temp', num: (t) => t.facets.swimTempF[1], val: (t) => t.facets.swimTempF.join('–') + '°F', better: 'max' },
      { label: 'Planning sections', num: () => null, val: (t) => (t.completeness ? t.completeness.complete + '/' + t.completeness.total : '—'), better: null },
    ];
  }

  function budgetLabel(status, preferences) {
    const preferred = '$' + ((preferences?.preferredMaxUsd || 15000) / 1000).toLocaleString() + 'k';
    return ({
      'target-fit': 'At/below target',
      'within-preference': `Within ${preferred} preference`,
      'crosses-preference': `Range crosses ${preferred}`,
      'likely-over-preference': `Likely above ${preferred}`,
    })[status] || 'Unknown';
  }

  function buildTable(B, sel) {
    const trips = sel.map((s) => B.currentBySlug[s] || B.bySlug[s]);
    const wrap = el('div', 'cmp-scroll');
    const table = el('table', 'cmp-table');

    const thead = el('thead');
    const hr = el('tr');
    hr.appendChild(el('th', 'cmp-corner', 'Metric'));
    trips.forEach((t) => {
      const th = el('th');
      th.appendChild(el('span', 'cmp-name', t.displayName));
      const rm = el('button', 'cmp-remove', '×');
      rm.type = 'button';
      rm.title = 'Remove';
      rm.addEventListener('click', () => Compare.toggle(t.slug));
      th.appendChild(rm);
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = el('tbody');
    metrics(B).forEach((m) => {
      const tr = el('tr');
      if (m.strong) tr.className = 'cmp-strong';
      tr.appendChild(el('th', null, m.label));
      // determine best value(s)
      let best = null;
      if (m.better) {
        const nums = trips.map(m.num).filter((n) => n != null);
        if (nums.length) best = m.better === 'max' ? Math.max(...nums) : Math.min(...nums);
      }
      trips.forEach((t) => {
        const td = el('td', null, m.val(t));
        if (best != null && m.num(t) === best && trips.length > 1) td.classList.add('cmp-best');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
})();
