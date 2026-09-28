import * as Cesium from 'cesium';

/**
 * Flight Sim aircraft renderer.
 *
 * Owns the single Cesium `Model` for the player's aircraft and updates its
 * `modelMatrix` in place every frame. It never destroys and re-adds the model —
 * doing that per frame is the classic way to make this kind of mode stutter and
 * leak GPU memory.
 *
 * MATRIX OWNERSHIP: the matrix is written into the model's OWN `modelMatrix`
 * object, never a module-level scratch. `src/data/flights.js` documents why —
 * `Model.modelMatrix` is a plain field that Cesium clones per frame, so sharing
 * one scratch across models renders them all at the last-written transform.
 * There is only one aircraft here, but the rule is kept so the code stays
 * correct if a second one is ever added.
 *
 * ORIENTATION: the bundled fleet is baked nose toward local −X, which is why
 * `flights.js` applies a 180° heading offset. The same convention is honoured
 * here, with a per-aircraft override in the catalog for assets baked differently.
 */

/** The bundled fleet's nose points opposite Cesium heading 0. Matches flights.js. */
const MODEL_HEADING_OFFSET_DEG = 180;
/** Floor so the aircraft stays visible from a distant chase camera. */
const MODEL_MIN_PX = 32;

/**
 * Hinge-axis names from the hinge map, in model space.
 *
 * The convention is measured, not assumed: nose −X, up +Y, starboard +Z.
 * Pitch-type surfaces (ailerons, elevators, flaps, spoilers) and the gear hinge
 * about the spanwise axis; the rudder about the vertical; fans spin about the
 * longitudinal.
 */
const AXES = {
  x: Cesium.Cartesian3.UNIT_X,
  y: Cesium.Cartesian3.UNIT_Y,
  z: Cesium.Cartesian3.UNIT_Z,
};

/**
 * Resolve semantic control names against the real node hierarchy of a loaded model.
 *
 * Nothing is assumed to exist. Every name in the aircraft's `controlSurfaces`
 * map is tested against the actual node names, and whatever is missing is
 * simply absent from the result — the animator then skips it rather than
 * falling back to rotating the whole airframe.
 *
 * @param {object} model - Loaded Cesium Model.
 * @param {object} controlSurfaces - Catalog map of control name → RegExp[].
 * @returns {{bound: object, missing: string[]}} Resolved nodes and what was absent.
 */
export function bindControlSurfaces(model, controlSurfaces = {}, hingeMap = {}) {
  const bound = {};
  const missing = [];

  /** @type {Array<{name: string, node: object}>} */
  const nodes = [];
  try {
    // Cesium exposes nodes by name; there is no public enumeration, so the
    // hierarchy is read from the underlying glTF when available.
    const gltfNodes = model?._sceneGraph?._components?.nodes
      || model?.sceneGraph?.components?.nodes
      || [];
    for (const n of gltfNodes) {
      if (!n?.name) continue;
      const handle = model.getNode ? model.getNode(n.name) : null;
      if (handle) nodes.push({ name: n.name, node: handle });
    }
  } catch {
    // A model whose internals we cannot read simply has no bindable surfaces.
  }

  for (const [control, patterns] of Object.entries(controlSurfaces)) {
    const matches = nodes.filter(({ name }) => patterns.some((re) => re.test(name)));
    if (!matches.length) {
      missing.push(control);
      continue;
    }
    bound[control] = matches.map(({ name, node }) => {
      const entry = hingeMap[name];
      return {
        name,
        node,
        // The rest transform is captured ONCE. Every animation is then computed
        // as rest × control, never by accumulating onto the live matrix —
        // otherwise small per-frame rotations compound until the part has spun
        // away.
        restMatrix: Cesium.Matrix4.clone(node.matrix, new Cesium.Matrix4()),
        // Hinge line in model space. This asset bakes geometry into vertices and
        // leaves node transforms at identity, so a rotation with no hinge would
        // pivot the part about the AIRCRAFT origin — the rudder sits ~38 m aft
        // and would swing through a 38 m arc. Absent a hinge the part rotates
        // about its own origin, which is right for spinning parts like fans.
        hinge: entry ? Cesium.Cartesian3.fromArray(entry.hinge) : null,
        hingeAxis: entry?.axis || null,
      };
    });
  }

  return { bound, missing };
}

/**
 * Create the aircraft renderer.
 *
 * @param {object} viewer - Cesium viewer.
 * @returns {object} Renderer with load/update/destroy.
 */
export function createSimAircraftRenderer(viewer) {
  /** @type {object|null} */
  let model = null;
  /** @type {object} */
  let bindings = { bound: {}, missing: [] };
  /** @type {object|null} */
  let aircraft = null;
  let loadFailed = false;
  /** Hinge map held until the model is ready enough to bind against. */
  let pendingHingeMap = null;

  // Scratches reused every frame so the hot path allocates nothing.
  const scratchHpr = new Cesium.HeadingPitchRoll();
  const scratchCarto = new Cesium.Cartographic();
  const scratchPos = new Cesium.Cartesian3();
  const scratchNodeMtx = new Cesium.Matrix4();
  const scratchHingeMtx = new Cesium.Matrix4();
  const scratchRotation = new Cesium.Matrix3();
  const scratchQuat = new Cesium.Quaternion();
  const scratchNegHinge = new Cesium.Cartesian3();

  /** Accumulated fan angle, wrapped so it never grows without bound. */
  let fanAngleRad = 0;
  /** Accumulated wheel angle, likewise wrapped. */
  let wheelAngleRad = 0;

  /**
   * Load the aircraft model.
   *
   * @param {object} definition - Catalog entry.
   * @returns {Promise<{ok: boolean, missing: string[], error?: string}>}
   */
  async function load(definition) {
    aircraft = definition;
    loadFailed = false;

    // Hinge lines are optional: without them parts still bind, they simply
    // rotate about their own origin. A model whose geometry is NOT baked does
    // not need them at all.
    let hingeMap = {};
    if (definition.hingeMapUrl) {
      try {
        const response = await fetch(definition.hingeMapUrl);
        if (response.ok) hingeMap = (await response.json())?.hinges || {};
      } catch {
        // Non-fatal — the aircraft still flies, its surfaces just pivot crudely.
      }
    }

    try {
      model = await Cesium.Model.fromGltfAsync({
        url: definition.modelUrl,
        asynchronous: false,
        minimumPixelSize: MODEL_MIN_PX,
        scale: definition.modelScale ?? 1,
        // A distinct id so scene.pick can tell the simulated aircraft apart from
        // every live ADS-B contact. Never an icao24.
        id: 'flight-sim-aircraft',
      });
      model.show = false;
      viewer.scene.primitives.add(model);
      // Binding is deferred to the first ready frame. fromGltfAsync resolves
      // before Model.ready flips — getNode() throws until then — and awaiting
      // readyEvent here would deadlock, because that event only fires during a
      // render pass and the render-governor hold is not taken until after this
      // load succeeds. So the scene may legitimately be idle at this point.
      pendingHingeMap = hingeMap;
      bindings = { bound: {}, missing: [] };
      return { ok: true, missing: [], deferredBinding: true };
    } catch (error) {
      loadFailed = true;
      model = null;
      // An invisible aircraft is worse than a clear failure, so the caller is
      // told rather than being left with a flying camera and no aeroplane.
      return { ok: false, missing: [], error: String(error?.message || error) };
    }
  }

  /**
   * Update position, attitude and any bound control surfaces.
   *
   * @param {object} state - Flight state.
   * @param {number} dt - Seconds since the last update, for spin rates.
   * @returns {void}
   */
  function update(state, dt) {
    if (!model || !model.ready) return;

    // First ready frame: now getNode() works, so resolve the control surfaces.
    if (pendingHingeMap) {
      bindings = bindControlSurfaces(model, aircraft?.controlSurfaces, pendingHingeMap);
      pendingHingeMap = null;
      if (bindings.missing.length) {
        console.info(`[FlightSim] control surfaces not in this asset: ${bindings.missing.join(", ")}`);
      }
    }

    scratchCarto.latitude = state.latitudeRad;
    scratchCarto.longitude = state.longitudeRad;
    scratchCarto.height = state.altitudeM;
    const position = Cesium.Cartographic.toCartesian(scratchCarto, Cesium.Ellipsoid.WGS84, scratchPos);

    const orientation = aircraft?.modelOrientation || {};
    scratchHpr.heading = state.headingRad
      + Cesium.Math.toRadians(MODEL_HEADING_OFFSET_DEG + (orientation.headingOffsetDeg || 0));
    scratchHpr.pitch = state.pitchRad + Cesium.Math.toRadians(orientation.pitchOffsetDeg || 0);
    scratchHpr.roll = state.rollRad + Cesium.Math.toRadians(orientation.rollOffsetDeg || 0);

    // Written into the model's own matrix — see the file header.
    // headingPitchRollToFixedFrame rebuilds the local ENU frame at the CURRENT
    // position every call, which is what keeps the aircraft upright relative to
    // the surface after thousands of kilometres instead of slowly tilting.
    Cesium.Transforms.headingPitchRollToFixedFrame(
      position, scratchHpr, Cesium.Ellipsoid.WGS84, undefined, model.modelMatrix
    );

    model.show = true;
    animateSurfaces(state, dt);
  }

  /**
   * Drive whatever control surfaces the asset actually exposes.
   *
   * Every transform is `rest × control`, so nothing accumulates. Controls with
   * no bound node are skipped silently.
   *
   * @param {object} state
   * @param {number} dt
   * @returns {void}
   */
  function animateSurfaces(state, dt) {
    const bound = bindings.bound;
    if (!bound || !Object.keys(bound).length) return;

    /**
     * Deflect a bound group about its hinge line, from its rest transform.
     *
     * Builds `rest · T(hinge) · R(axis, θ) · T(−hinge)`, so the part pivots on
     * its own hinge rather than the aircraft origin, and never accumulates.
     *
     * @param {string} control - Semantic control name.
     * @param {number} angleRad - Deflection.
     * @param {Cesium.Cartesian3} [fallbackAxis] - Used when the hinge map has no
     *   axis for this part.
     */
    const deflect = (control, angleRad, fallbackAxis) => {
      const group = bound[control];
      if (!group) return;
      for (const part of group) {
        const axis = AXES[part.hingeAxis] || fallbackAxis || Cesium.Cartesian3.UNIT_Z;
        Cesium.Matrix3.fromQuaternion(
          Cesium.Quaternion.fromAxisAngle(axis, angleRad, scratchQuat),
          scratchRotation
        );
        Cesium.Matrix4.fromRotation(scratchRotation, scratchNodeMtx);

        if (part.hinge) {
          // Translate the hinge to the origin, rotate, translate back.
          Cesium.Matrix4.fromTranslation(part.hinge, scratchHingeMtx);
          Cesium.Matrix4.multiply(scratchHingeMtx, scratchNodeMtx, scratchNodeMtx);
          Cesium.Cartesian3.negate(part.hinge, scratchNegHinge);
          Cesium.Matrix4.fromTranslation(scratchNegHinge, scratchHingeMtx);
          Cesium.Matrix4.multiply(scratchNodeMtx, scratchHingeMtx, scratchNodeMtx);
        }

        Cesium.Matrix4.multiply(part.restMatrix, scratchNodeMtx, scratchNodeMtx);
        part.node.matrix = scratchNodeMtx;
      }
    };

    const maxDeflect = Cesium.Math.toRadians(25);

    // Ailerons oppose each other — that is what makes it a roll rather than a
    // symmetric flap deflection.
    deflect('aileronLeft', state.rollInput * maxDeflect);
    deflect('aileronRight', -state.rollInput * maxDeflect);
    deflect('elevatorLeft', -state.pitchInput * maxDeflect);
    deflect('elevatorRight', -state.pitchInput * maxDeflect);
    deflect('rudder', state.yawInput * maxDeflect);
    deflect('flaps', state.flapFraction * Cesium.Math.toRadians(30));
    deflect('spoilers', -state.spoilerFraction * Cesium.Math.toRadians(45));

    // Gear swings through 90 degrees. This asset models the gear RETRACTED, so
    // the deflection is proportional to how far it has come DOWN.
    const gearAngle = state.gearFraction * Cesium.Math.toRadians(90);
    deflect('noseGear', gearAngle);
    deflect('mainGear', gearAngle);

    // Spin angles are wrapped into [0, 2π) every frame. Left unwrapped they grow
    // without bound and lose float precision over a long flight.
    if (bound.wheels && state.onGround) {
      const wheelRadiusM = 0.6;
      wheelAngleRad = (wheelAngleRad + (state.speedMps / wheelRadiusM) * dt) % (Math.PI * 2);
      deflect('wheels', wheelAngleRad);
    }
    if (bound.engineFans) {
      const rpm = state.engineOutput * (aircraft?.maxFanRpm || 3_000);
      fanAngleRad = (fanAngleRad + (rpm / 60) * Math.PI * 2 * dt) % (Math.PI * 2);
      deflect('engineFans', fanAngleRad, Cesium.Cartesian3.UNIT_X);
    }
  }

  return {
    load,
    update,
    /**
     * The Cesium Model, for the camera to anchor to.
     * @returns {object|null}
     */
    getModel() {
      return model;
    },
    /**
     * Control names the asset does not expose.
     * @returns {string[]}
     */
    getMissingControls() {
      return bindings.missing;
    },
    /**
     * @returns {boolean}
     */
    didFailToLoad() {
      return loadFailed;
    },
    /**
     * @returns {void}
     */
    hide() {
      if (model) model.show = false;
    },
    /**
     * Remove the model from the scene and drop every reference.
     *
     * Called on exit and before a restart, so entering the mode repeatedly
     * never stacks up models or leaks GPU memory.
     *
     * @returns {void}
     */
    destroy() {
      if (model) {
        try {
          viewer.scene.primitives.remove(model);
        } catch {
          // Already removed with the scene; nothing to do.
        }
        model = null;
      }
      bindings = { bound: {}, missing: [] };
      aircraft = null;
      fanAngleRad = 0;
      wheelAngleRad = 0;
    },
  };
}
