import * as Cesium from 'cesium';
import { pickGlobeCoordinates } from './flightSimController.js';
import {
  formatNauticalMiles,
  greatCircleDistance,
  initialBearing,
  toDegrees,
  toRadians,
} from './simRoute.js';

/**
 * Flight Sim route planner.
 *
 * Tap-driven by design: no text entry anywhere. Either tap a preset city or tap
 * the globe. That keeps the planner usable by someone who has never opened a
 * flight simulator, which was the point.
 *
 * The panel owns only its own DOM and the map-pick handler. Everything about
 * flying lives in the controller.
 */

/** Preset cities offered as taps. Chosen for spread and recognisability. */
export const PRESET_CITIES = Object.freeze([
  { label: 'Vancouver', code: 'CYVR', latitudeDeg: 49.1947, longitudeDeg: -123.1792 },
  { label: 'Seattle', code: 'KSEA', latitudeDeg: 47.4502, longitudeDeg: -122.3088 },
  { label: 'San Francisco', code: 'KSFO', latitudeDeg: 37.6213, longitudeDeg: -122.3790 },
  { label: 'New York', code: 'KJFK', latitudeDeg: 40.6413, longitudeDeg: -73.7781 },
  { label: 'London', code: 'EGLL', latitudeDeg: 51.4700, longitudeDeg: -0.4543 },
  { label: 'Tokyo', code: 'RJTT', latitudeDeg: 35.5494, longitudeDeg: 139.7798 },
  { label: 'Sydney', code: 'YSSY', latitudeDeg: -33.9399, longitudeDeg: 151.1753 },
  { label: 'Dubai', code: 'OMDB', latitudeDeg: 25.2532, longitudeDeg: 55.3657 },
]);

/**
 * Wire up the planner panel.
 *
 * @param {object} options
 * @param {object} options.viewer - Cesium viewer.
 * @param {object} options.controller - Flight Sim controller.
 * @returns {object} Panel controller.
 */
export function createFlightSimPanel({ viewer, controller }) {
  const panel = document.getElementById('flightsim-panel');
  if (!panel) return { open() {}, close() {}, destroy() {} };

  const el = {
    fromCities: panel.querySelector('[data-fs-cities="from"]'),
    toCities: panel.querySelector('[data-fs-cities="to"]'),
    pickFrom: panel.querySelector('[data-fs-pick="from"]'),
    pickTo: panel.querySelector('[data-fs-pick="to"]'),
    readout: panel.querySelector('[data-fs="plan-readout"]'),
    distance: panel.querySelector('[data-fs="plan-distance"]'),
    bearing: panel.querySelector('[data-fs="plan-bearing"]'),
    ete: panel.querySelector('[data-fs="plan-ete"]'),
    startFlight: panel.querySelector('[data-fs="start-flight"]'),
    cancel: panel.querySelector('[data-fs="cancel"]'),
    status: panel.querySelector('[data-fs="status"]'),
    startModes: panel.querySelectorAll('[data-fs-start]'),
  };

  /** @type {{from: object|null, to: object|null, start: string}} */
  const plan = { from: null, to: null, start: 'air' };
  /** Which endpoint a globe tap will fill, or null when not picking. */
  let picking = null;
  /** @type {object|null} */
  let clickHandler = null;

  /**
   * Render the city grids.
   *
   * @returns {void}
   */
  function renderCities() {
    for (const [slot, container] of [['from', el.fromCities], ['to', el.toCities]]) {
      if (!container) continue;
      container.replaceChildren(...PRESET_CITIES.map((city) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fs-city';
        button.innerHTML = `${city.label}<small>${city.code}</small>`;
        const chosen = plan[slot];
        if (chosen && chosen.label === city.label) button.classList.add('is-selected');
        button.addEventListener('click', () => {
          plan[slot] = { ...city };
          stopPicking();
          refresh();
        });
        return button;
      }));
    }
  }

  /**
   * Arm globe picking for one endpoint.
   *
   * @param {'from'|'to'} slot
   * @returns {void}
   */
  function startPicking(slot) {
    picking = slot;
    viewer.scene.canvas.style.cursor = 'crosshair';
    el.pickFrom?.classList.toggle('is-armed', slot === 'from');
    el.pickTo?.classList.toggle('is-armed', slot === 'to');
    setStatus(slot === 'from' ? 'SELECT DEPARTURE' : 'SELECT DESTINATION');

    if (!clickHandler) {
      clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      clickHandler.setInputAction((click) => {
        if (!picking) return;
        const coords = pickGlobeCoordinates(viewer, click.position);
        if (!coords) return;
        plan[picking] = {
          ...coords,
          label: `${Math.abs(coords.latitudeDeg).toFixed(2)}°${coords.latitudeDeg >= 0 ? 'N' : 'S'} `
            + `${Math.abs(coords.longitudeDeg).toFixed(2)}°${coords.longitudeDeg >= 0 ? 'E' : 'W'}`,
        };
        stopPicking();
        refresh();
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
  }

  /**
   * @returns {void}
   */
  function stopPicking() {
    picking = null;
    viewer.scene.canvas.style.cursor = '';
    el.pickFrom?.classList.remove('is-armed');
    el.pickTo?.classList.remove('is-armed');
  }

  /**
   * @param {string} text
   * @returns {void}
   */
  function setStatus(text) {
    if (el.status) el.status.innerHTML = `<span class="fs-dot"></span> ${text}`;
  }

  /**
   * Recompute the readout and the enabled state of START FLIGHT.
   *
   * @returns {void}
   */
  function refresh() {
    renderCities();
    const ready = Boolean(plan.from && plan.to);

    if (ready && el.readout) {
      el.readout.hidden = false;
      const distanceM = greatCircleDistance(
        toRadians(plan.from.latitudeDeg), toRadians(plan.from.longitudeDeg),
        toRadians(plan.to.latitudeDeg), toRadians(plan.to.longitudeDeg)
      );
      const bearingDeg = toDegrees(initialBearing(
        toRadians(plan.from.latitudeDeg), toRadians(plan.from.longitudeDeg),
        toRadians(plan.to.latitudeDeg), toRadians(plan.to.longitudeDeg)
      ));
      if (el.distance) el.distance.textContent = `${formatNauticalMiles(distanceM)} NM`;
      if (el.bearing) el.bearing.textContent = `${String(Math.round(bearingDeg)).padStart(3, '0')}°`;
      // A 747 covers roughly 250 m/s in the cruise; good enough for a planning
      // estimate and clearly labelled as an estimate.
      const hours = distanceM / 250 / 3600;
      if (el.ete) {
        el.ete.textContent = hours >= 1
          ? `${Math.floor(hours)}:${String(Math.round((hours % 1) * 60)).padStart(2, '0')}`
          : `0:${String(Math.round(hours * 60)).padStart(2, '0')}`;
      }
      controller.setPlan({ from: plan.from, to: plan.to, start: plan.start });
      setStatus('READY TO FLY');
    } else if (el.readout) {
      el.readout.hidden = true;
      setStatus(plan.from ? 'SELECT A DESTINATION' : 'SELECT A DEPARTURE');
    }

    if (el.startFlight) el.startFlight.disabled = !ready;
  }

  el.pickFrom?.addEventListener('click', () => startPicking('from'));
  el.pickTo?.addEventListener('click', () => startPicking('to'));

  for (const button of el.startModes) {
    button.addEventListener('click', () => {
      plan.start = button.dataset.fsStart;
      for (const other of el.startModes) other.classList.toggle('is-active', other === button);
      refresh();
    });
  }

  el.startFlight?.addEventListener('click', async () => {
    if (el.startFlight.disabled) return;
    el.startFlight.disabled = true;
    setStatus('LOADING 747…');
    const result = await controller.start();
    if (!result.ok) {
      // Never leave the player with an invisible aircraft — say what failed.
      setStatus(result.reason || 'UNABLE TO START');
      el.startFlight.disabled = false;
      return;
    }
    panel.hidden = true;
    stopPicking();
  });

  el.cancel?.addEventListener('click', () => {
    close();
    controller.exit();
  });

  /**
   * @returns {void}
   */
  function open() {
    panel.hidden = false;
    panel.classList.remove('collapsed');
    refresh();
  }

  /**
   * @returns {void}
   */
  function close() {
    panel.hidden = true;
    stopPicking();
  }

  return {
    open,
    close,
    /**
     * Release the globe handler. Cesium handlers are not garbage-collected on
     * their own, so re-entering the mode would stack them.
     *
     * @returns {void}
     */
    destroy() {
      stopPicking();
      if (clickHandler && !clickHandler.isDestroyed()) clickHandler.destroy();
      clickHandler = null;
    },
  };
}
