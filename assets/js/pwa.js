(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  var script = document.currentScript;
  var root = new URL('../../', script && script.src ? script.src : location.href);
  var requestId = '';
  var button;
  var resetTimer;

  ensureInstallMetadata();

  navigator.serviceWorker.register(new URL('sw.js', root).href, { scope: root.pathname })
    .then(function () { return navigator.serviceWorker.ready; })
    .then(function (registration) {
      if (!isItinerary()) return;
      createButton();
      var worker = registration.active || navigator.serviceWorker.controller;
      if (!worker) return;
      requestId = makeRequestId();
      worker.postMessage({ type: 'CHECK_TRIP', tripId: tripId(), requestId: requestId });
    })
    .catch(function () {
      if (button) setButton('Offline save unavailable', 'error', false);
    });

  navigator.serviceWorker.addEventListener('message', function (event) {
    var data = event.data || {};
    if (!button || data.requestId !== requestId) return;
    if (data.type === 'CACHE_TRIP_STATUS' && data.saved) {
      setButton('Offline ready · Update', 'saved', false);
    } else if (data.type === 'CACHE_TRIP_PROGRESS') {
      var percent = data.total ? Math.round((data.completed / data.total) * 100) : 0;
      setButton('Saving offline · ' + percent + '%', 'saving', true);
    } else if (data.type === 'CACHE_TRIP_COMPLETE') {
      window.__travelPlannerOfflineResult = data;
      clearTimeout(resetTimer);
      if (data.failed) {
        setButton('Saved ' + (data.total - data.failed) + ' · Retry ' + data.failed, 'warning', false);
      } else {
        setButton('Offline ready · ' + data.total + ' files', 'saved', false);
        resetTimer = setTimeout(function () {
          setButton('Offline ready · Update', 'saved', false);
        }, 5000);
      }
    }
  });

  function isItinerary() {
    if (document.body && document.body.hasAttribute('data-trip-slug')) return true;
    return /(?:mt-rainier-seattle|seattle-(?:mount-baker|north-cascades|olympic))-2026\.html$/.test(location.pathname);
  }

  function ensureInstallMetadata() {
    if (!document.querySelector('link[rel="manifest"]')) {
      var manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = new URL('manifest.webmanifest', root).href;
      document.head.appendChild(manifest);
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      var icon = document.createElement('link');
      icon.rel = 'apple-touch-icon';
      icon.href = new URL('assets/icons/travelplanner-180.png', root).href;
      document.head.appendChild(icon);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      var theme = document.createElement('meta');
      theme.name = 'theme-color';
      theme.content = '#173c38';
      document.head.appendChild(theme);
    }
  }

  function tripId() {
    return (document.body && document.body.getAttribute('data-trip-slug'))
      || location.pathname.split('/').filter(Boolean).pop().replace(/\.html$/, '')
      || 'itinerary';
  }

  function createButton() {
    if (document.querySelector('.offline-save')) return;
    var style = document.createElement('style');
    style.textContent = '.offline-save{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:520;max-width:calc(100vw - 32px);padding:10px 14px;border:1px solid rgba(255,255,255,.32);border-radius:999px;background:#1f4248;color:#fff;font:800 .75rem/1.2 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;transition:bottom .18s ease}.offline-save[data-state="saving"]{cursor:progress;background:#315f67}.offline-save[data-state="saved"]{background:#2f7046}.offline-save[data-state="warning"]{background:#8a641e}.offline-save[data-state="error"]{background:#963c2e}.offline-save:disabled{opacity:.92}body:has(.day-dock.is-visible) .offline-save{bottom:calc(94px + env(safe-area-inset-bottom))}@media print{.offline-save{display:none!important}}';
    document.head.appendChild(style);
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'offline-save';
    button.setAttribute('aria-live', 'polite');
    setButton('Save trip offline', 'ready', false);
    button.addEventListener('click', saveTrip);
    document.body.appendChild(button);
  }

  function setButton(label, state, disabled) {
    button.textContent = label;
    button.dataset.state = state;
    button.disabled = disabled;
  }

  async function saveTrip() {
    clearTimeout(resetTimer);
    setButton('Preparing download…', 'saving', true);
    try {
      if (navigator.storage && navigator.storage.persist) await navigator.storage.persist();
      var registration = await navigator.serviceWorker.ready;
      var worker = registration.active || navigator.serviceWorker.controller;
      if (!worker) throw new Error('service worker is not active');
      var urls = collectUrls();
      requestId = makeRequestId();
      worker.postMessage({ type: 'CACHE_TRIP', tripId: tripId(), requestId: requestId, urls: urls });
      setButton('Saving offline · 0%', 'saving', true);
    } catch (_) {
      setButton('Offline save unavailable · Retry', 'error', false);
    }
  }

  function collectUrls() {
    var urls = new Set();
    var add = function (value, base) {
      if (!value || /^(?:data|blob|javascript):/i.test(value)) return;
      try {
        var url = new URL(value, base || location.href);
        url.hash = '';
        if (/^https?:$/.test(url.protocol)) urls.add(url.href);
      } catch (_) {}
    };
    var addSrcset = function (value, base) {
      String(value || '').split(',').forEach(function (candidate) {
        add(candidate.trim().split(/\s+/)[0], base);
      });
    };
    var addCssUrls = function (value, base) {
      var match;
      var expression = /url\(\s*(['"]?)(.*?)\1\s*\)/g;
      while ((match = expression.exec(value || ''))) add(match[2], base);
    };

    add(location.href);
    add('manifest.webmanifest', root);
    add('assets/js/pwa.js?v=20260829-offline-trips-2', root);
    add('assets/icons/travelplanner-180.png', root);
    add('assets/icons/travelplanner-192.png', root);
    add('assets/icons/travelplanner-512.png', root);

    document.querySelectorAll('img').forEach(function (image) {
      add(image.currentSrc);
      add(image.getAttribute('src'));
      add(image.getAttribute('data-src'));
      addSrcset(image.getAttribute('srcset'));
    });
    document.querySelectorAll('source').forEach(function (source) {
      add(source.getAttribute('src'));
      addSrcset(source.getAttribute('srcset'));
    });
    document.querySelectorAll('[data-full]').forEach(function (element) {
      add(element.getAttribute('data-full'));
    });
    document.querySelectorAll('script[src],link[rel~="stylesheet"][href],link[rel~="manifest"][href],link[rel~="icon"][href],link[rel="apple-touch-icon"][href]').forEach(function (element) {
      add(element.getAttribute('src') || element.getAttribute('href'));
    });
    document.querySelectorAll('[style]').forEach(function (element) {
      addCssUrls(element.getAttribute('style'), location.href);
    });
    // Include CSS/pseudo-element resources the browser actually requested,
    // without pulling in unused relative URLs from embedded library styles.
    // Full gallery backgrounds are covered separately by [style]/data-full.
    if (window.performance && performance.getEntriesByType) {
      performance.getEntriesByType('resource').forEach(function (entry) {
        add(entry.name);
      });
    }
    return Array.from(urls);
  }

  function makeRequestId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }
})();
