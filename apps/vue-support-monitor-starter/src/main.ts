import { createStandardApp } from "@repo/core";
import { setupDirectives } from "./directives";

createStandardApp({
  enableElementPlusX: true,
  enableGlobalSocketPlugin: true,
  enableFullscreenSocket: true,
  setup(app) {
    setupDirectives(app);
  },
}).then((bootstrap) => bootstrap.mount("#app"));
