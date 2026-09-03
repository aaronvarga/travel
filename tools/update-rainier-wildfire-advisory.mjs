import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { shortCalendar } from './lib/short-calendar.mjs';

const pagePath = 'mt-rainier-seattle-2026.html';
// This updater reconstructs the page from the last pre-wildfire itinerary. Using
// HEAD made it a one-shot script: after the rebuilt page was committed, its old
// replacement targets disappeared. Pin the immutable baseline so reruns are safe.
const baselineRevision = '595edfa3^';
const source = execFileSync('git', ['show', `${baselineRevision}:${pagePath}`], { encoding: 'utf8' });
let html = source;

function replaceOnce(before, after) {
  if (!html.includes(before)) throw new Error(`Expected text not found: ${before.slice(0, 90)}`);
  html = html.replace(before, after);
}

function replaceBlock(startMarker, endMarker, replacement) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Missing block: ${startMarker}`);
  html = `${html.slice(0, start)}${replacement}${html.slice(end + endMarker.length)}`;
}

function sectionFromBaseline(id) {
  const start = source.indexOf(`<section id="${id}"`);
  const next = source.indexOf('<section id="', start + 1);
  const end = next >= 0 ? next : source.indexOf('</main>', start);
  if (start < 0 || end < 0) throw new Error(`Missing baseline section: ${id}`);
  return source.slice(start, end).trim();
}

// The baseline mixes raw glyphs and HTML entities for the same characters, and its
// indentation is not stable across sections. Match targets through a tolerant regex
// so an edit is keyed on the text, not on incidental encoding or whitespace.
// Each row lists interchangeable spellings of one character. Longest first;
// &amp;/& must stay last or it would swallow the "&" of "&middot;".
const ENTITIES = [
  ['&middot;', '·'], ['&mdash;', '—'], ['&ndash;', '–'],
  ['&rsquo;', '’', "'"], ['&lsquo;', '‘', "'"],
  ['&ldquo;', '“', '"'], ['&rdquo;', '”', '"'],
  ['&eacute;', 'é'], ['&deg;', '°'], ['&nbsp;', ' '], ['&amp;', '&']
];
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWord = c => /\w/.test(c || '');

function flexibleMatcher(target) {
  const tokens = target.trim().split(/\s+/).map(token => {
    let out = '';
    for (let i = 0; i < token.length;) {
      const set = ENTITIES.find(forms => forms.some(f => token.startsWith(f, i)));
      if (set) {
        out += `(?:${set.map(escapeRe).join('|')})`;
        i += set.find(f => token.startsWith(f, i)).length;
        continue;
      }
      // Tag boundaries may or may not carry whitespace in the baseline.
      if (token[i] === '>' && token[i + 1] === '<') { out += '>\\s*'; i += 1; continue; }
      out += escapeRe(token[i]);
      i += 1;
    }
    return out;
  });
  const body = tokens.reduce((acc, token, i) => {
    if (i === 0) return token;
    // Whitespace is only mandatory between two word characters.
    const glue = isWord(target.trim().split(/\s+/)[i - 1].slice(-1)) && isWord(target.trim().split(/\s+/)[i][0]) ? '\\s+' : '\\s*';
    return acc + glue + token;
  }, '');
  return new RegExp(body);
}

// Surgical edits inside a restored baseline section. Throws when a target string
// has drifted, so a stale edit can never silently no-op.
function edit(str, pairs) {
  return pairs.reduce((acc, [before, after]) => {
    const re = flexibleMatcher(before);
    if (!re.test(acc)) throw new Error(`Section edit target not found: ${before.slice(0, 90)}`);
    return acc.replace(re, () => after);
  }, str);
}

// Remove whole <article class="cls"> blocks whose <h3> matches one of `headings`.
// pg-spot / tg-trail articles are never nested, so the lazy close tag is safe.
function dropArticles(str, cls, headings) {
  const re = new RegExp(`<article class="${cls}"[^>]*>[\\s\\S]*?<\\/article>`, 'g');
  let removed = 0;
  const out = str.replace(re, block => {
    const raw = (block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || '';
    const title = raw.replace(/<[^>]*>/g, '').trim();
    if (headings.some(h => title.includes(h))) { removed += 1; return ''; }
    return block;
  });
  if (removed !== headings.length) throw new Error(`dropArticles(${cls}) removed ${removed} of ${headings.length}`);
  // Removing a block leaves its indentation behind as a trailing-whitespace line.
  return out.replace(/\n[ \t]+(?=\n)/g, '\n').replace(/\n{3,}/g, '\n\n');
}

function card(kicker, title, body) {
  return `<article class="ocard"><p class="eyebrow">${kicker}</p><h4>${title}</h4><p>${body}</p></article>`;
}

function section(id, eyebrow, title, lead, body, cls = 'divider') {
  return `<section id="${id}"${cls ? ` class="${cls}"` : ''}><div class="section-label"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2><p>${lead}</p></div>${body}</section>`;
}

function figuresFor(prefix, limit = 5) {
  return [...source.matchAll(/<figure><a[\s\S]*?<\/figure>/g)].map(m => m[0]).filter(f => f.includes(`/` + prefix)).slice(0, limit);
}

function carousel(id, figures) {
  const dots = figures.map((_, i) => `<button type="button" class="dot" data-i="${i}" aria-label="Photo ${i + 1}"></button>`).join('');
  return `<div class="carousel" id="${id}" data-n="${figures.length}"><div class="track">${figures.join('')}</div><button type="button" class="nav prev" aria-label="Previous photo">&lsaquo;</button><button type="button" class="nav next" aria-label="Next photo">&rsaquo;</button><div class="counter"><span class="cur">1</span> / ${figures.length}</div><div class="dots">${dots}</div></div>`;
}

function photo(src, href, title, credit, alt) {
  return `<figure><a href="${href}" target="_blank" rel="noreferrer"><img src="assets/img/mt-rainier-seattle-2026/${src}" alt="${alt}" loading="lazy"></a><figcaption><strong>${title}</strong><span>${credit}</span></figcaption></figure>`;
}

const discoveryRoutes = [
  // Must precede the /pinnacle/ row: the tarn is a POI on an unmaintained spur,
  // not the Pinnacle Peak Trail, so it must not inherit that AllTrails route.
  [/glacier tarn/i, 'pinnacleglaciertarn', 'https://www.alltrails.com/poi/us/washington/ashford/pinnacle-glacier', 'Pinnacle Glacier Tarn Mount Rainier reflection'],
  [/pinnacle/i, 'pinnaclesaddle', 'https://www.alltrails.com/trail/us/washington/pinnacle-peak-trail'],
  [/bench.*snow/i, 'benchandsnowlakes', 'https://www.alltrails.com/trail/us/washington/bench-lake'],
  [/cloudy or smoky skyline/i, 'seattlerooftop', null, 'Seattle rooftop bar skyline view'],
  [/skyline/i, 'skylinetrail', 'https://www.alltrails.com/trail/us/washington/skyline-trail'],
  [/comet.*van trump/i, 'cometfalls', 'https://www.alltrails.com/trail/us/washington/comet-falls-via-van-trump-trail'],
  [/naches/i, 'nachespeakloop', 'https://www.alltrails.com/trail/us/washington/naches-peak-loop-trail'],
  [/eagle peak/i, 'eaglepeaktrail', 'https://www.alltrails.com/trail/us/washington/eagle-peak-trail'],
  [/shriner/i, 'shrinerpeak', 'https://www.alltrails.com/trail/us/washington/shriner-peak-lookout-trail'],
  [/rampart/i, 'rampartridge', 'https://www.alltrails.com/trail/us/washington/rampart-ridge-loop'],
  [/(lakes trail|faraway rock)/i, 'farawayrock', 'https://www.alltrails.com/trail/us/washington/faraway-rock-via-skyline-and-mazama-ridge-trail'],
  [/silver falls/i, 'silverfallsmtrainier', 'https://www.alltrails.com/trail/us/washington/silver-falls-loop-trail'],
  [/high rock/i, 'highrocklookout', 'https://www.alltrails.com/trail/us/washington/high-rock-lookout-trail'],
  [/(deadhorse|dead horse|moraine)/i, 'deadhorsecreek', 'https://www.alltrails.com/trail/us/washington/dead-horse-creek'],
  [/reflection lakes.*box canyon/i, 'reflectionlakes', null, 'Reflection Lakes Box Canyon Mount Rainier'],
  [/go directly to seattle/i, 'visitseattle', null, 'Pike Place Market Seattle waterfront'],
  [/pike place.*waterfront.*kerry/i, 'visitseattle', null, 'Pike Place Market Seattle waterfront Kerry Park'],
  [/seattle max.*pike place.*smith tower.*kerry/i, 'visitseattle', null, 'Pike Place Market Overlook Walk Smith Tower Kerry Park Seattle'],
  [/seattle morning.*sea/i, 'seatac', null, 'Pike Place Market Seattle morning'],
  [/(late-arrival edit|rain-and-smoke edit)/i, 'pikeplacemarket', null, 'Pike Place Market Seattle'],
  [/late traffic edit/i, 'pikeplacemarket', null, 'Pike Place Market Overlook Walk Seattle'],
  [/low-energy date-night/i, 'pikeplacemarket', null, 'Pike Place Market Seattle date night'],
  [/early-arrival edit/i, 'seattlewaterfront', null, 'Seattle waterfront Kerry Park'],
  [/traffic or long-checkpoint/i, 'seatac', null, 'Seattle Tacoma airport security checkpoints'],
  [/normal morning, bad weather/i, 'seatac', null, 'Seattle downtown breakfast near SeaTac route']
];

function discoveryLinks(label, className = 'explore') {
  const plain = label.replace(/<[^>]+>/g, '').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const route = discoveryRoutes.find(([pattern]) => pattern.test(plain));
  const isSeattle = /seattle|pike|waterfront|kerry|airport|checkpoint|traffic|arrival edit|weather/i.test(plain);
  const query = route?.[3] || `${plain}${isSeattle ? ' Seattle' : ' Mount Rainier'}`;
  const tag = route?.[1] || plain.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 36) || 'mountrainier';
  const allTrails = route?.[2]
    ? `<a class="xg at-xg" href="${route[2]}" target="_blank" rel="noreferrer">AllTrails</a>`
    : '';
  return `<div class="${className}"><a class="xg" href="https://www.google.com/search?tbm=isch&amp;q=${encodeURIComponent(query)}" target="_blank" rel="noreferrer">Google photos</a><a class="xi" href="https://www.instagram.com/explore/tags/${tag}/" target="_blank" rel="noreferrer">IG &middot; #${tag}</a>${allTrails}</div>`;
}

// Field-guide gallery in the baseline tg-trail format. The trip-wide gallery
// harvests `#trail-guide .tg-gallery .pg-gitem`, so these feed it too.
function tgGallery(label, items) {
  const buttons = items.map(([file, cap], i) => {
    const src = `assets/img/mt-rainier-seattle-2026/${file}`;
    const hero = i === 0 ? ' pg-hero' : '';
    const count = i === 0 ? `<span class="tg-gcount">${items.length} photos</span>` : '';
    return `<button class="tg-gitem pg-gitem${hero}" type="button" data-full="${src}" data-cap="${cap}" style="background-image:url('${src}')" aria-label="Open ${label} photo ${i + 1}">${count}</button>`;
  }).join('');
  return `<div class="tg-gallery" data-gallery>${buttons}</div>`;
}

function pgGuideGallery(label, items) {
  const buttons = items.map(([file, cap], i) => {
    const src = `assets/img/mt-rainier-seattle-2026/${file}`;
    const hero = i === 0 ? ' pg-hero' : '';
    const count = i === 0 ? `<span class="pg-gcount">${items.length} photos</span>` : '';
    return `<button class="pg-gitem${hero}" type="button" data-full="${src}" data-cap="${cap}" style="background-image:url('${src}')" aria-label="Open photo ${i + 1} of ${label}">${count}</button>`;
  }).join('');
  return `<div class="pg-gallery" data-gallery>${buttons}</div>`;
}

function tgTrail(t) {
  const facts = t.facts.map(([k, v]) => `<div class="tg-fact"><span>${k}</span><b>${v}</b></div>`).join('');
  const links = t.links.map(([label, href]) => `<a href="${href}" target="_blank" rel="noreferrer">${label} &#8599;</a>`).join('');
  const reviews = t.reviews.map(r => `<li>${r}</li>`).join('');
  const gallery = t.gallery?.length ? tgGallery(t.label, t.gallery) : '';
  return `<article class="tg-trail" id="${t.id}"><div class="tg-head"><div><p class="tg-kicker">${t.kicker}</p><h3>${t.title}</h3></div><span class="tg-status${t.statusCls ? ` ${t.statusCls}` : ''}">${t.status}</span></div>${gallery}<div class="tg-facts">${facts}</div><div class="tg-insights"><section><h4>${t.whyHead}</h4><p>${t.why}</p></section><section class="tg-review"><h4>What the official sources reveal</h4><ul>${reviews}</ul></section></div><div class="tg-links">${links}</div></article>`;
}

function day(d) {
  const facts = d.facts.map(([k,v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('');
  const links = d.links.map(([t,u]) => `<a href="${u}" target="_blank" rel="noreferrer">${t}</a>`).join('');
  const alts = d.alts.map(a => `<li><a href="${a.href}" target="_blank" rel="noreferrer"><b>${a.title}</b> &#8599;</a> &mdash; ${a.body}${discoveryLinks(a.title, 'explore alt-discovery')}</li>`).join('');
  return `<article class="day ${d.cls}" id="${d.id}"><div class="day-head"><div class="day-badge">${d.badge}</div><div class="day-title"><p class="eyebrow">${d.date}</p><h3>${d.title}</h3><p class="feel">${d.feel}</p></div></div><div class="day-info"><div class="facts">${facts}</div><p class="note">${d.note}</p></div><div class="spots-wrap"><section class="spot"><div class="spot-head"><div><h4 class="spot-name">${d.spot}</h4></div>${discoveryLinks(d.spot)}</div>${d.photos}<div class="spot-grid"><div class="spot-info"><div class="kv"><span>Exact flow</span><p>${d.flow}</p></div><div class="kv climate"><span>Fire-season rule</span><p>${d.reality}</p></div><div class="callout save"><b>Access / cost</b> ${d.cost}</div><div class="callout splurge"><b>Food</b> ${d.food}</div><details class="altbox" open><summary class="mini-h">Plan B &middot; also awesome instead</summary><ul class="alt-list">${alts}</ul></details><div class="bloglinks"><p class="mini-h">Official checks</p>${links}</div></div><div class="spot-map"><div class="mapwrap"><iframe class="gmap" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(d.map)}&amp;z=11&amp;output=embed" title="Map of ${d.spot}"></iframe></div><a class="gmap-btn" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(d.map)}" target="_blank" rel="noreferrer">&#128205; Open in Google Maps &#8617;</a></div></div></section></div></article>`;
}

/* ------------------------------------------------------------------ hero */

// The PWA wiring (manifest, icons, offline script, trip slug) landed after the
// pinned baseline, so the rebuild must re-inject it or regeneration silently
// strips offline support (client-contract.test.mjs guards this).
replaceOnce(
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>',
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="assets/icons/travelplanner-180.png">\n<meta name="theme-color" content="#173c38">\n<script src="assets/js/pwa.js?v=20260829-offline-trips-2" defer></script>\n<title>'
);
replaceOnce('<body>', '<body data-trip-slug="mt-rainier-seattle-2026">');
replaceOnce('</head>', '<style id="rainier-anchor-offset">@media(max-width:959px){section[id],article[id]{scroll-margin-top:124px}}</style></head>');

replaceOnce(
  '.altbox .alt-list a{text-decoration:none}.altbox .alt-list b{color:var(--ink)}',
  '.altbox .alt-list a{text-decoration:none}.altbox .alt-list b{color:var(--ink)}\n.alt-discovery{margin-top:7px}.trail-discovery{margin-top:8px;flex-wrap:wrap;overflow-x:visible}.trail-discovery a,.alt-discovery a{font-size:.65rem;padding:4px 9px}\n.site-home{display:flex;align-items:center;justify-content:center;min-height:40px;margin:0 2px 10px;padding:8px 10px;border:1px solid var(--nav-line);border-radius:10px;background:rgba(246,241,231,.08);color:#fff!important;font-size:.76rem;letter-spacing:.03em}.site-home:hover{background:var(--nav-active)!important;color:var(--nav-active-ink)!important;border-color:var(--nav-active)!important}@media(min-width:960px){.site-nav{display:flex;flex-direction:column}.site-nav>.site-nav-menu{height:auto;flex:1 1 auto}.site-nav-links{max-height:calc(100vh - 142px)}}@media(max-width:959px){.site-home{max-width:1180px;margin:0 auto 8px}}'
);

replaceOnce('<p class="pv-lead">Four nights built around the views that matter most: Pinnacle Saddle on arrival afternoon, Skyline above Paradise, Mount Fremont Lookout through sunset, and an unhurried Seattle handoff the next morning.</p>', '<p class="pv-lead">Your paid Packwood cabin stays, every feasible day keeps a weather-gated sunset, Saturday and Monday keep short dawn outings, and Sunday inherits Skyline in the driest high-country window.</p>');
replaceOnce('<span class="pv-kicker">Couples trip &middot; Sept. 4&ndash;8, 2026</span>', '<span class="pv-kicker">Rebuilt for current closures &middot; Sept. 4&ndash;8, 2026</span>');
replaceOnce('<div class="pv-stats"><div><b>3</b><span>Priority hikes</span></div><div><b>3</b><span>Packwood nights</span></div><div><b>7:36 PM</b><span>Sunday sunset</span></div><div><b>1</b><span>Seattle night</span></div></div>', '<div class="pv-stats"><div><b>4</b><span>Open hikes kept</span></div><div><b>3</b><span>Paid Packwood nights</span></div><div><b>2</b><span>Major hike days</span></div><div><b>Aug. 31</b><span>Status re-read</span></div></div>');

// The hero photographs are subject-generic Rainier portfolio work and stay as they
// are; only the two captions and one alt that named closed terrain are corrected.
replaceOnce('alt="Mount Rainier rising above a glowing cloud inversion at sunset near Mount Fremont Lookout"', 'alt="Mount Rainier rising above a glowing cloud inversion at sunset"');

replaceBlock('<nav class="site-nav" aria-label="Page sections">', '</nav>', `<nav class="site-nav" aria-label="Page sections"><a class="site-home" href="index.html">&larr; TravelPlanner home</a><details class="site-nav-menu" open><summary>Packwood / Rainier / Seattle</summary><div class="site-nav-links"><a href="#top">Overview</a><a href="#closure-update">Closures</a><a href="#arrangements">Bookings</a><a href="#stays">Lodging</a><a href="#calendar">Calendar</a><a href="#map">Map</a><a href="#closed-trails">What is closed</a><a href="#itinerary">Day by day</a><a href="#day1">Friday</a><a href="#day2">Saturday</a><a href="#day3">Sunday</a><a href="#day4">Monday</a><a href="#day4c">Seattle max</a><a href="#day5">Tuesday</a><a href="#saved-ideas">Saved ideas</a><a href="#recommended-trails">Best hikes</a><a href="#trail-guide">Trail guide</a><a href="#photo-guide">Photo guide</a><a href="#packing">Packing</a><a href="#food-guide">Food</a><a href="#insider-tips">Tips</a><a href="#sources">Sources</a></div></details></nav>`);

/* --------------------------------------------------------- new sections */

const closureUpdate = section('closure-update', 'Official status + weather &middot; re-read Sept. 3, 2026', 'Rainier is still worth the trip—weather reshuffled the hikes', 'The closure map is serious, but it does not close the mountain. The paid Packwood base still serves the open Paradise, Longmire, Stevens Canyon, Ohanapecosh, Tipsoo, and Chinook Pass corridors; the newest elevation-specific forecast now determines which open trail gets each window.', `<div class="overview">
${card('Open road spine', 'Packwood &rarr; SR 123 &rarr; Stevens Canyon &rarr; Paradise', 'SR 123, Stevens Canyon Road, Paradise Valley Road, Longmire&ndash;Paradise, and the Nisqually corridor are all listed open on the NPS road page (updated Aug. 11). This is the route the revised trip uses.')}
${card('Closed northeast', 'Sunrise + White River', 'Sunrise Road and White River Road are closed to SR 410 for the Grand Park 2 Fire. Every trail originating from those roads is closed with them, including Fremont, Burroughs, Glacier Basin, Emmons Moraine, Sourdough Ridge, Dege Peak, and Silver Forest.')}
${card('Reopened Tatoosh pocket', 'Pinnacle Peak Trail is back', 'The Plummer Peak Fire closed Pinnacle Peak Trail and the Lane&ndash;Foss ridge on Aug. 24. That closure has been lifted: the NPS trail report cleared the Pinnacle Peak row on Aug. 27, and the alerts page updated Aug. 31 lists only the north-side fire closures. WTA and trail apps may still show the stale Aug. 24 closed banner.')}
${card('Where Friday sits', 'Pinnacle is open—but weather-downgraded', 'Pinnacle remains legal, but the latest Paradise hourly forecast puts likely thunderstorms over the 3&ndash;4 PM arrival window. Reflection Lakes is now the default sunset outing. Attempt the exposed 5,920-ft saddle only after radar, the Tatoosh webcam and an in-person thunder check are unequivocally clear.')}
${card('Forecast-led swap', 'Skyline moves from Saturday to Sunday dawn', 'Saturday is relatively dry around sunrise, then rain is likely from 11 AM through late afternoon. Sunday 6&ndash;10 AM falls near 5% precipitation in the current NWS hourly forecast, so the full Skyline Loop moves there. Comet Falls remains the useful lower, clouded-mountain fallback rather than the scheduled marquee hike.')}
${card('Other closures', 'Wonderland Complex + Carbon/Mowich', 'The Wonderland Trail is closed from the Carbon River Suspension Bridge to White River Campground for the Wonderland Complex, along with part of the Northern Loop. SR 165 and the Fairfax Bridge separately leave no public Carbon River or Mowich access. Grove of the Patriarchs remains closed for bridge damage, but its parking lot and the Silver Falls access trail remain open.')}
</div><p class="notice"><b>The honest recommendation:</b> go to Rainier and sleep in Packwood. Do not chase the north-side fire boundary. Keep every major hike on the open south/west road spine and recheck the official fire, road, and trail pages plus AQI each morning &mdash; a fire closure can grow overnight.</p>`);

const arrangements = edit(sectionFromBaseline('arrangements'), [
  [
    'AS341 arrives in Seattle at 10:25 AM Friday. Return Tuesday is SEA &rarr; ORD &rarr; PIT, landing in Pittsburgh at 11:59 PM Eastern.',
    'AS78 leaves PIT at 7:02 AM and arrives in Seattle at 9:14 AM Friday. Tuesday: AS429 leaves SEA at 11:35 AM and lands at ORD at 6:01 PM; AS6776 leaves ORD at 7:00 PM and lands at PIT at 9:44 PM Eastern.'
  ],
  [
    'Budget pickup at 11:00 AM Friday and return by noon Tuesday. The itinerary parks once in Seattle after the mountain segment.',
    'Budget pickup remains 11:00 AM Friday. On Tuesday, leave the W at 8:00 AM, target the off-site Budget return for 8:30&ndash;8:45, then use the rental-car shuttle and aim to reach the terminal around 9:00 AM.'
  ]
]);

const calendar = shortCalendar({
  eyebrow: 'Your Travel Days',
  title: 'The complete Rainier / Seattle schedule',
  intro: 'Every trip day is shown on one hour-by-hour strip. Blocks snap to the two-hour grid, while the labels carry the actual flight times and practical mountain-drive windows. Trail drives use the booked Packwood cabin&rsquo;s public pin; add more time whenever the park gate, parking, smoke, weather, or Labor Day traffic demands it.',
  ariaLabel: 'Mount Rainier and Seattle trip calendar, September 4 through September 8, 2026',
  legend: { car: 'Drive / shuttle', hike: 'Trail', town: 'Food / Seattle', rest: 'Cabin / buffer' },
  days: [
    { dow: 'Fri', date: [9, 4], blocks: [
      { act: 'air', start: 6, end: 10, label: 'AS78 &middot; PIT 7:02 &rarr; SEA 9:14' },
      { act: 'car', start: 10, end: 12, label: 'Rental &rarr; Fred Meyer SR 7 &middot; plan 1:00&ndash;1:15' },
      { act: 'town', start: 12, end: 14, label: 'Groceries + beer, then Fred Meyer &rarr; Pinnacle &middot; plan 2 hr' },
      { act: 'hike', start: 16, end: 20, label: 'Weather gate &middot; Reflection sunset; Pinnacle only if thunder clears' },
      { act: 'car', start: 20, end: 22, label: 'Trail &rarr; cabin &middot; plan 1:00&ndash;1:15' }
    ] },
    { dow: 'Sat', date: [9, 5], blocks: [
      { act: 'hike', start: 6, end: 8, label: 'Leave 5:00 &middot; Reflection / Faraway sunrise 6:31' },
      { act: 'car', start: 8, end: 10, label: 'Reflection &rarr; cabin &middot; 1:10&ndash;1:25' },
      { act: 'rest', start: 10, end: 16, label: 'Breakfast + mandatory nap &middot; rain-likely window' },
      { act: 'car', start: 16, end: 18, label: 'Cabin &rarr; Paradise &middot; leave about 4:30' },
      { act: 'hike', start: 18, end: 20, label: 'Paradise meadow sunset &middot; 7:37 PM' },
      { act: 'car', start: 20, end: 22, label: 'Paradise &rarr; cabin &middot; 1:20&ndash;1:35' }
    ] },
    { dow: 'Sun', date: [9, 6], blocks: [
      { act: 'hike', start: 6, end: 12, label: 'Leave 4:30 &middot; Skyline dry-window start 6:00' },
      { act: 'car', start: 12, end: 14, label: 'Paradise &rarr; cabin &middot; 1:20&ndash;1:35' },
      { act: 'rest', start: 14, end: 16, label: 'Cabin recovery + early dinner' },
      { act: 'car', start: 16, end: 18, label: 'Cabin &rarr; Tipsoo &middot; 1:00&ndash;1:10' },
      { act: 'hike', start: 18, end: 20, label: 'Naches clockwise sunset &middot; 7:35 PM' },
      { act: 'car', start: 20, end: 22, label: 'Tipsoo &rarr; cabin &middot; 1:00&ndash;1:10' }
    ] },
    { dow: 'Mon', date: [9, 7], blocks: [
      { act: 'hike', start: 6, end: 8, label: 'Checkout 5:00 &middot; Tipsoo sunrise 6:34' },
      { act: 'car', start: 8, end: 12, label: 'Tipsoo &rarr; W Seattle &middot; plan 2:30&ndash;3:00' },
      { act: 'town', start: 12, end: 16, label: 'Bag drop + Pike Place / waterfront lunch' },
      { act: 'car', start: 16, end: 18, label: 'W &rarr; Discovery Park &middot; plan 25&ndash;35 min' },
      { act: 'hike', start: 18, end: 20, label: 'Discovery Park / West Point sunset &middot; 7:37 PM' },
      { act: 'car', start: 20, end: 22, label: 'Discovery &rarr; W &middot; plan 25&ndash;35 min' }
    ] },
    { dow: 'Tue', date: [9, 8], blocks: [
      { act: 'town', start: 6, end: 8, label: 'Grab-and-go breakfast + checkout' },
      { act: 'car', start: 8, end: 10, label: 'W &rarr; Budget &middot; 30&ndash;45 min + shuttle' },
      { act: 'rest', start: 10, end: 12, label: 'SEA check-in + security buffer' },
      { act: 'air', start: 12, end: 22, label: 'Only non-sunset day: AS429 11:35 &rarr; ORD &middot; AS6776 &rarr; PIT 9:44 PM' }
    ] }
  ]
});

const recommended = section('recommended-trails', 'Research verdict', 'Three sunrise plays + four weather-gated sunsets', 'The plan now protects a real sunset hike every day you are not airborne and uses the latest hourly forecast to place the major route in the best available window. Official fire and trail status decides whether a route is legal; NWS timing, live observations and model agreement decide when to attempt it.', `<div class="overview">
${card('Friday &middot; 7:39 PM', 'Reflection Lakes sunset default &mdash; weather first', '<b>Short maintained shoreline / Lakes Trail outing.</b> NWS now puts the 3&ndash;4 PM arrival window under likely showers and thunderstorms. Wait for radar and thunder to clear, then take the low sunset; attempt Pinnacle Saddle only if the 4:15 gate is unequivocally dry and lightning-free.')}
${card('Saturday &middot; sunrise + sunset', 'Reflection dawn + Paradise meadow sunset &mdash; 9.3/10', '<b>1.3 mi / 300 ft at dawn, then a 1&ndash;2.5 mile evening circuit.</b> The 6:31 sunrise sits in the day&rsquo;s 14% precipitation window. Return to the cabin for a long recovery block while rain is likely, then use Nisqually Vista / Myrtle Falls / Alta Vista after the probability falls near 24%.')}
${card('Sunday &middot; sunrise + sunset', 'Skyline dawn + Naches sunset &mdash; 9.8/10', '<b>5.5 mi / 1,700 ft early, then 3.2 mi / 600 ft at sunset.</b> Sunday 6&ndash;10 AM is now the clearest high-country window: NWS is near 5% precipitation, and the independent models also make it the weekend minimum. Put the marquee loop there, recover at the cabin, then preserve the clockwise Naches sunset.')}
${card('Monday &middot; sunrise + sunset', 'Tipsoo dawn + Discovery Park &mdash; 9.4/10', '<b>About 1 mile at dawn, then 3.5&ndash;4.5 miles at sunset.</b> Pack and check out before leaving. Tipsoo gives immediate Rainier, meadow and reflection value around the 6:34 sunrise, then SR 410 continues toward Seattle without returning to the cabin. Discovery Park keeps the 7:37 Olympic Mountains sunset.')}
${card('Why not the obvious sunrise icon?', 'High Rock is not the value play right now', '<b>3.2 mi / 1,365 ft plus a rough forest-road approach.</b> The trail and trailhead reopened Aug. 29, but the lookout and surrounding 150 feet remain closed through Oct. 31 for restoration. Without the signature summit payoff, it is too much dark driving, exposure and sleep cost for this checkout morning.')}
${card('Opt-in hard day', 'Eagle Peak Saddle &mdash; 9.0/10 scenery', '<b>7.2 mi / 2,955 ft / 5 hr.</b> The best true Tatoosh-ridge view left open, and well west of the Lane Peak boundary. Take it only if the group actively wants a steep, strenuous Sunday in place of Comet and Van Trump &mdash; it is not the automatic fallback.')}
${card('Best open lookout alternative', 'Shriner Peak &mdash; 8.9/10 scenery', '<b>8 mi / 3,434 ft / about 5 hr.</b> A historic lookout with commanding Rainier, Ohanapecosh Valley, and Cascade views from an open SR 123 trailhead. It is steep, shadeless, and waterless, so it replaces a major hike only after an early group decision.')}
${card('Weather + parking fallback', 'Rampart Ridge &mdash; 7.8/10', '<b>4.6 mi / 1,339 ft / 2.5 hr.</b> Open old-growth loop from Longmire with Rainier and Nisqually Valley viewpoints. This is the default catch when the Comet Falls lot is full or high ridges are windy or hazy.')}
${card('Best low-smoke / low-cloud fallback', 'Silver Falls &mdash; 7.7/10', '<b>2 mi / 300 ft / about 1 hr.</b> A forceful 60-foot river waterfall reached from the seasonally open Grove of the Patriarchs parking lot. The grove is closed, but NPS explicitly keeps this trail access open.')}
</div><p class="notice"><b>Why Skyline moved:</b> NWS currently puts Saturday&rsquo;s 11 AM&ndash;4 PM window near 59% precipitation but Sunday 6&ndash;10 AM near 5%. Use that Sunday dawn window for Skyline; keep Comet Falls as the lower fallback if the mountain is socked in, and do not sacrifice the Naches sunset trying to force either route.</p>`);

const closedTrails = section('closed-trails', 'Access rules', 'What stays closed—and what only looks closed', 'Several famous trails still appear in old blogs, cached maps, and saved lists. Most are not options for these dates; Silver Falls and the reopened Pinnacle Peak Trail are the important exceptions.', `<div class="overview">
${card('No access', 'Fremont, Burroughs, Glacier Basin, Emmons, Dege, Silver Forest', 'All originate from the closed Sunrise or White River roads. Do not route around the gates or treat a trail app&rsquo;s &ldquo;open&rdquo; label as authoritative.')}
${card('Reopened Aug. 27', 'Pinnacle Peak Trail', 'The Plummer Peak Fire closure has been lifted: the NPS trail report cleared the Pinnacle Peak row on Aug. 27 and the Aug. 31 alerts page no longer lists it. WTA and AllTrails may still carry the stale Aug. 24 closed banner. Stay on the maintained trail to the saddle &mdash; do not extend toward Plummer Peak or recently burned ground.')}
${card('No public access', 'Tolmie Peak + Spray Park', 'The SR 165 / Fairfax Bridge closure means there is no normal public road access to Carbon River or Mowich Lake, and no alternate route.')}
${card('Open with a routing caveat', 'Silver Falls', 'The Ohanapecosh Campground connection is closed, so it is not a loop. NPS confirms the Grove of the Patriarchs parking lot and the Eastside/Silver Falls trail access remain open; use the signed out-and-back and do not enter the closed grove.')}
</div>`);

/* ------------------------------------------------------------ carousels */

const skylinePhotos = carousel('day2-car', figuresFor('google_trail_car_skyline_', 5));
const nachesPhotos = carousel('day4-car', figuresFor('google_trail_car_naches_', 5));

// Official NPS live webcams (verified live Aug. 31): the Paradise "Mountain" cam
// is the go/no-go view of the summit; the "Tatoosh" cam looks south from Paradise
// straight at the range Pinnacle Saddle climbs into. Sunrise cams sit behind the
// closure and are deliberately not linked.
const CAM_MOUNTAIN = 'https://www.nps.gov/media/webcam/view.htm?id=81B46307-1DD8-B71B-0B72918A4B2EB790';
const CAM_TATOOSH = 'https://www.nps.gov/media/webcam/view.htm?id=81B46402-1DD8-B71B-0B95C911C1395AAC';
const CAM_INDEX = 'https://www.nps.gov/mora/learn/photosmultimedia/webcams.htm';
const camLink = (label, href = CAM_MOUNTAIN) => `<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`;

const G = 'Google Images source';
// Friday reverts to the pre-fire Pinnacle imagery, which the closure-era rebuild
// had orphaned; the Reflection Lakes set lives on in the photo guide and the
// Bench & Snow / Lakes Trail cards, so nothing here repeats another surface.
const arrivalPhotos = carousel('day1-car', [
  photo('google_c1_pinnacle_exact_01.jpg', 'https://www.flickr.com/photos/herosjourneymythology45surf/52663295353/', 'Rainier beyond the Tatoosh', `45SURF Hero's Odyssey Mythology Photography &middot; ${G}`, 'Mount Rainier rising beyond the Tatoosh Range from the Pinnacle Saddle trail'),
  photo('google_c1_pinnacle_exact_02.jpg', 'https://www.flickr.com/photos/bruceikenberryphotography/9391120770/', 'The Trail below Rainier', `Bruce Ikenberry &middot; ${G}`, 'Hikers on the Pinnacle Peak Trail with Mount Rainier filling the sky beyond'),
  photo('google_c1_2.jpg', 'https://jimpattersonphotography.com/nature-photo-galleries/mount-rainier-photo-gallery/', 'Linear State of Mind', `Jim Patterson &middot; ${G}`, 'Ridgelines of the Tatoosh Range leading toward Mount Rainier in evening light'),
  photo('google_c1_pinnacle_new_01.jpg', 'https://www.flickr.com/photos/33792231@N00/21581853486/', 'Across the Tatoosh', `Crest Pictures &middot; ${G}`, 'The craggy Tatoosh Range spread out from the Pinnacle Saddle viewpoint'),
  photo('google_c1_pinnacle_new_02.jpg', 'https://www.flickr.com/photos/60803140@N06/36554551801/', 'Pinnacle Peak', `Karen Molenaar Terrell &middot; ${G}`, 'Pinnacle Peak above the saddle with the Tatoosh Range in dramatic light'),
  photo('google_c1_pinnacle_new_03.jpg', 'https://www.flickr.com/photos/60803140@N06/36554688201/', 'Weather over Rainier', `Karen Molenaar Terrell &middot; ${G}`, 'Storm light over Mount Rainier seen from the Pinnacle Saddle trail')
]);

const waterfallPhotos = carousel('day3-car', [
  photo('google_comet_falls_01.jpg', 'https://www.flickr.com/photos/53400673@N08/37430043012/', 'Comet Falls Blue and Green', `Robert Cross &middot; ${G}`, 'Comet Falls plunging 320 feet into a green amphitheatre with Van Trump Creek below'),
  photo('google_van_trump_park_01.jpg', 'https://www.flickr.com/photos/jlcummins_photography/14821174196/', 'Avalanche lilies, Van Trump Park', `jlcummins &middot; ${G}`, 'Avalanche lilies in Van Trump Park meadow beneath Mount Rainier&rsquo;s Kautz Glacier'),
  photo('google_comet_falls_02.jpg', 'https://www.flickr.com/photos/116895768@N03/50568289877/', 'Beneath the Beauty', `Rich Border &middot; ${G}`, 'Tiered cascade of Comet Falls over mossy basalt cliffs'),
  photo('google_christine_falls_01.jpg', 'https://www.flickr.com/photos/phils-pixels/52306362719/', 'Christine Falls', `Phil Kuntz &middot; ${G}`, 'Christine Falls framed by the stone highway bridge on the road to Paradise'),
  photo('google_mildred_point_02.jpg', 'https://www.flickr.com/photos/194908364@N07/53442471638/', 'Kautz Glacier from Mildred Point', `Brian Haagen &middot; ${G}`, 'Kautz Glacier and Mount Rainier&rsquo;s summit seen from Mildred Point above Van Trump Park'),
  photo('google_christine_falls_02.jpg', 'https://www.flickr.com/photos/phils-pixels/38704784754/', 'Time Flows Like a River', `Phil Kuntz &middot; ${G}`, 'Long-exposure of Christine Falls dropping through a mossy gorge')
]);

const seattleMondayPhotos = carousel('day4b-car', [
  photo('google_seattle_monday_pike_flowers_01.jpg', 'https://visitseattle.org/things-to-do/sightseeing/waterfrontexpansion/', 'Flowers at Pike Place', `Brian Jannsen / Visit Seattle &middot; ${G}`, 'Colorful flower bouquets and shoppers inside Pike Place Market'),
  photo('google_seattle_monday_overlook_walk_01.jpg', 'https://www.seattle.gov/waterfront/projects/overlook-walk', 'Overlook Walk to Elliott Bay', `Waterfront Seattle &middot; ${G}`, 'Overlook Walk descending through landscaped terraces toward Elliott Bay and the Seattle Great Wheel'),
  photo('google_seattle_monday_pier_62_01.jpg', 'https://waterfrontparkseattle.org/pier-62/', 'Pier 62 on Elliott Bay', `Robert Wade / Waterfront Park Seattle &middot; ${G}`, 'Open promenade at Pier 62 with the Seattle skyline and Great Wheel beyond'),
  photo('google_seattle_monday_matts_market_01.jpg', 'https://www.timeout.com/seattle/restaurants/matts-in-the-market', 'Matt&rsquo;s Above the Market', `Time Out Seattle &middot; ${G}`, 'Warm dining room at Matt&rsquo;s in the Market overlooking the Pike Place sign'),
  photo('google_seattle_monday_kerry_park_01.jpg', 'https://www.flickr.com/photos/chatterstone/15789975841/', 'Rainier from Kerry Park', `Grant &middot; ${G}`, 'Space Needle, downtown Seattle, and Mount Rainier aligned at dusk from Kerry Park')
]);
const seattleMaxPhotos = carousel('day4c-car', [
  photo('google_seattle_max_pike_sign_01.jpg', 'https://www.flickr.com/photos/stonebridgedapper/3812261243/', 'The Public Market Entrance', `StoneBridgeDapper &middot; ${G}`, 'Pike Place Market&rsquo;s red neon clock and Public Market Center sign above the busy entrance'),
  photo('google_seattle_max_pike_vendor_01.jpg', 'https://www.flickr.com/photos/tormodspictures/15291048879/', 'Market Vendors at Work', `Tormod Ulsberg &middot; ${G}`, 'Pike Place produce and flower vendors working beneath hanging peppers and market signs'),
  photo('google_seattle_max_waterfront_01.jpg', 'https://www.soundtransit.org/blog/lifestyle/album-journey-seattle-waterfront-westlake-station-carnavas', 'Waterfront and Pier 62', `Sound Transit &middot; ${G}`, 'Seattle waterfront, Pier 62, Great Wheel, and downtown towers seen from above'),
  photo('google_seattle_max_smith_tower_01.jpg', 'https://www.indefiniteadventure.com/seattle-smith-tower-observatory-access-ticket/', 'Smith Tower Observatory', `Indefinite Adventure &middot; ${G}`, 'Visitors having a drink beside the arched windows of Smith Tower Observatory'),
  photo('google_seattle_max_kerry_park_01.jpg', 'https://www.flickr.com/photos/esteecha/15062653067/', 'Kerry Park at Blue Hour', `Estee Cha &middot; ${G}`, 'Seattle city lights, the Space Needle, and Mount Rainier at blue hour from Kerry Park'),
  photo('google_seattle_max_nest_01.jpg', 'https://visitseattle.org/blog/did-someone-say-rooftop-bar/', 'The Nest over Elliott Bay', `Visit Seattle &middot; ${G}`, 'The Nest rooftop lounge overlooking Elliott Bay, the Great Wheel, and the Olympic Mountains'),
  photo('google_seattle_max_pike_night_01.jpg', 'https://www.flickr.com/photos/sunrisesoup/23887531675/', 'Pike Place after Dark', `sunrisesoup &middot; ${G}`, 'Pike Place Market&rsquo;s neon sign glowing after dark beside the market arcade')
]);
const seattleTuesdayPhotos = carousel('day5-car', figuresFor('google_c5_', 5));

/* ----------------------------------------------------------- trail guide */

const benchSnowCard = tgTrail({
  id: 'tg-bench-snow', label: 'Bench &amp; Snow', kicker: 'Friday fallback &middot; gentler, same corridor',
  title: 'Bench + Snow Lakes', status: 'Friday fallback', statusCls: 'alt',
  gallery: [
    ['google_reflection_lakes_01.jpg', `Rainier Reflections &middot; Phil Kuntz &middot; ${G}`],
    ['google_c1_1.jpg', `Golden Morning Over the Tatoosh &middot; ${G}`],
    ['google_faraway_rock_01.jpg', `View from Faraway Rock &middot; Kelley Diwan &middot; ${G}`],
    ['google_c1_4.jpg', `Lupine Field at Mount Rainier &middot; ${G}`],
    ['google_c1_5.jpg', `Mountain Cap Sunset &middot; ${G}`]
  ],
  facts: [
    ['Official route', '2.5 mi &middot; 700 ft gain<br>out and back to Snow Lake'],
    ['Difficulty + time', 'Moderate &middot; about 2 hr<br>short but rooty and undulating'],
    ['From Airbnb pin', '33.4 mi &middot; router: 1:05<br>plan 1:10&ndash;1:25'],
    ['Best light', 'Arrival window 4:30&ndash;6:30 PM<br>gold 6:40&ndash;7:40 &middot; sunset 7:42']
  ],
  whyHead: 'Why it stays in the plan',
  why: 'It carried Friday while Pinnacle Peak was closed, and it remains the perfect fallback: the pullout is 1.5 miles east of the Reflection Lakes trailhead on the same Stevens Canyon drive, the climb is 350 feet gentler, and it still delivers two alpine lakes plus a Rainier reflection in Bench Lake when the air is still. Take it when the arrival runs late or the group wants lakes over a saddle.',
  reviews: [
    'Bench Lake comes first at roughly 0.75 mile and is the reflection shot; Snow Lake is the quieter destination under the Unicorn Peak headwall.',
    'The tread rolls more than the small elevation figure suggests, with roots and a couple of short steep pitches. It is not a paved stroll.',
    'This is well-known black-bear habitat in late summer. Make noise on the blind corners and never leave food unattended at the lakes.',
    'Parking is a small roadside pullout 1.5 miles east of Reflection Lakes. On a Labor Day weekend afternoon expect it to be busy but turning over.'
  ],
  links: [
    ['NPS Bench &amp; Snow Lake', 'https://www.nps.gov/mora/planyourvisit/bench-snow-lake-trail.htm'],
    ['WTA route + trip reports', 'https://www.wta.org/go-hiking/hikes/bench-and-snow-lakes'],
    ['AllTrails reviews', 'https://www.alltrails.com/trail/us/washington/bench-lake'],
    ['Live trail conditions', 'https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],
    ['NPS fire closures', 'https://www.nps.gov/mora/learn/news/fire.htm'],
    ['Cabin &rarr; trailhead', 'https://www.google.com/maps/dir/?api=1&amp;origin=46.6505,-121.63574&amp;destination=46.7649,-121.7038']
  ]
});

// The viral mirror shot people send each other is NOT on the Pinnacle Peak Trail:
// it is a tarn at roughly 46.7586, -121.7307 in the north-facing cirque under the
// Pinnacle Glacier, reached by an unsigned, unmaintained boot path. It gets its own
// card so the distance, the route-finding, and the "it may be dry" caveat are stated
// once, in full, instead of being smuggled into the Pinnacle Saddle card.
const tarnCard = tgTrail({
  id: 'tg-pinnacle-tarn', label: 'Glacier Tarn', kicker: 'Friday photo swap &middot; unmaintained spur',
  title: 'Pinnacle Glacier Tarn', status: 'Swap for the saddle', statusCls: 'alt',
  gallery: [
    ['google_tarn_01.jpg', `Alpenglow Mirror at the Tarn &middot; Alec Sills-Trausch &middot; ${G}`],
    ['google_tarn_05.jpg', `Last Light on the Glaciers &middot; Alec Sills-Trausch &middot; ${G}`],
    ['google_tarn_02.jpg', `Blue Hour Reflection &middot; Alec Sills-Trausch &middot; ${G}`],
    ['google_tarn_03.jpg', `Golden Light on the Approach &middot; Alec Sills-Trausch &middot; ${G}`],
    ['google_tarn_04.jpg', `Rainier from the Tarn Outlet &middot; Jim Thode &middot; ${G}`]
  ],
  facts: [
    ['Unofficial route', 'About 2.5 mi &middot; 1,100 ft<br>spur off the Pinnacle Peak Trail'],
    ['Difficulty + time', 'Hard &middot; 2&ndash;2.5 hr<br>faint tread, brush, loose-rock scramble'],
    ['Where it leaves', 'At the creek 0.5&ndash;0.6 mi up<br>unsigned path on the left, in brush'],
    ['Best light', 'Gold 6:40&ndash;7:40 &middot; sunset 7:42<br>faces north at Rainier; needs still air']
  ],
  whyHead: 'Why it is a swap, not a detour',
  why: 'This is the reflection frame that circulates as &ldquo;Mount Rainier from Pinnacle Saddle&rdquo; &mdash; but the tarn is not on the way to the saddle and is not reached from it. It leaves the maintained trail low, climbs into a separate cirque under the Pinnacle Glacier, and is its own 2.5-mile, 1,100-foot outing. Doing both on arrival afternoon is roughly 4 miles and 1,600 feet after a cross-country flight, so treat it as an either/or: take the tarn when the summit is out and the air is dead calm, take the saddle otherwise.',
  reviews: [
    'It is not an NPS trail. It carries no sign, no maintenance, and no row on the trail-status report, so nothing official will tell you its condition &mdash; the Pinnacle Peak Trail listing covers only the maintained tread to the saddle.',
    'The turnoff is easy to walk past: about 0.5&ndash;0.6 mile up, right after the trail crosses a small creek that is often dry by September, a faint path breaks left into the brush. The next half mile is narrow and overgrown, then opens onto a worn route through a rocky slope where the footing is loose.',
    'The tarn is seasonal. Its north-facing shade means it melts out late &mdash; typically not before mid-July, fully thawed by late August &mdash; and then shrinks all season; an October report found it nearly gone. Late August into September is the window, but water is never guaranteed and a windy evening kills the mirror even when it is full.',
    'The reflection wants the calm, warm end of the day, which puts the descent of an unmaintained brushy scramble at or after dark. Carry headlamps, and do not commit to sunset unless the whole group is fine walking that route down in the dark and reaching the Packwood cabin around 9:30 PM.'
  ],
  links: [
    ['AllTrails Pinnacle Glacier POI', 'https://www.alltrails.com/poi/us/washington/ashford/pinnacle-glacier'],
    ['Route write-up + photos', 'https://explorewithalec.com/pinnacle-glacier-tarn/'],
    ['NPS Pinnacle Peak Trail (the maintained part)', 'https://www.nps.gov/mora/planyourvisit/pinacle-peak.htm'],
    ['Live trail conditions', 'https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],
    ['NPS fire closures', 'https://www.nps.gov/mora/learn/news/fire.htm'],
    ['Cabin &rarr; Reflection Lakes trailhead', 'https://www.google.com/maps/dir/?api=1&amp;origin=46.6505,-121.63574&amp;destination=46.7683,-121.7314']
  ]
});

const cometCard = tgTrail({
  id: 'tg-comet', label: 'Comet Falls', kicker: 'Weather fallback &middot; Lower cloud-day anchor',
  title: 'Comet Falls + Van Trump Park', status: 'Sunday fallback',
  gallery: [
    ['google_comet_falls_01.jpg', `Comet Falls Blue and Green &middot; Robert Cross &middot; ${G}`],
    ['google_comet_falls_02.jpg', `Beneath the Beauty &middot; Rich Border &middot; ${G}`],
    ['google_mildred_point_02.jpg', `Kautz Glacier from Mildred Point &middot; Brian Haagen &middot; ${G}`],
    ['google_christine_falls_02.jpg', `Time Flows Like a River &middot; Phil Kuntz &middot; ${G}`],
    ['google_christine_falls_01.jpg', `Christine Falls &middot; Phil Kuntz &middot; ${G}`]
  ],
  facts: [
    ['Official route', '3.8 mi / 900 ft to the falls<br>5.8 mi / 2,000 ft with Van Trump'],
    ['Difficulty + time', 'Strenuous &middot; 4&ndash;5 hr<br>steady climb, wet rock near the falls'],
    ['From Airbnb pin', '41.6 mi &middot; router: 1:23<br>plan 1:30&ndash;1:45'],
    ['Best light', 'In the lot by 6:45 AM<br>sunrise 6:32 &middot; falls shade all morning']
  ],
  whyHead: 'Why this survives as the clouded-mountain fallback',
  why: 'It delivers a single overwhelming set piece without depending on a clear summit: a 320-foot waterfall you approach from below, then an optional hanging meadow beneath the Kautz and Van Trump Glaciers. Use it instead of Skyline only when the Paradise webcam is socked in and the lower trail remains safe; Christine Falls is a two-minute roadside stop on the approach.',
  reviews: [
    'The trailhead lot holds roughly sixteen cars with no overflow and no shoulder parking. This is the binary constraint on the whole day.',
    'Spray keeps the rock near the falls slick well into the morning. Reviewers consistently recommend poles and real tread for the last approach.',
    'Most parties stop at the falls. The extra 2 miles to Van Trump Park is where the glacier views and meadow open up, and it thins out sharply.',
    'Mildred Point adds another 0.8 mile and 850 feet beyond Van Trump. It is deliberately left off this itinerary to protect Monday and the Seattle handoff.'
  ],
  links: [
    ['NPS Comet Falls / Van Trump', 'https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm'],
    ['WTA Comet Falls route', 'https://www.wta.org/go-hiking/hikes/comet-falls'],
    ['WTA Van Trump Park route', 'https://www.wta.org/go-hiking/hikes/van-trump-park'],
    ['AllTrails reviews', 'https://www.alltrails.com/trail/us/washington/comet-falls-via-van-trump-trail'],
    ['Live trail conditions', 'https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],
    ['NPS Rampart Ridge fallback', 'https://www.nps.gov/mora/planyourvisit/rampart-ridge-trail.htm'],
    ['Cabin &rarr; trailhead', 'https://www.google.com/maps/dir/?api=1&amp;origin=46.6505,-121.63574&amp;destination=46.7791,-121.7806']
  ]
});

const eagleCard = tgTrail({
  id: 'tg-eagle', label: 'Eagle Peak', kicker: 'Opt-in only &middot; the steep Tatoosh option',
  title: 'Eagle Peak Saddle', status: 'Group opt-in', statusCls: 'alt',
  gallery: [
    ['google_eagle_peak_01.jpg', `The Playground (Tatoosh from Eagle Peak) &middot; Rich Border &middot; ${G}`],
    ['google_eagle_peak_02.jpg', `Life in the Clouds &middot; Rich Border &middot; ${G}`],
    ['google_eagle_peak_03.jpg', `Fog Below the Saddle &middot; T. Kirkendall and V. Spring &middot; ${G}`],
    ['google_eagle_peak_04.jpg', `The Final Meadow Climb &middot; T. Kirkendall and V. Spring &middot; ${G}`],
    ['google_eagle_peak_05.jpg', `Rainier from Eagle Peak Saddle &middot; T. Kirkendall and V. Spring &middot; ${G}`]
  ],
  facts: [
    ['Official route', '7.2 mi &middot; 2,955 ft gain<br>maintained to the saddle only'],
    ['Difficulty + time', 'Very strenuous &middot; about 5 hr<br>relentless forested climb'],
    ['From Airbnb pin', '~36 mi to Longmire &middot; router: 1:23<br>plan 1:25&ndash;1:45'],
    ['Best light', 'Early start &middot; saddle by late morning<br>south-facing views all day']
  ],
  whyHead: 'When to take it instead of Comet',
  why: 'Eagle Peak is the west end of the Tatoosh and a far bigger day than Pinnacle: nearly triple the gain of the saddle hike and almost a thousand feet more climbing than Comet Falls. Take it only as a deliberate group choice for a hard Sunday &mdash; it is not the fallback when the Comet lot is full.',
  reviews: [
    'Park at the Longmire Community Building and cross the Nisqually suspension bridge; the trail sign is easy to miss from the main lot.',
    'The climb is almost entirely in forest with no view payoff until the saddle, which reviewers repeatedly warn is demoralising if you expect a scenic build-up.',
    'Stop at the maintained saddle. The summit scramble beyond it is loose, exposed class 3 and is not part of the NPS trail.',
    'Because it is south-facing and steep, it is the hottest option in the guide on a warm afternoon. Carry more water than the mileage suggests.'
  ],
  links: [
    ['NPS Eagle Peak brochure', 'https://www.nps.gov/mora/planyourvisit/upload/Eagle-Peak-Trail-Dec18.pdf'],
    ['WTA route + trip reports', 'https://www.wta.org/go-hiking/hikes/eagle-peak-saddle'],
    ['AllTrails reviews', 'https://www.alltrails.com/trail/us/washington/eagle-peak-trail'],
    ['Live trail conditions', 'https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],
    ['Cabin &rarr; Longmire', 'https://www.google.com/maps/dir/?api=1&amp;origin=46.6505,-121.63574&amp;destination=46.7497,-121.8128']
  ]
});

const shrinerCard = tgTrail({
  id: 'tg-shriner', label: 'Shriner Peak', kicker: 'Best open lookout &middot; strenuous full-day swap',
  title: 'Shriner Peak Fire Lookout', status: 'Major-hike alternate', statusCls: 'alt',
  gallery: [
    ['google_shriner_peak_01.jpg', `Balcony Above Rainier &middot; T. Kirkendall and V. Spring &middot; ${G}`],
    ['google_shriner_peak_02.jpg', `Trail from the Lookout &middot; T. Kirkendall and V. Spring &middot; ${G}`],
    ['google_shriner_peak_03.jpg', `Shriner Peak Lookout &middot; T. Kirkendall and V. Spring &middot; ${G}`],
    ['google_shriner_peak_04.jpg', `Sunrise Above the Clouds &middot; WTA hiker report &middot; ${G}`],
    ['google_shriner_peak_05.jpg', `Rainier from Shriner Peak &middot; Hiking Tahoma &middot; ${G}`]
  ],
  facts: [
    ['Official route', '8 mi &middot; 3,434 ft gain<br>out and back to the lookout'],
    ['Difficulty + time', 'Strenuous &middot; about 5 hr<br>steep, exposed and waterless'],
    ['Access', 'SR 123 trailhead<br>3.5 mi north of Stevens Canyon Entrance'],
    ['Use it when', 'Paradise is the problem<br>but SR 123 is open and air is clear']
  ],
  whyHead: 'Why it makes the absolute-best list',
  why: 'This is the strongest still-accessible fire-lookout hike near the paid Packwood base: commanding views of Rainier, the Ohanapecosh Valley, and the Cascades without using Sunrise or White River Road. It is substantially harder than Skyline or Comet, so it is a chosen objective rather than a casual fallback.',
  reviews: [
    'NPS lists the trail in the open southeast group and the road-status page lists SR 123 open.',
    'There is no water on the route and much of the climb is shadeless; start early and carry the entire day&rsquo;s supply.',
    'The nearby Backbone Fire can put smoke along SR 123 and US 12. Clear trail status does not override the morning air and visibility gate.'
  ],
  links: [
    ['NPS Shriner Peak', 'https://www.nps.gov/mora/planyourvisit/shriner-peak.htm'],
    ['WTA route + trip reports', 'https://www.wta.org/go-hiking/hikes/shriner-peak'],
    ['AllTrails reviews', 'https://www.alltrails.com/trail/us/washington/shriner-peak-lookout-trail'],
    ['Live trail conditions', 'https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],
    ['NPS road status', 'https://www.nps.gov/mora/planyourvisit/road-status.htm'],
    ['Cabin &rarr; trailhead', 'https://www.google.com/maps/dir/?api=1&amp;origin=46.6505,-121.63574&amp;destination=46.8018,-121.5551']
  ]
});

const rampartCard = tgTrail({
  id: 'tg-rampart', label: 'Rampart Ridge', kicker: 'Best dependable Plan B &middot; lower Longmire loop',
  title: 'Rampart Ridge Loop', status: 'Default fallback', statusCls: 'alt',
  gallery: [
    ['google_rampart_ridge_01.jpg', `Rainier Along Rampart Ridge &middot; NPS / E. Brouwer &middot; ${G}`],
    ['google_rampart_ridge_02.jpg', `Mountain Through the Firs &middot; Brittany Burnett &middot; ${G}`],
    ['google_rampart_ridge_03.jpg', `Tumtum Peak and Nisqually Valley &middot; NPS / S. Redman &middot; ${G}`],
    ['google_rampart_ridge_04.jpg', `Rainier from the Ridge &middot; NPS &middot; ${G}`],
    ['google_rampart_ridge_05.jpg', `Longmire Forest Light &middot; Rebecca Latson &middot; ${G}`]
  ],
  facts: [
    ['Official route', '4.6 mi &middot; 1,339 ft gain<br>clockwise loop from Longmire'],
    ['Difficulty + time', 'Moderate &middot; about 2.5 hr<br>steep opening, easier ridge'],
    ['Access', 'Longmire trailhead<br>large-area parking options'],
    ['Use it when', 'Comet lot is full<br>or high country is windy / hazy']
  ],
  whyHead: 'Why this is the operationally best fallback',
  why: 'It is not as cinematic as Eagle or Shriner, but it solves the failures most likely to happen in real life: a sixteen-space Comet lot, a clouded summit, or high-ridge wind. The old-growth loop still reaches two Rainier and Nisqually Valley viewpoints and starts from the open Longmire corridor.',
  reviews: [
    'NPS recommends clockwise travel to keep Rainier in front more often.',
    'The first climb is legitimately steep; &ldquo;lower elevation&rdquo; does not mean flat.',
    'The current trail report lists Rampart Ridge snow-free and does not place it inside the wildfire closure.'
  ],
  links: [
    ['NPS Rampart Ridge', 'https://www.nps.gov/mora/planyourvisit/rampart-ridge-trail.htm'],
    ['WTA route + trip reports', 'https://www.wta.org/go-hiking/hikes/rampart-ridge-loop'],
    ['AllTrails reviews', 'https://www.alltrails.com/trail/us/washington/rampart-ridge-loop'],
    ['Live trail conditions', 'https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],
    ['Cabin &rarr; Longmire', 'https://www.google.com/maps/dir/?api=1&amp;origin=46.6505,-121.63574&amp;destination=46.7497,-121.8106']
  ]
});

const lakesCard = tgTrail({
  id: 'tg-lakes-faraway', label: 'Lakes Trail', kicker: 'Best late-arrival save &middot; Reflection Lakes',
  title: 'Lakes Trail + Faraway Rock', status: 'Friday Plan B', statusCls: 'alt',
  gallery: [
    ['google_lakes_faraway_01.jpg', `Twilight at Reflection Lakes &middot; Firefall Photography &middot; ${G}`],
    ['google_lakes_faraway_02.jpg', `The Perfect Mirror &middot; Rebecca Latson &middot; ${G}`],
    ['google_lakes_faraway_03.jpg', `Golden Forest Reflection &middot; NW Adventure Rentals &middot; ${G}`],
    ['google_lakes_faraway_04.jpg', `Storm Light on Rainier &middot; Craig Goodwin &middot; ${G}`],
    ['google_lakes_faraway_05.jpg', `Quiet Water at Reflection Lakes &middot; The National Parks Experience &middot; ${G}`]
  ],
  facts: [
    ['Official route', 'About 3 mi loop<br>Reflection Lakes to Faraway Rock'],
    ['Difficulty + time', 'Moderate &middot; 1.5&ndash;2 hr<br>roots, rocks and steep east side'],
    ['Access', 'Reflection Lakes pullouts<br>open Stevens Canyon Road'],
    ['Use it when', 'Arrival is too late for the saddle<br>but there is still safe daylight']
  ],
  whyHead: 'Why it is better than forcing the primary',
  why: 'It preserves the two arrival-day payoffs that matter &mdash; a Rainier reflection and a high look into Stevens Canyon &mdash; from the same Reflection Lakes parking the Pinnacle hike uses. It can also be shortened to the shoreline if the flight or holiday traffic removes the hiking window.',
  reviews: [
    'NPS describes the route as an approximately three-mile loop from the Reflection Lakes parking areas.',
    'Faraway Rock overlooks Louise Lake, Stevens Canyon, the Tatoosh Range, and Reflection Lakes.',
    'Stay on trail around the lakes; the meadows are closed to off-trail travel even when the shoreline looks accessible.'
  ],
  links: [
    ['NPS Reflection Lakes + Lakes Trail', 'https://www.nps.gov/places/reflection-lakes.htm'],
    ['WTA Faraway Rock route', 'https://www.wta.org/go-hiking/hikes/faraway-rock'],
    ['WTA full Lakes Trail loop', 'https://www.wta.org/go-hiking/hikes/reflection-lakes'],
    ['AllTrails reviews', 'https://www.alltrails.com/trail/us/washington/faraway-rock-via-skyline-and-mazama-ridge-trail'],
    ['Live trail conditions', 'https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],
    ['Cabin &rarr; Reflection Lakes', 'https://www.google.com/maps/dir/?api=1&amp;origin=46.6505,-121.63574&amp;destination=46.7689,-121.7240']
  ]
});

const silverCard = tgTrail({
  id: 'tg-silver-falls', label: 'Silver Falls', kicker: 'Best smoke / cloud fallback &middot; low forest',
  title: 'Silver Falls from Grove Parking', status: 'Weather fallback', statusCls: 'alt',
  gallery: [
    ['google_silver_falls_01.jpg', `Turquoise Water at Silver Falls &middot; WTA hiker report &middot; ${G}`],
    ['google_silver_falls_02.jpg', `Falls Beneath the Old Growth &middot; Anna Roth / WTA &middot; ${G}`],
    ['google_silver_falls_03.jpg', `Ohanapecosh River Trail &middot; Earth Trekkers &middot; ${G}`],
    ['google_silver_falls_04.jpg', `Silver Falls in the Forest &middot; Ordinary Adventures &middot; ${G}`],
    ['google_silver_falls_05.jpg', `Spring Flow at Silver Falls &middot; NPS / K. Loving &middot; ${G}`]
  ],
  facts: [
    ['Official route', '2 mi &middot; 300 ft gain<br>out and back during campground closure'],
    ['Difficulty + time', 'Moderate &middot; about 1 hr<br>old growth + 60-foot falls'],
    ['Access', 'Grove parking remains open<br>cross to signed Eastside Trail'],
    ['Use it when', 'Mountain views are gone<br>but south-side air and roads remain safe']
  ],
  whyHead: 'Why the closure does not eliminate it',
  why: 'The Grove of the Patriarchs island is closed, but NPS explicitly states that its parking lot, restrooms, Eastside Trail, and Silver Falls access remain open. This is the useful low-elevation alternative when smoke or cloud destroys the value of a view-first hike.',
  reviews: [
    'Do not follow the closed Ohanapecosh Campground connection or attempt to enter the closed grove.',
    'From Grove parking, cross Stevens Canyon Road to the Eastside Trail and follow the signed out-and-back to the falls.',
    'The current NPS trail report lists the trail open with the campground-routing caveat.'
  ],
  links: [
    ['NPS current Grove trailhead access', 'https://www.nps.gov/places/grove-of-the-patriarchs-trailhead.htm'],
    ['NPS Silver Falls', 'https://www.nps.gov/places/silver-falls.htm'],
    ['WTA route + current caveat', 'https://www.wta.org/go-hiking/hikes/silver-falls-loop'],
    ['AllTrails reviews', 'https://www.alltrails.com/trail/us/washington/silver-falls-loop-trail'],
    ['Live trail conditions', 'https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],
    ['Cabin &rarr; Grove parking', 'https://www.google.com/maps/dir/?api=1&amp;origin=46.6505,-121.63574&amp;destination=46.7330,-121.5693']
  ]
});

// Restore the 50KB baseline field guide, drop trails still behind closures
// (Pinnacle Saddle returned when the Plummer Peak closure lifted Aug. 27), and
// add the scheduled hikes plus the strongest closure-compatible alternatives.
let trailGuide = sectionFromBaseline('trail-guide');
trailGuide = dropArticles(trailGuide, 'tg-trail', [
  'First + Second Burroughs', 'Mount Fremont Lookout',
  'Dege Peak', 'Emmons Moraine', 'Silver Forest + Emmons Vista',
  'High Rock Lookout'
]);
trailGuide = edit(trailGuide, [
  ['<h2>Ten view-first hikes worth knowing</h2>', '<h2>Twelve closure-compatible routes worth knowing</h2>'],
  ['Every featured trail includes ten portfolio-grade photographs; tap any image to open its source.',
   'Five trails behind the Sunrise and White River closures were removed; High Rock was also removed because its official 2026 access information is not current enough to trust for a sunset descent. Pinnacle Saddle returned when the Plummer Peak closure lifted Aug. 27, and the Pinnacle Glacier Tarn is documented as the one unmaintained route in the guide. Tap any image to open its source.'],
  ['<h3>Open the full trail field guide</h3><p>Ten recommendations &middot; 50 trail-specific photos &middot; review intel &middot; cabin-to-trailhead drives</p>',
   '<h3>Open the full trail field guide</h3><p>Twelve closure-compatible routes &middot; 60 trail-specific photos &middot; official access gates &middot; cabin-to-trailhead logic</p>'],
  ['<div><b>How to read the ten</b><span>Fremont, Skyline, and Pinnacle are scheduled. Burroughs and Naches remain strong view-first alternates, followed by easier, shorter, and weather-flex options for the same trailheads.</span></div>',
   '<div><b>How to read the twelve</b><span>Pinnacle, Skyline, Comet and Naches are scheduled; the Pinnacle Glacier Tarn is the photo-first Friday swap and Bench &amp; Snow is the maintained fallback. Lakes/Faraway, Deadhorse/Moraine, Rampart and Silver Falls solve time, weather, smoke and parking failures. Eagle and Shriner are the two legitimate hard-day upgrades. High Rock is omitted until the Forest Service publishes current access. Only the tarn is unmaintained &mdash; everything else is an official NPS trail.</span></div>'],
  ['<h4>Why this makes the trip</h4><p>This is the cleanest answer to',
   '<h4>Why this makes the trip</h4><p>Reopened Aug. 27 after the Plummer Peak Fire closure lifted &mdash; recheck the trail report the same morning. This is the cleanest answer to'],
  ['Check the Paradise webcam before committing to the drive.',
   `Check the ${camLink('live Paradise Mountain webcam')} before committing to the drive.`],
  ['<article class="tg-trail" id="tg-pinnacle">', `${cometCard}<article class="tg-trail" id="tg-pinnacle">`],
  ['<article class="tg-trail" id="tg-naches">', `${tarnCard}${benchSnowCard}<article class="tg-trail" id="tg-naches">`],
  ['<span class="tg-status alt">Only if Fremont cancels</span>', '<span class="tg-status alt">Optional Monday farewell</span>'],
  ['<h4>When it comes back</h4><p>Restore the loop only if Fremont is canceled or ends early enough to protect sleep.',
   '<h4>When it comes back</h4><p>Hike it only if Monday&rsquo;s east-side air, visibility, and traffic all pass the morning gate.'],
  ['<span class="tg-status">Scheduled Saturday</span>', '<span class="tg-status">Scheduled Saturday sunset</span>'],
  ['7:15 AM&ndash;12:15 PM<br>best mountain light before 10', '2:15&ndash;8:15 PM Saturday<br>golden hour + 7:37 sunset'],
  ['3:15&ndash;5:45 PM Friday<br>warm side light on Rainier', '4:30&ndash;8:10 PM Friday<br>golden hour + 7:39 sunset'],
  ['<span class="tg-status alt">Optional Monday farewell</span>', '<span class="tg-status">Scheduled Sunday sunset</span>'],
  ['Hike it only if Monday&rsquo;s east-side air, visibility, and traffic all pass the morning gate.', 'Sunday&rsquo;s clockwise sunset loop is protected; hike it only if east-side air, visibility, trail status, and energy all pass the 3:30 PM gate.'],
  ['<article class="tg-trail" id="tg-deadhorse">', `${eagleCard}${shrinerCard}${rampartCard}${lakesCard}${silverCard}<article class="tg-trail" id="tg-deadhorse">`],
  ['Tolmie Peak is inaccessible during the 2026 Carbon River / Mowich closure. Sunrise Rim is already the preferred Burroughs ascent, while Alta Vista and Nisqually Vista substantially overlap the Paradise plan. Bench and Snow Lakes are pretty but deliver less direct Rainier impact; Comet and Silver Falls are waterfall-first; Summerland, Panhandle Gap, Shriner Peak, and Third Burroughs exceed the requested mileage or the safe schedule.',
   'Tolmie Peak and Spray Park are inaccessible during the 2026 Carbon River / Mowich closure. Summerland begins on closed White River Road, so an apparently open trail segment is not actionable. Crystal Lakes, Crystal Peak, Palisades and the White River approach to Owyhigh stay too close to the northeast fire/access picture; Owyhigh from SR 123 is technically possible but is nearly ten miles round trip from that side and has no Rainier view. Panhandle Gap and Third Burroughs are also excluded by closure or schedule. Shriner, Rampart, Lakes/Faraway and the still-open Silver Falls approach are now included because each solves a distinct failure without moving the paid Packwood base.']
]);
trailGuide = trailGuide.replace(
  /(<article class="tg-trail" id="[^"]+">[\s\S]*?<h3>)([^<]+)(<\/h3>)/g,
  (_, before, title, after) => `${before}${title}${after}${discoveryLinks(title, 'explore trail-discovery')}`
);

/* ----------------------------------------------------------- photo guide */

let photoGuide = sectionFromBaseline('photo-guide');
photoGuide = dropArticles(photoGuide, 'pg-spot', ['Mount Fremont Lookout & Sunrise', 'First + Second Burroughs']);
photoGuide = photoGuide.replace(
  /<div class="pg-gallery" data-gallery><button[^>]+google_c4b_1\.jpg[\s\S]*?<\/div>/,
  pgGuideGallery('Seattle city itinerary', [
    ['google_seattle_guide_pike_sign_01.jpg', `Public Market Center &middot; Kay &middot; ${G}`],
    ['google_seattle_guide_fish_counter_01.jpg', `Fish Counter Theater &middot; dr.&#333;zda &middot; ${G}`],
    ['google_seattle_guide_overlook_walk_01.jpg', `Overlook Walk to Elliott Bay &middot; Engineering News-Record &middot; ${G}`],
    ['google_seattle_guide_nest_patio_01.jpg', `The Nest Rooftop Patio &middot; Chris &amp; Sara &middot; ${G}`],
    ['google_seattle_guide_pike_sunset_01.jpg', `Market Sign at Sunset &middot; Katie Killian &middot; ${G}`]
  ])
);
photoGuide = edit(photoGuide, [
  ['<p>One night in the city. Everything hinges on blue hour at Kerry Park; the market and waterfront are the all-weather fallback.</p>',
   '<p>One night in the city, photographed as the itinerary actually unfolds: Pike Place and the waterfront in the afternoon, then a Discovery Park hike through sunset at West Point.</p>'],
  ['<p class="pg-tag">The skyline frame</p>', '<p class="pg-tag">The city sequence</p>'],
  ['<h3>Kerry Park &amp; Pike Place</h3>', '<h3>Pike Place to Discovery Park</h3>'],
  ['<h3>The exact light plan &mdash; Fremont sunset &amp; Seattle blue hour</h3>', '<h3>The exact light plan &mdash; three sunrises + four sunsets</h3>'],
  ['<p>Rainier makes its own weather, so the whole plan flexes on whether the summit is out. Protect Mount Fremont for Sunday golden hour and sunset, keep Pinnacle/Skyline as clear-mountain priorities, and treat Tipsoo as a quick Monday bonus. Reflection Lakes remains in this photo reference only; it is no longer worth a dedicated dawn alarm.</p>',
   '<p>The latest weather shifts the marquee route rather than gambling it: Friday defaults low at Reflection Lakes because thunderstorms overlap the Pinnacle start; Saturday protects Reflection / Faraway Rock at sunrise, sleeps through the rain-likely middle, and returns only for a short Paradise meadow sunset; Sunday puts Skyline in the weekend&rsquo;s clearest 6&ndash;10 AM window before the Naches sunset; and Monday keeps the short Tipsoo sunrise before Discovery Park.</p>'],
  ['<div class="pg-warning"><b>Cloud inversion reality check:</b> the orange sea-of-clouds image is a rare weather payoff, not a schedulable event. Your best odds are to be high while a low marine layer fills the valleys, with the summit and trail above cloud. Check the Paradise/Sunrise webcams, hourly cloud-base forecast, wind, and smoke before committing. Roads and high-country access can still change on short notice.</div>',
   `<div class="pg-warning"><b>Latest forecast hierarchy &middot; fetched Sept. 3:</b> use the NWS trail-corridor point and hourly forecasts as the operating source because they are official, elevation-specific and the freshest set reviewed. ECMWF, GFS and ICON are a confidence check: they agree Friday afternoon is wet, Saturday dawn beats Saturday afternoon, and Sunday dawn is the weekend precipitation minimum; they disagree materially on cloud cover, especially Monday. The ${camLink('live Paradise Mountain webcam')}, radar, AirNow smoke map and NPS road/fire pages make the final departure call.</div>`],
  ['<li>Two headlamps with red mode, microfiber cloths, and warm layers for the Fremont sunset walk-out.</li>',
   '<li>Two tested headlamps per person with spare batteries, red mode, microfiber cloths, and a fast lens cloth for spray at Comet Falls. Every planned sunset ends at or after dusk.</li>'],
  ['<p>On your dates, Rainier sunrise shifts from 6:30 to 6:34 AM and sunset from 7:40 to 7:34 PM. Sunday evening is reserved for Mount Fremont; the other dawn times are reference only, not scheduled alarms.</p>',
   '<p>Saturday sunrise is 6:31 AM, Sunday sunrise is about 6:32 AM and Monday sunrise is 6:34 AM; sunset is 7:39 Friday, 7:37 Saturday and 7:35 Sunday around Rainier, then 7:37 Monday in Seattle. Saturday, Sunday and Monday are alarm mornings. Sunday now carries the full Skyline loop because its early hours are the clearest forecast window.</p>'],
  ['<p class="pg-tag">Optional reference &middot; not scheduled</p>', '<p class="pg-tag">Friday &middot; arrival-day shoot + fallback</p>'],
  ['<p><b>Not scheduled.</b> Sunrise remains the best photographic window, but Skyline parking margin, sleep, and Fremont matter more on this trip. The card stays here only as an optional weather-and-timing reference.</p>',
   '<p><b>Friday 5:15&ndash;8:10 PM:</b> use Reflection Lakes / lower Lakes Trail after thunder clears; Pinnacle remains a go-only-if-dry upside route. <b>Saturday 6:00&ndash;7:50 AM:</b> Faraway Rock from Reflection Lakes through the 6:31 sunrise; return to the cabin and recover through the wet middle. <b>Saturday 6:00&ndash;8:10 PM:</b> short Nisqually Vista / Myrtle Falls / Alta Vista sunset circuit only if the evening improvement verifies. <b>Sunday 6:00&ndash;11:30 AM:</b> clockwise Skyline inside the 5% early precipitation window. <b>Sunday 6:00&ndash;8:15 PM:</b> clockwise Naches for the Rainier-facing last light. <b>Monday 6:05&ndash;7:20 AM:</b> easy Tipsoo sunrise circuit before driving directly to Seattle. <b>Monday 5:30&ndash;8:20 PM:</b> Discovery Park and West Point sunset.</p>']
]);


// The family kept the W Seattle and released the 1400 Hubbell Place Airbnb hold, so the
// Seattle night is now a single booking rather than two competing ones.
let stays = sectionFromBaseline('stays');
stays = dropArticles(stays, 'stay', ['Quiet condo near the convention center']);
stays = edit(stays, [
  ['plus the two options held for the one Seattle night. Tap a map pin for the location; the <b>View listing</b> buttons open the public Airbnb listings. Airbnb cards use the public listing images.',
   'plus the W Seattle for the one Seattle night. Tap a map pin for the location; the <b>View listing</b> button opens the public Airbnb listing for the cabin, which uses the listing\u2019s own images.'],
  ['<span class="stay-area opt">Seattle &middot; Option B (Hotel)</span>', '<span class="stay-area">Seattle &middot; Downtown hotel</span>'],
  ['<p class="stay-note"><b>One Seattle night, two holds:</b> both the convention-center condo and the W Seattle are currently in Tripsy for Mon Sep 7 &rarr; Tue Sep 8. Pick one before the trip to avoid paying for two.</p>',
   '<p class="stay-note"><b>One Seattle night, one booking:</b> the W Seattle is the confirmed Mon Sep 7 &rarr; Tue Sep 8 stay. The 1400 Hubbell Place Airbnb hold has been released, so there is no second reservation to cancel.</p>']
]);

/* ------------------------------------------------- restored text sections */

let savedIdeas = sectionFromBaseline('saved-ideas');
savedIdeas = edit(savedIdeas, [
  ['<h3>Pinnacle Saddle</h3><p>Yes.', '<h3>Pinnacle Saddle</h3><p>Yes &mdash; and it just reopened (Aug. 27) after the Plummer Peak Fire closure lifted.'],
  ['<p>Worth doing on a clear day, but not ahead of Burroughs.', '<p>Worth doing on a clear day, but not ahead of Comet Falls and Van Trump Park.'],
  ['its Elbe excursion block conflicts with Pinnacle, Skyline, or Burroughs.', 'its Elbe excursion block conflicts with Pinnacle, Skyline, or Comet Falls.']
]);

// Trip-week weather refresh fetched Sept. 3: NWS point/hourly forecasts are the
// operating source; ECMWF, GFS, and ICON runs via Open-Meteo are cross-checks.
// The models converge on Friday PM wet, Saturday dawn drier than Saturday PM,
// and Sunday dawn as the weekend precipitation minimum. Cloud cover diverges.
let packing = sectionFromBaseline('packing');
packing = edit(packing, [
  ['a cold post-sunset walk above 7,000 feet.', 'four consecutive sunset walk-outs plus a cold, spray-soaked morning at the base of a waterfall.'],
  ['Rain and wet cold are possible in any month.',
   `Rain and wet cold are possible in any month. <b>Trip-week forecast &middot; refreshed Sept. 3:</b> NWS is the operating source. Friday&rsquo;s 3&ndash;4 PM Paradise window now has likely showers and thunderstorms near 63&ndash;65%; Saturday is near 14% at dawn, 59% from 11 AM&ndash;4 PM, then 24% during sunset; Sunday is near 5% from 6&ndash;10 AM before rising to 37%; Monday&rsquo;s Tipsoo dawn is near 11% and Discovery sunset near 3%. ECMWF, GFS and ICON support the Friday/Saturday/Sunday timing pattern but disagree on cloud cover. The ${camLink('live Paradise Mountain webcam')}, radar and current NPS status make every departure decision.`],
  ['Pinnacle 3:15&ndash;5:45 PM: 48&ndash;58&deg;F', 'Pinnacle 3:15&ndash;6:30 PM: 42&ndash;55&deg;F'],
  ['<b>Pinnacle:</b> hiking pants, breathable base, fleece in the pack, and shell immediately available; the saddle is windy even when the trailhead feels pleasant.',
   `<b>Pinnacle:</b> hiking pants, breathable base, fleece in the pack, and the waterproof shell worn or on top of the pack &mdash; Friday&rsquo;s forecast is light rain likely, and wet rock slows the upper switchbacks; the saddle is windy even when the trailhead feels pleasant. Glance at the ${camLink('Tatoosh webcam', CAM_TATOOSH)} before leaving Seattle &mdash; it looks south from Paradise straight at the range you are climbing into.`],
  ['keep the shell accessible for cloud, wind, or drizzle.',
   `for Saturday dawn, start fully layered and carry a warm drink; change out of anything damp before the recovery block. Repack the insulated jacket, waterproof shell, hat and gloves for the short Saturday evening. Sunday Skyline starts near 40&deg;F and may meet showers late in the descent, so carry the same full kit and check the ${camLink('Paradise Mountain webcam')} at 4:00 AM before leaving.`],
  ['Microspikes are a trip-week conditions decision, not a default September requirement.',
   `Microspikes are a trip-week conditions decision &mdash; and this trip week opens with a Thursday rain-and-snow event at Paradise elevations, so make the call on the ${camLink('Friday-morning webcam')} and trail report, not on the September default.`],
  ['Sunrise starts at 6,400 feet and Fremont reaches an exposed ridge above 7,000 feet, so the sunset route needs substantially more insulation than Packwood suggests.',
   'Paradise sits at 5,400 feet and the Skyline high traverse crosses 6,800; after sunset, wind chill and a stopped photography pace need substantially more insulation than a mild Packwood afternoon suggests. Comet Falls also holds cold spray and shade all morning.'],
  ['<span class="pack-time">Sunday &middot; 3:45&ndash;9:15 PM</span><h4>Mount Fremont sunset</h4><span class="pack-temp">Expected air: 38&ndash;55&deg;F &middot; exposed wind after sunset can feel near 30&ndash;40&deg;F</span><p><b>Wear:</b> wicking base, hiking pants, and grippy trail footwear. <b>Carry even if Packwood is warm:</b> midweight fleece, hooded puffy, waterproof wind shell, warm hat, and real gloves. Put layers on <em>before</em> settling at the lookout. Each person carries a headlamp with spare power; add thin thermal bottoms if the trip-week forecast shows near-freezing temperatures or strong wind.</p>',
   '<span class="pack-time">Friday&ndash;Monday &middot; every evening</span><h4>Sunset hike kit</h4><span class="pack-temp">Expect a 20&ndash;30&deg;F perceived drop after stopping for photos and losing the sun</span><p><b>Each person carries:</b> a tested headlamp plus spare power, offline map, midweight fleece, hooded puffy, waterproof wind shell, warm hat, real gloves, water and a no-cook meal. Sunday also needs grippy footwear and poles for the long Skyline descent; pack the same traction-minded kit if cloud forces the wet Comet Falls fallback. Put layers on before waiting for color; never rely on one shared light.</p>'],
  ['The full alpine kit stays packed unless Fremont was canceled and Naches is deliberately restored.', 'The full alpine kit stays packed unless the Naches loop is deliberately hiked.'],
  ['<span class="pack-time">Saturday · 7:00 AM–12:15 PM</span><h4>Skyline</h4><span class="pack-temp">Expected air: 40–55°F · coldest above Panorama Point</span>',
    '<span class="pack-time">Saturday dawn/evening + Sunday 6:00–11:30 AM</span><h4>Reflection, Paradise + Skyline</h4><span class="pack-temp">Near 37–46°F Saturday; about 40–51°F Sunday morning</span>'],
  ['<span class="pack-time">Monday · after 8 AM</span><h4>Tipsoo pullout + Seattle</h4><span class="pack-temp">Expected roadside air: 45–55°F · no scheduled hike</span><p><b>Wear:</b> normal travel layers with a fleece or shell accessible for the brief high-elevation stop. The full alpine kit stays packed unless the Naches loop is deliberately hiked.</p>',
    '<span class="pack-time">Monday · dawn + 5:30–8:20 PM</span><h4>Tipsoo + Discovery Park</h4><span class="pack-temp">Cold subalpine dawn, then a breezy shoreline sunset</span><p><b>At dawn:</b> wear a warm base, fleece, shell, hat, gloves and grippy shoes; keep one headlamp per person until full daylight. Change into comfortable city layers after the hike. <b>At Discovery:</b> carry the fleece, wind/rain shell, warm hat, water, and both headlamps for the climb back from West Point.</p>']
]);

let foodGuide = sectionFromBaseline('food-guide');
foodGuide = edit(foodGuide, [
  ['a city dinner timed to land you at Kerry Park for blue hour, and a serious cocktail bar to close it.', 'a packed-food strategy for four late sunset finishes, a quick Seattle lunch, and a post-hike cocktail to close the trip.'],
  ['Pack lunches for park days &mdash; Paradise and Sunrise food lines eat your light.', 'Shop once at Fred Meyer Bethel Station on Friday, then pack lunches and late cold dinners &mdash; park food hours cannot support the sunset schedule.'],
  ['The best arrival-night landing in town: local beer, a big shared patio, and pizza/nachos reviewers rave about. Low-key after a travel day, and the outdoor tables catch evening light on the peaks.', 'A good Packwood option on Saturday or Sunday only. Friday&rsquo;s Pinnacle sunset returns too late to rely on a restaurant, so the planned cabin dinner comes from the grocery stop.']
]);

let insiderTips = sectionFromBaseline('insider-tips');
insiderTips = edit(insiderTips, [
  ['particularly relevant when moving between Packwood, Paradise, Tipsoo, and Sunrise.', 'particularly relevant this year, when the Sunrise and White River approaches are gated and a stale route may still send you at them.'],
  ['<div class="tip-tag">Pinnacle</div> <div><h3>The saddle is the destination</h3><p>Reels often continue onto Pinnacle or Plummer, but the maintained NPS trail ends at the saddle. The summit extensions cross loose, exposed terrain. The saddle already delivers the giant Rainier view and is the correct arrival-day endpoint.</p><p class="tip-cites"><span>Source:</span> <a href="https://www.nps.gov/mora/planyourvisit/pinacle-peak.htm" target="_blank" rel="noreferrer">NPS Pinnacle Peak Trail</a></p></div>',
   '<div class="tip-tag">Pinnacle</div> <div><h3>The saddle is the destination</h3><p>Reels often continue onto Pinnacle or Plummer, but the maintained NPS trail ends at the saddle. The summit extensions cross loose, exposed terrain &mdash; and this year the fire burned near Plummer Peak, so there is a second reason not to wander west. The saddle already delivers the giant Rainier view and is the correct arrival-day endpoint. The one deliberate exception is the Pinnacle Glacier Tarn, which branches <i>low and east</i> into the cirque under Pinnacle Peak, away from the burn; it is a separate unmaintained outing with its own card in the trail guide, not something to improvise from the saddle.</p><p class="tip-cites"><span>Source:</span> <a href="https://www.nps.gov/mora/planyourvisit/pinacle-peak.htm" target="_blank" rel="noreferrer">NPS Pinnacle Peak Trail</a></p></div></article><article class="insider-tip"><div class="tip-tag">Comet Falls</div> <div><h3>The parking lot is the whole plan</h3><p>Sixteen spaces, no overflow, and no legal shoulder. Leave Packwood by 5:15 AM to be in the lot around 6:45. If it is full, do not circle and do not park on the road &mdash; drive on to Longmire and hike Rampart Ridge. Eagle Peak is a deliberate opt-in for a hard day, not the consolation prize.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm" target="_blank" rel="noreferrer">NPS Comet Falls / Van Trump</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/rampart-ridge-trail.htm" target="_blank" rel="noreferrer">NPS Rampart Ridge</a></p></div>'],
  ['At Paradise, use the signed overflow at the Picnic Area or Paradise Valley Road, then choose between full Skyline, Myrtle Falls, Nisqually Vista, or Narada/Christine based on the mountain. At Sunrise, a full lot means metered entry at White River&mdash;not an improvised roadside park.',
   'At Paradise, use the signed overflow at the Picnic Area or Paradise Valley Road, then choose between full Skyline, Myrtle Falls, Nisqually Vista, or Narada/Christine based on the mountain. At Comet Falls there is no overflow at all, so the fallback is a different trailhead entirely.'],
  ['<div class="tip-tag">Day plan</div> <div><h3>Pack the Sunrise day like services might close early</h3><p>Bring the entire Fremont-day food and water supply from Packwood. Sunrise facilities are seasonal and the park explicitly tells visitors to bring supplies; the late-afternoon start is too important to gamble on a caf&eacute; queue or seasonal hours.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/hours.htm" target="_blank" rel="noreferrer">NPS operating hours</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/road-status.htm" target="_blank" rel="noreferrer">NPS road status</a></p></div>',
   '<div class="tip-tag">Day plan</div> <div><h3>Carry the whole Sunday supply from Packwood</h3><p>The 4:30 AM departure leaves no room for a caf&eacute; stop, and the Skyline morning flows into cabin recovery and a second trailhead at Tipsoo. Pack breakfast, a full trail meal, recovery food and the sunset snack Saturday night. If cloud redirects you to Comet Falls, that trailhead has no water, food or reliable toilet.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/hours.htm" target="_blank" rel="noreferrer">NPS operating hours</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/road-status.htm" target="_blank" rel="noreferrer">NPS road status</a></p></div>'],
  ['<div class="tip-tag">Sunrise</div> <div><h3>Use the late start, but do not trust late parking</h3><p>Fremont at sunset naturally avoids the busiest trail hours, yet the Sunrise lot can still be metered or full when you arrive. Check live conditions before leaving Packwood and keep enough schedule margin to wait at White River rather than improvising roadside parking.</p><p class="tip-cites"><span>Source:</span> <a href="https://www.nps.gov/mora/planyourvisit/congestion.htm" target="_blank" rel="noreferrer">NPS congestion guidance</a></p></div>',
   '<div class="tip-tag">Closures</div> <div><h3>Re-read the fire page every morning, not once</h3><p>A closure that does not affect your trail tonight can affect it tomorrow &mdash; and the boundary moves both ways: the Plummer Peak closure that took Pinnacle on Aug. 24 was lifted by Aug. 27. The alerts and trail-status pages were updated Aug. 31; the road table changes whenever road status changes. Trail apps lag all three &mdash; WTA still showed Pinnacle closed days after NPS cleared it. The NPS fire, trail, and road pages together are the authority at the trailhead.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/learn/news/fire.htm" target="_blank" rel="noreferrer">NPS wildland fire information</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm" target="_blank" rel="noreferrer">NPS trail status report</a></p></div>'],
  ['<div class="tip-tag">Fremont</div> <div><h3>Sunrise wins the mountain light; sunset wins the trip</h3><p>The lookout sits north-northeast of Rainier, so dawn illuminates the visible east-facing slopes most directly. From Packwood, however, sunrise demands a roughly 2 AM departure and a dark rocky approach. The scheduled sunset keeps the outbound hike in daylight and uses the lookout, sky, and layered northern Cascades as the evening composition.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/mount-fremont-lookout.htm" target="_blank" rel="noreferrer">NPS Fremont route</a> &middot; <a href="https://www.photohound.co/spot/mount-fremont-lookout-mount-rainier-1001015" target="_blank" rel="noreferrer">PhotoHound light guidance</a></p></div>',
   '<div class="tip-tag">Light</div> <div><h3>The south side trades sunset drama for morning stillness</h3><p>Losing Fremont costs the trip its one great sunset position. The compensation is that Reflection Lakes and Bench Lake mirror best in still air, and Comet Falls is a shade-and-spray subject that actually prefers an overcast or early-morning sky. Plan for calm water and soft light rather than a fiery ridge.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/paradise-basic-info.htm" target="_blank" rel="noreferrer">NPS Paradise area guide</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/bench-snow-lake-trail.htm" target="_blank" rel="noreferrer">NPS Bench &amp; Snow Lake Trail</a></p></div>'],
  ['<div class="tip-tag">Sunset</div> <div><h3>Check wind and cloud elevation, not just the forecast icon</h3><p>Fremont&rsquo;s final ridge is rocky and exposed. Use the Sunrise webcam, hourly cloud layers, smoke map, and ridge wind before committing. A blue weather icon is not enough if the mountain is capped or the ridge is dangerously windy; if visibility is poor, keep the hike low or turn around.</p>',
   `<div class="tip-tag">Air</div> <div><h3>Check smoke and cloud elevation, not just the forecast icon</h3><p>A blue weather icon says nothing about smoke. Use the ${camLink('Paradise Mountain webcam')} (the ${camLink('Tatoosh cam', CAM_TATOOSH)} covers the Pinnacle side), hourly cloud-base layers, and the AirNow fire and smoke map before committing to a high traverse. If the summit is capped or AQI is climbing, drop to Rampart Ridge, the Grove-free lower forest, or the lakes rather than pushing the ridge.</p>`]
]);

/* ------------------------------------------------------------------ days */

const daysRaw = [
  day({id:'day1',cls:'c1',badge:'Fri',date:'Sept. 4',title:'SEA &rarr; Pinnacle Saddle &rarr; Packwood',feel:'The original arrival hike, reopened the week before you land',facts:[['Land','SEA 10:25 AM'],['Drive','Budget pickup &rarr; Stevens Canyon entrance'],['Hike','2.5 mi / 1,050 ft / about 2 hr'],['Cabin','Packwood check-in after the hike']],note:'The original Friday plan is back: NPS cleared the Pinnacle Peak Trail row on Aug. 27 and the Aug. 31 alerts page no longer lists the Plummer Peak closure. Be hiking by roughly 4:30 PM. If you cannot, drop to Bench &amp; Snow Lakes, then to Reflection Lakes and the Lakes Trail to Faraway Rock, or just the shoreline and Box Canyon overlooks, then go to the cabin.',spot:'Pinnacle Peak Trail to the saddle',photos:arrivalPhotos,flow:'Pick up the rental, buy water and trail food, then drive US 12 to Packwood and in through the Stevens Canyon Entrance. Park at Reflection Lakes; the signed trailhead is across the road. Climb 1.25 miles to the maintained 5,920-ft saddle and stop there &mdash; the scramble routes toward Pinnacle and Plummer are not part of this itinerary. Continue to the Packwood cabin for night one.',reality:'Go only if Stevens Canyon Road, the trail, AQI, and daylight all pass. The trail reopened Aug. 27 after the Plummer Peak Fire closure lifted; re-read the NPS trail report that morning, because a boundary that moved twice in one week can move again. Loose rock and dropoffs near the saddle reward poles, and Friday&rsquo;s forecast leans wet (light rain likely, upper 40s at elevation) &mdash; a shell afternoon is fine, but thunder, a fully capped mountain, or slick-rock rain sends you to the lakes instead. A late flight or holiday traffic converts this to Bench &amp; Snow or the Reflection Lakes fallback.',cost:'No timed-entry reservation is required anywhere in Mount Rainier in 2026. Carry a valid park entrance pass; the park is cashless.',food:'Carry a substantial late lunch. Packwood Brewing Co. is the easy post-hike dinner only if current Friday hours fit.',map:'Pinnacle Peak Trailhead Mount Rainier',alts:[{title:'Pinnacle Glacier Tarn',href:'https://www.alltrails.com/poi/us/washington/ashford/pinnacle-glacier',body:'the photo-first swap, not an add-on. The viral mirror shot is <b>not</b> on the way to the saddle: an unsigned boot path leaves the trail at the creek 0.5&ndash;0.6 mile up and climbs its own 2.5 miles / 1,100 feet into the cirque under the Pinnacle Glacier. Take it instead of the saddle when the summit is out and the air is dead calm &mdash; the tarn is seasonal and may be low or dry by September, and the descent is brushy and loose. Full route, timing and caveats in the trail guide.'},{title:'Bench + Snow Lakes',href:'https://www.nps.gov/mora/planyourvisit/bench-snow-lake-trail.htm',body:'the closure-era stand-in and still the gentler swap: 2.5 miles / 700 feet to two alpine lakes from a pullout 1.5 miles east on the same road, with the Bench Lake mirror on still afternoons.'},{title:'Lakes Trail + Faraway Rock',href:'https://www.nps.gov/places/reflection-lakes.htm',body:'the best late-arrival save from the same Reflection Lakes parking; about three miles with the mirror and the Louise Lake / Stevens Canyon overlook.'},{title:'Reflection Lakes shoreline + Box Canyon',href:'https://www.nps.gov/places/reflection-lakes.htm',body:'use only when the hiking window is gone. Photograph the legal shoreline pullouts, make the short Box Canyon stop, and protect cabin check-in.'}],links:[['NPS Pinnacle Peak Trail','https://www.nps.gov/mora/planyourvisit/pinacle-peak.htm'],['Live Tatoosh webcam',CAM_TATOOSH],['NPS trail status report','https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],['NPS fire information','https://www.nps.gov/mora/learn/news/fire.htm']]}),
  day({id:'day2',cls:'c2',badge:'Sat',date:'Sept. 5',title:'Skyline Loop + Paradise',feel:'The irreplaceable classic stays exactly where it belongs',facts:[['Leave cabin','About 5:45 AM'],['Trail start','Aim for 7:00&ndash;7:15 AM'],['Hike','5.5 mi / 1,700 ft / 4.5&ndash;5.5 hr'],['Cabin','Packwood &middot; night 2']],note:'Hike clockwise via Panorama Point and use the High Skyline connector if posted conditions direct it. Do not add Pebble Creek or Muir Snowfield travel.',spot:'Skyline Trail via Panorama Point',photos:skylinePhotos,flow:'Drive the open Stevens Canyon&ndash;Paradise route and park before the holiday crowd. Start at the stone steps by Jackson Visitor Center, climb clockwise to Panorama Point, stay on the signed Skyline route, descend through Paradise Valley and Myrtle Falls, then have a relaxed lunch. Add Narada Falls or Reflection Lakes only if parking and energy are easy.',reality:'This is the trip&rsquo;s highest-priority clear-air window. If AQI is unhealthy, the summit is fully obscured, or the park expands the closure, swap Saturday and Sunday or use the lower Longmire fallback.',cost:'Park entrance pass required; no 2026 timed entry. Parking is the constraint, so the early start matters even on an open road.',food:'Carry breakfast and trail lunch. Treat Paradise food service as a bonus, not the plan.',map:'Skyline Trail Paradise Mount Rainier',alts:[{title:'Swap in Comet Falls + Van Trump Park',href:'https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm',body:'the best like-for-like schedule move when Paradise alone is clouded or inaccessible and Sunday looks better for Skyline.'},{title:'Shriner Peak Fire Lookout',href:'https://www.nps.gov/mora/planyourvisit/shriner-peak.htm',body:'the strongest open full-day lookout alternative: 8 miles / 3,434 feet from SR 123. Choose it only with clear air, an open trail, an early start, and unanimous appetite for a much harder climb.'},{title:'Deadhorse Creek + Moraine',href:'https://www.nps.gov/mora/planyourvisit/day-hiking-at-mount-rainier.htm',body:'the best shorter Paradise version when the road and lower meadows are good but time, wind, or legs rule out the full Skyline; about 2.5 miles and 1.5&ndash;2 hours.'}],links:[['NPS Skyline Trail','https://www.nps.gov/mora/planyourvisit/skyline-trail.htm'],['Live Paradise Mountain webcam',CAM_MOUNTAIN],['NPS trail status report','https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],['Paradise visitor guide','https://www.nps.gov/mora/planyourvisit/paradise-basic-info.htm']]}),
  day({id:'day3',cls:'c3',badge:'Sun',date:'Sept. 6',title:'Comet Falls &rarr; Van Trump Park',feel:'Waterfall thunder first, then a meadow directly beneath Rainier&rsquo;s glaciers',facts:[['Leave cabin','By 5:15 AM'],['In the lot','Target 6:45 AM &middot; 16 spaces'],['Primary','5.8 mi / 2,000 ft / 4&ndash;5 hr'],['Short option','Comet Falls only &middot; 3.8 mi / 900 ft']],note:'This is the best new full-day anchor and the parking ladder is the plan: leave Packwood by 5:15 AM (routers put the drive at 1:23) to be in the sixteen-space lot by about 6:45. There is no overflow and no legal shoulder. Lot full &rarr; drive on to Longmire and hike Rampart Ridge, the default fallback. Eagle Peak is a deliberate group opt-in for a hard day, never the consolation prize.',spot:'Comet Falls and Van Trump Park',photos:waterfallPhotos,flow:'Drive toward Longmire and Paradise; the trailhead is four miles east of Longmire, just above Christine Falls. Climb 1.8 miles to the 320-foot falls. Continue 0.8 mile to the junction and another 0.5 mile into Van Trump Park. Return the same way. Mildred Point is deliberately omitted because it raises the day to 6.6 miles and 2,850 feet.',reality:'Turn around at Comet Falls if smoke increases or the mountain disappears; the meadow above is the part that needs visibility. Spray keeps the rock near the falls slick well into the morning, so poles and real tread matter more than the mileage suggests.',cost:'Park entrance pass covers this corridor. There is no overflow lot and no trail shuttle.',food:'Pack breakfast, lunch, and recovery snacks the night before. Use Longmire or Packwood for an early dinner.',map:'Comet Falls Trailhead Mount Rainier',alts:[{title:'Rampart Ridge Loop',href:'https://www.nps.gov/mora/planyourvisit/rampart-ridge-trail.htm',body:'the automatic full-lot or high-wind fallback. Continue to Longmire for 4.6 miles / 1,339 feet through old growth and two Rainier viewpoints.'},{title:'Eagle Peak Saddle',href:'https://www.nps.gov/mora/planyourvisit/upload/Eagle-Peak-Trail-Dec18.pdf',body:'the best harder scenic substitute when the group wants a big Tatoosh-ridge day; 7.2 miles / 2,955 feet and a firm stop at the maintained saddle.'},{title:'Silver Falls',href:'https://www.nps.gov/places/grove-of-the-patriarchs-trailhead.htm',body:'the correct low-elevation pivot when cloud or smoke ruins every mountain-view hike but the south-side roads and air remain safe.'}],links:[['NPS Comet Falls / Van Trump','https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm'],['NPS Eagle Peak brochure','https://www.nps.gov/mora/planyourvisit/upload/Eagle-Peak-Trail-Dec18.pdf'],['NPS Rampart Ridge','https://www.nps.gov/mora/planyourvisit/rampart-ridge-trail.htm']]}),
  day({id:'day4',cls:'c4',badge:'Mon',date:'Sept. 7',title:'Tipsoo + Naches Peak &rarr; Seattle',feel:'A final mountain reveal without gambling the Seattle handoff',facts:[['Cabin','Checkout early; deadline 11:00 AM'],['Optional hike','3.5 mi / 500 ft / about 2 hr'],['Direction','Clockwise for best Rainier views'],['Seattle','Target 2:30&ndash;4:00 PM arrival']],note:'This is the only planned stop near the northeast fire complex, though it begins from open SR 410 and Tipsoo rather than the closed Sunrise Road. If smoke is visible, AQI is worsening, or the closure expands, skip it and go directly to Seattle.',spot:'Tipsoo Lake and Naches Peak Loop',photos:nachesPhotos,flow:'Check out early with the car packed. Drive SR 123 to Cayuse Pass and open SR 410 to Tipsoo. If the go/no-go passes, hike clockwise and leave by about 10:30&ndash;11:00. Drive to Seattle, check in or drop bags, then use Pike Place, Overlook Walk, the waterfront, and Kerry Park only as arrival time allows.',reality:'Naches is listed open, but smoke from the Wonderland Complex and nearby Backbone Fire can be visible from SR 123 and US 12, and the fires can change access overnight. The hike loses to any closure, unhealthy air, poor visibility, or major Labor Day traffic delay.',cost:'Park pass required at Tipsoo. Seattle parking is extra; park once near the lodging.',food:'Bring trail breakfast. Use Pike Place for a flexible late lunch, then a simple nearby dinner.',map:'Naches Peak Loop Tipsoo Lake',alts:[{title:'Silver Falls before Seattle',href:'https://www.nps.gov/thingstodo/mount-rainier-off-the-beaten-path.htm',body:'the best actual trail swap if the northeast gate fails but SR 123, the Stevens Canyon Entrance, and south-side air remain safe; 2 miles / 300 feet from Grove parking.'},{title:'Lakes Trail + Faraway Rock',href:'https://www.nps.gov/places/reflection-lakes.htm',body:'use only if Stevens Canyon is open, the west side is visibly clearer, and the extra drive still protects a comfortable Seattle arrival.'},{title:'Go directly to Seattle',href:'https://wsdot.com/Travel/Real-time/Map/',body:'this beats every substitute when AQI, fire spread, or Labor Day traffic is the problem. It converts the afternoon into the full Pike Place / waterfront / Kerry Park plan.'}],links:[['NPS Naches Peak Loop','https://www.nps.gov/mora/planyourvisit/natches-peak-loop.htm'],['NPS fire information','https://www.nps.gov/mora/learn/news/fire.htm'],['WSDOT real-time map','https://wsdot.com/Travel/Real-time/Map/']]}),
  day({id:'day4b',cls:'c4',badge:'Mon',date:'Sept. 7 &middot; afternoon',title:'Seattle waterfront + golden hour',feel:'A flexible city finish after the mountain drive',facts:[['Walk','Pike Place &rarr; Overlook Walk &rarr; waterfront'],['Sunset','Kerry Park if arrival supports it'],['Sleep','W Seattle &middot; 1112 4th Ave'],['Booking','Single confirmed Seattle night']],note:'If Naches is skipped, Seattle becomes an unhurried half-day. If the hike happens, keep only Pike Place, dinner, and Kerry Park.',spot:'Pike Place, waterfront and Kerry Park',photos:seattleMondayPhotos,flow:'Park near the lodging, leave bags if available, and walk rather than repeatedly moving the car. Make Kerry Park the only cross-town sunset target.',reality:'Labor Day traffic can erase an hour. Drop attractions from the end of the list rather than compressing the airport-day plan.',cost:'Pike Place, the waterfront, and Kerry Park are free; budget for downtown parking.',food:'Flexible market lunch; simple dinner near the lodging.',map:'Pike Place Market Seattle',alts:[{title:'Late-arrival edit',href:'https://www.pikeplacemarket.org/',body:'do Pike Place, Overlook Walk, and dinner on foot; drop Kerry Park rather than turning the evening into another drive.'},{title:'Early-arrival edit',href:'https://waterfrontparkseattle.org/',body:'if Naches was canceled, walk the full market-to-waterfront sequence at an easy pace and keep Kerry Park for golden hour.'},{title:'Rain-and-smoke edit',href:'https://www.pikeplacemarket.org/',body:'stay under the market roofs and near the hotel. The city day does not need a replacement mountain viewpoint to count as successful.'}],links:[['Pike Place official site','https://www.pikeplacemarket.org/'],['Waterfront Park Seattle','https://waterfrontparkseattle.org/'],['WSDOT traffic','https://wsdot.com/Travel/Real-time/Map/']]}),
  day({id:'day4c',cls:'c4',badge:'Alt',date:'Sept. 7 &middot; alternate Seattle day',title:'Leave Packwood at 10 &rarr; Seattle max',feel:'Market, waterfront, historic tower, postcard skyline and two excellent cocktails',facts:[['Leave Packwood','10:00 AM sharp'],['Downtown target','12:45&ndash;1:30 PM'],['Sunset','7:37 PM at Kerry Park'],['Sleep','W Seattle &middot; 1112 4th Ave']],note:'This is a standalone alternative to the existing Monday mountain handoff. It does not replace or change any Rainier day. Check out with the car packed, drive directly from Packwood at 10:00 AM, leave the car by the hotel, and let WSDOT traffic determine the cuts.',spot:'Seattle max: Pike Place, Smith Tower and Kerry Park',photos:seattleMaxPhotos,flow:'<b>10:00 AM</b> leave Packwood. <b>12:45&ndash;1:30 PM</b> park once and drop bags at the W. <b>1:15&ndash;3:15 PM</b> explore Pike Place and eat a market lunch; Matt&rsquo;s works only with an on-time arrival and reservation, while Old Stove or Caf&eacute; Campagne is safer. <b>3:15&ndash;4:00 PM</b> descend Overlook Walk and loop Pier 62. <b>4:15&ndash;5:20 PM</b> use a timed Smith Tower Observatory ticket. <b>5:30&ndash;6:35 PM</b> have an early dinner near Pike Place. <b>6:40 PM</b> rideshare to Kerry Park for the 7:37 sunset, leaving about 7:55. <b>8:15&ndash;9:15 PM</b> have a rooftop drink at The Nest. <b>9:30 PM</b> finish at reservation-only Needle &amp; Thread or walk into Bathtub Gin &amp; Co. &mdash; choose one, not both.',reality:'The nonstop drive is roughly 2 hours 24 minutes before holiday traffic, stops, parking, and hotel handling. If you reach the W after 1:45 PM, cut Smith Tower first. After 2:30 PM, keep only Pike Place, Overlook Walk, dinner, and the sunset decision. If Rainier is hidden or smoke spoils the western view at 6:15, skip Kerry Park and stay downtown for The Nest or Fog Room. The final speakeasy is always the first energy cut.',cost:'Pike Place, Overlook Walk, Pier 62, and Kerry Park are free. Smith Tower tickets generally start around $18&ndash;$25 per person; add downtown parking, two rideshares, meals, and cocktails.',food:'Do one real meal well. Matt&rsquo;s in the Market is the first choice if its lunch or 5:30 dinner timing fits; Caf&eacute; Campagne is the romantic fallback, and Old Stove is the flexible waterfront option. The Nest is better for the view and a drink than for dinner.',map:'W Seattle 1112 4th Avenue Seattle',alts:[{title:'Late traffic edit',href:'https://www.pikeplacemarket.org/about-pike-place-market/plan-your-visit/',body:'arrive after 1:45 and delete Smith Tower first. Keep Pike Place, Overlook Walk, an early dinner, and Kerry Park only if the view still earns the rideshare.'},{title:'Cloudy or smoky skyline',href:'https://www.thenestseattle.com/',body:'skip Kerry Park and use the recovered hour for The Nest or Fog Room. You still get a polished date night without crossing town for a view that is not there.'},{title:'Low-energy date-night edit',href:'https://www.mattsinthemarket.com/',body:'make the day Pike Place, Overlook Walk, Matt&rsquo;s, and one rooftop drink. Drop Smith Tower and the final speakeasy before rushing any of the remaining stops.'}],links:[['Pike Place visit guide','https://www.pikeplacemarket.org/about-pike-place-market/plan-your-visit/'],['Overlook Walk','https://waterfrontparkseattle.org/overlook-walk/'],['Smith Tower Observatory','https://www.smithtower.com/observatory-bar/'],['Matt&rsquo;s in the Market','https://www.mattsinthemarket.com/'],['Kerry Park','https://www.seattle.gov/parks/parks/kerry-park'],['The Nest','https://www.thenestseattle.com/'],['Needle &amp; Thread reservations','https://www.tavernlaw.com/reservations'],['WSDOT traffic','https://wsdot.com/Travel/Real-time/Map/']]}),
  day({id:'day5',cls:'c0',badge:'Tue',date:'Sept. 8',title:'Seattle morning &rarr; fly home',feel:'Coffee, one short walk, then protect the airport buffer',facts:[['Checkout','By 10:00 AM'],['Leave downtown','About 10:30 AM'],['Car return','Budget by noon'],['Flight','SEA 1:45 PM &rarr; ORD &rarr; PIT']],note:'Do not add a ticketed attraction. The fixed car return and airport buffer are the day.',spot:'Seattle morning and SEA',photos:seattleTuesdayPhotos,flow:'Breakfast near the W on 4th Avenue, a short downtown walk, then bags and checkout. Fuel only if the rental contract requires it and head to the rental facility.',reality:'A crash or security line can consume the buffer. Check both traffic and SEA checkpoint conditions before leaving.',cost:'Only breakfast, possible fuel, parking, and airport food.',food:'Choose a nearby caf&eacute; without a wait list.',map:'Seattle Tacoma International Airport',alts:[{title:'Traffic or long-checkpoint morning',href:'https://www.portseattle.org/sea-tac/security-screening-checkpoints',body:'skip the walk and breakfast wait, check out, and leave downtown 30&ndash;45 minutes earlier. Protecting the flight is the only meaningful Plan B.'},{title:'Normal morning, bad weather',href:'https://wsdot.com/Travel/Real-time/Map/',body:'keep breakfast beside the hotel and go straight to the rental return; do not replace the walk with a ticketed indoor stop.'}],links:[['SEA security checkpoints','https://www.portseattle.org/sea-tac/security-screening-checkpoints'],['WSDOT traffic','https://wsdot.com/Travel/Real-time/Map/']]})
].join('\n');

const days = edit(daysRaw, [
  [
    '<div><span>Land</span><strong>SEA 10:25 AM</strong></div><div><span>Drive</span><strong>Budget pickup &rarr; Stevens Canyon entrance</strong></div><div><span>Hike</span><strong>2.5 mi / 1,050 ft / about 2 hr</strong></div><div><span>Cabin</span><strong>Packwood check-in after the hike</strong></div>',
    '<div><span>Land</span><strong>SEA 9:14 AM</strong></div><div><span>Rental &rarr; trail</span><strong>93 mi &middot; router 2:35<br>plan 3:00&ndash;3:30</strong></div><div><span>Hike</span><strong>2.5 mi / 1,050 ft / about 2 hr</strong></div><div><span>Trail &rarr; cabin</span><strong>58 min to Blanton&rsquo;s<br>then 5.1 mi / 12 min</strong></div>'
  ],
  [
    'Be hiking by roughly 4:30 PM. If you cannot,',
    'Aim to be hiking by 2:30&ndash;3:00 PM; 4:00 PM is the cutoff for the full saddle. If you cannot,'
  ],
  [
    'Pick up the rental, buy water and trail food, then drive US 12 to Packwood and in through the Stevens Canyon Entrance. Park at Reflection Lakes; the signed trailhead is across the road. Climb 1.25 miles to the maintained 5,920-ft saddle and stop there &mdash; the scramble routes toward Pinnacle and Plummer are not part of this itinerary. Continue to the Packwood cabin for night one.',
    'Pick up the rental at SEA&rsquo;s off-site facility, then take the direct west-side approach via SR 7 / SR 706 and the Nisqually Entrance to Paradise and Reflection Lakes. The traffic-free router is about 2 hours 35 minutes from the rental facility; plan 3&ndash;3&frac12; hours with the park gate, mountain traffic, and parking. The signed Pinnacle trailhead is across the road. Climb 1.25 miles to the maintained 5,920-ft saddle and stop there &mdash; the scramble routes toward Pinnacle and Plummer are not part of this itinerary. After the hike, continue east on Stevens Canyon Road: allow about 1&ndash;1&frac14; hours to Blanton&rsquo;s Market in Packwood, shop for groceries and beer, then drive the final 5.1 miles / about 12 minutes to the cabin.'
  ],
  [
    'Carry a substantial late lunch. Packwood Brewing Co. is the easy post-hike dinner only if current Friday hours fit.',
    'Carry a substantial late lunch. Blanton&rsquo;s Market at 13040 US-12 is the intentional grocery-and-beer stop; it is open 7:00 AM&ndash;9:00 PM daily and sits about 12 minutes from the cabin pin. Packwood Brewing Co. remains the easy post-hike dinner only if current Friday hours fit.'
  ],
  [
    '<div><span>Leave cabin</span><strong>About 5:45 AM</strong></div><div><span>Trail start</span><strong>Aim for 7:00&ndash;7:15 AM</strong></div><div><span>Hike</span><strong>5.5 mi / 1,700 ft / 4.5&ndash;5.5 hr</strong></div><div><span>Cabin</span><strong>Packwood &middot; night 2</strong></div>',
    '<div><span>Cabin &rarr; Paradise</span><strong>38.9 mi &middot; plan 1:20&ndash;1:35<br>leave about 5:45 AM</strong></div><div><span>Trail start</span><strong>Aim for 7:00&ndash;7:15 AM</strong></div><div><span>Hike</span><strong>5.5 mi / 1,700 ft / 4.5&ndash;5.5 hr</strong></div><div><span>Paradise &rarr; cabin</span><strong>Plan 1:20&ndash;1:35<br>Packwood night 2</strong></div>'
  ],
  [
    '<div><span>Leave cabin</span><strong>By 5:15 AM</strong></div><div><span>In the lot</span><strong>Target 6:45 AM &middot; 16 spaces</strong></div><div><span>Primary</span><strong>5.8 mi / 2,000 ft / 4&ndash;5 hr</strong></div><div><span>Short option</span><strong>Comet Falls only &middot; 3.8 mi / 900 ft</strong></div>',
    '<div><span>Cabin &rarr; Comet</span><strong>41.6 mi &middot; plan 1:30&ndash;1:45<br>leave by 5:15 AM</strong></div><div><span>In the lot</span><strong>Target 6:45 AM &middot; 16 spaces</strong></div><div><span>Primary</span><strong>5.8 mi / 2,000 ft / 4&ndash;5 hr</strong></div><div><span>Comet &rarr; cabin</span><strong>Plan 1:30&ndash;1:45<br>same mountain route back</strong></div>'
  ],
  [
    '<div><span>Cabin</span><strong>Checkout early; deadline 11:00 AM</strong></div><div><span>Optional hike</span><strong>3.5 mi / 500 ft / about 2 hr</strong></div><div><span>Direction</span><strong>Clockwise for best Rainier views</strong></div><div><span>Seattle</span><strong>Target 2:30&ndash;4:00 PM arrival</strong></div>',
    '<div><span>Cabin &rarr; Tipsoo</span><strong>31.6 mi &middot; plan 1:00&ndash;1:10<br>checkout with the car packed</strong></div><div><span>Optional hike</span><strong>3.5 mi / 500 ft / about 2 hr</strong></div><div><span>Tipsoo &rarr; Seattle</span><strong>Router 2:09<br>plan 2:45&ndash;3:30 on Labor Day</strong></div><div><span>Seattle</span><strong>Target 2:30&ndash;4:00 PM arrival</strong></div>'
  ],
  [
    '<p class="feel">Coffee, one short walk, then protect the airport buffer</p>',
    '<p class="feel">Grab-and-go breakfast, then protect the rental return and airport buffer</p>'
  ],
  [
    '<h3>Seattle morning &rarr; fly home</h3>',
    '<h3>W Seattle &rarr; SEA &rarr; fly home</h3>'
  ],
  [
    '<div><span>Checkout</span><strong>By 10:00 AM</strong></div><div><span>Leave downtown</span><strong>About 10:30 AM</strong></div><div><span>Car return</span><strong>Budget by noon</strong></div><div><span>Flight</span><strong>SEA 1:45 PM &rarr; ORD &rarr; PIT</strong></div>',
    '<div><span>Leave the W</span><strong>8:00 AM</strong></div><div><span>W &rarr; Budget</span><strong>Router 21 min<br>plan 30&ndash;45 min</strong></div><div><span>Rental + shuttle</span><strong>Return 8:30&ndash;8:45<br>terminal about 9:00</strong></div><div><span>Flights</span><strong>SEA 11:35 &rarr; ORD 6:01<br>ORD 7:00 &rarr; PIT 9:44 PM</strong></div>'
  ],
  [
    'Do not add a ticketed attraction. The fixed car return and airport buffer are the day.',
    'Do not add a downtown walk or ticketed attraction. The earlier flight makes the rental return and airport buffer the day.'
  ],
  [
    'Breakfast near the W on 4th Avenue, a short downtown walk, then bags and checkout. Fuel only if the rental contract requires it and head to the rental facility.',
    'Use a grab-and-go breakfast beside the W, check out, and leave at 8:00 AM. Fuel only if the rental contract requires it. Allow 30&ndash;45 minutes to the off-site Budget return, target 8:30&ndash;8:45, then take the dedicated rental-car shuttle for its short ride to the terminal. The goal is to be inside SEA around 9:00 AM for the 11:35 AM departure.'
  ],
  [
    'A crash or security line can consume the buffer. Check both traffic and SEA checkpoint conditions before leaving.',
    'A crash, rental-return line, shuttle wait, or security line can consume the buffer. SEA advises arriving at least two hours before a domestic flight, and its rental cars use a separate facility with a shuttle to the terminal, so do not move the 8:00 AM departure later.'
  ],
  [
    'Choose a nearby caf&eacute; without a wait list.',
    'Choose something beside the hotel that can be carried out immediately; this is no longer a sit-down-breakfast morning.'
  ],
  [
    'skip the walk and breakfast wait, check out, and leave downtown 30&ndash;45 minutes earlier. Protecting the flight is the only meaningful Plan B.',
    'skip the breakfast stop entirely, check out, and leave at 7:15&ndash;7:30 AM. Protecting the flight is the only meaningful Plan B.'
  ],
  [
    'keep breakfast beside the hotel and go straight to the rental return; do not replace the walk with a ticketed indoor stop.',
    'keep breakfast strictly grab-and-go and proceed to the rental return; weather is not a reason to add an indoor stop.'
  ],
  [
    '<a href="https://www.portseattle.org/sea-tac/security-screening-checkpoints" target="_blank" rel="noreferrer">SEA security checkpoints</a><a href="https://wsdot.com/Travel/Real-time/Map/" target="_blank" rel="noreferrer">WSDOT traffic</a>',
    '<a href="https://www.portseattle.org/page/traveler-updates-and-tips" target="_blank" rel="noreferrer">SEA traveler tips</a><a href="https://www.portseattle.org/sea/ground-transportation/rental-car" target="_blank" rel="noreferrer">SEA rental-car shuttle</a><a href="https://www.portseattle.org/sea-tac/security-screening-checkpoints" target="_blank" rel="noreferrer">SEA security checkpoints</a><a href="https://wsdot.com/Travel/Real-time/Map/" target="_blank" rel="noreferrer">WSDOT traffic</a>'
  ]
]);

// The trip is photography-first. Keep the original generated day cards above as
// source material, but render this sunset-protected schedule so a daytime hike or
// grocery errand can never silently consume the best light again.
const sunsetDays = [
  day({
    id:'day1', cls:'c1', badge:'Fri', date:'Sept. 4',
    title:'SEA &rarr; groceries &rarr; weather-gated Reflection sunset',
    feel:'Land, provision once, then let the thunder forecast choose the safe first light',
    facts:[['Land','SEA 9:14 AM'],['Rental &rarr; groceries','35 mi &middot; router 54 min<br>plan 1:00&ndash;1:15'],['Fred Meyer &rarr; trail','58.5 mi &middot; router 1:40<br>plan about 2 hr'],['Sunset','7:39 PM &middot; civil dusk 8:10']],
    note:'Shop at Fred Meyer Bethel Station on SR 7 before entering the park, then use Reflection Lakes as the default sunset trailhead. NWS now forecasts likely showers and thunderstorms around 3&ndash;4 PM near Paradise, easing to roughly a 31% rain chance around sunset. Wait for radar and thunder to clear, then use the maintained shoreline / lower Lakes Trail. Pinnacle is an upside option only after an unequivocally dry 4:15 PM gate.',
    spot:'Reflection Lakes sunset with Pinnacle upside', photos:arrivalPhotos,
    flow:'After the rental shuttle and pickup, follow SR 7 / SR 706 through the Nisqually Entrance, Paradise and Stevens Canyon Road. Buy the whole cabin supply at Fred Meyer first. At Reflection Lakes, stop and reassess: if the last thunder is still audible, radar shows another cell, or the rock is slick, wait in the car or keep the outing to legal maintained lake-edge paths once the storm has passed. Only with no thunder, no approaching cell, dry footing and a 4:30 start should you cross to Pinnacle and climb toward the saddle. Descend together on headlamps and allow 1&ndash;1&frac14; hours to the cabin.',
    reality:'This is the only day with a meaningful lightning signal in the planned hiking window: the latest NWS hourly forecast puts showers and thunderstorms near 46% at 2 PM and 63&ndash;65% at 3&ndash;4 PM, while ECMWF, GFS and ICON all keep Friday afternoon wet. Do not use a percentage as permission to enter exposed terrain. Any thunder, expanding fire closure, unhealthy smoke, slick rock or arrival after 5:15 cancels Pinnacle. The unmaintained Pinnacle Glacier Tarn is not a wet-weather fallback.',
    cost:'Park entrance pass required; no timed entry in 2026. Groceries replace an expensive late restaurant scramble.',
    food:'Buy all breakfasts, trail lunches, recovery food, water and beer at Fred Meyer. Eat a substantial carry-in meal before the hike and keep a cold cabin dinner ready for the late arrival.',
    map:'Reflection Lakes Mount Rainier',
    alts:[{title:'Storm clears early: Pinnacle Saddle',href:'https://www.nps.gov/mora/planyourvisit/pinacle-peak.htm',body:'use the original 2.5-mile sunset only if radar, thunder, footing, air and the 4:15 timing gate all pass. The maintained saddle is the endpoint.'},{title:'Thunder lingers: no mountain hike',href:'https://www.weather.gov/safety/lightning',body:'wait in the vehicle or continue to the cabin. A sunset commitment never overrides active lightning.'}],
    links:[['Fred Meyer Bethel Station','https://www.fredmeyer.com/stores/grocery/wa/spanaway/bethel-station/701/00604'],['NPS Pinnacle Peak Trail','https://www.nps.gov/mora/planyourvisit/pinacle-peak.htm'],['NPS current trail status','https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],['NWS Paradise forecast','https://forecast.weather.gov/MapClick.php?lat=46.7786&amp;lon=-121.7251']]
  }),
  day({
    id:'day2', cls:'c2', badge:'Sat', date:'Sept. 5',
    title:'Reflection Lakes sunrise + Paradise meadow sunset',
    feel:'Protect both ends of the light and sleep through Saturday&rsquo;s wet middle',
    facts:[['Cabin &rarr; Reflection','35.3 mi &middot; plan 1:10&ndash;1:25<br>leave 5:00 AM'],['Sunrise hike','1.3 mi / 300 ft &middot; 6:00&ndash;7:50<br>sunrise 6:31'],['Cabin recovery','9:15 AM&ndash;4:30 PM<br>rain-likely window'],['Sunset hike','1&ndash;2.5 mi / low exposure<br>sunset 7:37']],
    note:'The latest forecast strongly favors dawn over afternoon: NWS holds the 6&ndash;10 AM precipitation probability near 14%, then raises it to 59% from 11 AM&ndash;4 PM before easing to 24% in the evening. Keep Faraway Rock at sunrise, return to the cabin for breakfast and a long recovery block, then use a short Paradise meadow circuit through sunset instead of forcing the exposed upper Skyline loop.',
    spot:'Reflection Lakes sunrise and Paradise meadow sunset', photos:skylinePhotos,
    flow:'Leave the cabin at 5:00 AM and reach Reflection Lakes during civil twilight. Use the legal lake-edge viewpoints for the 6:31 reflection, continue to Faraway Rock, and return by about 7:50. Drive back to the cabin, eat, dry gear and sleep through the rain-likely middle of the day. Recheck NWS hourly, radar and the Paradise webcam at 3:30 PM; if the evening trend still improves, leave around 4:30 and combine Nisqually Vista with Myrtle Falls, adding Alta Vista only while footing and visibility remain good. Stay on the maintained meadows through the 7:37 sunset, then return on headlamps.',
    reality:'ECMWF, GFS and ICON disagree on cloud detail but agree that Saturday dawn is substantially drier than Saturday afternoon; all three become wetter later in the day. That is enough agreement to move the full Skyline loop. Any thunder, unsafe footing, worsening smoke, heavy rain or fully obscured Paradise cancels Alta Vista and can cancel the evening hike entirely. If Friday ends after 10 PM or either person gets under six hours of sleep, shorten dawn to the Reflection Lakes viewpoints.',
    cost:'Park pass required; no timed entry. Carry everything because visitor services may close before the hike ends.',
    food:'Pack dawn coffee and breakfast the night before. Eat the real breakfast back at the cabin, then prepare an early dinner before leaving for the short Paradise sunset; do not rely on late park or Packwood kitchens.',
    map:'Reflection Lakes Mount Rainier',
    alts:[{title:'Sleep gate: lake viewpoint only',href:'https://www.nps.gov/places/reflection-lakes.htm',body:'if Friday runs late or sleep is under six hours, photograph sunrise from the legal Reflection Lakes viewpoints and skip Faraway Rock.'},{title:'Evening stays wet: skip Paradise',href:'https://www.weather.gov/safety/lightning',body:'keep the recovery day. The full Skyline loop has moved to Sunday morning; Saturday does not need a heroic wet-weather substitute.'}],
    links:[['NPS Reflection Lakes / Lakes Trail','https://www.nps.gov/places/reflection-lakes.htm'],['WTA Faraway Rock','https://www.wta.org/go-hiking/hikes/faraway-rock'],['Recent Reflection Lakes sunrise','https://www.reddit.com/r/NationalPark/comments/1uzxinm/sunrise_at_reflection_lake_mount_rainier_national/'],['NPS Skyline Trail','https://www.nps.gov/mora/planyourvisit/skyline-trail.htm'],['Live Paradise webcam',CAM_MOUNTAIN]]
  }),
  day({
    id:'day3', cls:'c3', badge:'Sun', date:'Sept. 6',
    title:'Skyline sunrise / morning + Naches Peak sunset',
    feel:'Put the signature high-country loop inside the weekend&rsquo;s clearest forecast window',
    facts:[['Cabin &rarr; Paradise','38.9 mi &middot; plan 1:20&ndash;1:35<br>leave 4:30 AM'],['Skyline','5.5 mi / 1,700 ft &middot; 6:00&ndash;11:30'],['Cabin &rarr; Tipsoo','31.6 mi &middot; plan 1:00&ndash;1:10'],['Sunset','7:35 PM &middot; civil dusk 8:06']],
    note:'NWS now gives Paradise only about a 5% precipitation probability from 6&ndash;10 AM Sunday, rising to 37% after 11. Leave the cabin at 4:30, start Skyline around 6:00, and put Panorama Point and the exposed high traverse inside the dry window. Return to the cabin by roughly 1:00 PM, recover and eat, then leave by 4:45 for the clockwise Naches sunset.',
    spot:'Skyline morning and Naches Peak sunset', photos:nachesPhotos,
    flow:'Start clockwise Skyline at first light, around the 6:32 sunrise. Reach Panorama Point while the hourly forecast is driest, stay on the signed Skyline or posted High Skyline connector, and aim to be descending before the 11 AM shower chance rises. Return to the cabin for food, dry layers and at least two hours off your feet. At Tipsoo, hike Naches clockwise so the Rainier-facing half lands near sunset. Finish by civil dusk or headlamp.',
    reality:'NWS is the decision source, and the ECMWF, GFS and ICON comparison independently agrees that Sunday morning is the weekend precipitation minimum. Cloud-cover guidance still disagrees, so the 4:00 AM Paradise webcam decides whether the high loop earns the drive. This remains the highest-output day: 8.7 miles and about 2,300 feet across two hikes. If Skyline finishes after noon, legs are poor, or afternoon rain strengthens, shorten Naches to the Tipsoo meadow / lake sunset. Any closure expansion, smoke, thunder or unsafe footing cancels exposed terrain.',
    cost:'Park pass covers both trailheads. There is no legal overflow at Comet Falls.',
    food:'Pack breakfast and a full trail meal for Skyline. Eat an early cabin dinner around 3:30&ndash;4:00 and carry a thermos and snack for Naches.',
    map:'Naches Peak Loop Tipsoo Lake',
    alts:[{title:'Mountain socked in: Comet Falls',href:'https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm',body:'restore the 3.8-mile waterfall hike only if the Comet lot has space and the lower trail is safe. Stop at the falls; Van Trump adds effort without a mountain view.'},{title:'Legs fail: Tipsoo tarns and meadow',href:'https://www.nps.gov/mora/planyourvisit/natches-peak-loop.htm',body:'keep the sunset walk near Tipsoo and turn back before the full loop. The group does not owe the itinerary another 3.2 miles after Skyline.'}],
    links:[['NPS Skyline Trail','https://www.nps.gov/mora/planyourvisit/skyline-trail.htm'],['Live Paradise webcam',CAM_MOUNTAIN],['NWS Paradise forecast','https://forecast.weather.gov/MapClick.php?lat=46.7868&amp;lon=-121.7352'],['NPS Naches Peak Loop','https://www.nps.gov/mora/planyourvisit/natches-peak-loop.htm'],['WTA Naches Peak Loop','https://www.wta.org/go-hiking/hikes/naches-peak-loop'],['NPS fire information','https://www.nps.gov/mora/learn/news/fire.htm']]
  }),
  day({
    id:'day4', cls:'c4', badge:'Mon', date:'Sept. 7',
    title:'Tipsoo sunrise &rarr; Seattle &rarr; Discovery Park sunset',
    feel:'A low-mileage Rainier dawn turns the checkout drive into one last mountain payoff',
    facts:[['Checkout','By 5:00 AM &middot; car fully packed'],['Tipsoo sunrise','About 1 mi / easy &middot; 6:05&ndash;7:20<br>sunrise 6:34'],['Tipsoo &rarr; W','Router 2:11 &middot; plan 2:30&ndash;3:00'],['Seattle sunset','7:37 PM &middot; civil dusk 8:08']],
    note:'Pack, clean and check out before bed or immediately on waking; leave the cabin by 5:00 AM and reach Tipsoo around 6:05. Use the signed lake and meadow trails for an easy roughly one-mile dawn circuit, photograph Rainier around the 6:34 sunrise, then leave by 7:20 and continue directly to the W. The traffic-free Tipsoo-to-hotel router is 2:11; plan 2:30&ndash;3:00 and expect an early bag drop rather than a ready room.',
    spot:'Tipsoo Lake sunrise and Discovery Park sunset', photos:seattleMondayPhotos,
    flow:'At Tipsoo, stay on the maintained paths around the lake and use the first signed Naches / Pacific Crest Trail segment only while it improves the view; this is not a second full Naches loop after Sunday night. The lake, meadows, fall color and direct Rainier view deliver the value within minutes of parking. Leave by 7:20, continue west on open SR 410 toward Seattle, drop bags at the W, and use Pike Place and the waterfront for lunch. Leave the hotel by 4:45 PM, start the Discovery Park loop around 5:30, reach West Point before 7:00, and return on headlamps after the Olympic Mountains sunset.',
    reality:'Tipsoo remains open from SR 123 / SR 410, but it is close to the east-side fire picture. Recheck NPS road and trail status, WSDOT, AQI and smoke before the 5:00 AM departure. Any closure expansion, unsafe smoke, thunder, dense fog or Sunday return after 10:00 PM cancels the dawn stop and restores a normal 9:30&ndash;10:00 AM checkout. At Discovery, use a general-use lot—the beach lot is ADA-only—and shorten to the bluff / South Beach out-and-back if traffic runs late.',
    cost:'Park pass covers Tipsoo; Discovery Park is free. Budget for hotel or downtown parking and dinner.',
    food:'Pack coffee and a no-cook breakfast Sunday afternoon. Eat after the Tipsoo circuit or during the Seattle drive, use Pike Place for an early lunch, then carry an early bite before Discovery. Save cocktails for after the sunset hike.',
    map:'Tipsoo Lake Mount Rainier',
    alts:[{title:'Too tired or smoky: skip the alarm',href:'https://www.nps.gov/mora/planyourvisit/road-status.htm',body:'sleep, finish checkout and leave Packwood around 9:30&ndash;10:00. This protects the Seattle afternoon and Discovery sunset without forcing a low-value or unsafe dawn.'},{title:'Late arrival: Discovery bluff + West Point',href:'https://www.seattle.gov/parks/parks/discovery-park',body:'cut market time and evening mileage, not the sunset. Start from a legal general lot and turn around early enough to climb back safely.'}],
    links:[['NPS Tipsoo Lake','https://www.nps.gov/places/tipsoo-lake.htm'],['NPS Naches Peak Loop','https://www.nps.gov/mora/planyourvisit/natches-peak-loop.htm'],['NPS road status','https://www.nps.gov/mora/planyourvisit/road-status.htm'],['WTA Naches Peak Loop','https://www.wta.org/go-hiking/hikes/naches-peak-loop'],['Seattle Parks Discovery Park','https://www.seattle.gov/parks/parks/discovery-park'],['WTA Discovery Park Loop','https://www.wta.org/go-hiking/hikes/discovery-park-loop-trail']]
  }),
  day({
    id:'day5', cls:'c0', badge:'Tue', date:'Sept. 8',
    title:'W Seattle &rarr; SEA &rarr; fly home',
    feel:'The only non-sunset day: you are airborne before noon and land after dark',
    facts:[['Leave the W','8:00 AM'],['W &rarr; Budget','Plan 30&ndash;45 min'],['SEA departure','AS429 &middot; SEA 11:35 AM'],['PIT arrival','AS6776 &middot; 9:44 PM']],
    note:'There is no honest way to schedule a sunset hike on Tuesday: the first flight leaves Seattle at 11:35 AM and the connection lands in Pittsburgh at 9:44 PM. Protect the rental return, shuttle and security buffer.',
    spot:'Seattle Tacoma International Airport', photos:seattleTuesdayPhotos,
    flow:'Use grab-and-go breakfast beside the W, check out, and leave at 8:00 AM. Target the off-site Budget return for 8:30&ndash;8:45, then take the dedicated rental-car shuttle and aim to be inside SEA around 9:00.',
    reality:'A crash, rental line, shuttle wait or security line can consume the buffer. Do not move departure later for a morning attraction.',
    cost:'Breakfast, possible fuel and airport food only.',
    food:'Carry out breakfast immediately; no sit-down reservation.',
    map:'Seattle Tacoma International Airport',
    alts:[{title:'Heavy traffic or security lines',href:'https://www.portseattle.org/sea-tac/security-screening-checkpoints',body:'leave at 7:15&ndash;7:30 and skip breakfast. The flight is the fixed point.'}],
    links:[['SEA traveler tips','https://www.portseattle.org/page/traveler-updates-and-tips'],['SEA rental-car shuttle','https://www.portseattle.org/sea/ground-transportation/rental-car'],['SEA security checkpoints','https://www.portseattle.org/sea-tac/security-screening-checkpoints']]
  })
].join('\n');

/* ------------------------------------------------------------------ main */

const sources = section('sources', 'Evidence', 'Sources behind the weather and access rebuild', 'Official agencies decide access, fire safety and the operating forecast. Independent forecast models provide a confidence check, while trail and photography sources help choose the best light. Access and weather were rechecked Sept. 3, 2026; mountain conditions can change within hours.', `<ul class="source-list"><li><a href="https://www.nps.gov/mora/planyourvisit/conditions.htm" target="_blank" rel="noreferrer">NPS Alerts &amp; Conditions</a> and <a href="https://www.nps.gov/mora/learn/news/fire.htm" target="_blank" rel="noreferrer">NPS Wildland Fire Information</a> &mdash; updated Aug. 31: Sunrise Road, White River Road and their originating trails remain closed for the Grand Park 2 Fire; Pinnacle Peak Trail and Stevens Canyon Road are open.</li><li><a href="https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm" target="_blank" rel="noreferrer">NPS Trail Status Report</a> &mdash; Pinnacle, Skyline, Comet Falls, Naches, Tipsoo and the named south-side fallbacks currently read open. Recheck before every departure.</li><li><a href="https://www.nps.gov/mora/planyourvisit/road-status.htm" target="_blank" rel="noreferrer">NPS Road Status</a> and <a href="https://wsdot.com/Travel/Real-time/Map/" target="_blank" rel="noreferrer">WSDOT real-time map</a> &mdash; the planned Nisqually / Paradise / Stevens Canyon / SR 123 / SR 410 spine, subject to same-day change.</li><li><a href="https://forecast.weather.gov/MapClick.php?lat=46.7868&amp;lon=-121.7352" target="_blank" rel="noreferrer">NWS Paradise point and hourly forecast</a>, <a href="https://forecast.weather.gov/MapClick.php?lat=46.8691&amp;lon=-121.5172" target="_blank" rel="noreferrer">NWS Tipsoo forecast</a>, and <a href="https://forecast.weather.gov/MapClick.php?lat=47.6573&amp;lon=-122.4058" target="_blank" rel="noreferrer">NWS Discovery Park forecast</a> &mdash; fetched Sept. 3. Key planning windows: Friday Paradise thunderstorms likely at 63&ndash;65% from 3&ndash;4 PM; Saturday Paradise 14% at 6&ndash;10 AM, rain likely near 59% from 11 AM&ndash;4 PM and near 24% around sunset; Sunday Paradise near 5% from 6&ndash;10 AM; Monday Tipsoo dawn near 11%; Monday Discovery sunset near 3%.</li><li><a href="https://a.atmos.washington.edu/data/rainier_report.html" target="_blank" rel="noreferrer">NWS Mount Rainier Recreational Forecast</a> &mdash; corroborates the unsettled Friday/Saturday pattern and relatively better later windows, but the newer elevation-specific point forecasts govern this schedule.</li><li><a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">ECMWF, GFS and ICON via Open-Meteo</a> &mdash; used only as an independent comparison. All three support the relative precipitation-window choices; their cloud-cover forecasts diverge, so no sunrise receives a guaranteed-view claim.</li><li><a href="https://www.nps.gov/mora/planyourvisit/weather.htm" target="_blank" rel="noreferrer">NPS mountain-weather guidance</a> and the <a href="${CAM_MOUNTAIN}" target="_blank" rel="noreferrer">live Paradise Mountain webcam</a> &mdash; NPS warns that conditions vary sharply by area and change rapidly; webcam, radar and thunder remain the departure-time gates.</li><li><a href="https://fire.airnow.gov/" target="_blank" rel="noreferrer">AirNow Fire and Smoke Map</a> and <a href="https://outlooks.airfire.org/outlook" target="_blank" rel="noreferrer">AirFire outlooks</a> &mdash; the morning and pre-sunset smoke gates.</li><li><a href="https://www.nps.gov/mora/planyourvisit/pinacle-peak.htm" target="_blank" rel="noreferrer">NPS Pinnacle Peak Trail</a>, <a href="https://www.nps.gov/mora/planyourvisit/skyline-trail.htm" target="_blank" rel="noreferrer">NPS Skyline Trail</a>, <a href="https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm" target="_blank" rel="noreferrer">NPS Comet / Van Trump</a>, and <a href="https://www.nps.gov/mora/planyourvisit/natches-peak-loop.htm" target="_blank" rel="noreferrer">NPS Naches Peak</a> &mdash; official route facts.</li><li><a href="https://www.wta.org/go-hiking/hikes/naches-peak-loop" target="_blank" rel="noreferrer">WTA Naches guide</a> and <a href="https://explore.pcta.org/trips/naches-peak-loop/print" target="_blank" rel="noreferrer">PCTA Naches guide</a> &mdash; both support clockwise travel for the Rainier-facing return.</li><li><a href="https://www.reddit.com/r/PNWhiking/comments/1vtqay4/skyline_loop_at_sunset/" target="_blank" rel="noreferrer">Recent Skyline sunset hikers</a> and <a href="https://visitrainier.com/sunset-hikes/" target="_blank" rel="noreferrer">Visit Rainier sunset guide</a> &mdash; community timing and photography rationale, subordinate to current NPS conditions.</li><li><a href="https://www.seattle.gov/parks/parks/discovery-park" target="_blank" rel="noreferrer">Seattle Parks Discovery Park</a> and <a href="https://www.wta.org/go-hiking/hikes/discovery-park-loop-trail" target="_blank" rel="noreferrer">WTA Discovery Park Loop</a> &mdash; legal parking, loop facts, bluff, beach and West Point access.</li><li><a href="https://www.timeanddate.com/sun/%405806025?month=9" target="_blank" rel="noreferrer">Rainier-area sun table</a> &mdash; sunset and civil-dusk times used in the schedule.</li></ul>`);

const refreshedSources = sources.replace('</ul>', '<li><a href="https://www.nps.gov/places/reflection-lakes.htm" target="_blank" rel="noreferrer">NPS Reflection Lakes</a> and <a href="https://www.wta.org/go-hiking/hikes/faraway-rock" target="_blank" rel="noreferrer">WTA Faraway Rock</a> &mdash; official access context and the maintained 1.3-mile / 300-foot Saturday dawn route. A <a href="https://www.reddit.com/r/NationalPark/comments/1uzxinm/sunrise_at_reflection_lake_mount_rainier_national/" target="_blank" rel="noreferrer">recent Reflection Lakes sunrise report</a> illustrates the photography experience only; it does not override NPS access or weather guidance.</li><li><a href="https://www.nps.gov/places/tipsoo-lake.htm" target="_blank" rel="noreferrer">NPS Tipsoo Lake</a> &mdash; easy signed lake and meadow trails, direct Rainier views, summer SR 410 access and an explicit stay-on-trail requirement support the short Monday sunrise circuit.</li><li><a href="https://whitepassbyway.com/high-rock-lookout-closure-extended-for-restoration-project/" target="_blank" rel="noreferrer">High Rock restoration update</a> and <a href="https://www.wta.org/go-hiking/hikes/high-rock" target="_blank" rel="noreferrer">WTA High Rock</a> &mdash; the trail and trailhead reopened Aug. 29, but the lookout and surrounding 150 feet remain closed through Oct. 31. The rough approach, 1,365-foot climb and missing summit payoff make it the wrong checkout-morning trade.</li></ul>');

const operationalSources = refreshedSources.replace('</ul>', '<li><a href="https://www.fredmeyer.com/stores/grocery/wa/spanaway/bethel-station/701/00604" target="_blank" rel="noreferrer">Fred Meyer Bethel Station</a> &mdash; full grocery plus beer, wine and liquor, open 7 AM&ndash;10 PM, directly on the official SR 7 approach. Router baseline: 54 minutes from the rental facility and 1 hour 40 minutes onward to Pinnacle before buffers.</li><li><a href="https://www.blantonsgrocery.com/" target="_blank" rel="noreferrer">Blanton&rsquo;s Market</a> &mdash; Packwood top-up only; the 9 PM close conflicts with a 7:39 mountain sunset.</li><li><a href="https://www.portseattle.org/sea/ground-transportation/rental-car" target="_blank" rel="noreferrer">SEA Rental Cars</a> and <a href="https://www.portseattle.org/page/traveler-updates-and-tips" target="_blank" rel="noreferrer">SEA traveler tips</a> &mdash; off-site rental shuttle and Tuesday airport buffer.</li></ul>');

const main = `<main>
${closureUpdate}
${arrangements}
${stays}
${calendar}
${edit(sectionFromBaseline('weather-history'), [
  ['after checking the short-range forecast, webcams, and park conditions.',
   `after checking the short-range forecast, the <a href="${CAM_INDEX}" target="_blank" rel="noreferrer">live park webcams</a>, and park conditions.`]
])}
${sectionFromBaseline('map')}
${closedTrails}
${section('itinerary', 'Day by day', 'The light-protected Packwood / Rainier itinerary', 'Friday through Monday each retains a weather-gated sunset; Saturday, Sunday and Monday also use dawn. Skyline moves to Sunday morning&rsquo;s forecast dry window, Saturday protects recovery through the rain-likely midday hours, and Monday converts checkout into a direct Tipsoo-to-Seattle route. Every trail includes its drive time and a shorter bailout. Tuesday is the sole exception because the flights occupy the day.', `<div class="days">${sunsetDays}</div>`)}
${savedIdeas}
${recommended}
${trailGuide}
${photoGuide}
${packing}
${foodGuide}
${insiderTips}
${operationalSources}
</main>`;

replaceBlock('<main>', '</main>', main);

// --- Seattle base re-anchored from the released 1400 Hubbell Place Airbnb to the W ---
// The W is at 1112 4th Ave, 0.38 mi west-southwest and downhill of the Airbnb, so every
// distance keyed to Hubbell changes -- and two invert: Pike Place gets closer (0.70 ->
// 0.55 mi) while the 7th Avenue food cluster gets farther (0.22 -> 0.6 mi), which flips
// the old "eat near the lodging, then head back uphill" logic. Walking figures are
// grid-Manhattan distances on Seattle's 31-degree downtown grid, calibrated against the
// page's own Hubbell numbers; drives are OSRM traffic-free.
for (const [before, after] of [
  ['>1400 Hubbell Place, Seattle<', '>W Seattle &middot; 1112 4th Ave<'],
  ['From 1400 Hubbell Place, Pike Place is a 0.7-mile / roughly 14-minute downhill walk. Kerry Park is 2.5 miles / about 10 minutes traffic-free;',
   'From the W at 1112 4th Ave, Pike Place is a 0.55-mile / roughly 11-minute walk downhill. Kerry Park is 2.3 miles / about 8 minutes traffic-free;'],
  ["In Seattle, use the Airbnb's actual location: walk downhill to Pike Place, return toward Hubbell for an early Dough Zone dinner, then drive or rideshare to Kerry Park.",
   'In Seattle, work from the W on 4th Avenue: it sits about 0.55 mile below Pike Place and roughly the same distance below the 7th Avenue food cluster, so the market and an early Dough Zone dinner are short walks in opposite directions, then drive or rideshare to Kerry Park.'],
  ['Eat near Hubbell by 5:30 PM and leave around 6:30 for Kerry Park; it is 2.5 miles away, not part of the walking loop.',
   'Eat by 5:30 PM and leave around 6:30 for Kerry Park; it is 2.3 miles away, not part of the walking loop.'],
  ['rideshare back to Hubbell rather than calling the whole night walkable.',
   'rideshare back to the W rather than calling the whole night walkable.'],
  ['shareable plates about 0.22 mile from 1400 Hubbell. Eating here gets you back uphill from Pike Place and positioned for a 6:30 PM departure to Kerry Park without sacrificing blue hour.',
   'shareable plates about 0.6 mile uphill from the W. Eating here pulls you back east from Pike Place and positions you for a 6:30 PM departure to Kerry Park without sacrificing blue hour.'],
  ['it leaves a longer cross-city transfer to Kerry Park than eating near Hubbell.',
   'it leaves a longer cross-city transfer to Kerry Park than eating up at Pine Street.'],
  ['the 1600 7th Ave location is 0.38 mile / about 8 minutes from 1400 Hubbell and opens at 7 AM under its normal schedule.',
   'the 1600 7th Ave location is about 0.55 mile / 11 minutes uphill from the W and opens at 7 AM under its normal schedule.'],
  ["lodging.n='Seattle Airbnb \u00b7 1400 Hubbell Place';lodging.lat=47.6121972;lodging.lng=-122.3297765;lodging.g='https://www.google.com/maps/search/?api=1&query=1400+Hubbell+Place+Seattle';",
   "lodging.n='W Seattle \u00b7 1112 4th Ave';lodging.lat=47.6074907;lodging.lng=-122.3339425;lodging.g='https://www.google.com/maps/search/?api=1&query=1112+4th+Ave+Seattle';"]
]) {
  const re = flexibleMatcher(before);
  if (!re.test(html)) throw new Error(`Seattle re-anchor target not found: ${before.slice(0, 80)}`);
  html = html.replace(re, () => after);
}

// Only the stays note may still name the released Airbnb, and only to say it is released.
{
  const left = (html.match(/Hubbell/g) || []).length;
  if (left !== 1) throw new Error(`Expected 1 remaining Hubbell mention (the released-hold note), found ${left}`);
}


// The baseline shipped a runtime shuffle that hoists saved-ideas, recommended-trails
// and trail-guide to sit just before photo-guide. It existed only because the old
// source order differed from the intended reading order. This rebuild authors the
// order directly in `main`, so the shuffle now fights it (and desyncs the nav).
replaceBlock(
  "(function(){\n  var saved=document.getElementById('saved-ideas')",
  '})();',
  '// section order is authored in the generator; runtime re-ordering removed'
);

/* ------------------------------------------------------------- map + tail */

const points = [
  ['SEA airport',47.4435,-122.3016,'seattle','flight'],
  ['Budget rental car',47.439,-122.297,'seattle','rental'],
  ['Packwood cabin (mountain base)',46.6505,-121.63574,'rainier','hotel'],
  ['Fred Meyer Bethel Station (planned groceries + beer)',47.0552394,-122.3973202,'rainier','food'],
  ['Blanton&rsquo;s Market (Packwood top-up only)',46.6084775,-121.669327,'rainier','food'],
  ['Pinnacle Saddle trailhead',46.7683,-121.7314,'rainier','hike'],
  ['Pinnacle Glacier Tarn (unmaintained spur)',46.7586,-121.7307,'rainier','view'],
  ['Bench & Snow Lakes trailhead (fallback)',46.7649,-121.7038,'rainier','hike'],
  ['Reflection Lakes',46.7697,-121.7295,'rainier','view'],
  ['Faraway Rock (Lakes Trail)',46.7740,-121.7188,'rainier','view'],
  ['Paradise / Skyline',46.7857,-121.7351,'rainier','hike'],
  ['Comet Falls trailhead',46.7791,-121.7806,'rainier','hike'],
  ['Longmire / Rampart Ridge fallback',46.7497,-121.8128,'rainier','hike'],
  ['Tipsoo / Naches Peak',46.8686,-121.5178,'rainier','hike'],
  ['W Seattle (1112 4th Ave)',47.6074907,-122.3339425,'seattle','hotel'],
  ['Pike Place Market',47.6094,-122.3417,'seattle','sight'],
  ['Discovery Park general parking',47.6577,-122.4064,'seattle','hike'],
  ['West Point Lighthouse sunset',47.6613,-122.4356,'seattle','view']
].map(([n,lat,lng,r,t]) => ({n,lat,lng,r,g:`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,t}));

if (!/window\.__MAP_POINTS__=\[[\s\S]*?\];window\.__MAP_COLORS__=/.test(html)) throw new Error('Map points block not found');
html = html.replace(/window\.__MAP_POINTS__=\[[\s\S]*?\];window\.__MAP_COLORS__=/, `window.__MAP_POINTS__=${JSON.stringify(points)};window.__MAP_COLORS__=`);

html = html
  .replaceAll('Sunday &middot; Fremont sunset', 'Sunday &middot; glacier country')
  .replaceAll('Sunday · Fremont sunset', 'Sunday · glacier country');

replaceOnce('Three nights for quick access to Stevens Canyon, Paradise, Ohanapecosh, Tipsoo, and Sunrise without changing lodging.', 'Three paid nights for quick access to the open Stevens Canyon, Paradise, Longmire, Ohanapecosh, Tipsoo, and Chinook Pass corridors without changing lodging.');

// The trip-gallery count is recomputed by JS on load; this only fixes the
// pre-hydration fallback so it is not wrong with scripting disabled.
const galleryTotal = new Set([
  ...[...html.matchAll(/<div class="carousel[^"]*"[\s\S]*?<\/figure><\/div>/g)].flatMap(c => [...c[0].matchAll(/<img src="([^"]+)"/g)].map(m => m[1])),
  ...[...trailGuide.matchAll(/data-full="([^"]+)"/g)].map(m => m[1])
]).size;
replaceOnce('<span class="gallery-count">85 photos</span>', `<span class="gallery-count">${galleryTotal} photos</span>`);

html = html.replaceAll('https://home.nps.gov/', 'https://www.nps.gov/');

if (/home\.nps\.gov/.test(html)) throw new Error('home.nps.gov links remain');
if (/Option A \(Airbnb\)|Quiet condo near the convention center|968465635918663106/.test(html)) throw new Error('Released Seattle Airbnb hold still present');
for (const orphan of ['google_comet_falls_03', 'google_mildred_point_01', 'google_van_trump_park_02', 'google_van_trump_creek_01', 'pexels_rainier_', 'unsplash_rainier_']) {
  if (html.includes(orphan)) throw new Error(`Dropped image still referenced: ${orphan}`);
}
if (/Mount Fremont Lookout|First \+ Second Burroughs/.test(html)) throw new Error('Closed-trail card survived filtering');
if (!html.includes('id="tg-pinnacle"')) throw new Error('Reopened Pinnacle Saddle trail card missing');
if (!html.includes('SEA &rarr; groceries &rarr; weather-gated Reflection sunset')) throw new Error('Friday weather-gated sunset day missing');
if (!html.includes('id="tg-pinnacle-tarn"')) throw new Error('Pinnacle Glacier Tarn trail card missing');
// The tarn card must state that it is unofficial; the whole point of separating it
// from the Pinnacle Saddle card is that a reader never mistakes it for an NPS trail.
if (!/It is not an NPS trail\./.test(html)) throw new Error('Tarn unmaintained-route caveat missing');
for (const current of ['AS78', 'AS429', 'AS6776', 'SEA 9:14 AM', 'SEA 11:35', 'PIT 9:44 PM', 'data-trip-days="5"', 'Fred Meyer Bethel Station', 'Discovery Park', 'Reflection Lakes sunrise + Paradise meadow sunset', 'Skyline sunrise / morning + Naches Peak sunset', 'Tipsoo sunrise', 'rain-likely window', 'sunrise 6:31', 'sunrise 6:34', 'Skyline dry-window start 6:00']) {
  if (!html.includes(current)) throw new Error(`Updated schedule detail missing: ${current}`);
}
for (const stale of ['AS341', 'SEA 10:25 AM', 'SEA 1:45 PM &rarr; ORD', 'Budget by noon', '11:59 PM Eastern']) {
  if (html.includes(stale)) throw new Error(`Stale flight detail remains: ${stale}`);
}
for (const drive of ['Cabin &rarr; Reflection', 'Reflection &rarr; cabin', 'Cabin &rarr; Paradise', 'Paradise &rarr; cabin', 'Cabin &rarr; Tipsoo', 'Tipsoo &rarr; cabin', 'Tipsoo &rarr; W Seattle', 'W &rarr; Discovery', 'Discovery &rarr; W']) {
  if (!html.includes(drive)) throw new Error(`Scheduled trail drive missing: ${drive}`);
}
{
  let previous = -1;
  for (const id of ['itinerary', 'saved-ideas', 'recommended-trails', 'trail-guide', 'photo-guide']) {
    const at = html.indexOf(`<section id="${id}"`);
    if (at <= previous) throw new Error(`Section order is wrong at ${id}`);
    previous = at;
  }
}
for (let i = 1; i <= 5; i += 1) {
  const file = `google_tarn_0${i}.jpg`;
  if (!html.includes(file)) throw new Error(`Tarn photo unreferenced: ${file}`);
  if (!fs.existsSync(`assets/img/mt-rainier-seattle-2026/${file}`)) throw new Error(`Tarn photo missing on disk: ${file}`);
}

fs.writeFileSync(pagePath, html);
console.log(`Updated ${pagePath} — ${galleryTotal} gallery photos, ${html.length} bytes`);
