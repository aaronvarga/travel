/**
 * Eleventy config for the itinerary generator.
 *   input:  src/
 *   output: _site/
 * src/itinerary.njk paginates over the `trips` data (src/_data/trips.js) and regenerates
 * every <slug>/index.html from src/_data/<slug>/*.json (+ shared src/_data/chrome.json),
 * produced by tools/extract.mjs.
 */
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'index.html': 'index.html' });

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
  };
};
