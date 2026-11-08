import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from 'cheerio';

const $ = load(fs.readFileSync('index.html', 'utf8'));
const full = $('#trips > .sl-grid').first().children('.sl-card');
const shortlist = $('#family-shortlist .sl-card');
const slug = el => $(el).attr('href').match(/locations\/([^/]+)\//)[1];

test('shortlist uses the full trip card markup and canonical order', () => {
  const selected = shortlist.toArray().map(slug);
  const ranked = selected.filter(id => id !== 'short-sicily');
  assert.deepEqual(ranked, full.toArray().map(slug).filter(id => selected.includes(id)));
  assert.equal(selected.includes('switzerland-sicily'), false);
  assert.equal(new Set(selected).size, selected.length);
  for (const card of shortlist.toArray().filter(el => slug(el) !== 'short-sicily')) {
    const original = full.toArray().find(el => slug(el) === slug(card));
    const copy = $(card).clone().removeAttr('data-shortlisted-trip');
    const counterpart = $(original).clone();
    // Only the first page image is eager; both copies retain the same card content.
    for (const node of [copy, counterpart]) node.find('img').removeAttr('loading').removeAttr('fetchpriority');
    assert.equal($.html(copy), $.html(counterpart), slug(card));
  }
});

test('the one-week Sicily option stays visible with its separate short-trip rank', () => {
  const card = shortlist.filter('[href="locations/short-sicily/index.html"]');
  assert.equal(card.length, 1);
  assert.match(card.find('.sl-rank').text(), /^S\d+$/);
  assert.equal(card.find('.sl-meter').length, 1);
  assert.equal(slug(shortlist.last()), 'short-sicily');
});
