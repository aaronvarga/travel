import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {ptoDays} from '../composer/estimate-scorecard.mjs';
import {load} from 'cheerio';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const main=read('src/_data/sicily/main.json');
test('creation cannot overwrite the reviewed canonical Sicily record',()=>{
 const path='src/_data/sicily/main.json',before=fs.readFileSync(path,'utf8');
 const result=spawnSync(process.execPath,['tools/create-sicily.mjs'],{encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/Sicily already exists/);
 assert.equal(fs.readFileSync(path,'utf8'),before);
});
test('full Sicily plan preserves three four-night bases and June 23 return',()=>{
 const sleeps=main.itinerary.days.flatMap(d=>d.facts.filter(f=>f.label==='Sleep').map(f=>f.valueHtml));
 for(const name of ['Ortigia','Naxos','Cefalù'])assert.equal(sleeps.filter(s=>s.includes(name)).length,4);
 assert.equal(main.itinerary.days.length,14);
 assert.equal(main.itinerary.days.at(-1).heading,'Palermo → Pittsburgh');
 assert.equal(main.scorecard.pto.days,ptoDays('2027-06-10','2027-06-23')+1);
 const evidence=read('src/_data/sicily/evidence.json');
 const route=evidence.facts.find(f=>f.category==='route').value;
  assert.equal(route.exact2027FlightsVerified,true);
  assert.equal(route.status,'confirmed');
 const variant=read('src/_data/sicily/variants.json').variants[0];
 assert.equal(variant.nights,12);assert.equal(variant.budget.lowUsd,main.scorecard.budget.floorUsd);
 const imgs=main.itinerary.days.flatMap(d=>d.spots||[]).flatMap(s=>s.images);
 assert.equal(new Set(imgs.map(im=>im.src)).size,imgs.length);
 for(const im of imgs){assert.ok(im.src.startsWith('../../assets/img/sicily/'));assert.ok(fs.existsSync(im.src.slice(6)));}
});

test('Sicily uses the standard transport panel with every timed travel stage',()=>{
  const document=load(main.parts.map(part=>part.html||'').join(''));
  const section=document('#getting-around');
  assert.equal(section.find('.tt-panel').length,1);
  assert.equal(section.find('.tt-meter .tt-bar').length,1);
  assert.equal(section.find('.tt-panel .pcard').length,4);
  assert.equal(section.find('.seg[data-mode="air"]').length,4);
  assert.equal(section.find('.seg[data-mode="wait"]').length,2);
  assert.equal(section.find('.seg[data-mode="road"]').length,1);
  const segments=section.find('.tt-bar .seg');
  assert.equal(segments.length,7);
  assert.equal(segments.toArray().reduce((total,element)=>total+Number(document(element).attr('data-minutes')),0),2459);
  for(const element of segments.toArray()){
    assert.equal(document(element).attr('tabindex'),'0');
    assert.ok(document(element).attr('title').length>30);
  }
  assert.match(section.text(),/not a door-to-door total/);
  assert.match(section.text(),/4:15–4:30 AM/);
});

test('Sicily flight evidence reconciles exact clocks, four passengers and an airline checkout',()=>{
  const audit=read('src/_data/sicily/flightAudit.json');
  assert.equal(audit.passengers.total,4);
  assert.equal(audit.passengers.adultFares,3);
  assert.equal(audit.passengers.childFares,1);
  assert.equal(audit.singleAirlineCheckoutVerified,true);
  assert.equal(audit.fare.verifiedAtAirlineCheckout,true);
  assert.equal(audit.ticketed,false);
  assert.equal(audit.fare.totalUsd,6097.66);
  assert.equal(audit.fare.baseFareUsd+audit.fare.taxesAndFeesUsd,audit.fare.totalUsd);
  assert.equal(audit.fare.firstCheckedBagPerPersonIncluded,true);
  assert.ok(fs.existsSync(audit.checkoutEvidenceImage));
  assert.equal(audit.outbound.connectionMinutes,64);
  assert.equal(audit.rejectedOutbound.airportChange,'LHR to LGW');
  for(const direction of [audit.outbound,audit.inbound]){
    for(const flight of direction.flights){
      assert.equal((new Date(flight.arrivesAt)-new Date(flight.departsAt))/60000,flight.durationMinutes);
    }
    const [first,last]=direction.flights;
    assert.equal((new Date(last.departsAt)-new Date(first.arrivesAt))/60000,direction.connectionMinutes);
    assert.equal((new Date(last.arrivesAt)-new Date(first.departsAt))/60000,direction.elapsedMinutes);
    assert.equal(direction.airportChange,false);
  }
  assert.equal(audit.inbound.flights.at(-1).arrivesAt,'2027-06-23T17:44:00-04:00');
  assert.equal(read('src/_data/decisionProfile.json').routeReadiness.sicily,'confirmed');
  const evidence=read('src/_data/sicily/evidence.json');
  assert.equal(evidence.facts.find(fact=>fact.id==='route-readiness').value.exactFamilyFareUsd,audit.fare.totalUsd);
  assert.equal(evidence.flightAudit.expiresAt,audit.expiresAt);
  const document=load(main.parts.map(part=>part.html||'').join(''));
  const air=document('#air-travel').text();
  for(const number of ['AC 8586','AC 932','UA 736','UA 3591'])assert.ok(air.includes(number));
  assert.match(air,/\$6,097\.66/);
  assert.match(air,/Change airports: LHR → LGW/);
  assert.doesNotMatch(air,/Exact flights · unknown|No usable exact-date canonical fare was found/);
  const calendar=document('#calendar').text();
  assert.match(calendar,/PIT 3:25 PM → YUL → CTA/);
  assert.match(calendar,/PMO 9:45 AM → EWR → PIT 5:44 PM/);
  assert.match(calendar,/CTA 8:55 AM · bags \+ rental/);
});
