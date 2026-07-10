import assert from 'node:assert/strict';
import test from 'node:test';
import displayDates from '../lib/display-date.cjs';

const { formatIsoDate, formatIsoDisplayDates, formatDisplayDates, formatCompactTravelWindow } = displayDates;

test('full dates display as M/D/YYYY without leading zeroes', () => {
  assert.equal(formatIsoDate('2027-06-08'), '6/8/2027');
  assert.equal(formatIsoDate('2027-11-21'), '11/21/2027');
});

test('date ranges and embedded dates are formatted without changing prose', () => {
  assert.equal(
    formatIsoDisplayDates('Travel 2027-06-08–2027-06-21; reviewed 2026-07-10.'),
    'Travel 6/8/2027–6/21/2027; reviewed 7/10/2026.',
  );
});

test('invalid and partial dates are left unchanged', () => {
  assert.equal(formatIsoDisplayDates('2027-02-30 · June 2027'), '2027-02-30 · June 2027');
});

test('named itinerary dates and ranges use the trip year', () => {
  assert.equal(formatDisplayDates('Day 2 · Wed Jun 9'), 'Day 2 · Wed 6/9/2027');
  assert.equal(formatDisplayDates('Jun 24-26 Pittsburgh blackout'), '6/24/2027–6/26/2027 Pittsburgh blackout');
  assert.equal(formatDisplayDates('Jun 27-Jul 10'), '6/27/2027–7/10/2027');
});

test('an explicit contextual year overrides the trip-year default', () => {
  assert.equal(formatDisplayDates('AKZM 2026 conditions through June 3'), 'AKZM 2026 conditions through 6/3/2026');
  assert.equal(formatDisplayDates('June 20, 2027 operation'), '6/20/2027 operation');
});

test('travel windows use compact full-month hero labels', () => {
  assert.equal(formatCompactTravelWindow(['2027-06-08', '2027-06-21']), 'June 8-21 2027');
  assert.equal(formatCompactTravelWindow(['2027-06-27', '2027-07-11']), 'June 27-July 11 2027');
});
