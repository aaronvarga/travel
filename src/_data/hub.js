const fs = require('fs');
const path = require('path');
const Engine = require('../../assets/js/recommendation-engine.js');
const cardImages = require('./card-images.js');
const cardSummaries = require('./card-summaries.js');

module.exports = function () {
  const root = path.resolve(__dirname, '../..');
  const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'trips-summary.json'), 'utf8'));
  const analysisPath = path.join(root, 'assets', 'rank-analysis.json');
  const analysis = fs.existsSync(analysisPath) ? JSON.parse(fs.readFileSync(analysisPath, 'utf8')) : null;
  const weights = Object.fromEntries(summary.axes.map((axis) => [axis.id, axis.weightDefault]));
  const orderedTrips = [...summary.trips]
    .sort((a, b) => Engine.compareDefault(a, b, summary.axes, weights, summary.budgetTargets))
    .map((trip, index) => {
      const cardImage = cardImages[trip.slug];
      if (!cardImage?.path || !cardImage?.alt) {
        throw new Error(`${trip.slug}: missing its required flagship card image`);
      }
      if (!cardImage.path.startsWith('assets/img/') || !fs.existsSync(path.join(root, cardImage.path))) {
        throw new Error(`${trip.slug}: card image is not a present self-hosted asset (${cardImage.path})`);
      }
      const cardSummary = cardSummaries[trip.slug];
      if (typeof cardSummary !== 'string' || cardSummary.length < 90 || cardSummary.length > 240 || !cardSummary.endsWith('.')) {
        throw new Error(`${trip.slug}: missing a complete one-sentence card summary`);
      }
      return {
      ...trip,
      appealRank: trip.excluded ? null : index + 1,
      heroImage: cardImage.path,
      cardImageAlt: cardImage.alt,
      cardSummary,
      display: {
        weatherTempF: trip.evidence?.facts?.find((fact) => fact.id === 'climate-proxy')?.value?.temperatureF || null,
        fireChance: trip.evidence?.facts?.find((fact) => fact.id === 'wildfire-exposure')?.value?.chanceBand || null,
        swimTempF: trip.facets.swimTempF,
      },
      };
    });
  const active = orderedTrips.filter((trip) => !trip.excluded);
  const excluded = orderedTrips.filter((trip) => trip.excluded);
  return { ...summary, orderedTrips, activeTrips: active, excludedTrips: excluded, analysis };
};
