/* sw.js — Phase 8 offline support for on-trip use.
 * Lives at the site root so its scope covers index.html + every itinerary page.
 * - App shell (hub JS/CSS + manifests): precached, stale-while-revalidate.
 * - Same-origin pages/assets: stale-while-revalidate.
 * - Map tiles (OpenFreeMap) + trip photos: cache-first with an LRU cap, cached
 *   on demand as the user visits pages (no bulk pre-warming).
 * Cache names are versioned; bump VERSION on release to invalidate. */
'use strict';
const VERSION = 'tp-v15';
const SHELL = VERSION + '-shell';
const TILES = VERSION + '-tiles';
const IMGS = VERSION + '-imgs';
const TRIPS = VERSION + '-trip-';
const imageAccess = new Map();

// Paths are relative to sw.js (site root), so they resolve under any base path.
const CORE = [
  'index.html',
  'assets/css/hub.css',
  'assets/css/itinerary.css?v=20260710-travel-frame-all',
  'assets/css/composer-shell.css?v=20260712-parity-2',
  'assets/js/store.js',
  'assets/js/recommendation-engine.js',
  'assets/js/board.js',
  'assets/js/display-date.js?v=20260710-dates',
  'assets/js/weights.js',
  'assets/js/scenarios.js',
  'assets/js/evidence.js?v=20260710-dates',
  'assets/js/filters.js',
  'assets/js/compare.js',
  'assets/js/meter.js?v=20260710-dates',
  'assets/js/urlstate.js',
  'assets/js/itinerary.js?v=20260710-gallery-full',
  'assets/js/builder.js?v=20260712-composer',
  'assets/js/composer-shell.js?v=20260712-parity-2',
  'assets/js/pwa.js?v=20260829-offline-trips-2',
  'manifest.webmanifest',
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
  } else if (req.destination === 'image' || url.hostname === 'images.unsplash.com' || url.hostname.endsWith('staticflickr.com')) {
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
  } else if (['style', 'script', 'font'].includes(req.destination)) {
    // Explicitly saved trips may contain third-party fonts or libraries. Use
    // the network while online, then fall back to the pinned trip package.
    e.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CHECK_TRIP') {
    const cacheName = tripCacheName(data.tripId);
    event.waitUntil(caches.open(cacheName)
      .then((cache) => cache.match(tripMarker(data.tripId)))
      .then((marker) => postTo(event.source, {
        type: 'CACHE_TRIP_STATUS', requestId: data.requestId, saved: Boolean(marker)
      })));
    return;
  }
  if (data.type !== 'CACHE_TRIP' || !Array.isArray(data.urls)) return;
  event.waitUntil(cacheTrip(event, data));
});

async function cacheTrip(event, data) {
  const urls = [...new Set(data.urls.map((value) => {
    try { return new URL(value, self.location.origin).href; } catch (_) { return null; }
  }).filter(Boolean))];
  const cache = await caches.open(tripCacheName(data.tripId));
  await cache.delete(tripMarker(data.tripId));
  let cursor = 0;
  let completed = 0;
  let failed = 0;
  const failedDetails = [];

  async function cacheNext() {
    while (cursor < urls.length) {
      const href = urls[cursor++];
      try {
        const url = new URL(href);
        const sameOrigin = url.origin === self.location.origin;
        const request = new Request(href, sameOrigin
          ? { credentials: 'same-origin' }
          : { mode: 'no-cors', credentials: 'omit' });
        const response = await fetch(request);
        if (!(response.ok || response.type === 'opaque')) throw new Error('request failed');
        await cache.put(request, response);
      } catch (error) {
        failed += 1;
        failedDetails.push({ url: href, error: String(error && error.message || error) });
      }
      completed += 1;
      postTo(event.source, {
        type: 'CACHE_TRIP_PROGRESS', requestId: data.requestId,
        completed, total: urls.length, failed
      });
    }
  }

  // A small pool avoids overwhelming mobile Safari while allowing large trips
  // to finish much faster than a strictly sequential download.
  const workers = Array.from({ length: Math.min(4, urls.length) }, cacheNext);
  await Promise.all(workers);
  if (!failed) {
    await cache.put(tripMarker(data.tripId), new Response(JSON.stringify({
      version: VERSION, files: urls.length, savedAt: new Date().toISOString()
    }), { headers: { 'content-type': 'application/json' } }));
  }
  postTo(event.source, {
    type: 'CACHE_TRIP_COMPLETE', requestId: data.requestId,
    completed, total: urls.length, failed, failedDetails, version: VERSION
  });
}

function tripCacheName(tripId) {
  return TRIPS + safeTripId(tripId);
}

function tripMarker(tripId) {
  return new Request(new URL('__offline_trip__/' + safeTripId(tripId), self.location.href).href);
}

function safeTripId(tripId) {
  const safeId = String(tripId || 'itinerary').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 80);
  return safeId || 'itinerary';
}

function postTo(client, message) {
  try { client?.postMessage(message); } catch (_) {}
}

function networkFirst(req, cacheName) {
  return fetch(req)
    .then((res) => {
      if (res && res.ok) caches.open(cacheName).then((c) => c.put(req, res.clone()));
      return res;
    })
    .catch(() => caches.match(req));
}

function cacheFirst(req, cacheName, max) {
  return caches.open(cacheName).then((cache) =>
    caches.match(req).then((hit) => {
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
    caches.match(req).then((hit) => {
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
