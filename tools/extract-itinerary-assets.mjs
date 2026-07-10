#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const templatePath = 'src/itinerary.njk';
const cssPath = 'assets/css/itinerary.css';
const jsPath = 'assets/js/itinerary.js';
const marker = '<link rel="stylesheet" href="../../assets/css/itinerary.css">';
const template = readFileSync(templatePath, 'utf8');
const markerAt = template.indexOf(marker);
if (markerAt < 0) throw new Error('shared itinerary asset marker is missing');

const before = template.slice(0, markerAt);
let tail = template.slice(markerAt);
const styles = [...tail.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1].trim());
const scripts = [...tail.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1].trim());

if (!styles.length && !scripts.length) {
  console.log('itinerary assets are already extracted');
  process.exit(0);
}

const offlineCss = '.offline-save{position:fixed;right:16px;bottom:16px;z-index:460;padding:9px 13px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:#1f4248;color:#fff;font:800 .75rem/1.2 Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer}@media print{.offline-save{display:none!important}}';
const offlineJs = `(function(){if(!('serviceWorker' in navigator))return;var button=document.createElement('button');button.type='button';button.className='offline-save';button.textContent='Save trip offline';button.addEventListener('click',function(){navigator.serviceWorker.ready.then(function(registration){var worker=registration.active||navigator.serviceWorker.controller;if(!worker)throw new Error('service worker is not active');var urls=[location.href].concat([].map.call(document.images,function(image){return image.currentSrc||image.src;}).filter(Boolean));worker.postMessage({type:'CACHE_TRIP',urls:urls});button.textContent='Saved for offline use';button.disabled=true;}).catch(function(){button.textContent='Offline save unavailable';});});document.body.appendChild(button);}());`;

writeFileSync(cssPath, `${styles.join('\n\n')}\n${offlineCss}\n`);
writeFileSync(jsPath, `${scripts.join('\n\n')}\n${offlineJs}\n`);
tail = tail.replace(/<style>[\s\S]*?<\/style>\s*/g, '').replace(/<script>(?![^]*?src=)[\s\S]*?<\/script>\s*/g, '');
writeFileSync(templatePath, before + tail);
console.log(`extracted ${styles.length} style blocks and ${scripts.length} script blocks`);
