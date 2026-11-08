import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {ptoDays} from '../composer/estimate-scorecard.mjs';
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
 assert.equal(route.exact2027FlightsVerified,false);
 assert.equal(route.status,'current-proxy');
 const variant=read('src/_data/sicily/variants.json').variants[0];
 assert.equal(variant.nights,12);assert.equal(variant.budget.lowUsd,main.scorecard.budget.floorUsd);
 const imgs=main.itinerary.days.flatMap(d=>d.spots||[]).flatMap(s=>s.images);
 assert.equal(new Set(imgs.map(im=>im.src)).size,imgs.length);
 for(const im of imgs){assert.ok(im.src.startsWith('../../assets/img/sicily/'));assert.ok(fs.existsSync(im.src.slice(6)));}
});
