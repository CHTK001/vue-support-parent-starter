import { createApp } from "vue";
import { createStandardApp } from "@repo/core";
import App from "./App.vue";

createStandardApp({
  layout: "koi",
}).then((bootstrap) => bootstrap.mount("#app"));
