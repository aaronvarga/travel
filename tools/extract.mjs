/**
 * extract.mjs — parse every hand-written itinerary HTML file into structured data
 * for the paginated Eleventy template (src/itinerary.njk).
 *
 * Sidecar layout (per trip <slug>):
 *   src/_data/<slug>/main.json        — the whole page as a verbatim "skeleton" of
 *                                       raw HTML segments interleaved with a small set
 *                                       of regenerated "holes": the structured itinerary,
 *                                       the two guides (referenced), and the ~147 KB Leaflet
 *                                       library (deduped into chrome.json). Also carries the
 *                                       structured itinerary (days/spots/images) and typed
 *                                       mapPoints/mapColors.
 *   src/_data/<slug>/photoGuide.json  — { html } raw #photo-guide section (only if present)
 *   src/_data/<slug>/foodGuide.json   — { html } raw #food-guide  section (only if present)
 *
 * Shared:
 *   src/_data/chrome.json             — { leafletLibs: { <md5>: <script-inner> } }. The Leaflet
 *                                       build is huge and appears (in 2 variants) across trips,
 *                                       so it is stored once and referenced by content hash.
 *
 * Design note (why "verbatim body with holes" instead of a shared chrome + fixed template):
 *   The 16 files are NOT uniform in their boilerplate. The <head> <style>, the main UI script,
 *   the Leaflet build, the body-script count (5 vs 6), and even whether <footer> sits inside or
 *   outside <main> all vary per trip. So anything that is not one of the structured holes is kept
 *   byte-for-byte from that trip's own source. Only the repetitive itinerary is regenerated from
 *   typed data; the guides are relocated to sidecar files but re-emitted verbatim at their exact
 *   original position. The map-data <script> is kept verbatim (its JSON spacing varies compact vs
 *   spaced across trips) while mapPoints/mapColors are still exposed as typed fields.
 *
 * Run:  node tools/extract.mjs
 */
import { load } from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = resolve(ROOT, 'src/_data');

const SLUGS = [
  'balkans', 'california-pacific-coast', 'croatia', 'greece-via-lisbon', 'hawaii',
  'italy-salento-amalfi', 'madeira-crete', 'madeira-sicily', 'portugal', 'portugal-crete',
  'portugal-sicily', 'sardinia-corsica', 'sicily-malta', 'southern-france', 'spain',
  'turkish-riviera',
];

const LIB_MIN_BYTES = 100000; // Leaflet build is ~147 KB; nothing else is close.
const md5 = (s) => createHash('md5').update(s).digest('hex');

const leafletLibs = {}; // md5 -> script inner content (shared across trips)
const report = [];

for (const slug of SLUGS) {
  const SRC = resolve(ROOT, `${slug}/index.html`);
  const html = readFileSync(SRC, 'utf8');
  const $ = load(html, { decodeEntities: false, sourceCodeLocationInfo: true });

  // entity-preserving helpers
  const inner = (el) => (el ? $(el).html() ?? '' : '');
  const outer = (el) => $.html(el);
  const txt = (el) => (el ? $(el).text() : '');
  // Verbatim source slice (byte-exact) — avoids cheerio DOM normalization.
  // NB: with sourceCodeLocationInfo, endIndex is exclusive (one past the closing `>`).
  const rawOuter = (el) => (el && el.startIndex != null ? html.slice(el.startIndex, el.endIndex) : outer(el));

  /* -------- structured itinerary: days -> spots -> images -------- */
  function extractSpot(sp) {
    const $sp = $(sp);
    const name = inner($sp.find('.spot-head .spot-name').get(0));
    const exploreHtml = inner($sp.find('.spot-head .explore').get(0));

    const carEl = $sp.find('> .carousel').get(0);
    const carouselId = $(carEl).attr('id');
    const images = $sp.find('.carousel > .track > figure').map((_, fig) => {
      const $fig = $(fig);
      const a = $fig.find('> a').get(0);
      const img = $fig.find('img').get(0);
      const cap = $fig.find('figcaption');
      return {
        ...(a ? { href: $(a).attr('href') } : {}),
        src: $(img).attr('src'),
        alt: $(img).attr('alt'),
        captionTitle: inner(cap.find('strong').get(0)),
        credit: inner(cap.find('span').get(0)),
      };
    }).get();

    const base = { name, exploreHtml, carouselId, images };

    // Generic fallback: a spot without the standard .spot-grid (e.g. portugal-crete has one
    // spot whose post-carousel body is a bare .note). Keep everything after the carousel verbatim.
    const grid = $sp.find('> .spot-grid').get(0);
    if (!grid) {
      const kids = $sp.children().toArray();
      const ci = kids.indexOf(carEl);
      const rawAfterCarousel = kids.slice(ci + 1).map(rawOuter).join('');
      return { ...base, rawAfterCarousel };
    }

    const info = $sp.find('.spot-info');
    const kvCost = info.find('.kv').first();
    const kvClimate = info.find('.kv.climate').first();
    const save = info.find('.callout.save').first();
    const splurge = info.find('.callout.splurge').first();
    const resto = info.find('.resto').first();
    const altbox = info.find('.altbox').first();
    const bloglinks = info.find('.bloglinks').first();

    const bodyAfterMiniH = (box) =>
      box.children().filter((_, c) => !$(c).hasClass('mini-h')).map((_, c) => outer(c)).get().join('');

    const iframeSrc = $sp.find('iframe.gmap').attr('src') || '';
    const coords = iframeSrc.match(/q=([-\d.]+),([-\d.]+)&/) || ['', '', ''];

    return {
      ...base,
      cost: inner(kvCost.find('p').get(0)),
      climateLabel: txt(kvClimate.find('span').get(0)),
      climate: inner(kvClimate.find('p').get(0)),
      // full callout inner incl. the <b>…</b> label (label carries an emoji in some trips)
      saveHtml: inner(save.get(0)),
      splurgeHtml: inner(splurge.get(0)),
      restoHtml: inner(resto.find('ul').get(0)),
      altboxHtml: bodyAfterMiniH(altbox),
      bloglinksHtml: bodyAfterMiniH(bloglinks),
      lat: coords[1],
      lng: coords[2],
      // The .spot-map inner markup varies per spot/trip (Google-Maps link arrow ↗/↩,
      // iframe zoom z=12..15, iframe title), so keep it verbatim while lat/lng stay typed above.
      spotMapHtml: rawOuter($sp.find('.spot-map').get(0)),
    };
  }

  function extractDay(art) {
    const $d = $(art);
    const cls = ($d.attr('class') || '').split(/\s+/);
    const title = $d.find('.day-title');
    const facts = $d.find('.logistics .facts > div').map((_, d) => ({
      label: txt($(d).find('span').get(0)),
      valueHtml: inner($(d).find('strong').get(0)),
    })).get();
    const travelNote = $d.find('.spots-wrap > .travel-note').get(0);

    return {
      id: $d.attr('id'),
      colorClass: cls.find((c) => /^c\d+$/.test(c)) || '',
      badge: txt($d.find('.day-badge').get(0)),
      eyebrow: inner(title.find('.eyebrow').get(0)),
      heading: inner(title.find('h3').get(0)),
      feel: inner(title.find('.feel').get(0)),
      daycost: inner(title.find('.daycost').get(0)),
      facts,
      note: inner($d.find('.logistics > p.note').get(0)),
      travelNote: travelNote ? inner(travelNote) : null,
      spots: $d.find('.spots-wrap > section.spot').map((_, sp) => extractSpot(sp)).get(),
    };
  }

  const itinSection = $('#itinerary');
  const itinerary = {
    className: itinSection.attr('class') || '',
    labelHtml: inner(itinSection.find('> .section-label').get(0)),
    daysClass: itinSection.find('> .days').attr('class') || 'days',
    days: itinSection.find('> .days > article.day').map((_, a) => extractDay(a)).get(),
  };

  /* -------- typed map data (kept verbatim in the skeleton; typed here too) -------- */
  let mapPoints = [];
  let mapColors = {};
  $('body > script').each((_, s) => {
    const c = inner(s);
    if (!/__MAP_POINTS__\s*=\s*\[/.test(c)) return;
    const mp = c.match(/window\.__MAP_POINTS__\s*=\s*(\[[\s\S]*?\]);/);
    const mc = c.match(/window\.__MAP_COLORS__\s*=\s*(\{[\s\S]*?\});/);
    if (mp) mapPoints = JSON.parse(mp[1]);
    if (mc) mapColors = JSON.parse(mc[1]);
  });

  /* -------- collect "holes" (elements the template regenerates / relocates) -------- */
  const holes = [];
  const push = (el, extra) => { if (el) holes.push({ startIndex: el.startIndex, endIndex: el.endIndex, ...extra }); };

  push($('#itinerary').get(0), { t: 'itinerary' });

  const photoEl = $('#photo-guide').get(0);
  const foodEl = $('#food-guide').get(0);
  const photoGuide = photoEl ? { html: rawOuter(photoEl) } : null;
  const foodGuide = foodEl ? { html: rawOuter(foodEl) } : null;
  push(photoEl, { t: 'photoGuide' });
  push(foodEl, { t: 'foodGuide' });

  // Leaflet library: any bare <script> whose inner content is large. Dedupe by content hash.
  $('body > script').each((_, s) => {
    const c = inner(s);
    if (c.length < LIB_MIN_BYTES) return;
    const bare = Object.keys(s.attribs || {}).length === 0; // only dedupe attribute-free <script>
    if (!bare) return;
    const key = md5(c);
    leafletLibs[key] = c;
    push(s, { t: 'lib', key });
  });

  /* -------- build the verbatim skeleton: raw segments + holes, in document order -------- */
  holes.sort((a, b) => a.startIndex - b.startIndex);
  for (let i = 1; i < holes.length; i++) {
    if (holes[i].startIndex < holes[i - 1].endIndex) {
      throw new Error(`[${slug}] overlapping holes: ${holes[i - 1].t} / ${holes[i].t}`);
    }
  }
  const parts = [];
  let cursor = 0;
  for (const h of holes) {
    if (h.startIndex > cursor) parts.push({ t: 'raw', html: html.slice(cursor, h.startIndex) });
    const { startIndex, endIndex, ...rest } = h;
    parts.push(rest);
    cursor = endIndex;
  }
  if (cursor < html.length) parts.push({ t: 'raw', html: html.slice(cursor) });

  const main = {
    slug,
    lang: $('html').attr('lang') || 'en',
    title: txt($('head > title').get(0)),
    hasPhotoGuide: !!photoGuide,
    hasFoodGuide: !!foodGuide,
    mapPoints,
    mapColors,
    itinerary,
    parts,
  };

  /* -------- write sidecar files -------- */
  const outDir = resolve(DATA_DIR, slug);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'main.json'), JSON.stringify(main, null, 2));
  if (photoGuide) writeFileSync(resolve(outDir, 'photoGuide.json'), JSON.stringify(photoGuide, null, 2));
  if (foodGuide) writeFileSync(resolve(outDir, 'foodGuide.json'), JSON.stringify(foodGuide, null, 2));

  const nSpots = itinerary.days.reduce((a, d) => a + d.spots.length, 0);
  const nImgs = itinerary.days.reduce((a, d) => a + d.spots.reduce((b, s) => b + (s.images ? s.images.length : 0), 0), 0);
  const kb = (o) => o ? (JSON.stringify(o).length / 1024).toFixed(1) : '-';
  report.push({
    slug,
    days: itinerary.days.length,
    spots: nSpots,
    imgs: nImgs,
    pts: mapPoints.length,
    parts: parts.length,
    htmlKB: (html.length / 1024).toFixed(1),
    mainKB: kb(main),
    photoKB: kb(photoGuide),
    foodKB: kb(foodGuide),
  });
}

/* -------- shared chrome (Leaflet libs only) -------- */
writeFileSync(resolve(DATA_DIR, 'chrome.json'), JSON.stringify({ leafletLibs }, null, 2));

// remove the old single-trip prototype data if present
for (const stale of ['portugal.json']) {
  const p = resolve(DATA_DIR, stale);
  if (existsSync(p)) rmSync(p);
}

console.table(report);
console.log(`leaflet variants deduped into chrome.json: ${Object.keys(leafletLibs).length} (${Object.entries(leafletLibs).map(([k, v]) => `${k.slice(0, 8)}=${(v.length / 1024).toFixed(0)}KB`).join(', ')})`);
