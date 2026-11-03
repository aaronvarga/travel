#!/usr/bin/env node
// One-off route corrections found by the 2026-11-03 four-passenger flight audit.
// Run after apply-2026-11-03-flight-refresh.mjs. Every edit must hit exactly the
// expected number of times or nothing is written.
//  - sardinia-corsica: no CAG–PIT flight on Wed Jun 23 lands the same day; exit Tue Jun 22
//    evening on the sold Lufthansa/United ticket with a Munich overnight (home 4:57 PM Jun 23).
//  - greece-ionian: day cards still described a Preveza exit; the plan already exits via
//    Athens with an airport-buffer night.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (slug) => path.join(root, 'src', '_data', slug, 'main.json');
const staged = [];

edit('sardinia-corsica', (main) => {
  const days = main.itinerary.days;
  const d12 = days.find((d) => d.id === 'day12');
  const d13 = days.find((d) => d.id === 'day13');
  if (d12.facts[0].valueHtml !== 'Cagliari · night 3 of 3' || d13.heading !== 'Depart Cagliari → PIT') throw new Error('sardinia day cards changed; re-read before editing');
  Object.assign(d12, {
    heading: 'Villasimius or Nora, then the evening flight',
    feel: 'Last beach morning, then CAG to Munich',
    facts: [
      { label: 'Sleep', valueHtml: 'Munich airport hotel · overnight connection' },
      { label: 'Plan', valueHtml: 'Porto Giunco beach, or Nora + Pula, back to CAG by 4:30 PM' },
      { label: 'Flight', valueHtml: 'CAG 6:35 PM → Munich (one ticket through to PIT)' },
    ],
    note: 'No Cagliari flight on Wednesday Jun 23 reaches Pittsburgh the same day, so the family leaves Tuesday evening. Keep the beach or ruins to the morning, return the car at CAG, and sleep at a Munich airport hotel on the same protected ticket.',
    travelNote: '✈︎ CAG 6:35 PM → Munich (overnight)',
  });
  Object.assign(d13, {
    heading: 'Munich → Chicago → PIT',
    feel: 'Home Wednesday afternoon',
    facts: [
      { label: 'Sleep', valueHtml: 'Home · Wed Jun 23' },
      { label: 'Car', valueHtml: 'Returned at CAG on Tue Jun 22' },
      { label: 'Plan', valueHtml: 'MUC → ORD (1h55) → PIT, arriving 4:57 PM' },
    ],
    note: 'One Lufthansa/United ticket from Cagliari. If it reprices badly, the backup is an Olbia round trip (United via Newark, home 11:19 PM Jun 23) with a final-morning drive north.',
    travelNote: '✈︎ Travel day — no stops',
  });
  return [
    ['&#127963;&#65039; Last Cagliari dinner</div>', '&#9992;&#65039; CAG 6:35 PM &rarr; Munich</div>', 1],
    ['&#128663; Drive to CAG airport</div>', '&#127976; Munich airport hotel</div>', 1],
    ['&#9992;&#65039; Cagliari &rarr; hub &rarr; PIT</div>', '&#9992;&#65039; Munich &rarr; Chicago &rarr; PIT</div>', 1],
    ['Day 13 · 0h15 · Rental drop-off', 'Day 12 · 0h15 · Rental drop-off', 1],
    ['Day 13 · 2h · European connection (estimated)', 'Day 12 · 2h · CAG → Munich, overnight connection', 1],
    ['dropped in Cagliari Jun 23', 'dropped at Cagliari airport Jun 22', 1],
    ['Cagliari (CAG) → Rome (FCO) ~1.8h, Rome (FCO) → Newark ~8.1h, Newark → PIT ~', 'Cagliari (CAG) → Munich ~1.8h, Munich → Chicago ~9.5h, Chicago → PIT ~', 1],
    ['title=\\"Cagliari (CAG) → Rome (FCO) · ~1.8h — Return intra-Europe hop from the open-jaw&#x27;s southern airport.\\"', 'title=\\"Cagliari (CAG) → Munich · ~1.8h — Tuesday-evening hop to an overnight connection on the same ticket.\\"', 1],
    ['title=\\"Rome (FCO) → Newark · ~8.1h — Return transatlantic leg back to the US gateway.\\"', 'title=\\"Munich → Chicago · ~9.5h — Wednesday transatlantic leg back to the US gateway.\\"', 1],
    ['<strong>Cagliari · Jun 23</strong>', '<strong>Cagliari airport · Jun 22</strong>', 1],
    ['The corrected itinerary flies home <b>Wednesday, June 23, 2027</b>.', 'The corrected itinerary leaves Cagliari Tuesday evening and lands home <b>Wednesday, June 23, 2027</b> after a Munich overnight; no Wednesday Cagliari flight gets home the same day.', 1],
  ];
});

edit('greece-ionian', (main) => {
  const days = main.itinerary.days;
  const d12 = days.find((d) => d.id === 'day12');
  const d13 = days.find((d) => d.id === 'day13');
  if (d13.heading !== 'Fly home from Preveza (PVK)') throw new Error('greece-ionian day13 changed; re-read before editing');
  Object.assign(d12, {
    heading: 'Lefkada Town, then drive to Athens',
    feel: 'A short last morning and the long drive',
    daycost: 'Est. $180 &middot; fuel, tolls, airport-hotel dinner',
    facts: [
      { label: 'Sleep', valueHtml: 'Athens airport hotel &middot; buffer night' },
      { label: 'Morning', valueHtml: 'Lefkada Town, the causeway, the Gyra windmills' },
      { label: 'Drive', valueHtml: 'Lefkada &rarr; Athens airport, ~4&frac12;&ndash;5 hr; return the car at ATH' },
    ],
    note: 'A short finale in walkable Lefkada Town and around the Gyra windmills, then the 4&frac12;&ndash;5 hour drive to Athens airport. Return the car there and sleep at an airport hotel so the Jun 22 flight home is not exposed to the drive.',
    travelNote: 'Travel day - Lefkada to Athens airport by car.',
  });
  Object.assign(d13, {
    heading: 'Fly home from Athens (ATH)',
    feel: 'Home a day before the buffer',
    facts: [
      { label: 'Sleep', valueHtml: 'Home by Tue Jun 22 (buffer day Jun 23)' },
      { label: 'Flight', valueHtml: 'ATH 2:00 PM -> JFK -> PIT 9:25 PM, or via ORD home 7:28 PM' },
      { label: 'Ticket', valueHtml: 'Same protected ticket as the Kefalonia arrival' },
    ],
    note: 'The return sits on the same ticket as the Kefalonia arrival, so a delay is the airline&rsquo;s problem. Prefer the Chicago routing if the 1h30 JFK connection feels tight. Home Jun 22 leaves Jun 23 as a buffer before the required Pittsburgh days Jun 24-26.',
    travelNote: 'Travel day - Athens to a US gateway to PIT.',
  });
  return [
    ['Lefkada by car ~5h, Preveza (PVK) → EU hub ~2h, EU hub → US hub ~9.5h', 'Lefkada and the drive to Athens ~5h, Athens → US hub ~10.5h', 1],
    ['9 legs &middot; ~35 hrs door-to-door', '8 legs &middot; ~34 hrs door-to-door', 1],
    ['Lefkada by car · ~5h — West-coast beaches plus the causeway drive to Preveza.', 'Lefkada by car · ~5h — West-coast beaches plus the final 4½–5 hour drive to Athens airport.', 1],
    [/<div class=\\"seg air\\" style=\\"flex:2\\" title=\\"Preveza \(PVK\) → EU hub[\s\S]*?<\/div>(?:\\n|\s)*<div class=\\"seg air\\" style=\\"flex:9\.5\\" title=\\"EU hub → US hub[\s\S]*?<\/div>/, '<div class=\\"seg air\\" style=\\"flex:10.5\\" title=\\"Athens → US hub · ~10.5h — The long transatlantic leg home on the same ticket as the arrival.\\" tabindex=\\"0\\"><span class=\\"ic\\">&#9992;&#65039;</span><b>~10.5h</b></div>', 1],
    ['No exact-date PVK itinerary is sold.', 'The only exact-date PVK itinerary has three stops and costs about $11.5k for the family.', 1],
    ['<b>Reject Preveza (PVK)</b> — no itinerary exists for the return date.', '<b>Reject Preveza (PVK)</b> — the only return-date itinerary has three stops at about $11.5k.', 1],
    ['reject unavailable PVK', 'reject the three-stop PVK option', 1],
    ['self-transfer misconnections for the PVK leg', 'missed ferries and the long final drive to Athens', 1],
  ];
});

for (const [p, main] of staged) fs.writeFileSync(p, `${JSON.stringify(main, null, 2)}\n`);
console.log(`route fixes applied to ${staged.length} trips`);

function edit(slug, fn) {
  const p = file(slug);
  const main = JSON.parse(fs.readFileSync(p, 'utf8'));
  const pairs = fn(main);
  let json = JSON.stringify(main);
  for (const [from, to, expected] of pairs) {
    const re = from instanceof RegExp ? new RegExp(from.source, 'g') : new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const hits = (json.match(re) || []).length;
    if (hits !== expected) throw new Error(`${slug}: expected ${expected} hit(s) for ${from}, found ${hits}`);
    json = json.replace(re, () => to);
  }
  staged.push([p, JSON.parse(json)]);
}
