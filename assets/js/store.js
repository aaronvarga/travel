/* store.js — tiny pub/sub state shared by the comparison-hub features
 * (re-weight sliders, faceted filters, compare, URL state).
 * ~1KB, no deps. State is a flat object; set() shallow-merges and notifies. */
(function (global) {
  'use strict';
  const listeners = new Set();
  const state = {
    weights: null,      // { budget:2, weather:1, ... } — null until board loads defaults
    filters: {},        // { europe:true, maxConn:1, underUsd:11000, hasSwim:true }
    selected: [],       // array of slugs chosen for compare (max 3)
  };

  function get() { return state; }

  function set(patch, meta) {
    let changed = false;
    for (const k in patch) {
      if (state[k] !== patch[k]) { state[k] = patch[k]; changed = true; }
    }
    if (changed) listeners.forEach((fn) => fn(state, meta || {}));
    return state;
  }

  // Force-notify even when the reference is unchanged (e.g. mutated array/object).
  function touch(meta) { listeners.forEach((fn) => fn(state, meta || {})); }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  global.Store = { get, set, touch, subscribe };
})(window);
