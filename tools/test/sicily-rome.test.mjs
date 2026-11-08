import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { ptoDays } from '../composer/estimate-scorecard.mjs';
const require=createRequire(import.meta.url);
const main=require('../../src/_data/sicily-rome/main.json');
const profile=require('../../src/_data/decisionProfile.json');

test('family shortlist retains the selected Sicily options and Madeira–Mallorca',()=>{
  const trips=require('../../src/_data/familyShortlist.js')();
  const all=fs.readdirSync('src/_data').filter(slug=>slug.includes('sicily')&&slug!=='switzerland-sicily'&&fs.existsSync(`src/_data/${slug}/main.json`));
  assert.deepEqual(trips.map(t=>t.slug).sort(),[...all,'madeira-mallorca'].sort());
  assert.equal(new Set(trips.map(t=>t.slug)).size,trips.length);
});

test('Sicily–Rome protects twelve hotel nights and the Pittsburgh commitment',()=>{
  assert.deepEqual(profile.tripWindows['sicily-rome'],['2027-06-10','2027-06-23']);
  assert.equal(main.itinerary.days.length,14);
  const sleeps=main.itinerary.days.flatMap(d=>d.facts.filter(f=>f.label==='Sleep').map(f=>f.valueHtml));
  assert.equal(sleeps.filter(s=>s.includes('Ortigia')).length,4);
  assert.equal(sleeps.filter(s=>s.includes('Naxos')).length,4);
  assert.equal(sleeps.filter(s=>s.includes('Rome')).length,4);
  // The shared composer assumes an evening departure; this unquoted plan counts that workday.
  assert.equal(main.scorecard.pto.days,ptoDays(...profile.tripWindows['sicily-rome'])+1);
  assert.equal(main.itinerary.days[6].facts.some(f=>/holiday/i.test(f.valueHtml)),false);
  assert.equal(main.itinerary.days[8].eyebrow,'Fri · Jun 18');
  const evidence=require('../../src/_data/sicily-rome/evidence.json');
  assert.equal(evidence.facts.find(f=>f.id==='route-readiness').value.exact2027FlightsVerified,false);
  assert.equal(evidence.facts.find(f=>f.id==='venice-tradeoff').value.totalBudget,'unknown');
  assert.equal(main.scorecard.budget.floorUsd,14000);
  assert.equal(main.scorecard.budget.ceilUsd,19400);
  assert.equal(main.scorecard.budget.pointsSavingsUsd,undefined);
});
