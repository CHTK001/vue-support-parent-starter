import * as Cesium from 'cesium';
import { holdContinuousRender, releaseContinuousRender, governorRequestRender } from '../renderGovernor.js';
import {
  isAutoQuality,
  resolutionForLevel,
  getRenderQuality,
  setRenderQuality,
  applyRenderQuality as applySceneQuality,
} from '../renderQuality.js';
import { getAircraft, DEFAULT_AIRCRAFT_ID } from './aircraftCatalog.js';
import {
  FIXED_STEP_S,
  clamp,
  createFixedStepAccumulator,
  createFlightState,
  stepFlight,
} from './flightDynamics.js';
import {
  createRoute,
  createWaypoint,
  directTo,
  navigationSolution,
  updateRouteProgress,
  toRadians,
} from './simRoute.js';
import { createAutopilot, disengageAutopilot, engageAutopilot, manualOverrideRequested, updateAutopilot } from './simAutopilot.js';
import { createSimAircraftRenderer } from './simAircraftRenderer.js';
import { createSimCamera } from './simCamera.js';
import { createSimGround, airStartAltitude, resolveGroundContact } from './simGround.js';
import { createSimHud } from './simHud.js';
import { createSimRouteRenderer } from './simRouteRenderer.js';
import { createSimInput } from './simInput.js';

/**
 * Flight Sim controller — the state machine and the app integration point.
 *
 * STATES: OFF → PLANNING → READY → ACTIVE ⇄ PAUSED, and ACTIVE → LOST.
 * Everything mode-related lives here rather than as booleans scattered through
 * main.js.
 *
 * The two integration rules that matter most, both learned from the existing
 * Cockpit implementation:
 *
 * 1. The render-governor hold is taken AFTER every guard has passed. A hold
 *    taken before a guard that then refuses would pin the scene into continuous
 *    rendering for the life of the page — reinstating exactly the GPU burn the
 *    governor exists to prevent. There is no watchdog that would catch it.
 *
 * 2. Camera ownership is claimed through the app's own navigation path, never
 *    by grabbing the Cesium camera directly, so Cockpit and Flight Sim can
 *    never both believe they own it.
 */

/** Render-governor owner id. Verified not to collide with the 15 existing ids. */
export const RENDER_OWNER = 'flight-sim';
/** Body class, matching the `cockpit-mode` / `recording-mode` convention. */
export const BODY_CLASS = 'flight-sim-mode';

/* Tile detail bounds for the adaptive governor. maximumScreenSpaceError is
   INVERSE quality: lower means Cesium tolerates less on-screen error and so
   loads sharper tiles. 16 is the Cesium default and looks soft from altitude;
   8 roughly doubles the detail; 24 is the fallback when the machine cannot
   keep up. */
const TILE_DETAIL_BEST = 8;
const TILE_DETAIL_WORST = 24;
/* Enough haze to read as air, without greying out the whole view. The scene
   default of 0.0006 washes the horizon flat from cruise altitude. */
const FOG_DENSITY_SIM = 0.00012;
/** Identity of the simulated aircraft. Never an icao24, never a live callsign. */
export const SIM_CALLSIGN = 'SIM-001';

/** @enum {string} */
export const FlightSimState = {
  OFF: 'OFF',
  PLANNING: 'PLANNING',
  READY: 'READY',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  LOST: 'LOST',
};

/** Legal transitions. Anything else is a bug and is refused. */
const TRANSITIONS = {
  OFF: ['PLANNING'],
  PLANNING: ['OFF', 'READY'],
  READY: ['OFF', 'PLANNING', 'ACTIVE'],
  ACTIVE: ['PAUSED', 'LOST', 'OFF'],
  PAUSED: ['ACTIVE', 'OFF'],
  LOST: ['OFF', 'ACTIVE'],
};

/**
 * Whether a state change is allowed.
 *
 * Exported so the transition table itself can be tested without a viewer.
 *
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  if (from === to) return false;
  return (TRANSITIONS[from] || []).includes(to);
}

/**
 * Create the Flight Sim controller.
 *
 * @param {object} options
 * @param {object} options.viewer - Cesium viewer.
 * @param {object} [options.hooks] - App integration callbacks.
 * @param {() => boolean} [options.hooks.claimCamera] - Must return false to refuse entry.
 * @param {() => void} [options.hooks.releaseCamera]
 * @param {() => object} [options.hooks.snapshotState]
 * @param {(snapshot: object) => void} [options.hooks.restoreState]
 * @param {(state: string) => void} [options.hooks.onStateChange]
 * @returns {object} Controller.
 */
export function createFlightSimController({ viewer, hooks = {} }) {
  let state = FlightSimState.OFF;
  let aircraft = getAircraft(DEFAULT_AIRCRAFT_ID);
  /** @type {object|null} */
  let flight = null;
  /** @type {object|null} */
  let route = null;
  /** @type {object|null} */
  let snapshot = null;
  let startMode = 'air';
  /** True from a ground spawn until the takeoff roll is genuinely under way. */
  let awaitingGroundSettle = false;
  let heldRender = false;
  /** Scene render settings captured on entry, restored verbatim on exit. */
  let priorQuality = null;
  /**
   * Highest resolution scale this display justifies, as a FRACTION of native.
   *
   * Was an absolute multiplier of min(devicePixelRatio, 2). Once the app began
   * setting useBrowserRecommendedResolution = false, resolutionScale became a
   * fraction OF the device ratio rather than a replacement for it, so the old
   * ceiling would have multiplied against dpr and asked for a 3x-4x buffer —
   * nine to sixteen times the pixels. Native is the ceiling now.
   */
  const QUALITY_CEILING = 1;
  /** Lowest fraction of native worth rendering before it looks broken. */
  const QUALITY_FLOOR = 0.5;
  /** Resolution step. 0.5 / 0.75 / 1.0 avoids fractional canvas resampling. */
  const QUALITY_STEP = 0.25;
  /** Where a session starts before the governor has learned anything. */
  const QUALITY_START = 0.75;

  /**
   * Smoothed frame cost in VSYNC PERIODS, not milliseconds.
   *
   * The old governor smoothed wall-clock frame intervals and stepped up when
   * the average fell below 13 ms. Under vsync the interval is quantised to a
   * whole number of refresh periods, so on a 60 Hz display the average has a
   * hard floor of 16.67 ms and `< 13` was mathematically unreachable. The
   * governor could therefore only ever take the step-DOWN branch: quality
   * ratcheted away over a session and never came back.
   *
   * In periods, 1.0 means "hit every vsync" and is exactly achievable, so
   * stepping back up is reachable by construction.
   */
  let frameLoadPeriods = 1;
  /** Measured refresh period, milliseconds. Never assumed to be 16.67. */
  let refreshPeriodMs = 16.7;
  /**
   * Smoothed real frame time, milliseconds — for the READOUT only.
   *
   * Kept separate from frameLoadPeriods on purpose. The governor works in whole
   * vsync periods because a step decision needs to know "are we missing frames",
   * and rounding to whole periods is what makes that question answerable. But
   * rounding also destroys the number a person wants to read: every rate
   * between two periods collapses onto one of them, so a genuine 26 fps and a
   * genuine 40 fps could both display as the same value. The readout uses the
   * unrounded time and reports what is actually happening.
   */
  let frameMsAvg = 16.7;
  /** Seconds until the next resolution change is allowed. */
  let qualityCooldownS = 0;
  /** Set after a speculative step up, so a failed probe backs off harder. */
  let probedUp = false;
  /** Scene values as found on entry, for restoring the 'Auto' level. */
  let qualityBaseline = null;

  const autopilot = createAutopilot();
  const accumulator = createFixedStepAccumulator();
  const ground = createSimGround();

  // Sub-systems are created lazily on first entry so nothing is allocated for
  // users who never open the mode.
  /** @type {object|null} */
  let renderer = null;
  /** @type {object|null} */
  let camera = null;
  /** @type {object|null} */
  let routeRenderer = null;
  /** @type {object|null} */
  let hud = null;
  /** @type {object|null} */
  let input = null;
  /** @type {Function|null} */
  let removeTick = null;
  let lastFrameMs = 0;

  /**
   * Move to a new state, refusing illegal transitions.
   *
   * @param {string} next
   * @returns {boolean}
   */
  function transition(next) {
    if (!canTransition(state, next)) return false;
    state = next;
    hooks.onStateChange?.(state);
    window.dispatchEvent(new CustomEvent('gev:flight-sim-mode-changed', {
      detail: { state, active: state === FlightSimState.ACTIVE },
    }));
    return true;
  }

  /**
   * Build the sub-systems once.
   * @returns {void}
   */
  function ensureSubsystems() {
    if (renderer) return;
    renderer = createSimAircraftRenderer(viewer);
    camera = createSimCamera(viewer);
    routeRenderer = createSimRouteRenderer(viewer);
    hud = createSimHud(document.getElementById('flightsim-hud'));
    input = createSimInput({
      surface: viewer.scene.canvas,
      onExitRequest: () => exit(),
      onAction: (action) => handleAction(action),
    });
  }

  /**
   * Apply a discrete key action.
   *
   * @param {string} action
   * @returns {void}
   */
  function handleAction(action) {
    if (!flight) return;
    switch (action) {
      case 'gear':
        flight.gearDown = !flight.gearDown;
        break;
      case 'flaps': {
        const count = aircraft.flapDetents.length;
        flight.flapIndex = (flight.flapIndex + 1) % count;
        break;
      }
      case 'spoilers':
        flight.spoilerCommanded = !flight.spoilerCommanded;
        break;
      case 'camera':
        camera?.cycle();
        // A new view starts from its designed framing rather than inheriting
        // the previous one's zoom and free-look angle.
        input?.resetView?.();
        break;
      case 'pause':
        if (state === FlightSimState.ACTIVE) transition(FlightSimState.PAUSED);
        else if (state === FlightSimState.PAUSED) transition(FlightSimState.ACTIVE);
        break;
      case 'mouse-yoke':
        input?.toggleMouseYoke();
        break;
      default:
        break;
    }
  }

  /**
   * One rendered frame: physics at a fixed step, then presentation.
   *
   * @returns {void}
   */
  function onTick() {
    if (state !== FlightSimState.ACTIVE && state !== FlightSimState.PAUSED) return;
    const now = performance.now();
    const deltaS = lastFrameMs ? (now - lastFrameMs) / 1000 : 0;
    lastFrameMs = now;

    if (state === FlightSimState.ACTIVE) {
      const controls = input.sample(deltaS);

      // A deliberate input takes control back from the autopilot at once.
      if (autopilot.engaged && manualOverrideRequested(controls)) disengageAutopilot(autopilot);

      if (autopilot.engaged) {
        const command = updateAutopilot(autopilot, flight, aircraft, route);
        flight.rollInput = command.rollInput;
        flight.pitchInput = command.pitchInput;
        flight.throttle = command.throttle;
      } else {
        flight.rollInput = controls.roll;
        flight.pitchInput = controls.pitch;
        flight.yawInput = controls.yaw;
        flight.throttle = clamp(flight.throttle + controls.throttleDelta, 0, 1);
      }
      flight.brakesOn = controls.brakes && flight.onGround;

      // Physics runs at a fixed 60 Hz regardless of frame rate, so the aircraft
      // behaves identically on a 30 Hz laptop and a 120 Hz display.
      accumulator.advance(deltaS, (dt) => {
        stepFlight(flight, aircraft, dt);
        applyGround(dt);
      });

      if (route) {
        const progress = updateRouteProgress(route, flight.latitudeRad, flight.longitudeRad);
        if (progress.completed && progress.advanced) {
          hud.setWarnings(['DESTINATION REACHED']);
        }
      }
      advancePosition(deltaS);
    }

    const solution = route
      ? navigationSolution(route, flight.latitudeRad, flight.longitudeRad, flight.speedMps)
      : null;

    adaptQuality(deltaS);
    renderer.update(flight, deltaS);
    camera.update(flight, aircraft, deltaS, input?.view?.());
    routeRenderer.updateGates(flight, solution);
    hud.update({
      state: flight,
      aircraft,
      solution,
      autopilot,
      cameraMode: camera.getMode(),
      mouseYoke: input.isMouseYoke(),
      quality: qualityLabel(),
      // The measured frame time, not the governor's rounded load. Reporting
      // the rounded value meant the readout could only ever land on the
      // handful of rates that divide the refresh rate exactly — a real 26 fps
      // and a real 40 fps both showed as the same number.
      fps: frameMsAvg > 0 ? 1000 / frameMsAvg : null,
    });

    // ASK FOR THE NEXT FRAME, HERE, EVERY FRAME.
    //
    // The simulation advances from postRender, so it only steps when a frame is
    // actually drawn: render rate and simulation rate are the same number. That
    // makes it the wrong thing to pace externally. The render governor's pump
    // asks for frames on its own fixed schedule, and when a scene costs more
    // than one pump interval to draw, the two rates beat against each other —
    // requests land at 60 Hz while frames complete at, say, 22 Hz, so the gap
    // between drawn frames alternates irregularly instead of settling. Measured
    // from a 120 fps screen recording, the gaps ranged from 2 to 9 refresh ticks
    // with no stable pattern, which is precisely what reads as shaking.
    //
    // Driving the next frame from the end of this one removes the second clock
    // entirely. The loop then self-paces to whatever the hardware can actually
    // sustain, and the interval between frames is as steady as the work is.
    viewer?.scene?.requestRender?.();
  }

  /**
   * Advance geodetic position from the current velocity.
   *
   * Done here rather than in the physics step because it needs the Earth's
   * curvature: a metre of easting is a different number of degrees at 60°N than
   * at the equator, so latitude and longitude cannot share one scale factor.
   *
   * @param {number} deltaS
   * @returns {void}
   */
  function advancePosition(deltaS) {
    if (!flight || deltaS <= 0) return;
    const groundSpeed = flight.speedMps * Math.cos(flight.flightPathRad);
    const metresNorth = groundSpeed * Math.cos(flight.headingRad) * deltaS;
    const metresEast = groundSpeed * Math.sin(flight.headingRad) * deltaS;

    const radiusM = 6_371_008.8 + flight.altitudeM;
    flight.latitudeRad += metresNorth / radiusM;
    // Longitude degrees shrink with the cosine of latitude; without this the
    // aircraft would travel visibly too fast east-west at high latitude.
    const cosLat = Math.max(1e-6, Math.cos(flight.latitudeRad));
    flight.longitudeRad += metresEast / (radiusM * cosLat);

    // Keep longitude in range so a long eastbound flight never accumulates past
    // ±180 and wraps into invalid coordinates.
    if (flight.longitudeRad > Math.PI) flight.longitudeRad -= Math.PI * 2;
    if (flight.longitudeRad < -Math.PI) flight.longitudeRad += Math.PI * 2;
  }

  /**
   * Resolve terrain contact for this step.
   *
   * @param {number} dt
   * @returns {void}
   */
  function applyGround(dt) {
    // Exclude our own aircraft from the terrain ray — see simGround.heightAt.
    const groundHeight = ground.heightAt(
      viewer, flight.latitudeRad, flight.longitudeRad, flight.altitudeM, groundExclusions()
    );
    flight.terrainHeightM = groundHeight;
    const contact = resolveGroundContact(flight, aircraft, groundHeight);
    flight.altitudeAglM = contact.altitudeAglM;

    if (contact.contact === 'crash') {
      flight.crashed = true;
      // Recorded on the state so the crash screen can name the cause without
      // having to observe the HUD call that happens alongside it.
      flight.lostReason = contact.reason || 'TERRAIN IMPACT';
      transition(FlightSimState.LOST);
      hud.showLost(flight.lostReason);
      return;
    }
    // A GROUND start spawns before the photoreal tiles under the aircraft have
    // streamed in, so the terrain height available at spawn is provisional —
    // observed 172 m at a runway that actually sits at -12 m, leaving the
    // aeroplane parked 180 m in mid-air and flagged as on the ground. Until the
    // takeoff roll is genuinely under way, keep re-seating it on whatever the
    // terrain currently reports rather than trusting that first sample.
    if (awaitingGroundSettle) {
      // stepGroundRoll clears onGround at rotation. The moment it does, the
      // aircraft owns its altitude and must never be pulled back down — which
      // is why this checks the flag rather than only the speed. The speed gate
      // uses the SAME constant the physics rotates on, so the two can never
      // disagree about when the takeoff roll has ended.
      if (!flight.onGround || flight.speedMps >= aircraft.vStallCleanMps * 1.15) {
        awaitingGroundSettle = false;
      } else {
        flight.onGround = true;
        flight.altitudeM = groundHeight + aircraft.gearHeightM;
        flight.verticalSpeedMps = 0;
        flight.altitudeAglM = 0;
        return;
      }
    }

    if (contact.contact === 'touchdown' || contact.contact === 'rolling') {
      flight.onGround = true;
      flight.altitudeM = groundHeight + (flight.gearFraction > 0.9 ? aircraft.gearHeightM : aircraft.bellyOffsetM);
      flight.verticalSpeedMps = 0;
      // Ground spoilers deploy automatically on rollout, as they do in reality.
      if (contact.contact === 'touchdown' && flight.speedMps > 40) flight.spoilerCommanded = true;
    }
    void dt;
  }

  /**
   * Scene objects the terrain ray must never hit.
   *
   * @returns {Array<unknown>}
   */
  function groundExclusions() {
    const model = renderer?.getModel?.();
    return model ? [model] : [];
  }

  /**
   * Build the initial flight state for the current plan.
   *
   * @returns {void}
   */
  function spawn() {
    const departure = route.waypoints[0];
    const next = route.waypoints[1] || departure;
    const groundHeight = ground.heightAt(
      viewer, departure.latitudeRad, departure.longitudeRad, 10_000, groundExclusions()
    );

    const heading = Math.atan2(
      Math.sin(next.longitudeRad - departure.longitudeRad) * Math.cos(next.latitudeRad),
      Math.cos(departure.latitudeRad) * Math.sin(next.latitudeRad)
        - Math.sin(departure.latitudeRad) * Math.cos(next.latitudeRad)
          * Math.cos(next.longitudeRad - departure.longitudeRad)
    );

    const onGround = startMode === 'ground';
    awaitingGroundSettle = onGround;
    flight = createFlightState({
      aircraft,
      latitudeRad: departure.latitudeRad,
      longitudeRad: departure.longitudeRad,
      // An air start is measured above the TERRAIN, not sea level, so spawning
      // over mountains does not put the aircraft underground.
      altitudeM: onGround ? groundHeight + aircraft.gearHeightM : airStartAltitude(groundHeight),
      headingRad: heading,
      // Spawn speed is TRUE airspeed, but the overspeed limit is INDICATED, and
      // at altitude IAS is far lower than TAS. 0.82 of cruise TAS came out at
      // ~368 kt IAS against a 365 kt limit, so every flight began with an
      // OVERSPEED warning. 0.70 gives a comfortable ~310 kt IAS cruise.
      speedMps: onGround ? 0 : aircraft.cruiseTasMps * 0.70,
      onGround,
      gearDown: onGround,
    });
    accumulator.reset();
    camera?.reset();
  }

  /**
   * Begin planning.
   *
   * @returns {boolean}
   */
  function openPlanner() {
    if (state !== FlightSimState.OFF) return false;
    ensureSubsystems();
    return transition(FlightSimState.PLANNING);
  }

  /**
   * Set the plan.
   *
   * @param {object} params
   * @param {{latitudeDeg: number, longitudeDeg: number, label?: string}} params.from
   * @param {{latitudeDeg: number, longitudeDeg: number, label?: string}} params.to
   * @param {string} [params.aircraftId]
   * @param {'air'|'ground'} [params.start]
   * @returns {boolean}
   */
  function setPlan({ from, to, aircraftId, start }) {
    if (!from || !to) return false;
    const definition = getAircraft(aircraftId || DEFAULT_AIRCRAFT_ID);
    if (!definition) return false;
    aircraft = definition;
    startMode = start === 'ground' ? 'ground' : 'air';

    route = createRoute([
      createWaypoint({ ...from, type: 'departure' }),
      createWaypoint({ ...to, type: 'destination' }),
    ]);
    routeRenderer?.showRoute(route);
    governorRequestRender('flight-sim-params');
    if (state === FlightSimState.PLANNING) transition(FlightSimState.READY);
    return true;
  }

  /**
   * Start the flight.
   *
   * Every guard runs BEFORE the render hold — see the file header.
   *
   * @returns {Promise<{ok: boolean, reason?: string, missing?: string[]}>}
   */
  async function start() {
    if (state !== FlightSimState.READY) return { ok: false, reason: 'NOT READY' };
    if (!route?.waypoints?.length) return { ok: false, reason: 'NO ROUTE' };

    // Camera ownership is a guard, not a mutation to roll back: if Cockpit owns
    // the camera this refuses and nothing has been touched yet.
    if (hooks.claimCamera && hooks.claimCamera() === false) {
      return { ok: false, reason: 'CAMERA BUSY' };
    }

    const loaded = await renderer.load(aircraft);
    if (!loaded.ok) {
      // Never start an invisible aircraft — the player would be flying a camera.
      hooks.releaseCamera?.();
      return { ok: false, reason: 'AIRCRAFT MODEL UNAVAILABLE' };
    }

    snapshot = hooks.snapshotState?.() || null;
    spawn();

    document.body.classList.add(BODY_CLASS);
    applyRenderQuality();
    hud.setVisible(true);
    input.attach();

    // Only now, with every guard passed, is the hold taken.
    holdContinuousRender(RENDER_OWNER);
    heldRender = true;
    lastFrameMs = 0;
    removeTick = viewer.scene.postRender.addEventListener(onTick);

    transition(FlightSimState.ACTIVE);
    return { ok: true, missing: loaded.missing };
  }

  /**
   * Leave the mode and restore the app.
   *
   * Written so every step is safe to run twice and safe to run after a failed
   * start — exit paths must never themselves throw.
   *
   * @returns {boolean}
   */
  /**
   * Take the scene over for Flight Sim.
   *
   * The default scene is tuned for a globe carrying hundreds of live contacts.
   * Flight Sim shows ONE aircraft over streaming photoreal tiles, with the
   * horizon filling half the screen — a completely different visual problem.
   * Four separate things were making it look poor, all of them correct choices
   * for the map and wrong here:
   *
   *   - dynamicScreenSpaceError deliberately DROPS detail on tiles far from a
   *     near-ground camera. Looking at the horizon from 6,000 ft, that is
   *     precisely the geometry it degrades, which is the smeared distance.
   *   - fog.screenSpaceErrorFactor degrades distant tiles a second time, on top
   *     of the fog that is already hiding them.
   *   - fog density greys out everything past a few km.
   *   - preferLeaves false means the sharpest tiles arrive last, and at 175 m/s
   *     the aircraft has already gone by.
   *
   * Every value is read back before being changed, so restore returns what was
   * actually there rather than an assumed default.
   *
   * @returns {void}
   */
  function applyRenderQuality() {
    const scene = viewer?.scene;
    if (!scene || priorQuality) return;
    const tileset = findPhotorealTileset();
    const fog = scene.fog;

    // What the scene looked like before this mode touched it — also what
    // 'Auto' restores to when cycled back.
    qualityBaseline = {
      resolutionScale: viewer.resolutionScale,
      tileError: tileset?.maximumScreenSpaceError,
      dynamicScreenSpaceError: tileset?.dynamicScreenSpaceError,
    };
    priorQuality = {
      resolutionScale: viewer.resolutionScale,
      msaaSamples: scene.msaaSamples,
      fxaa: scene.postProcessStages?.fxaa?.enabled,
      // NOTE: enableInputs is deliberately NOT captured for restore. See
      // restoreRenderQuality for why.
      tileset,
      tilesetMse: tileset?.maximumScreenSpaceError,
      dynamicSse: tileset?.dynamicScreenSpaceError,
      preferLeaves: tileset?.preferLeaves,
      fogDensity: fog?.density,
      fogSseFactor: fog?.screenSpaceErrorFactor,
    };

    // Flight Sim drives the camera itself with setView every frame. Leaving
    // Cesium's own controller enabled means TWO things fight for the same
    // drag — it spins the globe while we orbit the aircraft, and the camera
    // visibly judders between the two. This mode owns the camera outright.
    if (scene.screenSpaceCameraController) {
      scene.screenSpaceCameraController.enableInputs = false;
    }

    // Start conservatively and let adaptQuality() climb if the machine has
    // headroom. Opening straight at full device pixel ratio means a 4x pixel
    // count on a Retina display, over streaming photoreal tiles, before we know
    // anything about whether this hardware can hold 60 Hz.
    measureRefreshPeriod();
    if (isAutoQuality()) {
      viewer.resolutionScale = QUALITY_START;
    } else {
      // The user picked a level in DISPLAY. Honour it exactly and do not adapt
      // away from it — a setting that quietly moves is worse than no setting.
      const pinned = resolutionForLevel(getRenderQuality());
      if (pinned !== null) viewer.resolutionScale = pinned;
    }
    frameLoadPeriods = 1;
    frameMsAvg = refreshPeriodMs;
    qualityCooldownS = 2;

    if (scene.postProcessStages?.fxaa) scene.postProcessStages.fxaa.enabled = true;

    if (tileset) {
      tileset.dynamicScreenSpaceError = false;
      // At 175 m/s the sharpest tiles must arrive first or the aircraft has
      // already passed the ground they describe.
      tileset.preferLeaves = true;
      if (isAutoQuality()) tileset.maximumScreenSpaceError = TILE_DETAIL_BEST;
    }
    if (fog) {
      // Keep some haze — it reads as air, and removing it entirely looks
      // synthetic — but stop it greying out the whole view, and stop it
      // degrading the tiles behind it.
      fog.density = FOG_DENSITY_SIM;
      fog.screenSpaceErrorFactor = 1;
    }
    governorRequestRender('flight-sim-quality');
  }

  /**
   * Label for the quality readout: the chosen level, or what AUTO settled on.
   *
   * @returns {string}
   */
  function qualityLabel() {
    const chosen = getRenderQuality();
    if (chosen !== 'auto') return chosen;
    const res = viewer?.resolutionScale ?? 1;
    return `auto ${res.toFixed(2).replace(/0$/, '')}x`;
  }

  /**
   * Cycle the render quality level from inside the sim.
   *
   * @returns {string} The level now active.
   */
  function cycleQuality() {
    const order = ['auto', 'low', 'medium', 'high', 'ultra'];
    const next = order[(order.indexOf(getRenderQuality()) + 1) % order.length];
    setRenderQuality(next);
    const tileset = priorQuality?.tileset || findPhotorealTileset();
    applySceneQuality({ viewer, tileset, id: next, defaults: qualityBaseline });
    if (next === 'auto') {
      // Re-enter the adaptive path from a known state rather than from
      // whatever the last pinned level happened to leave behind.
      viewer.resolutionScale = QUALITY_START;
      if (tileset) tileset.maximumScreenSpaceError = TILE_DETAIL_BEST;
      frameLoadPeriods = 1;
      qualityCooldownS = 2;
    }
    governorRequestRender('flight-sim-quality-cycle');
    return next;
  }

  /**
   * Find the photorealistic tileset in the scene.
   *
   * Looked up rather than injected so the controller's signature — and every
   * call site and test that depends on it — stays unchanged.
   *
   * @returns {object|null}
   */
  function findPhotorealTileset() {
    const prims = viewer?.scene?.primitives;
    if (!prims) return null;
    for (let i = 0; i < prims.length; i += 1) {
      const p = prims.get(i);
      if (p && typeof p.maximumScreenSpaceError === 'number' && 'dynamicScreenSpaceError' in p) {
        return p;
      }
    }
    return null;
  }

  /**
   * Track frame time and trade detail for smoothness.
   *
   * A fixed quality level is a bet on hardware we cannot see. This measures
   * what the machine actually delivers and moves one step at a time: down
   * quickly when frames run long, up slowly when there is headroom. Stutter is
   * far more noticeable than a slightly softer image, so the fall is fast and
   * the climb is deliberate, with a cooldown so the two cannot oscillate.
   *
   * Resolution is given up BEFORE tile detail, because a soft image still shows
   * you the world, whereas coarse tiles remove it.
   *
   * @param {number} deltaS - Seconds since the previous frame.
   * @returns {void}
   */
  /**
   * Measure the display's actual refresh period.
   *
   * Never hardcoded. The old governor compared smoothed frame times against
   * constants chosen for a 60 Hz panel, which is why it misbehaved on
   * everything else. Sampling rAF for a few frames costs nothing and makes the
   * thresholds correct on 60, 90, 120 and 144 Hz alike.
   *
   * @returns {void}
   */
  function measureRefreshPeriod() {
    let frames = 0;
    const started = performance.now();
    const tick = () => {
      frames += 1;
      if (frames < 40) { requestAnimationFrame(tick); return; }
      const period = (performance.now() - started) / frames;
      // Ignore an implausible reading (a hidden tab throttles rAF to ~1 Hz)
      // rather than poisoning every later comparison with it.
      if (period > 3 && period < 40) refreshPeriodMs = period;
    };
    requestAnimationFrame(tick);
  }

  function adaptQuality(deltaS) {
    if (!priorQuality || !viewer?.scene) return;
    // Sample the readout BEFORE the gates below. adaptQuality returns early for
    // a pinned quality level and for a hidden tab, and the frame-time readout
    // has to keep working in both cases — it describes the frame, not the
    // governor's willingness to act on it.
    {
      const rawMs = deltaS * 1000;
      if (rawMs > 0 && rawMs < 500) frameMsAvg += (rawMs - frameMsAvg) * 0.1;
    }
    // An explicit quality level is the user's decision, not a starting point.
    if (!isAutoQuality()) return;
    // A hidden tab has rAF throttled to a fraction of a hertz. Reacting to that
    // would collapse quality to minimum for reasons that say nothing about the
    // hardware, and the user would return to a deliberately ruined image.
    if (document.hidden) return;

    const tileset = priorQuality.tileset;
    // A load spike while tiles stream is not a verdict on the hardware. Acting
    // on it permanently drops quality for a reason that lasts seconds.
    if (tileset && tileset.tilesLoaded === false) return;

    const ms = deltaS * 1000;
    // A tab switch or a loading hitch is excluded rather than acted on.
    if (!(ms > 0 && ms < 500)) return;

    // MEASURE IN VSYNC PERIODS, NOT MILLISECONDS.
    //
    // The old test was `frameAvgMs < 13` to step up. Under vsync the frame
    // interval is quantised to a whole number of refresh periods, so on a 60 Hz
    // panel the average could never fall below 16.67 and that branch was
    // mathematically unreachable. Only the step-DOWN branch could ever run:
    // quality ratcheted away over a session and never came back.
    //
    // In periods, 1.0 means "hit every vsync" and is exactly achievable, so
    // recovery is reachable by construction.
    const periods = Math.max(1, Math.round(ms / refreshPeriodMs));
    frameLoadPeriods += (periods - frameLoadPeriods) * 0.05;

    qualityCooldownS -= deltaS;
    if (qualityCooldownS > 0) return;

    const current = viewer.resolutionScale;
    const target = 1;

    if (frameLoadPeriods > target * 1.12) {
      // Missing frames: give back pixels first, then tile detail.
      if (current > QUALITY_FLOOR) {
        viewer.resolutionScale = Math.max(QUALITY_FLOOR, +(current - QUALITY_STEP).toFixed(2));
      } else if (tileset && tileset.maximumScreenSpaceError < TILE_DETAIL_WORST) {
        tileset.maximumScreenSpaceError = Math.min(
          TILE_DETAIL_WORST, tileset.maximumScreenSpaceError + 4
        );
      }
      // A step down straight after a speculative step up means the probe
      // failed; wait considerably longer before trying again so the two do
      // not oscillate against each other.
      qualityCooldownS = probedUp ? 12 : 3;
      probedUp = false;
    } else if (frameLoadPeriods <= target * 1.02) {
      // Hitting every frame. That proves we are not missing any, NOT that
      // there is headroom — so stepping up is a speculative probe, and the
      // branch above is what catches it when it was too optimistic.
      if (tileset && tileset.maximumScreenSpaceError > TILE_DETAIL_BEST) {
        tileset.maximumScreenSpaceError = Math.max(
          TILE_DETAIL_BEST, tileset.maximumScreenSpaceError - 4
        );
        probedUp = true;
      } else if (current < QUALITY_CEILING) {
        viewer.resolutionScale = Math.min(QUALITY_CEILING, +(current + QUALITY_STEP).toFixed(2));
        probedUp = true;
      }
      qualityCooldownS = 4;
    }
  }

  /**
   * Put the scene back exactly as it was found.
   *
   * @returns {void}
   */
  function restoreRenderQuality() {
    const scene = viewer?.scene;
    if (!scene || !priorQuality) return;
    viewer.resolutionScale = priorQuality.resolutionScale;
    // enableInputs is restored to TRUE rather than to whatever was captured on
    // entry, because it is a shared transient flag, not a stable setting:
    // Cockpit (ui.js), the CCTV calibration gizmo and camera flights all switch
    // it off for the duration of something and back on when finished.
    //
    // Capturing it meant that entering Flight Sim while any of those had it off
    // recorded `false`, and exiting re-applied that `false` long after the
    // owner had finished and re-enabled it — leaving the map permanently
    // unpannable. Observed exactly that. Every owner of this flag re-enables it
    // when done, so this one does too.
    if (scene.screenSpaceCameraController) {
      scene.screenSpaceCameraController.enableInputs = true;
    }
    if ('msaaSamples' in scene) scene.msaaSamples = priorQuality.msaaSamples;
    if (scene.postProcessStages?.fxaa && priorQuality.fxaa !== undefined) {
      scene.postProcessStages.fxaa.enabled = priorQuality.fxaa;
    }
    const tileset = priorQuality.tileset;
    if (tileset) {
      if (priorQuality.tilesetMse !== undefined) tileset.maximumScreenSpaceError = priorQuality.tilesetMse;
      if (priorQuality.dynamicSse !== undefined) tileset.dynamicScreenSpaceError = priorQuality.dynamicSse;
      if (priorQuality.preferLeaves !== undefined) tileset.preferLeaves = priorQuality.preferLeaves;
    }
    if (scene.fog) {
      if (priorQuality.fogDensity !== undefined) scene.fog.density = priorQuality.fogDensity;
      if (priorQuality.fogSseFactor !== undefined) scene.fog.screenSpaceErrorFactor = priorQuality.fogSseFactor;
    }
    priorQuality = null;
    governorRequestRender('flight-sim-quality-restore');
  }

  function exit() {
    if (state === FlightSimState.OFF) return false;

    if (removeTick) {
      removeTick();
      removeTick = null;
    }
    // Release the hold before anything that might throw, so a failure later in
    // teardown cannot strand the scene in continuous render.
    if (heldRender) {
      releaseContinuousRender(RENDER_OWNER);
      heldRender = false;
    }

    input?.detach();
    hud?.setVisible(false);
    routeRenderer?.clearRoute();
    renderer?.destroy();
    restoreRenderQuality();
    document.body.classList.remove(BODY_CLASS);

    disengageAutopilot(autopilot);
    accumulator.reset();
    ground.reset();
    flight = null;
    route = null;

    hooks.releaseCamera?.();
    if (snapshot) {
      hooks.restoreState?.(snapshot);
      snapshot = null;
    }

    state = FlightSimState.OFF;
    hooks.onStateChange?.(state);
    window.dispatchEvent(new CustomEvent('gev:flight-sim-mode-changed', {
      detail: { state, active: false },
    }));
    governorRequestRender('flight-sim-exit');
    return true;
  }

  /**
   * Put the aircraft back at the departure point without reloading anything.
   *
   * @returns {boolean}
   */
  function restart() {
    if (state !== FlightSimState.ACTIVE && state !== FlightSimState.PAUSED && state !== FlightSimState.LOST) {
      return false;
    }
    if (!route) return false;
    route.activeIndex = Math.min(1, route.waypoints.length - 1);
    route.completed = false;
    disengageAutopilot(autopilot);
    spawn();
    if (state === FlightSimState.LOST) transition(FlightSimState.ACTIVE);
    hud.setWarnings([]);
    return true;
  }

  /**
   * Recover in place after a crash.
   *
   * Distinct from restart(): restart puts you back at the departure airport and
   * flies the route from the beginning, whereas revive picks the aircraft up
   * WHERE IT FELL — a safe height above the terrain, on its last heading, at
   * cruise speed. Route progress is left untouched, so a crash 200 NM along
   * does not cost those 200 NM.
   *
   * @returns {boolean} Whether the aircraft was revived.
   */
  function revive() {
    if (state !== FlightSimState.LOST || !flight) return false;

    const groundHeight = ground.heightAt(
      viewer, flight.latitudeRad, flight.longitudeRad, 10_000, groundExclusions()
    );
    flight = createFlightState({
      aircraft,
      latitudeRad: flight.latitudeRad,
      longitudeRad: flight.longitudeRad,
      altitudeM: airStartAltitude(groundHeight),
      headingRad: flight.headingRad,
      speedMps: aircraft.cruiseTasMps * 0.70,
      onGround: false,
      gearDown: false,
    });

    disengageAutopilot(autopilot);
    accumulator.reset();
    transition(FlightSimState.ACTIVE);
    hud.setWarnings([]);
    governorRequestRender('flight-sim-revive');
    return true;
  }

  return {
    openPlanner,
    setPlan,
    start,
    exit,
    restart,
    revive,
    cycleQuality,

    /**
     * @returns {string}
     */
    getState() {
      return state;
    },

    /**
     * @returns {boolean}
     */
    isActive() {
      return state === FlightSimState.ACTIVE || state === FlightSimState.PAUSED;
    },

    /**
     * @returns {object|null}
     */
    getFlight() {
      return flight;
    },

    /**
     * Provenance for anything that reads the scene, so the simulated aircraft
     * can never be mistaken for a live contact.
     *
     * @returns {object|null}
     */
    getSimContact() {
      if (!flight) return null;
      return {
        callsign: SIM_CALLSIGN,
        type: aircraft.name,
        provenance: 'simulated',
        latitudeDeg: flight.latitudeRad * (180 / Math.PI),
        longitudeDeg: flight.longitudeRad * (180 / Math.PI),
        altitudeM: flight.altitudeM,
      };
    },

    /**
     * @returns {void}
     */
    toggleAutopilot() {
      if (!flight) return;
      if (autopilot.engaged) disengageAutopilot(autopilot);
      else engageAutopilot(autopilot, flight, aircraft);
    },

    /**
     * Retarget to a clicked point without discarding the plan.
     *
     * @param {number} latitudeDeg
     * @param {number} longitudeDeg
     * @returns {void}
     */
    directTo(latitudeDeg, longitudeDeg) {
      if (!route) return;
      directTo(route, createWaypoint({ latitudeDeg, longitudeDeg, type: 'direct' }));
      routeRenderer?.showRoute(route);
    },

    /**
     * @returns {void}
     */
    cycleCamera() {
      camera?.cycle();
      input?.resetView?.();
    },
  };
}

/**
 * Coordinates from a Cesium screen pick, for map-based waypoint selection.
 *
 * @param {object} viewer
 * @param {object} windowPosition - Cesium.Cartesian2.
 * @returns {{latitudeDeg: number, longitudeDeg: number}|null}
 */
export function pickGlobeCoordinates(viewer, windowPosition) {
  if (!viewer?.scene) return null;
  // pickPosition reads the depth buffer, so it lands on the photoreal tile skin
  // rather than the ellipsoid — clicking a mountain gives the mountain.
  const cartesian = viewer.scene.pickPosition(windowPosition)
    || viewer.camera.pickEllipsoid(windowPosition, Cesium.Ellipsoid.WGS84);
  if (!cartesian) return null;
  const carto = Cesium.Cartographic.fromCartesian(cartesian);
  if (!carto) return null;
  return {
    latitudeDeg: Cesium.Math.toDegrees(carto.latitude),
    longitudeDeg: Cesium.Math.toDegrees(carto.longitude),
  };
}

/** Re-exported so callers do not need a second import for degrees. */
export { toRadians };
