/**
 * Flight Sim HUD.
 *
 * Edges-only by design: tapes at the sides, heading on top, configuration
 * strip along the bottom, and the middle left clear so the aircraft and the
 * world are never obscured. It reuses the app's existing tactical vocabulary
 * rather than introducing a second visual language.
 *
 * UPDATE CADENCE: physics runs at 60 Hz but the DOM does not. Text is written
 * at ~12 Hz, which is faster than anyone can read and about five times cheaper
 * than touching the DOM every frame. Values that have not changed are not
 * written at all, because assigning identical textContent still costs layout.
 */

import { METRES_PER_FOOT, METRES_PER_NM, toDegrees } from './simRoute.js';

/** Metres/second to knots. */
const MPS_TO_KNOTS = 1.94384;
/** Metres/second to feet per minute. */
const MPS_TO_FPM = 196.85;
/** DOM refresh interval, milliseconds. */
const HUD_INTERVAL_MS = 80;

/**
 * Create the HUD controller.
 *
 * @param {HTMLElement} root - The `#flightsim-hud` element.
 * @returns {object} HUD controller.
 */
export function createSimHud(root) {
  if (!root) return createNullHud();

  // Resolved once — querying per update would be pointless work at 12 Hz.
  const el = {
    ias: root.querySelector('[data-fs="ias"]'),
    mach: root.querySelector('[data-fs="mach"]'),
    alt: root.querySelector('[data-fs="alt"]'),
    vs: root.querySelector('[data-fs="vs"]'),
    hdg: root.querySelector('[data-fs="hdg"]'),
    trk: root.querySelector('[data-fs="trk"]'),
    thr: root.querySelector('[data-fs="thr"]'),
    gear: root.querySelector('[data-fs="gear"]'),
    flaps: root.querySelector('[data-fs="flaps"]'),
    spoilers: root.querySelector('[data-fs="spoilers"]'),
    bank: root.querySelector('[data-fs="bank"]'),
    cam: root.querySelector('[data-fs="cam"]'),
    wpName: root.querySelector('[data-fs="wp-name"]'),
    wpInfo: root.querySelector('[data-fs="wp-info"]'),
    ap: root.querySelector('[data-fs="ap"]'),
    mouse: root.querySelector('[data-fs="mouse"]'),
    quality: root.querySelector('[data-fs="quality"]'),
    fps: root.querySelector('[data-fs="fps"]'),
    warnings: root.querySelector('[data-fs="warnings"]'),
  };

  /** Last written value per key, so unchanged text is never re-assigned. */
  const written = new Map();
  let lastUpdateMs = 0;

  /**
   * Write text only when it has actually changed.
   *
   * @param {string} key
   * @param {HTMLElement|null} node
   * @param {string} value
   * @returns {void}
   */
  function set(key, node, value) {
    if (!node) return;
    if (written.get(key) === value) return;
    written.set(key, value);
    node.textContent = value;
  }

  return {
    /**
     * Refresh the readouts.
     *
     * @param {object} params
     * @param {object} params.state - Flight state.
     * @param {object} params.aircraft - Catalog entry.
     * @param {object|null} params.solution - Navigation solution.
     * @param {object} params.autopilot
     * @param {string} params.cameraMode
     * @param {boolean} params.mouseYoke
     * @param {boolean} [params.force] - Bypass the interval (mode changes).
     * @returns {void}
     */
    update({ state, aircraft, solution, autopilot, cameraMode, mouseYoke, quality, fps, force = false }) {
      const now = Date.now();
      if (!force && now - lastUpdateMs < HUD_INTERVAL_MS) return;
      lastUpdateMs = now;

      set('ias', el.ias, String(Math.round(state.indicatedAirspeedMps * MPS_TO_KNOTS)));
      set('mach', el.mach, `M ${state.machNumber.toFixed(2)}`);
      set('alt', el.alt, Math.round(state.altitudeM / METRES_PER_FOOT).toLocaleString('en-US'));

      const fpm = Math.round(state.verticalSpeedMps * MPS_TO_FPM);
      set('vs', el.vs, `${fpm >= 0 ? '▲ +' : '▼ '}${Math.abs(fpm).toLocaleString('en-US')} FPM`);

      const headingDeg = Math.round(toDegrees(state.headingRad)) % 360;
      set('hdg', el.hdg, `${String(headingDeg).padStart(3, '0')}°`);
      // Track differs from heading whenever the aircraft is drifting; with no
      // wind model they match, but the field is here so it stays honest if one
      // is added rather than silently reporting heading as track.
      set('trk', el.trk, `TRK ${String(headingDeg).padStart(3, '0')}°`);

      set('thr', el.thr, `${Math.round(state.throttle * 100)}%`);
      set('gear', el.gear, gearLabel(state));
      set('flaps', el.flaps, String(aircraft.flapDetents[state.flapIndex] ?? 0));
      set('spoilers', el.spoilers, state.spoilerFraction > 0.05
        ? `${Math.round(state.spoilerFraction * 100)}%` : '—');
      set('bank', el.bank, `${Math.round(Math.abs(toDegrees(state.rollRad)))}°`);
      set('cam', el.cam, cameraMode.toUpperCase());

      if (solution) {
        set('wp-name', el.wpName, solution.waypoint.label.toUpperCase());
        const nm = (solution.distanceM / METRES_PER_NM).toFixed(solution.distanceM < 18_520 ? 1 : 0);
        const relative = relativeBearingLabel(solution.bearingRad, state.headingRad);
        const eta = solution.etaSeconds ? ` · ETA ${formatEta(solution.etaSeconds)}` : '';
        set('wp-info', el.wpInfo, `${nm} NM · ${relative}${eta}`);
      } else {
        set('wp-name', el.wpName, '—');
        set('wp-info', el.wpInfo, 'NO ACTIVE WAYPOINT');
      }

      if (el.ap) {
        const on = autopilot?.engaged === true;
        set('ap', el.ap, on ? 'AP ON' : 'AP OFF');
        el.ap.classList.toggle('is-on', on);
      }
      if (el.mouse) el.mouse.hidden = !mouseYoke;
      if (quality) set('quality', el.quality, quality.toUpperCase());
      // Rounded to whole frames: a readout that flickers between 58 and 61 is
      // noise, and the number only matters as "smooth" or "not".
      if (Number.isFinite(fps)) set('fps', el.fps, String(Math.round(fps)));

      this.setWarnings(collectWarnings(state, aircraft));
    },

    /**
     * Render the warning stack.
     *
     * Rebuilt only when the set of warnings changes — a pulsing warning that
     * re-creates its DOM every frame would restart its own animation.
     *
     * @param {string[]} warnings
     * @returns {void}
     */
    setWarnings(warnings) {
      if (!el.warnings) return;
      const key = warnings.join('|');
      if (written.get('warnings') === key) return;
      written.set('warnings', key);
      el.warnings.replaceChildren(...warnings.map((text) => {
        const node = document.createElement('div');
        node.className = `fs-warn${CRITICAL_WARNINGS.has(text) ? ' is-critical' : ''}`;
        node.textContent = text;
        return node;
      }));
    },

    /**
     * @param {boolean} visible
     * @returns {void}
     */
    setVisible(visible) {
      root.hidden = !visible;
      if (!visible) written.clear();
    },

    /**
     * Show the terminal state after a crash.
     *
     * @param {string} reason
     * @returns {void}
     */
    showLost(reason) {
      this.setWarnings([`AIRCRAFT LOST — ${reason}`]);
    },
  };
}

/** Warnings rendered in the critical (red) style. */
const CRITICAL_WARNINGS = new Set(['STALL', 'TERRAIN', 'OVERSPEED']);

/**
 * Current warnings, most severe first.
 *
 * Deliberately sparse: a HUD that always shows something trains the player to
 * ignore it.
 *
 * @param {object} state
 * @param {object} aircraft
 * @returns {string[]}
 */
export function collectWarnings(state, aircraft) {
  const warnings = [];
  if (state.stalled) warnings.push('STALL');
  if (state.overspeed) warnings.push('OVERSPEED');
  // Terrain matters only when descending toward it, not merely when low —
  // otherwise it fires for the whole of a normal landing roll.
  if (!state.onGround && state.altitudeAglM < 300 && state.verticalSpeedMps < -3) {
    warnings.push('TERRAIN');
  }
  // Gear is a reminder when low and clean, which is exactly when forgetting it
  // matters.
  if (!state.onGround && state.altitudeAglM < 900 && state.gearFraction < 0.9) {
    warnings.push('GEAR');
  }
  void aircraft;
  return warnings;
}

/**
 * Gear state as displayed.
 *
 * @param {object} state
 * @returns {'GEAR DOWN'|'GEAR UP'|'GEAR TRANSIT'}
 */
export function gearLabel(state) {
  if (state.gearFraction > 0.99) return 'DOWN';
  if (state.gearFraction < 0.01) return 'UP';
  return 'TRANSIT';
}

/**
 * Relative bearing as a human instruction.
 *
 * "38° RIGHT" is directly actionable; a raw bearing requires mental arithmetic
 * while flying.
 *
 * @param {number} bearingRad - Absolute bearing to the waypoint.
 * @param {number} headingRad - Current heading.
 * @returns {string}
 */
export function relativeBearingLabel(bearingRad, headingRad) {
  let diff = toDegrees(bearingRad) - toDegrees(headingRad);
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  const magnitude = Math.round(Math.abs(diff));
  if (magnitude <= 2) return 'ON TRACK';
  return `${magnitude}° ${diff > 0 ? 'RIGHT' : 'LEFT'}`;
}

/**
 * Seconds as H:MM or MM:SS.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatEta(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * No-op HUD used when the markup is absent.
 *
 * Lets the controller call HUD methods unconditionally instead of guarding
 * every call site.
 *
 * @returns {object}
 */
function createNullHud() {
  return {
    update() {},
    setWarnings() {},
    setVisible() {},
    showLost() {},
  };
}
