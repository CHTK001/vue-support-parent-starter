import { createStandardApp } from "@repo/core";
import { router } from "./router";
import "./styles/app.scss";

createStandardApp({
  router,
  enableWasm: false,
  enableMotion: false,
  enableFontEncryption: false,
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[ProjectBootstrap] bootstrap-failed", error);
  });
