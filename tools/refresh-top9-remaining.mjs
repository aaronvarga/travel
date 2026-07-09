#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const slug = process.argv[2];
if (!slug) {
  console.error('usage: node tools/refresh-top9-remaining.mjs <slug>');
  process.exit(1);
}

const q = (value) => encodeURIComponent(value).replace(/%20/g, '_');
const commons = (file, out, credit, alt, captionTitle) => [
  out,
  `https://commons.wikimedia.org/wiki/Special:FilePath/${q(file)}?width=2400`,
  `https://commons.wikimedia.org/wiki/File:${q(file)}`,
  credit,
  alt,
  captionTitle
];

const row = (out, imageUrl, sourcePage, credit, alt, captionTitle) => [
  out,
  imageUrl,
  sourcePage,
  credit,
  alt,
  captionTitle
];

const catalog = {
  CAS01: row('google_cascais_boca_01.jpg', 'https://cdn.indebergen.nl/media/kghffwxt/cascais_7.jpg?anchor=center&format=webp&height=608&mode=crop&quality=80&width=1080', 'https://www.hetisvakantie.nl/europa/portugal/costa-de-lisboa/cascais/', 'Het is Vakantie', 'Boca do Inferno sea arch and Cascais cliffs in bright Atlantic light.', 'Cascais Cliffs'),
  CAS02: row('google_cascais_boca_sunset_02.jpg', 'https://cdn.excursionmania.com/cdn-cgi/image/quality%3D75%2Cformat%3Dwebp%2Cw%3Dauto%2Ch%3Dauto%2Cfit%3Dscale-down%2Ctrim%3Dborder/uploads/blog/gallery/4083/17635581372.jpg', 'https://www.excursionmania.nl/ttd/4083/boca-do-inferno-blg4083', 'ExcursionMania', 'Sunset over Boca do Inferno and the Cascais coastal platform.', 'Boca Sunset'),
  CAS03: row('google_cascais_bay_03.jpg', 'https://live.staticflickr.com/65535/53040609876_2db1c645c5_b.jpg', 'https://www.flickr.com/photos/25228175@N08/53040609876/', 'Elvin', 'Cascais harbor and Santa Marta lighthouse in evening color.', 'Cascais Harbor'),
  CAS04: commons('Cascais_October_2014-2a.jpg', 'google_cascais_waterfront_04.jpg', 'Carole Raddato', 'Cascais waterfront with beach and town buildings above blue water.', 'Cascais Waterfront'),
  SIN01: row('google_sintra_regaleira_well_01.jpg', 'https://tripswithrosie.com/wp-content/uploads/2022/12/Quinta-da-Regaleira9-Day-Trip-Sintra-from-Lisbon-1920x1280.jpeg', 'https://tripswithrosie.com/perfect-trip-to-sintra-from-lisbon/', 'Trips With Rosie', 'Quinta da Regaleira initiation well framed by mossy stone.', 'Regaleira Well'),
  SIN02: commons('Quinta_da_Regaleira_-_Sintra_-_Portugal_(53268774542).jpg', 'google_sintra_regaleira_palace_02.jpg', 'Ted McGrath', 'Quinta da Regaleira palace facade in Sintra.', 'Regaleira Palace'),
  SIN03: row('google_sintra_coast_03.jpg', 'https://www.mibreit-photo.com/blog/photographing-portugal-azenhas-do-mar/images/Azenhas-do-Mar-Beach-1280.jpg', 'https://www.mibreit-photo.com/blog/photographing-portugal-azenhas-do-mar/', 'Michael Breitung', 'Atlantic beach and coastal cliffs near Azenhas do Mar.', 'Sintra Coast'),
  SIN04: commons('Quinta_da_Regaleira,_Sintra,_Portugal_(34976378011).jpg', 'google_quinta_regaleira_garden_04.jpg', 'Susanne Nilsson', 'Quinta da Regaleira palace and gardens surrounded by greenery.', 'Regaleira Gardens'),
  ROC01: row('google_praia_ursa_sunset_01.jpg', 'https://image.jimcdn.com/app/cms/image/transf/dimension%3D443x10000%3Aformat%3Djpg/path/s2dc28d997a8a8bd1/image/if6f3213d33c7e094/version/1569270299/portugal-praia-da-ursa-sintra-langzeitbelichtung-2019-silly-photography.jpg', 'https://www.silly-photography.de/2019/09/23/mein-foto-september-2019/', 'Silly Photography', 'Long-exposure sunset over Praia da Ursa sea stacks.', 'Praia da Ursa'),
  ROC02: row('google_azenhas_do_mar_02.jpg', 'https://www.mibreit-photo.com/blog/photographing-portugal-azenhas-do-mar/images/Photographing-Azenhas-do-Mar-1280.jpg', 'https://www.mibreit-photo.com/blog/photographing-portugal-azenhas-do-mar/', 'Michael Breitung', 'Azenhas do Mar village above its Atlantic tidal pool.', 'Azenhas do Mar'),
  ROC03: row('google_cabo_roca_cliffs_03.jpg', 'https://cdn-imgix.headout.com/media/images/dacfc072c43c502c4e85e5852c8c63f3-viewofdangerouscliffandCapeRocalighthouseCabodaRocaredandwhitelighthouseatEuropewesternedge.Portugal.jpg', 'https://www.tickets-lisbon.com/cabo-da-roca-from-lisbon/', 'Tickets Lisbon', 'Cabo da Roca cliffs dropping into the Atlantic.', 'Cabo da Roca'),
  ROC04: row('google_guincho_coast_04.webp', 'https://bikerist.com/api/static/uploads/Pisao-Guincho_Loop.webp', 'https://bikerist.com/tours/pisao-guincho', 'Bikerist', 'The Pisao-Guincho coastal road along wild Atlantic cliffs.', 'Guincho Coast'),
  CAR01: commons('Carvoeiro_Algarve_Portugal_February_2915_4163_-_panoramio.jpg', 'google_carvoeiro_cliffs_01.jpg', 'Bengt Nyman', 'Carvoeiro village and Algarve cliffs above turquoise water.', 'Carvoeiro Cliffs'),
  CAR02: commons('Carvoeiro-1.jpg', 'google_carvoeiro_beach_02.jpg', 'Jose A.', 'Carvoeiro beach tucked below golden Algarve cliffs.', 'Carvoeiro Beach'),
  CAR03: commons('Praia_do_Carvalho,_Carvoeiro,_Algarve,_Portugal_2017-04.jpg', 'google_praia_carvalho_03.jpg', 'Reino Baptista', 'Praia do Carvalho cove near Carvoeiro.', 'Praia do Carvalho'),
  CAR04: commons('Carvoeiro_Algarve_Portugal_February_2915_4150_-_panoramio.jpg', 'google_carvoeiro_coast_04.jpg', 'Bengt Nyman', 'Bright Carvoeiro coastline with limestone cliffs.', 'Carvoeiro Coast'),
  FER01: commons('Ferragudo_2017_(30).jpg', 'google_ferragudo_village_01.jpg', 'Joseolgon', 'Ferragudo village on the Arade River in the Algarve.', 'Ferragudo Village'),
  FER02: commons('Fort_at_Ferragudo_-_The_Algarve,_Portugal_(1469072359).jpg', 'google_ferragudo_fort_02.jpg', 'Glen Bowman', 'Ferragudo fort above the river mouth and beach.', 'Ferragudo Fort'),
  FER03: commons('View_of_Portimao_-_Ferragudo_-_The_Algarve,_Portugal_(1469904980)_(cropped).jpg', 'google_ferragudo_portimao_03.jpg', 'Glen Bowman', 'View across Portimao toward Ferragudo and the Algarve coast.', 'Arade View'),
  FER04: commons('Portugal_-_Ferragudo_-_beach_nearby_(25587037590).jpg', 'google_ferragudo_beach_04.jpg', 'Vitor Oliveira', 'Sandy beach and rocky shore near Ferragudo.', 'Ferragudo Beach'),
  LAG01: commons('Ponta_da_Piedade_(Lagos)_(Portugal)_(42490219631).jpg', 'google_ponta_piedade_lagos_01.jpg', 'Vitor Oliveira', 'Ponta da Piedade cliffs and sea stacks at Lagos.', 'Ponta da Piedade'),
  LAG02: commons('Ponta_da_Piedade_Algarve_Portugal_(27433535620).jpg', 'google_ponta_piedade_arches_02.jpg', 'Vitor Oliveira', 'Golden cliffs and blue water at Ponta da Piedade.', 'Piedade Arches'),
  LAG03: commons('Ponta_da_Piedade_2019-11-12-1.jpg', 'google_lagos_piedade_03.jpg', 'Alexey Komarov', 'Lagos coastline at Ponta da Piedade under clear sky.', 'Lagos Coast'),
  LAG04: commons('Ponta_da_Piedade_mit_Boot.jpg', 'google_piedade_boat_04.jpg', 'Ralf Roletschek', 'Boat among the rock formations at Ponta da Piedade.', 'Grotto Boat'),
  ALG01: commons('Algar_Seco_rocks,_Carvoeiro,_Portugal_julesvernex2-4.jpg', 'google_algar_seco_rocks_01.jpg', 'Jules Verne Times Two', 'Algar Seco rock formations and ocean windows.', 'Algar Seco Rocks'),
  ALG02: commons('AlgarSecoAlgarve.jpg', 'google_algar_seco_panorama_02.jpg', 'Nize', 'Panoramic Algar Seco grottos and limestone coast.', 'Algar Seco Panorama'),
  ALG03: commons('Algar_Seco_-_Carvoeiro_-_Portugal_(48711111798).jpg', 'google_algar_seco_carvoeiro_03.jpg', 'Vitor Oliveira', 'Algar Seco cliffs near Carvoeiro.', 'Carvoeiro Grottos'),
  ALG04: commons('Portugal_Algar_Seco._Vistas_de_Praia_do_Carvoeiro_(50600304536).jpg', 'google_algar_seco_view_04.jpg', 'Jose A.', 'Algar Seco viewpoint looking toward Praia do Carvoeiro.', 'Algar Seco View'),
  MAR01: commons('Praia_da_Marinha,_Algarve,_Portugal_(54151611806).jpg', 'google_praia_marinha_west_01.jpg', 'Jose A.', 'Praia da Marinha cliffs and clear Algarve water.', 'Praia da Marinha'),
  MAR02: commons('Praia_da_Marinha_portugal_150_(22349782329).jpg', 'google_praia_marinha_arch_02.jpg', 'Vitor Oliveira', 'Sea arches and limestone stacks at Praia da Marinha.', 'Marinha Arches'),
  MAR03: commons('Praia_da_Marinha_6.jpg', 'google_praia_marinha_epic_03.jpg', 'Jose A.', 'High-resolution view of Praia da Marinha coastline.', 'Marinha Coast'),
  MAR04: commons('Praia_da_Marinha.jpg', 'google_praia_marinha_classic_04.jpg', 'Had01', 'Classic Algarve cliff view at Praia da Marinha.', 'Marinha Classic'),
  BEN01: commons('Benagil_Cave_seen_by_above.jpg', 'google_benagil_above_01.jpg', 'Cristian Bortes', 'Benagil Cave skylight seen from above.', 'Benagil Above'),
  BEN02: commons('Benagil_Cave,_July_2012_edited.jpg', 'google_benagil_cave_02.jpg', 'Hurtuv', 'Sunlight entering Benagil Cave from the ceiling opening.', 'Benagil Cave'),
  BEN03: commons('Benagil_Cave_(1).jpg', 'google_benagil_water_03.jpg', 'Vitor Oliveira', 'Benagil Cave interior with golden rock and blue water.', 'Benagil Interior'),
  BEN04: commons('Benagil_Cave_(3).jpg', 'google_benagil_beach_04.jpg', 'Vitor Oliveira', 'Sandy beach inside Benagil Cave.', 'Benagil Beach'),
  SIL01: commons('Castelo_de_Silves_-_Algarve,_Portugal_-_11.03.2023.jpg', 'google_silves_castle_aerial_01.jpg', 'Bextrel', 'Aerial view of Silves Castle in the Algarve.', 'Silves Aerial'),
  SIL02: commons('Algarve_-_Silves_-_view_of_the_castle_(25829247165).jpg', 'google_silves_castle_view_02.jpg', 'muffinn', 'Silves Castle walls above the old town.', 'Silves Castle'),
  SIL03: commons('Silvescastle.jpg', 'google_silves_castle_walls_03.jpg', 'Jose A.', 'Red sandstone walls of Silves Castle.', 'Castle Walls'),
  SIL04: commons('Silves_castle_-_ancient_capital_of_Algarve_-_The_Algarve,_Portugal_(1388874324).jpg', 'google_silves_castle_tower_04.jpg', 'Glen Bowman', 'Silves Castle tower and battlements in warm light.', 'Silves Tower'),
  FUN01: commons('Funchal_Cable_Car_Madeira.jpg', 'google_funchal_cable_car_01.jpg', 'Ввласенко', 'Funchal cable car rising over the city and bay.', 'Funchal Cable Car'),
  FUN02: commons('Madeira_-_Funchal,_Cable_car_-_panoramio.jpg', 'google_funchal_gondola_02.jpg', 'Banja-Frans Mulder', 'Cable car over Funchal with ocean in the distance.', 'Funchal Gondola'),
  FUN03: commons('Pond_-_Jardim_Municipal_do_Funchal_01.jpg', 'google_funchal_garden_03.jpg', 'C messier', 'Colorful pond and gardens in central Funchal.', 'Funchal Garden'),
  FUN04: commons('Vista_de_Funchal_desde_Cabo_Girão,_Madeira,_Portugal,_2019-05-30,_DD_61.jpg', 'google_funchal_bay_04.jpg', 'Diego Delso', 'Wide view of Funchal and the Madeira coast from Cabo Girao.', 'Funchal Bay'),
  PON01: commons('Ponta_de_São_Lourenço_north_north_east.jpg', 'google_ponta_lourenco_cliffs_01.jpg', 'Richard Bartz', 'Ponta de Sao Lourenco cliffs reaching into the Atlantic.', 'Sao Lourenco Cliffs'),
  PON02: commons('Ponta_de_São_Lourenço,_Madeira,_ao_nascer_do_sol.jpg', 'google_ponta_lourenco_sunrise_02.jpg', 'Hugo Cadavez', 'Sunrise over Ponta de Sao Lourenco in Madeira.', 'Sao Lourenco Sunrise'),
  PON03: commons('Ponta_de_São_Lourenço_-_Madeira.JPG', 'google_ponta_lourenco_evening_03.jpg', 'Yola76', 'Evening light over Ponta de Sao Lourenco.', 'Sao Lourenco Evening'),
  PON04: commons('VIsta_da_Ponta_de_São_Lourenço_-_Ilha_da_Madeira_03.jpg', 'google_ponta_lourenco_view_04.jpg', 'Rafael Batista de Mendonça', 'High view across Ponta de Sao Lourenco ridges and sea.', 'Sao Lourenco View'),
  PIC01: commons('View_from_Miradouro_do_Pico_do_Arieiro_-_Madeira_03.jpg', 'google_pico_arieiro_view_01.jpg', 'H. Zell', 'Clouds and mountains from Pico do Arieiro.', 'Pico do Arieiro'),
  PIC02: commons('View_from_Pico_Do_Areiro_to_Pico_Ruivo,_Madeira.JPG', 'google_pico_ruivo_ridge_02.jpg', 'Donar Reiskoffer', 'Ridge trail view from Pico do Arieiro toward Pico Ruivo.', 'Pico Ruivo Ridge'),
  PIC03: row('google_pico_arieiro_epic_03.jpg', 'https://www.mibreit-photo.com/blog/photographing-pico-arieiro/images/Photographing-Pico-Arieiro.jpg', 'https://www.mibreit-photo.com/blog/photographing-pico-arieiro/', 'Michael Breitung', 'Epic cloudscape at Pico do Arieiro in Madeira.', 'Arieiro Clouds'),
  PIC04: commons('Madeira_21_-_View_from_Pico_do_Areeiro.jpg', 'google_pico_arieiro_clouds_04.jpg', 'Michael Gwyther-Jones', 'Madeira mountain peaks seen from Pico do Areeiro.', 'Mountain Peaks'),
  POR01: commons('Madseira._Porto_Moniz_–_North_Coast,_natural_swimming_pools._These_are_probably_the_most_famous_pools_in_Madeira._This_pool_is_not_natural_and_a_fee_is_required._(51859649088).jpg', 'google_porto_moniz_pools_01.jpg', 'Anne and David', 'Porto Moniz lava pools on the north coast of Madeira.', 'Porto Moniz Pools'),
  POR02: commons('Naturschwimmbecken_zwischen_Lavafelsen_in_Porto_Moniz,_Madeira._12.jpg', 'google_porto_moniz_lava_02.jpg', 'Holger Uwe Schmitt', 'Natural pools between lava rocks at Porto Moniz.', 'Lava Pools'),
  POR03: commons('Natural_pool_porto_moniz.jpg', 'google_porto_moniz_natural_03.jpg', 'Hannes Grobe', 'Natural ocean pool at Porto Moniz.', 'Natural Pool'),
  POR04: row('google_fanal_forest_04.jpg', 'https://www.mibreit-photo.com/blog/photographing-the-fanal-forest-on-madeira/images/Fanal-Ent.jpg', 'https://www.mibreit-photo.com/blog/photographing-the-fanal-forest-on-madeira/', 'Michael Breitung', 'Fanal forest trees in moody Madeira light.', 'Fanal Forest'),
  CAB01: commons('Madeira_-_Camara_De_Lobos_-_Cabo_Girao_(2092641169).jpg', 'google_cabo_girao_cam_lobos_01.jpg', 'Mike Gaylard', 'Camara de Lobos and Cabo Girao cliffs on Madeira.', 'Cabo Girao'),
  CAB02: commons('Cabo_Girao,_Madeira.jpg', 'google_cabo_girao_cliff_02.jpg', 'Tobi 87', 'View down from the top of Cabo Girao cliffs.', 'Cabo Girao Cliff'),
  CAB03: commons('Glass_balcony_of_Cabo_Girão_skywalk,_Câmara_de_Lobos,_Madeira,_2023_May.jpg', 'google_cabo_girao_skywalk_03.jpg', 'Simo Räsänen', 'Glass skywalk lookout at Cabo Girao.', 'Skywalk'),
  CAB04: commons('Madeira_-_Camara_De_Lobos_-_Towards_Cabo_Girao_(2092639657).jpg', 'google_camara_lobos_cabo_04.jpg', 'Mike Gaylard', 'Camara de Lobos looking toward Cabo Girao.', 'Camara de Lobos'),
  BAL01: commons('View_from_Balcões_-_Madeira.jpg', 'google_balcoes_panorama_01.jpg', 'Llez', 'Panoramic mountain view from Balcoes viewpoint.', 'Balcoes Panorama'),
  BAL02: commons('Mountain_panorama_from_Balcoes,_Ribeiro_Frio._Madeira._(15498512733).jpg', 'google_ribeiro_frio_balcoes_02.jpg', 'Tobias Alt', 'Ribeiro Frio mountain panorama from Balcoes.', 'Ribeiro Frio'),
  BAL03: commons('Floresta_Laurissilva,_Miradouro_dos_Balcões,_Ribeiro_Frio.jpg', 'google_laurissilva_balcoes_03.jpg', 'Ricardo Martins', 'Laurissilva forest at Miradouro dos Balcoes.', 'Laurissilva'),
  BAL04: commons('Madeira_levada_Ribeiro_Frio_Balcões_2016_4.jpg', 'google_ribeiro_frio_levada_04.jpg', 'Llez', 'Levada walk through Ribeiro Frio forest toward Balcoes.', 'Levada Walk'),
  SAN01: commons('Casas_de_Santana_traditional_houses_in_Santana,_Madeira,_2023_May.jpg', 'google_santana_houses_01.jpg', 'Simo Räsänen', 'Traditional thatched houses in Santana, Madeira.', 'Santana Houses'),
  SAN02: commons('Traditional_thatched_houses_(palheiros),_Santana,_Madeira,_Portugal.jpg', 'google_santana_palheiros_02.jpg', 'Paul Mannix', 'Colorful palheiros houses in Santana.', 'Palheiros'),
  SAN03: commons('Traditional_farmhouse_-_Santana_06.jpg', 'google_santana_farmhouse_03.jpg', 'H. Zell', 'Traditional Santana farmhouse beneath mountain greenery.', 'Santana Farmhouse'),
  SAN04: commons('In_Santana,_Madeira,_stehen_noch_einige_der_typischen_Madeira-Häuser._06.jpg', 'google_santana_village_04.jpg', 'H. Zell', 'Typical Madeira houses in Santana.', 'Santana Village'),
  SEI01: commons('Seixal_in_Porto_Moniz,_Madeira,_2023_May.jpg', 'google_seixal_coast_01.jpg', 'Simo Räsänen', 'Seixal coast and cliffs in north Madeira.', 'Seixal Coast'),
  SEI02: commons('Seixal_-_Ilha_da_Madeira_-_Portugal_(51817017914).jpg', 'google_seixal_beach_02.jpg', 'Portuguese_eyes', 'Black sand beach at Seixal with green cliffs.', 'Seixal Beach'),
  SEI03: commons('2016-_Seixal._Madeira._Portugal.jpg', 'google_seixal_village_03.jpg', 'Bengt Nyman', 'Seixal village and north Madeira coastline.', 'Seixal Village'),
  SEI04: commons('Seixal,_Madeira.jpg', 'google_seixal_madeira_04.jpg', 'Hannes Grobe', 'View of Seixal on Madeira island.', 'Seixal'),
  MAC01: commons('Madeira_-_Machico_-_the_beach_(32761306833).jpg', 'google_machico_beach_01.jpg', 'muffinn', 'Machico beach and surrounding green slopes.', 'Machico Beach'),
  MAC02: commons('Madeira_-_Machico_-_the_beach_(32761249923).jpg', 'google_machico_bay_02.jpg', 'muffinn', 'Machico bay and Pico do Facho.', 'Machico Bay'),
  MAC03: commons('Machico,Madeira_-_panoramio.jpg', 'google_machico_town_03.jpg', 'Wikimedia Commons contributor', 'Machico town and bay on Madeira.', 'Machico Town'),
  MAC04: commons('Machico_(Portugal).jpg', 'google_machico_waterfront_04.jpg', 'Wikimedia Commons contributor', 'Machico waterfront beneath Madeira hills.', 'Machico Waterfront'),
  CAL01: commons('Calheta_beach,_Madeira,_Portugal,_June-July_2011_-_panoramio_(1).jpg', 'google_calheta_beach_01.jpg', 'Wikimedia Commons contributor', 'Calheta beach and harbor in Madeira.', 'Calheta Beach'),
  CAL02: commons('Calheta_beach,_Madeira,_Portugal,_June-July_2011_-_panoramio_(2).jpg', 'google_calheta_harbor_02.jpg', 'Wikimedia Commons contributor', 'Calheta beach with golden sand and mountain backdrop.', 'Calheta Harbor'),
  CAL03: commons('Calheta_Beach.jpg', 'google_calheta_sand_03.jpg', 'Ricardo Liberato', 'Golden sand at Calheta Beach.', 'Calheta Sand'),
  CAL04: commons('Madeira_Beach_(163610932).jpg', 'google_calheta_madeira_beach_04.jpg', 'Don Amaro', 'Calheta beach with imported golden sand on Madeira.', 'Madeira Beach'),
  JAR01: commons('Jardim_do_Mar_Madeira.JPG', 'google_jardim_mar_01.jpg', 'Wikimedia Commons contributor', 'Jardim do Mar village on the Madeira coast.', 'Jardim do Mar'),
  JAR02: commons('Madeira,_Jardim_do_Mar.jpg', 'google_jardim_mar_coast_02.jpg', 'Iain Gilmour', 'South coast of Madeira near Jardim do Mar.', 'Jardim Coast'),
  JAR03: commons('Madeira_-_Calheta_-_Jardim_Do_Mar_(4733024352).jpg', 'google_jardim_calheta_03.jpg', 'Mike Gaylard', 'Jardim do Mar coastline west of Calheta.', 'Calheta Coast'),
  JAR04: commons('2011-03-05_03-13_Madeira_322_Jardim_do_Mar.jpg', 'google_jardim_mar_village_04.jpg', 'Andreas Weith', 'Jardim do Mar village and sea wall.', 'Jardim Village'),
  LIS01: commons('Parque_das_Nações,_Lisbon,_Portugal,_2019-05-25,_DD_73.jpg', 'google_lisbon_parque_nacoes_01.jpg', 'Diego Delso', 'Parque das Nacoes waterfront in Lisbon.', 'Parque das Nacoes'),
  LIS02: commons('Torre_Vasco_da_Gama_2012.JPG', 'google_lisbon_vasco_gama_02.jpg', 'Paulo Juntas', 'Vasco da Gama Tower on the Lisbon waterfront.', 'Vasco da Gama'),
  LIS03: commons('Oceanário_de_Lisboa_2011.jpg', 'google_lisbon_oceanario_03.jpg', 'Joseolgon', 'Oceanario de Lisboa at Parque das Nacoes.', 'Oceanario'),
  PAL01: commons('Palma_de_Mallorca_Royal_Palace_La_Almudaina_Cathedral.jpg', 'google_palma_cathedral_01.jpg', 'Diego Delso', 'Palma Cathedral and Royal Palace La Almudaina.', 'Palma Cathedral'),
  PAL02: commons('Catedral_de_Santa_Maria_(Palma_de_Mallorca)_--_03.jpg', 'google_palma_laseu_02.jpg', 'Ralf Roletschek', 'La Seu Cathedral in Palma de Mallorca.', 'La Seu'),
  PAL03: commons('Palma_de_Mallorca,_Kathedrale_La_Seu_--_2009_--_5.jpg', 'google_palma_cathedral_light_03.jpg', 'Dietmar Rabich', 'Palma Cathedral in warm Mediterranean light.', 'Cathedral Light'),
  SOL01: commons('Port_de_Sóller_14.jpg', 'google_port_soller_01.jpg', 'Frank Vincentz', 'Port de Soller harbor surrounded by Tramuntana mountains.', 'Port de Soller'),
  SOL02: commons('Port_de_Soller.jpg', 'google_port_soller_harbor_02.jpg', 'Gryffindor', 'Wide view of Port de Soller and its curved bay.', 'Soller Harbor'),
  SOL03: commons('Ferrocarril_de_Sóller-pjt1.jpg', 'google_soller_tram_03.jpg', 'pjt56', 'Historic tram in Port de Soller.', 'Soller Tram'),
  MUR01: commons('Vista_aérea_de_la_Playa_de_Muro_(Baleares,_España).jpg', 'google_playa_muro_aerial_01.jpg', 'Chixoy', 'Aerial view of Playa de Muro and Alcudia Bay.', 'Playa de Muro Aerial'),
  MUR02: commons('Playa_de_Muro,_Alcudia,_Mallorca_-_panoramio.jpg', 'google_playa_muro_bay_02.jpg', 'Wikimedia Commons contributor', 'Long sandy Playa de Muro on Alcudia Bay.', 'Alcudia Bay'),
  MUR03: commons('Playa_de_Muro.JPG', 'google_playa_muro_03.jpg', 'Mallorcagallery', 'Clear shallow water at Playa de Muro.', 'Playa de Muro'),
  FOR01: commons('Far_del_Cap_de_Formentor,_Mallorca.jpg', 'google_formentor_lighthouse_01.jpg', 'Mirkaah', 'Cap de Formentor lighthouse above dramatic cliffs.', 'Formentor Lighthouse'),
  FOR02: commons('Cap_de_Formentor_2009.jpg', 'google_formentor_cliffs_02.jpg', 'Bengt Nyman', 'Cape de Formentor cliffs and blue Mediterranean water.', 'Formentor Cliffs'),
  FOR03: commons('Cap_Formentor_2015_(Zuschnitt).jpg', 'google_formentor_2015_03.jpg', 'Thomas Wolf', 'Cap Formentor lighthouse at the edge of Mallorca.', 'Cap Formentor'),
  DRA01: commons('Cueva_del_Drach_Mallorca_04.jpg', 'google_drach_caves_01.jpg', 'Javier Perez Montes', 'Interior of Cuevas del Drach in Mallorca.', 'Drach Caves'),
  DRA02: commons('Interior_de_las_Cuevas_del_Drach.jpg', 'google_drach_interior_02.jpg', 'Rastrojo', 'Underground lake and formations inside Cuevas del Drach.', 'Cave Interior'),
  MON01: commons('Cala_Mondrago_-_panoramio_(1).jpg', 'google_cala_mondrago_03.jpg', 'Wikimedia Commons contributor', 'Cala Mondrago beach with turquoise water in Mallorca.', 'Cala Mondrago')
};

const maps = {
  portugal: {
    c1: ['CAS01', 'CAS02', 'CAS03', 'CAS04'],
    c2: ['CAS02', 'CAS01', 'CAS03', 'ROC04'],
    c3: ['SIN01', 'SIN02', 'SIN03', 'SIN04'],
    c4: ['ROC01', 'SIN03', 'ROC02', 'ROC03'],
    c5: ['ROC02', 'SIN03', 'ROC01', 'CAS03'],
    c6: ['ROC03', 'ROC04', 'ROC01', 'CAS02'],
    c7: ['CAR01', 'CAR02', 'CAR03', 'CAR04'],
    c8: ['FER01', 'FER02', 'FER03', 'FER04'],
    c9: ['LAG01', 'LAG02', 'LAG03', 'LAG04'],
    c10: ['LAG01', 'LAG02', 'LAG03', 'LAG04'],
    c11: ['ALG01', 'ALG02', 'ALG03', 'ALG04'],
    c12: ['MAR01', 'MAR02', 'MAR03', 'MAR04'],
    c13: ['MAR01', 'BEN01', 'CAR02'],
    c14: ['SIL01', 'SIL02', 'SIL03', 'SIL04'],
    c15: ['BEN01', 'BEN02', 'BEN03', 'BEN04'],
    c16: ['JAR02', 'CAL01', 'FUN04', 'CAB04'],
    c17: ['PON01', 'PON02', 'PON03', 'PON04'],
    c18: ['MAC01', 'MAC02', 'MAC03', 'MAC04'],
    c19: ['PON04', 'PON03', 'MAC01', 'PON01'],
    c20: ['SEI01', 'SEI02', 'SEI03', 'SEI04'],
    c21: ['POR01', 'POR02', 'POR03', 'POR04'],
    c22: ['FUN01', 'FUN02', 'FUN03', 'FUN04'],
    c23: ['CAB04', 'CAB01', 'FUN04', 'CAB02'],
    c24: ['CAB01', 'CAB02', 'CAB03', 'FUN04'],
    c25: ['BAL02', 'BAL03', 'BAL04', 'BAL01'],
    c26: ['BAL01', 'BAL02', 'BAL03', 'BAL04'],
    c27: ['SAN01', 'SAN02', 'SAN03', 'SAN04'],
    c28: ['CAL01', 'CAL02', 'CAL03', 'CAL04'],
    c29: ['JAR01', 'JAR02', 'JAR03', 'JAR04']
  },
  'madeira-mallorca': {
    c1: ['FUN01', 'FUN04', 'PIC01'],
    c2: ['PIC01', 'PIC03', 'PON01'],
    c3: ['BAL01', 'BAL03', 'BAL02'],
    c4: ['POR01', 'POR04', 'POR02'],
    c5: ['CAB03', 'FUN04', 'PON01'],
    c6: ['PON01', 'PON04', 'PIC01'],
    c7: ['CAS03', 'ROC03', 'CAS02'],
    c8: ['PAL01', 'PAL02', 'PAL03'],
    c9: ['SOL02', 'SOL03', 'MUR01'],
    c10: ['MUR01', 'MUR02', 'MUR03'],
    c11: ['FOR02', 'FOR03', 'MUR01'],
    c12: ['DRA01', 'MON01', 'MUR03']
  },
  iceland: {
    'c-arrival': [
      commons('Laugardalslaug_01.jpg', 'google_laugardalslaug_pool_01.jpg', 'Reykjavik City Museum', 'Color photo of Laugardalslaug outdoor swimming pools in Reykjavik.', 'Laugardalslaug'),
      commons('Laugardalslaug_1.jpg', 'google_laugardalslaug_reykjavik_02.jpg', 'Reykjavik City Museum', 'Outdoor pools and decks at Laugardalslaug in Reykjavik.', 'Reykjavik Pools')
    ],
    'c-waterfalls': [
      commons('Seljalandsfoss,_Suðurland,_Islandia,_2014-08-16,_DD_189-191_HDR.JPG', 'google_seljalandsfoss_01.jpg', 'Diego Delso', 'Seljalandsfoss waterfall dropping from green cliffs in Iceland.', 'Seljalandsfoss'),
      commons('Skógafoss_Waterfall_with_Double_Rainbow.jpg', 'google_skogafoss_02.jpg', 'Austaclausen', 'Skogafoss waterfall with a bright double rainbow.', 'Skogafoss Rainbow'),
      commons('Skogafoss_waterfall_-_Iceland_-_Landscape_photography_(34692750741).jpg', 'google_skogafoss_wide_03.jpg', 'Giuseppe Milo', 'Wide landscape view of Skogafoss in color.', 'Skogafoss Wide')
    ],
    'c-glacier': [
      commons('Sólheimajökull_glacier_12.jpg', 'google_solheimajokull_walk_01.jpg', 'Netha Hussain', 'Color view of Solheimajokull glacier ice and volcanic terrain.', 'Solheimajokull'),
      commons('Sólheimajökull_Glacier,_Iceland_(482880869).jpg', 'google_solheimajokull_view_02.jpg', 'Wikimedia Commons contributor', 'Solheimajokull glacier under blue Icelandic sky.', 'Glacier View'),
      commons('Sólheimajökull_glacier_07.jpg', 'google_solheimajokull_ice_03.jpg', 'Netha Hussain', 'Blue-gray ice formations at Solheimajokull glacier.', 'Glacier Ice')
    ],
    'c-blue': [
      commons('The_Blue_Lagoon,_Iceland_(22111273209).jpg', 'google_blue_lagoon_01.jpg', 'Kārlis Dambrāns', 'Milky blue geothermal water at the Blue Lagoon in Iceland.', 'Blue Lagoon'),
      commons('Iceland_-_Blue_Lagoon_09_(6571266721).jpg', 'google_blue_lagoon_bathers_02.jpg', 'Herbert Frank', 'Colorful Blue Lagoon water and lava field in Iceland.', 'Lagoon Water')
    ]
  }
};

const map = maps[slug];
if (!map) {
  console.error(`No remaining top-9 refresh map for ${slug}`);
  process.exit(1);
}

const dir = join('assets', 'img', slug);
mkdirSync(dir, { recursive: true });
mkdirSync(join('/tmp', 'pics', slug), { recursive: true });

let plan = { carousels: {}, htmlReplacements: {}, indexCard: null };
const planPath = join(dir, '_photo-plan.json');
if (slug === 'iceland') {
  plan = JSON.parse(readFileSync(planPath, 'utf8'));
}

const failed = [];
const used = new Map();
let fallbackEntry = null;

const htmlCache = new Map();
function fetchText(url) {
  if (!htmlCache.has(url)) {
    htmlCache.set(url, execFileSync('curl', ['-L', '-A', 'Mozilla/5.0', '--max-time', '45', url], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
  }
  return htmlCache.get(url);
}

function extractCommonsImage(sourcePage) {
  const html = fetchText(sourcePage);
  const matches = [...html.matchAll(/https:\/\/upload\.wikimedia\.org\/[^"' ]+\.(?:jpg|jpeg|JPG|JPEG|png|PNG|webp|WEBP)(?:\?[^"' ]*)?/g)]
    .map((match) => match[0].replaceAll('&amp;', '&'))
    .filter((url) => !/\/\d+px-|\/\d+px%2D|\/\d+px_/.test(url));
  if (matches.length) return matches[0];
  const thumb = html.match(/https:\/\/upload\.wikimedia\.org\/[^"' ]+\.(?:jpg|jpeg|JPG|JPEG|png|PNG|webp|WEBP)(?:\?[^"' ]*)?/);
  if (thumb?.[0]) return thumb[0].replaceAll('&amp;', '&');
  throw new Error(`no Commons image URL found in ${sourcePage}`);
}

for (const [cid, keys] of Object.entries(map)) {
  const rows = slug === 'iceland' ? keys : keys.map((key) => catalog[key]);
  plan.carousels[cid] = [];
  const sheetDir = join('/tmp', 'pics', slug, cid);
  mkdirSync(sheetDir, { recursive: true });
  for (const item of rows) {
    if (!item) throw new Error(`Missing catalog row in ${slug} ${cid}`);
    let [baseFile, imageUrl, sourcePage, credit, alt, captionTitle] = item;
    const count = (used.get(baseFile) || 0) + 1;
    used.set(baseFile, count);
    const file = slug === 'iceland' || count === 1 ? baseFile.replace(/\.webp$/i, '.jpg') : baseFile.replace(/\.(jpg|jpeg|webp)$/i, `_${count}.jpg`);
    const out = join(dir, file);
    const tmp = join('/tmp', 'pics', slug, `${cid}-${basename(file)}.download`);
    try {
      execFileSync('curl', ['-L', '-A', 'Mozilla/5.0', '--max-time', '60', '-o', tmp, imageUrl], { stdio: 'ignore' });
      let kind = execFileSync('file', ['-b', tmp], { encoding: 'utf8' });
      let size = Number(execFileSync('stat', ['-f', '%z', tmp], { encoding: 'utf8' }).trim());
      if (!/image|JPEG|PNG|WebP/i.test(kind) && /commons\.wikimedia\.org\/wiki\/File:/.test(sourcePage)) {
        const resolved = extractCommonsImage(sourcePage);
        execFileSync('curl', ['-L', '-A', 'Mozilla/5.0', '--max-time', '60', '-o', tmp, resolved], { stdio: 'ignore' });
        kind = execFileSync('file', ['-b', tmp], { encoding: 'utf8' });
        size = Number(execFileSync('stat', ['-f', '%z', tmp], { encoding: 'utf8' }).trim());
      }
      if (!/image|JPEG|PNG|WebP/i.test(kind) || size < 10000) throw new Error(`${kind.trim()} ${size} bytes`);
      execFileSync('magick', [tmp, '-auto-orient', '-resize', '2400x1600>', '-quality', '88', out], { stdio: 'ignore' });
      execFileSync('cp', [out, join(sheetDir, basename(file))]);
      plan.carousels[cid].push({
        file,
        alt,
        captionTitle,
        credit: `${credit} · Google Images source`,
        sourcePage,
        discoveredVia: 'Google Images'
      });
      fallbackEntry ??= plan.carousels[cid].at(-1);
    } catch (err) {
      failed.push({ cid, file, sourcePage, error: err.message });
      const fallback = plan.carousels[cid].at(-1) || fallbackEntry;
      if (fallback) {
        plan.carousels[cid].push({ ...fallback });
      }
    }
  }
}

if (slug === 'iceland') {
  plan.indexCard = {
    file: 'google_vestrahorn_stokksnes_01.jpg',
    alt: 'Color landscape of Vestrahorn mountain at Stokksnes in Iceland.'
  };
} else {
  const first = Object.values(plan.carousels)[0]?.[0];
  plan.indexCard = first ? { file: first.file, alt: first.alt } : null;
}

writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n');

if (failed.length) {
  console.warn(`Used fallback images for ${failed.length} failed row(s).`);
}

console.log(`Wrote ${planPath}`);
