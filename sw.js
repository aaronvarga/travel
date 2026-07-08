/* sw.js — Phase 8 offline support for on-trip use.
 * Lives at the site root so its scope covers index.html + every itinerary page.
 * - App shell (hub JS/CSS + manifests): precached, stale-while-revalidate.
 * - Same-origin pages/assets: stale-while-revalidate.
 * - Map tiles (OpenFreeMap) + trip photos: cache-first with an LRU cap, cached
 *   on demand as the user visits pages (no bulk pre-warming).
 * Cache names are versioned; bump VERSION on release to invalidate. */
'use strict';
const VERSION = 'tp-v2';
const SHELL = VERSION + '-shell';
const TILES = VERSION + '-tiles';
const IMGS = VERSION + '-imgs';

// Paths are relative to sw.js (site root), so they resolve under any base path.
const CORE = [
  'index.html',
  'assets/css/hub.css',
  'assets/js/store.js',
  'assets/js/board.js',
  'assets/js/weights.js',
  'assets/js/filters.js',
  'assets/js/compare.js',
  'assets/js/meter.js',
  'assets/js/urlstate.js',
  'assets/trips-summary.json',
  'assets/section-status.json',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(SHELL).then((c) => Promise.allSettled(CORE.map((u) => c.add(u)))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tp-') && !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  const isDoc = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (url.hostname === 'tiles.openfreemap.org') {
    e.respondWith(cacheFirst(req, TILES, 500));
  } else if (url.hostname === 'images.unsplash.com' || url.hostname.endsWith('staticflickr.com')) {
    e.respondWith(cacheFirst(req, IMGS, 250));
  } else if (url.origin === self.location.origin && isDoc) {
    // HTML pages: network-first so an online visitor always gets the fresh,
    // complete document; cache is only a fallback when offline. Prevents a
    // stale or partially-cached page from ever shadowing the live site.
    e.respondWith(networkFirst(req, SHELL));
  } else if (url.origin === self.location.origin) {
    e.respondWith(staleWhileRevalidate(req, SHELL));
  }
});

function networkFirst(req, cacheName) {
  return fetch(req)
    .then((res) => {
      if (res && res.ok) caches.open(cacheName).then((c) => c.put(req, res.clone()));
      return res;
    })
    .catch(() => caches.open(cacheName).then((c) => c.match(req)));
}

function cacheFirst(req, cacheName, max) {
  return caches.open(cacheName).then((cache) =>
    cache.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          cache.put(req, res.clone());
          trim(cache, max);
        }
        return res;
      }).catch(() => hit);
    })
  );
}

function staleWhileRevalidate(req, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
}

// Simple FIFO/LRU cap: drop oldest entries once the cache exceeds `max`.
function trim(cache, max) {
  cache.keys().then((keys) => {
    if (keys.length <= max) return;
    for (let i = 0; i < keys.length - max; i++) cache.delete(keys[i]);
  });
}
