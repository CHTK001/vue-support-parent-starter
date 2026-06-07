import { createStandardApp } from "@repo/core";
import router from "./router";
import RemoteControl from "./views/RemoteControl.vue";
import "./styles/app.scss";

createStandardApp({
  enableTech: true,
  enableTippy: false,
  router: router, // enable routing
  homeComponent: RemoteControl,
}).then((bootstrap) => bootstrap.mount("#app"));
