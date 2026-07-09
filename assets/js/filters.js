/* filters.js — Feature 3: sticky faceted filters.
 * Europe-only, <=1 connection, under-$X, has-swim. Writes Store.filters; board
 * hides non-matching rows + cards. Shows a live "N of 16" count. */
(function () {
  'use strict';
  const CAP = 17000; // slider max; treated as "Any" (no ceiling)

  document.addEventListener('board:ready', function (e) {
    const B = e.detail;
    const bar = document.getElementById('filter-bar');
    if (!bar) return;

    const get = () => Store.get().filters || {};
    const patch = (p) => Store.set({ filters: Object.assign({}, get(), p) });

    const head = el('div', 'hub-panel-head');
    head.appendChild(el('h3', null, 'Filter the field'));
    const count = el('span', 'filter-count');
    const clear = el('button', 'hub-btn', 'Clear filters');
    clear.type = 'button';
    const right = el('div');
    right.style.cssText = 'display:flex;gap:10px;align-items:center';
    right.append(count, clear);
    head.appendChild(right);

    const controls = el('div', 'filter-controls');

    const cbEurope = toggle('Europe only', (on) => patch({ europe: on || undefined }));
    const cbConn = toggle('≤1 connection', (on) => patch({ maxConn: on ? 1 : undefined }));
    const cbSwim = toggle('Has swim', (on) => patch({ hasSwim: on || undefined }));

    // budget slider
    const budWrap = el('label', 'filter-budget');
    const budLabel = el('span', null, 'Max budget: Any');
    const budRange = document.createElement('input');
    budRange.type = 'range';
    budRange.min = '8000'; budRange.max = String(CAP); budRange.step = '500'; budRange.value = String(CAP);
    budRange.addEventListener('input', function () {
      const v = +budRange.value;
      patch({ underUsd: v >= CAP ? undefined : v });
    });
    budWrap.append(budLabel, budRange);

    controls.append(cbEurope.node, cbConn.node, cbSwim.node, budWrap);
    clear.addEventListener('click', () => Store.set({ filters: {} }));

    bar.append(head, controls);
    bar.hidden = false;

    function sync() {
      const f = get();
      cbEurope.set(!!f.europe);
      cbConn.set(f.maxConn === 1);
      cbSwim.set(!!f.hasSwim);
      budRange.value = f.underUsd != null ? f.underUsd : CAP;
      budLabel.textContent = f.underUsd != null ? 'Max budget: $' + (f.underUsd / 1000) + 'k' : 'Max budget: Any';
      const ranked = B.trips.filter((t) => !t.excluded);
      const n = ranked.filter((t) => B.matches(t, f)).length;
      count.textContent = n + ' of ' + ranked.length + ' ranked plans';
      count.classList.toggle('is-empty', n === 0);
      clear.disabled = !Object.keys(f).length;
    }
    Store.subscribe(sync);
    sync();
  });

  function toggle(label, onChange) {
    const node = el('label', 'filter-toggle');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.addEventListener('change', () => onChange(cb.checked));
    node.append(cb, document.createTextNode(' ' + label));
    return { node, set: (on) => { cb.checked = on; } };
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
})();
