#!/usr/bin/env node
// Builds src/_data/dolomites-sardinia/main.json — Venice → Dolomites → Sardinia,
// Jun 27–Jul 11 2027, family of 4. Clones the hawaii chrome; rebuilds content.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const outDir = path.join(root, 'src/_data/dolomites-sardinia');

// --- helpers (inlined so this tool is self-contained + committable) ---------
const gmaps = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const point = (n, lat, lng, r, t) => ({ n, lat, lng, r, g: gmaps(lat, lng), t });
const unsplash = (id, width = 1200) => `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;
const pexels = (id, width = 1200) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
const img = (src, captionTitle, credit, href = src) => ({ href, src, alt: captionTitle.replace(/&amp;/g, '&'), captionTitle, credit });
const explore = (name, tags = []) => {
  const q = encodeURIComponent(name.replace(/&amp;/g, '&').replace(/<[^>]+>/g, ''));
  const tagLinks = tags.map((tag) => `<a class="xi" href="https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/" target="_blank" rel="noreferrer">IG &middot; ${tag}</a>`).join('');
  return `<a class="xg" href="https://www.google.com/search?tbm=isch&amp;q=${q}" target="_blank" rel="noreferrer">Photos</a>${tagLinks}<a class="xf" href="https://www.flickr.com/search/?text=${q}&amp;sort=interestingness-desc" target="_blank" rel="noreferrer">Flickr</a>`;
};
const spotMap = (name, lat, lng) => {
  const title = name.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
  return `<div class="spot-map">
          <div class="mapwrap"><iframe class="gmap" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${lat},${lng}&amp;z=13&amp;output=embed" title="Map of ${title}"></iframe></div>
          <a class="gmap-btn" href="${gmaps(lat, lng)}" target="_blank" rel="noreferrer">&#128205; Open in Google Maps &#8617;</a>
        </div>`;
};
const altList = (items) => `<ul class="alt-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const mkSpot = ({ name, tags, carouselId, images, lat, lng, cost, climateLabel = 'Weather', climate, save, splurge, restos, alts, blogs }) => ({
  name, exploreHtml: explore(name, tags), carouselId, images, cost, climateLabel, climate,
  saveHtml: `<b>Save</b> ${save}`, splurgeHtml: `<b>Splurge</b> ${splurge}`,
  restoHtml: restos.map((r) => `<li>${r}</li>`).join(''),
  altboxHtml: altList(alts),
  bloglinksHtml: blogs.map((b) => `<a class="xg" href="${b.href}" target="_blank" rel="noreferrer">${b.label}</a>`).join(''),
  spotMapHtml: spotMap(name, lat, lng),
});
const day = (id, colorClass, badge, eyebrow, heading, feel, daycost, facts, note, spots = [], travelNote = null) => ({ id, colorClass, badge, eyebrow, heading, feel, daycost, facts, note, spots, travelNote });
const fact = (label, valueHtml) => ({ label, valueHtml });
const card = (title, body) => `<div class="pcard"><h4><span class="dot"></span>${title}</h4>${body}</div>`;
const prow = (label, value) => `<div class="prow"><span>${label}</span><strong>${value}</strong></div>`;
const table = (headers, rows, className = 'budget-tbl') => `<div class="budget-scroll"><table class="${className}"><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
const sectionLabel = (eyebrow, h2, sub = '') => `<div class="section-label">\n      <p class="eyebrow">${eyebrow}</p>\n      <h2>${h2}</h2>${sub ? `\n      <p>${sub}</p>` : ''}\n    </div>`;

// --- calendar activity-block grid (inlined from itinerary-helpers.mjs) -------
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
const calendarGrid = ({ window: win, tripDays, intro }) => {
  const [y, sm, sd, em, ed] = win;
  const trip = new Map(tripDays.map((t) => [`${t.date[0]}-${t.date[1]}`, t]));
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
  const introP = intro || 'The same days as colored time blocks, coded by <b>activity</b>. <b>Block times are schematic, not real flight times</b> &mdash; they show sequence and rough time-of-day snapped to a 2-hour grid.';
  return `<section id="calendar" class="divider">
    ${sectionLabel('Week at a Glance', 'Calendar', introP)}
    ${CAL_STYLE}
    ${legend}
    <div class="cal-scroll">
      ${weeksHtml}
    </div>
  </section>`;
};

// --- map ---------------------------------------------------------------------
const mapColors = { venice: '#1f6f78', dolomites: '#c25a3a', 'sardinia-n': '#3f7d4e', 'sardinia-e': '#3a6ea5' };
const mapPoints = [
  point('Venice Marco Polo Airport (VCE)', 45.5053, 12.3519, 'venice', 'flight'),
  point('Grand Canal & Rialto', 45.4380, 12.3359, 'venice', 'town'),
  point('Piazza San Marco & St. Mark\'s Basilica', 45.4342, 12.3378, 'venice', 'town'),
  point('Murano & Burano islands', 45.4854, 12.4166, 'venice', 'town'),
  point('San Vito di Cadore base (Cortina)', 46.4667, 12.2060, 'dolomites', 'hotel'),
  point('Lago di Braies', 46.6958, 12.0857, 'dolomites', 'hike'),
  point('Tre Cime di Lavaredo', 46.6167, 12.3017, 'dolomites', 'hike'),
  point('Seceda & Alpe di Siusi', 46.5928, 11.6772, 'dolomites', 'hike'),
  point('Cinque Torri', 46.5119, 12.0333, 'dolomites', 'hike'),
  point('Cortina d\'Ampezzo', 46.5405, 12.1357, 'dolomites', 'town'),
  point('Cannigione base (Costa Smeralda)', 41.1033, 9.4433, 'sardinia-n', 'hotel'),
  point('Costa Smeralda beaches', 41.0892, 9.5619, 'sardinia-n', 'beach'),
  point('La Maddalena archipelago', 41.2789, 9.3567, 'sardinia-n', 'beach'),
  point('La Pelosa, Stintino', 40.9652, 8.2096, 'sardinia-n', 'beach'),
  point('Cala Gonone base', 40.2775, 9.6317, 'sardinia-e', 'hotel'),
  point('Cala Goloritzé / Gulf of Orosei', 40.1080, 9.6897, 'sardinia-e', 'beach'),
  point('Su Gorropu gorge', 40.1907, 9.4886, 'sardinia-e', 'hike'),
  point('Olbia Costa Smeralda Airport (OLB)', 40.8987, 9.5176, 'sardinia-n', 'flight'),
];

// --- images (the upgraded epic set from this session) ------------------------
const canalImages = [
  img(unsplash('1511892964110-b714f7dabcde'), 'Grand Canal at golden hour from above', 'Cristina Gottardi &middot; Unsplash License'),
  img(unsplash('1770099825265-7cc5f412bc99'), 'Rialto Bridge at dusk', 'Maksim Shutov &middot; Unsplash License'),
  img(unsplash('1523906834658-6e24ef2386f9'), 'Rialto Bridge over the Grand Canal', 'Damiano Baschiera &middot; Unsplash License'),
];
const sanMarcoImages = [
  img(unsplash('1551963811-3823b2eb18d8'), 'St. Mark\'s Basilica facade and mosaics', 'Falco Negenman &middot; Unsplash License'),
  img(unsplash('1756436451421-66407c1e6c6a'), 'St. Mark\'s domes and spires', 'MChe Lee &middot; Unsplash License'),
  img(pexels('20623114'), 'Basilica San Marco gothic detail', 'Matteo Milan &middot; Pexels License'),
];
const buranoImages = [
  img(pexels('30089038'), 'Burano rainbow canal houses', 'Ahmet AZAKLI &middot; Pexels License'),
  img(pexels('18760061'), 'Colorful canal on Murano', 'Jan Tang &middot; Pexels License'),
  img(pexels('22000336'), 'Burano canal reflections', 'Elif Topal &middot; Pexels License'),
];
const braiesImages = [
  img(unsplash('1601893920982-b69daa66bbb3'), 'Lago di Braies emerald lake and boathouse', 'Jeison Higuita &middot; Unsplash License'),
  img(unsplash('1601893920895-e3ed4a655d27'), 'Braies boathouse and wooden rowboats', 'Jeison Higuita &middot; Unsplash License'),
  img(unsplash('1678052812569-7fea895cac74'), 'Braies lake from above with peaks', 'Djordje Vukojicic &middot; Unsplash License'),
];
const treCimeImages = [
  img(pexels('748898'), 'Tre Cime di Lavaredo under dramatic cloud', 'Simon Migaj &middot; Pexels License'),
  img(unsplash('1564985253696-37a841b30491'), 'The three peaks in golden light', 'Salmen Bejaoui &middot; Unsplash License'),
  img(unsplash('1743245000548-bd80d8ef72e0'), 'Tre Cime above alpine wildflowers', 'Michael Hutter &middot; Unsplash License'),
];
const secedaImages = [
  img(unsplash('1629576014942-81425e92ca7e'), 'Seceda ridgeline and the Odle spires', 'Ciprian Boiciuc &middot; Unsplash License'),
  img(pexels('4215117'), 'Seceda spires with a sunburst', 'Grisentig &middot; Pexels License'),
  img(pexels('12365660'), 'Seceda ridge under a rainbow', 'Eberhard Gross &middot; Pexels License'),
];
const cinqueTorriImages = [
  img(unsplash('1742070201180-cfad2ca89bec'), 'Cinque Torri rock towers', 'hajperlink &middot; Unsplash License'),
  img(pexels('32577289'), 'Cinque Torri over a wildflower meadow', 'Alexandre Moreira &middot; Pexels License'),
  img(unsplash('1633610882178-e3d088eb62ba'), 'Cinque Torri peaks and green meadow', 'Giordano Petraccaro &middot; Unsplash License'),
];
const cortinaImages = [
  img(unsplash('1639989327820-6891a712eba4'), 'Aerial over Cinque Torri and the Tofana wall', 'Mattew Gave &middot; Unsplash License'),
  img(unsplash('1655910837849-658b0d2d431b'), 'Rifugio on a mirror lake below Croda da Lago', 'Hans Ott &middot; Unsplash License'),
];
const costaSmeraldaImages = [
  img(unsplash('1698247186956-1a06d3c7fb6c'), 'Costa Smeralda turquoise cove from above', 'Nicolò Canu &middot; Unsplash License'),
  img(unsplash('1684183164545-e6cbee8c0afe'), 'Aerial over Costa Smeralda rocks and water', 'Chris Weiher &middot; Unsplash License'),
  img(unsplash('1682457221157-42067a9b23f1'), 'Deep-blue Sardinian sea and sky', 'Kamil Molendys &middot; Unsplash License'),
];
const maddalenaImages = [
  img(unsplash('1716113668134-016e5f2b316e'), 'La Maddalena archipelago islands and turquoise', 'Vincenzo Inzone &middot; Unsplash License'),
  img(unsplash('1536598271160-65bd0d8380bd'), 'Aerial over a La Maddalena cove with boats', 'Vincenzo Malagoli &middot; Unsplash License'),
  img(unsplash('1752901896089-82dc1c390007'), 'Boats on glass-clear archipelago water', 'Domenico Adornato &middot; Unsplash License'),
];
const pelosaImages = [
  img(unsplash('1652954059946-15ab6291e202'), 'Torre della Pelosa over the white-sand lagoon', 'Riccardo Manieri &middot; Unsplash License'),
  img(unsplash('1707478402960-6e699bc35b8e'), 'La Pelosa shallow turquoise shallows', 'Beatrice Gravaghi &middot; Unsplash License'),
  img(pexels('37220181'), 'La Pelosa beach and clear water', 'Domenico Adornato &middot; Pexels License'),
];
const calaGononeImages = [
  img(unsplash('1683140164287-9e550692bdd0'), 'Cala Gonone town and mountains from the sea', 'Christian Keybets &middot; Unsplash License'),
  img(unsplash('1604321886510-1a923c8427d2'), 'Aerial over Cala Gonone cliffs and turquoise', 'Luca Cassani &middot; Unsplash License'),
  img(unsplash('1780498571494-9d55f2f24df5'), 'Inside a Gulf of Orosei sea cave', 'Giuseppe Da Parè &middot; Unsplash License'),
];
const oroseiImages = [
  img(pexels('23962079'), 'Cala Goloritzé pinnacle and turquoise cove', 'Serhii Panasiuk &middot; Pexels License'),
  img(unsplash('1727786616190-62a1e83ef91f'), 'Bird’s-eye view of Cala Goloritzé', 'Sven Twenson &middot; Unsplash License'),
  img(unsplash('1633853703227-57a074903869'), 'Aerial of Cala Mariolu', 'Leon Rohrwild &middot; Unsplash License'),
];
const gorropuImages = [
  img(unsplash('1700690389767-fd93d084f81b'), 'River through the Flumineddu valley', 'Edoardo Bortoli &middot; Unsplash License'),
  img(unsplash('1778583735364-9ee5a3ccf46b'), 'Mountain stream in a rocky green valley', 'Simone Franchina &middot; Unsplash License'),
];

// --- spots -------------------------------------------------------------------
const canalSpot = mkSpot({
  name: 'Grand Canal &amp; Rialto by Vaporetto', tags: ['venice', 'rialto', 'grandcanal'], carouselId: 'c-canal',
  images: canalImages, lat: 45.4380, lng: 12.3359,
  cost: 'Vaporetto: single &euro;9.50, 48-hour pass &euro;35/person (~&euro;140/family), under-6 free. The pass is the money move for a family hopping the canal and the islands.',
  climateLabel: 'Weather', climate: '<b>82&deg;F</b> day / <b>68&deg;F</b> night &mdash; humid, ~65% RH. Pack light layers; the water keeps the air moving.',
  save: 'Buy the 48-hour pass before your first ride &mdash; it breaks even after ~4 rides, and Rialto &rarr; San Marco &rarr; the islands easily hits 6&ndash;8. Saves ~&euro;25/person over singles.',
  splurge: 'A 30-minute golden-hour gondola past the Rialto &mdash; the city rate is &euro;90 daytime / &euro;110 evening per gondola, and the whole family of four rides together.',
  restos: [
    '<a href="https://www.birrarialacorte.it/" target="_blank" rel="noreferrer"><b>Birraria La Corte</b></a> &mdash; pizzeria on Campo San Polo, wood-fired margherita and a courtyard for restless kids',
    '<a href="https://pizzeriamegaone.restaurants-us.com/" target="_blank" rel="noreferrer"><b>Pizzeria Megaone</b></a> &mdash; quick pizza slices &euro;3.50&ndash;5, steps from the bridge',
    '<a href="https://www.google.com/maps/search/?api=1&query=Al+Gobbo+di+Rialto+Venice" target="_blank" rel="noreferrer"><b>Al Gobbo di Rialto</b></a> &mdash; trattoria/pizzeria off Rialto: kids get pizza, adults get cicchetti',
  ],
  alts: [
    '<b>Rialto Market</b> &mdash; a free 10-minute browse of the fish and produce stalls right off the vaporetto stop, best just before gelato.',
    '<b>Libreria Acqua Alta</b> &mdash; the quirky book-in-a-gondola shop, a quick fun stop for the kids.',
    '<b>A back-canal wander in Cannaregio</b> &mdash; the quiet, un-touristy Venice at kid pace.',
  ],
  blogs: [
    { label: 'Navigating Vaporetto Line 1', href: 'https://vaporettovenice.com/line-1/' },
    { label: 'A Vaporetto Trip Down the Grand Canal', href: 'https://rebeccasnyder.com/travel/a-vaporetto-trip-down-the-grand-canal/' },
  ],
});
const sanMarcoSpot = mkSpot({
  name: 'Piazza San Marco &amp; St. Mark\'s Basilica', tags: ['sanmarco', 'venice', 'basilica'], carouselId: 'c-sanmarco',
  images: sanMarcoImages, lat: 45.4342, lng: 12.3378,
  cost: 'Piazza free. Basilica nave &euro;10/person (pre-book). Campanile lift &euro;15/person (~&euro;60/family).',
  climateLabel: 'Weather', climate: '<b>82&deg;F</b> day / <b>68&deg;F</b> night &mdash; humid. The square bakes at midday; go early or at dusk.',
  save: 'Skip the paid Basilica interior &mdash; the free piazza and facade are the photo. Saves &euro;40&ndash;100 and keeps the day light, per the no-death-march plan.',
  splurge: 'Pre-book the Campanile lift (&euro;60/family) for the 323-ft lagoon view &mdash; the elevator is far kinder on kid legs than the stairs.',
  restos: [
    '<a href="https://gruppo1000.com/" target="_blank" rel="noreferrer"><b>1000 Gourmet Venezia</b></a> &mdash; Neapolitan pizza near the piazza, reliably packed with families',
    '<a href="https://www.aciugheta.com/en/" target="_blank" rel="noreferrer"><b>Aciugheta</b></a> &mdash; Venetian trattoria near San Zaccaria, wood-fired kids’ pizza plus cicchetti',
    '<a href="https://www.6342aletole.it/en/" target="_blank" rel="noreferrer"><b>6342 A Le Tole</b></a> &mdash; 30+ pizzas and housemade pasta in Castello',
  ],
  alts: [
    '<b>Doge’s Palace courtyard</b> &mdash; free-adjacent and a better backup if the Basilica line feels like too much with kids.',
    '<b>Bridge of Sighs</b> &mdash; a two-minute photo stop just behind the palace.',
    '<b>Gelato on the Riva</b> &mdash; a waterfront cone with the lagoon view instead of a second church.',
  ],
  blogs: [
    { label: 'St. Mark’s Basilica & Piazza Guide', href: 'https://thetourguy.com/travel-blog/venice/st-marks-square-basilica/' },
    { label: 'A Half-Day in Piazza San Marco', href: 'https://www.klook.com/blog/piazza-san-marco/' },
  ],
});
const buranoSpot = mkSpot({
  name: 'Murano &amp; Burano Islands', tags: ['burano', 'murano', 'venice'], carouselId: 'c-burano',
  images: buranoImages, lat: 45.4854, lng: 12.4166,
  cost: 'Covered by your vaporetto pass (Line 12 from Fondamente Nove). Glass demos are free to watch; a formal 10-minute demo ~&euro;5/person.',
  climateLabel: 'Weather', climate: '<b>82&deg;F</b> day / <b>68&deg;F</b> night &mdash; a few degrees cooler on the open-lagoon crossing, a welcome breeze.',
  save: 'Skip the &euro;35&ndash;60/person guided island tours &mdash; Line 12 is already on your pass. DIY saves ~&euro;140&ndash;240 for the family and you set your own pace.',
  splurge: 'A private water taxi loop Venice &rarr; Murano &rarr; Burano &rarr; Venice, ~&euro;250&ndash;350 for the group &mdash; no schedule, no crowded platforms, door to door.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=Ristorante+Pizzeria+Principe+Burano" target="_blank" rel="noreferrer"><b>Pizzeria Principe</b></a> &mdash; long pizza menu right on the rainbow canal, Burano',
    '<a href="https://www.ristorantepizzeriabarsport.it/" target="_blank" rel="noreferrer"><b>Bar Sport Ristorante Pizzeria</b></a> &mdash; 20+ pizzas plus local seafood, Burano',
    '<a href="https://www.google.com/maps/search/?api=1&query=Al+Vecio+Pipa+Burano" target="_blank" rel="noreferrer"><b>Al Vecio Pipa</b></a> &mdash; ~&euro;20 fixed menu with a plain-pasta option',
  ],
  alts: [
    '<b>Murano glass furnace demo</b> &mdash; a short live glass-blowing show the kids will remember.',
    '<b>Torcello</b> &mdash; the near-empty third island; skip it here, two islands is already a full day for an 8-year-old.',
    '<b>A Burano lace shop</b> &mdash; a two-minute cultural stop between gelato and the boat.',
  ],
  blogs: [
    { label: 'Venice Islands with Kids', href: 'https://theknowledgenuggets.com/doing-a-day-trip-from-venice-with-kids-murano-burano-torcello/' },
    { label: 'The Islands of Venice with Kids', href: 'https://mamalovesitaly.com/islands-of-venice-with-kids/' },
  ],
});
const braiesSpot = mkSpot({
  name: 'Lago di Braies', tags: ['lagodibraies', 'dolomites', 'pragserwildsee'], carouselId: 'c-braies',
  images: braiesImages, lat: 46.6958, lng: 12.0857,
  cost: 'Parking &euro;7 (P2) to &euro;12 (P3, lakeside). Rowboat: shared &euro;20/person, private 45-min &euro;55. Valley car-closed 9am&ndash;4pm from Jul 1 &mdash; reserve at prags.bz.',
  climateLabel: 'Altitude', climate: '<b>60&deg;F</b> day / <b>42&deg;F</b> night at lake level (1,496m) &mdash; the cold lake keeps mornings crisp; go before 9am for glass-still reflections.',
  save: 'Skip the boat and walk the free ~35-minute lakeshore loop &mdash; same emerald water, same boathouse, zero queue. Saves ~&euro;55&ndash;80 for the family.',
  splurge: 'A private 45-minute rowboat (&euro;55) at golden hour for the postcard frame &mdash; wooden hull, the boathouse behind you, the peaks doubled in the water.',
  restos: [
    '<a href="https://www.lagodibraies.com/en/foods-and-drinks/panorama-restaurant-p138.html" target="_blank" rel="noreferrer"><b>Panorama (Hotel Lago di Braies)</b></a> &mdash; lake-view terrace, South Tyrolean; simple pasta for kids, reserve ahead',
    '<a href="https://www.lagodibraies.com/en/" target="_blank" rel="noreferrer"><b>Chalet snack counter</b></a> &mdash; fries, sandwiches, simple pasta, the fast picky-eater lunch',
    '<a href="https://www.google.com/maps/search/?api=1&query=Ristorante+Lago+di+Braies" target="_blank" rel="noreferrer"><b>Ristorante Lago di Braies</b></a> &mdash; independent lakeside spot, confirm pizza on the day’s menu',
  ],
  alts: [
    '<b>Lago di Carezza</b> &mdash; a zero-hike, drive-up alpine lake below the Latemar with no reservation system.',
    '<b>Lago di Dobbiaco</b> &mdash; a flat, stroller-easy lake loop close to the base.',
    '<b>Prato Piazza (Plätzwiese)</b> &mdash; a high meadow plateau if the family wants views without a climb.',
  ],
  blogs: [
    { label: 'How to Visit Lago di Braies', href: 'https://www.earthtrekkers.com/how-to-visit-lago-di-braies/' },
    { label: 'Lago di Braies 2026 Guide', href: 'https://www.moonhoneytravel.com/lago-di-braies-italy/' },
  ],
});
const treCimeSpot = mkSpot({
  name: 'Tre Cime di Lavaredo', tags: ['trecime', 'dreizinnen', 'dolomites'], carouselId: 'c-trecime',
  images: treCimeImages, lat: 46.6167, lng: 12.3017,
  cost: 'Toll road to Rifugio Auronzo &euro;40/car (pre-book a timed slot at auronzo.info). Rifugio lunch ~&euro;60&ndash;80/family.',
  climateLabel: 'Altitude', climate: '<b>62&deg;F</b> day / <b>38&deg;F</b> night at 2,333m &mdash; afternoon storms are common; start the loop by 9am and be down by mid-afternoon.',
  save: 'Book the 7&ndash;9am toll slot for the best light and thinnest crowd, and pack sandwiches for the Locatelli viewpoint instead of a rifugio lunch (&euro;15&ndash;18/plate &times; 4).',
  splurge: 'Sleep at Rifugio Locatelli (~&euro;60&ndash;70/person half-board) to get the blue-hour and sunrise faces without the day-trippers &mdash; bring cash, the huts don’t take cards.',
  restos: [
    '<a href="https://rifugioauronzo.it/en/" target="_blank" rel="noreferrer"><b>Rifugio Auronzo</b></a> &mdash; self-service at the trailhead: pasta, wurstel, fries, polenta; easiest kid meal on the mountain',
    '<a href="https://www.passionedolomiti.com/en/rifugio/rifugio-locatelli/" target="_blank" rel="noreferrer"><b>Rifugio Locatelli</b></a> &mdash; the classic Three-Peaks view hut; plain polenta for picky eaters',
    '<a href="https://www.google.com/maps/search/?api=1&query=Rifugio+Lavaredo" target="_blank" rel="noreferrer"><b>Rifugio Lavaredo</b></a> &mdash; trailside on the loop, same Alpine self-service and a good fallback if Locatelli is packed',
  ],
  alts: [
    '<b>Lago di Sorapis</b> &mdash; a harder, quieter hike to a milky-turquoise lake (fixed cables) for the 13-year-old.',
    '<b>Cadini di Misurina viewpoint</b> &mdash; a short side-spur off the Tre Cime loop with a jaw-dropping pinnacle view.',
    '<b>Lago di Misurina lakeshore</b> &mdash; the easy, flat option at the foot of the toll road if legs are done.',
  ],
  blogs: [
    { label: 'Tre Cime Loop Trail Guide', href: 'https://www.earthtrekkers.com/hiking-tre-cime-di-lavaredo-loop/' },
    { label: 'The Ultimate Tre Cime Guide (2026)', href: 'https://throneandvine.com/tre-cime-di-lavaredo-drei-zinnen-guide/' },
  ],
});
const secedaSpot = mkSpot({
  name: 'Seceda &amp; Alpe di Siusi', tags: ['seceda', 'alpedisiusi', 'valgardena'], carouselId: 'c-seceda',
  images: secedaImages, lat: 46.5928, lng: 11.6772,
  cost: 'Ortisei&ndash;Seceda cableway round trip ~&euro;74 adult / &euro;37 junior (8&ndash;15), under-8 free &mdash; ~&euro;222/family. Timed-slot pre-booking required.',
  climateLabel: 'Altitude', climate: '<b>57&deg;F</b> day / <b>38&deg;F</b> night on the 2,500m ridge &mdash; very exposed and windy; do the ridge walk before noon, before the storms build.',
  save: 'Buy one-way UP (&euro;49 adult/&euro;25 junior) and hike down via Rifugio Firenze &mdash; it turns the priciest ticket of the leg into the day’s epic hike and saves ~&euro;25/adult.',
  splurge: 'The full Seceda&ndash;Rifugio Firenze&ndash;Baita Troier circuit with a mid-ridge rifugio lunch &mdash; a half-day alpine trek under the Odle spires with three hut stops.',
  restos: [
    '<a href="https://www.sanon.it/" target="_blank" rel="noreferrer"><b>Baita Sanon</b></a> &mdash; Alpe di Siusi, family-run Tyrolean/Ladin, explicitly kid-friendly, plain plates on request',
    '<a href="https://www.google.com/maps/search/?api=1&query=Rifugio+Firenze+Regensburger+Hutte" target="_blank" rel="noreferrer"><b>Rifugio Firenze</b></a> &mdash; on the ridge circuit; pasta, polenta, dumplings and an Odle-peaks terrace',
    '<a href="https://www.google.com/maps/search/?api=1&query=Rifugio+Bullaccia+Puflatsch" target="_blank" rel="noreferrer"><b>Ristorante Bullaccia (Puflatsch)</b></a> &mdash; Alpe di Siusi, fast-serving South Tyrolean for small kids',
  ],
  alts: [
    '<b>Passo Giau</b> &mdash; drive up the switchbacks to a wide-open meadow saddle with 360&deg; views; no cable car, no timed slot.',
    '<b>Alpe di Siusi (Compatsch)</b> &mdash; Europe’s largest alpine meadow, gentle and stroller-friendly by its own gondola.',
    '<b>Ortisei town</b> &mdash; a pretty Val Gardena stroll if the ridge is socked in.',
  ],
  blogs: [
    { label: 'Best Way to Visit Seceda', href: 'https://www.earthtrekkers.com/seceda-dolomites/' },
    { label: 'Seceda&ndash;Rifugio Firenze Circuit', href: 'https://www.moonhoneytravel.com/hiking-seceda-regensburger-hutte-val-gardena/' },
  ],
});
const cinqueTorriSpot = mkSpot({
  name: 'Cinque Torri', tags: ['cinquetorri', 'dolomites', 'cortina'], carouselId: 'c-cinque',
  images: cinqueTorriImages, lat: 46.5119, lng: 12.0333,
  cost: 'Chairlift return &euro;27.50 adult (one-way &euro;20.50); under-8 free, minors discounted &mdash; budget ~&euro;75&ndash;85/family. 5% card discount in 2026.',
  climateLabel: 'Altitude', climate: '<b>60&deg;F</b> day / <b>40&deg;F</b> night at Rifugio Scoiattoli (2,225m) &mdash; short and easy, so it forgives a late-morning start after a slow breakfast.',
  save: 'Pay by credit card at the base for the built-in 5% discount, then walk the free ~2km WWI-trench loop once you’re up &mdash; one of the cheapest “epic scenery” stops of the whole trip.',
  splurge: 'Add the beginner via-ferrata-lite from Rifugio Scoiattoli toward Averau (short, guided) for the 13-year-old &mdash; a real climbing memory while the rest of the family relaxes on the terrace.',
  restos: [
    '<a href="https://5torri.it/EN/s24-Scoiattoli-Refuge" target="_blank" rel="noreferrer"><b>Rifugio Scoiattoli</b></a> &mdash; right under the towers; casunziei ravioli and polenta, flag ahead for a plain-pasta kid plate',
    '<a href="https://www.rifugioaverau.it/en/cuisine/the-restaurant/" target="_blank" rel="noreferrer"><b>Rifugio Averau</b></a> &mdash; a 30-min walk on, sommelier-run homemade pasta; confirm a simple option',
    '<a href="https://5torri.it/EN/s27-Cinque-Torri-Refuge" target="_blank" rel="noreferrer"><b>Rifugio Cinque Torri</b></a> &mdash; casual at the base of the towers; casunziei, ricotta strudel, homemade bread',
  ],
  alts: [
    '<b>Rifugio Lagazuoi</b> &mdash; a 5-minute cable car to a WWI tunnel network and a panoramic hut at Passo Falzarego.',
    '<b>Nuvolau / Averau loop</b> &mdash; a longer scramble to a 360&deg; summit view for the strong-legged.',
    '<b>Lago Ghedina</b> &mdash; a quiet, forest-ringed little lake near Cortina for an easy afternoon.',
  ],
  blogs: [
    { label: 'Cinque Torri Hike & Rifugios', href: 'https://www.earthtrekkers.com/cinque-torri-hike-dolomites/' },
    { label: 'Cinque Torri with Kids', href: 'https://www.ourbigjourney.com/cinque-torri-dolomites/' },
  ],
});
const cortinaSpot = mkSpot({
  name: 'Cortina d\'Ampezzo &amp; the Faloria Cable Car', tags: ['cortina', 'dolomites', 'faloria'], carouselId: 'c-cortina',
  images: cortinaImages, lat: 46.5405, lng: 12.1357,
  cost: 'Faloria cable car ~&euro;27 adult / ~&euro;20 under-16 (~&euro;94/family). Freccia nel Cielo to Cima Tofana &euro;45 adult round trip.',
  climateLabel: 'Weather', climate: '<b>65&deg;F</b> day / <b>45&deg;F</b> night in town (1,224m) &mdash; mornings are the reliably clear window; storms roll through most afternoons.',
  save: 'Ride Faloria (~half the price of Freccia nel Cielo) for a comparable panorama, and window-shop Corso Italia for free &mdash; the 2026-Olympics town is a stroll, not a ticket.',
  splurge: 'Freccia nel Cielo all the way to Cima Tofana (3,244m, &euro;45 adult) &mdash; the single highest, most dramatic viewpoint reachable without technical climbing on the whole trip.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=Ristorante+Pizzeria+5+Torri+Cortina" target="_blank" rel="noreferrer"><b>Ristorante Pizzeria 5 Torri</b></a> &mdash; Corso Italia, busy family standby, traditional pizza and pasta',
    '<a href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Ai+Due+Forni+Cortina" target="_blank" rel="noreferrer"><b>Pizzeria Ai Due Forni</b></a> &mdash; town center, pizza by the slice or whole, the fast post-hike dinner',
    '<a href="https://www.google.com/maps/search/?api=1&query=El+Camineto+Cortina" target="_blank" rel="noreferrer"><b>El Camineto</b></a> &mdash; above town with a valley view; polenta, grilled meats, simple pasta for kids',
  ],
  alts: [
    '<b>Lago di Sorapis viewpoint (Passo Tre Croci)</b> &mdash; roadside massif views instead of a second cable car if legs are tired.',
    '<b>Rifugio Lagazuoi + WWI tunnels</b> &mdash; a cable-car-and-history half day at Passo Falzarego.',
    '<b>Mercato / gelato on Corso Italia</b> &mdash; a low-key town afternoon before the flight south.',
  ],
  blogs: [
    { label: 'Cortina d’Ampezzo Guide', href: 'https://www.moonhoneytravel.com/cortina-d-ampezzo-italy/' },
    { label: 'Cortina with Kids', href: 'https://mamalovesitaly.com/cortina-d-ampezzo-with-kids/' },
  ],
});
const costaSmeraldaSpot = mkSpot({
  name: 'Costa Smeralda Beaches', tags: ['costasmeralda', 'portocervo', 'sardinia'], carouselId: 'c-smeralda',
  images: costaSmeraldaImages, lat: 41.0892, lng: 9.5619,
  cost: 'Beaches free (public below the tide line). Loungers &euro;80&ndash;160/day at Capriccioli/Liscia Ruja clubs. Principe parking ~&euro;10&ndash;15.',
  climateLabel: 'Weather', climate: '<b>86&deg;F</b> day / <b>66&deg;F</b> night. Sea <b>75&deg;F</b> &mdash; warm and glass-clear in the sheltered coves, calmest in the morning.',
  save: 'Walk 5&ndash;10 minutes along Capriccioli or Liscia Ruja to the free (<i>libera</i>) sand, bring your own umbrella and mat, and skip the &euro;80&ndash;160/day beach-club fee entirely.',
  splurge: 'Front-row loungers and an umbrella at a Liscia Ruja beach club (~&euro;150&ndash;160) buys shade, bar service, and the full see-and-be-seen Costa Smeralda afternoon.',
  restos: [
    '<a href="https://ristorantemyrto.it/en/home-english/" target="_blank" rel="noreferrer"><b>Myrto Ristorante Pizzeria</b></a> &mdash; Porto Cervo, wood-fired gourmet pizza; a classic margherita for the kids',
    '<a href="https://www.ristorantelavecchiacosta.com/" target="_blank" rel="noreferrer"><b>La Vecchia Costa</b></a> &mdash; Gallurese trattoria + thin-crust pizza, plus a garden playground',
    '<a href="https://www.google.com/maps/search/?api=1&query=Hivaoa+Porto+Cervo" target="_blank" rel="noreferrer"><b>Hivaoa Ristorante Pizzeria</b></a> &mdash; Porto Cervo marina, simple pasta al pomodoro or pizza waterside',
  ],
  alts: [
    '<b>Spiaggia di Romazzino</b> &mdash; a quieter, equally turquoise cove one bay over from Principe.',
    '<b>Spiaggia del Principe</b> &mdash; the postcard Costa Smeralda beach when you want the iconic one.',
    '<b>Porto Cervo old marina</b> &mdash; a gelato-and-yacht-watching stroll for a low-key evening.',
  ],
  blogs: [
    { label: 'Prince’s Beaches (Sardegna Turismo)', href: 'https://www.sardegnaturismo.it/en/princes-beaches' },
    { label: 'Prince’s Beach Guide', href: 'https://sardiniabella.com/en/princes-beach-guide-things-to-do/' },
  ],
});
const maddalenaSpot = mkSpot({
  name: 'La Maddalena Archipelago (Boat Day)', tags: ['lamaddalena', 'budelli', 'sardinia'], carouselId: 'c-maddalena',
  images: maddalenaImages, lat: 41.2789, lng: 9.3567,
  cost: 'Full-day boat from Palau ~&euro;60 adult / &euro;50 child (13yo priced as adult) &mdash; ~&euro;230/family, park fee included. Landing on Spiaggia Rosa is banned; swim stops are Spargi/Cala Corsara.',
  climateLabel: 'Weather', climate: '<b>86&deg;F</b> day / <b>66&deg;F</b> night. Sea <b>75&ndash;77&deg;F</b> &mdash; exceptionally clear and calm in the sheltered island coves.',
  save: 'Book the standard shared boat (&euro;60/adult) rather than a private charter &mdash; a near-identical swim-stop itinerary for a few hundred euros less.',
  splurge: 'A private skippered gozzo or RIB out of Palau (~&euro;700&ndash;900/day) &mdash; your own pace at Budelli, Cala Corsara and Caprera, no crowds, no fixed schedule.',
  restos: [
    '<a href="https://www.capreraristorante.it/" target="_blank" rel="noreferrer"><b>Ristorante Caprera</b></a> &mdash; La Maddalena town harborside, pizza margherita or pasta in bianco for kids',
    '<a href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Civico+49+La+Maddalena" target="_blank" rel="noreferrer"><b>Pizzeria Civico 49</b></a> &mdash; historic-center Neapolitan wood-fired, fast turnaround',
    '<a href="https://www.cuppulata.it/" target="_blank" rel="noreferrer"><b>Hostaria CuPPulata</b></a> &mdash; Palau, 72-hour-dough pizzeria, listed as kid-friendly',
  ],
  alts: [
    '<b>Caprera / Compendio Garibaldino</b> &mdash; Garibaldi’s house-museum island, a shaded stop most tours already fold in.',
    '<b>Spiaggia del Relitto (Caprera)</b> &mdash; a turquoise shipwreck-beach swim stop on many itineraries.',
    '<b>Porto Palau evening</b> &mdash; an easy harbor dinner after the boat instead of a second outing.',
  ],
  blogs: [
    { label: 'Best Boat Trips to La Maddalena', href: 'https://strictlysardinia.com/best-boat-trips-to-la-maddalena/' },
    { label: 'Budelli Island Guide', href: 'https://sardiniabella.com/en/budelli-island-best-beaches-and-what-to-do/' },
  ],
});
const pelosaSpot = mkSpot({
  name: 'La Pelosa, Stintino', tags: ['lapelosa', 'stintino', 'sardinia'], carouselId: 'c-pelosa',
  images: pelosaImages, lat: 40.9652, lng: 8.2096,
  cost: 'Access &euro;3.50/person (under-12 free) &mdash; ~&euro;10.50/family, booked at app.stintinospiagge.it. Parking ~&euro;10&ndash;15. ~2h drive each way from Cannigione.',
  climateLabel: 'Weather', climate: '<b>86&deg;F</b> day / <b>66&deg;F</b> night. Sea <b>74&ndash;75&deg;F</b> &mdash; the shallow white-sand lagoon runs a degree or two warmer than the open coast by afternoon.',
  save: 'No lounger rental needed &mdash; the lagoon is shin-deep and calm, so a mat and umbrella are plenty. Beyond the ~&euro;10.50 ticket and parking, it’s the cheapest beach of the trip.',
  splurge: 'A boat/snorkel excursion from Stintino out to Asinara Island (wild albino donkeys, an old penal colony) &mdash; ~&euro;60&ndash;80/person, or lunch on Il Gabbiano’s beachfront terrace.',
  restos: [
    '<a href="https://www.lufanali.it/" target="_blank" rel="noreferrer"><b>Lu Fanali</b></a> &mdash; Stintino lungomare pizzeria/bar facing the harbor; pizza and big-portion pasta',
    '<a href="https://www.ilgabbianostintino.it/ristorante/" target="_blank" rel="noreferrer"><b>Il Gabbiano</b></a> &mdash; beachfront terrace; plain pizza while the kids play on the sand steps away',
    '<a href="https://www.tripadvisor.com/Restaurant_Review-g608925-d1863901-Reviews-Il_Portico-Stintino_Province_of_Sassari_Sardinia.html" target="_blank" rel="noreferrer"><b>Il Portico</b></a> &mdash; Lungomare Colombo; standard kids’ pizza and pasta menu',
  ],
  alts: [
    '<b>Asinara National Park</b> &mdash; a former-penal-colony island by ferry from Stintino, a full nature/wildlife day.',
    '<b>Spiaggia delle Saline</b> &mdash; a longer, less-regulated Stintino beach if La Pelosa is capped out.',
    '<b>Skip the drive</b> &mdash; trade La Pelosa for a second Costa Smeralda day if nobody wants the road time.',
  ],
  blogs: [
    { label: 'How to Visit La Pelosa', href: 'https://www.bontraveler.com/la-pelosa-sardinia/' },
    { label: 'La Pelosa Beach Guide', href: 'https://www.thisislandlife.com/travel/la-pelosa-beach-in-stintino-sardinia/' },
  ],
});
const calaGononeSpot = mkSpot({
  name: 'Cala Gonone &amp; Grotta del Bue Marino', tags: ['calagonone', 'dorgali', 'sardinia'], carouselId: 'c-gonone',
  images: calaGononeImages, lat: 40.2775, lng: 9.6317,
  cost: 'Town beach free. Cave + Cala Luna boat trip ~&euro;90&ndash;130/family; short cave-only from &euro;15/person + cave entry &amp; &euro;2 eco tax.',
  climateLabel: 'Weather', climate: '<b>86&deg;F</b> day / <b>69&deg;F</b> night. Sea <b>~75&deg;F</b> &mdash; clear and calm in the harbor, sheltered from the Maestrale wind.',
  save: 'Skip the boat and walk the free Spiaggia Centrale plus a short stroll to pebbly Cala Fuili &mdash; a rest morning for ~&euro;0&ndash;20 before the big Orosei boat day.',
  splurge: 'A private cave + Cala Luna + snorkel combo charter (~&euro;250&ndash;300/family) with a small operator &mdash; sea cave, beach, and swimming stops at your own pace.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=La+Favorita+Cala+Gonone" target="_blank" rel="noreferrer"><b>La Favorita Pizzeria Bistrot</b></a> &mdash; waterfront, seafood + wood-fired pizza; plain margherita for the kids',
    '<a href="https://www.google.com/maps/search/?api=1&query=Ristorante+Il+Banjo+Cala+Gonone" target="_blank" rel="noreferrer"><b>Ristorante Il Banjo</b></a> &mdash; seafront promenade trattoria/pizzeria; kids’ pasta al pomodoro',
    '<a href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Zio+Pedrillo+Cala+Gonone" target="_blank" rel="noreferrer"><b>Pizzeria Zio Pedrillo</b></a> &mdash; casual two-level pizzeria, margherita &euro;7, gluten-free available',
  ],
  alts: [
    '<b>Cala Fuili</b> &mdash; white pebbles and turquoise water a short drive/walk from town, the free rest-morning option.',
    '<b>Grotta del Bue Marino</b> &mdash; a short sea-cave boat trip when you want an easy on-the-water outing.',
    '<b>Dorgali town</b> &mdash; a low-key craft-and-gelato stroll 10 minutes inland.',
  ],
  blogs: [
    { label: 'Cala Gonone Guide', href: 'https://strictlysardinia.com/cala-gonone-sardinia-guide/' },
    { label: 'Grotta del Bue Marino (official)', href: 'https://www.grottabuemarino.com/en-home' },
  ],
});
const oroseiSpot = mkSpot({
  name: 'Gulf of Orosei Boat Day &mdash; Cala Goloritzé', tags: ['calagoloritze', 'golfodiorosei', 'sardinia'], carouselId: 'c-orosei',
  images: oroseiImages, lat: 40.1080, lng: 9.6897,
  cost: 'Full-day group boat from Cala Gonone ~&euro;55&ndash;70 adult / &euro;35 child &mdash; ~&euro;190&ndash;210/family + &euro;2/person eco tax. Most groups moor off Goloritzé (swim-up), not land.',
  climateLabel: 'Weather', climate: '<b>86&deg;F</b> day / <b>69&deg;F</b> night. Sea <b>~75&deg;F</b> &mdash; the sheltered Orosei gulf is turquoise, clear, and calm; the reason this is the finale.',
  save: 'Take the standard group boat (~&euro;200/family) doing the Luna&ndash;Mariolu&ndash;Goloritzé circuit rather than a private charter &mdash; same coves, several hundred euros less.',
  splurge: 'A private full-day skipper charter (~&euro;650) &mdash; land where you like, linger at Cala Mariolu, and reach Goloritzé’s arch without a fixed timetable.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=La+Favorita+Cala+Gonone" target="_blank" rel="noreferrer"><b>La Favorita Pizzeria Bistrot</b></a> &mdash; Cala Gonone waterfront, the reliable post-boat pizza dinner',
    '<a href="https://www.google.com/maps/search/?api=1&query=Ristorante+Il+Banjo+Cala+Gonone" target="_blank" rel="noreferrer"><b>Ristorante Il Banjo</b></a> &mdash; seafront pasta and pizza a short walk from the harbor',
    '<a href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Zio+Pedrillo+Cala+Gonone" target="_blank" rel="noreferrer"><b>Pizzeria Zio Pedrillo</b></a> &mdash; the easy kid-pleaser after a long day on the water',
  ],
  alts: [
    '<b>Cala Mariolu</b> &mdash; the white-pebble, ultra-clear cove usually on the same boat itinerary; the swim stop that steals the day.',
    '<b>Cala Luna</b> &mdash; the wide crescent with sea caves, a common lunch anchorage on the route.',
    '<b>Santa Maria Navarrese</b> &mdash; an alternate boat launch to the south if Cala Gonone is booked out.',
  ],
  blogs: [
    { label: 'Cala Goloritzé: 10 Things to Know', href: 'https://strictlysardinia.com/cala-goloritze-guide/' },
    { label: 'East-Coast Planning Notes', href: 'https://sardiniarevealed.com/hiking-gorropu-canyon-in-sardinia/' },
  ],
});
const gorropuSpot = mkSpot({
  name: 'Su Gorropu Gorge (Flumineddu Valley)', tags: ['sugorropu', 'gorropu', 'supramonte'], carouselId: 'c-gorropu',
  images: gorropuImages, lat: 40.1907, lng: 9.4886,
  cost: 'Self-guided entry &euro;5 adult / &euro;3.50 child (~&euro;17/family, cash). Guided 4&times;4 + hike ~&euro;55 adult / &euro;45 child (~&euro;200/family).',
  climateLabel: 'Trail', climate: '<b>Low 90s&deg;F</b> in the open valley by midday, cooler (~75&ndash;80&deg;F) deep in the shaded gorge &mdash; start by 7&ndash;8am; several guides call July midday “too hot.”',
  save: 'Go self-guided from the Sa Barva Bridge with your own car and water (~&euro;17 entry) rather than booking a guided tour &mdash; the valley approach is well-trodden and needs no rope work.',
  splurge: 'A private guided 4&times;4 + hike (~&euro;200) &mdash; a licensed guide, the bumpy transfer to the trailhead, and a safer margin with an 8-year-old near the gorge’s harder sections.',
  restos: [
    '<a href="https://www.google.com/maps/search/?api=1&query=La+Favorita+Cala+Gonone" target="_blank" rel="noreferrer"><b>La Favorita Pizzeria Bistrot</b></a> &mdash; 10 minutes from Dorgali on the Cala Gonone waterfront, a big carb reload',
    '<a href="https://www.google.com/maps/search/?api=1&query=Ristorante+Il+Banjo+Cala+Gonone" target="_blank" rel="noreferrer"><b>Ristorante Il Banjo</b></a> &mdash; seafront pasta and pizza, the easy picky-eater dinner',
    '<a href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Zio+Pedrillo+Cala+Gonone" target="_blank" rel="noreferrer"><b>Pizzeria Zio Pedrillo</b></a> &mdash; casual, margherita and gluten-free for tired kids',
  ],
  alts: [
    '<b>Cala Fuili rest afternoon</b> &mdash; pair the hard gorge morning with an easy beach, not a second activity.',
    '<b>Tiscali nuraghic village</b> &mdash; a shorter archaeological hike in the same Supramonte if the heat is brutal.',
    '<b>Swap it entirely</b> &mdash; a lazy last beach day is a legitimate choice on a trip this full.',
  ],
  blogs: [
    { label: 'Hiking Su Gorropu', href: 'https://www.jenontherun.com/hiking-su-gorropu-canyon-sardinia/' },
    { label: 'Gorropu Route Comparison', href: 'https://sardiniarevealed.com/hiking-gorropu-canyon-in-sardinia/' },
  ],
});

// --- days --------------------------------------------------------------------
const V = 'San Vito di Cadore (Cortina)';
const days = [
  day('day0', 'c0', '0', 'Sun &middot; Jun 27', 'Depart Pittsburgh after the weekend', 'Overnight to Venice', 'Est. $70 &middot; airport meals', [
    fact('Sleep', 'Overnight flight toward Venice'),
    fact('Route target', 'PIT -> US/EU hub -> VCE'),
    fact('PTO', '$0 &mdash; Sunday departure'),
  ], 'Flying out Sunday evening burns zero PTO to get there and starts after the required full Pittsburgh days of Jun 24&ndash;26. One connection, then the Atlantic.', [], 'Travel day - position toward Venice.'),

  day('day1', 'c1', '1', 'Mon &middot; Jun 28', 'Land in Venice &mdash; canals, not museums', 'Easy arrival', 'Est. $180 &middot; passes, lunch, gelato, dinner', [
    fact('Sleep', 'Venice &middot; night 1 of 2'),
    fact('Transfer', 'Water taxi / Alilaguna to the hotel'),
    fact('Plan', 'Grand Canal, Rialto, first gelato'),
  ], 'Ride the water into the city (the private taxi is worth it after the red-eye), drop bags, and let the Grand Canal be the whole afternoon &mdash; nothing that makes a nap-deprived 8-year-old stand in a line.', [canalSpot]),

  day('day2', 'c1', '2', 'Tue &middot; Jun 29', 'Piazza San Marco at kid pace', 'Towns & squares', 'Est. $220 &middot; Campanile, meals', [
    fact('Sleep', 'Venice &middot; night 2 of 2'),
    fact('Morning', 'San Marco early, before the heat'),
    fact('Optional', 'Campanile lift for the lagoon view'),
  ], 'Do the great square early while it is cool and half-empty. The free piazza and facade are the memory; the Campanile elevator is the one paid add-on worth it. Keep the afternoon loose.', [sanMarcoSpot]),

  day('day3', 'c2', '3', 'Wed &middot; Jun 30', 'Burano’s colors, then drive to the mountains', 'Islands -> transfer', 'Est. $160 &middot; island lunch, groceries', [
    fact('Sleep', `${V} &middot; night 1 of 5`),
    fact('Morning', 'Line 12 to Burano / Murano'),
    fact('Afternoon', 'Collect the car at Mestre, drive ~2.5h to San Vito'),
  ], 'Rainbow houses and glass furnaces in the morning; collect the rental by early afternoon (pickup timed for today, not arrival day, to save two car days), then drive up into the Dolomites before dinner. The scenery changes completely.', [buranoSpot]),

  day('day4', 'c2', '4', 'Thu &middot; Jul 1', 'Lago di Braies &mdash; the emerald warm-up', 'Alpine lake', 'Est. $150 &middot; shuttle/boat, rifugio lunch', [
    fact('Sleep', `${V} &middot; night 2 of 5`),
    fact('Early', 'Beat the 9am valley car-closure'),
    fact('Walk', 'Free lakeshore loop ~35 min'),
  ], 'Ease into the Dolomites with the gentlest, most famous lake. Go early &mdash; the valley closes to private cars at 9am from July 1 (reserve at prags.bz), and morning is when the water is a mirror.', [braiesSpot]),

  day('day5', 'c2', '5', 'Fri &middot; Jul 2', 'Tre Cime di Lavaredo &mdash; the big one', 'Epic hike', 'Est. $180 &middot; toll road, trail lunch', [
    fact('Sleep', `${V} &middot; night 3 of 5`),
    fact('Slot', 'Pre-booked toll road, 7&ndash;9am'),
    fact('Loop', '~6mi, cable-car-free but a gentle grade'),
  ], 'The signature Dolomites day. The toll road drives you to 2,333m so the loop starts high &mdash; the 8-year-old walks under the three peaks without a summit push, the 13-year-old gets a real trail. Start early to beat the storms.', [treCimeSpot]),

  day('day6', 'c2', '6', 'Sat &middot; Jul 3', 'Seceda’s ridge by cable car', 'Cable-car alpine', 'Est. $300 &middot; cableway (family), lunch', [
    fact('Sleep', `${V} &middot; night 4 of 5`),
    fact('Cable car', 'Ortisei -> Seceda, timed slot'),
    fact('Walk', 'Ridge stroll, or hike down via Rifugio Firenze'),
  ], 'The cable car does the climbing so everyone stands on the 2,500m Seceda ridge &mdash; the tilted-earth view of the Odle spires. Do the ridge walk before noon; willing hikers can ride up one-way and walk down to turn the ticket into the day’s trek.', [secedaSpot]),

  day('day7', 'c2', '7', 'Sun &middot; Jul 4', 'Cinque Torri & Cortina &mdash; the lighter day', 'Easy hike + town', 'Est. $200 &middot; chairlift, cable car, dinner', [
    fact('Sleep', `${V} &middot; night 5 of 5`),
    fact('Morning', 'Cinque Torri chairlift + WWI loop'),
    fact('Afternoon', 'Cortina town / Faloria cable car'),
  ], 'A gentler finale to the alpine leg on the Fourth of July. The short Cinque Torri loop threads WWI trenches under wild towers, with an optional via-ferrata-lite for the 13-year-old, then Cortina for a stroll and gelato. Pack tonight &mdash; Sardinia tomorrow.', [cinqueTorriSpot, cortinaSpot]),

  day('day8', 'c3', '8', 'Mon &middot; Jul 5', 'Fly to Sardinia &mdash; the beach begins', 'Transfer -> first swim', 'Est. $120 &middot; airport, arrival dinner', [
    fact('Sleep', 'Cannigione (Costa Smeralda) &middot; night 1 of 3'),
    fact('Morning', 'Drive Cortina -> Venice (~2.5h), drop the car'),
    fact('Flight', 'VCE -> OLB (~1h25 Volotea)'),
  ], 'The observed July 4th holiday, and a full change of scene: down out of the mountains, drop the first car at Venice, hop the Volotea flight to Olbia, pick up the Sardinia car, and get the first toes-in-turquoise swim before dinner.', [costaSmeraldaSpot]),

  day('day9', 'c3', '9', 'Tue &middot; Jul 6', 'La Maddalena archipelago boat day', 'Boats & islands', 'Est. $320 &middot; full-day boat, lunch', [
    fact('Sleep', 'Cannigione (Costa Smeralda) &middot; night 2 of 3'),
    fact('All day', 'Shared boat from Palau (~20 min away)'),
    fact('Swim', 'Spargi, Cala Corsara, Budelli'),
  ], 'Arguably the single most beautiful beach day of the whole trip: a full-day boat through the pink-sand archipelago, swimming in coves the color of a pool. You photograph Spiaggia Rosa from the water (landing is banned) and swim at Cala Corsara instead.', [maddalenaSpot]),

  day('day10', 'c3', '10', 'Wed &middot; Jul 7', 'La Pelosa’s shallow lagoon', 'Beach day (long drive)', 'Est. $150 &middot; access, parking, meals', [
    fact('Sleep', 'Cannigione (Costa Smeralda) &middot; night 3 of 3'),
    fact('Drive', '~2h each way to Stintino'),
    fact('Beach', 'Shin-deep white-sand lagoon'),
  ], 'The postcard shallow beach of the northwest &mdash; Caribbean-clear, barely knee-deep for a hundred meters, perfect for the 8-year-old. Be honest that it is a ~2-hour drive each way; leave early with the booked ticket, or trade it for a second Costa Smeralda day.', [pelosaSpot]),

  day('day11', 'c4', '11', 'Thu &middot; Jul 8', 'South to the Gulf of Orosei', 'Transfer -> beach town', 'Est. $130 &middot; drive, beach, groceries', [
    fact('Sleep', 'Cala Gonone &middot; night 1 of 3'),
    fact('Drive', 'Cannigione -> Cala Gonone (~2h)'),
    fact('Afternoon', 'Settle, town beach or Cala Fuili'),
  ], 'A scenic drive down the east coast to the trip’s final base, tucked under the Supramonte cliffs. Keep the afternoon easy &mdash; the free town beach or pebbly Cala Fuili &mdash; and rest legs before the two big east-coast days.', [calaGononeSpot]),

  day('day12', 'c4', '12', 'Fri &middot; Jul 9', 'Cala Goloritzé & the Orosei coves', 'The grand-finale boat day', 'Est. $300 &middot; full-day boat, lunch', [
    fact('Sleep', 'Cala Gonone &middot; night 2 of 3'),
    fact('All day', 'Boat from Cala Gonone'),
    fact('Swim', 'Cala Luna, Mariolu, Goloritzé'),
  ], 'The climax: a full-day boat along the Gulf of Orosei to the most-photographed cove in Italy &mdash; Cala Goloritzé, its limestone pinnacle over water so clear the boats look like they float on air. Cala Luna and Mariolu on the way. This is the shot the trip was built around.', [oroseiSpot]),

  day('day13', 'c4', '13', 'Sat &middot; Jul 10', 'Su Gorropu, or a well-earned beach', 'Adventure or rest', 'Est. $160 &middot; entry/guide, beach', [
    fact('Sleep', 'Cala Gonone &middot; night 3 of 3'),
    fact('Option A', 'Su Gorropu gorge hike (start 7am)'),
    fact('Option B', 'Easy beach + pack'),
  ], 'A flexible last full day. The strong-legged can tackle Su Gorropu &mdash; Europe’s deepest gorge &mdash; via the gentle Flumineddu valley approach, starting at dawn to beat the July heat and turning back before the hardest sections with the 8-year-old. Or just claim a final beach.', [gorropuSpot]),

  day('day14', 'c0', '14', 'Sun &middot; Jul 11', 'Fly home from Olbia', 'Travel day', 'Est. $60 &middot; road snacks, airport', [
    fact('Sleep', 'Home Sunday Jul 11'),
    fact('Morning', 'Drive Cala Gonone -> OLB (~1h30)'),
    fact('PTO', '$0 &mdash; Sunday return'),
  ], 'An easy last drive back up to Olbia, drop the second car, and fly home &mdash; landing in Pittsburgh the same day. A Sunday return means no PTO spent getting home; the memory card is full.', [], 'Travel day - leave Olbia Sunday Jul 11, arrive Pittsburgh the same day.'),
];

// --- preview hero ------------------------------------------------------------
const previewImages = [
  [pexels('23962079'), 'Day 12 &middot; Fri Jul 9', 'Cala Goloritzé', 'The pinnacle cove the whole trip is built around — the Gulf of Orosei finale.'],
  [pexels('748898'), 'Day 5 &middot; Fri Jul 2', 'Tre Cime di Lavaredo', 'The signature Dolomites day: three peaks, a high-start loop, no summit push.'],
  [pexels('12365660'), 'Day 6 &middot; Sat Jul 3', 'Seceda', 'A cable car lifts everyone to the 2,500m ridge under the Odle spires.'],
  [unsplash('1601893920982-b69daa66bbb3'), 'Day 4 &middot; Thu Jul 1', 'Lago di Braies', 'The emerald warm-up lake and its wooden boathouse at dawn.'],
  [unsplash('1536598271160-65bd0d8380bd'), 'Day 9 &middot; Tue Jul 6', 'La Maddalena', 'A full-day boat through the pink-sand archipelago’s pool-clear coves.'],
  [unsplash('1698247186956-1a06d3c7fb6c'), 'Day 8 &middot; Mon Jul 5', 'Costa Smeralda', 'The beach payoff begins the moment the flight lands in Olbia.'],
  [unsplash('1511892964110-b714f7dabcde'), 'Day 1 &middot; Mon Jun 28', 'Grand Canal, Venice', 'Two easy Venetian days open the trip — canals and gelato, not a museum march.'],
  [pexels('30089038'), 'Day 3 &middot; Wed Jun 30', 'Burano', 'Rainbow island houses before the drive up into the mountains.'],
  [unsplash('1639989327820-6891a712eba4'), 'Day 7 &middot; Sun Jul 4', 'Cinque Torri & Cortina', 'A gentler alpine finale over the Tofana wall before flying south.'],
];

// --- chrome slice ------------------------------------------------------------
const oldPart0 = template.parts[0].html;
const afterBody = oldPart0.indexOf('</head><body>') + '</head><body>'.length;
const navStart = oldPart0.indexOf('<nav class="site-nav"');
const overviewStart = oldPart0.indexOf('<section id="overview"');
const headBody = oldPart0.slice(0, afterBody).replace(/<title>.*?<\/title>/, '<title>Venice, the Dolomites & Sardinia &mdash; June 2027</title>');
const navToMain = oldPart0.slice(navStart, overviewStart).replace('      <a href="#photo-guide">Photo Guide</a>\n      <a href="#food-guide">Food Guide</a>\n', '');

const preview = `<section class="preview">
  <div class="pv-pane">
    <span class="pv-kicker">Family Trip &middot; Jun 27&ndash;Jul 11, 2027</span>
    <h1>Venice, the Dolomites<span>&amp; Sardinia</span></h1>
    <p class="pv-lead">Two nights of Venetian canals, five of rose-gold Dolomite spires, then six of the most turquoise water in the Mediterranean. One open-jaw trip that trades the flat blue payoff for jagged alpine payoff in the middle &mdash; the epic-hiking variety a Madeira leg would have carried, swapped from Atlantic cliffs to limestone towers.</p>
    <div class="pv-stats"><div><b>13</b><span>Nights</span></div><div><b>4</b><span>Home bases</span></div><div><b>18</b><span>Stops mapped</span></div><div><b>~$14.5k</b><span>priced target</span></div></div>
    <div class="pv-split" role="img" aria-label="Trip mix: about 40% water, 25% towns and food, 35% nature">
      <div class="seg water" style="flex:40"><b>40%</b><span>Water</span></div>
      <div class="seg town" style="flex:25"><b>25%</b><span>Towns &amp; food</span></div>
      <div class="seg nature" style="flex:35"><b>35%</b><span>Nature</span></div>
    </div>
    <p class="pv-cue">&darr; Full day-by-day plan below</p>
  </div>
  <div class="carousel pvcar" data-n="${previewImages.length}">
    <div class="track">${previewImages.map(([src, capDay, title, desc], index) => `<figure><img src="${src}" alt="${title}"${index ? ' loading="lazy"' : ''}><figcaption><span class="cap-day">${capDay}</span><strong>${title}</strong><span class="cap-desc">${desc}</span></figcaption></figure>`).join('')}</div>
    <button class="nav prev" aria-label="Previous">&#8249;</button>
    <button class="nav next" aria-label="Next">&#8250;</button>
    <div class="counter"><span class="cur">1</span> / ${previewImages.length}</div>
  </div>
</section>`;

const overview = `<section id="overview">
    ${sectionLabel('The Plan at a Glance', 'Canals, then peaks, then the beach payoff', 'Fly into Venice, drive the Dolomites, hop to Sardinia, fly home from Olbia &mdash; a clean open-jaw that never re-crosses its own path. The route starts <b>after</b> the required full Pittsburgh days of Jun 24&ndash;26.')}
    <div class="overview">
      <div class="ocard"><p class="eyebrow">Route</p><h4>PIT -> Venice -> Dolomites -> Sardinia -> PIT</h4><p><b>2 nights Venice</b>, <b>5 nights the Dolomites</b>, then <b>3 + 3 nights Sardinia</b>. In through VCE, home from OLB.</p></div>
      <div class="ocard"><p class="eyebrow">Why the Dolomites</p><h4>The epic-hiking variety a Madeira leg would carry</h4><p>Jagged limestone spires that glow rose-gold at sunrise, cable cars that put an 8-year-old on a 2,300m ridge, and rifugio lunches &mdash; the one leg built entirely around real alpine payoff, bracketing the beach.</p></div>
      <div class="ocard"><p class="eyebrow">Budget</p><h4>Priced target ~$14.5k; hugs the $15k cap</h4><p>Transatlantic airfare is the swing line. Book the open-jaw by December 2026 and self-cater breakfasts and it lands near $14k; late fares or private boats push it toward the cap.</p></div>
    </div>
  </section>

  <section id="why-this-trip" class="divider">
    ${sectionLabel('Why This Trip', 'The alpine-and-beach contrast Madeira was chasing', 'The trip keeps the island-climate variety that makes Madeira compelling &mdash; but swaps Atlantic cliffs for Dolomite towers and adds the bluest water in the Med.')}
    <div class="plan-grid">
      ${card('The Dolomites carry the variety', `<p>The Dolomites trade turquoise water for jagged limestone spires that glow at sunrise &mdash; a landscape unlike anything else on the trip. A cable car does the vertical work so the 8-year-old stands on a 2,300m ridge without a blister, and rifugio culture turns lunch into part of the hike. It is the &ldquo;epic hiking, different scenery&rdquo; Madeira would have delivered, just Atlantic cliffs swapped for Dolomite towers.</p>`)}
      ${card('The family fit', `<p>The 13-year-old gets real trails and an optional via-ferrata-lite; the 8-year-old gets cable-car-assisted ridges, shin-deep lagoons, and boat days. Every stop has a plain-pizza/pasta option, and three of four bases have kitchens for picky-eater breakfasts.</p>`)}
      ${card('Beach-biased, never beach-only', `<p>Sardinia’s six nights are the payoff &mdash; Costa Smeralda, La Maddalena, La Pelosa, and the Gulf of Orosei finale. But the Venice opener and the Dolomites core keep it from ever being a flat beach week.</p>`)}
    </div>
  </section>

  <section id="stays" class="divider">
    ${sectionLabel('Where We Stay', 'Four home bases, each chosen to kill backtracking', 'Every base sits central to its region’s stops, and three of the four are apartments with kitchens &mdash; cheaper, and a safety net for two picky eaters.')}
    <div class="plan-grid">
      ${card('Venice &middot; 2 nights', `${prow('Target', 'Cannaregio or Dorsoduro apartment/family room &middot; $220-$380/night')}${prow('Why', 'Historic-center canals out the door after the red-eye; Mestre is the value swap at ~half price')}${prow('Book', '4-5 months out with confirmed AC; family rooms in the center sell first')}`)}
      ${card('San Vito di Cadore (Cortina) &middot; 5 nights', `${prow('Target', 'Apartment with kitchen 11-15 min below Cortina &middot; $180-$280/night')}${prow('Why', 'Cortina center runs $380-$450+; San Vito keeps Tre Cime, Braies, and the cable cars within an hour for far less')}${prow('Book', '6+ months out; confirm the plate can clear Cortina’s ZTL')}`)}
      ${card('Cannigione (Costa Smeralda) &middot; 3 nights', `${prow('Target', 'Villa/apartment near the water &middot; $250-$400/night')}${prow('Why', '~25 min to Costa Smeralda coves, ~20 min to Palau for the La Maddalena boat, a fraction of Porto Cervo prices')}${prow('Book', '6+ months out for the first week of July')}`)}
      ${card('Cala Gonone (Gulf of Orosei) &middot; 3 nights', `${prow('Target', 'Sea/mountain-view apartment &middot; $180-$280/night')}${prow('Why', 'The launch point for the Orosei boat day and a 1h30 drive back to Olbia for the flight home')}${prow('Book', 'By Feb-Mar 2027; small town, apartments fill faster than hotels')}`)}
    </div>
  </section>`;

const calendar = calendarGrid({
  window: [2027, 6, 27, 7, 11],
  intro: 'The Jun 27&ndash;Jul 11, 2027 plan as colored activity blocks. It starts after the required full Pittsburgh days of Jun 24&ndash;26 and books both travel days onto weekends. <b>Block times are schematic</b>, snapped to a 2-hour grid to show sequence, not real flight times.',
  tripDays: [
    { date: [6, 27], blocks: [{ act: 'air', start: 18, end: 22, label: 'Fly PIT ->' }] },
    { date: [6, 28], blocks: [{ act: 'air', start: 8, end: 12, label: 'Land VCE' }, { act: 'town', start: 14, end: 18, label: 'Grand Canal' }] },
    { date: [6, 29], blocks: [{ act: 'town', start: 9, end: 13, label: 'San Marco' }, { act: 'town', start: 15, end: 18, label: 'Rialto / gelato' }] },
    { date: [6, 30], blocks: [{ act: 'town', start: 9, end: 12, label: 'Burano' }, { act: 'car', start: 13, end: 17, label: 'Drive Cortina' }] },
    { date: [7, 1], blocks: [{ act: 'hike', start: 8, end: 13, label: 'Lago di Braies' }] },
    { date: [7, 2], blocks: [{ act: 'hike', start: 8, end: 15, label: 'Tre Cime loop' }] },
    { date: [7, 3], blocks: [{ act: 'hike', start: 9, end: 15, label: 'Seceda ridge' }] },
    { date: [7, 4], blocks: [{ act: 'hike', start: 9, end: 12, label: 'Cinque Torri' }, { act: 'town', start: 14, end: 17, label: 'Cortina' }] },
    { date: [7, 5], blocks: [{ act: 'car', start: 8, end: 11, label: 'Drive VCE' }, { act: 'air', start: 12, end: 14, label: 'Fly OLB' }, { act: 'water', start: 16, end: 18, label: 'First swim' }] },
    { date: [7, 6], blocks: [{ act: 'water', start: 9, end: 17, label: 'La Maddalena boat' }] },
    { date: [7, 7], blocks: [{ act: 'car', start: 8, end: 10, label: 'Drive Stintino' }, { act: 'water', start: 10, end: 16, label: 'La Pelosa' }] },
    { date: [7, 8], blocks: [{ act: 'car', start: 9, end: 12, label: 'Drive Cala Gonone' }, { act: 'water', start: 14, end: 17, label: 'Town beach' }] },
    { date: [7, 9], blocks: [{ act: 'water', start: 9, end: 17, label: 'Orosei boat day' }] },
    { date: [7, 10], blocks: [{ act: 'hike', start: 7, end: 13, label: 'Su Gorropu' }, { act: 'rest', start: 15, end: 18, label: 'Beach + pack' }] },
    { date: [7, 11], blocks: [{ act: 'car', start: 8, end: 10, label: 'Drive OLB' }, { act: 'air', start: 11, end: 15, label: 'Fly home' }] },
  ],
});

const mapAirGround = `<section id="map" class="divider">
    ${sectionLabel('The Whole Trip, Mapped', 'Every stop on one map', 'Open <b>Map layers</b> to show or hide flights, lodging, hikes, beaches, towns, and viewpoints. Tap a region to fly there, then click any pin for Google Maps.')}
    <div class="tripmap-wrap">
      <div class="mapbtns">
        <button data-region="venice"><span class="sw" style="background:#1f6f78"></span>Venice</button><button data-region="dolomites"><span class="sw" style="background:#c25a3a"></span>Dolomites</button><button data-region="sardinia-n"><span class="sw" style="background:#3f7d4e"></span>N. Sardinia</button><button data-region="sardinia-e"><span class="sw" style="background:#3a6ea5"></span>E. Sardinia</button><button data-region="all">Whole trip</button>
      </div>
      <div class="mapstage">
        <button class="layers-btn" aria-expanded="false" aria-label="Map layers"><span class="lbi">&#9639;</span> Layers</button>
        <div class="layers-panel" hidden>
          <div class="layers-top"><strong>Map layers</strong><button class="layers-x" aria-label="Close">&times;</button></div>
          <div class="layers-acts"><button data-all="1">Select all</button><span class="dot">&middot;</span><button data-all="0">Deselect all</button></div>
          <div class="layers-list"></div>
        </div>
        <div id="tripmap"></div>
      </div>
    </div>
  </section>

  <section id="air-travel" class="divider">
    ${sectionLabel('Air Travel', 'One open-jaw ticket, one island hop', 'Pittsburgh has no nonstop to Europe, so every transatlantic option connects once. The trick is buying it as a single multi-city fare, not two one-ways. 2027 fares release in late 2026 &mdash; the bands below are current 2026 peak-summer signals.')}
    <div class="plan-grid">
      ${card('PIT -> Venice (VCE)', `${prow('Outbound', 'Sun Jun 27 evening')}${prow('Routing', '1 stop (JFK/EWR/PHL/MUC/CDG/FCO)')}${prow('Family airfare', '$5,400-$7,000 open-jaw')}${prow('Book by', 'December 2026 for the low band')}`)}
      ${card('Venice -> Olbia (OLB)', `${prow('Carrier', 'Volotea, only nonstop (~1h25)')}${prow('When', 'Mon Jul 5, midday')}${prow('Bags', 'Zero free — pre-buy online')}${prow('Family budget', '$450-$780 incl. bags')}`)}
      ${card('Home from Olbia (OLB)', `${prow('Return', 'Sun Jul 11')}${prow('Why OLB not Cagliari', '~1h30 drive from Cala Gonone vs 2.5-3h to CAG')}${prow('Routing', 'Likely via FCO or a European hub')}${prow('PTO', 'Sunday return burns no PTO')}`)}
      ${card('Why an open-jaw', `${prow('Buy as', 'One multi-city itinerary (PIT->VCE, OLB->PIT)')}${prow('Not', 'Two separate one-ways')}${prow('Payoff', 'Prices near the average of the two city fares, no repositioning leg')}`)}
    </div>
  </section>

  <section id="getting-around" class="divider">
    ${sectionLabel('Getting Around', 'Two rental cars, one flight, some winding coast roads', 'Rent separately for the Dolomites and Sardinia legs; the island hop covers the middle. Get an International Driving Permit before you fly.')}
    <div class="plan-grid">
      ${card('Dolomites car', `${prow('Pickup/drop', 'Mestre/VCE Jun 30 -> VCE Jul 5 (5 days)')}${prow('Budget', '$375-$600 plus fuel/tolls')}${prow('Watch', 'Cortina ZTL cameras fine by mail — register the plate with the hotel')}`)}
      ${card('Sardinia car', `${prow('Pickup/drop', 'Olbia airport Jul 5 -> Jul 11 (6 days)')}${prow('Budget', '$520-$850 plus fuel')}${prow('Note', 'No toll roads on the island, but plenty of winding coast — budget drive time')}`)}
      ${card('Water & transfers', `${prow('VCE -> hotel', 'Alilaguna ~€72/4 or private water taxi ~€150/4')}${prow('Tre Cime toll road', '€40/car, pre-book online')}${prow('IDP', 'Required — get it from AAA before departure')}`)}
    </div>
  </section>`;

const healthTiming = `<section id="health-check" class="divider">
    ${sectionLabel('Plan Health-Check', 'What to lock, watch, and expect', 'Researched July 2026 for a June 28-July 11, 2027 trip; the kids will be 13 and 8. Prices are 2026 figures &mdash; reconfirm at booking.')}
    <div class="hc-grid">
      <div class="hc actnow"><span class="hc-tag">Act now</span><h4>Two Dolomite sites need advance online slots</h4><p>The <b>Tre Cime toll road (&euro;40/car)</b> requires a pre-booked timed slot at auronzo.info, and <b>Lago di Braies closes its valley to private cars 9am-4pm from July 1</b> (reserve at prags.bz). Both fall on our dates.</p></div>
      <div class="hc actnow"><span class="hc-tag">Act now</span><h4>Lodging fills 6 months out</h4><p>Cortina-area apartments and Costa Smeralda / Cala Gonone villas sell out early for the first week of July. Reserve all four bases by roughly January-February 2027, apartments first.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Cortina ZTL cameras fine rental cars by mail</h4><p>A wrong turn into the limited-traffic zone is an <b>&euro;80-300 fine plus a rental admin fee</b> that arrives months later. Have the hotel register your plate the moment lodging is booked.</p></div>
      <div class="hc watch"><span class="hc-tag">Watch</span><h4>Flights are the budget gate</h4><p>Transatlantic airfare is the swing line. The ~$14.5k target assumes an open-jaw booked by December 2026; late peak-summer fares or private boats push it against the $15k cap.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>13 nights for about 9 PTO days</h4><p>July 4, 2027 is a Sunday, so the federal holiday is <b>observed Monday July 5, mid-trip</b>. Depart Sunday, return Sunday: both travel days land on weekends, and the holiday absorbs one workday.</p></div>
      <div class="hc good"><span class="hc-tag">Solid</span><h4>The Pittsburgh dates are fully clear</h4><p>The trip departs Jun 27, after the required full days in Pittsburgh on Jun 24-26, and uses warmer Sardinian water than the earlier viable window.</p></div>
    </div>
  </section>

  <section id="timing" class="divider">
    ${sectionLabel('Best Time', 'Why the trip starts June 27, not earlier', 'The hard constraints leave two legal windows: end by June 22, or start on/after June 27. Here is why the later window wins.')}
    ${table(['Window', 'Nights', 'PTO', 'Blackout fit', 'Verdict'], [
      ['<b>Jun 27-Jul 11</b>', '13 nights', '~9 days', 'Starts after Jun 26', '<b>Use this</b>'],
      ['Jun 9-22', '13 nights', '~9 days', 'Home before Jun 23', 'Backup — midweek return, cooler sea'],
      ['Jun 15-28', '13+', '9', '<b>Invalid</b> — away during Jun 24-26', 'Reject'],
      ['Aug 1-14', '13+', '9-10', 'Valid', 'Hotter, pricier, peak-season crowds'],
    ])}
    <div class="verdict-box" style="border-left-color:var(--c3);margin-top:18px"><h4>PTO math</h4><p>Both legal windows cost about the same PTO because both slot a federal holiday mid-trip. The June 27 window wins on details: <b>both travel days fall on a weekend</b> (depart Sunday evening, land home Sunday), so no PTO is burned traveling. Away weekdays are Mon Jun 28 through Fri Jul 9, minus the <b>Monday July 5 holiday</b> = <b>9 PTO days for 13 nights abroad</b>. It also puts Sardinia in early July, when the sea has had two more weeks to warm.</p></div>
  </section>`;

const budgetTips = `<section id="budget" class="divider">
    ${sectionLabel('The Money', 'Budget, savers &amp; splurges', 'Ground costs (cars, tolls, lodging bands, entries) are grounded in 2026 figures; 2027 transatlantic airfare is unpublished, so flights are a researched typical band and the single biggest swing line. USD, family of four.')}
    ${table(['Line item', 'Estimate (family of 4)'], [
      ['Transatlantic airfare (open-jaw)', '$5,400-$7,000'],
      ['Island hop VCE->OLB + bags', '$450-$780'],
      ['Lodging: Venice 2 nights', '$500-$760'],
      ['Lodging: San Vito / Cortina 5 nights', '$900-$1,400'],
      ['Lodging: Cannigione 3 nights', '$750-$1,200'],
      ['Lodging: Cala Gonone 3 nights', '$600-$900'],
      ['Two rental cars + fuel + tolls', '$1,200-$1,850'],
      ['Boats (La Maddalena + Orosei)', '$450-$650'],
      ['Cable cars, tolls, entries', '$500-$750'],
      ['Food &amp; drink (~14 days)', '$2,000-$2,900'],
      ['Docs, transfers, insurance, misc', '$450-$700'],
      ['<b>Grand total</b>', '<b>$14,000-$15,500</b>'],
    ])}
    <div class="twocol">
      <div class="listcard save-list"><h4>Save money</h4><ul><li>Book the open-jaw as one multi-city fare by December 2026; late booking is the fastest way past $15k.</li><li>Base outside the resort towns — San Vito over Cortina, Cannigione over Porto Cervo — for 40-60% cheaper lodging.</li><li>Self-cater breakfasts and beach lunches in the three apartment kitchens.</li><li>Take group boats (~€200/family each), not €650-900 private charters.</li><li>Walk to the free sand instead of €80-160/day beach-club loungers.</li></ul></div>
      <div class="listcard splurge-list"><h4>Worth the splurge</h4><ul><li>A private water taxi on arrival (~€150) after the red-eye with two kids and luggage.</li><li>The Venice Campanile lift (~€60/family) for the lagoon view.</li><li>A private Orosei skipper charter (~€650) to linger at Cala Mariolu and Goloritzé.</li><li>A guided via-ferrata-lite at Cinque Torri for the 13-year-old.</li><li>Cima Tofana (3,244m) via Freccia nel Cielo (€45/adult).</li></ul></div>
    </div>
  </section>

  <section id="totals" class="divider">
    ${sectionLabel('Bottom Line', 'Total trip cost', 'In USD for the family of four. The trip hugs the $15k cap: it lands near $14k if you book flights by December 2026 and self-cater breakfasts, and breaches the cap only if summer airfare runs hot or you splurge on private boats.')}
    ${table(['Category', 'Estimate (family of 4)'], [
      ['Flights (transatlantic + island hop)', '$5,850-$7,780'],
      ['Lodging (13 nights, 4 bases)', '$2,750-$4,260'],
      ['Rental cars + fuel + tolls', '$1,200-$1,850'],
      ['Boats, cable cars, entries', '$950-$1,400'],
      ['Food &amp; drink', '$2,000-$2,900'],
      ['Docs, transfers, insurance, misc', '$450-$700'],
      ['<b>Grand total - family of 4</b>', '<b>$14,000 target / $15,500 high</b>'],
    ], 'budget-tbl grand')}
    <p class="rate-note">Per-day itinerary costs cover food + activities only. Lodging, flights, rental cars, and docs sit in the totals above, not the daily numbers.</p>
  </section>

  <section id="tips" class="divider">
    ${sectionLabel('Travel Tips', 'The stuff nobody tells you', 'Researched July 2026 for June-July 2027. Book in roughly this order; the first three are the ones that actually run out.')}
    <div class="tips-order">
      <p class="mini-h">Book in roughly this order</p>
      <ol>
        <li>Transatlantic open-jaw flights<span> &middot; by Dec 2026 for the low band</span></li>
        <li>All four lodging bases<span> &middot; Jan-Feb 2027, apartments first</span></li>
        <li>VCE->OLB Volotea flight + bags<span> &middot; once dates are firm</span></li>
        <li>Tre Cime toll slot + Lago di Braies car reservation<span> &middot; when they open</span></li>
        <li>La Maddalena & Orosei boats, La Pelosa ticket<span> &middot; 1-2 months out in peak July</span></li>
      </ol>
    </div>
    <div class="tips-grid">
      <div class="tipcard"><h4>Driving</h4><p class="sub">Permits and the fines nobody warns you about</p><ul><li class="flag"><b>Get an IDP from AAA before you fly.</b> Italian desks check for it and you cannot get one in-country.</li><li class="flag"><b>Cortina has a camera-enforced ZTL.</b> Register your plate with the hotel.</li><li><b>Time the first car pickup for Venice departure day</b> (Jun 30), not arrival — you don’t need a car in Venice.</li></ul></div>
      <div class="tipcard t2"><h4>Pre-booked sites</h4><p class="sub">Three Dolomite spots now need slots</p><ul><li class="flag"><b>Tre Cime toll road:</b> &euro;40/car with a mandatory timed slot at auronzo.info.</li><li class="flag"><b>Lago di Braies:</b> valley closed to cars 9am-4pm from July 1; reserve at prags.bz.</li><li><b>Seceda cableway:</b> timed-slot pre-booking in summer; buy one-way up if hiking down.</li></ul></div>
      <div class="tipcard t3"><h4>Beach logistics</h4><p class="sub">Sardinia’s booked and banned beaches</p><ul><li class="flag"><b>La Pelosa is ticketed:</b> &euro;3.50/person, capped 1,500/day, released in two waves.</li><li><b>You can’t land on Spiaggia Rosa</b> — boats idle offshore; swim at Cala Corsara.</li><li><b>Mornings are calm and clear</b> — wind and crowds build after midday.</li></ul></div>
      <div class="tipcard t4"><h4>Money & food</h4><p class="sub">Cash, eSIM, picky kids</p><ul><li class="flag"><b>Carry euro cash</b> for the Tre Cime toll, rifugi, and boat eco-taxes — cards aren’t universal.</li><li><b>Every stop has a margherita</b> — rifugi do pasta/polenta/fries, pizzerias do &euro;7 pizzas.</li><li><b>A cheap EU eSIM</b> covers Venice, the Dolomites, and Sardinia on one plan.</li></ul></div>
    </div>
  </section>`;

const socialBalanceStatus = `<section id="social" class="divider">
    ${sectionLabel('What People Are Saying', 'Research signals to keep in mind', 'Official pages and current route/fare sources point to the same conclusion: this is a variety-rich trip whose only real stress is peak-summer airfare and a lot of moving parts.')}
    <div class="plan-grid">
      ${card('Photography signal', `<p>Tre Cime, Seceda, Lago di Braies, and the Gulf of Orosei are among the most-photographed places in Italy for a reason. The hero carousel above is built from real portfolio-grade shots of exactly these stops.</p>`)}
      ${card('Logistics signal', `<p>Four bases and two rental cars is the most moving parts of any trip on the board. The open-jaw and the VCE->OLB hop are what keep it from doubling back — but it rewards booking early and driving deliberately.</p>`)}
      ${card('Family signal', `<p>The best version scales the hard days: cable-car-assisted ridges, group boats over private charters, and a flexible last day that can be a gorge hike or a lazy beach depending on energy and heat.</p>`)}
    </div>
  </section>

  <section id="balance" class="divider">
    ${sectionLabel('Trip Balance', 'What the days add up to', 'The target: beach-biased, but never beach-only. The Dolomites core is what keeps it from being a flat beach week.')}
    <div class="bar"><i style="width:40%;background:#3f7d4e"></i><i style="width:25%;background:#c25a3a"></i><i style="width:35%;background:#1f6f78"></i></div>
    <div class="balance">
      <div class="bcard k1"><div class="pct">40%</div><h4>Beach &middot; Water &middot; Boats</h4><p>Costa Smeralda, the La Maddalena boat day, La Pelosa, Cala Gonone, and the Gulf of Orosei finale.</p></div>
      <div class="bcard k2"><div class="pct">35%</div><h4>Alpine &middot; Hikes &middot; Rifugi</h4><p>Tre Cime, Lago di Braies, Seceda, Cinque Torri, and the Su Gorropu gorge.</p></div>
      <div class="bcard k3"><div class="pct">25%</div><h4>Towns &middot; Culture &middot; Islands</h4><p>Venice’s Grand Canal and San Marco, Murano &amp; Burano, and Cortina.</p></div>
    </div>
  </section>

  <section id="status" class="divider">
    ${sectionLabel('Settled &amp; Open', 'What is decided, what still needs a call', 'The route is opinionated, but 2027 flights and lodging prices still need live re-quotes before booking.')}
    <div class="status"><div class="scol settled"><h4>Settled</h4>
      <div class="row"><b>Slug</b><span>dolomites-sardinia</span></div>
      <div class="row"><b>Route</b><span>Venice 2 nights -> Dolomites 5 nights -> Sardinia 3 + 3 nights, one open-jaw.</span></div>
      <div class="row"><b>Dates</b><span>Depart Sun Jun 27, 2027, after the required full Pittsburgh days Jun 24-26; home Sun Jul 11.</span></div>
      <div class="row"><b>PTO</b><span>~9 days — the observed July 4th holiday is absorbed mid-trip and both travel days are weekends.</span></div>
      <div class="row"><b>Budget verdict</b><span>~$14,000 target / $15,500 high; hugs the $15k cap, with airfare the swing.</span></div>
    </div><div class="scol open"><h4>Open</h4>
      <div class="row"><b>Exact flights</b><span>2027 transatlantic fares release ~late 2026; price the open-jaw then.</span></div>
      <div class="row"><b>Lodging choices</b><span>Apartment vs hotel per base; center-Venice vs value-Mestre.</span></div>
      <div class="row"><b>La Pelosa day</b><span>Keep the 2h-each-way drive, or swap for a second Costa Smeralda day.</span></div>
      <div class="row"><b>Su Gorropu</b><span>Full gorge hike vs an easy beach day 13 — decide on the ground by heat and energy.</span></div>
    </div></div>
  </section>`;

const todo = {
  labelHtml: `
      <p class="eyebrow">Pre-Departure To-Do</p>
      <h2>What to book before leaving</h2>
      <p>Exact planning sequence for the Jun 27-Jul 11, 2027 route. Transatlantic inventory opens in late 2026; tracking and buying are separate decisions.</p>
    `,
  blocks: [
    {
      when: 'Late 2026',
      tone: 'hot',
      title: 'Transatlantic inventory opens: track, then buy',
      note: 'Buy the open-jaw once the routing and total family price work; aim for the low band by December.',
      items: [
        '<b>Track PIT -> VCE / OLB -> PIT as a family-of-4 open-jaw.</b> Watch connections via JFK, EWR, PHL, MUC, CDG, and FCO.',
        '<b>Set the airfare gate.</b> Target ~$5.4k family, high case ~$7k including seats and bags.',
        '<b>Book the VCE -> OLB Volotea hop</b> once dates are firm, and pre-buy 2-4 checked bags online.',
      ],
    },
    {
      when: 'Jan-Feb 2027',
      title: 'Hold refundable lodging, apartments first',
      items: [
        '<b>Venice:</b> 2 nights Cannaregio/Dorsoduro apartment with AC (or Mestre for value).',
        '<b>San Vito di Cadore:</b> 5 nights, apartment with kitchen and parking, plate cleared for Cortina’s ZTL.',
        '<b>Cannigione + Cala Gonone:</b> 3 nights each, water-near apartments with kitchens.',
      ],
    },
    {
      when: 'Spring 2027',
      tone: 'watch',
      title: 'Cars, documents, and the timed-slot sites',
      items: [
        '<b>Reserve two rental cars</b> (Mestre/VCE and Olbia); get an IDP from AAA.',
        '<b>Book the Tre Cime toll slot (auronzo.info) and Lago di Braies car reservation (prags.bz).</b>',
        '<b>Reserve the Seceda cableway timed slot</b> and check passports, ETIAS, and travel insurance.',
      ],
    },
    {
      when: '60-30 days out',
      title: 'Turn the plan into bookings',
      items: [
        '<b>Book the La Maddalena and Gulf of Orosei boat days</b> — peak July sells out.',
        '<b>Grab the La Pelosa access ticket</b> in its release wave (~2 weeks and 48h out).',
        '<b>Decide La Pelosa vs a second Costa Smeralda day, and the Su Gorropu plan.</b>',
      ],
    },
    {
      when: 'Final 2 weeks',
      tone: 'done',
      title: 'Operational checks',
      items: [
        '<b>Download offline maps</b> for Venice, the Dolomites, Sardinia, and the trailheads.',
        '<b>Reconfirm flight times, car counters, ZTL registration, and mountain weather.</b>',
        '<b>Pack layers, sun gear, trail shoes, swimsuits, euro cash, and printed confirmations.</b>',
      ],
    },
  ],
  callout: '<b>Do not forget:</b> the plan works because the open-jaw and the VCE->OLB hop kill the backtracking. Book the flights early — they are the budget swing — and register the Cortina plate the day you book lodging.',
};

// --- map scripts (swap template data) ----------------------------------------
const scripts = template.parts[12].html
  .replace(/window\.__MAP_POINTS__=.*?;window\.__MAP_COLORS__=/s, `window.__MAP_POINTS__=${JSON.stringify(mapPoints)};window.__MAP_COLORS__=`)
  .replace(/window\.__MAP_COLORS__=.*?;window\.__MAP_TYPES__=/s, `window.__MAP_COLORS__=${JSON.stringify(mapColors)};window.__MAP_TYPES__=`);

const scorecard = {
  displayName: 'Venice, Dolomites & Sardinia',
  blurb: 'Alpine hiking + Sardinian beaches',
  axes: { budget: 1, weather: 4, swim: 3, variety: 5, ease: 3, food: 4, risk: 3, nights: 5, novelty: 5, pto: 2 },
  weightDefaults: { budget: 2, weather: 1, swim: 1, variety: 1, ease: 1, food: 1, risk: 1, nights: 1, novelty: 1, pto: 0 },
  budget: { floorUsd: 13200, ceilUsd: 18890, targetUsd: 12000, capUsd: 15000 },
  pto: { days: 9, nights: 13 },
  facets: { continent: 'europe', maxConnections: 2, swimTempF: [74, 77], noPassport: false, singleTicket: false, hasSwim: true },
  totalBaked: 34,
};

const data = {
  recommended: false,
  countries: ['italy'],
  packingTags: ['hiking', 'beach', 'heat', 'rain'],
  slug: 'dolomites-sardinia',
  lang: 'en',
  title: 'Venice, the Dolomites & Sardinia — June 2027',
  hasPhotoGuide: false,
  hasFoodGuide: false,
  mapPoints,
  mapColors,
  overrides: {
    packing: [
      '<b>Alpine layers:</b> fleece or light puffer for the 2,300-2,500m ridges even in July.',
      '<b>Real hiking shoes:</b> Dolomite trails and the Su Gorropu valley are rough on casual sneakers.',
      '<b>Beach + boat kit:</b> reef-safe sunscreen, rash guards, dry bag, and water shoes for pebbly coves.',
      '<b>Euro cash:</b> for the Tre Cime toll, rifugi, and boat eco-taxes that don’t take cards.',
      '<b>Offline maps + ZTL note:</b> download the Dolomites and Sardinia, and keep the Cortina plate-registration handy.',
    ],
  },
  itinerary: {
    className: 'divider',
    labelHtml: `
      <p class="eyebrow">The Itinerary</p>
      <h2>Day by day</h2>
      <p>Swipe each carousel for photos. Every stop carries its cost, a money-saving tip, a splurge, picky-kid restaurants, backup / if-time ideas, blog links, and a map. Daily costs are food + activities only, not flights, lodging, or cars.</p>
`,
    daysClass: 'days',
    days,
  },
  parts: [
    { t: 'raw', html: `${headBody}${preview}${navToMain}${overview}${calendar}` },
    { t: 'itinerary' },
    { t: 'raw', html: mapAirGround },
    { t: 'entry' },
    { t: 'raw', html: healthTiming },
    { t: 'todo' },
    { t: 'raw', html: budgetTips },
    { t: 'packing' },
    { t: 'raw', html: socialBalanceStatus },
    { t: 'raw', html: scripts },
  ],
  preDepartureTodos: todo,
  scorecard,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'main.json'), `${JSON.stringify(data, null, 2)}\n`);
console.log(`wrote ${path.relative(root, path.join(outDir, 'main.json'))}`);
