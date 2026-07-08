/**
 * Add the Wanderlog-style map layer picker to every itinerary.
 *
 * - tags each __MAP_POINTS__ entry with a category `t`
 * - appends geocoded restaurant pins from tools/geocache-<slug>.json
 * - replaces the plain Leaflet map with checkbox-based type filtering
 * - wraps #tripmap in a reusable floating "Map layers" panel
 *
 * Usage:
 *   node tools/add-typemap.mjs          # all itineraries
 *   node tools/add-typemap.mjs portugal # one itinerary
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataRoot = path.join(root, 'src', '_data');

const TYPE_GROUPS = [
  { label: 'Overview', types: ['flight', 'hotel', 'rental', 'transit'] },
  { label: 'Places', types: ['hike', 'beach', 'view', 'town', 'sight', 'food'] },
];

const TYPES = {
  flight: { label: 'Flights', color: '#2f93d1', emoji: '✈️' },
  hotel: { label: 'Hotels and lodging', color: '#7144aa', emoji: '🏨' },
  rental: { label: 'Rental cars', color: '#2fa7a5', emoji: '🚗' },
  transit: { label: 'Transit', color: '#18a765', emoji: '↔️' },
  hike: { label: 'Hikes & trails', color: '#3f7d4e', emoji: '🥾' },
  beach: { label: 'Beaches & swim', color: '#1f8aa8', emoji: '🏖️' },
  view: { label: 'Viewpoints', color: '#c25a3a', emoji: '👁️' },
  town: { label: 'Towns & villages', color: '#0b6a43', emoji: '🏘️' },
  sight: { label: 'Attractions & POI', color: '#8a5cb0', emoji: '⭐' },
  food: { label: 'Restaurants', color: '#d64550', emoji: '🍴' },
};

const GL_LOADER = '<!--GL-LOADER-->' +
  '<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" ' +
    'integrity="sha384-MinO0mNliZ3vwppuPOUnGa+iq619pfMhLVUXfC4LHwSCvF9H+6P/KO4Q7qBOYV5V" crossorigin="anonymous">' +
  '<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js" ' +
    'integrity="sha384-SYKAG6cglRMN0RVvhNeBY0r3FYKNOJtznwA0v7B5Vp9tr31xAHsZC0DqkQ/pZDmj" crossorigin="anonymous"></script>' +
  '<script src="https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.0.22/leaflet-maplibre-gl.js" ' +
    'integrity="sha384-4CB9Vtol9LN6lGgBCvmPLbUEZwilrqIvPieSRurgAXAB7FVJaLS9n8WyAIA5wjQ+" crossorigin="anonymous"></script>' +
  '<!--/GL-LOADER-->';

const MAP_CSS = `/*TYPEMAP-CSS*/
.tripmap-wrap .mapstage{position:relative}
.tripmap-wrap .mapstage #tripmap{min-height:520px;border-radius:16px;overflow:hidden}
.layers-btn{position:absolute;z-index:600;right:14px;top:14px;display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(31,111,120,.22);border-radius:999px;background:rgba(255,253,248,.94);color:var(--ink);font-weight:850;font-size:.86rem;line-height:1;padding:10px 14px;box-shadow:0 14px 32px -18px rgba(0,0,0,.45);cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.layers-btn:hover{background:#fff}
.layers-btn .lbi{color:var(--c1);font-size:1rem;line-height:1}
.layers-panel{position:absolute;z-index:620;right:14px;top:14px;width:min(360px,calc(100% - 28px));max-height:calc(100% - 28px);overflow:auto;border:1px solid rgba(31,111,120,.18);border-radius:18px;background:rgba(255,253,248,.95);box-shadow:0 22px 70px -32px rgba(0,0,0,.55);padding:18px 20px 20px;color:var(--ink);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.layers-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.layers-top strong{font-size:1.08rem;line-height:1.1}
.layers-x{width:36px;height:36px;border:0;border-radius:50%;background:rgba(31,111,120,.1);color:var(--muted);font-size:1.7rem;line-height:1;cursor:pointer}
.layers-x:hover{background:rgba(31,111,120,.16);color:var(--ink)}
.layers-acts{display:flex;align-items:center;gap:10px;margin:14px 0 16px;padding-bottom:14px;border-bottom:1px solid rgba(31,111,120,.16)}
.layers-acts button{border:0;background:transparent;color:#3e50dc;font-weight:900;font-size:.92rem;line-height:1;cursor:pointer;padding:0}
.layers-acts .dot{color:rgba(31,111,120,.32);font-weight:900}
.layers-head{margin:18px 0 8px;color:var(--ink);font-size:.78rem;line-height:1;font-weight:950;letter-spacing:.06em;text-transform:uppercase}
.layers-head:first-child{margin-top:0}
.layers-list{display:grid;gap:2px}
.lrow{display:grid;grid-template-columns:38px minmax(0,1fr) 34px;align-items:center;gap:14px;min-height:54px;color:var(--ink);cursor:pointer}
.lsw{width:30px;height:30px;border-radius:50% 50% 50% 0;display:grid;place-items:center;color:#fff;box-shadow:0 8px 18px -10px rgba(0,0,0,.8);transform:rotate(-45deg)}
.lsw span{display:block;transform:rotate(45deg);font-size:.86rem;line-height:1}
.ltxt{font-size:1rem;line-height:1.2;font-weight:650}
.lrow input{appearance:none;-webkit-appearance:none;width:30px;height:30px;margin:0;border:3px solid #737c81;border-radius:7px;background:transparent;cursor:pointer;position:relative}
.lrow input:checked{border-color:var(--c1);background:var(--c1)}
.lrow input:checked::after{content:"";position:absolute;left:8px;top:3px;width:8px;height:15px;border:solid #fff;border-width:0 3px 3px 0;transform:rotate(45deg)}
.pin2{width:26px;height:26px;border-radius:50% 50% 50% 0;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.28);transform:rotate(-45deg)}
.pin2 span{display:block;transform:rotate(45deg);font-size:13px;line-height:1}
.pop-ty{display:inline-block;margin-top:3px;color:#66615b;font-size:.82rem}
@media(max-width:680px){.tripmap-wrap .mapstage #tripmap{min-height:470px}.layers-btn{right:10px;top:10px}.layers-panel{right:8px;top:8px;width:calc(100% - 16px);padding:16px}.ltxt{font-size:.95rem}.lrow{grid-template-columns:36px minmax(0,1fr) 32px}}`;

function slugsFromArgs() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('all')) {
    return fs.readdirSync(dataRoot)
      .filter((name) => fs.existsSync(path.join(dataRoot, name, 'main.json')))
      .sort();
  }
  return args;
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function classifyPoint(name) {
  const n = normalize(name);

  if (/\b(airport|arrival gateway|fly home|flight|departure|barajas|international airport)\b/.test(n)) return 'flight';
  if (/\b(rental car|car rental|rental pickup|rental drop|hire car)\b/.test(n)) return 'rental';
  if (/\b(ferry|catamaran|transfer stop|transfer day|train station|bus station|port\b|cruise terminal)\b/.test(n)) return 'transit';
  if (/\b(base|hotel|lodging|resort|aparthotel)\b/.test(n)) return 'hotel';
  if (/\b(hike|trail|levada|ridge|summit|gorge|canyon|national park|\bnp\b|volcano|volcanoes|mount |mt |forest|falls|waterfall|cave walk|pico |arieiro|ruivo|etna|mauna kea|termessos|saklikent)\b/.test(n)) return 'hike';
  if (/\b(beach|bay|lagoon|cove|swim|snorkel|shore|waterfront|coast|island|islands|isola|pools|pool|caves|sea caves|blue lagoon|poetto|ramla|fontane bianche|hapuna|hanauma|punalu|marinha|benagil|balos|elafonissi|falasarna|preveli|ksamil|paleokastritsa|porto timoni|glyfada|kaputas|patara|oludeniz|iztuzu)\b/.test(n)) return 'beach';
  if (/\b(view|viewpoint|lookout|mirador|skywalk|cliff|cliffs|cape|cabo|ponta|cap |canaille|caccia|roca|balcoes|boca do inferno|golden gate|presidio)\b/.test(n)) return 'view';
  if (/\b(old town|town|village|villages|historic core|harbor|harbour|riva|waterfront|plaka|kaleici|valletta|sliema|ortigia|noto|taormina|cefalu|palermo|cascais|funchal|monte|chania|rethymno|nice|eze|antibes|avignon|seville|granada|malaga|frigiliana|mostar|kotor|perast|budva|dubrovnik|saranda|corfu town|hvar town|korcula|alghero|bonifacio|cagliari|sorrento|ischia|procida|gallipoli|otranto|maratea|dalyan|fethiye|kas)\b/.test(n)) return 'town';
  if (/\b(palace|castle|museum|monastery|tower|zoo|aquarium|boardwalk|acropolis|temple|ruins|fortress|fort |gardens?|cathedral|alcazar|alhambra|mosque|courthouse|bridge|old fortress|walls|city walls|roman|aspendo|perge|butrint|blue eye|pearl harbor|balboa|coronado|hearst|alcatraz|valley of the temples|pont du gard|aqualand|slide & splash|water park)\b/.test(n)) return 'sight';

  return 'sight';
}

function findJsonArrayEnd(source, start) {
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (ch === '\\') {
        escaping = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }

  throw new Error('could not find end of JSON array');
}

function extractMapPoints(html) {
  const marker = 'window.__MAP_POINTS__=';
  const ptsStart = html.indexOf(marker);
  if (ptsStart < 0) throw new Error('missing window.__MAP_POINTS__');
  const arrStart = html.indexOf('[', ptsStart);
  const arrEnd = findJsonArrayEnd(html, arrStart);
  return {
    points: JSON.parse(html.slice(arrStart, arrEnd + 1)),
    arrStart,
    arrEnd,
  };
}

function nearestRegion(coord, points) {
  if (!coord || !points.length) return points[0]?.r || 'trip';
  const [lat, lng] = coord;
  let best = points[0];
  let bestDist = Infinity;
  for (const point of points) {
    const dLat = lat - point.lat;
    const dLng = lng - point.lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      best = point;
    }
  }
  return best?.r || 'trip';
}

function coordsFromCacheKey(key) {
  const [, spot] = key.split('|');
  const match = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(spot || '');
  return match ? [+match[1], +match[2]] : null;
}

function googleMapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function addRestaurantPins(slug, points) {
  const cacheFile = path.join(__dirname, `geocache-${slug}.json`);
  if (!fs.existsSync(cacheFile)) return 0;

  const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const basePoints = points.filter((point) => point.t !== 'food');
  const seen = new Set(points.map((point) => `${normalize(point.n)}|${Number(point.lat).toFixed(4)},${Number(point.lng).toFixed(4)}`));
  let added = 0;

  for (const [key, coords] of Object.entries(cache)) {
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const [lat, lng] = coords.map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const name = key.split('|')[0].trim();
    const dedupeKey = `${normalize(name)}|${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (!name || seen.has(dedupeKey)) continue;

    const parentCoord = coordsFromCacheKey(key);
    points.push({
      n: name,
      lat,
      lng,
      r: nearestRegion(parentCoord || [lat, lng], basePoints),
      t: 'food',
      g: googleMapsUrl(lat, lng),
    });
    seen.add(dedupeKey);
    added++;
  }

  return added;
}

function replaceOrAppendTypeData(html) {
  const typeJs = `window.__MAP_TYPES__=${JSON.stringify(TYPES)};window.__MAP_TYPE_GROUPS__=${JSON.stringify(TYPE_GROUPS)};`;
  html = html.replace(/window\.__MAP_TYPES__=[\s\S]*?;window\.__MAP_TYPE_GROUPS__=[\s\S]*?;/, '');
  html = html.replace(/window\.__MAP_TYPES__=[\s\S]*?;/, '');

  const colorMatch = html.match(/window\.__MAP_COLORS__=\{[\s\S]*?\};/);
  if (!colorMatch) throw new Error('missing window.__MAP_COLORS__');
  return html.replace(colorMatch[0], `${colorMatch[0]}${typeJs}`);
}

function mapIife() {
  return `// ---- trip map (Leaflet, Wanderlog-style layer filtering) ----
(function(){
  var el=document.getElementById('tripmap');
  if(!el||typeof L==='undefined')return;
  var pts=window.__MAP_POINTS__||[], rColors=window.__MAP_COLORS__||{}, TYPES=window.__MAP_TYPES__||{}, GROUPS=window.__MAP_TYPE_GROUPS__||[];
  var map=L.map('tripmap',{scrollWheelZoom:false,zoomSnap:0.25,zoomDelta:0.5}).setView([20,0],2);
  var enField=['coalesce',['get','name:en'],['get','name:latin'],['get','name']];
  function englishify(mm){
    try{
      (mm.getStyle().layers||[]).forEach(function(l){
        if(l.type==='symbol'&&l.layout&&('text-field' in l.layout)){
          mm.setLayoutProperty(l.id,'text-field',enField);
        }
      });
    }catch(e){}
  }
  if(L.maplibreGL){
    var gl=L.maplibreGL({style:'https://tiles.openfreemap.org/styles/liberty',attribution:'&copy; OpenFreeMap &copy; OpenMapTiles &copy; OpenStreetMap'}).addTo(map);
    var mm=gl.getMaplibreMap();
    mm.on('styledata',function(){englishify(mm);});
  }else{
    L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors, Wikimedia'}).addTo(map);
  }
  el.addEventListener('wheel',function(e){
    if(e.ctrlKey||e.metaKey){
      e.preventDefault();
      var z=map.getZoom()-e.deltaY*0.02;
      map.setZoomAround(map.mouseEventToContainerPoint(e),Math.max(map.getMinZoom(),Math.min(map.getMaxZoom(),z)));
    }
  },{passive:false});
  function esc(s){
    return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }
  var active={}, regions={}, counts={};
  Object.keys(TYPES).forEach(function(k){active[k]=true;counts[k]=0;});
  pts.forEach(function(p){if(!p.t||!TYPES[p.t])p.t='sight';counts[p.t]=(counts[p.t]||0)+1;});
  function buildLayerRows(){
    var list=document.querySelector('.layers-list');
    if(!list)return;
    list.innerHTML='';
    GROUPS.forEach(function(group){
      var keys=(group.types||[]).filter(function(k){return TYPES[k]&&counts[k];});
      if(!keys.length)return;
      var head=document.createElement('p');
      head.className='layers-head';
      head.textContent=group.label;
      list.appendChild(head);
      keys.forEach(function(k){
        var ty=TYPES[k];
        list.insertAdjacentHTML('beforeend','<label class="lrow"><span class="lsw" style="background:'+esc(ty.color)+'"><span>'+esc(ty.emoji)+'</span></span><span class="ltxt">'+esc(ty.label)+'</span><input type="checkbox" data-type="'+esc(k)+'" checked autocomplete="off"></label>');
      });
    });
  }
  buildLayerRows();
  pts.forEach(function(p){
    var ty=TYPES[p.t]||TYPES.sight||{color:'#c25a3a',emoji:'📍',label:'Place'};
    p._m=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',html:'<div class="pin2" style="background:'+ty.color+'"><span>'+ty.emoji+'</span></div>',iconSize:[26,26],iconAnchor:[13,13],popupAnchor:[0,-12]})});
    p._m.bindPopup('<b>'+esc(p.n)+'</b><br><span class="pop-ty">'+esc(ty.emoji)+' '+esc(ty.label)+'</span><br><a href="'+esc(p.g)+'" target="_blank" rel="noreferrer">Open in Google Maps &#8599;</a>');
    (regions[p.r]=regions[p.r]||[]).push([p.lat,p.lng]);
  });
  function render(){
    pts.forEach(function(p){
      if(active[p.t])p._m.addTo(map);else map.removeLayer(p._m);
    });
  }
  function fit(region){
    var arr=region==='all'?pts.map(function(p){return [p.lat,p.lng];}):regions[region];
    if(arr&&arr.length)map.flyToBounds(L.latLngBounds(arr).pad(0.22),{maxZoom:region==='all'?7:12});
  }
  function showAllLayers(){
    Object.keys(TYPES).forEach(function(k){active[k]=true;});
    document.querySelectorAll('.layers-list input[type=checkbox]').forEach(function(box){box.checked=true;});
    render();
  }
  document.querySelectorAll('.mapbtns button').forEach(function(b){
    b.addEventListener('click',function(){
      if(b.dataset.region==='all')showAllLayers();
      fit(b.dataset.region);
    });
  });
  var panel=document.querySelector('.layers-panel'), lbtn=document.querySelector('.layers-btn');
  if(lbtn&&panel){
    lbtn.addEventListener('click',function(){
      var opening=panel.hasAttribute('hidden');
      if(opening)panel.removeAttribute('hidden');else panel.setAttribute('hidden','');
      lbtn.setAttribute('aria-expanded',opening?'true':'false');
    });
    var xb=panel.querySelector('.layers-x');
    if(xb)xb.addEventListener('click',function(){panel.setAttribute('hidden','');lbtn.setAttribute('aria-expanded','false');});
  }
  var boxes=[].slice.call(document.querySelectorAll('.layers-list input[type=checkbox]'));
  boxes.forEach(function(box){
    box.addEventListener('change',function(){active[box.dataset.type]=box.checked;render();});
  });
  document.querySelectorAll('.layers-acts button').forEach(function(b){
    b.addEventListener('click',function(){
      var on=b.dataset.all==='1';
      boxes.forEach(function(box){box.checked=on;active[box.dataset.type]=on;});
      render();
    });
  });
  render();
  fit('all');
  setTimeout(function(){map.invalidateSize();},300);
})();`;
}

function injectMapScript(html, slug) {
  let mapPartHtml = html.replace(/<!--GL-LOADER-->[\s\S]*?<!--\/GL-LOADER-->/, '');
  const extracted = extractMapPoints(mapPartHtml);
  let points = extracted.points
    .filter((point) => point.t !== 'food')
    .map((point) => ({ ...point, t: classifyPoint(point.n) }));
  const foodCount = addRestaurantPins(slug, points);

  mapPartHtml = mapPartHtml.slice(0, extracted.arrStart) + JSON.stringify(points) + mapPartHtml.slice(extracted.arrEnd + 1);
  mapPartHtml = replaceOrAppendTypeData(mapPartHtml);

  let iifeStart = mapPartHtml.indexOf('// ---- trip map');
  if (iifeStart < 0) {
    iifeStart = mapPartHtml.indexOf("(function(){var el=document.getElementById('tripmap')");
  }
  if (iifeStart < 0) {
    iifeStart = mapPartHtml.indexOf("(function(){\n  var el=document.getElementById('tripmap')");
  }
  if (iifeStart < 0) throw new Error('missing trip map script');
  const iifeEnd = mapPartHtml.indexOf('})();', iifeStart);
  if (iifeEnd < 0) throw new Error('could not find end of trip map IIFE');

  mapPartHtml = mapPartHtml.slice(0, iifeStart) + mapIife() + mapPartHtml.slice(iifeEnd + '})();'.length);
  return { html: GL_LOADER + mapPartHtml, pointCount: points.length, foodCount };
}

function injectMapStage(html) {
  let out = html;
  out = out.replace(
    /<p>Tap a region to fly there; click any pin for its name and a one-tap link into Google Maps\. Colors match the day cards below\.<\/p>/,
    '<p>Open <b>Map layers</b> to show or hide flights, lodging, transit, hikes, beaches, towns, attractions, and restaurants. Tap a region to fly there, then click any pin for Google Maps.</p>'
  );
  out = out.replace(
    /<p>Open <b>Map layers<\/b>[\s\S]*?click any pin for Google Maps\.<\/p>/,
    '<p>Open <b>Map layers</b> to show or hide flights, lodging, transit, hikes, beaches, towns, attractions, and restaurants. Tap a region to fly there, then click any pin for Google Maps.</p>'
  );

  const stage = `<div class="mapstage">
        <button class="layers-btn" aria-expanded="false" aria-label="Map layers"><span class="lbi">▧</span> Layers</button>
        <div class="layers-panel" hidden>
          <div class="layers-top"><strong>Map layers</strong><button class="layers-x" aria-label="Close">×</button></div>
          <div class="layers-acts"><button data-all="1">Select all</button><span class="dot">·</span><button data-all="0">Deselect all</button></div>
          <div class="layers-list"></div>
        </div>
        <div id="tripmap"></div>
      </div>`;

  out = out.replace(/<div class="mapstage">[\s\S]*?<div id="tripmap"><\/div>\s*<\/div>/, '<div id="tripmap"></div>');
  out = out.replace('<div id="tripmap"></div>', stage);

  out = out.replace(/\/\*TYPEMAP-CSS\*\/[\s\S]*?(?=<\/style>)/, '');
  const lastStyle = out.lastIndexOf('</style>');
  if (lastStyle >= 0) out = out.slice(0, lastStyle) + MAP_CSS + out.slice(lastStyle);
  else out += `<style>${MAP_CSS}</style>`;

  return out;
}

function updateSlug(slug) {
  const file = path.join(dataRoot, slug, 'main.json');
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);

  const main = JSON.parse(fs.readFileSync(file, 'utf8'));
  const mapSection = main.parts.find((part) => (part.html || '').includes('id="map"') && (part.html || '').includes('tripmap'));
  const mapScript = main.parts.find((part) => (part.html || '').includes('window.__MAP_POINTS__'));

  if (!mapSection || !mapScript) throw new Error(`${slug}: missing map section or map script`);

  mapSection.html = injectMapStage(mapSection.html);
  const result = injectMapScript(mapScript.html, slug);
  mapScript.html = result.html;

  fs.writeFileSync(file, `${JSON.stringify(main, null, 2)}\n`);
  console.log(`${slug}: ${result.pointCount} map points (${result.foodCount} restaurant pins added)`);
}

for (const slug of slugsFromArgs()) {
  updateSlug(slug);
}
