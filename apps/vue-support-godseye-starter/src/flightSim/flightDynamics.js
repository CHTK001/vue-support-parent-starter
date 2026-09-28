/**
 * Flight Sim flight dynamics.
 *
 * A point-mass, bank-to-turn aerodynamic model: enough physics that the
 * aircraft feels like it has mass and inertia, without modelling a real 747's
 * systems. It is deliberately free of Cesium and of any aircraft-specific
 * constant — every number comes from the aircraft definition passed in, so the
 * same engine flies anything in `aircraftCatalog.js`.
 *
 * UNITS are SI throughout: metres, seconds, kilograms, Newtons, radians.
 * Conversion to knots / feet / FPM happens only in the HUD.
 *
 * FRAME: velocity is carried in the local ENU frame (east, north, up) at the
 * aircraft's current position. The caller advances geodetic position from that
 * and re-establishes the local frame each step, so the model stays correct as
 * the aircraft travels around the curved Earth rather than drifting relative to
 * a frame fixed at the departure point.
 *
 * The model is a standard energy/turn formulation:
 *   lift and drag come from dynamic pressure and tunable coefficients;
 *   flight-path angle changes with the vertical component of lift;
 *   heading changes with the horizontal component of lift, i.e. bank angle.
 * That is what makes a banked turn behave like a turn instead of a slide.
 */

/** Standard gravity, m/s². */
export const GRAVITY_MPS2 = 9.80665;
/** Sea-level ISA air density, kg/m³. */
export const SEA_LEVEL_DENSITY = 1.225;
/** Fixed simulation step, seconds (60 Hz). */
export const FIXED_STEP_S = 1 / 60;
/**
 * Longest real-time gap fed into the accumulator, seconds.
 *
 * A backgrounded tab or a stalled main thread can hand us multi-second deltas.
 * Without this clamp the accumulator would try to catch up over hundreds of
 * steps in one frame, which locks the page and can integrate the aircraft into
 * the ground. Time is deliberately dropped instead.
 */
export const MAX_FRAME_DELTA_S = 0.25;
/** Hard ceiling on steps per frame, as a second line of defence. */
export const MAX_STEPS_PER_FRAME = 15;

/**
 * ISA air density at an altitude.
 *
 * Troposphere lapse below 11 km, then a fixed stratospheric value — accurate
 * enough for thrust and lift falloff at airliner altitudes.
 *
 * @param {number} altitudeM - Altitude above mean sea level, metres.
 * @returns {number} Density, kg/m³.
 */
export function airDensity(altitudeM) {
  const h = Number.isFinite(altitudeM) ? Math.max(-500, altitudeM) : 0;
  if (h < 11_000) return SEA_LEVEL_DENSITY * (1 - 2.25577e-5 * h) ** 4.256;
  // Above the tropopause density decays roughly exponentially.
  return 0.3639 * Math.exp(-(h - 11_000) / 6_341.6);
}

/**
 * Indicated airspeed from true airspeed.
 *
 * IAS is what a pitot tube reads, so it — not TAS — is what stall and overspeed
 * limits are defined against. At altitude the two diverge sharply.
 *
 * @param {number} trueAirspeedMps
 * @param {number} altitudeM
 * @returns {number} Indicated airspeed, m/s.
 */
export function indicatedAirspeed(trueAirspeedMps, altitudeM) {
  return trueAirspeedMps * Math.sqrt(airDensity(altitudeM) / SEA_LEVEL_DENSITY);
}

/**
 * Wrap an angle into [0, 2π).
 *
 * @param {number} rad
 * @returns {number}
 */
export function wrapAngle(rad) {
  const twoPi = Math.PI * 2;
  const r = rad % twoPi;
  return r < 0 ? r + twoPi : r;
}

/**
 * Shortest signed difference between two headings.
 *
 * Returns a value in (−π, π], so a turn from 350° to 010° is +20° rather than
 * −340°. Every heading controller here depends on this.
 *
 * @param {number} targetRad
 * @param {number} currentRad
 * @returns {number} Signed difference, radians.
 */
export function headingDelta(targetRad, currentRad) {
  let d = wrapAngle(targetRad) - wrapAngle(currentRad);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Clamp a value.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return value < min ? min : (value > max ? max : value);
}

/**
 * Move a value toward a target at a limited rate.
 *
 * Used for every mechanical animation (gear, flaps, spoilers) and for engine
 * spool, so nothing in the simulation ever teleports between states.
 *
 * @param {number} current
 * @param {number} target
 * @param {number} maxDelta - Maximum change this call.
 * @returns {number}
 */
export function approach(current, target, maxDelta) {
  const diff = target - current;
  if (Math.abs(diff) <= maxDelta) return target;
  return current + Math.sign(diff) * maxDelta;
}

/**
 * Lift coefficient at an angle of attack, including stall.
 *
 * Linear up to the stall angle, then decaying toward a reduced post-stall
 * value. Without the decay the aircraft would happily fly at any attitude and
 * stalling would have no consequence.
 *
 * @param {number} alphaRad - Angle of attack.
 * @param {object} aircraft - Catalog entry.
 * @param {number} flapFraction - 0..1 flap deployment.
 * @returns {number} Lift coefficient.
 */
export function liftCoefficient(alphaRad, aircraft, flapFraction = 0) {
  const stall = aircraft.stallAlphaRad;
  const flapBonus = (aircraft.flapLiftBonus || 0) * clamp(flapFraction, 0, 1);
  const linear = aircraft.cl0 + aircraft.liftSlopePerRad * alphaRad + flapBonus;

  const magnitude = Math.abs(alphaRad);
  if (magnitude <= stall) return linear;

  // Past the stall, blend from the peak down to the reduced stalled value over
  // roughly another stall-angle of travel.
  const peak = aircraft.cl0 + aircraft.liftSlopePerRad * stall + flapBonus;
  const excess = clamp((magnitude - stall) / stall, 0, 1);
  const stalled = (aircraft.clStalled ?? peak * 0.6) + flapBonus * 0.5;
  const value = peak + (stalled - peak) * excess;
  return alphaRad < 0 ? -value : value;
}

/**
 * Drag coefficient for the current configuration.
 *
 * @param {number} cl - Current lift coefficient.
 * @param {object} aircraft - Catalog entry.
 * @param {object} config - { flapFraction, gearFraction, spoilerFraction } each 0..1.
 * @returns {number} Drag coefficient.
 */
export function dragCoefficient(cl, aircraft, config = {}) {
  const flap = clamp(config.flapFraction ?? 0, 0, 1);
  const gear = clamp(config.gearFraction ?? 0, 0, 1);
  const spoiler = clamp(config.spoilerFraction ?? 0, 0, 1);
  return aircraft.cd0
    + aircraft.inducedDragK * cl * cl
    + (aircraft.flapDragPenalty || 0) * flap
    + (aircraft.gearDragPenalty || 0) * gear
    + (aircraft.spoilerDragPenalty || 0) * spoiler;
}

/**
 * Build the initial simulation state.
 *
 * @param {object} options
 * @param {object} options.aircraft - Catalog entry.
 * @param {number} options.latitudeRad
 * @param {number} options.longitudeRad
 * @param {number} options.altitudeM - Above mean sea level.
 * @param {number} options.headingRad
 * @param {number} [options.speedMps] - True airspeed; defaults to cruise.
 * @param {boolean} [options.onGround]
 * @param {boolean} [options.gearDown]
 * @returns {object} Mutable simulation state.
 */
export function createFlightState(options) {
  const { aircraft } = options;
  const onGround = options.onGround === true;
  const speed = Number.isFinite(options.speedMps) ? options.speedMps : aircraft.cruiseTasMps;

  return {
    // Position — geodetic, radians and metres.
    latitudeRad: options.latitudeRad,
    longitudeRad: options.longitudeRad,
    altitudeM: options.altitudeM,

    // Attitude — radians.
    headingRad: wrapAngle(options.headingRad),
    pitchRad: 0,
    rollRad: 0,

    // Velocity.
    /** True airspeed along the flight path, m/s. */
    speedMps: onGround ? (options.speedMps ?? 0) : speed,
    /** Flight-path angle: climb positive, radians. */
    flightPathRad: 0,
    /** Vertical speed, m/s, derived each step. */
    verticalSpeedMps: 0,

    // Angular state — current achieved rates, which lag the command.
    rollRateRadS: 0,
    pitchRateRadS: 0,
    yawRateRadS: 0,

    // Controls, all normalised.
    /** −1..1 */
    pitchInput: 0,
    /** −1..1 */
    rollInput: 0,
    /** −1..1 */
    yawInput: 0,
    /** 0..1 commanded */
    throttle: onGround ? 0 : 0.72,
    /** 0..1 actual, lags the command by the spool time. */
    engineOutput: onGround ? 0 : 0.72,
    brakesOn: onGround,

    // Configuration — fraction is the animated position, target is commanded.
    gearDown: options.gearDown ?? onGround,
    gearFraction: (options.gearDown ?? onGround) ? 1 : 0,
    flapIndex: 0,
    flapFraction: 0,
    spoilerCommanded: false,
    spoilerFraction: 0,

    // Situation.
    onGround,
    /** Metres above ground level; the caller refreshes this from terrain. */
    altitudeAglM: onGround ? 0 : options.altitudeM,
    terrainHeightM: onGround ? options.altitudeM : 0,

    // Derived, refreshed every step for the HUD.
    angleOfAttackRad: 0,
    indicatedAirspeedMps: 0,
    machNumber: 0,
    loadFactor: 1,
    stalled: false,
    overspeed: false,
    crashed: false,
    /** Seconds of simulated time elapsed. */
    elapsedS: 0,
  };
}

/**
 * Advance the configuration animations (gear, flaps, spoilers, engine spool).
 *
 * Separated from the aerodynamics because these are mechanical rate limits
 * rather than physics, and because they must keep running while paused-on-
 * ground states settle.
 *
 * @param {object} state
 * @param {object} aircraft
 * @param {number} dt - Step, seconds.
 * @returns {void}
 */
export function stepConfiguration(state, aircraft, dt) {
  state.gearFraction = approach(state.gearFraction, state.gearDown ? 1 : 0, dt / aircraft.gearTransitS);

  const detents = aircraft.flapDetents;
  const maxDetent = detents[detents.length - 1] || 1;
  const targetFlap = (detents[state.flapIndex] ?? 0) / maxDetent;
  state.flapFraction = approach(state.flapFraction, targetFlap, dt / aircraft.flapTransitS);

  state.spoilerFraction = approach(
    state.spoilerFraction,
    state.spoilerCommanded ? 1 : 0,
    dt / aircraft.spoilerTransitS
  );

  // Engines spool rather than snapping — the delay is a large part of why a
  // heavy aircraft feels heavy on approach.
  state.engineOutput = approach(state.engineOutput, state.throttle, dt / aircraft.spoolTimeS);
}

/**
 * Advance attitude from control inputs.
 *
 * Inputs command a rate; the achieved rate approaches the command over the
 * configured inertia time. That first-order lag is what stops the aircraft
 * responding like a fighter.
 *
 * @param {object} state
 * @param {object} aircraft
 * @param {number} dt
 * @returns {void}
 */
function stepAttitude(state, aircraft, dt) {
  const commandedRoll = state.rollInput * aircraft.maxRollRateRadS;
  const commandedPitch = state.pitchInput * aircraft.maxPitchRateRadS;
  const commandedYaw = state.yawInput * aircraft.maxYawRateRadS;

  // Control effectiveness scales with dynamic pressure: controls go soft when
  // slow, which is a large part of why a stall feels like a stall.
  const authority = clamp(state.speedMps / Math.max(1, aircraft.vStallCleanMps), 0.15, 1.4);

  state.rollRateRadS = approach(state.rollRateRadS, commandedRoll * authority, dt / aircraft.rollInertiaS * aircraft.maxRollRateRadS * 4);
  state.pitchRateRadS = approach(state.pitchRateRadS, commandedPitch * authority, dt / aircraft.pitchInertiaS * aircraft.maxPitchRateRadS * 4);
  state.yawRateRadS = approach(state.yawRateRadS, commandedYaw * authority, dt / aircraft.yawInertiaS * aircraft.maxYawRateRadS * 4);

  state.rollRad = clamp(state.rollRad + state.rollRateRadS * dt, -Math.PI * 0.66, Math.PI * 0.66);
  state.pitchRad = clamp(state.pitchRad + state.pitchRateRadS * dt, -Math.PI * 0.45, Math.PI * 0.45);

  // With no roll input the aircraft rolls gently back toward level, as a large
  // transport with dihedral does.
  if (Math.abs(state.rollInput) < 0.02) {
    state.rollRad = approach(state.rollRad, 0, dt * 0.12);
  }
}

/**
 * One fixed physics step.
 *
 * Exported so tests can step deterministically without the accumulator.
 *
 * @param {object} state - Mutated in place.
 * @param {object} aircraft - Catalog entry.
 * @param {number} dt - Step, seconds.
 * @returns {object} The same state.
 */
export function stepFlight(state, aircraft, dt) {
  if (state.crashed) return state;

  stepConfiguration(state, aircraft, dt);
  stepAttitude(state, aircraft, dt);

  const density = airDensity(state.altitudeM);
  const densityRatio = density / SEA_LEVEL_DENSITY;

  if (state.onGround) {
    stepGroundRoll(state, aircraft, dt, densityRatio);
  } else {
    stepAirborne(state, aircraft, dt, density, densityRatio);
  }

  // Derived values for the HUD and the warning system.
  state.indicatedAirspeedMps = indicatedAirspeed(state.speedMps, state.altitudeM);
  // Speed of sound falls with temperature; this is the ISA troposphere profile.
  const speedOfSound = 340.29 * Math.sqrt(Math.max(0.2, 1 - 2.25577e-5 * Math.max(0, state.altitudeM)) ** 1.0);
  state.machNumber = state.speedMps / speedOfSound;
  state.overspeed = state.indicatedAirspeedMps > aircraft.vneMps;
  state.elapsedS += dt;

  return state;
}

/**
 * Airborne integration: forces, flight path, and turn.
 *
 * @param {object} state
 * @param {object} aircraft
 * @param {number} dt
 * @param {number} density
 * @param {number} densityRatio
 * @returns {void}
 */
function stepAirborne(state, aircraft, dt, density, densityRatio) {
  const v = Math.max(1, state.speedMps);

  // Angle of attack is the difference between where the nose points and where
  // the aircraft is actually going.
  const alpha = state.pitchRad - state.flightPathRad;
  state.angleOfAttackRad = alpha;

  const cl = liftCoefficient(alpha, aircraft, state.flapFraction);
  const spoilerLift = 1 - (1 - (aircraft.spoilerLiftFactor ?? 1)) * state.spoilerFraction;
  const cd = dragCoefficient(cl, aircraft, {
    flapFraction: state.flapFraction,
    gearFraction: state.gearFraction,
    spoilerFraction: state.spoilerFraction,
  });

  const q = 0.5 * density * v * v;
  const lift = q * aircraft.wingAreaM2 * cl * spoilerLift;
  const drag = q * aircraft.wingAreaM2 * cd;

  // Thrust falls off with density, which is why the climb rate decays with altitude.
  const thrust = state.engineOutput * aircraft.maxThrustPerEngineN * aircraft.engineCount * densityRatio;

  const mass = aircraft.massKg;
  const weight = mass * GRAVITY_MPS2;

  // Along the flight path: thrust minus drag minus the component of weight.
  const alongAccel = (thrust - drag) / mass - GRAVITY_MPS2 * Math.sin(state.flightPathRad);
  state.speedMps = Math.max(0, state.speedMps + alongAccel * dt);

  // Perpendicular to the flight path: the vertical component of lift fights
  // weight, and the difference bends the flight path.
  const liftVertical = lift * Math.cos(state.rollRad);
  const pathAccel = (liftVertical - weight * Math.cos(state.flightPathRad)) / (mass * v);
  state.flightPathRad = clamp(state.flightPathRad + pathAccel * dt, -Math.PI * 0.45, Math.PI * 0.45);

  // The horizontal component of lift turns the aircraft. This is what makes a
  // bank produce a coordinated turn rather than a sideways slide.
  const turnRate = (lift * Math.sin(state.rollRad)) / (mass * v * Math.max(0.2, Math.cos(state.flightPathRad)));
  // Rudder contributes a little direct yaw on top of the banked turn.
  state.headingRad = wrapAngle(state.headingRad + (turnRate + state.yawRateRadS) * dt);

  state.loadFactor = liftVertical / Math.max(1, weight);
  state.stalled = Math.abs(alpha) > aircraft.stallAlphaRad;

  // A stalled wing drops the nose — the aircraft trades altitude for the speed
  // it needs to fly again, which is the recovery the player has to allow.
  if (state.stalled) {
    state.pitchRad = approach(state.pitchRad, -0.18, dt * 0.5);
  }

  state.verticalSpeedMps = state.speedMps * Math.sin(state.flightPathRad);
  state.altitudeM += state.verticalSpeedMps * dt;
}

/**
 * Ground roll: rolling friction, brakes, nose-wheel steering.
 *
 * @param {object} state
 * @param {object} aircraft
 * @param {number} dt
 * @param {number} densityRatio
 * @returns {void}
 */
function stepGroundRoll(state, aircraft, dt, densityRatio) {
  const thrust = state.engineOutput * aircraft.maxThrustPerEngineN * aircraft.engineCount * densityRatio;
  const thrustAccel = thrust / aircraft.massKg;

  let decel = aircraft.rollingFrictionMps2;
  if (state.brakesOn) decel += aircraft.brakeDecelMps2;
  // Ground spoilers spoil lift and add drag, which is what makes them worth
  // deploying on rollout.
  if (state.spoilerFraction > 0.1) decel += aircraft.brakeDecelMps2 * 0.35 * state.spoilerFraction;

  state.speedMps = Math.max(0, state.speedMps + (thrustAccel - decel) * dt);

  // Steering authority fades as speed rises: taxi steering, not a handbrake turn.
  const steerAuthority = clamp(1 - state.speedMps / 80, 0.08, 1);
  state.headingRad = wrapAngle(
    state.headingRad + state.yawInput * aircraft.groundSteerRateRadS * steerAuthority * dt
  );

  // Wings level and nose on the ground while rolling.
  state.rollRad = approach(state.rollRad, 0, dt * 0.8);
  state.flightPathRad = 0;
  state.verticalSpeedMps = 0;
  state.angleOfAttackRad = state.pitchRad;
  state.loadFactor = 1;
  state.stalled = false;

  // Rotation: once past a sensible fraction of stall speed, back pressure lifts off.
  const rotateSpeed = aircraft.vStallCleanMps * 1.15;
  if (state.speedMps > rotateSpeed && state.pitchInput > 0.15) {
    state.onGround = false;
    state.flightPathRad = 0.02;
    state.pitchRad = Math.max(state.pitchRad, 0.06);
  } else {
    state.pitchRad = approach(state.pitchRad, 0, dt * 0.4);
  }
}

/**
 * Create a fixed-timestep accumulator.
 *
 * Physics runs at exactly {@link FIXED_STEP_S} regardless of frame rate, so the
 * aircraft behaves identically at 30, 60 and 120 FPS. Frame deltas are clamped
 * before entering the accumulator and the step count is capped, so a stalled
 * tab cannot produce a catch-up loop that freezes the page.
 *
 * @returns {{ advance: (deltaS: number, step: (dt: number) => void) => number, reset: () => void, pending: () => number }}
 */
export function createFixedStepAccumulator() {
  let accumulator = 0;
  return {
    /**
     * Feed real elapsed time and run whole physics steps.
     *
     * @param {number} deltaS - Real seconds since the last call.
     * @param {(dt: number) => void} step - Runs one fixed step.
     * @returns {number} Steps actually run.
     */
    advance(deltaS, step) {
      const clamped = clamp(Number.isFinite(deltaS) ? deltaS : 0, 0, MAX_FRAME_DELTA_S);
      accumulator += clamped;
      let steps = 0;
      while (accumulator >= FIXED_STEP_S && steps < MAX_STEPS_PER_FRAME) {
        step(FIXED_STEP_S);
        accumulator -= FIXED_STEP_S;
        steps += 1;
      }
      // If the cap was hit, drop the backlog rather than carrying a debt that
      // would make every subsequent frame run the maximum step count.
      if (steps >= MAX_STEPS_PER_FRAME) accumulator = 0;
      return steps;
    },
    reset() {
      accumulator = 0;
    },
    pending() {
      return accumulator;
    },
  };
}
