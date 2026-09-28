/**
 * Flight Sim route model and great-circle navigation.
 *
 * A route is an ordered `waypoints[]` array from the outset, even though the
 * first planner UI only collects a departure and a destination. Nothing here
 * assumes exactly two points, so intermediate waypoints are a UI change rather
 * than a rewrite.
 *
 * Pure logic — no Cesium, no DOM — so navigation can be tested directly.
 * Angles are radians internally; helpers convert for display.
 */

/** Mean Earth radius, metres (WGS-84 mean). */
export const EARTH_RADIUS_M = 6_371_008.8;
/** Metres per nautical mile. */
export const METRES_PER_NM = 1_852;
/** Metres per foot. */
export const METRES_PER_FOOT = 0.3048;
/** Default radius within which a waypoint counts as reached, metres (2 NM). */
export const DEFAULT_ARRIVAL_RADIUS_M = 2 * METRES_PER_NM;

const DEG = Math.PI / 180;

/**
 * Degrees to radians.
 *
 * @param {number} deg
 * @returns {number}
 */
export function toRadians(deg) {
  return deg * DEG;
}

/**
 * Radians to degrees.
 *
 * @param {number} rad
 * @returns {number}
 */
export function toDegrees(rad) {
  return rad / DEG;
}

/**
 * Great-circle distance between two geodetic points.
 *
 * Haversine: numerically well behaved at short distances, where the simple
 * spherical cosine formula loses precision.
 *
 * @param {number} lat1Rad
 * @param {number} lon1Rad
 * @param {number} lat2Rad
 * @param {number} lon2Rad
 * @returns {number} Distance, metres.
 */
export function greatCircleDistance(lat1Rad, lon1Rad, lat2Rad, lon2Rad) {
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Initial great-circle bearing from one point to another.
 *
 * This is the *initial* bearing: on a long great-circle route the required
 * heading changes continuously, so it must be recomputed as the aircraft moves
 * rather than set once at departure.
 *
 * @param {number} lat1Rad
 * @param {number} lon1Rad
 * @param {number} lat2Rad
 * @param {number} lon2Rad
 * @returns {number} Bearing, radians in [0, 2π).
 */
export function initialBearing(lat1Rad, lon1Rad, lat2Rad, lon2Rad) {
  const dLon = lon2Rad - lon1Rad;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad)
    - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const bearing = Math.atan2(y, x);
  return (bearing + Math.PI * 2) % (Math.PI * 2);
}

/**
 * Signed cross-track distance from a great-circle path.
 *
 * Positive means right of the intended track. Used for the HUD's route
 * deviation readout.
 *
 * @param {number} latRad - Current position.
 * @param {number} lonRad
 * @param {number} startLatRad - Leg start.
 * @param {number} startLonRad
 * @param {number} endLatRad - Leg end.
 * @param {number} endLonRad
 * @returns {number} Cross-track distance, metres.
 */
export function crossTrackDistance(latRad, lonRad, startLatRad, startLonRad, endLatRad, endLonRad) {
  const d13 = greatCircleDistance(startLatRad, startLonRad, latRad, lonRad) / EARTH_RADIUS_M;
  const brg13 = initialBearing(startLatRad, startLonRad, latRad, lonRad);
  const brg12 = initialBearing(startLatRad, startLonRad, endLatRad, endLonRad);
  return Math.asin(Math.sin(d13) * Math.sin(brg13 - brg12)) * EARTH_RADIUS_M;
}

/**
 * Interpolate along a great circle.
 *
 * Used to build route geometry that follows the globe. A straight line in
 * lat/lon space is not a great circle and visibly diverges on long routes, so
 * the polyline is sampled through this rather than drawn point to point.
 *
 * @param {number} lat1Rad
 * @param {number} lon1Rad
 * @param {number} lat2Rad
 * @param {number} lon2Rad
 * @param {number} fraction - 0 at the start, 1 at the end.
 * @returns {{latitudeRad: number, longitudeRad: number}}
 */
export function interpolateGreatCircle(lat1Rad, lon1Rad, lat2Rad, lon2Rad, fraction) {
  const d = greatCircleDistance(lat1Rad, lon1Rad, lat2Rad, lon2Rad) / EARTH_RADIUS_M;
  if (d < 1e-9) return { latitudeRad: lat1Rad, longitudeRad: lon1Rad };

  const sinD = Math.sin(d);
  const a = Math.sin((1 - fraction) * d) / sinD;
  const b = Math.sin(fraction * d) / sinD;

  const x = a * Math.cos(lat1Rad) * Math.cos(lon1Rad) + b * Math.cos(lat2Rad) * Math.cos(lon2Rad);
  const y = a * Math.cos(lat1Rad) * Math.sin(lon1Rad) + b * Math.cos(lat2Rad) * Math.sin(lon2Rad);
  const z = a * Math.sin(lat1Rad) + b * Math.sin(lat2Rad);

  return {
    latitudeRad: Math.atan2(z, Math.sqrt(x * x + y * y)),
    longitudeRad: Math.atan2(y, x),
  };
}

let waypointCounter = 0;

/**
 * Build a waypoint.
 *
 * @param {object} options
 * @param {number} options.latitudeDeg
 * @param {number} options.longitudeDeg
 * @param {number} [options.altitudeM] - Target altitude, when the leg has one.
 * @param {string} [options.label] - Display name; falls back to coordinates.
 * @param {string} [options.type] - 'departure' | 'enroute' | 'destination' | 'direct'.
 * @param {number} [options.arrivalRadiusM]
 * @returns {object} Waypoint.
 */
export function createWaypoint(options) {
  waypointCounter += 1;
  const lat = options.latitudeDeg;
  const lon = options.longitudeDeg;
  return {
    id: options.id || `wp-${waypointCounter}`,
    latitudeDeg: lat,
    longitudeDeg: lon,
    latitudeRad: toRadians(lat),
    longitudeRad: toRadians(lon),
    altitudeM: Number.isFinite(options.altitudeM) ? options.altitudeM : null,
    label: options.label || formatCoordinates(lat, lon),
    type: options.type || 'enroute',
    arrivalRadiusM: Number.isFinite(options.arrivalRadiusM)
      ? options.arrivalRadiusM
      : DEFAULT_ARRIVAL_RADIUS_M,
  };
}

/**
 * Build a route from waypoints.
 *
 * @param {Array<object>} waypoints - Ordered, at least two.
 * @returns {object} Route with an active-waypoint cursor.
 */
export function createRoute(waypoints = []) {
  return {
    waypoints: [...waypoints],
    /** Index of the waypoint currently being flown toward. */
    activeIndex: waypoints.length > 1 ? 1 : 0,
    /** Set once the final waypoint has been reached; the flight continues. */
    completed: false,
  };
}

/**
 * Total great-circle length of a route.
 *
 * @param {object} route
 * @returns {number} Metres.
 */
export function routeDistance(route) {
  const wps = route?.waypoints || [];
  let total = 0;
  for (let i = 1; i < wps.length; i += 1) {
    total += greatCircleDistance(
      wps[i - 1].latitudeRad, wps[i - 1].longitudeRad,
      wps[i].latitudeRad, wps[i].longitudeRad
    );
  }
  return total;
}

/**
 * The waypoint currently being flown toward.
 *
 * @param {object} route
 * @returns {object|null}
 */
export function activeWaypoint(route) {
  if (!route?.waypoints?.length) return null;
  return route.waypoints[Math.min(route.activeIndex, route.waypoints.length - 1)] || null;
}

/**
 * Navigation solution from a position to the active waypoint.
 *
 * @param {object} route
 * @param {number} latRad - Current latitude.
 * @param {number} lonRad - Current longitude.
 * @param {number} [groundSpeedMps] - For the ETA; omitted or zero yields null.
 * @returns {object|null} { waypoint, distanceM, bearingRad, crossTrackM, etaSeconds, isFinal }
 */
export function navigationSolution(route, latRad, lonRad, groundSpeedMps = 0) {
  const wp = activeWaypoint(route);
  if (!wp) return null;

  const distanceM = greatCircleDistance(latRad, lonRad, wp.latitudeRad, wp.longitudeRad);
  const bearingRad = initialBearing(latRad, lonRad, wp.latitudeRad, wp.longitudeRad);

  // Deviation is measured against the leg being flown, so it needs the previous
  // waypoint; on the first leg there is none, so deviation is undefined.
  const prev = route.waypoints[route.activeIndex - 1] || null;
  const crossTrackM = prev
    ? crossTrackDistance(latRad, lonRad, prev.latitudeRad, prev.longitudeRad, wp.latitudeRad, wp.longitudeRad)
    : 0;

  // Remaining distance includes every leg after the active waypoint.
  let remainingM = distanceM;
  for (let i = route.activeIndex + 1; i < route.waypoints.length; i += 1) {
    remainingM += greatCircleDistance(
      route.waypoints[i - 1].latitudeRad, route.waypoints[i - 1].longitudeRad,
      route.waypoints[i].latitudeRad, route.waypoints[i].longitudeRad
    );
  }

  return {
    waypoint: wp,
    distanceM,
    remainingM,
    bearingRad,
    crossTrackM,
    etaSeconds: groundSpeedMps > 1 ? remainingM / groundSpeedMps : null,
    isFinal: route.activeIndex >= route.waypoints.length - 1,
  };
}

/**
 * Advance the cursor if the active waypoint has been reached.
 *
 * At the final waypoint the route is flagged complete but the cursor stays put
 * and the flight continues — reaching the destination is not the end of the
 * session, so the player can circle or land.
 *
 * @param {object} route - Mutated in place.
 * @param {number} latRad
 * @param {number} lonRad
 * @returns {{advanced: boolean, completed: boolean, waypoint: object|null}}
 */
export function updateRouteProgress(route, latRad, lonRad) {
  const wp = activeWaypoint(route);
  if (!wp) return { advanced: false, completed: route?.completed === true, waypoint: null };

  const distanceM = greatCircleDistance(latRad, lonRad, wp.latitudeRad, wp.longitudeRad);
  if (distanceM > wp.arrivalRadiusM) {
    return { advanced: false, completed: route.completed, waypoint: wp };
  }

  const isFinal = route.activeIndex >= route.waypoints.length - 1;
  if (isFinal) {
    const firstTime = !route.completed;
    route.completed = true;
    return { advanced: firstTime, completed: true, waypoint: wp };
  }

  route.activeIndex += 1;
  return { advanced: true, completed: false, waypoint: activeWaypoint(route) };
}

/**
 * Replace the active target with an ad-hoc waypoint ("DIRECT TO").
 *
 * Inserted at the cursor so the rest of the route is preserved behind it,
 * rather than discarding the plan the player built.
 *
 * @param {object} route - Mutated in place.
 * @param {object} waypoint
 * @returns {object} The route.
 */
export function directTo(route, waypoint) {
  const index = Math.max(1, Math.min(route.activeIndex, route.waypoints.length));
  route.waypoints.splice(index, 0, { ...waypoint, type: 'direct' });
  route.activeIndex = index;
  route.completed = false;
  return route;
}

/**
 * Sample a route into a dense great-circle polyline.
 *
 * @param {object} route
 * @param {number} [segmentsPerLeg] - Samples per leg; more for longer legs.
 * @returns {Array<{latitudeDeg: number, longitudeDeg: number}>}
 */
export function sampleRoutePath(route, segmentsPerLeg = 0) {
  const wps = route?.waypoints || [];
  const points = [];
  for (let i = 1; i < wps.length; i += 1) {
    const a = wps[i - 1];
    const b = wps[i];
    const legM = greatCircleDistance(a.latitudeRad, a.longitudeRad, b.latitudeRad, b.longitudeRad);
    // One sample per ~50 km keeps a transatlantic route smooth without
    // producing thousands of positions for a short hop.
    const steps = segmentsPerLeg || Math.max(2, Math.min(256, Math.ceil(legM / 50_000)));
    for (let s = 0; s <= steps; s += 1) {
      if (i > 1 && s === 0) continue; // don't duplicate the shared waypoint
      const f = s / steps;
      const p = interpolateGreatCircle(a.latitudeRad, a.longitudeRad, b.latitudeRad, b.longitudeRad, f);
      points.push({ latitudeDeg: toDegrees(p.latitudeRad), longitudeDeg: toDegrees(p.longitudeRad) });
    }
  }
  return points;
}

/**
 * Format coordinates for a waypoint label.
 *
 * @param {number} latDeg
 * @param {number} lonDeg
 * @returns {string}
 */
export function formatCoordinates(latDeg, lonDeg) {
  const ns = latDeg >= 0 ? 'N' : 'S';
  const ew = lonDeg >= 0 ? 'E' : 'W';
  return `${Math.abs(latDeg).toFixed(3)}°${ns} ${Math.abs(lonDeg).toFixed(3)}°${ew}`;
}

/**
 * Metres to nautical miles, formatted with a thousands separator.
 *
 * @param {number} metres
 * @returns {string} e.g. "2,991"
 */
export function formatNauticalMiles(metres) {
  const nm = metres / METRES_PER_NM;
  return nm.toLocaleString('en-US', { maximumFractionDigits: nm < 10 ? 1 : 0 });
}
