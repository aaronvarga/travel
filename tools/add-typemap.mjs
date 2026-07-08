/**
 * add-typemap.mjs — Wanderlog-style type filtering for the trip map.
 * Prototype on one itinerary (default: portugal).
 *   - tags each __MAP_POINTS__ entry with a category `t`
 *   - pins are colored + emoji-iconed by category
 *   - adds a row of toggle chips that show/hide categories (multi-select)
 *   - keeps the existing region "jump to area" buttons
 * Idempotent: re-running replaces the injected blocks rather than stacking them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const slug = process.argv[2] || 'portugal';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'src', '_data', slug, 'main.json');
const main = JSON.parse(fs.readFileSync(file, 'utf8'));

// ---- category definitions (color + emoji + label) ----
const TYPES = {
  hike:      { label: 'Hikes & trails', color: '#3f7d4e', emoji: '🥾' },
  beach:     { label: 'Beaches & swim', color: '#1f8aa8', emoji: '🏖️' },
  view:      { label: 'Viewpoints',     color: '#c25a3a', emoji: '👁️' },
  town:      { label: 'Towns & villages', color: '#b07d2b', emoji: '🏘️' },
  sight:     { label: 'Attractions',    color: '#8a5cb0', emoji: '⭐' },
  food:      { label: 'Restaurants',    color: '#d64550', emoji: '🍴' },
};

// region from coords (Portugal trip): Madeira / Algarve / mainland-Lisbon
const regionFor = (lat) => (lat < 33 ? 'madeira' : lat < 37.6 ? 'algarve' : 'lisbon');

// ---- per-point classification (by name) ----
const CLASS = {
  'Cascais seaside and beaches': 'beach',
  'Boca do Inferno': 'view',
  'Quinta da Regaleira': 'sight',
  'Praia da Adraga': 'beach',
  'Azenhas do Mar': 'town',
  'Cabo da Roca': 'view',
  'Carvoeiro': 'town',
  'Ferragudo': 'town',
  'Lagos': 'town',
  'Ponta da Piedade': 'view',
  'Algar Seco': 'view',
  'Praia da Marinha': 'beach',
  'Benagil Cave': 'sight',
  'Slide & Splash': 'sight',
  'Silves Castle': 'sight',
  'Ponta do Sol': 'town',
  'Ponta de Sao Lourenco': 'hike',
  'Machico': 'town',
  'Prainha': 'beach',
  'Seixal': 'beach',
  'Porto Moniz natural pools': 'beach',
  'Funchal Old Town': 'town',
  'Camara de Lobos': 'town',
  'Cabo Girao': 'view',
  'Ribeiro Frio': 'hike',
  'Balcoes viewpoint': 'view',
  'Santana': 'town',
  'Calheta Beach': 'beach',
  'Jardim do Mar': 'town',
};

// ============ Part 8: points array + colors + map IIFE ============
const p8 = main.parts[8];
let h8 = p8.html;

// 1) inject `t` into each point object of __MAP_POINTS__
const ptsStart = h8.indexOf('window.__MAP_POINTS__=');
const arrStart = h8.indexOf('[', ptsStart);
const arrEnd = h8.indexOf('];', arrStart);
let pts = JSON.parse(h8.slice(arrStart, arrEnd + 1));
// idempotent: drop previously-appended restaurant pins before re-tagging
pts = pts.filter((p) => p.t !== 'food');
let unclassified = [];
pts.forEach((p) => {
  const t = CLASS[p.n];
  if (!t) unclassified.push(p.n);
  p.t = t || 'sight';
});
if (unclassified.length) {
  console.warn('  ⚠ unclassified (defaulted to sight):', unclassified.join(', '));
}

// append geocoded restaurant pins (deduped by name; skip OSM misses)
const gcFile = path.join(__dirname, `geocache-${slug}.json`);
let foodCount = 0;
if (fs.existsSync(gcFile)) {
  const gc = JSON.parse(fs.readFileSync(gcFile, 'utf8'));
  const seen = new Set(pts.map((p) => p.n.toLowerCase()));
  for (const [key, coords] of Object.entries(gc)) {
    if (!coords) continue; // no OSM match
    const name = key.split('|')[0];
    if (seen.has(name.toLowerCase())) continue; // dedupe
    seen.add(name.toLowerCase());
    const [lat, lng] = coords;
    pts.push({
      n: name, lat, lng, r: regionFor(lat), t: 'food',
      g: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    foodCount++;
  }
}
h8 = h8.slice(0, arrStart) + JSON.stringify(pts) + h8.slice(arrEnd + 1);

// 2) inject __MAP_TYPES__ right after __MAP_COLORS__ assignment
const typesJs = `window.__MAP_TYPES__=${JSON.stringify(TYPES)};`;
h8 = h8.replace(/(window\.__MAP_COLORS__=\{[^}]*\};)(window\.__MAP_TYPES__=\{.*?\};)?/,
  `$1${typesJs}`);

// 3) replace the trip-map IIFE with a type-aware version
const iifeStart = h8.indexOf('// ---- trip map');
// old IIFE ends at the first "})();" after the marker
const iifeEnd = h8.indexOf('})();', iifeStart) + '})();'.length;

const newIife = `// ---- trip map (Leaflet, Wanderlog-style type filtering) ----
(function(){
  var el=document.getElementById('tripmap');
  if(!el||typeof L==='undefined')return;
  var pts=window.__MAP_POINTS__||[], rColors=window.__MAP_COLORS__||{}, TYPES=window.__MAP_TYPES__||{};
  var map=L.map('tripmap',{scrollWheelZoom:false,zoomSnap:0.25,zoomDelta:0.5}).setView([36.5,-12.5],5);
  // Base map: OpenFreeMap vector tiles relabeled to English (Google-Maps-like:
  // "Spain" not "España"). Falls back to Wikimedia raster if WebGL/plugin missing.
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
    var gl=L.maplibreGL({style:'https://tiles.openfreemap.org/styles/liberty',
      attribution:'&copy; OpenFreeMap &copy; OpenMapTiles &copy; OpenStreetMap'}).addTo(map);
    var mm=gl.getMaplibreMap();
    mm.on('styledata',function(){englishify(mm);});
  }else{
    L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',{
      maxZoom:19, attribution:'&copy; OpenStreetMap contributors, Wikimedia'}).addTo(map);
  }
  // Cooperative trackpad zoom: pinch (ctrl+wheel) zooms the map; plain two-finger
  // scroll passes through to the page so the map never traps scrolling.
  el.addEventListener('wheel',function(e){
    if(e.ctrlKey||e.metaKey){
      e.preventDefault();
      var z=map.getZoom()-e.deltaY*0.02;
      map.setZoomAround(map.mouseEventToContainerPoint(e),Math.max(map.getMinZoom(),Math.min(map.getMaxZoom(),z)));
    }
  },{passive:false});
  var active={}; Object.keys(TYPES).forEach(function(k){active[k]=true;});
  // force the default-on state (defeats browser checkbox restoration desync)
  document.querySelectorAll('.layers-list input[type=checkbox]').forEach(function(b){b.checked=true;});
  var regions={}; // region -> [latlng]
  pts.forEach(function(p){
    var ty=TYPES[p.t]||{color:'#c25a3a',emoji:'📍'};
    p._m=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',
      html:'<div class="pin2" style="background:'+ty.color+'">'+ty.emoji+'</div>',
      iconSize:[26,26],iconAnchor:[13,13],popupAnchor:[0,-12]})});
    p._m.bindPopup('<b>'+p.n+'</b><br><span class="pop-ty">'+(ty.emoji||'')+' '+(TYPES[p.t]?TYPES[p.t].label:'')+'</span><br><a href="'+p.g+'" target="_blank" rel="noreferrer">Open in Google Maps &#8599;</a>');
    (regions[p.r]=regions[p.r]||[]).push([p.lat,p.lng]);
  });
  function render(){
    pts.forEach(function(p){
      if(active[p.t]) p._m.addTo(map); else map.removeLayer(p._m);
    });
  }
  function fit(region){
    // "Whole trip" frames every point regardless of active filters
    var arr=region==='all'?pts.map(function(p){return [p.lat,p.lng];}):regions[region];
    if(arr&&arr.length)map.flyToBounds(L.latLngBounds(arr).pad(0.2),{maxZoom:region==='all'?7:12});
  }
  function showAllLayers(){
    Object.keys(TYPES).forEach(function(k){active[k]=true;});
    document.querySelectorAll('.layers-list input[type=checkbox]').forEach(function(b){b.checked=true;});
    render();
  }
  // region "jump to area" buttons
  document.querySelectorAll('.mapbtns button').forEach(function(b){
    b.addEventListener('click',function(){
      if(b.dataset.region==='all')showAllLayers(); // Whole trip = show everything
      fit(b.dataset.region);
    });
  });
  // Wanderlog-style "Map layers" overlay panel
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
  boxes.forEach(function(b){
    b.addEventListener('change',function(){active[b.dataset.type]=b.checked;render();});
  });
  document.querySelectorAll('.layers-acts button').forEach(function(b){
    b.addEventListener('click',function(){
      var on=b.dataset.all==='1';
      boxes.forEach(function(x){x.checked=on;active[x.dataset.type]=on;});
      render();
    });
  });
  render();
  fit('lisbon');
  setTimeout(function(){map.invalidateSize();},300);
})();`;

h8 = h8.slice(0, iifeStart) + newIife + h8.slice(iifeEnd);

// load MapLibre GL + the leaflet plugin (for the English vector base map).
// Must come after Leaflet (part 7) and before the map IIFE runs. Idempotent.
const glLoader = '<!--GL-LOADER-->' +
  '<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" ' +
    'integrity="sha384-MinO0mNliZ3vwppuPOUnGa+iq619pfMhLVUXfC4LHwSCvF9H+6P/KO4Q7qBOYV5V" crossorigin="anonymous">' +
  '<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js" ' +
    'integrity="sha384-SYKAG6cglRMN0RVvhNeBY0r3FYKNOJtznwA0v7B5Vp9tr31xAHsZC0DqkQ/pZDmj" crossorigin="anonymous"></script>' +
  '<script src="https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.0.22/leaflet-maplibre-gl.js" ' +
    'integrity="sha384-4CB9Vtol9LN6lGgBCvmPLbUEZwilrqIvPieSRurgAXAB7FVJaLS9n8WyAIA5wjQ+" crossorigin="anonymous"></script>' +
  '<!--/GL-LOADER-->';
h8 = h8.replace(/<!--GL-LOADER-->[\s\S]*?<!--\/GL-LOADER-->/, '');
h8 = glLoader + h8;
p8.html = h8;

// ============ Part 0: map-section HTML + CSS ============
const p0 = main.parts[0];
let h0 = p0.html;

// refresh the intro copy to describe the layers panel + pinch zoom (idempotent)
h0 = h0.replace(
  /<p>(?:Tap a region to fly there;|Open <b>Layers<\/b>)[^<]*(?:<b>[^<]*<\/b>[^<]*)*<\/p>/,
  '<p>Open <b>Layers</b> to show or hide pins by type — hikes, beaches, viewpoints, towns, attractions, restaurants. Tap a region to fly there, pinch to zoom, and click any pin for a one-tap link into Google Maps.</p>'
);

// Wanderlog-style "Map layers" overlay: a Layers button + a checkbox panel that
// floats over the map, with Select all / Deselect all.
const layerRows = Object.entries(TYPES).map(([k, v]) =>
  `<label class="lrow"><span class="lsw" style="background:${v.color}">${v.emoji}</span><span class="ltxt">${v.label}</span><input type="checkbox" data-type="${k}" checked autocomplete="off"></label>`
).join('');
const stage = `<div class="mapstage">
        <button class="layers-btn" aria-expanded="false" aria-label="Map layers"><span class="lbi">▧</span> Layers</button>
        <div class="layers-panel" hidden>
          <div class="layers-top"><strong>Map layers</strong><button class="layers-x" aria-label="Close">×</button></div>
          <div class="layers-acts"><button data-all="1">Select all</button><span class="dot">·</span><button data-all="0">Deselect all</button></div>
          <div class="layers-list">${layerRows}</div>
        </div>
        <div id="tripmap"></div>
      </div>`;

// remove any prior chip row or prior stage, then wrap the map in the stage (idempotent)
h0 = h0.replace(/<div class="maptypes">.*?<\/div>\s*(?=<div id="tripmap")/s, '');
h0 = h0.replace(/<div class="mapstage">[\s\S]*?<div id="tripmap"><\/div>\s*<\/div>/, '<div id="tripmap"></div>');
h0 = h0.replace('<div id="tripmap"></div>', stage);

// CSS: emoji pin + chip styling (idempotent — strip prior injection first)
const cssMarker = '/*TYPEMAP-CSS*/';
h0 = h0.replace(new RegExp(cssMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*?' + cssMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 's'), '');
const css = `${cssMarker}
.mapstage{position:relative}
.layers-btn{position:absolute;top:12px;right:12px;z-index:1000;display:inline-flex;align-items:center;gap:6px;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px 13px;font-weight:700;font-size:.85rem;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.18)}
.layers-btn:hover{background:var(--paper)}
.layers-btn .lbi{font-size:.95rem;line-height:1}
.layers-panel{position:absolute;top:12px;right:12px;z-index:1001;width:280px;max-height:390px;overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.28);padding:16px}
.layers-panel[hidden]{display:none}
.layers-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.layers-top strong{font-family:"Fraunces",serif;font-size:1.15rem}
.layers-x{border:none;background:none;font-size:22px;line-height:1;color:var(--ink);opacity:.55;cursor:pointer;padding:0 2px}
.layers-x:hover{opacity:1}
.layers-acts{display:flex;align-items:center;gap:9px;font-size:.85rem;padding-bottom:11px;margin-bottom:6px;border-bottom:1px solid var(--line)}
.layers-acts button{border:none;background:none;color:#1f6f78;font-weight:700;font-size:.85rem;cursor:pointer;padding:0}
.layers-acts button:hover{text-decoration:underline}
.layers-acts .dot{opacity:.4}
.lrow{display:flex;align-items:center;gap:12px;padding:9px 2px;cursor:pointer}
.lrow .lsw{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-size:.82rem;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.28);flex:0 0 auto}
.lrow .ltxt{flex:1;font-weight:600;font-size:.95rem}
.lrow input[type=checkbox]{width:20px;height:20px;accent-color:#1f6f78;cursor:pointer;flex:0 0 auto}
.pin2{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.55);font-size:14px;line-height:1}
.leaflet-popup-content .pop-ty{font-size:.78rem;opacity:.75;font-weight:600}
@media(max-width:520px){.layers-panel{width:calc(100% - 24px)}}
${cssMarker}`;
// place the CSS right after the existing #tripmap{...} rule
h0 = h0.replace(/(#tripmap\{[^}]*\})/, `$1\n${css}`);
p0.html = h0;

fs.writeFileSync(file, JSON.stringify(main));
console.log(`✓ ${slug}: ${pts.length} points tagged, layers panel + typed pins injected.`);
const counts = {};
pts.forEach((p) => { counts[p.t] = (counts[p.t] || 0) + 1; });
console.log('  by type:', counts);
