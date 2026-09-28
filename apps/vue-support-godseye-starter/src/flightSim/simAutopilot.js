/**
 * Flight Sim autopilot.
 *
 * Deliberately not an MCP/FMS: three simple proportional loops that steer
 * toward the active waypoint, hold an altitude and hold a speed. It exists so a
 * player can watch the aircraft fly the route they planned, not to reproduce a
 * 747's avionics.
 *
 * Pure logic — it reads the flight state and returns control positions, and
 * never touches Cesium or the DOM. Gains and limits come from the aircraft's
 * `autopilot` block so a different aeroplane tunes differently.
 */

import { clamp, headingDelta, wrapAngle } from './flightDynamics.js';
import { navigationSolution } from './simRoute.js';

/**
 * Create autopilot state.
 *
 * @param {object} [options]
 * @param {number} [options.targetAltitudeM] - Held altitude; defaults to current on engage.
 * @param {number} [options.targetSpeedMps] - Held speed; defaults to the aircraft's cruise.
 * @returns {object} Mutable autopilot state.
 */
export function createAutopilot(options = {}) {
  return {
    engaged: false,
    targetAltitudeM: options.targetAltitudeM ?? null,
    targetSpeedMps: options.targetSpeedMps ?? null,
    /** Last commanded bank, for HUD display. */
    commandedBankRad: 0,
    /** Last commanded vertical speed, m/s. */
    commandedVerticalSpeedMps: 0,
  };
}

/**
 * Engage the autopilot, capturing current altitude as the target.
 *
 * Capturing on engage — rather than snapping to a preset — means switching it
 * on never produces a sudden pitch change.
 *
 * @param {object} autopilot - Mutated.
 * @param {object} state - Current flight state.
 * @param {object} aircraft - Catalog entry.
 * @returns {void}
 */
export function engageAutopilot(autopilot, state, aircraft) {
  autopilot.engaged = true;
  autopilot.targetAltitudeM = state.altitudeM;
  autopilot.targetSpeedMps = aircraft.autopilot.targetSpeedMps;
}

/**
 * Disengage the autopilot.
 *
 * @param {object} autopilot - Mutated.
 * @returns {void}
 */
export function disengageAutopilot(autopilot) {
  autopilot.engaged = false;
  autopilot.commandedBankRad = 0;
  autopilot.commandedVerticalSpeedMps = 0;
}

/**
 * Whether a manual input is large enough to mean the player wants control back.
 *
 * A small deadband stops a resting hand or a sticky key from silently kicking
 * the autopilot off, while any deliberate input takes over immediately.
 *
 * @param {object} inputs - { pitch, roll, yaw } each −1..1.
 * @returns {boolean}
 */
export function manualOverrideRequested(inputs) {
  const threshold = 0.15;
  return Math.abs(inputs.pitch ?? 0) > threshold
    || Math.abs(inputs.roll ?? 0) > threshold
    || Math.abs(inputs.yaw ?? 0) > threshold;
}

/**
 * Compute one autopilot update.
 *
 * Returns control positions rather than mutating the flight state, so the
 * caller decides how to blend them and the function stays testable.
 *
 * @param {object} autopilot - Autopilot state; commanded values are updated.
 * @param {object} state - Flight state.
 * @param {object} aircraft - Catalog entry.
 * @param {object|null} route - Route, or null to hold heading.
 * @returns {{rollInput: number, pitchInput: number, throttle: number, targetHeadingRad: number|null}}
 */
export function updateAutopilot(autopilot, state, aircraft, route) {
  const cfg = aircraft.autopilot;

  // ── Lateral: steer toward the active waypoint ──────────────────────────
  let targetHeadingRad = null;
  let rollInput = 0;

  const solution = route ? navigationSolution(route, state.latitudeRad, state.longitudeRad, state.speedMps) : null;
  if (solution) {
    targetHeadingRad = solution.bearingRad;
    // headingDelta takes the short way round, so crossing north does not
    // command a 340-degree turn.
    const error = headingDelta(targetHeadingRad, state.headingRad);
    const commandedBank = clamp(error * cfg.headingGain, -cfg.maxBankRad, cfg.maxBankRad);
    autopilot.commandedBankRad = commandedBank;
    // Drive roll toward the commanded bank rather than setting it directly, so
    // the aircraft's own roll inertia still governs how it gets there.
    rollInput = clamp((commandedBank - state.rollRad) * 2.2, -1, 1);
  } else {
    autopilot.commandedBankRad = 0;
    rollInput = clamp(-state.rollRad * 2.2, -1, 1);
  }

  // ── Vertical: hold the captured altitude ───────────────────────────────
  const targetAltitude = Number.isFinite(autopilot.targetAltitudeM)
    ? autopilot.targetAltitudeM
    : state.altitudeM;
  const altitudeError = targetAltitude - state.altitudeM;
  const commandedVs = clamp(
    altitudeError * cfg.altitudeGain,
    -cfg.maxVerticalSpeedMps,
    cfg.maxVerticalSpeedMps
  );
  autopilot.commandedVerticalSpeedMps = commandedVs;

  // Convert the vertical-speed demand into a pitch command via the error
  // between demanded and actual climb rate.
  const vsError = commandedVs - state.verticalSpeedMps;
  const pitchInput = clamp(vsError * 0.28, -1, 1);

  // ── Speed: hold the target with throttle ───────────────────────────────
  const targetSpeed = Number.isFinite(autopilot.targetSpeedMps)
    ? autopilot.targetSpeedMps
    : cfg.targetSpeedMps;
  const speedError = targetSpeed - state.speedMps;
  // Bias around a cruise-ish setting so the loop trims rather than hunting
  // between idle and full power.
  const throttle = clamp(0.7 + speedError * 0.02, 0, 1);

  return {
    rollInput,
    pitchInput,
    throttle,
    targetHeadingRad: targetHeadingRad === null ? null : wrapAngle(targetHeadingRad),
  };
}
