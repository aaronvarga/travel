#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const slug = process.argv[2];
if (!slug) {
  console.error('usage: node tools/refresh-from-catalog.mjs <slug>');
  process.exit(1);
}

const catalog = {
  CAS01: ['google_cascais_boca_01.jpg', 'https://cdn.indebergen.nl/media/kghffwxt/cascais_7.jpg?anchor=center&format=webp&height=608&mode=crop&quality=80&width=1080', 'https://www.hetisvakantie.nl/europa/portugal/costa-de-lisboa/cascais/', 'Cascais source page', 'Boca do Inferno sea arch with Atlantic water surging through the cliffs.', 'Boca do Inferno'],
  CAS02: ['google_cascais_boca_sunset_01.jpg', 'https://cdn.excursionmania.com/cdn-cgi/image/quality%3D75%2Cformat%3Dwebp%2Cw%3Dauto%2Ch%3Dauto%2Cfit%3Dscale-down%2Ctrim%3Dborder/uploads/blog/gallery/4083/17635581372.jpg', 'https://www.excursionmania.nl/ttd/4083/boca-do-inferno-blg4083', 'ExcursionMania', 'Sunset over Boca do Inferno cliffs and the Cascais coastal platform.', 'Cascais Cliffs'],
  CAS03: ['google_cascais_bay_aerial_01.jpg', 'https://live.staticflickr.com/65535/53040609876_2db1c645c5_b.jpg', 'https://www.flickr.com/photos/25228175@N08/53040609876/', 'Elvin', 'Santa Marta lighthouse and Cascais harbor at soft evening light.', 'Cascais Harbor'],
  CAS04: ['google_cascais_waterfront_01.jpg', null, 'https://www.visitcascais.com/', 'Visit Cascais', 'Cascais waterfront curving around calm blue Atlantic water.', 'Cascais Waterfront'],
  CAS05: ['google_cascais_rainha_aerial_01.jpg', null, 'https://depositphotos.com/editorial/people-sunbathing-on-the-praia-da-rainha-beach-in-cascais-portugal-cascais-is-famous-and-217975370.html', 'Brasilnut', 'Praia da Rainha tucked below Cascais rooftops and rocky shoreline.', 'Praia da Rainha'],
  SIN01: ['google_sintra_regaleira_well_01.jpg', 'https://tripswithrosie.com/wp-content/uploads/2022/12/Quinta-da-Regaleira9-Day-Trip-Sintra-from-Lisbon-1920x1280.jpeg', 'https://tripswithrosie.com/perfect-trip-to-sintra-from-lisbon/', 'Trips With Rosie', 'The spiral initiation well at Quinta da Regaleira wrapped in green stone.', 'Regaleira Well'],
  SIN02: ['google_sintra_pena_palace_01.jpg', 'https://live.staticflickr.com/65535/53268774542_7bb3c5f6e9_b.jpg', 'https://www.flickr.com/photos/time-to-look/53268774542', 'Ted McGrath', 'Quinta da Regaleira palace facade in Sintra under blue sky.', 'Regaleira Palace'],
  SIN03: ['google_sintra_adraga_coast_01.jpg', 'https://www.mibreit-photo.com/blog/photographing-portugal-azenhas-do-mar/images/Azenhas-do-Mar-Beach-1280.jpg', 'https://www.mibreit-photo.com/blog/photographing-portugal-azenhas-do-mar/', 'Michael Breitung', 'Atlantic beach and village cliffs on the Sintra coast near Azenhas do Mar.', 'Sintra Coast'],
  SIN04: ['google_quinta_regaleira_01.jpg', 'https://live.staticflickr.com/4217/34976378011_7657260fa3_b.jpg', 'https://www.flickr.com/photos/infomastern/34976378011/', 'Susanne Nilsson', 'Quinta da Regaleira palace and gardens in Sintra framed by greenery.', 'Regaleira'],
  LIS01: ['google_lisbon_tram28_alfama_01.jpg', 'https://images.squarespace-cdn.com/content/v1/587860113e00be246e9fa173/1564654719210-9CUN51Z5NE0UI6L5M6Y5/sunrise-miradouro-santa-luzia-portugal-lisbon-lisboa-view-bougainvillea-sea-view-ocean-coast.jpg', 'https://www.amaliabastos.com/blog/2019/9/28/miradouro-de-santa-luzia', 'Amalia Bastos Photography', 'Sunrise over Lisbon rooftops and the Tagus from Miradouro de Santa Luzia.', 'Santa Luzia Sunrise'],
  LIS02: ['google_lisbon_belem_tower_flickr_01.jpg', 'https://live.staticflickr.com/5695/22447126166_2db1545ed4_b.jpg', 'https://www.flickr.com/photos/giuseppemilo/22447126166/', 'Giuseppe Milo', 'Belem Tower reflected at sunset beside the Tagus.', 'Belem Tower'],
  LIS03: ['google_lisbon_jeronimos_01.jpg', null, 'https://www.jeronimosmonasterytickets.com/', 'Jeronimos Monastery Tickets', 'Jeronimos Monastery facade under a deep blue Lisbon sky.', 'Jeronimos'],
  ROC01: ['google_praia_ursa_sunset_01.jpg', 'https://image.jimcdn.com/app/cms/image/transf/dimension%3D443x10000%3Aformat%3Djpg/path/s2dc28d997a8a8bd1/image/if6f3213d33c7e094/version/1569270299/portugal-praia-da-ursa-sintra-langzeitbelichtung-2019-silly-photography.jpg', 'https://www.silly-photography.de/2019/09/23/mein-foto-september-2019/', 'Silly Photography', 'Long-exposure sunset over Praia da Ursa sea stacks.', 'Praia da Ursa'],
  ROC02: ['google_azenhas_do_mar_01.jpg', 'https://www.mibreit-photo.com/blog/photographing-portugal-azenhas-do-mar/images/Photographing-Azenhas-do-Mar-1280.jpg', 'https://www.mibreit-photo.com/blog/photographing-portugal-azenhas-do-mar/', 'Michael Breitung', 'Azenhas do Mar village perched above its Atlantic tidal pool.', 'Azenhas do Mar'],
  ROC03: ['google_cabo_roca_coast_01.jpg', 'https://cdn-imgix.headout.com/media/images/dacfc072c43c502c4e85e5852c8c63f3-viewofdangerouscliffandCapeRocalighthouseCabodaRocaredandwhitelighthouseatEuropewesternedge.Portugal.jpg', 'https://www.tickets-lisbon.com/cabo-da-roca-from-lisbon/', 'Tickets Lisbon', 'Cliffs and ocean light along the Cabo da Roca coast.', 'Cabo da Roca'],
  CST01: ['google_guincho_beach_01.jpg', null, 'https://thevillaagency.co.uk/the-best-beaches-on-the-lisbon-coast/', 'The Villa Agency', 'Praia do Guincho with broad sand, surf, and Atlantic blue water.', 'Guincho Beach'],
  CST02: ['google_praia_rainha_01.jpg', 'https://tripswithrosie.com/wp-content/uploads/2022/12/Cabo-da-Roca3-Day-Trip-Sintra-from-Lisbon-1920x1280.jpeg', 'https://tripswithrosie.com/perfect-trip-to-sintra-from-lisbon/', 'Trips With Rosie', 'Cabo da Roca cliffs dropping into the Atlantic in clear coastal light.', 'Cabo da Roca Cliffs'],
  CST03: ['google_cascais_tide_pools_01.jpg', 'https://bikerist.com/api/static/uploads/Pisao-Guincho_Loop.webp', 'https://bikerist.com/tours/pisao-guincho', 'Bikerist', 'The wild Pisao-Guincho coastal route with Atlantic cliffs and open sky.', 'Guincho Coast'],
  CEF01: ['google_cefalu_larocca_beach_01.jpg', 'https://live.staticflickr.com/5128/5319602441_a16197e56b_b.jpg', 'https://www.flickr.com/photos/damianogiuliano/5319602441', 'Damiano Giuliano', 'Cefalu old town and beach at the foot of La Rocca.', 'Cefalu Beach'],
  CEF02: ['google_cefalu_aerial_01.jpg', null, 'https://www.alpitour.it/racconti/cosa-vedere-in-sicilia-occidentale', 'Alpitour', 'Aerial view of Cefalu rooftops, harbor, and turquoise water.', 'Cefalu Aerial'],
  CEF03: ['google_cefalu_waterfront_01.jpg', null, 'https://expertoitaly.com/cefalu-sicilian-magic-sea-charm/', 'Experto Italy', 'Cefalu beach backed by medieval waterfront houses.', 'Waterfront Beach'],
  CEF04: ['google_cefalu_dusk_flickr_01.jpg', null, 'https://www.flickr.com/photos/sinava/53287368479', 'Naval S', 'Cefalu waterfront and La Rocca at dusk from the sea.', 'Cefalu Dusk'],
  CEF05: ['google_cefalu_rocca_trail_01.jpg', null, 'https://www.bucketlistly.blog/posts/best-things-to-do-in-cefalu', 'BucketListly Blog', 'The Rocca trail looking down over Cefalu and the Tyrrhenian coast.', 'Rocca Trail'],
  CEF06: ['google_cefalu_old_town_lane_01.jpg', null, 'https://www.flickr.com/photos/188254111%40N04/51018369615/', 'M. Escalante', 'Narrow Cefalu old town lane with balconies and La Rocca beyond.', 'Old Town Lane'],
  PAL01: ['google_palermo_aerial_dawn_01.jpg', null, 'https://101-zone.com/2024/12/23/palermo-dallalto-unalba-di-luci-e-storia/', 'Antonino Bartuccio', 'Palermo Cathedral and city rooftops glowing at dawn.', 'Palermo Dawn'],
  PAL02: ['google_palermo_cathedral_01.jpg', null, 'https://www.earthtrekkers.com/palermo/', 'Earth Trekkers', 'Palermo Cathedral facade in warm Sicilian sunlight.', 'Palermo Cathedral'],
  PAL03: ['google_mondello_sunset_01.jpg', 'https://live.staticflickr.com/834/42507674524_55a182fd73_b.jpg', 'https://www.flickr.com/photos/26034413%40N04/42507674524', 'Tan Yilmaz', 'Mondello beach and Palermo hills under a dramatic sunset sky.', 'Mondello Sunset'],
  PAL04: ['google_monreale_cloister_01.jpg', null, 'https://www.klook.com/en-AU/activity/180926-monreale-majesty-cefal-coast-mondello-private-tour-from-palermo/', 'Klook', 'Monreale Cathedral cloister and tower under a blue sky.', 'Monreale'],
  TAO01: ['google_taormina_isola_bella_01.jpg', 'https://101-zone.com/wp-content/uploads/2025/05/Isola-Bella-Taormina-Sicilia-.jpg', 'https://101-zone.com/2025/05/05/isola-bella-taormina-la-perla-dello-ionio-tra-bellezza-naturale-e-storia/', 'Antonino Bartuccio', 'Isola Bella and Mazzaro Bay in clear turquoise water.', 'Isola Bella'],
  TAO02: ['google_taormina_mazzaro_01.jpg', 'https://celebratedexperiences.com/app/uploads/2019/01/Baia-di-Mazzaro.jpg', 'https://celebratedexperiences.com/hotels/voi-grand-hotel-mazzaro-sea-palace/', 'Celebrated Experiences', 'Mazzaro Bay and Isola Bella from above in clear Ionian blue water.', 'Mazzaro Bay'],
  TAO03: ['google_isola_bella_kayak_01.jpg', 'https://katania.pl/wp-content/uploads/2025/02/aerial-view-of-isola-bella-drone-panoramic-view-isola-bella-_shutterstock_2325565443.jpg', 'https://katania.pl/isola-bella-taormina-zwiedzanie-atrakcje-plazowanie/', 'Katania.pl', 'Aerial view of Isola Bella and Taormina coves in bright Ionian water.', 'Isola Bella Aerial'],
  TAO04: ['google_taormina_coast_01.jpg', 'https://www.countryclubuk.com/wp-content/uploads/2023/04/GHT-EXT-VIEW-05.jpg', 'https://www.countryclubuk.com/belmond-grand-hotel-timeo-belmond-taormina-sicily-best-rates/', 'CountryClubuk', 'Taormina coast sweeping toward Mount Etna above the Ionian Sea.', 'Taormina and Etna'],
  TAO05: ['google_taormina_viewpoint_01.jpg', 'https://live.staticflickr.com/4709/38761489730_a31c52c2c7_b.jpg', 'https://www.flickr.com/photos/nmacheda/38761489730/', 'Natalia Macheda', 'Taormina rooftops and coastline seen from above with Etna in the distance.', 'Taormina View'],
  TAO06: ['google_mazzaro_evening_01.jpg', null, 'https://www.flickr.com/photos/195200337%40N06/52425283894', 'Graham Heywood', 'Mazzaro Bay lights reflecting on calm evening water.', 'Mazzaro Evening'],
  ETN01: ['google_etna_south_crater_01.jpg', 'https://etnalava.it/wp-content/uploads/2024/12/crater-2001-etna-sud-rifugio-sapienza-2600m-scaled.jpg', 'https://etnalava.it/en/excursion/etna-south-by-cable-car-and-trek-up-to-3000m/', 'Etna Lava', 'Red and black volcanic craters on Etna south slope.', 'Etna Crater'],
  ETN02: ['google_etna_volcanic_trail_01.jpg', 'https://www.go-etna.com/wp-content/uploads/2022/04/Etna-Excursion-08.jpg', 'https://www.go-etna.com/excursions/jeep-excursion-to-mount-etna/', 'Go-Etna', 'Ash road and volcanic cones on Mount Etna beneath a blue sky.', 'Volcanic Trail'],
  ETN03: ['google_etna_sunset_photo_tour_01.jpg', null, 'https://www.tiowo.com/escursioni-sicilia/escursione-etna-al-tramonto-tour-fotografico', 'Giancarlo Tine', 'Mount Etna lava fields and pine forest in golden-hour light.', 'Etna Sunset'],
  ETN04: ['google_etna_funivia_south_01.jpg', 'https://etnalava.it/wp-content/uploads/2024/12/funivia-etna-sud-crateri-silvestri-scaled.jpg', 'https://etnalava.it/en/excursion/etna-south-by-cable-car-and-trek-up-to-3000m/', 'Etna Lava', 'Etna south cable car area with craters and volcanic slopes.', 'Etna Funivia'],
  CHN01: ['google_chania_harbor_aerial_01.jpg', 'https://live.staticflickr.com/65535/48715932641_480de8714a_b.jpg', 'https://www.flickr.com/photos/anshar73/48715932641/', 'Andrey Omelyanchuk', 'Chania Venetian Harbour and lighthouse glowing at sunset.', 'Chania Harbour'],
  CHN02: ['google_chania_harbor_flickr_01.jpg', 'https://live.staticflickr.com/65535/52523118708_db239e147f_b.jpg', 'https://www.flickr.com/photos/111267343%40N05/52523118708/in/photostream/', 'Nektarios Karefyllakis', 'Chania old Venetian harbor promenade after rain.', 'Old Harbor'],
  CHN03: ['google_nea_chora_beach_01.jpg', null, 'https://www.thehotel.gr/info/en/crete/chania/what-to-see/nea-chora', 'TheHotel.gr', 'Nea Chora beach with blue umbrellas and calm water near Chania.', 'Nea Chora'],
  CHN04: ['google_agii_apostoli_coast_01.jpg', null, 'https://www.chaniatourism.gr/beach/agii-apostoloi/', 'Chania Tourism', 'Agii Apostoli chapel islet and sheltered Chania beaches.', 'Agii Apostoli'],
  AKR01: ['google_seitan_limania_aerial_01.jpg', null, 'https://depositphotos.com/photo/aerial-top-view-drone-beach-seitan-limania-bay-turquoise-water-588861780.html', 'Paopano', 'Seitan Limania cove with turquoise water between steep cliffs.', 'Seitan Limania'],
  AKR02: ['google_stavros_beach_aerial_01.jpg', null, 'https://triptocrete.com/stavros-beach-zorbas-beach-in-chania-crete/', 'TripToCrete', 'Stavros Beach lagoon beneath the Akrotiri mountain backdrop.', 'Stavros Beach'],
  AKR03: ['google_seitan_limania_canyon_01.jpg', null, 'https://www.artofit.org/image-gallery/548102217165521611/seitan-limania-beach-stefanou-chania/', 'Artofit', 'High view down the narrow Seitan Limania inlet to bright blue water.', 'Canyon Cove'],
  BAL01: ['google_balos_lagoon_01.jpg', 'https://mediafiles.reiseuhu.de/wp-content/uploads/2020/05/bucht-von-balos-kreta.jpg', 'https://www.reiseuhu.de/urlaub/griechenland/kreta/', 'reiseuhu.de', 'Balos Lagoon with shallow turquoise water and white sand.', 'Balos Lagoon'],
  BAL02: ['google_balos_discover_greece_01.jpg', null, 'https://www.discovergreece.com/crete/beaches/balos', 'Discover Greece', 'Balos Lagoon and Gramvousa coastline in clear summer light.', 'Gramvousa Coast'],
  BAL03: ['google_balos_west_crete_01.jpg', null, 'https://www.west-crete.com/balos-photos.htm', 'West Crete', 'Balos lagoon shallows and rocky headland from the trail overlook.', 'Balos Overlook'],
  ELA01: ['google_elafonissi_pink_sand_01.jpg', 'https://mediafiles.reiseuhu.de/wp-content/uploads/2019/07/elafonisi.jpg', 'https://www.reiseuhu.de/urlaub/griechenland/kreta/', 'reiseuhu.de', 'Elafonissi pink sand and clear turquoise shallows.', 'Elafonissi'],
  ELA02: ['google_falasarna_sunset_01.jpg', null, 'https://www.getyourguide.com/kissamos-l1840/chania-falasarna-beach-day-trip-with-hotel-pickup-t723718/', 'GetYourGuide', 'Falasarna beach at sunset with rocks and soft water.', 'Falasarna'],
  ELA03: ['google_elafonisi_sunset_aerial_01.jpg', null, 'https://www.tourhq.com/tours/50605/8-hour-elafonisi-beach-and-milia-mountain-retreat-jeep-tour-with-lunch', 'TourHQ', 'Aerial sunset over Elafonisi sandbars and lagoon.', 'Elafonisi Aerial'],
  IMB01: ['google_imbros_gorge_01.jpg', null, 'https://www.west-crete.com/imbros-gorge.htm', 'West Crete', 'Shaded stone passage through Imbros Gorge.', 'Imbros Gorge'],
  IMB02: ['google_imbros_gorge_trail_02.jpg', null, 'https://www.west-crete.com/imbros-gorge.htm', 'West Crete', 'Rocky Imbros Gorge trail descending through narrow walls.', 'Gorge Trail'],
  IMB03: ['google_imbros_gorge_lower_03.jpg', null, 'https://www.west-crete.com/imbros-gorge.htm', 'West Crete', 'Lower Imbros Gorge with limestone walls and a stony walking path.', 'Lower Gorge'],
  SAM01: ['google_samaria_gorge_vista_01.jpg', null, 'https://www.discovergreece.com/fr/activities-tours/unique-private-tour-samaria-gorge', 'Discover Greece', 'Samaria Gorge valley and White Mountains framed by old trees.', 'Samaria Vista'],
  SAM02: ['google_samaria_cliffs_01.jpg', null, 'https://www.kreta.com/en/booking-excursion-sightseeing/hiking-samaria-gorge.html', 'Kreta.com', 'Tall limestone cliffs and pine forest inside Samaria Gorge.', 'Samaria Cliffs'],
  SAM03: ['google_samaria_xyloskalo_01.jpg', null, 'https://samaria-tickets.necca.gov.gr/', 'NECCA', 'Samaria Gorge trailhead descending from the White Mountains.', 'Xyloskalo'],
  LEF01: ['google_lefka_ori_panorama_01.jpg', null, 'https://www.mountain-forecast.com/peaks/Lefka-Ori', 'Mountain Forecast', 'Rocky Lefka Ori ridges under a clear blue sky.', 'Lefka Ori'],
  LEF02: ['google_omalos_plateau_01.jpg', null, 'https://www.west-crete.com/omalos.htm', 'West Crete', 'Omalos plateau surrounded by the White Mountains.', 'Omalos Plateau'],
  LEF03: ['google_white_mountains_crete_01.jpg', null, 'https://www.discovergreece.com/crete/nature/white-mountains', 'Discover Greece', 'White Mountains ridges and high-country Crete landscape.', 'White Mountains'],
  RET01: ['google_rethymno_fortezza_aerial_01.jpg', null, 'https://pikabu.ru/story/video_i_foto_polyota_na_drone_u_kreposti_v_gretimno_okrit_7989394', 'DenysFromCrete', 'Drone view of Rethymno Fortezza on its rocky headland.', 'Fortezza Aerial'],
  RET02: ['google_rethymno_fortezza_sunset_01.jpg', null, 'https://www.akinitastinkriti.gr/blogPost?id=7', 'Akinitastinkriti.gr', 'Rethymno Fortezza and old town glowing at sunset.', 'Fortezza Sunset'],
  RET03: ['google_rethymno_old_town_01.jpg', null, 'https://www.greece.com/photos/destinations/Crete/Rethymno/Town/Rethymnon/The_old_town%2C_Rethymno/73412185', 'scoand', 'Rethymno old town lane shaded by flowering bougainvillea.', 'Old Town'],
  RET04: ['google_rethymno_beach_01.jpg', null, 'https://www.visitgreece.gr/islands/crete/rethymno/', 'Visit Greece', 'Rethymno beach and town waterfront along the north Crete coast.', 'Rethymno Beach'],
  PRE01: ['google_preveli_palm_beach_01.jpg', 'https://mediafiles.reiseuhu.de/wp-content/uploads/2021/04/griechenland-kreta-preveli-beach.jpeg', 'https://www.reiseuhu.de/urlaub/griechenland/kreta/', 'reiseuhu.de', 'Preveli palm river meeting the Libyan Sea below cliffs.', 'Preveli Beach'],
  PRE02: ['google_preveli_palm_lagoon_01.jpg', null, 'https://mysticalcretetours.gr/pl/tour/wycieczka-plaza-palmowa-preveli/', 'Mystical Crete Tours', 'Preveli palm grove and beach lagoon in soft coastal light.', 'Palm Lagoon'],
  PRE03: ['google_preveli_kourtaliotiko_01.jpg', null, 'https://www.haytourscrete.com/tour/matala-hippies-beach-2/', 'Hay Tours Crete', 'Turquoise Preveli river flowing from Kourtaliotiko Gorge to the beach.', 'Preveli River'],
  PLK01: ['google_plaka_alley_01.jpg', null, 'https://www.expedia.com/Athens-Plaka.dx6051640', 'Expedia', 'Plaka alley with bougainvillea, cafe tables, and old Athens facades.', 'Plaka Alley'],
  PLK02: ['google_plaka_dining_01.jpg', null, 'https://www.workingjoetravel.com/single-post/things-to-do-in-athens-greece-plaka-district', 'Working Joe Travel', 'Sunny Plaka pedestrian street lined with tavernas and umbrellas.', 'Plaka Dining'],
  PLK03: ['google_plaka_anafiotika_steps_01.jpg', null, 'https://www.flickr.com/photos/bkopp/54164230878/', 'kopperlben', 'Anafiotika steps and whitewashed walls in Athens Plaka.', 'Anafiotika'],
  ACR01: ['google_acropolis_panorama_01.jpg', null, 'https://depositphotos.com/photo/athens-greece-monastiraki-square-aerial-panoramic-view-city-acropolis-rock-464747858.html', 'gioiak2', 'The Acropolis and Parthenon above Athens from a green hillside.', 'Acropolis'],
  ACR02: ['google_acropolis_museum_exterior_01.jpg', null, 'https://www.thetraveler.org/athens-museums-guide-acropolis-museum-national-museum-more/', 'The Traveler', 'Acropolis Museum glowing below the Parthenon at evening.', 'Museum Exterior'],
  ACR03: ['google_acropolis_museum_gallery_01.jpg', null, 'https://www.discovergreece.com/experiences/acropolis-museum-athens', 'Discover Greece', 'Caryatids and sculpture galleries inside the Acropolis Museum.', 'Museum Gallery'],
  NOT01: ['google_noto_cathedral_01.jpg', null, 'https://www.visitsicily.info/en/noto-the-sicilian-baroque/', 'Visit Sicily', 'Noto cathedral and golden Baroque facades under blue sky.', 'Noto Cathedral'],
  NOT02: ['google_fontane_bianche_aerial_01.jpg', null, 'https://www.sicilytourist.com/blog/?localita-balneari-in-sicilia---fontane-bianche---siracusa', 'SicilyTourist.com', 'Fontane Bianche beach village and turquoise Ionian water from above.', 'Fontane Bianche'],
  NOT03: ['google_fontane_bianche_shore_01.jpg', null, 'https://cosavedere.valdinoto.it/luoghi/fontane-bianche/', 'Val di Noto', 'Clear Fontane Bianche water with rocks and white sand.', 'White Springs'],
  NOT04: ['google_noto_baroque_dusk_01.jpg', null, 'https://homeortigia.com/en/citta-del-barocco.html', 'Home Ortigia', 'Noto Baroque buildings glowing at dusk.', 'Noto Dusk'],
  ORT01: ['google_ortigia_waterfront_01.jpg', null, 'https://www.pixtury.com/photos/micheleponzio/34779', 'Michele Ponzio', 'Ortigia waterfront with pale buildings and transparent turquoise water.', 'Ortigia Waterfront'],
  ORT02: ['google_ortigia_shore_01.jpg', null, 'https://www.unaitalianhospitality.com/it/idee-ed-esperienze/articoli/siracusa-ortigia-itinerario', 'UNA Italian Hospitality', 'Pastel Ortigia buildings above rocks and clear blue water.', 'Ortigia Shore'],
  ORT03: ['google_ortigia_aerial_01.jpg', null, 'https://www.algila.it/gallery?lang=en', 'Algila Ortigia Charme Hotel', 'Aerial view of Ortigia sea walls and rocky shoreline.', 'Ortigia Aerial'],
  ORT04: ['google_ortigia_golden_waterfront_01.jpg', null, 'https://www.palazzoceramisicilia.com/dintorni/', 'Palazzo Cerami', 'Golden Ortigia waterfront buildings over crystalline Ionian water.', 'Golden Waterfront'],
  AGR01: ['google_valley_temples_columns_01.jpg', null, 'https://www.archetravel.com/blog/visita-valle-dei-templi-agrigento-sicilia/', 'Arche Travel', 'Ancient Doric columns at Agrigento Valley of the Temples.', 'Temple Columns'],
  AGR02: ['google_valley_temples_concordia_01.jpg', null, 'https://www.visitsicily.info/en/valley-of-the-temples/', 'Visit Sicily', 'Temple of Concordia standing among olive trees and golden stone.', 'Concordia'],
  AGR03: ['google_agrigento_ruins_01.jpg', null, 'https://www.discovergreece.com/italy/sicily/valley-of-the-temples', 'Discover Greece', 'Valley of the Temples ruins under a clear Mediterranean sky.', 'Agrigento Ruins'],
  AGR04: ['google_valley_temples_sunset_01.jpg', null, 'https://www.locationscout.net/italy/11314-valley-of-the-temples', 'Locationscout', 'Temple ridge at Agrigento lit by low evening sun.', 'Temple Sunset'],
  VAL01: ['google_valletta_harbor_dusk_01.jpg', null, 'https://timesofmalta.com/article/national-photography-competition-launched.897574', 'Mark Scicluna', 'Valletta skyline across calm harbor water and limestone tide pools.', 'Valletta Harbor'],
  VAL02: ['google_valletta_old_street_01.jpg', null, 'https://www.maltainfoguide.com/photos-of-malta-valletta.html', 'Malta Info Guide', 'Valletta old town street dropping toward the harbor between balconies.', 'Valletta Street'],
  VAL03: ['google_valletta_waterfront_dawn_01.jpg', null, 'https://www.maltainfoguide.com/photos-of-malta-valletta.html', 'Malta Info Guide', 'Valletta ramparts and waterfront under morning clouds.', 'Waterfront Dawn'],
  VAL04: ['google_valletta_skyline_01.jpg', null, 'https://www.maltainfoguide.com/photos-of-malta-valletta.html', 'Malta Info Guide', 'Valletta limestone skyline with domes, spires, and harbor light.', 'Valletta Skyline'],
  COM01: ['google_comino_blue_lagoon_01.jpg', 'https://i0.wp.com/www.voyagesbernard.fr/wp-content/uploads/AdobeStock_272377176-scaled.jpeg?fit=1400%2C1049&ssl=1', 'https://www.voyagesbernard.fr/voyages-decouvrez-dautres-horizon-avec-les-voyages-bernard.html/attachment/panorama-beach-blue-lagoon-comino-malta-aerial-view', 'Voyages Bernard', 'Blue Lagoon Comino with shallow crystal water and pale sand.', 'Blue Lagoon'],
  COM02: ['google_blue_lagoon_rocks_01.jpg', null, 'https://www.fotocommunity.com/photo/blue-lagoon-comino-malta-janusz-wa/34164765', 'Janusz Wa', 'Comino Blue Lagoon turquoise water around limestone rock shelves.', 'Lagoon Rocks'],
  COM03: ['google_comino_lagoon_aerial_01.jpg', null, 'https://www.visitmalta.com/en/a/blue-lagoon/', 'Visit Malta', 'Blue Lagoon and Comino coves seen from above.', 'Comino Aerial'],
  COM04: ['google_comino_cove_01.jpg', null, 'https://www.maltainfoguide.com/blue-lagoon-malta.html', 'Malta Info Guide', 'Comino cove with clear blue water and limestone cliffs.', 'Comino Cove'],
  GOZ01: ['google_gozo_seascape_01.jpg', null, 'https://35photo.pro/sebastianplonka/photo_6391578/', 'Sebastian Plonka', 'Gozo coastline in long-exposure light beneath dramatic clouds.', 'Gozo Seascape'],
  GOZ02: ['google_gozo_salt_pans_sunset_01.jpg', 'https://www.horyzonty.pl/_pliki_/wiadomosci/a-wybrzeze-malty-1760343789.jpg', 'https://www.horyzonty.pl/fotowyprawy/malta-fotorelacja-z-wyprawy/', 'Slawomir Adamczak', 'Gozo salt pans reflecting sunset beside the sea.', 'Salt Pans'],
  GOZ03: ['google_gozo_ramla_bay_01.jpg', null, 'https://www.tapeciarnia.pl/edycja%2C344636', 'Tapeciarnia', 'Ramla Bay golden beach and green Gozo hills from above.', 'Ramla Bay'],
  GOZ04: ['google_gozo_cliffs_daytrip_01.jpg', null, 'https://www.aaa.com/tripcanvas/thing-to-do/full-day-private-best-of-gozo-island-tour-from-malta-14003P2', 'AAA Trip Canvas', 'Gozo limestone cliffs and coastal rock formations on a day trip route.', 'Gozo Cliffs']
};

const maps = {
  'portugal-sicily': {
    c1: ['CAS01', 'CAS02', 'CAS03'],
    c2: ['SIN01', 'SIN02', 'SIN03'],
    c3b: ['LIS01', 'LIS02', 'LIS03'],
    c4b: ['ROC01', 'ROC02', 'ROC03'],
    c5b: ['CST01', 'CST02', 'CST03'],
    c3: ['CEF01', 'CEF02', 'CEF03'],
    c4: ['CEF02', 'CEF04', 'CEF05'],
    c5: ['PAL01', 'PAL02', 'PAL03'],
    c10: ['TAO01', 'TAO02', 'TAO03'],
    c11: ['ETN01', 'ETN02', 'ETN03'],
    c11b: ['TAO04', 'TAO05', 'TAO06'],
    c12: ['TAO01', 'TAO03', 'TAO05']
  },
  'portugal-crete': {
    c1: ['CAS01', 'CAS02', 'CAS03'],
    c2: ['SIN01', 'SIN02', 'SIN04'],
    c3: ['CHN01', 'CHN02', 'CHN03'],
    c3b: ['AKR01', 'AKR02', 'AKR03'],
    c4: ['CHN02', 'CHN03', 'CHN04'],
    c5: ['BAL01', 'BAL02', 'BAL03'],
    c6: ['ELA01', 'ELA02', 'ELA03'],
    c7: ['IMB01', 'IMB02', 'PRE03'],
    c13: ['SAM01', 'SAM02', 'SAM03'],
    c14: ['LEF01', 'LEF02', 'LEF03'],
    c10: ['RET01', 'RET02', 'RET03'],
    c11: ['PRE01', 'PRE02', 'PRE03'],
    c12: ['RET02', 'RET03', 'RET04']
  },
  'greece-via-lisbon': {
    c1: ['CAS03', 'CAS04', 'CAS05'],
    c2: ['LIS02', 'LIS03', 'ROC03'],
    c3: ['PLK01', 'PLK02', 'PLK03'],
    c4: ['ACR01', 'ACR02', 'ACR03'],
    c6: ['CHN01', 'CHN02', 'CHN04'],
    c7: ['BAL01', 'BAL02', 'BAL03'],
    c8: ['IMB01', 'IMB02', 'IMB03'],
    c9: ['ELA01', 'ELA02', 'ELA03'],
    c12: ['SAM01', 'SAM02', 'SAM03'],
    c13: ['LEF01', 'LEF02', 'LEF03'],
    c10: ['RET01', 'RET02', 'RET04'],
    c11: ['RET03', 'CHN03', 'CST02']
  },
  'sicily-malta': {
    c1: ['CEF01', 'CEF02', 'CEF03', 'CEF04'],
    c2: ['CEF02', 'CEF04', 'CEF05', 'CEF06'],
    c3: ['PAL01', 'PAL02', 'PAL03', 'PAL04'],
    c4: ['TAO01', 'TAO02', 'TAO03', 'TAO04'],
    c5: ['ETN01', 'ETN02', 'ETN03', 'ETN04'],
    c6: ['TAO03', 'TAO04', 'TAO05', 'TAO06'],
    c7: ['NOT01', 'NOT02', 'NOT03', 'NOT04'],
    c8: ['ORT01', 'ORT02', 'ORT03', 'ORT04'],
    c9: ['ORT02', 'ORT03', 'ORT04', 'ORT01'],
    c10: ['AGR01', 'AGR02', 'AGR03', 'AGR04'],
    c11: ['VAL01', 'VAL02', 'VAL03', 'VAL04'],
    c12: ['COM01', 'COM02', 'COM03', 'COM04'],
    c13: ['GOZ01', 'GOZ02', 'GOZ03', 'GOZ04']
  }
};

const map = maps[slug];
if (!map) {
  console.error(`No catalog map for ${slug}`);
  process.exit(1);
}

const dir = join('assets', 'img', slug);
mkdirSync(dir, { recursive: true });
mkdirSync(join('/tmp', 'pics', slug), { recursive: true });

const htmlCache = new Map();
const absUrl = (src, base) => new URL(src.replaceAll('&amp;', '&'), base).toString();

function fetchText(url) {
  if (!htmlCache.has(url)) {
    htmlCache.set(url, execFileSync('curl', ['-L', '-A', 'Mozilla/5.0', '--max-time', '30', url], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 }));
  }
  return htmlCache.get(url);
}

function extractImage(sourcePage) {
  const html = fetchText(sourcePage);
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    /"contentUrl"\s*:\s*"([^"]+)"/i,
    /"image"\s*:\s*"([^"]+)"/i,
    /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["'][^>]*>/i
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return absUrl(m[1], sourcePage);
  }
  throw new Error(`no image found in ${sourcePage}`);
}

const used = new Map();
const failed = [];
const plan = { carousels: {}, htmlReplacements: {}, indexCard: null };

for (const [cid, keys] of Object.entries(map)) {
  plan.carousels[cid] = [];
  for (const key of keys) {
    const row = catalog[key];
    if (!row) throw new Error(`Missing catalog key ${key}`);
    let [baseFile, imageUrl, sourcePage, credit, alt, captionTitle] = row;
    const count = (used.get(baseFile) || 0) + 1;
    used.set(baseFile, count);
    const file = count === 1 ? baseFile : baseFile.replace(/\.jpg$/i, `_${count}.jpg`);
    const out = join(dir, file);
    try {
      const resolved = imageUrl || extractImage(sourcePage);
      const tmp = `${out}.download`;
      execFileSync('curl', ['-L', '-A', 'Mozilla/5.0', '--max-time', '45', '-o', tmp, resolved], { stdio: 'ignore' });
      const kind = execFileSync('file', ['-b', tmp], { encoding: 'utf8' });
      const size = Number(execFileSync('stat', ['-f', '%z', tmp], { encoding: 'utf8' }).trim());
      if (!/image|JPEG|PNG|WebP/i.test(kind) || size < 10000) throw new Error(`${kind.trim()} ${size} bytes`);
      execFileSync('magick', [tmp, '-auto-orient', '-resize', '1800x1200>', '-quality', '86', out], { stdio: 'ignore' });
      plan.carousels[cid].push({
        file,
        alt,
        captionTitle,
        credit: `${credit} · Google Images source`,
        sourcePage,
        discoveredVia: 'Google Images'
      });
    } catch (err) {
      failed.push({ cid, key, file, sourcePage, error: err.message });
    }
  }
}

const first = Object.values(plan.carousels)[0]?.[0];
if (first) plan.indexCard = { file: first.file, alt: first.alt };

writeFileSync(join(dir, '_photo-plan.json'), JSON.stringify(plan, null, 2) + '\n');
if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exit(1);
}

console.log(`Wrote ${join(dir, '_photo-plan.json')}`);
