import fs from 'node:fs';

const output = 'assets/data/mt-rainier-seattle-2026-weather-history.json';
const years = Array.from({ length: 8 }, (_, index) => 2018 + index);
const locations = [
  {
    key: 'rainier',
    label: 'Paradise / Skyline Trail',
    latitude: 46.7857,
    longitude: -121.7351,
    tripSegment: 'Sep 4–7 mountain segment'
  },
  {
    key: 'seattle',
    label: 'W Seattle · 1112 4th Ave',
    latitude: 47.6075,
    longitude: -122.3339,
    tripSegment: 'Sep 7–8 Seattle segment'
  }
];

async function request(location, year) {
  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    start_date: `${year}-09-04`,
    end_date: `${year}-09-08`,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'America/Los_Angeles'
  });
  const response = await fetch(url, { headers: { 'user-agent': 'TravelPlanner weather history refresh' } });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  const json = await response.json();
  const daily = json.daily;
  return {
    year,
    sourceUrl: url.toString(),
    resolvedLatitude: json.latitude,
    resolvedLongitude: json.longitude,
    resolvedElevationM: json.elevation,
    days: daily.time.map((date, index) => ({
      date,
      highF: daily.temperature_2m_max[index],
      lowF: daily.temperature_2m_min[index],
      precipitationIn: daily.precipitation_sum[index],
      maxWindMph: daily.wind_speed_10m_max[index]
    }))
  };
}

const histories = {};
for (const location of locations) {
  const records = [];
  for (const year of years) records.push(await request(location, year));
  histories[location.key] = { ...location, records };
}

fs.mkdirSync('assets/data', { recursive: true });
fs.writeFileSync(output, `${JSON.stringify({
  retrievedAt: new Date().toISOString(),
  provider: 'Open-Meteo Historical Weather API',
  methodology: 'ERA5/ERA5-Land reanalysis at the API-resolved grid point. Values are historical reanalysis, not a future forecast or a nearby station observation.',
  variables: {
    highF: 'daily maximum 2 m air temperature',
    lowF: 'daily minimum 2 m air temperature',
    maxWindMph: 'daily maximum 10 m wind speed',
    precipitationIn: 'daily precipitation total'
  },
  historyWindow: 'September 4–8 for each completed year, 2018–2025',
  locations: histories
}, null, 2)}\n`);
console.log(`wrote ${output}`);
