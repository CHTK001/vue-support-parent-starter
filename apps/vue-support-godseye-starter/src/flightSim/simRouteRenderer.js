import * as Cesium from 'cesium';
import {
  greatCircleDistance,
  initialBearing,
  interpolateGreatCircle,
  sampleRoutePath,
  toDegrees,
} from './simRoute.js';

/**
 * Flight Sim route rendering: the great-circle track and the plank gates.
 *
 * The gates are REAL geometry in the world, not a HUD overlay — white planks
 * standing in the sky at the aircraft's altitude, marking the way to the active
 * waypoint. They grow as you approach and pass overhead as you fly through,
 * which a screen-space indicator can never do.
 *
 * PERFORMANCE: geometry is created ONCE and then repositioned by updating each
 * primitive's `modelMatrix`. Rebuilding Cesium primitives per frame is the
 * classic way to make a mode like this stutter, so the gate pool is fixed and
 * recycled — only the transforms change.
 */

/** How many gates lead the aircraft toward the active waypoint. */
const GATE_COUNT = 5;
/** Spacing between gates along the track, metres. */
const GATE_SPACING_M = 3_500;
/** Gate opening, metres — comfortably bigger than a 747's 68 m span. */
const GATE_WIDTH_M = 340;
const GATE_HEIGHT_M = 210;
/** Plank cross-section, metres. */
const PLANK_THICKNESS_M = 14;
/** Beyond this the gates are pointless clutter, so they hide. */
const GATE_VISIBLE_RANGE_M = 60_000;

/**
 * Create the route renderer.
 *
 * @param {object} viewer - Cesium viewer.
 * @returns {object} Route renderer.
 */
export function createSimRouteRenderer(viewer) {
  /** @type {object|null} */
  let routeEntity = null;
  /** @type {object[]} */
  let markerEntities = [];
  /** @type {object[]} Fixed pool of gate primitives, recycled every frame. */
  let gates = [];
  let visible = false;

  const scratchCarto = new Cesium.Cartographic();
  const scratchPos = new Cesium.Cartesian3();
  const scratchHpr = new Cesium.HeadingPitchRoll();

  /**
   * Build the gate pool once.
   *
   * Each gate is three box primitives — two uprights and a lintel — grouped
   * under one matrix so the whole gate moves with a single transform.
   *
   * @returns {void}
   */
  function ensureGates() {
    if (gates.length) return;
    for (let i = 0; i < GATE_COUNT; i += 1) {
      const collection = new Cesium.PrimitiveCollection();
      const parts = [];
      // [ offsetRight, offsetUp, width, height ] in the gate's local frame.
      const planks = [
        [-GATE_WIDTH_M / 2, 0, PLANK_THICKNESS_M, GATE_HEIGHT_M],
        [GATE_WIDTH_M / 2, 0, PLANK_THICKNESS_M, GATE_HEIGHT_M],
        [0, GATE_HEIGHT_M / 2, GATE_WIDTH_M + PLANK_THICKNESS_M, PLANK_THICKNESS_M],
      ];
      for (const [right, up, width, height] of planks) {
        const primitive = new Cesium.Primitive({
          geometryInstances: new Cesium.GeometryInstance({
            geometry: Cesium.BoxGeometry.fromDimensions({
              vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
              dimensions: new Cesium.Cartesian3(PLANK_THICKNESS_M, width, height),
            }),
            attributes: {
              color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                Cesium.Color.WHITE.withAlpha(0.92)
              ),
            },
          }),
          appearance: new Cesium.PerInstanceColorAppearance({ translucent: true, closed: true }),
          asynchronous: false,
          modelMatrix: Cesium.Matrix4.IDENTITY.clone(),
          // Gates are scenery, never click targets — picking them would steal
          // clicks from the globe and from live contacts.
          allowPicking: false,
        });
        primitive.__localOffset = { right, up };
        parts.push(primitive);
        collection.add(primitive);
      }
      collection.show = false;
      viewer.scene.primitives.add(collection);
      gates.push({ collection, parts });
    }
  }

  return {
    /**
     * Draw the planned route: a geodesic line plus labelled endpoints.
     *
     * Called when the plan changes, NOT per frame — the polyline is static
     * geometry once the waypoints are fixed.
     *
     * @param {object} route
     * @returns {void}
     */
    showRoute(route) {
      this.clearRoute();
      if (!route?.waypoints?.length) return;

      // sampleRoutePath walks the great circle, so a long route bends with the
      // globe instead of cutting a straight line through lat/lon space.
      const path = sampleRoutePath(route);
      const positions = path.map((p) => Cesium.Cartesian3.fromDegrees(p.longitudeDeg, p.latitudeDeg, 0));

      routeEntity = viewer.entities.add({
        polyline: {
          positions,
          width: 2.5,
          clampToGround: false,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.18,
            color: Cesium.Color.fromCssColorString('#00d4ff').withAlpha(0.75),
          }),
        },
      });

      markerEntities = route.waypoints.map((wp) => viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(wp.longitudeDeg, wp.latitudeDeg, 0),
        point: {
          pixelSize: wp.type === 'destination' ? 13 : 10,
          color: Cesium.Color.fromCssColorString('#00d4ff'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: wp.label,
          font: '11px "JetBrains Mono", monospace',
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.6),
          pixelOffset: new Cesium.Cartesian2(0, -22),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      }));
      visible = true;
    },

    /**
     * Reposition the gate pool along the track toward the active waypoint.
     *
     * Runs every frame but allocates nothing and creates no primitives — it
     * only writes each plank's modelMatrix.
     *
     * @param {object} state - Flight state.
     * @param {object|null} solution - Navigation solution.
     * @returns {void}
     */
    updateGates(state, solution) {
      ensureGates();
      if (!solution || !visible) {
        for (const gate of gates) gate.collection.show = false;
        return;
      }

      const wp = solution.waypoint;
      const distanceToWp = solution.distanceM;

      for (let i = 0; i < gates.length; i += 1) {
        const gate = gates[i];
        // Gates sit ahead of the aircraft along the track, the nearest first.
        const ahead = (i + 1) * GATE_SPACING_M;
        if (ahead > distanceToWp + GATE_SPACING_M || distanceToWp > GATE_VISIBLE_RANGE_M) {
          gate.collection.show = false;
          continue;
        }

        // Interpolate along the great circle from the aircraft to the waypoint,
        // so the gates follow the real track rather than a straight line.
        const fraction = Math.min(1, ahead / Math.max(1, distanceToWp));
        const point = interpolateGreatCircle(
          state.latitudeRad, state.longitudeRad,
          wp.latitudeRad, wp.longitudeRad,
          fraction
        );

        scratchCarto.latitude = point.latitudeRad;
        scratchCarto.longitude = point.longitudeRad;
        // Gates hang at the aircraft's altitude so they are always flyable
        // rather than buried in terrain or stranded overhead.
        scratchCarto.height = state.altitudeM;
        const position = Cesium.Cartographic.toCartesian(scratchCarto, Cesium.Ellipsoid.WGS84, scratchPos);

        // Face the gate square to the track, so it reads as a doorway.
        scratchHpr.heading = initialBearing(
          point.latitudeRad, point.longitudeRad, wp.latitudeRad, wp.longitudeRad
        );
        scratchHpr.pitch = 0;
        scratchHpr.roll = 0;

        for (const plank of gate.parts) {
          const { right, up } = plank.__localOffset;
          // Offset each plank within the gate's own frame, then place the frame.
          const local = new Cesium.Cartesian3(0, right, up);
          const frame = Cesium.Transforms.headingPitchRollToFixedFrame(
            position, scratchHpr, Cesium.Ellipsoid.WGS84
          );
          Cesium.Matrix4.multiplyByTranslation(frame, local, plank.modelMatrix);
        }
        gate.collection.show = true;
      }
    },

    /**
     * Remove the route line and markers.
     *
     * @returns {void}
     */
    clearRoute() {
      if (routeEntity) {
        viewer.entities.remove(routeEntity);
        routeEntity = null;
      }
      for (const marker of markerEntities) viewer.entities.remove(marker);
      markerEntities = [];
      visible = false;
    },

    /**
     * Tear everything down, including the gate pool.
     *
     * Called on exit so re-entering the mode never stacks a second pool of
     * primitives on the scene.
     *
     * @returns {void}
     */
    destroy() {
      this.clearRoute();
      for (const gate of gates) {
        try {
          viewer.scene.primitives.remove(gate.collection);
        } catch {
          // Scene already torn down.
        }
      }
      gates = [];
    },
  };
}

/**
 * Distance and bearing from the aircraft to a point, for HUD readouts.
 *
 * @param {object} state
 * @param {object} waypoint
 * @returns {{distanceM: number, bearingDeg: number}}
 */
export function relativeToWaypoint(state, waypoint) {
  return {
    distanceM: greatCircleDistance(
      state.latitudeRad, state.longitudeRad, waypoint.latitudeRad, waypoint.longitudeRad
    ),
    bearingDeg: toDegrees(initialBearing(
      state.latitudeRad, state.longitudeRad, waypoint.latitudeRad, waypoint.longitudeRad
    )),
  };
}
