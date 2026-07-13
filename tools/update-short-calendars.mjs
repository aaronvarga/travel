#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { shortCalendar } from './lib/short-calendar.mjs';

const root = path.resolve(import.meta.dirname, '..');
const configs = {
  'short-algarve': {
    eyebrow: 'Your Travel Week', title: 'Nine days from Pittsburgh and back',
    intro: 'The middle of the week stays flexible so wind, surf or family energy can change the order without changing hotels. Times are rough planning cues until 2027 schedules appear.',
    ariaLabel: 'Algarve trip calendar, June 12 through June 20, 2027', legend: { car: 'Transfer', hike: 'Walk' },
    days: [['Sat','Jun 12',[['air','4p','Depart PIT']]],['Sun','Jun 13',[['air','8a','Arrive FAO'],['car','11a','Transfer'],['rest','2p','Unpack + pool']]],['Mon','Jun 14',[['town','9a','Lagos old town'],['water','2p','Meia Praia']]],['Tue','Jun 15',[['hike','9a','Ponta boardwalk'],['water','1p','Boat / Camilo']]],['Wed','Jun 16',[['car','8a','Sagres outing'],['hike','10a','Fortress + cliffs']]],['Thu','Jun 17',[['rest','10a','Pool + reset'],['rest','4p','Weather buffer']]],['Fri','Jun 18',[['water','10a','Praia da Luz'],['town','2p','Burgau']]],['Sat','Jun 19',[['water','10a','Favorite repeat'],['rest','4p','Pack']]],['Sun','Jun 20',[['car','6a','Transfer to FAO'],['air','9a','Fly home']]]],
  },
  'short-portugal': {
    eyebrow: 'Your Travel Week', title: 'From Pittsburgh to Portugal and back',
    intro: 'See how the city days, train ride and slower Algarve days fit together. Times are a rough guide until the 2027 flight and rail schedules are published.',
    ariaLabel: 'Portugal trip calendar, June 12 through June 20, 2027', legend: { car: 'Rail / transfer', hike: 'Walk' },
    days: [['Sat','Jun 12',[['air','4p','Depart PIT']]],['Sun','Jun 13',[['air','8a','Arrive LIS'],['rest','2p','Soft landing']]],['Mon','Jun 14',[['town','9a','Sintra'],['rest','5p','Pack + dinner']]],['Tue','Jun 15',[['car','8a','Train to Lagos'],['water','4p','Pool / beach']]],['Wed','Jun 16',[['hike','8a','Ponta cliffs'],['water','1p','Boat / beach']]],['Thu','Jun 17',[['water','9a','Pool + Meia Praia'],['rest','4p','Weather buffer']]],['Fri','Jun 18',[['water','9a','Marinha / Lagos'],['rest','4p','Easy evening']]],['Sat','Jun 19',[['water','9a','Pool / beach buffer'],['rest','4p','Pack']]],['Sun','Jun 20',[['car','6a','Transfer to FAO'],['air','9a','Fly home']]]],
  },
  'short-madeira': {
    eyebrow: 'Daily Rhythm', title: 'How the week unfolds',
    intro: 'Early starts protect the mountain and levada days; the Funchal reset and final flex day give the family room to slow down or follow the best weather.',
    ariaLabel: 'Madeira trip calendar, June 11 through June 19, 2027', legend: { car: 'Drive', hike: 'Hike' },
    days: [['Fri','Jun 11',[['air','6p','Depart PIT']]],['Sat','Jun 12',[['air','6a','Arrive FNC'],['town','4p','Funchal']]],['Sun','Jun 13',[['car','6a','Mountain drive'],['hike','8a','Pico + Balcões'],['rest','4p','Recover']]],['Mon','Jun 14',[['car','8a','West loop'],['hike','10a','Fanal'],['water','2p','Porto Moniz']]],['Tue','Jun 15',[['town','10a','Funchal'],['water','3p','Lido']]],['Wed','Jun 16',[['car','7a','Rabaçal drive'],['hike','9a','PR6 + Risco']]],['Thu','Jun 17',[['hike','8a','Ponta ridge'],['water','2p','Machico']]],['Fri','Jun 18',[['rest','10a','Final flex'],['rest','4p','Pack']]],['Sat','Jun 19',[['air','6a','Fly home']]]],
  },
  'short-iceland': {
    eyebrow: 'Your Days in Iceland', title: 'Nine days, from takeoff to homecoming',
    intro: 'See when the drives, waterfalls, geothermal swims and recovery time happen across the trip. Swipe sideways on a phone to follow the full journey.',
    ariaLabel: 'Iceland trip calendar, June 13 through June 21, 2027', legend: { car: 'Drive', hike: 'Nature', water: 'Warm water', rest: 'Buffer' },
    days: [
      {date:[6,13],blocks:[{act:'air',start:18,end:22,label:'PIT → KEF'}]},
      {date:[6,14],blocks:[{act:'car',start:8,end:10,label:'KEF → Reykjavík'},{act:'town',start:11,end:15,label:'Old town'},{act:'water',start:16,end:18,label:'Warm pool'}]},
      {date:[6,15],blocks:[{act:'town',start:9,end:15,label:'Harbour + city'},{act:'rest',start:16,end:19,label:'Free evening'}]},
      {date:[6,16],blocks:[{act:'car',start:8,end:11,label:'Golden Circle'},{act:'hike',start:11,end:15,label:'Geysers + falls'},{act:'water',start:15,end:17,label:'Secret Lagoon'},{act:'car',start:17,end:19,label:'→ Hella'}]},
      {date:[6,17],blocks:[{act:'car',start:9,end:11,label:'Waterfall corridor'},{act:'hike',start:11,end:17,label:'Waterfalls'}]},
      {date:[6,18],blocks:[{act:'hike',start:9,end:13,label:'Glacier'},{act:'hike',start:14,end:17,label:'Black coast'}]},
      {date:[6,19],blocks:[{act:'rest',start:9,end:15,label:'Weather buffer'},{act:'water',start:16,end:18,label:'Local pool'}]},
      {date:[6,20],blocks:[{act:'car',start:9,end:12,label:'Move west'},{act:'hike',start:13,end:17,label:'Reykjanes'}]},
      {date:[6,21],blocks:[{act:'air',start:8,end:17,label:'KEF → PIT'}]},
    ],
  },
};

for (const [slug, config] of Object.entries(configs)) {
  const file = path.join(root, 'src/_data', slug, 'main.json');
  const document = JSON.parse(fs.readFileSync(file, 'utf8'));
  const oldHtml = document.parts[0].html;
  const nextHtml = oldHtml.replace(/<section id="calendar"[\s\S]*?<\/section>/, shortCalendar(config));
  if (nextHtml === oldHtml) throw new Error(`Calendar section not found in ${slug}`);
  document.parts[0].html = nextHtml;
  fs.writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`updated ${slug}`);
}
