const fs = require('fs');
const path = require('path');
const hub = require('./hub.js');
const shortTrips = require('./shortTrips.js');
const slugs = new Set(['sicily', 'venice-rome-sicily', 'sicily-rome', 'portugal-sicily', 'madeira-sicily', 'portugal-algarve-sicily', 'sicily-malta', 'short-sicily', 'madeira-mallorca']);
module.exports = () => {
  const ranked = hub().activeTrips.filter(trip => slugs.has(trip.slug));
  const short = shortTrips().filter(trip => slugs.has(trip.slug)).map(trip => {
    const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, trip.slug, 'evidence.json'), 'utf8'));
    return { ...trip, short: true, totalBaked: trip.shortScore, cardImageAlt: trip.heroAlt,
      cardSummary: trip.shortVerdict, evidence, completeness: { complete: 17, total: 17 },
      display: { fireChance: trip.fireRisk.chanceBand } };
  });
  return [...ranked, ...short];
};
