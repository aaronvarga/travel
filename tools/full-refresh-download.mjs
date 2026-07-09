#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const slug = process.argv[2];
if (!slug) {
  console.error('usage: node tools/full-refresh-download.mjs <slug>');
  process.exit(1);
}

const sets = {
  iceland: {
    carousels: {
      'c-arrival': [
        ['google_laugardalslaug_pool_01.jpg', 'https://live.staticflickr.com/8431/7864423984_3c826ae40c_b.jpg', 'https://www.flickr.com/photos/97449017@N00/7864423984', 'YlvaS', 'Outdoor pools at Laugardalslaug in Reykjavik.', 'Laugardalslaug'],
        ['google_laugardalslaug_reykjavik_02.jpg', 'https://live.staticflickr.com/6206/6141659615_7f59e16f72_b.jpg', 'https://www.flickr.com/photos/33298305@N00/6141659615', 'franjrp', 'Reykjavik swimming complex at Laugardalslaug.', 'Reykjavik Pools']
      ],
      'c-city': [
        ['google_reykjavik_whale_tour_01.jpg', 'https://live.staticflickr.com/5453/9280871227_98f7fcdda1_b.jpg', 'https://www.flickr.com/photos/8058853@N06/9280871227', 'Helgi Halldorsson', 'Whale watching tour boat near Reykjavik harbor.', 'Whale Boat'],
        ['google_elding_whale_watching_02.jpg', 'https://live.staticflickr.com/6050/5866308105_fa0fe31efe_b.jpg', 'https://www.flickr.com/photos/8058853@N06/5866308105', 'Helgi Halldorsson', 'Elding whale watching boat departing Reykjavik.', 'Elding Boat'],
        ['google_reykjavik_harbor_03.jpg', 'https://live.staticflickr.com/65535/54094990964_15b9aaf4bb_b.jpg', 'https://www.flickr.com/photos/183815295@N06/54094990964', 'die Fernreiselustige', 'Boats reflected in Reykjavik harbor in early morning light.', 'Reykjavik Harbor']
      ],
      'c-golden': [
        ['google_thingvellir_rift_01.jpg', 'https://live.staticflickr.com/2746/4380305289_4e91d5afdb_b.jpg', 'https://www.flickr.com/photos/44028103@N07/4380305289', 'Chris Ford', 'Stream through the rift zone at Thingvellir.', 'Thingvellir Rift'],
        ['google_strokkur_geysir_02.jpg', 'https://live.staticflickr.com/2889/34246196301_8f27a3fc2c_b.jpg', 'https://www.flickr.com/photos/151356780@N03/34246196301', 'lifeinvisuals', 'Strokkur geyser erupting in Iceland.', 'Strokkur Eruption'],
        ['google_gullfoss_03.jpg', 'https://live.staticflickr.com/2867/33749740080_e5776a462c_b.jpg', 'https://www.flickr.com/photos/87690240@N03/33749740080', 'Giuseppe Milo', 'Wide view of Gullfoss waterfall.', 'Gullfoss Falls']
      ],
      'c-secret': [
        ['google_secret_lagoon_01.jpg', 'https://live.staticflickr.com/4260/34666307854_0690f51713_b.jpg', 'https://www.flickr.com/photos/17814428@N00/34666307854', 'ticktockdoc', 'Steam rising over Secret Lagoon in Fludir.', 'Secret Lagoon'],
        ['google_secret_lagoon_water_02.jpg', 'https://live.staticflickr.com/4262/35468076256_d3c3ce19ca_b.jpg', 'https://www.flickr.com/photos/17814428@N00/35468076256', 'ticktockdoc', 'Geothermal bathing pool at Secret Lagoon.', 'Geothermal Pool'],
        ['google_secret_lagoon_fludir_03.jpg', 'https://live.staticflickr.com/5676/29811374894_a433e29e9c_b.jpg', 'https://www.flickr.com/photos/62556299@N00/29811374894', 'Photo Phiend', 'Visitors soaking at Secret Lagoon in Fludir.', 'Fludir Soak']
      ],
      'c-waterfalls': [
        ['google_seljalandsfoss_01.jpg', 'https://live.staticflickr.com/2881/9372008466_d84e05961b_b.jpg', 'https://www.flickr.com/photos/93331158@N03/9372008466', 'Claudia Regina', 'Seljalandsfoss waterfall in green cliffs.', 'Seljalandsfoss'],
        ['google_skogafoss_02.jpg', 'https://live.staticflickr.com/7729/27696954141_8006e8e954_b.jpg', 'https://www.flickr.com/photos/22691568@N04/27696954141', 'Bill Higham', 'Skogafoss waterfall with mist below.', 'Skogafoss Mist'],
        ['google_skogafoss_wide_03.jpg', 'https://live.staticflickr.com/3836/15209388807_caeea61fbf_b.jpg', 'https://www.flickr.com/photos/126707729@N02/15209388807', 'Bill Devlin', 'Wide landscape view of Skogafoss.', 'Skogafoss Wide']
      ],
      'c-glacier': [
        ['google_solheimajokull_walk_01.jpg', 'https://live.staticflickr.com/5591/14902433111_bb3013fe6b_b.jpg', 'https://www.flickr.com/photos/77334245@N00/14902433111', 'Carsten ten Brink', 'Hikers walking on Solheimajokull glacier.', 'Glacier Walk'],
        ['google_solheimajokull_view_02.jpg', 'https://live.staticflickr.com/7341/27997804765_e7d00cc715_b.jpg', 'https://www.flickr.com/photos/7752891@N06/27997804765', 'joxeankoret', 'View across Solheimajokull glacier ice.', 'Glacier View'],
        ['google_solheimajokull_ice_03.jpg', 'https://live.staticflickr.com/65535/51567715157_6b81b9934f_b.jpg', 'https://www.flickr.com/photos/72213316@N00/51567715157', 'Alaskan Dude', 'Blue and gray ice at Solheimajokull glacier.', 'Blue Ice']
      ],
      'c-reynis': [
        ['google_reynisfjara_01.jpg', 'https://live.staticflickr.com/4177/33587041124_3ddae8cca2_b.jpg', 'https://www.flickr.com/photos/87690240@N03/33587041124', 'Giuseppe Milo', 'Black sand beach at Reynisfjara.', 'Reynisfjara'],
        ['google_reynisfjara_stacks_02.jpg', 'https://live.staticflickr.com/2916/33850518110_6efe888e56_b.jpg', 'https://www.flickr.com/photos/51314820@N00/33850518110', 'Henrique Vicente', 'Reynisfjara beach and basalt sea stacks.', 'Basalt Stacks'],
        ['google_reynisfjara_vik_03.jpg', 'https://live.staticflickr.com/65535/51535456557_4aafddf926_b.jpg', 'https://www.flickr.com/photos/190091883@N06/51535456557', 'Captainspires', 'Reynisfjara black beach near Vik.', 'Black Beach']
      ],
      'c-canyon': [
        ['google_fjadrargljufur_01.jpg', 'https://live.staticflickr.com/1404/1243440335_79b3f4754c_b.jpg', 'https://www.flickr.com/photos/26596250@N00/1243440335', 'r h', 'Fjadrargljufur canyon with a winding river.', 'Fjadrargljufur'],
        ['google_fjadrargljufur_rim_02.jpg', 'https://live.staticflickr.com/65535/51724986434_6fda80dfa2_b.jpg', 'https://www.flickr.com/photos/158292715@N07/51724986434', 'Fernando Sa Rapita', 'Cliffside view into Fjadrargljufur canyon.', 'Canyon Rim'],
        ['google_svartifoss_03.jpg', 'https://live.staticflickr.com/7294/9200709882_e83f272f76_b.jpg', 'https://www.flickr.com/photos/24696387@N08/9200709882', 'delphine the human', 'Svartifoss waterfall in Skaftafell.', 'Svartifoss']
      ],
      'c-jokul': [
        ['google_jokulsarlon_01.jpg', 'https://live.staticflickr.com/3777/33282383615_47f9157b1b_b.jpg', 'https://www.flickr.com/photos/68881523@N07/33282383615', 'davidbaxendale.com', 'Icebergs floating in Jokulsarlon lagoon.', 'Jokulsarlon'],
        ['google_jokulsarlon_ice_02.jpg', 'https://live.staticflickr.com/382/31537205222_c86f838c9f_b.jpg', 'https://www.flickr.com/photos/40718898@N04/31537205222', 'ShutterRunner', 'Blue icebergs at Jokulsarlon glacier lagoon.', 'Blue Icebergs']
      ],
      'c-diamond': [
        ['google_diamond_beach_01.jpg', 'https://live.staticflickr.com/65535/51572260843_15f1336b97_b.jpg', 'https://www.flickr.com/photos/122471086@N06/51572260843', 'RickybanPhotography', 'Ice chunks on black sand at Diamond Beach.', 'Diamond Beach'],
        ['google_diamond_beach_seascape_02.jpg', 'https://live.staticflickr.com/4779/39760585525_de2d3ae019_b.jpg', 'https://www.flickr.com/photos/87690240@N03/39760585525', 'Giuseppe Milo', 'Diamond Beach seascape with glacial ice.', 'Ice Seascape']
      ],
      'c-vestra': [
        ['google_vestrahorn_stokksnes_01.jpg', 'https://live.staticflickr.com/8032/7897002782_9e9965278d_b.jpg', 'https://www.flickr.com/photos/53053326@N00/7897002782', 'Arnar Valdimarsson', 'Vestrahorn mountain at Stokksnes.', 'Vestrahorn'],
        ['google_stokksnes_black_sand_02.jpg', 'https://live.staticflickr.com/8551/30220086522_666fb62dc0_b.jpg', 'https://www.flickr.com/photos/25999920@N00/30220086522', 'aevarg', 'Black sand foreground below Vestrahorn.', 'Stokksnes Sand'],
        ['google_vestrahorn_mountain_03.jpg', 'https://live.staticflickr.com/65535/52604135059_470be078df_b.jpg', 'https://www.flickr.com/photos/77575223@N05/52604135059', 'Roman Popelar', 'Dramatic Vestrahorn mountain landscape.', 'Mountain Face']
      ],
      'c-reykjanes': [
        ['google_gunnuhver_steam_01.jpg', 'https://live.staticflickr.com/8183/8096092436_b96c6b9a38_b.jpg', 'https://www.flickr.com/photos/25622716@N02/8096092436', 'thisisbossi', 'Steam vent at Gunnuhver on Reykjanes.', 'Gunnuhver Steam'],
        ['google_gunnuhver_lava_02.jpg', 'https://live.staticflickr.com/8327/8096068456_6c6f795cdb_b.jpg', 'https://www.flickr.com/photos/25622716@N02/8096068456', 'thisisbossi', 'Geothermal steam and lava terrain on Reykjanes.', 'Lava Steam']
      ],
      'c-blue': [
        ['google_blue_lagoon_01.jpg', 'https://live.staticflickr.com/7478/16274041845_1ce4331edd_b.jpg', 'https://www.flickr.com/photos/24661116@N03/16274041845', 'Jannes Glas', 'Milky blue geothermal water at Blue Lagoon.', 'Blue Lagoon'],
        ['google_blue_lagoon_bathers_02.jpg', 'https://live.staticflickr.com/5002/5349300444_5b1283ca79_b.jpg', 'https://www.flickr.com/photos/7737054@N07/5349300444', 'Nouhailler', 'Visitors bathing at Blue Lagoon Iceland.', 'Lagoon Bathers']
      ]
    }
  },
  spain: {
    carousels: {
      c1: [
        ['google_plaza_espana_01.jpg', 'https://live.staticflickr.com/4055/4445915793_0f3acaebd3_b.jpg', 'https://www.flickr.com/photos/44717021@N06/4445915793', 'Eric Hossinger', 'Plaza de Espana in Seville with its sweeping brick arcade.', 'Plaza de Espana'],
        ['google_plaza_espana_canal_02.jpg', 'https://live.staticflickr.com/1790/41348629160_4d7390e5eb_b.jpg', 'https://www.flickr.com/photos/37804979@N00/41348629160', 'ahisgett', 'Canal and tiled bridges at Plaza de Espana in Seville.', 'Seville Canal'],
        ['google_plaza_espana_wide_03.jpg', 'https://live.staticflickr.com/790/27429546258_7bacac19ec_b.jpg', 'https://www.flickr.com/photos/22956445@N04/27429546258', 'Naval S', 'Wide architectural view of Plaza de Espana.', 'Grand Plaza']
      ],
      c2: [
        ['google_real_alcazar_gardens_01.jpg', 'https://live.staticflickr.com/3907/14555918360_afc0a20448_b.jpg', 'https://www.flickr.com/photos/39415781@N06/14555918360', 'ell brown', 'Gardens and Mercury fountain at the Real Alcazar.', 'Alcazar Gardens'],
        ['google_real_alcazar_gallery_02.jpg', 'https://live.staticflickr.com/5560/14739397321_323183e1e5_b.jpg', 'https://www.flickr.com/photos/39415781@N06/14739397321', 'ell brown', 'Grotto gallery in the Real Alcazar gardens.', 'Garden Gallery'],
        ['google_real_alcazar_water_03.jpg', 'https://live.staticflickr.com/5557/14556101417_603ba449b2_b.jpg', 'https://www.flickr.com/photos/39415781@N06/14556101417', 'ell brown', 'Water garden detail at the Real Alcazar in Seville.', 'Water Garden']
      ],
      c3: [
        ['google_mezquita_interior_01.jpg', 'https://live.staticflickr.com/65535/51345720917_e2cfbe3e00_b.jpg', 'https://www.flickr.com/photos/12357841@N02/51345720917', 'Me in ME', 'Interior arches of the Mosque Cathedral of Cordoba.', 'Mezquita Arches'],
        ['google_mezquita_dome_02.jpg', 'https://live.staticflickr.com/7379/13086916635_f9e1e7423b_b.jpg', 'https://www.flickr.com/photos/27365066@N02/13086916635', 'Reji', 'Dome detail inside Cordoba Mosque Cathedral.', 'Cordoba Dome'],
        ['google_cordoba_bridge_mezquita_03.jpg', 'https://live.staticflickr.com/4687/39095262311_1a9932fb88_b.jpg', 'https://www.flickr.com/photos/42201095@N03/39095262311', 'Jocelyn777', 'Cordoba Mosque Cathedral and Roman Bridge.', 'Bridge View']
      ],
      c4: [
        ['google_nasrid_palaces_01.jpg', 'https://live.staticflickr.com/2847/12670822665_f4b5c2b21a_b.jpg', 'https://www.flickr.com/photos/43714545@N06/12670822665', 'Prof. Mortel', 'Ornate Nasrid Palaces at the Alhambra.', 'Nasrid Palaces'],
        ['google_alhambra_palace_02.jpg', 'https://live.staticflickr.com/2662/3802932872_58ae30572b_b.jpg', 'https://www.flickr.com/photos/79023099@N00/3802932872', 'Wild Guru Larry', 'Interior courtyard of the Nasrid Palace.', 'Palace Court'],
        ['google_alhambra_detail_03.jpg', 'https://live.staticflickr.com/7412/12634268304_a9dd345d35_b.jpg', 'https://www.flickr.com/photos/43714545@N06/12634268304', 'Prof. Mortel', 'Detailed arches inside the Alhambra Nasrid Palaces.', 'Alhambra Detail']
      ],
      c5: [
        ['google_albaicin_alhambra_view_01.jpg', 'https://live.staticflickr.com/7282/8742567104_97952c87f6_b.jpg', 'https://www.flickr.com/photos/7811565@N03/8742567104', 'timrawle', 'Alhambra viewed from the Granada hillside.', 'Albaicin View'],
        ['google_mirador_san_nicolas_02.jpg', 'https://live.staticflickr.com/6120/6220036479_2c0cc77720_b.jpg', 'https://www.flickr.com/photos/44657479@N00/6220036479', 'salvadorfornell', 'Evening scene at Mirador de San Nicolas.', 'San Nicolas'],
        ['google_mirador_granada_03.jpg', 'https://live.staticflickr.com/6106/6220559564_0fdcd5fc46_b.jpg', 'https://www.flickr.com/photos/44657479@N00/6220559564', 'salvadorfornell', 'Granada overlook at Mirador de San Nicolas.', 'Granada Overlook']
      ],
      c6: [
        ['google_nerja_coast_01.jpg', 'https://live.staticflickr.com/3114/2599530619_b012af8b3f_b.jpg', 'https://www.flickr.com/photos/11767329@N05/2599530619', 'Carlos Castro', 'Surf and rocks along the Nerja coast.', 'Nerja Coast'],
        ['google_balcon_europa_02.jpg', 'https://live.staticflickr.com/1048/997572024_5afa49e6d2_b.jpg', 'https://www.flickr.com/photos/98621709@N00/997572024', 'SteveR', 'Balcon de Europa above Nerja beach.', 'Balcon View'],
        ['google_nerja_andalucia_03.jpg', 'https://live.staticflickr.com/3649/3668139486_eda625047e_b.jpg', 'https://www.flickr.com/photos/7382882@N03/3668139486', 'Comicbase', 'Coastal town and beach at Nerja.', 'Nerja Beach']
      ],
      c7: [
        ['google_caves_nerja_01.jpg', 'https://live.staticflickr.com/8057/8183059451_cf1f36fcfa_b.jpg', 'https://www.flickr.com/photos/26300494@N07/8183059451', 'stevekeiretsu', 'Stalactites inside the Caves of Nerja.', 'Nerja Caves'],
        ['google_caves_nerja_chamber_02.jpg', 'https://live.staticflickr.com/8490/8183057723_371a9cf569_b.jpg', 'https://www.flickr.com/photos/26300494@N07/8183057723', 'stevekeiretsu', 'Large chamber in the Caves of Nerja.', 'Cave Chamber'],
        ['google_burriana_beach_03.jpg', 'https://live.staticflickr.com/8034/28555131503_b0d6d00b8d_b.jpg', 'https://www.flickr.com/photos/69474058@N03/28555131503', 'Leo P. Hidalgo', 'Burriana Beach in Nerja.', 'Burriana Beach']
      ],
      c8: [
        ['google_maro_cerro_gordo_01.jpg', 'https://upload.wikimedia.org/wikipedia/commons/6/65/Maro_Cerro_Gordo.jpg', 'https://commons.wikimedia.org/w/index.php?curid=107288709', 'UnrealMadrid', 'Cliffs and coves at Maro Cerro Gordo.', 'Maro Cliffs'],
        ['google_acantilados_maro_02.jpg', 'https://live.staticflickr.com/3109/2832047350_93b30fa8a3_b.jpg', 'https://www.flickr.com/photos/10496699@N02/2832047350', 'Maximo Lopez', 'Sea cliffs of Maro Cerro Gordo.', 'Sea Cliffs'],
        ['google_maro_nerja_03.jpg', 'https://live.staticflickr.com/65535/52682490584_f0661233c7_b.jpg', 'https://www.flickr.com/photos/12276997@N06/52682490584', 'Rens Kokke', 'Rocky coastline at Maro Cerro Gordo near Nerja.', 'Maro Coast']
      ],
      c9: [
        ['google_malaga_alcazaba_01.jpg', 'https://live.staticflickr.com/7506/15827976175_c1c9e3c444_b.jpg', 'https://www.flickr.com/photos/47309201@N02/15827976175', 'Ronny Siegel', 'Malaga Alcazaba walls and city view.', 'Malaga Alcazaba'],
        ['google_malaga_alcazaba_wide_02.jpg', 'https://live.staticflickr.com/65535/51372573927_d2a270406a_b.jpg', 'https://www.flickr.com/photos/75487768@N04/51372573927', 'barnyz', 'Alcazaba fortress in Malaga.', 'Fortress Walls'],
        ['google_malagueta_beach_03.jpg', 'https://live.staticflickr.com/4776/38997141200_acdc56c686_b.jpg', 'https://www.flickr.com/photos/152596243@N08/38997141200', 'schwanhals', 'La Malagueta beach in Malaga.', 'Malagueta Beach']
      ],
      c10: [
        ['google_frigiliana_street_01.jpg', 'https://live.staticflickr.com/3934/15280103357_6386974c8a_b.jpg', 'https://www.flickr.com/photos/33363480@N05/15280103357', 'Nick Kenrick', 'Whitewashed street in Frigiliana.', 'Frigiliana Street'],
        ['google_frigiliana_white_village_02.jpg', 'https://live.staticflickr.com/3933/15466679705_32eaf8bf2a_b.jpg', 'https://www.flickr.com/photos/33363480@N05/15466679705', 'Nick Kenrick', 'Flower-lined lane in Frigiliana.', 'White Village'],
        ['google_frigiliana_andalusia_03.jpg', 'https://live.staticflickr.com/2946/15280037378_80bba43c06_b.jpg', 'https://www.flickr.com/photos/33363480@N05/15280037378', 'Nick Kenrick', 'White village architecture in Frigiliana.', 'Village Lane']
      ],
      c11: [
        ['google_aqualand_torremolinos_01.jpg', 'https://live.staticflickr.com/3031/2702871917_c927dc3895_b.jpg', 'https://www.flickr.com/photos/28958255@N04/2702871917', 'jm00092', 'Water slides at Aqualand Torremolinos.', 'Aqualand Slides'],
        ['google_costa_del_sol_beach_02.jpg', 'https://live.staticflickr.com/3174/2713479060_0105ddccd3_b.jpg', 'https://www.flickr.com/photos/99297404@N00/2713479060', 'peep_squeak', 'Sandy Costa del Sol beach day.', 'Costa del Sol'],
        ['google_marbella_beach_03.jpg', 'https://live.staticflickr.com/3759/12163538226_2a78ff901f_b.jpg', 'https://www.flickr.com/photos/97402086@N00/12163538226', 'nan palmero', 'Marbella beach on the Costa del Sol.', 'Marbella Beach']
      ],
      c12: [
        ['google_playa_torrecilla_01.jpg', 'https://live.staticflickr.com/7167/6400130117_91d2707938_b.jpg', 'https://www.flickr.com/photos/35237101276@N01/6400130117', 'fembat', 'Playa Torrecilla beach in Nerja.', 'Torrecilla Beach'],
        ['google_playa_torrecilla_wide_02.jpg', 'https://live.staticflickr.com/8105/8480702376_8377e077a1_b.jpg', 'https://www.flickr.com/photos/35237101276@N01/8480702376', 'fembat', 'Wide view of Playa Torrecilla Nerja.', 'Torrecilla Wide'],
        ['google_playa_caletilla_03.jpg', 'https://live.staticflickr.com/7065/7152728635_57e89fb061_b.jpg', 'https://www.flickr.com/photos/14016143@N06/7152728635', 'Chris Juden', 'Playa de la Caletilla in Nerja.', 'Caletilla Beach']
      ]
    }
  },
  'sardinia-corsica': {
    carousels: {
      c1: [
        ['google_alghero_bastioni_01.jpg', 'https://live.staticflickr.com/3489/3839025703_f1e2945a3c_b.jpg', 'https://www.flickr.com/photos/59422190@N00/3839025703', 'Michela Simoncini', 'Alghero sea walls at sunset.', 'Alghero Bastioni'],
        ['google_alghero_bastioni_wide_02.jpg', 'https://upload.wikimedia.org/wikipedia/commons/8/88/Alghero_bastioni_c_o.jpg', 'https://commons.wikimedia.org/w/index.php?curid=11617493', 'jimmyroq', 'Wide view of Alghero bastioni.', 'Sea Walls'],
        ['google_alghero_sunset_03.jpg', 'https://live.staticflickr.com/1383/714207605_5c0ba40d32_b.jpg', 'https://www.flickr.com/photos/20252088@N00/714207605', 'Goodintention', 'Sunset over Alghero old town waterfront.', 'Alghero Sunset']
      ],
      c2: [
        ['google_neptunes_grotto_01.jpg', 'https://live.staticflickr.com/6220/6277885189_bf2bdba943_b.jpg', 'https://www.flickr.com/photos/53857992@N06/6277885189', 'Jonybraker', 'Interior of Neptune Grotto at Capo Caccia.', 'Neptune Grotto'],
        ['google_capo_caccia_grotto_02.jpg', 'https://upload.wikimedia.org/wikipedia/commons/a/a8/%2BDie_Neptungrotte_Am_Capo_Caccia_bei_Alghero._27.jpg', 'https://commons.wikimedia.org/w/index.php?curid=192819020', 'Holger Uwe Schmitt', 'Limestone formations in Neptune Grotto.', 'Cave Formations'],
        ['google_neptune_grotto_cave_03.jpg', 'https://upload.wikimedia.org/wikipedia/commons/9/9e/%2BDie_Neptungrotte_Am_Capo_Caccia_bei_Alghero._28.jpg', 'https://commons.wikimedia.org/w/index.php?curid=192819024', 'Holger Uwe Schmitt', 'Cave chamber at Neptune Grotto near Alghero.', 'Grotto Chamber']
      ],
      c3: [
        ['google_la_pelosa_01.jpg', 'https://live.staticflickr.com/1628/24167750496_7e32404667_b.jpg', 'https://www.flickr.com/photos/43830692@N04/24167750496', 'Tommie Hansen', 'Turquoise water at La Pelosa beach.', 'La Pelosa'],
        ['google_la_pelosa_stintino_02.jpg', 'https://live.staticflickr.com/1476/23755969339_cf86ea8f1a_b.jpg', 'https://www.flickr.com/photos/43830692@N04/23755969339', 'Tommie Hansen', 'View of La Pelosa in Stintino.', 'Stintino Water'],
        ['google_la_pelosa_tower_03.jpg', 'https://live.staticflickr.com/3127/2836342774_0bb364afc2_b.jpg', 'https://www.flickr.com/photos/27378944@N05/2836342774', 'Claudio Nichele', 'La Pelosa beach and shallow blue water.', 'Pelosa Tower']
      ],
      c4: [
        ['google_santa_teresa_ferry_01.jpg', 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Santa_Teresa_Gallura_ferry.jpg', 'https://commons.wikimedia.org/w/index.php?curid=61301207', 'Tatyana Peshkova', 'Ferry at Santa Teresa Gallura.', 'Santa Teresa Ferry'],
        ['google_bonifacio_ferry_02.jpg', 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Santa_Teresa_Gallura_ferry_Ichnusa_dans_les_bouches_de_Bonifacio.jpg', 'https://commons.wikimedia.org/w/index.php?curid=52425739', 'Pierre Bona', 'Ichnusa ferry in the Strait of Bonifacio.', 'Bonifacio Ferry'],
        ['google_ferry_route_03.jpg', 'https://live.staticflickr.com/4511/23726367578_669b24040f_b.jpg', 'https://www.flickr.com/photos/152870410@N04/23726367578', 'pa.wa', 'Ferry between Santa Teresa Gallura and Bonifacio.', 'Ferry Crossing']
      ],
      c5: [
        ['google_bonifacio_cliffs_01.jpg', 'https://live.staticflickr.com/7535/28055462521_f0482be69f_b.jpg', 'https://www.flickr.com/photos/111970103@N07/28055462521', 'Voyages Lambert', 'Bonifacio old town on limestone cliffs.', 'Bonifacio Cliffs'],
        ['google_bonifacio_old_town_02.jpg', 'https://live.staticflickr.com/7454/27229752194_f0c3bd3810_b.jpg', 'https://www.flickr.com/photos/111970103@N07/27229752194', 'Voyages Lambert', 'Clifftop buildings in Bonifacio Corsica.', 'Old Town'],
        ['google_bonifacio_panorama_03.jpg', 'https://live.staticflickr.com/7683/27518100513_f71025b016_b.jpg', 'https://www.flickr.com/photos/111970103@N07/27518100513', 'Voyages Lambert', 'Panorama of Bonifacio above the sea.', 'Bonifacio Panorama']
      ],
      c6: [
        ['google_rondinara_01.jpg', 'https://live.staticflickr.com/129/329505354_dbbcaec655_b.jpg', 'https://www.flickr.com/photos/60573183@N00/329505354', 'ben7va', 'Rondinara beach from above.', 'Rondinara'],
        ['google_rondinara_bay_02.jpg', 'https://live.staticflickr.com/65535/48023406626_b0da2721b3_b.jpg', 'https://www.flickr.com/photos/133196042@N05/48023406626', 'Laurent Simon', 'Curved bay at Rondinara beach.', 'Rondinara Bay'],
        ['google_petit_sperone_03.jpg', 'https://live.staticflickr.com/1520/25507056215_b53a51ebf9_b.jpg', 'https://www.flickr.com/photos/36501387@N08/25507056215', 'bonacherajf', 'Clear water at Petit Sperone beach.', 'Petit Sperone']
      ],
      c7: [
        ['google_pedra_longa_01.jpg', 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Baunei_Pedra_Longa.jpg', 'https://commons.wikimedia.org/w/index.php?curid=1175289', 'Mauro Mereu', 'Pedra Longa sea stack near Baunei.', 'Pedra Longa'],
        ['google_pedra_longa_coast_02.jpg', 'https://live.staticflickr.com/5607/15742172352_a375db350d_b.jpg', 'https://www.flickr.com/photos/102612035@N04/15742172352', 'augusto.cherchi', 'Coastline at Sa Pedra Longa.', 'Pedra Coast'],
        ['google_santa_maria_navarrese_03.jpg', 'https://live.staticflickr.com/65535/54259975040_cbaa5b5e2b_b.jpg', 'https://www.flickr.com/photos/12276997@N06/54259975040', 'Rens Kokke', 'Rocky shore near Pedra Longa.', 'Rocky Shore']
      ],
      c8: [
        ['google_cala_goloritze_01.jpg', 'https://live.staticflickr.com/628/22498467195_0990a392db_b.jpg', 'https://www.flickr.com/photos/82622112@N00/22498467195', 'unukorno', 'Cala Goloritze cove in Sardinia.', 'Cala Goloritze'],
        ['google_cala_goloritze_hike_02.jpg', 'https://live.staticflickr.com/5665/22498451295_75e83ccd33_b.jpg', 'https://www.flickr.com/photos/82622112@N00/22498451295', 'unukorno', 'Cliff and beach at Cala Goloritze.', 'Goloritze Cliff'],
        ['google_cala_goloritze_water_03.jpg', 'https://live.staticflickr.com/5760/22310723668_e4de5a3471_b.jpg', 'https://www.flickr.com/photos/82622112@N00/22310723668', 'unukorno', 'Turquoise water at Cala Goloritze.', 'Turquoise Cove']
      ],
      c9: [
        ['google_cala_mariolu_01.jpg', 'https://live.staticflickr.com/5523/18874039771_a8ac79262c_b.jpg', 'https://www.flickr.com/photos/40351463@N00/18874039771', 'paula soler-moya', 'Clear water at Cala Mariolu.', 'Cala Mariolu'],
        ['google_cala_luna_02.jpg', 'https://live.staticflickr.com/5524/18681657070_745c6aab1c_b.jpg', 'https://www.flickr.com/photos/40351463@N00/18681657070', 'paula soler-moya', 'Beach and cave openings at Cala Luna.', 'Cala Luna'],
        ['google_cala_luna_gulf_03.jpg', 'https://live.staticflickr.com/5339/18872051921_504bcbfbc7_b.jpg', 'https://www.flickr.com/photos/40351463@N00/18872051921', 'paula soler-moya', 'Cala Luna along the Gulf of Orosei.', 'Orosei Gulf']
      ],
      c10: [
        ['google_gorropu_01.jpg', 'https://live.staticflickr.com/8383/8668296301_58be0698ea_b.jpg', 'https://www.flickr.com/photos/69209577@N00/8668296301', 'eworm', 'Gola di Gorropu canyon walls.', 'Gorropu Canyon'],
        ['google_gorropu_canyon_02.jpg', 'https://upload.wikimedia.org/wikipedia/commons/0/09/Gola_di_Gorropu_06.jpg', 'https://commons.wikimedia.org/w/index.php?curid=44694047', 'Unukorno', 'Rocky path through Gorropu canyon.', 'Canyon Path'],
        ['google_gorropu_dorgali_03.jpg', 'https://upload.wikimedia.org/wikipedia/commons/3/34/Gola_di_Gorropu_05.jpg', 'https://commons.wikimedia.org/w/index.php?curid=44694048', 'Unukorno', 'Limestone boulders in Gorropu canyon.', 'Limestone Gorge']
      ],
      c11: [
        ['google_cagliari_castello_01.jpg', 'https://live.staticflickr.com/4127/4948662951_50d2f5d86e_b.jpg', 'https://www.flickr.com/photos/61495861@N00/4948662951', 'Antonio_Trogu', 'Cagliari Castello district.', 'Cagliari Castello'],
        ['google_bastione_remy_02.jpg', 'https://live.staticflickr.com/3883/14896173587_5202feaaac_b.jpg', 'https://www.flickr.com/photos/36579585@N07/14896173587', 'Andrea Sensi', 'Bastione Saint Remy in Cagliari.', 'Bastione Remy'],
        ['google_bastione_santa_croce_03.jpg', 'https://live.staticflickr.com/486/20104996629_0074dfba59_b.jpg', 'https://www.flickr.com/photos/128242947@N03/20104996629', 'Carlo Murtas', 'Bastione Santa Croce in Castello.', 'Santa Croce']
      ],
      c12: [
        ['google_poetto_01.jpg', 'https://live.staticflickr.com/2386/2498307625_113699a670_b.jpg', 'https://www.flickr.com/photos/68474627@N00/2498307625', 'clurr', 'Poetto beach in Cagliari.', 'Poetto Beach'],
        ['google_sella_del_diavolo_02.jpg', 'https://live.staticflickr.com/6140/6002892584_2716dd7c7e_b.jpg', 'https://www.flickr.com/photos/52514328@N05/6002892584', 'Carlo Murgia', 'Sella del Diavolo above Cagliari.', 'Sella del Diavolo'],
        ['google_poetto_sella_03.jpg', 'https://live.staticflickr.com/3148/2805891974_7719b8f899_b.jpg', 'https://www.flickr.com/photos/20896325@N00/2805891974', 'cristianocani', 'Sella del Diavolo and Poetto tower.', 'Poetto Tower']
      ],
      c13: [
        ['google_porto_giunco_01.jpg', 'https://live.staticflickr.com/5477/18201329184_0fa5b2885d_b.jpg', 'https://www.flickr.com/photos/72923835@N00/18201329184', 'gabriele valeria e mauro', 'Porto Giunco beach at Villasimius.', 'Porto Giunco'],
        ['google_porto_giunco_water_02.jpg', 'https://live.staticflickr.com/3813/18201463054_e45133c4b9_b.jpg', 'https://www.flickr.com/photos/72923835@N00/18201463054', 'gabriele valeria e mauro', 'Turquoise shoreline at Porto Giunco.', 'Giunco Water'],
        ['google_porto_giunco_tower_03.jpg', 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Torre_di_Porto_Giunco_-_Villasimius.jpg', 'https://commons.wikimedia.org/w/index.php?curid=168205908', 'Daniela M.', 'Porto Giunco tower near Villasimius.', 'Giunco Tower']
      ],
      c14: [
        ['google_nora_bathhouse_01.jpg', 'https://live.staticflickr.com/2161/2498321105_1fc4ca9e8e_b.jpg', 'https://www.flickr.com/photos/68474627@N00/2498321105', 'clurr', 'Roman bathhouse ruins at Nora.', 'Nora Bathhouse'],
        ['google_nora_mosaic_02.jpg', 'https://live.staticflickr.com/3170/2499147692_a8f3c7e1a8_b.jpg', 'https://www.flickr.com/photos/68474627@N00/2499147692', 'clurr', 'Mosaic flooring at Nora archaeological site.', 'Nora Mosaic'],
        ['google_nora_roman_ruins_03.jpg', 'https://live.staticflickr.com/2007/2498321917_1778520c55_b.jpg', 'https://www.flickr.com/photos/68474627@N00/2498321917', 'clurr', 'Roman ruins at Nora near Pula.', 'Nora Ruins']
      ]
    }
  }
};

const set = sets[slug];
if (!set) {
  console.error(`No refresh data for ${slug}`);
  process.exit(1);
}

const dir = join('assets', 'img', slug);
mkdirSync(dir, { recursive: true });
mkdirSync(join('/tmp', 'pics', slug), { recursive: true });

const plan = { carousels: {}, htmlReplacements: {}, indexCard: null };
const failed = [];

for (const [cid, rows] of Object.entries(set.carousels)) {
  plan.carousels[cid] = [];
  const sheetDir = join('/tmp', 'pics', slug, cid);
  mkdirSync(sheetDir, { recursive: true });
  for (const [file, imageUrl, sourcePage, credit, alt, captionTitle] of rows) {
    const out = join(dir, file);
    try {
      execFileSync('curl', ['-L', '-A', 'Mozilla/5.0', '--max-time', '40', '-o', out, imageUrl], { stdio: 'ignore' });
      execFileSync('cp', [out, join(sheetDir, basename(file))]);
      const kind = execFileSync('file', ['-b', out], { encoding: 'utf8' });
      const size = Number(execFileSync('stat', ['-f', '%z', out], { encoding: 'utf8' }).trim());
      if (!/image|JPEG|PNG/i.test(kind) || size < 10000) throw new Error(`${kind.trim()} ${size} bytes`);
      plan.carousels[cid].push({
        file,
        alt,
        captionTitle,
        credit: `${credit} · Google Images source`,
        sourcePage,
        discoveredVia: 'Google Images'
      });
    } catch (err) {
      failed.push({ cid, file, imageUrl, error: err.message });
    }
  }
  try {
    execFileSync('montage', [join(sheetDir, '*.jpg'), '-tile', '4x', '-geometry', '400x300+6+6', '-background', '#111', '-title', `${slug} ${cid}`, join('/tmp', 'pics', slug, `${cid}_sheet.jpg`)], { shell: true, stdio: 'ignore' });
  } catch {
    // Contact sheet generation is a visual aid; validation below gates the files.
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
