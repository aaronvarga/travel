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

writeFileSync(cssPath, `${styles.join('\n\n')}\n`);
writeFileSync(jsPath, `${scripts.join('\n\n')}\n`);
tail = tail.replace(/<style>[\s\S]*?<\/style>\s*/g, '').replace(/<script>(?![^]*?src=)[\s\S]*?<\/script>\s*/g, '');
writeFileSync(templatePath, before + tail);
console.log(`extracted ${styles.length} style blocks and ${scripts.length} script blocks`);
