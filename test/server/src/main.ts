import { createStandardApp } from "@repo/core";
import ServerPage from "@pages/server";

createStandardApp({
  router: false,
  homeComponent: ServerPage,
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[ServerTestBootstrap] bootstrap-failed", error);
  });
