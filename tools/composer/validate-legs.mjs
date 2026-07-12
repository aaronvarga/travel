import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const legsDir = path.join(root, 'src/_data/composer/legs');
const errors = [];
const requiredRoles = new Set(['arrival', 'full', 'flex', 'departure']);
const requiredBudgetRanges = ['lodgingPerNightUsd', 'carPerDayUsd', 'foodPerDayUsd', 'activitiesFlatUsd'];

function fail(file, message) { errors.push(`${file}: ${message}`); }
function rangeOk(value) { return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) && value[0] <= value[1]; }

if (!fs.existsSync(legsDir)) fail('legs', 'directory missing');
const files = fs.existsSync(legsDir) ? fs.readdirSync(legsDir).filter((file) => file.endsWith('.json')).sort() : [];
for (const file of files) {
  const leg = JSON.parse(fs.readFileSync(path.join(legsDir, file), 'utf8'));
  for (const key of ['id', 'name', 'country', 'sourceTrip', 'mapColor']) if (!leg[key]) fail(file, `missing ${key}`);
  if (file !== `${leg.id}.json`) fail(file, 'filename must match id');
  if (!Array.isArray(leg.mapPoints) || !leg.mapPoints.length) fail(file, 'mapPoints must be non-empty');
  if (!leg.gateways?.airports?.length || !leg.gateways.pitOutbound && !leg.gateways.pitReturn) fail(file, 'gateway data missing');
  if (![leg.nights?.min, leg.nights?.canonical, leg.nights?.max].every(Number.isInteger) || leg.nights.min > leg.nights.canonical || leg.nights.canonical > leg.nights.max) fail(file, 'invalid night range');
  if (!Array.isArray(leg.heroImages) || leg.heroImages.length < 2 || leg.heroImages.length > 3) fail(file, 'heroImages must contain 2-3 items');
  for (const key of requiredBudgetRanges) if (!rangeOk(leg.budget?.[key])) fail(file, `invalid budget.${key}`);
  if (!leg.budget?.provenance) fail(file, 'budget provenance missing');
  if (!Array.isArray(leg.days) || !leg.days.length) fail(file, 'days missing');
  for (const [index, day] of (leg.days ?? []).entries()) {
    if (!requiredRoles.has(day.role)) fail(file, `day ${index} invalid role`);
    for (const forbidden of ['id', 'badge', 'eyebrow', 'colorClass']) if (forbidden in day) fail(file, `day ${index} retains ${forbidden}`);
    for (const [spotIndex, spot] of (day.spots ?? []).entries()) {
      if ('carouselId' in spot || 'spotMapHtml' in spot) fail(file, `day ${index} spot ${spotIndex} retains generated fields`);
      if ((spot.images ?? []).length > 3) fail(file, `day ${index} spot ${spotIndex} has more than 3 images`);
      for (const image of spot.images ?? []) {
        const diskPath = path.join(root, image.src.replace(/^\.\.\/\.\.\//, ''));
        if (!fs.existsSync(diskPath)) fail(file, `missing image ${image.src}`);
      }
    }
  }
  if ('_review' in leg || '_budgetLines' in leg) fail(file, 'draft-only fields must be removed');
}

if (!files.length) fail('legs', 'no leg files found');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`validated ${files.length} composer legs`);
