import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LAPSE_C_PER_M,
  buildColorTable,
  decodeTerrarium,
  fillGridHoles,
  lapseElevation,
  sampleBilinear,
} from './terrainTemperature.js';

/**
 * Build a lookup in the shape the layer indexes into.
 *
 * @param {object} spec
 * @returns {object}
 */
function lookupOf({ minLat, minLon, step, cols, rows, fill }) {
  const values = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      values[(j * cols) + i] = fill(minLat + (j * step), minLon + (i * step));
    }
  }
  return { minLat, minLon, step, cols, rows, values };
}

test('terrarium decoding recovers the elevation the format encodes', () => {
  // The format is a big-endian fixed-point number offset by 32768.
  assert.equal(decodeTerrarium(128, 0, 0), 0);
  assert.equal(decodeTerrarium(128, 100, 0), 100);
  // Below the offset is below sea level.
  assert.ok(decodeTerrarium(127, 0, 0) < 0);
  // The fractional channel contributes sub-metre precision.
  assert.equal(decodeTerrarium(128, 10, 128), 10.5);
});

test('decoded elevation matches surveyed heights for known summits', () => {
  // Encode a known altitude and read it back, so a change to the decoder that
  // silently rescales cannot pass. Mount Elbert is 4401 m.
  const metres = 4401;
  const raw = metres + 32768;
  const r = Math.floor(raw / 256);
  const g = Math.floor(raw % 256);
  assert.equal(decodeTerrarium(r, g, 0), metres);
});

test('the lapse correction ignores bathymetry so oceans are not heated', () => {
  // Terrarium carries sea-floor depth. Left uncorrected, a 6000 m trench would
  // read 39 degrees warmer than the surface beside it.
  assert.equal(lapseElevation(-6000), 0);
  assert.equal(lapseElevation(-1), 0);
  assert.equal(lapseElevation(0), 0);
});

test('the lapse correction is capped above the highest ground on Earth', () => {
  assert.equal(lapseElevation(9000), 9000);
  assert.equal(lapseElevation(50000), 9000);
  // Everest still passes through unclamped.
  assert.equal(lapseElevation(8849), 8849);
});

test('non-numeric elevation contributes no correction rather than NaN', () => {
  assert.equal(lapseElevation(Number.NaN), 0);
  assert.equal(lapseElevation(undefined), 0);
  assert.equal(lapseElevation(null), 0);
});

test('reducing an observation to sea level and back returns the original', () => {
  // This round trip is the whole basis of the downscaling: it must not drift.
  const observed = 11.6;
  const metres = 1601;
  const seaLevel = observed + (LAPSE_C_PER_M * lapseElevation(metres));
  const restored = seaLevel - (LAPSE_C_PER_M * lapseElevation(metres));
  assert.ok(Math.abs(restored - observed) < 1e-9);
});

test('downscaling separates a summit from the valley inside one coarse cell', () => {
  // Mount Elbert and Denver fall in the same 10-degree cell, so the old flat
  // field painted them identically. Their real altitudes differ by 2800 m.
  const seaLevel = 22;
  const summit = seaLevel - (LAPSE_C_PER_M * lapseElevation(4401));
  const city = seaLevel - (LAPSE_C_PER_M * lapseElevation(1609));
  assert.ok(summit < city, 'the mountain must be colder than the city below it');
  // 2792 m at 6.5 C/km is a spread of about 18 degrees.
  assert.ok(Math.abs((city - summit) - 18.1) < 0.5, `spread was ${city - summit}`);
});

test('the sampler interpolates smoothly between grid nodes', () => {
  const lookup = lookupOf({ minLat: 0, minLon: 0, step: 10, cols: 4, rows: 4, fill: (lat) => lat });
  // Exactly on a node.
  assert.equal(sampleBilinear(lookup, 10, 10), 10);
  // Halfway between two rows is the mean of them.
  assert.ok(Math.abs(sampleBilinear(lookup, 15, 10) - 15) < 1e-6);
});

test('the sampler refuses to answer beyond the latitudes actually measured', () => {
  // THE REGRESSION THIS GUARDS. A partial sweep held only the southern
  // hemisphere; unconditional clamping answered northern queries with the
  // southernmost row, painting Europe in Antarctic temperatures.
  const southernOnly = lookupOf({
    minLat: -85, minLon: -180, step: 10, cols: 36, rows: 8, fill: () => -40,
  });
  // Inside the measured band, it answers.
  assert.equal(sampleBilinear(southernOnly, -80, 0), -40);
  // Berlin is far outside it and must come back blank, not fabricated.
  assert.equal(sampleBilinear(southernOnly, 52.5, 13.4), null);
  assert.equal(sampleBilinear(southernOnly, 40, -74), null);
});

test('the sampler still clamps within one cell so poles are not holes', () => {
  // A grid stopping at 85 legitimately covers the cap above it.
  const global = lookupOf({
    minLat: -85, minLon: -180, step: 10, cols: 36, rows: 18, fill: () => 5,
  });
  assert.equal(sampleBilinear(global, 88, 0), 5);
  assert.equal(sampleBilinear(global, -88, 0), 5);
});

test('longitude wraps so the antimeridian carries no seam', () => {
  const lookup = lookupOf({
    minLat: -10, minLon: -180, step: 10, cols: 36, rows: 3, fill: () => 7,
  });
  const west = sampleBilinear(lookup, 0, -179.9);
  const east = sampleBilinear(lookup, 0, 179.9);
  assert.equal(west, 7);
  assert.equal(east, 7);
});

test('a hole in the grid yields no value rather than a guess', () => {
  const lookup = lookupOf({ minLat: 0, minLon: 0, step: 10, cols: 4, rows: 4, fill: () => 5 });
  lookup.values[0] = Number.NaN;
  assert.equal(sampleBilinear(lookup, 0, 0), null);
});

test('a missing lookup is not an error', () => {
  assert.equal(sampleBilinear(null, 0, 0), null);
});

test('the colour table is built once and spans the stated range', () => {
  const stub = (celsius) => ({
    red: Math.min(1, Math.max(0, (celsius + 50) / 105)), green: 0.5, blue: 0.25,
  });
  const table = buildColorTable(stub, -50, 55, 512);
  assert.equal(table.lut.length, 512 * 3);
  assert.equal(table.min, -50);
  assert.equal(table.max, 55);
  // Cold end dark, warm end bright, in the red channel the stub ramps.
  assert.ok(table.lut[0] < table.lut[(511 * 3)]);
});

test('the colour table rises monotonically with temperature', () => {
  const stub = (celsius) => ({
    red: Math.min(1, Math.max(0, (celsius + 50) / 105)), green: 0, blue: 0,
  });
  const table = buildColorTable(stub, -50, 55, 128);
  for (let i = 1; i < 128; i += 1) {
    assert.ok(
      table.lut[i * 3] >= table.lut[(i - 1) * 3],
      `entry ${i} went backwards`
    );
  }
});

test('a partially loaded grid renders instead of showing nothing', () => {
  // THE REGRESSION THIS GUARDS. Points arrive interlaced, so a sweep in
  // progress is scattered across the lattice. The sampler needs all four
  // corners of a cell, and with scattered data almost no four are complete —
  // so the layer showed "100" beside a completely empty map until the sweep
  // finished. Every probe below returned null before the hole filling.
  const cols = 36;
  const rows = 18;
  const values = new Float32Array(cols * rows).fill(Number.NaN);
  // Every fourth cell, which is what the first interlace pass produces.
  for (let j = 0; j < rows; j += 4) {
    for (let i = 0; i < cols; i += 4) values[(j * cols) + i] = 20;
  }
  fillGridHoles(values, cols, rows);
  const lookup = { minLat: -85, minLon: -180, step: 10, cols, rows, values };
  for (const [lat, lon] of [[39.7, -105], [51.5, -0.1], [35.7, 139.7], [-33.9, 151.2]]) {
    assert.notEqual(sampleBilinear(lookup, lat, lon), null, `${lat},${lon} was blank`);
  }
});

test('filling never invents a value where nothing was measured', () => {
  // An empty grid must stay empty. Growing from nothing would paint the whole
  // planet a confident colour based on no observation at all.
  const cols = 8;
  const rows = 8;
  const values = new Float32Array(cols * rows).fill(Number.NaN);
  fillGridHoles(values, cols, rows);
  assert.ok(values.every((v) => !Number.isFinite(v)));
});

test('filling preserves the measurements themselves', () => {
  const cols = 8;
  const rows = 8;
  const values = new Float32Array(cols * rows).fill(Number.NaN);
  values[0] = -30;
  values[(4 * cols) + 4] = 40;
  fillGridHoles(values, cols, rows);
  assert.equal(values[0], -30, 'a real measurement was overwritten');
  assert.equal(values[(4 * cols) + 4], 40, 'a real measurement was overwritten');
});

test('filled values stay within the range of what was measured', () => {
  // Averaging neighbours cannot produce a temperature colder or hotter than
  // anything actually observed; an out-of-range value would mean the fill is
  // extrapolating rather than interpolating.
  const cols = 12;
  const rows = 12;
  const values = new Float32Array(cols * rows).fill(Number.NaN);
  values[0] = 0;
  values[(6 * cols) + 6] = 30;
  values[(11 * cols) + 11] = 15;
  fillGridHoles(values, cols, rows);
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    assert.ok(v >= 0 && v <= 30, `filled value ${v} escaped the observed range`);
  }
});

test('filling wraps around the antimeridian', () => {
  // A measurement at longitude index 0 must be able to fill the cell at the
  // far end of the row, or a seam appears down the Pacific.
  const cols = 10;
  const rows = 3;
  const values = new Float32Array(cols * rows).fill(Number.NaN);
  values[(1 * cols) + 0] = 25;
  fillGridHoles(values, cols, rows);
  assert.ok(Number.isFinite(values[(1 * cols) + (cols - 1)]), 'the wrap neighbour stayed empty');
});
