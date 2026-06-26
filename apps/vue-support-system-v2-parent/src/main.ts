import { createStandardApp } from "@repo/core";
import { setupRouter } from "./router";
import App from "./App.vue";
import "./styles/index.scss";

createStandardApp({
  router: false,
  homeComponent: App,
  setup(app) {
    setupRouter(app);
  },
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[SystemV2Bootstrap] bootstrap-failed", error);
  });