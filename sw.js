/* sw.js — Phase 8 offline support for on-trip use.
 * Lives at the site root so its scope covers index.html + every itinerary page.
 * - App shell (hub JS/CSS + manifests): precached, stale-while-revalidate.
 * - Same-origin pages/assets: stale-while-revalidate.
 * - Map tiles (OpenFreeMap) + trip photos: cache-first with an LRU cap, cached
 *   on demand as the user visits pages (no bulk pre-warming).
 * Cache names are versioned; bump VERSION on release to invalidate. */
'use strict';
const VERSION = 'tp-v5';
const SHELL = VERSION + '-shell';
const TILES = VERSION + '-tiles';
const IMGS = VERSION + '-imgs';
const imageAccess = new Map();

// Paths are relative to sw.js (site root), so they resolve under any base path.
const CORE = [
  'index.html',
  'assets/css/hub.css',
  'assets/css/itinerary.css',
  'assets/js/store.js',
  'assets/js/recommendation-engine.js',
  'assets/js/board.js',
  'assets/js/weights.js',
  'assets/js/scenarios.js',
  'assets/js/evidence.js',
  'assets/js/filters.js',
  'assets/js/compare.js',
  'assets/js/meter.js',
  'assets/js/urlstate.js',
  'assets/js/itinerary.js',
  'assets/trips-summary.json',
  'assets/rank-analysis.json',
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
  } else if (url.origin === self.location.origin && /\/assets\/(?:generated\/images|img)\//.test(url.pathname)) {
    // Photos are always isolated from the app shell and bounded. Archival
    // /assets/img paths are retained here only as a safe fallback for an old page.
    e.respondWith(cacheFirst(req, IMGS, 80));
  } else if (url.origin === self.location.origin && isDoc) {
    // HTML pages: network-first so an online visitor always gets the fresh,
    // complete document; cache is only a fallback when offline. Prevents a
    // stale or partially-cached page from ever shadowing the live site.
    e.respondWith(networkFirst(req, SHELL));
  } else if (url.origin === self.location.origin) {
    e.respondWith(staleWhileRevalidate(req, SHELL));
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_TRIP' || !Array.isArray(event.data.urls)) return;
  const urls = [...new Set(event.data.urls)].slice(0, 81);
  event.waitUntil(Promise.allSettled(urls.map(async (value) => {
    const url = new URL(value, self.location.origin);
    if (url.origin !== self.location.origin) return;
    const request = new Request(url.href);
    const response = await fetch(request);
    if (!response.ok) return;
    const image = /\/assets\/generated\/images\//.test(url.pathname);
    const cache = await caches.open(image ? IMGS : SHELL);
    await cache.put(request, response);
    if (image) {
      touch(request);
      await trim(cache, 80);
    }
  })));
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
      if (hit) {
        touch(req);
        return hit;
      }
      return fetch(req).then(async (res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          await cache.put(req, res.clone());
          touch(req);
          await trim(cache, max);
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

function touch(request) {
  imageAccess.set(request.url, Date.now());
}

// LRU cap: cache operations are awaited so a burst of image requests cannot
// race past the bound. Entries from a prior worker generation get timestamp 0
// and are evicted first, which is the safest warm-cache behavior after deploy.
async function trim(cache, max) {
  const keys = await cache.keys();
  if (keys.length <= max) return;
  keys.sort((a, b) => (imageAccess.get(a.url) || 0) - (imageAccess.get(b.url) || 0));
  await Promise.all(keys.slice(0, keys.length - max).map((key) => {
    imageAccess.delete(key.url);
    return cache.delete(key);
  }));
}
