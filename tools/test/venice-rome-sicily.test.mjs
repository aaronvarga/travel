import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const main=read('src/_data/venice-rome-sicily/main.json');

test('Venice–Rome–Sicily limits Rome and protects all eight Sicily nights',()=>{
  const stays=main.itinerary.days.flatMap(d=>d.facts.filter(f=>f.label==='Sleep').map(f=>f.valueHtml));
  for(const [base,nights]of [['Venice',2],['Rome',2],['Ortigia',4],['Giardini Naxos',4]]){
    assert.equal(stays.filter(s=>s.startsWith(base)).length,nights,base);
  }
  assert.equal(stays.length,12);
  assert.equal(main.itinerary.days.length,14);
  assert.match(main.itinerary.days[3].heading,/Venice → Rome/);
  assert.match(main.itinerary.days[5].heading,/Rome → Catania/);
  assert.match(main.itinerary.days[13].heading,/Catania → Pittsburgh/);
  assert.deepEqual(read('src/_data/decisionProfile.json').tripWindows[main.slug],['2027-06-10','2027-06-23']);
  assert.equal(main.itinerary.days[8].facts.some(f=>/Juneteenth/.test(f.valueHtml)),true);
  assert.equal(read('src/_data/sicily-rome/main.json').scorecard.pto.nights,12);
  const old=read('src/_data/sicily-rome/main.json').itinerary.days;
  assert.equal(old.filter(d=>d.facts.some(f=>f.label==='Sleep'&&f.valueHtml.startsWith('Rome'))).length,4);
});

test('new three-destination plan is cash-only and exposes quote and registration gaps',()=>{
  const evidence=read('src/_data/venice-rome-sicily/evidence.json');
  const fact=id=>evidence.facts.find(f=>f.id===id);
  assert.equal(main.scorecard.budget.floorUsd,14530);
  assert.equal(main.scorecard.budget.ceilUsd,20580);
  assert.equal(main.scorecard.budget.pointsSavingsUsd,undefined);
  assert.equal(fact('route-readiness').value.exact2027FlightsVerified,false);
  assert.equal(fact('venice-access').value.finalRulesVerified,false);
  assert.equal(fact('budget-band').value.lineItems.reduce((s,r)=>s+r.lowUsd,0),14530);
  assert.equal(fact('budget-band').value.lineItems.reduce((s,r)=>s+r.highUsd,0),20580);
  assert.equal(evidence.metrics.baseMoves,3);
});
