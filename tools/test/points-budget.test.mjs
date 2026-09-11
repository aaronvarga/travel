import test from 'node:test';
import assert from 'node:assert/strict';
import points from '../lib/points-budget.cjs';
import fs from 'node:fs';
import { load } from 'cheerio';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8'));

test('fixed travel redemption is capped by both eligible spending and balance', () => {
  assert.equal(points.fixedValuePlan({ floorUsd: 1000, ceilUsd: 1500 }, 700).pointsSavingsUsd, 700);
  assert.equal(points.fixedValuePlan({ floorUsd: 1000, ceilUsd: 1500 }, 2000).pointsSavingsUsd, 1000);
  const result = points.fixedValuePlan({ floorUsd: 13000, ceilUsd: 16000 }, 6000);
  assert.equal(result.floorUsd, 11000);
  assert.equal(result.ceilUsd, 14000);
  assert.equal(result.grossCeilUsd, 16000);
  assert.equal(result.milesRequired, 200000);
});

test('22 audited trips reconcile gross, net, savings and every weighted axis',()=>{
  const audit=read('src/_data/rerankingAudit.json'), manifest=read('tools/scorecard.manifest.json'), plans=read('src/_data/capitalOnePoints.json').plans;
  assert.equal(audit.trips.length,22);
  for(const r of audit.trips){
    const main=read(`src/_data/${r.slug}/main.json`),sc=main.scorecard,plan=plans[r.slug];
    assert.deepEqual(r.grossCashRangeUsd,[r.lineItems.reduce((s,l)=>s+l.lowUsd,0),r.lineItems.reduce((s,l)=>s+l.highUsd,0)],r.slug);
    assert.deepEqual(r.netCashRangeUsd,r.grossCashRangeUsd.map(n=>n-plan.savingsUsd),r.slug);
    assert.ok(plan.savingsUsd<=plan.cashAirfareRangeUsd[0]);
    assert.ok(plan.milesRequired<=200000);
    assert.equal(plan.transferSavingsUsedUsd,0);
    assert.equal(plan.fourAwardSeatsConfirmed,false);
    assert.equal(sc.axes.budget,points.budgetScore(sc.budget,'medium'));
    assert.equal(sc.totalBaked,manifest.axes.reduce((sum,a)=>sum+sc.axes[a.id]*a.weightDefault,0));
    assert.equal(sc.totalBaked,r.score);
    assert.equal(Object.keys(r.axisReview).length,manifest.axes.length);
  }
});

test('audited pages have one canonical cost, airfare and TLDR section',()=>{
  for(const r of read('src/_data/rerankingAudit.json').trips){
    const m=read(`src/_data/${r.slug}/main.json`);
    const $=load(m.parts.filter(p=>p.t==='raw').map(p=>p.html).join('\n'));
    for(const id of ['budget','totals','air-travel'])assert.equal($('#'+id).length,1,`${r.slug}:${id}`);
    assert.equal($('.tldr').length,1,r.slug);
    assert.equal(Number($('.tldr').attr('data-audit-rank')),r.newRank,r.slug);
  }
});

test('budget thresholds retain the confidence requirement after points', () => {
  const b = { floorUsd: 10000, ceilUsd: 14000 };
  assert.equal(points.budgetScore(b, 'medium'), 2);
  assert.equal(points.budgetScore(b, 'high'), 3);
  for (const [ceilUsd, score] of [[12000, 5], [13500, 4], [15000, 2], [15001, 1]]) {
    assert.equal(points.budgetScore({ ...b, ceilUsd }, 'medium'), score);
  }
});
