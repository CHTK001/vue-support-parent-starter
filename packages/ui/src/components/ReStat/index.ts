import type { App, Plugin } from "vue";
import ReStat from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReStat", ReStat);
  },
};

export { plugin as install };
export default ReStat;
