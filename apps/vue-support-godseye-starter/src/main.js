import * as Cesium from 'cesium';
import {
  applyAntialiasing,
  loadRenderQuality,
  setNativeResolution,
  setRenderQuality,
  applyRenderQuality as applySceneQuality,
} from './renderQuality.js';
import airportsLayer from './data/airports.js';
import { tuneTileStreaming } from './tileStreaming.js';
import { StyleManager } from './ui.js';
import { flyToAustin } from './camera.js';
import { DataLayerManager } from './data/manager.js';
import flightsLayer from './data/flights.js';
import militaryFlightsLayer from './data/militaryFlights.js';
import earthquakesLayer from './data/earthquakes.js';
import shootingsLayer from './data/shootings.js';
import safetyLayer from './data/safety.js';
import temperatureLayer from './data/temperature.js';
import satellitesLayer from './data/satellites.js';
import rocketLaunchesLayer from './data/rocketLaunches.js';
import trafficLayer from './data/traffic.js';
import cctvLayer from './data/cctv.js';
import radioLayer from './data/radio.js';
import bikeshareLayer from './data/bikeshare.js';
import mapLabelsLayer from './data/mapLabels.js';
import { createFlightSimController } from './flightSim/flightSimController.js';
import { createFlightSimPanel } from './flightSim/flightSimPanel.js';
import aisLiveVesselsLayer from './data/aisLiveVessels.js';
import militaryInstallationsLayer from './data/militaryInstallations.js';
import militaryAwarenessLayer from './data/militaryAwareness.js';
import localDataLayers from './data/localLayers.js';
import { LAYER_STATE_REGISTRY } from './data/layerState.js';
import { registerDataCredits } from './data/dataCredits.js';
import { SceneDirector } from './scenes/director.js';
import { initGevVoiceCommands } from './voice/gevRealtime.js';
import { initFreeVoice, shouldUseFreeVoice } from './voice/freeVoice.js';
import { MapStackController } from './mapStackController.js';
import { initAnnotations } from './annotations/index.js';
import { initLogoGaze } from './logoGaze.js';
import { initCockpitCloudEffects } from './cockpitCloudEffects.js';
import {
  installRenderGovernor,
  getRenderGovernorDiagnostics,
  governorRequestRender,
  holdContinuousRender,
  releaseContinuousRender,
} from './renderGovernor.js';
import { installScopeMask } from './scopeMask.js';
import { initFirstRunExperience } from './firstRunExperience.js';

initLogoGaze();

/**
 * Extract a human-readable error message from any thrown value.
 * Handles Error objects, strings, and plain objects with message/error fields.
 * @param {*} error — caught exception value
 * @returns {string} best-effort error description
 */
function describeError(error) {
  if (!error) return 'Unknown initialization error';
  if (error instanceof Error) {
    if (error.message && error.message.trim()) return error.message.trim();
    return error.name || 'Initialization error';
  }
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (typeof error === 'object') {
    const maybeMessage = String(error.message || error.error || '').trim();
    if (maybeMessage) return maybeMessage;
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') return serialized;
    } catch {
      // ignore serialization error
    }
  }
  return String(error);
}

/**
 * GOD'S EYE VIEW — Main Entry Point
 * Initializes CesiumJS with Google Photorealistic 3D Tiles,
 * style system, intelligence HUD, location presets, and share links.
 */
async function init() {
  const loadingScreen = document.getElementById('loading-screen');
  const loaderStatus = loadingScreen.querySelector('.loader-status');

  try {
    loaderStatus.textContent = 'Configuring viewer...';

    // Set Cesium Ion token for World Terrain
    const cesiumToken = import.meta.env.CESIUM_ION_TOKEN;
    if (cesiumToken) {
      Cesium.Ion.defaultAccessToken = cesiumToken;
    }

    // Set Google Maps API key for 3D Tiles
    const googleApiKey = import.meta.env.GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not found. Set it as an environment variable.');
    }
    Cesium.GoogleMaps.defaultApiKey = googleApiKey;

    // Expose API key globally for geocoding in locations.js
    window.__GOOGLE_MAPS_API_KEY__ = googleApiKey;

    // Create the Cesium viewer with minimal chrome
    const cesiumContainer = document.getElementById('cesiumContainer');
    const viewer = new Cesium.Viewer('cesiumContainer', {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      vrButton: false,
      selectionIndicator: false,
      infoBox: false,
      baseLayer: false,
      // Visible attribution container — Google Maps / 3D Tiles credits are
      // required by Google's Terms of Service, so they must be shown (styled
      // subtly via #cesium-credits). The credit line stays visible in
      // clean-view AND recording modes too (ToS requires attribution while the
      // content is displayed — those are the exact modes used to record
      // demos), including the "Data attribution" link that opens the per-layer
      // license popover.
      creditContainer: (() => {
        const el = document.createElement('div');
        el.id = 'cesium-credits';
        document.body.appendChild(el);
        return el;
      })(),
      msaaSamples: 4,
      contextOptions: {
        webgl: {
          preserveDrawingBuffer: true,
        },
      },
    });

    // NO targetFrameRate. It used to be pinned to 60, which was wrong in a way
    // that hid itself.
    //
    // Cesium's loop compares the frame delta against 1000/targetFrameRate and
    // renders only when the delta EXCEEDS it. On a 120 Hz panel rAF fires every
    // 8.33 ms, so that passes on alternate ticks and the display is pinned to
    // exactly half its rate. On a 60 Hz panel the deltas sit right on the
    // 16.667 ms boundary and occasionally land a hair under, skipping a vsync
    // and making the next delta ~33 ms — periodic judder that a quality
    // governor reads as GPU overload and answers by lowering quality.
    //
    // Worse, the throttle sat between the vsync clock and every timing sample
    // taken anywhere in the app, so the governor was measuring the throttle
    // rather than the scene. Frame pacing belongs to the render governor, which
    // paces deliberately and measures real work.

    // Native resolution. The globe rendered at 1x while the HUD drew at 2x, so
    // the decoration was sharp and the content was soft.
    //
    // Costs no extra tiles: screen-space error divides out pixelRatio against a
    // drawingBufferHeight that already contains it, so tile selection, request
    // count, memory and traversal are unchanged. Purely more fragments —
    // crisper silhouettes, vectors and text, not more photographic detail.
    // GUARD AGAINST A ZERO-SIZED CANVAS.
    //
    // Seen once in the wild: the canvas was constructed 0x0 while its container
    // measured 1280x720, and stayed 0x0 for the whole session — a black globe
    // that never painted. The likely cause is the Viewer being built while the
    // container has no layout size yet, behind the first-run cover, so Cesium
    // reads zero and never re-checks on its own.
    //
    // Observing the container costs nothing and fixes it whenever it happens,
    // including on window resizes and display changes.
    if (cesiumContainer && typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(() => {
        try { viewer.resize(); } catch { /* viewer torn down */ }
      });
      observer.observe(cesiumContainer);
    }
    // Belt and braces: if the canvas is still zero after the first frame, say so
    // rather than presenting a black screen with no explanation.
    viewer.scene.postRender.addEventListener(function firstPaintCheck() {
      viewer.scene.postRender.removeEventListener(firstPaintCheck);
      if (viewer.scene.canvas.width === 0 || viewer.scene.canvas.height === 0) {
        console.warn('[Init] Cesium canvas measured 0x0 after first paint; forcing a resize.');
        try { viewer.resize(); } catch { /* nothing more to try */ }
      }
    });

    setNativeResolution(viewer);

    // Antialiasing: exactly ONE. The app shipped 4x MSAA and FXAA together —
    // two antialiasers doing the same job, with FXAA additionally pinning the
    // whole post-process framebuffer chain. At native retina, downsampling from
    // a 2x buffer IS antialiasing, and MSAA on top measured a 2x frame cost.
    applyAntialiasing(viewer);

    // Register per-layer data attribution into the "Data attribution" popover.
    // Required by each source's license (ODbL, CC BY-NC-SA, NASA FIRMS, etc.);
    // strings are verbatim from DATA_SOURCES.md. Static + always-present in the
    // expandable bottom-left credit lightbox (showOnScreen=false), so they never
    // clutter the on-globe attribution line.
    registerDataCredits(viewer);

    // Hide Cesium's default globe — Google Photorealistic 3D Tiles provide their own
    // globe at all LODs (street level → orbital). The default globe's 2D imagery
    // clips through 3D tile buildings at close range.
    viewer.scene.globe.show = false;

    // Keep a sky behind Google 3D Tiles, but soften Cesium's high-intensity
    // default atmosphere. With the globe hidden its bright limb otherwise
    // reads as a hard cyan seam where distant photoreal tiles meet the sky.
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.skyAtmosphere.atmosphereLightIntensity = 18;
    viewer.scene.skyAtmosphere.saturationShift = -0.12;
    viewer.scene.skyAtmosphere.brightnessShift = -0.08;

    loaderStatus.textContent = 'Loading Google 3D Tiles...';
    let tileset = null;
    try {
      // Load Google Photorealistic 3D Tiles
      tileset = await Cesium.createGooglePhotorealistic3DTileset({
        onlyUsingWithGoogleGeocoder: true,
      });
      tuneTileStreaming(tileset);
      viewer.scene.primitives.add(tileset);
      // NOTE: Cesium World Terrain intentionally disabled — conflicts with Google 3D Tiles at high zoom.
      // Google Photorealistic 3D Tiles provide their own terrain/elevation.
      viewer.scene.globe.show = false;
    } catch (tileError) {
      console.warn('[Init] Google 3D Tiles unavailable, falling back to Cesium globe:', tileError);
      const tileErrorDetail = describeError(tileError);
      loaderStatus.textContent = `Google 3D Tiles unavailable (${tileErrorDetail}). Continuing in fallback mode...`;
      // Keep Cesium globe visible as fallback instead of aborting the app.
      viewer.scene.globe.show = true;
    }

    loaderStatus.textContent = 'Initializing systems...';

    const mapStackController = new MapStackController(viewer, {
      googleTileset: tileset,
      cesiumToken,
      initialStack: tileset ? 'photoreal' : 'osm',
      // Task 5 (height-datum fix): rebroadcast stack changes as a window
      // CustomEvent so data layers (CCTV per-regime ground resolution) can
      // react without coupling MapStackController to layer modules. Fires on
      // 'switching'/'ready'/'error'; listeners derive the surface regime from
      // live scene state, so intermediate emissions are harmless.
      onChange: (state) => {
        window.dispatchEvent(new CustomEvent('gev:map-stack-changed', { detail: state }));
      },
      onError: (message) => console.warn('[MapStack]', message),
    });
    await mapStackController.setStack(tileset ? 'photoreal' : 'osm', { silent: true });

    // Initialize the style manager (post-processing, HUD, locations, share links)
    const styleManager = new StyleManager(viewer, { mapStackController });
    // The previous multi-canvas weather compositor remains disabled. Cockpit
    // clouds use a separate, capped low-resolution GPU pass that never attaches
    // Cesium fog or post-process stages and is fully stopped in map mode.
    const weatherEffects = null;
    const cockpitCloudEffects = initCockpitCloudEffects(viewer);

    // If no share link state, do default fly-to Austin
    if (!styleManager.hasShareState) {
      loaderStatus.textContent = 'Flying to Austin, TX...';
      flyToAustin(viewer);
    } else {
      loaderStatus.textContent = 'Restoring shared view...';
    }

    // Initialize data layer manager
    const dataManager = new DataLayerManager(viewer, {
      allowQaRegistration: import.meta.env.DEV,
    });
    dataManager.register(flightsLayer);
    dataManager.register(militaryFlightsLayer);
    dataManager.register(earthquakesLayer);
    dataManager.register(airportsLayer);
    dataManager.register(shootingsLayer);
    dataManager.register(safetyLayer);
    dataManager.register(temperatureLayer);
    dataManager.register(satellitesLayer);
    dataManager.register(rocketLaunchesLayer);
    rocketLaunchesLayer.attachDataManager(dataManager);
    dataManager.register(trafficLayer);
    dataManager.register(cctvLayer);
    dataManager.register(radioLayer);
    dataManager.register(bikeshareLayer);
    dataManager.register(mapLabelsLayer);
    // Labels drape onto the photoreal tileset when there is one; a keyless
    // stack passes null and falls back to globe-draped labels.
    mapLabelsLayer.attachTileset(tileset);
    dataManager.register(aisLiveVesselsLayer);
    dataManager.register(militaryInstallationsLayer);
    dataManager.register(militaryAwarenessLayer);
    militaryAwarenessLayer.attachDataManager(dataManager);
    for (const layer of localDataLayers) {
      dataManager.register(layer);
    }
    // Restoration starts only after the complete production registry is sealed.
    dataManager.finalizeRegistrations(LAYER_STATE_REGISTRY);
    if (import.meta.env.DEV) {
      window.__gevQaRegisterLayer = (targetManager, layerModule) => {
        if (targetManager !== dataManager) throw new Error('QA layer manager mismatch');
        return dataManager.registerForQa(layerModule);
      };
      window.__gevQaUnregisterLayer = (targetManager, layerId) => {
        if (targetManager !== dataManager) throw new Error('QA layer manager mismatch');
        return dataManager.unregisterForQa(layerId);
      };
    }
    dataManager.buildTogglePanel(document.getElementById('data-toggles'));
    styleManager.attachDataManager(dataManager);

    // Initialize deterministic scene playback for social clip capture
    const sceneDirector = new SceneDirector(viewer, styleManager, dataManager);

    // Initialize the voice "whiteboard" annotation engine (world-space renderer)
    const annotations = initAnnotations({ viewer, tileset });

    // Flight Sim — a self-contained simulator mode. It owns the camera and the
    // render loop only while ACTIVE, and hands both back on exit. Camera
    // ownership is claimed through styleManager so it can never fight Cockpit:
    // claimCamera returning false is what refuses entry while Cockpit is up.
    const flightSim = createFlightSimController({
      viewer,
      hooks: {
        claimCamera: () => styleManager.runImmediateNavigation?.('flight sim', () => true) !== false,
        releaseCamera: () => { viewer.trackedEntity = undefined; },
        snapshotState: () => {
          // Captures what the mode is about to take over, and takes it over.
          //
          // CCTV is suspended for the duration. Its enable-time queue walks
          // EVERY camera in the catalog — thousands of them — sampling terrain
          // to place each viewshed on the ground ("LOADING FRAMES 356/3000").
          // That work competes directly with the photoreal tiles the aircraft
          // is flying over, for bandwidth and for the same terrain sampler, so
          // it both slows the world in and costs frames mid-flight. Ground
          // cameras are also of no use whatsoever from the cockpit of a 747.
          //
          // Live flights are deliberately LEFT ON: other aircraft in the sky
          // are worth seeing while flying, and that layer is orders of
          // magnitude smaller.
          const cctvWasEnabled = dataManager.isEnabled?.('cctv') === true;
          if (cctvWasEnabled) {
            dataManager.setEnabled('cctv', false, { origin: 'programmatic' });
          }
          return { camera: styleManager.getCameraState?.(), cctvWasEnabled };
        },
        restoreState: (snapshot) => {
          // Put the user back where they were, rather than wherever the
          // aircraft happened to be when they exited.
          if (snapshot?.camera) styleManager.applyCameraState?.(snapshot.camera);
          // Only re-enable what we ourselves switched off.
          if (snapshot?.cctvWasEnabled) {
            dataManager.setEnabled('cctv', true, { origin: 'programmatic' });
          }
        },
        onStateChange: (next) => {
          if (next === 'OFF') flightSimPanel.close();
          // The crash screen is driven purely by state, so any route into or
          // out of LOST — crash, revive, restart, exit — shows and hides it
          // without each of those paths having to remember to.
          updateFlightSimLostScreen(next);
        },
      },
    });
    const flightSimPanel = createFlightSimPanel({ viewer, controller: flightSim });
    // ── Render quality ──────────────────────────────────────────────────
    // Captured BEFORE anything changes them, so 'Auto' can put the scene back
    // to whatever the app actually shipped rather than numbers guessed here.
    const qualityDefaults = {
      resolutionScale: viewer.resolutionScale,
      tileError: tileset?.maximumScreenSpaceError,
      dynamicScreenSpaceError: tileset?.dynamicScreenSpaceError,
    };
    const qualitySelect = document.getElementById('render-quality-select');
    const initialQuality = loadRenderQuality();
    if (qualitySelect) qualitySelect.value = initialQuality;
    applySceneQuality({ viewer, tileset, id: initialQuality, defaults: qualityDefaults });
    qualitySelect?.addEventListener('change', () => {
      const id = setRenderQuality(qualitySelect.value);
      applySceneQuality({ viewer, tileset, id, defaults: qualityDefaults });
      governorRequestRender('render-quality');
    });

    const lostScreen = document.getElementById('flightsim-lost');

    /**
     * Show or hide the crash screen for a Flight Sim state.
     *
     * @param {string} next - The state just entered.
     * @returns {void}
     */
    function updateFlightSimLostScreen(next) {
      if (!lostScreen) return;
      if (next !== 'LOST') {
        lostScreen.hidden = true;
        return;
      }
      const reasonEl = lostScreen.querySelector('[data-fs-lost="reason"]');
      if (reasonEl) {
        reasonEl.textContent = flightSim.getFlight()?.lostReason || 'TERRAIN IMPACT';
      }
      lostScreen.hidden = false;
      // Focus the cheapest way back into the air, so Enter just works.
      lostScreen.querySelector('[data-fs-lost="revive"]')?.focus();
    }

    lostScreen?.addEventListener('click', (event) => {
      const action = event.target.closest('[data-fs-lost]')?.dataset.fsLost;
      if (!action || action === 'reason') return;
      if (action === 'revive') {
        flightSim.revive();
      } else if (action === 'restart') {
        flightSim.restart();
      } else if (action === 'menu') {
        flightSim.exit();
        flightSim.openPlanner();
        flightSimPanel.open();
      }
    });

    // Two entry points, one handler: the CONTEXT panel beside COCKPIT (the two
    // flying modes belong together) and the DATA LAYERS panel, which is where
    // people actually go looking for things to turn on. Sharing the callback
    // keeps them from drifting apart as the open sequence changes.
    const openFlightSim = () => {
      flightSim.openPlanner();
      flightSimPanel.open();
    };
    for (const id of ['flightsim-entry', 'flightsim-entry-layers']) {
      document.getElementById(id)?.addEventListener('click', openFlightSim);
    }
    document.getElementById('flightsim-hud')
      ?.querySelector('[data-fs="exit"]')
      ?.addEventListener('click', () => flightSim.exit());
    // The HUD's QUALITY cell cycles the same global setting the DISPLAY panel
    // holds, so the two can never disagree.
    document.getElementById('flightsim-hud')
      ?.querySelector('[data-fs="quality-btn"]')
      ?.addEventListener('click', () => {
        const next = flightSim.cycleQuality();
        if (qualitySelect) qualitySelect.value = next;
      });
    document.getElementById('flightsim-hud')
      ?.querySelector('[data-fs="ap"]')
      ?.addEventListener('click', () => flightSim.toggleAutopilot());


    // Keep startup chrome truthful: a share is not restored until camera,
    // visual/map/panel lanes, and every requested layer have terminated.
    // No artificial floor. This used to race the restore against an
    // unconditional one-second timer, so the loading screen could not begin to
    // hide before a full second had passed however fast everything else was.
    // With an 0.8 s fade and a 0.9 s fallback stacked behind it, that was at
    // least 1.8 s of pure wall clock added to an already 4-7 s first paint —
    // time spent looking at a cover for no reason. The restore promise alone is
    // the honest signal that the app is ready to be seen.
    void Promise.resolve(styleManager.initialRestorePromise).finally(() => {
      loadingScreen.classList.add('hidden');
      // Reveal only after the loading cover has yielded. transitionend can be
      // absent under reduced motion, so a bounded fallback makes this reliable.
      let firstRunRevealed = false;
      const revealFirstRun = () => {
        if (firstRunRevealed) return;
        firstRunRevealed = true;
        // dataManager is passed explicitly: the globe missions enable bundled
        // keyless layers through it, and reaching for styleManager._dataManager
        // would make a private field part of this feature's contract.
        initFirstRunExperience({ styleManager, dataManager });
      };
      loadingScreen.addEventListener('transitionend', revealFirstRun, { once: true });
      // Fallback for when transitionend never fires (reduced motion). Kept
      // just past the 250 ms fade rather than the old 900 ms, which was
      // itself most of a second of dead time on the startup path.
      setTimeout(revealFirstRun, 320);
    });

    // Expose for debugging
    // Idle render governor: flips the scene into requestRenderMode whenever
    // nothing animates per frame. Installed AFTER every module above has had
    // its chance to register pre-install holds. (perf wave 2)
    installRenderGovernor(viewer);

    // The explicit scope mask replaces the emergent six-pass artifact —
    // see src/scopeMask.js. Installed before the UI so the DISPLAY-rail
    // toggle finds it live.
    installScopeMask(viewer);

    // The follow camera recomputes the tracked target's dead-reckon position
    // every frame — tracking anything is a per-frame animation. (perf wave 2)
    viewer.trackedEntityChanged.addEventListener(() => {
      if (viewer.trackedEntity) holdContinuousRender('tracked-entity');
      else releaseContinuousRender('tracked-entity');
    });

    // Hidden-state suspension (perf wave 2): when the window/tab is hidden,
    // stop the default render loop outright — a hidden canvas repaints for
    // nobody, and browser rAF throttling still lets throttled frames burn
    // GPU. Holder/data state is untouched, so return is seamless: restore
    // the loop, refresh the one DOM surface we gated, render a frame.
    const syncVisibilitySuspension = () => {
      const hidden = document.hidden;
      viewer.useDefaultRenderLoop = !hidden;
      cockpitCloudEffects?.setSuspended?.(hidden);
      if (!hidden) {
        if (dataManager._panelRefreshPendingOnVisible) {
          dataManager._panelRefreshPendingOnVisible = false;
          dataManager._refreshTogglePanel();
        }
        governorRequestRender('visibility-restore');
      }
    };
    document.addEventListener('visibilitychange', syncVisibilitySuspension);
    // Apply the CURRENT state too — bootstrap can complete while the tab is
    // already hidden, and waiting for the next transition would leave the
    // loop burning behind a hidden tab. (perf wave 2 fix)
    syncVisibilitySuspension();

    window.__godsEyeView = {
      viewer,
      styleManager,
      tileset,
      dataManager,
      sceneDirector,
      mapStackController,
      annotations,
      weatherEffects,
      cockpitCloudEffects,
      getRenderGovernorDiagnostics,
      requestRender: governorRequestRender,
      flightSim,
      openFlightSim: () => { flightSim.openPlanner(); flightSimPanel.open(); },
    };
    window.__godsEyeView.voiceCommands = initGevVoiceCommands({ viewer, styleManager, dataManager, sceneDirector, annotations });

    // Free voice: browser speech in and out, intent parsed by a free-tier
    // model. Stands alongside the OpenAI Realtime path rather than replacing
    // it — that one needs OPENAI_API_KEY and is billed per token, this one
    // needs neither. Exposed for the UI and for programmatic commands.
    const freeVoice = initFreeVoice({
      viewer, styleManager, dataManager, sceneDirector, annotations,
    });
    window.__godsEyeView.freeVoice = freeVoice;

    // The MIC button drives whichever voice path is actually available.
    // OPENAI_API_KEY may be unset — it is by default — and in that case the
    // Realtime path cannot connect at all, so the button would do nothing.
    // Rebinding it to free voice means one control that always works rather
    // than a button whose behaviour depends on a key the user cannot see.
    void (async () => {
      try {
        const status = await fetch('/api/openrouter/status')
          .then((r) => r.json())
          .catch(() => null);
        const realtimeReady = await fetch('/api/realtime/token', { method: 'POST' })
          .then((r) => r.ok)
          .catch(() => false);

        // NOT gated on the OpenRouter key. It was, and that was the bug behind
        // "Realtime connection: OPENAI_API_KEY is not set" on the deployed
        // site: the key lives in a gitignored .env and is absent in
        // production, so this returned early, the mic stayed bound to the
        // Realtime path, and clicking it reported a missing OpenAI key the
        // user had no way to supply. The free path's local matcher needs
        // neither key, so the only real requirements are that Realtime is
        // unavailable and the browser can do speech.
        if (!shouldUseFreeVoice({ realtimeReady, speechSupported: freeVoice.isSupported() })) return;
        freeVoice.setAiAvailable(status?.configured === true);

        // #gev-voice-button by id, NOT the first button in the container. The
        // container's first button is #gev-voice-tier — the STD/mini cost
        // chip — so a positional selector rebound the wrong control and left
        // the mic still wired to the Realtime path, which then reported
        // "OPENAI_API_KEY is not set" on click.
        const button = document.getElementById('gev-voice-button');
        if (!button) return;
        // Replacing the node drops the Realtime listener with it, so the two
        // paths can never both fire on one click.
        const fresh = button.cloneNode(true);
        button.replaceWith(fresh);
        const label = document.getElementById('gev-voice-status');

        // Space-to-talk belongs to the Realtime controller and would start a
        // connection that cannot succeed. Suppress it while free voice owns
        // the microphone.
        const swallowSpace = (event) => {
          if (event.code === 'Space' && !/^(INPUT|TEXTAREA)$/.test(event.target?.tagName || '')) {
            event.stopImmediatePropagation();
          }
        };
        window.addEventListener('keydown', swallowSpace, true);
        window.addEventListener('keyup', swallowSpace, true);
        // The Realtime path's own error banner is meaningless here.
        document.getElementById('gev-voice-error')?.remove();
        const root = document.getElementById('gev-voice-control');
        // ...and so is its verdict on the microphone. The Realtime controller
        // writes "VOICE UNAVAILABLE" when it cannot reach its own service,
        // which is exactly the case in which free voice takes over — so
        // leaving it would label a working microphone as broken. Clear the
        // error state before the user ever looks at it.
        if (root) {
          root.dataset.status = 'idle';
          delete root.dataset.error;
        }
        if (label) label.textContent = 'READY';
        freeVoice.onStateChange((state, text) => {
          // The container styles itself from data-status, so keeping it in
          // step is what makes the button look active while listening.
          if (root) root.dataset.status = state === 'listening' ? 'listening' : 'idle';
          if (!label) return;
          const copy = {
            listening: text ? `“${text}”` : 'LISTENING',
            heard: `“${text}”`,
            thinking: 'THINKING',
            done: text || 'DONE',
            error: text || 'ERROR',
            idle: 'OFF',
          };
          label.textContent = String(copy[state] || 'OFF').toUpperCase().slice(0, 42);
        });
        fresh.addEventListener('click', () => {
          if (freeVoice.isListening()) freeVoice.stop();
          else freeVoice.start();
        });
        console.info('[Voice] Free voice active (no OpenAI key present).');
      } catch (error) {
        console.warn('[Voice] free-voice wiring skipped:', error?.message || error);
      }
    })();

  } catch (error) {
    console.error("God's Eye View initialization failed:", error);
    loaderStatus.textContent = `Error: ${describeError(error)}`;
    loaderStatus.style.color = '#ff4444';
  }
}

init();
