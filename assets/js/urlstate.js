/* urlstate.js — Feature 5: URL-encoded shareable state.
 * Serializes weights + filters + selected trips into the query string so a
 * comparison is linkable. Hydrates Store from the URL on load (before board
 * seeds defaults) and writes back on every change. Only non-default state is
 * serialized, so an untouched page keeps a clean URL. */
(function () {
  'use strict';
  const V = 'v2';
  const AXES = ['budget', 'weather', 'swim', 'variety', 'ease', 'food', 'risk', 'nights', 'novelty', 'pto'];
  const DEFAULT_W = { budget: 2, weather: 1, swim: 1, variety: 1, ease: 1, food: 1, risk: 1, nights: 1, novelty: 1, pto: 0 };

  // ---- parse URL -> patch --------------------------------------------------
  function parse() {
    const q = new URLSearchParams(location.search);
    if (!['v1', V].includes(q.get('v'))) return {}; // ignore unknown/absent schema versions
    const patch = {};

    const w = q.get('w');
    if (w) {
      const nums = w.split(',').map((n) => parseInt(n, 10));
      if (nums.length === AXES.length && nums.every((n) => n >= 0 && n <= 3)) {
        patch.weights = Object.fromEntries(AXES.map((a, i) => [a, nums[i]]));
      }
    }

    const filters = {};
    if (q.get('eu') === '1') filters.europe = true;
    if (q.get('sw') === '1') filters.hasSwim = true;
    if (q.get('hr') === '1') filters.hideReroute = true;
    const mc = q.get('mc');
    if (mc != null && /^\d+$/.test(mc)) filters.maxConn = parseInt(mc, 10);
    const bud = q.get('bud');
    if (bud != null && /^\d+$/.test(bud)) filters.underUsd = parseInt(bud, 10);
    if (Object.keys(filters).length) patch.filters = filters;

    const c = q.get('c');
    if (c) patch.selected = c.split(',').filter(Boolean).slice(0, 5);
    const preferredMax = q.get('pm');
    if (preferredMax && /^\d+$/.test(preferredMax)) patch.preferredMaxUsd = parseInt(preferredMax, 10);
    const scenario = q.get('sc');
    if (scenario) patch.scenario = scenario;
    const variants = q.get('vr');
    if (variants) {
      patch.variants = Object.fromEntries(variants.split(';').map((item) => item.split(':')).filter((item) => item.length === 2));
    }

    return patch;
  }

  // ---- Store -> URL --------------------------------------------------------
  function serialize(state) {
    const q = new URLSearchParams();
    const w = state.weights;
    if (w && AXES.some((a) => w[a] !== DEFAULT_W[a])) {
      q.set('w', AXES.map((a) => (w[a] != null ? w[a] : DEFAULT_W[a])).join(','));
    }
    const f = state.filters || {};
    if (f.europe) q.set('eu', '1');
    if (f.hasSwim) q.set('sw', '1');
    if (f.hideReroute) q.set('hr', '1');
    if (f.maxConn != null) q.set('mc', String(f.maxConn));
    if (f.underUsd != null) q.set('bud', String(f.underUsd));
    const sel = state.selected || [];
    if (sel.length) q.set('c', sel.join(','));
    if (state.preferredMaxUsd && state.preferredMaxUsd !== 15000) q.set('pm', String(state.preferredMaxUsd));
    if (state.scenario && state.scenario !== 'default') q.set('sc', state.scenario);
    const variants = Object.entries(state.variants || {}).filter(([, id]) => id && id !== 'canonical');
    if (variants.length) q.set('vr', variants.map(([slug, id]) => `${slug}:${id}`).join(';'));

    if ([...q.keys()].length) q.set('v', V);
    return q.toString();
  }

  function write(state) {
    const qs = serialize(state);
    const url = location.pathname + (qs ? '?' + qs : '') + location.hash;
    history.replaceState(null, '', url);
    updateBtn();
  }

  // hydrate now (synchronously, before board's async default-seed)
  const patch = parse();
  if (Object.keys(patch).length) Store.set(patch);
  Store.subscribe(write);

  // ---- copy-link button ----------------------------------------------------
  let btn;
  function updateBtn() { if (btn) btn.textContent = 'Copy share link'; }
  document.addEventListener('board:ready', function () {
    const head = document.querySelector('#weight-panel .hub-panel-head > div');
    if (!head) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hub-btn';
    btn.textContent = 'Copy share link';
    btn.addEventListener('click', function () {
      const done = () => { btn.textContent = 'Link copied ✓'; setTimeout(updateBtn, 1600); };
      const fail = () => { btn.textContent = 'Copy failed'; setTimeout(updateBtn, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(location.href).then(done, fail);
      } else {
        try {
          const ta = document.createElement('textarea');
          ta.value = location.href; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); ta.remove(); done();
        } catch (e) { fail(); }
      }
    });
    head.insertBefore(btn, head.firstChild);
  });
})();
