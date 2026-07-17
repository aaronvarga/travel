#!/usr/bin/env node
// One-shot upgrade for the ten short escapes:
//  1) converts on-page costs to USD and temps to °F
//  2) rebuilds each #getting-around section in the long-trip tt-panel format
//     (leg meter + pcards), copying the exact style block from the portugal page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TT_STYLE = '<style>.tt-panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:0 10px 28px rgba(30,32,28,.08)}.tt-panel .tt-meter{margin:0}.tt-meter .tt-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 0 7px}.tt-meter .tt-h p{margin:0;font-size:.63rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.tt-meter .tt-h .tt-tot{font-size:.63rem;font-weight:800;color:var(--muted);white-space:nowrap}.tt-bar{display:flex;gap:3px;min-height:42px;border-radius:9px;overflow:hidden}.tt-bar .seg{display:flex;flex-direction:column;justify-content:center;align-items:center;color:#fff;min-width:36px;padding:4px 4px;text-align:center;cursor:default;transition:filter .12s}.tt-bar .seg:hover,.tt-bar .seg:focus{filter:brightness(1.13);outline:none}.tt-bar .seg .ic{font-size:.72rem;margin-bottom:2px;opacity:.92}.tt-bar .seg b{font-size:.72rem;line-height:1;font-weight:800;white-space:nowrap}.tt-bar .air{background:#2d6ca3}.tt-bar .road{background:#c25a3a}.tt-bar .sea{background:#2f8f9d}.tt-bar .rail{background:#6b7280}.tt-note{margin:8px 0 0;font-size:.68rem;line-height:1.5;color:var(--muted)}.tt-panel .plan-grid{display:block;margin:16px 0 0;padding:16px 0 0;border-top:1px solid var(--line)}.tt-panel .pcard{background:none;border:0;box-shadow:none;border-radius:0;padding:0;margin:0}.tt-panel .pcard + .pcard{margin-top:16px;padding-top:16px;border-top:1px solid var(--line)}.tt-panel .pcard h4{margin:0 0 8px;font-size:1rem}@media(max-width:640px){.tt-bar{overflow-x:auto}.tt-bar .seg{min-width:52px}}</style>';

const IC = { air: '&#9992;&#65039;', road: '&#128663;', sea: '&#9972;&#65039;', rail: '&#128646;' };

// [mode, hours, shortLabelRoute, detail]
const LEGS = {
  'short-puerto-rico': [
    ['air', 1.5, 'PIT → hub', 'Domestic hop to the connecting hub on one protected ticket.'],
    ['air', 3.8, 'Hub → San Juan (SJU)', 'Second leg into San Juan; no passport, no customs.'],
    ['road', 4, 'Rental car · week', 'Old San Juan base plus the Luquillo / El Yunque days.'],
    ['air', 3.9, 'San Juan (SJU) → hub', 'Daytime leg home.'],
    ['air', 1.6, 'Hub → PIT', 'Final hop; home Saturday evening.'],
  ],
  'short-algarve': [
    ['air', 1.5, 'PIT → hub', 'Domestic hop to the transatlantic gateway.'],
    ['air', 7.2, 'Hub → Faro (FAO)', 'Overnight transatlantic into the Algarve, one ticket.'],
    ['road', 4, 'Rental car · week', 'One Lagos-area base; short coast-day drives only.'],
    ['air', 7.6, 'Faro (FAO) → hub', 'Daytime leg home from Faro.'],
    ['air', 1.5, 'Hub → PIT', 'Final domestic hop home.'],
  ],
  'short-sicily': [
    ['air', 1.5, 'PIT → JFK', 'Delta connector to the JFK gateway.'],
    ['air', 9.2, 'JFK → Catania (CTA)', 'Overnight nonstop — the only US flight to Sicily.'],
    ['road', 7, 'Rental car: Ortigia → Taormina', 'Airport run, Noto and Vendicari days, one base move north.'],
    ['air', 10, 'Catania (CTA) → JFK', 'Daytime nonstop home.'],
    ['air', 1.7, 'JFK → PIT', 'Final domestic hop home.'],
  ],
  'short-portugal': [
    ['air', 1.5, 'PIT → hub', 'Domestic hop to the transatlantic gateway.'],
    ['air', 7, 'Hub → Lisbon (LIS)', 'Overnight transatlantic on one ticket.'],
    ['rail', 4, 'Lisbon → Lagos rail', 'Change at Tunes; the no-car backbone of the week.'],
    ['air', 7.6, 'Faro (FAO) → hub', 'Open-jaw home from the Algarve.'],
    ['air', 1.5, 'Hub → PIT', 'Final domestic hop home.'],
  ],
  'short-azores': [
    ['air', 1.7, 'PIT → Boston (BOS)', 'Positioning hop to the Azores gateway.'],
    ['air', 4.8, 'Boston → Ponta Delgada (PDL)', 'Evening flight to São Miguel — shortest transatlantic there is.'],
    ['road', 5, 'Rental car · week', 'One-base volcanic loop: Sete Cidades, Furnas, Lagoa do Fogo.'],
    ['air', 5.2, 'Ponta Delgada (PDL) → Boston', 'Leg home; overnight Boston buffer is the fallback.'],
    ['air', 1.8, 'Boston (BOS) → PIT', 'Final domestic hop home.'],
  ],
  'short-ischia': [
    ['air', 1.5, 'PIT → Newark (EWR)', 'United connector booked with hours of slack.'],
    ['air', 8.8, 'Newark → Naples (NAP)', 'Overnight nonstop; mid-June is the 1x-daily window.'],
    ['road', 0.6, 'Alibus: airport → port', 'About $6 per person, every 15–30 minutes.'],
    ['sea', 0.9, 'Hydrofoil → Forio', 'Alilauro direct, about 50 minutes across the bay.'],
    ['road', 4, 'Island buses + boats · week', 'CS/CD circle lines and water taxis — no rental car all week.'],
    ['sea', 0.9, 'Hydrofoil → Naples', 'Book the Sunday-morning boat ahead; it sells out.'],
    ['air', 10, 'Naples (NAP) → Newark', 'Daytime nonstop home.'],
    ['air', 1.5, 'Newark (EWR) → PIT', 'Final domestic hop home.'],
  ],
  'short-madeira': [
    ['air', 8.5, 'PIT → Lisbon (LIS)', 'One-stop single-ticket routing to the Lisbon hub.'],
    ['air', 1.8, 'Lisbon → Funchal (FNC)', 'Feeder into Madeira; the famous short runway.'],
    ['road', 6, 'Rental car · week', 'Steep island roads across the week; size up the automatic.'],
    ['air', 1.8, 'Funchal (FNC) → Lisbon', 'Feeder back to the hub.'],
    ['air', 9.5, 'Lisbon (LIS) → PIT', 'Home via the same hub on one ticket.'],
  ],
  'short-acadia': [
    ['air', 1.7, 'PIT → Portland (PWM)', 'Nonstop if operating; one protected connection otherwise.'],
    ['road', 3, 'Portland → Bar Harbor', 'The Maine coast drive in.'],
    ['road', 3, 'Island week', 'Park Loop Road, Cadillac, carriage roads — all short hops.'],
    ['road', 3, 'Bar Harbor → Portland', 'Drive back with at least four hours of airport buffer.'],
    ['air', 1.8, 'Portland (PWM) → PIT', 'Final hop; no time change all week.'],
  ],
  'short-iceland': [
    ['air', 5.7, 'PIT → Keflavík (KEF)', 'Icelandair seasonal nonstop — zero connections.'],
    ['road', 8, 'Rental car · week', 'Golden Circle plus the south coast out to Jökulsárlón.'],
    ['air', 6.2, 'Keflavík (KEF) → PIT', 'Nonstop home.'],
  ],
  'short-alaska': [
    ['air', 2.3, 'PIT → hub', 'SEA, ORD, MSP and DEN all work; choose deliberately.'],
    ['air', 6.8, 'Hub → Anchorage (ANC)', 'Gain four hours westbound; land with daylight to spare.'],
    ['road', 2.3, 'ANC → Seward', 'The Seward Highway — itself a headline drive.'],
    ['road', 4, 'Kenai + Turnagain week', 'One base move Seward → Girdwood plus the Arm pullouts.'],
    ['road', 0.8, 'Girdwood → ANC', 'Short airport run.'],
    ['air', 6.3, 'Anchorage (ANC) → hub', 'Leg home; lose the four hours back.'],
    ['air', 2.3, 'Hub → PIT', 'Final hop home.'],
  ],
};

const fmtH = (h) => `~${(Math.round(h * 10) / 10).toString().replace(/\.0$/, '')}h`;

function ttMeter(slug) {
  const legs = LEGS[slug];
  const tot = Math.round(legs.reduce((a, [, h]) => a + h, 0));
  const aria = legs.map(([, h, label]) => `${label.replace(/<[^>]+>/g, '')} ${fmtH(h)}`).join(', ');
  const segs = legs.map(([mode, h, label, detail]) =>
    `\n          <div class="seg ${mode}" style="flex:${h}" title="${label} · ${fmtH(h)} — ${detail}" tabindex="0"><span class="ic">${IC[mode]}</span><b>${fmtH(h)}</b></div>`).join('');
  return `<div class="tt-meter">
        <div class="tt-h"><p>Every travel leg, in order</p><span class="tt-tot">${legs.length} legs &middot; ~${tot} hrs door-to-door</span></div>
        <div class="tt-bar" role="img" aria-label="Travel legs in order: ${aria}">${segs}
        </div>
        <p class="tt-note">Hover any leg for its route and detail. Width &asymp; hours; flight routings are 2027 planning proxies.</p>
      </div>`;
}

// --- currency / temperature conversions (page display only; evidence keeps source €) ---
const SWAPS = {
  'short-ischia': [
    ['<b>€50 adult full day, €45 from 1 p.m., ages 4–11 half price</b> — about €175 for this family', '<b>about $55 adult full day, $50 from 1 p.m., ages 4–11 half price</b> — about $190 for this family'],
    ['saves €20 for the family', 'saves about $22 for the family'],
    ['<b>€12 adult, €6 ages 10–18, free under 10</b> — €36 for this family', '<b>about $13 adult, $7 ages 10–18, free under 10</b> — about $40 for this family'],
    ['The castle’s €36 family total', 'The castle’s ~$40 family total'],
    ['<b>€13–19 per person round trip</b> from Casamicciola — call it €60–80 for four', '<b>$14–21 per person round trip</b> from Casamicciola — call it $65–90 for four'],
    ['about €73 per person with lunch', 'about $80 per person with lunch'],
    ['runs about €73 per person', 'runs about $80 per person'],
    ['Alibus €5pp → Molo Beverello', 'Alibus ~$6pp → Molo Beverello'],
    ['Alibus · €5pp · every 15–30 min', 'Alibus · ~$6pp · every 15–30 min'],
    ['€23.90–24.10 adult · €15.90 child 2–12 · bags €3.50', 'About $26 adult · $18 child 2–12 · bags $4'],
    ['€1.70 pre-purchased · €2.20 onboard', 'About $2 pre-purchased · $2.50 onboard'],
    ['€5.10 · weekly €14.50', 'About $6 · weekly $16'],
    ['About €58 in passes for four', 'About $65 in passes for four'],
    ['(€15 minimum, ~€32 port → Forio)', '(~$17 minimum, ~$35 port → Forio)'],
    ['~€60 each way to bring one', '~$65 each way to bring one'],
    ['€50 taxi from the port', '$55 taxi from the port'],
    ['Weekly bus passes, not taxis: €58 covers the family’s whole week.', 'Weekly bus passes, not taxis: about $65 covers the family’s whole week.'],
    ['buses cost euros and the castle costs less than an American museum', 'buses cost pocket change and the castle costs less than an American museum'],
    ['Poseidon’s afternoon ticket saves €20;', 'Poseidon’s afternoon ticket saves about $22;'],
    ['15–30 min · ~€13–19pp round trip', '15–30 min · ~$14–21pp round trip'],
    ['€12 / €6 ages 10–18 / free under 10', '$13 / $7 ages 10–18 / free under 10'],
    ['graded from 61°F to 104°F', 'graded from 61°F to 104°F'],
  ],
  'short-sicily': [
    ['about €8 adults / under-18 free', 'about $9 adults / under-18 free'],
    ['about €20–25 per person', 'about $22–28 per person'],
    ['Parco Neapolis (Greek Theatre) is €14 adults / €7 reduced', 'Parco Neapolis (Greek Theatre) is about $15 adults / $8 reduced'],
    ['the cable car is €54 adults / €30 child 5–10', 'the cable car is about $59 adults / $33 child 5–10'],
    ['is €78 adults / €50 child', 'is about $86 adults / $55 child'],
    ['€2 municipal stairs or €13/€9 boat', '$2 municipal stairs or $14/$10 boat'],
    ['Teatro Antico is €14 adults / €7 reduced', 'Teatro Antico is about $15 adults / $8 reduced'],
    ['entry is about €4, the town cable car €6 one-way', 'entry is about $4.50, the town cable car $7 one-way'],
    ['about €30–45 per person', 'about $33–50 per person'],
    ['€150–€280/night', '$165–$310/night'],
    ['€130–€300/night', '$145–$330/night'],
    ['(~2h, ~€12)', '(~2h, ~$13)'],
  ],
  'short-madeira': [
    ['optional €60–80 family splurge', 'optional $65–90 family splurge'],
    ['€4.50 per visitor', '$5 per visitor'],
    ['generally €4.50.', 'generally $5.'],
    ['currently €5 for visitors over 12', 'currently $5.50 for visitors over 12'],
  ],
  'short-portugal': [
    ['Budget about €25–45 for a family airport transfer', 'Budget about $28–50 for a family airport transfer'],
    ['admission is €60 for two adults plus two youth', 'admission is about $65 for two adults plus two youth'],
    ['20–22°C', '68–72°F'],
  ],
  'short-azores': [
    ['Budget €15–25 per adult for a whale-watching', 'Budget $17–28 per adult for a whale-watching'],
  ],
};

let failures = 0;
for (const slug of Object.keys(LEGS)) {
  const file = path.join(root, 'src/_data', slug, 'main.json');
  const main = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changedSwaps = 0;

  for (const part of main.parts) {
    if (!part.html) continue;
    for (const [from, to] of SWAPS[slug] || []) {
      if (part.html.includes(from)) { part.html = part.html.split(from).join(to); changedSwaps++; }
    }
    if (part.html.includes('id="getting-around"')) {
      part.html = part.html.replace(/(<section id="getting-around"[\s\S]*?<\/section>)/, (section) => {
        if (section.includes('tt-panel')) return section;
        const gridMatch = section.match(/<div class="plan-grid">([\s\S]*?)<\/div><\/section>/)
          || section.match(/<div class="plan-grid">([\s\S]*)<\/section>/);
        if (!gridMatch) { console.error(`${slug}: no plan-grid found in getting-around`); failures++; return section; }
        const cards = gridMatch[1].replace(/<\/div>\s*$/, '');
        const head = section.slice(0, section.indexOf('<div class="plan-grid">'));
        return `${head}${TT_STYLE}
    <div class="tt-panel">
      ${ttMeter(slug)}
      <div class="plan-grid">${cards}</div>
    </div></section>`;
      });
    }
    // also convert costs living in structured itinerary fact strings
  }
  const walkSwap = (obj) => {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'string') {
        for (const [from, to] of SWAPS[slug] || []) if (v.includes(from)) { obj[k] = v.split(from).join(to); changedSwaps++; }
      } else if (v && typeof v === 'object') walkSwap(v);
    }
  };
  if (main.itinerary) walkSwap(main.itinerary);
  if (main.preDepartureTodos) walkSwap(main.preDepartureTodos);

  fs.writeFileSync(file, `${JSON.stringify(main, null, 2)}\n`);
  const out = fs.readFileSync(file, 'utf8');
  const remainingEur = (out.match(/€\d/g) || []).length;
  const remainingC = (out.match(/\d\s?°C/g) || []).length;
  console.log(`${slug}: tt-panel injected, ${changedSwaps} swaps, remaining € on page: ${remainingEur}, remaining °C: ${remainingC}`);
}
process.exit(failures ? 1 : 0);
