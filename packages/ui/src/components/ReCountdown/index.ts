import type { App, Plugin } from "vue";
import ReCountdown from "./ReCountdown.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReCountdown", ReCountdown);
  },
};

export { plugin as install };
export default ReCountdown;
