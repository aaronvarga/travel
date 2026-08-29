import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('board publishes evidence sources required by the evidence drawer', () => {
  const board = fs.readFileSync('assets/js/board.js', 'utf8');
  assert.match(board, /B\.evidenceSources = data\.evidenceSources/);
  const evidence = fs.readFileSync('assets/js/evidence.js', 'utf8');
  assert.match(evidence, /B\.evidenceSources\?\.\[sourceId\]/);
});

test('summary exposes the axes limiting overall evidence confidence', () => {
  const summary = fs.readFileSync('tools/build-summary.mjs', 'utf8');
  const evidence = fs.readFileSync('assets/js/evidence.js', 'utf8');
  const trips = fs.readFileSync('src/_data/trips.js', 'utf8');
  assert.match(summary, /limitingAxes/);
  assert.match(evidence, /Confidence is currently limited by/);
  assert.match(trips, /limitingAxes/);
});

test('filter count uses active variant records', () => {
  const filters = fs.readFileSync('assets/js/filters.js', 'utf8');
  assert.match(filters, /B\.currentBySlug\[trip\.slug\] \|\| trip/);
});

test('dynamic evidence dates use the shared display formatter', () => {
  const hub = fs.readFileSync('src/index.njk', 'utf8');
  const evidence = fs.readFileSync('assets/js/evidence.js', 'utf8');
  const meter = fs.readFileSync('assets/js/meter.js', 'utf8');
  assert.ok(hub.indexOf('assets/js/display-date.js') < hub.indexOf('assets/js/evidence.js'));
  assert.match(evidence, /DisplayDate\.format\(trip\.evidence\.reviewedAt\)/);
  assert.match(evidence, /DisplayDate\.format\(fact\.verifiedAt\)/);
  assert.match(meter, /DisplayDate\.format\(t\.evidence\.reviewedAt\)/);
});

test('date-formatting scripts bypass stale offline caches', () => {
  const hub = fs.readFileSync('src/index.njk', 'utf8');
  const serviceWorker = fs.readFileSync('sw.js', 'utf8');
  for (const script of ['display-date.js', 'evidence.js', 'meter.js']) {
    assert.match(hub, new RegExp(`${script.replace('.', '\\.')}\\?v=20260710-dates`));
    assert.match(serviceWorker, new RegExp(`${script.replace('.', '\\.')}\\?v=20260710-dates`));
  }
  assert.match(serviceWorker, /const VERSION = 'tp-v15'/);
  assert.match(serviceWorker, /builder\.js\?v=20260712-composer/);
});

test('offline trip packages have no URL cap and report verified completion', () => {
  const serviceWorker = fs.readFileSync('sw.js', 'utf8');
  const pwa = fs.readFileSync('assets/js/pwa.js', 'utf8');
  assert.doesNotMatch(serviceWorker, /slice\(0,\s*81\)/);
  assert.match(serviceWorker, /const TRIPS = VERSION \+ '-trip-'/);
  assert.match(serviceWorker, /CACHE_TRIP_COMPLETE/);
  assert.match(pwa, /querySelectorAll\('\[data-full\]'\)/);
  assert.match(pwa, /CACHE_TRIP_PROGRESS/);
  assert.match(pwa, /navigator\.storage\.persist/);
  assert.match(serviceWorker, /tripMarker\(data\.tripId\)/);
  const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
  assert.equal(manifest.display, 'standalone');
  for (const page of [
    'mt-rainier-seattle-2026.html',
    'seattle-mount-baker-2026.html',
    'seattle-north-cascades-2026.html',
    'seattle-olympic-2026.html'
  ]) {
    const html = fs.readFileSync(page, 'utf8');
    assert.match(html, /manifest\.webmanifest/);
    assert.match(html, /assets\/js\/pwa\.js/);
    assert.match(html, /data-trip-slug=/);
  }
});

test('ranked and excluded cards provide a wrapping badge container', () => {
  const cards = fs.readFileSync('src/_includes/hub/cards.njk', 'utf8');
  assert.equal((cards.match(/class="sl-tags"/g) || []).length, 2);
});

test('legacy hero-carousel styles bypass stale offline caches', () => {
  const template = fs.readFileSync('src/itinerary.njk', 'utf8');
  const serviceWorker = fs.readFileSync('sw.js', 'utf8');
  assert.match(template, /itinerary\.css\?v=20260710-travel-frame-all/);
  assert.match(serviceWorker, /itinerary\.css\?v=20260710-travel-frame-all/);
});

test('the Pittsburgh commitment keeps its compact month-name label', () => {
  const hub = fs.readFileSync('src/index.njk', 'utf8');
  const config = fs.readFileSync('.eleventy.js', 'utf8');
  assert.match(hub, /<b data-preserve-date>June 24-26<\/b><span>Full days in Pittsburgh protected<\/span>/);
  assert.match(config, /closest\('\[data-preserve-date\]'\)/);
});

test('trip galleries are viewport-sized and prefix captions with itinerary days', () => {
  const template = fs.readFileSync('src/itinerary.njk', 'utf8');
  const styles = fs.readFileSync('assets/css/itinerary.css', 'utf8');
  const script = fs.readFileSync('assets/js/itinerary.js', 'utf8');
  const serviceWorker = fs.readFileSync('sw.js', 'utf8');
  assert.match(styles, /\.trip-gallery-dialog\s*\{[^}]*width:\s*100vw;[^}]*height:\s*100dvh;/s);
  assert.match(script, /caption: 'Day ' \+ day \+ ': ' \+ caption/);
  assert.match(template, /itinerary\.js\?v=20260710-gallery-full/);
  assert.match(serviceWorker, /itinerary\.js\?v=20260710-gallery-full/);
});

test('hero travel frames use compact month-name ranges', () => {
  const config = fs.readFileSync('.eleventy.js', 'utf8');
  const template = fs.readFileSync('src/itinerary.njk', 'utf8');
  assert.match(config, /formatCompactTravelWindow/);
  assert.match(config, /label\.text\('Travel frame'\)/);
  assert.match(config, /data-travel-frame/);
  assert.match(template, /data-trip-slug="\{\{ trip\.slug \}\}"/);
});
