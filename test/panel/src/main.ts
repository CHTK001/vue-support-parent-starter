import { createStandardApp } from "@repo/core";
import PanelPage from "@pages/panel";

createStandardApp({
  router: false,
  homeComponent: PanelPage,
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[PanelTestBootstrap] bootstrap-failed", error);
  });
