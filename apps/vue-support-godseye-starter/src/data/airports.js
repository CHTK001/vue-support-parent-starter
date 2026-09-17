import * as Cesium from 'cesium';
import { createMarkerBatch } from './markerBatch.js';
import { cameraViewBox, createViewportIndex } from './viewportIndex.js';
import { loadLayerData } from './layerDataClient.js';

/**
 * Airports.
 *
 * 11,444 airports worldwide with their runways: length, surface, lighting and
 * TRUE heading. Compiled by scripts/compile-airports.mjs from OurAirports,
 * which is public domain — no key, no attribution requirement, no
 * redistribution restriction.
 *
 * WHY THE RUNWAY DATA IS HERE and not just a dot. The flight simulator had
 * nowhere to aim: photorealistic tiles are photographs, so they can show a
 * runway but cannot say which way it points, how long it is, or whether it is
 * paved. A pilot needs all three before committing to an approach, and so does
 * anyone flying the sim.
 *
 * WHAT IS NOT HERE. Heliports, seaplane bases and closed fields are excluded at
 * compile time. A closed airport drawn on a map is a lie about where you can
 * land, and 13,482 of them would have been drawn.
 */

const API_URL = '/api/airports';

/** Static reference data. Runways do not move. */
const UPDATE_INTERVAL_MS = 0;

/** How deep to drill for a marker under the cursor. */
const PICK_DEPTH = 8;

/**
 * Marker styling by airport size.
 *
 * Deliberately not a continuous scale on runway length: three sizes read as
 * three categories at a glance, whereas a smooth ramp reads as noise. Colour
 * carries the same information as size so the distinction survives for anyone
 * who cannot easily compare small dots.
 */
export const AIRPORT_TIERS = Object.freeze({
  large: { label: 'Large', color: '#4fd8e8', pixelSize: 11, minZoomM: Infinity },
  medium: { label: 'Medium', color: '#7fd4a0', pixelSize: 8, minZoomM: 900_000 },
  small: { label: 'Small', color: '#9aa8b4', pixelSize: 5, minZoomM: 260_000 },
});

const TIER_ORDER = Object.freeze(['large', 'medium', 'small']);

/**
 * Format a runway for display.
 *
 * @param {object} runway
 * @returns {string}
 */
export function runwayLine(runway) {
  if (!runway) return '';
  const parts = [];
  if (runway.ident) parts.push(runway.ident);
  if (Number.isFinite(runway.lengthFt)) {
    parts.push(`${runway.lengthFt.toLocaleString()} ft`);
  }
  if (runway.surface) parts.push(runway.surface.toUpperCase());
  if (runway.lit) parts.push('LIT');
  if (Number.isFinite(runway.headingDeg)) {
    parts.push(`${Math.round(runway.headingDeg).toString().padStart(3, '0')}°T`);
  }
  return parts.join(' · ');
}

/**
 * Whether an aircraft of a given class can use this airport.
 *
 * Used by the flight simulator to answer "can I land here". A 747 needs roughly
 * 8,000 ft of hard runway at typical landing weight; light aircraft need far
 * less. Deliberately conservative: telling someone they can land somewhere they
 * cannot is worse than the reverse.
 *
 * @param {object} airport
 * @param {number} requiredFt
 * @returns {boolean}
 */
export function canAccept(airport, requiredFt = 8000) {
  if (!airport) return false;
  return (airport.runways || []).some(
    (runway) => runway.hard && Number(runway.lengthFt) >= requiredFt
  );
}

/**
 * The nearest airport to a point that can take the aircraft.
 *
 * @param {Array<object>} airports
 * @param {number} lat
 * @param {number} lon
 * @param {number} [requiredFt]
 * @returns {object|null}
 */
export function nearestUsable(airports, lat, lon, requiredFt = 8000) {
  let best = null;
  let bestScore = Infinity;
  for (const airport of airports || []) {
    if (!canAccept(airport, requiredFt)) continue;
    // Squared degrees is not a distance, but it orders correctly over the
    // ranges that matter here and costs no trigonometry per candidate.
    const dLat = airport.lat - lat;
    const dLon = (airport.lon - lon) * Math.cos((lat * Math.PI) / 180);
    const score = (dLat * dLat) + (dLon * dLon);
    if (score < bestScore) {
      bestScore = score;
      best = airport;
    }
  }
  return best;
}

/**
 * Create the layer.
 *
 * @returns {object} Layer module.
 */
export function createAirportsLayer() {
  /** @type {object|null} Batched point primitives, not entities. */
  let _markers = null;
  /** @type {object|null} */
  let _viewer = null;
  /** R-tree over the visible tier set, rebuilt when the filter changes. */
  let _index = null;
  /** Camera listener handle, so it can be detached. */
  let _removeCameraListener = null;
  /** Coalesces camera moves into one rebuild. */
  let _cullTimer = null;
  /** @type {Array<object>} */
  let _airports = [];
  let _shown = 0;
  let _loaded = false;
  let _enabled = false;
  let _lastUpdate = null;
  let _lastError = null;
  let _coverageNote = '';
  /** Which size tiers are drawn. */
  let _tiers = new Set(['large', 'medium']);
  let _rowControlsListener = null;
  let _clickHandler = null;
  let _card = null;

  /**
   * @returns {Array<object>}
   */
  function visible() {
    return _airports.filter((airport) => _tiers.has(airport.type));
  }

  /**
   * Draw the markers.
   *
   * BATCHED PRIMITIVES, NOT ENTITIES. Eleven thousand airports as entities is
   * eleven thousand primitives, each with its own draw call and its own
   * per-frame visualiser pass. Measured across the app, that approach froze the
   * interface for seconds whenever a large layer was switched on. A
   * PointPrimitiveCollection puts them all in one buffer, and the batch fills
   * it across frames so the tab never locks up.
   */
  /**
   * Rebuild the index over whichever tiers are switched on.
   *
   * Rebuilt on a filter change rather than on every camera move: the index
   * describes the DATA, and only the query depends on where the camera is.
   */
  function reindex() {
    _index = createViewportIndex(visible());
  }

  /**
   * Draw whatever the camera can currently see.
   *
   * Culling to the view is what keeps this cheap as the dataset grows: at city
   * zoom a handful of airports are in frame, and building the other eleven
   * thousand is work whose result nobody can see. A view covering most of the
   * globe returns no box, and then everything is drawn — correctly, because at
   * that point everything IS visible.
   */
  function renderVisible() {
    if (!_markers || !_index) return;
    const box = _viewer ? cameraViewBox(_viewer, Cesium) : null;
    const rows = box ? _index.search(box) : _index.all();
    _shown = rows.length;
    _markers.setPoints(rows.map((airport) => {
      const tier = AIRPORT_TIERS[airport.type] || AIRPORT_TIERS.small;
      return {
        lon: airport.lon,
        lat: airport.lat,
        // TERRAIN HEIGHT MATTERS HERE, and batched points cannot clamp.
        //
        // Cesium's Entity API offers heightReference: CLAMP_TO_GROUND, which
        // drops a marker onto the terrain wherever it is. PointPrimitive has no
        // such option — a batched point sits at the height you give it — so a
        // marker left at ellipsoid zero is BELOW ground anywhere with
        // elevation, and airports at Denver, La Paz or Lhasa would be buried
        // inside the mountain they sit on.
        //
        // OurAirports records field elevation, so there is no need to sample
        // terrain for it: use the number the dataset already carries. Feet to
        // metres, and zero where it is unknown, which is correct for the
        // sea-level fields that make up most of the unknowns.
        height: Number.isFinite(airport.elevationFt) ? airport.elevationFt * 0.3048 : 0,
        size: tier.pixelSize,
        color: Cesium.Color.fromCssColorString(tier.color).withAlpha(0.92),
        outlineColor: Cesium.Color.BLACK.withAlpha(0.55),
        outlineWidth: 1,
        // Small fields only appear once the camera is close enough for them to
        // be distinguishable; drawn at global zoom they are a grey haze over
        // every populated continent.
        distanceMax: Number.isFinite(tier.minZoomM) ? tier.minZoomM : undefined,
        // The pick target. A batched point carries an id rather than an entity,
        // so this is what a click resolves to.
        id: { airport },
      };
    }));
    _rowControlsListener?.();
  }

  /**
   * Redraw after the camera settles.
   *
   * Coalesced, because a single drag fires many move events and rebuilding the
   * marker set on each one would cost far more than the culling saves.
   */
  function scheduleCull() {
    if (!_enabled) return;
    clearTimeout(_cullTimer);
    _cullTimer = setTimeout(renderVisible, 120);
  }

  /** Rebuild the index and redraw. Called when the data or filter changes. */
  function render() {
    reindex();
    renderVisible();
  }

  /**
   * Show the detail card for an airport.
   *
   * @param {object} airport
   * @returns {void}
   */
  function showCard(airport) {
    _card = document.getElementById('airport-card');
    if (!_card) return;
    const code = [airport.icao, airport.iata].filter(Boolean).join(' / ');
    const runways = (airport.runways || []).map(
      (runway) => `<li>${runwayLine(runway)}</li>`
    ).join('');
    _card.innerHTML = `
      <button class="airport-card-close" data-airport="close" aria-label="Close">×</button>
      <div class="airport-card-type">${(AIRPORT_TIERS[airport.type] || {}).label || ''} airport</div>
      <h3 class="airport-card-name">${airport.name}</h3>
      <div class="airport-card-code">${code}</div>
      <div class="airport-card-meta">
        ${airport.municipality ? `${airport.municipality} · ` : ''}${airport.country}
        ${Number.isFinite(airport.elevationFt) ? ` · ${airport.elevationFt.toLocaleString()} ft elev` : ''}
      </div>
      ${runways ? `<div class="airport-card-runways"><div class="airport-card-label">RUNWAYS</div><ul>${runways}</ul></div>` : ''}
    `;
    _card.hidden = false;
    _card.querySelector('[data-airport="close"]')?.addEventListener('click', closeCard);
  }

  function closeCard() {
    if (_card) _card.hidden = true;
  }

  /**
   * @param {object} viewer
   */
  function installInteraction(viewer) {
    if (_clickHandler || !viewer?.scene?.canvas) return;
    _clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    _clickHandler.setInputAction((click) => {
      if (!_enabled) return;
      // drillPick, not pick: a plain pick returns the topmost primitive, which
      // over Google's photorealistic tiles is the tile surface itself, so every
      // click on a marker reads as empty ground.
      const hits = viewer.scene.drillPick(click.position, PICK_DEPTH) || [];
      for (const hit of hits) {
        // Batched points carry a plain object id, not an Entity, so there is no
        // properties bag and no getValue() to unwrap.
        const airport = hit?.id?.airport;
        if (airport) { showCard(airport); return; }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  const layer = {
    id: 'airports',
    name: 'Airports',
    icon: '🛬',
    source: 'OurAirports',
    updateInterval: UPDATE_INTERVAL_MS,

    init(viewer) {
      _viewer = viewer;
      _markers = createMarkerBatch({
        scene: viewer.scene,
        requestRender: () => viewer.scene.requestRender(),
        onDone: () => _rowControlsListener?.(),
      });
      _markers.setVisible(false);
      _airports = [];
      _shown = 0;
      _loaded = false;
      _enabled = false;
      _lastUpdate = null;
      _lastError = null;
    },

    enable(viewer) {
      _enabled = true;
      _markers?.setVisible(true);
      installInteraction(viewer);
      // Recull when the camera stops. moveEnd rather than every frame: the
      // visible set only changes when the view does, and only meaningfully
      // once it has settled.
      if (!_removeCameraListener && viewer?.camera?.moveEnd) {
        _removeCameraListener = viewer.camera.moveEnd.addEventListener(scheduleCull);
      }
      renderVisible();
    },

    disable() {
      _enabled = false;
      clearTimeout(_cullTimer);
      _removeCameraListener?.();
      _removeCameraListener = null;
      _markers?.setVisible(false);
      closeCard();
    },

    async update() {
      // Static reference data: fetched once. Re-fetching on a timer would be
      // pure waste, since none of these records change between deploys.
      if (_loaded) return true;
      try {
        // OFF THE MAIN THREAD. This dataset is five megabytes, and the
        // download, the JSON.parse and the filtering all used to happen on the
        // thread that draws frames — which is why switching a layer on froze
        // the interface for seconds rather than milliseconds. The worker does
        // it on another core and hands back finished rows.
        const payload = await loadLayerData('airports', API_URL);
        _airports = Array.isArray(payload?.airports) ? payload.airports : [];
        _coverageNote = typeof payload?.note === 'string' ? payload.note
          : (typeof payload?.coverageNote === 'string' ? payload.coverageNote : '');
        _loaded = true;
        _lastUpdate = Date.now();
        _lastError = null;
        render();
        return true;
      } catch (error) {
        _lastError = String(error?.message || error);
        return false;
      }
    },

    /**
     * @param {{tiers?: Array<string>}} params
     * @returns {boolean}
     */
    setParams(params = {}) {
      if (!Array.isArray(params.tiers)) return false;
      const next = new Set(params.tiers.filter((tier) => tier in AIRPORT_TIERS));
      // An empty selection would silently blank the layer while it still reads
      // as enabled; keep the largest tier rather than showing nothing.
      if (!next.size) next.add('large');
      _tiers = next;
      render();
      return true;
    },

    /**
     * @param {Function} listener
     */
    setRowControlsListener(listener) {
      _rowControlsListener = typeof listener === 'function' ? listener : null;
    },

    getRowControls() {
      const counts = _airports.reduce((acc, airport) => {
        acc[airport.type] = (acc[airport.type] || 0) + 1;
        return acc;
      }, {});
      return {
        chips: TIER_ORDER.map((tier) => {
          const selected = new Set(_tiers);
          if (selected.has(tier)) selected.delete(tier);
          else selected.add(tier);
          return {
            id: tier,
            label: `${AIRPORT_TIERS[tier].label.toUpperCase()} ${counts[tier] || 0}`,
            active: _tiers.has(tier),
            params: { tiers: [...selected] },
          };
        }),
        legend: TIER_ORDER.map((tier) => ({
          label: AIRPORT_TIERS[tier].label,
          color: AIRPORT_TIERS[tier].color,
          count: counts[tier] || 0,
          blurb: 'Runway length, surface and true heading on every airport.',
        })),
      };
    },

    getStats() {
      return {
        count: _shown,
        lastUpdate: _lastUpdate,
        error: _lastError,
        note: _coverageNote,
      };
    },

    /**
     * For the flight simulator.
     * @returns {Array<object>}
     */
    all() {
      return _airports;
    },
  };

  return layer;
}

const airportsLayer = createAirportsLayer();

export default airportsLayer;
