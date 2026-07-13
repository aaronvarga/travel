import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { load } from 'cheerio';

const require = createRequire(import.meta.url);
const { syncHeroCarousel } = require('../lib/hero-carousel.cjs');

test('existing heroes receive every unique trip photo without duplicates', () => {
  const $ = load('<body><section class="preview"><div class="carousel pvcar"><div class="track"><figure><img src="hero.jpg" alt="Hero"></figure></div><div class="counter"></div></div></section><main><div id="itinerary"><div class="carousel"><figure><img src="hero.jpg"></figure><figure><img src="day.jpg" alt="Day"></figure></div></div><img class="bimg" src="base.jpg" alt="Base"></main></body>');
  const result = syncHeroCarousel($);
  assert.equal(result.count, 3);
  assert.deepEqual($('.pvcar .track img').map((_, image) => $(image).attr('src')).get(), ['hero.jpg', 'day.jpg', 'base.jpg']);
  assert.equal($('.pvcar').attr('data-n'), '3');
  assert.equal($('.pvcar .dot').length, 3);
});

test('legacy background heroes are promoted to full carousels', () => {
  const $ = load('<html><head><style>header::before{background:url("hero.jpg") center/cover}</style></head><body><header><div class="hero-inner"><h1>Legacy Trip</h1></div></header><main><div class="carousel"><figure><img src="day.jpg" alt="Day"></figure></div></main></body></html>');
  const result = syncHeroCarousel($);
  assert.equal(result.created, true);
  assert.equal($('body > header.legacy-trip-hero > .pvcar').length, 1);
  assert.deepEqual($('.pvcar .track img').map((_, image) => $(image).attr('src')).get(), ['hero.jpg', 'day.jpg']);
});

test('curated short-trip heroes keep an explicit ten-photo limit', () => {
  const figures = Array.from({ length: 12 }, (_, index) => `<figure><img src="photo-${index}.jpg" alt="Photo ${index}"></figure>`).join('');
  const $ = load(`<body><section class="preview"><div class="carousel pvcar"><div class="track">${figures}</div><div class="counter"></div></div></section></body>`);
  const result = syncHeroCarousel($, { maxPhotos: 10 });
  assert.equal(result.count, 10);
  assert.equal($('.pvcar figure').length, 10);
  assert.equal($('.pvcar').attr('data-n'), '10');
  assert.equal($('.pvcar').attr('data-curated-photos'), 'true');
  assert.equal($('.pvcar').attr('data-all-trip-photos'), undefined);
});
