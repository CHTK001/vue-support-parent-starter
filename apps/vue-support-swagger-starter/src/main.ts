import { createStandardApp } from "@repo/core";

createStandardApp({
  enableTippy: false,
}).then((bootstrap) => bootstrap.mount("#app"));
