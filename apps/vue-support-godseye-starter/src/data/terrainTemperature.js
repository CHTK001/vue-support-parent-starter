import * as Cesium from 'cesium';

/**
 * Terrain-aware temperature imagery.
 *
 * THE PROBLEM THIS SOLVES. Air temperature can only be fetched for a few
 * hundred points a day on a free tier, and a few hundred points over a planet
 * is a grid so coarse that a single cell swallows an entire mountain range.
 * Painting that directly is what made the map look like flat blocks: whole
 * countries in one colour, a hard seam where the next cell began, and Denver
 * the same colour as the Gulf of Mexico.
 *
 * THE FIX IS NOT MORE POINTS. It is separating the two things that make up a
 * temperature: the large-scale weather pattern, which really is smooth over
 * hundreds of kilometres and which a coarse grid captures perfectly well, and
 * the local effect of altitude, which is not smooth at all but which follows a
 * known physical law and needs no API call whatsoever.
 *
 *   1. Reduce every coarse observation to sea level by adding back the
 *      temperature its own altitude cost it.
 *   2. Interpolate THAT field. Sea-level temperature genuinely is smooth, so
 *      interpolating it is honest rather than an artefact-generating guess.
 *   3. Subtract the altitude penalty again at full elevation resolution.
 *
 * The result has the detail of the elevation data — ridges, valleys, the edge
 * of a plateau — while every value still agrees with the measurements it came
 * from. It is the standard meteorological downscaling, and it is why a mountain
 * reads cold and the valley beside it reads warm on a proper weather map.
 *
 * ELEVATION SOURCE: AWS Terrain Tiles ("terrarium"), a public-domain global
 * dataset on the AWS Open Data registry. Keyless, CORS-open, no quota.
 * Elevation is packed into the colour channels of an ordinary PNG.
 */

/** Public-domain global elevation tiles. No key, no quota. */
const TERRARIUM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';

/**
 * Environmental lapse rate, °C per metre.
 *
 * 6.5 °C/km is the ICAO standard atmosphere value and the figure forecasters
 * use for exactly this correction. The true rate varies with humidity and
 * inversions, but no constant is going to capture that, and this one is right
 * within a degree or two for the overwhelming majority of the surface.
 */
export const LAPSE_C_PER_M = 0.0065;

/**
 * Deepest zoom to fetch elevation for.
 *
 * 9 is about 300 m per pixel at the equator — far finer than any temperature
 * signal we can honestly claim, and enough that individual valleys resolve.
 * Going deeper would multiply tile requests for detail the temperature field
 * cannot support.
 */
const MAX_LEVEL = 9;

const TILE_SIZE = 256;

/** Zoom for the coarse mosaic used to reduce observations to sea level. */
const COARSE_LEVEL = 2;
const COARSE_SIZE = TILE_SIZE * (2 ** COARSE_LEVEL);

/**
 * Decode a terrarium pixel to metres.
 *
 * The format packs elevation as a big-endian fixed-point number across the
 * three colour channels, offset so the minimum is zero.
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number} Metres above sea level.
 */
export function decodeTerrarium(r, g, b) {
  return (r * 256) + g + (b / 256) - 32768;
}

/**
 * Elevation used for the lapse correction, in metres.
 *
 * Clamped at zero on the low side. Terrarium carries bathymetry, so an
 * unclamped correction would "warm" the whole ocean by several degrees as the
 * sea floor drops away — the Mariana Trench would glow. Genuine below-sea-level
 * land (Death Valley, the Dead Sea) loses a fraction of a degree it should have
 * kept, which is a far smaller error than heating every ocean on Earth.
 *
 * @param {number} metres
 * @returns {number}
 */
export function lapseElevation(metres) {
  if (!Number.isFinite(metres)) return 0;
  return Math.min(9000, Math.max(0, metres));
}

/**
 * Load an image with CORS enabled so its pixels can be read back.
 *
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Elevation tile failed: ${url}`));
    image.src = url;
  });
}

/**
 * Read an image's pixels.
 *
 * @param {HTMLImageElement} image
 * @returns {Uint8ClampedArray}
 */
function pixelsOf(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || TILE_SIZE;
  canvas.height = image.naturalHeight || TILE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}

/** Web Mercator northing, normalised to 0..1. Latitude is clamped to the
 *  projection's limit, beyond which it is undefined. */
function mercatorY(latDeg) {
  const lat = Math.min(85.05112878, Math.max(-85.05112878, latDeg));
  const rad = (lat * Math.PI) / 180;
  return 0.5 - (Math.log(Math.tan(Math.PI / 4 + rad / 2)) / (2 * Math.PI));
}

/** Inverse of {@link mercatorY}: 0..1 northing back to degrees. */
function latFromMercatorY(yNorm) {
  const n = Math.PI * (1 - 2 * yNorm);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

/**
 * A low-zoom global elevation mosaic.
 *
 * Used only to work out how much altitude each coarse OBSERVATION carries, so
 * it can be reduced to sea level. Sixteen tiles at zoom 2 give a 1024x1024
 * grid — roughly 40 km per pixel, which is finer than the temperature grid it
 * corrects and costs sixteen requests once per session.
 */
export function createCoarseElevation() {
  /** @type {Float32Array|null} */
  let _grid = null;
  /** @type {Promise<void>|null} */
  let _loading = null;

  async function load() {
    const grid = new Float32Array(COARSE_SIZE * COARSE_SIZE);
    const span = 2 ** COARSE_LEVEL;
    const tiles = [];
    for (let ty = 0; ty < span; ty += 1) {
      for (let tx = 0; tx < span; tx += 1) tiles.push({ tx, ty });
    }
    await Promise.all(tiles.map(async ({ tx, ty }) => {
      try {
        const image = await loadImage(`${TERRARIUM_URL}/${COARSE_LEVEL}/${tx}/${ty}.png`);
        const px = pixelsOf(image);
        for (let y = 0; y < TILE_SIZE; y += 1) {
          for (let x = 0; x < TILE_SIZE; x += 1) {
            const src = ((y * TILE_SIZE) + x) * 4;
            const gx = (tx * TILE_SIZE) + x;
            const gy = (ty * TILE_SIZE) + y;
            grid[(gy * COARSE_SIZE) + gx] = decodeTerrarium(px[src], px[src + 1], px[src + 2]);
          }
        }
      } catch {
        // A missing tile leaves that region at sea level, which degrades the
        // correction there rather than failing the whole layer.
      }
    }));
    _grid = grid;
  }

  return {
    /**
     * 等待地形温度网格加载完成。
     * @returns {Promise<void>}
     */
    ready() {
      if (!_loading) _loading = load();
      return _loading;
    },

    /**
     * Elevation in metres at a coordinate, or 0 before the mosaic loads.
     *
     * @param {number} lat
     * @param {number} lon
     * @returns {number}
     */
    at(lat, lon) {
      if (!_grid) return 0;
      const xNorm = ((((lon + 180) % 360) + 360) % 360) / 360;
      const x = Math.min(COARSE_SIZE - 1, Math.max(0, Math.floor(xNorm * COARSE_SIZE)));
      const y = Math.min(COARSE_SIZE - 1, Math.max(0, Math.floor(mercatorY(lat) * COARSE_SIZE)));
      return _grid[(y * COARSE_SIZE) + x];
    },
  };
}

/**
 * Fill gaps in a lattice by growing known values into their neighbours.
 *
 * WHY THIS IS NEEDED. Points are fetched interlaced, so a sweep in progress
 * holds a globally-spread but SCATTERED set of cells rather than a filled
 * rectangle. The bilinear sampler needs all four corners of a cell, and with
 * scattered data almost no group of four is complete — so a partially loaded
 * grid rendered as nothing at all. The layer would sit there reading "100",
 * showing an empty map, until the sweep finished minutes later and every
 * corner suddenly existed.
 *
 * Repeatedly averaging each hole's known neighbours turns those scattered
 * samples into a complete, coarse field straight away, which then sharpens as
 * real values arrive and displace the interpolated ones. Longitude wraps;
 * latitude does not.
 *
 * Values are only ever grown from measurements. A hole with no known neighbour
 * anywhere stays a hole, so a grid that genuinely covers nothing renders
 * nothing rather than inventing a temperature.
 *
 * @param {Float32Array} values Mutated in place.
 * @param {number} cols
 * @param {number} rows
 * @returns {Float32Array} The same array.
 */
export function fillGridHoles(values, cols, rows) {
  // Bounded so a nearly-empty grid cannot spin: each pass grows the known
  // region by one cell, and the lattice is only tens of cells across.
  const MAX_PASSES = Math.max(cols, rows);
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let holes = 0;
    let filled = 0;
    // Read from a snapshot so values grown this pass do not cascade within it,
    // which would smear one measurement across a whole row in a single sweep.
    const source = Float32Array.from(values);
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const at = (j * cols) + i;
        if (Number.isFinite(source[at])) continue;
        holes += 1;
        let sum = 0;
        let n = 0;
        const consider = (jj, ii) => {
          if (jj < 0 || jj >= rows) return;
          const wrapped = ((ii % cols) + cols) % cols;
          const v = source[(jj * cols) + wrapped];
          if (Number.isFinite(v)) { sum += v; n += 1; }
        };
        consider(j, i - 1);
        consider(j, i + 1);
        consider(j - 1, i);
        consider(j + 1, i);
        if (n) { values[at] = sum / n; filled += 1; }
      }
    }
    if (!holes || !filled) break;
  }
  return values;
}

/**
 * Bilinear sample of a regular lat/lon field.
 *
 * @param {{minLat: number, minLon: number, step: number, cols: number,
 *          rows: number, values: Float32Array}|null} lookup
 * @param {number} lat
 * @param {number} lon
 * @returns {number|null} Value, or null where the field has no data.
 */
export function sampleBilinear(lookup, lat, lon) {
  if (!lookup) return null;
  const { minLat, minLon, step, cols, rows, values } = lookup;
  const x = (lon - minLon) / step;
  const y = (lat - minLat) / step;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  // Longitude wraps. Latitude does NOT: it clamps only within one cell of the
  // data's own edge, and returns nothing beyond that.
  //
  // Clamping unconditionally was a data-fabrication bug. A sweep that has only
  // reached the southern hemisphere covers, say, -85 to -10; an unconditional
  // clamp answers a query for Berlin with the value from the southernmost row
  // it happens to hold, so the map would confidently paint the whole northern
  // hemisphere in temperatures measured near Antarctica. Blank is the honest
  // answer for somewhere that has not been measured.
  if (y < -1 || y > rows) return null;
  const col = (i) => ((i % cols) + cols) % cols;
  const row = (j) => Math.min(rows - 1, Math.max(0, j));
  const at = (j, i) => values[(row(j) * cols) + col(i)];

  const v00 = at(y0, x0);
  const v10 = at(y0, x0 + 1);
  const v01 = at(y0 + 1, x0);
  const v11 = at(y0 + 1, x0 + 1);
  if (![v00, v10, v01, v11].every(Number.isFinite)) return null;

  const top = (v00 * (1 - fx)) + (v10 * fx);
  const bottom = (v01 * (1 - fx)) + (v11 * fx);
  return (top * (1 - fy)) + (bottom * fy);
}

/**
 * Build a colour lookup table across the temperature range.
 *
 * A table rather than a colour computed per pixel: a 256x256 tile is 65,536
 * pixels, and allocating a Cesium.Color for each one made tile generation slow
 * enough to stutter the globe. Interpolating 512 entries once and then indexing
 * turns that into an array read.
 *
 * @param {Function} colorFor Maps °C to a Cesium.Color.
 * @param {number} min
 * @param {number} max
 * @param {number} steps
 * @returns {{lut: Uint8ClampedArray, min: number, max: number, steps: number}}
 */
export function buildColorTable(colorFor, min = -50, max = 55, steps = 512) {
  const lut = new Uint8ClampedArray(steps * 3);
  for (let i = 0; i < steps; i += 1) {
    const t = min + ((max - min) * (i / (steps - 1)));
    const colour = colorFor(t, 1);
    lut[i * 3] = Math.round(colour.red * 255);
    lut[(i * 3) + 1] = Math.round(colour.green * 255);
    lut[(i * 3) + 2] = Math.round(colour.blue * 255);
  }
  return { lut, min, max, steps };
}

/**
 * An imagery provider that paints downscaled air temperature.
 *
 * @param {object} options
 * @param {Function} options.sampleSeaLevel Sea-level °C at (lat, lon), or null.
 * @param {object} options.colorTable From {@link buildColorTable}.
 * @param {number} options.alpha 0..1 tint strength.
 * @returns {object} A Cesium imagery provider.
 */
export function createTerrainTemperatureProvider({ sampleSeaLevel, colorTable, alpha }) {
  const tilingScheme = new Cesium.WebMercatorTilingScheme();
  const errorEvent = new Cesium.Event();

  /**
   * Decoded elevation for tiles already fetched, newest last.
   *
   * This exists so the cursor readout and the painted colour can never
   * disagree. Both read THIS cache, so the number under the pointer is derived
   * from exactly the same elevation sample as the pixel it is sitting on.
   * Reading the picked surface height instead would have been easier but wrong:
   * the pick lands on Google's photogrammetry, so clicking a skyscraper roof
   * would report the temperature 400 m up while the ground beside it stayed the
   * colour of the valley floor.
   *
   * Int16 rather than Float32 halves the footprint and still resolves a metre,
   * which is far finer than a lapse correction can use.
   *
   * @type {Map<string, Int16Array>}
   */
  const elevationCache = new Map();
  /** Roughly 15 MB at 128 kB per tile. */
  const ELEVATION_CACHE_MAX = 120;

  /**
   * 缓存高程网格，并超出上限时淘汰最旧条目。
   * @param {string} key
   * @param {Int16Array} grid
   */
  function cacheElevation(key, grid) {
    elevationCache.set(key, grid);
    while (elevationCache.size > ELEVATION_CACHE_MAX) {
      const oldest = elevationCache.keys().next().value;
      elevationCache.delete(oldest);
    }
  }
  const alphaByte = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  const { lut, min, max, steps } = colorTable;
  const scale = (steps - 1) / (max - min);

  return {
    get tilingScheme() { return tilingScheme; },
    get rectangle() { return tilingScheme.rectangle; },
    get tileWidth() { return TILE_SIZE; },
    get tileHeight() { return TILE_SIZE; },
    get maximumLevel() { return MAX_LEVEL; },
    get minimumLevel() { return 0; },
    get tileDiscardPolicy() { return undefined; },
    get errorEvent() { return errorEvent; },
    get credit() {
      return new Cesium.Credit(
        'Temperature Open-Meteo · Elevation AWS Terrain Tiles', false
      );
    },
    get proxy() { return undefined; },
    get hasAlphaChannel() { return true; },
    get ready() { return true; },
    get readyPromise() { return Promise.resolve(true); },

    getTileCredits() { return []; },
    pickFeatures() { return undefined; },

    /**
     * Elevation in metres from the deepest cached tile covering a point.
     *
     * Synchronous by design — it is called on every mouse move. Tiles for
     * whatever is on screen have already been fetched to draw it, so in
     * practice this hits. Returns null when it does not, and the caller falls
     * back rather than blocking on a network request.
     *
     * @param {number} lat
     * @param {number} lon
     * @returns {number|null}
     */
    elevationAt(lat, lon) {
      const xNorm = ((((lon + 180) % 360) + 360) % 360) / 360;
      const yNorm = mercatorY(lat);
      for (let level = MAX_LEVEL; level >= 0; level -= 1) {
        const tiles = 2 ** level;
        const tx = Math.min(tiles - 1, Math.floor(xNorm * tiles));
        const ty = Math.min(tiles - 1, Math.floor(yNorm * tiles));
        const grid = elevationCache.get(`${level}/${tx}/${ty}`);
        if (!grid) continue;
        const px = Math.min(TILE_SIZE - 1, Math.floor(((xNorm * tiles) - tx) * TILE_SIZE));
        const py = Math.min(TILE_SIZE - 1, Math.floor(((yNorm * tiles) - ty) * TILE_SIZE));
        return grid[(py * TILE_SIZE) + px];
      }
      return null;
    },

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} level
     * @returns {Promise<HTMLCanvasElement|undefined>}
     */
    async requestImage(x, y, level) {
      const key = `${level}/${x}/${y}`;
      /** @type {Int16Array|null} */
      let elevation = elevationCache.get(key) || null;
      if (!elevation) {
        try {
          const image = await loadImage(`${TERRARIUM_URL}/${level}/${x}/${y}.png`);
          const px = pixelsOf(image);
          const grid = new Int16Array(TILE_SIZE * TILE_SIZE);
          for (let i = 0, p = 0; i < grid.length; i += 1, p += 4) {
            grid[i] = Math.round(decodeTerrarium(px[p], px[p + 1], px[p + 2]));
          }
          cacheElevation(key, grid);
          elevation = grid;
        } catch {
          // No elevation for this tile: fall back to the undownscaled field
          // rather than punching a hole in the map.
          elevation = null;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext('2d');
      const out = ctx.createImageData(TILE_SIZE, TILE_SIZE);
      const data = out.data;

      // Tile bounds in normalised Web Mercator space.
      const tiles = 2 ** level;
      const x0 = x / tiles;
      const y0 = y / tiles;
      const span = 1 / tiles;

      for (let py = 0; py < TILE_SIZE; py += 1) {
        const lat = latFromMercatorY(y0 + (span * ((py + 0.5) / TILE_SIZE)));
        for (let px = 0; px < TILE_SIZE; px += 1) {
          const lon = -180 + (360 * (x0 + (span * ((px + 0.5) / TILE_SIZE))));
          const i = ((py * TILE_SIZE) + px) * 4;

          const seaLevel = sampleSeaLevel(lat, lon);
          if (seaLevel === null || !Number.isFinite(seaLevel)) {
            data[i + 3] = 0;
            continue;
          }

          const metres = elevation ? elevation[(py * TILE_SIZE) + px] : 0;
          const celsius = seaLevel - (LAPSE_C_PER_M * lapseElevation(metres));

          const slot = Math.min(steps - 1, Math.max(0, Math.round((celsius - min) * scale)));
          const base = slot * 3;
          data[i] = lut[base];
          data[i + 1] = lut[base + 1];
          data[i + 2] = lut[base + 2];
          data[i + 3] = alphaByte;
        }
      }

      ctx.putImageData(out, 0, 0);
      return canvas;
    },
  };
}
