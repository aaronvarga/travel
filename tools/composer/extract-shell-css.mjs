import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const root = path.resolve(import.meta.dirname, '../..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/madeira-crete/main.json'), 'utf8'));
const shell = (source.parts ?? []).find((part) => part.t === 'raw' && /<!doctype html>/i.test(part.html ?? ''));
if (!shell) throw new Error('canonical itinerary shell was not found');
const $ = load(shell.html, { decodeEntities: false });
const css = $('style').map((_, element) => $(element).html()).get().join('\n\n');
const additions = `
/* Composer verification states */
.verification-badge{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:4px 9px;border:1px solid currentColor;border-radius:999px;font:900 .62rem/1 "Inter",ui-sans-serif,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;vertical-align:middle}
.verification-badge.estimated{color:#8a641e;background:#fff4d6}.verification-badge.unverified{color:#9d422f;background:#fff0eb}.verification-badge.verified{color:#28653a;background:#eaf6ed}
.verification-empty{max-width:980px;margin:0 auto;padding:28px;border:2px dashed rgba(107,100,90,.38);border-radius:16px;background:rgba(255,253,248,.52);text-align:center}.verification-empty strong{display:block;margin-bottom:5px;font-family:"Fraunces","Georgia",serif;font-size:1.18rem}.verification-empty p{max-width:660px;margin:0 auto;color:var(--muted)}
.composer-status{margin:18px auto 0;padding:13px 16px;border:1px solid rgba(217,164,65,.5);border-radius:12px;background:#fff8e6;color:#5c4a1e;font-size:.86rem;line-height:1.5}.composer-status a{font-weight:800}
.score-axis-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px}.score-axis-grid article{padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:0 10px 28px rgba(30,32,28,.08)}.score-axis-grid strong{display:block;font-family:"Fraunces",serif;font-size:1.65rem}.score-axis-grid span{color:var(--muted);font-size:.75rem;font-weight:900;text-transform:uppercase}
.composer-map-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:14px}.composer-map-grid a{padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:inherit;text-decoration:none}.composer-map-grid strong,.composer-map-grid span{display:block}.composer-map-grid span{color:var(--muted);font-size:.75rem;text-transform:uppercase}
`;
fs.writeFileSync(path.join(root, 'assets/css/composer-shell.css'), `${css}${additions}\n`);
console.log('wrote assets/css/composer-shell.css from canonical itinerary shell');
