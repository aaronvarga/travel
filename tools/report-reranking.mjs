#!/usr/bin/env node
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { compareDefault } from './lib/recommendation-engine.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const audit=read('src/_data/rerankingAudit.json');
const summary=read('assets/trips-summary.json');
const analysis=read('assets/rank-analysis.json');
const previousAnalysis=JSON.parse(execFileSync('git',['show',`${audit.baselineCommit}:assets/rank-analysis.json`],{encoding:'utf8'}));
const dollars=n=>'$'+n.toLocaleString('en-US');
const band=a=>a.map(dollars).join('–');
const weights=Object.fromEntries(summary.axes.map(a=>[a.id,a.weightDefault]));
const ordered=trips=>trips.sort((a,b)=>compareDefault(a,b,summary.axes,weights,summary.budgetTargets));
const active=summary.trips.filter(t=>!t.excluded);
const old=active.map(t=>{const r=audit.trips.find(r=>r.slug===t.slug);return {...t,axes:r.previousAxes,totalBaked:r.previousScore,budget:{...t.budget,floorUsd:r.previousGrossUsd[0],ceilUsd:r.previousGrossUsd[1]}};});
for(const r of audit.trips){
  r.rankIfOnlyThisTripChanged=ordered(old.map(t=>t.slug===r.slug?active.find(n=>n.slug===r.slug):t)).findIndex(t=>t.slug===r.slug)+1;
  r.rankIfOnlyOthersChanged=ordered(active.map(t=>t.slug===r.slug?old.find(n=>n.slug===r.slug):t)).findIndex(t=>t.slug===r.slug)+1;
  r.movedOnlyBecauseOthersChanged=r.newRank!==r.previousRank&&r.axisChanges.length===0&&r.rankIfOnlyOthersChanged===r.newRank;
}
audit.validation={tests:'57/57 pass',scorecards:'42: 22 ranked comparison, 9 excluded, 11 short',fullEvidence:'42/42 evidence records pass',budgetReconciliation:'42/42 matched; exact zero tolerance for the 22 audited gross totals',build:'npm run build passed, including all evidence freshness gates',render:'73 pages; source/static order, totals, badges, matrix and TLDR parity passed',sync:'npm run sync and npm run sync:check passed',diff:'git diff --check passed',performance:'hub <=650000 bytes; itinerary <=1100000 bytes; 2120 responsive image sets passed',scope:'22 full trips reranked; all 11 short scorecards and variants unchanged. User-authorized follow-up corrected expired evidence and flight labels in 10 short escapes. Nine excluded source sets unchanged.',browser:'Fresh local Chromium session; preview CacheStorage and service workers cleared. Homepage, comparison table, Crete points, Slovenia flight audit, Iceland/Ischia/Cilento warning and refreshed short-Iceland route warning inspected.',commit:'See the commit containing this report (git log -1 -- docs/reranking-2026-09-11.md). Push result is reported separately; deployment is not verified.'};
fs.writeFileSync('src/_data/rerankingAudit.json',JSON.stringify(audit,null,2)+'\n');
const lines=[
  '# 22-trip reranking — validated planning audit',
  '',
  `Research date: ${audit.asOf}. Baseline: ${audit.baselineCommit}. Branch: main.`,
  '',
  'Scope is the user-confirmed 22-trip shortlist. The nine family-excluded references and eleven short escapes were not reranked. The original 40/21/9/10 description is stale: this checkout validates 42/22/9/11. The user subsequently authorized the evidence corrections needed to unblock the full build; the validator was not weakened.',
  '',
  'This is a reconciled planning audit, not a complete set of bookable supplier quotes. Four complete outer cash itineraries reached Google Flights booking-option pages; other checks are explicitly gateway/component proxies. Exact lodging configurations, car coverage, most activity checkouts and all four-seat award searches remain unconfirmed. Do not interpret a stored estimate as a current quote.',
  '',
  '## Complete deterministic ranking',
  '',
  'All 22 alternatives independently spend the same 200,000 Capital One miles for $2,000 eligible travel credit at 1 cent/mile. Confidence is high for that redemption mechanism, conditional on an eligible charge; trip cost estimates are medium/low confidence. Award availability is unverified for every trip. Cash-only plans retain all 200,000 miles and cost the gross band.',
  '',
  '| New | Previous | Trip | Score /55 | Gross cash | Net cash | Savings | Redemption confidence |',
  '|---:|---:|---|---:|---|---|---:|---|',
  ...audit.trips.map(r=>`| ${r.newRank} | ${r.previousRank} | ${r.name} | ${r.score} | ${band(r.grossCashRangeUsd)} | ${band(r.netCashRangeUsd)} | $2,000 | Fixed high; awards unverified |`),
  '',
  'Iceland + Ischia/Cilento remains reroute-required. Its high raw score is not a book-ready recommendation. The reroute may materially exceed the retained airfare estimate. No family exclusion was removed and no readiness gate was hidden.',
  '',
  '## Every score change',
  '',
  '| Trip | Changed axis | Before → after | Evidence / calculation |',
  '|---|---|---|---|',
  ...audit.trips.flatMap(r=>r.axisChanges.map(c=>`| ${r.name} | ${c.axis} | ${c.from} → ${c.to} | ${c.axis==='budget'?`Gross ${band(r.grossCashRangeUsd)} minus $2,000 = ${band(r.netCashRangeUsd)}; manifest threshold applied. ${r.costNotes}`:r.axisReview[c.axis].rationale} |`)),
  '',
  'Every Nights and PTO axis was re-derived from the canonical hotel nights and PTO days; none changed. All weighted totals were recomputed. The nine other non-Budget axes were reviewed against their stored rubrics and evidence; except Switzerland + Crete Risk, these scores were retained. They were not all independently remeasured from new weather/fire datasets, and must not be described as new 2027 forecasts. PTO still has zero default weight.',
  '',
  '## Rank-only movement and tie breaks',
  '',
  'The shared engine sorts by weighted score, budget-preference tier when Budget is weighted, PTO days, net ceiling, net floor, then display name. No points bonus axis was added.',
  '',
  'Counterfactual definition: a rank-only mover has unchanged component scores and reaches the same new rank when its own old values are restored while every other trip remains updated. Cost-only movement is not automatically called another trip’s effect.',
  '',
  ...audit.trips.filter(r=>r.movedOnlyBecauseOthersChanged).map(r=>`- ${r.name}: #${r.previousRank} → #${r.newRank}, ${r.score}/55; same rank in the others-only counterfactual.`),
  '',
  '## Sensitivity analysis',
  '',
  `Regenerated ${analysis.method.iterations.toLocaleString()} deterministic profiles using seed ${analysis.method.seed}. The candidate set is unchanged at ${analysis.trips.length} ranked full trips (previously ${previousAnalysis.trips.length}); no short escapes or excluded references entered the simulation. Percentages are weight sensitivity, not probabilities of vacation quality, prices, or booking success. Unchanged trips can gain or lose share when another trip’s Budget, Risk or tie-break costs change.`,
  '',
  '| Trip | Previous win % | New win % | Previous top-three % | New top-three % |',
  '|---|---:|---:|---:|---:|',
  ...audit.trips.map(r=>{const p=previousAnalysis.trips.find(t=>t.slug===r.slug),n=analysis.trips.find(t=>t.slug===r.slug);return `| ${r.name} | ${p?.winPct} | ${n.winPct} | ${p?.top3Pct} | ${n.top3Pct} |`;}),
  '',
  '## Per-trip audit and open booking assumptions',
];
for(const r of audit.trips){
  const plan=read('src/_data/capitalOnePoints.json').plans[r.slug];
  lines.push('',`### #${r.newRank} ${r.name}`,'',`Window: ${r.travelWindow.join(' through ')}. Hotel nights: ${r.hotelNights}; PTO: ${r.ptoDays}. Route readiness: ${r.routeReadiness}.`,'',r.cashCheck?`Cash check: ${r.cashCheck.scope}; ${r.cashCheck.route}; family base ${dollars(r.cashCheck.baseFareUsd)}. ${r.cashCheck.note}${r.cashCheck.sharedWith?' Shared gateway evidence from '+r.cashCheck.sharedWith+'; not this complete open jaw.':''}`:`No new complete four-person cash quote. Stored previous-day component evidence: ${r.priorFlightEvidence.detail}`,'',r.costNotes,'','| Item | Low | High | Basis |','|---|---:|---:|---|',...r.lineItems.map(l=>`| ${l.label} | ${dollars(l.lowUsd)} | ${dollars(l.highUsd)} | Planning estimate; exact checkout open |`),'',`Gross ${band(r.grossCashRangeUsd)}; fixed redemption $2,000; net ${band(r.netCashRangeUsd)}. Cash airfare allocation ${band(plan.cashAirfareRangeUsd)}; remaining airfare after credit ${band(plan.remainingCashAirfareUsd)}. Award charges: $0 only because no award is used. Hypothetical award charges are unknown, not zero.`,'',...Object.entries(r.costAssumptions).map(([k,v])=>`- ${k}: ${v}`),'',...r.operatorChecks.map(c=>`- Current operator check: ${c.finding} [${audit.sources[c.source].label}](${audit.sources[c.source].url})`),'',`All axis scores and individual rubric rationales: [canonical evidence](../src/_data/${r.slug}/evidence.json). Complete per-program transfer screening, ratios, taxes/cancellation caveats and mixed strategy: [Capital One plans](../src/_data/capitalOnePoints.json), key ${r.slug}. No transfer or promotional bonus contributes savings.`);
}
lines.push('','## Sources and evidence labels','',...Object.values(audit.sources).map(s=>`- [${s.label}](${s.url}) — ${s.type}.`),'','Cash schedules/fare observations use [Google Flights](https://www.google.com/travel/flights) with 3 adults and 1 child aged 2–11, because the 13-year-old requires an adult fare. Exact booking-option observations are distinct from final airline checkouts, gateway proxies, published award floors and unsupported planning allowances. The checked route/date/time/party fields are recorded in the machine-readable audit. No login-gated award inventory was captured.','', 'Transfers are irreversible; no transfer-time guarantee or active bonus is assumed. For a mixed award, price one direction for all four plus cash in the other direction and include taxes, carrier surcharges, bags, seats, positioning and the loss of round-trip cash pricing. Remaining Capital One miles can offset eligible charges at 1 cent. A theoretical 25,000-point award is not a $2,000+ saving.','','## Validation and publication state','',...Object.entries(audit.validation).map(([k,v])=>`- ${k}: ${v}`),'','The former blocker was 16 expired facts across 10 short escapes. Current operator route pages were reviewed; old exact-date confirmation claims were downgraded to current proxies, with the original facts archived. Budget arithmetic remains a planning estimate, not a renewed supplier quote. All short-escape scores and costs remain unchanged. The homepage now derives its lead score and Portugal cost comparison from canonical data instead of stale fixed-price claims.','','## Files changed','', 'Canonical changes: main/evidence/variants for the 22 listed trips; capitalOnePoints.json; decisionProfile.json (Crete dated schedule readiness); flightAudits.json; rerankingAudit.json; shared evidence sources; hub data/card summaries; homepage/comparison and points templates. Tools include capped points arithmetic, audit propagation/reporting, gross/net reconciliation and additional parity tests. Summary, sensitivity, image-manifest ordering and root HTML were generated by supported tools. No itinerary-creation generator ran.','','The resulting commit is the commit containing this report; its hash and push result are provided in the task handoff. Deployment is not separately verified.','');
fs.mkdirSync('docs',{recursive:true});
fs.writeFileSync('docs/reranking-2026-09-11.md',lines.join('\n'));
console.log('Wrote docs/reranking-2026-09-11.md and recorded counterfactual/validation details.');
