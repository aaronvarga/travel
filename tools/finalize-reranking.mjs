#!/usr/bin/env node
// Scoped propagation of the reviewed comparison audit, never itinerary creation.
import fs from 'node:fs';
import { load } from 'cheerio';
import { deriveEvidenceConfidence } from './lib/evidence-confidence.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const audit=read('src/_data/rerankingAudit.json');
const points=read('src/_data/capitalOnePoints.json');
const profile=read('src/_data/decisionProfile.json');
const flights=read('src/_data/flightAudits.json');
const manifest=read('tools/scorecard.manifest.json');
const evidenceSources=read('src/_data/shared/evidenceSources.json');
evidenceSources['google-flights-family-audit']={label:'Four-passenger cash flight audit, September 11, 2026',tier:'observed-quote',publisher:'Google Flights',url:'https://www.google.com/travel/flights',scope:'Party is 3 adult fares plus 1 child age 2–11. Reproduction dates, airports, carriers, times and price stage are recorded per trip in rerankingAudit.json. Four complete outer cash booking options; other results are gateway proxies. No airline checkout or award-seat confirmation is implied.'};
const money=n=>'$'+n.toLocaleString('en-US');
const band=a=>a.map(money).join('–');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const sources={
  fixed:{url:'https://www.capitalone.com/learn-grow/money-management/ways-to-redeem-venture-miles/',label:'Capital One eligible travel redemption and 90-day rule',type:'primary'},
  ratios:{url:'https://www.capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships/',label:'Capital One transfer ratios and irreversible transfers',type:'primary'},
  independent:{url:'https://thepointsguy.com/credit-cards/redeem-capital-one-miles-fixed-value/',label:'Independent confirmation of 1-cent travel redemption',type:'independent'},
  aeroplan:{url:'https://www.aircanada.com/content/dam/aircanada/loyalty-content/documents/flight-rewards-chart-en.pdf',label:'Aeroplan August 2026 award chart',type:'primary'},
  aeroplanRules:{url:'https://www.aircanada.com/ca/en/aco/home/aeroplan/legal/aeroplan-flight-reward-policy.html',label:'Aeroplan partner booking and change/cancel fees',type:'primary'},
  flyingBlue:{url:'https://www.flyingblue.com/en/flights',label:'Flying Blue reward booking rules',type:'primary'},
  british:{url:'https://www.britishairways.com/content/the-british-airways-club/avios/spending-avios/reward-flights',label:'British Airways reward flights',type:'primary'},
  madeira:{url:'https://visitmadeira.com/en/blog/visit-madeira/everything-you-need-to-know-about-hiking-in-madeira-in-2026/',label:'Madeira 2026 trail fees and reservations',type:'primary'},
  swiss:{url:'https://www.jungfrau.ch/en-gb/faq/',label:'Jungfrau child/pass compatibility and reservations',type:'primary'},
  swissPass:{url:'https://www.berneseoberlandpass.ch/prices-tickets/',label:'Berner Oberland Pass 2026 prices',type:'primary'},
  ferry:{url:'https://www.moby.it/rotte/traghetti-corsica/santa-teresa-bonifacio-santa-teresa/',label:'Moby Santa Teresa–Bonifacio current route',type:'primary'},
  seajets:{url:'https://tickets.seajets.com/TermsEN.pdf',label:'Seajets cancellation terms',type:'primary'},
  haleakala:{url:'https://www.nps.gov/hale/planyourvisit/sunrise.htm',label:'Haleakala sunrise reservation timing',type:'primary'},
  fairwind:{url:'https://www.fair-wind.com/afternoon-kealakekua-snorkel-tour/',label:'Fair Wind afternoon snorkel starting prices',type:'primary'},
};
audit.sources=sources;
audit.researchStatus='Planning audit with unresolved supplier checkouts; not a complete set of bookable quotes';
points.asOf=audit.asOf;
points.sources.fixedOfficial=sources.fixed;
points.sources.aeroplanRules=sources.aeroplanRules;
// Program-level screening is separate from dated inventory. Null means not priced,
// never zero charges or zero miles. No chart floor is called a seat confirmation.
const programs=[
  ['Flying Blue','1:1','AF/KLM via CDG/AMS; PIT feeder and island continuation must appear on the award.','Dynamic. The published 25,000 one-way Europe floor would require 200,000 for eight awards, before cash charges; no floor seats are confirmed. New Light/Standard/Flex conditions must be read at checkout.','flyingBlue'],
  ['Aeroplan','1:1','Air Canada/United and available Star Alliance Europe connections.','Distance and carrier dependent: 32,500 or 42,500 one-way Europe starting bands mean 260,000 or 340,000 for eight; 130,000 or 170,000 for four one-ways. United/select partners are dynamic, not fixed partner awards. CAD39 partner booking fee per ticket; Standard online cancellation CAD150 per ticket, plus taxes.','aeroplan'],
  ['Avianca LifeMiles','1:1','Star Alliance alternatives to Aeroplan, only if the whole through itinerary displays.','No complete dated four-seat quote; miles, cash charges, bags and change/refund cost unresolved.','ratios'],
  ['Turkish Miles&Smiles','1:1','United domestic awards or Star Alliance European service; avoid an unnecessary Istanbul detour.','Segment pricing and availability require a live quote; do not apply a nonstop Hawaii chart price to a connecting PIT itinerary.','ratios'],
  ['TAP Miles&Go','1:1','Especially Lisbon/Madeira routes, with Star Alliance feeders where available.','No complete four-seat award quote; compare carrier charges, fare restrictions and internal tickets.','ratios'],
  ['British Airways Club','1:1','PIT–LHR and BA/available American connections; protect any island continuation.','Avios plus cash varies by route and option. Count UK/airline charges and avoid LHR/LCY/LGW changes.','british'],
  ['Finnair Plus','1:1','Alternative Avios pricing for eligible BA/AA space; HEL only when a sensible full route.','No dated four-seat quote; partner pricing and cancellation rules are not assumed identical to BA.','ratios'],
  ['Qatar Privilege Club','1:1','Alternative Avios access to eligible BA/AA inventory; not a Doha detour.','No dated four-seat quote or confirmed taxes; transferring between Avios programs does not create seats.','ratios'],
  ['Qantas Frequent Flyer','1:1','Eligible BA/AA partner space as an alternate price check.','No complete four-seat quote; distance/segment price and charges require checkout.','ratios'],
  ['Cathay Asia Miles','1:1','Eligible BA/AA partner space; no Asia positioning for these trips.','No complete four-seat quote; partner fees and cancellation conditions unverified.','ratios'],
  ['Etihad Guest','1:1','Possible eligible American partner inventory, not Abu Dhabi positioning.','No complete four-seat quote; do not assume older partner sweet-spot prices or permissive refunds.','ratios'],
  ['Virgin Red / Flying Club','1:1','Linked Flying Club for eligible Delta/AF/KLM awards.','No complete four-seat quote; partner availability differs from cash seats, surcharges and refund rules require checkout.','ratios'],
  ['Singapore KrisFlyer','1:1','Secondary United/Star Alliance inventory check.','No complete four-seat quote; compare mileage price with Aeroplan before transferring.','ratios'],
  ['JetBlue TrueBlue','5:3','Cash-linked option only where the full itinerary can actually be booked in TrueBlue points.','200,000 Capital One miles becomes 120,000 TrueBlue points. A JetBlue cash codeshare is not proof of a redeemable partner itinerary.','ratios'],
  ['EVA Infinity MileageLands','2:1.5','Secondary Star Alliance partner route, without Asia positioning.','200,000 becomes 150,000 partner miles; no dated quote establishes an advantage over fixed redemption.','ratios'],
  ['Japan Airlines Mileage Bank','2:1.5','Secondary eligible oneworld partner inventory, not Japan positioning.','200,000 becomes 150,000 miles; no dated quote establishes a full-family advantage.','ratios'],
  ['Aeromexico Rewards','1:1','Secondary eligible SkyTeam award; Mexico detours are not a practical default.','No dated four-seat quote establishes savings on this routing.','ratios'],
  ['Emirates Skywards','2:1.5','Screened out as a primary route: no useful full PIT family itinerary established without positioning/detour.','200,000 becomes 150,000 miles; no confirmed family award, fees or positioning total.','ratios'],
];
for(const r of audit.trips){
  const p=`src/_data/${r.slug}/main.json`,m=read(p),e=read(`src/_data/${r.slug}/evidence.json`);
  const plan=points.plans[r.slug];
  plan.partnerComparisons=programs.map(([program,ratio,relevance,pricing,source])=>({program,ratio,relevance,pricing,sourceUrl:sources[source].url,availability:'unverified; no four-seat award checkout captured',milesRequired:null,remainingCashUsd:null,taxesAndSurchargesUsd:null,savingsUsedUsd:0}));
  if(['hawaii','maui-kauai'].includes(r.slug)){
    plan.partnerComparisons.find(p=>p.program==='Aeroplan').pricing='PIT–Hawaii is in the 2,751+ North America band. Air Canada/select partners including United start at 17,500 one-way (dynamic): eight floor awards = 140,000, leaving 60,000 Capital One miles/$600 fixed travel credit. Not a confirmed fare or eight seats. CAD39 partner fee per ticket and taxes; cancellation rules per Aeroplan policy.';
    plan.partnerComparisons.find(p=>p.program==='Flying Blue').pricing='Delta Hawaii partner award must be quoted live; the Europe 25,000 floor is not applicable.';
  }
  plan.supportingSources=[sources.fixed,sources.ratios,sources.independent,sources.aeroplan,sources.aeroplanRules,sources.flyingBlue,sources.british];
  plan.strategy='fixed-value';
  plan.cashImpact=`Gross ${band(r.grossCashRangeUsd)}; net ${band(r.netCashRangeUsd)} after one $2,000 credit. Award savings are unverified and excluded.`;
  plan.backup='Retain the miles until the complete cash itinerary is acceptable. Compare the partner options below only if all four can travel together on the required dates.';
  r.axisReview=Object.fromEntries(manifest.axes.map(a=>[a.id,{score:m.scorecard.axes[a.id],rubric:manifest.axisRubrics[a.id],rationale:e.axes[a.id].rationale,evidenceIds:e.axes[a.id].evidence,confidence:e.axes[a.id].confidence,reviewBasis:['budget','nights','pto'].includes(a.id)?'recomputed from canonical values':r.slug==='switzerland-crete'&&a.id==='risk'?'updated for dated internal-flight evidence':'rubric review of stored evidence; not a new exact-date forecast or quote'}]));
  r.costAssumptions={lodging:'Retained apartment/family-room allowances, not confirmed four-person inventory. Require bed layout, cleaning/resort fees, local tax and cancellation terms before committing.',transport:'Retained automatic-car/local-transport allowances. Final insurance excess, fuel, parking, tolls, one-way and cross-border permissions are unquoted.',food:'Groceries, packed remote-day lunches and casual meals; prices are planning allowances, not prepaid menus.',activities:'Listed standard/shared activities only. Optional private boats, extra tours and resort upgrades are not silently included.',fees:'Existing fee/reserve rows plus explicitly added reserves. Future entry authorizations and FX remain conditional.',contingency:'Explicit line where present; not insurance coverage or a guarantee against high fares.',awards:'No confirmed four-seat dated inventory. No positioning flight or airport transfer is assumed free. Every transfer strategy remains unpriced upside.'};
  r.operatorChecks=[];
  if(r.slug.includes('madeira')||r.slug==='portugal')r.operatorChecks.push({source:'madeira',finding:'2026 individual trail fee €4.50; full PR1 €10.50. Timed reservations required. These are current published fees, not guaranteed 2027 prices; permit/trail access can remove a headline day.'});
  if(r.slug.startsWith('switzerland'))r.operatorChecks.push({source:'swiss',finding:'2026 Jungfraujoch seat reservation CHF10 per traveler, including children; family-card validity depends on the pass. Do not call all children free on every pass.'},{source:'swissPass',finding:'2026 six-day second-class Berner Oberland Pass CHF350/adult and CHF30/child 6–15: CHF760 for this party before summit supplements. 2027 quote unavailable.'});
  if(r.slug==='sardinia-corsica')r.operatorChecks.push({source:'ferry',finding:'Current Moby crossing is 50 minutes; summer foot passengers check in one hour ahead. Exact 2027 sailings/family fare unconfirmed; no vehicle ferry without written rental permission.'});
  if(r.slug==='greece-cyclades')r.operatorChecks.push({source:'seajets',finding:'Current standard cancellation refunds step down at 14 days, 7 days and 12 hours; ferries are not airline-protected connections. Exact summer 2027 chain still requires inventory.'});
  if(r.slug==='hawaii')r.operatorChecks.push({source:'fairwind',finding:'Published afternoon starting prices $117 adult age13+ and $90 child4–12 imply $441 for 3 adult-fare travelers plus one child, before checkout taxes/seasonal variation. Do not price both children at the child rate.'});
  if(r.slug==='maui-kauai')r.operatorChecks.push({source:'haleakala',finding:'Sunrise permits release 60 days and 2 days before, 7am HST. June 2027 permit is not available now; park fee is separate and weather refunds are not promised.'});
  const check=r.cashCheck;
  if(check)check.note=check.note.replace(/June (\d+)\/(\d+)/g,(_,a,b)=>`June ${a}–${b}, 2027`);
  if(check)check.sourceUrl='https://www.google.com/travel/flights';
  const priorNote=' This prior September 10 component evidence was reviewed, not newly reproduced for four passengers; retain the booking gate.';
  const detail=check?`${check.route}. Observed family base ${money(check.baseFareUsd)}; ${check.scope}. ${check.note}`:r.priorFlightEvidence.detail.split(priorNote).join('')+priorNote;
  flights.trips[r.slug]={...flights.trips[r.slug],reviewedAt:audit.asOf,headline:check?'Family cash audit: '+check.scope:flights.trips[r.slug].headline,detail};
  // Confirmed here means dated schedule inventory, not ticketed reservations.
  if(r.slug==='crete')profile.routeReadiness[r.slug]='confirmed';
  r.routeReadiness=profile.routeReadiness[r.slug];
  flights.trips[r.slug].status=r.routeReadiness;
  const air=`<section id="air-travel" class="divider"><div class="section-label"><p class="eyebrow">Flight audit · ${audit.asOf}</p><h2>Price the complete family itinerary</h2></div><p>${esc(detail)}</p><p><strong>Readiness: ${esc(r.routeReadiness)}.</strong> Search two adults and children 13/8; Google Flights uses three adult fares plus one child. Cash results are not award inventory or held tickets. Compare airline checkout for all four on the same flights, complete bags, seats, change/refund terms and ticket protection. An alliance or codeshare logo alone does not prove protection.</p><p>Family air allowance: ${band(plan.cashAirfareRangeUsd)}, including the listed internal air lines. After the single $2,000 eligible-travel credit: ${band(plan.remainingCashAirfareUsd)}. Positioning, self-transfer hotels and optional upgrades require additional quotes if introduced. Keep internal tickets and ferries buffered; do not assume an airline will recover a separately ticketed connection.</p><p>Canonical window ${r.travelWindow.join(' to ')}. Return to Pittsburgh before June 24, or depart after June 26. A Europe or Hawaii departure on June 23 is not sufficient if Pittsburgh arrival falls on June 24. ${check?.returnArrival?'Selected Pittsburgh arrival: '+check.returnArrival.replace('T',' at ')+'.':''}</p><p><a href="https://www.google.com/travel/flights" target="_blank" rel="noreferrer">Reproduce cash search</a> · <a href="#capital-one-points">Cash, fixed-value and transfer comparison</a></p></section>`;
  const tldr=`<div class="tldr" data-audit-rank="${r.newRank}"><b>Recommendation: #${r.newRank} of 22 · ${r.score}/55.</b> Gross ${band(r.grossCashRangeUsd)}; net ${band(r.netCashRangeUsd)} after 200,000 Capital One miles ($2,000, 1¢/mile). These are planning ranges, not reservations. Route: ${esc(r.routeReadiness)}. ${r.routeReadiness==='reroute-required'?'This high raw score is a conditional concept, not a book-ready recommendation.':''}</div>`;
  const hasTldr=m.parts.some(p=>p.t==='raw'&&p.html.includes('class="tldr"'));
  for(const part of m.parts){if(part.t!=='raw')continue;
    part.html=part.html.replace(/<section\b[^>]*id="air-travel"[\s\S]*?<\/section>/,()=>air);
    part.html=part.html.replace(/<div class="tldr"[^>]*>[\s\S]*?<\/div>/,()=>tldr);
    if(!hasTldr)part.html=part.html.replace(/<section\b[^>]*id="overview"[^>]*>/,opening=>opening+tldr);
    part.html=part.html.replace(/<li>[^<]*\b\d{2}\/55\b[^<]*<\/li>/g,()=>`<li>Default rank #${r.newRank} of 22, ${r.score}/55. Gross ${band(r.grossCashRangeUsd)}; net ${band(r.netCashRangeUsd)} after one $2,000 fixed-value travel credit. Budget ${m.scorecard.axes.budget}/5; exact booking costs remain open.</li>`);
    part.html=part.html.replace(/<div class="row"><b>Hub status<\/b><span>[\s\S]*?<\/span><\/div>/g,()=>`<div class="row"><b>Hub status</b><span>Ranked #${r.newRank} of 22 at ${r.score}/55. ${esc(r.routeReadiness)}; use the dated family flight audit, not an assumed seasonal nonstop.</span></div>`);
    part.html=part.html.replace(/#\d+ of \d+/g,()=>`#${r.newRank} of 22`);
    part.html=part.html.replace(/\b\d{2}\/55\b/g,()=>`${r.score}/55`);
    part.html=part.html.replace(/<div class="row"><b>[^<]*Budget[^<]*<\/b><span>[\s\S]*?<\/span><\/div>/gi,()=>`<div class="row"><b>Budget verdict</b><span>Gross ${band(r.grossCashRangeUsd)}; net ${band(r.netCashRangeUsd)} after one $2,000 fixed travel credit. Budget ${m.scorecard.axes.budget}/5 against the $12,000 target and $15,000 preference. Planning estimates, not quotes.</span></div>`);
    part.html=part.html.replace(/<div class="row"><b>[^<]*(?:Airfare|flights|Nonstop confirmation)[^<]*<\/b><span>[\s\S]*?<\/span><\/div>/gi,()=>`<div class="row"><b>Flight booking gate</b><span>${esc(detail)} Family air allowance ${band(plan.cashAirfareRangeUsd)}; reprice the complete chain before purchase.</span></div>`);
    part.html=part.html.replace(/one connection each way(?:[,;]?\s*one connection each way)+/gi,'one connection each way');
  }
  write(p,m);
  const routeFact=e.facts.find(f=>f.id==='route-readiness');
  if(check){
    const budgetFact=e.facts.find(f=>f.id==='budget-band');
    if(!budgetFact.sourceRefs.includes('google-flights-family-audit'))budgetFact.sourceRefs.push('google-flights-family-audit');
    budgetFact.sourceLocators['google-flights-family-audit']=`${check.route}: ${check.scope}, family base $${check.baseFareUsd}; full allowances and unquoted components in rerankingAudit.json`;
  }
  if(routeFact&&r.slug==='crete'){
    routeFact.value={...routeFact.value,status:'confirmed',exactTripQuoteObserved:true,quoteStage:'Google Flights four-passenger booking option, not final airline checkout',familyBaseFareUsd:6733};
    routeFact.sourceRefs=['google-flights-family-audit'];
    routeFact.sourceLocators={'google-flights-family-audit':'Four-passenger multi-city: BA PIT–LHR–CHQ June 9/10, 21:45–17:45; Aegean/American HER–ATH–JFK–PIT June 23, 11:35–21:25. American booking option $6,733, bags $720 family; paid seats and final protection unverified'};
    routeFact.proxyStatus='confirmed';routeFact.verifiedAt=audit.asOf;routeFact.expiresAt='2026-10-11';
  }
  if(r.slug==='slovenia-adriatic')e.axes.ease.rationale='One country and one car, multiple bases and a long alpine/coastal loop support Ease 3/5. The observed practical outbound has two connections; the June 22 return has one via Newark. The old no-long-haul-service claim is obsolete.';
  const derived=deriveEvidenceConfidence(e,manifest);for(const[a,c]of Object.entries(derived.axes))e.axes[a].confidence=c;e.overallConfidence=derived.overall;
  write(`src/_data/${r.slug}/evidence.json`,e);
}
write('src/_data/decisionProfile.json',profile);
write('src/_data/flightAudits.json',flights);
write('src/_data/capitalOnePoints.json',points);
write('src/_data/rerankingAudit.json',audit);
write('src/_data/shared/evidenceSources.json',evidenceSources);

// Replace stale rank prose with canonical template loops. Preserve the separate
// excluded-reference table and unrelated homepage sections.
let index=fs.readFileSync('src/index.njk','utf8');
index=index.replace(/(<table class="decision-table">[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>)/,(_,start,end)=>start+`{% for row in hub.priorityRows %}<tr class="decision-row{% if loop.first %} on{% endif %}" data-priority="{{ row.id }}" data-trip="{{ row.winner.token }}"><td>{{ row.label }}</td><td>{{ row.winner.displayName }}</td><td>{{ row.runner.displayName }}</td><td>Preset weights from the shared engine. Default score {{ row.winner.totalBaked }}/55; default rank #{{ row.winner.appealRank }}. Net {{ row.winner.budget.floorUsd | money }}–{{ row.winner.budget.ceilUsd | money }}; gross {{ row.winner.budget.grossFloorUsd | money }}–{{ row.winner.budget.grossCeilUsd | money }}. {{ row.winner.routeReadiness }}.</td></tr>{% endfor %}`+end);
for(const r of audit.trips){
  // The options-considered list is editorial; its numeric status is canonical.
  const names={'crete':'Crete','madeira-mallorca':'Madeira + Mallorca','dolomites-sardinia':'Dolomites + Venice + Sardinia','iceland':'Iceland'};
  if(names[r.slug])index=index.replace(new RegExp('(<li><strong>'+names[r.slug].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'<\\/strong>[^\\n]*?<span class="st st-go">)[^<]*(<\\/span>)'),(_,a,b)=>a+`built, #${r.newRank} (${r.score}/55)`+b);
}
index=index.replace(/<section id="winners">[\s\S]*?<\/section>/,()=>`<section id="winners"><p class="eyebrow">Default score leaders</p><h2>What the numbers favor</h2><p>Raw rank is not booking readiness. A reroute-required concept remains visible but must be rebuilt before purchase. Net costs use $2,000 fixed travel credit; no award-seat savings are assumed.</p><div class="winner-grid">{% for t in hub.activeTrips %}{% if loop.index <= 6 %}<article class="winner-card" data-winner="{{ t.slug }}"><h3>#{{ t.appealRank }} · {{ t.displayName }}</h3><p>{{ t.totalBaked }}/55 · {{ t.budget.floorUsd | money }}–{{ t.budget.ceilUsd | money }} net</p><p>Gross {{ t.budget.grossFloorUsd | money }}–{{ t.budget.grossCeilUsd | money }} · {{ t.routeReadiness }}</p></article>{% endif %}{% endfor %}</div></section>`);
index=index.replace(/(<section id="matrix">)[\s\S]*?(<tr><td><b>Albania<\/b>)/,()=>`$1`.replace('$1','<section id="matrix">')+`<p class="eyebrow">Full Comparison</p><h2>The practical call</h2><div class="budget-scroll"><table class="budget-tbl matrix-tbl"><tr><th>Trip</th><th>Gross cash</th><th>Net after miles</th><th>Decision / booking gate</th></tr>{% for t in hub.activeTrips %}<tr data-matrix-trip="{{ t.slug }}"><td>#{{ t.appealRank }} · {{ t.displayName }}</td><td>{{ t.budget.grossFloorUsd | money }}–{{ t.budget.grossCeilUsd | money }}</td><td>{{ t.budget.floorUsd | money }}–{{ t.budget.ceilUsd | money }}</td><td>{{ t.totalBaked }}/55 · {{ t.routeReadiness }}. {{ t.cardSummary }}</td></tr>{% endfor %}<tr><th colspan="4">Excluded references — unchanged cash basis</th></tr><tr><td><b>Albania</b>`);
index=index.replace(/<section id="risks">[\s\S]*?<\/section>/,()=>`<section id="risks"><p class="eyebrow">Booking gates</p><h2>What the scores cannot promise</h2><ul class="hc-list"><li>Only the 22 ranked comparison trips received this points-adjusted audit. The nine excluded references and separate short-escape band retain their original basis.</li><li>No four-seat award itinerary is confirmed. The rankable credit is $2,000, not a transfer valuation.</li><li>Gross cash remains visible. Lodging, car coverage, food and activities are planning allowances; no inventory is held.</li><li>Iceland + Ischia/Cilento remains reroute-required. Its score does not make its old airfare construction bookable.</li><li>Keep Pittsburgh June 24–26 entirely clear. Reject late returns and unprotected connections even if a fare looks cheaper.</li></ul></section>`);
if(!index.includes('For the 22 ranked trips, Budget uses net cost'))index=index.replace('Budget is weighted <b>double</b> against','For the 22 ranked trips, Budget uses net cost after a single $2,000 Capital One travel credit; gross cash is also shown. Budget is weighted <b>double</b> against');
fs.writeFileSync('src/index.njk',index);
console.log('Propagated the 22-trip audit, partner screening and source-driven homepage ranks.');
