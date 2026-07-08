/* weights.js — Feature 1: interactive re-weightable scorecard.
 * Renders one slider per axis (0-3) into #weight-panel, bound to Store.weights.
 * Board re-sorts the scoreboard live on every change. */
(function () {
  'use strict';
  document.addEventListener('board:ready', function (e) {
    const B = e.detail;
    const panel = document.getElementById('weight-panel');
    if (!panel) return;

    const defaults = Object.fromEntries(B.axesDefs.map((a) => [a.id, a.weightDefault]));
    const cur = () => Store.get().weights || defaults;

    // ---- build UI ----
    const head = el('div', 'hub-panel-head');
    head.appendChild(el('h3', null, 'Weight the priorities'));
    const flag = el('span', 'custom-flag', 'Custom weighting');
    flag.hidden = true;
    const reset = el('button', 'hub-btn', 'Reset to default');
    reset.type = 'button';
    const headRight = el('div');
    headRight.style.display = 'flex';
    headRight.style.gap = '10px';
    headRight.style.alignItems = 'center';
    headRight.append(flag, reset);
    head.append(el('p', null, 'Drag to re-rank all 16 trips. 0 = ignore, 3 = triple weight.'), headRight);

    const grid = el('div', 'weight-grid');
    const inputs = {};
    B.axesDefs.forEach((a) => {
      const wrap = el('div', 'weight-axis');
      wrap.dataset.axis = a.id;
      const label = el('label', null, a.label);
      label.htmlFor = 'w-' + a.id;
      const val = el('span', 'wv');
      const range = document.createElement('input');
      range.type = 'range';
      range.min = '0';
      range.max = '3';
      range.step = '1';
      range.id = 'w-' + a.id;
      range.addEventListener('input', function () {
        const w = Object.assign({}, cur());
        w[a.id] = +range.value;
        Store.set({ weights: w });
      });
      inputs[a.id] = { range, val, wrap };
      wrap.append(label, val, range);
      grid.appendChild(wrap);
    });

    reset.addEventListener('click', function () {
      Store.set({ weights: Object.assign({}, defaults) });
    });

    panel.append(head, grid);
    panel.hidden = false;

    // ---- reflect state ----
    function sync() {
      const w = cur();
      let custom = false;
      B.axesDefs.forEach((a) => {
        const v = w[a.id] != null ? w[a.id] : defaults[a.id];
        const i = inputs[a.id];
        i.range.value = v;
        i.val.textContent = '×' + v;
        i.wrap.classList.toggle('off', v === 0);
        if (v !== defaults[a.id]) custom = true;
      });
      flag.hidden = !custom;
      reset.disabled = !custom;
    }
    Store.subscribe(sync);
    sync();
  });

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
})();
