/**
 * Main-thread client for the layer data worker.
 *
 * Keeps one worker for every layer rather than one each: the work is bursty —
 * a layer loads once and then sits there — so a pool would mostly be idle
 * workers holding memory.
 *
 * Falls back to fetching on the main thread wherever Workers are unavailable.
 * That is the old, slow path, and it is still far better than a layer that
 * refuses to load.
 */

/** @type {Worker|null} */
let _worker = null;
/** @type {Map<number, {resolve: Function, reject: Function}>} */
const _pending = new Map();
let _nextId = 1;
let _unavailable = false;

/**
 * 获取或创建 Worker 实例。
 * @returns {Worker|null}
 */
function ensureWorker() {
  if (_worker || _unavailable) return _worker;
  try {
    _worker = new Worker(new URL('./layerData.worker.js', import.meta.url), { type: 'module' });
    _worker.onmessage = (event) => {
      const { id, ok, data, error } = event.data || {};
      const entry = _pending.get(id);
      if (!entry) return;
      _pending.delete(id);
      if (ok) entry.resolve(data);
      else entry.reject(new Error(error || 'worker failed'));
    };
    _worker.onerror = () => {
      // A worker that cannot start must not strand every caller waiting on it.
      for (const entry of _pending.values()) entry.reject(new Error('worker error'));
      _pending.clear();
      _unavailable = true;
      _worker = null;
    };
  } catch {
    _unavailable = true;
    _worker = null;
  }
  return _worker;
}

/**
 * Fetch and parse a dataset off the main thread.
 *
 * @param {string} kind Which shaper the worker should apply.
 * @param {string} url
 * @returns {Promise<object>}
 */
export async function loadLayerData(kind, url) {
  const worker = ensureWorker();
  if (!worker) {
    // No worker: do it here. Slower and blocking, but correct.
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  const id = _nextId;
  _nextId += 1;
  return new Promise((resolve, reject) => {
    _pending.set(id, { resolve, reject });
    worker.postMessage({ id, kind, url });
  });
}

/** Tests only. */
export function _resetLayerDataClientForTest() {
  _worker = null;
  _pending.clear();
  _unavailable = false;
  _nextId = 1;
}
