/**
 * Flight Sim input.
 *
 * Owns the keyboard while the mode is ACTIVE and releases it completely on
 * exit, so entering and leaving repeatedly never stacks listeners.
 *
 * Held keys produce smooth continuous control rather than per-keydown steps —
 * a flight control has a position, not an event stream. Axes ease toward the
 * commanded value and self-centre when released, which is also what stops the
 * aircraft snapping when a key repeat fires.
 *
 * SHIFT toggles pointer lock for mouse-yoke control (the user's choice), which
 * is why throttle lives on `=` / `-` and PageUp / PageDown rather than
 * Shift/Ctrl.
 */

import { clamp } from './flightDynamics.js';

/** How fast a control axis moves toward its commanded position, per second. */
const AXIS_RATE = 2.6;
/** How fast an axis returns to centre when nothing is held, per second. */
const AXIS_CENTRE_RATE = 1.9;
/** Throttle change per second while a throttle key is held. */
const THROTTLE_RATE = 0.35;
/** Mouse travel, in pixels, that equals full control deflection. */
const MOUSE_FULL_DEFLECTION_PX = 260;
/** Multiplier applied to the chase distance per wheel notch. */
const ZOOM_PER_NOTCH = 1.12;
/** How far the chase camera can be pulled in and pushed out. */
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 6;
/** Degrees of free-look per pixel dragged. */
const LOOK_PER_PX_RAD = 0.0042;
/** Free-look elevation limit, radians — stops the camera flipping over the top. */
const LOOK_PITCH_LIMIT = 1.15;

/**
 * Create the input controller.
 *
 * @param {object} options
 * @param {HTMLElement} options.surface - Element that receives pointer lock.
 * @param {() => void} [options.onExitRequest] - ESC pressed.
 * @param {(action: string) => void} [options.onAction] - Discrete key action.
 * @returns {object} Input controller.
 */
export function createSimInput({ surface, onExitRequest, onAction } = {}) {
  const held = new Set();
  let attached = false;
  let mouseYoke = false;
  let mouseX = 0;
  let mouseY = 0;
  /* Camera view state. These are SEPARATE from the control axes on purpose:
     looking around and zooming must never nudge the aeroplane. */
  let zoom = 1;
  let lookYaw = 0;
  let lookPitch = 0;
  let dragging = false;

  const axes = { pitch: 0, roll: 0, yaw: 0 };
  let throttle = 0;
  /** Set when a discrete action fires, so the controller can read and clear it. */
  const pending = [];

  /**
   * Whether the event came from somewhere the user is typing.
   *
   * Without this, pressing G in the location search box would drop the landing
   * gear instead of typing a letter.
   *
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  function isTypingTarget(event) {
    const el = event.target;
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
  }

  /**
   * @param {KeyboardEvent} event
   * @returns {void}
   */
  function onKeyDown(event) {
    if (isTypingTarget(event)) return;

    // ESC is handled by the app's own arbitration, so it is only reported —
    // never acted on here, and never preventDefault'ed.
    if (event.key === 'Escape') {
      onExitRequest?.();
      return;
    }

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    held.add(key);

    // Discrete actions fire once per press, not per repeat.
    if (event.repeat) return;
    const action = DISCRETE_ACTIONS[key];
    if (action) {
      pending.push(action);
      onAction?.(action);
    }

    // Only swallow keys the mode actually owns, so app shortcuts we do not use
    // keep working and the browser keeps its own.
    if (OWNED_KEYS.has(key)) event.preventDefault();
  }

  /**
   * @param {KeyboardEvent} event
   * @returns {void}
   */
  function onKeyUp(event) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    held.delete(key);
  }

  /**
   * Losing focus must clear every held key, or a control sticks at full
   * deflection while the user is in another window.
   *
   * @returns {void}
   */
  function onBlur() {
    held.clear();
  }

  /**
   * @param {MouseEvent} event
   * @returns {void}
   */
  function onMouseMove(event) {
    if (mouseYoke) {
      mouseX = clamp(mouseX + event.movementX, -MOUSE_FULL_DEFLECTION_PX, MOUSE_FULL_DEFLECTION_PX);
      mouseY = clamp(mouseY + event.movementY, -MOUSE_FULL_DEFLECTION_PX, MOUSE_FULL_DEFLECTION_PX);
      return;
    }
    // Not flying with the mouse — a drag orbits the camera instead. This is
    // the whole reason SHIFT exists: one pointer, two jobs, explicitly chosen.
    if (!dragging) return;
    lookYaw += event.movementX * LOOK_PER_PX_RAD;
    lookPitch = clamp(
      lookPitch - event.movementY * LOOK_PER_PX_RAD,
      -LOOK_PITCH_LIMIT,
      LOOK_PITCH_LIMIT
    );
  }

  /**
   * @param {MouseEvent} event
   * @returns {void}
   */
  function onMouseDown(event) {
    if (mouseYoke) return;
    // Either button orbits. The RIGHT button is the one to reach for — it is
    // the convention in every flight sim, and it leaves the left button free —
    // but accepting both means a drag never silently does nothing.
    if (event.button !== 0 && event.button !== 2) return;
    // Stop the event reaching Cesium's ScreenSpaceCameraController, which would
    // otherwise spin the globe underneath us on the same drag.
    event.preventDefault();
    dragging = true;
  }

  /**
   * @returns {void}
   */
  function onMouseUp() {
    dragging = false;
  }

  /**
   * Suppress the context menu so a right-button drag can orbit the aircraft.
   *
   * @param {Event} event
   * @returns {void}
   */
  function onContextMenu(event) {
    event.preventDefault();
  }

  /**
   * Wheel zooms the chase camera rather than the globe.
   *
   * Cesium's own wheel handler zooms the scene camera, which this mode
   * overwrites with setView every frame — so without capturing it here the
   * wheel appears to do nothing at all.
   *
   * @param {WheelEvent} event
   * @returns {void}
   */
  function onWheel(event) {
    event.preventDefault();
    const notches = event.deltaY / 100;
    zoom = clamp(zoom * Math.pow(ZOOM_PER_NOTCH, notches), ZOOM_MIN, ZOOM_MAX);
  }

  /**
   * Pointer lock can be dropped by the browser (ESC, tab switch) without us
   * asking, so the yoke state follows the document rather than our intent.
   *
   * @returns {void}
   */
  function onPointerLockChange() {
    const locked = document.pointerLockElement === surface;
    if (!locked && mouseYoke) {
      mouseYoke = false;
      mouseX = 0;
      mouseY = 0;
      onAction?.('mouse-yoke-off');
    }
  }

  /** Keys the mode consumes; anything else falls through to the app. */
  const OWNED_KEYS = new Set([
    'w', 's', 'a', 'd', 'q', 'e', 'g', 'f', 'b', 'c', 'p', 'h',
    ' ', '=', '+', '-', '_', 'PageUp', 'PageDown', 'Shift',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  ]);

  /** Single-press actions. */
  const DISCRETE_ACTIONS = {
    g: 'gear',
    f: 'flaps',
    b: 'spoilers',
    c: 'camera',
    p: 'pause',
    h: 'help',
    Shift: 'mouse-yoke',
  };

  return {
    /**
     * Start listening. Idempotent.
     *
     * @returns {void}
     */
    attach() {
      if (attached) return;
      attached = true;
      window.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('keyup', onKeyUp, true);
      window.addEventListener('blur', onBlur);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('pointerlockchange', onPointerLockChange);
      surface?.addEventListener('mousedown', onMouseDown);
      surface?.addEventListener('contextmenu', onContextMenu);
      // passive:false — onWheel calls preventDefault to stop Cesium zooming
      // the globe underneath the aircraft.
      surface?.addEventListener('wheel', onWheel, { passive: false });
    },

    /**
     * Stop listening and release pointer lock. Idempotent, and safe to call
     * when never attached — exit paths must be able to call it unconditionally.
     *
     * @returns {void}
     */
    detach() {
      if (!attached) return;
      attached = false;
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      surface?.removeEventListener('mousedown', onMouseDown);
      surface?.removeEventListener('contextmenu', onContextMenu);
      surface?.removeEventListener('wheel', onWheel);
      dragging = false;
      held.clear();
      axes.pitch = 0;
      axes.roll = 0;
      axes.yaw = 0;
      pending.length = 0;
      if (document.pointerLockElement === surface) document.exitPointerLock?.();
      mouseYoke = false;
    },

    /**
     * Toggle mouse-yoke pointer lock.
     *
     * @returns {boolean} Whether the yoke is now on.
     */
    toggleMouseYoke() {
      if (mouseYoke) {
        if (document.pointerLockElement === surface) document.exitPointerLock?.();
        mouseYoke = false;
      } else {
        surface?.requestPointerLock?.();
        mouseYoke = true;
        mouseX = 0;
        mouseY = 0;
      }
      return mouseYoke;
    },

    /**
     * @returns {boolean}
     */
    isMouseYoke() {
      return mouseYoke;
    },

    /**
     * Current camera view state — zoom factor and free-look offsets.
     *
     * Read by the camera, never by the physics: looking around must not fly
     * the aeroplane.
     *
     * @returns {{zoom: number, lookYaw: number, lookPitch: number}}
     */
    view() {
      return { zoom, lookYaw, lookPitch };
    },

    /**
     * Recentre the view. Called when the camera mode changes, so a new view
     * starts from its designed framing rather than inheriting the last one's
     * angle.
     *
     * @returns {void}
     */
    resetView() {
      zoom = 1;
      lookYaw = 0;
      lookPitch = 0;
      dragging = false;
    },

    /**
     * Advance the control axes.
     *
     * @param {number} dt - Seconds.
     * @returns {{pitch: number, roll: number, yaw: number, throttleDelta: number, brakes: boolean}}
     */
    sample(dt) {
      // Mouse yoke overrides the keyboard for pitch and roll while engaged.
      if (mouseYoke) {
        axes.roll = clamp(mouseX / MOUSE_FULL_DEFLECTION_PX, -1, 1);
        axes.pitch = clamp(-mouseY / MOUSE_FULL_DEFLECTION_PX, -1, 1);
      } else {
        const pitchUp = held.has('s') || held.has('ArrowDown');
        const pitchDown = held.has('w') || held.has('ArrowUp');
        const rollLeft = held.has('a') || held.has('ArrowLeft');
        const rollRight = held.has('d') || held.has('ArrowRight');
        axes.pitch = ease(axes.pitch, (pitchUp ? 1 : 0) - (pitchDown ? 1 : 0), dt);
        axes.roll = ease(axes.roll, (rollRight ? 1 : 0) - (rollLeft ? 1 : 0), dt);
      }

      const yawLeft = held.has('q');
      const yawRight = held.has('e');
      axes.yaw = ease(axes.yaw, (yawRight ? 1 : 0) - (yawLeft ? 1 : 0), dt);

      let throttleDelta = 0;
      if (held.has('=') || held.has('+') || held.has('PageUp')) throttleDelta += THROTTLE_RATE * dt;
      if (held.has('-') || held.has('_') || held.has('PageDown')) throttleDelta -= THROTTLE_RATE * dt;
      throttle = clamp(throttle + throttleDelta, 0, 1);

      return {
        pitch: axes.pitch,
        roll: axes.roll,
        yaw: axes.yaw,
        throttleDelta,
        brakes: held.has(' '),
      };
    },

    /**
     * Drain queued discrete actions.
     *
     * @returns {string[]}
     */
    drainActions() {
      const out = pending.slice();
      pending.length = 0;
      return out;
    },
  };
}

/**
 * Ease an axis toward a target, self-centring when the target is zero.
 *
 * Exported for tests: the centring rate being slower than the drive rate is
 * what gives the controls their weight.
 *
 * @param {number} current
 * @param {number} target - −1, 0 or 1.
 * @param {number} dt
 * @returns {number}
 */
export function ease(current, target, dt) {
  const rate = target === 0 ? AXIS_CENTRE_RATE : AXIS_RATE;
  const step = rate * dt;
  const diff = target - current;
  if (Math.abs(diff) <= step) return target;
  return current + Math.sign(diff) * step;
}
