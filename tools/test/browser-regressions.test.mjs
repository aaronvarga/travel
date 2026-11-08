import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {load} from 'cheerio';
const require=createRequire(import.meta.url);
const nunjucks=require('nunjucks');
const {formatDisplayDates}=require('../lib/display-date.cjs');

test('readiness renders the route and wildfire facts rather than the first fact',()=>{
 const trip=require('../../src/_data/trips.js')().find(t=>t.slug==='sicily');
 const env=new nunjucks.Environment(new nunjucks.FileSystemLoader('src/_includes'));
 env.addFilter('displayDate',formatDisplayDates);
 env.addFilter('moneyK',v=>'$'+v/1000+'k');
 const $=load(env.render('itinerary/readiness.njk',{trip,verificationLog:{events:[]}}));
 const route=$('.evidence-summary-grid article').eq(1);
 assert.equal(route.find('strong').text(),'Current Proxy');
 assert.match(route.text(),/Low confidence/);
 const fire=$('.evidence-summary-grid article').last().text();
 assert.match(fire,/Moderate/);assert.match(fire,/5–10%/);
});

function worker(fetch,caches){
 const context={self:{addEventListener(){}},fetch,caches};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),context);
 return context.networkFirst;
}

test('network-first caches a delayed response before its body is consumed',async()=>{
 let openCache,stored;
 const gate=new Promise(resolve=>{openCache=resolve});
 const networkFirst=worker(async()=>new Response('fresh page'),{open:()=>gate});
 const delivered=networkFirst('page','shell').then(r=>r.text());
 await new Promise(resolve=>setImmediate(resolve));
 openCache({put:async(_,r)=>{stored=await r.text()}});
 assert.equal(await delivered,'fresh page');
 assert.equal(stored,'fresh page');
});

test('network-first preserves network success on cache failure and serves offline hits',async()=>{
 const online=worker(async()=>new Response('online'),{open:async()=>{throw new Error('quota')},match:async()=>new Response('old')});
 assert.equal(await (await online('page','shell')).text(),'online');
 const offline=worker(async()=>{throw new Error('offline')},{match:async()=>new Response('saved page')});
 assert.equal(await (await offline('page','shell')).text(),'saved page');
});

test('expired Joshua Tree checkout is explicitly historical and unbooked',()=>{
 const evidence=JSON.parse(fs.readFileSync('src/_data/short-joshua-tree/evidence.json'));
 const fact=evidence.facts.find(f=>f.id==='selected-airbnb');
 assert.equal(fact.value.historicalQuoteObservedAt,'2026-10-08');
 assert.equal(fact.value.historicalQuoteExpiredAt,'2026-10-15');
 assert.equal(fact.proxyStatus,'unknown');
 assert.equal(fact.value.currentQuoteVerified,false);
 assert.equal(fact.value.booked,false);
});
