import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

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

replaceOnce(
  '.altbox .alt-list a{text-decoration:none}.altbox .alt-list b{color:var(--ink)}',
  '.altbox .alt-list a{text-decoration:none}.altbox .alt-list b{color:var(--ink)}\n.alt-discovery{margin-top:7px}.trail-discovery{margin-top:8px;flex-wrap:wrap;overflow-x:visible}.trail-discovery a,.alt-discovery a{font-size:.65rem;padding:4px 9px}\n.site-home{display:flex;align-items:center;justify-content:center;min-height:40px;margin:0 2px 10px;padding:8px 10px;border:1px solid var(--nav-line);border-radius:10px;background:rgba(246,241,231,.08);color:#fff!important;font-size:.76rem;letter-spacing:.03em}.site-home:hover{background:var(--nav-active)!important;color:var(--nav-active-ink)!important;border-color:var(--nav-active)!important}@media(min-width:960px){.site-nav{display:flex;flex-direction:column}.site-nav>.site-nav-menu{height:auto;flex:1 1 auto}.site-nav-links{max-height:calc(100vh - 142px)}}@media(max-width:959px){.site-home{max-width:1180px;margin:0 auto 8px}}'
);

replaceOnce('<p class="pv-lead">Four nights built around the views that matter most: Pinnacle Saddle on arrival afternoon, Skyline above Paradise, Mount Fremont Lookout through sunset, and an unhurried Seattle handoff the next morning.</p>', '<p class="pv-lead">Your paid Packwood cabin stays. The trip now runs entirely on the open south and west sides: Bench and Snow Lakes on arrival, Skyline above Paradise, Comet Falls and Van Trump Park, then Tipsoo and Naches Peak before Seattle.</p>');
replaceOnce('<span class="pv-kicker">Couples trip &middot; Sept. 4&ndash;8, 2026</span>', '<span class="pv-kicker">Rebuilt for current closures &middot; Sept. 4&ndash;8, 2026</span>');
replaceOnce('<div class="pv-stats"><div><b>3</b><span>Priority hikes</span></div><div><b>3</b><span>Packwood nights</span></div><div><b>7:36 PM</b><span>Sunday sunset</span></div><div><b>1</b><span>Seattle night</span></div></div>', '<div class="pv-stats"><div><b>4</b><span>Open hikes kept</span></div><div><b>3</b><span>Paid Packwood nights</span></div><div><b>2</b><span>Major hike days</span></div><div><b>Aug. 28</b><span>Status re-read</span></div></div>');

// The hero photographs are subject-generic Rainier portfolio work and stay as they
// are; only the two captions and one alt that named closed terrain are corrected.
replaceOnce('alt="Mount Rainier rising above a glowing cloud inversion at sunset near Mount Fremont Lookout"', 'alt="Mount Rainier rising above a glowing cloud inversion at sunset"');

replaceBlock('<nav class="site-nav" aria-label="Page sections">', '</nav>', `<nav class="site-nav" aria-label="Page sections"><a class="site-home" href="index.html">&larr; TravelPlanner home</a><details class="site-nav-menu" open><summary>Packwood / Rainier / Seattle</summary><div class="site-nav-links"><a href="#top">Overview</a><a href="#closure-update">Closures</a><a href="#arrangements">Bookings</a><a href="#stays">Lodging</a><a href="#calendar">Calendar</a><a href="#map">Map</a><a href="#recommended-trails">Best hikes</a><a href="#trail-guide">Trail guide</a><a href="#closed-trails">What is closed</a><a href="#saved-ideas">Saved ideas</a><a href="#itinerary">Day by day</a><a href="#day1">Friday</a><a href="#day2">Saturday</a><a href="#day3">Sunday</a><a href="#day4">Monday</a><a href="#day4c">Seattle max</a><a href="#day5">Tuesday</a><a href="#photo-guide">Photo guide</a><a href="#packing">Packing</a><a href="#food-guide">Food</a><a href="#insider-tips">Tips</a><a href="#sources">Sources</a></div></details></nav>`);

/* --------------------------------------------------------- new sections */

const closureUpdate = section('closure-update', 'Official status &middot; re-read Aug. 28, 2026', 'Rainier is still worth the trip', 'The closure map is serious, but it does not close the mountain. The paid Packwood base still serves the open Paradise, Longmire, Stevens Canyon, Ohanapecosh, Tipsoo, and Chinook Pass corridors.', `<div class="overview">
${card('Open road spine', 'Packwood &rarr; SR 123 &rarr; Stevens Canyon &rarr; Paradise', 'SR 123, Stevens Canyon Road, Paradise Valley Road, Longmire&ndash;Paradise, and the Nisqually corridor are all listed open on the NPS road page (updated Aug. 11). This is the route the revised trip uses.')}
${card('Closed northeast', 'Sunrise + White River', 'Sunrise Road and White River Road are closed to SR 410 for the Grand Park 2 Fire. Every trail originating from those roads is closed with them, including Fremont, Burroughs, Glacier Basin, Emmons Moraine, Sourdough Ridge, Dege Peak, and Silver Forest.')}
${card('Closed Tatoosh pocket', 'Pinnacle Peak / Lane&ndash;Foss ridge', 'The Plummer Peak Fire closes Pinnacle Peak Trail and, in the NPS wording, &ldquo;the ridge from Lane Peak to Foss Peak across the ridge and from Stevens Canyon Road to the southern park boundary.&rdquo; Stevens Canyon Road itself stays open.')}
${card('Where Friday sits', 'Bench &amp; Snow Lakes is east of that boundary', 'The closure&rsquo;s stated eastern edge is Foss Peak at 121&deg;42.8&prime;W. The Bench and Snow Lake Trail runs 121&deg;41.9&prime;&ndash;121&deg;42.2&prime;W &mdash; about a mile east of Foss, past Unicorn Peak &mdash; and the NPS trail report of Aug. 25 lists Pinnacle Peak as the only closed trail in the group. Friday stands, with a same-morning recheck.')}
${card('Other closures', 'Wonderland Complex + Carbon/Mowich', 'The Wonderland Trail is closed from the Carbon River Suspension Bridge to White River Campground for the Wonderland Complex, along with part of the Northern Loop. SR 165 and the Fairfax Bridge separately leave no public Carbon River or Mowich access. Grove of the Patriarchs remains closed for bridge damage, but its parking lot and the Silver Falls access trail remain open.')}
</div><p class="notice"><b>The honest recommendation:</b> go to Rainier and sleep in Packwood. Do not chase the north-side fire boundary. Keep every major hike on the open south/west road spine and recheck the official fire, road, and trail pages plus AQI each morning &mdash; a fire closure can grow overnight.</p>`);

const calendar = section('calendar', 'At a glance', 'A Packwood plan that still feels special', 'The sequence protects one iconic alpine day, one waterfall-and-glacier day, and two shorter scenic hikes without stacking three exhausting days.', `<div class="overview">
${card('Fri &middot; Sept. 4', 'SEA &rarr; Packwood &rarr; Bench &amp; Snow Lakes', 'The original arrival hike survives the closure: 2.5 miles, 700 feet, two alpine lakes, Rainier and Tatoosh views, then cabin check-in.')}
${card('Sat &middot; Sept. 5', 'Skyline Loop at Paradise', 'Keep the best all-around hike in the park: 5.5 miles, 1,700 feet, glacier views, meadow color, wildlife, and huge mountain scale.')}
${card('Sun &middot; Sept. 6', 'Comet Falls &rarr; Van Trump Park', 'The replacement for the lost Fremont sunset: a 320-foot waterfall plus intimate Kautz and Van Trump Glacier views; choose 3.8 or 5.8 miles in real time.')}
${card('Mon &middot; Sept. 7', 'Tipsoo + Naches &rarr; Seattle', 'A 3.5-mile clockwise farewell loop only if the east-side air and visibility are good; otherwise go directly to Seattle.')}
${card('Tue &middot; Sept. 8', 'Seattle morning &rarr; SEA', 'Coffee and one short walk, Budget return by noon, then the fixed 1:45 PM flight.')}
</div>`);

const recommended = section('recommended-trails', 'Research verdict', 'The strongest hikes still open from Packwood', 'These are ranked for scenery, photography, closure confidence, drive logic, and how well they replace the experience you lost on the northeast side.', `<div class="overview">
${card('#1 &middot; Must do', 'Skyline Loop &mdash; 9.7/10', '<b>5.5 mi / 1,700 ft / 4.5 hr.</b> It was already a cornerstone and remains the strongest complete Rainier hike: close glacier detail, meadows, Panorama Point, wildlife, and near-constant scale. Snow-free as of the Aug. 4 NPS reading.')}
${card('#2 &middot; Best new anchor', 'Comet Falls + Van Trump Park &mdash; 9.4/10', '<b>5.8 mi / 2,000 ft / 4&ndash;5 hr.</b> The closest emotional substitute for the Fremont sunset: a 320-foot waterfall followed by a meadow directly below Rainier&rsquo;s Kautz and Van Trump Glaciers. Listed open and snow-free; the trailhead lot is the only real constraint.')}
${card('#3 &middot; Arrival hike, unchanged', 'Bench + Snow Lakes &mdash; 8.8/10', '<b>2.5 mi / 700 ft / 2 hr.</b> Same Stevens Canyon corridor you already planned, and east of the Plummer closure&rsquo;s Foss Peak edge: two lakes, late-summer color, black-bear habitat, and a Rainier reflection in Bench Lake on a calm afternoon.')}
${card('#4 &middot; Best farewell', 'Naches Peak Loop &mdash; 8.7/10', '<b>3.5 mi / 500 ft / 2 hr.</b> Hike clockwise for the mountain reveal, meadows, tarns, and huckleberries. It remains open, but it is closest to the active east-side fire and smoke picture, so it gets a strict same-morning gate.')}
${card('Opt-in hard day', 'Eagle Peak Saddle &mdash; 9.0/10 scenery', '<b>7.2 mi / 2,955 ft / 5 hr.</b> The best true Tatoosh-ridge view left open, and well west of the Lane Peak boundary. Take it only if the group actively wants a steep, strenuous Sunday in place of Comet and Van Trump &mdash; it is not the automatic fallback.')}
${card('Best open lookout alternative', 'Shriner Peak &mdash; 8.9/10 scenery', '<b>8 mi / 3,434 ft / about 5 hr.</b> A historic lookout with commanding Rainier, Ohanapecosh Valley, and Cascade views from an open SR 123 trailhead. It is steep, shadeless, and waterless, so it replaces a major hike only after an early group decision.')}
${card('Weather + parking fallback', 'Rampart Ridge &mdash; 7.8/10', '<b>4.6 mi / 1,339 ft / 2.5 hr.</b> Open old-growth loop from Longmire with Rainier and Nisqually Valley viewpoints. This is the default catch when the Comet Falls lot is full or high ridges are windy or hazy.')}
${card('Best low-smoke / low-cloud fallback', 'Silver Falls &mdash; 7.7/10', '<b>2 mi / 300 ft / about 1 hr.</b> A forceful 60-foot river waterfall reached from the seasonally open Grove of the Patriarchs parking lot. The grove is closed, but NPS explicitly keeps this trail access open.')}
</div><p class="notice"><b>Why Comet beats Eagle for this trip:</b> it delivers a huge waterfall and direct glacier drama with 955 feet less climbing, lets you turn around at the falls if smoke or fatigue rises, and leaves enough energy for Monday&rsquo;s farewell hike and Seattle.</p>`);

const closedTrails = section('closed-trails', 'Access rules', 'What stays closed—and what only looks closed', 'Several famous trails still appear in old blogs, cached maps, and saved lists. Most are not options for these dates; Silver Falls is the important routing exception.', `<div class="overview">
${card('No access', 'Fremont, Burroughs, Glacier Basin, Emmons, Dege, Silver Forest', 'All originate from the closed Sunrise or White River roads. Do not route around the gates or treat a trail app&rsquo;s &ldquo;open&rdquo; label as authoritative.')}
${card('Fire closure', 'Pinnacle Peak and the Lane&ndash;Foss ridge', 'Pinnacle is the one trail NPS names as closed in this pocket. Do not turn Eagle Peak or Bench &amp; Snow into an off-trail ridge traverse toward the closed ground.')}
${card('No public access', 'Tolmie Peak + Spray Park', 'The SR 165 / Fairfax Bridge closure means there is no normal public road access to Carbon River or Mowich Lake, and no alternate route.')}
${card('Open with a routing caveat', 'Silver Falls', 'The Ohanapecosh Campground connection is closed, so it is not a loop. NPS confirms the Grove of the Patriarchs parking lot and the Eastside/Silver Falls trail access remain open; use the signed out-and-back and do not enter the closed grove.')}
</div>`);

/* ------------------------------------------------------------ carousels */

const skylinePhotos = carousel('day2-car', figuresFor('google_trail_car_skyline_', 5));
const nachesPhotos = carousel('day4-car', figuresFor('google_trail_car_naches_', 5));

const G = 'Google Images source';
const arrivalPhotos = carousel('day1-car', [
  photo('google_reflection_lakes_01.jpg', 'https://www.flickr.com/photos/phils-pixels/26310310695/', 'Rainier Reflections', `Phil Kuntz &middot; ${G}`, 'Mount Rainier mirrored in Reflection Lake at sunrise with mist over the meadow'),
  photo('google_faraway_rock_01.jpg', 'https://www.flickr.com/photos/kmichie/48370137901/', 'View from Faraway Rock', `Kelley Diwan &middot; ${G}`, 'Louise Lake and the Tatoosh Range seen from Faraway Rock on the Lakes Trail'),
  photo('google_reflection_lakes_02.jpg', 'https://www.flickr.com/photos/sun87ny/30152510473/', 'Reflection Lake, Washington', `Sunny Herzinger &middot; ${G}`, 'Still Reflection Lake mirroring Mount Rainier under a pastel morning sky'),
  photo('google_reflection_lakes_03.jpg', 'https://www.flickr.com/photos/phils-pixels/25356937384/', 'Late colour on the shoreline', `Phil Kuntz &middot; ${G}`, 'Late-summer colour along the shore of Reflection Lake below Mount Rainier'),
  photo('google_reflection_lakes_04.jpg', 'https://www.flickr.com/photos/phils-pixels/44433244331/', 'Morning at Reflection Lake', `Phil Kuntz &middot; ${G}`, 'Mount Rainier and forest reflected in Reflection Lake on a calm morning'),
  photo('google_reflection_lakes_05.jpg', 'https://www.flickr.com/photos/ania_nyc/48529554092/', 'Afterglow', `Ania Tuzel Photography &middot; ${G}`, 'Pink and violet afterglow over Reflection Lake and Mount Rainier')
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
  id: 'tg-bench-snow', label: 'Bench &amp; Snow', kicker: '#3 &middot; Highest payoff per arrival-day mile',
  title: 'Bench + Snow Lakes', status: 'Scheduled Friday',
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
  whyHead: 'Why it survives the closure',
  why: 'The Plummer Peak Fire closure is bounded east by Foss Peak; this trail begins about a mile further east, past Unicorn Peak, and the NPS trail report of Aug. 25 names Pinnacle Peak as the only closed trail in the group. You get two alpine lakes, a Rainier reflection in Bench Lake when the air is still, and the same Stevens Canyon drive the original plan used &mdash; without touching closed ground.',
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

const cometCard = tgTrail({
  id: 'tg-comet', label: 'Comet Falls', kicker: '#2 &middot; Best new full-day anchor',
  title: 'Comet Falls + Van Trump Park', status: 'Scheduled Sunday',
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
  whyHead: 'Why this replaces the Fremont sunset',
  why: 'It is the one remaining open hike that still delivers a single overwhelming set piece: a 320-foot waterfall you approach from below, then a hanging meadow directly under the Kautz and Van Trump Glaciers. Christine Falls sits on the drive in as a two-minute roadside stop, so the day starts strong before the first step of climbing.',
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
  why: 'Eagle Peak is west of Lane Peak and therefore outside the Plummer closure entirely. It buys the Tatoosh-ridge perspective that Pinnacle would have given, at nearly a thousand feet more climbing than Comet Falls. Take it only as a deliberate group choice for a hard Sunday &mdash; it is not the fallback when the Comet lot is full.',
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
  why: 'This is the strongest still-accessible fire-lookout hike near the paid Packwood base: commanding views of Rainier, the Ohanapecosh Valley, and the Cascades without using Sunrise, White River Road, or the closed Pinnacle pocket. It is substantially harder than Skyline or Comet, so it is a chosen objective rather than a casual fallback.',
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
    ['Use it when', 'Arrival is too late for Bench + Snow<br>but there is still safe daylight']
  ],
  whyHead: 'Why it is better than forcing the primary',
  why: 'It preserves the two arrival-day payoffs that matter &mdash; a Rainier reflection and a high look into Stevens Canyon &mdash; while starting 1.5 miles earlier than Bench and Snow Lakes. It can also be shortened to the shoreline if the flight or holiday traffic removes the hiking window.',
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

// Restore the 50KB baseline field guide, drop trails now behind closures, and add
// the scheduled hikes plus the strongest closure-compatible alternatives.
let trailGuide = sectionFromBaseline('trail-guide');
trailGuide = dropArticles(trailGuide, 'tg-trail', [
  'First + Second Burroughs', 'Pinnacle Saddle', 'Mount Fremont Lookout',
  'Dege Peak', 'Emmons Moraine', 'Silver Forest + Emmons Vista'
]);
trailGuide = edit(trailGuide, [
  ['<h2>Ten view-first hikes worth knowing</h2>', '<h2>Eleven closure-compatible trails worth knowing</h2>'],
  ['Every featured trail includes ten portfolio-grade photographs; tap any image to open its source.',
   'Six trails behind the Sunrise, White River, and Plummer Peak closures were removed. The guide now keeps every scheduled hike plus the strongest short, strenuous, weather-flex, and parking-flex alternatives that remain accessible from Packwood. Tap any image to open its source.'],
  ['<h3>Open the full trail field guide</h3><p>Ten recommendations &middot; 50 trail-specific photos &middot; review intel &middot; cabin-to-trailhead drives</p>',
   '<h3>Open the full trail field guide</h3><p>Eleven closure-compatible recommendations &middot; 32 trail-specific photos &middot; official access gates &middot; cabin-to-trailhead logic</p>'],
  ['<div><b>How to read the ten</b><span>Fremont, Skyline, and Pinnacle are scheduled. Burroughs and Naches remain strong view-first alternates, followed by easier, shorter, and weather-flex options for the same trailheads.</span></div>',
   '<div><b>How to read the eleven</b><span>Bench &amp; Snow, Skyline, and Comet are scheduled; Naches is conditional. Lakes/Faraway, Deadhorse/Moraine, Rampart and Silver Falls solve time, weather, smoke and parking failures. Eagle and Shriner are the two legitimate hard-day upgrades. High Rock remains conditional on a fresh Forest Service access check.</span></div>'],
  ['<article class="tg-trail" id="tg-skyline">', `${benchSnowCard}<article class="tg-trail" id="tg-skyline">`],
  ['<article class="tg-trail" id="tg-naches">', `${cometCard}<article class="tg-trail" id="tg-naches">`],
  ['<span class="tg-status alt">Only if Fremont cancels</span>', '<span class="tg-status alt">Optional Monday farewell</span>'],
  ['<h4>When it comes back</h4><p>Restore the loop only if Fremont is canceled or ends early enough to protect sleep.',
   '<h4>When it comes back</h4><p>Hike it only if Monday&rsquo;s east-side air, visibility, and traffic all pass the morning gate.'],
  ['<article class="tg-trail" id="tg-high-rock">', `${eagleCard}${shrinerCard}${rampartCard}${lakesCard}${silverCard}<article class="tg-trail" id="tg-high-rock">`],
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
   '<p>One night in the city, photographed as the itinerary actually unfolds: Pike Place, Overlook Walk and the waterfront, one Kerry Park payoff, then dinner and a rooftop drink.</p>'],
  ['<p class="pg-tag">The skyline frame</p>', '<p class="pg-tag">The city sequence</p>'],
  ['<h3>Kerry Park &amp; Pike Place</h3>', '<h3>Pike Place to the rooftop</h3>'],
  ['<h3>The exact light plan &mdash; Fremont sunset &amp; Seattle blue hour</h3>', '<h3>The exact light plan &mdash; Reflection Lakes dawn &amp; Seattle blue hour</h3>'],
  ['<p>Rainier makes its own weather, so the whole plan flexes on whether the summit is out. Protect Mount Fremont for Sunday golden hour and sunset, keep Pinnacle/Skyline as clear-mountain priorities, and treat Tipsoo as a quick Monday bonus. Reflection Lakes remains in this photo reference only; it is no longer worth a dedicated dawn alarm.</p>',
   '<p>Rainier makes its own weather, so the whole plan flexes on whether the summit is out. With Sunrise and the Fremont lookout closed, the signature frames move to the south side: Reflection Lakes and Faraway Rock in still morning air, Skyline for glacier scale, Comet Falls and Van Trump Park for water and ice, and Tipsoo as a quick Monday bonus.</p>'],
  ['<div class="pg-warning"><b>Cloud inversion reality check:</b> the orange sea-of-clouds image is a rare weather payoff, not a schedulable event. Your best odds are to be high while a low marine layer fills the valleys, with the summit and trail above cloud. Check the Paradise/Sunrise webcams, hourly cloud-base forecast, wind, and smoke before committing. Roads and high-country access can still change on short notice.</div>',
   '<div class="pg-warning"><b>Fire-season reality check:</b> smoke, not cloud, is the variable that will decide these frames. Haze flattens contrast long before it looks dangerous, and a mountain that reads clear from Packwood can be invisible from Paradise. Check the Paradise webcam, the AirNow smoke map, and the NPS fire page before committing to any dawn alarm &mdash; and remember the closure boundary itself can move overnight.</div>'],
  ['<li>Two headlamps with red mode, microfiber cloths, and warm layers for the Fremont sunset walk-out.</li>',
   '<li>Two headlamps with red mode, microfiber cloths, and a fast lens cloth for spray at Comet Falls.</li>'],
  ['<p>On your dates, Rainier sunrise shifts from 6:30 to 6:34 AM and sunset from 7:40 to 7:34 PM. Sunday evening is reserved for Mount Fremont; the other dawn times are reference only, not scheduled alarms.</p>',
   '<p>On your dates, Rainier sunrise shifts from 6:30 to 6:34 AM and sunset from 7:40 to 7:34 PM. Sunday morning is the one real alarm &mdash; the Comet Falls lot, not the light, sets it. Friday is an afternoon arrival window and the other dawn times are reference only.</p>'],
  ['<p class="pg-tag">Optional reference &middot; not scheduled</p>', '<p class="pg-tag">Friday &middot; arrival-day shoot + fallback</p>'],
  ['<p>The lakes sit beside the Pinnacle trailhead corridor on Stevens Canyon Road. Do not make a separate drive; glance only if you are already parked for Pinnacle and the water is perfectly calm.</p>',
   '<p>The lakes sit on Stevens Canyon Road, 1.5 miles west of the Bench &amp; Snow trailhead. They are on the way in and out on Friday, and the Lakes Trail from here climbs 1.3 miles to Faraway Rock above Louise Lake.</p>'],
  ['<p><b>Not scheduled.</b> Sunrise remains the best photographic window, but Skyline parking margin, sleep, and Fremont matter more on this trip. The card stays here only as an optional weather-and-timing reference.</p>',
   '<p><b>Friday 4:30&ndash;7:40 PM</b> on the way to or from Bench &amp; Snow, when still evening air gives the best mirror. If the arrival runs late, this replaces the hike outright: shoreline plus the Lakes Trail to Faraway Rock is 2.6 miles and 500 feet.</p>'],
  ['<p class="pg-tag">Flagship meadow + arrival-day saddle</p>', '<p class="pg-tag">Flagship meadow &middot; Saturday</p>'],
  ['<h3>Paradise, Skyline + Pinnacle Saddle</h3>', '<h3>Paradise + the Skyline Loop</h3>'],
  ['<p>Skyline starts at Paradise, 5,400 ft. Pinnacle starts across the road from Reflection Lakes and ends at the maintained 5,920-ft saddle in the Tatoosh Range.</p>',
   '<p>Skyline starts at Paradise, 5,400 ft, and tops out near Panorama Point at 6,800 ft. The Pinnacle Saddle frames that used to pair with it are closed for the Plummer Peak Fire.</p>'],
  ['<p>Friday: stop at the Pinnacle trailhead only if you can be hiking by 3:15 PM. Saturday: drive directly to Paradise and start Skyline around 7:15 AM.</p>',
   '<p>Saturday: drive the open Stevens Canyon route directly to Paradise and start Skyline around 7:15 AM. Parking, not light, is what the early start buys.</p>'],
  ['<p><b>Pinnacle Friday:</b> 4:30&ndash;6:15 PM is the realistic arrival-day window; golden hour begins 6:40, so catch its edge while descending and be off before the 7:40 sunset. <b>Skyline Saturday:</b> about 7:15 AM&ndash;12:15 PM, prioritizing parking and a clear morning summit.</p>',
   '<p><b>Skyline Saturday:</b> about 7:15 AM&ndash;12:15 PM, prioritising parking and a clear morning summit. The best mountain light is before 10 AM; by midday the glaciers go flat and the meadow colour is the stronger subject.</p>'],
  ['<p>At Pinnacle, use Rainier north of the trail as the main subject and turn south at the saddle for layered volcanoes. On Skyline, photograph the glaciers, trail scale, and meadow curves&mdash;the waterfall is only one foreground.</p>',
   '<p>On Skyline, photograph the glaciers, trail scale, and meadow curves &mdash; Myrtle Falls is only one foreground and it is the most photographed one. Turn around on the descent for the Tatoosh ridgeline behind you.</p>'],
  ['<li>Rainier rising above the Pinnacle trail with a hiker small against the mountain.</li>', '<li>Panorama Point with a hiker small against the Nisqually Glacier headwall.</li>'],
  ['<li>At Pinnacle Saddle, turn south for Adams, St. Helens, and Hood between the Tatoosh spires.</li>', '<li>From the high Skyline traverse, look south past the Tatoosh for Adams, St. Helens, and Hood on a clear morning.</li>']
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
  ['<h3>Pinnacle Saddle</h3><p>Yes. This is the best arrival-day upgrade: short, steep, and immediately cinematic, with Rainier across Paradise and the southern volcanoes behind the saddle. Stop at the maintained saddle&mdash;do not copy summit scrambles from reels.</p><span class="saved-when">Friday &middot; start only if you reach the trailhead by 3:15 PM</span>',
   '<h3>Bench + Snow Lakes</h3><p>Yes &mdash; and it is the one Tatoosh-corridor hike the Plummer Peak Fire did not take. Two alpine lakes in 2.5 miles, a Rainier reflection in Bench Lake on still afternoons, and no exposure to the closed Lane&ndash;Foss ridge further west. Stay on the signed trail.</p><span class="saved-when">Friday &middot; start only if you reach the trailhead by 4:30 PM</span>'],
  ['<p>Worth doing on a clear day, but not ahead of Burroughs.', '<p>Worth doing on a clear day, but not ahead of Comet Falls and Van Trump Park.'],
  ['its Elbe excursion block conflicts with Pinnacle, Skyline, or Burroughs.', 'its Elbe excursion block conflicts with Bench &amp; Snow, Skyline, or Comet Falls.']
]);

let packing = sectionFromBaseline('packing');
packing = edit(packing, [
  ['a cold post-sunset walk above 7,000 feet.', 'a cold, spray-soaked hour at the base of a waterfall.'],
  ['Sunrise starts at 6,400 feet and Fremont reaches an exposed ridge above 7,000 feet, so the sunset route needs substantially more insulation than Packwood suggests.',
   'Paradise sits at 5,400 feet and the Skyline high traverse crosses 6,800, while Comet Falls holds cold spray and shade all morning &mdash; both need more insulation than a mild Packwood morning suggests.'],
  ['<span class="pack-time">Sunday &middot; 3:45&ndash;9:15 PM</span><h4>Mount Fremont sunset</h4><span class="pack-temp">Expected air: 38&ndash;55&deg;F &middot; exposed wind after sunset can feel near 30&ndash;40&deg;F</span><p><b>Wear:</b> wicking base, hiking pants, and grippy trail footwear. <b>Carry even if Packwood is warm:</b> midweight fleece, hooded puffy, waterproof wind shell, warm hat, and real gloves. Put layers on <em>before</em> settling at the lookout. Each person carries a headlamp with spare power; add thin thermal bottoms if the trip-week forecast shows near-freezing temperatures or strong wind.</p>',
   '<span class="pack-time">Sunday &middot; 5:15 AM&ndash;2:00 PM</span><h4>Comet Falls + Van Trump Park</h4><span class="pack-temp">Expected air: 38&ndash;58&deg;F &middot; falls basin stays cold, shaded and wet all morning</span><p><b>Wear:</b> wicking base, hiking pants, and grippy trail footwear with real tread &mdash; the rock near the falls stays slick from spray. <b>Carry even if Packwood is warm:</b> midweight fleece, waterproof shell, warm hat, and light gloves for the pre-dawn drive and the cold amphitheatre below the falls. Poles help on the descent. Each person carries a headlamp for the dark start.</p>'],
  ['The full alpine kit stays packed unless Fremont was canceled and Naches is deliberately restored.', 'The full alpine kit stays packed unless the Naches loop is deliberately hiked.'],
  ['<h4>Pinnacle, Packwood + city</h4><span class="pack-temp">Pinnacle 3:15&ndash;5:45 PM: 48&ndash;58&deg;F &middot; Packwood/Seattle: roughly 55&ndash;72&deg;F</span><p><b>Pinnacle:</b> hiking pants, breathable base, fleece in the pack, and shell immediately available; the saddle is windy even when the trailhead feels pleasant.',
   '<h4>Bench &amp; Snow, Packwood + city</h4><span class="pack-temp">Lakes 4:30&ndash;6:30 PM: 48&ndash;60&deg;F &middot; Packwood/Seattle: roughly 55&ndash;72&deg;F</span><p><b>Bench &amp; Snow:</b> hiking pants, breathable base, fleece in the pack, and shell immediately available; the lake basins cool quickly once the sun drops behind the Tatoosh.']
]);

const foodGuide = sectionFromBaseline('food-guide');

let insiderTips = sectionFromBaseline('insider-tips');
insiderTips = edit(insiderTips, [
  ['particularly relevant when moving between Packwood, Paradise, Tipsoo, and Sunrise.', 'particularly relevant this year, when the Sunrise and White River approaches are gated and a stale route may still send you at them.'],
  ['<div class="tip-tag">Pinnacle</div> <div><h3>The saddle is the destination</h3><p>Reels often continue onto Pinnacle or Plummer, but the maintained NPS trail ends at the saddle. The summit extensions cross loose, exposed terrain. The saddle already delivers the giant Rainier view and is the correct arrival-day endpoint.</p><p class="tip-cites"><span>Source:</span> <a href="https://www.nps.gov/mora/planyourvisit/pinacle-peak.htm" target="_blank" rel="noreferrer">NPS Pinnacle Peak Trail</a></p></div>',
   '<div class="tip-tag">Comet Falls</div> <div><h3>The parking lot is the whole plan</h3><p>Sixteen spaces, no overflow, and no legal shoulder. Leave Packwood by 5:15 AM to be in the lot around 6:45. If it is full, do not circle and do not park on the road &mdash; drive on to Longmire and hike Rampart Ridge. Eagle Peak is a deliberate opt-in for a hard day, not the consolation prize.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm" target="_blank" rel="noreferrer">NPS Comet Falls / Van Trump</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/rampart-ridge-trail.htm" target="_blank" rel="noreferrer">NPS Rampart Ridge</a></p></div>'],
  ['At Paradise, use the signed overflow at the Picnic Area or Paradise Valley Road, then choose between full Skyline, Myrtle Falls, Nisqually Vista, or Narada/Christine based on the mountain. At Sunrise, a full lot means metered entry at White River&mdash;not an improvised roadside park.',
   'At Paradise, use the signed overflow at the Picnic Area or Paradise Valley Road, then choose between full Skyline, Myrtle Falls, Nisqually Vista, or Narada/Christine based on the mountain. At Comet Falls there is no overflow at all, so the fallback is a different trailhead entirely.'],
  ['<div class="tip-tag">Day plan</div> <div><h3>Pack the Sunrise day like services might close early</h3><p>Bring the entire Fremont-day food and water supply from Packwood. Sunrise facilities are seasonal and the park explicitly tells visitors to bring supplies; the late-afternoon start is too important to gamble on a caf&eacute; queue or seasonal hours.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/hours.htm" target="_blank" rel="noreferrer">NPS operating hours</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/road-status.htm" target="_blank" rel="noreferrer">NPS road status</a></p></div>',
   '<div class="tip-tag">Day plan</div> <div><h3>Carry the whole Sunday supply from Packwood</h3><p>The Comet Falls trailhead has no water, no food, and no reliable toilet, and you will be there before Longmire opens. Pack breakfast, lunch, and recovery food the night before &mdash; a 5:15 AM departure leaves no room for a caf&eacute; stop.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/hours.htm" target="_blank" rel="noreferrer">NPS operating hours</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/road-status.htm" target="_blank" rel="noreferrer">NPS road status</a></p></div>'],
  ['<div class="tip-tag">Sunrise</div> <div><h3>Use the late start, but do not trust late parking</h3><p>Fremont at sunset naturally avoids the busiest trail hours, yet the Sunrise lot can still be metered or full when you arrive. Check live conditions before leaving Packwood and keep enough schedule margin to wait at White River rather than improvising roadside parking.</p><p class="tip-cites"><span>Source:</span> <a href="https://www.nps.gov/mora/planyourvisit/congestion.htm" target="_blank" rel="noreferrer">NPS congestion guidance</a></p></div>',
   '<div class="tip-tag">Closures</div> <div><h3>Re-read the fire page every morning, not once</h3><p>A closure that does not affect your trail tonight can affect it tomorrow. The fire and trail-status pages were updated Aug. 27; the road table still carries an Aug. 11 date but says it changes whenever road status changes. Trail apps can lag all three. The NPS fire, trail, and road pages together are the authority at the trailhead.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/learn/news/fire.htm" target="_blank" rel="noreferrer">NPS wildland fire information</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm" target="_blank" rel="noreferrer">NPS trail status report</a></p></div>'],
  ['<div class="tip-tag">Fremont</div> <div><h3>Sunrise wins the mountain light; sunset wins the trip</h3><p>The lookout sits north-northeast of Rainier, so dawn illuminates the visible east-facing slopes most directly. From Packwood, however, sunrise demands a roughly 2 AM departure and a dark rocky approach. The scheduled sunset keeps the outbound hike in daylight and uses the lookout, sky, and layered northern Cascades as the evening composition.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/mount-fremont-lookout.htm" target="_blank" rel="noreferrer">NPS Fremont route</a> &middot; <a href="https://www.photohound.co/spot/mount-fremont-lookout-mount-rainier-1001015" target="_blank" rel="noreferrer">PhotoHound light guidance</a></p></div>',
   '<div class="tip-tag">Light</div> <div><h3>The south side trades sunset drama for morning stillness</h3><p>Losing Fremont costs the trip its one great sunset position. The compensation is that Reflection Lakes and Bench Lake mirror best in still air, and Comet Falls is a shade-and-spray subject that actually prefers an overcast or early-morning sky. Plan for calm water and soft light rather than a fiery ridge.</p><p class="tip-cites"><span>Sources:</span> <a href="https://www.nps.gov/mora/planyourvisit/paradise-basic-info.htm" target="_blank" rel="noreferrer">NPS Paradise area guide</a> &middot; <a href="https://www.nps.gov/mora/planyourvisit/bench-snow-lake-trail.htm" target="_blank" rel="noreferrer">NPS Bench &amp; Snow Lake Trail</a></p></div>'],
  ['<div class="tip-tag">Sunset</div> <div><h3>Check wind and cloud elevation, not just the forecast icon</h3><p>Fremont&rsquo;s final ridge is rocky and exposed. Use the Sunrise webcam, hourly cloud layers, smoke map, and ridge wind before committing. A blue weather icon is not enough if the mountain is capped or the ridge is dangerously windy; if visibility is poor, keep the hike low or turn around.</p>',
   '<div class="tip-tag">Air</div> <div><h3>Check smoke and cloud elevation, not just the forecast icon</h3><p>A blue weather icon says nothing about smoke. Use the Paradise webcam, hourly cloud-base layers, and the AirNow fire and smoke map before committing to a high traverse. If the summit is capped or AQI is climbing, drop to Rampart Ridge, the Grove-free lower forest, or the lakes rather than pushing the ridge.</p>']
]);

/* ------------------------------------------------------------------ days */

const days = [
  day({id:'day1',cls:'c1',badge:'Fri',date:'Sept. 4',title:'SEA &rarr; Bench &amp; Snow Lakes &rarr; Packwood',feel:'The arrival hike you already wanted, on ground the fire closure never reached',facts:[['Land','SEA 10:25 AM'],['Drive','Budget pickup &rarr; Stevens Canyon entrance'],['Hike','2.5 mi / 700 ft / about 2 hr'],['Cabin','Packwood check-in after the hike']],note:'This is the original Friday plan, kept because the Plummer Peak closure stops at Foss Peak and this trailhead sits about a mile east of it. If you cannot begin by roughly 4:30 PM, drop to Reflection Lakes and the Lakes Trail to Faraway Rock, or just the shoreline and Box Canyon overlooks, then go to the cabin.',spot:'Bench and Snow Lake Trail',photos:arrivalPhotos,flow:'Pick up the rental, buy water and trail food, then drive US 12 to Packwood and in through the Stevens Canyon Entrance. The pullout is 1.5 miles east of Reflection Lakes. Walk past Bench Lake to Snow Lake, turn around there, and stay off unofficial Tatoosh routes. Continue to the Packwood cabin for night one.',reality:'Go only if Stevens Canyon Road, the trail, AQI, and daylight all pass. The Plummer closure runs from Lane Peak to Foss Peak and south of Stevens Canyon Road; this trail is east of that span, but re-read the NPS fire page that morning because the boundary has already moved once. A late flight or holiday traffic converts this to the Reflection Lakes fallback.',cost:'No timed-entry reservation is required anywhere in Mount Rainier in 2026. Carry a valid park entrance pass; the park is cashless.',food:'Carry a substantial late lunch. Packwood Brewing Co. is the easy post-hike dinner only if current Friday hours fit.',map:'Bench and Snow Lake Trail Mount Rainier',alts:[{title:'Lakes Trail + Faraway Rock',href:'https://www.nps.gov/places/reflection-lakes.htm',body:'the best true swap when arrival is late but you still have 1.5&ndash;2 safe hours; about three miles with the Reflection Lakes mirror and the Louise Lake / Stevens Canyon overlook.'},{title:'Silver Falls',href:'https://www.nps.gov/thingstodo/mount-rainier-off-the-beaten-path.htm',body:'the better low-cloud or low-smoke objective if the south entrance remains open; 2 miles / 300 feet from Grove parking, without entering the closed grove.'},{title:'Reflection Lakes shoreline + Box Canyon',href:'https://www.nps.gov/places/reflection-lakes.htm',body:'use only when the hiking window is gone. Photograph the legal shoreline pullouts, make the short Box Canyon stop, and protect cabin check-in.'}],links:[['NPS Bench &amp; Snow Lakes','https://www.nps.gov/mora/planyourvisit/bench-snow-lake-trail.htm'],['NPS trail status report','https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],['NPS fire information','https://www.nps.gov/mora/learn/news/fire.htm']]}),
  day({id:'day2',cls:'c2',badge:'Sat',date:'Sept. 5',title:'Skyline Loop + Paradise',feel:'The irreplaceable classic stays exactly where it belongs',facts:[['Leave cabin','About 5:45 AM'],['Trail start','Aim for 7:00&ndash;7:15 AM'],['Hike','5.5 mi / 1,700 ft / 4.5&ndash;5.5 hr'],['Cabin','Packwood &middot; night 2']],note:'Hike clockwise via Panorama Point and use the High Skyline connector if posted conditions direct it. Do not add Pebble Creek or Muir Snowfield travel.',spot:'Skyline Trail via Panorama Point',photos:skylinePhotos,flow:'Drive the open Stevens Canyon&ndash;Paradise route and park before the holiday crowd. Start at the stone steps by Jackson Visitor Center, climb clockwise to Panorama Point, stay on the signed Skyline route, descend through Paradise Valley and Myrtle Falls, then have a relaxed lunch. Add Narada Falls or Reflection Lakes only if parking and energy are easy.',reality:'This is the trip&rsquo;s highest-priority clear-air window. If AQI is unhealthy, the summit is fully obscured, or the park expands the closure, swap Saturday and Sunday or use the lower Longmire fallback.',cost:'Park entrance pass required; no 2026 timed entry. Parking is the constraint, so the early start matters even on an open road.',food:'Carry breakfast and trail lunch. Treat Paradise food service as a bonus, not the plan.',map:'Skyline Trail Paradise Mount Rainier',alts:[{title:'Swap in Comet Falls + Van Trump Park',href:'https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm',body:'the best like-for-like schedule move when Paradise alone is clouded or inaccessible and Sunday looks better for Skyline.'},{title:'Shriner Peak Fire Lookout',href:'https://www.nps.gov/mora/planyourvisit/shriner-peak.htm',body:'the strongest open full-day lookout alternative: 8 miles / 3,434 feet from SR 123. Choose it only with clear air, an open trail, an early start, and unanimous appetite for a much harder climb.'},{title:'Deadhorse Creek + Moraine',href:'https://www.nps.gov/mora/planyourvisit/day-hiking-at-mount-rainier.htm',body:'the best shorter Paradise version when the road and lower meadows are good but time, wind, or legs rule out the full Skyline; about 2.5 miles and 1.5&ndash;2 hours.'}],links:[['NPS Skyline Trail','https://www.nps.gov/mora/planyourvisit/skyline-trail.htm'],['NPS trail status report','https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm'],['Paradise visitor guide','https://www.nps.gov/mora/planyourvisit/paradise-basic-info.htm']]}),
  day({id:'day3',cls:'c3',badge:'Sun',date:'Sept. 6',title:'Comet Falls &rarr; Van Trump Park',feel:'Waterfall thunder first, then a meadow directly beneath Rainier&rsquo;s glaciers',facts:[['Leave cabin','By 5:15 AM'],['In the lot','Target 6:45 AM &middot; 16 spaces'],['Primary','5.8 mi / 2,000 ft / 4&ndash;5 hr'],['Short option','Comet Falls only &middot; 3.8 mi / 900 ft']],note:'This is the best new full-day anchor and the parking ladder is the plan: leave Packwood by 5:15 AM (routers put the drive at 1:23) to be in the sixteen-space lot by about 6:45. There is no overflow and no legal shoulder. Lot full &rarr; drive on to Longmire and hike Rampart Ridge, the default fallback. Eagle Peak is a deliberate group opt-in for a hard day, never the consolation prize.',spot:'Comet Falls and Van Trump Park',photos:waterfallPhotos,flow:'Drive toward Longmire and Paradise; the trailhead is four miles east of Longmire, just above Christine Falls. Climb 1.8 miles to the 320-foot falls. Continue 0.8 mile to the junction and another 0.5 mile into Van Trump Park. Return the same way. Mildred Point is deliberately omitted because it raises the day to 6.6 miles and 2,850 feet.',reality:'Turn around at Comet Falls if smoke increases or the mountain disappears; the meadow above is the part that needs visibility. Spray keeps the rock near the falls slick well into the morning, so poles and real tread matter more than the mileage suggests.',cost:'Park entrance pass covers this corridor. There is no overflow lot and no trail shuttle.',food:'Pack breakfast, lunch, and recovery snacks the night before. Use Longmire or Packwood for an early dinner.',map:'Comet Falls Trailhead Mount Rainier',alts:[{title:'Rampart Ridge Loop',href:'https://www.nps.gov/mora/planyourvisit/rampart-ridge-trail.htm',body:'the automatic full-lot or high-wind fallback. Continue to Longmire for 4.6 miles / 1,339 feet through old growth and two Rainier viewpoints.'},{title:'Eagle Peak Saddle',href:'https://www.nps.gov/mora/planyourvisit/upload/Eagle-Peak-Trail-Dec18.pdf',body:'the best harder scenic substitute, with the Tatoosh-ridge perspective lost at Pinnacle; 7.2 miles / 2,955 feet and a firm stop at the maintained saddle.'},{title:'Silver Falls',href:'https://www.nps.gov/places/grove-of-the-patriarchs-trailhead.htm',body:'the correct low-elevation pivot when cloud or smoke ruins every mountain-view hike but the south-side roads and air remain safe.'}],links:[['NPS Comet Falls / Van Trump','https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm'],['NPS Eagle Peak brochure','https://www.nps.gov/mora/planyourvisit/upload/Eagle-Peak-Trail-Dec18.pdf'],['NPS Rampart Ridge','https://www.nps.gov/mora/planyourvisit/rampart-ridge-trail.htm']]}),
  day({id:'day4',cls:'c4',badge:'Mon',date:'Sept. 7',title:'Tipsoo + Naches Peak &rarr; Seattle',feel:'A final mountain reveal without gambling the Seattle handoff',facts:[['Cabin','Checkout early; deadline 11:00 AM'],['Optional hike','3.5 mi / 500 ft / about 2 hr'],['Direction','Clockwise for best Rainier views'],['Seattle','Target 2:30&ndash;4:00 PM arrival']],note:'This is the only planned stop near the northeast fire complex, though it begins from open SR 410 and Tipsoo rather than the closed Sunrise Road. If smoke is visible, AQI is worsening, or the closure expands, skip it and go directly to Seattle.',spot:'Tipsoo Lake and Naches Peak Loop',photos:nachesPhotos,flow:'Check out early with the car packed. Drive SR 123 to Cayuse Pass and open SR 410 to Tipsoo. If the go/no-go passes, hike clockwise and leave by about 10:30&ndash;11:00. Drive to Seattle, check in or drop bags, then use Pike Place, Overlook Walk, the waterfront, and Kerry Park only as arrival time allows.',reality:'Naches is listed open, but smoke from the Wonderland Complex and nearby Backbone Fire can be visible from SR 123 and US 12, and the fires can change access overnight. The hike loses to any closure, unhealthy air, poor visibility, or major Labor Day traffic delay.',cost:'Park pass required at Tipsoo. Seattle parking is extra; park once near the lodging.',food:'Bring trail breakfast. Use Pike Place for a flexible late lunch, then a simple nearby dinner.',map:'Naches Peak Loop Tipsoo Lake',alts:[{title:'Silver Falls before Seattle',href:'https://www.nps.gov/thingstodo/mount-rainier-off-the-beaten-path.htm',body:'the best actual trail swap if the northeast gate fails but SR 123, the Stevens Canyon Entrance, and south-side air remain safe; 2 miles / 300 feet from Grove parking.'},{title:'Lakes Trail + Faraway Rock',href:'https://www.nps.gov/places/reflection-lakes.htm',body:'use only if Stevens Canyon is open, the west side is visibly clearer, and the extra drive still protects a comfortable Seattle arrival.'},{title:'Go directly to Seattle',href:'https://wsdot.com/Travel/Real-time/Map/',body:'this beats every substitute when AQI, fire spread, or Labor Day traffic is the problem. It converts the afternoon into the full Pike Place / waterfront / Kerry Park plan.'}],links:[['NPS Naches Peak Loop','https://www.nps.gov/mora/planyourvisit/natches-peak-loop.htm'],['NPS fire information','https://www.nps.gov/mora/learn/news/fire.htm'],['WSDOT real-time map','https://wsdot.com/Travel/Real-time/Map/']]}),
  day({id:'day4b',cls:'c4',badge:'Mon',date:'Sept. 7 &middot; afternoon',title:'Seattle waterfront + golden hour',feel:'A flexible city finish after the mountain drive',facts:[['Walk','Pike Place &rarr; Overlook Walk &rarr; waterfront'],['Sunset','Kerry Park if arrival supports it'],['Sleep','W Seattle &middot; 1112 4th Ave'],['Booking','Single confirmed Seattle night']],note:'If Naches is skipped, Seattle becomes an unhurried half-day. If the hike happens, keep only Pike Place, dinner, and Kerry Park.',spot:'Pike Place, waterfront and Kerry Park',photos:seattleMondayPhotos,flow:'Park near the lodging, leave bags if available, and walk rather than repeatedly moving the car. Make Kerry Park the only cross-town sunset target.',reality:'Labor Day traffic can erase an hour. Drop attractions from the end of the list rather than compressing the airport-day plan.',cost:'Pike Place, the waterfront, and Kerry Park are free; budget for downtown parking.',food:'Flexible market lunch; simple dinner near the lodging.',map:'Pike Place Market Seattle',alts:[{title:'Late-arrival edit',href:'https://www.pikeplacemarket.org/',body:'do Pike Place, Overlook Walk, and dinner on foot; drop Kerry Park rather than turning the evening into another drive.'},{title:'Early-arrival edit',href:'https://waterfrontparkseattle.org/',body:'if Naches was canceled, walk the full market-to-waterfront sequence at an easy pace and keep Kerry Park for golden hour.'},{title:'Rain-and-smoke edit',href:'https://www.pikeplacemarket.org/',body:'stay under the market roofs and near the hotel. The city day does not need a replacement mountain viewpoint to count as successful.'}],links:[['Pike Place official site','https://www.pikeplacemarket.org/'],['Waterfront Park Seattle','https://waterfrontparkseattle.org/'],['WSDOT traffic','https://wsdot.com/Travel/Real-time/Map/']]}),
  day({id:'day4c',cls:'c4',badge:'Alt',date:'Sept. 7 &middot; alternate Seattle day',title:'Leave Packwood at 10 &rarr; Seattle max',feel:'Market, waterfront, historic tower, postcard skyline and two excellent cocktails',facts:[['Leave Packwood','10:00 AM sharp'],['Downtown target','12:45&ndash;1:30 PM'],['Sunset','7:37 PM at Kerry Park'],['Sleep','W Seattle &middot; 1112 4th Ave']],note:'This is a standalone alternative to the existing Monday mountain handoff. It does not replace or change any Rainier day. Check out with the car packed, drive directly from Packwood at 10:00 AM, leave the car by the hotel, and let WSDOT traffic determine the cuts.',spot:'Seattle max: Pike Place, Smith Tower and Kerry Park',photos:seattleMaxPhotos,flow:'<b>10:00 AM</b> leave Packwood. <b>12:45&ndash;1:30 PM</b> park once and drop bags at the W. <b>1:15&ndash;3:15 PM</b> explore Pike Place and eat a market lunch; Matt&rsquo;s works only with an on-time arrival and reservation, while Old Stove or Caf&eacute; Campagne is safer. <b>3:15&ndash;4:00 PM</b> descend Overlook Walk and loop Pier 62. <b>4:15&ndash;5:20 PM</b> use a timed Smith Tower Observatory ticket. <b>5:30&ndash;6:35 PM</b> have an early dinner near Pike Place. <b>6:40 PM</b> rideshare to Kerry Park for the 7:37 sunset, leaving about 7:55. <b>8:15&ndash;9:15 PM</b> have a rooftop drink at The Nest. <b>9:30 PM</b> finish at reservation-only Needle &amp; Thread or walk into Bathtub Gin &amp; Co. &mdash; choose one, not both.',reality:'The nonstop drive is roughly 2 hours 24 minutes before holiday traffic, stops, parking, and hotel handling. If you reach the W after 1:45 PM, cut Smith Tower first. After 2:30 PM, keep only Pike Place, Overlook Walk, dinner, and the sunset decision. If Rainier is hidden or smoke spoils the western view at 6:15, skip Kerry Park and stay downtown for The Nest or Fog Room. The final speakeasy is always the first energy cut.',cost:'Pike Place, Overlook Walk, Pier 62, and Kerry Park are free. Smith Tower tickets generally start around $18&ndash;$25 per person; add downtown parking, two rideshares, meals, and cocktails.',food:'Do one real meal well. Matt&rsquo;s in the Market is the first choice if its lunch or 5:30 dinner timing fits; Caf&eacute; Campagne is the romantic fallback, and Old Stove is the flexible waterfront option. The Nest is better for the view and a drink than for dinner.',map:'W Seattle 1112 4th Avenue Seattle',alts:[{title:'Late traffic edit',href:'https://www.pikeplacemarket.org/about-pike-place-market/plan-your-visit/',body:'arrive after 1:45 and delete Smith Tower first. Keep Pike Place, Overlook Walk, an early dinner, and Kerry Park only if the view still earns the rideshare.'},{title:'Cloudy or smoky skyline',href:'https://www.thenestseattle.com/',body:'skip Kerry Park and use the recovered hour for The Nest or Fog Room. You still get a polished date night without crossing town for a view that is not there.'},{title:'Low-energy date-night edit',href:'https://www.mattsinthemarket.com/',body:'make the day Pike Place, Overlook Walk, Matt&rsquo;s, and one rooftop drink. Drop Smith Tower and the final speakeasy before rushing any of the remaining stops.'}],links:[['Pike Place visit guide','https://www.pikeplacemarket.org/about-pike-place-market/plan-your-visit/'],['Overlook Walk','https://waterfrontparkseattle.org/overlook-walk/'],['Smith Tower Observatory','https://www.smithtower.com/observatory-bar/'],['Matt&rsquo;s in the Market','https://www.mattsinthemarket.com/'],['Kerry Park','https://www.seattle.gov/parks/parks/kerry-park'],['The Nest','https://www.thenestseattle.com/'],['Needle &amp; Thread reservations','https://www.tavernlaw.com/reservations'],['WSDOT traffic','https://wsdot.com/Travel/Real-time/Map/']]}),
  day({id:'day5',cls:'c0',badge:'Tue',date:'Sept. 8',title:'Seattle morning &rarr; fly home',feel:'Coffee, one short walk, then protect the airport buffer',facts:[['Checkout','By 10:00 AM'],['Leave downtown','About 10:30 AM'],['Car return','Budget by noon'],['Flight','SEA 1:45 PM &rarr; ORD &rarr; PIT']],note:'Do not add a ticketed attraction. The fixed car return and airport buffer are the day.',spot:'Seattle morning and SEA',photos:seattleTuesdayPhotos,flow:'Breakfast near the W on 4th Avenue, a short downtown walk, then bags and checkout. Fuel only if the rental contract requires it and head to the rental facility.',reality:'A crash or security line can consume the buffer. Check both traffic and SEA checkpoint conditions before leaving.',cost:'Only breakfast, possible fuel, parking, and airport food.',food:'Choose a nearby caf&eacute; without a wait list.',map:'Seattle Tacoma International Airport',alts:[{title:'Traffic or long-checkpoint morning',href:'https://www.portseattle.org/sea-tac/security-screening-checkpoints',body:'skip the walk and breakfast wait, check out, and leave downtown 30&ndash;45 minutes earlier. Protecting the flight is the only meaningful Plan B.'},{title:'Normal morning, bad weather',href:'https://wsdot.com/Travel/Real-time/Map/',body:'keep breakfast beside the hotel and go straight to the rental return; do not replace the walk with a ticketed indoor stop.'}],links:[['SEA security checkpoints','https://www.portseattle.org/sea-tac/security-screening-checkpoints'],['WSDOT traffic','https://wsdot.com/Travel/Real-time/Map/']]})
].join('\n');

/* ------------------------------------------------------------------ main */

const sources = section('sources', 'Evidence', 'Official sources behind the rebuild', 'Every source below is dated by when the agency last updated it, not by when it was read. Closure and trail sources were re-read on Aug. 28, 2026. Wildfire conditions change during the day; recheck at night and again before driving.', `<ul class="source-list"><li><a href="https://www.nps.gov/mora/learn/news/fire.htm" target="_blank" rel="noreferrer">NPS Wildland Fire Information</a> &mdash; <b>NPS updated Aug. 27, 2026.</b> Plummer Peak closure wording, Sunrise/White River closures, the Wonderland Complex closures, Backbone Fire smoke warning, air-quality guidance, and the parkwide fire ban.</li><li><a href="https://www.nps.gov/mora/planyourvisit/trails-and-backcountry-camp-conditions.htm" target="_blank" rel="noreferrer">NPS Trail Status Report</a> &mdash; <b>NPS updated Aug. 27, 2026.</b> Trail-by-trail access; Bench/Snow, Lakes Trail, Skyline, Comet Falls, Eagle Peak, Rampart Ridge, Shriner Peak, Silver Falls and Naches remain outside the named fire closures, subject to their road and morning air gates.</li><li><a href="https://www.nps.gov/mora/planyourvisit/road-status.htm" target="_blank" rel="noreferrer">NPS Road Status</a> &mdash; <b>table dated Aug. 11, 2026 and updated when status changes.</b> Stevens Canyon, Longmire&ndash;Paradise, Paradise Valley, SR 123 and SR 410 open; Sunrise, White River and SR 165 closed. Confirm the spine again before driving.</li><li><a href="https://wsdot.com/Travel/Real-time/Map/" target="_blank" rel="noreferrer">WSDOT mountain-pass and real-time map</a> &mdash; Cayuse and Chinook Pass status on the drive between Packwood, Tipsoo and Seattle.</li><li><a href="https://www.nps.gov/mora/planyourvisit/bench-snow-lake-trail.htm" target="_blank" rel="noreferrer">NPS Bench and Snow Lake Trail</a> and <a href="https://www.nps.gov/places/reflection-lakes.htm" target="_blank" rel="noreferrer">Reflection Lakes / Lakes Trail</a> &mdash; Friday primary and late-arrival Plan B.</li><li><a href="https://www.nps.gov/mora/planyourvisit/skyline-trail.htm" target="_blank" rel="noreferrer">NPS Skyline Trail</a> and <a href="https://www.nps.gov/mora/planyourvisit/day-hiking-at-mount-rainier.htm" target="_blank" rel="noreferrer">day-hike table</a> &mdash; Saturday primary and shorter Paradise option.</li><li><a href="https://www.nps.gov/mora/planyourvisit/comet-falls-van-trump-park-trail.htm" target="_blank" rel="noreferrer">NPS Comet Falls and Van Trump Park</a>, <a href="https://www.nps.gov/mora/planyourvisit/upload/Eagle-Peak-Trail-Dec18.pdf" target="_blank" rel="noreferrer">Eagle Peak</a>, and <a href="https://www.nps.gov/mora/planyourvisit/rampart-ridge-trail.htm" target="_blank" rel="noreferrer">Rampart Ridge</a> &mdash; Sunday primary and two distinct fallback levels.</li><li><a href="https://www.nps.gov/mora/planyourvisit/shriner-peak.htm" target="_blank" rel="noreferrer">NPS Shriner Peak</a> &mdash; strongest still-accessible lookout alternative on open SR 123.</li><li><a href="https://www.nps.gov/places/grove-of-the-patriarchs-trailhead.htm" target="_blank" rel="noreferrer">NPS Grove trailhead access</a> and <a href="https://www.nps.gov/places/silver-falls.htm" target="_blank" rel="noreferrer">Silver Falls</a> &mdash; the grove is closed, but its parking, restrooms, Eastside Trail, and Silver Falls approach remain open.</li><li><a href="https://www.nps.gov/mora/planyourvisit/natches-peak-loop.htm" target="_blank" rel="noreferrer">NPS Naches Peak Loop</a> &mdash; route facts for the optional Monday farewell.</li><li><a href="https://www.nps.gov/mora/learn/news/mount-rainier-national-park-will-not-require-timed-entry-reservations-in-2026.htm" target="_blank" rel="noreferrer">NPS 2026 timed-entry announcement</a> &mdash; standing policy: no timed-entry reservation anywhere in the park in 2026.</li><li><a href="https://fire.airnow.gov/" target="_blank" rel="noreferrer">AirNow Fire and Smoke Map</a> and <a href="https://outlooks.airfire.org/outlook" target="_blank" rel="noreferrer">AirFire smoke outlooks</a> &mdash; live morning gates; never carry an earlier AQI reading forward.</li></ul>`);

const main = `<main>
${closureUpdate}
${sectionFromBaseline('arrangements')}
${stays}
${calendar}
${sectionFromBaseline('weather-history')}
${sectionFromBaseline('map')}
${recommended}
${trailGuide}
${closedTrails}
${savedIdeas}
${section('itinerary', 'Day by day', 'The rebuilt Packwood / Rainier itinerary', 'This is the schedule to follow. Every hike has a real cutoff and a named fallback.', `<div class="days">${days}</div>`)}
${photoGuide}
${packing}
${foodGuide}
${insiderTips}
${sources}
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
  ['Bench & Snow Lakes trailhead',46.7649,-121.7038,'rainier','hike'],
  ['Reflection Lakes',46.7697,-121.7295,'rainier','view'],
  ['Faraway Rock (Lakes Trail)',46.7740,-121.7188,'rainier','view'],
  ['Paradise / Skyline',46.7857,-121.7351,'rainier','hike'],
  ['Comet Falls trailhead',46.7791,-121.7806,'rainier','hike'],
  ['Longmire / Rampart Ridge fallback',46.7497,-121.8128,'rainier','hike'],
  ['Tipsoo / Naches Peak',46.8686,-121.5178,'rainier','hike'],
  ['W Seattle (1112 4th Ave)',47.6074907,-122.3339425,'seattle','hotel'],
  ['Pike Place Market',47.6094,-122.3417,'seattle','sight'],
  ['Kerry Park',47.6295,-122.3599,'seattle','view']
].map(([n,lat,lng,r,t]) => ({n,lat,lng,r,g:`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,t}));

if (!/window\.__MAP_POINTS__=\[[\s\S]*?\];window\.__MAP_COLORS__=/.test(html)) throw new Error('Map points block not found');
html = html.replace(/window\.__MAP_POINTS__=\[[\s\S]*?\];window\.__MAP_COLORS__=/, `window.__MAP_POINTS__=${JSON.stringify(points)};window.__MAP_COLORS__=`);

html = html
  .replaceAll('Sunday &middot; Fremont sunset', 'Sunday &middot; glacier country')
  .replaceAll('Sunday · Fremont sunset', 'Sunday · glacier country')
  .replaceAll('Friday &middot; Pinnacle Saddle', 'Friday &middot; Bench &amp; Snow Lakes')
  .replaceAll('Friday · Pinnacle Saddle', 'Friday · Bench & Snow Lakes');

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
if (/Mount Fremont Lookout|First \+ Second Burroughs|Pinnacle Saddle<\/h3>/.test(html)) throw new Error('Closed-trail card survived filtering');

fs.writeFileSync(pagePath, html);
console.log(`Updated ${pagePath} — ${galleryTotal} gallery photos, ${html.length} bytes`);
