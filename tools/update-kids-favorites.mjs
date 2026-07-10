import fs from 'node:fs';
import path from 'node:path';

const rankedFavorites = {
  albania: [
    ['Koman Lake ferry + Shala River', 'A boat through fjord-like cliffs, followed by bright-blue water and a swim stop.'],
    ['Ksamil islets', 'Calm, clear water and tiny islands make this the easiest all-day family win.'],
    ['Blue Eye of Theth', 'A real hike with a glowing turquoise payoff that feels discovered, not staged.'],
    ['Sarande Blue Eye + boat day', 'A second impossible-blue spring paired with time on the Ionian coast.'],
    ['Butrint National Park', 'Forest paths, ruins, walls, and a tower turn history into open-air exploring.'],
    ['Grunas Waterfall', 'A manageable Theth walk with cold spray and a dramatic mountain finish.'],
    ['Llogara Pass + Riviera reveal', 'The mountain road suddenly opening onto the Ionian coast creates a huge arrival moment.'],
    ['Gjipe + Porto Palermo coast', 'A wild cove and a seaside fortress add exploration beyond the classic beach days.']
  ],
  balkans: [
    ['Kravica Waterfalls', 'Swimmable falls and a huge visual payoff make this the clearest shared favorite.'],
    ['Paleokastritsa boat + caves', 'A small-boat cave trip, bright coves, and beach time on Corfu.'],
    ['Ksamil beaches + islands', 'Warm, shallow water and reachable-looking islets invite hours of play.'],
    ['Kotor walls + bay swim', 'A fortress climb for the adventure, followed by a cooling swim.'],
    ['The Blue Eye', 'A short nature stop built around water that looks almost unreal.'],
    ['Corfu Old Fortress', 'Ramparts, sea views, and hidden corners give the final island day a quest-like feel.'],
    ['Perast + Our Lady of the Rocks', 'A short boat ride to a tiny church island breaks up the road-trip sightseeing.'],
    ['Butrint National Park', 'Forest trails, towers, walls, and ruins make the history feel exploratory.']
  ],
  'california-pacific-coast': [
    ['San Diego Zoo', 'The trip’s biggest guaranteed kid-focused day, with enough variety for both ages.'],
    ['Monterey Bay Aquarium', 'Sharks, jellies, sea otters, and immersive exhibits make this weather-proof.'],
    ['La Jolla sea lions', 'Close-up wildlife and beach time without a long hike or formal tour.'],
    ['Santa Cruz Beach Boardwalk', 'Classic rides, arcade energy, and the ocean in one easy stop.'],
    ['Alcatraz ferry + cellhouse', 'The boat ride and escape stories give the older and younger kid different hooks.'],
    ['Elephant seals + Big Sur', 'Enormous wildlife beside one of the most dramatic coastal drives in the country.'],
    ['Coronado Beach + Mission Bay', 'Wide sand and calm-water options create San Diego’s easiest unstructured day.'],
    ['Golden Gate + Presidio', 'Iconic bridge views, coastal paths, and big open spaces keep San Francisco active.']
  ],
  'canary-islands': [
    ['Teide cable car + volcano landscape', 'A ride above the clouds into terrain that looks like another planet.'],
    ['Las Teresitas + black-sand beaches', 'A calm-water swim day plus the novelty of true volcanic sand.'],
    ['Roque de los Muchachos observatories', 'Telescopes, huge views, and clouds below the road create a real summit moment.'],
    ['Ruta de los Volcanes segment', 'A scalable walk across cinders and craters with constant visual payoff.'],
    ['Caldera de Taburiente', 'Choose the family route and still get giant canyon walls and pine-forest adventure.'],
    ['Anaga laurel forest', 'Twisted trees and misty paths feel more like a fantasy set than a normal hike.'],
    ['Los Tilos forest', 'A second primeval forest walk adds tunnels of greenery and waterfall-country atmosphere.'],
    ['Masca + Teno scenery', 'Hairpin roads and a cliff-walled village deliver drama even without the full gorge hike.']
  ],
  croatia: [
    ['Pakleni Islands boat day', 'Boats, coves, and repeated swim stops make this the obvious number one.'],
    ['Mljet National Park', 'Lake swimming, boats, bikes, and low-stress exploring all fit in one day.'],
    ['Vela Przina Beach, Lumbarda', 'Shallow sandy water is a welcome contrast to Croatia’s rockier beaches.'],
    ['Krka waterfalls', 'Easy boardwalks deliver close-up waterfalls without demanding a hard hike.'],
    ['Klis Fortress', 'Climbable walls and mountain views give both kids a proper fortress adventure.'],
    ['Diocletian’s Palace + Marjan', 'Hidden lanes, ancient basements, viewpoints, and gelato keep Split active.'],
    ['Hvar Fortica', 'A short climb to cannon-lined walls and harbor views gives Hvar a clear objective.'],
    ['Walls of Ston', 'Choose a family-sized section of the giant hillside walls, then refuel on the peninsula.']
  ],
  'dolomites-sardinia': [
    ['La Maddalena boat day', 'Turquoise coves, island-hopping, and swim stops are the trip’s strongest shared payoff.'],
    ['La Pelosa lagoon', 'Shallow, glass-clear water makes an effortless repeat-swim day.'],
    ['Gulf of Orosei boat day', 'Sea caves, limestone cliffs, and Cala Goloritze deliver maximum adventure.'],
    ['Lago di Braies', 'An emerald lake, rowboats, and a short shoreline walk work for both energy levels.'],
    ['Grotta del Bue Marino', 'Reaching a giant coastal cave by boat adds mystery to the beach half.'],
    ['Seceda by cable car', 'Instant access to a wild mountain ridge without making the eight-year-old earn every foot.'],
    ['Tre Cime', 'Choose the family-distance version for towering peaks, refuges, and a true mountain-day feeling.'],
    ['Burano by vaporetto', 'Boat transport and candy-colored streets give Venice a playful, camera-friendly finale.']
  ],
  'greece-via-lisbon': [
    ['Balos Lagoon boat day', 'The boat ride and enormous shallow lagoon are the trip’s clearest family headline.'],
    ['Elafonissi Beach', 'Warm, clear shallows provide the full beach day both kids will ask to repeat.'],
    ['Chania harbor evenings', 'Boats, gelato, waterfront wandering, and easy dinners keep the fun effortless.'],
    ['Imbros Gorge', 'A realistic family-scale gorge with narrow passages and a real finish-line feeling.'],
    ['The Acropolis', 'Mythology and monumental ruins give Athens one high-impact, story-rich stop.'],
    ['Cascais Bay', 'A gentle beach landing breaks up the long flight chain before Greece.'],
    ['Rethymno beach', 'A no-logistics swim day arrives exactly when everyone needs an easier pace.'],
    ['Belem Tower + riverfront', 'A fortress-like landmark, pastries, and the Tagus keep Lisbon’s history day approachable.']
  ],
  hawaii: [
    ['Hanauma Bay snorkeling', 'Colorful fish in a protected bay make this the most universally exciting activity.'],
    ['Kealakekua / Two Step snorkel', 'The Big Island’s clearest underwater payoff and a step up in adventure.'],
    ['Hawaii Volcanoes National Park', 'Lava fields, steam vents, and crater views feel unlike any other day.'],
    ['North Shore loop', 'Turtles, shave ice, beaches, and short stops keep both ages engaged.'],
    ['Punalu‘u Black Sand Beach', 'Black sand and the chance of sea turtles turn a transfer into a highlight.'],
    ['Hapuna Beach + Mauna Kea', 'A strong beach day capped by high-elevation sunset or stargazing.'],
    ['Rainbow Falls', 'A giant waterfall close to Hilo adds an easy final nature payoff.'],
    ['Pearl Harbor', 'Ships, aircraft, and powerful real stories give both ages an anchor beyond the beaches.']
  ],
  iceland: [
    ['Jokulsarlon iceberg boat + Diamond Beach', 'Floating icebergs and ice scattered across black sand feel completely unreal.'],
    ['Whale + puffin boat', 'Wildlife, a boat ride, and high story value make this a shared-age favorite.'],
    ['Solheimajokull glacier walk', 'Real crampons and blue ice create the trip’s biggest adventure, operator age rules permitting.'],
    ['Blue Lagoon finale', 'Warm blue water in cool air is an easy, celebratory last-day win.'],
    ['Seljalandsfoss + Skogafoss', 'Walk behind one waterfall, then face a giant curtain of water at the next.'],
    ['Reynisfjara + Dyrholaey puffins', 'Black sand, basalt columns, sea stacks, and birds pack several wow moments together.'],
    ['Geysir + Gullfoss + Secret Lagoon', 'Exploding water, a giant waterfall, and a warm soak make the Golden Circle varied.'],
    ['Reykjanes lava + steam', 'Fresh-looking lava fields, rifts, and geothermal steam create one more alien landscape.']
  ],
  'italy-salento-amalfi': [
    ['Maratea sea-cave boat day', 'Boats, caves, and hidden coves deliver the trip’s strongest adventure energy.'],
    ['Punta Prosciutto', 'Warm, shallow Salento water makes this the easiest full-family beach win.'],
    ['Ischia ferry + beach day', 'A ferry ride and a new island give the coast day a sense of discovery.'],
    ['Procida', 'Colorful harbors, boats, and low-pressure wandering suit both ages.'],
    ['Pescoluse beach', 'A second clear-water reset gives the kids a day with almost no agenda.'],
    ['Maratea’s Christ statue', 'The mountain road and enormous summit figure create a memorable scale moment.'],
    ['Otranto walls + waterfront', 'A compact fortified town gives the day a clear exploring loop before another swim.'],
    ['Amalfi + Atrani', 'Cliffside streets, boats in the harbor, and gelato make the famous coast tangible.']
  ],
  'madeira-crete': [
    ['Balos Lagoon boat day', 'The boat and vast shallow lagoon are the strongest shared favorite across both islands.'],
    ['Porto Moniz lava pools', 'Ocean drama with pool-like boundaries makes Madeira’s best family water day.'],
    ['Monte cable car + toboggans', 'A scenic ride up and a fast wicker-sled descent feel made for kids.'],
    ['Elafonissi or Falasarna', 'A full warm-water beach day balances the mountain and gorge adventures.'],
    ['Imbros Gorge + south-coast swim', 'A family-sized canyon walk ends with the reward both kids want.'],
    ['Fanal fog forest', 'Ancient twisted trees and shifting mist turn a short walk into fantasy scenery.'],
    ['Pico do Arieiro ridge', 'Dramatic stairs and clouds make even a shortened family version feel enormous.'],
    ['Preveli + Kourtaliotiko', 'A palm-lined river beach and gorge scenery combine swimming with exploration.']
  ],
  'madeira-mallorca': [
    ['Monte cable car + toboggans', 'The ride-and-slide combination is the trip’s most purpose-built kid memory.'],
    ['Porto Moniz lava pools', 'Safe-feeling ocean drama gives Madeira a water day both ages can own.'],
    ['Playa de Muro', 'Long, shallow, sandy water is ideal for an unstructured repeat-swim day.'],
    ['Drach Caves', 'Huge caverns and the underground lake make a contained, high-payoff finale.'],
    ['Formentor viewpoints', 'Cliff roads and enormous sea views provide drama without a punishing hike.'],
    ['Fanal forest + 25 Fontes', 'Pick misty fantasy woods or a waterfall levada depending on the day’s energy.'],
    ['Cala Mondrago', 'A final protected cove adds clear water after the cave visit.'],
    ['Sao Lourenco cliffs', 'A shortened out-and-back still delivers volcanic colors and ocean on both sides.']
  ],
  'madeira-sicily': [
    ['Monte cable car + toboggans', 'A scenic climb and fast wicker-sled descent win with both ages.'],
    ['Porto Moniz lava pools', 'Madeira’s most playful water stop combines waves, rocks, and protected pools.'],
    ['Mount Etna', 'A real volcano, cable-car possibilities, and black lava terrain deliver instant story value.'],
    ['Cefalu beach + La Rocca', 'Swim below the old town, then climb as far as the family wants.'],
    ['Isola Bella', 'Clear water, a tiny island, and a fun coastal setting make an easy final swim.'],
    ['Fanal fog forest', 'Ancient trees and drifting fog feel like walking through a fantasy film.'],
    ['Pico do Arieiro ridge', 'Clouds, stairs, and sharp peaks make a shortened family version feel genuinely epic.'],
    ['25 Fontes levada', 'A tunnel-and-waterfall trail gives Madeira a gentler adventure day.']
  ],
  portugal: [
    ['Slide & Splash', 'A full kid-first water-park day is the trip’s most guaranteed shared favorite.'],
    ['Ponta da Piedade boat', 'Small boats, sea arches, and caves make the Algarve cliffs interactive.'],
    ['Porto Moniz lava pools', 'Natural pools surrounded by volcanic rock create Madeira’s biggest family payoff.'],
    ['Benagil Cave', 'Reaching the famous sea cave by boat adds a true adventure objective.'],
    ['Quinta da Regaleira', 'Tunnels, towers, gardens, and the initiation well turn Sintra into a quest.'],
    ['Seixal black-sand beach', 'Black sand, green cliffs, and waterfalls give the final water days a new look.'],
    ['Sao Lourenco cliffs', 'A family-length out-and-back crosses colorful volcanic terrain above the ocean.'],
    ['Cabo Girao skywalk', 'Standing on glass high above the coast delivers a quick thrill with almost no hiking.']
  ],
  'portugal-crete': [
    ['Balos Lagoon boat day', 'The boat ride and enormous shallow lagoon are the route’s strongest shared favorite.'],
    ['Elafonissi or Falasarna', 'Warm, clear water gives both kids the unstructured beach day they will want.'],
    ['Stavros + Seitan Limania coves', 'Two dramatically different coves make the first full Crete day immediately exciting.'],
    ['Preveli + Kourtaliotiko', 'A palm-lined river beach and gorge scenery combine swimming with exploration.'],
    ['Imbros Gorge + south-coast swim', 'A realistic canyon challenge ends with a built-in water reward.'],
    ['Quinta da Regaleira', 'Sintra’s tunnels, towers, gardens, and spiral well feel like a real-life game level.'],
    ['Cascais beaches + tide pools', 'A flexible coast day lets both kids explore, swim, or simply reset.'],
    ['Lisbon tram + Alfama', 'The tram, steep lanes, viewpoints, and pastries keep the city day moving.']
  ],
  'portugal-sicily': [
    ['Mount Etna', 'A real volcano and black-lava terrain give the trip its biggest adventure story.'],
    ['Cefalu beach + La Rocca', 'Swim below the old town, then climb for a view if everyone still has energy.'],
    ['Isola Bella', 'Clear water and the tiny island make the Taormina coast easy to love.'],
    ['Quinta da Regaleira', 'Tunnels, towers, and the initiation well make Sintra the best Portugal kid stop.'],
    ['Guincho + Praia da Rainha', 'Wild surf scenery and a sheltered town cove create two very different beach moods.'],
    ['Lisbon tram + Alfama', 'The tram ride, steep lanes, viewpoints, and pastries keep the city day active.'],
    ['Cabo da Roca + Azenhas do Mar', 'Continental-edge cliffs and a village over a tidal pool create a dramatic coast day.'],
    ['Mondello beach', 'A sandy Palermo reset gives both kids another low-agenda swim day.']
  ],
  'sardinia-corsica': [
    ['Gulf of Orosei boat day', 'Cala Mariolu, Cala Luna, caves, and repeated swim stops make this number one.'],
    ['La Pelosa', 'Shallow, transparent water is the trip’s easiest all-day family beach win.'],
    ['Neptune’s Grotto', 'A boat or cliff-stair approach leads to a huge cave full of formations.'],
    ['Cala Goloritze hike + swim', 'A real trail challenge ends at one of Sardinia’s most dramatic coves.'],
    ['Bonifacio ferry + cliffs', 'Crossing to another island and arriving beneath fortress cliffs feels epic.'],
    ['Poetto + flamingos', 'Beach time plus nearby flamingo spotting makes a light, memorable final stretch.'],
    ['Rondinara / Petit Sperone', 'A protected Corsican cove gives the ferry side of the trip its best swim day.'],
    ['Villasimius + Porto Giunco', 'Clear water and another chance to spot flamingos create a strong final choice day.']
  ],
  'sicily-malta': [
    ['Blue Lagoon + Comino', 'A boat ride and bright, shallow water make this the clearest shared favorite.'],
    ['Mount Etna kid route', 'A real volcano with scalable walking gives both ages a high-impact adventure.'],
    ['Gozo day trip', 'Ferry rides, caves, coast, and a second island keep the day varied.'],
    ['Cefalu beach + Norman town', 'An easy swim sits directly below lanes and towers worth exploring.'],
    ['Isola Bella + Mazzaro', 'Clear coves and a tiny island create Sicily’s strongest east-coast water stop.'],
    ['Fontane Bianche swim + Ortigia', 'Pair another warm-water reset with boats, gelato, and waterfront wandering.'],
    ['Valletta fortifications', 'Harbor walls, steep lanes, and cannon-scale history make Malta’s capital easy to explore.'],
    ['Ortigia waterfront', 'Boats, sea walls, markets, and gelato give the old city a relaxed family rhythm.']
  ],
  'southern-france': [
    ['Lac de Sainte-Croix', 'Warm lake water and paddle options make this the trip’s strongest kid-centered day.'],
    ['Cassis Calanques boat', 'Cliffs, narrow inlets, and boat access deliver adventure without a hard hike.'],
    ['Pont du Gard + river swim', 'A giant Roman aqueduct becomes much more fun when paired with water time.'],
    ['Juan-les-Pins beach', 'An easy Riviera swim day gives both kids space to set the pace.'],
    ['Eze + Villefranche', 'A hilltop maze and a colorful bay combine exploring with a beach reward.'],
    ['Avignon palace + bridge', 'Fortress-scale rooms and the famous half-bridge make history visually memorable.'],
    ['Cap Canaille + Bestouan', 'A giant clifftop viewpoint paired with a quick beach stop keeps the day dynamic.'],
    ['Nice promenade + old town', 'Scooter-friendly waterfront space, colorful lanes, and easy food make a soft landing.']
  ],
  spain: [
    ['Water-park choice day', 'A full day of slides and pools is the most guaranteed shared-age favorite.'],
    ['Maro kayak + snorkel', 'Paddling beneath cliffs and getting into the water gives the coast a real mission.'],
    ['Caves of Nerja', 'Enormous formations make a contained adventure that works in any weather.'],
    ['The Alhambra', 'Palaces, water channels, towers, and fortress views reward the planning effort.'],
    ['Plaza de Espana', 'Bridges, tiled alcoves, and the huge open plaza make Seville feel cinematic.'],
    ['Malaga Alcazaba + city beach', 'A climbable fortress followed by a swim keeps the city day balanced.'],
    ['Nerja beach day', 'A full low-agenda coast day lets both ages choose swimming, sand, or downtime.'],
    ['Real Alcazar', 'Palace rooms, tiled courtyards, and gardens give Seville a storybook landmark.']
  ],
  'turkish-riviera': [
    ['Kekova Sunken City boat', 'Swimming, ruins beneath the water, and a full boat day give everyone a hook.'],
    ['Fethiye 12 Islands / Butterfly Valley boat', 'Repeated coves and swim stops make the second boat day equally memorable.'],
    ['Saklikent Gorge', 'Cold-water canyon walking on a hot day feels adventurous and immediately refreshing.'],
    ['Oludeniz Blue Lagoon', 'Warm, calm water and mountain scenery make an effortless family favorite.'],
    ['Kaputas + Patara', 'A dramatic cove and a huge sandy beach provide two different water-day payoffs.'],
    ['Dalyan + Iztuzu Turtle Beach', 'A riverboat, rock-cut tomb views, and turtle-beach possibility keep the day varied.'],
    ['Kaleici harbor + Mermerli', 'Old lanes, boats, and a compact beach make the arrival day immediately rewarding.'],
    ['Myra rock tombs', 'Tombs carved into cliffs and a huge Roman theater turn the transfer into exploration.']
  ]
};

const linkOverrides = {
  balkans: {
    'Ksamil beaches + islands': 'day8'
  },
  'canary-islands': {
    'Las Teresitas + black-sand beaches': 'day4',
    'Los Tilos forest': 'day9'
  },
  'dolomites-sardinia': {
    'Burano by vaporetto': 'day3'
  },
  'greece-via-lisbon': {
    'Rethymno beach': 'day11'
  },
  'madeira-mallorca': {
    'Playa de Muro': 'day10',
    'Fanal forest + 25 Fontes': 'day4'
  },
  'madeira-sicily': {
    'Cefalu beach + La Rocca': 'day8',
    'Isola Bella': 'day12'
  },
  'portugal-sicily': {
    'Cefalu beach + La Rocca': 'day7',
    'Isola Bella': 'day12'
  },
  'sicily-malta': {
    'Isola Bella + Mazzaro': 'day6',
    'Ortigia waterfront': 'day8'
  },
  spain: {
    'Nerja beach day': 'day8'
  }
};

const sectionPattern = /<section id="kids-favorites" class="divider">[\s\S]*?<\/section>/;

const stopWords = new Set('the a an and or to of day trip plus with by from at in into for family kid kids route final easy shared beach water old town city coast island islands'.split(' '));

function visibleText(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;|&#39;/g, "'")
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
}

function tokens(value) {
  return new Set(visibleText(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token)));
}

function referencedDay(slug, title, days) {
  const override = linkOverrides[slug]?.[title];
  if (override) {
    const day = days.find((candidate) => candidate.id === override);
    if (!day) throw new Error(`${slug}: override for "${title}" references missing ${override}`);
    return day;
  }

  const titleTokens = tokens(title);
  const rankedDays = days.map((day, index) => {
    const corpus = [day.heading, ...(day.spots || []).map((spot) => spot.name)].join(' ');
    const dayTokens = tokens(corpus);
    const score = [...titleTokens].filter((token) => dayTokens.has(token)).length;
    return { day, index, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  if (!rankedDays[0]?.score) throw new Error(`${slug}: could not match "${title}" to an itinerary day`);
  return rankedDays[0].day;
}

function renderSection(slug, items, days) {
  const cards = items.map(([title, description], index) => {
    const day = referencedDay(slug, title, days);
    return `
        <li style="border-top:3px solid var(--c1);color:var(--muted);line-height:1.5;font-size:.94rem">
          <a class="kids-favorite-link" href="#${day.id}" aria-label="${title}: jump to ${visibleText(day.eyebrow)}" style="display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:start;min-height:100%;padding:16px 8px 8px;border-radius:10px;color:inherit;text-decoration:none">
            <span aria-hidden="true" style="display:grid;place-items:center;width:30px;height:30px;border-radius:999px;background:var(--c1);color:#fff;font-size:.8rem;font-weight:900">${index + 1}</span>
            <span><b style="display:block;color:var(--ink);margin-bottom:2px">${title}</b>${description}<small style="display:block;margin-top:6px;color:var(--c1);font-size:.72rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase">${day.eyebrow} &rarr;</small></span>
          </a>
        </li>`;
  }).join('');

  return `<section id="kids-favorites" class="divider">
  <div class="section-label">
    <p class="eyebrow">Kids&rsquo; Favorites</p>
    <h2>Top 8 for ages 13 &amp; 8</h2>
    <p>Ranked for the best shared payoff for a 13-year-old and an 8-year-old: active, memorable, and worth the logistics.</p>
  </div>
  <div class="kids-favorites" style="padding:4px 0 0">
    <ol style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin:0;padding:0;list-style:none">${cards}
    </ol>
  </div>
</section>`;
}

const dataRoot = 'src/_data';
const slugs = fs.readdirSync(dataRoot)
  .filter((slug) => fs.existsSync(path.join(dataRoot, slug, 'main.json')))
  .sort();

const missingRankings = slugs.filter((slug) => !rankedFavorites[slug]);
const extraRankings = Object.keys(rankedFavorites).filter((slug) => !slugs.includes(slug));
if (missingRankings.length || extraRankings.length) {
  throw new Error(`Ranking coverage mismatch. Missing: ${missingRankings.join(', ') || 'none'}; extra: ${extraRankings.join(', ') || 'none'}`);
}

const invalidCounts = Object.entries(rankedFavorites)
  .filter(([, items]) => items.length !== 8)
  .map(([slug, items]) => `${slug} (${items.length})`);
if (invalidCounts.length) {
  throw new Error(`Expected 8 favorites per itinerary: ${invalidCounts.join(', ')}`);
}

for (const slug of slugs) {
  const items = rankedFavorites[slug];
  if (items.length !== 8) throw new Error(`${slug}: expected 8 favorites, found ${items.length}`);

  const file = path.join(dataRoot, slug, 'main.json');
  const raw = fs.readFileSync(file, 'utf8');
  const doc = JSON.parse(raw);
  const part = doc.parts.find((candidate) => candidate.html?.includes('id="kids-favorites"'));
  if (!part) throw new Error(`${slug}: kids-favorites section not found`);

  const matches = part.html.match(new RegExp(sectionPattern.source, 'g')) || [];
  if (matches.length !== 1) throw new Error(`${slug}: expected one kids-favorites section, found ${matches.length}`);

  const oldHtml = part.html;
  const nextHtml = oldHtml.replace(sectionPattern, renderSection(slug, items, doc.itinerary.days));
  const oldSerialized = JSON.stringify(oldHtml);
  const nextSerialized = JSON.stringify(nextHtml);
  const serializedMatches = raw.split(oldSerialized).length - 1;
  if (serializedMatches !== 1) throw new Error(`${slug}: expected one serialized HTML part, found ${serializedMatches}`);

  const nextRaw = raw.replace(oldSerialized, nextSerialized);
  const nextDoc = JSON.parse(nextRaw);
  const nextPart = nextDoc.parts.find((candidate) => candidate.html?.includes('id="kids-favorites"'));
  const favoriteSection = nextPart.html.match(sectionPattern)?.[0] || '';
  const itemCount = (favoriteSection.match(/<li /g) || []).length;
  if (itemCount !== 8) throw new Error(`${slug}: rendered ${itemCount} favorites`);
  const hrefs = [...favoriteSection.matchAll(/class="kids-favorite-link" href="#([^"]+)"/g)].map((match) => match[1]);
  const dayIds = new Set(nextDoc.itinerary.days.map((day) => day.id));
  if (hrefs.length !== 8 || hrefs.some((id) => !dayIds.has(id))) {
    throw new Error(`${slug}: one or more favorite links do not resolve to itinerary days`);
  }

  fs.writeFileSync(file, nextRaw);
  console.log(`updated ${slug}: 8 ranked favorites`);
}

console.log(`updated ${slugs.length} itineraries`);
