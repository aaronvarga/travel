const fs = require('fs');
const path = require('path');
const Engine = require('../../assets/js/recommendation-engine.js');

const SHORT_TRIP_SLUGS = [
  'short-puerto-rico',
  'short-iceland',
  'short-portugal',
  'short-algarve',
  'short-madeira',
  'short-azores',
  'short-acadia',
  'short-alaska',
];
const SHORT_WEIGHTS = {
  budget: 2,
  ease: 2,
  weather: 1,
  swim: 1,
  variety: 1,
  food: 1,
  risk: 1,
  pto: 1,
};
const SHORT_VERDICTS = {
  'short-puerto-rico': 'Best warm-water week: Old San Juan, rainforest and easy beach days, with hurricane-season risk to manage.',
  'short-algarve': 'Best pure ease-and-value week: one base, pool access, and flexible coast days.',
  'short-portugal': 'Best overall balance of cost, easy rail travel, food, and optional beach time.',
  'short-azores': 'Best one-base volcanic week: crater lakes and thermal swims, with the Boston connection still to verify.',
  'short-madeira': 'Best one-base scenery trip, just one point behind because swimming is less dependable.',
  'short-acadia': 'Best domestic nature week: major coastal scenery, with cold water and the Portland drive as the tradeoffs.',
  'short-iceland': 'Best nonstop adventure, with colder weather and higher disruption risk as the tradeoff.',
  'short-alaska': 'The biggest scenery on this list and the worst fit for it: tidewater glaciers and whales, but the highest cost, the coldest water, and the only connecting flight.',
};

module.exports = function () {
  const profile = readJson(path.join(__dirname, 'decisionProfile.json'));

  const trips = SHORT_TRIP_SLUGS.map((slug) => {
    const base = path.join(__dirname, slug);
    const mainPath = path.join(base, 'main.json');
    const evidencePath = path.join(base, 'evidence.json');
    if (!fs.existsSync(mainPath) || !fs.existsSync(evidencePath)) return null;

    const main = readJson(mainPath);
    const evidence = readJson(evidencePath);
    const image = firstHeroImage(main.parts?.[0]?.html || '');
    if (!image) throw new Error(`${slug}: short-trip card needs a hero image`);

    return {
      slug,
      href: `locations/${slug}/index.html`,
      displayName: main.scorecard.displayName,
      blurb: main.scorecard.blurb,
      budget: main.scorecard.budget,
      pto: main.scorecard.pto,
      facets: main.scorecard.facets,
      travelWindow: profile.tripWindows[slug],
      routeReadiness: profile.routeReadiness[slug] || 'current-proxy',
      readiness: Engine.readiness({
        ...main.scorecard,
        routeReadiness: profile.routeReadiness[slug] || 'current-proxy',
        completeness: { complete: 17, total: 17 },
        evidence,
      }),
      metrics: evidence.metrics,
      heroImage: normalizeImagePath(image.src),
      heroAlt: image.alt,
      shortScore: shortScore(main.scorecard.axes),
      shortVerdict: SHORT_VERDICTS[slug],
    };
  }).filter(Boolean).sort((a, b) =>
    b.shortScore - a.shortScore ||
    a.pto.days - b.pto.days ||
    a.budget.ceilUsd - b.budget.ceilUsd ||
    a.budget.floorUsd - b.budget.floorUsd
  );

  trips.forEach((trip, index) => { trip.shortRank = index + 1; });
  return trips;
};

function shortScore(axes) {
  return Object.entries(SHORT_WEIGHTS)
    .reduce((total, [axis, weight]) => total + (axes[axis] || 0) * weight, 0);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function firstHeroImage(html) {
  const tag = html.match(/<img\b[^>]*>/i)?.[0];
  if (!tag) return null;
  const src = tag.match(/\bsrc="([^"]+)"/i)?.[1];
  const alt = tag.match(/\balt="([^"]*)"/i)?.[1];
  return src ? { src, alt: alt || '' } : null;
}

function normalizeImagePath(src) {
  return src.replace(/^\.\.\/\.\.\//, '');
}
