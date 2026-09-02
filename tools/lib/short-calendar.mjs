const HOURS = [6, 8, 10, 12, 14, 16, 18, 20, 22];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const hourToRow = (hour) => Math.max(1, Math.min(9, Math.round((hour - 6) / 2) + 1));
const timeLabel = (hour) => `${hour > 12 ? hour - 12 : hour}${hour < 12 ? 'a' : 'p'}`;
const parseTime = (value) => {
  if (typeof value === 'number') return value;
  const match = String(value).trim().match(/^(\d{1,2})([ap])$/i);
  if (!match) throw new Error(`Unsupported calendar time: ${value}`);
  let hour = Number(match[1]);
  if (match[2].toLowerCase() === 'p' && hour !== 12) hour += 12;
  if (match[2].toLowerCase() === 'a' && hour === 12) hour = 0;
  return hour;
};

const defaultDuration = { air: 5, car: 2, hike: 4, water: 3, town: 3, rest: 3 };

function normalizeDays(days) {
  return days.map((day) => {
    if (!Array.isArray(day)) return day;
    const [dow, dateLabel, events] = day;
    const dayNumber = Number(dateLabel.match(/\d+/)?.[0]);
    return {
      dow,
      date: [6, dayNumber],
      blocks: events.map(([act, start, label, end]) => {
        const startHour = parseTime(start);
        return { act, start: startHour, end: end ? parseTime(end) : Math.min(22, startHour + (defaultDuration[act] || 3)), label };
      }),
    };
  });
}

export function shortCalendar({ eyebrow, title, intro, ariaLabel, days, legend = {} }) {
  const tripDays = normalizeDays(days);
  const columns = tripDays.length + 1;
  const minWidth = 64 + tripDays.length * 104;
  const columnWidth = 100 / columns;
  const gridColumns = `64px repeat(${tripDays.length},minmax(104px,1fr))`;
  const headers = tripDays.map(({ date: [month, day], dow }) => {
    const weekday = dow || DOW[new Date(Date.UTC(2027, month - 1, day)).getUTCDay()];
    return `<div class="dh trip"><span class="dow">${weekday}</span><span class="dnum">${day}</span></div>`;
  }).join('');
  const timeLabels = HOURS.map((hour, index) => `<div class="tl" style="grid-row:${index + 1}">${timeLabel(hour)}</div>`).join('');
  const events = tripDays.flatMap((day, dayIndex) => day.blocks.map((block) => {
    const start = hourToRow(block.start);
    const end = Math.max(start + 1, Math.min(10, hourToRow(block.end) + (block.end % 2 ? 1 : 0)));
    const small = end - start === 1 ? ' sm' : '';
    return `<div class="ev ${block.act}${small}" style="grid-column:${dayIndex + 2};grid-row:${start}/${end}">${block.label}</div>`;
  })).join('');
  const labels = {
    air: 'Air', car: 'Drive / transfer', hike: 'Nature', water: 'Water', town: 'Town', rest: 'Rest / buffer', ...legend,
  };

  return `<section id="calendar" class="divider continuous-calendar">
    <div class="section-label"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2><p>${intro}</p></div>
    <style>
      .continuous-calendar .cal-legend{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 16px}
      .continuous-calendar .cal-legend span{display:inline-flex;align-items:center;gap:7px;font-size:.78rem;font-weight:700;color:var(--ink)}
      .continuous-calendar .cal-legend i{width:16px;height:16px;border-radius:5px;display:inline-block}
      .continuous-calendar .lg-air{background:#3d4d74}.continuous-calendar .lg-car{background:var(--gold)}
      .continuous-calendar .lg-hike{background:var(--c3)}.continuous-calendar .lg-water{background:var(--c1)}.continuous-calendar .lg-town{background:var(--c2)}.continuous-calendar .lg-rest{background:#8a857c}
      .continuous-calendar .cal-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding:0 0 6px}
      .continuous-calendar .cal-week{display:block;width:100%;min-width:${minWidth}px;margin:0 0 22px;border:0;border-radius:0;overflow:visible;background:transparent;box-shadow:none;grid-template-columns:none;grid-template-rows:none}
      .continuous-calendar .cal-hd{display:grid;gap:0;place-items:stretch;padding:0;border:0;background:transparent;font-size:inherit;font-weight:inherit;letter-spacing:normal;text-transform:none}
      .continuous-calendar .cal-hd .dh{padding:6px 4px;text-align:center;border-bottom:2px solid var(--line)}
      .continuous-calendar .cal-hd .dh .dow{display:block;font-size:.66rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
      .continuous-calendar .cal-hd .dh .dnum{display:block;font-size:1.02rem;font-weight:800;color:var(--c1);line-height:1.1}
      .continuous-calendar .cal-hd .dh.trip{background:rgba(31,111,120,.06)}
      .continuous-calendar .cal-hd .gut{border-bottom:2px solid var(--line)}
      .continuous-calendar .cal-bd{display:grid;grid-template-rows:repeat(9,32px);position:relative;border:0;background-color:transparent;background-image:repeating-linear-gradient(to bottom,transparent 0 31px,var(--line) 31px 32px),repeating-linear-gradient(to right,transparent 0 calc(${columnWidth}% - 1px),var(--line) calc(${columnWidth}% - 1px) ${columnWidth}%)}
      .continuous-calendar .cal-bd .tl{grid-column:1;font-size:.62rem;font-weight:700;color:var(--muted);padding:2px 4px 0 4px;text-align:right}
      .continuous-calendar .ev{margin:2px;border-radius:6px;padding:3px 6px;font-size:.68rem;line-height:1.14;font-weight:700;color:#fff;overflow:hidden;position:relative;z-index:2;box-shadow:0 1px 3px rgba(30,32,28,.2);display:flex;align-items:flex-start}
      .continuous-calendar .ev.sm{font-size:.62rem;align-items:center}.continuous-calendar .ev.air{background:#3d4d74}.continuous-calendar .ev.car{background:var(--gold);color:#3a2f12}.continuous-calendar .ev.hike{background:var(--c3)}.continuous-calendar .ev.water{background:var(--c1)}.continuous-calendar .ev.town{background:var(--c2)}.continuous-calendar .ev.rest{background:#8a857c}
    </style>
    <div class="cal-legend">${Object.entries(labels).map(([kind, label]) => `<span><i class="lg-${kind}"></i>${label}</span>`).join('')}</div>
    <div class="cal-scroll" aria-label="${ariaLabel}"><div class="cal-week" data-trip-days="${tripDays.length}"><div class="cal-hd" style="grid-template-columns:${gridColumns}"><div class="gut"></div>${headers}</div><div class="cal-bd" style="grid-template-columns:${gridColumns}">${timeLabels}${events}</div></div></div>
  </section>`;
}
