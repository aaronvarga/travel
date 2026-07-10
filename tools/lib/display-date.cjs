'use strict';

const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10,
  october: 10, nov: 11, november: 11, dec: 12, december: 12,
};
const MONTH = '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const CROSS_MONTH_RANGE = new RegExp(`\\b${MONTH}\\s+(\\d{1,2})\\s*[-–—]\\s*${MONTH}\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b`, 'gi');
const SAME_MONTH_RANGE = new RegExp(`\\b${MONTH}\\s+(\\d{1,2})\\s*[-–—]\\s*(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b`, 'gi');
const NAMED_DATE = new RegExp(`\\b${MONTH}\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b`, 'gi');

function formatIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return value;
  const [, year, month, day] = match;
  if (!isValidDate(Number(year), Number(month), Number(day))) return value;
  return `${Number(month)}/${Number(day)}/${year}`;
}

function formatIsoDisplayDates(value) {
  return String(value || '').replace(ISO_DATE, (original, year, month, day) => {
    if (!isValidDate(Number(year), Number(month), Number(day))) return original;
    return `${Number(month)}/${Number(day)}/${year}`;
  });
}

function formatDisplayDates(value, defaultYear = 2027) {
  const input = formatIsoDisplayDates(value);
  const years = [...new Set(input.match(/\b20\d{2}\b/g) || [])];
  const contextualYear = years.length === 1 ? Number(years[0]) : Number(defaultYear);
  return input
    .replace(CROSS_MONTH_RANGE, (original, startMonth, startDay, endMonth, endDay, explicitYear) => {
      const year = Number(explicitYear || contextualYear);
      return validNamedRange(startMonth, startDay, endMonth, endDay, year)
        ? `${monthNumber(startMonth)}/${Number(startDay)}/${year}–${monthNumber(endMonth)}/${Number(endDay)}/${year}`
        : original;
    })
    .replace(SAME_MONTH_RANGE, (original, month, startDay, endDay, explicitYear) => {
      const year = Number(explicitYear || contextualYear);
      return validNamedRange(month, startDay, month, endDay, year)
        ? `${monthNumber(month)}/${Number(startDay)}/${year}–${monthNumber(month)}/${Number(endDay)}/${year}`
        : original;
    })
    .replace(NAMED_DATE, (original, month, day, explicitYear) => {
      const year = Number(explicitYear || contextualYear);
      return isValidDate(year, monthNumber(month), Number(day))
        ? `${monthNumber(month)}/${Number(day)}/${year}`
        : original;
    });
}

function formatCompactTravelWindow(window) {
  if (!Array.isArray(window) || window.length !== 2) return null;
  const start = parseIsoParts(window[0]);
  const end = parseIsoParts(window[1]);
  if (!start || !end) return null;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  if (start.year === end.year && start.month === end.month) {
    return `${monthNames[start.month - 1]} ${start.day}-${end.day} ${start.year}`;
  }
  if (start.year === end.year) {
    return `${monthNames[start.month - 1]} ${start.day}-${monthNames[end.month - 1]} ${end.day} ${start.year}`;
  }
  return `${monthNames[start.month - 1]} ${start.day} ${start.year}-${monthNames[end.month - 1]} ${end.day} ${end.year}`;
}

function parseIsoParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isValidDate(parts.year, parts.month, parts.day) ? parts : null;
}

function monthNumber(month) {
  return MONTHS[String(month).toLowerCase()];
}

function validNamedRange(startMonth, startDay, endMonth, endDay, year) {
  return isValidDate(year, monthNumber(startMonth), Number(startDay))
    && isValidDate(year, monthNumber(endMonth), Number(endDay));
}

function isValidDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

module.exports = { formatIsoDate, formatIsoDisplayDates, formatDisplayDates, formatCompactTravelWindow };
