import test from 'node:test';
import assert from 'node:assert/strict';

import { cameraViewBox, createViewportIndex } from './viewportIndex.js';

const P = (lon, lat, name) => ({ lon, lat, name });

test('only points inside the box come back', () => {
  const idx = createViewportIndex([
    P(-97.7, 30.3, 'austin'), P(2.3, 48.9, 'paris'), P(139.7, 35.7, 'tokyo'),
  ]);
  const found = idx.search({ west: -100, south: 28, east: -95, north: 32 });
  assert.deepEqual(found.map((p) => p.name), ['austin']);
});

test('culling is the whole point: a city view drops almost everything', () => {
  // 10,000 points spread worldwide, of which a handful are in one city.
  const pts = [];
  for (let i = 0; i < 10000; i += 1) pts.push(P((i % 360) - 180, (i % 170) - 85, `w${i}`));
  for (let i = 0; i < 5; i += 1) pts.push(P(-97.74 + i * 0.001, 30.26, `austin${i}`));
  const idx = createViewportIndex(pts);
  const found = idx.search({ west: -97.8, south: 30.2, east: -97.7, north: 30.3 });
  assert.ok(found.length < 50, `city view returned ${found.length} of ${pts.length}`);
  assert.ok(found.some((p) => p.name.startsWith('austin')));
});

test('a view across the antimeridian is not silently empty', () => {
  // THE TRAP. A view spanning 180 has west > east, so a single rectangle query
  // matches nothing and the layer empties over the entire Pacific.
  const idx = createViewportIndex([
    P(179.5, 0, 'west-of-line'), P(-179.5, 0, 'east-of-line'), P(0, 0, 'africa'),
  ]);
  const found = idx.search({ west: 178, south: -5, east: -178, north: 5 });
  const names = found.map((p) => p.name).sort();
  assert.deepEqual(names, ['east-of-line', 'west-of-line']);
});

test('points on the wrong side of the world are not returned', () => {
  const idx = createViewportIndex([P(-97.7, 30.3, 'austin'), P(139.7, 35.7, 'tokyo')]);
  assert.deepEqual(idx.search({ west: 130, south: 30, east: 145, north: 40 }).map((p) => p.name), ['tokyo']);
});

test('a missing or malformed box draws everything rather than nothing', () => {
  // Failing open matters: a bad box must never blank a layer.
  const idx = createViewportIndex([P(0, 0, 'a'), P(10, 10, 'b')]);
  assert.equal(idx.search(null).length, 2);
  assert.equal(idx.search({ west: NaN, south: 0, east: 1, north: 1 }).length, 2);
});

test('rows without usable coordinates are never indexed', () => {
  const idx = createViewportIndex([P(0, 0, 'ok'), { lon: 'x', lat: 1 }, null, { lat: 5 }]);
  assert.equal(idx.size(), 1);
});

test('a globe-wide view is not culled at all', () => {
  // Querying when everything is visible costs more than it saves.
  const Cesium = {
    Math: { toDegrees: (r) => (r * 180) / Math.PI },
  };
  const viewer = { camera: { computeViewRectangle: () => ({
    west: -Math.PI, east: Math.PI, south: -Math.PI / 2, north: Math.PI / 2,
  }) } };
  assert.equal(cameraViewBox(viewer, Cesium), null, 'a whole-globe view must not cull');
});

test('a city view yields a padded box, so markers do not pop in at the edge', () => {
  const Cesium = { Math: { toDegrees: (r) => (r * 180) / Math.PI } };
  const deg = (d) => (d * Math.PI) / 180;
  const viewer = { camera: { computeViewRectangle: () => ({
    west: deg(-98), east: deg(-97), south: deg(30), north: deg(31),
  }) } };
  const box = cameraViewBox(viewer, Cesium, 0.25);
  assert.ok(box.west < -98, 'padded west');
  assert.ok(box.east > -97, 'padded east');
  assert.ok(box.south < 30 && box.north > 31, 'padded vertically');
});

test('no view rectangle means no culling, not an empty map', () => {
  const Cesium = { Math: { toDegrees: (r) => r } };
  assert.equal(cameraViewBox({ camera: { computeViewRectangle: () => undefined } }, Cesium), null);
  assert.equal(cameraViewBox({}, Cesium), null);
});

test('latitude padding never escapes the poles', () => {
  const Cesium = { Math: { toDegrees: (r) => (r * 180) / Math.PI } };
  const deg = (d) => (d * Math.PI) / 180;
  const viewer = { camera: { computeViewRectangle: () => ({
    west: deg(-10), east: deg(10), south: deg(80), north: deg(89),
  }) } };
  const box = cameraViewBox(viewer, Cesium, 0.5);
  assert.ok(box.north <= 90 && box.south >= -90, `box escaped: ${box.south}..${box.north}`);
});
