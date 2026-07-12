import fs from 'node:fs';
import path from 'node:path';
import { estimateScorecard } from './estimate-scorecard.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, 'src/_data/composer');
const combos = JSON.parse(fs.readFileSync(path.join(dir, 'combos.json'), 'utf8'));
const edges = JSON.parse(fs.readFileSync(path.join(dir, 'edges.json'), 'utf8')).edges;
const legs = new Map(fs.readdirSync(path.join(dir, 'legs')).filter((file) => file.endsWith('.json')).map((file) => {
  const leg = JSON.parse(fs.readFileSync(path.join(dir, 'legs', file), 'utf8'));
  return [leg.id, leg];
}));
const realSlugs = new Set(fs.readdirSync(path.join(root, 'src/_data')).filter((slug) => fs.existsSync(path.join(root, 'src/_data', slug, 'main.json'))));
const errors = [];
const unique = (values) => new Set(values).size === values.length;

for (const edge of edges) if (!legs.has(edge.from) || !legs.has(edge.to)) errors.push(`edge ${edge.id} references a missing leg`);
for (const combo of combos) {
  const prefix = combo.slug;
  const a = legs.get(combo.startId); const b = legs.get(combo.partnerId); const edge = edges.find((item) => item.id === combo.transfer.id);
  if (!a?.gateways?.pitOutbound || !b?.gateways?.pitReturn) errors.push(`${prefix}: gateway contract failed`);
  if (realSlugs.has(combo.slug)) errors.push(`${prefix}: collides with a real trip`);
  if (combo.returnDate > '2027-06-23') errors.push(`${prefix}: returns after blackout cutoff`);
  if (combo.totalNights !== combo.legNightsA + combo.edgeNights + combo.legNightsB) errors.push(`${prefix}: night math failed`);
  if (combo.calendarDays !== combo.totalNights + 2 || combo.itinerary.days.length !== combo.calendarDays + 1) errors.push(`${prefix}: timeline length failed`);
  const ids = combo.itinerary.days.map((day) => day.id); const sections = combo.itinerary.days.map((day) => day.sectionId);
  const carousels = combo.itinerary.days.flatMap((day) => day.spots.map((spot) => spot.carouselId));
  if (!unique(ids) || !unique(sections) || !unique(carousels)) errors.push(`${prefix}: duplicate generated ids`);
  const images = combo.itinerary.days.flatMap((day) => day.spots.flatMap((spot) => spot.images.map((image) => image.src)));
  if (!unique(images)) errors.push(`${prefix}: duplicate itinerary image src`);
  for (const src of [...images, ...combo.heroImages.map((image) => image.src)]) if (!fs.existsSync(path.join(root, src.replace(/^\.\.\/\.\.\//, '')))) errors.push(`${prefix}: missing image ${src}`);
  if (combo.heroImages.length > 6) errors.push(`${prefix}: too many hero images`);
  const floor = combo.budgetRows.reduce((sum, row) => sum + row.floorUsd, 0); const ceil = combo.budgetRows.reduce((sum, row) => sum + row.ceilUsd, 0);
  if (floor !== combo.budget.floorUsd || ceil !== combo.budget.ceilUsd || floor > ceil) errors.push(`${prefix}: budget rollup failed`);
  const derived = estimateScorecard({ legA: a, legB: b, edge, totalNights: combo.totalNights, budget: combo.budget, departDate: combo.departDate, returnDate: combo.returnDate });
  if (JSON.stringify(derived) !== JSON.stringify(combo.scorecard)) errors.push(`${prefix}: scorecard derivation failed`);
  if (!Number.isInteger(combo.scorecard.pto.days) || combo.scorecard.pto.days < 5 || combo.scorecard.pto.days > 11) errors.push(`${prefix}: PTO range invalid`);
}
if (!unique(combos.map((combo) => combo.slug))) errors.push('duplicate combo slugs');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`validated ${combos.length} composed trips`);
