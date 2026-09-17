import * as Cesium from 'cesium';

/**
 * World safety index.
 *
 * Every country shaded green to red by its intentional-homicide rate — the
 * UN's headline safety indicator, sourced from UNODC via the World Bank.
 *
 * WHY HOMICIDE AND NOT "CRIME". Theft, robbery and assault rates measure
 * REPORTING at least as much as offending: a country where people trust the
 * police enough to file a report scores worse than one where nobody bothers.
 * A body is hard not to record, so homicide survives that distortion better
 * than anything else available, which is why the UN uses it. It is a proxy,
 * not a verdict.
 *
 * HUMAN-CAUSED ONLY. People killed by other people. Earthquakes, storms,
 * floods and disease are not in this number.
 *
 * WHAT IT CANNOT TELL YOU, and the layer says so on its own row: this is a
 * country-wide average. Safe and dangerous neighbourhoods exist inside every
 * country here, and no national figure locates them. A green country is not a
 * promise and a red one is not a warning about any particular street.
 */

/** Compiled dataset, served by our own endpoint. */
const API_URL = '/api/safety';

/** Static reference data — there is nothing to re-poll. */
const UPDATE_INTERVAL_MS = 0;

/**
 * Homicide-rate bands, per 100,000 people per year.
 *
 * Chosen against the actual distribution rather than round numbers: the global
 * median is about 2.4, so a linear ramp would render most of the world in one
 * indistinguishable colour and waste the whole scale on a handful of outliers.
 * These bands put the median near the middle of the palette.
 */
export const SAFETY_BANDS = Object.freeze([
  { max: 1, label: 'Very low', color: '#2f9e63' },
  { max: 3, label: 'Low', color: '#86c05e' },
  { max: 8, label: 'Moderate', color: '#e8c95c' },
  { max: 20, label: 'High', color: '#e08b4b' },
  { max: Infinity, label: 'Very high', color: '#cf4b4b' },
]);

/**
 * The band a rate falls in.
 *
 * @param {number} rate
 * @returns {{max: number, label: string, color: string}}
 */
export function bandFor(rate) {
  const value = Number(rate);
  if (!Number.isFinite(value)) return SAFETY_BANDS[SAFETY_BANDS.length - 1];
  return SAFETY_BANDS.find((band) => value < band.max) || SAFETY_BANDS[SAFETY_BANDS.length - 1];
}

/**
 * Fill colour for a rate.
 *
 * @param {number} rate
 * @param {number} [alpha]
 * @returns {Cesium.Color}
 */
export function safetyColor(rate, alpha = 0.55) {
  return Cesium.Color.fromCssColorString(bandFor(rate).color).withAlpha(alpha);
}

/**
 * Country counts per band, for the row legend.
 *
 * @param {Array<object>} countries
 * @returns {Array<{label: string, color: string, count: number}>}
 */
export function bandCounts(countries) {
  return SAFETY_BANDS.map((band) => ({
    label: band.label,
    color: band.color,
    count: countries.filter((country) => bandFor(country.rate) === band).length,
  }));
}

/**
 * Create the layer.
 *
 * @returns {object} Layer module.
 */
export function createSafetyLayer() {
  /** @type {Cesium.CustomDataSource|null} */
  let _dataSource = null;
  /** @type {Array<object>} */
  let _countries = [];
  let _lastUpdate = null;
  let _lastError = null;
  let _loaded = false;
  let _coverageNote = '';
  let _rowControlsListener = null;

  /** Paint one polygon per country. */
  function render() {
    if (!_dataSource) return;
    _dataSource.entities.removeAll();

    for (const country of _countries) {
      const band = bandFor(country.rate);
      for (let i = 0; i < country.rings.length; i += 1) {
        const ring = country.rings[i];
        // Flatten to the [lon, lat, lon, lat, ...] form Cesium wants without
        // building an intermediate array of Cartesians per country.
        const flat = [];
        for (const [lon, lat] of ring) flat.push(lon, lat);
        try {
          _dataSource.entities.add({
            id: `safety-${country.iso3}-${i}`,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(flat),
              material: safetyColor(country.rate),
              // BOTH, not TERRAIN — this app runs with globe.show === false and
              // draws Google 3D tiles, so TERRAIN classifies onto nothing and
              // the polygons never appear.
              classificationType: Cesium.ClassificationType.BOTH,
            },
            description: `${country.name} — ${country.rate} homicides per 100,000 (${country.year}) · ${band.label}`,
            properties: {
              iso3: country.iso3,
              name: country.name,
              rate: country.rate,
              year: country.year,
              band: band.label,
            },
          });
        } catch {
          // One malformed ring must not abandon the rest of the world.
        }
      }
    }
    _rowControlsListener?.();
  }

  const layer = {
    id: 'safety',
    name: 'Safety Index',
    icon: '🛡️',
    source: 'UNODC / World Bank',
    updateInterval: UPDATE_INTERVAL_MS,

    init(viewer) {
      _dataSource = new Cesium.CustomDataSource('safety');
      _dataSource.show = false;
      viewer.dataSources.add(_dataSource);
      _countries = [];
      _loaded = false;
      _lastUpdate = null;
      _lastError = null;
    },

    enable() {
      if (_dataSource) _dataSource.show = true;
    },

    disable() {
      if (_dataSource) _dataSource.show = false;
    },

    async update() {
      if (_loaded) return true;
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          _lastError = `Safety HTTP ${response.status}`;
          return false;
        }
        const payload = await response.json();
        _countries = (Array.isArray(payload?.countries) ? payload.countries : [])
          .filter((c) => Array.isArray(c?.rings) && c.rings.length && Number.isFinite(Number(c.rate)));
        _coverageNote = typeof payload?.coverageNote === 'string' ? payload.coverageNote : '';
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
     * 设置行级控制监听器。
     * @param {Function} listener
     */
    setRowControlsListener(listener) {
      _rowControlsListener = typeof listener === 'function' ? listener : null;
    },

    /**
     * A colour legend, which is also where the caveat lives — a choropleth
     * with no key is just a coloured map.
     *
     * @returns {object}
     */
    getRowControls() {
      return {
        legend: bandCounts(_countries).map((band) => ({
          label: band.label,
          color: band.color,
          count: band.count,
          blurb: 'Intentional homicides per 100,000 people per year. Country-wide average.',
        })),
      };
    },

    getStats() {
      return {
        count: _countries.length,
        lastUpdate: _lastUpdate,
        error: _lastError,
        note: _coverageNote,
      };
    },
  };

  return layer;
}

const safetyLayer = createSafetyLayer();

export default safetyLayer;
