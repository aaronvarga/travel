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

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'assets/css': 'assets/css' });
  eleventyConfig.addPassthroughCopy({ 'assets/js': 'assets/js' });
  eleventyConfig.addPassthroughCopy({ 'assets/generated': 'assets/generated' });
  eleventyConfig.addPassthroughCopy({ 'assets/aaron-amanda-sedona.png': 'assets/aaron-amanda-sedona.png' });
  eleventyConfig.addPassthroughCopy({ 'assets/family-cartoon.png': 'assets/family-cartoon.png' });
  for (const file of ['budget-reconciliation.json', 'rank-analysis.json', 'section-status.json', 'trips-summary.json']) {
    eleventyConfig.addPassthroughCopy({ [`assets/${file}`]: `assets/${file}` });
  }
  eleventyConfig.addPassthroughCopy({ 'sw.js': 'sw.js' });
  eleventyConfig.addFilter('moneyK', (value) => {
    const amount = Number(value) / 1000;
    const digits = Number(value) % 1000 === 0 ? 0 : Number(value) % 100 === 0 ? 1 : 2;
    return `$${amount.toFixed(digits).replace(/\.0+$/, '')}k`;
  });
  eleventyConfig.addFilter('roundHours', (value) => Math.round(Number(value)));

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

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
};
