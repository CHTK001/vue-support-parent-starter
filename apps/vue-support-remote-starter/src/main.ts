import { createStandardApp } from "@repo/core";
import RemoteControl from "./views/RemoteControl.vue";
import "./styles/app.scss";

createStandardApp({
  enableTippy: false,
  router: false,
  homeComponent: RemoteControl,
}).then((bootstrap) => bootstrap.mount("#app"));
