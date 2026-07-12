#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const pairs = [
  [path.join(root, '_site', 'index.html'), path.join(root, 'index.html')],
  [path.join(root, '_site', 'locations'), path.join(root, 'locations')],
];

for (const [source, destination] of pairs) {
  if (!fs.existsSync(source)) throw new Error(`missing build output: ${path.relative(root, source)}`);
  if (check) {
    const differences = compare(source, destination);
    if (differences.length) {
      console.error(`${path.relative(root, destination)} is not synchronized (${differences.length} differences)`);
      for (const file of differences.slice(0, 10)) console.error(`  ${file}`);
      process.exitCode = 1;
    }
  } else {
    if (path.basename(source) === 'locations') pruneComposerDestinations(source, destination);
    fs.cpSync(source, destination, { recursive: true, force: true });
    console.log(`synced ${path.relative(root, source)} -> ${path.relative(root, destination)}`);
  }
}

if (check && !process.exitCode) console.log('root GitHub Pages output is synchronized');

function compare(source, destination) {
  if (!fs.existsSync(destination)) return [path.relative(root, destination)];
  const sourceStat = fs.statSync(source);
  if (sourceStat.isFile()) return fs.readFileSync(source).equals(fs.readFileSync(destination)) ? [] : [path.relative(root, destination)];
  const files = listFiles(source);
  const destinationFiles = listFiles(destination);
  const differences = [];
  for (const relative of files) {
    const target = path.join(destination, relative);
    if (!fs.existsSync(target) || !fs.readFileSync(path.join(source, relative)).equals(fs.readFileSync(target))) differences.push(relative);
  }
  for (const relative of destinationFiles) {
    if (!files.includes(relative) && (/^combo--[^/]+[\\/]/.test(relative) || /^trip-builder[\\/]/.test(relative))) differences.push(`stale:${relative}`);
  }
  return differences;
}

function pruneComposerDestinations(source, destination) {
  if (!fs.existsSync(destination)) return;
  const sourceEntries = new Set(fs.readdirSync(source));
  for (const entry of fs.readdirSync(destination)) {
    if ((entry.startsWith('combo--') || entry === 'trip-builder') && !sourceEntries.has(entry)) {
      fs.rmSync(path.join(destination, entry), { recursive: true, force: true });
      console.log(`pruned stale locations/${entry}`);
    }
  }
}

function listFiles(directory, prefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(directory, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(directory, relative));
    else files.push(relative);
  }
  return files;
}
