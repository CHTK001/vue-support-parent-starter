import type { App, Plugin } from "vue";
import ReTrend from "./ReTrend.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTrend", ReTrend);
  },
};

export { plugin as install };
export default ReTrend;
