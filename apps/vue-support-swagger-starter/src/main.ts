import { createStandardApp } from "@repo/core";

createStandardApp({ enableTippy: false }).then(async (bootstrap) =>
  bootstrap.mount("#app"),
);
