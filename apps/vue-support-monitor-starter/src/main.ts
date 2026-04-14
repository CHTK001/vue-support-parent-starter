import { createStandardApp } from "@repo/core";
import { setupDirectives } from "./directives";
import { setupFullscreenSocket } from "./plugins/fullscreenSocket";
import { MonitorGlobalSocketPlugin } from "./plugins/globalSocket";
import "./utils/sso";

createStandardApp({
  enableElementPlusX: true,
  socketPlugins: [MonitorGlobalSocketPlugin],
  socketSetup: setupFullscreenSocket,
  setup(app) {
    setupDirectives(app);
  },
})
  .then((bootstrap) => {
    return bootstrap.mount("#app");
  })
  .catch((error) => {
    console.error("[MonitorBootstrap] main:bootstrap-failed", error);
  });
