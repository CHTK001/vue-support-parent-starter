import { createStandardApp } from "@repo/core";
import { SoftCatalogPage } from "@pages/soft";

createStandardApp({
  router: false,
  homeComponent: SoftCatalogPage,
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[SoftTestBootstrap] bootstrap-failed", error);
  });
