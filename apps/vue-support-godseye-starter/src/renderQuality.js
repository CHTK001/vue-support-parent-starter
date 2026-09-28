/**
 * Global render quality.
 *
 * One setting that governs how much the renderer is allowed to spend on image
 * quality, across the whole app rather than inside any one mode.
 *
 * Two dials do nearly all the visible work:
 *
 *   - `resolutionScale` — the app renders at CSS pixels by default, so on a
 *     Retina display every edge is drawn at half the panel's real density.
 *     Raising this is what removes the stair-stepping on wings, roads and the
 *     horizon. Cost scales with the SQUARE of the value.
 *   - the photoreal tileset's `maximumScreenSpaceError` — inverse quality:
 *     lower means Cesium tolerates less on-screen error and streams sharper
 *     tiles. This is what makes distant ground look detailed instead of
 *     smeared.
 *
 * AUTO is the default and means "let whatever is running decide": Flight Sim
 * measures its own frame times and adapts, and the map sits at Cesium's
 * defaults. Choosing an explicit level pins both dials and turns adaptation
 * off, because a setting the user chose should not be silently overridden.
 */

/** Preference key. */
const STORAGE_KEY = 'gev.renderQuality';

/**
 * The levels, in order.
 *
 * `resolution: null` on AUTO means "leave it to the caller" rather than any
 * particular number.
 */
export const QUALITY_LEVELS = Object.freeze({
  auto: { label: 'Auto', resolution: null, tileError: null },
  low: { label: 'Low', resolution: 0.5, tileError: 24 },
  medium: { label: 'Medium', resolution: 0.75, tileError: 16 },
  high: { label: 'High', resolution: 1, tileError: 16 },
  ultra: { label: 'Ultra', resolution: 1, tileError: 8 },
});

/**
 * Put the renderer on the display's real pixel grid.
 *
 * `useBrowserRecommendedResolution` is the correct switch, and the app never
 * touched it. Cesium computes the pixel ratio as
 * `(useBrowserRecommendedResolution ? 1 : devicePixelRatio) * resolutionScale`,
 * so with the flag left at its default of true the globe rendered at CSS pixels
 * — 1x — while every HUD overlay drew at the device ratio. The decoration was
 * sharp and the content was soft.
 *
 * Getting retina the other way, by leaving the flag alone and setting
 * resolutionScale = 2, is a trap: that pins an ABSOLUTE 2x buffer, so dragging
 * the window to a non-retina display keeps rendering four times the pixels it
 * needs, forever. Turning the flag off makes the base track devicePixelRatio on
 * its own — CesiumWidget.resize() re-checks it every frame — and frees
 * resolutionScale to mean what the quality table now means by it: a FRACTION of
 * native.
 *
 * @param {object} viewer - Cesium viewer.
 * @returns {void}
 */
export function setNativeResolution(viewer) {
  if (!viewer) return;
  viewer.useBrowserRecommendedResolution = false;
  viewer.resolutionScale = 1;
  // Resize immediately. Cesium recomputes scene.pixelRatio inside resize(), so
  // without this the flag is set but the ratio stays stale until the next
  // layout change — and anything reading it in between decides on the OLD
  // value. That bit: applyAntialiasing ran next, saw 1x, and left both
  // antialiasers off in the belief that supersampling was covering it, so the
  // opening seconds rendered at 1x with no antialiasing at all.
  viewer.resize?.();
}

/**
 * The pixel ratio the renderer will actually use.
 *
 * @param {object} viewer - Cesium viewer.
 * @returns {number}
 */
export function effectivePixelRatio(viewer) {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const base = viewer?.useBrowserRecommendedResolution === false ? dpr : 1;
  const scale = Number.isFinite(viewer?.resolutionScale) ? viewer.resolutionScale : 1;
  return base * scale;
}

/**
 * Choose exactly one antialiaser for the current pixel ratio.
 *
 * The app ran 4x MSAA and FXAA at the same time — two techniques solving the
 * same problem, with FXAA additionally forcing the entire post-process
 * framebuffer chain to stay allocated.
 *
 * Above about 1.75x effective ratio neither is worth paying for: rendering into
 * a buffer denser than the display and letting it downsample IS antialiasing,
 * and it is better than either. Measured at 2x, MSAA alone cost a factor of two
 * in frame time (18.62 ms against 9.22 ms) for no visible difference. Below
 * that threshold there is no supersampling to lean on, so MSAA earns its place.
 *
 * @param {object} viewer - Cesium viewer.
 * @returns {number} The effective pixel ratio it decided against.
 */
export function applyAntialiasing(viewer) {
  const scene = viewer?.scene;
  if (!scene) return 1;
  const ratio = effectivePixelRatio(viewer);
  const supersampled = ratio >= 1.75;
  if ('msaaSamples' in scene) scene.msaaSamples = supersampled ? 0 : 4;
  const fxaa = scene.postProcessStages?.fxaa;
  if (fxaa) fxaa.enabled = !supersampled;
  return ratio;
}

/** @type {string} */
let level = 'auto';

/**
 * Read the stored preference.
 *
 * @returns {string} A valid level id, defaulting to 'auto'.
 */
export function loadRenderQuality() {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (stored && stored in QUALITY_LEVELS) level = stored;
  } catch {
    // Private browsing or a blocked store is not a reason to fail startup.
  }
  return level;
}

/**
 * The active level id.
 * @returns {string}
 */
export function getRenderQuality() {
  return level;
}

/**
 * Whether a mode may adapt quality on its own.
 * @returns {boolean}
 */
export function isAutoQuality() {
  return level === 'auto';
}

/**
 * The resolution scale for a level, resolved against this display.
 *
 * ULTRA is capped by the device's own pixel ratio: asking for 2x on a 1x panel
 * renders four times the pixels and then throws three quarters of them away.
 *
 * @param {string} id - Level id.
 * @returns {number|null} Scale, or null when the level does not pin one.
 */
export function resolutionForLevel(id) {
  const entry = QUALITY_LEVELS[id];
  if (!entry || entry.resolution === null) return null;
  const dpr = globalThis.devicePixelRatio || 1;
  return Math.min(entry.resolution, Math.max(1, dpr));
}

/**
 * Apply a level to the scene.
 *
 * @param {object} options
 * @param {object} options.viewer - Cesium viewer.
 * @param {object|null} [options.tileset] - Photoreal tileset, if present.
 * @param {string} options.id - Level id.
 * @param {object|null} [options.defaults] - Values to restore for AUTO.
 * @returns {void}
 */
export function applyRenderQuality({ viewer, tileset, id, defaults = null }) {
  const entry = QUALITY_LEVELS[id];
  if (!viewer || !entry) return;

  const resolution = resolutionForLevel(id);
  if (resolution !== null) {
    viewer.resolutionScale = resolution;
  } else if (defaults && typeof defaults.resolutionScale === 'number') {
    viewer.resolutionScale = defaults.resolutionScale;
  }

  if (tileset) {
    if (entry.tileError !== null) {
      tileset.maximumScreenSpaceError = entry.tileError;
      // Dynamic error deliberately coarsens tiles far from a near-ground
      // camera. That is right for a map you are looking straight down at and
      // wrong the moment the horizon is in shot, which it always is once the
      // user has asked for a specific quality level.
      tileset.dynamicScreenSpaceError = false;
    } else if (defaults) {
      if (typeof defaults.tileError === 'number') {
        tileset.maximumScreenSpaceError = defaults.tileError;
      }
      if (typeof defaults.dynamicScreenSpaceError === 'boolean') {
        tileset.dynamicScreenSpaceError = defaults.dynamicScreenSpaceError;
      }
    }
  }

  // Antialiasing follows the resulting pixel density, not the level name: at
  // native retina the downsample already does the job, and stacking MSAA on
  // top of it was costing a factor of two for nothing visible.
  applyAntialiasing(viewer);
}

/**
 * Set and persist the level.
 *
 * @param {string} id - Level id.
 * @returns {string} The level actually set.
 */
export function setRenderQuality(id) {
  if (!(id in QUALITY_LEVELS)) return level;
  level = id;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, id);
  } catch {
    // A preference that cannot be written still applies for this session.
  }
  return level;
}
