import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const DATA_DIR = 'src/_data';
const MARKER = '/* SECTION POLISH 2026-07 */';

const POLISH_CSS = `
${MARKER}
.budget-scroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
.budget-scroll table{width:100%;border-collapse:collapse;table-layout:fixed}
.budget-scroll .budget-tbl,.budget-scroll .cost-table{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);font-size:.9rem}
.budget-tbl th,.budget-tbl td,.cost-table th,.cost-table td{padding:10px 14px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line);overflow-wrap:anywhere}
.budget-tbl th,.cost-table th{background:rgba(31,111,120,.08);font-family:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:850;letter-spacing:0}
.budget-tbl td:last-child,.budget-tbl th:last-child,.cost-table td:last-child,.cost-table th:last-child{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;width:34%}
.budget-tbl tr:last-child td,.cost-table tr:last-child td{border-bottom:0}
.budget-tbl.grand tr.total td,.cost-table.grand tr.total td{background:var(--ink);color:#fff;font-size:1rem;font-weight:850}
#budget .plan-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:22px}
#budget .pcard{border-radius:14px;box-shadow:0 12px 30px rgba(30,32,28,.1)}
#budget .pcard h4{font-size:1.12rem}
#budget .pcard ul,#budget .pcard ol{margin:0;padding:0;list-style:none;display:grid;gap:9px}
#budget .pcard li{position:relative;padding-left:17px;color:var(--muted);font-size:.88rem;line-height:1.48}
#budget .pcard li::before{content:"";position:absolute;left:0;top:.68em;width:6px;height:6px;border-radius:50%;background:var(--gold)}
#budget .pcard li b{color:var(--ink)}
#totals .cost-table tr.total td,#totals .budget-tbl tr.total td{background:var(--ink);color:#fff;font-size:1rem;font-weight:850}
#totals .cost-table td:last-child,#totals .budget-tbl td:last-child{white-space:normal;overflow-wrap:anywhere}
#totals .note,#totals .rate-note{max-width:980px;margin:14px auto 0;color:var(--muted);font-size:.9rem;line-height:1.48}
#balance .cost-table td:first-child,#balance .cost-table th:first-child{width:32%}
#balance .cost-table td:nth-child(2),#balance .cost-table th:nth-child(2){width:96px;text-align:center;white-space:nowrap}
#balance .cost-table td:last-child,#balance .cost-table th:last-child{width:auto;text-align:left;white-space:normal}
#balance .budget-scroll{max-width:none;margin-inline:0}
.status-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.status-col{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 22px;box-shadow:0 12px 30px rgba(30,32,28,.1)}
.status-col h3{margin:0 0 12px;font-size:1.22rem;font-weight:650}
.status-col .row{display:grid;grid-template-columns:minmax(150px,210px) minmax(0,1fr);gap:14px;padding:10px 0;border-bottom:1px solid var(--line);font-size:.9rem}
.status-col .row:last-child{border-bottom:0}
.status-col .row b{display:block;color:var(--ink);line-height:1.25}
.status-col .row span{display:block;color:var(--muted);line-height:1.45}
.field-notes-list{width:100%;margin:0;padding:0;list-style:none;display:grid;gap:0;max-width:none;background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:0 12px 30px rgba(30,32,28,.1);overflow:hidden}
.field-note{display:grid;grid-template-columns:minmax(190px,270px) minmax(0,1fr);gap:18px;padding:17px 20px;border-bottom:1px solid var(--line)}
.field-note:last-child{border-bottom:0}
.field-note h4{margin:0;font-size:1.02rem;font-family:"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:850;line-height:1.25}
.field-note .sub{margin:4px 0 0;color:var(--muted);font-size:.72rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;line-height:1.35}
.field-note .note-body{min-width:0}
.field-note .note-body>p{margin:0;color:var(--muted);font-size:.9rem;line-height:1.5}
.field-note ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}
.field-note li{position:relative;padding-left:15px;color:var(--muted);font-size:.88rem;line-height:1.48}
.field-note li::before{content:"";position:absolute;left:0;top:.7em;width:6px;height:6px;border-radius:50%;background:var(--gold)}
.field-note li.flag::before{background:#c0392b;width:8px;height:8px;top:.62em}
.field-note b{color:var(--ink)}
#tips .tips-list{max-width:none}
@media(max-width:860px){
  #budget .plan-grid,.status-grid{grid-template-columns:1fr}
  .field-note{grid-template-columns:1fr;gap:8px;padding:16px}
  .status-col .row{grid-template-columns:1fr;gap:3px}
}
@media(max-width:620px){
  .budget-tbl th,.budget-tbl td,.cost-table th,.cost-table td{padding:9px 10px;font-size:.84rem}
  .budget-tbl td:last-child,.budget-tbl th:last-child,.cost-table td:last-child,.cost-table th:last-child{width:38%}
}
`;

function allMainJsonFiles() {
  return fs.readdirSync(DATA_DIR)
    .map((name) => path.join(DATA_DIR, name, 'main.json'))
    .filter((file) => fs.existsSync(file))
    .sort();
}

function upsertPolishCss(html) {
  const styleEnd = html.indexOf('</style>');
  if (styleEnd === -1) return html;

  const markerAt = html.indexOf(MARKER);
  if (markerAt !== -1 && markerAt < styleEnd) {
    const before = html.slice(0, markerAt);
    const afterMarker = html.slice(markerAt);
    const nextStyleEnd = afterMarker.indexOf('</style>');
    return before + POLISH_CSS + afterMarker.slice(nextStyleEnd);
  }

  return html.slice(0, styleEnd) + POLISH_CSS + html.slice(styleEnd);
}

function findSection(html, id) {
  const start = html.indexOf(`<section id="${id}"`);
  if (start === -1) return null;

  let depth = 0;
  const tagPattern = /<\/?section\b[^>]*>/g;
  tagPattern.lastIndex = start;
  let match;

  while ((match = tagPattern.exec(html))) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) {
        return { start, end: tagPattern.lastIndex, section: html.slice(start, tagPattern.lastIndex) };
      }
    } else {
      depth += 1;
    }
  }

  return null;
}

function normalizeCostTables(sectionHtml, sectionId) {
  const $ = cheerio.load(sectionHtml, { decodeEntities: false }, false);

  $('table.cost-table').each((_, table) => {
    const $table = $(table);
    const classes = new Set(($table.attr('class') || '').split(/\s+/).filter(Boolean));
    classes.add('budget-tbl');
    if (sectionId === 'totals') classes.add('grand');
    $table.attr('class', [...classes].join(' '));

    $table.find('tr').each((__, row) => {
      const text = $(row).text().replace(/\s+/g, ' ').trim().toLowerCase();
      if (text.includes('grand total')) {
        const rowClasses = new Set(($(row).attr('class') || '').split(/\s+/).filter(Boolean));
        rowClasses.add('total');
        $(row).attr('class', [...rowClasses].join(' '));
      }
    });
  });

  return $.root().html();
}

function normalizeCardGridToList(sectionHtml, sectionSelector, listClass = '') {
  const $ = cheerio.load(sectionHtml, { decodeEntities: false }, false);
  const $section = $(sectionSelector).first();
  const $grid = $section.children('.tips-grid, .plan-grid').first();
  if (!$grid.length || $grid.hasClass('field-notes-list')) return sectionHtml;

  const classes = ['field-notes-list', listClass].filter(Boolean).join(' ');
  const $list = $(`<ul class="${classes}"></ul>`);

  $grid.children('.tipcard, .pcard').each((_, card) => {
    const $card = $(card);
    const $note = $('<li class="field-note"></li>');
    const $head = $('<div class="field-note-head"></div>');
    const $body = $('<div class="note-body"></div>');

    const $title = $card.children('h4').first();
    const $sub = $card.children('p.sub').first();

    if ($title.length) {
      $title.find('.dot').remove();
      $head.append(`<h4>${$title.html()}</h4>`);
    }
    if ($sub.length) {
      $head.append(`<p class="sub">${$sub.html()}</p>`);
    }

    $card.children().each((__, child) => {
      const $child = $(child);
      if ($child.is('h4') || $child.is('p.sub')) return;
      $body.append($child.clone());
    });

    $note.append($head);
    $note.append($body);
    $list.append($note);
  });

  if ($list.children().length) {
    $grid.replaceWith($list);
  }

  return $.root().html();
}

function normalizeSocialSection(sectionHtml) {
  return normalizeCardGridToList(sectionHtml, 'section#social');
}

function normalizeTipsSection(sectionHtml) {
  return normalizeCardGridToList(sectionHtml, 'section#tips', 'tips-list');
}

function normalizeSections(html) {
  let out = html;
  for (const sectionId of ['budget', 'totals', 'timing', 'balance']) {
    const found = findSection(out, sectionId);
    if (!found) continue;
    const updated = normalizeCostTables(found.section, sectionId);
    out = out.slice(0, found.start) + updated + out.slice(found.end);
  }

  const social = findSection(out, 'social');
  if (social) {
    const updated = normalizeSocialSection(normalizeCostTables(social.section, 'social'));
    out = out.slice(0, social.start) + updated + out.slice(social.end);
  }

  const tips = findSection(out, 'tips');
  if (tips) {
    const updated = normalizeTipsSection(normalizeCostTables(tips.section, 'tips'));
    out = out.slice(0, tips.start) + updated + out.slice(tips.end);
  }

  return out;
}

let changed = 0;

for (const file of allMainJsonFiles()) {
  const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  let touched = false;

  for (const part of doc.parts || []) {
    if (!part.html) continue;

    let html = part.html;
    if (html.includes('<style>') && html.includes('</style>')) {
      html = upsertPolishCss(html);
    }
    html = normalizeSections(html);

    if (html !== part.html) {
      part.html = html;
      touched = true;
    }
  }

  if (touched) {
    fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
    changed += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`polished ${changed} itinerary files`);
