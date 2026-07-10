/* User-facing date formatting. Canonical data remains ISO for sorting and validation. */
(function () {
  'use strict';
  const isoDate = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  const months = { jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12 };
  const month = '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
  const crossMonthRange = new RegExp(`\\b${month}\\s+(\\d{1,2})\\s*[-–—]\\s*${month}\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b`, 'gi');
  const sameMonthRange = new RegExp(`\\b${month}\\s+(\\d{1,2})\\s*[-–—]\\s*(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b`, 'gi');
  const namedDate = new RegExp(`\\b${month}\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?\\b`, 'gi');

  window.DisplayDate = Object.freeze({
    format(value) {
      const input = String(value || '').replace(isoDate, (original, year, month, day) => {
        const y = Number(year), m = Number(month), d = Number(day);
        return validDate(y, m, d) ? `${m}/${d}/${year}` : original;
      });
      const years = [...new Set(input.match(/\b20\d{2}\b/g) || [])];
      const contextualYear = years.length === 1 ? Number(years[0]) : 2027;
      return input
        .replace(crossMonthRange, (original, m1, d1, m2, d2, explicitYear) => range(original, m1, d1, m2, d2, Number(explicitYear || contextualYear)))
        .replace(sameMonthRange, (original, m, d1, d2, explicitYear) => range(original, m, d1, m, d2, Number(explicitYear || contextualYear)))
        .replace(namedDate, (original, m, d, explicitYear) => {
          const year = Number(explicitYear || contextualYear), monthNumber = months[m.toLowerCase()];
          return validDate(year, monthNumber, Number(d)) ? `${monthNumber}/${Number(d)}/${year}` : original;
        });
    },
  });

  function range(original, m1, d1, m2, d2, year) {
    const month1 = months[m1.toLowerCase()], month2 = months[m2.toLowerCase()];
    return validDate(year, month1, Number(d1)) && validDate(year, month2, Number(d2))
      ? `${month1}/${Number(d1)}/${year}–${month2}/${Number(d2)}/${year}`
      : original;
  }

  function validDate(year, monthNumber, day) {
    const date = new Date(Date.UTC(year, monthNumber - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === monthNumber - 1 && date.getUTCDate() === day;
  }
})();
