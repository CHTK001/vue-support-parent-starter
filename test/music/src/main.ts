import { createStandardApp } from "@repo/core";
import MusicPage from "@pages/music";

createStandardApp({
  router: false,
  homeComponent: MusicPage,
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[MusicTestBootstrap] bootstrap-failed", error);
  });
