import test from 'node:test';
import assert from 'node:assert/strict';

import { localTimeAt, zoneFor } from './temperature.js';

/** Northern-summer reference instant, so DST is actually in effect. */
const SUMMER = Date.UTC(2026, 7, 27, 17, 15);
/** Northern-winter reference, when the same places are back on standard time. */
const WINTER = Date.UTC(2026, 0, 27, 17, 15);

test('the readout reports the time where the cursor is, not where the viewer is', () => {
  // THE BUG THIS GUARDS. The pill formatted `new Date()` in the viewer's own
  // zone, so it read the same hour over Tokyo as over Los Angeles — the one
  // thing a per-location time readout must never do.
  const tokyo = localTimeAt(139.7, SUMMER, 35.7);
  const la = localTimeAt(-118.2, SUMMER, 34);
  assert.notEqual(tokyo, la);
});

test('summer time is applied where it is observed', () => {
  // Longitude arithmetic alone is an hour wrong across North America and
  // Europe for half the year.
  assert.match(localTimeAt(-74, SUMMER, 40.7), /1:15 pm/);      // EDT, not EST
  assert.match(localTimeAt(-118.2, SUMMER, 34), /10:15 am/);    // PDT, not PST
  assert.match(localTimeAt(-0.1, SUMMER, 51.5), /6:15 pm/);     // BST, not GMT
});

test('the same places fall back to standard time in winter', () => {
  assert.match(localTimeAt(-74, WINTER, 40.7), /12:15 pm/);     // EST
  assert.match(localTimeAt(-0.1, WINTER, 51.5), /5:15 pm/);     // GMT
});

test('half-hour offsets survive, which longitude arithmetic cannot express', () => {
  assert.match(localTimeAt(77.2, SUMMER, 28.6), /10:45 pm/);    // IST is +05:30
});

test('the date rolls over, not just the clock', () => {
  // 17:15 UTC is already tomorrow in Tokyo and Sydney. A readout showing the
  // right hour on the wrong day is worse than showing no day.
  assert.match(localTimeAt(139.7, SUMMER, 35.7), /Fri 28/);
  assert.match(localTimeAt(151.2, SUMMER, -33.9), /Fri 28/);
  assert.match(localTimeAt(-74, SUMMER, 40.7), /Thu 27/);
});

test('somewhere with no named zone still gets a sensible time', () => {
  // Open ocean claims no zone; longitude arithmetic is the honest answer.
  const pacific = localTimeAt(-150, SUMMER, 0);
  assert.match(pacific, /\d+:15 (am|pm)/);
  assert.equal(zoneFor(0, -150), '');
});

test('longitude is the fallback whenever latitude is unknown', () => {
  // The click path has a longitude but may not pass a latitude; it must not
  // throw or silently report the viewer's own time.
  const withoutLat = localTimeAt(139.7, SUMMER);
  assert.match(withoutLat, /\d+:15 (am|pm)/);
  assert.match(withoutLat, /Fri 28/);
});

test('longitudes outside the normal range wrap instead of drifting', () => {
  assert.equal(localTimeAt(190, SUMMER), localTimeAt(-170, SUMMER));
  assert.equal(localTimeAt(-190, SUMMER), localTimeAt(170, SUMMER));
});

test('a nonsense longitude does not produce a nonsense time', () => {
  for (const bad of [Number.NaN, Infinity, null, undefined, 'east']) {
    assert.match(localTimeAt(bad, SUMMER), /\d+:15 (am|pm)/, `${bad} broke the readout`);
  }
});

test('zone boxes claim their own regions and not their neighbours', () => {
  assert.equal(zoneFor(40.7, -74), 'America/New_York');
  assert.equal(zoneFor(34, -118.2), 'America/Los_Angeles');
  assert.equal(zoneFor(39.7, -105), 'America/Denver');
  assert.equal(zoneFor(41.9, -87.6), 'America/Chicago');
  assert.equal(zoneFor(35.7, 139.7), 'Asia/Tokyo');
  assert.equal(zoneFor(-33.9, 151.2), 'Australia/Sydney');
});

test('the time advances as real time passes', () => {
  // It is recomputed per hover rather than captured once, so a pill left on
  // screen does not freeze at the minute it first appeared.
  const later = localTimeAt(-74, SUMMER + (46 * 60 * 1000), 40.7);
  assert.notEqual(localTimeAt(-74, SUMMER, 40.7), later);
});
