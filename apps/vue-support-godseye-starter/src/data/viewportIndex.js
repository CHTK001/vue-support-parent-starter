/**
 * Viewport culling for point layers.
 *
 * THE WASTE THIS REMOVES. A layer holds every point it has ever loaded and
 * hands all of them to the renderer, whatever the camera is looking at. Flying
 * over Austin with the wildfire layer on means 9,319 fires are built, uploaded
 * and drawn so that perhaps forty of them can be seen. The cost is paid on
 * every rebuild, and it grows with each layer added rather than with what is
 * actually on screen.
 *
 * An R-tree answers "which points fall inside this rectangle" in roughly log
 * time instead of testing every point, so the working set becomes a function of
 * the VIEW rather than of the dataset. At city zoom that is a reduction of two
 * or three orders of magnitude; at globe zoom it correctly returns everything,
 * because everything genuinely is in view.
 *
 * WHY A GRID AND NOT A LIBRARY. This began as rbush, which is the obvious
 * choice and a good one. It could not ship: adding it made Render's build fail
 * three times running with npm's usage dump, while npm ci and the full build
 * both succeeded from a clean clone here — this machine runs npm 11 on Node 25
 * and Render runs Node 24.15, and no amount of regenerating the lockfile
 * reconciled them. A dependency that cannot be deployed is worth nothing, and
 * the index it provided is fifty lines.
 *
 * A uniform grid is also the better fit for this shape of problem. An R-tree
 * earns its complexity on overlapping rectangles of wildly varying size; these
 * are points, and the query is always an axis-aligned box. Bucketing by whole
 * degrees answers that by walking only the cells the box touches — no tree, no
 * rebalancing, and a build that is one pass with no allocation per node.
 *
 * At ten thousand points a plain linear scan is honestly fine, well under a
 * millisecond. It stops being fine at a hundred thousand, which is where this
 * is going: 108,045 military installations and 304,632 mines are already
 * researched and waiting. Building costs one pass when the data loads;
 * querying costs almost nothing, and querying is what happens on every camera
 * move.
 *
 * THE ANTIMERIDIAN IS HANDLED, because it is the thing that quietly breaks
 * every naive bounding-box cull: a view spanning it has a west edge numerically
 * GREATER than its east edge, and a single rectangle query then matches nothing
 * at all. Such a view is split into two queries and the results merged.
 */

/**
 * Build an index over points.
 *
 * @param {Array<object>} points - Each needs numeric `lat` and `lon`.
 * @returns {object} Index with a `search` method.
 */
export function createViewportIndex(points) {
  /** Cell size in degrees. One degree is ~111 km, a sensible bucket for a map. */
  const CELL = 1;
  const key = (lonCell, latCell) => `${lonCell}:${latCell}`;
  /** @type {Map<string, Array<object>>} */
  const cells = new Map();
  const items = [];

  for (const point of points || []) {
    const lon = Number(point?.lon);
    const lat = Number(point?.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    items.push(point);
    const k = key(Math.floor(lon / CELL), Math.floor(lat / CELL));
    const bucket = cells.get(k);
    if (bucket) bucket.push(point);
    else cells.set(k, [point]);
  }

  /**
   * Collect points from every cell the box touches.
   *
   * Cells are whole degrees, so a box's own edges are re-checked per point:
   * the grid narrows the candidates, the comparison decides. Without that
   * second test a query would return everything in the straddled cells, which
   * at globe zoom is nearly everything.
   *
   * @param {number} west @param {number} south @param {number} east @param {number} north
   * @param {Set<object>} into
   * @returns {void}
   */
  function collect(west, south, east, north, into) {
    const lon0 = Math.floor(west / CELL);
    const lon1 = Math.floor(east / CELL);
    const lat0 = Math.floor(south / CELL);
    const lat1 = Math.floor(north / CELL);
    for (let x = lon0; x <= lon1; x += 1) {
      for (let y = lat0; y <= lat1; y += 1) {
        const bucket = cells.get(key(x, y));
        if (!bucket) continue;
        for (const point of bucket) {
          if (point.lon >= west && point.lon <= east
            && point.lat >= south && point.lat <= north) into.add(point);
        }
      }
    }
  }

  return {
    /**
     * 已索引的点数。
     * @returns {number}
     */
    size() {
      return items.length;
    },

    /**
     * 占用的网格单元数，用于诊断。
     * @returns {number}
     */
    cells() {
      return cells.size;
    },

    /**
     * Points inside a geographic rectangle.
     *
     * @param {{west: number, south: number, east: number, north: number}} box
     * @returns {Array<object>} The original point objects.
     */
    search(box) {
      if (!box) return items.slice();
      const { west, south, east, north } = box;
      if (![west, south, east, north].every(Number.isFinite)) {
        return items.slice();
      }
      const minY = Math.min(south, north);
      const maxY = Math.max(south, north);

      // A view crossing the antimeridian has west > east. Queried as one
      // rectangle that matches nothing, and the layer silently empties exactly
      // where the Pacific is.
      const found = new Set();
      if (west > east) {
        collect(-180, minY, east, maxY, found);
        collect(west, minY, 180, maxY, found);
      } else {
        collect(west, minY, east, maxY, found);
      }
      return [...found];
    },

    /**
     * 全部点（未裁剪）。
     * @returns {Array<object>}
     */
    all() {
      return items.slice();
    },
  };
}

/**
 * The camera's view rectangle, in degrees, padded a little.
 *
 * Padding matters: culling exactly to the frustum makes markers pop in at the
 * screen edge as the camera turns, which looks worse than drawing a few
 * hundred extra points costs.
 *
 * Returns null when the view cannot be computed — looking at space, or a
 * horizon-spanning view where the rectangle is meaningless — and null means
 * "draw everything", which is the safe answer.
 *
 * @param {object} viewer - Cesium viewer.
 * @param {object} Cesium - The Cesium namespace.
 * @param {number} [padFraction]
 * @returns {{west: number, south: number, east: number, north: number}|null}
 */
export function cameraViewBox(viewer, Cesium, padFraction = 0.25) {
  const rect = viewer?.camera?.computeViewRectangle?.();
  if (!rect) return null;
  const west = Cesium.Math.toDegrees(rect.west);
  const east = Cesium.Math.toDegrees(rect.east);
  const south = Cesium.Math.toDegrees(rect.south);
  const north = Cesium.Math.toDegrees(rect.north);
  if (![west, east, south, north].every(Number.isFinite)) return null;

  const height = Math.abs(north - south);
  // A view covering most of the globe is not worth culling against — the
  // query would return nearly everything and cost more than it saves.
  if (height >= 140) return null;

  const padY = height * padFraction;
  const spanX = west > east ? (180 - west) + (east + 180) : east - west;
  const padX = spanX * padFraction;
  const wrap = (deg) => (((deg + 540) % 360) - 180);

  return {
    west: wrap(west - padX),
    east: wrap(east + padX),
    south: Math.max(-90, south - padY),
    north: Math.min(90, north + padY),
  };
}
