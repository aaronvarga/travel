import fs from 'node:fs';
import path from 'node:path';
import { estimateScorecard } from './estimate-scorecard.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const composerDir = path.join(root, 'src/_data/composer');
const legsDir = path.join(composerDir, 'legs');
const legs = new Map(fs.readdirSync(legsDir).filter((file) => file.endsWith('.json')).map((file) => {
  const leg = JSON.parse(fs.readFileSync(path.join(legsDir, file), 'utf8'));
  return [leg.id, leg];
}));
const edgeData = JSON.parse(fs.readFileSync(path.join(composerDir, 'edges.json'), 'utf8'));

const addDays = (iso, days) => {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

function allocateNights(a, b, edgeNights) {
  let legNightsA = a.nights.canonical;
  let legNightsB = b.nights.canonical;
  while (legNightsA + edgeNights + legNightsB > 13) {
    if (legNightsA > a.nights.min) legNightsA -= 1;
    else if (legNightsB > b.nights.min) legNightsB -= 1;
    else return null;
  }
  while (legNightsA + edgeNights + legNightsB < 11) {
    if (legNightsB < b.nights.max) legNightsB += 1;
    else if (legNightsA < a.nights.max) legNightsA += 1;
    else return null;
  }
  return { legNightsA, legNightsB };
}

function budgetRows(a, b, edge, legNightsA, legNightsB) {
  const rows = [];
  const add = (label, range) => rows.push({ id: `budget-${rows.length + 1}`, label, floorUsd: Math.round(range[0]), ceilUsd: Math.round(range[1]) });
  add(`${a.name} lodging`, a.budget.lodgingPerNightUsd.map((value) => value * legNightsA));
  add(`${a.name} car/local transport`, a.budget.carPerDayUsd.map((value) => value * (legNightsA + 1)));
  add(`${a.name} food`, a.budget.foodPerDayUsd.map((value) => value * (legNightsA + 1)));
  add(`${a.name} activities`, a.budget.activitiesFlatUsd);
  if (edge.buffer?.nights) add(`${edge.buffer.city} buffer lodging`, edge.buffer.lodgingPerNightUsd.map((value) => value * edge.buffer.nights));
  add('Mid-trip transfer', edge.familyCostUsd);
  add(`${b.name} lodging`, b.budget.lodgingPerNightUsd.map((value) => value * legNightsB));
  add(`${b.name} car/local transport`, b.budget.carPerDayUsd.map((value) => value * (legNightsB + 1)));
  add(`${b.name} food`, b.budget.foodPerDayUsd.map((value) => value * (legNightsB + 1)));
  add(`${b.name} activities`, b.budget.activitiesFlatUsd);
  add('PIT outbound gateway', a.gateways.pitOutbound.familyCostUsd);
  add('PIT return gateway', b.gateways.pitReturn.familyCostUsd);
  return rows;
}

function chooseLocalDays(leg, count, excludeRole) {
  const eligible = leg.days.filter((day) => day.role !== excludeRole);
  const chosen = eligible.slice(0, count).map((day) => structuredClone(day));
  while (chosen.length < count) {
    chosen.push({ role: 'flex', heading: `${leg.name} flex day`, feel: 'Weather and energy buffer', daycost: 'Flexible', facts: [], note: `Keep this day open for weather, rest, or a favorite ${leg.name} repeat.`, travelNote: null, spots: [] });
  }
  return chosen;
}

function transferDays(edge, template) {
  return template.pattern.map((note, index) => ({ role: 'transfer', heading: index === 0 ? `${edge.from} → ${edge.to}` : `Continue to ${edge.to}`, feel: edge.mode === 'ferry' ? 'Ferry transfer' : 'Flight transfer', daycost: `Transfer included in ${edge.id} budget`, facts: [{ label: 'Route', valueHtml: edge.via.length ? `via ${edge.via.join(' + ')}` : 'Direct when scheduled' }, { label: 'Watch', valueHtml: edge.schedule2027 }], note, travelNote: edge.watch, spots: [] }));
}

function finalizeDays(slug, departDate, a, b, edge, template, legNightsA, legNightsB, calendarDays) {
  const seenImages = new Set();
  const days = [
    { role: 'departure', heading: 'Depart Pittsburgh after work', feel: 'Overnight travel', daycost: 'Airport meals and ground transport', facts: [{ label: 'Gateway', valueHtml: a.gateways.pitOutbound.route }], note: a.gateways.pitOutbound.notes, travelNote: 'Overnight flight', spots: [] },
    ...chooseLocalDays(a, legNightsA, template.replacesFromDeparture ? 'departure' : null),
    ...transferDays(edge, template),
    ...chooseLocalDays(b, Math.max(0, legNightsB - (template.replacesToArrival ? 1 : 0)), template.replacesToArrival ? 'arrival' : null),
    { role: 'return', heading: `Depart ${b.name} for Pittsburgh`, feel: 'Return flight', daycost: 'Airport meals and transfers', facts: [{ label: 'Gateway', valueHtml: b.gateways.pitReturn.route }], note: b.gateways.pitReturn.notes, travelNote: 'Return flight', spots: [] },
    { role: 'home', heading: 'Arrive home', feel: 'Trip complete', daycost: '—', facts: [{ label: 'Commitment', valueHtml: 'Back before the June 24-26 Pittsburgh blackout' }], note: 'Keep the next full day protected in Pittsburgh.', travelNote: null, spots: [] },
  ];
  if (days.length !== calendarDays + 1) throw new Error(`${slug}: timeline generated ${days.length}, expected ${calendarDays + 1}`);
  return days.map((day, index) => {
    const date = new Date(`${addDays(departDate, index)}T12:00:00Z`);
    const colorClass = day.role === 'transfer' ? 'c2' : index <= legNightsA ? 'c1' : 'c3';
    const spots = (day.spots ?? []).map((spot) => {
      const images = (spot.images ?? []).filter((image) => !seenImages.has(image.src));
      images.forEach((image) => seenImages.add(image.src));
      return { ...spot, images };
    }).filter((spot) => spot.images.length).map((spot, spotIndex) => ({ ...spot, carouselId: `${slug}-d${index}-s${spotIndex + 1}` }));
    return { ...day, badge: String(index), id: `day${index}`, sectionId: `${slug}-day-${index}`, eyebrow: `${date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })} - ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`, colorClass, spots };
  });
}

const combos = [];
for (const edge of edgeData.edges.filter((item) => item.enabled !== false).sort((a, b) => a.id.localeCompare(b.id))) {
  const a = legs.get(edge.from);
  const b = legs.get(edge.to);
  if (!a?.gateways?.pitOutbound || !b?.gateways?.pitReturn) continue;
  const template = edgeData.transferTemplates[edge.transferTemplate];
  const edgeNights = edge.buffer?.nights ?? 0;
  const allocation = allocateNights(a, b, edgeNights);
  if (!allocation) continue;
  const totalNights = allocation.legNightsA + edgeNights + allocation.legNightsB;
  const calendarDays = totalNights + 2;
  const departDate = ['2027-06-06', '2027-06-07', '2027-06-08', '2027-06-09', '2027-06-10'].find((date) => addDays(date, calendarDays) <= '2027-06-23');
  if (!departDate) continue;
  const returnDate = addDays(departDate, calendarDays);
  const slug = `combo--${a.id}--${b.id}`;
  const rows = budgetRows(a, b, edge, allocation.legNightsA, allocation.legNightsB);
  const budget = { floorUsd: rows.reduce((sum, row) => sum + row.floorUsd, 0), ceilUsd: rows.reduce((sum, row) => sum + row.ceilUsd, 0) };
  const scorecard = estimateScorecard({ legA: a, legB: b, edge, totalNights, budget, departDate, returnDate });
  combos.push({
    slug, title: `${a.name} + ${b.name} — composed draft`, startId: a.id, partnerId: b.id,
    startName: a.name, partnerName: b.name, sourceRefs: [...new Set([a.sourceTrip, b.sourceTrip])],
    departDate, returnDate, legNightsA: allocation.legNightsA, legNightsB: allocation.legNightsB, edgeNights, totalNights, calendarDays,
    heroImages: [...a.heroImages, ...b.heroImages].slice(0, 6), mapPoints: [...a.mapPoints, ...b.mapPoints], mapColors: { [a.id]: a.mapColor, transfer: '#c25a3a', [b.id]: b.mapColor },
    budget: { ...budget, targetUsd: 12000, preferredMaxUsd: 15000 }, budgetRows: rows, scorecard,
    transfer: { id: edge.id, mode: edge.mode, hours: edge.hours, complexity: edge.complexity, risk: edge.risk, watch: edge.watch, via: edge.via },
    itinerary: { className: 'itinerary composed-itinerary', labelHtml: `<p class="eyebrow">Day by day</p><h2>${a.name} + ${b.name}</h2>`, daysClass: 'days', days: finalizeDays(slug, departDate, a, b, edge, template, allocation.legNightsA, allocation.legNightsB, calendarDays) },
  });
}

combos.sort((a, b) => a.slug.localeCompare(b.slug));
const index = combos.map(({ slug, title, startId, partnerId, startName, partnerName, totalNights, budget, scorecard, transfer }) => ({ slug, title, startId, partnerId, startName, partnerName, totalNights, budget, score: scorecard.totalBaked, transferRisk: transfer.risk }));
const starts = [...new Map(index.map((item) => [item.startId, { id: item.startId, name: item.startName }])).values()];
fs.writeFileSync(path.join(composerDir, 'combos.json'), `${JSON.stringify(combos, null, 2)}\n`);
fs.writeFileSync(path.join(composerDir, 'combosIndex.json'), `${JSON.stringify(index, null, 2)}\n`);
fs.writeFileSync(path.join(composerDir, 'combosStarts.json'), `${JSON.stringify(starts, null, 2)}\n`);
console.log(`composed ${combos.length} deterministic trip drafts`);
