import fs from 'node:fs';

const pagePath = 'mt-rainier-seattle-2026.html';
const dataPath = 'assets/data/mt-rainier-seattle-2026-weather-history.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const page = fs.readFileSync(pagePath, 'utf8');

const degree = value => `${Math.round(value)}°`;
const wind = value => `${value.toFixed(1)} mph`;
const precip = value => `${value.toFixed(2)}&quot;`;
const apiDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  .format(new Date(data.retrievedAt));

function table(location) {
  const rows = [...location.records].reverse().map(record => {
    const highs = record.days.map(day => day.highF);
    const lows = record.days.map(day => day.lowF);
    const winds = record.days.map(day => day.maxWindMph);
    const precipitation = record.days.map(day => day.precipitationIn);
    return `<tr><td>${record.year}</td><td>${degree(Math.max(...highs))} / ${degree(Math.min(...lows))}</td><td>${wind(Math.max(...winds))}</td><td>${precip(precipitation.reduce((sum, value) => sum + value, 0))}</td></tr>`;
  }).join('');
  const resolved = location.records[0];
  return `<article class="weather-history-card"><div class="weather-history-head"><p class="eyebrow">${location.tripSegment}</p><h3>${location.label}</h3><p>API-resolved grid point: ${resolved.resolvedLatitude.toFixed(3)}, ${resolved.resolvedLongitude.toFixed(3)} · ${Math.round(resolved.resolvedElevationM).toLocaleString()} m elevation.</p></div><div class="weather-table-wrap"><table class="weather-table"><thead><tr><th>Year</th><th>Window high / low</th><th>Max 10 m wind</th><th>5-day precip</th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
}

function summary(location) {
  const windows = location.records.map(record => ({
    high: Math.max(...record.days.map(day => day.highF)),
    low: Math.min(...record.days.map(day => day.lowF)),
    wind: Math.max(...record.days.map(day => day.maxWindMph)),
    precip: record.days.reduce((sum, day) => sum + day.precipitationIn, 0)
  }));
  return {
    highMin: Math.min(...windows.map(window => window.high)),
    highMax: Math.max(...windows.map(window => window.high)),
    lowMin: Math.min(...windows.map(window => window.low)),
    lowMax: Math.max(...windows.map(window => window.low)),
    windMax: Math.max(...windows.map(window => window.wind)),
    precipMax: Math.max(...windows.map(window => window.precip))
  };
}

const rainier = summary(data.locations.rainier);
const seattle = summary(data.locations.seattle);

const section = `<section id="weather-history" class="divider">
    <div class="section-label">
      <p class="eyebrow">Historical Conditions</p>
      <h2>What this exact early-September window has delivered</h2>
      <p>Eight completed Sep 4–8 windows, 2018–2025, at the mountain and city bases. This is history for trip planning—not a forecast for 2026.</p>
    </div>
    <div class="weather-history-grid">${table(data.locations.rainier)}${table(data.locations.seattle)}</div>
    <div class="weather-history-callout"><strong>How to use this:</strong> across these matching windows, the Paradise high has ranged ${degree(rainier.highMin)}–${degree(rainier.highMax)}, the low ${degree(rainier.lowMin)}–${degree(rainier.lowMax)}, and the wettest five-day window totaled ${precip(rainier.precipMax)}. Seattle highs ranged ${degree(seattle.highMin)}–${degree(seattle.highMax)}. Bring the warm layer and rain shell every mountain day; make the clear-day trail order only after checking the short-range forecast, webcams, and park conditions.</div>
    <p class="weather-history-source">Source: <a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noreferrer">Open-Meteo Historical Weather API</a>, retrieved ${apiDate}. Values are ERA5/ERA5-Land historical reanalysis at the coordinates shown: daily 2 m temperature, daily maximum 10 m wind, and daily precipitation total. Display values are rounded; <a href="assets/data/mt-rainier-seattle-2026-weather-history.json" target="_blank" rel="noreferrer">download the raw API-derived history JSON</a> for the individual daily values and exact request URLs.</p>
  </section>`;

const start = '<!-- WEATHER_HISTORY_START -->';
const end = '<!-- WEATHER_HISTORY_END -->';
if (!page.includes(start) || !page.includes(end)) throw new Error('Weather history markers not found');
const updated = page.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n  ${section}\n  ${end}`);
fs.writeFileSync(pagePath, updated);
console.log(`rendered weather history for ${Object.keys(data.locations).length} locations`);
