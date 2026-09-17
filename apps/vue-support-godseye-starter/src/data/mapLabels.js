import * as Cesium from 'cesium';

/**
 * Map labels — town, neighbourhood, and street names over the live globe.
 *
 * Google's Photorealistic 3D Tiles ship with no cartographic labels at all, so
 * this drapes a transparent label-only raster (OpenStreetMap data, rendered by
 * CARTO) onto the tileset through `Cesium3DTileset#imageryLayers`. Draping on
 * the tileset rather than on a flat overlay means the labels land on the
 * buildings and terrain and stay correct as the camera tilts.
 *
 * The same imagery layer is also added to the globe, so keyless map stacks
 * (which have no photoreal tileset) get labels too.
 *
 * Attribution: © OpenStreetMap contributors, © CARTO — registered in
 * src/data/dataCredits.js and listed in DATA_SOURCES.md.
 */

/** Label-only raster: white type with a dark halo, sized for aerial imagery. */
const CARTO_LABELS_URL = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png';
const CARTO_SUBDOMAINS = ['a', 'b', 'c', 'd'];
/** CARTO serves these to z20; asking past it returns 404s, not sharper text. */
const CARTO_MAX_ZOOM = 20;

let _viewer = null;
let _tileset = null;
let _imageryLayer = null;
let _enabled = false;
let _status = 'idle';

/**
 * Build the label imagery layer on first use.
 * @returns {Cesium.ImageryLayer}
 */
function buildImageryLayer() {
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: CARTO_LABELS_URL,
    subdomains: CARTO_SUBDOMAINS,
    maximumLevel: CARTO_MAX_ZOOM,
    credit: new Cesium.Credit('© OpenStreetMap contributors, © CARTO', false),
  });
  const layer = new Cesium.ImageryLayer(provider);
  // Labels are an overlay, never a basemap: keep them fully on top and let the
  // photoreal imagery show through everywhere the tile is transparent.
  layer.alpha = 1.0;
  return layer;
}

/** Collections the label layer should be attached to, skipping any absent one. */
function targetCollections() {
  const collections = [];
  // Cesium 1.128+ drapes imagery on 3D Tiles; guard so an older/rebuilt Cesium
  // silently falls back to globe-only labels instead of throwing on enable.
  if (_tileset?.imageryLayers) collections.push(_tileset.imageryLayers);
  if (_viewer?.scene?.globe?.imageryLayers) collections.push(_viewer.scene.globe.imageryLayers);
  return collections;
}

const mapLabelsLayer = {
  id: 'map-labels',
  name: 'Map Labels',
  icon: '🏷️',
  source: 'OpenStreetMap / CARTO',

  /**
   * @param {Cesium.Viewer} viewer - Cesium viewer instance.
   * @returns {void}
   */
  init(viewer) {
    _viewer = viewer;
    _enabled = false;
    _status = 'idle';
  },

  /**
   * Hand over the Google photoreal tileset so labels can drape onto it.
   * Called from bootstrap; null on a keyless stack, which is not an error.
   * @param {Cesium.Cesium3DTileset|null} tileset
   * @returns {void}
   */
  attachTileset(tileset) {
    _tileset = tileset || null;
    // A tileset arriving while labels are already on needs a retroactive add.
    if (_enabled && _tileset?.imageryLayers && _imageryLayer
      && !_tileset.imageryLayers.contains(_imageryLayer)) {
      _tileset.imageryLayers.add(_imageryLayer);
    }
  },

  /**
   * 启用地图标签图层。
   * @returns {void}
   */
  enable() {
    if (_enabled) return;
    if (!_imageryLayer) _imageryLayer = buildImageryLayer();

    const collections = targetCollections();
    if (!collections.length) {
      _status = 'unavailable';
      return;
    }
    for (const collection of collections) {
      if (!collection.contains(_imageryLayer)) collection.add(_imageryLayer);
    }
    _enabled = true;
    _status = 'live';
    _viewer?.scene?.requestRender?.();
  },

  /**
   * 禁用地图标签图层。
   * @returns {void}
   */
  disable() {
    if (!_enabled) return;
    for (const collection of targetCollections()) {
      // `false` keeps the layer alive for the next enable — destroying it would
      // force a full re-download of every visible label tile on each toggle.
      if (collection.contains(_imageryLayer)) collection.remove(_imageryLayer, false);
    }
    _enabled = false;
    _status = 'idle';
    _viewer?.scene?.requestRender?.();
  },

  /**
   * Raster imagery streams itself; there is no polled dataset to refresh.
   * @returns {void}
   */
  update() {},

  /**
   * @returns {{count: number|null, status: string, detail: string}}
   */
  getStats() {
    return {
      count: null,
      status: _status,
      detail: _status === 'unavailable'
        ? 'No surface to drape labels on'
        : 'Town, neighbourhood & street names (OSM / CARTO)',
    };
  },

  /**
   * 销毁标签图层资源。
   * @returns {void}
   */
  destroy() {
    this.disable();
    if (_imageryLayer && !_imageryLayer.isDestroyed?.()) _imageryLayer.destroy?.();
    _imageryLayer = null;
    _tileset = null;
    _viewer = null;
  },
};

export default mapLabelsLayer;
