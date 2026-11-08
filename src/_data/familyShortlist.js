const fs = require('fs');
const path = require('path');
const images = require('./card-images.js');
const slugs = ['venice-rome-sicily', 'sicily-rome', 'portugal-sicily', 'madeira-sicily', 'portugal-algarve-sicily', 'switzerland-sicily', 'sicily-malta', 'short-sicily', 'madeira-mallorca'];
module.exports = () => slugs.map(slug => {
  const main = JSON.parse(fs.readFileSync(path.join(__dirname, slug, 'main.json'), 'utf8'));
  return { slug, image: images[slug]?.path || 'assets/img/short-sicily/ortigia-maniace-aerial.jpg', ...main.scorecard, short: main.tripCategory === 'short' };
});
