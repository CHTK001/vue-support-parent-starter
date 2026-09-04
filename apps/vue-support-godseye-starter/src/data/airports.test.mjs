import test from 'node:test';
import assert from 'node:assert/strict';

import { AIRPORT_TIERS, canAccept, nearestUsable, runwayLine } from './airports.js';

const HEATHROW = {
  id: 'EGLL', name: 'London Heathrow', type: 'large', lat: 51.4706, lon: -0.4619,
  runways: [
    { ident: '09L/27R', lengthFt: 12802, surface: 'ASP', hard: true, lit: true, headingDeg: 89.6 },
    { ident: '09R/27L', lengthFt: 12008, surface: 'ASP', hard: true, lit: true, headingDeg: 89.6 },
  ],
};
const GRASS_STRIP = {
  id: 'XXXX', name: 'Somewhere Field', type: 'small', lat: 51.5, lon: -0.5,
  runways: [{ ident: '18/36', lengthFt: 2200, surface: 'GRS', hard: false, lit: false, headingDeg: 180 }],
};
const REGIONAL = {
  id: 'EGKK', name: 'Gatwick', type: 'large', lat: 51.1481, lon: -0.1903,
  runways: [{ ident: '08R/26L', lengthFt: 10879, surface: 'ASP', hard: true, lit: true, headingDeg: 77 }],
};

test('a runway reads as the facts a pilot needs to commit to an approach', () => {
  const line = runwayLine(HEATHROW.runways[0]);
  assert.match(line, /09L\/27R/);
  assert.match(line, /12,802 ft/);
  assert.match(line, /ASP/);
  assert.match(line, /LIT/);
  // True heading, zero-padded, so 9 degrees never reads as 90.
  assert.match(line, /090°T/);
});

test('a heading below 100 degrees is padded, not ambiguous', () => {
  const line = runwayLine({ ident: '01/19', lengthFt: 5000, headingDeg: 9 });
  assert.match(line, /009°T/);
});

test('a runway with nothing known does not render an empty skeleton', () => {
  assert.equal(runwayLine(null), '');
  assert.equal(runwayLine({}), '');
});

test('a heavy jet is refused a runway that cannot take it', () => {
  // THE POINT OF THE LAYER. Telling someone they can land somewhere they cannot
  // is worse than telling them nothing, so this is deliberately conservative.
  assert.equal(canAccept(HEATHROW, 8000), true);
  assert.equal(canAccept(GRASS_STRIP, 8000), false);
  // Even a light aircraft is refused an unpaved strip here: `hard` is required,
  // because the sim has no model for surface degradation.
  assert.equal(canAccept(GRASS_STRIP, 1000), false);
});

test('a shorter requirement opens up more fields', () => {
  const shortHard = {
    runways: [{ lengthFt: 4200, hard: true }],
  };
  assert.equal(canAccept(shortHard, 8000), false);
  assert.equal(canAccept(shortHard, 4000), true);
});

test('an airport with no runway data is never offered as a destination', () => {
  assert.equal(canAccept({ runways: [] }, 1000), false);
  assert.equal(canAccept({}, 1000), false);
  assert.equal(canAccept(null, 1000), false);
});

test('the nearest usable airport skips ones that cannot take the aircraft', () => {
  // The grass strip is closest to the query point and must still lose.
  const found = nearestUsable([GRASS_STRIP, REGIONAL, HEATHROW], 51.49, -0.49, 8000);
  assert.equal(found.id, 'EGLL');
});

test('nearest returns nothing rather than something unusable', () => {
  assert.equal(nearestUsable([GRASS_STRIP], 51.5, -0.5, 8000), null);
  assert.equal(nearestUsable([], 0, 0), null);
  assert.equal(nearestUsable(null, 0, 0), null);
});

test('longitude is scaled by latitude so northern airports are ranked correctly', () => {
  // At 70 degrees north a degree of longitude is about a third of a degree of
  // latitude on the ground. Without the cosine term the eastern airport would
  // wrongly appear further away than the northern one.
  const north = { id: 'N', lat: 71, lon: 25, runways: [{ lengthFt: 9000, hard: true }] };
  const east = { id: 'E', lat: 70, lon: 27, runways: [{ lengthFt: 9000, hard: true }] };
  const found = nearestUsable([north, east], 70, 25, 8000);
  assert.equal(found.id, 'E', 'the eastern field is genuinely closer at this latitude');
});

test('every tier has a distinct colour and size, not colour alone', () => {
  // Size carries the same information as colour, so the distinction survives
  // for anyone who cannot easily compare small coloured dots.
  const colors = Object.values(AIRPORT_TIERS).map((t) => t.color);
  const sizes = Object.values(AIRPORT_TIERS).map((t) => t.pixelSize);
  assert.equal(new Set(colors).size, colors.length);
  assert.equal(new Set(sizes).size, sizes.length);
});

test('only large airports are drawn at global zoom', () => {
  // Small fields at globe scale are a grey haze over every populated continent.
  assert.equal(AIRPORT_TIERS.large.minZoomM, Infinity);
  assert.ok(AIRPORT_TIERS.medium.minZoomM < Infinity);
  assert.ok(AIRPORT_TIERS.small.minZoomM < AIRPORT_TIERS.medium.minZoomM);
});
