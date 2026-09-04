import test from 'node:test';
import assert from 'node:assert/strict';

import { adsbLolFallbackAnchor } from '../vite.config.js';

const req = (query) => ({ url: `/api/opensky?${query}` });

test('an explicit lat/lon anchor is used as given', () => {
  const a = adsbLolFallbackAnchor(req('lat=30.27&lon=-97.74'));
  assert.equal(a.latitude, 30.27);
  assert.equal(a.longitude, -97.74);
});

test('a bounding box anchors at its centre', () => {
  // THE BUG THIS FIXES. The flights layer sends a bounding box, because that is
  // what the OpenSky API takes — never lat/lon. So the anchor was always null,
  // the keyless adsb.lol fallback never fired once, and every OpenSky failure
  // became a 502 and an empty sky.
  const a = adsbLolFallbackAnchor(req('lamin=30&lamax=31&lomin=-98&lomax=-97'));
  assert.equal(a.latitude, 30.5);
  assert.equal(a.longitude, -97.5);
});

test('a box across the antimeridian anchors in the Pacific, not Africa', () => {
  // Naive averaging of 170 and -170 gives 0 — the Gulf of Guinea, a quarter of
  // the planet from the box the user is actually looking at.
  const a = adsbLolFallbackAnchor(req('lamin=-10&lamax=10&lomin=170&lomax=-170'));
  assert.ok(Math.abs(Math.abs(a.longitude) - 180) < 0.001, `anchored at ${a.longitude}`);
});

test('an explicit anchor still wins over a box', () => {
  const a = adsbLolFallbackAnchor(req('lat=51.5&lon=-0.12&lamin=30&lamax=31&lomin=-98&lomax=-97'));
  assert.equal(a.latitude, 51.5);
  assert.equal(a.longitude, -0.12);
});

test('an incomplete box yields no anchor rather than a wrong one', () => {
  assert.equal(adsbLolFallbackAnchor(req('lamin=30&lamax=31')), null);
  assert.equal(adsbLolFallbackAnchor(req('')), null);
});

test('out-of-range coordinates are refused', () => {
  assert.equal(adsbLolFallbackAnchor(req('lat=91&lon=0')), null);
  assert.equal(adsbLolFallbackAnchor(req('lat=0&lon=181')), null);
});
