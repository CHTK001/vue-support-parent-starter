import { createStandardApp } from "@repo/core";
import { SoftCatalogPage } from "@pages/soft";

declare global {
  interface Window {
    __SOFT_SINGLE_PAGE__?: boolean;
  }
}

if (typeof window !== "undefined") {
  window.__SOFT_SINGLE_PAGE__ = true;
}

createStandardApp({
  router: false,
  homeComponent: SoftCatalogPage,
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[SoftTestBootstrap] bootstrap-failed", error);
  });
