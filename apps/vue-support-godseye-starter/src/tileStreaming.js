/**
 * Photorealistic 3D Tiles streaming tuning.
 *
 * The tileset shipped on Cesium's defaults — not one streaming property was
 * set. Defaults are chosen to be safe on a phone over a slow connection, which
 * is the wrong trade for a flight simulator on a desktop: they make detail
 * arrive slowly and then throw it away again the moment the camera moves on.
 *
 * Nothing here changes maximumScreenSpaceError, which is the one knob that
 * costs money: it decides how many tiles exist at all, and lowering it
 * multiplies tile requests by roughly (16/mse)^2. Everything below changes how
 * the tiles you were already going to fetch are ORDERED, CACHED and SHOWN, so
 * the picture sharpens sooner and stays sharp, for the same number of requests.
 */

/**
 * Apply the streaming settings.
 *
 * @param {object} tileset - The Google photorealistic tileset.
 * @returns {object|null} The tileset, for chaining.
 */
export function tuneTileStreaming(tileset) {
  if (!tileset) return null;

  // SHOW A LEAF BEFORE ITS WHOLE ANCESTRY HAS ARRIVED.
  //
  // With this off — the default — a detailed tile cannot be displayed until
  // every coarser tile above it in the tree has downloaded, even though none of
  // them will end up on screen. Flying toward a city meant waiting through the
  // entire chain before the ground sharpened. On, the renderer shows the best
  // tile it actually has and swaps in better ones as they land.
  tileset.skipLevelOfDetail = true;
  // How far ahead it is allowed to skip. 16 is Cesium's own suggestion for
  // this mode and lets it jump several levels rather than one at a time.
  tileset.skipScreenSpaceErrorFactor = 16;
  tileset.skipLevels = 1;
  // Ask for the detailed tiles FIRST rather than filling in the coarse parents
  // that are about to be replaced anyway.
  tileset.immediatelyLoadDesiredLevelOfDetail = false;
  tileset.loadSiblings = false;

  // PRIORITISE BY WHAT THE EYE IS ON.
  //
  // Foveated ordering fetches what the camera is pointed at before the
  // periphery. In a cockpit view that is exactly the runway ahead.
  tileset.foveatedScreenSpaceError = true;
  tileset.foveatedConeSize = 0.2;
  tileset.foveatedMinimumScreenSpaceErrorRelaxation = 0;
  // Deferred periphery tiles still arrive; they just wait until the camera
  // stops moving, which is when there is bandwidth spare for them.
  tileset.foveatedTimeDelay = 0.2;

  // KEEP WHAT HAS BEEN PAID FOR.
  //
  // Every evicted tile is a tile that has to be requested again — and Google
  // Photorealistic 3D Tiles bills per request, so a small cache costs money as
  // well as time. Turning around mid-flight should not re-download the ground
  // that was on screen four seconds ago.
  tileset.cacheBytes = 512 * 1024 * 1024;
  tileset.maximumCacheOverflowBytes = 256 * 1024 * 1024;

  // DO NOT THROTTLE REQUESTS WHILE MOVING.
  //
  // Cesium culls requests during camera motion on the assumption that they will
  // be wasted. In a flight sim the camera is ALWAYS moving, so that assumption
  // inverts: the tiles ahead are precisely the ones needed, and suppressing
  // them is why the ground stayed soft for the whole flight. The multiplier is
  // raised rather than the feature disabled outright, so genuinely wild camera
  // slews are still filtered.
  tileset.cullRequestsWhileMoving = true;
  tileset.cullRequestsWhileMovingMultiplier = 60;

  // Nothing hidden should be spending bandwidth.
  tileset.preloadWhenHidden = false;
  // Preloading the flight destination IS worth it: it is where the camera is
  // going next, by definition.
  tileset.preloadFlightDestinations = true;

  // Progressive resolution draws a coarse pass over the whole view quickly
  // instead of leaving holes while detail streams in — the difference between
  // "blurry then sharp" and "missing then there".
  tileset.progressiveResolutionHeightFraction = 0.5;

  // Dynamic screen-space error coarsens tiles far from a near-ground camera.
  // That is right for a map looked at from straight above and wrong the moment
  // the horizon is in shot, which in a cockpit it always is.
  tileset.dynamicScreenSpaceError = false;

  return tileset;
}

/**
 * Release a tileset's memory when leaving photoreal mode.
 *
 * Hiding a tileset does not free a byte of it. Half a gigabyte of tiles for a
 * view nobody is looking at stays resident for the rest of the session.
 *
 * @param {object} tileset
 * @returns {void}
 */
export function trimTileCache(tileset) {
  if (!tileset) return;
  try {
    tileset.trimLoadedTiles?.();
  } catch {
    // Older builds may not expose it; the cache bound still applies.
  }
}
