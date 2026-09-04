import * as Cesium from 'cesium';

/**
 * Flight Sim ground contact.
 *
 * The live-aircraft layer's `groundSnap.js` is built for hundreds of contacts
 * sampled rarely, with per-icao rate limiting and held-evidence decay. Flight
 * Sim has the opposite shape: exactly one aircraft that needs a height under it
 * continuously and cheaply. So this reuses the same *principles* — sample the
 * tile skin, cache it, invalidate on movement — sized for a single fast-moving
 * aircraft rather than a crowd.
 *
 * Terrain sampling is the single most expensive thing this mode could do per
 * frame, so it is deliberately throttled: a sample is only taken when the
 * aircraft has moved far enough for the old one to be stale, or enough time has
 * passed. Everything in between reuses the cached height.
 */

/** Move this far horizontally and the cached height is stale, metres. */
const RESAMPLE_DISTANCE_M = 120;
/** Resample at least this often even when parked, milliseconds. */
const RESAMPLE_INTERVAL_MS = 500;
/**
 * Above this AGL the exact ground height stops mattering for flight, so
 * sampling backs right off. Terrain only matters near it.
 */
const HIGH_ALTITUDE_AGL_M = 3_000;
/** Sampling interval when high above the ground, milliseconds. */
const HIGH_ALTITUDE_INTERVAL_MS = 4_000;

/**
 * Create a ground-height sampler for one aircraft.
 *
 * @returns {{
 *   heightAt: (viewer: object, latitudeRad: number, longitudeRad: number, altitudeM: number) => number,
 *   reset: () => void,
 *   stats: () => {samples: number, cached: number}
 * }}
 */
export function createSimGround() {
  let cachedHeightM = 0;
  /** @type {Cesium.Cartesian3|null} */
  let cachedAt = null;
  let lastSampleMs = 0;
  let samples = 0;
  let cached = 0;

  const scratchCarto = new Cesium.Cartographic();
  const scratchPos = new Cesium.Cartesian3();

  /**
   * Terrain/tile height beneath a position, cached.
   *
   * Falls back through the available sources: the photoreal tile skin first
   * (what the aircraft visually sits on), then the terrain provider, then the
   * last known value. It never returns null — a missing sample would otherwise
   * have to be handled at every call site in the physics loop.
   *
   * @param {object} viewer - Cesium viewer.
   * @param {number} latitudeRad
   * @param {number} longitudeRad
   * @param {number} altitudeM - Current altitude, used to throttle when high.
   * @returns {number} Ground height above the ellipsoid, metres.
   */
  function heightAt(viewer, latitudeRad, longitudeRad, altitudeM, exclusions) {
    if (!viewer?.scene) return cachedHeightM;

    scratchCarto.latitude = latitudeRad;
    scratchCarto.longitude = longitudeRad;
    scratchCarto.height = 0;
    const surfacePos = Cesium.Cartographic.toCartesian(scratchCarto, Cesium.Ellipsoid.WGS84, scratchPos);

    const now = Date.now();
    const agl = altitudeM - cachedHeightM;
    const interval = agl > HIGH_ALTITUDE_AGL_M ? HIGH_ALTITUDE_INTERVAL_MS : RESAMPLE_INTERVAL_MS;

    const moved = cachedAt
      ? Cesium.Cartesian3.distance(surfacePos, cachedAt) > RESAMPLE_DISTANCE_M
      : true;
    const stale = now - lastSampleMs > interval;

    if (!moved && !stale) {
      cached += 1;
      return cachedHeightM;
    }

    lastSampleMs = now;
    samples += 1;

    let sampled = null;
    try {
      // sampleHeight reads the loaded 3D tile skin, which is what the aircraft
      // visually rests on. It throws if the scene cannot pick, hence the guard.
      //
      // The exclusion list is ESSENTIAL, not an optimisation: the ray is cast
      // vertically at the aircraft's own lat/lon, so without excluding the
      // aircraft it strikes the aeroplane itself and reports the ground as
      // being at the aircraft's altitude — AGL zero, and an instant crash on
      // the first frame of every flight. src/data/flights.js documents the same
      // trap for grounded live contacts.
      if (viewer.scene.sampleHeightSupported) {
        sampled = viewer.scene.sampleHeight(scratchCarto, exclusions);
      }
    } catch {
      sampled = null;
    }

    if (sampled === null || sampled === undefined || !Number.isFinite(sampled)) {
      // No tile skin loaded here yet — fall back to the terrain provider.
      const terrainHeight = viewer.scene.globe?.getHeight?.(scratchCarto);
      if (Number.isFinite(terrainHeight)) sampled = terrainHeight;
    }

    if (Number.isFinite(sampled)) {
      cachedHeightM = sampled;
      cachedAt = Cesium.Cartesian3.clone(surfacePos, cachedAt || new Cesium.Cartesian3());
    }
    return cachedHeightM;
  }

  return {
    heightAt,
    reset() {
      cachedHeightM = 0;
      cachedAt = null;
      lastSampleMs = 0;
      samples = 0;
      cached = 0;
    },
    stats() {
      return { samples, cached };
    },
  };
}

/**
 * Resolve ground contact for the current step.
 *
 * Pure decision logic, separated from sampling so it can be tested without a
 * viewer. Returns what should happen rather than mutating, so the controller
 * owns the state change.
 *
 * @param {object} state - Flight state.
 * @param {object} aircraft - Catalog entry.
 * @param {number} groundHeightM - Terrain height beneath the aircraft.
 * @returns {{
 *   contact: 'airborne'|'touchdown'|'rolling'|'crash',
 *   altitudeAglM: number,
 *   verticalSpeedMps: number,
 *   reason?: string
 * }}
 */
export function resolveGroundContact(state, aircraft, groundHeightM) {
  // The wheels, not the model origin, are what touches the ground.
  const wheelHeightM = state.gearFraction > 0.9 ? aircraft.gearHeightM : aircraft.bellyOffsetM;
  const contactAltitudeM = groundHeightM + wheelHeightM;
  const altitudeAglM = state.altitudeM - contactAltitudeM;

  if (altitudeAglM > 0.5) {
    return { contact: 'airborne', altitudeAglM, verticalSpeedMps: state.verticalSpeedMps };
  }

  // A LIFT-OFF in progress. stepGroundRoll clears onGround at rotation speed,
  // but the wheels are still exactly at contact height for that frame, so
  // without this the aircraft is immediately put back on the ground — and then
  // rotates again, and again, pinned to the runway while pitch integrates
  // upward every frame. Measured at 46 degrees nose-up still flagged as rolling,
  // which is well past a tail strike, followed by a 7,700 fpm zoom once it
  // finally broke free.
  //
  // Nothing that is not descending can be touching down, so a released aircraft
  // with non-negative vertical speed is flying.
  if (!state.onGround && state.verticalSpeedMps >= 0) {
    return { contact: 'airborne', altitudeAglM, verticalSpeedMps: state.verticalSpeedMps };
  }

  const descentRate = -state.verticalSpeedMps;
  const gearDown = state.gearFraction > 0.9;

  // HOW AN ARRIVAL IS JUDGED.
  //
  // Gear up used to be an instant crash on its own, at anything above about
  // 49 knots. That is not how an aeroplane behaves: a belly landing flown at a
  // sensible speed, wings level and with a low rate of descent is survivable,
  // and crews have walked away from many. What kills is the ENERGY and the
  // ATTITUDE — arriving too fast, dropping too hard, a wing down, or the nose
  // pointed at the ground.
  //
  // So gear position no longer decides the outcome by itself. It tightens the
  // limits, because there is no undercarriage to absorb anything: the airframe
  // takes the whole arrival.
  const limits = gearDown
    ? { descent: aircraft.maxTouchdownRateMps * 2, roll: 0.35, pitchDown: -0.14, speed: aircraft.vneMps * 0.95 }
    // Belly: roughly a third of the vertical energy, half the bank, and a
    // firm speed ceiling near the clean stall — fly it on gently or not at all.
    : { descent: aircraft.maxTouchdownRateMps * 1.2, roll: 0.17, pitchDown: -0.09, speed: aircraft.vStallCleanMps * 1.35 };

  if (descentRate > limits.descent) {
    return {
      contact: 'crash',
      altitudeAglM,
      verticalSpeedMps: state.verticalSpeedMps,
      reason: 'EXCESSIVE DESCENT RATE',
    };
  }
  // Banked far enough that a wingtip reaches the ground before the wheels.
  if (Math.abs(state.rollRad) > limits.roll) {
    return {
      contact: 'crash',
      altitudeAglM,
      verticalSpeedMps: state.verticalSpeedMps,
      reason: 'WING STRIKE',
    };
  }
  // Nose-down at contact drives the forward fuselage in first. Distinct from
  // descent rate: it is possible to arrive nose-low and not fast.
  if (state.pitchRad < limits.pitchDown) {
    return {
      contact: 'crash',
      altitudeAglM,
      verticalSpeedMps: state.verticalSpeedMps,
      reason: 'NOSE DOWN',
    };
  }
  // Rotated so far that the tail arrives before the wheels do.
  if (state.pitchRad > 0.22) {
    return {
      contact: 'crash',
      altitudeAglM,
      verticalSpeedMps: state.verticalSpeedMps,
      reason: 'TAIL STRIKE',
    };
  }
  if (state.speedMps > limits.speed) {
    return {
      contact: 'crash',
      altitudeAglM,
      verticalSpeedMps: state.verticalSpeedMps,
      reason: gearDown ? 'OVERSPEED ON TOUCHDOWN' : 'BELLY LANDING TOO FAST',
    };
  }

  if (state.onGround) {
    return { contact: 'rolling', altitudeAglM, verticalSpeedMps: 0 };
  }
  return {
    contact: 'touchdown',
    altitudeAglM,
    verticalSpeedMps: state.verticalSpeedMps,
    // Survivable, but not a normal landing — the caller can say so.
    ...(gearDown ? {} : { reason: 'BELLY LANDING' }),
  };
}

/**
 * A safe air-start altitude above the terrain.
 *
 * Air starts happen at arbitrary clicked points, which may be in mountains, so
 * the spawn altitude is measured from the ground rather than from sea level.
 *
 * @param {number} groundHeightM
 * @param {number} [aglM] - Desired height above ground, metres (default ~6,000 ft).
 * @returns {number} Altitude above the ellipsoid, metres.
 */
export function airStartAltitude(groundHeightM, aglM = 1_830) {
  return (Number.isFinite(groundHeightM) ? groundHeightM : 0) + aglM;
}
