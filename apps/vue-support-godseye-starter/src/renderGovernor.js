/**
 * Idle render governor — the wave-2 flagship of the 2026-08-05 perf
 * investigation and the production idle-render measurements.
 *
 * The problem: Cesium's default render loop repaints every vsync forever, so
 * the app burned ~60% GPU + ~54% of a core with ZERO layers enabled and a
 * parked camera. The fix: flip the scene into Cesium's `requestRenderMode`
 * whenever nothing animates per frame, and return to the continuous loop the
 * moment something does.
 *
 * Architecture — a binary mode driven by ref-counted holds:
 *
 * - **Continuous mode** (`requestRenderMode = false`, today's behavior)
 *   while ANY hold is registered. Every per-frame animator — fleet
 *   interpolation, traffic sim, satellite motion, tracked-entity follow,
 *   style crossfades, CCTV projection — registers a hold for exactly the
 *   lifetime of its scene-loop listener or animation. While one is active,
 *   behavior is byte-identical to pre-governor main: the locked
 *   interpolation/tracking invariants are preserved by construction.
 * - **Idle mode** (`requestRenderMode = true`) when zero holds. Cesium
 *   auto-renders on camera input and tile loads; every other scene mutation
 *   must call `governorRequestRender()` for its one frame. Discrete
 *   mutators (layer poll ticks, slider writes, annotation changes) route
 *   through that.
 *
 * Holds are identity-keyed (a Set of owner ids), NOT a counter — a module
 * that double-holds or double-releases cannot corrupt the mode. Owners are
 * short stable strings ('flights', 'traffic', 'style-anim', …) so the
 * diagnostics read like a story.
 *
 * The governor is O(1) passive: no per-frame work of its own, ever.
 */

let _viewer = null;
let _installed = false;
const _holds = new Set();

/** Debug trail of the most recent one-shot render requests (idle mode only). */
const _recentRequests = [];
const RECENT_REQUEST_CAP = 16;

/**
 * Frames per second to pump while any hold is active.
 *
 * 60 is plenty for the things that take holds — moving vehicles, orbiting
 * cameras, style crossfades — all of which are authored against wall-clock
 * time rather than frame count.
 */
let _targetHz = 60;
/**
 * The mode last applied: 'continuous', 'idle', or null before install.
 *
 * Tracked so the settling frame fires on a real TRANSITION only. applyMode()
 * runs on every hold and release, so issuing it unconditionally asked for a
 * render each time anything touched the governor — one render per tick for a
 * parked scene, which is precisely the idling this exists to prevent.
 */
let _lastApplied = null;
/** rAF id of the running pump, or null. */
let _pumpId = null;
/**
 * Timestamp of the last pumped frame.
 *
 * -Infinity, not 0: with 0 the very first pumped frame is compared against a
 * clock that also starts near zero and is skipped as "too soon", so a hold
 * would not produce its opening frame.
 */
let _lastPump = Number.NEGATIVE_INFINITY;

/**
 * Frame scheduler. Injectable for tests.
 *
 * NO setTimeout FALLBACK. An earlier version fell back to a timer where
 * requestAnimationFrame was missing, which meant that under Node the pump
 * became an endless chain of timers that kept the process alive and hung the
 * test run. Outside a browser there is no display to pace against and nothing
 * to draw, so the correct behaviour is not to pump at all.
 */
let _raf = (fn) => (typeof requestAnimationFrame === 'function'
  ? requestAnimationFrame(fn) : null);
/** @type {Function} Injectable for tests. */
let _cancelRaf = (id) => {
  if (id !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id);
};

function stopPump() {
  if (_pumpId === null) return;
  _cancelRaf(_pumpId);
  _pumpId = null;
}

function startPump() {
  if (_pumpId !== null) return;
  // Each new hold period starts owed a frame immediately.
  _lastPump = Number.NEGATIVE_INFINITY;
  const pump = (t) => {
    _pumpId = _raf(pump);
    const now = typeof t === 'number' ? t : 0;
    if (now - _lastPump < 1000 / _targetHz) return;
    _lastPump = now;
    _viewer?.scene?.requestRender?.();
  };
  _pumpId = _raf(pump);
  // No scheduler (Node, or a headless harness): ask for the one frame the
  // caller is entitled to and stop, rather than pretending to pace.
  if (_pumpId === null) _viewer?.scene?.requestRender?.();
}

/**
 * Apply the current hold state to the scene.
 *
 * PACED, NOT SWITCHED. This used to be a binary flip: any hold set
 * `requestRenderMode = false`, which hands the loop to Cesium to run flat out
 * at the display's refresh rate with no cap. Fifteen different reasons can take
 * a hold — traffic, satellites, flights, military, rocket launches, vessels,
 * annotations, the CCTV projection, camera orbits, tracking, cockpit, style
 * animation — so enabling a single data layer, which is the entire point of the
 * app, dropped it out of render-on-demand for the rest of the session. Every
 * one of those uncapped frames also re-ran every compositor effect layered over
 * the canvas.
 *
 * Now `requestRenderMode` stays true permanently and a hold instead starts a
 * paced pump that asks for a frame at a chosen rate. Rendering continuously and
 * rendering as fast as possible are different things, and only the first was
 * ever wanted.
 */
function applyMode() {
  if (!_installed || !_viewer?.scene) return;
  const scene = _viewer.scene;
  // Never turned off again.
  scene.requestRenderMode = true;

  const want = _holds.size > 0 ? 'continuous' : 'idle';
  if (want === 'continuous') startPump();
  else stopPump();

  if (_lastApplied === want) return;
  _lastApplied = want;
  // Entering idle renders one settling frame, so anything the last pumped
  // frame mutated is on screen before the loop goes quiet.
  if (want === 'idle') scene.requestRender?.();
}

/**
 * Set the pumped frame rate.
 *
 * @param {number} hz
 * @returns {number} The rate actually set.
 */
export function setGovernorTargetHz(hz) {
  const value = Number(hz);
  if (Number.isFinite(value) && value >= 15 && value <= 240) _targetHz = value;
  return _targetHz;
}

/**
 * @returns {number}
 */
export function getGovernorTargetHz() {
  return _targetHz;
}

/**
 * Replace the frame scheduler. Tests only.
 *
 * @param {object} hooks
 * @returns {void}
 */
export function _setGovernorSchedulerForTest({ raf, cancel } = {}) {
  if (typeof raf === 'function') _raf = raf;
  if (typeof cancel === 'function') _cancelRaf = cancel;
}

/**
 * Install the governor on the viewer. Idempotent. Before install,
 * hold/release still record into the holds set (and apply at install time);
 * requests are safe no-ops — so modules can call all three unconditionally
 * in tests without a viewer.
 * @param {Cesium.Viewer} viewer
 * @returns {void}
 */
export function installRenderGovernor(viewer) {
  if (!viewer?.scene) throw new TypeError('installRenderGovernor requires a Cesium viewer');
  _viewer = viewer;
  _installed = true;
  // Never let Cesium re-render on simulation-time deltas behind our back —
  // idle means idle. All re-renders are camera/tiles (Cesium-native) or
  // explicit requests.
  viewer.scene.maximumRenderTimeChange = Infinity;
  applyMode();
}

/**
 * Register a continuous-render hold. Idempotent per owner.
 * Call where the owner's per-frame work BEGINS (scene listener installed,
 * animation starts, tracking begins).
 * @param {string} ownerId Short stable id, e.g. 'flights', 'traffic'.
 * @returns {void}
 */
export function holdContinuousRender(ownerId) {
  if (!ownerId) return;
  _holds.add(ownerId);
  applyMode();
}

/**
 * Release a hold. Safe when never held.
 * Call where the owner's per-frame work ENDS (listener removed, animation
 * settled, tracking stopped, layer disabled).
 * @param {string} ownerId
 * @returns {void}
 */
export function releaseContinuousRender(ownerId) {
  if (!ownerId) return;
  _holds.delete(ownerId);
  applyMode();
}

/**
 * One-shot render request for a discrete scene mutation (layer tick, slider
 * write, annotation change). Always forwards to scene.requestRender() — in
 * continuous mode that is a harmless flag set (and forwarding closes the
 * request-then-last-release race); only idle-mode requests are recorded in
 * diagnostics. Cheap enough to call unconditionally after any mutation.
 * @param {string} [reason] For diagnostics only.
 * @returns {void}
 */
export function governorRequestRender(reason = 'unspecified') {
  if (!_installed || !_viewer?.scene) return;
  if (_holds.size === 0) {
    _recentRequests.push({ reason, at: Date.now() });
    if (_recentRequests.length > RECENT_REQUEST_CAP) _recentRequests.shift();
  }
  _viewer.scene.requestRender?.();
}

/**
 * @returns {{installed: boolean, mode: 'continuous'|'idle', holds: string[],
 *   recentRequests: Array<{reason: string, at: number}>}}
 */
export function getRenderGovernorDiagnostics() {
  return {
    installed: _installed,
    mode: _holds.size > 0 ? 'continuous' : 'idle',
    holds: [..._holds].sort(),
    recentRequests: [..._recentRequests],
  };
}

/** Test seam: reset module state between unit tests. */
export function _resetRenderGovernorForTest() {
  stopPump();
  _viewer = null;
  _installed = false;
  _holds.clear();
  _recentRequests.length = 0;
  _lastPump = Number.NEGATIVE_INFINITY;
  _lastApplied = null;
  _targetHz = 60;
}
