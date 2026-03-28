import { createStandardApp } from "@repo/core";
import { setupDirectives } from "./directives";
import { setupFullscreenSocket } from "./plugins/fullscreenSocket";
import { MonitorGlobalSocketPlugin } from "./plugins/globalSocket";

const bootDebugEnabled = (() => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return new URLSearchParams(window.location.search).has("__bootDebug");
  } catch {
    return false;
  }
})();

if (bootDebugEnabled) {
  console.info("[MonitorBootstrap] main:start");
}

const bootstrapPromise = createStandardApp({
  enableElementPlusX: true,
  socketPlugins: [MonitorGlobalSocketPlugin],
  socketSetup: setupFullscreenSocket,
  setup(app) {
    setupDirectives(app);
  },
});

if (bootDebugEnabled) {
  console.info("[MonitorBootstrap] main:createStandardApp-called");
  window.setTimeout(() => {
    console.info("[MonitorBootstrap] main:still-pending-after-5000ms");
  }, 5000);
}

bootstrapPromise
  .then((bootstrap) => {
    if (bootDebugEnabled) {
      console.info("[MonitorBootstrap] main:createStandardApp-resolved");
    }
    return bootstrap.mount("#app");
  })
  .then(() => {
    if (bootDebugEnabled) {
      console.info("[MonitorBootstrap] main:mount-resolved");
    }
  })
  .catch((error) => {
    console.error("[MonitorBootstrap] main:bootstrap-failed", error);
  });
