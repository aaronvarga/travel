#!/usr/bin/env node
import fs from 'node:fs';
import { load } from 'cheerio';
import points from './lib/points-budget.cjs';
import { compareDefault } from './lib/recommendation-engine.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const root='src/_data',manifest=read('tools/scorecard.manifest.json');
const profile=read(`${root}/decisionProfile.json`);
profile.budget.useMiles=false;
write(`${root}/decisionProfile.json`,profile);
const band=b=>`$${b.floorUsd.toLocaleString('en-US')}–$${b.ceilUsd.toLocaleString('en-US')}`;
const cash=b=>{
 const savings=b.pointsSavingsUsd||0;
 const result={...b};
 if('floorUsd'in b){result.floorUsd=b.grossFloorUsd??b.floorUsd+savings;result.ceilUsd=b.grossCeilUsd??b.ceilUsd+savings;}
 if('lowUsd'in b){result.lowUsd=b.grossLowUsd??b.lowUsd+savings;result.highUsd=b.grossHighUsd??b.highUsd+savings;}
 for(const k of ['grossFloorUsd','grossCeilUsd','grossLowUsd','grossHighUsd','pointsSavingsUsd','milesRequired','centsPerMile','basis'])delete result[k];
 return result;
};
const records=[];
for(const slug of fs.readdirSync(root)){
 const file=`${root}/${slug}/main.json`;
 if(!fs.existsSync(file))continue;
 const main=read(file),sc=main.scorecard;
 sc.budget=cash(sc.budget);
 const evidence=read(`${root}/${slug}/evidence.json`);
 sc.axes.budget=points.budgetScore(sc.budget,evidence.axes.budget.confidence);
 sc.totalBaked=manifest.axes.reduce((s,a)=>s+sc.axes[a.id]*a.weightDefault,0);
 const range=band(sc.budget);
 evidence.axes.budget.score=sc.axes.budget;
 evidence.axes.budget.rationale=`Full cash planning band ${range}, with no miles redemption, scores ${sc.axes.budget}/5 against the $12,000 target and $15,000 preferred maximum. Existing supplier observations have not been refreshed.`;
 const fact=evidence.facts.find(f=>f.id==='budget-band');
 fact.value={...cash(fact.value),lowUsd:sc.budget.floorUsd,highUsd:sc.budget.ceilUsd,paymentBasis:'cash',arithmetic:`Full cash total ${range}; no miles credit. Itemized source: ${slug}/main.json #totals.`};
 fact.sourceRefs=fact.sourceRefs.filter(ref=>!ref.startsWith('capital-one'));
 for(const ref of Object.keys(fact.sourceLocators||{}))if(ref.startsWith('capital-one'))delete fact.sourceLocators[ref];
 evidence.reviewedAt='2026-11-07';
 const variants=read(`${root}/${slug}/variants.json`);
 for(const variant of variants.variants||[])if(variant.budget)variant.budget=cash(variant.budget);
 const canonical=variants.variants.find(v=>v.id===variants.canonicalId);
 canonical.budget.lowUsd=sc.budget.floorUsd;canonical.budget.highUsd=sc.budget.ceilUsd;
 for(const part of main.parts.filter(p=>p.t==='raw')){
  const $=load(part.html,{decodeEntities:false});
  const replacements=[];
  $('.pv-stats b').each((_,el)=>{if($(el).text().includes('$'))replacements.push([$.html(el),`<b>${range}</b>`]);});
  $('.tldr').each((_,el)=>replacements.push([$.html(el),`<div class="tldr" data-audit-rank="0"><b>${sc.displayName} · ${sc.totalBaked}/55.</b> Full cash planning budget ${range}. Supplier quotes and route readiness still need their documented checks.</div>`]));
  $('p,li,span,h2,h3,h4,th,td').each((_,el)=>{
   if($(el).closest('.tldr').length)return;
   const text=$(el).text();
   if(/Capital One|points.adjusted|same miles credit|fixed.value.*credit|fixed travel credit|after.*miles|\bnet\b.*\bgross\b|\bgross\b.*\bnet\b|gross\/net|\bnet allowance\b/i.test(text)){
    let html;
    if(/^h[234]$/.test(el.name))html='Full cash trip cost';
    else if(/net allowance/i.test(text))html='cash allowance';
    else if(/old|observed|supplier|quote|uncertain/i.test(text)&&!/[\d,]+.*miles|\$2,000/i.test(text))html=`Full cash planning budget ${range}. Exact family airfare and rooms remain unquoted.`;
    else html=`Full cash planning budget ${range}. Final booking costs remain unconfirmed.`;
    replacements.push([$.html(el),`<${el.name}>${html}</${el.name}>`]);
   }
  });
  for(const [before,after]of replacements)part.html=part.html.replace(before,after);
  part.html=part.html.replace(/No redemption savings are applied; final/g,'Final').replace(/\. final booking/g,'. Final booking').replace(/Grand total · gross cash/g,'Grand total · cash').replace(/Gross cash/g,'Full cash');
 }
 records.push({slug,file,main,evidence,variants,...sc,excluded:main.excluded||null});
}
const weights=Object.fromEntries(manifest.axes.map(a=>[a.id,a.weightDefault]));
const ranked=records.filter(r=>r.main.tripCategory!=='short'&&!r.excluded).sort((a,b)=>compareDefault(a,b,manifest.axes,weights,profile.budget));
for(const r of records){
 const rank=ranked.findIndex(t=>t.slug===r.slug)+1;
 for(const part of r.main.parts.filter(p=>p.html))part.html=part.html.replace(/data-audit-rank="\d+"/g,`data-audit-rank="${rank}"`);
 write(r.file,r.main);write(`${root}/${r.slug}/evidence.json`,r.evidence);write(`${root}/${r.slug}/variants.json`,r.variants);
}
const audit=read(`${root}/rerankingAudit.json`);
for(const r of audit.trips){
 const current=records.find(t=>t.slug===r.slug);
 r.netCashRangeUsd=[current.budget.floorUsd,current.budget.ceilUsd];
 r.grossCashRangeUsd=[...r.netCashRangeUsd];r.fixedCreditUsd=0;r.paymentBasis='cash';
 r.score=current.totalBaked;r.newRank=ranked.findIndex(t=>t.slug===r.slug)+1;
 r.axisReview.budget={...r.axisReview.budget,score:current.axes.budget,rationale:current.evidence.axes.budget.rationale};
}
write(`${root}/rerankingAudit.json`,audit);
const plans=read(`${root}/capitalOnePoints.json`);
plans.enabled=false;plans.balance=0;plans.fixedValueUsd=0;
plans.plans=Object.fromEntries(records.filter(r=>r.main.tripCategory!=='short').map(r=>[r.slug,{strategy:'cash',route:r.title,cashImpact:`Full cash planning budget ${band(r.budget)}.`,grossCashRangeUsd:[r.budget.floorUsd,r.budget.ceilUsd],netCashRangeUsd:[r.budget.floorUsd,r.budget.ceilUsd],savingsUsd:0,milesRequired:0,transferSavingsUsedUsd:0,fourAwardSeatsConfirmed:false}]));
write(`${root}/capitalOnePoints.json`,plans);
console.log(`Updated ${records.length} trip budgets to cash; ${ranked.length} ranked options.`);
