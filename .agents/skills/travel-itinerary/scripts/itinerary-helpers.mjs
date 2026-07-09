/**
 * itinerary-helpers.mjs — the reusable toolkit behind a repo-native trip page.
 *
 * The TravelPlanner site renders one `src/_data/<slug>/main.json` per trip
 * (paginated by src/itinerary.njk). Every trip is built the same way: CLONE the
 * most complete current trip as a template, keep its chrome (the <head>
 * stylesheet, nav, and map/JS stack) VERBATIM, and rebuild only the
 * destination-specific content. These helpers are that rebuild kit, lifted out
 * of the per-trip create scripts so a new `create-<slug>.mjs` is just the
 * research + prose, not 80 lines of repeated boilerplate.
 *
 * Import from a per-trip builder:
 *   import * as H from '<skill>/scripts/itinerary-helpers.mjs';
 * See references/main_json_schema.md for the full contract and SKILL.md for the
 * end-to-end workflow.
 */

// ---------------------------------------------------------------------------
// Images — pro photography only. See SKILL.md §Photos: the shots here are the
// FIRST thing the reader reacts to, so every URL must clear the "wow" bar.
// Unsplash + Pexels are the two sources. `wiki()` exists only as an absolute
// last resort for a spot with genuinely no pro coverage — a dull Commons plate
// cheapens the whole doc, so re-subject to a photogenic nearby view first.
// ---------------------------------------------------------------------------
export const unsplash = (id, width = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;
export const pexels = (id, width = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
export const wiki = (file, width = 1200) => // LAST RESORT ONLY — prefer unsplash/pexels
  `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=${width}`;

/** One carousel figure. `credit` is "Photographer Name · Unsplash License" etc. */
export const img = (src, captionTitle, credit, href = src) =>
  ({ href, src, alt: captionTitle.replace(/&amp;/g, '&'), captionTitle, credit });

// ---------------------------------------------------------------------------
// Map data. `point(name, lat, lng, region, type)` — type drives the MapLibre
// layer filter (one of: flight, hotel, hike, beach, view, town, food).
// ---------------------------------------------------------------------------
export const gmaps = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
export const point = (n, lat, lng, r, t) => ({ n, lat, lng, r, g: gmaps(lat, lng), t });

// ---------------------------------------------------------------------------
// Spot + day builders (typed itinerary: days -> spots -> images)
// ---------------------------------------------------------------------------
export const explore = (name, tags = []) => {
  const q = encodeURIComponent(name.replace(/&amp;/g, '&').replace(/<[^>]+>/g, ''));
  const tagLinks = tags
    .map((tag) => `<a class="xi" href="https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/" target="_blank" rel="noreferrer">IG &middot; ${tag}</a>`)
    .join('');
  return `<a class="xg" href="https://www.google.com/search?tbm=isch&amp;q=${q}" target="_blank" rel="noreferrer">Photos</a>${tagLinks}<a class="xf" href="https://www.flickr.com/search/?text=${q}&amp;sort=interestingness-desc" target="_blank" rel="noreferrer">Flickr</a>`;
};

export const spotMap = (name, lat, lng) => {
  const title = name.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
  return `<div class="spot-map">
          <div class="mapwrap"><iframe class="gmap" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${lat},${lng}&amp;z=13&amp;output=embed" title="Map of ${title}"></iframe></div>
          <a class="gmap-btn" href="${gmaps(lat, lng)}" target="_blank" rel="noreferrer">&#128205; Open in Google Maps &#8617;</a>
        </div>`;
};

export const altList = (items) => `<ul class="alt-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

/**
 * mkSpot — one stop card. `restos`/`alts` are arrays of ready HTML <li> inner
 * strings; `blogs` are {href,label}; `images` come from img(). Every field is
 * real research (a price, a June temp, a picky-kid pick) — no placeholders.
 */
export const mkSpot = ({ name, tags = [], carouselId, images, lat, lng, cost, climateLabel = 'Weather', climate, save, splurge, restos, alts = [], blogs = [], alltrailsTrail }) => ({
  name,
  exploreHtml: explore(name, tags),
  carouselId,
  images,
  ...(alltrailsTrail ? { alltrailsTrail } : {}),
  cost,
  climateLabel,
  climate,
  saveHtml: `<b>Save</b> ${save}`,
  splurgeHtml: `<b>Splurge</b> ${splurge}`,
  restoHtml: restos.map((r) => `<li>${r}</li>`).join(''),
  altboxHtml: altList(alts),
  bloglinksHtml: blogs.map((b) => `<a class="xg" href="${b.href}" target="_blank" rel="noreferrer">${b.label}</a>`).join(''),
  spotMapHtml: spotMap(name, lat, lng),
});

/** day() — colorClass is c0 (travel) or c1..cN (the base you sleep in that night). */
export const day = (id, colorClass, badge, eyebrow, heading, feel, daycost, facts, note, spots = [], travelNote = null) =>
  ({ id, colorClass, badge, eyebrow, heading, feel, daycost, facts, note, spots, travelNote });
export const fact = (label, valueHtml) => ({ label, valueHtml });
export const travelDay = (id, badge, eyebrow, heading, feel, daycost, facts, note) =>
  day(id, 'c0', badge, eyebrow, heading, feel, daycost, facts, note, [], '&#9992;&#65038; Travel day &mdash; no stops');

// ---------------------------------------------------------------------------
// Section-content helpers (used inside the raw HTML section groups)
// ---------------------------------------------------------------------------
export const sectionLabel = (eyebrow, h2, sub = '') =>
  `<div class="section-label">\n      <p class="eyebrow">${eyebrow}</p>\n      <h2>${h2}</h2>${sub ? `\n      <p>${sub}</p>` : ''}\n    </div>`;

/** .pcard used in air-travel / getting-around / why-this-trip plan grids. */
export const card = (title, body) => `<div class="pcard"><h4><span class="dot"></span>${title}</h4>${body}</div>`;
export const prow = (label, value) => `<div class="prow"><span>${label}</span><strong>${value}</strong></div>`;
export const table = (headers, rows, className = 'budget-tbl') =>
  `<div class="budget-scroll"><table class="${className}"><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;

/** .tipcard used in why-this-trip / social / tips grids. items: [html, html, ...] or {sub, items}. */
export const tipcard = (title, sub, items, variant = '') =>
  `<div class="tipcard${variant}"><h4>${title}</h4><p class="sub">${sub}</p><ul>${items.map((i) => (typeof i === 'string' ? `<li>${i}</li>` : `<li class="flag">${i.flag}</li>`)).join('')}</ul></div>`;

// ---------------------------------------------------------------------------
// Hero — the photo-first <section class="preview">. This carousel is the single
// most important visual in the doc; feed it only the trip's very best shots.
//   stats:  [[value, label], ...]            (4)
//   split:  [[width, label, cssClass], ...]  (water/town/nature)
//   images: [[src, capDay, title, desc], ...]  (aggregate the wow shots)
// ---------------------------------------------------------------------------
export const preview = ({ kicker, h1Main, h1Sub, lead, stats, split, images }) => {
  const statHtml = stats.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
  const segHtml = split.map(([w, l, c]) => `<div class="seg ${c}" style="flex:${w}"><b>${w}%</b><span>${l}</span></div>`).join('');
  const aria = 'Trip mix: ' + split.map(([w, l]) => `about ${w}% ${l.toLowerCase()}`).join(', ');
  const figs = images
    .map(([src, capDay, title, desc], i) => `<figure><img src="${src}" alt="${title}"${i ? ' loading="lazy"' : ''}><figcaption><span class="cap-day">${capDay}</span><strong>${title}</strong><span class="cap-desc">${desc}</span></figcaption></figure>`)
    .join('');
  const n = images.length;
  return `<section class="preview">
  <div class="pv-pane">
    <span class="pv-kicker">${kicker}</span>
    <h1>${h1Main}<span>${h1Sub}</span></h1>
    <p class="pv-lead">${lead}</p>
    <div class="pv-stats">${statHtml}</div>
    <div class="pv-split" role="img" aria-label="${aria}">
      ${segHtml}
    </div>
    <p class="pv-cue">&darr; Full day-by-day plan below</p>
  </div>
  <div class="carousel pvcar" data-n="${n}">
    <div class="track">${figs}</div>
    <button class="nav prev" aria-label="Previous">&#8249;</button>
    <button class="nav next" aria-label="Next">&#8250;</button>
    <div class="counter"><span class="cur">1</span> / ${n}</div>
  </div>
</section>`;
};

// ---------------------------------------------------------------------------
// Calendar — schematic activity-block grid, auto-derived from timed day blocks.
// window: [year, startMonth, startDay, endMonth, endDay] — full weeks to show.
// tripDays: [{ date:[month,day], blocks:[{act, start, end, label}] }]
//   act ∈ air|car|hike|water|town|rest ; start/end are 24h hours (grid rows).
// Self-contained: carries its own scoped <style> so it renders on any template.
// ---------------------------------------------------------------------------
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CAL_HOURS = [6, 8, 10, 12, 14, 16, 18, 20, 22];
const hourToRow = (h) => Math.max(1, Math.min(9, Math.round((h - 6) / 2) + 1));
const tlLabel = (h) => { const ap = h < 12 ? 'a' : 'p'; let hh = h > 12 ? h - 12 : h; if (hh === 0) hh = 12; return `${hh}${ap}`; };

const CAL_STYLE = `<style>
      .cal-legend{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 16px}
      .cal-legend span{display:inline-flex;align-items:center;gap:7px;font-size:.78rem;font-weight:700;color:var(--ink)}
      .cal-legend i{width:16px;height:16px;border-radius:5px;display:inline-block}
      .lg-air{background:#3d4d74}.lg-car{background:var(--gold)}
      .lg-hike{background:var(--c3)}.lg-water{background:var(--c1)}.lg-town{background:var(--c2)}.lg-rest{background:#8a857c}
      .cal-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:6px}
      .cal-week{min-width:780px;margin:0 0 22px}
      .cal-wklabel{font-size:.76rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
      .cal-hd{display:grid;grid-template-columns:repeat(8,1fr);gap:0}
      .cal-hd .dh{padding:6px 4px;text-align:center;border-bottom:2px solid var(--line)}
      .cal-hd .dh .dow{display:block;font-size:.66rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
      .cal-hd .dh .dnum{display:block;font-size:1.02rem;font-weight:800;color:var(--ink);line-height:1.1}
      .cal-hd .dh.off{opacity:.4}
      .cal-hd .dh.trip{background:rgba(31,111,120,.06)}
      .cal-hd .dh.trip .dnum{color:var(--c1)}
      .cal-hd .gut{border-bottom:2px solid var(--line)}
      .cal-bd{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(9,32px);position:relative;
        background-image:repeating-linear-gradient(to bottom,transparent 0 31px,var(--line) 31px 32px),
          repeating-linear-gradient(to right,transparent 0 calc(12.5% - 1px),var(--line) calc(12.5% - 1px) 12.5%)}
      .cal-bd .tl{grid-column:1;font-size:.62rem;font-weight:700;color:var(--muted);padding:2px 4px 0 4px;text-align:right}
      .ev{margin:2px;border-radius:6px;padding:3px 6px;font-size:.68rem;line-height:1.14;font-weight:700;color:#fff;overflow:hidden;
        position:relative;z-index:2;box-shadow:0 1px 3px rgba(30,32,28,.2);display:flex;align-items:flex-start}
      .ev.sm{font-size:.62rem;align-items:center}
      .ev.air{background:#3d4d74}
      .ev.car{background:var(--gold);color:#3a2f12;box-shadow:0 1px 2px rgba(120,90,20,.28)}
      .ev.hike{background:var(--c3)}.ev.water{background:var(--c1)}.ev.town{background:var(--c2)}
      .ev.rest{background:#8a857c}
      @media(max-width:640px){.cal-week{min-width:720px}}
    </style>`;

export const calendarGrid = ({ window: win, tripDays, intro }) => {
  const [y, sm, sd, em, ed] = win;
  const trip = new Map(tripDays.map((t) => [`${t.date[0]}-${t.date[1]}`, t]));
  // enumerate Sun–Sat weeks spanning the window
  const mkDate = (mo, da) => new Date(Date.UTC(y, mo - 1, da));
  const d0 = mkDate(sm, sd), d1 = mkDate(em, ed);
  const start = new Date(d0); start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const weeks = [];
  for (let cur = new Date(start); cur <= d1; cur.setUTCDate(cur.getUTCDate() + 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => { const dd = new Date(cur); dd.setUTCDate(dd.getUTCDate() + i); return dd; }));
  }
  const wklabel = (w) => {
    const a = w[0], b = w[6];
    return a.getUTCMonth() === b.getUTCMonth()
      ? `${MONTHS[a.getUTCMonth()]} ${a.getUTCDate()}&ndash;${b.getUTCDate()}`
      : `${MONTHS[a.getUTCMonth()]} ${a.getUTCDate()}&ndash;${MONTHS[b.getUTCMonth()]} ${b.getUTCDate()}`;
  };
  const weeksHtml = weeks.map((week, wi) => {
    const hd = ['<div class="gut"></div>'].concat(week.map((dt) => {
      const key = `${dt.getUTCMonth() + 1}-${dt.getUTCDate()}`;
      const cls = trip.has(key) ? 'trip' : 'off';
      return `<div class="dh ${cls}"><span class="dow">${DOW[dt.getUTCDay()]}</span><span class="dnum">${dt.getUTCDate()}</span></div>`;
    })).join('');
    const tls = CAL_HOURS.map((h, i) => `<div class="tl" style="grid-row:${i + 1}">${tlLabel(h)}</div>`).join('');
    const evs = week.map((dt, ci) => {
      const t = trip.get(`${dt.getUTCMonth() + 1}-${dt.getUTCDate()}`);
      if (!t) return '';
      return (t.blocks || []).map((b) => {
        const r0 = hourToRow(b.start);
        let r1 = Math.min(10, hourToRow(b.end) + (b.end % 2 ? 1 : 0));
        if (r1 <= r0) r1 = r0 + 1;
        const smCls = (r1 - r0) <= 1 ? ' sm' : '';
        return `<div class="ev ${b.act}${smCls}" style="grid-column:${ci + 2};grid-row:${r0}/${r1}">${b.label}</div>`;
      }).join('');
    }).join('');
    return `<div class="cal-week">
        <p class="cal-wklabel">Week ${wi + 1} &middot; ${wklabel(week)}</p>
        <div class="cal-hd">${hd}</div>
        <div class="cal-bd">${tls}${evs}</div>
      </div>`;
  }).join('\n      ');
  const legend = `<div class="cal-legend">
        <span><i class="lg-air"></i>&#9992;&#65039; Air travel</span>
        <span><i class="lg-car"></i>&#128663; Car &amp; transfers</span>
        <span><i class="lg-hike"></i>&#129406; Hike &amp; nature</span>
        <span><i class="lg-water"></i>&#127958;&#65039; Beach &amp; water</span>
        <span><i class="lg-town"></i>&#127963;&#65039; Towns &amp; food</span>
        <span><i class="lg-rest"></i>&#128716;&#65039; Recover &amp; buffer</span>
      </div>`;
  const introP = intro || 'The same days as colored time blocks, coded by <b>activity</b> so a color means the same thing on every itinerary. Coarse by design. <b>Block times are schematic, not real flight times</b> &mdash; they show sequence and rough time-of-day snapped to a 2-hour grid. When real flights are booked, set each block to departure minus a check-in buffer.';
  return `<section id="calendar" class="divider">
    ${sectionLabel('Week at a Glance', 'Calendar', introP)}
    ${CAL_STYLE}
    ${legend}
    <div class="cal-scroll">
      ${weeksHtml}
    </div>
  </section>`;
};

// ---------------------------------------------------------------------------
// Chrome + assembly. Clone the template main.json, keep its head/nav/JS verbatim.
// ---------------------------------------------------------------------------

/**
 * sliceChrome — split the template's parts[0] mega-blob into the reusable
 * head+<body> prefix and the nav→overview segment, retitled and de-guided.
 * Returns { headBody, navToMain }. Rebuild parts[0] as:
 *   headBody + preview + navToMain + overview + why + stays + calendar
 */
export const sliceChrome = (templatePart0, title) => {
  const afterBody = templatePart0.indexOf('</head><body>') + '</head><body>'.length;
  const navStart = templatePart0.indexOf('<nav class="site-nav"');
  const overviewStart = templatePart0.indexOf('<section id="overview"');
  const headBody = templatePart0.slice(0, afterBody).replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  const navToMain = templatePart0.slice(navStart, overviewStart)
    .replace('      <a href="#photo-guide">Photo Guide</a>\n      <a href="#food-guide">Food Guide</a>\n', '');
  return { headBody, navToMain };
};

/** Swap the map data in the template's trailing script part. */
export const mapScripts = (templateScriptPart, mapPoints, mapColors, mapTypes) => {
  let s = templateScriptPart.replace(/window\.__MAP_POINTS__=.*?;window\.__MAP_COLORS__=/s, `window.__MAP_POINTS__=${JSON.stringify(mapPoints)};window.__MAP_COLORS__=`);
  if (mapTypes) s = s.replace(/window\.__MAP_COLORS__=.*?;window\.__MAP_TYPES__=/s, `window.__MAP_COLORS__=${JSON.stringify(mapColors)};window.__MAP_TYPES__=`);
  else s = s.replace(/window\.__MAP_COLORS__=.*?;/s, `window.__MAP_COLORS__=${JSON.stringify(mapColors)};`);
  return s;
};

/** /50 = budget×2 + the 8 scored axes. Throws if scorecard.totalBaked is wrong. */
export const bakedTotal = (axes) =>
  axes.budget * 2 + axes.weather + axes.swim + axes.variety + axes.ease + axes.food + axes.risk + axes.nights + axes.novelty;
export const assertBaked = (scorecard) => {
  const want = bakedTotal(scorecard.axes);
  if (scorecard.totalBaked !== want)
    throw new Error(`scorecard.totalBaked ${scorecard.totalBaked} != computed ${want} (budget×2 + 8 axes)`);
  return scorecard;
};
