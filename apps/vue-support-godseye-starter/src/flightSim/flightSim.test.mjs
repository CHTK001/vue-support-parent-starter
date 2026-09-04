import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AIRCRAFT_ID,
  getAircraft,
  listAircraft,
  listAvailableAircraft,
  validateAircraft,
} from './aircraftCatalog.js';
import {
  FIXED_STEP_S,
  MAX_FRAME_DELTA_S,
  MAX_STEPS_PER_FRAME,
  airDensity,
  approach,
  clamp,
  createFixedStepAccumulator,
  createFlightState,
  dragCoefficient,
  headingDelta,
  indicatedAirspeed,
  liftCoefficient,
  stepConfiguration,
  stepFlight,
  wrapAngle,
} from './flightDynamics.js';
import {
  DEFAULT_ARRIVAL_RADIUS_M,
  METRES_PER_NM,
  createRoute,
  createWaypoint,
  crossTrackDistance,
  directTo,
  formatNauticalMiles,
  greatCircleDistance,
  initialBearing,
  interpolateGreatCircle,
  navigationSolution,
  routeDistance,
  sampleRoutePath,
  toRadians,
  updateRouteProgress,
} from './simRoute.js';

const B747 = getAircraft(DEFAULT_AIRCRAFT_ID);

// ── Aircraft catalog ────────────────────────────────────────────────────────

test('every shipped aircraft passes catalog validation', () => {
  const all = listAircraft();
  assert.ok(all.length > 0, 'catalog must not be empty');
  for (const aircraft of all) {
    assert.deepEqual(validateAircraft(aircraft), [], `${aircraft.id} should be valid`);
  }
});

test('the default aircraft exists and is user-selectable', () => {
  const aircraft = getAircraft(DEFAULT_AIRCRAFT_ID);
  assert.ok(aircraft, 'default id must resolve');
  assert.ok(listAvailableAircraft().some((a) => a.id === DEFAULT_AIRCRAFT_ID));
});

test('catalog validation rejects the failure modes that would surface as NaN mid-flight', () => {
  assert.deepEqual(validateAircraft(null), ['aircraft is not an object']);
  assert.ok(validateAircraft({ ...B747, massKg: 0 }).some((p) => p.includes('massKg')));
  assert.ok(validateAircraft({ ...B747, wingAreaM2: -1 }).some((p) => p.includes('wingAreaM2')));
  // A stall speed above VNE leaves no usable envelope at all.
  assert.ok(validateAircraft({ ...B747, vStallCleanMps: 999 }).some((p) => p.includes('vStallCleanMps')));
  assert.ok(validateAircraft({ ...B747, flapDetents: [5, 1] }).some((p) => p.includes('ascending')));
  assert.ok(validateAircraft({ ...B747, flapDetents: [] }).some((p) => p.includes('non-empty')));
  assert.ok(validateAircraft({ ...B747, cameraAnchors: {} }).some((p) => p.includes('cameraAnchors')));
});

test('flap detents start clean and ascend', () => {
  assert.equal(B747.flapDetents[0], 0);
  for (let i = 1; i < B747.flapDetents.length; i += 1) {
    assert.ok(B747.flapDetents[i] > B747.flapDetents[i - 1]);
  }
});

// ── Angles and helpers ──────────────────────────────────────────────────────

test('wrapAngle normalises into [0, 2pi)', () => {
  assert.ok(Math.abs(wrapAngle(-0.1) - (Math.PI * 2 - 0.1)) < 1e-9);
  assert.ok(Math.abs(wrapAngle(Math.PI * 4 + 1) - 1) < 1e-9);
  assert.equal(wrapAngle(0), 0);
});

test('autopilot heading error takes the short way round 0/360', () => {
  const deg = (d) => toRadians(d);
  // 350 -> 010 is +20, not -340. Getting this wrong makes the autopilot
  // turn the long way round every time it crosses north.
  assert.ok(Math.abs(headingDelta(deg(10), deg(350)) - deg(20)) < 1e-9);
  assert.ok(Math.abs(headingDelta(deg(350), deg(10)) + deg(20)) < 1e-9);
  assert.ok(Math.abs(headingDelta(deg(0), deg(0))) < 1e-9);
  // Exactly opposite resolves to +pi rather than oscillating in sign.
  assert.ok(Math.abs(Math.abs(headingDelta(deg(180), deg(0))) - Math.PI) < 1e-9);
});

test('clamp and approach never overshoot', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-5, 0, 1), 0);
  assert.equal(clamp(Number.NaN, 0, 1), 0);
  assert.equal(approach(0, 1, 0.25), 0.25);
  assert.equal(approach(0.9, 1, 0.25), 1, 'lands exactly on target rather than passing it');
  assert.equal(approach(1, 0, 0.25), 0.75);
});

// ── Atmosphere ──────────────────────────────────────────────────────────────

test('air density falls with altitude', () => {
  const sea = airDensity(0);
  const cruise = airDensity(11_000);
  const high = airDensity(15_000);
  assert.ok(Math.abs(sea - 1.225) < 0.01, 'sea level should be ISA');
  assert.ok(cruise < sea * 0.4, 'tropopause is roughly a third of sea-level density');
  assert.ok(high < cruise);
  assert.ok(high > 0, 'density must stay positive so it is never divided to infinity');
});

test('indicated airspeed falls below true airspeed with altitude', () => {
  assert.ok(Math.abs(indicatedAirspeed(100, 0) - 100) < 0.01);
  const iasAtCruise = indicatedAirspeed(250, 11_000);
  assert.ok(iasAtCruise < 250 * 0.65, 'IAS is far below TAS at cruise, which is why limits use IAS');
});

// ── Aerodynamics ────────────────────────────────────────────────────────────

test('lift rises with angle of attack then breaks at the stall', () => {
  const belowStall = liftCoefficient(B747.stallAlphaRad * 0.5, B747, 0);
  const atStall = liftCoefficient(B747.stallAlphaRad, B747, 0);
  const deepStall = liftCoefficient(B747.stallAlphaRad * 2, B747, 0);
  assert.ok(atStall > belowStall, 'lift should still be rising up to the stall');
  assert.ok(deepStall < atStall, 'lift must drop past the stall or stalling has no consequence');
});

test('flaps add lift and drag; gear and spoilers add drag only', () => {
  const clClean = liftCoefficient(0.05, B747, 0);
  const clFlapped = liftCoefficient(0.05, B747, 1);
  assert.ok(clFlapped > clClean);

  const base = dragCoefficient(0.5, B747, {});
  assert.ok(dragCoefficient(0.5, B747, { flapFraction: 1 }) > base);
  assert.ok(dragCoefficient(0.5, B747, { gearFraction: 1 }) > base);
  assert.ok(dragCoefficient(0.5, B747, { spoilerFraction: 1 }) > base);
});

test('lift is symmetric through negative angle of attack', () => {
  const positive = liftCoefficient(B747.stallAlphaRad * 2, B747, 0);
  const negative = liftCoefficient(-B747.stallAlphaRad * 2, B747, 0);
  assert.ok(positive > 0 && negative < 0, 'a deeply negative alpha must not report positive lift');
});

// ── Configuration transitions ───────────────────────────────────────────────

test('gear travels over its transit time rather than teleporting', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 3000, headingRad: 0,
  });
  state.gearDown = true;
  assert.equal(state.gearFraction, 0);

  stepConfiguration(state, B747, 1);
  assert.ok(state.gearFraction > 0 && state.gearFraction < 1, 'mid-travel after one second');

  // Run out the full transit and it should be exactly down, not overshooting.
  for (let i = 0; i < 200; i += 1) stepConfiguration(state, B747, 0.1);
  assert.equal(state.gearFraction, 1);

  state.gearDown = false;
  for (let i = 0; i < 200; i += 1) stepConfiguration(state, B747, 0.1);
  assert.equal(state.gearFraction, 0);
});

test('flap fraction tracks the selected detent', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 3000, headingRad: 0,
  });
  state.flapIndex = B747.flapDetents.length - 1;
  for (let i = 0; i < 500; i += 1) stepConfiguration(state, B747, 0.1);
  assert.equal(state.flapFraction, 1, 'the last detent is full deployment');

  state.flapIndex = 0;
  for (let i = 0; i < 500; i += 1) stepConfiguration(state, B747, 0.1);
  assert.equal(state.flapFraction, 0);
});

test('engines spool toward the throttle command instead of snapping', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 3000, headingRad: 0,
  });
  state.engineOutput = 0;
  state.throttle = 1;
  stepConfiguration(state, B747, 0.5);
  assert.ok(state.engineOutput > 0 && state.engineOutput < 1, 'spool is gradual');
});

// ── Integration behaviour ───────────────────────────────────────────────────

test('level cruise stays roughly level and does not accumulate NaN', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: toRadians(49), longitudeRad: toRadians(-123),
    altitudeM: 10_000, headingRad: 0,
  });
  const startAltitude = state.altitudeM;
  for (let i = 0; i < 60 * 60; i += 1) stepFlight(state, B747, FIXED_STEP_S);

  assert.ok(Number.isFinite(state.altitudeM), 'altitude must stay finite');
  assert.ok(Number.isFinite(state.speedMps), 'speed must stay finite');
  assert.ok(Number.isFinite(state.headingRad));
  assert.ok(Math.abs(state.altitudeM - startAltitude) < 3_000, 'trimmed cruise should not diverge wildly');
});

test('banking turns the aircraft, and the turn stops when wings level', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: toRadians(49), longitudeRad: toRadians(-123),
    altitudeM: 8_000, headingRad: 0,
  });
  state.rollInput = 1;
  for (let i = 0; i < 60 * 20; i += 1) stepFlight(state, B747, FIXED_STEP_S);
  const turned = state.headingRad;
  assert.ok(turned > 0.05, 'a sustained bank must change heading');

  state.rollInput = 0;
  state.rollRad = 0;
  state.rollRateRadS = 0;
  const before = state.headingRad;
  for (let i = 0; i < 60 * 5; i += 1) stepFlight(state, B747, FIXED_STEP_S);
  assert.ok(Math.abs(headingDelta(state.headingRad, before)) < 0.15, 'wings level should stop the turn');
});

test('the 747 rolls slowly enough to feel heavy', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 8_000, headingRad: 0,
  });
  state.rollInput = 1;
  // One second of full aileron should not have thrown it past a 15 degree bank.
  for (let i = 0; i < 60; i += 1) stepFlight(state, B747, FIXED_STEP_S);
  assert.ok(Math.abs(state.rollRad) < toRadians(15), 'roll response must be sluggish, not fighter-like');
});

test('cutting thrust at altitude bleeds speed', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 9_000, headingRad: 0,
  });
  const startSpeed = state.speedMps;
  state.throttle = 0;
  state.engineOutput = 0;
  for (let i = 0; i < 60 * 45; i += 1) stepFlight(state, B747, FIXED_STEP_S);
  assert.ok(state.speedMps < startSpeed, 'drag with no thrust must slow the aircraft');
});

test('a crashed state is inert', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 5_000, headingRad: 0,
  });
  state.crashed = true;
  const snapshot = { ...state };
  stepFlight(state, B747, FIXED_STEP_S);
  assert.equal(state.altitudeM, snapshot.altitudeM, 'physics must not keep running after a crash');
  assert.equal(state.elapsedS, snapshot.elapsedS);
});

// ── Fixed timestep ──────────────────────────────────────────────────────────

test('the accumulator runs whole fixed steps and is frame-rate independent', () => {
  const at30 = createFixedStepAccumulator();
  const at120 = createFixedStepAccumulator();
  let steps30 = 0;
  let steps120 = 0;

  // One second of wall time, delivered at two very different frame rates.
  for (let i = 0; i < 30; i += 1) steps30 += at30.advance(1 / 30, () => { steps30 += 0; });
  for (let i = 0; i < 120; i += 1) steps120 += at120.advance(1 / 120, () => { steps120 += 0; });

  assert.ok(Math.abs(steps30 - 60) <= 1, `expected ~60 steps at 30fps, got ${steps30}`);
  assert.ok(Math.abs(steps120 - 60) <= 1, `expected ~60 steps at 120fps, got ${steps120}`);
});

test('a huge frame gap is clamped instead of producing a catch-up freeze', () => {
  const acc = createFixedStepAccumulator();
  let steps = 0;
  // A backgrounded tab returning after 30 seconds must not run 1800 steps.
  const ran = acc.advance(30, () => { steps += 1; });
  assert.ok(ran <= MAX_STEPS_PER_FRAME, 'step count must be capped');
  assert.ok(steps <= MAX_STEPS_PER_FRAME);
  assert.ok(MAX_FRAME_DELTA_S < 1, 'the clamp has to be well under a second to be useful');
  assert.equal(acc.pending(), 0, 'the backlog is dropped rather than carried as debt');
});

test('negative and non-finite frame deltas are ignored', () => {
  const acc = createFixedStepAccumulator();
  let steps = 0;
  acc.advance(-5, () => { steps += 1; });
  acc.advance(Number.NaN, () => { steps += 1; });
  assert.equal(steps, 0);
});

// ── Navigation ──────────────────────────────────────────────────────────────

test('great-circle distance matches a known route', () => {
  // JFK -> LHR is about 3,000 NM.
  const d = greatCircleDistance(
    toRadians(40.6413), toRadians(-73.7781),
    toRadians(51.4700), toRadians(-0.4543)
  );
  const nm = d / METRES_PER_NM;
  assert.ok(nm > 2_900 && nm < 3_100, `expected ~3000 NM, got ${nm.toFixed(0)}`);
});

test('distance is zero to itself and symmetric', () => {
  const a = [toRadians(49.28), toRadians(-123.12)];
  const b = [toRadians(47.61), toRadians(-122.33)];
  assert.ok(greatCircleDistance(a[0], a[1], a[0], a[1]) < 1e-6);
  const ab = greatCircleDistance(a[0], a[1], b[0], b[1]);
  const ba = greatCircleDistance(b[0], b[1], a[0], a[1]);
  assert.ok(Math.abs(ab - ba) < 1e-6);
});

test('initial bearing points the right way', () => {
  // Due north.
  const north = initialBearing(0, 0, toRadians(10), 0);
  assert.ok(Math.abs(north) < 1e-6 || Math.abs(north - Math.PI * 2) < 1e-6);
  // Due east along the equator.
  const east = initialBearing(0, 0, 0, toRadians(10));
  assert.ok(Math.abs(east - Math.PI / 2) < 1e-6);
  // Vancouver -> Seattle is roughly south.
  const vanToSea = initialBearing(
    toRadians(49.2827), toRadians(-123.1207),
    toRadians(47.6062), toRadians(-122.3321)
  );
  const deg = (vanToSea * 180) / Math.PI;
  assert.ok(deg > 150 && deg < 190, `expected roughly south, got ${deg.toFixed(0)}`);
});

test('great-circle interpolation ends where it should', () => {
  const start = { lat: toRadians(49.28), lon: toRadians(-123.12) };
  const end = { lat: toRadians(47.61), lon: toRadians(-122.33) };
  const at0 = interpolateGreatCircle(start.lat, start.lon, end.lat, end.lon, 0);
  const at1 = interpolateGreatCircle(start.lat, start.lon, end.lat, end.lon, 1);
  assert.ok(Math.abs(at0.latitudeRad - start.lat) < 1e-9);
  assert.ok(Math.abs(at1.latitudeRad - end.lat) < 1e-9);

  const mid = interpolateGreatCircle(start.lat, start.lon, end.lat, end.lon, 0.5);
  const toMid = greatCircleDistance(start.lat, start.lon, mid.latitudeRad, mid.longitudeRad);
  const fromMid = greatCircleDistance(mid.latitudeRad, mid.longitudeRad, end.lat, end.lon);
  assert.ok(Math.abs(toMid - fromMid) < 100, 'the halfway point should be equidistant');
});

test('cross-track distance is signed and zero on track', () => {
  const start = { lat: 0, lon: 0 };
  const end = { lat: 0, lon: toRadians(10) };
  const onTrack = crossTrackDistance(0, toRadians(5), start.lat, start.lon, end.lat, end.lon);
  assert.ok(Math.abs(onTrack) < 1, 'a point on the leg has no deviation');

  const north = crossTrackDistance(toRadians(1), toRadians(5), start.lat, start.lon, end.lat, end.lon);
  const south = crossTrackDistance(toRadians(-1), toRadians(5), start.lat, start.lon, end.lat, end.lon);
  assert.ok(Math.sign(north) !== Math.sign(south), 'either side of track must be opposite signs');
});

// ── Route progression ───────────────────────────────────────────────────────

function vancouverToSeattle() {
  return createRoute([
    createWaypoint({ latitudeDeg: 49.2827, longitudeDeg: -123.1207, label: 'Vancouver', type: 'departure' }),
    createWaypoint({ latitudeDeg: 47.6062, longitudeDeg: -122.3321, label: 'Seattle', type: 'destination' }),
  ]);
}

test('a two-point route starts aimed at the destination', () => {
  const route = vancouverToSeattle();
  assert.equal(route.activeIndex, 1);
  assert.equal(route.waypoints.length, 2);
  const nm = routeDistance(route) / METRES_PER_NM;
  assert.ok(nm > 100 && nm < 130, `Vancouver-Seattle is ~120 NM, got ${nm.toFixed(0)}`);
});

test('the route model is not limited to two waypoints', () => {
  const route = createRoute([
    createWaypoint({ latitudeDeg: 49.28, longitudeDeg: -123.12 }),
    createWaypoint({ latitudeDeg: 48.5, longitudeDeg: -122.8 }),
    createWaypoint({ latitudeDeg: 47.61, longitudeDeg: -122.33 }),
  ]);
  assert.equal(route.waypoints.length, 3);
  // Legs via an intermediate point are longer than the direct great circle.
  const direct = greatCircleDistance(
    toRadians(49.28), toRadians(-123.12), toRadians(47.61), toRadians(-122.33)
  );
  assert.ok(routeDistance(route) >= direct - 1);
});

test('waypoints advance on arrival and the final one completes without ending the flight', () => {
  const route = createRoute([
    createWaypoint({ latitudeDeg: 0, longitudeDeg: 0, type: 'departure' }),
    createWaypoint({ latitudeDeg: 0, longitudeDeg: 1, type: 'enroute' }),
    createWaypoint({ latitudeDeg: 0, longitudeDeg: 2, type: 'destination' }),
  ]);

  // Far away: no advance.
  let result = updateRouteProgress(route, 0, toRadians(0.5));
  assert.equal(result.advanced, false);
  assert.equal(route.activeIndex, 1);

  // Sitting on waypoint 1: advance to 2.
  result = updateRouteProgress(route, 0, toRadians(1));
  assert.equal(result.advanced, true);
  assert.equal(route.activeIndex, 2);
  assert.equal(route.completed, false);

  // Reaching the final waypoint completes the route but leaves the cursor put,
  // so the player can keep flying or land rather than being ejected.
  result = updateRouteProgress(route, 0, toRadians(2));
  assert.equal(result.completed, true);
  assert.equal(route.activeIndex, 2, 'cursor must not run off the end');

  // Arriving again is idempotent — it must not re-fire the arrival event.
  result = updateRouteProgress(route, 0, toRadians(2));
  assert.equal(result.advanced, false);
  assert.equal(route.completed, true);
});

test('navigation solution reports distance, bearing and ETA', () => {
  const route = vancouverToSeattle();
  const solution = navigationSolution(route, toRadians(49.2827), toRadians(-123.1207), 200);
  assert.ok(solution);
  assert.equal(solution.isFinal, true);
  assert.ok(solution.distanceM > 0);
  assert.ok(solution.etaSeconds > 0);
  const deg = (solution.bearingRad * 180) / Math.PI;
  assert.ok(deg > 150 && deg < 190, 'should be steering roughly south');
});

test('navigation ETA is null when stationary rather than Infinity', () => {
  const route = vancouverToSeattle();
  const solution = navigationSolution(route, toRadians(49.2827), toRadians(-123.1207), 0);
  assert.equal(solution.etaSeconds, null);
});

test('DIRECT TO retargets without discarding the rest of the route', () => {
  const route = vancouverToSeattle();
  const originalCount = route.waypoints.length;
  directTo(route, createWaypoint({ latitudeDeg: 48.4, longitudeDeg: -123.4, label: 'Victoria' }));

  assert.equal(route.waypoints.length, originalCount + 1);
  assert.equal(route.waypoints[route.activeIndex].label, 'Victoria');
  assert.equal(route.waypoints[route.activeIndex].type, 'direct');
  // The original destination survives further down the list.
  assert.ok(route.waypoints.some((w) => w.label === 'Seattle'));
});

test('route sampling follows the great circle and keeps its endpoints', () => {
  const route = vancouverToSeattle();
  const path = sampleRoutePath(route);
  assert.ok(path.length >= 3, 'a leg needs enough samples to look curved');
  assert.ok(Math.abs(path[0].latitudeDeg - 49.2827) < 1e-6);
  assert.ok(Math.abs(path[path.length - 1].latitudeDeg - 47.6062) < 1e-6);
});

test('a waypoint carries the fields the planner and HUD rely on', () => {
  const wp = createWaypoint({ latitudeDeg: 49.28, longitudeDeg: -123.12, label: 'YVR', type: 'departure' });
  assert.equal(typeof wp.id, 'string');
  assert.equal(wp.label, 'YVR');
  assert.equal(wp.type, 'departure');
  assert.equal(wp.arrivalRadiusM, DEFAULT_ARRIVAL_RADIUS_M);
  assert.ok(Math.abs(wp.latitudeRad - toRadians(49.28)) < 1e-12);
  assert.equal(wp.altitudeM, null, 'altitude is optional and explicitly absent, not zero');
});

test('a waypoint with no label falls back to formatted coordinates', () => {
  const wp = createWaypoint({ latitudeDeg: -33.87, longitudeDeg: 151.21 });
  assert.match(wp.label, /33\.870°S/);
  assert.match(wp.label, /151\.210°E/);
});

test('nautical mile formatting is readable at both scales', () => {
  assert.equal(formatNauticalMiles(2_991 * METRES_PER_NM), '2,991');
  assert.equal(formatNauticalMiles(5.5 * METRES_PER_NM), '5.5');
});

// ── Autopilot ───────────────────────────────────────────────────────────────

import {
  createAutopilot,
  disengageAutopilot,
  engageAutopilot,
  manualOverrideRequested,
  updateAutopilot,
} from './simAutopilot.js';

test('engaging the autopilot captures current altitude so it never pitches abruptly', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 9_432, headingRad: 0,
  });
  const ap = createAutopilot();
  assert.equal(ap.engaged, false);
  engageAutopilot(ap, state, B747);
  assert.equal(ap.engaged, true);
  assert.equal(ap.targetAltitudeM, 9_432, 'holds where it was, not a preset');
});

test('the autopilot turns the short way across north', () => {
  const route = createRoute([
    createWaypoint({ latitudeDeg: 0, longitudeDeg: 0 }),
    // Due north of the aircraft, so the required heading is 000.
    createWaypoint({ latitudeDeg: 10, longitudeDeg: 0 }),
  ]);
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 9_000,
    headingRad: toRadians(350),
  });
  const ap = createAutopilot();
  engageAutopilot(ap, state, B747);
  const out = updateAutopilot(ap, state, B747, route);
  // From 350 toward 000 is a small RIGHT turn, so bank must be positive.
  assert.ok(out.rollInput > 0, 'should roll right, not 350 degrees left');
  assert.ok(Math.abs(ap.commandedBankRad) <= B747.autopilot.maxBankRad);
});

test('the autopilot respects the bank limit even with a huge heading error', () => {
  const route = createRoute([
    createWaypoint({ latitudeDeg: 0, longitudeDeg: 0 }),
    createWaypoint({ latitudeDeg: 0, longitudeDeg: -10 }),
  ]);
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 9_000, headingRad: toRadians(90),
  });
  const ap = createAutopilot();
  engageAutopilot(ap, state, B747);
  updateAutopilot(ap, state, B747, route);
  assert.ok(Math.abs(ap.commandedBankRad) <= B747.autopilot.maxBankRad + 1e-9,
    'a 180 degree error must not command a knife-edge bank');
});

test('the autopilot climbs toward its target altitude and limits vertical speed', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 5_000, headingRad: 0,
  });
  const ap = createAutopilot();
  engageAutopilot(ap, state, B747);
  ap.targetAltitudeM = 11_000;
  const out = updateAutopilot(ap, state, B747, null);
  assert.ok(out.pitchInput > 0, 'below target should pitch up');
  assert.ok(ap.commandedVerticalSpeedMps > 0);
  assert.ok(ap.commandedVerticalSpeedMps <= B747.autopilot.maxVerticalSpeedMps + 1e-9);

  ap.targetAltitudeM = 1_000;
  updateAutopilot(ap, state, B747, null);
  assert.ok(ap.commandedVerticalSpeedMps < 0, 'above target should descend');
  assert.ok(ap.commandedVerticalSpeedMps >= -B747.autopilot.maxVerticalSpeedMps - 1e-9);
});

test('autothrottle pushes up when slow and back when fast, staying in range', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 9_000, headingRad: 0,
  });
  const ap = createAutopilot();
  engageAutopilot(ap, state, B747);

  state.speedMps = 150;
  const slow = updateAutopilot(ap, state, B747, null);
  state.speedMps = 320;
  const fast = updateAutopilot(ap, state, B747, null);

  assert.ok(slow.throttle > fast.throttle);
  for (const t of [slow.throttle, fast.throttle]) {
    assert.ok(t >= 0 && t <= 1, 'throttle must stay within limits');
  }
});

test('a deliberate control input disconnects the autopilot but a resting hand does not', () => {
  assert.equal(manualOverrideRequested({ pitch: 0, roll: 0, yaw: 0 }), false);
  assert.equal(manualOverrideRequested({ pitch: 0.05, roll: 0.05, yaw: 0 }), false, 'deadband');
  assert.equal(manualOverrideRequested({ roll: 0.9 }), true);
  assert.equal(manualOverrideRequested({ pitch: -0.5 }), true);
  assert.equal(manualOverrideRequested({ yaw: 0.4 }), true);
});

test('disengaging clears the commanded values so the HUD does not show stale targets', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 9_000, headingRad: 0,
  });
  const ap = createAutopilot();
  engageAutopilot(ap, state, B747);
  ap.targetAltitudeM = 12_000;
  updateAutopilot(ap, state, B747, null);
  assert.notEqual(ap.commandedVerticalSpeedMps, 0);

  disengageAutopilot(ap);
  assert.equal(ap.engaged, false);
  assert.equal(ap.commandedBankRad, 0);
  assert.equal(ap.commandedVerticalSpeedMps, 0);
});

test('the autopilot levels the wings when there is no route to follow', () => {
  const state = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 9_000, headingRad: 0,
  });
  state.rollRad = toRadians(20);
  const ap = createAutopilot();
  engageAutopilot(ap, state, B747);
  const out = updateAutopilot(ap, state, B747, null);
  assert.ok(out.rollInput < 0, 'banked right with no route should roll back left');
});

test('the autopilot flies a route to completion without NaN', () => {
  const route = createRoute([
    createWaypoint({ latitudeDeg: 49.2827, longitudeDeg: -123.1207, type: 'departure' }),
    createWaypoint({ latitudeDeg: 47.6062, longitudeDeg: -122.3321, type: 'destination' }),
  ]);
  const state = createFlightState({
    aircraft: B747, latitudeRad: toRadians(49.2827), longitudeRad: toRadians(-123.1207),
    altitudeM: 9_000, headingRad: toRadians(180),
  });
  const ap = createAutopilot();
  engageAutopilot(ap, state, B747);

  for (let i = 0; i < 60 * 120; i += 1) {
    const out = updateAutopilot(ap, state, B747, route);
    state.rollInput = out.rollInput;
    state.pitchInput = out.pitchInput;
    state.throttle = out.throttle;
    stepFlight(state, B747, FIXED_STEP_S);
    assert.ok(Number.isFinite(state.headingRad), 'heading must stay finite');
  }

  assert.ok(Number.isFinite(state.altitudeM));
  assert.ok(Number.isFinite(state.speedMps));
  // It should be tracking roughly toward the destination rather than wandering.
  const solution = navigationSolution(route, state.latitudeRad, state.longitudeRad, state.speedMps);
  const error = Math.abs(headingDelta(solution.bearingRad, state.headingRad));
  assert.ok(error < toRadians(45), `should be pointed near the waypoint, off by ${(error * 180 / Math.PI).toFixed(0)} deg`);
});

// ── State machine ───────────────────────────────────────────────────────────

import { FlightSimState, canTransition } from './flightSimController.js';
import { collectWarnings, formatEta, gearLabel, relativeBearingLabel } from './simHud.js';
import { ease } from './simInput.js';
import { dampAngle } from './simCamera.js';
import { airStartAltitude, resolveGroundContact } from './simGround.js';

test('the state machine only allows sensible transitions', () => {
  const S = FlightSimState;
  assert.equal(canTransition(S.OFF, S.PLANNING), true);
  assert.equal(canTransition(S.PLANNING, S.READY), true);
  assert.equal(canTransition(S.READY, S.ACTIVE), true);
  assert.equal(canTransition(S.ACTIVE, S.PAUSED), true);
  assert.equal(canTransition(S.PAUSED, S.ACTIVE), true);
  assert.equal(canTransition(S.ACTIVE, S.LOST), true);
  assert.equal(canTransition(S.LOST, S.ACTIVE), true, 'restart after a crash');

  // Skipping the planner would start a flight with no route.
  assert.equal(canTransition(S.OFF, S.ACTIVE), false);
  assert.equal(canTransition(S.PLANNING, S.ACTIVE), false);
  // A crashed aircraft must not silently resume.
  assert.equal(canTransition(S.LOST, S.PAUSED), false);
  // Re-entering the same state would fire duplicate enter/exit work.
  assert.equal(canTransition(S.ACTIVE, S.ACTIVE), false);
});

test('every state can reach OFF, so exit always works', () => {
  for (const s of Object.values(FlightSimState)) {
    if (s === FlightSimState.OFF) continue;
    assert.equal(canTransition(s, FlightSimState.OFF), true, `${s} must be able to exit`);
  }
});

// ── Ground contact ──────────────────────────────────────────────────────────

test('an air start clears the terrain beneath it', () => {
  assert.ok(airStartAltitude(0) > 1_500, 'sea-level start is comfortably airborne');
  // Spawning over a mountain must measure from the mountain, not sea level.
  assert.ok(airStartAltitude(3_000) > 4_500);
  assert.ok(Number.isFinite(airStartAltitude(Number.NaN)), 'a bad ground sample must not produce NaN');
});

test('a gentle gear-down touchdown is a landing; the alternatives are not', () => {
  const groundHeight = 100;
  // Low enough to be in contact in EITHER configuration. Extended wheels reach
  // further down than the belly does, so a gear-up aircraft has to descend
  // lower before it touches — an altitude that contacts with the gear down can
  // still be flying with it up.
  const contactAltitude = groundHeight + Math.min(B747.gearHeightM, B747.bellyOffsetM) - 1;
  const base = () => {
    const s = createFlightState({
      aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: contactAltitude, headingRad: 0,
    });
    s.gearFraction = 1;
    s.gearDown = true;
    s.verticalSpeedMps = -1.5;
    s.speedMps = 70;
    return s;
  };

  assert.equal(resolveGroundContact(base(), B747, groundHeight).contact, 'touchdown');

  // A BELLY LANDING IS NOT AUTOMATICALLY A CRASH.
  //
  // Gear position used to decide the outcome on its own: anything above about
  // 49 knots with the wheels up was fatal, however gently it was flown. That is
  // not how an aeroplane behaves — crews have walked away from many gear-up
  // landings. What kills is energy and attitude, so gear-up now tightens the
  // limits rather than replacing them.
  const bellyGentle = base();
  bellyGentle.gearFraction = 0;
  const belly = resolveGroundContact(bellyGentle, B747, groundHeight);
  assert.equal(belly.contact, 'touchdown', 'a gentle wings-level belly landing is survivable');
  assert.match(belly.reason, /BELLY/, 'it is still reported as a belly landing');

  // ...but the margins are much smaller with no undercarriage to absorb it.
  const bellyFast = base();
  bellyFast.gearFraction = 0;
  bellyFast.speedMps = 140;
  assert.equal(resolveGroundContact(bellyFast, B747, groundHeight).contact, 'crash');
  assert.match(resolveGroundContact(bellyFast, B747, groundHeight).reason, /TOO FAST/);

  const bellyHard = base();
  bellyHard.gearFraction = 0;
  bellyHard.verticalSpeedMps = -6;          // survivable on wheels, not on the hull
  assert.equal(resolveGroundContact(bellyHard, B747, groundHeight).contact, 'crash');
  assert.equal(resolveGroundContact(base(), B747, groundHeight).contact, 'touchdown',
    'the same rate on extended gear is still a landing');

  const slammed = base();
  slammed.verticalSpeedMps = -20;
  assert.equal(resolveGroundContact(slammed, B747, groundHeight).contact, 'crash');
  assert.match(resolveGroundContact(slammed, B747, groundHeight).reason, /DESCENT/);

  const banked = base();
  banked.rollRad = toRadians(35);
  assert.match(resolveGroundContact(banked, B747, groundHeight).reason, /WING/);

  // Attitude faults are judged separately from rate: it is entirely possible to
  // arrive nose-low without arriving fast.
  const noseDown = base();
  noseDown.pitchRad = toRadians(-12);
  assert.match(resolveGroundContact(noseDown, B747, groundHeight).reason, /NOSE DOWN/);

  const tail = base();
  tail.pitchRad = toRadians(16);
  assert.match(resolveGroundContact(tail, B747, groundHeight).reason, /TAIL/);
});

test('well above the ground the aircraft is simply airborne', () => {
  const s = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 9_000, headingRad: 0,
  });
  const result = resolveGroundContact(s, B747, 0);
  assert.equal(result.contact, 'airborne');
  assert.ok(result.altitudeAglM > 8_000);
});

// ── HUD formatting ──────────────────────────────────────────────────────────

test('gear reports three distinct states, including transit', () => {
  const s = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 3_000, headingRad: 0,
  });
  s.gearFraction = 0;
  assert.equal(gearLabel(s), 'UP');
  s.gearFraction = 0.5;
  assert.equal(gearLabel(s), 'TRANSIT');
  s.gearFraction = 1;
  assert.equal(gearLabel(s), 'DOWN');
});

test('relative bearing is an instruction, not arithmetic homework', () => {
  const deg = (d) => toRadians(d);
  assert.equal(relativeBearingLabel(deg(90), deg(90)), 'ON TRACK');
  assert.match(relativeBearingLabel(deg(120), deg(90)), /30° RIGHT/);
  assert.match(relativeBearingLabel(deg(60), deg(90)), /30° LEFT/);
  // Crossing north must not read as a 350-degree turn.
  assert.match(relativeBearingLabel(deg(10), deg(350)), /20° RIGHT/);
  assert.match(relativeBearingLabel(deg(350), deg(10)), /20° LEFT/);
});

test('ETA formats as MM:SS under an hour and H:MM above', () => {
  assert.equal(formatEta(0), '00:00');
  assert.equal(formatEta(65), '01:05');
  assert.equal(formatEta(3_600), '1:00');
  assert.equal(formatEta(5_400), '1:30');
});

test('warnings are sparse and only fire when they matter', () => {
  const s = createFlightState({
    aircraft: B747, latitudeRad: 0, longitudeRad: 0, altitudeM: 9_000, headingRad: 0,
  });
  s.altitudeAglM = 9_000;
  assert.deepEqual(collectWarnings(s, B747), [], 'clean cruise is silent');

  s.stalled = true;
  assert.ok(collectWarnings(s, B747).includes('STALL'));

  s.stalled = false;
  s.overspeed = true;
  assert.ok(collectWarnings(s, B747).includes('OVERSPEED'));

  // Low and clean warns about gear; low and configured does not.
  s.overspeed = false;
  s.altitudeAglM = 500;
  s.gearFraction = 0;
  assert.ok(collectWarnings(s, B747).includes('GEAR'));
  s.gearFraction = 1;
  assert.ok(!collectWarnings(s, B747).includes('GEAR'));

  // Terrain fires only when descending toward it, not merely when low —
  // otherwise it would scream through every landing roll.
  s.altitudeAglM = 200;
  s.verticalSpeedMps = 0;
  assert.ok(!collectWarnings(s, B747).includes('TERRAIN'));
  s.verticalSpeedMps = -8;
  assert.ok(collectWarnings(s, B747).includes('TERRAIN'));
});

// ── Input feel ──────────────────────────────────────────────────────────────

test('control axes ease in and self-centre, never snapping', () => {
  let axis = 0;
  axis = ease(axis, 1, 1 / 60);
  assert.ok(axis > 0 && axis < 1, 'one frame of input is a nudge, not full deflection');

  for (let i = 0; i < 240; i += 1) axis = ease(axis, 1, 1 / 60);
  assert.equal(axis, 1, 'held input reaches full deflection exactly');

  for (let i = 0; i < 240; i += 1) axis = ease(axis, 0, 1 / 60);
  assert.equal(axis, 0, 'released input returns exactly to centre');
});

test('the camera damps the short way around north', () => {
  const deg = (d) => toRadians(d);
  const result = dampAngle(deg(350), deg(10), 0.5);
  // Halfway from 350 to 010 is 000, not 180.
  const resultDeg = ((result * 180) / Math.PI + 360) % 360;
  assert.ok(resultDeg > 355 || resultDeg < 5, `expected near 000, got ${resultDeg.toFixed(1)}`);
});

test('camera damping clamps its blend factor', () => {
  const target = toRadians(90);
  // A long frame must not overshoot past the target.
  const result = dampAngle(0, target, 5);
  assert.ok(Math.abs(result - target) < 1e-9);
});
