import * as Cesium from 'cesium';

/**
 * Flight Sim cameras.
 *
 * Four views, cycled with `C`. Offsets come from the aircraft's
 * `cameraAnchors` block rather than being hardcoded here, so a different
 * aeroplane frames differently without touching this file.
 *
 * The chase camera deliberately LAGS the aircraft. Snapping the camera to the
 * aircraft's exact orientation every frame is what makes a chase view feel
 * rigid and nauseating; damping the follow gives the sense of a camera being
 * dragged along behind something heavy.
 */

/** View order for the C key. */
export const CAMERA_MODES = ['chase', 'nose', 'orbit', 'wing'];

/** How quickly the chase camera catches up, per second. Lower is floatier. */
const CHASE_DAMPING = 2.4;
/** Orbit view rotation rate while idle, radians/second. */
const ORBIT_IDLE_RATE = 0.12;
/** Neutral view: no zoom, no free-look. */
const DEFAULT_VIEW = Object.freeze({ zoom: 1, lookYaw: 0, lookPitch: 0 });

/**
 * Create the camera controller.
 *
 * @param {object} viewer - Cesium viewer.
 * @returns {object} Camera controller.
 */
export function createSimCamera(viewer) {
  let mode = 'chase';
  let orbitAngle = 0;
  /** Smoothed camera position, so the chase view eases rather than snapping. */
  let smoothedPosition = null;
  let smoothedHeading = null;

  const scratchCarto = new Cesium.Cartographic();
  const scratchAircraft = new Cesium.Cartesian3();
  const scratchOffset = new Cesium.Cartesian3();
  const scratchTarget = new Cesium.Cartesian3();
  const scratchEnu = new Cesium.Matrix4();
  const scratchHpr = new Cesium.HeadingPitchRoll();
  const scratchDirection = new Cesium.Cartesian3();
  const scratchUp = new Cesium.Cartesian3();
  let currentView = DEFAULT_VIEW;

  /**
   * Aircraft position as a Cartesian.
   *
   * @param {object} state
   * @returns {Cesium.Cartesian3}
   */
  function aircraftPosition(state) {
    scratchCarto.latitude = state.latitudeRad;
    scratchCarto.longitude = state.longitudeRad;
    scratchCarto.height = state.altitudeM;
    return Cesium.Cartographic.toCartesian(scratchCarto, Cesium.Ellipsoid.WGS84, scratchAircraft);
  }

  /**
   * Place the camera for the current mode.
   *
   * @param {object} state - Flight state.
   * @param {object} aircraft - Catalog entry.
   * @param {number} dt - Seconds, for damping.
   * @returns {void}
   */
  function update(state, aircraft, dt, view) {
    if (!viewer?.camera) return;
    const anchors = aircraft.cameraAnchors || {};
    const position = aircraftPosition(state);
    // Zoom and free-look come from the input layer. Defaults keep every
    // existing caller (and every test) working unchanged.
    currentView = view || DEFAULT_VIEW;

    // Local east-north-up frame AT THE AIRCRAFT, rebuilt every frame. This is
    // what keeps the camera correctly oriented relative to the surface as the
    // aircraft crosses the globe, instead of drifting relative to a frame fixed
    // at the departure point.
    Cesium.Transforms.eastNorthUpToFixedFrame(position, Cesium.Ellipsoid.WGS84, scratchEnu);

    if (mode === 'orbit') {
      orbitAngle += ORBIT_IDLE_RATE * dt;
      const anchor = anchors.orbit || { forward: 0, right: 0, up: 10, radius: 150 };
      const radius = (anchor.radius || 150) * currentView.zoom;
      setFromLocalOffset(
        Math.cos(orbitAngle) * radius,
        Math.sin(orbitAngle) * radius,
        anchor.up,
        position,
        state,
        /* lookAtAircraft */ true
      );
      return;
    }

    const anchor = anchors[mode] || anchors.chase;
    if (!anchor) return;

    if (mode === 'chase') {
      // The offset is expressed in the aircraft's own frame, so the camera sits
      // behind the nose regardless of heading. Heading is damped so a rapid
      // turn swings the camera round smoothly.
      smoothedHeading = smoothedHeading === null
        ? state.headingRad
        : dampAngle(smoothedHeading, state.headingRad, CHASE_DAMPING * dt);
      placeBehind(position, smoothedHeading, state, anchor, dt);
      return;
    }

    // Nose and wing ride rigidly with the airframe — they are mounted cameras.
    placeBehind(position, state.headingRad, state, anchor, dt, /* rigid */ true);
  }

  /**
   * Position the camera at an offset in the aircraft's local frame.
   *
   * @param {Cesium.Cartesian3} position
   * @param {number} headingRad
   * @param {object} state
   * @param {object} anchor - { forward, right, up }
   * @param {number} dt
   * @param {boolean} [rigid] - Skip positional damping.
   * @returns {void}
   */
  function placeBehind(position, headingRad, state, anchor, dt, rigid = false) {
    // Apply zoom and free-look to the anchor BEFORE rotating it into world
    // space. The anchor is treated as a point on a sphere around the aircraft:
    // zoom scales the radius, lookYaw swings it around, lookPitch raises it.
    // Doing it here means every camera mode inherits the behaviour for free.
    let aForward = anchor.forward;
    let aRight = anchor.right;
    let aUp = anchor.up;
    if (!rigid) {
      const zoom = currentView.zoom || 1;
      const yaw = currentView.lookYaw || 0;
      const lookPitch = currentView.lookPitch || 0;

      // Horizontal radius and bearing of the anchor, then swing by lookYaw.
      const flat = Math.hypot(aForward, aRight);
      const bearing = Math.atan2(aRight, aForward) + yaw;
      // lookPitch trades horizontal distance for height, keeping total range.
      const range = Math.hypot(flat, aUp) * zoom;
      const baseElev = Math.atan2(aUp, flat) + lookPitch;
      const horiz = Math.cos(baseElev) * range;
      aUp = Math.sin(baseElev) * range;
      aForward = Math.cos(bearing) * horiz;
      aRight = Math.sin(bearing) * horiz;
    }

    // Rotate the body-frame offset into east/north.
    const sin = Math.sin(headingRad);
    const cos = Math.cos(headingRad);
    const east = aForward * sin + aRight * cos;
    const north = aForward * cos - aRight * sin;
    Cesium.Cartesian3.fromElements(east, north, aUp, scratchOffset);
    Cesium.Matrix4.multiplyByPoint(scratchEnu, scratchOffset, scratchTarget);

    if (rigid || !smoothedPosition) {
      smoothedPosition = Cesium.Cartesian3.clone(scratchTarget, smoothedPosition || new Cesium.Cartesian3());
    } else {
      // Exponential smoothing toward the ideal camera point. The clamp keeps a
      // long frame from producing a jump.
      const t = Math.min(1, CHASE_DAMPING * dt);
      Cesium.Cartesian3.lerp(smoothedPosition, scratchTarget, t, smoothedPosition);
    }

    if (mode === 'chase' || mode === 'wing') {
      // Aim AT the aircraft rather than using a fixed pitch. A fixed pitch only
      // frames correctly at one distance and one climb angle — the moment the
      // aircraft pitches up or the camera lags in a turn, the aeroplane slides
      // out of shot. Looking at it keeps it centred by construction, which is
      // what makes this read as a proper third-person view.
      const direction = Cesium.Cartesian3.subtract(position, smoothedPosition, scratchDirection);
      Cesium.Cartesian3.normalize(direction, direction);
      // "Up" is away from the Earth's centre at the camera, then rolled slightly
      // with the aircraft so a banked turn feels banked.
      Cesium.Cartesian3.normalize(smoothedPosition, scratchUp);
      viewer.camera.setView({
        destination: smoothedPosition,
        orientation: { direction, up: scratchUp },
      });
      if (Math.abs(state.rollRad) > 0.01) viewer.camera.twistLeft(-state.rollRad * 0.18);
      return;
    }

    scratchHpr.heading = headingRad;
    scratchHpr.pitch = Cesium.Math.toRadians(-4) + state.pitchRad * 0.6;
    scratchHpr.roll = state.rollRad * 0.6;

    viewer.camera.setView({
      destination: smoothedPosition,
      orientation: {
        heading: scratchHpr.heading,
        pitch: scratchHpr.pitch,
        roll: scratchHpr.roll,
      },
    });
  }

  /**
   * Place the camera at a local offset and aim it at the aircraft.
   *
   * @param {number} east
   * @param {number} north
   * @param {number} up
   * @param {Cesium.Cartesian3} position
   * @param {object} state
   * @returns {void}
   */
  function setFromLocalOffset(east, north, up, position, state) {
    Cesium.Cartesian3.fromElements(east, north, up, scratchOffset);
    Cesium.Matrix4.multiplyByPoint(scratchEnu, scratchOffset, scratchTarget);
    const direction = Cesium.Cartesian3.subtract(position, scratchTarget, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(direction, direction);
    viewer.camera.setView({
      destination: scratchTarget,
      orientation: {
        direction,
        up: Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.clone(scratchTarget, new Cesium.Cartesian3()),
          new Cesium.Cartesian3()
        ),
      },
    });
    void state;
  }

  return {
    update,

    /**
     * Advance to the next view.
     *
     * @returns {string} The new mode.
     */
    cycle() {
      const index = CAMERA_MODES.indexOf(mode);
      mode = CAMERA_MODES[(index + 1) % CAMERA_MODES.length];
      // Dropping the smoothing state makes the new view take effect at once
      // instead of easing across from the previous one's position.
      smoothedPosition = null;
      smoothedHeading = null;
      return mode;
    },

    /**
     * @returns {string}
     */
    getMode() {
      return mode;
    },

    /**
     * @param {string} next
     * @returns {void}
     */
    setMode(next) {
      if (CAMERA_MODES.includes(next)) {
        mode = next;
        smoothedPosition = null;
        smoothedHeading = null;
      }
    },

    /**
     * Drop all smoothing — used on restart so the camera does not sweep across
     * the world from where the last flight ended.
     *
     * @returns {void}
     */
    reset() {
      smoothedPosition = null;
      smoothedHeading = null;
      orbitAngle = 0;
    },
  };
}

/**
 * Damp an angle toward a target the short way round.
 *
 * @param {number} current
 * @param {number} target
 * @param {number} t - 0..1 blend.
 * @returns {number}
 */
export function dampAngle(current, target, t) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * Math.min(1, Math.max(0, t));
}
