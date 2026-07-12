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
.score-axis-list{max-width:980px;margin:22px auto 0;padding:0;list-style:none;border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:0 10px 28px rgba(30,32,28,.08);overflow:hidden}.score-axis-list li{display:grid;grid-template-columns:minmax(150px,1fr) auto;align-items:center;gap:16px;padding:12px 16px;border-bottom:1px solid var(--line)}.score-axis-list li:last-child{border-bottom:0}.score-axis-list .axis-name{color:var(--muted);font-size:.78rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.score-axis-list .axis-value{display:flex;align-items:center;gap:8px;font-family:"Fraunces",serif;font-size:1.18rem;font-weight:700}.score-axis-list .verification-badge{margin-left:0}@media(max-width:560px){.score-axis-list li{grid-template-columns:1fr;gap:5px}.score-axis-list .axis-value{justify-content:space-between}}
.composer-map-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:14px}.composer-map-grid a{padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:inherit;text-decoration:none}.composer-map-grid strong,.composer-map-grid span{display:block}.composer-map-grid span{color:var(--muted);font-size:.75rem;text-transform:uppercase}
@media(min-width:821px){body>.preview.composer-preview{height:clamp(520px,64vh,680px);min-height:0;align-items:stretch}.composer-preview .pv-pane{min-height:0;padding-top:clamp(22px,3vh,34px);padding-bottom:clamp(20px,3vh,32px)}.composer-preview .pvcar,.composer-preview .pvcar .track,.composer-preview .pvcar figure,.composer-preview .pvcar img{height:100%!important;min-height:100%!important}.composer-preview .pvcar img{object-fit:cover}.composer-preview .pv-stats{margin-top:18px}.composer-preview .pv-split{margin-top:16px}}
`;
fs.writeFileSync(path.join(root, 'assets/css/composer-shell.css'), `${css}${additions}\n`);
console.log('wrote assets/css/composer-shell.css from canonical itinerary shell');
