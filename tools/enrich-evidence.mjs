#!/usr/bin/env node
import fs from 'node:fs';

const profile = JSON.parse(fs.readFileSync('src/_data/decisionProfile.json', 'utf8'));
const reconciliation = JSON.parse(fs.readFileSync('assets/budget-reconciliation.json', 'utf8'));
const reconBySlug = Object.fromEntries(reconciliation.trips.map((trip) => [trip.slug, trip]));

for (const entry of fs.readdirSync('src/_data', { withFileTypes: true })) {
  if (!entry.isDirectory() || !fs.existsSync(`src/_data/${entry.name}/evidence.json`)) continue;
  const slug = entry.name;
  const main = JSON.parse(fs.readFileSync(`src/_data/${slug}/main.json`, 'utf8'));
  const evidence = JSON.parse(fs.readFileSync(`src/_data/${slug}/evidence.json`, 'utf8'));
  const sc = main.scorecard;
  const route = sc.route || sc.displayName;
  const window = profile.tripWindows[slug] || [null, null];
  const dateWindow = window.filter(Boolean).join(' → ') || 'canonical trip window not set';
  const recon = reconBySlug[slug];
  const routeStatus = profile.routeReadiness[slug] || 'current-proxy';
  const baseCount = route.split(/\s*(?:→|->)\s*/).filter(Boolean).length;
  const locators = {
    'internal-itinerary': `${sc.displayName}; canonical ${dateWindow}; source sections #totals, #itinerary, #air-travel, and #getting-around in main.json`,
    'decision-profile': `decisionProfile.json tripWindows[${slug}], routeReadiness[${slug}] and family constraints`,
    'scorecard-contract': `scorecard.manifest.json axis rubric and visited-place derivation for ${slug}`,
    'copernicus-climate': `ERA5 monthly means; ${sc.displayName}; June planning climatology for route ${route}; not a live 2027 forecast`,
    'noaa-climate': `NOAA climate normals/proxy; ${sc.displayName}; June planning window ${dateWindow}; not a live forecast`,
    'noaa-oisst': `NOAA OISST coastal proxy for ${sc.displayName}; swim locations in route ${route}; seasonal planning range only`,
    'eea-bathing-water': `EEA monitored bathing-water assessment; European bathing locations in ${sc.displayName}; latest published season, not a 2027 guarantee`,
    'state-travel': `U.S. State Department country advisory review for ${sc.displayName}; recheck before booking and departure`,
    'cdc-travel': `CDC Travelers' Health destination guidance for ${sc.displayName}; recheck before departure`,
    'bts-ontime': `BTS historical airport/carrier performance proxy for ${sc.displayName}; not a 2027 schedule confirmation`,
    'eu-etias': `Official ETIAS status for countries in ${sc.displayName}; recheck when the trip is bookable`,
    'eurostat-tourism': `Eurostat tourism table for destination region and planning season; contextual demand proxy only`,
  };

  evidence.evidenceBasis = 'Scores combine canonical itinerary derivations with current-proxy datasets. A proxy is not a 2027 quote or schedule confirmation; every volatile claim carries a date window and recheck date.';
  evidence.confidenceBasis = ['internal-derived itinerary tables', 'current-proxy climate/route data', routeStatus];
  for (const fact of evidence.facts || []) {
    fact.sourceLocators = Object.fromEntries((fact.sourceRefs || []).map((ref) => [ref, locators[ref] || `${sc.displayName}; source locator not yet available for ${ref}`]));
    fact.claimType = fact.proxyStatus === 'derived' ? 'derived' : fact.proxyStatus === 'confirmed' ? 'confirmed' : 'proxy';
    if (fact.id === 'budget-band' && recon?.arithmetic) {
      fact.value.lineItemCount = recon.arithmetic.lineItems;
      fact.value.arithmetic = `${recon.arithmetic.sumLowUsd}–${recon.arithmetic.sumHighUsd} line-item sum; tolerance ${recon.arithmetic.toleranceUsd}`;
    }
    if (fact.id === 'climate-proxy' || fact.id === 'swim-conditions') {
      fact.value.route = route;
      fact.value.dateWindow = dateWindow;
    }
    if (fact.id === 'route-readiness') {
      fact.value.route = route;
      fact.value.dateWindow = dateWindow;
    }
  }

  const temperature = (evidence.facts.find((fact) => fact.id === 'climate-proxy')?.value?.temperatureF || sc.facets.swimTempF || []).join('–');
  const swimTemperature = (evidence.facts.find((fact) => fact.id === 'swim-conditions')?.value?.temperatureF || sc.facets.swimTempF || []).join('–');
  const travel = evidence.metrics || {};
  const labels = {
    budget: `The reconciled ${recon?.arithmetic?.lineItems || 'available'}-line-item family budget is $${sc.budget.floorUsd.toLocaleString()}–$${sc.budget.ceilUsd.toLocaleString()} (sum tolerance ±$${recon?.arithmetic?.toleranceUsd || 150}); it is a planning band, not a live quote.`,
    weather: `Current-proxy climatology for ${route} and ${dateWindow} spans approximately ${temperature || 'unknown'}°F; this is not a 2027 forecast.`,
    swim: `The current-proxy swim range for ${route} is approximately ${swimTemperature || 'unknown'}°F; access, safety, and exact conditions remain trip-date dependent.`,
    variety: `The canonical route has about ${baseCount} named route segments and explicitly schedules water, town/culture, and nature modes; this is an itinerary derivation.`,
    ease: `The canonical route carries ${travel.airHours ?? 'unknown'} air hours, ${travel.groundHours ?? 'unknown'} ground hours, ${sc.facets.maxConnections} maximum connections, and ${baseCount} named route segments; the burden is derived, not a promise.`,
    food: 'Plain-food coverage is derived from the itinerary and family requirement; restaurant availability is not independently audited and should be rechecked by base.',
    risk: `Route status is ${routeStatus}; the current proxy does not certify a bookable 2027 schedule, protected ticket, or disruption-free trip.`,
    nights: `${sc.pto.nights} hotel nights derives a ${sc.axes.nights}/5 score from the canonical nights rubric.`,
    novelty: `Novelty is derived from the documented visited-place overlap list; this route scores ${sc.axes.novelty}/5 under that rubric.`,
    pto: `${sc.pto.days} PTO days derives a ${sc.axes.pto}/5 slider score and has zero default weight.`,
  };
  for (const [axis, record] of Object.entries(evidence.axes || {})) if (labels[axis]) record.rationale = labels[axis];

  const variantsPath = `src/_data/${slug}/variants.json`;
  if (fs.existsSync(variantsPath)) {
    const variants = JSON.parse(fs.readFileSync(variantsPath, 'utf8'));
    for (const variant of variants.variants || []) {
      variant.confidence = variant.canonical ? 'medium' : 'low';
      variant.claimType = variant.canonical ? 'derived' : 'quote-dependent';
      variant.sourceRefs = ['internal-itinerary'];
      variant.sourceLocators = { 'internal-itinerary': `${sc.displayName}; variant ${variant.id}; route-specific savings/tradeoffs require re-price` };
      if (!variant.canonical) variant.budget.distribution = 'quote-dependent planning-band';
    }
    fs.writeFileSync(variantsPath, `${JSON.stringify(variants, null, 2)}\n`);
  }
  fs.writeFileSync(`src/_data/${slug}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`);
}

console.log('enriched evidence locators, proxy labels, derivations, and variant confidence for all trips');
