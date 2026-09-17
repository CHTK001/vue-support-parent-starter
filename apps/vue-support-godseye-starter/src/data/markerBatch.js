import * as Cesium from 'cesium';

/**
 * Batched, non-blocking point markers.
 *
 * WHY THIS EXISTS. Layers drew their markers with Cesium's Entity API — one
 * `entities.add()` per data point. That is the convenient path and the slow
 * one: every entity becomes its own primitive with its own draw call, and its
 * properties are re-evaluated by a visualiser every frame. It is fine for
 * dozens of points and punishing for thousands.
 *
 * Measured on the live site before this existed: switching on the wildfire
 * layer froze the interface for 7.7 SECONDS, and enabling every layer at once
 * stopped the renderer responding altogether. Steady-state rendering was never
 * the problem — the median frame was 1.9 ms — the cost was all in building and
 * maintaining the entities.
 *
 * TWO FIXES, AND BOTH MATTER:
 *
 *   1. ONE DRAW CALL. A PointPrimitiveCollection batches every point into a
 *      single buffer, so ten thousand markers cost about what one costs.
 *
 *   2. BUILT ACROSS FRAMES. Even filling that buffer is expensive at scale, and
 *      doing it in one synchronous loop is exactly what froze the tab. Points
 *      are added in bounded chunks with a yield between them, so the interface
 *      stays responsive and the markers appear progressively instead of the
 *      page locking up and then everything arriving at once.
 *
 * WHAT THIS IS NOT FOR. Entities are still the right tool for a handful of rich
 * objects — labels, models, polylines, anything wanting a description or a
 * per-object material. This is for the case that hurts: thousands of plain
 * points that differ only in position, size and colour.
 *
 * IT CANNOT CLAMP TO TERRAIN, and that is the one thing to check before
 * converting a layer. The Entity API offers `heightReference: CLAMP_TO_GROUND`,
 * which drops a marker onto the ground wherever it is; a PointPrimitive sits at
 * exactly the height it is given. A point left at zero is therefore BELOW
 * GROUND anywhere with elevation — buried inside the hill it belongs to, which
 * is a bug this repo has already fixed once, on a layer whose markers vanished
 * in Denver and Zurich.
 *
 * So a layer may only move here if one of these holds:
 *   - it knows its own heights (airports carry field elevation), or
 *   - its points are genuinely at sea level, or
 *   - it can afford to sample terrain once when the data loads.
 * A layer that needs live clamping and has no height of its own should stay on
 * entities. Being fast is not worth being wrong about where something is.
 */

/** Points added per chunk. Large enough to be quick, small enough to yield. */
const CHUNK_SIZE = 2000;

/**
 * Schedule the next chunk.
 *
 * requestAnimationFrame paces to the display and stops entirely in a background
 * tab, which is the correct behaviour: a hidden tab should not be building
 * markers nobody is looking at. setTimeout is the fallback for environments
 * without rAF, so tests do not need a browser.
 *
 * @param {Function} fn
 * @returns {number|object}
 */
function scheduleChunk(fn) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(() => fn());
  return setTimeout(fn, 0);
}

/**
 * 取消正在进行的分片任务。
 * @param {number|object} handle
 */
function cancelChunk(handle) {
  if (handle === null || handle === undefined) return;
  if (typeof cancelAnimationFrame === 'function' && typeof handle === 'number') {
    cancelAnimationFrame(handle);
    return;
  }
  clearTimeout(handle);
}

/**
 * Create a batched marker collection.
 *
 * @param {object} options
 * @param {object} options.scene Cesium scene, for the primitive collection.
 * @param {Function} [options.onProgress] Called with (added, total) per chunk.
 * @param {Function} [options.onDone] Called once every point is in.
 * @param {Function} [options.requestRender] Ask for a frame after each chunk.
 * @param {number} [options.chunkSize]
 * @returns {object} Marker batch.
 */
export function createMarkerBatch({
  scene,
  onProgress = () => {},
  onDone = () => {},
  requestRender = () => {},
  chunkSize = CHUNK_SIZE,
} = {}) {
  /** @type {Cesium.PointPrimitiveCollection|null} */
  let collection = null;
  /** @type {number|object|null} */
  let pending = null;
  /** Bumped on every rebuild so a chunk from a superseded build is dropped. */
  let generation = 0;
  let visible = true;

  function ensureCollection() {
    if (collection || !scene?.primitives) return collection;
    collection = scene.primitives.add(new Cesium.PointPrimitiveCollection());
    collection.show = visible;
    return collection;
  }

  return {
    /**
     * Replace every marker.
     *
     * @param {Array<object>} points Each: {lon, lat, height?, color, size, id?, distanceMax?}
     * @returns {void}
     */
    setPoints(points) {
      const rows = Array.isArray(points) ? points : [];
      generation += 1;
      const mine = generation;
      cancelChunk(pending);
      pending = null;

      const target = ensureCollection();
      if (!target) return;
      target.removeAll();

      let index = 0;
      const addChunk = () => {
        // A rebuild started while this chunk was queued: abandon it rather than
        // pouring points into a collection that has already been cleared.
        if (mine !== generation) return;
        const end = Math.min(index + chunkSize, rows.length);
        for (; index < end; index += 1) {
          const point = rows[index];
          if (!point) continue;
          const lon = Number(point.lon);
          const lat = Number(point.lat);
          if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
          try {
            target.add({
              position: Cesium.Cartesian3.fromDegrees(lon, lat, Number(point.height) || 0),
              color: point.color,
              outlineColor: point.outlineColor,
              outlineWidth: Number.isFinite(point.outlineWidth) ? point.outlineWidth : 0,
              pixelSize: Number(point.size) || 6,
              // Finite, never Infinity: an infinite value draws the marker
              // through the planet, so points on the far side show through.
              disableDepthTestDistance: Number.isFinite(point.depthTestDistance)
                ? point.depthTestDistance
                : 50_000,
              distanceDisplayCondition: Number.isFinite(point.distanceMax)
                ? new Cesium.DistanceDisplayCondition(0, point.distanceMax)
                : undefined,
              // Carried through so a pick can identify what was clicked.
              id: point.id,
            });
          } catch {
            // One bad row must not abandon the rest of the world.
          }
        }
        onProgress(index, rows.length);
        requestRender();
        if (index < rows.length) {
          pending = scheduleChunk(addChunk);
          return;
        }
        pending = null;
        onDone(rows.length);
      };

      if (!rows.length) { onDone(0); return; }
      addChunk();
    },

    /**
     * 设置集合可见性。
     * @param {boolean} value
     */
    setVisible(value) {
      visible = value !== false;
      if (collection) collection.show = visible;
    },

    /**
     * 当前集合中的点数。
     * @returns {number}
     */
    length() {
      return collection ? collection.length : 0;
    },

    /**
     * 分片是否仍在添加中。
     * @returns {boolean}
     */
    building() {
      return pending !== null;
    },

    /** Stop any in-flight build and drop every point. */
    clear() {
      generation += 1;
      cancelChunk(pending);
      pending = null;
      if (collection) collection.removeAll();
    },

    /** Remove the collection from the scene entirely. */
    destroy() {
      this.clear();
      if (collection && scene?.primitives) {
        try { scene.primitives.remove(collection); } catch { /* already gone */ }
      }
      collection = null;
    },
  };
}
