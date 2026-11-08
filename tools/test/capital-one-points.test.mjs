import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

test('all trips and canonical variants use full cash without miles discounts',()=>{
  assert.equal(read('src/_data/decisionProfile.json').budget.useMiles,false);
  const plans=read('src/_data/capitalOnePoints.json');
  assert.equal(plans.enabled,false);
  assert.equal(plans.fixedValueUsd,0);
  for(const slug of fs.readdirSync('src/_data')){
    const file=`src/_data/${slug}/main.json`;
    if(!fs.existsSync(file))continue;
    const main=read(file),evidence=read(`src/_data/${slug}/evidence.json`),variants=read(`src/_data/${slug}/variants.json`);
    const budget=main.scorecard.budget;
    for(const key of ['pointsSavingsUsd','milesRequired','grossFloorUsd','grossCeilUsd'])assert.equal(budget[key],undefined,`${slug}: obsolete ${key}`);
    const fact=evidence.facts.find(f=>f.id==='budget-band');
    assert.equal(fact.value.lowUsd,budget.floorUsd,slug);
    assert.equal(fact.value.highUsd,budget.ceilUsd,slug);
    const canonical=variants.variants.find(v=>v.id===variants.canonicalId);
    assert.equal(canonical.budget.lowUsd,budget.floorUsd,slug);
    assert.equal(canonical.budget.highUsd,budget.ceilUsd,slug);
    if(plans.plans[slug])assert.equal(plans.plans[slug].savingsUsd,0);
  }
});

test('trip rendering and hub comparison no longer offer miles redemption',()=>{
  const page=fs.readFileSync('src/itinerary.njk','utf8');
  assert.doesNotMatch(page,/capital-one-points|Points &amp; Miles/);
  for(const file of ['src/index.njk','assets/js/compare.js','src/_includes/hub/trip-length.njk']){
    assert.doesNotMatch(fs.readFileSync(file,'utf8'),/Net after miles|200,000-mile|fixed-value miles redemption|Defensible miles savings|Capital One travel credit/);
  }
});
