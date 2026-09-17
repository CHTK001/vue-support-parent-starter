/**
 * Cheap cursor-affordance hover picking.
 *
 * WHY THIS EXISTS. Two layers ran a GPU readback on every raw mousemove, purely
 * to decide whether the cursor should be a pointer.
 *
 * `Scene.drillPick` is the most expensive call in Cesium's public API: it draws
 * the scene into the pick framebuffer, issues a SYNCHRONOUS gl.readPixels — which
 * stalls the CPU until the GPU drains — then hides whatever it found and draws
 * again, repeating up to its limit. At a limit of 12 that is up to twelve scene
 * renders and twelve pipeline stalls. `scene.pickPosition` is cheaper but still
 * a synchronous depth-buffer readback.
 *
 * MOUSE_MOVE fires per DOM mousemove, which on a 120 Hz trackpad is up to 120
 * times a second. So moving the pointer across the map could ask for well over a
 * thousand scene renders a second, and the only thing done with the answer was
 * setting a CSS cursor.
 *
 * Three things make it cheap, in descending order of effect:
 *
 *   1. Skip entirely while the camera is moving. During a drag the cursor
 *      affordance is irrelevant and the readback competes with the thing the
 *      user is actually doing.
 *   2. Coalesce to one animation frame and gate on elapsed time and distance.
 *      A pointer that has not moved four pixels cannot have crossed onto a
 *      different target.
 *   3. Prefer `scene.pick` over `drillPick`. The topmost hit IS the right
 *      answer for "what would clicking do", and it is a single pass.
 *
 * The CCTV gizmo already time-gated its own MOUSE_MOVE; these two just missed
 * it, so this makes the pattern shared rather than remembered.
 */

/** Minimum gap between picks. ~15 Hz is far quicker than a cursor needs. */
const DEFAULT_INTERVAL_MS = 66;
/** Minimum pointer travel before re-picking, in CSS pixels. */
const DEFAULT_MIN_DISTANCE_PX = 4;

/**
 * Wrap a pick callback so it runs rarely, on a frame, and never mid-drag.
 *
 * @param {object} options
 * @param {object} options.scene Cesium scene.
 * @param {Function} options.pick Called with the coalesced position.
 * @param {number} [options.intervalMs]
 * @param {number} [options.minDistancePx]
 * @param {Function} [options.now] Injectable clock, for tests.
 * @param {Function} [options.schedule] Injectable frame scheduler, for tests.
 * @returns {{handle: Function, cancel: Function}}
 */
export function createHoverPickThrottle({
  scene,
  pick,
  intervalMs = DEFAULT_INTERVAL_MS,
  minDistancePx = DEFAULT_MIN_DISTANCE_PX,
  now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  schedule = (fn) => (typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(fn)
    : setTimeout(fn, 16)),
} = {}) {
  // -Infinity, not 0: with 0 the very first pick compares against a clock that
  // may itself start near zero, and the opening hover looks throttled. The
  // first movement should always resolve immediately.
  let lastRun = Number.NEGATIVE_INFINITY;
  let lastX = Number.NaN;
  let lastY = Number.NaN;
  let pending = null;
  let queued = false;

  /**
   * True while the user is driving the camera.
   * @returns {boolean}
   */
  function cameraIsMoving() {
    const controller = scene?.screenSpaceCameraController;
    // `_lastInertia*` are not public, so go by the flags that are: any active
    // input mode means the camera is under the user's hand right now.
    return Boolean(
      controller
      && (controller._aggregator?.isButtonDown?.(0)
        || controller._aggregator?.isButtonDown?.(1)
        || controller._aggregator?.isButtonDown?.(2))
    );
  }

  function run() {
    queued = false;
    const position = pending;
    pending = null;
    if (!position) return;
    lastRun = now();
    lastX = position.x;
    lastY = position.y;
    pick(position);
  }

  return {
    /**
     * Feed a raw MOUSE_MOVE position in.
     *
     * @param {{x: number, y: number}} position
     * @returns {void}
     */
    handle(position) {
      if (!position) return;
      if (cameraIsMoving()) return;
      const dx = position.x - lastX;
      const dy = position.y - lastY;
      if (Number.isFinite(lastX) && (dx * dx) + (dy * dy) < minDistancePx * minDistancePx) return;
      // Always keep the NEWEST position, so whenever the pick does run it
      // lands where the pointer ended up rather than where it was when the
      // window opened.
      pending = { x: position.x, y: position.y };
      if (queued) return;
      queued = true;
      if (now() - lastRun < intervalMs) {
        schedule(() => {
          // Still inside the window when the frame arrived: give up this turn
          // rather than busy-scheduling until the interval expires. The next
          // mouse move re-queues, and a pointer that has stopped moving needs
          // no further picks anyway.
          if (now() - lastRun >= intervalMs) run();
          else queued = false;
        });
        return;
      }
      schedule(run);
    },

    /** Drop any queued pick. */
    cancel() {
      pending = null;
      queued = false;
    },
  };
}
