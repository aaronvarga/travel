#!/usr/bin/env node
// Reproducible, scoped migration of the a03d855e comparison baseline.
// This is not an itinerary creator. It reads existing sections and preserves
// the daily itinerary, photos, family exclusions and short-escape sources.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { load } from 'cheerio';
import points from './lib/points-budget.cjs';
import { compareDefault } from './lib/recommendation-engine.mjs';
import { deriveEvidenceConfidence } from './lib/evidence-confidence.mjs';

const base = 'a03d855e';
const date = '2026-09-11';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const original = p => JSON.parse(execFileSync('git', ['show', `${base}:${p}`], {encoding:'utf8', maxBuffer: 4e6}));
const write = (p,d) => fs.writeFileSync(p, JSON.stringify(d,null,2)+'\n');
const manifest = read('tools/scorecard.manifest.json');
const profile = read('src/_data/decisionProfile.json');
const weights = Object.fromEntries(manifest.axes.map(a=>[a.id,a.weightDefault]));
const all = fs.readdirSync('src/_data').filter(s=>fs.existsSync(`src/_data/${s}/main.json`)).map(slug=>({slug,main:original(`src/_data/${slug}/main.json`)}));
const selected = all.filter(t=>!t.main.excluded && t.main.tripCategory!=='short');
if(selected.length!==22) throw new Error('Expected the 22-trip shortlist');
const order = ts => [...ts].sort((a,b)=>compareDefault(a,b,manifest.axes,weights,profile.budget));
const oldOrder = order(selected.map(t=>({slug:t.slug,...t.main.scorecard})));
const money = n => '$'+n.toLocaleString('en-US');
const band = (l,h) => `${money(l)}–${money(h)}`;
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function rowsOf(html,id) {
  const $=load(html), rows=[];
  $(`#${id} tr`).each((_,r)=>{
    const c=$(r).find('td').map((_,e)=>$(e).text().replace(/\s+/g,' ').trim()).get();
    if(c.length<2 || /grand total|all-in total|subtotal|total trip/i.test(c[0]))return;
    const nums=[...c.slice(1).join(' ').matchAll(/\$\s*([\d,]+(?:\.\d+)?)(k)?/g)].map(m=>Number(m[1].replaceAll(',',''))*(m[2]?1000:1));
    // Many legacy ranges omit the repeated currency symbol.
    if(nums.length===1){const m=c.slice(1).join(' ').match(/[–—-]\s*\$?([\d,]+(?:\.\d+)?)(k)?/);if(m)nums.push(Number(m[1].replaceAll(',',''))*(m[2]?1000:1));}
    if(nums.length)rows.push({label:c[0],lowUsd:nums[0],highUsd:nums[1]??nums[0],basis:'planning-estimate',confidence:'medium'});
  });
  return rows;
}
const row=(label,lowUsd,highUsd,note)=>({label,lowUsd,highUsd,basis:'planning-estimate',confidence:'medium',...(note?{note}:{})});
const cashChecks = {
  'portugal-crete':{baseFareUsd:4798,scope:'gateway round-trip proxy for open-jaw',route:'PIT–LHR–LIS, June 8–21',note:'Four-passenger British Airways result; the 2h35 LHR option avoids the shorter 1h30 connection at the same price. Not a Crete-return quote. Add the stored $220/person June 14 Lisbon–Athens–Chania component, family bag/seat allowances and an explicit open-jaw uncertainty reserve.'},
  'portugal-sicily':{baseFareUsd:4798,scope:'gateway round-trip proxy for open-jaw',route:'PIT–LHR–LIS, June 8–21',note:'Four-passenger British Airways result; not a Catania-return quote. The stored Monday June 14 Lisbon–Palermo component is $290/person, not Tuesday’s cheaper nonstop. Add bags/seats and an open-jaw uncertainty reserve.'},
  'slovenia-adriatic':{baseFareUsd:5342,scope:'complete round-trip',route:'PIT–YYZ–MUC–LJU / LJU–EWR–PIT',seller:'United via Google Flights',bagsUsd:720,seatAllowanceUsd:[200,800],returnArrival:'2027-06-22T17:44',note:'Four-passenger June 8/22 booking option. Outbound arrives June 9 12:35, with 3h05 YYZ and 1h35 MUC connections. Return nonstop LJU–EWR then 2h30 connection to PIT. This contradicts the old claim that Ljubljana has no long-haul service. Final airline checkout remains required.'},
  crete:{baseFareUsd:6733,scope:'complete open-jaw',route:'PIT–LHR–CHQ / HER–ATH–JFK–PIT',seller:'American via Google Flights',bagsUsd:720,seatAllowanceUsd:[200,800],returnArrival:'2027-06-23T21:25',note:'Selected four-passenger multi-city booking option; one checked bag per person costs $180 for the itinerary. Final airline checkout, individual fare rules and paid seats remain unverified. The 1h30 JFK connection must be protected. Reject the BA return arriving June 24.'},
  iceland:{baseFareUsd:2619,scope:'complete round-trip',route:'PIT–YUL–KEF / KEF–YUL–PIT',seller:'Air Canada via Google Flights',bagsUsd:720,seatAllowanceUsd:[200,600],returnArrival:'2027-06-21T14:42',note:'Basic $2,619 plus $180 checked bag per person; Standard $3,499 includes the checked bag but charges for seats. Flex $5,191 includes seats/refunds. Selected June 8/21 flights show a same-day return. No nonstop outbound in these results.'},
  portugal:{baseFareUsd:5457,scope:'complete open-jaw, internal flight separate',route:'PIT–BOS–LIS / FNC–LIS–BOS–PIT',seller:'TAP via Google Flights',bagsUsd:[0,1048],seatAllowanceUsd:[200,800],returnArrival:'2027-06-23T22:28',note:'Selected four-passenger booking option; displayed bag fee $0–262 per person depends on fare. Budget conservatively for bags; final fare brand and ticket protection need airline checkout. The separate Faro–Madeira flight is additional.'},
  'greece-cyclades':{baseFareUsd:5202,scope:'exact-date gateway round-trip search, not checkout',route:'PIT–YYZ–ATH, June 8–21',note:'Four-passenger Air Canada result; return flight and fare brand not selected. The $5,182 Montreal option has a 54-minute connection and is not the planning choice.'},
  'dolomites-sardinia':{baseFareUsd:5183,scope:'gateway round-trip proxy for open-jaw',route:'PIT–LHR–VCE, June 27–July 11',note:'Four-passenger BA result; does not price the required Olbia return.'},
  'greece-ionian':{baseFareUsd:5529,scope:'gateway round-trip proxy for open-jaw',route:'PIT–JFK–ATH–EFL, June 9–22',note:'Four-passenger Aegean/American result; does not price the corrected Athens exit. Retain the Athens buffer night and drive.'},
  hawaii:{baseFareUsd:3488,scope:'gateway round-trip proxy for open-jaw',route:'PIT–SEA–HNL, June 5–15',note:'Four-passenger Alaska result; return search date is a gateway proxy, not the required Kona June 14 red-eye. Bags/seat selection extra.'},
  'maui-kauai':{baseFareUsd:3904,scope:'gateway round-trip proxy for open-jaw',route:'PIT–PHX–OGG, June 10–23',note:'Four-passenger American result with 1h58 PHX connection; the cheaper $3,032 DFW option has only 53 minutes. This does not price LIH departure June 22, required for PIT arrival June 23.'},
  'madeira-sicily':{baseFareUsd:6204,scope:'gateway round-trip proxy for open-jaw',route:'PIT–BOS–LIS–FNC, June 8–21',note:'Four-passenger TAP/JetBlue result; does not price Catania exit or internal flights. United nonstop EWR–FNC connection shown from $7,189 family round-trip.'},
  'madeira-crete':{baseFareUsd:6124,scope:'gateway round-trip proxy for open-jaw',route:'PIT–BOS–LIS–FNC, June 8–22',note:'Four-passenger TAP/JetBlue result; does not price Greece exit or internal flights. United EWR–FNC result from $6,882 confirms a current exact-date schedule option, not the whole hybrid.'},
  'sicily-malta':{baseFareUsd:5667,scope:'gateway round-trip proxy for open-jaw',route:'PIT–LHR–PMO, June 10–23',note:'Four-passenger BA result; does not price Malta exit or CTA–MLA flight.'},
  'sardinia-corsica':{baseFareUsd:5316,scope:'gateway round-trip proxy for open-jaw',route:'PIT–LHR–OLB, June 10–23',note:'Four-passenger BA result with a long LHR wait; does not price Cagliari exit. Reject London airport-change alternatives.'},
  'switzerland-sicily':{baseFareUsd:4545,scope:'gateway round-trip proxy for open-jaw',route:'PIT–JFK–ZRH, June 8–22',note:'Four-passenger Delta result; does not price Sicily exit or the Zurich–Catania hop.'},
  'portugal-algarve-sicily':{baseFareUsd:6260,scope:'gateway round-trip proxy for open-jaw',route:'PIT–LHR–FAO, June 10–23',note:'Four-passenger BA result; does not price Catania exit or the Faro–Palermo bridge.'},
};
const sharedChecks={'madeira-mallorca':'madeira-sicily','madeira-kefalonia':'madeira-crete','switzerland-crete':'switzerland-sicily'};
const costNotes={
  'greece-via-lisbon':'Keep the outer/Lisbon–Athens airfare allowance separate from Athens–Chania, and add a previously missing $400–700 insurance/contingency line. This remains an unquoted planning allocation, not a protected all-family through-fare.',
  'portugal-crete':'The old $4,800–5,900 all-flight gate is not a current complete quote. Use a $6,600–8,000 planning proxy: $4,798 family Lisbon gateway return plus $880 stored Crete connection, $720 checked-bag proxy, $200–800 seats and up to $800 open-jaw uncertainty. Exact Crete exit can still exceed this estimate.',
  'portugal-sicily':'Replace the unsupported $5,800 all-flight hard gate with $6,900–8,300: $4,798 Lisbon gateway return plus $1,160 stored Monday Palermo connection, $720 bag proxy, $200–800 seats and up to $800 open-jaw uncertainty. These are rounded allowances, not a Catania-return quote.',
  'slovenia-adriatic':'Raise airfare from $4,800–6,400 to $6,300–7,000: observed family base $5,342, four checked bags $720 and estimated paid seats $200–800. Round conservatively; do not assume free assigned seats.',
  crete:'Replace the two one-way sum with the $6,733 complete family option; allow $720 bags and $200–800 seats, rounded up to $7,700–8,300. Add a previously missing $500–900 insurance/contingency allowance (estimate).',
  iceland:'Reprice family airfare to $3,600–4,200 including the observed Basic/Standard options, four checked bags and estimated seats; the former $2,600 floor excluded those costs.',
  portugal:'Use $6,000–7,400 outer airfare, encompassing the observed $5,457 base and variable bags/seats; Faro–Madeira $750–1,000 is a conservative estimate from the stored $169/person component plus bags. Add an explicit $400–700 insurance/contingency allowance. Lodging remains unquoted.',
  'greece-cyclades':'Increase Athens airfare to $5,800–7,200 for bags/seats above the four-person fare snapshot. Increase Milos–Athens to $650–850: the stored $154/person September 10 snapshot already exceeds the old $300–480 family allowance before bags.',
  'sicily-malta':'Use $6,200–7,400 outer airfare as a conservative open-jaw planning proxy above the $5,667 Palermo round-trip result, not an observed Malta-return fare. Retain internal hop and local-cost estimates; add $400–700 insurance/contingency.',
  'maui-kauai':'Use $4,200–5,200 outer airfare as a practical connection/bag/seat planning allowance above the $3,904 Maui round-trip proxy. Lihue June 22 return remains unquoted.',
  'portugal-algarve-sicily':'Increase outer airfare allowance to $6,600–7,600 above the $6,260 Faro gateway proxy including bags/seats; this is not a Catania-return quote. Increase the former $150–250 insurance/misc line to an explicit $500–900 planning reserve.',
};

const pointsData=read('src/_data/capitalOnePoints.json');
const audit={schemaVersion:1,asOf:date,baselineCommit:base,scope:'22 ranked comparison trips only; 9 excluded references and 11 short escapes unchanged',party:profile.party,flightSearchParty:{adults:3,children:1,reason:'Google Flights child category is ages 2–11; the 13-year-old uses an adult fare.'},methodology:'Itemized planning estimates are reconciled, not promoted to confirmed quotes. No live four-seat award is established. Each alternative independently uses up to 200,000 miles at 1 cent against eligible travel. Cash plans retain all miles. Transfer and mixed awards cannot affect ranking without complete reproducible inventory and charges.',limitations:['Only selected cash itineraries reached a booking-option page; airline checkout and exact paid-seat quotes were not captured. Gateway round trips are explicitly proxies for open jaws.','Lodging properties/room configurations, rental coverage and 2027 activity checkouts are not held or fully quoted. Their itemized allowances remain planning estimates.','Historical weather/fire/swim evidence is not a forecast. Fire probability bands are subjective planning judgments.','No promotional transfer bonus is credited. Award inventory and exact transfer timing remain unverified.','USD planning allowances are retained rather than asserting an executable future exchange rate. Requote local-currency expenses and taxes before purchase.'],trips:[]};

for(const {slug,main}of selected){
  const path=`src/_data/${slug}/main.json`,current=read(path),sc=current.scorecard;
  const html=main.parts.filter(p=>p.t==='raw').map(p=>p.html).join('\n');
  const oldBudgetRows=rowsOf(html,'budget'),oldTotalsRows=rowsOf(html,'totals');
  let items=structuredClone(oldBudgetRows);
  if(['portugal','greece-via-lisbon','sicily-malta'].includes(slug))items=structuredClone(oldTotalsRows);
  const replace=(re,l,h,label)=>{const i=items.findIndex(r=>re.test(r.label));if(i<0)throw new Error(`${slug}: missing ${re}`);items[i]={...items[i],lowUsd:l,highUsd:h,...(label?{label}:{})};};
  if(slug==='crete'){replace(/^Flights/,7700,8300);items.push(row('Insurance and contingency',500,900,'Planning reserve; not an insurance quote.'));}
  if(slug==='iceland')replace(/airfare/,3600,4200,'Protected one-stop family airfare, bags and seat allowance');
  if(slug==='slovenia-adriatic')replace(/airfare/,6300,7000,'PIT–Ljubljana family round-trip airfare, bags and seat allowance');
  if(slug==='portugal'){
    replace(/^Flights/,6000,7400);replace(/^Internal/,750,1000,'Internal flight Faro–Lisbon–Funchal, bags and seats');replace(/^Rental/,675,1250,'Rental cars — mainland and Madeira, one-way drop, fuel/tolls allowance');
    items.push(row('Insurance and contingency',400,700,'Planning reserve; quote coverage and excess separately.'));
  }
  if(slug==='greece-cyclades'){replace(/round-trip airfare/,5800,7200);replace(/domestic flight/,650,850);}
  if(slug==='sicily-malta'){replace(/^Flights/,6200,7400,'Outer airfare: Palermo in / Malta out, bags and seats (proxy)');items.push(row('Insurance and contingency',400,700));}
  if(slug==='maui-kauai')replace(/^Mainland/,4200,5200);
  if(slug==='portugal-crete')replace(/^All flights/,6600,8000);
  if(slug==='portugal-sicily')replace(/^Flights/,6900,8300);
  if(slug==='hawaii')items.push(row('Insurance and contingency',400,700,'Retained from the original total table; absent from the detailed budget.'));
  if(slug==='portugal-algarve-sicily'){replace(/^Open-jaw/,6600,7600);replace(/^Insurance/,500,900,'Insurance and contingency');}
  if(slug==='sardinia-corsica')items.push(row('Insurance and contingency',400,700,'Explicit reserve; formerly absent from itemized budget.'));
  if(slug==='greece-ionian')replace(/^Lodging/,1700,2800,'Lodging: 12 nights including Athens airport buffer (estimate)');
  if(slug==='greece-via-lisbon'){replace(/^Flights/,5200,8200,'International airfare and Lisbon–Athens allocation; Crete flights separate');items.push(row('Insurance and contingency',400,700,'Not included in the original docs/transfers or food/activity lines; planning reserve, not quoted coverage.'));}
  // A cost appearing in an aggregate row is never added a second time.
  for(const item of items){if(item.highUsd<item.lowUsd)throw new Error(`${slug}: inverted range`);item.note ||= 'Retained itemized USD planning allowance; exact 2027 family checkout not verified.';}
  const gross={floorUsd:items.reduce((s,r)=>s+r.lowUsd,0),ceilUsd:items.reduce((s,r)=>s+r.highUsd,0)};
  const flightItems=items.filter(r=>/flight|airfare|air tickets|^Air ·|^All air|^Mainland|^Inter-island HNL|^Inter-island OGG|^Island hop/i.test(r.label));
  const air={lowUsd:flightItems.reduce((s,r)=>s+r.lowUsd,0),highUsd:flightItems.reduce((s,r)=>s+r.highUsd,0)};
  if(air.lowUsd<2000)throw new Error(`${slug}: flight allocation missing`);
  Object.assign(sc.budget,points.fixedValuePlan(gross,air.lowUsd,pointsData.balance));
  sc.axes={...main.scorecard.axes};
  if(slug==='switzerland-crete')sc.axes.risk=3;
  sc.axes.budget=points.budgetScore(sc.budget,'medium');
  sc.axes.nights=sc.pto.nights>=12?5:sc.pto.nights===11?4:sc.pto.nights===10?3:sc.pto.nights===9?2:1;
  sc.axes.pto=manifest.ptoRubric[String(sc.pto.days)];
  sc.totalBaked=manifest.axes.reduce((s,a)=>s+sc.axes[a.id]*a.weightDefault,0);
  const check=cashChecks[slug] || (sharedChecks[slug]?{...cashChecks[sharedChecks[slug]],sharedWith:sharedChecks[slug]}:null);
  const plan=pointsData.plans[slug];
  Object.assign(plan,{rankableStrategy:'fixed-value',grossCashRangeUsd:[gross.floorUsd,gross.ceilUsd],netCashRangeUsd:[sc.budget.floorUsd,sc.budget.ceilUsd],milesRequired:200000,savingsUsd:2000,centsPerMile:1,remainingCashAirfareUsd:[air.lowUsd-2000,air.highUsd-2000],awardChargesUsd:0,availabilityConfidence:'high for fixed-value eligibility; unverified for awards',cashAirfareRangeUsd:[air.lowUsd,air.highUsd],fourAwardSeatsConfirmed:false,cashPlan:{milesUsed:0,milesRetained:200000,tripRangeUsd:[gross.floorUsd,gross.ceilUsd]},bookingCaveat:'Pay eligible travel with the miles card and redeem within 90 days of posting. No airline transfer is needed. Confirm merchant eligibility before spending; retain miles until booking if the route is unresolved. The same 200,000-mile balance is evaluated independently for each alternative.',transferTiming:'Do not transfer until all four seats, complete dates, taxes, surcharges, bags, seats and change/refund conditions are verified at checkout. Transfers cannot be reversed; instant completion is not guaranteed.',mixedStrategy:'If only one direction for all four is available, price the other direction in cash and apply remaining Capital One miles at 1 cent. Include the loss of round-trip cash pricing. Never split the family across different flights to manufacture savings.',transferSavingsUsedUsd:0});
  const notes=costNotes[slug]||'Reconcile the detailed itemized budget instead of retaining the rounded Grand Total. Previously grouped or mismatched category figures are replaced by the itemized sum; unquoted costs remain estimates.';
  audit.trips.push({slug,name:sc.displayName,previousRank:oldOrder.findIndex(t=>t.slug===slug)+1,previousScore:main.scorecard.totalBaked,previousAxes:main.scorecard.axes,previousGrossUsd:[main.scorecard.budget.floorUsd,main.scorecard.budget.ceilUsd],travelWindow:profile.tripWindows[slug],hotelNights:sc.pto.nights,ptoDays:sc.pto.days,routeReadiness:profile.routeReadiness[slug],cashCheck:check,priorFlightEvidence:read('src/_data/flightAudits.json').trips[slug],costNotes:notes,originalBudgetRows:oldBudgetRows,originalTotalsRows:oldTotalsRows,lineItems:items,grossCashRangeUsd:[gross.floorUsd,gross.ceilUsd],netCashRangeUsd:[sc.budget.floorUsd,sc.budget.ceilUsd],savingsUsd:2000,redemptionConfidence:plan.availabilityConfidence,axes:sc.axes,score:sc.totalBaked,axisChanges:Object.keys(sc.axes).filter(id=>sc.axes[id]!==main.scorecard.axes[id]).map(id=>({axis:id,from:main.scorecard.axes[id],to:sc.axes[id]}))});
  const table=`<div class="budget-scroll"><table class="budget-tbl"><tr><th>Item · family of four</th><th>USD planning range</th></tr>${items.map(r=>`<tr><td>${esc(r.label)}</td><td>${band(r.lowUsd,r.highUsd)}</td></tr>`).join('')}<tr class="total"><td>Grand total · gross cash</td><td>${band(gross.floorUsd,gross.ceilUsd)}</td></tr></table></div>`;
  const intro=`<p>These are itemized planning allowances, not held reservations. ${esc(notes)} Exact property, car, seat and activity prices remain booking checks.</p>`;
  const totals=`<section id="totals" class="divider"><div class="section-label"><p class="eyebrow">Bottom Line</p><h2>Gross cash and points-adjusted cost</h2></div>${table}<p><strong>After 200,000 Capital One miles: ${band(sc.budget.floorUsd,sc.budget.ceilUsd)}.</strong> The ${money(2000)} credit is applied once against eligible airfare. Gross cost remains ${band(gross.floorUsd,gross.ceilUsd)}. Budget ${sc.axes.budget}/5 uses the net range; no speculative transfer savings are counted.</p><p>Daily costs describe food and activities already included here. They are not added again. Any final quote outside an allowance requires a fresh total and score.</p></section>`;
  const budget=`<section id="budget" class="divider"><div class="section-label"><p class="eyebrow">Budget</p><h2>Itemized family planning estimate</h2></div>${intro}${table}</section>`;
  for(const p of current.parts){if(p.t!=='raw')continue;for(const [id,replacement]of [['budget',budget],['totals',totals]])p.html=p.html.replace(new RegExp(`<section\\b[^>]*id="${id}"[\\s\\S]*?<\\/section>`),()=>replacement);}
  write(path,current);
  const ep=`src/_data/${slug}/evidence.json`,e=read(ep);
  e.axes.budget.score=sc.axes.budget;
  e.axes.budget.rationale=`${notes} Gross ${band(gross.floorUsd,gross.ceilUsd)} less a single $2,000 fixed travel redemption yields ${band(sc.budget.floorUsd,sc.budget.ceilUsd)}. Budget ${sc.axes.budget}/5 follows the manifest; unresolved quotes prevent the high-confidence 3/5 exception.`;
  e.axes.budget.confidence='medium';
  const bf=e.facts.find(f=>f.id==='budget-band');
  bf.value={...bf.value,lowUsd:sc.budget.floorUsd,highUsd:sc.budget.ceilUsd,grossLowUsd:gross.floorUsd,grossHighUsd:gross.ceilUsd,pointsSavingsUsd:2000};
  bf.value.lineItemCount=items.length;
  bf.value.expectedUsd=null;
  bf.value.arithmetic=items.map(r=>`${r.lowUsd}/${r.highUsd}`).join(' + ')+` = ${gross.floorUsd}/${gross.ceilUsd} gross; minus 2000/2000 = ${sc.budget.floorUsd}/${sc.budget.ceilUsd} net`;
  bf.confidence='medium';bf.verifiedAt=date;bf.expiresAt='2026-10-11';bf.claimType='derived';bf.proxyStatus='current-proxy';
  bf.sourceRefs=['internal-itinerary','capital-one-fixed-travel'];bf.sourceLocators={'internal-itinerary':`${slug}/main.json budget table; exact sum recorded in rerankingAudit.json; supplier checkouts remain open`,'capital-one-fixed-travel':'Capital One travel-purchase redemption, eligibility by merchant coding and redemption within 90 days; independent rate confirmation in capitalOnePoints sources'};
  e.reviewedAt=date;
  if(slug==='switzerland-crete'){
    e.axes.risk.score=3;
    e.axes.risk.rationale='The September 10 exact-date ZRH–HER June 14 nonstop is selling from $149/person, replacing the old unpublished/weekly-Chania assumption. Like Switzerland + Sicily, the open-jaw checkout and mountain weather remain gates: Risk 3/5, not 2/5. This is stored prior-day evidence, not four-seat award availability.';
  }
  const confidence=deriveEvidenceConfidence(e,manifest);
  for(const [axis,value]of Object.entries(confidence.axes))e.axes[axis].confidence=value;
  e.overallConfidence=confidence.overall;
  write(ep,e);
  const vp=`src/_data/${slug}/variants.json`,v=read(vp),canonical=v.variants.find(v=>v.canonical);
  canonical.budget={...canonical.budget,lowUsd:sc.budget.floorUsd,highUsd:sc.budget.ceilUsd,grossLowUsd:gross.floorUsd,grossHighUsd:gross.ceilUsd,pointsSavingsUsd:2000};
  write(vp,v);
}
const newOrder=order(selected.map(({slug})=>({slug,...read(`src/_data/${slug}/main.json`).scorecard})));
for(const r of audit.trips){r.newRank=newOrder.findIndex(t=>t.slug===r.slug)+1;r.movedOnlyBecauseOthersChanged=r.previousRank!==r.newRank&&r.axisChanges.length===0&&r.previousGrossUsd.every((v,i)=>v===r.grossCashRangeUsd[i]);}
audit.trips.sort((a,b)=>a.newRank-b.newRank);
write('src/_data/rerankingAudit.json',audit);
write('src/_data/capitalOnePoints.json',pointsData);
const sources=read('src/_data/shared/evidenceSources.json');
sources['capital-one-fixed-travel']={label:'Capital One eligible travel redemption rules',tier:'official',publisher:'Capital One',url:'https://www.capitalone.com/learn-grow/money-management/ways-to-redeem-venture-miles/',scope:'Eligible recent travel purchases can be covered within 90 days; merchant coding controls eligibility. No airline award seats are implied. Current 1-cent rate independently corroborated by The Points Guy fixed-value redemption guide.'};
write('src/_data/shared/evidenceSources.json',sources);
console.log(audit.trips.map(r=>`${r.previousRank}->${r.newRank} ${r.slug}: ${r.score}/55 ${band(...r.grossCashRangeUsd)} gross; ${band(...r.netCashRangeUsd)} net`).join('\n'));
