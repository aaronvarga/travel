/**
 * Eleventy config for the itinerary generator.
 *   input:  src/
 *   output: _site/
 * src/itinerary.njk paginates over the `trips` data (src/_data/trips.js) and regenerates
 * every <slug>/index.html from src/_data/<slug>/*.json (+ shared src/_data/chrome.json),
 * produced by tools/extract.mjs.
 */
const { readFileSync } = require('node:fs');
const { load } = require('cheerio');
const { formatDisplayDates, formatCompactTravelWindow } = require('./tools/lib/display-date.cjs');
const { syncHeroCarousel } = require('./tools/lib/hero-carousel.cjs');
const decisionProfile = require('./src/_data/decisionProfile.json');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'assets/css': 'assets/css' });
  eleventyConfig.addPassthroughCopy({ 'assets/js': 'assets/js' });
  eleventyConfig.addPassthroughCopy({ 'assets/generated': 'assets/generated' });
  eleventyConfig.addPassthroughCopy({ 'assets/img/mt-rainier-seattle-2026': 'assets/img/mt-rainier-seattle-2026' });
  eleventyConfig.addPassthroughCopy({ 'assets/data/mt-rainier-seattle-2026-weather-history.json': 'assets/data/mt-rainier-seattle-2026-weather-history.json' });
  eleventyConfig.addPassthroughCopy({ 'assets/aaron-amanda-sedona.png': 'assets/aaron-amanda-sedona.png' });
  eleventyConfig.addPassthroughCopy({ 'assets/family-cartoon.png': 'assets/family-cartoon.png' });
  eleventyConfig.addPassthroughCopy({ 'mt-rainier-seattle-2026.html': 'mt-rainier-seattle-2026.html' });
  for (const file of ['budget-reconciliation.json', 'rank-analysis.json', 'section-status.json', 'trips-summary.json']) {
    eleventyConfig.addPassthroughCopy({ [`assets/${file}`]: `assets/${file}` });
  }
  eleventyConfig.addPassthroughCopy({ 'sw.js': 'sw.js' });
  eleventyConfig.addFilter('moneyK', (value) => {
    const amount = Number(value) / 1000;
    const digits = Number(value) % 1000 === 0 ? 0 : Number(value) % 100 === 0 ? 1 : 2;
    return `$${amount.toFixed(digits).replace(/\.0+$/, '')}k`;
  });
  eleventyConfig.addFilter('money', (value) => `$${Number(value).toLocaleString('en-US')}`);
  eleventyConfig.addFilter('roundHours', (value) => Math.round(Number(value)));
  eleventyConfig.addFilter('displayDate', formatDisplayDates);
  eleventyConfig.addFilter('jsonForScript', (value) => JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029'));

  eleventyConfig.addTransform('all-trip-photos-in-hero', function (content) {
    if (!this.page.outputPath?.includes('/locations/') || !this.page.outputPath.endsWith('.html')) return content;
    const $ = load(content, { decodeEntities: false });
    const shortTrip = this.page.outputPath.includes('/locations/short-');
    syncHeroCarousel($, shortTrip ? { maxPhotos: 10 } : undefined);
    return $.html();
  });

  eleventyConfig.addTransform('responsive-local-images', function (content) {
    if (!this.page.outputPath?.endsWith('.html')) return content;
    const manifest = JSON.parse(readFileSync('assets/generated/image-manifest.json', 'utf8'));
    const $ = load(content, { decodeEntities: false });
    const prefix = this.page.outputPath.includes('/locations/') ? '../../' : '';
    const keyFor = (url) => {
      const index = String(url || '').indexOf('assets/img/');
      return index < 0 ? null : String(url).slice(index).split(/[?#]/)[0];
    };
    const urlFor = (url) => prefix + url;
    const setFor = (items) => items.map((item) => `${urlFor(item.url)} ${item.width}w`).join(', ');
    const matched = [];
    $('img[src]').each((_, element) => {
      const image = $(element);
      const key = keyFor(image.attr('src'));
      const entry = key && manifest.images[key];
      if (!entry) return;
      matched.push(image);
      const jpeg = entry.variants.jpeg.at(-1);
      image.attr({ src: urlFor(jpeg.url), srcset: setFor(entry.variants.webp), sizes: '(max-width: 700px) 100vw, 900px', width: entry.width, height: entry.height, loading: 'lazy', decoding: 'async' });
      const inCarousel = image.closest('.carousel').length > 0;
      if (inCarousel) image.removeAttr('width').removeAttr('height');
      const parentLink = image.closest('a');
      if (keyFor(parentLink.attr('href')) === key) parentLink.attr('href', urlFor(jpeg.url));
      // Existing carousel CSS and JS expect <img> to remain the slide media
      // node. Keep its responsive WebP srcset without inserting a wrapper.
      if (!inCarousel && !image.parent().is('picture')) {
        const picture = $('<picture></picture>');
        picture.append($('<source>').attr({ type: 'image/avif', srcset: setFor(entry.variants.avif), sizes: '(max-width: 700px) 100vw, 900px' }));
        picture.append($('<source>').attr({ type: 'image/webp', srcset: setFor(entry.variants.webp), sizes: '(max-width: 700px) 100vw, 900px' }));
        image.before(picture);
        picture.append(image);
      }
    });
    const hero = matched.find((image) => image.closest('header,.preview').length) || matched[0];
    if (hero) hero.attr({ loading: 'eager', fetchpriority: 'high' });
    let html = $.html();
    for (const [source, entry] of Object.entries(manifest.images)) {
      const replacement = entry.variants.jpeg.at(-1).url;
      html = html.split(source).join(replacement);
    }
    return html;
  });

  eleventyConfig.addTransform('display-dates', function (content) {
    if (!this.page.outputPath?.endsWith('.html')) return content;
    const $ = load(content, { decodeEntities: false });
    const slug = this.page.url?.match(/^\/locations\/([^/]+)\//)?.[1]
      || this.page.outputPath?.match(/[\\/]locations[\\/]([^\\/]+)[\\/]index\.html$/)?.[1]
      || $('[data-trip-slug]').first().attr('data-trip-slug');
    const travelWindow = slug && decisionProfile.tripWindows[slug];
    const compactWindow = formatCompactTravelWindow(travelWindow);
    const stats = $('.pv-stats,.hero-meta').first();
    if (compactWindow && stats.length) {
      let block = stats.find('> div').filter((_, element) => /^\d{4}(?:\s+travel frame)?$/i.test($(element).find('span').last().text().trim())).first();
      if (!block.length) block = $('<div></div>').appendTo(stats);
      block.attr('data-travel-frame', '');
      let range = block.find('b').first();
      if (!range.length) range = $('<b></b>').prependTo(block);
      range.attr('data-preserve-date', '').text(compactWindow);
      let label = block.find('span').last();
      if (!label.length) label = $('<span></span>').appendTo(block);
      label.text('Travel frame');
      stats.addClass('has-travel-frame');
    }
    $('body').find('*').addBack().contents().each((_, node) => {
      if (node.type !== 'text') return;
      const parentTag = node.parent?.name?.toLowerCase();
      if (['script', 'style', 'template', 'noscript'].includes(parentTag)) return;
      if ($(node.parent).closest('[data-preserve-date]').length) return;
      node.data = formatDisplayDates(node.data);
    });
    return $.html();
  });

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
};
