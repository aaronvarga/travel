#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as H from '../.agents/skills/travel-itinerary/scripts/itinerary-helpers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'southern-france';
const T = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/hawaii/main.json'), 'utf8'));
const { headBody, navToMain } = H.sliceChrome(T.parts[0].html, 'Southern France · Riviera to Provence — June 2027');
const outDir = path.join(root, 'src/_data', slug);
const rel = (file) => `../../assets/img/${slug}/${file}`;
const image = (file, title, credit) => H.img(rel(file), title, `${credit} · Google Images source`);
const restaurant = (href, label, note) => `<a href="${href}" target="_blank" rel="noreferrer"><b>${label}</b></a> — ${note}`;
const f = H.fact;

const photos = {
  hero: [
    ['google_hero_nice_waterfront.jpg', 'Nice waterfront and Old Town', 'Explore Nice Côte d’Azur / Julien Véran'],
    ['google_hero_cap_ferrat_aerial.jpg', 'Saint-Jean-Cap-Ferrat peninsula', 'Métropole Nice Côte d’Azur'],
    ['google_hero_calanques_cove.jpg', 'A turquoise Calanques cove', 'Malain17'],
    ['google_hero_valensole_rows.jpg', 'Valensole lavender rows', 'Loïc Lagarde'],
  ],
  bases: {
    nice: rel('google_base_nice_bay.jpg'),
    cassis: rel('google_base_cassis_calanque.jpg'),
    aix: rel('google_base_aix_sainte_victoire.jpg'),
  },
};

// The desktop grid row can grow taller than 82vh when the planning stats wrap.
// Keep the carousel full-bleed to that actual row height instead of leaving a
// black field below an image fixed at 82vh. Mobile retains the template's 56vh.
const heroLayoutFix = `<style>
@media (min-width:701px){
  .preview{align-items:stretch}
  .pvcar,.pvcar .track,.pvcar .track figure{height:100%}
  .pvcar .track img{height:100%;min-height:82vh;aspect-ratio:auto}
}
.pv-split .seg span{font-size:.52rem;white-space:normal;line-height:1.05}
</style>`;

const mapColors = { nice: '#1f6f78', cassis: '#c25a3a', aix: '#3f7d4e', transfer: '#3a6ea5' };
const mapPoints = [
  H.point('Nice Côte d’Azur Airport (NCE)', 43.6653, 7.2150, 'transfer', 'flight'),
  H.point('Nice base · 5 nights', 43.6960, 7.2712, 'nice', 'hotel'),
  H.point('Èze Village', 43.7276, 7.3619, 'nice', 'town'),
  H.point('Plage des Marinières · Villefranche', 43.7055, 7.3138, 'nice', 'beach'),
  H.point('Antibes Old Town', 43.5808, 7.1239, 'nice', 'town'),
  H.point('Plage du Ponteil', 43.5733, 7.1248, 'nice', 'beach'),
  H.point('Saint-Jean-Cap-Ferrat coast path', 43.6842, 7.3355, 'nice', 'hike'),
  H.point('Cassis base · 3 nights', 43.2140, 5.5396, 'cassis', 'hotel'),
  H.point('Port-Miou', 43.2094, 5.5193, 'cassis', 'hike'),
  H.point('Calanques boat departure', 43.2143, 5.5375, 'cassis', 'beach'),
  H.point('Plage de la Grande Mer', 43.2123, 5.5388, 'cassis', 'beach'),
  H.point('Aix-en-Provence base · 4 nights', 43.5297, 5.4474, 'aix', 'hotel'),
  H.point('Plateau de Valensole', 43.8371, 5.9842, 'aix', 'view'),
  H.point('Pont du Galetas · Lac de Sainte-Croix', 43.8014, 6.2495, 'aix', 'beach'),
  H.point('Palais des Papes · Avignon', 43.9508, 4.8075, 'aix', 'view'),
  H.point('Pont du Gard', 43.9475, 4.5353, 'aix', 'view'),
  H.point('Marseille Provence Airport (MRS)', 43.4393, 5.2214, 'transfer', 'flight'),
];

const spots = {
  niceArrival: H.mkSpot({
    name: 'Nice soft landing: Promenade, Old Town + pool', tags: ['nicefrance', 'promenadedesanglais'], carouselId: 'c-nice-arrival',
    images: [image('google_nice_golden_hour.jpg', 'Promenade at golden hour', 'Alex Lawrence Photography'), image('google_nice_castle_hill_view.jpg', 'Baie des Anges from Castle Hill', 'Alex Lawrence Photography')],
    lat: 43.6960, lng: 7.2712,
    cost: 'The Promenade, Castle Hill viewpoints, Old Town lanes and public beach are free. Budget about €20–35 for the airport transfer depending on transit versus taxi, then €70–110 for a simple family dinner and groceries.',
    climateLabel: 'Arrival reality', climate: '<b>Expect low-to-mid 70s°F by day, with possible warmer spikes.</b> Nice’s city beach is broad but made of smooth white pebbles; water shoes and a hotel pool matter more than beach-club hype.',
    save: 'Use tram/transit from NCE and walk the center. Treat the first swim as a short wake-up dip, not proof that the Mediterranean will feel warm to everyone.',
    splurge: 'Choose a central hotel or apartment with a genuinely usable pool and strong AC. Those two features earn more than a sea-view room on a busy road.',
    restos: [restaurant('https://lepointu-nice.fr/', 'Le Pointu', 'pizza, pasta and straightforward plates'), restaurant('https://restaurant-lecurie-nice.fr/', 'L’Écurie', 'Old Nice setting with approachable Provençal food')],
    alts: ['<b>Delay-proof version:</b> groceries, pool, Promenade sunset and bed.', '<b>Windy/cool version:</b> Old Town and Castle Hill viewpoints without committing to a swim.'],
    blogs: [{ label: 'Nice tourism · official', href: 'https://www.explorenicecotedazur.com/en/explore/towns-villages/coastal-area/nice/what-to-do-in-nice/' }],
  }),
  ezeVille: H.mkSpot({
    name: 'Èze Village early + Villefranche-sur-Mer swim', tags: ['ezevillage', 'villefranchesurmer'], carouselId: 'c-eze-villefranche',
    images: [image('google_eze_blue_hour.jpg', 'Èze perched above the Riviera', 'KocylaPix'), image('google_villefranche_bay.jpg', 'Villefranche bay and Marinières beach', 'Explore Nice Côte d’Azur / Métropole NCA')],
    lat: 43.7276, lng: 7.3619,
    cost: 'Regional transit is inexpensive; allow roughly €25–45 total for four depending on tickets. Jardin Exotique pricing is a 2027 recheck. Plage des Marinières is public and free.',
    climateLabel: 'Best sequence', climate: '<b>Hilltop first, water second.</b> Reach Èze Village before the main tour flow and midday heat, then descend by bus/train for a protected-bay afternoon at Villefranche.',
    save: 'Use Lignes d’Azur to Èze Village and TER from Èze-sur-Mer/Villefranche rather than a rental car or paid tour. Carry a compact picnic.',
    splurge: 'Lunch with a view is the only upgrade worth considering; keep the beach public and preserve time for an unhurried swim.',
    restos: [restaurant('https://www.tosca-restaurant.fr/en/', 'Tosca, Villefranche', 'pizza and pasta near the waterfront'), restaurant('https://www.pizzeriafootballclub.fr/', 'PFC', 'pizza and burgers for an easy family fallback')],
    alts: ['<b>Mobility/heat fallback:</b> skip the steep Nietzsche Path and connect by bus/train.', '<b>Late start:</b> Villefranche beach becomes the anchor; Èze is optional rather than rushed.'],
    blogs: [{ label: 'Lignes d’Azur line 82', href: 'https://www.lignesdazur.com/sites/default/files/2024-08/ligne_82.pdf' }, { label: 'Villefranche beaches · official', href: 'https://www.explorenicecotedazur.com/en/explore/towns-villages/coastal-area/villefranche-sur-mer/beaches/' }],
  }),
  antibes: H.mkSpot({
    name: 'Antibes Old Town + Ponteil / Salis sand', tags: ['antibes', 'juanlespins'], carouselId: 'c-antibes-beaches',
    images: [image('google_antibes_ponteil_sand.jpg', 'Ponteil’s sandy family beach below Old Antibes', 'SeeAntibes / Google Images source page'), image('google_antibes_old_town_aerial.jpg', 'Old Antibes, ramparts and sea', 'Ville d’Antibes Juan-les-Pins')],
    lat: 43.5733, lng: 7.1248,
    cost: 'TER from Nice plus public sand keeps this a modest day. Allow roughly €45–75 for family rail/local transit, then choose a picnic or casual lunch rather than a private beach setup.',
    climateLabel: 'Why this beach day', climate: '<b>Antibes is the sand correction to Nice.</b> The tourism office describes Ponteil and Salis as long sandy beaches with shallow water; still expect only moderately warm June sea temperatures.',
    save: 'Walk the Provençal market/ramparts, then use Ponteil or Salis. Juan-les-Pins is the backup when wind or crowding makes the east side less appealing.',
    splurge: 'Municipal loungers can be a comfort upgrade if 2027 rates remain reasonable, but arrive with the public-beach plan first.',
    restos: [restaurant('https://www.pizzagora.com/', 'Pizzagora', 'pizza and burgers with transparent prices'), restaurant('https://www.pizzadepape.fr/', 'Pizza de Papé', 'a dependable plain-pizza fallback')],
    alts: ['<b>Best sand:</b> continue to Juan-les-Pins if Ponteil/Salis feel exposed or crowded.', '<b>No-swim version:</b> market, Picasso Museum exterior/ramparts and harbor walk.'],
    blogs: [{ label: 'Antibes beaches · official', href: 'https://www.antibesjuanlespins.com/en/discover/the-must-sees/the-beaches' }],
  }),
  capFerrat: H.mkSpot({
    name: 'Saint-Jean-Cap-Ferrat coast path + swim', tags: ['saintjeancapferrat', 'sentierdulittoral'], carouselId: 'c-cap-ferrat',
    images: [image('google_cap_ferrat_town_dusk.jpg', 'Saint-Jean-Cap-Ferrat village at dusk', 'Doug Dietrich Photography'), image('google_cap_ferrat_rouvier_walk.jpg', 'Maurice Rouvier coastal walk', 'Jean-Marc Payet')],
    lat: 43.6842, lng: 7.3355,
    cost: 'Coastal paths and public shore access are free; local transit is low-cost. Villa Ephrussi is an optional paid anchor whose 2027 family price and hours must be rechecked.',
    climateLabel: 'Recovery pace', climate: '<b>Do only one path segment.</b> Shore paths are exposed and rocky; pair a cool-morning walk with Paloma/Passable or the hotel pool instead of circling the peninsula in June heat.',
    save: 'Use bus/train connections through Beaulieu-sur-Mer and pack water. The Rouvier walk is a gentler scenic choice than the full Tour du Cap.',
    splurge: 'Villa Ephrussi’s gardens can replace the longer walk if the family wants shade and structure; do not stack both.',
    restos: [restaurant('https://www.saint-jean-cap-ferrat.assietteauboeuf.fr/menu', 'Léo Léa', 'burgers and accessible family plates'), 'Use the village bakery/pizza takeaway listed in the municipal guide for a beach picnic.'],
    alts: ['<b>Heat fallback:</b> Villa Ephrussi gardens at opening, then pool.', '<b>Low-energy fallback:</b> Rouvier promenade and Beaulieu waterfront only.'],
    blogs: [{ label: 'Saint-Jean-Cap-Ferrat · official', href: 'https://www.nicecotedazur.org/metropole/territoire/les-communes/saint-jean-cap-ferrat/' }],
  }),
  niceRest: H.mkSpot({
    name: 'Nice recovery day: market, pool + one last swim', tags: ['nicefrance', 'coursaleya'], carouselId: 'c-nice-recovery',
    images: [image('google_nice_sunset.jpg', 'Sunset across the Baie des Anges', 'Alex Lawrence Photography'), image('google_nice_old_town.jpg', 'A quiet Old Nice street', 'rixpix6')],
    lat: 43.6955, lng: 7.2740,
    cost: 'A market breakfast, public promenade and hotel pool can keep the day near €90–140 for meals and small treats. Any museum is optional, not another timed obligation.',
    climateLabel: 'Deliberate blank space', climate: '<b>This is not a missing day.</b> It absorbs jet lag, warm weather and the cumulative effect of three transit outings before the driving half begins.',
    save: 'Sleep, shop Cours Saleya, use the pool and pack. Menton or Monaco stays an optional substitution, not an automatic checklist addition.',
    splurge: 'A shaded lunch or half-day beach club is defensible if everyone values comfort; do not confuse it with better sand.',
    restos: [restaurant('https://www.taverne-massena-nice.com/fr/', 'Taverne Masséna', 'broad brasserie menu'), restaurant('https://lepointu-nice.fr/', 'Le Pointu', 'repeatable pizza/pasta safety valve')],
    alts: ['<b>Menton substitution:</b> direct TER only if everyone actively wants another town.', '<b>Bad-weather version:</b> Matisse/Chagall plus Old Town lunch.'],
    blogs: [{ label: 'SNCF Nice–Menton proxy', href: 'https://www.sncf-connect.com/en-en/train/timetables/nice/menton' }],
  }),
  cassisArrival: H.mkSpot({
    name: 'Nice → Cassis: car pickup, harbor + Cap Canaille', tags: ['cassis', 'capcanaille'], carouselId: 'c-cassis-arrival',
    images: [image('google_cassis_cap_canaille.jpg', 'Cap Canaille above Cassis bay', 'Office de Tourisme de Cassis'), image('google_cassis_flower_lane.jpg', 'A flower-filled Cassis lane', 'Office de Tourisme de Cassis')],
    lat: 43.2140, lng: 5.5396,
    cost: 'The transfer is already carried in the trip car/road budget. Use Gorguettes park-and-ride when useful; the official lot has free parking and a shuttle toward the center, beaches and Calanques.',
    climateLabel: 'Traffic rule', climate: '<b>Leave Nice after breakfast, before event-week pressure.</b> Cannes Lions begins June 21; the itinerary is already off the Riviera on June 16. Avoid the coastal Cannes crawl and use the autoroute.',
    save: 'Pick up the one-way automatic only when leaving Nice, then use Cassis parking/shuttle rather than hunting the harbor core.',
    splurge: 'A Cassis lodging choice with confirmed parking and pool is worth more than a harbor-front room with no car solution.',
    restos: [restaurant('https://www.grandlargecassis.com/details-menu%2Benfant-124', 'Grand Large', 'published child menu with steak-frites or fish and chips'), restaurant('https://www.pizzeria-stazione-cassis.com/la-carte/', 'Della Stazione', 'pizza close to the station side')],
    alts: ['<b>Late arrival:</b> harbor loop, groceries and pool only.', '<b>Wind/fire restriction:</b> skip Route des Crêtes; its status can change and scenery is not worth a closure gamble.'],
    blogs: [{ label: 'Cassis parking · official', href: 'https://www.cassis.fr/gerer-mon-quotidien/transports-et-stationnements' }, { label: 'Cannes Lions dates · official', href: 'https://www.canneslions.com/?event_id=70' }],
  }),
  calanques: H.mkSpot({
    name: 'Calanques by boat + Port-Miou on foot', tags: ['calanques', 'portmiou'], carouselId: 'c-calanques',
    images: [image('google_calanques_cliff_view.jpg', 'White Calanques cliffs above the sea', 'Emmanuel Viard'), image('google_calanques_turquoise_inlet.jpg', 'A sheltered turquoise Calanques inlet', 'Ramon Boersbroek')],
    lat: 43.2094, lng: 5.5193,
    cost: 'The current five-calanque circuit is €25 per person and about 1h20, or roughly €100 for four before snacks; recheck 2027 price and sailing conditions. Port-Miou walking is free.',
    climateLabel: 'Fire and sea gate', climate: '<b>Boat first, short land walk second.</b> From June 1 to September 30 the park publishes daily fire-access decisions; red closure can shut land access while boats may still operate without landing.',
    save: 'Choose the short official circuit and a Port-Miou out-and-back rather than an exposed all-day hike. Confirm wind/sea state at the harbor.',
    splurge: 'A small-group boat is only worth the premium for shade, a family-friendly cancellation rule and a calmer forecast.',
    restos: [restaurant('https://bistroquaicassis.fr/', 'Bistro’quai', 'family-friendly harbor option'), restaurant('https://www.pizzeria-stazione-cassis.com/la-carte/', 'Della Stazione', 'plain pizza after the boat')],
    alts: ['<b>Red fire day:</b> boat if operating, then pool/harbor; no land workaround.', '<b>Rough sea:</b> Port-Miou viewpoint, Bestouan and pool—do not force a nauseating cruise.'],
    blogs: [{ label: 'Calanques land rules · official', href: 'https://www.calanques-parcnational.fr/en/regulations-land' }, { label: 'Five-calanque circuit', href: 'https://www.visite-calanques-cassis.com/en/circuits/2-4-visit-the-5-calanques.html' }],
  }),
  cassisRest: H.mkSpot({
    name: 'Cassis beach / pool recovery + optional paddle', tags: ['cassis', 'plagegrandemer'], carouselId: 'c-cassis-recovery',
    images: [image('google_cassis_family_kayak.jpg', 'Family kayaking close to Cassis shore', 'Office de Tourisme de Cassis'), image('google_cassis_grande_mer_beach.jpg', 'Grande Mer beach in Cassis', 'Office de Tourisme de Cassis')],
    lat: 43.2123, lng: 5.5388,
    cost: 'Grande Mer is public. Keep €80–160 for food, shade and an optional short rental; do not prebuy a conditions-sensitive kayak excursion. Bestouan is pebbles/rock rather than the sandy promise some families expect.',
    climateLabel: 'Real recovery', climate: '<b>Nothing must happen today.</b> June water is swimmable for many but only moderately warm; the pool is the reliable long-session option.',
    save: 'Use Grande Mer early, retreat for lunch/pool, then return to the harbor after the day-trippers thin.',
    splurge: 'Rent a tandem kayak only with benign wind, clear operator boundaries and confident swimmers; otherwise spend on shade and lunch.',
    restos: [restaurant('https://bistroquaicassis.fr/', 'Bistro’quai', 'easy all-ages harbor meal'), restaurant('https://www.grandlargecassis.com/details-menu%2Benfant-124', 'Grand Large', 'known child-menu fallback')],
    alts: ['<b>Windy day:</b> market lanes, pool and an early dinner.', '<b>High-energy option:</b> a short operator-approved paddle, never a second full Calanques expedition.'],
    blogs: [{ label: 'Bestouan beach · official', href: 'https://www.ot-cassis.com/en/touristic_sheet/bestouan-beach-cassis-en-5732419/' }, { label: 'Cassis kayak listing', href: 'https://www.ot-cassis.com/offres/lokayak-cassis-fr-5642992/' }],
  }),
  aixArrival: H.mkSpot({
    name: 'Cassis → Aix: market lanes, fountains + pool', tags: ['aixenprovence', 'coursmirabeau'], carouselId: 'c-aix-arrival',
    images: [image('google_aix_rotonde_fountain.jpg', 'Fontaine de la Rotonde', 'Aix-en-Provence Tourism / Daniel Kapikian'), image('google_aix_guided_walk.jpg', 'A guided walk through central Aix', 'Aix-en-Provence Tourism / Sophie Spiteri')],
    lat: 43.5297, lng: 5.4474,
    cost: 'The center is best explored on foot. Allow €100–160 for market food, parking outside the tight core and dinner; no museum reservation is needed on transfer day.',
    climateLabel: 'Inland heat', climate: '<b>Aix is usually hotter than the coast.</b> Arrive, park once, take a shaded lane-and-fountain loop and use the pool rather than turning this into a monument list.',
    save: 'Choose lodging with confirmed parking, AC and pool, then walk or use local transit. An edge-of-center base is often easier than the prettiest address.',
    splurge: 'A serviced apartment or hotel pool with reliable shade is the comfort upgrade that pays off across four nights.',
    restos: [restaurant('https://lapizzaaix.fr/', 'La Pizza', 'long-running family Italian option'), restaurant('https://www.thefork.fr/restaurant/monna-isa-r852597/menu', 'Monna Isa', 'menu-visible Italian fallback')],
    alts: ['<b>Hot arrival:</b> groceries and pool first, Cours Mirabeau after 6pm.', '<b>Market closed:</b> fountain loop and a bakery picnic.'],
    blogs: [{ label: 'Aix-en-Provence Tourism', href: 'https://www.aixenprovencetourism.com/en/' }],
  }),
  valensoleVerdon: H.mkSpot({
    name: 'Valensole bloom check + Lac de Sainte-Croix', tags: ['valensole', 'lacsaintecroix'], carouselId: 'c-valensole-verdon',
    images: [image('google_valensole_stone_shed.jpg', 'Lavender rows across the Valensole plateau', 'alainazer'), image('google_verdon_lake_aerial.jpg', 'Turquoise lake beneath the Verdon hills', 'Verdon Tourisme')],
    lat: 43.8014, lng: 6.2495,
    cost: 'Lavender-road viewpoints and the lake shore are free. Budget €120–220 for fuel/parking, picnic or lunch, and an optional paddleboat/kayak whose 2027 price and wind rules are rechecked locally.',
    climateLabel: 'Lavender honesty', climate: '<b>June 20 is early-edge, not a bloom guarantee.</b> Provence guidance describes end-June into summer as the normal window and timing varies by year. The turquoise lake—not purple fields—is the day’s guaranteed reason to drive.',
    save: 'Check current bloom reports shortly before departure, stop only at fields already showing well, then move on to the lake. Avoid roadside trespass and crop damage.',
    splurge: 'A legal small-group water rental at Pont du Galetas can be the family highlight if wind rules permit; do not book a lavender photo tour months ahead.',
    restos: [restaurant('https://www.moustiers.fr/en/fiche/brasserie-du-petit-lac-3/', 'Brasserie du Petit Lac', 'pizza and burgers near the lake'), 'Pack an Aix bakery picnic so a slow lunch does not consume the best lake hours.'],
    alts: ['<b>Little/no bloom:</b> lake, Galetas bridge and Moustiers only—no village scavenger hunt.', '<b>Heat/wind:</b> early viewpoints, shaded lunch and pool back in Aix.'],
    blogs: [{ label: 'Provence lavender route', href: 'https://pro.provenceguide.com/wp/itineraire/la-route-de-la-lavande/' }, { label: 'Verdon lakes · official', href: 'https://www.verdontourisme.com/en/preparer-mon-sejour/discover-verdon/discover-destination/lacs-de-castillon-et-sainte-croix/' }],
  }),
  aixRest: H.mkSpot({
    name: 'Aix recovery: Cézanne thread + pool', tags: ['aixenprovence', 'cezanne'], carouselId: 'c-aix-recovery',
    images: [image('google_aix_clock_blue_hour.jpg', 'Aix clock tower at blue hour', 'PF Foto'), image('google_aix_madeleine_church.jpg', 'Église de la Madeleine in Aix', 'Andrey Sulitskiy')],
    lat: 43.5297, lng: 5.4474,
    cost: 'Keep the baseline to a free old-town walk, market food and pool. Add one Cézanne site only after official 2027 hours/renovation status are confirmed.',
    climateLabel: 'Heat buffer', climate: '<b>Protect 1–5pm.</b> This day absorbs heat, a tiring Verdon drive or a late start, and makes the final Avignon day feel possible rather than compulsory.',
    save: 'Follow a short Cézanne walking thread, lunch in shade and return to the pool. No Luberon village loop is hiding here.',
    splurge: 'A single guided Cézanne walk is reasonable if the children engage; otherwise choose gelato and water time.',
    restos: [restaurant('https://lapizzaaix.fr/', 'La Pizza', 'reliable repeat option'), restaurant('https://www.thefork.fr/restaurant/monna-isa-r852597/menu', 'Monna Isa', 'Italian menu with straightforward orders')],
    alts: ['<b>Full recovery:</b> pool, laundry and a sunset Cours Mirabeau stroll.', '<b>Cool day:</b> add one studio/museum, not a second driving circuit.'],
    blogs: [{ label: 'Aix tourism · Cézanne', href: 'https://www.aixenprovencetourism.com/en/' }],
  }),
  avignonPont: H.mkSpot({
    name: 'Avignon + Pont du Gard river finale', tags: ['avignon', 'pontdugard'], carouselId: 'c-avignon-pont',
    images: [image('google_avignon_pont_aerial.jpg', 'Pont Saint-Bénézet and Avignon at dusk', 'Avignon Tourisme'), image('google_pont_du_gard_turquoise.jpg', 'Pont du Gard above the Gardon', 'Howard / Flickr')],
    lat: 43.9475, lng: 4.5353,
    cost: 'Current proxies: Avignon’s family Palais+Pont ticket is €53, and Pont du Gard lists €8 adult with under-18s free plus €9 parking. Recheck 2027 prices, hours and river conditions.',
    climateLabel: 'High-value two-stop day', climate: '<b>Culture early, water late.</b> See the palace/bridge before the heat, then make Pont du Gard the shaded river-and-engineering payoff—not another old-town stop.',
    save: 'Use the family ticket only if both Avignon anchors are open and wanted. Bring swim gear and picnic supplies for Pont du Gard.',
    splurge: 'A guided palace visit is optional; the better family upgrade may be an easy dinner back in Aix after the long loop.',
    restos: [restaurant('https://www.lacigale-avignon.fr/menus/', 'La Cigale', 'burgers and a child-friendly menu'), restaurant('https://www.eclairpizza.fr/', 'Éclair Pizza', 'simple pizza fallback')],
    alts: ['<b>Extreme heat:</b> palace at opening, skip the bridge ticket if energy is low, then river shade.', '<b>River restriction:</b> aqueduct viewpoints/museum only; never promise swimming conditions.'],
    blogs: [{ label: 'Palais des Papes · official', href: 'https://avignon-tourisme.com/en/offres/popespalace-avignon-en-4143543/' }, { label: 'Pont du Gard prices · official', href: 'https://pontdugard.fr/en/FAQ/tarifs-et-billetterie' }],
  }),
};

const days = [
  H.travelDay('day0', '1', 'Thu · Jun 10', 'Depart Pittsburgh after work', 'Overnight toward Nice', 'Est. $70 · airport meals', [f('Plan', 'PIT → European hub → NCE'), f('PTO', '0 if the first flight leaves after work')], 'Exact 2027 schedule and price are unconfirmed planning gates.'),
  H.day('day1', 'c1', '2', 'Fri · Jun 11', 'Arrive Nice + soft landing', 'Promenade, pool, early bed', 'Est. $140 · transit, food, groceries', [f('Sleep', 'Nice · night 1 of 5'), f('PTO', 'Day 1 of 8')], 'No timed attraction belongs on arrival day.', [spots.niceArrival]),
  H.day('day2', 'c1', '3', 'Sat · Jun 12', 'Èze early + Villefranche swim', 'Hilltop drama, protected bay', 'Est. $150 · transit, food, optional garden', [f('Sleep', 'Nice · night 2 of 5'), f('Car', 'None · bus + TER')], 'Skip the Nietzsche Path in heat; this is not a hiking test.', [spots.ezeVille]),
  H.day('day3', 'c1', '4', 'Sun · Jun 13', 'Antibes Old Town + sandy beaches', 'The Riviera’s family-sand day', 'Est. $170 · rail, meals, beach', [f('Sleep', 'Nice · night 3 of 5'), f('Anchor', 'Ponteil/Salis or Juan-les-Pins sand')], 'Give the beach the afternoon; do not tack on Cannes.', [spots.antibes]),
  H.day('day4', 'c1', '5', 'Mon · Jun 14', 'Saint-Jean-Cap-Ferrat', 'Short coast walk, swim, pool', 'Est. $150 · transit, meals, optional villa', [f('Sleep', 'Nice · night 4 of 5'), f('PTO', 'Day 2 of 8')], 'One path segment plus water is enough.', [spots.capFerrat]),
  H.day('day5', 'c1', '6', 'Tue · Jun 15', 'Nice recovery day', 'Market, pool, pack', 'Est. $120 · meals and treats', [f('Sleep', 'Nice · night 5 of 5'), f('PTO', 'Day 3 of 8')], 'Menton/Monaco is an optional swap, not a mandatory sixth Riviera headline.', [spots.niceRest]),
  H.day('day6', 'c2', '7', 'Wed · Jun 16', 'Pick up car → Cassis', 'Leave the Riviera before event week', 'Est. $190 · road costs, meals', [f('Sleep', 'Cassis · night 1 of 3'), f('PTO', 'Day 4 of 8'), f('Drive', 'About 2.5–3.5 hrs before stops/traffic; recheck')], 'Use the autoroute and confirmed lodging parking.', [spots.cassisArrival], '🚗 Pick up the one-way automatic only when leaving Nice.'),
  H.day('day7', 'c2', '8', 'Thu · Jun 17', 'Calanques boat + Port-Miou', 'Cliffs without an all-day exposed hike', 'Est. $210 · boat, meals, shuttle', [f('Sleep', 'Cassis · night 2 of 3'), f('PTO', 'Day 5 of 8')], 'Fire status and sea state decide the exact version each morning.', [spots.calanques]),
  H.day('day8', 'c2', '9', 'Fri · Jun 18 · observed holiday', 'Cassis beach / pool recovery', 'The genuine nothing-must-happen day', 'Est. $140 · meals, shade, optional paddle', [f('Sleep', 'Cassis · night 3 of 3'), f('PTO', '0 if employer observes Juneteenth Friday')], 'If the employer does not observe the holiday, total PTO becomes 9.', [spots.cassisRest]),
  H.day('day9', 'c3', '10', 'Sat · Jun 19', 'Cassis → Aix-en-Provence', 'Short move, slow city evening', 'Est. $150 · road costs and meals', [f('Sleep', 'Aix · night 1 of 4'), f('Drive', 'About 50–75 min before traffic/parking')], 'Park once, then walk.', [spots.aixArrival], '🚗 Keep the same car through Marseille Airport return.'),
  H.day('day10', 'c3', '11', 'Sun · Jun 20', 'Valensole + Lac de Sainte-Croix', 'Lavender if ready; lake regardless', 'Est. $220 · road costs, food, optional boat', [f('Sleep', 'Aix · night 2 of 4'), f('Bloom', 'Conditional; verify days before')], 'The lake is the success condition. Lavender is a bonus.', [spots.valensoleVerdon]),
  H.day('day11', 'c3', '12', 'Mon · Jun 21', 'Aix recovery + Cézanne thread', 'Pool and heat buffer', 'Est. $130 · meals, one optional site', [f('Sleep', 'Aix · night 3 of 4'), f('PTO', 'Day 6 of 8')], 'Cannes Lions begins today; the family is already inland.', [spots.aixRest]),
  H.day('day12', 'c3', '13', 'Tue · Jun 22', 'Avignon + Pont du Gard', 'Palace, bridge, river', 'Est. $230 · tickets, road costs, meals', [f('Sleep', 'Aix · night 4 of 4'), f('PTO', 'Day 7 of 8')], 'Two high-value anchors; no extra village loop.', [spots.avignonPont]),
  H.travelDay('day13', '14', 'Wed · Jun 23', 'Aix → MRS → Pittsburgh', 'Return car, fly home', 'Est. $100 · road/airport meals', [f('PTO', 'Day 8 of 8'), f('Car', 'Return at Marseille Airport'), f('Home', 'Jun 24–26 fully protected')], 'Book only an itinerary that gets the family home on June 23; exact 2027 air remains unconfirmed.'),
];

const overview = `<section id="overview">${H.sectionLabel('The Plan at a Glance', 'Riviera polish, Cassis cliffs, Provence space', 'A linear 12-night route built for a family of four—not a village checklist.')}<div class="overview"><div class="ocard"><p class="eyebrow">5 nights</p><h4>Nice without a car</h4><p>Transit outings to Èze/Villefranche, Antibes and Cap Ferrat, with one deliberately slow Nice day.</p></div><div class="ocard"><p class="eyebrow">3 nights</p><h4>Cassis with recovery</h4><p>One Calanques headline day, one true beach/pool day and enough margin for wind/fire rules.</p></div><div class="ocard"><p class="eyebrow">4 nights</p><h4>Aix as the inland base</h4><p>Valensole/Verdon, Avignon/Pont du Gard and a pool/heat buffer without changing hotels again.</p></div></div><div class="tldr"><b>Recommendation:</b> This is now a credible all-around contender, not the old compressed eight-night sketch. Its strengths are variety, food and pacing; its honest penalties are cost, only moderately warm sea water, traffic after Nice and lavender uncertainty. At 35/50 it would enter the active set tied for fifth by raw score, but the family’s prior exclusion remains recorded until that decision is explicitly reversed.</div></section>`;

const why = `<section id="why-this-trip" class="divider">${H.sectionLabel('Why This Trip', 'A high-reward route with honest friction', 'The plan earns its length by reducing churn and protecting water/recovery time.')}<div class="tips-grid">${H.tipcard('The strongest version', 'Not a Riviera checklist', ['Èze/Villefranche, Antibes sand, Cap Ferrat and a whole Nice recovery day fill five nights without Cannes/Monaco compulsion.', 'The car starts only when rail/transit stops being the better tool.'])}${H.tipcard('What children get', 'Real water and release valves', ['Ponteil/Salis or Juan-les-Pins sand, Villefranche’s protected bay, Cassis beach/pool and Lac de Sainte-Croix.', 'Three low-output afternoons protect an 8-year-old without boring a 13-year-old.'])}${H.tipcard('What can go wrong', 'Visible before booking', [{ flag: 'A realistic family band is $13.35k–$19.1k; the $15k preference is possible only near the low case.' }, { flag: '2027 air, automatic-car pricing, fire access and lavender bloom are gates—not promises.' }, 'Nice/Cassis beach texture and June water temperature are weaker than warm-sand destinations.'])}</div></section>`;

const baseCard = (cls, nights, title, imageUrl, alt, rows, tip) => `<div class="base ${cls}"><div class="band">${nights}</div><img class="bimg" src="${imageUrl}" alt="${alt}" loading="lazy"><div class="bbody"><h4>${title}</h4>${rows.map(([a,b]) => H.prow(a,b)).join('')}<div class="tip">${tip}</div></div></div>`;
const stays = `<section id="stays" class="divider">${H.sectionLabel('Where to Stay', 'Three bases, twelve nights', 'Prioritize pool, AC and logistics over postcard addresses.')}<div class="bases">${baseCard('b1','5 nights','Nice · Jun 11–15',photos.bases.nice,'Nice waterfront and Baie des Anges',[['Best fit','Central tram/TER access · pool · strong AC'],['Car','None'],['Watch','Pebble shore and Riviera pricing']], 'Avoid hilltop apartments that turn every transit day into a climb. A usable pool is the warm-water fallback.')}${baseCard('b2','3 nights','Cassis · Jun 16–18',photos.bases.cassis,'Turquoise Calanques water near Cassis',[['Best fit','Confirmed parking · pool · walk/shuttle access'],['Car','One-way automatic from Nice'],['Watch','Tight streets, wind/fire access']], 'Parking is a booking criterion. Harbor-front charm does not compensate for an impossible car setup.')}${baseCard('b3','4 nights','Aix · Jun 19–22',photos.bases.aix,'Sainte-Victoire beyond the Aix countryside',[['Best fit','Edge of center · parking · pool · AC'],['Day trips','Valensole/Verdon · Avignon/Pont du Gard'],['Watch','Heat and old-core access']], 'A slightly less central pool-and-parking base is the rational family choice for the inland half.')}</div></section>`;

const calendar = H.calendarGrid({ window: [2027, 6, 6, 6, 26], intro: 'The exact 2027 flight times remain schematic. The blocks show the intended energy pattern: Riviera transit, a car handoff on June 16, and recovery after each high-output day.', tripDays: [
  { date:[6,10], blocks:[{act:'air',start:18,end:22,label:'PIT departure'}] }, { date:[6,11], blocks:[{act:'air',start:8,end:14,label:'Arrive NCE'},{act:'rest',start:16,end:20,label:'Pool + Promenade'}] },
  { date:[6,12], blocks:[{act:'town',start:8,end:12,label:'Èze'},{act:'water',start:13,end:18,label:'Villefranche'}] }, { date:[6,13], blocks:[{act:'town',start:9,end:12,label:'Antibes'},{act:'water',start:13,end:18,label:'Sand beach'}] },
  { date:[6,14], blocks:[{act:'hike',start:8,end:12,label:'Cap Ferrat'},{act:'water',start:13,end:16,label:'Swim'},{act:'rest',start:16,end:19,label:'Pool'}] }, { date:[6,15], blocks:[{act:'rest',start:8,end:18,label:'Nice recovery'}] },
  { date:[6,16], blocks:[{act:'car',start:8,end:14,label:'Nice → Cassis'},{act:'rest',start:15,end:19,label:'Settle'}] }, { date:[6,17], blocks:[{act:'water',start:9,end:12,label:'Calanques boat'},{act:'hike',start:14,end:17,label:'Port-Miou'}] },
  { date:[6,18], blocks:[{act:'rest',start:8,end:12,label:'Slow morning'},{act:'water',start:13,end:18,label:'Beach / pool'}] }, { date:[6,19], blocks:[{act:'car',start:10,end:12,label:'Cassis → Aix'},{act:'town',start:15,end:19,label:'Aix'}] },
  { date:[6,20], blocks:[{act:'car',start:7,end:10,label:'Valensole'},{act:'water',start:11,end:17,label:'Sainte-Croix'}] }, { date:[6,21], blocks:[{act:'rest',start:8,end:16,label:'Aix recovery'},{act:'town',start:17,end:20,label:'Cézanne walk'}] },
  { date:[6,22], blocks:[{act:'town',start:8,end:12,label:'Avignon'},{act:'water',start:14,end:18,label:'Pont du Gard'}] }, { date:[6,23], blocks:[{act:'car',start:6,end:8,label:'Aix → MRS'},{act:'air',start:9,end:22,label:'Fly to PIT'}] },
] });

const mapStage = `<div class="mapstage"><button class="layers-btn" aria-expanded="false" aria-label="Map layers"><span class="lbi">▧</span> Layers</button><div class="layers-panel" hidden><div class="layers-top"><strong>Map layers</strong><button class="layers-x" aria-label="Close">×</button></div><div class="layers-acts"><button data-all="1">Select all</button><span class="dot">·</span><button data-all="0">Deselect all</button></div><div class="layers-list"></div></div><div id="tripmap"></div></div>`;
const mapAirGround = `<section id="map" class="divider">${H.sectionLabel('The Whole Trip, Mapped', 'One linear route', 'Transit spokes from Nice, then one-way driving to Cassis, Aix and Marseille Airport.')}<div class="tripmap-wrap"><div class="mapbtns"><button data-region="nice"><span class="sw" style="background:${mapColors.nice}"></span>Nice / Riviera</button><button data-region="cassis"><span class="sw" style="background:${mapColors.cassis}"></span>Cassis</button><button data-region="aix"><span class="sw" style="background:${mapColors.aix}"></span>Aix / Provence</button><button data-region="all">Whole trip</button></div>${mapStage}</div></section><section id="air-travel" class="divider">${H.sectionLabel('Air Travel', 'Open-jaw is the working hypothesis', 'Fly into Nice and home from Marseille so the ground route never backtracks. Exact June 2027 schedules and fares are not yet confirmed.')}<div class="plan-grid">${H.card('Investigate first', H.prow('Outbound','PIT → hub → NCE · Jun 10/11')+H.prow('Return','MRS → hub → PIT · Jun 23')+H.prow('Connections','No PIT–Nice nonstop in current proxy; target one connection each way')+'<div class="tip">Price as one multi-city ticket when schedules open. Do not book separate unprotected long-haul tickets to manufacture a cheap fare.</div>')}${H.card('Current fare proxy', H.prow('June PIT–Nice','Google Flights currently describes roughly $1,300–1,600 round trip per traveler')+H.prow('Family planning line','$5,200–6,800 for open-jaw economy')+H.prow('Status','Observed planning range, not a 2027 quote')+'<div class="tip">The route only fits near $15k when air and lodging land close to their low cases.</div>')}${H.card('Hard return gate', H.prow('Required','Home in Pittsburgh on Jun 23')+H.prow('Protected','All day Jun 24–26')+H.prow('Reject','Any fare arriving Jun 24')+'<div class="tip">A cheap itinerary that breaks the home requirement is not an option.</div>')}</div></section><section id="getting-around" class="divider">${H.sectionLabel('Getting Around', 'Rail first, car second', 'The mode changes once, on June 16.')}<div class="plan-grid">${H.card('Riviera · no rental', H.prow('Use','TER + Lignes d’Azur')+H.prow('Direct rail spine','Nice · Villefranche · Èze-sur-Mer · Monaco · Menton')+H.prow('Èze Village','Bus connection; village is uphill from Èze-sur-Mer')+'<div class="tip">Antibes/Juan-les-Pins is a straightforward TER day. Avoid Riviera parking fees and congestion.</div>')}${H.card('One-way car · Jun 16–23', H.prow('Pick up','Nice as the family leaves')+H.prow('Return','Marseille Airport before flight')+H.prow('Book','Automatic · family luggage · one-way fee shown')+'<div class="tip">Reserve cancellable/pay-later early. Inspect every lodging’s parking instructions before committing.</div>')}${H.card('Driving rules', H.prow('Cassis','Use Gorguettes/shuttle when appropriate')+H.prow('Aix/Avignon','Park outside old cores')+H.prow('Road day','Leave margin for tolls, queues, heat and stops')+'<div class="tip">Route des Crêtes and Calanques land access can close for fire/wind danger. A map line is not permission to drive.</div>')}</div></section>`;

const healthTiming = `<section id="health-check" class="divider">${H.sectionLabel('Reality Check', 'The weaknesses, explicitly', 'This route is excellent when booked for what it is—not mistaken for a warm-sand bargain.')}<div class="hc-grid"><div class="hc watch"><span class="hc-tag">Beach</span><h4>Nice is pebbles</h4><p>Choose Antibes for family sand and carry water shoes elsewhere. Cassis also mixes sand, pebbles and rock.</p></div><div class="hc watch"><span class="hc-tag">Water</span><h4>June sea is moderate</h4><p>Use roughly 68–72°F as a historical planning range, not a forecast. Pools protect longer water sessions.</p></div><div class="hc watch"><span class="hc-tag">Cost</span><h4>Riviera premiums are real</h4><p>Nice/Cassis rooms and open-jaw air can push the family well beyond the preferred $15k.</p></div><div class="hc actnow"><span class="hc-tag">Operations</span><h4>Heat, parking, fire</h4><p>Start outdoors early, protect afternoons and check official Calanques access every morning.</p></div></div></section><section id="timing" class="divider">${H.sectionLabel('Why These Dates', 'June 10–23 is the better route window', 'It protects home dates and exits the Riviera before Cannes Lions week.')}<div class="timing-compare"><div class="tcard best"><span class="tlabel">This plan</span><h4>Leave Nice June 16</h4><div class="trow"><b>Cannes Lions</b><span>Five days before Jun 21 opening</span></div><div class="trow"><b>PTO</b><span>8 if Jun 18 is observed</span></div><div class="trow"><b>Bloom</b><span>Early-edge; lake anchors the day</span></div></div><div class="tcard now"><span class="tlabel">One week later</span><h4>Higher friction, not guaranteed bloom perfection</h4><div class="trow"><b>Riviera</b><span>Event-week demand/traffic</span></div><div class="trow"><b>Heat</b><span>Greater inland risk</span></div><div class="trow"><b>Lavender</b><span>More likely, still year-dependent</span></div></div></div><div class="verdict-box"><b>Verdict:</b> keep the dates. Do not trade the hard home requirement and Riviera event avoidance for a photographic lavender promise.</div></section>`;

const budgetRows = [['Open-jaw airfare · PIT→NCE / MRS→PIT','$5,200–6,800'],['Lodging · 5 Nice / 3 Cassis / 4 Aix','$4,200–6,000'],['Riviera trains, buses + airport transfer','$150–250'],['One-way automatic rental · Jun 16–23','$650–950'],['Fuel, tolls + parking','$350–600'],['Food + groceries','$1,800–2,600'],['Activities / boats / admissions','$500–1,000'],['Insurance, eSIM + contingency','$500–900']];
const totalsTable = `<div class="budget-scroll"><table class="budget-tbl grand"><tr><th>Category</th><th>Family of 4</th></tr>${budgetRows.map(([label,value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('')}<tr class="total"><td>Grand Total</td><td>$13,350–19,100</td></tr></table></div>`;
const budgetTips = `<section id="budget" class="divider">${H.sectionLabel('Budget', '$13,350–19,100 for four', 'A bottom-up planning band in July 2026 dollars. Every 2027 fare, room and rental remains a re-quote.')} ${H.table(['Line item','Estimate · family of 4'],budgetRows)}<div class="twocol"><div class="listcard save-list"><h4>How the low case works</h4><ul><li>Air near $1,300 per traveler.</li><li>Apartment-style rooms with breakfast/groceries.</li><li>Public Riviera transit and beaches.</li><li>One short Calanques boat and selective paid sights.</li></ul></div><div class="listcard splurge-list"><h4>What breaks $15k</h4><ul><li>Open-jaw airfare above the proxy.</li><li>Central pool hotels in Nice/Cassis.</li><li>Automatic/one-way car scarcity.</li><li>Private beaches, tours and restaurant-heavy days.</li></ul></div></div></section><section id="totals" class="divider">${H.sectionLabel('Bottom Line', 'Preferred maximum is a pressure test, not an exclusion', 'This route can touch $15k, but it cannot honestly be promised under it.')} ${totalsTable}<p class="rate-note">Score implication: budget earns 1/5 because the realistic range extends materially above the $15k preference. That is a comparison penalty, not an automatic rejection.</p></section><section id="tips" class="divider">${H.sectionLabel('Booking Order', 'Solve the gates before the extras', 'Refundability matters more than small prepaid discounts.')}<div class="tips-order"><ol><li>Track open-jaw air and one-way automatic inventory<span> · when schedules load</span></li><li>Hold refundable pool/AC/parking lodging<span> · scarce family rooms first</span></li><li>Buy a protected June 23 return<span> · only inside the route budget</span></li><li>Re-shop car and reserve timed anchors<span> · 60–120 days out</span></li><li>Check bloom, fire, wind and heat<span> · days, not months, out</span></li></ol></div><div class="tips-grid">${H.tipcard('Price gate', 'Before nonrefundable purchases', [{ flag: 'Air + lodging above about $12k leaves too little room for the ground trip.' }, 'Compare one multi-city ticket against round-trip Europe plus protected positioning only if the latter remains operationally safe.'])}${H.tipcard('Route gate', 'Exact 2027 schedule', [{ flag: 'Reject any return that reaches Pittsburgh June 24.' }, 'Preserve a real MRS car-return/check-in buffer; do not use a heroic Aix departure.'])}</div></section>`;

const socialBalanceStatus = `<section id="social" class="divider">${H.sectionLabel('Field Notes', 'How to keep it family-sized', 'The day plan succeeds by leaving things out.')}<div class="tips-grid">${H.tipcard('Riviera', 'Transit spokes, not towns collected', ['Èze/Villefranche and Antibes are the headline excursions.', 'Menton, Monaco and Juan-les-Pins are substitutions when they solve weather/energy—not additions.'])}${H.tipcard('Cassis', 'Conditions outrank reservations', ['Calanques boat and land access can diverge under fire/wind rules.', 'The recovery day stays free until the forecast is real.'])}${H.tipcard('Provence', 'One long day at a time', ['Valensole succeeds through the lake even without peak bloom.', 'Avignon/Pont du Gard is followed only by the airport day—no Luberon checklist.'])}</div></section><section id="balance" class="divider">${H.sectionLabel('Trip Balance', 'What the days add up to', 'A coastal trip with enough town and nature structure to remain interesting.')}<div class="bar"><i style="width:40%;background:#1f6f78"></i><i style="width:35%;background:#c25a3a"></i><i style="width:25%;background:#3f7d4e"></i></div><div class="balance"><div class="bcard k1"><div class="pct">40%</div><h4>Water + recovery</h4><p>Villefranche, Antibes sand, Cap Ferrat, Cassis, Sainte-Croix and three pool buffers.</p></div><div class="bcard k2"><div class="pct">35%</div><h4>Towns + food</h4><p>Nice, Èze, Antibes, Cassis, Aix and Avignon without a village-counting contest.</p></div><div class="bcard k3"><div class="pct">25%</div><h4>Nature + history</h4><p>Calanques, Verdon/lavender, Cézanne country and Pont du Gard.</p></div></div></section><section id="status" class="divider">${H.sectionLabel('Decisions', 'Settled & still open')}<div class="status"><div class="scol settled"><h4>Settled</h4><div class="row"><b>Dates</b><span>Jun 10–23; home all day Jun 24–26.</span></div><div class="row"><b>Bases</b><span>5 Nice · 3 Cassis · 4 Aix.</span></div><div class="row"><b>Mode</b><span>No Riviera car; one-way car Nice→MRS.</span></div><div class="row"><b>Pace</b><span>Three recovery days; no village checklist.</span></div><div class="row"><b>Ranking</b><span>35/50; tied fifth among active trips if reinstated.</span></div></div><div class="scol open"><h4>Still open</h4><div class="row"><b>Air</b><span>Exact 2027 schedule/fare and one-ticket routing.</span></div><div class="row"><b>PTO</b><span>Confirm employer observes Juneteenth on Fri Jun 18; otherwise 9 days.</span></div><div class="row"><b>Budget</b><span>Air/lodging must approach low case to stay near $15k.</span></div><div class="row"><b>Family decision</b><span>Trip remains excluded until the prior decision is explicitly reversed.</span></div></div></div></section>`;

const preDepartureTodos = { labelHtml: '<p class="eyebrow">Pre-Departure To-Do</p><h2>Book in the order the risk demands</h2><p>Every 2027 schedule, fare and seasonal rule remains a planning gate until the relevant operator publishes it.</p>', blocks: [
  { when:'Now–Oct 2026', tone:'watch', title:'Track air, rooms and the automatic car', note:'Use refundable holds only.', items:['<b>Set multi-city alerts</b> for PIT→NCE and MRS→PIT returning Jun 23.','<b>Hold pool/AC lodging</b> in Nice, Cassis and Aix with Cassis/Aix parking confirmed.','<b>Confirm the employer holiday calendar</b> for Fri Jun 18.'] },
  { when:'When schedules are published', tone:'hot', title:'Prove the route', note:'No exact 2027 flight is assumed.', items:['<b>Reject any itinerary arriving PIT Jun 24.</b>','<b>Price a single protected multi-city ticket</b> and compare total journey time.','<b>Reserve a cancellable automatic</b> from Nice to MRS with the one-way fee visible.'] },
  { when:'60–120 days out', tone:'watch', title:'Reserve only the true anchors', items:['<b>Recheck and book</b> official Palais/Pont, Villa Ephrussi or other timed entries only if still wanted.','<b>Choose a cancellable Calanques boat</b> with a clear bad-weather policy.','<b>Review parking/ZFE requirements</b> for the exact rental and lodging.'] },
  { when:'Week of travel', tone:'hot', title:'Let conditions decide', items:['<b>Check official Calanques fire access daily.</b>','<b>Check Valensole bloom reports</b>; keep Lac de Sainte-Croix as the anchor.','<b>Move outdoor starts earlier</b> during heat and confirm beach/river flags.'] },
], callout: '<b>Booking permission:</b> only after a June 23 PIT return, a workable automatic car and the full air+lodging total fit the family’s chosen tolerance.' };

const scorecard = { displayName:'Southern France', blurb:'Riviera + Provence depth with real recovery, but a wide premium-price band', axes:{ budget:1, weather:4, swim:3, variety:5, ease:4, food:4, risk:3, nights:5, novelty:5, pto:3 }, weightDefaults:{ budget:2, weather:1, swim:1, variety:1, ease:1, food:1, risk:1, nights:1, novelty:1, pto:0 }, budget:{ floorUsd:13350, ceilUsd:19100, targetUsd:12000, preferredMaxUsd:15000 }, pto:{ days:8, nights:12 }, facets:{ continent:'europe', maxConnections:1, swimTempF:[68,72], noPassport:false, singleTicket:true, hasSwim:true }, totalBaked:35 };
H.assertBaked(scorecard);

const main = { recommended:true, excluded:'Excluded by family decision', slug, lang:'en', title:'Southern France · Riviera to Provence — June 2027', countries:['france-mainland'], packingTags:['beach','hiking','heat'], overrides:{ packing:['<b>Water shoes:</b> essential for Nice pebbles, Cassis rock and Pont du Gard river edges.','<b>Heat kit:</b> refillable bottles, hats, high-SPF sunscreen and a tiny shade umbrella.','<b>Car kit:</b> IDP/official translation, phone mount, offline maps and a soft-sided luggage plan for a European automatic.','<b>Motion kit:</b> for the Calanques boat and winding Verdon roads.'] }, hasPhotoGuide:false, hasFoodGuide:false, mapPoints, mapColors, itinerary:{ className:'divider', labelHtml:H.sectionLabel('Day by Day','The complete 12-night plan','Each high-output day is paired with a lower-output afternoon or following day. Conditions-dependent activities carry real exits.'), daysClass:'days', days }, parts:[
  { t:'raw', html:`${headBody}${heroLayoutFix}${H.preview({ kicker:'Pittsburgh family of 4 · kids 13 + 8 · June 2027', h1Main:'French Riviera', h1Sub:'+ Provence', lead:'Five car-free nights in Nice, three in Cassis and four in Aix—paced around sand, pools, the Calanques and Provence’s highest-value day trips.', stats:[['12','hotel nights'],['3','bases'],['$13.35k–19.1k','planning band'],['8','PTO if holiday observed']], split:[[40,'Water + recovery','water'],[35,'Towns + food','town'],[25,'Nature + history','nature']], images:photos.hero.map(([file,title,credit],i)=>[rel(file),['Nice arrival','Cap Ferrat','Calanques day','Verdon day'][i],title,['A car-free Riviera start.','A transit-accessible coast day.','Cassis earns three nights.','Lavender is conditional; Provence is not.'][i]]) })}${navToMain}${overview}${why}${stays}${calendar}` },
  { t:'itinerary' }, { t:'raw', html:mapAirGround }, { t:'entry' }, { t:'raw', html:healthTiming }, { t:'todo' }, { t:'raw', html:budgetTips }, { t:'packing' }, { t:'raw', html:socialBalanceStatus }, { t:'raw', html:H.mapScripts(T.parts[12].html,mapPoints,mapColors) },
], preDepartureTodos, scorecard };

fs.mkdirSync(outDir, { recursive:true });
fs.writeFileSync(path.join(outDir, 'main.json'), `${JSON.stringify(main, null, 2)}\n`);
console.log(`wrote src/_data/${slug}/main.json`);
