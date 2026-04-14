import { SpiderWorkbenchPage } from "@pages/spider";
import { createStandardApp } from "@repo/core";

createStandardApp({
  router: false,
  homeComponent: SpiderWorkbenchPage,
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[SpiderTestBootstrap] bootstrap-failed", error);
  });
