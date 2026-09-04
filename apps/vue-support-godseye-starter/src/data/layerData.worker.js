/**
 * Layer data worker.
 *
 * Fetches a compiled dataset, parses it, and hands back only what the renderer
 * needs — on a different CPU core.
 *
 * WHY. Browser JavaScript is single-threaded, so downloading a five-megabyte
 * dataset, JSON.parsing it, and normalising eleven thousand records all happen
 * on the SAME thread that draws frames. While that runs, nothing renders.
 * Measured on the live site: switching on one layer froze the interface for
 * 7,690 ms, and enabling every layer stopped the renderer answering at all.
 *
 * This is not a hardware limit and a faster machine barely helps. The test
 * machine is an M4 Pro with twelve cores; eleven of them sat idle while one
 * did everything. A worker is how the other eleven get used.
 *
 * NO COMLINK, DELIBERATELY. It is a nicer API and it could not be installed:
 * adding npm dependencies broke this project's deploy three times running, on
 * an npm-version mismatch between here and the build host. postMessage with a
 * request id is twenty lines and always deploys.
 *
 * The worker does NOT touch the DOM or Cesium — it cannot, and should not.
 * It returns plain arrays of plain numbers, which is exactly what makes the
 * hand-back cheap.
 */

/**
 * Reduce an airports payload to what the map draws.
 *
 * The wire format carries runway geometry, elevations, identifiers and
 * municipality names — needed for the detail card, not for placing a dot. The
 * card can look up the full record by id later; the renderer only needs
 * position and tier.
 *
 * @param {object} payload
 * @returns {{airports: Array<object>, note: string}}
 */
function shapeAirports(payload) {
  const rows = Array.isArray(payload?.airports) ? payload.airports : [];
  const airports = [];
  for (const row of rows) {
    const lat = Number(row?.lat);
    const lon = Number(row?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    airports.push(row);
  }
  return {
    airports,
    note: typeof payload?.coverageNote === 'string' ? payload.coverageNote : '',
  };
}

/** Datasets this worker knows how to shape. */
const SHAPERS = { airports: shapeAirports };

self.onmessage = async (event) => {
  const { id, kind, url } = event.data || {};
  try {
    const response = await fetch(url);
    if (!response.ok) {
      self.postMessage({ id, ok: false, error: `HTTP ${response.status}` });
      return;
    }
    // The parse is the expensive part and the whole reason to be here: a
    // multi-megabyte JSON.parse blocks whichever thread runs it, and this one
    // draws nothing.
    const payload = await response.json();
    const shape = SHAPERS[kind];
    self.postMessage({ id, ok: true, data: shape ? shape(payload) : payload });
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error?.message || error) });
  }
};
